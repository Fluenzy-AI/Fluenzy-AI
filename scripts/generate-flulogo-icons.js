const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const srcPath = path.join(process.cwd(), 'public/image/FluLogo.jpg');
const outDir = path.join(process.cwd(), 'public/image');

const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 192, name: 'icon-192-flulogo.png' },
  { size: 512, name: 'icon-512-flulogo.png' }
];

(async () => {
  if (!fs.existsSync(srcPath)) {
    console.error('Source image not found:', srcPath);
    process.exit(1);
  }

  for (const {size, name} of sizes) {
    const out = path.join(outDir, name);
    await sharp(srcPath)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .png()
      .toFile(out);
    console.log(`Generated ${name} (${size}x${size})`);
  }
  console.log('All icons generated successfully!');
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
