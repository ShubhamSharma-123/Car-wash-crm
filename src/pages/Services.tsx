import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Download,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Power,
  Clock,
  IndianRupee,
  Sparkles,
  Layers,
  TrendingUp,
  Eye,
  Info,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { SearchBar, EmptyState } from '@/components/ui/SearchBar';
import { Badge } from '@/components/ui/Badge';
import { Dropdown, FilterSelect } from '@/components/ui/Dropdown';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { StatCard, Meter } from '@/components/ui/StatCard';
import { ServiceThumb } from '@/components/ui/Logo';
import { ServiceFormModal } from '@/components/services/ServiceForm';
import { useStore } from '@/context/StoreContext';
import { TODAY_ISO } from '@/utils/date';
import { formatINR, formatNumber } from '@/utils/format';
import { downloadCSV } from '@/utils/ui';
import { cn } from '@/utils/cn';
import type { Service } from '@/types';

const categories = ['Wash', 'Detailing', 'Protection', 'Interior', 'Add-on'] as const;

export default function Services() {
  const { services, bookings, dispatch } = useStore();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [viewing, setViewing] = useState<Service | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services
      .filter((s) => {
        if (category !== 'all' && s.category !== category) return false;
        if (status !== 'all' && String(s.active) !== status) return false;
        if (q && !`${s.name} ${s.description} ${s.category}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => a.price - b.price);
  }, [services, query, category, status]);

  const kpis = useMemo(() => {
    const active = services.filter((s) => s.active).length;
    const avgPrice = services.reduce((a, s) => a + s.price, 0) / (services.length || 1);
    const totalBookings = services.reduce((a, s) => a + s.bookings, 0);
    const top = services.slice().sort((a, b) => b.bookings - a.bookings)[0];
    return { total: services.length, active, avgPrice, totalBookings, top };
  }, [services]);

  const revenueByService = useMemo(() => {
    const map = new Map<string, number>();
    bookings.forEach((b) => {
      const subtotal = b.serviceIds.reduce((sum, id) => sum + (services.find((s) => s.id === id)?.price || 0), 0);
      b.serviceIds.forEach((id) => {
        const price = services.find((s) => s.id === id)?.price || 0;
        map.set(id, (map.get(id) || 0) + Math.round(b.amount * (price / (subtotal || 1))));
      });
    });
    return map;
  }, [bookings, services]);

  const exportCsv = () =>
    downloadCSV(`autosutraa-services-${TODAY_ISO}`, [
      ['Service ID', 'Name', 'Category', 'Price', 'Duration (min)', 'Vehicle types', 'Status', 'Bookings', 'Revenue'],
      ...filtered.map((s) => [
        s.id, s.name, s.category, s.price, s.duration, s.vehicleTypes.join(' / '),
        s.active ? 'Active' : 'Inactive', s.bookings, revenueByService.get(s.id) || 0,
      ]),
    ]);

  return (
    <div>
      <PageHeader
        title="Services"
        description="The complete AutoSutraa service catalogue — pricing, duration, vehicle applicability and live availability."
        meta={
          <>
            <Badge tone="green" dot>{kpis.active} active</Badge>
            <Badge tone="slate">{kpis.total - kpis.active} inactive</Badge>
            <Badge tone="blue">
              <Sparkles className="h-3 w-3" /> Most booked: {kpis.top?.name}
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
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Add service
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Catalogue size" value={kpis.total} icon={<Layers className="h-4 w-4" />} tone="brand" footnote={`${categories.length} categories`} />
        <StatCard label="Avg. price" value={formatINR(kpis.avgPrice)} icon={<IndianRupee className="h-4 w-4" />} tone="navy" footnote="Across all services" />
        <StatCard label="Total bookings" value={formatNumber(kpis.totalBookings)} icon={<TrendingUp className="h-4 w-4" />} tone="emerald" change={11.3} comparison="vs last month" />
        <StatCard label="Active services" value={kpis.active} icon={<Power className="h-4 w-4" />} tone="teal" footnote="Available for booking" />
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search services…"
            className="w-full sm:w-[280px]"
          />
          <FilterSelect
            label="Category"
            value={category}
            onChange={setCategory}
            options={[{ value: 'all', label: 'All categories' }, ...categories.map((c) => ({ value: c, label: c }))]}
            width="w-48"
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'Any status' },
              { value: 'true', label: 'Active only' },
              { value: 'false', label: 'Inactive only' },
            ]}
            width="w-44"
          />
        </div>
        <span className="text-[11.5px] text-slate-400">{filtered.length} services</span>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No services match your filters"
            description="Try clearing the filters or add a brand new service to the catalogue."
            action={<Button variant="primary" onClick={() => { setQuery(''); setCategory('all'); setStatus('all'); }}>Clear filters</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => {
            const revenue = revenueByService.get(s.id) || 0;
            const share = (s.bookings / (kpis.totalBookings || 1)) * 100;
            return (
              <article
                key={s.id}
                className={cn(
                  'card card-hover group relative flex flex-col p-4',
                  !s.active && 'bg-slate-50/60 opacity-[0.85]'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-3">
                    <ServiceThumb tone={s.imageTone} name={s.name} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="truncate text-[13.5px] font-semibold text-navy-900">{s.name}</h3>
                        {!s.active && <Badge tone="slate" size="sm">Inactive</Badge>}
                      </div>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="rounded bg-slate-100 px-1.5 py-[1px] font-medium text-slate-600">{s.category}</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" /> {s.duration} min
                        </span>
                      </p>
                    </div>
                  </div>
                  <Dropdown
                    width="w-48"
                    items={[
                      { label: 'View details', icon: <Eye className="h-3.5 w-3.5" />, onClick: () => setViewing(s) },
                      {
                        label: 'Edit service',
                        icon: <Pencil className="h-3.5 w-3.5" />,
                        onClick: () => {
                          setEditing(s);
                          setFormOpen(true);
                        },
                      },
                      {
                        label: s.active ? 'Deactivate' : 'Activate',
                        icon: <Power className="h-3.5 w-3.5" />,
                        onClick: () => dispatch({ type: 'UPDATE_SERVICE', payload: { ...s, active: !s.active } }),
                      },
                      { separator: true },
                      { label: 'Delete service', icon: <Trash2 className="h-3.5 w-3.5" />, danger: true, onClick: () => setDeleting(s) },
                    ]}
                    trigger={({ toggle }) => (
                      <button
                        onClick={toggle}
                        className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                        aria-label="Service actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    )}
                  />
                </div>

                <p className="mt-2.5 line-clamp-2 min-h-[32px] text-[12px] leading-relaxed text-slate-500">{s.description}</p>

                <div className="mt-2.5 flex items-end justify-between">
                  <div>
                    <p className="text-[17px] font-semibold leading-none tabular-nums text-navy-900">{formatINR(s.price)}</p>
                    <p className="mt-0.5 text-[10.5px] text-slate-400">{formatINR(revenue)} revenue</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-semibold tabular-nums text-navy-900">{s.bookings}</p>
                    <p className="text-[10px] text-slate-400">bookings</p>
                  </div>
                </div>

                <div className="mt-2">
                  <Meter value={share * 4} tone={s.active ? 'brand' : 'navy'} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-slate-100 pt-2.5">
                  {s.vehicleTypes.slice(0, 3).map((t) => (
                    <span key={t} className="rounded bg-slate-50 px-1.5 py-[1px] text-[10px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
                      {t}
                    </span>
                  ))}
                  {s.vehicleTypes.length > 3 && (
                    <span className="text-[10px] text-slate-400">+{s.vehicleTypes.length - 3}</span>
                  )}
                  <span className="ml-auto">
                    <button
                      onClick={() => dispatch({ type: 'UPDATE_SERVICE', payload: { ...s, active: !s.active } })}
                      className={cn(
                        'rounded px-1.5 py-[2px] text-[10.5px] font-semibold transition-colors',
                        s.active
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      )}
                    >
                      {s.active ? 'Active' : 'Inactive'}
                    </button>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ServiceFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} service={editing} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && dispatch({ type: 'DELETE_SERVICE', payload: deleting.id })}
        title={`Delete “${deleting?.name}”?`}
        message="Existing bookings that reference this service will keep their recorded price, but the service will no longer be selectable for new bookings."
        confirmLabel="Delete service"
      />

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.name}
        description={`${viewing?.category} · ${viewing?.duration} minutes`}
        footer={
          <>
            <Button variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              leftIcon={<Pencil className="h-3.5 w-3.5" />}
              onClick={() => {
                setEditing(viewing);
                setViewing(null);
                setFormOpen(true);
              }}
            >
              Edit service
            </Button>
          </>
        }
      >
        {viewing && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
              <ServiceThumb tone={viewing.imageTone} name={viewing.name} />
              <div>
                <p className="text-[19px] font-semibold leading-none tabular-nums text-navy-900">{formatINR(viewing.price)}</p>
                <p className="mt-1 text-[11.5px] text-slate-500">
                  {viewing.duration} min · {viewing.bookings} lifetime bookings
                </p>
              </div>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Description</p>
              <p className="text-[12.5px] leading-relaxed text-slate-600">{viewing.description}</p>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Applicable vehicles</p>
              <div className="flex flex-wrap gap-1.5">
                {viewing.vehicleTypes.map((t) => (
                  <Badge key={t} tone="blue" size="sm">{t}</Badge>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-brand-100 bg-brand-50/60 p-2.5 text-[11.5px] leading-relaxed text-brand-800">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {formatINR(revenueByService.get(viewing.id) || 0)} revenue recorded across all bookings. GST of 18% is
                applied at the booking level.
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
