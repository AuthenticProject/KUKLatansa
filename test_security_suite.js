/**
 * test_security_suite.js
 * Comprehensive automated security, RBAC, isolation, and audit verification suite for KUK La Tansa.
 */

const fs = require('fs');

// Mock browser environment
const localStorageStore = {};
const sessionStorageStore = {};

global.localStorage = {
  getItem(k) { return localStorageStore[k] || null; },
  setItem(k, v) { localStorageStore[k] = String(v); },
  removeItem(k) { delete localStorageStore[k]; },
  clear() { for (let k in localStorageStore) delete localStorageStore[k]; }
};

global.sessionStorage = {
  getItem(k) { return sessionStorageStore[k] || null; },
  setItem(k, v) { sessionStorageStore[k] = String(v); },
  removeItem(k) { delete sessionStorageStore[k]; },
  clear() { for (let k in sessionStorageStore) delete sessionStorageStore[k]; }
};

// Load Modules
const Security = require('./shared/security.js');
const MasterDB = require('./shared/master_db.js');
const FingerprintEngine = require('./shared/fingerprint_engine.js');
const AttendanceEngine = require('./shared/attendance_engine.js');
const PayrollEngine = require('./shared/payroll_engine.js');

global.Security = Security;
global.MasterDB = MasterDB;
global.FingerprintEngine = FingerprintEngine;
global.AttendanceEngine = AttendanceEngine;
global.PayrollEngine = PayrollEngine;

// Initialize MasterDB
MasterDB.init();

const results = [];

function assert(testName, condition, details = '') {
  results.push({
    test: testName,
    status: condition ? 'PASSED ✅' : 'FAILED ❌',
    details: details
  });
}

console.log('\n======================================================');
console.log('🔒 RUNNING KUK LA TANSA SECURITY & HARDENING TEST SUITE');
console.log('======================================================\n');

// -------------------------------------------------------------------
// TEST 1: UNAUTHORIZED DASHBOARD ACCESS
// -------------------------------------------------------------------
sessionStorage.clear();
const authNoSession = Security.validateSession();
assert(
  '1. Unauthorized Dashboard Access Blocked',
  authNoSession.valid === false && authNoSession.reason === 'NO_SESSION',
  'Unauthenticated visitor is rejected'
);

// -------------------------------------------------------------------
// TEST 2: PUBLIC FORM DATA ISOLATION & ZERO SENSITIVE LEAKAGE
// -------------------------------------------------------------------
const publicEmployees = MasterDB.getPublicEmployeeList();
const hasSensitiveField = publicEmployees.some(e => 
  e.nik !== undefined || 
  e.salary !== undefined || 
  e.baseSalary !== undefined || 
  e.fingerprintId !== undefined ||
  e.phone !== undefined ||
  e.password !== undefined
);
const hasSafeFields = publicEmployees.every(e => e.id && e.fullName && e.unit && e.position);

assert(
  '2. Public Form Data Isolation (Zero Private Leakage)',
  !hasSensitiveField && hasSafeFields,
  `Public dropdown only exposes id, fullName, unit, position (Total: ${publicEmployees.length} safe items)`
);

// -------------------------------------------------------------------
// TEST 3: ROLE ESCALATION ATTEMPT DETECTION
// -------------------------------------------------------------------
// Set fake session claiming to be super_admin while database user is hr_admin
sessionStorage.setItem('kuk_user', JSON.stringify({
  username: 'andika', // andika is hr_admin in DB
  role: 'super_admin', // DevTools hacked role
  loginAt: new Date().toISOString()
}));

const escalationCheck = Security.validateSession();
const auditLogsAfterEscalation = Security.getAuditLogs(10, 'CRITICAL');
const escalationAudited = auditLogsAfterEscalation.some(l => l.action === 'ROLE_ESCALATION_ATTEMPT');

assert(
  '3. Role Escalation Anti-Tamper Guard',
  escalationCheck.valid === false && escalationCheck.reason === 'ROLE_TAMPERING_DETECTED' && escalationAudited && sessionStorage.getItem('kuk_user') === null,
  'Hacked role in sessionStorage was intercepted, purged, and logged as CRITICAL security audit'
);

// -------------------------------------------------------------------
// TEST 4: INVALID FILE UPLOAD VALIDATION (SIZE & EXTENSION)
// -------------------------------------------------------------------
let oversizeRejected = false;
try {
  FingerprintEngine.validateFileMetadata({ name: 'attendance.xlsx', size: 10 * 1024 * 1024 }); // 10MB
} catch (e) {
  oversizeRejected = e.message.includes('melebihi batas maksimal');
}

let badExtRejected = false;
try {
  FingerprintEngine.validateFileMetadata({ name: 'malware.exe', size: 1024 });
} catch (e) {
  badExtRejected = e.message.includes('tidak didukung');
}

assert(
  '4. File Upload Validation (Oversize & Bad Extension Blocked)',
  oversizeRejected && badExtRejected,
  'Rejected 10MB oversized file and .exe extension upload attempt'
);

// -------------------------------------------------------------------
// TEST 5: MALFORMED / EMPTY EXCEL STRUCTURE HANDLING
// -------------------------------------------------------------------
let malformedCaught = false;
try {
  FingerprintEngine.mapColumnsAndValidate([]);
} catch (e) {
  malformedCaught = true;
}

let missingColsCaught = false;
try {
  FingerprintEngine.mapColumnsAndValidate([{ RandomHeader: '123', OtherHeader: 'ABC' }]);
} catch (e) {
  missingColsCaught = e.message.includes('Struktur kolom tidak sesuai standar');
}

assert(
  '5. Malformed Excel Structural Validation',
  malformedCaught && missingColsCaught,
  'Gracefully caught empty rows and missing PIN/Date/Time headers'
);

// -------------------------------------------------------------------
// TEST 6: DUPLICATE IMPORT DETECTION & IMMUTABILITY
// -------------------------------------------------------------------
localStorage.setItem('kuk_raw_fingerprints', JSON.stringify([
  { pin: '101', date: '2026-08-18', time: '07:55:00', employeeId: 'EMP-001', employeeName: 'Test Emp' }
]));

const testRows = [
  { PIN: '101', Tanggal: '2026-08-18', Jam: '07:55:00' }, // Exact duplicate
  { PIN: '101', Tanggal: '2026-08-18', Jam: '17:05:00' }  // New valid clock-out
];

const validationStats = FingerprintEngine.mapColumnsAndValidate(testRows);
assert(
  '6. Duplicate Fingerprint Row Detection',
  validationStats.duplicates === 1 && validationStats.total === 2 && validationStats.processedRows.length === 1,
  'Skipped duplicate punch (07:55:00) and accepted new punch (17:05:00)'
);

// -------------------------------------------------------------------
// TEST 7: CONCURRENT IMPORT COLLISION LOCKING
// -------------------------------------------------------------------
const lock1 = Security.acquireLock('FINGERPRINT_IMPORT_LOCK', 10000);
const lock2 = Security.acquireLock('FINGERPRINT_IMPORT_LOCK', 10000); // Should fail due to lock1
Security.releaseLock('FINGERPRINT_IMPORT_LOCK');
const lock3 = Security.acquireLock('FINGERPRINT_IMPORT_LOCK', 10000); // Should succeed after release
Security.releaseLock('FINGERPRINT_IMPORT_LOCK');

assert(
  '7. Concurrency & Transaction Lock Protection',
  lock1.acquired === true && lock2.acquired === false && lock3.acquired === true,
  'Prevented concurrent overlapping imports using atomic lock'
);

// -------------------------------------------------------------------
// TEST 8: SENSITIVE PAYROLL LOCKING & IMMUTABILITY
// -------------------------------------------------------------------
// Login as super_admin
sessionStorage.setItem('kuk_user', JSON.stringify({ username: 'fariz', role: 'super_admin' }));

const payrollRun = PayrollEngine.generatePayroll('Periode Keamanan 2026', '2026-08-01', '2026-08-05');
PayrollEngine.transitionState(payrollRun.id, 'REVIEW');
PayrollEngine.transitionState(payrollRun.id, 'APPROVED');
const lockedRun = PayrollEngine.transitionState(payrollRun.id, 'LOCKED');

let lockedRecalcBlocked = false;
try {
  PayrollEngine.generatePayroll('Periode Keamanan 2026', '2026-08-01', '2026-08-05');
} catch (e) {
  lockedRecalcBlocked = e.message.includes('LOCKED');
}

let lockedStateChangeBlocked = false;
try {
  PayrollEngine.transitionState(lockedRun.id, 'REVIEW');
} catch (e) {
  lockedStateChangeBlocked = e.message.includes('LOCKED');
}

const sealValid = Security.verifyIntegritySeal({
  id: lockedRun.id,
  periodName: lockedRun.periodName,
  startDate: lockedRun.startDate,
  endDate: lockedRun.endDate,
  slips: lockedRun.slips
}, lockedRun.integritySeal);

assert(
  '8. Sensitive Payroll Locking & Cryptographic Integrity Seal',
  lockedRun.status === 'LOCKED' && lockedRecalcBlocked && lockedStateChangeBlocked && sealValid && lockedRun.integritySeal !== null,
  `Payroll snapshot sealed (${lockedRun.integritySeal}) and protected against post-lock tampering`
);

// -------------------------------------------------------------------
// TEST 9: AUDIT TRAIL INTEGRITY & RATE LIMITING
// -------------------------------------------------------------------
// Test rate limiter
let rateAllowedCount = 0;
let rateBlocked = false;
for (let i = 0; i < 7; i++) {
  const r = Security.checkRateLimit('test_rate_action', { maxAttempts: 5, windowMs: 10000 });
  if (r.allowed) rateAllowedCount++;
  else rateBlocked = true;
}

const allAuditLogs = Security.getAuditLogs(50);
const hasAudits = allAuditLogs.length > 5;

assert(
  '9. Audit Trail Integrity & Rate Limiting Enforcement',
  rateAllowedCount === 5 && rateBlocked && hasAudits,
  `Rate limiter capped at 5 attempts, and recorded ${allAuditLogs.length} security audit events`
);

console.log('\n--- TEST RESULTS SUMMARY ---');
console.table(results);

const allPassed = results.every(r => r.status.includes('PASSED'));
console.log('\n======================================================');
console.log(allPassed ? '🎉 ALL 9 SECURITY HARDENING TESTS PASSED SUCCESSFULLY! ✅' : '❌ SOME TESTS FAILED');
console.log('======================================================\n');

process.exit(allPassed ? 0 : 1);
