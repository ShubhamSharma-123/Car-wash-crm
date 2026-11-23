import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Save } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { useStore, nextId } from '@/context/StoreContext';
import { customerStatuses } from '@/utils/statusStyles';
import { TODAY_ISO } from '@/utils/date';
import type { Customer, CustomerStatus } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Enter the full name').max(60),
  phone: z
    .string()
    .min(10, 'Enter a valid 10-digit mobile number')
    .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, 'Use an Indian mobile number, e.g. 9829012345'),
  email: z.string().email('Enter a valid email address'),
  address: z.string().min(5, 'Enter the street address'),
  city: z.string().min(2, 'Enter the city'),
  status: z.enum(['Active', 'Inactive', 'VIP', 'Blocked']),
  notes: z.string().max(400).optional(),
});

type FormValues = z.infer<typeof schema>;

const cities = ['Jaipur', 'Alwar', 'Gurugram', 'Ajmer', 'Kota', 'Delhi', 'Udaipur'];

export function CustomerFormModal({
  open,
  onClose,
  customer,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSaved?: (id: string) => void;
}) {
  const { customers, dispatch } = useStore();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', email: '', address: '', city: 'Jaipur', status: 'Active', notes: '' },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      customer
        ? {
            name: customer.name,
            phone: customer.phone.replace('+91 ', ''),
            email: customer.email,
            address: customer.address,
            city: customer.city,
            status: customer.status,
            notes: customer.notes,
          }
        : { name: '', phone: '', email: '', address: '', city: 'Jaipur', status: 'Active', notes: '' }
    );
  }, [open, customer, reset]);

  const onSubmit = (v: FormValues) => {
    const phone = v.phone.startsWith('+91') ? v.phone : `+91 ${v.phone}`;
    if (customer) {
      dispatch({
        type: 'UPDATE_CUSTOMER',
        payload: { ...customer, ...v, phone, notes: v.notes || '' },
      });
      onSaved?.(customer.id);
    } else {
      const created: Customer = {
        id: nextId('CUS', customers),
        name: v.name,
        phone,
        email: v.email,
        address: v.address,
        city: v.city,
        status: v.status as CustomerStatus,
        totalBookings: 0,
        totalSpent: 0,
        lastBooking: null,
        joinedAt: TODAY_ISO,
        notes: v.notes || '',
        tier: 'New',
      };
      dispatch({ type: 'ADD_CUSTOMER', payload: created });
      onSaved?.(created.id);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={customer ? `Edit ${customer.name}` : 'Add new customer'}
      description={customer ? 'Update contact details and customer status.' : 'Create a customer record to start taking bookings.'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            leftIcon={customer ? <Save className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
            onClick={handleSubmit(onSubmit)}
          >
            {customer ? 'Save changes' : 'Add customer'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" required error={errors.name?.message} className="sm:col-span-2">
            <Input {...register('name')} placeholder="e.g. Aarav Mehta" invalid={!!errors.name} />
          </Field>
          <Field label="Mobile number" required error={errors.phone?.message} hint="10-digit Indian mobile number">
            <Input {...register('phone')} placeholder="9829012345" invalid={!!errors.phone} leftIcon={<span className="text-[12px]">+91</span>} />
          </Field>
          <Field label="Email address" required error={errors.email?.message}>
            <Input {...register('email')} type="email" placeholder="name@example.com" invalid={!!errors.email} />
          </Field>
          <Field label="Address" required error={errors.address?.message} className="sm:col-span-2">
            <Input {...register('address')} placeholder="Flat / house, street, locality" invalid={!!errors.address} />
          </Field>
          <Field label="City" required error={errors.city?.message}>
            <Select {...register('city')} options={cities.map((c) => ({ value: c, label: c }))} invalid={!!errors.city} />
          </Field>
          <Field label="Customer status" required>
            <Select {...register('status')} options={customerStatuses.map((s) => ({ value: s, label: s }))} />
          </Field>
        </div>
        <Field label="Notes" hint="Preferences, vehicle care instructions, payment behaviour">
          <Textarea {...register('notes')} rows={3} placeholder="e.g. Prefers Saturday morning slots; mild shampoo only." />
        </Field>
      </form>
    </Modal>
  );
}
