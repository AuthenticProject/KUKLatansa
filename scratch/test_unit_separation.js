// Mock environment for node execution
global.window = global;
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};
global.sessionStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};
global.document = {
  querySelectorAll() { return []; },
  getElementById() { return null; },
  addEventListener() {}
};

console.log('=== TEST 1: MasterDB Employees Unit Separation ===');
const MasterDB = require('../shared/master_db.js');
MasterDB.init();

const allEmps = MasterDB.getEmployees();
const bEmps = allEmps.filter(e => e.unit && e.unit.includes('Bangunan'));
const pEmps = allEmps.filter(e => e.unit && e.unit.includes('Palen'));

console.log(`Total Employees: ${allEmps.length}`);
console.log(`Bangunan Employees (${bEmps.length}):`, bEmps.map(e => e.fullName).join(', '));
console.log(`Palen Employees (${pEmps.length}):`, pEmps.map(e => e.fullName).join(', '));

if (bEmps.length !== 9 || pEmps.length !== 2) {
  throw new Error('Employee unit breakdown mismatch! Expected 9 Bangunan and 2 Palen.');
}

console.log('\n=== TEST 2: MasterDB Staff / Users Unit Separation ===');
const allUsers = MasterDB.getUsers();
const bUsers = allUsers.filter(u => (u.toko || 'bangunan') === 'bangunan');
const pUsers = allUsers.filter(u => u.toko === 'palen');

console.log(`Total Staff Users: ${allUsers.length}`);
console.log(`Bangunan Staff (${bUsers.length}):`, bUsers.map(u => u.username).join(', '));
console.log(`Palen Staff (${pUsers.length}):`, pUsers.map(u => u.username).join(', '));

if (bUsers.length !== 7 || pUsers.length !== 5) {
  throw new Error('Staff user unit breakdown mismatch! Expected 7 Bangunan and 5 Palen.');
}

console.log('\n=== TEST 3: AttendanceEngine Unit Filtering ===');
const AttendanceEngine = require('../shared/attendance_engine.js');
const attAll = AttendanceEngine.getDailyAttendance('2026-08-20', 'ALL');
const attB = AttendanceEngine.getDailyAttendance('2026-08-20', 'KUK Bangunan');
const attP = AttendanceEngine.getDailyAttendance('2026-08-20', 'KUK Palen');

console.log(`Daily Attendance ALL: ${attAll.length} records`);
console.log(`Daily Attendance Bangunan: ${attB.length} records`);
console.log(`Daily Attendance Palen: ${attP.length} records`);

if (attB.length !== 9 || attP.length !== 2) {
  throw new Error('Attendance unit filtering mismatch!');
}

console.log('\n=== TEST 4: ViolationEngine Unit Separation ===');
const ViolationEngine = require('../shared/violation_engine.js');
ViolationEngine.runDailyScan('2026-08-20');
const violsB = ViolationEngine.getViolations('KUK Bangunan');
const violsP = ViolationEngine.getViolations('KUK Palen');
console.log(`Violations Bangunan: ${violsB.length}, Palen: ${violsP.length}`);

console.log('\n=== TEST 5: PayrollEngine Unit Separation & Totals ===');
const PayrollEngine = require('../shared/payroll_engine.js');

// Seed mock tip kaca for Bangunan employee Wiba
localStorage.setItem('kuk_db_tip_v1', JSON.stringify([
  {
    id: 'TIP-101',
    namaKaryawan: 'Wiba',
    nominalTip: 150000,
    tanggal: '2026-08-15',
    unit: 'KUK Bangunan'
  }
]));

const runAll = PayrollEngine.generatePayroll('Periode Agustus 2026', '2026-08-01', '2026-08-31', 'ALL');
console.log('Payroll Run Generated:', {
  period: runAll.periodName,
  slipsCount: runAll.slips.length,
  totals: runAll.totals
});

const wibaSlip = runAll.slips.find(s => s.employeeName === 'Wiba');
console.log('Wiba Slip (Bangunan + Tip Kaca):', {
  baseSalary: wibaSlip.baseSalary,
  tipKaca: wibaSlip.tipKaca,
  takeHomePay: wibaSlip.takeHomePay
});

const nukulSlip = runAll.slips.find(s => s.employeeName === 'Nukul');
console.log('Nukul Slip (Palen, Tanpa Tip Kaca):', {
  baseSalary: nukulSlip.baseSalary,
  tipKaca: nukulSlip.tipKaca,
  takeHomePay: nukulSlip.takeHomePay
});

if (wibaSlip.tipKaca !== 150000 || nukulSlip.tipKaca !== 0) {
  throw new Error('Tip kaca component unit separation failed!');
}

console.log('\n=== TEST 6: DashboardEngine Unit Comparison ===');
const DashboardEngine = require('../shared/dashboard_engine.js');
const comp = DashboardEngine.getUnitComparison('2026-08-20');
console.log('Unit Comparison Output:', comp);

console.log('\n=============================================');
console.log('✅ ALL UNIT SEPARATION TESTS PASSED WITH 100% SUCCESS!');
console.log('=============================================');
