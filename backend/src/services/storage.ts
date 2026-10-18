import { randomBytes } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { copyFile, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Response } from 'express';
import { env } from '../config/env';
import { notFound } from '../utils/errors';

/**
 * Two areas under STORAGE_DIR:
 *   public/   served as-is at /media/* (covers, course images, doctor photos, event images, QR)
 *   private/  never served directly: book PDFs, payment screenshots, doctor CVs. Streamed by
 *             routes that check access first.
 * Stored values are keys relative to the area, e.g. "books/cover_ab12.png".
 */
export const PUBLIC_DIR = path.join(env.STORAGE_DIR, 'public');
export const PRIVATE_DIR = path.join(env.STORAGE_DIR, 'private');
export const MEDIA_URL = '/media';

export type StorageArea = 'public' | 'private';

const areaDir = (area: StorageArea) => (area === 'public' ? PUBLIC_DIR : PRIVATE_DIR);

/** Resolves a key inside its area; rejects keys that escape it ("../"). */
export function resolveKey(area: StorageArea, key: string): string {
  const base = areaDir(area);
  const full = path.resolve(base, key);
  if (!full.startsWith(base + path.sep)) throw notFound('File not found');
  return full;
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

/** Saves an uploaded buffer under `<area>/<folder>/` with a random name; returns the key. */
export async function saveUpload(
  area: StorageArea,
  folder: string,
  file: { buffer: Buffer; mimetype: string; originalname: string },
  prefix = 'file',
): Promise<string> {
  const ext = EXT_BY_MIME[file.mimetype] ?? path.extname(file.originalname).toLowerCase().slice(0, 6);
  const key = `${folder}/${prefix}_${Date.now().toString(36)}${randomBytes(6).toString('hex')}${ext}`;
  const full = resolveKey(area, key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, file.buffer);
  return key;
}

/** Copies a file from disk into storage (seed/migration). Returns the key, or null if the source is missing. */
export async function importFile(area: StorageArea, key: string, source: string): Promise<string | null> {
  if (!existsSync(source)) return null;
  const full = resolveKey(area, key);
  await mkdir(path.dirname(full), { recursive: true });
  await copyFile(source, full);
  return key;
}

export async function deleteStored(area: StorageArea, key: string | null | undefined): Promise<void> {
  if (!key) return;
  try {
    await rm(resolveKey(area, key), { force: true });
  } catch {
    // a missing file is not an error
  }
}

/** Public URL of a public-area key; legacy absolute paths (/Books/..., /Courses/...) pass through. */
export function publicUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith('/') || /^https?:/i.test(key)) return key;
  return `${MEDIA_URL}/${key}`;
}

const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/** Streams a private file. `download` sets an attachment filename; otherwise it opens inline. */
export async function sendPrivateFile(
  res: Response,
  key: string | null | undefined,
  { download, filename }: { download?: boolean; filename?: string } = {},
): Promise<void> {
  if (!key) throw notFound('File not found');
  const full = resolveKey('private', key);
  const info = await stat(full).catch(() => null);
  if (!info?.isFile()) throw notFound('File not found');
  const ext = path.extname(full).toLowerCase();
  const name = (filename ?? path.basename(full)).replace(/["\r\n]/g, '');
  res.setHeader('Content-Type', MIME_BY_EXT[ext] ?? 'application/octet-stream');
  res.setHeader('Content-Length', info.size);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader(
    'Content-Disposition',
    `${download ? 'attachment' : 'inline'}; filename="${encodeURIComponent(name)}"; filename*=UTF-8''${encodeURIComponent(name)}`,
  );
  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(full);
    stream.on('error', reject);
    stream.on('end', resolve);
    stream.pipe(res);
  });
}
