import re

with open('dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the TAB 4 REKAP ABSEN block
old_start = '    <!-- TAB 4: REKAP ABSEN -->'
old_end = '    </div>\n\n  </div>\n\n  <!-- Modal Edit Status Absen'

# Find position
start_pos = content.find(old_start)
end_marker = '    </div>\n\n  </div>'
end_pos = content.find(end_marker, start_pos)
end_pos_actual = end_pos + len('    </div>')  # keep the closing div for .container

new_tab4 = '''    <!-- TAB 4: REKAP ABSEN -->
    <div id="tab-absen" class="tab-content">
      <div class="card">
        <!-- Sub-tab navigation -->
        <div class="sub-tabs">
          <div class="sub-tab active" id="subTabHarian" onclick="switchSubTab(\'harian\')">&#x1F4CB; Absen Per Hari</div>
          <div class="sub-tab" id="subTabBulanan" onclick="switchSubTab(\'bulanan\')">&#x1F4CA; Rekap Bulanan</div>
        </div>

        <!-- SUB-TAB: ABSEN HARIAN -->
        <div class="sub-tab-content active" id="subContent-harian">
          <div class="card-header" style="border-top:none; border-radius:0;">
            <div class="card-title">Rekap Absensi Briefing Pagi</div>
            <div>
              <button class="btn btn-outline" onclick="exportAbsenImage()" style="margin-right: 8px;" id="btnExportAbsenImage">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Export Gambar
              </button>
              <button class="btn btn-outline" onclick="exportAbsenCSV()" style="margin-right: 8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export CSV
              </button>
              <button class="btn btn-primary" onclick="loadAbsen()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Refresh
              </button>
            </div>
          </div>
          <div class="table-responsive" id="absenTableContainer">
            <table id="tableAbsen">
              <thead>
                <tr>
                  <th>Waktu &amp; Tanggal</th>
                  <th>Nama Karyawan</th>
                  <th>Bagian / Divisi</th>
                  <th>Status</th>
                  <th style="text-align:right;">Aksi</th>
                </tr>
              </thead>
              <tbody id="absenTableBody">
                <tr><td colspan="5" style="text-align:center;">Memuat data absensi...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SUB-TAB: REKAP BULANAN -->
        <div class="sub-tab-content" id="subContent-bulanan">
          <div class="rekap-controls">
            <label>Bulan:</label>
            <select id="rekapMonth" onchange="renderRekapBulanan()"></select>
            <label>Tahun:</label>
            <select id="rekapYear" onchange="renderRekapBulanan()"></select>
            <div style="flex:1;"></div>
            <button class="btn btn-outline" onclick="exportRekapImage()" id="btnExportRekapImg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              Unduh Gambar
            </button>
            <button class="btn btn-outline" onclick="exportRekapExcel()" id="btnExportRekapXlsx">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Unduh Excel
            </button>
          </div>
          <div class="summary-stat-row" id="rekapSummaryRow"></div>
          <div class="pivot-wrapper" id="rekapPivotWrapper">
            <div style="padding:40px; text-align:center; color:gray;">Pilih bulan dan tahun, data akan otomatis ditampilkan.</div>
          </div>
        </div>
      </div>
    </div>'''

if start_pos == -1:
    print("ERROR: Could not find start marker")
elif end_pos == -1:
    print("ERROR: Could not find end marker")
else:
    content = content[:start_pos] + new_tab4 + content[end_pos_actual:]
    with open('dashboard.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: Absen tab replaced")
    print(f"  start_pos={start_pos}, end_pos_actual={end_pos_actual}")
