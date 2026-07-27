'use client'

import { useState, useEffect } from 'react'
import type { ShiftDefinition, ShiftAssignment, User, UserRole } from '@kitchensync/shared'
import { get, post, put } from '@/lib/api'
import { PageSkeleton } from '@/components/LoadingSkeleton'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function AdminShiftsPage() {
  const [definitions, setDefinitions] = useState<ShiftDefinition[]>([])
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([])
  const [staff, setStaff] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().slice(0, 10))
  const [showDefForm, setShowDefForm] = useState(false)
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [defForm, setDefForm] = useState({ name: '', day_of_week: 1, start_time: '09:00', end_time: '17:00', min_staff: 1, max_staff: 3 })
  const [assignForm, setAssignForm] = useState({ shift_definition_id: '', user_id: '', start_time: '09:00', end_time: '17:00' })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true)
        const [defRes, assignRes, staffRes] = await Promise.all([
          get<ShiftDefinition[]>('/shifts/definitions'),
          get<ShiftAssignment[]>(`/shifts/assignments?date=${selectedDay}`),
          get<User[]>('/users/staff'),
        ])
        if (defRes.success && defRes.data) setDefinitions(defRes.data)
        if (assignRes.success && assignRes.data) setAssignments(assignRes.data)
        if (staffRes.success && staffRes.data) setStaff(staffRes.data)
      } finally { setLoading(false) }
    }
    fetch()
  }, [selectedDay])

  const msg = (text: string, isError = false) => {
    if (isError) setError(text); else setSuccess(text)
    setTimeout(() => { setError(null); setSuccess(null) }, 3000)
  }

  const handleCreateDef = async () => {
    if (!defForm.name.trim()) { setError('Name is required'); return }
    const res = await post<ShiftDefinition>('/shifts/definitions', defForm)
    if (res.success && res.data) {
      setDefinitions(prev => [...prev, res.data!])
      msg('Shift definition created')
      setShowDefForm(false)
    } else { setError(res.error || 'Failed to create') }
  }

  const handleCreateAssignment = async () => {
    if (!assignForm.shift_definition_id || !assignForm.user_id) { setError('All fields required'); return }
    const res = await post<ShiftAssignment>('/shifts/assignments', {
      ...assignForm,
      date: selectedDay,
    })
    if (res.success && res.data) {
      setAssignments(prev => [...prev, res.data!])
      msg('Assignment created')
      setShowAssignForm(false)
    } else { setError(res.error || 'Failed to create') }
  }

  const handleUpdateStatus = async (id: string, status: ShiftAssignment['status']) => {
    const res = await put(`/shifts/assignments/${id}`, { status })
    if (res.success) {
      setAssignments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    } else { setError(res.error || 'Failed to update') }
  }

  if (loading) return <PageSkeleton />

  const dayDefs = definitions.filter(d => d.day_of_week === new Date(selectedDay).getDay())
  const dayName = DAYS[new Date(selectedDay).getDay()]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Shift Scheduling</h1>
        <div className="flex gap-2">
          <button onClick={() => { setShowDefForm(!showDefForm); setShowAssignForm(false) }}
            className="min-touch rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800">
            {showDefForm ? 'Cancel' : 'Add Shift Template'}
          </button>
          <button onClick={() => { setShowAssignForm(!showAssignForm); setShowDefForm(false) }}
            className="min-touch rounded-md bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700">
            {showAssignForm ? 'Cancel' : 'Assign Staff'}
          </button>
        </div>
      </div>

      <div>
        <input type="date" value={selectedDay} onChange={e => setSelectedDay(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden" />
        <span className="ml-2 text-sm text-gray-500">{dayName}</span>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">{success}</div>}

      {showDefForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Shift Name</label>
              <input type="text" value={defForm.name} onChange={e => setDefForm({ ...defForm, name: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Day of Week</label>
              <select value={defForm.day_of_week} onChange={e => setDefForm({ ...defForm, day_of_week: Number(e.target.value) })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden">
                {DAYS.map((day, i) => <option key={i} value={i}>{day}</option>)}
              </select>
            </div>
            <div />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
              <input type="time" value={defForm.start_time} onChange={e => setDefForm({ ...defForm, start_time: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
              <input type="time" value={defForm.end_time} onChange={e => setDefForm({ ...defForm, end_time: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Min Staff</label>
              <input type="number" value={defForm.min_staff} onChange={e => setDefForm({ ...defForm, min_staff: Number(e.target.value) })} min={1}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Max Staff</label>
              <input type="number" value={defForm.max_staff} onChange={e => setDefForm({ ...defForm, max_staff: Number(e.target.value) })} min={1}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden" />
            </div>
          </div>
          <button onClick={handleCreateDef}
            className="w-full rounded-md bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700">Create Template</button>
        </div>
      )}

      {showAssignForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Shift Template</label>
              <select value={assignForm.shift_definition_id} onChange={e => setAssignForm({ ...assignForm, shift_definition_id: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden">
                <option value="">Select...</option>
                {definitions.filter(d => d.day_of_week === new Date(selectedDay).getDay()).map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.start_time}-{d.end_time})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Staff Member</label>
              <select value={assignForm.user_id} onChange={e => setAssignForm({ ...assignForm, user_id: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden">
                <option value="">Select...</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.full_name || s.email} ({s.role})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start</label>
              <input type="time" value={assignForm.start_time} onChange={e => setAssignForm({ ...assignForm, start_time: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End</label>
              <input type="time" value={assignForm.end_time} onChange={e => setAssignForm({ ...assignForm, end_time: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-hidden" />
            </div>
          </div>
          <button onClick={handleCreateAssignment}
            className="w-full rounded-md bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700">Assign Staff</button>
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Schedule for {dayName}, {selectedDay}</h2>
        {dayDefs.length > 0 && (
          <div className="mb-4 space-y-1">
            <p className="text-xs text-gray-500 font-medium">Available Shifts Today:</p>
            {dayDefs.map(d => (
              <div key={d.id} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded px-3 py-1.5">
                <span className="font-medium">{d.name}</span>
                <span>{d.start_time} - {d.end_time}</span>
                <span className="text-gray-400">{d.min_staff}-{d.max_staff} staff needed</span>
              </div>
            ))}
          </div>
        )}

        {assignments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No assignments for this date</p>
        ) : (
          <div className="space-y-2">
            {assignments.map(a => {
              const person = staff.find(s => s.id === a.user_id)
              return (
                <div key={a.id} className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{person?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{a.start_time} - {a.end_time} · {person?.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={a.status} onChange={e => handleUpdateStatus(a.id, e.target.value as ShiftAssignment['status'])}
                        className={`rounded-md px-2 py-1 text-xs font-medium border ${
                          a.status === 'completed' ? 'border-green-200 bg-green-50 text-green-700'
                          : a.status === 'absent' ? 'border-red-200 bg-red-50 text-red-700'
                          : a.status === 'in_progress' ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-gray-50 text-gray-700'
                        }`}>
                        <option value="scheduled">Scheduled</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="absent">Absent</option>
                      </select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">All Shift Templates</h2>
        {definitions.length === 0 ? (
          <p className="text-xs text-gray-400">No templates defined</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {definitions.map(d => (
              <div key={d.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-sm font-medium text-gray-900">{d.name}</p>
                <p className="text-xs text-gray-500">{DAYS[d.day_of_week]} · {d.start_time}-{d.end_time}</p>
                <p className="text-xs text-gray-400">{d.min_staff}-{d.max_staff} staff</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
