import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Do NOT intercept the OAuth callback route to avoid consuming the PKCE verifier prematurely
  if (request.nextUrl.pathname.startsWith('/auth/callback')) {
    return
  }
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
