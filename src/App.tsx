import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Bookings = lazy(() => import('@/pages/Bookings'));
const BookingDetails = lazy(() => import('@/pages/BookingDetails'));
const Customers = lazy(() => import('@/pages/Customers'));
const CustomerDetails = lazy(() => import('@/pages/CustomerDetails'));
const Vehicles = lazy(() => import('@/pages/Vehicles'));
const VehicleDetails = lazy(() => import('@/pages/VehicleDetails'));
const Services = lazy(() => import('@/pages/Services'));
const Staff = lazy(() => import('@/pages/Staff'));
const Payments = lazy(() => import('@/pages/Payments'));
const Invoices = lazy(() => import('@/pages/Invoices'));
const InvoiceDetails = lazy(() => import('@/pages/InvoiceDetails'));
const Reports = lazy(() => import('@/pages/Reports'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Settings = lazy(() => import('@/pages/Settings'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function PageLoader() {
  return (
    <div className="space-y-3">
      <div className="h-6 w-48 animate-pulse rounded-md bg-slate-200/70" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card h-[104px] animate-pulse" />
        ))}
      </div>
      <div className="card h-[320px] animate-pulse" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/bookings/:id" element={<BookingDetails />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetails />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/vehicles/:id" element={<VehicleDetails />} />
          <Route path="/services" element={<Services />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/:id" element={<InvoiceDetails />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
