import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for a booking document
export interface IBooking extends Document {
  date: string;
  time: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  organization?: string;
  desiredService: string;
  meetingType: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create the booking schema
const BookingSchema: Schema = new Schema(
  {
    date: { type: String, required: true },
    time: { type: String, required: true },
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    organization: { type: String },
    desiredService: { type: String, required: true },
    meetingType: { type: String, required: true },
  },
  { timestamps: true }
);

// Add a compound index on date and time to ensure uniqueness
BookingSchema.index({ date: 1, time: 1 }, { unique: true });

// Create and export the model
export default mongoose.models.Booking ||
  mongoose.model<IBooking>('Booking', BookingSchema);
