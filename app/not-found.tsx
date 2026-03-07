import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-stone-300 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-stone-800 mb-2">Page not found</h2>
        <p className="text-stone-600 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-6 rounded-lg transition inline-block"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
