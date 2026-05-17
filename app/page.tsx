'use client'

import { LoginButton } from '@/components/login-button'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  const hasEnvVars = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </main>
    )
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 lg:p-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 -translate-y-12 isolate opacity-40 mix-blend-multiply blur-3xl w-[800px] h-[400px] bg-blue-100/40 rounded-full left-1/2 -translate-x-1/2" />
      
      <div className="z-10 mx-auto flex w-full max-w-[400px] flex-col justify-center space-y-8">
        <div className="flex flex-col space-y-3 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center mb-4 shadow-xl">
            <span className="text-white font-bold text-xl">JS</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Welcome back
          </h1>
          <p className="text-sm text-zinc-500">
            Sign in to continue to your dashboard.
          </p>
        </div>

        {!hasEnvVars ? (
          <div className="rounded-xl bg-red-50/80 backdrop-blur-sm p-4 border border-red-200">
            <h3 className="text-sm font-semibold text-red-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              Missing Configuration
            </h3>
            <div className="mt-2 text-sm text-red-800/80 leading-relaxed">
              Please add <code className="bg-red-100/50 px-1 py-0.5 rounded text-red-900 font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-red-100/50 px-1 py-0.5 rounded text-red-900 font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your environment variables to enable authentication.
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white/50 backdrop-blur-xl p-8 shadow-sm">
            <LoginButton />
            <div className="text-center text-xs text-zinc-500 mt-4">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
