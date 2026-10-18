import { Router } from 'express';
import { getSettings, type SettingsDoc } from '../../models/Settings';
import type { PublicSettings } from '../../shared/types/catalog';
import { publicUrl } from '../../services/storage';
import { asyncHandler } from '../../utils/asyncHandler';

export const settingsRouter = Router();

export function toPublicSettings(s: SettingsDoc): PublicSettings {
  return {
    upiIdDefault: s.upiIdDefault ?? '',
    upiIdPdf: s.upiIdPdf ?? '',
    upiIdHardcopy: s.upiIdHardcopy ?? '',
    qrImageBooks: publicUrl(s.qrImageBooks) ?? '/Books/QR.jpg',
    qrImageCourses: publicUrl(s.qrImageCourses) ?? '/images/Qr.png',
    contactEmail: s.contactEmail ?? '',
    contactPhone: s.contactPhone ?? '',
  };
}

/** UPI IDs and QR images shown on the payment screens. */
settingsRouter.get(
  '/public',
  asyncHandler(async (_req, res) => {
    res.json({ data: toPublicSettings(await getSettings()) });
  }),
);
