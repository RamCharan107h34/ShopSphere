import { PackageSearch } from 'lucide-react'
import { ProductCard, ProductCardSkeleton } from './ProductCard.jsx'

export function ProductGrid({
  products,
  loading = false,
  wishedIds = new Set(),
  // wishlistMode renders every card as already wished (used on the wishlist page)
  wishlistMode = false,
  onAddToCart,
  onToggleWishlist,
  onQuickView,
  emptyTitle = 'No products found',
  emptyText = 'Try a different search or browse another category.',
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-slate-100">
          <PackageSearch className="size-6 text-slate-400" />
        </span>
        <p className="font-semibold text-slate-900">{emptyTitle}</p>
        <p className="max-w-sm text-sm text-slate-500">{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          wished={wishlistMode || wishedIds.has(product._id)}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
          onQuickView={onQuickView}
        />
      ))}
    </div>
  )
}
