// src/pages/admin/SaleBills.jsx
import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, RefreshCw, Pencil, Trash2, Eye, Search,
  ShoppingCart, FileText, Calendar, Hash, CheckCircle,
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
import AddSaleBillModal from '../../components/Sales/AddSaleBillModal';
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

// ─── Main Component ───
const SaleBills = () => {
  const [loading, setLoading] = useState(false);
  const [saleBills, setSaleBills] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSaleBill, setEditingSaleBill] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales/sale-master/');
      const data = (res.data || []).map(bill => ({
        ...bill,
        details: bill.details || [],
      }));
      setSaleBills(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load sale bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const computeTotals = (bill) => {
    const details = bill.details || [];
    const totalQty = details.reduce((sum, d) => sum + (parseFloat(d.qty) || 0), 0);
    const grandTotal = details.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    return { totalQty, grandTotal };
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return saleBills;
    const q = search.toLowerCase();
    return saleBills.filter(
      (p) =>
        p.vtype?.toLowerCase().includes(q) ||
        String(p.vno).includes(q) ||
        p.account_code_display?.toLowerCase().includes(q)
    );
  }, [saleBills, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/sales/sale-master/${deleteId}/`);
      toast.success('Sale Bill deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    } finally {
      setDeleteDialog(false);
      setDeleteId(null);
    }
  };

  const totalBills = saleBills.length;
  const totalPending = saleBills.filter(p => p.stts === 'P').length;
  const totalCompleted = saleBills.filter(p => p.stts === 'C').length;

  return (
    <div>
      {/* Stats */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={ShoppingCart} label="Total Bills" value={totalBills} />
        <StatCard icon={FileText} label="Pending" value={totalPending} />
        <StatCard icon={CheckCircle} label="Completed" value={totalCompleted} />
      </div> */}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div>
          <h1 className='text-2xl font-bold'>Sale Bills</h1>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search Sale Bills"
          />
          <Button
            onClick={() => {
              setEditingSaleBill(null);
              setModalOpen(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white rounded-xs text-sm h-9 px-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Invoice
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Voucher</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Qty</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Grand Total</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <EmptyState
                      icon={ShoppingCart}
                      title="No sale bills found"
                      description="Create your first sale bill to track sales to customers."
                    //   actionLabel="Add Bill"
                      onAction={() => {
                        setEditingSaleBill(null);
                        setModalOpen(true);
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const { totalQty, grandTotal } = computeTotals(p);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="inline-flex font-mono text-sm font-medium bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded border border-gray-200">
                          {p.vtype}-{String(p.vno).padStart(4, '0')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">
                        {new Date(p.vdate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-900">
                        {p.account_code_display || '-'}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-gray-700">
                        {totalQty.toFixed(3)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-gray-900">
                        ₨ {grandTotal.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={p.stts} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingSaleBill(p);
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

      {/* Modal */}
      <AddSaleBillModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingSaleBill={editingSaleBill}
        onSave={fetchData}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-gray-900">Delete Sale Bill</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-500">
              This sale bill will be permanently removed. This action cannot be undone.
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

export default SaleBills;