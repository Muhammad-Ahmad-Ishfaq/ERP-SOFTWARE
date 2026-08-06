// src/pages/admin/AccountSetup.jsx
import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, RefreshCw, Pencil, Trash2, Settings, Search,
  Layers, Hash,
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
import AddAccountSetupModal from '@/components/Support/AddAccountSetup';

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

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="p-4 bg-gray-50 rounded-full mb-4">
      <Icon className="h-8 w-8 text-gray-300" />
    </div>
    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    <p className="text-sm text-gray-400 max-w-sm mt-1">{description}</p>
    {actionLabel && (
      <Button
        onClick={onAction}
        variant="outline"
        className="mt-4 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
      >
        <Plus className="h-4 w-4 mr-2" />
        {actionLabel}
      </Button>
    )}
  </div>
);

const CodeChip = ({ children }) => (
  <span className="inline-flex font-mono text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded border border-gray-200">
    {children}
  </span>
);

const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="relative flex-1 max-w-xs">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="pl-9 h-9 bg-white border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all"
    />
  </div>
);

const AccountSetup = () => {
  const [loading, setLoading] = useState(false);
  const [setups, setSetups] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // ✅ CORRECT API BASE – matches your backend routing
  const API_BASE = '/accounting/account-setup';

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_BASE + '/');
      setSetups(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load account setups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return setups;
    const q = search.toLowerCase();
    return setups.filter(
      (s) =>
        (s.purchase_code && s.purchase_code.toLowerCase().includes(q)) ||
        (s.sale_code && s.sale_code.toLowerCase().includes(q)) ||
        (s.debtor_code && s.debtor_code.toLowerCase().includes(q)) ||
        (s.creditor_code && s.creditor_code.toLowerCase().includes(q))
    );
  }, [setups, search]);

  const handleSave = async (formData) => {
    setLoading(true);
    try {
      const url = editing
        ? `${API_BASE}/${editing.id}/`
        : API_BASE + '/';
      const method = editing ? 'put' : 'post';
      await api({ method, url, data: formData });
      toast.success(editing ? 'Account setup updated' : 'Account setup created');
      setModalOpen(false);
      setEditing(null);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`${API_BASE}/${deleteId}/`);
      toast.success('Account setup deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    } finally {
      setDeleteDialog(false);
      setDeleteId(null);
    }
  };

  const openEdit = (setup) => {
    setEditing(setup);
    setModalOpen(true);
  };

  return (
    <div>
      {/* Header & toolbar – unchanged */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl font-semibold">Account Setup</h1>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="bg-teal-600 hover:bg-teal-700 rounded-xs text-white text-sm h-9 px-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Setup
          </Button>
        </div>
      </div>

      {/* Table – unchanged */}
      <div className="rounded-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Purchase Code</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sale Code</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Debtor Code</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Creditor Code</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date From</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date To</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
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
                      icon={Settings}
                      title="No account setups"
                      description="Configure account codes for different transaction types."
                      onAction={() => {
                        setEditing(null);
                        setModalOpen(true);
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{s.id}</td>
                    <td className="px-5 py-3.5">
                      <CodeChip>{s.purchase_code || '—'}</CodeChip>
                    </td>
                    <td className="px-5 py-3.5">
                      <CodeChip>{s.sale_code || '—'}</CodeChip>
                    </td>
                    <td className="px-5 py-3.5">
                      <CodeChip>{s.debtor_code || '—'}</CodeChip>
                    </td>
                    <td className="px-5 py-3.5">
                      <CodeChip>{s.creditor_code || '—'}</CodeChip>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{s.lgr_date_from || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{s.lgr_date_to || '—'}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setDeleteId(s.id); setDeleteDialog(true); }}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AddAccountSetupModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingSetup={editing}
        onSave={handleSave}
        loading={loading}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-gray-900">Delete Account Setup</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-500">
              This account setup will be removed from the system. This action cannot be undone.
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

export default AccountSetup;