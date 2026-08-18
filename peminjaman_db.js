/**
 * peminjaman_db.js
 * Modul Database & Service untuk Sistem Peminjaman Kendaraan KUK HR Portal
 * Tersinkronisasi cloud database (Google Apps Script) agar data sinkron di semua device/browser.
 */

const PeminjamanDB = (() => {
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby5sEI1iGmVG28508s9QumeFm19-Zc9cnzoNMOSWtap4pm-ktnWRABDGOTCHNL0rwfS/exec";
  const DRIVE_FOLDER_ID = "1gmv0TIJvTJcCyKD8rs7ichW4LANGFtyZ";
  const DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/1gmv0TIJvTJcCyKD8rs7ichW4LANGFtyZ?usp=sharing";
  const STORAGE_KEY_KENDARAAN = 'kuk_db_kendaraan_v2';
  const STORAGE_KEY_PEMINJAMAN = 'kuk_db_peminjaman_v2';

  // 4 Kendaraan operasional KUK sesuai permintaan
  const DEFAULT_KENDARAAN = [
    {
      id: 'KND-L300',
      nama: 'Mitsubishi L300',
      plat: 'L300',
      jenis: 'Pick Up / Angkutan Logistik',
      icon: '🚚',
      qrImage: 'QR-L300.jpeg',
      status: 'Tersedia'
    },
    {
      id: 'KND-ENGKEL',
      nama: 'Truk Engkel',
      plat: 'Engkel',
      jenis: 'Truk Muatan / Kargo',
      icon: '🚛',
      qrImage: 'qr-engkel.png',
      status: 'Tersedia'
    },
    {
      id: 'KND-VIAR',
      nama: 'Viar Roda Tiga',
      plat: 'Viar',
      jenis: 'Angkutan Operasional / Gudang',
      icon: '🛺',
      status: 'Tersedia'
    },
    {
      id: 'KND-FORKLIFT',
      nama: 'Forklift',
      plat: 'Forklift',
      jenis: 'Alat Berat Operasional Gudang',
      icon: '🏗️',
      status: 'Tersedia'
    }
  ];

  // Daftar 105 Kamar / Instansi
  const DAFTAR_KAMAR = [
    "Pemberkasan Beasiswa Mesir",
    "Staf Yayasan (YPPWPM)",
    "Perdos UNIDA Siman",
    "Darussalam Computer Centre (DCC)",
    "Islamic Center Gontor (ICG) Madiun",
    "Staf ICT (Information and Communication Technology)",
    "Kantor Kopontren",
    "Tempat Pengelolaan Sampah (TPS)",
    "Pembimbing Jam'iyyatul Qurra' Wal Huffadz (Midho'ah Lt. 2)",
    "Pembimbing Pelajaran Sore (Saudi 1 Lt. 1)",
    "Islamic Center Joresan",
    "Kantor Panitia 100 Tahun Gontor",
    "Perpustakaan UNIDA Kampus Rabithah",
    "Gontor Mini Soccer",
    "Pembimbing Bahasa (Language Advisory Council)",
    "Staf Pengasuhan Santri",
    "Majalah Gontor",
    "Raya Department Store (Mantingan)",
    "Gontor TV",
    "Staf Pasca UNIDA Kampus Putri Mantingan",
    "Wartel Rabithah",
    "Dapur Guru",
    "La Tansa Transport Unit 2 (Komplek Stadion)",
    "Staf KMI",
    "La Tansa Laundry",
    "Wartel Sudan",
    "Darussalam Press (Unit 1)",
    "Pusat Data",
    "Bagian Perlistrikan Pondok",
    "Darussalam Gontor Audio (Indonesia 1.1)",
    "Staf Administrasi Pondok",
    "Toko Bangunan Mantingan",
    "Pembimbing Rayon Nin-Xia",
    "La Tansa Konfeksi (Unit 1)",
    "Staf Kantor Pusat IKPM",
    "Wartel Satelit",
    "Khizanah Kreasi Gontor",
    "Slep",
    "Staf Yayasan Penggemukan Sapi",
    "Staf Pembangunan UNIDA Kampus Siman",
    "MABIKORI (Wisma Hadi Lt. 1)",
    "Staf Sekretariat Pimpinan Pondok",
    "KUK Bangunan",
    "UKK Grosir dan Sayur",
    "Staf BAA UNIDA Kampus Robithoh",
    "Darussalam Gontor Stadium (DGS)",
    "Gambia Department Store",
    "Pabrik Teh dan Es Krim",
    "La Tansa Resto",
    "PT. Estafet Dwi Masa (ESDM) Wonosobo",
    "Staf Pembangunan",
    "Darussalam Laboratory",
    "KUK Palen",
    "La Tansa DC Mantingan",
    "Pembimbing Latihan Pidato dan Diskusi (Saudi 1 Lt. 1)",
    "Majalah Himmah",
    "La Tansa Transport Unit 1 (Gerbang Utama)",
    "Suargo FM",
    "PT. Estafet Dwi Masa (ESDM) Mlarak",
    "Baitul Mal Wa Tamwil (BMT) Gontor",
    "Staf Yasyfin",
    "La Tansa Transport Unit 3 (Saudi)",
    "Rumah Tebet",
    "Staf Administrasi UNIDA",
    "La Tansa Distributor Buku",
    "La Tansa Book Store",
    "Studio Rekaman Asia",
    "Staf Yayasan Budidaya Lele",
    "La Tansa DDC",
    "Guest Reception Advisory Council",
    "Pembimbing Luar Negeri",
    "Pembimbing MBGND (Satelit)",
    "Satelit Mart",
    "Darussalam Press (Unit 2)",
    "Staf Pemeliharaan Barang Wakaf dan Pertamanan",
    "Sekretaris UNIDA Gontor",
    "Kantor Badan Wakaf 1",
    "Staf BAA Pusat",
    "Staf Transportasi UNIDA Kampus Siman",
    "Air Minum Darussalam (AMIDAS)",
    "Dewan Mahasiswa (DEMA)",
    "Pabrik Roti",
    "La Tansa Stationery",
    "Markaz Khot",
    "Kantin Satelit",
    "Staf Sub Agen LPG",
    "Staf Pasca UNIDA Kampus Siman",
    "Staf Hubungan Masyarakat (Humas) PMDG",
    "La Tansa Sport",
    "Gontor Auto Service (GAS)",
    "Fotokopi (Baitul Millah)",
    "Pembimbing Jam'iyyatul Qurra' Wal Huffadz (Midho'ah Lt. 1)",
    "Balai Kesehatan Santri",
    "La Tansa Apotek",
    "Klinik Pratama Syifaa (Siman)",
    "Kantin Sudan (Koperasi Mahasiswa)",
    "Kantor Badan Wakaf 2",
    "La Tansa Penyewaan GOR Bulutangkis (Ponorogo Kota)",
    "Perpustakaan Santri PMDG",
    "Islamic Center Slahung",
    "Pembimbing Dapur Umum",
    "Rumah Solo",
    "Khizanah Printing Gontor",
    "Perpustakaan UNIDA Kampus Siman",
    "Pengurus EMIS"
  ];

  // Data peminjaman contoh awal (jika database kosong)
  const DEFAULT_PEMINJAMAN = [
    {
      id: 'PINJAM-1720760000001',
      namaPeminjam: 'Fariz Akbar',
      kamar: 'KUK Bangunan',
      divisi: 'KUK Bangunan',
      kontak: '081234567890',
      kendaraanId: 'KND-L300',
      namaKendaraan: 'Mitsubishi L300',
      platKendaraan: 'L300',
      qrImage: 'QR-L300.jpeg',
      waktuMulai: '2026-07-12T08:00',
      waktuRencanaKembali: '2026-07-12T17:00',
      keperluan: 'Pengiriman barang pesanan kaca ke cabang pemasaran Bekasi.',
      status: 'Aktif/Dipinjam',
      waktuAktualKembali: null,
      kerusakan: null
    }
  ];

  function initDB() {
    if (!localStorage.getItem(STORAGE_KEY_KENDARAAN)) {
      localStorage.setItem(STORAGE_KEY_KENDARAAN, JSON.stringify(DEFAULT_KENDARAAN));
    } else {
      // Pastikan L300 & Engkel di localStorage memiliki qrImage default jika kosong
      try {
        let list = JSON.parse(localStorage.getItem(STORAGE_KEY_KENDARAAN)) || [];
        let changed = false;
        list.forEach(k => {
          const isL300 = String(k.nama||'').toUpperCase().includes('L300') || String(k.id||'').toUpperCase().includes('L300') || String(k.plat||'').toUpperCase().includes('L300');
          const isEngkel = String(k.nama||'').toUpperCase().includes('ENGKEL') || String(k.id||'').toUpperCase().includes('ENGKEL') || String(k.plat||'').toUpperCase().includes('ENGKEL');
          if (isL300 && (!k.qrImage || k.qrImage === '')) {
            k.qrImage = localStorage.getItem('kuk_qr_img_L300') || 'QR-L300.jpeg';
            changed = true;
          }
          if (isEngkel && (!k.qrImage || k.qrImage === '')) {
            k.qrImage = localStorage.getItem('kuk_qr_img_ENGKEL') || 'qr-engkel.png';
            changed = true;
          }
        });
        if (changed) localStorage.setItem(STORAGE_KEY_KENDARAAN, JSON.stringify(list));
      } catch(e) {}
    }
    if (!localStorage.getItem(STORAGE_KEY_PEMINJAMAN)) {
      localStorage.setItem(STORAGE_KEY_PEMINJAMAN, JSON.stringify(DEFAULT_PEMINJAMAN));
    }
    if (!localStorage.getItem('kuk_qr_img_L300') || localStorage.getItem('kuk_qr_img_L300') === '') {
      localStorage.setItem('kuk_qr_img_L300', 'QR-L300.jpeg');
    }
    if (!localStorage.getItem('kuk_qr_img_ENGKEL') || localStorage.getItem('kuk_qr_img_ENGKEL') === '') {
      localStorage.setItem('kuk_qr_img_ENGKEL', 'qr-engkel.png');
    }
  }

  // --- CLOUD SYNC API ---
  function syncFromCloud() {
    // Sinkronisasi data peminjaman & armada kendaraan dari cloud
    const pPinjam = fetch(`${SCRIPT_URL}?action=getPeminjaman`)
      .then(r => r.json())
      .then(res => {
        if (res.result === 'success' && Array.isArray(res.data) && res.data.length > 0) {
          localStorage.setItem(STORAGE_KEY_PEMINJAMAN, JSON.stringify(res.data));
          return res.data;
        }
        return getPeminjamanList();
      })
      .catch(err => {
        console.warn('Gagal sinkron dari cloud, menggunakan local cache:', err);
        return getPeminjamanList();
      });

    const pKendaraan = fetch(`${SCRIPT_URL}?action=getKendaraan`)
      .then(r => r.json())
      .then(res => {
        if (res.result === 'success' && Array.isArray(res.data) && res.data.length > 0) {
          const localList = getKendaraanList();
          const merged = res.data.map(c => {
            const l = localList.find(x => x.id === c.id || String(x.plat||'').toLowerCase() === String(c.plat||'').toLowerCase() || String(x.nama||'').toLowerCase() === String(c.nama||'').toLowerCase());
            const isL300 = String(c.nama||'').toUpperCase().includes('L300') || String(c.id||'').toUpperCase().includes('L300') || String(c.plat||'').toUpperCase().includes('L300');
            const isEngkel = String(c.nama||'').toUpperCase().includes('ENGKEL') || String(c.id||'').toUpperCase().includes('ENGKEL') || String(c.plat||'').toUpperCase().includes('ENGKEL');
            const defaultImg = isL300 ? (localStorage.getItem('kuk_qr_img_L300') || 'QR-L300.jpeg') : (isEngkel ? (localStorage.getItem('kuk_qr_img_ENGKEL') || 'qr-engkel.png') : '');
            const img = (c.qrImage && c.qrImage !== '') ? c.qrImage : (l ? (l.qrImage || '') : '');
            const cachedImg = img || localStorage.getItem('kuk_qr_img_' + c.id) || localStorage.getItem('kuk_qr_img_' + String(c.plat||'').toUpperCase()) || defaultImg;
            return {
              ...l,
              ...c,
              qrImage: cachedImg
            };
          });
          localStorage.setItem(STORAGE_KEY_KENDARAAN, JSON.stringify(merged));
        }
      })
      .catch(() => {});

    return Promise.all([pPinjam, pKendaraan]).then(([pinjamData]) => {
      // Perbarui qrImage pada sesi peminjaman aktif jika kendaraan memiliki gambar QR
      try {
        const storedActive = localStorage.getItem('kuk_active_loan');
        if (storedActive) {
          const activeLoan = JSON.parse(storedActive);
          const kend = getKendaraanById(activeLoan.kendaraanId || activeLoan.platKendaraan || activeLoan.namaKendaraan);
          if (kend && kend.qrImage) {
            activeLoan.qrImage = kend.qrImage;
            activeLoan.platKendaraan = kend.plat || activeLoan.platKendaraan;
            localStorage.setItem('kuk_active_loan', JSON.stringify(activeLoan));
          }
        }
      } catch (e) {}
      return pinjamData;
    });
  }

  // --- KENDARAAN API ---
  function getKendaraanList() {
    initDB();
    try {
      const list = JSON.parse(localStorage.getItem(STORAGE_KEY_KENDARAAN)) || DEFAULT_KENDARAAN;
      return list.map(item => {
        const isL300 = String(item.nama||'').toUpperCase().includes('L300') || String(item.id||'').toUpperCase().includes('L300') || String(item.plat||'').toUpperCase().includes('L300');
        const isEngkel = String(item.nama||'').toUpperCase().includes('ENGKEL') || String(item.id||'').toUpperCase().includes('ENGKEL') || String(item.plat||'').toUpperCase().includes('ENGKEL');
        const defaultImg = isL300 ? (localStorage.getItem('kuk_qr_img_L300') || 'QR-L300.jpeg') : (isEngkel ? (localStorage.getItem('kuk_qr_img_ENGKEL') || 'qr-engkel.png') : '');
        if (!item.qrImage || item.qrImage === '') {
          item.qrImage = localStorage.getItem('kuk_qr_img_' + item.id) ||
                         localStorage.getItem('kuk_qr_img_' + String(item.plat || '').toUpperCase()) ||
                         defaultImg;
        }
        return item;
      });
    } catch (e) {
      return DEFAULT_KENDARAAN;
    }
  }

  function getKendaraanById(idOrQuery) {
    const list = getKendaraanList();
    if (!idOrQuery) return null;
    const q = String(idOrQuery).trim().toLowerCase();
    return list.find(k => 
      String(k.id).toLowerCase() === q ||
      String(k.plat || '').toLowerCase() === q ||
      String(k.nama || '').toLowerCase() === q ||
      String(k.nama || '').toLowerCase().includes(q) ||
      String(k.plat || '').toLowerCase().includes(q) ||
      (q.includes('l300') && String(k.nama||'').toLowerCase().includes('l300')) ||
      (q.includes('engkel') && String(k.nama||'').toLowerCase().includes('engkel'))
    ) || null;
  }

  function saveKendaraan(data) {
    let list = getKendaraanList();
    const existingIdx = list.findIndex(k => k.id === data.id);
    let updatedItem = null;

    if (existingIdx >= 0) {
      const existing = list[existingIdx];
      updatedItem = {
        ...existing,
        ...data,
        qrImage: (data.qrImage !== undefined && data.qrImage !== '') ? data.qrImage : existing.qrImage
      };
      list[existingIdx] = updatedItem;
    } else {
      updatedItem = {
        id: data.id || ('KND-' + Date.now()),
        nama: data.nama || 'Kendaraan Baru',
        plat: data.plat || '-',
        jenis: data.jenis || 'Operasional',
        icon: data.icon || '🚗',
        qrCode: data.qrCode || '',
        qrImage: data.qrImage || '',
        status: 'Tersedia'
      };
      list.push(updatedItem);
    }

    if (updatedItem.qrImage) {
      localStorage.setItem('kuk_qr_img_' + updatedItem.id, updatedItem.qrImage);
      if (updatedItem.plat) localStorage.setItem('kuk_qr_img_' + String(updatedItem.plat).toUpperCase(), updatedItem.qrImage);
      if (String(updatedItem.nama||'').toUpperCase().includes('L300')) {
        localStorage.setItem('kuk_qr_img_L300', updatedItem.qrImage);
      }
      if (String(updatedItem.nama||'').toUpperCase().includes('ENGKEL')) {
        localStorage.setItem('kuk_qr_img_ENGKEL', updatedItem.qrImage);
      }
    }

    localStorage.setItem(STORAGE_KEY_KENDARAAN, JSON.stringify(list));

    // Sinkronkan barcode ke sesi peminjaman aktif jika kendaraan yang dipinjam sama
    try {
      const storedActive = localStorage.getItem('kuk_active_loan');
      if (storedActive && updatedItem) {
        const activeLoan = JSON.parse(storedActive);
        if (
          activeLoan &&
          activeLoan.status === 'Aktif/Dipinjam' &&
          (activeLoan.kendaraanId === updatedItem.id ||
           String(activeLoan.platKendaraan || activeLoan.platNomor || '').toLowerCase() === String(updatedItem.plat || '').toLowerCase() ||
           String(activeLoan.namaKendaraan || activeLoan.kendaraanNama || '').toLowerCase() === String(updatedItem.nama || '').toLowerCase() ||
           (String(activeLoan.namaKendaraan || '').toLowerCase().includes('l300') && String(updatedItem.nama || '').toLowerCase().includes('l300')) ||
           (String(activeLoan.namaKendaraan || '').toLowerCase().includes('engkel') && String(updatedItem.nama || '').toLowerCase().includes('engkel')))
        ) {
          activeLoan.qrImage = updatedItem.qrImage || activeLoan.qrImage || '';
          activeLoan.qrCode = updatedItem.qrCode || activeLoan.qrCode || '';
          if (updatedItem.plat && updatedItem.plat !== '-') {
            activeLoan.platKendaraan = updatedItem.plat;
            activeLoan.platNomor = updatedItem.plat;
          }
          localStorage.setItem('kuk_active_loan', JSON.stringify(activeLoan));
        }
      }
    } catch (e) {}

    // Kirim ke cloud
    fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'save_kendaraan',
        record: updatedItem
      })
    }).catch(err => console.warn('Gagal simpan kendaraan ke cloud:', err));

    return list;
  }

  function deleteKendaraan(id) {
    let list = getKendaraanList();
    list = list.filter(k => k.id !== id);
    localStorage.setItem(STORAGE_KEY_KENDARAAN, JSON.stringify(list));

    fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'delete_kendaraan',
        id: id
      })
    }).catch(() => {});

    return list;
  }

  // Cek apakah kendaraan sedang aktif dipinjam
  function isKendaraanDipinjam(kendaraanId) {
    const pinjamList = getPeminjamanList();
    return pinjamList.some(p => p.kendaraanId === kendaraanId && p.status === 'Aktif/Dipinjam');
  }

  // --- PEMINJAMAN API ---
  function getPeminjamanList() {
    initDB();
    try {
      const list = JSON.parse(localStorage.getItem(STORAGE_KEY_PEMINJAMAN)) || [];
      return list.sort((a, b) => new Date(b.waktuMulai) - new Date(a.waktuMulai));
    } catch (e) {
      return DEFAULT_PEMINJAMAN;
    }
  }

  function getPeminjamanById(id) {
    const list = getPeminjamanList();
    return list.find(p => p.id === id) || null;
  }

  function savePeminjaman(data) {
    const list = getPeminjamanList();
    const kendaraan = getKendaraanById(data.kendaraanId);
    const isL300 = kendaraan ? (String(kendaraan.nama||'').toUpperCase().includes('L300')) : (String(data.namaKendaraan||'').toUpperCase().includes('L300'));
    const isEngkel = kendaraan ? (String(kendaraan.nama||'').toUpperCase().includes('ENGKEL')) : (String(data.namaKendaraan||'').toUpperCase().includes('ENGKEL'));
    const defaultQr = isL300 ? (localStorage.getItem('kuk_qr_img_L300') || 'QR-L300.jpeg') : (isEngkel ? (localStorage.getItem('kuk_qr_img_ENGKEL') || 'qr-engkel.png') : '');

    const newRecord = {
      id: 'PINJAM-' + Date.now() + '-' + Math.floor(Math.random() * 100),
      namaPeminjam: data.namaPeminjam.trim(),
      kamar: (data.kamar || data.divisi || '').trim(),
      divisi: (data.kamar || data.divisi || '').trim(),
      kontak: data.kontak.trim(),
      kendaraanId: data.kendaraanId,
      namaKendaraan: kendaraan ? kendaraan.nama : data.namaKendaraan || '-',
      platKendaraan: kendaraan ? kendaraan.plat : data.platKendaraan || '-',
      qrImage: kendaraan ? (kendaraan.qrImage || defaultQr) : defaultQr,
      qrCode: kendaraan ? (kendaraan.qrCode || '') : '',
      waktuMulai: data.waktuMulai,
      waktuRencanaKembali: data.waktuRencanaKembali,
      keperluan: data.keperluan.trim(),
      status: 'Aktif/Dipinjam',
      waktuAktualKembali: null,
      kerusakan: null,
      createdAt: new Date().toISOString()
    };

    list.unshift(newRecord);
    localStorage.setItem(STORAGE_KEY_PEMINJAMAN, JSON.stringify(list));

    // Kirim ke cloud database agar tersinkron ke seluruh device
    fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'save_peminjaman',
        record: newRecord
      })
    }).catch(err => console.warn('Gagal simpan ke cloud:', err));

    return newRecord;
  }

  function selesaikanPeminjaman(id) {
    return updateStatus(id, 'Selesai');
  }

  function updateStatus(id, newStatus) {
    const list = getPeminjamanList();
    const index = list.findIndex(p => p.id === id);
    if (index === -1) return { success: false, message: 'Data tidak ditemukan.' };

    list[index].status = newStatus;
    if (newStatus === 'Selesai') {
      list[index].waktuAktualKembali = new Date().toISOString();
    }
    localStorage.setItem(STORAGE_KEY_PEMINJAMAN, JSON.stringify(list));

    // Kirim ke cloud database
    fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'update_status_peminjaman',
        id: id,
        newStatus: newStatus,
        aktualKembali: list[index].waktuAktualKembali
      })
    }).catch(err => console.warn('Gagal update status ke cloud:', err));

    return { success: true, data: list[index] };
  }

  function laporkanKerusakan(id, detailKerusakan, estimasiBiaya, tanggalKejadian) {
    const list = getPeminjamanList();
    const index = list.findIndex(p => p.id === id);
    if (index === -1) return { success: false, message: 'Data tidak ditemukan.' };

    list[index].status = 'Rusak/Bermasalah';
    list[index].kerusakan = {
      detail: detailKerusakan.trim(),
      estimasiBiaya: Number(estimasiBiaya) || 0,
      tanggalKejadian: tanggalKejadian || new Date().toISOString().split('T')[0],
      dilaporkanPada: new Date().toISOString()
    };
    list[index].kerusakanDetail = detailKerusakan.trim();
    list[index].biayaPerbaikan = Number(estimasiBiaya) || 0;

    localStorage.setItem(STORAGE_KEY_PEMINJAMAN, JSON.stringify(list));

    // Kirim ke cloud database
    fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'laporkan_kerusakan_peminjaman',
        id: id,
        detail: detailKerusakan.trim(),
        estimasiBiaya: Number(estimasiBiaya) || 0,
        tanggalKejadian: list[index].kerusakan.tanggalKejadian
      })
    }).catch(err => console.warn('Gagal lapor kerusakan ke cloud:', err));

    return { success: true, data: list[index] };
  }

  // --- MODUL LOG BBM & STRUK SPBU ---
  const STORAGE_KEY_BBM = 'kuk_db_bbm_v1';
  const DEFAULT_BBM_LOG = [
    {
      id: 'BBM-1723700001',
      peminjamanId: 'PINJAM-1720760000001',
      kendaraanId: 'KND-L300',
      namaKendaraan: 'Mitsubishi L300',
      platKendaraan: 'L300',
      peminjamNama: 'Fariz Akbar',
      tanggal: '2026-08-14T10:30',
      jenisBbm: 'Biosolar Subsidi',
      jumlahLiter: 35.5,
      totalRupiah: 241400,
      spbuLocation: 'SPBU Pertamina Gontor / Siman',
      kmOdometer: 142500,
      fotoStruk: '',
      catatan: 'Pengisian solar persiapan pengiriman kaca.',
      createdAt: '2026-08-14T10:35:00.000Z'
    }
  ];

  function getLogBbmList() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BBM);
      return raw ? JSON.parse(raw) : DEFAULT_BBM_LOG;
    } catch(e) {
      return DEFAULT_BBM_LOG;
    }
  }

  function saveLogBbm(data) {
    const list = getLogBbmList();
    const newLog = {
      id: data.id || ('BBM-' + Date.now()),
      peminjamanId: data.peminjamanId || '',
      kendaraanId: data.kendaraanId || '',
      namaKendaraan: data.namaKendaraan || '-',
      platKendaraan: data.platKendaraan || '-',
      peminjamNama: data.peminjamNama || '-',
      tanggal: data.tanggal || new Date().toISOString().slice(0, 16),
      jenisBbm: data.jenisBbm || 'Solar Subsidi',
      jumlahLiter: Number(data.jumlahLiter) || 0,
      totalRupiah: Number(data.totalRupiah) || 0,
      spbuLocation: data.spbuLocation || '-',
      kmOdometer: Number(data.kmOdometer) || 0,
      fotoStruk: data.fotoStruk || '',
      catatan: data.catatan || '',
      createdAt: new Date().toISOString()
    };
    list.unshift(newLog);
    localStorage.setItem(STORAGE_KEY_BBM, JSON.stringify(list));

    // Kirim ke cloud database jika ada
    fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'save_log_bbm',
        record: newLog
      })
    }).catch(() => {});

    return newLog;
  }

  function deleteLogBbm(id) {
    let list = getLogBbmList();
    list = list.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY_BBM, JSON.stringify(list));
    return list;
  }

  // --- MODUL JADWAL & SERVIS ARMADA KENDARAAN ---
  const STORAGE_KEY_SERVIS = 'kuk_db_servis_v1';
  const DEFAULT_SERVIS_LIST = [
    {
      id: 'SRV-001',
      kendaraanId: 'KND-L300',
      namaKendaraan: 'Mitsubishi L300',
      platKendaraan: 'L300',
      jenisServis: 'Ganti Oli Mesin & Filter Oli',
      tanggalServis: '2026-08-01',
      kmSaatServis: 140000,
      nextServisDate: '2026-11-01',
      nextServisKm: 145000,
      estimasiBiaya: 450000,
      bengkel: 'Bengkel GAS (Gontor Auto Service)',
      status: 'Selesai',
      catatan: 'Oli mesin Meditran SX 15W-40'
    },
    {
      id: 'SRV-002',
      kendaraanId: 'KND-ENGKEL',
      namaKendaraan: 'Truk Engkel',
      platKendaraan: 'Engkel',
      jenisServis: 'Pemeriksaan Kampas Rem & Uji KIR',
      tanggalServis: '2026-08-25',
      kmSaatServis: 88500,
      nextServisDate: '2026-08-25',
      nextServisKm: 90000,
      estimasiBiaya: 650000,
      bengkel: 'Dishub Ponorogo & Bengkel Resmi',
      status: 'Terjadwal',
      catatan: 'Jadwal perpanjangan uji berkala KIR'
    },
    {
      id: 'SRV-003',
      kendaraanId: 'KND-FORKLIFT',
      namaKendaraan: 'Forklift',
      platKendaraan: 'Forklift',
      jenisServis: 'Servis Hidrolik & Oli Gardan',
      tanggalServis: '2026-07-20',
      kmSaatServis: 1200,
      nextServisDate: '2026-10-20',
      nextServisKm: 1500,
      estimasiBiaya: 800000,
      bengkel: 'Teknisi Khusus Forklift',
      status: 'Selesai',
      catatan: 'Penggantian seal silinder hidrolik utama'
    }
  ];

  function getJadwalServisList() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SERVIS);
      return raw ? JSON.parse(raw) : DEFAULT_SERVIS_LIST;
    } catch(e) {
      return DEFAULT_SERVIS_LIST;
    }
  }

  function saveJadwalServis(data) {
    const list = getJadwalServisList();
    const existingIdx = list.findIndex(s => s.id === data.id);
    let updated;

    if (existingIdx >= 0) {
      updated = { ...list[existingIdx], ...data };
      list[existingIdx] = updated;
    } else {
      updated = {
        id: data.id || ('SRV-' + Date.now()),
        kendaraanId: data.kendaraanId || '',
        namaKendaraan: data.namaKendaraan || '-',
        platKendaraan: data.platKendaraan || '-',
        jenisServis: data.jenisServis || 'Servis Rutin',
        tanggalServis: data.tanggalServis || new Date().toISOString().split('T')[0],
        kmSaatServis: Number(data.kmSaatServis) || 0,
        nextServisDate: data.nextServisDate || '',
        nextServisKm: Number(data.nextServisKm) || 0,
        estimasiBiaya: Number(data.estimasiBiaya) || 0,
        bengkel: data.bengkel || 'Bengkel Resmi KUK',
        status: data.status || 'Terjadwal',
        catatan: data.catatan || '',
        createdAt: new Date().toISOString()
      };
      list.unshift(updated);
    }
    localStorage.setItem(STORAGE_KEY_SERVIS, JSON.stringify(list));
    return updated;
  }

  function updateStatusServis(id, status) {
    const list = getJadwalServisList();
    const item = list.find(s => s.id === id);
    if (item) {
      item.status = status;
      localStorage.setItem(STORAGE_KEY_SERVIS, JSON.stringify(list));
      return true;
    }
    return false;
  }

  function deleteJadwalServis(id) {
    let list = getJadwalServisList();
    list = list.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY_SERVIS, JSON.stringify(list));
    return list;
  }

  // --- WHATSAPP MESSAGE DISPATCH GENERATORS ---
  function getWhatsAppLoanUrl(loan, adminPhone = '') {
    if (!loan) return '';
    const phone = adminPhone ? adminPhone.replace(/[^0-9]/g, '') : '';
    const text = 
`*PENGURUSAN PEMINJAMAN KENDARAAN TB. KUK LATANSA*
────────────────────────
👤 *Peminjam*: ${loan.namaPeminjam}
🏢 *Kamar/Instansi*: ${loan.kamar || loan.divisi}
📱 *No. HP*: ${loan.kontak}
🚘 *Kendaraan*: ${loan.namaKendaraan} (${loan.platKendaraan || '-'})
⏰ *Mulai Pinjam*: ${loan.waktuMulai}
⏳ *Rencana Kembali*: ${loan.waktuRencanaKembali}
🎯 *Keperluan*: ${loan.keperluan}
────────────────────────
✅ _Telah menyetujui seluruh SOP Peminjaman Kendaraan KUK._`;

    const encoded = encodeURIComponent(text);
    return phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  }

  function getWhatsAppBbmUrl(bbm, adminPhone = '') {
    if (!bbm) return '';
    const phone = adminPhone ? adminPhone.replace(/[^0-9]/g, '') : '';
    const text =
`*LAPORAN PENGISIAN BBM KENDARAAN KUK*
────────────────────────
🚘 *Kendaraan*: ${bbm.namaKendaraan} (${bbm.platKendaraan})
👤 *Petugas/Peminjam*: ${bbm.peminjamNama}
⛽ *Jenis BBM*: ${bbm.jenisBbm}
📊 *Jumlah Liter*: ${bbm.jumlahLiter} Liter
💰 *Total Biaya*: Rp ${Number(bbm.totalRupiah).toLocaleString('id-ID')}
📍 *Lokasi SPBU*: ${bbm.spbuLocation}
⏱️ *KM Odometer*: ${bbm.kmOdometer ? bbm.kmOdometer.toLocaleString('id-ID') + ' KM' : '-'}
📝 *Catatan*: ${bbm.catatan || '-'}
────────────────────────
_Bukti struk tersimpan di sistem KUK HR Portal._`;

    const encoded = encodeURIComponent(text);
    return phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  }

  function getWhatsAppOverdueUrl(loan) {
    if (!loan) return '';
    const phone = (loan.kontak || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? ('62' + phone.slice(1)) : phone;
    const text =
`*PERINGATAN BATAS WAKTU PEMINJAMAN KENDARAAN KUK*
────────────────────────
Yth. Sdr. *${loan.namaPeminjam}* (${loan.kamar || loan.divisi}),

Waktu peminjaman kendaraan *${loan.namaKendaraan}* (${loan.platKendaraan}) telah *melewati batas perkiraan kembali* (${loan.waktuRencanaKembali}).

Mohon segera mengembalikan kendaraan ke pangkalan operasional TB. KUK Latansa atau segera konfirmasi ke Admin/Penanggung Jawab jika ada kendala di perjalanan.

Terima kasih atas kerja samanya.
_TB. KUK Latansa PMDG_`;

    const encoded = encodeURIComponent(text);
    return cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  }

  function uploadFileToDrive(base64Data, fileName, folderId) {
    if (!base64Data) return Promise.reject("Base64 data kosong");
    const targetFolder = folderId || DRIVE_FOLDER_ID;

    const payload = {
      action: 'upload_file_drive',
      base64Data: base64Data,
      fileName: fileName || ('File_KUK_' + Date.now() + '.png'),
      folderId: targetFolder
    };

    return fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => res.json())
      .then(data => {
        if (data.result === 'success') {
          console.log("[Drive] File berhasil diunggah:", data.fileUrl);
          return { success: true, fileUrl: data.fileUrl, fileId: data.fileId, downloadUrl: data.downloadUrl };
        } else {
          console.warn("[Drive] Upload gagal:", data.message);
          return { success: false, message: data.message };
        }
      })
      .catch(err => {
        console.warn("[Drive] Fetch error:", err);
        return { success: false, message: err.toString() };
      });
  }

  return {
    DRIVE_FOLDER_ID,
    DRIVE_FOLDER_URL,
    initDB,
    syncFromCloud,
    uploadFileToDrive,
    getDaftarKamar: () => DAFTAR_KAMAR,
    getKendaraanList,
    getKendaraanById,
    saveKendaraan,
    deleteKendaraan,
    isKendaraanDipinjam,
    getPeminjamanList,
    getAllPeminjaman: getPeminjamanList,
    getPeminjamanById,
    getLoanById: getPeminjamanById,
    savePeminjaman,
    selesaikanPeminjaman,
    updateStatus,
    laporkanKerusakan,
    // Log BBM & Struk SPBU
    getLogBbmList,
    saveLogBbm,
    deleteLogBbm,
    // Jadwal Servis & Perawatan Armada
    getJadwalServisList,
    saveJadwalServis,
    updateStatusServis,
    deleteJadwalServis,
    // WhatsApp Dispatch
    getWhatsAppLoanUrl,
    getWhatsAppBbmUrl,
    getWhatsAppOverdueUrl
  };
})();

// Alias agar kompatibel dengan pemanggilan PeminjamanService di dashboard maupun PeminjamanDB di form
window.PeminjamanDB = PeminjamanDB;
window.PeminjamanService = PeminjamanDB;

