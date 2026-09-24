import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, CalendarDays, Mail, MapPin, Phone, Save, UserRound } from 'lucide-react'
import { cn } from '../../lib/utils.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../components/ui/toast.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Label } from '../../components/ui/Label.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { fetchProfile, updateProfile } from '../../services/account.js'
import { getErrorMessage } from '../../services/api.js'

const ROLE_LABELS = {
  customer: 'Customer',
  seller: 'Seller',
  admin: 'Platform admin',
  support: 'Support agent',
  delivery: 'Delivery partner',
}

const emptyAddress = { street: '', city: '', state: '', pincode: '' }

const validate = (form) => {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Name is required'
  if (form.phone && !/^\d{10}$/.test(form.phone.trim())) errors.phone = 'Phone must be 10 digits'
  if (form.pincode && !/^\d{6}$/.test(form.pincode.trim())) errors.pincode = 'Pincode must be 6 digits'
  return errors
}

export default function Profile() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', phone: '', ...emptyAddress })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchProfile()
      .then((data) => {
        if (cancelled) return
        setProfile(data)
        const address = data.address || emptyAddress
        setForm({
          name: data.name || '',
          phone: data.phone || '',
          street: address.street || '',
          city: address.city || '',
          state: address.state || '',
          pincode: address.pincode || '',
        })
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const memberSince = useMemo(() => {
    const date = profile?.createdAt
    return date
      ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—'
  }, [profile, user])

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSave = async () => {
    const validation = validate(form)
    setErrors(validation)
    if (Object.keys(validation).length > 0) {
      toast({ title: 'Check the highlighted fields', variant: 'error' })
      return
    }

    const hasAddress = Boolean(form.street.trim() || form.city.trim() || form.state.trim() || form.pincode.trim())
    setSaving(true)
    try {
      const updated = await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: hasAddress
          ? {
              street: form.street.trim(),
              city: form.city.trim(),
              state: form.state.trim(),
              pincode: form.pincode.trim(),
            }
          : undefined,
      })
      setProfile(updated)
      updateUser(updated) // keep navbar avatar/name fresh
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
        <Skeleton className="h-72 rounded-2xl" />
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

  const fieldClass = (name) => cn(errors[name] && 'border-red-400 focus-visible:ring-red-300')

  return (
    <div className="space-y-5">
      {/* Summary card */}
      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-violet-600 via-violet-600 to-fuchsia-500" />
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
          <span className="-mt-14 flex size-20 items-center justify-center rounded-2xl border-4 border-white bg-white text-xl font-black text-violet-600 shadow-sm">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">{display.name}</h2>
              <Badge variant="success">{ROLE_LABELS[display.role] || display.role}</Badge>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5" /> {display.email}
              </span>
              {display.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3.5" /> {display.phone}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" /> Joined {memberSince}
              </span>
            </div>
          </div>
          <Badge variant="outline" className="self-start">
            <BadgeCheck className="size-3 text-violet-600" /> Verified buyer
          </Badge>
        </div>
      </Card>

      {/* Edit form */}
      <Card className="p-5 sm:p-6">
        <h3 className="flex items-center gap-2 font-semibold">
          <UserRound className="size-4 text-violet-600" /> Personal details
        </h3>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Full name *</Label>
            <Input id="name" value={form.name} onChange={(event) => setField('name', event.target.value)} aria-invalid={Boolean(errors.name)} className={cn('mt-1.5', fieldClass('name'))} />
            {errors.name && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.name}</p>}
          </div>
          <div>
            <Label htmlFor="profile-phone">Phone</Label>
            <Input
              id="profile-phone"
              type="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={(event) => setField('phone', event.target.value.replace(/\D/g, '').slice(0, 10))}
              aria-invalid={Boolean(errors.phone)}
              className={cn('mt-1.5', fieldClass('phone'))}
            />
            {errors.phone && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.phone}</p>}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="email" className="flex items-center gap-1.5">
              Email <span className="text-xs font-normal text-slate-500">(can't be changed)</span>
            </Label>
            <Input id="email" value={display.email || ''} disabled className="mt-1.5" />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 border-t border-slate-200 pt-5">
          <MapPin className="size-4 text-violet-600" />
          <h3 className="font-semibold">Default delivery address</h3>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="street">Street address</Label>
            <Input
              id="street"
              value={form.street}
              onChange={(event) => setField('street', event.target.value)}
              placeholder="House number, building, street, area"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" value={form.city} onChange={(event) => setField('city', event.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" value={form.state} onChange={(event) => setField('state', event.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="pincode">Pincode</Label>
            <Input
              id="pincode"
              inputMode="numeric"
              value={form.pincode}
              onChange={(event) => setField('pincode', event.target.value.replace(/\D/g, '').slice(0, 6))}
              aria-invalid={Boolean(errors.pincode)}
              className={cn('mt-1.5', fieldClass('pincode'))}
            />
            {errors.pincode && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.pincode}</p>}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} loading={saving}>
            <Save className="size-4" /> Save changes
          </Button>
        </div>
      </Card>
    </div>
  )
}
