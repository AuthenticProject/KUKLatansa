// test_fingerprint.js
const fs = require('fs');

const localStorageStore = {};
global.localStorage = {
    getItem: key => localStorageStore[key] || null,
    setItem: (key, val) => localStorageStore[key] = String(val),
    removeItem: key => delete localStorageStore[key],
    clear: () => { for (let key in localStorageStore) delete localStorageStore[key]; }
};

// Mock MasterDB
global.MasterDB = {
    getEmployees: () => [
        { id: 'EMP-001', fullName: 'Alice', fingerprintId: '100' },
        { id: 'EMP-002', fullName: 'Bob', fingerprintId: '101' }
    ]
};

const engineCode = fs.readFileSync('shared/fingerprint_engine.js', 'utf8');

try {
    eval(engineCode);
    
    // Mock Parsed JSON from Excel
    const mockJsonRows = [
        { "PIN": 100, "Tanggal": "2023-10-01", "Jam": "08:00" }, // Valid Alice
        { "PIN": 101, "Tanggal": "2023-10-01", "Jam": "08:05" }, // Valid Bob
        { "PIN": 999, "Tanggal": "2023-10-01", "Jam": "08:10" }, // Unmatched
        { "PIN": 100, "Tanggal": "2023-10-01", "Jam": "08:00" }, // Duplicate within same file
        { "Waktu": "2023-10-02 09:00", "PIN": 100 } // Format 2 (Combined DateTime)
    ];
    
    console.log("Testing validation...");
    const stats = FingerprintEngine.mapColumnsAndValidate(mockJsonRows);
    
    console.log(stats);
    if(stats.total === 5 && stats.valid === 3 && stats.unmatched === 1 && stats.duplicates === 1) {
        console.log("PASS: Validation statistics correct.");
    } else {
        console.error("FAIL: Validation statistics wrong.");
    }
    
    console.log("Testing commit...");
    FingerprintEngine.commitImport(stats.processedRows);
    
    const raw = FingerprintEngine.getRawData();
    if(raw.length === 4) { // 3 valid + 1 unmatched, duplicate skipped
        console.log("PASS: Data committed correctly.");
    } else {
        console.error("FAIL: Commit failed.");
    }

    console.log("Testing duplicate on second upload...");
    const stats2 = FingerprintEngine.mapColumnsAndValidate([
        { "PIN": 100, "Tanggal": "2023-10-01", "Jam": "08:00" }, // Already uploaded
        { "PIN": 100, "Tanggal": "2023-10-03", "Jam": "08:00" }  // New
    ]);

    if(stats2.duplicates === 1 && stats2.valid === 1) {
        console.log("PASS: Duplicate detection from existing DB correct.");
    } else {
        console.error("FAIL: Duplicate detection wrong.", stats2);
    }
    
} catch(e) {
    console.error(e);
}
