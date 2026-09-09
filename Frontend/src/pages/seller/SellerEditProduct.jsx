import { useNavigate, useParams } from 'react-router-dom'
import { PageIntro } from '../../components/seller/PageIntro.jsx'
import { ProductForm } from '../../components/seller/ProductForm.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchMyProducts, updateProduct } from '../../services/seller.js'
import { useToast } from '../../components/ui/toast.jsx'
import { getErrorMessage } from '../../services/api.js'

export default function SellerEditProduct() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: products, loading } = useFetch(fetchMyProducts)

  const product = products?.find((item) => item._id === productId)

  const handleSubmit = async (body) => {
    try {
      const updated = await updateProduct(productId, body)
      toast({ title: 'Product updated', description: `"${updated.title}" saved.`, variant: 'success' })
      navigate('/seller/products')
    } catch (error) {
      toast({ title: 'Could not update product', description: getErrorMessage(error), variant: 'error' })
      throw error
    }
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-muted" />
  }

  if (!product) {
    return (
      <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center">
        <h2 className="text-base font-semibold">Product not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">It may have been deleted or you don't have access to it.</p>
      </div>
    )
  }

  return (
    <div>
      <PageIntro title="Edit product" subtitle={`Editing "${product.title}".`} />
      <ProductForm product={product} onSubmit={handleSubmit} submitLabel="Save changes" />
    </div>
  )
}