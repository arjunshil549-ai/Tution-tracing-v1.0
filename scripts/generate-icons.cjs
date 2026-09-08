const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generate() {
  const svgPath = path.resolve(__dirname, '../public/icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  console.log('Generating PWA icons...');

  // 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.resolve(__dirname, '../public/pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.resolve(__dirname, '../public/pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // apple-touch-icon 180x180 PNG
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.resolve(__dirname, '../public/apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // favicon.ico (64x64 PNG format or ico)
  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.resolve(__dirname, '../public/favicon.ico'));
  console.log('Generated favicon.ico');

  // Maskable 512x512:
  // Must have 15% safe zone padding around all sides so outer edges are not clipped on Android.
  // Inner image scaled to 70% (358x358) and composited centered over a 512x512 #090d16 background.
  const innerIcon = await sharp(svgBuffer)
    .resize(360, 360)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 9, g: 13, b: 22, alpha: 1 },
    },
  })
    .composite([
      {
        input: innerIcon,
        gravity: 'centre',
      },
    ])
    .png()
    .toFile(path.resolve(__dirname, '../public/pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  console.log('All PWA icons successfully generated!');
}

generate().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
