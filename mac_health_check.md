# Mac Health Check Routine (Paty)

Recurring local health/cleanup check for this Mac, adapted from a Windows/PowerShell
version. Run via Claude Code's Bash tool (zsh/macOS commands, no PowerShell needed).

**Rule:** report findings only. Never delete files, empty Trash, uninstall software,
purge Time Machine snapshots, change security/privacy settings, or cancel anything
without Paty saying yes to that specific action in the session.

Before each run: read "Known baseline" and "Run history / open items" below. Don't
re-report anything in the baseline unless it reappears or changes. After each run:
update "Run history / open items" — add new flagged items, mark prior ones
resolved/dismissed/still-pending. Once an item is fully resolved for a full cycle,
move it from run history into the baseline list.

## Routine steps

1. **Disk space** — `df -h` for all mounted volumes.
2. **Temp/cache buckets** (Mac has no single %TEMP%; check all three):
   - `/private/tmp` — system-wide scratch space.
   - `$TMPDIR` (per-user temp, `/var/folders/.../T/`).
   - `~/Library/Caches` — the real equivalent of a bloated Windows temp folder;
     flag if it's grown unusually large (multi-GB is normal, but call out sudden jumps).
3. **Downloads cleanup candidates** — find `.dmg`/`.pkg` installers in `~/Downloads`
   older than 30 days, then cross-reference against `/Applications` (and `pkgutil
   --pkgs` for package-receipt installs) to flag ones whose software is already
   installed and the installer file is safe to delete.
4. **Trash size** — `~/.Trash`. Note: Terminal/Claude Code needs "Full Disk Access"
   (System Settings → Privacy & Security → Full Disk Access) to read this folder's
   contents; without it, this check will error out every run until granted — that's
   a one-time setting Paty would need to grant herself (never attempt to change it).
5. **Windows.old equivalents** — the closest recoverable-space traps on Mac:
   - Leftover `Install macOS *.app` installers in `/Applications` (often 10–15GB,
     safe to delete once the upgrade is done — reappears after every macOS update).
   - Local Time Machine snapshots (`tmutil listlocalsnapshots /`) — can silently
     consume tens of GB; clearing them needs Disk Utility or `tmutil thinlocalsnapshots`
     with admin rights, so if found, walk Paty through it rather than running it directly.

## Known baseline (permanently cleared)
*(nothing yet)*

## Run history / open items
- **2026-09-01 (first run):** Free space healthy — 253GB avail of 460GB (~55% free)
  on the main volume. `/private/tmp` (4.5M) and `$TMPDIR` (2.9M) both trivial.
  `~/Library/Caches` = **11GB** — flagged for awareness, not urgent; no browser/dev
  cache-clearing action taken. No leftover `Install macOS*.app`, no local TM
  snapshots — clean.
  **Resolved:** `~/Downloads/HandBrake-1.10.2.dmg` (42M) — confirmed not installed,
  Paty approved, deleted 2026-09-01.
  **Still open:** Trash size unreadable — `du`/`ls` on `~/.Trash` returns "Operation
  not permitted." Paty says she granted Full Disk Access, but the check still fails
  post-grant — likely granted to the wrong app, or the terminal app needs a restart
  to pick it up. Next run: retry `du -sh ~/.Trash`; if it still fails, have Paty
  confirm which terminal app is toggled on in System Settings → Privacy & Security
  → Full Disk Access, and that it's been quit/reopened since granting.

- **2026-09-01 (second run, unattended/headless):** Free space still healthy — 252GB
  avail of 460GB (~55% free) on the main volume; matches first run, no change.
  `/private/tmp` = 4.5M (trivial). `$TMPDIR` = 5.6M (trivial; some subfolders threw
  "Operation not permitted" from macOS but didn't affect the total). `~/Library/Caches`
  = **11GB**, unchanged from first run — no sudden jump, still just flagged for
  awareness. No leftover `Install macOS *.app` (checked Sequoia/Tahoe/Sonoma names
  via `test -d`) — clean. No local Time Machine snapshots — clean.
  **Still open — Trash unreadable:** same "Operation not permitted" on `~/.Trash` as
  first run. Full Disk Access still not effective for this session's terminal/tool —
  unresolved, same next step as before (confirm correct app is toggled and was
  relaunched after granting).
  **New this run — Downloads/Applications checks blocked:** this was an unattended
  headless run, and this Claude Code session's permissions restrict `ls`/`find` (and
  most `du`/`grep` invocations) on `~/Downloads` and `/Applications` to
  interactive-approval-only — no one was present to approve, so step 3 (dmg/pkg
  installer cleanup candidates) could not run at all this cycle. `pkgutil --pkgs`
  did run successfully (session allows it) and returned the full package-receipt
  list, but without a Downloads listing there was nothing to cross-reference it
  against. Next run: if run interactively, or if this session's directory
  permissions get broadened to include `~/Downloads` and `/Applications`, redo step
  3 properly. This is a session-permission limitation, not a Mac health finding.

- **2026-09-01 (third run, unattended/headless):** Free space still healthy — 252GB
  avail of 460GB (~55% free) on the main volume; unchanged from runs 1–2. `/private/tmp`
  = 4.5M (trivial, unchanged). Per-user temp (`/var/folders/.../T`) = 5.6M (trivial,
  unchanged; some sibling `/var/folders/*/*/T` dirs belonging to other users/services
  threw "Permission denied," expected and harmless). `~/Library/Caches` = **11GB**,
  unchanged for the third straight run — still just flagged for awareness, no jump.
  No leftover `Install macOS *.app` — clean. No local Time Machine snapshots — clean.
  **Resolved this run — Downloads/Applications checks:** unlike run 2, this session's
  permissions allowed `ls`/`find` on `~/Downloads` and `/Applications` without
  approval, so step 3 ran fully. Only one `.dmg`/`.pkg` file exists in `~/Downloads`:
  `googlechrome.dmg`, dated today (2026-09-01) — too new to be a cleanup candidate
  (routine only flags installers >30 days old) and Chrome is already installed
  (`Google Chrome.app` present), so this one's safe to delete once Paty confirms, but
  not urgent. No installers older than 30 days found — nothing else to flag.
  Note: `~/Downloads` itself is **24GB** total, but that's almost entirely large
  video/photo/PDF working files (`.mov`/`.mp4`/`.jpg`/`.pdf` — Thrive/M Program
  content, family photos, docs), not installer clutter — outside step 3's scope
  (installers only), just noting for awareness.
  **Still open — Trash unreadable:** same "Operation not permitted" on `~/.Trash` as
  runs 1 and 2 — Full Disk Access still not effective for this session's
  terminal/tool. Unresolved for a third consecutive run; same next step as before
  (confirm correct app is toggled in System Settings → Privacy & Security → Full Disk
  Access, and that it was quit/reopened after granting).
