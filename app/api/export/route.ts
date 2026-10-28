import { apiUser } from '@/lib/auth'
import { signPhotos } from '@/lib/photos/server'
import { ENTRY_COLUMNS, MATERIAL_COLUMNS, PROJECT_COLUMNS, SESSION_COLUMNS, toEntry, toMaterial, toProject, toSession } from '@/lib/projects'

// Everything the user owns, nested by project, as a downloadable JSON file.
export async function GET() {
  const { supabase, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized

  const [projects, entries, materials, sessions] = await Promise.all([
    supabase.from('craft_projects').select(PROJECT_COLUMNS).order('created_at').limit(2000),
    supabase.from('project_log_entries').select(ENTRY_COLUMNS).order('logged_at').limit(20000),
    supabase.from('project_materials').select(MATERIAL_COLUMNS).order('created_at').limit(20000),
    supabase.from('troubleshoot_sessions').select(SESSION_COLUMNS).order('created_at').limit(5000),
  ])
  if (projects.error) return Response.json({ error: 'Could not build the export' }, { status: 500 })

  const e = (entries.data ?? []).map(toEntry)
  const m = (materials.data ?? []).map(toMaterial)
  const s = (sessions.data ?? []).map(toSession)
  const urls = await signPhotos(supabase, [...e.map((x) => x.photo_url), ...s.map((x) => x.photo_url)])
  const link = (path: string | null) => (path ? urls[path] ?? null : null)

  const body = {
    exported_at: new Date().toISOString(),
    note: 'Photo links expire an hour after export.',
    projects: (projects.data ?? []).map(toProject).map(({ user_id: _u, ...p }) => ({
      ...p,
      log_entries: e.filter((x) => x.project_id === p.id).map((x) => ({ ...x, photo_link: link(x.photo_url) })),
      materials: m.filter((x) => x.project_id === p.id),
      troubleshoot_sessions: s.filter((x) => x.project_id === p.id).map((x) => ({ ...x, photo_link: link(x.photo_url) })),
    })),
  }

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="craftlog-export-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
