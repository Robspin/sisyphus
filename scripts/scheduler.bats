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
  NOW=$(date -u +"%Y-%m-%d %H:%M")
  echo "[$NOW] research alpha: +1 sources, ~0 concepts" > "$TEST_VAULT/LOG.md"
  run "$BATS_TEST_DIRNAME/scheduler.sh"
  [ "$status" -eq 0 ]
  ! grep -q "claude -p /research alpha" "$CALLS_FILE" || \
    [ -z "$(grep 'claude -p /research alpha' "$CALLS_FILE")" ]
}

@test "triggers research for beta only when its 7d interval has elapsed" {
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
