import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, MoreHorizontal, Eye, Pencil, Trash2, ReceiptText, CalendarClock } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PersonCell } from '@/components/ui/Avatar';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/ui/Badge';
import { VehicleThumb } from '@/components/ui/Logo';
import { EmptyState } from '@/components/ui/SearchBar';
import { Dropdown } from '@/components/ui/Dropdown';
import { useStore } from '@/context/StoreContext';
import { formatDate, formatDayShort, isToday, slotMinutes } from '@/utils/date';
import { formatINR } from '@/utils/format';
import type { Booking } from '@/types';
import { cn } from '@/utils/cn';

export function RecentBookings({
  onEdit,
  onDelete,
  limit = 7,
  showViewAll = true,
  title = 'Recent bookings',
  description = 'Latest activity across all service bays',
}: {
  onEdit?: (b: Booking) => void;
  onDelete?: (b: Booking) => void;
  limit?: number;
  showViewAll?: boolean;
  title?: string;
  description?: string;
}) {
  const { bookings, customerById, vehicleById, serviceById, staffById } = useStore();
  const navigate = useNavigate();

  const rows = useMemo(
    () =>
      bookings
        .slice()
        .sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date))
        .slice(0, limit),
    [bookings, limit]
  );

  const columns: Column<Booking>[] = [
    {
      key: 'id',
      header: 'Booking',
      render: (b) => (
        <Link
          to={`/bookings/${b.id}`}
          onClick={(e) => e.stopPropagation()}
          className="font-semibold tabular-nums text-brand-700 hover:text-brand-800 hover:underline"
        >
          {b.id}
        </Link>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (b) => {
        const c = customerById(b.customerId);
        return (
          <PersonCell
            name={c?.name || '—'}
            secondary={c?.phone}
            avatarTone={['blue', 'navy', 'teal', 'indigo', 'violet', 'emerald'][Number(b.id.slice(-1)) % 6]}
          />
        );
      },
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (b) => {
        const v = vehicleById(b.vehicleId);
        return (
          <div className="flex items-center gap-2">
            <VehicleThumb type={v?.type} tone={v?.type === 'Luxury' ? 'violet' : 'slate'} />
            <div className="min-w-0">
              <p className="whitespace-nowrap text-[12.5px] font-medium text-navy-900">{v?.registration}</p>
              <p className="truncate text-[11px] text-slate-500">
                {v?.brand} {v?.model}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'service',
      header: 'Service',
      render: (b) => {
        const first = serviceById(b.serviceIds[0]);
        return (
          <div className="min-w-0">
            <p className="max-w-[150px] truncate text-[12.5px] text-slate-700">{first?.name}</p>
            {b.serviceIds.length > 1 && (
              <p className="text-[10.5px] text-slate-400">+{b.serviceIds.length - 1} add-on</p>
            )}
          </div>
        );
      },
    },
    {
      key: 'date',
      header: 'Date & time',
      render: (b) => (
        <div className="whitespace-nowrap">
          <p className={cn('text-[12.5px]', isToday(b.date) ? 'font-semibold text-brand-700' : 'text-slate-700')}>
            {isToday(b.date) ? 'Today' : formatDayShort(b.date)}
          </p>
          <p className="text-[11px] text-slate-500">{b.timeSlot}</p>
        </div>
      ),
    },
    {
      key: 'staff',
      header: 'Assigned',
      render: (b) => {
        const s = staffById(b.assignedStaffId);
        return <span className="whitespace-nowrap text-[12.5px] text-slate-600">{s?.name}</span>;
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (b) => (
        <span className="whitespace-nowrap font-semibold tabular-nums text-navy-900">{formatINR(b.amount)}</span>
      ),
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (b) => <PaymentStatusBadge status={b.paymentStatus} size="sm" />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (b) => <BookingStatusBadge status={b.status} size="sm" />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (b) => (
        <Dropdown
          width="w-44"
          items={[
            { label: 'View details', icon: <Eye className="h-3.5 w-3.5" />, onClick: () => navigate(`/bookings/${b.id}`) },
            ...(onEdit ? [{ label: 'Edit booking', icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => onEdit(b) }] : []),
            {
              label: 'Invoice',
              icon: <ReceiptText className="h-3.5 w-3.5" />,
              onClick: () => navigate('/invoices'),
            },
            ...(onDelete
              ? ([{ separator: true }, { label: 'Delete', icon: <Trash2 className="h-3.5 w-3.5" />, danger: true, onClick: () => onDelete(b) }] as const)
              : []),
          ]}
          trigger={({ toggle }) => (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Booking actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
        />
      ),
    },
  ];

  return (
    <section className="card overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5 sm:px-5">
        <div>
          <h3 className="text-[13.5px] font-semibold text-navy-900">{title}</h3>
          <p className="mt-0.5 text-[12px] text-slate-500">{description}</p>
        </div>
        {showViewAll && (
          <Link
            to="/bookings"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-medium text-brand-600 transition-colors hover:bg-brand-50"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </header>
      <DataTable
        columns={columns}
        rows={rows}
        dense
        onRowClick={(b) => navigate(`/bookings/${b.id}`)}
        className="rounded-none border-0 shadow-none"
        empty={<EmptyState title="No bookings yet" description="New bookings from the website and mobile app will appear here." compact />}
      />
    </section>
  );
}

/** Today's appointment schedule (time-ordered) used on the dashboard. */
export function TodaySchedule({ limit = 5 }: { limit?: number }) {
  const { bookings, customerById, vehicleById, serviceById, staffById } = useStore();
  const navigate = useNavigate();

  const todays = useMemo(
    () =>
      bookings
        .filter((b) => isToday(b.date) && !['Cancelled', 'No Show'].includes(b.status))
        .sort((a, b) => slotMinutes(a.timeSlot) - slotMinutes(b.timeSlot))
        .slice(0, limit),
    [bookings, limit]
  );

  if (todays.length === 0) {
    return (
      <EmptyState
        title="No appointments today"
        description="The bay calendar is clear. New bookings will show up here instantly."
        icon={<CalendarClock className="h-5 w-5" />}
        compact
      />
    );
  }

  return (
    <div className="relative space-y-0">
      {todays.map((b, i) => {
        const c = customerById(b.customerId);
        const v = vehicleById(b.vehicleId);
        const s = serviceById(b.serviceIds[0]);
        const staff = staffById(b.assignedStaffId);
        const done = b.status === 'Completed';
        return (
          <button
            key={b.id}
            onClick={() => navigate(`/bookings/${b.id}`)}
            className="group relative flex w-full gap-3 pb-3.5 pl-1 text-left last:pb-0"
          >
            <div className="relative flex w-[46px] shrink-0 flex-col items-start pt-0.5">
              <span className="text-[11.5px] font-semibold tabular-nums text-navy-900">{b.timeSlot.split(' ')[0]}</span>
              <span className="text-[9.5px] font-medium uppercase text-slate-400">{b.timeSlot.split(' ')[1]}</span>
            </div>
            <div className="relative flex flex-col items-center pt-1.5">
              <span
                className={cn(
                  'z-10 h-2 w-2 shrink-0 rounded-full ring-2 ring-white',
                  done ? 'bg-emerald-500' : b.status === 'In Progress' ? 'bg-amber-500' : 'bg-brand-500'
                )}
              />
              {i < todays.length - 1 && <span className="absolute top-3.5 h-full w-px bg-slate-200" />}
            </div>
            <div className="min-w-0 flex-1 rounded-lg border border-transparent px-1 py-0.5 transition-colors group-hover:border-slate-200 group-hover:bg-slate-50/60">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[12.5px] font-medium text-navy-900">{c?.name}</p>
                <BookingStatusBadge status={b.status} size="sm" />
              </div>
              <p className="mt-0.5 truncate text-[11.5px] text-slate-500">
                {s?.name} · {v?.registration}
              </p>
              <p className="mt-0.5 text-[10.5px] text-slate-400">With {staff?.name}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
