import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

/**
 * Site settings edited by the admin (one document, key "site"). Defaults are the values
 * hard-coded on the PHP pages.
 */
const settingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'site' },
    /** Shown first on books_details.php and on payment.php / programes.php. */
    upiIdDefault: { type: String, trim: true, default: '6355034424@upi' },
    /** books_details.php after choosing the PDF option. */
    upiIdPdf: { type: String, trim: true, default: 'pdf.6355034424@upi' },
    /** books_details.php after choosing the hard book option. */
    upiIdHardcopy: { type: String, trim: true, default: 'hardbook.6355034424@upi' },
    /** QR code on book purchase and event booking (Books/QR.jpg). Public path or /media key. */
    qrImageBooks: { type: String, default: '/Books/QR.jpg' },
    /** QR code in the course payment instructions (images/Qr.png). */
    qrImageCourses: { type: String, default: '/images/Qr.png' },
    contactEmail: { type: String, trim: true, default: 'sanyod@sanyod.in' },
    contactPhone: { type: String, trim: true, default: '8077641645' },
    /** Admin notifications go here (falls back to ADMIN_NOTIFY_EMAIL). */
    adminNotifyEmail: { type: String, trim: true },
  },
  { timestamps: true },
);

export type SettingsAttrs = InferSchemaType<typeof settingsSchema>;
export type SettingsDoc = HydratedDocument<SettingsAttrs>;
export const Settings = model('Settings', settingsSchema);

/** The site settings, created with defaults on first use. */
export async function getSettings(): Promise<SettingsDoc> {
  return Settings.findOneAndUpdate({ key: 'site' }, { $setOnInsert: { key: 'site' } }, { upsert: true, new: true });
}
