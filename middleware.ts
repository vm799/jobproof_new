import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/constants'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect /dashboard routes — redirect to login if no session cookie
  if (pathname.startsWith('/dashboard')) {
    const sessionCookie = request.cookies.get(COOKIE_NAME)
    if (!sessionCookie?.value) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
