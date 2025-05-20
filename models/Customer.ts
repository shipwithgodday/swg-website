import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for a customer document
export interface ICustomer extends Document {
  fullName: string;
  email: string;
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create the customer schema
const CustomerSchema: Schema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
  },
  { timestamps: true }
);

// Add an index on email to ensure uniqueness
CustomerSchema.index({ email: 1 }, { unique: true });

export default mongoose.models.Customer ||
  mongoose.model<ICustomer>('Customer', CustomerSchema);
