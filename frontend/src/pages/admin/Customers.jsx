// src/pages/Customers/Customers.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import api from '../../api/api';
import AddCustomerModal from '../../components/Customers/AddCustomerModal';

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

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [customerForm, setCustomerForm] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    cell: '',
    ntn: '',
    gst_no: '',
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/accounting/parties/');
      const data = response.data;
      const allParties = Array.isArray(data) ? data : data.results || [];
      // Filter only debtors
      const debtors = allParties.filter(p => p.sub === 'debtor');
      setCustomers(debtors);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
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
      toast.success('Customer deleted successfully');
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    } finally {
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  // ---------- Edit ----------
  const handleEditClick = (customer) => {
    setEditCustomerData(customer);
    setEditDialogOpen(true);
  };

  const confirmEdit = () => {
    if (!editCustomerData) return;
    const customer = editCustomerData;
    setEditingCustomerId(customer.id);
    setCustomerForm({
      code: customer.code || '',
      name: customer.name || '',
      address: customer.address || '',
      phone: customer.phone || '',
      cell: customer.cell || '',
      ntn: customer.ntn || '',
      gst_no: customer.gst_no || '',
    });
    setModalOpen(true);
    setEditDialogOpen(false);
    setEditCustomerData(null);
  };

  // ---------- Add New ----------
  const handleAddNew = () => {
    setEditingCustomerId(null);
    setCustomerForm({
      code: '',
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
    fetchCustomers();
  };

  return (
    <div className="">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="flex space-x-2">
          <button
            onClick={fetchCustomers}
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
        ) : customers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No customers found. Click "Add New" to create one.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700">{customer.sub}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.address || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.gst_no || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEditClick(customer)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteClick(customer.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddCustomerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        customerForm={customerForm}
        setCustomerForm={setCustomerForm}
        editingCustomerId={editingCustomerId}
        onSave={handleSaveSuccess}
        existingCustomers={customers}  // pass debtors for auto-increment
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200 rounded-xs shadow-2xl p-4 max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-gray-900">
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-500 mt-2">
              This action cannot be undone. This will permanently delete this customer and remove its data from the server.
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
              Edit Customer?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-500 mt-2">
              Are you sure you want to edit this customer? You can modify its details.
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
              className="px-4 py-2 border border-transparent rounded-xs text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Customers;