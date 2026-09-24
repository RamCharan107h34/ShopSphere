import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgePercent,
  BookOpen,
  CookingPot,
  Dumbbell,
  Gamepad2,
  Headset,
  HeartPulse,
  LayoutGrid,
  PackageOpen,
  RotateCcw,
  ShieldCheck,
  Shirt,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Tag,
  Truck,
} from 'lucide-react'
import { useToast } from '../components/ui/toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useFetch } from '../hooks/useFetch.js'
import { buttonVariants } from '../components/ui/Button.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { ShimmerButton } from '../components/magic/ShimmerButton.jsx'
import { ProductGrid } from '../components/customer/ProductGrid.jsx'
import { ProductCarousel } from '../components/customer/ProductCarousel.jsx'
import { ProductQuickView } from '../components/customer/ProductQuickView.jsx'
import { SectionHeader } from '../components/customer/SectionHeader.jsx'
import {
  addToWishlist,
  fetchCategories,
  fetchProducts,
  fetchRecommendations,
  fetchTopPicks,
  removeFromWishlist,
} from '../services/catalog.js'
import { getErrorMessage } from '../services/api.js'
import api from '../services/api.js'
import { isPlaceholderImage } from '../lib/utils.js'
import { typography } from '../design/context.js'

// Distinct logo per category, matched by keyword so admin-added categories
// (e.g. "Smartphones", "Kids Toys") still get a sensible icon. Falls back to
// LayoutGrid when nothing matches.
const CATEGORY_ICONS = [
  { keywords: ['electronic', 'phone', 'mobile', 'gadget', 'tech', 'computer', 'laptop'], Icon: Smartphone },
  { keywords: ['fashion', 'apparel', 'clothing', 'footwear', 'shoe', 'wear'], Icon: Shirt },
  { keywords: ['home', 'kitchen', 'furniture', 'appliance', 'cookware', 'decor'], Icon: CookingPot },
  { keywords: ['beauty', 'personal care', 'cosmetic', 'skincare', 'grooming', 'wellness'], Icon: HeartPulse },
  { keywords: ['sport', 'fitness', 'gym', 'exercise', 'outdoor'], Icon: Dumbbell },
  { keywords: ['book', 'stationery', 'novel', 'study', 'school', 'office supply'], Icon: BookOpen },
  { keywords: ['toy', 'game', 'puzzle', 'kids', 'play'], Icon: Gamepad2 },
]

const categoryIconFor = (category) => {
  const name = (category?.name || '').toLowerCase()
  const match = CATEGORY_ICONS.find((entry) => entry.keywords.some((keyword) => name.includes(keyword)))
  return match?.Icon || LayoutGrid
}

// Each line has to be true of the running system: delivery statuses really do
// track an order to the door, a return can only be requested once a sub-order
// is delivered, stores are admin-approved, and support is a real ticket queue.
const perks = [
  { icon: Truck, title: 'Tracked delivery', text: 'Follow every order to the door' },
  { icon: RotateCcw, title: 'Returns accepted', text: 'Request one once delivered' },
  { icon: ShieldCheck, title: 'Verified vendors', text: 'Every store is admin-approved' },
  { icon: Headset, title: 'Support desk', text: 'Raise and track your tickets' },
]

/** Section reveal used by every block below the fold. */
const reveal = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.5, ease: 'easeOut' },
}

export default function Home() {
  const { user } = useAuth()
  const { addItem, openDrawer } = useCart()
  const { toast } = useToast()
  const navigate = useNavigate()

  // ---- Data -----------------------------------------------------------
  const categoriesState = useFetch(fetchCategories, [])
  const trendingState = useFetch(() => fetchTopPicks(8), [])
  const featuredState = useFetch(() => fetchProducts({ limit: 8 }).then((p) => p.products), [])
  const bestSellersState = useFetch(
    () => fetchProducts({ sort: 'popular', limit: 8 }).then((p) => p.products),
    [],
  )
  // Personalized rail. The backend reranks top-rated products by the
  // categories this customer browsed and bought from, and returns the plain
  // top-rated list for guests. Keyed on the user so signing in (or out)
  // re-fetches the ranking that applies to the current session.
  const recommendedState = useFetch(() => fetchRecommendations(8), [user?._id])

  const categories = categoriesState.data || []

  // ---- Search ----------------------------------------------------------
  const [query, setQuery] = useState('')

  const goToProducts = (search = '') => {
    navigate(search ? `/products?search=${encodeURIComponent(search)}` : '/products')
  }

  const submitSearch = (event) => {
    event?.preventDefault()
    const value = query.trim()
    goToProducts(value)
  }

  const goToCategory = (category) => navigate(`/products?category=${category._id}`)

  // ---- Trending tabs (server-filtered, so the tab is never half-empty) --
  const [activeTab, setActiveTab] = useState('all')
  const [tabProducts, setTabProducts] = useState([])
  const [tabLoading, setTabLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setTabLoading(true)
    fetchProducts(activeTab === 'all' ? { limit: 12 } : { category: activeTab, limit: 12 })
      .then((payload) => {
        if (!cancelled) setTabProducts(payload.products || [])
      })
      .catch(() => {
        if (!cancelled) setTabProducts([])
      })
      .finally(() => {
        if (!cancelled) setTabLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeTab])

  const tabs = useMemo(
    () => [{ _id: 'all', name: 'All products' }, ...categories.slice(0, 6)],
    [categories],
  )

  // ---- Wishlist ids (only when signed in) ------------------------------
  const [wishedIds, setWishedIds] = useState(new Set())
  const [wishlistLoaded, setWishlistLoaded] = useState(false)

  // Shared by the mount effect and by the heart toggle, which reloads the set
  // before flipping one id so the two views can't drift apart.
  const loadWishlist = useCallback(async () => {
    if (!user) {
      setWishedIds(new Set())
      setWishlistLoaded(true)
      return
    }
    try {
      const { data } = await api.get('/wishlist-api/wishlist')
      setWishedIds(new Set(data.payload.products.map((p) => p._id.toString())))
    } catch {
      // Token expired or the request failed — an empty set is a safe default
    } finally {
      setWishlistLoaded(true)
    }
  }, [user])

  useEffect(() => {
    loadWishlist()
  }, [loadWishlist])

  // ---- Quick view ------------------------------------------------------
  const [quickViewProduct, setQuickViewProduct] = useState(null)

  // ---- Product actions -------------------------------------------------
  const requireSignIn = () => {
    toast({ title: 'Sign in required', description: 'Create an account or sign in to continue.', variant: 'info' })
    navigate('/login')
  }

  const handleAddToCart = async (product, quantity = 1) => {
    if (!user) return requireSignIn()
    try {
      // Optimistic: the drawer renders the new line instantly and the badge
      // bumps, then reconciles with the server's cart.
      await addItem({ productId: product._id, quantity, product })
      toast({ title: 'Added to cart', description: product.title, variant: 'success' })
      openDrawer()
    } catch (error) {
      toast({ title: 'Could not add item', description: getErrorMessage(error), variant: 'error' })
    }
  }

  const handleToggleWishlist = async (product) => {
    const id = product._id.toString()
    if (!user) return requireSignIn()

    await loadWishlist()
    const currentlyWished = wishedIds.has(id)
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

  const trendingProducts = trendingState.data || []
  const recommendations = recommendedState.data
  const carouselProducts = recommendations?.products?.length
    ? recommendations.products
    : trendingProducts

  const gridProps = {
    wishedIds: wishlistLoaded ? wishedIds : new Set(),
    onAddToCart: handleAddToCart,
    onToggleWishlist: handleToggleWishlist,
    onQuickView: setQuickViewProduct,
  }

  const sections = [
    {
      id: 'featured',
      title: 'Featured products',
      subtitle: 'Freshly listed across our verified stores',
      state: featuredState,
    },
    {
      id: 'best-sellers',
      title: 'Best sellers',
      subtitle: 'The most popular picks with shoppers',
      state: bestSellersState,
    },
  ]

  const anyProducts =
    (featuredState.data?.length || 0) + (trendingState.data?.length || 0) > 0
  const loadingHome = featuredState.loading || trendingState.loading
  const heroImage = carouselProducts.find((product) => !isPlaceholderImage(product.images?.[0]))
  const heroSecondary = carouselProducts.find(
    (product) => product !== heroImage && !isPlaceholderImage(product.images?.[0]),
  )

  return (
    <div>
      {/* ============================= HERO ============================= */}
      <section className="relative overflow-hidden bg-deep-teal text-white">
        {/* Deep teal wash, coral ambient bloom, then a masked grid */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-deep-teal via-teal-card to-deep-teal" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_50%_at_85%_10%,rgba(255,107,107,0.22),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_5%_95%,rgba(15,118,110,0.4),transparent_60%)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.25) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />

        <div className="relative mx-auto grid max-w-[1440px] items-center gap-14 px-4 pt-14 pb-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20 lg:pb-24">
          {/* Copy + search */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 py-1 pr-3.5 pl-2.5 text-xs font-semibold text-coral-soft backdrop-blur">
                <Sparkles className="size-3.5 text-coral" /> India&apos;s multi-vendor marketplace
              </span>
            </motion.div>

            <motion.h1
              className="mt-6 font-display text-[2.4rem] leading-[1.05] font-extrabold tracking-[-0.035em] text-white sm:text-5xl lg:text-[3.5rem]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
            >
              Shop anything from
              <br />
              <span className="bg-gradient-to-r from-coral-soft via-coral to-coral-strong bg-clip-text text-transparent">
                stores you trust
              </span>
            </motion.h1>

            <motion.p
              className="mt-5 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
            >
              Products from independent sellers — one cart, one checkout, delivered to your door.
            </motion.p>

            {/* Hero search */}
            <motion.form
              onSubmit={submitSearch}
              className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] p-2 backdrop-blur-xl transition focus-within:border-coral/60 focus-within:bg-white/[0.12] focus-within:shadow-[0_0_0_4px_rgba(255,107,107,0.15)]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24 }}
            >
              <Sparkles className="ml-2 size-5 shrink-0 text-coral" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Describe it — “comfortable headphones for gaming”…"
                aria-label="Search products"
                className="h-11 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/45"
              />
              <button
                type="submit"
                className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-coral px-5 text-sm font-bold text-white shadow-[0_14px_30px_-14px_rgba(255,107,107,0.95)] transition hover:bg-coral-strong active:scale-[0.98]"
              >
                Shop now <ArrowRight className="size-4" />
              </button>
            </motion.form>

            {/* Primary actions */}
            <motion.div
              className="mt-5 flex flex-wrap items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Link
                to="/register/seller"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white/90 transition hover:border-coral/60 hover:bg-white/5 hover:text-white"
              >
                <Store className="size-4" /> Become a seller
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-coral-soft transition hover:text-white"
              >
                Browse all products <ArrowRight className="size-4" />
              </Link>
            </motion.div>

            {/* Quick category chips */}
            {categories.length > 0 && (
              <motion.div
                className="mt-7 flex flex-wrap items-center gap-2 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.34 }}
              >
                <span className="text-white/50">Popular:</span>
                {categories.slice(0, 5).map((category) => (
                  <button
                    key={category._id}
                    onClick={() => goToCategory(category)}
                    className="rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-1.5 text-xs font-semibold text-white/85 backdrop-blur transition-all hover:-translate-y-px hover:border-coral/50 hover:text-white"
                  >
                    {category.name}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Hero visual collage */}
          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="relative mx-auto grid max-w-md grid-cols-5 grid-rows-6 gap-3">
              {/* Main tile */}
              <div className="relative col-span-5 row-span-4 overflow-hidden rounded-[2rem] ring-1 ring-white/15 shadow-[0_50px_100px_-40px_rgba(0,0,0,0.85)]">
                {heroImage ? (
                  <img src={heroImage.images[0]} alt={heroImage.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-teal-700 to-deep-teal p-8 text-center">
                    <PackageOpen className="size-14 text-coral-soft/70" />
                    <p className="font-display text-lg font-bold">The marketplace opens here</p>
                    <p className="text-sm text-white/60">
                      Stores are onboarding right now — check back for fresh drops.
                    </p>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-deep-teal/75 via-transparent to-transparent" />

                {heroImage && (
                  <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                        {heroImage.brand || 'ShopSphear'}
                      </p>
                      <p className="truncate font-display text-sm font-bold text-deep-teal">
                        {heroImage.title}
                      </p>
                    </div>
                    <Link
                      to={`/product/${heroImage._id}`}
                      className="shrink-0 rounded-full bg-coral px-3 py-1.5 text-xs font-bold text-white transition hover:bg-coral-strong"
                    >
                      View
                    </Link>
                  </div>
                )}
              </div>

              {/* Secondary tiles */}
              <div className="col-span-3 row-span-2 overflow-hidden rounded-3xl ring-1 ring-white/15">
                {heroSecondary ? (
                  <img src={heroSecondary.images[0]} alt={heroSecondary.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/5">
                    <Tag className="size-7 text-coral-soft/70" />
                  </div>
                )}
              </div>
              <div className="col-span-2 row-span-2 flex flex-col items-center justify-center gap-1.5 rounded-3xl bg-coral/15 px-3 text-center ring-1 ring-coral/30 backdrop-blur">
                <ShieldCheck className="size-6 text-coral" />
                <p className="font-display text-sm font-extrabold text-white">Buyer protection</p>
                <p className="text-[10px] font-semibold tracking-wide text-white/70 uppercase">
                  Approved refunds
                </p>
              </div>
            </div>

            {/* Floating trust chips */}
            <div className="absolute -left-6 top-8 flex items-center gap-2 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.6)] ring-1 ring-deep-teal/5 backdrop-blur">
              <span className="flex size-8 items-center justify-center rounded-xl bg-amber-100">
                <Star className="size-4 fill-amber-500 text-amber-500" />
              </span>
              <div>
                <p className="font-display text-sm font-bold text-deep-teal">Top rated</p>
                <p className="text-[11px] text-slate-500">Verified sellers only</p>
              </div>
            </div>

            <div className="absolute -right-4 bottom-24 flex items-center gap-2 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.6)] ring-1 ring-deep-teal/5 backdrop-blur">
              <span className="flex size-8 items-center justify-center rounded-xl bg-teal-50">
                <Truck className="size-4 text-teal-700" />
              </span>
              <div>
                <p className="font-display text-sm font-bold text-deep-teal">Tracked delivery</p>
                <p className="text-[11px] text-slate-500">Every order, end to end</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Perks strip */}
        <div className="relative border-t border-white/10 bg-white/[0.04] backdrop-blur">
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-6 px-4 py-7 sm:px-6 lg:grid-cols-4">
            {perks.map((perk) => (
              <div key={perk.title} className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-coral/15 text-coral ring-1 ring-coral/25">
                  <perk.icon className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{perk.title}</p>
                  <p className="text-xs text-white/55">{perk.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================= CATEGORIES ========================== */}
      <section id="categories" className="scroll-mt-20">
        <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6">
          <SectionHeader
            eyebrow="Browse"
            title="Shop by category"
            subtitle="Curated collections from our verified sellers"
            action={
              <button
                onClick={() => navigate('/products')}
                className="text-sm font-semibold text-teal-700 transition-colors hover:text-teal-800"
              >
                View all products →
              </button>
            }
          />
          {categoriesState.loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-deep-teal/[0.06]" />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {categories.slice(0, 6).map((category, index) => {
                const CategoryIcon = categoryIconFor(category)
                const count = category.productCount ?? category.productsCount
                return (
                  <motion.button
                    key={category._id}
                    onClick={() => goToCategory(category)}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: index * 0.04 }}
                    className="group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl bg-white p-5 text-center ring-1 ring-deep-teal/[0.07] transition-all duration-300 hover:-translate-y-1.5 hover:ring-teal-300 hover:shadow-[0_24px_48px_-24px_rgba(16,42,42,0.45)]"
                  >
                    <span className="pointer-events-none absolute -top-8 -right-8 size-20 rounded-full bg-coral/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="relative flex size-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 to-teal-deep text-white shadow-[0_10px_24px_-12px_rgba(15,118,110,0.9)] transition-transform duration-300 group-hover:scale-105">
                      {!isPlaceholderImage(category.image) ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <CategoryIcon className="size-6" />
                      )}
                    </span>
                    <span className="relative">
                      <span className="block font-display text-sm font-bold text-deep-teal">
                        {category.name}
                      </span>
                      {count > 0 && (
                        <span className="mt-0.5 block text-[11px] text-slate-500">
                          {count} products
                        </span>
                      )}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Categories are being added by the admin.</p>
          )}
        </div>
      </section>

      {/* ==================== TRENDING + FILTER TABS =================== */}
      <section id="trending" className="scroll-mt-20">
        <div className="mx-auto max-w-[1440px] px-4 pb-4 sm:px-6">
          <SectionHeader
            eyebrow="Hot right now"
            title={
              <span className="flex items-center gap-2">
                <Sparkles className="size-5 text-coral" />
                Trending now
              </span>
            }
            subtitle="Filter the marketplace on the fly"
            action={
              <button
                onClick={() => navigate('/products')}
                className="hidden text-sm font-semibold text-teal-700 transition-colors hover:text-teal-800 sm:block"
              >
                View all →
              </button>
            }
          />

          {/* Filter tabs */}
          <div className="mb-7 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => {
              const active = activeTab === tab._id
              return (
                <button
                  key={tab._id}
                  onClick={() => setActiveTab(tab._id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 ${
                    active
                      ? 'bg-deep-teal text-white shadow-[0_10px_24px_-14px_rgba(16,42,42,0.9)]'
                      : 'bg-white text-slate-600 ring-1 ring-deep-teal/[0.08] hover:text-deep-teal hover:ring-teal-300'
                  }`}
                >
                  {tab.name}
                </button>
              )
            })}
          </div>

          <ProductGrid
            products={tabProducts}
            loading={tabLoading}
            emptyTitle="Nothing here yet"
            emptyText="Try another category — sellers are still stocking this one."
            {...gridProps}
          />
        </div>
      </section>

      {/* ======================== CAROUSEL =========================== */}
      {carouselProducts.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-4 pb-14 sm:px-6">
          <motion.div {...reveal}>
            <SectionHeader
              eyebrow="Picked for you"
              title="Recommended for you"
              subtitle={
                recommendations?.personalized && recommendations.basedOn.length > 0
                  ? `Because you've been browsing ${recommendations.basedOn.slice(0, 2).join(' & ')}`
                  : 'Top-rated finds worth a closer look'
              }
            />
            <ProductCarousel
              products={carouselProducts}
              loading={recommendedState.loading}
              {...gridProps}
            />
          </motion.div>
        </section>
      )}

      {/* ==================== PRODUCT GRID SECTIONS ================== */}
      <div className="mx-auto max-w-[1440px] space-y-16 px-4 pb-20 sm:px-6">
        {sections.map((section) => {
          const sectionProducts = section.state.data || []
          if (!section.state.loading && sectionProducts.length === 0) return null

          return (
            <motion.section key={section.id} id={section.id} {...reveal}>
              <SectionHeader
                title={section.title}
                subtitle={section.subtitle}
                action={
                  <button
                    onClick={() => navigate('/products')}
                    className="hidden text-sm font-semibold text-teal-700 transition-colors hover:text-teal-800 sm:block"
                  >
                    View all →
                  </button>
                }
              />
              <ProductGrid products={section.state.data} loading={section.state.loading} {...gridProps} />
            </motion.section>
          )
        })}

        {/* Empty-catalog helper when nothing is seeded yet */}
        {!loadingHome && !anyProducts && (
          <div className="flex flex-col items-center gap-5 rounded-[2rem] border border-dashed border-deep-teal/20 bg-white px-6 py-16 text-center">
            <span className="flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-600 to-teal-deep text-white shadow-[0_20px_44px_-20px_rgba(15,118,110,0.85)]">
              <BadgePercent className="size-7" />
            </span>
            <h2 className={`${typography.h2} text-deep-teal`}>No products yet — the shelves are empty</h2>
            <p className="max-w-md text-sm leading-relaxed text-slate-500">
              When sellers list products they&apos;ll appear here automatically. Sign in and open
              your store to be the first drop.
            </p>
            <ShimmerButton onClick={() => navigate('/register/seller')}>
              Become a seller
            </ShimmerButton>
          </div>
        )}

        {/* Seller CTA banner */}
        <motion.section
          {...reveal}
          className="relative overflow-hidden rounded-[2rem] bg-deep-teal px-6 py-14 text-center text-white shadow-[0_40px_90px_-45px_rgba(16,42,42,0.95)] sm:px-12"
        >
          <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-coral/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-12 size-72 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="relative">
            <Badge variant="outline" className="border-white/20 bg-white/15 py-1 text-white ring-white/25">
              For sellers
            </Badge>
            <h2 className="mx-auto mt-5 max-w-xl font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
              Turn your hobby into a storefront
            </h2>
            <p className="mx-auto mt-4 max-w-lg leading-relaxed text-white/70">
              Create your store, list products in minutes, and reach customers across the
              marketplace — with payouts, analytics and fulfilment built in.
            </p>
            <Link
              to="/register/seller"
              className={`${buttonVariants({ size: 'lg' })} mt-8 bg-coral text-white shadow-[0_18px_40px_-18px_rgba(255,107,107,0.9)] hover:bg-coral-strong`}
            >
              Open your store
            </Link>
          </div>
        </motion.section>
      </div>

      {/* Quick view — opened from any card, without leaving the page */}
      <ProductQuickView
        product={quickViewProduct}
        open={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        wished={quickViewProduct ? wishedIds.has(quickViewProduct._id?.toString()) : false}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={(product, qty) => {
          setQuickViewProduct(null)
          handleAddToCart(product, qty)
        }}
      />
    </div>
  )
}
