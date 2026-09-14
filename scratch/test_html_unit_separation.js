const fs = require('fs');
const assert = require('assert');

console.log('=== Verifying absen.html ===');
const absenHtml = fs.readFileSync('absen.html', 'utf8');
assert(absenHtml.includes('absenUnitFilterBar'), 'absen.html must have unit filter bar');
assert(absenHtml.includes('getLoggedUserData'), 'absen.html must parse user JSON safely');
assert(absenHtml.includes('isEmployeePalen'), 'absen.html must have isEmployeePalen helper');
assert(absenHtml.includes('setAbsenUnitFilter'), 'absen.html must support unit switching');
assert(absenHtml.includes("kukUnitChange"), 'absen.html must listen to kukUnitChange');
console.log('✓ absen.html passed verification');

console.log('=== Verifying cuti.html ===');
const cutiHtml = fs.readFileSync('cuti.html', 'utf8');
assert(cutiHtml.includes('isEmployeePalen'), 'cuti.html must have isEmployeePalen');
assert(cutiHtml.includes('itemUnit === userUnit'), 'cuti.html must check unit equality for leave conflict');
assert(cutiHtml.includes('optgroup label="🏗️ KUK Bangunan'), 'cuti.html must group dropdown by unit');
assert(cutiHtml.includes('optgroup label="🏬 KUK Palen'), 'cuti.html must group Palen in dropdown');
assert(cutiHtml.includes('setCutiMatrixFilter'), 'cuti.html must have matrix unit filter');
assert(cutiHtml.includes('kukUnitChange'), 'cuti.html must listen to kukUnitChange');
console.log('✓ cuti.html passed verification');

console.log('=== Verifying pelanggaran.html ===');
const pelHtml = fs.readFileSync('pelanggaran.html', 'utf8');
assert(pelHtml.includes('getLoggedUserData'), 'pelanggaran.html must parse user JSON safely');
assert(pelHtml.includes('isEmployeePalen'), 'pelanggaran.html must have isEmployeePalen');
assert(pelHtml.includes('optgroup label="🏗️ KUK Bangunan'), 'pelanggaran.html must group dropdown');
assert(pelHtml.includes('optgroup label="🏬 KUK Palen'), 'pelanggaran.html must group Palen in dropdown');
assert(pelHtml.includes("unit,"), 'pelanggaran.html payload must include unit');
assert(pelHtml.includes('kukUnitChange'), 'pelanggaran.html must listen to kukUnitChange');
console.log('✓ pelanggaran.html passed verification');

console.log('=== Verifying karyawan.html ===');
const kryHtml = fs.readFileSync('karyawan.html', 'utf8');
assert(kryHtml.includes('id="rekFilterToko"'), 'karyawan.html must have rekFilterToko');
assert(kryHtml.includes("filterToko = document.getElementById('rekFilterToko')"), 'renderRekrutmenTable must use filterToko');
assert(kryHtml.includes("k.toko === 'palen' ? 0 : 100000"), 'karyawan.html must set default tip kaca to 0 for Palen');
assert(kryHtml.includes('kukUnitChange'), 'karyawan.html must listen to kukUnitChange');
console.log('✓ karyawan.html passed verification');

console.log('=== Verifying rekap_cuti.html & rekap_tip.html ===');
const rekapCuti = fs.readFileSync('rekap_cuti.html', 'utf8');
assert(rekapCuti.includes('kukUnitChange'), 'rekap_cuti.html must listen to kukUnitChange');

const rekapTip = fs.readFileSync('rekap_tip.html', 'utf8');
assert(rekapTip.includes('MasterDB.getEmployees'), 'rekap_tip.html must use MasterDB.getEmployees');
assert(!rekapTip.includes('Miftahussurur'), 'rekap_tip.html fallback must not include Palen employee');
console.log('✓ rekap_cuti.html and rekap_tip.html passed verification');

console.log('\n=============================================');
console.log('🎉 ALL HTML UNIT SEPARATION VERIFICATIONS PASSED!');
console.log('=============================================');
