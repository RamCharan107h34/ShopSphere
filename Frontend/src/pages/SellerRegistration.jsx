import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Banknote,
  Building2,
  CheckCircle2,
  CircleAlert,
  Store,
  UserRound,
} from 'lucide-react'
import { AuthLayout } from '../components/auth/AuthLayout.jsx'
import { InputField } from '../components/form/InputField.jsx'
import { Textarea } from '../components/ui/Textarea.jsx'
import { Label } from '../components/ui/Label.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { useToast } from '../components/ui/toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { validators } from '../lib/validators.js'
import api, { getErrorMessage } from '../services/api.js'

const STEPS = ['Account', 'Store', 'Business']

// STEP 0 — account (only shown when no session exists)
// STEP 1 — store profile
// STEP 2 — business registration + payout

function SellerRegistration() {
  const { user, register, login } = useAuth()
  const { toast } = useToast()

  const [step, setStep] = useState(user ? 1 : 0)
  const [account, setAccount] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [store, setStore] = useState({ storeName: '', description: '', contactEmail: '', contactPhone: '' })
  const [business, setBusiness] = useState({
    businessRegistrationNumber: '',
    taxId: '',
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    routingNumber: '',
  })
  const [touched, setTouched] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const accountErrors = validators.validateAll(account, {
    name: validators.required,
    email: validators.email,
    password: validators.password,
    confirmPassword: validators.confirmPassword(account.password),
  })
  const storeErrors = validators.validateAll(store, {
    storeName: validators.required,
    contactEmail: validators.email,
  })

  const handleChange = (group, event) => {
    const { name, value } = event.target
    if (group === 'account') setAccount((c) => ({ ...c, [name]: value }))
    if (group === 'store') setStore((c) => ({ ...c, [name]: value }))
    if (group === 'business') setBusiness((c) => ({ ...c, [name]: value }))
    setServerError('')
  }

  const blur = (event) => {
    const { name } = event.target
    setTouched((current) => ({ ...current, [name]: true }))
  }

  const goNext = () => {
    setStep((current) => Math.min(current + 1, STEPS.length - 1))
    setTouched({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    setStep((current) => Math.max(current - 1, 0))
    setTouched({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const validateCurrentStep = () => {
    if (step === 0) {
      const markTouched = Object.fromEntries(Object.keys(accountErrors).map((f) => [f, true]))
      setTouched((current) => ({ ...current, ...markTouched }))
      return Object.keys(accountErrors).length === 0
    }
    if (step === 1) {
      const markTouched = Object.fromEntries(Object.keys(storeErrors).map((f) => [f, true]))
      setTouched((current) => ({ ...current, ...markTouched }))
      return Object.keys(storeErrors).length === 0
    }
    return true
  }

  // Runs when the final "Submit application" button is clicked.
  // Uses an existing session when present; otherwise it creates the
  // account first and signs in — mirroring the real backend flow.
  const handleSubmit = async () => {
    setSubmitting(true)
    setServerError('')
    try {
      let token = null

      if (!user) {
        // 1. Register as a customer account
        const created = await register({
          name: account.name,
          email: account.email,
          password: account.password,
        })
        // 2. Login to get a session token for the apply call
        await login({ email: created.email, password: account.password })
        token = localStorage.getItem('shopsphere_token')
      }

      // 3. Submit the seller + store application
      await api.post(
        '/seller-api/apply',
        {
          storeName: store.storeName,
          description: store.description,
          contactEmail: store.contactEmail || account.email,
          contactPhone: store.contactPhone,
          businessRegistrationNumber: business.businessRegistrationNumber,
          taxId: business.taxId,
          bankDetails: {
            accountHolderName: business.accountHolderName,
            accountNumber: business.accountNumber,
            bankName: business.bankName,
            routingNumber: business.routingNumber,
          },
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      )

      setDone(true)
      toast({
        title: 'Application submitted 🎉',
        description: 'Our team will review your store and notify you by email.',
        variant: 'success',
      })
    } catch (error) {
      setServerError(getErrorMessage(error, 'Could not submit the application.'))
    } finally {
      setSubmitting(false)
    }
  }

  // Success screen
  if (done) {
    return (
      <AuthLayout eyebrow="Application received" title="You're almost a seller">
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="size-7 text-success" />
          </span>
          <h2 className="text-xl font-bold">Store under review</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">{store.storeName}</span> has been
            submitted. Once an admin approves it, your account becomes a seller and you can list
            products.
          </p>
          <Badge variant="warning">Status: pending</Badge>
          <Link to="/" className="font-medium text-primary hover:underline">
            Back to home
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      wide
      eyebrow={`Step ${step + 1} of ${STEPS.length} · Seller application`}
      title="Register your store"
      subtitle="Three quick steps to start selling on ShopSphere."
    >
      {/* Stepper */}
      <ol className="mb-7 flex items-center gap-2">
        {STEPS.map((label, index) => {
          const state = index < step ? 'done' : index === step ? 'current' : 'todo'
          const Icon = index === 0 ? UserRound : index === 1 ? Store : Banknote
          return (
            <li key={label} className="flex flex-1 flex-col items-center gap-1.5 text-center">
              <span
                className={`flex size-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                  state === 'done'
                    ? 'border-success/40 bg-success/10 text-success'
                    : state === 'current'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground'
                }`}
              >
                {state === 'done' ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
              </span>
              <span
                className={`text-xs font-medium ${
                  state === 'todo' ? 'text-muted-foreground' : 'text-foreground'
                }`}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ol>

      {serverError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-lg border border-danger-500/30 bg-danger-50 px-3.5 py-3 text-sm text-danger-700"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {serverError}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -14 }}
          transition={{ duration: 0.18 }}
          className="space-y-5"
        >
          {/* STEP 0 — account */}
          {step === 0 && (
            <>
              <InputField
                label="Full name"
                name="name"
                autoComplete="name"
                placeholder="Business owner name"
                value={account.name}
                onChange={(e) => handleChange('account', e)}
                onBlur={blur}
                error={accountErrors.name}
                touched={touched.name}
                required
              />
              <InputField
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="owner@yourstore.com"
                value={account.email}
                onChange={(e) => handleChange('account', e)}
                onBlur={blur}
                error={accountErrors.email}
                touched={touched.email}
                required
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <InputField
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={account.password}
                  onChange={(e) => handleChange('account', e)}
                  onBlur={blur}
                  error={accountErrors.password}
                  touched={touched.password}
                  required
                />
                <InputField
                  label="Confirm password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={account.confirmPassword}
                  onChange={(e) => handleChange('account', e)}
                  onBlur={blur}
                  error={accountErrors.confirmPassword}
                  touched={touched.confirmPassword}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Already selling here?{' '}
                <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link> and apply from your dashboard instead.
              </p>
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  if (validateCurrentStep()) goNext()
                }}
              >
                Continue to store
              </Button>
            </>
          )}

          {/* STEP 1 — store profile */}
          {step === 1 && (
            <>
              <InputField
                label="Store name"
                name="storeName"
                placeholder="e.g. Northwind Goods"
                value={store.storeName}
                onChange={(e) => handleChange('store', e)}
                onBlur={blur}
                error={storeErrors.storeName}
                touched={touched.storeName}
                hint="Shown to customers — make it unique."
                required
              />
              <div className="space-y-2">
                <Label htmlFor="description">Store description</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="What do you sell and why should customers trust you?"
                  value={store.description}
                  onChange={(e) => handleChange('store', e)}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <InputField
                  label="Contact email"
                  name="contactEmail"
                  type="email"
                  placeholder="store@example.com"
                  value={store.contactEmail}
                  onChange={(e) => handleChange('store', e)}
                  onBlur={blur}
                  error={storeErrors.contactEmail}
                  touched={touched.contactEmail}
                  hint="Defaults to your account email."
                />
                <InputField
                  label="Contact phone"
                  name="contactPhone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={store.contactPhone}
                  onChange={(e) => handleChange('store', e)}
                  onBlur={blur}
                />
              </div>
              <div className="flex gap-3">
                {!user && (
                  <Button variant="outline" className="flex-1" onClick={goBack}>
                    Back
                  </Button>
                )}
                <Button
                  className={user ? 'w-full' : 'flex-[2]'}
                  size="lg"
                  onClick={() => {
                    if (validateCurrentStep()) goNext()
                  }}
                >
                  Continue to business
                </Button>
              </div>
            </>
          )}

          {/* STEP 2 — business + payout */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground">
                <Building2 className="size-4 shrink-0 text-primary" />
                Business registration (optional for hobby sellers)
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <InputField
                  label="Registration number"
                  name="businessRegistrationNumber"
                  placeholder="GSTIN / CIN"
                  value={business.businessRegistrationNumber}
                  onChange={(e) => handleChange('business', e)}
                  onBlur={blur}
                />
                <InputField
                  label="Tax ID"
                  name="taxId"
                  placeholder="PAN / TIN"
                  value={business.taxId}
                  onChange={(e) => handleChange('business', e)}
                  onBlur={blur}
                />
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground">
                <Banknote className="size-4 shrink-0 text-primary" />
                Payout details — earnings land here after sales
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <InputField
                  label="Account holder"
                  name="accountHolderName"
                  value={business.accountHolderName}
                  onChange={(e) => handleChange('business', e)}
                  onBlur={blur}
                />
                <InputField
                  label="Bank name"
                  name="bankName"
                  value={business.bankName}
                  onChange={(e) => handleChange('business', e)}
                  onBlur={blur}
                />
                <InputField
                  label="Account number"
                  name="accountNumber"
                  value={business.accountNumber}
                  onChange={(e) => handleChange('business', e)}
                  onBlur={blur}
                />
                <InputField
                  label="Routing / IFSC"
                  name="routingNumber"
                  value={business.routingNumber}
                  onChange={(e) => handleChange('business', e)}
                  onBlur={blur}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1" onClick={goBack}>
                  Back
                </Button>
                <Button
                  className="flex-[2]"
                  size="lg"
                  loading={submitting}
                  onClick={() => {
                    setTouched({})
                    handleSubmit()
                  }}
                >
                  {submitting ? 'Submitting…' : 'Submit application'}
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

    </AuthLayout>
  )
}

export default SellerRegistration
