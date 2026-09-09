import { useState } from 'react'
import { Pencil, Percent, Plus, Tag, Trash2 } from 'lucide-react'
import { PageIntro } from '../../components/seller/PageIntro.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../services/admin.js'
import { useToast } from '../../components/ui/toast.jsx'
import { getErrorMessage } from '../../services/api.js'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { cn } from '../../lib/utils.js'

const EMPTY_FORM = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '',
  maxDiscount: '',
  expiryDate: '',
  usageLimit: '100',
  isActive: true,
}

export default function AdminCoupons() {
  const { toast } = useToast()
  const { data: coupons, loading, refetch } = useFetch(fetchCoupons)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) })
    setErrors({})
    setEditing('new')
  }

  const openEdit = (coupon) => {
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minOrderAmount: coupon.minOrderAmount ? String(coupon.minOrderAmount) : '',
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : '',
      expiryDate: new Date(coupon.expiryDate).toISOString().slice(0, 10),
      usageLimit: String(coupon.usageLimit),
      isActive: coupon.isActive,
    })
    setErrors({})
    setEditing(coupon)
  }

  const validate = () => {
    const next = {}
    if (!form.code.trim()) next.code = 'Coupon code is required'
    if (!form.discountValue || Number(form.discountValue) <= 0) next.discountValue = 'Enter a valid discount value'
    if (!form.expiryDate) next.expiryDate = 'Expiry date is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const save = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const body = {
        code: form.code.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : 0,
        expiryDate: new Date(form.expiryDate).toISOString(),
        usageLimit: form.usageLimit ? Number(form.usageLimit) : 100,
        isActive: form.isActive,
      }
      if (editing === 'new') {
        await createCoupon(body)
        toast({ title: 'Coupon created', description: `${form.code.toUpperCase()} is ready to share.`, variant: 'success' })
      } else {
        await updateCoupon(editing._id, body)
        toast({ title: 'Coupon updated', description: `${form.code.toUpperCase()} saved.`, variant: 'success' })
      }
      setEditing(null)
      refetch()
    } catch (error) {
      toast({ title: 'Could not save coupon', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (coupon) => {
    setBusyId(coupon._id)
    try {
      await updateCoupon(coupon._id, { isActive: !coupon.isActive })
      toast({
        title: coupon.isActive ? 'Coupon deactivated' : 'Coupon activated',
        description: `${coupon.code} is now ${coupon.isActive ? 'disabled' : 'active'}.`,
        variant: 'info',
      })
      refetch()
    } catch (error) {
      toast({ title: 'Could not update coupon', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteCoupon(deleteTarget._id)
      toast({ title: 'Coupon deleted', description: `${deleteTarget.code} removed.`, variant: 'success' })
      setDeleteTarget(null)
      refetch()
    } catch (error) {
      toast({ title: 'Could not delete coupon', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const expired = (coupon) => new Date(coupon.expiryDate) < new Date()

  return (
    <div>
      <PageIntro
        title="Coupon management"
        subtitle="Discount codes customers apply at checkout."
        actions={<Button onClick={openCreate}><Plus /> New coupon</Button>}
      />

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      ) : coupons?.length ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Code</th>
                <th className="px-5 py-3 font-semibold">Discount</th>
                <th className="hidden px-5 py-3 font-semibold md:table-cell">Min order</th>
                <th className="hidden px-5 py-3 font-semibold md:table-cell">Usage</th>
                <th className="px-5 py-3 font-semibold">Expires</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coupons.map((coupon) => {
                const isExpired = expired(coupon)
                return (
                  <tr key={coupon._id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1 font-mono text-xs font-bold tracking-wide">
                        <Tag className="size-3 text-primary" /> {coupon.code}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium">
                      {coupon.discountType === 'percentage' ? (
                        <span className="inline-flex items-center gap-1"><Percent className="size-3.5 text-muted-foreground" />{coupon.discountValue}%{coupon.maxDiscount > 0 ? ` (max ₹${coupon.maxDiscount})` : ''}</span>
                      ) : (
                        `₹${coupon.discountValue} off`
                      )}
                    </td>
                    <td className="hidden px-5 py-3 text-muted-foreground md:table-cell">{coupon.minOrderAmount ? `₹${coupon.minOrderAmount}` : 'None'}</td>
                    <td className="hidden px-5 py-3 text-muted-foreground md:table-cell">{coupon.usedCount} / {coupon.usageLimit}</td>
                    <td className="px-5 py-3">
                      <span className={cn('text-muted-foreground', isExpired && 'font-medium text-destructive')}>
                        {new Date(coupon.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {!coupon.isActive ? <Badge variant="neutral">Inactive</Badge> : isExpired ? <Badge variant="danger">Expired</Badge> : <Badge variant="success">Active</Badge>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="outline" size="sm" loading={busyId === coupon._id} onClick={() => toggleActive(coupon)}>
                          {coupon.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(coupon)}><Pencil /> Edit</Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(coupon)} aria-label={`Delete ${coupon.code}`}>
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Tag className="size-6" /></span>
          <h2 className="text-base font-semibold">No coupons yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">Create promo codes like SAVE10 or FLAT50 to drive sales.</p>
          <Button className="mt-2" onClick={openCreate}><Plus /> New coupon</Button>
        </div>
      )}

      {/* Create / edit modal */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'New coupon' : `Edit ${editing?.code}`}
        description="Customers enter the code at checkout."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button loading={saving} onClick={save}>{editing === 'new' ? 'Create coupon' : 'Save changes'}</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Code *</label>
            <Input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} placeholder="SAVE10" aria-invalid={!!errors.code} className="font-mono" />
            {errors.code && <p role="alert" className="mt-1 text-xs text-destructive">{errors.code}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Discount type</label>
            <Select value={form.discountType} onChange={(event) => setForm((current) => ({ ...current, discountType: event.target.value }))}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed (₹)</option>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Discount value *</label>
            <Input type="number" min="1" value={form.discountValue} onChange={(event) => setForm((current) => ({ ...current, discountValue: event.target.value }))} placeholder={form.discountType === 'percentage' ? '10' : '50'} aria-invalid={!!errors.discountValue} />
            {errors.discountValue && <p role="alert" className="mt-1 text-xs text-destructive">{errors.discountValue}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Max discount (₹, optional)</label>
            <Input type="number" min="0" value={form.maxDiscount} onChange={(event) => setForm((current) => ({ ...current, maxDiscount: event.target.value }))} placeholder="0 = no cap" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Minimum order (₹)</label>
            <Input type="number" min="0" value={form.minOrderAmount} onChange={(event) => setForm((current) => ({ ...current, minOrderAmount: event.target.value }))} placeholder="0 = no minimum" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Usage limit</label>
            <Input type="number" min="1" value={form.usageLimit} onChange={(event) => setForm((current) => ({ ...current, usageLimit: event.target.value }))} placeholder="100" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">Expiry date *</label>
            <Input type="date" value={form.expiryDate} onChange={(event) => setForm((current) => ({ ...current, expiryDate: event.target.value }))} aria-invalid={!!errors.expiryDate} />
            {errors.expiryDate && <p role="alert" className="mt-1 text-xs text-destructive">{errors.expiryDate}</p>}
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              className="size-4 accent-primary"
            />
            Active immediately
          </label>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete coupon?"
        description={`"${deleteTarget?.code}" will no longer work at checkout.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" loading={deleting} onClick={handleDelete}><Trash2 /> Delete</Button>
          </>
        }
      />
    </div>
  )
}