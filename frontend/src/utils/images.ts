// Web-sized copies of the images in public/ (made by `npm run images`, see scripts/optimize-images.mjs).
import manifest from '@/generated/image-manifest.json';

const MAP = manifest as Record<string, 0 | 1>;

/** The web-sized WebP copy of a public image, or the image itself when there is none. */
export function optimizedSrc(src: string): string {
  return MAP[src] === 1 ? `/_img${src}.webp` : src;
}

/** A tiny copy for blurred backdrops; null when there is none (the caller falls back to the image). */
export function thumbSrc(src: string): string | null {
  return src in MAP ? `/_img${src}.thumb.webp` : null;
}
