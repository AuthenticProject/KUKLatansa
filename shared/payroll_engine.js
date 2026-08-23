/**
 * payroll_engine.js
 * Rule-based, snapshot-safe, cryptographically sealed payroll engine.
 * Includes RBAC protection, tamper-evident seals, and immutable lock enforcement.
 */

const PayrollEngine = (() => {
  'use strict';

  const DB_KEY = 'kuk_payroll_db';

  const RULES = {
    default_base_salary_bangunan: 850000,
    default_base_salary_palen: 700000,
    late_deduction_rate: 2500, // Rp 2.500 / hari terlambat (KUK HR Portal Formula)
    absent_deduction_rate: 28500, // Rp 28.500 / hari alpa
    incomplete_deduction_rate: 0 // Tidak ada potongan incomplete (ga ada)
  };

  function getPayrolls() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function savePayrolls(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  }

  function getDatesInRange(startStr, endStr) {
    const dates = [];
    let curr = new Date(startStr);
    const end = new Date(endStr);
    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  }

  function checkPayrollAccess() {
    if (typeof Security !== 'undefined' && Security.can) {
      const user = Security.getCurrentUser();
      // Allow execution in testing or if user has payroll permission
      if (user && !Security.can(user, 'payroll')) {
        Security.audit('UNAUTHORIZED_PAYROLL_ACCESS_BLOCKED', { username: user.username, role: user.role }, 'CRITICAL', user);
        throw new Error("Akses Ditolak: Anda tidak memiliki wewenang untuk mengakses atau memodifikasi modul Payroll.");
      }
    }
  }

  /**
   * Generates or Regenerates a Payroll Run for a specific period with unit separation.
   */
  function generatePayroll(periodName, startStr, endStr, targetUnit = 'ALL') {
    checkPayrollAccess();

    if (typeof AttendanceEngine === 'undefined') {
      throw new Error("AttendanceEngine not loaded");
    }

    const existingRuns = getPayrolls();
    // Check if this period already exists and is locked
    const existingRunIndex = existingRuns.findIndex(r => r.periodName === periodName);
    if (existingRunIndex > -1 && existingRuns[existingRunIndex].status === 'LOCKED') {
      if (typeof Security !== 'undefined') {
        Security.audit('LOCKED_PAYROLL_ALTERATION_ATTEMPT_BLOCKED', { periodName }, 'CRITICAL');
      }
      throw new Error("Dilarang mengubah atau me-rekalkulasi payroll yang sudah berstatus LOCKED (Terkunci Permanen).");
    }

    const dates = getDatesInRange(startStr, endStr);
    
    // employeeId -> aggregate data
    const empData = {};
    const employees = typeof MasterDB !== 'undefined' && MasterDB.getEmployees ? MasterDB.getEmployees() : [];

    // Filter employees by target unit if specified
    const activeEmps = employees.filter(emp => {
      const isActive = emp.status === 'Active' || emp.status === 'Aktif';
      if (!isActive) return false;
      if (targetUnit && targetUnit !== 'ALL' && targetUnit !== 'semua') {
        const u = targetUnit.toLowerCase().replace('kuk ', '');
        return emp.unit && emp.unit.toLowerCase().includes(u);
      }
      return true;
    });

    // Check tip kaca - baca dari localStorage DAN MasterDB.DEFAULT_TIP_DATA sebagai fallback
    let glassTips = [];
    try {
      // Prioritas: localStorage (data live) → MasterDB default (data historis)
      const raw1 = localStorage.getItem('kuk_db_tip_v1');
      const raw2 = localStorage.getItem('kuk_tip_db_v1');
      let lsData = [];
      if (raw1) { try { const p = JSON.parse(raw1); if (Array.isArray(p) && p.length > 0) lsData = p; } catch(e){} }
      if (lsData.length === 0 && raw2) { try { const p = JSON.parse(raw2); if (Array.isArray(p) && p.length > 0) lsData = p; } catch(e){} }

      if (lsData.length > 0) {
        glassTips = lsData;
      } else if (typeof MasterDB !== 'undefined' && MasterDB.DEFAULT_TIP_DATA) {
        glassTips = MasterDB.DEFAULT_TIP_DATA;
      }
    } catch (e) {
      if (typeof MasterDB !== 'undefined' && MasterDB.DEFAULT_TIP_DATA) {
        glassTips = MasterDB.DEFAULT_TIP_DATA;
      }
    }

    /**
     * Cocokkan nama karyawan di data tip (bisa nama pendek) ke karyawan master.
     * Strategi (berurutan, stop saat match):
     *   1. idKaryawan / id cocok dengan emp.id
     *   2. Nama di tip == fullName karyawan (exact)
     *   3. fullName karyawan diawali dengan nama di tip (prefix)
     *   4. Kata pertama nama di tip ada di fullName (first-word)
     */
    function tipMatchesEmployee(t, emp) {
      const tId    = (t.idKaryawan || t.id_karyawan || '').trim();
      const tName  = (t.namaKaryawan || t.karyawan || t.nama || t.name || '').trim().toLowerCase();
      const fName  = (emp.fullName || '').trim().toLowerCase();
      const nName  = (emp.nama || '').trim().toLowerCase();   // nama panggilan (mis: 'Ulin')
      const eId    = (emp.id || '').trim();

      if (tId && eId && tId === eId) return true;               // 1. ID match
      if (tName && fName && tName === fName) return true;        // 2. Exact fullName
      if (tName && nName && tName === nName) return true;        // 3. Exact nickname
      if (tName && fName && fName.startsWith(tName)) return true; // 4. Prefix of fullName
      if (tName) {
        const firstWord = tName.split(' ')[0];
        if (firstWord.length >= 3) {
          if (fName.split(' ').some(w => w === firstWord)) return true; // 5. First-word in fullName
          if (nName.split(' ').some(w => w === firstWord)) return true; // 6. First-word in nickname
        }
      }
      return false;
    }



    // Initialize employees
    activeEmps.forEach(emp => {
      // Calculate tip kaca for Bangunan employees — HANYA dalam periode payroll ini
      let tipKacaNominal = 0;
      if (emp.unit && emp.unit.toLowerCase().includes('bangunan')) {
        const empTips = glassTips.filter(t => {
          const tDate = t.tanggal || t.tgl || '';
          // Wajib ada tanggal DAN harus masuk dalam rentang periode (strict)
          // tip Agustus TIDAK akan masuk ke payroll September, dst.
          const inPeriod = tDate && tDate >= startStr && tDate <= endStr;
          return inPeriod && tipMatchesEmployee(t, emp);
        });
        tipKacaNominal = empTips.reduce((acc, t) => acc + (parseFloat(t.nominalTip || t.tip || 0) || 0), 0);
      }



      const isPalen = emp.unit && emp.unit.toLowerCase().includes('palen');
      const defaultBase = isPalen ? RULES.default_base_salary_palen : RULES.default_base_salary_bangunan;
      const baseSalary = Number(emp.gajiPokok) > 0 ? Number(emp.gajiPokok) : defaultBase;
      const gajiBagian = Number(emp.gajiBagian) || 0;
      const tunjanganKeluarga = emp.sudahBerkeluarga ? 50000 : 0;
      const hadiahPondok = Number(emp.hadiahPondok) || 0;
      const insentifCuti = Number(emp.insentifCuti) || 0;

      empData[emp.id] = {
        employeeName: emp.fullName || emp.nama,
        unit: emp.unit,
        department: emp.department || 'Operasional',
        position: emp.position || 'Staf',
        baseSalary: baseSalary,
        gajiBagian: gajiBagian,
        sudahBerkeluarga: !!emp.sudahBerkeluarga,
        tunjanganKeluarga: tunjanganKeluarga,
        hadiahPondok: hadiahPondok,
        insentifCuti: insentifCuti,
        tipKaca: tipKacaNominal,
        counts: { PRESENT: 0, LATE: 0, ABSENT: 0, INCOMPLETE: 0, LEAVE: 0, SICK: 0, PERMISSION: 0, EXCUSED: 0, OFF: 0 }
      };
    });

    // Aggregate attendance
    dates.forEach(date => {
      const dailyAtt = AttendanceEngine.getDailyAttendance(date);
      dailyAtt.forEach(att => {
        if (empData[att.employeeId] && empData[att.employeeId].counts[att.status] !== undefined) {
          empData[att.employeeId].counts[att.status]++;
        }
      });
    });

    // Calculate Slips
    let totalBangunan = 0;
    let totalPalen = 0;

    const slips = Object.keys(empData).map(empId => {
      const data = empData[empId];
      
      const lateDeduction = data.counts.LATE * RULES.late_deduction_rate; // 2.500 x jumlah terlambat
      const absentDeduction = data.counts.ABSENT * RULES.absent_deduction_rate; // 28.500 x hari tidak masuk
      const incompleteDeduction = 0; // Tidak ada potongan incomplete ("ga ada")
      const totalDeductions = lateDeduction + absentDeduction + incompleteDeduction;

      // Rumus Resmi KUK HR Portal:
      // Take Home Pay = Gaji Pokok - (28.500 x Alpa) - (2.500 x Late) + Gaji Bagian + Hadiah Pondok + Tip Kaca + Tunjangan Berkeluarga + Insentif Cuti
      const grossSalary = data.baseSalary + data.gajiBagian + data.hadiahPondok + data.tunjanganKeluarga + data.tipKaca + data.insentifCuti;
      const takeHomePay = grossSalary - totalDeductions;

      if (data.unit && data.unit.toLowerCase().includes('palen')) {
        totalPalen += takeHomePay;
      } else {
        totalBangunan += takeHomePay;
      }

      return {
        employeeId: empId,
        employeeName: data.employeeName,
        unit: data.unit,
        department: data.department,
        position: data.position,
        baseSalary: data.baseSalary,
        gajiBagian: data.gajiBagian,
        hadiahPondok: data.hadiahPondok,
        sudahBerkeluarga: data.sudahBerkeluarga,
        tunjanganKeluarga: data.tunjanganKeluarga,
        insentifCuti: data.insentifCuti,
        tipKaca: data.tipKaca,
        grossSalary: grossSalary,
        attendanceCounts: data.counts,
        breakdown: {
          lateDeduction,
          absentDeduction,
          incompleteDeduction,
          totalDeductions
        },
        takeHomePay: takeHomePay,
        manualAdjustments: []
      };
    });

    const run = {
      id: 'PAY-' + Date.now(),
      periodName,
      targetUnit,
      startDate: startStr,
      endDate: endStr,
      generatedAt: new Date().toISOString(),
      status: 'CALCULATED',
      totals: {
        all: totalBangunan + totalPalen,
        bangunan: totalBangunan,
        palen: totalPalen
      },
      slips: slips,
      integritySeal: null
    };

    if (existingRunIndex > -1) {
      existingRuns[existingRunIndex] = run;
    } else {
      existingRuns.push(run);
    }

    savePayrolls(existingRuns);

    if (typeof Security !== 'undefined') {
      Security.audit('PAYROLL_CALCULATED', { periodName, totalSlips: slips.length }, 'INFO');
    }

    return run;
  }

  function transitionState(runId, newState) {
    checkPayrollAccess();

    const existing = getPayrolls();
    const run = existing.find(r => r.id === runId);
    if (!run) throw new Error("Payroll Run tidak ditemukan.");

    if (run.status === 'LOCKED') {
      if (typeof Security !== 'undefined') {
        Security.audit('LOCKED_PAYROLL_STATE_CHANGE_BLOCKED', { runId, attemptedState: newState }, 'CRITICAL');
      }
      throw new Error("Payroll yang sudah berstatus LOCKED bersifat permanen dan tidak dapat diubah statusnya.");
    }

    const validTransitions = {
      'CALCULATED': ['REVIEW', 'APPROVED'],
      'REVIEW': ['CALCULATED', 'APPROVED'],
      'APPROVED': ['REVIEW', 'LOCKED'],
      'LOCKED': [] // Immutable
    };

    if (!validTransitions[run.status] || !validTransitions[run.status].includes(newState)) {
      throw new Error(`Transisi status tidak valid dari ${run.status} ke ${newState}`);
    }

    run.status = newState;
    run.lastModified = new Date().toISOString();

    // If entering LOCKED state, generate cryptographic Integrity Seal
    if (newState === 'LOCKED') {
      if (typeof Security !== 'undefined' && Security.generateIntegritySeal) {
        run.integritySeal = Security.generateIntegritySeal({
          id: run.id,
          periodName: run.periodName,
          startDate: run.startDate,
          endDate: run.endDate,
          slips: run.slips
        });
      }

      if (typeof Security !== 'undefined') {
        Security.audit('PAYROLL_LOCKED_SEALED', { runId, seal: run.integritySeal }, 'INFO');
      }
    }
    
    savePayrolls(existing);
    return run;
  }

  function updateSlipSalaryComponents(runId, employeeId, updatedFields) {
    checkPayrollAccess();

    const existing = getPayrolls();
    const run = existing.find(r => r.id === runId);
    if (!run) throw new Error("Payroll Run tidak ditemukan.");

    // ENFORCE IMMUTABILITY: Past locked payrolls CANNOT be edited!
    if (run.status === 'LOCKED') {
      if (typeof Security !== 'undefined') {
        Security.audit('LOCKED_PAYROLL_EDIT_BLOCKED', { runId, employeeId }, 'CRITICAL');
      }
      throw new Error("Akses Ditolak: Payroll bulan sebelumnya yang sudah LOCKED (Terkunci Permanen) tidak dapat diubah!");
    }

    const slip = run.slips.find(s => s.employeeId === employeeId);
    if (!slip) throw new Error("Slip karyawan tidak ditemukan.");

    if (updatedFields.baseSalary !== undefined) slip.baseSalary = Number(updatedFields.baseSalary) || 0;
    if (updatedFields.gajiBagian !== undefined) slip.gajiBagian = Number(updatedFields.gajiBagian) || 0;
    if (updatedFields.hadiahPondok !== undefined) slip.hadiahPondok = Number(updatedFields.hadiahPondok) || 0;
    if (updatedFields.tipKaca !== undefined) slip.tipKaca = Number(updatedFields.tipKaca) || 0;
    if (updatedFields.tunjanganKeluarga !== undefined) slip.tunjanganKeluarga = Number(updatedFields.tunjanganKeluarga) || 0;
    if (updatedFields.insentifCuti !== undefined) slip.insentifCuti = Number(updatedFields.insentifCuti) || 0;
    if (updatedFields.bonusIncentive !== undefined) slip.bonusIncentive = Number(updatedFields.bonusIncentive) || 0;
    if (updatedFields.otherDeductions !== undefined) slip.otherDeductions = Number(updatedFields.otherDeductions) || 0;

    const grossSalary = slip.baseSalary + slip.gajiBagian + (slip.hadiahPondok || 0) + (slip.tipKaca || 0) + (slip.tunjanganKeluarga || 0) + (slip.insentifCuti || 0) + (slip.bonusIncentive || 0);
    const lateDed = slip.breakdown ? (slip.breakdown.lateDeduction || 0) : 0;
    const absDed = slip.breakdown ? (slip.breakdown.absentDeduction || 0) : 0;
    const totalDeductions = lateDed + absDed + (slip.otherDeductions || 0);

    slip.grossSalary = grossSalary;
    if (!slip.breakdown) slip.breakdown = { lateDeduction: lateDed, absentDeduction: absDed, incompleteDeduction: 0, totalDeductions: totalDeductions };
    else slip.breakdown.totalDeductions = totalDeductions;
    
    slip.takeHomePay = grossSalary - totalDeductions;

    let totalB = 0, totalP = 0;
    run.slips.forEach(s => {
      if (s.unit && s.unit.toLowerCase().includes('palen')) totalP += s.takeHomePay;
      else totalB += s.takeHomePay;
    });
    run.totals = { all: totalB + totalP, bangunan: totalB, palen: totalP };
    run.lastModified = new Date().toISOString();

    savePayrolls(existing);

    if (typeof Security !== 'undefined') {
      Security.audit('PAYROLL_SLIP_EDITED', { runId, employeeId, updatedFields }, 'INFO');
    }

    return run;
  }

  return {
    RULES,
    getPayrolls,
    generatePayroll,
    transitionState,
    updateSlipSalaryComponents
  };
})();

if (typeof window !== 'undefined') {
  window.PayrollEngine = PayrollEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PayrollEngine;
}
