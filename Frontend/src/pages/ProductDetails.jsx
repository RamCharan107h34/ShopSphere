import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
  ImageOff,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Truck,
} from 'lucide-react'
import { useToast } from '../components/ui/toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useFetch } from '../hooks/useFetch.js'
import { Button } from '../components/ui/Button.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Skeleton } from '../components/ui/Skeleton.jsx'
import { ProductGrid } from '../components/customer/ProductGrid.jsx'
import { SectionHeader } from '../components/customer/SectionHeader.jsx'
import { addToCart, addToWishlist, fetchProducts, removeFromWishlist } from '../services/catalog.js'
import { getErrorMessage } from '../services/api.js'
import api from '../services/api.js'
import { cn, isPlaceholderImage } from '../lib/utils.js'
import { discountPercent, formatPrice } from '../lib/format.js'

const realImage = (url) => !isPlaceholderImage(url)

/* ---------------- Gallery ---------------- */
function Gallery({ product }) {
  const images = useMemo(() => {
    const list = (product.images || []).filter(realImage)
    return list.slice(0, 5)
  }, [product.images])

  const [active, setActive] = useState(0)
  const [failed, setFailed] = useState(new Set())

  const step = (direction) => {
    if (images.length <= 1) return
    setActive((current) => (current + direction + images.length) % images.length)
  }

  // No real images available → branded fallback tile
  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 via-background to-fuchsia-50">
        <div className="flex flex-col items-center gap-2 px-6 text-center">
          <ImageOff className="size-10 text-brand-300" />
          <p className="text-sm font-medium text-muted-foreground">{product.title}</p>
        </div>
      </div>
    )
  }

  const activeSrc = images[Math.min(active, images.length - 1)]
  const activeFailed = failed.has(activeSrc)

  return (
    <div>
      {/* Main image */}
      <div className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-card">
        {activeFailed ? (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-50 via-background to-fuchsia-50">
            <ImageOff className="size-10 text-brand-300" />
          </div>
        ) : (
          <img
            src={activeSrc}
            alt={product.title}
            onError={() => setFailed((current) => new Set(current).add(activeSrc))}
            className="h-full w-full object-cover"
          />
        )}

        {images.length > 1 && (
          <>
            <button
              onClick={() => step(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => step(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform hover:scale-105 active:scale-95"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {images.map((src, index) => (
            <button
              key={src + index}
              onClick={() => setActive(index)}
              aria-label={`Image ${index + 1}`}
              className={cn(
                'size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors',
                index === active ? 'border-primary' : 'border-transparent hover:border-border',
              )}
            >
              {failed.has(src) ? (
                <div className="h-full w-full bg-muted" />
              ) : (
                <img
                  src={src}
                  alt=""
                  onError={() => setFailed((current) => new Set(current).add(src))}
                  className="h-full w-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- Rating summary chip ---------------- */
function RatingSummary({ rating, count }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
      <p className="text-3xl font-extrabold tracking-tight">{rating || '—'}</p>
      <div>
        <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={cn(
                'size-4',
                i <= Math.round(rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300',
              )}
            />
          ))}
        </span>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {count} verified review{count === 1 ? '' : 's'}
        </p>
      </div>
    </div>
  )
}

function ReviewCard({ review }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{review.customerId?.name || 'Customer'}</p>
        <span className="flex items-center gap-1 text-xs font-medium">
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          {review.rating}.0
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/90">{review.comment}</p>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {new Date(review.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}{' '}
        · Verified purchase
      </p>
      {review.sellerReply && (
        <div className="mt-3 rounded-lg bg-accent/60 p-3">
          <p className="text-xs font-semibold text-accent-foreground">Seller response</p>
          <p className="mt-1 text-sm text-foreground/90">{review.sellerReply}</p>
        </div>
      )}
    </div>
  )
}

/* ---------------- Quantity stepper ---------------- */
function Quantity({ value, onChange, max }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-card">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label="Decrease quantity"
        className="flex size-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
      >
        <Minus className="size-4" />
      </button>
      <span className="w-10 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
        className="flex size-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}

/* ============================================================ */
export default function ProductDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const { refreshCount } = useCart()
  const { toast } = useToast()
  const navigate = useNavigate()

  // ---- Product ---------------------------------------------------
  const productState = useFetch(() =>
    api.get(`/product-api/products/${id}`).then(({ data }) => data.payload),
  )
  const product = productState.data

  // ---- Reviews + related (only once the product resolves) --------
  const reviewsState = useFetch(
    () =>
      product
        ? api.get(`/review-api/products/${product._id}`).then(({ data }) => data.payload)
        : Promise.resolve([]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product?._id],
  )

  const relatedState = useFetch(
    () => {
      if (!product) return Promise.resolve([])
      const categoryId = product.category?._id || product.category
      const fetchCategory = categoryId
        ? fetchProducts({ category: categoryId, limit: 8 }).then((p) => p.products)
        : Promise.resolve([])
      return fetchCategory.then((list) => {
        const others = list.filter((item) => item._id !== product._id)
        if (others.length > 0) return others
        return fetchProducts({ limit: 8 }).then((p) =>
          p.products.filter((item) => item._id !== product._id),
        )
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product?._id],
  )

  // ---- Wishlist membership ---------------------------------------
  const [wished, setWished] = useState(false)
  useEffect(() => {
    let cancelled = false
    if (user && product) {
      api
        .get('/wishlist-api/wishlist')
        .then(({ data }) => {
          if (!cancelled) {
            setWished(
              data.payload.products.some((item) => item._id.toString() === product._id.toString()),
            )
          }
        })
        .catch(() => {})
    } else {
      setWished(false)
    }
    return () => {
      cancelled = true
    }
  }, [user, product])

  // ---- Variant + quantity ----------------------------------------
  const variants = product?.variants || []
  const [variantIndex, setVariantIndex] = useState(-1)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    setVariantIndex(variants.length > 0 ? 0 : -1)
    setQuantity(1)
  }, [product?._id, variants.length])

  /* ---------------- Loading & 404 ---------------- */
  if (productState.loading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-24 w-full" />
          <div className="flex gap-3">
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-12 w-40" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
        <p className="text-6xl font-extrabold tracking-tight text-primary">404</p>
        <h1 className="mt-3 text-2xl font-bold">Product not found</h1>
        <p className="mt-2 text-muted-foreground">This product may have been removed by its seller.</p>
        <Link to="/products" className="mt-6 inline-block font-medium text-primary hover:underline">
          Browse all products →
        </Link>
      </div>
    )
  }

  /* ---------------- Derived values ---------------- */
  const variant = variantIndex >= 0 ? variants[variantIndex] : null
  const displayPrice = variant ? variant.price : product.price
  // Original price always comes from the product level
  const originalDisplayPrice = product.originalPrice
  const displayStock = variant ? variant.stock : product.stock
  const discount = discountPercent(displayPrice, originalDisplayPrice)
  const outOfStock = displayStock <= 0
  const maxQuantity = Math.max(displayStock, 1)
  const qtyToBuy = Math.min(quantity, maxQuantity)
  const categorySlug = product.category?.slug

  /* ---------------- Handlers ---------------- */
  const requireSignIn = () => {
    toast({ title: 'Sign in required', description: 'Create an account or sign in to continue.', variant: 'info' })
    navigate('/login')
  }

  const toggleWishlist = async () => {
    if (!user) return requireSignIn()
    try {
      if (wished) {
        await removeFromWishlist(product._id)
        setWished(false)
        toast({ title: 'Removed from wishlist', variant: 'info' })
      } else {
        await addToWishlist(product._id)
        setWished(true)
        toast({ title: 'Saved to wishlist ❤️', description: product.title, variant: 'success' })
      }
    } catch (error) {
      toast({ title: 'Something went wrong', description: getErrorMessage(error), variant: 'error' })
    }
  }

  const addToCartAction = async (buyNow = false) => {
    if (!user) return requireSignIn()
    try {
      await addToCart(product._id, qtyToBuy, variant?._id)
      refreshCount()
      if (buyNow) {
        toast({ title: 'Ready for checkout 🛒', description: `${qtyToBuy} × ${product.title} added`, variant: 'success' })
        navigate('/checkout')
      } else {
        toast({ title: 'Added to cart', description: `${qtyToBuy} × ${product.title}`, variant: 'success' })
      }
    } catch (error) {
      toast({ title: 'Could not add item', description: getErrorMessage(error), variant: 'error' })
    }
  }

  const relatedAdd = async (item) => {
    if (!user) return requireSignIn()
    try {
      await addToCart(item._id)
      refreshCount()
      toast({ title: 'Added to cart', description: item.title, variant: 'success' })
    } catch (error) {
      toast({ title: 'Could not add item', description: getErrorMessage(error), variant: 'error' })
    }
  }

  const relatedWishlist = async (item) => {
    if (!user) return requireSignIn()
    try {
      await addToWishlist(item._id)
      toast({ title: 'Saved to wishlist ❤️', description: item.title, variant: 'success' })
    } catch (error) {
      toast({ title: 'Something went wrong', description: getErrorMessage(error), variant: 'error' })
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 overflow-hidden text-sm text-muted-foreground">
        <Link to="/" className="shrink-0 transition-colors hover:text-foreground">Home</Link>
        <span className="text-muted-foreground/50">/</span>
        <Link to="/products" className="shrink-0 transition-colors hover:text-foreground">Products</Link>
        {categorySlug && (
          <>
            <span className="text-muted-foreground/50">/</span>
            <Link to={`/category/${categorySlug}`} className="shrink-0 transition-colors hover:text-foreground">
              {product.category?.name}
            </Link>
          </>
        )}
        <span className="text-muted-foreground/50">/</span>
        <span className="truncate font-medium text-foreground">{product.title}</span>
      </nav>

      {/* Main: gallery + purchase panel */}
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <Gallery product={product} />

        <div>
          {product.brand && (
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {product.brand}
            </p>
          )}
          <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight">{product.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <RatingSummary rating={product.rating} count={product.reviewsCount} />
            <a href="#reviews" className="text-sm font-medium text-primary hover:underline">
              Read all reviews
            </a>
          </div>

          {/* Price */}
          <div className="mt-5 flex flex-wrap items-end gap-3">
            <p className="text-3xl font-extrabold tracking-tight">{formatPrice(displayPrice)}</p>
            {discount && (
              <>
                <p className="text-lg text-muted-foreground line-through">{formatPrice(originalDisplayPrice)}</p>
                <Badge variant="danger">-{discount}%</Badge>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes</p>

          {/* Stock */}
          <div className="mt-4 flex items-center gap-2 text-sm">
            {!outOfStock ? (
              <>
                <CheckCircle2 className="size-4 text-success" />
                <span className="font-medium text-success">In stock</span>
                {displayStock <= (product.lowStockThreshold ?? 5) && (
                  <span className="font-medium text-warning">· only {displayStock} left</span>
                )}
              </>
            ) : (
              <span className="font-medium text-destructive">Currently out of stock</span>
            )}
          </div>

          {/* Variants */}
          {variants.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold">
                Variant <span className="font-normal text-muted-foreground">· {variants.length} options</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((item, index) => {
                  const selected = index === variantIndex
                  const soldOut = item.stock <= 0
                  return (
                    <button
                      key={item._id}
                      onClick={() => {
                        setVariantIndex(index)
                        setQuantity(1)
                      }}
                      disabled={soldOut}
                      title={soldOut ? 'Sold out' : undefined}
                      className={cn(
                        'rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                        selected
                          ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                          : 'border-border bg-card hover:border-primary/50',
                      )}
                    >
                      {item.name}
                      {soldOut && ' · Sold out'}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quantity + wishlist */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Quantity value={qtyToBuy} onChange={setQuantity} max={maxQuantity} />
            <Button
              variant="outline"
              onClick={toggleWishlist}
              className={cn(wished && 'border-rose-200 text-rose-600 hover:bg-rose-50')}
            >
              <Heart className={cn('size-4', wished && 'fill-current')} />
              {wished ? 'Saved to wishlist' : 'Add to wishlist'}
            </Button>
          </div>

          {/* Actions */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button size="lg" disabled={outOfStock} onClick={() => addToCartAction(false)}>
              <ShoppingCart className="size-4" /> Add to cart
            </Button>
            <Button
              size="lg"
              disabled={outOfStock}
              onClick={() => addToCartAction(true)}
              className="bg-gradient-to-r from-brand-600 to-fuchsia-600 hover:from-brand-700 hover:to-fuchsia-700"
            >
              Buy now
            </Button>
          </div>
          <p className="mt-2.5 text-center text-xs text-muted-foreground sm:hidden">
            Buy now adds to your cart — checkout arrives in the next step.
          </p>

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5 text-center">
            {[
              { icon: Truck, label: 'Fast delivery' },
              { icon: RotateCcw, label: '7-day returns' },
              { icon: ShieldCheck, label: 'Secure payment' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground">
                <item.icon className="size-5 text-primary" />
                {item.label}
              </div>
            ))}
          </div>

          {/* Seller / store */}
          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Store className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Sold by</p>
              <p className="truncate font-semibold">{product.storeId?.storeName || 'ShopSphere seller'}</p>
            </div>
            {product.storeId?._id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/products?store=${product.storeId._id}`)}
              >
                View store
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Description + specs */}
      <div className="mt-14 grid gap-8 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-xl font-bold tracking-tight">Description</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{product.description}</p>
          {product.aiGeneratedFeatures?.length > 0 && (
            <ul className="mt-4 space-y-2">
              {product.aiGeneratedFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  {feature}
                </li>
              ))}
            </ul>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <h2 className="text-xl font-bold tracking-tight">Specifications</h2>
          <dl className="mt-3 overflow-hidden rounded-xl border border-border">
            {[
              ['Brand', product.brand || '—'],
              ['Category', product.category?.name || '—'],
              ['Store', product.storeId?.storeName || '—'],
              ['Stock', outOfStock ? 'Out of stock' : `${displayStock} available`],
              ['SKU', variant?.sku || product.sku || '—'],
              ['Reviews', `${product.reviewsCount || 0} review${product.reviewsCount === 1 ? '' : 's'}`],
              ...(product.attributes?.length
                ? product.attributes.filter((attr) => attr.name).map((attr) => [attr.name, attr.value || '—'])
                : []),
            ].map(([label, value], index) => (
              <div
                key={label}
                className={cn(
                  'flex justify-between gap-4 bg-card px-4 py-2.5 text-sm',
                  index % 2 === 1 && 'bg-muted/30',
                )}
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </motion.section>
      </div>

      {/* Reviews */}
      <section id="reviews" className="mt-14 scroll-mt-20">
        <SectionHeader
          title="Customer reviews"
          subtitle="Only verified purchases can leave a review"
          action={
            <Link to={user ? '#reviews' : '/login'} className="text-sm font-medium text-primary hover:underline">
              {user ? 'Write a review' : 'Sign in to review'}
            </Link>
          }
        />
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <div className="space-y-4">
            <RatingSummary rating={product.rating} count={product.reviewsCount} />
          </div>
          <div className="space-y-3">
            {reviewsState.loading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-xl" />
                ))}
              </div>
            ) : reviewsState.data?.length > 0 ? (
              reviewsState.data.map((review) => <ReviewCard key={review._id} review={review} />)
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
                <p className="font-semibold">No reviews yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Purchased this product? Your review helps other shoppers decide.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related products */}
      {relatedState.loading ? (
        <section className="mt-14">
          <SectionHeader title="You may also like" />
          <ProductGrid loading />
        </section>
      ) : (
        relatedState.data?.length > 0 && (
          <section className="mt-14">
            <SectionHeader
              title="You may also like"
              subtitle="More from this category"
              action={
                categorySlug ? (
                  <Link to={`/category/${categorySlug}`} className="text-sm font-medium text-primary hover:underline">
                    View all
                  </Link>
                ) : undefined
              }
            />
            <ProductGrid
              products={relatedState.data.slice(0, 8)}
              onAddToCart={(item) => relatedAdd(item)}
              onToggleWishlist={(item) => relatedWishlist(item)}
            />
          </section>
        )
      )}
    </div>
  )
}
