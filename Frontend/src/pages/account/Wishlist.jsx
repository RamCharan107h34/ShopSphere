import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Heart } from 'lucide-react'
import { useToast } from '../../components/ui/toast.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { ProductGrid } from '../../components/customer/ProductGrid.jsx'
import { useCart } from '../../context/CartContext.jsx'
import { fetchWishlist } from '../../services/account.js'
import { addToCart, removeFromWishlist } from '../../services/catalog.js'
import { getErrorMessage } from '../../services/api.js'

export default function Wishlist() {
  const { toast } = useToast()
  const { refreshCount } = useCart()

  const [products, setProducts] = useState(null)
  const [error, setError] = useState(null)

  const load = async () => {
    try {
      setProducts(await fetchWishlist())
    } catch (err) {
      setError(err)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleToggleWishlist = async (product) => {
    const id = product._id
    try {
      await removeFromWishlist(id)
      setProducts((current) => (current || []).filter((p) => p._id !== id))
      toast({ title: 'Removed from wishlist', description: product.title, variant: 'info' })
    } catch (error) {
      toast({ title: 'Something went wrong', description: getErrorMessage(error), variant: 'error' })
    }
  }

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product._id)
      refreshCount()
      toast({ title: 'Added to cart', description: product.title, variant: 'success' })
    } catch (error) {
      toast({ title: 'Could not add item', description: getErrorMessage(error), variant: 'error' })
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="font-semibold">Couldn't load your wishlist</p>
        <Button variant="outline" onClick={load}>Try again</Button>
      </div>
    )
  }

  if (!products) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Wishlist</h2>
          <p className="text-sm text-slate-500">
            {products.length === 0 ? 'Nothing saved yet' : `${products.length} saved ${products.length === 1 ? 'item' : 'items'}`}
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-rose-50">
            <Heart className="size-8 text-rose-400" />
          </span>
          <h3 className="text-lg font-semibold">Your wishlist is empty</h3>
          <p className="max-w-sm text-sm text-slate-500">
            Tap the heart on any product to save it here for later.
          </p>
          <Link to="/products">
            <Button size="lg">
              Explore products <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <ProductGrid
          products={products}
          wishlistMode
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
        />
      )}
    </div>
  )
}
