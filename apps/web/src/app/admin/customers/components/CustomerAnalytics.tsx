'use client'

import React from 'react'
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { TrendingUp, Users, Activity } from 'lucide-react'

// Mock Data
const revenueData = [
  { name: 'Jan', revenue: 42000, newCustomers: 120 },
  { name: 'Feb', revenue: 48000, newCustomers: 145 },
  { name: 'Mar', revenue: 51000, newCustomers: 156 },
  { name: 'Apr', revenue: 49000, newCustomers: 130 },
  { name: 'May', revenue: 58000, newCustomers: 180 },
  { name: 'Jun', revenue: 62000, newCustomers: 210 },
  { name: 'Jul', revenue: 68000, newCustomers: 240 },
]

const segmentData = [
  { name: 'Regular', value: 45 },
  { name: 'VIP', value: 25 },
  { name: 'New', value: 15 },
  { name: 'Occasional', value: 15 },
]

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']

export function CustomerAnalytics() {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Customer & Spending Analytics
        </h2>
        <p className="text-sm text-gray-500 mt-1">Deep dive into customer behavior, retention, and revenue generation.</p>
      </div>

      {/* Top Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Revenue/Growth Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Revenue & Customer Growth</h3>
              <p className="text-xs text-gray-500">Monthly trend</p>
            </div>
            <select className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 text-gray-700">
              <option>This Year</option>
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${val/1000}k`} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                  formatter={(value: any, name) => [name === 'revenue' ? `₹${value?.toLocaleString()}` : value, name === 'revenue' ? 'Revenue' : 'New Customers']}
                />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="newCustomers" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Segmentation Donut */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" /> Segmentation
              </h3>
              <p className="text-xs text-gray-500">Revenue by group</p>
            </div>
          </div>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {segmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 500, color: '#0f172a' }}
                  formatter={(value: any) => [`${value}%`, 'Share']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {segmentData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                <span className="text-xs text-gray-600 font-medium">{entry.name}</span>
                <span className="text-xs text-gray-400 ml-auto">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Avg Dining Freq</div>
          <p className="text-xl font-bold text-gray-900">1.8 <span className="text-sm font-medium text-gray-500">visits/mo</span></p>
          <p className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-1"><TrendingUp className="w-3.5 h-3.5"/> +0.2 vs last month</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Retention Rate</div>
          <p className="text-xl font-bold text-gray-900">76%</p>
          <p className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-1"><TrendingUp className="w-3.5 h-3.5"/> +4% YoY</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Peak Visit Days</div>
          <p className="text-xl font-bold text-gray-900">Friday, Saturday</p>
          <p className="text-xs font-medium text-gray-500 mt-1">74% of total volume</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Churn Risk</div>
          <p className="text-xl font-bold text-orange-500">8%</p>
          <p className="text-xs font-medium text-gray-500 mt-1">42 customers flagged</p>
        </div>
      </div>

    </div>
  )
}
