import { useState } from 'react'
import { CircleAlert, CircleCheck, Eye, EyeOff } from 'lucide-react'
import { cn } from '../../lib/utils.js'
import { Input } from '../ui/Input.jsx'
import { Label } from '../ui/Label.jsx'

// Form field with built-in validation visuals:
// - error  -> red border + message
// - touched && !error && value -> green check
export function InputField({
  label,
  name,
  error,
  touched,
  hint,
  type = 'text',
  required,
  className,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type
  const showError = touched && error
  const isValid = touched && !error && props.value

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={name}>
          {label}
          {required && <span className="ml-0.5 text-danger-500">*</span>}
        </Label>
      )}

      <div className="relative">
        <Input
          id={name}
          name={name}
          type={resolvedType}
          aria-invalid={showError || undefined}
          aria-describedby={showError ? `${name}-error` : undefined}
          className={cn(
            showError && 'border-danger-500 focus-visible:ring-danger-500/60',
            isValid && 'border-success/60 focus-visible:ring-success/60',
            isPassword && 'pr-10',
          )}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        ) : (
          isValid && (
            <CircleCheck
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-success"
              aria-label="Valid"
            />
          )
        )}
      </div>

      {showError ? (
        <p id={`${name}-error`} role="alert" className="flex items-center gap-1.5 text-sm text-danger-600">
          <CircleAlert className="size-3.5 shrink-0" /> {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
