'use client'

import React from 'react'

export function DashboardCard({
  title,
  children,
  className = '',
  headerAction,
}: {
  title: string
  children: React.ReactNode
  className?: string
  headerAction?: React.ReactNode
}) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] overflow-hidden transition-shadow duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)] ${className}`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100/80">
        <h3 className="text-sm font-semibold text-gray-900 tracking-tight">{title}</h3>
        {headerAction}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

export function StatCard({
  label,
  value,
  subValue,
  icon,
  trend,
  color = 'default',
  className = '',
}: {
  label: string
  value: string | number
  subValue?: string
  icon: React.ReactNode
  trend?: { value: number; direction: 'up' | 'down' | 'neutral'; label?: string }
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}) {
  const colorMap = {
    default: 'bg-gray-50 text-gray-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-red-600',
    info: 'bg-blue-50 text-blue-600',
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)] transition-all duration-200 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1.5 truncate tracking-tight">{value}</p>
          {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`inline-flex items-center text-xs font-semibold ${
                trend.direction === 'up' ? 'text-emerald-600' : trend.direction === 'down' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {trend.direction === 'up' && '↑'}
                {trend.direction === 'down' && '↓'}
                {trend.direction === 'neutral' && '→'}
                {Math.abs(trend.value)}%
              </span>
              {trend.label && <span className="text-xs text-gray-400">{trend.label}</span>}
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export function MiniBar({ value, max, color = 'bg-amber-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function StatusDot({ status, pulse = false }: { status: 'healthy' | 'warning' | 'offline'; pulse?: boolean }) {
  const colorMap = { healthy: 'bg-emerald-500', warning: 'bg-amber-500', offline: 'bg-red-500' }
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      {pulse && status === 'healthy' && (
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${colorMap[status]}`} />
      )}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${colorMap[status]}`} />
    </span>
  )
}

export function ActivityIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    order: '📋',
    kitchen: '👨‍🍳',
    table: '🪑',
    billing: '💳',
    inventory: '📦',
    reservation: '📅',
    staff: '👤',
    notification: '🔔',
    menu: '🍽️',
    queue: '⏳',
    system: '⚙️',
  }
  return <span className="text-sm leading-none">{icons[type] || '📌'}</span>
}

export function TimeGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export function CurrentTime() {
  const [time, setTime] = React.useState('')
  const [date, setDate] = React.useState('')

  React.useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="text-right">
      <p className="text-sm font-medium text-white/90">{date}</p>
      <p className="text-xs text-white/60 font-mono mt-0.5">{time}</p>
    </div>
  )
}

export function ShiftBadge() {
  const hour = new Date().getHours()
  let shift = 'Morning'
  let shiftColor = 'bg-white/15 text-white/90'
  if (hour >= 11 && hour < 16) {
    shift = 'Lunch'
    shiftColor = 'bg-amber-400/20 text-amber-200'
  } else if (hour >= 16 && hour < 22) {
    shift = 'Dinner'
    shiftColor = 'bg-orange-400/20 text-orange-200'
  } else if (hour >= 22 || hour < 5) {
    shift = 'Late Night'
    shiftColor = 'bg-purple-400/20 text-purple-200'
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${shiftColor} backdrop-blur-sm`}>
      {shift} Shift
    </span>
  )
}

export function SkeletonPulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200/80 rounded-2xl ${className}`} />
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyCard({ message = 'No data available' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-sm text-gray-400 font-medium">{message}</p>
    </div>
  )
}

export function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50',
    warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/50',
    danger: 'bg-red-50 text-red-700 ring-1 ring-red-200/50',
    info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/50',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${variants[variant]}`}>
      {children}
    </span>
  )
}

export function ProgressRing({
  value,
  max = 100,
  size = 48,
  strokeWidth = 4,
  color = '#D97706',
}: {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const offset = circumference - pct * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F3F4F6" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  )
}

export function TableDetailModal({
  table,
  onClose,
}: {
  table: { id: string; label: string; capacity: number; status: string; section: string | null }
  onClose: () => void
}) {
  if (!table) return null
  const statusConfig: Record<string, { color: string; label: string; description: string }> = {
    empty: { color: 'text-emerald-600', label: 'Available', description: 'Table is ready for guests' },
    seated: { color: 'text-blue-600', label: 'Occupied', description: 'Guests are seated' },
    ordered: { color: 'text-blue-600', label: 'Ordered', description: 'Order placed, awaiting food' },
    reserved: { color: 'text-amber-600', label: 'Reserved', description: 'Table reserved for upcoming guest' },
    needs_bill: { color: 'text-orange-600', label: 'Needs Bill', description: 'Guests ready to pay' },
    needs_cleaning: { color: 'text-red-600', label: 'Needs Cleaning', description: 'Table requires cleaning' },
  }
  const config = statusConfig[table.status] || statusConfig.empty

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm p-6 mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Table {table.label}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Status</span>
            <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Capacity</span>
            <span className="text-sm font-semibold text-gray-900">{table.capacity} seats</span>
          </div>
          {table.section && (
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Section</span>
              <span className="text-sm font-semibold text-gray-900">{table.section}</span>
            </div>
          )}
          <div className="py-2">
            <p className="text-xs text-gray-400">{config.description}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
            View Orders
          </button>
          <button className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
            Manage
          </button>
        </div>
      </div>
    </div>
  )
}
