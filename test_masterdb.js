// Simple mock for testing without JSDOM
const localStorageStore = {};
global.localStorage = {
    getItem: key => localStorageStore[key] || null,
    setItem: (key, val) => localStorageStore[key] = String(val),
    removeItem: key => delete localStorageStore[key],
    clear: () => { for (let key in localStorageStore) delete localStorageStore[key]; }
};

// Mock legacy data
localStorage.setItem('kuk_db_rekontrak_v1', JSON.stringify([
  { idKaryawan: 'KRY-TEST-001', namaLengkap: 'Budi Test', toko: 'bangunan', jabatan: 'Staf Gudang' }
]));
localStorage.setItem('kuk_users_db', JSON.stringify([
  { username: 'budi', password: '123', namaLengkap: 'Budi Test', permissions: ['absen'] }
]));

// Load the MasterDB
const fs = require('fs');
const masterDbCode = fs.readFileSync('shared/master_db.js', 'utf8');

try {
    eval(masterDbCode);
    
    console.log("MasterDB Initialized successfully.");
    
    const emps = MasterDB.getEmployees();
    console.log("Employees Count:", emps.length);
    const users = MasterDB.getUsers();
    console.log("Users Count:", users.length);
    
    const budiEmp = emps.find(e => e.fullName === 'Budi Test');
    if (budiEmp) console.log("Success: Migrated employee Budi Test");
    else console.log("Fail: Did not migrate employee Budi Test");
    
    const budiUser = users.find(u => u.username === 'budi');
    if (budiUser && budiUser.employeeId === budiEmp.id) {
        console.log("Success: User linked to Employee correctly.");
    } else {
        console.log("Fail: User not linked correctly.");
    }
    
} catch(e) {
    console.error("Test failed:", e);
}
