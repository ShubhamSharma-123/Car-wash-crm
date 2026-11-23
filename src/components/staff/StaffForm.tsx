import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Save } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Checkbox } from '@/components/ui/Input';
import { useStore, nextId } from '@/context/StoreContext';
import { staffRoles, staffStatuses } from '@/utils/statusStyles';
import { TODAY_ISO } from '@/utils/date';
import type { Staff, StaffRole, StaffStatus } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Enter the staff name'),
  email: z.string().email('Enter a valid work email'),
  phone: z
    .string()
    .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  role: z.enum(['Super Admin', 'Admin', 'Manager', 'Staff', 'Accountant']),
  designation: z.string().min(2, 'Enter a designation'),
  status: z.enum(['Active', 'On Leave', 'Inactive']),
  shift: z.string().min(3, 'Enter the shift timing'),
  skillsRaw: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const permissionKeys: { key: string; label: string; description: string }[] = [
  { key: 'viewDashboard', label: 'Dashboard', description: 'View business KPIs and analytics' },
  { key: 'manageBookings', label: 'Bookings', description: 'Create, edit and advance bookings' },
  { key: 'manageCustomers', label: 'Customers', description: 'Add, edit and delete customers' },
  { key: 'manageVehicles', label: 'Vehicles', description: 'Manage vehicle records' },
  { key: 'manageServices', label: 'Services', description: 'Change catalogue and pricing' },
  { key: 'manageStaff', label: 'Staff', description: 'Add staff and assign roles' },
  { key: 'managePayments', label: 'Payments', description: 'Record and update payments' },
  { key: 'manageInvoices', label: 'Invoices', description: 'Issue and print invoices' },
  { key: 'viewReports', label: 'Reports', description: 'Export revenue and retention reports' },
  { key: 'manageSettings', label: 'Settings', description: 'Change business configuration' },
];

const shifts = ['07:30 AM – 04:30 PM', '08:00 AM – 05:00 PM', '09:00 AM – 06:00 PM', '09:30 AM – 06:30 PM', '10:00 AM – 07:00 PM', '12:00 PM – 09:00 PM'];

export function StaffFormModal({
  open,
  onClose,
  member,
}: {
  open: boolean;
  onClose: () => void;
  member?: Staff | null;
}) {
  const { staff, dispatch } = useStore();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', role: 'Staff', designation: 'Washer', status: 'Active', shift: shifts[1], skillsRaw: '' },
  });

  const [permissions, setPermissions] = React.useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    reset(
      member
        ? {
            name: member.name,
            email: member.email,
            phone: member.phone.replace('+91 ', ''),
            role: member.role,
            designation: member.designation,
            status: member.status,
            shift: member.shift,
            skillsRaw: member.skills.join(', '),
          }
        : { name: '', email: '', phone: '', role: 'Staff', designation: 'Washer', status: 'Active', shift: shifts[1], skillsRaw: '' }
    );
    setPermissions(member?.permissions || defaultPermissionsFor('Staff'));
  }, [open, member, reset]);

  const role = watch('role');
  useEffect(() => {
    if (!member && role) setPermissions(defaultPermissionsFor(role));
  }, [role, member]);

  const onSubmit = (v: FormValues) => {
    const payload: Staff = {
      id: member?.id || nextId('STF', staff),
      name: v.name,
      email: v.email,
      phone: v.phone.startsWith('+91') ? v.phone : `+91 ${v.phone}`,
      role: v.role as StaffRole,
      status: v.status as StaffStatus,
      designation: v.designation,
      assignedBookings: member?.assignedBookings || 0,
      completedServices: member?.completedServices || 0,
      rating: member?.rating || 4.5,
      joinedAt: member?.joinedAt || TODAY_ISO,
      shift: v.shift,
      skills: (v.skillsRaw || '').split(',').map((s) => s.trim()).filter(Boolean),
      avatarTone: member?.avatarTone || ['blue', 'teal', 'violet', 'amber', 'rose'][staff.length % 5],
      permissions,
      activity: member?.activity || [{ id: 'new', label: 'Staff profile created', at: TODAY_ISO }],
    };
    dispatch(member ? { type: 'UPDATE_STAFF', payload } : { type: 'ADD_STAFF', payload });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={member ? `Edit ${member.name}` : 'Add staff member'}
      description={member ? 'Update role, shift and permissions.' : 'Create a staff profile and control what they can access.'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" leftIcon={member ? <Save className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />} onClick={handleSubmit(onSubmit)}>
            {member ? 'Save changes' : 'Add staff'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" required error={errors.name?.message}>
            <Input {...register('name')} placeholder="e.g. Sunita Devi" invalid={!!errors.name} />
          </Field>
          <Field label="Work email" required error={errors.email?.message}>
            <Input {...register('email')} type="email" placeholder="name@autosutraa.in" invalid={!!errors.email} />
          </Field>
          <Field label="Mobile number" required error={errors.phone?.message}>
            <Input {...register('phone')} placeholder="9829012345" invalid={!!errors.phone} leftIcon={<span className="text-[12px]">+91</span>} />
          </Field>
          <Field label="Designation" required error={errors.designation?.message}>
            <Input {...register('designation')} placeholder="e.g. Detailing Specialist" invalid={!!errors.designation} />
          </Field>
          <Field label="Role" required hint="Controls default permission set">
            <Select {...register('role')} options={staffRoles.map((r) => ({ value: r, label: r }))} />
          </Field>
          <Field label="Employment status" required>
            <Select {...register('status')} options={staffStatuses.map((s) => ({ value: s, label: s }))} />
          </Field>
          <Field label="Shift" required error={errors.shift?.message}>
            <Select {...register('shift')} options={shifts.map((s) => ({ value: s, label: s }))} />
          </Field>
          <Field label="Skills" hint="Comma separated service assignments">
            <Input {...register('skillsRaw')} placeholder="Premium Wash, Interior Cleaning" />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Permissions</h4>
            <button
              type="button"
              onClick={() => setPermissions(defaultPermissionsFor(role))}
              className="text-[11px] font-medium text-brand-600 hover:underline"
            >
              Reset to role defaults
            </button>
          </div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
            {permissionKeys.map((p) => (
              <Checkbox
                key={p.key}
                checked={!!permissions[p.key]}
                onChange={(c) => setPermissions((prev) => ({ ...prev, [p.key]: c }))}
                label={
                  <span className="flex flex-col">
                    <span className="text-[12.5px] font-medium text-slate-700">{p.label}</span>
                    <span className="text-[10.5px] text-slate-400">{p.description}</span>
                  </span>
                }
              />
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}

export function defaultPermissionsFor(role: string): Record<string, boolean> {
  const full = ['Super Admin'];
  const admin = ['Super Admin', 'Admin'];
  const manager = ['Super Admin', 'Admin', 'Manager'];
  const finance = ['Super Admin', 'Admin', 'Accountant'];
  return {
    viewDashboard: true,
    manageBookings: role !== 'Accountant',
    manageCustomers: manager.includes(role),
    manageVehicles: manager.includes(role),
    manageServices: admin.includes(role),
    manageStaff: admin.includes(role),
    managePayments: [...manager, 'Accountant'].includes(role),
    manageInvoices: finance.includes(role),
    viewReports: [...manager, 'Accountant'].includes(role),
    manageSettings: full.includes(role) || admin.includes(role),
  };
}
