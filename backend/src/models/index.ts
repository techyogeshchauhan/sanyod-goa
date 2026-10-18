// Registers every model so scripts (init-db, seed) and tests see the full schema.
export { Admin } from './Admin';
export { AuditLog } from './AuditLog';
export { Book } from './Book';
export { Consultation } from './Consultation';
export { Course } from './Course';
export { CourseVideo } from './CourseVideo';
export { Doctor } from './Doctor';
export { Entitlement } from './Entitlement';
export { Event } from './Event';
export { EventBooking } from './EventBooking';
export { ContactMessage, GuidanceRequest, NewsletterSubscriber } from './FormSubmissions';
export { Order } from './Order';
export { Payment } from './Payment';
export { Settings } from './Settings';
export { User } from './User';
