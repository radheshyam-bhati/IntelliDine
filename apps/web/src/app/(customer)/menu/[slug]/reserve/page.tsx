'use client'

import { useState, type FormEvent } from 'react'
import { useParams } from 'next/navigation'

export default function ReservePage() {
  const params = useParams()
  const slug = params.slug as string

  const [partySize, setPartySize] = useState(2)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState<{
    id: string
    reservedFor: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/reservations`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantSlug: slug,
            customerName: name,
            customerPhone: phone,
            partySize,
            reservedFor: `${date}T${time}:00`,
          }),
        }
      )
      const data = await res.json()
      if (data.success) {
        setConfirmation({
          id: data.data.id,
          reservedFor: `${date} at ${time}`,
        })
      } else {
        setError(data.error || 'Failed to create reservation')
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create reservation'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmation) {
    return (
      <div className="px-4 py-16 text-center">
        <div className="bg-white rounded-lg border border-amber-200 p-8 max-w-sm mx-auto">
          <div className="text-4xl mb-4">&#10003;</div>
          <h1 className="font-serif text-2xl text-gray-900 mb-2">
            Reservation Confirmed
          </h1>
          <p className="text-gray-600 mb-1">Confirmation #{confirmation.id.slice(0, 8)}</p>
          <p className="text-gray-600">{confirmation.reservedFor}</p>
          <p className="text-gray-500 text-sm mt-4">Party of {partySize}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-8 max-w-md mx-auto">
      <h1 className="font-serif text-3xl text-gray-900 mb-6">
        Make a Reservation
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
          />
        </div>

        <div>
          <label
            htmlFor="partySize"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Party Size
          </label>
          <select
            id="partySize"
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1} {i === 0 ? 'Guest' : 'Guests'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Date
          </label>
          <input
            id="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
          />
        </div>

        <div>
          <label
            htmlFor="time"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Time
          </label>
          <input
            id="time"
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-amber-600 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Reserving...' : 'Confirm Reservation'}
        </button>
      </form>
    </div>
  )
}
