import { format } from 'date-fns';

interface BookingCalendarData {
  formattedDateTime: string;
  // Add optional properties that might be used in the future
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  desiredService?: string;
  meetingType?: string;
  date?: Date | string;
  time?: string;
}

export function getClientCalendarLinks(booking: BookingCalendarData) {
  const startTime = new Date(booking.formattedDateTime);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

  // Use the meeting type and service in the title if available
  const meetingType = booking.meetingType
    ? `(${booking.meetingType})`
    : '';
  const service = booking.desiredService
    ? `- ${booking.desiredService}`
    : '';

  const title = encodeURIComponent(
    `Lucky Godday Business Services Consultation ${meetingType} ${service}`
  );

  // Create a more detailed description
  const details = encodeURIComponent(
    `Consultation with Lucky Godday Business Services\n` +
      `Date: ${format(startTime, 'MMMM d, yyyy')}\n` +
      `Time: ${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')} GMT\n` +
      (booking.meetingType === 'Online'
        ? `Meeting Link: https://meet.google.com/wio-bcev-gmk\n`
        : `Meeting Type: In-person\n`) +
      `For any questions, contact: support@luckygodday.com`
  );

  // Create the iCalendar content
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Lucky Godday Business Services//Booking System//EN
BEGIN:VEVENT
SUMMARY:${title}
DTSTART:${format(startTime, "yyyyMMdd'T'HHmmss'Z'")}
DTEND:${format(endTime, "yyyyMMdd'T'HHmmss'Z'")}
DESCRIPTION:${details}
LOCATION:${booking.meetingType === 'Online' ? 'Google Meet' : 'Lucky Godday Office'}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

  // Create a data URL for the iCalendar file - this works for both Apple Calendar and other iCal clients
  const icsDataUrl = `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;

  return {
    google: `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${format(
      startTime,
      "yyyyMMdd'T'HHmmss'Z'"
    )}/${format(endTime, "yyyyMMdd'T'HHmmss'Z'")}&details=${details}`,
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startTime.toISOString()}&enddt=${endTime.toISOString()}&body=${details}`,
    apple: icsDataUrl,
    ical: icsDataUrl,
  };
}
