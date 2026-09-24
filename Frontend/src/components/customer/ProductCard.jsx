import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Eye, Heart, ImageOff, ShoppingCart, Star } from 'lucide-react'
import { cn, isPlaceholderImage } from '../../lib/utils.js'
import { discountPercent, formatPrice } from '../../lib/format.js'
import { Badge } from '../ui/Badge.jsx'
import { Skeleton } from '../ui/Skeleton.jsx'

// Graceful tile shown when an image URL can't be fetched (offline demo-safe)
function ImageFallback({ title, brand }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-teal-50 via-ivory to-coral-soft/40 p-4 text-center">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-white/70 ring-1 ring-teal-200/70">
        <ImageOff className="size-5 text-teal-600" />
      </span>
      <p className="line-clamp-1 font-display text-sm font-bold text-deep-teal">
        {(brand || title || 'Product').slice(0, 1).toUpperCase()}
      </p>
      <p className="line-clamp-2 text-[11px] text-slate-500">{title}</p>
    </div>
  )
}

function Stars({ rating, reviewsCount }) {
  if (!rating || rating <= 0) {
    return (
      <Badge variant="accent" className="text-[10px]">
        New arrival
      </Badge>
    )
  }
  const filled = Math.round(rating)
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-500">
      <span className="flex items-center gap-px" aria-label={`Rated ${rating} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn('size-3.5', i <= filled ? 'fill-amber-400 text-amber-400' : 'text-slate-200')}
          />
        ))}
      </span>
      <span className="font-semibold text-slate-700">{rating.toFixed(1)}</span>
      {reviewsCount > 0 && <span className="text-slate-400">({reviewsCount})</span>}
    </span>
  )
}

export function ProductCard({
  product,
  wished = false,
  onAddToCart,
  onToggleWishlist,
  onQuickView,
  showQuickView = true,
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const [added, setAdded] = useState(false)
  const addedTimer = useRef(null)

  useEffect(() => () => clearTimeout(addedTimer.current), [])

  const price = Number(product.price)
  const discount = discountPercent(price, Number(product.originalPrice))
  const outOfStock = product.stock <= 0
  const image = product.images?.[0]
  const showImage = !isPlaceholderImage(image) && !imageFailed

  // Confirm the add in place, then let the button fall back to its idle state
  const handleAdd = () => {
    onAddToCart?.(product)
    setAdded(true)
    clearTimeout(addedTimer.current)
    addedTimer.current = setTimeout(() => setAdded(false), 1400)
  }

  return (
    <motion.article
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-deep-teal/[0.08] shadow-[0_1px_2px_rgba(16,42,42,0.04)] transition-shadow duration-300 hover:ring-deep-teal/[0.14] hover:shadow-[0_4px_10px_rgba(16,42,42,0.05),0_28px_54px_-26px_rgba(16,42,42,0.35)]"
    >
      {/* Image (opens product details) */}
      <Link
        to={`/product/${product._id}`}
        aria-label={`View ${product.title}`}
        className="relative block aspect-square overflow-hidden bg-ivory"
      >
        {showImage ? (
          <img
            src={image}
            alt={product.title}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className={cn(
              'h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.07]',
              outOfStock && 'opacity-60 grayscale',
            )}
          />
        ) : (
          <ImageFallback title={product.title} brand={product.brand} />
        )}

        {/* Bottom wash appears on hover so the tile deepens subtly */}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-deep-teal/55 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Discount badge — the coral accent marks the deal */}
        {discount && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-coral px-2 py-0.5 text-[11px] font-bold text-white shadow-[0_6px_16px_-6px_rgba(255,107,107,0.9)]">
            −{discount}%
          </span>
        )}

        {/* Out of stock chip */}
        {outOfStock && (
          <span className="absolute inset-x-2.5 bottom-2.5 rounded-lg bg-deep-teal/80 py-1.5 text-center text-[10px] font-bold tracking-[0.12em] text-white uppercase backdrop-blur-sm">
            Out of stock
          </span>
        )}

        {/* Quick view — slides up on hover, always reachable by keyboard */}
        {showQuickView && onQuickView && (
          <span
            className="pointer-events-none absolute inset-x-3 bottom-3 flex translate-y-3 justify-center opacity-0 transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100"
            onClick={(event) => event.preventDefault()}
          >
            <button
              type="button"
              onClick={() => onQuickView(product)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-xs font-bold text-deep-teal shadow-lg ring-1 ring-deep-teal/10 backdrop-blur transition hover:bg-white hover:text-teal-700 active:scale-95"
            >
              <Eye className="size-3.5" /> Quick view
            </button>
          </span>
        )}
      </Link>

      {/* Wishlist (sibling so it stays interactive next to the Link) */}
      <motion.button
        onClick={() => onToggleWishlist?.(product)}
        whileTap={{ scale: 0.8 }}
        aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={wished}
        className={cn(
          'absolute top-2.5 right-2.5 z-10 flex size-9 items-center justify-center rounded-full bg-white/85 ring-1 ring-deep-teal/[0.06] backdrop-blur transition-all duration-200 hover:scale-110',
          wished ? 'text-coral' : 'text-slate-500 hover:text-coral',
        )}
      >
        {/* The heart pops once when it turns on */}
        <motion.span
          animate={wished ? { scale: [1, 1.45, 0.9, 1] } : { scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="flex"
        >
          <Heart className={cn('size-4 transition-colors', wished && 'fill-coral')} />
        </motion.span>
      </motion.button>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        {product.brand && (
          <p className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
            {product.brand}
          </p>
        )}
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-deep-teal">
          <Link to={`/product/${product._id}`} className="transition-colors hover:text-teal-700">
            {product.title}
          </Link>
        </h3>
        <Stars rating={product.rating} reviewsCount={product.reviewsCount} />

        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
          <div className="flex flex-col">
            <span className="font-display text-[15px] font-extrabold tracking-[-0.02em] text-deep-teal tabular-nums">
              {formatPrice(price)}
            </span>
            {discount && (
              <span className="text-xs text-slate-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          <motion.button
            onClick={handleAdd}
            disabled={outOfStock}
            animate={added ? { scale: [1, 1.14, 1] } : { scale: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            aria-label={outOfStock ? 'Out of stock' : added ? 'Added to cart' : 'Add to cart'}
            className={cn(
              'flex size-10 items-center justify-center rounded-xl transition-all duration-200',
              outOfStock
                ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                : added
                  ? 'bg-teal-700 text-white shadow-[0_10px_24px_-10px_rgba(15,118,110,0.95)]'
                  : 'bg-gradient-to-br from-teal-600 to-teal-800 text-white shadow-[0_8px_20px_-8px_rgba(15,118,110,0.85)] hover:-translate-y-px hover:shadow-[0_12px_26px_-10px_rgba(15,118,110,0.95)] active:translate-y-0',
            )}
          >
            {added ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
          </motion.button>
        </div>
      </div>
    </motion.article>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-deep-teal/[0.08]">
      <Skeleton className="aspect-square w-full rounded-none bg-deep-teal/[0.06]" />
      <div className="space-y-2.5 p-3.5">
        <Skeleton className="h-3 w-1/3 bg-deep-teal/[0.06]" />
        <Skeleton className="h-4 w-4/5 bg-deep-teal/[0.06]" />
        <Skeleton className="h-3 w-1/2 bg-deep-teal/[0.06]" />
        <Skeleton className="h-5 w-1/3 bg-deep-teal/[0.06]" />
      </div>
    </div>
  )
}
