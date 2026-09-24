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
    return <p className="text-sm text-slate-500">No categories yet.</p>
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => onSelect('')}
        className={cn(
          'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
          value === ''
            ? 'bg-violet-600 font-medium text-white'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
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
              ? 'bg-violet-600 font-medium text-white'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
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
        <h3 className="mb-3 text-sm font-semibold tracking-wider text-slate-500 uppercase">
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
        <h3 className="mb-3 text-sm font-semibold tracking-wider text-slate-500 uppercase">
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
          <span className="text-slate-400">–</span>
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
        <h3 className="mb-3 text-sm font-semibold tracking-wider text-slate-500 uppercase">
          Availability
        </h3>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-900">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(event) => {
              onInStock(event.target.checked)
              onClose?.()
            }}
            className="size-4 rounded border-slate-300 accent-violet-600"
          />
          In stock only
        </label>
      </div>

      {hasFilters && (
        <button
          onClick={onClear}
          className="text-sm font-medium text-violet-600 underline-offset-4 hover:underline"
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
      <div className={cn('rounded-2xl border border-slate-200 bg-white p-5 shadow-sm', className)}>
        <FilterBody onClose={onClose} {...filterProps} />
      </div>
    )
  }
  return (
    <aside className={cn('hidden lg:block', className)}>
      <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <SlidersHorizontal className="size-4 text-violet-600" /> Filters
          </h2>
        </div>
        <FilterBody {...filterProps} />
      </div>
    </aside>
  )
}
