/**
 * fingerprint_engine.js
 * Hardened engine for parsing, mapping, validating, analyzing discipline,
 * and immutably storing Fingerprint Attendance Data for KUK La Tansa.
 * 
 * Supports:
 * 1. Standard Multi-sheet Machine Reports (e.g. StandardReport.xls with 'Lap. Log Absen' & individual cards).
 * 2. Cross-referencing official leave database (kuk_db_cuti_v1) to distinguish Leave (no deduction) vs Alpa (Rp 28.500/day deduction).
 * 3. Exact discipline analysis: Masuk > 07:05 (Telat), Istirahat > 60 mnt (Over-Break), Pulang < 15:55 (Pulang Awal).
 * 4. Standard tabular Excel/CSV imports (PIN, Tanggal, Jam).
 */

const FingerprintEngine = (() => {
  'use strict';

  const STORAGE_KEY_RAW = 'kuk_raw_fingerprints';
  const STORAGE_KEY_CUTI = 'kuk_db_cuti_v1';
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit
  const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

  const RULES = {
    shiftStart: '07:00',
    lateToleranceMinutes: 5, // Toleransi sampai 07:05
    shiftEnd: '16:00',
    earlyLeaveTolerance: '15:55',
    maxBreakMinutes: 60,     // Maksimal istirahat 60 menit
    lateDeductionRate: 2000, // Rp 2.000 / hari terlambat
    absenceDeductionRate: 28500 // Rp 28.500 / hari tidak masuk
  };

  function cleanName(str) {
    return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /**
   * Smart Name Matcher: Mencocokkan nama mesin (e.g. 'mas agus', 'mas nur', 'IRVAN~', 'Arian', 'Alif') dengan master DB
   */
  function matchEmployeeSmart(pin, rawName, employees) {
    const pinStr = (pin || '').toString().trim();
    const cRaw = cleanName(rawName);

    // 1. Cocokkan berdasarkan Fingerprint PIN jika sudah terdaftar
    let matched = employees.find(e => e.fingerprintId && e.fingerprintId.toString() === pinStr);
    if (matched) return matched;

    // 2. Kamus Alias & Panggilan KUK
    const ALIAS_MAP = {
      'masagus': 'Agus',
      'agus': 'Agus',
      'masnur': 'Ulin',
      'ulin': 'Ulin',
      'nurhadi': 'Ulin',
      'kahfi': 'Kahfi',
      'alif': 'Alip',
      'alip': 'Alip',
      'arian': 'Riyan',
      'ariyan': 'Riyan',
      'riyan': 'Riyan',
      'hiba': 'Hiba',
      'rohman': 'Rohman',
      'lailur': 'Rohman',
      'irvan': 'Irfan',
      'irfan': 'Irfan',
      'wiba': 'Wiba',
      'nukul': 'Nukul',
      'miftah': 'Miftah'
    };

    for (const [alias, targetShortName] of Object.entries(ALIAS_MAP)) {
      if (cRaw === alias || cRaw.includes(alias)) {
        matched = employees.find(e => e.nama.toLowerCase() === targetShortName.toLowerCase());
        if (matched) return matched;
      }
    }

    // 3. Pencocokan langsung substring
    matched = employees.find(e => {
      const cNama = cleanName(e.nama);
      const cFull = cleanName(e.fullName);
      return cRaw === cNama || cNama === cRaw || (cNama.length >= 4 && cRaw.includes(cNama));
    });
    if (matched) return matched;

    return null;
  }

  function getRawData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RAW);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveRawData(newDataArray) {
    const existing = getRawData();
    const combined = [...existing, ...newDataArray];
    combined.sort((a, b) => {
      const dtA = new Date(a.date + ' ' + (a.time || '00:00'));
      const dtB = new Date(b.date + ' ' + (b.time || '00:00'));
      return dtA - dtB;
    });
    localStorage.setItem(STORAGE_KEY_RAW, JSON.stringify(combined));
  }

  function getCutiList() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_CUTI) || '[]');
    } catch (e) {
      return [];
    }
  }

  function isDateCoveredByCuti(employee, dateStr) {
    const cutiList = getCutiList();
    for (const item of cutiList) {
      const matchEmp = (item.idKaryawan && employee.id && item.idKaryawan === employee.id) ||
                       (item.nama && employee.nama && item.nama.toLowerCase().includes(employee.nama.toLowerCase())) ||
                       (item.nama && employee.fullName && item.nama.toLowerCase().includes(employee.fullName.toLowerCase()));
      if (matchEmp) {
        const st = (item.status || '').toLowerCase();
        if (st === 'ditolak') continue;

        if (Array.isArray(item.tanggal) && item.tanggal.includes(dateStr)) return true;
        if (item.startDate && item.endDate && dateStr >= item.startDate && dateStr <= item.endDate) return true;
        if (item.tanggal === dateStr) return true;
      }
    }
    return false;
  }

  function validateFileMetadata(file) {
    if (!file) throw new Error("File tidak ditemukan.");
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`Ukuran file melebihi batas maksimal (Maks: 10MB). Ukuran file Anda: ${(file.size / (1024 * 1024)).toFixed(2)} MB.`);
    }
    const fileName = (file.name || '').toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    if (!hasValidExt) {
      throw new Error(`Format file tidak didukung (${fileName}). Harap unggah file Excel (.xlsx, .xls) atau .csv.`);
    }
    return true;
  }

  function parseTimeToMinutes(tStr) {
    if (!tStr || !tStr.includes(':')) return null;
    const [h, m] = tStr.split(':').map(Number);
    return isNaN(h) || isNaN(m) ? null : h * 60 + m;
  }

  /**
   * Universal Excel File Parser
   */
  async function parseExcelFile(file) {
    validateFileMetadata(file);

    return new Promise((resolve, reject) => {
      const XLSXLib = typeof window !== 'undefined' ? window.XLSX : (typeof XLSX !== 'undefined' ? XLSX : null);
      if (!XLSXLib) {
        return reject(new Error("Library SheetJS (XLSX) belum dimuat di browser."));
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSXLib.read(data, { type: 'array' });
          if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error("File Excel kosong atau tidak memiliki lembar kerja.");
          }

          // Check if this is a Standard Machine Report (e.g. has 'Lap. Log Absen' or 'Stat. Absen')
          const hasLogSheet = workbook.SheetNames.includes('Lap. Log Absen');
          const hasStatSheet = workbook.SheetNames.includes('Stat. Absen');
          
          if (hasLogSheet || hasStatSheet) {
            const analysisResult = parseStandardMachineReport(workbook, XLSXLib);
            resolve({
              type: 'STANDARD_REPORT',
              ...analysisResult
            });
          } else {
            // Standard Tabular Sheet
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonArray = XLSXLib.utils.sheet_to_json(firstSheet, { raw: false });
            const tableResult = mapColumnsAndValidate(jsonArray);
            resolve({
              type: 'TABULAR',
              ...tableResult
            });
          }
        } catch (err) {
          reject(new Error("Gagal membaca file Excel: " + err.message));
        }
      };
      reader.onerror = () => reject(new Error("Gagal membaca file dari penyimpanan."));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Parser khusus untuk format mesin 'StandardReport.xls' (Sheet 'Lap. Log Absen')
   */
  function parseStandardMachineReport(workbook, XLSXLib) {
    const ws = workbook.Sheets['Lap. Log Absen'] || workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSXLib.utils.sheet_to_json(ws, { header: 1, raw: false });

    // Extract Date Range from Header (e.g. "2026-05-01 ~ 2026-05-31")
    let yearMonthPrefix = new Date().toISOString().slice(0, 7); // Default current YYYY-MM
    let daysInMonth = 31;

    for (let r = 0; r < Math.min(5, data.length); r++) {
      const rowStr = (data[r] || []).join(' ');
      const dateRangeMatch = rowStr.match(/(\d{4}-\d{2})-\d{2}\s*~\s*(\d{4}-\d{2}-\d{2})/);
      if (dateRangeMatch) {
        yearMonthPrefix = dateRangeMatch[1];
        const lastDay = parseInt(dateRangeMatch[2].split('-')[2], 10);
        if (lastDay >= 28 && lastDay <= 31) daysInMonth = lastDay;
        break;
      }
    }

    const employees = typeof MasterDB !== 'undefined' && MasterDB.getEmployees ? MasterDB.getEmployees() : [];
    const existingRaw = getRawData();
    const existingSet = new Set(existingRaw.map(r => `${r.pin}_${r.date}_${r.time}`));

    const employeeReports = [];
    const skippedInactiveEmployees = [];
    const flattenedRows = [];
    let totalPunchesFound = 0;
    let totalDuplicates = 0;

    for (let r = 0; r < data.length; r++) {
      const row = data[r];
      if (row && row[0] && row[0].toString().startsWith('ID:')) {
        const pin = (row[2] || '').toString().trim();
        
        let machineName = 'ID-' + pin;
        for (let c = 0; c < row.length; c++) {
          if (row[c] === 'Nama:' && row[c + 2]) {
            machineName = row[c + 2].toString().trim();
            break;
          }
        }

        // Smart Match with Master DB Employee
        const matchedEmp = matchEmployeeSmart(pin, machineName, employees);

        const empId = matchedEmp ? matchedEmp.id : 'UNREGISTERED-' + pin;
        const empFullName = matchedEmp ? matchedEmp.fullName : machineName;
        const empUnit = matchedEmp ? matchedEmp.unit : (['Nukul', 'Miftah'].some(n => machineName.toLowerCase().includes(n.toLowerCase())) ? 'KUK Palen' : 'KUK Bangunan');

        const scanRow = data[r + 1] || [];
        
        let totalHadir = 0;
        let totalCuti = 0;
        let totalAlpa = 0;
        let totalTelat = 0;
        let totalKelebihanIstirahat = 0;
        let totalMenitKelebihanIstirahat = 0;
        let totalPulangAwal = 0;
        let totalIncomplete = 0;
        const dailyLogs = [];
        const tempFlattened = [];

        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${yearMonthPrefix}-${String(day).padStart(2, '0')}`;
          const cell = scanRow[day - 1];
          const rawPunches = cell ? cell.toString().trim() : '';

          const punches = [];
          for (let i = 0; i < rawPunches.length; i += 5) {
            const p = rawPunches.substring(i, i + 5);
            if (p.includes(':')) punches.push(p);
          }

          // Cek apakah hari libur/Minggu
          const dayOfWeek = new Date(dateStr).getDay();
          const isSunday = dayOfWeek === 0;

          // Cross-check Cuti Database
          const isLeave = matchedEmp ? isDateCoveredByCuti(matchedEmp, dateStr) : false;

          if (punches.length === 0) {
            if (isLeave) {
              totalCuti++;
              dailyLogs.push({ date: dateStr, status: 'LEAVE', punches: [], note: 'Cuti Resmi' });
            } else if (isSunday) {
              dailyLogs.push({ date: dateStr, status: 'OFF', punches: [], note: 'Hari Libur / Minggu' });
            } else {
              totalAlpa++;
              dailyLogs.push({ date: dateStr, status: 'ABSENT', punches: [], note: 'Tidak Masuk / Alpa (Potong Rp 28.500)' });
            }
            continue;
          }

          // Karyawan Hadir
          totalHadir++;
          const inTime = punches[0];
          const outTime = punches.length > 1 ? punches[punches.length - 1] : null;

          const isFriday = (dayOfWeek === 5);

          // 1. Evaluasi Keterlambatan Masuk
          // Normal: Jadwal 07:00, Toleransi 07:05
          // Jumat: Jadwal 08:00, Toleransi 08:05
          let isLate = false;
          let lateMinutes = 0;
          const inMinutes = parseTimeToMinutes(inTime);
          if (inMinutes !== null) {
            const shiftStartMin = isFriday ? (8 * 60) : (7 * 60);
            const thresholdMinutes = shiftStartMin + RULES.lateToleranceMinutes; // Jumat: 08:05 (485m), Lainnya: 07:05 (425m)
            if (inMinutes > thresholdMinutes) {
              isLate = true;
              lateMinutes = inMinutes - shiftStartMin;
              totalTelat++;
            }
          }

          // 2. Evaluasi Kelebihan Istirahat
          // Normal: Jendela 12.00-14.00, Durasi Maks 60 Menit
          // Jumat: Jendela 10.30-13.30, Durasi Maks 180 Menit (3 Jam)
          let breakDuration = 0;
          let breakExcessMinutes = 0;
          let isBreakExcess = false;
          let breakOutTime = null;
          let breakInTime = null;

          const maxAllowedBreak = isFriday ? 180 : RULES.maxBreakMinutes; // 180m (Jumat) vs 60m (Biasa)

          if (punches.length >= 4) {
            breakOutTime = punches[1];
            breakInTime = punches[2];
            const bo = parseTimeToMinutes(breakOutTime);
            const bi = parseTimeToMinutes(breakInTime);
            if (bo !== null && bi !== null && bi > bo) {
              breakDuration = bi - bo;
              if (breakDuration > maxAllowedBreak) {
                isBreakExcess = true;
                breakExcessMinutes = breakDuration - maxAllowedBreak;
                totalKelebihanIstirahat++;
                totalMenitKelebihanIstirahat += breakExcessMinutes;
              }
            }
          }

          // 3. Evaluasi Pulang Awal (< 15:55)
          let isEarlyLeave = false;
          if (outTime && punches.length > 1) {
            const outMinutes = parseTimeToMinutes(outTime);
            const earlyThreshold = parseTimeToMinutes(RULES.earlyLeaveTolerance); // 15:55
            if (outMinutes !== null && outMinutes < earlyThreshold) {
              isEarlyLeave = true;
              totalPulangAwal++;
            }
          } else if (!outTime) {
            totalIncomplete++;
          }

          dailyLogs.push({
            date: dateStr,
            status: isLate ? 'LATE' : (punches.length === 1 ? 'INCOMPLETE' : 'PRESENT'),
            punches: punches,
            inTime: inTime,
            outTime: outTime,
            isLate: isLate,
            lateMinutes: lateMinutes,
            breakOutTime: breakOutTime,
            breakInTime: breakInTime,
            breakDuration: breakDuration,
            isBreakExcess: isBreakExcess,
            breakExcessMinutes: breakExcessMinutes,
            isEarlyLeave: isEarlyLeave
          });

          // Add to flattened rows
          punches.forEach(timeStr => {
            totalPunchesFound++;
            const uniqueKey = `${pin}_${dateStr}_${timeStr}`;
            if (existingSet.has(uniqueKey)) {
              totalDuplicates++;
              return;
            }
            tempFlattened.push({
              pin: pin,
              date: dateStr,
              time: timeStr,
              employeeId: matchedEmp ? matchedEmp.id : null,
              employeeName: empFullName,
              importedAt: new Date().toISOString()
            });
            existingSet.add(uniqueKey);
          });
        }

        // FILTER: JIKA TOTAL HADIR == 0 (KOSONG FULL SEBULAN), MAKA SUDAH BUKAN KARYAWAN AKTIF (DIABAIKAN)
        if (totalHadir === 0) {
          skippedInactiveEmployees.push({ pin, machineName, reason: 'Kehadiran 0 hari sepanjang bulan' });
          continue;
        }

        // Tambahkan scan karyawan aktif ke flattenedRows
        tempFlattened.forEach(row => flattenedRows.push(row));

        const alpaDeductionTotal = totalAlpa * RULES.absenceDeductionRate;
        const lateDeductionTotal = totalTelat * RULES.lateDeductionRate;

        employeeReports.push({
          pin,
          machineName,
          employeeId: empId,
          employeeName: empFullName,
          unit: empUnit,
          isMatched: !!matchedEmp,
          totalHadir,
          totalCuti,
          totalAlpa,
          totalTelat,
          totalKelebihanIstirahat,
          totalMenitKelebihanIstirahat,
          totalPulangAwal,
          totalIncomplete,
          alpaDeductionTotal,
          lateDeductionTotal,
          totalPotongan: alpaDeductionTotal + lateDeductionTotal,
          dailyLogs
        });
      }
    }

    return {
      monthPeriod: yearMonthPrefix,
      totalEmployees: employeeReports.length,
      skippedInactiveCount: skippedInactiveEmployees.length,
      skippedInactiveEmployees: skippedInactiveEmployees,
      totalPunches: totalPunchesFound,
      newValidPunches: flattenedRows.length,
      duplicatePunches: totalDuplicates,
      employeeReports: employeeReports,
      processedRows: flattenedRows
    };
  }

  /**
   * Fallback untuk format tabel Excel/CSV standar (PIN, Tanggal, Jam)
   */
  function mapColumnsAndValidate(jsonRows) {
    if (!jsonRows || jsonRows.length === 0) throw new Error("Data baris tabel kosong.");

    const firstRow = jsonRows[0];
    const keys = Object.keys(firstRow);
    
    let pinKey = keys.find(k => k.toLowerCase().includes('pin') || k.toLowerCase() === 'id' || k.toLowerCase().includes('id kar') || k.toLowerCase().includes('no. id'));
    let dateKey = keys.find(k => k.toLowerCase().includes('tanggal') || k.toLowerCase().includes('date') || k.toLowerCase() === 'tgl');
    let timeKey = keys.find(k => k.toLowerCase().includes('jam') || k.toLowerCase().includes('time') || k.toLowerCase() === 'waktu');

    if (!pinKey || !dateKey || !timeKey) {
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

      if (dateKey === timeKey && dateVal.includes(' ')) {
        const parts = dateVal.split(' ');
        dateVal = parts[0];
        timeVal = parts[1];
      }

      if (!pin || !dateVal || !timeVal) {
        stats.invalid++;
        return;
      }

      dateVal = dateVal.replace(/\//g, '-'); 
      const uniqueKey = `${pin}_${dateVal}_${timeVal}`;
      
      if (existingSet.has(uniqueKey)) {
        stats.duplicates++;
        return;
      }

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
      existingSet.add(uniqueKey);
    });

    return stats;
  }

  /**
   * Simpan hasil impor ke raw database secara aman & immutable
   */
  function commitImport(processedRows) {
    if (!processedRows || processedRows.length === 0) return 0;

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
    RULES,
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
