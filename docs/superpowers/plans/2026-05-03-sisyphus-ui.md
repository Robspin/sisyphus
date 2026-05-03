# Sisyphus UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimalist Next.js + shadcn dashboard over the existing Sisyphus markdown vault, plus a small `scheduler.sh` that triggers `claude -p '/research <slug>'` when due.

**Architecture:** Next.js 15 App Router in `web/` subfolder reads the vault directly via `fs/promises` on every request. No DB, no cache, no file watcher. Server Actions write `_goal.md` frontmatter only (atomic temp+rename). A bash scheduler runs from cron and reads frontmatter to decide which goals are due for research.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, gray-matter, remark/rehype, zod, vitest, bats-core, pnpm.

**Reference spec:** `docs/superpowers/specs/2026-05-03-sisyphus-ui-design.md`

---

## File Structure

**Vault changes (Phase 1):**
- Modify: `CLAUDE.md` — add note that frontmatter is tool-editable
- Modify: `goals/wealth/_goal.md` — add `standup_interval`, `research_interval`
- Modify: `.gitignore` — add `.sisyphus/`, `web/node_modules`, `web/.next`

**Scheduler (Phase 2):**
- Create: `scripts/scheduler.sh`
- Create: `scripts/scheduler.bats`
- Create: `scripts/test-fixtures/` (bats fixture vault)
- Create: `deploy/cron.example`

**Web app foundation (Phase 3):**
- Create: `web/package.json`, `web/tsconfig.json`, `web/next.config.ts`, `web/postcss.config.mjs`, `web/tailwind.config.ts`, `web/components.json`
- Create: `web/.env.local`, `web/.env.example`
- Create: `web/app/layout.tsx`, `web/app/globals.css`, `web/app/page.tsx` (placeholder)
- Create: `web/vitest.config.ts`
- Create: `web/test/fixtures/vault/...` (full fixture vault)

**Library code (Phase 4):**
- Create: `web/lib/types.ts` — TypeScript types
- Create: `web/lib/intervals.ts` — parse / format / arithmetic
- Create: `web/lib/atomic-write.ts` — atomic file write helper
- Create: `web/lib/log.ts` — LOG.md parser
- Create: `web/lib/vault.ts` — fs-based readers
- Create: `web/lib/markdown.ts` — remark/rehype pipeline
- Create: `web/lib/schedule.ts` — last/next/overdue computations + calendar events
- Create: `web/lib/actions.ts` — Server Actions (Zod validated)
- Create matching `web/test/<name>.test.ts` for each lib file

**UI components (Phase 5):**
- Create: `web/components/ui/...` — shadcn primitives
- Create: `web/components/sidebar.tsx`, `web/components/topbar.tsx`
- Create: `web/components/goal-card.tsx`, `web/components/event-dot.tsx`
- Create: `web/components/relative-date.tsx`, `web/components/markdown-content.tsx`
- Create: `web/components/provenance-bar.tsx`
- Create: `web/components/goal-edit-form.tsx`
- Create: `web/components/calendar-view.tsx`

**Routes (Phase 6):**
- Create: `web/app/page.tsx` (dashboard)
- Create: `web/app/goals/page.tsx`, `web/app/goals/[slug]/page.tsx`
- Create: `web/app/goals/[slug]/edit/page.tsx`
- Create: `web/app/goals/[slug]/sources/[id]/page.tsx`
- Create: `web/app/goals/[slug]/concepts/[id]/page.tsx`
- Create: `web/app/calendar/page.tsx`
- Create: `web/app/research/page.tsx`
- Create: `web/app/log/page.tsx`

**Deployment (Phase 7):**
- Create: `deploy/sisyphus-ui.service`
- Modify: `README.md` — add UI section

---

## Phase 1 — Vault data model

### Task 1: Add interval fields to existing goal & update CLAUDE.md

**Files:**
- Modify: `goals/wealth/_goal.md`
- Modify: `CLAUDE.md`
- Modify: `.gitignore`

- [ ] **Step 1: Read the current `goals/wealth/_goal.md` frontmatter**

```bash
head -20 goals/wealth/_goal.md
```

- [ ] **Step 2: Add the two interval fields to the frontmatter**

Use Edit to insert `standup_interval` and `research_interval` lines into the YAML block of `goals/wealth/_goal.md`, right after `target_review`:

```yaml
standup_interval: 7d
research_interval: 1d
```

(`wealth` cadence per user direction during brainstorm: weekly standups, daily research.)

- [ ] **Step 3: Update CLAUDE.md to clarify frontmatter ownership**

In `CLAUDE.md`, find the "### Goal definition — `goals/<slug>/_goal.md`" section that says **"Human-owned. You may append a `## Suggested updates` section..."** and replace that one sentence with:

```markdown
**Frontmatter is structured config and may be edited by tools** (the UI, the scheduler). **Body sections remain human-owned** — you may append a `## Suggested updates` section at the bottom for the human to review, but never modify any prose section above it.
```

Also add `standup_interval` and `research_interval` lines to the example YAML block in that section so future goals follow the convention.

- [ ] **Step 4: Update `.gitignore`**

Append to `.gitignore`:

```
# Sisyphus runtime
.sisyphus/

# Next.js
web/node_modules
web/.next
web/out
```

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md goals/wealth/_goal.md .gitignore
git commit -m "Add per-goal cadence frontmatter and clarify tool-editable scope"
```

---

## Phase 2 — Scheduler

### Task 2: Build the bats fixture vault

**Files:**
- Create: `scripts/test-fixtures/setup.sh`

- [ ] **Step 1: Create the setup script that materializes a tmp vault per test**

Create `scripts/test-fixtures/setup.sh`:

```bash
#!/usr/bin/env bash
# Build a fixture vault under $1 (a tmp dir).
set -euo pipefail
VAULT="$1"

mkdir -p "$VAULT/goals/alpha/raw/interviews" "$VAULT/goals/beta" "$VAULT/goals/gamma" "$VAULT/.sisyphus"

cat > "$VAULT/goals/alpha/_goal.md" <<'EOF'
---
type: goal
slug: alpha
title: Active daily goal
status: active
priority: 1
created: 2026-04-01
research_interval: 1d
standup_interval: 1d
---

# Active goal
EOF

cat > "$VAULT/goals/beta/_goal.md" <<'EOF'
---
type: goal
slug: beta
title: Active weekly goal
status: active
priority: 2
created: 2026-04-01
research_interval: 7d
standup_interval: 7d
---

# Weekly goal
EOF

cat > "$VAULT/goals/gamma/_goal.md" <<'EOF'
---
type: goal
slug: gamma
title: Paused goal
status: paused
priority: 3
created: 2026-04-01
research_interval: 1d
---

# Paused goal
EOF

cat > "$VAULT/LOG.md" <<'EOF'
# Operations log

[2026-04-26 02:00] research alpha: +2 sources, ~1 concepts
EOF
```

- [ ] **Step 2: Make it executable and verify**

```bash
chmod +x scripts/test-fixtures/setup.sh
TMP=$(mktemp -d)
scripts/test-fixtures/setup.sh "$TMP"
ls -la "$TMP/goals/"
cat "$TMP/goals/alpha/_goal.md"
rm -rf "$TMP"
```

Expected: directory listing shows `alpha`, `beta`, `gamma`; alpha's `_goal.md` has the YAML frontmatter.

### Task 3: Write the scheduler bats tests

**Files:**
- Create: `scripts/scheduler.bats`

- [ ] **Step 1: Write the bats test file**

Create `scripts/scheduler.bats`:

```bash
#!/usr/bin/env bats
# Tests for scheduler.sh

setup() {
  TEST_VAULT=$(mktemp -d)
  STUB_DIR=$(mktemp -d)
  CALLS_FILE="$STUB_DIR/calls.log"

  # Stub `claude` binary that just records its arguments.
  cat > "$STUB_DIR/claude" <<EOF
#!/usr/bin/env bash
echo "claude \$@" >> "$CALLS_FILE"
EOF
  chmod +x "$STUB_DIR/claude"
  export PATH="$STUB_DIR:$PATH"

  "$BATS_TEST_DIRNAME/test-fixtures/setup.sh" "$TEST_VAULT"
  export VAULT_PATH="$TEST_VAULT"
}

teardown() {
  rm -rf "$TEST_VAULT" "$STUB_DIR"
}

@test "triggers research for alpha when no prior run is recent" {
  # alpha last researched 2026-04-26; if the test "now" is much later,
  # alpha is overdue. We test by clearing alpha's prior log entry.
  echo "# Empty" > "$TEST_VAULT/LOG.md"
  run "$BATS_TEST_DIRNAME/scheduler.sh"
  [ "$status" -eq 0 ]
  grep -q "claude -p /research alpha" "$CALLS_FILE"
}

@test "skips paused goal gamma" {
  echo "# Empty" > "$TEST_VAULT/LOG.md"
  run "$BATS_TEST_DIRNAME/scheduler.sh"
  [ "$status" -eq 0 ]
  ! grep -q "claude -p /research gamma" "$CALLS_FILE"
}

@test "skips alpha when last research was within interval" {
  # Write a "just happened" log entry for alpha.
  NOW=$(date -u +"%Y-%m-%d %H:%M")
  echo "[$NOW] research alpha: +1 sources, ~0 concepts" > "$TEST_VAULT/LOG.md"
  run "$BATS_TEST_DIRNAME/scheduler.sh"
  [ "$status" -eq 0 ]
  ! grep -q "claude -p /research alpha" "$CALLS_FILE" || \
    [ -z "$(grep 'claude -p /research alpha' "$CALLS_FILE")" ]
}

@test "triggers research for beta only when its 7d interval has elapsed" {
  # Last research 6 days ago — should NOT trigger.
  PAST=$(date -u -d "6 days ago" +"%Y-%m-%d %H:%M")
  echo "[$PAST] research beta: +1 sources, ~0 concepts" > "$TEST_VAULT/LOG.md"
  run "$BATS_TEST_DIRNAME/scheduler.sh"
  ! grep -q "claude -p /research beta" "$CALLS_FILE"
}

@test "writes to .sisyphus/scheduler.log" {
  echo "# Empty" > "$TEST_VAULT/LOG.md"
  run "$BATS_TEST_DIRNAME/scheduler.sh"
  [ -f "$TEST_VAULT/.sisyphus/scheduler.log" ]
  grep -q "scheduler:" "$TEST_VAULT/.sisyphus/scheduler.log"
}

@test "still succeeds when LOG.md is missing" {
  rm -f "$TEST_VAULT/LOG.md"
  run "$BATS_TEST_DIRNAME/scheduler.sh"
  [ "$status" -eq 0 ]
}
```

- [ ] **Step 2: Run the tests to verify they fail (no scheduler.sh yet)**

```bash
which bats || (echo "Install bats-core: sudo apt-get install bats" && exit 1)
bats scripts/scheduler.bats
```

Expected: all tests fail because `scripts/scheduler.sh` doesn't exist yet.

### Task 4: Implement scheduler.sh

**Files:**
- Create: `scripts/scheduler.sh`

- [ ] **Step 1: Write the script**

Create `scripts/scheduler.sh` exactly as specified in `docs/superpowers/specs/2026-05-03-sisyphus-ui-design.md` §6:

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
    *)      echo 86400 ;;
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

- [ ] **Step 2: Make it executable**

```bash
chmod +x scripts/scheduler.sh
```

- [ ] **Step 3: Run the bats tests — all should pass**

```bash
bats scripts/scheduler.bats
```

Expected: 6 passing tests.

- [ ] **Step 4: Commit**

```bash
git add scripts/scheduler.sh scripts/scheduler.bats scripts/test-fixtures/
git commit -m "Add scheduler.sh that fires claude -p '/research' per goal cadence"
```

### Task 5: Add deploy artifacts

**Files:**
- Create: `deploy/cron.example`

- [ ] **Step 1: Create the cron example file**

Create `deploy/cron.example`:

```cron
# Sisyphus scheduler — checks every 15 minutes whether any active goal
# is overdue for research, fires claude -p '/research <slug>' when so.
# Install with: crontab -e  (paste the line below, adjust path)

*/15 * * * * /opt/sisyphus/scripts/scheduler.sh
```

- [ ] **Step 2: Commit**

```bash
git add deploy/cron.example
git commit -m "Add cron example for scheduler"
```

---

## Phase 3 — Next.js scaffolding

### Task 6: Initialize the Next.js project

**Files:**
- Create: `web/package.json`, `web/tsconfig.json`, `web/next.config.ts`, `web/postcss.config.mjs`, `web/tailwind.config.ts`, `web/.gitignore`
- Create: `web/.env.local`, `web/.env.example`
- Create: `web/app/layout.tsx`, `web/app/globals.css`, `web/app/page.tsx`

- [ ] **Step 1: Verify pnpm and Node are available**

```bash
node --version  # expect >= 20
pnpm --version  # expect >= 9
```

If pnpm is missing: `npm i -g pnpm`.

- [ ] **Step 2: Bootstrap Next.js inside `web/`**

```bash
cd web 2>/dev/null && cd .. ; rm -rf web  # clean slate if a prior attempt exists
pnpm create next-app@latest web --ts --app --tailwind --eslint --src-dir false --import-alias "@/*" --use-pnpm --no-turbopack
```

When prompted by `create-next-app`, accept defaults that match the flags above.

- [ ] **Step 3: Add `.env.local` and `.env.example`**

`web/.env.local`:

```
VAULT_PATH=..
```

`web/.env.example`:

```
VAULT_PATH=..
# In production: absolute path to the vault repo root
# VAULT_PATH=/opt/sisyphus
```

- [ ] **Step 4: Verify the dev server boots**

```bash
cd web && pnpm dev &
sleep 5
curl -s http://localhost:3000 | head -20
kill %1
```

Expected: HTML containing the Next.js starter content.

- [ ] **Step 5: Commit the scaffold**

```bash
git add web/ -- ':!web/node_modules' ':!web/.next'
git commit -m "Scaffold Next.js 15 app in web/"
```

### Task 7: Install shadcn/ui and add the primitives we need

**Files:**
- Create: `web/components.json`
- Create: `web/components/ui/*.tsx` (button, card, tabs, calendar, badge, scroll-area, sheet, form, input, select, table, label)

- [ ] **Step 1: Initialize shadcn/ui**

```bash
cd web && pnpm dlx shadcn@latest init --yes --base-color slate
```

When prompted, use defaults: TypeScript, App Router, CSS variables.

- [ ] **Step 2: Add the components from the spec**

```bash
cd web && pnpm dlx shadcn@latest add button card tabs calendar badge scroll-area sheet form input select table label dialog --yes
```

- [ ] **Step 3: Verify the build still passes**

```bash
cd web && pnpm build
```

Expected: a successful production build.

- [ ] **Step 4: Commit**

```bash
git add web/components.json web/components/ web/lib/ web/app/globals.css
git commit -m "Add shadcn/ui primitives"
```

### Task 8: Configure vitest

**Files:**
- Create: `web/vitest.config.ts`
- Modify: `web/package.json` (add test script + deps)

- [ ] **Step 1: Install test deps**

```bash
cd web && pnpm add -D vitest @vitest/ui @vitejs/plugin-react jsdom
```

- [ ] **Step 2: Create `web/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

- [ ] **Step 3: Add the test script to `web/package.json`**

In the `scripts` block, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify vitest runs (with no tests yet)**

```bash
cd web && pnpm test
```

Expected: vitest reports "no test files found" and exits 0.

- [ ] **Step 5: Commit**

```bash
git add web/package.json web/pnpm-lock.yaml web/vitest.config.ts
git commit -m "Configure vitest"
```

### Task 9: Build the test fixture vault

**Files:**
- Create: `web/test/fixtures/vault/...`

- [ ] **Step 1: Create the fixture directory tree and seed files**

Create the following file tree under `web/test/fixtures/vault/`:

```
vault/
├── INDEX.md
├── LOG.md
├── _shared/wiki/concepts/shared-concept.md
└── goals/
    ├── alpha/
    │   ├── _goal.md
    │   ├── progress.md
    │   ├── raw/
    │   │   ├── articles/2026-04-26-alpha-foo.md
    │   │   └── interviews/2026-04-30.md
    │   │   └── interviews/2026-05-02.md
    │   └── wiki/
    │       ├── sources/2026-04-26-alpha-foo.md
    │       └── concepts/alpha-concept.md
    ├── beta/
    │   ├── _goal.md
    │   └── progress.md
    └── gamma/
        ├── _goal.md
        └── progress.md
```

Contents (use Write per file):

`web/test/fixtures/vault/LOG.md`:

```markdown
# Operations log

[2026-04-26 02:00] research alpha: +2 sources, ~1 concepts
[2026-04-30 09:00] standup: alpha
[2026-05-01 02:00] research alpha: +1 sources, ~0 concepts
[2026-05-02 09:00] standup: alpha
```

`web/test/fixtures/vault/INDEX.md`:

```markdown
# Index

- alpha
- beta
- gamma
```

`web/test/fixtures/vault/goals/alpha/_goal.md`:

````markdown
---
type: goal
slug: alpha
title: Alpha goal
status: active
priority: 1
created: 2026-04-01
target_review: 2026-07-01
standup_interval: 1d
research_interval: 1d
---

## Why this matters

Test the active goal path.
````

`web/test/fixtures/vault/goals/alpha/progress.md`:

````markdown
---
type: progress
goal: alpha
last_updated: 2026-05-02
streak_days: 3
---

## Current focus

Testing.

## Recent wins

- 2026-05-02: wrote the fixture
````

`web/test/fixtures/vault/goals/alpha/raw/articles/2026-04-26-alpha-foo.md`:

```markdown
# Foo article

Some raw content.
```

`web/test/fixtures/vault/goals/alpha/raw/interviews/2026-04-30.md`:

```markdown
---
type: interview
goal: alpha
date: 2026-04-30
duration_min: 5
---

Q: How is it going?
A: Fine.
```

`web/test/fixtures/vault/goals/alpha/raw/interviews/2026-05-02.md`:

```markdown
---
type: interview
goal: alpha
date: 2026-05-02
duration_min: 4
---

Q: Any wins?
A: Wrote the fixture.
```

`web/test/fixtures/vault/goals/alpha/wiki/sources/2026-04-26-alpha-foo.md`:

```markdown
---
type: source
goal: alpha
source_url: https://example.com/foo
source_kind: article
ingested: 2026-04-26
confidence: 0.8
---

## TL;DR

Test source.

## Key claims

- Claim one ^[extracted]
- Claim two ^[inferred]

## Relevant to

[[alpha-concept]]

## Raw

See `raw/articles/2026-04-26-alpha-foo.md`.
```

`web/test/fixtures/vault/goals/alpha/wiki/concepts/alpha-concept.md`:

```markdown
---
type: concept
goal: alpha
title: Alpha concept
created: 2026-04-26
updated: 2026-05-01
sources_count: 1
provenance:
  extracted: 1
  inferred: 1
  ambiguous: 0
---

## Summary

A test concept.

## Sources

- [[2026-04-26-alpha-foo]]
```

`web/test/fixtures/vault/goals/beta/_goal.md`:

```markdown
---
type: goal
slug: beta
title: Beta goal
status: active
priority: 2
created: 2026-04-01
standup_interval: 7d
research_interval: 7d
---

## Why this matters

Tests weekly cadence.
```

`web/test/fixtures/vault/goals/beta/progress.md`:

```markdown
---
type: progress
goal: beta
last_updated: 2026-04-15
streak_days: 0
---

## Current focus

Nothing yet.
```

`web/test/fixtures/vault/goals/gamma/_goal.md`:

```markdown
---
type: goal
slug: gamma
title: Gamma paused
status: paused
priority: 3
created: 2026-04-01
---

## Why this matters

Tests paused exclusion.
```

`web/test/fixtures/vault/goals/gamma/progress.md`:

```markdown
---
type: progress
goal: gamma
last_updated: 2026-04-01
streak_days: 0
---

## Current focus

Paused.
```

`web/test/fixtures/vault/_shared/wiki/concepts/shared-concept.md`:

```markdown
---
type: concept
goal: _shared
title: Shared concept
created: 2026-04-01
updated: 2026-04-01
sources_count: 0
provenance:
  extracted: 0
  inferred: 0
  ambiguous: 0
---

## Summary

Cross-goal concept.
```

- [ ] **Step 2: Verify the tree**

```bash
find web/test/fixtures/vault -type f | sort
```

Expected: 13 files listed.

- [ ] **Step 3: Commit**

```bash
git add web/test/fixtures/
git commit -m "Add vault test fixtures"
```

---

## Phase 4 — Library code (TDD)

### Task 10: Define types

**Files:**
- Create: `web/lib/types.ts`

- [ ] **Step 1: Write the type definitions**

```ts
// web/lib/types.ts

export type GoalStatus = 'active' | 'paused' | 'done' | 'abandoned';

export interface GoalFrontmatter {
  type: 'goal';
  slug: string;
  title: string;
  status: GoalStatus;
  priority: number;
  created: string;
  target_review?: string;
  standup_interval?: string;
  research_interval?: string;
}

export interface Goal {
  slug: string;
  frontmatter: GoalFrontmatter;
  body: string;
  path: string;
}

export type SourceKind = 'article' | 'paper' | 'video' | 'podcast' | 'book' | 'interview';

export interface SourceFrontmatter {
  type: 'source';
  goal: string;
  source_url?: string;
  source_kind: SourceKind;
  ingested: string;
  confidence: number;
}

export interface Source {
  id: string;
  frontmatter: SourceFrontmatter;
  body: string;
  path: string;
}

export interface ConceptFrontmatter {
  type: 'concept';
  goal: string;
  title: string;
  created: string;
  updated: string;
  sources_count: number;
  provenance: { extracted: number; inferred: number; ambiguous: number };
}

export interface Concept {
  id: string;
  frontmatter: ConceptFrontmatter;
  body: string;
  path: string;
}

export interface InterviewFrontmatter {
  type: 'interview';
  goal: string;
  date: string;
  duration_min?: number;
}

export interface Interview {
  date: string;
  goal: string;
  frontmatter: InterviewFrontmatter;
  body: string;
  path: string;
}

export interface ProgressDoc {
  goal: string;
  body: string;
  path: string;
  frontmatter: Record<string, unknown>;
}

export type LogEntryKind = 'research' | 'standup' | 'lint' | 'other';

export interface LogEntry {
  timestamp: Date;
  kind: LogEntryKind;
  goal?: string;
  raw: string;
  detail?: string;
}

export interface ResearchRun extends LogEntry {
  kind: 'research';
  goal: string;
  sourcesAdded: number;
  conceptsTouched: number;
}

export type CalendarEventKind =
  | 'standup-done'
  | 'standup-missed'
  | 'standup-due'
  | 'research-done'
  | 'research-due';

export interface CalendarEvent {
  date: string;          // YYYY-MM-DD
  goalSlug: string;
  kind: CalendarEventKind;
  detail?: string;
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd web && pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add web/lib/types.ts
git commit -m "Define vault TypeScript types"
```

### Task 11: Build `intervals.ts` — TDD

**Files:**
- Create: `web/test/intervals.test.ts`
- Create: `web/lib/intervals.ts`

- [ ] **Step 1: Write the failing tests**

`web/test/intervals.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parseInterval, formatInterval, addInterval, INTERVAL_DEFAULT_MS } from '@/lib/intervals';

describe('parseInterval', () => {
  it('parses "1d" -> 86400000', () => {
    expect(parseInterval('1d')).toBe(86_400_000);
  });
  it('parses "7d" -> 604800000', () => {
    expect(parseInterval('7d')).toBe(604_800_000);
  });
  it('parses "14d"', () => {
    expect(parseInterval('14d')).toBe(14 * 86_400_000);
  });
  it('parses "daily" as 1d', () => {
    expect(parseInterval('daily')).toBe(86_400_000);
  });
  it('parses "weekly" as 7d', () => {
    expect(parseInterval('weekly')).toBe(604_800_000);
  });
  it('falls back to default for undefined', () => {
    expect(parseInterval(undefined)).toBe(INTERVAL_DEFAULT_MS);
  });
  it('throws on garbage', () => {
    expect(() => parseInterval('lol')).toThrow();
  });
});

describe('formatInterval', () => {
  it('formats 1d as "daily"', () => {
    expect(formatInterval('1d')).toBe('daily');
  });
  it('formats 7d as "weekly"', () => {
    expect(formatInterval('7d')).toBe('weekly');
  });
  it('formats 3d as "every 3 days"', () => {
    expect(formatInterval('3d')).toBe('every 3 days');
  });
  it('round-trips daily', () => {
    expect(formatInterval('daily')).toBe('daily');
  });
});

describe('addInterval', () => {
  it('adds 1d to a date', () => {
    const result = addInterval(new Date('2026-05-03T00:00:00Z'), '1d');
    expect(result.toISOString()).toBe('2026-05-04T00:00:00.000Z');
  });
  it('adds 7d to a date', () => {
    const result = addInterval(new Date('2026-05-03T00:00:00Z'), '7d');
    expect(result.toISOString()).toBe('2026-05-10T00:00:00.000Z');
  });
});
```

- [ ] **Step 2: Run — should fail**

```bash
cd web && pnpm test
```

Expected: cannot find module `@/lib/intervals`.

- [ ] **Step 3: Implement `web/lib/intervals.ts`**

```ts
// web/lib/intervals.ts

export const INTERVAL_DEFAULT_MS = 86_400_000;

const NUMERIC = /^(\d+)d$/;

/**
 * Parse a duration string into milliseconds.
 * Accepts: "1d", "7d", "14d", "daily" (= 1d), "weekly" (= 7d).
 * Returns INTERVAL_DEFAULT_MS for undefined input.
 * Throws on unrecognized strings.
 */
export function parseInterval(input: string | undefined): number {
  if (input === undefined) return INTERVAL_DEFAULT_MS;
  if (input === 'daily') return 86_400_000;
  if (input === 'weekly') return 7 * 86_400_000;
  const m = NUMERIC.exec(input);
  if (m) return Number(m[1]) * 86_400_000;
  throw new Error(`Unrecognized interval: ${input}`);
}

/**
 * Convert an interval string into a human-friendly label.
 * "1d"/"daily" -> "daily"; "7d"/"weekly" -> "weekly"; otherwise "every N days".
 */
export function formatInterval(input: string | undefined): string {
  const ms = parseInterval(input);
  if (ms === 86_400_000) return 'daily';
  if (ms === 7 * 86_400_000) return 'weekly';
  const days = ms / 86_400_000;
  return `every ${days} days`;
}

/** Add an interval to a date and return a new Date. */
export function addInterval(date: Date, input: string | undefined): Date {
  return new Date(date.getTime() + parseInterval(input));
}
```

- [ ] **Step 4: Run tests — should pass**

```bash
cd web && pnpm test
```

Expected: all 12 tests pass.

- [ ] **Step 5: Commit**

```bash
git add web/lib/intervals.ts web/test/intervals.test.ts
git commit -m "Add interval parsing/formatting"
```

### Task 12: Build `atomic-write.ts` — TDD

**Files:**
- Create: `web/test/atomic-write.test.ts`
- Create: `web/lib/atomic-write.ts`

- [ ] **Step 1: Write the failing tests**

`web/test/atomic-write.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { atomicWrite } from '@/lib/atomic-write';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

describe('atomicWrite', () => {
  let dir: string;
  beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), 'aw-')); });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

  it('writes content to the target path', async () => {
    const target = path.join(dir, 'foo.md');
    await atomicWrite(target, 'hello');
    const content = await readFile(target, 'utf8');
    expect(content).toBe('hello');
  });

  it('leaves no .tmp file behind on success', async () => {
    const target = path.join(dir, 'foo.md');
    await atomicWrite(target, 'hello');
    const files = await readdir(dir);
    expect(files).toEqual(['foo.md']);
  });

  it('overwrites existing files', async () => {
    const target = path.join(dir, 'foo.md');
    await atomicWrite(target, 'one');
    await atomicWrite(target, 'two');
    expect(await readFile(target, 'utf8')).toBe('two');
  });
});
```

- [ ] **Step 2: Run — should fail (module missing)**

```bash
cd web && pnpm test atomic-write
```

- [ ] **Step 3: Implement `web/lib/atomic-write.ts`**

```ts
// web/lib/atomic-write.ts
import { writeFile, rename } from 'node:fs/promises';

/**
 * Write `content` to `path` atomically: write to `path + '.tmp'`,
 * then rename onto the target. The original file is never partially written.
 */
export async function atomicWrite(path: string, content: string): Promise<void> {
  const tmp = `${path}.tmp`;
  await writeFile(tmp, content, 'utf8');
  await rename(tmp, path);
}
```

- [ ] **Step 4: Tests pass**

```bash
cd web && pnpm test atomic-write
```

Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add web/lib/atomic-write.ts web/test/atomic-write.test.ts
git commit -m "Add atomic file write helper"
```

### Task 13: Build `log.ts` — TDD

**Files:**
- Create: `web/test/log.test.ts`
- Create: `web/lib/log.ts`

- [ ] **Step 1: Write the failing tests**

`web/test/log.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parseLog, parseLogLine, listResearchRuns, lastResearchRun } from '@/lib/log';
import path from 'node:path';

const FIXTURE = path.join(__dirname, 'fixtures/vault');

describe('parseLogLine', () => {
  it('parses a research line', () => {
    const e = parseLogLine('[2026-05-01 02:00] research alpha: +1 sources, ~0 concepts');
    expect(e?.kind).toBe('research');
    expect(e?.goal).toBe('alpha');
    expect(e?.timestamp.toISOString()).toBe('2026-05-01T02:00:00.000Z');
  });
  it('parses a standup line', () => {
    const e = parseLogLine('[2026-04-30 09:00] standup: alpha');
    expect(e?.kind).toBe('standup');
    expect(e?.goal).toBe('alpha');
  });
  it('returns null for non-log lines', () => {
    expect(parseLogLine('# Operations log')).toBeNull();
    expect(parseLogLine('')).toBeNull();
  });
});

describe('parseLog', () => {
  it('reads and parses LOG.md from fixture vault', async () => {
    const entries = await parseLog(FIXTURE);
    expect(entries.length).toBe(4);
    expect(entries.map(e => e.kind)).toEqual(['research', 'standup', 'research', 'standup']);
  });
});

describe('listResearchRuns', () => {
  it('returns only research runs for a goal', async () => {
    const runs = await listResearchRuns(FIXTURE, 'alpha');
    expect(runs.length).toBe(2);
    expect(runs.every(r => r.kind === 'research' && r.goal === 'alpha')).toBe(true);
  });
});

describe('lastResearchRun', () => {
  it('returns the most recent run for the goal', async () => {
    const last = await lastResearchRun(FIXTURE, 'alpha');
    expect(last?.timestamp.toISOString()).toBe('2026-05-01T02:00:00.000Z');
  });
  it('returns null if no runs', async () => {
    expect(await lastResearchRun(FIXTURE, 'beta')).toBeNull();
  });
});
```

- [ ] **Step 2: Run — fails**

```bash
cd web && pnpm test log
```

- [ ] **Step 3: Implement `web/lib/log.ts`**

```ts
// web/lib/log.ts
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { LogEntry, ResearchRun } from './types';

// Splits "[date time] kindRaw <rest>" — `rest` differs by kind:
//   research <slug>: <detail>
//   standup: <comma-separated slugs>
//   lint: <detail>
const HEAD = /^\[(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})\] (\w+)(.*)$/;
const RESEARCH_TAIL = /^\s+([\w-]+):\s*(.*)$/;
const STANDUP_TAIL = /^:\s*(.*)$/;

export function parseLogLine(line: string): LogEntry | null {
  const m = HEAD.exec(line.trim());
  if (!m) return null;
  const [, date, time, kindRaw, rest] = m;
  const timestamp = new Date(`${date}T${time}:00.000Z`);
  let kind: LogEntry['kind'];
  let goal: string | undefined;
  let detail: string | undefined;

  switch (kindRaw) {
    case 'research': {
      const r = RESEARCH_TAIL.exec(rest);
      if (r) { goal = r[1]; detail = r[2]; }
      kind = 'research';
      break;
    }
    case 'standup': {
      const r = STANDUP_TAIL.exec(rest);
      if (r) {
        const goals = r[1].split(',').map(s => s.trim()).filter(Boolean);
        goal = goals[0];
        detail = r[1];
      }
      kind = 'standup';
      break;
    }
    case 'lint':
      kind = 'lint';
      detail = rest.replace(/^:\s*/, '');
      break;
    default:
      kind = 'other';
  }

  return { timestamp, kind, goal, raw: line, detail };
}

export async function parseLog(vaultPath: string): Promise<LogEntry[]> {
  let content: string;
  try { content = await readFile(path.join(vaultPath, 'LOG.md'), 'utf8'); }
  catch { return []; }
  return content
    .split('\n')
    .map(parseLogLine)
    .filter((e): e is LogEntry => e !== null);
}

export async function listResearchRuns(vaultPath: string, goalSlug: string): Promise<ResearchRun[]> {
  const entries = await parseLog(vaultPath);
  return entries
    .filter(e => e.kind === 'research' && e.goal === goalSlug)
    .map(e => {
      const sources = /\+(\d+) sources/.exec(e.detail ?? '');
      const concepts = /~(\d+) concepts/.exec(e.detail ?? '');
      return {
        ...e,
        kind: 'research' as const,
        goal: e.goal!,
        sourcesAdded: sources ? Number(sources[1]) : 0,
        conceptsTouched: concepts ? Number(concepts[1]) : 0,
      };
    });
}

export async function lastResearchRun(vaultPath: string, goalSlug: string): Promise<ResearchRun | null> {
  const runs = await listResearchRuns(vaultPath, goalSlug);
  if (runs.length === 0) return null;
  return runs.reduce((a, b) => (a.timestamp > b.timestamp ? a : b));
}
```

- [ ] **Step 4: Tests pass**

```bash
cd web && pnpm test log
```

- [ ] **Step 5: Commit**

```bash
git add web/lib/log.ts web/test/log.test.ts
git commit -m "Add LOG.md parser"
```

### Task 14: Build `vault.ts` — TDD

**Files:**
- Create: `web/test/vault.test.ts`
- Create: `web/lib/vault.ts`

- [ ] **Step 1: Install gray-matter**

```bash
cd web && pnpm add gray-matter
```

- [ ] **Step 2: Write the failing tests**

`web/test/vault.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  listGoals, readGoal, listInterviews, listSources, listConcepts,
  readSource, readConcept, readProgress, listSharedConcepts,
} from '@/lib/vault';
import path from 'node:path';

const VAULT = path.join(__dirname, 'fixtures/vault');

describe('listGoals', () => {
  it('returns all three fixture goals sorted by priority', async () => {
    const goals = await listGoals(VAULT);
    expect(goals.map(g => g.slug)).toEqual(['alpha', 'beta', 'gamma']);
    expect(goals[0].frontmatter.title).toBe('Alpha goal');
  });
});

describe('readGoal', () => {
  it('returns frontmatter and body for alpha', async () => {
    const goal = await readGoal(VAULT, 'alpha');
    expect(goal.frontmatter.status).toBe('active');
    expect(goal.frontmatter.standup_interval).toBe('1d');
    expect(goal.body).toMatch(/Why this matters/);
  });
  it('throws for missing goal', async () => {
    await expect(readGoal(VAULT, 'nonexistent')).rejects.toThrow();
  });
});

describe('listInterviews', () => {
  it('returns alpha interviews sorted descending', async () => {
    const interviews = await listInterviews(VAULT, 'alpha');
    expect(interviews.map(i => i.date)).toEqual(['2026-05-02', '2026-04-30']);
  });
  it('returns empty for beta', async () => {
    expect(await listInterviews(VAULT, 'beta')).toEqual([]);
  });
});

describe('listSources', () => {
  it('returns alpha sources', async () => {
    const sources = await listSources(VAULT, 'alpha');
    expect(sources.map(s => s.id)).toEqual(['2026-04-26-alpha-foo']);
    expect(sources[0].frontmatter.source_kind).toBe('article');
  });
});

describe('listConcepts', () => {
  it('returns alpha concepts', async () => {
    const concepts = await listConcepts(VAULT, 'alpha');
    expect(concepts.map(c => c.id)).toEqual(['alpha-concept']);
    expect(concepts[0].frontmatter.provenance.extracted).toBe(1);
  });
});

describe('readSource / readConcept', () => {
  it('reads a single source by id', async () => {
    const s = await readSource(VAULT, 'alpha', '2026-04-26-alpha-foo');
    expect(s.frontmatter.confidence).toBe(0.8);
    expect(s.body).toMatch(/TL;DR/);
  });
  it('reads a single concept by id', async () => {
    const c = await readConcept(VAULT, 'alpha', 'alpha-concept');
    expect(c.frontmatter.title).toBe('Alpha concept');
  });
});

describe('readProgress', () => {
  it('reads progress.md for a goal', async () => {
    const p = await readProgress(VAULT, 'alpha');
    expect(p.body).toMatch(/Recent wins/);
  });
});

describe('listSharedConcepts', () => {
  it('returns concepts from _shared', async () => {
    const concepts = await listSharedConcepts(VAULT);
    expect(concepts.map(c => c.id)).toEqual(['shared-concept']);
  });
});
```

- [ ] **Step 3: Run — fails**

- [ ] **Step 4: Implement `web/lib/vault.ts`**

```ts
// web/lib/vault.ts
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import type {
  Goal, GoalFrontmatter, Source, SourceFrontmatter,
  Concept, ConceptFrontmatter, Interview, InterviewFrontmatter,
  ProgressDoc,
} from './types';

export function vaultRoot(): string {
  return path.resolve(process.env.VAULT_PATH ?? '..');
}

async function exists(p: string): Promise<boolean> {
  try { await stat(p); return true; } catch { return false; }
}

async function readMarkdown<T>(filePath: string): Promise<{ data: T; content: string }> {
  const raw = await readFile(filePath, 'utf8');
  const parsed = matter(raw);
  return { data: parsed.data as T, content: parsed.content };
}

export async function listGoals(vaultPath: string): Promise<Goal[]> {
  const goalsDir = path.join(vaultPath, 'goals');
  const entries = await readdir(goalsDir, { withFileTypes: true });
  const goals: Goal[] = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const goalFile = path.join(goalsDir, e.name, '_goal.md');
    if (!(await exists(goalFile))) continue;
    const { data, content } = await readMarkdown<GoalFrontmatter>(goalFile);
    goals.push({ slug: e.name, frontmatter: data, body: content, path: goalFile });
  }
  goals.sort((a, b) => (a.frontmatter.priority ?? 99) - (b.frontmatter.priority ?? 99));
  return goals;
}

export async function readGoal(vaultPath: string, slug: string): Promise<Goal> {
  const goalFile = path.join(vaultPath, 'goals', slug, '_goal.md');
  if (!(await exists(goalFile))) throw new Error(`Goal not found: ${slug}`);
  const { data, content } = await readMarkdown<GoalFrontmatter>(goalFile);
  return { slug, frontmatter: data, body: content, path: goalFile };
}

export async function readProgress(vaultPath: string, slug: string): Promise<ProgressDoc> {
  const file = path.join(vaultPath, 'goals', slug, 'progress.md');
  const { data, content } = await readMarkdown<Record<string, unknown>>(file);
  return { goal: slug, body: content, path: file, frontmatter: data };
}

export async function listInterviews(vaultPath: string, slug: string): Promise<Interview[]> {
  const dir = path.join(vaultPath, 'goals', slug, 'raw', 'interviews');
  if (!(await exists(dir))) return [];
  const files = (await readdir(dir)).filter(f => f.endsWith('.md'));
  const items: Interview[] = [];
  for (const f of files) {
    const filePath = path.join(dir, f);
    const { data, content } = await readMarkdown<InterviewFrontmatter>(filePath);
    items.push({
      date: f.replace(/\.md$/, ''),
      goal: slug,
      frontmatter: data,
      body: content,
      path: filePath,
    });
  }
  items.sort((a, b) => b.date.localeCompare(a.date));
  return items;
}

export async function listSources(vaultPath: string, slug: string): Promise<Source[]> {
  const dir = path.join(vaultPath, 'goals', slug, 'wiki', 'sources');
  if (!(await exists(dir))) return [];
  const files = (await readdir(dir)).filter(f => f.endsWith('.md'));
  const items: Source[] = [];
  for (const f of files) {
    const filePath = path.join(dir, f);
    const { data, content } = await readMarkdown<SourceFrontmatter>(filePath);
    items.push({ id: f.replace(/\.md$/, ''), frontmatter: data, body: content, path: filePath });
  }
  items.sort((a, b) => b.id.localeCompare(a.id));
  return items;
}

export async function readSource(vaultPath: string, slug: string, id: string): Promise<Source> {
  const filePath = path.join(vaultPath, 'goals', slug, 'wiki', 'sources', `${id}.md`);
  if (!(await exists(filePath))) throw new Error(`Source not found: ${slug}/${id}`);
  const { data, content } = await readMarkdown<SourceFrontmatter>(filePath);
  return { id, frontmatter: data, body: content, path: filePath };
}

export async function listConcepts(vaultPath: string, slug: string): Promise<Concept[]> {
  const dir = path.join(vaultPath, 'goals', slug, 'wiki', 'concepts');
  if (!(await exists(dir))) return [];
  const files = (await readdir(dir)).filter(f => f.endsWith('.md'));
  const items: Concept[] = [];
  for (const f of files) {
    const filePath = path.join(dir, f);
    const { data, content } = await readMarkdown<ConceptFrontmatter>(filePath);
    items.push({ id: f.replace(/\.md$/, ''), frontmatter: data, body: content, path: filePath });
  }
  items.sort((a, b) => a.id.localeCompare(b.id));
  return items;
}

export async function readConcept(vaultPath: string, slug: string, id: string): Promise<Concept> {
  const filePath = path.join(vaultPath, 'goals', slug, 'wiki', 'concepts', `${id}.md`);
  if (!(await exists(filePath))) throw new Error(`Concept not found: ${slug}/${id}`);
  const { data, content } = await readMarkdown<ConceptFrontmatter>(filePath);
  return { id, frontmatter: data, body: content, path: filePath };
}

export async function listSharedConcepts(vaultPath: string): Promise<Concept[]> {
  const dir = path.join(vaultPath, '_shared', 'wiki', 'concepts');
  if (!(await exists(dir))) return [];
  const files = (await readdir(dir)).filter(f => f.endsWith('.md'));
  const items: Concept[] = [];
  for (const f of files) {
    const filePath = path.join(dir, f);
    const { data, content } = await readMarkdown<ConceptFrontmatter>(filePath);
    items.push({ id: f.replace(/\.md$/, ''), frontmatter: data, body: content, path: filePath });
  }
  return items;
}
```

- [ ] **Step 5: Tests pass**

```bash
cd web && pnpm test vault
```

- [ ] **Step 6: Commit**

```bash
git add web/lib/vault.ts web/test/vault.test.ts web/package.json web/pnpm-lock.yaml
git commit -m "Add vault filesystem readers"
```

### Task 15: Build `schedule.ts` — TDD

**Files:**
- Create: `web/test/schedule.test.ts`
- Create: `web/lib/schedule.ts`

- [ ] **Step 1: Write the failing tests**

`web/test/schedule.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { lastStandup, nextStandupDue, lastResearch, nextResearchDue, isOverdue, calendarEvents } from '@/lib/schedule';
import { readGoal, listGoals } from '@/lib/vault';
import path from 'node:path';

const VAULT = path.join(__dirname, 'fixtures/vault');

describe('lastStandup', () => {
  it('returns the latest interview date for alpha', async () => {
    const date = await lastStandup(VAULT, 'alpha');
    expect(date).toBe('2026-05-02');
  });
  it('returns null for beta (no interviews)', async () => {
    expect(await lastStandup(VAULT, 'beta')).toBeNull();
  });
});

describe('nextStandupDue', () => {
  it('returns last + interval for alpha (1d)', async () => {
    const goal = await readGoal(VAULT, 'alpha');
    const next = await nextStandupDue(VAULT, goal);
    expect(next).toBe('2026-05-03');
  });
  it('returns the goal created date when no interviews exist', async () => {
    const goal = await readGoal(VAULT, 'beta');
    const next = await nextStandupDue(VAULT, goal);
    expect(next).toBe('2026-04-01');
  });
});

describe('lastResearch / nextResearchDue', () => {
  it('returns the latest research run timestamp for alpha', async () => {
    const date = await lastResearch(VAULT, 'alpha');
    expect(date?.toISOString()).toBe('2026-05-01T02:00:00.000Z');
  });
  it('computes next research due', async () => {
    const goal = await readGoal(VAULT, 'alpha');
    const next = await nextResearchDue(VAULT, goal);
    expect(next?.toISOString()).toBe('2026-05-02T02:00:00.000Z');
  });
});

describe('isOverdue', () => {
  it('flags a date in the past as overdue', () => {
    expect(isOverdue('2020-01-01', new Date('2026-05-03T00:00:00Z'))).toBe(true);
  });
  it('does not flag a future date', () => {
    expect(isOverdue('2030-01-01', new Date('2026-05-03T00:00:00Z'))).toBe(false);
  });
});

describe('calendarEvents', () => {
  it('produces events for goals across a date range', async () => {
    const goals = await listGoals(VAULT);
    const events = await calendarEvents(VAULT, goals.filter(g => g.frontmatter.status === 'active'), {
      from: new Date('2026-04-25'),
      to: new Date('2026-05-05'),
      now: new Date('2026-05-03T00:00:00Z'),
    });
    const standupDone = events.filter(e => e.kind === 'standup-done');
    expect(standupDone.length).toBe(2);
    expect(standupDone.map(e => e.date)).toEqual(expect.arrayContaining(['2026-04-30', '2026-05-02']));
    const researchDone = events.filter(e => e.kind === 'research-done');
    expect(researchDone.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run — fails**

- [ ] **Step 3: Implement `web/lib/schedule.ts`**

```ts
// web/lib/schedule.ts
import { addInterval, parseInterval } from './intervals';
import { listInterviews } from './vault';
import { listResearchRuns, lastResearchRun } from './log';
import type { Goal, CalendarEvent } from './types';

const DAY_MS = 86_400_000;

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function lastStandup(vaultPath: string, slug: string): Promise<string | null> {
  const interviews = await listInterviews(vaultPath, slug);
  if (interviews.length === 0) return null;
  return interviews[0].date;
}

export async function nextStandupDue(vaultPath: string, goal: Goal): Promise<string> {
  const last = await lastStandup(vaultPath, goal.slug);
  if (!last) return goal.frontmatter.created;
  const next = addInterval(new Date(`${last}T00:00:00Z`), goal.frontmatter.standup_interval);
  return ymd(next);
}

export async function lastResearch(vaultPath: string, slug: string): Promise<Date | null> {
  const last = await lastResearchRun(vaultPath, slug);
  return last?.timestamp ?? null;
}

export async function nextResearchDue(vaultPath: string, goal: Goal): Promise<Date | null> {
  const last = await lastResearch(vaultPath, goal.slug);
  if (!last) return new Date();
  return addInterval(last, goal.frontmatter.research_interval);
}

export function isOverdue(dateYmd: string, now: Date = new Date()): boolean {
  return new Date(`${dateYmd}T23:59:59Z`).getTime() < now.getTime() - DAY_MS;
}

export interface CalendarRange {
  from: Date;
  to: Date;
  now?: Date;
}

export async function calendarEvents(
  vaultPath: string,
  goals: Goal[],
  range: CalendarRange,
): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];
  const now = range.now ?? new Date();

  for (const goal of goals) {
    // Standups completed
    const interviews = await listInterviews(vaultPath, goal.slug);
    for (const i of interviews) {
      const d = new Date(`${i.date}T00:00:00Z`);
      if (d >= range.from && d <= range.to) {
        events.push({ date: i.date, goalSlug: goal.slug, kind: 'standup-done' });
      }
    }

    // Standup-due / standup-missed: walk from last interview forward by interval until past `to`
    const intervalMs = parseInterval(goal.frontmatter.standup_interval);
    const startDate = interviews[0]
      ? new Date(`${interviews[0].date}T00:00:00Z`).getTime() + intervalMs
      : new Date(`${goal.frontmatter.created}T00:00:00Z`).getTime();
    for (let t = startDate; t <= range.to.getTime(); t += intervalMs) {
      const d = new Date(t);
      if (d < range.from) continue;
      const dateStr = ymd(d);
      // Skip if there's already a completed standup that day.
      if (interviews.some(i => i.date === dateStr)) continue;
      const kind: CalendarEvent['kind'] = d.getTime() < now.getTime() - DAY_MS ? 'standup-missed' : 'standup-due';
      events.push({ date: dateStr, goalSlug: goal.slug, kind });
    }

    // Research completed
    const runs = await listResearchRuns(vaultPath, goal.slug);
    for (const r of runs) {
      if (r.timestamp >= range.from && r.timestamp <= range.to) {
        events.push({
          date: ymd(r.timestamp),
          goalSlug: goal.slug,
          kind: 'research-done',
          detail: r.detail,
        });
      }
    }

    // Research due (next-only, no projection past `to`)
    const next = await nextResearchDue(vaultPath, goal);
    if (next && next > now && next <= range.to) {
      events.push({ date: ymd(next), goalSlug: goal.slug, kind: 'research-due' });
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}
```

- [ ] **Step 4: Tests pass**

```bash
cd web && pnpm test schedule
```

- [ ] **Step 5: Commit**

```bash
git add web/lib/schedule.ts web/test/schedule.test.ts
git commit -m "Add schedule computation (last/next/overdue/calendar)"
```

### Task 16: Build `markdown.ts` — TDD

**Files:**
- Create: `web/test/markdown.test.ts`
- Create: `web/lib/markdown.ts`

- [ ] **Step 1: Install remark/rehype deps**

```bash
cd web && pnpm add remark remark-gfm remark-rehype rehype-sanitize rehype-stringify remark-wiki-link unified
```

- [ ] **Step 2: Write the failing tests**

`web/test/markdown.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '@/lib/markdown';

describe('renderMarkdown', () => {
  it('renders headings', async () => {
    const html = await renderMarkdown('# Hello', { goalSlug: 'alpha' });
    expect(html).toMatch(/<h1>Hello<\/h1>/);
  });
  it('renders GFM tables', async () => {
    const html = await renderMarkdown('| a | b |\n|---|---|\n| 1 | 2 |', { goalSlug: 'alpha' });
    expect(html).toMatch(/<table>/);
  });
  it('resolves source-style wikilinks', async () => {
    const html = await renderMarkdown('See [[2026-04-26-alpha-foo]]', { goalSlug: 'alpha' });
    expect(html).toMatch(/href="\/goals\/alpha\/sources\/2026-04-26-alpha-foo"/);
  });
  it('resolves concept-style wikilinks', async () => {
    const html = await renderMarkdown('See [[alpha-concept]]', { goalSlug: 'alpha' });
    expect(html).toMatch(/href="\/goals\/alpha\/concepts\/alpha-concept"/);
  });
  it('strips dangerous tags', async () => {
    const html = await renderMarkdown('<script>alert(1)</script>Hello', { goalSlug: 'alpha' });
    expect(html).not.toMatch(/<script>/);
    expect(html).toMatch(/Hello/);
  });
});
```

- [ ] **Step 3: Run — fails**

- [ ] **Step 4: Implement `web/lib/markdown.ts`**

```ts
// web/lib/markdown.ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkWikiLink from 'remark-wiki-link';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

export interface RenderContext {
  goalSlug: string;
}

const DATE_PREFIXED = /^\d{4}-\d{2}-\d{2}-/;

export async function renderMarkdown(input: string, ctx: RenderContext): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkWikiLink, {
      hrefTemplate: (permalink: string) => {
        const isSource = DATE_PREFIXED.test(permalink);
        const kind = isSource ? 'sources' : 'concepts';
        return `/goals/${ctx.goalSlug}/${kind}/${permalink}`;
      },
      pageResolver: (name: string) => [name],
    })
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(input);
  return String(file);
}
```

- [ ] **Step 5: Tests pass**

```bash
cd web && pnpm test markdown
```

If `remark-wiki-link` types are missing, add a `web/types/remark-wiki-link.d.ts`:

```ts
declare module 'remark-wiki-link';
```

And include it in `tsconfig.json`'s `include`.

- [ ] **Step 6: Commit**

```bash
git add web/lib/markdown.ts web/test/markdown.test.ts web/types/ web/package.json web/pnpm-lock.yaml web/tsconfig.json
git commit -m "Add markdown rendering with wikilink resolution"
```

### Task 17: Build `actions.ts` — Server Actions, TDD

**Files:**
- Create: `web/test/actions.test.ts`
- Create: `web/lib/actions.ts`

- [ ] **Step 1: Install zod**

```bash
cd web && pnpm add zod
```

- [ ] **Step 2: Set up an isolated tmp vault helper for action tests**

Create `web/test/helpers/tmp-vault.ts`:

```ts
import { mkdtemp, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const FIXTURE = path.join(__dirname, '..', 'fixtures', 'vault');

export async function withTmpVault<T>(fn: (vaultPath: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(path.join(tmpdir(), 'sis-'));
  await cp(FIXTURE, dir, { recursive: true });
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
```

- [ ] **Step 3: Write the failing action tests**

`web/test/actions.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { withTmpVault } from './helpers/tmp-vault';
import { _updateGoalFrontmatter as updateGoalFrontmatter } from '@/lib/actions';

describe('updateGoalFrontmatter', () => {
  it('updates editable fields', async () => {
    await withTmpVault(async (vault) => {
      await updateGoalFrontmatter(vault, 'alpha', { priority: 9 });
      const raw = await readFile(path.join(vault, 'goals/alpha/_goal.md'), 'utf8');
      const fm = matter(raw).data;
      expect(fm.priority).toBe(9);
    });
  });

  it('preserves the body byte-for-byte', async () => {
    await withTmpVault(async (vault) => {
      const file = path.join(vault, 'goals/alpha/_goal.md');
      const before = matter(await readFile(file, 'utf8')).content;
      await updateGoalFrontmatter(vault, 'alpha', { priority: 5 });
      const after = matter(await readFile(file, 'utf8')).content;
      expect(after).toBe(before);
    });
  });

  it('rejects an invalid status', async () => {
    await withTmpVault(async (vault) => {
      await expect(
        updateGoalFrontmatter(vault, 'alpha', { status: 'lol' as never }),
      ).rejects.toThrow();
    });
  });

  it('rejects an unknown field', async () => {
    await withTmpVault(async (vault) => {
      await expect(
        updateGoalFrontmatter(vault, 'alpha', { secret: 'pwned' } as never),
      ).rejects.toThrow();
    });
  });

  it('accepts both "1d" and "daily" for intervals', async () => {
    await withTmpVault(async (vault) => {
      await updateGoalFrontmatter(vault, 'alpha', { standup_interval: 'daily' });
      const raw = await readFile(path.join(vault, 'goals/alpha/_goal.md'), 'utf8');
      const fm = matter(raw).data;
      expect(fm.standup_interval).toBe('daily');
    });
  });
});
```

- [ ] **Step 4: Run — fails**

- [ ] **Step 5: Implement `web/lib/actions.ts`**

```ts
// web/lib/actions.ts
'use server';

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { revalidatePath } from 'next/cache';
import matter from 'gray-matter';
import { z } from 'zod';
import { atomicWrite } from './atomic-write';
import { vaultRoot } from './vault';

const INTERVAL = z.string().regex(/^(\d+d|daily|weekly)$/);

const Patch = z.object({
  status: z.enum(['active', 'paused', 'done', 'abandoned']).optional(),
  priority: z.number().int().min(1).max(99).optional(),
  target_review: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  standup_interval: INTERVAL.optional(),
  research_interval: INTERVAL.optional(),
}).strict();

export type GoalPatch = z.infer<typeof Patch>;

/** Internal: vault-path-aware version, used in tests. */
export async function _updateGoalFrontmatter(
  vaultPath: string,
  slug: string,
  patch: GoalPatch,
): Promise<void> {
  const validated = Patch.parse(patch);
  const file = path.join(vaultPath, 'goals', slug, '_goal.md');
  const raw = await readFile(file, 'utf8');
  const parsed = matter(raw);
  const merged = { ...parsed.data, ...validated };
  const next = matter.stringify(parsed.content, merged);
  await atomicWrite(file, next);
}

/** Server Action: updates goal frontmatter using the configured vault root. */
export async function updateGoalFrontmatter(slug: string, patch: GoalPatch): Promise<void> {
  await _updateGoalFrontmatter(vaultRoot(), slug, patch);
  revalidatePath(`/goals/${slug}`);
  revalidatePath('/calendar');
  revalidatePath('/');
}
```

- [ ] **Step 6: Tests pass**

```bash
cd web && pnpm test actions
```

- [ ] **Step 7: Commit**

```bash
git add web/lib/actions.ts web/test/actions.test.ts web/test/helpers/ web/package.json web/pnpm-lock.yaml
git commit -m "Add Server Action for goal frontmatter updates"
```

---

## Phase 5 — UI components

### Task 18: Sidebar + topbar + root layout

**Files:**
- Create: `web/components/sidebar.tsx`
- Create: `web/components/topbar.tsx`
- Modify: `web/app/layout.tsx`
- Modify: `web/app/globals.css` (only if shadcn init didn't already configure)

- [ ] **Step 1: Build the sidebar**

`web/components/sidebar.tsx`:

```tsx
import Link from 'next/link';
import { Home, Target, Calendar, Search, ScrollText } from 'lucide-react';

const ITEMS = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/research', label: 'Research', icon: Search },
  { href: '/log', label: 'Log', icon: ScrollText },
];

export function Sidebar() {
  return (
    <nav className="w-56 border-r bg-muted/40 p-3 flex flex-col gap-1">
      <div className="px-2 py-2 text-sm font-semibold">Sisyphus</div>
      {ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Install lucide-react if not already present**

```bash
cd web && pnpm add lucide-react
```

- [ ] **Step 3: Build the topbar**

`web/components/topbar.tsx`:

```tsx
import { listGoals, vaultRoot } from '@/lib/vault';
import { isOverdue } from '@/lib/schedule';
import { nextStandupDue } from '@/lib/schedule';
import { Badge } from '@/components/ui/badge';

export async function Topbar() {
  const root = vaultRoot();
  const goals = await listGoals(root);
  const active = goals.filter(g => g.frontmatter.status === 'active');
  const overdueCount = (
    await Promise.all(active.map(async g => isOverdue(await nextStandupDue(root, g))))
  ).filter(Boolean).length;
  return (
    <header className="border-b px-4 py-2 flex items-center justify-between">
      <div className="text-sm text-muted-foreground">Sisyphus vault</div>
      {overdueCount > 0 && (
        <Badge variant="destructive">{overdueCount} overdue</Badge>
      )}
    </header>
  );
}
```

- [ ] **Step 4: Update `web/app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';

export const metadata: Metadata = {
  title: 'Sisyphus',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          {/* @ts-expect-error Async Server Component */}
          <Topbar />
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Boot the dev server and visually verify the shell**

```bash
cd web && pnpm dev &
sleep 5
curl -s http://localhost:3000 | grep -E "Sisyphus|Dashboard"
kill %1
```

Expected: HTML mentions "Sisyphus" and "Dashboard".

- [ ] **Step 6: Commit**

```bash
git add web/components/sidebar.tsx web/components/topbar.tsx web/app/layout.tsx web/package.json web/pnpm-lock.yaml
git commit -m "Add app shell (sidebar + topbar + root layout)"
```

### Task 19: Shared display components

**Files:**
- Create: `web/components/relative-date.tsx`
- Create: `web/components/event-dot.tsx`
- Create: `web/components/markdown-content.tsx`
- Create: `web/components/provenance-bar.tsx`
- Create: `web/components/goal-card.tsx`

- [ ] **Step 1: `relative-date.tsx`**

```tsx
import { cn } from '@/lib/utils';

function formatRelative(target: Date, now: Date): string {
  const diffDays = Math.round((target.getTime() - now.getTime()) / 86_400_000);
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays === -1) return 'yesterday';
  return diffDays > 0 ? `in ${diffDays} days` : `${-diffDays} days ago`;
}

interface Props {
  date: string | Date;
  variant?: 'plain' | 'due';
  now?: Date;
}

export function RelativeDate({ date, variant = 'plain', now = new Date() }: Props) {
  const d = typeof date === 'string' ? new Date(`${date}T00:00:00Z`) : date;
  const text = formatRelative(d, now);
  const days = Math.round((d.getTime() - now.getTime()) / 86_400_000);
  const tone = variant === 'due'
    ? days < 0 ? 'text-red-600' : days === 0 ? 'text-amber-600' : 'text-emerald-600'
    : 'text-muted-foreground';
  return <span className={cn('text-xs font-medium', tone)}>{text}</span>;
}
```

- [ ] **Step 2: `event-dot.tsx`**

```tsx
import type { CalendarEventKind } from '@/lib/types';
import { cn } from '@/lib/utils';

const COLORS: Record<CalendarEventKind, string> = {
  'standup-done':    'bg-emerald-500',
  'standup-missed':  'bg-red-500',
  'standup-due':     'bg-amber-500',
  'research-done':   'bg-blue-500',
  'research-due':    'bg-slate-400',
};

export function EventDot({ kind }: { kind: CalendarEventKind }) {
  return <span className={cn('inline-block h-1.5 w-1.5 rounded-full', COLORS[kind])} />;
}
```

- [ ] **Step 3: `markdown-content.tsx`**

```tsx
import { renderMarkdown } from '@/lib/markdown';

interface Props {
  source: string;
  goalSlug: string;
}

export async function MarkdownContent({ source, goalSlug }: Props) {
  const html = await renderMarkdown(source, { goalSlug });
  return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
}
```

You'll need `@tailwindcss/typography` for the `prose` class:

```bash
cd web && pnpm add -D @tailwindcss/typography
```

Add to `web/tailwind.config.ts` plugins array: `require('@tailwindcss/typography')`.

- [ ] **Step 4: `provenance-bar.tsx`**

```tsx
interface Props {
  extracted: number;
  inferred: number;
  ambiguous: number;
}

export function ProvenanceBar({ extracted, inferred, ambiguous }: Props) {
  const total = Math.max(1, extracted + inferred + ambiguous);
  const e = (extracted / total) * 100;
  const i = (inferred / total) * 100;
  const a = (ambiguous / total) * 100;
  return (
    <div className="flex h-1.5 w-32 overflow-hidden rounded">
      <div className="bg-emerald-500" style={{ width: `${e}%` }} title={`extracted: ${extracted}`} />
      <div className="bg-amber-500"   style={{ width: `${i}%` }} title={`inferred: ${inferred}`} />
      <div className="bg-red-500"     style={{ width: `${a}%` }} title={`ambiguous: ${ambiguous}`} />
    </div>
  );
}
```

- [ ] **Step 5: `goal-card.tsx`**

```tsx
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RelativeDate } from './relative-date';
import { lastStandup, nextStandupDue, lastResearch, nextResearchDue } from '@/lib/schedule';
import { vaultRoot } from '@/lib/vault';
import type { Goal } from '@/lib/types';

export async function GoalCard({ goal }: { goal: Goal }) {
  const root = vaultRoot();
  const last = await lastStandup(root, goal.slug);
  const next = await nextStandupDue(root, goal);
  const lastR = await lastResearch(root, goal.slug);
  const nextR = await nextResearchDue(root, goal);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            <Link href={`/goals/${goal.slug}`} className="hover:underline">
              {goal.frontmatter.title}
            </Link>
          </CardTitle>
          <Badge variant="outline">{goal.frontmatter.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <div>Last standup: {last ? <RelativeDate date={last} /> : <span className="text-muted-foreground">never</span>}</div>
        <div>Next standup: <RelativeDate date={next} variant="due" /></div>
        <div>Last research: {lastR ? <RelativeDate date={lastR} /> : <span className="text-muted-foreground">never</span>}</div>
        {nextR && <div>Next research: <RelativeDate date={nextR} variant="due" /></div>}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 6: Verify build**

```bash
cd web && pnpm build
```

- [ ] **Step 7: Commit**

```bash
git add web/components/ web/tailwind.config.ts web/package.json web/pnpm-lock.yaml
git commit -m "Add shared display components"
```

### Task 20: Goal edit form

**Files:**
- Create: `web/components/goal-edit-form.tsx`

- [ ] **Step 1: Build the client form**

```tsx
'use client';

import { useTransition, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateGoalFrontmatter } from '@/lib/actions';
import type { Goal } from '@/lib/types';

export function GoalEditForm({ goal }: { goal: Goal }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await updateGoalFrontmatter(goal.slug, {
          status: formData.get('status') as never,
          priority: Number(formData.get('priority')),
          target_review: (formData.get('target_review') as string) || undefined,
          standup_interval: (formData.get('standup_interval') as string) || undefined,
          research_interval: (formData.get('research_interval') as string) || undefined,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4 max-w-md">
      <div>
        <Label>Status</Label>
        <Select name="status" defaultValue={goal.frontmatter.status}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">active</SelectItem>
            <SelectItem value="paused">paused</SelectItem>
            <SelectItem value="done">done</SelectItem>
            <SelectItem value="abandoned">abandoned</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Priority</Label>
        <Input name="priority" type="number" defaultValue={goal.frontmatter.priority} min={1} max={99} />
      </div>
      <div>
        <Label>Target review (YYYY-MM-DD)</Label>
        <Input name="target_review" defaultValue={goal.frontmatter.target_review ?? ''} />
      </div>
      <div>
        <Label>Standup interval (1d / 7d / daily / weekly)</Label>
        <Input name="standup_interval" defaultValue={goal.frontmatter.standup_interval ?? ''} />
      </div>
      <div>
        <Label>Research interval</Label>
        <Input name="research_interval" defaultValue={goal.frontmatter.research_interval ?? ''} />
      </div>
      <Button type="submit" disabled={pending}>{pending ? 'Saving...' : 'Save'}</Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/components/goal-edit-form.tsx
git commit -m "Add goal frontmatter edit form"
```

### Task 21: Calendar view

**Files:**
- Create: `web/components/calendar-view.tsx`

- [ ] **Step 1: Build the client calendar**

```tsx
'use client';

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { EventDot } from './event-dot';
import type { CalendarEvent } from '@/lib/types';

export function CalendarView({ events }: { events: CalendarEvent[] }) {
  const [selected, setSelected] = useState<Date | undefined>(new Date());

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return map;
  }, [events]);

  const selectedKey = selected?.toISOString().slice(0, 10);
  const selectedEvents = (selectedKey && byDate.get(selectedKey)) || [];

  return (
    <div className="flex gap-6">
      <Calendar
        mode="single"
        selected={selected}
        onSelect={setSelected}
        modifiers={{ hasEvents: (d) => byDate.has(d.toISOString().slice(0, 10)) }}
        modifiersClassNames={{ hasEvents: 'font-bold' }}
        components={{
          DayContent: ({ date }) => {
            const key = date.toISOString().slice(0, 10);
            const dayEvents = byDate.get(key) ?? [];
            return (
              <div className="flex flex-col items-center">
                <span>{date.getDate()}</span>
                <div className="flex gap-0.5 h-2">
                  {dayEvents.slice(0, 4).map((e, i) => <EventDot key={i} kind={e.kind} />)}
                </div>
              </div>
            );
          },
        }}
      />
      <Sheet open={selectedEvents.length > 0}>
        <SheetTrigger asChild><span /></SheetTrigger>
        <SheetContent>
          <SheetHeader><SheetTitle>{selectedKey}</SheetTitle></SheetHeader>
          <ul className="space-y-2 mt-4">
            {selectedEvents.map((e, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <EventDot kind={e.kind} />
                <span className="font-medium">{e.goalSlug}</span>
                <span className="text-muted-foreground">{e.kind}</span>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
cd web && pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add web/components/calendar-view.tsx
git commit -m "Add calendar view with event dots and side sheet"
```

---

## Phase 6 — Routes

### Task 22: Dashboard `/`

**Files:**
- Modify: `web/app/page.tsx`

- [ ] **Step 1: Replace the starter page**

```tsx
import { listGoals, vaultRoot } from '@/lib/vault';
import { isOverdue, nextStandupDue } from '@/lib/schedule';
import { GoalCard } from '@/components/goal-card';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const root = vaultRoot();
  const goals = await listGoals(root);
  const active = goals.filter(g => g.frontmatter.status === 'active');

  const owed = (
    await Promise.all(
      active.map(async g => (isOverdue(await nextStandupDue(root, g)) ? g : null)),
    )
  ).filter(Boolean);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        {owed.length > 0
          ? `Today, you owe ${owed.length} standup${owed.length === 1 ? '' : 's'}.`
          : 'Nothing overdue. Nice.'}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {active.map(g => (
          /* @ts-expect-error Async Server Component */
          <GoalCard key={g.slug} goal={g} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Boot dev server and verify**

```bash
cd web && pnpm dev &
sleep 5
curl -s http://localhost:3000 | grep -E "standup|overdue"
kill %1
```

- [ ] **Step 3: Commit**

```bash
git add web/app/page.tsx
git commit -m "Build dashboard route"
```

### Task 23: Goals list `/goals`

**Files:**
- Create: `web/app/goals/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
import Link from 'next/link';
import { listGoals, vaultRoot } from '@/lib/vault';
import { lastStandup, nextStandupDue } from '@/lib/schedule';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RelativeDate } from '@/components/relative-date';

export const dynamic = 'force-dynamic';

export default async function GoalsPage() {
  const root = vaultRoot();
  const goals = await listGoals(root);

  const rows = await Promise.all(goals.map(async (g) => ({
    g,
    last: await lastStandup(root, g.slug),
    next: await nextStandupDue(root, g),
  })));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Goals</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Standup</TableHead>
            <TableHead>Last</TableHead>
            <TableHead>Next</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ g, last, next }) => (
            <TableRow key={g.slug}>
              <TableCell><Link href={`/goals/${g.slug}`} className="hover:underline">{g.frontmatter.title}</Link></TableCell>
              <TableCell><Badge variant="outline">{g.frontmatter.status}</Badge></TableCell>
              <TableCell>{g.frontmatter.priority}</TableCell>
              <TableCell>{g.frontmatter.standup_interval ?? '—'}</TableCell>
              <TableCell>{last ? <RelativeDate date={last} /> : '—'}</TableCell>
              <TableCell><RelativeDate date={next} variant="due" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser, then commit**

```bash
git add web/app/goals/page.tsx
git commit -m "Build goals list route"
```

### Task 24: Goal detail `/goals/[slug]`

**Files:**
- Create: `web/app/goals/[slug]/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readGoal, readProgress, listSources, listConcepts, vaultRoot } from '@/lib/vault';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MarkdownContent } from '@/components/markdown-content';
import { ProvenanceBar } from '@/components/provenance-bar';
import { formatInterval } from '@/lib/intervals';

export const dynamic = 'force-dynamic';

export default async function GoalDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const root = vaultRoot();
  let goal, progress;
  try {
    goal = await readGoal(root, slug);
    progress = await readProgress(root, slug).catch(() => null);
  } catch {
    notFound();
  }
  const sources = await listSources(root, slug);
  const concepts = await listConcepts(root, slug);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{goal.frontmatter.title}</h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Badge variant="outline">{goal.frontmatter.status}</Badge>
            <span>standup: {formatInterval(goal.frontmatter.standup_interval)}</span>
            <span>·</span>
            <span>research: {formatInterval(goal.frontmatter.research_interval)}</span>
          </div>
        </div>
        <Link href={`/goals/${slug}/edit`} className="text-sm underline">Edit settings</Link>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sources">Sources ({sources.length})</TabsTrigger>
          <TabsTrigger value="concepts">Concepts ({concepts.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          {/* @ts-expect-error Async Server Component */}
          <MarkdownContent source={goal.body} goalSlug={slug} />
          {progress && (
            <>
              <hr />
              <h2 className="text-lg font-semibold">Progress</h2>
              {/* @ts-expect-error Async Server Component */}
              <MarkdownContent source={progress.body} goalSlug={slug} />
            </>
          )}
        </TabsContent>
        <TabsContent value="sources">
          <ul className="divide-y">
            {sources.map(s => (
              <li key={s.id} className="py-3">
                <Link href={`/goals/${slug}/sources/${s.id}`} className="font-medium hover:underline">{s.id}</Link>
                <div className="text-xs text-muted-foreground">{s.frontmatter.source_kind} · confidence {s.frontmatter.confidence}</div>
              </li>
            ))}
            {sources.length === 0 && <li className="py-3 text-sm text-muted-foreground">No sources yet.</li>}
          </ul>
        </TabsContent>
        <TabsContent value="concepts">
          <ul className="divide-y">
            {concepts.map(c => (
              <li key={c.id} className="py-3 flex items-center justify-between">
                <Link href={`/goals/${slug}/concepts/${c.id}`} className="font-medium hover:underline">{c.frontmatter.title}</Link>
                <ProvenanceBar {...c.frontmatter.provenance} />
              </li>
            ))}
            {concepts.length === 0 && <li className="py-3 text-sm text-muted-foreground">No concepts yet.</li>}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/app/goals/
git commit -m "Build goal detail route with Overview/Sources/Concepts tabs"
```

### Task 25: Goal edit `/goals/[slug]/edit`

**Files:**
- Create: `web/app/goals/[slug]/edit/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
import { notFound } from 'next/navigation';
import { readGoal, vaultRoot } from '@/lib/vault';
import { GoalEditForm } from '@/components/goal-edit-form';

export const dynamic = 'force-dynamic';

export default async function GoalEdit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let goal;
  try { goal = await readGoal(vaultRoot(), slug); } catch { notFound(); }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit {goal.frontmatter.title}</h1>
      <p className="text-sm text-muted-foreground">
        Editable frontmatter fields only. Body sections are managed by the human and the CLI.
      </p>
      <GoalEditForm goal={goal} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/app/goals/[slug]/edit/
git commit -m "Build goal edit route"
```

### Task 26: Source page `/goals/[slug]/sources/[id]`

**Files:**
- Create: `web/app/goals/[slug]/sources/[id]/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
import { notFound } from 'next/navigation';
import { readSource, vaultRoot } from '@/lib/vault';
import { MarkdownContent } from '@/components/markdown-content';

export const dynamic = 'force-dynamic';

export default async function SourcePage({
  params,
}: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  let source;
  try { source = await readSource(vaultRoot(), slug, id); } catch { notFound(); }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{source.id}</h1>
      <dl className="grid grid-cols-[max-content,1fr] gap-x-4 text-sm text-muted-foreground">
        <dt>Kind</dt><dd>{source.frontmatter.source_kind}</dd>
        <dt>Confidence</dt><dd>{source.frontmatter.confidence}</dd>
        <dt>Ingested</dt><dd>{source.frontmatter.ingested}</dd>
        {source.frontmatter.source_url && (<><dt>URL</dt><dd><a href={source.frontmatter.source_url} className="underline">{source.frontmatter.source_url}</a></dd></>)}
      </dl>
      {/* @ts-expect-error Async Server Component */}
      <MarkdownContent source={source.body} goalSlug={slug} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/app/goals/[slug]/sources/
git commit -m "Build source page route"
```

### Task 27: Concept page `/goals/[slug]/concepts/[id]`

**Files:**
- Create: `web/app/goals/[slug]/concepts/[id]/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
import { notFound } from 'next/navigation';
import { readConcept, vaultRoot } from '@/lib/vault';
import { MarkdownContent } from '@/components/markdown-content';
import { ProvenanceBar } from '@/components/provenance-bar';

export const dynamic = 'force-dynamic';

export default async function ConceptPage({
  params,
}: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  let concept;
  try { concept = await readConcept(vaultRoot(), slug, id); } catch { notFound(); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{concept.frontmatter.title}</h1>
        <ProvenanceBar {...concept.frontmatter.provenance} />
      </div>
      <div className="text-sm text-muted-foreground">
        {concept.frontmatter.sources_count} source{concept.frontmatter.sources_count === 1 ? '' : 's'} · updated {concept.frontmatter.updated}
      </div>
      {/* @ts-expect-error Async Server Component */}
      <MarkdownContent source={concept.body} goalSlug={slug} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/app/goals/[slug]/concepts/
git commit -m "Build concept page route"
```

### Task 28: Calendar `/calendar`

**Files:**
- Create: `web/app/calendar/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
import { listGoals, vaultRoot } from '@/lib/vault';
import { calendarEvents } from '@/lib/schedule';
import { CalendarView } from '@/components/calendar-view';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const root = vaultRoot();
  const goals = await listGoals(root);
  const active = goals.filter(g => g.frontmatter.status === 'active');
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 30);
  const to = new Date(today);
  to.setDate(to.getDate() + 30);
  const events = await calendarEvents(root, active, { from, to, now: today });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Calendar</h1>
      <CalendarView events={events} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/app/calendar/
git commit -m "Build calendar route"
```

### Task 29: Research `/research`

**Files:**
- Create: `web/app/research/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
import { listGoals, vaultRoot } from '@/lib/vault';
import { lastResearch, nextResearchDue } from '@/lib/schedule';
import { parseLog } from '@/lib/log';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RelativeDate } from '@/components/relative-date';

export const dynamic = 'force-dynamic';

export default async function ResearchPage() {
  const root = vaultRoot();
  const goals = await listGoals(root);
  const active = goals.filter(g => g.frontmatter.status === 'active');

  const upcoming = await Promise.all(active.map(async (g) => ({
    g,
    last: await lastResearch(root, g.slug),
    next: await nextResearchDue(root, g),
  })));

  const log = await parseLog(root);
  const history = log.filter(e => e.kind === 'research').reverse();

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold mb-2">Upcoming</h2>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Goal</TableHead><TableHead>Interval</TableHead><TableHead>Last</TableHead><TableHead>Next</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {upcoming.map(({ g, last, next }) => (
              <TableRow key={g.slug}>
                <TableCell>{g.frontmatter.title}</TableCell>
                <TableCell>{g.frontmatter.research_interval ?? 'daily'}</TableCell>
                <TableCell>{last ? <RelativeDate date={last} /> : '—'}</TableCell>
                <TableCell>{next ? <RelativeDate date={next} variant="due" /> : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">History</h2>
        <ul className="divide-y">
          {history.map((e, i) => (
            <li key={i} className="py-2 text-sm">
              <span className="font-mono text-xs text-muted-foreground">{e.timestamp.toISOString().slice(0, 16).replace('T', ' ')}</span>
              {' · '}
              <span className="font-medium">{e.goal}</span>
              {' · '}
              <span className="text-muted-foreground">{e.detail}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/app/research/
git commit -m "Build research route (upcoming + history)"
```

### Task 30: Log `/log`

**Files:**
- Create: `web/app/log/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { vaultRoot } from '@/lib/vault';

export const dynamic = 'force-dynamic';

export default async function LogPage() {
  let raw = '';
  try { raw = await readFile(path.join(vaultRoot(), 'LOG.md'), 'utf8'); } catch {}
  const lines = raw.split('\n').filter(l => l.startsWith('[')).reverse();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Log</h1>
      <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed">{lines.join('\n')}</pre>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/app/log/
git commit -m "Build log route"
```

### Task 31: 404 page

**Files:**
- Create: `web/app/not-found.tsx`

- [ ] **Step 1: Write a small not-found page**

```tsx
export default function NotFound() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="text-sm text-muted-foreground">
        That page does not exist. The vault may be out of sync — try refreshing.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/app/not-found.tsx
git commit -m "Add 404 page"
```

---

## Phase 7 — Deployment

### Task 32: systemd unit + README update

**Files:**
- Create: `deploy/sisyphus-ui.service`
- Modify: `README.md`

- [ ] **Step 1: Create the systemd unit**

`deploy/sisyphus-ui.service`:

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

- [ ] **Step 2: Add a README section**

Append a `## UI` section to `README.md`:

```markdown
## UI

A minimalist Next.js + shadcn dashboard lives in `web/`. It reads the vault directly via `fs/promises` (no DB) and writes only `_goal.md` frontmatter via Server Actions.

Local dev:

```bash
cd web
pnpm install
pnpm dev   # http://localhost:3000
```

Pi deployment:

1. Copy this repo to `/opt/sisyphus`.
2. `cd /opt/sisyphus/web && pnpm install && pnpm build`
3. `sudo cp deploy/sisyphus-ui.service /etc/systemd/system/`
4. `sudo systemctl enable --now sisyphus-ui`
5. Install the cron entry: `crontab -e`, paste contents of `deploy/cron.example`.

Tests:

```bash
cd web && pnpm test                # unit tests
bats scripts/scheduler.bats        # scheduler tests
```
```

- [ ] **Step 3: Final build and test sweep**

```bash
cd web && pnpm test && pnpm build
cd .. && bats scripts/scheduler.bats
```

Expected: all tests pass, production build succeeds.

- [ ] **Step 4: Commit**

```bash
git add deploy/sisyphus-ui.service README.md
git commit -m "Add systemd unit and document UI deployment"
```

---

## Done

You should now have:

- A working Next.js app at `http://localhost:3000` showing dashboard, goals, calendar, research, and log views.
- Per-goal `standup_interval` and `research_interval` editable from `/goals/<slug>/edit`.
- A `scheduler.sh` that fires `claude -p '/research <slug>'` when due, tested with bats.
- `_goal.md` frontmatter is the single source of truth for cadence; `LOG.md` for history.
