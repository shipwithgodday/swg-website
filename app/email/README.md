# Email Sending with MailJet

This feature allows you to send bulk emails to people who have made bookings.

## Setup

1. Sign up for a [MailJet account](https://www.mailjet.com/)
2. Get your API Key and Secret Key from the MailJet dashboard
3. Add these environment variables to your `.env.local` file:

```
MAILJET_API_KEY=your_api_key_here
MAILJET_API_SECRET=your_api_secret_here
EMAIL_FROM=your_verified_sender_email@example.com
EMAIL_FROM_NAME=Your Name or Company
```

## Usage

1. Navigate to the Email page from the menu
2. Compose your email:
   - Enter a subject line
   - Use the rich text editor to format your content
   - You can use formatting tools like bold, italic, bullet lists, etc.
3. Select recipients from the list of emails from your bookings
4. Click "Send Emails" to send your message to all selected recipients

## Rich Text Editor Features

The email composer includes a user-friendly TipTap rich text editor that allows you to:

- Format text (bold, italic, strikethrough)
- Create bullet and numbered lists
- Change text color (blue, red, black)
- Add links to external websites
- Format list items

You don't need to know HTML to create professional-looking emails!

## Notes

- Emails are sent using MailJet's API
- The list of recipient emails is fetched from your bookings database
- You can send to one or multiple recipients at once
- The email content is automatically converted to HTML
- The editor is fully compatible with React 19 and modern browsers
