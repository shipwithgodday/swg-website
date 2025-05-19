import { NextRequest, NextResponse } from 'next/server';
import mailjet from '@/lib/mailjet';

export async function POST(req: NextRequest) {
  try {
    const { recipients, subject, content } = await req.json();

    if (
      !recipients ||
      !subject ||
      !content ||
      !Array.isArray(recipients) ||
      recipients.length === 0
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Format recipients for MailJet
    const formattedRecipients = recipients.map((email) => ({
      Email: email,
    }));

    // Send email using MailJet
    const response = await mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: process.env.EMAIL_FROM || 'noreply@example.com',
              Name: process.env.EMAIL_FROM_NAME || 'Notification',
            },
            To: [
              {
                Email:
                  process.env.EMAIL_FROM ||
                  'shipwithgodday@gmail.com',
                Name:
                  process.env.EMAIL_FROM_NAME || 'Ship with Godday',
              },
            ],
            Bcc: formattedRecipients,
            Subject: subject,
            HTMLPart: content,
          },
        ],
      });

    return NextResponse.json({
      success: true,
      message: 'Emails sent successfully',
      details: response.body,
    });
  } catch (error) {
    console.error('Error sending emails:', error);
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    );
  }
}
