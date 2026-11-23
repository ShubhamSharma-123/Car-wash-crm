import React from 'react';
import { cn } from '@/utils/cn';
import { trendClass, TONE_TEXT } from '@/utils/ui';
import { TrendPill } from './Badge';
import { Skeleton } from './Skeleton';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: 'brand' | 'navy' | 'emerald' | 'amber' | 'rose' | 'violet' | 'teal' | 'slate' | 'indigo' | 'sky';
  change?: number;
  comparison?: string;
  invertChange?: boolean;
  footnote?: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  spark?: number[];
}

const iconTone: Record<NonNullable<StatCardProps['tone']>, string> = {
  brand: 'bg-brand-50 text-brand-600 ring-brand-100',
  navy: 'bg-navy-50 text-navy-700 ring-navy-100',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  rose: 'bg-rose-50 text-rose-500 ring-rose-100',
  violet: 'bg-violet-50 text-violet-600 ring-violet-100',
  teal: 'bg-teal-50 text-teal-600 ring-teal-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  sky: 'bg-sky-50 text-sky-600 ring-sky-100',
};

const sparkStroke: Record<NonNullable<StatCardProps['tone']>, string> = {
  brand: '#2563eb',
  navy: '#1c3358',
  emerald: '#059669',
  amber: '#d97706',
  rose: '#e11d48',
  violet: '#7c3aed',
  teal: '#0d9488',
  slate: '#64748b',
  indigo: '#4f46e5',
  sky: '#0284c7',
};

function Sparkline({ data, stroke }: { data: number[]; stroke: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 64;
  const h = 22;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <circle cx={pts.at(-1)?.split(',')[0]} cy={pts.at(-1)?.split(',')[1]} r="1.8" fill={stroke} />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = 'brand',
  change,
  comparison,
  invertChange,
  footnote,
  onClick,
  loading,
  spark,
}: StatCardProps) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      {...(onClick ? { onClick, type: 'button' as const } : {})}
      className={cn(
        'card card-hover group relative flex flex-col p-3 text-left transition-all sm:p-4',
        onClick && 'focus-ring hover:-translate-y-[1px] hover:border-slate-300',
        'min-w-0'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="line-clamp-2 text-[9.5px] font-medium uppercase leading-[1.35] tracking-[0.02em] text-slate-500 sm:text-[11.5px] sm:tracking-[0.045em]">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-7 w-20" />
          ) : (
            <p className="mt-1.5 text-[20px] font-semibold leading-none tracking-[-0.02em] text-navy-900 tabular-nums sm:text-[23px]">
              {value}
            </p>
          )}
        </div>
        <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-lg ring-1 ring-inset sm:h-8.5 sm:w-8.5', iconTone[tone])}>
          {icon}
        </span>
      </div>

      <div className="mt-auto flex items-end justify-between gap-1.5 pt-2 sm:gap-2 sm:pt-3">
        <div className="min-w-0">
          {change !== undefined ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <TrendPill value={change} invert={invertChange} />
              {comparison && <span className="truncate text-[11px] text-slate-400">{comparison}</span>}
            </div>
          ) : footnote ? (
            <div className="text-[11.5px] text-slate-500">{footnote}</div>
          ) : null}
        </div>
        {spark && <Sparkline data={spark} stroke={sparkStroke[tone]} />}
      </div>
    </Comp>
  );
}

/** Compact KPI used inside detail pages and reports. */
export function MiniStat({
  label,
  value,
  hint,
  tone = 'slate',
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: keyof typeof TONE_TEXT;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-slate-200/80 bg-white p-3.5', className)}>
      <p className="text-[11px] font-medium uppercase tracking-[0.045em] text-slate-500">{label}</p>
      <p className={cn('mt-1 text-[17px] font-semibold tabular-nums', toneClass(tone))}>{value}</p>
      {hint && <p className="mt-0.5 truncate text-[11.5px] text-slate-400">{hint}</p>}
    </div>
  );
}

const toneClass = (tone: string) => TONE_TEXT[tone as keyof typeof TONE_TEXT] || 'text-navy-900';

/** Progress meter (0–100) with tone support. */
export function Meter({
  value,
  tone = 'brand',
  className,
  showLabel,
}: {
  value: number;
  tone?: 'brand' | 'emerald' | 'amber' | 'rose' | 'violet' | 'teal' | 'navy';
  className?: string;
  showLabel?: boolean;
}) {
  const bar: Record<string, string> = {
    brand: 'bg-brand-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    violet: 'bg-violet-500',
    teal: 'bg-teal-500',
    navy: 'bg-navy-800',
  };
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('h-full rounded-full transition-all duration-500', bar[tone])}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showLabel && <span className="w-8 shrink-0 text-right text-[11px] font-medium tabular-nums text-slate-500">{Math.round(value)}%</span>}
    </div>
  );
}
