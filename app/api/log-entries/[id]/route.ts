import { apiUser } from '@/lib/auth'
import { removePhotos } from '@/lib/photos/server'
import { ENTRY_COLUMNS, toEntry } from '@/lib/projects'
import type { LogEntry } from '@/lib/types'
import { UUID, badRequest, bool, num, readJson, str } from '@/lib/validate'

type Ctx = { params: { id: string } }

export async function PATCH(req: Request, { params }: Ctx) {
  const { supabase, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized
  if (!UUID.test(params.id)) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await readJson(req)
    const patch: Partial<LogEntry> = {}
    if ('entry_text' in body) patch.entry_text = str(body.entry_text, 'Notes', { max: 4000 })
    if ('time_spent_hours' in body) patch.time_spent_hours = num(body.time_spent_hours, 'Time', { min: 0, max: 24 })
    if ('is_milestone' in body) patch.is_milestone = bool(body.is_milestone)
    if (Object.keys(patch).length === 0) return Response.json({ error: 'Nothing to change' }, { status: 400 })

    const { data, error } = await supabase.from('project_log_entries').update(patch).eq('id', params.id).select(ENTRY_COLUMNS).maybeSingle()
    if (error) return Response.json({ error: 'Could not save the entry' }, { status: 500 })
    if (!data) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json({ entry: toEntry(data) })
  } catch (e) {
    return badRequest(e)
  }
}

// Deletes the entry and the materials bought in that session, so the totals
// stay honest. Clears the cover if this entry's photo was it.
export async function DELETE(_req: Request, { params }: Ctx) {
  const { supabase, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized
  if (!UUID.test(params.id)) return Response.json({ error: 'Not found' }, { status: 404 })

  const { data: entry } = await supabase.from('project_log_entries').select('id, project_id, photo_url').eq('id', params.id).maybeSingle()
  if (!entry) return Response.json({ error: 'Not found' }, { status: 404 })

  await supabase.from('project_materials').delete().eq('log_entry_id', entry.id)
  const { error } = await supabase.from('project_log_entries').delete().eq('id', entry.id)
  if (error) return Response.json({ error: 'Could not delete the entry' }, { status: 500 })

  if (entry.photo_url) {
    await supabase.from('craft_projects').update({ cover_photo_url: null }).eq('id', entry.project_id).eq('cover_photo_url', entry.photo_url)
    // Troubleshoot sessions can point at the same file, so only remove it when nothing else does.
    const { count } = await supabase.from('troubleshoot_sessions').select('id', { count: 'exact', head: true }).eq('photo_url', entry.photo_url)
    if (!count) await removePhotos(supabase, [entry.photo_url]).catch(() => {})
  }
  return Response.json({ ok: true })
}
