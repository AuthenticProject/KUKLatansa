/**
 * KUK La Tansa — Shell Module v1.0
 * ─────────────────────────────────────────────────────────────────────────
 * Provides: Auth guard · Sidebar · Topbar · Command palette · Notifications
 *           Unit switcher · User menu · Mobile nav · Keyboard shortcuts
 *
 * Usage (root-level pages):
 *   <script src="shared/shell.js" data-base="."></script>
 *
 * Usage (subdirectory pages, e.g. dashboard/):
 *   <script src="../shared/shell.js" data-base=".."></script>
 *
 * Visual authority: docs/UI_UX_BRAND_GUIDELINE.md
 * Primary: #540000 maroon  |  Gold accent: #FFCC00 (sparingly)
 */

(function KUKShell() {
  'use strict';

  /* ── Isolated pages: no shell, no auth required ──────────────────── */
  // Pages listed here are stand-alone (public access).
  // The shell sidebar/topbar is NOT injected, and auth is NOT checked.
  // Dashboard data (KPIs, rekap) still reads from MasterDB independently.
  const SHELL_ISOLATED_PAGES = ['karyawan', 'peminjaman', 'tip', 'cuti'];

  /* ── Storage keys ─────────────────────────────────────────────────── */
  const KEY_USER     = 'kuk_user';
  const KEY_USERS_DB = 'kuk_master_users';
  const KEY_UNIT     = 'kuk_selected_unit';

  /* ── Default users (fallback when localStorage not yet populated) ─── */
  const DEFAULT_USERS = [
    // KUK Bangunan Staff
    { username: 'fariz',    password: '12345', role: 'super_admin', permissions: ['*'] },
    { username: 'andika',   password: '12345', role: 'hr_admin',    permissions: ['dashboard','absen','cuti','pelanggaran','tip','peminjaman','peminjaman_admin','karyawan','users','fingerprint','attendance_review','violation_review','payroll'] },
    { username: 'irsyadil', password: '150904', role: 'super_admin', permissions: ['*'] },
    { username: 'ari',      password: '12345', role: 'hr_admin',    permissions: ['dashboard','absen','cuti','pelanggaran','tip','peminjaman','peminjaman_admin','karyawan','fingerprint','attendance_review','violation_review','payroll'] },
    { username: 'shuva',    password: '12345', role: 'hr_admin',    permissions: ['dashboard','absen','cuti','pelanggaran','tip','peminjaman','peminjaman_admin','karyawan','fingerprint','attendance_review','violation_review','payroll'] },
    { username: 'aria',     password: '12345', role: 'hr_admin',    permissions: ['dashboard','absen','cuti','pelanggaran','tip','peminjaman','peminjaman_admin','karyawan','fingerprint','attendance_review','violation_review','payroll'] },
    { username: 'zain',     password: '12345', role: 'hr_admin',    permissions: ['dashboard','absen','cuti','pelanggaran','tip','peminjaman','peminjaman_admin','karyawan','fingerprint','attendance_review','violation_review','payroll'] },
    // KUK Palen Staff
    { username: 'Raju',     password: '54321', role: 'manager',     permissions: ['dashboard','absen','pelanggaran','karyawan'] },
    { username: 'Agheea',   password: '54321', role: 'hr_admin',    permissions: ['dashboard','absen','pelanggaran'] },
    { username: 'Basith',   password: '54321', role: 'hr_admin',    permissions: ['dashboard','absen','pelanggaran'] },
    { username: 'Anshory',  password: '54321', role: 'hr_admin',    permissions: ['dashboard','absen','pelanggaran'] },
    { username: 'Lintang',  password: '54321', role: 'hr_admin',    permissions: ['dashboard','absen','pelanggaran'] }
  ];

  const ROLE_LABELS = {
    super_admin: 'Super Administrator',
    hr_admin:    'HR / Administrasi',
    finance:     'Keuangan / Payroll',
    manager:     'Manager',
    staff:       'Staf'
  };

  /* ── Detect base URL from script data-base attribute ─────────────── */
  const _script = (function() {
    // document.currentScript works for sync; for defer we fallback
    if (document.currentScript) return document.currentScript;
    const scripts = document.querySelectorAll('script[src*="shell.js"]');
    return scripts[scripts.length - 1] || null;
  })();

  const _RAW_BASE = _script ? (_script.getAttribute('data-base') || '.') : '.';

  function _base(path) {
    const b = _RAW_BASE.replace(/\/$/, '');
    const p = (path || '').replace(/^\//, '');
    if (!p) return b + '/';
    return b ? b + '/' + p : p;
  }

  /* ── SVG Icon Library ─────────────────────────────────────────────── */
  const ICON = {
    dashboard:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
    absen:        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    cuti:         `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    pelanggaran:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    tip:          `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`,
    peminjaman:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`,
    karyawan:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    peminjaman_admin: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    users:        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></svg>`,
    search:       `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
    fingerprint:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12zm10 6c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/><path d="M12 8v4l3 3"/></svg>`,
    attendance_review: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/><circle cx="16" cy="16" r="6" fill="#fff"/><path d="M16 13v3l2 2"/></svg>`,
    violation_review: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    payroll:      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    bell:         `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    chevron:      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
    menu:         `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
    logout:       `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    lock:         `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    close:        `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  };

  /* ── Navigation definitions ───────────────────────────────────────── */
  const NAV_DEFS = [
    { id: 'dashboard',        label: 'Dashboard',           section: '',           href: 'dashboard/', perm: 'dashboard',        icon: ICON.dashboard },
    { id: 'attendance_review',label: 'Review Kehadiran',    section: 'Operasional',href: 'attendance_review.html', perm: 'attendance_review', icon: ICON.attendance_review },
    { id: 'violation_review', label: 'Review Pelanggaran',  section: 'Operasional',href: 'violation_review.html', perm: 'violation_review', icon: ICON.violation_review },
    { id: 'absen',            label: 'Absen Briefing',      section: 'Operasional',href: 'absen.html', perm: 'absen',            icon: ICON.absen },
    { id: 'fingerprint',      label: 'Import Fingerprint',  section: 'Operasional',href: 'fingerprint_import.html', perm: 'fingerprint', icon: ICON.fingerprint },
    { id: 'rekap_cuti',       label: 'Rekapan Cuti',        section: 'Operasional',href: 'rekap_cuti.html', perm: 'cuti',        icon: ICON.cuti },
    { id: 'pelanggaran',      label: 'Pelanggaran',         section: 'Operasional',href: 'pelanggaran.html', perm: 'pelanggaran', icon: ICON.pelanggaran },
    // 'tip', 'peminjaman' & 'karyawan' diakses langsung oleh user ybs via card karyawan / portal landing.
    { id: 'payroll',          label: 'Manajemen Payroll',   section: 'Keuangan',   href: 'payroll_dashboard.html', perm: 'payroll', icon: ICON.payroll },
    { id: 'peminjaman_admin', label: 'Admin Armada',        section: 'Database',   href: 'peminjaman_admin.html', perm: 'peminjaman_admin', icon: ICON.peminjaman_admin },
    { id: 'users',            label: 'Manajemen Pengguna',  section: 'Sistem',     href: 'users.html', perm: 'users',            icon: ICON.users },
    { id: 'hrd',              label: 'HRD',                 section: 'Sistem',     href: 'hrd.html',   perm: 'hrd',              icon: ICON.karyawan },
  ];

  const PAGE_TITLES = {
    dashboard:        'Dashboard',
    absen:            'Absen Briefing Pagi',
    rekap_cuti:       'Rekapan Cuti Karyawan',
    cuti:             'Pengajuan Cuti Mandiri',
    pelanggaran:      'Catat Pelanggaran',
    tip:              'Tip Pemotongan Kaca',
    peminjaman:       'Peminjaman Kendaraan',
    peminjaman_admin: 'Administrasi Armada',
    karyawan:         'Manajemen Karyawan',
    users:            'Manajemen Pengguna',
    hrd:              'HRD — Database Karyawan',
  };

  /* ── Auth helpers ─────────────────────────────────────────────────── */
  function getUsername() {
    const raw = sessionStorage.getItem(KEY_USER);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null && parsed.username) {
        return parsed.username;
      }
    } catch(e) {}
    return raw;
  }

  function getUsersDB() {
    if (typeof MasterDB !== 'undefined' && MasterDB.getUsers) {
      return MasterDB.getUsers();
    }
    try {
      const s = localStorage.getItem(KEY_USERS_DB);
      if (s) { const db = JSON.parse(s); if (Array.isArray(db) && db.length) return db; }
    } catch(e) {}
    return DEFAULT_USERS;
  }

  function getUserRecord(username) {
    if (!username) return null;
    if (typeof MasterDB !== 'undefined' && MasterDB.getUser) {
      const u = MasterDB.getUser(username);
      if (u) return u;
    }
    return getUsersDB().find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  }

  function checkAuth() {
    if (typeof Security !== 'undefined' && Security.validateSession) {
      const sessionResult = Security.validateSession();
      if (!sessionResult.valid) {
        if (sessionResult.reason === 'ROLE_TAMPERING_DETECTED') {
          alert("⚠️ Pelanggaran Keamanan: Terdeteksi manipulasi hak akses (Role Escalation). Sesi Anda telah dibatalkan.");
        }
        window.location.replace(_base('index.html'));
        return false;
      }
    } else {
      if (!getUsername()) {
        window.location.replace(_base('index.html'));
        return false;
      }
    }

    // Check RBAC permission for current page
    const activePage = getActivePage();
    if (activePage && activePage !== 'dashboard') {
      const username = getUsername();
      const user = getUserRecord(username);
      if (typeof Security !== 'undefined' && Security.can) {
        if (!Security.can(user, activePage)) {
          Security.audit('PAGE_ACCESS_DENIED_RBAC', { username: user ? user.username : 'Unknown', page: activePage }, 'WARN', user);
          alert("⛔ Akses Ditolak: Akun Anda tidak memiliki izin untuk mengakses halaman ini.");
          window.location.replace(_base('dashboard/'));
          return false;
        }
      }
    }

    return true;
  }

  /* ── Unit helpers ─────────────────────────────────────────────────── */
  function getUnit() { return localStorage.getItem(KEY_UNIT) || 'semua'; }

  /* ── Page detection ───────────────────────────────────────────────── */
  function getActivePage() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('peminjaman_admin')) return 'peminjaman_admin';
    if (path.includes('peminjaman'))       return 'peminjaman';
    if (path.includes('dashboard'))        return 'dashboard';
    if (path.includes('attendance_review')) return 'attendance_review';
    if (path.includes('violation_review'))  return 'violation_review';
    if (path.includes('fingerprint'))       return 'fingerprint';
    if (path.includes('payroll'))           return 'payroll';
    if (path.includes('absen'))            return 'absen';
    if (path.includes('rekap_cuti'))       return 'rekap_cuti';
    if (path.includes('cuti'))             return 'cuti';
    if (path.includes('pelanggaran'))      return 'pelanggaran';
    if (path.includes('tip'))              return 'tip';
    if (path.includes('karyawan'))         return 'karyawan';
    if (path.includes('users'))            return 'users';
    if (path.includes('hrd'))              return 'hrd';
    return '';
  }

  /* ── Visible nav items (filtered by permissions & unit features) ─── */
  function getVisibleNav() {
    const username = getUsername();
    const user = getUserRecord(username);
    return NAV_DEFS.filter(item => {
      // Tip Kaca (Potong Kaca 3%) is strictly for KUK Bangunan
      if (item.id === 'tip') {
        const currentUnit = getUnit();
        if (currentUnit === 'palen') return false;
        if (user && user.toko === 'palen' && user.role !== 'super_admin') return false;
      }

      if (typeof Security !== 'undefined' && Security.can) {
        return Security.can(user, item.perm);
      }
      const perms = user ? (user.permissions || []) : [];
      return perms.includes(item.perm) || perms.includes('*');
    });
  }

  /* ── Notifications ────────────────────────────────────────────────── */
  function collectNotifications() {
    const notes = [];
    const today = new Date(); today.setHours(0,0,0,0);

    // H-1 / H-0 rekontrak from KaryawanDB
    try {
      const db = window.KaryawanDB;
      const list = db && (db.getRekontrakList || db.getAll) ?
        (db.getRekontrakList ? db.getRekontrakList() : db.getAll()) : [];
      list.forEach(function(k) {
        const tgl = k.tglSelesaiKontrak || k.kontrakSelesai || '';
        if (!tgl) return;
        const end = new Date(tgl); end.setHours(0,0,0,0);
        const diff = Math.round((end - today) / 86400000);
        if (diff === 0) notes.push({ type: 'danger',  icon: '🚨', msg: 'Kontrak ' + k.namaLengkap + ' berakhir HARI INI!' });
        else if (diff === 1) notes.push({ type: 'warning', icon: '🔔', msg: 'Kontrak ' + k.namaLengkap + ' berakhir besok (H-1)' });
        else if (diff > 0 && diff <= 7) notes.push({ type: 'info', icon: 'ℹ️', msg: 'Kontrak ' + k.namaLengkap + ' berakhir dalam ' + diff + ' hari' });
      });
    } catch(e) {}

    // Overdue vehicle loans
    try {
      const svc = window.PeminjamanService || window.PeminjamanDB;
      if (svc) {
        const loans = svc.getPeminjamanList ? svc.getPeminjamanList() : (svc.getAll ? svc.getAll() : []);
        const now = Date.now();
        loans.forEach(function(loan) {
          if (loan.status === 'Sedang Dipinjam' && loan.rencanaPengembalian) {
            const due = new Date(loan.rencanaPengembalian).getTime();
            if (now > due) {
              notes.push({ type: 'warning', icon: '🚘', msg: 'Kendaraan ' + (loan.kendaraanNama || loan.kendaraanId || '-') + ' terlambat dikembalikan' });
            }
          }
        });
      }
    } catch(e) {}

    return notes;
  }

  function getAvatarHTML(username) {
    if (!username) return 'U';
    const cleanUsername = username.toLowerCase();
    
    // 1. Direct photo in sessionStorage
    try {
      const sessRaw = sessionStorage.getItem('kuk_user');
      if (sessRaw) {
        const sess = JSON.parse(sessRaw);
        if (sess && sess.foto && (sess.username||'').toLowerCase() === cleanUsername) {
          return '<img src="' + sess.foto + '" alt="' + username + '" style="width:100%; height:100%; object-fit:cover; border-radius:inherit; display:block;">';
        }
      }
    } catch(e) {}

    // 2. Direct photo key in localStorage
    try {
      const directKey = localStorage.getItem('kuk_user_photo_' + cleanUsername);
      if (directKey) {
        return '<img src="' + directKey + '" alt="' + username + '" style="width:100%; height:100%; object-fit:cover; border-radius:inherit; display:block;">';
      }
    } catch(e) {}

    // 3. User record in MasterDB / UsersDB
    const user = getUserRecord(username);
    if (user && user.foto) {
      return '<img src="' + user.foto + '" alt="' + username + '" style="width:100%; height:100%; object-fit:cover; border-radius:inherit; display:block;">';
    }

    const initial = username ? username[0].toUpperCase() : 'U';
    return initial;
  }

  /* ── Build sidebar HTML ───────────────────────────────────────────── */
  function buildSidebar(username, userRecord, navItems) {
    const activePage = getActivePage();
    const user = userRecord || getUserRecord(username);
    const role  = user ? (user.role || 'staff') : 'staff';
    const label = ROLE_LABELS[role] || 'Staf';
    const avatarHtml = getAvatarHTML(username);

    const items = navItems || getVisibleNav();
    var sections = {};
    var noSection = [];

    items.forEach(function(item) {
      if (!item.section) { noSection.push(item); }
      else { if (!sections[item.section]) sections[item.section] = []; sections[item.section].push(item); }
    });

    var navHTML = '';
    noSection.forEach(function(item) { navHTML += buildNavItem(item, activePage); });
    Object.keys(sections).forEach(function(sec) {
      navHTML += '<div class="kuk-nav-section-label">' + sec + '</div>';
      sections[sec].forEach(function(item) { navHTML += buildNavItem(item, activePage); });
    });

    return [
      '<aside class="kuk-sidebar" id="kukSidebar">',
      '  <div class="kuk-sidebar-brand">',
      '    <div class="kuk-sidebar-logo-mark"><span>KUK</span></div>',
      '    <div class="kuk-sidebar-brand-text">',
      '      <span class="kuk-brand-name">KUK La Tansa</span>',
      '      <span class="kuk-brand-sub">Internal System</span>',
      '    </div>',
      '    <button class="kuk-sidebar-close-btn" onclick="kukToggleSidebar()" title="Tutup Navigasi">&times;</button>',
      '  </div>',
      '  <nav class="kuk-sidebar-nav" id="kukSidebarNav">' + navHTML + '</nav>',
      '  <div class="kuk-sidebar-footer">',
      '    <div class="kuk-sidebar-user">',
      '      <div class="kuk-sidebar-avatar">' + avatarHtml + '</div>',
      '      <div class="kuk-sidebar-user-info">',
      '        <span class="kuk-sidebar-user-name">' + (username || 'Pengguna') + '</span>',
      '        <span class="kuk-sidebar-user-role">' + label + '</span>',
      '      </div>',
      '    </div>',
      '    <button class="kuk-sidebar-logout-btn" onclick="kukLogout()" title="Keluar">',
      '      ' + ICON.logout + '<span>Keluar</span>',
      '    </button>',
      '  </div>',
      '</aside>',
      '<div class="kuk-sidebar-backdrop" id="kukSidebarBackdrop" onclick="kukCloseMobileSidebar()"></div>'
    ].join('\n');
  }

  function buildNavItem(item, activePage) {
    var isActive = item.id === activePage;
    var href = _base(item.href);
    return [
      '<a href="' + href + '" class="kuk-nav-item' + (isActive ? ' active' : '') + '" data-page="' + item.id + '">',
      '  <span class="kuk-nav-icon">' + item.icon + '</span>',
      '  <span class="kuk-nav-label">' + item.label + '</span>',
      '</a>'
    ].join('');
  }

  /* ── Build floating navbar toggle button (Click to Push/Open) ─────── */
  function buildFloatingToggle() {
    return [
      '<button class="kuk-floating-toggle" id="kukFloatingToggle" onclick="kukToggleSidebar()" title="Buka / Tutup Menu Navigasi" aria-label="Toggle Menu Navigasi">',
      '  ' + ICON.menu,
      '  <span class="kuk-toggle-text">Menu</span>',
      '</button>'
    ].join('');
  }

  /* ── Build topbar HTML (Push Layout alongside Sidebar) ─────────────── */
  function buildTopbar(username) {
    var unit = getUnit();
    var activePage = getActivePage();
    var pageTitle = PAGE_TITLES[activePage] || 'KUK La Tansa';
    var avatarHtml = getAvatarHTML(username);

    return [
      '<header class="kuk-topbar" id="kukTopbar">',
      '  <div class="kuk-topbar-left">',
      '    <button class="kuk-hamburger" id="kukHamburger" onclick="kukToggleSidebar()" aria-label="Toggle Sidebar">' + ICON.menu + '</button>',
      '    <h1 class="kuk-page-title" id="kukPageTitle">' + pageTitle + '</h1>',
      '  </div>',
      '  <div class="kuk-topbar-right">',
      // Unit switcher
      '    <div class="kuk-unit-switcher" id="kukUnitSwitcher">',
      '      <button class="kuk-unit-btn' + (unit==='semua'?' active':'') + '" onclick="kukSetUnit(\'semua\')">Semua</button>',
      '      <button class="kuk-unit-btn' + (unit==='bangunan'?' active':'') + '" onclick="kukSetUnit(\'bangunan\')">Bangunan</button>',
      '      <button class="kuk-unit-btn' + (unit==='palen'?' active':'') + '" onclick="kukSetUnit(\'palen\')">Palen</button>',
      '    </div>',
      // Search
      '    <button class="kuk-topbar-icon-btn" onclick="kukOpenPalette()" title="Cari cepat (Ctrl+K)" aria-label="Cari">' + ICON.search + '</button>',
      // Notifications
      '    <div class="kuk-notif-wrapper" id="kukNotifWrapper">',
      '      <button class="kuk-topbar-icon-btn" id="kukNotifBtn" onclick="kukToggleNotifications()" aria-label="Notifikasi">',
      '        ' + ICON.bell,
      '        <span class="kuk-notif-badge" id="kukNotifBadge" style="display:none">0</span>',
      '      </button>',
      '      <div class="kuk-notif-panel" id="kukNotifPanel" style="display:none">',
      '        <div class="kuk-notif-panel-header"><span>Notifikasi</span><button class="kuk-notif-close" onclick="kukCloseNotifications()">' + ICON.close + '</button></div>',
      '        <div class="kuk-notif-list" id="kukNotifList"><div class="kuk-notif-empty">Memuat notifikasi...</div></div>',
      '        <div class="kuk-notif-panel-footer"><button onclick="kukClearNotifications()">Tandai semua dibaca</button></div>',
      '      </div>',
      '    </div>',
      // User menu
      '    <div class="kuk-user-menu-wrapper" id="kukUserMenuWrapper">',
      '      <button class="kuk-user-menu-btn" id="kukUserMenuBtn" onclick="kukToggleUserMenu()" aria-label="Menu pengguna">',
      '        <div class="kuk-topbar-avatar">' + avatarHtml + '</div>',
      '      </button>',
      '      <div class="kuk-user-menu-panel" id="kukUserMenuPanel" style="display:none">',
      '        <div class="kuk-user-menu-header">',
      '          <div class="kuk-user-menu-avatar">' + avatarHtml + '</div>',
      '          <div><div class="kuk-user-menu-name">' + (username || 'Pengguna') + '</div><div class="kuk-user-menu-role">KUK La Tansa</div></div>',
      '        </div>',
      '        <div class="kuk-user-menu-divider"></div>',
      '        <button class="kuk-user-menu-item" onclick="kukUploadPhoto()"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg> Upload Foto Profil</button>',
      '        <button class="kuk-user-menu-item" onclick="kukChangePassword()">' + ICON.lock + ' Ubah Password</button>',
      '        <div class="kuk-user-menu-divider"></div>',
      '        <button class="kuk-user-menu-item danger" onclick="kukLogout()">' + ICON.logout + ' Keluar</button>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</header>'
    ].join('\n');
  }

  /* ── Build command palette HTML ───────────────────────────────────── */
  function buildPalette() {
    return [
      '<div class="kuk-palette-overlay" id="kukPaletteOverlay" style="display:none" onclick="if(event.target===this)kukClosePalette()">',
      '  <div class="kuk-palette" id="kukPalette" role="dialog" aria-label="Pencarian cepat">',
      '    <div class="kuk-palette-search">',
      '      <span class="kuk-palette-search-icon">' + ICON.search + '</span>',
      '      <input type="text" id="kukPaletteInput" placeholder="Cari menu, karyawan, armada..." autocomplete="off" oninput="kukPaletteSearch(this.value)">',
      '      <kbd class="kuk-palette-esc">ESC</kbd>',
      '    </div>',
      '    <div class="kuk-palette-results" id="kukPaletteResults"></div>',
      '    <div class="kuk-palette-footer">',
      '      <span><kbd>↑↓</kbd> Navigasi</span>',
      '      <span><kbd>↵</kbd> Buka</span>',
      '      <span><kbd>Esc</kbd> Tutup</span>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');
  }

  /* ── Build mobile nav ─────────────────────────────────────────────── */
  function buildMobileNav(navItems) {
    var activePage = getActivePage();
    var top5 = navItems.slice(0, 5);
    var html = '<nav class="kuk-mobile-nav" id="kukMobileNav">';
    top5.forEach(function(item) {
      var isActive = item.id === activePage;
      var lbl = item.label.length > 9 ? item.label.substring(0, 8) + '…' : item.label;
      html += '<a href="' + _base(item.href) + '" class="kuk-mobile-nav-item' + (isActive ? ' active' : '') + '" title="' + item.label + '">';
      html += item.icon + '<span>' + lbl + '</span></a>';
    });
    html += '</nav>';
    return html;
  }

  /* ── Command palette search logic ────────────────────────────────── */
  var _paletteIdx = -1;
  var _paletteItems = [];

  function _buildPaletteActions() {
    var actions = [];

    // Nav items
    var navItems = getVisibleNav();
    navItems.forEach(function(item) {
      actions.push({ title: item.label, cat: item.section || 'Menu Utama', icon: item.icon, href: _base(item.href) });
    });

    // Employees from KaryawanDB
    try {
      var db = window.KaryawanDB;
      var list = db && db.getRekontrakList ? db.getRekontrakList() : (db && db.getAll ? db.getAll() : []);
      list.forEach(function(k) {
        actions.push({
          title: k.namaLengkap || '-',
          cat: 'Karyawan',
          icon: ICON.karyawan,
          href: _base('karyawan.html'),
          sub: (k.jabatan || '') + (k.toko ? ' · ' + k.toko : '')
        });
      });
    } catch(e) {}

    // Vehicles from PeminjamanDB
    try {
      var svc = window.PeminjamanService || window.PeminjamanDB;
      if (svc) {
        var kList = svc.getKendaraanList ? svc.getKendaraanList() : [];
        kList.forEach(function(k) {
          actions.push({
            title: (k.nama || k.id || '-') + (k.plat ? ' (' + k.plat + ')' : ''),
            cat: 'Armada',
            icon: ICON.peminjaman,
            href: _base('peminjaman_admin.html'),
            sub: k.status || 'Tersedia'
          });
        });
      }
    } catch(e) {}

    return actions;
  }

  function kukPaletteSearch(query) {
    var q = (query || '').toLowerCase().trim();
    var all = _buildPaletteActions();
    _paletteItems = q
      ? all.filter(function(a) {
          return (a.title || '').toLowerCase().includes(q) ||
                 (a.cat || '').toLowerCase().includes(q) ||
                 (a.sub || '').toLowerCase().includes(q);
        })
      : all;
    _paletteIdx = -1;
    _renderPaletteResults(_paletteItems);
  }

  function _renderPaletteResults(items) {
    var el = document.getElementById('kukPaletteResults');
    if (!el) return;
    if (!items.length) {
      el.innerHTML = '<div class="kuk-palette-empty">Tidak ada hasil ditemukan.</div>';
      return;
    }
    // Group by category
    var cats = {};
    items.forEach(function(item) {
      var c = item.cat || 'Lainnya';
      if (!cats[c]) cats[c] = [];
      cats[c].push(item);
    });
    var html = '';
    Object.keys(cats).forEach(function(cat) {
      html += '<div class="kuk-palette-group-label">' + cat + '</div>';
      cats[cat].forEach(function(item) {
        var idx = items.indexOf(item);
        html += '<a href="' + item.href + '" class="kuk-palette-item" data-idx="' + idx + '" tabindex="-1">';
        html += '<span class="kuk-palette-item-icon">' + (item.icon || '') + '</span>';
        html += '<span class="kuk-palette-item-text">';
        html += '<span class="kuk-palette-item-title">' + item.title + '</span>';
        if (item.sub) html += '<span class="kuk-palette-item-sub">' + item.sub + '</span>';
        html += '</span>';
        html += '<span class="kuk-palette-item-arrow">' + ICON.chevron + '</span>';
        html += '</a>';
      });
    });
    el.innerHTML = html;
  }

  function ensureFavicons() {
    try {
      if (!document.head) return;
      var existingIcons = document.querySelectorAll('link[rel*="icon"]');
      existingIcons.forEach(function(el) {
        var href = el.getAttribute('href');
        if (href && !href.startsWith('data:') && !href.startsWith('http')) {
          el.setAttribute('href', _base(href.replace(/^(\.\/|\.\.\/)+/, '')));
        }
      });
      if (!document.querySelector('link[rel*="icon"]')) {
        var link192 = document.createElement('link');
        link192.rel = 'icon';
        link192.type = 'image/png';
        link192.sizes = '192x192';
        link192.href = _base('icon-192.png');
        document.head.appendChild(link192);

        var link32 = document.createElement('link');
        link32.rel = 'icon';
        link32.type = 'image/png';
        link32.sizes = '32x32';
        link32.href = _base('favicon-32x32.png');
        document.head.appendChild(link32);
      }
    } catch(e) {}
  }

  /* ── Shell injection ──────────────────────────────────────────────── */
  function injectShell() {
    ensureFavicons();
    var username   = getUsername();
    var userRecord = getUserRecord(username);
    var navItems   = getVisibleNav();

    document.body.classList.add('kuk-has-shell');

    var container = document.createElement('div');
    container.id = 'kukShellContainer';
    container.innerHTML =
      buildFloatingToggle() +
      buildSidebar(username, userRecord, navItems) +
      buildTopbar(username) +
      buildPalette() +
      buildMobileNav(navItems);

    document.body.insertAdjacentElement('afterbegin', container);

    // Restore user's preferred sidebar state if previously opened
    var isExpanded = localStorage.getItem('kuk_sidebar_expanded') === 'true';
    if (isExpanded) {
      document.body.classList.add('kuk-sidebar-expanded');
      var toggleText = document.querySelector('#kukFloatingToggle .kuk-toggle-text');
      if (toggleText) toggleText.textContent = 'Tutup';
    }

    // Load notifications after a short delay (to allow DB scripts to initialise)
    setTimeout(refreshNotifications, 800);
  }

  function refreshNotifications() {
    var notes = collectNotifications();
    var badge = document.getElementById('kukNotifBadge');
    var list  = document.getElementById('kukNotifList');

    if (badge) {
      if (notes.length) {
        badge.textContent = notes.length > 9 ? '9+' : String(notes.length);
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }

    if (list) {
      if (!notes.length) {
        list.innerHTML = '<div class="kuk-notif-empty">Tidak ada notifikasi baru</div>';
      } else {
        list.innerHTML = notes.map(function(n) {
          return '<div class="kuk-notif-item kuk-notif-' + n.type + '">' +
            '<span class="kuk-notif-icon">' + n.icon + '</span>' +
            '<span class="kuk-notif-msg">' + n.msg + '</span>' +
            '</div>';
        }).join('');
      }
    }
  }

  /* ── Exposed global functions ─────────────────────────────────────── */

  window.kukLogout = function() {
    sessionStorage.removeItem(KEY_USER);
    window.location.replace(_base('index.html'));
  };

  window.kukToggleSidebar = function() {
    var isExpanded = document.body.classList.toggle('kuk-sidebar-expanded');
    localStorage.setItem('kuk_sidebar_expanded', isExpanded ? 'true' : 'false');
    
    var toggleBtn = document.getElementById('kukFloatingToggle');
    if (toggleBtn) {
      var toggleText = toggleBtn.querySelector('.kuk-toggle-text');
      if (toggleText) toggleText.textContent = isExpanded ? 'Tutup' : 'Menu';
    }

    var sb  = document.getElementById('kukSidebar');
    var bd  = document.getElementById('kukSidebarBackdrop');
    if (sb) sb.classList.toggle('kuk-sidebar-open', isExpanded);
    if (bd) bd.classList.toggle('kuk-sidebar-backdrop-show', isExpanded);
  };

  window.kukCloseMobileSidebar = function() {
    document.body.classList.remove('kuk-sidebar-expanded');
    localStorage.setItem('kuk_sidebar_expanded', 'false');
    var toggleBtn = document.getElementById('kukFloatingToggle');
    if (toggleBtn) {
      var toggleText = toggleBtn.querySelector('.kuk-toggle-text');
      if (toggleText) toggleText.textContent = 'Menu';
    }
    var sb = document.getElementById('kukSidebar');
    var bd = document.getElementById('kukSidebarBackdrop');
    if (sb) sb.classList.remove('kuk-sidebar-open');
    if (bd) bd.classList.remove('kuk-sidebar-backdrop-show');
  };

  window.kukSetUnit = function(unit) {
    localStorage.setItem(KEY_UNIT, unit);
    document.querySelectorAll('.kuk-unit-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.textContent.toLowerCase() === unit ||
        (unit === 'semua' && btn.textContent === 'Semua') ||
        (unit === 'bangunan' && btn.textContent === 'Bangunan') ||
        (unit === 'palen' && btn.textContent === 'Palen'));
    });
    window.dispatchEvent(new CustomEvent('kukUnitChange', { detail: { unit: unit } }));
  };

  window.kukOpenPalette = function() {
    var overlay = document.getElementById('kukPaletteOverlay');
    var input   = document.getElementById('kukPaletteInput');
    if (!overlay) return;
    overlay.style.display = 'flex';
    if (input) { input.value = ''; input.focus(); }
    kukPaletteSearch('');
  };

  window.kukClosePalette = function() {
    var overlay = document.getElementById('kukPaletteOverlay');
    if (overlay) overlay.style.display = 'none';
    _paletteIdx = -1;
  };

  window.kukToggleNotifications = function() {
    var panel     = document.getElementById('kukNotifPanel');
    var userPanel = document.getElementById('kukUserMenuPanel');
    if (!panel) return;
    if (userPanel) userPanel.style.display = 'none';
    var isOpen = panel.style.display !== 'none';
    panel.style.display = isOpen ? 'none' : 'block';
  };

  window.kukCloseNotifications = function() {
    var panel = document.getElementById('kukNotifPanel');
    if (panel) panel.style.display = 'none';
  };

  window.kukClearNotifications = function() {
    var list  = document.getElementById('kukNotifList');
    var badge = document.getElementById('kukNotifBadge');
    if (list)  list.innerHTML = '<div class="kuk-notif-empty">Tidak ada notifikasi baru</div>';
    if (badge) badge.style.display = 'none';
    kukCloseNotifications();
  };

  window.kukToggleUserMenu = function() {
    var panel      = document.getElementById('kukUserMenuPanel');
    var notifPanel = document.getElementById('kukNotifPanel');
    if (!panel) return;
    if (notifPanel) notifPanel.style.display = 'none';
    var isOpen = panel.style.display !== 'none';
    panel.style.display = isOpen ? 'none' : 'block';
  };

  window.kukChangePassword = function() {
    var panel = document.getElementById('kukUserMenuPanel');
    if (panel) panel.style.display = 'none';
    // Delegate to existing modal if it exists on the page
    if (typeof openChangePasswordModal === 'function') {
      openChangePasswordModal();
      return;
    }
    // Fallback inline password change
    var newPass = prompt('Masukkan password baru (min. 4 karakter):');
    if (!newPass || newPass.length < 4) return;
    var confirm = prompt('Konfirmasi password baru:');
    if (newPass !== confirm) { alert('Password tidak cocok!'); return; }
    var username = getUsername();
    var db = getUsersDB();
    var user = db.find(function(u) { return u.username === username; });
    if (user) {
      user.password = newPass;
      try { localStorage.setItem(KEY_USERS_DB, JSON.stringify(db)); } catch(e) {}
      alert('Password berhasil diubah.');
    }
  };

  window.kukUploadPhoto = function() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async function(e) {
      var file = e.target.files[0];
      if (!file) return;
      try {
        var photoDataUrl;
        if (typeof MasterDB !== 'undefined' && MasterDB.compressImage) {
          photoDataUrl = await MasterDB.compressImage(file, 320, 320, 0.85);
        } else {
          photoDataUrl = await new Promise(function(res, rej) {
            var r = new FileReader();
            r.onload = function(evt) { res(evt.target.result); };
            r.onerror = rej;
            r.readAsDataURL(file);
          });
        }
        var username = getUsername();
        if (typeof MasterDB !== 'undefined' && MasterDB.saveUserPhoto) {
          MasterDB.saveUserPhoto(username, photoDataUrl);
        } else {
          try {
            var raw = sessionStorage.getItem('kuk_user');
            if (raw) {
              var parsed = JSON.parse(raw);
              parsed.foto = photoDataUrl;
              sessionStorage.setItem('kuk_user', JSON.stringify(parsed));
            }
          } catch(err) {}
        }
        alert("✅ Foto profil berhasil diunggah dan dioptimalkan untuk seluruh perangkat!");
        location.reload();
      } catch(err) {
        var msg = (err && err.message) ? err.message : String(err || 'Gagal membaca berkas gambar.');
        alert("Gagal memproses foto: " + msg);
      }
    };
    input.click();
  };

  window.kukPaletteSearch = kukPaletteSearch;

  window.kukRefreshNotifications = refreshNotifications;

  /* ── Keyboard shortcuts ───────────────────────────────────────────── */
  document.addEventListener('keydown', function(e) {
    // Ctrl+K / Cmd+K — command palette
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      kukOpenPalette();
      return;
    }
    // Escape — close all overlays
    if (e.key === 'Escape') {
      kukClosePalette();
      kukCloseNotifications();
      var um = document.getElementById('kukUserMenuPanel');
      if (um) um.style.display = 'none';
      kukCloseMobileSidebar();
      return;
    }
    // Arrow navigation in palette
    var overlay = document.getElementById('kukPaletteOverlay');
    if (overlay && overlay.style.display !== 'none') {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        var items = document.querySelectorAll('.kuk-palette-item');
        if (!items.length) return;
        if (e.key === 'ArrowDown') _paletteIdx = Math.min(_paletteIdx + 1, items.length - 1);
        else                       _paletteIdx = Math.max(_paletteIdx - 1, 0);
        items.forEach(function(el, i) { el.classList.toggle('focused', i === _paletteIdx); });
        if (items[_paletteIdx]) items[_paletteIdx].scrollIntoView({ block: 'nearest' });
      }
      if (e.key === 'Enter' && _paletteIdx >= 0) {
        var focused = document.querySelector('.kuk-palette-item.focused');
        if (focused) { focused.click(); }
      }
    }
  });

  /* ── Click-outside to close dropdowns ────────────────────────────── */
  document.addEventListener('click', function(e) {
    var nw = document.getElementById('kukNotifWrapper');
    var uw = document.getElementById('kukUserMenuWrapper');
    if (nw && !nw.contains(e.target)) {
      var np = document.getElementById('kukNotifPanel');
      if (np) np.style.display = 'none';
    }
    if (uw && !uw.contains(e.target)) {
      var up = document.getElementById('kukUserMenuPanel');
      if (up) up.style.display = 'none';
    }
  }, true);

  /* ── Initialise ───────────────────────────────────────────────────── */
  function init() {
    // If this page is in the isolated list, skip auth and shell entirely.
    // The page is public-access; dashboard still reads its data from MasterDB.
    if (SHELL_ISOLATED_PAGES.includes(getActivePage())) return;

    if (!checkAuth()) return;
    injectShell();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
