const fs = require('fs');
const path = require('path');
const convert = require('./node_modules/heic-convert');
const sharp = require('./node_modules/sharp');

(async () => {
  const buf = fs.readFileSync('FOTO/ANDIKA.HEIC');
  const raw = await convert({ buffer: buf, format: 'JPEG' });

  // Test 1: sharp attention (saliency / face focus)
  const t1 = await sharp(raw)
    .rotate()
    .resize(400, 400, { fit: 'cover', position: sharp.strategy.attention })
    .jpeg({ quality: 85 })
    .toBuffer();
  fs.writeFileSync('scratch/andika_attention.jpg', t1);

  // Test 2: Zoomed in 1.8x, upper chest / face focus
  // Original: 4284 x 5712.
  // We extract a square of width 2400 x 2400 from top=400, left=(4284-2400)/2 = 942
  const t2 = await sharp(raw)
    .rotate()
    .extract({ left: 942, top: 400, width: 2400, height: 2400 })
    .resize(400, 400)
    .jpeg({ quality: 85 })
    .toBuffer();
  fs.writeFileSync('scratch/andika_crop_2400.jpg', t2);

  // Test 3: Zoomed in 2.2x (tighter 1/4 badan)
  // Extract square of 1900 x 1900 from top=300, left=(4284-1900)/2 = 1192
  const t3 = await sharp(raw)
    .rotate()
    .extract({ left: 1192, top: 350, width: 1900, height: 1900 })
    .resize(400, 400)
    .jpeg({ quality: 85 })
    .toBuffer();
  fs.writeFileSync('scratch/andika_crop_1900.jpg', t3);

  // Test 4: position 'top' with resize(400, 400, { fit: 'cover', position: 'top' })
  const t4 = await sharp(raw)
    .rotate()
    .resize(400, 400, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 85 })
    .toBuffer();
  fs.writeFileSync('scratch/andika_top.jpg', t4);

  console.log('Generated test images in scratch/!');
})();
