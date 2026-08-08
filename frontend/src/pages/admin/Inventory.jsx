// src/pages/admin/Inventory.jsx
import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Boxes,
  Search,
  RefreshCw,
  Plus,
  Warehouse,
  Package,
  TrendingUp,
  AlertTriangle,
  MoreHorizontal,
  Filter,
  ChevronDown,
  Weight,
} from 'lucide-react';
import api from '../../api/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ─── Summary Card ───
const SummaryCard = ({ icon: Icon, label, value, subtitle }) => (
  <div className="bg-white rounded-xs border border-gray-200 px-5 py-4 shadow-xl">
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
const StatusBadge = ({ quantity, reorderLevel }) => {
  const qty = Number(quantity || 0);
  const reorder = Number(reorderLevel || 0);

  let label, className;
  if (qty <= 0) {
    label = 'Out of Stock';
    className = 'bg-red-50 text-red-700 border-red-200';
  } else if (qty <= reorder) {
    label = 'Low Stock';
    className = 'bg-amber-50 text-amber-700 border-amber-200';
  } else {
    label = 'In Stock';
    className = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  return (
    <Badge variant="outline" className={`px-3 py-1 text-xs font-medium rounded-full border ${className}`}>
      {label}
    </Badge>
  );
};

// ─── Main Component ───
const Inventory = () => {
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // ── Fetch inventory data ──
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const [purchasesRes, salesRes, itemsRes] = await Promise.all([
        api.get('/purchases/purchase-master/'),
        api.get('/sales/sale-master/'),
        api.get('/inventory/items/'),
      ]);

      const purchases = purchasesRes.data || [];
      const sales = salesRes.data || [];
      const items = itemsRes.data || [];

      // Debug: log first item to see WEIGHT_KG
      console.log('🔍 Items data (first item):', items[0]);

      const stockMap = new Map();

      // ─── 1. Add purchases ──────────────────────────────────────────────
      for (const purchase of purchases) {
        const detailsRes = await api.get(`/purchases/purchase-master/${purchase.id}/`);
        const details = detailsRes.data.details || [];

        for (const detail of details) {
          const itemId = detail.item_code;
          const item = items.find(i => String(i.ITEM_ID) === String(itemId));
          if (!item) continue;

          const locationName = detail.location_display || 'Main Store';
          const key = `${itemId}-${locationName}`;

          const qty = parseFloat(detail.qty) || 0;
          const rate = parseFloat(detail.rate) || 0;

          // ─── Weight fallback ────────────────────────────────────────────
          let weightKg = parseFloat(detail.weight_kg) || 0;
          let weightLbs = parseFloat(detail.weight_lbs) || 0;

          // If detail has no weight, compute from item's WEIGHT_KG
          if (weightKg === 0 && item.WEIGHT_KG) {
            const itemWeightKg = parseFloat(item.WEIGHT_KG) || 0;
            if (itemWeightKg > 0) {
              weightKg = itemWeightKg * qty;
              weightLbs = weightKg * 2.2046;
            }
          }

          if (!stockMap.has(key)) {
            stockMap.set(key, {
              item_id: itemId,
              item_code: item.ITEM_CODE,
              item_name: item.ITEM_NAME,
              uom_name: detail.uom_display || item.UOM?.UOM_NAME || 'PCS',
              location_name: locationName,
              quantity: 0,
              total_cost: 0,
              total_weight_kg: 0,
              total_weight_lbs: 0,
              reorder_level: item.REORDER_LEVEL || 0,
            });
          }

          const entry = stockMap.get(key);
          entry.quantity += qty;
          entry.total_cost += qty * rate;
          entry.total_weight_kg += weightKg;
          entry.total_weight_lbs += weightLbs;
        }
      }

      // ─── 2. Subtract completed sales ──────────────────────────────────
      for (const sale of sales) {
        if (sale.stts !== 'C') continue;

        const detailsRes = await api.get(`/sales/sale-master/${sale.id}/`);
        const details = detailsRes.data.details || [];

        for (const detail of details) {
          const itemId = detail.item_code;
          const item = items.find(i => String(i.ITEM_ID) === String(itemId));
          if (!item) continue;

          const locationName = detail.location_display || 'Main Store';
          const key = `${itemId}-${locationName}`;

          const qty = parseFloat(detail.qty) || 0;

          // Weight fallback for sales
          let weightKg = parseFloat(detail.weight_kg) || 0;
          let weightLbs = parseFloat(detail.weight_lbs) || 0;
          if (weightKg === 0 && item.WEIGHT_KG) {
            const itemWeightKg = parseFloat(item.WEIGHT_KG) || 0;
            if (itemWeightKg > 0) {
              weightKg = itemWeightKg * qty;
              weightLbs = weightKg * 2.2046;
            }
          }

          if (!stockMap.has(key)) {
            stockMap.set(key, {
              item_id: itemId,
              item_code: item.ITEM_CODE,
              item_name: item.ITEM_NAME,
              uom_name: detail.uom_display || item.UOM?.UOM_NAME || 'PCS',
              location_name: locationName,
              quantity: 0,
              total_cost: 0,
              total_weight_kg: 0,
              total_weight_lbs: 0,
              reorder_level: item.REORDER_LEVEL || 0,
            });
          }

          const entry = stockMap.get(key);
          entry.quantity -= qty;
          entry.total_weight_kg -= weightKg;
          entry.total_weight_lbs -= weightLbs;
        }
      }

      // ─── 3. Compute average cost & stock value ──────────────────────
      const inventoryData = Array.from(stockMap.values()).map(entry => {
        const quantity = entry.quantity;
        const totalCost = entry.total_cost;
        const avgCost = quantity > 0 ? totalCost / quantity : 0;
        return {
          ...entry,
          average_cost: avgCost,
          stock_value: totalCost,
          total_weight_kg: Math.max(0, entry.total_weight_kg),
          total_weight_lbs: Math.max(0, entry.total_weight_lbs),
        };
      });

      console.log('📦 Inventory data (purchases - sales):', inventoryData);
      setInventory(inventoryData);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory data');
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // ── Get unique locations ──
  const locations = useMemo(() => {
    const locs = inventory.map(item => item.location_name).filter(Boolean);
    return [...new Set(locs)];
  }, [inventory]);

  // ── Filters ──
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const searchTerm = search.toLowerCase().trim();
      const matchesSearch =
        !searchTerm ||
        item.item_name?.toLowerCase().includes(searchTerm) ||
        item.item_code?.toLowerCase().includes(searchTerm);

      const matchesLocation =
        locationFilter === 'all' || item.location_name === locationFilter;

      let status = 'available';
      if (item.quantity <= 0) status = 'out';
      else if (item.quantity <= item.reorder_level) status = 'low';

      const matchesStatus =
        statusFilter === 'all' || status === statusFilter;

      return matchesSearch && matchesLocation && matchesStatus;
    });
  }, [inventory, search, locationFilter, statusFilter]);

  // ── Summary stats ──
  const summary = useMemo(() => {
    const totalItems = inventory.length;
    const totalUnits = inventory.reduce((sum, i) => sum + i.quantity, 0);
    const totalValue = inventory.reduce((sum, i) => sum + i.stock_value, 0);
    const totalWeightKg = inventory.reduce((sum, i) => sum + i.total_weight_kg, 0);
    const lowStock = inventory.filter(i => i.quantity > 0 && i.quantity <= i.reorder_level).length;
    return { totalItems, totalUnits, totalValue, totalWeightKg, lowStock };
  }, [inventory]);

  // ─── UI ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
            </div>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-3'>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by item or code..."
                className="w-full pl-9 pr-4 py-1 border border-gray-300 rounded-xs text-sm focus:ring focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="h-7 px-3 border border-gray-300 rounded-xs text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
            >
              <option value="all">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-7 px-3 border border-gray-300 rounded-xs text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="available">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
          <div className="">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xs">
              <Plus className="h-4 w-4 mr-2" />
              Stock Adjustment
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <SummaryCard
          icon={Package}
          label="Total Items"
          value={summary.totalItems}
          subtitle="Distinct products"
        />
        <SummaryCard
          icon={Boxes}
          label="Stock Units"
          value={summary.totalUnits.toLocaleString()}
          subtitle="Total quantity"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Stock Value"
          value={`₨ ${summary.totalValue.toFixed(2)}`}
          subtitle="Current inventory value"
        />
        <SummaryCard
          icon={Weight}
          label="Total Weight"
          value={`${summary.totalWeightKg.toFixed(3)} kg`}
          subtitle="Net weight in kg"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Low Stock"
          value={summary.lowStock}
          subtitle="Items below reorder level"
        />
      </div>

      {/* Table */}
      <div className="rounded-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Stock Overview</h2>
            <p className="text-xs text-gray-500">Current inventory across all locations</p>
          </div>
          <span className="text-sm text-gray-500">{filteredInventory.length} items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">UOM</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Weight (kg)</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Weight (lbs)</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg. Cost</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Value</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="11" className="px-5 py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600" />
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-5 py-12 text-center">
                    <Boxes className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium text-gray-700">No inventory found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">{item.item_name}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 font-mono text-xs">{item.item_code}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Warehouse className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{item.location_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-900">
                      {item.quantity.toFixed(3)}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{item.uom_name || '—'}</td>
                    <td className="px-5 py-4 text-right text-gray-700">
                      {item.total_weight_kg.toFixed(3)}
                    </td>
                    <td className="px-5 py-4 text-right text-gray-700">
                      {item.total_weight_lbs.toFixed(3)}
                    </td>
                    <td className="px-5 py-4 text-right text-gray-700">
                      {item.average_cost.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-gray-900">
                      {item.stock_value.toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge quantity={item.quantity} reorderLevel={item.reorder_level} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;