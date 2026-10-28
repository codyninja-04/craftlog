import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from './supabase/server'
import type { Plan } from './types'

export interface Profile {
  plan: Plan
  currency: string
}

async function profileFor(supabase: SupabaseClient, userId: string): Promise<Profile> {
  const { data } = await supabase.from('profiles').select('plan, currency').eq('user_id', userId).maybeSingle()
  return { plan: (data?.plan as Plan | undefined) ?? 'free', currency: (data?.currency as string | undefined) ?? 'USD' }
}

// Server components behind the app layout call this to get the signed in user.
export async function requireUser() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return { supabase, user, ...(await profileFor(supabase, user.id)) }
}

// Route handler version: returns a 401 response instead of redirecting.
export async function apiUser() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, plan: 'free' as Plan, currency: 'USD', unauthorized: NextResponse.json({ error: 'Sign in first' }, { status: 401 }) }
  return { supabase, user, ...(await profileFor(supabase, user.id)), unauthorized: null }
}

export function displayName(user: { email?: string | null; user_metadata?: Record<string, unknown> }): string {
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined
  const name = (meta?.full_name ?? meta?.name)?.trim()
  if (name) return name.split(/\s+/)[0]
  return user.email?.split('@')[0] ?? 'there'
}
