---
name: business-weekly-ops
description: Run recurring small-business admin for Paty's coaching business — a weekly brief, chasing unpaid invoices/payments, following up with leads/clients, or a plain-English contract review. Use when Paty asks to be caught up on the business, chase payments, follow up with leads, or review a contract.
---

# Business Weekly Ops

Adapted from a third-party guide describing Anthropic's "Small Business" Cowork
plugin (`/invoice-chase`, `/monday-brief`, etc.). That plugin itself is installed
from claude.ai (Cowork → Customize → Plugins), not from this repo — this skill
covers the same jobs for use inside Claude Code, working with whatever is actually
connected in this session (Gmail, Calendar, or local files Paty provides) instead of
assuming QuickBooks/HubSpot/PayPal are present.

## Ground rule

**Never fabricate numbers.** If a data source (accounting tool, payment processor,
CRM) isn't connected or available in this session, say exactly that and ask Paty to
paste the data, export a CSV, or connect the relevant tool — don't estimate or guess
financial figures. Anything client-facing (a reminder, a reply, a contract redline)
is drafted for review, never sent, without Paty's explicit go-ahead.

## Jobs

### Weekly brief
One page: what's outstanding (payments/invoices, if data is available), calendar
load for the week (if Calendar is connected), and up to 3 concrete to-dos. State
plainly which sections you could actually fill in vs. which need a data source.

### Chase payments / invoices
1. Pull unpaid/overdue items from whatever source is available (connected payment
   tool, or a list/export Paty provides).
2. Sort by how overdue, and note repeat-late clients vs. first-time.
3. Draft one follow-up per client, tone matched to the situation (gentle nudge for a
   client a few days late, firmer for a repeat pattern).
4. Show every draft to Paty. Send nothing — not even via a connected Gmail — without
   per-message approval.

### Lead / client follow-up
Given a list of leads or recent client contacts (from Gmail search, a CRM export, or
a pasted list), rank who's worth reaching out to this week and why, with a one-line
talking point each. Draft outreach messages for review, don't send them.

### Contract review
Given a contract (PDF, doc, or pasted text), produce a plain-English summary,
flag anything unusual or one-sided (payment terms, liability, termination,
auto-renewal, IP/scope), and suggest specific redline language. This is a
first-pass read, not legal advice — say so.

## If something's missing

Name the specific missing piece (e.g. "no payments tool connected — paste a CSV or
tell me the outstanding invoices") rather than silently producing a partial or made-up
answer.
