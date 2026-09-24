import { cn } from '../../lib/utils.js'
import { surfaces, typography } from '../../design/context.js'

export function Card({ className, ...props }) {
  return <div className={cn(surfaces.card, 'text-slate-900', className)} {...props} />
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-1.5 p-6 pb-4', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn(typography.h3, className)} {...props} />
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('text-sm leading-relaxed text-slate-500', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-6 pt-2', className)} {...props} />
}

export function CardFooter({ className, ...props }) {
  return <div className={cn('flex items-center gap-2 p-6 pt-2', className)} {...props} />
}
