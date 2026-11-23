import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Printer, Download, ArrowLeft, Mail, Phone, MapPin, CheckCircle2, Wallet, BadgeCheck, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { Badge, PaymentStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/SearchBar';
import { useStore } from '@/context/StoreContext';
import { formatDate, formatDateNumeric } from '@/utils/date';
import { formatINRPrecise } from '@/utils/format';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/utils/cn';

export default function InvoiceDetails() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { invoices, customerById, vehicleById, bookingById, serviceById, settings } = useStore();
  const [downloaded, setDownloaded] = useState(false);

  const invoice = invoices.find((i) => i.id === id);
  const customer = customerById(invoice?.customerId || '');
  const booking = bookingById(invoice?.bookingId || '');
  const vehicle = vehicleById(booking?.vehicleId || '');

  // auto-open the print dialog when arriving with ?print=1 (used by Print / Download PDF)
  useEffect(() => {
    if (params.get('print') === '1' && invoice) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [params, invoice]);

  if (!invoice) {
    return (
      <div>
        <PageHeader title="Invoice not found" backTo="/invoices" backLabel="Back to invoices" />
        <div className="card">
          <EmptyState title="Invoice not found" description="This invoice may not exist yet — invoices are created when a booking is Ready or Completed." action={<Button variant="primary" onClick={() => navigate('/invoices')}>All invoices</Button>} />
        </div>
      </div>
    );
  }

  const subtotal = invoice.lines.reduce((a, l) => a + l.rate * l.qty, 0);
  const taxable = subtotal - invoice.discount;
  const tax = Math.round(taxable * (invoice.taxRate / 100));
  const total = taxable + tax;
  const balance = total - invoice.paidAmount;

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title={`Invoice ${invoice.id}`}
          backTo="/invoices"
          backLabel="Back to invoices"
          description={
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{formatDate(invoice.date)}</span>
              <span className="text-slate-300">·</span>
              <span>{customer?.name}</span>
              <span className="text-slate-300">·</span>
              <span>{invoice.lines.length} line item{invoice.lines.length === 1 ? '' : 's'}</span>
            </span>
          }
          meta={
            <>
              <PaymentStatusBadge status={invoice.paymentStatus} />
              <Badge tone="slate">Booking {invoice.bookingId}</Badge>
              <Badge tone="violet">GST {invoice.taxRate}%</Badge>
            </>
          }
          actions={
            <>
              <Button variant="outline" leftIcon={<ArrowLeft className="h-3.5 w-3.5" />} onClick={() => navigate('/invoices')}>
                <span className="hidden sm:inline">Back</span>
              </Button>
              <Button variant="outline" leftIcon={<Printer className="h-3.5 w-3.5" />} onClick={() => window.print()}>
                Print
              </Button>
              <Button
                variant="primary"
                leftIcon={downloaded ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                onClick={() => {
                  setDownloaded(true);
                  window.print();
                  setTimeout(() => setDownloaded(false), 2500);
                }}
              >
                {downloaded ? 'Preparing…' : 'Download PDF'}
              </Button>
            </>
          }
        />
      </div>

      {/* The invoice document */}
      <div className="mx-auto max-w-[860px]">
        <article className="print-area card overflow-hidden bg-white">
          {/* Header */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-navy-900 to-navy-800 px-6 py-5 text-white sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <Logo collapsed variant="dark" />
                </span>
                <div>
                  <p className="text-[16px] font-semibold tracking-[-0.01em]">{settings.name}</p>
                  <p className="mt-0.5 max-w-[280px] text-[11px] leading-relaxed text-slate-300">{settings.address}, {settings.city}</p>
                  <p className="mt-1 text-[11px] text-slate-300">
                    GSTIN: <span className="font-medium text-white">{settings.gstin}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-brand-300">Tax invoice</p>
                <p className="mt-1 font-mono text-[17px] font-semibold">{invoice.id}</p>
                <p className="mt-1 text-[11px] text-slate-300">Issued {formatDateNumeric(invoice.date)}</p>
                <p className="text-[11px] text-slate-300">Due {formatDateNumeric(invoice.dueDate)}</p>
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-1 gap-5 border-b border-slate-200 px-6 py-5 sm:grid-cols-3 sm:px-8">
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">Billed to</p>
              <p className="mt-1.5 text-[13px] font-semibold text-navy-900">{customer?.name}</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">{customer?.address}</p>
              <p className="mt-1 flex items-center gap-1 text-[11.5px] text-slate-600">
                <Phone className="h-3 w-3 text-slate-400" /> {customer?.phone}
              </p>
              <p className="flex items-center gap-1 text-[11.5px] text-slate-600">
                <Mail className="h-3 w-3 text-slate-400" /> {customer?.email}
              </p>
            </div>
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">Vehicle</p>
              <p className="mt-1.5 font-mono text-[13px] font-semibold text-navy-900">{vehicle?.registration}</p>
              <p className="mt-0.5 text-[11.5px] text-slate-500">
                {vehicle?.brand} {vehicle?.model} · {vehicle?.year}
              </p>
              <p className="text-[11.5px] text-slate-500">
                {vehicle?.type} · {vehicle?.color}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Booking {invoice.bookingId}</p>
            </div>
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">Payment</p>
              <div className="mt-1.5">
                <PaymentStatusBadge status={invoice.paymentStatus} size="sm" />
              </div>
              <p className="mt-2 text-[11.5px] text-slate-500">
                Paid <span className="font-semibold text-emerald-600">{formatINRPrecise(invoice.paidAmount)}</span>
              </p>
              <p className="text-[11.5px] text-slate-500">
                Balance <span className={cn('font-semibold', balance > 0 ? 'text-amber-600' : 'text-slate-600')}>{formatINRPrecise(Math.max(0, balance))}</span>
              </p>
              <p className="mt-1 flex items-center gap-1 text-[10.5px] text-slate-400">
                <MapPin className="h-2.5 w-2.5" /> {settings.phone}
              </p>
            </div>
          </div>

          {/* Line items */}
          <div className="px-6 py-5 sm:px-8">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-2 text-left text-[9.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">Description</th>
                  <th className="pb-2 text-center text-[9.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">Qty</th>
                  <th className="pb-2 text-right text-[9.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">Rate</th>
                  <th className="pb-2 text-right text-[9.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((l, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2.5">
                      <p className="text-[12.5px] font-medium text-navy-900">{l.label}</p>
                      <p className="text-[10.5px] text-slate-400">Car wash & detailing service</p>
                    </td>
                    <td className="py-2.5 text-center text-[12.5px] tabular-nums text-slate-600">{l.qty}</td>
                    <td className="py-2.5 text-right text-[12.5px] tabular-nums text-slate-600">{formatINRPrecise(l.rate)}</td>
                    <td className="py-2.5 text-right text-[12.5px] font-medium tabular-nums text-navy-900">{formatINRPrecise(l.rate * l.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <div className="w-full max-w-[300px] space-y-1.5">
                <div className="flex justify-between text-[12px]">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="tabular-nums text-slate-700">{formatINRPrecise(subtotal)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-slate-500">Discount</span>
                    <span className="tabular-nums text-rose-600">− {formatINRPrecise(invoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[12px]">
                  <span className="text-slate-500">Taxable value</span>
                  <span className="tabular-nums text-slate-700">{formatINRPrecise(taxable)}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-slate-500">CGST ({(invoice.taxRate / 2).toFixed(1)}%)</span>
                  <span className="tabular-nums text-slate-700">{formatINRPrecise(tax / 2)}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-slate-500">SGST ({(invoice.taxRate / 2).toFixed(1)}%)</span>
                  <span className="tabular-nums text-slate-700">{formatINRPrecise(tax / 2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-300 pt-2 text-[14px] font-semibold text-navy-900">
                  <span>Total payable</span>
                  <span className="tabular-nums">{formatINRPrecise(total)}</span>
                </div>
                <div className="flex justify-between text-[11.5px]">
                  <span className="text-slate-500">Amount paid</span>
                  <span className="tabular-nums font-medium text-emerald-600">{formatINRPrecise(invoice.paidAmount)}</span>
                </div>
                <div
                  className={cn(
                    'flex justify-between rounded-lg px-2 py-1.5 text-[12px] font-semibold',
                    balance > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                  )}
                >
                  <span>{balance > 0 ? 'Balance due' : 'Balance (fully settled)'}</span>
                  <span className="tabular-nums">{formatINRPrecise(Math.max(0, balance))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50/70 px-6 py-4 sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-[420px]">
                <p className="flex items-center gap-1 text-[11px] font-semibold text-navy-900">
                  <BadgeCheck className="h-3.5 w-3.5 text-brand-600" /> Thank you for choosing AutoSutraa
                </p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-slate-500">
                  This is a computer-generated invoice. Payment is due on receipt. For ceramic coating and detailing
                  packages, the 3-year warranty card is issued separately. Queries: {settings.email} · {settings.phone}.
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-slate-400">Authorised signatory</p>
                <p className="mt-5 border-t border-slate-300 pt-1.5 text-[11px] font-medium text-navy-900">AutoSutraa Car Spa</p>
              </div>
            </div>
          </div>
        </article>

        <div className="no-print mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11.5px] text-slate-500">
            Need to collect the balance? Record the payment against booking{' '}
            <button onClick={() => navigate(`/bookings/${invoice.bookingId}`)} className="font-medium text-brand-600 hover:underline">
              {invoice.bookingId}
            </button>
            .
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<Wallet className="h-3.5 w-3.5" />} onClick={() => navigate(`/payments?record=${invoice.bookingId}`)}>
              Record payment
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Printer className="h-3.5 w-3.5" />} onClick={() => window.print()}>
              Print again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
