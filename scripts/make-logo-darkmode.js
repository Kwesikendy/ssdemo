/**
 * make-logo-darkmode.js
 * Converts the logo for use on dark backgrounds:
 *   - Very dark pixels (the navy S and text) → white
 *   - Mid-dark pixels → lightened proportionally
 *   - Teal/cyan pixels → preserved as-is
 *   - Transparent → kept transparent
 */
const sharp = require('sharp');
const path = require('path');

async function run() {
  const inputPath = path.join(__dirname, '..', 'public', 'logo-transparent.png');
  const outputPath = path.join(__dirname, '..', 'public', 'logo-dark-mode.png');

  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const pixels = new Uint8Array(data);

  for (let i = 0; i < pixels.length; i += channels) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    if (a < 10) continue; // skip fully transparent

    // Perceived luminance
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Detect teal/cyan: blue-dominant, relatively bright
    const isTeal = b > r && b > 100 && g > r;

    if (!isTeal && lum < 80) {
      // Very dark non-teal → white
      pixels[i]     = 255;
      pixels[i + 1] = 255;
      pixels[i + 2] = 255;
    } else if (!isTeal && lum < 160) {
      // Mid-dark non-teal → lerp toward white
      const t = (160 - lum) / 160;
      pixels[i]     = Math.round(r + t * (255 - r));
      pixels[i + 1] = Math.round(g + t * (255 - g));
      pixels[i + 2] = Math.round(b + t * (255 - b));
    }
    // else: teal pixels and bright pixels stay as-is
  }

  await sharp(Buffer.from(pixels), {
    raw: { width, height, channels },
  })
    .png()
    .toFile(outputPath);

  console.log('✅  Dark-mode logo saved to:', outputPath);
}

run().catch((err) => { console.error(err); process.exit(1); });
