/**
 * master_db.js
 * Unified Master Database for KUK HR Portal.
 * Handles Employees, Users, Units, Departments, Positions, and Vehicles.
 * Provides relationships and handles automatic migration from legacy structures.
 */

const MasterDB = (() => {
  const STORAGE_KEY_EMPLOYEES = 'kuk_master_employees';
  const STORAGE_KEY_USERS = 'kuk_master_users';
  const STORAGE_KEY_VEHICLES = 'kuk_master_vehicles';

  const UNITS = ['KUK Bangunan', 'KUK Palen'];
  const DEPARTMENTS = ['Gudang', 'Operasional', 'Pelayanan', 'Logistik', 'Manajemen', 'HRD & Finance'];
  const POSITIONS = ['Kepala', 'Staf', 'Supir', 'Pimpinan', 'Bendahara / Finance', 'HRD / Staff Personalia'];

  let dbInitialized = false;

  function initDB() {
    if (dbInitialized) return;
    
    // 1. Initialize Employees & Migrate Legacy Data
    let employees = getStored(STORAGE_KEY_EMPLOYEES);
    if (!employees) {
      employees = migrateLegacyEmployees();
      saveStored(STORAGE_KEY_EMPLOYEES, employees);
    }

    // 2. Initialize Users & Migrate Legacy Data
    let users = getStored(STORAGE_KEY_USERS);
    if (!users) {
      users = migrateLegacyUsers(employees);
      saveStored(STORAGE_KEY_USERS, users);
    }

    // 3. Initialize Vehicles & Migrate Legacy Data
    let vehicles = getStored(STORAGE_KEY_VEHICLES);
    if (!vehicles) {
      vehicles = migrateLegacyVehicles();
      saveStored(STORAGE_KEY_VEHICLES, vehicles);
    }

    dbInitialized = true;
  }

  // --- Helpers ---
  function getStored(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  function saveStored(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  // --- MIGRATIONS ---
  function migrateLegacyEmployees() {
    const legacy = localStorage.getItem('kuk_db_rekontrak_v1');
    const migrated = [];
    
    if (legacy) {
      const parsed = JSON.parse(legacy);
      parsed.forEach(emp => {
        let dept = 'Operasional';
        if (emp.jabatan) {
          if (emp.jabatan.toLowerCase().includes('gudang')) dept = 'Gudang';
          else if (emp.jabatan.toLowerCase().includes('pelayanan')) dept = 'Pelayanan';
          else if (emp.jabatan.toLowerCase().includes('logistik') || emp.jabatan.toLowerCase().includes('supir')) dept = 'Logistik';
        }

        let pos = 'Staf';
        if (emp.jabatan) {
          if (emp.jabatan.toLowerCase().includes('kepala')) pos = 'Kepala';
          else if (emp.jabatan.toLowerCase().includes('supir')) pos = 'Supir';
        }

        migrated.push({
          id: emp.idKaryawan || generateId('EMP'),
          fullName: emp.namaLengkap || 'Unknown',
          unit: (emp.toko || '').toLowerCase() === 'palen' ? 'KUK Palen' : 'KUK Bangunan',
          department: dept,
          position: pos,
          status: (emp.statusKontrak === 'Tidak Aktif' || emp.statusKontrak === 'Tidak Aktif (Bukan Karyawan)') ? 'Inactive' : 'Active',
          fingerprintId: '', // To be filled manually
          hireDate: emp.tglMulaiKontrak || '',
          contactNumber: emp.noHp || ''
        });
      });
    }

    if (migrated.length === 0) {
      migrated.push({
        id: 'EMP-001',
        fullName: 'Admin KUK',
        unit: 'KUK Bangunan',
        department: 'Manajemen',
        position: 'Pimpinan',
        status: 'Active',
        fingerprintId: '1',
        hireDate: '2020-01-01',
        contactNumber: '0800000000'
      });
    }

    return migrated;
  }

  function migrateLegacyUsers(employees) {
    const legacy = localStorage.getItem('kuk_users_db');
    const migrated = [];

    if (legacy) {
      const parsed = JSON.parse(legacy);
      parsed.forEach(u => {
        // Try to link to an employee by name
        let linkedEmp = employees.find(e => e.fullName.toLowerCase() === (u.namaLengkap || '').toLowerCase());
        
        // If not found, create a placeholder employee for this user
        if (!linkedEmp) {
          linkedEmp = {
            id: generateId('EMP'),
            fullName: u.namaLengkap || u.username,
            unit: 'KUK Bangunan',
            department: 'Manajemen',
            position: u.jabatan || 'Staf',
            status: 'Active',
            fingerprintId: '',
            hireDate: '',
            contactNumber: ''
          };
          employees.push(linkedEmp);
          saveStored(STORAGE_KEY_EMPLOYEES, employees); // Update employees DB immediately
        }

        migrated.push({
          id: generateId('USR'),
          username: u.username,
          password: u.password || '12345',
          employeeId: linkedEmp.id,
          permissions: u.permissions || []
        });
      });
    }

    if (migrated.length === 0) {
      const adminEmp = employees[0];
      migrated.push({
        id: generateId('USR'),
        username: 'admin',
        password: '123',
        employeeId: adminEmp.id,
        permissions: ['absen', 'cuti', 'pelanggaran', 'dashboard', 'tip', 'users']
      });
    }

    return migrated;
  }

  function migrateLegacyVehicles() {
    return [
      { id: 'KND-L300', name: 'Mitsubishi L300', plate: 'L300', type: 'Pick Up / Angkutan Logistik', status: 'Tersedia' },
      { id: 'KND-ENGKEL', name: 'Truk Engkel', plate: 'Engkel', type: 'Truk Muatan / Kargo', status: 'Tersedia' },
      { id: 'KND-VIAR', name: 'Viar Roda Tiga', plate: 'Viar', type: 'Angkutan Operasional / Gudang', status: 'Tersedia' },
      { id: 'KND-FORKLIFT', name: 'Forklift', plate: 'Forklift', type: 'Alat Berat Operasional Gudang', status: 'Tersedia' }
    ];
  }

  // --- API ---
  return {
    init: initDB,
    
    getUnits: () => [...UNITS],
    getDepartments: () => [...DEPARTMENTS],
    getPositions: () => [...POSITIONS],

    // Employees
    getEmployees: () => getStored(STORAGE_KEY_EMPLOYEES) || [],
    getEmployee: (id) => {
      const emps = getStored(STORAGE_KEY_EMPLOYEES) || [];
      return emps.find(e => e.id === id);
    },
    saveEmployee: (emp) => {
      const emps = getStored(STORAGE_KEY_EMPLOYEES) || [];
      if (!emp.id) emp.id = generateId('EMP');
      const idx = emps.findIndex(e => e.id === emp.id);
      if (idx > -1) emps[idx] = emp;
      else emps.push(emp);
      saveStored(STORAGE_KEY_EMPLOYEES, emps);
      return emp;
    },
    deleteEmployee: (id) => {
      let emps = getStored(STORAGE_KEY_EMPLOYEES) || [];
      emps = emps.filter(e => e.id !== id);
      saveStored(STORAGE_KEY_EMPLOYEES, emps);
      
      // Cascade delete user
      let users = getStored(STORAGE_KEY_USERS) || [];
      users = users.filter(u => u.employeeId !== id);
      saveStored(STORAGE_KEY_USERS, users);
    },

    // Users
    getUsers: () => getStored(STORAGE_KEY_USERS) || [],
    getUsersWithEmployee: () => {
      const users = getStored(STORAGE_KEY_USERS) || [];
      const emps = getStored(STORAGE_KEY_EMPLOYEES) || [];
      return users.map(u => ({
        ...u,
        employee: emps.find(e => e.id === u.employeeId) || null
      }));
    },
    getUser: (id) => {
      const users = getStored(STORAGE_KEY_USERS) || [];
      return users.find(u => u.id === id);
    },
    saveUser: (user) => {
      const users = getStored(STORAGE_KEY_USERS) || [];
      if (!user.id) user.id = generateId('USR');
      const idx = users.findIndex(u => u.id === user.id);
      if (idx > -1) users[idx] = user;
      else users.push(user);
      saveStored(STORAGE_KEY_USERS, users);
      return user;
    },
    deleteUser: (id) => {
      let users = getStored(STORAGE_KEY_USERS) || [];
      users = users.filter(u => u.id !== id);
      saveStored(STORAGE_KEY_USERS, users);
    },

    // Vehicles
    getVehicles: () => getStored(STORAGE_KEY_VEHICLES) || [],
    saveVehicle: (veh) => {
      const vehs = getStored(STORAGE_KEY_VEHICLES) || [];
      if (!veh.id) veh.id = generateId('KND');
      const idx = vehs.findIndex(v => v.id === veh.id);
      if (idx > -1) vehs[idx] = veh;
      else vehs.push(veh);
      saveStored(STORAGE_KEY_VEHICLES, vehs);
      return veh;
    },
    deleteVehicle: (id) => {
      let vehs = getStored(STORAGE_KEY_VEHICLES) || [];
      vehs = vehs.filter(v => v.id !== id);
      saveStored(STORAGE_KEY_VEHICLES, vehs);
    }
  };
})();

MasterDB.init();
