import multer from 'multer';
import type { Request, RequestHandler } from 'express';
import { env } from '../config/env';
import { badRequest } from '../utils/errors';

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const PDF_TYPES = ['application/pdf'];
export const CV_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MB = 1024 * 1024;

interface FieldRule {
  name: string;
  types: string[];
  maxMb: number;
}

/**
 * Multipart parser that keeps files in memory (they are small) and checks each field's
 * type and size. Files are written to storage by the route, after validation succeeds.
 */
export function uploadFields(rules: FieldRule[]): RequestHandler {
  const byName = new Map(rules.map((r) => [r.name, r]));
  const parser = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: Math.max(...rules.map((r) => r.maxMb)) * MB, files: rules.length, fields: 40 },
    fileFilter: (_req, file, cb) => {
      const rule = byName.get(file.fieldname);
      if (!rule) return cb(badRequest(`Unexpected file field "${file.fieldname}"`));
      if (!rule.types.includes(file.mimetype)) {
        const kind = rule.types === IMAGE_TYPES ? 'JPG, PNG, GIF or WEBP image' : rule.types === PDF_TYPES ? 'PDF file' : 'PDF or Word file';
        return cb(badRequest(`Please upload a ${kind}`, { [file.fieldname]: `Please upload a ${kind}` }));
      }
      cb(null, true);
    },
  }).fields(rules.map((r) => ({ name: r.name, maxCount: 1 })));

  return (req, res, next) => {
    parser(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        const field = err.field ?? 'file';
        const message =
          err.code === 'LIMIT_FILE_SIZE'
            ? `File is too large (max ${byName.get(field)?.maxMb ?? env.MAX_IMAGE_UPLOAD_MB} MB)`
            : 'Invalid file upload';
        return next(badRequest(message, { [field]: message }));
      }
      if (err) return next(err);
      // Per-field size limits (multer only has one global limit).
      const files = (req.files ?? {}) as Record<string, Express.Multer.File[]>;
      for (const [name, list] of Object.entries(files)) {
        const rule = byName.get(name);
        const file = list[0];
        if (rule && file && file.size > rule.maxMb * MB) {
          const message = `File is too large (max ${rule.maxMb} MB)`;
          return next(badRequest(message, { [name]: message }));
        }
      }
      next();
    });
  };
}

/** The single uploaded file of a field, if any. */
export function uploadedFile(req: Request, field: string): Express.Multer.File | undefined {
  const files = (req.files ?? {}) as Record<string, Express.Multer.File[]>;
  return files[field]?.[0];
}

export const imageField = (name: string): FieldRule => ({ name, types: IMAGE_TYPES, maxMb: env.MAX_IMAGE_UPLOAD_MB });
export const pdfField = (name: string): FieldRule => ({ name, types: PDF_TYPES, maxMb: env.MAX_PDF_UPLOAD_MB });
export const cvField = (name: string): FieldRule => ({ name, types: CV_TYPES, maxMb: env.MAX_PDF_UPLOAD_MB });
