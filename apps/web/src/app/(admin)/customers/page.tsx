'use client'

import { useState, useEffect, useRef } from 'react'
import { get } from '@/lib/api'

interface CustomerRecord {
  id: string
  name: string
  phone: string | null
  type: 'registered'
  total_orders: number
  total_spent: number
  last_visit: string | null
  first_visit: string | null
  is_repeat: boolean
  recent_orders: { id: string; status: string; date: string }[]
}

interface CustomersResponse {
  customers: CustomerRecord[]
  total: number
  total_revenue: number
  avg_orders_per_customer: number
  repeat_customers: number
}

export default function AdminCustomersPage() {
  const [data, setData] = useState<CustomersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search input to avoid excessive API calls
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [search])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const params = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ''
        const res = await get<CustomersResponse>(`/admin/customers${params}`)
        if (res.success && res.data) setData(res.data)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [debouncedSearch])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading customer data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Customer Records</h1>
      </div>

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Customers</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{data.total}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              ${data.total_revenue.toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Repeat Customers</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {data.repeat_customers}
              <span className="text-sm font-normal text-gray-500 ml-1">
                / {data.total} ({data.total > 0 ? Math.round((data.repeat_customers / data.total) * 100) : 0}%)
              </span>
            </p>
          </div>
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers by name or phone..."
          className="block w-full rounded-md border border-gray-300 px-3 py-2 pl-10 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
          &#128269;
        </span>
      </div>

      {!data || data.customers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {search ? 'No customers match your search' : 'No customer data yet'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {search ? 'Try a different search term' : 'Customers will appear once orders are placed'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.customers.map((customer) => (
            <div
              key={customer.id}
              className="rounded-lg border border-gray-200 bg-white overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedCustomer(
                    expandedCustomer === customer.id ? null : customer.id
                  )
                }
                className="w-full text-left p-4 hover:bg-gray-50 transition-colors focus:outline-hidden"
                aria-expanded={expandedCustomer === customer.id}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {customer.name}
                        </p>
                        {customer.is_repeat && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                            Repeat
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {customer.phone || 'No phone'} &middot;{' '}
                        {customer.total_orders} order{customer.total_orders !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm font-bold text-gray-900">
                      ${customer.total_spent.toFixed(2)}
                    </p>
                    {customer.last_visit && (
                      <p className="text-[10px] text-gray-400">
                        Last:{' '}
                        {new Date(customer.last_visit).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </button>

              {expandedCustomer === customer.id && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Recent Orders
                  </h4>
                  {customer.recent_orders.length === 0 ? (
                    <p className="text-xs text-gray-400">No orders yet</p>
                  ) : (
                    <div className="space-y-1">
                      {customer.recent_orders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between text-xs text-gray-600"
                        >
                          <span className="font-mono text-gray-400">
                            #{order.id.slice(0, 8)}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                              order.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : order.status === 'cancelled'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {order.status}
                          </span>
                          <span className="text-gray-400">
                            {new Date(order.date).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {customer.first_visit && customer.last_visit && (
                    <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between text-[10px] text-gray-400">
                      <span>First visit: {new Date(customer.first_visit).toLocaleDateString()}</span>
                      <span>
                        {Math.max(
                          1,
                          Math.ceil(
                            (new Date(customer.last_visit).getTime() -
                              new Date(customer.first_visit).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        )}{' '}
                        day span
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data && data.customers.length > 0 && (
        <div className="text-center text-xs text-gray-400">
          Showing {data.customers.length} customer{data.customers.length !== 1 ? 's' : ''}
          {search ? ` matching "${search}"` : ''}
        </div>
      )}
    </div>
  )
}
