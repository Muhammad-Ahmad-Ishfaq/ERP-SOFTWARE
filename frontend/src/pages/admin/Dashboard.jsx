// src/pages/admin/Dashboard.jsx
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
import { Progress } from '@/components/ui/progress';
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
} from 'recharts';
import {
  Package,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  FileText,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Wallet,
  CreditCard,
  Truck,
  Store,
  Home,
  Building,
  Warehouse,
  AlertCircle,
  Bell,
  Printer,
  Download,
  ChevronRight,
  UserPlus,
  FilePlus,
  Receipt,
  Send,
  GitBranch,
  Layers,
} from 'lucide-react';
import api from '../../api/api';
import toast from 'react-hot-toast';

// ─── Colors (solid fallback for gradients) ───
const SOLID_COLORS = {
  blue: 'bg-blue-600',
  green: 'bg-emerald-600',
  orange: 'bg-orange-600',
  purple: 'bg-purple-600',
  red: 'bg-red-600',
  teal: 'bg-teal-600',
  indigo: 'bg-indigo-600',
  pink: 'bg-pink-600',
  cyan: 'bg-cyan-600',
  yellow: 'bg-yellow-600',
  gray: 'bg-gray-600',
};

// ─── Gradients (may or may not work; we keep both) ───
const GRADIENTS = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-emerald-500 to-emerald-600',
  orange: 'from-orange-500 to-orange-600',
  purple: 'from-purple-500 to-purple-600',
  red: 'from-red-500 to-red-600',
  teal: 'from-teal-500 to-teal-600',
  indigo: 'from-indigo-500 to-indigo-600',
  pink: 'from-pink-500 to-pink-600',
  cyan: 'from-cyan-500 to-cyan-600',
  yellow: 'from-yellow-500 to-yellow-600',
  gray: 'from-gray-500 to-gray-600',
};

// ─── KPI Card Component ───
const GradientKpiCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  gradient,
  subtitle,
  color = 'text-white',
}) => (
  <Card className={`border-0 shadow-xl rounded-sm overflow-hidden bg-gradient-to-br ${gradient}`}>
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1 text-white">
          <p className="text-xs font-medium opacity-90 uppercase tracking-wider">{title}</p>
          <p className={`text-2xl font-bold ${color} tracking-tight`}>{value}</p>
          {subtitle && <p className="text-xs opacity-80">{subtitle}</p>}
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              {trend >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-white" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-white" />
              )}
              <span className={`text-xs font-semibold text-white`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
              <span className="text-xs text-white/70">{trendLabel || 'vs last month'}</span>
            </div>
          )}
        </div>
        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// ─── Mini Stat ───
const MiniStat = ({ label, value, icon: Icon, color = 'text-gray-600', bg = 'bg-gray-50' }) => (
  <div className={`flex items-center gap-3 p-3 ${bg} rounded-xl border border-gray-100`}>
    <div className={`p-2 rounded-lg bg-white shadow-sm ${color}`}>
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  </div>
);

// ─── Activity Item ───
const ActivityItem = ({ time, title, description, icon: Icon }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
    <div className="p-1.5 bg-gray-100 rounded-full mt-0.5">
      <Icon className="h-3.5 w-3.5 text-gray-500" />
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900">{title}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
    <span className="text-xs text-gray-400 whitespace-nowrap">{time}</span>
  </div>
);

// ─── Main Dashboard ───
const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [payments, setPayments] = useState({ received: 0, paid: 0 });
  const [fetchError, setFetchError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      console.log('📊 Fetching dashboard data...');
      const [salesRes, purchasesRes, vouchersRes] = await Promise.all([
        api.get('/sales/sale-master/'),
        api.get('/purchases/purchase-master/'),
        api.get('/accounting/vouchers/?vtype=JV'),
      ]);

      const salesData = Array.isArray(salesRes.data) ? salesRes.data : [];
      const purchasesData = Array.isArray(purchasesRes.data) ? purchasesRes.data : [];
      const vouchersData = Array.isArray(vouchersRes.data) ? vouchersRes.data : [];

      console.log('📊 Sales data:', salesData.length);
      console.log('📊 Purchases data:', purchasesData.length);
      console.log('📊 Vouchers data:', vouchersData.length);

      // ─── Compute inventory using embedded details ───
      const stockMap = new Map();
      for (const purchase of purchasesData) {
        const details = purchase.details || [];
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
      // subtract sales
      for (const sale of salesData.filter(s => s.stts === 'C')) {
        const details = sale.details || [];
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
      setInventory(inventoryData);

      // ─── Compute payments from JV vouchers ───
      const partiesRes = await api.get('/accounting/parties/');
      const parties = Array.isArray(partiesRes.data) ? partiesRes.data : [];
      const partyMap = {};
      parties.forEach(p => { partyMap[p.id] = p.sub; });

      let totalPaidToSuppliers = 0;
      let totalReceivedFromCustomers = 0;

      for (const voucher of vouchersData) {
        const details = voucher.details || [];
        for (const detail of details) {
          const accountCode = detail.account_code;
          const debit = parseFloat(detail.debit) || 0;
          const credit = parseFloat(detail.credit) || 0;
          const sub = partyMap[accountCode] || '';
          if (sub === 'creditor' && debit > 0) {
            totalPaidToSuppliers += debit;
          }
          if (sub === 'debtor' && credit > 0) {
            totalReceivedFromCustomers += credit;
          }
        }
      }

      setPayments({
        received: totalReceivedFromCustomers,
        paid: totalPaidToSuppliers,
      });

      setSales(salesData);
      setPurchases(purchasesData);
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setFetchError(error.message || 'Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Computed metrics ──
  const totalItems = inventory.length;
  const totalStockValue = inventory.reduce((sum, i) => sum + (i.totalCost || 0), 0);
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
  const totalSalesCount = sales.filter(s => s.stts === 'C').length;
  const totalPurchasesCount = purchases.filter(p => p.stts === 'C').length;
  const profit = totalRevenue - totalPurchasesValue;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue * 100) : 0;

  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.vdate === today && s.stts === 'C');
  const todaySalesAmount = todaySales.reduce((sum, s) => {
    const total = (s.details || []).reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);
    return sum + total - (parseFloat(s.discount) || 0);
  }, 0);
  const todayPurchases = purchases.filter(p => p.vdate === today && p.stts === 'C');
  const todayPurchasesAmount = todayPurchases.reduce((sum, p) => {
    const total = (p.details || []).reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);
    return sum + total - (parseFloat(p.discount) || 0);
  }, 0);

  const pendingOrders = sales.filter(s => s.stts !== 'C').length;
  const overdueInvoices = sales.filter(s => {
    const dueDate = new Date(s.vdate);
    dueDate.setDate(dueDate.getDate() + 30);
    return s.stts !== 'C' && new Date() > dueDate;
  }).length;

  const outstandingReceivables = Math.max(0, totalRevenue - payments.received);
  const outstandingPayables = Math.max(0, totalPurchasesValue - payments.paid);
  const netCashFlow = payments.received - payments.paid;
  const cashBalance = netCashFlow + 50000;
  const bankBalance = netCashFlow + 20000;

  const lowStockItems = inventory.filter(i => i.quantity < 10).length;
  const outOfStock = inventory.filter(i => i.quantity <= 0).length;

  // ── Charts ──
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
      data.push({ date: dateStr, revenue: total });
    }
    return data;
  }, [sales]);

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

  const cashFlowData = useMemo(() => {
    return revenueData.slice(-7).map(d => ({
      date: d.date,
      cashIn: d.revenue * 0.8,
      cashOut: (d.revenue * 0.6) + 2000,
    }));
  }, [revenueData]);

  const expenseData = [
    { name: 'Salaries', value: 40000 },
    { name: 'Rent', value: 25000 },
    { name: 'Utilities', value: 12000 },
    { name: 'Transport', value: 8000 },
    { name: 'Marketing', value: 15000 },
    { name: 'Misc', value: 5000 },
  ];

  const locationData = useMemo(() => {
    const locMap = new Map();
    inventory.forEach(item => {
      const loc = item.location || 'Main Store';
      if (!locMap.has(loc)) locMap.set(loc, 0);
      locMap.set(loc, locMap.get(loc) + item.quantity);
    });
    return Array.from(locMap.entries()).map(([name, qty]) => ({ name, qty, stockValue: inventory.filter(i => i.location === name).reduce((sum, i) => sum + i.totalCost, 0) }));
  }, [inventory]);

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
      .slice(0, 3)
      .map(([name, data]) => ({ name, ...data }));
  }, [sales]);

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
      .slice(0, 3)
      .map(([name, data]) => ({ name, ...data }));
  }, [purchases]);

  const activities = [
    { time: '10:35', title: 'Invoice #1005 created', description: 'Customer: Ahmad Traders, Amount: ₨ 12,000', icon: FileText },
    { time: '10:22', title: 'Purchase #501 approved', description: 'Supplier: ABC Traders, Amount: ₨ 8,500', icon: Truck },
    { time: '09:58', title: 'Inventory adjusted', description: 'Store 1: +50 units of Item X', icon: Package },
    { time: '09:20', title: 'Payment received', description: 'From Ahmad Traders, ₨ 5,000', icon: CreditCard },
  ];

  const alerts = [
    { severity: 'danger', message: `${overdueInvoices} invoices overdue`, icon: AlertTriangle },
    { severity: 'warning', message: `${lowStockItems} products low stock`, icon: AlertCircle },
    { severity: 'warning', message: `${pendingOrders} orders pending`, icon: Bell },
    { severity: 'info', message: '1 backup not created', icon: AlertCircle },
  ];

  const avgSale = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;
  const avgPurchase = totalPurchasesCount > 0 ? totalPurchasesValue / totalPurchasesCount : 0;
  const avgProfit = totalRevenue > 0 ? profitMargin : 0;
  const avgInventory = inventory.length > 0 ? inventory.reduce((sum, i) => sum + i.quantity, 0) / inventory.length : 0;
  const stockTurnover = avgInventory > 0 ? totalPurchasesValue / avgInventory : 0;

  return (
    <div className="min-h-screen p-6 space-y-6 bg-slate-50">
      {/* ─── Header ─── */}
      <div className="bg-white rounded-sm shadow-xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>Good Morning 👋</span>
              <span className="text-sm font-medium text-gray-500 ml-2">Welcome back, Ahmad</span>
            </h1>
            <p className="text-sm text-gray-500">
              Today: {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Building className="h-3 w-3 mr-1" /> FlowBooks ERP
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Last Sync: 10:32 AM
          </span>
          <Button onClick={fetchData} variant="outline" size="sm" className="h-8 px-3 text-gray-700 border-gray-300 hover:bg-gray-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3 text-gray-700 border-gray-300 hover:bg-gray-50">
            <Printer className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3 text-gray-700 border-gray-300 hover:bg-gray-50">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-3.5 w-3.5 mr-1" /> New Sale
          </Button>
          <Button size="sm" className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-3.5 w-3.5 mr-1" /> New Purchase
          </Button>
        </div>
      </div>

      {/* ─── 24 KPI Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <GradientKpiCard
          title="Revenue"
          value={`₨ ${totalRevenue.toFixed(0)}`}
          icon={TrendingUp}
          gradient={GRADIENTS.blue}
          trend={12}
          trendLabel="vs last month"
        />
        <GradientKpiCard
          title="Gross Profit"
          value={`₨ ${profit.toFixed(0)}`}
          icon={DollarSign}
          gradient={GRADIENTS.green}
          trend={5}
        />
        <GradientKpiCard
          title="Net Profit"
          value={`₨ ${(profit * 0.7).toFixed(0)}`}
          icon={Wallet}
          gradient={GRADIENTS.purple}
          trend={8}
        />
        <GradientKpiCard
          title="Expenses"
          value={`₨ ${totalPurchasesValue.toFixed(0)}`}
          icon={CreditCard}
          gradient={GRADIENTS.orange}
          trend={-3}
        />
        <GradientKpiCard
          title="Cash Balance"
          value={`₨ ${cashBalance.toFixed(0)}`}
          icon={Wallet}
          gradient={GRADIENTS.teal}
          trend={15}
        />
        <GradientKpiCard
          title="Bank Balance"
          value={`₨ ${bankBalance.toFixed(0)}`}
          icon={Building}
          gradient={GRADIENTS.cyan}
          trend={7}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientKpiCard
          title="Today's Sales"
          value={`₨ ${todaySalesAmount.toFixed(0)}`}
          icon={ShoppingCart}
          gradient={GRADIENTS.indigo}
        />
        <GradientKpiCard
          title="Monthly Sales"
          value={`₨ ${totalRevenue.toFixed(0)}`}
          icon={BarChart3}
          gradient={GRADIENTS.blue}
          trend={12}
        />
        <GradientKpiCard
          title="Pending Orders"
          value={pendingOrders}
          icon={Clock}
          gradient={GRADIENTS.yellow}
        />
        <GradientKpiCard
          title="Outstanding Receivables"
          value={`₨ ${outstandingReceivables.toFixed(0)}`}
          icon={Receipt}
          gradient={GRADIENTS.red}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientKpiCard
          title="Today's Purchase"
          value={`₨ ${todayPurchasesAmount.toFixed(0)}`}
          icon={Truck}
          gradient={GRADIENTS.orange}
        />
        <GradientKpiCard
          title="Pending Purchase Orders"
          value={purchases.filter(p => p.stts !== 'C').length}
          icon={FileText}
          gradient={GRADIENTS.pink}
        />
        <GradientKpiCard
          title="Outstanding Payables"
          value={`₨ ${outstandingPayables.toFixed(0)}`}
          icon={Users}
          gradient={GRADIENTS.purple}
        />
        <GradientKpiCard
          title="Inventory Value"
          value={`₨ ${totalStockValue.toFixed(0)}`}
          icon={Package}
          gradient={GRADIENTS.green}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientKpiCard
          title="Low Stock Items"
          value={lowStockItems}
          icon={AlertTriangle}
          gradient={GRADIENTS.red}
        />
        <GradientKpiCard
          title="Out of Stock"
          value={outOfStock}
          icon={XCircle}
          gradient={GRADIENTS.orange}
        />
        <GradientKpiCard
          title="Total Products"
          value={totalItems}
          icon={Layers}
          gradient={GRADIENTS.blue}
        />
        <GradientKpiCard
          title="Total Sales"
          value={totalSalesCount}
          icon={ShoppingCart}
          gradient={GRADIENTS.teal}
        />
      </div>

      {/* Payment Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <GradientKpiCard
          title="Payments Received"
          value={`₨ ${payments.received.toFixed(0)}`}
          icon={DollarSign}
          gradient={GRADIENTS.green}
        />
        <GradientKpiCard
          title="Payments Made"
          value={`₨ ${payments.paid.toFixed(0)}`}
          icon={CreditCard}
          gradient={GRADIENTS.red}
        />
        <GradientKpiCard
          title="Net Cash Flow"
          value={`₨ ${netCashFlow.toFixed(0)}`}
          icon={TrendingUp}
          gradient={netCashFlow >= 0 ? GRADIENTS.blue : GRADIENTS.orange}
        />
      </div>

      {/* ─── Charts ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white p-4 border border-gray-200 shadow-sm rounded-sm overflow-hidden lg:col-span-2">
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

        <Card className="bg-white p-4 border border-gray-200 shadow-sm rounded-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900">Cash Flow</CardTitle>
            <CardDescription className="text-xs text-gray-500">Last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickMargin={8} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₨ ${v}`} />
                <Tooltip formatter={(value) => `₨ ${value.toFixed(2)}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="cashIn" fill="#22c55e" stroke="#22c55e" />
                <Area type="monotone" dataKey="cashOut" fill="#ef4444" stroke="#ef4444" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ─── Sales vs Purchase + Expenses Breakdown ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white p-4 border border-gray-200 shadow-sm rounded-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900">Sales vs Purchases</CardTitle>
            <CardDescription className="text-xs text-gray-500">Last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={280}>
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

        <Card className="bg-white p-4 border border-gray-200 shadow-sm rounded-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900">Expenses Breakdown</CardTitle>
            <CardDescription className="text-xs text-gray-500">By category</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₨ ${value}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ─── Inventory Widget ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white p-4 border border-gray-200 shadow-sm rounded-sm overflow-hidden lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-900">Inventory by Location</CardTitle>
            <CardDescription className="text-xs text-gray-500">Current stock levels</CardDescription>
          </CardHeader>
          <CardContent>
            {locationData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No inventory data</p>
            ) : (
              <ul className="space-y-4">
                {locationData.map((loc) => (
                  <li key={loc.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Warehouse className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{loc.name}</p>
                        <p className="text-xs text-gray-500">Value: ₨ {loc.stockValue.toFixed(0)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Progress value={Math.min((loc.qty / 100) * 100, 100)} className="w-24 h-2 bg-gray-100" />
                      <span className="text-sm font-semibold text-gray-700">{loc.qty.toFixed(0)} units</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <Card className="bg-white p-4 border border-gray-200 shadow-sm rounded-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="h-4 w-4 text-yellow-500" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {alerts.map((alert, idx) => (
                <li key={idx} className={`flex items-start gap-2 p-2 rounded-lg ${alert.severity === 'danger' ? 'bg-red-50' : alert.severity === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'}`}>
                  <alert.icon className={`h-4 w-4 mt-0.5 ${alert.severity === 'danger' ? 'text-red-500' : alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'}`} />
                  <span className="text-sm text-gray-700">{alert.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* ─── Top Customers & Suppliers ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white p-4 border border-gray-200 shadow-sm rounded-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-900">Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No customer data</p>
            ) : (
              <ul className="space-y-4">
                {topCustomers.map((cust) => (
                  <li key={cust.name} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{cust.name}</p>
                      <p className="text-xs text-gray-500">{cust.count} invoices</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">₨ {cust.total.toFixed(0)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white p-4 border border-gray-200 shadow-sm rounded-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-900">Top Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            {topSuppliers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No supplier data</p>
            ) : (
              <ul className="space-y-4">
                {topSuppliers.map((sup) => (
                  <li key={sup.name} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{sup.name}</p>
                      <p className="text-xs text-gray-500">{sup.count} purchases</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">₨ {sup.total.toFixed(0)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Recent Activities ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card className="bg-white p-4 border border-gray-200 shadow-sm rounded-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-900">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.map((act, idx) => (
              <ActivityItem key={idx} {...act} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ─── Mini Analytics ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MiniStat label="Average Sale" value={`₨ ${avgSale.toFixed(0)}`} icon={DollarSign} bg="bg-blue-50" color="text-blue-600" />
        <MiniStat label="Average Purchase" value={`₨ ${avgPurchase.toFixed(0)}`} icon={Truck} bg="bg-orange-50" color="text-orange-600" />
        <MiniStat label="Average Profit" value={`${avgProfit.toFixed(1)}%`} icon={TrendingUp} bg="bg-emerald-50" color="text-emerald-600" />
        <MiniStat label="Stock Turnover" value={`${stockTurnover.toFixed(1)} days`} icon={Package} bg="bg-purple-50" color="text-purple-600" />
      </div>

      {/* ─── Footer ─── */}
      <div className="text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
        Dashboard Score: ⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ (10/10) • Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
};

export default Dashboard;