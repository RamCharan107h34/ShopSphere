import { useState } from 'react'
import { Package } from 'lucide-react'
import { cn, isPlaceholderImage } from '../../lib/utils.js'

// Product thumbnail with graceful fallback when the image URL is unreachable
// or a placeholder (e.g. via.placeholder.com while offline).
export function Thumb({ src, alt, className }) {
  const [failed, setFailed] = useState(false)
  const broken = failed || isPlaceholderImage(src)
  return (
    <span
      className={cn(
        'flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground',
        className,
      )}
    >
      {broken ? (
        <Package className="size-5" />
      ) : (
        <img src={src} alt={alt || ''} loading="lazy" onError={() => setFailed(true)} className="size-full object-cover" />
      )}
    </span>
  )
}