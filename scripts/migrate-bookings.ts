import mongoose from 'mongoose';
import { db } from '../lib/db';
import { bookings } from '../lib/db/schema';

const MONGODB_URI = process.env.MONGODB_URI;

const BookingSchema = new mongoose.Schema(
  {
    date: String,
    time: String,
    fullName: String,
    phoneNumber: String,
    whatsappNumber: String,
    email: String,
    organization: String,
    desiredService: String,
    meetingType: String,
  },
  { timestamps: true }
);

interface MongoBooking {
  date: string;
  time: string;
  fullName: string;
  phoneNumber: string;
  whatsappNumber?: string;
  email: string;
  organization?: string;
  desiredService: string;
  meetingType: string;
  createdAt?: Date;
  updatedAt?: Date;
}

async function main() {
  if (!MONGODB_URI) {
    console.log('MONGODB_URI not set — nothing to migrate.');
    process.exit(0);
  }

  await mongoose.connect(MONGODB_URI);
  const BookingModel =
    mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

  const docs = (await BookingModel.find({}).lean()) as unknown as MongoBooking[];
  console.log(`Found ${docs.length} MongoDB bookings.`);

  let inserted = 0;
  let skipped = 0;

  for (const d of docs) {
    try {
      await db.insert(bookings).values({
        date: d.date,
        time: d.time,
        fullName: d.fullName,
        phoneNumber: d.phoneNumber ?? '',
        whatsappNumber: d.whatsappNumber ?? null,
        email: d.email,
        organization: d.organization ?? null,
        desiredService: d.desiredService,
        meetingType: d.meetingType,
        createdAt: d.createdAt ? new Date(d.createdAt) : undefined,
        updatedAt: d.updatedAt ? new Date(d.updatedAt) : undefined,
      });
      inserted++;
    } catch (e) {
      if ((e as { code?: string }).code === '23505') {
        skipped++;
        continue;
      }
      throw e;
    }
  }

  console.log(`Inserted ${inserted}, skipped ${skipped} duplicate (date,time).`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
