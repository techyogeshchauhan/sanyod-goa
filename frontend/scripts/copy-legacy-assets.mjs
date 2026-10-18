// Copies public assets from the PHP site (read-only) into frontend/public.
// File names with spaces are renamed (spaces → "-"); the mapping is written to public/asset-map.json.
// Usage: node scripts/copy-legacy-assets.mjs [folder ...]   (default: images img)
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const LEGACY_ROOT = resolve(here, '../../..'); // D:\sanyod.in
const PUBLIC_DIR = resolve(here, '../public');
const SKIP = new Set(['Thumbs.db', 'clock.zip']);
const PRIVATE = [/^Books_pdf\//, /^uploads\/payments\//];

const folders = process.argv.slice(2).length ? process.argv.slice(2) : ['images', 'img'];
const mapFile = join(PUBLIC_DIR, 'asset-map.json');
const map = existsSync(mapFile) ? JSON.parse(readFileSync(mapFile, 'utf8')) : {};

function copyDir(rel) {
  if (PRIVATE.some((re) => re.test(`${rel}/`))) throw new Error(`Refusing to copy private folder ${rel}`);
  const src = join(LEGACY_ROOT, rel);
  for (const name of readdirSync(src)) {
    if (SKIP.has(name)) continue;
    const from = join(src, name);
    const relPath = `${rel}/${name}`;
    if (statSync(from).isDirectory()) {
      copyDir(relPath);
      continue;
    }
    const cleanName = name.replace(/\s+/g, '-');
    const to = join(PUBLIC_DIR, rel, cleanName);
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
    if (cleanName !== name) map[`/${relPath}`] = `/${rel}/${cleanName}`;
  }
}

for (const folder of folders) copyDir(folder.replace(/\\/g, '/').replace(/\/$/, ''));
writeFileSync(mapFile, `${JSON.stringify(map, null, 2)}\n`);
console.log(`Copied ${folders.join(', ')} → ${relative(process.cwd(), PUBLIC_DIR)} (${Object.keys(map).length} renamed files mapped)`);
