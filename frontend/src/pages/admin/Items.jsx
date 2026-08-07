// src/pages/admin/Items.jsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Plus, Pencil, Trash2, Search, Package, Ruler, X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import AddItemModal from '@/components/Inventory/AddItemModal';

// ========== CUSTOM ALERT DIALOG COMPONENTS ==========
const AlertDialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 bg-white shadow-xl max-w-md w-full mx-4 p-6 rounded-xs animate-in fade-in zoom-in duration-200">
        {children}
      </div>
    </div>
  );
};

const AlertDialogContent = ({ children }) => children;

const AlertDialogHeader = ({ children }) => (
  <div className="mb-4">{children}</div>
);

const AlertDialogTitle = ({ children }) => (
  <h2 className="text-lg font-semibold text-gray-900">{children}</h2>
);

const AlertDialogDescription = ({ children }) => (
  <p className="text-sm text-gray-500 mt-1">{children}</p>
);

const AlertDialogFooter = ({ children }) => (
  <div className="flex justify-end gap-3 mt-6">{children}</div>
);

const AlertDialogCancel = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xs transition-colors duration-200"
  >
    {children || 'Cancel'}
  </button>
);

const AlertDialogAction = ({ children, onClick, className, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 text-sm font-medium text-white rounded-xs transition-colors duration-200 bg-teal-500 hover:bg-teal-600 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);
// ========== END CUSTOM ALERT DIALOG ==========

const Items = () => {
  // ---------- State ----------
  const [activeTab, setActiveTab] = useState('items');

  // Data states
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search states
  const [searchItem, setSearchItem] = useState('');
  const [searchUnit, setSearchUnit] = useState('');

  // Modal state for Items
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Modal state for Units
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [unitForm, setUnitForm] = useState({
    name: '',
    shortName: '',
    status: true,
  });
  const [unitLoading, setUnitLoading] = useState(false);
  const [showUnitPreview, setShowUnitPreview] = useState(true);

  // Alert Dialog for Edit
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  // Alert Dialog for Delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Alert Dialog for Unit deletion
  const [deleteUnitDialogOpen, setDeleteUnitDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState(null);
  const [isDeletingUnit, setIsDeletingUnit] = useState(false);

  // ---------- Debug: Log API base URL ----------
  useEffect(() => {
    console.log('🔍 API Base URL:', api.defaults.baseURL);
  }, []);

  // ---------- Data Fetching ----------
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [itemsRes, unitsRes] = await Promise.all([
        api.get('/inventory/items/'),
        api.get('/inventory/units/'),
      ]);
      
      const sortedItems = Array.isArray(itemsRes.data) 
        ? [...itemsRes.data].sort((a, b) => a.ITEM_ID - b.ITEM_ID)
        : [];
      
      setItems(sortedItems);
      setUnits(Array.isArray(unitsRes.data) ? unitsRes.data : []);
      
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        toast.error('Session expired. Please login again.');
      } else if (error.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Is Django running on port 8000?');
        toast.error('Cannot connect to Django server');
      } else {
        setError('Failed to load data. Please try again.');
        toast.error('Failed to load data');
      }
      
      setItems([]);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ---------- ITEMS CRUD ----------
  const handleOpenItemModal = (item = null) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleEditClick = (item) => {
    setItemToEdit(item);
    setEditDialogOpen(true);
  };

  const handleEditConfirm = () => {
    if (itemToEdit) {
      setEditDialogOpen(false);
      handleOpenItemModal(itemToEdit);
      setItemToEdit(null);
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
      await api.delete(`/inventory/items/${itemToDelete.ITEM_ID}/`);
      // Success – item was soft-deleted (deactivated)
      setItems((prevItems) => prevItems.filter((i) => i.ITEM_ID !== itemToDelete.ITEM_ID));
      toast.success(`"${itemToDelete.ITEM_NAME}" deactivated successfully`);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('❌ Error deleting item:', error);
      
      // Handle backend error – item is referenced and cannot be deleted
      let errorMsg = 'Failed to delete item.';
      if (error.response?.status === 400) {
        // Backend returns a detailed error message
        errorMsg = error.response.data?.error || 
                   'This item is used in purchases, sales, or orders and cannot be deleted.';
      } else if (error.response?.status === 403) {
        errorMsg = 'You do not have permission to delete this item.';
      } else if (error.response?.status === 404) {
        errorMsg = 'Item not found.';
      }
      toast.error(errorMsg);
      // ✅ Do NOT remove the item from the list – it stays
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleSaveItem = async (payload) => {
    console.log('📤 handleSaveItem received payload:', payload);
    
    try {
      let response;
      
      if (editingItem) {
        console.log(`📤 Updating item ${editingItem.ITEM_ID}...`);
        response = await api.put(`/inventory/items/${editingItem.ITEM_ID}/`, payload);
        console.log('✅ Item updated:', response.data);
        
        setItems((prevItems) =>
          prevItems.map((i) => (i.ITEM_ID === editingItem.ITEM_ID ? response.data : i))
        );
        toast.success('Item updated successfully');
      } else {
        console.log('📤 Creating new item...');
        response = await api.post('/inventory/items/', payload);
        console.log('✅ Item created:', response.data);
        
        setItems((prevItems) => {
          const newItems = [...prevItems, response.data];
          return newItems.sort((a, b) => a.ITEM_ID - b.ITEM_ID);
        });
        toast.success('Item created successfully');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error saving item:', error);
      throw error;
    }
  };

  // ---------- UNITS CRUD ----------
  const handleOpenUnitModal = (unit = null) => {
    if (unit) {
      setEditingUnit(unit);
      setUnitForm({
        name: unit.UOM_NAME || '',
        shortName: unit.SHORT_NAME || '',
        status: unit.STATUS !== undefined ? unit.STATUS : true,
      });
    } else {
      setEditingUnit(null);
      setUnitForm({
        name: '',
        shortName: '',
        status: true,
      });
    }
    setIsUnitModalOpen(true);
  };

  const handleUnitSubmit = async (e) => {
    e.preventDefault();
    
    if (!unitForm.name.trim() || !unitForm.shortName.trim()) {
      toast.error('Unit name and short name are required');
      return;
    }

    setUnitLoading(true);
    try {
      const payload = {
        UOM_NAME: unitForm.name.trim(),
        SHORT_NAME: unitForm.shortName.trim(),
        STATUS: unitForm.status,
      };

      let response;
      if (editingUnit) {
        response = await api.put(`/inventory/units/${editingUnit.UOM_ID}/`, payload);
        toast.success('Unit updated successfully');
      } else {
        response = await api.post('/inventory/units/', payload);
        toast.success('Unit added successfully');
      }

      setIsUnitModalOpen(false);
      setEditingUnit(null);
      setUnitForm({ name: '', shortName: '', status: true });
      fetchData();
    } catch (error) {
      console.error('❌ Error saving unit:', error);
      let errorMsg = 'Failed to save unit';
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const errors = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n');
          errorMsg = errors;
        } else {
          errorMsg = errorData;
        }
      }
      toast.error(errorMsg);
    } finally {
      setUnitLoading(false);
    }
  };

  const handleDeleteUnitClick = (unit) => {
    setUnitToDelete(unit);
    setDeleteUnitDialogOpen(true);
  };

  const handleDeleteUnitConfirm = async () => {
    if (!unitToDelete) return;
    
    setIsDeletingUnit(true);
    try {
      await api.delete(`/inventory/units/${unitToDelete.UOM_ID}/`);
      setUnits((prevUnits) => prevUnits.filter((u) => u.UOM_ID !== unitToDelete.UOM_ID));
      toast.success(`"${unitToDelete.UOM_NAME}" deleted successfully`);
      setDeleteUnitDialogOpen(false);
      setUnitToDelete(null);
    } catch (error) {
      console.error('❌ Error deleting unit:', error);
      toast.error('Failed to delete unit');
    } finally {
      setIsDeletingUnit(false);
    }
  };

  // ---------- Filters ----------
  const filteredItems = Array.isArray(items)
    ? items.filter(
        (item) =>
          item?.ITEM_CODE?.toLowerCase().includes(searchItem.toLowerCase()) ||
          item?.ITEM_NAME?.toLowerCase().includes(searchItem.toLowerCase())
      )
    : [];

  const filteredUnits = Array.isArray(units)
    ? units.filter(
        (u) =>
          u?.UOM_NAME?.toLowerCase().includes(searchUnit.toLowerCase()) ||
          u?.SHORT_NAME?.toLowerCase().includes(searchUnit.toLowerCase())
      )
    : [];

  // ---------- Render ----------
  return (
    <div className="max-w-8xl mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Inventory Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your inventory items and units of measurement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleOpenItemModal()}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2.5 rounded-xs shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />New Item
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xs text-red-700 text-sm">
          <strong>Error:</strong> {error}
          <button
            onClick={fetchData}
            className="ml-4 text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 flex flex-col">
        <TabsList className="bg-white border border-gray-200 rounded-xs shadow-sm flex items-center">
          <TabsTrigger
            value="items"
            className="data-[state=active]:bg-teal-500 data-[state=active]:text-white rounded-xs px-5 py-2 text-sm font-medium transition-all duration-200"
          >
            Items
          </TabsTrigger>
          
          <div className="w-px h-5 bg-gray-200 mx-1"></div>
          
          <TabsTrigger
            value="units"
            className="data-[state=active]:bg-teal-500 data-[state=active]:text-white rounded-xs px-5 py-2 text-sm font-medium transition-all duration-200"
          >
            Units
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <Card className="border-0 shadow-sm rounded-xs overflow-hidden">
            <CardHeader className="bg-white px-6 py-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span>All Items</span>
                  <span className="ml-1 text-sm font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-xs">
                    {Array.isArray(items) ? items.length : 0}
                  </span>
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search items..."
                      value={searchItem}
                      onChange={(e) => setSearchItem(e.target.value)}
                      className="pl-9 pr-4 py-2 border-gray-200 rounded-xs w-full sm:w-64 focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-500 border-t-transparent" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-center text-xs font-medium text-gray-500 border-r border-gray-200 uppercase tracking-wider py-3 w-20">Code</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500 border-r border-gray-200 uppercase tracking-wider py-3 px-4">Name</TableHead>
                        <TableHead className="text-center text-xs font-medium text-gray-500 border-r border-gray-200 uppercase tracking-wider py-3 w-20">UOM</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500 border-r border-gray-200 uppercase tracking-wider py-3 w-32 text-right">Cost Price</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500 border-r border-gray-200 uppercase tracking-wider py-3 w-40 text-right">Re-Order Level</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500 border-r border-gray-200 uppercase tracking-wider py-3 px-4 w-32 text-center">Status</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider py-3 w-32 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan="6" className="text-center py-16 text-gray-400">
                            <div className="flex flex-col items-center gap-2">
                              <Package className="h-12 w-12 text-gray-300" />
                              <p className="text-sm font-medium">No items found</p>
                              <p className="text-xs">Try adjusting your search or add a new item</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredItems.map((item) => (
                          <TableRow key={item.ITEM_ID} className="hover:bg-gray-50 transition-colors duration-150">
                            <TableCell className="font-mono text-xs py-3 px-4 border-r border-b border-gray-200">
                              <span className="px-2 py-1 rounded-xs">{item.ITEM_CODE}</span>
                            </TableCell>
                            <TableCell className="font-medium py-3 px-4 border-r border-b border-gray-200">{item.ITEM_NAME}</TableCell>
                            <TableCell className="py-3 px-4 text-center border-r border-b border-gray-200">{item.UOM?.UOM_NAME || item.unit_short_name || '-'}</TableCell>
                            <TableCell className="text-right font-medium py-3 px-4 border-r border-b border-gray-200">{Number(item.COST_PRICE).toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium py-3 px-4 border-r border-b border-gray-200">{item.REORDER_LEVEL}</TableCell>
                            <TableCell className="text-center py-3 px-4 border-r border-b border-gray-200">
                              <span className={`px-3 py-1 rounded-xs text-xs font-medium ${item.STATUS ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {item.STATUS ? 'Active' : 'Inactive'}
                              </span>
                            </TableCell>
                            <TableCell className="text-center py-3 px-4 border-b border-gray-200">
                              <div className="flex items-center">
                                <Button variant="ghost" size="sm" onClick={() => handleEditClick(item)} className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600 rounded-xs text-green-600">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(item)} className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 rounded-xs text-red-500">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units">
          <Card className="border-0 shadow-sm rounded-xs overflow-hidden">
            <CardHeader className="bg-white px-6 py-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span>All Units</span>
                  <span className="ml-1 text-sm font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-xs">
                    {Array.isArray(units) ? units.length : 0}
                  </span>
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search units..."
                      value={searchUnit}
                      onChange={(e) => setSearchUnit(e.target.value)}
                      className="pl-9 pr-4 py-2 border-gray-200 rounded-xs w-full sm:w-64 focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                  </div>
                  <Button onClick={() => handleOpenUnitModal()} className="bg-teal-500 hover:bg-teal-600 text-white rounded-xs px-4 py-2 text-sm font-medium flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Add Unit
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs font-medium text-gray-500 border-r border-gray-200 uppercase tracking-wider py-3 px-4">Name</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 border-r border-gray-200 uppercase tracking-wider py-3 px-4">Short Name</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 border-r border-gray-200 uppercase tracking-wider py-3 px-4 text-center">Status</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 border-r border-gray-200 uppercase tracking-wider py-3 px-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan="4" className="text-center py-16 text-gray-400">
                          <div className="flex flex-col items-center gap-2">
                            <Ruler className="h-12 w-12 text-gray-300" />
                            <p className="text-sm font-medium">No units found</p>
                            <p className="text-xs">Add a new unit using the button above</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUnits.map((u) => (
                        <TableRow key={u.UOM_ID} className="hover:bg-teal-50 transition-colors duration-150">
                          <TableCell className="font-medium py-3 px-4">{u.UOM_NAME}</TableCell>
                          <TableCell className="font-mono text-sm py-3 px-4">
                            <span className="bg-none px-2 py-1 rounded-xs">{u.SHORT_NAME}</span>
                          </TableCell>
                          <TableCell className="text-center py-3 px-4">
                            <span className={`px-3 py-1 rounded-xs text-xs font-medium ${u.STATUS ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {u.STATUS ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right py-3 px-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleOpenUnitModal(u)} className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600 rounded-xs text-green-600">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteUnitClick(u)} className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 rounded-xs text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===== PROFESSIONAL UNIT MODAL ===== */}
      <Sheet open={isUnitModalOpen} onOpenChange={setIsUnitModalOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0 bg-white">
          <div className="flex flex-col h-full bg-white">
            <div>
            <div className="border-b border-gray-200 px-4 py-3 bg-white sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 tracking-tight">
                    {editingUnit ? 'Edit Unit' : 'New Unit'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsUnitModalOpen(false);
                    setEditingUnit(null);
                    setUnitForm({ name: '', shortName: '', status: true });
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-xs transition-colors duration-200"
                >
                  <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                </button>
              </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-white">
              <form onSubmit={handleUnitSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="unitName" className="text-xs font-medium text-gray-600 block mb-1">
                    Unit Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="unitName"
                    value={unitForm.name}
                    onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                    placeholder="e.g., Kilogram, Piece, Liter"
                    className="h-9 text-sm rounded-xs border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="shortName" className="text-xs font-medium text-gray-600 block mb-1">
                    Short Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="shortName"
                    value={unitForm.shortName}
                    onChange={(e) => setUnitForm({ ...unitForm, shortName: e.target.value.toUpperCase() })}
                    placeholder="e.g., kg, pc, L"
                    className="h-9 text-sm rounded-xs border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 font-mono bg-white"
                    required
                  />
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-600">Status</Label>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${unitForm.status ? 'text-black-600' : 'text-gray-500'}`}>
                        {unitForm.status ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setUnitForm({ ...unitForm, status: !unitForm.status })}
                        className={`
                          relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2
                          ${unitForm.status ? 'bg-green-500' : 'bg-gray-300'}
                        `}
                      >
                        <span
                          className={`
                            pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform
                            ${unitForm.status ? 'translate-x-4' : 'translate-x-0.5'}
                          `}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowUnitPreview(!showUnitPreview)}
                  className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors pt-2"
                >
                  {showUnitPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {showUnitPreview ? 'Hide Preview' : 'Show Preview'}
                </button>

                {showUnitPreview && (
                  <div className="bg-gray-50 rounded-xs border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Preview</span>
                      <span className={`px-2 py-0.5 rounded-xs text-xs font-medium ${unitForm.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {unitForm.status ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {unitForm.name || 'Unit Name'}
                      </p>
                      {unitForm.shortName && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Short: <span className="font-mono font-medium">{unitForm.shortName}</span>
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-blue-600">
                        <span className="font-semibold">Tip:</span> All fields are being previewed in real-time as you type.
                      </p>
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="border-t border-gray-100 px-6 py-3 flex justify-end gap-2.5 bg-white sticky bottom-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsUnitModalOpen(false);
                  setEditingUnit(null);
                  setUnitForm({ name: '', shortName: '', status: true });
                }}
                disabled={unitLoading}
                className="h-9 px-5 text-sm font-medium rounded-xs border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={unitLoading}
                onClick={handleUnitSubmit}
                className="h-9 px-5 text-sm font-medium rounded-xs bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {unitLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Saving...
                  </span>
                ) : (
                  editingUnit ? 'Update Unit' : 'Create Unit'
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ===== EDIT CONFIRMATION DIALOG ===== */}
      <AlertDialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to edit the item{' '}
              <span className="font-semibold text-gray-700">"{itemToEdit?.ITEM_NAME}"</span>?
              <br />
              <span className="text-xs text-gray-400">You will be able to modify all fields.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEditDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEditConfirm}>Edit Item</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== ITEM DELETE CONFIRMATION DIALOG ===== */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the item{' '}
              <span className="font-semibold text-gray-700">"{itemToDelete?.ITEM_NAME}"</span>?
              <br />
              <span className="text-xs text-gray-400">
                If this item is referenced in any <strong>Purchase, Sale, Voucher, or Order</strong>,
                deletion will be blocked and you will see a detailed error message.
                Otherwise, it will be deactivated (soft delete) and removed from the list.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent inline-block mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Item'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== UNIT DELETE CONFIRMATION DIALOG ===== */}
      <AlertDialog open={deleteUnitDialogOpen} onOpenChange={setDeleteUnitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Unit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the unit{' '}
              <span className="font-semibold text-gray-700">"{unitToDelete?.UOM_NAME}"</span>?
              <br />
              <span className="text-xs text-gray-400">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteUnitDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUnitConfirm} disabled={isDeletingUnit}>
              {isDeletingUnit ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent inline-block mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Unit'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== ITEM MODAL ===== */}
      <AddItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        units={units}
        editingItem={editingItem}
      />
    </div>
  );
};

export default Items;