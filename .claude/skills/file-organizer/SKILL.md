---
name: file-organizer
description: Organize a messy folder (Desktop, Downloads, photo dumps, screenshot piles) into dated, content-labeled folders and rename files based on what's actually in them. Use when Paty asks to organize, sort, clean up, or declutter photos, screenshots, downloads, or any local folder.
---

# File Organizer

Adapted from a third-party "Claude File Organizer" guide. The core idea (look at each
file, sort by date/topic/content, rename descriptively) is sound; the workflow below
is rewritten for Claude Code (local Bash/Read tools) instead of the claude.ai desktop
app's Cowork drag-and-drop.

## Rule

**Never move, rename, or delete a file without showing Paty the full plan first and
getting explicit approval.** This mirrors the caution in `mac_health_check.md` — plan,
then confirm, then act.

## Routine

1. **Get the target folder.** If not given, ask (e.g. `~/Desktop`, `~/Downloads`,
   `~/Pictures`). Confirm scope: this folder only, or recursive into subfolders too.
2. **Inventory.** List every file with `ls -la` / `find`. Group by extension into
   rough buckets: images (jpg/jpeg/png/heic/gif), screenshots (filenames matching
   `Screen Shot*`, `Screenshot*`), documents, installers (dmg/pkg/exe/msi), archives,
   other.
3. **Look at the content.** For images and screenshots, use the Read tool to view
   each one (or a representative sample if there are hundreds — say so explicitly
   rather than silently skipping files). Determine: what it actually shows, and for
   screenshots, what app/site/topic it's from (receipt, chat, dashboard, settings
   screen, etc). Pull the date from EXIF/filename/mtime — use file mtime as a
   fallback when no better date exists, and say when you did.
4. **Propose a structure.** Something like:
   - `Photos/<YYYY-MM>-<short-event-name>/<YYYY-MM-DD>_<description>.<ext>`
   - `Screenshots/<Category>/<YYYY-MM-DD>_<description>.<ext>` where Category is
     e.g. Receipts, Work, Apps, Misc
   - Anything ambiguous or that you're not confident about goes in an `_Unsorted/`
     folder rather than a guessed bucket.
5. **Flag likely duplicates** (same size + similar name/hash) but do not delete them —
   move them into a `_Possible-Duplicates/` folder for Paty to review, or list them
   and wait for a explicit "yes, delete" per the destructive-action rules.
6. **Show the full before/after plan** (old path → new path for every file) and wait
   for approval. For large batches, summarize by folder rather than pasting hundreds
   of lines, but the underlying plan must be fully determined before any move happens.
7. **Execute** only the approved moves, via `mkdir -p` + `mv` (never `rm` unless the
   user explicitly approved deleting a specific file).
8. **Summarize** what moved, what landed in `_Unsorted/` or `_Possible-Duplicates/`
   and why, and how many files were touched.

## Notes

- If a file can't be read (corrupted, unsupported format, permissions), list it under
  "couldn't process" rather than silently dropping it from the plan.
- This does not require any Claude connector — it works entirely on the local
  filesystem via Read/Bash.
