import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import courses from '../src/scripts/seed-data/courses.json';
import { formatRupees, originalPrice, previewByBytes } from '../src/shared/utils/text';

const reference = (file: string) => readFileSync(resolve(__dirname, '../../reference/live-html', file));
/** Live HTML bytes as latin1 so partial UTF-8 sequences compare byte-for-byte. */
const latin1 = (s: string) => Buffer.from(s, 'utf8').toString('latin1');

describe('previewByBytes (live PHP substr previews, without broken characters)', () => {
  const home = reference('index.html').toString('latin1');
  const catalogue = reference('courses.html').toString('latin1');

  it.each(courses.map((c) => [c.slug, c.description] as const))('%s matches the live home (80 B) and courses (100 B) text', (_slug, description) => {
    const homePreview = previewByBytes(description, 80);
    const listPreview = previewByBytes(description, 100);
    // Live text = our text + possibly one half-cut character before "...".
    expect(home).toContain(latin1(homePreview.slice(0, -3)));
    expect(catalogue).toContain(latin1(listPreview.slice(0, -3)));
    expect(new TextEncoder().encode(homePreview.slice(0, -3)).length).toBeLessThanOrEqual(80);
  });

  it('never splits a character and always appends "..."', () => {
    expect(previewByBytes('एक ऐसा', 5)).toBe('ए...'); // 'ए' (3 B) fits, 'क' would make 6 B
    expect(previewByBytes('एक ऐसा', 2)).toBe('...');
    expect(previewByBytes('आध्यात्मिक उन्नति', 80)).toBe('आध्यात्मिक उन्नति...');
  });
});

describe('prices', () => {
  it('reproduces the live original prices (40% off)', () => {
    expect(formatRupees(originalPrice(49_900, 40), false)).toBe('₹831');
    expect(formatRupees(originalPrice(19_900, 40), false)).toBe('₹331');
    expect(formatRupees(originalPrice(1_900, 40), false)).toBe('₹31');
    expect(formatRupees(49_900)).toBe('₹499.00');
  });
});
