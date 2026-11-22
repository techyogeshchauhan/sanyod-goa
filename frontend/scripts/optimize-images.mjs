/**
 * Image optimizer: writes web-sized WebP copies of the images in public/ and a manifest the app
 * uses to pick them. Originals are never changed; copies go to public/_img/ (same folder layout).
 *
 *   public/Courses/x.png  →  public/_img/Courses/x.png.webp        (≤ 1400 × 1600, for <img>)
 *                         →  public/_img/Courses/x.png.thumb.webp  (32 px wide, for the blurred backdrop)
 *
 * Manifest (src/generated/image-manifest.json): { "/Courses/x.png": 1 } — 1 when the WebP copy is
 * used, 0 when the original is already smaller (then only the thumbnail is used).
 *
 * Images not in the manifest (e.g. uploads added later in the admin, served from /media) are shown
 * as they are. Run again after adding images to public/:  npm run images
 */
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PUBLIC = join(ROOT, 'public');
const OUT = join(PUBLIC, '_img');
const MANIFEST = join(ROOT, 'src', 'generated', 'image-manifest.json');
const FOLDERS = ['Books', 'Courses', 'images', 'uploads'];
const EXT = new Set(['.jpg', '.jpeg', '.png']);

/** Display-size overrides (the logo is shown about 46 px high). */
const SIZES = {
  '/images/WhatsApp-Image-2026-01-20-at-10.04.38-AM-Photoroom.png': { width: 400, height: 200 },
};
const DEFAULT_SIZE = { width: 1400, height: 1600 };

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (EXT.has(extname(e.name).toLowerCase())) yield p;
  }
}

const isFresh = async (out, srcMtime) => {
  try {
    return (await stat(out)).mtimeMs >= srcMtime;
  } catch {
    return false;
  }
};

const manifest = {};
let made = 0;
let before = 0;
let after = 0;

for (const folder of FOLDERS) {
  for await (const file of walk(join(PUBLIC, folder))) {
    const rel = relative(PUBLIC, file).split(sep).join(posix.sep);
    const url = `/${rel}`;
    const outMain = join(OUT, `${rel}.webp`);
    const outThumb = join(OUT, `${rel}.thumb.webp`);
    const src = await stat(file);
    await mkdir(dirname(outMain), { recursive: true });

    if (!(await isFresh(outMain, src.mtimeMs)) || !(await isFresh(outThumb, src.mtimeMs))) {
      const { width, height } = SIZES[url] ?? DEFAULT_SIZE;
      await sharp(file).rotate().resize({ width, height, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78, effort: 5 }).toFile(outMain);
      await sharp(file).rotate().resize({ width: 32 }).webp({ quality: 50 }).toFile(outThumb);
      made++;
    }

    const optimized = await stat(outMain);
    // 1: use /_img/<path>.webp; 0: the original is already smaller (only the thumbnail is used).
    const useWebp = optimized.size < src.size;
    manifest[url] = useWebp ? 1 : 0;
    before += src.size;
    after += useWebp ? optimized.size : src.size;
  }
}

await mkdir(dirname(MANIFEST), { recursive: true });
const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(MANIFEST, `${JSON.stringify(sorted, null, 0)}\n`);
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;
console.log(`${Object.keys(manifest).length} images (${made} converted now): ${mb(before)} → ${mb(after)}`);
