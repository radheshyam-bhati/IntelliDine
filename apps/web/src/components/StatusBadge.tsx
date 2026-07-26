import type { OrderStatus } from '@kitchensync/shared'

const statusConfig: Record<
  OrderStatus,
  { bg: string; text: string; label: string }
> = {
  placed: { bg: 'bg-neutral', text: 'text-white', label: 'Placed' },
  received: { bg: 'bg-blue-500', text: 'text-white', label: 'Received' },
  cooking: { bg: 'bg-warning', text: 'text-white', label: 'Cooking' },
  ready: { bg: 'bg-ready', text: 'text-white', label: 'Ready' },
  served: { bg: 'bg-blue-300', text: 'text-gray-800', label: 'Served' },
  completed: { bg: 'bg-green-300', text: 'text-gray-800', label: 'Completed' },
  cancelled: { bg: 'bg-alert', text: 'text-white', label: 'Cancelled' },
}

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status]
  if (!config) return null

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${config.text} ${className}`}
      aria-label={`Status: ${config.label}`}
    >
      {config.label}
    </span>
  )
}
