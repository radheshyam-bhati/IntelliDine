import React from 'react'
import { Users, UserCheck, IndianRupee, CalendarCheck, Gift, Star, TrendingUp } from 'lucide-react'

export function CustomerKPIGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
      
      {/* Card 1: Customers */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500">Customers</p>
            <h3 className="text-2xl font-bold text-gray-900">2,145</h3>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-gray-50 pt-4 mt-2">
          <div className="text-center">
            <p className="text-[10px] text-gray-400 font-medium uppercase">Active</p>
            <p className="font-semibold text-gray-700 text-sm">1,820</p>
          </div>
          <div className="text-center border-l border-gray-50">
            <p className="text-[10px] text-gray-400 font-medium uppercase">Inactive</p>
            <p className="font-semibold text-gray-700 text-sm">325</p>
          </div>
          <div className="text-center border-l border-gray-50">
            <p className="text-[10px] text-gray-400 font-medium uppercase">New</p>
            <p className="font-semibold text-emerald-600 text-sm">+18</p>
          </div>
        </div>
      </div>

      {/* Card 2: Customer Types */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500">Types</p>
            <h3 className="text-2xl font-bold text-gray-900">Segments</h3>
          </div>
        </div>
        <div className="flex justify-between items-center border-t border-gray-50 pt-4 mt-2">
          <div className="flex flex-col items-center"><span className="text-[10px] text-gray-400 uppercase">Reg</span><span className="text-xs font-semibold text-gray-700">850</span></div>
          <div className="flex flex-col items-center"><span className="text-[10px] text-gray-400 uppercase">VIP</span><span className="text-xs font-semibold text-blue-600">128</span></div>
          <div className="flex flex-col items-center"><span className="text-[10px] text-gray-400 uppercase">1st</span><span className="text-xs font-semibold text-gray-700">210</span></div>
          <div className="flex flex-col items-center"><span className="text-[10px] text-gray-400 uppercase">Ret</span><span className="text-xs font-semibold text-gray-700">910</span></div>
          <div className="flex flex-col items-center"><span className="text-[10px] text-gray-400 uppercase">Corp</span><span className="text-xs font-semibold text-gray-700">47</span></div>
        </div>
      </div>

      {/* Card 3: Revenue */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500">Customer LTV</p>
            <h3 className="text-2xl font-bold text-gray-900">₹84.5K</h3>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-2">
          <div className="flex flex-col">
             <span className="text-[10px] text-gray-400 font-medium uppercase">Avg Spend</span>
             <span className="text-xs text-gray-700 font-semibold mt-0.5">₹1,280</span>
          </div>
          <div className="flex flex-col border-l border-gray-50 pl-4">
             <span className="text-[10px] text-gray-400 font-medium uppercase">Revenue/mo</span>
             <span className="text-xs text-gray-700 font-semibold mt-0.5">₹4.2M</span>
          </div>
          <div className="flex flex-col border-l border-gray-50 pl-4">
             <span className="text-[10px] text-gray-400 font-medium uppercase">Top Spender</span>
             <span className="text-xs text-emerald-600 font-semibold mt-0.5">₹412K</span>
          </div>
        </div>
      </div>

      {/* Card 4: Reservations */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500">Reservations</p>
            <h3 className="text-2xl font-bold text-gray-900">142</h3>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1 border-t border-gray-50 pt-4 mt-2">
          <div className="text-center">
            <p className="text-[10px] text-gray-400 font-medium uppercase">Upcm</p>
            <p className="font-semibold text-blue-600 text-sm">34</p>
          </div>
          <div className="text-center border-l border-gray-50">
            <p className="text-[10px] text-gray-400 font-medium uppercase">Comp</p>
            <p className="font-semibold text-emerald-600 text-sm">98</p>
          </div>
          <div className="text-center border-l border-gray-50">
            <p className="text-[10px] text-gray-400 font-medium uppercase">Canc</p>
            <p className="font-semibold text-gray-500 text-sm">8</p>
          </div>
          <div className="text-center border-l border-gray-50">
            <p className="text-[10px] text-gray-400 font-medium uppercase">NoSh</p>
            <p className="font-semibold text-red-600 text-sm">2</p>
          </div>
        </div>
      </div>

      {/* Card 5: Loyalty */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-pink-50 text-pink-600 rounded-xl group-hover:scale-110 transition-transform">
            <Gift className="w-5 h-5" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500">Loyalty Members</p>
            <h3 className="text-2xl font-bold text-gray-900">1,240</h3>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-gray-50 pt-4 mt-2">
          <div className="text-center">
            <p className="text-[10px] text-gray-400 font-medium uppercase">Redeemed</p>
            <p className="font-semibold text-gray-700 text-sm">45K pts</p>
          </div>
          <div className="text-center border-l border-gray-50">
            <p className="text-[10px] text-gray-400 font-medium uppercase">Issued</p>
            <p className="font-semibold text-emerald-600 text-sm">82K pts</p>
          </div>
          <div className="text-center border-l border-gray-50">
            <p className="text-[10px] text-gray-400 font-medium uppercase">Rate</p>
            <p className="font-semibold text-blue-600 text-sm">54%</p>
          </div>
        </div>
      </div>

      {/* Card 6: Satisfaction */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
            <Star className="w-5 h-5 fill-amber-500" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500">Avg Rating</p>
            <h3 className="text-2xl font-bold text-gray-900">4.8</h3>
          </div>
        </div>
        <div className="flex justify-between border-t border-gray-50 pt-4 mt-2">
          <div className="flex flex-col w-1/3">
             <span className="text-[10px] text-gray-400 font-medium uppercase">Total</span>
             <span className="text-xs text-gray-700 font-semibold mt-0.5">842 revs</span>
          </div>
          <div className="flex flex-col w-1/3 border-l border-gray-50 pl-4">
             <span className="text-[10px] text-gray-400 font-medium uppercase">Positive</span>
             <span className="text-xs text-emerald-600 font-semibold mt-0.5">92%</span>
          </div>
          <div className="flex flex-col w-1/3 border-l border-gray-50 pl-4">
             <span className="text-[10px] text-gray-400 font-medium uppercase">Negative</span>
             <span className="text-xs text-red-500 font-semibold mt-0.5">3%</span>
          </div>
        </div>
      </div>

    </div>
  )
}
