// src/pages/admin/Locations.jsx
import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, Pencil, Trash2, Search, MapPin, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Badge } from '@/components/ui/badge';

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

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="p-4 bg-gray-50 rounded-full mb-4">
      <Icon className="h-8 w-8 text-gray-300" />
    </div>
    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    <p className="text-sm text-gray-400 max-w-sm mt-1">{description}</p>
  </div>
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

// ─── Auto-generate code function ───
const generateCode = (locations) => {
  if (!locations || locations.length === 0) {
    return '1';
  }
  // Extract numbers from existing codes
  const numbers = locations
    .map(l => {
      const match = l.code?.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    })
    .filter(n => n > 0);
  
  const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
  const nextNum = maxNum + 1;
  return `${String(nextNum)}`;
};

const Locations = () => {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState('');
  const [editingLocation, setEditingLocation] = useState(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    is_active: true,
  });
  
  // Delete Dialog
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Dialog
  const [editDialog, setEditDialog] = useState(false);
  const [editLocationData, setEditLocationData] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/locations/locations/');
      setLocations(res.data);
      // Auto-generate code when data loads
      if (res.data && res.data.length > 0) {
        const newCode = generateCode(res.data);
        setForm(prev => ({ ...prev, code: newCode }));
      } else {
        setForm(prev => ({ ...prev, code: '1' }));
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-generate code when locations change (after add/delete)
 // ─── Auto-generate code function ───
const generateCode = (locations) => {
  if (!locations || locations.length === 0) {
    return '1';
  }
  // Extract numbers from existing codes
  const numbers = locations
    .map(l => {
      const num = parseInt(l.code);
      return isNaN(num) ? 0 : num;
    })
    .filter(n => n > 0);
  
  const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
  const nextNum = maxNum + 1;
  return String(nextNum);
};
  const filtered = useMemo(() => {
    if (!search.trim()) return locations;
    const q = search.toLowerCase();
    return locations.filter(
      (l) =>
        l.code?.toLowerCase().includes(q) ||
        l.name?.toLowerCase().includes(q)
    );
  }, [locations, search]);

  const activeCount = locations.filter((l) => l.is_active).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.name) {
      toast.error('Code and Name are required');
      return;
    }
    setLoading(true);
    try {
      const url = editingLocation ? `/locations/locations/${editingLocation.id}/` : '/locations/locations/';
      const method = editingLocation ? 'put' : 'post';
      await api({ method, url, data: form });
      toast.success(editingLocation ? 'Location updated' : 'Location created');
      setEditingLocation(null);
      setForm({ code: '', name: '', description: '', is_active: true });
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
    setIsDeleting(true);
    try {
      await api.delete(`/locations/locations/${deleteId}/`);
      toast.success('Location deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    } finally {
      setIsDeleting(false);
      setDeleteDialog(false);
      setDeleteId(null);
    }
  };

  const openEdit = (location) => {
    setEditLocationData(location);
    setEditDialog(true);
  };

  const confirmEdit = () => {
    if (!editLocationData) return;
    setEditingLocation(editLocationData);
    setForm({
      code: editLocationData.code || '',
      name: editLocationData.name || '',
      description: editLocationData.description || '',
      is_active: editLocationData.is_active !== undefined ? editLocationData.is_active : true,
    });
    setEditDialog(false);
    setEditLocationData(null);
    document.getElementById('location-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingLocation(null);
    setForm({ code: '', name: '', description: '', is_active: true });
    // Regenerate code when canceling edit
    if (locations.length > 0) {
      const newCode = generateCode(locations);
      setForm(prev => ({ ...prev, code: newCode }));
    } else {
      setForm(prev => ({ ...prev, code: '1' }));
    }
  };

  return (
    <div>
      {/* Add/Edit Form */}
      <div id="location-form" className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-2xl font-bold text-gray-700">
            {editingLocation ? 'Edit Warehouse' : 'Add New Warehouse'}
          </h3>
          {editingLocation && (
            <button
              onClick={cancelEdit}
              className="ml-auto text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-4">
            <div>
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Code <span className="text-red-500">*</span></Label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="mt-1 h-9 text-sm px-2 border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none rounded-xs"
              required
              readOnly={!editingLocation} // Auto-generated when adding new
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Name <span className="text-red-500">*</span></Label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Main Warehouse"
              className="mt-1 h-9 text-sm px-2 border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none rounded-xs"
              required
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</Label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description"
              className="mt-1 h-9 text-sm px-2 border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none rounded-xs"
            />
          </div>
          <div className="">
            <Button
              type="submit"
              disabled={loading}
              className="mt-4 h-9 px-8 bg-green-600 hover:bg-green-700 text-white text-sm rounded-none transition-colors"
            >
              {loading ? 'Saving...' : editingLocation ? 'Update' : 'Save'}
            </Button>
          </div>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <EmptyState
                      icon={MapPin}
                      title="No warehouses"
                      description="Warehouses are used to track inventory across different storage locations."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="inline-flex text-sm font-medium text-gray-700">
                        {l.code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{l.name}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{l.description || '—'}</td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant="outline"
                        className={`px-3 py-0.5 text-xs font-medium rounded-full border ${
                          l.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}
                      >
                        {l.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(l)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                          title="Edit Warehouse"
                        >
                          <Pencil className="h-4 w-4 text-green-600" />
                        </button>
                        <button
                          onClick={() => { setDeleteId(l.id); setDeleteDialog(true); }}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Warehouse"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
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

      {/* Edit Confirmation Dialog */}
      <AlertDialog open={editDialog} onOpenChange={setEditDialog}>
        <AlertDialogContent className="max-w-md bg-white border-0 shadow-2xl rounded-none p-0 overflow-hidden">
          <div className="bg-none px-6 py-3 border-b border-teal-100">
            <AlertDialogTitle className="text-lg font-semibold text-gray-900">
              Edit Warehouse
            </AlertDialogTitle>
          </div>
          <div className="px-6 py-5">
            <AlertDialogDescription className="text-sm text-gray-600 leading-relaxed">
              Are you sure you want to edit this warehouse?
              <br />
              <span className="text-xs text-gray-400 mt-1 block">
                You will be able to modify the code, name, description, and status.
              </span>
            </AlertDialogDescription>
          </div>
          <AlertDialogFooter className="px-6 py-4 bg-none border-t border-gray-100 flex items-center justify-end gap-3">
            <AlertDialogCancel 
              onClick={() => setEditDialog(false)} 
              className="h-9 px-5 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-none transition-colors text-sm font-medium"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmEdit} 
              className="h-9 px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-none transition-colors text-sm font-medium shadow-sm"
            >
              Edit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent className="max-w-md bg-white border-0 shadow-2xl rounded-xs p-0 overflow-hidden">
          <div className="bg-none px-6 py-2 border-b border-gray-300">
            <AlertDialogTitle className="text-lg font-semibold text-gray-900">
              Delete Warehouse
            </AlertDialogTitle>
          </div>
          <div className="px-6 py-5">
            <AlertDialogDescription className="text-sm text-gray-600 leading-relaxed">
              Are you sure you want to permanently delete this warehouse?
              <br />
              <span className="text-xs text-gray-400 mt-1 block">
                This action cannot be undone and all associated data will be removed.
              </span>
            </AlertDialogDescription>
          </div>
          <AlertDialogFooter className="px-6 py-4 bg-none border-t border-gray-100 flex items-center justify-end gap-3">
            <AlertDialogCancel 
              onClick={() => setDeleteDialog(false)} 
              className="h-7 px-5 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-none transition-colors text-sm font-medium"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="h-7 px-5 bg-red-600 hover:bg-red-700 text-white rounded-none transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Deleting...
                </span>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Locations;