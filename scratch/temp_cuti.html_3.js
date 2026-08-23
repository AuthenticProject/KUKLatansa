
    // --- KONFIGURASI API ---
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxAjktMA76CUG0l-kCOMuazdLrWt6ULfv6cwhlL-QuGiwhtVJx8Sb12tkOHyXqk48tl/exec";

    const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const today = new Date(); today.setHours(0, 0, 0, 0);

    let viewYear = today.getFullYear();
    let viewMonth = today.getMonth();

    // --- STATE ---
    let dbKaryawan = [];
    let selectedDates = []; // Format YYYY-MM-DD
    let bookedDates = [];
    let leavesMap = {};
    let activeUser = null;
    let isLocked = false;
    
    // --- UTILS ---
    const toKey = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const formatLabel = (k) => { const [y, m, d] = k.split('-'); return `${+d} ${MONTHS[+m - 1]} ${y}`; };

    function getLoggedUsername() {
      const rawUser = sessionStorage.getItem('kuk_user');
      if (!rawUser) return null;
      try {
        const parsed = JSON.parse(rawUser);
        if (parsed && typeof parsed === 'object' && parsed.username) return parsed.username.toLowerCase().trim();
      } catch(e){}
      return String(rawUser).toLowerCase().trim();
    }

    function filterDataByRole(dataArray) {
      if (!Array.isArray(dataArray)) return dataArray;
      const loggedUser = getLoggedUsername();
      if (!loggedUser) return dataArray;

      let hasUsersPerm = false;
      const storedDb = localStorage.getItem('kuk_users_db');
      if (storedDb) {
        try {
          const parsed = JSON.parse(storedDb);
          const u = parsed.find(x => String(x.username).toLowerCase().trim() === loggedUser);
          if (u && u.permissions && u.permissions.includes('users')) hasUsersPerm = true;
        } catch(e){}
      } else {
        if (['fariz', 'irsyadil', 'admin'].includes(loggedUser)) hasUsersPerm = true;
      }
      if (hasUsersPerm) return dataArray;
      const isPalen = ['raju', 'agheea', 'basith', 'anshory', 'lintang'].includes(loggedUser);
      return dataArray.filter(item => {
        const nameStr = String(item.nama || item.fullName || '').toLowerCase().trim();
        const isEmpPalen = nameStr.includes('miftah') || nameStr.includes('nukul');
        return isPalen ? isEmpPalen : !isEmpPalen;
      });
    }

    function showToast(msg, type = 'info') {
      const container = document.getElementById('toastContainer');
      if (!container) return;
      const t = document.createElement('div');
      t.className = `toast ${type}`;
      t.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg> ${msg}`;
      container.appendChild(t);
      setTimeout(() => { t.style.animation = 'toastOut 0.3s forwards'; setTimeout(() => t.remove(), 300); }, 3500);
    }

    function renderSelectDropdown() {
      const sel = document.createElement('select');
      sel.id = 'nama';
      sel.innerHTML = `<option value="">Ketuk untuk memilih</option>` +
        dbKaryawan.map(k => `<option value="${k.id}">${k.nama || k.fullName}</option>`).join('');
      sel.onchange = onUserChange;

      const wrap = document.getElementById('namaWrap');
      if (wrap) {
        wrap.innerHTML = '';
        wrap.appendChild(sel);
      }
    }

    function loadLocalCutiData(user) {
      if (!user) return;
      try {
        const raw = localStorage.getItem('kuk_db_cuti_v1');
        if (!raw) return;
        const list = JSON.parse(raw);
        const userId = String(user.id || '').toLowerCase().trim();
        const userNama = String(user.nama || user.fullName || '').toLowerCase().trim();
        const userBagian = String(user.bagian || user.department || user.position || '').toLowerCase().trim();

        const myRecord = list.find(x => 
          (x.idKaryawan && String(x.idKaryawan).toLowerCase().trim() === userId) ||
          (x.nama && String(x.nama).toLowerCase().trim() === userNama)
        );
        if (myRecord && Array.isArray(myRecord.tanggal)) {
          selectedDates = myRecord.tanggal.slice();
        } else {
          selectedDates = [];
        }

        leavesMap = {};
        bookedDates = [];
        list.forEach(item => {
          const itemId = String(item.idKaryawan || item.id || '').toLowerCase().trim();
          const itemNama = String(item.nama || item.fullName || '').toLowerCase().trim();
          const itemBagian = String(item.bagian || item.department || item.position || '').toLowerCase().trim();
          const isSelf = (itemId === userId || itemNama === userNama);

          if (Array.isArray(item.tanggal)) {
            item.tanggal.forEach(tgl => {
              if (!leavesMap[tgl]) leavesMap[tgl] = [];
              leavesMap[tgl].push({
                id: item.idKaryawan || item.id,
                nama: item.nama || item.fullName,
                bagian: item.bagian || item.department || item.position || 'Operasional'
              });

              if (!isSelf && itemBagian && itemBagian === userBagian) {
                if (!bookedDates.includes(tgl)) bookedDates.push(tgl);
              }
            });
          }
        });
      } catch(err) {
        console.warn('Gagal memuat local cuti data:', err);
      }
    }

    function autoSelectLoggedUser() {
      const logged = getLoggedUsername();
      if (!logged) return;
      const found = dbKaryawan.find(k => {
        const n = String(k.nama || k.fullName || '').toLowerCase().trim();
        return n.includes(logged) || logged.includes(n);
      });
      if (found) {
        const sel = document.getElementById('nama');
        if (sel) {
          sel.value = found.id;
          onUserChange();
        }
      }
    }

    function onUserChange() {
      const id = document.getElementById('nama').value;
      activeUser = dbKaryawan.find(x => String(x.id) === String(id));

      const divWrap = document.getElementById('divisiWrap');
      const divText = document.getElementById('bagianText').querySelector('span');
      const calOverlay = document.getElementById('calOverlay');

      if (!activeUser) {
        if (divWrap) divWrap.style.display = 'none';
        selectedDates = [];
        bookedDates = [];
        renderCalendar();
        updateUI();
        return;
      }

      if (divWrap) divWrap.style.display = 'block';
      if (divText) divText.textContent = activeUser.bagian || 'Tanpa Divisi';

      loadLocalCutiData(activeUser);
      renderCalendar();
      updateUI();

      if (calOverlay) calOverlay.style.display = 'flex';
      const btnText = document.getElementById('btnText');
      if (btnText) btnText.textContent = 'Menyinkronkan data...';

      Promise.all([
        fetch(`${SCRIPT_URL}?action=booked&bagian=${encodeURIComponent(activeUser.bagian)}&idKaryawan=${encodeURIComponent(activeUser.id)}`).then(r => r.json()).catch(() => null),
        fetch(`${SCRIPT_URL}?action=riwayat&idKaryawan=${encodeURIComponent(activeUser.id)}`).then(r => r.json()).catch(() => null)
      ]).then(([bRes, rRes]) => {
        if (bRes && bRes.booked) bookedDates = bRes.booked;
        if (bRes && bRes.leavesMap) leavesMap = bRes.leavesMap;
        if (rRes && rRes.riwayat && Array.isArray(rRes.riwayat.tanggal)) {
          selectedDates = rRes.riwayat.tanggal;
        }
        renderCalendar();
        updateUI();
      }).finally(() => {
        if (calOverlay) calOverlay.style.display = 'none';
      });
    }

    function changeMonth(dir) {
      viewMonth += dir;
      if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      else if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      checkCutiLockState();
      renderCalendar();
      updateUI();
    }

    function getCutiWindowRange(targetYear, targetMonth) {
      const startDate = new Date(targetYear, targetMonth, 0);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(targetYear, targetMonth, 2);
      endDate.setHours(23, 59, 59, 999);

      return { startDate, endDate };
    }

    function isCutiWindowOpenForMonth(targetYear, targetMonth, currentDate = today) {
      const { startDate, endDate } = getCutiWindowRange(targetYear, targetMonth);
      const curr = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      return curr >= startDate && curr <= endDate;
    }

    function checkCutiLockState(batasWaktuCloud = null) {
      const alertEl = document.getElementById('deadlineAlert');
      const userSelectCard = document.getElementById('userSelectCard');
      const calCard = document.getElementById('calCard');
      const bottomBar = document.getElementById('bottomSubmitBar');
      const summaryCard = document.getElementById('summaryCard');
      const rekapListCard = document.getElementById('rekapListCard');
      const matrixWrap = document.getElementById('matrixRecapContainer');
      const pageTitle = document.getElementById('pageMainTitle');
      const pageSubtitle = document.getElementById('pageMainSubtitle');

      const windowOpen = isCutiWindowOpenForMonth(viewYear, viewMonth, today);
      const { startDate, endDate } = getCutiWindowRange(viewYear, viewMonth);

      const prevMonthName = MONTHS[(viewMonth - 1 + 12) % 12];
      const targetMonthName = MONTHS[viewMonth];
      const startDay = startDate.getDate();
      const endDay = endDate.getDate();

      const rangeLabel = `${startDay} ${prevMonthName} s/d ${endDay} ${targetMonthName}`;

      if (!windowOpen || (batasWaktuCloud && new Date() > new Date(batasWaktuCloud))) {
        isLocked = true;
        // BUKAN WAKTU PENGAJUAN: Tampilkan HANYA Rekapan Cuti (Matriks & Daftar)
        if (userSelectCard) userSelectCard.style.display = 'none';
        if (calCard) calCard.style.display = 'none';
        if (summaryCard) summaryCard.style.display = 'none';
        if (bottomBar) bottomBar.style.display = 'none';

        if (matrixWrap) matrixWrap.style.display = 'block';
        if (rekapListCard) rekapListCard.style.display = 'block';

        if (pageTitle) pageTitle.textContent = `📋 Rekapan Cuti ${targetMonthName} ${viewYear}`;
        if (pageSubtitle) pageSubtitle.textContent = `Daftar resmi jadwal cuti karyawan KUK La Tansa.`;

        if (alertEl) {
          alertEl.style.display = 'flex';
          alertEl.className = 'alert danger';
          alertEl.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <div><strong>🔒 Pengajuan Cuti ${targetMonthName} ${viewYear} Dikunci (Mode Rekapan)</strong><br>Pengajuan cuti hanya dibuka pada <strong>${rangeLabel}</strong>. Saat ini halaman hanya menyajikan rekapan jadwal cuti resmi.</div>
          `;
        }
        renderMatrixRecapTable();
    }

    function renderMatrixRecapTable() {
      const container = document.getElementById('matrixRecapContainer');
      if (!container) return;

      const targetMonthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
      const targetMonthName = MONTHS[viewMonth];
      const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

      let allCuti = [];
      try {
        const raw = localStorage.getItem('kuk_db_cuti_v1');
        if (raw) allCuti = JSON.parse(raw);
      } catch(e){}

      const csvEmployees = [
        { idKaryawan: 'K-003', nama: 'Wiba', bagian: 'Admin 2', unit: 'KUK Bangunan', defaultDates: ['2026-08-02', '2026-08-09', '2026-08-16'] },
        { idKaryawan: 'K-004', nama: 'Ulin', bagian: 'Kepala Toko', unit: 'KUK Bangunan', defaultDates: ['2026-08-08', '2026-08-17', '2026-08-29'] },
        { idKaryawan: 'K-005', nama: 'Kahfi', bagian: 'Kasir', unit: 'KUK Bangunan', defaultDates: ['2026-08-01', '2026-08-10', '2026-08-20'] },
        { idKaryawan: 'K-006', nama: 'Nur', bagian: 'Kepala Gudang', unit: 'KUK Bangunan', defaultDates: ['2026-08-02', '2026-08-16', '2026-08-30'] },
        { idKaryawan: 'K-007', nama: 'Alip', bagian: 'Pengiriman', unit: 'KUK Bangunan', defaultDates: ['2026-08-05', '2026-08-15', '2026-08-16'] },
        { idKaryawan: 'K-008', nama: 'Riyan', bagian: 'Frontliner', unit: 'KUK Bangunan', defaultDates: ['2026-08-04', '2026-08-15', '2026-08-28'] },
        { idKaryawan: 'K-009', nama: 'Hiba', bagian: 'Frontliner', unit: 'KUK Bangunan', defaultDates: ['2026-08-06', '2026-08-18', '2026-08-29'] },
        { idKaryawan: 'K-010', nama: 'Rohman', bagian: 'Frontliner', unit: 'KUK Bangunan', defaultDates: ['2026-08-03', '2026-08-16', '2026-08-23'] },
        { idKaryawan: 'K-011', nama: 'Irvan', bagian: 'Admin 3', unit: 'KUK Bangunan', defaultDates: ['2026-08-05', '2026-08-15', '2026-08-23'] },
        { idKaryawan: 'K-002', nama: 'Nukul', bagian: 'Kepala Toko', unit: 'KUK Palen', defaultDates: ['2026-08-04', '2026-08-05', '2026-08-06'] },
        { idKaryawan: 'K-001', nama: 'Miftah', bagian: 'Kepala Gudang', unit: 'KUK Palen', defaultDates: ['2026-08-10', '2026-08-15', '2026-08-18'] }
      ];

      let theadHtml = `
        <tr>
          <th class="emp-head">Karyawan & Bagian</th>
          <th style="min-width:44px; text-align:center;">Total</th>
      `;
      for (let d = 1; d <= totalDays; d++) {
        const dateObj = new Date(viewYear, viewMonth, d);
        const isSunday = dateObj.getDay() === 0;
        const dayName = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][dateObj.getDay()];
        theadHtml += `
          <th style="min-width:32px; text-align:center; ${isSunday ? 'background:#fee2e2; color:#dc2626;' : ''}">
            <div style="font-size:9.5px; opacity:0.8;">${dayName}</div>
            <div style="font-size:12px; font-weight:800;">${d}</div>
          </th>
        `;
      }
      theadHtml += `</tr>`;

      let tbodyHtml = '';
      csvEmployees.forEach(emp => {
        const foundRecord = allCuti.find(c => 
          (c.idKaryawan && String(c.idKaryawan).toLowerCase().trim() === String(emp.idKaryawan).toLowerCase().trim()) ||
          (c.nama && String(c.nama).toLowerCase().trim() === String(emp.nama).toLowerCase().trim())
        );

        const datesList = (foundRecord && Array.isArray(foundRecord.tanggal))
          ? foundRecord.tanggal
          : emp.defaultDates;

        const leaveDaysThisMonth = new Set();
        datesList.forEach(t => {
          if (t.startsWith(targetMonthPrefix)) {
            leaveDaysThisMonth.add(parseInt(t.split('-')[2], 10));
          }
        });

        const totalCutiCount = leaveDaysThisMonth.size;
        const isPalen = emp.unit && emp.unit.includes('Palen');

        tbodyHtml += `
          <tr>
            <td class="emp-col">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                <div>
                  <div style="font-weight:800; color:#0f172a; font-size:13px;">${emp.nama}</div>
                  <span class="${isPalen ? 'badge-palen' : 'badge-bangunan'}">${emp.bagian} • ${isPalen ? 'Palen' : 'Bangunan'}</span>
                </div>
              </div>
            </td>
            <td style="text-align:center; font-weight:800; color:${totalCutiCount > 0 ? '#10b981' : '#64748b'}; background:#f8fafc;">
              ${totalCutiCount} Hari
            </td>
        `;

        for (let d = 1; d <= totalDays; d++) {
          const dateObj = new Date(viewYear, viewMonth, d);
          const isSunday = dateObj.getDay() === 0;
          const isCuti = leaveDaysThisMonth.has(d);

          if (isCuti) {
            tbodyHtml += `<td class="matrix-cell-cuti" title="${emp.nama} Cuti Tgl ${d} ${targetMonthName}">Cuti</td>`;
          } else if (isSunday) {
            tbodyHtml += `<td class="matrix-cell-weekend">-</td>`;
          } else {
            tbodyHtml += `<td style="color:#cbd5e1; text-align:center;">-</td>`;
          }
        }
        tbodyHtml += `</tr>`;
      });

      container.innerHTML = `
        <div class="matrix-card">
          <div class="matrix-header">
            <div>
              <h3 style="font-size:16px; font-weight:800; margin:0; display:flex; align-items:center; gap:8px;">
                <span>📋</span> Matriks Rekapan Cuti Karyawan (${targetMonthName} ${viewYear})
              </h3>
              <p style="font-size:12px; opacity:0.85; margin-top:2px;">
                Daftar resmi jadwal cuti karyawan KUK La Tansa (SOP Maksimal 3 Hari Per Bulan)
              </p>
            </div>
            <div style="font-size:11.5px; background:rgba(255,255,255,0.2); padding:4px 12px; border-radius:20px; font-weight:700;">
              Mode Rekapan (Read-Only)
            </div>
          </div>
          <div class="matrix-wrapper">
            <table class="matrix-table">
              <thead>${theadHtml}</thead>
              <tbody>${tbodyHtml}</tbody>
            </table>
          </div>
        </div>
      `;
    }

    function renderAllCutiRecapTable() {
      const container = document.getElementById('allCutiRecapContainer');
      const badgeEl = document.getElementById('rekapTotalBadge');
      const titleEl = document.getElementById('rekapMonthTitle');
      if (titleEl) titleEl.textContent = `${MONTHS[viewMonth]} ${viewYear}`;
      if (!container) return;

      const targetMonthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
      const targetMonthName = MONTHS[viewMonth];

      let allCuti = [];
      try {
        const raw = localStorage.getItem('kuk_db_cuti_v1');
        if (raw) allCuti = JSON.parse(raw);
      } catch(e){}

      const monthlyList = allCuti.filter(c => {
        if (!Array.isArray(c.tanggal)) return false;
        return c.tanggal.some(t => t.startsWith(targetMonthPrefix));
      });

      if (badgeEl) {
        badgeEl.textContent = `${monthlyList.length} Karyawan Cuti`;
      }

      if (monthlyList.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; padding:20px 16px; color:#64748b; background:#f8fafc; border-radius:12px; font-size:13px; border:1px dashed #cbd5e1;">
            🏖️ Belum ada jadwal cuti terdaftar pada bulan <strong>${targetMonthName} ${viewYear}</strong>.
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${monthlyList.map(item => {
            const datesThisMonth = item.tanggal
              .filter(t => t.startsWith(targetMonthPrefix))
              .sort();
            
            const empName = item.nama || item.fullName || 'Karyawan';
            const bagian = item.bagian || item.department || item.position || 'Operasional';

            return `
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; background:#ffffff; border:1.5px solid #e2e8f0; border-radius:12px; padding:12px 16px;">
                <div>
                  <div style="font-weight:700; font-size:14px; color:#0f172a; display:flex; align-items:center; gap:6px;">
                    ${empName}
                  </div>
                  <div style="font-size:12px; color:#64748b; margin-top:2px;">${bagian}</div>
                </div>
                <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                  ${datesThisMonth.map(dKey => {
                    const dayNum = parseInt(dKey.split('-')[2], 10);
                    return `<span style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; font-weight:700; font-size:12px; padding:4px 9px; border-radius:8px;">📅 Tgl ${dayNum}</span>`;
                  }).join('')}
                  <span style="font-size:11.5px; background:#e6f4ea; color:#137333; font-weight:800; padding:4px 10px; border-radius:14px;">${datesThisMonth.length} Hari</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    function removeDate(key) {
      if (isLocked) return;
      selectedDates = selectedDates.filter(k => k !== key);
      const [y, m] = key.split('-');
      if (Number(y) === viewYear && Number(m) - 1 === viewMonth) renderCalendar();
      updateUI();
    }

    function updateUI() {
      const summary = document.getElementById('summaryCard');
      const chips = document.getElementById('selectedChips');
      document.getElementById('totalSelected').textContent = selectedDates.length;

      if (selectedDates.length === 0) {
        summary.style.display = 'none';
      } else {
        summary.style.display = 'block';
        const cardTitleEl = summary.querySelector('.summary-title');
        if (cardTitleEl) {
          cardTitleEl.innerHTML = isLocked
            ? `Rekapan Cuti Bulan Ini (<span id="totalSelected">${selectedDates.length}</span> Hari)`
            : `Ringkasan Pilihan Anda (<span id="totalSelected">${selectedDates.length}</span> Hari)`;
        }
        chips.innerHTML = selectedDates.slice().sort().map(k => `
          <div class="chip">
            ${formatLabel(k)}
            ${!isLocked ? `<button onclick="removeDate('${k}')"><svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>` : ''}
          </div>
        `).join('');
      }

      const btn = document.getElementById('submitBtn');
      const btnText = document.getElementById('btnText');
      if (!activeUser) {
        btn.disabled = true; btnText.textContent = 'Pilih Karyawan Dahulu';
      } else if (isLocked) {
        btn.disabled = true; btnText.textContent = '🔒 Form Dikunci (Hanya Rekapan Cuti)';
      } else {
        btn.disabled = false;
        btnText.textContent = `Simpan Jadwal (${selectedDates.length} Hari)`;
      }
    }

    function handleSubmit() {
      if (isLocked || !activeUser) return;
      document.getElementById('modalDesc').innerHTML = selectedDates.length > 0
        ? `Menyimpan <strong>${selectedDates.length} jadwal</strong> cuti Anda. Pastikan sesuai kuota per bulan.`
        : `<span style="color:red">Membatalkan / menghapus semua jadwal cuti Anda. Lanjutkan?</span>`;
      document.getElementById('modal').classList.add('show');
    }

    function executeSubmit() {
      document.getElementById('modal').classList.remove('show');
      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.classList.add('loading');
      document.getElementById('btnText').textContent = 'Menyimpan...';

      // 1. Simpan ke database lokal terlebih dahulu (kuk_db_cuti_v1)
      try {
        let allCuti = JSON.parse(localStorage.getItem('kuk_db_cuti_v1') || '[]');
        const targetEmpName = activeUser.nama || activeUser.fullName;
        const idx = allCuti.findIndex(c => 
          (c.idKaryawan && String(c.idKaryawan).toLowerCase().trim() === String(activeUser.id).toLowerCase().trim()) ||
          (c.nama && String(c.nama).toLowerCase().trim() === String(targetEmpName).toLowerCase().trim())
        );
        const recordData = {
          id: idx >= 0 ? allCuti[idx].id : `CUTI-${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${Date.now()}`,
          idKaryawan: activeUser.id,
          nama: targetEmpName,
          bagian: activeUser.bagian || 'Operasional',
          unit: activeUser.unit || 'KUK Bangunan',
          tanggal: selectedDates,
          totalHari: selectedDates.length,
          tipe: 'Cuti Tahunan',
          status: 'APPROVED',
          submittedAt: new Date().toISOString()
        };
        if (idx >= 0) {
          allCuti[idx] = { ...allCuti[idx], ...recordData };
        } else {
          allCuti.push(recordData);
        }
        localStorage.setItem('kuk_db_cuti_v1', JSON.stringify(allCuti));
      } catch(e){}

      // 2. Sinkronisasi ke Cloud GAS
      fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          idKaryawan: activeUser.id,
          nama: activeUser.nama || activeUser.fullName,
          bagian: activeUser.bagian,
          tanggal: selectedDates
        })
      })
        .then(r => r.json())
        .then(res => {
          btn.disabled = false;
          btn.classList.remove('loading');
          if (res.result === 'success') {
            showToast('Data cuti berhasil disimpan ke server!', 'success');
            selectedDates = res.tanggal || selectedDates;
            renderCalendar();
            updateUI();
          } else {
            showToast('Data cuti berhasil disimpan!', 'success');
            renderCalendar();
            updateUI();
          }
        })
        .catch(e => {
          btn.disabled = false;
          btn.classList.remove('loading');
          showToast('Data cuti tersimpan secara lokal.', 'success');
          renderCalendar();
          updateUI();
        });
    }

    init();
  