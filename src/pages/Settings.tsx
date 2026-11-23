import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  Phone,
  Clock,
  Sparkles,
  Bell,
  User,
  Save,
  RotateCcw,
  Plus,
  X,
  ShieldCheck,
  MapPin,
  Mail,
  Globe,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Database,
  KeyRound,
  Trash2,
} from 'lucide-react';
import { PageHeader, SectionCard, Tabs, DetailRow } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea, Switch, Checkbox } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { SegmentedControl } from '@/components/ui/Layout';
import { useStore } from '@/context/StoreContext';
import { defaultBusinessProfile, currentUser } from '@/data/settings';
import { TIME_SLOTS } from '@/utils/statusStyles';
import { formatDate } from '@/utils/date';
import { formatNumber } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { BusinessProfile } from '@/types';

type Tab = 'business' | 'hours' | 'services' | 'notifications' | 'profile';

/** "14:30" → "02:30 PM" */
const formatSlot = (v: string) => {
  const [h, m] = v.split(':').map(Number);
  if (Number.isNaN(h)) return v;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${`${hh}`.padStart(2, '0')}:${`${m}`.padStart(2, '0')} ${suffix}`;
};
const toMinutes = (slot: string) => {
  const m = slot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return 0;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + Number(m[2]);
};

export default function Settings() {
  const [params, setParams] = useSearchParams();
  const { settings, dispatch, customers, bookings, vehicles, services, payments, invoices, user } = useStore();
  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) || 'business');
  const [draft, setDraft] = useState<BusinessProfile>(settings);
  const [saved, setSaved] = useState(false);
  const [newSlot, setNewSlot] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState(user);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => {
    setProfileDraft(user);
  }, [user]);

  useEffect(() => {
    if (params.get('tab')) {
      setTab(params.get('tab') as Tab);
    }
  }, [params]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  const save = () => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: draft });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const update = <K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const dataStats = useMemo(
    () => ({
      customers: customers.length,
      vehicles: vehicles.length,
      bookings: bookings.length,
      services: services.length,
      payments: payments.length,
      invoices: invoices.length,
    }),
    [customers, vehicles, bookings, services, payments, invoices]
  );

  const tabs: { value: Tab; label: string; icon: React.ReactNode }[] = [
    { value: 'business', label: 'Business profile', icon: <Building2 className="h-3.5 w-3.5" /> },
    { value: 'hours', label: 'Hours & slots', icon: <Clock className="h-3.5 w-3.5" /> },
    { value: 'services', label: 'Service preferences', icon: <Sparkles className="h-3.5 w-3.5" /> },
    { value: 'notifications', label: 'Notifications', icon: <Bell className="h-3.5 w-3.5" /> },
    { value: 'profile', label: 'User profile', icon: <User className="h-3.5 w-3.5" /> },
  ];

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure the business profile, working hours, booking slots, service rules and notification behaviour."
        meta={
          <>
            <Badge tone="slate">Currency: INR (₹)</Badge>
            <Badge tone="green" dot>Frontend-only · saved locally</Badge>
            {dirty && <Badge tone="amber">Unsaved changes</Badge>}
          </>
        }
        actions={
          <>
            <Button
              variant="outline"
              leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
              onClick={() => setDraft(settings)}
              disabled={!dirty}
            >
              <span className="hidden sm:inline">Discard changes</span>
              <span className="sm:hidden">Discard</span>
            </Button>
            <Button variant="primary" leftIcon={saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />} onClick={save} disabled={!dirty}>
              {saved ? 'Saved' : 'Save changes'}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[230px_1fr]">
        {/* Vertical nav */}
        <nav className="card h-max overflow-hidden p-1.5">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setTab(t.value);
                params.set('tab', t.value);
                setParams(params, { replace: true });
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] font-medium transition-colors',
                tab === t.value ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              <span className={tab === t.value ? 'text-brand-300' : 'text-slate-400'}>{t.icon}</span>
              {t.label}
            </button>
          ))}
          <div className="mt-1 border-t border-slate-100 p-1.5">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Data</p>
            <div className="mt-1 grid grid-cols-2 gap-1">
              {Object.entries(dataStats).map(([k, v]) => (
                <div key={k} className="rounded-md bg-slate-50 px-1.5 py-1">
                  <p className="text-[9px] uppercase tracking-wider text-slate-400">{k.slice(0, 7)}</p>
                  <p className="text-[11.5px] font-semibold tabular-nums text-slate-700">{formatNumber(v)}</p>
                </div>
              ))}
            </div>
          </div>
        </nav>

        <div className="space-y-3">
          {tab === 'business' && (
            <>
              <SectionCard title="Business profile" description="Appears on invoices, receipts and customer notifications" icon={<Building2 className="h-4 w-4" />}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Business name" required className="sm:col-span-2">
                    <Input value={draft.name} onChange={(e) => update('name', e.target.value)} />
                  </Field>
                  <Field label="Tagline" className="sm:col-span-2">
                    <Input value={draft.tagline} onChange={(e) => update('tagline', e.target.value)} />
                  </Field>
                  <Field label="Contact phone">
                    <Input value={draft.phone} onChange={(e) => update('phone', e.target.value)} leftIcon={<Phone className="h-3.5 w-3.5" />} />
                  </Field>
                  <Field label="Email address">
                    <Input value={draft.email} onChange={(e) => update('email', e.target.value)} leftIcon={<Mail className="h-3.5 w-3.5" />} />
                  </Field>
                  <Field label="Website">
                    <Input value={draft.website} onChange={(e) => update('website', e.target.value)} leftIcon={<Globe className="h-3.5 w-3.5" />} />
                  </Field>
                  <Field label="GSTIN">
                    <Input value={draft.gstin} onChange={(e) => update('gstin', e.target.value)} />
                  </Field>
                  <Field label="Street address" className="sm:col-span-2">
                    <Input value={draft.address} onChange={(e) => update('address', e.target.value)} leftIcon={<MapPin className="h-3.5 w-3.5" />} />
                  </Field>
                  <Field label="City & PIN">
                    <Input value={draft.city} onChange={(e) => update('city', e.target.value)} />
                  </Field>
                  <Field label="Currency" hint="Fixed for this prototype">
                    <Select value="INR" options={[{ value: 'INR', label: 'INR — Indian Rupee (₹)' }]} disabled />
                  </Field>
                </div>
              </SectionCard>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <SectionCard title="Branding preview" description="How your details appear to customers">
                  <div className="rounded-xl border border-slate-200 p-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-navy-800 text-white">
                        <Building2 className="h-4.5 w-4.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-navy-900">{draft.name}</p>
                        <p className="truncate text-[11px] text-slate-500">{draft.tagline}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 text-[11.5px] text-slate-600">
                      <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-slate-400" /> {draft.address}</p>
                      <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-slate-400" /> {draft.city}</p>
                      <p className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-slate-400" /> {draft.phone}</p>
                      <p className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-slate-400" /> {draft.email}</p>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Danger zone" description="Prototype data controls" icon={<Database className="h-4 w-4" />}>
                  <div className="rounded-xl border border-rose-200/70 bg-rose-50/40 p-3.5">
                    <p className="flex items-center gap-1.5 text-[12px] font-semibold text-rose-700">
                      <AlertTriangle className="h-3.5 w-3.5" /> Reset all local data
                    </p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-rose-600/80">
                      Restores the original 150 customers, 223 vehicles and 633 bookings. Any records you added or edited
                      in this browser will be discarded.
                    </p>
                    <Button variant="danger" size="sm" className="mt-2.5" leftIcon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setResetOpen(true)}>
                      Reset prototype data
                    </Button>
                  </div>
                </SectionCard>
              </div>
            </>
          )}

          {tab === 'hours' && (
            <>
              <SectionCard title="Working hours" description="Controls which slots customers can book in the app" icon={<Clock className="h-4 w-4" />}>
                <div className="space-y-1.5">
                  {draft.workingHours.map((h, i) => (
                    <div key={h.day} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                      <span className="w-20 shrink-0 text-[12.5px] font-medium text-navy-900">{h.day}</span>
                      <input
                        type="text"
                        value={h.open}
                        disabled={h.closed}
                        onChange={(e) => {
                          const next = [...draft.workingHours];
                          next[i] = { ...h, open: e.target.value };
                          update('workingHours', next);
                        }}
                        className="h-8 w-[104px] rounded-md border border-slate-300 px-2 text-[12px] disabled:bg-slate-50 disabled:text-slate-400 focus:border-brand-500 focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-400">to</span>
                      <input
                        type="text"
                        value={h.close}
                        disabled={h.closed}
                        onChange={(e) => {
                          const next = [...draft.workingHours];
                          next[i] = { ...h, close: e.target.value };
                          update('workingHours', next);
                        }}
                        className="h-8 w-[104px] rounded-md border border-slate-300 px-2 text-[12px] disabled:bg-slate-50 disabled:text-slate-400 focus:border-brand-500 focus:outline-none"
                      />
                      <div className="ml-auto">
                        <Checkbox
                          checked={h.closed}
                          onChange={(c) => {
                            const next = [...draft.workingHours];
                            next[i] = { ...h, closed: c };
                            update('workingHours', next);
                          }}
                          label={<span className="text-[11.5px] text-slate-500">Closed</span>}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Booking time slots" description={`${draft.timeSlots.length} slots currently offered`} icon={<Clock className="h-4 w-4" />}>
                <div className="flex flex-wrap gap-1.5">
                  {draft.timeSlots.map((slot) => (
                    <span
                      key={slot}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11.5px] font-medium text-slate-700"
                    >
                      {slot}
                      <button
                        onClick={() => update('timeSlots', draft.timeSlots.filter((s) => s !== slot))}
                        aria-label={`Remove ${slot}`}
                        className="rounded p-0.5 text-slate-400 hover:bg-white hover:text-rose-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <div className="w-[150px]">
                    <label className="mb-1 block text-[11.5px] font-medium text-slate-600">Add a slot</label>
                    <input
                      type="time"
                      value={newSlot}
                      onChange={(e) => setNewSlot(e.target.value)}
                      className="h-8.5 w-full rounded-lg border border-slate-300 px-2 text-[12px] text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                  <Button
                    variant="outline"
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                    disabled={!newSlot || draft.timeSlots.includes(formatSlot(newSlot))}
                    onClick={() => {
                      update('timeSlots', [...draft.timeSlots, formatSlot(newSlot)].sort((a, b) => toMinutes(a) - toMinutes(b)));
                      setNewSlot('');
                    }}
                  >
                    Add slot
                  </Button>
                  <Button variant="ghost" leftIcon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => update('timeSlots', TIME_SLOTS)}>
                    Restore defaults
                  </Button>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Slots are shown to customers on the booking app in 12-hour format. {draft.timeSlots.length} slots active.
                </p>
              </SectionCard>
            </>
          )}

          {tab === 'services' && (
            <SectionCard title="Service preferences" description="Rules applied when bookings are created" icon={<Sparkles className="h-4 w-4" />}>
              <div className="space-y-4">
                {[
                  { key: 'autoAssignStaff' as const, label: 'Auto-assign staff', desc: 'Assign the least-loaded available technician to new bookings.' },
                  { key: 'requireAdvancePayment' as const, label: 'Require advance payment', desc: 'Ask for full payment before a booking is confirmed.' },
                  { key: 'allowSameDayBooking' as const, label: 'Allow same-day booking', desc: 'Let customers book a slot for today based on availability.' },
                  { key: 'sendWhatsAppUpdates' as const, label: 'WhatsApp status updates', desc: 'Send booking and payment updates on WhatsApp.' },
                ].map((s) => (
                  <div key={s.key} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-3">
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-medium text-slate-800">{s.label}</p>
                      <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">{s.desc}</p>
                    </div>
                    <Switch
                      checked={draft.servicePreferences[s.key]}
                      onChange={(v) => update('servicePreferences', { ...draft.servicePreferences, [s.key]: v })}
                    />
                  </div>
                ))}
                <Field label="Appointment grace period (minutes)" hint="After this, a booking is marked as no-show" className="max-w-xs">
                  <Input
                    type="number"
                    value={draft.servicePreferences.graceMinutes}
                    onChange={(e) => update('servicePreferences', { ...draft.servicePreferences, graceMinutes: Number(e.target.value) })}
                  />
                </Field>
              </div>
            </SectionCard>
          )}

          {tab === 'notifications' && (
            <>
              <SectionCard title="Notification preferences" description="Choose which automated alerts the CRM sends" icon={<Bell className="h-4 w-4" />}>
                <div className="space-y-4">
                  {[
                    { key: 'bookingConfirmation' as const, label: 'Booking confirmation', desc: 'Sent instantly when a booking is created or confirmed.' },
                    { key: 'bookingReminder' as const, label: 'Appointment reminders', desc: '24 hours and 2 hours before the scheduled slot.' },
                    { key: 'paymentReceipt' as const, label: 'Payment receipts', desc: 'Receipt and invoice copy after every successful collection.' },
                    { key: 'promotionalCampaigns' as const, label: 'Promotional campaigns', desc: 'Weekend offers, festival discounts and win-back messages.' },
                    { key: 'dailySummaryEmail' as const, label: 'Daily summary email', desc: 'Revenue, bookings and pending items delivered at 9 PM.' },
                  ].map((n) => (
                    <div key={n.key} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-3">
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-slate-800">{n.label}</p>
                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">{n.desc}</p>
                      </div>
                      <Switch
                        checked={draft.notificationPreferences[n.key]}
                        onChange={(v) => update('notificationPreferences', { ...draft.notificationPreferences, [n.key]: v })}
                      />
                    </div>
                  ))}
                </div>
              </SectionCard>

              <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-start gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold text-navy-900">
                      {Object.values(draft.notificationPreferences).filter(Boolean).length} of 5 alerts active
                    </p>
                    <p className="text-[11.5px] text-slate-500">Delivered through FCM push, WhatsApp and email as configured.</p>
                  </div>
                </div>
                <Badge tone="green" dot>Delivery healthy</Badge>
              </div>
            </>
          )}

          {tab === 'profile' && (
            <>
              <SectionCard title="User profile" description="Your CRM login identity and role" icon={<User className="h-4 w-4" />}>
                <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <Avatar name={profileDraft.name} tone="navy" size="xl" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-navy-900">{profileDraft.name}</p>
                    <p className="text-[11.5px] text-slate-500">{profileDraft.role} · {currentUser.designation}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge tone="violet" size="sm">Super Admin</Badge>
                      <Badge tone="green" size="sm" dot>Active session</Badge>
                      <Badge tone="slate" size="sm">Joined {formatDate(currentUser.joinedAt)}</Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Full name">
                    <Input value={profileDraft.name} onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })} />
                  </Field>
                  <Field label="Role">
                    <Select
                      value={profileDraft.role}
                      onChange={(e) => setProfileDraft({ ...profileDraft, role: e.target.value })}
                      options={['Super Admin', 'Admin', 'Manager', 'Accountant'].map((r) => ({ value: r, label: r }))}
                    />
                  </Field>
                  <Field label="Email address">
                    <Input value={profileDraft.email} onChange={(e) => setProfileDraft({ ...profileDraft, email: e.target.value })} />
                  </Field>
                  <Field label="Mobile number">
                    <Input value={profileDraft.phone} onChange={(e) => setProfileDraft({ ...profileDraft, phone: e.target.value })} />
                  </Field>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Save className="h-3.5 w-3.5" />}
                    disabled={JSON.stringify(profileDraft) === JSON.stringify(user)}
                    onClick={() => dispatch({ type: 'UPDATE_USER', payload: profileDraft })}
                  >
                    Update profile
                  </Button>
                </div>
              </SectionCard>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <SectionCard title="Security" description="Authentication settings" icon={<KeyRound className="h-4 w-4" />}>
                  <div className="space-y-1">
                    <DetailRow label="Two-factor authentication" value={<Badge tone="green" size="sm">Enabled</Badge>} />
                    <DetailRow label="Last login" value={currentUser.lastLogin} />
                    <DetailRow label="Session timeout" value="30 minutes" />
                    <DetailRow label="Password updated" value="12 Oct 2026" />
                  </div>
                  <Button variant="outline" size="sm" className="mt-2 w-full" leftIcon={<KeyRound className="h-3.5 w-3.5" />}>
                    Change password
                  </Button>
                </SectionCard>

                <SectionCard title="Plan & billing" description="Prototype subscription details" icon={<CreditCard className="h-4 w-4" />}>
                  <div className="rounded-xl bg-gradient-to-br from-navy-900 to-navy-800 p-3.5 text-white">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-300">Current plan</p>
                    <p className="mt-1 text-[15px] font-semibold">AutoSutraa Business</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">Unlimited bookings · 10 staff seats · multi-branch ready</p>
                  </div>
                  <div className="mt-3 space-y-1">
                    <DetailRow label="Billed" value="Annually" />
                    <DetailRow label="Renews on" value="14 Feb 2027" />
                    <DetailRow label="Staff seats used" value={`${dataStats.customers > 0 ? 10 : 0} / 10`} />
                  </div>
                </SectionCard>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sticky save bar when dirty */}
      {dirty && (
        <div className="sticky bottom-3 z-20 mt-3 animate-slide-up">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 rounded-xl border border-navy-800 bg-navy-900 px-4 py-2.5 text-white shadow-pop">
            <p className="text-[12px]">
              <span className="font-semibold">Unsaved changes</span>
              <span className="ml-1.5 text-slate-400">Your configuration will be stored in this browser.</span>
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-white/10 hover:text-white" onClick={() => setDraft(settings)}>
                Discard
              </Button>
              <Button variant="accent" size="sm" leftIcon={<Save className="h-3.5 w-3.5" />} onClick={save}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          dispatch({ type: 'RESET_DATA' });
          setDraft(defaultBusinessProfile);
        }}
        title="Reset all prototype data?"
        message="Every record you added, edited or deleted in this browser will be replaced with the original seed data. Settings will also return to defaults."
        confirmLabel="Reset everything"
      />
    </div>
  );
}
