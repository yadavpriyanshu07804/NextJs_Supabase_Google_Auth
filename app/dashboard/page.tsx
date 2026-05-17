import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/logout-button'
import Image from 'next/image'

export default async function DashboardPage() {
  let supabase
  try {
    supabase = await createClient()
  } catch (error) {
    // Missing environment variables
    redirect('/')
  }

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b bg-white border-zinc-200">
        <div className="container mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-zinc-900 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">JS</span>
            </div>
            <h2 className="text-base font-semibold tracking-tight">Dashboard</h2>
          </div>
          <LogoutButton />
        </div>
      </header>
      
      <main className="container mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back{user.user_metadata.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}</h1>
          <p className="text-zinc-500 mt-2">Manage your account and view your data below.</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex items-center gap-4">
            {user.user_metadata.avatar_url && (
              <Image 
                src={user.user_metadata.avatar_url} 
                alt="Profile photo" 
                width={48} 
                height={48} 
                className="rounded-full shadow-sm ring-1 ring-zinc-200" 
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              <h3 className="font-medium text-zinc-900">Profile Details</h3>
              <p className="text-sm text-zinc-500">Information provided by Google</p>
            </div>
          </div>
          <div className="p-6 bg-zinc-50/50">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-y-1 py-3 border-b border-zinc-200 last:border-0 last:pb-0">
                <div className="text-sm text-zinc-500 font-medium">Email</div>
                <div className="md:col-span-3 text-sm text-zinc-900 font-medium">{user.email}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-y-1 py-3 border-b border-zinc-200 last:border-0 last:pb-0">
                <div className="text-sm text-zinc-500 font-medium">Full Name</div>
                <div className="md:col-span-3 text-sm text-zinc-900">{user.user_metadata.full_name || 'N/A'}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-y-1 py-3 border-b border-zinc-200 last:border-0 last:pb-0">
                <div className="text-sm text-zinc-500 font-medium">User ID</div>
                <div className="md:col-span-3 text-sm text-zinc-900 font-mono text-xs">{user.id}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-y-1 py-3 border-b border-zinc-200 last:border-0 last:pb-0">
                <div className="text-sm text-zinc-500 font-medium">Last Sign In</div>
                <div className="md:col-span-3 text-sm text-zinc-900">{new Date(user.last_sign_in_at || '').toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
