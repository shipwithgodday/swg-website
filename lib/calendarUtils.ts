import { format } from 'date-fns';

interface BookingCalendarData {
  formattedDateTime: string;
  fullName: string;
  // Add optional properties that might be used in the future
  email?: string;
  phoneNumber?: string;
  desiredService?: string;
  meetingType?: string;
  date?: Date | string;
  time?: string;
}

export function getCalendarLinks(booking: BookingCalendarData) {
  const startTime = new Date(booking.formattedDateTime);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later
  const title = encodeURIComponent('Consultation Call');
  const details = encodeURIComponent(
    `Consultation call with ${booking.fullName}`
  );
  const googleMeetUrl = 'https://meet.google.com/wio-bcev-gmk'; // Add your Google Meet URL here
  const meetLinkDetails = encodeURIComponent(
    `Join the meeting: ${googleMeetUrl}`
  );

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${title}
DTSTART:${format(startTime, "yyyyMMdd'T'HHmmss'Z'")}
DTEND:${format(endTime, "yyyyMMdd'T'HHmmss'Z'")}
DESCRIPTION:${details}\\n${meetLinkDetails}
URL:${googleMeetUrl}
END:VEVENT
END:VCALENDAR`;

  const icsBlob = new Blob([icsContent], {
    type: 'text/calendar;charset=utf-8',
  });
  const icsUrl = URL.createObjectURL(icsBlob);

  return {
    google: `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${format(
      startTime,
      "yyyyMMdd'T'HHmmss'Z'"
    )}/${format(endTime, "yyyyMMdd'T'HHmmss'Z'")}&details=${details}%0A${meetLinkDetails}&location=${encodeURIComponent(
      googleMeetUrl
    )}`,
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startTime.toISOString()}&enddt=${endTime.toISOString()}&body=${details}%0A${meetLinkDetails}&location=${encodeURIComponent(
      googleMeetUrl
    )}`,
    apple: icsUrl,
  };
}
