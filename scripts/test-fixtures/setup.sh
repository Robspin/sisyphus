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
