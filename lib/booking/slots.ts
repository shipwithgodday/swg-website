/** Generate 'HH:mm' slot start times from openTime up to (not including) closeTime. */
export function generateSlots(
  openTime: string,
  closeTime: string,
  slotMinutes: number
): string[] {
  if (slotMinutes <= 0) return [];

  const toMinutes = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const pad = (n: number): string => String(n).padStart(2, '0');

  const start = toMinutes(openTime);
  const end = toMinutes(closeTime);
  const slots: string[] = [];

  for (let m = start; m < end; m += slotMinutes) {
    slots.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
  }
  return slots;
}
