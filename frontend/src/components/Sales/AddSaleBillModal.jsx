// src/components/Sales/AddSaleBillModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Search, ChevronDown, ChevronDownIcon, FileText, CheckCircle, Circle } from 'lucide-react';
import { Combobox } from '@headlessui/react';
import toast from 'react-hot-toast';
import api from '../../api/api';

// ─── Status options ───
const statusOptions = [
  { value: 'P', label: 'Pending', color: 'text-yellow-500' },
  { value: 'D', label: 'Draft', color: 'text-gray-500' },
  { value: 'C', label: 'Completed', color: 'text-emerald-500' },
  { value: 'V', label: 'Cancelled', color: 'text-red-500' },
];

const AddSaleBillModal = ({ open, onOpenChange, editingSaleBill, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [nextVoucherNo, setNextVoucherNo] = useState(1);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ── Drawer state ──
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [pendingSOs, setPendingSOs] = useState([]);
  const [soLoading, setSoLoading] = useState(false);
  const [soSearchTerm, setSoSearchTerm] = useState('');
  const [selectedSOId, setSelectedSOId] = useState(null);
  const [soCurrentPage, setSoCurrentPage] = useState(1);
  const soItemsPerPage = 10;

  // ── Animation state ──
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(false);
      const timer = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => cancelAnimationFrame(timer);
    } else {
      setIsVisible(false);
    }
  }, [open]);

  // ── Form state ──
  const [master, setMaster] = useState({
    vtype: 'SB',
    vno: null,
    vdate: new Date().toISOString().split('T')[0],
    dc_no: '',
    account_code: '',
    remarks: '',
    discount: 0,
    stts: 'P',
    user_no: '',
  });

  // ── Dynamic detail rows (no weight_per_unit) ──
  const createEmptyRow = (vsn) => ({
    vsn,
    item_code: '',
    uom: '',
    qty: 0,
    rate: 0,
    amount: 0,
    location: null,
    weight_kg: 0,
    weight_lbs: 0,
  });

  const [details, setDetails] = useState(
    Array.from({ length: 8 }, (_, i) => createEmptyRow(i + 1))
  );

  const isRowFilled = (row) => row.item_code && row.uom && row.qty > 0 && row.rate > 0;

  // ── Dropdown data ──
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [locations, setLocations] = useState([]);

  // ── Combobox queries ──
  const [customerQuery, setCustomerQuery] = useState('');
  const [itemQueries, setItemQueries] = useState({});
  const [uomQueries, setUomQueries] = useState({});
  const [locationQueries, setLocationQueries] = useState({});

  const getCurrentUserId = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.USER_ID || user.id || 1;
      }
    } catch (e) {
      console.warn('Could not read user from localStorage', e);
    }
    return 1;
  };

  const fetchNextVoucherNo = async () => {
    try {
      const res = await api.get('/sales/sale-master/next-voucher/');
      setNextVoucherNo(res.data.next_voucher_no || 1);
      setMaster(prev => ({ ...prev, vno: res.data.next_voucher_no || 1 }));
    } catch (error) {
      console.error('Error fetching next voucher number:', error);
      try {
        const res = await api.get('/sales/sale-master/');
        const sales = res.data || [];
        const maxVno = sales.reduce((max, s) => Math.max(max, s.vno || 0), 0);
        const next = maxVno + 1;
        setNextVoucherNo(next);
        setMaster(prev => ({ ...prev, vno: next }));
      } catch (fallbackError) {
        setNextVoucherNo(1);
      }
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [customersRes, itemsRes, unitsRes, locationsRes] = await Promise.all([
        api.get('/accounting/parties/?sub=debtor'),
        api.get('/inventory/items/'),
        api.get('/inventory/units/'),
        api.get('/locations/locations/'),
      ]);
      setCustomers(customersRes.data || []);
      setItems(itemsRes.data || []);
      setUnits(unitsRes.data || []);
      setLocations(locationsRes.data || []);
    } catch (error) {
      console.error('Error fetching dropdowns:', error);
    }
  };

  const fetchPendingSOs = async () => {
    setSoLoading(true);
    try {
      const res = await api.get('/sale-orders/sale-orders/');
      const pending = (res.data || []).filter(so => so.stts === 'P');
      setPendingSOs(pending);
    } catch (error) {
      console.error('Error fetching pending sale orders:', error);
      toast.error('Failed to load sale orders');
    } finally {
      setSoLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      const userId = getCurrentUserId();
      setMaster(prev => ({ ...prev, user_no: userId }));
      fetchDropdowns();
      fetchNextVoucherNo();
      if (isDrawerOpen) {
        fetchPendingSOs();
      }
    }
  }, [open, isDrawerOpen]);

  useEffect(() => {
    if (editingSaleBill && open) {
      setMaster({
        vtype: editingSaleBill.vtype || 'SB',
        vno: editingSaleBill.vno || nextVoucherNo,
        vdate: editingSaleBill.vdate || new Date().toISOString().split('T')[0],
        dc_no: editingSaleBill.dc_no || '',
        account_code: editingSaleBill.account_code || '',
        remarks: editingSaleBill.remarks || '',
        discount: editingSaleBill.discount || 0,
        stts: editingSaleBill.stts || 'P',
        user_no: editingSaleBill.user_no || getCurrentUserId(),
      });

      const existingDetails = editingSaleBill.details || [];
      const newDetails = existingDetails.map((d, i) => ({
        vsn: d.vsn || i + 1,
        item_code: d.item_code || '',
        uom: d.uom || '',
        qty: d.qty || 0,
        rate: d.rate || 0,
        amount: d.amount || 0,
        location: d.location || null,
        weight_kg: d.weight_kg || 0,
        weight_lbs: d.weight_lbs || 0,
      }));
      while (newDetails.length < 8) {
        newDetails.push(createEmptyRow(newDetails.length + 1));
      }
      setDetails(newDetails);

      const queries = {};
      const uomQueriesObj = {};
      const locQueries = {};
      existingDetails.forEach((d, idx) => {
        if (d.item_code) queries[idx] = String(d.item_code);
        if (d.uom) uomQueriesObj[idx] = String(d.uom);
        if (d.location) locQueries[idx] = String(d.location);
      });
      setItemQueries(queries);
      setUomQueries(uomQueriesObj);
      setLocationQueries(locQueries);
    } else {
      setDetails(Array.from({ length: 8 }, (_, i) => createEmptyRow(i + 1)));
      setItemQueries({});
      setUomQueries({});
      setLocationQueries({});
      setSelectedSOId(null);
    }
  }, [editingSaleBill, open, nextVoucherNo]);

  const loadSOData = (so) => {
    setMaster(prev => ({
      ...prev,
      account_code: so.customer || '',
      remarks: so.remarks || '',
      stts: 'P',
      vdate: new Date().toISOString().split('T')[0],
      user_no: getCurrentUserId(),
    }));

    const soDetails = so.details || [];
    const newDetails = soDetails.map((d, i) => ({
      vsn: d.vsn || i + 1,
      item_code: d.item_code || '',
      uom: d.uom || '',
      qty: d.qty || 0,
      rate: d.rate || 0,
      amount: d.amount || 0,
      location: d.location || null,
      weight_kg: d.weight_kg || 0,
      weight_lbs: d.weight_lbs || 0,
    }));
    while (newDetails.length < 8) {
      newDetails.push(createEmptyRow(newDetails.length + 1));
    }
    setDetails(newDetails);

    const queries = {};
    const uomQueriesObj = {};
    const locQueries = {};
    soDetails.forEach((d, idx) => {
      if (d.item_code) queries[idx] = String(d.item_code);
      if (d.uom) uomQueriesObj[idx] = String(d.uom);
      if (d.location) locQueries[idx] = String(d.location);
    });
    setItemQueries(queries);
    setUomQueries(uomQueriesObj);
    setLocationQueries(locQueries);

    setSelectedSOId(so.id);
    setIsDrawerOpen(false);
    toast.success(`Sale Order #${so.vno} loaded`);
  };

  const recalcRow = (row) => {
    const weightKg = parseFloat(row.weight_kg) || 0;
    const rate = parseFloat(row.rate) || 0;
    const weightLbs = weightKg * 2.2046;
    const amount = weightLbs * rate;
    return { ...row, weight_lbs: weightLbs, amount };
  };

  const handleMasterChange = (field, value) => {
    setMaster(prev => ({ ...prev, [field]: value }));
  };

  const handleDetailChange = (index, field, value) => {
    const newDetails = [...details];
    let updated = { ...newDetails[index], [field]: value };

    if (field === 'weight_kg' || field === 'rate') {
      updated = recalcRow(updated);
    }

    newDetails[index] = updated;
    setDetails(newDetails);

    const lastIndex = newDetails.length - 1;
    if (index === lastIndex && isRowFilled(updated)) {
      const nextVsn = newDetails.length + 1;
      setDetails([...newDetails, createEmptyRow(nextVsn)]);
    }
  };

  const calculateTotal = () => {
    return details.reduce((sum, d) => sum + (d.amount || 0), 0);
  };

  const getCustomerDisplay = (id) => {
    const customer = customers.find(c => c.id === parseInt(id));
    return customer ? customer.name : '';
  };

  const getItemDisplay = (code) => {
    const item = items.find(i => i.ITEM_ID === parseInt(code));
    return item ? `${item.ITEM_CODE} - ${item.ITEM_NAME}` : '';
  };

  const getUomDisplay = (id) => {
    const unit = units.find(u => u.UOM_ID === parseInt(id));
    return unit ? `${unit.UOM_NAME} (${unit.SHORT_NAME})` : '';
  };

  const getLocationDisplay = (id) => {
    const loc = locations.find(l => l.id === parseInt(id));
    return loc ? `${loc.code} - ${loc.name}` : '';
  };

  const getItemName = (id) => {
    const item = items.find(i => i.ITEM_ID === parseInt(id));
    return item ? item.ITEM_NAME : '';
  };

  const getFilteredCustomers = (query) => {
    if (!query) return customers;
    const q = query.toLowerCase();
    return customers.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.code?.toString().includes(q)
    );
  };

  const getFilteredItems = (query) => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter(i =>
      i.ITEM_CODE?.toLowerCase().includes(q) ||
      i.ITEM_NAME?.toLowerCase().includes(q)
    );
  };

  const getFilteredUnits = (query) => {
    if (!query) return units;
    const q = query.toLowerCase();
    return units.filter(u =>
      u.UOM_NAME?.toLowerCase().includes(q) ||
      u.SHORT_NAME?.toLowerCase().includes(q)
    );
  };

  const getFilteredLocations = (query) => {
    if (!query) return locations;
    const q = query.toLowerCase();
    return locations.filter(l =>
      l.name?.toLowerCase().includes(q) ||
      l.code?.toString().includes(q)
    );
  };

  const getStatusColor = (status) => {
    const option = statusOptions.find(s => s.value === status);
    return option ? option.color : 'text-gray-400';
  };

  const getStatusLabel = (status) => {
    const option = statusOptions.find(s => s.value === status);
    return option ? option.label : status;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!master.vdate) {
      toast.error('Date is required');
      return;
    }
    if (!master.account_code) {
      toast.error('Customer is required');
      return;
    }
    const filledDetails = details.filter(
      (d) => d.item_code && d.uom && d.qty > 0 && d.rate > 0
    );
    if (filledDetails.length === 0) {
      toast.error('Please add at least one item with qty and rate');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        vtype: 'SB',
        vno: nextVoucherNo,
        vdate: master.vdate,
        dc_no: master.dc_no || '',
        account_code: parseInt(master.account_code),
        remarks: master.remarks,
        discount: parseFloat(master.discount) || 0,
        stts: master.stts,
        user_no: master.user_no || getCurrentUserId(),
        details: filledDetails.map((d) => ({
          vsn: d.vsn,
          item_code: d.item_code,
          uom: d.uom,
          qty: parseFloat(d.qty),
          rate: parseFloat(d.rate),
          amount: parseFloat(d.amount),
          location: d.location || null,
          weight_kg: parseFloat(d.weight_kg) || 0,
          weight_lbs: parseFloat(d.weight_lbs) || 0,
        })),
      };
      if (selectedSOId) {
        payload.sale_order_id = selectedSOId;
      }
      const url = editingSaleBill
        ? `/sales/sale-master/${editingSaleBill.id}/`
        : '/sales/sale-master/';
      const method = editingSaleBill ? 'put' : 'post';
      await api({ method, url, data: payload });
      toast.success(editingSaleBill ? 'Sale Bill updated' : 'Sale Bill created');
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving sale bill:', error);
      const errData = error.response?.data;
      if (errData && typeof errData === 'object') {
        const msg = Object.entries(errData)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('\n');
        toast.error(msg || 'Failed to save sale bill');
      } else {
        toast.error('Failed to save sale bill');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSOs = pendingSOs.filter(so => {
    const term = soSearchTerm.toLowerCase();
    return (
      so.vno?.toString().includes(term) ||
      so.customer_name?.toLowerCase().includes(term) ||
      so.vtype?.toLowerCase().includes(term)
    );
  });

  const soTotalItems = filteredSOs.length;
  const soStart = soTotalItems === 0 ? 0 : (soCurrentPage - 1) * soItemsPerPage + 1;
  const soEnd = Math.min(soCurrentPage * soItemsPerPage, soTotalItems);
  const soPaginated = filteredSOs.slice((soCurrentPage - 1) * soItemsPerPage, soCurrentPage * soItemsPerPage);

  useEffect(() => {
    setSoCurrentPage(1);
  }, [soSearchTerm]);

  const formatAmount = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  if (!open) return null;

  return (
    <>
      {/* ─── MAIN MODAL ─── */}
      <div className={`fixed inset-0 z-50 flex items-start justify-center overflow-hidden bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out ${isVisible ? "opacity-100" : "opacity-0"}`}>
        <div className={`w-full h-full max-h-screen bg-white shadow-2xl flex flex-col transform transition-transform duration-500 ease-out ${isVisible ? "translate-y-0" : "-translate-y-full"}`}>
          {/* Header */}
          <div className="flex-shrink-0 sticky top-0 bg-gray-200 px-4 py-1.5 flex justify-between items-center z-10">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {editingSaleBill ? 'Edit Sale Bill' : 'Sale Bill'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsDrawerOpen(true);
                  fetchPendingSOs();
                }}
                className="text-gray-500 hover:text-gray-700 p-1.5 rounded-md hover:bg-gray-300 transition-colors cursor-pointer"
                title="Load from Sale Order"
                type="button"
              >
                <FileText size={18} />
              </button>
              <button onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-gray-900">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-2">
              {/* Row 1: Bill No, Date, DC No */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center justify-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Bill No <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={nextVoucherNo || ''}
                      readOnly
                      className="w-[180px] bg-gray-100 border border-gray-300 rounded-xs text-sm px-3 py-1 text-gray-900 opacity-70 cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Bill Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={master.vdate}
                      onChange={(e) => handleMasterChange('vdate', e.target.value)}
                      className="w-[180px] bg-gray-100 border border-gray-300 rounded-xs text-sm px-3 py-1 text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      D/C No
                    </label>
                    <input
                      type="text"
                      value={master.dc_no || ''}
                      onChange={(e) => handleMasterChange('dc_no', e.target.value)}
                      className="w-[180px] bg-gray-100 border border-gray-300 rounded-xs text-sm px-3 py-1 text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="DC Number"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Status</label>
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className="w-[160px] bg-white border border-gray-300 rounded-xs text-sm px-3 py-1 text-gray-900 flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      <span className={getStatusColor(master.stts)}>
                        {getStatusLabel(master.stts)}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-gray-400 transition-transform ${
                          statusDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {statusDropdownOpen && (
                      <div className="absolute top-full mt-1 left-0 w-[160px] bg-white border border-gray-300 rounded-xs shadow-lg z-50 overflow-hidden">
                        {statusOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              handleMasterChange("stts", option.value);
                              setStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-200 transition-colors flex items-center gap-2 ${
                              master.stts === option.value ? "bg-gray-200" : ""
                            }`}
                          >
                            <span className={`${option.color} font-semibold`}>●</span>
                            <span className="text-gray-900">{option.label}</span>
                            {master.stts === option.value && (
                              <span className="ml-auto text-green-500">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: Customer */}
              <div className="grid grid-cols-5 gap-4 mb-3">
                <div className="col-span-5">
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Customer <span className="text-red-400">*</span>
                  </label>
                  <Combobox
                    value={master.account_code}
                    onChange={(val) => handleMasterChange('account_code', val)}
                  >
                    <div className="relative">
                      <Combobox.Input
                        className="w-full bg-gray-100 border border-gray-300 rounded-xs px-2 py-1 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                        onChange={(e) => setCustomerQuery(e.target.value)}
                        displayValue={(id) => getCustomerDisplay(id)}
                        placeholder="Search customer..."
                      />
                      <Combobox.Button className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <ChevronDownIcon size={16} className="text-gray-900" />
                      </Combobox.Button>
                      <Combobox.Options className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-xs shadow-lg max-h-60 overflow-auto">
                        {getFilteredCustomers(customerQuery).length === 0 ? (
                          <div className="p-2 text-gray-400 text-sm">No customers found</div>
                        ) : (
                          getFilteredCustomers(customerQuery).map((customer) => (
                            <Combobox.Option
                              key={customer.id}
                              value={customer.id}
                              className={({ active }) =>
                                `px-3 py-2 cursor-pointer ${active ? 'bg-gray-200 text-gray-900' : 'text-gray-900'}`
                              }
                            >
                              <div className="text-sm">
                                <div className="font-medium">{customer.name}</div>
                                <div className="text-xs text-gray-400">Code: {customer.code}</div>
                              </div>
                            </Combobox.Option>
                          ))
                        )}
                      </Combobox.Options>
                    </div>
                  </Combobox>
                </div>
              </div>

              {/* Remarks */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-900 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={master.remarks || ''}
                  onChange={(e) => handleMasterChange('remarks', e.target.value)}
                  placeholder="Additional remarks"
                  className="w-full bg-gray-100 border border-gray-300 rounded-xs text-sm px-2 py-1 text-gray-900 resize-none focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              {/* Discount */}
              <div className="grid grid-cols-5 gap-4 mb-3">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-900 mb-1">Discount %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={master.discount || 0}
                    onChange={(e) => handleMasterChange('discount', parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-100 border border-gray-300 rounded-xs text-sm px-2 py-1 text-gray-900 text-right focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Items Table – updated columns */}
              <div className="overflow-hidden">
                <div className="px-4 py-1 border-b border-gray-300 flex justify-between items-center">
                  <h3 className="text-md font-semibold text-gray-900">Items</h3>
                  <span className="text-xs text-gray-400">
                    {details.filter(d => d.item_code && d.qty > 0).length} rows filled
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-200 text-gray-300">
                      <tr>
                        <th className="text-gray-900 text-left px-3 py-1 border-r border-gray-400 w-12">#</th>
                        <th className="text-left text-gray-900 px-3 py-1 border-r border-gray-400 w-48">Item Code</th>
                        <th className="text-left text-gray-900 px-3 py-1 border-r border-gray-400">Material</th>
                        <th className="text-left text-gray-900 px-3 py-1 border-r border-gray-400 w-28">UOM</th>
                        <th className="text-left text-gray-900 px-3 py-1 border-r border-gray-400 w-28">Location</th>
                        <th className="text-right text-gray-900 px-3 py-1 border-r border-gray-400 w-20">Qty</th>
                        <th className="text-right text-gray-900 px-3 py-1 border-r border-gray-400 w-28">Weight (kg)</th>
                        <th className="text-right text-gray-900 px-3 py-1 border-r border-gray-400 w-28">Weight (lbs)</th>
                        <th className="text-right text-gray-900 px-3 py-1 border-r border-gray-400 w-28">Rate (₨)</th>
                        <th className="text-right text-gray-900 px-3 py-1 border-r border-gray-400 w-28">Amount (₨)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.map((row, index) => {
                        const rowAmount = row.amount || 0;
                        const isFilled = isRowFilled(row);
                        return (
                          <tr
                            key={index}
                            className={`border-t border-gray-300 hover:bg-gray-100 ${
                              isFilled ? 'bg-green-50/30' : ''
                            } cursor-pointer`}
                          >
                            <td className="px-3 py-1 border-r border-b border-gray-300 text-center">
                              {String(index + 1).padStart(2, '0')}
                            </td>
                            <td className="border-r border-b border-gray-300 p-0">
                              <Combobox
                                value={row.item_code}
                                onChange={(val) => handleDetailChange(index, 'item_code', val)}
                              >
                                <div className="relative">
                                  <Combobox.Input
                                    className="w-full bg-white rounded-none px-2 py-1.5 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setItemQueries(prev => ({ ...prev, [index]: val }));
                                    }}
                                    displayValue={(code) => getItemDisplay(code)}
                                    placeholder="Search item..."
                                  />
                                  <Combobox.Button className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                    <ChevronDownIcon size={16} className="text-gray-900" />
                                  </Combobox.Button>
                                  <Combobox.Options className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-xs shadow-lg max-h-60 overflow-auto">
                                    {getFilteredItems(itemQueries[index] || '').length === 0 ? (
                                      <div className="p-2 text-gray-400 text-sm">No items found</div>
                                    ) : (
                                      getFilteredItems(itemQueries[index] || '').map((item) => (
                                        <Combobox.Option
                                          key={item.ITEM_ID}
                                          value={item.ITEM_ID}
                                          className={({ active }) =>
                                            `px-3 py-2 cursor-pointer ${active ? 'bg-gray-200 text-gray-900' : 'text-gray-900'}`
                                          }
                                        >
                                          <div className="text-sm">
                                            <div className="font-medium">{item.ITEM_CODE}</div>
                                            <div className="text-xs text-gray-400">{item.ITEM_NAME}</div>
                                          </div>
                                        </Combobox.Option>
                                      ))
                                    )}
                                  </Combobox.Options>
                                </div>
                              </Combobox>
                            </td>
                            <td className="border-r border-b border-gray-300">
                              <input
                                type="text"
                                value={getItemName(row.item_code)}
                                readOnly
                                className="w-full bg-gray-100 rounded-none px-2 py-1.5 text-gray-900 text-sm focus:outline-none"
                                placeholder="Material Description"
                              />
                            </td>
                            <td className="border-r border-b border-gray-300 p-0">
                              <Combobox
                                value={row.uom}
                                onChange={(val) => handleDetailChange(index, 'uom', val)}
                              >
                                <div className="relative">
                                  <Combobox.Input
                                    className="w-full bg-white rounded-none px-2 py-1.5 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setUomQueries(prev => ({ ...prev, [index]: val }));
                                    }}
                                    displayValue={(id) => getUomDisplay(id)}
                                    placeholder="UOM"
                                  />
                                  <Combobox.Button className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                    <ChevronDownIcon size={16} className="text-gray-900" />
                                  </Combobox.Button>
                                  <Combobox.Options className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-xs shadow-lg max-h-60 overflow-auto">
                                    {getFilteredUnits(uomQueries[index] || '').length === 0 ? (
                                      <div className="p-2 text-gray-400 text-sm">No units found</div>
                                    ) : (
                                      getFilteredUnits(uomQueries[index] || '').map((unit) => (
                                        <Combobox.Option
                                          key={unit.UOM_ID}
                                          value={unit.UOM_ID}
                                          className={({ active }) =>
                                            `px-3 py-2 cursor-pointer ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-900'}`
                                          }
                                        >
                                          <div className="text-sm">
                                            <div className="font-medium">{unit.UOM_NAME}</div>
                                            <div className="text-xs text-gray-400">{unit.SHORT_NAME}</div>
                                          </div>
                                        </Combobox.Option>
                                      ))
                                    )}
                                  </Combobox.Options>
                                </div>
                              </Combobox>
                            </td>
                            {/* ─── Location Column ─── */}
                            <td className="border-r border-b border-gray-300 p-0">
                              <Combobox
                                value={row.location}
                                onChange={(val) => handleDetailChange(index, 'location', val)}
                              >
                                <div className="relative">
                                  <Combobox.Input
                                    className="w-full bg-white rounded-none px-2 py-1.5 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setLocationQueries(prev => ({ ...prev, [index]: val }));
                                    }}
                                    displayValue={(id) => getLocationDisplay(id)}
                                    placeholder="Location"
                                  />
                                  <Combobox.Button className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                    <ChevronDownIcon size={16} className="text-gray-900" />
                                  </Combobox.Button>
                                  <Combobox.Options className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-xs shadow-lg max-h-60 overflow-auto">
                                    {getFilteredLocations(locationQueries[index] || '').length === 0 ? (
                                      <div className="p-2 text-gray-400 text-sm">No locations found</div>
                                    ) : (
                                      getFilteredLocations(locationQueries[index] || '').map((loc) => (
                                        <Combobox.Option
                                          key={loc.id}
                                          value={loc.id}
                                          className={({ active }) =>
                                            `px-3 py-2 cursor-pointer ${active ? 'bg-gray-200 text-gray-900' : 'text-gray-900'}`
                                          }
                                        >
                                          <div className="text-sm">
                                            <div className="font-medium">{loc.code}</div>
                                            <div className="text-xs text-gray-400">{loc.name}</div>
                                          </div>
                                        </Combobox.Option>
                                      ))
                                    )}
                                  </Combobox.Options>
                                </div>
                              </Combobox>
                            </td>
                            <td className="border-r border-b border-gray-300">
                              <input
                                type="number"
                                step="0.001"
                                value={row.qty || ''}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  handleDetailChange(index, 'qty', val);
                                }}
                                className="w-full bg-white rounded-none px-2 py-1.5 text-gray-900 text-sm text-right focus:outline-none focus:ring-1 focus:ring-green-500"
                                placeholder="0"
                              />
                            </td>
                            <td className="border-r border-b border-gray-300">
                              <input
                                type="number"
                                step="0.001"
                                value={row.weight_kg || ''}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  handleDetailChange(index, 'weight_kg', val);
                                }}
                                className="w-full bg-white rounded-none px-2 py-1.5 text-gray-900 text-sm text-right focus:outline-none focus:ring-1 focus:ring-green-500"
                                placeholder="0.000"
                              />
                            </td>
                            <td className="border-r border-b border-gray-300 text-right font-medium text-gray-700 px-3 py-1.5">
                              {row.weight_lbs ? row.weight_lbs.toFixed(3) : '0.000'}
                            </td>
                            <td className="border-r border-b border-gray-300">
                              <input
                                type="number"
                                step="0.0001"
                                value={row.rate || ''}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  handleDetailChange(index, 'rate', val);
                                }}
                                className="w-full bg-white rounded-none px-2 py-1.5 text-gray-900 text-sm text-right focus:outline-none focus:ring-1 focus:ring-green-500"
                                placeholder="0.0000"
                              />
                            </td>
                            <td className="border-r border-b border-gray-300 text-right font-bold text-red-600 px-3 py-1.5">
                              {formatAmount(rowAmount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-200">
                      <tr className="border-t border-gray-300">
                        <td colSpan="9" className="px-3 py-2 text-right font-semibold text-gray-900">
                          Total Amount:
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-red-600 text-base">
                          {formatAmount(calculateTotal())}
                        </td>
                      </tr>
                      <tr className="border-t border-gray-300">
                        <td colSpan="9" className="px-3 py-2 text-right font-semibold text-gray-900">
                          Discount ({master.discount || 0}%):
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-red-500 text-base">
                          - {formatAmount((calculateTotal() * (master.discount || 0)) / 100)}
                        </td>
                      </tr>
                      <tr className="border-t-2 border-gray-300">
                        <td colSpan="9" className="px-3 py-3 text-right font-bold text-gray-900">
                          Grand Total:
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-green-600 text-base">
                          ₨ {formatAmount(calculateTotal() - (calculateTotal() * (master.discount || 0)) / 100)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 bg-gray-200 border-t border-gray-300 px-8 py-1.5 flex justify-between items-center">
              <div className="text-green-600 text-xl font-bold">
                Grand Total: ₨ {formatAmount(calculateTotal() - (calculateTotal() * (master.discount || 0)) / 100)}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="px-6 py-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-xs text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-1 bg-green-600 hover:bg-green-700 text-white rounded-xs text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingSaleBill ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ─── RIGHT DRAWER ─── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end pointer-events-auto">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-[450px] h-full bg-white border-l border-gray-300 shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-gray-200 px-4 py-3 flex justify-between items-center border-b border-gray-300">
              <h3 className="text-lg font-semibold text-gray-900">Pending Sale Orders</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400 hover:text-gray-900" type="button">
                <X size={20} />
              </button>
            </div>

            <div className="px-4 py-2 border-b border-gray-300">
              <div className="flex items-center bg-gray-100 border border-gray-300 rounded-xs h-9">
                <div className="px-3 text-gray-400"><Search size={16} /></div>
                <input
                  type="text"
                  placeholder="Search SO no, customer..."
                  value={soSearchTerm}
                  onChange={(e) => setSoSearchTerm(e.target.value)}
                  className="bg-transparent outline-none px-2 h-8 text-sm w-full placeholder:text-gray-400 text-gray-900"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {soLoading ? (
                <div className="p-4 text-center text-gray-400">Loading sale orders...</div>
              ) : soPaginated.length === 0 ? (
                <div className="p-4 text-center text-gray-400">No pending sale orders found</div>
              ) : (
                soPaginated.map((so) => {
                  const soTotal = so.details?.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0) || 0;
                  return (
                    <div
                      key={so.id}
                      onClick={() => loadSOData(so)}
                      className={`px-4 py-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedSOId === so.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {selectedSOId === so.id ? <CheckCircle size={18} className="text-blue-500" /> : <Circle size={18} className="text-gray-400" />}
                          <span className="font-semibold text-gray-900">SO #{so.vno}</span>
                        </div>
                        <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">Pending</span>
                      </div>
                      <div className="text-sm text-gray-600 ml-7">
                        <div>{so.customer_name || 'No customer'}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(so.vdate).toLocaleDateString()} | Total: ₨ {formatAmount(soTotal)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-gray-300 px-4 py-2 flex items-center justify-between bg-gray-50">
              <span className="text-sm text-gray-500">{soTotalItems === 0 ? "0-0 / 0" : `${soStart}-${soEnd} / ${soTotalItems}`}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setSoCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={soCurrentPage === 1 || soTotalItems === 0}
                  className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:opacity-50 rounded transition"
                >
                  ◀
                </button>
                <button
                  onClick={() => setSoCurrentPage((p) => p + 1)}
                  disabled={soEnd >= soTotalItems || soTotalItems === 0}
                  className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:opacity-50 rounded transition"
                >
                  ▶
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddSaleBillModal;