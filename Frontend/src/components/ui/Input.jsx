import { cn } from '../../lib/utils.js'
import { layout, useAccent } from '../../design/context.js'

/** Text input that adopts the focus colour of the surrounding workspace. */
export function Input({ className, type = 'text', ...props }) {
  const accent = useAccent()
  return (
    <input
      type={type}
      className={cn(layout.field, 'h-10', accent.classes.focusRing, className)}
      {...props}
    />
  )
}

export default Input
