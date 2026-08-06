import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './pages/admin/DashboardLayout';
import Dashboard from './pages/admin/Dashboard';
import LoginPage from './pages/LoginPage';
import { Toaster } from 'react-hot-toast';
import Items from './pages/admin/Items';
import Accounts from './pages/admin/Accounts';
import Customers from './pages/admin/Customers';
import Suppliers from './pages/admin/Suppliers';
import RegisterPage from './pages/RegisterPage';
import CompanySetup from './pages/Setup/CompanySetup'; // ✅ new
import Support from './pages/admin/Support';
import Purchases from './pages/admin/Purchases';
import PurchaseOrder from './pages/admin/PurchaseOrder';
import SaleBills from './pages/admin/SaleBills';
import SaleOrder from './pages/admin/SaleOrder';
import Inventory from './pages/admin/Inventory';
import Locations from './pages/admin/Locations';
import Revenue from './pages/admin/Revenue';
import Payments from './pages/admin/Payments';
import Analytics from './pages/admin/Analytics';
import JournalVoucher from './pages/admin/JournalVoucher';

function App() {
  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Setup flow */}
        <Route path="/setup/company" element={<CompanySetup />} />
        <Route path="/setup/register" element={<RegisterPage />} />

        {/* Admin routes (protected) */}
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="accounting" element={<Accounts />} />
          <Route path="customers" element={<Customers />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="items" element={<Items />} />
          <Route path="warehouses" element={<Locations />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="purchase-orders" element={<PurchaseOrder />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="payments" element={<Payments />} />
          <Route path="revenue" element={<Revenue />} />
          <Route path="sale-orders" element={<SaleOrder />} />
          <Route path="invoices" element={<SaleBills />} />
          <Route path="support" element={<Support />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="journal-voucher" element={<JournalVoucher />} />
        </Route>

        {/* Catch all – redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;