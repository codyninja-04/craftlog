import type { CraftType, ProjectStatus } from './types'

export const CRAFT_LABELS: Record<CraftType, string> = {
  woodworking: 'Woodworking',
  knitting_crochet: 'Knitting & crochet',
  '3d_printing': '3D printing',
  model_building: 'Model building',
  sewing: 'Sewing',
  pottery: 'Pottery',
  electronics: 'Electronics',
  other: 'Other',
}

// Placeholder for the project notes, nudging people toward the details that
// make troubleshooting useful later.
export const CRAFT_HINTS: Record<CraftType, string> = {
  woodworking: 'Species, rough dimensions, joinery, the finish you plan to use',
  knitting_crochet: 'Yarn weight and fibre, needle or hook size, pattern, target gauge',
  '3d_printing': 'Printer, filament, nozzle and bed temps, slicer profile',
  model_building: 'Kit and scale, paints, glue, weathering plan',
  sewing: 'Fabric, pattern and size, machine settings, interfacing',
  pottery: 'Clay body, glaze, cone, wheel or hand built',
  electronics: 'Board, main parts, power supply, what it should do',
  other: 'Materials, tools and what done looks like',
}

// Categorical chart colours, one per craft in a fixed order so a craft keeps
// its colour on every chart. This is the validated reference order from the
// dataviz palette script, checked against the light surface.
export const CRAFT_COLORS: Record<CraftType, string> = {
  woodworking: '#2a78d6',
  knitting_crochet: '#eb6834',
  '3d_printing': '#1baf7a',
  model_building: '#eda100',
  sewing: '#e87ba4',
  pottery: '#008300',
  electronics: '#6250d6',
  other: '#e34948',
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planning',
  in_progress: 'In progress',
  completed: 'Completed',
  abandoned: 'Shelved',
}

// Planning and in progress count toward the free plan's active limit.
export function isActive(status: ProjectStatus): boolean {
  return status === 'planning' || status === 'in_progress'
}
