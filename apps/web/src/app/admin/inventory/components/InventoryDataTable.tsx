import React, { useState } from 'react'
import { Search, Filter, MoreVertical, ChevronDown, Edit, Archive, Download, RefreshCw } from 'lucide-react'

// Mock Data
const INVENTORY_DATA = [
  { id: '1', name: 'Roma Tomatoes', category: 'Vegetables', sku: 'VEG-TOM-001', unit: 'kg', current: 12.5, min: 5, max: 20, reserved: 2, available: 10.5, supplier: 'FreshFarms', price: 45, updated: '2 hrs ago', expiry: '3 days', status: 'Healthy' },
  { id: '2', name: 'Mozzarella Cheese', category: 'Dairy', sku: 'DAI-MOZ-002', unit: 'kg', current: 3.2, min: 5, max: 15, reserved: 1.5, available: 1.7, supplier: 'DairyKing', price: 320, updated: '1 hr ago', expiry: '12 days', status: 'Low' },
  { id: '3', name: 'Truffle Oil', category: 'Pantry', sku: 'PAN-TRU-003', unit: 'L', current: 0.5, min: 2, max: 5, reserved: 0, available: 0.5, supplier: 'GourmetImports', price: 1200, updated: '1 day ago', expiry: '6 months', status: 'Critical' },
  { id: '4', name: 'Sourdough Buns', category: 'Bakery', sku: 'BAK-BUN-004', unit: 'pcs', current: 0, min: 50, max: 150, reserved: 0, available: 0, supplier: 'LocalBakes', price: 15, updated: '5 mins ago', expiry: 'Expired', status: 'Out of Stock' },
  { id: '5', name: 'Wagyu Beef Ribeye', category: 'Meat', sku: 'MEA-WAG-005', unit: 'kg', current: 8.5, min: 10, max: 25, reserved: 4, available: 4.5, supplier: 'PremiumMeats', price: 4500, updated: '4 hrs ago', expiry: '5 days', status: 'Low' },
  { id: '6', name: 'Fresh Basil', category: 'Herbs', sku: 'HER-BAS-006', unit: 'kg', current: 0.8, min: 0.5, max: 2, reserved: 0.2, available: 0.6, supplier: 'FreshFarms', price: 150, updated: '3 hrs ago', expiry: '2 days', status: 'Healthy' },
]

const STATUS_COLORS: Record<string, string> = {
  'Healthy': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Low': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Critical': 'bg-orange-100 text-orange-700 border-orange-200',
  'Out of Stock': 'bg-red-100 text-red-700 border-red-200',
  'Expired': 'bg-gray-100 text-gray-700 border-gray-200'
}

export function InventoryDataTable() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
      
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search ingredient, SKU, or supplier..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-64 md:w-80 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors text-sm font-medium shadow-sm">
            <Filter className="w-4 h-4" />
            Filters
            <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-[10px] ml-1">2</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors text-sm font-medium shadow-sm">
            Add Ingredient
          </button>
        </div>

      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto relative">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4 border-b border-gray-100">Ingredient</th>
              <th className="px-6 py-4 border-b border-gray-100">SKU / Category</th>
              <th className="px-6 py-4 border-b border-gray-100">Stock (Unit)</th>
              <th className="px-6 py-4 border-b border-gray-100">Available</th>
              <th className="px-6 py-4 border-b border-gray-100">Status</th>
              <th className="px-6 py-4 border-b border-gray-100">Supplier</th>
              <th className="px-6 py-4 border-b border-gray-100">Last Updated</th>
              <th className="px-6 py-4 border-b border-gray-100 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {INVENTORY_DATA.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                      {/* Placeholder for Image */}
                      <span className="text-xs font-bold text-gray-400">{item.name.substring(0,2).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.expiry}</p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900 font-medium">{item.sku}</p>
                  <p className="text-xs text-gray-500">{item.category}</p>
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">{item.current} <span className="text-gray-500 font-normal">{item.unit}</span></span>
                    <span className="text-[10px] text-gray-400">Min: {item.min} • Max: {item.max}</span>
                  </div>
                  {/* Mini progress bar for health */}
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${item.status === 'Healthy' ? 'bg-emerald-500' : item.status === 'Low' ? 'bg-yellow-500' : item.status === 'Critical' ? 'bg-orange-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, (item.current / item.max) * 100)}%` }}
                    ></div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{item.available} {item.unit}</p>
                  <p className="text-[10px] text-gray-400">{item.reserved} {item.unit} reserved</p>
                </td>

                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[item.status]}`}>
                    {item.status}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <p className="text-sm text-gray-700">{item.supplier}</p>
                  <p className="text-[10px] text-gray-400">₹{item.price}/{item.unit}</p>
                </td>

                <td className="px-6 py-4">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> {item.updated}
                  </p>
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Archive className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white text-sm">
        <p className="text-gray-500">Showing <span className="font-medium text-gray-900">1</span> to <span className="font-medium text-gray-900">6</span> of <span className="font-medium text-gray-900">324</span> results</p>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50">Previous</button>
          <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Next</button>
        </div>
      </div>
      
    </div>
  )
}
