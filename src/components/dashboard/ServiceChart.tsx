import React, { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartCard, ChartTooltip } from '@/components/ui/ChartCard';
import { SegmentedControl } from '@/components/ui/Layout';
import { useStore } from '@/context/StoreContext';
import { servicePerformance } from '@/data/dashboardData';
import { formatINR, formatCompactINR } from '@/utils/format';
import { CHART_COLORS } from '@/utils/ui';
import { cn } from '@/utils/cn';

type View = 'donut' | 'bars';

export function ServiceChart({ className }: { className?: string }) {
  const [view, setView] = useState<View>('donut');
  const { services } = useStore();

  const data = useMemo(() => {
    const top = servicePerformance.slice(0, 6).map((s, i) => ({ ...s, color: CHART_COLORS[i % CHART_COLORS.length] }));
    const rest = servicePerformance.slice(6);
    const otherValue = rest.reduce((a, s) => a + s.value, 0);
    const otherRevenue = rest.reduce((a, s) => a + s.revenue, 0);
    if (otherValue > 0) {
      top.push({ label: 'Other services', value: otherValue, revenue: otherRevenue, tone: 'slate', color: '#cbd5e1' });
    }
    return top;
  }, [services]);

  const totalBookings = data.reduce((a, d) => a + d.value, 0);

  return (
    <ChartCard
      title="Service performance"
      subtitle="Popularity breakdown by bookings"
      action={
        <SegmentedControl<View>
          value={view}
          onChange={setView}
          size="sm"
          options={[
            { value: 'donut', label: 'Share' },
            { value: 'bars', label: 'Volume' },
          ]}
        />
      }
      className={className}
      bodyClassName="px-2 pb-3 pt-1"
    >
      {view === 'donut' ? (
        <div className="flex flex-col items-center gap-2.5">
          <div className="relative h-[168px] w-full max-w-[176px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((d) => (
                    <Cell key={d.label} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip hideLabel />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[20px] font-semibold leading-none tabular-nums text-navy-900">{totalBookings}</span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.06em] text-slate-400">Bookings</span>
            </div>
          </div>
          <div className="w-full min-w-0 space-y-1.5 px-1">
            {data.map((d) => (
              <div key={d.label} className="flex items-center gap-2 text-[11.5px]">
                <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: d.color }} />
                <span className="min-w-0 flex-1 truncate text-slate-600">{d.label}</span>
                <span className="shrink-0 font-semibold tabular-nums text-navy-900">
                  {Math.round((d.value / (totalBookings || 1)) * 100)}%
                </span>
                <span className="w-14 shrink-0 text-right tabular-nums text-slate-400">{formatCompactINR(d.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-[212px] w-full px-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" horizontal={false} stroke="#eef2f7" />
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10.5, fill: '#94a3b8' }} />
              <YAxis
                type="category"
                dataKey="label"
                width={106}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10.5, fill: '#64748b' }}
                tickFormatter={(v: string) => (v.length > 16 ? `${v.slice(0, 15)}…` : v)}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(37,99,235,0.05)' }} />
              <Bar dataKey="value" name="Bookings" radius={[0, 4, 4, 0]} maxBarSize={16}>
                {data.map((d) => (
                  <Cell key={d.label} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

/** Top performing services list with revenue bars. */
export function TopServicesList({ className }: { className?: string }) {
  const { services } = useStore();
  const rows = useMemo(() => servicePerformance.slice(0, 5), [services]);
  const max = Math.max(...rows.map((r) => r.revenue));

  return (
    <div className={cn('space-y-2.5', className)}>
      {rows.map((r, i) => (
        <div key={r.label} className="group">
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-slate-100 text-[10px] font-semibold text-slate-500">
                {i + 1}
              </span>
              <span className="truncate text-[12.5px] font-medium text-slate-700">{r.label}</span>
            </span>
            <span className="shrink-0 text-[12px] font-semibold tabular-nums text-navy-900">{formatINR(r.revenue)}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 pl-7">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-500 group-hover:bg-brand-600"
                style={{ width: `${(r.revenue / max) * 100}%` }}
              />
            </div>
            <span className="w-16 shrink-0 text-right text-[10.5px] text-slate-400">{r.value} bookings</span>
          </div>
        </div>
      ))}
    </div>
  );
}
