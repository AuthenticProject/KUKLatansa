/**
 * attendance_engine.js
 * Rule-based daily attendance calculation and reconciliation engine.
 */

const AttendanceEngine = (() => {
  const AUDIT_KEY = 'kuk_attendance_audit';
  const FORMS_KEY = 'kuk_public_submissions';
  const RAW_FINGERPRINTS_KEY = 'kuk_raw_fingerprints';

  // Configurable rules
  const RULES = {
    shiftStart: '08:00',
    gracePeriodMinutes: 15,
    shiftEnd: '17:00'
  };

  function getAuditLog() {
    return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
  }

  function getForms() {
    return JSON.parse(localStorage.getItem(FORMS_KEY) || '[]');
  }

  function getRawFingerprints() {
    return JSON.parse(localStorage.getItem(RAW_FINGERPRINTS_KEY) || '[]');
  }

  /**
   * Helper to check if a form covers a specific date
   */
  function formCoversDate(form, dateStr) {
    if (form.module === 'CUTI') {
      const target = new Date(dateStr);
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      return target >= start && target <= end;
    }
    if (form.module === 'ABSEN') {
      // The Absen form acts as "Morning Briefing" or "Dinas Luar"
      return form.date === dateStr;
    }
    return false;
  }

  /**
   * Calculates the raw system status for a specific employee on a specific date
   */
  function calculateSystemStatus(employee, dateStr, forms, fingerprints) {
    // 1. Check for manual overrides first
    const audits = getAuditLog().filter(a => a.employeeId === employee.id && a.date === dateStr);
    if (audits.length > 0) {
      // Return the most recent override
      const latest = audits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      return { status: latest.newStatus, isOverride: true, reason: latest.reason };
    }

    // 2. Check for submitted forms (Leave, Sick, Permission, Dinas)
    const empForms = forms.filter(f => f.employeeId === employee.id && formCoversDate(f, dateStr));
    
    let hasFormLeave = false;
    let hasFormSick = false;
    let hasFormPermission = false;
    let hasDinas = false;

    for (let f of empForms) {
      if (f.module === 'CUTI') {
        if (f.leaveType.toLowerCase().includes('sakit')) hasFormSick = true;
        else if (f.leaveType.toLowerCase().includes('izin')) hasFormPermission = true;
        else hasFormLeave = true;
      }
      if (f.module === 'ABSEN' && f.location && f.location.toLowerCase().includes('luar kota')) {
        hasDinas = true;
      }
    }

    if (hasFormSick) return { status: 'SICK', isOverride: false };
    if (hasFormLeave) return { status: 'LEAVE', isOverride: false };
    if (hasFormPermission) return { status: 'PERMISSION', isOverride: false };
    if (hasDinas) return { status: 'EXCUSED', isOverride: false, note: 'Dinas Luar' };

    // 3. Check Fingerprints
    const empScans = fingerprints.filter(fp => fp.employeeId === employee.id && fp.date === dateStr);
    
    if (empScans.length === 0) {
      // Check if it's Sunday (assuming OFF)
      const dayOfWeek = new Date(dateStr).getDay();
      if (dayOfWeek === 0) return { status: 'OFF', isOverride: false };
      
      return { status: 'ABSENT', isOverride: false };
    }

    if (empScans.length === 1) {
      return { status: 'INCOMPLETE', isOverride: false, inTime: empScans[0].time };
    }

    // Determine LATE or PRESENT based on first scan
    // Sort scans by time
    empScans.sort((a, b) => a.time.localeCompare(b.time));
    const firstScan = empScans[0];
    const lastScan = empScans[empScans.length - 1];

    // Check lateness
    const scanDate = new Date(`2000-01-01T${firstScan.time}`);
    const thresholdDate = new Date(`2000-01-01T${RULES.shiftStart}`);
    thresholdDate.setMinutes(thresholdDate.getMinutes() + RULES.gracePeriodMinutes);

    let finalStatus = 'PRESENT';
    if (scanDate > thresholdDate) {
      finalStatus = 'LATE';
    }

    return { 
      status: finalStatus, 
      isOverride: false, 
      inTime: firstScan.time,
      outTime: lastScan.time
    };
  }

  /**
   * Get attendance for all active employees for a given date
   */
  function getDailyAttendance(dateStr) {
    const employees = typeof MasterDB !== 'undefined' ? MasterDB.getEmployees().filter(e => e.status === 'Active') : [];
    const forms = getForms();
    const fingerprints = getRawFingerprints();

    return employees.map(emp => {
      const calc = calculateSystemStatus(emp, dateStr, forms, fingerprints);
      return {
        employeeId: emp.id,
        employeeName: emp.fullName,
        unit: emp.unit,
        ...calc
      };
    });
  }

  /**
   * Manual override API
   */
  function adjustStatus(employeeId, dateStr, newStatus, reason, adminName) {
    if (!reason || reason.trim() === '') throw new Error("Alasan wajib diisi untuk audit.");
    
    const audits = getAuditLog();
    audits.push({
      employeeId,
      date: dateStr,
      newStatus,
      reason,
      adminName,
      timestamp: new Date().toISOString()
    });
    
    localStorage.setItem(AUDIT_KEY, JSON.stringify(audits));
  }

  return {
    RULES,
    getDailyAttendance,
    adjustStatus,
    getAuditLog
  };
})();
