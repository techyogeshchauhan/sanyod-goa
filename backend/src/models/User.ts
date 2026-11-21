import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import type { SessionUser } from '../shared/types/auth';

const userSchema = new Schema(
  {
    legacyId: { type: Number, unique: true, sparse: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    /** Temporary migration fields; authentication never reads them. Scrub with the security remediation command. */
    legacyPasswordHash: { type: String, select: false },
    legacyAlgo: { type: String, enum: ['md5', 'sha1', 'plain'], select: false },
    passwordResetTokenHash: { type: String, select: false, index: true },
    passwordResetExpires: { type: Date, select: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export type UserAttrs = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<UserAttrs>;
export const User = model('User', userSchema);

export function toSessionUser(user: Pick<UserDoc, 'id' | 'name' | 'email'>): SessionUser {
  return { id: user.id as string, name: user.name, email: user.email };
}
