import {
  Body,
  Container,
  Column,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
  Button,
} from '@react-email/components';
import { format, parse } from 'date-fns';
import * as React from 'react';

interface BookingDetails {
  date: string;
  time: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  organization?: string;
  desiredService?: string;
  meetingType?: string;
}

interface EmailTemplateProps {
  firstName: string;
  bookingDetails: BookingDetails;
  clientCalendarLinks: {
    google?: string;
    outlook?: string;
  };
  isOwnerNotification?: boolean;
}

// Generate a Google Meet link (this would ideally come from your API or environment variables)
const GOOGLE_MEET_LINK = 'https://meet.google.com/wio-bcev-gmk';

// Email template styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
};

const logo = {
  margin: '0 auto',
};

const logoImage = {
  margin: '0 auto',
};

const sectionsBorders = {
  width: '100%',
  borderBottom: '1px solid #e6ebf1',
  borderLeft: '1px solid #e6ebf1',
  borderRight: '1px solid #e6ebf1',
};

const sectionBorder = {
  borderBottom: '1px solid #e6ebf1',
  borderLeft: '1px solid #e6ebf1',
  borderRight: '1px solid #e6ebf1',
};

const sectionCenter = {
  borderBottom: '1px solid #e6ebf1',
  borderLeft: '1px solid #e6ebf1',
  borderRight: '1px solid #e6ebf1',
};

const content = {
  padding: '0 40px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#333333',
};

const link = {
  color: '#2754C5',
  textDecoration: 'underline',
};

export const EmailTemplate = ({
  firstName,
  bookingDetails,
  clientCalendarLinks,
  isOwnerNotification = false,
}: EmailTemplateProps) => {
  // Parse the date string to a Date object
  const bookingDate = parse(
    bookingDetails.date,
    'yyyy-MM-dd',
    new Date()
  );

  // Format date for display
  const formattedDate = format(bookingDate, 'EEEE, MMMM d, yyyy');

  // Check if meeting is online
  const isOnlineMeeting = bookingDetails.meetingType === 'Online';

  return (
    <Html>
      <Head />
      <Preview>
        {isOwnerNotification
          ? 'New Booking Notification'
          : 'Your consultation with Lucky Godday Business Services is confirmed'}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logo as React.CSSProperties}>
            <Img
              style={logoImage}
              width={114}
              src="https://joels-pic-bucket.s3.us-east-2.amazonaws.com/logo.png"
            />
          </Section>
          <Section style={sectionsBorders}>
            <Row>
              <Column style={sectionBorder} />
              <Column style={sectionCenter} />
              <Column style={sectionBorder} />
            </Row>
          </Section>

          <Section style={content}>
            {isOwnerNotification ? (
              <>
                <Text style={paragraph}>
                  <strong>New Booking Notification</strong>
                </Text>
                <Text style={paragraph}>
                  A new booking has been made with the following
                  details:
                </Text>
                <Text style={paragraph}>
                  <strong>Client Information:</strong>
                  <br />
                  Name: {bookingDetails.fullName}
                  <br />
                  Email: {bookingDetails.email}
                  <br />
                  Phone: {bookingDetails.phoneNumber}
                  {bookingDetails.organization && (
                    <>
                      <br />
                      Organization: {bookingDetails.organization}
                    </>
                  )}
                </Text>
                <Text style={paragraph}>
                  <strong>Booking Details:</strong>
                  <br />
                  Date: {formattedDate}
                  <br />
                  Time: {bookingDetails.time}
                  <br />
                  Service: {bookingDetails.desiredService}
                  <br />
                  Meeting Type: {bookingDetails.meetingType}
                </Text>
                <Text style={paragraph}>
                  <strong>Calendar Links:</strong>
                </Text>
                {clientCalendarLinks.google && (
                  <Button
                    style={{
                      color: '#000000',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      borderBottom: '1px solid #000000',
                      textDecoration: 'underline',
                    }}
                    href={clientCalendarLinks.google}>
                    Add to Google Calendar
                  </Button>
                )}
                {clientCalendarLinks.outlook && (
                  <Button
                    style={{
                      color: '#000000',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      borderBottom: '1px solid #000000',
                      textDecoration: 'underline',
                    }}
                    href={clientCalendarLinks.outlook}>
                    Add to Outlook
                  </Button>
                )}
              </>
            ) : (
              <>
                <Text style={paragraph}>Hi {firstName},</Text>
                <Text style={paragraph}>
                  Your consultation with Lucky Godday Business
                  Services has been confirmed for {formattedDate} at{' '}
                  {bookingDetails.time}.
                </Text>

                <Text style={paragraph}>
                  <strong>Meeting Details:</strong>
                  <br />
                  Date: {formattedDate}
                  <br />
                  Time: {bookingDetails.time}
                  <br />
                  Type: {bookingDetails.meetingType}
                </Text>

                {isOnlineMeeting && (
                  <Text style={paragraph}>
                    <strong>Google Meet Link:</strong>{' '}
                    <Link href={GOOGLE_MEET_LINK} style={link}>
                      {GOOGLE_MEET_LINK}
                    </Link>
                  </Text>
                )}

                <Text style={paragraph}>
                  <strong>Add to your calendar:</strong>
                </Text>

                {clientCalendarLinks.google && (
                  <Button
                    style={{
                      color: '#000000',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      borderBottom: '1px solid #000000',
                      textDecoration: 'underline',
                    }}
                    href={clientCalendarLinks.google}>
                    Add to Google Calendar
                  </Button>
                )}

                {clientCalendarLinks.outlook && (
                  <Button
                    style={{
                      color: '#000000',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      borderBottom: '1px solid #000000',
                      textDecoration: 'underline',
                    }}
                    href={clientCalendarLinks.outlook}>
                    Add to Outlook
                  </Button>
                )}

                <Text style={paragraph}>
                  This consultation is to discuss the next steps to
                  help you with your logistics needs from China to
                  Ghana.
                </Text>

                {isOnlineMeeting ? (
                  <Text style={paragraph}>
                    <strong>How to join:</strong> Click the Google
                    Meet link above at the scheduled time, or use the
                    calendar invite after adding it to your calendar.
                  </Text>
                ) : (
                  <Text style={paragraph}>
                    <strong>In-person meeting:</strong> Please arrive
                    5 minutes before your scheduled appointment. You
                    will be contacted to agree on a location.
                  </Text>
                )}

                <Text style={paragraph}>
                  If you need to reschedule or have any questions,
                  please contact us at{' '}
                  <Link
                    href="mailto:info@shipwithgodday.com"
                    style={link}>
                    info@shipwithgodday.com
                  </Link>
                  .
                </Text>

                <Text style={paragraph}>
                  Thanks,
                  <br />
                  Lucky Godday Business Services
                </Text>
              </>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default EmailTemplate;
