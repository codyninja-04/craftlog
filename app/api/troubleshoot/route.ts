import { apiUser } from '@/lib/auth'
import { claudeAvailable } from '@/lib/claude/client'
import { troubleshootIssue } from '@/lib/claude/troubleshooter'
import { DAILY_TROUBLESHOOT_CAP, limitsFor, startOfUtcDayIso } from '@/lib/plan'
import { isOwnPhotoPath } from '@/lib/photos/shared'
import { downloadPhoto } from '@/lib/photos/server'
import { SESSION_COLUMNS, getProject, toSession } from '@/lib/projects'
import { UUID, badRequest, readJson, str } from '@/lib/validate'

export const maxDuration = 60

export async function POST(req: Request) {
  const { supabase, user, plan, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized

  if (!limitsFor(plan).troubleshoot) return Response.json({ error: 'Troubleshooting is part of Pro.', code: 'pro' }, { status: 402 })
  if (!claudeAvailable()) return Response.json({ error: 'Troubleshooting is not set up on this server yet.' }, { status: 503 })

  try {
    const body = await readJson(req)
    const projectId = typeof body.project_id === 'string' && UUID.test(body.project_id) ? body.project_id : null
    const project = projectId ? await getProject(supabase, projectId) : null
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 })

    const problem = str(body.problem_description, 'Problem', { max: 2000, required: true })!
    if (problem.length < 8) return Response.json({ error: 'Describe the problem in a few more words' }, { status: 400 })

    let photoPath: string | null = null
    if (body.photo_url != null) {
      if (!isOwnPhotoPath(body.photo_url, user.id, project.id)) return Response.json({ error: "That photo doesn't belong to this project" }, { status: 400 })
      photoPath = body.photo_url
    }

    // RLS on the join means this only counts the caller's own sessions.
    const { count } = await supabase
      .from('troubleshoot_sessions')
      .select('id, craft_projects!inner(user_id)', { count: 'exact', head: true })
      .eq('craft_projects.user_id', user.id)
      .gte('created_at', startOfUtcDayIso())
    if ((count ?? 0) >= DAILY_TROUBLESHOOT_CAP) {
      return Response.json({ error: `That's ${DAILY_TROUBLESHOOT_CAP} troubleshoots today. The limit resets at midnight UTC.` }, { status: 429 })
    }

    const image = photoPath ? await downloadPhoto(supabase, photoPath) : null
    if (photoPath && !image) return Response.json({ error: "Couldn't read that photo. Try uploading it again." }, { status: 400 })

    const [entries, earlier] = await Promise.all([
      supabase.from('project_log_entries').select('logged_at, entry_text').eq('project_id', project.id).not('entry_text', 'is', null).order('logged_at', { ascending: false }).limit(6),
      supabase.from('troubleshoot_sessions').select('problem_description, suggested_fixes, resolved, resolution_note').eq('project_id', project.id).order('created_at', { ascending: false }).limit(3),
    ])

    const result = await troubleshootIssue(image, problem, {
      craftType: project.craft_type,
      projectName: project.name,
      projectNotes: project.description,
      recentEntries: (entries.data ?? []).map((e) => `${String(e.logged_at).slice(0, 10)}: ${String(e.entry_text).slice(0, 400)}`),
      earlierAttempts: (earlier.data ?? []).map((s) => ({
        problem: String(s.problem_description).slice(0, 300),
        fixes: ((s.suggested_fixes as string[] | null) ?? []).slice(0, 4),
        resolved: !!s.resolved,
        note: (s.resolution_note as string | null) ?? null,
      })),
    }).catch((e) => {
      console.error('troubleshoot failed', e)
      return null
    })

    if (!result) return Response.json({ error: "Couldn't get a diagnosis right now. Try again in a minute." }, { status: 502 })

    const { data, error } = await supabase
      .from('troubleshoot_sessions')
      .insert({
        project_id: project.id,
        photo_url: photoPath,
        problem_description: problem,
        ai_diagnosis: result.diagnosis,
        likely_causes: result.likely_causes,
        suggested_fixes: result.suggested_fixes,
        confidence: result.confidence,
      })
      .select(SESSION_COLUMNS)
      .single()
    if (error || !data) return Response.json({ error: 'Got a diagnosis but could not save it. Try again.' }, { status: 500 })

    return Response.json({ session: toSession(data), needs_better_photo: result.needs_better_photo }, { status: 201 })
  } catch (e) {
    return badRequest(e)
  }
}
