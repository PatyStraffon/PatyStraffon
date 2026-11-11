---
name: no-browser-debugging
description: Never debug frontend/UI issues by launching or driving a browser (Playwright, Puppeteer, headless Chrome, dev tools, screenshots). Use whenever a task would otherwise call for opening a browser to reproduce, inspect, or verify a bug on this site.
---

# No Browser Debugging

Paty does not want Claude launching or driving a browser to debug issues on this
site — no headless Chrome, no Playwright/Puppeteer scripts, no automated
screenshots, no clicking through pages to "see what's wrong."

## What to do instead

- **Read the code.** Most HTML/CSS/JS bugs are visible by reading the relevant
  file(s) directly (`index.html`, `menopause-coaching.html`, etc.) — trace the
  markup, styles, and script logic by hand.
- **Ask Paty for what a browser would show.** If you genuinely need runtime
  information (a console error, what actually rendered, a screenshot), ask her to
  paste the console output, the error message, or a screenshot rather than going
  and getting it yourself.
- **Use non-browser checks** where they exist: an HTML/CSS linter or validator, `grep`
  for the suspect markup/selector, a JS syntax check — anything that doesn't spin up
  a browser.
- If a task truly cannot be completed without visually verifying something in a
  live browser, say so explicitly and ask Paty how she'd like to proceed, instead of
  opening one yourself.

## Why

This is a standing preference, not a one-off — it applies to any future debugging
task in this repo, not just the one that's currently in front of you.
