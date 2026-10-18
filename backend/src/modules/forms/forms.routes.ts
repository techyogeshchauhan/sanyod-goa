import { Router, type Request } from 'express';
import { env } from '../../config/env';
import { formLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { ContactMessage, GuidanceRequest, NewsletterSubscriber } from '../../models/FormSubmissions';
import {
  contactSchema,
  guidanceRequestSchema,
  newsletterSchema,
  type ContactInput,
  type GuidanceRequestInput,
  type NewsletterInput,
} from '../../shared/schemas/forms';
import { sendMail } from '../../services/email/mailer';
import { adminNotificationEmail } from '../../services/email/templates/adminNotification';
import { asyncHandler } from '../../utils/asyncHandler';

export const formsRouter = Router();

const MENTOR_NAMES: Record<GuidanceRequestInput['preferredMentor'], string> = {
  swami: 'Swami Devanand (Vedanta & Meditation)',
  priya: 'Dr. Priya Sharma (Yoga & Ayurveda)',
  rajan: 'Acharya Rajan (Scripture & Rituals)',
  any: 'Any Available Mentor',
};

/** Bots fill the hidden "website" field; answer as if it worked and store nothing. */
const isBot = (req: Request) => Boolean((req.body as { website?: string }).website);

formsRouter.post(
  '/contact',
  formLimiter,
  validate({ body: contactSchema }),
  asyncHandler(async (req, res) => {
    if (!isBot(req)) {
      const { website: _ignored, ...input } = req.body as ContactInput;
      await ContactMessage.create({ ...input, ip: req.ip });
      await sendMail(
        adminNotificationEmail(env.ADMIN_NOTIFY_EMAIL, 'New contact message', {
          Name: input.name,
          Email: input.email,
          Phone: input.phone,
          Project: input.project,
          Subject: input.subject,
          Message: input.message,
        }),
      );
    }
    res.status(201).json({ data: { message: 'Thank you! Your message has been sent. We will get back to you soon.' } });
  }),
);

formsRouter.post(
  '/guidance-requests',
  formLimiter,
  validate({ body: guidanceRequestSchema }),
  asyncHandler(async (req, res) => {
    if (!isBot(req)) {
      const { website: _ignored, ...input } = req.body as GuidanceRequestInput;
      await GuidanceRequest.create({ ...input, ip: req.ip });
      await sendMail(
        adminNotificationEmail(env.ADMIN_NOTIFY_EMAIL, 'New free consultation request', {
          Name: input.name,
          Email: input.email,
          'Preferred mentor': MENTOR_NAMES[input.preferredMentor],
          Plan: input.plan,
          Goals: input.goals,
        }),
      );
    }
    // Same confirmation text as the live page.
    res.status(201).json({ data: { message: 'Thank you! We will contact you within 24 hours to schedule your free consultation.' } });
  }),
);

formsRouter.post(
  '/newsletter',
  formLimiter,
  validate({ body: newsletterSchema }),
  asyncHandler(async (req, res) => {
    if (!isBot(req)) {
      const { email } = req.body as NewsletterInput;
      await NewsletterSubscriber.updateOne(
        { email },
        { $set: { isActive: true }, $setOnInsert: { email, subscribedAt: new Date() } },
        { upsert: true },
      );
    }
    res.json({ data: { message: 'Subscribed!' } });
  }),
);
