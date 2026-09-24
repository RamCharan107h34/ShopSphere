import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Eye, Heart, ImageOff, Minus, Plus, ShoppingCart, Star, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { formatPrice, discountPercent } from '../../lib/format.js'
import { isPlaceholderImage } from '../../lib/utils.js'
import { Badge } from '../ui/Badge.jsx'

export function ProductQuickView({ product, open, onClose, wished = false, onToggleWishlist, onAddToCart }) {
  const [selectedImgIdx, setSelectedImgIdx] = useState(0)
  const [qty, setQty] = useState(1)
  const [addedAnimation, setAddedAnimation] = useState(false)

  if (!open || !product) return null

  const images = product.images?.length > 0 ? product.images : []
  const activeImage = images[selectedImgIdx] || images[0]
  const price = Number(product.price)
  const discount = discountPercent(price, Number(product.originalPrice))
  const outOfStock = product.stock <= 0

  const handleAdd = () => {
    if (outOfStock) return
    onAddToCart?.(product, qty)
    setAddedAnimation(true)
    setTimeout(() => setAddedAnimation(false), 1600)
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#102A2A]/60 backdrop-blur-sm"
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-[#102A2A]/10 sm:p-8"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 flex size-9 items-center justify-center rounded-full bg-[#F7F5F0] text-[#102A2A] transition hover:bg-[#FFE3D8] hover:text-[#FF6B6B]"
              aria-label="Close modal"
            >
              <X className="size-4.5" />
            </button>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Left: Image gallery */}
              <div className="flex flex-col gap-3">
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#F7F5F0] ring-1 ring-[#102A2A]/5">
                  {!isPlaceholderImage(activeImage) ? (
                    <img
                      src={activeImage}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <ImageOff className="size-10" />
                    </div>
                  )}

                  {discount && (
                    <span className="absolute top-3 left-3 rounded-full bg-[#FF6B6B] px-2.5 py-1 text-xs font-bold text-white shadow-md">
                      −{discount}% OFF
                    </span>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImgIdx(index)}
                        className={`relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                          selectedImgIdx === index
                            ? 'border-[#0F766E] ring-2 ring-[#0F766E]/20'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="thumbnail" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Info */}
              <div className="flex flex-col justify-between">
                <div>
                  {product.brand && (
                    <p className="text-xs font-bold tracking-wider text-[#0F766E] uppercase">
                      {product.brand}
                    </p>
                  )}
                  <h2 className="mt-1 font-display text-xl font-bold text-[#102A2A] sm:text-2xl">
                    {product.title}
                  </h2>

                  {/* Ratings */}
                  <div className="mt-2.5 flex items-center gap-2 text-sm text-[#64748B]">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`size-4 ${
                            s <= Math.round(product.rating || 5)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold text-[#102A2A]">
                      {(product.rating || 4.8).toFixed(1)}
                    </span>
                    <span>({product.reviewsCount || 42} reviews)</span>
                  </div>

                  {/* Price */}
                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="font-display text-2xl font-extrabold text-[#102A2A]">
                      {formatPrice(price)}
                    </span>
                    {discount && (
                      <span className="text-sm text-slate-400 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>

                  {/* Stock tag */}
                  <div className="mt-3">
                    {outOfStock ? (
                      <Badge variant="danger">Out of stock</Badge>
                    ) : (
                      <Badge variant="teal">In stock ({product.stock} available)</Badge>
                    )}
                  </div>

                  {/* Description */}
                  <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-[#64748B]">
                    {product.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-4 border-t border-slate-100 pt-5">
                  <div className="flex items-center gap-4">
                    {/* Qty Selector */}
                    <div className="flex items-center rounded-xl border border-slate-200 bg-white">
                      <button
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        disabled={qty <= 1}
                        className="flex size-9 items-center justify-center text-slate-500 hover:text-[#102A2A]"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="min-w-8 text-center text-sm font-bold tabular-nums">
                        {qty}
                      </span>
                      <button
                        onClick={() => setQty((q) => Math.min(product.stock || 10, q + 1))}
                        disabled={qty >= (product.stock || 10)}
                        className="flex size-9 items-center justify-center text-slate-500 hover:text-[#102A2A]"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>

                    {/* Add to Cart button */}
                    <button
                      onClick={handleAdd}
                      disabled={outOfStock}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[#0F766E]/25 transition hover:bg-[#115E59] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {addedAnimation ? (
                        <>
                          <Check className="size-4" /> Added to cart!
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="size-4" /> Add to cart
                        </>
                      )}
                    </button>

                    {/* Wishlist toggle */}
                    <button
                      onClick={() => onToggleWishlist?.(product)}
                      className={`flex size-11 items-center justify-center rounded-xl border transition ${
                        wished
                          ? 'border-[#FF6B6B] bg-[#FFE3D8]/50 text-[#FF6B6B]'
                          : 'border-slate-200 text-slate-500 hover:border-[#FF6B6B] hover:text-[#FF6B6B]'
                      }`}
                      aria-label="Wishlist"
                    >
                      <Heart className={`size-5 ${wished ? 'fill-[#FF6B6B]' : ''}`} />
                    </button>
                  </div>

                  <div className="text-center">
                    <Link
                      to={`/product/${product._id}`}
                      onClick={onClose}
                      className="text-xs font-semibold text-[#0F766E] hover:underline"
                    >
                      View full product details →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
