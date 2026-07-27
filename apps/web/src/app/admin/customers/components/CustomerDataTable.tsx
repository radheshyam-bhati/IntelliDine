import React, { useState } from 'react'
import { Search, Filter, MoreVertical, Download, ChevronRight } from 'lucide-react'

const CUSTOMERS = [
  { id: 'CUST-8091', name: 'Sarah Jenkins', email: 'sarah.j@example.com', phone: '+91 98765 43210', membership: 'Gold', orders: 42, spend: 54200, avgBill: 1290, lastVisit: '2 days ago', favCuisine: 'Italian', status: 'Active', tier: 'VIP' },
  { id: 'CUST-8092', name: 'Michael Ross', email: 'm.ross@example.com', phone: '+91 98765 43211', membership: 'Silver', orders: 12, spend: 15400, avgBill: 1283, lastVisit: '1 week ago', favCuisine: 'Continental', status: 'Active', tier: 'Regular' },
  { id: 'CUST-8093', name: 'Emily Chen', email: 'emily.c@example.com', phone: '+91 98765 43212', membership: 'Platinum', orders: 156, spend: 215000, avgBill: 1378, lastVisit: 'Yesterday', favCuisine: 'Japanese', status: 'Active', tier: 'VIP' },
  { id: 'CUST-8094', name: 'David Smith', email: 'd.smith@example.com', phone: '+91 98765 43213', membership: 'None', orders: 1, spend: 2400, avgBill: 2400, lastVisit: '3 months ago', favCuisine: 'Indian', status: 'Inactive', tier: 'Guest' },
  { id: 'CUST-8095', name: 'James Wilson', email: 'j.wilson@example.com', phone: '+91 98765 43214', membership: 'None', orders: 5, spend: 8500, avgBill: 1700, lastVisit: '6 months ago', favCuisine: 'Mexican', status: 'Blocked', tier: 'Guest' },
]

const STATUS_COLORS: Record<string, string> = {
  'Active': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Inactive': 'bg-gray-100 text-gray-700 border-gray-200',
  'Blocked': 'bg-red-100 text-red-700 border-red-200'
}

const TIER_COLORS: Record<string, string> = {
  'VIP': 'bg-blue-100 text-blue-700 border-blue-200',
  'Regular': 'bg-gray-100 text-gray-700 border-gray-200',
  'Guest': 'bg-amber-100 text-amber-700 border-amber-200'
}

interface CustomerDataTableProps {
  onRowClick?: (id: string) => void
}

export function CustomerDataTable({ onRowClick }: CustomerDataTableProps) {
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
              placeholder="Search by name, email, or ID..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-64 md:w-80 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors text-sm font-medium shadow-sm">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
            Add Customer
          </button>
        </div>

      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto relative">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4 border-b border-gray-100">Customer</th>
              <th className="px-6 py-4 border-b border-gray-100">Contact</th>
              <th className="px-6 py-4 border-b border-gray-100">Status & Tier</th>
              <th className="px-6 py-4 border-b border-gray-100">Orders</th>
              <th className="px-6 py-4 border-b border-gray-100">Total Spend</th>
              <th className="px-6 py-4 border-b border-gray-100">Last Visit</th>
              <th className="px-6 py-4 border-b border-gray-100 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {CUSTOMERS.map((cust) => (
              <tr 
                key={cust.id} 
                onClick={() => onRowClick?.(cust.id)}
                className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
              >
                
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white
                      ${cust.tier === 'VIP' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}
                    `}>
                      {cust.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{cust.name}</p>
                      <p className="text-xs text-gray-500">{cust.id}</p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900 font-medium">{cust.phone}</p>
                  <p className="text-xs text-gray-500">{cust.email}</p>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${STATUS_COLORS[cust.status]}`}>
                      {cust.status}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${TIER_COLORS[cust.tier]}`}>
                      {cust.tier}
                    </span>
                  </div>
                  {cust.membership !== 'None' && (
                    <p className="text-[10px] text-gray-500 mt-1">Loyalty: {cust.membership}</p>
                  )}
                </td>

                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-gray-900">{cust.orders}</p>
                  <p className="text-[10px] text-gray-400">Fav: {cust.favCuisine}</p>
                </td>

                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-900">₹{cust.spend.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">Avg: ₹{cust.avgBill}</p>
                </td>

                <td className="px-6 py-4">
                  <p className="text-sm text-gray-700">{cust.lastVisit}</p>
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                      Profile <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={(e) => { e.stopPropagation(); /* Options menu */ }}
                    >
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
        <p className="text-gray-500">Showing <span className="font-medium text-gray-900">1</span> to <span className="font-medium text-gray-900">5</span> of <span className="font-medium text-gray-900">2,145</span> customers</p>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50">Previous</button>
          <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Next</button>
        </div>
      </div>
      
    </div>
  )
}
