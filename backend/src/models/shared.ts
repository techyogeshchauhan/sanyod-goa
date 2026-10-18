import { Schema } from 'mongoose';

/** Shipping address for hard-copy orders (books_details.php checkout form). Was a JSON string in MySQL. */
export const addressSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, match: /^[0-9]{10}$/ },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, match: /^[0-9]{6}$/ },
    landmark: { type: String, trim: true },
  },
  { _id: false },
);
