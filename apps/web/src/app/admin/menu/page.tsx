'use client'

import { useState, useEffect, type FormEvent } from 'react'
import type { MenuCategory, MenuItem } from '@kitchensync/shared'
import { get, post, patch, del } from '@/lib/api'
import { PageSkeleton } from '@/components/LoadingSkeleton'

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category_id: '',
    dietary_tags: [],
  })
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [catRes, itemRes] = await Promise.all([
          get<MenuCategory[]>('/menu-categories'),
          get<MenuItem[]>('/menu-items'),
        ])
        if (catRes.success && catRes.data) setCategories(catRes.data)
        if (itemRes.success && itemRes.data) setItems(itemRes.data)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    setError(null)
    const res = await post<MenuCategory>('/menu-categories', {
      name: newCategoryName.trim(),
    })
    if (res.success && res.data) {
      setCategories((prev) => [...prev, res.data!])
      setNewCategoryName('')
      setShowAddCategory(false)
      showSuccess('Category added')
    } else {
      setError(res.error || 'Failed to add category')
    }
  }

  const handleAddItem = async (e: FormEvent) => {
    e.preventDefault()
    if (!newItem.name || !newItem.category_id) return
    setError(null)
    const res = await post<MenuItem>('/menu-items', {
      name: newItem.name,
      description: newItem.description || '',
      price: newItem.price || 0,
      category_id: newItem.category_id,
    })
    if (res.success && res.data) {
      setItems((prev) => [...prev, res.data!])
      setNewItem({ name: '', description: '', price: 0, category_id: '', dietary_tags: [] })
      setShowAddItem(false)
      showSuccess('Menu item created')
    } else {
      setError(res.error || 'Failed to create menu item')
    }
  }

  const handleToggleAvailability = async (item: MenuItem) => {
    setError(null)
    const res = await patch(`/menu-items/${item.id}`, {
      is_available: !item.is_available,
      is_manual_override: true,
    })
    if (res.success) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, is_available: !i.is_available, is_manual_override: true }
            : i
        )
      )
      showSuccess(
        `${item.name} ${item.is_available ? 'disabled' : 'enabled'}`
      )
    } else {
      setError(res.error || 'Failed to update item')
    }
  }

  const handleSaveItem = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    setError(null)
    const res = await patch(`/menu-items/${editingItem.id}`, {
      name: editingItem.name,
      description: editingItem.description,
      price: editingItem.price,
      category_id: editingItem.category_id,
      dietary_tags: editingItem.dietary_tags,
    })
    if (res.success) {
      setItems((prev) =>
        prev.map((i) => (i.id === editingItem.id ? editingItem : i))
      )
      setEditingItem(null)
      showSuccess('Item updated')
    } else {
      setError(res.error || 'Failed to update item')
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    setError(null)
    const res = await del(`/menu-items/${itemId}`)
    if (res.success) {
      setItems((prev) => prev.filter((i) => i.id !== itemId))
      showSuccess('Item deleted')
    } else {
      setError(res.error || 'Failed to delete item')
    }
  }

  if (loading) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => {
            setShowAddItem(!showAddItem)
            setShowAddCategory(false)
          }}
          className={`min-touch rounded-md px-4 py-2 text-sm font-medium ${
            showAddItem
              ? 'bg-gray-100 text-gray-600'
              : 'bg-amber-600 text-white hover:bg-amber-700'
          }`}
        >
          {showAddItem ? 'Cancel' : 'Add Item'}
        </button>
        <button
          onClick={() => setShowAddCategory(!showAddCategory)}
          className={`min-touch rounded-md px-4 py-2 text-sm font-medium ${
            showAddCategory
              ? 'bg-gray-100 text-gray-600'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {showAddCategory ? 'Cancel' : 'Add Category'}
        </button>
      </div>

      {showAddCategory && (
        <form onSubmit={handleAddCategory} className="flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category name"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
            autoFocus
          />
          <button
            type="submit"
            className="min-touch rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800"
          >
            Save
          </button>
        </form>
      )}

      {showAddItem && (
        <form onSubmit={handleAddItem} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Item Name</label>
              <input
                type="text"
                value={newItem.name || ''}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newItem.description || ''}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                rows={2}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Price ($)</label>
              <input
                type="number"
                value={newItem.price || ''}
                onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                required
                min="0"
                step="0.01"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select
                value={newItem.category_id || ''}
                onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })}
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700"
          >
            Create Menu Item
          </button>
        </form>
      )}

      <div className="space-y-8">
        {categories.map((category) => (
          <section key={category.id}>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              {category.name}
            </h2>
            {items.filter((i) => i.category_id === category.id).length ===
            0 ? (
              <p className="text-xs text-gray-400">No items</p>
            ) : (
              <div className="space-y-2">
                {items
                  .filter((i) => i.category_id === category.id)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-gray-200 bg-white p-3"
                    >
                      {editingItem?.id === item.id ? (
                        <form onSubmit={handleSaveItem} className="space-y-2">
                          <input
                            type="text"
                            value={editingItem.name}
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                name: e.target.value,
                              })
                            }
                            className="block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                          <textarea
                            value={editingItem.description}
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                description: e.target.value,
                              })
                            }
                            className="block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                            rows={2}
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editingItem.price}
                              onChange={(e) =>
                                setEditingItem({
                                  ...editingItem,
                                  price: Number(e.target.value),
                                })
                              }
                              step="0.01"
                              className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
                            />
                            <select
                              value={editingItem.category_id}
                              onChange={(e) =>
                                setEditingItem({
                                  ...editingItem,
                                  category_id: e.target.value,
                                })
                              }
                              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                            >
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="min-touch rounded-md bg-green-600 text-white px-3 py-1 text-xs font-medium hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingItem(null)}
                              className="min-touch rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium ${
                                item.is_available
                                  ? 'text-gray-900'
                                  : 'text-gray-400 line-through'
                              }`}
                            >
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleAvailability(item)}
                              className={`min-touch rounded-md px-3 py-1 text-xs font-medium ${
                                item.is_available
                                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {item.is_available ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => setEditingItem({ ...item })}
                              className="min-touch rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="min-touch rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
