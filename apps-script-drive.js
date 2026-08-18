/**
 * =========================================================================
 *  GOOGLE APPS SCRIPT - GOOGLE DRIVE FILE UPLOAD HANDLER
 * =========================================================================
 * 
 * Modul ini menangani pengunggahan file Barcode dan Tanda Tangan (TTD)
 * langsung ke folder Google Drive yang teralokasi:
 * Folder ID: 1gmv0TIJvTJcCyKD8rs7ichW4LANGFtyZ
 * Folder URL: https://drive.google.com/drive/folders/1gmv0TIJvTJcCyKD8rs7ichW4LANGFtyZ?usp=sharing
 * 
 * Silakan tambahkan kode di bawah ini ke dalam file Code.gs project Google Apps Script Anda.
 */

const DRIVE_FOLDER_ID_KUK = "1gmv0TIJvTJcCyKD8rs7ichW4LANGFtyZ";

/**
 * 1. TAMBAHKAN DI DALAM FUNGSI doPost(e)
 * -------------------------------------------------------------------------
 * if (action === 'upload_file_drive') {
 *   return handleUploadFileToDrive(data);
 * }
 * -------------------------------------------------------------------------
 */

function handleUploadFileToDrive(data) {
  try {
    const base64Data = data.base64Data; // data URL base64 atau string base64 murni
    const fileName   = data.fileName || ('File_' + new Date().getTime() + '.png');
    const folderId   = data.folderId || DRIVE_FOLDER_ID_KUK;

    if (!base64Data) {
      throw new Error("Data base64 tidak ditemukan");
    }

    let folder;
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (fErr) {
      folder = DriveApp.getFolderById(DRIVE_FOLDER_ID_KUK);
    }

    // Ekstrak mime-type dan byte data
    let mimeType = 'image/png';
    let rawBase64 = base64Data;

    if (base64Data.indexOf(';base64,') !== -1) {
      const parts = base64Data.split(';base64,');
      mimeType = parts[0].replace('data:', '');
      rawBase64 = parts[1];
    }

    const decodedBytes = Utilities.base64Decode(rawBase64);
    const blob = Utilities.newBlob(decodedBytes, mimeType, fileName);
    const file = folder.createFile(blob);

    // Setel akses agar siapapun dengan tautan dapat melihat/membuka file
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileUrl = file.getUrl();
    const downloadUrl = "https://lh3.googleusercontent.com/d/" + file.getId();

    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      message: 'File berhasil diunggah ke Google Drive',
      fileId: file.getId(),
      fileUrl: fileUrl,
      downloadUrl: downloadUrl,
      folderUrl: "https://drive.google.com/drive/folders/" + folderId
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
