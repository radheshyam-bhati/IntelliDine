'use client'

import React from 'react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts'
import { TrendingUp, TrendingDown, Activity, Trash2 } from 'lucide-react'

// Mock Data
const consumptionData = [
  { name: 'Mon', tomatoes: 12, cheese: 8, beef: 15 },
  { name: 'Tue', tomatoes: 15, cheese: 10, beef: 12 },
  { name: 'Wed', tomatoes: 18, cheese: 12, beef: 18 },
  { name: 'Thu', tomatoes: 14, cheese: 9, beef: 14 },
  { name: 'Fri', tomatoes: 22, cheese: 15, beef: 25 },
  { name: 'Sat', tomatoes: 28, cheese: 20, beef: 35 },
  { name: 'Sun', tomatoes: 25, cheese: 18, beef: 30 },
]

const wasteData = [
  { name: 'Spoilage', value: 45 },
  { name: 'Cooking Error', value: 25 },
  { name: 'Expired', value: 20 },
  { name: 'Returned', value: 10 },
]

const COLORS = ['#ef4444', '#f59e0b', '#64748b', '#3b82f6']

export function AnalyticsCharts() {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Ingredient Analytics
        </h2>
        <p className="text-sm text-gray-500 mt-1">Consumption trends and waste tracking across all ingredients.</p>
      </div>

      {/* Primary Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Consumption Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Weekly Consumption</h3>
              <p className="text-xs text-gray-500">Top 3 moving ingredients (kg)</p>
            </div>
            <select className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 text-gray-700">
              <option>This Week</option>
              <option>Last Week</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={consumptionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTomatoes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCheese" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBeef" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                />
                <Area type="monotone" dataKey="beef" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorBeef)" />
                <Area type="monotone" dataKey="tomatoes" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorTomatoes)" />
                <Area type="monotone" dataKey="cheese" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorCheese)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Waste Breakdown Pie Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-500" /> Waste Breakdown
              </h3>
              <p className="text-xs text-gray-500">By category (%)</p>
            </div>
          </div>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wasteData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {wasteData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 500, color: '#0f172a' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Custom Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {wasteData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                <span className="text-xs text-gray-600 font-medium">{entry.name}</span>
                <span className="text-xs text-gray-400 ml-auto">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Fastest Moving</div>
          <p className="text-lg font-bold text-gray-900">Roma Tomatoes</p>
          <p className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-1"><TrendingUp className="w-3.5 h-3.5"/> +15% vs last week</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Slowest Moving</div>
          <p className="text-lg font-bold text-gray-900">Saffron Threads</p>
          <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1"><TrendingDown className="w-3.5 h-3.5"/> -8% vs last week</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Highest Waste Cost</div>
          <p className="text-lg font-bold text-gray-900">Fresh Basil</p>
          <p className="text-xs font-medium text-rose-600 mt-1">₹1,240 lost this week</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Turnover Rate</div>
          <p className="text-lg font-bold text-gray-900">4.2 Days</p>
          <p className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-1"><TrendingUp className="w-3.5 h-3.5"/> Improving</p>
        </div>
      </div>

    </div>
  )
}
