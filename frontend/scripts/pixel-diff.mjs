// Pixel difference between two screenshots: node scripts/pixel-diff.mjs <a.png> <b.png> [diff.png]
import { readFileSync, writeFileSync } from 'node:fs';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const [a, b, out] = process.argv.slice(2);
const imgA = PNG.sync.read(readFileSync(a));
const imgB = PNG.sync.read(readFileSync(b));
const width = Math.min(imgA.width, imgB.width);
const height = Math.min(imgA.height, imgB.height);
const crop = (img) => {
  const c = new PNG({ width, height });
  PNG.bitblt(img, c, 0, 0, width, height, 0, 0);
  return c;
};
const diff = new PNG({ width, height });
const changed = pixelmatch(crop(imgA).data, crop(imgB).data, diff.data, width, height, { threshold: 0.1 });
if (out) writeFileSync(out, PNG.sync.write(diff));
const pct = ((changed / (width * height)) * 100).toFixed(3);
console.log(`size A ${imgA.width}x${imgA.height}, B ${imgB.width}x${imgB.height}; differing pixels: ${changed} (${pct}%)`);
