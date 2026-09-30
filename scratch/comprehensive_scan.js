/**
 * Comprehensive error scanner for KUK V2
 * Checks runtime patterns that would cause issues
 */
const fs = require('fs');
const dir = 'd:/00. Me/07. Code Project/08. KUK V2/';

const errors = [];
const warnings = [];

// ======= 1. INDEX.HTML - Login flow =======
console.log('=== INDEX.HTML LOGIN FLOW ===');
const indexContent = fs.readFileSync(dir + 'index.html', 'utf8');
// Check for sessionStorage login
if (indexContent.includes('sessionStorage')) console.log('  Uses sessionStorage for auth');
if (indexContent.includes('kuk_user')) console.log('  Uses kuk_user key');
if (indexContent.includes('window.location')) {
  const matches = indexContent.match(/window\.location[^;'"]*[;'"]/g) || [];
  matches.forEach(m => console.log('  Redirect: ' + m.substring(0,80)));
}

// ======= 2. CUTI.HTML - Key logic checks =======
console.log('\n=== CUTI.HTML LOGIC CHECK ===');
const cutiContent = fs.readFileSync(dir + 'cuti.html', 'utf8');

// Check getCutiWindowRange - crucial for Oct 2026
const cutiWindowMatch = cutiContent.match(/function getCutiWindowRange[\s\S]*?return \{ startDate, endDate \};/);
if (cutiWindowMatch) {
  console.log('  getCutiWindowRange found:');
  console.log('  ' + cutiWindowMatch[0].substring(0, 300));
}

// Check today variable
const todayMatch = cutiContent.match(/const today = [^;]+;/);
if (todayMatch) console.log('  today: ' + todayMatch[0]);

// Check for day-cell CSS (both open and locked hover)
if (cutiContent.includes('.day-cell.selected')) console.log('  OK: .day-cell.selected CSS found');
if (!cutiContent.includes('.day-cell.sunday')) warnings.push('WARNING: No CSS for .day-cell.sunday (sundays may not be styled)');

// ======= 3. Check if shell.js/shell.css uses day-cell too =======
console.log('\n=== SHELL.CSS DAY REFERENCES ===');
const shellCss = fs.readFileSync(dir + 'shared/shell.css', 'utf8');
const dayRules = shellCss.split('\n').filter(l => l.includes('.day') || l.includes('day-cell'));
dayRules.forEach(r => console.log('  ' + r.trim().substring(0,80)));

// ======= 4. Check mobile.css for conflicts =======
console.log('\n=== MOBILE.CSS RELEVANT RULES ===');
const mobileCss = fs.readFileSync(dir + 'shared/mobile.css', 'utf8');
const mobileDay = mobileCss.split('\n').filter(l => l.includes('.day') || l.includes('cal') || l.includes('cuti') || l.includes('overlay'));
mobileDay.forEach(r => console.log('  ' + r.trim().substring(0,80)));

// ======= 5. Check master_db.js for getEmployees / getKaryawan API =======
console.log('\n=== MASTER_DB.JS API CHECK ===');
const masterDb = fs.readFileSync(dir + 'shared/master_db.js', 'utf8');
const exports = masterDb.match(/getEmployees|getKaryawan|getUsers|getUser\b/g) || [];
console.log('  Exported functions found: ' + [...new Set(exports)].join(', '));

// Check if getKaryawan or getEmployees exists as function definition
if (masterDb.includes('function getEmployees') || masterDb.includes('getEmployees:') || masterDb.includes("'getEmployees'")) {
  console.log('  OK: getEmployees defined');
} else {
  warnings.push('WARNING: getEmployees not found in master_db.js');
}
if (masterDb.includes('function getKaryawan') || masterDb.includes('getKaryawan:') || masterDb.includes("'getKaryawan'")) {
  console.log('  OK: getKaryawan defined');
} else {
  warnings.push('WARNING: getKaryawan not found in master_db.js');
}

// ======= 6. Check absen.html specific issues =======
console.log('\n=== ABSEN.HTML SPECIFIC ===');
const absenContent = fs.readFileSync(dir + 'absen.html', 'utf8');
if (absenContent.includes('fingerprint_engine')) console.log('  Uses fingerprint_engine');
if (absenContent.includes('attendance_engine')) console.log('  Uses attendance_engine');
const absenScripts = (absenContent.match(/src=["'][^"']+["']/g) || []).map(s => s.replace(/src=["']/,'').replace(/["']/,''));
console.log('  Script refs: ' + absenScripts.join(', '));

// ======= 7. Check for unmatched template literals or common JS issues =======
console.log('\n=== COMMON JS PATTERN ISSUES ===');
const filesToCheck = ['cuti.html', 'rekap_cuti.html', 'hrd.html', 'karyawan.html'];
filesToCheck.forEach(fname => {
  const content = fs.readFileSync(dir + fname, 'utf8');
  
  // Check for .catch() without error handling
  const catchCount = (content.match(/\.catch\(/g) || []).length;
  const catchNullCount = (content.match(/\.catch\(\(\) =>/g) || []).length;
  
  // Check for undefined variable patterns
  if (content.includes('MasterDB.getEmployees') && !content.includes('typeof MasterDB')) {
    warnings.push(fname + ': calls MasterDB.getEmployees without typeof check');
  }
  
  console.log('  ' + fname + ': ' + catchCount + ' catch handlers, ' + catchNullCount + ' silent');
});

// ======= 8. Print all warnings =======
console.log('\n=== WARNINGS ===');
if (warnings.length === 0) console.log('  None!');
warnings.forEach(w => console.log('  ' + w));

console.log('\nDone.');
