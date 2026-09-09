import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils.js'

// Build a compact window of page numbers: [1, …, lo…hi, …, total]
const pageWindow = (current, total) => {
  const pages = new Set([1, total])
  for (let p = current - 1; p <= current + 1; p += 1) {
    if (p > 1 && p < total) pages.add(p)
  }
  return [...pages].sort((a, b) => a - b)
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const items = pageWindow(page, totalPages)
  const navButton =
    'flex size-9 items-center justify-center rounded-lg border border-border text-sm font-medium transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40'

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5">
      <button
        className={navButton}
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </button>

      {items.map((item, index) => {
        const gap = index > 0 && item - items[index - 1] > 1
        return (
          <span key={item} className="flex items-center gap-1.5">
            {gap && <span className="px-1 text-sm text-muted-foreground">…</span>}
            <button
              className={cn(
                'size-9 rounded-lg border text-sm font-medium transition-colors',
                item === page
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border hover:bg-accent',
              )}
              onClick={() => onChange(item)}
              aria-current={item === page ? 'page' : undefined}
              aria-label={`Page ${item}`}
            >
              {item}
            </button>
          </span>
        )
      })}

      <button
        className={navButton}
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}
