const fs = require('fs');
const path = require('path');

const filesToPatch = [
    "cuti.html",
    "pelanggaran.html",
    "dashboard/index.html",
    "tip.html",
    "peminjaman.html",
    "peminjaman_admin.html",
    "karyawan.html",
    "users.html"
];

filesToPatch.forEach(file => {
    if (!fs.existsSync(file)) {
        console.log(`File not found: ${file}`);
        return;
    }
    
    let content = fs.readFileSync(file, 'utf8');

    const prefix = file.includes('/') ? '../' : '';
    const baseDir = file.includes('/') ? '..' : '.';
    
    const cssLinks = `  <link rel="stylesheet" href="${prefix}shared/design-tokens.css">\n  <link rel="stylesheet" href="${prefix}shared/shell.css">\n  <style>`;
    if (!content.includes(`<link rel="stylesheet" href="${prefix}shared/design-tokens.css">`)) {
        content = content.replace('<style>', cssLinks);
    }
        
    const jsLink = `  <script src="${prefix}shared/shell.js" data-base="${baseDir}"></script>\n</body>`;
    
    // Check if it's already there
    if (!content.includes(`src="${prefix}shared/shell.js"`)) {
        // Find the LAST occurrence of </body>
        const lastBodyIdx = content.lastIndexOf('</body>');
        if (lastBodyIdx !== -1) {
            content = content.substring(0, lastBodyIdx) + jsLink + content.substring(lastBodyIdx + 7);
        }
    }
        
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Patched ${file}`);
});
