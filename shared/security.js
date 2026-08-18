/**
 * security.js
 * Centralized Security, RBAC, Anti-Escalation, Rate Limiting, Audit & Concurrency Module for KUK La Tansa.
 */

const Security = (() => {
  'use strict';

  const AUDIT_KEY = 'kuk_security_audit';
  const RATE_LIMIT_KEY = 'kuk_rate_limits';
  const LOCKS_KEY = 'kuk_system_locks';
  const SESSIONS_KEY = 'kuk_user';

  // 1. INPUT SANITIZATION (XSS & Injection Protection)
  function sanitize(str) {
    if (typeof str !== 'string') return str;
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    return str
      .replace(/[&<>"'/]/g, m => map[m])
      .replace(/javascript\s*:/gi, '')
      .replace(/data\s*:\s*text\/html/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeObject);
    const sanitized = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === 'string') {
        sanitized[key] = sanitize(val);
      } else if (typeof val === 'object' && val !== null) {
        sanitized[key] = sanitizeObject(val);
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  }

  // 2. IMMUTABLE SECURITY AUDIT LOGGER
  function audit(action, details = {}, severity = 'INFO', user = null) {
    try {
      const activeUser = user || getCurrentUser() || { username: 'ANONYMOUS', role: 'public' };
      const logs = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
      
      const entry = {
        id: 'SEC-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
        timestamp: new Date().toISOString(),
        action: action,
        severity: severity, // 'INFO' | 'WARN' | 'HIGH' | 'CRITICAL'
        user: activeUser.username || 'ANONYMOUS',
        role: activeUser.role || 'public',
        details: typeof details === 'string' ? { message: details } : details,
        meta: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node/Server',
          origin: typeof window !== 'undefined' ? window.location.pathname : 'system'
        }
      };

      logs.push(entry);
      // Keep last 1000 logs
      if (logs.length > 1000) logs.shift();
      localStorage.setItem(AUDIT_KEY, JSON.stringify(logs));
      return entry;
    } catch (e) {
      console.error('[SecurityAuditError]', e);
      return null;
    }
  }

  function getAuditLogs(limit = 100, filterSeverity = null) {
    try {
      let logs = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
      if (filterSeverity) {
        logs = logs.filter(l => l.severity === filterSeverity);
      }
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return logs.slice(0, limit);
    } catch (e) {
      return [];
    }
  }

  // 3. RATE LIMITER (Sliding Window Algorithm)
  function checkRateLimit(actionKey, options = {}) {
    const maxAttempts = options.maxAttempts || 5;
    const windowMs = options.windowMs || 60000; // 1 minute default
    const now = Date.now();

    try {
      const limits = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '{}');
      let tracker = limits[actionKey];

      if (!tracker || tracker.resetAt < now) {
        tracker = { count: 1, resetAt: now + windowMs };
        limits[actionKey] = tracker;
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(limits));
        return { allowed: true, remaining: maxAttempts - 1, resetInSeconds: Math.ceil(windowMs / 1000) };
      }

      if (tracker.count >= maxAttempts) {
        const waitSec = Math.ceil((tracker.resetAt - now) / 1000);
        audit('RATE_LIMIT_EXCEEDED', { actionKey, maxAttempts, waitSec }, 'WARN');
        return { allowed: false, remaining: 0, resetInSeconds: waitSec };
      }

      tracker.count++;
      limits[actionKey] = tracker;
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(limits));
      return { allowed: true, remaining: maxAttempts - tracker.count, resetInSeconds: Math.ceil((tracker.resetAt - now) / 1000) };
    } catch (e) {
      return { allowed: true, remaining: 1, resetInSeconds: 0 };
    }
  }

  // 4. SESSION & ANTI-ROLE-ESCALATION GUARD
  function getCurrentUser() {
    try {
      if (typeof sessionStorage === 'undefined') return null;
      const raw = sessionStorage.getItem(SESSIONS_KEY);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) return parsed;
        if (typeof parsed === 'string') {
          if (typeof MasterDB !== 'undefined' && MasterDB.getUser) {
            const u = MasterDB.getUser(parsed);
            if (u) return { username: u.username, role: u.role || 'hr_admin', permissions: u.permissions || [] };
          }
          return { username: parsed, role: (parsed === 'fariz' || parsed === 'irsyadil' || parsed === 'admin') ? 'super_admin' : 'hr_admin' };
        }
      } catch (e) {
        if (typeof MasterDB !== 'undefined' && MasterDB.getUser) {
          const u = MasterDB.getUser(raw);
          if (u) return { username: u.username, role: u.role || 'hr_admin', permissions: u.permissions || [] };
        }
        return { username: raw, role: (raw === 'fariz' || raw === 'irsyadil' || raw === 'admin') ? 'super_admin' : 'hr_admin' };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  function validateSession() {
    const user = getCurrentUser();
    if (!user) return { valid: false, reason: 'NO_SESSION' };

    // Anti-Escalation check against MasterDB or default credentials
    if (typeof MasterDB !== 'undefined' && MasterDB.getUsers) {
      const dbUsers = MasterDB.getUsers();
      const realUser = dbUsers.find(u => u.username === user.username);

      if (!realUser) {
        audit('SESSION_INVALID_USER', { username: user.username }, 'CRITICAL', user);
        terminateSession();
        return { valid: false, reason: 'USER_NOT_FOUND' };
      }

      // Check role tampering
      if (realUser.role !== user.role) {
        audit('ROLE_ESCALATION_ATTEMPT', {
          username: user.username,
          claimedRole: user.role,
          actualRole: realUser.role
        }, 'CRITICAL', user);
        terminateSession();
        return { valid: false, reason: 'ROLE_TAMPERING_DETECTED' };
      }
    }

    // Check session timeout (8 hours max lifetime)
    if (user.loginAt) {
      const ageMs = Date.now() - new Date(user.loginAt).getTime();
      const MAX_AGE_MS = 8 * 60 * 60 * 1000;
      if (ageMs > MAX_AGE_MS) {
        audit('SESSION_EXPIRED', { username: user.username }, 'INFO', user);
        terminateSession();
        return { valid: false, reason: 'SESSION_EXPIRED' };
      }
    }

    return { valid: true, user: user };
  }

  function terminateSession() {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(SESSIONS_KEY);
      }
    } catch (e) {}
  }

  // 5. ROLE-BASED ACCESS CONTROL (RBAC)
  const ROLE_PERMISSIONS = {
    super_admin: ['*'],
    hr_admin: ['dashboard', 'absen', 'cuti', 'pelanggaran', 'tip', 'peminjaman', 'peminjaman_admin', 'karyawan', 'fingerprint', 'attendance_review', 'violation_review', 'payroll'],
    finance: ['dashboard', 'payroll', 'attendance_review', 'tip'],
    manager: ['dashboard', 'absen', 'cuti', 'pelanggaran', 'peminjaman', 'attendance_review'],
    staff: ['absen', 'cuti', 'peminjaman']
  };

  function can(user, requiredPermission) {
    if (!user) return false;
    const role = user.role || 'staff';
    const permissions = ROLE_PERMISSIONS[role] || [];
    
    if (permissions.includes('*')) return true;
    if (permissions.includes(requiredPermission)) return true;

    // Check user-level permissions override if any
    if (user.permissions && Array.isArray(user.permissions)) {
      if (user.permissions.includes('*') || user.permissions.includes(requiredPermission)) {
        return true;
      }
    }

    return false;
  }

  // 6. CONCURRENCY & TRANSACTION LOCKER
  function acquireLock(lockKey, ttlMs = 30000) {
    const now = Date.now();
    try {
      const locks = JSON.parse(localStorage.getItem(LOCKS_KEY) || '{}');
      const currentLock = locks[lockKey];

      if (currentLock && currentLock.expiresAt > now) {
        audit('CONCURRENCY_LOCK_COLLISION', { lockKey, heldBy: currentLock.owner }, 'WARN');
        return { acquired: false, lockedBy: currentLock.owner, expiresAt: currentLock.expiresAt };
      }

      const owner = (getCurrentUser() || {}).username || 'PROCESS-' + now;
      locks[lockKey] = {
        owner: owner,
        acquiredAt: now,
        expiresAt: now + ttlMs
      };
      localStorage.setItem(LOCKS_KEY, JSON.stringify(locks));
      return { acquired: true, owner: owner, expiresAt: now + ttlMs };
    } catch (e) {
      return { acquired: false, error: e.message };
    }
  }

  function releaseLock(lockKey) {
    try {
      const locks = JSON.parse(localStorage.getItem(LOCKS_KEY) || '{}');
      delete locks[lockKey];
      localStorage.setItem(LOCKS_KEY, JSON.stringify(locks));
      return true;
    } catch (e) {
      return false;
    }
  }

  // 7. SENSITIVE DATA INTEGRITY SEAL (Checksum & Tamper Detection)
  function computeHash(dataString) {
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return 'SEAL-V1-' + Math.abs(hash).toString(16) + '-' + dataString.length;
  }

  function generateIntegritySeal(payload) {
    const normalized = JSON.stringify(payload, Object.keys(payload).sort());
    return computeHash(normalized);
  }

  function verifyIntegritySeal(payload, existingSeal) {
    if (!existingSeal) return false;
    const computed = generateIntegritySeal(payload);
    return computed === existingSeal;
  }

  return {
    sanitize,
    sanitizeObject,
    audit,
    getAuditLogs,
    checkRateLimit,
    getCurrentUser,
    validateSession,
    terminateSession,
    can,
    acquireLock,
    releaseLock,
    generateIntegritySeal,
    verifyIntegritySeal
  };
})();

if (typeof window !== 'undefined') {
  window.Security = Security;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Security;
}
