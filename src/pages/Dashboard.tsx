import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarPlus,
  CalendarClock,
  CircleCheck,
  CircleSlash,
  Clock,
  IndianRupee,
  TrendingUp,
  UserPlus,
  Car,
  Sparkles,
  ArrowRight,
  Activity,
  Users,
  Wallet,
  CalendarDays,
  ChevronRight,
  Download,
  RefreshCw,
  MapPin,
  Sun,
} from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/ui/Layout';
import { StatCard, Meter } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { BookingChart } from '@/components/dashboard/BookingChart';
import { ServiceChart, TopServicesList } from '@/components/dashboard/ServiceChart';
import { CustomerChart, StaffPerformanceBars } from '@/components/dashboard/CustomerChart';
import { RecentBookings, TodaySchedule } from '@/components/dashboard/RecentBookings';
import { useStore } from '@/context/StoreContext';
import { formatDate, formatTime, formatDayShort, isToday, isFuture, TODAY_ISO, timeAgo, formatDateNumeric } from '@/utils/date';
import { formatINR, formatNumber } from '@/utils/format';
import { staffPerformance, dailyRevenue } from '@/data/dashboardData';
import { pctChange, downloadCSV } from '@/utils/ui';
import { cn } from '@/utils/cn';
import { bookingStatusStyle } from '@/utils/statusStyles';
import type { Booking } from '@/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { bookings, customers, vehicles, payments, services, staff, user, dispatch, notifications } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  const stats = useMemo(() => {
    const todayBookings = bookings.filter((b) => isToday(b.date));
    const upcoming = bookings.filter(
      (b) => isFuture(b.date) && !['Cancelled', 'No Show', 'Completed'].includes(b.status)
    );
    const completed = bookings.filter((b) => b.status === 'Completed');
    const pending = bookings.filter((b) => ['New', 'Confirmed'].includes(b.status));
    const cancelled = bookings.filter((b) => b.status === 'Cancelled');
    const todayRevenue = bookings.filter((b) => isToday(b.date)).reduce((a, b) => a + b.paidAmount, 0);

    // last 30d vs previous 30d
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 864e5).toISOString().slice(0, 10);
    const d60 = new Date(now.getTime() - 60 * 864e5).toISOString().slice(0, 10);
    const last30 = bookings.filter((b) => b.date >= d30);
    const prev30 = bookings.filter((b) => b.date >= d60 && b.date < d30);
    const monthRevenue = last30.reduce((a, b) => a + b.paidAmount, 0);
    const prevMonthRevenue = prev30.reduce((a, b) => a + b.paidAmount, 0);

    const newCustomers = customers.filter((c) => c.joinedAt >= d30).length;
    const activeVehicles = new Set(
      bookings.filter((b) => b.date >= d30).map((b) => b.vehicleId)
    ).size;

    const serviceCount = new Map<string, number>();
    bookings.forEach((b) => b.serviceIds.forEach((id) => serviceCount.set(id, (serviceCount.get(id) || 0) + 1)));
    const topServiceId = [...serviceCount.entries()].sort((a, b) => b[1] - a[1])[0];
    const topService = services.find((s) => s.id === topServiceId?.[0]);

    const todayPrev = bookings.filter((b) => b.date === new Date(now.getTime() - 864e5).toISOString().slice(0, 10));

    return {
      todayBookings: todayBookings.length,
      todayBookingsChange: pctChange(todayBookings.length, todayPrev.length),
      upcoming: upcoming.length,
      completed: completed.length,
      completed30: last30.filter((b) => b.status === 'Completed').length,
      completedPrev30: prev30.filter((b) => b.status === 'Completed').length,
      pending: pending.length,
      pendingPrev: prev30.filter((b) => ['New', 'Confirmed'].includes(b.status)).length,
      cancelled: cancelled.length,
      cancelled30: last30.filter((b) => b.status === 'Cancelled').length,
      cancelledPrev30: prev30.filter((b) => b.status === 'Cancelled').length,
      todayRevenue,
      todayRevenueChange: pctChange(
        todayRevenue,
        todayPrev.reduce((a, b) => a + b.paidAmount, 0)
      ),
      monthRevenue,
      monthRevenueChange: pctChange(monthRevenue, prevMonthRevenue),
      newCustomers,
      newCustomersPrev: customers.filter((c) => c.joinedAt >= d60 && c.joinedAt < d30).length,
      activeVehicles,
      topService,
      topServiceCount: topServiceId?.[1] || 0,
      last30,
      prev30,
    };
  }, [bookings, customers, services]);

  const revenueSpark = dailyRevenue.slice(-12).map((d) => d.revenue);
  const bookingSpark = dailyRevenue.slice(-12).map((d) => d.bookings);

  const metrics = [
    {
      label: "Today's bookings",
      value: formatNumber(stats.todayBookings),
      icon: <CalendarPlus className="h-4 w-4" />,
      tone: 'brand' as const,
      change: stats.todayBookingsChange,
      comparison: 'vs yesterday',
      onClick: () => navigate('/bookings?range=today'),
      spark: bookingSpark,
    },
    {
      label: 'Upcoming bookings',
      value: formatNumber(stats.upcoming),
      icon: <CalendarClock className="h-4 w-4" />,
      tone: 'indigo' as const,
      change: 8.2,
      comparison: 'vs last week',
      onClick: () => navigate('/bookings?status=upcoming'),
    },
    {
      label: 'Completed services',
      value: formatNumber(stats.completed),
      icon: <CircleCheck className="h-4 w-4" />,
      tone: 'emerald' as const,
      change: pctChange(stats.completed30, stats.completedPrev30),
      comparison: 'last 30 days',
      onClick: () => navigate('/bookings?status=Completed'),
    },
    {
      label: 'Pending bookings',
      value: formatNumber(stats.pending),
      icon: <Clock className="h-4 w-4" />,
      tone: 'amber' as const,
      change: pctChange(stats.pending, stats.pendingPrev),
      comparison: 'awaiting action',
      invertChange: true,
      onClick: () => navigate('/bookings?status=New'),
    },
    {
      label: 'Cancelled bookings',
      value: formatNumber(stats.cancelled),
      icon: <CircleSlash className="h-4 w-4" />,
      tone: 'rose' as const,
      change: pctChange(stats.cancelled30, stats.cancelledPrev30),
      comparison: 'last 30 days',
      invertChange: true,
      onClick: () => navigate('/bookings?status=Cancelled'),
    },
    {
      label: "Today's revenue",
      value: formatINR(stats.todayRevenue),
      icon: <IndianRupee className="h-4 w-4" />,
      tone: 'emerald' as const,
      change: stats.todayRevenueChange,
      comparison: 'vs yesterday',
      onClick: () => navigate('/payments'),
      spark: revenueSpark,
    },
    {
      label: 'Monthly revenue',
      value: formatINR(stats.monthRevenue),
      icon: <TrendingUp className="h-4 w-4" />,
      tone: 'navy' as const,
      change: stats.monthRevenueChange,
      comparison: 'vs previous 30d',
      onClick: () => navigate('/reports'),
      spark: revenueSpark,
    },
    {
      label: 'New customers',
      value: formatNumber(stats.newCustomers),
      icon: <UserPlus className="h-4 w-4" />,
      tone: 'violet' as const,
      change: pctChange(stats.newCustomers, stats.newCustomersPrev),
      comparison: 'last 30 days',
      onClick: () => navigate('/customers'),
    },
    {
      label: 'Active vehicles',
      value: formatNumber(stats.activeVehicles),
      icon: <Car className="h-4 w-4" />,
      tone: 'teal' as const,
      change: 4.6,
      comparison: 'serviced in 30 days',
      onClick: () => navigate('/vehicles'),
    },
    {
      label: 'Popular services',
      value: stats.topService?.name.replace('Basic Car Wash', 'Basic Wash') || '—',
      icon: <Sparkles className="h-4 w-4" />,
      tone: 'sky' as const,
      footnote: `${stats.topServiceCount} bookings · ${formatINR(stats.topService?.price || 0)}`,
      onClick: () => navigate('/services'),
    },
  ];

  const statusCounts = useMemo(() => {
    const map = new Map<string, number>();
    bookings.forEach((b) => map.set(b.status, (map.get(b.status) || 0) + 1));
    return map;
  }, [bookings]);

  const unpaid = payments.filter((p) => p.status === 'Pending' || p.status === 'Partial');
  const outstanding = unpaid.reduce((a, p) => a + (p.totalAmount - p.paidAmount), 0);

  const recentActivities = useMemo(
    () =>
      bookings
        .slice()
        .sort((a, b) => (b.timeline.at(-1)?.at || b.createdAt).localeCompare(a.timeline.at(-1)?.at || a.createdAt))
        .slice(0, 7),
    [bookings]
  );

  const upcomingList = useMemo(
    () =>
      bookings
        .filter((b) => isFuture(b.date) && !['Cancelled', 'No Show'].includes(b.status))
        .sort((a, b) => (a.date + a.timeSlot).localeCompare(b.date + b.timeSlot))
        .slice(0, 5),
    [bookings]
  );

  const exportSnapshot = () => {
    downloadCSV('autosutraa-dashboard-snapshot', [
      ['Metric', 'Value', 'Change vs previous'],
      ...metrics.map((m) => [m.label, String(m.value).replace(/₹/g, 'INR '), m.change !== undefined ? `${m.change.toFixed(1)}%` : '—']),
      [],
      ['Status', 'Bookings'],
      ...[...statusCounts.entries()],
    ]);
  };

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  };

  return (
    <div>
      <PageHeader
        title={`Good morning, ${user.name.split(' ')[0]}`}
        description={`Here's what's happening at ${useStore().settings.name} today — ${formatDayShort(TODAY_ISO)}.`}
        meta={
          <>
            <Badge tone="green" dot>
              Bay status: 3 active
            </Badge>
            <span className="text-[11.5px] text-slate-400">
              Last synced {formatTime(new Date(Date.now() - 4 * 60000).toISOString())}
            </span>
          </>
        }
        actions={
          <>
            <Button variant="outline" size="md" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={exportSnapshot}>
              <span className="hidden sm:inline">Export snapshot</span>
              <span className="sm:hidden">Export</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={refresh}
              aria-label="Refresh dashboard"
              className="shrink-0"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<CalendarPlus className="h-3.5 w-3.5" />}
              onClick={() => navigate('/bookings?new=1')}
            >
              New booking
            </Button>
          </>
        }
      />

      {/* KPI grid */}
      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 xl:grid-cols-5">
        {metrics.map((m) => (
          <StatCard key={m.label} {...m} />
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <RevenueChart className="xl:col-span-2" />
        <ServiceChart />
      </div>

      {/* Charts row 2 */}
      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <BookingChart />
        <CustomerChart />
        <SectionCard
          title="Staff performance"
          description="Completed jobs this month"
          action={
            <button
              onClick={() => navigate('/staff')}
              className="inline-flex items-center gap-0.5 text-[11.5px] font-medium text-brand-600 hover:underline"
            >
              Details <ChevronRight className="h-3 w-3" />
            </button>
          }
          className="lg:col-span-2 xl:col-span-1"
        >
          <StaffPerformanceBars rows={staffPerformance} />
          <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
            <span className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              {staff.filter((s) => s.status === 'Active').length} active staff
            </span>
            <span className="text-[11.5px] font-medium text-emerald-600">
              {Math.round(staffPerformance.reduce((a, s) => a + s.onTime, 0) / staffPerformance.length)}% on-time
            </span>
          </div>
        </SectionCard>
      </div>

      {/* Booking pipeline strip */}
      <SectionCard
        title="Live booking pipeline"
        description="Current distribution across the service lifecycle"
        className="mb-4"
        action={
          <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3 w-3" />} onClick={() => navigate('/bookings')}>
            Manage bookings
          </Button>
        }
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
          {[
            'New',
            'Confirmed',
            'Vehicle Received',
            'In Progress',
            'Quality Check',
            'Ready',
            'Completed',
            'Cancelled',
          ].map((status) => {
            const count = statusCounts.get(status) || 0;
            const total = bookings.length || 1;
            const style = bookingStatusStyle[status as keyof typeof bookingStatusStyle];
            return (
              <button
                key={status}
                onClick={() => navigate(`/bookings?status=${encodeURIComponent(status)}`)}
                className="group rounded-xl border border-slate-200/80 bg-white p-3 text-left transition-all hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-card-hover"
              >
                <div className="flex items-center gap-1.5">
                  <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
                  <span className="truncate text-[10.5px] font-medium uppercase tracking-[0.03em] text-slate-500">
                    {status}
                  </span>
                </div>
                <p className="mt-1.5 text-[18px] font-semibold leading-none tabular-nums text-navy-900">{count}</p>
                <Meter value={(count / total) * 100} tone="brand" className="mt-2" />
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Recent bookings */}
      <div className="mb-4">
        <RecentBookings />
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <SectionCard
          title="Today's schedule"
          description={`${bookings.filter((b) => isToday(b.date) && !['Cancelled', 'No Show'].includes(b.status)).length} appointments`}
          action={
            <Badge tone="blue" size="sm">
              <CalendarDays className="h-3 w-3" /> {formatDateNumeric(TODAY_ISO)}
            </Badge>
          }
        >
          <TodaySchedule limit={6} />
        </SectionCard>

        <SectionCard
          title="Upcoming appointments"
          description="Next confirmed slots"
          action={
            <button
              onClick={() => navigate('/bookings')}
              className="text-[11.5px] font-medium text-brand-600 hover:underline"
            >
              View all
            </button>
          }
        >
          <div className="space-y-2">
            {upcomingList.length === 0 && (
              <p className="py-6 text-center text-[12.5px] text-slate-500">No upcoming appointments.</p>
            )}
            {upcomingList.map((b) => (
              <BookingMiniRow key={b.id} booking={b} onClick={() => navigate(`/bookings/${b.id}`)} />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent activity"
          description="Live feed across the CRM"
          action={
            <span className="flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-wider text-emerald-600">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          }
        >
          <div className="space-y-3">
            {recentActivities.map((b, i) => {
              const c = useStore().customerById(b.customerId);
              const v = useStore().vehicleById(b.vehicleId);
              const last = b.timeline.at(-1);
              return (
                <button
                  key={b.id}
                  onClick={() => navigate(`/bookings/${b.id}`)}
                  className="flex w-full items-start gap-2.5 text-left"
                >
                  <span
                    className={cn(
                      'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full',
                      b.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-600'
                        : b.status === 'Cancelled'
                          ? 'bg-rose-50 text-rose-500'
                          : 'bg-brand-50 text-brand-600'
                    )}
                  >
                    <Activity className="h-3 w-3" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium text-navy-900">
                      {b.id} · {b.status}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">
                      {c?.name} · {v?.registration}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10.5px] text-slate-400">{timeAgo(last?.at || b.createdAt)}</span>
                </button>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* Final row: top services + collections + notifications digest */}
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <SectionCard
          title="Top performing services"
          description="By revenue contribution"
          action={
            <button onClick={() => navigate('/services')} className="text-[11.5px] font-medium text-brand-600 hover:underline">
              Catalogue
            </button>
          }
        >
          <TopServicesList />
        </SectionCard>

        <SectionCard title="Collections snapshot" description="Payment health at a glance">
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-br from-navy-900 to-navy-800 p-3.5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-slate-400">
                    Outstanding balance
                  </p>
                  <p className="mt-1 text-[21px] font-semibold leading-none tabular-nums">{formatINR(outstanding)}</p>
                </div>
                <Wallet className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{unpaid.length} open transactions</span>
                <button
                  onClick={() => navigate('/payments')}
                  className="inline-flex items-center gap-0.5 font-medium text-brand-300 hover:text-brand-200"
                >
                  Collect <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
            {[
              { label: 'Paid', value: payments.filter((p) => p.status === 'Paid').length, tone: 'emerald' as const },
              { label: 'Partial', value: payments.filter((p) => p.status === 'Partial').length, tone: 'brand' as const },
              { label: 'Pending', value: payments.filter((p) => p.status === 'Pending').length, tone: 'amber' as const },
              { label: 'Refunded', value: payments.filter((p) => p.status === 'Refunded').length, tone: 'rose' as const },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-2.5">
                <span className="w-16 shrink-0 text-[11.5px] text-slate-500">{row.label}</span>
                <Meter value={(row.value / (payments.length || 1)) * 100} tone={row.tone} />
                <span className="w-7 shrink-0 text-right text-[11.5px] font-semibold tabular-nums text-navy-900">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Latest notifications"
          description={`${notifications.filter((n) => !n.read).length} unread`}
          action={
            <button
              onClick={() => navigate('/notifications')}
              className="text-[11.5px] font-medium text-brand-600 hover:underline"
            >
              Open centre
            </button>
          }
        >
          <div className="space-y-2.5">
            {notifications.slice(0, 4).map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  dispatch({ type: 'MARK_NOTIFICATION', payload: { id: n.id, read: true } });
                  navigate('/notifications');
                }}
                className="flex w-full items-start gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-slate-50"
              >
                <span
                  className={cn(
                    'mt-1 h-1.5 w-1.5 shrink-0 rounded-full',
                    n.read ? 'bg-slate-300' : 'bg-brand-500 ring-2 ring-brand-100'
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate text-[12px]', n.read ? 'text-slate-600' : 'font-semibold text-navy-900')}>
                    {n.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-500">{n.message}</span>
                </span>
                <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(n.at)}</span>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function BookingMiniRow({ booking, onClick }: { booking: Booking; onClick: () => void }) {
  const { customerById, vehicleById, serviceById, staffById } = useStore();
  const c = customerById(booking.customerId);
  const v = vehicleById(booking.vehicleId);
  const s = serviceById(booking.serviceIds[0]);
  const staff = staffById(booking.assignedStaffId);
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg border border-slate-200/70 bg-white p-2.5 text-left transition-all hover:border-slate-300 hover:bg-slate-50/60"
    >
      <Avatar name={c?.name || '—'} tone="indigo" size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-medium text-navy-900">{c?.name}</p>
        <p className="truncate text-[11px] text-slate-500">
          {s?.name} · {v?.registration}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[11px] font-medium text-slate-700">{formatDayShort(booking.date).replace(/,.*/, '')}</p>
        <p className="text-[10.5px] text-slate-400">{booking.timeSlot}</p>
      </div>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
    </button>
  );
}
