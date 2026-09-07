---
name: connector-setup-guide
description: Reference for connecting external tools (Gmail, Canva, Booking.com, ad/payment/CRM tools) to Claude via claude.ai/desktop Connectors settings. Use when Paty asks how to connect a new tool to Claude, or what a connector does.
---

# Connector Setup Guide

Reference only — installing a connector happens in the claude.ai / Claude Desktop
app UI (Settings → Connectors), which this Claude Code session cannot click through
for you. This skill just tells Paty what to do and what to watch for.

## General steps (any connector)

1. Open Claude (desktop app or claude.ai) → **Settings → Connectors**.
2. Browse the list, or click **+** to add a custom one by URL.
3. Click **Connect** and authorize the account when prompted.
4. Once connected, Claude can use it in any conversation — no need to re-activate
   per chat.

## Commonly useful ones

| Connector | What it's for |
|---|---|
| Gmail | Read/search/draft/send email (Claude always shows a draft for approval before sending) |
| Google Calendar | Scheduling, week-ahead planning |
| Canva | Generate designs (carousels, decks, social graphics) in your Canva account |
| Booking.com | Search/compare/book hotels |
| QuickBooks / PayPal / Stripe / Square | Invoices, payments, cash flow — feeds the business-weekly-ops skill in this repo |

## Security note — verify before authorizing

A connector authorization hands the account (email, ad account, payments account,
etc.) real read/write access. Before connecting anything, especially a **custom**
connector added by pasting a URL:

- Prefer connectors listed directly in Claude's own catalog over a custom URL you
  got from a blog post, PDF, or social media guide.
- If a guide gives you a custom MCP URL (e.g. something claiming to be a "Meta Ads"
  or similar connector), verify independently that the domain is actually operated
  by that company before authorizing — a look-alike or unofficial endpoint asking
  for OAuth into a business/ad/payments account is a real phishing risk. When in
  doubt, don't connect it, and ask before proceeding.
- You can disconnect any connector at any time from the same Settings page.
