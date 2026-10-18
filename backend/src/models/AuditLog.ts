import { Schema, model, type InferSchemaType } from 'mongoose';

/** Every admin write (approve payment, edit a book …) is recorded here. */
const auditLogSchema = new Schema(
  {
    admin: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    adminUsername: { type: String },
    action: { type: String, required: true }, // e.g. payment.approve, book.update
    entity: { type: String, required: true }, // e.g. Payment
    entityId: { type: Schema.Types.ObjectId },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });

export type AuditLogAttrs = InferSchemaType<typeof auditLogSchema>;
export const AuditLog = model('AuditLog', auditLogSchema);
