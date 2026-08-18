const fs = require('fs');

const file = 'karyawan.html';
let content = fs.readFileSync(file, 'utf8');

// The original karyawan.html has hardcoded dark blue tokens in :root
const oldStylesRegex = /:root\s*\{[^}]+\}/;
if (oldStylesRegex.test(content)) {
  const newRoot = `
    body {
      background-color: var(--kuk-bg);
      color: var(--kuk-text);
      min-height: 100vh;
      padding: 30px 20px 80px;
      position: relative;
      overflow-x: hidden;
      font-family: var(--kuk-font);
    }
    .panel {
      background: var(--kuk-surface);
      border: 1px solid var(--kuk-border);
      border-radius: var(--kuk-radius);
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      box-shadow: var(--kuk-shadow);
    }
    .btn-primary {
      background: var(--kuk-primary);
      color: #fff;
    }
    .btn-primary:hover { 
      background: #6b0000; 
      transform: translateY(-2px); 
    }
    .stat-card {
      background: var(--kuk-surface);
      border: 1px solid var(--kuk-border);
      border-radius: var(--kuk-radius);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: transform 0.2s;
    }
    .tab-btn.active {
      background: var(--kuk-surface);
      color: var(--kuk-primary);
      border-bottom: 3px solid var(--kuk-primary);
      border-radius: 0;
      box-shadow: none;
    }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 12px; border-bottom: 2px solid var(--kuk-border); text-align: left; color: var(--kuk-text-muted); font-size: 13px; text-transform: uppercase; }
    td { padding: 16px 12px; border-bottom: 1px solid var(--kuk-border); font-size: 14px; }
  `;
  
  content = content.replace(oldStylesRegex, newRoot);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully updated CSS tokens in karyawan.html');
}
