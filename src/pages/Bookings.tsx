import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarPlus,
  Download,
  LayoutList,
  CalendarDays,
  Filter,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ReceiptText,
  X,
  SlidersHorizontal,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PageHeader, SegmentedControl } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { SearchBar, EmptyState, Pagination } from '@/components/ui/SearchBar';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PersonCell } from '@/components/ui/Avatar';
import { PaymentStatusBadge, BookingStatusBadge, Badge } from '@/components/ui/Badge';
import { VehicleThumb } from '@/components/ui/Logo';
import { FilterSelect, Dropdown } from '@/components/ui/Dropdown';
import { ConfirmDialog } from '@/components/ui/Modal';
import { BookingFormModal } from '@/components/bookings/BookingForm';
import { BookingStatusMenu } from '@/components/bookings/BookingStatusMenu';
import { useStore } from '@/context/StoreContext';
import { formatDate, formatDayShort, isToday, isFuture, TODAY_ISO, slotMinutes, formatDateTime, MONTHS } from '@/utils/date';
import { formatINR } from '@/utils/format';
import { downloadCSV } from '@/utils/ui';
import { bookingStatuses, paymentStatuses, bookingStatusStyle } from '@/utils/statusStyles';
import { cn } from '@/utils/cn';
import type { Booking } from '@/types';

type View = 'table' | 'calendar';
type Range = 'all' | 'today' | 'upcoming' | 'past';

export default function Bookings() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { bookings, customers, vehicles, services, staff, customerById, vehicleById, serviceById, staffById, dispatch } =
    useStore();

  const [view, setView] = useState<View>('table');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(params.get('status') || 'all');
  const [payment, setPayment] = useState('all');
  const [service, setService] = useState('all');
  const [staffId, setStaffId] = useState('all');
  const [range, setRange] = useState<Range>((params.get('range') as Range) || 'all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(params.get('new') === '1');
  const [editing, setEditing] = useState<Booking | null>(null);
  const [deleting, setDeleting] = useState<Booking | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // react to URL params (arriving from dashboard cards)
  useEffect(() => {
    if (params.get('new') === '1') {
      setFormOpen(true);
      params.delete('new');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      if (status !== 'all') {
        if (status === 'upcoming' ? !isFuture(b.date) : b.status !== status) return false;
      }
      if (payment !== 'all' && b.paymentStatus !== payment) return false;
      if (service !== 'all' && !b.serviceIds.includes(service)) return false;
      if (staffId !== 'all' && b.assignedStaffId !== staffId) return false;
      if (range === 'today' && !isToday(b.date)) return false;
      if (range === 'upcoming' && !isFuture(b.date)) return false;
      if (range === 'past' && (isFuture(b.date) || isToday(b.date))) return false;
      if (dateFrom && b.date < dateFrom) return false;
      if (dateTo && b.date > dateTo) return false;
      if (q) {
        const c = customerById(b.customerId);
        const v = vehicleById(b.vehicleId);
        const svc = b.serviceIds.map((id) => serviceById(id)?.name).join(' ');
        const haystack = `${b.id} ${c?.name} ${c?.phone} ${v?.registration} ${v?.brand} ${v?.model} ${svc} ${b.timeSlot}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [bookings, query, status, payment, service, staffId, range, dateFrom, dateTo, customerById, vehicleById, serviceById]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.date.localeCompare(a.date) || slotMinutes(b.timeSlot) - slotMinutes(a.timeSlot)),
    [filtered]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const activeFilters =
    (status !== 'all' ? 1 : 0) +
    (payment !== 'all' ? 1 : 0) +
    (service !== 'all' ? 1 : 0) +
    (staffId !== 'all' ? 1 : 0) +
    (range !== 'all' ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

  const resetFilters = () => {
    setStatus('all');
    setPayment('all');
    setService('all');
    setStaffId('all');
    setRange('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const exportCsv = () => {
    downloadCSV(`autosutraa-bookings-${TODAY_ISO}`, [
      ['Booking ID', 'Customer', 'Phone', 'Vehicle', 'Service', 'Date', 'Time', 'Amount', 'Paid', 'Payment', 'Staff', 'Status', 'Source'],
      ...sorted.map((b) => [
        b.id,
        customerById(b.customerId)?.name || '',
        customerById(b.customerId)?.phone || '',
        vehicleById(b.vehicleId)?.registration || '',
        b.serviceIds.map((id) => serviceById(id)?.name).join(' + '),
        b.date,
        b.timeSlot,
        b.amount,
        b.paidAmount,
        b.paymentStatus,
        staffById(b.assignedStaffId)?.name || '',
        b.status,
        b.source,
      ]),
    ]);
  };

  const columns: Column<Booking>[] = [
    {
      key: 'id',
      header: 'Booking ID',
      render: (b) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/bookings/${b.id}`);
          }}
          className="font-semibold tabular-nums text-brand-700 transition-colors hover:text-brand-800 hover:underline"
        >
          {b.id}
        </button>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (b) => {
        const c = customerById(b.customerId);
        return <PersonCell name={c?.name || '—'} secondary={c?.phone} avatarTone="blue" />;
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
      render: (b) => (
        <div className="min-w-0">
          <p className="max-w-[170px] truncate text-[12.5px] text-slate-700">{serviceById(b.serviceIds[0])?.name}</p>
          {b.serviceIds.length > 1 && <p className="text-[10.5px] text-slate-400">+ add-on</p>}
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date & slot',
      render: (b) => (
        <div className="whitespace-nowrap">
          <p className={cn('text-[12.5px]', isToday(b.date) ? 'font-semibold text-brand-700' : 'text-slate-700')}>
            {isToday(b.date) ? 'Today' : formatDate(b.date)}
          </p>
          <p className="text-[11px] text-slate-500">{b.timeSlot}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Price',
      align: 'right',
      render: (b) => (
        <div>
          <p className="whitespace-nowrap font-semibold tabular-nums text-navy-900">{formatINR(b.amount)}</p>
          {b.paidAmount > 0 && b.paidAmount < b.amount && (
            <p className="text-[10.5px] tabular-nums text-amber-600">₹{b.paidAmount.toLocaleString('en-IN')} paid</p>
          )}
        </div>
      ),
    },
    { key: 'payment', header: 'Payment', render: (b) => <PaymentStatusBadge status={b.paymentStatus} size="sm" /> },
    {
      key: 'staff',
      header: 'Assigned staff',
      render: (b) => <span className="whitespace-nowrap text-[12.5px] text-slate-600">{staffById(b.assignedStaffId)?.name}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (b) => <BookingStatusMenu booking={b} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (b) => (
        <Dropdown
          width="w-48"
          items={[
            { label: 'View details', icon: <Eye className="h-3.5 w-3.5" />, onClick: () => navigate(`/bookings/${b.id}`) },
            {
              label: 'Edit booking',
              icon: <Pencil className="h-3.5 w-3.5" />,
              onClick: () => {
                setEditing(b);
                setFormOpen(true);
              },
            },
            { label: 'View invoice', icon: <ReceiptText className="h-3.5 w-3.5" />, onClick: () => navigate('/invoices') },
            { separator: true },
            { label: 'Delete booking', icon: <Trash2 className="h-3.5 w-3.5" />, danger: true, onClick: () => setDeleting(b) },
          ]}
          trigger={({ toggle }) => (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
        />
      ),
    },
  ];

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: bookings.length };
    bookingStatuses.forEach((s) => (c[s] = bookings.filter((b) => b.status === s).length));
    return c;
  }, [bookings]);

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Manage every wash and detailing job from arrival to handover. Advance statuses inline, collect payments and keep the bays moving."
        meta={
          <>
            <Badge tone="blue" dot>
              {bookings.filter((b) => isToday(b.date)).length} today
            </Badge>
            <Badge tone="indigo" dot>
              {bookings.filter((b) => isFuture(b.date) && !['Cancelled', 'No Show'].includes(b.status)).length} upcoming
            </Badge>
            <Badge tone="amber" dot>
              {bookings.filter((b) => ['New', 'Confirmed'].includes(b.status)).length} awaiting confirmation
            </Badge>
          </>
        }
        actions={
          <>
            <Button variant="outline" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={exportCsv}>
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>
            <Button
              variant="primary"
              leftIcon={<CalendarPlus className="h-3.5 w-3.5" />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              New booking
            </Button>
          </>
        }
      />

      {/* Status quick pills */}
      <div className="mb-3 scroll-x no-scrollbar flex items-center gap-1.5 pb-1">
        {['all', ...bookingStatuses].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors',
              status === s
                ? 'border-navy-900 bg-navy-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            {s !== 'all' && (
              <span className={cn('h-1.5 w-1.5 rounded-full', bookingStatusStyle[s as keyof typeof bookingStatusStyle].dot)} />
            )}
            {s === 'all' ? 'All bookings' : s}
            <span className={cn('tabular-nums', status === s ? 'text-slate-300' : 'text-slate-400')}>{counts[s] || 0}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <SearchBar
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(1);
            }}
            placeholder="Search booking ID, customer, vehicle…"
            className="w-full sm:w-[300px]"
          />
          <Button
            variant="outline"
            leftIcon={<SlidersHorizontal className="h-3.5 w-3.5" />}
            onClick={() => setShowFilters((s) => !s)}
            className={cn(activeFilters > 0 && 'border-brand-200 bg-brand-50/60 text-brand-700')}
          >
            Filters
            {activeFilters > 0 && (
              <span className="ml-0.5 rounded-full bg-brand-600 px-1.5 text-[10px] font-semibold text-white">
                {activeFilters}
              </span>
            )}
          </Button>
          {activeFilters > 0 && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-500 hover:text-rose-600"
            >
              <X className="h-3 w-3" /> Clear all
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-[11.5px] text-slate-400 sm:block">{sorted.length} results</span>
          <SegmentedControl<View>
            value={view}
            onChange={setView}
            options={[
              { value: 'table', label: 'Table', icon: <LayoutList className="h-3.5 w-3.5" /> },
              { value: 'calendar', label: 'Calendar', icon: <CalendarDays className="h-3.5 w-3.5" /> },
            ]}
          />
        </div>
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="card mb-3 animate-slide-up p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-[11.5px] font-medium text-slate-600">Booking status</label>
              <FilterSelect
                label="Status"
                value={status}
                onChange={(v) => {
                  setStatus(v);
                  setPage(1);
                }}
                options={[{ value: 'all', label: 'All statuses' }, ...bookingStatuses.map((s) => ({ value: s, label: s }))]}
                width="w-full"
                className="w-full [&>button]:w-full [&>button]:justify-between"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] font-medium text-slate-600">Payment status</label>
              <FilterSelect
                label="Payment"
                value={payment}
                onChange={(v) => {
                  setPayment(v);
                  setPage(1);
                }}
                options={[{ value: 'all', label: 'All payments' }, ...paymentStatuses.map((s) => ({ value: s, label: s }))]}
                width="w-full"
                className="w-full [&>button]:w-full [&>button]:justify-between"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] font-medium text-slate-600">Service</label>
              <FilterSelect
                label="Service"
                value={service}
                onChange={(v) => {
                  setService(v);
                  setPage(1);
                }}
                options={[{ value: 'all', label: 'All services' }, ...services.map((s) => ({ value: s.id, label: s.name }))]}
                width="w-full"
                className="w-full [&>button]:w-full [&>button]:justify-between"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] font-medium text-slate-600">Assigned staff</label>
              <FilterSelect
                label="Staff"
                value={staffId}
                onChange={(v) => {
                  setStaffId(v);
                  setPage(1);
                }}
                options={[{ value: 'all', label: 'All staff' }, ...staff.map((s) => ({ value: s.id, label: s.name }))]}
                width="w-full"
                className="w-full [&>button]:w-full [&>button]:justify-between"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] font-medium text-slate-600">From date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-lg border border-slate-300 px-3 text-[12.5px] text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-[3px] focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] font-medium text-slate-600">To date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-lg border border-slate-300 px-3 text-[12.5px] text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-[3px] focus:ring-brand-100"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-[11.5px] font-medium text-slate-600">Quick range</label>
              <SegmentedControl<Range>
                value={range}
                onChange={(v) => {
                  setRange(v);
                  setPage(1);
                }}
                options={[
                  { value: 'all', label: 'All time' },
                  { value: 'today', label: 'Today' },
                  { value: 'upcoming', label: 'Upcoming' },
                  { value: 'past', label: 'Past' },
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {view === 'table' ? (
        <>
          <DataTable
            columns={columns}
            rows={paged}
            onRowClick={(b) => navigate(`/bookings/${b.id}`)}
            empty={
              <EmptyState
                title="No bookings match these filters"
                description="Try clearing filters or search for a different booking ID, customer or vehicle."
                icon={<CalendarCheck className="h-5 w-5" />}
                action={
                  <Button variant="outline" onClick={resetFilters}>
                    Clear filters
                  </Button>
                }
              />
            }
          />
          <div className="card mt-0 overflow-hidden rounded-t-none border-t-0">
            <Pagination
              page={safePage}
              pageSize={pageSize}
              total={sorted.length}
              onPage={setPage}
              onPageSize={setPageSize}
            />
          </div>
        </>
      ) : (
        <CalendarView rows={sorted} onOpen={(b) => navigate(`/bookings/${b.id}`)} />
      )}

      <BookingFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        booking={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && dispatch({ type: 'DELETE_BOOKING', payload: deleting.id })}
        title={`Delete booking ${deleting?.id}?`}
        message={
          <>
            This removes the booking record and its timeline from the CRM. Customer history totals will be recalculated
            automatically. This action cannot be undone.
          </>
        }
        confirmLabel="Delete booking"
      />
    </div>
  );
}

/** Simple month-grid calendar of bookings — groups by date with a day detail panel. */
function CalendarView({ rows, onOpen }: { rows: Booking[]; onOpen: (b: Booking) => void }) {
  const { serviceById, customerById, vehicleById } = useStore();
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<string>(TODAY_ISO);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    rows.forEach((b) => {
      const arr = map.get(b.date) || [];
      arr.push(b);
      map.set(b.date, arr);
    });
    return map;
  }, [rows]);

  const cells: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
    }),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedBookings = (byDate.get(selected) || []).sort((a, b) => slotMinutes(a.timeSlot) - slotMinutes(b.timeSlot));

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_360px]">
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <h3 className="min-w-[132px] text-center text-[13.5px] font-semibold text-navy-900">
              {MONTHS[month]} {year}
            </h3>
            <button
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
              aria-label="Next month"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCursor(new Date());
                setSelected(TODAY_ISO);
              }}
              className="rounded-lg border border-slate-200 px-2 py-1 text-[11.5px] font-medium text-slate-600 hover:bg-slate-50"
            >
              Today
            </button>
            <span className="hidden text-[11px] text-slate-400 sm:block">{rows.length} bookings</span>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="py-2 text-center text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((iso, i) => {
            if (!iso) return <div key={`e${i}`} className="min-h-[76px] border-b border-r border-slate-100 bg-slate-50/30" />;
            const list = byDate.get(iso) || [];
            const isTodayCell = iso === TODAY_ISO;
            const isSelected = iso === selected;
            return (
              <button
                key={iso}
                onClick={() => setSelected(iso)}
                className={cn(
                  'min-h-[76px] border-b border-r border-slate-100 p-1.5 text-left align-top transition-colors hover:bg-slate-50',
                  isSelected && 'bg-brand-50/50 ring-1 ring-inset ring-brand-300'
                )}
              >
                <span
                  className={cn(
                    'inline-grid h-5 w-5 place-items-center rounded-full text-[11px] font-semibold',
                    isTodayCell ? 'bg-brand-600 text-white' : 'text-slate-600'
                  )}
                >
                  {Number(iso.slice(-2))}
                </span>
                <div className="mt-1 space-y-0.5">
                  {list.slice(0, 2).map((b) => (
                    <span
                      key={b.id}
                      className="flex items-center gap-1 truncate rounded px-1 py-[1px] text-[9.5px] font-medium"
                      style={{
                        background:
                          b.status === 'Completed'
                            ? '#ecfdf5'
                            : b.status === 'Cancelled'
                              ? '#fff1f2'
                              : b.status === 'In Progress'
                                ? '#fffbeb'
                                : '#eff6ff',
                        color:
                          b.status === 'Completed'
                            ? '#047857'
                            : b.status === 'Cancelled'
                              ? '#be123c'
                              : b.status === 'In Progress'
                                ? '#b45309'
                                : '#1d4ed8',
                      }}
                    >
                      {b.timeSlot.replace(' ', '')} {customerById(b.customerId)?.name.split(' ')[0]}
                    </span>
                  ))}
                  {list.length > 2 && (
                    <span className="block px-1 text-[9px] font-medium text-slate-400">+{list.length - 2} more</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card flex flex-col overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-[13.5px] font-semibold text-navy-900">{formatDayShort(selected)}</h3>
          <p className="mt-0.5 text-[11.5px] text-slate-500">
            {selectedBookings.length} appointment{selectedBookings.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="max-h-[520px] flex-1 space-y-2 overflow-y-auto p-3">
          {selectedBookings.length === 0 ? (
            <EmptyState title="No bookings" description="This date has no appointments scheduled." compact />
          ) : (
            selectedBookings.map((b) => {
              const c = customerById(b.customerId);
              const v = vehicleById(b.vehicleId);
              return (
                <button
                  key={b.id}
                  onClick={() => onOpen(b)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11.5px] font-semibold text-navy-900">{b.timeSlot}</span>
                    <PaymentStatusBadge status={b.paymentStatus} size="sm" />
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="truncate text-[12.5px] font-medium text-slate-800">{c?.name}</p>
                    <BookingStatusBadge status={b.status} size="sm" />
                  </div>
                  <p className="truncate text-[11px] text-slate-500">
                    {b.serviceIds.map((sid) => serviceById(sid)?.name).join(' + ')} · {v?.registration}
                  </p>
                  <p className="mt-1 flex items-center gap-1 truncate text-[10.5px] text-slate-400">
                    <span className="font-medium text-slate-500">{b.id}</span> · {formatDate(b.date)}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
