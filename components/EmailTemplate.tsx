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
  meetingType?: string;
}

interface CalendarLinks {
  google: string;
  outlook?: string;
  ical?: string;
  apple?: string;
}

interface EmailTemplateProps {
  firstName: string;
  bookingDetails: BookingDetails;
  clientCalendarLinks: CalendarLinks;
}

// Generate a Google Meet link (this would ideally come from your API or environment variables)
const GOOGLE_MEET_LINK = 'https://meet.google.com/wio-bcev-gmk';

export const EmailTemplate = ({
  firstName,
  bookingDetails,
  clientCalendarLinks,
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
        Your consultation with Lucky Godday Business Services is
        confirmed
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logo as React.CSSProperties}>
            <Img
              style={logoImage}
              width={114}
              src="https://joels-pic-bucket.s3.us-east-2.amazonaws.com/icon.png"
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
            <Text style={paragraph}>Hi {firstName},</Text>

            {/* Calendar-style event summary */}
            <Section style={calendarSection}>
              <Text style={eventTitle}>
                Consultation Call - Lucky Godday Business Services
              </Text>
              <Text style={eventTime}>
                {formattedDate} at {bookingDetails.time} (GMT)
              </Text>

              <Section style={eventDetails}>
                {isOnlineMeeting && (
                  <Text style={eventDetailItem}>
                    <strong>Google Meet Link:</strong>{' '}
                    <Link
                      href={GOOGLE_MEET_LINK}
                      style={linkHighlight}>
                      {GOOGLE_MEET_LINK}
                    </Link>
                  </Text>
                )}
                <Text style={eventDetailItem}>
                  <strong>Meeting Type:</strong>{' '}
                  {bookingDetails.meetingType || 'Consultation'}
                </Text>
                <Text style={eventDetailItem}>
                  <strong>Organizer:</strong> Lucky Godday Business
                  Services
                </Text>
              </Section>

              <Button
                style={calendarButton}
                href={clientCalendarLinks.google}>
                Add to Google Calendar
              </Button>
              {clientCalendarLinks.outlook && (
                <Button
                  style={calendarButton}
                  href={clientCalendarLinks.outlook}>
                  Add to Outlook
                </Button>
              )}
              {clientCalendarLinks.apple && (
                <Button
                  style={calendarButton}
                  href={clientCalendarLinks.apple}>
                  Add to Apple Calendar
                </Button>
              )}
              {clientCalendarLinks.ical && (
                <Button
                  style={calendarButton}
                  href={clientCalendarLinks.ical}>
                  Download iCal File
                </Button>
              )}
            </Section>

            <Text style={paragraph}>
              This consultation is to discuss the next steps to help
              you with your logistics needs from China to Ghana.
            </Text>

            {isOnlineMeeting ? (
              <Text style={paragraph}>
                <strong>How to join:</strong> Click the Google Meet
                link above at the scheduled time, or use the calendar
                invite after adding it to your calendar.
              </Text>
            ) : (
              <Text style={paragraph}>
                <strong>In-person meeting:</strong> Please arrive 5
                minutes before your scheduled appointment.
              </Text>
            )}

            <Text style={paragraph}>
              If you need to reschedule or have any questions, please
              contact us at{' '}
              <Link
                href="mailto:support@luckygodday.com"
                style={link}>
                support@luckygodday.com
              </Link>
              .
            </Text>

            <Text style={paragraph}>
              Thanks,
              <br />
              Lucky Godday Business Services
            </Text>
          </Section>
        </Container>

        <Section style={footer}>
          <Row>
            <Text style={{ textAlign: 'center', color: '#706a7b' }}>
              © 2025 Lucky Godday Business Services, All Rights
              Reserved <br />
            </Text>
          </Row>
        </Section>
      </Body>
    </Html>
  );
};

export default EmailTemplate;

const fontFamily = 'HelveticaNeue,Helvetica,Arial,sans-serif';

const main = {
  backgroundColor: '#f5f5f5',
  fontFamily,
} as React.CSSProperties;

const paragraph = {
  lineHeight: 1.5,
  fontSize: 14,
  marginBottom: 16,
} as React.CSSProperties;

const container = {
  maxWidth: '580px',
  margin: '30px auto',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
} as React.CSSProperties;

const footer = {
  maxWidth: '580px',
  margin: '0 auto',
  padding: '20px 0',
} as React.CSSProperties;

const content = {
  padding: '20px 30px',
} as React.CSSProperties;

const logo = {
  padding: 30,
  width: '100%',
  textAlign: 'center',
  backgroundColor: '#ffffff',
} as React.CSSProperties;

const logoImage = {
  display: 'inline-block',
} as React.CSSProperties;

const sectionsBorders = {
  width: '100%',
  display: 'flex',
} as React.CSSProperties;

const sectionBorder = {
  borderBottom: '1px solid rgb(238,238,238)',
  width: '249px',
} as React.CSSProperties;

const sectionCenter = {
  borderBottom: '1px solid rgb(145,71,255)',
  width: '102px',
} as React.CSSProperties;

const link = {
  textDecoration: 'underline',
  color: '#2563eb',
} as React.CSSProperties;

const linkHighlight = {
  textDecoration: 'underline',
  color: '#2563eb',
  fontWeight: 'bold',
} as React.CSSProperties;

const calendarSection = {
  backgroundColor: '#f8f9fa',
  padding: '15px',
  borderRadius: '8px',
  marginBottom: '20px',
  border: '1px solid #e5e7eb',
} as React.CSSProperties;

const eventTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  marginBottom: '8px',
  color: '#111827',
} as React.CSSProperties;

const eventTime = {
  fontSize: '14px',
  color: '#374151',
  marginBottom: '12px',
} as React.CSSProperties;

const eventDetails = {
  marginBottom: '15px',
} as React.CSSProperties;

const eventDetailItem = {
  fontSize: '14px',
  marginBottom: '6px',
  color: '#374151',
} as React.CSSProperties;

const calendarButton = {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  padding: '8px 16px',
  borderRadius: '4px',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 'bold',
  marginRight: '8px',
  marginBottom: '8px',
  display: 'inline-block',
} as React.CSSProperties;
