#!/bin/zsh
export PATH="$HOME/.npm-global/bin:$PATH"
cd /Users/patriciagomezstraffon/Claude || exit 1

PROMPT="Run the Mac Health routine defined in /Users/patriciagomezstraffon/Claude/mac_health_check.md. This is an UNATTENDED headless run — no one is present to approve anything. Read the routine steps, Known baseline, and Run history / open items sections first. Execute the checks. Then edit mac_health_check.md to update Run history / open items with what you found (mark prior items resolved/dismissed/still-pending based on what the checks show; add newly flagged items). Do NOT delete, move, or modify any file other than mac_health_check.md. Do NOT uninstall software, empty Trash, purge snapshots, or change any system/security setting. Only report and log findings for Paty to act on later."

claude -p "$PROMPT" \
  --permission-mode acceptEdits \
  --allowedTools "Read" "Edit" "Bash(df*)" "Bash(du*)" "Bash(find*)" "Bash(ls*)" "Bash(tmutil*)" "Bash(pkgutil*)" \
  --add-dir /Users/patriciagomezstraffon/Claude \
  --add-dir /Users/patriciagomezstraffon/Downloads \
  --add-dir /Applications \
  --output-format text \
  >> /Users/patriciagomezstraffon/Claude/mac_health_check.log 2>&1

echo "--- run finished $(date) ---" >> /Users/patriciagomezstraffon/Claude/mac_health_check.log
