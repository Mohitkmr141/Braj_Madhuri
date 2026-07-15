const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function makeCircular() {
  const inputPath = path.join(__dirname, 'public', 'Logo.jpeg');
  const outputPath = path.join(__dirname, 'public', 'favicon.png');

  if (!fs.existsSync(inputPath)) {
    console.error('Logo.jpeg not found in public folder.');
    process.exit(1);
  }

  // get image dimensions
  const metadata = await sharp(inputPath).metadata();
  const size = Math.min(metadata.width, metadata.height);
  const r = size / 2;

  // create a circular SVG mask
  const circleSvg = Buffer.from(
    `<svg width="${size}" height="${size}">
      <circle cx="${r}" cy="${r}" r="${r}" fill="white" />
    </svg>`
  );

  await sharp(inputPath)
    .resize(size, size)
    .composite([{ input: circleSvg, blend: 'dest-in' }])
    .png()
    .toFile(outputPath);
  
  console.log('Circular favicon created successfully!');
}

makeCircular().catch(err => {
  console.error('Error:', err);
});
