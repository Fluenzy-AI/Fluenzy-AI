/**
 * generate-pwa-icons.js
 * Run once: node scripts/generate-pwa-icons.js
 * Requires: npm install sharp (already included by Next.js)
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = path.join(__dirname, '../public/image/final_logo-removebg-preview.png');
const OUT_DIR = path.join(__dirname, '../public/image');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

(async () => {
  if (!fs.existsSync(SRC)) {
    console.error('Source icon not found:', SRC);
    process.exit(1);
  }

  for (const size of sizes) {
    const out = path.join(OUT_DIR, `icon-${size}.png`);
    await sharp(SRC)
      .resize(size, size, { fit: 'contain', background: { r: 9, g: 14, b: 26, alpha: 1 } })
      .png()
      .toFile(out);
    console.log(`✓ Generated ${out}`);
  }
  console.log('\nAll PWA icons generated successfully!');
})();
