import { apiUser } from '@/lib/auth'
import { UUID } from '@/lib/validate'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { supabase, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized
  if (!UUID.test(params.id)) return Response.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabase.from('project_materials').delete().eq('id', params.id).select('id')
  if (error) return Response.json({ error: 'Could not remove the material' }, { status: 500 })
  if (!data?.length) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ ok: true })
}
