import 'server-only';
import resend from '@/lib/emails';
import {
  getSubscribersForContainer,
  markSubscriberNotified,
  resetSubscriberNotified,
} from './queries';
import type { Container } from '@/lib/db/schema';

const FROM = 'Ship With Godday <info@shipwithgodday.com>';
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://shipwithgodday.com';

function formatEtaDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function buildPortEmail(opts: {
  recipientName: string | null;
  invoiceNumber: string;
  etaDate: Date;
  isReschedule: boolean;
  reason: string | null;
}): { subject: string; html: string } {
  const name = opts.recipientName ?? 'Valued Customer';
  const dateStr = formatEtaDate(opts.etaDate);
  const rescheduleNote = opts.isReschedule
    ? `<p style="color:#7a6300;margin:0 0 12px">This is an updated date.${opts.reason ? ` ${opts.reason}` : ''}</p>`
    : '';
  const html = `
    <p>Hi ${name},</p>
    <p>Your shipment <strong>${opts.invoiceNumber}</strong> is arriving at <strong>Tema Port</strong>.</p>
    ${rescheduleNote}
    <p style="font-size:1.4em;font-weight:bold;margin:12px 0">${dateStr}</p>
    <p><a href="${BASE_URL}/track?invoice=${opts.invoiceNumber}">View full shipment status →</a></p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="color:#888;font-size:12px">Ship With Godday &mdash; Lucky Godday Business Services</p>
  `;
  return {
    subject: `Your shipment ${opts.invoiceNumber} is arriving at Tema Port`,
    html,
  };
}

function buildWarehouseEmail(opts: {
  recipientName: string | null;
  invoiceNumber: string;
  etaDate: Date;
  isReschedule: boolean;
  reason: string | null;
}): { subject: string; html: string } {
  const name = opts.recipientName ?? 'Valued Customer';
  const dateStr = formatEtaDate(opts.etaDate);
  const rescheduleNote = opts.isReschedule
    ? `<p style="color:#7a6300;margin:0 0 12px">This is an updated date.${opts.reason ? ` ${opts.reason}` : ''}</p>`
    : '';
  const html = `
    <p>Hi ${name},</p>
    <p>Your shipment <strong>${opts.invoiceNumber}</strong> is arriving at our <strong>Ghana Warehouse</strong>.</p>
    ${rescheduleNote}
    <p style="font-size:1.4em;font-weight:bold;margin:12px 0">${dateStr}</p>
    <p><a href="${BASE_URL}/track?invoice=${opts.invoiceNumber}">View full shipment status →</a></p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="color:#888;font-size:12px">Ship With Godday &mdash; Lucky Godday Business Services</p>
  `;
  return {
    subject: `Your shipment ${opts.invoiceNumber} is arriving at our Ghana Warehouse`,
    html,
  };
}

function buildPortArrivedEmail(opts: {
  recipientName: string | null;
  invoiceNumber: string;
}): { subject: string; html: string } {
  const name = opts.recipientName ?? 'Valued Customer';
  const html = `
    <p>Hi ${name},</p>
    <p>Great news — your shipment <strong>${opts.invoiceNumber}</strong> has arrived at <strong>Tema Port</strong> and is being processed.</p>
    <p><a href="${BASE_URL}/track?invoice=${opts.invoiceNumber}">View full shipment status →</a></p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="color:#888;font-size:12px">Ship With Godday &mdash; Lucky Godday Business Services</p>
  `;
  return {
    subject: `Your shipment ${opts.invoiceNumber} has arrived at Tema Port`,
    html,
  };
}

function buildWarehouseArrivedEmail(opts: {
  recipientName: string | null;
  invoiceNumber: string;
}): { subject: string; html: string } {
  const name = opts.recipientName ?? 'Valued Customer';
  const html = `
    <p>Hi ${name},</p>
    <p>Great news — your shipment <strong>${opts.invoiceNumber}</strong> is ready for collection at our <strong>Ghana Warehouse</strong>.</p>
    <p><a href="${BASE_URL}/track?invoice=${opts.invoiceNumber}">View full shipment status →</a></p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="color:#888;font-size:12px">Ship With Godday &mdash; Lucky Godday Business Services</p>
  `;
  return {
    subject: `Your shipment ${opts.invoiceNumber} is ready at our Ghana Warehouse`,
    html,
  };
}

export async function sendShipmentNotifications(
  container: Container,
  changedFields: {
    etaPort?: boolean;
    etaWarehouse?: boolean;
    etaPortReason?: string | null;
    etaWarehouseReason?: string | null;
    etaPortWasPreviouslySet?: boolean;
    etaWarehouseWasPreviouslySet?: boolean;
  }
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('sendShipmentNotifications: RESEND_API_KEY not set, skipping');
    return;
  }

  const subscribers = await getSubscribersForContainer(container.id);

  for (const sub of subscribers) {
    const email = sub.emailOverride ?? sub.customerEmail ?? null;
    if (!email) {
      console.warn(
        `sendShipmentNotifications: no email for subscriber ${sub.id} (invoice ${sub.invoiceNumber}), skipping`
      );
      continue;
    }

    if (changedFields.etaPort && container.etaPort) {
      const isReschedule =
        !!changedFields.etaPortWasPreviouslySet && sub.notifiedPortArrival;
      if (!sub.notifiedPortArrival || isReschedule) {
        const { subject, html } = buildPortEmail({
          recipientName: sub.customerName,
          invoiceNumber: sub.invoiceNumber,
          etaDate: container.etaPort,
          isReschedule,
          reason: changedFields.etaPortReason ?? null,
        });
        try {
          const result = await resend.emails.send({
            from: FROM,
            to: [email],
            subject,
            html,
          });
          if (result.error) {
            console.error(
              `sendShipmentNotifications: Resend error for port notification to ${email}: ${result.error.message}`
            );
          } else {
            if (isReschedule) {
              await resetSubscriberNotified(sub.id, 'notifiedPortArrival');
            }
            await markSubscriberNotified(sub.id, 'notifiedPortArrival');
            console.log(
              `sendShipmentNotifications: sent port ETA to ${email} (id ${result.data?.id})`
            );
          }
        } catch (err) {
          console.error(
            'sendShipmentNotifications: unexpected error sending port notification',
            err
          );
        }
      }
    }

    if (changedFields.etaWarehouse && container.etaWarehouse) {
      const isReschedule =
        !!changedFields.etaWarehouseWasPreviouslySet &&
        sub.notifiedWarehouseArrival;
      if (!sub.notifiedWarehouseArrival || isReschedule) {
        const { subject, html } = buildWarehouseEmail({
          recipientName: sub.customerName,
          invoiceNumber: sub.invoiceNumber,
          etaDate: container.etaWarehouse,
          isReschedule,
          reason: changedFields.etaWarehouseReason ?? null,
        });
        try {
          const result = await resend.emails.send({
            from: FROM,
            to: [email],
            subject,
            html,
          });
          if (result.error) {
            console.error(
              `sendShipmentNotifications: Resend error for warehouse notification to ${email}: ${result.error.message}`
            );
          } else {
            if (isReschedule) {
              await resetSubscriberNotified(sub.id, 'notifiedWarehouseArrival');
            }
            await markSubscriberNotified(sub.id, 'notifiedWarehouseArrival');
            console.log(
              `sendShipmentNotifications: sent warehouse ETA to ${email} (id ${result.data?.id})`
            );
          }
        } catch (err) {
          console.error(
            'sendShipmentNotifications: unexpected error sending warehouse notification',
            err
          );
        }
      }
    }
  }
}

export async function sendArrivalNotifications(
  container: Container,
  milestone: 'port' | 'warehouse'
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('sendArrivalNotifications: RESEND_API_KEY not set, skipping');
    return;
  }

  const subscribers = await getSubscribersForContainer(container.id);

  for (const sub of subscribers) {
    const email = sub.emailOverride ?? sub.customerEmail ?? null;
    if (!email) {
      console.warn(
        `sendArrivalNotifications: no email for subscriber ${sub.id} (invoice ${sub.invoiceNumber}), skipping`
      );
      continue;
    }

    const alreadyNotified =
      milestone === 'port'
        ? sub.notifiedPortArrived
        : sub.notifiedWarehouseArrived;

    if (alreadyNotified) continue;

    const { subject, html } =
      milestone === 'port'
        ? buildPortArrivedEmail({
            recipientName: sub.customerName,
            invoiceNumber: sub.invoiceNumber,
          })
        : buildWarehouseArrivedEmail({
            recipientName: sub.customerName,
            invoiceNumber: sub.invoiceNumber,
          });

    try {
      const result = await resend.emails.send({
        from: FROM,
        to: [email],
        subject,
        html,
      });
      if (result.error) {
        console.error(
          `sendArrivalNotifications: Resend error to ${email}: ${result.error.message}`
        );
      } else {
        const flag =
          milestone === 'port'
            ? 'notifiedPortArrived'
            : 'notifiedWarehouseArrived';
        await markSubscriberNotified(sub.id, flag);
        console.log(
          `sendArrivalNotifications: sent ${milestone} arrival to ${email} (id ${result.data?.id})`
        );
      }
    } catch (err) {
      console.error(
        `sendArrivalNotifications: unexpected error sending ${milestone} arrival`,
        err
      );
    }
  }
}
