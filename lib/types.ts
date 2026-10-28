export const CRAFT_TYPES = ['woodworking', 'knitting_crochet', '3d_printing', 'model_building', 'sewing', 'pottery', 'electronics', 'other'] as const
export type CraftType = (typeof CRAFT_TYPES)[number]

export const STATUSES = ['planning', 'in_progress', 'completed', 'abandoned'] as const
export type ProjectStatus = (typeof STATUSES)[number]

export type Plan = 'free' | 'pro'
export type Confidence = 'low' | 'medium' | 'high'

export interface Project {
  id: string
  user_id: string
  created_at: string
  updated_at: string
  name: string
  description: string | null
  craft_type: CraftType
  status: ProjectStatus
  cover_photo_url: string | null
  total_time_hours: number
  total_material_cost: number
  started_at: string | null
  completed_at: string | null
}

export interface LogEntry {
  id: string
  project_id: string
  logged_at: string
  entry_text: string | null
  photo_url: string | null
  time_spent_hours: number | null
  material_cost: number
  is_milestone: boolean
}

export interface Material {
  id: string
  project_id: string
  log_entry_id: string | null
  created_at: string
  name: string
  quantity: string | null
  cost: number
}

export interface TroubleshootSession {
  id: string
  project_id: string
  created_at: string
  photo_url: string | null
  problem_description: string
  ai_diagnosis: string | null
  likely_causes: string[]
  suggested_fixes: string[]
  confidence: Confidence | null
  resolved: boolean
  resolution_note: string | null
  resolved_at: string | null
}

export interface Diagnosis {
  diagnosis: string
  likely_causes: string[]
  suggested_fixes: string[]
  confidence: Confidence
  needs_better_photo: boolean
}

// Postgres numeric can come back as a string through PostgREST, so every
// number read off a row goes through this first.
export function toNumber(v: unknown): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isFinite(n) ? n : 0
}
