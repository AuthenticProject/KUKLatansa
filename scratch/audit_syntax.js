const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

const jsFiles = getFiles('.', ['.js']);
console.log(`Found ${jsFiles.length} JS files.`);

let jsErrors = 0;
jsFiles.forEach(f => {
  try {
    execSync(`node -c "${f}"`, { stdio: 'pipe' });
  } catch (err) {
    console.error(`SYNTAX ERROR in ${f}:\n${err.stderr ? err.stderr.toString() : err.message}`);
    jsErrors++;
  }
});

if (jsErrors === 0) {
  console.log('ALL JS files passed syntax check! ✅');
} else {
  console.error(`${jsErrors} JS files have syntax errors!`);
}

// Now check script tags inside all HTML files
const htmlFiles = getFiles('.', ['.html']);
console.log(`\nFound ${htmlFiles.length} HTML files to inspect.`);
let htmlErrors = 0;

htmlFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  // extract all <script>...</script> (ignoring external scripts <script src=...>)
  const scriptRegex = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let scriptIndex = 0;
  while ((match = scriptRegex.exec(content)) !== null) {
    scriptIndex++;
    const code = match[1].trim();
    if (!code) continue;
    // write to temp file to run node -c
    const tempFile = path.join(__dirname, `_temp_${path.basename(f)}_${scriptIndex}.js`);
    fs.writeFileSync(tempFile, code, 'utf8');
    try {
      execSync(`node -c "${tempFile}"`, { stdio: 'pipe' });
    } catch (err) {
      console.error(`SYNTAX ERROR in HTML inline script ${f} (script #${scriptIndex}):\n${err.stderr ? err.stderr.toString() : err.message}`);
      htmlErrors++;
    } finally {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  }
});

if (htmlErrors === 0) {
  console.log('ALL HTML inline scripts passed syntax check! ✅');
} else {
  console.error(`${htmlErrors} HTML inline scripts have syntax errors!`);
}
