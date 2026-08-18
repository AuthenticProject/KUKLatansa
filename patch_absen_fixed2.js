const fs = require('fs');
let txt = fs.readFileSync('dashboard/index.html', 'utf8');

// 1. Add Button
const btnTarget = '<button class="btn btn-outline" onclick="exportAbsenImage()">';
if(txt.includes(btnTarget) && !txt.includes('openImportAbsenModal()')) {
  txt = txt.replace(btnTarget, '<button class="btn btn-primary" onclick="openImportAbsenModal()">🤥 Import Excel</button>\n                  ' + btnTarget);
}

// 2. Add Modal
const modalTarget = '<!-- MODAL: MANAJEMEN ARMADA KENDARAAN -->';
const modalHTML = `
    <!-- MODAL: IMPORT ABSEN FINGERPRINT -->
    <div class="modal-overlay" id="importAbsenModal">
      <div class="modal-container" style="max-width: 700px;">
        <div class="modal-header">
          <h3 style="font-size:18px; font-weight:700;">🤥 Import Rekap Absen (Fingerprint)</h3>
          <button class="btn-close" onclick="closeModal('importAbsenModal')">&amp;#times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Pilih File Excel (.xls, .xlsx)</label>
            <input type="file" id="importAbsenFile" accept=".xls,.xlsx" class="form-control" onchange="handleImportAbsenFile(event)">
            <small style="color:var(--text-muted);">Pilih file "1_StandardReport.xls" hasil unduhan mesin fingerprint.</small>
          </div>
          
          <div id="importAbsenPreviewArea" style="display:none; margin-top:20px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
              <strong>Preview Data: <span id="importAbsenMonthLabel" style="color:var(--primary);"></span></strong>
              <span style="font-size:12px; font-weight:600; background:var(--warning-light); color:var(--warning); padding:3px 8px; border-radius:12px;"><span id="importAbsenCount">0</span> Karyawan Ditemukan</span>
            </div>
            <div style="max-height:300px; overflow-y:auto; border:1px solid var(--border); border-radius:8px;">
              <table class="table">
                <thead style="position:sticky; top:0; background:var(--surface);">
                  <tr>
                    <th>Nama</th>
                    <th>Hadir (1)</th>
                    <th>Cuti (25)</th>
                    <th>Keluar (26)</th>
                  </tr>
                </thead>
                <tbody id="importAbsenPreviewTbody"></tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeModal('importAbsenModal')">Batal</button>
          <button class="btn btn-primary" id="btnSubmitImportAbsen" onclick="submitImportAbsen()" disabled>Simpan ke Database</button>
        </div>
      </div>
    </div>

`;
if(txt.includes(modalTarget) && !txt.includes('importAbsenModal')) {
  txt = txt.replace(modalTarget, modalHTML + modalTarget);
}

// 3. Add Script
const scriptTarget = 'function exportAbsenImage() {';
const scriptJS = `
    // --- IMPORT ABSEN FINGERPRINT ---
    let parsedAbsenBulkData = [];
    
    function openImportAbsenModal() {
      document.getElementById('importAbsenFile').value = '';
      document.getElementById('importAbsenPreviewArea').style.display = 'none';
      document.getElementById('btnSubmitImportAbsen').disabled = true;
      parsedAbsenBulkData = [];
      openModal('importAbsenModal');
    }

    function handleImportAbsenFile(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = function(evt) {
        const data = evt.target.result;
        let wb;
        try {
          wb = XLSX.read(data, {type: 'binary'});
        } catch(err) {
          showToast('Gagal membaca file Excel. Pastikan format benar.', 'error');
          return;
        }
        
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, {header: 1});
        
        if (json.length < 5) {
          showToast('Format tidak sesuai. Baris data terlalu sedikit.', 'error');
          return;
        }
        
        let periodeStr = '';
        if (json[1] && json[1][0] === 'Stat. Tgl') {
          periodeStr = json[1][1];
        }
        
        let targetMonth = '';
        if (periodeStr) {
          const m = periodeStr.match(/(\d{4})-(\d{2})-\d{2}/);
          if (m) {
            targetMonth = m[1] + '-' + m[2];
          }
        }
        
        if (!targetMonth) {
          const m = document.getElementById('rekapAbsenMonth').value;
          const y = document.getElementById('rekapAbsenYear').value;
          targetMonth = y + '-' + m;
        }
        
        document.getElementById('importAbsenMonthLabel').textContent = targetMonth;
        
        parsedAbsenBulkData = [];
        const tbody = document.getElementById('importAbsenPreviewTbody');
        tbody.innerHTML = '';
        let count = 0;
        
        for (let i = 4; i < json.length; i++) {
          const row = json[i];
          if (!row || !row[0] || !row[1]) continue;
          
          const fingerprintId = row[0];
          const rawName = row[1];
          const dep = row[2];
          
          let hadir = 0, cuti = 0, keluar = 0;
          
          for (let d = 1; d <= 31; d++) {
            const cellVal = row[d + 2];
            if (cellVal == 1) {
              hadir++;
              parsedAbsenBulkData.push({
                waktu: targetMonth + '-' + String(d).padStart(2, '0'),
                idKaryawan: 'FING-' + fingerprintId,
                nama: rawName,
                bagian: dep || 'Umum',
                status: 'Hadir'
              });
            } else if (cellVal == 25) {
              cuti++;
              parsedAbsenBulkData.push({
                waktu: targetMonth + '-' + String(d).padStart(2, '0'),
                idKaryawan: 'FING-' + fingerprintId,
                nama: rawName,
                bagian: dep || 'Umum',
                status: 'Cuti'
              });
            } else if (cellVal == 26) {
              keluar++;
              parsedAbsenBulkData.push({
                waktu: targetMonth + '-' + String(d).padStart(2, '0'),
                idKaryawan: 'FING-' + fingerprintId,
                nama: rawName,
                bagian: dep || 'Umum',
                status: 'Keluar'
              });
            }
          }
          
          if (hadir > 0 || cuti > 0 || keluar > 0) {
            count++;
            tbody.innerHTML += '<tr>' +
              '<td>' + rawName + '</td>' +
              ('<td style="color:var(--success); font-weight:bold;">' + hadir + '</td>') +
              ('<td style="color:var(--warning); font-weight:bold;">' + cuti + '</td>') +
              ('<td style="color:var(--danger); font-weight:bold;">' + keluar + '</td>') +
            ('</tr>');
          }
        }
        
        document.getElementById('importAbsenCount').textContent = count;
        document.getElementById('importAbsenPreviewArea').style.display = 'block';
        document.getElementById('btnSubmitImportAbsen').disabled = (parsedAbsenBulkData.length === 0);
      };
      reader.readAsBinaryString(file);
    }

    function submitImportAbsen() {
      if (parsedAbsenBulkData.length === 0) return;
      
      const btn = document.getElementById('btnSubmitImportAbsen');
      btn.innerHTML = '<span class="spinner" style="display:inline-block; border:2px solid #fff; border-top-color:transparent; border-radius:50%; width:12px; height:12px; animation:spin 1s linear infinite; margin-right:5px;"></span> Mengunggah...';
      btn.disabled = true;
      
      const payload = {
        action: 'absen_bulk',
        records: parsedAbsenBulkData
      };
      
      fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(() => {
        showToast('✅ Berhasil mengimpor data absensi!', 'success');
        closeModal('importAbsenModal');
        
        btn.innerHTML = 'Simpan ke Database';
        btn.disabled = false;
        
        setTimeout(() => {
          if (typeof fetchDashboardData === 'function') fetchDashboardData();
          if (typeof rekapAbsenMonth !== 'undefined') renderRekapBulanan();
        }, 1000);
      }).catch(err => {
        console.error(err);
        showToast('Gagal mengimpor data: ' + err.message, 'error');
        btn.innerHTML = 'Simpan ke Database';
        btn.disabled = false;
      });
    }
    
`;
if(txt.includes(scriptTarget) && !txt.includes('openImportAbsenModal')) {
  txt = txt.replace(scriptTarget, scriptJS + scriptTarget);
}

fs.writeFileSync('dashboard/index.html', txt, 'utf8');
console.log('Patched dashboard/index.html successfully!');