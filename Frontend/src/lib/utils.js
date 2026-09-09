import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Merge conditional class names and resolve Tailwind conflicts
export const cn = (...inputs) => twMerge(clsx(inputs))

// True when an image URL is a seeded placeholder (e.g. via.placeholder.com/*)
// that can't be fetched offline — render the fallback instead of loading it.
export const isPlaceholderImage = (url) => !url || url.includes('placeholder')
