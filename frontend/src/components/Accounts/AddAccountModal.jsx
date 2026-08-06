// src/components/Accounts/AddAccountModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
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
  Tag
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const AddAccountModal = ({
  open,
  onOpenChange,
  accountForm: externalForm,
  editingAccountId,
  onSave,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const [localForm, setLocalForm] = useState({
    code: '',
    sub: '',
    name: '',
    address: '',
    phone: '',
    cell: '',
    ntn: '',
    gst_no: '',
  });

  useEffect(() => {
    if (open) {
      if (externalForm && Object.keys(externalForm).length > 0) {
        setLocalForm({
          code: externalForm.code || '',
          sub: externalForm.sub || '',
          name: externalForm.name || '',
          address: externalForm.address || '',
          phone: externalForm.phone || '',
          cell: externalForm.cell || '',
          ntn: externalForm.ntn || '',
          gst_no: externalForm.gst_no || '',
        });
      } else {
        setLocalForm({
          code: '',
          sub: '',
          name: '',
          address: '',
          phone: '',
          cell: '',
          ntn: '',
          gst_no: '',
        });
      }
    }
  }, [open, externalForm, editingAccountId]);

  const accountTypes = [
    { value: 'debtor', label: 'Debtor' },
    { value: 'creditor', label: 'Creditor' },
    { value: 'expense', label: 'Expense' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'income', label: 'Income' },
    { value: 'bank', label: 'Bank' },
    { value: 'cash', label: 'Cash' },
    { value: 'other', label: 'Other' },
  ];

  const getTypeLabel = (value) => {
    const found = accountTypes.find(t => t.value === value);
    return found ? found.label : value;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!localForm.code || !localForm.sub || !localForm.name) {
      toast.error('Code, Type, and Name are required');
      return;
    }

    setIsLoading(true);
    const payload = {
      code: parseInt(localForm.code, 10),
      sub: localForm.sub,
      name: localForm.name.trim(),
      address: localForm.address || '',
      phone: localForm.phone || '',
      cell: localForm.cell || '',
      ntn: localForm.ntn || '',
      gst_no: localForm.gst_no || '',
    };

    try {
      let response;
      if (editingAccountId) {
        response = await api.put(`/accounting/parties/${editingAccountId}/`, payload);
        toast.success('Account updated successfully');
      } else {
        response = await api.post('/accounting/parties/', payload);
        toast.success('Account created successfully');
      }
      onSave(response.data);
      setTimeout(() => onOpenChange(false), 300);
    } catch (error) {
      console.error('Save error:', error);
      const errMsg = error.response?.data?.detail ||
                     error.response?.data?.message ||
                     'Failed to save account';
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
                {editingAccountId ? 'Edit Account' : 'New Account'}
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
          {/* Code and Type */}
          <div className="grid grid-cols-2 gap-4">
            {/* Code */}
            <div className="space-y-1.5">
              <Label htmlFor="account-code" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                Code
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="account-code"
                  name="code"
                  type="number"
                  value={localForm.code}
                  onChange={handleInputChange}
                  placeholder="Enter code"
                  className="w-full border border-gray-300 rounded-xs shadow-sm px-2 py-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* ======== IMPROVED SELECT ======== */}
            <div className="space-y-1.5">
  <Label
    htmlFor="account-type"
    className="text-sm font-medium text-gray-700"
  >
    Account Type <span className="text-red-500">*</span>
  </Label>

  <select
    id="account-type"
    value={localForm.sub || ""}
    onChange={(e) =>
      setLocalForm((prev) => ({
        ...prev,
        sub: e.target.value,
      }))
    }
    className="
      w-full
      h-[32px]
      rounded-xs
      border
      border-gray-300
      bg-white
      px-2
      text-sm
      text-gray-700
      shadow-sm
      outline-none
      transition
      cursor-pointer
      hover:border-gray-400
      focus:border-orange-500
      focus:ring-2
      focus:ring-orange-500/20
    "
  >
    <option value="" disabled>
      Select type
    </option>

    {accountTypes.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
</div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="account-name" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              Name
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="relative">
              <Input
                id="account-name"
                name="name"
                value={localForm.name}
                onChange={handleInputChange}
                placeholder="Enter account name"
                className="w-full border border-gray-300 rounded-xs shadow-sm px-2 py-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200"
              />
            </div>
          </div>

          <Separator className="my-4" />

          {/* Contact Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="account-phone" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                Phone
              </Label>
              <div className="relative">
                <Input
                  id="account-phone"
                  name="phone"
                  value={localForm.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone"
                  className="w-full border border-gray-300 rounded-xs shadow-sm px-2 py-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account-cell" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                Cell
              </Label>
              <div className="relative">
                <Input
                  id="account-cell"
                  name="cell"
                  value={localForm.cell}
                  onChange={handleInputChange}
                  placeholder="Enter cell"
                  className="w-full border border-gray-300 rounded-xs shadow-sm px-2 py-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label htmlFor="account-address" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              Address
            </Label>
            <div className="relative">
              <textarea
                id="account-address"
                name="address"
                value={localForm.address}
                onChange={handleInputChange}
                placeholder="Enter address"
                className="w-full border border-gray-300 rounded-xs shadow-sm px-2 py-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* Tax Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="account-ntn" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                NTN
              </Label>
              <div className="relative">
                <Input
                  id="account-ntn"
                  name="ntn"
                  value={localForm.ntn}
                  onChange={handleInputChange}
                  placeholder="Enter NTN"
                  className="w-full border border-gray-300 rounded-xs shadow-sm px-2 py-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account-gst" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                GST No
              </Label>
              <div className="relative">
                <Input
                  id="account-gst"
                  name="gst_no"
                  value={localForm.gst_no}
                  onChange={handleInputChange}
                  placeholder="Enter GST No"
                  className="w-full border border-gray-300 rounded-xs shadow-sm px-2 py-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200"
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
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 font-medium">{getTypeLabel(localForm.sub) || '—'}</span>
              </div>
              <div className="col-span-2">
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
                  {editingAccountId ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                <>{editingAccountId ? 'Update' : 'Save'}</>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddAccountModal;