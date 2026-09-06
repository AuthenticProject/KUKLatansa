const fs = require('fs');
const path = require('path');

function getFiles(dir, exts) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === 'node_modules' || file === '.git' || file === '.temp_node' || file === '.temp_node_2') return;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath, exts));
    } else if (exts.some(ext => file.endsWith(ext))) {
      results.push(fullPath);
    }
  });
  return results;
}

// Load all functions defined in shared js files
const sharedFiles = getFiles('./shared', ['.js']);
let sharedContent = '';
sharedFiles.forEach(f => {
  sharedContent += '\n' + fs.readFileSync(f, 'utf8');
});
if (fs.existsSync('peminjaman_db.js')) sharedContent += '\n' + fs.readFileSync('peminjaman_db.js', 'utf8');
if (fs.existsSync('karyawan_db.js')) sharedContent += '\n' + fs.readFileSync('karyawan_db.js', 'utf8');

const htmlFiles = getFiles('.', ['.html']);

let issuesCount = 0;

htmlFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract all script content in this HTML
  let localScripts = '';
  const scriptRegex = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
  let sm;
  while ((sm = scriptRegex.exec(content)) !== null) {
    localScripts += '\n' + sm[1];
  }
  
  const allAvailableCode = localScripts + '\n' + sharedContent;

  // Find all inline handlers e.g. onclick="funcName(...)"
  const handlerRegex = /\b(on(?:click|change|submit|input|blur|focus|keyup|keydown|load))\s*=\s*["']([^"']+)["']/gi;
  let hm;
  while ((hm = handlerRegex.exec(content)) !== null) {
    const handlerType = hm[1];
    const expr = hm[2].trim();
    
    // Extract function calls like `foo()` or `foo.bar()`
    const funcCallRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)\s*\(/g;
    let fm;
    while ((fm = funcCallRegex.exec(expr)) !== null) {
      const fullFuncName = fm[1];
      const baseFunc = fullFuncName.split('.')[0];
      
      // Ignore standard JS built-ins
      const builtins = ['alert', 'confirm', 'prompt', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'console', 'document', 'window', 'event', 'Date', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'RegExp', 'encodeURIComponent', 'decodeURIComponent', 'setTimeout', 'clearTimeout', 'sessionStorage', 'localStorage'];
      if (builtins.includes(baseFunc)) continue;
      
      // Check if baseFunc is declared in allAvailableCode
      // Check: function baseFunc, var/let/const baseFunc, baseFunc =
      const pattern = new RegExp(`\\b(?:function\\s+${baseFunc}\\b|var\\s+${baseFunc}\\b|let\\s+${baseFunc}\\b|const\\s+${baseFunc}\\b|class\\s+${baseFunc}\\b|window\\.${baseFunc}\\b|${baseFunc}\\s*:)`);
      if (!pattern.test(allAvailableCode)) {
        console.warn(`[WARNING] Potential undefined handler in ${filePath}: ${handlerType}="${expr}" -> '${fullFuncName}' not found!`);
        issuesCount++;
      }
    }
  }
});

console.log(`\nScan finished. Total potential handler issues flagged: ${issuesCount}`);
