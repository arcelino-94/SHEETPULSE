import sharp from 'sharp';
import fs from 'node:fs';

async function generateIcons() {
  const svgBuffer = fs.readFileSync('public/icon.svg');

  // 192x192 standard icon
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/pwa-192x192.png');
  console.log('Created pwa-192x192.png');

  // 512x512 standard icon
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-512x512.png');
  console.log('Created pwa-512x512.png');

  // 180x180 apple touch icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('Created apple-touch-icon.png');

  // 512x512 maskable icon with 15% safe padding
  const paddedSize = Math.round(512 * 0.76); // ~389px inside 512px
  const innerIcon = await sharp(svgBuffer)
    .resize(paddedSize, paddedSize)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 }, // #0f172a brand dark
    },
  })
    .composite([
      {
        input: innerIcon,
        gravity: 'center',
      },
    ])
    .png()
    .toFile('public/pwa-maskable-512x512.png');
  console.log('Created pwa-maskable-512x512.png');
}

generateIcons().catch(console.error);
