import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Download,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Shield,
  Star,
  Users,
  CircleCheck,
  TrendingUp,
  Mail,
  Phone,
  Clock,
  Check,
  X,
  Activity,
  Briefcase,
  Award,
} from 'lucide-react';
import { PageHeader, SectionCard, Tabs, DetailRow } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { SearchBar, EmptyState, Pagination } from '@/components/ui/SearchBar';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PersonCell, Avatar } from '@/components/ui/Avatar';
import { Badge, RoleBadge, StaffStatusBadge } from '@/components/ui/Badge';
import { Dropdown, FilterSelect } from '@/components/ui/Dropdown';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { StatCard, Meter } from '@/components/ui/StatCard';
import { EmptyState as Empty } from '@/components/ui/SearchBar';
import { StaffFormModal, defaultPermissionsFor } from '@/components/staff/StaffForm';
import { useStore } from '@/context/StoreContext';
import { TODAY_ISO, formatDate, timeAgo } from '@/utils/date';
import { formatINR } from '@/utils/format';
import { downloadCSV } from '@/utils/ui';
import { staffRoles, staffStatuses } from '@/utils/statusStyles';
import { cn } from '@/utils/cn';
import type { Staff as StaffType } from '@/types';

const permissionLabels: Record<string, string> = {
  viewDashboard: 'Dashboard',
  manageBookings: 'Bookings',
  manageCustomers: 'Customers',
  manageVehicles: 'Vehicles',
  manageServices: 'Services',
  manageStaff: 'Staff',
  managePayments: 'Payments',
  manageInvoices: 'Invoices',
  viewReports: 'Reports',
  manageSettings: 'Settings',
};

export default function Staff() {
  const navigate = useNavigate();
  const { staff, bookings, dispatch } = useStore();

  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffType | null>(null);
  const [deleting, setDeleting] = useState<StaffType | null>(null);
  const [profile, setProfile] = useState<StaffType | null>(null);
  const [profileTab, setProfileTab] = useState<'overview' | 'permissions' | 'bookings' | 'activity'>('overview');

  const enriched = useMemo(
    () =>
      staff.map((s) => {
        const assigned = bookings.filter((b) => b.assignedStaffId === s.id);
        const completed = assigned.filter((b) => b.status === 'Completed');
        const active = assigned.filter((b) => !['Completed', 'Cancelled', 'No Show'].includes(b.status));
        return {
          ...s,
          liveAssigned: active.length,
          liveCompleted: completed.length,
          revenue: completed.reduce((a, b) => a + b.amount, 0),
          completion: assigned.length ? Math.round((completed.length / assigned.length) * 100) : 0,
          onTime: 86 + ((staff.indexOf(s) * 3) % 13),
          bookings: assigned,
        };
      }),
    [staff, bookings]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched.filter((s) => {
      if (role !== 'all' && s.role !== role) return false;
      if (status !== 'all' && s.status !== status) return false;
      if (q && !`${s.name} ${s.email} ${s.phone} ${s.designation} ${s.skills.join(' ')}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [enriched, query, role, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const kpis = useMemo(() => {
    const activeStaff = staff.filter((s) => s.status === 'Active').length;
    const totalCompleted = enriched.reduce((a, s) => a + s.liveCompleted, 0);
    const avgRating = staff.reduce((a, s) => a + s.rating, 0) / (staff.length || 1);
    const topPerformer = enriched.slice().sort((a, b) => b.liveCompleted - a.liveCompleted)[0];
    return { activeStaff, totalCompleted, avgRating, topPerformer };
  }, [staff, enriched]);

  const exportCsv = () =>
    downloadCSV(`autosutraa-staff-${TODAY_ISO}`, [
      ['Staff ID', 'Name', 'Email', 'Phone', 'Role', 'Designation', 'Status', 'Shift', 'Assigned', 'Completed', 'Revenue', 'Rating'],
      ...filtered.map((s) => [
        s.id, s.name, s.email, s.phone, s.role, s.designation, s.status, s.shift,
        s.liveAssigned, s.liveCompleted, s.revenue, s.rating,
      ]),
    ]);

  const columns: Column<StaffType & { liveAssigned: number; liveCompleted: number; revenue: number; completion: number; onTime: number }>[] = [
    {
      key: 'name',
      header: 'Staff member',
      render: (s) => (
        <PersonCell
          name={s.name}
          secondary={s.designation}
          avatarTone={s.avatarTone}
          size="md"
          onClick={() => {
            setProfile(s);
            setProfileTab('overview');
          }}
        />
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (s) => (
        <div className="min-w-0">
          <p className="flex items-center gap-1 truncate text-[12px] text-slate-600">
            <Mail className="h-2.5 w-2.5 shrink-0 text-slate-400" /> {s.email}
          </p>
          <p className="flex items-center gap-1 text-[11px] tabular-nums text-slate-500">
            <Phone className="h-2.5 w-2.5 text-slate-400" /> {s.phone}
          </p>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (s) => <RoleBadge role={s.role} size="sm" /> },
    {
      key: 'assigned',
      header: 'Assigned',
      align: 'center',
      render: (s) => <span className="text-[12.5px] font-medium tabular-nums text-slate-700">{s.liveAssigned}</span>,
    },
    {
      key: 'completed',
      header: 'Completed',
      align: 'center',
      render: (s) => <span className="text-[12.5px] font-semibold tabular-nums text-navy-900">{s.liveCompleted}</span>,
    },
    {
      key: 'performance',
      header: 'Performance',
      render: (s) => (
        <div className="w-[120px]">
          <div className="flex items-center justify-between text-[10.5px] text-slate-500">
            <span>{s.completion}%</span>
            <span className="flex items-center gap-0.5 text-amber-600">
              <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" /> {s.rating}
            </span>
          </div>
          <Meter value={s.completion} tone={s.completion > 75 ? 'emerald' : s.completion > 50 ? 'amber' : 'rose'} className="mt-1" />
        </div>
      ),
    },
    {
      key: 'shift',
      header: 'Shift',
      render: (s) => (
        <span className="flex items-center gap-1 whitespace-nowrap text-[11.5px] text-slate-600">
          <Clock className="h-3 w-3 text-slate-400" /> {s.shift}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (s) => <StaffStatusBadge status={s.status} size="sm" /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (s) => (
        <Dropdown
          width="w-52"
          items={[
            {
              label: 'View profile',
              icon: <Eye className="h-3.5 w-3.5" />,
              onClick: () => {
                setProfile(s);
                setProfileTab('overview');
              },
            },
            {
              label: 'Edit staff',
              icon: <Pencil className="h-3.5 w-3.5" />,
              onClick: () => {
                setEditing(s);
                setFormOpen(true);
              },
            },
            {
              label: 'Manage permissions',
              icon: <Shield className="h-3.5 w-3.5" />,
              onClick: () => {
                setProfile(s);
                setProfileTab('permissions');
              },
            },
            {
              label: s.status === 'Active' ? 'Mark on leave' : 'Mark active',
              icon: <Briefcase className="h-3.5 w-3.5" />,
              onClick: () =>
                dispatch({
                  type: 'UPDATE_STAFF',
                  payload: { ...s, status: s.status === 'Active' ? 'On Leave' : 'Active' },
                }),
            },
            { separator: true },
            { label: 'Remove staff', icon: <Trash2 className="h-3.5 w-3.5" />, danger: true, onClick: () => setDeleting(s) },
          ]}
          trigger={({ toggle }) => (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Staff actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Staff management"
        description="Team roster, roles and permissions, booking assignments and performance tracking across every bay."
        meta={
          <>
            <Badge tone="green" dot>{kpis.activeStaff} active</Badge>
            <Badge tone="amber" dot>{staff.filter((s) => s.status === 'On Leave').length} on leave</Badge>
            <Badge tone="violet">
              <Award className="h-3 w-3" /> Top: {kpis.topPerformer?.name}
            </Badge>
          </>
        }
        actions={
          <>
            <Button variant="outline" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={exportCsv}>
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>
            <Button
              variant="primary"
              leftIcon={<UserPlus className="h-3.5 w-3.5" />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Add staff
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Team size" value={staff.length} icon={<Users className="h-4 w-4" />} tone="brand" footnote={`${kpis.activeStaff} on duty`} />
        <StatCard label="Services completed" value={kpis.totalCompleted} icon={<CircleCheck className="h-4 w-4" />} tone="emerald" change={7.9} comparison="vs last month" />
        <StatCard label="Avg. rating" value={kpis.avgRating.toFixed(1)} icon={<Star className="h-4 w-4" />} tone="amber" footnote="Customer feedback score" />
        <StatCard label="Top performer" value={kpis.topPerformer?.name.split(' ')[0] || '—'} icon={<TrendingUp className="h-4 w-4" />} tone="violet" footnote={`${kpis.topPerformer?.liveCompleted} jobs completed`} />
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <SearchBar value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search staff by name, skill, email…" className="w-full sm:w-[300px]" />
          <FilterSelect label="Role" value={role} onChange={(v) => { setRole(v); setPage(1); }} options={[{ value: 'all', label: 'All roles' }, ...staffRoles.map((r) => ({ value: r, label: r }))]} width="w-48" />
          <FilterSelect label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: 'all', label: 'Any status' }, ...staffStatuses.map((s) => ({ value: s, label: s }))]} width="w-44" />
        </div>
        <span className="text-[11.5px] text-slate-400">{filtered.length} team members</span>
      </div>

      <DataTable
        columns={columns}
        rows={paged}
        onRowClick={(s) => {
          setProfile(s);
          setProfileTab('overview');
        }}
        minWidth={1080}
        empty={<EmptyState title="No staff found" description="Adjust the filters or add a new team member." action={<Button variant="primary" onClick={() => setFormOpen(true)}>Add staff</Button>} />}
      />
      <div className="card overflow-hidden rounded-t-none border-t-0">
        <Pagination page={safePage} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={setPageSize} />
      </div>

      <StaffFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} member={editing} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && dispatch({ type: 'DELETE_STAFF', payload: deleting.id })}
        title={`Remove ${deleting?.name}?`}
        message="The staff profile, permissions and assignments will be deleted. Bookings already assigned stay in reports but will show an unassigned staff reference."
        confirmLabel="Remove staff"
      />

      {/* Profile modal */}
      <Modal
        open={!!profile}
        onClose={() => setProfile(null)}
        size="lg"
        title={profile ? `${profile.name} · ${profile.role}` : ''}
        description={profile ? `${profile.designation} · Shift ${profile.shift}` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setProfile(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              leftIcon={<Pencil className="h-3.5 w-3.5" />}
              onClick={() => {
                setEditing(profile);
                setProfile(null);
                setFormOpen(true);
              }}
            >
              Edit staff
            </Button>
          </>
        }
      >
        {profile && (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
              <Avatar name={profile.name} tone={profile.avatarTone} size="xl" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-semibold text-navy-900">{profile.name}</p>
                  <RoleBadge role={profile.role} size="sm" />
                  <StaffStatusBadge status={profile.status} size="sm" />
                </div>
                <p className="mt-1 text-[11.5px] text-slate-500">
                  {profile.email} · {profile.phone}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">Joined {formatDate(profile.joinedAt)} · {profile.id}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.05em] text-slate-400">Rating</p>
                  <p className="flex items-center gap-1 text-[15px] font-semibold text-navy-900">
                    {profile.rating} <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.05em] text-slate-400">Completed</p>
                  <p className="text-[15px] font-semibold tabular-nums text-navy-900">{profile.completedServices}</p>
                </div>
              </div>
            </div>

            <Tabs
              value={profileTab}
              onChange={setProfileTab}
              tabs={[
                { value: 'overview', label: 'Overview' },
                { value: 'permissions', label: 'Permissions' },
                { value: 'bookings', label: 'Assignments' },
                { value: 'activity', label: 'Activity' },
              ]}
            />

            <div className="pt-4">
              {profileTab === 'overview' && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <DetailRow label="Staff ID" value={profile.id} />
                    <DetailRow label="Role" value={<RoleBadge role={profile.role} size="sm" />} />
                    <DetailRow label="Designation" value={profile.designation} />
                    <DetailRow label="Shift" value={profile.shift} />
                    <DetailRow label="Status" value={<StaffStatusBadge status={profile.status} size="sm" />} />
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <DetailRow label="Assigned bookings" value={profile.assignedBookings} />
                    <DetailRow label="Completed services" value={profile.completedServices} />
                    <DetailRow label="Revenue handled" value={formatINR(0)} />
                    <DetailRow label="Joined" value={formatDate(profile.joinedAt)} />
                    <DetailRow label="Rating" value={`${profile.rating} / 5`} />
                  </div>
                  <div className="sm:col-span-2">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Service assignments</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills.length === 0 && <span className="text-[12px] text-slate-500">No skills assigned.</span>}
                      {profile.skills.map((s) => (
                        <Badge key={s} tone="blue" size="sm">{s}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {profileTab === 'permissions' && (
                <div>
                  <p className="mb-2 text-[11.5px] text-slate-500">
                    Toggle module access for this role. Changes apply immediately to the local prototype.
                  </p>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {Object.keys(permissionLabels).map((key) => {
                      const enabled = profile.permissions[key];
                      return (
                        <button
                          key={key}
                          onClick={() =>
                            dispatch({
                              type: 'UPDATE_STAFF',
                              payload: {
                                ...profile,
                                permissions: { ...profile.permissions, [key]: !enabled },
                              },
                            })
                          }
                          className="flex items-center justify-between rounded-lg border border-slate-200 px-2.5 py-2 text-left transition-colors hover:bg-slate-50"
                        >
                          <span className="text-[12.5px] text-slate-700">{permissionLabels[key]}</span>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-1.5 py-[1px] text-[10px] font-semibold ring-1 ring-inset',
                              enabled
                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                : 'bg-slate-100 text-slate-500 ring-slate-200'
                            )}
                          >
                            {enabled ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                            {enabled ? 'Allowed' : 'Denied'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-[11.5px] text-slate-500">
                      {Object.values(profile.permissions).filter(Boolean).length} of 10 modules enabled
                    </span>
                    <button
                      onClick={() =>
                        dispatch({ type: 'UPDATE_STAFF', payload: { ...profile, permissions: defaultPermissionsFor(profile.role) } })
                      }
                      className="text-[11.5px] font-medium text-brand-600 hover:underline"
                    >
                      Reset to {profile.role} defaults
                    </button>
                  </div>
                </div>
              )}

              {profileTab === 'bookings' && (
                <div className="space-y-2">
                  {bookings.filter((b) => b.assignedStaffId === profile.id).length === 0 && (
                    <EmptyState title="No assignments" description="This staff member has no bookings yet." compact />
                  )}
                  {bookings
                    .filter((b) => b.assignedStaffId === profile.id)
                    .slice(0, 8)
                    .map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setProfile(null);
                          navigate(`/bookings/${b.id}`);
                        }}
                        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-left transition-colors hover:bg-slate-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[12px] font-medium text-navy-900">
                            {b.id} · {formatDate(b.date)} · {b.timeSlot}
                          </span>
                          <span className="block text-[10.5px] text-slate-500">{b.status}</span>
                        </span>
                        <span className="shrink-0 text-[12px] font-semibold tabular-nums text-navy-900">{formatINR(b.amount)}</span>
                      </button>
                    ))}
                </div>
              )}

              {profileTab === 'activity' && (
                <div className="space-y-2.5">
                  {profile.activity.map((a) => (
                    <div key={a.id} className="flex items-start gap-2.5">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500">
                        <Activity className="h-3 w-3" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12px] text-slate-700">{a.label}</p>
                        <p className="text-[10.5px] text-slate-400">{timeAgo(`${a.at}T09:30:00`)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
