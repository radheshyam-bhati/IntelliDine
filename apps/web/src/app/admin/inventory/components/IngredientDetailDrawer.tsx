import React from 'react'
import { X, Edit2, Archive, Trash2, ArrowRightLeft, History, AlertCircle, ShoppingCart } from 'lucide-react'

interface IngredientDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function IngredientDetailDrawer({ isOpen, onClose }: IngredientDetailDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
              <span className="text-xl font-bold text-gray-300">RT</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Roma Tomatoes</h2>
              <p className="text-sm text-gray-500 font-medium">SKU: VEG-TOM-001</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Vegetables</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold uppercase tracking-wide border border-emerald-200">Healthy</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Available</span>
              <span className="text-xl font-bold text-gray-900">10.5<span className="text-xs font-medium text-gray-500 ml-1">kg</span></span>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Reserved</span>
              <span className="text-xl font-bold text-gray-900">2.0<span className="text-xs font-medium text-gray-500 ml-1">kg</span></span>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Avg Cost</span>
              <span className="text-xl font-bold text-gray-900">₹45</span>
            </div>
          </div>

          {/* Storage & Expiry */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Storage & Details</h3>
            <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-100 shadow-sm">
              <div className="flex items-center justify-between p-3">
                <span className="text-sm text-gray-500">Location</span>
                <span className="text-sm font-medium text-gray-900">Refrigerator 2, Shelf B</span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="text-sm text-gray-500">Storage Temp</span>
                <span className="text-sm font-medium text-gray-900">2°C - 4°C</span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="text-sm text-gray-500">Shelf Life</span>
                <span className="text-sm font-medium text-gray-900">7 Days</span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="text-sm text-gray-500">Expiring In</span>
                <span className="text-sm font-medium text-orange-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/> 3 Days (2.5 kg)</span>
              </div>
            </div>
          </div>

          {/* Supplier Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Supplier Information</h3>
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-sm">FreshFarms Suppliers</p>
                <p className="text-xs text-gray-500 mt-0.5">Last ordered: 2 days ago</p>
              </div>
              <button className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">View Profile</button>
            </div>
          </div>

          {/* Linked Menu Items */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Linked Menu Items</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700">Caprese Salad</span>
              <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700">Margherita Pizza</span>
              <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700">Tomato Soup</span>
              <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700">+4 more</span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-wrap gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
            <ArrowRightLeft className="w-4 h-4" />
            Adjust Stock
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <ShoppingCart className="w-4 h-4" />
            Order More
          </button>
          
          <div className="w-full flex gap-2 mt-2">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors">
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors">
              <History className="w-3.5 h-3.5" /> History
            </button>
            <button className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </>
  )
}
