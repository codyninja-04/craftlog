'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { CURRENCIES } from '@/lib/currencies'

async function signedIn() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function setCurrency(formData: FormData) {
  const { supabase, user } = await signedIn()
  const currency = String(formData.get('currency') ?? '')
  if (!CURRENCIES.some((c) => c.code === currency)) throw new Error("That currency isn't supported")
  const { error } = await supabase.from('profiles').update({ currency }).eq('user_id', user.id)
  if (error) throw new Error("Couldn't save the currency. Try again.")
  revalidatePath('/', 'layout')
}

// Every table cascades from auth.users, so deleting the user takes every
// project, entry, material and troubleshoot with it. Photos live in storage,
// so those get cleared first.
export async function deleteAccount() {
  const { supabase, user } = await signedIn()
  const admin = createAdminClient()

  const { data: projects } = await supabase.from('craft_projects').select('id')
  for (const p of projects ?? []) {
    const folder = `${user.id}/${p.id}`
    const { data: files } = await admin.storage.from('project-photos').list(folder, { limit: 1000 })
    if (files?.length) await admin.storage.from('project-photos').remove(files.map((f) => `${folder}/${f.name}`))
  }

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) throw new Error('Could not delete the account. Try again or contact support.')

  await supabase.auth.signOut()
  redirect('/')
}
