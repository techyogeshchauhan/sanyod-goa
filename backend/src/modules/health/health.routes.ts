import { Router } from 'express';
import { requireUser, sessionUser } from '../../middleware/auth';
import { formLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { Consultation } from '../../models/Consultation';
import { Doctor } from '../../models/Doctor';
import { PREFERRED_TIME_LABELS } from '../../shared/constants';
import { consultationSchema, type ConsultationInput } from '../../shared/schemas/purchases';
import type { ConsultationSummary } from '../../shared/types/catalog';
import { sendMail } from '../../services/email/mailer';
import { adminNotificationEmail } from '../../services/email/templates/adminNotification';
import { consultationReceivedEmail } from '../../services/email/templates/orders';
import { browserCache, cached } from '../../services/cache';
import { adminNotifyAddress } from '../../services/purchases';
import { sendPrivateFile } from '../../services/storage';
import { asyncHandler } from '../../utils/asyncHandler';
import { notFound } from '../../utils/errors';
import { toDoctorDetail, toDoctorSummary } from '../catalog/serializers';

export const doctorsRouter = Router();
export const consultationsRouter = Router();

/** health.php: active doctors (the page groups them by category). */
doctorsRouter.get(
  '/',
  browserCache(),
  asyncHandler(async (_req, res) => {
    const data = await cached('doctors:list', async () =>
      (await Doctor.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 })).map(toDoctorSummary),
    );
    res.json({ data });
  }),
);

doctorsRouter.get(
  '/:slug',
  browserCache(),
  asyncHandler(async (req, res) => {
    const slug = req.params.slug ?? '';
    const data = await cached(`doctor:${slug}`, async () => {
      const doctor = await Doctor.findOne({ slug, isActive: true });
      return doctor ? toDoctorDetail(doctor) : null;
    });
    if (!data) throw notFound('Doctor not found');
    res.json({ data });
  }),
);

/** download_cv.php: logged-in users only (Q13 default). */
doctorsRouter.get(
  '/:slug/cv',
  requireUser,
  asyncHandler(async (req, res) => {
    const doctor = await Doctor.findOne({ slug: req.params.slug, isActive: true });
    if (!doctor?.cv) throw notFound('CV not available');
    const ext = doctor.cv.split('.').pop() ?? 'pdf';
    await sendPrivateFile(res, doctor.cv, { download: true, filename: `Dr-${doctor.slug}-CV.${ext}` });
  }),
);

/** "Book Consultation" form (doctor_detail.php / submit_consultation.php). */
consultationsRouter.post(
  '/',
  requireUser,
  formLimiter,
  validate({ body: consultationSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as ConsultationInput;
    const user = sessionUser(req);
    const doctor = await Doctor.findOne({ slug: input.doctorSlug, isActive: true });
    if (!doctor) throw notFound('Doctor not found');
    const consultation = await Consultation.create({
      doctor: doctor._id,
      user: user.id,
      patientName: input.patientName,
      patientEmail: input.patientEmail,
      patientPhone: input.patientPhone,
      patientAge: input.patientAge,
      medicalIssue: input.medicalIssue,
      appointmentDate: new Date(`${input.appointmentDate}T00:00:00.000Z`),
      preferredTime: input.preferredTime,
      symptoms: input.symptoms,
      additionalNotes: input.additionalNotes,
      consentAccepted: true,
    });
    await sendMail(
      consultationReceivedEmail({
        to: input.patientEmail,
        name: input.patientName,
        doctorName: doctor.name,
        date: input.appointmentDate,
        time: PREFERRED_TIME_LABELS[input.preferredTime],
      }),
    );
    await sendMail(
      adminNotificationEmail(await adminNotifyAddress(), `New consultation request - Dr. ${doctor.name}`, {
        Patient: `${input.patientName} (${input.patientEmail}, ${input.patientPhone})`,
        Age: String(input.patientAge),
        Issue: input.medicalIssue,
        Date: input.appointmentDate,
        Time: PREFERRED_TIME_LABELS[input.preferredTime],
        Symptoms: input.symptoms,
        Notes: input.additionalNotes,
      }),
    );
    res.status(201).json({
      data: {
        id: String(consultation._id),
        message: 'Consultation request submitted successfully! The doctor will contact you within 24 hours.',
      },
    });
  }),
);

consultationsRouter.get(
  '/',
  requireUser,
  asyncHandler(async (req, res) => {
    const list = await Consultation.find({ user: sessionUser(req).id }).sort({ createdAt: -1 }).populate('doctor', 'name');
    const data: ConsultationSummary[] = list.map((c) => ({
      id: String(c._id),
      doctorName: (c.doctor as unknown as { name?: string } | null)?.name ?? '',
      medicalIssue: c.medicalIssue,
      appointmentDate: c.appointmentDate.toISOString(),
      preferredTime: c.preferredTime ?? 'any',
      status: c.status ?? 'pending',
      createdAt: (c as unknown as { createdAt: Date }).createdAt.toISOString(),
    }));
    res.json({ data });
  }),
);
