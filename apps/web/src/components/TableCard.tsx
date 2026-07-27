import type { Table, TableStatus } from '@kitchensync/shared'

const statusColors: Record<TableStatus, string> = {
  empty: 'border-gray-300 bg-white text-gray-700',
  seated: 'border-blue-400 bg-blue-50 text-blue-800',
  ordered: 'border-amber-400 bg-amber-50 text-amber-800',
  needs_bill: 'border-orange-400 bg-orange-50 text-orange-800',
  needs_cleaning: 'border-red-400 bg-red-50 text-red-800',
  reserved: 'border-purple-400 bg-purple-50 text-purple-800',
}

const statusLabels: Record<TableStatus, string> = {
  empty: 'Empty',
  seated: 'Seated',
  ordered: 'Ordered',
  needs_bill: 'Needs Bill',
  needs_cleaning: 'Needs Cleaning',
  reserved: 'Reserved',
}

interface TableCardProps {
  table: Table
  activeOrderCount: number
  onClick: () => void
  className?: string
}

export default function TableCard({
  table,
  activeOrderCount,
  onClick,
  className = '',
}: TableCardProps) {
  return (
    <button
      onClick={onClick}
      className={`min-touch flex flex-col items-center justify-center rounded-lg border-2 p-4 text-center transition-shadow hover:shadow-md focus:outline-hidden focus:ring-2 focus:ring-blue-400 ${statusColors[table.status]} ${className}`}
      aria-label={`Table ${table.label}, ${statusLabels[table.status]}, ${activeOrderCount} active orders`}
    >
      <span className="text-lg font-bold">{table.label}</span>
      <span className="text-xs mt-1">{statusLabels[table.status]}</span>
      {activeOrderCount > 0 && (
        <span className="mt-1 inline-flex items-center justify-center bg-gray-900 text-white text-xs rounded-full w-5 h-5">
          {activeOrderCount}
        </span>
      )}
    </button>
  )
}
