/* ------------------------------------------------------------------
   AutoSutraa CRM — shared domain types
   All data in this prototype is local + typed. No API layer.
------------------------------------------------------------------ */

export type BookingStatus =
  | 'New'
  | 'Confirmed'
  | 'Vehicle Received'
  | 'In Progress'
  | 'Quality Check'
  | 'Ready'
  | 'Completed'
  | 'Cancelled'
  | 'Rescheduled'
  | 'No Show';

export type PaymentStatus = 'Pending' | 'Paid' | 'Partial' | 'Refunded';

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Online';

export type CustomerStatus = 'Active' | 'Inactive' | 'VIP' | 'Blocked';

export type ServiceCategory =
  | 'Wash'
  | 'Detailing'
  | 'Protection'
  | 'Interior'
  | 'Add-on';

export type VehicleType = 'Hatchback' | 'Sedan' | 'SUV' | 'MUV' | 'Luxury' | 'Two Wheeler';

export type StaffRole = 'Super Admin' | 'Admin' | 'Manager' | 'Staff' | 'Accountant';

export type StaffStatus = 'Active' | 'On Leave' | 'Inactive';

export type NotificationType =
  | 'Booking Confirmation'
  | 'Booking Reminder'
  | 'Booking Rescheduled'
  | 'Booking Cancellation'
  | 'Service Started'
  | 'Vehicle Ready'
  | 'Service Completed'
  | 'Payment Confirmation'
  | 'Invoice Generated'
  | 'Promotional';

export type BookingSource = 'Phone' | 'Walk-in' | 'Website' | 'Mobile App' | 'WhatsApp';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  status: CustomerStatus;
  totalBookings: number;
  totalSpent: number;
  lastBooking: string | null;
  joinedAt: string;
  notes: string;
  tier: 'New' | 'Returning' | 'Regular' | 'VIP';
}

export interface Vehicle {
  id: string;
  registration: string;
  type: VehicleType;
  brand: string;
  model: string;
  color: string;
  ownerId: string;
  lastService: string | null;
  nextService: string | null;
  fuelType: 'Petrol' | 'Diesel' | 'CNG' | 'Electric' | 'Hybrid';
  year: number;
  notes?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // minutes
  vehicleTypes: VehicleType[];
  category: ServiceCategory;
  active: boolean;
  imageTone: string; // gradient token used for the thumbnail
  bookings: number; // lifetime bookings (for reporting)
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  status: StaffStatus;
  designation: string;
  assignedBookings: number;
  completedServices: number;
  rating: number;
  joinedAt: string;
  shift: string;
  skills: string[];
  avatarTone: string;
  permissions: Record<string, boolean>;
  activity: { id: string; label: string; at: string }[];
}

export interface Booking {
  id: string;
  customerId: string;
  vehicleId: string;
  serviceIds: string[];
  date: string; // yyyy-mm-dd
  timeSlot: string;
  amount: number;
  discount: number;
  tax: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  assignedStaffId: string;
  status: BookingStatus;
  source: BookingSource;
  notes: string;
  internalNotes: string;
  createdAt: string;
  timeline: { status: BookingStatus; at: string; by: string; note?: string }[];
}

export interface Payment {
  id: string;
  bookingId: string;
  customerId: string;
  date: string;
  method: PaymentMethod;
  totalAmount: number;
  paidAmount: number;
  status: PaymentStatus;
  reference: string;
  collectedBy: string;
  notes?: string;
}

export interface InvoiceLine {
  label: string;
  qty: number;
  rate: number;
}

export interface Invoice {
  id: string;
  bookingId: string;
  customerId: string;
  date: string;
  dueDate: string;
  lines: InvoiceLine[];
  discount: number;
  taxRate: number;
  paymentStatus: PaymentStatus;
  paidAmount: number;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  at: string;
  read: boolean;
  bookingId?: string;
  customerId?: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  at: string;
  kind: 'booking' | 'payment' | 'customer' | 'staff' | 'service';
}

export interface BusinessProfile {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  gstin: string;
  currency: 'INR';
  workingHours: { day: string; open: string; close: string; closed: boolean }[];
  timeSlots: string[];
  servicePreferences: {
    autoAssignStaff: boolean;
    requireAdvancePayment: boolean;
    allowSameDayBooking: boolean;
    sendWhatsAppUpdates: boolean;
    graceMinutes: number;
  };
  notificationPreferences: {
    bookingConfirmation: boolean;
    bookingReminder: boolean;
    paymentReceipt: boolean;
    promotionalCampaigns: boolean;
    dailySummaryEmail: boolean;
  };
}

export interface RevenuePoint {
  label: string;
  revenue: number;
  previous: number;
  bookings: number;
  expenses: number;
}

export interface SeriesPoint {
  label: string;
  value: number;
  secondary?: number;
}

export interface StaffPerformance {
  staffId: string;
  name: string;
  completed: number;
  assigned: number;
  revenue: number;
  rating: number;
  onTime: number;
}

export interface ReportSummary {
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  totalBookings: number;
  completedServices: number;
  cancelledBookings: number;
  newCustomers: number;
  returningRate: number;
  avgTicket: number;
  collectionRate: number;
}

export interface PaginationState {
  page: number;
  pageSize: number;
}
