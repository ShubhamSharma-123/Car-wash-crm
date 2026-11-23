import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard, ChartTooltip, ChartLegend } from '@/components/ui/ChartCard';
import { SegmentedControl } from '@/components/ui/Layout';
import { dailyRevenue, weeklyRevenue, monthlyRevenue } from '@/data/dashboardData';

type Range = 'daily' | 'weekly' | 'monthly';

export function BookingChart({ className }: { className?: string }) {
  const [range, setRange] = useState<Range>('weekly');

  const data = useMemo(() => {
    if (range === 'daily') return dailyRevenue.slice(-14).map((p) => ({ label: p.label, value: p.bookings }));
    if (range === 'monthly') return monthlyRevenue.map((p) => ({ label: p.label, value: p.bookings }));
    return weeklyRevenue.slice(-8).map((p) => ({ label: p.label.replace(/^(\d+)/, 'wk $1'), value: p.bookings }));
  }, [range]);

  const total = data.reduce((a, p) => a + p.value, 0);
  const avg = Math.round(total / (data.length || 1));

  return (
    <ChartCard
      title="Booking trends"
      subtitle="Booking volume over time"
      action={
        <SegmentedControl<Range>
          value={range}
          onChange={setRange}
          size="sm"
          options={[
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
          ]}
        />
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ChartLegend items={[{ label: 'Bookings', color: '#1c3358' }]} />
          <span className="text-[11px] text-slate-400">
            Total <span className="font-medium text-slate-600">{total}</span> · avg{' '}
            <span className="font-medium text-slate-600">{avg}</span> per period
          </span>
        </div>
      }
      className={className}
    >
      <div className="h-[232px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }} barCategoryGap="26%">
            <CartesianGrid strokeDasharray="0" vertical={false} stroke="#eef2f7" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10.5, fill: '#94a3b8' }}
              dy={6}
              interval={range === 'daily' ? 1 : 0}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10.5, fill: '#94a3b8' }} width={32} />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: 'rgba(37,99,235,0.05)' }}
            />
            <Bar dataKey="value" name="Bookings" fill="#1c3358" radius={[4, 4, 0, 0]} maxBarSize={34} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
