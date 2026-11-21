import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Book } from '../src/models/Book';
import { Course } from '../src/models/Course';
import { CourseVideo } from '../src/models/CourseVideo';
import { Doctor } from '../src/models/Doctor';
import { Entitlement } from '../src/models/Entitlement';
import { Order } from '../src/models/Order';
import { Payment } from '../src/models/Payment';
import { User } from '../src/models/User';
import { migrate } from '../src/scripts/migrate-mysql';
import { parseTuples, readDump } from '../src/scripts/mysql-dump';
import { verifyBcrypt } from '../src/utils/passwords';
import { setupTestApp, teardownTestApp } from './helpers';

// A small phpMyAdmin-style export with the columns seen in the PHP code.
const DUMP = `
-- phpMyAdmin SQL Dump
/*!40101 SET NAMES utf8mb4 */;

CREATE TABLE \`users\` (
  \`id\` int(11) NOT NULL,
  \`name\` varchar(100) NOT NULL,
  \`email\` varchar(150) NOT NULL,
  \`password\` varchar(255) NOT NULL,
  \`reset_token\` varchar(64) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO \`users\` (\`id\`, \`name\`, \`email\`, \`password\`, \`reset_token\`, \`created_at\`) VALUES
(1, 'Asha Rao', 'Asha@Example.com', '5f4dcc3b5aa765d61d8327deb882cf99', NULL, '2025-10-01 10:00:00'),
(2, 'Ravi O\\'Neil', 'ravi@example.com', '$2y$10$abcdefghijklmnopqrstuuJgOV5D2jQn5h2E0QnNfQ7ZB9b2sV1i', NULL, '2025-10-02 11:00:00');

CREATE TABLE \`books\` (\`id\` int(11) NOT NULL, \`book_title\` varchar(255), \`book_author\` varchar(255), \`price\` decimal(10,2), \`description\` text, \`book_image\` varchar(255), \`book_pdf\` varchar(255));
INSERT INTO \`books\` VALUES (26, 'Patience in Life', 'Sadhaka Jamwant', 100.00, 'Line one\\r\\nLine two; with semicolon', 'book_6944e13695250.png', 'bookpdf_6944e136963a3.pdf');

CREATE TABLE \`payments\` (\`id\` int, \`user_id\` int, \`book_id\` int, \`transaction_id\` varchar(100), \`screenshot\` varchar(255), \`payment_status\` varchar(20), \`purchase_type\` varchar(20), \`amount\` decimal(10,2), \`order_id\` varchar(50), \`created_at\` datetime);
INSERT INTO \`payments\` (\`id\`, \`user_id\`, \`book_id\`, \`transaction_id\`, \`screenshot\`, \`payment_status\`, \`purchase_type\`, \`amount\`, \`order_id\`, \`created_at\`) VALUES
(1, 1, 26, 'TXN111', '1764143517_shot.jpg', 'approved', 'pdf', 100.00, 'ORD20251126101010123', '2025-11-26 10:10:10'),
(2, 2, 26, 'TXN222', '1764143518_shot.jpg', 'pending', 'hardbook', 300.00, '7', '2025-11-27 09:00:00');

CREATE TABLE \`orders\` (\`id\` int, \`order_number\` varchar(30), \`user_id\` int, \`book_id\` int, \`payment_id\` int, \`amount\` decimal(10,2), \`order_status\` varchar(20), \`shipping_address\` text);
INSERT INTO \`orders\` VALUES (7, 'ORD20251127090000456', 2, 26, 2, 300.00, 'pending', '{"full_name":"Ravi","phone":"9876543210","address":"12 MG Road","city":"Pune","state":"Maharashtra","pincode":"411001","landmark":""}');

CREATE TABLE \`subjects\` (\`id\` int, \`subject_name\` varchar(255), \`description\` text, \`image\` varchar(255), \`price\` decimal(10,2));
INSERT INTO \`subjects\` VALUES (7, 'Emotional Command', 'Desc', '1769870100_109497.png', 499.00);
CREATE TABLE \`videos\` (\`id\` int, \`subject_id\` int, \`title\` varchar(255), \`video_link\` varchar(255), \`is_free\` tinyint);
INSERT INTO \`videos\` VALUES (1, 7, 'Part 1', 'https://www.youtube.com/embed/Aye-26h2v4s', 1), (2, 7, 'Part 2', 'https://youtu.be/eiucyqkZ0KY', 0);

CREATE TABLE \`doctors\` (\`id\` int, \`name\` varchar(100), \`category\` varchar(30), \`specialization\` text, \`qualification\` varchar(50), \`experience\` int, \`fee\` int, \`photo\` varchar(255));
INSERT INTO \`doctors\` VALUES (9, 'suharidia sharma', 'chronical', 'Arthritis', 'BHMS', 5, 499, 'doctor_6978ed3abc992.jpg'), (10, 'Dr. Suharidia sharma', 'mental', 'Anxiety', 'BHMS', 5, 499, 'doctor_6978ee8eb4cc2.jpg');

CREATE TABLE \`site_visits\` (\`id\` int);
`;

beforeAll(async () => {
  await setupTestApp();
});

afterAll(async () => {
  await teardownTestApp();
});

describe('SQL dump reader', () => {
  it('parses escapes, NULL, numbers and semicolons inside strings', () => {
    expect(parseTuples("(1,'it\\'s; fine',NULL,2.5),(2,'a''b','x\\ny')")).toEqual([
      [1, "it's; fine", null, 2.5],
      [2, "a'b", 'x\ny'],
    ]);
    const tables = readDump(DUMP);
    expect(tables.get('users')?.[1]?.name).toBe("Ravi O'Neil");
    expect(tables.get('books')?.[0]?.description).toBe('Line one\r\nLine two; with semicolon');
    expect(tables.get('site_visits')).toEqual([]);
  });
});

describe('MySQL → MongoDB migration', () => {
  it('imports users, books, payments, orders, courses, videos and doctors', async () => {
    const { unknown } = await migrate(DUMP);
    expect(unknown).toEqual(['site_visits']);

    const asha = await User.findOne({ legacyId: 1 }).select('+passwordHash +legacyPasswordHash +legacyAlgo');
    expect(asha?.email).toBe('asha@example.com');
    expect(asha?.legacyAlgo).toBeUndefined();
    expect(asha?.legacyPasswordHash).toBeUndefined();
    expect(asha?.passwordHash).toBeUndefined(); // MD5 cannot be upgraded safely; user must reset.
    const ravi = await User.findOne({ legacyId: 2 }).select('+passwordHash');
    expect(ravi?.passwordHash?.startsWith('$2b$')).toBe(true);
    expect(await verifyBcrypt('x', ravi?.passwordHash ?? '')).toBe(false);

    const book = await Book.findOne({ legacyId: 26 }).select('+pdf');
    expect(book).toMatchObject({ pricePdf: 10_000, priceHardcopy: 30_000, pdf: 'Books_pdf/bookpdf_6944e136963a3.pdf' });

    const pdf = await Payment.findOne({ legacyId: 1 });
    expect(pdf).toMatchObject({ itemType: 'book_pdf', status: 'approved', amount: 10_000, orderNumber: 'ORD20251126101010123' });
    expect(await Entitlement.countDocuments({ user: asha?._id, itemType: 'book_pdf' })).toBe(1);

    const hard = await Payment.findOne({ legacyId: 2 });
    expect(hard?.itemType).toBe('book_hardcopy');
    const order = await Order.findById(hard?.order);
    expect(order).toMatchObject({ orderNumber: 'ORD20251127090000456', status: 'pending' });
    expect(order?.shippingAddress?.city).toBe('Pune');

    const course = await Course.findOne({ legacyId: 7 });
    expect(course).toMatchObject({ price: 49_900, videoCount: 2 });
    const videos = await CourseVideo.find({ course: course?._id }).sort({ sortOrder: 1 });
    expect(videos.map((v) => [v.youtubeId, v.isFree])).toEqual([
      ['Aye-26h2v4s', true],
      ['eiucyqkZ0KY', false],
    ]);

    const doctors = await Doctor.find();
    expect(doctors).toHaveLength(1);
    expect(doctors[0]?.name).toBe('Suharidia Sharma');
    expect(doctors[0]?.categories.map((c) => c.category).sort()).toEqual(['chronical', 'mental']);
    expect([...(doctors[0]?.legacyIds ?? [])].sort((a, b) => a - b)).toEqual([9, 10]);
  });

  it('is safe to run again', async () => {
    await migrate(DUMP);
    expect(await User.countDocuments({ legacyId: { $in: [1, 2] } })).toBe(2);
    expect(await Payment.countDocuments({ legacyId: { $in: [1, 2] } })).toBe(2);
    expect(await Order.countDocuments()).toBe(1);
    expect(await Doctor.countDocuments()).toBe(1);
  });

  it('writes nothing in a dry run', async () => {
    const before = await Book.countDocuments();
    const { reports } = await migrate(DUMP.replace('(26,', '(99,'), { dryRun: true });
    expect(reports.find((r) => r.table === 'books')?.written).toBe(1);
    expect(await Book.countDocuments()).toBe(before);
  });
});
