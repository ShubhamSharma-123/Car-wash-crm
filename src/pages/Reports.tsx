import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Download,
  CalendarRange,
  IndianRupee,
  TrendingUp,
  Users,
  CircleCheck,
  CircleSlash,
  Percent,
  Repeat,
  Star,
  FileSpreadsheet,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader, SectionCard, SegmentedControl, Tabs } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { Badge, PaymentStatusBadge, BookingStatusBadge } from '@/components/ui/Badge';
import { StatCard, Meter } from '@/components/ui/StatCard';
import { ChartCard, ChartTooltip, ChartLegend } from '@/components/ui/ChartCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/SearchBar';
import { PersonCell } from '@/components/ui/Avatar';
import { ServiceThumb } from '@/components/ui/Logo';
import { useStore } from '@/context/StoreContext';
import { dailyRevenue, weeklyRevenue, monthlyRevenue, customerGrowth, servicePerformance, retentionSeries, peakHours, staffPerformance, topServices } from '@/data/dashboardData';
import { reportDefinitions } from '@/data/reports';
import { dayISO, formatDate, TODAY_ISO, shortDayLabel, parseISO, MONTHS } from '@/utils/date';
import { formatINR, formatNumber, formatCompactINR } from '@/utils/format';
import { CHART_COLORS, downloadCSV, pctChange } from '@/utils/ui';
import { cn } from '@/utils/cn';

type Range = '7d' | '30d' | '90d' | '12m' | 'custom';

/** Two-line tick for long service names in horizontal bar charts. */
function wrapTick({ x, y, payload }: { x?: number; y?: number; payload?: { value?: string } }) {
  const text = String(payload?.value ?? '');
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  words.forEach((w) => {
    if ((line + ' ' + w).trim().length > 11) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  });
  if (line) lines.push(line);
  return (
    <text x={x} y={y} textAnchor="end" dominantBaseline="middle" fill="#64748b" fontSize={10}>
      {lines.slice(0, 2).map((l, i) => (
        <tspan key={i} x={x} dy={i === 0 ? (lines.length > 1 ? -5 : 0) : 11}>
          {l}
        </tspan>
      ))}
    </text>
  );
}
type Tab = 'revenue' | 'bookings' | 'customers' | 'staff' | 'payments';

export default function Reports() {
  const { bookings, customers, payments, services, staff, customerById, serviceById, staffById } = useStore();
  const [range, setRange] = useState<Range>('30d');
  const [tab, setTab] = useState<Tab>('revenue');
  const [from, setFrom] = useState(dayISO(-30));
  const [to, setTo] = useState(TODAY_ISO);

  const bounds = useMemo(() => {
    if (range === 'custom') return { from, to };
    if (range === '7d') return { from: dayISO(-6), to: TODAY_ISO };
    if (range === '30d') return { from: dayISO(-29), to: TODAY_ISO };
    if (range === '90d') return { from: dayISO(-89), to: TODAY_ISO };
    return { from: dayISO(-364), to: TODAY_ISO };
  }, [range, from, to]);

  const scoped = useMemo(
    () => bookings.filter((b) => b.date >= bounds.from && b.date <= bounds.to),
    [bookings, bounds]
  );

  const previous = useMemo(() => {
    const spanDays = Math.max(1, Math.round((parseISO(bounds.to).getTime() - parseISO(bounds.from).getTime()) / 864e5) + 1);
    const prevTo = dayISO(-spanDays - 1);
    const prevFrom = dayISO(-spanDays * 2);
    return bookings.filter((b) => b.date >= prevFrom && b.date <= prevTo);
  }, [bookings, bounds]);

  const kpis = useMemo(() => {
    const revenue = scoped.reduce((a, b) => a + b.paidAmount, 0);
    const prevRevenue = previous.reduce((a, b) => a + b.paidAmount, 0);
    const completed = scoped.filter((b) => b.status === 'Completed');
    const cancelled = scoped.filter((b) => ['Cancelled', 'No Show'].includes(b.status));
    const newCust = customers.filter((c) => c.joinedAt >= bounds.from).length;
    const uniqueCustomers = new Set(scoped.map((b) => b.customerId));
    const repeatCustomers = [...uniqueCustomers].filter((id) => scoped.filter((b) => b.customerId === id).length > 1);
    return {
      revenue,
      revenueChange: pctChange(revenue, prevRevenue),
      bookings: scoped.length,
      bookingsChange: pctChange(scoped.length, previous.length),
      completed: completed.length,
      cancelled: cancelled.length,
      cancelRate: (cancelled.length / (scoped.length || 1)) * 100,
      newCust,
      returningRate: (repeatCustomers.length / (uniqueCustomers.size || 1)) * 100,
      avgTicket: revenue / (completed.length || 1),
      collectionRate: (revenue / (scoped.reduce((a, b) => a + b.amount, 0) || 1)) * 100,
      lostRevenue: cancelled.reduce((a, b) => a + b.amount, 0),
    };
  }, [scoped, previous, customers, bounds]);

  const revenueSeries = useMemo(() => {
    const byDay = new Map<string, { revenue: number; bookings: number }>();
    scoped.forEach((b) => {
      const cur = byDay.get(b.date) || { revenue: 0, bookings: 0 };
      byDay.set(b.date, { revenue: cur.revenue + b.paidAmount, bookings: cur.bookings + 1 });
    });
    const days = range === '90d' || range === '12m' ? weeklyRevenue.slice(-13).map((w) => ({ label: w.label, revenue: w.revenue, bookings: w.bookings })) : null;
    if (days) return days;
    const out: { label: string; revenue: number; bookings: number }[] = [];
    let cursor = parseISO(bounds.from);
    const end = parseISO(bounds.to);
    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${`${cursor.getMonth() + 1}`.padStart(2, '0')}-${`${cursor.getDate()}`.padStart(2, '0')}`;
      const v = byDay.get(key) || { revenue: 0, bookings: 0 };
      out.push({ label: shortDayLabel(key), revenue: v.revenue, bookings: v.bookings });
      cursor = new Date(cursor.getTime() + 864e5);
    }
    return out;
  }, [scoped, range, bounds]);

  const peakHourSeries = useMemo(() => {
    const map = new Map<string, number>();
    scoped.forEach((b) => {
      const t = String(b.timeSlot || '');
      const m = t.match(/(\d{1,2})(?::\d{2})?\s*(AM|PM)/i);
      if (!m) return;
      let hh = Number(m[1]) % 12;
      if (m[2].toUpperCase() === 'PM') hh += 12;
      const key = `${`${hh}`.padStart(2, '0')}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([h, count]) => ({ label: `${h}:00`, bookings: count }));
  }, [scoped]);

  const serviceRows = useMemo(
    () =>
      services
        .map((s) => {
          const list = scoped.filter((b) => b.serviceIds.includes(s.id) && !['Cancelled', 'No Show'].includes(b.status));
          const revenue = list.reduce((a, b) => {
            const subtotal = b.serviceIds.reduce((x, id) => x + (serviceById(id)?.price || 0), 0);
            return a + Math.round(b.amount * (s.price / (subtotal || 1)));
          }, 0);
          return { ...s, count: list.length, revenue };
        })
        .sort((a, b) => b.revenue - a.revenue),
    [services, scoped, serviceById]
  );

  const staffRows = useMemo(
    () =>
      staff
        .map((s) => {
          const assigned = scoped.filter((b) => b.assignedStaffId === s.id);
          const completed = assigned.filter((b) => b.status === 'Completed');
          return {
            id: s.id,
            name: s.name,
            role: s.role,
            avatarTone: s.avatarTone,
            assigned: assigned.length,
            completed: completed.length,
            revenue: completed.reduce((a, b) => a + b.amount, 0),
            rating: s.rating,
            onTime: 86 + ((staff.indexOf(s) * 3) % 13),
            completion: assigned.length ? Math.round((completed.length / assigned.length) * 100) : 0,
          };
        })
        .sort((a, b) => b.completed - a.completed),
    [staff, scoped]
  );

  const paymentRows = useMemo(() => {
    const methods = ['Cash', 'UPI', 'Card', 'Online'] as const;
    return methods.map((m) => {
      const scopedPayments = payments.filter(
        (p) => p.method === m && p.date >= bounds.from && p.date <= bounds.to
      );
      return {
        method: m,
        count: scopedPayments.length,
        collected: scopedPayments.reduce((a, p) => a + p.paidAmount, 0),
        pending: scopedPayments.reduce((a, p) => a + (p.totalAmount - p.paidAmount), 0),
        refunded: scopedPayments.filter((p) => p.status === 'Refunded').reduce((a, p) => a + p.totalAmount, 0),
      };
    });
  }, [payments, bounds]);

  const customerRows = useMemo(
    () =>
      customers
        .map((c) => {
          const list = scoped.filter((b) => b.customerId === c.id);
          return {
            ...c,
            scopedBookings: list.length,
            scopedSpend: list.reduce((a, b) => a + b.paidAmount, 0),
          };
        })
        .filter((c) => c.scopedBookings > 0)
        .sort((a, b) => b.scopedSpend - a.scopedSpend),
    [customers, scoped]
  );

  const exportReport = () => {
    const stamp = `${bounds.from}_to_${bounds.to}`;
    if (tab === 'revenue') {
      downloadCSV(`revenue-report_${stamp}`, [
        ['Date', 'Revenue collected', 'Bookings'],
        ...revenueSeries.map((r) => [r.label, r.revenue, r.bookings]),
        [],
        ['Service', 'Bookings', 'Revenue'],
        ...serviceRows.map((s) => [s.name, s.count, s.revenue]),
      ]);
    } else if (tab === 'bookings') {
      downloadCSV(`booking-report_${stamp}`, [
        ['Booking ID', 'Customer', 'Service', 'Date', 'Amount', 'Paid', 'Payment', 'Status', 'Staff'],
        ...scoped.map((b) => [
          b.id, customerById(b.customerId)?.name || '', b.serviceIds.map((s) => serviceById(s)?.name).join(' + '),
          b.date, b.amount, b.paidAmount, b.paymentStatus, b.status, staffById(b.assignedStaffId)?.name || '',
        ]),
      ]);
    } else if (tab === 'customers') {
      downloadCSV(`customer-report_${stamp}`, [
        ['Customer ID', 'Name', 'Phone', 'City', 'Bookings in range', 'Spend in range', 'Lifetime bookings', 'Status'],
        ...customerRows.map((c) => [c.id, c.name, c.phone, c.city, c.scopedBookings, c.scopedSpend, c.totalBookings, c.status]),
      ]);
    } else if (tab === 'staff') {
      downloadCSV(`staff-report_${stamp}`, [
        ['Staff', 'Role', 'Assigned', 'Completed', 'Completion %', 'Revenue', 'Rating', 'On-time %'],
        ...staffRows.map((s) => [s.name, s.role, s.assigned, s.completed, s.completion, s.revenue, s.rating, s.onTime]),
      ]);
    } else {
      downloadCSV(`payment-report_${stamp}`, [
        ['Method', 'Transactions', 'Collected', 'Outstanding', 'Refunded'],
        ...paymentRows.map((p) => [p.method, p.count, p.collected, p.pending, p.refunded]),
      ]);
    }
  };

  const rangeLabel = `${formatDate(bounds.from)} – ${formatDate(bounds.to)}`;

  return (
    <div>
      <PageHeader
        title="Reports & analytics"
        description="Revenue, booking, customer, staff and payment intelligence for any date range — exportable to CSV."
        meta={
          <>
            <Badge tone="blue" dot>{rangeLabel}</Badge>
            <Badge tone="slate">{scoped.length} bookings in range</Badge>
          </>
        }
        actions={
          <>
            <Button variant="outline" leftIcon={<CalendarRange className="h-3.5 w-3.5" />} onClick={() => setRange('custom')}>
              <span className="hidden sm:inline">Custom range</span>
              <span className="sm:hidden">Range</span>
            </Button>
            <Button variant="primary" leftIcon={<FileSpreadsheet className="h-3.5 w-3.5" />} onClick={exportReport}>
              Export CSV
            </Button>
          </>
        }
      />

      {/* Range bar */}
      <div className="card mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <SegmentedControl<Range>
            value={range}
            onChange={setRange}
            options={[
              { value: '7d', label: '7d' },
              { value: '30d', label: '30d' },
              { value: '90d', label: '90d' },
              { value: '12m', label: '12m' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
        </div>
        {range === 'custom' ? (
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-8 rounded-lg border border-slate-300 px-2 text-[12px] text-slate-700 focus:border-brand-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-400">to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-8 rounded-lg border border-slate-300 px-2 text-[12px] text-slate-700 focus:border-brand-500 focus:outline-none"
            />
          </div>
        ) : (
          <p className="text-[11.5px] text-slate-500">
            Comparing against the previous {range === '7d' ? '7 days' : range === '30d' ? '30 days' : range === '90d' ? '90 days' : '12 months'}
          </p>
        )}
      </div>

      {/* KPI cards */}
      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        <StatCard label="Revenue" value={formatINR(kpis.revenue)} icon={<IndianRupee className="h-4 w-4" />} tone="emerald" change={kpis.revenueChange} comparison="vs previous period" spark={dailyRevenue.slice(-14).map((d) => d.revenue)} />
        <StatCard label="Bookings" value={formatNumber(kpis.bookings)} icon={<BarChart3 className="h-4 w-4" />} tone="brand" change={kpis.bookingsChange} comparison="vs previous period" spark={dailyRevenue.slice(-14).map((d) => d.bookings)} />
        <StatCard label="Completed" value={formatNumber(kpis.completed)} icon={<CircleCheck className="h-4 w-4" />} tone="teal" footnote={`${kpis.bookings ? Math.round((kpis.completed / kpis.bookings) * 100) : 0}% completion rate`} />
        <StatCard label="Cancelled / no-show" value={formatNumber(kpis.cancelled)} icon={<CircleSlash className="h-4 w-4" />} tone="rose" footnote={`${kpis.cancelRate.toFixed(1)}% · ${formatCompactINR(kpis.lostRevenue)} lost`} />
        <StatCard label="Avg. ticket" value={formatINR(kpis.avgTicket)} icon={<TrendingUp className="h-4 w-4" />} tone="navy" footnote={`${kpis.collectionRate.toFixed(0)}% collected`} />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {[
          { label: 'New customers', value: formatNumber(kpis.newCust), icon: <Users className="h-3.5 w-3.5" /> },
          { label: 'Returning rate', value: `${kpis.returningRate.toFixed(0)}%`, icon: <Repeat className="h-3.5 w-3.5" /> },
          { label: 'Collection rate', value: `${kpis.collectionRate.toFixed(1)}%`, icon: <Percent className="h-3.5 w-3.5" /> },
          { label: 'Services sold', value: formatNumber(scoped.reduce((a, b) => a + b.serviceIds.length, 0)), icon: <Star className="h-3.5 w-3.5" /> },
          { label: 'Avg. rating', value: (staff.reduce((a, s) => a + s.rating, 0) / (staff.length || 1)).toFixed(1), icon: <Star className="h-3.5 w-3.5" /> },
        ].map((k) => (
          <div key={k.label} className="card flex items-center gap-2.5 p-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200">
              {k.icon}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-medium uppercase tracking-[0.04em] text-slate-400">{k.label}</p>
              <p className="text-[15px] font-semibold tabular-nums text-navy-900">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="card mb-3 overflow-hidden">
        <Tabs<Tab>
          value={tab}
          onChange={setTab}
          className="px-2 pt-1"
          tabs={[
            { value: 'revenue', label: 'Revenue' },
            { value: 'bookings', label: 'Bookings' },
            { value: 'customers', label: 'Customers' },
            { value: 'staff', label: 'Staff performance' },
            { value: 'payments', label: 'Payments' },
          ]}
        />

        <div className="space-y-3 p-4">
          {tab === 'revenue' && (
            <>
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                <ChartCard
                  title="Revenue trend"
                  subtitle={`Collections across ${rangeLabel}`}
                  className="xl:col-span-2"
                  footer={<ChartLegend items={[{ label: 'Collected revenue', color: '#2563eb' }]} />}
                >
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueSeries} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                        <defs>
                          <linearGradient id="repFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.22} />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#eef2f7" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10.5, fill: '#94a3b8' }} interval="preserveStartEnd" minTickGap={18} dy={6} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10.5, fill: '#94a3b8' }} width={52} tickFormatter={(v) => formatCompactINR(Number(v)).replace('.0', '')} />
                        <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }} />
                        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" strokeWidth={2} fill="url(#repFill)" activeDot={{ r: 3.5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard title="Service-wise revenue" subtitle="Top contributors in range">
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={serviceRows.slice(0, 6)} layout="vertical" margin={{ top: 4, right: 20, left: 2, bottom: 0 }}>
                        <CartesianGrid horizontal={false} stroke="#eef2f7" />
                        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => formatCompactINR(Number(v)).replace('.0', '')} />
                        <YAxis type="category" dataKey="name" width={116} tickLine={false} axisLine={false} tick={wrapTick} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(37,99,235,0.05)' }} />
                        <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]} maxBarSize={16}>
                          {serviceRows.slice(0, 6).map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>

              <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-2">
                <div className="space-y-3">
                <ChartCard title="Daily revenue detail" subtitle="Revenue and booking volume per period">
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueSeries} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="#eef2f7" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} interval="preserveStartEnd" minTickGap={24} dy={6} />
                        <YAxis yAxisId="l" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={48} tickFormatter={(v) => formatCompactINR(Number(v)).replace('.0', '')} />
                        <YAxis yAxisId="r" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={28} />
                        <Tooltip content={<ChartTooltip />} />
                        <Line yAxisId="l" type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" strokeWidth={2} dot={false} />
                        <Line yAxisId="r" type="monotone" dataKey="bookings" name="Bookings" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard title="Peak booking hours" subtitle="Demand by slot — used to plan technician shifts">
                  <div className="h-[172px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={peakHourSeries.length > 2 ? peakHourSeries : peakHours} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="#eef2f7" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 9.5, fill: '#94a3b8' }} interval={0} dy={6} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={26} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(37,99,235,0.05)' }} />
                        <Bar dataKey={peakHourSeries.length > 2 ? 'bookings' : 'value'} name="Bookings" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <SectionCard title="Top customers in range" description="Highest spend for the selected period">
                  <div className="space-y-1.5">
                    {customerRows.slice(0, 5).map((c, i) => (
                      <div key={c.id} className="flex items-center gap-2">
                        <span className="w-3.5 shrink-0 text-[10.5px] font-semibold tabular-nums text-slate-400">{i + 1}</span>
                        <PersonCell name={c.name} secondary={`${c.scopedBookings} booking${c.scopedBookings === 1 ? '' : 's'}`} avatarTone={i === 0 ? 'violet' : 'blue'} size="sm" />
                        <div className="ml-auto flex shrink-0 items-center gap-2">
                          <div className="w-16">
                            <Meter value={(c.scopedSpend / (customerRows[0]?.scopedSpend || 1)) * 100} tone="brand" />
                          </div>
                          <span className="w-[68px] text-right text-[11.5px] font-semibold tabular-nums text-navy-900">{formatINR(c.scopedSpend)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
                </div>

                <SectionCard title="Service-wise revenue table" description="Every service in the catalogue">
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full">
                      <thead className="bg-slate-50/70">
                        <tr>
                          <th className="table-th">Service</th>
                          <th className="table-th text-center">Bookings</th>
                          <th className="table-th text-right">Revenue</th>
                          <th className="table-th text-right">Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviceRows.map((s) => (
                          <tr key={s.id} className="border-t border-slate-100">
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <ServiceThumb tone={s.imageTone} name={s.name} />
                                <div className="min-w-0">
                                  <p className="truncate text-[12px] font-medium text-navy-900">{s.name}</p>
                                  <p className="text-[10px] text-slate-400">{s.category}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center text-[12px] tabular-nums text-slate-600">{s.count}</td>
                            <td className="px-3 py-2 text-right text-[12px] font-semibold tabular-nums text-navy-900">{formatINR(s.revenue)}</td>
                            <td className="px-3 py-2 text-right">
                              <div className="ml-auto w-16">
                                <Meter value={(s.revenue / (kpis.revenue || 1)) * 100} tone="brand" />
                                <p className="mt-0.5 text-[10px] tabular-nums text-slate-400">
                                  {((s.revenue / (kpis.revenue || 1)) * 100).toFixed(1)}%
                                </p>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </div>
            </>
          )}

          {tab === 'bookings' && (
            <>
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                <ChartCard title="Booking volume" subtitle="Bookings per period in range" className="xl:col-span-2">
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="#eef2f7" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} interval="preserveStartEnd" minTickGap={18} dy={6} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={28} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(37,99,235,0.05)' }} />
                        <Bar dataKey="bookings" name="Bookings" fill="#1c3358" radius={[4, 4, 0, 0]} maxBarSize={26} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
                <ChartCard title="Status distribution" subtitle="Where bookings currently sit">
                  <div className="space-y-2 px-2 pt-1">
                    {['Completed', 'Ready', 'In Progress', 'Quality Check', 'Confirmed', 'New', 'Cancelled', 'No Show', 'Rescheduled'].map((s) => {
                      const count = scoped.filter((b) => b.status === s).length;
                      if (!count) return null;
                      return (
                        <div key={s} className="flex items-center gap-2">
                          <span className="w-[92px] shrink-0 truncate text-[11px] text-slate-600">{s}</span>
                          <Meter value={(count / (scoped.length || 1)) * 100} tone={s === 'Completed' ? 'emerald' : s === 'Cancelled' || s === 'No Show' ? 'rose' : 'brand'} />
                          <span className="w-6 shrink-0 text-right text-[11px] font-semibold tabular-nums text-navy-900">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </ChartCard>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="border-b border-slate-100 bg-slate-50/60 px-3 py-2">
                  <p className="text-[12px] font-semibold text-navy-900">Booking report · {scoped.length} records</p>
                </div>
                <div className="max-h-[420px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-slate-200">
                        <th className="table-th">Booking</th>
                        <th className="table-th">Customer</th>
                        <th className="table-th">Service</th>
                        <th className="table-th">Date</th>
                        <th className="table-th text-right">Amount</th>
                        <th className="table-th">Payment</th>
                        <th className="table-th">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoped.slice(0, 40).map((b) => (
                        <tr key={b.id} className="border-b border-slate-100 last:border-0">
                          <td className="table-td font-medium tabular-nums text-brand-700">{b.id}</td>
                          <td className="table-td">{customerById(b.customerId)?.name}</td>
                          <td className="table-td max-w-[180px] truncate">{b.serviceIds.map((s) => serviceById(s)?.name).join(' + ')}</td>
                          <td className="table-td whitespace-nowrap">{formatDate(b.date)}</td>
                          <td className="table-td text-right font-semibold tabular-nums text-navy-900">{formatINR(b.amount)}</td>
                          <td className="table-td"><PaymentStatusBadge status={b.paymentStatus} size="sm" /></td>
                          <td className="table-td"><BookingStatusBadge status={b.status} size="sm" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === 'customers' && (
            <>
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <ChartCard title="New vs returning" subtitle="Customer mix over the last 6 months">
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={customerGrowth.slice(-6)} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barCategoryGap="26%">
                        <CartesianGrid vertical={false} stroke="#eef2f7" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={6} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={28} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(37,99,235,0.04)' }} />
                        <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="neue" name="New" stackId="a" fill="#3b82f6" maxBarSize={30} />
                        <Bar dataKey="returning" name="Returning" stackId="a" fill="#1c3358" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
                <ChartCard title="Customer retention" subtitle="Repeat-visit rate by month">
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={retentionSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="retFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.24} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#eef2f7" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={6} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={32} domain={[0, 100]} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="retention" name="Retention %" stroke="#10b981" strokeWidth={2} fill="url(#retFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>

              <SectionCard title="Customer report" description={`${customerRows.length} customers transacted in this range`}>
                <div className="max-h-[380px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-slate-200">
                        <th className="table-th">Customer</th>
                        <th className="table-th">City</th>
                        <th className="table-th text-center">Bookings</th>
                        <th className="table-th text-right">Spend in range</th>
                        <th className="table-th text-right">Lifetime</th>
                        <th className="table-th">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerRows.slice(0, 25).map((c) => (
                        <tr key={c.id} className="border-b border-slate-100 last:border-0">
                          <td className="table-td">
                            <PersonCell name={c.name} secondary={c.phone} avatarTone={c.status === 'VIP' ? 'violet' : 'blue'} />
                          </td>
                          <td className="table-td">{c.city}</td>
                          <td className="table-td text-center tabular-nums">{c.scopedBookings}</td>
                          <td className="table-td text-right font-semibold tabular-nums text-navy-900">{formatINR(c.scopedSpend)}</td>
                          <td className="table-td text-right tabular-nums text-slate-500">{formatINR(c.totalSpent)}</td>
                          <td className="table-td">
                            <Badge tone={c.status === 'VIP' ? 'violet' : c.status === 'Active' ? 'green' : 'slate'} size="sm">
                              {c.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </>
          )}

          {tab === 'staff' && (
            <>
              <ChartCard title="Staff performance" subtitle="Completed services and revenue handled in range">
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={staffRows} margin={{ top: 8, right: 26, left: 22, bottom: 0 }} barCategoryGap="24%">
                      <CartesianGrid vertical={false} stroke="#eef2f7" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 9.5, fill: '#94a3b8' }} interval={0} angle={-12} textAnchor="end" height={48} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={28} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(37,99,235,0.04)' }} />
                      <Bar dataKey="completed" name="Completed" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full">
                  <thead className="bg-slate-50/70">
                    <tr>
                      <th className="table-th">Staff</th>
                      <th className="table-th">Role</th>
                      <th className="table-th text-center">Assigned</th>
                      <th className="table-th text-center">Completed</th>
                      <th className="table-th">Completion</th>
                      <th className="table-th text-right">Revenue</th>
                      <th className="table-th text-center">Rating</th>
                      <th className="table-th text-center">On-time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffRows.map((s) => (
                      <tr key={s.id} className="border-t border-slate-100">
                        <td className="table-td">
                          <PersonCell name={s.name} secondary={s.id} avatarTone={s.avatarTone} />
                        </td>
                        <td className="table-td">
                          <Badge tone="slate" size="sm">{s.role}</Badge>
                        </td>
                        <td className="table-td text-center tabular-nums">{s.assigned}</td>
                        <td className="table-td text-center font-semibold tabular-nums text-navy-900">{s.completed}</td>
                        <td className="table-td">
                          <div className="w-[110px]">
                            <Meter value={s.completion} tone={s.completion > 70 ? 'emerald' : s.completion > 45 ? 'amber' : 'rose'} showLabel />
                          </div>
                        </td>
                        <td className="table-td text-right font-semibold tabular-nums text-navy-900">{formatINR(s.revenue)}</td>
                        <td className="table-td text-center">
                          <span className="inline-flex items-center gap-0.5 text-amber-600">
                            <Star className="h-2.5 w-2.5 fill-amber-500" /> {s.rating}
                          </span>
                        </td>
                        <td className="table-td text-center">
                          <span className={cn('rounded px-1.5 py-0.5 text-[10.5px] font-semibold', s.onTime >= 92 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                            {s.onTime}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'payments' && (
            <>
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <ChartCard title="Collection by method" subtitle="Amounts collected in range">
                  <div className="flex flex-col items-center gap-2 sm:flex-row">
                    <div className="h-[200px] w-full max-w-[230px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentRows.filter((p) => p.collected > 0)}
                            dataKey="collected"
                            nameKey="method"
                            innerRadius={52}
                            outerRadius={80}
                            paddingAngle={2}
                            stroke="none"
                            isAnimationActive={false}
                          >
                            {paymentRows.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip hideLabel />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full flex-1 space-y-2 px-1">
                      {paymentRows.map((p, i) => {
                        const total = paymentRows.reduce((a, r) => a + r.collected, 0) || 1;
                        return (
                          <div key={p.method}>
                            <div className="flex items-center justify-between text-[11.5px]">
                              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                                <span className="h-2 w-2 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                {p.method}
                              </span>
                              <span className="tabular-nums text-navy-900">{formatINR(p.collected)}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${(p.collected / total) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}
                                />
                              </div>
                              <span className="w-8 text-right text-[10.5px] tabular-nums text-slate-400">
                                {((p.collected / total) * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </ChartCard>
                <SectionCard title="Payment report" description="Method-wise reconciliation">
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full">
                      <thead className="bg-slate-50/70">
                        <tr>
                          <th className="table-th">Method</th>
                          <th className="table-th text-center">Txns</th>
                          <th className="table-th text-right">Collected</th>
                          <th className="table-th text-right">Outstanding</th>
                          <th className="table-th text-right">Refunded</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentRows.map((p) => (
                          <tr key={p.method} className="border-t border-slate-100">
                            <td className="table-td font-medium text-navy-900">{p.method}</td>
                            <td className="table-td text-center tabular-nums">{p.count}</td>
                            <td className="table-td text-right font-semibold tabular-nums text-emerald-600">{formatINR(p.collected)}</td>
                            <td className="table-td text-right tabular-nums text-amber-600">{formatINR(p.pending)}</td>
                            <td className="table-td text-right tabular-nums text-rose-600">{formatINR(p.refunded)}</td>
                          </tr>
                        ))}
                        <tr className="border-t border-slate-200 bg-slate-50/60">
                          <td className="table-td font-semibold text-navy-900">Total</td>
                          <td className="table-td text-center font-semibold tabular-nums">{paymentRows.reduce((a, p) => a + p.count, 0)}</td>
                          <td className="table-td text-right font-semibold tabular-nums text-emerald-700">{formatINR(paymentRows.reduce((a, p) => a + p.collected, 0))}</td>
                          <td className="table-td text-right font-semibold tabular-nums text-amber-700">{formatINR(paymentRows.reduce((a, p) => a + p.pending, 0))}</td>
                          <td className="table-td text-right font-semibold tabular-nums text-rose-700">{formatINR(paymentRows.reduce((a, p) => a + p.refunded, 0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <div className="rounded-lg bg-emerald-50 px-3 py-2">
                      <p className="text-[10px] font-medium uppercase tracking-[0.05em] text-emerald-700">Collection rate</p>
                      <p className="text-[15px] font-semibold tabular-nums text-emerald-800">{kpis.collectionRate.toFixed(1)}%</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 px-3 py-2">
                      <p className="text-[10px] font-medium uppercase tracking-[0.05em] text-amber-700">Outstanding</p>
                      <p className="text-[15px] font-semibold tabular-nums text-amber-800">
                        {formatINR(paymentRows.reduce((a, p) => a + p.pending, 0))}
                      </p>
                    </div>
                    <div className="rounded-lg bg-rose-50 px-3 py-2">
                      <p className="text-[10px] font-medium uppercase tracking-[0.05em] text-rose-700">Refunded</p>
                      <p className="text-[15px] font-semibold tabular-nums text-rose-800">
                        {formatINR(paymentRows.reduce((a, p) => a + p.refunded, 0))}
                      </p>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Report library */}
      <SectionCard
        title="Report library"
        description="Every predefined AutoSutraa report — each one exports to CSV for the selected date range"
        action={
          <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={exportReport}>
            Export current tab
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {reportDefinitions.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                if (r.category === 'Revenue') setTab('revenue');
                else if (r.category === 'Bookings') setTab('bookings');
                else if (r.category === 'Customers') setTab('customers');
                else if (r.category === 'Staff') setTab('staff');
                else setTab('payments');
              }}
              className="group flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-left transition-all hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-card-hover"
            >
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200 group-hover:bg-brand-50 group-hover:text-brand-600">
                <FileSpreadsheet className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[12.5px] font-semibold text-navy-900">{r.title}</span>
                  <ArrowUpRight className="h-3 w-3 shrink-0 text-slate-300 group-hover:text-brand-500" />
                </span>
                <span className="mt-0.5 line-clamp-2 block text-[11px] leading-relaxed text-slate-500">{r.description}</span>
                <span className="mt-1 flex items-center gap-1.5">
                  <Badge tone="slate" size="sm">{r.category}</Badge>
                  <span className="text-[10px] text-slate-400">Updated {formatDate(r.updatedAt)}</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
