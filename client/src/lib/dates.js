// Due dates are calendar dates ('YYYY-MM-DD'); the API stores them at UTC midnight.

export const localYmd = (d = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const isoToYmd = (iso) => iso.slice(0, 10);

const DAY = 86400000;
const ymdToUtc = (ymd) => Date.parse(`${ymd}T00:00:00Z`);

/** Days from today to the due date (negative = overdue). */
export const daysUntil = (iso) => Math.round((ymdToUtc(isoToYmd(iso)) - ymdToUtc(localYmd())) / DAY);

export function formatDue(iso) {
  const diff = daysUntil(iso);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < 0) return `${-diff} days ago`;
  if (diff < 7) return `In ${diff} days`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: diff > 300 ? 'numeric' : undefined,
    timeZone: 'UTC',
  });
}
