import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BadgePercent,
  Headset,
  LayoutGrid,
  PackageOpen,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
} from 'lucide-react'
import { useToast } from '../components/ui/toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useFetch } from '../hooks/useFetch.js'
import { Button, buttonVariants } from '../components/ui/Button.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Input } from '../components/ui/Input.jsx'
import { ShimmerButton } from '../components/magic/ShimmerButton.jsx'
import { ProductGrid } from '../components/customer/ProductGrid.jsx'
import { SectionHeader } from '../components/customer/SectionHeader.jsx'
import {
  addToCart,
  addToWishlist,
  fetchCategories,
  fetchProducts,
  fetchTopPicks,
  removeFromWishlist,
} from '../services/catalog.js'
import { getErrorMessage } from '../services/api.js'
import api from '../services/api.js'
import { isPlaceholderImage } from '../lib/utils.js'

const categoryTints = [
  'from-brand-500 to-brand-700',
  'from-fuchsia-500 to-fuchsia-700',
  'from-sky-500 to-sky-700',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-emerald-700',
  'from-rose-500 to-rose-700',
  'from-indigo-500 to-indigo-700',
  'from-teal-500 to-teal-700',
]

const perks = [
  { icon: Truck, title: 'Fast delivery', text: 'Live tracking on every order' },
  { icon: RotateCcw, title: 'Easy returns', text: '14-day hassle-free policy' },
  { icon: ShieldCheck, title: 'Secure checkout', text: 'Verified sellers only' },
  { icon: Headset, title: 'Support 24/7', text: 'Real humans, quick replies' },
]


export default function Home() {
  const { user } = useAuth()
  const { refreshCount } = useCart()
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
  const recommendedState = useFetch(
    () => fetchProducts({ sort: 'rating', limit: 8 }).then((p) => p.products),
    [],
  )

  // ---- Search ----------------------------------------------------------
  const [query, setQuery] = useState('')

  const goToProducts = (search = '') => {
    navigate(search ? `/products?search=${encodeURIComponent(search)}` : '/products')
  }

  const submitSearch = (event) => {
    event?.preventDefault()
    const value = query.trim()
    if (!value) return
    goToProducts(value)
  }

  const goToCategory = (category) => navigate(`/products?category=${category._id}`)

  // ---- Wishlist ids (only when signed in) ------------------------------
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

  // ---- Product actions -------------------------------------------------
  const requireSignIn = () => {
    toast({ title: 'Sign in required', description: 'Create an account or sign in to continue.', variant: 'info' })
    navigate('/login')
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
  const heroImage = trendingProducts.find((product) => !isPlaceholderImage(product.images?.[0]))

  const sections = [
    {
      id: 'featured',
      title: 'Featured products',
      subtitle: 'Freshly listed across our verified stores',
      state: featuredState,
    },
    {
      id: 'trending',
      title: 'Trending now',
      subtitle: 'Ranked by rating, reviews and recency',
      state: trendingState,
      icon: true,
    },
    {
      id: 'best-sellers',
      title: 'Best sellers',
      subtitle: 'The most popular picks with shoppers',
      state: bestSellersState,
    },
    {
      id: 'recommended',
      title: 'Recommended for you',
      subtitle: 'Top-rated finds worth a closer look',
      state: recommendedState,
    },
  ]

  const anyProducts =
    (featuredState.data?.length || 0) + (trendingState.data?.length || 0) > 0
  const loadingHome = featuredState.loading || trendingState.loading

  return (
    <div>
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-50 via-background to-fuchsia-50/40" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 45% 45% at 78% 20%, color-mix(in srgb, var(--primary) 12%, transparent), transparent)',
          }}
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pb-20 lg:pt-20">
          {/* Copy + search */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Badge className="gap-1.5 border-brand-200/70 bg-brand-50 text-brand-700">
                <Store className="size-3" /> India&apos;s multi-vendor marketplace
              </Badge>
            </motion.div>

            <motion.h1
              className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
            >
              Shop anything from
              <br />
              <span className="bg-gradient-to-r from-brand-600 to-fuchsia-500 bg-clip-text text-transparent">
                stores you trust
              </span>
            </motion.h1>

            <motion.p
              className="mt-4 max-w-lg text-lg text-muted-foreground"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
            >
              Thousands of products from independent sellers — one cart, one checkout, delivered
              to your door.
            </motion.p>

            {/* Search */}
            <motion.form
              onSubmit={submitSearch}
              className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-brand-200 bg-card p-2 shadow-elevated ring-1 ring-brand-100"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24 }}
            >
              <Sparkles className="ml-2 size-5 shrink-0 text-brand-500" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Describe it — “comfortable headphones for gaming”…"
                className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0"
                aria-label="Search products"
              />
              <Button type="submit" className="h-11 shrink-0 px-5">
                Search
              </Button>
            </motion.form>

            {/* Quick category chips */}
            {categoriesState.data?.length > 0 && (
              <motion.div
                className="mt-5 flex flex-wrap items-center gap-2 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <span className="text-muted-foreground">Popular:</span>
                {categoriesState.data.slice(0, 5).map((category) => (
                  <button
                    key={category._id}
                    onClick={() => goToCategory(category)}
                    className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-brand-300 hover:text-brand-700"
                  >
                    {category.name}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Hero visual */}
          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="relative mx-auto aspect-[4/3] max-w-md overflow-hidden rounded-3xl border border-border shadow-elevated">
              {heroImage ? (
                <img
                  src={heroImage.images[0]}
                  alt={heroImage.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand-600 to-brand-900 p-8 text-center text-white">
                  <PackageOpen className="size-14 opacity-80" />
                  <p className="text-lg font-semibold">The marketplace opens here</p>
                  <p className="text-sm text-brand-100/80">
                    Stores are onboarding right now — check back for fresh drops.
                  </p>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/25 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl bg-white/90 px-4 py-3 backdrop-blur">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {heroImage?.brand || 'ShopSphere'}
                  </p>
                  <p className="max-w-[200px] truncate text-sm font-bold">
                    {heroImage?.title || 'New arrivals every week'}
                  </p>
                </div>
                <Badge variant="default" className="shrink-0">Explore →</Badge>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Perks strip */}
        <div className="relative border-t border-border bg-card/60 backdrop-blur">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-4">
            {perks.map((perk) => (
              <div key={perk.title} className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <perk.icon className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{perk.title}</p>
                  <p className="text-xs text-muted-foreground">{perk.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CATEGORIES ============================= */}
      <section id="categories" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <SectionHeader
            title="Shop by category"
            subtitle="Browse curated collections from our sellers"
            action={
              <button
                onClick={() => navigate('/products')}
                className="text-sm font-medium text-primary hover:underline"
              >
                View all products
              </button>
            }
          />
          {categoriesState.loading ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-28 w-40 shrink-0 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : categoriesState.data?.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categoriesState.data.map((category, index) => (
                <button
                  key={category._id}
                  onClick={() => goToCategory(category)}
                  className="group w-36 shrink-0 text-left sm:w-40"
                >
                  <div
                    className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${categoryTints[index % categoryTints.length]} text-white shadow-sm transition-all group-hover:-translate-y-1 group-hover:shadow-elevated`}
                  >
                    {!isPlaceholderImage(category.image) ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <LayoutGrid className="size-10 opacity-90 transition-transform duration-300 group-hover:scale-110" />
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/60 to-transparent p-3 pt-8" />
                    <span className="absolute bottom-2.5 left-3 text-sm font-semibold drop-shadow">
                      {category.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Categories are being added by the admin.</p>
          )}
        </div>
      </section>

      {/* ================== PRODUCT SECTIONS ========================== */}
      <div className="mx-auto max-w-7xl space-y-14 px-4 pb-20 sm:px-6">
        {sections.map((section) => {
          const sectionProducts = section.state.data || []
          if (!section.state.loading && sectionProducts.length === 0) return null

          return (
            <motion.section
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <SectionHeader
                title={
                  <span className="flex items-center gap-2">
                    {section.icon && <Sparkles className="size-5 text-brand-500" />}
                    {section.title}
                  </span>
                }
                subtitle={section.subtitle}
                action={
                  <button
                    onClick={() => navigate('/products')}
                    className="hidden text-sm font-medium text-primary hover:underline sm:block"
                  >
                    View all
                  </button>
                }
              />
              <ProductGrid
                products={section.state.data}
                loading={section.state.loading}
                wishedIds={wishlistLoaded ? wishedIds : new Set()}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
              />
            </motion.section>
          )
        })}

        {/* Empty-catalog helper when nothing is seeded yet */}
        {!loadingHome && !anyProducts && (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-50">
              <BadgePercent className="size-8 text-brand-600" />
            </span>
            <h2 className="text-2xl font-bold">No products yet — the shelves are empty</h2>
            <p className="max-w-md text-muted-foreground">
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-950 px-6 py-12 text-center text-white sm:px-12"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 size-64 rounded-full bg-fuchsia-400/20 blur-2xl" />
          <div className="relative">
            <Badge className="border-white/20 bg-white/15 text-white">For sellers</Badge>
            <h2 className="mx-auto mt-4 max-w-xl text-3xl font-bold tracking-tight">
              Turn your hobby into a storefront
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-brand-100/90">
              Create your store, list products in minutes, and reach customers across the
              marketplace.
            </p>
            <Link
              to="/register/seller"
              className={`${buttonVariants({ size: 'lg' })} mt-6 bg-white !text-brand-700 hover:bg-brand-50`}
            >
              Open your store
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
