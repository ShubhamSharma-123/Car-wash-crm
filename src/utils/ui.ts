export const TONE_TEXT = {
  slate: 'text-slate-600',
  navy: 'text-navy-900',
  brand: 'text-brand-600',
  emerald: 'text-emerald-600',
  green: 'text-emerald-600',
  amber: 'text-amber-600',
  rose: 'text-rose-600',
  red: 'text-rose-600',
  violet: 'text-violet-600',
  teal: 'text-teal-600',
  sky: 'text-sky-600',
  indigo: 'text-indigo-600',
} as const;

export const trendClass = (value: number, invert = false) => {
  const positive = invert ? value < 0 : value >= 0;
  return positive ? 'text-emerald-600' : 'text-rose-600';
};

export const chartPalette = {
  brand: '#2563eb',
  brandLight: '#93c5fd',
  navy: '#1c3358',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  violet: '#8b5cf6',
  teal: '#14b8a6',
  sky: '#0ea5e9',
  slate: '#94a3b8',
  indigo: '#6366f1',
} as const;

export const CHART_COLORS: string[] = [
  chartPalette.brand,
  chartPalette.navy,
  chartPalette.teal,
  chartPalette.violet,
  chartPalette.amber,
  chartPalette.emerald,
  chartPalette.sky,
  chartPalette.rose,
];

/** Percentage change between two numbers, guarded against divide-by-zero. */
export const pctChange = (current: number, previous: number) => {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const downloadCSV = (filename: string, rows: (string | number)[][]) => {
  const escape = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(escape).join(',')).join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const numberOr = (n: number, fallback = '—') => (Number.isFinite(n) ? n : fallback);
