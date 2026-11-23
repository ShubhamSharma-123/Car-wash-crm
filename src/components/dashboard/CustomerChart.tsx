import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { ChartCard, ChartTooltip } from '@/components/ui/ChartCard';
import { customerGrowth } from '@/data/dashboardData';
import { cn } from '@/utils/cn';

export function CustomerChart({ className }: { className?: string }) {
  const recent = customerGrowth.slice(-6);
  const totalNew = recent.reduce((a, c) => a + c.neue, 0);
  const totalReturning = recent.reduce((a, c) => a + c.returning, 0);
  const retention = Math.round((totalReturning / (totalNew + totalReturning || 1)) * 100);

  return (
    <ChartCard
      title="Customer statistics"
      subtitle="New vs returning customers"
      action={
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10.5px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200/70">
          {retention}% returning
        </span>
      }
      className={className}
      footer={
        <div className="flex items-center justify-between text-[11.5px]">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="h-2 w-2 rounded-sm bg-brand-500" />
              New <span className="font-semibold text-navy-900">{totalNew}</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="h-2 w-2 rounded-sm bg-navy-800" />
              Returning <span className="font-semibold text-navy-900">{totalReturning}</span>
            </span>
          </span>
          <span className="text-slate-400">Last 6 months</span>
        </div>
      }
    >
      <div className="h-[208px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={recent} margin={{ top: 6, right: 12, left: 0, bottom: 0 }} barCategoryGap="24%">
            <CartesianGrid strokeDasharray="0" vertical={false} stroke="#eef2f7" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10.5, fill: '#94a3b8' }} dy={6} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10.5, fill: '#94a3b8' }} width={28} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(37,99,235,0.04)' }} />
            <Bar dataKey="neue" name="New" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} maxBarSize={30} />
            <Bar dataKey="returning" name="Returning" stackId="a" fill="#1c3358" radius={[4, 4, 0, 0]} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

/** Staff-wise completion summary with progress meters. */
export function StaffPerformanceBars({
  rows,
  className,
  limit = 5,
}: {
  rows: { name: string; completed: number; assigned: number; revenue: number; onTime: number; role: string }[];
  className?: string;
  limit?: number;
}) {
  const top = rows.slice(0, limit);
  const max = Math.max(...top.map((r) => r.completed), 1);
  return (
    <div className={cn('space-y-3', className)}>
      {top.map((s, i) => (
        <div key={s.name} className="flex items-center gap-3">
          <span
            className={cn(
              'grid h-6 w-6 shrink-0 place-items-center rounded-md text-[10.5px] font-bold',
              i === 0 ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200' : 'bg-slate-100 text-slate-500'
            )}
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-[12.5px] font-medium text-slate-800">{s.name}</p>
              <p className="shrink-0 text-[11.5px] tabular-nums text-slate-500">
                <span className="font-semibold text-navy-900">{s.completed}</span>/{s.assigned}
              </p>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500"
                style={{ width: `${(s.completed / max) * 100}%` }}
              />
            </div>
          </div>
          <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-emerald-700">
            {s.onTime}%
          </span>
        </div>
      ))}
    </div>
  );
}
