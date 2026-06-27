const FROM = 'Ship With Godday <info@shipwithgodday.com>';

export interface AdminSignupEmailInput {
  fullName: string;
  email: string;
  phone: string;
  company: string | null;
  shippingMark: string;
  createdAt: Date;
  /** Recipient — process.env.ADMIN_EMAIL. Undefined disables the email. */
  to: string | undefined;
}

export interface BuiltEmail {
  from: string;
  to: string;
  subject: string;
  html: string;
}

/** Pure builder — returns null when no recipient is configured. */
export function buildAdminSignupEmail(
  input: AdminSignupEmailInput
): BuiltEmail | null {
  if (!input.to) return null;
  const company = input.company?.trim() ? input.company : '—';
  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#555">${label}</td><td style="padding:4px 0;font-weight:600">${value}</td></tr>`;
  const html = `
    <h2>New account &amp; shipping mark</h2>
    <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      ${row('Name', input.fullName)}
      ${row('Email', input.email)}
      ${row('Phone', input.phone)}
      ${row('Company', company)}
      ${row('Shipping mark', input.shippingMark)}
      ${row('Created', input.createdAt.toISOString())}
    </table>`;
  return {
    from: FROM,
    to: input.to,
    subject: `New account & shipping mark: ${input.shippingMark} — ${input.fullName}`,
    html,
  };
}

/**
 * Sends the admin notification. No-op (with a warning) when ADMIN_EMAIL is
 * unset. Never throws — sign-up must not fail because of email.
 */
export async function sendAdminSignupEmail(
  input: Omit<AdminSignupEmailInput, 'to'>
): Promise<void> {
  const msg = buildAdminSignupEmail({
    ...input,
    to: process.env.ADMIN_EMAIL,
  });
  if (!msg) {
    console.warn('[admin-signup-email] ADMIN_EMAIL unset; skipping');
    return;
  }
  try {
    // Lazy import: the Resend client throws at construction without an API
    // key, so keep it out of the module's top-level (pure builder is testable).
    const { default: resend } = await import('@/lib/emails');
    await resend.emails.send(msg);
  } catch (err) {
    console.error('[admin-signup-email] send failed', err);
  }
}
