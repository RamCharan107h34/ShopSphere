import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Building2, Save } from 'lucide-react'
import { PageIntro } from '../../components/seller/PageIntro.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchMyStore, updateMyStore } from '../../services/seller.js'
import { useToast } from '../../components/ui/toast.jsx'
import { getErrorMessage } from '../../services/api.js'
import { isPlaceholderImage } from '../../lib/utils.js'
import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Badge } from '../../components/ui/Badge.jsx'

const STORE_STATUS = {
  approved: { label: 'Approved', variant: 'success' },
  pending: { label: 'Pending review', variant: 'warning' },
  rejected: { label: 'Rejected', variant: 'danger' },
}

function StoreForm({ store, onSaved }) {
  const { toast } = useToast()
  const [form, setForm] = useState(() => ({
    storeName: store.storeName || '',
    description: store.description || '',
    logo: store.logo || '',
    banner: store.banner || '',
    contactEmail: store.contactEmail || '',
    contactPhone: store.contactPhone || '',
    street: store.address?.street || '',
    city: store.address?.city || '',
    state: store.address?.state || '',
    pincode: store.address?.pincode || '',
  }))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const validate = () => {
    const next = {}
    if (!form.storeName.trim()) next.storeName = 'Store name is required'
    if (!form.contactEmail.trim()) next.contactEmail = 'Contact email is required'
    else if (!/^\S+@\S+\.\S+$/.test(form.contactEmail)) next.contactEmail = 'Enter a valid email'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await updateMyStore({
        storeName: form.storeName.trim(),
        description: form.description,
        logo: form.logo,
        banner: form.banner,
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        },
      })
      toast({ title: 'Store updated', description: 'Your store profile has been saved.', variant: 'success' })
      await onSaved()
    } catch (error) {
      toast({ title: 'Could not save store', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card">
      {/* Banner preview */}
      <div className="overflow-hidden rounded-xl border border-border">
        {!isPlaceholderImage(form.banner) ? (
          <img src={form.banner} alt="Store banner" className="h-28 w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        ) : (
          <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-primary/20 via-primary/5 to-transparent text-sm text-muted-foreground">
            Banner preview
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium">Store name *</label>
          <Input value={form.storeName} onChange={set('storeName')} aria-invalid={!!errors.storeName} placeholder="e.g. TechNova Store" />
          {errors.storeName && <p role="alert" className="mt-1 text-xs text-destructive">{errors.storeName}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium">Description</label>
          <textarea
            value={form.description}
            onChange={set('description')}
            rows={3}
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="What do you sell? Tell customers about your store."
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Logo URL</label>
          <Input value={form.logo} onChange={set('logo')} placeholder="https://…" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Banner URL</label>
          <Input value={form.banner} onChange={set('banner')} placeholder="https://…" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Contact email *</label>
          <Input type="email" value={form.contactEmail} onChange={set('contactEmail')} aria-invalid={!!errors.contactEmail} />
          {errors.contactEmail && <p role="alert" className="mt-1 text-xs text-destructive">{errors.contactEmail}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Contact phone</label>
          <Input value={form.contactPhone} onChange={set('contactPhone')} placeholder="+91 …" />
        </div>

        <div className="sm:col-span-2">
          <p className="mb-1.5 text-sm font-medium">Business address</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input value={form.street} onChange={set('street')} placeholder="Street address" />
            </div>
            <Input value={form.city} onChange={set('city')} placeholder="City" />
            <Input value={form.state} onChange={set('state')} placeholder="State" />
            <Input value={form.pincode} onChange={set('pincode')} placeholder="PIN code" className="sm:col-span-2" />
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" loading={saving}>
          <Save /> Save changes
        </Button>
      </div>
    </form>
  )
}

export default function SellerStoreProfile() {
  const { reload } = useOutletContext()
  const { data, loading } = useFetch(fetchMyStore)

  const store = data?.store
  const seller = data?.sellerDetails

  return (
    <div>
      <PageIntro title="Store profile" subtitle="Your public storefront identity — customers see this on product pages." />

      {loading || !store ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <StoreForm key={store._id} store={store} onSaved={reload} />

          {/* Store snapshot */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Building2 className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{store.storeName}</p>
                  {STORE_STATUS[store.status] && (
                    <Badge variant={STORE_STATUS[store.status].variant} className="mt-0.5">{STORE_STATUS[store.status].label}</Badge>
                  )}
                </div>
              </div>
              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Commission rate</dt>
                  <dd className="font-medium">{store.commissionRate}%</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Owner</dt>
                  <dd className="truncate font-medium">{seller?.name || '—'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Owner email</dt>
                  <dd className="truncate font-medium">{seller?.email || '—'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Joined</dt>
                  <dd className="font-medium">{new Date(store.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</dd>
                </div>
              </dl>
            </div>
            {store.status === 'rejected' && store.rejectionReason && (
              <div className="rounded-2xl border border-danger/30 bg-danger-50 p-4 text-sm">
                <p className="font-semibold text-danger-600">Rejection reason</p>
                <p className="mt-1 text-danger-600/80">{store.rejectionReason}</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}