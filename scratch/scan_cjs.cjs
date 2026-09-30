const fs = require('fs');
const d = 'd:/00. Me/07. Code Project/08. KUK V2/';
const issues = [];
const oks = [];

// Read shared files
const mdb = fs.readFileSync(d + 'shared/master_db.js', 'utf8');
const shellJs = fs.readFileSync(d + 'shared/shell.js', 'utf8');

// Check master_db exports
const mdbExports = [];
['getEmployees','getKaryawan','getUsers','getUser','init','getAllData'].forEach(fn => {
  if (mdb.includes(fn)) mdbExports.push(fn);
});
console.log('master_db.js exports:', mdbExports.join(', '));

// Check shell.js shell exports
if (shellJs.includes('ShellApp') || shellJs.includes('window.ShellApp')) {
  console.log('shell.js: ShellApp exported');
}

const files = [
  'cuti.html','rekap_cuti.html','hrd.html','karyawan.html',
  'absen.html','index.html','users.html','payroll_dashboard.html',
  'peminjaman.html','peminjaman_admin.html','pelanggaran.html',
  'tip.html','attendance_review.html','violation_review.html'
];

console.log('\n=== FILE SCAN ===');
files.forEach(fname => {
  try {
    const c = fs.readFileSync(d + fname, 'utf8');
    const fileIssues = [];

    // 1. Check version stamps consistency
    const versions = (c.match(/\?v=(\d+)/g) || []);
    const uniqueV = [...new Set(versions.map(v => v.replace('?v=', '')))];
    if (uniqueV.length > 1) {
      fileIssues.push('MIXED VERSION STAMPS: ' + uniqueV.join(', '));
    }

    // 2. Check shell.js/css pairing
    const hasShellJs = c.includes("'shared/shell.js") || c.includes('"shared/shell.js');
    const hasShellCss = c.includes("'shared/shell.css") || c.includes('"shared/shell.css');
    const hasShellCssLink = c.includes('shell.css');
    if (hasShellJs && !hasShellCssLink) fileIssues.push('has shell.js but missing shell.css');

    // 3. Check staff_photos loaded for pages that show photos
    const needsPhotos = ['cuti.html','hrd.html','index.html','users.html','payroll_dashboard.html'];
    if (needsPhotos.includes(fname) && !c.includes('staff_photos.js')) {
      fileIssues.push('might benefit from staff_photos.js (shows employee photos)');
    }

    // 4. Check for common undefined function patterns
    // Look for functions called that might not exist
    if (c.includes('DashboardEngine') && !c.includes('dashboard_engine')) {
      fileIssues.push('uses DashboardEngine but dashboard_engine.js not loaded');
    }
    if (c.includes('AttendanceEngine') && !c.includes('attendance_engine')) {
      fileIssues.push('uses AttendanceEngine but attendance_engine.js not loaded');
    }
    if (c.includes('ViolationEngine') && !c.includes('violation_engine')) {
      fileIssues.push('uses ViolationEngine but violation_engine.js not loaded');
    }
    if (c.includes('PayrollEngine') && !c.includes('payroll_engine')) {
      fileIssues.push('uses PayrollEngine but payroll_engine.js not loaded');
    }

    // 5. Check for unguarded MasterDB calls
    if (c.includes('MasterDB.getEmployees') && !c.includes("typeof MasterDB !== 'undefined'") && !c.includes('MasterDB !== undefined')) {
      const count = (c.match(/MasterDB\.getEmployees/g) || []).length;
      // Check if there's any typeof MasterDB guard anywhere
      if (!c.includes('typeof MasterDB')) {
        fileIssues.push('calls MasterDB.getEmployees ' + count + 'x without typeof MasterDB guard');
      }
    }

    // 6. Check for common async issues - fetch without error handling
    const fetchCount = (c.match(/fetch\(/g) || []).length;
    const catchCount = (c.match(/\.catch\(/g) || []).length;
    if (fetchCount > 0 && catchCount === 0) {
      fileIssues.push('has ' + fetchCount + ' fetch calls but NO .catch() handlers');
    }

    // 7. Check for localStorage.getItem without try-catch
    const lsGet = (c.match(/localStorage\.getItem/g) || []).length;
    const tryCount = (c.match(/try\s*\{/g) || []).length;
    if (lsGet > 5 && tryCount === 0) {
      fileIssues.push('uses localStorage ' + lsGet + 'x but has no try-catch');
    }

    if (fileIssues.length > 0) {
      issues.push({ file: fname, problems: fileIssues });
      console.log('[!] ' + fname + ':');
      fileIssues.forEach(i => console.log('    - ' + i));
    } else {
      console.log('OK: ' + fname + ' (v' + (uniqueV[0] || 'no-ver') + ')');
    }
  } catch (e) {
    console.log('ERR reading ' + fname + ': ' + e.message);
  }
});

// Check absen.html - public version
try {
  const pubAbsen = fs.readFileSync(d + 'public/absen.html', 'utf8');
  const pubIssues = [];
  if (pubAbsen.includes('attendance_engine') && !pubAbsen.includes('attendance_engine.js')) {
    pubIssues.push('references attendance_engine incorrectly');
  }
  if (pubIssues.length > 0) {
    console.log('[!] public/absen.html: ' + pubIssues.join(', '));
    issues.push({ file: 'public/absen.html', problems: pubIssues });
  } else {
    console.log('OK: public/absen.html');
  }
} catch(e) { console.log('Could not check public/absen.html: ' + e.message); }

// Final summary
console.log('\n=== SUMMARY ===');
console.log('Files checked:', files.length);
console.log('Issues found:', issues.length);
if (issues.length === 0) {
  console.log('No issues detected! All files look clean.');
} else {
  console.log('Files with issues:');
  issues.forEach(i => console.log('  ' + i.file + ': ' + i.problems.length + ' issue(s)'));
}
