import { apiUser } from '@/lib/auth'
import { removePhotos } from '@/lib/photos/server'
import { SESSION_COLUMNS, toSession } from '@/lib/projects'
import { UUID, badRequest, bool, readJson, str } from '@/lib/validate'

type Ctx = { params: { id: string } }

// Marks whether the fix worked, with a note on what actually solved it. That
// note feeds back into the next troubleshoot on the same project.
export async function PATCH(req: Request, { params }: Ctx) {
  const { supabase, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized
  if (!UUID.test(params.id)) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await readJson(req)
    const resolved = bool(body.resolved)
    const resolution_note = str(body.resolution_note, 'Note', { max: 1000 })

    const { data, error } = await supabase
      .from('troubleshoot_sessions')
      .update({ resolved, resolution_note, resolved_at: resolved ? new Date().toISOString() : null })
      .eq('id', params.id)
      .select(SESSION_COLUMNS)
      .maybeSingle()
    if (error) return Response.json({ error: 'Could not save that' }, { status: 500 })
    if (!data) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json({ session: toSession(data) })
  } catch (e) {
    return badRequest(e)
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { supabase, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized
  if (!UUID.test(params.id)) return Response.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabase.from('troubleshoot_sessions').delete().eq('id', params.id).select('photo_url')
  if (error) return Response.json({ error: 'Could not delete that' }, { status: 500 })
  if (!data?.length) return Response.json({ error: 'Not found' }, { status: 404 })

  const path = data[0].photo_url as string | null
  if (path) {
    const { count } = await supabase.from('project_log_entries').select('id', { count: 'exact', head: true }).eq('photo_url', path)
    if (!count) await removePhotos(supabase, [path]).catch(() => {})
  }
  return Response.json({ ok: true })
}
