// Captures "live" vs replica screenshots for visual comparison.
// Usage: node scripts/screenshot-compare.mjs <live> <replicaPath> [name] [width]
//   <live> = a live path (/login.php, fetched read-only from http://sanyod.in)
//          | ref:<file> (a capture in ../reference/live-html, rendered with the PHP site's local assets)
//   e.g. node scripts/screenshot-compare.mjs ref:login.html /login login 1440
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const [live = 'ref:login.html', replicaPath = '/login', name = 'page', width = '1440'] = process.argv.slice(2);
const LIVE = process.env.LIVE_URL ?? 'http://sanyod.in';
const REPLICA = process.env.REPLICA_URL ?? 'http://localhost:5173';
const REFERENCE_DIR = new URL('../../reference/live-html/', import.meta.url);
const LEGACY_ROOT = new URL('../../../', import.meta.url).href; // D:\sanyod.in\ (read-only assets)
const OUT = new URL('../tests/visual/__screens__/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: Number(width), height: 900 } });
// The live host's bot check expects this cookie (see docs/04 § 2).
await context.addCookies([{ name: 'humans_21909', value: '1', domain: 'sanyod.in', path: '/' }]);

// STABLE=1: freeze animations and hide random/dynamic layers on both sides so pixels are comparable.
const STABLE_CSS = `
  *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
  #color-particles, #divine-particles, #dynamic-books, #dynamic-diyas, #dynamic-guidance,
  .color-particle, .divine-particle, .floating-diya, .dynamic-book, .floating-guidance-symbol { display: none !important; }
  [style*="opacity: 0"] { opacity: 1 !important; }
  [style*="translateY(30px)"] { transform: none !important; }
  #typing1, #typing2, iframe, video { visibility: hidden !important; }
`;

async function capture(label, open) {
  const page = await context.newPage();
  await open(page);
  if (process.env.STABLE) await page.addStyleTag({ content: STABLE_CSS });
  await page.waitForTimeout(1500); // footer link fade-in animations
  const file = fileURLToPath(new URL(`${name}-${width}-${label}.png`, OUT));
  await page.screenshot({ path: file, fullPage: true });
  console.log(`${label} → ${file}`);
  await page.close();
}

await capture('live', async (page) => {
  if (live.startsWith('ref:')) {
    const html = readFileSync(new URL(live.slice(4), REFERENCE_DIR), 'utf8');
    // Resolve relative assets (css/, images/, img/) against the local PHP site folder.
    const tmp = fileURLToPath(new URL(`_ref-${name}.html`, OUT));
    writeFileSync(tmp, html.replace(/<head>/i, `<head><base href="${LEGACY_ROOT}">`));
    await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle', timeout: 60_000 });
  } else {
    await page.goto(`${LIVE}${live}`, { waitUntil: 'networkidle', timeout: 60_000 });
  }
});
await capture('replica', (page) => page.goto(`${REPLICA}${replicaPath}`, { waitUntil: 'networkidle', timeout: 60_000 }));
await browser.close();
