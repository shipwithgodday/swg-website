# Booking System

A modern booking system built with Next.js that uses MongoDB for data storage.

## Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env.local` file with the following variables:

```
# MongoDB Connection String
MONGODB_URI=mongodb+srv://username:password@cluster0.example.mongodb.net/bookings?retryWrites=true&w=majority

# Email service API key (if used)
EMAIL_API_KEY=your_email_api_key

# Web3Forms Access Key
NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY=your_web3forms_access_key
```

4. Replace the MongoDB connection string with your actual MongoDB connection string
5. Run the development server with `npm run dev`

## MongoDB Setup

1. Create a MongoDB Atlas account or use an existing MongoDB database
2. Create a new database called `bookings`
3. The application will automatically create the necessary collections when it first runs

## Database Schema

The application uses the following collection in MongoDB:

### Bookings Collection

- `date`: Date of the booking (YYYY-MM-DD format)
- `time`: Time slot for the booking
- `fullName`: Customer's full name
- `phoneNumber`: Customer's phone number
- `email`: Customer's email address
- `organization`: (Optional) Customer's organization
- `desiredService`: Service requested
- `meetingType`: Type of meeting requested
- `createdAt`: (Auto-generated) When the booking was created
- `updatedAt`: (Auto-generated) When the booking was last updated

## Available Time Slots

Time slots are defined in the `app/actions/getAvailableTimes.ts` file and can be modified as needed.

## Features

- Booking system with date and time slot selection
- Client-side caching of availability data
- MongoDB database for persistent storage
- Email confirmation (via configured email service)
- Calendar integration (Google Calendar links)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
