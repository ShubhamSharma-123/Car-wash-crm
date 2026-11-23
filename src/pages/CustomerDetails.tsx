import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Pencil,
  Phone,
  Mail,
  MapPin,
  CalendarPlus,
  Car,
  Wallet,
  ReceiptText,
  StickyNote,
  Crown,
  TrendingUp,
  CalendarCheck,
  CircleCheck,
  IndianRupee,
  Plus,
  Trash2,
  ChevronRight,
  MessageSquare,
  Clock,
  Send,
} from 'lucide-react';
import { PageHeader, SectionCard, Tabs, DetailRow } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { Badge, CustomerStatusBadge, PaymentStatusBadge, BookingStatusBadge } from '@/components/ui/Badge';
import { Avatar, PersonCell } from '@/components/ui/Avatar';
import { VehicleThumb } from '@/components/ui/Logo';
import { StatCard, Meter } from '@/components/ui/StatCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/SearchBar';
import { CustomerFormModal } from '@/components/customers/CustomerForm';
import { VehicleFormModal } from '@/components/vehicles/VehicleForm';
import { useStore } from '@/context/StoreContext';
import { formatDate, formatDateTime, formatDayShort } from '@/utils/date';
import { formatINR } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { Booking, Payment, Vehicle } from '@/types';

type Tab = 'overview' | 'bookings' | 'vehicles' | 'payments' | 'services' | 'notes';

export default function CustomerDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    customerById,
    customers,
    vehicles,
    bookings,
    payments,
    invoices,
    serviceById,
    staffById,
    dispatch,
  } = useStore();

  const customer = customerById(id || '');
  const [tab, setTab] = useState<Tab>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [newNote, setNewNote] = useState('');
  const [localNotes, setLocalNotes] = useState<{ id: string; text: string; at: string; by: string }[]>([]);

  const customerVehicles = useMemo(() => vehicles.filter((v) => v.ownerId === customer?.id), [vehicles, customer]);
  const customerBookings = useMemo(
    () => bookings.filter((b) => b.customerId === customer?.id).sort((a, b) => b.date.localeCompare(a.date)),
    [bookings, customer]
  );
  const customerPayments = useMemo(
    () => payments.filter((p) => p.customerId === customer?.id).sort((a, b) => b.date.localeCompare(a.date)),
    [payments, customer]
  );
  const customerInvoices = useMemo(
    () => invoices.filter((i) => i.customerId === customer?.id),
    [invoices, customer]
  );

  if (!customer) {
    return (
      <div>
        <PageHeader title="Customer not found" backTo="/customers" backLabel="Back to customers" description="This record may have been deleted." />
        <div className="card">
          <EmptyState
            title="Customer not found"
            description="The customer record you're looking for doesn't exist in the CRM."
            action={<Button variant="primary" onClick={() => navigate('/customers')}>All customers</Button>}
          />
        </div>
      </div>
    );
  }

  const completed = customerBookings.filter((b) => b.status === 'Completed');
  const cancelled = customerBookings.filter((b) => ['Cancelled', 'No Show'].includes(b.status));
  const upcoming = customerBookings.filter((b) => b.date >= new Date().toISOString().slice(0, 10) && !['Completed', 'Cancelled', 'No Show'].includes(b.status));
  const spent = customerBookings.reduce((a, b) => a + b.paidAmount, 0);
  const outstanding = customerBookings.reduce((a, b) => a + (b.amount - b.paidAmount), 0);
  const favouriteService = useMemo(() => {
    const counts = new Map<string, number>();
    customerBookings.forEach((b) => b.serviceIds.forEach((s) => counts.set(s, (counts.get(s) || 0) + 1)));
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return top ? { name: serviceById(top[0])?.name, count: top[1] } : null;
  }, [customerBookings, serviceById]);

  const bookingColumns: Column<Booking>[] = [
    {
      key: 'id',
      header: 'Booking',
      render: (b) => (
        <button onClick={() => navigate(`/bookings/${b.id}`)} className="font-semibold tabular-nums text-brand-700 hover:underline">
          {b.id}
        </button>
      ),
    },
    {
      key: 'service',
      header: 'Service',
      render: (b) => <span className="text-[12.5px] text-slate-700">{b.serviceIds.map((s) => serviceById(s)?.name).join(' + ')}</span>,
    },
    { key: 'vehicle', header: 'Vehicle', render: (b) => <span className="text-[12.5px] text-slate-600">{vehicles.find((v) => v.id === b.vehicleId)?.registration}</span> },
    { key: 'date', header: 'Date', render: (b) => <span className="whitespace-nowrap text-[12.5px] text-slate-700">{formatDate(b.date)}<span className="ml-1 text-[11px] text-slate-400">{b.timeSlot}</span></span> },
    { key: 'staff', header: 'Staff', render: (b) => <span className="text-[12.5px] text-slate-600">{staffById(b.assignedStaffId)?.name}</span> },
    { key: 'amount', header: 'Amount', align: 'right', render: (b) => <span className="font-semibold tabular-nums text-navy-900">{formatINR(b.amount)}</span> },
    { key: 'payment', header: 'Payment', render: (b) => <PaymentStatusBadge status={b.paymentStatus} size="sm" /> },
    { key: 'status', header: 'Status', render: (b) => <BookingStatusBadge status={b.status} size="sm" /> },
  ];

  const paymentColumns: Column<Payment>[] = [
    { key: 'id', header: 'Transaction', render: (p) => <span className="font-mono text-[12px] text-slate-600">{p.id}</span> },
    { key: 'booking', header: 'Booking', render: (p) => <span className="text-[12.5px] text-slate-700">{p.bookingId}</span> },
    { key: 'date', header: 'Date', render: (p) => <span className="whitespace-nowrap text-[12.5px] text-slate-700">{formatDate(p.date)}</span> },
    { key: 'method', header: 'Method', render: (p) => <Badge tone="slate" size="sm">{p.method}</Badge> },
    { key: 'total', header: 'Total', align: 'right', render: (p) => <span className="tabular-nums text-slate-700">{formatINR(p.totalAmount)}</span> },
    { key: 'paid', header: 'Paid', align: 'right', render: (p) => <span className="font-semibold tabular-nums text-navy-900">{formatINR(p.paidAmount)}</span> },
    { key: 'status', header: 'Status', render: (p) => <PaymentStatusBadge status={p.status} size="sm" /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <Button variant="ghost" size="sm" onClick={() => navigate('/payments')}>
          View
        </Button>
      ),
    },
  ];

  const addNote = () => {
    if (!newNote.trim()) return;
    setLocalNotes((n) => [
      { id: `NT-${n.length + 1}`, text: newNote.trim(), at: new Date().toISOString(), by: 'Rajesh Sharma' },
      ...n,
    ]);
    setNewNote('');
  };

  return (
    <div>
      <PageHeader
        title={customer.name}
        backTo="/customers"
        backLabel="Back to customers"
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-slate-600">{customer.id}</span>
            <span className="text-slate-300">·</span>
            <span>{customer.city}</span>
            <span className="text-slate-300">·</span>
            <span>Customer since {formatDate(customer.joinedAt)}</span>
          </span>
        }
        actions={
          <>
            <Button variant="outline" leftIcon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button variant="outline" leftIcon={<Car className="h-3.5 w-3.5" />} onClick={() => { setEditingVehicle(null); setVehicleOpen(true); }}>
              <span className="hidden sm:inline">Add vehicle</span>
            </Button>
            <Button variant="primary" leftIcon={<CalendarPlus className="h-3.5 w-3.5" />} onClick={() => navigate('/bookings?new=1')}>
              New booking
            </Button>
          </>
        }
      />

      {/* Profile header card */}
      <div className="card mb-4 overflow-hidden">
        <div className="relative z-0 h-[74px] bg-gradient-to-r from-navy-900 via-navy-800 to-brand-700">
          <div className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(circle_at_18%_120%,white,transparent_45%),radial-gradient(circle_at_78%_-40%,white,transparent_40%)]" />
        </div>
        <div className="relative z-10 px-4 pb-4 sm:px-5">
          <div className="-mt-9 flex items-end justify-between gap-3">
            <Avatar name={customer.name} tone={customer.status === 'VIP' ? 'violet' : 'blue'} size="xl" ring />
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 pb-1 pt-9 sm:grid-cols-4">
              {[
                { label: 'Bookings', value: customer.totalBookings },
                { label: 'Vehicles', value: customerVehicles.length },
                { label: 'Lifetime spend', value: formatINR(spent) },
                { label: 'Outstanding', value: formatINR(outstanding) },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-[10px] font-medium uppercase tracking-[0.05em] text-slate-400">{s.label}</p>
                  <p className="text-[14px] font-semibold tabular-nums text-navy-900">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[17px] font-semibold text-navy-900">{customer.name}</h2>
              <CustomerStatusBadge status={customer.status} size="sm" />
              {customer.status === 'VIP' && (
                <Badge tone="amber" size="sm">
                  <Crown className="h-2.5 w-2.5" /> VIP tier
                </Badge>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12px] text-slate-500">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-slate-400" /> {customer.phone}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3 text-slate-400" /> {customer.email}
              </span>
              <span className="hidden items-center gap-1 sm:flex">
                <MapPin className="h-3 w-3 text-slate-400" /> {customer.address}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Completed services" value={completed.length} icon={<CircleCheck className="h-4 w-4" />} tone="emerald" footnote={`${upcoming.length} upcoming`} />
        <StatCard label="Total paid" value={formatINR(spent)} icon={<IndianRupee className="h-4 w-4" />} tone="brand" change={7.2} comparison="vs last quarter" />
        <StatCard
          label="Avg. ticket size"
          value={formatINR(spent / (customerBookings.length || 1))}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="navy"
          footnote={favouriteService ? `Favourite: ${favouriteService.name}` : undefined}
        />
        <StatCard
          label="Cancellations"
          value={cancelled.length}
          icon={<Trash2 className="h-4 w-4" />}
          tone="rose"
          footnote={`${Math.round((cancelled.length / (customerBookings.length || 1)) * 100)}% of all bookings`}
        />
      </div>

      <div className="card overflow-hidden">
        <Tabs<Tab>
          value={tab}
          onChange={setTab}
          className="px-2 pt-1"
          counts={{
            bookings: customerBookings.length,
            vehicles: customerVehicles.length,
            payments: customerPayments.length,
            services: completed.length,
          }}
          tabs={[
            { value: 'overview', label: 'Overview' },
            { value: 'bookings', label: 'Booking history' },
            { value: 'vehicles', label: 'Vehicles' },
            { value: 'payments', label: 'Payment history' },
            { value: 'services', label: 'Service history' },
            { value: 'notes', label: 'Notes' },
          ]}
        />

        <div className="p-4 sm:p-5">
          {tab === 'overview' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <div>
                  <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Contact & address</h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-3.5">
                      <DetailRow label="Customer ID" value={customer.id} />
                      <DetailRow label="Mobile" value={customer.phone} />
                      <DetailRow label="Email" value={<span className="truncate">{customer.email}</span>} />
                      <DetailRow label="City" value={customer.city} />
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3.5">
                      <DetailRow label="Status" value={<CustomerStatusBadge status={customer.status} size="sm" />} />
                      <DetailRow label="Customer tier" value={customer.tier} />
                      <DetailRow label="Joined" value={formatDate(customer.joinedAt)} />
                      <DetailRow label="Last visit" value={customer.lastBooking ? formatDate(customer.lastBooking) : '—'} />
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                    <p className="text-[10.5px] font-medium uppercase tracking-[0.05em] text-slate-400">Address</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-slate-700">
                      {customer.address}
                      <br />
                      {customer.city}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Recent bookings</h4>
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {customerBookings.slice(0, 4).map((b) => (
                      <button
                        key={b.id}
                        onClick={() => navigate(`/bookings/${b.id}`)}
                        className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[12.5px] font-medium text-navy-900">
                            {b.id} · {b.serviceIds.map((s) => serviceById(s)?.name).join(' + ')}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {formatDayShort(b.date)} · {b.timeSlot} · {b.status}
                          </p>
                        </div>
                        <span className="shrink-0 text-[12.5px] font-semibold tabular-nums text-navy-900">{formatINR(b.amount)}</span>
                      </button>
                    ))}
                    {customerBookings.length === 0 && <p className="px-3.5 py-4 text-[12.5px] text-slate-500">No bookings yet.</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 p-3.5">
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Engagement</h4>
                  <div className="mt-2.5 space-y-2.5">
                    {[
                      { label: 'Repeat visits', value: Math.min(100, (customer.totalBookings / 6) * 100) },
                      { label: 'On-time arrivals', value: 92 },
                      { label: 'Payment reliability', value: outstanding > 0 ? 64 : 98 },
                    ].map((m) => (
                      <div key={m.label}>
                        <div className="mb-1 flex justify-between text-[11.5px]">
                          <span className="text-slate-500">{m.label}</span>
                          <span className="font-medium text-navy-900">{Math.round(m.value)}%</span>
                        </div>
                        <Meter value={m.value} tone={m.value > 80 ? 'emerald' : m.value > 60 ? 'amber' : 'rose'} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-3.5">
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Preferred services</h4>
                  <div className="mt-2 space-y-1.5">
                    {Object.entries(
                      customerBookings
                        .flatMap((b) => b.serviceIds)
                        .reduce<Record<string, number>>((acc, s) => {
                          acc[s] = (acc[s] || 0) + 1;
                          return acc;
                        }, {})
                    )
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 4)
                      .map(([sid, count]) => (
                        <div key={sid} className="flex items-center justify-between text-[12px]">
                          <span className="truncate text-slate-600">{serviceById(sid)?.name}</span>
                          <span className="shrink-0 text-slate-400">×{count}</span>
                        </div>
                      ))}
                    {customerBookings.length === 0 && <p className="text-[12px] text-slate-500">No service data yet.</p>}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-3.5">
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Quick actions</h4>
                  <div className="mt-2 space-y-1.5">
                    <Button variant="outline" size="sm" className="w-full justify-start" leftIcon={<CalendarPlus className="h-3.5 w-3.5" />} onClick={() => navigate('/bookings?new=1')}>
                      Schedule booking
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start" leftIcon={<ReceiptText className="h-3.5 w-3.5" />} onClick={() => setTab('payments')}>
                      View payments
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start" leftIcon={<MessageSquare className="h-3.5 w-3.5" />} onClick={() => setTab('notes')}>
                      Add a note
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'bookings' && (
            customerBookings.length ? (
              <DataTable columns={bookingColumns} rows={customerBookings} onRowClick={(b) => navigate(`/bookings/${b.id}`)} selectable={false} />
            ) : (
              <EmptyState title="No booking history" description="This customer hasn't booked a service yet." action={<Button variant="primary" onClick={() => navigate('/bookings?new=1')}>Create booking</Button>} />
            )
          )}

          {tab === 'vehicles' && (
            <div>
              <div className="mb-3 flex justify-end">
                <Button variant="outline" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => { setEditingVehicle(null); setVehicleOpen(true); }}>
                  Add vehicle
                </Button>
              </div>
              {customerVehicles.length === 0 ? (
                <EmptyState title="No vehicles on file" description="Add a vehicle so bookings can be linked to it." icon={<Car className="h-5 w-5" />} />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {customerVehicles.map((v) => {
                    const vb = bookings.filter((b) => b.vehicleId === v.id);
                    return (
                      <div key={v.id} className="rounded-xl border border-slate-200 p-3.5 transition-shadow hover:shadow-card-hover">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <VehicleThumb type={v.type} tone={v.type === 'Luxury' ? 'violet' : 'blue'} />
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold text-navy-900">{v.registration}</p>
                              <p className="truncate text-[11.5px] text-slate-500">
                                {v.brand} {v.model} · {v.year}
                              </p>
                            </div>
                          </div>
                          <Badge tone="slate" size="sm">
                            {v.type}
                          </Badge>
                        </div>
                        <div className="mt-2.5 space-y-1 text-[11.5px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Colour</span>
                            <span className="text-slate-700">{v.color}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Last service</span>
                            <span className="text-slate-700">{formatDate(v.lastService)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Next reminder</span>
                            <span className="text-slate-700">{formatDate(v.nextService)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Services</span>
                            <span className="text-slate-700">{vb.length}</span>
                          </div>
                        </div>
                        <div className="mt-2.5 flex gap-1.5">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/vehicles/${v.id}`)}>
                            Details
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setEditingVehicle(v);
                              setVehicleOpen(true);
                            }}
                            aria-label="Edit vehicle"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'payments' && (
            customerPayments.length ? (
              <DataTable columns={paymentColumns} rows={customerPayments} />
            ) : (
              <EmptyState title="No payments recorded" description="Payments will appear here once a booking is billed." />
            )
          )}

          {tab === 'services' && (
            <div className="space-y-3">
              {customerPayments.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Services done', value: completed.length },
                    { label: 'Invoices', value: customerInvoices.length },
                    { label: 'Total billed', value: formatINR(customerBookings.reduce((a, b) => a + b.amount, 0)) },
                    { label: 'Avg. rating', value: '4.8 / 5' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-slate-200 p-3">
                      <p className="text-[10.5px] font-medium uppercase tracking-[0.05em] text-slate-400">{s.label}</p>
                      <p className="mt-1 text-[15px] font-semibold tabular-nums text-navy-900">{s.value}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {completed.length === 0 && <p className="px-3.5 py-6 text-center text-[12.5px] text-slate-500">No completed services yet.</p>}
                {completed.map((b) => (
                  <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                        <CircleCheck className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-medium text-navy-900">{b.serviceIds.map((s) => serviceById(s)?.name).join(' + ')}</p>
                        <p className="text-[11px] text-slate-500">
                          {formatDate(b.date)} · {vehicles.find((v) => v.id === b.vehicleId)?.registration} · by {staffById(b.assignedStaffId)?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[12.5px] font-semibold tabular-nums text-navy-900">{formatINR(b.amount)}</span>
                      <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-3 w-3" />} onClick={() => navigate(`/bookings/${b.id}`)}>
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'notes' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Customer preferences</h4>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-[12.5px] leading-relaxed text-slate-700">
                  {customer.notes || 'No notes recorded.'}
                </div>
                <h4 className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Add note</h4>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                  placeholder="Log a call, preference or follow-up reminder…"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[12.5px] focus:border-brand-500 focus:outline-none focus:ring-[3px] focus:ring-brand-100"
                />
                <div className="mt-2 flex justify-end">
                  <Button variant="primary" size="sm" leftIcon={<Send className="h-3.5 w-3.5" />} onClick={addNote} disabled={!newNote.trim()}>
                    Save note
                  </Button>
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Note history</h4>
                <div className="space-y-2">
                  {localNotes.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-300 px-3.5 py-6 text-center text-[12px] text-slate-500">
                      Notes you add today will appear here.
                    </div>
                  )}
                  {localNotes.map((n) => (
                    <div key={n.id} className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-3">
                      <p className="text-[12.5px] leading-relaxed text-amber-900">{n.text}</p>
                      <p className="mt-1 flex items-center gap-1 text-[10.5px] text-amber-700/70">
                        <Clock className="h-2.5 w-2.5" /> {formatDateTime(n.at)} · {n.by}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CustomerFormModal open={editOpen} onClose={() => setEditOpen(false)} customer={customer} />
      <VehicleFormModal
        open={vehicleOpen}
        onClose={() => {
          setVehicleOpen(false);
          setEditingVehicle(null);
        }}
        vehicle={editingVehicle}
        presetOwnerId={customer.id}
      />
    </div>
  );
}
