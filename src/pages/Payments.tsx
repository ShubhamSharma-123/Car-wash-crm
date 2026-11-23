import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Wallet,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ReceiptText,
  IndianRupee,
  Clock,
  RotateCcw,
  CircleCheck,
  Banknote,
  CreditCard,
  Smartphone,
  Globe,
  TrendingUp,
} from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { SearchBar, EmptyState, Pagination } from '@/components/ui/SearchBar';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PersonCell } from '@/components/ui/Avatar';
import { Badge, PaymentStatusBadge } from '@/components/ui/Badge';
import { Dropdown, FilterSelect } from '@/components/ui/Dropdown';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { StatCard, Meter } from '@/components/ui/StatCard';
import { PaymentFormModal } from '@/components/payments/PaymentForm';
import { useStore } from '@/context/StoreContext';
import { formatDate, TODAY_ISO, formatDateTime } from '@/utils/date';
import { formatINR } from '@/utils/format';
import { downloadCSV } from '@/utils/ui';
import { paymentMethods, paymentStatuses } from '@/utils/statusStyles';
import { cn } from '@/utils/cn';
import type { Payment } from '@/types';

const methodIcon: Record<string, React.ReactNode> = {
  Cash: <Banknote className="h-3.5 w-3.5" />,
  UPI: <Smartphone className="h-3.5 w-3.5" />,
  Card: <CreditCard className="h-3.5 w-3.5" />,
  Online: <Globe className="h-3.5 w-3.5" />,
};

const methodTone: Record<string, 'emerald' | 'blue' | 'violet' | 'indigo'> = {
  Cash: 'emerald',
  UPI: 'blue',
  Card: 'violet',
  Online: 'indigo',
};

export default function Payments() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { payments, customerById, bookingById, dispatch } = useStore();

  const [query, setQuery] = useState('');
  const [method, setMethod] = useState('all');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [presetBooking, setPresetBooking] = useState<string | undefined>();
  const [deleting, setDeleting] = useState<Payment | null>(null);
  const [viewing, setViewing] = useState<Payment | null>(null);

  useEffect(() => {
    const record = params.get('record');
    if (record) {
      setPresetBooking(record);
      setEditing(null);
      setFormOpen(true);
      params.delete('record');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments
      .filter((p) => {
        if (method !== 'all' && p.method !== method) return false;
        if (status !== 'all' && p.status !== status) return false;
        if (dateFrom && p.date < dateFrom) return false;
        if (dateTo && p.date > dateTo) return false;
        if (q) {
          const c = customerById(p.customerId);
          const hay = `${p.id} ${p.bookingId} ${p.reference} ${c?.name} ${p.collectedBy}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [payments, query, method, status, dateFrom, dateTo, customerById]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const kpis = useMemo(() => {
    const paid = payments.filter((p) => p.status === 'Paid');
    const collected = paid.reduce((a, p) => a + p.paidAmount, 0);
    const pending = payments.filter((p) => p.status === 'Pending' || p.status === 'Partial');
    const outstanding = pending.reduce((a, p) => a + (p.totalAmount - p.paidAmount), 0);
    const refunded = payments.filter((p) => p.status === 'Refunded').reduce((a, p) => a + p.totalAmount, 0);
    const todayCollected = payments.filter((p) => p.date === TODAY_ISO).reduce((a, p) => a + p.paidAmount, 0);
    return { collected, outstanding, refunded, todayCollected, pendingCount: pending.length, paidCount: paid.length };
  }, [payments]);

  const byMethod = useMemo(
    () =>
      paymentMethods.map((m) => {
        const list = payments.filter((p) => p.method === m);
        return {
          method: m,
          count: list.length,
          amount: list.reduce((a, p) => a + p.paidAmount, 0),
          share: (list.reduce((a, p) => a + p.paidAmount, 0) / (kpis.collected || 1)) * 100,
        };
      }),
    [payments, kpis.collected]
  );

  const exportCsv = () =>
    downloadCSV(`autosutraa-payments-${TODAY_ISO}`, [
      ['Transaction ID', 'Booking ID', 'Customer', 'Date', 'Method', 'Total amount', 'Paid amount', 'Status', 'Reference', 'Collected by'],
      ...filtered.map((p) => [
        p.id, p.bookingId, customerById(p.customerId)?.name || '', p.date, p.method,
        p.totalAmount, p.paidAmount, p.status, p.reference, p.collectedBy,
      ]),
    ]);

  const columns: Column<Payment>[] = [
    {
      key: 'id',
      header: 'Transaction ID',
      render: (p) => (
        <button onClick={() => setViewing(p)} className="font-mono text-[12px] font-medium text-brand-700 hover:underline">
          {p.id}
        </button>
      ),
    },
    {
      key: 'booking',
      header: 'Booking ID',
      render: (p) => (
        <button onClick={() => navigate(`/bookings/${p.bookingId}`)} className="text-[12.5px] tabular-nums text-slate-700 hover:text-brand-700 hover:underline">
          {p.bookingId}
        </button>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (p) => {
        const c = customerById(p.customerId);
        return <PersonCell name={c?.name || '—'} secondary={c?.phone} avatarTone="teal" onClick={() => navigate(`/customers/${p.customerId}`)} />;
      },
    },
    { key: 'date', header: 'Payment date', render: (p) => <span className="whitespace-nowrap text-[12.5px] text-slate-700">{formatDate(p.date)}</span> },
    {
      key: 'method',
      header: 'Method',
      render: (p) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] text-slate-700">
          <span className={cn('grid h-6 w-6 place-items-center rounded-md',
            p.method === 'Cash' ? 'bg-emerald-50 text-emerald-600'
              : p.method === 'UPI' ? 'bg-brand-50 text-brand-600'
                : p.method === 'Card' ? 'bg-violet-50 text-violet-600'
                  : 'bg-indigo-50 text-indigo-600')}>
            {methodIcon[p.method]}
          </span>
          {p.method}
        </span>
      ),
    },
    { key: 'total', header: 'Total amount', align: 'right', render: (p) => <span className="whitespace-nowrap tabular-nums text-slate-600">{formatINR(p.totalAmount)}</span> },
    {
      key: 'paid',
      header: 'Paid amount',
      align: 'right',
      render: (p) => (
        <span className={cn('whitespace-nowrap font-semibold tabular-nums', p.paidAmount > 0 ? 'text-navy-900' : 'text-slate-400')}>
          {formatINR(p.paidAmount)}
        </span>
      ),
    },
    { key: 'status', header: 'Payment status', render: (p) => <PaymentStatusBadge status={p.status} size="sm" /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <Dropdown
          width="w-48"
          items={[
            { label: 'View details', icon: <Eye className="h-3.5 w-3.5" />, onClick: () => setViewing(p) },
            {
              label: 'Update payment',
              icon: <Pencil className="h-3.5 w-3.5" />,
              onClick: () => {
                setEditing(p);
                setPresetBooking(undefined);
                setFormOpen(true);
              },
            },
            { label: 'Open booking', icon: <ReceiptText className="h-3.5 w-3.5" />, onClick: () => navigate(`/bookings/${p.bookingId}`) },
            { separator: true },
            { label: 'Delete record', icon: <Trash2 className="h-3.5 w-3.5" />, danger: true, onClick: () => setDeleting(p) },
          ]}
          trigger={({ toggle }) => (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Payment actions"
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
        title="Payments"
        description="Track every collection across cash, UPI, card and online channels. Record part-payments, update statuses and reconcile the day."
        meta={
          <>
            <Badge tone="emerald" dot>{formatINR(kpis.todayCollected)} collected today</Badge>
            <Badge tone="amber" dot>{kpis.pendingCount} awaiting balance</Badge>
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
                setPresetBooking(undefined);
                setFormOpen(true);
              }}
            >
              Record payment
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total collected" value={formatINR(kpis.collected)} icon={<IndianRupee className="h-4 w-4" />} tone="emerald" change={12.8} comparison="vs previous period" />
        <StatCard label="Outstanding" value={formatINR(kpis.outstanding)} icon={<Clock className="h-4 w-4" />} tone="amber" footnote={`${kpis.pendingCount} open transactions`} />
        <StatCard label="Refunds issued" value={formatINR(kpis.refunded)} icon={<RotateCcw className="h-4 w-4" />} tone="rose" footnote="Cancellations & adjustments" />
        <StatCard label="Payment success rate" value="87.2%" icon={<TrendingUp className="h-4 w-4" />} tone="navy" change={2.4} comparison="vs last month" />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <SectionCard title="Collection mix" description="Revenue by payment method" className="xl:col-span-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {byMethod.map((m) => (
              <div key={m.method} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-700">
                    <span className={cn('grid h-6 w-6 place-items-center rounded-md',
                      m.method === 'Cash' ? 'bg-emerald-50 text-emerald-600'
                        : m.method === 'UPI' ? 'bg-brand-50 text-brand-600'
                          : m.method === 'Card' ? 'bg-violet-50 text-violet-600'
                            : 'bg-indigo-50 text-indigo-600')}>
                      {methodIcon[m.method]}
                    </span>
                    {m.method}
                  </span>
                  <span className="text-[12px] font-semibold tabular-nums text-navy-900">{formatINR(m.amount)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Meter value={m.share} tone={methodTone[m.method] === 'emerald' ? 'emerald' : methodTone[m.method] === 'blue' ? 'brand' : methodTone[m.method] === 'violet' ? 'violet' : 'navy'} />
                  <span className="w-9 shrink-0 text-right text-[10.5px] tabular-nums text-slate-500">{Math.round(m.share)}%</span>
                </div>
                <p className="mt-1 text-[10.5px] text-slate-400">{m.count} transactions</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Payment status" description="Across all transactions">
          <div className="space-y-3">
            {paymentStatuses.map((s) => {
              const list = payments.filter((p) => p.status === s);
              return (
                <button
                  key={s}
                  onClick={() => {
                    setStatus(s);
                    setPage(1);
                  }}
                  className="flex w-full items-center gap-2.5 text-left"
                >
                  <span className="w-16 shrink-0">
                    <PaymentStatusBadge status={s} size="sm" />
                  </span>
                  <Meter
                    value={(list.length / (payments.length || 1)) * 100}
                    tone={s === 'Paid' ? 'emerald' : s === 'Partial' ? 'brand' : s === 'Pending' ? 'amber' : 'rose'}
                  />
                  <span className="w-7 shrink-0 text-right text-[11.5px] font-semibold tabular-nums text-navy-900">{list.length}</span>
                </button>
              );
            })}
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2">
              <span className="text-[11px] text-slate-500">Total transactions</span>
              <span className="text-[12px] font-semibold tabular-nums text-navy-900">{payments.length}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <SearchBar value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search transaction, booking, customer…" className="w-full sm:w-[290px]" />
          <FilterSelect label="Method" value={method} onChange={(v) => { setMethod(v); setPage(1); }} options={[{ value: 'all', label: 'All methods' }, ...paymentMethods.map((m) => ({ value: m, label: m }))]} width="w-44" />
          <FilterSelect label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: 'all', label: 'Any status' }, ...paymentStatuses.map((s) => ({ value: s, label: s }))]} width="w-44" />
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              aria-label="From date"
              className="h-9 rounded-lg border border-slate-300 px-2 text-[12px] text-slate-700 focus:border-brand-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              aria-label="To date"
              className="h-9 rounded-lg border border-slate-300 px-2 text-[12px] text-slate-700 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>
        <span className="text-[11.5px] text-slate-400">{filtered.length} transactions</span>
      </div>

      <DataTable
        columns={columns}
        rows={paged}
        minWidth={1080}
        empty={
          <EmptyState
            title="No transactions found"
            description="Try a different filter, or record a new payment against a booking."
            icon={<Wallet className="h-5 w-5" />}
            action={<Button variant="outline" onClick={() => { setQuery(''); setMethod('all'); setStatus('all'); setDateFrom(''); setDateTo(''); }}>Clear filters</Button>}
          />
        }
      />
      <div className="card overflow-hidden rounded-t-none border-t-0">
        <Pagination page={safePage} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={setPageSize} />
      </div>

      <PaymentFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); setPresetBooking(undefined); }}
        payment={editing}
        presetBookingId={presetBooking}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && dispatch({ type: 'DELETE_PAYMENT', payload: deleting.id })}
        title={`Delete ${deleting?.id}?`}
        message="The transaction record will be removed. The linked booking's payment status stays unchanged in this prototype."
        confirmLabel="Delete record"
      />

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={`Transaction ${viewing?.id}`}
        description={viewing ? `${viewing.method} · ${formatDate(viewing.date)}` : ''}
        footer={
          <Button variant="primary" onClick={() => setViewing(null)}>
            Close
          </Button>
        }
      >
        {viewing && (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.05em] text-slate-400">Amount collected</p>
                  <p className="text-[20px] font-semibold tabular-nums text-navy-900">{formatINR(viewing.paidAmount)}</p>
                </div>
                <PaymentStatusBadge status={viewing.status} />
              </div>
              <p className="mt-2 text-[11.5px] text-slate-500">of {formatINR(viewing.totalAmount)} billed</p>
              <Meter value={(viewing.paidAmount / (viewing.totalAmount || 1)) * 100} tone="emerald" className="mt-2" />
            </div>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-3.5">
              {[
                ['Booking ID', viewing.bookingId],
                ['Customer', customerById(viewing.customerId)?.name || '—'],
                ['Method', viewing.method],
                ['Reference', viewing.reference],
                ['Collected by', viewing.collectedBy],
                ['Recorded at', formatDateTime(`${viewing.date}T10:30:00`)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-[12px] text-slate-500">{label}</span>
                  <span className="text-[12px] font-medium text-navy-900">{value}</span>
                </div>
              ))}
            </div>
            {viewing.notes && (
              <div className="rounded-lg border border-amber-200/70 bg-amber-50/60 p-2.5 text-[11.5px] leading-relaxed text-amber-900">
                {viewing.notes}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" leftIcon={<ReceiptText className="h-3.5 w-3.5" />} onClick={() => navigate(`/bookings/${viewing.bookingId}`)}>
                Open booking
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                leftIcon={<Pencil className="h-3.5 w-3.5" />}
                onClick={() => {
                  setEditing(viewing);
                  setViewing(null);
                  setFormOpen(true);
                }}
              >
                Update
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
