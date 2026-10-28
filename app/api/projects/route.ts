import { apiUser } from '@/lib/auth'
import { limitsFor } from '@/lib/plan'
import { PROJECT_COLUMNS, countActive, toProject } from '@/lib/projects'
import { becomesActive, statusDates } from '@/lib/status'
import { CRAFT_TYPES, STATUSES } from '@/lib/types'
import { badRequest, dateOrNull, oneOf, readJson, str } from '@/lib/validate'
import { today } from '@/lib/format'

export async function GET() {
  const { supabase, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized

  const { data, error } = await supabase.from('craft_projects').select(PROJECT_COLUMNS).order('updated_at', { ascending: false }).limit(500)
  if (error) return Response.json({ error: 'Could not load projects' }, { status: 500 })
  return Response.json({ projects: (data ?? []).map(toProject) })
}

export async function POST(req: Request) {
  const { supabase, user, plan, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized

  try {
    const body = await readJson(req)
    const name = str(body.name, 'Name', { max: 120, required: true })!
    const description = str(body.description, 'Notes', { max: 2000 })
    const craft_type = oneOf(body.craft_type ?? 'other', 'Craft', CRAFT_TYPES)
    const status = oneOf(body.status ?? 'in_progress', 'Status', STATUSES)
    const started_at = dateOrNull(body.started_at)

    const limit = limitsFor(plan).activeProjects
    if (becomesActive(null, status) && (await countActive(supabase, user.id)) >= limit) {
      return Response.json(
        { error: `The free plan has room for ${limit} active projects. Finish or shelve one, or go Pro for unlimited.`, code: 'limit' },
        { status: 402 },
      )
    }

    const dates = statusDates({ status: 'planning', started_at, completed_at: null }, status, today())
    const { data, error } = await supabase
      .from('craft_projects')
      .insert({ user_id: user.id, name, description, craft_type, status, started_at, ...dates })
      .select(PROJECT_COLUMNS)
      .single()
    if (error || !data) return Response.json({ error: 'Could not create the project' }, { status: 500 })
    return Response.json({ project: toProject(data) }, { status: 201 })
  } catch (e) {
    return badRequest(e)
  }
}
