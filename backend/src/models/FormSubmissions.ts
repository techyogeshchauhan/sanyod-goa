import { Schema, model } from 'mongoose';
import { PREFERRED_MENTORS } from '../shared/constants';
import { SESSION_PLANS } from '../shared/schemas/forms';

const MESSAGE_STATUSES = ['new', 'read', 'replied'] as const;

const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: String,
    project: String,
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: MESSAGE_STATUSES, default: 'new' },
    ip: String,
  },
  { timestamps: true },
);
contactMessageSchema.index({ status: 1, createdAt: -1 });
export const ContactMessage = model('ContactMessage', contactMessageSchema);

const guidanceRequestSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    preferredMentor: { type: String, enum: PREFERRED_MENTORS, required: true },
    goals: String,
    plan: { type: String, enum: SESSION_PLANS },
    status: { type: String, enum: MESSAGE_STATUSES, default: 'new' },
    ip: String,
  },
  { timestamps: true },
);
guidanceRequestSchema.index({ status: 1, createdAt: -1 });
export const GuidanceRequest = model('GuidanceRequest', guidanceRequestSchema);

const newsletterSubscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    isActive: { type: Boolean, default: true },
    subscribedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
export const NewsletterSubscriber = model('NewsletterSubscriber', newsletterSubscriberSchema);
