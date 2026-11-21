/**
 * Imports the live MySQL database (phpMyAdmin SQL export) into MongoDB, and copies the uploaded
 * files from the old site folder. Safe to re-run: every record is matched by its old id.
 *
 *   npm run migrate:mysql -- --file D:/export/sanyod.sql [--legacy-dir D:/sanyod.in] [--dry-run]
 *
 * Tables confirmed in the PHP code (users, books, payments, orders) are mapped exactly. The
 * names/columns of the other tables were never visible, so several likely names are tried and
 * anything not understood is listed in the report (docs/12 § 7, docs/09 Part A).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import type { Types } from 'mongoose';
import { connectDb, disconnectDb } from '../config/db';
import { env } from '../config/env';
import { Book } from '../models/Book';
import { Consultation } from '../models/Consultation';
import { Course } from '../models/Course';
import { CourseVideo } from '../models/CourseVideo';
import { Doctor } from '../models/Doctor';
import { Entitlement } from '../models/Entitlement';
import { Event } from '../models/Event';
import { EventBooking } from '../models/EventBooking';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';
import { User } from '../models/User';
import { PREFERRED_TIMES } from '../shared/constants';
import { importFile } from '../services/storage';
import { slugify } from '../modules/admin/helpers';
import { initDb } from './init-db';
import { readDump, type Row, type SqlValue } from './mysql-dump';

type Report = { table: string; read: number; written: number; skipped: number; notes: string[] };
const reports: Report[] = [];
let dryRun = false;
let legacyDir: string | undefined;

// ---- helpers ---------------------------------------------------------------------------------

/** First non-empty value among several possible column names. */
function pick(row: Row, ...names: string[]): SqlValue {
  for (const n of names) {
    const v = row[n];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return null;
}
const str = (v: SqlValue) => (v === null ? '' : String(v)).trim();
const num = (v: SqlValue) => (v === null || v === '' ? null : Number(String(v).replace(/[₹,\s]/g, '')));
const paise = (v: SqlValue) => {
  const n = num(v);
  return n === null || Number.isNaN(n) ? null : Math.round(n * 100);
};
const date = (v: SqlValue) => {
  const s = str(v);
  if (!s || s.startsWith('0000')) return undefined;
  const d = new Date(s.includes('T') ? s : `${s.replace(' ', 'T')}+05:30`);
  return Number.isNaN(d.getTime()) ? undefined : d;
};
const id = (v: SqlValue) => {
  const n = num(v);
  return n !== null && Number.isInteger(n) && n > 0 ? n : null;
};

function report(table: string): Report {
  const r: Report = { table, read: 0, written: 0, skipped: 0, notes: [] };
  reports.push(r);
  return r;
}

/** The first table of the dump whose name is in `names`. */
function table(tables: Map<string, Row[]>, ...names: string[]): { name: string; rows: Row[] } | null {
  for (const n of names) {
    const rows = tables.get(n);
    if (rows) return { name: n, rows };
  }
  return null;
}

/** Copies an old upload into storage; returns the storage key (or the fallback when missing). */
async function copyFile(area: 'public' | 'private', folder: string, relative: string | null, r: Report): Promise<string | null> {
  if (!relative) return null;
  const clean = relative.replace(/^\.?\//, '').replace(/\\/g, '/');
  const key = `${folder}/${path.basename(clean).replace(/\s+/g, '-')}`;
  if (dryRun || !legacyDir) return key;
  const copied = await importFile(area, key, path.join(legacyDir, clean));
  if (!copied) r.notes.push(`missing file ${clean}`);
  return copied ?? key;
}

/** Resolves a stored file name against the folders the PHP site used. */
function withFolder(file: string, folder: string): string {
  return file.includes('/') ? file : `${folder}/${file}`;
}

async function upsert<T>(model: { updateOne: (f: object, u: object, o: object) => Promise<unknown> }, filter: object, doc: T, r: Report) {
  if (dryRun) {
    r.written++;
    return;
  }
  await model.updateOne(filter, { $set: doc }, { upsert: true, runValidators: true });
  r.written++;
}

function hashFields(password: string) {
  if (/^\$2[aby]\$\d{2}\$/.test(password)) return { passwordHash: password.replace(/^\$2y\$/, '$2b$') };
  if (/^[a-f0-9]{32}$/i.test(password)) return { legacyPasswordHash: password.toLowerCase(), legacyAlgo: 'md5' as const };
  if (/^[a-f0-9]{40}$/i.test(password)) return { legacyPasswordHash: password.toLowerCase(), legacyAlgo: 'sha1' as const };
  return { legacyPasswordHash: password, legacyAlgo: 'plain' as const };
}

const ORDER_STATUS: Record<string, string> = {
  pending: 'pending',
  processing: 'processing',
  confirmed: 'processing',
  approved: 'processing',
  shipped: 'shipped',
  dispatched: 'shipped',
  delivered: 'delivered',
  completed: 'delivered',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  rejected: 'cancelled',
};
const PAYMENT_STATUS: Record<string, 'pending' | 'approved' | 'rejected'> = {
  pending: 'pending',
  approved: 'approved',
  success: 'approved',
  completed: 'approved',
  paid: 'approved',
  rejected: 'rejected',
  failed: 'rejected',
  cancelled: 'rejected',
};

// ---- tables ------------------------------------------------------------------------------------

async function migrateUsers(tables: Map<string, Row[]>) {
  const t = table(tables, 'users', 'user');
  const r = report(t?.name ?? 'users');
  const map = new Map<number, Types.ObjectId>();
  if (!t) return (r.notes.push('table not found'), map);
  const algos: Record<string, number> = {};
  for (const row of t.rows) {
    r.read++;
    const legacyId = id(row.id ?? null);
    const email = str(pick(row, 'email', 'user_email')).toLowerCase();
    if (!legacyId || !email) {
      r.skipped++;
      continue;
    }
    const password = str(pick(row, 'password', 'pass', 'user_password'));
    const hashes = password ? hashFields(password) : {};
    const algo = 'legacyAlgo' in hashes ? (hashes.legacyAlgo as string) : 'passwordHash' in hashes ? 'bcrypt' : 'none';
    algos[algo] = (algos[algo] ?? 0) + 1;
    const existing = await User.findOne({ $or: [{ legacyId }, { email }] }).select('+passwordHash');
    const doc = {
      legacyId,
      name: str(pick(row, 'name', 'full_name', 'username', 'user_name')) || email.split('@')[0],
      email,
      // Never overwrite a password the user already changed on the new site.
      ...(existing?.passwordHash && !('passwordHash' in hashes && existing.passwordHash === hashes.passwordHash) ? {} : hashes),
      isActive: str(pick(row, 'status', 'is_active')) === '0' || /inactive|blocked/i.test(str(row.status ?? null)) ? false : true,
      ...(date(pick(row, 'created_at', 'created', 'reg_date')) ? { createdAt: date(pick(row, 'created_at', 'created', 'reg_date')) } : {}),
    };
    if (dryRun) r.written++;
    else {
      const saved = await User.findOneAndUpdate({ $or: [{ legacyId }, { email }] }, { $set: doc }, { upsert: true, new: true, runValidators: true, timestamps: false });
      map.set(legacyId, saved._id);
      r.written++;
    }
  }
  r.notes.push(`password formats: ${Object.entries(algos).map(([k, v]) => `${k}=${v}`).join(', ') || 'none'}`);
  return map;
}

async function migrateBooks(tables: Map<string, Row[]>) {
  const t = table(tables, 'books', 'book');
  const r = report(t?.name ?? 'books');
  const map = new Map<number, Types.ObjectId>();
  if (!t) return (r.notes.push('table not found'), map);
  for (const row of t.rows) {
    r.read++;
    const legacyId = id(row.id ?? null);
    const title = str(pick(row, 'book_title', 'title', 'name'));
    if (!legacyId || !title) {
      r.skipped++;
      continue;
    }
    const price = paise(pick(row, 'price', 'book_price', 'pdf_price'));
    const coverFile = str(pick(row, 'book_image', 'image', 'cover', 'cover_image', 'book_cover', 'photo'));
    const pdfFile = str(pick(row, 'book_pdf', 'pdf', 'pdf_file', 'file', 'book_file'));
    const existing = await Book.findOne({ legacyId }, 'slug');
    const doc = {
      legacyId,
      slug: existing?.slug ?? (await freeSlug(Book, slugify(title, `book-${legacyId}`))),
      title,
      author: str(pick(row, 'book_author', 'author')) || undefined,
      description: str(pick(row, 'description', 'book_description', 'book_desc', 'details')),
      pricePdf: price,
      priceHardcopy: paise(pick(row, 'hardbook_price', 'hard_price', 'hardcopy_price')),
      pages: num(pick(row, 'pages', 'total_pages')) ?? undefined,
      publishedYear: num(pick(row, 'published_year', 'year')) ?? undefined,
      cover: coverFile ? await copyFile('public', 'books/legacy', withFolder(coverFile, 'Books'), r) : '/Books/QR.jpg',
      pdf: pdfFile ? await copyFile('private', 'Books_pdf', withFolder(pdfFile, 'Books_pdf'), r) : undefined,
      isPublished: !/^(0|inactive|hidden|draft)$/i.test(str(pick(row, 'status', 'is_active'))),
      ...(date(pick(row, 'created_at')) ? { createdAt: date(pick(row, 'created_at')) } : {}),
    };
    if (!coverFile) r.notes.push(`book ${legacyId}: no cover column found`);
    await upsert(Book, { legacyId }, doc, r);
    if (!dryRun) map.set(legacyId, (await Book.findOne({ legacyId }, '_id'))!._id);
  }
  return map;
}

async function freeSlug(model: { exists: (f: object) => Promise<unknown> }, wanted: string): Promise<string> {
  let s = wanted;
  for (let i = 2; await model.exists({ slug: s }); i++) s = `${wanted}-${i}`;
  return s;
}

async function migrateCourses(tables: Map<string, Row[]>) {
  const t = table(tables, 'subjects', 'subject', 'courses', 'course');
  const r = report(t?.name ?? 'subjects/courses');
  const map = new Map<number, Types.ObjectId>();
  if (!t) return (r.notes.push('table not found (tried subjects, courses)'), map);
  for (const row of t.rows) {
    r.read++;
    const legacyId = id(row.id ?? row.subject_id ?? null);
    const title = str(pick(row, 'subject_name', 'title', 'name', 'course_name'));
    const price = paise(pick(row, 'price', 'subject_price', 'course_price', 'fee'));
    if (!legacyId || !title || price === null) {
      r.skipped++;
      continue;
    }
    const image = str(pick(row, 'image', 'subject_image', 'course_image', 'thumbnail', 'photo'));
    const existing = await Course.findOne({ legacyId }, 'slug image');
    const doc = {
      legacyId,
      slug: existing?.slug ?? (await freeSlug(Course, slugify(title, `course-${legacyId}`))),
      title,
      description: str(pick(row, 'description', 'subject_description', 'details')),
      image: image ? await copyFile('public', 'courses/legacy', withFolder(image, 'Courses'), r) : (existing?.image ?? '/images/learn.png'),
      price,
      discountPercent: num(pick(row, 'discount', 'discount_percent')) ?? 0,
      isPublished: !/^(0|inactive|hidden|draft)$/i.test(str(pick(row, 'status', 'is_active'))),
      ...(date(pick(row, 'created_at')) ? { createdAt: date(pick(row, 'created_at')) } : {}),
    };
    await upsert(Course, { legacyId }, doc, r);
    if (!dryRun) map.set(legacyId, (await Course.findOne({ legacyId }, '_id'))!._id);
  }
  return map;
}

async function migrateVideos(tables: Map<string, Row[]>, courses: Map<number, Types.ObjectId>) {
  const t = table(tables, 'videos', 'video', 'subject_videos', 'course_videos');
  const r = report(t?.name ?? 'videos');
  if (!t) return void r.notes.push('table not found (tried videos, subject_videos, course_videos)');
  const order = new Map<string, number>();
  for (const row of t.rows) {
    r.read++;
    const course = courses.get(id(pick(row, 'subject_id', 'course_id')) ?? -1);
    const link = str(pick(row, 'video_link', 'link', 'url', 'youtube_link', 'video_url'));
    const youtubeId = link.match(/(?:youtu\.be\/|embed\/|shorts\/|[?&]v=)([\w-]{6,20})/)?.[1] ?? (/^[\w-]{6,20}$/.test(link) ? link : null);
    if (!course || !youtubeId) {
      r.skipped++;
      if (!youtubeId && link) r.notes.push(`not a YouTube link: ${link.slice(0, 60)}`);
      continue;
    }
    const n = (order.get(String(course)) ?? 0) + 1;
    order.set(String(course), n);
    const sortOrder = num(pick(row, 'sort_order', 'position', 'order_no')) ?? n;
    await upsert(
      CourseVideo,
      { course, sortOrder },
      {
        course,
        sortOrder,
        title: str(pick(row, 'title', 'video_title', 'name')) || `Video ${n}`,
        youtubeId,
        isFree: ['1', 'yes', 'true', 'free'].includes(str(pick(row, 'is_free', 'free', 'type')).toLowerCase()),
        isPublished: true,
      },
      r,
    );
  }
  if (!dryRun) {
    for (const c of courses.values()) {
      await Course.updateOne({ _id: c }, { $set: { videoCount: await CourseVideo.countDocuments({ course: c, isPublished: true }) } });
    }
  }
}

/** Book and course payments → payments + orders + entitlements. */
async function migratePayments(
  tables: Map<string, Row[]>,
  users: Map<number, Types.ObjectId>,
  books: Map<number, Types.ObjectId>,
  courses: Map<number, Types.ObjectId>,
) {
  const ordersTable = table(tables, 'orders');
  const ordersByPayment = new Map<number, Row>();
  const ordersById = new Map<number, Row>();
  for (const o of ordersTable?.rows ?? []) {
    const pid = id(o.payment_id ?? null);
    if (pid) ordersByPayment.set(pid, o);
    const oid = id(o.id ?? null);
    if (oid) ordersById.set(oid, o);
  }

  const sources = [
    { t: table(tables, 'payments'), kind: 'book' as const },
    { t: table(tables, 'subject_payments', 'course_payments', 'payment_subjects', 'subject_purchases', 'course_purchases'), kind: 'course' as const },
  ];
  const usedOrderNumbers = new Set<string>();
  for (const { t, kind } of sources) {
    const r = report(t?.name ?? (kind === 'book' ? 'payments' : 'course payments'));
    if (!t) {
      r.notes.push(kind === 'book' ? 'table not found' : 'table not found (tried subject_payments, course_payments, …)');
      continue;
    }
    for (const row of t.rows) {
      r.read++;
      const legacyId = id(row.id ?? null);
      const user = users.get(id(row.user_id ?? null) ?? -1);
      const isCourse = kind === 'course' || Boolean(row.subject_id ?? row.course_id);
      const item = isCourse ? courses.get(id(pick(row, 'subject_id', 'course_id')) ?? -1) : books.get(id(row.book_id ?? null) ?? -1);
      if (!legacyId || !user || !item) {
        r.skipped++;
        continue;
      }
      const purchaseType = str(row.purchase_type ?? null).toLowerCase();
      const itemType = isCourse ? 'course' : purchaseType === 'hardbook' || purchaseType === 'hardcopy' ? 'book_hardcopy' : 'book_pdf';
      const status = PAYMENT_STATUS[str(pick(row, 'payment_status', 'status')).toLowerCase()] ?? 'pending';
      // payments.order_id held the order number (PDF) or orders.id (hard copy).
      const orderRow = ordersByPayment.get(legacyId) ?? ordersById.get(id(row.order_id ?? null) ?? -1);
      let orderNumber = str(orderRow?.order_number ?? null) || (/^ORD\d+/.test(str(row.order_id ?? null)) ? str(row.order_id ?? null) : '');
      if (!orderNumber || usedOrderNumbers.has(orderNumber)) {
        const created = date(row.created_at ?? null) ?? new Date();
        const stamp = new Date(created.getTime() + 5.5 * 3600 * 1000).toISOString().replace(/[-:T]/g, '').slice(0, 14);
        orderNumber = `ORD${stamp}${String(legacyId % 1000).padStart(3, '0')}`;
      }
      usedOrderNumbers.add(orderNumber);
      const shot = str(pick(row, 'screenshot', 'payment_screenshot', 'proof'));
      const scope = isCourse ? 'course' : 'book';
      const paymentDoc = {
        legacyId: isCourse ? 1_000_000 + legacyId : legacyId,
        user,
        itemType,
        item,
        amount: paise(pick(row, 'amount', 'price')) ?? 0,
        paymentMethod: ['upi', 'card', 'netbanking', 'wallet'].includes(str(row.payment_method ?? null)) ? str(row.payment_method ?? null) : 'upi',
        upiTransactionId: str(pick(row, 'transaction_id', 'txn_id', 'utr')) || `LEGACY-${scope}-${legacyId}`,
        screenshot: shot ? await copyFile('private', 'screenshots/legacy', withFolder(shot, 'uploads'), r) : `legacy-${scope}-${legacyId}`,
        status,
        orderNumber,
        ...(status !== 'pending' ? { reviewedAt: date(pick(row, 'updated_at', 'approved_at')) ?? date(row.created_at ?? null) } : {}),
        ...(date(row.created_at ?? null) ? { createdAt: date(row.created_at ?? null) } : {}),
      };
      const legacyKey = { legacyId: paymentDoc.legacyId };
      if (dryRun) {
        r.written++;
        continue;
      }
      let payment;
      try {
        payment = await Payment.findOneAndUpdate(legacyKey, { $set: paymentDoc }, { upsert: true, new: true, runValidators: true, timestamps: false });
      } catch (err) {
        if ((err as { code?: number }).code === 11000) {
          // Same UPI reference claimed twice on the old site: keep both, mark the copy.
          payment = await Payment.findOneAndUpdate(
            legacyKey,
            { $set: { ...paymentDoc, upiTransactionId: `${paymentDoc.upiTransactionId}-dup${legacyId}` } },
            { upsert: true, new: true, runValidators: true, timestamps: false },
          );
          r.notes.push(`payment ${legacyId}: duplicate transaction ID ${paymentDoc.upiTransactionId}`);
        } else throw err;
      }
      r.written++;

      if (itemType === 'book_hardcopy') {
        let address: Record<string, string> = {};
        try {
          const raw = JSON.parse(str(orderRow?.shipping_address ?? null) || '{}') as Record<string, string>;
          address = {
            fullName: raw.full_name ?? raw.fullName ?? '',
            phone: (raw.phone ?? '').replace(/\D/g, '').slice(-10),
            address: raw.address ?? '',
            city: raw.city ?? '',
            state: raw.state ?? '',
            pincode: (raw.pincode ?? '').replace(/\D/g, '').slice(0, 6),
            ...(raw.landmark ? { landmark: raw.landmark } : {}),
          };
        } catch {
          r.notes.push(`order for payment ${legacyId}: unreadable shipping address`);
        }
        const valid = /^\d{10}$/.test(address.phone ?? '') && /^\d{6}$/.test(address.pincode ?? '') && address.fullName && address.address;
        if (!valid) {
          r.notes.push(`order for payment ${legacyId}: incomplete address, kept as placeholder`);
          address = { fullName: address.fullName || 'Unknown', phone: '0000000000', address: address.address || '(see old database)', city: address.city || '-', state: address.state || '-', pincode: '000000' };
        }
        const orderStatus = ORDER_STATUS[str(orderRow?.order_status ?? null).toLowerCase()] ?? (status === 'approved' ? 'processing' : status === 'rejected' ? 'cancelled' : 'pending');
        const order = await Order.findOneAndUpdate(
          { payment: payment._id },
          {
            $set: {
              legacyId: id(orderRow?.id ?? null) ?? undefined,
              orderNumber,
              user,
              book: item,
              payment: payment._id,
              amount: paymentDoc.amount,
              shippingAddress: address,
              status: orderStatus,
            },
            $setOnInsert: { statusHistory: [{ status: orderStatus, at: date(row.created_at ?? null) ?? new Date() }] },
          },
          { upsert: true, new: true, runValidators: true },
        );
        await Payment.updateOne({ _id: payment._id }, { $set: { order: order._id } });
      }
      if (status === 'approved') {
        const grantType = itemType === 'course' ? 'course' : 'book_pdf';
        await Entitlement.updateOne(
          { user, itemType: grantType, item },
          { $setOnInsert: { user, itemType: grantType, item, payment: payment._id, grantedAt: paymentDoc.reviewedAt ?? new Date(), expiresAt: null } },
          { upsert: true },
        );
      }
    }
  }
}

/** Doctors: rows of the same person (listed once per category) become one doctor. */
async function migrateDoctors(tables: Map<string, Row[]>) {
  const t = table(tables, 'doctors', 'doctor');
  const r = report(t?.name ?? 'doctors');
  const map = new Map<number, Types.ObjectId>();
  if (!t) return (r.notes.push('table not found'), map);
  const category = (v: string) => (/mental/i.test(v) ? 'mental' : /chron/i.test(v) ? 'chronical' : 'physical');
  const groups = new Map<string, Row[]>();
  for (const row of t.rows) {
    r.read++;
    const name = str(pick(row, 'name', 'doctor_name')).replace(/^(dr\.?\s+)+/i, '');
    if (!id(row.id ?? null) || !name) {
      r.skipped++;
      continue;
    }
    const key = name.toLowerCase().replace(/\s+/g, ' ');
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  for (const rows of groups.values()) {
    const first = rows[0] as Row;
    const name = str(pick(first, 'name', 'doctor_name'))
      .replace(/^(dr\.?\s+)+/i, '')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const legacyIds = rows.map((x) => id(x.id ?? null) as number);
    const categories = [...new Map(rows.map((x) => [category(str(pick(x, 'category', 'department', 'type'))), str(pick(x, 'specialization', 'specialisation', 'diseases', 'speciality'))])).entries()].map(
      ([c, s]) => ({ category: c, specialisations: s }),
    );
    const photo = str(pick(first, 'photo', 'image', 'doctor_image', 'profile_image'));
    const cv = str(pick(first, 'cv', 'cv_file', 'resume'));
    const existing = await Doctor.findOne({ legacyIds: { $in: legacyIds } }, 'slug');
    const doc = {
      legacyIds,
      slug: existing?.slug ?? (await freeSlug(Doctor, slugify(name, `doctor-${legacyIds[0]}`))),
      name,
      categories,
      qualification: str(pick(first, 'qualification', 'degree', 'education')),
      experienceYears: num(pick(first, 'experience', 'experience_years')) ?? undefined,
      fee: paise(pick(first, 'fee', 'fees', 'consultation_fee')) ?? 0,
      bio: str(pick(first, 'description', 'bio', 'about')),
      photo: photo ? await copyFile('public', 'doctors/legacy', withFolder(photo, 'uploads/doctors'), r) : undefined,
      cv: cv ? await copyFile('private', 'cvs/legacy', withFolder(cv, 'uploads/doctors'), r) : undefined,
      rating: num(pick(first, 'rating', 'average_rating')) ?? undefined,
      isVerified: ['1', 'true', 'yes'].includes(str(pick(first, 'is_verified', 'verified')).toLowerCase()),
      availabilityText: str(pick(first, 'availability_text', 'availability')) || undefined,
    };
    if (dryRun) {
      r.written++;
      continue;
    }
    const saved = await Doctor.findOneAndUpdate({ legacyIds: { $in: legacyIds } }, { $set: doc }, { upsert: true, new: true, runValidators: true });
    for (const l of legacyIds) map.set(l, saved._id);
    r.written++;
  }
  if (groups.size < t.rows.length) r.notes.push(`${t.rows.length - groups.size} duplicate doctor rows merged`);
  return map;
}

async function migrateConsultations(tables: Map<string, Row[]>, users: Map<number, Types.ObjectId>, doctors: Map<number, Types.ObjectId>) {
  const t = table(tables, 'consultations', 'consultation', 'doctor_consultations', 'appointments');
  const r = report(t?.name ?? 'consultations');
  if (!t) return void r.notes.push('table not found');
  const time = (v: string) => (PREFERRED_TIMES as readonly string[]).find((p) => v.toLowerCase().startsWith(p)) ?? 'any';
  for (const row of t.rows) {
    r.read++;
    const legacyId = id(row.id ?? null);
    const doctor = doctors.get(id(row.doctor_id ?? null) ?? -1);
    const user = users.get(id(row.user_id ?? null) ?? -1);
    if (!legacyId || !doctor || !user) {
      r.skipped++;
      continue;
    }
    const phone = str(pick(row, 'patient_phone', 'phone')).replace(/\D/g, '').slice(-10);
    await upsert(
      Consultation,
      { legacyId },
      {
        legacyId,
        doctor,
        user,
        patientName: str(pick(row, 'patient_name', 'name')) || 'Patient',
        patientEmail: str(pick(row, 'patient_email', 'email')).toLowerCase() || 'unknown@example.com',
        patientPhone: /^\d{10}$/.test(phone) ? phone : '0000000000',
        patientAge: Math.min(120, Math.max(1, num(pick(row, 'patient_age', 'age')) ?? 1)),
        medicalIssue: str(pick(row, 'medical_issue', 'issue')) || '-',
        appointmentDate: date(pick(row, 'appointment_date', 'date')) ?? new Date(),
        preferredTime: time(str(pick(row, 'preferred_time', 'time'))),
        symptoms: str(pick(row, 'symptoms')) || '-',
        additionalNotes: str(pick(row, 'additional_notes', 'notes')) || undefined,
        consentAccepted: true,
        status: (['pending', 'confirmed', 'completed', 'cancelled'] as const).find((s) => s === str(row.status ?? null).toLowerCase()) ?? 'pending',
        ...(date(row.created_at ?? null) ? { createdAt: date(row.created_at ?? null) } : {}),
      },
      r,
    );
  }
}

async function migrateEvents(tables: Map<string, Row[]>, users: Map<number, Types.ObjectId>) {
  const t = table(tables, 'events', 'event', 'programs', 'programmes');
  const r = report(t?.name ?? 'events');
  const map = new Map<number, Types.ObjectId>();
  if (!t) {
    r.notes.push('table not found: the PHP programmes page was hard-coded; the seeded events stay');
    return;
  }
  for (const row of t.rows) {
    r.read++;
    const legacyId = id(row.id ?? null);
    const title = str(pick(row, 'title', 'event_name', 'name'));
    if (!legacyId || !title) {
      r.skipped++;
      continue;
    }
    const cat = str(pick(row, 'category', 'type')).toLowerCase();
    const image = str(pick(row, 'image', 'event_image', 'photo'));
    const existing = await Event.findOne({ legacyId }, 'slug');
    await upsert(
      Event,
      { legacyId },
      {
        legacyId,
        slug: existing?.slug ?? (await freeSlug(Event, slugify(title, `event-${legacyId}`))),
        title,
        category: cat.includes('online') ? 'online' : cat.includes('seminar') || cat.includes('workshop') ? 'seminar' : 'retreat',
        description: str(pick(row, 'description', 'details')),
        dateText: str(pick(row, 'event_date', 'date')),
        timeText: str(pick(row, 'event_time', 'time')),
        location: str(pick(row, 'location', 'venue')),
        price: paise(pick(row, 'price', 'fee')) ?? 0,
        image: image ? await copyFile('public', 'events/legacy', withFolder(image, 'assets/img/events'), r) : undefined,
        isPublished: true,
      },
      r,
    );
    if (!dryRun) map.set(legacyId, (await Event.findOne({ legacyId }, '_id'))!._id);
  }
  const b = table(tables, 'event_bookings', 'bookings', 'event_booking');
  const rb = report(b?.name ?? 'event bookings');
  if (!b) return void rb.notes.push('table not found');
  for (const row of b.rows) {
    rb.read++;
    const legacyId = id(row.id ?? null);
    const event = map.get(id(row.event_id ?? null) ?? -1);
    const phone = str(pick(row, 'phone', 'user_phone')).replace(/\D/g, '').slice(-10);
    if (!legacyId || !event) {
      rb.skipped++;
      continue;
    }
    await upsert(
      EventBooking,
      { legacyId },
      {
        legacyId,
        event,
        user: users.get(id(row.user_id ?? null) ?? -1),
        name: str(pick(row, 'name', 'user_name')) || 'Guest',
        email: str(pick(row, 'email', 'user_email')).toLowerCase() || 'unknown@example.com',
        phone: /^\d{10}$/.test(phone) ? phone : '0000000000',
        amount: paise(pick(row, 'amount', 'price')) ?? 0,
        upiTransactionId: str(pick(row, 'transaction_id', 'utr')) || `LEGACY-EVENT-${legacyId}`,
        status: (['pending', 'confirmed', 'cancelled'] as const).find((s) => s === str(row.status ?? null).toLowerCase()) ?? 'pending',
      },
      rb,
    );
  }
}

/** Migrates the SQL text of a dump (also used by the tests). */
export async function migrate(sql: string, opts: { dryRun?: boolean; legacyDir?: string } = {}) {
  dryRun = Boolean(opts.dryRun);
  legacyDir = opts.legacyDir;
  reports.length = 0;
  const tables = readDump(sql);
  await initDb();
  const users = await migrateUsers(tables);
  const books = await migrateBooks(tables);
  const courses = await migrateCourses(tables);
  await migrateVideos(tables, courses);
  await migratePayments(tables, users, books, courses);
  const doctors = await migrateDoctors(tables);
  await migrateConsultations(tables, users, doctors);
  await migrateEvents(tables, users);
  const known = new Set(reports.map((r) => r.table).concat(['orders']));
  return { tables, reports: [...reports], unknown: [...tables.keys()].filter((n) => !known.has(n)) };
}

async function main() {
  const { values } = parseArgs({
    options: { file: { type: 'string' }, 'legacy-dir': { type: 'string' }, 'dry-run': { type: 'boolean', default: false } },
  });
  if (!values.file) throw new Error('Usage: npm run migrate:mysql -- --file <dump.sql> [--legacy-dir <old site folder>] [--dry-run]');
  const dir = values['legacy-dir'] ?? env.LEGACY_SITE_DIR;
  /* eslint-disable no-console */
  if (!dir) console.log('No --legacy-dir / LEGACY_SITE_DIR: files (covers, PDFs, screenshots, photos) are not copied.');
  await connectDb(env.MONGODB_URI);
  const { tables, reports: done, unknown } = await migrate(readFileSync(values.file, 'utf8'), { dryRun: values['dry-run'], legacyDir: dir });
  console.log(`Read ${tables.size} tables: ${[...tables].map(([n, rows]) => `${n} (${rows.length})`).join(', ')}`);
  console.log(`\n${values['dry-run'] ? 'DRY RUN (nothing written)' : 'Migration finished'}:`);
  for (const r of done) {
    console.log(`  ${r.table.padEnd(22)} read ${String(r.read).padStart(5)}  written ${String(r.written).padStart(5)}  skipped ${String(r.skipped).padStart(4)}`);
    for (const note of [...new Set(r.notes)].slice(0, 15)) console.log(`      - ${note}`);
  }
  if (unknown.length) console.log(`\nTables not migrated (check whether they are needed): ${unknown.join(', ')}`);
  /* eslint-enable no-console */
}

if (require.main === module) {
  main()
    .catch((err: Error) => {
      // eslint-disable-next-line no-console
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => disconnectDb());
}
