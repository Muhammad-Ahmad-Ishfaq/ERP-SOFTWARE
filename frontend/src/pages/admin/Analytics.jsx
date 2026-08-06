// src/pages/admin/Analytics.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Scatter,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  Truck,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Clock,
  AlertCircle,
} from 'lucide-react';
import api from '../../api/api';
import toast from 'react-hot-toast';

// ─── Colors ───
const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#22c55e', '#ec4899', '#14b8a6'];
const CHART_COLORS = {
  revenue: '#3b82f6',
  profit: '#22c55e',
  expenses: '#ef4444',
  sales: '#3b82f6',
  purchases: '#f59e0b',
};

// ─── Filter Component ───
const DateFilter = ({ dateRange, setDateRange }) => (
  <div className="flex items-center gap-3 flex-wrap">
    <div className="flex items-center gap-2">
      <Label className="text-sm text-gray-600">From</Label>
      <Input
        type="date"
        value={dateRange.from}
        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
        className="w-36 h-8 text-sm"
      />
    </div>
    <div className="flex items-center gap-2">
      <Label className="text-sm text-gray-600">To</Label>
      <Input
        type="date"
        value={dateRange.to}
        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
        className="w-36 h-8 text-sm"
      />
    </div>
    <Button
      variant="outline"
      size="sm"
      className="h-8 px-3 text-gray-700 border-gray-300 hover:bg-gray-50"
      onClick={() => setDateRange({ from: '', to: '' })}
    >
      Reset
    </Button>
  </div>
);

// ─── Main Component ───
const Analytics = () => {
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [locations, setLocations] = useState([]);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [viewMode, setViewMode] = useState('monthly'); // daily, weekly, monthly

  // ── Fetch data ──
  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, purchasesRes, locationsRes] = await Promise.all([
        api.get('/sales/sale-master/'),
        api.get('/purchases/purchase-master/'),
        api.get('/locations/locations/').catch(() => ({ data: [] })),
      ]);

      let salesData = salesRes.data || [];
      let purchasesData = purchasesRes.data || [];

      // Filter by date range
      if (dateRange.from) {
        salesData = salesData.filter(s => s.vdate >= dateRange.from);
        purchasesData = purchasesData.filter(p => p.vdate >= dateRange.from);
      }
      if (dateRange.to) {
        salesData = salesData.filter(s => s.vdate <= dateRange.to);
        purchasesData = purchasesData.filter(p => p.vdate <= dateRange.to);
      }

      // Compute inventory (purchases - sales)
      const stockMap = new Map();
      for (const purchase of purchasesData) {
        const detailsRes = await api.get(`/purchases/purchase-master/${purchase.id}/`);
        const details = detailsRes.data.details || [];
        for (const detail of details) {
          const key = `${detail.item_code}-${detail.location_display || 'Main'}`;
          if (!stockMap.has(key)) {
            stockMap.set(key, {
              item_code: detail.item_code,
              location: detail.location_display || 'Main Store',
              quantity: 0,
              totalCost: 0,
            });
          }
          const entry = stockMap.get(key);
          entry.quantity += parseFloat(detail.qty) || 0;
          entry.totalCost += (parseFloat(detail.qty) || 0) * (parseFloat(detail.rate) || 0);
        }
      }
      // Subtract sales
      for (const sale of salesData.filter(s => s.stts === 'C')) {
        const detailsRes = await api.get(`/sales/sale-master/${sale.id}/`);
        const details = detailsRes.data.details || [];
        for (const detail of details) {
          const key = `${detail.item_code}-${detail.location_display || 'Main'}`;
          if (stockMap.has(key)) {
            const entry = stockMap.get(key);
            entry.quantity -= parseFloat(detail.qty) || 0;
          }
        }
      }
      const inventoryData = Array.from(stockMap.values()).map(entry => ({
        ...entry,
        avgCost: entry.quantity > 0 ? entry.totalCost / entry.quantity : 0,
      }));

      setSales(salesData);
      setPurchases(purchasesData);
      setInventory(inventoryData);
      setLocations(locationsRes.data || []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  // ── Computed metrics ──
  const totalRevenue = sales
    .filter(s => s.stts === 'C')
    .reduce((sum, s) => {
      const total = (s.details || []).reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);
      return sum + total - (parseFloat(s.discount) || 0);
    }, 0);
  const totalPurchasesValue = purchases
    .filter(p => p.stts === 'C')
    .reduce((sum, p) => {
      const total = (p.details || []).reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);
      return sum + total - (parseFloat(p.discount) || 0);
    }, 0);
  const profit = totalRevenue - totalPurchasesValue;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue * 100) : 0;
  const totalSalesCount = sales.filter(s => s.stts === 'C').length;
  const totalPurchasesCount = purchases.filter(p => p.stts === 'C').length;

  // ── Revenue over time (daily) ──
  const revenueData = useMemo(() => {
    const days = 30;
    const today = new Date();
    const data = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySales = sales.filter(s => s.vdate === dateStr && s.stts === 'C');
      const total = daySales.reduce((sum, s) => {
        const amt = (s.details || []).reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);
        return sum + amt - (parseFloat(s.discount) || 0);
      }, 0);
      data.push({ date: dateStr, revenue: total, profit: total * 0.3 });
    }
    return data;
  }, [sales]);

  // ── Sales vs Purchases (monthly) ──
  const comparisonData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const month = months[monthIndex];
      const year = new Date().getFullYear();
      const monthSales = sales.filter(s => {
        const d = new Date(s.vdate);
        return d.getMonth() === monthIndex && d.getFullYear() === year && s.stts === 'C';
      });
      const monthPurchases = purchases.filter(p => {
        const d = new Date(p.vdate);
        return d.getMonth() === monthIndex && d.getFullYear() === year && p.stts === 'C';
      });
      const salesTotal = monthSales.reduce((sum, s) => {
        const amt = (s.details || []).reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);
        return sum + amt - (parseFloat(s.discount) || 0);
      }, 0);
      const purchasesTotal = monthPurchases.reduce((sum, p) => {
        const amt = (p.details || []).reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);
        return sum + amt - (parseFloat(p.discount) || 0);
      }, 0);
      data.push({ month, sales: salesTotal, purchases: purchasesTotal });
    }
    return data;
  }, [sales, purchases]);

  // ── Top Products ──
  const topProducts = useMemo(() => {
    const productMap = new Map();
    sales.filter(s => s.stts === 'C').forEach(sale => {
      (sale.details || []).forEach(d => {
        const name = d.item_code_display || `Item ${d.item_code}`;
        if (!productMap.has(name)) productMap.set(name, { qty: 0, revenue: 0 });
        const data = productMap.get(name);
        data.qty += parseFloat(d.qty) || 0;
        data.revenue += parseFloat(d.amount) || 0;
      });
    });
    return Array.from(productMap.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10)
      .map(([name, data]) => ({ name, ...data }));
  }, [sales]);

  // ── Top Customers ──
  const topCustomers = useMemo(() => {
    const custMap = new Map();
    sales.filter(s => s.stts === 'C').forEach(sale => {
      const name = sale.account_code_display || 'Unknown';
      if (!custMap.has(name)) custMap.set(name, { total: 0, count: 0 });
      const data = custMap.get(name);
      const amt = (sale.details || []).reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0) - (parseFloat(sale.discount) || 0);
      data.total += amt;
      data.count += 1;
    });
    return Array.from(custMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([name, data]) => ({ name, ...data }));
  }, [sales]);

  // ── Top Suppliers ──
  const topSuppliers = useMemo(() => {
    const supMap = new Map();
    purchases.filter(p => p.stts === 'C').forEach(purchase => {
      const name = purchase.account_code_display || 'Unknown';
      if (!supMap.has(name)) supMap.set(name, { total: 0, count: 0 });
      const data = supMap.get(name);
      const amt = (purchase.details || []).reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0) - (parseFloat(purchase.discount) || 0);
      data.total += amt;
      data.count += 1;
    });
    return Array.from(supMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([name, data]) => ({ name, ...data }));
  }, [purchases]);

  // ── Inventory by Location ──
  const locationData = useMemo(() => {
    const locMap = new Map();
    inventory.forEach(item => {
      const loc = item.location || 'Main Store';
      if (!locMap.has(loc)) locMap.set(loc, { qty: 0, value: 0 });
      const data = locMap.get(loc);
      data.qty += item.quantity;
      data.value += item.totalCost;
    });
    return Array.from(locMap.entries()).map(([name, data]) => ({ name, ...data }));
  }, [inventory]);

  // ── Payment Status ──
  const paymentStatusData = useMemo(() => {
    const paid = sales.filter(s => s.stts === 'C').length;
    const pending = sales.filter(s => s.stts === 'P' || s.stts === 'A').length;
    return [
      { name: 'Paid', value: paid || 0 },
      { name: 'Pending', value: pending || 0 },
    ];
  }, [sales]);

  // ── Profit Trend (daily) ──
  const profitTrendData = useMemo(() => {
    const days = 30;
    const today = new Date();
    const data = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySales = sales.filter(s => s.vdate === dateStr && s.stts === 'C');
      const dayPurchases = purchases.filter(p => p.vdate === dateStr && p.stts === 'C');
      const salesTotal = daySales.reduce((sum, s) => {
        const amt = (s.details || []).reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);
        return sum + amt - (parseFloat(s.discount) || 0);
      }, 0);
      const purchasesTotal = dayPurchases.reduce((sum, p) => {
        const amt = (p.details || []).reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);
        return sum + amt - (parseFloat(p.discount) || 0);
      }, 0);
      data.push({ date: dateStr, profit: salesTotal - purchasesTotal });
    }
    return data;
  }, [sales, purchases]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">Deep insights into your business performance</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={fetchData}
            variant="outline"
            className="h-9 px-3 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            className="h-9 px-3 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-center gap-4">
        <DateFilter dateRange={dateRange} setDateRange={setDateRange} />
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600">Location</Label>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map(loc => (
                <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600">View</Label>
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue placeholder="Monthly" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-600">₨ {totalRevenue.toFixed(0)}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Gross Profit</p>
                <p className="text-2xl font-bold text-emerald-600">₨ {profit.toFixed(0)}</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Profit Margin</p>
                <p className="text-2xl font-bold text-purple-600">{profitMargin.toFixed(1)}%</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Total Sales</p>
                <p className="text-2xl font-bold text-orange-600">{totalSalesCount}</p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Revenue & Profit Charts ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900">Revenue Trend</CardTitle>
            <CardDescription className="text-xs text-gray-500">Last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickMargin={8} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₨ ${v}`} />
                <Tooltip formatter={(value) => `₨ ${value.toFixed(2)}`} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900">Profit Trend</CardTitle>
            <CardDescription className="text-xs text-gray-500">Last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={profitTrendData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickMargin={8} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₨ ${v}`} />
                <Tooltip formatter={(value) => `₨ ${value.toFixed(2)}`} />
                <Area type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ─── Sales vs Purchases ─── */}
      <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-900">Sales vs Purchases</CardTitle>
          <CardDescription className="text-xs text-gray-500">Last 6 months</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} tickMargin={8} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₨ ${v}`} />
              <Tooltip formatter={(value) => `₨ ${value.toFixed(2)}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="sales" fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="purchases" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ─── Top Products, Customers, Suppliers ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-900">Top Products</CardTitle>
            <CardDescription className="text-xs text-gray-500">By revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No data</p>
            ) : (
              <ul className="space-y-3">
                {topProducts.slice(0, 5).map((product, idx) => (
                  <li key={idx} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <span className="text-sm text-gray-700 truncate max-w-[120px]">{product.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{product.qty.toFixed(0)} units</span>
                      <span className="text-sm font-semibold text-gray-900">₨ {product.revenue.toFixed(0)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-900">Top Customers</CardTitle>
            <CardDescription className="text-xs text-gray-500">By revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No data</p>
            ) : (
              <ul className="space-y-3">
                {topCustomers.slice(0, 5).map((cust, idx) => (
                  <li key={idx} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <span className="text-sm text-gray-700 truncate max-w-[120px]">{cust.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{cust.count} invoices</span>
                      <span className="text-sm font-semibold text-gray-900">₨ {cust.total.toFixed(0)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-900">Top Suppliers</CardTitle>
            <CardDescription className="text-xs text-gray-500">By purchase volume</CardDescription>
          </CardHeader>
          <CardContent>
            {topSuppliers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No data</p>
            ) : (
              <ul className="space-y-3">
                {topSuppliers.slice(0, 5).map((sup, idx) => (
                  <li key={idx} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <span className="text-sm text-gray-700 truncate max-w-[120px]">{sup.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{sup.count} purchases</span>
                      <span className="text-sm font-semibold text-gray-900">₨ {sup.total.toFixed(0)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Inventory by Location & Payment Status ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-900">Inventory by Location</CardTitle>
            <CardDescription className="text-xs text-gray-500">Stock value distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={locationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {locationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₨ ${value.toFixed(2)}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-900">Payment Status</CardTitle>
            <CardDescription className="text-xs text-gray-500">Invoices status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;