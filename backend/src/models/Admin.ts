import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { ADMIN_ROLES } from '../shared/constants';
import type { SessionAdmin } from '../shared/types/auth';

const adminSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    role: { type: String, enum: ADMIN_ROLES, default: 'admin' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export type AdminAttrs = InferSchemaType<typeof adminSchema>;
export type AdminDoc = HydratedDocument<AdminAttrs>;
export const Admin = model('Admin', adminSchema);

export function toSessionAdmin(admin: Pick<AdminDoc, 'id' | 'username' | 'name' | 'role'>): SessionAdmin {
  return {
    id: admin.id as string,
    username: admin.username,
    name: admin.name ?? undefined,
    role: admin.role ?? 'admin',
  };
}
