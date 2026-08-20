// Mock browser environment for engines
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

console.log('Testing MasterDB...');
const MasterDB = require('../shared/master_db.js');
MasterDB.init();

const emps = MasterDB.getEmployees();
console.log('Employees Count (Workforce):', emps.length);
if (emps.length < 11) throw new Error('Employees count should be at least 11');

const users = MasterDB.getUsers();
console.log('Users Count (Management Staff):', users.length);
if (users.length < 12) throw new Error('Users count should be at least 12');

console.log('Sample Employee:', emps[0].fullName, '-', emps[0].unit, '-', emps[0].position);
console.log('Sample User:', users[0].username, '-', users[0].namaLengkap, '-', users[0].role);

console.log('\nTesting AttendanceEngine...');
const AttendanceEngine = require('../shared/attendance_engine.js');
const att = AttendanceEngine.getDailyAttendance('2026-08-20');
console.log('Daily Attendance records for today:', att.length);

console.log('\nTesting ViolationEngine...');
const ViolationEngine = require('../shared/violation_engine.js');
const viols = ViolationEngine.getViolations();
console.log('Violations Count:', viols.length);

console.log('\nTesting PayrollEngine...');
const PayrollEngine = require('../shared/payroll_engine.js');
const payrolls = PayrollEngine.getPayrolls();
console.log('Payrolls Count:', payrolls.length);

console.log('\nTesting DashboardEngine...');
const DashboardEngine = require('../shared/dashboard_engine.js');
const metrics = DashboardEngine.getMetrics();
console.log('Dashboard Metrics:', {
  headcount: metrics.headcount,
  attendanceRate: metrics.attendance.rate,
  pending: metrics.pending,
  armada: metrics.armada
});

const comp = DashboardEngine.getUnitComparison();
console.log('Unit Comparison:', {
  bangunan: comp.bangunan.name,
  palen: comp.palen.name
});

console.log('\nALL ENGINES & DATA STORES VERIFIED SUCCESSFULLY!');
