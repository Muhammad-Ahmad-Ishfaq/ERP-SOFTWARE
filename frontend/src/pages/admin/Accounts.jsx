// src/pages/Accounts/Accounts.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import api from '../../api/api';
import AddAccountModal from '../../components/Accounts/AddAccountModal';

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

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [accountForm, setAccountForm] = useState({
    code: '',
    sub: '',
    name: '',
    address: '',
    phone: '',
    cell: '',
    ntn: '',
    gst_no: '',
  });

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editAccountData, setEditAccountData] = useState(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/accounting/parties/');
      const data = response.data;
      setAccounts(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to load accounts');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // ---------- Delete ----------
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/accounting/parties/${deleteId}/`);
      toast.success('Account deleted successfully');
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  // ---------- Edit ----------
  const handleEditClick = (account) => {
    setEditAccountData(account);
    setEditDialogOpen(true);
  };

  const confirmEdit = () => {
    if (!editAccountData) return;
    const account = editAccountData;
    setEditingAccountId(account.id);
    setAccountForm({
      code: account.code || '',
      sub: account.sub || '',
      name: account.name || '',
      address: account.address || '',
      phone: account.phone || '',
      cell: account.cell || '',
      ntn: account.ntn || '',
      gst_no: account.gst_no || '',
    });
    setModalOpen(true);
    setEditDialogOpen(false);
    setEditAccountData(null);
  };

  // ---------- Add New ----------
  const handleAddNew = () => {
    setEditingAccountId(null);
    setAccountForm({
      code: '',
      sub: '',
      name: '',
      address: '',
      phone: '',
      cell: '',
      ntn: '',
      gst_no: '',
    });
    setModalOpen(true);
  };

  const handleSaveSuccess = () => {
    fetchAccounts();
  };

  return (
    <div className="">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chart of accounts</h1>
        <div className="flex space-x-2">
          <button
            onClick={fetchAccounts}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-xs shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </button>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-xs shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add New
          </button>
        </div>
      </div>

      <div className="bg-white overflow-hidden rounded-xs">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No accounts found. Click "Add New" to create one.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 text-center text-xs font-medium text-gray-500 border-r border-gray-300 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 border-r border-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 border-r border-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 border-r border-gray-300 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 border-r border-gray-300 uppercase tracking-wider">GST</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.map((account, index) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="py-3 border-b border-r border-gray-200 whitespace-nowrap text-sm text-center text-gray-900">{index+1}</td>
                  <td className="px-4 py-3 border-b border-r border-gray-200 whitespace-nowrap text-sm text-gray-900">{account.name}</td>
                  <td className="px-4 py-3 border-b border-r border-gray-200 whitespace-nowrap text-sm text-center text-gray-900">{account.sub}</td>
                  <td className="px-4 py-3 border-b border-r border-gray-200 whitespace-nowrap text-sm font-semibold text-center text-blue-700">{account.phone || '-'}</td>
                  <td className="px-4 py-3 border-b border-r border-gray-200 whitespace-nowrap text-sm text-center text-gray-500">{account.gst_no || '-'}</td>
                  <td className="px-2 py-3 border-b border-gray-200 whitespace-nowrap text-center text-sm font-medium">
                    <button onClick={() => handleEditClick(account)} className="text-teal-600 hover:text-teal-900 mr-3">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteClick(account.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddAccountModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        accountForm={accountForm}
        editingAccountId={editingAccountId}
        onSave={handleSaveSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200 rounded-xs shadow-2xl p-4 max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-gray-900">
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-500 mt-2">
              This action cannot be undone. This will permanently delete this account and remove its data from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end space-x-3 mt-2">
            <AlertDialogCancel 
              onClick={() => setDeleteDialogOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-xs text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="px-4 py-2 border border-transparent rounded-xs text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Confirmation Dialog */}
      <AlertDialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200 rounded-xs shadow-2xl p-4 max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-gray-900">
              Edit Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-500 mt-2">
              Are you sure you want to edit this account? You can modify its details.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end space-x-3 mt-2">
            <AlertDialogCancel 
              onClick={() => setEditDialogOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-xs text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmEdit}
              className="px-4 py-2 border border-transparent rounded-xs text-sm font-medium text-white bg-teal-600 hover:bg-teal-700"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Accounts;