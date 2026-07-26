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
      className={`relative rounded-lg border bg-white transition-all duration-200 ${
        expanded
          ? 'border-amber-300 shadow-md'
          : 'border-gray-100 hover:border-amber-200 hover:shadow-sm'
      } ${!item.is_available ? 'opacity-60' : ''}`}
    >
      <button
        onClick={onToggleExpand}
        className="w-full text-left focus:outline-hidden"
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-4 p-4">
          <div className="flex-1 min-w-0">
            {/* Item name in editorial serif */}
            <h3
              className={`font-serif text-lg leading-tight ${
                item.is_available
                  ? 'text-gray-900'
                  : 'text-gray-400'
              }`}
            >
              {item.name}
            </h3>

            {/* One-line description as subtle flavor note */}
            <p
              className={`mt-0.5 text-sm ${
                item.is_available ? 'text-gray-500' : 'text-gray-400'
              } ${!expanded ? 'truncate' : ''}`}
            >
              {item.description || '—'}
            </p>

            {/* Dietary tags inline, like a print menu */}
            {item.dietary_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {item.dietary_tags.map((tag, idx) => (
                  <span
                    key={tag}
                    className={`inline-block text-[10px] uppercase tracking-wider font-medium ${
                      item.is_available
                        ? 'text-amber-700'
                        : 'text-gray-400'
                    }`}
                  >
                    {tag}
                    {idx < item.dietary_tags.length - 1 && (
                      <span className="text-amber-300 ml-1">&#183;</span>
                    )}
                  </span>
                ))}
              </div>
            )}

            {/* Temporarily out label — not strike-through, muted text */}
            {!item.is_available && (
              <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="4" y1="6" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Temporarily out
              </span>
            )}
          </div>

          {/* Price — aligned right, elegant weight */}
          <span
            className={`text-base font-serif font-semibold whitespace-nowrap ${
              item.is_available ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            ${item.price.toFixed(2)}
          </span>
        </div>
      </button>

      {/* Expanded detail — slide-down with max-height transition */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4">
          <div className="h-px bg-amber-100 mb-3" />

          {/* Full description */}
          {item.description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              {item.description}
            </p>
          )}

          {item.is_available ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddToCart()
              }}
              className="min-touch inline-flex items-center gap-2 rounded-md bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700 active:bg-amber-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-amber-400"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Add to Order
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 text-xs text-amber-600 font-medium">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="4" y1="6" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              This item is temporarily unavailable — check back soon
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
