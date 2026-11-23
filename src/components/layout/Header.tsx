import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  PanelLeftClose,
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  LogOut,
  User,
  Settings as SettingsIcon,
  Shield,
  Command,
  CalendarCheck,
  Users,
  Car,
  ReceiptText,
  X,
  CircleCheck,
  LifeBuoy,
  BookOpen,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Breadcrumbs } from '@/components/ui/Layout';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useStore } from '@/context/StoreContext';
import { formatDate, formatTime, timeAgo } from '@/utils/date';
import { bookingStatusStyle } from '@/utils/statusStyles';
import { allNavItems } from '@/config/nav';

export function Header({
  onMenuClick,
  onToggleCollapse,
  collapsed,
}: {
  onMenuClick: () => void;
  onToggleCollapse: () => void;
  collapsed: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount, notifications, customers, bookings, vehicles, services, user, settings, dispatch } = useStore();
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggedOut, setLoggedOut] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K opens global search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const crumbs = useMemo(() => {
    const path = location.pathname;
    if (path === '/') return [{ label: 'Dashboard' }];
    const segments = path.split('/').filter(Boolean);
    const root = allNavItems.find((n) => n.to === `/${segments[0]}`);
    const items: { label: string; to?: string }[] = [{ label: 'Dashboard', to: '/' }];
    if (root) items.push({ label: root.label, to: root.to === path ? undefined : root.to });
    if (segments.length > 1) {
      items.push({ label: prettySegment(segments[1]) });
    }
    return items;
  }, [location.pathname]);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const out: { group: string; label: string; sub: string; to: string; icon: React.ReactNode }[] = [];
    bookings
      .filter((b) => b.id.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((b) => {
        const c = customers.find((x) => x.id === b.customerId);
        out.push({
          group: 'Bookings',
          label: b.id,
          sub: `${c?.name || ''} · ${b.status} · ${formatDate(b.date)}`,
          to: `/bookings/${b.id}`,
          icon: <CalendarCheck className="h-3.5 w-3.5" />,
        });
      });
    customers
      .filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((c) =>
        out.push({
          group: 'Customers',
          label: c.name,
          sub: `${c.phone} · ${c.city} · ${c.totalBookings} bookings`,
          to: `/customers/${c.id}`,
          icon: <Users className="h-3.5 w-3.5" />,
        })
      );
    vehicles
      .filter((v) => v.registration.toLowerCase().includes(q) || `${v.brand} ${v.model}`.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((v) =>
        out.push({
          group: 'Vehicles',
          label: v.registration,
          sub: `${v.brand} ${v.model} · ${v.color}`,
          to: `/vehicles/${v.id}`,
          icon: <Car className="h-3.5 w-3.5" />,
        })
      );
    services
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((s) =>
        out.push({
          group: 'Services',
          label: s.name,
          sub: `₹${s.price.toLocaleString('en-IN')} · ${s.duration} min`,
          to: '/services',
          icon: <ReceiptText className="h-3.5 w-3.5" />,
        })
      );
    return out;
  }, [search, bookings, customers, vehicles, services]);

  const unread = notifications.filter((n) => !n.read).slice(0, 5);

  if (loggedOut) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-navy-900 text-white">
            <Shield className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold text-navy-900">You have been signed out</h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
            This is a frontend prototype — no session is stored. Continue to return to the dashboard.
          </p>
          <Button
            variant="primary"
            className="mt-5 w-full"
            onClick={() => {
              setLoggedOut(false);
              navigate('/');
            }}
          >
            Return to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="flex h-[64px] items-center gap-2 px-3 sm:gap-3 sm:px-5">
          {/* Left: nav toggles + breadcrumbs */}
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden" aria-label="Open navigation">
            <Menu className="h-4.5 w-4.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="hidden lg:inline-flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PanelLeftClose className={cn('h-4.5 w-4.5 transition-transform', collapsed && 'rotate-180')} />
          </Button>

          <div className="hidden min-w-0 md:block">
            <Breadcrumbs items={crumbs} />
          </div>
          <div className="min-w-0 md:hidden">
            <p className="truncate text-[13.5px] font-semibold text-navy-900">
              {crumbs[crumbs.length - 1]?.label}
            </p>
          </div>

          <div className="flex-1" />

          {/* Global search */}
          <div className="relative hidden sm:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 140)}
                placeholder="Search bookings, customers, cars…"
                aria-label="Global search"
                className="h-9 w-[240px] rounded-lg border border-slate-200 bg-slate-50/80 pl-9 pr-14 text-[12.5px] text-slate-800 placeholder:text-slate-400 transition-all focus:w-[320px] focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-brand-100 xl:w-[300px]"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded border border-slate-200 bg-white px-1 py-0.5 text-[10px] font-medium text-slate-400">
                <Command className="h-2.5 w-2.5" />K
              </span>
            </div>

            {searchOpen && search.trim() && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-[380px] animate-scale-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-dropdown">
                <div className="max-h-[380px] overflow-y-auto p-1.5">
                  {results.length === 0 ? (
                    <p className="px-3 py-8 text-center text-[12.5px] text-slate-500">
                      No results for “{search}”
                    </p>
                  ) : (
                    results.map((r, i) => (
                      <button
                        key={`${r.to}-${i}`}
                        onMouseDown={() => {
                          navigate(r.to);
                          setSearch('');
                          setSearchOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-slate-50"
                      >
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500">
                          {r.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] font-medium text-navy-900">{r.label}</span>
                          <span className="block truncate text-[11px] text-slate-500">{r.sub}</span>
                        </span>
                        <span className="shrink-0 rounded bg-slate-50 px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wider text-slate-400">
                          {r.group}
                        </span>
                      </button>
                    ))
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-3 py-1.5 text-[10.5px] text-slate-400">
                  <span>Search across all modules</span>
                  <span>{results.length} results</span>
                </div>
              </div>
            )}
          </div>

          <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Search" onClick={() => navigate('/bookings')}>
            <Search className="h-4.5 w-4.5" />
          </Button>

          {/* Help */}
          <Button variant="ghost" size="icon" onClick={() => setHelpOpen(true)} aria-label="Help & support">
            <HelpCircle className="h-4.5 w-4.5" />
          </Button>

          {/* Notifications */}
          <Dropdown
            width="w-[368px]"
            align="right"
            header={
              <div className="flex items-center justify-between px-0.5">
                <div>
                  <p className="text-[12.5px] font-semibold text-navy-900">Notifications</p>
                  <p className="text-[11px] text-slate-500">{unreadCount} unread updates</p>
                </div>
                <button
                  onClick={() => dispatch({ type: 'MARK_ALL_NOTIFICATIONS' })}
                  className="rounded-md px-1.5 py-1 text-[11px] font-medium text-brand-600 transition-colors hover:bg-brand-50"
                >
                  Mark all read
                </button>
              </div>
            }
            footer={
              <Link
                to="/notifications"
                className="block rounded-md px-1 py-1 text-center text-[11.5px] font-medium text-brand-600 hover:underline"
              >
                Open notification centre
              </Link>
            }
            items={[
              ...(unread.length === 0
                ? [{ label: <span className="text-[12px] text-slate-500">You’re all caught up.</span>, disabled: true }]
                : unread.map((n) => ({
                    label: (
                      <span className="block min-w-0 py-0.5">
                        <span className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                          <span className="min-w-0">
                            <span className="block truncate text-[12.5px] font-medium text-navy-900">{n.title}</span>
                            <span className="mt-0.5 line-clamp-2 block text-[11.5px] leading-relaxed text-slate-500">
                              {n.message}
                            </span>
                            <span className="mt-1 block text-[10.5px] text-slate-400">{timeAgo(n.at)}</span>
                          </span>
                        </span>
                      </span>
                    ),
                    onClick: () => {
                      dispatch({ type: 'MARK_NOTIFICATION', payload: { id: n.id, read: true } });
                      navigate('/notifications');
                    },
                  }))),
            ]}
            trigger={({ toggle }) => (
              <button
                onClick={toggle}
                aria-label={`Notifications (${unreadCount} unread)`}
                className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy-900"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 grid min-w-[15px] place-items-center rounded-full bg-rose-500 px-1 text-[9.5px] font-bold leading-[15px] text-white ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}
          />

          <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

          {/* Profile */}
          <Dropdown
            width="w-64"
            align="right"
            header={
              <div className="flex items-center gap-2.5 px-0.5 py-1">
                <Avatar name={user.name} tone="navy" size="md" />
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-semibold text-navy-900">{user.name}</p>
                  <p className="truncate text-[11px] text-slate-500">{user.role}</p>
                </div>
              </div>
            }
            items={[
              { label: 'My profile', icon: <User className="h-3.5 w-3.5" />, onClick: () => navigate('/settings?tab=profile') },
              {
                label: 'Business settings',
                icon: <SettingsIcon className="h-3.5 w-3.5" />,
                onClick: () => navigate('/settings'),
              },
              { label: 'Roles & permissions', icon: <Shield className="h-3.5 w-3.5" />, onClick: () => navigate('/staff') },
              { separator: true },
              {
                label: 'Sign out',
                icon: <LogOut className="h-3.5 w-3.5" />,
                danger: true,
                onClick: () => setLogoutOpen(true),
              },
            ]}
            trigger={({ toggle, open }) => (
              <button
                onClick={toggle}
                className={cn(
                  'flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 transition-colors hover:bg-slate-100',
                  open && 'bg-slate-100'
                )}
              >
                <Avatar name={user.name} tone="navy" size="sm" />
                <span className="hidden min-w-0 text-left sm:block">
                  <span className="block truncate text-[12.5px] font-medium leading-tight text-navy-900">
                    {user.name}
                  </span>
                  <span className="block truncate text-[10.5px] leading-tight text-slate-500">{user.role}</span>
                </span>
                <ChevronDown className="hidden h-3.5 w-3.5 shrink-0 text-slate-400 sm:block" />
              </button>
            )}
          />
        </div>
      </header>

      {/* Help modal */}
      <Modal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Help & resources"
        description="Everything you need to run the AutoSutraa front desk."
        size="md"
        footer={
          <Button variant="primary" onClick={() => setHelpOpen(false)}>
            Got it
          </Button>
        }
      >
        <div className="space-y-2.5">
          {[
            { icon: <BookOpen className="h-4 w-4" />, title: 'Booking lifecycle guide', desc: 'New → Confirmed → Vehicle Received → In Progress → Quality Check → Ready → Completed.' },
            { icon: <LifeBuoy className="h-4 w-4" />, title: 'Support centre', desc: 'Reach RashTech Info support at support@rashtechinfo.com · +91 98290 00000.' },
            { icon: <MessageSquare className="h-4 w-4" />, title: 'Keyboard shortcuts', desc: '⌘K / Ctrl+K focuses global search. Esc closes any dialog.' },
            { icon: <CircleCheck className="h-4 w-4" />, title: 'Data & privacy', desc: `Signed in as ${user.name} (${user.role}) at ${settings.name}.` },
          ].map((h) => (
            <div key={h.title} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-brand-600 ring-1 ring-slate-200">
                {h.icon}
              </span>
              <div>
                <p className="text-[12.5px] font-semibold text-navy-900">{h.title}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{h.desc}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-xl bg-navy-900 px-3.5 py-3 text-white">
            <div>
              <p className="text-[12px] font-semibold">Prototype build v1.0</p>
              <p className="text-[11px] text-slate-400">Frontend only · local data · {formatDate(new Date().toISOString())}</p>
            </div>
            <Badge tone="green" dot size="sm" className="bg-emerald-400/15 text-emerald-300 ring-emerald-400/25">
              Live
            </Badge>
          </div>
        </div>
      </Modal>

      {/* Logout confirm */}
      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Sign out of AutoSutraa CRM?"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>
              Stay signed in
            </Button>
            <Button
              variant="danger"
              leftIcon={<LogOut className="h-3.5 w-3.5" />}
              onClick={() => {
                setLogoutOpen(false);
                setLoggedOut(true);
              }}
            >
              Sign out
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-slate-600">
          Your local prototype data stays saved in this browser. You can sign back in at any time — this action is UI-only
          and does not affect any backend session.
        </p>
      </Modal>
    </>
  );
}

function prettySegment(seg: string) {
  if (/^[A-Z]{3}-\d+$/.test(seg)) return seg;
  return seg
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
