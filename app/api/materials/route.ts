import { apiUser } from '@/lib/auth'
import { parseMaterials } from '@/lib/materials'
import { MATERIAL_COLUMNS, getProject, toMaterial } from '@/lib/projects'
import { UUID, badRequest, readJson } from '@/lib/validate'

// Adds a material that wasn't tied to a session, like the timber you bought
// before the first cut.
export async function POST(req: Request) {
  const { supabase, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized

  try {
    const body = await readJson(req)
    const projectId = typeof body.project_id === 'string' && UUID.test(body.project_id) ? body.project_id : null
    if (!projectId || !(await getProject(supabase, projectId))) return Response.json({ error: 'Project not found' }, { status: 404 })

    const [material] = parseMaterials([body])
    if (!material) return Response.json({ error: 'Give the material a name' }, { status: 400 })

    const { data, error } = await supabase
      .from('project_materials')
      .insert({ ...material, project_id: projectId })
      .select(MATERIAL_COLUMNS)
      .single()
    if (error || !data) return Response.json({ error: 'Could not add the material' }, { status: 500 })
    return Response.json({ material: toMaterial(data) }, { status: 201 })
  } catch (e) {
    return badRequest(e)
  }
}
