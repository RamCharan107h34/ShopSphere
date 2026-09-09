import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CircleAlert } from 'lucide-react'
import { AuthLayout } from '../components/auth/AuthLayout.jsx'
import { InputField } from '../components/form/InputField.jsx'
import { Button } from '../components/ui/Button.jsx'
import { useToast } from '../components/ui/toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { validators } from '../lib/validators.js'
import { getErrorMessage } from '../services/api.js'

function Login() {
  const { user, login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  // Prefill email when arriving from a successful registration
  const [values, setValues] = useState({
    email: location.state?.email || '',
    password: '',
  })
  const [touched, setTouched] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Already signed in → go home
  if (user) return <Navigate to="/" replace />

  const errors = validators.validateAll(values, {
    email: validators.email,
    password: validators.required,
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setServerError('')
  }

  const handleBlur = (event) => {
    const { name } = event.target
    setTouched((current) => ({ ...current, [name]: true }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setTouched({ email: true, password: true })

    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    setServerError('')
    try {
      const loggedInUser = await login(values)
      toast({
        title: `Welcome back, ${loggedInUser.name.split(' ')[0]}!`,
        description: 'You are now signed in.',
        variant: 'success',
      })
      navigate('/')
    } catch (error) {
      setServerError(getErrorMessage(error, 'Login failed. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in to ShopSphere"
      subtitle="Access your cart, orders, and role dashboards."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-danger-500/30 bg-danger-50 px-3.5 py-3 text-sm text-danger-700"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {serverError}
          </div>
        )}

        <InputField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
          touched={touched.email}
          required
        />

        <InputField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password}
          touched={touched.password}
          required
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" className="size-4 rounded border-border accent-primary" />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to ShopSphere?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Want to sell?{' '}
        <Link to="/register/seller" className="font-medium text-primary hover:underline">
          Register your store
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Login
