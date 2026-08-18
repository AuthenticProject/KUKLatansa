/**
 * payroll_engine.js
 * Rule-based, snapshot-safe payroll engine.
 */

const PayrollEngine = (() => {
  const DB_KEY = 'kuk_payroll_db';

  const RULES = {
    default_base_salary: 3000000,
    late_deduction_rate: 15000,
    absent_deduction_rate: 50000,
    incomplete_deduction_rate: 20000
  };

  function getPayrolls() {
    return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
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

  /**
   * Generates or Regenerates a Payroll Run for a specific period.
   */
  function generatePayroll(periodName, startStr, endStr) {
    if (typeof AttendanceEngine === 'undefined') {
      throw new Error("AttendanceEngine not loaded");
    }

    const existingRuns = getPayrolls();
    // Check if this period already exists and is locked
    const existingRunIndex = existingRuns.findIndex(r => r.periodName === periodName);
    if (existingRunIndex > -1 && existingRuns[existingRunIndex].status === 'LOCKED') {
      throw new Error("Cannot regenerate a LOCKED payroll period.");
    }

    const dates = getDatesInRange(startStr, endStr);
    
    // employeeId -> aggregate data
    const empData = {};
    const employees = typeof MasterDB !== 'undefined' ? MasterDB.getEmployees() : [];

    // Initialize all active employees
    employees.forEach(emp => {
      if (emp.status === 'Active') {
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
        manualAdjustments: [] // For post-lock or pre-lock manual fixes
      };
    });

    const run = {
      id: 'PAY-' + Date.now(),
      periodName,
      startDate: startStr,
      endDate: endStr,
      generatedAt: new Date().toISOString(),
      status: 'CALCULATED',
      slips: slips
    };

    if (existingRunIndex > -1) {
      existingRuns[existingRunIndex] = run;
    } else {
      existingRuns.push(run);
    }

    savePayrolls(existingRuns);
    return run;
  }

  function transitionState(runId, newState) {
    const existing = getPayrolls();
    const run = existing.find(r => r.id === runId);
    if (!run) throw new Error("Payroll Run not found");

    const validTransitions = {
      'CALCULATED': ['REVIEW', 'APPROVED'],
      'REVIEW': ['CALCULATED', 'APPROVED'],
      'APPROVED': ['REVIEW', 'LOCKED'],
      'LOCKED': [] // Immutable
    };

    if (!validTransitions[run.status].includes(newState)) {
      throw new Error(\`Invalid transition from \${run.status} to \${newState}\`);
    }

    run.status = newState;
    run.lastModified = new Date().toISOString();
    
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
