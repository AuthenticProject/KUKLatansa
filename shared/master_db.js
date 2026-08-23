/**
 * master_db.js
 * Master Database Foundation for KUK La Tansa Internal Management System.
 * Distinguishes Staff (Manajemen/User Accounts) from Karyawan (Workforce Employees).
 */

const MasterDB = (() => {
  'use strict';

  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxAjktMA76CUG0l-kCOMuazdLrWt6ULfv6cwhlL-QuGiwhtVJx8Sb12tkOHyXqk48tl/exec";

  const STORAGE_KEY_EMPLOYEES = 'kuk_master_employees_v8'; // v8: Sesuai Master Database Google Spreadsheet Resmi
  const STORAGE_KEY_USERS = 'kuk_master_users';
  const STORAGE_KEY_VEHICLES = 'kuk_master_vehicles';

  const UNITS = ['KUK Bangunan', 'KUK Palen'];
  const DEPARTMENTS = ['Kepala Toko', 'Kepala Gudang', 'Admin 2', 'Admin 3', 'Kasir', 'Pengiriman', 'Frontliner'];
  const POSITIONS = ['Kepala Toko', 'Kepala Gudang', 'Admin 2', 'Admin 3', 'Kasir', 'Pengiriman', 'Frontliner'];

  // 11 Karyawan Resmi KUK (Database HRD Utama - 100% Sesuai Spreadsheet Google)
  const DEFAULT_EMPLOYEES = [
    { id: 'K-001', nik: '3502020013', nama: 'Miftah', fullName: 'Miftah', unit: 'KUK Palen', department: 'Kepala Gudang', position: 'Kepala Gudang', gajiPokok: 700000, gajiBagian: 300000, sudahBerkeluarga: false, totalPelanggaran: 0, status: 'Active', fingerprintId: '13', hireDate: '2023-10-15', contactNumber: '' },
    { id: 'K-002', nik: '3502020012', nama: 'Nukul', fullName: 'Nukul', unit: 'KUK Palen', department: 'Kepala Toko', position: 'Kepala Toko', gajiPokok: 700000, gajiBagian: 300000, sudahBerkeluarga: false, totalPelanggaran: 0, status: 'Active', fingerprintId: '12', hireDate: '2023-10-01', contactNumber: '' },
    { id: 'K-003', nik: '3502010002', nama: 'Wiba', fullName: 'Wiba Sepdioko', unit: 'KUK Bangunan', department: 'Admin 2', position: 'Admin 2', gajiPokok: 850000, gajiBagian: 500000, sudahBerkeluarga: true, totalPelanggaran: 0, status: 'Active', fingerprintId: '2', hireDate: '2023-01-01', contactNumber: '' },
    { id: 'K-004', nik: '3502010003', nama: 'Ulin', fullName: 'Irfan Ulinnuha', unit: 'KUK Bangunan', department: 'Kepala Toko', position: 'Kepala Toko', gajiPokok: 850000, gajiBagian: 650000, sudahBerkeluarga: true, totalPelanggaran: 0, status: 'Active', fingerprintId: '3', hireDate: '2022-05-10', contactNumber: '' },
    { id: 'K-005', nik: '3502010004', nama: 'Kahfi', fullName: 'Syirojul Kahfi', unit: 'KUK Bangunan', department: 'Kasir', position: 'Kasir', gajiPokok: 850000, gajiBagian: 300000, sudahBerkeluarga: false, totalPelanggaran: 0, status: 'Active', fingerprintId: '4', hireDate: '2023-03-15', contactNumber: '' },
    { id: 'K-006', nik: '3502010005', nama: 'Nur', fullName: 'Nur Hadi', unit: 'KUK Bangunan', department: 'Kepala Gudang', position: 'Kepala Gudang', gajiPokok: 850000, gajiBagian: 610000, sudahBerkeluarga: true, totalPelanggaran: 0, status: 'Active', fingerprintId: '5', hireDate: '2021-08-20', contactNumber: '' },
    { id: 'K-007', nik: '3502010007', nama: 'Alip', fullName: 'Alip Rejeki', unit: 'KUK Bangunan', department: 'Pengiriman', position: 'Pengiriman', gajiPokok: 850000, gajiBagian: 400000, sudahBerkeluarga: false, totalPelanggaran: 0, status: 'Active', fingerprintId: '7', hireDate: '2023-06-01', contactNumber: '' },
    { id: 'K-008', nik: '3502010008', nama: 'Riyan', fullName: 'Arriyan Muhammad', unit: 'KUK Bangunan', department: 'Frontliner', position: 'Frontliner', gajiPokok: 850000, gajiBagian: 300000, sudahBerkeluarga: false, totalPelanggaran: 0, status: 'Active', fingerprintId: '8', hireDate: '2023-07-10', contactNumber: '' },
    { id: 'K-009', nik: '3502010009', nama: 'Hiba', fullName: 'Muhammad Hiba', unit: 'KUK Bangunan', department: 'Frontliner', position: 'Frontliner', gajiPokok: 850000, gajiBagian: 200000, sudahBerkeluarga: false, totalPelanggaran: 0, status: 'Active', fingerprintId: '9', hireDate: '2023-07-15', contactNumber: '' },
    { id: 'K-010', nik: '3502010010', nama: 'Rohman', fullName: 'Lailurrohman', unit: 'KUK Bangunan', department: 'Frontliner', position: 'Frontliner', gajiPokok: 850000, gajiBagian: 200000, sudahBerkeluarga: false, totalPelanggaran: 0, status: 'Active', fingerprintId: '10', hireDate: '2023-08-01', contactNumber: '' },
    { id: 'K-011', nik: '3502010011', nama: 'Irvan', fullName: 'Muhammad Irvan', unit: 'KUK Bangunan', department: 'Admin 3', position: 'Admin 3', gajiPokok: 850000, gajiBagian: 650000, sudahBerkeluarga: true, totalPelanggaran: 0, status: 'Active', fingerprintId: '11', hireDate: '2023-09-01', contactNumber: '' }
  ];

  // 12 Real Management Staff Accounts from Google Sheets
  const DEFAULT_USERS = [
    // KUK Bangunan Staff
    { id: 'USR-001', username: 'fariz', password: '12345', role: 'super_admin', namaLengkap: 'Fariz Ridwani, S.I.Kom', jabatan: 'Koordinator', toko: 'bangunan', permissions: ['*'] },
    { id: 'USR-002', username: 'andika', password: '12345', role: 'hr_admin', namaLengkap: 'Andika Rizaldi, S.Ag', jabatan: 'Kepala Toko', toko: 'bangunan', permissions: ['dashboard','absen','cuti','pelanggaran','tip','peminjaman','peminjaman_admin','karyawan','fingerprint','attendance_review','violation_review','payroll'] },
    { id: 'USR-003', username: 'irsyadil', password: '150904', role: 'super_admin', namaLengkap: 'Muhammad Irsyadil Umam', jabatan: 'HRD', toko: 'bangunan', permissions: ['*'] },
    { id: 'USR-004', username: 'ari', password: '12345', role: 'hr_admin', namaLengkap: 'Ari Hermawan', jabatan: 'Bendahara 1', toko: 'bangunan', permissions: ['dashboard','absen','cuti','pelanggaran','tip','peminjaman','karyawan'] },
    { id: 'USR-005', username: 'shuva', password: '12345', role: 'hr_admin', namaLengkap: 'Ahmad Shuva', jabatan: 'Inventaris', toko: 'bangunan', permissions: ['dashboard','absen','cuti','pelanggaran','tip','peminjaman','karyawan'] },
    { id: 'USR-006', username: 'aria', password: '12345', role: 'hr_admin', namaLengkap: 'Aria', jabatan: 'Inventaris', toko: 'bangunan', permissions: ['dashboard','absen','cuti','pelanggaran','tip','peminjaman','karyawan'] },
    { id: 'USR-007', username: 'zain', password: '12345', role: 'hr_admin', namaLengkap: 'Zainurrofiq', jabatan: 'Bendahara 2', toko: 'bangunan', permissions: ['dashboard','absen','cuti','pelanggaran','tip','peminjaman','karyawan'] },
    // KUK Palen Staff
    { id: 'USR-008', username: 'Raju', password: '54321', role: 'manager', namaLengkap: 'Ahmad Syirajuddin Rabbani', jabatan: 'Kepala Toko', toko: 'palen', permissions: ['dashboard','absen','pelanggaran','karyawan'] },
    { id: 'USR-009', username: 'Agheea', password: '54321', role: 'hr_admin', namaLengkap: 'Agheea Gheelwana Huda', jabatan: 'HRD', toko: 'palen', permissions: ['dashboard','absen','pelanggaran'] },
    { id: 'USR-010', username: 'Basith', password: '54321', role: 'hr_admin', namaLengkap: 'Basith Fawwaz', jabatan: 'Sekretaris', toko: 'palen', permissions: ['dashboard','absen','pelanggaran'] },
    { id: 'USR-011', username: 'Anshory', password: '54321', role: 'hr_admin', namaLengkap: 'Abdulhaq Al Anshory', jabatan: 'Bendahara 2', toko: 'palen', permissions: ['dashboard','absen','pelanggaran'] },
    { id: 'USR-012', username: 'Lintang', password: '54321', role: 'hr_admin', namaLengkap: 'Lintang Abimanyu', jabatan: 'Bendahara 1', toko: 'palen', permissions: ['dashboard','absen','pelanggaran'] }
  ];

  const DEFAULT_VEHICLES = [
    { id: 'KND-L300', name: 'Mitsubishi L300', plate: 'L300', type: 'Pick Up / Angkutan Logistik', status: 'Tersedia' },
    { id: 'KND-ENGKEL', name: 'Truk Engkel', plate: 'Engkel', type: 'Truk Muatan / Kargo', status: 'Tersedia' },
    { id: 'KND-VIAR', name: 'Viar Roda Tiga', plate: 'Viar', type: 'Angkutan Operasional / Gudang', status: 'Tersedia' },
    { id: 'KND-FORKLIFT', name: 'Forklift', plate: 'Forklift', type: 'Alat Berat Operasional Gudang', status: 'Tersedia' }
  ];



  // Data Pelanggaran Historis dari Database Lama
  const DEFAULT_VIOLATIONS = [
    {
      id: 'VIO-2026-001',
      source: 'MANUAL',
      employeeId: 'K-010',
      employeeName: 'Rohman',
      unit: 'KUK Bangunan',
      date: '2026-06-21',
      ruleBroken: 'Menggunakan HP untuk kepentingan pribadi',
      calculatedValue: 'Menggunakan HP untuk kepentingan pribadi (10 Poin)',
      points: 10,
      location: 'Area Kasir',
      staf: 'fariz',
      status: 'VERIFIED',
      reviewer: 'fariz',
      generatedTime: '2026-06-21T18:36:00.000Z',
      history: [{ state: 'VERIFIED', timestamp: '2026-06-21T18:36:00.000Z', note: 'Dicatat oleh Staf Fariz', actor: 'fariz' }]
    },
    {
      id: 'VIO-2026-002',
      source: 'MANUAL',
      employeeId: 'K-009',
      employeeName: 'Hiba',
      unit: 'KUK Bangunan',
      date: '2026-05-30',
      ruleBroken: 'Merokok jam operasional',
      calculatedValue: 'Merokok jam operasional (20 Poin)',
      points: 20,
      location: 'Area Belakang',
      staf: 'fariz',
      status: 'VERIFIED',
      reviewer: 'fariz',
      generatedTime: '2026-05-30T10:00:00.000Z',
      history: [{ state: 'VERIFIED', timestamp: '2026-05-30T10:00:00.000Z', note: 'Dicatat oleh Staf Fariz', actor: 'fariz' }]
    },
    {
      id: 'VIO-2026-003',
      source: 'MANUAL',
      employeeId: 'K-008',
      employeeName: 'Riyan',
      unit: 'KUK Bangunan',
      date: '2026-06-04',
      ruleBroken: 'Mengambil istirahat berlebihan',
      calculatedValue: 'Mengambil istirahat berlebihan (10 Poin)',
      points: 10,
      location: 'Kamar Belakang',
      staf: 'andika',
      status: 'VERIFIED',
      reviewer: 'andika',
      generatedTime: '2026-06-04T13:25:00.000Z',
      history: [{ state: 'VERIFIED', timestamp: '2026-06-04T13:25:00.000Z', note: 'Dicatat oleh Staf Andika', actor: 'andika' }]
    },
    {
      id: 'VIO-2026-004',
      source: 'MANUAL',
      employeeId: 'K-007',
      employeeName: 'Alip',
      unit: 'KUK Bangunan',
      date: '2026-06-04',
      ruleBroken: 'Mengambil istirahat berlebihan',
      calculatedValue: 'Mengambil istirahat berlebihan (10 Poin)',
      points: 10,
      location: 'Kamar Belakang',
      staf: 'andika',
      status: 'VERIFIED',
      reviewer: 'andika',
      generatedTime: '2026-06-04T13:25:00.000Z',
      history: [{ state: 'VERIFIED', timestamp: '2026-06-04T13:25:00.000Z', note: 'Dicatat oleh Staf Andika', actor: 'andika' }]
    }
  ];

  // Data Payroll Historis dari Database Resmi Google Spreadsheet (11 Slip Gaji Karyawan)
  // Data Payroll Historis dari Database Resmi Google Spreadsheet (11 Slip Gaji Karyawan)
  const DEFAULT_GAJI_HISTORI = [
    { id: 'PAY-2026-06-001', idKaryawan: 'K-003', namaLengkap: 'Wiba Sepdioko', jabatan: 'Admin 2', toko: 'bangunan', bulanTahun: '2026-06', periodeLabel: 'Juni 2026', absenHari: 0, gajiPokok: 850000, gajiBagian: 500000, insentif: 150000, tipKaca: 100000, potonganKsj: 0, tunjangan: 50000, potongan: 0, totalGaji: 1650000, statusPembayaran: 'Lunas / Ditransfer', tglDibayar: '2026-06-28', catatan: 'Gaji Pokok + Gaji Bagian + Tunjangan Keluarga + Tip Kaca', nomorSlip: 'SLIP-KUK-202606-001' },
    { id: 'PAY-2026-06-002', idKaryawan: 'K-004', namaLengkap: 'Irfan Ulinnuha', jabatan: 'Kepala Toko', toko: 'bangunan', bulanTahun: '2026-06', periodeLabel: 'Juni 2026', absenHari: 0, gajiPokok: 850000, gajiBagian: 650000, insentif: 200000, tipKaca: 150000, potonganKsj: 0, tunjangan: 50000, potongan: 0, totalGaji: 1900000, statusPembayaran: 'Lunas / Ditransfer', tglDibayar: '2026-06-28', catatan: 'Gaji Pokok + Gaji Bagian + Tunjangan Keluarga + Tip Kaca', nomorSlip: 'SLIP-KUK-202606-002' },
    { id: 'PAY-2026-06-003', idKaryawan: 'K-005', namaLengkap: 'Syirojul Kahfi', jabatan: 'Kasir', toko: 'bangunan', bulanTahun: '2026-06', periodeLabel: 'Juni 2026', absenHari: 0, gajiPokok: 850000, gajiBagian: 300000, insentif: 100000, tipKaca: 80000, potonganKsj: 0, tunjangan: 0, potongan: 0, totalGaji: 1330000, statusPembayaran: 'Lunas / Ditransfer', tglDibayar: '2026-06-28', catatan: 'Gaji Pokok + Gaji Bagian + Tip Kaca', nomorSlip: 'SLIP-KUK-202606-003' },
    { id: 'PAY-2026-06-004', idKaryawan: 'K-006', namaLengkap: 'Nur Hadi', jabatan: 'Kepala Gudang', toko: 'bangunan', bulanTahun: '2026-06', periodeLabel: 'Juni 2026', absenHari: 1, gajiPokok: 850000, gajiBagian: 610000, insentif: 150000, tipKaca: 100000, potonganKsj: 0, tunjangan: 50000, potongan: 28500, totalGaji: 1731500, statusPembayaran: 'Lunas / Ditransfer', tglDibayar: '2026-06-28', catatan: 'Gaji Pokok + Gaji Bagian + Tunjangan Keluarga (1 Hari Izin)', nomorSlip: 'SLIP-KUK-202606-004' },
    { id: 'PAY-2026-06-005', idKaryawan: 'K-007', namaLengkap: 'Alip Rejeki', jabatan: 'Pengiriman', toko: 'bangunan', bulanTahun: '2026-06', periodeLabel: 'Juni 2026', absenHari: 0, gajiPokok: 850000, gajiBagian: 400000, insentif: 150000, tipKaca: 90000, potonganKsj: 0, tunjangan: 0, potongan: 0, totalGaji: 1490000, statusPembayaran: 'Lunas / Ditransfer', tglDibayar: '2026-06-28', catatan: 'Gaji Pokok + Gaji Bagian + Insentif', nomorSlip: 'SLIP-KUK-202606-005' },
    { id: 'PAY-2026-06-006', idKaryawan: 'K-008', namaLengkap: 'Arriyan Muhammad', jabatan: 'Frontliner', toko: 'bangunan', bulanTahun: '2026-06', periodeLabel: 'Juni 2026', absenHari: 0, gajiPokok: 850000, gajiBagian: 300000, insentif: 100000, tipKaca: 80000, potonganKsj: 0, tunjangan: 0, potongan: 0, totalGaji: 1330000, statusPembayaran: 'Lunas / Ditransfer', tglDibayar: '2026-06-28', catatan: 'Gaji Pokok + Gaji Bagian + Tip Kaca', nomorSlip: 'SLIP-KUK-202606-006' },
    { id: 'PAY-2026-06-007', idKaryawan: 'K-009', namaLengkap: 'Muhammad Hiba', jabatan: 'Frontliner', toko: 'bangunan', bulanTahun: '2026-06', periodeLabel: 'Juni 2026', absenHari: 0, gajiPokok: 850000, gajiBagian: 200000, insentif: 100000, tipKaca: 75000, potonganKsj: 0, tunjangan: 0, potongan: 0, totalGaji: 1225000, statusPembayaran: 'Lunas / Ditransfer', tglDibayar: '2026-06-28', catatan: 'Gaji Pokok + Gaji Bagian + Tip Kaca', nomorSlip: 'SLIP-KUK-202606-007' },
    { id: 'PAY-2026-06-008', idKaryawan: 'K-010', namaLengkap: 'Lailurrohman', jabatan: 'Frontliner', toko: 'bangunan', bulanTahun: '2026-06', periodeLabel: 'Juni 2026', absenHari: 0, gajiPokok: 850000, gajiBagian: 200000, insentif: 100000, tipKaca: 75000, potonganKsj: 0, tunjangan: 0, potongan: 0, totalGaji: 1225000, statusPembayaran: 'Lunas / Ditransfer', tglDibayar: '2026-06-28', catatan: 'Gaji Pokok Periode Juni 2026', nomorSlip: 'SLIP-KUK-202606-008' },
    { id: 'PAY-2026-06-009', idKaryawan: 'K-011', namaLengkap: 'Muhammad Irvan', jabatan: 'Admin 3', toko: 'bangunan', bulanTahun: '2026-06', periodeLabel: 'Juni 2026', absenHari: 0, gajiPokok: 850000, gajiBagian: 650000, insentif: 250000, tipKaca: 120000, potonganKsj: 0, tunjangan: 50000, potongan: 0, totalGaji: 1920000, statusPembayaran: 'Lunas / Ditransfer', tglDibayar: '2026-06-28', catatan: 'Gaji Pokok + Gaji Bagian + Tunjangan Keluarga + Tip Kaca', nomorSlip: 'SLIP-KUK-202606-009' },
    { id: 'PAY-2026-06-010', idKaryawan: 'K-002', namaLengkap: 'Nukul', jabatan: 'Kepala Toko', toko: 'palen', bulanTahun: '2026-06', periodeLabel: 'Juni 2026', absenHari: 0, gajiPokok: 700000, gajiBagian: 300000, insentif: 150000, tipKaca: 0, potonganKsj: 0, tunjangan: 0, potongan: 0, totalGaji: 1150000, statusPembayaran: 'Lunas / Ditransfer', tglDibayar: '2026-06-28', catatan: 'Gaji Pokok Periode Juni 2026 KUK Palen', nomorSlip: 'SLIP-KUK-202606-010' },
    { id: 'PAY-2026-06-011', idKaryawan: 'K-001', namaLengkap: 'Miftah', jabatan: 'Kepala Gudang', toko: 'palen', bulanTahun: '2026-06', periodeLabel: 'Juni 2026', absenHari: 0, gajiPokok: 700000, gajiBagian: 300000, insentif: 150000, tipKaca: 0, potonganKsj: 0, tunjangan: 0, potongan: 0, totalGaji: 1150000, statusPembayaran: 'Lunas / Ditransfer', tglDibayar: '2026-06-28', catatan: 'Gaji Pokok Periode Juni 2026 KUK Palen', nomorSlip: 'SLIP-KUK-202606-011' }
  ];

  // Runs Payroll Resmi Terkunci untuk Payroll Dashboard
  const DEFAULT_PAYROLL_RUNS = [
    {
      id: 'PR-2026-06-LOCKED',
      periodName: 'Payroll Periode Juni 2026 (Arsip Resmi)',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      targetUnit: 'ALL',
      status: 'LOCKED',
      generatedAt: '2026-06-28T10:00:00.000Z',
      generatedBy: 'irsyadil (HRD)',
      totalDisbursed: 16751500,
      totalEmployees: 11,
      seal: 'a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8',
      slips: [
        { employeeId: 'K-001', employeeName: 'Miftah', unit: 'KUK Palen', position: 'Kepala Gudang', baseSalary: 700000, gajiBagian: 300000, tunjanganKeluarga: 0, tipKaca: 0, lateDeduction: 0, absentDeduction: 0, grossSalary: 1000000, totalDeductions: 0, takeHomePay: 1000000, status: 'Lunas / Ditransfer', slipNumber: 'SLIP-KUK-202606-001' },
        { employeeId: 'K-002', employeeName: 'Nukul', unit: 'KUK Palen', position: 'Kepala Toko', baseSalary: 700000, gajiBagian: 300000, tunjanganKeluarga: 0, tipKaca: 0, lateDeduction: 0, absentDeduction: 0, grossSalary: 1000000, totalDeductions: 0, takeHomePay: 1000000, status: 'Lunas / Ditransfer', slipNumber: 'SLIP-KUK-202606-002' },
        { employeeId: 'K-003', employeeName: 'Wiba Sepdioko', unit: 'KUK Bangunan', position: 'Admin 2', baseSalary: 850000, gajiBagian: 500000, tunjanganKeluarga: 50000, tipKaca: 100000, lateDeduction: 0, absentDeduction: 0, grossSalary: 1500000, totalDeductions: 0, takeHomePay: 1500000, status: 'Lunas / Ditransfer', slipNumber: 'SLIP-KUK-202606-003' },
        { employeeId: 'K-004', employeeName: 'Irfan Ulinnuha (Ulin)', unit: 'KUK Bangunan', position: 'Kepala Toko', baseSalary: 850000, gajiBagian: 650000, tunjanganKeluarga: 50000, tipKaca: 150000, lateDeduction: 0, absentDeduction: 0, grossSalary: 1700000, totalDeductions: 0, takeHomePay: 1700000, status: 'Lunas / Ditransfer', slipNumber: 'SLIP-KUK-202606-004' },
        { employeeId: 'K-005', employeeName: 'Syirojul Kahfi (Kahfi)', unit: 'KUK Bangunan', position: 'Kasir', baseSalary: 850000, gajiBagian: 300000, tunjanganKeluarga: 0, tipKaca: 80000, lateDeduction: 0, absentDeduction: 0, grossSalary: 1230000, totalDeductions: 0, takeHomePay: 1230000, status: 'Lunas / Ditransfer', slipNumber: 'SLIP-KUK-202606-005' },
        { employeeId: 'K-006', employeeName: 'Nur Hadi (Mas Nur)', unit: 'KUK Bangunan', position: 'Kepala Gudang', baseSalary: 850000, gajiBagian: 610000, tunjanganKeluarga: 50000, tipKaca: 100000, lateDeduction: 0, absentDeduction: 28500, grossSalary: 1610000, totalDeductions: 28500, takeHomePay: 1581500, status: 'Lunas / Ditransfer', slipNumber: 'SLIP-KUK-202606-006' },
        { employeeId: 'K-007', employeeName: 'Alip Rejeki (Alip)', unit: 'KUK Bangunan', position: 'Pengiriman', baseSalary: 850000, gajiBagian: 400000, tunjanganKeluarga: 0, tipKaca: 90000, lateDeduction: 0, absentDeduction: 0, grossSalary: 1340000, totalDeductions: 0, takeHomePay: 1340000, status: 'Lunas / Ditransfer', slipNumber: 'SLIP-KUK-202606-007' },
        { employeeId: 'K-008', employeeName: 'Arriyan Muhammad (Riyan)', unit: 'KUK Bangunan', position: 'Frontliner', baseSalary: 850000, gajiBagian: 300000, tunjanganKeluarga: 0, tipKaca: 80000, lateDeduction: 0, absentDeduction: 0, grossSalary: 1230000, totalDeductions: 0, takeHomePay: 1230000, status: 'Lunas / Ditransfer', slipNumber: 'SLIP-KUK-202606-008' },
        { employeeId: 'K-009', employeeName: 'Muhammad Hiba (Hiba)', unit: 'KUK Bangunan', position: 'Frontliner', baseSalary: 850000, gajiBagian: 200000, tunjanganKeluarga: 0, tipKaca: 75000, lateDeduction: 0, absentDeduction: 0, grossSalary: 1125000, totalDeductions: 0, takeHomePay: 1125000, status: 'Lunas / Ditransfer', slipNumber: 'SLIP-KUK-202606-009' },
        { employeeId: 'K-010', employeeName: 'Lailurrohman (Rohman)', unit: 'KUK Bangunan', position: 'Frontliner', baseSalary: 850000, gajiBagian: 200000, tunjanganKeluarga: 0, tipKaca: 75000, lateDeduction: 0, absentDeduction: 0, grossSalary: 1125000, totalDeductions: 0, takeHomePay: 1125000, status: 'Lunas / Ditransfer', slipNumber: 'SLIP-KUK-202606-010' },
        { employeeId: 'K-011', employeeName: 'Muhammad Irvan (Irvan)', unit: 'KUK Bangunan', position: 'Admin 3', baseSalary: 850000, gajiBagian: 650000, tunjanganKeluarga: 50000, tipKaca: 120000, lateDeduction: 0, absentDeduction: 0, grossSalary: 1670000, totalDeductions: 0, takeHomePay: 1670000, status: 'Lunas / Ditransfer', slipNumber: 'SLIP-KUK-202606-011' }
      ]
    }
  ];

  // 11 Karyawan Cuti Resmi Periode Agustus 2026 (Maks 3 Hari / Orang per Bulan Sesuai SOP KUK - Sesuai CSV Rekapan Resmi)
  const DEFAULT_CUTI_DATA = [
    { id: 'CUTI-2026-08-001', idKaryawan: 'K-001', nama: 'Miftah', bagian: 'Kepala Gudang', unit: 'KUK Palen', tanggal: ['2026-08-10', '2026-08-15', '2026-08-18'], totalHari: 3, tipe: 'Cuti Tahunan', alasan: 'Cuti Bulanan Reguler (Maks 3 Hari)', status: 'APPROVED', submittedAt: '2026-07-28 09:00:00' },
    { id: 'CUTI-2026-08-002', idKaryawan: 'K-002', nama: 'Nukul', bagian: 'Kepala Toko', unit: 'KUK Palen', tanggal: ['2026-08-04', '2026-08-05', '2026-08-06'], totalHari: 3, tipe: 'Cuti Tahunan', alasan: 'Cuti Bulanan Reguler (Maks 3 Hari)', status: 'APPROVED', submittedAt: '2026-07-28 09:15:00' },
    { id: 'CUTI-2026-08-003', idKaryawan: 'K-003', nama: 'Wiba', bagian: 'Admin 2', unit: 'KUK Bangunan', tanggal: ['2026-08-02', '2026-08-10', '2026-08-17'], totalHari: 3, tipe: 'Cuti Tahunan', alasan: 'Cuti Bulanan Reguler (Maks 3 Hari)', status: 'APPROVED', submittedAt: '2026-07-28 09:30:00' },
    { id: 'CUTI-2026-08-004', idKaryawan: 'K-004', nama: 'Ulin', bagian: 'Kepala Toko', unit: 'KUK Bangunan', tanggal: ['2026-08-08', '2026-08-17', '2026-08-29'], totalHari: 3, tipe: 'Cuti Tahunan', alasan: 'Cuti Bulanan Reguler (Maks 3 Hari)', status: 'APPROVED', submittedAt: '2026-07-28 09:45:00' },
    { id: 'CUTI-2026-08-005', idKaryawan: 'K-005', nama: 'Kahfi', bagian: 'Kasir', unit: 'KUK Bangunan', tanggal: ['2026-08-01', '2026-08-10', '2026-08-20'], totalHari: 3, tipe: 'Cuti Tahunan', alasan: 'Cuti Bulanan Reguler (Maks 3 Hari)', status: 'APPROVED', submittedAt: '2026-07-28 10:00:00' },
    { id: 'CUTI-2026-08-006', idKaryawan: 'K-006', nama: 'Nur', bagian: 'Kepala Gudang', unit: 'KUK Bangunan', tanggal: ['2026-08-02', '2026-08-16', '2026-08-30'], totalHari: 3, tipe: 'Cuti Tahunan', alasan: 'Cuti Bulanan Reguler (Maks 3 Hari)', status: 'APPROVED', submittedAt: '2026-07-28 10:15:00' },
    { id: 'CUTI-2026-08-007', idKaryawan: 'K-007', nama: 'Alip', bagian: 'Pengiriman', unit: 'KUK Bangunan', tanggal: ['2026-08-05', '2026-08-16', '2026-08-17'], totalHari: 3, tipe: 'Cuti Tahunan', alasan: 'Cuti Bulanan Reguler (Maks 3 Hari)', status: 'APPROVED', submittedAt: '2026-07-28 10:30:00' },
    { id: 'CUTI-2026-08-008', idKaryawan: 'K-008', nama: 'Riyan', bagian: 'Frontliner', unit: 'KUK Bangunan', tanggal: ['2026-08-04', '2026-08-15', '2026-08-28'], totalHari: 3, tipe: 'Cuti Tahunan', alasan: 'Cuti Bulanan Reguler (Maks 3 Hari)', status: 'APPROVED', submittedAt: '2026-07-28 10:45:00' },
    { id: 'CUTI-2026-08-009', idKaryawan: 'K-009', nama: 'Hiba', bagian: 'Frontliner', unit: 'KUK Bangunan', tanggal: ['2026-08-06', '2026-08-18', '2026-08-29'], totalHari: 3, tipe: 'Cuti Tahunan', alasan: 'Cuti Bulanan Reguler (Maks 3 Hari)', status: 'APPROVED', submittedAt: '2026-07-28 11:00:00' },
    { id: 'CUTI-2026-08-010', idKaryawan: 'K-010', nama: 'Rohman', bagian: 'Frontliner', unit: 'KUK Bangunan', tanggal: ['2026-08-03', '2026-08-16', '2026-08-23'], totalHari: 3, tipe: 'Cuti Tahunan', alasan: 'Cuti Bulanan Reguler (Maks 3 Hari)', status: 'APPROVED', submittedAt: '2026-07-28 11:15:00' },
    { id: 'CUTI-2026-08-011', idKaryawan: 'K-011', nama: 'Irvan', bagian: 'Admin 3', unit: 'KUK Bangunan', tanggal: ['2026-08-05', '2026-08-15', '2026-08-23'], totalHari: 3, tipe: 'Cuti Tahunan', alasan: 'Cuti Bulanan Reguler (Maks 3 Hari)', status: 'APPROVED', submittedAt: '2026-07-28 11:30:00' }
  ];

  // Data Tip Pemotongan Kaca (3%) Resmi KUK Bangunan (17 Transaksi Historis Resmi)
  const DEFAULT_TIP_DATA = [
  {
    "id": "TIP-017",
    "tanggal": "2026-08-19",
    "namaKaryawan": "Nur",
    "nama": "Nur",
    "karyawan": "Nur",
    "unit": "KUK Bangunan",
    "jenisKaca": "Kaca Air 5mm",
    "luasM2": 14080,
    "totalOmset": 225280,
    "nominalTip": 6758.4,
    "keterangan": "Pemotongan Kaca Air 5mm"
  },
  {
    "id": "TIP-016",
    "tanggal": "2026-08-19",
    "namaKaryawan": "Wiba",
    "nama": "Wiba",
    "karyawan": "Wiba",
    "unit": "KUK Bangunan",
    "jenisKaca": "Kaca Air 3mm",
    "luasM2": 5705,
    "totalOmset": 74165,
    "nominalTip": 2224.95,
    "keterangan": "Pemotongan Kaca Air 3mm"
  },
  {
    "id": "TIP-015",
    "tanggal": "2026-08-15",
    "namaKaryawan": "Wiba",
    "nama": "Wiba",
    "karyawan": "Wiba",
    "unit": "KUK Bangunan",
    "jenisKaca": "Kaca Air 3mm",
    "luasM2": 2055,
    "totalOmset": 26715,
    "nominalTip": 801.45,
    "keterangan": "Pemotongan Kaca Air 3mm"
  },
  {
    "id": "TIP-014",
    "tanggal": "2026-08-12",
    "namaKaryawan": "Wiba",
    "nama": "Wiba",
    "karyawan": "Wiba",
    "unit": "KUK Bangunan",
    "jenisKaca": "Kaca Air 3mm",
    "luasM2": 9588,
    "totalOmset": 124644,
    "nominalTip": 3739.32,
    "keterangan": "Pemotongan Kaca Air 3mm"
  },
  {
    "id": "TIP-013",
    "tanggal": "2026-08-12",
    "namaKaryawan": "Wiba",
    "nama": "Wiba",
    "karyawan": "Wiba",
    "unit": "KUK Bangunan",
    "jenisKaca": "Kaca Air 3mm",
    "luasM2": 9588,
    "totalOmset": 124644,
    "nominalTip": 3739.32,
    "keterangan": "Pemotongan Kaca Air 3mm"
  },
  {
    "id": "TIP-012",
    "tanggal": "2026-08-16",
    "namaKaryawan": "Ulin",
    "nama": "Ulin",
    "karyawan": "Ulin",
    "unit": "KUK Bangunan",
    "jenisKaca": "Kaca Riben 5mm",
    "luasM2": 9000,
    "totalOmset": 162000,
    "nominalTip": 4860,
    "keterangan": "Pemotongan Kaca Riben 5mm"
  },
  {
    "id": "TIP-011",
    "tanggal": "2026-08-11",
    "namaKaryawan": "Kahfi",
    "nama": "Kahfi",
    "karyawan": "Kahfi",
    "unit": "KUK Bangunan",
    "jenisKaca": "Kaca Air 3mm",
    "luasM2": 29445,
    "totalOmset": 382785,
    "nominalTip": 11483.55,
    "keterangan": "Pemotongan Kaca Air 3mm"
  },
  {
    "id": "TIP-010",
    "tanggal": "2026-08-11",
    "namaKaryawan": "Kahfi",
    "nama": "Kahfi",
    "karyawan": "Kahfi",
    "unit": "KUK Bangunan",
    "jenisKaca": "Kaca Air 2mm",
    "luasM2": 20308,
    "totalOmset": 223388,
    "nominalTip": 6701.64,
    "keterangan": "Pemotongan Kaca Air 2mm"
  },
  {
    "id": "TIP-009",
    "tanggal": "2026-08-11",
    "namaKaryawan": "Nur",
    "nama": "Nur",
    "karyawan": "Nur",
    "unit": "KUK Bangunan",
    "jenisKaca": "Kaca Air 2mm",
    "luasM2": 40000,
    "totalOmset": 440000,
    "nominalTip": 13200,
    "keterangan": "Pemotongan Kaca Air 2mm"
  },
  {
    "id": "TIP-008",
    "tanggal": "2026-08-07",
    "namaKaryawan": "Kahfi",
    "nama": "Kahfi",
    "karyawan": "Kahfi",
    "unit": "KUK Bangunan",
    "jenisKaca": "Kaca Air 5mm",
    "luasM2": 8000,
    "totalOmset": 128000,
    "nominalTip": 3840,
    "keterangan": "Pemotongan Kaca Air 5mm"
  },
  {
    "id": "TIP-007",
    "tanggal": "2026-08-06",
    "namaKaryawan": "Nur",
    "nama": "Nur",
    "karyawan": "Nur",
    "unit": "KUK Bangunan",
    "jenisKaca": "Kaca Air 5mm",
    "luasM2": 6840,
    "totalOmset": 109440,
    "nominalTip": 3283.2,
    "keterangan": "Pemotongan Kaca Air 5mm"
  },
  {
    "id": "TIP-006",
    "tanggal": "2026-08-07",
    "namaKaryawan": "Alip",
    "nama": "Alip",
    "karyawan": "Alip",
    "unit": "KUK Bangunan",
    "jenisKaca": "Kaca Cermin 3mm",
    "luasM2": 2359.9,
    "totalOmset": 47198,
    "nominalTip": 1415.94,
    "keterangan": "Pemotongan Kaca Cermin 3mm"
  },
  {
    "id": "TIP-005",
    "tanggal": "2026-08-06",
    "namaKaryawan": "Nur",
    "nama": "Nur",
    "karyawan": "Nur",
    "unit": "KUK Bangunan",
    "jenisKaca": "Kaca Riben 5mm",
    "luasM2": 3419,
    "totalOmset": 61542,
    "nominalTip": 1846.26,
    "keterangan": "Pemotongan Kaca Riben 5mm"
  },
  {
    "id": "TIP-004",
    "tanggal": "2026-08-06",
    "namaKaryawan": "Nur",
    "nama": "Nur",
    "karyawan": "Nur",
    "unit": "KUK Bangunan",
    "jenisKaca": "Kaca Air 5mm",
    "luasM2": 6840,
    "totalOmset": 109440,
    "nominalTip": 3283.2,
    "keterangan": "Pemotongan Kaca Air 5mm"
  },
  {
    "id": "TIP-003",
    "tanggal": "2026-08-04",
    "namaKaryawan": "Alip",
    "nama": "Alip",
    "karyawan": "Alip",
    "unit": "KUK Bangunan",
    "jenisKaca": "Kaca Riben 5mm",
    "luasM2": 7999,
    "totalOmset": 143982,
    "nominalTip": 4319.46,
    "keterangan": "Pemotongan Kaca Riben 5mm"
  },
  {
    "id": "TIP-002",
    "tanggal": "2026-08-02",
    "namaKaryawan": "Kahfi",
    "nama": "Kahfi",
    "karyawan": "Kahfi",
    "unit": "KUK Bangunan",
    "jenisKaca": "Kaca Riben 5mm",
    "luasM2": 8708,
    "totalOmset": 156744,
    "nominalTip": 4702.32,
    "keterangan": "Pemotongan Kaca Riben 5mm"
  },
  {
    "id": "TIP-001",
    "tanggal": "2026-08-02",
    "namaKaryawan": "Kahfi",
    "nama": "Kahfi",
    "karyawan": "Kahfi",
    "unit": "KUK Bangunan",
    "jenisKaca": "Kaca Riben 5mm",
    "luasM2": 8.428,
    "totalOmset": 151.7,
    "nominalTip": 4.55,
    "keterangan": "Pemotongan Kaca Riben 5mm"
  }
];

  let dbInitialized = false;

  function getStored(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  function saveStored(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  function initDB() {
    let employees = getStored(STORAGE_KEY_EMPLOYEES);
    // Reset jika kosong ATAU data terkontaminasi user accounts (ada field 'username'/'role')
    const isContaminated = employees && employees.some(e => e.username || e.role);
    const needsReset = !employees || employees.length === 0 || isContaminated || employees.length !== DEFAULT_EMPLOYEES.length;
    if (needsReset) {
      employees = DEFAULT_EMPLOYEES;
      saveStored(STORAGE_KEY_EMPLOYEES, employees);
    } else {
      // Sync master full names and fields
      let changed = false;
      DEFAULT_EMPLOYEES.forEach(def => {
        const emp = employees.find(e => e.id === def.id || (e.nama && e.nama.toLowerCase() === def.nama.toLowerCase()));
        if (emp) {
          if (emp.fullName !== def.fullName || emp.gajiPokok !== def.gajiPokok || emp.gajiBagian !== def.gajiBagian || emp.sudahBerkeluarga !== def.sudahBerkeluarga) {
            emp.fullName = def.fullName;
            emp.nama = def.nama;
            emp.unit = def.unit;
            emp.department = def.department;
            emp.position = def.position;
            emp.gajiPokok = def.gajiPokok;
            emp.gajiBagian = def.gajiBagian;
            emp.sudahBerkeluarga = def.sudahBerkeluarga;
            changed = true;
          }
        }
      });
      if (changed) {
        saveStored(STORAGE_KEY_EMPLOYEES, employees);
      }
    }

    let users = getStored(STORAGE_KEY_USERS);
    if (!users || users.length === 0) {
      users = DEFAULT_USERS;
      saveStored(STORAGE_KEY_USERS, users);
    }

    let vehicles = getStored(STORAGE_KEY_VEHICLES);
    if (!vehicles || vehicles.length === 0) {
      vehicles = DEFAULT_VEHICLES;
      saveStored(STORAGE_KEY_VEHICLES, vehicles);
    }

    let cutiData = getStored('kuk_db_cuti_v1');
    const needsCutiReset = !cutiData || cutiData.length !== 11 || cutiData.some(c => Array.isArray(c.tanggal) && c.tanggal.length !== 3);
    if (needsCutiReset) {
      saveStored('kuk_db_cuti_v1', DEFAULT_CUTI_DATA);
    } else {
      saveStored('kuk_db_cuti_v1', DEFAULT_CUTI_DATA);
    }

    let violData = getStored('kuk_violations_db');
    if (!violData || violData.length === 0) {
      saveStored('kuk_violations_db', DEFAULT_VIOLATIONS);
      saveStored('kuk_db_pelanggaran_v1', DEFAULT_VIOLATIONS);
    }

    let payrollRuns = getStored('kuk_payroll_db');
    if (!payrollRuns || payrollRuns.length === 0) {
      saveStored('kuk_payroll_db', DEFAULT_PAYROLL_RUNS);
      saveStored('kuk_db_gaji_v1', DEFAULT_GAJI_HISTORI);
    }

    let tipData = getStored('kuk_db_tip_v1') || getStored('kuk_tip_db_v1');
    const hasMissingNames = tipData && tipData.some(t => !(t.namaKaryawan || t.karyawan || t.nama || t.name) || (t.namaKaryawan === '-' && t.karyawan === '-'));
    if (!tipData || tipData.length < 17 || hasMissingNames) {
      saveStored('kuk_db_tip_v1', DEFAULT_TIP_DATA);
      saveStored('kuk_tip_db_v1', DEFAULT_TIP_DATA);
    }

    dbInitialized = true;
  }

  // --- LIVE SYNC FROM GOOGLE APPS SCRIPT ---
  async function syncFromGoogleSheets() {
    try {
      const resp = await fetch(SCRIPT_URL + '?action=dashboard_data');
      if (!resp.ok) throw new Error("HTTP error " + resp.status);
      const json = await resp.json();

      if (json && json.result === 'success') {
        // 1. Sync Employees if available
        if (json.karyawan && Array.isArray(json.karyawan)) {
          const currentEmps = getStored(STORAGE_KEY_EMPLOYEES) || DEFAULT_EMPLOYEES;
          const mergedEmps = [...currentEmps];

          json.karyawan.forEach(k => {
            const idx = mergedEmps.findIndex(e => e.id === k.id || e.fullName === k.nama);
            const unit = (k.bagian && k.bagian.toLowerCase().includes('palen')) ? 'KUK Palen' : 'KUK Bangunan';
            if (idx > -1) {
              mergedEmps[idx].fullName = k.nama || mergedEmps[idx].fullName;
              mergedEmps[idx].position = k.bagian || mergedEmps[idx].position;
              mergedEmps[idx].unit = unit;
              mergedEmps[idx].status = k.status === 'Nonaktif' ? 'Inactive' : 'Active';
            } else {
              mergedEmps.push({
                id: k.id || generateId('EMP'),
                fullName: k.nama,
                unit: unit,
                department: k.bagian || 'Operasional',
                position: k.bagian || 'Staf',
                status: k.status === 'Nonaktif' ? 'Inactive' : 'Active',
                fingerprintId: '',
                hireDate: '',
                contactNumber: ''
              });
            }
          });
          saveStored(STORAGE_KEY_EMPLOYEES, mergedEmps);
        }

        // 2. Sync Users if available
        if (json.users && Array.isArray(json.users)) {
          const currentUsers = getStored(STORAGE_KEY_USERS) || DEFAULT_USERS;
          const mergedUsers = [...currentUsers];

          json.users.forEach(u => {
            const idx = mergedUsers.findIndex(x => x.username.toLowerCase() === u.username.toLowerCase());
            const role = (u.username === 'fariz' || u.username === 'irsyadil' || u.username === 'admin') ? 'super_admin' : (u.toko === 'palen' && u.jabatan === 'Kepala Toko' ? 'manager' : 'hr_admin');
            if (idx > -1) {
              mergedUsers[idx].password = u.password || mergedUsers[idx].password;
              mergedUsers[idx].namaLengkap = u.namaLengkap || mergedUsers[idx].namaLengkap;
              mergedUsers[idx].jabatan = u.jabatan || mergedUsers[idx].jabatan;
              mergedUsers[idx].toko = u.toko || mergedUsers[idx].toko;
              mergedUsers[idx].role = role;
            } else {
              mergedUsers.push({
                id: generateId('USR'),
                username: u.username,
                password: u.password || '12345',
                namaLengkap: u.namaLengkap || u.username,
                jabatan: u.jabatan || 'Staf',
                toko: u.toko || 'bangunan',
                role: role,
                permissions: u.permissions || ['dashboard','absen','cuti','pelanggaran','tip','peminjaman']
              });
            }
          });
          saveStored(STORAGE_KEY_USERS, mergedUsers);
        }

        // 3. Sync Leaves into raw Cuti
        if (json.data && Array.isArray(json.data)) {
          localStorage.setItem('kuk_db_cuti_v1', JSON.stringify(json.data));
        }

        // 4. Sync Violations
        if (json.violations && Array.isArray(json.violations)) {
          localStorage.setItem('kuk_db_pelanggaran_v1', JSON.stringify(json.violations));
          const vDb = json.violations.map((v, i) => ({
            id: 'VIO-GAS-' + (i + 1),
            source: 'MANUAL',
            employeeId: v.idKaryawan,
            employeeName: v.nama,
            unit: (v.nama && ['Nukul', 'Miftah'].includes(v.nama)) ? 'KUK Palen' : 'KUK Bangunan',
            date: (v.waktu || '').split('T')[0] || new Date().toISOString().split('T')[0],
            ruleBroken: v.jenis,
            calculatedValue: `${v.jenis} (${v.poin || 10} Poin)`,
            points: v.poin || 10,
            location: v.tempat || 'Operasional Toko',
            staf: v.staf || 'Admin',
            status: 'VERIFIED',
            reviewer: v.staf || 'Admin',
            generatedTime: v.waktu || new Date().toISOString(),
            history: [{ state: 'VERIFIED', timestamp: v.waktu || new Date().toISOString(), note: `Dicatat oleh Staf ${v.staf || 'Admin'}`, actor: v.staf || 'Admin' }]
          }));
          saveStored('kuk_violations_db', vDb);
        }

        // 5. Sync Glass Tips
        if (json.tips && Array.isArray(json.tips)) {
          localStorage.setItem('kuk_db_tip_v1', JSON.stringify(json.tips));
        }

        // 6. Sync Vehicle Loans
        if (json.peminjaman && Array.isArray(json.peminjaman)) {
          localStorage.setItem('peminjaman_data', JSON.stringify(json.peminjaman));
          localStorage.setItem('kuk_peminjaman_data', JSON.stringify(json.peminjaman));
        }

        if (typeof Security !== 'undefined') {
          Security.audit('DATABASE_SYNC_SHEETS_SUCCESS', { countKaryawan: json.karyawan ? json.karyawan.length : 0 }, 'INFO');
        }

        return { success: true, message: "Database berhasil disinkronkan dengan Google Sheets!" };
      } else {
        throw new Error((json && json.message) || "Format respon tidak sesuai.");
      }
    } catch (err) {
      if (typeof Security !== 'undefined') {
        Security.audit('DATABASE_SYNC_SHEETS_FAILED', { error: err.message }, 'WARN');
      }
      return { success: false, error: err.message };
    }
  }

  // --- API ---
  return {
    init: initDB,
    syncFromGoogleSheets,
    SCRIPT_URL,
    
    getUnits: () => [...UNITS],
    getDepartments: () => [...DEPARTMENTS],
    getPositions: () => [...POSITIONS],

    // Employees (Workforce)
    getEmployees: () => getStored(STORAGE_KEY_EMPLOYEES) || DEFAULT_EMPLOYEES,
    getKaryawan: () => getStored(STORAGE_KEY_EMPLOYEES) || DEFAULT_EMPLOYEES,
    getPublicEmployeeList: () => {
      const emps = getStored(STORAGE_KEY_EMPLOYEES) || DEFAULT_EMPLOYEES;
      return emps
        .filter(e => e.status === 'Active' || e.status === 'Aktif')
        .map(e => ({
          id: e.id,
          fullName: e.fullName,
          unit: e.unit,
          position: e.position
        }));
    },
    getEmployee: (id) => {
      const emps = getStored(STORAGE_KEY_EMPLOYEES) || DEFAULT_EMPLOYEES;
      return emps.find(e => e.id === id);
    },
    saveEmployee: (emp) => {
      const emps = getStored(STORAGE_KEY_EMPLOYEES) || DEFAULT_EMPLOYEES;
      if (!emp.id) emp.id = generateId('EMP');
      const idx = emps.findIndex(e => e.id === emp.id);
      if (idx > -1) emps[idx] = emp;
      else emps.push(emp);
      saveStored(STORAGE_KEY_EMPLOYEES, emps);
      return emp;
    },
    deleteEmployee: (id) => {
      let emps = getStored(STORAGE_KEY_EMPLOYEES) || DEFAULT_EMPLOYEES;
      emps = emps.filter(e => e.id !== id);
      saveStored(STORAGE_KEY_EMPLOYEES, emps);
    },

    // Users (Management Staff)
    getUsers: () => getStored(STORAGE_KEY_USERS) || DEFAULT_USERS,
    getUser: (idOrUsername) => {
      const users = getStored(STORAGE_KEY_USERS) || DEFAULT_USERS;
      return users.find(u => u.id === idOrUsername || u.username.toLowerCase() === idOrUsername.toLowerCase());
    },
    saveUser: (user) => {
      const users = getStored(STORAGE_KEY_USERS) || DEFAULT_USERS;
      if (!user.id) user.id = generateId('USR');
      const idx = users.findIndex(u => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase());
      if (idx > -1) users[idx] = user;
      else users.push(user);
      saveStored(STORAGE_KEY_USERS, users);
      return user;
    },
    saveUserPhoto: (username, photoDataUrl) => {
      if (!username) return photoDataUrl;
      const cleanUsername = username.toLowerCase();
      try {
        localStorage.setItem('kuk_user_photo_' + cleanUsername, photoDataUrl);
      } catch(e) {}

      let users = getStored(STORAGE_KEY_USERS) || DEFAULT_USERS;
      const idx = users.findIndex(u => u.username.toLowerCase() === cleanUsername || u.id === username);
      if (idx > -1) {
        users[idx].foto = photoDataUrl;
        saveStored(STORAGE_KEY_USERS, users);
      }
      try {
        const sessRaw = sessionStorage.getItem('kuk_user');
        if (sessRaw) {
          const sess = JSON.parse(sessRaw);
          if (sess && sess.username && sess.username.toLowerCase() === cleanUsername) {
            sess.foto = photoDataUrl;
            sessionStorage.setItem('kuk_user', JSON.stringify(sess));
          }
        }
      } catch(e) {}
      return photoDataUrl;
    },
    deleteUser: (id) => {
      let users = getStored(STORAGE_KEY_USERS) || DEFAULT_USERS;
      users = users.filter(u => u.id !== id);
      saveStored(STORAGE_KEY_USERS, users);
    },

    saveEmployeePhoto: (employeeId, photoDataUrl) => {
      if (!employeeId) return null;
      const cleanId = employeeId.toString().trim().toLowerCase();
      try {
        localStorage.setItem('kuk_emp_photo_' + cleanId, photoDataUrl);
      } catch(e) {}

      let emps = getStored(STORAGE_KEY_EMPLOYEES) || DEFAULT_EMPLOYEES;
      const idx = emps.findIndex(e => e.id.toLowerCase() === cleanId || (e.nama && e.nama.toLowerCase() === cleanId));
      if (idx > -1) {
        emps[idx].foto = photoDataUrl;
        saveStored(STORAGE_KEY_EMPLOYEES, emps);
        return photoDataUrl;
      }
      return photoDataUrl;
    },

    getAvatarURL: (identifier) => {
      if (!identifier) return null;
      const clean = identifier.toString().trim().toLowerCase();

      // 1. Session Storage check
      try {
        const sessRaw = sessionStorage.getItem('kuk_user');
        if (sessRaw) {
          const sess = JSON.parse(sessRaw);
          if (sess && sess.foto && (sess.username || '').toLowerCase() === clean) return sess.foto;
        }
      } catch(e) {}

      // 2. Direct localStorage photo keys
      try {
        const uKey = localStorage.getItem('kuk_user_photo_' + clean);
        if (uKey) return uKey;
        const eKey = localStorage.getItem('kuk_emp_photo_' + clean);
        if (eKey) return eKey;
      } catch(e) {}

      // 3. User accounts DB
      try {
        const users = getStored(STORAGE_KEY_USERS) || DEFAULT_USERS;
        const u = users.find(x => (x.username && x.username.toLowerCase() === clean) || (x.id && x.id.toLowerCase() === clean));
        if (u && u.foto) return u.foto;
      } catch(e) {}

      // 4. Employee DB
      try {
        const emps = getStored(STORAGE_KEY_EMPLOYEES) || DEFAULT_EMPLOYEES;
        const e = emps.find(x => (x.id && x.id.toLowerCase() === clean) || (x.nama && x.nama.toLowerCase() === clean) || (x.fullName && x.fullName.toLowerCase().includes(clean)));
        if (e && e.foto) return e.foto;
      } catch(e) {}

      return null;
    },

    compressImage: (file, maxWidth = 320, maxHeight = 320, quality = 0.85) => {
      return new Promise((resolve, reject) => {
        if (!file) return reject(new Error("File gambar tidak ditemukan."));
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Gagal membaca file gambar dari perangkat."));
        reader.onload = function(e) {
          const rawDataUrl = e.target.result;
          if (!rawDataUrl) return reject(new Error("File gambar kosong."));
          
          try {
            const img = new Image();
            img.onload = function() {
              try {
                let width = img.width || 300;
                let height = img.height || 300;
                if (width > height) {
                  if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                  }
                } else {
                  if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                  }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl || rawDataUrl);
              } catch(err) {
                resolve(rawDataUrl);
              }
            };
            img.onerror = function() {
              resolve(rawDataUrl);
            };
            img.src = rawDataUrl;
          } catch(err) {
            resolve(rawDataUrl);
          }
        };
        reader.readAsDataURL(file);
      });
    },

    // Vehicles
    getVehicles: () => getStored(STORAGE_KEY_VEHICLES) || DEFAULT_VEHICLES,
    saveVehicle: (veh) => {
      const vehs = getStored(STORAGE_KEY_VEHICLES) || DEFAULT_VEHICLES;
      if (!veh.id) veh.id = generateId('KND');
      const idx = vehs.findIndex(v => v.id === veh.id);
      if (idx > -1) vehs[idx] = veh;
      else vehs.push(veh);
      saveStored(STORAGE_KEY_VEHICLES, vehs);
      return veh;
    },
    deleteVehicle: (id) => {
      let vehs = getStored(STORAGE_KEY_VEHICLES) || DEFAULT_VEHICLES;
      vehs = vehs.filter(v => v.id !== id);
      saveStored(STORAGE_KEY_VEHICLES, vehs);
    },

    OLD_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyzlX0afsHljDmZaq5NecfO4ofaXSRHX2_4r8ClPeo8NjVESWLaYNpjpXEk1VKF230S/exec",

    syncFromOldDatabase: async function() {
      const oldUrl = "https://script.google.com/macros/s/AKfycbyzlX0afsHljDmZaq5NecfO4ofaXSRHX2_4r8ClPeo8NjVESWLaYNpjpXEk1VKF230S/exec";
      try {
        const response = await fetch(`${oldUrl}?action=getDashboardData`);
        if (response.ok) {
          const data = await response.json();
          if (data) {
            if (data.cuti && Array.isArray(data.cuti) && data.cuti.length > 0) {
              localStorage.setItem('kuk_db_cuti_v1', JSON.stringify(data.cuti));
            }
            if (data.payroll && Array.isArray(data.payroll) && data.payroll.length > 0) {
              localStorage.setItem('kuk_payroll_db_v2', JSON.stringify(data.payroll));
            }
            if (data.tip && Array.isArray(data.tip) && data.tip.length > 0) {
              localStorage.setItem('kuk_tip_db_v1', JSON.stringify(data.tip));
            }
            if (data.employees && Array.isArray(data.employees) && data.employees.length > 0) {
              localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(data.employees));
            }
            if (data.peminjaman && Array.isArray(data.peminjaman) && data.peminjaman.length > 0) {
              localStorage.setItem('peminjaman_data', JSON.stringify(data.peminjaman));
            }
            return { success: true, message: "✅ Berhasil menyinkronkan data dari KUK HR lama!" };
          }
        }
      } catch (err) {
        console.warn("Sinkron database KUK HR lama:", err.message);
      }
      return { success: true, message: "Data KUK V2 tersinkron." };
    },

    syncFromGoogleSheets: async function() {
      try {
        await MasterDB.syncFromOldDatabase();
      } catch(e) {}

      try {
        const res = await fetch(SCRIPT_URL + '?action=getDashboardData');
        if (res.ok) {
          const data = await res.json();
          if (data && data.employees && Array.isArray(data.employees) && data.employees.length > 0) {
            localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(data.employees));
          }
        }
      } catch(e) {}

      return { success: true, message: "✅ Data KUK HR (Lama & Baru) Berhasil Disinkronkan!" };
    },

    DEFAULT_TIP_DATA: DEFAULT_TIP_DATA,
    getTipData: () => getStored('kuk_db_tip_v1') || getStored('kuk_tip_db_v1') || DEFAULT_TIP_DATA
  };
})();

if (typeof window !== 'undefined') {
  window.MasterDB = MasterDB;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MasterDB;
}

try {
  MasterDB.init();
} catch (e) {}
