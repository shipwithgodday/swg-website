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
} from '@react-email/components';
import * as React from 'react';

interface BookingDetails {
  date: string;
  time: string;
}

interface CalendarLinks {
  google: string;
  outlook?: string;
  ical?: string;
}

interface EmailTemplateProps {
  firstName: string;
  bookingDetails: BookingDetails;
  clientCalendarLinks: CalendarLinks;
}

export const EmailTemplate = ({
  firstName,
  bookingDetails,
  clientCalendarLinks,
}: EmailTemplateProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        You scheduled a consultation call with Lucky Godday Business
        Services
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
            <Text style={paragraph}>
              Your consultation call is scheduled for{' '}
              {bookingDetails.date}, at {bookingDetails.time}
            </Text>
            <Text style={paragraph}>
              This call is to discuss the next steps to help you with
              your logistics needs from China to Ghana{' '}
            </Text>
            <Text style={paragraph}>
              Find the link to the Google Meet meeting below
              <Link
                href="https://meet.google.com/wio-bcev-gmk"
                style={link}>
                Click here to join the meeting
              </Link>
            </Text>
            <Text style={paragraph}>
              You can add this meeting to your Google Calendar{' '}
              <Link href={clientCalendarLinks.google} style={link}>
                Click here to add to your calendar
              </Link>
            </Text>
            <Text style={paragraph}>
              Still have questions? Please contact us at{' '}
              <Text>support@avondinteriors.com</Text>
            </Text>
            <Text style={paragraph}>
              Thanks,
              <br />
              Avond Support Team
            </Text>
          </Section>
        </Container>

        <Section style={footer}>
          {/* <Row>
            <Column align="right" style={{ width: '50%', paddingRight: '8px' }}>
            <Img src="/public/logo.png" />
            </Column>
            <Column align="left" style={{ width: '50%', paddingLeft: '8px' }}>
            <Img src="/public/logo.png" />
            </Column>
            </Row> */}
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
  backgroundColor: '#efeef1',
  fontFamily,
} as React.CSSProperties;

const paragraph = {
  lineHeight: 1.5,
  fontSize: 14,
} as React.CSSProperties;

const container = {
  maxWidth: '580px',
  margin: '30px auto',
  backgroundColor: '#ffffff',
} as React.CSSProperties;

const footer = {
  maxWidth: '580px',
  margin: '0 auto',
} as React.CSSProperties;

const content = {
  padding: '5px 20px 10px 20px',
} as React.CSSProperties;

const logo = {
  padding: 30,
  width: '100%',
  textAlign: 'center',
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
} as React.CSSProperties;
