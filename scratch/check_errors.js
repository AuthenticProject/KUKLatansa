const fs = require('fs');
const path = require('path');
const dir = 'd:/00. Me/07. Code Project/08. KUK V2/';
const sharedDir = dir + 'shared/';

const sharedFiles = fs.readdirSync(sharedDir);
console.log('=== SHARED FILES ===');
console.log(sharedFiles.join(', '));

const htmlFiles = [
  'cuti.html','index.html','karyawan.html','hrd.html',
  'rekap_cuti.html','absen.html','pelanggaran.html',
  'peminjaman.html','peminjaman_admin.html','tip.html',
  'payroll_dashboard.html','users.html'
];

console.log('\n=== BROKEN SCRIPT/LINK REFERENCES ===');
htmlFiles.forEach(f => {
  try {
    const content = fs.readFileSync(dir + f, 'utf8');
    const refs = [];
    let m;
    const re = /src=["']([^"']+)["']/g;
    while ((m = re.exec(content)) !== null) refs.push(m[1]);
    const re2 = /href=["']([^"']+\.(?:css|js))["']/g;
    while ((m = re2.exec(content)) !== null) refs.push(m[1]);
    
    refs.forEach(ref => {
      const clean = ref.split('?')[0];
      if (clean.startsWith('http') || clean.startsWith('//')) return;
      const full = path.join(dir, clean);
      if (!fs.existsSync(full)) {
        console.log('MISSING: ' + f + ' -> ' + ref);
      }
    });
  } catch(e) { console.log('ERR reading ' + f + ': ' + e.message); }
});

console.log('\n=== JS SYNTAX CHECK (basic) ===');
const jsFiles = ['shared/master_db.js','shared/security.js','shared/shell.js','shared/dashboard_engine.js'];
jsFiles.forEach(f => {
  try {
    const content = fs.readFileSync(dir + f, 'utf8');
    // Count braces
    const open = (content.match(/\{/g)||[]).length;
    const close = (content.match(/\}/g)||[]).length;
    if (Math.abs(open - close) > 5) {
      console.log('BRACE MISMATCH: ' + f + ' open=' + open + ' close=' + close);
    } else {
      console.log('OK: ' + f);
    }
  } catch(e) { console.log('ERR: ' + f + ': ' + e.message); }
});

console.log('\n=== CHECK kuk_cuti_deadline USAGE ===');
htmlFiles.forEach(f => {
  try {
    const content = fs.readFileSync(dir + f, 'utf8');
    if (content.includes('kuk_cuti_deadline')) {
      console.log('Uses deadline: ' + f);
    }
  } catch(e) {}
});

console.log('\nDone.');
