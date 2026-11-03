// Sends a finished 5 Levers course to Flodesk: creates or updates the subscriber,
// stores her results in custom fields and adds her to the "5 Levers course"
// segment. A Flodesk workflow on that segment then emails her the results and
// the follow-up series. Results are worked out here from the 7-digit code, using
// the same words as the website, so nobody can put their own text in the email.
import type { Config, Context } from "@netlify/functions"
import { decode, results } from "../../site/levers-data.js"

const API = "https://api.flodesk.com/v1"
const SEGMENT = "5 Levers course"

// Flodesk custom fields, by label. Missing ones are created on first use.
const FIELDS: Record<string, string> = {
  top_lever: "Levers: lever to start with",
  top_step: "Levers: first small step",
  sleep_level: "Levers: sleep result", sleep_note: "Levers: sleep note",
  protein_level: "Levers: protein result", protein_note: "Levers: protein note",
  carbs_level: "Levers: carbs result", carbs_note: "Levers: carbs note",
  exercise_level: "Levers: exercise result", exercise_note: "Levers: exercise note",
  recovery_level: "Levers: recovery result", recovery_note: "Levers: recovery note",
  summary: "Levers: summary",
  closing: "Levers: personal note",
  results_link: "Levers: results link",
  offer_link: "Levers: offer link",
  stage: "Levers: life stage",
  goal: "Levers: eight-week goal",
}

function flodesk(path: string, init: RequestInit = {}) {
  const key = Netlify.env.get("FLODESK_API_KEY") || ""
  return fetch(API + path, {
    ...init,
    headers: {
      Authorization: "Basic " + btoa(key + ":"),
      "Content-Type": "application/json",
      "User-Agent": "Paty Straffon website (patystraffon.com)",
      ...(init.headers || {}),
    },
  })
}

async function json(res: Response, what: string) {
  if (!res.ok) throw new Error(`${what}: ${res.status} ${await res.text()}`)
  return res.json()
}

async function fieldKeys() {
  const list = await json(await flodesk("/custom-fields/all"), "list custom fields")
  const byLabel = new Map<string, string>()
  for (const f of Array.isArray(list) ? list : list.data || []) byLabel.set(f.label, f.key)
  const keys: Record<string, string> = {}
  for (const [name, label] of Object.entries(FIELDS)) {
    if (!byLabel.has(label)) {
      const made = await json(await flodesk("/custom-fields", { method: "POST", body: JSON.stringify({ label }) }), "create custom field " + label)
      byLabel.set(label, made.key)
    }
    keys[name] = byLabel.get(label)!
  }
  return keys
}

async function segmentId() {
  for (let page = 1; page < 20; page++) {
    const res = await json(await flodesk(`/segments?page=${page}&per_page=100`), "list segments")
    const hit = (res.data || []).find((s: { name: string }) => s.name.trim().toLowerCase() === SEGMENT.toLowerCase())
    if (hit) return hit.id as string
    if (!res.meta || page >= res.meta.total_pages) break
  }
  const colors = await json(await flodesk("/segments/colors"), "list segment colors").catch(() => [])
  const color = Array.isArray(colors) && colors.length ? (colors[0].hex || colors[0].color || colors[0]) : undefined
  const made = await json(await flodesk("/segments", { method: "POST", body: JSON.stringify({ name: SEGMENT, ...(color ? { color } : {}) }) }), "create segment")
  return made.id as string
}

export default async (req: Request, context: Context) => {
  let body: Record<string, string>
  try { body = await req.json() } catch { return Response.json({ ok: false, error: "bad request" }, { status: 400 }) }

  // Honeypot: real visitors never fill in "company". Answer as if it worked.
  if (body.company) return Response.json({ ok: true })

  const email = String(body.email || "").trim().toLowerCase()
  const firstName = String(body.first_name || "").trim().slice(0, 60)
  const r = decode(String(body.code || ""))
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200 || !firstName || !r) {
    return Response.json({ ok: false, error: "missing or invalid details" }, { status: 400 })
  }
  if (!Netlify.env.get("FLODESK_API_KEY")) {
    console.error("FLODESK_API_KEY is not set; results were not sent to Flodesk for", email)
    return Response.json({ ok: false, error: "email not set up yet" }, { status: 503 })
  }

  const res = results(r)
  const code = String(body.code)
  const values: Record<string, string> = {
    top_lever: res.top.name,
    top_step: res.top.step,
    summary: res.band,
    closing: res.closing,
    results_link: `https://patystraffon.com/my-levers#r=${code}`,
    offer_link: `https://patystraffon.com/my-levers#r=${code}&o=1`,
    stage: res.stage,
    goal: res.goal,
  }
  for (const l of res.levers) {
    values[l.id + "_level"] = l.level
    values[l.id + "_note"] = l.note
  }

  try {
    const [keys, segment] = await Promise.all([fieldKeys(), segmentId()])
    const custom_fields: Record<string, string> = {}
    for (const [name, value] of Object.entries(values)) custom_fields[keys[name]] = value
    await json(await flodesk("/subscribers", {
      method: "POST",
      body: JSON.stringify({
        email, first_name: firstName, custom_fields, segment_ids: [segment],
        optin_ip: context.ip, optin_timestamp: new Date().toISOString(),
      }),
    }), "save subscriber")
    // Make sure she is in the segment even if she was already a subscriber.
    await json(await flodesk(`/subscribers/${encodeURIComponent(email)}/segments`, {
      method: "POST", body: JSON.stringify({ segment_ids: [segment] }),
    }), "add to segment")
    return Response.json({ ok: true })
  } catch (e) {
    console.error(String(e))
    return Response.json({ ok: false, error: "could not reach Flodesk" }, { status: 502 })
  }
}

export const config: Config = {
  path: "/api/levers",
  method: "POST",
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] },
}
