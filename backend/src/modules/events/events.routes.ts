import { Router } from 'express';
import { requireUser, sessionUser } from '../../middleware/auth';
import { formLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { Event } from '../../models/Event';
import { EventBooking } from '../../models/EventBooking';
import { getSettingsCached } from '../../models/Settings';
import { eventBookingSchema, type EventBookingInput } from '../../shared/schemas/purchases';
import type { EventBookingSummary } from '../../shared/types/catalog';
import { formatRupees } from '../../shared/utils/text';
import { sendMail } from '../../services/email/mailer';
import { adminNotificationEmail } from '../../services/email/templates/adminNotification';
import { eventBookingEmail } from '../../services/email/templates/orders';
import { cached } from '../../services/cache';
import { adminNotifyAddress } from '../../services/purchases';
import { asyncHandler } from '../../utils/asyncHandler';
import { badRequest, conflict, notFound } from '../../utils/errors';
import { toEventSummary } from '../catalog/serializers';

export const eventsRouter = Router();
export const eventBookingsRouter = Router();

/** programes.php (login-only on live: Q18). */
eventsRouter.get(
  '/',
  requireUser,
  asyncHandler(async (_req, res) => {
    const data = await cached('events:list', async () =>
      (await Event.find({ isPublished: true }).sort({ category: 1, sortOrder: 1, createdAt: 1 })).map(toEventSummary),
    );
    res.json({ data });
  }),
);

/** Booking modal: name, email, phone and the UPI transaction ID; confirmed by the admin. */
eventBookingsRouter.post(
  '/',
  requireUser,
  formLimiter,
  validate({ body: eventBookingSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as EventBookingInput;
    const event = await Event.findOne({ slug: input.eventSlug, isPublished: true });
    if (!event) throw notFound('Event not found');
    const settings = await getSettingsCached();
    if (!settings.upiIdDefault?.trim() && !settings.qrImageBooks?.trim()) {
      throw badRequest('Event payment details are not configured yet. Please contact the site administrator.');
    }
    let booking;
    try {
      booking = await EventBooking.create({
        event: event._id,
        user: sessionUser(req).id,
        name: input.name,
        email: input.email,
        phone: input.phone,
        amount: event.price,
        upiTransactionId: input.upiTransactionId,
      });
    } catch (err) {
      if ((err as { code?: number }).code === 11000) {
        throw conflict('DUPLICATE_TRANSACTION', 'This transaction ID has already been submitted.', {
          upiTransactionId: 'This transaction ID has already been submitted.',
        });
      }
      throw err;
    }
    const info = {
      eventTitle: event.title,
      dateText: event.dateText ?? '',
      timeText: event.timeText ?? '',
      location: event.location ?? '',
      amount: event.price,
      transactionId: input.upiTransactionId,
    };
    await sendMail(eventBookingEmail({ to: input.email, name: input.name, status: 'pending', ...info }));
    await sendMail(
      adminNotificationEmail(await adminNotifyAddress(), `New event booking - ${event.title}`, {
        Event: event.title,
        Date: `${info.dateText} ${info.timeText}`,
        Name: input.name,
        Email: input.email,
        Phone: input.phone,
        Amount: formatRupees(event.price),
        'Transaction ID': input.upiTransactionId,
      }),
    );
    res.status(201).json({ data: { id: String(booking._id), message: 'Booking details submitted successfully!' } });
  }),
);

eventBookingsRouter.get(
  '/',
  requireUser,
  asyncHandler(async (req, res) => {
    const list = await EventBooking.find({ user: sessionUser(req).id }).sort({ createdAt: -1 }).populate('event', 'title dateText');
    const data: EventBookingSummary[] = list.map((b) => {
      const ev = b.event as unknown as { title?: string; dateText?: string } | null;
      return {
        id: String(b._id),
        eventTitle: ev?.title ?? '',
        dateText: ev?.dateText ?? '',
        amount: b.amount,
        upiTransactionId: b.upiTransactionId,
        status: b.status ?? 'pending',
        createdAt: (b as unknown as { createdAt: Date }).createdAt.toISOString(),
      };
    });
    res.json({ data });
  }),
);
