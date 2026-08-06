// src/components/Support/AccountCombobox.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '../../api/api';

const AccountCombobox = ({
  value,
  onChange,
  placeholder = 'Search account...',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const res = await api.get('/accounting/parties/');
        // Assuming response is array or paginated
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setAccounts(data);
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAccounts = accounts.filter((acc) => {
    const searchLower = search.toLowerCase();
    return (
      acc.code?.toString().toLowerCase().includes(searchLower) ||
      acc.name?.toLowerCase().includes(searchLower)
    );
  });

  const handleSelect = (account) => {
    onChange(account.code?.toString() || '');
    setSearch('');
    setOpen(false);
  };

  const displayValue = value
    ? accounts.find((a) => a.code?.toString() === value)?.name || value
    : '';

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        className={`relative flex items-center border border-gray-200 rounded-xs ${
          disabled ? 'bg-gray-50' : 'bg-white'
        }`}
      >
        <Input
          value={open ? search : displayValue}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-8 pr-8"
        />
        <button
          type="button"
          className="absolute right-1 p-1 text-gray-400 hover:text-gray-600"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xs shadow-lg">
          {loading ? (
            <div className="p-2 text-sm text-gray-500">Loading...</div>
          ) : filteredAccounts.length === 0 ? (
            <div className="p-2 text-sm text-gray-400">No accounts found</div>
          ) : (
            filteredAccounts.map((acc) => (
              <button
                key={acc.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center justify-between"
                onClick={() => handleSelect(acc)}
              >
                <span>
                  <span className="font-mono text-gray-600">{acc.code}</span>
                  <span className="ml-2 text-gray-800">{acc.name}</span>
                </span>
                {value === acc.code?.toString() && (
                  <span className="text-orange-600">✓</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AccountCombobox;