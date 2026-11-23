import React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Dropdown } from '@/components/ui/Dropdown';
import { bookingStatuses, bookingStatusStyle } from '@/utils/statusStyles';
import { useStore } from '@/context/StoreContext';
import { cn } from '@/utils/cn';
import type { Booking, BookingStatus } from '@/types';

/** Lets staff advance/correct a booking's lifecycle status from any table or detail view. */
export function BookingStatusMenu({
  booking,
  size = 'sm',
  align = 'left',
  onChange,
}: {
  booking: Booking;
  size?: 'sm' | 'md';
  align?: 'left' | 'right';
  onChange?: (status: BookingStatus) => void;
}) {
  const { dispatch, user } = useStore();
  const style = bookingStatusStyle[booking.status];

  return (
    <Dropdown
      align={align}
      width="w-56"
      items={bookingStatuses.map((status) => ({
        label: (
          <span className="flex items-center gap-2">
            <span className={cn('h-1.5 w-1.5 rounded-full', bookingStatusStyle[status].dot)} />
            {status}
          </span>
        ),
        active: status === booking.status,
        onClick: () => {
          if (status === booking.status) return;
          dispatch({
            type: 'SET_BOOKING_STATUS',
            payload: { id: booking.id, status, by: user.name, note: 'Status updated from CRM' },
          });
          onChange?.(status);
        },
      }))}
      header={<p className="px-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-400">Update status</p>}
      trigger={({ toggle }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset transition-colors',
            size === 'sm' ? 'px-2 py-[3px] text-[11.5px]' : 'px-2.5 py-1 text-[12.5px]',
            bookingStatusStyle[booking.status].tone === 'green' && 'bg-emerald-50 text-emerald-700 ring-emerald-200/70 hover:bg-emerald-100',
            bookingStatusStyle[booking.status].tone === 'blue' && 'bg-brand-50 text-brand-700 ring-brand-200/70 hover:bg-brand-100',
            bookingStatusStyle[booking.status].tone === 'indigo' && 'bg-indigo-50 text-indigo-700 ring-indigo-200/70 hover:bg-indigo-100',
            bookingStatusStyle[booking.status].tone === 'sky' && 'bg-sky-50 text-sky-700 ring-sky-200/70 hover:bg-sky-100',
            bookingStatusStyle[booking.status].tone === 'amber' && 'bg-amber-50 text-amber-700 ring-amber-200/70 hover:bg-amber-100',
            bookingStatusStyle[booking.status].tone === 'violet' && 'bg-violet-50 text-violet-700 ring-violet-200/70 hover:bg-violet-100',
            bookingStatusStyle[booking.status].tone === 'teal' && 'bg-teal-50 text-teal-700 ring-teal-200/70 hover:bg-teal-100',
            bookingStatusStyle[booking.status].tone === 'red' && 'bg-rose-50 text-rose-700 ring-rose-200/70 hover:bg-rose-100',
            bookingStatusStyle[booking.status].tone === 'slate' && 'bg-slate-100 text-slate-600 ring-slate-200 hover:bg-slate-200'
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
          {booking.status}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      )}
    />
  );
}
