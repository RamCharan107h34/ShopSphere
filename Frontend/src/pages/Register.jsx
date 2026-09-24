import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BadgeCheck, CircleAlert, Store } from 'lucide-react'
import { AuthLayout } from '../components/auth/AuthLayout.jsx'
import { InputField } from '../components/form/InputField.jsx'
import { Button } from '../components/ui/Button.jsx'
import { useToast } from '../components/ui/toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { validators } from '../lib/validators.js'
import { getErrorMessage } from '../services/api.js'

const addressFields = [
  { name: 'street', label: 'Street address' },
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State' },
  { name: 'pincode', label: 'Pincode / ZIP' },
]

function Register() {
  const { user, register } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [account, setAccount] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [address, setAddress] = useState({ street: '', city: '', state: '', pincode: '' })
  const [touched, setTouched] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  const accountErrors = validators.validateAll(account, {
    name: validators.required,
    email: validators.email,
    phone: validators.phone,
    password: validators.password,
    confirmPassword: validators.confirmPassword(account.password),
  })

  const handleAccountChange = (event) => {
    const { name, value } = event.target
    setAccount((current) => ({ ...current, [name]: value }))
    setServerError('')
  }

  const handleBlur = (event) => {
    const { name } = event.target
    setTouched((current) => ({ ...current, [name]: true }))
  }

  const nextStep = () => {
    const nextTouched = Object.fromEntries(Object.keys(accountErrors).map((field) => [field, true]))
    setTouched((current) => ({ ...current, ...nextTouched }))
    if (Object.keys(accountErrors).length > 0) return
    setStep(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setServerError('')
    try {
      await register({
        ...account,
        address: Object.fromEntries(
          Object.entries(address).filter(([, value]) => value.trim() !== ''),
        ),
      })
      toast({
        title: 'Account created 🎉',
        description: 'Sign in with your new credentials to continue.',
        variant: 'success',
      })
      navigate('/login', { state: { email: account.email } })
    } catch (error) {
      setServerError(getErrorMessage(error, 'Registration failed. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      wide
      eyebrow={step === 0 ? 'Step 1 of 2' : 'Step 2 of 2'}
      title={step === 0 ? 'Create your account' : 'Add a shipping address (optional)'}
      subtitle={
        step === 0
          ? 'Join as a customer — browsing, carts, orders, and reviews.'
          : 'We use this to prefill delivery details at checkout.'
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-50 px-3.5 py-3 text-sm text-red-700"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {serverError}
          </div>
        )}

        {/* Step 1: account */}
        {step === 0 && (
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <InputField
                label="Full name"
                name="name"
                autoComplete="name"
                placeholder="Ada Lovelace"
                value={account.name}
                onChange={handleAccountChange}
                onBlur={handleBlur}
                error={accountErrors.name}
                touched={touched.name}
                required
              />
              <InputField
                label="Phone (optional)"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                value={account.phone}
                onChange={handleAccountChange}
                onBlur={handleBlur}
                error={accountErrors.phone}
                touched={touched.phone}
                hint="Used for delivery updates."
              />
            </div>

            <InputField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={account.email}
              onChange={handleAccountChange}
              onBlur={handleBlur}
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
                onChange={handleAccountChange}
                onBlur={handleBlur}
                error={accountErrors.password}
                touched={touched.password}
                required
              />
              <InputField
                label="Confirm password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat password"
                value={account.confirmPassword}
                onChange={handleAccountChange}
                onBlur={handleBlur}
                error={accountErrors.confirmPassword}
                touched={touched.confirmPassword}
                required
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              <Store className="mb-1 size-4 text-violet-600" />
              Selling on ShopSphere?{' '}
              <Link to="/register/seller" className="font-medium text-violet-600 hover:underline">
                Register a store instead
              </Link>
            </div>

            <Button type="button" className="w-full" size="lg" onClick={nextStep}>
              Continue to address
            </Button>
          </motion.div>
        )}

        {/* Step 2: address (optional) */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {addressFields.map((field) => (
                <InputField
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  value={address[field.name]}
                  onChange={(event) =>
                    setAddress((current) => ({ ...current, [field.name]: event.target.value }))
                  }
                  className={field.name === 'street' ? 'sm:col-span-2' : ''}
                />
              ))}
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">
              <BadgeCheck className="mt-0.5 size-4 shrink-0" />
              You can skip this and add an address later from your profile.
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button type="submit" className="flex-[2]" size="lg" loading={submitting}>
                {submitting ? 'Creating account…' : 'Create account'}
              </Button>
            </div>
          </motion.div>
        )}
      </form>

      {step === 0 && (
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-violet-600 hover:underline">
            Sign in
          </Link>
        </p>
      )}
    </AuthLayout>
  )
}

export default Register
