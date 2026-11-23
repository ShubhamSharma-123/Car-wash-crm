import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownItem {
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  active?: boolean;
  disabled?: boolean;
  separator?: never;
}

export interface DropdownSeparator {
  separator: true;
}

export type DropdownEntry = DropdownItem | DropdownSeparator;

export function Dropdown({
  trigger,
  items,
  align = 'right',
  width = 'w-56',
  header,
  footer,
  className,
  panelClassName,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => React.ReactNode;
  items: DropdownEntry[];
  align?: 'left' | 'right';
  width?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-1.5 origin-top animate-scale-in rounded-xl border border-slate-200 bg-white p-1 shadow-dropdown',
            align === 'right' ? 'right-0' : 'left-0',
            width,
            panelClassName
          )}
          role="menu"
        >
          {header && <div className="border-b border-slate-100 px-2.5 py-2">{header}</div>}
          <div className="max-h-72 overflow-y-auto py-0.5">
            {items.map((item, i) =>
              'separator' in item && item.separator ? (
                <div key={`sep-${i}`} className="my-1 border-t border-slate-100" />
              ) : (
                <button
                  key={i}
                  role="menuitem"
                  disabled={(item as DropdownItem).disabled}
                  onClick={() => {
                    (item as DropdownItem).onClick?.();
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-[13px] transition-colors',
                    (item as DropdownItem).disabled
                      ? 'cursor-not-allowed text-slate-300'
                      : (item as DropdownItem).danger
                        ? 'text-rose-600 hover:bg-rose-50'
                        : 'text-slate-700 hover:bg-slate-100/80 hover:text-navy-900',
                    (item as DropdownItem).active && 'bg-slate-50 font-medium text-navy-900'
                  )}
                >
                  {(item as DropdownItem).icon && (
                    <span className="shrink-0 text-slate-400 [.text-rose-600_&]:text-rose-500">
                      {(item as DropdownItem).icon}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate">{(item as DropdownItem).label}</span>
                  {(item as DropdownItem).active && <Check className="h-3.5 w-3.5 text-brand-600" />}
                </button>
              )
            )}
          </div>
          {footer && <div className="border-t border-slate-100 px-2.5 py-2">{footer}</div>}
        </div>
      )}
    </div>
  );
}

/** Compact select-like filter with a dropdown panel. */
export function FilterSelect({
  label,
  value,
  options,
  onChange,
  icon,
  className,
  width = 'w-52',
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  className?: string;
  width?: string;
}) {
  const selected = options.find((o) => o.value === value);
  const isActive = value !== '' && value !== 'all';
  return (
    <Dropdown
      className={className}
      width={width}
      align="left"
      items={options.map((o) => ({
        label: o.label,
        active: o.value === value,
        onClick: () => onChange(o.value),
      }))}
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-lg border bg-white px-3 text-[12.5px] font-medium transition-colors focus-ring',
            isActive
              ? 'border-brand-200 bg-brand-50/60 text-brand-700'
              : 'border-slate-300 text-slate-600 hover:border-slate-400 hover:text-navy-900',
            open && 'border-brand-300 ring-[3px] ring-brand-100'
          )}
        >
          {icon && <span className={cn('shrink-0', isActive ? 'text-brand-500' : 'text-slate-400')}>{icon}</span>}
          <span className="whitespace-nowrap">
            {label}
            {isActive && <span className="text-slate-400"> · </span>}
            {isActive && <span className="font-semibold">{selected?.label}</span>}
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', isActive ? 'text-brand-400' : 'text-slate-400', open && 'rotate-180')} />
        </button>
      )}
    />
  );
}
