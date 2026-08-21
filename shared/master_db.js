/**
 * master_db.js
 * Master Database Foundation for KUK La Tansa Internal Management System.
 * Distinguishes Staff (Manajemen/User Accounts) from Karyawan (Workforce Employees).
 */

const MasterDB = (() => {
  'use strict';

  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxAjktMA76CUG0l-kCOMuazdLrWt6ULfv6cwhlL-QuGiwhtVJx8Sb12tkOHyXqk48tl/exec";

  const STORAGE_KEY_EMPLOYEES = 'kuk_master_employees_v4'; // v4: Gaji Pokok Bangunan Rp 850.000 & Palen Rp 700.000
  const STORAGE_KEY_USERS = 'kuk_master_users';
  const STORAGE_KEY_VEHICLES = 'kuk_master_vehicles';

  const UNITS = ['KUK Bangunan', 'KUK Palen'];
  const DEPARTMENTS = ['Admin & Kasir', 'Operasional Toko', 'Gudang & Stok', 'Logistik & Pengiriman', 'Penjualan & Kasir', 'Produksi & Potong Kaca', 'Operasional Palen', 'HR & Manajemen'];
  const POSITIONS = ['Admin', 'Kepala Toko Operasional', 'Kepala Gudang', 'Pengiriman', 'Frontliner', 'Staf Palen', 'Koordinator', 'Pimpinan', 'HRD', 'Bendahara', 'Inventaris', 'Sekretaris'];

  // 11 Karyawan Resmi KUK (Database HRD Utama)
  // Gaji Pokok: KUK Bangunan = Rp 850.000 | KUK Palen = Rp 700.000 (Dapat diedit bebas di menu HRD)
  const DEFAULT_EMPLOYEES = [
    { id: 'K-002', nik: '3502010002', nama: 'Wiba', fullName: 'Wiba Prasetiyo', unit: 'KUK Bangunan', department: 'Gudang & Stok', position: 'Staf Gudang Bangunan', gajiPokok: 850000, gajiBagian: 250000, sudahBerkeluarga: true, totalPelanggaran: 0, status: 'Active', fingerprintId: '2', hireDate: '2023-01-01', contactNumber: '085712345678' },
    { id: 'K-003', nik: '3502010003', nama: 'Ulin', fullName: 'Nurhadi (Ulin)', unit: 'KUK Bangunan', department: 'Gudang & Stok', position: 'Kepala Gudang Bangunan', gajiPokok: 850000, gajiBagian: 350000, sudahBerkeluarga: true, totalPelanggaran: 0, status: 'Active', fingerprintId: '3', hireDate: '2022-05-10', contactNumber: '081345678901' },
    { id: 'K-004', nik: '3502010004', nama: 'Kahfi', fullName: 'Kahfi Ashari', unit: 'KUK Bangunan', department: 'Penjualan & Kasir', position: 'Staf Pelayanan Bangunan', gajiPokok: 850000, gajiBagian: 200000, sudahBerkeluarga: false, totalPelanggaran: 0, status: 'Active', fingerprintId: '4', hireDate: '2023-03-15', contactNumber: '081377889900' },
    { id: 'K-005', nik: '3502010005', nama: 'Agus', fullName: 'Agus Santoso', unit: 'KUK Bangunan', department: 'Operasional Toko', position: 'Staf Operasional Bangunan', gajiPokok: 850000, gajiBagian: 250000, sudahBerkeluarga: true, totalPelanggaran: 0, status: 'Active', fingerprintId: '5', hireDate: '2021-08-20', contactNumber: '081298765432' },
    { id: 'K-007', nik: '3502010007', nama: 'Alip', fullName: 'Alif Kurniawan', unit: 'KUK Bangunan', department: 'Logistik & Pengiriman', position: 'Pengiriman & Supir', gajiPokok: 850000, gajiBagian: 200000, sudahBerkeluarga: false, totalPelanggaran: 0, status: 'Active', fingerprintId: '7', hireDate: '2023-06-01', contactNumber: '085733445566' },
    { id: 'K-008', nik: '3502010008', nama: 'Riyan', fullName: 'Ariyan Saputra', unit: 'KUK Bangunan', department: 'Penjualan & Kasir', position: 'Staf Pelayanan Bangunan', gajiPokok: 850000, gajiBagian: 200000, sudahBerkeluarga: false, totalPelanggaran: 0, status: 'Active', fingerprintId: '8', hireDate: '2023-07-10', contactNumber: '085711223344' },
    { id: 'K-009', nik: '3502010009', nama: 'Hiba', fullName: 'Hiba Pratama', unit: 'KUK Bangunan', department: 'Gudang & Stok', position: 'Staf Gudang Bangunan', gajiPokok: 850000, gajiBagian: 200000, sudahBerkeluarga: false, totalPelanggaran: 0, status: 'Active', fingerprintId: '9', hireDate: '2023-07-15', contactNumber: '085799887766' },
    { id: 'K-010', nik: '3502010010', nama: 'Rohman', fullName: 'Lailurrohman', unit: 'KUK Bangunan', department: 'Gudang & Stok', position: 'Staf Gudang Bangunan', gajiPokok: 850000, gajiBagian: 200000, sudahBerkeluarga: false, totalPelanggaran: 0, status: 'Active', fingerprintId: '10', hireDate: '2023-08-01', contactNumber: '081288990011' },
    { id: 'K-011', nik: '3502010011', nama: 'Irfan', fullName: 'Irfan Maulana (Logistik)', unit: 'KUK Bangunan', department: 'Logistik & Pengiriman', position: 'Supir Armada Logistik', gajiPokok: 850000, gajiBagian: 300000, sudahBerkeluarga: true, totalPelanggaran: 0, status: 'Active', fingerprintId: '11', hireDate: '2023-09-01', contactNumber: '085755667788' },
    { id: 'K-012', nik: '3502020012', nama: 'Nukul', fullName: 'Nukul Hidayat', unit: 'KUK Palen', department: 'Operasional Palen', position: 'Staf Gudang Palen', gajiPokok: 700000, gajiBagian: 200000, sudahBerkeluarga: false, totalPelanggaran: 0, status: 'Active', fingerprintId: '12', hireDate: '2023-10-01', contactNumber: '085678912344' },
    { id: 'K-013', nik: '3502020013', nama: 'Miftah', fullName: 'Miftahul Huda', unit: 'KUK Palen', department: 'Operasional Palen', position: 'Staf Operasional Palen', gajiPokok: 700000, gajiBagian: 200000, sudahBerkeluarga: false, totalPelanggaran: 0, status: 'Active', fingerprintId: '13', hireDate: '2023-10-15', contactNumber: '081234567811' }
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
    if (!employees || employees.length === 0 || isContaminated) {
      employees = DEFAULT_EMPLOYEES;
      saveStored(STORAGE_KEY_EMPLOYEES, employees);
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
    deleteUser: (id) => {
      let users = getStored(STORAGE_KEY_USERS) || DEFAULT_USERS;
      users = users.filter(u => u.id !== id);
      saveStored(STORAGE_KEY_USERS, users);
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
    }
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
