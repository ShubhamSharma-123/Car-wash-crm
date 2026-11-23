export const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const INRPrecise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const NUM = new Intl.NumberFormat('en-IN');

/** ₹24,850 */
export const formatINR = (value: number) => INR.format(Math.round(value || 0));

/** ₹24,850.00 — used on invoices / receipts */
export const formatINRPrecise = (value: number) => INRPrecise.format(value || 0);

/** 1,284 */
export const formatNumber = (value: number) => NUM.format(value || 0);

/** 2.4L / 1.2Cr — compact Indian notation for KPI comparisons */
export const formatCompactINR = (value: number) => {
  const v = Math.abs(value);
  if (v >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)}Cr`;
  if (v >= 1_00_000) return `₹${(value / 1_00_000).toFixed(2)}L`;
  if (v >= 1_000) return `₹${(value / 1_000).toFixed(1)}K`;
  return `₹${value}`;
};

/** +12.4% / -3.1% */
export const formatPercent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

export const initials = (name: string) =>
  name
    .replace(/[^A-Za-z ]/g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');

export const pluralize = (count: number, singular: string, plural?: string) =>
  count === 1 ? singular : plural || `${singular}s`;

export const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Deterministic gradient tone → tailwind classes (kept static so Tailwind keeps them). */
export const TONES: Record<string, string> = {
  blue: 'from-brand-500 to-brand-700',
  navy: 'from-navy-700 to-navy-900',
  teal: 'from-teal-500 to-teal-700',
  emerald: 'from-emerald-500 to-emerald-700',
  amber: 'from-amber-400 to-amber-600',
  rose: 'from-rose-500 to-rose-700',
  violet: 'from-violet-500 to-violet-700',
  sky: 'from-sky-400 to-sky-600',
  indigo: 'from-indigo-500 to-indigo-700',
  slate: 'from-slate-500 to-slate-700',
  cyan: 'from-cyan-500 to-cyan-700',
  fuchsia: 'from-fuchsia-500 to-fuchsia-700',
};

export const toneClass = (tone?: string) => TONES[tone || 'blue'] || TONES.blue;
