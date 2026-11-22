import { Router } from 'express';
import type { Types } from 'mongoose';
import { cvField, imageField, uploadedFile, uploadFields } from '../../middleware/upload';
import { validate } from '../../middleware/validate';
import { Consultation, type ConsultationDoc } from '../../models/Consultation';
import { Doctor, type DoctorDoc } from '../../models/Doctor';
import { Event, type EventDoc } from '../../models/Event';
import { EventBooking, type EventBookingDoc } from '../../models/EventBooking';
import {
  doctorFormSchema,
  eventFormSchema,
  idParamSchema,
  listQuerySchema,
  updateBookingSchema,
  updateConsultationSchema,
  type DoctorFormInput,
  type EventFormInput,
  type ListQuery,
} from '../../shared/schemas/admin';
import type { AdminBooking, AdminConsultation, AdminDoctor, AdminEvent, UserRef } from '../../shared/types/admin';
import type { BookingStatus, ConsultationStatus } from '../../shared/types/catalog';
import { sendMail } from '../../services/email/mailer';
import { consultationStatusEmail, eventBookingEmail } from '../../services/email/templates/orders';
import { deleteStored, publicUrl, saveUpload, sendPrivateFile } from '../../services/storage';
import { asyncHandler } from '../../utils/asyncHandler';
import { conflict, notFound } from '../../utils/errors';
import { audit, createdAt, defined, iso, paged, searchFilter, skip, slugify, uniqueSlug } from './helpers';

export const servicesRouter = Router();

const isLegacyPath = (v: string | null | undefined) => Boolean(v && v.startsWith('/'));
const userRef = (u: unknown): UserRef | null => {
  if (!u || typeof u !== 'object' || !('email' in u)) return null;
  const v = u as { _id: Types.ObjectId; name: string; email: string };
  return { id: String(v._id), name: v.name, email: v.email };
};

// ---- Doctors ----------------------------------------------------------------------

function toAdminDoctor(d: DoctorDoc): AdminDoctor {
  return {
    id: String(d._id),
    legacyIds: d.legacyIds ?? [],
    slug: d.slug,
    name: d.name,
    categories: (d.categories ?? []).map((c) => ({ category: c.category, specialisations: c.specialisations ?? '' })),
    qualification: d.qualification ?? '',
    experienceYears: d.experienceYears ?? null,
    fee: d.fee,
    bio: d.bio ?? '',
    photo: publicUrl(d.photo),
    hasCv: Boolean(d.cv),
    rating: d.rating ?? null,
    isVerified: d.isVerified ?? false,
    availabilityText: d.availabilityText ?? '',
    isActive: d.isActive ?? true,
    sortOrder: d.sortOrder ?? 0,
  };
}

servicesRouter.get(
  '/doctors',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as ListQuery;
    const filter = { ...searchFilter(q.q, ['name', 'qualification', 'categories.specialisations']), ...(q.category ? { 'categories.category': q.category } : {}) };
    const [items, total] = await Promise.all([
      Doctor.find(filter).sort({ sortOrder: 1, createdAt: 1 }).skip(skip(q)).limit(q.pageSize),
      Doctor.countDocuments(filter),
    ]);
    res.json(paged(items.map(toAdminDoctor), total, q));
  }),
);

servicesRouter.get(
  '/doctors/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) throw notFound('Doctor not found');
    res.json({ data: toAdminDoctor(doctor) });
  }),
);

servicesRouter.get(
  '/doctors/:id/cv',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor?.cv) throw notFound('No CV uploaded');
    await sendPrivateFile(res, doctor.cv, { download: true, filename: `Dr-${doctor.slug}-CV.${doctor.cv.split('.').pop() ?? 'pdf'}` });
  }),
);

const doctorUpload = uploadFields([imageField('photo'), cvField('cv')]);

function doctorFields(input: DoctorFormInput) {
  return defined({
    name: input.name,
    categories: input.categories,
    qualification: input.qualification ?? '',
    // An emptied optional field is null, which clears it (defined() keeps nulls).
    experienceYears: input.experienceYears,
    fee: input.fee ?? undefined,
    bio: input.bio,
    rating: input.rating,
    isVerified: input.isVerified,
    availabilityText: input.availabilityText ?? '',
    isActive: input.isActive,
    sortOrder: input.sortOrder ?? 0,
  });
}

servicesRouter.post(
  '/doctors',
  doctorUpload,
  validate({ body: doctorFormSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as DoctorFormInput;
    const slug = await uniqueSlug(Doctor, input.slug ?? slugify(input.name, 'doctor'));
    const photo = uploadedFile(req, 'photo');
    const cv = uploadedFile(req, 'cv');
    const photoKey = photo ? await saveUpload('public', 'doctors', photo, 'doctor') : undefined;
    const cvKey = cv ? await saveUpload('private', 'cvs', cv, 'cv') : undefined;
    try {
      const doctor = await Doctor.create({ ...doctorFields(input), slug, photo: photoKey, cv: cvKey });
      await audit(req, 'doctor.create', 'Doctor', doctor._id, { name: doctor.name });
      res.status(201).json({ data: toAdminDoctor(doctor) });
    } catch (err) {
      // Don't leave orphan files behind when the record can't be saved.
      await deleteStored('public', photoKey);
      await deleteStored('private', cvKey);
      throw err;
    }
  }),
);

servicesRouter.patch(
  '/doctors/:id',
  doctorUpload,
  validate({ params: idParamSchema, body: doctorFormSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as DoctorFormInput;
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) throw notFound('Doctor not found');
    Object.assign(doctor, doctorFields(input));
    if (input.slug && input.slug !== doctor.slug) doctor.slug = await uniqueSlug(Doctor, input.slug, doctor._id);
    const photo = uploadedFile(req, 'photo');
    const cv = uploadedFile(req, 'cv');
    const oldPhoto = doctor.photo;
    const oldCv = doctor.cv;
    if (photo) doctor.photo = await saveUpload('public', 'doctors', photo, 'doctor');
    if (cv) doctor.cv = await saveUpload('private', 'cvs', cv, 'cv');
    else if (input.removeCv) doctor.cv = undefined;
    await doctor.save();
    if (photo && !isLegacyPath(oldPhoto)) await deleteStored('public', oldPhoto);
    if ((cv || input.removeCv) && oldCv) await deleteStored('private', oldCv);
    await audit(req, 'doctor.update', 'Doctor', doctor._id, { name: doctor.name });
    res.json({ data: toAdminDoctor(doctor) });
  }),
);

servicesRouter.delete(
  '/doctors/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) throw notFound('Doctor not found');
    if (await Consultation.exists({ doctor: doctor._id })) {
      throw conflict('HAS_CONSULTATIONS', 'This doctor has consultation requests. Deactivate the profile instead of deleting it.');
    }
    await doctor.deleteOne();
    if (!isLegacyPath(doctor.photo)) await deleteStored('public', doctor.photo);
    await deleteStored('private', doctor.cv);
    await audit(req, 'doctor.delete', 'Doctor', doctor._id, { name: doctor.name });
    res.status(204).end();
  }),
);

// ---- Consultations -------------------------------------------------------------------

function toAdminConsultation(c: ConsultationDoc): AdminConsultation {
  const doctor = c.doctor as unknown as { _id: Types.ObjectId; name?: string } | null;
  return {
    id: String(c._id),
    doctorId: String(doctor && typeof doctor === 'object' && '_id' in doctor ? doctor._id : c.doctor),
    doctorName: doctor && typeof doctor === 'object' && 'name' in doctor ? (doctor.name ?? '') : '',
    user: userRef(c.user),
    patientName: c.patientName,
    patientEmail: c.patientEmail,
    patientPhone: c.patientPhone,
    patientAge: c.patientAge,
    medicalIssue: c.medicalIssue,
    appointmentDate: iso(c.appointmentDate) ?? '',
    preferredTime: c.preferredTime ?? 'any',
    symptoms: c.symptoms,
    additionalNotes: c.additionalNotes ?? null,
    status: c.status ?? 'pending',
    adminNotes: c.adminNotes ?? null,
    createdAt: createdAt(c),
  };
}

servicesRouter.get(
  '/consultations',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as ListQuery;
    const filter = {
      ...searchFilter(q.q, ['patientName', 'patientEmail', 'patientPhone', 'medicalIssue']),
      ...(q.status ? { status: q.status } : {}),
    };
    const [items, total] = await Promise.all([
      Consultation.find(filter).sort({ createdAt: -1 }).skip(skip(q)).limit(q.pageSize).populate('doctor', 'name').populate('user', 'name email'),
      Consultation.countDocuments(filter),
    ]);
    res.json(paged(items.map(toAdminConsultation), total, q));
  }),
);

servicesRouter.patch(
  '/consultations/:id',
  validate({ params: idParamSchema, body: updateConsultationSchema }),
  asyncHandler(async (req, res) => {
    const { status, adminNotes, notify } = req.body as { status: ConsultationStatus; adminNotes?: string; notify?: boolean };
    const c = await Consultation.findById(req.params.id).populate('doctor', 'name').populate('user', 'name email');
    if (!c) throw notFound('Consultation not found');
    const changed = c.status !== status;
    c.status = status;
    // An empty note clears it; an omitted one leaves it unchanged.
    if (adminNotes !== undefined) c.adminNotes = adminNotes || undefined;
    await c.save();
    if (changed && notify !== false && status !== 'pending') {
      const doctorName = (c.doctor as unknown as { name?: string } | null)?.name ?? '';
      await sendMail(consultationStatusEmail({ to: c.patientEmail, name: c.patientName, doctorName, status }));
    }
    await audit(req, 'consultation.update', 'Consultation', c._id, { status });
    res.json({ data: toAdminConsultation(c) });
  }),
);

// ---- Events -------------------------------------------------------------------------------

function toAdminEvent(e: EventDoc, bookings: number): AdminEvent {
  return {
    id: String(e._id),
    legacyId: e.legacyId ?? null,
    slug: e.slug,
    title: e.title,
    category: e.category,
    description: e.description ?? '',
    badge: e.badge ?? '',
    startDate: iso(e.startDate),
    dateText: e.dateText ?? '',
    timeText: e.timeText ?? '',
    durationText: e.durationText ?? '',
    location: e.location ?? '',
    price: e.price,
    image: publicUrl(e.image),
    capacity: e.capacity ?? null,
    enrolledCount: e.enrolledCount ?? 0,
    rating: e.rating ?? null,
    ctaLabel: e.ctaLabel ?? 'Book Now',
    isPublished: e.isPublished ?? true,
    sortOrder: e.sortOrder ?? 0,
    bookings,
  };
}

async function bookingsByEvent(ids: unknown[]): Promise<Map<string, number>> {
  const rows = await EventBooking.aggregate<{ _id: unknown; n: number }>([
    { $match: { event: { $in: ids }, status: { $ne: 'cancelled' } } },
    { $group: { _id: '$event', n: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.n]));
}

servicesRouter.get(
  '/events',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as ListQuery;
    const filter = { ...searchFilter(q.q, ['title', 'location']), ...(q.category ? { category: q.category } : {}) };
    const [items, total] = await Promise.all([
      Event.find(filter).sort({ category: 1, sortOrder: 1, createdAt: 1 }).skip(skip(q)).limit(q.pageSize),
      Event.countDocuments(filter),
    ]);
    const counts = await bookingsByEvent(items.map((e) => e._id));
    res.json(paged(items.map((e) => toAdminEvent(e, counts.get(String(e._id)) ?? 0)), total, q));
  }),
);

const eventUpload = uploadFields([imageField('image')]);

function eventFields(input: EventFormInput) {
  return defined({
    title: input.title,
    category: input.category,
    description: input.description,
    badge: input.badge ?? '',
    startDate: input.startDate,
    dateText: input.dateText ?? '',
    timeText: input.timeText ?? '',
    durationText: input.durationText ?? '',
    location: input.location ?? '',
    price: input.price ?? undefined,
    // Emptied fields: optional ones clear (null), counters fall back to 0.
    capacity: input.capacity,
    enrolledCount: input.enrolledCount ?? 0,
    rating: input.rating,
    ctaLabel: input.ctaLabel,
    isPublished: input.isPublished,
    sortOrder: input.sortOrder ?? 0,
  });
}

servicesRouter.post(
  '/events',
  eventUpload,
  validate({ body: eventFormSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as EventFormInput;
    const slug = await uniqueSlug(Event, input.slug ?? slugify(input.title, 'event'));
    const image = uploadedFile(req, 'image');
    const event = await Event.create({
      ...eventFields(input),
      slug,
      image: image ? await saveUpload('public', 'events', image, 'event') : undefined,
    });
    await audit(req, 'event.create', 'Event', event._id, { title: event.title });
    res.status(201).json({ data: toAdminEvent(event, 0) });
  }),
);

servicesRouter.patch(
  '/events/:id',
  eventUpload,
  validate({ params: idParamSchema, body: eventFormSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as EventFormInput;
    const event = await Event.findById(req.params.id);
    if (!event) throw notFound('Event not found');
    Object.assign(event, eventFields(input));
    if (input.slug && input.slug !== event.slug) event.slug = await uniqueSlug(Event, input.slug, event._id);
    const image = uploadedFile(req, 'image');
    const old = event.image;
    if (image) event.image = await saveUpload('public', 'events', image, 'event');
    await event.save();
    if (image && !isLegacyPath(old)) await deleteStored('public', old);
    await audit(req, 'event.update', 'Event', event._id, { title: event.title });
    const counts = await bookingsByEvent([event._id]);
    res.json({ data: toAdminEvent(event, counts.get(String(event._id)) ?? 0) });
  }),
);

servicesRouter.delete(
  '/events/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) throw notFound('Event not found');
    if (await EventBooking.exists({ event: event._id })) {
      throw conflict('HAS_BOOKINGS', 'This event has bookings. Unpublish it instead of deleting it.');
    }
    await event.deleteOne();
    if (!isLegacyPath(event.image)) await deleteStored('public', event.image);
    await audit(req, 'event.delete', 'Event', event._id, { title: event.title });
    res.status(204).end();
  }),
);

// ---- Event bookings ------------------------------------------------------------------------

function toAdminBooking(b: EventBookingDoc): AdminBooking {
  const ev = b.event as unknown as { _id: Types.ObjectId; title?: string } | null;
  return {
    id: String(b._id),
    eventId: String(ev && typeof ev === 'object' && '_id' in ev ? ev._id : b.event),
    eventTitle: ev && typeof ev === 'object' && 'title' in ev ? (ev.title ?? '') : '',
    user: userRef(b.user),
    name: b.name,
    email: b.email,
    phone: b.phone,
    amount: b.amount,
    upiTransactionId: b.upiTransactionId,
    status: b.status ?? 'pending',
    createdAt: createdAt(b),
  };
}

servicesRouter.get(
  '/event-bookings',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as ListQuery;
    const filter: Record<string, unknown> = {
      ...searchFilter(q.q, ['name', 'email', 'phone', 'upiTransactionId']),
      ...(q.status ? { status: q.status } : {}),
      ...(q.eventId ? { event: q.eventId } : {}),
    };
    const [items, total] = await Promise.all([
      EventBooking.find(filter).sort({ createdAt: -1 }).skip(skip(q)).limit(q.pageSize).populate('event', 'title').populate('user', 'name email'),
      EventBooking.countDocuments(filter),
    ]);
    res.json(paged(items.map(toAdminBooking), total, q));
  }),
);

servicesRouter.patch(
  '/event-bookings/:id',
  validate({ params: idParamSchema, body: updateBookingSchema }),
  asyncHandler(async (req, res) => {
    const { status, notify } = req.body as { status: BookingStatus; notify?: boolean };
    const b = await EventBooking.findById(req.params.id).populate('event').populate('user', 'name email');
    if (!b) throw notFound('Booking not found');
    const previous = b.status;
    b.status = status;
    b.reviewedAt = new Date();
    b.reviewedBy = req.session.admin?.id as unknown as Types.ObjectId;
    await b.save();
    const ev = b.event as unknown as EventDoc | null;
    if (ev && previous !== status) {
      // Keep the "N enrolled" counter in step with confirmations.
      if (status === 'confirmed') await Event.updateOne({ _id: ev._id }, { $inc: { enrolledCount: 1 } });
      // Never below 0 (the count can also be edited by hand).
      else if (previous === 'confirmed') await Event.updateOne({ _id: ev._id, enrolledCount: { $gt: 0 } }, { $inc: { enrolledCount: -1 } });
      if (notify !== false && status !== 'pending') {
        await sendMail(
          eventBookingEmail({
            to: b.email,
            name: b.name,
            eventTitle: ev.title,
            dateText: ev.dateText ?? '',
            timeText: ev.timeText ?? '',
            location: ev.location ?? '',
            amount: b.amount,
            transactionId: b.upiTransactionId,
            status,
          }),
        );
      }
    }
    await audit(req, 'booking.update', 'EventBooking', b._id, { status });
    res.json({ data: toAdminBooking(b) });
  }),
);

