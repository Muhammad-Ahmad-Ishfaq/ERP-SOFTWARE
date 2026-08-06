// src/components/Sales/AddSaleOrderModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, ChevronDown, ChevronDownIcon } from 'lucide-react';
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

const AddSaleOrderModal = ({ open, onOpenChange, editingSaleOrder, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [nextVoucherNo, setNextVoucherNo] = useState(1);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    vtype: 'SO',
    vno: null,
    vdate: new Date().toISOString().split('T')[0],
    customer: '',
    remarks: '',
    stts: 'P',
    user_no: '',
  });

  // ── Dynamic detail rows ──
  const createEmptyRow = (vsn) => ({
    vsn,
    item_code: '',
    uom: '',
    qty: 0,
    rate: 0,
    amount: 0,
  });

  const [details, setDetails] = useState(
    Array.from({ length: 8 }, (_, i) => createEmptyRow(i + 1))
  );

  const isRowFilled = (row) => row.item_code && row.uom && row.qty > 0 && row.rate > 0;

  // ── Dropdown data ──
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);

  // ── Combobox queries ──
  const [customerQuery, setCustomerQuery] = useState('');
  const [itemQueries, setItemQueries] = useState({});
  const [uomQueries, setUomQueries] = useState({});

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

  // ── Fetch next voucher number ──
  const fetchNextVoucherNo = async () => {
    try {
      const res = await api.get('/sale-orders/sale-orders/next-voucher/');
      setNextVoucherNo(res.data.next_voucher_no || 1);
      setMaster(prev => ({ ...prev, vno: res.data.next_voucher_no || 1 }));
    } catch (error) {
      console.error('Error fetching next voucher number:', error);
      // Fallback: compute from existing records
      try {
        const res = await api.get('/sale-orders/sale-orders/');
        const orders = res.data || [];
        const maxVno = orders.reduce((max, o) => Math.max(max, o.vno || 0), 0);
        const next = maxVno + 1;
        setNextVoucherNo(next);
        setMaster(prev => ({ ...prev, vno: next }));
      } catch (fallbackError) {
        setNextVoucherNo(1);
      }
    }
  };

  // ── Fetch dropdowns ──
  const fetchDropdowns = async () => {
    try {
      const [customersRes, itemsRes, unitsRes] = await Promise.all([
        api.get('/accounting/parties/?sub=debtor'),
        api.get('/inventory/items/'),
        api.get('/inventory/units/'),
      ]);
      setCustomers(customersRes.data || []);
      setItems(itemsRes.data || []);
      setUnits(unitsRes.data || []);
    } catch (error) {
      console.error('Error fetching dropdowns:', error);
    }
  };

  useEffect(() => {
    if (open) {
      const userId = getCurrentUserId();
      setMaster(prev => ({ ...prev, user_no: userId }));
      fetchDropdowns();
      fetchNextVoucherNo();
    }
  }, [open]);

  // ── Load edit data ──
  useEffect(() => {
    if (editingSaleOrder && open) {
      setMaster({
        vtype: editingSaleOrder.vtype || 'SO',
        vno: editingSaleOrder.vno || nextVoucherNo,
        vdate: editingSaleOrder.vdate || new Date().toISOString().split('T')[0],
        customer: editingSaleOrder.customer || '',
        remarks: editingSaleOrder.remarks || '',
        stts: editingSaleOrder.stts || 'P',
        user_no: editingSaleOrder.user_no || getCurrentUserId(),
      });

      const existingDetails = editingSaleOrder.details || [];
      const newDetails = existingDetails.map((d, i) => ({
        vsn: d.vsn || i + 1,
        item_code: d.item_code || '',
        uom: d.uom || '',
        qty: d.qty || 0,
        rate: d.rate || 0,
        amount: d.amount || 0,
      }));
      while (newDetails.length < 8) {
        newDetails.push(createEmptyRow(newDetails.length + 1));
      }
      setDetails(newDetails);

      const queries = {};
      const uomQueriesObj = {};
      existingDetails.forEach((d, idx) => {
        if (d.item_code) queries[idx] = d.item_code;
        if (d.uom) uomQueriesObj[idx] = d.uom;
      });
      setItemQueries(queries);
      setUomQueries(uomQueriesObj);
    } else {
      setDetails(Array.from({ length: 8 }, (_, i) => createEmptyRow(i + 1)));
      setItemQueries({});
      setUomQueries({});
    }
  }, [editingSaleOrder, open, nextVoucherNo]);

  // ── Handlers ──
  const handleMasterChange = (field, value) => {
    setMaster(prev => ({ ...prev, [field]: value }));
  };

  const handleDetailChange = (index, field, value) => {
    const newDetails = [...details];
    const updated = { ...newDetails[index], [field]: value };
    if (field === 'qty' || field === 'rate') {
      const qty = parseFloat(updated.qty) || 0;
      const rate = parseFloat(updated.rate) || 0;
      updated.amount = qty * rate;
    }
    newDetails[index] = updated;
    setDetails(newDetails);

    const lastIndex = newDetails.length - 1;
    if (index === lastIndex && isRowFilled(updated)) {
      const nextVsn = newDetails.length + 1;
      setDetails([...newDetails, createEmptyRow(nextVsn)]);
    }
  };

  // ── Calculate total ──
  const calculateTotal = () => {
    return details.reduce((sum, d) => sum + (d.amount || 0), 0);
  };

  // ── Get display values ──
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

  const getItemName = (id) => {
    const item = items.find(i => i.ITEM_ID === parseInt(id));
    return item ? item.ITEM_NAME : '';
  };

  // ── Filter functions ──
  const getFilteredCustomers = (query) => {
    if (!query) return customers;
    return customers.filter(c =>
      c.name?.toLowerCase().includes(query.toLowerCase()) ||
      c.code?.toString().includes(query)
    );
  };

  const getFilteredItems = (query) => {
    if (!query) return items;
    return items.filter(i =>
      i.ITEM_CODE?.toLowerCase().includes(query.toLowerCase()) ||
      i.ITEM_NAME?.toLowerCase().includes(query.toLowerCase())
    );
  };

  const getFilteredUnits = (query) => {
    if (!query) return units;
    return units.filter(u =>
      u.UOM_NAME?.toLowerCase().includes(query.toLowerCase()) ||
      u.SHORT_NAME?.toLowerCase().includes(query.toLowerCase())
    );
  };

  // ── Status helpers ──
  const getStatusColor = (status) => {
    const option = statusOptions.find(s => s.value === status);
    return option ? option.color : 'text-gray-400';
  };

  const getStatusLabel = (status) => {
    const option = statusOptions.find(s => s.value === status);
    return option ? option.label : status;
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!master.vdate) {
      toast.error('Date is required');
      return;
    }
    if (!master.customer) {
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
        vtype: 'SO',
        vno: nextVoucherNo,
        vdate: master.vdate,
        customer: parseInt(master.customer),
        remarks: master.remarks,
        stts: master.stts,
        user_no: master.user_no || getCurrentUserId(),
        details: filledDetails.map((d) => ({
          vsn: d.vsn,
          item_code: d.item_code,
          uom: d.uom,
          qty: parseFloat(d.qty),
          rate: parseFloat(d.rate),
          amount: parseFloat(d.amount),
        })),
      };
      const url = editingSaleOrder
        ? `/sale-orders/sale-orders/${editingSaleOrder.id}/`
        : '/sale-orders/sale-orders/';
      const method = editingSaleOrder ? 'put' : 'post';
      await api({ method, url, data: payload });
      toast.success(editingSaleOrder ? 'Sale Order updated' : 'Sale Order created');
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving sale order:', error);
      const errData = error.response?.data;
      if (errData && typeof errData === 'object') {
        const msg = Object.entries(errData)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('\n');
        toast.error(msg || 'Failed to save sale order');
      } else {
        toast.error('Failed to save sale order');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Close dropdown on outside click ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!open) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50
        flex items-start justify-center
        overflow-hidden
        bg-black/50
        backdrop-blur-sm
        transition-opacity
        duration-300
        ease-out
        ${isVisible ? "opacity-100" : "opacity-0"}
      `}
    >
      <div
        className={`
          w-full
          h-full
          max-h-screen
          bg-white
          shadow-2xl
          flex flex-col
          transform
          transition-transform
          duration-500
          ease-out
          ${isVisible ? "translate-y-0" : "-translate-y-full"}
        `}
      >
        {/* Header */}
        <div className="flex-shrink-0 sticky top-0 bg-gray-200 px-4 py-1.5 flex justify-between items-center z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {editingSaleOrder ? 'Edit Sale Order' : 'Sale Order'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-gray-900">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-2">
            {/* Row 1: Voucher No, Date */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center justify-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Order No <span className="text-red-400">*</span>
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
                    Order Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={master.vdate}
                    onChange={(e) => handleMasterChange('vdate', e.target.value)}
                    className="w-[180px] bg-gray-100 border border-gray-300 rounded-xs text-sm px-3 py-1 text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
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
              <div className="">
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Customer <span className="text-red-400">*</span>
                </label>
                <Combobox
                  value={master.customer}
                  onChange={(val) => handleMasterChange('customer', val)}
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

            {/* Row 3: Remarks */}
            <div className='grid grid-cols-3 mb-3'>
                <div className="">
              <label className="block text-sm font-medium text-gray-900 mb-1">Remarks</label>
              <textarea
                rows={2}
                value={master.remarks || ''}
                onChange={(e) => handleMasterChange('remarks', e.target.value)}
                placeholder="Additional remarks"
                className="w-full bg-gray-100 border border-gray-300 rounded-xs text-sm px-2 py-1 text-gray-900 resize-none focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            </div>

            {/* Items Table */}
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
                      <th className="text-left text-gray-900 px-3 py-1 border-r border-gray-400 w-64">Item Code</th>
                      <th className="text-left text-gray-900 px-3 py-1 border-r border-gray-400">Material</th>
                      <th className="text-left text-gray-900 px-3 py-1 border-r border-gray-400 w-32">UOM</th>
                      <th className="text-right text-gray-900 px-3 py-1 border-r border-gray-400 w-24">Qty</th>
                      <th className="text-right text-gray-900 px-3 py-1 border-r border-gray-400 w-28">Rate (₨)</th>
                      <th className="text-right text-gray-900 px-3 py-1 border-r border-gray-400 w-32">Amount (₨)</th>
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
                          <td className="border-r border-b border-gray-300">
                            <input
                              type="number"
                              step="0.001"
                              value={row.qty || ''}
                              onChange={(e) =>
                                handleDetailChange(index, 'qty', parseFloat(e.target.value) || 0)
                              }
                              className="w-full bg-white rounded-none px-2 py-1.5 text-gray-900 text-sm text-right focus:outline-none focus:ring-1 focus:ring-green-500"
                              placeholder="0"
                            />
                          </td>
                          <td className="border-r border-b border-gray-300">
                            <input
                              type="number"
                              step="0.0001"
                              value={row.rate || ''}
                              onChange={(e) =>
                                handleDetailChange(index, 'rate', parseFloat(e.target.value) || 0)
                              }
                              className="w-full bg-white rounded-none px-2 py-1.5 text-gray-900 text-sm text-right focus:outline-none focus:ring-1 focus:ring-green-500"
                              placeholder="0.0000"
                            />
                          </td>
                          <td className="border-r border-b border-gray-300 text-right font-medium text-red-500 px-3 py-1.5">
                            {rowAmount.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-200">
                    <tr className="border-t border-gray-300">
                      <td colSpan="6" className="px-3 py-2 text-right font-semibold text-gray-900">
                        Total Amount:
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-red-600 text-base">
                        {calculateTotal().toFixed(2)}
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
              Grand Total: ₨ {calculateTotal().toFixed(2)}
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
                {loading ? 'Saving...' : editingSaleOrder ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSaleOrderModal;