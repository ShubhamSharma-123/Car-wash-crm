import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  Sparkles,
  Car,
  CircleCheck,
  Wallet,
  ReceiptText,
  Megaphone,
  Filter,
  Search,
  Inbox,
  ExternalLink,
} from 'lucide-react';
import { PageHeader, SectionCard, SegmentedControl, Tabs } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { SearchBar, EmptyState } from '@/components/ui/SearchBar';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useStore } from '@/context/StoreContext';
import { notificationTypeStyle } from '@/utils/statusStyles';
import { timeAgo, formatDateTime, isToday } from '@/utils/date';
import { notificationTypeOptions } from '@/data/notifications';
import { cn } from '@/utils/cn';
import type { AppNotification, NotificationType } from '@/types';

const typeIcon: Record<NotificationType, React.ReactNode> = {
  'Booking Confirmation': <CalendarCheck className="h-3.5 w-3.5" />,
  'Booking Reminder': <BellRing className="h-3.5 w-3.5" />,
  'Booking Rescheduled': <CalendarClock className="h-3.5 w-3.5" />,
  'Booking Cancellation': <CalendarX className="h-3.5 w-3.5" />,
  'Service Started': <Sparkles className="h-3.5 w-3.5" />,
  'Vehicle Ready': <Car className="h-3.5 w-3.5" />,
  'Service Completed': <CircleCheck className="h-3.5 w-3.5" />,
  'Payment Confirmation': <Wallet className="h-3.5 w-3.5" />,
  'Invoice Generated': <ReceiptText className="h-3.5 w-3.5" />,
  Promotional: <Megaphone className="h-3.5 w-3.5" />,
};

const toneBg: Record<string, string> = {
  blue: 'bg-brand-50 text-brand-600 ring-brand-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  red: 'bg-rose-50 text-rose-500 ring-rose-100',
  sky: 'bg-sky-50 text-sky-600 ring-sky-100',
  teal: 'bg-teal-50 text-teal-600 ring-teal-100',
  green: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  violet: 'bg-violet-50 text-violet-600 ring-violet-100',
  slate: 'bg-slate-100 text-slate-500 ring-slate-200',
};

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, dispatch } = useStore();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [type, setType] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [clearOpen, setClearOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.length - unreadCount;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notifications
      .filter((n) => {
        if (filter === 'unread' && n.read) return false;
        if (filter === 'read' && !n.read) return false;
        if (type !== 'all' && n.type !== type) return false;
        if (q && !`${n.title} ${n.message}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [notifications, filter, type, query]);

  const grouped = useMemo(() => {
    const today: AppNotification[] = [];
    const earlier: AppNotification[] = [];
    filtered.forEach((n) => (isToday(n.at) ? today : earlier).push(n));
    return { today, earlier };
  }, [filtered]);

  const typeCounts = useMemo(() => {
    const map = new Map<string, number>();
    notifications.forEach((n) => map.set(n.type, (map.get(n.type) || 0) + 1));
    return map;
  }, [notifications]);

  const renderItem = (n: AppNotification) => {
    const style = notificationTypeStyle[n.type];
    return (
      <div
        key={n.id}
        className={cn(
          'group relative flex gap-3 border-b border-slate-100 px-4 py-3.5 transition-colors last:border-0 hover:bg-slate-50/70',
          !n.read && 'bg-brand-50/25'
        )}
      >
        <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1 ring-inset', toneBg[style.tone])}>
          {typeIcon[n.type]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <div className="flex min-w-0 items-center gap-1.5">
              {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
              <p className={cn('truncate text-[12.5px]', n.read ? 'font-medium text-slate-700' : 'font-semibold text-navy-900')}>
                {n.title}
              </p>
            </div>
            <span className="shrink-0 text-[10.5px] text-slate-400" title={formatDateTime(n.at)}>
              {timeAgo(n.at)}
            </span>
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{n.message}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={style.tone} size="sm">{n.type}</Badge>
            {n.bookingId && (
              <button
                onClick={() => navigate(`/bookings/${n.bookingId}`)}
                className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10.5px] font-medium text-brand-600 hover:bg-brand-50"
              >
                {n.bookingId} <ExternalLink className="h-2.5 w-2.5" />
              </button>
            )}
            {n.customerId && (
              <button
                onClick={() => navigate(`/customers/${n.customerId}`)}
                className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10.5px] font-medium text-slate-500 hover:bg-slate-100"
              >
                View customer
              </button>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button
            onClick={() => dispatch({ type: 'MARK_NOTIFICATION', payload: { id: n.id, read: !n.read } })}
            aria-label={n.read ? 'Mark as unread' : 'Mark as read'}
            title={n.read ? 'Mark as unread' : 'Mark as read'}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-emerald-600"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => dispatch({ type: 'DELETE_NOTIFICATION', payload: n.id })}
            aria-label="Delete notification"
            title="Delete"
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Notification centre"
        description="Booking, payment and service alerts generated across the CRM and pushed to the customer mobile app."
        meta={
          <>
            <Badge tone="blue" dot>{unreadCount} unread</Badge>
            <Badge tone="slate">{readCount} read</Badge>
            <Badge tone="green">FCM push enabled</Badge>
          </>
        }
        actions={
          <>
            <Button
              variant="outline"
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={() => setClearOpen(true)}
              disabled={notifications.length === 0}
            >
              <span className="hidden sm:inline">Clear all</span>
              <span className="sm:hidden">Clear</span>
            </Button>
            <Button
              variant="primary"
              leftIcon={<CheckCheck className="h-3.5 w-3.5" />}
              onClick={() => dispatch({ type: 'MARK_ALL_NOTIFICATIONS' })}
              disabled={unreadCount === 0}
            >
              Mark all read
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_290px]">
        <div className="card overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <SegmentedControl
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: `All (${notifications.length})` },
                { value: 'unread', label: `Unread (${unreadCount})` },
                { value: 'read', label: `Read (${readCount})` },
              ]}
            />
            <SearchBar value={query} onChange={setQuery} placeholder="Search notifications…" size="sm" className="w-full sm:w-56" />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="Nothing here"
              description={query ? `No notifications match “${query}”.` : 'You are all caught up — new alerts will appear here.'}
              icon={<Inbox className="h-5 w-5" />}
              action={
                query || filter !== 'all' || type !== 'all' ? (
                  <Button variant="outline" onClick={() => { setQuery(''); setFilter('all'); setType('all'); }}>
                    Reset filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div>
              {grouped.today.length > 0 && (
                <>
                  <div className="flex items-center gap-2 bg-slate-50/70 px-4 py-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Today</p>
                    <span className="text-[10px] text-slate-400">· {grouped.today.length}</span>
                  </div>
                  {grouped.today.map(renderItem)}
                </>
              )}
              {grouped.earlier.length > 0 && (
                <>
                  <div className="flex items-center gap-2 bg-slate-50/70 px-4 py-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Earlier</p>
                    <span className="text-[10px] text-slate-400">· {grouped.earlier.length}</span>
                  </div>
                  {grouped.earlier.map(renderItem)}
                </>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <SectionCard title="Filter by type" description="10 notification categories" icon={<Filter className="h-4 w-4" />}>
            <div className="space-y-0.5">
              <button
                onClick={() => setType('all')}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[12px] transition-colors',
                  type === 'all' ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <span>All types</span>
                <span className={cn('tabular-nums', type === 'all' ? 'text-slate-300' : 'text-slate-400')}>{notifications.length}</span>
              </button>
              {notificationTypeOptions.map((t) => {
                const style = notificationTypeStyle[t];
                const count = typeCounts.get(t) || 0;
                return (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors',
                      type === t ? 'bg-slate-100' : 'hover:bg-slate-50'
                    )}
                  >
                    <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded ring-1 ring-inset', toneBg[style.tone])}>
                      {React.cloneElement(typeIcon[t] as React.ReactElement, { className: 'h-2.5 w-2.5' })}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[11.5px] text-slate-600">{t}</span>
                    <span className="shrink-0 text-[10.5px] tabular-nums text-slate-400">{count}</span>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Delivery channels" description="Where alerts are sent">
            <div className="space-y-2.5">
              {[
                { label: 'Customer mobile app', detail: 'Firebase Cloud Messaging', on: true },
                { label: 'WhatsApp updates', detail: 'Booking + payment receipts', on: true },
                { label: 'Email receipts', detail: 'Invoices & monthly summary', on: true },
                { label: 'SMS fallback', detail: 'Only for critical alerts', on: false },
              ].map((c) => (
                <div key={c.label} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-slate-700">{c.label}</p>
                    <p className="truncate text-[10.5px] text-slate-400">{c.detail}</p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-1.5 py-[1px] text-[10px] font-semibold ring-1 ring-inset',
                      c.on ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-slate-200'
                    )}
                  >
                    {c.on ? 'On' : 'Off'}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-3 w-full" leftIcon={<Bell className="h-3.5 w-3.5" />} onClick={() => navigate('/settings?tab=notifications')}>
              Notification preferences
            </Button>
          </SectionCard>

          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-navy-900 to-navy-800 p-3.5 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-300">Automation</p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-300">
              Status changes in the CRM automatically notify the customer app. Reminder alerts go out 24 hours and 2 hours
              before each appointment.
            </p>
            <Button variant="soft" size="sm" className="mt-2.5 w-full bg-white/10 text-white hover:bg-white/20" onClick={() => navigate('/settings')}>
              Configure rules
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={() => notifications.forEach((n) => dispatch({ type: 'DELETE_NOTIFICATION', payload: n.id }))}
        title="Clear all notifications?"
        message="This removes every notification from the centre. New booking, payment and service alerts will keep arriving."
        confirmLabel="Clear all"
      />
    </div>
  );
}
