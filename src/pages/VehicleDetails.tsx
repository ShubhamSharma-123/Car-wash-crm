import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Pencil,
  Trash2,
  CalendarPlus,
  Fuel,
  Palette,
  CalendarClock,
  Wrench,
  ShieldCheck,
  ChevronRight,
  User,
  Phone,
  ReceiptText,
  Gauge,
} from 'lucide-react';
import { PageHeader, SectionCard, DetailRow } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { Badge, BookingStatusBadge, PaymentStatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { VehicleThumb } from '@/components/ui/Logo';
import { EmptyState } from '@/components/ui/SearchBar';
import { ConfirmDialog } from '@/components/ui/Modal';
import { VehicleFormModal } from '@/components/vehicles/VehicleForm';
import { useStore } from '@/context/StoreContext';
import { formatDate, TODAY_ISO, daysBetween } from '@/utils/date';
import { formatINR } from '@/utils/format';
import { cn } from '@/utils/cn';

export default function VehicleDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicleById, customerById, bookings, serviceById, staffById, invoices, dispatch } = useStore();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const vehicle = vehicleById(id || '');
  const owner = customerById(vehicle?.ownerId || '');
  const history = useMemo(
    () => bookings.filter((b) => b.vehicleId === vehicle?.id).sort((a, b) => b.date.localeCompare(a.date)),
    [bookings, vehicle]
  );

  if (!vehicle) {
    return (
      <div>
        <PageHeader title="Vehicle not found" backTo="/vehicles" backLabel="Back to vehicles" />
        <div className="card">
          <EmptyState title="Vehicle not found" description="This vehicle may have been removed." action={<Button variant="primary" onClick={() => navigate('/vehicles')}>All vehicles</Button>} />
        </div>
      </div>
    );
  }

  const completed = history.filter((b) => b.status === 'Completed');
  const spend = history.reduce((a, b) => a + b.paidAmount, 0);
  const overdue = vehicle.nextService ? vehicle.nextService < TODAY_ISO : false;

  return (
    <div>
      <PageHeader
        title={vehicle.registration}
        backTo="/vehicles"
        backLabel="Back to vehicles"
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{vehicle.brand} {vehicle.model}</span>
            <span className="text-slate-300">·</span>
            <span>{vehicle.type}</span>
            <span className="text-slate-300">·</span>
            <span>{vehicle.fuelType}</span>
            <span className="text-slate-300">·</span>
            <span>{vehicle.year}</span>
          </span>
        }
        meta={
          <>
            <Badge tone={vehicle.type === 'Luxury' ? 'violet' : 'blue'} dot>{vehicle.type}</Badge>
            {overdue ? <Badge tone="red" dot>Service overdue</Badge> : <Badge tone="green" dot>Service up to date</Badge>}
            <Badge tone="slate">{vehicle.id}</Badge>
          </>
        }
        actions={
          <>
            <Button variant="outline" leftIcon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button variant="outline" leftIcon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setDeleteOpen(true)}>
              <span className="hidden sm:inline">Delete</span>
            </Button>
            <Button variant="primary" leftIcon={<CalendarPlus className="h-3.5 w-3.5" />} onClick={() => navigate('/bookings?new=1')}>
              Book service
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="space-y-3 xl:col-span-2">
          {/* Vehicle hero */}
          <div className="card overflow-hidden">
            <div className="relative flex flex-col gap-4 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 p-5 text-white sm:flex-row sm:items-center">
              <div className="grid h-20 w-24 shrink-0 place-items-center rounded-xl bg-white/10 p-2 ring-1 ring-white/15 backdrop-blur">
                <div className="h-full w-full text-brand-300">
                  <VehicleGlyphLarge type={vehicle.type} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[19px] font-semibold tracking-tight">{vehicle.registration}</p>
                <p className="mt-0.5 text-[13px] text-slate-300">
                  {vehicle.brand} {vehicle.model} · {vehicle.year}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px] text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Palette className="h-3 w-3 text-slate-400" /> {vehicle.color}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Fuel className="h-3 w-3 text-slate-400" /> {vehicle.fuelType}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Gauge className="h-3 w-3 text-slate-400" /> {vehicle.type}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
                <div className="rounded-lg bg-white/10 px-3 py-2 ring-1 ring-white/10">
                  <p className="text-[9.5px] font-medium uppercase tracking-[0.08em] text-slate-400">Lifetime spend</p>
                  <p className="text-[15px] font-semibold tabular-nums">{formatINR(spend)}</p>
                </div>
                <div className="rounded-lg bg-white/10 px-3 py-2 ring-1 ring-white/10">
                  <p className="text-[9.5px] font-medium uppercase tracking-[0.08em] text-slate-400">Services</p>
                  <p className="text-[15px] font-semibold tabular-nums">{completed.length}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 sm:grid-cols-4">
              {[
                { label: 'Last service', value: vehicle.lastService ? formatDate(vehicle.lastService) : 'Never', icon: <Wrench className="h-3.5 w-3.5" /> },
                {
                  label: 'Next reminder',
                  value: vehicle.nextService ? formatDate(vehicle.nextService) : 'Not set',
                  icon: <CalendarClock className="h-3.5 w-3.5" />,
                  tone: overdue ? 'text-rose-600' : undefined,
                },
                { label: 'Total bookings', value: String(history.length), icon: <ReceiptText className="h-3.5 w-3.5" /> },
                {
                  label: 'Service interval',
                  value: vehicle.lastService && vehicle.nextService ? `${daysBetween(vehicle.lastService, vehicle.nextService)} days` : '30 days',
                  icon: <ShieldCheck className="h-3.5 w-3.5" />,
                },
              ].map((s) => (
                <div key={s.label} className="p-3.5">
                  <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.05em] text-slate-400">
                    {s.icon} {s.label}
                  </p>
                  <p className={cn('mt-1 text-[13px] font-semibold text-navy-900', s.tone)}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Service history */}
          <SectionCard title="Service history" description={`${history.length} bookings recorded for this vehicle`} icon={<Wrench className="h-4 w-4" />}>
            {history.length === 0 ? (
              <EmptyState title="No service history" description="Book the first service for this vehicle." compact />
            ) : (
              <div className="divide-y divide-slate-100">
                {history.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => navigate(`/bookings/${b.id}`)}
                    className="flex w-full flex-wrap items-center justify-between gap-2 py-2.5 text-left transition-colors hover:bg-slate-50/60"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                        <Wrench className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-medium text-navy-900">
                          {b.serviceIds.map((s) => serviceById(s)?.name).join(' + ')}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">
                          {b.id} · {formatDate(b.date)} · {b.timeSlot} · {staffById(b.assignedStaffId)?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookingStatusBadge status={b.status} size="sm" />
                      <span className="text-[12.5px] font-semibold tabular-nums text-navy-900">{formatINR(b.amount)}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-3">
          <SectionCard title="Owner" description="Customer on record" icon={<User className="h-4 w-4" />}>
            <div className="flex items-center gap-3">
              <Avatar name={owner?.name || '—'} tone="indigo" size="lg" />
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-semibold text-navy-900">{owner?.name}</p>
                <p className="text-[11.5px] text-slate-500">
                  {owner?.totalBookings} bookings · {formatINR(owner?.totalSpent || 0)}
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <DetailRow label="Phone" value={owner?.phone} />
              <DetailRow label="Email" value={<span className="truncate text-[11.5px]">{owner?.email}</span>} />
              <DetailRow label="City" value={owner?.city} />
              <DetailRow label="Status" value={<Badge tone={owner?.status === 'VIP' ? 'violet' : 'green'} size="sm">{owner?.status}</Badge>} />
            </div>
            <Button variant="outline" size="sm" className="mt-2 w-full" leftIcon={<Phone className="h-3.5 w-3.5" />} onClick={() => navigate(`/customers/${owner?.id}`)}>
              Open customer profile
            </Button>
          </SectionCard>

          <SectionCard title="Vehicle specification" description="Registration and condition notes">
            <div className="space-y-1">
              <DetailRow label="Registration" value={<span className="font-mono">{vehicle.registration}</span>} />
              <DetailRow label="Vehicle type" value={vehicle.type} />
              <DetailRow label="Brand" value={vehicle.brand} />
              <DetailRow label="Model" value={vehicle.model} />
              <DetailRow label="Year" value={vehicle.year} />
              <DetailRow label="Colour" value={vehicle.color} />
              <DetailRow label="Fuel" value={vehicle.fuelType} />
            </div>
            {vehicle.notes && (
              <div className="mt-2.5 rounded-lg border border-amber-200/70 bg-amber-50/60 p-2.5 text-[11.5px] leading-relaxed text-amber-900">
                {vehicle.notes}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Linked invoices" description={`${invoices.filter((i) => history.some((b) => b.id === i.bookingId)).length} documents`}>
            <div className="space-y-1.5">
              {invoices
                .filter((i) => history.some((b) => b.id === i.bookingId))
                .slice(0, 4)
                .map((i) => (
                  <button
                    key={i.id}
                    onClick={() => navigate(`/invoices/${i.id}`)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-left transition-colors hover:bg-slate-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-medium text-navy-900">{i.id}</span>
                      <span className="block text-[10.5px] text-slate-500">{formatDate(i.date)}</span>
                    </span>
                    <PaymentStatusBadge status={i.paymentStatus} size="sm" />
                  </button>
                ))}
              {invoices.filter((i) => history.some((b) => b.id === i.bookingId)).length === 0 && (
                <p className="py-2 text-[12px] text-slate-500">No invoices yet for this vehicle.</p>
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      <VehicleFormModal open={editOpen} onClose={() => setEditOpen(false)} vehicle={vehicle} />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          dispatch({ type: 'DELETE_VEHICLE', payload: vehicle.id });
          navigate('/vehicles');
        }}
        title={`Delete ${vehicle.registration}?`}
        message="The vehicle and its service reminder will be removed from the CRM."
        confirmLabel="Delete vehicle"
      />
    </div>
  );
}

function VehicleGlyphLarge({ type }: { type: string }) {
  return (
    <svg viewBox="0 0 64 40" className="h-full w-full" fill="none">
      <path
        d="M4 28v-7c0-1.4.9-2.6 2.2-3l6.2-2 6.5-6.8c.7-.7 1.6-1.1 2.6-1.1h15c1.2 0 2.3.5 3 1.5l5.7 7.3 8.3 1.6c1.5.3 2.5 1.5 2.5 3V28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path d="M3 28h56" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="17" cy="29.5" r="4.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="46" cy="29.5" r="4.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
