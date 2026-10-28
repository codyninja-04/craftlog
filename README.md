# CraftLog

A project log for makers. Woodworkers, knitters, 3D printers, model builders, potters, anyone whose hobby involves physical builds, materials and a few failed attempts along the way.

Log each session with a photo, a note, the time it took and anything you bought. CraftLog keeps the running totals per project, shows your progress photos in order, and when something goes wrong (a print warps, the gauge won't match, the finish goes blotchy) you can show it a photo and get the likely cause plus a short list of fixes, cheapest first.

## What's in it

- **Projects** with craft type, status (planning, in progress, finished, shelved), start and finish dates and notes. Filter by status and craft.
- **Build log** per project. Each entry can have notes, one photo, time spent (type `1.5`, `1:30` or `1h 30m`), materials bought in that session, and a milestone flag. Entries can be backdated.
- **Materials tracker**, the bill of materials for a project. Items bought with a session and items bought up front land in the same list, and that list is the only source of the cost total, so nothing gets counted twice.
- **Progress photos** grid with a full screen viewer. Any log photo can be set as the cover. Without one, the newest milestone photo is used.
- **Troubleshooting** with Claude Vision. Photo is optional but encouraged. The prompt includes the project notes, recent log entries and earlier troubleshoots on the same project (and whether those fixes worked), so the advice fits the actual setup. Each diagnosis has a confidence level, causes, and fixes you can tick off. Mark it solved with a note on what actually fixed it.
- **Stats**: hours per month stacked by craft, time and cost by craft, finished builds side by side within a craft, a weeks in a row count, and a "lessons learned" list built from your solved troubleshoots.
- **Settings**: currency for display, JSON export of everything, account deletion (photos included).

## Stack

Next.js 14 (App Router), TypeScript strict, Supabase (Postgres with RLS, Google OAuth, private Storage bucket), Claude API with vision, Recharts, Tailwind.

## Running it

```bash
npm install
cp .env.local.example .env.local   # fill in the values
npm run dev
```

1. Create a Supabase project and run `supabase/migrations/001_initial_schema.sql` in the SQL editor. It creates the tables, RLS policies, the totals triggers, the profile trigger and the private `project-photos` bucket with its storage policies.
2. Turn on the Google provider under Authentication and add `http://localhost:3000/auth/callback` (and your production URL) to the redirect URLs.
3. Set `ANTHROPIC_API_KEY`. `CLAUDE_MODEL` is optional and defaults to `claude-sonnet-5-5`.

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## How a few things work

**Photos.** The browser shrinks every photo to 1600px JPEG before uploading straight to the private bucket under `{user_id}/{project_id}/`. Storage policies only allow access to your own folder. The database stores the path, not a URL, and pages sign paths for an hour when they render. The API checks any path a client sends against that folder before saving it.

**Totals.** `total_time_hours` and `total_material_cost` on a project, and `material_cost` on an entry, are kept up to date by database triggers. The app never writes them.

**Plans.** Free is 3 active projects (planning or in progress). Pro is $5 a month for unlimited projects, troubleshooting and stats. Limits only apply when `ENFORCE_PRO=true`, so everything is unlocked until billing is wired up. `profiles.plan` can't be changed by users, only the currency column is writable. There's also a daily cap of 15 troubleshoots per person for everyone.

## Not building

No marketplace for finished pieces, and no pattern or plan marketplace.
