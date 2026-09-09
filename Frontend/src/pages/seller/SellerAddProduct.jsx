import { useNavigate } from 'react-router-dom'
import { PageIntro } from '../../components/seller/PageIntro.jsx'
import { ProductForm } from '../../components/seller/ProductForm.jsx'
import { createProduct } from '../../services/seller.js'
import { useToast } from '../../components/ui/toast.jsx'
import { getErrorMessage } from '../../services/api.js'

export default function SellerAddProduct() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (body) => {
    try {
      const product = await createProduct(body)
      toast({ title: 'Product published', description: `"${product.title}" is live in the catalog.`, variant: 'success' })
      navigate('/seller/products')
    } catch (error) {
      toast({ title: 'Could not create product', description: getErrorMessage(error), variant: 'error' })
      throw error
    }
  }

  return (
    <div>
      <PageIntro title="Add product" subtitle="Fill in the details — the product goes live immediately." />
      <ProductForm onSubmit={handleSubmit} submitLabel="Publish product" />
    </div>
  )
}