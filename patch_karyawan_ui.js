const fs = require('fs');

const file = 'karyawan.html';
let content = fs.readFileSync(file, 'utf8');

// Update Tab Switcher text
content = content.replace('🔄 Rekontrak Karyawan (Perpanjangan Kontrak)', '👥 Data Master Karyawan');

// 1. We will replace the entire tabContentRekontrak with the new UI.
// To do this safely, we use regex to find <div id="tabContentRekontrak" ...> up to the next <!-- ==================== TAB 3
const startMarker = '<div id="tabContentRekontrak" style="display: none;">';
const endMarker = '<!-- ==================== TAB 3: REKAPAN GAJI';

if (content.includes(startMarker) && content.includes(endMarker)) {
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);
  
  const newContent = `
    <!-- ==================== TAB 2: DATA MASTER KARYAWAN ==================== -->
    <div id="tabContentRekontrak" style="display: none;">
      <div class="stats-grid" style="margin-bottom: 24px;">
        <div class="stat-card">
          <span class="stat-label">Total Karyawan Aktif</span>
          <span class="stat-value" id="statMasterActive">0</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">KUK Bangunan</span>
          <span class="stat-value" style="color: #fbbf24;" id="statMasterBangunan">0</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">KUK Palen</span>
          <span class="stat-value" style="color: #60a5fa;" id="statMasterPalen">0</span>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h2 style="color:var(--kuk-primary)">👥 Database Master Karyawan</h2>
          <div class="panel-actions">
            <button class="btn btn-primary" onclick="openMasterModal()">
              <span>➕ Tambah Karyawan</span>
            </button>
            <input type="text" id="masterSearch" placeholder="🔍 Cari nama/posisi..." oninput="renderMasterTable()" style="width: 180px;">
            <select id="masterFilterUnit" onchange="renderMasterTable()">
              <option value="all">Semua Unit</option>
              <option value="KUK Bangunan">KUK Bangunan</option>
              <option value="KUK Palen">KUK Palen</option>
            </select>
          </div>
        </div>
        <div class="table-responsive">
          <table id="tableMaster">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Lengkap</th>
                <th>Unit & Dept</th>
                <th>Jabatan</th>
                <th>Status</th>
                <th style="text-align:right;">Aksi</th>
              </tr>
            </thead>
            <tbody id="masterTableBody">
              <!-- Populated via JS -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
  `;
  content = content.substring(0, startIndex) + newContent + content.substring(endIndex);
}

// 2. Add Employee 360 Panel at the end of the body
const employee360Html = `
  <!-- ==================== EMPLOYEE 360 PANEL ==================== -->
  <div class="modal-overlay" id="employee360Panel">
    <div class="modal" style="max-width: 900px; height: 90vh; display: flex; flex-direction: column; padding: 0; overflow: hidden; border-radius: 12px;">
      <div style="background: var(--kuk-primary); color: white; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2 id="e360Name" style="margin: 0; color: white; font-size: 24px;">Nama Karyawan</h2>
          <p id="e360Subtitle" style="margin: 4px 0 0 0; color: #ffcc00; font-size: 14px; font-weight: 600;">Jabatan | Unit</p>
        </div>
        <button onclick="closeEmployee360()" style="background: transparent; border: none; color: white; font-size: 24px; cursor: pointer;">&times;</button>
      </div>
      
      <div style="display: flex; flex: 1; overflow: hidden;">
        <!-- Tabs Sidebar -->
        <div style="width: 200px; background: #f8fafc; border-right: 1px solid var(--kuk-border); display: flex; flex-direction: column;">
          <button class="e360-tab-btn active" onclick="switchE360Tab('overview')">Overview</button>
          <button class="e360-tab-btn" onclick="switchE360Tab('attendance')">Attendance</button>
          <button class="e360-tab-btn" onclick="switchE360Tab('leave')">Leave / Cuti</button>
          <button class="e360-tab-btn" onclick="switchE360Tab('violations')">Violations</button>
          <button class="e360-tab-btn" onclick="switchE360Tab('tips')">Glass Tips</button>
          <button class="e360-tab-btn" onclick="switchE360Tab('vehicles')">Vehicle Loans</button>
          <button class="e360-tab-btn" onclick="switchE360Tab('payroll')">Payroll</button>
        </div>
        
        <!-- Tab Content -->
        <div style="flex: 1; padding: 24px; overflow-y: auto; background: var(--kuk-surface);">
          
          <!-- OVERVIEW -->
          <div id="e360-overview" class="e360-content" style="display: block;">
            <h3 style="color: var(--kuk-primary); border-bottom: 2px solid var(--kuk-border); padding-bottom: 8px; margin-bottom: 16px;">Informasi Pribadi</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div><small style="color:var(--kuk-text-muted)">ID Karyawan</small><div id="e360-id" style="font-weight:600;">-</div></div>
              <div><small style="color:var(--kuk-text-muted)">Fingerprint ID</small><div id="e360-fp" style="font-weight:600;">-</div></div>
              <div><small style="color:var(--kuk-text-muted)">No. Handphone</small><div id="e360-hp" style="font-weight:600;">-</div></div>
              <div><small style="color:var(--kuk-text-muted)">Tanggal Masuk</small><div id="e360-hire" style="font-weight:600;">-</div></div>
            </div>
          </div>
          
          <!-- MOCK PANELS FOR PHASE 2 -->
          <div id="e360-attendance" class="e360-content" style="display: none;">
            <h3 style="color: var(--kuk-primary);">Riwayat Kehadiran</h3>
            <p style="color:var(--kuk-text-muted)">Data kehadiran akan disinkronisasi dengan modul mesin sidik jari.</p>
          </div>
          <div id="e360-leave" class="e360-content" style="display: none;">
            <h3 style="color: var(--kuk-primary);">Riwayat Cuti & Izin</h3>
            <p style="color:var(--kuk-text-muted)">Belum ada data cuti untuk karyawan ini.</p>
          </div>
          <div id="e360-violations" class="e360-content" style="display: none;">
            <h3 style="color: var(--kuk-primary);">Riwayat Pelanggaran</h3>
            <p style="color:var(--kuk-text-muted)">Bersih. Karyawan ini tidak memiliki catatan pelanggaran.</p>
          </div>
          <div id="e360-tips" class="e360-content" style="display: none;">
            <h3 style="color: var(--kuk-primary);">Catatan Tip Kaca</h3>
            <p style="color:var(--kuk-text-muted)">Data tip kaca akan muncul saat terhubung dengan modul kasir/tip.</p>
          </div>
          <div id="e360-vehicles" class="e360-content" style="display: none;">
            <h3 style="color: var(--kuk-primary);">Peminjaman Kendaraan</h3>
            <p style="color:var(--kuk-text-muted)">Karyawan tidak sedang meminjam kendaraan operasional.</p>
          </div>
          <div id="e360-payroll" class="e360-content" style="display: none;">
            <h3 style="color: var(--kuk-primary);">Histori Gaji</h3>
            <p style="color:var(--kuk-text-muted)">Modul gaji 360 belum diaktifkan untuk fase ini.</p>
          </div>
          
        </div>
      </div>
    </div>
  </div>

  <!-- MASTER KARYAWAN MODAL -->
  <div class="modal-overlay" id="masterModal">
    <div class="modal" style="max-width:500px;">
      <h2 id="masterModalTitle">Tambah Karyawan</h2>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
        <div class="form-group">
          <label>Nama Lengkap</label>
          <input type="text" id="m_nama" class="kuk-input">
        </div>
        <div class="form-group">
          <label>No. HP</label>
          <input type="text" id="m_hp" class="kuk-input">
        </div>
        <div class="form-group">
          <label>Unit (Toko)</label>
          <select id="m_unit" class="kuk-input"></select>
        </div>
        <div class="form-group">
          <label>Departemen</label>
          <select id="m_dept" class="kuk-input"></select>
        </div>
        <div class="form-group">
          <label>Jabatan</label>
          <select id="m_pos" class="kuk-input"></select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="m_status" class="kuk-input">
            <option value="Active">Aktif</option>
            <option value="Inactive">Tidak Aktif</option>
          </select>
        </div>
        <div class="form-group">
          <label>Fingerprint ID</label>
          <input type="text" id="m_fp" class="kuk-input">
        </div>
        <div class="form-group">
          <label>Tanggal Mulai</label>
          <input type="date" id="m_hire" class="kuk-input" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ccc;">
        </div>
      </div>
      <div class="modal-actions" style="margin-top:20px;">
        <button class="btn" onclick="closeMasterModal()">Batal</button>
        <button class="btn btn-primary" onclick="saveMasterEmployee()">Simpan Data</button>
      </div>
    </div>
  </div>

  <style>
    .kuk-input { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc; font-family: inherit; }
    .kuk-input:focus { border-color: var(--kuk-primary); outline: none; }
    .e360-tab-btn { padding: 16px; text-align: left; background: transparent; border: none; border-bottom: 1px solid var(--kuk-border); cursor: pointer; font-weight: 600; color: var(--kuk-text-muted); transition: 0.2s; }
    .e360-tab-btn:hover { background: #e2e8f0; }
    .e360-tab-btn.active { background: var(--kuk-surface); color: var(--kuk-primary); border-left: 4px solid var(--kuk-primary); }
  </style>

  <script>
    let masterEditId = null;

    function renderMasterTable() {
      if(typeof MasterDB === 'undefined') return;
      
      const tbody = document.getElementById('masterTableBody');
      if(!tbody) return;
      
      tbody.innerHTML = '';
      
      let emps = MasterDB.getEmployees();
      const q = (document.getElementById('masterSearch').value || '').toLowerCase();
      const u = document.getElementById('masterFilterUnit').value || 'all';
      
      emps = emps.filter(e => {
        if(u !== 'all' && e.unit !== u) return false;
        if(q && !e.fullName.toLowerCase().includes(q) && !e.position.toLowerCase().includes(q)) return false;
        return true;
      });

      // Update KPI
      const act = emps.filter(e => e.status === 'Active');
      if(document.getElementById('statMasterActive')) document.getElementById('statMasterActive').textContent = act.length;
      if(document.getElementById('statMasterBangunan')) document.getElementById('statMasterBangunan').textContent = act.filter(e => e.unit === 'KUK Bangunan').length;
      if(document.getElementById('statMasterPalen')) document.getElementById('statMasterPalen').textContent = act.filter(e => e.unit === 'KUK Palen').length;

      if(emps.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Tidak ada data karyawan.</td></tr>';
        return;
      }

      emps.forEach(e => {
        const tr = document.createElement('tr');
        const statColor = e.status === 'Active' ? 'color:#10b981;background:#d1fae5;padding:4px 8px;border-radius:6px;font-size:12px;font-weight:600;' : 'color:#ef4444;background:#fee2e2;padding:4px 8px;border-radius:6px;font-size:12px;font-weight:600;';
        
        tr.innerHTML = \`
          <td style="color:var(--kuk-text-muted); font-size:13px;">\${e.id}</td>
          <td style="font-weight:600; color:var(--kuk-primary);">\${e.fullName}</td>
          <td>\${e.unit}<br><span style="font-size:12px;color:gray;">\${e.department}</span></td>
          <td>\${e.position}</td>
          <td><span style="\${statColor}">\${e.status === 'Active' ? 'Aktif' : 'Tidak Aktif'}</span></td>
          <td style="text-align:right;">
            <button class="btn" style="padding:6px 12px; font-size:12px; border:1px solid #ccc; background:white;" onclick="openEmployee360('\${e.id}')">👁️ 360 Profile</button>
            <button class="btn" style="padding:6px 12px; font-size:12px; border:1px solid #ccc; background:#f8fafc;" onclick="editMasterEmployee('\${e.id}')">Edit</button>
            <button class="btn btn-danger" style="padding:6px 12px; font-size:12px;" onclick="deleteMasterEmployee('\${e.id}')">Hapus</button>
          </td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function populateMasterSelects() {
      const uSel = document.getElementById('m_unit');
      const dSel = document.getElementById('m_dept');
      const pSel = document.getElementById('m_pos');
      
      if(!uSel) return;
      uSel.innerHTML = ''; dSel.innerHTML = ''; pSel.innerHTML = '';
      
      MasterDB.getUnits().forEach(u => uSel.add(new Option(u, u)));
      MasterDB.getDepartments().forEach(d => dSel.add(new Option(d, d)));
      MasterDB.getPositions().forEach(p => pSel.add(new Option(p, p)));
    }

    function openMasterModal() {
      masterEditId = null;
      document.getElementById('masterModalTitle').textContent = 'Tambah Karyawan Master';
      populateMasterSelects();
      
      document.getElementById('m_nama').value = '';
      document.getElementById('m_hp').value = '';
      document.getElementById('m_fp').value = '';
      document.getElementById('m_hire').value = '';
      document.getElementById('m_status').value = 'Active';
      
      document.getElementById('masterModal').classList.add('show');
    }

    function editMasterEmployee(id) {
      masterEditId = id;
      const e = MasterDB.getEmployee(id);
      if(!e) return;
      
      document.getElementById('masterModalTitle').textContent = 'Edit Data Karyawan';
      populateMasterSelects();
      
      document.getElementById('m_nama').value = e.fullName;
      document.getElementById('m_hp').value = e.contactNumber || '';
      document.getElementById('m_fp').value = e.fingerprintId || '';
      document.getElementById('m_hire').value = e.hireDate || '';
      document.getElementById('m_unit').value = e.unit;
      document.getElementById('m_dept').value = e.department;
      document.getElementById('m_pos').value = e.position;
      document.getElementById('m_status').value = e.status;
      
      document.getElementById('masterModal').classList.add('show');
    }

    function saveMasterEmployee() {
      const payload = {
        id: masterEditId,
        fullName: document.getElementById('m_nama').value,
        contactNumber: document.getElementById('m_hp').value,
        fingerprintId: document.getElementById('m_fp').value,
        hireDate: document.getElementById('m_hire').value,
        unit: document.getElementById('m_unit').value,
        department: document.getElementById('m_dept').value,
        position: document.getElementById('m_pos').value,
        status: document.getElementById('m_status').value
      };
      
      if(!payload.fullName) { alert("Nama lengkap wajib diisi!"); return; }
      
      MasterDB.saveEmployee(payload);
      renderMasterTable();
      closeMasterModal();
    }

    function deleteMasterEmployee(id) {
      if(confirm('Hapus karyawan ini? Data user yang terkait juga akan dihapus.')) {
        MasterDB.deleteEmployee(id);
        renderMasterTable();
      }
    }

    function closeMasterModal() { document.getElementById('masterModal').classList.remove('show'); }

    // --- 360 PROFILE LOGIC ---
    function openEmployee360(id) {
      const e = MasterDB.getEmployee(id);
      if(!e) return;
      
      document.getElementById('e360Name').textContent = e.fullName;
      document.getElementById('e360Subtitle').textContent = \`\${e.position} | \${e.unit}\`;
      
      document.getElementById('e360-id').textContent = e.id;
      document.getElementById('e360-fp').textContent = e.fingerprintId || '-';
      document.getElementById('e360-hp').textContent = e.contactNumber || '-';
      document.getElementById('e360-hire').textContent = e.hireDate || '-';
      
      switchE360Tab('overview');
      document.getElementById('employee360Panel').classList.add('show');
    }

    function closeEmployee360() {
      document.getElementById('employee360Panel').classList.remove('show');
    }

    function switchE360Tab(tabId) {
      document.querySelectorAll('.e360-content').forEach(el => el.style.display = 'none');
      document.getElementById('e360-' + tabId).style.display = 'block';
      
      document.querySelectorAll('.e360-tab-btn').forEach(btn => btn.classList.remove('active'));
      event.currentTarget.classList.add('active');
    }

    // Auto load on init if MasterDB is ready
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(renderMasterTable, 500); // delay to ensure MasterDB is loaded
    });
  </script>
`;

// Insert the JS/HTML at the end of the body
const bodyEndIndex = content.lastIndexOf('</body>');
if (bodyEndIndex !== -1) {
  content = content.substring(0, bodyEndIndex) + employee360Html + content.substring(bodyEndIndex);
}

// We also need to fix the Tab Switching JS logic in karyawan.html to use our renderMasterTable 
// instead of renderRekontrakTable when 'rekontrak' tab is clicked.
const switchTabLogic = `function switchTab(tabId) {`;
const newSwitchTabLogic = `
function switchTab(tabId) {
  if (tabId === 'rekontrak') {
    setTimeout(renderMasterTable, 50);
  }
`;
if (content.includes(switchTabLogic)) {
  content = content.replace(switchTabLogic, newSwitchTabLogic);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully patched karyawan.html for Master Data.');
