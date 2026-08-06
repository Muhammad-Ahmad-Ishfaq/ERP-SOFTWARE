// src/components/Support/AddAccountSetupModal.jsx
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
import { Settings } from 'lucide-react';
import AccountCombobox from './AccountCombobox';

const AddAccountSetupModal = ({
  open,
  onOpenChange,
  editingSetup,
  onSave,
  loading,
}) => {
  const [form, setForm] = useState({
    cih_code: '',
    freight_code: '',
    t_o_code: '',
    purchase_code: '',
    sale_code: '',
    sale_code_mix: '',
    cashsale_code: '',
    sample_code: '',
    cashdisc_code: '',
    debtor_code: '',
    creditor_code: '',
    lgr_date_from: '',
    lgr_date_to: '',
  });

  useEffect(() => {
    if (editingSetup) {
      setForm({
        cih_code: editingSetup.cih_code || '',
        freight_code: editingSetup.freight_code || '',
        t_o_code: editingSetup.t_o_code || '',
        purchase_code: editingSetup.purchase_code || '',
        sale_code: editingSetup.sale_code || '',
        sale_code_mix: editingSetup.sale_code_mix || '',
        cashsale_code: editingSetup.cashsale_code || '',
        sample_code: editingSetup.sample_code || '',
        cashdisc_code: editingSetup.cashdisc_code || '',
        debtor_code: editingSetup.debtor_code || '',
        creditor_code: editingSetup.creditor_code || '',
        lgr_date_from: editingSetup.lgr_date_from || '',
        lgr_date_to: editingSetup.lgr_date_to || '',
      });
    } else {
      setForm({
        cih_code: '',
        freight_code: '',
        t_o_code: '',
        purchase_code: '',
        sale_code: '',
        sale_code_mix: '',
        cashsale_code: '',
        sample_code: '',
        cashdisc_code: '',
        debtor_code: '',
        creditor_code: '',
        lgr_date_from: '',
        lgr_date_to: '',
      });
    }
  }, [editingSetup, open]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleComboboxChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Build payload – convert empty strings to null, and numeric fields to integers
    const payload = {};
    for (const [key, val] of Object.entries(form)) {
      if (val === '' || val === null || val === undefined) {
        // For date fields, keep empty as null (they are not required)
        if (key === 'lgr_date_from' || key === 'lgr_date_to') {
          payload[key] = null;
        } else {
          // For foreign keys, send null instead of empty string
          payload[key] = null;
        }
      } else {
        // If it's a numeric field (all except dates), convert to integer
        if (key !== 'lgr_date_from' && key !== 'lgr_date_to') {
          payload[key] = Number(val);
        } else {
          payload[key] = val;
        }
      }
    }

    onSave(payload);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full bg-white sm:max-w-2xl overflow-y-auto p-0">
        <div className="p-6">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Settings className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <SheetTitle className="text-xl font-semibold text-gray-900">
                  {editingSetup ? 'Edit Account Setup' : 'Account Setup'}
                </SheetTitle>
                <SheetDescription className="text-sm text-gray-500">
                  {editingSetup ? 'Update account mappings' : 'Configure account mappings for your system'}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">CIH Code</Label>
                <AccountCombobox
                  value={form.cih_code}
                  onChange={(val) => handleComboboxChange('cih_code', val)}
                  placeholder="CIH account..."
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Freight Code</Label>
                <AccountCombobox
                  value={form.freight_code}
                  onChange={(val) => handleComboboxChange('freight_code', val)}
                  placeholder="freight account..."
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">T/O Code</Label>
                <AccountCombobox
                  value={form.t_o_code}
                  onChange={(val) => handleComboboxChange('t_o_code', val)}
                  placeholder="T/O account..."
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Purchase Code</Label>
                <AccountCombobox
                  value={form.purchase_code}
                  onChange={(val) => handleComboboxChange('purchase_code', val)}
                  placeholder="purchase account..."
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Sale Code</Label>
                <AccountCombobox
                  value={form.sale_code}
                  onChange={(val) => handleComboboxChange('sale_code', val)}
                  placeholder="sale account..."
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Sale Code Mix</Label>
                <AccountCombobox
                  value={form.sale_code_mix}
                  onChange={(val) => handleComboboxChange('sale_code_mix', val)}
                  placeholder="sale mix account..."
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Cash Sale Code</Label>
                <AccountCombobox
                  value={form.cashsale_code}
                  onChange={(val) => handleComboboxChange('cashsale_code', val)}
                  placeholder="cash sale account..."
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Sample Code</Label>
                <AccountCombobox
                  value={form.sample_code}
                  onChange={(val) => handleComboboxChange('sample_code', val)}
                  placeholder="sample account..."
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Cash Discount Code</Label>
                <AccountCombobox
                  value={form.cashdisc_code}
                  onChange={(val) => handleComboboxChange('cashdisc_code', val)}
                  placeholder="cash discount account..."
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Debtor Code</Label>
                <AccountCombobox
                  value={form.debtor_code}
                  onChange={(val) => handleComboboxChange('debtor_code', val)}
                  placeholder="debtor account..."
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Creditor Code</Label>
                <AccountCombobox
                  value={form.creditor_code}
                  onChange={(val) => handleComboboxChange('creditor_code', val)}
                  placeholder="creditor account..."
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Date From</Label>
                <Input
                  name="lgr_date_from"
                  type="date"
                  value={form.lgr_date_from}
                  onChange={handleChange}
                  className="mt-1.5 h-9 rounded-xs text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Date To</Label>
                <Input
                  name="lgr_date_to"
                  type="date"
                  value={form.lgr_date_to}
                  onChange={handleChange}
                  className="mt-1.5 h-9 rounded-xs text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 px-5 border-gray-300 text-gray-700 rounded-xs hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-10 px-6 bg-green-600 hover:bg-green-700 rounded-xs text-white transition-colors"
              >
                {loading ? 'Saving...' : editingSetup ? 'Update' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddAccountSetupModal;