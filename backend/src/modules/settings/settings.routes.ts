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
    qrImageBooks: publicUrl(s.qrImageBooks) ?? '',
    qrImageCourses: publicUrl(s.qrImageCourses) ?? '',
    contactEmail: s.contactEmail ?? '',
    contactPhone: s.contactPhone ?? '',
    location: s.location ?? '',
    workingHours: (s.workingHours ?? []).map((item) => ({ label: item.label ?? '', value: item.value ?? '' })),
    socialLinks: {
      facebook: s.socialLinks?.facebook ?? '',
      twitter: s.socialLinks?.twitter ?? '',
      instagram: s.socialLinks?.instagram ?? '',
      linkedin: s.socialLinks?.linkedin ?? '',
    },
  };
}

/** UPI IDs and QR images shown on the payment screens. */
settingsRouter.get(
  '/public',
  asyncHandler(async (_req, res) => {
    res.json({ data: toPublicSettings(await getSettings()) });
  }),
);
