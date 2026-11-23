import React from 'react';
import { cn } from '@/utils/cn';
import { Search, X, Inbox } from 'lucide-react';

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  className,
  size = 'md',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className={cn(
          'pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400',
          size === 'sm' ? 'left-2.5 h-3.5 w-3.5' : 'left-3 h-4 w-4'
        )}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          'w-full rounded-lg border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 transition-colors hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-[3px] focus:ring-brand-100',
          size === 'sm' ? 'h-8 pl-8 pr-7 text-[12.5px]' : 'h-9 pl-9 pr-8 text-[13px]'
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  compact,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 text-center', compact ? 'py-10' : 'py-16')}>
      <div className="mb-3.5 grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
        {icon || <Inbox className="h-5 w-5" />}
      </div>
      <p className="text-[13.5px] font-semibold text-navy-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
  pageSizeOptions = [8, 10, 15, 25],
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
  onPageSize?: (n: number) => void;
  pageSizeOptions?: number[];
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const pages: (number | '…')[] = [];
  const push = (p: number | '…') => pages.push(p);
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) push(i);
  } else {
    push(1);
    if (page > 3) push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) push(i);
    if (page < totalPages - 2) push('…');
    push(totalPages);
  }

  return (
    <div className="flex flex-col-reverse items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
      <div className="flex items-center gap-3 text-[12px] text-slate-500">
        <span>
          Showing <span className="font-semibold text-slate-700 tabular-nums">{from}</span>–
          <span className="font-semibold text-slate-700 tabular-nums">{to}</span> of{' '}
          <span className="font-semibold text-slate-700 tabular-nums">{total}</span>
        </span>
        {onPageSize && (
          <span className="hidden items-center gap-1.5 sm:flex">
            <span className="text-slate-400">·</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSize(Number(e.target.value));
                onPage(1);
              }}
              aria-label="Rows per page"
              className="cursor-pointer rounded-md border border-slate-200 bg-white py-1 pl-1.5 pr-1 text-[12px] text-slate-600 focus:border-brand-500 focus:outline-none"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[12.5px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Prev
        </button>
        <div className="flex items-center gap-0.5">
          {pages.map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="px-1 text-[12px] text-slate-400">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p)}
                aria-current={p === page ? 'page' : undefined}
                className={cn(
                  'h-8 min-w-8 rounded-lg px-2 text-[12.5px] font-medium tabular-nums transition-colors',
                  p === page
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                )}
              >
                {p}
              </button>
            )
          )}
        </div>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[12.5px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
