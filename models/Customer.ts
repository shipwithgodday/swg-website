import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for a customer document
export interface ICustomer extends Document {
  fullName: string;
  email: string;
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

// `unique: true` on the field already creates a unique index, so no
// explicit `schema.index({ email: 1 }, { unique: true })` is needed —
// declaring both is what Mongoose warns about with 'Duplicate schema
// index on {"email":1}'.
const CustomerSchema: Schema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Customer ||
  mongoose.model<ICustomer>('Customer', CustomerSchema);
