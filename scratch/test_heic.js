const fs = require('fs');
const path = require('path');
const convert = require('./node_modules/heic-convert');

(async () => {
  try {
    const inputBuffer = fs.readFileSync(path.join(__dirname, '../FOTO/AGHEEA.HEIC'));
    const outputBuffer = await convert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 0.8
    });
    fs.writeFileSync(path.join(__dirname, 'AGHEEA.jpg'), outputBuffer);
    console.log('Converted successfully! Size:', outputBuffer.length, 'bytes');
  } catch (err) {
    console.error('Conversion error:', err);
  }
})();
