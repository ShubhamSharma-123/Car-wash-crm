import React from 'react';
import { cn } from '@/utils/cn';
import { Sparkles } from 'lucide-react';

/** AutoSutraa watermark-style brand mark. */
export function Logo({
  collapsed = false,
  variant = 'dark',
  className,
}: {
  collapsed?: boolean;
  variant?: 'dark' | 'light';
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-gradient-to-br from-brand-500 via-brand-600 to-navy-800 shadow-[0_2px_6px_rgba(37,99,235,0.35)]">
        <Sparkles className="h-[18px] w-[18px] text-white" strokeWidth={2.2} />
        <span className="absolute -bottom-1.5 -right-1.5 h-4 w-4 rounded-full bg-white/15" />
      </span>
      {!collapsed && (
        <span className="min-w-0 leading-none">
          <span
            className={cn(
              'block text-[15.5px] font-semibold tracking-[-0.02em]',
              variant === 'dark' ? 'text-white' : 'text-navy-900'
            )}
          >
            Auto<span className="text-brand-400">Sutraa</span>
          </span>
          <span
            className={cn(
              'mt-1 block text-[9.5px] font-medium uppercase tracking-[0.16em]',
              variant === 'dark' ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            Car Spa CRM
          </span>
        </span>
      )}
    </div>
  );
}

export function VehicleGlyph({ type = 'Sedan', className }: { type?: string; className?: string }) {
  const isLuxury = type === 'Luxury';
  const isSUV = type === 'SUV' || type === 'MUV';
  return (
    <svg viewBox="0 0 64 40" className={cn('h-full w-full', className)} fill="none" aria-hidden>
      <path
        d={
          isSUV
            ? 'M6 28V20c0-1.4 1-2.6 2.4-2.9L13 16l5-6.5c.6-.8 1.5-1.2 2.5-1.2h20c1.1 0 2.1.5 2.7 1.4L48 16l6 .9c1.7.3 3 1.7 3 3.4V28'
            : 'M5 28v-6.2c0-1.3.8-2.4 2-2.8l6-2.1 6.4-6.7c.7-.7 1.6-1.1 2.6-1.1h14.8c1.2 0 2.3.5 3 1.5l5.6 7.2 8.2 1.6c1.4.3 2.4 1.5 2.4 2.9V28'
        }
        fill="currentColor"
        opacity="0.16"
      />
      <path
        d={
          isSUV
            ? 'M6 28V20c0-1.4 1-2.6 2.4-2.9L13 16l5-6.5c.6-.8 1.5-1.2 2.5-1.2h20c1.1 0 2.1.5 2.7 1.4L48 16l6 .9c1.7.3 3 1.7 3 3.4V28'
            : 'M5 28v-6.2c0-1.3.8-2.4 2-2.8l6-2.1 6.4-6.7c.7-.7 1.6-1.1 2.6-1.1h14.8c1.2 0 2.3.5 3 1.5l5.6 7.2 8.2 1.6c1.4.3 2.4 1.5 2.4 2.9V28'
        }
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 28h54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="17" cy="29.5" r="4" stroke="currentColor" strokeWidth="2" fill="white" />
      <circle cx="46" cy="29.5" r="4" stroke="currentColor" strokeWidth="2" fill="white" />
      {isLuxury && <path d="M28 8.5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />}
    </svg>
  );
}

export function VehicleThumb({ type, tone = 'blue' }: { type?: string; tone?: string }) {
  const tones: Record<string, string> = {
    blue: 'bg-brand-50 text-brand-500 border-brand-100',
    navy: 'bg-navy-50 text-navy-600 border-navy-100',
    teal: 'bg-teal-50 text-teal-600 border-teal-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-500 border-rose-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    slate: 'bg-slate-50 text-slate-500 border-slate-200',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };
  return (
    <span className={cn('grid h-9 w-11 shrink-0 place-items-center rounded-lg border p-1', tones[tone] || tones.blue)}>
      <VehicleGlyph type={type} />
    </span>
  );
}

export function ServiceThumb({ tone = 'blue', name }: { tone?: string; name: string }) {
  const tones: Record<string, string> = {
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
  return (
    <span
      className={cn(
        'relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br text-white shadow-sm',
        tones[tone] || tones.blue
      )}
      aria-hidden
    >
      <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full opacity-20">
        <circle cx="32" cy="8" r="12" fill="white" />
        <circle cx="6" cy="34" r="9" fill="white" />
      </svg>
      <span className="relative text-[13px] font-bold">
        {name
          .split(' ')
          .filter((w) => w.length > 2)
          .slice(0, 2)
          .map((w) => w[0])
          .join('')
          .toUpperCase() || name.slice(0, 2).toUpperCase()}
      </span>
    </span>
  );
}
