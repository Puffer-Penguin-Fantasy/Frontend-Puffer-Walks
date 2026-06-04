import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assets = path.resolve(__dirname, '../src/assets');

const jobs = [
  // Background images: full resolution, WebP quality 80
  {
    input: `${assets}/Backgrounddesktop.png`,
    output: `${assets}/Backgrounddesktop.webp`,
    opts: { width: 1920, fit: 'inside', withoutEnlargement: true },
    quality: 80,
  },
  {
    input: `${assets}/Backgroundmobile.png`,
    output: `${assets}/Backgroundmobile.webp`,
    opts: { width: 768, fit: 'inside', withoutEnlargement: true },
    quality: 80,
  },
  // Token logo: resize to 64x64 (displayed at 12x12, but 64 keeps retina sharp)
  {
    input: `${assets}/movement-testnet-token.png`,
    output: `${assets}/movement-testnet-token.webp`,
    opts: { width: 64, height: 64, fit: 'cover' },
    quality: 85,
  },
  // PFP frame: resize to 120x120 (displayed at 42x42, ~3x for retina)
  {
    input: `${assets}/gameframe/pfpframe.png`,
    output: `${assets}/gameframe/pfpframe.webp`,
    opts: { width: 120, height: 120, fit: 'cover' },
    quality: 90,
  },
  // Button image
  {
    input: `${assets}/gameframe/button.png`,
    output: `${assets}/gameframe/button.webp`,
    opts: { width: 400, fit: 'inside', withoutEnlargement: true },
    quality: 85,
  },
  // User avatar
  {
    input: `${assets}/user-avatar.png`,
    output: `${assets}/user-avatar.webp`,
    opts: { width: 200, height: 200, fit: 'cover' },
    quality: 85,
  },
];

for (const job of jobs) {
  const s = sharp(job.input).resize(job.opts).webp({ quality: job.quality });
  await s.toFile(job.output);
  const { size: inSize } = await sharp(job.input).metadata();
  const outInfo = await sharp(job.output).metadata();
  console.log(`✓ ${path.basename(job.input)} → ${path.basename(job.output)}  (saved ~${Math.round((1 - outInfo.size / (inSize ?? 1)) * 100)}%)`);
}

console.log('\nDone. Update your imports to use .webp files.');
