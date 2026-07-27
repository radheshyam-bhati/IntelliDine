'use client'

import { useState, useEffect } from 'react'
import type { Supplier } from '@kitchensync/shared'
import { get, post, put, del } from '@/lib/api'
import { PageSkeleton } from '@/components/LoadingSkeleton'

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState({ name: '', contact_name: '', email: '', phone: '', payment_terms: '', lead_time_days: 7, notes: '' })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true)
        const res = await get<Supplier[]>('/suppliers')
        if (res.success && res.data) setSuppliers(res.data)
      } finally { setLoading(false) }
    }
    fetch()
  }, [])

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000) }

  const handleSubmit = async () => {
    setError(null)
    if (!form.name.trim()) { setError('Supplier name is required'); return }
    if (editing) {
      const res = await put(`/suppliers/${editing.id}`, form)
      if (res.success) {
        setSuppliers(prev => prev.map(s => s.id === editing.id ? { ...s, ...form } : s))
        showSuccess('Supplier updated')
        setShowForm(false); setEditing(null)
      } else { setError(res.error || 'Failed to update') }
    } else {
      const res = await post<Supplier>('/suppliers', form)
      if (res.success && res.data) {
        setSuppliers(prev => [...prev, res.data!])
        showSuccess('Supplier added')
        setShowForm(false)
      } else { setError(res.error || 'Failed to create') }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this supplier?')) return
    const res = await del(`/suppliers/${id}`)
    if (res.success) {
      setSuppliers(prev => prev.filter(s => s.id !== id))
      showSuccess('Supplier deleted')
    } else { setError(res.error || 'Failed to delete') }
  }

  const openEdit = (supplier: Supplier) => {
    setForm({ name: supplier.name, contact_name: supplier.contact_name || '', email: supplier.email || '', phone: supplier.phone || '', payment_terms: supplier.payment_terms || '', lead_time_days: supplier.lead_time_days || 7, notes: supplier.notes || '' })
    setEditing(supplier)
    setShowForm(true)
  }

  const openCreate = () => {
    setForm({ name: '', contact_name: '', email: '', phone: '', payment_terms: '', lead_time_days: 7, notes: '' })
    setEditing(null)
    setShowForm(true)
  }

  if (loading) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
        <button onClick={showForm && !editing ? () => setShowForm(false) : openCreate}
          className="min-touch rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800">
          {showForm && !editing ? 'Cancel' : 'Add Supplier'}
        </button>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">{success}</div>}

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Company Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contact Person</label>
              <input type="text" value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Terms</label>
              <input type="text" value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })} placeholder="Net 30"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Lead Time (days)</label>
              <input type="number" value={form.lead_time_days} onChange={e => setForm({ ...form, lead_time_days: Number(e.target.value) })} min={0}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden" />
            </div>
          </div>
          <button onClick={handleSubmit}
            className="w-full rounded-md bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700">
            {editing ? 'Update Supplier' : 'Add Supplier'}
          </button>
        </div>
      )}

      {suppliers.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">No suppliers configured</p>
      ) : (
        <div className="space-y-2">
          {suppliers.map(supplier => (
            <div key={supplier.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{supplier.name}</p>
                  <p className="text-xs text-gray-500">
                    {supplier.contact_name && `${supplier.contact_name} · `}
                    {supplier.email || supplier.phone || 'No contact info'}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  {supplier.payment_terms && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {supplier.payment_terms}
                    </span>
                  )}
                  {supplier.lead_time_days && (
                    <span className="text-xs text-gray-400">{supplier.lead_time_days}d lead</span>
                  )}
                  <button onClick={() => openEdit(supplier)}
                    className="min-touch rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">Edit</button>
                  <button onClick={() => handleDelete(supplier.id)}
                    className="min-touch rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50">Delete</button>
                </div>
              </div>
              {supplier.notes && <p className="mt-1 text-xs text-gray-400">{supplier.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
