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
