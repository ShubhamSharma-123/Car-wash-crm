import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Pencil,
  Printer,
  ReceiptText,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Car,
  User,
  Wallet,
  Clock,
  MessageSquare,
  ChevronRight,
  ArrowRight,
  StickyNote,
  CircleCheck,
  CalendarDays,
  IndianRupee,
  Download,
} from 'lucide-react';
import { PageHeader, SectionCard, DetailRow, Tabs } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { Badge, PaymentStatusBadge, BookingStatusBadge } from '@/components/ui/Badge';
import { Avatar, PersonCell } from '@/components/ui/Avatar';
import { VehicleThumb } from '@/components/ui/Logo';
import { EmptyState } from '@/components/ui/SearchBar';
import { ConfirmDialog } from '@/components/ui/Modal';
import { BookingStatusTracker } from '@/components/bookings/BookingStatusTracker';
import { BookingStatusMenu } from '@/components/bookings/BookingStatusMenu';
import { BookingFormModal } from '@/components/bookings/BookingForm';
import { useStore } from '@/context/StoreContext';
import { formatDate, formatDateTime, formatTime, isToday, isFuture, slotMinutes } from '@/utils/date';
import { formatINR } from '@/utils/format';
import { downloadCSV } from '@/utils/ui';
import { BOOKING_FLOW, terminalStatuses, bookingStatusStyle } from '@/utils/statusStyles';
import { cn } from '@/utils/cn';

type Tab = 'overview' | 'timeline' | 'payment' | 'notes';

export default function BookingDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    bookingById,
    customerById,
    vehicleById,
    serviceById,
    staffById,
    bookings,
    invoices,
    payments,
    dispatch,
    user,
  } = useStore();

  const [tab, setTab] = useState<Tab>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [note, setNote] = useState('');

  const booking = bookingById(id || '');

  const nextStatus = useMemo(() => {
    if (!booking) return null;
    if (terminalStatuses.includes(booking.status)) return null;
    const idx = BOOKING_FLOW.indexOf(booking.status);
    return idx >= 0 && idx < BOOKING_FLOW.length - 1 ? BOOKING_FLOW[idx + 1] : null;
  }, [booking]);

  if (!booking) {
    return (
      <div>
        <PageHeader title="Booking not found" description="This booking may have been deleted or the link is incorrect." backTo="/bookings" backLabel="Back to bookings" />
        <div className="card">
          <EmptyState
            title="We couldn't find that booking"
            description="Check the booking ID or browse the full booking list."
            action={
              <Button variant="primary" onClick={() => navigate('/bookings')}>
                Go to bookings
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const customer = customerById(booking.customerId);
  const vehicle = vehicleById(booking.vehicleId);
  const staff = staffById(booking.assignedStaffId);
  const services = booking.serviceIds.map((sid) => serviceById(sid)).filter(Boolean);
  const subtotal = services.reduce((a, s) => a + (s?.price || 0), 0);
  const invoice = invoices.find((i) => i.bookingId === booking.id);
  const payment = payments.find((p) => p.bookingId === booking.id);
  const customerBookings = bookings
    .filter((b) => b.customerId === booking.customerId)
    .sort((a, b) => b.date.localeCompare(a.date));
  const balance = booking.amount - booking.paidAmount;

  const timeline = [...booking.timeline].sort((a, b) => a.at.localeCompare(b.at));

  const advance = () => {
    if (!nextStatus) return;
    dispatch({
      type: 'SET_BOOKING_STATUS',
      payload: { id: booking.id, status: nextStatus, by: user.name, note: `Advanced to ${nextStatus}` },
    });
  };

  const addNote = () => {
    if (!note.trim()) return;
    dispatch({
      type: 'UPDATE_BOOKING',
      payload: { ...booking, internalNotes: `${booking.internalNotes ? `${booking.internalNotes}\n` : ''}[${user.name}] ${note.trim()}` },
    });
    setNote('');
  };

  const printReceipt = () => window.print();

  const exportBooking = () =>
    downloadCSV(`booking-${booking.id}`, [
      ['Field', 'Value'],
      ['Booking ID', booking.id],
      ['Customer', customer?.name || ''],
      ['Phone', customer?.phone || ''],
      ['Vehicle', `${vehicle?.registration} ${vehicle?.brand} ${vehicle?.model}`],
      ['Services', services.map((s) => s?.name).join(' + ')],
      ['Date', booking.date],
      ['Slot', booking.timeSlot],
      ['Amount', booking.amount],
      ['Paid', booking.paidAmount],
      ['Payment status', booking.paymentStatus],
      ['Staff', staff?.name || ''],
      ['Status', booking.status],
      ['Source', booking.source],
    ]);

  return (
    <div>
      <PageHeader
        title={`Booking ${booking.id}`}
        backTo="/bookings"
        backLabel="Back to bookings"
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{formatDate(booking.date)}</span>
            <span className="text-slate-300">·</span>
            <span>{booking.timeSlot}</span>
            <span className="text-slate-300">·</span>
            <span>{booking.source}</span>
            <span className="text-slate-300">·</span>
            <span>Created {formatDateTime(booking.createdAt)}</span>
          </span>
        }
        meta={
          <>
            <BookingStatusMenu booking={booking} size="md" />
            <PaymentStatusBadge status={booking.paymentStatus} />
            {isToday(booking.date) && <Badge tone="blue" dot>Today</Badge>}
            {isFuture(booking.date) && <Badge tone="indigo" dot>Upcoming</Badge>}
          </>
        }
        actions={
          <>
            <Button variant="outline" size="icon" onClick={exportBooking} aria-label="Download booking summary">
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" onClick={printReceipt} aria-label="Print booking">
              <Printer className="h-3.5 w-3.5" />
            </Button>
            {invoice && (
              <Button
                variant="outline"
                leftIcon={<ReceiptText className="h-3.5 w-3.5" />}
                onClick={() => navigate(`/invoices/${invoice.id}`)}
              >
                <span className="hidden sm:inline">Invoice</span>
              </Button>
            )}
            <Button variant="outline" leftIcon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditOpen(true)}>
              <span className="hidden sm:inline">Edit</span>
            </Button>
            {nextStatus ? (
              <Button variant="primary" rightIcon={<ArrowRight className="h-3.5 w-3.5" />} onClick={advance}>
                Mark {nextStatus}
              </Button>
            ) : (
              <Button variant="outline" leftIcon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            )}
          </>
        }
      />

      {/* Lifecycle tracker */}
      <SectionCard
        className="mb-3"
        title="Booking progress"
        description="Live lifecycle tracking shared with the customer mobile app"
        action={
          <div className="flex items-center gap-2">
            <Badge tone={bookingStatusStyle[booking.status].tone}>{booking.status}</Badge>
            {nextStatus && (
              <Button size="sm" variant="soft" rightIcon={<ChevronRight className="h-3 w-3" />} onClick={advance}>
                {nextStatus}
              </Button>
            )}
          </div>
        }
      >
        <BookingStatusTracker booking={booking} />
      </SectionCard>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        {/* Main column */}
        <div className="space-y-3 xl:col-span-2">
          <div className="card overflow-hidden">
            <Tabs<Tab>
              value={tab}
              onChange={setTab}
              className="px-2 pt-1"
              tabs={[
                { value: 'overview', label: 'Overview' },
                { value: 'timeline', label: 'Timeline' },
                { value: 'payment', label: 'Payment' },
                { value: 'notes', label: 'Notes' },
              ]}
            />
            <div className="p-4 sm:p-5">
              {tab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-3.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Customer</h4>
                        <Link to={`/customers/${customer?.id}`} className="text-[11px] font-medium text-brand-600 hover:underline">
                          Profile
                        </Link>
                      </div>
                      <div className="mt-2.5 flex items-center gap-2.5">
                        <Avatar name={customer?.name || '—'} tone="blue" size="md" />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-navy-900">{customer?.name}</p>
                          <p className="truncate text-[11.5px] text-slate-500">{customer?.status} · {customer?.totalBookings} bookings</p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1.5 text-[12px]">
                        <p className="flex items-center gap-2 text-slate-600">
                          <Phone className="h-3 w-3 text-slate-400" /> {customer?.phone}
                        </p>
                        <p className="flex items-center gap-2 truncate text-slate-600">
                          <Mail className="h-3 w-3 shrink-0 text-slate-400" /> <span className="truncate">{customer?.email}</span>
                        </p>
                        <p className="flex items-start gap-2 text-slate-600">
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" /> {customer?.city}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-3.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Vehicle</h4>
                        <Link to={`/vehicles/${vehicle?.id}`} className="text-[11px] font-medium text-brand-600 hover:underline">
                          Details
                        </Link>
                      </div>
                      <div className="mt-2.5 flex items-center gap-2.5">
                        <VehicleThumb type={vehicle?.type} tone={vehicle?.type === 'Luxury' ? 'violet' : 'blue'} />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-navy-900">{vehicle?.registration}</p>
                          <p className="truncate text-[11.5px] text-slate-500">
                            {vehicle?.brand} {vehicle?.model} · {vehicle?.year}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1.5 text-[12px] text-slate-600">
                        <p className="flex justify-between">
                          <span className="text-slate-500">Type</span> <span>{vehicle?.type}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-500">Colour</span> <span>{vehicle?.color}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-500">Last service</span> <span>{formatDate(vehicle?.lastService)}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Services */}
                  <div>
                    <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Selected services</h4>
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                      {services.map((s) => (
                        <div key={s?.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-[12.5px] font-medium text-navy-900">{s?.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {s?.duration} min · {s?.category}
                            </p>
                          </div>
                          <span className="shrink-0 text-[12.5px] font-semibold tabular-nums text-navy-900">
                            {formatINR(s?.price || 0)}
                          </span>
                        </div>
                      ))}
                      <div className="space-y-1 bg-slate-50/60 px-3.5 py-2.5 text-[12px]">
                        <div className="flex justify-between text-slate-600">
                          <span>Subtotal</span>
                          <span className="tabular-nums">{formatINR(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Discount</span>
                          <span className="tabular-nums text-rose-600">− {formatINR(booking.discount)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>GST (18%)</span>
                          <span className="tabular-nums">{formatINR(booking.tax)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-1 text-[13px] font-semibold text-navy-900">
                          <span>Total</span>
                          <span className="tabular-nums">{formatINR(booking.amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assignment */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-3.5">
                      <h4 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Assigned staff</h4>
                      <div className="mt-2.5">
                        <PersonCell name={staff?.name || '—'} secondary={`${staff?.role} · ${staff?.shift}`} avatarTone={staff?.avatarTone} size="md" />
                      </div>
                      <div className="mt-2.5 flex items-center gap-2 text-[11.5px] text-slate-500">
                        <Phone className="h-3 w-3 text-slate-400" /> {staff?.phone}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3.5">
                      <h4 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Appointment</h4>
                      <div className="mt-2 space-y-1">
                        <DetailRow label="Date" value={formatDate(booking.date)} />
                        <DetailRow label="Time slot" value={booking.timeSlot} />
                        <DetailRow label="Duration" value={`${services.reduce((a, s) => a + (s?.duration || 0), 0)} min`} />
                        <DetailRow label="Source" value={booking.source} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'timeline' && (
                <ol className="relative space-y-0">
                  {timeline.map((t, i) => (
                    <li key={`${t.status}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
                      {i < timeline.length - 1 && <span className="absolute left-[13px] top-7 h-full w-px bg-slate-200" />}
                      <span
                        className={cn(
                          'z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full ring-4 ring-white',
                          ['Cancelled', 'No Show'].includes(t.status)
                            ? 'bg-rose-100 text-rose-600'
                            : t.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'bg-brand-100 text-brand-700'
                        )}
                      >
                        <CircleCheck className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[12.5px] font-semibold text-navy-900">{t.status}</p>
                          <span className="text-[10.5px] text-slate-400">{formatDateTime(t.at)}</span>
                        </div>
                        <p className="mt-0.5 text-[12px] text-slate-600">{t.note || 'Status updated'}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">by {t.by}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              {tab === 'payment' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: 'Total', value: formatINR(booking.amount), tone: 'text-navy-900' },
                      { label: 'Paid', value: formatINR(booking.paidAmount), tone: 'text-emerald-600' },
                      { label: 'Balance', value: formatINR(balance), tone: balance > 0 ? 'text-amber-600' : 'text-slate-500' },
                      { label: 'Status', value: booking.paymentStatus, tone: 'text-navy-900' },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl border border-slate-200 p-3">
                        <p className="text-[10.5px] font-medium uppercase tracking-[0.05em] text-slate-400">{s.label}</p>
                        <p className={cn('mt-1 text-[15px] font-semibold tabular-nums', s.tone)}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-200">
                    <div className="border-b border-slate-100 px-3.5 py-2.5">
                      <h4 className="text-[12px] font-semibold text-navy-900">Transaction record</h4>
                    </div>
                    {payment ? (
                      <div className="space-y-0 divide-y divide-slate-100 text-[12.5px]">
                        <DetailRow className="px-3.5" label="Transaction ID" value={<span className="tabular-nums">{payment.id}</span>} />
                        <DetailRow className="px-3.5" label="Method" value={payment.method} />
                        <DetailRow className="px-3.5" label="Date" value={formatDate(payment.date)} />
                        <DetailRow className="px-3.5" label="Reference" value={<span className="tabular-nums">{payment.reference}</span>} />
                        <DetailRow className="px-3.5" label="Collected by" value={payment.collectedBy} />
                        <DetailRow className="px-3.5" label="Status" value={<PaymentStatusBadge status={payment.status} size="sm" />} />
                      </div>
                    ) : (
                      <div className="px-3.5 py-4 text-[12.5px] text-slate-500">No transaction recorded yet.</div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" size="sm" leftIcon={<Wallet className="h-3.5 w-3.5" />} onClick={() => navigate('/payments?record=' + booking.id)}>
                      Record payment
                    </Button>
                    {invoice && (
                      <Button variant="outline" size="sm" leftIcon={<ReceiptText className="h-3.5 w-3.5" />} onClick={() => navigate(`/invoices/${invoice.id}`)}>
                        View invoice {invoice.id}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {tab === 'notes' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Customer notes</h4>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-[12.5px] leading-relaxed text-slate-700">
                      {booking.notes || 'No customer-facing notes on this booking.'}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Internal notes</h4>
                    <div className="whitespace-pre-line rounded-xl border border-amber-200/70 bg-amber-50/50 p-3 text-[12.5px] leading-relaxed text-amber-900">
                      {booking.internalNotes || 'No internal notes yet. Add one below — visible to staff only.'}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11.5px] font-medium text-slate-600">Add internal note</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      placeholder="e.g. Customer requested extra vacuum on rear seats"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[12.5px] focus:border-brand-500 focus:outline-none focus:ring-[3px] focus:ring-brand-100"
                    />
                    <div className="mt-2 flex justify-end">
                      <Button variant="primary" size="sm" leftIcon={<StickyNote className="h-3.5 w-3.5" />} onClick={addNote} disabled={!note.trim()}>
                        Save note
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-3">
          <SectionCard title="Payment summary" description="Billing at a glance" icon={<Wallet className="h-4 w-4" />}>
            <div className="space-y-2 text-[12.5px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Services</span>
                <span className="tabular-nums text-slate-700">{formatINR(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Discount</span>
                <span className="tabular-nums text-rose-600">− {formatINR(booking.discount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tax (GST 18%)</span>
                <span className="tabular-nums text-slate-700">{formatINR(booking.tax)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-[14px] font-semibold text-navy-900">
                <span>Total</span>
                <span className="tabular-nums">{formatINR(booking.amount)}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-600">
                <span>Paid</span>
                <span className="tabular-nums font-medium">{formatINR(booking.paidAmount)}</span>
              </div>
              <div
                className={cn(
                  'flex items-center justify-between rounded-lg px-2.5 py-2 text-[12.5px] font-semibold',
                  balance > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                )}
              >
                <span>{balance > 0 ? 'Balance due' : 'Fully settled'}</span>
                <span className="tabular-nums">{formatINR(Math.max(0, balance))}</span>
              </div>
              <div className="pt-1">
                <PaymentStatusBadge status={booking.paymentStatus} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Customer history" description={`${customerBookings.length} bookings with AutoSutraa`} icon={<User className="h-4 w-4" />}>
            <div className="space-y-2">
              {customerBookings.slice(0, 4).map((b) => (
                <button
                  key={b.id}
                  onClick={() => navigate(`/bookings/${b.id}`)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-lg border p-2 text-left transition-colors',
                    b.id === booking.id ? 'border-brand-200 bg-brand-50/50' : 'border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-navy-900">{b.id}</p>
                    <p className="truncate text-[10.5px] text-slate-500">
                      {formatDate(b.date)} · {serviceById(b.serviceIds[0])?.name}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11.5px] font-semibold tabular-nums text-slate-700">{formatINR(b.amount)}</span>
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-2 w-full" rightIcon={<ChevronRight className="h-3 w-3" />} onClick={() => navigate(`/customers/${customer?.id}`)}>
              Open customer profile
            </Button>
          </SectionCard>

          <SectionCard title="Status history" description="Every state change" icon={<Clock className="h-4 w-4" />}>
            <div className="space-y-2.5">
              {timeline.slice(-4).reverse().map((t, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', bookingStatusStyle[t.status].dot)} />
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-navy-900">{t.status}</p>
                    <p className="text-[10.5px] text-slate-400">
                      {formatTime(t.at)} · {t.by}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="rounded-xl border border-rose-200/70 bg-white p-4">
            <p className="text-[12.5px] font-semibold text-navy-900">Danger zone</p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">
              Deleting this booking removes it from reports and customer history.
            </p>
            <Button variant="danger" size="sm" className="mt-2.5 w-full" leftIcon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setDeleteOpen(true)}>
              Delete booking
            </Button>
          </div>
        </div>
      </div>

      <BookingFormModal open={editOpen} onClose={() => setEditOpen(false)} booking={booking} />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          dispatch({ type: 'DELETE_BOOKING', payload: booking.id });
          navigate('/bookings');
        }}
        title={`Delete booking ${booking.id}?`}
        message="This permanently removes the booking and its timeline. Customer aggregates will be recalculated."
        confirmLabel="Delete booking"
      />
    </div>
  );
}
