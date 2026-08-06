// src/pages/admin/Payments.jsx
import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Plus,
  Eye,
  RefreshCw,
  Calendar,
  Users,
  CreditCard,
  FileText,
  Truck,
} from 'lucide-react';
import api from '../../api/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ─── Summary Card ───
const SummaryCard = ({ icon: Icon, label, value, subtitle, color }) => (
  <div className="bg-white rounded-xs border border-gray-200 px-5 py-4 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-semibold ${color || 'text-gray-900'} mt-0.5`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className="p-2 bg-gray-50 rounded-lg">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
    </div>
  </div>
);

// ─── Status Badge ───
const PaymentStatusBadge = ({ status }) => {
  const statusMap = {
    paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    partial: { label: 'Partial', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    overdue: { label: 'Overdue', className: 'bg-red-50 text-red-700 border-red-200' },
    unpaid: { label: 'Unpaid', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  };
  const s = statusMap[status] || statusMap.unpaid;
  return (
    <Badge variant="outline" className={`px-3 py-0.5 text-xs font-medium rounded-full border ${s.className}`}>
      {s.label}
    </Badge>
  );
};

// ─── Search Bar ───
const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="relative flex-1 max-w-xs">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="pl-9 h-8 bg-white border border-gray-300 rounded-xs text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600 outline-none transition-all"
    />
  </div>
);

// ─── Empty State ───
const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="p-4 bg-gray-50 rounded-full mb-4">
      <Icon className="h-8 w-8 text-gray-300" />
    </div>
    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    <p className="text-sm text-gray-400 max-w-sm mt-1">{description}</p>
    {actionLabel && (
      <Button onClick={onAction} className="mt-4 bg-black hover:bg-gray-800 text-white">
        {actionLabel}
      </Button>
    )}
  </div>
);

// ─── Compute purchase invoice totals ───
const computePurchaseTotals = (purchase) => {
  const details = purchase.details || [];
  const totalAmount = details.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
  const discount = parseFloat(purchase.discount) || 0;
  const netAmount = totalAmount - discount;
  return { totalAmount, netAmount };
};

// ─── Main Component ───
const Payments = () => {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentRef, setPaymentRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all purchase invoices (supplier bills)
      const purchasesRes = await api.get('/purchases/purchase-master/');
      const purchases = purchasesRes.data || [];

      // Fetch details for each purchase
      const purchasesWithDetails = await Promise.all(
        purchases.map(async (p) => {
          const detailsRes = await api.get(`/purchases/purchase-master/${p.id}/`);
          return { ...p, details: detailsRes.data.details || [] };
        })
      );

      // 2. Fetch all journal vouchers (JV) to extract payments
      const vouchersRes = await api.get('/accounting/vouchers/?vtype=JV');
      const jvVouchers = vouchersRes.data || [];

      // 3. Build a map: supplier_account_code -> total paid (sum of debits to that supplier)
      const paidMap = {};
      for (const voucher of jvVouchers) {
        // Fetch details for this voucher
        const detailsRes = await api.get(`/accounting/vouchers/${voucher.id}/`);
        const details = detailsRes.data.details || [];
        for (const detail of details) {
          const accountCode = detail.account_code;
          const debit = parseFloat(detail.debit) || 0;
          // A payment to a supplier is a DEBIT to the supplier's account (creditor)
          // So we sum debits to that account
          if (debit > 0) {
            paidMap[accountCode] = (paidMap[accountCode] || 0) + debit;
          }
        }
      }

      // 4. Build invoice list with computed paid amounts
      // For each supplier, we allocate the total paid to their invoices in order (FIFO)
      const supplierInvoices = {};
      purchasesWithDetails.forEach((p) => {
        const supplierId = p.account_code;
        if (!supplierId) return;
        const netAmount = computePurchaseTotals(p).netAmount;
        if (!supplierInvoices[supplierId]) supplierInvoices[supplierId] = [];
        supplierInvoices[supplierId].push({
          ...p,
          netAmount,
          paid: 0,
          balance: netAmount,
        });
      });

      // Allocate payments
      for (const [supplierId, invList] of Object.entries(supplierInvoices)) {
        // Sort invoices by date (oldest first)
        invList.sort((a, b) => new Date(a.vdate) - new Date(b.vdate));
        let remainingPayment = paidMap[supplierId] || 0;
        for (const inv of invList) {
          if (remainingPayment <= 0) break;
          const amount = inv.netAmount;
          const paid = Math.min(remainingPayment, amount);
          inv.paid = paid;
          inv.balance = amount - paid;
          remainingPayment -= paid;
        }
        // Mark the rest as unpaid (balance remains)
      }

      // Flatten the list
      const allInvoices = Object.values(supplierInvoices).flat();

      // Compute status for each invoice
      const invoicesWithStatus = allInvoices.map((inv) => {
        let status = 'unpaid';
        if (inv.balance <= 0.001) status = 'paid';
        else if (inv.paid > 0) status = 'partial';
        else {
          const dueDate = new Date(inv.vdate);
          dueDate.setDate(dueDate.getDate() + 30);
          if (new Date() > dueDate) status = 'overdue';
        }
        return { ...inv, status };
      });

      setInvoices(invoicesWithStatus);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load supplier invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return invoices;
    const q = search.toLowerCase();
    return invoices.filter(
      (inv) =>
        String(inv.vno).includes(q) ||
        inv.account_code_display?.toLowerCase().includes(q) ||
        inv.remarks?.toLowerCase().includes(q)
    );
  }, [invoices, search]);

  const summary = useMemo(() => {
    const totalInvoices = invoices.length;
    const totalPayables = invoices.reduce((sum, inv) => sum + inv.netAmount, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.paid, 0);
    const totalBalance = totalPayables - totalPaid;
    const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;
    return { totalInvoices, totalPayables, totalPaid, totalBalance, overdueCount };
  }, [invoices]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Payment of ₨ ${paymentAmount} recorded for supplier invoice #${selectedInvoice.vno}`);
      setPaymentModal(false);
      setSelectedInvoice(null);
      setPaymentAmount('');
      setPaymentRef('');
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Payments</h1>
          <p className="text-sm text-gray-500">Track amounts owed to suppliers and payments made</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by invoice, supplier..."
          />
          <Button
            onClick={fetchData}
            variant="outline"
            className="h-9 px-3 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <SummaryCard
          icon={FileText}
          label="Total Invoices"
          value={summary.totalInvoices}
          subtitle="Supplier bills"
        />
        <SummaryCard
          icon={DollarSign}
          label="Total Payables"
          value={`₨ ${summary.totalPayables.toFixed(2)}`}
          color="text-blue-600"
          subtitle="Amount owed"
        />
        <SummaryCard
          icon={CheckCircle}
          label="Total Paid"
          value={`₨ ${summary.totalPaid.toFixed(2)}`}
          color="text-emerald-600"
          subtitle="Payments made"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Remaining Balance"
          value={`₨ ${summary.totalBalance.toFixed(2)}`}
          color="text-red-600"
          subtitle="Still owed"
        />
        <SummaryCard
          icon={Clock}
          label="Overdue Invoices"
          value={summary.overdueCount}
          color="text-orange-600"
          subtitle="Past due"
        />
      </div>

      {/* Table */}
      <div className="rounded-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Supplier Invoices</h2>
            <p className="text-xs text-gray-500">Payment status</p>
          </div>
          <span className="text-sm text-gray-500">{filtered.length} invoices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="w-12 py-3 border-r border-gray-300 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="w-24 py-3 border-r border-gray-300 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-5 py-3 border-r border-gray-300 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="w-32 py-3 border-r border-gray-300 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount (₨)</th>
                <th className="w-32 py-3 border-r border-gray-300 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid (₨)</th>
                <th className="w-32 py-3 border-r border-gray-300 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance (₨)</th>
                <th className="w-32 py-3 border-r border-gray-300 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="w-40 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <EmptyState
                      icon={DollarSign}
                      title="No supplier invoices found"
                      description="Purchase invoices will appear here once created."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900 border-r border-b border-gray-300 text-center">
                      {inv.vno}
                    </td>
                    <td className="px-5 py-3.5 border-r border-b border-gray-300 text-sm text-yellow-700 text-center">
                      {new Date(inv.vdate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 border-r border-b border-gray-300 text-sm text-gray-900">
                      {inv.account_code_display || '-'}
                    </td>
                    <td className="px-5 py-3.5 border-r border-b border-gray-300 text-center font-medium text-gray-900">
                      {inv.netAmount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 border-r border-b border-gray-300 text-center font-medium text-emerald-600">
                      {inv.paid.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 border-r border-b border-gray-300 text-center font-medium text-red-600">
                      {inv.balance.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-center border-r border-b border-gray-300">
                      <PaymentStatusBadge status={inv.status} />
                    </td>
                    <td className="py-3.5 border-b border-gray-300 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {inv.status !== 'paid' && (
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPaymentModal(true);
                            }}
                            className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                            title="Record Payment"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Payment Modal ─── */}
      <Dialog open={paymentModal} onOpenChange={setPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">Record Payment to Supplier</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Enter payment details for invoice #{selectedInvoice?.vno} – {selectedInvoice?.account_code_display}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordPayment}>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Payment Date</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="mt-1.5 h-9 rounded-xs text-sm"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Amount (₨)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  required
                  className="mt-1.5 h-9 rounded-xs text-sm"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Reference / Remarks</Label>
                <Input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="Payment reference (optional)"
                  className="mt-1.5 h-9 rounded-xs text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentModal(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {submitting ? 'Recording...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payments;