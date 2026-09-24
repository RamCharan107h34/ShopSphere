import { cn } from '../../lib/utils.js'
import { layout, useAccent } from '../../design/context.js'

export function Textarea({ className, rows = 4, ...props }) {
  const accent = useAccent()
  return (
    <textarea
      rows={rows}
      className={cn(layout.field, 'py-2.5 leading-relaxed', accent.classes.focusRing, className)}
      {...props}
    />
  )
}

export default Textarea
