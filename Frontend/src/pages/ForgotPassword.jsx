import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, MailCheck } from 'lucide-react'
import { AuthLayout } from '../components/auth/AuthLayout.jsx'
import { InputField } from '../components/form/InputField.jsx'
import { Button } from '../components/ui/Button.jsx'
import { validators } from '../lib/validators.js'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const error = validators.email(email)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setTouched(true)
    if (error) return

    setSubmitting(true)
    try {
      // TODO(backend): replace this delay with a call to
      // POST /user-api/forgot-password once the reset flow (token
      // generation + expiry + reset endpoint) is implemented on the API.
      // eslint-disable-next-line no-restricted-syntax
      await new Promise((resolve) => setTimeout(resolve, 900))
      setSent(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Reset your password"
      subtitle="Enter the email you registered with and we'll send you a reset link."
    >
      {!sent ? (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <InputField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => setTouched(true)}
            error={error}
            touched={touched}
            hint="A reset link is only sent to verified, registered emails."
            required
          />

          <Button type="submit" className="w-full" size="lg" loading={submitting}>
            {submitting ? 'Sending link…' : 'Send reset link'}
          </Button>

          <p className="text-center text-sm text-slate-500">
            <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-violet-600 hover:underline">
              <ArrowLeft className="size-3.5" /> Back to sign in
            </Link>
          </p>
        </form>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 py-4 text-center"
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="size-7 text-emerald-600" />
          </span>
          <h2 className="text-xl font-bold">Check your inbox</h2>
          <p className="text-sm leading-relaxed text-slate-500">
            If an account exists for <span className="font-semibold text-slate-900">{email}</span>,
            you'll receive a link to reset your password shortly.
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500">
            <MailCheck className="size-4 shrink-0 text-violet-600" />
            Didn't get it? Check spam or try again in a few minutes.
          </div>
          <Button variant="outline" size="sm" onClick={() => setSent(false)}>
            Use a different email
          </Button>
        </motion.div>
      )}
    </AuthLayout>
  )
}

export default ForgotPassword
