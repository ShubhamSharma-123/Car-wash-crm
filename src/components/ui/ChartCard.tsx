import React from 'react';
import { cn } from '@/utils/cn';
import { formatINR } from '@/utils/format';
import { Plus, Minus, ChartNoAxesColumn } from 'lucide-react';

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
  footer,
  badge,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  footer?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <section className={cn('card flex flex-col', className)}>
      <header className="flex flex-wrap items-start justify-between gap-2 px-4 pb-1 pt-4 sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[13.5px] font-semibold text-navy-900">{title}</h3>
            {badge}
          </div>
          {subtitle && <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={cn('min-w-0 flex-1 px-1.5 pb-2 pt-2 sm:px-2', bodyClassName)}>{children}</div>
      {footer && <div className="border-t border-slate-100 px-4 py-2.5 sm:px-5">{footer}</div>}
    </section>
  );
}

/* ---------- shared recharts tooltip ---------- */
const fmt = (value: number, name: string) => {
  if (/revenue|amount|expenses|sales/i.test(name)) return formatINR(value);
  return value.toLocaleString('en-IN');
};

export function ChartTooltip({
  active,
  payload,
  label,
  hideLabel,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string; dataKey?: string | number; payload?: Record<string, unknown> }[];
  label?: string | number;
  hideLabel?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[140px] rounded-lg border border-slate-200 bg-white/98 px-3 py-2 shadow-dropdown backdrop-blur">
      {!hideLabel && label !== undefined && (
        <p className="mb-1.5 border-b border-slate-100 pb-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-500">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload
          .filter((p) => p.value !== undefined)
          .map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-4 text-[12px]">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
                {p.name}
              </span>
              <span className="font-semibold tabular-nums text-navy-900">{fmt(Number(p.value), String(p.name))}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

/** Legend dots with values — used under charts. */
export function ChartLegend({
  items,
  className,
}: {
  items: { label: string; color: string; value?: string }[];
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
          <span className="h-2 w-2 rounded-sm" style={{ background: i.color }} />
          {i.label}
          {i.value && <span className="font-semibold text-navy-900">{i.value}</span>}
        </span>
      ))}
    </div>
  );
}

/** Small stat strip used inside chart cards. */
export function ChartStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="px-4 py-2 sm:px-5">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.05em] text-slate-400">{label}</p>
      <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-navy-900">{value}</p>
      {hint && <p className="text-[10.5px] text-slate-400">{hint}</p>}
    </div>
  );
}

/** Minimal icon used for print/download placeholder actions inside cards */
export const ChartPlaceholderIcon = ChartNoAxesColumn;
