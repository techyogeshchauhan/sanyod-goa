// Public API data shapes (money always in paise, dates as ISO strings).
import type {
  BOOKING_STATUSES,
  CONSULTATION_STATUSES,
  DOCTOR_CATEGORIES,
  EVENT_CATEGORIES,
  ITEM_TYPES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  PREFERRED_TIMES,
} from '../constants';
import type { CourseSummary } from './course';

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type ItemType = (typeof ITEM_TYPES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type DoctorCategory = (typeof DOCTOR_CATEGORIES)[number];
export type EventCategory = (typeof EVENT_CATEGORIES)[number];
export type ConsultationStatus = (typeof CONSULTATION_STATUSES)[number];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type PreferredTime = (typeof PREFERRED_TIMES)[number];

export interface Address {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface PublicSettings {
  upiIdDefault: string;
  upiIdPdf: string;
  upiIdHardcopy: string;
  qrImageBooks: string;
  qrImageCourses: string;
  contactEmail: string;
  contactPhone: string;
  location: string;
  workingHours: { label: string; value: string }[];
  socialLinks: { facebook: string; twitter: string; instagram: string; linkedin: string };
}

// ---- Books -------------------------------------------------------------

export interface BookSummary {
  id: string;
  legacyId: number | null;
  slug: string;
  title: string;
  author: string;
  cover: string;
  category: string;
  language: string;
  isFeatured: boolean;
}

export interface BookDetail extends BookSummary {
  description: string;
  pricePdf: number | null;
  priceHardcopy: number | null;
  hardcopyAvailable: boolean;
  pages: number | null;
  publishedYear: number | null;
  rating: number | null;
  reviewCount: number | null;
  /** True when at least one available format has a price. */
  purchasable: boolean;
}

/** Latest purchase of each type by the logged-in user (null = never bought). */
export interface BookPurchaseStatus {
  pdf: PaymentStatus | null;
  hardcopy: PaymentStatus | null;
  hardcopyOrderStatus: OrderStatus | null;
  /** Approved PDF or hard copy: the PDF can be read. */
  canRead: boolean;
}

export interface BookDetailResponse {
  book: BookDetail;
  purchase: BookPurchaseStatus | null;
}

// ---- Payments / orders -----------------------------------------------------

export interface PaymentSummary {
  id: string;
  orderNumber: string;
  itemType: ItemType;
  itemTitle: string;
  itemSlug: string | null;
  amount: number;
  paymentMethod: PaymentMethod;
  upiTransactionId: string;
  status: PaymentStatus;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface PaymentCreated {
  payment: PaymentSummary;
  emailSent: boolean;
}

export interface OrderSummary extends PaymentSummary {
  /** Shipping progress of a hard copy (null for digital items). */
  orderStatus: OrderStatus | null;
  courier: string | null;
  trackingNumber: string | null;
  shippingAddress: Address | null;
  cover: string | null;
}

// ---- Library ---------------------------------------------------------------

export interface LibraryBook extends BookDetail {
  purchasedAt: string;
  /** The order that granted access. */
  orderNumber: string | null;
  fileSizeBytes: number | null;
}

export interface LibraryCourse extends CourseSummary {
  purchasedAt: string;
  expiresAt: string | null;
}

// ---- Courses ---------------------------------------------------------------

export interface CourseDetail extends CourseSummary {
  description: string;
}

export interface CoursePurchaseStatus {
  status: PaymentStatus | null;
  canWatch: boolean;
}

export interface CourseDetailResponse {
  course: CourseDetail;
  purchase: CoursePurchaseStatus | null;
}

export interface CourseVideo {
  id: string;
  order: number;
  title: string;
  isFree: boolean;
  durationSec: number | null;
  canAccess: boolean;
  /** Only sent when the viewer may watch the video. */
  youtubeId?: string;
}

// ---- Health ----------------------------------------------------------------

export interface DoctorSummary {
  id: string;
  legacyIds: number[];
  slug: string;
  name: string;
  categories: { category: DoctorCategory; specialisations: string }[];
  qualification: string;
  experienceYears: number | null;
  fee: number;
  photo: string | null;
  rating: number | null;
  isVerified: boolean;
  availabilityText: string;
}

export interface DoctorDetail extends DoctorSummary {
  bio: string;
  hasCv: boolean;
}

export interface ConsultationSummary {
  id: string;
  doctorName: string;
  medicalIssue: string;
  appointmentDate: string;
  preferredTime: PreferredTime;
  status: ConsultationStatus;
  createdAt: string;
}

// ---- Programmes ------------------------------------------------------------

export interface EventSummary {
  id: string;
  legacyId: number | null;
  slug: string;
  title: string;
  category: EventCategory;
  description: string;
  badge: string;
  dateText: string;
  timeText: string;
  durationText: string;
  location: string;
  price: number;
  image: string | null;
  enrolledCount: number;
  rating: number | null;
  ctaLabel: string;
}

export interface EventBookingSummary {
  id: string;
  eventTitle: string;
  dateText: string;
  amount: number;
  upiTransactionId: string;
  status: BookingStatus;
  createdAt: string;
}
