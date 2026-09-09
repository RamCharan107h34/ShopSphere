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
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted">
          <PackageSearch className="size-6 text-muted-foreground" />
        </span>
        <p className="font-semibold">{emptyTitle}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{emptyText}</p>
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
        />
      ))}
    </div>
  )
}
