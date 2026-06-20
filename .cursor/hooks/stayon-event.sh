#!/usr/bin/env bash
# StayOn — forwards Cursor hook events to the extension bridge (fail-open).
set -euo pipefail

INPUT=$(cat)
PORT=$(cat "$HOME/.stayon/port" 2>/dev/null || echo "3847")
EVENT=$(echo "$INPUT" | jq -r '.hook_event_name // empty')
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

case "$EVENT" in
  beforeSubmitPrompt)
    NOTE=$(echo "$INPUT" | jq -r '.prompt // ""' | head -c 120)
    BODY=$(jq -nc --arg e busy_start --arg n "$NOTE" --arg t "$TS" \
      '{event:$e, context_note:$n, ts:$t}')
    ;;
  preToolUse|postToolUse)
    TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')
    BODY=$(jq -nc --arg e busy_heartbeat --arg tool "$TOOL" --arg t "$TS" \
      '{event:$e, tool:$tool, ts:$t}')
    ;;
  afterAgentThought)
    BODY=$(jq -nc --arg e busy_heartbeat --arg phase thinking --arg t "$TS" \
      '{event:$e, phase:$phase, ts:$t}')
    ;;
  subagentStart)
    BODY=$(jq -nc --arg e busy_ref --argjson d 1 --arg t "$TS" \
      '{event:$e, delta:$d, ts:$t}')
    ;;
  subagentStop)
    BODY=$(jq -nc --arg e busy_ref --argjson d -1 --arg t "$TS" \
      '{event:$e, delta:$d, ts:$t}')
    ;;
  stop)
    STATUS=$(echo "$INPUT" | jq -r '.status // "completed"')
    BODY=$(jq -nc --arg e busy_end --arg s "$STATUS" --arg t "$TS" \
      '{event:$e, status:$s, ts:$t}')
    ;;
  sessionEnd)
    BODY=$(jq -nc --arg e session_end --arg t "$TS" '{event:$e, ts:$t}')
    ;;
  *)
    exit 0
    ;;
esac

curl -sf -X POST "http://127.0.0.1:${PORT}/event" \
  -H "Content-Type: application/json" \
  -d "$BODY" >/dev/null 2>&1 || true

# beforeSubmitPrompt must allow submission
if [[ "$EVENT" == "beforeSubmitPrompt" ]]; then
  echo '{"continue": true}'
fi

exit 0
