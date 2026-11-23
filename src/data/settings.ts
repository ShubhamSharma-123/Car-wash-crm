import type { BusinessProfile } from '@/types';
import { TODAY_ISO } from '@/utils/date';

export const defaultBusinessProfile: BusinessProfile = {
  name: 'AutoSutraa Car Spa & Detailing',
  tagline: 'Premium car care, delivered with precision.',
  phone: '+91 98290 44120',
  email: 'care@autosutraa.in',
  website: 'www.autosutraa.in',
  address: 'Plot 14, Ajmer Road, Near Nimble Chowk',
  city: 'Jaipur, Rajasthan 302019',
  gstin: '08ABACA1234F1ZQ',
  currency: 'INR',
  workingHours: [
    { day: 'Monday', open: '08:00 AM', close: '08:00 PM', closed: false },
    { day: 'Tuesday', open: '08:00 AM', close: '08:00 PM', closed: false },
    { day: 'Wednesday', open: '08:00 AM', close: '08:00 PM', closed: false },
    { day: 'Thursday', open: '08:00 AM', close: '08:00 PM', closed: false },
    { day: 'Friday', open: '08:00 AM', close: '09:00 PM', closed: false },
    { day: 'Saturday', open: '07:30 AM', close: '09:00 PM', closed: false },
    { day: 'Sunday', open: '09:00 AM', close: '06:00 PM', closed: false },
  ],
  timeSlots: [
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
  ],
  servicePreferences: {
    autoAssignStaff: true,
    requireAdvancePayment: false,
    allowSameDayBooking: true,
    sendWhatsAppUpdates: true,
    graceMinutes: 15,
  },
  notificationPreferences: {
    bookingConfirmation: true,
    bookingReminder: true,
    paymentReceipt: true,
    promotionalCampaigns: false,
    dailySummaryEmail: true,
  },
};

export const currentUser = {
  name: 'Rajesh Sharma',
  role: 'Super Admin',
  email: 'rajesh@autosutraa.in',
  phone: '+91 98290 44120',
  designation: 'Business Owner',
  staffId: 'STF-001',
  joinedAt: '2023-02-14',
  lastLogin: `${TODAY_ISO} 08:12 AM`,
};
