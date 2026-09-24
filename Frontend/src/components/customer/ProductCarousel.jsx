import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard, ProductCardSkeleton } from './ProductCard.jsx'

export function ProductCarousel({
  products,
  loading = false,
  wishedIds = new Set(),
  onAddToCart,
  onToggleWishlist,
  onQuickView,
}) {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [products])

  const scroll = (direction) => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = 280
    const scrollAmount = direction === 'left' ? -cardWidth * 2 : cardWidth * 2
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    setTimeout(checkScroll, 350)
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden pb-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="w-64 shrink-0 sm:w-72">
            <ProductCardSkeleton />
          </div>
        ))}
      </div>
    )
  }

  if (!products || products.length === 0) return null

  return (
    <div className="relative group/carousel">
      {/* Left Navigation Arrow */}
      <button
        onClick={() => scroll('left')}
        disabled={!canScrollLeft}
        aria-label="Scroll left"
        className={`absolute -left-3 sm:-left-5 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-[#102A2A]/10 transition duration-200 hover:bg-[#FFE3D8] hover:text-[#FF6B6B] disabled:pointer-events-none disabled:opacity-0 ${
          canScrollLeft ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <ChevronLeft className="size-5 text-[#102A2A]" />
      </button>

      {/* Right Navigation Arrow */}
      <button
        onClick={() => scroll('right')}
        disabled={!canScrollRight}
        aria-label="Scroll right"
        className={`absolute -right-3 sm:-right-5 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-[#102A2A]/10 transition duration-200 hover:bg-[#FFE3D8] hover:text-[#FF6B6B] disabled:pointer-events-none disabled:opacity-0 ${
          canScrollRight ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <ChevronRight className="size-5 text-[#102A2A]" />
      </button>

      {/* Smooth scrolling container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4.5 overflow-x-auto pb-4 pt-1 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <div key={product._id} className="w-[260px] shrink-0 sm:w-[280px]">
            <ProductCard
              product={product}
              wished={wishedIds.has(product._id)}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              onQuickView={onQuickView}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
