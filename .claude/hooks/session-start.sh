#!/bin/bash
# SessionStart hook for Claude Code on the web: installs npm dependencies so
# lint, typecheck, unit tests and Playwright e2e tests work in cloud sessions.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# npm install (not ci) so the cached container state is reused between sessions.
npm install --no-audit --no-fund

# Reuse the preinstalled Chromium instead of downloading one for Playwright.
chrome="$(ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome 2>/dev/null | sort -V | tail -1 || true)"
if [ -n "$chrome" ] && [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export PLAYWRIGHT_CHROMIUM_EXECUTABLE=\"$chrome\"" >> "$CLAUDE_ENV_FILE"
fi
