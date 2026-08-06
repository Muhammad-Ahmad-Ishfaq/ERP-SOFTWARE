// src/components/Support/AddVoucherTypesModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tag } from 'lucide-react';

const AddVoucherTypesModal = ({
  open,
  onOpenChange,
  editingVoucher,
  onSave,
  loading,
}) => {
  const [form, setForm] = useState({
    code: '',
    description: '',
  });

  useEffect(() => {
    if (editingVoucher) {
      setForm({
        code: editingVoucher.vtype || '',
        description: editingVoucher.vtype_description || '',
      });
    } else {
      setForm({ code: '', description: '' });
    }
  }, [editingVoucher, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-white overflow-y-auto p-0">
        <div className="p-6">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Tag className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <SheetTitle className="text-xl font-semibold text-gray-900">
                  {editingVoucher ? 'Edit Voucher Type' : 'New Voucher Type'}
                </SheetTitle>
                <SheetDescription className="text-sm text-gray-500">
                  {editingVoucher ? 'Update the voucher type' : 'Create a new voucher type'}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Code */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Code <span className="text-red-500">*</span></Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g., PUR"
                className="mt-1.5 h-10 font-mono rounded-xs text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                required
                maxLength={5}
              />
            </div>

            {/* Description (serves as Name) */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Description <span className="text-red-500">*</span></Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g., Purchase Voucher"
                className="mt-1.5 h-10 text-sm rounded-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 px-5 border-gray-300 rounded-xs text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-10 px-6 bg-green-600 hover:bg-green-700 rounded-xs text-white transition-colors"
              >
                {loading ? 'Saving...' : editingVoucher ? 'Update' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddVoucherTypesModal;