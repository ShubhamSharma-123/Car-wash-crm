import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, X, LifeBuoy, ArrowUpRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { navGroups } from '@/config/nav';
import { Logo } from '@/components/ui/Logo';
import { useStore } from '@/context/StoreContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const { unreadCount, bookings, payments, settings } = useStore();

  const pendingPayments = payments.filter((p) => p.status === 'Pending' || p.status === 'Partial').length;
  const activeBookings = bookings.filter(
    (b) => !['Completed', 'Cancelled', 'No Show'].includes(b.status)
  ).length;

  const badgeValue = (key?: 'notifications' | 'bookings' | 'pendingPayments') => {
    if (key === 'notifications') return unreadCount;
    if (key === 'bookings') return activeBookings;
    if (key === 'pendingPayments') return pendingPayments;
    return 0;
  };

  const content = (isMobile: boolean) => (
    <div className="flex h-full flex-col bg-navy-950">
      {/* Brand */}
      <div
        className={cn(
          'flex h-[64px] shrink-0 items-center border-b border-white/[0.07]',
          collapsed && !isMobile ? 'justify-center px-0' : 'justify-between px-4'
        )}
      >
        <NavLink to="/" onClick={isMobile ? onMobileClose : undefined} className="focus-ring rounded-lg">
          <Logo collapsed={collapsed && !isMobile} />
        </NavLink>
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-1">
            <div
              className={cn(
                'px-2 pb-1.5 pt-2 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-slate-500/80',
                collapsed && !isMobile && 'sr-only'
              )}
            >
              {group.title}
            </div>
            {collapsed && !isMobile && <div className="mx-1 mb-1.5 mt-1 border-t border-white/[0.06] first:hidden" />}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.to === '/'
                    ? location.pathname === '/'
                    : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                const badge = badgeValue(item.badgeKey);
                const Icon = item.icon;
                return (
                  <li key={item.to} className="group/item relative">
                    <NavLink
                      to={item.to}
                      onClick={isMobile ? onMobileClose : undefined}
                      className={cn(
                        'group relative flex items-center rounded-lg text-[13px] font-medium transition-all duration-150',
                        collapsed && !isMobile ? 'h-9 justify-center px-0' : 'h-9 gap-2.5 px-2.5',
                        active
                          ? 'bg-white/[0.10] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                          : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-100'
                      )}
                      aria-current={active ? 'page' : undefined}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-4 w-[2.5px] -translate-y-1/2 rounded-r bg-brand-400" />
                      )}
                      <Icon
                        className={cn(
                          'h-[17px] w-[17px] shrink-0 transition-colors',
                          active ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'
                        )}
                        strokeWidth={active ? 2.2 : 1.9}
                      />
                      {(!collapsed || isMobile) && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                      {(!collapsed || isMobile) && badge > 0 && (
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-1.5 py-[1px] text-[10px] font-semibold tabular-nums',
                            item.badgeKey === 'notifications'
                              ? 'bg-brand-500 text-white'
                              : 'bg-white/[0.10] text-slate-300'
                          )}
                        >
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                      {(collapsed || !isMobile) && false}
                    </NavLink>

                    {/* Tooltip in collapsed mode */}
                    {collapsed && !isMobile && (
                      <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-navy-900/95 px-2.5 py-1.5 text-[12px] font-medium text-white opacity-0 shadow-dropdown backdrop-blur transition-opacity duration-150 group-hover/item:opacity-100">
                        <span className="flex items-center gap-2">
                          {item.label}
                          {badge > 0 && (
                            <span className="rounded-full bg-brand-500 px-1.5 text-[10px] font-semibold text-white">
                              {badge}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer card */}
      <div className={cn('shrink-0 border-t border-white/[0.07] p-2.5', collapsed && !isMobile && 'px-2')}>
        {collapsed && !isMobile ? (
          <div className="group/item relative flex justify-center">
            <button className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.06] text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white">
              <LifeBuoy className="h-[17px] w-[17px]" />
            </button>
            <div className="pointer-events-none absolute bottom-0 left-full z-50 ml-2 whitespace-nowrap rounded-lg border border-white/10 bg-navy-900/95 px-2.5 py-1.5 text-[12px] text-white opacity-0 shadow-dropdown transition-opacity group-hover/item:opacity-100">
              Help &amp; support
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-white/[0.07] bg-gradient-to-br from-white/[0.06] to-transparent p-3">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-emerald-400">
                  All systems live
                </p>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-400">
                {settings.name.split(' ')[0]} CRM · Jaipur flagship
              </p>
              <button className="mt-2.5 inline-flex items-center gap-1 text-[11.5px] font-medium text-brand-400 transition-colors hover:text-brand-300">
                View support centre
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
            <button
              onClick={onToggle}
              className="mt-2 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
            >
              <ChevronsLeft className="h-4 w-4" />
              Collapse sidebar
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden shrink-0 transition-[width] duration-200 ease-out lg:block',
          collapsed ? 'w-[78px]' : 'w-[264px]'
        )}
      >
        {content(false)}
        {collapsed && (
          <button
            onClick={onToggle}
            aria-label="Expand sidebar"
            className="absolute -right-3 top-[76px] grid h-6 w-6 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-card transition-colors hover:text-navy-900"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        )}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-[2px] animate-fade-in" onClick={onMobileClose} />
          <div className="absolute inset-y-0 left-0 w-[272px] animate-slide-in-left shadow-pop">{content(true)}</div>
        </div>
      )}
    </>
  );
}
