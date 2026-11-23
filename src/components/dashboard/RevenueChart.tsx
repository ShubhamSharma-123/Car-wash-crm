import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard, ChartTooltip, ChartLegend } from '@/components/ui/ChartCard';
import { SegmentedControl } from '@/components/ui/Layout';
import { dailyRevenue, weeklyRevenue, monthlyRevenue } from '@/data/dashboardData';
import { formatCompactINR, formatINR } from '@/utils/format';
import { pctChange } from '@/utils/ui';

type Range = 'daily' | 'weekly' | 'monthly';

export function RevenueChart({ className }: { className?: string }) {
  const [range, setRange] = useState<Range>('daily');

  const { data, total, change, labelNote } = useMemo(() => {
    if (range === 'weekly') {
      const d = weeklyRevenue.slice(-8);
      const total = d.reduce((a, p) => a + p.revenue, 0);
      const prev = weeklyRevenue.slice(0, 4).reduce((a, p) => a + p.revenue, 0);
      return { data: d, total, change: pctChange(total, prev), labelNote: 'Last 8 weeks' };
    }
    if (range === 'monthly') {
      const d = monthlyRevenue;
      const total = d.reduce((a, p) => a + p.revenue, 0);
      const prev = d.slice(0, 6).reduce((a, p) => a + p.revenue, 0);
      return { data: d, total, change: pctChange(total, prev), labelNote: 'Last 12 months' };
    }
    const d = dailyRevenue;
    const total = d.reduce((a, p) => a + p.revenue, 0);
    const half = Math.floor(d.length / 2);
    const prev = d.slice(0, half).reduce((a, p) => a + p.revenue, 0);
    const curr = d.slice(half).reduce((a, p) => a + p.revenue, 0);
    return { data: d, total, change: pctChange(curr, prev), labelNote: 'Last 30 days' };
  }, [range]);

  const best = useMemo(() => data.reduce((a, p) => (p.revenue > a.revenue ? p : a), data[0]), [data]);

  return (
    <ChartCard
      title="Revenue overview"
      subtitle={`Collections trend · ${labelNote}`}
      action={
        <SegmentedControl<Range>
          value={range}
          onChange={setRange}
          options={[
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
          ]}
        />
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ChartLegend
            items={[
              { label: 'Collected revenue', color: '#2563eb' },
              { label: 'Bookings', color: '#cbd5e1' },
            ]}
          />
          <span className="text-[11px] text-slate-400">
            Peak: <span className="font-medium text-slate-600">{best?.label}</span> ·{' '}
            {formatINR(best?.revenue || 0)}
          </span>
        </div>
      }
      className={className}
    >
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2 px-3 pb-3 sm:px-4">
        <div>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-slate-400">Total revenue</p>
          <p className="mt-0.5 text-[22px] font-semibold leading-none tabular-nums tracking-[-0.02em] text-navy-900">
            {formatINR(total)}
          </p>
        </div>
        <div className="flex items-center gap-2 pb-0.5">
          <span
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
              change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
            }`}
          >
            {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
          </span>
          <span className="text-[11px] text-slate-400">vs previous period</span>
        </div>
      </div>

      <div className="h-[248px] w-full sm:h-[268px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 12, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="0" vertical={false} stroke="#eef2f7" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10.5, fill: '#94a3b8' }}
              interval={range === 'daily' ? 4 : 0}
              dy={6}
              minTickGap={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10.5, fill: '#94a3b8' }}
              width={54}
              tickFormatter={(v) => formatCompactINR(Number(v)).replace('.0', '')}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#2563eb"
              strokeWidth={2}
              fill="url(#revFill)"
              activeDot={{ r: 3.5, strokeWidth: 2, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
