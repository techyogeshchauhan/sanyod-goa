import type { ConsultationInput, EventBookingInput } from '@shared/schemas/purchases';
import type {
  Address,
  BookDetailResponse,
  BookSummary,
  ConsultationSummary,
  CourseDetailResponse,
  CourseVideo,
  DoctorDetail,
  DoctorSummary,
  EventBookingSummary,
  EventSummary,
  ItemType,
  LibraryBook,
  LibraryCourse,
  OrderSummary,
  PaymentCreated,
  PaymentMethod,
  PaymentSummary,
  PublicSettings,
} from '@shared/types/catalog';
import { api, unwrap } from './client';

type Message = { id: string; message: string };

export interface PaymentRequest {
  itemType: ItemType;
  itemSlug: string;
  upiTransactionId: string;
  screenshot: File;
  paymentMethod?: PaymentMethod;
  shippingAddress?: Address;
}

export const settingsApi = {
  public: () => unwrap<PublicSettings>(api.get('/settings/public')),
};

export const booksApi = {
  list: () => unwrap<BookSummary[]>(api.get('/books')),
  get: (slug: string) => unwrap<BookDetailResponse>(api.get(`/books/${encodeURIComponent(slug)}`)),
};

export const paymentsApi = {
  /** Multipart: the screenshot travels with the form. The server prices the item. */
  create: (input: PaymentRequest) => {
    const form = new FormData();
    form.append('itemType', input.itemType);
    form.append('itemSlug', input.itemSlug);
    form.append('upiTransactionId', input.upiTransactionId);
    if (input.paymentMethod) form.append('paymentMethod', input.paymentMethod);
    if (input.shippingAddress) form.append('shippingAddress', JSON.stringify(input.shippingAddress));
    form.append('screenshot', input.screenshot);
    return unwrap<PaymentCreated>(api.post('/payments', form));
  },
  mine: () => unwrap<PaymentSummary[]>(api.get('/payments')),
  get: (id: string) => unwrap<PaymentSummary>(api.get(`/payments/${encodeURIComponent(id)}`)),
};

export const ordersApi = {
  mine: () => unwrap<OrderSummary[]>(api.get('/orders')),
};

export const libraryApi = {
  books: () => unwrap<LibraryBook[]>(api.get('/library/books')),
  book: (slug: string) => unwrap<LibraryBook>(api.get(`/library/books/${encodeURIComponent(slug)}`)),
  courses: () => unwrap<LibraryCourse[]>(api.get('/library/courses')),
  /** Same-origin URL of the PDF stream (inline for reading, attachment for download). */
  pdfUrl: (slug: string, download = false) =>
    `${import.meta.env.VITE_API_URL ?? '/api'}/library/books/${encodeURIComponent(slug)}/pdf${download ? '?download=1' : ''}`,
};

export const courseDetailApi = {
  get: (slug: string) => unwrap<CourseDetailResponse>(api.get(`/courses/${encodeURIComponent(slug)}`)),
  videos: (slug: string) => unwrap<CourseVideo[]>(api.get(`/courses/${encodeURIComponent(slug)}/videos`)),
};

export const healthApi = {
  doctors: () => unwrap<DoctorSummary[]>(api.get('/doctors')),
  doctor: (slug: string) => unwrap<DoctorDetail>(api.get(`/doctors/${encodeURIComponent(slug)}`)),
  cvUrl: (slug: string) => `${import.meta.env.VITE_API_URL ?? '/api'}/doctors/${encodeURIComponent(slug)}/cv`,
  consult: (input: ConsultationInput) => unwrap<Message>(api.post('/consultations', input)),
  myConsultations: () => unwrap<ConsultationSummary[]>(api.get('/consultations')),
};

export const eventsApi = {
  list: () => unwrap<EventSummary[]>(api.get('/events')),
  book: (input: EventBookingInput) => unwrap<Message>(api.post('/event-bookings', input)),
  myBookings: () => unwrap<EventBookingSummary[]>(api.get('/event-bookings')),
};
