import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Download,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Car,
  Users,
  Crown,
  TrendingUp,
  Phone,
  Mail,
  ArrowUpDown,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { SearchBar, EmptyState, Pagination } from '@/components/ui/SearchBar';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PersonCell } from '@/components/ui/Avatar';
import { CustomerStatusBadge, Badge } from '@/components/ui/Badge';
import { Dropdown, FilterSelect } from '@/components/ui/Dropdown';
import { ConfirmDialog } from '@/components/ui/Modal';
import { StatCard } from '@/components/ui/StatCard';
import { CustomerFormModal } from '@/components/customers/CustomerForm';
import { useStore } from '@/context/StoreContext';
import { formatDate, TODAY_ISO } from '@/utils/date';
import { formatINR } from '@/utils/format';
import { downloadCSV } from '@/utils/ui';
import { customerStatuses } from '@/utils/statusStyles';
import { cn } from '@/utils/cn';
import type { Customer } from '@/types';

export default function Customers() {
  const navigate = useNavigate();
  const { customers, vehicles, bookings, dispatch, settings } = useStore();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [city, setCity] = useState('all');
  const [sortKey, setSortKey] = useState<'name' | 'totalSpent' | 'totalBookings' | 'lastBooking'>('totalSpent');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  const cities = useMemo(() => [...new Set(customers.map((c) => c.city))].sort(), [customers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = customers.filter((c) => {
      if (status !== 'all' && c.status !== status) return false;
      if (city !== 'all' && c.city !== city) return false;
      if (q) {
        const hay = `${c.id} ${c.name} ${c.phone} ${c.email} ${c.city} ${c.address}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return rows.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'name') return a.name.localeCompare(b.name) * dir;
      if (sortKey === 'totalSpent') return (a.totalSpent - b.totalSpent) * dir;
      if (sortKey === 'totalBookings') return (a.totalBookings - b.totalBookings) * dir;
      return ((a.lastBooking || '').localeCompare(b.lastBooking || '')) * dir;
    });
  }, [customers, query, status, city, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const kpis = useMemo(() => {
    const vip = customers.filter((c) => c.status === 'VIP').length;
    const active = customers.filter((c) => c.status === 'Active').length;
    const totalSpend = customers.reduce((a, c) => a + c.totalSpent, 0);
    const avgSpend = totalSpend / (customers.length || 1);
    const repeat = customers.filter((c) => c.totalBookings > 1).length;
    return { vip, active, totalSpend, avgSpend, repeat, total: customers.length };
  }, [customers]);

  const onSort = (key: string) => {
    const k = key as typeof sortKey;
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(k);
      setSortDir('desc');
    }
    setPage(1);
  };

  const exportCsv = () =>
    downloadCSV(`autosutraa-customers-${TODAY_ISO}`, [
      ['Customer ID', 'Name', 'Phone', 'Email', 'City', 'Status', 'Vehicles', 'Total bookings', 'Total spent', 'Last booking', 'Joined'],
      ...filtered.map((c) => [
        c.id,
        c.name,
        c.phone,
        c.email,
        c.city,
        c.status,
        vehicles.filter((v) => v.ownerId === c.id).length,
        c.totalBookings,
        c.totalSpent,
        c.lastBooking || '—',
        c.joinedAt,
      ]),
    ]);

  const columns: Column<Customer>[] = [
    {
      key: 'id',
      header: 'Customer ID',
      render: (c) => <span className="font-mono text-[12px] font-medium tabular-nums text-slate-500">{c.id}</span>,
    },
    {
      key: 'name',
      header: 'Customer name',
      sortable: true,
      render: (c) => (
        <PersonCell
          name={c.name}
          secondary={
            <span className="flex items-center gap-1.5">
              <Mail className="h-2.5 w-2.5" /> {c.email}
            </span>
          }
          avatarTone={c.status === 'VIP' ? 'violet' : c.status === 'Blocked' ? 'rose' : 'blue'}
          onClick={() => navigate(`/customers/${c.id}`)}
        />
      ),
    },
    {
      key: 'phone',
      header: 'Phone number',
      render: (c) => (
        <span className="whitespace-nowrap text-[12.5px] tabular-nums text-slate-700">{c.phone}</span>
      ),
    },
    {
      key: 'vehicles',
      header: 'Vehicles',
      align: 'center',
      render: (c) => {
        const count = vehicles.filter((v) => v.ownerId === c.id).length;
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-0.5 text-[11.5px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
            <Car className="h-3 w-3 text-slate-400" /> {count}
          </span>
        );
      },
    },
    {
      key: 'totalBookings',
      header: 'Bookings',
      align: 'center',
      sortable: true,
      render: (c) => <span className="text-[12.5px] font-medium tabular-nums text-slate-700">{c.totalBookings}</span>,
    },
    {
      key: 'totalSpent',
      header: 'Total spent',
      align: 'right',
      sortable: true,
      render: (c) => (
        <span className={cn('whitespace-nowrap font-semibold tabular-nums', c.totalSpent > 5000 ? 'text-navy-900' : 'text-slate-700')}>
          {formatINR(c.totalSpent)}
        </span>
      ),
    },
    {
      key: 'lastBooking',
      header: 'Last booking',
      sortable: true,
      render: (c) => (
        <div className="whitespace-nowrap">
          <p className="text-[12.5px] text-slate-700">{c.lastBooking ? formatDate(c.lastBooking) : '—'}</p>
          <p className="text-[10.5px] text-slate-400">Joined {formatDate(c.joinedAt)}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (c) => <CustomerStatusBadge status={c.status} size="sm" /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (c) => (
        <Dropdown
          width="w-48"
          items={[
            { label: 'View profile', icon: <Eye className="h-3.5 w-3.5" />, onClick: () => navigate(`/customers/${c.id}`) },
            {
              label: 'Edit customer',
              icon: <Pencil className="h-3.5 w-3.5" />,
              onClick: () => {
                setEditing(c);
                setFormOpen(true);
              },
            },
            { label: 'Book a service', icon: <Car className="h-3.5 w-3.5" />, onClick: () => navigate(`/bookings?new=1`) },
            { separator: true },
            { label: 'Delete customer', icon: <Trash2 className="h-3.5 w-3.5" />, danger: true, onClick: () => setDeleting(c) },
          ]}
          trigger={({ toggle }) => (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Customer actions"
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
        title="Customers"
        description={`Complete customer records for ${settings.name} — contact details, spend history, vehicles and retention signals.`}
        meta={
          <>
            <Badge tone="violet" dot>
              {kpis.vip} VIP customers
            </Badge>
            <Badge tone="green" dot>
              {kpis.active} active
            </Badge>
            <Badge tone="slate">
              {Math.round((kpis.repeat / (kpis.total || 1)) * 100)}% repeat rate
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
              leftIcon={<UserPlus className="h-3.5 w-3.5" />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Add customer
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total customers" value={kpis.total} icon={<Users className="h-4 w-4" />} tone="brand" footnote={`${kpis.active} currently active`} />
        <StatCard label="VIP customers" value={kpis.vip} icon={<Crown className="h-4 w-4" />} tone="violet" change={12.5} comparison="vs last month" />
        <StatCard
          label="Lifetime revenue"
          value={formatINR(kpis.totalSpend)}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="emerald"
          change={9.4}
          comparison="vs last month"
        />
        <StatCard
          label="Avg. spend / customer"
          value={formatINR(kpis.avgSpend)}
          icon={<ArrowUpDown className="h-4 w-4" />}
          tone="navy"
          footnote={`${kpis.repeat} repeat customers`}
        />
      </div>

      <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <SearchBar
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(1);
            }}
            placeholder="Search name, phone, email, city…"
            className="w-full sm:w-[300px]"
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={[{ value: 'all', label: 'All statuses' }, ...customerStatuses.map((s) => ({ value: s, label: s }))]}
          />
          <FilterSelect
            label="City"
            value={city}
            onChange={(v) => {
              setCity(v);
              setPage(1);
            }}
            options={[{ value: 'all', label: 'All cities' }, ...cities.map((c) => ({ value: c, label: c }))]}
            width="w-44"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11.5px] text-slate-400">{filtered.length} customers</span>
          <select
            aria-label="Sort customers"
            value={`${sortKey}:${sortDir}`}
            onChange={(e) => {
              const [k, d] = e.target.value.split(':');
              setSortKey(k as typeof sortKey);
              setSortDir(d as 'asc' | 'desc');
            }}
            className="h-9 cursor-pointer rounded-lg border border-slate-300 bg-white px-2.5 text-[12px] text-slate-600 focus:border-brand-500 focus:outline-none"
          >
            <option value="totalSpent:desc">Top spenders</option>
            <option value="totalBookings:desc">Most bookings</option>
            <option value="lastBooking:desc">Most recent</option>
            <option value="name:asc">Name A–Z</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={paged}
        minWidth={1180}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={onSort}
        onRowClick={(c) => navigate(`/customers/${c.id}`)}
        empty={
          <EmptyState
            title="No customers found"
            description="Try a different search term, or add your first customer to get started."
            icon={<Users className="h-5 w-5" />}
            action={
              <Button variant="primary" leftIcon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setFormOpen(true)}>
                Add customer
              </Button>
            }
          />
        }
      />
      <div className="card overflow-hidden rounded-t-none border-t-0">
        <Pagination page={safePage} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={setPageSize} />
      </div>

      <CustomerFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        customer={editing}
        onSaved={(id) => navigate(`/customers/${id}`)}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && dispatch({ type: 'DELETE_CUSTOMER', payload: deleting.id })}
        title={`Delete ${deleting?.name}?`}
        message={
          <>
            This deletes the customer record along with {vehicles.filter((v) => v.ownerId === deleting?.id).length} linked
            vehicle(s). Existing bookings stay in reports but will show a missing customer reference.
          </>
        }
        confirmLabel="Delete customer"
      />
    </div>
  );
}
