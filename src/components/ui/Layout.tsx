import React from 'react';
import { cn } from '@/utils/cn';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PageHeader({
  title,
  description,
  actions,
  backTo,
  backLabel,
  meta,
  className,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  backTo?: string;
  backLabel?: string;
  meta?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn('mb-5', className)}>
      {backTo && (
        <Link
          to={backTo}
          className="mb-2.5 inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel || 'Back'}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold leading-tight tracking-[-0.02em] text-navy-900 sm:text-[22px]">
            {title}
          </h1>
          {description && <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-slate-500">{description}</p>}
          {meta && <div className="mt-2.5 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  icon,
  footer,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className={cn('card flex flex-col', className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-start gap-2.5">
            {icon && <span className="mt-0.5 text-slate-400">{icon}</span>}
            <div className="min-w-0">
              {title && <h3 className="text-[13.5px] font-semibold text-navy-900">{title}</h3>}
              {description && <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{description}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn('flex-1', bodyClassName || 'p-4 sm:p-5')}>{children}</div>
      {footer && <footer className="border-t border-slate-100 px-4 py-3 sm:px-5">{footer}</footer>}
    </section>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-[12px]">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" />}
            {last || !item.to ? (
              <span className={cn('truncate', last ? 'font-medium text-navy-900' : 'text-slate-500')}>{item.label}</span>
            ) : (
              <Link to={item.to} className="truncate text-slate-500 transition-colors hover:text-brand-600">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

/** Segmented control used for tabs + chart range filters. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50/80 p-0.5',
        className
      )}
      role="tablist"
    >
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[6px] font-medium transition-all duration-150',
            size === 'sm' ? 'h-6.5 px-2 text-[11.5px]' : 'h-7 px-2.5 text-[12px]',
            value === o.value
              ? 'bg-white text-navy-900 shadow-[0_1px_2px_rgba(15,30,61,0.10)]'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
  counts,
}: {
  tabs: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  counts?: Partial<Record<T, number>>;
}) {
  return (
    <div className={cn('scroll-x no-scrollbar -mb-px flex gap-1 border-b border-slate-200', className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors',
            value === t.value
              ? 'border-brand-600 text-navy-900'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
          )}
        >
          {t.icon}
          {t.label}
          {counts?.[t.value] !== undefined && (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums',
                value === t.value ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'
              )}
            >
              {counts[t.value]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Definition list block used in detail pages. */
export function DetailRow({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 py-2', className)}>
      <dt className="shrink-0 text-[12.5px] text-slate-500">{label}</dt>
      <dd className="min-w-0 text-right text-[12.5px] font-medium text-navy-900">{value}</dd>
    </div>
  );
}
