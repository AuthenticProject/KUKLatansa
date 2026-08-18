/**
 * fingerprint_engine.js
 * Engine for parsing, mapping, validating, and immutably storing Fingerprint Attendance Data
 */

const FingerprintEngine = (() => {
  const STORAGE_KEY_RAW = 'kuk_raw_fingerprints';

  function getRawData() {
    const raw = localStorage.getItem(STORAGE_KEY_RAW);
    return raw ? JSON.parse(raw) : [];
  }

  function saveRawData(newDataArray) {
    // Immutable append: never overwrite existing valid rows
    const existing = getRawData();
    const combined = [...existing, ...newDataArray];
    // Sort by Date, then Time
    combined.sort((a, b) => {
      const dtA = new Date(a.date + ' ' + a.time);
      const dtB = new Date(b.date + ' ' + b.time);
      return dtA - dtB;
    });
    localStorage.setItem(STORAGE_KEY_RAW, JSON.stringify(combined));
  }

  // Expects file object from input type="file"
  async function parseExcelFile(file) {
    return new Promise((resolve, reject) => {
      if (!window.XLSX) {
        return reject(new Error("Library SheetJS (XLSX) belum dimuat."));
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert sheet to JSON array (array of arrays to handle varying headers)
          const jsonArray = XLSX.utils.sheet_to_json(worksheet, { raw: false });
          resolve(jsonArray);
        } catch (err) {
          reject(new Error("Gagal mem-parsing file Excel. Format tidak didukung."));
        }
      };
      reader.onerror = () => reject(new Error("Gagal membaca file."));
      reader.readAsArrayBuffer(file);
    });
  }

  // Heuristic mapping: Find columns matching "PIN", "ID", "Tanggal", "Date", "Jam", "Waktu"
  function mapColumnsAndValidate(jsonRows) {
    if (!jsonRows || jsonRows.length === 0) throw new Error("File kosong atau format salah.");

    // Determine headers from first row
    const firstRow = jsonRows[0];
    const keys = Object.keys(firstRow);
    
    let pinKey = keys.find(k => k.toLowerCase().includes('pin') || k.toLowerCase() === 'id' || k.toLowerCase().includes('id kar'));
    let dateKey = keys.find(k => k.toLowerCase().includes('tanggal') || k.toLowerCase().includes('date') || k.toLowerCase() === 'tgl');
    let timeKey = keys.find(k => k.toLowerCase().includes('jam') || k.toLowerCase().includes('time') || k.toLowerCase() === 'waktu');

    if (!pinKey || !dateKey || !timeKey) {
      // Sometimes machines export Date and Time in one column "Date Time"
      const dateTimeKey = keys.find(k => k.toLowerCase().includes('waktu') || k.toLowerCase().includes('date time'));
      if (dateTimeKey && pinKey) {
        dateKey = dateTimeKey;
        timeKey = dateTimeKey; // We will split them later
      } else {
        throw new Error(`Kolom wajib tidak ditemukan. Pastikan ada kolom untuk PIN, Tanggal, dan Jam.`);
      }
    }

    const employees = MasterDB.getEmployees();
    const existingRaw = getRawData();
    
    // Quick hash map for duplicate detection: Set of "PIN_DATE_TIME"
    const existingSet = new Set(existingRaw.map(r => `${r.pin}_${r.date}_${r.time}`));

    const stats = {
      total: 0,
      valid: 0,
      duplicates: 0,
      unmatched: 0,
      invalid: 0,
      processedRows: []
    };

    jsonRows.forEach((row, index) => {
      stats.total++;
      
      let pin = (row[pinKey] || '').toString().trim();
      let dateVal = (row[dateKey] || '').toString().trim();
      let timeVal = (row[timeKey] || '').toString().trim();

      // If Date and Time are in the same column (e.g. "2023-10-01 08:00:00")
      if (dateKey === timeKey && dateVal.includes(' ')) {
        const parts = dateVal.split(' ');
        dateVal = parts[0];
        timeVal = parts[1];
      }

      if (!pin || !dateVal || !timeVal) {
        stats.invalid++;
        return; // Skip invalid
      }

      // Format standard: YYYY-MM-DD
      // If machine exports MM/DD/YYYY or DD/MM/YYYY, need parsing. 
      // Assuming SheetJS `{raw: false}` gives local string or simple format.
      // We will leave the raw string for now, or attempt basic cleanup
      dateVal = dateVal.replace(/\//g, '-'); 

      const uniqueKey = `${pin}_${dateVal}_${timeVal}`;
      
      // Duplicate Check
      if (existingSet.has(uniqueKey)) {
        stats.duplicates++;
        return;
      }

      // Employee Match
      const matchedEmp = employees.find(e => e.fingerprintId && e.fingerprintId.toString() === pin);
      
      const payloadRow = {
        pin: pin,
        date: dateVal,
        time: timeVal,
        employeeId: matchedEmp ? matchedEmp.id : null,
        employeeName: matchedEmp ? matchedEmp.fullName : 'TIDAK DIKETAHUI',
        importedAt: new Date().toISOString()
      };

      if (!matchedEmp) {
        stats.unmatched++;
      } else {
        stats.valid++;
      }

      stats.processedRows.push(payloadRow);
      // prevent multiple duplicates within the same upload file
      existingSet.add(uniqueKey); 
    });

    return stats;
  }

  function commitImport(processedRows) {
    // We only commit rows that are matched to an employee to keep data clean, 
    // OR we commit all non-duplicate rows (including unmatched) for auditing.
    // The requirement says "Raw attendance must remain immutable." 
    // And "Admin must be able to resolve mapping issues before committing."
    // For safety, we commit all passed-in rows. The UI should block if there are unmatched,
    // or warn the admin.
    
    if(!processedRows || processedRows.length === 0) return 0;
    saveRawData(processedRows);
    return processedRows.length;
  }

  return {
    getRawData,
    parseExcelFile,
    mapColumnsAndValidate,
    commitImport
  };
})();
