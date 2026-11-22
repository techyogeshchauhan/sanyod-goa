// Admin API data shapes (money in paise, dates as ISO strings).
import type { AdminRole } from './auth';
import type {
  Address,
  BookingStatus,
  ConsultationStatus,
  DoctorCategory,
  EventCategory,
  ItemType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PreferredTime,
} from './catalog';

export interface DashboardStats {
  users: number;
  newUsersThisMonth: number;
  pendingPayments: Record<ItemType, number>;
  ordersByStatus: Record<OrderStatus, number>;
  pendingConsultations: number;
  pendingBookings: number;
  newMessages: number;
  revenueThisMonth: number;
  revenueTotal: number;
  recentPayments: AdminPayment[];
}

export interface UserRef {
  id: string;
  name: string;
  email: string;
}

export interface AdminPayment {
  id: string;
  orderNumber: string;
  user: UserRef | null;
  itemType: ItemType;
  itemId: string;
  itemTitle: string;
  amount: number;
  paymentMethod: PaymentMethod;
  upiTransactionId: string;
  status: PaymentStatus;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  orderId: string | null;
  shippingAddress: Address | null;
  createdAt: string;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  user: UserRef | null;
  bookTitle: string;
  amount: number;
  paymentStatus: PaymentStatus | null;
  paymentId: string;
  status: OrderStatus;
  courier: string | null;
  trackingNumber: string | null;
  shippingAddress: Address;
  statusHistory: { status: OrderStatus; at: string }[];
  createdAt: string;
}

export interface AdminBook {
  id: string;
  legacyId: number | null;
  slug: string;
  title: string;
  author: string;
  description: string;
  category: string;
  language: string;
  isFeatured: boolean;
  pricePdf: number | null;
  priceHardcopy: number | null;
  hardcopyAvailable: boolean;
  pages: number | null;
  publishedYear: number | null;
  rating: number | null;
  reviewCount: number | null;
  cover: string;
  hasPdf: boolean;
  isPublished: boolean;
  sortOrder: number;
  sales: number;
  createdAt: string;
}

export interface AdminCourse {
  id: string;
  legacyId: number | null;
  slug: string;
  title: string;
  description: string;
  image: string;
  price: number;
  discountPercent: number;
  level: string;
  hasCertificate: boolean;
  popularRank: number | null;
  videoCount: number;
  isPublished: boolean;
  sortOrder: number;
  students: number;
  createdAt: string;
}

export interface AdminVideo {
  id: string;
  title: string;
  youtubeId: string;
  isFree: boolean;
  durationSec: number | null;
  isPublished: boolean;
  sortOrder: number;
}

export interface AdminDoctor {
  id: string;
  legacyIds: number[];
  slug: string;
  name: string;
  categories: { category: DoctorCategory; specialisations: string }[];
  qualification: string;
  experienceYears: number | null;
  fee: number;
  bio: string;
  photo: string | null;
  hasCv: boolean;
  rating: number | null;
  isVerified: boolean;
  availabilityText: string;
  isActive: boolean;
  sortOrder: number;
}

export interface AdminConsultation {
  id: string;
  doctorId: string;
  doctorName: string;
  user: UserRef | null;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientAge: number;
  medicalIssue: string;
  appointmentDate: string;
  preferredTime: PreferredTime;
  symptoms: string;
  additionalNotes: string | null;
  status: ConsultationStatus;
  adminNotes: string | null;
  createdAt: string;
}

export interface AdminEvent {
  id: string;
  legacyId: number | null;
  slug: string;
  title: string;
  category: EventCategory;
  description: string;
  badge: string;
  startDate: string | null;
  dateText: string;
  timeText: string;
  durationText: string;
  location: string;
  price: number;
  image: string | null;
  capacity: number | null;
  enrolledCount: number;
  rating: number | null;
  ctaLabel: 'Book Now' | 'Enroll Now';
  isPublished: boolean;
  sortOrder: number;
  bookings: number;
}

export interface AdminBooking {
  id: string;
  eventId: string;
  eventTitle: string;
  user: UserRef | null;
  name: string;
  email: string;
  phone: string;
  amount: number;
  upiTransactionId: string;
  status: BookingStatus;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  legacyId: number | null;
  name: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  payments: number;
}

export interface AdminUserDetail extends AdminUser {
  purchases: AdminPayment[];
  entitlements: { id: string; itemType: 'book_pdf' | 'course'; itemId: string; itemTitle: string; grantedAt: string }[];
  consultations: number;
  bookings: number;
}

export interface AdminMessage {
  id: string;
  kind: 'contact' | 'guidance';
  name: string;
  email: string;
  subject: string;
  body: string;
  details: Record<string, string>;
  status: 'new' | 'read' | 'replied';
  createdAt: string;
}

export interface AdminSubscriber {
  id: string;
  email: string;
  isActive: boolean;
  subscribedAt: string;
}

export interface AdminSettings {
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
  adminNotifyEmail: string;
}

export interface AdminAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  adminUsername: string;
  action: string;
  entity: string;
  entityId: string | null;
  /** What changed (e.g. { status: 'approved' }); null for older entries. */
  details: Record<string, unknown> | null;
  createdAt: string;
}
