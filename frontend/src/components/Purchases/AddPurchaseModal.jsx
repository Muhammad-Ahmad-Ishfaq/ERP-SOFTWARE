// src/components/Purchases/AddPurchaseModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Search, ChevronDown, ChevronDownIcon, FileText, CheckCircle, Circle } from 'lucide-react';
import { Combobox } from '@headlessui/react';
import toast from 'react-hot-toast';
import api from '../../api/api';

// ─── Status options ───
const statusOptions = [
  { value: 'A', label: 'Active', color: 'text-emerald-400' },
  { value: 'C', label: 'Completed', color: 'text-blue-400' },
  { value: 'V', label: 'Void', color: 'text-red-400' },
  { value: 'D', label: 'Draft', color: 'text-yellow-400' },
];

const AddPurchaseModal = ({ open, onOpenChange, editingPurchase, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [nextVoucherNo, setNextVoucherNo] = useState(1);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ── Drawer state ──
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [pendingPOs, setPendingPOs] = useState([]);
  const [poLoading, setPoLoading] = useState(false);
  const [poSearchTerm, setPoSearchTerm] = useState('');
  const [selectedPOId, setSelectedPOId] = useState(null);
  const [poCurrentPage, setPoCurrentPage] = useState(1);
  const poItemsPerPage = 10;

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
    vtype: 'PV',
    vno: null,
    vdate: new Date().toISOString().split('T')[0],
    dc_no: '',
    account_code: null,
    purchase_code: null,
    remarks: '',
    discount: 0,
    stts: 'A',
    user_no: '',
  });

  // ── Dynamic detail rows with weight fields ──
  const createEmptyRow = (vsn) => ({
    vsn,
    item_code: '',
    uom: '',
    qty: 0,
    rate: 0,
    amount: 0,
    location: null,
    weight_per_unit: 0,
    weight_kg: 0,
    weight_lbs: 0,
  });

  const [details, setDetails] = useState(
    Array.from({ length: 8 }, (_, i) => createEmptyRow(i + 1))
  );

  const isRowFilled = (row) => row.item_code && row.uom && row.qty > 0 && row.rate > 0;

  // ── Dropdown data ──
  const [accounts, setAccounts] = useState([]);
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [locations, setLocations] = useState([]);

  // ── Combobox queries ──
  const [accountQuery, setAccountQuery] = useState('');
  const [itemQueries, setItemQueries] = useState({});
  const [uomQueries, setUomQueries] = useState({});
  const [locationQueries, setLocationQueries] = useState({});

  // ── Get logged-in user ID ──
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

  // ── Helper to extract ID ──
  const getAccountId = (account) => {
    if (!account) return null;
    if (typeof account === 'number') return account;
    if (typeof account === 'string' && !isNaN(account)) return parseInt(account);
    if (account && typeof account === 'object' && 'id' in account) return account.id;
    return null;
  };

  // ── Fetch next voucher number ──
  const fetchNextVoucherNo = async () => {
    try {
      const res = await api.get('/purchases/purchase-master/');
      const purchases = res.data || [];
      const maxVno = purchases.reduce((max, p) => Math.max(max, p.vno || 0), 0);
      const next = maxVno + 1;
      setNextVoucherNo(next);
      setMaster(prev => ({ ...prev, vno: next }));
    } catch (error) {
      console.warn('Could not fetch purchases, using 1');
      setNextVoucherNo(1);
      setMaster(prev => ({ ...prev, vno: 1 }));
    }
  };

  // ── Fetch dropdowns ──
  const fetchDropdowns = async () => {
    try {
      const [accountsRes, itemsRes, unitsRes, locationsRes] = await Promise.all([
        api.get('/accounting/parties/'),
        api.get('/inventory/items/'),
        api.get('/inventory/units/'),
        api.get('/locations/locations/'),
      ]);
      setAccounts(accountsRes.data || []);
      setItems(itemsRes.data || []);
      setUnits(unitsRes.data || []);
      setLocations(locationsRes.data || []);
    } catch (error) {
      console.error('Error fetching dropdowns:', error);
    }
  };

  // ── Fetch pending purchase orders ──
  const fetchPendingPOs = async () => {
    setPoLoading(true);
    try {
      const res = await api.get('/purchase-orders/purchase-orders/');
      const pending = (res.data || []).filter(po => po.stts === 'P');
      setPendingPOs(pending);
    } catch (error) {
      console.error('Error fetching pending POs:', error);
      toast.error('Failed to load purchase orders');
    } finally {
      setPoLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      const userId = getCurrentUserId();
      setMaster(prev => ({ ...prev, user_no: userId }));

      fetchDropdowns();
      fetchNextVoucherNo();
      if (isDrawerOpen) {
        fetchPendingPOs();
      }
    }
  }, [open, isDrawerOpen]);

  // ── Load edit data ──
  useEffect(() => {
    if (editingPurchase && open) {
      setMaster({
        vtype: editingPurchase.vtype || 'PV',
        vno: editingPurchase.vno || nextVoucherNo,
        vdate: editingPurchase.vdate || new Date().toISOString().split('T')[0],
        dc_no: editingPurchase.dc_no || '',
        account_code: getAccountId(editingPurchase.account_code),
        purchase_code: getAccountId(editingPurchase.purchase_code),
        remarks: editingPurchase.remarks || '',
        discount: editingPurchase.discount || 0,
        stts: editingPurchase.stts || 'A',
        user_no: editingPurchase.user_no || getCurrentUserId(),
      });

      const existingDetails = editingPurchase.details || [];
      const newDetails = existingDetails.map((d, i) => ({
        vsn: d.vsn || i + 1,
        item_code: d.item_code || '',
        uom: d.uom || '',
        qty: d.qty || 0,
        rate: d.rate || 0,
        amount: d.amount || 0,
        location: d.location || null,
        weight_per_unit: d.weight_per_unit || 0,
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
    }
  }, [editingPurchase, open, nextVoucherNo]);

  // ── Load PO data ──
  const loadPOData = (po) => {
    setMaster(prev => ({
      ...prev,
      account_code: getAccountId(po.supplier),
      purchase_code: null,
      remarks: po.remarks || '',
      dc_no: po.dc_no || '',
      stts: 'C',
      vdate: new Date().toISOString().split('T')[0],
      user_no: getCurrentUserId(),
    }));

    const poDetails = po.details || [];
    const newDetails = poDetails.map((d, i) => ({
      vsn: d.vsn || i + 1,
      item_code: d.item_code || '',
      uom: d.uom || '',
      qty: d.qty || 0,
      rate: d.rate || 0,
      amount: d.amount || 0,
      location: d.location || null,
      weight_per_unit: d.weight_per_unit || 0,
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
    poDetails.forEach((d, idx) => {
      if (d.item_code) queries[idx] = String(d.item_code);
      if (d.uom) uomQueriesObj[idx] = String(d.uom);
      if (d.location) locQueries[idx] = String(d.location);
    });
    setItemQueries(queries);
    setUomQueries(uomQueriesObj);
    setLocationQueries(locQueries);

    setSelectedPOId(po.id);
    setIsDrawerOpen(false);
    toast.success(`Purchase Order #${po.vno} loaded`);
  };

  // ── Recalculate weight and amount ──
  const recalcRow = (row) => {
    const qty = parseFloat(row.qty) || 0;
    const weightPerUnit = parseFloat(row.weight_per_unit) || 0;
    const rate = parseFloat(row.rate) || 0;

    const weightKg = qty * weightPerUnit;
    const weightLbs = weightKg * 2.2046;
    const amount = weightLbs * rate;

    return { ...row, weight_kg: weightKg, weight_lbs: weightLbs, amount };
  };

  // ── Handlers ──
  const handleMasterChange = (field, value) => {
    setMaster(prev => ({ ...prev, [field]: value }));
  };

  const handleAccountSelect = (val) => {
    const id = getAccountId(val);
    setMaster(prev => ({ ...prev, account_code: id }));
  };

  const handleDetailChange = (index, field, value) => {
    const newDetails = [...details];
    let updated = { ...newDetails[index], [field]: value };

    // Recalculate weight and amount if relevant field changes
    if (field === 'qty' || field === 'rate' || field === 'weight_per_unit') {
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
    return (
      details.reduce((sum, d) => sum + (d.amount || 0), 0) -
      (parseFloat(master.discount) || 0)
    );
  };

  const getAccountDisplay = (code) => {
    if (!code) return '';
    const account = accounts.find(a => a.id === parseInt(code));
    return account ? account.name : '';
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

  // ── Get item weight from items list ──
  const getItemWeight = (id) => {
    const item = items.find(i => i.ITEM_ID === parseInt(id));
    return item ? parseFloat(item.WEIGHT_KG) || 0 : 0;
  };

  const getFilteredAccounts = (query) => {
    if (!query) return accounts;
    const q = String(query).toLowerCase();
    return accounts.filter(a =>
      a.name?.toLowerCase().includes(q) ||
      a.code?.toString().includes(q)
    );
  };

  const getFilteredItems = (query) => {
    if (!query) return items;
    const q = String(query).toLowerCase();
    return items.filter(i =>
      i.ITEM_CODE?.toLowerCase().includes(q) ||
      i.ITEM_NAME?.toLowerCase().includes(q)
    );
  };

  const getFilteredUnits = (query) => {
    if (!query) return units;
    const q = String(query).toLowerCase();
    return units.filter(u =>
      u.UOM_NAME?.toLowerCase().includes(q) ||
      u.SHORT_NAME?.toLowerCase().includes(q)
    );
  };

  const getFilteredLocations = (query) => {
    if (!query) return locations;
    const q = String(query).toLowerCase();
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
    const filledDetails = details.filter(
      (d) => d.item_code && d.uom && d.qty > 0 && d.rate > 0
    );
    if (filledDetails.length === 0) {
      toast.error('Please add at least one item with qty and rate');
      return;
    }
    setLoading(true);
    try {
      let accountId = master.account_code;
      if (accountId && typeof accountId === 'object' && accountId !== null) {
        accountId = accountId.id || null;
      } else if (accountId && !isNaN(accountId)) {
        accountId = parseInt(accountId);
      } else {
        accountId = null;
      }

      const payload = {
        vtype: master.vtype || 'PV',
        vno: nextVoucherNo,
        vdate: master.vdate,
        dc_no: master.dc_no || '',
        account_code: accountId,
        purchase_code: null,
        remarks: master.remarks || '',
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
          weight_per_unit: parseFloat(d.weight_per_unit) || 0,
          weight_kg: parseFloat(d.weight_kg) || 0,
          weight_lbs: parseFloat(d.weight_lbs) || 0,
        })),
      };
      const url = editingPurchase
        ? `/purchases/purchase-master/${editingPurchase.id}/`
        : '/purchases/purchase-master/';
      const method = editingPurchase ? 'put' : 'post';
      await api({ method, url, data: payload });
      toast.success(editingPurchase ? 'Purchase updated' : 'Purchase created');
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Full error:', error);
      console.error('Response data:', error.response?.data);
      console.log("📤 Payload being sent:", payload);
      const errData = error.response?.data;
      if (errData && typeof errData === 'object') {
        const msg = Object.entries(errData)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('\n');
        toast.error(msg || 'Failed to save purchase');
      } else {
        toast.error('Failed to save purchase');
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

  const filteredPOs = pendingPOs.filter(po => {
    const term = poSearchTerm.toLowerCase();
    return (
      po.vno?.toString().includes(term) ||
      po.supplier_name?.toLowerCase().includes(term) ||
      po.vtype?.toLowerCase().includes(term)
    );
  });

  const poTotalItems = filteredPOs.length;
  const poStart = poTotalItems === 0 ? 0 : (poCurrentPage - 1) * poItemsPerPage + 1;
  const poEnd = Math.min(poCurrentPage * poItemsPerPage, poTotalItems);
  const poPaginated = filteredPOs.slice((poCurrentPage - 1) * poItemsPerPage, poCurrentPage * poItemsPerPage);

  useEffect(() => {
    setPoCurrentPage(1);
  }, [poSearchTerm]);

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
                {editingPurchase ? 'Edit Purchase' : 'Purchase Voucher'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsDrawerOpen(true);
                  fetchPendingPOs();
                }}
                className="text-gray-500 hover:text-gray-700 p-1.5 rounded-md hover:bg-gray-300 transition-colors cursor-pointer"
                title="Load from Purchase Order"
                type="button"
              >
                <FileText size={18} />
              </button>
              <button onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-gray-900" type="button">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-2">
              {/* Row 1 */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center justify-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Voucher No <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={nextVoucherNo || ''}
                      readOnly
                      className="w-[180px] bg-gray-100 border border-gray-300 rounded-xs text-sm px-3 py-1 text-gray-900 opacity-70 cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Voucher Date <span className="text-red-400">*</span></label>
                    <input
                      type="date"
                      value={master.vdate}
                      onChange={(e) => handleMasterChange('vdate', e.target.value)}
                      className="w-[180px] bg-gray-100 border border-gray-300 rounded-xs text-sm px-3 py-1 text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">D/C No</label>
                    <input
                      type="text"
                      value={master.dc_no}
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
                      <span className={getStatusColor(master.stts)}>{getStatusLabel(master.stts)}</span>
                      <ChevronDown size={16} className={`text-gray-400 transition-transform ${statusDropdownOpen ? "rotate-180" : ""}`} />
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
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-200 transition-colors flex items-center gap-2 ${master.stts === option.value ? "bg-gray-200" : ""}`}
                          >
                            <span className={`${option.color} font-semibold`}>●</span>
                            <span className="text-gray-900">{option.label}</span>
                            {master.stts === option.value && <span className="ml-auto text-green-500">✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Supplier */}
              <div className="grid grid-cols-5 gap-4 mb-3">
                <div className="col-span-5">
                  <label className="block text-sm font-medium text-gray-900 mb-1">Supplier/Vendor <span className="text-red-400">*</span></label>
                  <Combobox
                    value={master.account_code}
                    onChange={handleAccountSelect}
                  >
                    <div className="relative">
                      <Combobox.Input
                        className="w-full bg-gray-100 border border-gray-300 rounded-xs px-2 py-1 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                        onChange={(e) => setAccountQuery(e.target.value)}
                        displayValue={(code) => getAccountDisplay(code)}
                        placeholder="Search supplier..."
                      />
                      <Combobox.Button className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <ChevronDownIcon size={16} className="text-gray-900" />
                      </Combobox.Button>
                      <Combobox.Options className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-xs shadow-lg max-h-60 overflow-auto">
                        {getFilteredAccounts(accountQuery).length === 0 ? (
                          <div className="p-2 text-gray-400 text-sm">No suppliers found</div>
                        ) : (
                          getFilteredAccounts(accountQuery).map((account) => (
                            <Combobox.Option
                              key={account.id}
                              value={account.id}
                              className={({ active }) =>
                                `px-3 py-2 cursor-pointer ${active ? 'bg-gray-200 text-gray-900' : 'text-gray-900'}`
                              }
                            >
                              <div className="text-sm">
                                <div className="font-medium">{account.name}</div>
                                <div className="text-xs text-gray-400">Code: {account.code}</div>
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

              <input type="hidden" name="purchase_code" value={master.purchase_code} />

              {/* Items Table */}
              <div className="overflow-hidden">
                <div className="px-4 py-1 border-b border-gray-300 flex justify-between items-center">
                  <h3 className="text-md font-semibold text-gray-900">Items</h3>
                  <span className="text-xs text-gray-400">{details.filter(d => d.item_code && d.qty > 0).length} rows filled</span>
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
                        <th className="text-right text-gray-900 px-3 py-1 border-r border-gray-400 w-24">Rate (₨)</th>
                        <th className="text-center text-gray-900 px-3 py-1 border-r border-gray-400 w-28">Weight/Unit (kg)</th>
                        <th className="text-right text-gray-900 px-3 py-1 border-r border-gray-400 w-28">Weight (kg)</th>
                        <th className="text-right text-gray-900 px-3 py-1 border-r border-gray-400 w-28">Weight (lbs)</th>
                        <th className="text-right text-gray-900 px-3 py-1 border-r border-gray-400 w-28">Amount (₨)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.map((row, index) => {
                        const rowAmount = parseFloat(row.amount) || 0;
                        const isFilled = isRowFilled(row);
                        return (
                          <tr key={index} className={`border-t border-gray-300 hover:bg-gray-100 ${isFilled ? 'bg-green-50/30' : ''} cursor-pointer`}>
                            <td className="px-3 py-1 border-r border-b border-gray-300 text-center">{String(index + 1).padStart(2, '0')}</td>
                            <td className="border-r border-b border-gray-300 p-0">
                              <Combobox
                                value={row.item_code}
                                onChange={(val) => {
                                  handleDetailChange(index, 'item_code', val);
                                  // Auto-fill weight_per_unit from item's WEIGHT_KG
                                  const weight = getItemWeight(val);
                                  handleDetailChange(index, 'weight_per_unit', weight);
                                }}
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
                            {/* ─── Weight fields ─── */}
                            <td className="border-r border-b border-gray-300 p-0">
                              <input
                                type="number"
                                step="0.001"
                                value={row.weight_per_unit || ''}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  handleDetailChange(index, 'weight_per_unit', val);
                                }}
                                className="w-full bg-white rounded-none px-2 py-1.5 text-gray-900 text-sm text-center focus:outline-none focus:ring-1 focus:ring-green-500"
                                placeholder="0.000"
                              />
                            </td>
                            <td className="border-r border-b border-gray-300 text-right font-medium text-gray-700 px-3 py-1.5">
                              {row.weight_kg ? row.weight_kg.toFixed(3) : '0.000'}
                            </td>
                            <td className="border-r border-b border-gray-300 text-right font-medium text-gray-700 px-3 py-1.5">
                              {row.weight_lbs ? row.weight_lbs.toFixed(3) : '0.000'}
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
                        <td colSpan="10" className="px-3 py-2 text-right font-semibold text-gray-900">Total Amount:</td>
                        <td className="px-3 py-2 text-right font-bold text-red-600 text-base">
                          {formatAmount(details.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 bg-gray-200 border-t border-gray-300 px-8 py-1.5 flex justify-between items-center">
              <div className="text-green-600 text-xl font-bold">Grand Total: ₨ {formatAmount(calculateTotal())}</div>
              <div className="flex gap-3">
                <button type="button" onClick={() => onOpenChange(false)} className="px-6 py-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-xs text-sm font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="px-8 py-1 bg-green-600 hover:bg-green-700 text-white rounded-xs text-sm font-medium transition-colors disabled:opacity-50">
                  {loading ? 'Saving...' : editingPurchase ? 'Update' : 'Save'}
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
              <h3 className="text-lg font-semibold text-gray-900">Pending Purchase Orders</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400 hover:text-gray-900" type="button">
                <X size={20} />
              </button>
            </div>

            <div className="px-4 py-2 border-b border-gray-300">
              <div className="flex items-center bg-gray-100 border border-gray-300 rounded-xs h-9">
                <div className="px-3 text-gray-400"><Search size={16} /></div>
                <input
                  type="text"
                  placeholder="Search PO no, vendor..."
                  value={poSearchTerm}
                  onChange={(e) => setPoSearchTerm(e.target.value)}
                  className="bg-transparent outline-none px-2 h-8 text-sm w-full placeholder:text-gray-400 text-gray-900"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {poLoading ? (
                <div className="p-4 text-center text-gray-400">Loading purchase orders...</div>
              ) : poPaginated.length === 0 ? (
                <div className="p-4 text-center text-gray-400">No pending purchase orders found</div>
              ) : (
                poPaginated.map((po) => {
                  const poTotal = po.details?.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0) || 0;
                  return (
                    <div
                      key={po.id}
                      onClick={() => loadPOData(po)}
                      className={`px-4 py-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedPOId === po.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {selectedPOId === po.id ? <CheckCircle size={18} className="text-blue-500" /> : <Circle size={18} className="text-gray-400" />}
                          <span className="font-semibold text-gray-900">PO #{po.vno}</span>
                        </div>
                        <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">Pending</span>
                      </div>
                      <div className="text-sm text-gray-600 ml-7">
                        <div>{po.supplier_name || 'No vendor'}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(po.vdate).toLocaleDateString()} | Total: ₨ {formatAmount(poTotal)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-gray-300 px-4 py-2 flex items-center justify-between bg-gray-50">
              <span className="text-sm text-gray-500">{poTotalItems === 0 ? "0-0 / 0" : `${poStart}-${poEnd} / ${poTotalItems}`}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPoCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={poCurrentPage === 1 || poTotalItems === 0}
                  className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:opacity-50 rounded transition"
                >
                  ◀
                </button>
                <button
                  onClick={() => setPoCurrentPage((p) => p + 1)}
                  disabled={poEnd >= poTotalItems || poTotalItems === 0}
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

export default AddPurchaseModal;