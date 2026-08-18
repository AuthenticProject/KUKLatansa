const fs = require('fs');

const filesToPatch = [
    "absen.html",
    "cuti.html",
    "pelanggaran.html",
    "dashboard/index.html",
    "tip.html",
    "peminjaman.html",
    "peminjaman_admin.html",
    "karyawan.html",
    "users.html",
    "index.html"
];

filesToPatch.forEach(file => {
    if (!fs.existsSync(file)) return;
    
    let content = fs.readFileSync(file, 'utf8');

    const prefix = file.includes('/') ? '../' : '';
    const masterDbLink = `  <script src="${prefix}shared/master_db.js"></script>`;
    
    // Check if already injected
    if (!content.includes(masterDbLink.trim())) {
        // Find shell.js and inject right before it
        const shellJsRegex = new RegExp(`[ \\t]*<script src="${prefix}shared/shell.js"`);
        if (shellJsRegex.test(content)) {
            content = content.replace(shellJsRegex, `${masterDbLink}\n$&`);
        } else {
            // fallback inject before </body>
            const lastBodyIdx = content.lastIndexOf('</body>');
            if (lastBodyIdx !== -1) {
                content = content.substring(0, lastBodyIdx) + `${masterDbLink}\n` + content.substring(lastBodyIdx);
            }
        }
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Injected master_db.js into ${file}`);
    }
});
