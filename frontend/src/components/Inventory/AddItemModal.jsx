// src/components/Inventory/AddItemModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const AddItemModal = ({ isOpen, onClose, onSave, units, editingItem }) => {
  const [formData, setFormData] = useState({
    ITEM_NAME: '',
    ITEM_DESCRIPTION: '',
    UOM: '',
    COST_PRICE: 0,
    MIN_STOCK: 0,
    MAX_STOCK: 0,
    REORDER_LEVEL: 0,
    MORE_DETAIL: '',
    STATUS: true,
    WEIGHT_KG: 0,
    WEIGHT_LBS: 0,
  });

  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  
  // UOM Selector states
  const [isUomOpen, setIsUomOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const uomDropdownRef = useRef(null);

  // Status dropdown state
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ITEM_NAME: editingItem.ITEM_NAME || '',
        ITEM_DESCRIPTION: editingItem.ITEM_DESCRIPTION || '',
        UOM: editingItem.UOM?.UOM_ID || editingItem.UOM || '',
        COST_PRICE: editingItem.COST_PRICE || 0,
        MIN_STOCK: editingItem.MIN_STOCK || 0,
        MAX_STOCK: editingItem.MAX_STOCK || 0,
        REORDER_LEVEL: editingItem.REORDER_LEVEL || 0,
        MORE_DETAIL: editingItem.MORE_DETAIL || '',
        STATUS: editingItem.STATUS !== undefined ? editingItem.STATUS : true,
        WEIGHT_KG: editingItem.WEIGHT_KG || 0,
        WEIGHT_LBS: editingItem.WEIGHT_LBS || 0,
      });
    } else {
      setFormData({
        ITEM_NAME: '',
        ITEM_DESCRIPTION: '',
        UOM: '',
        COST_PRICE: 0,
        MIN_STOCK: 0,
        MAX_STOCK: 0,
        REORDER_LEVEL: 0,
        MORE_DETAIL: '',
        STATUS: true,
        WEIGHT_KG: 0,
        WEIGHT_LBS: 0,
      });
    }
  }, [editingItem, isOpen]);

  // Close dropdowns on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsUomOpen(false);
        setIsStatusOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (uomDropdownRef.current && !uomDropdownRef.current.contains(e.target)) {
        setIsUomOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setIsStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto‑calculate lbs if kg changes
      if (field === 'WEIGHT_KG') {
        const kg = parseFloat(value) || 0;
        updated.WEIGHT_LBS = kg * 2.2040;
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!formData.ITEM_NAME.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!formData.UOM) {
      toast.error('Unit of Measurement is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ITEM_NAME: formData.ITEM_NAME.trim(),
        ITEM_DESCRIPTION: formData.ITEM_DESCRIPTION || '',
        UOM: parseInt(formData.UOM),
        COST_PRICE: parseFloat(formData.COST_PRICE) || 0,
        MIN_STOCK: parseFloat(formData.MIN_STOCK) || 0,
        MAX_STOCK: parseFloat(formData.MAX_STOCK) || 0,
        REORDER_LEVEL: parseFloat(formData.REORDER_LEVEL) || 0,
        MORE_DETAIL: formData.MORE_DETAIL || '',
        STATUS: formData.STATUS,
        WEIGHT_KG: parseFloat(formData.WEIGHT_KG) || 0,
        WEIGHT_LBS: parseFloat(formData.WEIGHT_LBS) || 0,
      };

      console.log('📤 Saving item with payload:', payload);
      
      const result = await onSave(payload);
      console.log('✅ Item saved:', result);
      onClose();
    } catch (error) {
      console.error('❌ Error saving item:', error);
      console.error('❌ Response data:', error.response?.data);
      
      const errorData = error.response?.data;
      let errorMsg = 'Failed to save item';
      if (errorData) {
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
      setLoading(false);
    }
  };

  // Get selected unit
  const getSelectedUnit = () => {
    if (!formData.UOM) return null;
    return units?.find(u => u.UOM_ID === parseInt(formData.UOM));
  };

  const getUnitName = () => {
    if (!formData.UOM) return 'Not selected';
    const unit = getSelectedUnit();
    return unit ? `${unit.UOM_NAME} (${unit.SHORT_NAME})` : 'Not selected';
  };

  const getSelectedUnitDisplay = () => {
    if (!formData.UOM) return 'Select unit of measurement';
    const unit = getSelectedUnit();
    return unit ? `${unit.UOM_NAME} (${unit.SHORT_NAME})` : 'Select unit of measurement';
  };

  // Handle keyboard navigation for UOM
  const handleUomKeyDown = (e) => {
    if (!isUomOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < (units?.length || 0) - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < (units?.length || 0)) {
          const selected = units[highlightedIndex];
          handleChange('UOM', String(selected.UOM_ID));
          setIsUomOpen(false);
        }
        break;
      default:
        break;
    }
  };

  // UOM Selector
  const UomSelector = () => (
    <div className="relative" ref={uomDropdownRef}>
      <div
        onClick={() => setIsUomOpen(!isUomOpen)}
        className={`
          w-full h-9 px-3 py-1.5 text-sm rounded-xs border
          flex items-center justify-between cursor-pointer
          transition-all duration-200
          ${isUomOpen 
            ? 'border-green-600 ring-2 ring-green-600/20 bg-white' 
            : 'border-gray-200 hover:border-gray-300 bg-white'
          }
          ${formData.UOM ? 'text-gray-900' : 'text-gray-400'}
          outline-none focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600
        `}
      >
        <div className="flex items-center gap-2 truncate">
          {formData.UOM ? (
            <span className="truncate">{getSelectedUnitDisplay()}</span>
          ) : (
            <span>Select unit of measurement</span>
          )}
        </div>
        <ChevronDown className={`
          w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0
          ${isUomOpen ? 'rotate-180' : ''}
        `} />
      </div>

      {isUomOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xs shadow-lg overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {Array.isArray(units) && units.length > 0 ? (
              units.map((unit, index) => {
                const isSelected = String(unit.UOM_ID) === String(formData.UOM);
                const isHighlighted = index === highlightedIndex;
                
                return (
                  <div
                    key={unit.UOM_ID}
                    onClick={() => {
                      handleChange('UOM', String(unit.UOM_ID));
                      setIsUomOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`
                      flex items-center justify-between px-3 py-2 cursor-pointer
                      transition-all duration-150
                      ${isSelected ? 'bg-green-50' : ''}
                      ${isHighlighted ? 'bg-gray-50' : ''}
                      hover:bg-green-50
                    `}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className={`
                        text-sm font-medium truncate
                        ${isSelected ? 'text-green-600' : 'text-gray-900'}
                      `}>
                        {unit.UOM_NAME}
                      </span>
                      <span className="text-xs text-gray-500 truncate">
                        {unit.SHORT_NAME}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                No units available
              </div>
            )}
          </div>

          <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex justify-between">
            <span>{units?.length || 0} unit{units?.length !== 1 ? 's' : ''} available</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px]">↓</kbd>
              <span className="mx-1">to navigate</span>
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px]">Enter</kbd>
              <span className="mx-1">to select</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );

  // Status Selector
  const StatusSelector = () => {
    const statusOptions = [
      { value: true, label: 'Active' },
      { value: false, label: 'Inactive' },
    ];

    const selectedStatus = statusOptions.find(opt => opt.value === formData.STATUS);

    return (
      <div className="relative" ref={statusDropdownRef}>
        <div
          onClick={() => setIsStatusOpen(!isStatusOpen)}
          className={`
            w-full h-9 px-2 py-1.5 text-sm rounded-xs border
            flex items-center justify-between cursor-pointer
            transition-all duration-200
            ${isStatusOpen 
              ? 'border-green-600 ring-2 ring-green-600/20 bg-white' 
              : 'border-gray-200 hover:border-gray-300 bg-white'
            }
            outline-none focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600
          `}
        >
          <span className="text-gray-900">{selectedStatus?.label}</span>
          <ChevronDown className={`
            w-4 h-4 text-gray-400 transition-transform duration-200
            ${isStatusOpen ? 'rotate-180' : ''}
          `} />
        </div>

        {isStatusOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xs shadow-lg overflow-hidden">
            {statusOptions.map((option) => (
              <div
                key={String(option.value)}
                onClick={() => {
                  handleChange('STATUS', option.value);
                  setIsStatusOpen(false);
                }}
                className={`
                  px-2 py-2 cursor-pointer
                  transition-all duration-150 hover:bg-green-50
                  ${formData.STATUS === option.value ? 'bg-green-50' : ''}
                `}
              >
                <span className={`
                  text-sm
                  ${formData.STATUS === option.value ? 'text-green-600 font-medium' : 'text-gray-900'}
                `}>
                  {option.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl overflow-y-auto rounded-l-xs animate-in slide-in-from-right duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b border-gray-200 px-4 py-2 bg-white sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-900 tracking-tight">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-xs transition-colors duration-200"
              >
                <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/30">
            {/* Item Name */}
            <div>
              <Label htmlFor="ITEM_NAME" className="text-xs font-medium text-gray-600 block mb-1">
                Name <span className="text-red-500">*</span>
              </Label>
              <input
                id="ITEM_NAME"
                value={formData.ITEM_NAME}
                onChange={(e) => handleChange('ITEM_NAME', e.target.value)}
                className="h-9 w-full text-sm rounded-xs px-2 border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-green-600 hover:border-gray-300 transition-all duration-200"
                placeholder="Enter item name..."
                tabIndex={1}
              />
            </div>

            {/* UOM */}
            <div>
              <Label htmlFor="UOM" className="text-xs font-medium text-gray-600 block mb-1">
                Unit of Measurement <span className="text-red-500">*</span>
              </Label>
              <UomSelector />
            </div>

            {/* Weight Section */}
            <div className="pt-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Weight</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="WEIGHT_KG" className="text-xs font-medium text-gray-600 block mb-1">
                    Weight (kg)
                  </Label>
                  <input
                    id="WEIGHT_KG"
                    type="number"
                    step="0.001"
                    value={formData.WEIGHT_KG}
                    onChange={(e) => handleChange('WEIGHT_KG', parseFloat(e.target.value) || 0)}
                    className="h-9 w-full text-sm rounded-xs px-2 border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-green-600 hover:border-gray-300 transition-all duration-200"
                    placeholder="0.000"
                    tabIndex={3}
                  />
                </div>
                <div>
                  <Label htmlFor="WEIGHT_LBS" className="text-xs font-medium text-gray-600 block mb-1">
                    Weight (lbs)
                  </Label>
                  <input
                    id="WEIGHT_LBS"
                    type="text"
                    value={formData.WEIGHT_LBS ? formData.WEIGHT_LBS.toFixed(3) : '0.000'}
                    readOnly
                    className="h-9 w-full text-sm rounded-xs px-2 border border-gray-200 bg-gray-50 cursor-not-allowed text-gray-500"
                    tabIndex={-1}
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Auto‑calculated (kg × 2.2040)</p>
                </div>
              </div>
            </div>

            {/* Pricing & Stock Section */}
            <div className="pt-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pricing & Stock</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <Label htmlFor="COST_PRICE" className="text-xs font-medium text-gray-600 block mb-1">
                    Cost Price
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 z-10">$</span>
                    <input
                      id="COST_PRICE"
                      type="number"
                      step="0.01"
                      value={formData.COST_PRICE}
                      onChange={(e) => handleChange('COST_PRICE', parseFloat(e.target.value) || 0)}
                      className="pl-6 h-9 w-full text-sm rounded-xs px-2 border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-green-600 hover:border-gray-300 transition-all duration-200"
                      placeholder="0.00"
                      tabIndex={4}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="MIN_STOCK" className="text-xs font-medium text-gray-600 block mb-1">
                    Min Stock
                  </Label>
                  <input
                    id="MIN_STOCK"
                    type="number"
                    step="0.01"
                    value={formData.MIN_STOCK}
                    onChange={(e) => handleChange('MIN_STOCK', parseFloat(e.target.value) || 0)}
                    className="h-9 w-full text-sm rounded-xs px-2 border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-green-600 hover:border-gray-300 transition-all duration-200"
                    placeholder="0"
                    tabIndex={5}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="MAX_STOCK" className="text-xs font-medium text-gray-600 block mb-1">
                    Max Stock
                  </Label>
                  <input
                    id="MAX_STOCK"
                    type="number"
                    step="0.01"
                    value={formData.MAX_STOCK}
                    onChange={(e) => handleChange('MAX_STOCK', parseFloat(e.target.value) || 0)}
                    className="h-9 w-full text-sm rounded-xs px-2 border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-green-600 hover:border-gray-300 transition-all duration-200"
                    placeholder="0"
                    tabIndex={6}
                  />
                </div>
                <div>
                  <Label htmlFor="REORDER_LEVEL" className="text-xs font-medium text-gray-600 block mb-1">
                    Reorder Level
                  </Label>
                  <input
                    id="REORDER_LEVEL"
                    type="number"
                    step="0.01"
                    value={formData.REORDER_LEVEL}
                    onChange={(e) => handleChange('REORDER_LEVEL', parseFloat(e.target.value) || 0)}
                    className="h-9 w-full text-sm rounded-xs px-2 border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-green-600 hover:border-gray-300 transition-all duration-200"
                    placeholder="0"
                    tabIndex={7}
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="ITEM_DESCRIPTION" className="text-xs font-medium text-gray-600 block mb-1">
                Description
              </Label>
              <input
                id="ITEM_DESCRIPTION"
                value={formData.ITEM_DESCRIPTION}
                onChange={(e) => handleChange('ITEM_DESCRIPTION', e.target.value)}
                className="h-9 w-full text-sm rounded-xs px-2 border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-green-600 hover:border-gray-300 transition-all duration-200"
                placeholder="Enter description..."
                tabIndex={8}
              />
            </div>

            {/* More Detail */}
            <div>
              <Label htmlFor="MORE_DETAIL" className="text-xs font-medium text-gray-600 block mb-1">
                More Detail
              </Label>
              <input
                id="MORE_DETAIL"
                value={formData.MORE_DETAIL}
                onChange={(e) => handleChange('MORE_DETAIL', e.target.value)}
                className="h-9 w-full text-sm rounded-xs px-2 border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-green-600 hover:border-gray-300 transition-all duration-200"
                placeholder="Additional details..."
                tabIndex={9}
              />
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="STATUS" className="text-xs font-medium text-gray-600 block mb-1">
                Status
              </Label>
              <StatusSelector />
            </div>

            {/* Toggle Preview */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors pt-2"
              type="button"
            >
              {showPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>

            {/* Live Preview */}
            {showPreview && (
              <div className="bg-gray-50 rounded-xs border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Preview</span>
                  <span className={`px-2 py-0.5 rounded-xs text-xs font-medium ${
                    formData.STATUS ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {formData.STATUS ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formData.ITEM_NAME || 'Item Name'}
                  </p>
                  {formData.ITEM_DESCRIPTION && (
                    <p className="text-xs text-gray-500 mt-0.5">{formData.ITEM_DESCRIPTION}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 pt-2 border-t border-gray-200">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">UOM</span>
                    <span className="font-medium text-gray-700">{getUnitName()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Weight (kg)</span>
                    <span className="font-medium text-gray-700">{Number(formData.WEIGHT_KG).toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Weight (lbs)</span>
                    <span className="font-medium text-gray-700">{Number(formData.WEIGHT_LBS).toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Cost Price</span>
                    <span className="font-medium text-gray-700">${Number(formData.COST_PRICE).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Min Stock</span>
                    <span className="font-medium text-gray-700">{formData.MIN_STOCK || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Max Stock</span>
                    <span className="font-medium text-gray-700">{formData.MAX_STOCK || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Reorder Level</span>
                    <span className="font-medium text-gray-700">{formData.REORDER_LEVEL || 0}</span>
                  </div>
                  {formData.MORE_DETAIL && (
                    <div className="flex justify-between text-xs col-span-2 pt-1 border-t border-gray-200">
                      <span className="text-gray-500">More Detail</span>
                      <span className="font-medium text-gray-700 truncate max-w-[150px]">{formData.MORE_DETAIL}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-blue-600">
                    <span className="font-semibold">Tip:</span> All fields are being previewed in real-time as you type.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-3 flex justify-end gap-2.5 bg-white sticky bottom-0">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={loading}
              className="h-9 px-5 text-sm font-medium rounded-xs border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading} 
              className="h-9 px-5 text-sm font-medium rounded-xs bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                editingItem ? 'Update Item' : 'Create Item'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddItemModal;