import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { DOCTOR_CATEGORIES } from '../shared/constants';

/**
 * Doctors on health.php / doctor_detail.php. PHP stored one row per category, so the same doctor
 * appeared twice (IDs 9/10, 12/13). Here one document lists every category it belongs to.
 */
const doctorSchema = new Schema(
  {
    /** All old doctor_id values that point to this doctor (for redirects). */
    legacyIds: { type: [Number], default: undefined },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    /** Without the "Dr." prefix: the UI adds it (PHP showed "Dr. Dr."). */
    name: { type: String, required: true, trim: true },
    categories: {
      type: [
        {
          _id: false,
          category: { type: String, enum: DOCTOR_CATEGORIES, required: true },
          /** Diseases treated, as listed on that category's card. */
          specialisations: { type: String, default: '' },
        },
      ],
      validate: { validator: (v: unknown[]) => v.length > 0, message: 'At least one category is required' },
    },
    qualification: { type: String, trim: true }, // BNYS, BHMS, Traditional Vaidya …
    experienceYears: { type: Number, min: 0 },
    fee: { type: Number, required: true, min: 0 }, // paise
    bio: { type: String, default: '' },
    /** Public path, e.g. /uploads/doctors/doctor_68f09d40c317a.jpg */
    photo: { type: String },
    /** Storage key of the CV (PHP: download_cv.php?doctor_id=). */
    cv: { type: String },
    rating: { type: Number, min: 0, max: 5 },
    isVerified: { type: Boolean, default: false },
    availabilityText: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

doctorSchema.index({ legacyIds: 1 }, { unique: true, sparse: true });
doctorSchema.index({ 'categories.category': 1, isActive: 1, sortOrder: 1 });

export type DoctorAttrs = InferSchemaType<typeof doctorSchema>;
export type DoctorDoc = HydratedDocument<DoctorAttrs>;
export const Doctor = model('Doctor', doctorSchema);
