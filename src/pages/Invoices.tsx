import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReceiptText,
  Download,
  Eye,
  Printer,
  MoreHorizontal,
  IndianRupee,
  CircleCheck,
  Clock,
  FileText,
  Percent,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { SearchBar, EmptyState, Pagination } from '@/components/ui/SearchBar';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PersonCell } from '@/components/ui/Avatar';
import { Badge, PaymentStatusBadge } from '@/components/ui/Badge';
import { Dropdown, FilterSelect } from '@/components/ui/Dropdown';
import { StatCard } from '@/components/ui/StatCard';
import { useStore } from '@/context/StoreContext';
import { formatDate, TODAY_ISO } from '@/utils/date';
import { formatINR } from '@/utils/format';
import { downloadCSV } from '@/utils/ui';
import { paymentStatuses } from '@/utils/statusStyles';
import type { Invoice } from '@/types';

export default function Invoices() {
  const navigate = useNavigate();
  const { invoices, customerById, bookingById } = useStore();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const invoiceTotal = (inv: Invoice) => {
    const subtotal = inv.lines.reduce((a, l) => a + l.rate * l.qty, 0);
    const tax = Math.round((subtotal - inv.discount) * (inv.taxRate / 100));
    return subtotal - inv.discount + tax;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices
      .filter((inv) => {
        if (status !== 'all' && inv.paymentStatus !== status) return false;
        if (q) {
          const c = customerById(inv.customerId);
          const hay = `${inv.id} ${inv.bookingId} ${c?.name} ${c?.phone}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [invoices, query, status, customerById]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const kpis = useMemo(() => {
    const billed = invoices.reduce((a, i) => a + invoiceTotal(i), 0);
    const paid = invoices.filter((i) => i.paymentStatus === 'Paid').reduce((a, i) => a + invoiceTotal(i), 0);
    const tax = invoices.reduce((a, i) => a + Math.round((i.lines.reduce((s, l) => s + l.rate * l.qty, 0) - i.discount) * (i.taxRate / 100)), 0);
    return { billed, paid, tax, count: invoices.length, unpaid: invoices.filter((i) => i.paymentStatus !== 'Paid').length };
  }, [invoices]);

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ['Invoice number', 'Customer', 'Booking ID', 'Invoice date', 'Subtotal', 'Discount', 'Tax', 'Total', 'Payment status'],
    ];
    filtered.forEach((inv) => {
      const subtotal = inv.lines.reduce((a, l) => a + l.rate * l.qty, 0);
      const tax = Math.round((subtotal - inv.discount) * (inv.taxRate / 100));
      rows.push([
        inv.id, customerById(inv.customerId)?.name || '', inv.bookingId, inv.date,
        subtotal, inv.discount, tax, subtotal - inv.discount + tax, inv.paymentStatus,
      ]);
    });
    downloadCSV(`autosutraa-invoices-${TODAY_ISO}`, rows);
  };

  const columns: Column<Invoice>[] = [
    {
      key: 'id',
      header: 'Invoice number',
      render: (inv) => (
        <button onClick={() => navigate(`/invoices/${inv.id}`)} className="inline-flex items-center gap-1.5 font-semibold tabular-nums text-brand-700 hover:underline">
          <FileText className="h-3.5 w-3.5" /> {inv.id}
        </button>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (inv) => {
        const c = customerById(inv.customerId);
        return <PersonCell name={c?.name || '—'} secondary={c?.phone} avatarTone="violet" onClick={() => navigate(`/customers/${inv.customerId}`)} />;
      },
    },
    {
      key: 'booking',
      header: 'Booking ID',
      render: (inv) => (
        <button onClick={() => navigate(`/bookings/${inv.bookingId}`)} className="text-[12.5px] tabular-nums text-slate-700 hover:text-brand-700 hover:underline">
          {inv.bookingId}
        </button>
      ),
    },
    { key: 'date', header: 'Invoice date', render: (inv) => <span className="whitespace-nowrap text-[12.5px] text-slate-700">{formatDate(inv.date)}</span> },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (inv) => {
        const subtotal = inv.lines.reduce((a, l) => a + l.rate * l.qty, 0);
        return <span className="whitespace-nowrap tabular-nums text-slate-600">{formatINR(subtotal)}</span>;
      },
    },
    {
      key: 'tax',
      header: 'Tax',
      align: 'right',
      render: (inv) => {
        const subtotal = inv.lines.reduce((a, l) => a + l.rate * l.qty, 0);
        const tax = Math.round((subtotal - inv.discount) * (inv.taxRate / 100));
        return (
          <span className="whitespace-nowrap tabular-nums text-slate-600">
            {formatINR(tax)} <span className="text-[10px] text-slate-400">({inv.taxRate}%)</span>
          </span>
        );
      },
    },
    {
      key: 'discount',
      header: 'Discount',
      align: 'right',
      render: (inv) =>
        inv.discount > 0 ? (
          <span className="whitespace-nowrap tabular-nums text-rose-600">− {formatINR(inv.discount)}</span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (inv) => <span className="whitespace-nowrap font-semibold tabular-nums text-navy-900">{formatINR(invoiceTotal(inv))}</span>,
    },
    { key: 'payment', header: 'Payment status', render: (inv) => <PaymentStatusBadge status={inv.paymentStatus} size="sm" /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (inv) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${inv.id}`); }}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="View invoice"
          >
            <Eye className="h-4 w-4" />
          </button>
          <Dropdown
            width="w-44"
            items={[
              { label: 'View invoice', icon: <Eye className="h-3.5 w-3.5" />, onClick: () => navigate(`/invoices/${inv.id}`) },
              { label: 'Print invoice', icon: <Printer className="h-3.5 w-3.5" />, onClick: () => navigate(`/invoices/${inv.id}?print=1`) },
              { label: 'Download PDF', icon: <Download className="h-3.5 w-3.5" />, onClick: () => navigate(`/invoices/${inv.id}?print=1`) },
            ]}
            trigger={({ toggle }) => (
              <button
                onClick={(e) => { e.stopPropagation(); toggle(); }}
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Invoice actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            )}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="GST-ready invoices generated from completed bookings. View, print or download each document."
        meta={
          <>
            <Badge tone="emerald" dot>{formatINR(kpis.paid)} settled</Badge>
            <Badge tone="amber" dot>{kpis.unpaid} pending</Badge>
            <Badge tone="slate"><Percent className="h-3 w-3" /> 18% GST applied</Badge>
          </>
        }
        actions={
          <Button variant="outline" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={exportCsv}>
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total billed" value={formatINR(kpis.billed)} icon={<IndianRupee className="h-4 w-4" />} tone="navy" change={10.6} comparison="vs last month" />
        <StatCard label="Collected" value={formatINR(kpis.paid)} icon={<CircleCheck className="h-4 w-4" />} tone="emerald" footnote={`${Math.round((kpis.paid / (kpis.billed || 1)) * 100)}% of billed value`} />
        <StatCard label="GST collected" value={formatINR(kpis.tax)} icon={<Percent className="h-4 w-4" />} tone="violet" footnote="18% on taxable value" />
        <StatCard label="Invoices issued" value={kpis.count} icon={<Clock className="h-4 w-4" />} tone="brand" footnote={`${kpis.unpaid} awaiting payment`} />
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <SearchBar value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search invoice no, booking, customer…" className="w-full sm:w-[300px]" />
          <FilterSelect label="Payment" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: 'all', label: 'Any status' }, ...paymentStatuses.map((s) => ({ value: s, label: s }))]} width="w-44" />
        </div>
        <span className="text-[11.5px] text-slate-400">{filtered.length} invoices</span>
      </div>

      <DataTable
        columns={columns}
        rows={paged}
        minWidth={1120}
        onRowClick={(inv) => navigate(`/invoices/${inv.id}`)}
        empty={<EmptyState title="No invoices found" description="Invoices are created automatically when a booking is marked Ready or Completed." icon={<ReceiptText className="h-5 w-5" />} />}
      />
      <div className="card overflow-hidden rounded-t-none border-t-0">
        <Pagination page={safePage} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={setPageSize} />
      </div>
    </div>
  );
}
