import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wallet, Save } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { useStore, nextId } from '@/context/StoreContext';
import { formatINR } from '@/utils/format';
import { TODAY_ISO } from '@/utils/date';
import { paymentMethods, paymentStatuses } from '@/utils/statusStyles';
import type { Payment, PaymentMethod, PaymentStatus } from '@/types';

const schema = z.object({
  bookingId: z.string().min(1, 'Select a booking'),
  method: z.enum(['Cash', 'UPI', 'Card', 'Online']),
  paidAmount: z.coerce.number().min(0, 'Amount cannot be negative'),
  status: z.enum(['Pending', 'Paid', 'Partial', 'Refunded']),
  date: z.string().min(1, 'Select a date'),
  reference: z.string().optional(),
  collectedBy: z.string().min(2, 'Enter who collected the payment'),
  notes: z.string().max(300).optional(),
});

type FormValues = z.infer<typeof schema>;

export function PaymentFormModal({
  open,
  onClose,
  payment,
  presetBookingId,
}: {
  open: boolean;
  onClose: () => void;
  payment?: Payment | null;
  presetBookingId?: string;
}) {
  const { payments, bookings, customerById, dispatch, user } = useStore();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bookingId: '',
      method: 'UPI',
      paidAmount: 0,
      status: 'Paid',
      date: TODAY_ISO,
      reference: '',
      collectedBy: user.name,
      notes: '',
    },
  });

  const bookingId = watch('bookingId');
  const selectedBooking = bookings.find((b) => b.id === bookingId);
  const openBookings = useMemo(
    () =>
      bookings
        .filter((b) => !['Cancelled', 'No Show'].includes(b.status))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 120)
        .map((b) => {
          const c = customerById(b.customerId);
          return { value: b.id, label: `${b.id} · ${c?.name} · ${formatINR(b.amount - b.paidAmount)} due` };
        }),
    [bookings, customerById]
  );

  useEffect(() => {
    if (!open) return;
    reset(
      payment
        ? {
            bookingId: payment.bookingId,
            method: payment.method,
            paidAmount: payment.paidAmount,
            status: payment.status,
            date: payment.date,
            reference: payment.reference,
            collectedBy: payment.collectedBy,
            notes: payment.notes || '',
          }
        : {
            bookingId: presetBookingId || '',
            method: 'UPI',
            paidAmount: 0,
            status: 'Paid',
            date: TODAY_ISO,
            reference: '',
            collectedBy: user.name,
            notes: '',
          }
    );
  }, [open, payment, presetBookingId, reset, user.name]);

  useEffect(() => {
    if (selectedBooking && !payment) setValue('paidAmount', selectedBooking.amount - selectedBooking.paidAmount);
  }, [selectedBooking, setValue, payment]);

  const onSubmit = (v: FormValues) => {
    const booking = bookings.find((b) => b.id === v.bookingId);
    const payload: Payment = {
      id: payment?.id || nextId('TXN', payments),
      bookingId: v.bookingId,
      customerId: booking?.customerId || '',
      date: v.date,
      method: v.method as PaymentMethod,
      totalAmount: booking?.amount || v.paidAmount,
      paidAmount: v.paidAmount,
      status: v.status as PaymentStatus,
      reference: v.reference || '—',
      collectedBy: v.collectedBy,
      notes: v.notes || '',
    };
    dispatch(payment ? { type: 'UPDATE_PAYMENT', payload } : { type: 'ADD_PAYMENT', payload });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={payment ? `Edit ${payment.id}` : 'Record payment'}
      description={payment ? 'Correct the payment method, amount or status.' : 'Log a collection against an existing booking.'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" leftIcon={payment ? <Save className="h-3.5 w-3.5" /> : <Wallet className="h-3.5 w-3.5" />} onClick={handleSubmit(onSubmit)}>
            {payment ? 'Save changes' : 'Record payment'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Booking" required error={errors.bookingId?.message}>
          <Select {...register('bookingId')} options={openBookings} placeholder="Select booking" invalid={!!errors.bookingId} />
        </Field>

        {selectedBooking && (
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-center">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.05em] text-slate-400">Invoice total</p>
              <p className="text-[13.5px] font-semibold tabular-nums text-navy-900">{formatINR(selectedBooking.amount)}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.05em] text-slate-400">Already paid</p>
              <p className="text-[13.5px] font-semibold tabular-nums text-emerald-600">{formatINR(selectedBooking.paidAmount)}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.05em] text-slate-400">Balance</p>
              <p className="text-[13.5px] font-semibold tabular-nums text-amber-600">
                {formatINR(selectedBooking.amount - selectedBooking.paidAmount)}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Payment method" required>
            <Select {...register('method')} options={paymentMethods.map((m) => ({ value: m, label: m }))} />
          </Field>
          <Field label="Payment status" required>
            <Select {...register('status')} options={paymentStatuses.map((s) => ({ value: s, label: s }))} />
          </Field>
          <Field label="Amount collected (INR)" required error={errors.paidAmount?.message}>
            <Input type="number" {...register('paidAmount')} invalid={!!errors.paidAmount} leftIcon={<span className="text-[12px]">₹</span>} />
          </Field>
          <Field label="Payment date" required error={errors.date?.message}>
            <Input type="date" {...register('date')} invalid={!!errors.date} />
          </Field>
          <Field label="Transaction reference" hint="UPI ref / card auth code">
            <Input {...register('reference')} placeholder="UPI482910377" />
          </Field>
          <Field label="Collected by" required error={errors.collectedBy?.message}>
            <Input {...register('collectedBy')} invalid={!!errors.collectedBy} />
          </Field>
        </div>
        <Field label="Notes" hint="Part-payment reason, pending balance, refund note">
          <Textarea {...register('notes')} rows={2} placeholder="Balance to be collected at pickup." />
        </Field>
      </form>
    </Modal>
  );
}
