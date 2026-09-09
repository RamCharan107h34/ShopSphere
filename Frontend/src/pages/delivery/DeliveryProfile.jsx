import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, CalendarDays, Mail, Phone, Save, Truck, UserRound } from 'lucide-react'
import { PageIntro } from '../../components/seller/PageIntro.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../components/ui/toast.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Label } from '../../components/ui/Label.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { fetchProfile, updateProfile } from '../../services/account.js'
import { getErrorMessage } from '../../services/api.js'

const validate = (form) => {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Name is required'
  if (form.phone && !/^\d{10}$/.test(form.phone.trim())) errors.phone = 'Phone must be 10 digits'
  return errors
}

export default function DeliveryProfile() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', phone: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchProfile()
      .then((data) => {
        if (cancelled) return
        setProfile(data)
        setForm({ name: data.name || '', phone: data.phone || '' })
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const memberSince = useMemo(() => {
    const date = profile?.createdAt || user?.createdAt
    return date
      ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—'
  }, [profile, user])

  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }))

  const handleSave = async () => {
    const validation = validate(form)
    setErrors(validation)
    if (Object.keys(validation).length > 0) {
      toast({ title: 'Check the highlighted fields', variant: 'error' })
      return
    }
    setSaving(true)
    try {
      const updated = await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
      })
      setProfile(updated)
      updateUser(updated)
      toast({ title: 'Profile updated', description: 'Your changes have been saved.', variant: 'success' })
    } catch (error) {
      toast({ title: 'Could not save profile', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  const display = profile || user
  const initials = (display.name || '?')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const fieldClass = (name) => (errors[name] ? 'border-danger-400 focus-visible:ring-danger-300' : '')

  return (
    <div className="space-y-5">
      <PageIntro title="Profile" subtitle="Keep your contact details current — sellers and customers may call you." />

      {/* Summary card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="h-20 bg-gradient-to-r from-brand-600 via-primary to-fuchsia-500" />
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
          <span className="-mt-14 flex size-20 items-center justify-center rounded-2xl border-4 border-card bg-white text-xl font-black text-primary shadow-card">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">{display.name}</h2>
              <Badge variant="success">
                <Truck className="size-3" /> Delivery partner
              </Badge>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5" /> {display.email}
              </span>
              {display.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3.5" /> {display.phone}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" /> Partner since {memberSince}
              </span>
            </div>
          </div>
          <Badge variant="outline" className="self-start">
            <BadgeCheck className="size-3 text-primary" /> Active partner
          </Badge>
        </div>
      </div>

      {/* Edit form */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
        <h3 className="flex items-center gap-2 font-semibold">
          <UserRound className="size-4 text-primary" /> Personal details
        </h3>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="delivery-name">Full name *</Label>
            <Input
              id="delivery-name"
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              aria-invalid={Boolean(errors.name)}
              className={`mt-1.5 ${fieldClass('name')}`}
            />
            {errors.name && <p role="alert" className="mt-1 text-xs font-medium text-danger-600">{errors.name}</p>}
          </div>
          <div>
            <Label htmlFor="delivery-phone">Phone</Label>
            <Input
              id="delivery-phone"
              type="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={(event) => setField('phone', event.target.value.replace(/\D/g, '').slice(0, 10))}
              aria-invalid={Boolean(errors.phone)}
              className={`mt-1.5 ${fieldClass('phone')}`}
            />
            {errors.phone && <p role="alert" className="mt-1 text-xs font-medium text-danger-600">{errors.phone}</p>}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="delivery-email" className="flex items-center gap-1.5">
              Email <span className="text-xs font-normal text-muted-foreground">(can't be changed)</span>
            </Label>
            <Input id="delivery-email" value={display.email || ''} disabled className="mt-1.5" />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} loading={saving}>
            <Save className="size-4" /> Save changes
          </Button>
        </div>
      </div>
    </div>
  )
}
