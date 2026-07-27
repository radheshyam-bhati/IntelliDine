import React from 'react'
import { Settings, Zap, ToggleRight, Search, Filter } from 'lucide-react'

// Mock Data for Live 86 Engine
const LIVE_86_DATA = [
  { id: '1', dish: 'Caprese Salad', ingredient: 'Mozzarella Cheese', current: '1.7 kg', threshold: '< 2.0 kg', status: 'Disabled', time: '2m ago', reason: 'Low Ingredient', orders: 12 },
  { id: '2', dish: 'Truffle Fries', ingredient: 'Truffle Oil', current: '0.5 L', threshold: '< 1.0 L', status: 'Disabled', time: '1h ago', reason: 'Critical Stock', orders: 45 },
  { id: '3', dish: 'Wagyu Burger', ingredient: 'Sourdough Buns', current: '0 pcs', threshold: '0 pcs', status: 'Disabled', time: '5m ago', reason: 'Out of Stock', orders: 32 },
  { id: '4', dish: 'Pesto Pasta', ingredient: 'Fresh Basil', current: '0.6 kg', threshold: '< 0.5 kg', status: 'Warning', time: 'Just now', reason: 'Approaching Threshold', orders: 0 },
]

export function Live86EngineView() {
  return (
    <div className="space-y-6">
      
      {/* Header section for this tab */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Live 86 Engine
          </h2>
          <p className="text-sm text-gray-500 mt-1">Dishes automatically affected by real-time inventory thresholds.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
            <Settings className="w-4 h-4" /> Rules & Settings
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Currently Auto-86'd</div>
          <div className="text-3xl font-bold text-red-600">3 <span className="text-sm font-normal text-gray-500">dishes</span></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">At Risk (Warning)</div>
          <div className="text-3xl font-bold text-orange-500">1 <span className="text-sm font-normal text-gray-500">dish</span></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Prevented Orders</div>
          <div className="text-3xl font-bold text-gray-900">89 <span className="text-sm font-normal text-gray-500">today</span></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-start">
           <div className="flex items-center justify-between w-full">
             <span className="text-sm font-medium text-gray-700">Engine Status</span>
             <ToggleRight className="w-8 h-8 text-emerald-500" />
           </div>
           <p className="text-xs text-gray-500 mt-1">Actively monitoring thresholds</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search affected dishes..." 
              className="pl-9 pr-4 py-2 w-64 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white">
              <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">Dish</th>
                <th className="px-6 py-4">Triggering Ingredient</th>
                <th className="px-6 py-4">Stock vs Threshold</th>
                <th className="px-6 py-4">Action Taken</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {LIVE_86_DATA.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900 text-sm">{item.dish}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.time} • Prev. {item.orders} orders</p>
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700 font-medium">{item.ingredient}</p>
                    <p className="text-[10px] text-gray-400">{item.reason}</p>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{item.current}</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-xs font-medium text-red-500">{item.threshold}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {item.status === 'Disabled' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                        Auto-Disabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                        Warning Sent
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        Override
                      </button>
                      <button className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                        Restock
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
