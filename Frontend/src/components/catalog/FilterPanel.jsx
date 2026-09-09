import { useEffect, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { cn } from '../../lib/utils.js'
import { Button } from '../ui/Button.jsx'
import { Input } from '../ui/Input.jsx'
import { Skeleton } from '../ui/Skeleton.jsx'

function CategoryList({ categories, loading, value, onSelect }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (!categories?.length) {
    return <p className="text-sm text-muted-foreground">No categories yet.</p>
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => onSelect('')}
        className={cn(
          'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
          value === ''
            ? 'bg-primary font-medium text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        )}
      >
        All categories
      </button>
      {categories.map((category) => (
        <button
          key={category._id}
          onClick={() => onSelect(category._id)}
          className={cn(
            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors',
            value === category._id
              ? 'bg-primary font-medium text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          <span className="line-clamp-1">{category.name}</span>
        </button>
      ))}
    </div>
  )
}

function FilterBody({
  categories,
  categoriesLoading,
  category,
  onCategory,
  minPrice,
  maxPrice,
  onPrice,
  inStock,
  onInStock,
  onClear,
  onClose,
}) {
  const [minDraft, setMinDraft] = useState(minPrice || '')
  const [maxDraft, setMaxDraft] = useState(maxPrice || '')

  // Keep drafts in sync when filters change from elsewhere (e.g. URL reset)
  useEffect(() => {
    setMinDraft(minPrice || '')
    setMaxDraft(maxPrice || '')
  }, [minPrice, maxPrice])

  const applyPrice = () => {
    onPrice(minDraft.trim(), maxDraft.trim())
    onClose?.()
  }

  const hasFilters = category !== '' || minPrice || maxPrice || inStock

  return (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Category
        </h3>
        <CategoryList
          categories={categories}
          loading={categoriesLoading}
          value={category}
          onSelect={(id) => {
            onCategory(id)
            onClose?.()
          }}
        />
      </div>

      {/* Price */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Price (₹)
        </h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            placeholder="Min"
            value={minDraft}
            onChange={(event) => setMinDraft(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && applyPrice()}
            aria-label="Minimum price"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            min="0"
            placeholder="Max"
            value={maxDraft}
            onChange={(event) => setMaxDraft(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && applyPrice()}
            aria-label="Maximum price"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={applyPrice}>
            Apply
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => {
              setMinDraft('')
              setMaxDraft('')
              onPrice('', '')
              onClose?.()
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Availability
        </h3>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(event) => {
              onInStock(event.target.checked)
              onClose?.()
            }}
            className="size-4 rounded border-border accent-primary"
          />
          In stock only
        </label>
      </div>

      {hasFilters && (
        <button
          onClick={onClear}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}

// Desktop: sticky sidebar. Mobile: collapsible block toggled by the toolbar.
export function FilterPanel({
  open = false,
  className,
  onClose,
  ...filterProps
}) {
  if (open) {
    return (
      <div className={cn('rounded-2xl border border-border bg-card p-5 shadow-card', className)}>
        <FilterBody onClose={onClose} {...filterProps} />
      </div>
    )
  }
  return (
    <aside className={cn('hidden lg:block', className)}>
      <div className="sticky top-24 rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <SlidersHorizontal className="size-4 text-primary" /> Filters
          </h2>
        </div>
        <FilterBody {...filterProps} />
      </div>
    </aside>
  )
}
