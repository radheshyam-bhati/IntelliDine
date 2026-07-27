'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface QueueStatus {
  position: number
  total_ahead: number
  estimated_wait_minutes: number
  status: 'waiting' | 'notified' | 'seated' | 'cancelled'
  entryId?: string
}

export default function QueuePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [step, setStep] = useState<'form' | 'waiting' | 'notified' | 'seated'>('form')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [partySize, setPartySize] = useState(2)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null)
  const [entryId, setEntryId] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())

  // Live timer for wait estimate
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, []) // Cleanup: clear live timer on unmount

  // Poll for queue status updates (Socket.IO requires auth for rooms)
  useEffect(() => {
    if (!entryId) return

    const poll = setInterval(async () => {
      try {
        const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
        const res = await fetch(`${api}/queue/entry/${entryId}`)
        const data = await res.json()
        if (data.success && data.data) {
          if (data.data.status === 'notified') setStep('notified')
          if (data.data.status === 'seated') setStep('seated')
          if (data.data.status === 'cancelled') setStep('form') // Restart if cancelled
        }
      } catch {}
    }, 15000) // Poll every 15 seconds

    return () => clearInterval(poll)
  }, [entryId])

  const handleJoinQueue = async () => {
    if (!name.trim() || !phone.trim()) return
    setSubmitting(true)
    setError(null)

    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      const res = await fetch(`${api}/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: slug,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          partySize: partySize,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setEntryId(data.data.id)
        setQueueStatus({
          position: data.data.position ?? 1,
          total_ahead: data.data.total_ahead ?? 0,
          estimated_wait_minutes: data.data.estimated_wait_minutes || 5,
          status: 'waiting',
          entryId: data.data.id,
        })
        setStep('waiting')
      } else {
        setError(data.error || 'Failed to join queue')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'waiting' && queueStatus) {
    return (
      <div className="px-4 py-16 text-center min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-sm mx-auto">
          <div className="text-5xl mb-6">&#9200;</div>
          <h1 className="font-serif text-3xl text-gray-900 mb-2">You&apos;re in Line</h1>
          <p className="text-gray-500 mb-8">We&apos;ll notify you when your table is ready</p>

          <div className="bg-white rounded-lg border border-amber-200 p-6 mb-8">
            <div className="text-5xl font-bold text-amber-600 mb-1">
              ~{queueStatus.estimated_wait_minutes}
            </div>
            <p className="text-sm text-gray-500">Estimated wait (minutes)</p>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Your position</span>
                <span className="font-semibold text-gray-900">
                  {queueStatus.position} of {queueStatus.total_ahead + 1}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.max(5, (1 / (queueStatus.total_ahead + 1)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-400">
              Party of {partySize} &middot; {name}
            </div>
          </div>



          <Link
            href={`/menu/${slug}`}
            className="text-sm text-amber-700 underline hover:text-amber-800"
          >
            Browse menu while you wait
          </Link>
        </div>
      </div>
    )
  }

  if (step === 'notified' || step === 'seated') {
    return (
      <div className="px-4 py-16 text-center min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-sm mx-auto">
          <div className={`text-5xl mb-6 ${step === 'seated' ? '' : 'animate-bounce'}`}>
            {step === 'seated' ? '🍽️' : '🔔'}
          </div>
          <h1 className="font-serif text-3xl text-gray-900 mb-2">
            {step === 'seated' ? 'Enjoy Your Meal!' : 'Table Ready!'}
          </h1>
          <p className="text-gray-500 mb-4">
            {step === 'seated'
              ? 'You\'ve been seated. Enjoy your dining experience!'
              : 'Your table is ready. Please proceed to the host stand.'}
          </p>
          <Link
            href={`/menu/${slug}`}
            className="inline-block rounded-md bg-amber-600 text-white px-6 py-3 text-sm font-medium hover:bg-amber-700"
          >
            View Menu
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-8 max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">&#9200;</div>
        <h1 className="font-serif text-3xl text-gray-900 mb-1">
          Join the Waitlist
        </h1>
        <p className="text-sm text-gray-500">
          Add your name to the queue and we&apos;ll notify you when your table is ready
        </p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); handleJoinQueue() }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="For notification"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
          />
        </div>

        <div>
          <label htmlFor="partySize" className="block text-sm font-medium text-gray-700 mb-1">
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

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-amber-600 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Joining...' : 'Join Waitlist'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href={`/menu/${slug}`}
          className="text-sm text-gray-500 underline hover:text-gray-700"
        >
          Browse menu instead
        </Link>
      </div>
    </div>
  )
}
