/* Date helpers — the whole prototype is anchored to a single "today"
   so that "Today's bookings" always contains believable records. */

export const TODAY = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

export const toISO = (d: Date) => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const TODAY_ISO = toISO(TODAY);

export const addDays = (base: Date | string, days: number) => {
  const d = typeof base === 'string' ? parseISO(base) : new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

export const dayISO = (offset: number) => toISO(addDays(TODAY, offset));

export const parseISO = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** 18 Nov 2026 */
export const formatDate = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = iso.length <= 10 ? parseISO(iso) : new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

/** Wed, 18 Nov */
export const formatDayShort = (iso: string) => {
  const d = iso.length <= 10 ? parseISO(iso) : new Date(iso);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

/** 18/11/2026 */
export const formatDateNumeric = (iso: string) => {
  const d = iso.length <= 10 ? parseISO(iso) : new Date(iso);
  return `${`${d.getDate()}`.padStart(2, '0')}/${`${d.getMonth() + 1}`.padStart(2, '0')}/${d.getFullYear()}`;
};

/** 10:42 AM */
export const formatTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
};

/** 18 Nov 2026, 10:42 AM */
export const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${formatDate(iso)}, ${formatTime(iso)}`;
};

/** "Just now", "12 min ago", "3 hrs ago", "Yesterday", "4 days ago", else date */
export const timeAgo = (iso: string) => {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ${hrs === 1 ? 'hr' : 'hrs'} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDate(iso);
};

export const isToday = (iso: string) => iso.slice(0, 10) === TODAY_ISO;

export const isFuture = (iso: string) => iso.slice(0, 10) > TODAY_ISO;

export const isPast = (iso: string) => iso.slice(0, 10) < TODAY_ISO;

export const monthKey = (iso: string) => iso.slice(0, 7);

export const daysBetween = (a: string, b: string) =>
  Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000);

/** Returns list of the last n day-ISO strings ending today. */
export const lastNDays = (n: number) =>
  Array.from({ length: n }, (_, i) => dayISO(-(n - 1 - i)));

/** Accessible label like "18 Nov" */
export const shortDayLabel = (iso: string) => {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

/** Deterministic date-time like 2026-11-18T10:42:00 for records. */
export const at = (iso: string, time: string) => `${iso}T${time}:00`;

export const nowISO = () => new Date().toISOString();

/** "07:30 PM" → minutes from midnight (used for chronological slot sorting). */
export const slotMinutes = (slot: string) => {
  const [time, mer] = slot.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (mer === 'PM' && h !== 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  return h * 60 + (m || 0);
};
