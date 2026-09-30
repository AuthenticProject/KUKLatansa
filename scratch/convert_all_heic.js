const fs = require('fs');
const path = require('path');
const convert = require('./node_modules/heic-convert');
const sharp = require('./node_modules/sharp');

const fotoDir = path.join(__dirname, '../FOTO');
const outAssetsDir = path.join(__dirname, '../assets/foto_staf');

if (!fs.existsSync(outAssetsDir)) {
  fs.mkdirSync(outAssetsDir, { recursive: true });
}

const files = fs.readdirSync(fotoDir).filter(f => f.toUpperCase().endsWith('.HEIC'));

(async () => {
  console.log(`Found ${files.length} HEIC files to process.`);
  const results = {};

  for (const f of files) {
    const username = f.replace(/\.heic$/i, '').toLowerCase();
    const inputPath = path.join(fotoDir, f);
    console.log(`Processing ${f} -> username: ${username}...`);

    try {
      const inputBuffer = fs.readFileSync(inputPath);
      const rawJpeg = await convert({
        buffer: inputBuffer,
        format: 'JPEG',
        quality: 0.95
      });

      // Resize and center-crop / top-crop face for avatar
      const resizedBuffer = await sharp(rawJpeg)
        .rotate() // auto-orient based on EXIF
        .resize(320, 320, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();

      // Save as JPG in FOTO/ and in assets/foto_staf/
      const outJpgName = `${username}.jpg`;
      fs.writeFileSync(path.join(fotoDir, outJpgName), resizedBuffer);
      fs.writeFileSync(path.join(outAssetsDir, outJpgName), resizedBuffer);

      // Also generate a data URI
      const base64DataUri = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
      results[username] = {
        size: resizedBuffer.length,
        dataUri: base64DataUri,
        path: `assets/foto_staf/${outJpgName}`
      };

      console.log(`✅ ${username}: ${resizedBuffer.length} bytes`);
    } catch (err) {
      console.error(`❌ Failed converting ${f}:`, err);
    }
  }

  // Generate shared/staff_photos.js
  let jsContent = `/* Staff Photos Asset Database - Auto-generated from FOTO/*.HEIC */\n(function() {\n  window.KUK_STAFF_PHOTOS = {\n`;
  for (const [user, data] of Object.entries(results)) {
    jsContent += `    "${user}": "${data.dataUri}",\n`;
  }
  jsContent += `  };\n\n`;
  jsContent += `  window.getStaffPhoto = function(username) {\n`;
  jsContent += `    if (!username) return null;\n`;
  jsContent += `    const u = String(username).toLowerCase().trim();\n`;
  jsContent += `    return window.KUK_STAFF_PHOTOS[u] || null;\n`;
  jsContent += `  };\n\n`;
  jsContent += `  // Auto-seed into localStorage if not already present\n`;
  jsContent += `  try {\n`;
  jsContent += `    for (const [user, dataUri] of Object.entries(window.KUK_STAFF_PHOTOS)) {\n`;
  jsContent += `      const key = 'kuk_user_photo_' + user;\n`;
  jsContent += `      if (!localStorage.getItem(key)) {\n`;
  jsContent += `        localStorage.setItem(key, dataUri);\n`;
  jsContent += `      }\n`;
  jsContent += `    }\n`;
  jsContent += `  } catch(e) {}\n`;
  jsContent += `})();\n`;

  const outJsPath = path.join(__dirname, '../shared/staff_photos.js');
  fs.writeFileSync(outJsPath, jsContent, 'utf8');
  console.log(`\n🎉 Generated ${outJsPath} successfully! Total staff photos: ${Object.keys(results).length}`);
})();
