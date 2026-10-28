import type { Plan } from './types'

// From the spec: free gets 3 active projects, pro gets unlimited projects, AI
// troubleshooting and the stats page. Limits only apply when ENFORCE_PRO is on,
// so the whole app is usable before billing is wired up.
export function enforcingPlans(): boolean {
  return process.env.ENFORCE_PRO === 'true'
}

export const FREE_ACTIVE_PROJECTS = 3

export function limitsFor(plan: Plan) {
  const limited = enforcingPlans() && plan !== 'pro'
  return {
    activeProjects: limited ? FREE_ACTIVE_PROJECTS : Infinity,
    troubleshoot: !limited,
    stats: !limited,
  }
}

export type Limits = ReturnType<typeof limitsFor>

// Ceiling on vision calls per person per day, pro included, so a stuck client
// or a script can't run up the bill.
export const DAILY_TROUBLESHOOT_CAP = 15

export function startOfUtcDayIso(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
}
