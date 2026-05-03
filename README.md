# Sisyphus

> A personal goals knowledge base maintained by Claude. Daily research, daily check-ins, compounding progress.

Sisyphus is a framework for using Claude as an autonomous research assistant and daily standup partner, working against a small set of well-defined personal goals. It implements [Andrej Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) on top of an Obsidian vault, scoped per goal.

The boulder still rolls back down. But this time you wrote down where it was.

---

## The idea

Most "AI for personal productivity" setups have the same failure mode: they're chat-shaped. You have a conversation about your goals, get some advice, close the tab, and a week later you're starting from scratch again. Nothing compounds. The model has no memory of what you tried. Your progress lives in your head, where it's subject to all the usual cognitive entropy.

Sisyphus inverts this. The wiki is the source of truth. Claude is the maintainer. You are the curator and the protagonist.

- **Claude does autonomous research** overnight on each of your goals, writing findings into per-goal wiki pages.
- **Once a day you run a 5–10 minute standup.** Claude surfaces what's new in the research, asks one calibrated question per goal, and captures your answers verbatim into the journal.
- **Progress accumulates in markdown files** instead of evaporating into ephemeral chat sessions. The wiki is yours, in your Obsidian vault, in a git repo. No vendor lock-in.

The point isn't that Claude tells you what to do. The point is that the bookkeeping that makes a knowledge base actually useful — cross-references, dated logs, contradictions flagged, stale claims pruned — gets done at near-zero marginal cost, by something that doesn't get bored.

---

## How it works

Two tracks, different cost and latency profiles:

**Track 1 — Autonomous research.** Runs nightly on a schedule (Claude Code scheduled task, cron + `claude -p`, or an Anthropic Routine). For each active goal, Claude reads the goal definition and recent progress, searches the web for relevant new material, ingests sources into `raw/`, writes summary pages into `wiki/sources/`, and updates concept pages with cross-references and provenance tags. This is bulk async work — perfect for the [Batch API](https://docs.claude.com/en/api/overview) (50% discount) combined with prompt caching (90% off cached input).

**Track 2 — Daily standup.** Synchronous, conversational. You run `/standup` in the morning. Claude has already digested the overnight research. It surfaces what's new, asks one concrete progress question per goal, captures your answers verbatim into the journal as raw sources, and updates each goal's `progress.md` with new wins, blockers, and proposed next steps.

Plus a weekly **lint** pass that audits the wiki for orphan pages, stale claims, contradictions, and provenance drift. Lint surfaces findings — it does not auto-fix. You decide.

The full operating manual for Claude lives in [`CLAUDE.md`](./CLAUDE.md).

---

## Vault structure

```
.
├── CLAUDE.md                    # Operating manual, loaded by Claude every session
├── README.md                    # You are here
├── INDEX.md                     # Generated; lists all pages by goal/type
├── LOG.md                       # Append-only chronological operations log
├── goals/
│   └── <goal-slug>/
│       ├── _goal.md             # Goal definition (you write and own this)
│       ├── progress.md          # Living progress tracker (Claude maintains)
│       ├── raw/                 # Source documents — immutable
│       │   ├── articles/
│       │   ├── papers/
│       │   ├── notes/
│       │   └── interviews/      # Daily standup transcripts (verbatim)
│       └── wiki/                # Synthesis layer (Claude maintains)
│           ├── concepts/
│           └── sources/         # Per-source summary pages
└── _shared/
    └── wiki/
        └── concepts/            # Cross-goal concepts
```

---

## Setup

### Prerequisites

- An Obsidian vault (or any folder you'll point an editor at — the system is just markdown).
- One of:
    - **Claude Code** (`npm install -g @anthropic-ai/claude-code`) for the easiest path.
    - **Anthropic API access** for a custom-orchestration path.
- `git` for version-controlling the vault.
- Optional: [Obsidian Web Clipper](https://obsidian.md/clipper) for fast manual ingestion of articles.
- Optional: Dataview plugin if you want to query the provenance frontmatter.

### Install

```bash
# Clone into your Obsidian vault root, or use as a standalone vault
git clone https://github.com/Robspin/sisyphus.git
cd my-goals-vault

# Initialize git tracking for your wiki
git init
git add CLAUDE.md README.md
git commit -m "Initial sisyphus scaffold"
```

### Define your first goal

Create `goals/<slug>/_goal.md` for one goal. **Start with one goal, not five.** The temptation to define your whole life on day one is the failure mode. Get the loop tight on one goal for two weeks, then add.

Minimum viable `_goal.md`:

```markdown
---
type: goal
slug: fitness
title: Build sustainable strength training habit
status: active
priority: 1
created: 2026-05-03
target_review: 2026-08-03
---

## Why this matters
[Your motivation, in your own words. One paragraph.]

## Success criteria
- [Concrete, measurable outcome 1]
- [Concrete, measurable outcome 2]

## Current state
[Where you are right now, baseline numbers if relevant.]

## Sub-goals
- [Milestone 1]
- [Milestone 2]

## Constraints
[Time, budget, hard limits.]

## Open questions
- [Things you don't know yet]
```

### Seed the wiki

```bash
# In Claude Code, from the vault root
claude
> /research fitness    # or your goal slug
```

Claude will scaffold `raw/`, `wiki/`, and `progress.md`, then do an initial research pass.

### Schedule the autonomous track

Pick whichever fits your setup:

**Claude Code Desktop (macOS/Windows)** — use the built-in scheduled tasks UI to add a nightly job running `/research all`.

**Cron (Linux/macOS/anywhere)**:

```cron
# 02:00 nightly research pass
0 2 * * * cd /path/to/sisyphus && claude --dangerously-skip-permissions -p "/research all" >> ~/.sisyphus/research.log 2>&1
```

**Anthropic Routines** — for cloud-managed scheduling without your machine being on. See the [Claude Code docs](https://docs.claude.com/en/docs/claude-code/overview).

### Run the standup

Each morning:

```bash
cd /path/to/sisyphus
claude
> /standup
```

This part is supposed to stay manual. Daily friction is the feature.

---

## What a standup looks like

```
> /standup

Two active goals. Last check-in: yesterday.

[fitness] Three new sources this week. The interesting one was a 2026
meta-analysis on autoregulation that contradicts the fixed-progression
approach in [[progressive-overload]] — flagged in Contradictions.

  Question: Did you train Tuesday? You said you were going to.

> Yeah, did the full session but skipped the accessory work.

[language] One new source on spaced repetition intervals.

  Question: How many Anki reviews did you actually do this week?

> Maybe 4 days out of 7. I keep skipping the weekends.

Anything else on your mind?

> No, that's it.

Captured. Updated progress for both goals.
Today: training done (partial), 4/7 SRS days. Tomorrow: full session
including accessories, weekend SRS reminder.
```

The standup is intentionally short. If it starts feeling like a chore you'll skip it. The whole game is making the daily push small enough that you keep showing up.

---

## Cost

Sisyphus is designed to run cheaply on a recurring schedule.

The autonomous research track stacks two discounts:

- **Batch API** — 50% off both input and output tokens, 24-hour async turnaround.
- **Prompt caching** — 90% off cached input. The CLAUDE.md, goal definitions, and recent log form a stable context block that should be a cache hit on every run.

For most personal setups the recurring cost lands in the low single digits per month. The standup uses standard pricing (it's interactive), but the cached vault context keeps each session cheap too.

Mix models by job: Haiku for routine summarization and source-page generation, Sonnet for synthesis and contradiction-finding, Opus for the standup if you want the highest-quality questions.

---

## Design principles

These are baked into the schema. You can change them, but understand what they're protecting before you do.

1. **Raw sources are immutable.** Once ingested, a file in `raw/` is never modified. New information goes in new files. This means the audit trail is intact — you can always reconstruct what Claude knew at any point in time.
2. **Goal files are human-owned.** Claude never modifies `_goal.md`. It can suggest edits in a section at the bottom, which you review and merge during a standup. Goal drift via a thousand small AI edits is a real risk; this prevents it.
3. **Journal entries are sources, not summaries.** Your check-in answers are captured verbatim. Derived claims about your progress live in separate files, explicitly tagged as inferred.
4. **Provenance is mandatory.** Every synthesized claim is tagged `^[extracted]`, `^[inferred]`, or `^[ambiguous]`. The lint pass uses these to flag pages drifting into speculation.
5. **Lint surfaces, doesn't fix.** Audit findings are presented to you. You decide what's worth fixing.
6. **Stay on-goal.** Out-of-scope research is noise. The agent runs once per goal, not as a general-purpose curiosity engine.

---

## What this is not

- **Not a coach.** Claude won't tell you that you're crushing it. The tone in CLAUDE.md is explicitly calibrated against cheerleading.
- **Not a goal-setting tool.** You write the goals. Sisyphus only helps you work on them once they're defined.
- **Not a habit tracker.** It records what you did and didn't do, but it doesn't gamify or streak-shame.
- **Not a chatbot wrapper.** The wiki is the product. Claude is the maintenance worker.

---

## FAQ

**Why "Sisyphus"?** Because the goals worth pursuing are mostly the ones that don't end. Fitness, language, craft, relationships — these aren't projects to complete; they're slopes to keep pushing up. The myth is about the dignity of the daily push, not the tragedy of incompletion. One must imagine Sisyphus with a well-organized markdown vault.

**Do I need Obsidian?** No. The vault is just markdown files. Obsidian is the recommended viewer because the graph view and backlinks make the wiki structure tangible, but any editor works.

**Can I run this fully locally?** Yes — swap the Anthropic API for a local model via Ollama. Quality drops noticeably on the synthesis tasks, but the schema is identical. See `kytmanov/obsidian-llm-wiki-local` for a local-first reference implementation.

**What if I miss a day?** Nothing. The next standup picks up where you left off. There are no streaks to break.

**Can I have Claude do the standup with me on my phone?** Yes — Claude Code has a remote-control mode. Set up a scheduled task, run the standup from the Claude mobile app.

---

## Credits

- [Andrej Karpathy](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) for the LLM Wiki pattern.
- [Obsidian](https://obsidian.md) for being the right shape of tool.
- Albert Camus, indirectly.

## License

MIT
