import type {
  BookingStatus,
  CustomerStatus,
  PaymentStatus,
  StaffRole,
  StaffStatus,
  NotificationType,
} from '@/types';

type Tone = 'slate' | 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'teal' | 'sky' | 'indigo';

export const bookingStatusStyle: Record<BookingStatus, { tone: Tone; dot: string }> = {
  New: { tone: 'blue', dot: 'bg-brand-500' },
  Confirmed: { tone: 'indigo', dot: 'bg-indigo-500' },
  'Vehicle Received': { tone: 'sky', dot: 'bg-sky-500' },
  'In Progress': { tone: 'amber', dot: 'bg-amber-500' },
  'Quality Check': { tone: 'violet', dot: 'bg-violet-500' },
  Ready: { tone: 'teal', dot: 'bg-teal-500' },
  Completed: { tone: 'green', dot: 'bg-emerald-500' },
  Cancelled: { tone: 'red', dot: 'bg-rose-500' },
  Rescheduled: { tone: 'slate', dot: 'bg-slate-400' },
  'No Show': { tone: 'slate', dot: 'bg-slate-400' },
};

export const paymentStatusStyle: Record<PaymentStatus, { tone: Tone; dot: string }> = {
  Paid: { tone: 'green', dot: 'bg-emerald-500' },
  Pending: { tone: 'amber', dot: 'bg-amber-500' },
  Partial: { tone: 'blue', dot: 'bg-brand-500' },
  Refunded: { tone: 'red', dot: 'bg-rose-500' },
};

export const customerStatusStyle: Record<CustomerStatus, { tone: Tone; dot: string }> = {
  Active: { tone: 'green', dot: 'bg-emerald-500' },
  Inactive: { tone: 'slate', dot: 'bg-slate-400' },
  VIP: { tone: 'violet', dot: 'bg-violet-500' },
  Blocked: { tone: 'red', dot: 'bg-rose-500' },
};

export const staffStatusStyle: Record<StaffStatus, { tone: Tone; dot: string }> = {
  Active: { tone: 'green', dot: 'bg-emerald-500' },
  'On Leave': { tone: 'amber', dot: 'bg-amber-500' },
  Inactive: { tone: 'slate', dot: 'bg-slate-400' },
};

export const roleStyle: Record<StaffRole, Tone> = {
  'Super Admin': 'violet',
  Admin: 'indigo',
  Manager: 'blue',
  Staff: 'slate',
  Accountant: 'teal',
};

export const notificationTypeStyle: Record<NotificationType, { tone: Tone; icon: string }> = {
  'Booking Confirmation': { tone: 'blue', icon: 'calendar-check' },
  'Booking Reminder': { tone: 'amber', icon: 'bell' },
  'Booking Rescheduled': { tone: 'indigo', icon: 'calendar-clock' },
  'Booking Cancellation': { tone: 'red', icon: 'calendar-x' },
  'Service Started': { tone: 'sky', icon: 'sparkles' },
  'Vehicle Ready': { tone: 'teal', icon: 'car' },
  'Service Completed': { tone: 'green', icon: 'circle-check' },
  'Payment Confirmation': { tone: 'green', icon: 'wallet' },
  'Invoice Generated': { tone: 'violet', icon: 'receipt' },
  Promotional: { tone: 'slate', icon: 'megaphone' },
};

/** Ordered happy-path lifecycle used by the progress tracker. */
export const BOOKING_FLOW: BookingStatus[] = [
  'New',
  'Confirmed',
  'Vehicle Received',
  'In Progress',
  'Quality Check',
  'Ready',
  'Completed',
];

export const terminalStatuses: BookingStatus[] = ['Cancelled', 'Rescheduled', 'No Show'];

export const paymentMethods = ['Cash', 'UPI', 'Card', 'Online'] as const;
export const bookingStatuses: BookingStatus[] = [
  ...BOOKING_FLOW,
  'Cancelled',
  'Rescheduled',
  'No Show',
];
export const paymentStatuses: PaymentStatus[] = ['Pending', 'Paid', 'Partial', 'Refunded'];
export const customerStatuses: CustomerStatus[] = ['Active', 'VIP', 'Inactive', 'Blocked'];
export const staffRoles: StaffRole[] = ['Super Admin', 'Admin', 'Manager', 'Staff', 'Accountant'];
export const staffStatuses: StaffStatus[] = ['Active', 'On Leave', 'Inactive'];

export const TIME_SLOTS = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
];
