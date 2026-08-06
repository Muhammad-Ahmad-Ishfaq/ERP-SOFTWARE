// src/components/Suppliers/AddSupplierModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Hash,
  User,
  Home,
  Phone,
  Smartphone,
  FileText,
  CreditCard,
  X,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const AddSupplierModal = ({
  open,
  onOpenChange,
  supplierForm: externalForm,
  setSupplierForm: externalSetForm,
  editingSupplierId,
  onSave,
  existingSuppliers = [],
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Internal local state
  const [localForm, setLocalForm] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    cell: '',
    ntn: '',
    gst_no: '',
  });

  // Sync with external form and auto-increment code for new entries
  useEffect(() => {
    if (open) {
      if (editingSupplierId) {
        // Editing: use externalForm values
        if (externalForm && Object.keys(externalForm).length > 0) {
          setLocalForm({
            code: externalForm.code || '',
            name: externalForm.name || '',
            address: externalForm.address || '',
            phone: externalForm.phone || '',
            cell: externalForm.cell || '',
            ntn: externalForm.ntn || '',
            gst_no: externalForm.gst_no || '',
          });
        }
      } else {
        // New entry: compute next code from existing suppliers (creditors)
        const maxCode = existingSuppliers.reduce((max, s) => Math.max(max, s.code), 0);
        const nextCode = maxCode + 1;
        setLocalForm({
          code: String(nextCode),
          name: '',
          address: '',
          phone: '',
          cell: '',
          ntn: '',
          gst_no: '',
        });
      }
    }
  }, [open, externalForm, editingSupplierId, existingSuppliers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!localForm.code || !localForm.name) {
      toast.error('Code and Name are required');
      return;
    }

    setIsLoading(true);
    const payload = {
      code: parseInt(localForm.code, 10),
      sub: 'creditor',                     // always creditor for suppliers
      name: localForm.name.trim(),
      address: localForm.address || '',
      phone: localForm.phone || '',
      cell: localForm.cell || '',
      ntn: localForm.ntn || '',
      gst_no: localForm.gst_no || '',
    };

    try {
      let response;
      if (editingSupplierId) {
        response = await api.put(`/accounting/parties/${editingSupplierId}/`, payload);
        toast.success('Supplier updated successfully');
      } else {
        response = await api.post('/accounting/parties/', payload);
        toast.success('Supplier created successfully');
      }
      onSave(response.data);
      setTimeout(() => onOpenChange(false), 300);
    } catch (error) {
      console.error('Save error:', error);
      const errMsg = error.response?.data?.detail ||
                     error.response?.data?.message ||
                     'Failed to save supplier';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-2xl p-0 bg-white shadow-2xl border-l border-gray-200 overflow-y-auto"
        style={{ backgroundColor: '#ffffff' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-1.5">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl font-semibold text-gray-900">
                {editingSupplierId ? 'Edit Supplier' : 'New Supplier'}
              </SheetTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-xs text-gray-400 hover:text-gray-500 hover:bg-gray-100 h-9 w-9 font-bold"
            >
              <X className="h-7 w-7 font-bold" />
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <form className="flex-1 overflow-y-auto px-4 py-2 space-y-5">
          {/* Code */}
          <div className="space-y-1.5">
            <Label htmlFor="supplier-code" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              Code
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="relative">
              <Input
                id="supplier-code"
                name="code"
                type="number"
                value={localForm.code}
                onChange={handleInputChange}
                placeholder="Enter code"
                className="w-full border border-gray-300 rounded-xs shadow-sm px-3 py-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="supplier-name" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              Name
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="relative">
              <Input
                id="supplier-name"
                name="name"
                value={localForm.name}
                onChange={handleInputChange}
                placeholder="Enter supplier name"
                className="w-full border border-gray-300 rounded-xs shadow-sm px-3 py-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              />
            </div>
          </div>

          <Separator className="my-4" />

          {/* Contact Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="supplier-phone" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                Phone
              </Label>
              <div className="relative">
                <Input
                  id="supplier-phone"
                  name="phone"
                  value={localForm.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone"
                  className="w-full border border-gray-300 rounded-xs shadow-sm px-3 py-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="supplier-cell" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                Cell
              </Label>
              <div className="relative">
                <Input
                  id="supplier-cell"
                  name="cell"
                  value={localForm.cell}
                  onChange={handleInputChange}
                  placeholder="Enter cell"
                  className="w-full border border-gray-300 rounded-xs shadow-sm px-3 py-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label htmlFor="supplier-address" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              Address
            </Label>
            <div className="relative">
              <Input
                id="supplier-address"
                name="address"
                value={localForm.address}
                onChange={handleInputChange}
                placeholder="Enter address"
                className="w-full border border-gray-300 rounded-xs shadow-sm px-3 py-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Tax Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="supplier-ntn" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                NTN
              </Label>
              <div className="relative">
                <Input
                  id="supplier-ntn"
                  name="ntn"
                  value={localForm.ntn}
                  onChange={handleInputChange}
                  placeholder="Enter NTN"
                  className="w-full border border-gray-300 rounded-xs shadow-sm px-3 py-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="supplier-gst" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                GST No
              </Label>
              <div className="relative">
                <Input
                  id="supplier-gst"
                  name="gst_no"
                  value={localForm.gst_no}
                  onChange={handleInputChange}
                  placeholder="Enter GST No"
                  className="w-full border border-gray-300 rounded-xs shadow-sm px-3 py-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Live Preview */}
          <div className="border border-gray-200 rounded-xs p-4 space-y-2">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <Eye className="h-4 w-4" />
              <span>Live Preview</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Code:</span>
                <span className="ml-2 font-medium">{localForm.code || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500">Name:</span>
                <span className="ml-2 font-medium">{localForm.name || '—'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Phone:</span>
                <span className="ml-2 font-medium">{localForm.phone || '—'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Cell:</span>
                <span className="ml-2 font-medium">{localForm.cell || '—'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Address:</span>
                <span className="ml-2 font-medium">{localForm.address || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500">NTN:</span>
                <span className="ml-2 font-medium">{localForm.ntn || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500">GST:</span>
                <span className="ml-2 font-medium">{localForm.gst_no || '—'}</span>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Footer Actions */}
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-xs shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="px-8 py-2 border border-transparent rounded-xs shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors duration-200 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  {editingSupplierId ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                <>{editingSupplierId ? 'Update' : 'Save'}</>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddSupplierModal;