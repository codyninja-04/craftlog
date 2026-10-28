import type { SupabaseClient } from '@supabase/supabase-js'
import type { LogEntry, Material, Project, TroubleshootSession } from './types'
import { toNumber } from './types'

export const PROJECT_COLUMNS =
  'id, user_id, created_at, updated_at, name, description, craft_type, status, cover_photo_url, total_time_hours, total_material_cost, started_at, completed_at'
export const ENTRY_COLUMNS = 'id, project_id, logged_at, entry_text, photo_url, time_spent_hours, material_cost, is_milestone'
export const MATERIAL_COLUMNS = 'id, project_id, log_entry_id, created_at, name, quantity, cost'
export const SESSION_COLUMNS =
  'id, project_id, created_at, photo_url, problem_description, ai_diagnosis, likely_causes, suggested_fixes, confidence, resolved, resolution_note, resolved_at'

export function toProject(row: Record<string, unknown>): Project {
  return {
    ...(row as unknown as Project),
    total_time_hours: toNumber(row.total_time_hours),
    total_material_cost: toNumber(row.total_material_cost),
  }
}

export function toEntry(row: Record<string, unknown>): LogEntry {
  return {
    ...(row as unknown as LogEntry),
    time_spent_hours: row.time_spent_hours == null ? null : toNumber(row.time_spent_hours),
    material_cost: toNumber(row.material_cost),
  }
}

export function toMaterial(row: Record<string, unknown>): Material {
  return { ...(row as unknown as Material), cost: toNumber(row.cost) }
}

export function toSession(row: Record<string, unknown>): TroubleshootSession {
  return {
    ...(row as unknown as TroubleshootSession),
    likely_causes: Array.isArray(row.likely_causes) ? (row.likely_causes as string[]) : [],
    suggested_fixes: Array.isArray(row.suggested_fixes) ? (row.suggested_fixes as string[]) : [],
  }
}

export async function getProject(supabase: SupabaseClient, id: string): Promise<Project | null> {
  const { data } = await supabase.from('craft_projects').select(PROJECT_COLUMNS).eq('id', id).maybeSingle()
  return data ? toProject(data) : null
}

// Everything the project page needs in one go. RLS scopes every query, so a
// project id from someone else just comes back empty.
export async function getProjectBundle(supabase: SupabaseClient, id: string) {
  const [project, entries, materials, sessions] = await Promise.all([
    getProject(supabase, id),
    supabase.from('project_log_entries').select(ENTRY_COLUMNS).eq('project_id', id).order('logged_at', { ascending: false }).limit(500),
    supabase.from('project_materials').select(MATERIAL_COLUMNS).eq('project_id', id).order('created_at', { ascending: true }).limit(500),
    supabase.from('troubleshoot_sessions').select(SESSION_COLUMNS).eq('project_id', id).order('created_at', { ascending: false }).limit(50),
  ])
  if (!project) return null
  return {
    project,
    entries: (entries.data ?? []).map(toEntry),
    materials: (materials.data ?? []).map(toMaterial),
    sessions: (sessions.data ?? []).map(toSession),
  }
}

export async function countActive(supabase: SupabaseClient, userId: string, excludeId?: string): Promise<number> {
  let q = supabase.from('craft_projects').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('status', ['planning', 'in_progress'])
  if (excludeId) q = q.neq('id', excludeId)
  const { count } = await q
  return count ?? 0
}

// Cover falls back to the newest milestone photo, then the newest photo.
export function pickCover(project: Pick<Project, 'cover_photo_url'>, entries: Pick<LogEntry, 'photo_url' | 'is_milestone' | 'logged_at'>[]): string | null {
  if (project.cover_photo_url) return project.cover_photo_url
  const withPhotos = entries.filter((e) => e.photo_url).sort((a, b) => b.logged_at.localeCompare(a.logged_at))
  return withPhotos.find((e) => e.is_milestone)?.photo_url ?? withPhotos[0]?.photo_url ?? null
}
