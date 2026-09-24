import { Link } from 'react-router-dom'
import { buttonVariants } from '../components/ui/Button.jsx'

export function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center px-4 text-center sm:px-6">
      <p className="text-7xl font-extrabold tracking-tight text-violet-600">404</p>
      <h1 className="mt-4 text-2xl font-bold">This page drifted off the sphere</h1>
      <p className="mt-2 max-w-md text-slate-500">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className={`${buttonVariants()} mt-6`}>
        Back to home
      </Link>
    </div>
  )
}
