# Sisyphus UI — Design

**Date:** 2026-05-03
**Branch:** `feat/ui`
**Status:** Design approved by user; awaiting spec review.

A minimalist Next.js + shadcn UI on top of the existing Sisyphus markdown vault. The vault remains the single source of truth; the UI is a thin reader with a small set of frontmatter writes. Always-on local service on the Pi, LAN-only, no auth.

---

## 1. Goals & non-goals

**Goals**

- Browseable view of every active goal: prose, progress, sources, concepts.
- Calendar/schedule showing past standups, missed standups, past research runs, upcoming research.
- Per-goal cadence configuration (`standup_interval`, `research_interval`) editable from the UI.
- Research history across goals with a short description of each run.
- A small `scheduler.sh` that reads cadence from the vault and triggers `claude -p '/research <slug>'` when due.

**Non-goals (v1)**

- Triggering `/standup` or `/research` from the UI. CLI remains the only entry point for AI runs.
- An in-browser chat. Standups stay terminal-driven.
- Public hosting, auth, multi-user, or sync.
- A database, search index, or file watcher. Direct filesystem reads only.
- E2E browser tests.

---

## 2. Architecture

### 2.1 Repo layout

```
sisyphus/                       # repo root, vault lives here
├── CLAUDE.md, README.md, INDEX.md, LOG.md
├── _shared/wiki/concepts/
├── goals/<slug>/...             # untouched
├── web/                         # Next.js app
│   ├── app/                     # App Router pages
│   ├── components/              # shadcn + custom
│   ├── lib/                     # vault.ts, schedule.ts, types.ts
│   ├── test/fixtures/           # vitest fixtures
│   ├── package.json, tsconfig.json, next.config.ts
│   └── .env.local               # VAULT_PATH=..
├── scripts/
│   └── scheduler.sh             # cron-invoked
└── .sisyphus/
    └── scheduler.log            # gitignored
```

### 2.2 Stack

- Next.js 15 (App Router) + React 19 + TypeScript.
- Tailwind CSS + shadcn/ui (`Card`, `Tabs`, `Calendar`, `Badge`, `ScrollArea`, `Sheet`, `Form`, `Input`, `Select`, `Button`, `Table`).
- `gray-matter` (frontmatter), `remark` + `remark-gfm` + `remark-wiki-link`, `rehype-sanitize`, `rehype-stringify` (markdown → HTML).
- `zod` (Server Action validation).
- `pnpm` package manager.
- `vitest` (unit tests), `bats-core` (`scheduler.sh` tests).

### 2.3 Process model

- One Next.js production process on the Pi via systemd, listening on `:3000` bound to `0.0.0.0`.
- One cron entry: `*/15 * * * * /opt/sisyphus/scripts/scheduler.sh`.
- No DB, no cache layer, no file watcher. Every request walks the filesystem.

### 2.4 Vault path resolution

- `VAULT_PATH` env var (defaults to `..` so `pnpm dev` from `web/` just works).
- Production systemd unit sets it to the absolute path.

---

## 3. Data model changes

Two new frontmatter fields on `_goal.md`:

```yaml
---
type: goal
slug: wealth
title: ...
status: active
priority: 1
created: 2026-04-26
target_review: 2026-07-26
standup_interval: 7d        # NEW — accepts: 1d / 7d / 14d / 30d / daily / weekly
research_interval: 1d       # NEW — same format
---
```

- **Format:** Go-style duration (`<n>d`) is canonical. The parser also accepts `daily` (= `1d`) and `weekly` (= `7d`) for human-friendliness.
- **Defaults if absent:** `standup_interval: 1d`, `research_interval: 1d`. Backward-compatible with existing `_goal.md` files.

### 3.1 Computed (not stored)

- *Last standup* = max date in `goals/<slug>/raw/interviews/*.md` filenames.
- *Next standup due* = last + interval (today if no interviews exist yet).
- *Last research* = newest `[<ts>] research <slug>:` line in `LOG.md`.
- *Next research due* = last + interval.

### 3.2 CLAUDE.md change

A single edit to the "Goal definition" section:

> Frontmatter on `_goal.md` is structured config and may be edited by tools (the UI, the scheduler). The body sections (Why this matters, Success criteria, etc.) remain human-only.

No other schema changes anywhere in the vault.

---

## 4. Routes & views

```
/                              Dashboard
/goals                         Goals list
/goals/[slug]                  Goal detail (Overview / Sources / Concepts tabs)
/goals/[slug]/edit             Goal settings (frontmatter only)
/goals/[slug]/sources/[id]     Source page
/goals/[slug]/concepts/[id]    Concept page
/calendar                      Schedule grid
/research                      Research history + upcoming
/log                           LOG.md, raw
```

### 4.1 Dashboard `/`

- Hero strip: "Today, you owe N standups." (Computed: count of active goals where next-standup-due ≤ today.)
- One card per active goal: title, status badge, last standup (relative), next standup (relative + colored: green = future, amber = today, red = overdue), next research run, last 3 events.

### 4.2 Goals list `/goals`

- shadcn `Table` of all goals with status, priority, intervals, last/next standup, last/next research.
- Sortable columns. Status filter (active / paused / done / abandoned).

### 4.3 Goal detail `/goals/[slug]`

Three-tab layout (`Tabs`):

- **Overview** — renders `_goal.md` body (read-only) + `progress.md` body. Sidebar shows interval badges and "Edit settings" link.
- **Sources** — list of source pages with TL;DR previews. Filter by date / `source_kind` / `confidence`.
- **Concepts** — list of concept pages with provenance ratios visualized (small bar showing extracted / inferred / ambiguous shares).

### 4.4 Goal edit `/goals/[slug]/edit`

shadcn `Form`. Editable: `status`, `priority`, `target_review`, `standup_interval`, `research_interval`. Read-only: `slug`, `title`, `created`. Save → Server Action writes frontmatter back; body untouched.

### 4.5 Calendar `/calendar`

shadcn `Calendar` in month view. Each day shows event dots:

- Green dot — standup completed (interview file exists for that date).
- Red dot — standup was due but missed.
- Blue dot — research run completed.
- Grey dot — research scheduled (future).

Click a day → side `Sheet` with that day's events listed. Toggle between week and month view.

### 4.6 Research `/research`

Two stacked sections:

- **Upcoming** — small table: goal · next due · interval · last run.
- **History** — reverse-chronological timeline. Each entry = one row from `LOG.md` + a one-liner derived from source pages added in that run (title of the most-cited new source, or count + topics if multiple).

### 4.7 Log `/log`

Reverse-chronological render of `LOG.md`. Search box. No editing.

### 4.8 Source / concept pages

Body rendered as HTML; frontmatter rendered as a sidebar metadata panel. `[[wikilinks]]` rendered as real `<Link>`s. Backlinks computed and shown at the bottom (scan all pages once per request, since scale is tiny).

### 4.9 Navigation

Persistent left sidebar (collapsible to icons): Dashboard, Goals, Calendar, Research, Log. Top bar: vault name + "today is overdue" badge if anything's overdue.

---

## 5. Read / write data flow

### 5.1 Read path (every request)

1. Page is a server component. Calls `lib/vault.ts` helpers like `listGoals()`, `readGoal(slug)`, `listInterviews(slug)`, `tailLog(n)`.
2. Helpers use `fs/promises`, `gray-matter` for frontmatter, `remark` → `rehype-sanitize` → `rehype-stringify` for body. Wikilinks resolved via `remark-wiki-link` with a `pageResolver` that maps `[[2026-04-26-foo]]` → `/goals/<slug>/sources/2026-04-26-foo`.
3. Page sets `export const dynamic = 'force-dynamic'`. Fresh fs read every request — no caching.

### 5.2 Write path

UI writes are **frontmatter-only** and limited to `_goal.md`:

1. shadcn `Form` submits to a Server Action `updateGoalFrontmatter(slug, partial)`.
2. Action validates input with Zod (interval format, status enum, priority int, ISO date for `target_review`).
3. Reads file → parses with `gray-matter` → merges new frontmatter → stringifies. Body preserved byte-for-byte.
4. Atomic write: `writeFile(path + '.tmp', ...)` then `rename(path + '.tmp', path)`. Avoids torn reads if scheduler is concurrently reading.
5. `revalidatePath('/goals/' + slug)` and `revalidatePath('/calendar')` so subsequent reads are fresh.

**Editable frontmatter fields:** `status`, `priority`, `target_review`, `standup_interval`, `research_interval`. Everything else (`slug`, `title`, `created`, `type`) is read-only in the UI.

### 5.3 Concurrency

Writers in the system:

- **Server Actions** — write only `_goal.md` frontmatter (atomic temp+rename).
- **`scheduler.sh`** — writes only `.sisyphus/scheduler.log` (append).
- **`claude -p '/research'` invocations** (spawned by the scheduler) — write to `goals/<slug>/raw/`, `goals/<slug>/wiki/`, and append to `LOG.md` per existing convention.

No two writers touch the same file. The UI only reads `raw/`, `wiki/`, and `LOG.md`, so it never collides with the Claude runs.

---

## 6. `scheduler.sh`

Lives at `scripts/scheduler.sh`. Invoked by one cron line: `*/15 * * * * /opt/sisyphus/scripts/scheduler.sh`. Triggers `/research` only — never `/standup`.

```bash
#!/usr/bin/env bash
# scheduler.sh — read each active goal's frontmatter, fire claude -p
# when research_interval has elapsed since last research run.
set -euo pipefail

VAULT="${VAULT_PATH:-$(cd "$(dirname "$0")/.." && pwd)}"
LOG="$VAULT/LOG.md"
NOW=$(date -u +%s)

# Tiny helper: extract a YAML scalar from the frontmatter block.
fm() { awk -v k="$1" '
  /^---$/ { f=!f; next }
  f && $1 == k":" { sub(/^[^:]+:[ ]*/, ""); print; exit }
' "$2"; }

# Parse "1d" / "7d" / "daily" / "weekly" -> seconds
to_seconds() {
  case "$1" in
    daily)  echo 86400 ;;
    weekly) echo 604800 ;;
    *d)     echo $(( ${1%d} * 86400 )) ;;
    *)      echo 86400 ;;  # default
  esac
}

mkdir -p "$VAULT/.sisyphus"

for goal_dir in "$VAULT"/goals/*/; do
  slug=$(basename "$goal_dir")
  goal_file="$goal_dir/_goal.md"
  [[ -f "$goal_file" ]] || continue
  [[ "$(fm status "$goal_file")" == "active" ]] || continue

  research_interval=$(to_seconds "$(fm research_interval "$goal_file" || echo 1d)")
  last_research=$(grep -E "^\[.*\] research $slug:" "$LOG" 2>/dev/null | tail -1 \
    | grep -oE '\[[0-9-]+ [0-9:]+\]' | tr -d '[]' || true)
  if [[ -n "$last_research" ]]; then
    last_ts=$(date -u -d "$last_research" +%s)
  else
    last_ts=0
  fi

  if (( NOW - last_ts >= research_interval )); then
    echo "[$(date -u +%FT%TZ)] scheduler: triggering research for $slug" \
      >> "$VAULT/.sisyphus/scheduler.log"
    cd "$VAULT" && claude -p "/research $slug" \
      >> "$VAULT/.sisyphus/scheduler.log" 2>&1 || true
  fi
done
```

**Properties**

- No Node, no extra deps — works on the Pi out of the box.
- Idempotent: cron fires every 15 min but only triggers when `research_interval` has actually elapsed.
- Per-goal failures are swallowed (`|| true`) so one broken goal doesn't kill the whole sweep.
- The `claude -p '/research'` invocation itself appends a `[ts] research <slug>: +N sources, ~M concepts` line to `LOG.md` per existing convention; that's what the next scheduler run reads to compute "last research."

---

## 7. Error handling

Single-user, LAN-only, file-backed. Intentionally minimal:

- **Malformed frontmatter** → log to console, render an error card on that goal's row instead of crashing the page. Other goals stay readable.
- **Missing files** (e.g. goal listed in `INDEX.md` but folder deleted) → 404 page with a "vault is out of sync" hint.
- **Server Action validation** → Zod schema for the editable subset; field-level errors via shadcn `Form`.
- **Atomic writes** → temp-file + rename; if the process dies mid-write, the original is intact.
- **Scheduler errors** → `|| true` per goal in the loop; `.sisyphus/scheduler.log` captures both stdout and stderr.
- **No global error boundary heroics.** A bad page is fine — stack trace shows in the terminal, fix it.

---

## 8. Testing

- **Vitest** for `lib/vault.ts` against a fixture vault under `web/test/fixtures/`. Covers: frontmatter parse, interval parse (`1d` / `daily` / `7d` / `weekly`), wikilink resolution, last/next-due computation.
- **Vitest** for Server Actions: assert frontmatter is updated, body is preserved byte-for-byte, atomic write semantics hold.
- **bats-core** for `scheduler.sh`: drop fixture files into a tmp vault, run with a stubbed `claude` binary that echoes args, assert which goals would have been triggered for each scenario (no prior run, just-ran, overdue, paused).
- **No Playwright in v1.** UI is small, read/write logic is well covered by unit tests. Add E2E if/when we layer in Approach 2 (indexed reader) or later.

---

## 9. Deployment

### 9.1 Build & run

```bash
cd web
pnpm install
pnpm build
pnpm start  # listens on :3000
```

### 9.2 systemd unit (sketch)

```ini
[Unit]
Description=Sisyphus UI
After=network.target

[Service]
WorkingDirectory=/opt/sisyphus/web
Environment=VAULT_PATH=/opt/sisyphus
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=0.0.0.0
ExecStart=/usr/bin/pnpm start
Restart=on-failure
User=akira

[Install]
WantedBy=multi-user.target
```

### 9.3 cron line

```cron
*/15 * * * * /opt/sisyphus/scripts/scheduler.sh
```

---

## 10. Open follow-ups (not in v1)

- Approach 2 (in-memory index w/ chokidar) if cross-goal queries get sluggish (~200ms+ page loads).
- Approach 3 (SQLite sidecar) only if scale outgrows a personal vault.
- Triggering `/standup` and `/research` from the UI (Approach c → b in Q2 terms).
- Public hosting / auth.
- E2E tests (Playwright).
- A real "research summary" line in `LOG.md` so the research history view doesn't have to derive descriptions from source page titles.
