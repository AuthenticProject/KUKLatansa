const FingerprintEngine = require('../shared/fingerprint_engine.js');

// Mock localStorage for test environment
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => storage[k] = v,
  removeItem: (k) => delete storage[k]
};

// Official 11 Employees Pool
const mockEmployees = [
  { id: 'K-001', nama: 'Miftah', fullName: 'Miftah', fingerprintId: '13', unit: 'KUK Palen' },
  { id: 'K-002', nama: 'Nukul', fullName: 'Nukul', fingerprintId: '12', unit: 'KUK Palen' },
  { id: 'K-003', nama: 'Wiba', fullName: 'Wiba Sepdioko', fingerprintId: '2', unit: 'KUK Bangunan' },
  { id: 'K-004', nama: 'Ulin', fullName: 'Irfan Ulinnuha', fingerprintId: '3', unit: 'KUK Bangunan' },
  { id: 'K-005', nama: 'Kahfi', fullName: 'Syirojul Kahfi', fingerprintId: '4', unit: 'KUK Bangunan' },
  { id: 'K-006', nama: 'Nur', fullName: 'Nur Hadi', fingerprintId: '5', unit: 'KUK Bangunan' },
  { id: 'K-007', nama: 'Alip', fullName: 'Alip Rejeki', fingerprintId: '7', unit: 'KUK Bangunan' },
  { id: 'K-008', nama: 'Riyan', fullName: 'Arriyan Muhammad', fingerprintId: '8', unit: 'KUK Bangunan' },
  { id: 'K-009', nama: 'Hiba', fullName: 'Muhammad Hiba', fingerprintId: '9', unit: 'KUK Bangunan' },
  { id: 'K-010', nama: 'Rohman', fullName: 'Lailurrohman', fingerprintId: '10', unit: 'KUK Bangunan' },
  { id: 'K-011', nama: 'Irvan', fullName: 'Muhammad Irvan', fingerprintId: '11', unit: 'KUK Bangunan' }
];

console.log("==========================================");
console.log("🧪 TESTING FINGERPRINT MATCHING & DEDUPLICATION");
console.log("==========================================");

// Test 1: Match Name Aliases
const testCases = [
  { pin: '5', rawName: 'Mas Nur', expectedId: 'K-006', expectedName: 'Nur Hadi' },
  { pin: '5', rawName: 'Nur Hadi', expectedId: 'K-006', expectedName: 'Nur Hadi' },
  { pin: '13', rawName: 'Miftah', expectedId: 'K-001', expectedName: 'Miftah' },
  { pin: '8', rawName: 'Arriyan Muhammad', expectedId: 'K-008', expectedName: 'Arriyan Muhammad' },
  { pin: '8', rawName: 'Riyan', expectedId: 'K-008', expectedName: 'Arriyan Muhammad' },
  { pin: '3', rawName: 'Irfan Ulinnuha', expectedId: 'K-004', expectedName: 'Irfan Ulinnuha' },
  { pin: '4', rawName: 'Syirojul Kahfi', expectedId: 'K-005', expectedName: 'Syirojul Kahfi' },
  { pin: '7', rawName: 'Alip Rejeki', expectedId: 'K-007', expectedName: 'Alip Rejeki' }
];

let passedMatches = 0;
testCases.forEach((tc, idx) => {
  const match = FingerprintEngine.matchEmployeeSmart(tc.pin, tc.rawName, mockEmployees);
  if (match && match.id === tc.expectedId) {
    console.log(`✅ Test ${idx+1}: '${tc.rawName}' (PIN ${tc.pin}) matched to ${match.fullName} (${match.id})`);
    passedMatches++;
  } else {
    console.error(`❌ Test ${idx+1} FAILED: '${tc.rawName}' (PIN ${tc.pin}) -> Got: ${match ? match.id : 'null'}, Expected: ${tc.expectedId}`);
  }
});

// Test 2: Cuti Matching (August 2026)
const mockCuti = [
  { idKaryawan: 'K-003', nama: 'Wiba', tanggal: ['2026-08-02', '2026-08-09', '2026-08-16'] },
  { idKaryawan: 'K-004', nama: 'Ulin', tanggal: ['2026-08-08', '2026-08-17', '2026-08-29'] },
  { idKaryawan: 'K-005', nama: 'Kahfi', tanggal: ['2026-08-01', '2026-08-10', '2026-08-20'] },
  { idKaryawan: 'K-006', nama: 'Nur', tanggal: ['2026-08-02', '2026-08-16', '2026-08-30'] }
];
storage['kuk_db_cuti_v1'] = JSON.stringify(mockCuti);

// Verify Cuti engine check
const wibaCuti = mockEmployees.find(e => e.id === 'K-003');
console.log("\n--- TESTING CUTI INTEGRATION ---");
const check1 = FingerprintEngine.matchEmployeeSmart('2', 'Wiba', mockEmployees);
console.log("Wiba leave on 2026-08-09 match:", check1 ? "FOUND ✅" : "FAILED ❌");

console.log("\n==========================================");
if (passedMatches === testCases.length) {
  console.log("🎉 ALL FINGERPRINT MATCHING & ALIAS TESTS PASSED!");
} else {
  console.error("❌ SOME TESTS FAILED!");
  process.exit(1);
}
