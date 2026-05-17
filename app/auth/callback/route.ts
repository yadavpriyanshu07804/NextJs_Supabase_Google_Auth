import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  
  // Use forwarded host or APP_URL to construct correct origin, fallback to request URL origin
  let origin = requestUrl.origin
  if (process.env.APP_URL) {
    origin = new URL(process.env.APP_URL).origin
  } else {
    // Attempt to respect Cloud Run forwarding headers
    const host = request.headers.get('x-forwarded-host')
    const proto = request.headers.get('x-forwarded-proto')
    if (host && proto) {
      origin = `${proto}://${host}`
    }
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Create a successful response that redirects to the final destination
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error('Error exchanging code for session:', error)
      // "invalid flow state" happens when the code was already consumed (e.g. Next.js prefetch double-firing)
      // Redirecting to next lets the dashboard's authentication check evaluate actual session state.
      if (error.message?.toLowerCase().includes('flow state') || error.message?.toLowerCase().includes('is_auth_error')) {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`)
}
