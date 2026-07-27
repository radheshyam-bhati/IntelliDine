import React from 'react'
import { Layers, AlertTriangle, IndianRupee, ShoppingCart, Truck, Trash2, TrendingUp, TrendingDown } from 'lucide-react'

export function KPIGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      
      {/* Card 1: Total Ingredients */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500">Total Ingredients</p>
            <h3 className="text-2xl font-bold text-gray-900">324</h3>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-gray-50 pt-4 mt-2">
          <div className="text-center">
            <p className="text-[10px] text-gray-400 font-medium uppercase">Active</p>
            <p className="font-semibold text-gray-700 text-sm">312</p>
          </div>
          <div className="text-center border-l border-gray-50">
            <p className="text-[10px] text-gray-400 font-medium uppercase">Archived</p>
            <p className="font-semibold text-gray-700 text-sm">12</p>
          </div>
          <div className="text-center border-l border-gray-50">
            <p className="text-[10px] text-gray-400 font-medium uppercase">New</p>
            <p className="font-semibold text-emerald-600 text-sm">+8</p>
          </div>
        </div>
      </div>

      {/* Card 2: Stock Status */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500">Stock Status</p>
            <h3 className="text-2xl font-bold text-gray-900">Alerts</h3>
          </div>
        </div>
        <div className="flex justify-between items-center border-t border-gray-50 pt-4 mt-2">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span className="text-xs text-gray-600">218</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500"></span><span className="text-xs text-gray-600">14</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span><span className="text-xs text-gray-600">5</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400"></span><span className="text-xs text-gray-600">2</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-xs text-gray-600">2</span></div>
        </div>
      </div>

      {/* Card 3: Inventory Value */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500">Current Value</p>
            <h3 className="text-2xl font-bold text-gray-900">₹2.84L</h3>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-2">
          <div className="flex flex-col">
             <span className="text-[10px] text-gray-400 font-medium uppercase">Weekly</span>
             <span className="flex items-center text-xs text-emerald-600 font-semibold mt-0.5"><TrendingUp className="w-3 h-3 mr-1"/> 2.4%</span>
          </div>
          <div className="flex flex-col border-l border-gray-50 pl-4">
             <span className="text-[10px] text-gray-400 font-medium uppercase">Monthly</span>
             <span className="flex items-center text-xs text-red-600 font-semibold mt-0.5"><TrendingDown className="w-3 h-3 mr-1"/> 1.2%</span>
          </div>
          <div className="flex flex-col border-l border-gray-50 pl-4">
             <span className="text-[10px] text-gray-400 font-medium uppercase">Avg Cons</span>
             <span className="text-xs text-gray-700 font-semibold mt-0.5">₹12.4K/d</span>
          </div>
        </div>
      </div>

      {/* Card 4: Purchase Orders */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500">Active POs</p>
            <h3 className="text-2xl font-bold text-gray-900">18</h3>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1 border-t border-gray-50 pt-4 mt-2">
          <div className="text-center">
            <p className="text-[10px] text-gray-400 font-medium uppercase">Pend</p>
            <p className="font-semibold text-gray-700 text-sm">4</p>
          </div>
          <div className="text-center border-l border-gray-50">
            <p className="text-[10px] text-gray-400 font-medium uppercase">Appr</p>
            <p className="font-semibold text-blue-600 text-sm">8</p>
          </div>
          <div className="text-center border-l border-gray-50">
            <p className="text-[10px] text-gray-400 font-medium uppercase">Delv</p>
            <p className="font-semibold text-emerald-600 text-sm">5</p>
          </div>
          <div className="text-center border-l border-gray-50">
            <p className="text-[10px] text-gray-400 font-medium uppercase">Canc</p>
            <p className="font-semibold text-red-600 text-sm">1</p>
          </div>
        </div>
      </div>

      {/* Card 5: Suppliers */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl group-hover:scale-110 transition-transform">
            <Truck className="w-5 h-5" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500">Suppliers</p>
            <h3 className="text-2xl font-bold text-gray-900">24</h3>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-gray-50 pt-4 mt-2">
          <div className="text-center">
            <p className="text-[10px] text-gray-400 font-medium uppercase">Active</p>
            <p className="font-semibold text-gray-700 text-sm">18</p>
          </div>
          <div className="text-center border-l border-gray-50">
            <p className="text-[10px] text-gray-400 font-medium uppercase">Pref</p>
            <p className="font-semibold text-emerald-600 text-sm">5</p>
          </div>
          <div className="text-center border-l border-gray-50">
            <p className="text-[10px] text-gray-400 font-medium uppercase">Delayed</p>
            <p className="font-semibold text-orange-500 text-sm">2</p>
          </div>
        </div>
      </div>

      {/* Card 6: Waste */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500">Waste Cost (M)</p>
            <h3 className="text-2xl font-bold text-rose-600">₹8,420</h3>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-gray-50 pt-4 mt-2">
          <div className="flex flex-col">
             <span className="text-[10px] text-gray-400 font-medium uppercase">Today</span>
             <span className="text-xs text-gray-700 font-semibold mt-0.5">₹320 <span className="text-rose-500 ml-1">↑</span></span>
          </div>
          <div className="flex flex-col border-l border-gray-50 pl-4">
             <span className="text-[10px] text-gray-400 font-medium uppercase">Weekly</span>
             <span className="text-xs text-gray-700 font-semibold mt-0.5">₹1,850</span>
          </div>
        </div>
      </div>

    </div>
  )
}
