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
    shiftStart: '07:00',
    gracePeriodMinutes: 5, // Toleransi sampai 07:05
    shiftEnd: '16:00',
    maxBreakMinutes: 60
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

  function getCutiDatabase() {
    return JSON.parse(localStorage.getItem('kuk_db_cuti_v1') || '[]');
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
      return form.date === dateStr;
    }
    return false;
  }

  /**
   * Cross-check with Cuti database (kuk_db_cuti_v1)
   */
  function isLeaveFromCutiDb(employee, dateStr) {
    try {
      const cutiList = getCutiDatabase();
      for (const item of cutiList) {
        const matchEmp = (item.idKaryawan && item.idKaryawan === employee.id) ||
                         (item.nama && employee.nama && item.nama.toLowerCase().includes(employee.nama.toLowerCase())) ||
                         (item.nama && employee.fullName && item.nama.toLowerCase().includes(employee.fullName.toLowerCase()));
        if (matchEmp) {
          // Status disetujui / aktif
          const status = (item.status || '').toLowerCase();
          if (status === 'ditolak') continue;

          if (Array.isArray(item.tanggal) && item.tanggal.includes(dateStr)) return true;
          if (item.startDate && item.endDate && dateStr >= item.startDate && dateStr <= item.endDate) return true;
          if (item.tanggal === dateStr) return true;
        }
      }
    } catch (e) {}
    return false;
  }

  /**
   * Calculates the raw system status for a specific employee on a specific date
   */
  function calculateSystemStatus(employee, dateStr, forms, fingerprints) {
    // 1. Check for manual overrides first
    const audits = getAuditLog().filter(a => a.employeeId === employee.id && a.date === dateStr);
    if (audits.length > 0) {
      const latest = audits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      return { status: latest.newStatus, isOverride: true, reason: latest.reason };
    }

    // 2. Check for submitted forms (Leave, Sick, Permission, Dinas) & Cuti DB
    const isCutiDb = isLeaveFromCutiDb(employee, dateStr);
    if (isCutiDb) {
      return { status: 'LEAVE', isOverride: false, note: 'Cuti Resmi Terdaftar' };
    }

    const empForms = forms.filter(f => f.employeeId === employee.id && formCoversDate(f, dateStr));
    let hasFormLeave = false;
    let hasFormSick = false;
    let hasFormPermission = false;
    let hasDinas = false;

    for (let f of empForms) {
      if (f.module === 'CUTI') {
        if (f.leaveType && f.leaveType.toLowerCase().includes('sakit')) hasFormSick = true;
        else if (f.leaveType && f.leaveType.toLowerCase().includes('izin')) hasFormPermission = true;
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
    const empScans = fingerprints.filter(fp => (fp.employeeId === employee.id || (employee.fingerprintId && fp.pin == employee.fingerprintId)) && fp.date === dateStr);
    
    if (empScans.length === 0) {
      // Check if it's Sunday (OFF)
      const dayOfWeek = new Date(dateStr).getDay();
      if (dayOfWeek === 0) return { status: 'OFF', isOverride: false };
      
      // Mangkir murni tanpa cuti/izin
      return { status: 'ABSENT', isOverride: false };
    }

    if (empScans.length === 1) {
      return { 
        status: 'INCOMPLETE', 
        isOverride: false, 
        inTime: empScans[0].time,
        outTime: null
      };
    }

    // Sort scans by time
    empScans.sort((a, b) => a.time.localeCompare(b.time));
    const firstScan = empScans[0];
    const lastScan = empScans[empScans.length - 1];

    const dayOfWeek = new Date(dateStr).getDay();
    const isFriday = (dayOfWeek === 5);

    // Check lateness (Normal 07:05, Jumat 08:05)
    const [inH, inM] = firstScan.time.split(':').map(Number);
    const inTotalMinutes = inH * 60 + inM;
    const shiftStartMin = isFriday ? (8 * 60) : (7 * 60);
    const limitMinutes = shiftStartMin + RULES.gracePeriodMinutes; // Jumat: 08:05, Lainnya: 07:05

    let finalStatus = 'PRESENT';
    let lateMinutes = 0;
    if (inTotalMinutes > limitMinutes) {
      finalStatus = 'LATE';
      lateMinutes = inTotalMinutes - shiftStartMin;
    }

    // Check Break (Normal maks 60m, Jumat maks 180m)
    let breakDuration = 0;
    let breakExcessMinutes = 0;
    let isBreakExcess = false;
    let breakOutTime = null;
    let breakInTime = null;
    const maxAllowedBreak = isFriday ? 180 : RULES.maxBreakMinutes;

    if (empScans.length >= 4) {
      breakOutTime = empScans[1].time;
      breakInTime = empScans[2].time;
      const [boH, boM] = breakOutTime.split(':').map(Number);
      const [biH, biM] = breakInTime.split(':').map(Number);
      const boTotal = boH * 60 + boM;
      const biTotal = biH * 60 + biM;

      if (biTotal > boTotal) {
        breakDuration = biTotal - boTotal;
        if (breakDuration > maxAllowedBreak) {
          isBreakExcess = true;
          breakExcessMinutes = breakDuration - maxAllowedBreak;
        }
      }
    }

    return { 
      status: finalStatus, 
      isOverride: false, 
      inTime: firstScan.time,
      outTime: lastScan.time,
      lateMinutes: lateMinutes,
      isBreakExcess: isBreakExcess,
      breakDuration: breakDuration,
      breakExcessMinutes: breakExcessMinutes,
      breakOutTime: breakOutTime,
      breakInTime: breakInTime
    };
  }

  /**
   * Get attendance for active employees for a given date, optionally filtered by unit
   */
  function getDailyAttendance(dateStr, unit = 'ALL') {
    let employees = typeof MasterDB !== 'undefined' ? MasterDB.getEmployees().filter(e => e.status === 'Active' || e.status === 'Aktif') : [];
    if (unit && unit !== 'ALL' && unit !== 'semua') {
      const u = unit.toLowerCase().replace('kuk ', '');
      employees = employees.filter(e => e.unit && e.unit.toLowerCase().includes(u));
    }
    const forms = getForms();
    const fingerprints = getRawFingerprints();

    return employees.map(emp => {
      const calc = calculateSystemStatus(emp, dateStr, forms, fingerprints);
      return {
        employeeId: emp.id,
        employeeName: emp.fullName,
        unit: emp.unit,
        department: emp.department,
        position: emp.position,
        ...calc
      };
    });
  }

  /**
   * Manual override API
   */
  function adjustStatus(employeeId, dateStr, newStatus, reason, adminName) {
    reason = (reason && reason.trim()) ? reason.trim() : 'Penyesuaian Manual';
    
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

if (typeof window !== 'undefined') {
  window.AttendanceEngine = AttendanceEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AttendanceEngine;
}
