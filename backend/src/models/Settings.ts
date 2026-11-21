import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const workingHourSchema = new Schema(
  { label: { type: String, trim: true }, value: { type: String, trim: true } },
  { _id: false },
);

/**
 * Site settings edited by the admin (one document, key "site"). Operational values are
 * intentionally empty until configured in the admin panel.
 */
const settingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'site' },
    /** Shown first on books_details.php and on payment.php / programes.php. */
    upiIdDefault: { type: String, trim: true, default: '' },
    /** books_details.php after choosing the PDF option. */
    upiIdPdf: { type: String, trim: true, default: '' },
    /** books_details.php after choosing the hard book option. */
    upiIdHardcopy: { type: String, trim: true, default: '' },
    /** QR code on book purchase and event booking (Books/QR.jpg). Public path or /media key. */
    qrImageBooks: { type: String, default: '' },
    /** QR code in the course payment instructions (images/Qr.png). */
    qrImageCourses: { type: String, default: '' },
    contactEmail: { type: String, trim: true, default: '' },
    contactPhone: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    workingHours: { type: [workingHourSchema], default: [] },
    socialLinks: {
      facebook: { type: String, trim: true, default: '' },
      twitter: { type: String, trim: true, default: '' },
      instagram: { type: String, trim: true, default: '' },
      linkedin: { type: String, trim: true, default: '' },
    },
    /** Admin notifications go to this configured address; blank disables email notifications. */
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
