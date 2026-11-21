/**
 * Imports what the PHP site folder holds today, before the MySQL export arrives (docs/14 D-28).
 * Safe to re-run: files are overwritten with the same key, events are upserted by slug.
 *
 *   npm run import:legacy [-- --legacy-dir D:/sanyod/sanyod.in] [--dry-run]
 *
 * Files keep the storage keys migrate-mysql uses, so the later SQL import links the same files
 * instead of copying them again:
 *   Books_pdf/*.pdf          → private Books_pdf/<name>            (every edition, incl. old uploads)
 *   uploads/payments/*       → private screenshots/legacy/<name>   (customer payment proofs)
 *   assets/img/events/*      → public  events/legacy/<name>
 *   uploads/doctors/* (CVs)  → private cvs/legacy/<name>            (photos stay in frontend/public)
 *
 * The event posters show three real programmes that are not in the seed. They are added as
 * unpublished drafts (isPublished: false, slug "poster-…") for the admin to review: the live
 * events table, with prices and dates, only comes with the SQL export.
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { connectDb, disconnectDb } from '../config/db';
import { env } from '../config/env';
import { Event } from '../models/Event';
import { importFile, type StorageArea } from '../services/storage';

const IMAGE = /\.(jpe?g|png|gif|webp)$/i;
const CV = /\.(pdf|docx?)$/i;

interface Copy {
  from: string; // folder inside the PHP site
  area: StorageArea;
  to: string; // folder inside the storage area
  accept: RegExp;
}

const COPIES: Copy[] = [
  { from: 'Books_pdf', area: 'private', to: 'Books_pdf', accept: /\.pdf$/i },
  { from: 'uploads/payments', area: 'private', to: 'screenshots/legacy', accept: IMAGE },
  { from: 'assets/img/events', area: 'public', to: 'events/legacy', accept: IMAGE },
  { from: 'uploads/doctors', area: 'private', to: 'cvs/legacy', accept: CV },
];

/** Same rule as migrate-mysql copyFile(): spaces in names become "-". */
const keyFor = (folder: string, name: string) => `${folder}/${name.replace(/\s+/g, '-')}`;

/** Programmes read from the posters in assets/img/events (Hindi text as printed). */
const POSTER_EVENTS = [
  {
    slug: 'poster-koteshwar-saat-divasiya-shivir',
    title: 'सात दिवसीय शिविर: कोटेश्वर मंदिर, ऋषिकेश',
    category: 'retreat' as const,
    description:
      'योग, ध्यान, गीता और प्रश्नोत्तर का सात दिवसीय पूर्ण आवासीय निःशुल्क शिविर। कोटेश्वर मंदिर, ऋषिकेश से 100 किमी ऊपर देवप्रयाग की ओर। केवल पुरुष वर्ग के लिए। सम्पर्क सूत्र: 6355034424',
    badge: 'Free',
    dateText: '8 नवम्बर - 15 नवम्बर',
    durationText: '7 Days',
    location: 'Koteshwar Mandir, Rishikesh (towards Devprayag)',
    image: '1765608269_retreat koteshwar.jpg',
    startDate: null,
    endDate: null,
  },
  {
    slug: 'poster-laghu-gurukulam-delhi-2026',
    title: 'लघु गुरुकुलम्: भारतीय जीवन-दृष्टि',
    category: 'seminar' as const,
    description:
      'भारतीय इतिहास, स्वास्थ्य विज्ञान, प्रकृति (निसर्ग), दर्शन और अध्यात्म के समन्वित ज्ञान से परिचय। विद्यार्थी एवं युवा, शिक्षक, प्रशिक्षक, सामाजिक कार्यकर्ता, आध्यात्मिक जिज्ञासु और जीवन में संतुलन चाहने वाले सभी के लिए। अवधि: 2 दिवस, ऑफलाइन (आवासीय / गैर-आवासीय), भाषा: हिंदी। संयोजक: आचार्य प्रदीप, 9870913720',
    badge: 'Workshop',
    dateText: '10 और 11 जनवरी 2026',
    durationText: '2 Days',
    location: 'Arya Samaj Mandir, Rajnagar-II, Palam Colony, New Delhi 110077',
    image: '1767439628_91169.jpg',
    startDate: new Date('2026-01-10T00:00:00+05:30'),
    endDate: new Date('2026-01-11T23:59:59+05:30'),
  },
  {
    slug: 'poster-yuva-gurukulam-online-15-din',
    title: 'Yuva Gurukulam: 15 दिवसीय निःशुल्क ऑनलाइन कार्यक्रम',
    category: 'online' as const,
    description:
      'BANSY कार्यक्रम: भारत (इतिहास, संस्कृति), आयुर्वेद (स्वास्थ्य, आहार, दिनचर्या), निसर्ग (प्रकृति, पंचमहाभूत), सांख्य/साइंस और योग (प्राणायाम, ध्यान)। 15 दिन, लगातार 15 सत्र, प्रतिदिन 40 मिनट। छात्र-छात्राएँ, युवा एवं महिलाएँ, गृहस्थ एवं सेवानिवृत्तजन, सभी के लिए। पूर्णतः निःशुल्क।',
    badge: 'Online',
    dateText: 'Online',
    timeText: 'प्रतिदिन 40 मिनट',
    durationText: '15 Days',
    location: 'Online',
    image: '1785375009_233839.jpg',
    startDate: null,
    endDate: null,
  },
];

async function main() {
  const { values } = parseArgs({ options: { 'legacy-dir': { type: 'string' }, 'dry-run': { type: 'boolean', default: false } } });
  const legacyDir = values['legacy-dir'] ?? env.LEGACY_SITE_DIR;
  const dryRun = values['dry-run'] ?? false;
  if (!legacyDir || !existsSync(legacyDir)) throw new Error(`PHP site folder not found: ${legacyDir ?? '(set LEGACY_SITE_DIR or --legacy-dir)'}`);

  const log = (s: string) => console.log(s); // eslint-disable-line no-console
  log(`${dryRun ? '[dry run] ' : ''}Importing files from ${legacyDir}`);

  for (const c of COPIES) {
    const dir = path.join(legacyDir, c.from);
    if (!existsSync(dir)) {
      log(`  ${c.from}: folder missing, skipped`);
      continue;
    }
    const names = readdirSync(dir).filter((n) => c.accept.test(n) && statSync(path.join(dir, n)).isFile());
    let copied = 0;
    for (const name of names) {
      if (dryRun || (await importFile(c.area, keyFor(c.to, name), path.join(dir, name)))) copied++;
    }
    log(`  ${c.from} → ${c.area}/${c.to}: ${copied} of ${names.length} files`);
  }

  if (dryRun) {
    log(`  events: ${POSTER_EVENTS.length} poster drafts would be upserted`);
    return;
  }
  await connectDb(env.MONGODB_URI);
  for (const { image, ...e } of POSTER_EVENTS) {
    await Event.updateOne(
      { slug: e.slug },
      // Content is refreshed on every run; publishing stays the admin's decision.
      { $set: { ...e, price: 0, ctaLabel: e.category === 'online' ? 'Enroll Now' : 'Book Now', image: keyFor('events/legacy', image) }, $setOnInsert: { isPublished: false } },
      { upsert: true, runValidators: true },
    );
  }
  log(`  events: ${POSTER_EVENTS.length} poster drafts upserted (unpublished)`);
}

main()
  .catch((err: Error) => {
    console.error(err); // eslint-disable-line no-console
    process.exitCode = 1;
  })
  .finally(() => disconnectDb());
