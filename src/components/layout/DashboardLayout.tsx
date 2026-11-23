import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useStore } from '@/context/StoreContext';
import { TODAY_ISO } from '@/utils/date';

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem('as-sidebar') === '1');
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { hydrated } = useStore();

  useEffect(() => {
    localStorage.setItem('as-sidebar', collapsed ? '1' : '0');
  }, [collapsed]);

  // close the mobile drawer + scroll to top on navigation
  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[2.5px] border-slate-200 border-t-brand-600" />
          <p className="text-[12.5px] font-medium text-slate-500">Loading AutoSutraa CRM…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div
        className={cn(
          'flex min-h-screen flex-col transition-[padding] duration-200 ease-out',
          collapsed ? 'lg:pl-[78px]' : 'lg:pl-[264px]'
        )}
      >
        <Header
          onMenuClick={() => setMobileOpen(true)}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          collapsed={collapsed}
        />
        <main className="mx-auto w-full max-w-[1560px] flex-1 px-3 py-4 sm:px-5 sm:py-5">
          <Outlet />
        </main>
        <footer className="mx-auto w-full max-w-[1560px] px-3 pb-5 sm:px-5">
          <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-200/70 pt-4 text-[11.5px] text-slate-400 sm:flex-row">
            <p>
              <span className="font-medium text-slate-500">AutoSutraa CRM</span> · Car Wash &amp; Detailing Management ·
              Prototype v1.0
            </p>
            <p className="flex items-center gap-3">
              <span>Data as of {TODAY_ISO}</span>
              <span className="hidden h-3 w-px bg-slate-200 sm:block" />
              <span>Built by RashTech Info</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
