import type { Types } from 'mongoose';
import type { BookDoc } from '../../models/Book';
import type { DoctorDoc } from '../../models/Doctor';
import type { EventDoc } from '../../models/Event';
import type { OrderDoc } from '../../models/Order';
import type { PaymentDoc } from '../../models/Payment';
import type {
  Address,
  BookDetail,
  BookSummary,
  DoctorDetail,
  DoctorSummary,
  EventSummary,
  OrderSummary,
  PaymentSummary,
} from '../../shared/types/catalog';
import { publicUrl } from '../../services/storage';

const iso = (d: Date | null | undefined) => (d ? new Date(d).toISOString() : null);

export function toBookSummary(b: BookDoc): BookSummary {
  return {
    id: String(b._id),
    legacyId: b.legacyId ?? null,
    slug: b.slug,
    title: b.title,
    author: b.author ?? '',
    cover: publicUrl(b.cover) ?? '',
    category: b.category ?? '',
    language: b.language ?? '',
    isFeatured: b.isFeatured ?? false,
  };
}

export function toBookDetail(b: BookDoc): BookDetail {
  return {
    ...toBookSummary(b),
    description: b.description ?? '',
    pricePdf: b.pricePdf ?? null,
    priceHardcopy: b.priceHardcopy ?? null,
    hardcopyAvailable: b.hardcopyAvailable ?? true,
    pages: b.pages ?? null,
    publishedYear: b.publishedYear ?? null,
    rating: b.rating ?? null,
    reviewCount: b.reviewCount ?? null,
    purchasable: b.pricePdf != null || (b.hardcopyAvailable !== false && b.priceHardcopy != null),
  };
}

export function toAddress(a: unknown): Address | null {
  if (!a || typeof a !== 'object') return null;
  const v = a as Record<string, string | undefined>;
  return {
    fullName: v.fullName ?? '',
    phone: v.phone ?? '',
    address: v.address ?? '',
    city: v.city ?? '',
    state: v.state ?? '',
    pincode: v.pincode ?? '',
    ...(v.landmark ? { landmark: v.landmark } : {}),
  };
}

/** `item` may be populated (Book/Course doc) or a bare id. */
type PopulatedItem = { _id: Types.ObjectId; title?: string; slug?: string; cover?: string; image?: string } | Types.ObjectId | null;

function itemInfo(item: PopulatedItem) {
  if (item && typeof item === 'object' && 'title' in item) {
    return { title: item.title ?? '', slug: item.slug ?? null, image: publicUrl(item.cover ?? item.image ?? null) };
  }
  return { title: '(removed item)', slug: null, image: null };
}

export function toPaymentSummary(p: PaymentDoc): PaymentSummary {
  const info = itemInfo(p.item as unknown as PopulatedItem);
  return {
    id: String(p._id),
    orderNumber: p.orderNumber,
    itemType: p.itemType,
    itemTitle: info.title,
    itemSlug: info.slug,
    amount: p.amount,
    paymentMethod: p.paymentMethod ?? 'upi',
    upiTransactionId: p.upiTransactionId,
    status: p.status ?? 'pending',
    rejectionReason: p.rejectionReason ?? null,
    createdAt: iso((p as unknown as { createdAt: Date }).createdAt) ?? '',
    reviewedAt: iso(p.reviewedAt),
  };
}

export function toOrderSummary(p: PaymentDoc, order: OrderDoc | null): OrderSummary {
  const info = itemInfo(p.item as unknown as PopulatedItem);
  return {
    ...toPaymentSummary(p),
    orderStatus: order?.status ?? null,
    courier: order?.courier ?? null,
    trackingNumber: order?.trackingNumber ?? null,
    shippingAddress: toAddress(order?.shippingAddress ?? p.shippingAddress),
    cover: info.image,
  };
}

export function toDoctorSummary(d: DoctorDoc): DoctorSummary {
  return {
    id: String(d._id),
    legacyIds: d.legacyIds ?? [],
    slug: d.slug,
    name: d.name,
    categories: (d.categories ?? []).map((c) => ({ category: c.category, specialisations: c.specialisations ?? '' })),
    qualification: d.qualification ?? '',
    experienceYears: d.experienceYears ?? null,
    fee: d.fee,
    photo: publicUrl(d.photo),
    rating: d.rating ?? null,
    isVerified: d.isVerified ?? false,
    availabilityText: d.availabilityText ?? '',
  };
}

export function toDoctorDetail(d: DoctorDoc): DoctorDetail {
  return { ...toDoctorSummary(d), bio: d.bio ?? '', hasCv: Boolean(d.cv) };
}

export function toEventSummary(e: EventDoc): EventSummary {
  return {
    id: String(e._id),
    legacyId: e.legacyId ?? null,
    slug: e.slug,
    title: e.title,
    category: e.category,
    description: e.description ?? '',
    badge: e.badge ?? '',
    dateText: e.dateText ?? '',
    timeText: e.timeText ?? '',
    durationText: e.durationText ?? '',
    location: e.location ?? '',
    price: e.price,
    image: publicUrl(e.image),
    enrolledCount: e.enrolledCount ?? 0,
    rating: e.rating ?? null,
    ctaLabel: e.ctaLabel ?? 'Book Now',
  };
}
