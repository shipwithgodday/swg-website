import { NextResponse } from 'next/server';
import { EmailTemplate } from '@/components/EmailTemplate';
import resend from '@/lib/emails';

export async function POST(req: Request) {
  try {
    const { to, firstName, bookingDetails, clientCalendarLinks } =
      await req.json();

    new Promise(async () => {
      try {
        await resend.emails.send({
          from: 'Ship With Godday <info@shipwithgodday.com>',
          to: [to],
          subject: 'Booking Confirmation',
          react: EmailTemplate({
            firstName,
            bookingDetails,
            clientCalendarLinks,
          }),
        });
      } catch (error) {
        console.error('Background email error:', error);
      }
    });

    // Return immediate response
    return NextResponse.json({
      success: true,
      message: 'Booking confirmed! Email is being sent...',
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
