// src/pages/admin/JournalVoucher.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import AddJournalVoucherModal from '@/components/Vouchers/AddJournalVoucherModal';
import api from '../../api/api';

function JournalVoucher() {
  const [vouchers, setVouchers] = useState([]);
  const [voucherDetails, setVoucherDetails] = useState({});
  const [accounts, setAccounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // ── Fetch chart of accounts (Parties) ──
  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounting/parties/');
      const data = response.data || [];
      const accountMap = {};
      data.forEach(p => {
        accountMap[p.id] = p.name;
      });
      setAccounts(accountMap);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to load chart of accounts');
    }
  };

  // ── Fetch JV vouchers ──
  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/accounting/vouchers/');
      const allVouchers = response.data || [];
      const jvVouchers = allVouchers.filter(v => v.vtype === 'JV');
      console.log('JV Vouchers:', jvVouchers); // debug – shows details included
      setVouchers(jvVouchers);

      // Build details map directly from the vouchers
      const detailsMap = {};
      jvVouchers.forEach(voucher => {
        detailsMap[voucher.vno] = voucher.details || [];
      });
      setVoucherDetails(detailsMap);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      toast.error('Failed to load journal vouchers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchVouchers();
  }, []);

  // ── Helpers ──
  const getAllEntries = (voucherNo) => {
    return voucherDetails[voucherNo] || [];
  };

  const getAccountTitle = (accountCode) => {
    return accounts[accountCode] || accountCode || '-';
  };

  const getTotals = (voucherNo) => {
    const details = voucherDetails[voucherNo];
    if (details && details.length > 0) {
      let totalDebit = 0;
      let totalCredit = 0;
      details.forEach(detail => {
        totalDebit += parseFloat(detail.debit) || 0;
        totalCredit += parseFloat(detail.credit) || 0;
      });
      return { totalDebit, totalCredit };
    }
    return { totalDebit: 0, totalCredit: 0 };
  };

  // ── Filtering & Pagination ──
  const filteredVouchers = vouchers.filter(voucher =>
    voucher.vno?.toString().includes(searchTerm) ||
    voucher.year?.toString().includes(searchTerm)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredVouchers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage);

  // ── CRUD handlers ──
  const handleDelete = async (voucher) => {
    if (!window.confirm(`Are you sure you want to delete voucher #${voucher.vno}?`)) return;

    try {
      await api.delete(`/accounting/vouchers/${voucher.id}/`);
      toast.success('Voucher deleted successfully');
      fetchVouchers();
    } catch (error) {
      console.error('Error deleting voucher:', error);
      toast.error('Failed to delete voucher');
    }
  };

  const handleEdit = async (voucher) => {
    try {
      const response = await api.get(`/accounting/vouchers/${voucher.id}/`);
      setEditingVoucher(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching voucher details:', error);
      toast.error('Failed to load voucher details');
    }
  };

  const handleAdd = () => {
    setEditingVoucher(null);
    setShowModal(true);
  };

  const handleViewDetails = async (voucher) => {
    try {
      const response = await api.get(`/accounting/vouchers/${voucher.id}/`);
      setSelectedVoucher(response.data);
      setShowDetails(true);
    } catch (error) {
      console.error('Error fetching voucher details:', error);
      toast.error('Failed to load voucher details');
    }
  };

  const handleModalSuccess = () => {
    fetchVouchers();
    setShowModal(false);
    setEditingVoucher(null);
  };

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Journal Vouchers</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by voucher no or year..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-1 rounded-xs border border-gray-300 text-gray-900 w-80 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <button
            onClick={handleAdd}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xs text-sm flex items-center gap-2 transition"
          >
            <Plus size={18} />
            Add Journal Entry
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xs shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 border-r border-gray-300">Date</th>
                <th className="text-center px-4 py-3 text-gray-600 border-r border-gray-300">VNo</th>
                <th className="text-center px-4 py-3 text-gray-600 border-r border-gray-300">VSN</th>
                <th className="text-left px-4 py-3 text-gray-600 border-r border-gray-300">Account Title</th>
                <th className="text-left px-4 py-3 text-gray-600 border-r border-gray-300">Narration</th>
                <th className="text-center px-4 py-3 text-gray-600 border-r border-gray-300">Debit</th>
                <th className="text-center px-4 py-3 text-gray-600 border-r border-gray-300">Credit</th>
                <th className="text-center px-4 py-3 text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">Loading...</td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">No journal vouchers found</td>
                </tr>
              ) : (
                currentItems.map((voucher) => {
                  const entries = getAllEntries(voucher.vno);
                  if (entries.length === 0) {
                    return (
                      <tr key={voucher.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-center">{new Date(voucher.vdate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-center font-mono font-semibold text-gray-900">{voucher.vno}</td>
                        <td className="px-4 py-3 text-center">-</td>
                        <td className="px-4 py-3 text-gray-500 italic">No entries</td>
                        <td className="px-4 py-3">-</td>
                        <td className="px-4 py-3 text-right">0</td>
                        <td className="px-4 py-3 text-right">0</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => handleViewDetails(voucher)} className="text-blue-600 hover:text-blue-800" title="View">
                              <Eye size={16} />
                            </button>
                            <button onClick={() => handleEdit(voucher)} className="text-yellow-600 hover:text-yellow-800" title="Edit">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(voucher)} className="text-red-600 hover:text-red-800" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return entries.map((entry, idx) => {
                    const rowSpan = entries.length;
                    return (
                      <tr key={`${voucher.id}-${idx}`} className="border-b border-gray-200 hover:bg-gray-50">
                        {idx === 0 && (
                          <>
                            <td className="px-4 py-3 text-center border-r border-gray-300" rowSpan={rowSpan}>
                              {new Date(voucher.vdate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-semibold text-gray-900 border-r border-gray-300" rowSpan={rowSpan}>
                              {voucher.vno}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-3 text-center font-mono border-r border-gray-300">{entry.vsn || idx + 1}</td>
                        <td className="px-4 py-3 border-r border-gray-300">{getAccountTitle(entry.account_code)}</td>
                        <td className="px-4 py-3 max-w-xs truncate border-r border-gray-300">{entry.narration || '-'}</td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium border-r border-gray-300">
                          {parseFloat(entry.debit) !== 0 ? parseFloat(entry.debit).toLocaleString() : '0'}
                        </td>
                        <td className="px-4 py-3 text-right text-red-600 font-medium border-r border-gray-300">
                          {parseFloat(entry.credit) !== 0 ? parseFloat(entry.credit).toLocaleString() : '0'}
                        </td>
                        {idx === 0 && (
                          <td className="px-4 py-3" rowSpan={rowSpan}>
                            <div className="flex gap-2 justify-center">
                              <button onClick={() => handleViewDetails(voucher)} className="text-blue-600 hover:text-blue-800" title="View">
                                <Eye size={16} />
                              </button>
                              <button onClick={() => handleEdit(voucher)} className="text-yellow-600 hover:text-yellow-800" title="Edit">
                                <Edit size={16} />
                              </button>
                              <button onClick={() => handleDelete(voucher)} className="text-red-600 hover:text-red-800" title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  });
                })
              )}
            </tbody>
            <tfoot className="bg-gray-100 border-t border-gray-200">
              <tr>
                <td colSpan="5" className="px-4 py-3 text-right font-semibold text-gray-700">Total:</td>
                <td className="px-4 py-3 text-right font-bold text-green-600">
                  {currentItems.reduce((sum, v) => sum + getTotals(v.vno).totalDebit, 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-bold text-red-600">
                  {currentItems.reduce((sum, v) => sum + getTotals(v.vno).totalCredit, 0).toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredVouchers.length)} of {filteredVouchers.length} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md disabled:opacity-50 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 bg-green-600 text-white rounded-md">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md disabled:opacity-50 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedVoucher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Voucher Details - #{selectedVoucher.vno}</h3>
              <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Voucher No</label>
                  <p className="text-gray-900 font-mono">{selectedVoucher.vno}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Year</label>
                  <p className="text-gray-900">{selectedVoucher.year}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Date</label>
                  <p className="text-gray-900">{new Date(selectedVoucher.vdate).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Journal Entries</h4>
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="text-left px-3 py-2">VSN</th>
                      <th className="text-left px-3 py-2">Account Title</th>
                      <th className="text-left px-3 py-2">Narration</th>
                      <th className="text-right px-3 py-2">Debit (₨)</th>
                      <th className="text-right px-3 py-2">Credit (₨)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedVoucher.details?.map((detail, idx) => (
                      <tr key={idx} className="border-t border-gray-200">
                        <td className="px-3 py-2 text-center font-mono">{detail.vsn || idx + 1}</td>
                        <td className="px-3 py-2">{getAccountTitle(detail.account_code)}</td>
                        <td className="px-3 py-2">{detail.narration || '-'}</td>
                        <td className="px-3 py-2 text-right text-green-600">
                          {parseFloat(detail.debit) > 0 ? `₨ ${parseFloat(detail.debit).toLocaleString()}` : '-'}
                        </td>
                        <td className="px-3 py-2 text-right text-red-600">
                          {parseFloat(detail.credit) > 0 ? `₨ ${parseFloat(detail.credit).toLocaleString()}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100">
                    <tr className="border-t border-gray-200">
                      <td colSpan="3" className="px-3 py-2 text-right font-semibold">Total:</td>
                      <td className="px-3 py-2 text-right font-semibold text-green-600">
                        ₨ {selectedVoucher.details?.reduce((sum, d) => sum + parseFloat(d.debit), 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-red-600">
                        ₨ {selectedVoucher.details?.reduce((sum, d) => sum + parseFloat(d.credit), 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setShowDetails(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AddJournalVoucherModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingVoucher(null); }}
        onSuccess={handleModalSuccess}
        editingVoucher={editingVoucher}
        userId={1}
        year={new Date().getFullYear().toString()}
      />
    </div>
  );
}

export default JournalVoucher;