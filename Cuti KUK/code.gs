// ================================================================
// SISTEM CUTI KARYAWAN — Google Apps Script (v6 - ADMIN DASHBOARD PRO)
// ================================================================

const SPREADSHEET_ID  = "16FYB1fjjT7dQcOYMCw-Wict43FOEhBlIqTqyHRoIeS4";
const SHEET_DATA      = "Data Cuti";
const SHEET_REKAP     = "Rekap Harian";
const SHEET_KARYAWAN  = "Karyawan";
const SHEET_SETUP     = "Setup";
const SHEET_AKUN      = "Akun";

function getColMap(sheet) {
  if (!sheet || sheet.getLastColumn() === 0) return {};
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => { if (h) map[String(h).trim()] = i; });
  return map;
}

// ================================================================
// ROUTER (GET)
// ================================================================
function doGet(e) {
  const ss     = SpreadsheetApp.openById(SPREADSHEET_ID);
  const action = e.parameter.action || 'init';

  if (action === 'init') {
    return jsonResponse(getInitData(ss));
  }
  if (action === 'booked') {
    const idKaryawan = e.parameter.idKaryawan || '';
    const bagian = e.parameter.bagian || '';
    const booked = getBookedDates(ss, bagian, idKaryawan);
    const leavesMap = getLeavesPerDate(ss, idKaryawan);
    return jsonResponse({ booked: booked, leavesMap: leavesMap });
  }
  if (action === 'riwayat') {
    return jsonResponse({ riwayat: getRiwayat(ss, e.parameter.idKaryawan || '') });
  }
  if (action === 'dashboard_data') {
    return jsonResponse(getDashboardData(ss));
  }
  if (action === 'rekapAbsen') {
    return getRekapAbsen(ss);
  }
  if (action === 'getPeminjaman') {
    return getPeminjamanData(ss);
  }

  return jsonResponse({ error: 'Action tidak valid.' });
}

function getInitData(ss) {
  const shKaryawan = ss.getSheetByName(SHEET_KARYAWAN);
  const mapK = getColMap(shKaryawan);
  const dataK = shKaryawan.getDataRange().getValues();
  const karyawan = [];
  
  for (let i = 1; i < dataK.length; i++) {
    const status = (mapK['Status'] !== undefined) ? dataK[i][mapK['Status']] : 'Aktif';
    if (String(status).toLowerCase() === 'nonaktif') continue; // Hide from public UI
    
    const id = dataK[i][mapK['ID Karyawan']] || dataK[i][mapK['Nama Karyawan']] || '';
    const nama = dataK[i][mapK['Nama Karyawan']] || '';
    const bagian = dataK[i][mapK['Bagian']] || '';
    
    if (id || nama) karyawan.push({ id, nama, bagian });
  }

  const shSetup = ss.getSheetByName(SHEET_SETUP);
  let batasWaktu = "";
  if (shSetup) {
    const dataS = shSetup.getDataRange().getValues();
    for (let i = 1; i < dataS.length; i++) {
      if (dataS[i][0] === "Batas Akhir Penginputan") batasWaktu = dataS[i][1];
    }
  }

  return { karyawan, batasWaktu };
}

// ================================================================
// ROUTER (POST)
// ================================================================
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action || 'simpan_cuti';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === 'simpan_cuti') {
      return handleSimpanCuti(ss, payload);
    } else if (action === 'toggle_cuti') {
      return handleToggleCuti(ss, payload);
    } else if (action === 'save_karyawan') {
      return handleSaveKaryawan(ss, payload);
    } else if (action === 'delete_karyawan') {
      return handleDeleteKaryawan(ss, payload);
    } else if (action === 'save_setup') {
      return handleSaveSetup(ss, payload);
    } else if (action === 'absen_bulk') {
      return handleAbsenBulk(ss, payload);
    } else if (action === 'save_pelanggaran') {
      return handleSavePelanggaran(ss, payload);
    } else if (action === 'delete_pelanggaran') {
      return handleDeletePelanggaran(ss, payload);
    } else if (action === 'edit_pelanggaran') {
      return handleEditPelanggaran(ss, payload);
    } else if (action === 'save_tip') {
      return handleSaveTip(ss, payload);
    } else if (action === 'delete_tip') {
      return handleDeleteTip(ss, payload);
    } else if (action === 'login') {
      return handleLogin(ss, payload);
    } else if (action === 'change_password') {
      return handleChangePassword(ss, payload);
    } else if (action === 'save_user') {
      return handleSaveUser(ss, payload);
    } else if (action === 'delete_user') {
      return handleDeleteUser(ss, payload);
    } else if (action === 'save_peminjaman') {
      return handleSavePeminjaman(ss, payload);
    } else if (action === 'update_status_peminjaman') {
      return handleUpdateStatusPeminjaman(ss, payload);
    } else if (action === 'laporkan_kerusakan_peminjaman') {
      return handleLaporkanKerusakanPeminjaman(ss, payload);
    } else if (action === 'upload_file_drive') {
      return handleUploadFileToDrive(payload);
    }

    return jsonResponse({ result: 'error', message: 'Unknown Action' });
  } catch (err) {
    return jsonResponse({ result: 'error', message: 'Error: ' + err.message });
  }
}
function handleSaveSetup(ss, payload) {
  const { batasWaktu } = payload;
  const shSetup = ss.getSheetByName(SHEET_SETUP) || ss.insertSheet(SHEET_SETUP);
  const mapS = getColMap(shSetup);
  const data = shSetup.getDataRange().getValues();
  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][mapS['Pengaturan']] === 'Batas Akhir Penginputan') {
      rowIdx = i + 1;
      break;
    }
  }
  const nilaiCol = (mapS['Nilai'] !== undefined) ? mapS['Nilai'] + 1 : 2;
  if (rowIdx > 0) {
    shSetup.getRange(rowIdx, nilaiCol).setValue(batasWaktu || '');
  } else {
    shSetup.appendRow(['Batas Akhir Penginputan', batasWaktu || '']);
  }
  return jsonResponse({ result: 'success' });
}

function handleSimpanCuti(ss, payload) {
  const { idKaryawan, nama, bagian, tanggal, isAdmin } = payload;

  if (!idKaryawan || !nama || !bagian || !Array.isArray(tanggal)) {
    return jsonResponse({ result: 'error', message: 'Data tidak lengkap.' });
  }

  // Validasi Maks 3 Hari per BULAN
  const datesByMonth = {};
  for (let d of tanggal) {
    const ym = d.substring(0, 7);
    datesByMonth[ym] = (datesByMonth[ym] || 0) + 1;
    if (datesByMonth[ym] > 3) {
      return jsonResponse({ result: 'error', message: `Maksimal 3 hari cuti per bulan! Anda melebihi kuota di bulan ${ym}.` });
    }
  }
  
  // Validasi Batas Waktu (Dilewati jika yang edit adalah Admin via Dashboard)
  if (!isAdmin) {
    const { batasWaktu } = getInitData(ss);
    if (batasWaktu && new Date() > new Date(batasWaktu)) {
      return jsonResponse({ result: 'error', message: 'Batas waktu penginputan telah berakhir. Data dikunci.' });
    }
  }

  const sheet = ss.getSheetByName(SHEET_DATA);
  const map = getColMap(sheet);
  if (map['ID Karyawan'] === undefined) {
    return jsonResponse({ result: 'error', message: 'Struktur sheet Data Cuti salah. Lakukan Setup ulang.' });
  }

  // Validasi Konflik Divisi
  const booked = getBookedDates(ss, bagian, idKaryawan);
  const conflicts = tanggal.filter(d => booked.includes(d));
  if (conflicts.length > 0) {
    return jsonResponse({ result: 'error', message: `Tanggal ${conflicts.join(', ')} sudah diambil rekan di divisi ${bagian}.` });
  }

  // Validasi Batasan Cuti Tambahan (Maks 2 orang per hari, Kepala Toko & Admin, Pengiriman & Kepala Pengiriman)
  const restrictionError = checkLeaveRestrictions(ss, idKaryawan, bagian, tanggal);
  if (restrictionError) {
    return jsonResponse({ result: 'error', message: restrictionError });
  }

  const data = sheet.getDataRange().getValues();
  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][map['ID Karyawan']]) === String(idKaryawan)) {
      rowIdx = i + 1;
      break;
    }
  }

  const rawStr = tanggal.sort().join(',');
  
  if (rowIdx > 0) {
    sheet.getRange(rowIdx, map['Nama Karyawan'] + 1).setValue(nama); 
    sheet.getRange(rowIdx, map['Bagian'] + 1).setValue(bagian);
    sheet.getRange(rowIdx, map['Tanggal (raw)'] + 1).setNumberFormat('@').setValue(rawStr);
    sheet.getRange(rowIdx, map['Total Hari'] + 1).setValue(tanggal.length);
    sheet.getRange(rowIdx, map['Update Terakhir'] + 1).setValue(new Date());
  } else {
    if (tanggal.length > 0) {
      const newRow = new Array(Object.keys(map).length).fill('');
      newRow[map['Timestamp']] = new Date();
      newRow[map['ID Karyawan']] = idKaryawan;
      newRow[map['Nama Karyawan']] = nama;
      newRow[map['Bagian']] = bagian;
      newRow[map['Tanggal (raw)']] = rawStr;
      newRow[map['Total Hari']] = tanggal.length;
      newRow[map['Update Terakhir']] = new Date();
      sheet.appendRow(newRow);
    }
  }

  buildRekap(ss);
  return jsonResponse({ result: 'success', tanggal });
}

function handleToggleCuti(ss, payload) {
  const { idKaryawan, tanggalToggle, isAdmin } = payload;
  if (!isAdmin || !idKaryawan || !tanggalToggle) return jsonResponse({ result: 'error', message: 'Invalid payload' });

  const sheet = ss.getSheetByName(SHEET_DATA);
  const map = getColMap(sheet);
  const data = sheet.getDataRange().getValues();
  let rowIdx = -1;
  let tRaw = '';
  let nama = '';
  let bagian = '';

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][map['ID Karyawan']]) === String(idKaryawan)) {
      rowIdx = i + 1;
      const val = data[i][map['Tanggal (raw)']];
      if (val instanceof Date) {
        tRaw = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } else {
        tRaw = String(val || '');
      }
      nama = data[i][map['Nama Karyawan']];
      bagian = data[i][map['Bagian']];
      break;
    }
  }

  // Jika belum punya baris, kita tidak bisa toggle dari Gantt chart dengan mudah tanpa nama/bagian, tapi dari Gantt pasti sudah ada nama/bagian.
  // Wait, di Dashboard, dbKaryawan punya data lengkap. Mari asumsikan payload juga mengirim nama dan bagian.
  nama = payload.nama || nama;
  bagian = payload.bagian || bagian;

  let arr = tRaw ? tRaw.split(',').map(d => d.trim()).filter(Boolean) : [];
  let added = false;
  
  if (arr.includes(tanggalToggle)) {
    // Remove
    arr = arr.filter(d => d !== tanggalToggle);
  } else {
    // Add (Check kuota bulan itu)
    const ym = tanggalToggle.substring(0, 7);
    const countBulanIni = arr.filter(d => d.startsWith(ym)).length;
    if (countBulanIni >= 3) {
      return jsonResponse({ result: 'error', message: `Kuota bulan ${ym} penuh (Maks 3 hari).` });
    }
    
    // Check conflicts
    const booked = getBookedDates(ss, bagian, idKaryawan);
    if (booked.includes(tanggalToggle)) {
      return jsonResponse({ result: 'error', message: 'Tanggal sudah diambil rekan di divisi yang sama.' });
    }

    // Check new restrictions (Maks 2 orang per hari, Kepala Toko & Admin, Pengiriman & Kepala Pengiriman)
    const restrictionError = checkLeaveRestrictions(ss, idKaryawan, bagian, [tanggalToggle]);
    if (restrictionError) {
      return jsonResponse({ result: 'error', message: restrictionError });
    }

    arr.push(tanggalToggle);
    added = true;
  }

  const rawStr = arr.sort().join(',');

  if (rowIdx > 0) {
    sheet.getRange(rowIdx, map['Tanggal (raw)'] + 1).setNumberFormat('@').setValue(rawStr);
    sheet.getRange(rowIdx, map['Total Hari'] + 1).setValue(arr.length);
    sheet.getRange(rowIdx, map['Update Terakhir'] + 1).setValue(new Date());
  } else {
    const newRow = new Array(Object.keys(map).length).fill('');
    newRow[map['Timestamp']] = new Date();
    newRow[map['ID Karyawan']] = idKaryawan;
    newRow[map['Nama Karyawan']] = nama;
    newRow[map['Bagian']] = bagian;
    newRow[map['Tanggal (raw)']] = rawStr;
    newRow[map['Total Hari']] = arr.length;
    newRow[map['Update Terakhir']] = new Date();
    sheet.appendRow(newRow);
  }

  buildRekap(ss);
  return jsonResponse({ result: 'success', added });
}

function handleSaveKaryawan(ss, payload) {
  const { idKaryawan, nama, bagian, status, isNew } = payload;
  const sheet = ss.getSheetByName(SHEET_KARYAWAN);
  
  // Pastikan kolom Status ada
  let map = getColMap(sheet);
  if (map['Status'] === undefined) {
    sheet.getRange(1, sheet.getLastColumn() + 1).setValue('Status');
    map = getColMap(sheet);
  }

  const data = sheet.getDataRange().getValues();
  let rowIdx = -1;
  
  if (!isNew) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][map['ID Karyawan']]) === String(idKaryawan)) {
        rowIdx = i + 1;
        break;
      }
    }
  }

  if (rowIdx > 0) {
    sheet.getRange(rowIdx, map['ID Karyawan'] + 1).setNumberFormat('@');
    sheet.getRange(rowIdx, map['Nama Karyawan'] + 1).setValue(nama);
    sheet.getRange(rowIdx, map['Bagian'] + 1).setValue(bagian);
    sheet.getRange(rowIdx, map['Status'] + 1).setValue(status);
  } else {
    // Generate ID otomatis: cari nomor tertinggi dan tambah 1 agar unik
    let newId = idKaryawan && idKaryawan.trim();
    if (!newId) {
      let maxNum = 0;
      for (let i = 1; i < data.length; i++) {
        const existId = String(data[i][map['ID Karyawan']] || '');
        const match = existId.match(/K-(\d+)/);
        if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
      }
      newId = 'K-' + String(maxNum + 1).padStart(3, '0');
    }
    const newRow = new Array(Object.keys(map).length).fill('');
    newRow[map['ID Karyawan']] = newId;
    newRow[map['Nama Karyawan']] = nama;
    newRow[map['Bagian']] = bagian;
    newRow[map['Status']] = status || 'Aktif';
    sheet.appendRow(newRow);
    // Ensure ID is text
    sheet.getRange(sheet.getLastRow(), map['ID Karyawan'] + 1).setNumberFormat('@');
  }
  
  // Update juga nama & bagian di sheet Data Cuti agar sinkron
  const shData = ss.getSheetByName(SHEET_DATA);
  const mapD = getColMap(shData);
  if(mapD['ID Karyawan'] !== undefined && !isNew) {
     const dataC = shData.getDataRange().getValues();
     for(let i=1; i<dataC.length; i++) {
       if(String(dataC[i][mapD['ID Karyawan']]) === String(idKaryawan)) {
         shData.getRange(i+1, mapD['Nama Karyawan']+1).setValue(nama);
         shData.getRange(i+1, mapD['Bagian']+1).setValue(bagian);
       }
     }
  }

  return jsonResponse({ result: 'success' });
}

function handleDeleteKaryawan(ss, payload) {
  const { idKaryawan } = payload;
  
  // Hapus dari Karyawan
  const shKaryawan = ss.getSheetByName(SHEET_KARYAWAN);
  let map = getColMap(shKaryawan);
  let data = shKaryawan.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][map['ID Karyawan']]) === String(idKaryawan)) {
      shKaryawan.deleteRow(i + 1);
      break;
    }
  }

  // Hapus dari Data Cuti (Riwayat)
  const shData = ss.getSheetByName(SHEET_DATA);
  map = getColMap(shData);
  if (map['ID Karyawan'] !== undefined) {
    data = shData.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][map['ID Karyawan']]) === String(idKaryawan)) {
        shData.deleteRow(i + 1);
        break; // Setiap ID cuma punya 1 baris di Data Cuti (struktur sekarang)
      }
    }
  }

  // Rekap ulang
  buildRekap(ss);

  return jsonResponse({ result: 'success' });
}

// ================================================================
// HELPERS
// ================================================================
function getBookedDates(ss, bagian, excludeId) {
  const sheet = ss.getSheetByName(SHEET_DATA);
  const map = getColMap(sheet);
  const data = sheet.getDataRange().getValues();
  const booked = [];
  if (map['Bagian'] === undefined) return booked;
  const tz = Session.getScriptTimeZone();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][map['Bagian']]).toLowerCase() === String(bagian).toLowerCase() && String(data[i][map['ID Karyawan']]) !== String(excludeId)) {
      const val = data[i][map['Tanggal (raw)']];
      let tRaw = '';
      if (val instanceof Date) {
        tRaw = Utilities.formatDate(val, tz, 'yyyy-MM-dd');
      } else {
        tRaw = String(val || '');
      }
      const dates = tRaw.split(',').map(d => d.trim()).filter(Boolean);
      dates.forEach(d => { if (!booked.includes(d)) booked.push(d); });
    }
  }
  return booked;
}

function getRiwayat(ss, idKaryawan) {
  const sheet = ss.getSheetByName(SHEET_DATA);
  const map = getColMap(sheet);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][map['ID Karyawan']]) === String(idKaryawan)) {
      const val = data[i][map['Tanggal (raw)']];
      let tRaw = '';
      if (val instanceof Date) {
        tRaw = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } else {
        tRaw = String(val || '');
      }
      const tanggal = tRaw.split(',').map(d => d.trim()).filter(Boolean);
      return { ada: true, tanggal };
    }
  }
  return { ada: false, tanggal: [] };
}

function getDashboardData(ss) {
  const shRekap = ss.getSheetByName(SHEET_REKAP);
  const mapR = getColMap(shRekap);
  const data = shRekap.getDataRange().getValues();
  
  const tz = Session.getScriptTimeZone();
  const result = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][mapR['ID Karyawan']]) {
      // Google Sheets bisa mengkonversi string tanggal ke Date object secara otomatis
      // Kita harus format ulang agar selalu jadi string YYYY-MM-DD
      const rawTgl = data[i][mapR['Tanggal Cuti']];
      let tanggalStr = '';
      if (rawTgl instanceof Date) {
        tanggalStr = Utilities.formatDate(rawTgl, tz, 'yyyy-MM-dd');
      } else {
        tanggalStr = String(rawTgl || '').trim();
      }

      const rawBulan = data[i][mapR['Bulan']];
      let bulanStr = '';
      if (rawBulan instanceof Date) {
        bulanStr = Utilities.formatDate(rawBulan, tz, 'MM');
      } else {
        bulanStr = String(rawBulan || '').padStart(2, '0');
      }

      const rawTahun = data[i][mapR['Tahun']];
      let tahunStr = '';
      if (rawTahun instanceof Date) {
        tahunStr = Utilities.formatDate(rawTahun, tz, 'yyyy');
      } else {
        tahunStr = String(rawTahun || '');
      }

      result.push({
        idKaryawan: String(data[i][mapR['ID Karyawan']]),
        nama: data[i][mapR['Nama Karyawan']],
        bagian: data[i][mapR['Bagian']],
        tanggal: tanggalStr,
        bulan: bulanStr,
        tahun: tahunStr
      });
    }
  }

  // Kirim daftar SEMUA karyawan (termasuk Nonaktif) untuk Dashboard
  const shKaryawan = ss.getSheetByName(SHEET_KARYAWAN);
  const mapK = getColMap(shKaryawan);
  const dataK = shKaryawan.getDataRange().getValues();
  const allKaryawan = [];
  for (let i = 1; i < dataK.length; i++) {
    const id = dataK[i][mapK['ID Karyawan']] || dataK[i][mapK['Nama Karyawan']] || '';
    if (!id) continue;
    allKaryawan.push({
      id: id,
      nama: dataK[i][mapK['Nama Karyawan']] || '',
      bagian: dataK[i][mapK['Bagian']] || '',
      status: (mapK['Status'] !== undefined) ? dataK[i][mapK['Status']] : 'Aktif'
    });
  }
  
  // Ambil data pelanggaran
  const violations = getViolationsData(ss);
  
  // Ambil data tip kaca
  const tips = getTipKacaData(ss);
  
  // Ambil data peminjaman
  const peminjaman = getPeminjamanRaw(ss);
  
  // Ambil data users
  const users = getUsersData(ss);
  
  return { result: 'success', data: result, karyawan: allKaryawan, violations: violations, tips: tips, users: users, peminjaman: peminjaman };
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function formatDateSafe(val, tz) {
  if (val instanceof Date) {
    return Utilities.formatDate(val, tz || Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(val || '').trim();
}

// ================================================================
// REKAP HARIAN
// ================================================================
function buildRekap(ss) {
  const datSheet = ss.getSheetByName(SHEET_DATA);
  const mapDat = getColMap(datSheet);
  let rekSheet = ss.getSheetByName(SHEET_REKAP);
  if (!rekSheet) rekSheet = ss.insertSheet(SHEET_REKAP);

  rekSheet.clearContents();
  const headers = ['ID Karyawan', 'Nama Karyawan', 'Bagian', 'Tanggal Cuti', 'Bulan', 'Tahun'];
  rekSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  rekSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  rekSheet.setFrozenRows(1);

  const data = datSheet.getDataRange().getValues();
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const id = data[i][mapDat['ID Karyawan']];
    const nama = data[i][mapDat['Nama Karyawan']];
    const bagian = data[i][mapDat['Bagian']];
    const tRaw = String(data[i][mapDat['Tanggal (raw)']] || '');
    
    if (id && tRaw) {
      tRaw.split(',').forEach(d => {
        const t = d.trim();
        if (t) {
          const parts = t.split('-');
          rows.push([String(id), nama, bagian, t, parts[1], parts[0]]);
        }
      });
    }
  }

  if (rows.length > 0) {
    const range = rekSheet.getRange(2, 1, rows.length, headers.length);
    range.setValues(rows);
    // Paksa kolom Tanggal Cuti (kolom 4) sebagai teks agar Google Sheets tidak auto-convert ke Date
    rekSheet.getRange(2, 4, rows.length, 1).setNumberFormat('@');
    // Paksa kolom Bulan dan Tahun (kolom 5 & 6) tetap angka/teks
    rekSheet.getRange(2, 5, rows.length, 2).setNumberFormat('@');
  }
}

// ================================================================
// SETUP AWAL
// ================================================================
function setupSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  function makeSheet(name, headers, sampleData) {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sh.setFrozenRows(1);
    if (sampleData && sh.getLastRow() === 1) {
      sh.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);
    }
    return sh;
  }

  makeSheet(SHEET_DATA, ['Timestamp', 'ID Karyawan', 'Nama Karyawan', 'Bagian', 'Tanggal (raw)', 'Total Hari', 'Update Terakhir']);
  makeSheet(SHEET_KARYAWAN, ['ID Karyawan', 'Nama Karyawan', 'Bagian', 'Status'], [
    ['K-001', 'Fulan', 'Kasir', 'Aktif'], 
    ['K-002', 'Dwi', 'Gudang', 'Aktif']
  ]);
  
  const d = new Date(); d.setDate(d.getDate() + 7);
  makeSheet(SHEET_SETUP, ['Pengaturan', 'Nilai'], [
    ['Batas Akhir Penginputan', Utilities.formatDate(d, Session.getScriptTimeZone(), "MM/dd/yyyy HH:mm:ss")]
  ]);
  
  buildRekap(ss);
  Logger.log('Setup v6 PRO berhasil! Dashboard dilengkapi CRUD.');
}

// ================================================================
// ABSENSI BRIEFING PAGI
// ================================================================
function getOrCreateAbsenSheet(ss) {
  let sheet = ss.getSheetByName("Absen Briefing");
  
  // Jika sheet belum ada, buat baru dan setel header
  if (!sheet) {
    sheet = ss.insertSheet("Absen Briefing");
    sheet.appendRow(["Waktu (Timestamp)", "ID Karyawan", "Nama Karyawan", "Bagian/Divisi", "Status"]);
    // Mempercantik header
    const headerRange = sheet.getRange("A1:E1");
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#f3f4f6");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 5);
  }
  
  return sheet;
}

function handleAbsenBulk(ss, payload) {
  try {
    const sheet = getOrCreateAbsenSheet(ss);
    const records = payload.records; // Array dari data absensi massal
    
    if (!records || !Array.isArray(records)) {
      throw new Error("Data records tidak valid");
    }

    // Persiapkan data array 2D untuk insert sekaligus agar lebih efisien
    const rows = [];
    records.forEach(function(rec) {
      rows.push([
        rec.waktu,
        rec.idKaryawan,
        rec.nama,
        rec.bagian,
        rec.status
      ]);
    });

    if (rows.length > 0) {
      // Dapatkan range baris baru yang akan ditambahkan
      const startRow = sheet.getLastRow() + 1;
      const targetRange = sheet.getRange(startRow, 1, rows.length, rows[0].length);
      // Set values sekaligus
      targetRange.setValues(rows);
    }
    
    return jsonResponse({
      result: 'success', 
      message: 'Berhasil merekam rekap absen massal'
    });
    
  } catch (error) {
    return jsonResponse({
      result: 'error', 
      message: error.toString()
    });
  }
}

function getRekapAbsen(ss) {
  try {
    const sheet = getOrCreateAbsenSheet(ss);
    const lastRow = sheet.getLastRow();
    
    // Jika belum ada data absensi
    if (lastRow <= 1) {
      return jsonResponse({
        result: 'success',
        data: []
      });
    }
    
    // Ambil semua data (kecuali header)
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 5);
    const values = dataRange.getValues();
    
    const rekapData = [];
    
    // Urutkan dari yang terbaru (reverse loop)
    for (let i = values.length - 1; i >= 0; i--) {
      rekapData.push({
        waktu: values[i][0],
        idKaryawan: values[i][1],
        nama: values[i][2],
        bagian: values[i][3],
        status: values[i][4]
      });
    }
    
    return jsonResponse({
      result: 'success',
      data: rekapData
    });
    
  } catch (error) {
    return jsonResponse({
      result: 'error', 
      message: error.toString()
    });
  }
}

// ================================================================
// SISTEM PELANGGARAN KARYAWAN
// ================================================================
function getOrCreatePelanggaranSheet(ss) {
  let sheet = ss.getSheetByName("Pelanggaran");
  if (!sheet) {
    sheet = ss.insertSheet("Pelanggaran");
    sheet.appendRow(["Waktu (Timestamp)", "ID Karyawan", "Nama Karyawan", "Jenis Pelanggaran", "Poin", "Tempat", "Nama Staf Penginput"]);
    // Beautify header
    const headerRange = sheet.getRange("A1:G1");
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#f3f4f6");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 7);
  }
  return sheet;
}

function getViolationsData(ss) {
  try {
    const sheet = getOrCreatePelanggaranSheet(ss);
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];
    
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 7);
    const values = dataRange.getValues();
    const violations = [];
    const tz = Session.getScriptTimeZone();
    
    // Reverse loop to get newest first
    for (let i = values.length - 1; i >= 0; i--) {
      let waktuStr = '';
      const rawWaktu = values[i][0];
      if (rawWaktu instanceof Date) {
        waktuStr = Utilities.formatDate(rawWaktu, tz, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
      } else {
        waktuStr = String(rawWaktu || '').trim();
      }
      
      violations.push({
        waktu: waktuStr,
        idKaryawan: String(values[i][1]),
        nama: String(values[i][2]),
        jenis: String(values[i][3]),
        poin: Number(values[i][4]) || 0,
        tempat: String(values[i][5]),
        staf: String(values[i][6])
      });
    }
    return violations;
  } catch (e) {
    Logger.log("Error getViolationsData: " + e.toString());
    return [];
  }
}

function handleSavePelanggaran(ss, payload) {
  try {
    const { idKaryawan, nama, jenis, poin, tempat, staf, waktu } = payload;
    
    if (!idKaryawan || !nama || !jenis || poin === undefined || !tempat || !staf) {
      return jsonResponse({ result: 'error', message: 'Data pelanggaran tidak lengkap.' });
    }
    
    const sheet = getOrCreatePelanggaranSheet(ss);
    
    // Waktu can be provided by client, else use current server time
    let timestamp = waktu ? new Date(waktu) : new Date();
    
    sheet.appendRow([
      timestamp,
      idKaryawan,
      nama,
      jenis,
      poin,
      tempat,
      staf
    ]);
    
    // Force ID Karyawan to be text format
    sheet.getRange(sheet.getLastRow(), 2).setNumberFormat('@');
    
    return jsonResponse({ result: 'success', message: 'Pelanggaran berhasil dicatat.' });
  } catch (error) {
    return jsonResponse({ result: 'error', message: 'Error: ' + error.toString() });
  }
}

function handleDeletePelanggaran(ss, payload) {
  try {
    const { idKaryawan, waktu } = payload;
    if (!idKaryawan || !waktu) {
      return jsonResponse({ result: 'error', message: 'Parameter tidak lengkap: idKaryawan dan waktu diperlukan.' });
    }
    
    const sheet = getOrCreatePelanggaranSheet(ss);
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return jsonResponse({ result: 'error', message: 'Tidak ada data untuk dihapus.' });
    }
    
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 7);
    const values = dataRange.getValues();
    const tz = Session.getScriptTimeZone();
    
    let found = false;
    for (let i = values.length - 1; i >= 0; i--) {
      const rowId = String(values[i][1]);
      
      let rowWaktu = '';
      const rawWaktu = values[i][0];
      if (rawWaktu instanceof Date) {
        rowWaktu = Utilities.formatDate(rawWaktu, tz, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
      } else {
        rowWaktu = String(rawWaktu || '').trim();
      }
      
      if (rowId === String(idKaryawan) && (rowWaktu === String(waktu) || rowWaktu.substring(0, 19) === String(waktu).substring(0, 19))) {
        sheet.deleteRow(i + 2);
        found = true;
        break;
      }
    }
    
    if (found) {
      return jsonResponse({ result: 'success', message: 'Pelanggaran berhasil dihapus.' });
    } else {
      return jsonResponse({ result: 'error', message: 'Data pelanggaran tidak ditemukan.' });
    }
  } catch (error) {
    return jsonResponse({ result: 'error', message: 'Error: ' + error.toString() });
  }
}

function handleEditPelanggaran(ss, payload) {
  try {
    const { idKaryawan, oldWaktu, waktu, nama, jenis, poin, tempat, staf } = payload;
    if (!idKaryawan || !oldWaktu) {
      return jsonResponse({ result: 'error', message: 'Parameter tidak lengkap: idKaryawan dan oldWaktu diperlukan.' });
    }
    
    const sheet = getOrCreatePelanggaranSheet(ss);
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return jsonResponse({ result: 'error', message: 'Tidak ada data untuk diedit.' });
    }
    
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 7);
    const values = dataRange.getValues();
    const tz = Session.getScriptTimeZone();
    
    let found = false;
    for (let i = values.length - 1; i >= 0; i--) {
      const rowId = String(values[i][1]);
      
      let rowWaktu = '';
      const rawWaktu = values[i][0];
      if (rawWaktu instanceof Date) {
        rowWaktu = Utilities.formatDate(rawWaktu, tz, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
      } else {
        rowWaktu = String(rawWaktu || '').trim();
      }
      
      if (rowId === String(idKaryawan) && (rowWaktu === String(oldWaktu) || rowWaktu.substring(0, 19) === String(oldWaktu).substring(0, 19))) {
        // Update values in this row
        const rowToUpdate = i + 2;
        sheet.getRange(rowToUpdate, 1, 1, 7).setValues([[waktu, idKaryawan, nama, jenis, poin, tempat, staf]]);
        found = true;
        break;
      }
    }
    
    if (found) {
      return jsonResponse({ result: 'success', message: 'Pelanggaran berhasil diubah.' });
    } else {
      return jsonResponse({ result: 'error', message: 'Data pelanggaran tidak ditemukan.' });
    }
  } catch (error) {
    return jsonResponse({ result: 'error', message: 'Error: ' + error.toString() });
  }
}

// ================================================================
// ASYNC LEAVE RESTRICTION HELPER FUNCTIONS
// ================================================================
function getLeavesPerDate(ss, excludeId) {
  const sheet = ss.getSheetByName(SHEET_DATA);
  const map = getColMap(sheet);
  const data = sheet.getDataRange().getValues();
  const leavesMap = {};
  if (map['ID Karyawan'] === undefined) return leavesMap;
  
  const tz = Session.getScriptTimeZone();
  for (let i = 1; i < data.length; i++) {
    const id = String(data[i][map['ID Karyawan']]);
    if (excludeId && id === String(excludeId)) continue;
    
    const nama = data[i][map['Nama Karyawan']];
    const bagian = String(data[i][map['Bagian']] || '').trim();
    
    const val = data[i][map['Tanggal (raw)']];
    let tRaw = '';
    if (val instanceof Date) {
      tRaw = Utilities.formatDate(val, tz, 'yyyy-MM-dd');
    } else {
      tRaw = String(val || '');
    }
    
    const dates = tRaw.split(',').map(d => d.trim()).filter(Boolean);
    dates.forEach(d => {
      if (!leavesMap[d]) leavesMap[d] = [];
      leavesMap[d].push({ id: id, nama: nama, bagian: bagian });
    });
  }
  return leavesMap;
}

function checkLeaveRestrictions(ss, idKaryawan, bagian, datesToCheck) {
  const leavesMap = getLeavesPerDate(ss, idKaryawan);
  const bgLower = String(bagian || '').trim().toLowerCase();
  
  for (let i = 0; i < datesToCheck.length; i++) {
    const d = datesToCheck[i];
    const others = leavesMap[d] || [];
    
    // 1. Kepala Toko & Admin tidak boleh bareng
    const isMgrRole = (bgLower === 'kepala toko' || bgLower === 'admin');
    if (isMgrRole) {
      const conflictMgr = others.find(o => {
        const oBg = String(o.bagian || '').trim().toLowerCase();
        return (oBg === 'kepala toko' || oBg === 'admin');
      });
      if (conflictMgr) {
        return `Kepala Toko dan Admin tidak boleh cuti bersamaan. Tanggal ${d} sudah diambil oleh ${conflictMgr.nama} (${conflictMgr.bagian}).`;
      }
    }
    
    // 2. Pengiriman & Kepala Pengiriman tidak boleh bareng
    const isDeliveryRole = (bgLower === 'pengiriman' || bgLower === 'kepala pengiriman');
    if (isDeliveryRole) {
      const conflictDel = others.find(o => {
        const oBg = String(o.bagian || '').trim().toLowerCase();
        return (oBg === 'pengiriman' || oBg === 'kepala pengiriman');
      });
      if (conflictDel) {
        return `Bagian Pengiriman dan Kepala Pengiriman tidak boleh cuti bersamaan. Tanggal ${d} sudah diambil oleh ${conflictDel.nama} (${conflictDel.bagian}).`;
      }
    }
  }
  return null;
}

// ================================================================
// AUTHENTICATION & ACCOUNT FUNCTIONS
// ================================================================
function checkAndInitAkun(ss) {
  let sheet = ss.getSheetByName(SHEET_AKUN);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_AKUN);
    sheet.getRange(1, 1, 1, 6).setValues([['Username', 'Password', 'Permissions', 'Jabatan', 'Toko', 'Nama Lengkap']]).setFontWeight('bold');
    
    // Default users
    const defaultRows = [
      ['fariz', '12345', 'absen, cuti, pelanggaran, dashboard, tip, gaji, users', 'Koordinator', 'bangunan', 'Fariz Ridwani,S.Kom.'],
      ['andika', '12345', 'absen, cuti, pelanggaran, dashboard, tip, gaji', 'HRD', 'bangunan', 'Andika'],
      ['irsyadil', '12345', 'absen, cuti, pelanggaran, dashboard, tip, gaji, users', 'Koordinator', 'semua', 'Irsyadil'],
      ['ari', '12345', 'absen, cuti, pelanggaran, dashboard, tip, gaji', 'Bendahara 1', 'bangunan', 'Ari'],
      ['shuva', '12345', 'absen, cuti, pelanggaran, dashboard, tip', '', 'bangunan', 'Shuva'],
      ['aria', '12345', 'absen, cuti, pelanggaran, dashboard, tip', '', 'bangunan', 'Aria'],
      ['zain', '12345', 'absen, cuti, pelanggaran, dashboard, tip, gaji', 'Kepala Toko KUK Palen', 'palen', 'Ahmad Syirajuddin Rabbani']
    ];
    sheet.getRange(2, 1, defaultRows.length, 6).setValues(defaultRows);
  } else {
    // Ensure all 6 columns exist
    let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
    const required = ['Permissions', 'Jabatan', 'Toko', 'Nama Lengkap'];
    required.forEach(colName => {
      if (headers.indexOf(colName) === -1) {
        const lastCol = sheet.getLastColumn() + 1;
        sheet.getRange(1, lastCol).setValue(colName).setFontWeight('bold');
        headers.push(colName);
      }
    });
  }
  return sheet;
}

function handleLogin(ss, payload) {
  const username = String(payload.username || '').trim().toLowerCase();
  const password = String(payload.password || '').trim();
  
  const sheet = checkAndInitAkun(ss);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const dbUser = String(data[i][0] || '').trim().toLowerCase();
    const dbPass = String(data[i][1] || '').trim();
    if (dbUser === username && dbPass === password) {
      return jsonResponse({ result: 'success', username: data[i][0] });
    }
  }
  return jsonResponse({ result: 'error', message: 'Username atau Password salah.' });
}

function handleChangePassword(ss, payload) {
  const username = String(payload.username || '').trim().toLowerCase();
  const oldPassword = String(payload.oldPassword || '').trim();
  const newPassword = String(payload.newPassword || '').trim();
  
  const sheet = checkAndInitAkun(ss);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const dbUser = String(data[i][0] || '').trim().toLowerCase();
    const dbPass = String(data[i][1] || '').trim();
    if (dbUser === username) {
      if (dbPass !== oldPassword) {
        return jsonResponse({ result: 'error', message: 'Password lama salah.' });
      }
      sheet.getRange(i + 1, 2).setValue(newPassword);
      return jsonResponse({ result: 'success', message: 'Password berhasil diubah.' });
    }
  }
  return jsonResponse({ result: 'error', message: 'Username tidak ditemukan.' });
}

function getUsersData(ss) {
  const sheet = checkAndInitAkun(ss);
  const map = getColMap(sheet);
  const data = sheet.getDataRange().getValues();
  const users = [];
  
  // Headers in row 1, data starts from row 2
  for (let i = 1; i < data.length; i++) {
    if (data[i][map['Username']]) {
      const permsStr = String(data[i][map['Permissions']] || '').trim();
      const perms = permsStr ? permsStr.split(',').map(p => p.trim()).filter(Boolean) : [];
      users.push({
        username: String(data[i][map['Username']]),
        password: String(data[i][map['Password']]),
        permissions: perms,
        jabatan: map['Jabatan'] !== undefined ? String(data[i][map['Jabatan']]) : '',
        toko: map['Toko'] !== undefined ? String(data[i][map['Toko']]) : 'bangunan',
        namaLengkap: map['Nama Lengkap'] !== undefined ? String(data[i][map['Nama Lengkap']]) : String(data[i][map['Username']])
      });
    }
  }
  return users;
}

function handleSaveUser(ss, payload) {
  const { username, password, permissions, jabatan, toko, namaLengkap } = payload;
  if (!username || !password) {
    return jsonResponse({ result: 'error', message: 'Username dan Password wajib diisi.' });
  }
  
  const sheet = checkAndInitAkun(ss);
  const map = getColMap(sheet);
  const data = sheet.getDataRange().getValues();
  const permsStr = Array.isArray(permissions) ? permissions.join(', ') : '';
  
  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][map['Username']]).trim().toLowerCase() === String(username).trim().toLowerCase()) {
      rowIdx = i + 1;
      break;
    }
  }
  
  if (rowIdx > 0) {
    sheet.getRange(rowIdx, map['Password'] + 1).setValue(password);
    sheet.getRange(rowIdx, map['Permissions'] + 1).setValue(permsStr);
    if (map['Jabatan'] !== undefined) sheet.getRange(rowIdx, map['Jabatan'] + 1).setValue(jabatan || '');
    if (map['Toko'] !== undefined) sheet.getRange(rowIdx, map['Toko'] + 1).setValue(toko || 'bangunan');
    if (map['Nama Lengkap'] !== undefined) sheet.getRange(rowIdx, map['Nama Lengkap'] + 1).setValue(namaLengkap || username);
    return jsonResponse({ result: 'success', message: 'User berhasil diupdate.' });
  } else {
    const newRow = new Array(sheet.getLastColumn()).fill('');
    newRow[map['Username']] = username;
    newRow[map['Password']] = password;
    newRow[map['Permissions']] = permsStr;
    if (map['Jabatan'] !== undefined) newRow[map['Jabatan']] = jabatan || '';
    if (map['Toko'] !== undefined) newRow[map['Toko']] = toko || 'bangunan';
    if (map['Nama Lengkap'] !== undefined) newRow[map['Nama Lengkap']] = namaLengkap || username;
    sheet.appendRow(newRow);
    return jsonResponse({ result: 'success', message: 'User berhasil ditambahkan.' });
  }
}

function handleDeleteUser(ss, payload) {
  const { username } = payload;
  if (!username) return jsonResponse({ result: 'error', message: 'Username diperlukan.' });
  
  const sheet = checkAndInitAkun(ss);
  const data = sheet.getDataRange().getValues();
  
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]).trim().toLowerCase() === String(username).trim().toLowerCase()) {
      sheet.deleteRow(i + 1);
      return jsonResponse({ result: 'success', message: 'User berhasil dihapus.' });
    }
  }
  return jsonResponse({ result: 'error', message: 'User tidak ditemukan.' });
}

// ================================================================
// SISTEM TIP KACA
// ================================================================
function getOrCreateTipKacaSheet(ss) {
  let sheet = ss.getSheetByName("Tip Kaca");
  if (!sheet) {
    sheet = ss.insertSheet("Tip Kaca");
    sheet.appendRow(["ID", "Waktu (Timestamp)", "ID Karyawan", "Nama Karyawan", "Jenis Kaca", "Luas (m2)", "Total Harga", "Tip"]);
    const headerRange = sheet.getRange("A1:H1");
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#f3f4f6");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 8);
  }
  return sheet;
}

function getTipKacaData(ss) {
  try {
    const sheet = getOrCreateTipKacaSheet(ss);
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];
    
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 8);
    const values = dataRange.getValues();
    const tips = [];
    const tz = Session.getScriptTimeZone();
    
    for (let i = values.length - 1; i >= 0; i--) {
      let waktuStr = '';
      const rawWaktu = values[i][1];
      if (rawWaktu instanceof Date) {
        waktuStr = Utilities.formatDate(rawWaktu, tz, "yyyy-MM-dd");
      } else {
        waktuStr = String(rawWaktu || '').trim();
      }
      
      tips.push({
        id: String(values[i][0]),
        tanggal: waktuStr,
        idKaryawan: String(values[i][2]),
        nama: String(values[i][3]),
        jenisKaca: String(values[i][4]),
        luas: Number(values[i][5]) || 0,
        totalHarga: Number(values[i][6]) || 0,
        tip: Number(values[i][7]) || 0
      });
    }
    return tips;
  } catch (e) {
    Logger.log("Error getTipKacaData: " + e.toString());
    return [];
  }
}

function handleSaveTip(ss, payload) {
  try {
    const { id, idKaryawan, nama, jenisKaca, luas, totalHarga, tip, tanggal } = payload;
    
    if (!idKaryawan || !nama || !jenisKaca || !luas || !tanggal) {
      return jsonResponse({ result: 'error', message: 'Data tip tidak lengkap.' });
    }
    
    const sheet = getOrCreateTipKacaSheet(ss);
    
    sheet.appendRow([
      id,
      tanggal,
      idKaryawan,
      nama,
      jenisKaca,
      luas,
      totalHarga,
      tip
    ]);
    
    sheet.getRange(sheet.getLastRow(), 1).setNumberFormat('@'); // ID
    sheet.getRange(sheet.getLastRow(), 3).setNumberFormat('@'); // ID Karyawan
    
    return jsonResponse({ result: 'success', message: 'Tip berhasil dicatat.' });
  } catch (error) {
    return jsonResponse({ result: 'error', message: 'Error: ' + error.toString() });
  }
}

function handleDeleteTip(ss, payload) {
  try {
    const { id } = payload;
    if (!id) {
      return jsonResponse({ result: 'error', message: 'Parameter tidak lengkap: id diperlukan.' });
    }
    
    const sheet = getOrCreateTipKacaSheet(ss);
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return jsonResponse({ result: 'error', message: 'Data tip kosong.' });
    }
    
    const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    let deleted = false;
    
    for (let i = values.length - 1; i >= 0; i--) {
      if (String(values[i][0]) === String(id)) {
        sheet.deleteRow(i + 2);
        deleted = true;
        break;
      }
    }
    
    if (deleted) {
      return jsonResponse({ result: 'success', message: 'Data tip berhasil dihapus.' });
    } else {
      return jsonResponse({ result: 'error', message: 'Data tip tidak ditemukan.' });
    }
  } catch (error) {
    return jsonResponse({ result: 'error', message: 'Error: ' + error.toString() });
  }
}

// ================================================================
// SISTEM PEMINJAMAN KENDARAAN (BACKEND SHEET)
// ================================================================
function getOrCreatePeminjamanSheet(ss) {
  let sheet = ss.getSheetByName("Peminjaman Kendaraan");
  if (!sheet) {
    sheet = ss.insertSheet("Peminjaman Kendaraan");
    sheet.appendRow([
      "ID Peminjaman",
      "Nama Peminjam",
      "Kamar / Divisi",
      "Kontak",
      "ID Kendaraan",
      "Nama Kendaraan",
      "Plat Nomor",
      "Waktu Mulai",
      "Waktu Rencana Kembali",
      "Waktu Aktual Kembali",
      "Keperluan",
      "Status",
      "Kerusakan Detail",
      "Biaya Perbaikan",
      "Created At"
    ]);
    const headerRange = sheet.getRange("A1:O1");
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#e0f2fe");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 15);
  }
  return sheet;
}

function getPeminjamanRaw(ss) {
  try {
    const sheet = getOrCreatePeminjamanSheet(ss);
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];
    
    const values = sheet.getRange(2, 1, lastRow - 1, 15).getValues();
    const result = [];
    const tz = Session.getScriptTimeZone();
    
    for (let i = values.length - 1; i >= 0; i--) {
      const row = values[i];
      if (!row[0]) continue;
      
      result.push({
        id: String(row[0]),
        namaPeminjam: String(row[1] || ''),
        kamar: String(row[2] || ''),
        divisi: String(row[2] || ''),
        kontak: String(row[3] || ''),
        kendaraanId: String(row[4] || ''),
        namaKendaraan: String(row[5] || ''),
        kendaraanNama: String(row[5] || ''),
        platKendaraan: String(row[6] || ''),
        platNomor: String(row[6] || ''),
        waktuMulai: String(row[7] || ''),
        waktuRencanaKembali: String(row[8] || ''),
        waktuKembali: String(row[8] || ''),
        waktuAktualKembali: row[9] ? String(row[9]) : null,
        keperluan: String(row[10] || ''),
        status: String(row[11] || 'Aktif/Dipinjam'),
        kerusakanDetail: row[12] ? String(row[12]) : null,
        kerusakan: row[12] ? String(row[12]) : null,
        biayaPerbaikan: Number(row[13]) || 0,
        createdAt: row[14] ? String(row[14]) : ''
      });
    }
    return result;
  } catch (e) {
    Logger.log("Error getPeminjamanRaw: " + e.toString());
    return [];
  }
}

function getPeminjamanData(ss) {
  return jsonResponse({
    result: 'success',
    data: getPeminjamanRaw(ss)
  });
}

function handleSavePeminjaman(ss, payload) {
  try {
    const rec = payload.record || payload;
    if (!rec || !rec.namaPeminjam) {
      return jsonResponse({ result: 'error', message: 'Data peminjaman tidak valid.' });
    }
    const sheet = getOrCreatePeminjamanSheet(ss);
    sheet.appendRow([
      rec.id || ('PINJAM-' + Date.now()),
      rec.namaPeminjam || '',
      rec.kamar || rec.divisi || '',
      rec.kontak || '',
      rec.kendaraanId || '',
      rec.namaKendaraan || rec.kendaraanNama || '',
      rec.platKendaraan || rec.platNomor || '',
      rec.waktuMulai || '',
      rec.waktuRencanaKembali || rec.waktuKembali || '',
      rec.waktuAktualKembali || '',
      rec.keperluan || '',
      rec.status || 'Aktif/Dipinjam',
      rec.kerusakanDetail || rec.kerusakan || '',
      rec.biayaPerbaikan || 0,
      rec.createdAt || new Date().toISOString()
    ]);
    return jsonResponse({ result: 'success', message: 'Peminjaman berhasil dicatat di cloud.' });
  } catch (error) {
    return jsonResponse({ result: 'error', message: error.toString() });
  }
}

function handleUpdateStatusPeminjaman(ss, payload) {
  try {
    const { id, status, waktuAktualKembali } = payload;
    const sheet = getOrCreatePeminjamanSheet(ss);
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return jsonResponse({ result: 'error', message: 'Data kosong.' });
    
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        sheet.getRange(i + 2, 12).setValue(status || 'Selesai');
        if (waktuAktualKembali) {
          sheet.getRange(i + 2, 10).setValue(waktuAktualKembali);
        }
        return jsonResponse({ result: 'success' });
      }
    }
    return jsonResponse({ result: 'error', message: 'ID tidak ditemukan.' });
  } catch (error) {
    return jsonResponse({ result: 'error', message: error.toString() });
  }
}

function handleLaporkanKerusakanPeminjaman(ss, payload) {
  try {
    const { id, kerusakanDetail, biayaPerbaikan } = payload;
    const sheet = getOrCreatePeminjamanSheet(ss);
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return jsonResponse({ result: 'error', message: 'Data kosong.' });
    
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        sheet.getRange(i + 2, 13).setValue(kerusakanDetail || '');
        sheet.getRange(i + 2, 14).setValue(Number(biayaPerbaikan) || 0);
        return jsonResponse({ result: 'success' });
      }
    }
    return jsonResponse({ result: 'error', message: 'ID tidak ditemukan.' });
  } catch (error) {
    return jsonResponse({ result: 'error', message: error.toString() });
  }
}

// ================================================================
// GOOGLE DRIVE FILE UPLOAD HANDLER
// Menyimpan file base64 (foto SIM, Barcode, TTD) ke Google Drive
// Folder KUK: https://drive.google.com/drive/folders/1gmv0TIJvTJcCyKD8rs7ichW4LANGFtyZ
// ================================================================
function handleUploadFileToDrive(payload) {
  try {
    const FOLDER_ID_KUK = "1gmv0TIJvTJcCyKD8rs7ichW4LANGFtyZ";

    const base64Data = payload.base64Data;
    const fileName   = payload.fileName || ('File_KUK_' + new Date().getTime() + '.png');
    const folderId   = payload.folderId || FOLDER_ID_KUK;

    if (!base64Data) {
      return jsonResponse({ result: 'error', message: 'Data base64 tidak ditemukan di payload.' });
    }

    let folder;
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (fErr) {
      // Fallback ke folder utama KUK jika folderId tidak valid
      folder = DriveApp.getFolderById(FOLDER_ID_KUK);
    }

    // Ekstrak mime-type dan data bytes dari string base64
    let mimeType = 'image/png';
    let rawBase64 = base64Data;

    if (base64Data.indexOf(';base64,') !== -1) {
      const parts = base64Data.split(';base64,');
      mimeType = parts[0].replace('data:', '').trim();
      rawBase64 = parts[1];
    }

    const decodedBytes = Utilities.base64Decode(rawBase64);
    const blob = Utilities.newBlob(decodedBytes, mimeType, fileName);
    const file = folder.createFile(blob);

    // Set akses: siapapun dengan tautan bisa melihat
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId  = file.getId();
    const fileUrl = file.getUrl();
    const downloadUrl = 'https://lh3.googleusercontent.com/d/' + fileId;

    return jsonResponse({
      result: 'success',
      message: 'File berhasil diunggah ke Google Drive',
      fileId: fileId,
      fileUrl: fileUrl,
      downloadUrl: downloadUrl,
      folderUrl: 'https://drive.google.com/drive/folders/' + folderId
    });

  } catch (err) {
    return jsonResponse({ result: 'error', message: 'Upload gagal: ' + err.toString() });
  }
}