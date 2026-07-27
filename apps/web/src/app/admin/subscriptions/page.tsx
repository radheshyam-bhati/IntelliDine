'use client'

import { useState, useEffect } from 'react'
import type { SubscriptionPlan, RestaurantSubscription } from '@kitchensync/shared'
import { get, post, put } from '@/lib/api'
import { PageSkeleton } from '@/components/LoadingSkeleton'

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [activeSub, setActiveSub] = useState<RestaurantSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [planForm, setPlanForm] = useState<{
    name: string
    description: string
    price: number
    interval: 'monthly' | 'yearly'
    max_branches: number
    max_staff: number
    max_menu_items: number
    features: string
  }>({
    name: '',
    description: '',
    price: 0,
    interval: 'monthly',
    max_branches: 1,
    max_staff: 10,
    max_menu_items: 50,
    features: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true)
        const [planRes, subRes] = await Promise.all([
          get<SubscriptionPlan[]>('/subscriptions/plans'),
          get<RestaurantSubscription>('/subscriptions/active'),
        ])
        if (planRes.success && planRes.data) setPlans(planRes.data)
        if (subRes.success && subRes.data) setActiveSub(subRes.data)
      } finally { setLoading(false) }
    }
    fetch()
  }, [])

  const msg = (text: string, isError = false) => {
    if (isError) setError(text); else setSuccess(text)
    setTimeout(() => { setError(null); setSuccess(null) }, 3000)
  }

  const handleCreatePlan = async () => {
    if (!planForm.name.trim()) { setError('Name is required'); return }
    const features = planForm.features.split(',').map(f => f.trim()).filter(Boolean)
    const res = await post<SubscriptionPlan>('/subscriptions/plans', { ...planForm, price: Number(planForm.price), features })
    if (res.success && res.data) {
      setPlans(prev => [...prev, res.data!])
      msg('Plan created')
      setShowPlanForm(false)
    } else { setError(res.error || 'Failed to create plan') }
  }

  const handleSubscribe = async (planId: string) => {
    const res = await post<RestaurantSubscription>('/subscriptions/subscribe', { plan_id: planId })
    if (res.success && res.data) {
      setActiveSub(res.data)
      msg('Subscribed successfully!')
    } else { setError(res.error || 'Failed to subscribe') }
  }

  const handleCancel = async () => {
    if (!confirm('Cancel current subscription?')) return
    const res = await put('/subscriptions/cancel', {})
    if (res.success) {
      setActiveSub(null)
      msg('Subscription cancelled')
    } else { setError(res.error || 'Failed to cancel') }
  }

  const statusStyles: Record<string, string> = {
    active: 'bg-green-100 text-green-700 border-green-200',
    past_due: 'bg-red-100 text-red-700 border-red-200',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
    trial: 'bg-blue-100 text-blue-700 border-blue-200',
    expired: 'bg-amber-100 text-amber-700 border-amber-200',
  }

  if (loading) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <button onClick={() => setShowPlanForm(!showPlanForm)}
          className="min-touch rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800">
          {showPlanForm ? 'Cancel' : 'Create Plan'}
        </button>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">{success}</div>}

      {activeSub && (
        <div className={`rounded-lg border-2 p-4 ${statusStyles[activeSub.status] || ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Current Subscription</p>
              <p className="text-xs mt-1">
                {activeSub.status === 'active' ? 'Your subscription is active' :
                 activeSub.status === 'trial' ? 'Trial period' :
                 `Status: ${activeSub.status}`}
              </p>
              <p className="text-xs mt-0.5 text-gray-500">
                Period: {new Date(activeSub.current_period_start).toLocaleDateString()} - {new Date(activeSub.current_period_end).toLocaleDateString()}
              </p>
            </div>
            <button onClick={handleCancel}
              className="min-touch rounded-md border border-red-300 text-red-600 px-3 py-1 text-xs font-medium hover:bg-red-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {showPlanForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Plan Name</label>
              <input type="text" value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} rows={2}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Price ($)</label>
              <input type="number" value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: Number(e.target.value) })} min={0} step="0.01"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Interval</label>
              <select value={planForm.interval} onChange={e => setPlanForm({ ...planForm, interval: e.target.value as 'monthly' | 'yearly' })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden">
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Features (comma-separated)</label>
              <input type="text" value={planForm.features} onChange={e => setPlanForm({ ...planForm, features: e.target.value })}
                placeholder="Unlimited orders, Priority support, Analytics"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden" />
            </div>
          </div>
          <button onClick={handleCreatePlan}
            className="w-full rounded-md bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700">Create Plan</button>
        </div>
      )}

      {plans.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No subscription plans available</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan.id} className={`rounded-lg border-2 p-5 ${
              activeSub && plan.id === activeSub.plan_id ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'
            }`}>
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              {plan.description && <p className="text-xs text-gray-500 mt-1">{plan.description}</p>}
              <p className="text-2xl font-bold text-gray-900 mt-3">${Number(plan.price).toFixed(2)}<span className="text-sm font-normal text-gray-500">/{plan.interval}</span></p>
              {plan.features.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-center gap-1">
                      <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 text-xs text-gray-400 space-y-0.5">
                <p>{plan.max_branches} branches · {plan.max_staff} staff · {plan.max_menu_items} menu items</p>
              </div>
              {(!activeSub || plan.id !== activeSub.plan_id) && plan.is_active && (
                <button onClick={() => handleSubscribe(plan.id)}
                  className="mt-4 w-full rounded-md bg-gray-900 text-white px-3 py-2 text-sm font-medium hover:bg-gray-800 transition-colors">
                  Subscribe
                </button>
              )}
              {activeSub && plan.id === activeSub.plan_id && (
                <div className="mt-4 text-center text-xs font-medium text-amber-700">Current Plan</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
