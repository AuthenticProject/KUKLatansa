const PayrollEngine = require('../shared/payroll_engine.js');

// Mock localStorage and MasterDB for testing
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
      insentifCuti: 50000,
      sudahBerkeluarga: true,
      status: 'Active'
    }
  ]
};

global.AttendanceEngine = {
  getDailyAttendance: (date) => {
    if (date === '2026-08-05') return [{ employeeId: 'K-003', status: 'LATE' }];
    if (date === '2026-08-12') return [{ employeeId: 'K-003', status: 'ABSENT' }];
    return [];
  }
};

// Mock tip kaca
storage['kuk_db_tip_v1'] = JSON.stringify([
  { namaKaryawan: 'Wiba Sepdioko', nominalTip: 150000, tanggal: '2026-08-10' }
]);

console.log("==========================================");
console.log("🧪 TESTING KUK HR PORTAL SALARY FORMULA");
console.log("==========================================");

const run = PayrollEngine.generatePayroll('Payroll Agustus 2026', '2026-08-01', '2026-08-31', 'ALL');
const slip = run.slips[0];

console.log(`Karyawan: ${slip.employeeName}`);
console.log(`Gaji Pokok: Rp ${slip.baseSalary.toLocaleString()}`);
console.log(`Gaji Bagian: Rp ${slip.gajiBagian.toLocaleString()}`);
console.log(`Hadiah Pondok: Rp ${slip.hadiahPondok.toLocaleString()}`);
console.log(`Tip Kaca: Rp ${slip.tipKaca.toLocaleString()}`);
console.log(`Tunjangan Berkeluarga: Rp ${slip.tunjanganKeluarga.toLocaleString()}`);
console.log(`Insentif Cuti: Rp ${slip.insentifCuti.toLocaleString()}`);
console.log(`Potongan Late (1x): Rp ${slip.breakdown.lateDeduction.toLocaleString()}`);
console.log(`Potongan Alpa (1x): Rp ${slip.breakdown.absentDeduction.toLocaleString()}`);
console.log(`Potongan Incomplete: Rp ${slip.breakdown.incompleteDeduction.toLocaleString()}`);
console.log(`Total Take Home Pay: Rp ${slip.takeHomePay.toLocaleString()}`);

// Expected:
// Gaji Pokok (850.000) - (28.500 x 1) - (2.500 x 1) + Gaji Bagian (500.000) + Hadiah Pondok (100.000) + Tip (150.000) + Berkeluarga (50.000) + Insentif Cuti (50.000)
// = 850.000 - 28.500 - 2.500 + 500.000 + 100.000 + 150.000 + 50.000 + 50.000 = 1.669.000

const expectedTHP = 850000 - 28500 - 2500 + 500000 + 100000 + 150000 + 50000 + 50000;
if (slip.takeHomePay === expectedTHP && slip.breakdown.lateDeduction === 2500 && slip.breakdown.absentDeduction === 28500 && slip.breakdown.incompleteDeduction === 0) {
  console.log("\n🎉 SALARY FORMULA TEST PASSED 100% MATCHING KUK HR PORTAL!");
} else {
  console.error(`❌ FORMULA TEST FAILED! Got ${slip.takeHomePay}, Expected ${expectedTHP}`);
  process.exit(1);
}
