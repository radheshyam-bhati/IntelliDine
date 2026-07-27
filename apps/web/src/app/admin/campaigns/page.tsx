'use client'

import { useState, useEffect } from 'react'
import type { Campaign, Coupon } from '@kitchensync/shared'
import { get, post } from '@/lib/api'
import { PageSkeleton } from '@/components/LoadingSkeleton'

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showCouponForm, setShowCouponForm] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '',    type: 'email' as Campaign['type'], content: '',
    target_segment: 'all', scheduled_at: '', coupon_id: '',
  })
  const [couponForm, setCouponForm] = useState({
    code: '', description: '',    discount_type: 'percentage' as 'percentage' | 'fixed_amount',
    discount_value: 10, minimum_order: 0, usage_limit: 100,
    ends_at: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true)
        const [campRes, coupRes] = await Promise.all([
          get<Campaign[]>('/campaigns'),
          get<Coupon[]>('/coupons'),
        ])
        if (campRes.success && campRes.data) setCampaigns(campRes.data)
        if (coupRes.success && coupRes.data) setCoupons(coupRes.data)
      } finally { setLoading(false) }
    }
    fetch()
  }, [])

  const msg = (text: string, isError = false) => {
    if (isError) setError(text); else setSuccess(text)
    setTimeout(() => { setError(null); setSuccess(null) }, 3000)
  }

  const handleCreateCampaign = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    const res = await post<Campaign>('/campaigns', {
      ...form,
      scheduled_at: form.scheduled_at || null,
      coupon_id: form.coupon_id || null,
    })
    if (res.success && res.data) {
      setCampaigns(prev => [res.data!, ...prev])
      msg('Campaign created')
      setShowForm(false)
    } else { setError(res.error || 'Failed to create') }
  }

  const handleCreateCoupon = async () => {
    if (!couponForm.code.trim()) { setError('Code is required'); return }
    const res = await post<Coupon>('/coupons', {
      ...couponForm,
      minimum_order: couponForm.minimum_order || null,
      ends_at: couponForm.ends_at || null,
    })
    if (res.success && res.data) {
      setCoupons(prev => [...prev, res.data!])
      msg('Coupon created')
      setShowCouponForm(false)
    } else { setError(res.error || 'Failed to create') }
  }

  const handleLaunch = async (id: string) => {
    const res = await post(`/campaigns/${id}/launch`, {})
    if (res.success) {
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'active' as const } : c))
      msg('Campaign launched!')
    } else { setError(res.error || 'Failed to launch') }
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    scheduled: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
    completed: 'bg-purple-100 text-purple-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  if (loading) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Marketing & Campaigns</h1>
        <div className="flex gap-2">
          <button onClick={() => { setShowCouponForm(!showCouponForm); setShowForm(false) }}
            className="min-touch rounded-md border border-gray-300 text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-50">
            {showCouponForm ? 'Cancel' : 'New Coupon'}
          </button>
          <button onClick={() => { setShowForm(!showForm); setShowCouponForm(false) }}
            className="min-touch rounded-md bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700">
            {showForm ? 'Cancel' : 'New Campaign'}
          </button>
        </div>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">{success}</div>}

      {showCouponForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Coupon Code *</label>
              <input type="text" value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:border-amber-500 outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select value={couponForm.discount_type}                  onChange={e => setCouponForm({ ...couponForm, discount_type: e.target.value as 'percentage' | 'fixed_amount' })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden">
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Value</label>
              <input type="number" value={couponForm.discount_value} onChange={e => setCouponForm({ ...couponForm, discount_value: Number(e.target.value) })} min={0} step="0.01"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Min Order ($)</label>
              <input type="number" value={couponForm.minimum_order} onChange={e => setCouponForm({ ...couponForm, minimum_order: Number(e.target.value) })} min={0} step="0.01"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Usage Limit</label>
              <input type="number" value={couponForm.usage_limit} onChange={e => setCouponForm({ ...couponForm, usage_limit: Number(e.target.value) })} min={1}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Expires</label>
              <input type="date" value={couponForm.ends_at} onChange={e => setCouponForm({ ...couponForm, ends_at: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden" />
            </div>
          </div>
          <button onClick={handleCreateCoupon}
            className="w-full rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800">Create Coupon</button>
        </div>
      )}

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Campaign Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Channel</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as Campaign['type'] })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden">
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="push">Push Notification</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="coupon">Coupon</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Target Segment</label>
              <select value={form.target_segment} onChange={e => setForm({ ...form, target_segment: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden">
                <option value="all">All Customers</option>
                <option value="repeat">Repeat Customers</option>
                <option value="vip">VIP (High Spenders)</option>
                <option value="at_risk">At Risk (Inactive)</option>
                <option value="new">New Customers</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Schedule (optional)</label>
              <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Linked Coupon</label>
              <select value={form.coupon_id} onChange={e => setForm({ ...form, coupon_id: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden">
                <option value="">None</option>
                {coupons.filter(c => c.is_active).map(c => (
                  <option key={c.id} value={c.id}>{c.code} ({c.discount_value}{c.discount_type === 'percentage' ? '%' : '$'} off)</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Message Content</label>
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={3}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden"
                placeholder="Write your campaign message here..." />
            </div>
          </div>
          <button onClick={handleCreateCampaign}
            className="w-full rounded-md bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700">Create Campaign</button>
        </div>
      )}

      {coupons.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Active Coupons ({coupons.filter(c => c.is_active).length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {coupons.filter(c => c.is_active).map(coupon => (
              <div key={coupon.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-bold text-amber-700">{coupon.code}</code>
                  <span className={`text-xs font-medium ${coupon.discount_type === 'percentage' ? 'text-green-600' : 'text-blue-600'}`}>
                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `$${coupon.discount_value} OFF`}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{coupon.used_count}/{coupon.usage_limit || '∞'} used</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Campaigns ({campaigns.length})</h2>
        {campaigns.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No campaigns created yet</p>
        ) : (
          <div className="space-y-3">
            {campaigns.map(campaign => (
              <div key={campaign.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[campaign.status] || 'bg-gray-100'}`}>
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{campaign.type} · {campaign.target_segment || 'all'}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    {campaign.stats_sent > 0 && (
                      <div className="text-right">
                        <p className="text-xs font-medium text-gray-900">{campaign.stats_sent} sent</p>
                        <p className="text-[10px] text-gray-400">{campaign.stats_opened} opened · {campaign.stats_converted} conv.</p>
                      </div>
                    )}
                    {campaign.status === 'draft' && (
                      <button onClick={() => handleLaunch(campaign.id)}
                        className="min-touch rounded-md bg-green-600 text-white px-3 py-1 text-xs font-medium hover:bg-green-700">Launch</button>
                    )}
                  </div>
                </div>
                {campaign.content && (
                  <p className="mt-2 text-xs text-gray-600 line-clamp-2">{campaign.content}</p>
                )}
                {campaign.scheduled_at && (
                  <p className="mt-1 text-[10px] text-gray-400">Scheduled: {new Date(campaign.scheduled_at).toLocaleString()}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
