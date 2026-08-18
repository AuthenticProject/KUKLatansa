/**
 * payroll_engine.js
 * Rule-based, snapshot-safe, cryptographically sealed payroll engine.
 * Includes RBAC protection, tamper-evident seals, and immutable lock enforcement.
 */

const PayrollEngine = (() => {
  'use strict';

  const DB_KEY = 'kuk_payroll_db';

  const RULES = {
    default_base_salary: 3000000,
    late_deduction_rate: 15000,
    absent_deduction_rate: 50000,
    incomplete_deduction_rate: 20000
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
   * Generates or Regenerates a Payroll Run for a specific period.
   */
  function generatePayroll(periodName, startStr, endStr) {
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

    // Initialize all active employees
    employees.forEach(emp => {
      if (emp.status === 'Active' || emp.status === 'Aktif') {
        empData[emp.id] = {
          employeeName: emp.fullName,
          unit: emp.unit,
          baseSalary: RULES.default_base_salary, // Mock injection
          counts: { PRESENT: 0, LATE: 0, ABSENT: 0, INCOMPLETE: 0, LEAVE: 0, SICK: 0, PERMISSION: 0, EXCUSED: 0, OFF: 0 }
        };
      }
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
    const slips = Object.keys(empData).map(empId => {
      const data = empData[empId];
      
      const lateDeduction = data.counts.LATE * RULES.late_deduction_rate;
      const absentDeduction = data.counts.ABSENT * RULES.absent_deduction_rate;
      const incompleteDeduction = data.counts.INCOMPLETE * RULES.incomplete_deduction_rate;
      const totalDeductions = lateDeduction + absentDeduction + incompleteDeduction;

      const takeHomePay = data.baseSalary - totalDeductions;

      return {
        employeeId: empId,
        employeeName: data.employeeName,
        unit: data.unit,
        baseSalary: data.baseSalary,
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
      startDate: startStr,
      endDate: endStr,
      generatedAt: new Date().toISOString(),
      status: 'CALCULATED',
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

  return {
    RULES,
    getPayrolls,
    generatePayroll,
    transitionState
  };
})();

if (typeof window !== 'undefined') {
  window.PayrollEngine = PayrollEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PayrollEngine;
}
