// src/components/Vouchers/AddJournalVoucherModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Trash2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { Combobox } from '@headlessui/react';
import api from '../../api/api';

function AddJournalVoucherModal({ isOpen, onClose, onSuccess, editingVoucher, userId, year }) {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [nextVoucherNo, setNextVoucherNo] = useState('');

  const createEmptyRow = () => ({
    account_code: '',
    account_title: '',
    debit: '',
    credit: '',
    description: '',
    query: '',
  });

  const [lines, setLines] = useState(Array.from({ length: 8 }, createEmptyRow));
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [narration, setNarration] = useState('');

  // ─── Fetch parties (Chart of Accounts) ───
  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounting/parties/');
      const data = response.data || [];
      const mapped = data.map(p => ({
        ACCOUNT_CODE: p.id,
        ACCOUNT_TITLE: p.name,
      }));
      setAccounts(mapped);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to load chart of accounts');
    }
  };

  // ─── Fetch next voucher number (for display only) ───
  const fetchNextVoucherNumber = async () => {
    try {
      const currentYear = year || new Date().getFullYear().toString();
      const response = await api.get('/accounting/vouchers/next_number/', {
        params: { year: currentYear, vtype: 'JV' },
      });
      setNextVoucherNo(response.data.vno?.toString() || '');
    } catch (error) {
      console.error('Error fetching next voucher number:', error);
      // Fallback: compute locally
      const res = await api.get('/accounting/vouchers/', {
        params: { year: currentYear, vtype: 'JV' },
      });
      const vouchers = res.data || [];
      const maxVno = vouchers.reduce((max, v) => Math.max(max, v.vno || 0), 0);
      setNextVoucherNo((maxVno + 1).toString());
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
      if (!editingVoucher) {
        fetchNextVoucherNumber();
      }
      if (editingVoucher) {
        loadVoucherData();
      }
    }
  }, [isOpen, editingVoucher, year]);

  const loadVoucherData = () => {
    if (editingVoucher) {
      setDate(editingVoucher.vdate?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setNarration(editingVoucher.remarks || '');
      setNextVoucherNo(editingVoucher.vno?.toString() || '');

      if (editingVoucher.details) {
        const loadedLines = editingVoucher.details.map(detail => ({
          account_code: detail.account_code,
          account_title: detail.account_title || '',
          debit: detail.debit || '',
          credit: detail.credit || '',
          description: detail.narration || '',
          query: '',
        }));
        while (loadedLines.length < 8) loadedLines.push(createEmptyRow());
        setLines(loadedLines);
      }
    }
  };

  // ─── Helpers ───
  const addRow = () => setLines([...lines, createEmptyRow()]);
  const removeRow = (index) => {
    if (lines.length === 1) {
      toast.error('At least one row is required');
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = value;
    if (field === 'account_code') {
      const selected = accounts.find(a => a.ACCOUNT_CODE === value);
      if (selected) updated[index].account_title = selected.ACCOUNT_TITLE;
    }
    setLines(updated);

    if (index === lines.length - 1 && ['account_code', 'debit', 'credit'].includes(field)) {
      const last = updated[index];
      if (last.account_code && (parseFloat(last.debit) > 0 || parseFloat(last.credit) > 0 || last.description)) {
        addRow();
      }
    }
  };

  const focusField = (rowIndex, field) => {
    const el = document.getElementById(`row-${rowIndex}-${field}`);
    if (el) {
      el.focus();
      if (field === 'account') el.click();
      if (['debit', 'credit'].includes(field)) el.select();
    }
  };

  const handleKeyDown = (e, rowIndex, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const order = ['account', 'description', 'debit', 'credit'];
      const idx = order.indexOf(field);
      if (idx < order.length - 1) {
        focusField(rowIndex, order[idx + 1]);
      } else {
        addRow();
        focusField(rowIndex + 1, 'account');
      }
    }
  };

  const calculateTotals = () => {
    let totalDebit = 0, totalCredit = 0;
    lines.forEach(line => {
      totalDebit += parseFloat(line.debit) || 0;
      totalCredit += parseFloat(line.credit) || 0;
    });
    return { totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 0.01 };
  };

  const { totalDebit, totalCredit, isBalanced } = calculateTotals();

  const getAccountDisplay = (code) => {
    const acc = accounts.find(a => a.ACCOUNT_CODE === code);
    return acc ? acc.ACCOUNT_TITLE : '';
  };

  const getFilteredAccounts = (query) => {
    if (!query) return accounts;
    return accounts.filter(acc =>
      acc.ACCOUNT_CODE?.toString().toLowerCase().includes(query.toLowerCase()) ||
      acc.ACCOUNT_TITLE?.toLowerCase().includes(query.toLowerCase())
    );
  };

  // ─── Submit ───
  const handleSubmit = async () => {
    const validLines = lines
      .filter(line => line.account_code && (parseFloat(line.debit) > 0 || parseFloat(line.credit) > 0))
      .map((line, idx) => ({
        account_code: line.account_code,
        narration: line.description,
        debit: parseFloat(line.debit) || 0,
        credit: parseFloat(line.credit) || 0,
        vsn: idx + 1,
        branch: null,
        cheque_no: null,
        cheque_date: null,
        chq_title: null,
        due: null,
      }));

    if (validLines.length === 0) {
      toast.error('Please add at least one valid entry');
      return;
    }
    if (!isBalanced) {
      toast.error(`Debit and Credit are not balanced! Difference: ₨ ${Math.abs(totalDebit - totalCredit).toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      const currentYear = year || new Date().getFullYear().toString();
      const payload = {
        year: currentYear,
        vtype: 'JV',
        vdate: date,
        remarks: narration,
        status: 'A',
        received_by: null,
        user_no: userId || 1,
        details: validLines,
        // ❌ vno is NOT sent – backend will generate it
      };

      let response;
      if (editingVoucher) {
        response = await api.put(`/accounting/vouchers/${editingVoucher.id}/`, payload);
      } else {
        response = await api.post('/accounting/vouchers/', payload);
      }

      toast.success(response.data.message || `Journal voucher ${editingVoucher ? 'updated' : 'created'} successfully`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving voucher:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to save voucher';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* HEADER */}
      <div className="bg-gray-200 border-b border-gray-400">
        <div className="px-6 py-3 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingVoucher ? 'Edit Journal Voucher' : 'Journal Entry'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="px-4 flex items-center justify-between">
          <div>
            <label className="text-sm text-gray-500">Journal date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-gray-400 rounded-xs px-2 py-1 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="mb-2">
            <label className="text-sm text-gray-500">Journal no. (preview)</label>
            <input
              value={nextVoucherNo}
              readOnly
              className="w-full bg-white rounded-xs border border-gray-400 px-2 py-1 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto px-10 py-4">
        <table className="w-full rounded-xs overflow-hidden text-sm">
          <thead>
            <tr className="border-b border-gray-400 text-gray-500 bg-gray-300">
              <th className="p-2 w-10 border-r border-gray-400">#</th>
              <th className="p-2 border-r border-gray-400">Account</th>
              <th className="p-2 border-r border-gray-400">Narration</th>
              <th className="p-2 border-r border-gray-400 w-36">Debit</th>
              <th className="p-2 border-r border-gray-400 w-36">Credit</th>
              <th className="p-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => {
              const filtered = getFilteredAccounts(line.query);
              return (
                <tr key={index} className="border-t border-gray-400 hover:bg-gray-100 transition">
                  <td className="text-center border-r border-gray-400 text-gray-900">{index + 1}</td>

                  <td className="border-r border-gray-400 p-0">
                    <Combobox
                      value={line.account_code}
                      onChange={(value) => {
                        handleLineChange(index, 'account_code', value);
                        setTimeout(() => focusField(index, 'description'), 100);
                      }}
                    >
                      <div className="relative">
                        <Combobox.Input
                          id={`row-${index}-account`}
                          className="w-full bg-white rounded-none px-2 py-1.5 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                          onChange={(e) => handleLineChange(index, 'query', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index, 'account')}
                          displayValue={(code) => getAccountDisplay(code)}
                          placeholder="Select account..."
                        />
                        <Combobox.Button className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <ChevronDown size={16} className="text-gray-500" />
                        </Combobox.Button>
                        <Combobox.Options className="absolute z-20 mt-1 w-full bg-white border border-gray-400 rounded-xs shadow-lg max-h-60 overflow-auto">
                          {filtered.length === 0 ? (
                            <div className="p-2 text-gray-400 text-sm">No results</div>
                          ) : (
                            filtered.map((acc) => (
                              <Combobox.Option
                                key={acc.ACCOUNT_CODE}
                                value={acc.ACCOUNT_CODE}
                                className={({ active }) =>
                                  `px-3 py-2 cursor-pointer ${active ? 'bg-[#6b3e66] text-white' : 'text-gray-900'}`
                                }
                              >
                                <div className="text-sm">
                                  <div className="font-medium">{acc.ACCOUNT_TITLE}</div>
                                  <div className="text-xs text-gray-400">{acc.ACCOUNT_CODE}</div>
                                </div>
                              </Combobox.Option>
                            ))
                          )}
                        </Combobox.Options>
                      </div>
                    </Combobox>
                  </td>

                  <td className="border-r border-gray-400 p-0">
                    <input
                      id={`row-${index}-description`}
                      className="w-full bg-white rounded-none px-2 py-1.5 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                      value={line.description}
                      onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index, 'description')}
                      placeholder="Description"
                    />
                  </td>

                  <td className="border-r border-gray-400 p-0">
                    <input
                      id={`row-${index}-debit`}
                      type="number"
                      step="0.01"
                      className="w-full bg-white rounded-none px-2 py-1.5 text-gray-900 text-sm text-right focus:outline-none focus:ring-1 focus:ring-green-500"
                      value={line.debit}
                      onChange={(e) => handleLineChange(index, 'debit', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index, 'debit')}
                      placeholder="0.00"
                    />
                  </td>

                  <td className="border-r border-gray-400 p-0">
                    <input
                      id={`row-${index}-credit`}
                      type="number"
                      step="0.01"
                      className="w-full bg-white rounded-none px-2 py-1.5 text-gray-900 text-sm text-right focus:outline-none focus:ring-1 focus:ring-green-500"
                      value={line.credit}
                      onChange={(e) => handleLineChange(index, 'credit', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index, 'credit')}
                      placeholder="0.00"
                    />
                  </td>

                  <td className="text-center">
                    {index >= 8 && (
                      <button
                        onClick={() => removeRow(index)}
                        className="text-gray-500 hover:text-red-400 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-300 text-gray-900 border-t border-gray-400">
              <td colSpan="3" className="p-2 text-right font-medium">Total</td>
              <td className="p-2 text-right font-bold text-green-600">{totalDebit.toLocaleString()}</td>
              <td className="p-2 text-right font-bold text-red-600">{totalCredit.toLocaleString()}</td>
              <td></td>
            </tr>
            {!isBalanced && (totalDebit > 0 || totalCredit > 0) && (
              <tr className="bg-red-500/10">
                <td colSpan={6} className="p-2 text-center text-red-600 text-sm">
                  ⚠️ Debit and Credit are not balanced. Difference: ₨{' '}
                  {Math.abs(totalDebit - totalCredit).toFixed(2)}
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>

      {/* FOOTER */}
      <div className="bg-gray-200 border-t border-gray-400 px-6 py-1.5 flex justify-between">
        <button
          onClick={onClose}
          className="hover:bg-gray-100 px-6 text-gray-700 rounded-xs border border-gray-600 transition disabled:opacity-50"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="bg-green-600 hover:bg-green-700 text-white px-6 rounded-xs transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export default AddJournalVoucherModal;