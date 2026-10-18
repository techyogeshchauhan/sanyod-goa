import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { CONSULTATION_STATUSES, PREFERRED_TIMES } from '../shared/constants';

/** "Book Consultation" form on doctor_detail.php (submit_consult). */
const consultationSchema = new Schema(
  {
    legacyId: { type: Number, unique: true, sparse: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String, required: true, trim: true },
    patientEmail: { type: String, required: true, trim: true, lowercase: true },
    patientPhone: { type: String, required: true, match: /^[0-9]{10}$/ },
    patientAge: { type: Number, required: true, min: 1, max: 120 },
    medicalIssue: { type: String, required: true, trim: true },
    appointmentDate: { type: Date, required: true },
    preferredTime: { type: String, enum: PREFERRED_TIMES, default: 'any' },
    symptoms: { type: String, required: true },
    additionalNotes: { type: String },
    consentAccepted: { type: Boolean, required: true },
    status: { type: String, enum: CONSULTATION_STATUSES, default: 'pending' },
    adminNotes: { type: String },
  },
  { timestamps: true },
);

consultationSchema.index({ doctor: 1, appointmentDate: 1 });
consultationSchema.index({ user: 1, createdAt: -1 });
consultationSchema.index({ status: 1, createdAt: -1 });

export type ConsultationAttrs = InferSchemaType<typeof consultationSchema>;
export type ConsultationDoc = HydratedDocument<ConsultationAttrs>;
export const Consultation = model('Consultation', consultationSchema);
