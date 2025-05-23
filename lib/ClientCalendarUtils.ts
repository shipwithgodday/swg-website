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
  whatsappNumber?: string;
}

export function getClientCalendarLinks(
  booking: BookingCalendarData,
  isOwner: boolean = false
) {
  const startTime = new Date(booking.formattedDateTime);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

  // Use different title format for owner vs client
  const title = encodeURIComponent(
    isOwner
      ? `Meeting with ${booking.fullName || 'Client'}`
      : `Lucky Godday Business Services Consultation ${booking.meetingType ? `(${booking.meetingType})` : ''} ${booking.desiredService ? `- ${booking.desiredService}` : ''}`
  );

  // Create a more detailed description
  const details = encodeURIComponent(
    isOwner
      ? `Meeting with ${booking.fullName || 'Client'}\n` +
          `Date: ${format(startTime, 'MMMM d, yyyy')}\n` +
          `Time: ${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')} GMT\n` +
          `Phone: ${booking.phoneNumber || 'Not provided'}\n` +
          (booking.whatsappNumber
            ? `WhatsApp: ${booking.whatsappNumber}\n`
            : '') +
          `Email: ${booking.email || 'Not provided'}\n` +
          `Service: ${booking.desiredService || 'Not specified'}\n` +
          `Meeting Type: ${booking.meetingType || 'Not specified'}`
      : `Consultation with Lucky Godday Business Services\n` +
          `Date: ${format(startTime, 'MMMM d, yyyy')}\n` +
          `Time: ${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')} GMT\n` +
          (booking.meetingType === 'Online'
            ? `Meeting Link: https://meet.google.com/wio-bcev-gmk\n`
            : `Meeting Type: In-person\n`) +
          `For any questions, contact: support@luckygodday.com`
  );

  return {
    google: `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${format(
      startTime,
      "yyyyMMdd'T'HHmmss'Z'"
    )}/${format(endTime, "yyyyMMdd'T'HHmmss'Z'")}&details=${details}`,
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startTime.toISOString()}&enddt=${endTime.toISOString()}&body=${details}`,
  };
}
