const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^[+]?[\d\s-]{8,15}$/

// Each validator returns '' (valid) or an error message
export const validators = {
  required: (value) => (value && value.trim() ? '' : 'This field is required.'),

  email: (value) => {
    if (!value || !value.trim()) return 'Email is required.'
    return EMAIL_RE.test(value.trim()) ? '' : 'Enter a valid email address.'
  },

  phone: (value) => {
    if (!value || !value.trim()) return ''
    return PHONE_RE.test(value.trim()) ? '' : 'Enter a valid phone number.'
  },

  minLength: (min) => (value) =>
    !value || value.trim().length >= min ? '' : `Must be at least ${min} characters.`,

  password: (value) => {
    if (!value) return 'Password is required.'
    if (value.length < 8) return 'Password must be at least 8 characters.'
    return ''
  },

  confirmPassword: (compare) => (value) => {
    if (!value) return 'Please confirm your password.'
    return value === compare ? '' : 'Passwords do not match.'
  },

  // Validate an object of values against an object of validators
  validateAll: (values, rules) => {
    const errors = {}
    for (const [field, rule] of Object.entries(rules)) {
      const message = rule(values[field])
      if (message) errors[field] = message
    }
    return errors
  },
}
