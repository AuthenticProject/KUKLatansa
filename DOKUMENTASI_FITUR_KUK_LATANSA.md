# 📚 Dokumentasi Lengkap Sistem Web & PWA/APK KUK La Tansa V2

Dokumen ini berisi panduan dan daftar lengkap seluruh modul web, halaman aplikasi (PWA/APK), database, engine, dan fitur-fitur pada sistem **KUK La Tansa HR & Operational Management System V2**.

---

## 🏛️ 1. Ringkasan Arsitektur Sistem

- **Nama Sistem**: KUK La Tansa HR & Operational System V2
- **Jenis Aplikasi**: Progressive Web App (PWA) / Web-App & Desktop/Android APK via Web Manifest
- **Teknologi Utama**:
  - **Frontend**: HTML5, Vanilla JavaScript (ES6+ Strict), Vanilla CSS (Design Tokens System)
  - **App Shell & RBAC**: Integrated Navigation Bar (`shared/shell.js` + `shared/shell.css`)
  - **Database Local**: LocalStorage Master DB (`shared/master_db.js`) & IndexedDB Support
  - **Backend Synchronization**: Google Apps Script (`apps-script-*.js` / Google Sheets API)
  - **Service Worker & PWA**: Offline Caching (`sw.js` - `kuk-hr-cache-v35`), PWA App Manifest (`manifest.json`)
  - **Visual Export**: HTML2Canvas (Export Gambar Rekapan) & Custom Thermal/PDF Slip Gaji

---

## 📱 2. Daftar Modul Web, Aplikasi, & Fitur-Fiturnya

### 🟢 A. Portal Publik / Mandiri Karyawan (Public Standalone)
Halaman ini dapat diakses secara publik oleh seluruh karyawan untuk keperluan operasional harian:

#### 1. Form Absensi Publik (`absen.html` / `public/absen.html`)
- **Tujuan**: Presensi mandiri karyawan (Clock In / Clock Out).
- **Fitur Utama**:
  - 📷 **Selfie & Kamera Presensi**: Mengambil foto presensi langsung.
  - 📍 **GPS Geo-Location**: Validasi lokasi koordinat lokasi kerja saat absen.
  - 🕒 **Deteksi Keterlambatan**: Kalkulasi otomatis waktu datang terlambat vs jam masuk kerja.
  - 🔍 **QR Code Scanner**: Scan QR Code lokasi/shift jika diperlukan.

#### 2. Form & Rekapan Cuti Mandiri (`cuti.html` / `public/cuti.html`)
- **Tujuan**: Pengajuan cuti bulanan dan ruang pantau rekapan cuti resmi.
- **Fitur Utama**:
  - 🔄 **Toggle Otomatis Jendela Pengajuan vs Mode Rekapan**:
    - **Saat Periode Terbuka (31 Bulan M-1 s/d 2 Bulan M)**: Tampil HANYA Form Pengajuan (Pilih Nama Karyawan, Kalender Interaktif Pemilih Tanggal, Kuota Max 3 Hari/Bulan, Tombol Simpan).
    - **Saat Periode Terkunci (Diluar Jendela Pengajuan)**: Tampil HANYA Matriks Grid Rekapan Cuti Read-Only Resmi dari CSV `rekap-cuti-08-2026.csv`.
  - ⚠️ **SOP & Aturan Bentrok Operasional**:
    - Bentrok antar karyawan dalam satu bagian/divisi tidak diperbolehkan.
    - Bentrok peran operasional (Kepala Toko vs Admin) ditolak otomatis.
    - Aturan khusus: Karyawan pada posisi **Admin 3** (saat ini dijabat oleh *Irvan*) hanya diperbolehkan mengambil cuti pada hari Minggu.

#### 3. Form Peminjaman Armada Kendaraan (`peminjaman.html` / `public/peminjaman.html`)
- **Tujuan**: Pengajuan peminjaman mobil & motor operasional toko/gudang.
- **Fitur Utama**:
  - 🚗 **Pilih Kendaraan**: Pilihan unit armada (Mobil Engkel, L300, Motor Operasional).
  - 📟 **Input Odometer / KM**: Input kilometer awal & kilometer akhir sebelum dan sesudah pemakaian.
  - ⛽ **Log Pengisian BBM**: Pencatatan tanggal, biaya BBM, dan upload struk BBM.

#### 4. Form Pelaporan Pelanggaran Mandiri (`pelanggaran.html` / `public/pelanggaran.html`)
- **Tujuan**: Pelaporan insiden pelanggaran tata tertib / SOP kerja.
- **Fitur Utama**: Form input tanggal insiden, nama karyawan bersangkutan, deskripsi pelanggaran, dan lampiran foto bukti. Laporan langsung otomatis masuk ke sistem tanpa memerlukan approval manual.

#### 5. Form Pencatatan Uang Tip (`tip.html` / `public/tip.html`)
- **Tujuan**: Pelaporan uang tip dari konsumen.
- **Fitur Utama**: Input tanggal, jumlah nominal tip, tim penerima (Pengiriman / Frontliner), dan keterangan transaksi.

---

### 🔴 B. Portal Manajemen & Admin HRD / Operasional
Halaman manajemen yang memerlukan autentikasi & memiliki kontrol hak akses (RBAC):

#### 1. Landing Page & Hub Utama (`index.html`)
- **Tujuan**: Navigasi pusat ke seluruh modul aplikasi.
- **Fitur Utama**: Top Bar Shell Navigation, indikator jaringan (Online/Offline), profil user aktif, dan menu card ke seluruh sistem.

#### 2. Manajemen Data Karyawan (`karyawan.html`)
- **Tujuan**: Kelola database seluruh SDM KUK La Tansa.
- **Fitur Utama**:
  - 👥 **CRUD Karyawan**: Tambah, edit, nonaktifkan data karyawan.
  - 🏪 **Pemisahan Unit Bisnis**: Kategorisasi **KUK Bangunan** vs **KUK Palen**.
  - 💼 **Komponen Gaji**: Gaji pokok, tunjangan jabatan, tunjangan makan/transport, ID Mesin Fingerprint, dan foto profil.

#### 3. Rekap & Review Presensi Karyawan (`attendance_review.html`)
- **Tujuan**: Rekap dan analisis absensi harian karyawan oleh HRD/Kepala Toko.
- **Fitur Utama**: Filter presensi per tanggal, pencarian nama, penyesuaian status presensi (Hadir, Izin, Sakit, Alpa, Terlambat), dan export data rekapitulasi.

#### 4. Import & Parser Mesin Fingerprint (`fingerprint_import.html`)
- **Tujuan**: Memproses log mentah dari mesin absensi fisik sidik jari.
- **Fitur Utama**:
  - 📄 **Parser File Log**: Mendukung import file log sidik jari (.csv / .txt log).
  - ⏱️ **Calculated Engine**: Kalkulasi menit keterlambatan, jam pulang awal, dan lembur otomatis berdasarkan jadwal shift.
  - 🔗 **Pencocokan ID**: Auto-matching ID mesin dengan ID Karyawan master.

#### 5. Admin Rekapitulasi Cuti (`rekap_cuti.html`)
- **Tujuan**: Portal utama manajemen cuti seluruh karyawan.
- **Fitur Utama**:
  - 📊 **Matriks Rekapan Cuti (Tgl 1 - 31)**: Grid lengkap status cuti seluruh karyawan per bulan.
  - ✏️ **Modal Edit Cuti**: Admin dapat mengedit/menyesuaikan tanggal cuti karyawan kapan saja.
  - 📷 **Export Gambar**: Export laporan matriks ke format gambar PNG/JPEG via HTML2Canvas.
  - ⚙️ **Setting Deadline Cloud**: Pengaturan kustom batas waktu kunci pengajuan cuti.

#### 6. Dashboard Penggajian / Payroll (`payroll_dashboard.html`)
- **Tujuan**: Hitung, sesuaikan, dan terbitkan slip gaji karyawan secara otomatis.
- **Fitur Utama**:
  - ✏️ **Fitur Editable Komponen Gaji**: Admin/HRD memiliki fleksibilitas penuh untuk mengedit nominal Gaji Pokok, Tunjangan Jabatan, Insentif Cuti, Bonus Tambahan, maupun Potongan Kasbon/Lainnya per karyawan sebelum slip diterbitkan.
  - 💰 **Kalkulasi Payroll Terintegrasi**: Hitung otomatis Gaji Pokok + Lembur + Tunjangan dikurangi Potongan Terlambat, Denda Pelanggaran, dan Pinjaman.
  - 🖨️ **Cetak Slip Gaji**: Cetak Slip Gaji PDF / Cetak Struk Thermal untuk karyawan.
  - 📁 **Histori Penggajian**: Rekapitulasi total pengeluaran gaji per bulan/periode.

#### 7. Admin Armada & Pemeliharaan Kendaraan (`peminjaman_admin.html`)
- **Tujuan**: Manajemen kendaraan operasional, persetujuan pinjaman, dan log BBM.
- **Fitur Utama**:
  - 📋 **Tabel Pengajuan Pinjaman**: Status persetujuan (*Approved*, *Pending*, *Rejected*).
  - ⛽ **Rekapitulasi BBM**: Total pengeluaran bahan bakar per kendaraan per bulan.
  - 🛠️ **Log Servis & Ganti Oli**: Pencatatan riwayat perawatan rutin kendaraan.
  - ⚠️ **Reminder Pajak & STNK**: Notifikasi tanggal jatuh tempo pajak kendaraan.

#### 8. Pelaporan & Pencatatan Pelanggaran Otomatis (`violation_review.html`)
- **Tujuan**: Monitoring dan rekap pencatatan insiden/pelanggaran karyawan.
- **Fitur Utama**:
  - ⚡ **Otomatisasi Laporan (Tanpa Verifikasi Manual)**: Pelanggaran terdeteksi dan tercatat secara otomatis oleh sistem (Auto-Generated dari data presensi & laporan mandiri) tanpa perlu approval/verifikasi manual, sehingga langsung terakumulasi ke riwayat sanksi dan kalkulasi potongan payroll.

#### 9. Rekapan Pengelolaan Uang Tip (`rekap_tip.html`)
- **Tujuan**: Manajemen dan pembagian perolehan uang tip dari konsumen.
- **Fitur Utama**: Rekap bulanan penerimaan tip per divisi/unit bisnis dan laporan pembagian tim.

#### 10. Executive HRD Dashboard (`hrd.html`)
- **Tujuan**: Monitoring tinggi tingkat kehadiran & kesehatan organisasi SDM.
- **Fitur Utama**: Stat card total karyawan aktif, rasio kedisiplinan harian, grafik pelanggaran, dan analisis HR.

#### 11. Pengaturan Pengguna & Hak Akses (`users.html`)
- **Tujuan**: Kelola akun login staf/admin & hak akses sistem.
- **Fitur Utama**: CRUD akun pengguna, proteksi password hashing, penetapan role (Super Admin, HRD Manager, Admin Palen, Kepala Toko).

---

## ⚙️ 3. Core Engine & Shared Infrastructure (`shared/`)

1. **[`shared/master_db.js`](file:///d:/00.%20Me/07.%20Code%20Project/08.%20KUK%20V2/shared/master_db.js)**: Central LocalStorage Database Manager (`kuk_db_karyawan_v1`, `kuk_db_cuti_v1`, `kuk_violations_db`, `kuk_payroll_db`, dll) dilengkapi auto-sync data bawaan resmi (termasuk jadwal cuti resmi Agustus 2026 dari CSV).
2. **[`shared/shell.js`](file:///d:/00.%20Me/07.%20Code%20Project/08.%20KUK%20V2/shared/shell.js) & [`shared/shell.css`](file:///d:/00.%20Me/07.%20Code%20Project/08.%20KUK%20V2/shared/shell.css)**: App Shell Navigation Bar terintegrasi, manajer sesi autentikasi, serta pendaftaran halaman terisolasi (`SHELL_ISOLATED_PAGES`).
3. **[`shared/attendance_engine.js`](file:///d:/00.%20Me/07.%20Code%20Project/08.%20KUK%20V2/shared/attendance_engine.js)**: Engine perhitungan jam kerja & menit keterlambatan.
4. **[`shared/fingerprint_engine.js`](file:///d:/00.%20Me/07.%20Code%20Project/08.%20KUK%20V2/shared/fingerprint_engine.js)**: Engine pencocokan log absensi mesin fisik.
5. **[`shared/payroll_engine.js`](file:///d:/00.%20Me/07.%20Code%20Project/08.%20KUK%20V2/shared/payroll_engine.js)**: Engine kalkulasi penggajian & slip gaji.
6. **[`shared/security.js`](file:///d:/00.%20Me/07.%20Code%20Project/08.%20KUK%20V2/shared/security.js)**: Validator keamanan, XSS sanitizer, dan RBAC policy check.
7. **[`shared/design-tokens.css`](file:///d:/00.%20Me/07.%20Code%20Project/08.%20KUK%20V2/shared/design-tokens.css)**: Standar variabel CSS desain visual (Warna Marun `#540000`, Emas `#FFCC00`, Font Outfit, radius 16px, glassmorphism, dan shadows).

---

## 🔗 4. Backend Synchronization & Cloud Apps Script

- **`apps-script-absen.js`**: Menghubungkan presensi foto & lokasi GPS ke Google Sheets / Drive folder.
- **`apps-script-peminjaman.js`**: Menghubungkan log peminjaman armada & pengisian BBM ke Google Sheets.
- **`Cuti KUK/code.gs`**: Synchronizer pengajuan cuti mandiri karyawan & setting deadline batas waktu pengisian.

---
*Dokumen ini diperbarui secara otomatis sesuai dengan masukan & aturan operasional terbaru KUK La Tansa V2.*
