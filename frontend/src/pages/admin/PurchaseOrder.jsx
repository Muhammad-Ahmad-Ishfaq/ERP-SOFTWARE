// src/pages/admin/Purchases.jsx
import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, RefreshCw, Pencil, Trash2, Eye, Search,
  ShoppingCart, FileText, Calendar, Hash,
} from 'lucide-react';
import api from '../../api/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AddPurchaseModal from '../../components/Purchases/AddPurchaseModal';
import { Badge } from '@/components/ui/badge';

// ─── Stat Card ───
const StatCard = ({ icon: Icon, label, value }) => (
  <div className="bg-white rounded-lg border border-gray-200 px-5 py-4 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-semibold text-gray-900 mt-0.5">{value}</p>
      </div>
      <div className="p-2 bg-gray-50 rounded-lg">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
    </div>
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
        <Plus className="h-4 w-4 mr-2" />
        {actionLabel}
      </Button>
    )}
  </div>
);

// ─── Status Badge ───
const StatusBadge = ({ status }) => {
  const statusMap = {
    A: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    C: { label: 'Completed', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    V: { label: 'Void', className: 'bg-red-50 text-red-700 border-red-200' },
  };
  const s = statusMap[status] || statusMap.A;
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

// ─── Helpers ───
const computeTotals = (purchase) => {
  const details = purchase.details || [];
  const totalQty = details.reduce((sum, d) => sum + (parseFloat(d.qty) || 0), 0);
  const grandTotal = details.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
  const totalWeightKg = details.reduce((sum, d) => sum + (parseFloat(d.weight_kg) || 0), 0);
  const totalWeightLbs = details.reduce((sum, d) => sum + (parseFloat(d.weight_lbs) || 0), 0);
  return { totalQty, grandTotal, totalWeightKg, totalWeightLbs };
};

const getLocations = (purchase) => {
  const details = purchase.details || [];
  const locs = details
    .map(d => d.location_display || d.location_name || '')
    .filter(Boolean);
  return [...new Set(locs)].join(', ') || '-';
};

// ─── Main Component ───
const Purchases = () => {
  const [loading, setLoading] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchases/purchase-master/');
      setPurchases(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return purchases;
    const q = search.toLowerCase();
    return purchases.filter(
      (p) =>
        p.vtype?.toLowerCase().includes(q) ||
        String(p.vno).includes(q) ||
        p.account_code_display?.toLowerCase().includes(q) ||
        p.purchase_code_display?.toLowerCase().includes(q) ||
        getLocations(p).toLowerCase().includes(q)
    );
  }, [purchases, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/purchases/purchase-master/${deleteId}/`);
      toast.success('Purchase deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    } finally {
      setDeleteDialog(false);
      setDeleteId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Purchase Bills</h1>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search Purchase Bills"
          />
          <Button
            onClick={() => {
              setEditingPurchase(null);
              setModalOpen(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white rounded-xs text-sm h-9 px-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Purchase
          </Button>
        </div>
      </div>

      <div className="rounded-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="w-24 py-3 border-r border-gray-300 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="w-12 py-3 border-r border-gray-300 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">VNO</th>
                <th className="px-5 py-3 border-r border-gray-300 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="w-40 py-3 border-r border-gray-300 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Warehouse</th>
                <th className="w-20 py-3 border-r border-gray-300 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="w-28 py-3 border-r border-gray-300 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Weight (kg)</th>
                <th className="w-28 py-3 border-r border-gray-300 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Weight (lbs)</th>
                <th className="w-32 py-3 border-r border-gray-300 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Grand Total</th>
                <th className="w-32 py-3 border-r border-gray-300 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="w-28 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-5 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="10">
                    <EmptyState
                      icon={ShoppingCart}
                      title="No purchases found"
                      description="Create your first purchase to track your inventory purchases."
                      actionLabel="Add Purchase"
                      onAction={() => {
                        setEditingPurchase(null);
                        setModalOpen(true);
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const { totalQty, grandTotal, totalWeightKg, totalWeightLbs } = computeTotals(p);
                  const locations = getLocations(p);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 border-r border-b border-gray-300 text-sm text-yellow-700">
                        {new Date(p.vdate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 border-r border-b border-gray-300">
                        <span className="inline-flex font-mono text-sm font-medium">{p.vno}</span>
                      </td>
                      <td className="px-5 py-3.5 border-r border-b border-gray-300 text-sm text-gray-900">
                        {p.account_code_display || '-'}
                      </td>
                      <td className="px-5 py-3.5 border-r border-b border-gray-300 text-center text-sm text-gray-700">
                        {locations}
                      </td>
                      <td className="px-5 py-3.5 border-r border-b border-gray-300 text-center font-medium text-blue-700">
                        {totalQty.toFixed(3)}
                      </td>
                      <td className="px-5 py-3.5 border-r border-b border-gray-300 text-center font-medium text-gray-700">
                        {totalWeightKg.toFixed(3)}
                      </td>
                      <td className="px-5 py-3.5 border-r border-b border-gray-300 text-center font-medium text-gray-700">
                        {totalWeightLbs.toFixed(3)}
                      </td>
                      <td className="px-5 py-3.5 border-r border-b border-gray-300 text-center font-medium text-green-700">
                        {grandTotal.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 border-r border-b border-gray-300 text-center">
                        <StatusBadge status={p.stts} />
                      </td>
                      <td className="px-5 py-3.5 border-b border-gray-300 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingPurchase(p);
                              setModalOpen(true);
                            }}
                            className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => { setDeleteId(p.id); setDeleteDialog(true); }}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddPurchaseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingPurchase={editingPurchase}
        onSave={fetchData}
      />

      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-gray-900">Delete Purchase</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-500">
              This purchase record will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialog(false)} className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Purchases;