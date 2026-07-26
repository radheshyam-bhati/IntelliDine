import type { MenuItem } from '@kitchensync/shared'

interface MenuItemCardProps {
  item: MenuItem
  onAddToCart: () => void
  expanded: boolean
  onToggleExpand: () => void
}

export default function MenuItemCard({
  item,
  onAddToCart,
  expanded,
  onToggleExpand,
}: MenuItemCardProps) {
  return (
    <div
      className={`rounded-lg border bg-white p-4 transition-opacity ${
        !item.is_available ? 'opacity-50' : 'hover:shadow-sm'
      }`}
    >
      <button
        onClick={onToggleExpand}
        className="w-full text-left focus:outline-hidden"
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900">{item.name}</h3>
            <p className="text-sm text-gray-500 truncate">{item.description}</p>
            {item.dietary_tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {item.dietary_tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <span className="text-base font-semibold text-gray-900 whitespace-nowrap">
            ${item.price.toFixed(2)}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600 mb-3">{item.description}</p>
          {item.is_available ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddToCart()
              }}
              className="min-touch rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
            >
              Add to Order
            </button>
          ) : (
            <span className="text-sm text-gray-400 italic">Currently unavailable</span>
          )}
        </div>
      )}

      {!item.is_available && !expanded && (
        <span className="text-xs text-gray-400">Unavailable</span>
      )}
    </div>
  )
}
