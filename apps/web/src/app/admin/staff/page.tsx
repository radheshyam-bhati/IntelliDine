'use client'

import { useState, useEffect, type FormEvent } from 'react'
import type { User, UserRole } from '@kitchensync/shared'
import { get, post } from '@/lib/api'
import { PageSkeleton } from '@/components/LoadingSkeleton'
import EmptyState from '@/components/EmptyState'

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('server')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const res = await get<User[]>('/users/staff')
        if (res.success && res.data) setStaff(res.data)
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

  const handleAddStaff = async (e: FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim()) return
    setError(null)
    const res = await post<User>('/users/invite', {
      fullName: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
    })
    if (res.success && res.data) {
      setStaff((prev) => [...prev, res.data!])
      setNewName('')
      setNewEmail('')
      setNewRole('server')
      setShowAdd(false)
      showSuccess('Staff member added')
    } else {
      setError(res.error || 'Failed to add staff')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="min-touch rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800"
        >
          {showAdd ? 'Cancel' : 'Add Staff'}
        </button>
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

      {showAdd && (
        <form onSubmit={handleAddStaff} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
            >
              <option value="server">Server</option>
              <option value="kitchen">Kitchen</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800"
          >
            Invite Staff
          </button>
        </form>
      )}

      {staff.length === 0 ? (
        <p className="text-sm text-gray-400">No staff members</p>
      ) : (
        <div className="space-y-2">
          {staff.map((member) => (
            <div
              key={member.id}
              className="rounded-lg border border-gray-200 bg-white p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {member.full_name}
                </p>
                <p className="text-xs text-gray-500">{member.phone || 'No phone'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    member.role === 'manager'
                      ? 'bg-purple-100 text-purple-700'
                      : member.role === 'kitchen'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {member.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
