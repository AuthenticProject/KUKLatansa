$path = "dashboard.html"
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

$oldText = @"
    <!-- TAB 4: REKAP ABSEN -->
    <div id="tab-absen" class="tab-content">
      <div class="card">
        <div class="card-header">
          <div class="card-title">Rekap Absensi Briefing Pagi</div>
          <div>
            <button class="btn btn-outline" onclick="exportAbsenImage()" style="margin-right: 8px;"
              id="btnExportAbsenImage">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Export Gambar
            </button>
            <button class="btn btn-outline" onclick="exportAbsenCSV()" style="margin-right: 8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
            <button class="btn btn-primary" onclick="loadAbsen()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
        <div class="table-responsive" id="absenTableContainer">
          <table id="tableAbsen">
            <thead>
              <tr>
                <th>Waktu & Tanggal</th>
                <th>Nama Karyawan</th>
                <th>Bagian / Divisi</th>
                <th>Status</th>
                <th style="text-align:right;">Aksi</th>
              </tr>
            </thead>
            <tbody id="absenTableBody">
              <tr>
                <td colspan="5" style="text-align:center;">Memuat data absensi...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
"@

$newText = @"
    <!-- TAB 4: REKAP ABSEN -->
    <div id="tab-absen" class="tab-content">
      <div class="card">
        <!-- Sub-tab navigation -->
        <div class="sub-tabs">
          <div class="sub-tab active" id="subTabHarian" onclick="switchSubTab('harian')">📋 Absen Per Hari</div>
          <div class="sub-tab" id="subTabBulanan" onclick="switchSubTab('bulanan')">📊 Rekap Bulanan</div>
        </div>

        <!-- SUB-TAB: ABSEN HARIAN -->
        <div class="sub-tab-content active" id="subContent-harian">
          <div class="card-header" style="border-top:none; border-radius:0;">
            <div class="card-title">Rekap Absensi Briefing Pagi</div>
            <div>
              <button class="btn btn-outline" onclick="exportAbsenImage()" style="margin-right: 8px;" id="btnExportAbsenImage">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                Export Gambar
              </button>
              <button class="btn btn-outline" onclick="exportAbsenCSV()" style="margin-right: 8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Export CSV
              </button>
              <button class="btn btn-primary" onclick="loadAbsen()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
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
            <div class="filters" style="align-items: center;">
              <label>Bulan:</label>
              <select id="rekapMonth" onchange="renderRekapBulanan()"></select>
              <label>Tahun:</label>
              <select id="rekapYear" onchange="renderRekapBulanan()"></select>
              <button class="btn btn-primary" onclick="renderRekapBulanan()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Tampilkan
              </button>
            </div>
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
            <div style="padding:40px; text-align:center; color:gray;">Pilih bulan dan tahun lalu klik Tampilkan.</div>
          </div>
        </div>
      </div>
    </div>
"@

# Normalize line endings to avoid issues
$contentNormalized = $content -replace "`r`n", "`n"
$oldTextNormalized = $oldText -replace "`r`n", "`n"
$newTextNormalized = $newText -replace "`r`n", "`n"

if ($contentNormalized.Contains($oldTextNormalized)) {
    $contentNormalized = $contentNormalized.Replace($oldTextNormalized, $newTextNormalized)
    # Write back with original encoding
    [System.IO.File]::WriteAllText($path, $contentNormalized, [System.Text.Encoding]::UTF8)
    Write-Host "Replacement successful!"
} else {
    Write-Host "Error: Target content not found. Let's do a substring check..."
    # Check first 50 chars of oldText
    $prefix = $oldTextNormalized.Substring(0, 50)
    if ($contentNormalized.Contains($prefix)) {
         Write-Host "Found prefix, but not full string. Spacing/char mismatch."
    } else {
         Write-Host "Prefix not found either."
    }
}
