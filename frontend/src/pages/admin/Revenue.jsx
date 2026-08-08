// src/pages/admin/Revenue.jsx
import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  RefreshCw,
  Search,
  Eye,
  FileText,
  Calendar,
  Users,
} from 'lucide-react';
import api from '../../api/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ─── Summary Card ───
const SummaryCard = ({ icon: Icon, label, value, subtitle }) => (
  <div className="bg-white rounded-xs border border-gray-200 px-5 py-4 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-semibold text-gray-900 mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className="p-2 bg-gray-50 rounded-lg">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
    </div>
  </div>
);

// ─── Status Badge ───
const StatusBadge = ({ status }) => {
  const statusMap = {
    P: { label: 'Pending', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    D: { label: 'Draft', className: 'bg-gray-50 text-gray-700 border-gray-200' },
    C: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    V: { label: 'Cancelled', className: 'bg-red-50 text-red-700 border-red-200' },
  };
  const s = statusMap[status] || statusMap.P;
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

// ─── Compute totals from details ───
const computeSaleTotals = (sale) => {
  const details = sale.details || [];
  const totalQty = details.reduce((sum, d) => sum + (parseFloat(d.qty) || 0), 0);
  const totalAmount = details.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
  const discount = parseFloat(sale.discount) || 0;
  const netAmount = totalAmount - (totalAmount * discount) / 100;
  return { totalQty, totalAmount, netAmount };
};

// ─── Main Component ───
const Revenue = () => {
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [detailsMap, setDetailsMap] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales/sale-master/');
      const salesData = res.data || [];
      setSales(salesData);

      // Fetch details if missing
      if (salesData.length > 0 && !salesData[0].details) {
        const promises = salesData.map(async (sale) => {
          const detailRes = await api.get(`/sales/sale-master/${sale.id}/`);
          return { id: sale.id, details: detailRes.data.details || [] };
        });
        const results = await Promise.all(promises);
        const map = {};
        results.forEach(({ id, details }) => {
          map[id] = details;
        });
        setDetailsMap(map);
      } else {
        const map = {};
        salesData.forEach((sale) => {
          map[sale.id] = sale.details || [];
        });
        setDetailsMap(map);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Enrich sales with details ──
  const enrichedSales = useMemo(() => {
    return sales.map((sale) => {
      const details = detailsMap[sale.id] || sale.details || [];
      return { ...sale, details };
    });
  }, [sales, detailsMap]);

  // ── Filters ──
  const filteredSales = useMemo(() => {
    if (!search.trim()) return enrichedSales;
    const q = search.toLowerCase();
    return enrichedSales.filter(
      (s) =>
        s.vtype?.toLowerCase().includes(q) ||
        String(s.vno).includes(q) ||
        s.account_code_display?.toLowerCase().includes(q) ||
        s.remarks?.toLowerCase().includes(q)
    );
  }, [enrichedSales, search]);

  // ── Summary stats – now includes ALL sales ──
  const summary = useMemo(() => {
    // All sales (including pending, draft, etc.)
    const totalRevenueAll = enrichedSales.reduce((sum, s) => {
      const { netAmount } = computeSaleTotals(s);
      return sum + netAmount;
    }, 0);
    const totalInvoicesAll = enrichedSales.length;
    const totalItemsSoldAll = enrichedSales.reduce((sum, s) => {
      const { totalQty } = computeSaleTotals(s);
      return sum + totalQty;
    }, 0);
    const avgInvoiceAll = totalInvoicesAll > 0 ? totalRevenueAll / totalInvoicesAll : 0;

    // Completed sales (actual revenue)
    const completed = enrichedSales.filter(s => s.stts === 'C');
    const totalRevenueCompleted = completed.reduce((sum, s) => {
      const { netAmount } = computeSaleTotals(s);
      return sum + netAmount;
    }, 0);

    return { totalRevenueAll, totalInvoicesAll, totalItemsSoldAll, avgInvoiceAll, totalRevenueCompleted };
  }, [enrichedSales]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
          <p className="text-sm text-gray-500">Track your sales revenue</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by customer, invoice..."
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

      {/* Summary Cards – now showing all sales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          icon={DollarSign}
          label="Total Revenue (All Sales)"
          value={`₨ ${summary.totalRevenueAll.toFixed(2)}`}
          subtitle="Includes pending & completed"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Completed Revenue"
          value={`₨ ${summary.totalRevenueCompleted.toFixed(2)}`}
          subtitle="Completed sales only"
        />
        <SummaryCard
          icon={ShoppingBag}
          label="Total Invoices"
          value={summary.totalInvoicesAll}
          subtitle="All sales"
        />
        <SummaryCard
          icon={FileText}
          label="Items Sold"
          value={summary.totalItemsSoldAll.toFixed(3)}
          subtitle="Total quantity sold"
        />
      </div>

      {/* Table */}
      <div className="rounded-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Sales Invoices</h2>
            <p className="text-xs text-gray-500">All sales records</p>
          </div>
          <span className="text-sm text-gray-500">{filteredSales.length} invoices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="w-24 py-3 border-r border-gray-300 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="w-12 py-3 border-r border-gray-300 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">VNO</th>
                <th className="px-5 py-3 border-r border-gray-300 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-5 py-3 border-r border-gray-300 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="w-24 py-3 border-r border-gray-300 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                <th className="w-40 py-3 border-r border-gray-300 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Total (₨)</th>
                <th className="w-32 py-3 border-r border-gray-300 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="w-28 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600" />
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <EmptyState
                      icon={DollarSign}
                      title="No sales found"
                      description="Start selling to generate revenue."
                      actionLabel="Create Sale"
                      onAction={() => {}}
                    />
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const { totalQty, netAmount } = computeSaleTotals(sale);
                  const locations = (sale.details || [])
                    .map(d => d.location_display || d.location_name || '')
                    .filter(Boolean);
                  const uniqueLocations = [...new Set(locations)].join(', ') || '-';
                  return (
                    <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 border-r border-b border-gray-300 text-sm text-yellow-700">
                        {new Date(sale.vdate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 border-r border-b border-gray-300">
                        <span className="inline-flex font-mono text-sm font-medium text-gray-700">
                          {sale.vno}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 border-r border-b border-gray-300 text-sm text-gray-900">
                        {sale.account_code_display || '-'}
                      </td>
                      <td className="px-5 py-3.5 border-r border-b border-gray-300 text-sm text-gray-700">
                        {uniqueLocations}
                      </td>
                      <td className="px-5 py-3.5 border-r border-b border-gray-300 text-center font-medium text-blue-700">
                        {totalQty.toFixed(3)}
                      </td>
                      <td className="px-5 py-3.5 border-r border-b border-gray-300 text-center font-medium text-green-700">
                        {netAmount.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-center border-r border-b border-gray-300">
                        <StatusBadge status={sale.stts} />
                      </td>
                      <td className="py-3.5 border-b border-gray-300 text-center">
                        <button
                          className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Revenue;