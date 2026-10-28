import { apiUser } from '@/lib/auth'
import { today } from '@/lib/format'
import { limitsFor } from '@/lib/plan'
import { isOwnPhotoPath, projectPrefix } from '@/lib/photos/shared'
import { removeFolder } from '@/lib/photos/server'
import { PROJECT_COLUMNS, countActive, getProject, getProjectBundle, toProject } from '@/lib/projects'
import { becomesActive, statusDates } from '@/lib/status'
import { CRAFT_TYPES, STATUSES, type Project } from '@/lib/types'
import { UUID, badRequest, dateOrNull, oneOf, readJson, str } from '@/lib/validate'

type Ctx = { params: { id: string } }

export async function GET(_req: Request, { params }: Ctx) {
  const { supabase, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized
  if (!UUID.test(params.id)) return Response.json({ error: 'Not found' }, { status: 404 })

  const bundle = await getProjectBundle(supabase, params.id)
  if (!bundle) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(bundle)
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { supabase, user, plan, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized
  if (!UUID.test(params.id)) return Response.json({ error: 'Not found' }, { status: 404 })

  const current = await getProject(supabase, params.id)
  if (!current) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await readJson(req)
    const patch: Partial<Project> = {}

    if ('name' in body) patch.name = str(body.name, 'Name', { max: 120, required: true })!
    if ('description' in body) patch.description = str(body.description, 'Notes', { max: 2000 })
    if ('craft_type' in body) patch.craft_type = oneOf(body.craft_type, 'Craft', CRAFT_TYPES)
    if ('started_at' in body) patch.started_at = dateOrNull(body.started_at)
    if ('completed_at' in body) patch.completed_at = dateOrNull(body.completed_at)
    if ('cover_photo_url' in body) {
      if (body.cover_photo_url === null) patch.cover_photo_url = null
      else if (isOwnPhotoPath(body.cover_photo_url, user.id, current.id)) patch.cover_photo_url = body.cover_photo_url
      else return Response.json({ error: "That photo doesn't belong to this project" }, { status: 400 })
    }

    if ('status' in body) {
      const status = oneOf(body.status, 'Status', STATUSES)
      const limit = limitsFor(plan).activeProjects
      if (becomesActive(current.status, status) && (await countActive(supabase, user.id, current.id)) >= limit) {
        return Response.json(
          { error: `The free plan has room for ${limit} active projects. Finish or shelve another one first, or go Pro.`, code: 'limit' },
          { status: 402 },
        )
      }
      patch.status = status
      // Explicit dates in the same request win over the automatic ones.
      const auto = statusDates({ ...current, ...patch, status: current.status }, status, today())
      for (const [k, v] of Object.entries(auto)) if (!(k in body)) (patch as Record<string, unknown>)[k] = v
    }

    const started = patch.started_at !== undefined ? patch.started_at : current.started_at
    const completed = patch.completed_at !== undefined ? patch.completed_at : current.completed_at
    if (started && completed && completed < started) return Response.json({ error: "The finish date can't be before the start date" }, { status: 400 })

    if (Object.keys(patch).length === 0) return Response.json({ project: current })

    const { data, error } = await supabase
      .from('craft_projects')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', current.id)
      .select(PROJECT_COLUMNS)
      .single()
    if (error || !data) return Response.json({ error: 'Could not save the project' }, { status: 500 })
    return Response.json({ project: toProject(data) })
  } catch (e) {
    return badRequest(e)
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { supabase, user, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized
  if (!UUID.test(params.id)) return Response.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabase.from('craft_projects').delete().eq('id', params.id).select('id')
  if (error) return Response.json({ error: 'Could not delete the project' }, { status: 500 })
  if (!data?.length) return Response.json({ error: 'Not found' }, { status: 404 })

  // Rows cascade in the database. Photos live in storage, so clear those too.
  await removeFolder(supabase, projectPrefix(user.id, params.id)).catch(() => {})
  return Response.json({ ok: true })
}
