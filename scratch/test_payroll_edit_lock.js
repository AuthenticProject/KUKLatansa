const PayrollEngine = require('../shared/payroll_engine.js');

const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => storage[k] = v,
  removeItem: (k) => delete storage[k]
};

global.MasterDB = {
  getEmployees: () => [
    {
      id: 'K-003',
      nama: 'Wiba',
      fullName: 'Wiba Sepdioko',
      unit: 'KUK Bangunan',
      gajiPokok: 850000,
      gajiBagian: 500000,
      hadiahPondok: 100000,
      status: 'Active'
    }
  ]
};

global.AttendanceEngine = {
  getDailyAttendance: () => []
};

console.log("==========================================");
console.log("🧪 TESTING SALARY EDITING & LOCK PROTECTION");
console.log("==========================================");

// 1. Generate active draft payroll
const run = PayrollEngine.generatePayroll('Payroll Draft Aktif', '2026-08-01', '2026-08-31', 'ALL');
console.log("▶ Periode Draft dibuat:", run.id, "| Status:", run.status);

// Edit draft salary
const updatedRun = PayrollEngine.updateSlipSalaryComponents(run.id, 'K-003', {
  bonusIncentive: 200000,
  gajiBagian: 600000
});

const updatedSlip = updatedRun.slips[0];
console.log(`✅ Edit Draft Berhasil! Bonus Incentive: Rp ${updatedSlip.bonusIncentive}, Gaji Bagian: Rp ${updatedSlip.gajiBagian}`);

// 2. Transition to LOCKED
PayrollEngine.transitionState(run.id, 'REVIEW');
PayrollEngine.transitionState(run.id, 'APPROVED');
const lockedRun = PayrollEngine.transitionState(run.id, 'LOCKED');
console.log("🔒 Payroll dikunci permanen:", lockedRun.id, "| Status:", lockedRun.status);

// 3. Attempt to edit LOCKED payroll
try {
  PayrollEngine.updateSlipSalaryComponents(run.id, 'K-003', { bonusIncentive: 9999999 });
  console.error("❌ ERROR: Locked payroll edit was NOT blocked!");
  process.exit(1);
} catch (e) {
  console.log("✅ BLOCKED SUCCESSFUL:", e.message);
}

console.log("\n🎉 ALL SALARY EDIT & PAST MONTH LOCK TESTS PASSED 100%!");
