// Pure constants shared by backend and frontend (no Node APIs here).

export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 72; // bcrypt input limit (bytes)
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;

export const RESET_TOKEN_TTL_MINUTES = 60;

export const ORDER_NUMBER_PREFIX = 'ORD';

export const CSRF_COOKIE_NAME = 'sanyod.csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

export const ADMIN_ROLES = ['admin', 'superadmin'] as const;
export const PAYMENT_STATUSES = ['pending', 'approved', 'rejected'] as const;
export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
/** Products bought through the UPI + screenshot flow. Events are booked separately (EventBooking). */
export const ITEM_TYPES = ['book_pdf', 'book_hardcopy', 'course'] as const;
/** What an approved payment unlocks (a hard copy also unlocks the PDF). */
export const ENTITLEMENT_TYPES = ['book_pdf', 'course'] as const;
export const DOCTOR_CATEGORIES = ['physical', 'mental', 'chronical'] as const;
export const EVENT_CATEGORIES = ['retreat', 'seminar', 'online'] as const;
export const PREFERRED_TIMES = ['morning', 'afternoon', 'evening', 'any'] as const;
export const CONSULTATION_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'] as const;
export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled'] as const;
export const PAYMENT_METHODS = ['upi', 'card', 'netbanking', 'wallet'] as const;
export const MESSAGE_STATUSES = ['new', 'read', 'replied'] as const;
/** Labels of the "Preferred Consultation Time" select on doctor_detail.php. */
export const PREFERRED_TIME_LABELS: Record<(typeof PREFERRED_TIMES)[number], string> = {
  morning: 'Morning (9 AM - 12 PM)',
  afternoon: 'Afternoon (12 PM - 4 PM)',
  evening: 'Evening (4 PM - 8 PM)',
  any: 'Any time',
};
/** State list of the books_details.php shipping form. */
export const SHIPPING_STATES = [
  'Delhi',
  'Maharashtra',
  'Karnataka',
  'Tamil Nadu',
  'Uttar Pradesh',
  'Gujarat',
  'Rajasthan',
  'West Bengal',
  'Punjab',
  'Haryana',
] as const;
export const PREFERRED_MENTORS = ['swami', 'priya', 'rajan', 'any'] as const;
