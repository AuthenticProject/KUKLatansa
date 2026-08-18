/**
 * fingerprint_engine.js
 * Hardened engine for parsing, mapping, validating, and immutably storing Fingerprint Attendance Data.
 * Includes concurrency locks, file upload validation, and tamper-proof audit trails.
 */

const FingerprintEngine = (() => {
  'use strict';

  const STORAGE_KEY_RAW = 'kuk_raw_fingerprints';
  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit
  const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

  function getRawData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RAW);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
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

  // Validate File metadata before parsing
  function validateFileMetadata(file) {
    if (!file) throw new Error("File tidak ditemukan.");

    // Check size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      if (typeof Security !== 'undefined') {
        Security.audit('FILE_UPLOAD_REJECTED', { reason: 'FILE_TOO_LARGE', size: file.size, name: file.name }, 'WARN');
      }
      throw new Error(`Ukuran file melebihi batas maksimal (Maks: 5MB). Ukuran file Anda: ${(file.size / (1024 * 1024)).toFixed(2)} MB.`);
    }

    // Check extension
    const fileName = (file.name || '').toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    if (!hasValidExt) {
      if (typeof Security !== 'undefined') {
        Security.audit('FILE_UPLOAD_REJECTED', { reason: 'INVALID_EXTENSION', name: file.name }, 'WARN');
      }
      throw new Error(`Format file tidak didukung (${fileName}). Harap unggah file Excel (.xlsx, .xls) atau .csv.`);
    }

    return true;
  }

  // Expects file object from input type="file"
  async function parseExcelFile(file) {
    validateFileMetadata(file);

    return new Promise((resolve, reject) => {
      const XLSXLib = typeof window !== 'undefined' ? window.XLSX : (typeof XLSX !== 'undefined' ? XLSX : null);
      if (!XLSXLib) {
        return reject(new Error("Library SheetJS (XLSX) belum dimuat."));
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSXLib.read(data, { type: 'array' });
          if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error("File Excel kosong atau tidak memiliki lembar kerja.");
          }

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          if (!worksheet) {
            throw new Error("Lembar kerja Excel pertama tidak dapat dibaca.");
          }
          
          // Convert sheet to JSON array
          const jsonArray = XLSXLib.utils.sheet_to_json(worksheet, { raw: false });
          if (!jsonArray || jsonArray.length === 0) {
            throw new Error("Data tabel dalam file Excel kosong.");
          }

          resolve(jsonArray);
        } catch (err) {
          if (typeof Security !== 'undefined') {
            Security.audit('MALFORMED_EXCEL_PARSING_FAILED', { error: err.message, name: file.name }, 'WARN');
          }
          reject(new Error("Gagal mem-parsing file Excel. Format file rusak atau tidak valid: " + err.message));
        }
      };
      reader.onerror = () => reject(new Error("Gagal membaca file dari media penyimpanan."));
      reader.readAsArrayBuffer(file);
    });
  }

  // Heuristic mapping: Find columns matching "PIN", "ID", "Tanggal", "Date", "Jam", "Waktu"
  function mapColumnsAndValidate(jsonRows) {
    if (!jsonRows || jsonRows.length === 0) throw new Error("Data baris kosong.");

    // Determine headers from first row
    const firstRow = jsonRows[0];
    const keys = Object.keys(firstRow);
    
    let pinKey = keys.find(k => k.toLowerCase().includes('pin') || k.toLowerCase() === 'id' || k.toLowerCase().includes('id kar') || k.toLowerCase().includes('no. id'));
    let dateKey = keys.find(k => k.toLowerCase().includes('tanggal') || k.toLowerCase().includes('date') || k.toLowerCase() === 'tgl');
    let timeKey = keys.find(k => k.toLowerCase().includes('jam') || k.toLowerCase().includes('time') || k.toLowerCase() === 'waktu');

    if (!pinKey || !dateKey || !timeKey) {
      // Sometimes machines export Date and Time in one column "Date Time"
      const dateTimeKey = keys.find(k => k.toLowerCase().includes('waktu') || k.toLowerCase().includes('date time'));
      if (dateTimeKey && pinKey) {
        dateKey = dateTimeKey;
        timeKey = dateTimeKey;
      } else {
        throw new Error(`Struktur kolom tidak sesuai standar. Pastikan ada kolom untuk PIN/ID, Tanggal, dan Jam.`);
      }
    }

    const employees = typeof MasterDB !== 'undefined' && MasterDB.getEmployees ? MasterDB.getEmployees() : [];
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

    jsonRows.forEach((row) => {
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
      existingSet.add(uniqueKey); // Prevent multiple duplicates within the same upload file
    });

    return stats;
  }

  function commitImport(processedRows) {
    if (!processedRows || processedRows.length === 0) return 0;

    // Acquire Concurrency Lock to prevent race condition during batch import
    let lock = null;
    if (typeof Security !== 'undefined' && Security.acquireLock) {
      lock = Security.acquireLock('FINGERPRINT_IMPORT_LOCK', 15000);
      if (!lock.acquired) {
        throw new Error(`Proses import sedang berjalan oleh ${lock.lockedBy}. Harap tunggu sebentar.`);
      }
    }

    try {
      saveRawData(processedRows);

      if (typeof Security !== 'undefined' && Security.audit) {
        Security.audit('FINGERPRINT_IMPORT_COMMITTED', {
          count: processedRows.length,
          timestamp: new Date().toISOString()
        }, 'INFO');
      }

      return processedRows.length;
    } finally {
      if (typeof Security !== 'undefined' && Security.releaseLock) {
        Security.releaseLock('FINGERPRINT_IMPORT_LOCK');
      }
    }
  }

  return {
    getRawData,
    validateFileMetadata,
    parseExcelFile,
    mapColumnsAndValidate,
    commitImport
  };
})();

if (typeof window !== 'undefined') {
  window.FingerprintEngine = FingerprintEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FingerprintEngine;
}
