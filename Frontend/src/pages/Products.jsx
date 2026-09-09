import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ChevronRight, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { useFetch } from '../hooks/useFetch.js'
import { useToast } from '../components/ui/toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Select } from '../components/ui/Select.jsx'
import { Skeleton } from '../components/ui/Skeleton.jsx'
import { ProductGrid } from '../components/customer/ProductGrid.jsx'
import { FilterPanel } from '../components/catalog/FilterPanel.jsx'
import { Pagination } from '../components/catalog/Pagination.jsx'
import { AIBadge } from '../components/catalog/AIBadge.jsx'
import { ErrorState } from '../components/feedback/ErrorState.jsx'
import { Drawer } from '../components/feedback/Drawer.jsx'
import {
  addToCart,
  addToWishlist,
  aiSearchProducts,
  fetchCategories,
  fetchProducts,
  removeFromWishlist,
} from '../services/catalog.js'
import { fetchStore } from '../services/shop.js'
import { getErrorMessage } from '../services/api.js'
import { isPlaceholderImage } from '../lib/utils.js'
import api from '../services/api.js'

const PAGE_SIZE = 12

const SORTS = [
  { value: '', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'popular', label: 'Most popular' },
]

// Extra sort option only offered for AI (natural language) searches
const AI_SORT = { value: 'ai_relevance', label: 'Best AI match' }

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

export default function Products() {
  const { user } = useAuth()
  const { refreshCount } = useCart()
  const { toast } = useToast()
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const gridRef = useRef(null)

  // ---- Read state from the URL ---------------------------------------
  const query = searchParams.get('search') || ''
  const categoryParam = searchParams.get('category') || ''
  const storeParam = searchParams.get('store') || ''
  const sort = SORTS.some((option) => option.value === searchParams.get('sort'))
    ? searchParams.get('sort')
    : ''
  const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1)
  const minPrice = toNumber(searchParams.get('minPrice'))
  const maxPrice = toNumber(searchParams.get('maxPrice'))
  const inStock = searchParams.get('inStock') === 'true'

  const updateParams = (mutations) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(mutations)) {
      if (value === '' || value === null || value === undefined || value === false) next.delete(key)
      else next.set(key, String(value))
    }
    next.delete('page') // any filter/sort change restarts at page 1
    setSearchParams(next)
  }

  // ---- Store resolution (?store=<id> from a product's "View store") -----
  const storeState = useFetch(() => (storeParam ? fetchStore(storeParam) : null), [storeParam])
  const store = storeState.data

  // ---- Category resolution (id param or /category/:slug) --------------
  const categoriesState = useFetch(fetchCategories, [])
  const categories = categoriesState.data || []

  const categoryFromParam = useMemo(
    () => categories.find((category) => category._id === categoryParam) || null,
    [categories, categoryParam],
  )
  const categoryFromSlug = useMemo(
    () => (slug ? categories.find((category) => category.slug === slug) || null : null),
    [categories, slug],
  )

  const activeCategory = categoryFromSlug || categoryFromParam || null
  const categoriesLoaded = !categoriesState.loading
  const categoryMissing = Boolean(slug) && categoriesLoaded && !categoryFromSlug
  const categoryPending = Boolean(slug) && !categoriesLoaded

  // ---- Wishlist ids ----------------------------------------------------
  const [wishedIds, setWishedIds] = useState(new Set())
  const [wishlistLoaded, setWishlistLoaded] = useState(false)
  useEffect(() => {
    let cancelled = false
    if (user) {
      api
        .get('/wishlist-api/wishlist')
        .then(({ data }) => {
          if (!cancelled) setWishedIds(new Set(data.payload.products.map((p) => p._id.toString())))
        })
        .catch(() => {})
        .finally(() => !cancelled && setWishlistLoaded(true))
    } else {
      setWishedIds(new Set())
      setWishlistLoaded(true)
    }
    return () => {
      cancelled = true
    }
  }, [user])

  // ---- Products fetch (server-side filters/sort/pagination) ------------
  const readyToFetch = !categoryPending
  const fetchKey = useMemo(
    () =>
      !readyToFetch
        ? 'pending'
        : JSON.stringify({
            category: activeCategory?._id || categoryParam || '',
            store: storeParam,
            query,
            sort,
            page,
            minPrice,
            maxPrice,
            inStock,
          }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [readyToFetch, activeCategory?._id, categoryParam, storeParam, query, sort, page, minPrice, maxPrice, inStock],
  )

  // ---- AI search state (only when a plain text query is present) --------
  // Natural-language queries go through /ai-api/search, which returns up to
  // 25 semantically-ranked products. The mode flag tells the UI which
  // indicator to show ('semantic' = AI ranking, 'keyword' = fallback).
  const isAiSearch = Boolean(query) && !storeParam
  const [aiResult, setAiResult] = useState(null) // { mode, products }

  useEffect(() => {
    if (!isAiSearch) {
      setAiResult(null)
      return
    }
    let cancelled = false
    aiSearchProducts({ query, limit: 25 })
      .then((payload) => {
        // Both modes carry products (semantic = AI-ranked, keyword = fallback)
        if (!cancelled) setAiResult({ mode: payload.mode, products: payload.products || [] })
      })
      .catch(() => {
        // AI endpoint unreachable — fall back to the normal keyword listing
        if (!cancelled) setAiResult({ mode: 'keyword', products: null })
      })
    return () => {
      cancelled = true
    }
  }, [isAiSearch, query])

  const productsState = useFetch(
    () => {
      if (categoryPending || categoryMissing || !readyToFetch) {
        return Promise.resolve({ products: [], totalCount: 0, totalPages: 0 })
      }
      // While the AI search is still resolving, skip the keyword fetch to
      // avoid a flash of unranked results. If the AI endpoint failed
      // (products: null), the normal fetch below runs as fallback.
      if (isAiSearch && !aiResult) {
        return Promise.resolve({ products: [], totalCount: 0, totalPages: 0 })
      }
      if (Array.isArray(aiResult?.products)) {
        // AI results are already ranked client-side; just resolve the promise
        // shape the grid expects. Filtering (price/stock) happens below.
        return Promise.resolve({ products: aiResult.products, totalCount: aiResult.products.length, totalPages: 1 })
      }
      return fetchProducts({
        category: activeCategory?._id || categoryParam || undefined,
        store: storeParam || undefined,
        search: query || undefined,
        sort: sort || undefined,
        minPrice: minPrice ?? undefined,
        maxPrice: maxPrice ?? undefined,
        inStock: inStock ? 'true' : undefined,
        page,
        limit: PAGE_SIZE,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchKey, isAiSearch, aiResult?.mode, aiResult === null],
  )

  const payload = productsState.data || { products: [], totalCount: 0, totalPages: 1 }
  const totalPages = Math.max(1, payload.totalPages || 1)

  // ---- AI-mode derived values -------------------------------------------
  const aiSemantic = isAiSearch && aiResult?.mode === 'semantic'
  const aiActive = isAiSearch && Array.isArray(aiResult?.products)
  const aiLoading = isAiSearch && !aiResult

  // Sort options: AI searches get "Best AI match" first (default).
  const sortOptions = aiSemantic ? [AI_SORT, ...SORTS] : SORTS
  const effectiveSort = sort === 'ai_relevance' && !aiSemantic ? '' : sort

  // In AI mode, filters that the backend can't apply (price/stock/category)
  // are applied client-side to the ranked list, and non-AI sorts re-order it.
  const displayProducts = useMemo(() => {
    let list = payload.products || []
    if (!aiActive) return list

    if (minPrice !== null) list = list.filter((p) => Number(p.price) >= minPrice)
    if (maxPrice !== null) list = list.filter((p) => Number(p.price) <= maxPrice)
    if (inStock) list = list.filter((p) => p.stock > 0)
    if (categoryParam || activeCategory) {
      const categoryId = activeCategory?._id || categoryParam
      list = list.filter((p) => p.category?._id === categoryId || p.category === categoryId)
    }

    if (effectiveSort === 'price_asc') list = [...list].sort((a, b) => a.price - b.price)
    else if (effectiveSort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price)
    else if (effectiveSort === 'rating') list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0))
    else if (effectiveSort === 'popular') list = [...list].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
    // '' or 'ai_relevance' keeps the AI ranking order

    return list
  }, [payload.products, aiActive, minPrice, maxPrice, inStock, categoryParam, activeCategory, effectiveSort])

  // Scroll back to the grid when changing pages
  useEffect(() => {
    if (page > 1) {
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [page])

  // ---- Page title logic -------------------------------------------------
  const storeLoading = Boolean(storeParam) && storeState.loading
  const title = storeParam
    ? storeState.data?.storeName || 'Store products'
    : query
      ? `Results for “${query}”`
      : activeCategory
        ? activeCategory.name
        : 'All products'
  const description = storeState.data?.description || activeCategory?.description || undefined

  const searchIndicator = aiSemantic ? (
    <AIBadge animate>AI-ranked results for your description</AIBadge>
  ) : isAiSearch && !aiLoading ? (
    <AIBadge>Keyword search</AIBadge>
  ) : null

  // ---- Actions -----------------------------------------------------------
  const requireSignIn = () => {
    toast({ title: 'Sign in required', description: 'Create an account or sign in to continue.', variant: 'info' })
  }

  const handleAddToCart = async (product) => {
    if (!user) return requireSignIn()
    try {
      await addToCart(product._id)
      refreshCount()
      toast({ title: 'Added to cart', description: product.title, variant: 'success' })
    } catch (error) {
      toast({ title: 'Could not add item', description: getErrorMessage(error), variant: 'error' })
    }
  }

  const handleToggleWishlist = async (product) => {
    const id = product._id.toString()
    const currentlyWished = wishedIds.has(id)
    if (!user) return requireSignIn()

    setWishedIds((current) => {
      const next = new Set(current)
      if (currentlyWished) next.delete(id)
      else next.add(id)
      return next
    })
    try {
      if (currentlyWished) {
        await removeFromWishlist(id)
        toast({ title: 'Removed from wishlist', variant: 'info' })
      } else {
        await addToWishlist(id)
        toast({ title: 'Saved to wishlist ❤️', description: product.title, variant: 'success' })
      }
    } catch (error) {
      setWishedIds((current) => {
        const next = new Set(current)
        if (currentlyWished) next.add(id)
        else next.delete(id)
        return next
      })
      toast({ title: 'Something went wrong', description: getErrorMessage(error), variant: 'error' })
    }
  }

  const [searchDraft, setSearchDraft] = useState(query)
  useEffect(() => setSearchDraft(query), [query])

  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeFilterCount =
    (categoryParam ? 1 : 0) + (minPrice !== null || maxPrice !== null ? 1 : 0) + (inStock ? 1 : 0)

  const filterProps = {
    categories,
    categoriesLoading: categoriesState.loading,
    category: activeCategory?._id || categoryParam || '',
    onCategory: (id) => updateParams({ category: id }),
    minPrice: minPrice ?? '',
    maxPrice: maxPrice ?? '',
    onPrice: (min, max) =>
      updateParams({ minPrice: min || '', maxPrice: max || '' }),
    inStock,
    onInStock: (checked) => updateParams({ inStock: checked }),
    onClear: () => updateParams({ search: query, category: '', minPrice: '', maxPrice: '', inStock: '', sort: '' }),
  }

  /* --------------- Category not found / pending states ---------------- */
  if (categoryMissing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Category not found</h1>
        <p className="mt-2 text-muted-foreground">
          “{slug}” doesn't exist on ShopSphere yet.
        </p>
        <Link to="/products" className="mt-6 inline-block font-medium text-primary hover:underline">
          Browse all products →
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/" className="transition-colors hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" />
        {activeCategory ? (
          <>
            <Link to="/products" className="transition-colors hover:text-foreground">Products</Link>
            <ChevronRight className="size-3.5" />
            <span className="font-medium text-foreground">{activeCategory.name}</span>
          </>
        ) : (
          <span className="font-medium text-foreground">Products</span>
        )}
      </nav>

      {/* Store banner (?store= scope) */}
      {storeParam && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-brand-50 via-card to-fuchsia-50">
          {storeLoading ? (
            <div className="flex items-center gap-4 p-5">
              <Skeleton className="size-14 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-72 max-w-full" />
              </div>
            </div>
          ) : store ? (
            <div className="flex flex-wrap items-center gap-4 p-5">
              {!isPlaceholderImage(store.logo) ? (
                <img
                  src={store.logo}
                  alt=""
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                  }}
                  className="size-14 shrink-0 rounded-xl object-cover ring-1 ring-border"
                />
              ) : (
                <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl font-black text-primary">
                  {(store.storeName || 'S').charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Official store</p>
                <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{store.storeName}</h1>
                {store.description && (
                  <p className="mt-0.5 line-clamp-2 max-w-2xl text-sm text-muted-foreground">{store.description}</p>
                )}
              </div>
              <button
                onClick={() => updateParams({ store: '' })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                <X className="size-3.5" /> Browse all stores
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <p className="text-sm text-muted-foreground">This store isn't available right now.</p>
              <button
                onClick={() => updateParams({ store: '' })}
                className="text-sm font-medium text-primary hover:underline"
              >
                Browse all products →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Heading */}
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && !store && <p className="mt-1 max-w-2xl text-muted-foreground">{description}</p>}
          {query && (
            <button
              onClick={() => updateParams({ search: '' })}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <X className="size-3.5" /> Clear search
            </button>
          )}
        </div>
        {/* AI indicator lives next to the heading so it reads as part of normal search */}
        {searchIndicator}
      </div>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        {/* Sidebar filters (desktop) */}
        <FilterPanel className="w-64 shrink-0" {...filterProps} />

        {/* Results column */}
        <div className="min-w-0 flex-1" ref={gridRef}>
          {/* Toolbar */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            {/* Refine search */}
            <form
              className="relative min-w-0 flex-1 basis-56"
              onSubmit={(event) => {
                event.preventDefault()
                updateParams({ search: searchDraft.trim() })
              }}
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Search within products…"
                aria-label="Search products"
                className="pl-9 pr-16"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchDraft('')
                    updateParams({ search: '' })
                  }}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </form>

            {/* Mobile filter toggle */}
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <SlidersHorizontal className="size-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="hidden text-sm text-muted-foreground sm:block">
                Sort by
              </label>
              <Select
                id="sort"
                value={effectiveSort}
                onChange={(event) => updateParams({ sort: event.target.value })}
                className="w-44 sm:w-48"
                aria-label="Sort products"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Mobile filter drawer */}
          <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
            <FilterPanel
              open
              categories={filterProps.categories}
              categoriesLoading={filterProps.categoriesLoading}
              category={filterProps.category}
              onCategory={filterProps.onCategory}
              minPrice={filterProps.minPrice}
              maxPrice={filterProps.maxPrice}
              onPrice={filterProps.onPrice}
              inStock={filterProps.inStock}
              onInStock={filterProps.onInStock}
              onClear={filterProps.onClear}
              onClose={() => setFiltersOpen(false)}
            />
          </Drawer>

          {/* Result count */}
          <p className="mb-5 text-sm text-muted-foreground">
            {productsState.loading || categoryPending || aiLoading ? (
              aiLoading ? (
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="size-4 animate-pulse text-brand-500" />
                  Finding products that match what you're looking for…
                </span>
              ) : (
                'Loading products…'
              )
            ) : (
              <>
                <span className="font-semibold text-foreground">{payload.totalCount}</span>{' '}
                {payload.totalCount === 1 ? 'product' : 'products'}
                {activeCategory && <> in {activeCategory.name}</>}
                {store && <> from {store.storeName}</>}
              </>
            )}
          </p>

          {/* Grid / error / loading */}
          {productsState.error && !productsState.loading ? (
            <ErrorState
              title="Couldn't load products"
              message="Check your connection and try again — the catalog will be right back."
              onRetry={productsState.refetch}
            />
          ) : categoryPending || aiLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
                  <Skeleton className="aspect-square w-full rounded-none" />
                  <div className="space-y-2 p-3.5">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-5 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ProductGrid
              products={displayProducts}
              loading={productsState.loading}
              wishedIds={wishlistLoaded ? wishedIds : new Set()}
              onAddToCart={handleAddToCart}
              onToggleWishlist={handleToggleWishlist}
              emptyTitle={
                store ? 'This store has no products yet' : query ? `No results for “${query}”` : 'No products match these filters'
              }
              emptyText={
                store
                  ? 'Check back soon — new listings appear here first.'
                  : query
                    ? 'Check the spelling or try broader keywords.'
                    : 'Try widening the price range or clearing the filters.'
              }
            />
          )}

          {/* Pagination */}
          {!productsState.loading && !categoryPending && !aiSemantic && payload.totalCount > PAGE_SIZE && (
            <div className="mt-10">
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={(nextPage) => setSearchParams((prev) => {
                  const next = new URLSearchParams(prev)
                  next.set('page', String(nextPage))
                  return next
                })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
