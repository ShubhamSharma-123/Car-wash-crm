import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Car,
  Sparkles,
  UserCog,
  Wallet,
  ReceiptText,
  BarChart3,
  Bell,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badgeKey?: 'notifications' | 'bookings' | 'pendingPayments';
  description: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        to: '/',
        icon: LayoutDashboard,
        description: 'Business snapshot, revenue and live activity',
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        label: 'Bookings',
        to: '/bookings',
        icon: CalendarCheck,
        badgeKey: 'bookings',
        description: 'Manage the full booking lifecycle',
      },
      {
        label: 'Customers',
        to: '/customers',
        icon: Users,
        description: 'Profiles, history and customer value',
      },
      {
        label: 'Vehicles',
        to: '/vehicles',
        icon: Car,
        description: 'Fleet records and service reminders',
      },
      {
        label: 'Services',
        to: '/services',
        icon: Sparkles,
        description: 'Catalogue, pricing and packages',
      },
    ],
  },
  {
    title: 'Team & Finance',
    items: [
      {
        label: 'Staff Management',
        to: '/staff',
        icon: UserCog,
        description: 'Roles, assignments and performance',
      },
      {
        label: 'Payments',
        to: '/payments',
        icon: Wallet,
        badgeKey: 'pendingPayments',
        description: 'Collections, methods and reconciliation',
      },
      {
        label: 'Invoices',
        to: '/invoices',
        icon: ReceiptText,
        description: 'Tax invoices, print and download',
      },
      {
        label: 'Reports & Analytics',
        to: '/reports',
        icon: BarChart3,
        description: 'Revenue, retention and export centre',
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        label: 'Notifications',
        to: '/notifications',
        icon: Bell,
        badgeKey: 'notifications',
        description: 'Alerts across CRM and customer app',
      },
      {
        label: 'Settings',
        to: '/settings',
        icon: Settings,
        description: 'Business profile and preferences',
      },
    ],
  },
];

export const allNavItems = navGroups.flatMap((g) => g.items);
