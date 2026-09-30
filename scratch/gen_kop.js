const fs = require('fs');
const path = require('path');

const bgn = fs.readFileSync(path.join(__dirname, '../kop_bangunan.png')).toString('base64');
const pln = fs.readFileSync(path.join(__dirname, '../kop_palen.png')).toString('base64');
const umm = fs.readFileSync(path.join(__dirname, '../kop_umum.png')).toString('base64');

const out = `/* KUK Kop Surat Assets - Base64 Embedded for 100% Reliable Offline/Print Rendering */
(function() {
  window.KUK_KOP_ASSETS = {
    bangunan: "data:image/png;base64,${bgn}",
    palen: "data:image/png;base64,${pln}",
    umum: "data:image/png;base64,${umm}"
  };

  window.getKukKopBase64 = function(unit) {
    const u = String(unit || "").toLowerCase();
    if (u.includes("palen")) return window.KUK_KOP_ASSETS.palen;
    if (u.includes("umum")) return window.KUK_KOP_ASSETS.umum;
    return window.KUK_KOP_ASSETS.bangunan;
  };
})();
`;

const dest = path.join(__dirname, '../shared/kop_assets.js');
fs.writeFileSync(dest, out, 'utf8');
console.log('Successfully generated shared/kop_assets.js, size:', fs.statSync(dest).size, 'bytes');
