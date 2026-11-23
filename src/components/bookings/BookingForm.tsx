import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarPlus, Save } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { useStore, nextId } from '@/context/StoreContext';
import { formatINR } from '@/utils/format';
import { TODAY_ISO } from '@/utils/date';
import { TIME_SLOTS, bookingStatuses, paymentStatuses } from '@/utils/statusStyles';
import type { Booking, BookingStatus, PaymentStatus } from '@/types';

const schema = z.object({
  customerId: z.string().min(1, 'Select a customer'),
  vehicleId: z.string().min(1, 'Select a vehicle'),
  serviceId: z.string().min(1, 'Select a service'),
  addonId: z.string().optional(),
  date: z.string().min(1, 'Booking date is required'),
  timeSlot: z.string().min(1, 'Select a time slot'),
  price: z.coerce.number().min(1, 'Price must be greater than 0'),
  discount: z.coerce.number().min(0).max(100000).optional(),
  paymentStatus: z.enum(['Pending', 'Paid', 'Partial', 'Refunded']),
  status: z.string().min(1),
  assignedStaffId: z.string().min(1, 'Assign a staff member'),
  source: z.string().min(1),
  notes: z.string().max(500).optional(),
  internalNotes: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

export function BookingFormModal({
  open,
  onClose,
  booking,
  presetCustomerId,
}: {
  open: boolean;
  onClose: () => void;
  booking?: Booking | null;
  presetCustomerId?: string;
}) {
  const { customers, vehicles, services, staff, bookings, dispatch } = useStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: '',
      vehicleId: '',
      serviceId: '',
      addonId: '',
      date: TODAY_ISO,
      timeSlot: '',
      price: 0,
      discount: 0,
      paymentStatus: 'Pending',
      status: 'New',
      assignedStaffId: '',
      source: 'Phone',
      notes: '',
      internalNotes: '',
    },
  });

  const customerId = watch('customerId');
  const serviceId = watch('serviceId');
  const addonId = watch('addonId');
  const discount = watch('discount') || 0;

  const customerOptions = useMemo(
    () => customers.map((c) => ({ value: c.id, label: `${c.name} · ${c.phone}` })),
    [customers]
  );
  const vehicleOptions = useMemo(
    () =>
      vehicles
        .filter((v) => v.ownerId === customerId)
        .map((v) => ({ value: v.id, label: `${v.registration} — ${v.brand} ${v.model}` })),
    [vehicles, customerId]
  );
  const serviceOptions = useMemo(
    () => services.filter((s) => s.active).map((s) => ({ value: s.id, label: `${s.name} · ${formatINR(s.price)}` })),
    [services]
  );
  const staffOptions = useMemo(
    () => staff.filter((s) => s.status !== 'Inactive' && s.role !== 'Accountant').map((s) => ({ value: s.id, label: `${s.name} · ${s.role}` })),
    [staff]
  );

  const subtotal = useMemo(() => {
    const base = services.find((s) => s.id === serviceId)?.price || 0;
    const addon = services.find((s) => s.id === addonId)?.price || 0;
    return base + addon;
  }, [services, serviceId, addonId]);

  const tax = Math.round((subtotal - discount) * 0.18);
  const total = Math.max(0, subtotal - discount + tax);

  // sync price when services change
  useEffect(() => {
    setValue('price', subtotal);
  }, [subtotal, setValue]);

  // keep vehicle valid for chosen customer
  useEffect(() => {
    if (booking) return;
    const current = vehicles.find((v) => v.id === watch('vehicleId'));
    if (current && current.ownerId !== customerId) setValue('vehicleId', '');
  }, [customerId, vehicles, setValue, watch, booking]);

  useEffect(() => {
    if (!open) return;
    if (booking) {
      reset({
        customerId: booking.customerId,
        vehicleId: booking.vehicleId,
        serviceId: booking.serviceIds[0] || '',
        addonId: booking.serviceIds[1] || '',
        date: booking.date,
        timeSlot: booking.timeSlot,
        price: booking.amount,
        discount: booking.discount,
        paymentStatus: booking.paymentStatus,
        status: booking.status,
        assignedStaffId: booking.assignedStaffId,
        source: booking.source,
        notes: booking.notes,
        internalNotes: booking.internalNotes,
      });
    } else {
      reset({
        customerId: presetCustomerId || '',
        vehicleId: '',
        serviceId: '',
        addonId: '',
        date: TODAY_ISO,
        timeSlot: '',
        price: 0,
        discount: 0,
        paymentStatus: 'Pending',
        status: 'New',
        assignedStaffId: '',
        source: 'Phone',
        notes: '',
        internalNotes: '',
      });
    }
  }, [open, booking, reset, presetCustomerId]);

  const onSubmit = (values: FormValues) => {
    const serviceIds = [values.serviceId, values.addonId].filter(Boolean) as string[];
    const paidAmount =
      values.paymentStatus === 'Paid' ? total : values.paymentStatus === 'Partial' ? Math.round(total / 2) : 0;

    if (booking) {
      dispatch({
        type: 'UPDATE_BOOKING',
        payload: {
          ...booking,
          customerId: values.customerId,
          vehicleId: values.vehicleId,
          serviceIds,
          date: values.date,
          timeSlot: values.timeSlot,
          amount: total,
          discount: values.discount || 0,
          tax,
          paidAmount,
          paymentStatus: values.paymentStatus as PaymentStatus,
          status: values.status as BookingStatus,
          assignedStaffId: values.assignedStaffId,
          source: values.source as Booking['source'],
          notes: values.notes || '',
          internalNotes: values.internalNotes || '',
        },
      });
    } else {
      const newBooking: Booking = {
        id: nextId('BKG', bookings),
        customerId: values.customerId,
        vehicleId: values.vehicleId,
        serviceIds,
        date: values.date,
        timeSlot: values.timeSlot,
        amount: total,
        discount: values.discount || 0,
        tax,
        paidAmount,
        paymentStatus: values.paymentStatus as PaymentStatus,
        assignedStaffId: values.assignedStaffId,
        status: values.status as BookingStatus,
        source: values.source as Booking['source'],
        notes: values.notes || '',
        internalNotes: values.internalNotes || '',
        createdAt: new Date().toISOString(),
        timeline: [
          {
            status: values.status as BookingStatus,
            at: new Date().toISOString(),
            by: 'Rajesh Sharma',
            note: 'Booking created from CRM',
          },
        ],
      };
      dispatch({ type: 'ADD_BOOKING', payload: newBooking });
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={booking ? `Edit booking ${booking.id}` : 'Create new booking'}
      description={
        booking
          ? 'Update booking details, assignment and payment information.'
          : 'Schedule a wash or detailing job for a customer and assign a bay technician.'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            leftIcon={booking ? <Save className="h-3.5 w-3.5" /> : <CalendarPlus className="h-3.5 w-3.5" />}
            loading={isSubmitting}
            onClick={handleSubmit(onSubmit)}
          >
            {booking ? 'Save changes' : 'Create booking'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Customer" required error={errors.customerId?.message}>
            <Select
              {...register('customerId')}
              options={customerOptions}
              placeholder="Select customer"
              invalid={!!errors.customerId}
            />
          </Field>
          <Field
            label="Vehicle"
            required
            error={errors.vehicleId?.message}
            hint={!customerId ? 'Select a customer first' : vehicleOptions.length === 0 ? 'No vehicles on file' : undefined}
          >
            <Select
              {...register('vehicleId')}
              options={vehicleOptions}
              placeholder={customerId ? 'Select vehicle' : 'Awaiting customer'}
              disabled={!customerId}
              invalid={!!errors.vehicleId}
            />
          </Field>

          <Field label="Service" required error={errors.serviceId?.message}>
            <Select {...register('serviceId')} options={serviceOptions} placeholder="Select service" invalid={!!errors.serviceId} />
          </Field>
          <Field label="Add-on service" hint="Optional — billed together">
            <Select {...register('addonId')} options={serviceOptions} placeholder="No add-on" />
          </Field>

          <Field label="Booking date" required error={errors.date?.message}>
            <Input type="date" {...register('date')} invalid={!!errors.date} />
          </Field>
          <Field label="Time slot" required error={errors.timeSlot?.message}>
            <Select
              {...register('timeSlot')}
              options={TIME_SLOTS.map((t) => ({ value: t, label: t }))}
              placeholder="Select slot"
              invalid={!!errors.timeSlot}
            />
          </Field>

          <Field label="Assigned staff" required error={errors.assignedStaffId?.message}>
            <Select {...register('assignedStaffId')} options={staffOptions} placeholder="Assign technician" invalid={!!errors.assignedStaffId} />
          </Field>
          <Field label="Booking source">
            <Select
              {...register('source')}
              options={['Phone', 'Walk-in', 'Website', 'Mobile App', 'WhatsApp'].map((s) => ({ value: s, label: s }))}
            />
          </Field>

          <Field label="Price (INR)" required error={errors.price?.message} hint="Auto-filled from selected services">
            <Input type="number" {...register('price')} invalid={!!errors.price} leftIcon={<span className="text-[12px]">₹</span>} />
          </Field>
          <Field label="Discount (INR)" error={errors.discount?.message}>
            <Input type="number" {...register('discount')} leftIcon={<span className="text-[12px]">₹</span>} />
          </Field>

          <Field label="Payment status">
            <Select {...register('paymentStatus')} options={paymentStatuses.map((s) => ({ value: s, label: s }))} />
          </Field>
          <Field label="Booking status">
            <Select {...register('status')} options={bookingStatuses.map((s) => ({ value: s, label: s }))} />
          </Field>
        </div>

        <Field label="Customer notes" hint="Visible to the customer">
          <Textarea {...register('notes')} rows={2} placeholder="Special instructions, pickup preferences…" />
        </Field>
        <Field label="Internal notes" hint="Visible to staff only">
          <Textarea {...register('internalNotes')} rows={2} placeholder="Vehicle condition, payment reminders…" />
        </Field>

        {/* Price summary */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="space-y-1.5 text-[12.5px]">
            <div className="flex justify-between text-slate-600">
              <span>Services subtotal</span>
              <span className="tabular-nums">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Discount</span>
              <span className="tabular-nums text-rose-600">− {formatINR(discount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST (18%)</span>
              <span className="tabular-nums">{formatINR(tax)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5 text-[13.5px] font-semibold text-navy-900">
              <span>Total payable</span>
              <span className="tabular-nums">{formatINR(total)}</span>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
