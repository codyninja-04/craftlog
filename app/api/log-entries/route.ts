import { apiUser } from '@/lib/auth'
import { today } from '@/lib/format'
import { parseMaterials } from '@/lib/materials'
import { isOwnPhotoPath } from '@/lib/photos/shared'
import { ENTRY_COLUMNS, getProject, toEntry } from '@/lib/projects'
import { UUID, badRequest, bool, num, readJson, str } from '@/lib/validate'

// Logs one work session: what happened, an optional photo, the time it took
// and anything bought for it. Totals on the project update by trigger.
export async function POST(req: Request) {
  const { supabase, user, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized

  try {
    const body = await readJson(req)
    const projectId = typeof body.project_id === 'string' && UUID.test(body.project_id) ? body.project_id : null
    if (!projectId) return Response.json({ error: 'Pick a project' }, { status: 400 })

    const project = await getProject(supabase, projectId)
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 })

    const entry_text = str(body.entry_text, 'Notes', { max: 4000 })
    const time_spent_hours = num(body.time_spent_hours, 'Time', { min: 0, max: 24 })
    const is_milestone = bool(body.is_milestone)
    const materials = parseMaterials(body.materials)

    let photo_url: string | null = null
    if (body.photo_url != null) {
      if (!isOwnPhotoPath(body.photo_url, user.id, project.id)) return Response.json({ error: "That photo doesn't belong to this project" }, { status: 400 })
      photo_url = body.photo_url
    }

    if (!entry_text && !photo_url && !time_spent_hours && materials.length === 0) {
      return Response.json({ error: 'Add a note, a photo, some time or a material' }, { status: 400 })
    }

    const logged_at = typeof body.logged_at === 'string' && !Number.isNaN(Date.parse(body.logged_at)) ? new Date(body.logged_at).toISOString() : undefined
    if (logged_at && new Date(logged_at).getTime() > Date.now() + 5 * 60_000) return Response.json({ error: "Entries can't be dated in the future" }, { status: 400 })

    const { data, error } = await supabase
      .from('project_log_entries')
      .insert({ project_id: project.id, entry_text, photo_url, time_spent_hours, is_milestone, ...(logged_at ? { logged_at } : {}) })
      .select(ENTRY_COLUMNS)
      .single()
    if (error || !data) return Response.json({ error: 'Could not save the entry' }, { status: 500 })

    if (materials.length) {
      const { error: mErr } = await supabase.from('project_materials').insert(materials.map((m) => ({ ...m, project_id: project.id, log_entry_id: data.id })))
      if (mErr) return Response.json({ error: 'The entry saved, but the materials did not. Add them from the materials list.' }, { status: 500 })
    }

    // The first real session moves a project out of planning.
    if (project.status === 'planning' || !project.started_at) {
      await supabase
        .from('craft_projects')
        .update({ status: project.status === 'planning' ? 'in_progress' : project.status, started_at: project.started_at ?? today() })
        .eq('id', project.id)
    }

    const { data: fresh } = await supabase.from('project_log_entries').select(ENTRY_COLUMNS).eq('id', data.id).single()
    return Response.json({ entry: toEntry(fresh ?? data) }, { status: 201 })
  } catch (e) {
    return badRequest(e)
  }
}
