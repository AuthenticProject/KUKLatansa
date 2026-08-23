/**
 * dashboard_engine.js
 * Comprehensive aggregator and analytical engine for KUK La Tansa Management Dashboard.
 * Connects MasterDB, AttendanceEngine, ViolationEngine, Public Submissions, Armada, and Payroll.
 */

const DashboardEngine = (() => {
  'use strict';

  const SUBMISSIONS_KEY = 'kuk_public_submissions';
  const AUDIT_ATTENDANCE_KEY = 'kuk_attendance_audit';
  const VIOLATIONS_KEY = 'kuk_violations_db';
  const PAYROLL_KEY = 'kuk_payroll_db';
  const VEHICLE_LOANS_KEY = 'kuk_peminjaman_data';

  function getSubmissions() {
    try {
      return JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveSubmissions(data) {
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(data));
  }

  function getVehicleLoans() {
    try {
      // Check both keys for compatibility with legacy and modern storage
      const d1 = localStorage.getItem(VEHICLE_LOANS_KEY);
      if (d1) return JSON.parse(d1);
      const d2 = localStorage.getItem('peminjaman_data');
      if (d2) return JSON.parse(d2);
      return [];
    } catch (e) {
      return [];
    }
  }

  function getActiveEmployees(filters = {}) {
    if (typeof MasterDB === 'undefined' || !MasterDB.getEmployees) return [];
    let list = MasterDB.getEmployees().filter(e => {
      // Hanya hitung karyawan murni (workforce) — bukan user account (staff manajemen).
      // User accounts memiliki field 'username' atau 'role', karyawan tidak.
      if (e.username || e.role) return false;
      return e.status === 'Active' || e.status === 'Aktif';
    });

    if (filters.unit && filters.unit !== 'ALL' && filters.unit !== 'semua') {
      const u = filters.unit.toLowerCase();
      list = list.filter(e => e.unit && e.unit.toLowerCase().includes(u.replace('kuk ', '')));
    }

    if (filters.department && filters.department !== 'ALL') {
      list = list.filter(e => e.department === filters.department);
    }

    if (filters.employeeId) {
      list = list.filter(e => e.id === filters.employeeId);
    }

    return list;
  }

  function getTodayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatDate(d) {
    if (!d) return '-';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return d;
      return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return d;
    }
  }

  function formatTime(d) {
    if (!d) return '';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return '';
      return dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  }

  function formatCurrency(val) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  }

  /**
   * Main metrics aggregation function
   */
  function getMetrics(filters = {}) {
    const todayStr = filters.date || getTodayStr();
    const activeEmployees = getActiveEmployees(filters);
    const totalHeadcount = activeEmployees.length;

    // Headcount by Unit
    let allEmps = typeof MasterDB !== 'undefined' && MasterDB && MasterDB.getEmployees ? MasterDB.getEmployees().filter(e => e.status === 'Active' || e.status === 'Aktif') : [];
    const headcountBangunan = allEmps.filter(e => e.unit && e.unit.toLowerCase().includes('bangunan')).length;
    const headcountPalen = allEmps.filter(e => e.unit && e.unit.toLowerCase().includes('palen')).length;

    // Attendance calculation for today
    let dailyAtt = [];
    if (typeof AttendanceEngine !== 'undefined' && AttendanceEngine && AttendanceEngine.getDailyAttendance) {
      dailyAtt = AttendanceEngine.getDailyAttendance(todayStr);
      // Filter by active employee selection
      const empIds = new Set(activeEmployees.map(e => e.id));
      dailyAtt = dailyAtt.filter(a => empIds.has(a.employeeId));
    }

    let countPresent = 0;
    let countLate = 0;
    let countAbsent = 0;
    let countLeave = 0;
    let countSick = 0;
    let countPermission = 0;
    let countExcused = 0;

    dailyAtt.forEach(a => {
      if (a.status === 'PRESENT') countPresent++;
      else if (a.status === 'LATE') countLate++;
      else if (a.status === 'ABSENT') countAbsent++;
      else if (a.status === 'LEAVE') countLeave++;
      else if (a.status === 'SICK') countSick++;
      else if (a.status === 'PERMISSION') countPermission++;
      else if (a.status === 'EXCUSED') countExcused++;
    });

    const totalWorking = countPresent + countLate + countExcused;
    const attendanceRate = totalHeadcount > 0 ? Math.round((totalWorking / totalHeadcount) * 100) : 0;

    // Pending Leaves & Forms
    const allSubs = getSubmissions();
    const pendingLeaves = allSubs.filter(s => s.module === 'CUTI' && (!s.status || s.status === 'PENDING'));
    const pendingVehicleLoans = allSubs.filter(s => s.module === 'PEMINJAMAN' && (!s.status || s.status === 'PENDING'));

    // Violations
    let allViolations = [];
    if (typeof ViolationEngine !== 'undefined' && ViolationEngine && ViolationEngine.getViolations) {
      allViolations = ViolationEngine.getViolations();
    }
    const pendingViolations = allViolations.filter(v => v.status === 'AUTO GENERATED' || v.status === 'REVIEW');
    const totalViolationsThisMonth = allViolations.filter(v => {
      return v.date && v.date.startsWith(todayStr.substring(0, 7)) && v.status !== 'REJECTED';
    });

    // Vehicles / Armada Status
    let vehicles = [];
    if (typeof MasterDB !== 'undefined' && MasterDB && MasterDB.getVehicles) {
      vehicles = MasterDB.getVehicles();
    }
    const activeLoans = getVehicleLoans().filter(l => l.status === 'Dipinjam' || l.status === 'Aktif');
    const totalArmada = vehicles.length;
    const armadaDipinjam = activeLoans.length;
    const armadaTersedia = Math.max(0, totalArmada - armadaDipinjam);

    // Payroll Summary
    let payrollRuns = [];
    if (typeof PayrollEngine !== 'undefined' && PayrollEngine && PayrollEngine.getPayrolls) {
      payrollRuns = PayrollEngine.getPayrolls();
    }
    const latestPayroll = payrollRuns.length > 0 ? payrollRuns[payrollRuns.length - 1] : null;
    let latestPayrollTotal = 0;
    let latestPayrollStatus = 'BELUM DIBUAT';
    if (latestPayroll && latestPayroll.slips) {
      latestPayrollTotal = latestPayroll.slips.reduce((acc, s) => acc + (s.takeHomePay || 0), 0);
      latestPayrollStatus = latestPayroll.status;
    }

    return {
      date: todayStr,
      headcount: {
        total: totalHeadcount,
        bangunan: headcountBangunan,
        palen: headcountPalen
      },
      attendance: {
        rate: attendanceRate,
        present: countPresent,
        late: countLate,
        absent: countAbsent,
        leave: countLeave,
        sick: countSick,
        permission: countPermission,
        excused: countExcused,
        totalWorking: totalWorking,
        dailyRecords: dailyAtt
      },
      pending: {
        leaves: pendingLeaves.length,
        violations: pendingViolations.length,
        vehicleLoans: pendingVehicleLoans.length,
        totalUrgent: pendingLeaves.length + pendingViolations.length
      },
      armada: {
        total: totalArmada,
        tersedia: armadaTersedia,
        dipinjam: armadaDipinjam,
        activeLoansList: activeLoans
      },
      violations: {
        pendingCount: pendingViolations.length,
        thisMonthCount: totalViolationsThisMonth.length,
        pendingList: pendingViolations.slice(0, 5)
      },
      payroll: {
        latestRun: latestPayroll,
        totalAmount: latestPayrollTotal,
        status: latestPayrollStatus
      }
    };
  }

  /**
   * Generates urgent action items requiring management attention
   */
  function getActionItems(filters = {}) {
    const items = [];
    const subs = getSubmissions();

    // 1. Pending Leave Approvals
    const pendingLeaves = subs.filter(s => s.module === 'CUTI' && (!s.status || s.status === 'PENDING'));
    pendingLeaves.forEach(l => {
      items.push({
        id: l.id,
        type: 'LEAVE_APPROVAL',
        category: 'Cuti & Izin',
        badgeColor: 'warning',
        icon: '📅',
        title: `Pengajuan Cuti: ${l.employeeName || 'Karyawan'}`,
        description: `${l.leaveType || 'Cuti'} (${l.startDate || '-'} s/d ${l.endDate || '-'}) - Alasan: ${l.reason || '-'}`,
        timestamp: l.submittedAt || l.date,
        actionUrl: '../rekap_cuti.html',
        actionLabel: 'Tinjau Pengajuan',
        data: l
      });
    });

    // 2. Pending Auto Violations
    let violations = [];
    if (typeof ViolationEngine !== 'undefined' && ViolationEngine && ViolationEngine.getViolations) {
      violations = ViolationEngine.getViolations().filter(v => v.status === 'AUTO GENERATED' || v.status === 'REVIEW');
    }
    violations.forEach(v => {
      items.push({
        id: v.id,
        type: 'VIOLATION_REVIEW',
        category: 'Pelanggaran',
        badgeColor: 'danger',
        icon: '⚠️',
        title: `Verifikasi Pelanggaran: ${v.employeeName || 'Karyawan'}`,
        description: `${v.ruleBroken || 'Pelanggaran'} pada ${v.date}: ${v.calculatedValue || '-'}`,
        timestamp: v.generatedTime,
        actionUrl: '../violation_review.html',
        actionLabel: 'Review Tiket',
        data: v
      });
    });

    // 3. Pending Payroll Approvals
    if (typeof PayrollEngine !== 'undefined' && PayrollEngine && PayrollEngine.getPayrolls) {
      const runs = PayrollEngine.getPayrolls().filter(r => r.status === 'REVIEW' || r.status === 'CALCULATED');
      runs.forEach(r => {
        items.push({
          id: r.id,
          type: 'PAYROLL_ACTION',
          category: 'Payroll',
          badgeColor: 'info',
          icon: '💸',
          title: `Payroll Perlu Persetujuan: ${r.periodName}`,
          description: `Status: ${r.status} (${r.startDate} s/d ${r.endDate})`,
          timestamp: r.generatedAt,
          actionUrl: '../payroll_dashboard.html',
          actionLabel: 'Buka Payroll',
          data: r
        });
      });
    }

    // Sort by timestamp descending
    items.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    return items;
  }

  /**
   * Compares KUK Bangunan vs KUK Palen
   */
  function getUnitComparison(dateStr) {
    dateStr = dateStr || getTodayStr();
    const allEmps = typeof MasterDB !== 'undefined' && MasterDB && MasterDB.getEmployees ? MasterDB.getEmployees().filter(e => e.status === 'Active' || e.status === 'Aktif') : [];

    const bEmps = allEmps.filter(e => e.unit && e.unit.toLowerCase().includes('bangunan'));
    const pEmps = allEmps.filter(e => e.unit && e.unit.toLowerCase().includes('palen'));

    let bAtt = { present: 0, late: 0, absent: 0, rate: 0 };
    let pAtt = { present: 0, late: 0, absent: 0, rate: 0 };

    if (typeof AttendanceEngine !== 'undefined' && AttendanceEngine && AttendanceEngine.getDailyAttendance) {
      const daily = AttendanceEngine.getDailyAttendance(dateStr);
      
      const bIds = new Set(bEmps.map(e => e.id));
      const pIds = new Set(pEmps.map(e => e.id));

      daily.forEach(a => {
        if (bIds.has(a.employeeId)) {
          if (a.status === 'PRESENT') bAtt.present++;
          else if (a.status === 'LATE') bAtt.late++;
          else if (a.status === 'ABSENT') bAtt.absent++;
        }
        if (pIds.has(a.employeeId)) {
          if (a.status === 'PRESENT') pAtt.present++;
          else if (a.status === 'LATE') pAtt.late++;
          else if (a.status === 'ABSENT') pAtt.absent++;
        }
      });

      const bWorking = bAtt.present + bAtt.late;
      bAtt.rate = bEmps.length > 0 ? Math.round((bWorking / bEmps.length) * 100) : 0;

      const pWorking = pAtt.present + pAtt.late;
      pAtt.rate = pEmps.length > 0 ? Math.round((pWorking / pEmps.length) * 100) : 0;
    }

    // Violations by Unit
    let bViolations = 0;
    let pViolations = 0;
    if (typeof ViolationEngine !== 'undefined' && ViolationEngine && ViolationEngine.getViolations) {
      const vList = ViolationEngine.getViolations();
      const bIds = new Set(bEmps.map(e => e.id));
      const pIds = new Set(pEmps.map(e => e.id));

      vList.forEach(v => {
        if (v.status !== 'REJECTED') {
          if (bIds.has(v.employeeId)) bViolations++;
          if (pIds.has(v.employeeId)) pViolations++;
        }
      });
    }

    // Active Leaves by Unit
    let bLeaves = 0;
    let pLeaves = 0;
    try {
      const rawCuti = localStorage.getItem('kuk_db_cuti_v1');
      if (rawCuti) {
        const cutiList = JSON.parse(rawCuti);
        const bNames = new Set(bEmps.map(e => (e.nama || e.fullName || '').toLowerCase().trim()));
        const pNames = new Set(pEmps.map(e => (e.nama || e.fullName || '').toLowerCase().trim()));
        const bIds = new Set(bEmps.map(e => String(e.id).toLowerCase().trim()));
        const pIds = new Set(pEmps.map(e => String(e.id).toLowerCase().trim()));

        cutiList.forEach(c => {
          const empId = String(c.idKaryawan || c.id || '').toLowerCase().trim();
          const empName = String(c.nama || c.fullName || '').toLowerCase().trim();
          const isB = bIds.has(empId) || bNames.has(empName) || (c.unit && c.unit.toLowerCase().includes('bangunan'));
          const isP = pIds.has(empId) || pNames.has(empName) || (c.unit && c.unit.toLowerCase().includes('palen'));
          const dates = Array.isArray(c.tanggal) ? c.tanggal : (c.tanggal ? [c.tanggal] : []);
          const hasTodayOrActive = dates.some(d => d === dateStr || d.startsWith(dateStr.slice(0, 7)));
          if (hasTodayOrActive) {
            if (isB) bLeaves++;
            if (isP) pLeaves++;
          }
        });
      }
    } catch(e){}

    // Active Loans by Unit
    let bLoans = 0;
    let pLoans = 0;
    try {
      const rawLoans = localStorage.getItem('peminjaman_data') || localStorage.getItem('kuk_peminjaman_data');
      if (rawLoans) {
        const loanList = JSON.parse(rawLoans);
        const pNames = new Set(pEmps.map(e => (e.nama || e.fullName || '').toLowerCase().trim()));

        loanList.forEach(l => {
          if (l.status === 'Aktif/Dipinjam' || l.status === 'Approved' || l.status === 'Dipinjam') {
            const borrower = String(l.nama || l.peminjam || '').toLowerCase().trim();
            if (pNames.has(borrower) || (l.unit && l.unit.toLowerCase().includes('palen'))) {
              pLoans++;
            } else {
              bLoans++;
            }
          }
        });
      }
    } catch(e){}

    return {
      bangunan: {
        name: 'KUK Bangunan',
        headcount: bEmps.length,
        attendanceRate: bAtt.rate,
        workingCount: bAtt.present + bAtt.late,
        present: bAtt.present,
        late: bAtt.late,
        absent: bAtt.absent,
        leavesCount: bLeaves,
        violationsCount: bViolations,
        violations: bViolations,
        vehicleLoansCount: bLoans
      },
      palen: {
        name: 'KUK Palen',
        headcount: pEmps.length,
        attendanceRate: pAtt.rate,
        workingCount: pAtt.present + pAtt.late,
        present: pAtt.present,
        late: pAtt.late,
        absent: pAtt.absent,
        leavesCount: pLeaves,
        violationsCount: pViolations,
        violations: pViolations,
        vehicleLoansCount: pLoans
      }
    };
  }

  /**
   * 7-day or custom-range attendance trends
   */
  function getAttendanceTrends(daysCount = 7, unit = 'ALL') {
    const trends = [];
    const end = new Date();
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;
      const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });

      let present = 0, late = 0, absent = 0, other = 0;
      if (typeof AttendanceEngine !== 'undefined' && AttendanceEngine && AttendanceEngine.getDailyAttendance) {
        const list = AttendanceEngine.getDailyAttendance(dateStr);
        list.forEach(a => {
          if (unit !== 'ALL' && unit !== 'semua' && a.unit && !a.unit.toLowerCase().includes(unit.toLowerCase().replace('kuk ', ''))) {
            return;
          }
          if (a.status === 'PRESENT') present++;
          else if (a.status === 'LATE') late++;
          else if (a.status === 'ABSENT') absent++;
          else other++;
        });
      }

      trends.push({
        date: dateStr,
        label: dayLabel,
        present,
        late,
        absent,
        other,
        total: present + late + absent + other
      });
    }

    return trends;
  }

  /**
   * Violation trends by rule category
   */
  function getViolationTrends(unit = 'ALL') {
    const rulesMap = {
      'LATE_ARRIVAL': { label: 'Keterlambatan', count: 0, color: '#f59e0b' },
      'MISSING_PUNCH': { label: 'Hanya 1 Scan (Punch)', count: 0, color: '#0ea5e9' },
      'UNAUTHORIZED_ABSENCE': { label: 'Mangkir / Tanpa Izin', count: 0, color: '#ef4444' },
      'OTHER': { label: 'Lain-lain', count: 0, color: '#6b7280' }
    };

    if (typeof ViolationEngine !== 'undefined' && ViolationEngine && ViolationEngine.getViolations) {
      const vList = ViolationEngine.getViolations();
      vList.forEach(v => {
        if (v.status === 'REJECTED') return;
        const key = rulesMap[v.ruleBroken] ? v.ruleBroken : 'OTHER';
        rulesMap[key].count++;
      });
    }

    return Object.keys(rulesMap).map(k => ({
      key: k,
      ...rulesMap[k]
    }));
  }

  /**
   * Unified recent activity feed
   */
  function getRecentActivities(limit = 10) {
    const activities = [];

    // 1. Form Submissions
    const subs = getSubmissions();
    subs.forEach(s => {
      activities.push({
        id: s.id,
        module: s.module,
        icon: s.module === 'CUTI' ? '🏖️' : (s.module === 'ABSEN' ? '📋' : (s.module === 'PEMINJAMAN' ? '🚚' : '📝')),
        title: `Pengajuan ${s.module}: ${s.employeeName || 'Karyawan'}`,
        description: s.reason || s.keperluan || s.keterangan || (s.module === 'ABSEN' ? `Lokasi: ${s.location || '-'}` : '-'),
        timestamp: s.submittedAt || s.date || new Date().toISOString(),
        tag: s.status || 'SUBMITTED',
        color: s.status === 'APPROVED' ? 'success' : (s.status === 'REJECTED' ? 'danger' : 'warning')
      });
    });

    // 2. Attendance Adjustments
    try {
      const audits = JSON.parse(localStorage.getItem(AUDIT_ATTENDANCE_KEY) || '[]');
      audits.forEach(a => {
        activities.push({
          id: 'AUDIT-' + a.timestamp,
          module: 'ATTENDANCE',
          icon: '✏️',
          title: `Penyesuaian Absensi (${a.date})`,
          description: `Status diubah ke ${a.newStatus} oleh ${a.adminName || 'Admin'}. Alasan: ${a.reason}`,
          timestamp: a.timestamp,
          tag: 'AUDIT',
          color: 'info'
        });
      });
    } catch (e) {}

    // 3. Violation state changes
    if (typeof ViolationEngine !== 'undefined' && ViolationEngine && ViolationEngine.getViolations) {
      const vList = ViolationEngine.getViolations();
      vList.forEach(v => {
        activities.push({
          id: v.id,
          module: 'VIOLATION',
          icon: '⚠️',
          title: `Tiket Pelanggaran: ${v.employeeName}`,
          description: `${v.ruleBroken} (${v.calculatedValue || '-'}). Status: ${v.status}`,
          timestamp: v.generatedTime,
          tag: v.status,
          color: v.status === 'CLOSED' ? 'success' : (v.status === 'REJECTED' ? 'muted' : 'danger')
        });
      });
    }

    // 4. Payroll Runs
    if (typeof PayrollEngine !== 'undefined' && PayrollEngine && PayrollEngine.getPayrolls) {
      const pList = PayrollEngine.getPayrolls();
      pList.forEach(p => {
        activities.push({
          id: p.id,
          module: 'PAYROLL',
          icon: '💸',
          title: `Payroll ${p.periodName}`,
          description: `Total ${p.slips ? p.slips.length : 0} slip karyawan. Status: ${p.status}`,
          timestamp: p.lastModified || p.generatedAt,
          tag: p.status,
          color: p.status === 'LOCKED' ? 'success' : 'primary'
        });
      });
    }

    // Sort descending by timestamp
    activities.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    return activities.slice(0, limit);
  }

  /**
   * Inline Action: Approve Leave
   */
  function approveLeave(submissionId, reviewerName = 'Admin', note = '') {
    const subs = getSubmissions();
    const idx = subs.findIndex(s => s.id === submissionId);
    if (idx === -1) throw new Error('Pengajuan tidak ditemukan.');

    subs[idx].status = 'APPROVED';
    subs[idx].reviewedBy = reviewerName;
    subs[idx].reviewNote = note;
    subs[idx].reviewedAt = new Date().toISOString();

    saveSubmissions(subs);
    return subs[idx];
  }

  /**
   * Inline Action: Reject Leave
   */
  function rejectLeave(submissionId, reviewerName = 'Admin', note = '') {
    if (!note || !note.trim()) throw new Error('Alasan penolakan wajib diisi.');
    const subs = getSubmissions();
    const idx = subs.findIndex(s => s.id === submissionId);
    if (idx === -1) throw new Error('Pengajuan tidak ditemukan.');

    subs[idx].status = 'REJECTED';
    subs[idx].reviewedBy = reviewerName;
    subs[idx].reviewNote = note;
    subs[idx].reviewedAt = new Date().toISOString();

    saveSubmissions(subs);
    return subs[idx];
  }

  /**
   * Helper: 7-day attendance trend formatted for Dashboard UI
   */
  function getAttendanceTrend7Days(filters = {}) {
    const unit = filters.unit || 'ALL';
    const rawTrends = getAttendanceTrends(7, unit);
    return rawTrends.map(t => {
      const working = t.present + t.late;
      const rate = t.total > 0 ? Math.round((working / t.total) * 100) : 0;
      return {
        date: t.date,
        label: t.label,
        rate: rate,
        present: t.present,
        late: t.late,
        absent: t.absent,
        total: t.total
      };
    });
  }

  /**
   * Helper: Violation summary breakdown & leaderboard
   */
  function getViolationSummary(filters = {}) {
    const rawTrends = getViolationTrends(filters.unit || 'ALL');
    const breakdown = { late: 0, absent: 0, incomplete: 0, other: 0 };
    
    rawTrends.forEach(r => {
      if (r.key === 'LATE_ARRIVAL') breakdown.late = r.count;
      else if (r.key === 'UNAUTHORIZED_ABSENCE') breakdown.absent = r.count;
      else if (r.key === 'MISSING_PUNCH') breakdown.incomplete = r.count;
      else breakdown.other += r.count;
    });

    let leaderboard = [];
    if (typeof ViolationEngine !== 'undefined' && ViolationEngine && ViolationEngine.getViolations) {
      const vList = ViolationEngine.getViolations().filter(v => v.status !== 'REJECTED');
      const empMap = {};
      vList.forEach(v => {
        if (!empMap[v.employeeId]) {
          empMap[v.employeeId] = { name: v.employeeName, points: 0, violationsCount: 0 };
        }
        empMap[v.employeeId].points += (v.points || 1);
        empMap[v.employeeId].violationsCount++;
      });
      leaderboard = Object.values(empMap).sort((a, b) => b.points - a.points);
    }

    return {
      breakdown,
      leaderboard
    };
  }

  /**
   * Helper: Get pending leave applications
   */
  function getPendingLeavesDirect(filters = {}) {
    const subs = getSubmissions();
    let pending = subs.filter(s => s.module === 'CUTI' && (!s.status || s.status === 'PENDING' || s.status === 'MENUNGGU'));
    if (filters.unit && filters.unit !== 'ALL' && filters.unit !== 'semua') {
      const u = filters.unit.toLowerCase().replace('kuk ', '');
      pending = pending.filter(s => s.unit && s.unit.toLowerCase().includes(u));
    }
    return pending;
  }

  /**
   * Helper: Get pending violations to review
   */
  function getPendingViolationsDirect(filters = {}) {
    if (typeof ViolationEngine === 'undefined' || !ViolationEngine.getViolations) return [];
    let list = ViolationEngine.getViolations().filter(v => v.status === 'AUTO GENERATED' || v.status === 'REVIEW');
    if (filters.unit && filters.unit !== 'ALL' && filters.unit !== 'semua') {
      const u = filters.unit.toLowerCase().replace('kuk ', '');
      list = list.filter(v => v.unit && v.unit.toLowerCase().includes(u));
    }
    return list;
  }

  /**
   * Helper: Resolve leave directly
   */
  function resolveLeaveDirect(submissionId, status, note = '') {
    const activeUser = typeof Security !== 'undefined' && Security.getCurrentUser ? Security.getCurrentUser() : null;
    const reviewerName = activeUser ? activeUser.username : 'Admin';
    if (status === 'APPROVED') {
      return approveLeave(submissionId, reviewerName, note);
    } else {
      return rejectLeave(submissionId, reviewerName, note || 'Ditolak Manajemen');
    }
  }

  return {
    getMetrics,
    getActionItems,
    getUnitComparison,
    getAttendanceTrends,
    getAttendanceTrend7Days,
    getViolationTrends,
    getViolationSummary,
    getPendingLeavesDirect,
    getPendingViolationsDirect,
    resolveLeaveDirect,
    getRecentActivities,
    approveLeave,
    rejectLeave,
    formatDate,
    formatTime,
    formatCurrency,
    getTodayStr
  };
})();

if (typeof window !== 'undefined') {
  window.DashboardEngine = DashboardEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DashboardEngine;
}
