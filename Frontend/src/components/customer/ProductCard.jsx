import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ImageOff, ShoppingCart, Star } from 'lucide-react'
import { cn, isPlaceholderImage } from '../../lib/utils.js'
import { discountPercent, formatPrice } from '../../lib/format.js'
import { Badge } from '../ui/Badge.jsx'
import { Skeleton } from '../ui/Skeleton.jsx'

// Graceful tile shown when an image URL can't be fetched (offline demo-safe)
function ImageFallback({ title, brand }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-brand-50 via-background to-fuchsia-50 p-4 text-center">
      <ImageOff className="size-7 text-brand-300" />
      <p className="line-clamp-1 text-sm font-semibold text-brand-700">
        {(brand || title || 'Product').slice(0, 1).toUpperCase()}
      </p>
      <p className="line-clamp-2 text-[11px] text-muted-foreground">{title}</p>
    </div>
  )
}

function Stars({ rating, reviewsCount }) {
  if (!rating || rating <= 0) {
    return <Badge variant="success" className="text-[10px]">New</Badge>
  }
  const filled = Math.round(rating)
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <span className="flex items-center" aria-label={`Rated ${rating} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              'size-3.5',
              i <= filled ? 'fill-amber-400 text-amber-400' : 'text-slate-300',
            )}
          />
        ))}
      </span>
      <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
      {reviewsCount > 0 && <span>({reviewsCount})</span>}
    </span>
  )
}

export function ProductCard({ product, wished = false, onAddToCart, onToggleWishlist }) {
  const [imageFailed, setImageFailed] = useState(false)
  const price = Number(product.price)
  const discount = discountPercent(price, Number(product.originalPrice))
  const outOfStock = product.stock <= 0
  const image = product.images?.[0]
  const showImage = !isPlaceholderImage(image) && !imageFailed

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-shadow hover:shadow-elevated"
    >
      {/* Image (opens product details) */}
      <Link
        to={`/product/${product._id}`}
        aria-label={`View ${product.title}`}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        {showImage ? (
          <img
            src={image}
            alt={product.title}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className={cn(
              'h-full w-full object-cover transition-transform duration-500 group-hover:scale-105',
              outOfStock && 'opacity-50 grayscale',
            )}
          />
        ) : (
          <ImageFallback title={product.title} brand={product.brand} />
        )}

        {/* Discount badge */}
        {discount && (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-rose-500 px-1.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
            -{discount}%
          </span>
        )}

        {/* Out of stock chip */}
        {outOfStock && (
          <span className="absolute inset-x-0 bottom-0 bg-slate-900/70 py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            Out of stock
          </span>
        )}
      </Link>

      {/* Wishlist (sibling so it stays interactive next to the Link) */}
      <button
        onClick={() => onToggleWishlist?.(product)}
        aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={wished}
        className={cn(
          'absolute right-2.5 top-2.5 z-10 flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-all hover:scale-110 active:scale-95',
          wished ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500',
        )}
      >
        <Heart className={cn('size-4', wished && 'fill-current')} />
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        {product.brand && <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{product.brand}</p>}
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">
          <Link to={`/product/${product._id}`} className="transition-colors hover:text-primary">
            {product.title}
          </Link>
        </h3>
        <Stars rating={product.rating} reviewsCount={product.reviewsCount} />

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight">{formatPrice(price)}</span>
            {discount && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          <button
            onClick={() => onAddToCart?.(product)}
            disabled={outOfStock}
            aria-label={outOfStock ? 'Out of stock' : 'Add to cart'}
            className={cn(
              'flex size-9 items-center justify-center rounded-lg transition-all active:scale-90',
              outOfStock
                ? 'cursor-not-allowed bg-muted text-muted-foreground/50'
                : 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
            )}
          >
            <ShoppingCart className="size-4" />
          </button>
        </div>
      </div>
    </motion.article>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2.5 p-3.5">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  )
}
