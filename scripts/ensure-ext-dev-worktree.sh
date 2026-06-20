#!/usr/bin/env bash
# Creates a git worktree at .worktrees/ext-dev so Extension Development Host
# opens a *different folder path* than the main window (avoids Cursor merging windows).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WT="$ROOT/.worktrees/ext-dev"

mkdir -p "$ROOT/.worktrees"

if [[ ! -d "$WT" ]]; then
  echo "Creating extension dev worktree at .worktrees/ext-dev …"
  git -C "$ROOT" worktree add "$WT" HEAD
elif [[ ! -f "$WT/.git" && ! -d "$WT/.git" ]]; then
  echo "Removing broken worktree path and recreating …"
  rm -rf "$WT"
  git -C "$ROOT" worktree add "$WT" HEAD
fi

HOOK="$WT/.cursor/hooks/stayon-event.sh"
if [[ -f "$HOOK" ]]; then
  chmod +x "$HOOK"
fi

echo "Extension dev worktree ready: $WT"
