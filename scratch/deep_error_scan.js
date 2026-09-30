/**
 * Deep JS error scan for KUK V2 project
 * Checks: undefined variables, missing functions, bad API calls, etc.
 */
const fs = require('fs');
const path = require('path');
const dir = 'd:/00. Me/07. Code Project/08. KUK V2/';

// Try Node's vm to parse JS for syntax errors
const vm = require('vm');

const errors = [];

// ===== 1. Check HTML files for inline script syntax errors =====
const htmlFiles = [
  'cuti.html','index.html','karyawan.html','hrd.html',
  'rekap_cuti.html','absen.html','pelanggaran.html',
  'peminjaman.html','peminjaman_admin.html','tip.html',
  'payroll_dashboard.html','users.html','rekap_tip.html'
];

console.log('=== HTML SCRIPT SYNTAX CHECK ===');
htmlFiles.forEach(fname => {
  try {
    const content = fs.readFileSync(dir + fname, 'utf8');
    // Extract inline scripts
    const scriptRe = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    let scriptIdx = 0;
    while ((m = scriptRe.exec(content)) !== null) {
      const code = m[1].trim();
      if (!code) continue;
      try {
        new vm.Script(code, { filename: fname + ':script' + scriptIdx });
      } catch(e) {
        const line = e.message.match(/line (\d+)/);
        errors.push({ file: fname, scriptIdx, error: e.message.substring(0,120) });
        console.log('SYNTAX ERROR in ' + fname + ' (script#' + scriptIdx + '): ' + e.message.substring(0,100));
      }
      scriptIdx++;
    }
    if (scriptIdx > 0) console.log('  OK: ' + fname + ' (' + scriptIdx + ' scripts checked)');
  } catch(e) {
    console.log('  CANNOT READ: ' + fname);
  }
});

// ===== 2. Check shared JS files for syntax errors =====
console.log('\n=== SHARED JS SYNTAX CHECK ===');
const sharedDir = dir + 'shared/';
const sharedFiles = fs.readdirSync(sharedDir).filter(f => f.endsWith('.js') && f !== 'staff_photos.js' && f !== 'kop_assets.js');
sharedFiles.forEach(fname => {
  try {
    const content = fs.readFileSync(sharedDir + fname, 'utf8');
    try {
      new vm.Script(content, { filename: 'shared/' + fname });
      console.log('  OK: shared/' + fname);
    } catch(e) {
      errors.push({ file: 'shared/' + fname, error: e.message.substring(0,120) });
      console.log('  SYNTAX ERROR in shared/' + fname + ': ' + e.message.substring(0,100));
    }
  } catch(e) {
    console.log('  CANNOT READ: ' + fname);
  }
});

// ===== 3. Check for common pattern errors in cuti.html =====
console.log('\n=== CUTI.HTML SPECIFIC CHECKS ===');
const cutiContent = fs.readFileSync(dir + 'cuti.html', 'utf8');

// Check renderStaffPhoto function exists
if (cutiContent.includes('function renderStaffPhoto')) console.log('  OK: renderStaffPhoto defined');
else console.log('  MISSING: renderStaffPhoto not defined');

// Check staff_photos.js loaded before main script
const staffPhotoPos = cutiContent.indexOf('staff_photos.js');
const mainScriptPos = cutiContent.indexOf('<script>\n    // --- KONFIGURASI API');
if (staffPhotoPos > 0 && mainScriptPos > 0 && staffPhotoPos < mainScriptPos) {
  console.log('  OK: staff_photos.js loaded before main script');
} else {
  console.log('  WARNING: staff_photos.js position relative to main script: staff=' + staffPhotoPos + ', main=' + mainScriptPos);
}

// Check calOverlay pointer-events
if (cutiContent.includes('pointer-events:none')) console.log('  OK: calOverlay has pointer-events:none');
else console.log('  MISSING: calOverlay pointer-events:none');

// Check day-cell CSS
if (cutiContent.includes('.day, .day-cell')) console.log('  OK: .day-cell CSS alias exists');
else console.log('  MISSING: .day-cell CSS not found');

// ===== 4. Check security.js for login gate that might block cuti.html =====
console.log('\n=== SECURITY.JS ANALYSIS ===');
const secContent = fs.readFileSync(dir + 'shared/security.js', 'utf8');
const lines = secContent.split('\n');
lines.forEach((line, i) => {
  if (line.includes('cuti') || line.includes('redirect') || line.includes('window.location')) {
    console.log('  L' + (i+1) + ': ' + line.trim().substring(0, 100));
  }
});

// ===== 5. Summary =====
console.log('\n=== SUMMARY ===');
console.log('Total errors found: ' + errors.length);
errors.forEach(e => console.log('  [' + e.file + '] ' + e.error));
