import { useEffect, useState } from 'react'
import { Check, CheckCircle2, Plus, RefreshCw, Sparkles, Trash2, Wand2 } from 'lucide-react'
import { Input } from '../ui/Input.jsx'
import { Select } from '../ui/Select.jsx'
import { Button } from '../ui/Button.jsx'
import { Badge } from '../ui/Badge.jsx'
import { useToast } from '../ui/toast.jsx'
import { fetchCategories } from '../../services/catalog.js'
import { generateDescription } from '../../services/seller.js'
import { getErrorMessage } from '../../services/api.js'
import { discountPercent, formatPrice } from '../../lib/format.js'

const EMPTY_VARIANT = { name: '', sku: '', price: '', stock: '' }
const EMPTY_ATTRIBUTE = { name: '', value: '' }

const buildInitial = (product) => {
  if (!product) {
    return {
      title: '',
      brand: '',
      category: '',
      sku: '',
      price: '',
      originalPrice: '',
      stock: '',
      lowStockThreshold: '5',
      description: '',
      features: [],
      attributes: [],
      images: [''],
      variants: [],
      status: 'active',
    }
  }
  return {
    title: product.title || '',
    brand: product.brand || '',
    category: product.category?._id || product.category || '',
    sku: product.sku || '',
    price: product.price ?? '',
    originalPrice: product.originalPrice || '',
    stock: product.stock ?? '',
    lowStockThreshold: product.lowStockThreshold ?? '5',
    description: product.description || '',
    features: product.aiGeneratedFeatures?.length ? [...product.aiGeneratedFeatures] : [],
    attributes: product.attributes?.length
      ? product.attributes.map((attr) => ({ name: attr.name || '', value: attr.value || '' }))
      : [],
    images: product.images?.length ? product.images : [''],
    variants: product.variants?.length
      ? product.variants.map((v) => ({ _id: v._id, name: v.name, sku: v.sku || '', price: v.price ?? '', stock: v.stock ?? '' }))
      : [],
    status: product.status || 'active',
  }
}

// Local copywriter fallback used when the AI API is unavailable (e.g. no API key).
// Composes a decent draft from the entered product details so the demo always works.
const buildOfflineDraft = (details) => {
  const { title, categoryName, brand, price, material, targetAudience, attributes, keywords } = details
  const specList = attributes.filter((attr) => attr.name && attr.value)

  const descriptionParts = [
    `${title}${brand ? ` by ${brand}` : ''}${categoryName ? ` — a ${categoryName.toLowerCase()} pick` : ''}.`,
  ]
  if (material) descriptionParts.push(`Made with ${material.toLowerCase()}, it is designed for everyday use.`)
  if (specList.length > 0) {
    descriptionParts.push(`Key specs: ${specList.map((attr) => `${attr.name} ${attr.value}`).join(', ')}.`)
  }
  if (targetAudience) descriptionParts.push(`A great choice for ${targetAudience.toLowerCase()}.`)
  if (price) descriptionParts.push(`Available on ShopSphere at ${formatPrice(price)}.`)

  const sellingPoints = []
  if (brand) sellingPoints.push(`Trusted ${brand} quality`)
  if (material) sellingPoints.push(`Premium ${material.toLowerCase()} build`)
  for (const attr of specList.slice(0, 3)) sellingPoints.push(`${attr.name}: ${attr.value}`)
  if (targetAudience) sellingPoints.push(`Made for ${targetAudience.toLowerCase()}`)
  for (const keyword of keywords.slice(0, 2)) sellingPoints.push(keyword)
  if (sellingPoints.length === 0) sellingPoints.push('Everyday value', 'ShopSphere verified seller')

  return {
    description: descriptionParts.filter(Boolean).join(' '),
    sellingPoints: sellingPoints.slice(0, 5),
  }
}

export function ProductForm({ product, onSubmit, submitLabel = 'Save product' }) {
  const { toast } = useToast()
  const [form, setForm] = useState(() => buildInitial(product))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState([])

  // ---- AI copy assistant state ----
  const [aiInputs, setAiInputs] = useState({ targetAudience: '', material: '', keywords: '' })
  const [aiResult, setAiResult] = useState(null) // { description, sellingPoints, source }
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [acceptedDescription, setAcceptedDescription] = useState(false)
  const [acceptedFeatures, setAcceptedFeatures] = useState(false)

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  const categoryName = categories.find((category) => category._id === form.category)?.name || ''

  const set = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const setImage = (index) => (event) => {
    setForm((current) => {
      const images = [...current.images]
      images[index] = event.target.value
      return { ...current, images }
    })
  }
  const addImage = () => setForm((current) => ({ ...current, images: [...current.images, ''] }))
  const removeImage = (index) => setForm((current) => ({ ...current, images: current.images.filter((_, i) => i !== index) }))

  const setAttribute = (index, key) => (event) => {
    setForm((current) => {
      const attributes = current.attributes.map((attr, i) => (i === index ? { ...attr, [key]: event.target.value } : attr))
      return { ...current, attributes }
    })
  }
  const addAttribute = () => setForm((current) => ({ ...current, attributes: [...current.attributes, { ...EMPTY_ATTRIBUTE }] }))
  const removeAttribute = (index) => setForm((current) => ({ ...current, attributes: current.attributes.filter((_, i) => i !== index) }))

  const setFeature = (index, value) => {
    setForm((current) => {
      const features = [...current.features]
      features[index] = value
      return { ...current, features }
    })
  }
  const addFeature = () => setForm((current) => ({ ...current, features: [...current.features, ''] }))
  const removeFeature = (index) => setForm((current) => ({ ...current, features: current.features.filter((_, i) => i !== index) }))

  const setVariant = (index, key) => (event) => {
    setForm((current) => {
      const variants = current.variants.map((variant, i) => (i === index ? { ...variant, [key]: event.target.value } : variant))
      return { ...current, variants }
    })
  }
  const addVariant = () => setForm((current) => ({ ...current, variants: [...current.variants, { ...EMPTY_VARIANT }] }))
  const removeVariant = (index) => setForm((current) => ({ ...current, variants: current.variants.filter((_, i) => i !== index) }))

  const validate = () => {
    const next = {}
    if (!form.title.trim()) next.title = 'Title is required'
    if (!form.category) next.category = 'Choose a category'
    if (form.price === '' || Number(form.price) <= 0) next.price = 'Enter a valid price'
    if (form.originalPrice && Number(form.originalPrice) <= 0) next.originalPrice = 'Must be greater than 0'
    if (form.stock !== '' && (Number(form.stock) < 0 || !Number.isInteger(Number(form.stock)))) next.stock = 'Enter a whole number ≥ 0'
    if (!form.description.trim()) next.description = 'Description is required — use the AI assistant or write your own'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  /* ---------------- AI generation ---------------- */
  const parseKeywords = (value) =>
    value
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean)

  const generate = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Add a product title first', description: 'The AI needs a title to write copy for.', variant: 'info' })
      return
    }
    setAiLoading(true)
    setAiError(null)
    const details = {
      title: form.title.trim(),
      categoryName,
      brand: form.brand.trim(),
      price: form.price,
      material: aiInputs.material.trim(),
      targetAudience: aiInputs.targetAudience.trim(),
      keywords: parseKeywords(aiInputs.keywords),
      attributes: form.attributes.filter((attr) => attr.name && attr.value),
    }

    try {
      const result = await generateDescription({
        title: details.title,
        category: categoryName,
        brand: details.brand,
        price: details.price,
        targetAudience: details.targetAudience,
        material: details.material,
        keywords: details.keywords,
      })
      setAiResult({ ...result, source: 'api' })
    } catch (error) {
      // Offline fallback so the demo never breaks — labeled honestly.
      setAiResult({ ...buildOfflineDraft(details), source: 'draft' })
      setAiError(getErrorMessage(error))
    } finally {
      setAiLoading(false)
    }
  }

  const acceptDescription = () => {
    if (!aiResult?.description) return
    setForm((current) => ({ ...current, description: aiResult.description }))
    setAcceptedDescription(true)
    toast({ title: 'Description added', description: 'Review it before publishing — it is fully editable.', variant: 'success' })
  }

  const acceptFeatures = () => {
    if (!aiResult?.sellingPoints?.length) return
    setForm((current) => ({ ...current, features: [...aiResult.sellingPoints] }))
    setAcceptedFeatures(true)
    toast({ title: 'Selling points added', description: `${aiResult.sellingPoints.length} key selling points ready.`, variant: 'success' })
  }

  /* ---------------- Submit ---------------- */
  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    const body = {
      title: form.title.trim(),
      sku: form.sku.trim(),
      brand: form.brand.trim(),
      category: form.category,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : Number(form.price),
      stock: form.stock !== '' ? Number(form.stock) : 0,
      lowStockThreshold: form.lowStockThreshold !== '' ? Number(form.lowStockThreshold) : 5,
      description: form.description.trim(),
      images: form.images.map((url) => url.trim()).filter(Boolean),
      attributes: form.attributes
        .filter((attr) => attr.name.trim())
        .map((attr) => ({ name: attr.name.trim(), value: attr.value.trim() })),
      aiGeneratedFeatures: form.features.map((feature) => feature.trim()).filter(Boolean),
      variants: form.variants
        .filter((variant) => variant.name.trim())
        .map((variant) => ({
          ...(variant._id ? { _id: variant._id } : {}),
          name: variant.name.trim(),
          sku: variant.sku.trim(),
          price: Number(variant.price) || 0,
          stock: Number(variant.stock) || 0,
        })),
      ...(product ? { status: form.status } : {}),
    }

    setSubmitting(true)
    try {
      await onSubmit(body)
    } finally {
      setSubmitting(false)
    }
  }

  const fieldError = (key) =>
    errors[key] ? (
      <p role="alert" className="mt-1 text-xs text-red-600">{errors[key]}</p>
    ) : null

  const discount = discountPercent(Number(form.price), Number(form.originalPrice))

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Basics */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">Product name *</label>
            <Input value={form.title} onChange={set('title')} aria-invalid={!!errors.title} placeholder="e.g. Wireless Bluetooth Earbuds" />
            {fieldError('title')}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Brand</label>
            <Input value={form.brand} onChange={set('brand')} placeholder="e.g. TechNova" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Category *</label>
            <Select value={form.category} onChange={set('category')} aria-invalid={!!errors.category}>
              <option value="">Select a category…</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </Select>
            {fieldError('category')}
          </div>
        </div>
      </section>

      {/* Product attributes */}
      <section className="space-y-3 border-t border-slate-200 pt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Product attributes</h2>
          <Button type="button" variant="outline" size="sm" onClick={addAttribute}><Plus /> Add attribute</Button>
        </div>
        <p className="text-xs text-slate-500">Specs shown in the product details table — e.g. Color, Material, Warranty.</p>
        {form.attributes.length === 0 && <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">No attributes yet.</p>}
        <div className="space-y-2">
          {form.attributes.map((attribute, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input value={attribute.name} onChange={setAttribute(index, 'name')} placeholder="Name (e.g. Color)" className="max-w-[180px]" />
              <Input value={attribute.value} onChange={setAttribute(index, 'value')} placeholder="Value (e.g. Midnight Black)" className="flex-1" />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeAttribute(index)} aria-label="Remove attribute" className="text-slate-500 hover:text-red-600">
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>
      {/* Pricing & stock */}
      <section className="space-y-4 border-t border-slate-200 pt-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pricing & stock</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Selling price (₹) *</label>
            <Input type="number" min="0" value={form.price} onChange={set('price')} aria-invalid={!!errors.price} placeholder="699" />
            {fieldError('price')}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">MRP / discount base (₹)</label>
            <Input type="number" min="0" value={form.originalPrice} onChange={set('originalPrice')} aria-invalid={!!errors.originalPrice} placeholder="999" />
            {fieldError('originalPrice')}
          </div>
          <div className="flex items-end pb-1">
            {discount ? (
              <Badge variant="danger" className="mb-0.5">-{discount}% off</Badge>
            ) : (
              <span className="text-xs text-slate-500">Set a higher MRP to show a discount badge.</span>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">SKU</label>
            <Input value={form.sku} onChange={set('sku')} placeholder="e.g. TN-EARBUD-128" />
            <p className="mt-1 text-xs text-slate-500">Your internal stock-keeping code.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Stock</label>
            <Input type="number" min="0" value={form.stock} onChange={set('stock')} aria-invalid={!!errors.stock} placeholder="50" />
            {fieldError('stock')}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Low-stock threshold</label>
            <Input type="number" min="0" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} placeholder="5" />
          </div>
        </div>
        {product && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">Status</label>
            <Select value={form.status} onChange={set('status')}>
              <option value="active">Active (visible to customers)</option>
              <option value="inactive">Inactive (hidden from storefront)</option>
            </Select>
          </div>
        )}
      </section>


      {/* AI copy assistant */}
      <section className="space-y-4 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-slate-50 to-fuchsia-50 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Wand2 className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold">AI copy assistant</h2>
            <p className="text-xs text-slate-500">Generate a ready-to-publish description and key selling points from your product details.</p>
          </div>
          <Badge variant="secondary">Beta</Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Target audience</label>
            <Input value={aiInputs.targetAudience} onChange={(event) => setAiInputs((current) => ({ ...current, targetAudience: event.target.value }))} placeholder="e.g. college students, gym-goers" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Material / features</label>
            <Input value={aiInputs.material} onChange={(event) => setAiInputs((current) => ({ ...current, material: event.target.value }))} placeholder="e.g. stainless steel, 12h battery" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Keywords</label>
            <Input value={aiInputs.keywords} onChange={(event) => setAiInputs((current) => ({ ...current, keywords: event.target.value }))} placeholder="comma, separated, tags" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" onClick={generate} disabled={aiLoading || !form.title.trim()} loading={aiLoading}>
            {aiLoading ? (
              <>Writing copy…</>
            ) : aiResult ? (
              <><RefreshCw /> Regenerate</>
            ) : (
              <><Sparkles /> Generate with AI</>
            )}
          </Button>
          {!form.title.trim() && <p className="text-xs text-slate-500">Add a product name above first.</p>}
        </div>

        {aiError && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <Sparkles className="mt-0.5 size-3.5 shrink-0" />
            <p><span className="font-semibold">AI service unavailable</span> — {aiError}. Showing an offline draft instead; it is fully editable.</p>
          </div>
        )}

        {aiResult && (
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant={aiResult.source === 'api' ? 'success' : 'warning'}>
                {aiResult.source === 'api' ? '✦ AI generated' : 'Offline draft'}
              </Badge>
              <p className="text-xs text-slate-500">Editable — tweak the copy below, then accept it.</p>
            </div>

            {/* Generated description */}
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label className="text-sm font-medium">Product description</label>
                <Button
                  type="button"
                  size="sm"
                  variant={acceptedDescription ? 'success' : 'outline'}
                  disabled={acceptedDescription}
                  onClick={acceptDescription}
                >
                  {acceptedDescription ? <><CheckCircle2 /> Accepted</> : <><Check /> Accept</>}
                </Button>
              </div>
              <textarea
                value={aiResult.description}
                onChange={(event) => setAiResult((current) => ({ ...current, description: event.target.value }))}
                rows={4}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              />
            </div>

            {/* Generated selling points */}
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label className="text-sm font-medium">Key selling points</label>
                <Button
                  type="button"
                  size="sm"
                  variant={acceptedFeatures ? 'success' : 'outline'}
                  disabled={acceptedFeatures}
                  onClick={acceptFeatures}
                >
                  {acceptedFeatures ? <><CheckCircle2 /> Accepted</> : <><Check /> Accept</>}
                </Button>
              </div>
              <ul className="space-y-1.5">
                {aiResult.sellingPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Sparkles className="mt-2 size-3.5 shrink-0 text-indigo-600" />
                    <input
                      value={point}
                      onChange={(event) =>
                        setAiResult((current) => {
                          const sellingPoints = [...current.sellingPoints]
                          sellingPoints[index] = event.target.value
                          return { ...current, sellingPoints }
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Description */}
      <section className="space-y-2 border-t border-slate-200 pt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Description</h2>
          {form.features.length > 0 && <Badge variant="secondary">{form.features.length} selling point{form.features.length > 1 ? 's' : ''}</Badge>}
        </div>
        <textarea
          value={form.description}
          onChange={set('description')}
          rows={5}
          aria-invalid={!!errors.description}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          placeholder="Describe the product, materials, what's in the box… (or let the AI assistant draft it above)"
        />
        {fieldError('description')}

        {form.features.length > 0 && (
          <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Key selling points</p>
            {form.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Sparkles className="size-3.5 shrink-0 text-indigo-600" />
                <input
                  value={feature}
                  onChange={(event) => setFeature(index, event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(index)} aria-label="Remove selling point" className="size-7 text-slate-500 hover:text-red-600">
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={addFeature} className="text-indigo-600"><Plus /> Add point</Button>
          </div>
        )}
      </section>

      {/* Images */}
      <section className="space-y-3 border-t border-slate-200 pt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Images</h2>
          <Button type="button" variant="outline" size="sm" onClick={addImage}><Plus /> Add image</Button>
        </div>
        <p className="text-xs text-slate-500">Paste image URLs (one per row). The first image is the cover.</p>
        <div className="space-y-2">
          {form.images.map((url, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input value={url} onChange={setImage(index)} placeholder="https://…" />
              {form.images.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeImage(index)} aria-label="Remove image" className="text-slate-500 hover:text-red-600">
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Variants */}
      <section className="space-y-3 border-t border-slate-200 pt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Variants (optional)</h2>
          <Button type="button" variant="outline" size="sm" onClick={addVariant}><Plus /> Add variant</Button>
        </div>
        <p className="text-xs text-slate-500">e.g. "Size: M, Color: Blue" with its own SKU, price and stock.</p>
        {form.variants.length === 0 && <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">No variants — this product sells as a single item.</p>}
        <div className="space-y-3">
          {form.variants.map((variant, index) => (
            <div key={index} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <Input value={variant.name} onChange={setVariant(index, 'name')} placeholder="Variant name (e.g. 128GB, Black)" className="flex-1" />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(index)} aria-label="Remove variant" className="text-slate-500 hover:text-red-600">
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input value={variant.sku} onChange={setVariant(index, 'sku')} placeholder="SKU" />
                <Input type="number" min="0" value={variant.price} onChange={setVariant(index, 'price')} placeholder="Price ₹" />
                <Input type="number" min="0" value={variant.stock} onChange={setVariant(index, 'stock')} placeholder="Stock" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
        <Button type="submit" loading={submitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}
