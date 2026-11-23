import React from 'react';
import { cn } from '@/utils/cn';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Pagination } from './SearchBar';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  className?: string;
  headerClassName?: string;
  render: (row: T) => React.ReactNode;
}

export type SortDir = 'asc' | 'desc';

export function DataTable<T extends { id?: string }>({
  columns,
  rows,
  page,
  pageSize,
  onPage,
  onPageSize,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
  empty,
  className,
  dense,
  selectable,
  selected,
  onSelect,
  footer,
  rowClassName,
  minWidth = 880,
}: {
  columns: Column<T>[];
  rows: T[];
  page?: number;
  pageSize?: number;
  onPage?: (p: number) => void;
  onPageSize?: (n: number) => void;
  sortKey?: string;
  sortDir?: SortDir;
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;
  className?: string;
  dense?: boolean;
  selectable?: boolean;
  selected?: string[];
  onSelect?: (ids: string[]) => void;
  footer?: React.ReactNode;
  rowClassName?: (row: T) => string | undefined;
  minWidth?: number;
}) {
  const allIds = rows.map((r) => r.id).filter(Boolean) as string[];
  const allChecked = selectable && allIds.length > 0 && allIds.every((id) => selected?.includes(id));
  const someChecked = selectable && !allChecked && allIds.some((id) => selected?.includes(id));

  return (
    <div className={cn('card overflow-hidden', className)}>
      <div className="scroll-x">
        <table className="w-full border-collapse" style={{ minWidth }}>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70">
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={!!allChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = !!someChecked;
                    }}
                    onChange={(e) => onSelect?.(e.target.checked ? allIds : [])}
                    className="h-3.5 w-3.5 cursor-pointer rounded-[4px] border-slate-300 accent-brand-600"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'table-th',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.sortable && 'cursor-pointer select-none hover:text-slate-700',
                    col.headerClassName
                  )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                  aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <span
                    className={cn(
                      'inline-flex items-center gap-1',
                      col.align === 'right' && 'flex-row-reverse',
                      col.align === 'center' && 'justify-center'
                    )}
                  >
                    {col.header}
                    {col.sortable && (
                      <span className="text-slate-300">
                        {sortKey === col.key ? (
                          sortDir === 'asc' ? (
                            <ChevronUp className="h-3 w-3 text-brand-600" />
                          ) : (
                            <ChevronDown className="h-3 w-3 text-brand-600" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3 w-3" />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="p-0">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-slate-100 transition-colors last:border-0',
                    onRowClick && 'cursor-pointer hover:bg-slate-50/80',
                    rowClassName?.(row)
                  )}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label="Select row"
                        checked={!!row.id && !!selected?.includes(row.id)}
                        onChange={(e) => {
                          if (!row.id) return;
                          onSelect?.(
                            e.target.checked
                              ? [...(selected || []), row.id]
                              : (selected || []).filter((id) => id !== row.id)
                          );
                        }}
                        className="h-3.5 w-3.5 cursor-pointer rounded-[4px] border-slate-300 accent-brand-600"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'table-td',
                        dense && 'py-2',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.className
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {footer}
        </table>
      </div>
      {page !== undefined && pageSize !== undefined && onPage && (
        <Pagination page={page} pageSize={pageSize} total={rows.length} onPage={onPage} onPageSize={onPageSize} />
      )}
    </div>
  );
}

export function TableShell({
  children,
  className,
  title,
  description,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn('card', className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            {title && <h3 className="text-[13.5px] font-semibold text-navy-900">{title}</h3>}
            {description && <p className="mt-0.5 text-[12px] text-slate-500">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
