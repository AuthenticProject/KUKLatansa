const fs = require('fs');

const filesToFix = [
    "karyawan.html",
    "peminjaman.html",
    "peminjaman_admin.html",
    "dashboard/index.html"
];

filesToFix.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    const prefix = file.includes('/') ? '../' : '';
    const baseDir = file.includes('/') ? '..' : '.';
    const scriptStr = `<script src="${prefix}shared/shell.js" data-base="${baseDir}"></script>`;
    
    // Remove all incorrect occurrences
    // The previous script might have inserted: `  <script src="..." data-base="..."></script>\n</body>`
    // Let's just remove the script tag completely wherever it is.
    const regex = new RegExp(`[ \\t]*<script src="${prefix}shared/shell.js" data-base="${baseDir}"></script>\\r?\\n?`, 'g');
    content = content.replace(regex, '');
    
    // Also remove the css links from wrong places if any? No, css links replace `<style>`, which is usually correct in the head. Let's just check the end of the file for </body>
    
    // Add correctly right before the last </body>
    const lastBodyIdx = content.lastIndexOf('</body>');
    if (lastBodyIdx !== -1) {
        content = content.substring(0, lastBodyIdx) + `  ${scriptStr}\n` + content.substring(lastBodyIdx);
    } else {
        // If no body tag found at all (unlikely), just append
        content += `\n  ${scriptStr}\n`;
    }
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed ${file}`);
});
