interface EmptyStateProps {
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">{title}</p>
      {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-3 text-sm text-amber-700 underline hover:text-amber-800"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
