import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type {
  AppNotification,
  Booking,
  BookingStatus,
  BusinessProfile,
  Customer,
  Invoice,
  Payment,
  PaymentStatus,
  Service,
  Staff,
  Vehicle,
} from '@/types';
import { bookings as seedBookings } from '@/data/bookings';
import { customers as seedCustomers } from '@/data/customers';
import { vehicles as seedVehicles } from '@/data/vehicles';
import { services as seedServices } from '@/data/services';
import { staff as seedStaff } from '@/data/staff';
import { payments as seedPayments } from '@/data/payments';
import { invoices as seedInvoices } from '@/data/invoices';
import { notifications as seedNotifications } from '@/data/notifications';
import { defaultBusinessProfile } from '@/data/settings';

const STORAGE_KEY = 'autosutraa-crm-v2';

export interface State {
  customers: Customer[];
  vehicles: Vehicle[];
  bookings: Booking[];
  services: Service[];
  staff: Staff[];
  payments: Payment[];
  invoices: Invoice[];
  notifications: AppNotification[];
  settings: BusinessProfile;
  user: { name: string; role: string; email: string; phone: string };
  hydrated: boolean;
}

type Action =
  | { type: 'HYDRATE'; payload: Partial<State> }
  | { type: 'ADD_BOOKING'; payload: Booking }
  | { type: 'UPDATE_BOOKING'; payload: Booking }
  | { type: 'DELETE_BOOKING'; payload: string }
  | { type: 'SET_BOOKING_STATUS'; payload: { id: string; status: BookingStatus; by: string; note?: string } }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'ADD_VEHICLE'; payload: Vehicle }
  | { type: 'UPDATE_VEHICLE'; payload: Vehicle }
  | { type: 'DELETE_VEHICLE'; payload: string }
  | { type: 'ADD_SERVICE'; payload: Service }
  | { type: 'UPDATE_SERVICE'; payload: Service }
  | { type: 'DELETE_SERVICE'; payload: string }
  | { type: 'ADD_STAFF'; payload: Staff }
  | { type: 'UPDATE_STAFF'; payload: Staff }
  | { type: 'DELETE_STAFF'; payload: string }
  | { type: 'ADD_PAYMENT'; payload: Payment }
  | { type: 'UPDATE_PAYMENT'; payload: Payment }
  | { type: 'DELETE_PAYMENT'; payload: string }
  | { type: 'UPDATE_INVOICE'; payload: Invoice }
  | { type: 'MARK_NOTIFICATION'; payload: { id: string; read: boolean } }
  | { type: 'MARK_ALL_NOTIFICATIONS' }
  | { type: 'DELETE_NOTIFICATION'; payload: string }
  | { type: 'PUSH_NOTIFICATION'; payload: AppNotification }
  | { type: 'UPDATE_SETTINGS'; payload: BusinessProfile }
  | { type: 'UPDATE_USER'; payload: Partial<State['user']> }
  | { type: 'RESET_DATA' };

const initialState: State = {
  customers: seedCustomers,
  vehicles: seedVehicles,
  bookings: seedBookings,
  services: seedServices,
  staff: seedStaff,
  payments: seedPayments,
  invoices: seedInvoices,
  notifications: seedNotifications,
  settings: defaultBusinessProfile,
  user: {
    name: 'Rajesh Sharma',
    role: 'Super Admin',
    email: 'rajesh@autosutraa.in',
    phone: '+91 98290 44120',
  },
  hydrated: false,
};

/** Recompute denormalised customer aggregates after any booking change. */
function syncCustomerStats(state: State): State {
  const customers = state.customers.map((c) => {
    const list = state.bookings.filter((b) => b.customerId === c.id);
    const valid = list.filter((b) => !['Cancelled', 'No Show'].includes(b.status));
    return {
      ...c,
      totalBookings: valid.length,
      totalSpent: list.reduce((a, b) => a + b.paidAmount, 0),
      lastBooking: list.length ? list.map((b) => b.date).sort().at(-1) || null : null,
    };
  });
  return { ...state, customers };
}

function syncInvoiceAndPayment(state: State, booking: Booking): State {
  const invoices = state.invoices.map((inv) =>
    inv.bookingId === booking.id ? { ...inv, paymentStatus: booking.paymentStatus, paidAmount: booking.paidAmount } : inv
  );
  const payments = state.payments.map((p) =>
    p.bookingId === booking.id ? { ...p, status: booking.paymentStatus, paidAmount: booking.paidAmount } : p
  );
  return { ...state, invoices, payments };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload, hydrated: true };

    case 'ADD_BOOKING': {
      const next = { ...state, bookings: [action.payload, ...state.bookings] };
      return syncCustomerStats(next);
    }
    case 'UPDATE_BOOKING': {
      const next = {
        ...state,
        bookings: state.bookings.map((b) => (b.id === action.payload.id ? action.payload : b)),
      };
      return syncCustomerStats(syncInvoiceAndPayment(next, action.payload));
    }
    case 'DELETE_BOOKING':
      return syncCustomerStats({
        ...state,
        bookings: state.bookings.filter((b) => b.id !== action.payload),
      });

    case 'SET_BOOKING_STATUS': {
      const booking = state.bookings.find((b) => b.id === action.payload.id);
      if (!booking) return state;
      const updated: Booking = {
        ...booking,
        status: action.payload.status,
        timeline: [
          ...booking.timeline,
          {
            status: action.payload.status,
            at: new Date().toISOString(),
            by: action.payload.by,
            note: action.payload.note,
          },
        ],
      };
      const next = {
        ...state,
        bookings: state.bookings.map((b) => (b.id === updated.id ? updated : b)),
      };
      return syncCustomerStats(next);
    }

    case 'ADD_CUSTOMER':
      return { ...state, customers: [action.payload, ...state.customers] };
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map((c) => (c.id === action.payload.id ? { ...c, ...action.payload } : c)),
      };
    case 'DELETE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.filter((c) => c.id !== action.payload),
        vehicles: state.vehicles.filter((v) => v.ownerId !== action.payload),
      };

    case 'ADD_VEHICLE':
      return { ...state, vehicles: [action.payload, ...state.vehicles] };
    case 'UPDATE_VEHICLE':
      return {
        ...state,
        vehicles: state.vehicles.map((v) => (v.id === action.payload.id ? action.payload : v)),
      };
    case 'DELETE_VEHICLE':
      return { ...state, vehicles: state.vehicles.filter((v) => v.id !== action.payload) };

    case 'ADD_SERVICE':
      return { ...state, services: [action.payload, ...state.services] };
    case 'UPDATE_SERVICE':
      return {
        ...state,
        services: state.services.map((s) => (s.id === action.payload.id ? action.payload : s)),
      };
    case 'DELETE_SERVICE':
      return { ...state, services: state.services.filter((s) => s.id !== action.payload) };

    case 'ADD_STAFF':
      return { ...state, staff: [action.payload, ...state.staff] };
    case 'UPDATE_STAFF':
      return {
        ...state,
        staff: state.staff.map((s) => (s.id === action.payload.id ? action.payload : s)),
      };
    case 'DELETE_STAFF':
      return { ...state, staff: state.staff.filter((s) => s.id !== action.payload) };

    case 'ADD_PAYMENT': {
      const next = { ...state, payments: [action.payload, ...state.payments] };
      const booking = next.bookings.find((b) => b.id === action.payload.bookingId);
      if (!booking) return next;
      const status: PaymentStatus = action.payload.status;
      const updatedBooking: Booking = {
        ...booking,
        paymentStatus: status,
        paidAmount: action.payload.paidAmount,
      };
      const withBooking = {
        ...next,
        bookings: next.bookings.map((b) => (b.id === updatedBooking.id ? updatedBooking : b)),
      };
      return syncCustomerStats(syncInvoiceAndPayment(withBooking, updatedBooking));
    }
    case 'UPDATE_PAYMENT': {
      const next = {
        ...state,
        payments: state.payments.map((p) => (p.id === action.payload.id ? action.payload : p)),
      };
      const booking = next.bookings.find((b) => b.id === action.payload.bookingId);
      if (!booking) return next;
      const updatedBooking: Booking = {
        ...booking,
        paymentStatus: action.payload.status,
        paidAmount: action.payload.paidAmount,
      };
      const withBooking = {
        ...next,
        bookings: next.bookings.map((b) => (b.id === updatedBooking.id ? updatedBooking : b)),
      };
      return syncCustomerStats(syncInvoiceAndPayment(withBooking, updatedBooking));
    }
    case 'DELETE_PAYMENT':
      return { ...state, payments: state.payments.filter((p) => p.id !== action.payload) };

    case 'UPDATE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.map((i) => (i.id === action.payload.id ? action.payload : i)),
      };

    case 'MARK_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload.id ? { ...n, read: action.payload.read } : n
        ),
      };
    case 'MARK_ALL_NOTIFICATIONS':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };
    case 'DELETE_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.payload) };
    case 'PUSH_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: action.payload };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'RESET_DATA':
      return { ...initialState, hydrated: true };
    default:
      return state;
  }
}

interface StoreValue extends State {
  dispatch: React.Dispatch<Action>;
  // convenience lookups
  customerById: (id: string) => Customer | undefined;
  vehicleById: (id: string) => Vehicle | undefined;
  serviceById: (id: string) => Service | undefined;
  staffById: (id: string) => Staff | undefined;
  bookingById: (id: string) => Booking | undefined;
  unreadCount: number;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // hydrate once from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<State>;
        dispatch({ type: 'HYDRATE', payload: parsed });
      } else {
        dispatch({ type: 'HYDRATE', payload: {} });
      }
    } catch {
      dispatch({ type: 'HYDRATE', payload: {} });
    }
  }, []);

  // persist (skip before hydration so we never clobber saved data)
  useEffect(() => {
    if (!state.hydrated) return;
    try {
      const { hydrated, ...persist } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persist));
    } catch {
      /* storage full / private mode — prototype keeps working in memory */
    }
  }, [state]);

  const value = useMemo<StoreValue>(() => {
    const customerMap = new Map(state.customers.map((c) => [c.id, c]));
    const vehicleMap = new Map(state.vehicles.map((v) => [v.id, v]));
    const serviceMap = new Map(state.services.map((s) => [s.id, s]));
    const staffMap = new Map(state.staff.map((s) => [s.id, s]));
    const bookingMap = new Map(state.bookings.map((b) => [b.id, b]));
    return {
      ...state,
      dispatch,
      customerById: (id) => customerMap.get(id),
      vehicleById: (id) => vehicleMap.get(id),
      serviceById: (id) => serviceMap.get(id),
      staffById: (id) => staffMap.get(id),
      bookingById: (id) => bookingMap.get(id),
      unreadCount: state.notifications.filter((n) => !n.read).length,
    };
  }, [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

/** Generate the next sequential id, e.g. BKG-5515 */
export function nextId(prefix: string, existing: { id: string }[]) {
  const max = existing.reduce((acc, item) => {
    const n = Number(item.id.replace(/\D/g, ''));
    return Number.isNaN(n) ? acc : Math.max(acc, n);
  }, 0);
  return `${prefix}-${max + 1}`;
}
