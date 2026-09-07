---
name: publish-artifact-after-task
description: After finishing any task that changes a visible/visual deliverable (a page on the Paty Straffon site, a mockup, a report, a landing page, or any other HTML/visual output), publish or update an Artifact so Paty can see the current result — don't just describe the change in text. Use this as a final step before ending a turn whenever the task touched something viewable.
---

# Publish an Artifact After Every Task

Standing preference: whenever a task produces or changes something visual — a page
on this site (`index.html`, `menopause-coaching.html`, or any future page), a
mockup, a report, a one-pager, a landing page — publish it (or redeploy the existing
one) as an Artifact as the last step, before ending the turn. Don't leave the result
sitting only in a file diff or a text description.

This applies to the Paty Straffon site and to any other project/task where the
deliverable is something visual — not just this repo.

## How

1. Load the `artifact-design` skill first (required before writing/publishing any
   artifact) to calibrate the design pass.
2. Write the page content to a file, then call the `Artifact` tool to publish it.
3. **Redeploy, don't duplicate.** If an Artifact for this page/deliverable already
   exists (published earlier in this session, or from a prior session — check with
   `action: "list"` or ask Paty for the URL if unsure), update it in place: same
   `file_path` for a same-session redeploy, or pass its `url` for one from an earlier
   session. Only publish a brand-new Artifact when there genuinely isn't one yet.
4. After publishing, tell Paty what changed and share the link — don't just say the
   file was updated.

## Judgment calls

- A pure backend/logic/non-visual change (e.g. a config tweak, a skill file like this
  one) has nothing to preview — skip the artifact step for those, this rule is about
  visual/viewable deliverables.
- If the task is mid-flight across multiple turns, publishing a work-in-progress
  preview at a natural checkpoint is fine and often preferred over waiting until
  everything is finished.

## Scope note

This file lives in this repo's `.claude/skills/`, so it only takes effect in Claude
Code sessions working in this repo. Paty asked for this to apply everywhere
("Paty Straffon site and all others") — for it to also apply in other repos/projects,
the same preference needs to be added to each of those repos (or to a personal/global
Claude Code skills location), since a skill here can't reach sessions outside this repo.
