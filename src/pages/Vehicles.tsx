import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  CalendarPlus,
  Fuel,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { SearchBar, EmptyState, Pagination } from '@/components/ui/SearchBar';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PersonCell } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Dropdown, FilterSelect } from '@/components/ui/Dropdown';
import { ConfirmDialog } from '@/components/ui/Modal';
import { StatCard } from '@/components/ui/StatCard';
import { VehicleThumb } from '@/components/ui/Logo';
import { VehicleFormModal } from '@/components/vehicles/VehicleForm';
import { useStore } from '@/context/StoreContext';
import { formatDate, TODAY_ISO, daysBetween } from '@/utils/date';
import { downloadCSV } from '@/utils/ui';
import { cn } from '@/utils/cn';
import type { Vehicle } from '@/types';

export default function Vehicles() {
  const navigate = useNavigate();
  const { vehicles, customers, bookings, customerById, dispatch } = useStore();

  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [owner, setOwner] = useState('all');
  const [due, setDue] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState<Vehicle | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (type !== 'all' && v.type !== type) return false;
      if (owner !== 'all' && v.ownerId !== owner) return false;
      if (due === 'overdue' && !(v.nextService && v.nextService < TODAY_ISO)) return false;
      if (due === 'soon' && !(v.nextService && v.nextService >= TODAY_ISO && daysBetween(TODAY_ISO, v.nextService) <= 14)) return false;
      if (q) {
        const c = customerById(v.ownerId);
        const hay = `${v.registration} ${v.brand} ${v.model} ${v.color} ${v.type} ${c?.name}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [vehicles, query, type, owner, due, customerById]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const kpis = useMemo(() => {
    const luxury = vehicles.filter((v) => v.type === 'Luxury').length;
    const overdue = vehicles.filter((v) => v.nextService && v.nextService < TODAY_ISO).length;
    const serviced30 = new Set(
      bookings
        .filter((b) => b.date >= new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10))
        .map((b) => b.vehicleId)
    ).size;
    return { total: vehicles.length, luxury, overdue, serviced30 };
  }, [vehicles, bookings]);

  const exportCsv = () =>
    downloadCSV(`autosutraa-vehicles-${TODAY_ISO}`, [
      ['Vehicle ID', 'Registration', 'Type', 'Brand', 'Model', 'Colour', 'Year', 'Fuel', 'Owner', 'Owner phone', 'Last service', 'Next service'],
      ...filtered.map((v) => {
        const c = customerById(v.ownerId);
        return [
          v.id, v.registration, v.type, v.brand, v.model, v.color, v.year, v.fuelType,
          c?.name || '', c?.phone || '', v.lastService || '—', v.nextService || '—',
        ];
      }),
    ]);

  const columns: Column<Vehicle>[] = [
    {
      key: 'registration',
      header: 'Registration',
      render: (v) => (
        <div className="flex items-center gap-2.5">
          <VehicleThumb type={v.type} tone={v.type === 'Luxury' ? 'violet' : v.type === 'SUV' ? 'blue' : 'slate'} />
          <div className="min-w-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/vehicles/${v.id}`);
              }}
              className="whitespace-nowrap font-mono text-[12.5px] font-semibold text-navy-900 hover:text-brand-700 hover:underline"
            >
              {v.registration}
            </button>
            <p className="text-[10.5px] text-slate-400">{v.id}</p>
          </div>
        </div>
      ),
    },
    { key: 'type', header: 'Vehicle type', render: (v) => <Badge tone={v.type === 'Luxury' ? 'violet' : 'slate'} size="sm">{v.type}</Badge> },
    {
      key: 'model',
      header: 'Make & model',
      render: (v) => (
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-medium text-slate-700">
            {v.brand} {v.model}
          </p>
          <p className="flex items-center gap-1 whitespace-nowrap text-[10.5px] text-slate-400">
            <Fuel className="h-2.5 w-2.5" /> {v.fuelType} · {v.year}
          </p>
        </div>
      ),
    },
    {
      key: 'color',
      header: 'Colour',
      render: (v) => (
        <span className="flex items-center gap-1.5 whitespace-nowrap text-[12.5px] text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full border border-slate-300" style={{ background: colorHex(v.color) }} />
          {v.color}
        </span>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (v) => {
        const c = customerById(v.ownerId);
        return <PersonCell name={c?.name || '—'} secondary={c?.phone} avatarTone="indigo" onClick={() => navigate(`/customers/${v.ownerId}`)} />;
      },
    },
    {
      key: 'lastService',
      header: 'Last service',
      render: (v) => <span className="whitespace-nowrap text-[12.5px] text-slate-700">{v.lastService ? formatDate(v.lastService) : 'Never'}</span>,
    },
    {
      key: 'nextService',
      header: 'Next service',
      render: (v) => {
        if (!v.nextService) return <span className="text-[12px] text-slate-400">—</span>;
        const overdue = v.nextService < TODAY_ISO;
        return (
          <div className="whitespace-nowrap">
            <p className={cn('text-[12.5px]', overdue ? 'font-medium text-rose-600' : 'text-slate-700')}>{formatDate(v.nextService)}</p>
            <p className={cn('text-[10.5px]', overdue ? 'text-rose-500' : 'text-slate-400')}>
              {overdue ? 'Overdue' : `in ${daysBetween(TODAY_ISO, v.nextService)} days`}
            </p>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (v) => (
        <Dropdown
          width="w-48"
          items={[
            { label: 'View details', icon: <Eye className="h-3.5 w-3.5" />, onClick: () => navigate(`/vehicles/${v.id}`) },
            {
              label: 'Edit vehicle',
              icon: <Pencil className="h-3.5 w-3.5" />,
              onClick: () => {
                setEditing(v);
                setFormOpen(true);
              },
            },
            { label: 'Book service', icon: <CalendarPlus className="h-3.5 w-3.5" />, onClick: () => navigate('/bookings?new=1') },
            { separator: true },
            { label: 'Delete vehicle', icon: <Trash2 className="h-3.5 w-3.5" />, danger: true, onClick: () => setDeleting(v) },
          ]}
          trigger={({ toggle }) => (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Vehicle actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Every vehicle registered with AutoSutraa, linked to its owner, service history and next reminder date."
        meta={
          <>
            <Badge tone="blue" dot>{kpis.total} vehicles</Badge>
            <Badge tone="violet" dot>{kpis.luxury} luxury</Badge>
            {kpis.overdue > 0 && (
              <Badge tone="red" dot>
                {kpis.overdue} service overdue
              </Badge>
            )}
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
              Add vehicle
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Registered vehicles" value={kpis.total} icon={<Car className="h-4 w-4" />} tone="brand" footnote={`${customers.length} owners`} />
        <StatCard label="Serviced in 30 days" value={kpis.serviced30} icon={<CalendarPlus className="h-4 w-4" />} tone="emerald" change={5.8} comparison="vs previous 30d" />
        <StatCard label="Service due" value={kpis.overdue} icon={<AlertTriangle className="h-4 w-4" />} tone="amber" footnote="Overdue reminders" />
        <StatCard label="Luxury / premium" value={kpis.luxury} icon={<Search className="h-4 w-4" />} tone="violet" footnote="Hand-wash only vehicles" />
      </div>

      <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <SearchBar
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(1);
            }}
            placeholder="Search registration, brand, model, owner…"
            className="w-full sm:w-[320px]"
          />
          <FilterSelect
            label="Type"
            value={type}
            onChange={(v) => {
              setType(v);
              setPage(1);
            }}
            options={[{ value: 'all', label: 'All types' }, ...['Hatchback', 'Sedan', 'SUV', 'MUV', 'Luxury'].map((t) => ({ value: t, label: t }))]}
            width="w-44"
          />
          <FilterSelect
            label="Owner"
            value={owner}
            onChange={(v) => {
              setOwner(v);
              setPage(1);
            }}
            options={[{ value: 'all', label: 'All owners' }, ...customers.map((c) => ({ value: c.id, label: c.name }))]}
            width="w-64"
          />
          <FilterSelect
            label="Reminder"
            value={due}
            onChange={(v) => {
              setDue(v);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'Any time' },
              { value: 'overdue', label: 'Overdue only' },
              { value: 'soon', label: 'Due in 14 days' },
            ]}
            width="w-52"
          />
        </div>
        <span className="text-[11.5px] text-slate-400">{filtered.length} vehicles</span>
      </div>

      <DataTable
        columns={columns}
        rows={paged}
        onRowClick={(v) => navigate(`/vehicles/${v.id}`)}
        empty={
          <EmptyState
            title="No vehicles found"
            description="Register a customer's car to start creating bookings for it."
            icon={<Car className="h-5 w-5" />}
            action={<Button variant="primary" onClick={() => setFormOpen(true)}>Add vehicle</Button>}
          />
        }
      />
      <div className="card overflow-hidden rounded-t-none border-t-0">
        <Pagination page={safePage} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={setPageSize} />
      </div>

      <VehicleFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} vehicle={editing} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && dispatch({ type: 'DELETE_VEHICLE', payload: deleting.id })}
        title={`Delete ${deleting?.registration}?`}
        message="The vehicle record and its reminder will be removed. Past bookings referencing this vehicle will remain in reports."
        confirmLabel="Delete vehicle"
      />
    </div>
  );
}

function colorHex(name: string) {
  const map: Record<string, string> = {
    White: '#f1f5f9',
    Black: '#1e293b',
    Blue: '#1d4ed8',
    Red: '#dc2626',
    Grey: '#94a3b8',
    Silver: '#cbd5e1',
    Mist: '#a5d8d0',
    Sky: '#7dd3fc',
  };
  const key = Object.keys(map).find((k) => name.includes(k));
  return key ? map[key] : '#cbd5e1';
}
