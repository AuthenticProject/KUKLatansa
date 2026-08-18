$path = "dashboard.html"
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

$oldJs = @"
    // Init
    initFilters();
    loadData();
  </script>
"@

$newJs = @"
    // --- SUB TAB ABSEN NAVIGATION ---
    function switchSubTab(subId) {
      document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));
      
      if (subId === 'harian') {
        document.getElementById('subTabHarian').classList.add('active');
        document.getElementById('subContent-harian').classList.add('active');
        renderAbsen();
      } else {
        document.getElementById('subTabBulanan').classList.add('active');
        document.getElementById('subContent-bulanan').classList.add('active');
        initRekapFilters();
        renderRekapBulanan();
      }
    }

    function initRekapFilters() {
      const mSel = document.getElementById('rekapMonth');
      const ySel = document.getElementById('rekapYear');
      if (mSel.children.length > 0) return; // already initialized
      
      const d = new Date();
      mSel.innerHTML = mNames.map((m, i) => `<option value="${String(i + 1).padStart(2, '0')}" ${i === d.getMonth() ? 'selected' : ''}>${m}</option>`).join('');
      const y = d.getFullYear();
      ySel.innerHTML = `<option value="${y - 1}">${y - 1}</option><option value="${y}" selected>${y}</option><option value="${y + 1}">${y + 1}</option>`;
    }

    function renderRekapBulanan() {
      const wrapper = document.getElementById('rekapPivotWrapper');
      if (!rawAbsenData || rawAbsenData.length === 0) {
        wrapper.innerHTML = '<div style="padding:40px; text-align:center; color:gray;">Memuat data absensi... Silakan klik Refresh di tab Harian jika data kosong.</div>';
        return;
      }

      const fM = document.getElementById('rekapMonth').value;
      const fY = parseInt(document.getElementById('rekapYear').value);
      const totalDays = new Date(fY, parseInt(fM), 0).getDate();
      
      // Filter rawAbsenData based on month and year
      const filteredAbsen = rawAbsenData.filter(row => {
        if (!row.waktu) return false;
        const d = new Date(row.waktu);
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const y = d.getFullYear();
        return m === fM && y === fY;
      });

      // Map: { idKaryawan: { day: status } }
      const pivotData = {};
      filteredAbsen.forEach(row => {
        if (!row.waktu) return;
        const d = new Date(row.waktu);
        const dayNum = d.getDate();
        if (!pivotData[row.idKaryawan]) {
          pivotData[row.idKaryawan] = {};
        }
        pivotData[row.idKaryawan][dayNum] = row.status || 'Hadir';
      });

      // Get active employees
      const activeKaryawan = dbKaryawan.filter(k => k.status.toLowerCase() !== 'nonaktif');
      
      if (activeKaryawan.length === 0) {
        wrapper.innerHTML = '<div style="padding:40px; text-align:center; color:gray;">Tidak ada karyawan aktif di database.</div>';
        return;
      }

      // Build Pivot Table HTML
      let html = `<table class="pivot-table" id="tablePivotAbsen">`;
      
      // Table Header
      html += `<thead><tr>`;
      html += `<th class="name-col" rowspan="2">Nama Karyawan</th>`;
      html += `<th rowspan="2">Bagian</th>`;
      html += `<th colspan="${totalDays}">Tanggal</th>`;
      html += `<th colspan="5">Ringkasan</th>`;
      html += `</tr><tr>`;
      
      // Day numbers header
      for (let d = 1; d <= totalDays; d++) {
        const isWknd = new Date(fY, parseInt(fM) - 1, d).getDay() % 6 === 0;
        html += `<th style="${isWknd ? 'background:#e2e8f0; color:#64748b;' : ''}">${d}</th>`;
      }
      // Summary headers
      html += `<th class="chip-hadir" style="padding: 4px 8px;">H</th>`;
      html += `<th class="chip-sakit" style="padding: 4px 8px;">S</th>`;
      html += `<th class="chip-izin" style="padding: 4px 8px;">I</th>`;
      html += `<th class="chip-cuti" style="padding: 4px 8px;">C</th>`;
      html += `<th class="chip-ghoib" style="padding: 4px 8px;">A</th>`;
      html += `</tr></thead><tbody>`;

      // Stats counters
      let totalHadirCount = 0;
      let totalSakitCount = 0;
      let totalIzinCount = 0;
      let totalCutiCount = 0;
      let totalGhoibCount = 0;

      // Group & sort by Bagian, then Nama
      const sortedKaryawan = [...activeKaryawan].sort((a, b) => {
        if (a.bagian !== b.bagian) return a.bagian.localeCompare(b.bagian);
        return a.nama.localeCompare(b.nama);
      });

      sortedKaryawan.forEach(k => {
        html += `<tr>`;
        html += `<td class="name-col">${k.nama}</td>`;
        html += `<td><span class="badge badge-primary" style="font-size:10px; padding:2px 6px;">${k.bagian}</span></td>`;
        
        let hadir = 0, sakit = 0, izin = 0, cuti = 0, ghoib = 0;
        const employeeData = pivotData[k.id] || {};
        
        for (let d = 1; d <= totalDays; d++) {
          const isWknd = new Date(fY, parseInt(fM) - 1, d).getDay() % 6 === 0;
          const status = employeeData[d];
          
          let cellClass = 'pivot-cell-empty';
          let displayChar = '-';
          
          if (status) {
            if (status === 'Hadir') { cellClass = 'pivot-cell-hadir'; displayChar = 'H'; hadir++; totalHadirCount++; }
            else if (status === 'Sakit') { cellClass = 'pivot-cell-sakit'; displayChar = 'S'; sakit++; totalSakitCount++; }
            else if (status === 'Izin') { cellClass = 'pivot-cell-izin'; displayChar = 'I'; izin++; totalIzinCount++; }
            else if (status === 'Cuti') { cellClass = 'pivot-cell-cuti'; displayChar = 'C'; cuti++; totalCutiCount++; }
            else if (status === 'Ghoib') { cellClass = 'pivot-cell-ghoib'; displayChar = 'A'; ghoib++; totalGhoibCount++; }
          } else if (isWknd) {
            cellClass = 'pivot-cell-weekend';
            displayChar = 'Libur';
          }
          
          html += `<td class="day-col ${cellClass}" title="${status ? status : (isWknd ? 'Akhir Pekan' : 'Belum Absen')}">${displayChar === 'Libur' ? '' : displayChar}</td>`;
        }
        
        // Render employee summaries
        html += `<td class="summary-col pivot-cell-hadir">${hadir || ''}</td>`;
        html += `<td class="summary-col pivot-cell-sakit">${sakit || ''}</td>`;
        html += `<td class="summary-col pivot-cell-izin">${izin || ''}</td>`;
        html += `<td class="summary-col pivot-cell-cuti">${cuti || ''}</td>`;
        html += `<td class="summary-col pivot-cell-ghoib">${ghoib || ''}</td>`;
        html += `</tr>`;
      });
      
      html += `</tbody></table>`;
      wrapper.innerHTML = html;

      // Render summary chips
      document.getElementById('rekapSummaryRow').innerHTML = `
        <div class="summary-chip chip-hadir">Total Hadir: ${totalHadirCount}</div>
        <div class="summary-chip chip-sakit">Total Sakit: ${totalSakitCount}</div>
        <div class="summary-chip chip-izin">Total Izin: ${totalIzinCount}</div>
        <div class="summary-chip chip-cuti">Total Cuti: ${totalCutiCount}</div>
        <div class="summary-chip chip-ghoib">Total Alpha (Ghoib): ${totalGhoibCount}</div>
      `;
    }

    function exportRekapImage() {
      const table = document.getElementById('tablePivotAbsen');
      if (!table) return showToast('Tidak ada data rekap untuk diexport.', 'error');
      
      const btn = document.getElementById('btnExportRekapImg');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span class="loader" style="width:14px; height:14px; border-width:2px; vertical-align: middle;"></span> <span style="vertical-align: middle;">Memproses...</span>';
      btn.disabled = true;

      const fM = document.getElementById('rekapMonth').value;
      const fY = document.getElementById('rekapYear').value;
      const monthName = mNames[parseInt(fM) - 1];

      const exportContainer = document.createElement('div');
      exportContainer.style.padding = '40px';
      exportContainer.style.background = '#ffffff';
      exportContainer.style.width = 'fit-content';
      exportContainer.style.fontFamily = "'Outfit', sans-serif";
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';

      const header = document.createElement('div');
      header.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px;">
          <div>
            <h2 style="margin: 0 0 4px 0; color: #0f172a; font-size: 28px; font-weight: 700;">Rekapitulasi Absensi Bulanan</h2>
            <p style="margin: 0; color: #64748b; font-size: 15px; font-weight: 500;">Periode: ${monthName} ${fY}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; color: #0f172a; font-size: 18px; font-weight: 700;">HR Cuti PRO</p>
            <p style="margin: 0; color: #64748b; font-size: 13px;">Generated on: ${new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>
      `;
      exportContainer.appendChild(header);

      // Clone table and apply styles inline for canvas capture
      const tableClone = table.cloneNode(true);
      tableClone.style.borderCollapse = 'collapse';
      tableClone.style.fontSize = '12px';
      tableClone.style.width = '100%';
      
      const ths = tableClone.querySelectorAll('th');
      ths.forEach(th => {
        th.style.border = '1px solid #e2e8f0';
        th.style.padding = '8px 10px';
        th.style.textAlign = 'center';
      });
      tableClone.querySelectorAll('thead th.name-col').forEach(th => th.style.textAlign = 'left');

      const tds = tableClone.querySelectorAll('td');
      tds.forEach(td => {
        td.style.border = '1px solid #e2e8f0';
        td.style.padding = '8px 10px';
        
        // Inline cell styles based on class
        if (td.classList.contains('pivot-cell-hadir')) {
          td.style.background = '#ecfdf5';
          td.style.color = '#059669';
          td.style.fontWeight = 'bold';
        } else if (td.classList.contains('pivot-cell-sakit')) {
          td.style.background = '#fffbeb';
          td.style.color = '#d97706';
          td.style.fontWeight = 'bold';
        } else if (td.classList.contains('pivot-cell-izin')) {
          td.style.background = '#e0f2fe';
          td.style.color = '#0284c7';
          td.style.fontWeight = 'bold';
        } else if (td.classList.contains('pivot-cell-cuti')) {
          td.style.background = '#eff6ff';
          td.style.color = '#2563eb';
          td.style.fontWeight = 'bold';
        } else if (td.classList.contains('pivot-cell-ghoib')) {
          td.style.background = '#fef2f2';
          td.style.color = '#dc2626';
          td.style.fontWeight = 'bold';
        } else if (td.classList.contains('pivot-cell-weekend')) {
          td.style.background = '#f1f5f9';
          td.style.color = '#94a3b8';
        }
      });

      exportContainer.appendChild(tableClone);
      document.body.appendChild(exportContainer);

      html2canvas(exportContainer, {
        backgroundColor: '#ffffff',
        scale: 2
      }).then(canvas => {
        document.body.removeChild(exportContainer);
        btn.innerHTML = originalText;
        btn.disabled = false;

        const filename = `Rekap_Absen_Bulanan_${monthName}_${fY}.png`;
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('Gambar rekap bulanan berhasil diunduh.', 'success');
      }).catch(err => {
        if (document.body.contains(exportContainer)) document.body.removeChild(exportContainer);
        btn.innerHTML = originalText;
        btn.disabled = false;
        showToast('Gagal mengunduh gambar rekap.', 'error');
        console.error(err);
      });
    }

    function exportRekapExcel() {
      const table = document.getElementById('tablePivotAbsen');
      if (!table) return showToast('Tidak ada data rekap untuk diexport.', 'error');

      const fM = document.getElementById('rekapMonth').value;
      const fY = document.getElementById('rekapYear').value;
      const monthName = mNames[parseInt(fM) - 1];

      // Convert table element to sheet
      const wb = XLSX.utils.table_to_book(table, { raw: true });
      
      // Write file
      XLSX.writeFile(wb, `Rekap_Absen_Bulanan_${monthName}_${fY}.xlsx`);
      showToast('File Excel rekap bulanan berhasil diunduh.', 'success');
    }

    // Init
    initFilters();
    loadData();
  </script>
"@

# Also update loadAbsen to call renderRekapBulanan if that tab is active
$oldLoadAbsen = @"
    function loadAbsen() {
      const tbody = document.getElementById('absenTableBody');
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;"><span class="loader" style="border-top-color:var(--primary)"></span> Memuat data...</td></tr>';

      fetch(`\${SCRIPT_URL}?action=rekapAbsen`)
        .then(r => r.json())
        .then(res => {
          rawAbsenData = res.data || [];
          renderAbsen();
        }).catch(e => {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:red;">Gagal memuat data absen.</td></tr>';
        });
    }
"@

$newLoadAbsen = @"
    function loadAbsen() {
      const tbody = document.getElementById('absenTableBody');
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;"><span class="loader" style="border-top-color:var(--primary)"></span> Memuat data...</td></tr>';

      fetch(`\${SCRIPT_URL}?action=rekapAbsen`)
        .then(r => r.json())
        .then(res => {
          rawAbsenData = res.data || [];
          renderAbsen();
          if (document.getElementById('subContent-bulanan').classList.contains('active')) {
            renderRekapBulanan();
          }
        }).catch(e => {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:red;">Gagal memuat data absen.</td></tr>';
        });
    }
"@

# Normalize line endings
$contentNormalized = $content -replace "`r`n", "`n"
$oldJsNormalized = $oldJs -replace "`r`n", "`n"
$newJsNormalized = $newJs -replace "`r`n", "`n"
$oldLoadAbsenNormalized = $oldLoadAbsen -replace "`r`n", "`n"
$newLoadAbsenNormalized = $newLoadAbsen -replace "`r`n", "`n"

if ($contentNormalized.Contains($oldLoadAbsenNormalized)) {
    $contentNormalized = $contentNormalized.Replace($oldLoadAbsenNormalized, $newLoadAbsenNormalized)
} else {
    Write-Host "Warning: oldLoadAbsen not found exactly. We will try line replacement."
}

if ($contentNormalized.Contains($oldJsNormalized)) {
    $contentNormalized = $contentNormalized.Replace($oldJsNormalized, $newJsNormalized)
    [System.IO.File]::WriteAllText($path, $contentNormalized, [System.Text.Encoding]::UTF8)
    Write-Host "Replacement successful!"
} else {
    Write-Host "Error: Init script blocks not found."
}
