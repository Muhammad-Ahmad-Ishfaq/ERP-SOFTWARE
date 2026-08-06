// src/components/Companies/AddCompanyModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Building2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api.js';

const AddCompanyModal = ({ open, onOpenChange, onSave, editingCompany, isStandalone = false }) => {
  const [loading, setLoading] = useState(false);
  const emptyForm = {
    name: '',
    business_type: '',
    industry: '',
    address: '',
    city: '',
    phone: '',
    mobile: '',
    email: '',
    ntn: '',
    gst_no: '',
    year: new Date().getFullYear(),
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (editingCompany) {
      setForm({
        name: editingCompany.name || '',
        business_type: editingCompany.business_type || '',
        industry: editingCompany.industry || '',
        address: editingCompany.address || '',
        city: editingCompany.city || '',
        phone: editingCompany.phone || '',
        mobile: editingCompany.mobile || '',
        email: editingCompany.email || '',
        ntn: editingCompany.ntn || '',
        gst_no: editingCompany.gst_no || '',
        year: editingCompany.year || new Date().getFullYear(),
      });
    } else {
      setForm(emptyForm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingCompany]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.year) {
      toast.error('Company name and year are required');
      return;
    }
    setLoading(true);
    try {
      const url = editingCompany ? `/core/companies/${editingCompany.id}/` : '/core/companies/';
      const method = editingCompany ? 'put' : 'post';
      await api({ method, url, data: form });
      toast.success(editingCompany ? 'Company updated' : 'Company created');
      onSave();
      if (!editingCompany) {
        setForm(emptyForm);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to save company');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!isStandalone) onOpenChange(false);
  };

  // All fields and sections are written inline – no reusable components.

  const content = (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* SECTION: Company Details */}
      <div>
        <div className="mb-4">
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">
            Company Details
          </h3>
          <p className="mt-0.5 text-[13px] text-slate-400">
            The legal identity of the business you're registering.
          </p>
          <div className="mt-3 h-px bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
          {/* Company Name – full width */}
          <div className="md:col-span-1 space-y-1.5">
            <Label htmlFor="name" className="text-[13px] font-medium text-slate-700">
              Company Name <span className="ml-0.5 text-teal-700">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., ABC Traders"
              required
              className="h-10 w-full rounded-xs border-slate-300 text-[14px] text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:border-orange-600 focus-visible:ring-1 focus-visible:ring-orange-600"
            />
          </div>
          {/* Business Type */}
          <div className="space-y-1.5">
            <Label htmlFor="business_type" className="text-[13px] font-medium text-slate-700">
              Business Type <span className="ml-0.5 text-teal-700">*</span>
            </Label>
            <Input
              id="business_type"
              name="business_type"
              value={form.business_type}
              onChange={handleChange}
              placeholder="e.g., Trading"
              required
              className="h-10 w-full rounded-xs border-slate-300 text-[14px] text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:border-orange-600 focus-visible:ring-1 focus-visible:ring-orange-600"
            />
          </div>
          {/* Industry */}
          <div className="space-y-1.5">
            <Label htmlFor="industry" className="text-[13px] font-medium text-slate-700">
              Industry
            </Label>
            <Input
              id="industry"
              name="industry"
              value={form.industry}
              onChange={handleChange}
              placeholder="e.g., General Trading"
              className="h-10 w-full rounded-xs border-slate-300 text-[14px] text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:border-orange-600 focus-visible:ring-1 focus-visible:ring-orange-600"
            />
          </div>
          {/* Fiscal Year */}
          <div className="space-y-1.5">
            <Label htmlFor="year" className="text-[13px] font-medium text-slate-700">
              Fiscal Year <span className="ml-0.5 text-orange-700">*</span>
            </Label>
            <Input
              id="year"
              name="year"
              type="number"
              value={form.year}
              onChange={handleChange}
              placeholder="e.g., 2026"
              required
              className="h-10 w-full rounded-xs border-slate-300 text-[14px] text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:border-orange-600 focus-visible:ring-1 focus-visible:ring-orange-600"
            />
          </div>
        </div>
      </div>

      {/* SECTION: Contact Information */}
      <div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
          {/* City */}
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-[13px] font-medium text-slate-700">
              City
            </Label>
            <Input
              id="city"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="e.g., Lahore"
              className="h-10 w-full rounded-xs border-slate-300 text-[14px] text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:border-orange-600 focus-visible:ring-1 focus-visible:ring-orange-600"
            />
          </div>
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[13px] font-medium text-slate-700">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="info@company.com"
              className="h-10 w-full rounded-xs border-slate-300 text-[14px] text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:border-orange-600 focus-visible:ring-1 focus-visible:ring-orange-600"
            />
          </div>
          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-[13px] font-medium text-slate-700">
              Phone
            </Label>
            <Input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g., 042-1234567"
              className="h-10 w-full rounded-xs border-slate-300 text-[14px] text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:border-orange-600 focus-visible:ring-1 focus-visible:ring-orange-600"
            />
          </div>
          {/* Mobile */}
          <div className="space-y-1.5">
            <Label htmlFor="mobile" className="text-[13px] font-medium text-slate-700">
              Mobile
            </Label>
            <Input
              id="mobile"
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              placeholder="e.g., 0300-1234567"
              className="h-10 w-full rounded-xs border-slate-300 text-[14px] text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:border-orange-600 focus-visible:ring-1 focus-visible:ring-orange-600"
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="address" className="text-[13px] font-medium text-slate-700">
              Address
            </Label>
            <Input
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Enter full address"
              className="h-10 w-full rounded-xs border-slate-300 text-[14px] text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:border-orange-600 focus-visible:ring-1 focus-visible:ring-orange-600"
            />
          </div>
        </div>
      </div>


      {/* SECTION: Tax Registration */}
      <div>
        <div className="mb-4">
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">
            Tax Registration
          </h3>
          <p className="mt-0.5 text-[13px] text-slate-400">
            Used on invoices and statutory filings.
          </p>
          <div className="mt-3 h-px bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
          {/* NTN */}
          <div className="space-y-1.5">
            <Label htmlFor="ntn" className="text-[13px] font-medium text-slate-700">
              NTN
            </Label>
            <Input
              id="ntn"
              name="ntn"
              value={form.ntn}
              onChange={handleChange}
              placeholder="e.g., 1234567"
              className="h-10 w-full rounded-xs border-slate-300 text-[14px] text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:border-orange-600 focus-visible:ring-1 focus-visible:ring-orange-600"
            />
          </div>
          {/* GST / STRN */}
          <div className="space-y-1.5">
            <Label htmlFor="gst_no" className="text-[13px] font-medium text-slate-700">
              GST / STRN
            </Label>
            <Input
              id="gst_no"
              name="gst_no"
              value={form.gst_no}
              onChange={handleChange}
              placeholder="e.g., GST-123"
              className="h-10 w-full rounded-xs border-slate-300 text-[14px] text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:border-orange-600 focus-visible:ring-1 focus-visible:ring-orange-600"
            />
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
        {!isStandalone && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="h-10 border-slate-300 px-5 rounded-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading}
          className="h-10 bg-orange-600 px-6 font-medium text-white rounded-xs shadow-sm hover:bg-orange-700 disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving
            </>
          ) : (
            editingCompany ? 'Update Details' : 'Save Details'
          )}
        </Button>
      </div>
    </form>
  );

  if (isStandalone) {
    return content;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-white p-0 sm:max-w-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-orange-800/10">
                <Building2 className="h-4.5 w-4.5 text-orange-600" />
              </div>
              <div>
                <SheetTitle className="text-[16px] font-semibold text-slate-900">
                  {editingCompany ? 'Edit Company' : 'Register Company'}
                </SheetTitle>
                <p className="text-[13px] text-slate-500">
                  {editingCompany
                    ? 'Update the details on file for this company.'
                    : 'Add a new company to your workspace.'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-6">{content}</div>
      </SheetContent>
    </Sheet>
  );
};

export default AddCompanyModal;