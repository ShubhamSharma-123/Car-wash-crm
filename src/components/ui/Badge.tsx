import React from 'react';
import { cn } from '@/utils/cn';
import type { BookingStatus, CustomerStatus, PaymentStatus, StaffStatus } from '@/types';
import {
  bookingStatusStyle,
  customerStatusStyle,
  paymentStatusStyle,
  staffStatusStyle,
  roleStyle,
} from '@/utils/statusStyles';

type Tone = 'slate' | 'blue' | 'green' | 'emerald' | 'amber' | 'red' | 'rose' | 'violet' | 'teal' | 'sky' | 'indigo';

const toneStyles: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-600 ring-slate-200/70',
  blue: 'bg-brand-50 text-brand-700 ring-brand-200/70',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200/70',
  red: 'bg-rose-50 text-rose-700 ring-rose-200/70',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200/70',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200/70',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200/70',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200/70',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200/70',
};

const dotStyles: Record<Tone, string> = {
  slate: 'bg-slate-400',
  blue: 'bg-brand-500',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-rose-500',
  violet: 'bg-violet-500',
  teal: 'bg-teal-500',
  sky: 'bg-sky-500',
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
};

export function Badge({
  children,
  tone = 'slate',
  dot = false,
  className,
  size = 'md',
}: {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-[3px] text-[11.5px]',
        toneStyles[tone],
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotStyles[tone])} />}
      {children}
    </span>
  );
}

export function BookingStatusBadge({ status, size }: { status: BookingStatus; size?: 'sm' | 'md' }) {
  const s = bookingStatusStyle[status];
  return (
    <Badge tone={s.tone} dot size={size}>
      {status}
    </Badge>
  );
}

export function PaymentStatusBadge({ status, size }: { status: PaymentStatus; size?: 'sm' | 'md' }) {
  const s = paymentStatusStyle[status];
  return (
    <Badge tone={s.tone} dot size={size}>
      {status}
    </Badge>
  );
}

export function CustomerStatusBadge({ status, size }: { status: CustomerStatus; size?: 'sm' | 'md' }) {
  const s = customerStatusStyle[status];
  return (
    <Badge tone={s.tone} dot size={size}>
      {status}
    </Badge>
  );
}

export function StaffStatusBadge({ status, size }: { status: StaffStatus; size?: 'sm' | 'md' }) {
  const s = staffStatusStyle[status];
  return (
    <Badge tone={s.tone} dot size={size}>
      {status}
    </Badge>
  );
}

export function RoleBadge({ role, size }: { role: keyof typeof roleStyle; size?: 'sm' | 'md' }) {
  return (
    <Badge tone={roleStyle[role]} size={size} className="font-semibold">
      {role}
    </Badge>
  );
}

/** Small metric delta pill — green up / red down */
export function TrendPill({
  value,
  className,
  invert = false,
}: {
  value: number;
  className?: string;
  invert?: boolean;
}) {
  const positive = invert ? value < 0 : value >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
        positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600',
        className
      )}
    >
      <svg viewBox="0 0 12 12" className={cn('h-2.5 w-2.5', !positive && 'rotate-180')} fill="currentColor">
        <path d="M6 2.2l4 4.4H2z" />
      </svg>
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}
