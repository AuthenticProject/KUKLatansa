/**
 * =========================================================================
 *  PANDUAN UPDATE GOOGLE APPS SCRIPT (PEMINJAMAN KENDARAAN)
 * =========================================================================
 * 
 * Silakan copy dan paste baris-baris kode di bawah ini ke dalam project
 * Google Apps Script (Code.gs) Anda, lalu lakukan DEPLOY ulang sebagai Web App
 * (pilih "New version" saat Deploy agar URL tidak berubah).
 */

// -------------------------------------------------------------------------
// 1. TAMBAHKAN DI DALAM FUNGSI doPost(e)
// -------------------------------------------------------------------------
/*
  if (action === 'save_peminjaman') {
    return savePeminjamanCloud(data.record);
  }
  if (action === 'update_status_peminjaman') {
    return updateStatusPeminjamanCloud(data);
  }
  if (action === 'laporkan_kerusakan_peminjaman') {
    return laporkanKerusakanPeminjamanCloud(data);
  }
  if (action === 'save_kendaraan') {
    return saveKendaraanCloud(data.record);
  }
  if (action === 'delete_kendaraan') {
    return deleteKendaraanCloud(data.id);
  }
  if (action === 'upload_file_drive') {
    return handleUploadFileToDrive(data);
  }
*/

// -------------------------------------------------------------------------
// 2. TAMBAHKAN DI DALAM FUNGSI doGet(e)
// -------------------------------------------------------------------------
/*
  if (action === 'getPeminjaman') {
    return getPeminjamanCloud();
  }
  if (action === 'getKendaraan') {
    return getKendaraanCloud();
  }
*/

// -------------------------------------------------------------------------
// 3. TAMBAHKAN FUNGSI-FUNGSI DI BAWAH INI DI BAGIAN PALING BAWAH FILE CODE.GS
// -------------------------------------------------------------------------

function getOrCreatePeminjamanSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Peminjaman Kendaraan");
  
  if (!sheet) {
    sheet = ss.insertSheet("Peminjaman Kendaraan");
    sheet.appendRow([
      "ID Peminjaman", 
      "Nama Peminjam", 
      "Divisi", 
      "Kontak", 
      "ID Kendaraan", 
      "Nama Kendaraan", 
      "Plat Nomor", 
      "Waktu Mulai", 
      "Waktu Rencana Kembali", 
      "Waktu Aktual Kembali", 
      "Keperluan", 
      "Status", 
      "Detail Kerusakan", 
      "Estimasi Biaya", 
      "Created At"
    ]);
    const headerRange = sheet.getRange("A1:O1");
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#f1f5f9");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function savePeminjamanCloud(record) {
  try {
    const sheet = getOrCreatePeminjamanSheet();
    sheet.appendRow([
      record.id || '',
      record.namaPeminjam || '',
      record.divisi || '',
      record.kontak || '',
      record.kendaraanId || '',
      record.namaKendaraan || '',
      record.platKendaraan || '',
      record.waktuMulai || '',
      record.waktuRencanaKembali || '',
      record.waktuAktualKembali || '',
      record.keperluan || '',
      record.status || 'Aktif/Dipinjam',
      '',
      0,
      record.createdAt || new Date().toISOString()
    ]);
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      message: 'Data peminjaman berhasil disimpan ke cloud'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getPeminjamanCloud() {
  try {
    const sheet = getOrCreatePeminjamanSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'success',
        data: []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const values = sheet.getRange(2, 1, lastRow - 1, 15).getValues();
    const result = [];

    for (let i = values.length - 1; i >= 0; i--) {
      const r = values[i];
      if (!r[0]) continue;
      result.push({
        id: String(r[0]),
        namaPeminjam: String(r[1]),
        divisi: String(r[2]),
        kontak: String(r[3]),
        kendaraanId: String(r[4]),
        namaKendaraan: String(r[5]),
        platKendaraan: String(r[6]),
        waktuMulai: String(r[7]),
        waktuRencanaKembali: String(r[8]),
        waktuAktualKembali: r[9] ? String(r[9]) : null,
        keperluan: String(r[10]),
        status: String(r[11]),
        kerusakanDetail: r[12] ? String(r[12]) : null,
        biayaPerbaikan: Number(r[13]) || 0,
        createdAt: String(r[14])
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      data: result
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function updateStatusPeminjamanCloud(data) {
  try {
    const sheet = getOrCreatePeminjamanSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) throw new Error("Database masih kosong");

    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(data.id)) {
        sheet.getRange(i + 2, 12).setValue(data.newStatus); // Kolom Status (L)
        if (data.aktualKembali) {
          sheet.getRange(i + 2, 10).setValue(data.aktualKembali); // Kolom Waktu Aktual Kembali (J)
        }
        break;
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      message: 'Status berhasil diubah di cloud'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function laporkanKerusakanPeminjamanCloud(data) {
  try {
    const sheet = getOrCreatePeminjamanSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) throw new Error("Database masih kosong");

    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(data.id)) {
        sheet.getRange(i + 2, 12).setValue("Rusak/Bermasalah"); // Kolom Status
        sheet.getRange(i + 2, 13).setValue(data.detail || ""); // Detail Kerusakan (M)
        sheet.getRange(i + 2, 14).setValue(Number(data.estimasiBiaya) || 0); // Estimasi Biaya (N)
        break;
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      message: 'Laporan kerusakan berhasil disimpan di cloud'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateKendaraanSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Armada Kendaraan");
  if (!sheet) {
    sheet = ss.insertSheet("Armada Kendaraan");
    sheet.appendRow([
      "ID Kendaraan",
      "Nama Kendaraan",
      "Plat Nomor",
      "Jenis",
      "Icon",
      "QR Code",
      "QR Image",
      "Status",
      "Updated At"
    ]);
    const headerRange = sheet.getRange("A1:I1");
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#f1f5f9");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function saveKendaraanCloud(record) {
  try {
    const sheet = getOrCreateKendaraanSheet();
    const lastRow = sheet.getLastRow();
    let foundRow = -1;
    if (lastRow > 1) {
      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === String(record.id)) {
          foundRow = i + 2;
          break;
        }
      }
    }

    const rowData = [
      record.id || '',
      record.nama || '',
      record.plat || '',
      record.jenis || '',
      record.icon || '🚗',
      record.qrCode || '',
      record.qrImage || '',
      record.status || 'Tersedia',
      new Date().toISOString()
    ];

    if (foundRow > -1) {
      sheet.getRange(foundRow, 1, 1, 9).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }

    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      message: 'Armada kendaraan berhasil disimpan ke cloud'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function deleteKendaraanCloud(id) {
  try {
    const sheet = getOrCreateKendaraanSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === String(id)) {
          sheet.deleteRow(i + 2);
          break;
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getKendaraanCloud() {
  try {
    const sheet = getOrCreateKendaraanSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'success',
        data: []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const values = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
    const result = [];
    for (let i = 0; i < values.length; i++) {
      const r = values[i];
      if (!r[0]) continue;
      result.push({
        id: String(r[0]),
        nama: String(r[1]),
        plat: String(r[2]),
        jenis: String(r[3]),
        icon: String(r[4]),
        qrCode: String(r[5]),
        qrImage: String(r[6]),
        status: String(r[7])
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      data: result
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
