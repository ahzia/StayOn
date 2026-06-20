#!/usr/bin/env bash
# StayOn — forwards Cursor hook events to the extension bridge (fail-open).
# beforeSubmitPrompt MUST print {"continue": true} before any slow work or Agent hangs.
set -uo pipefail

STAYON_DIR="${HOME}/.stayon"
LOG_FILE="${STAYON_DIR}/hook.log"

log_hook() {
  mkdir -p "$STAYON_DIR" 2>/dev/null || true
  printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >>"$LOG_FILE" 2>/dev/null || true
}

find_jq() {
  local p
  p=$(command -v jq 2>/dev/null || true)
  if [[ -n "$p" ]]; then echo "$p"; return; fi
  for p in /opt/homebrew/bin/jq /usr/local/bin/jq /usr/bin/jq; do
    if [[ -x "$p" ]]; then echo "$p"; return; fi
  done
}

find_curl() {
  local p
  p=$(command -v curl 2>/dev/null || true)
  if [[ -n "$p" ]]; then echo "$p"; return; fi
  for p in /usr/bin/curl /opt/homebrew/bin/curl; do
    if [[ -x "$p" ]]; then echo "$p"; return; fi
  done
}

JQ=$(find_jq)
CURL=$(find_curl)
INPUT=$(cat)
PORT=$(cat "${STAYON_DIR}/port" 2>/dev/null || echo "3847")
EVENT=""
BODY=""

if [[ -n "$JQ" ]]; then
  EVENT=$("$JQ" -r '.hook_event_name // empty' <<<"$INPUT" 2>/dev/null || true)
fi

TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

if [[ "$EVENT" == "beforeSubmitPrompt" ]]; then
  echo '{"continue": true}'
fi

if [[ -z "$JQ" ]]; then
  log_hook "ERROR missing jq — install: brew install jq"
  exit 0
fi

case "$EVENT" in
  beforeSubmitPrompt)
    NOTE=$("$JQ" -r '.prompt // ""' <<<"$INPUT" 2>/dev/null | head -c 120 || true)
    BODY=$("$JQ" -nc --arg e busy_start --arg n "$NOTE" --arg t "$TS" \
      '{event:$e, context_note:$n, ts:$t}' 2>/dev/null || true)
    ;;
  preToolUse|postToolUse)
    TOOL=$("$JQ" -r '.tool_name // ""' <<<"$INPUT" 2>/dev/null || true)
    BODY=$("$JQ" -nc --arg e busy_heartbeat --arg tool "$TOOL" --arg t "$TS" \
      '{event:$e, tool:$tool, ts:$t}' 2>/dev/null || true)
    ;;
  afterAgentThought)
    BODY=$("$JQ" -nc --arg e busy_heartbeat --arg phase thinking --arg t "$TS" \
      '{event:$e, phase:$phase, ts:$t}' 2>/dev/null || true)
    ;;
  subagentStart)
    BODY=$("$JQ" -nc --arg e busy_ref --argjson d 1 --arg t "$TS" \
      '{event:$e, delta:$d, ts:$t}' 2>/dev/null || true)
    ;;
  subagentStop)
    BODY=$("$JQ" -nc --arg e busy_ref --argjson d -1 --arg t "$TS" \
      '{event:$e, delta:$d, ts:$t}' 2>/dev/null || true)
    ;;
  stop)
    STATUS=$("$JQ" -r '.status // "completed"' <<<"$INPUT" 2>/dev/null || true)
    BODY=$("$JQ" -nc --arg e busy_end --arg s "$STATUS" --arg t "$TS" \
      '{event:$e, status:$s, ts:$t}' 2>/dev/null || true)
    ;;
  sessionEnd)
    BODY=$("$JQ" -nc --arg e session_end --arg t "$TS" '{event:$e, ts:$t}' 2>/dev/null || true)
    ;;
  *)
    log_hook "skip event=${EVENT:-<empty>} port=$PORT"
    exit 0
    ;;
esac

if [[ -z "$CURL" ]]; then
  log_hook "ERROR missing curl event=$EVENT port=$PORT"
  exit 0
fi

if [[ -n "$BODY" ]]; then
  if ! "$CURL" --connect-timeout 1 --max-time 2 -sf -X POST "http://127.0.0.1:${PORT}/event" \
    -H "Content-Type: application/json" \
    -d "$BODY" >/dev/null 2>&1; then
    log_hook "curl failed event=$EVENT port=$PORT jq=$JQ curl=$CURL"
  else
    log_hook "ok event=$EVENT port=$PORT"
  fi
else
  log_hook "empty body event=$EVENT port=$PORT"
fi

exit 0
