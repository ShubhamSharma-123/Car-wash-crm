import React from 'react';
import { Check, X, CalendarClock, UserX } from 'lucide-react';
import { cn } from '@/utils/cn';
import { BOOKING_FLOW, terminalStatuses } from '@/utils/statusStyles';
import { formatDateTime } from '@/utils/date';
import type { Booking, BookingStatus } from '@/types';

/** Horizontal / vertical lifecycle tracker for a booking. */
export function BookingStatusTracker({ booking }: { booking: Booking }) {
  const currentIndex = BOOKING_FLOW.indexOf(booking.status);
  const isTerminal = terminalStatuses.includes(booking.status);

  const reachedAt = (status: BookingStatus) =>
    booking.timeline.find((t) => t.status === status)?.at;

  if (isTerminal) {
    const entry = booking.timeline.find((t) => t.status === booking.status);
    const Icon = booking.status === 'Cancelled' ? X : booking.status === 'No Show' ? UserX : CalendarClock;
    return (
      <div className="rounded-xl border border-rose-200/70 bg-rose-50/50 p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-rose-500 ring-1 ring-rose-200">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-rose-700">
              Booking {booking.status.toLowerCase()}
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-rose-600/80">
              {entry?.note || 'This booking is no longer in the active service flow.'}
            </p>
            {entry && (
              <p className="mt-1.5 text-[11px] text-rose-500/80">
                {formatDateTime(entry.at)} · by {entry.by}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop horizontal tracker */}
      <div className="hidden md:block">
        <div className="relative flex items-start justify-between">
          {BOOKING_FLOW.map((status, i) => {
            const complete = i <= currentIndex;
            const active = i === currentIndex;
            return (
              <div key={status} className="relative flex flex-1 flex-col items-center px-1">
                {i < BOOKING_FLOW.length - 1 && (
                  <span
                    className={cn(
                      'absolute left-1/2 top-[13px] h-[2px] w-full',
                      i < currentIndex ? 'bg-brand-500' : 'bg-slate-200'
                    )}
                  />
                )}
                <span
                  className={cn(
                    'relative z-10 grid h-7 w-7 place-items-center rounded-full border-2 bg-white transition-colors',
                    complete
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-slate-200 text-slate-300',
                    active && 'ring-4 ring-brand-100'
                  )}
                >
                  {complete ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <span className="text-[10px] font-semibold">{i + 1}</span>}
                </span>
                <p
                  className={cn(
                    'mt-2 text-center text-[10.5px] font-medium leading-tight',
                    active ? 'text-navy-900' : complete ? 'text-slate-600' : 'text-slate-400'
                  )}
                >
                  {status}
                </p>
                {reachedAt(status) && (
                  <p className="mt-0.5 text-center text-[9.5px] text-slate-400">
                    {new Date(reachedAt(status)!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile vertical tracker */}
      <ol className="space-y-0 md:hidden">
        {BOOKING_FLOW.map((status, i) => {
          const complete = i <= currentIndex;
          const active = i === currentIndex;
          const at = reachedAt(status);
          return (
            <li key={status} className="relative flex gap-3 pb-4 last:pb-0">
              {i < BOOKING_FLOW.length - 1 && (
                <span
                  className={cn(
                    'absolute left-[11px] top-6 h-full w-[2px]',
                    i < currentIndex ? 'bg-brand-500' : 'bg-slate-200'
                  )}
                />
              )}
              <span
                className={cn(
                  'z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 bg-white',
                  complete ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 text-slate-300',
                  active && 'ring-4 ring-brand-100'
                )}
              >
                {complete ? <Check className="h-3 w-3" strokeWidth={3} /> : <span className="text-[9px]">{i + 1}</span>}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className={cn('text-[12px] font-medium', complete ? 'text-navy-900' : 'text-slate-400')}>{status}</p>
                {at && <p className="text-[10.5px] text-slate-400">{formatDateTime(at)}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
