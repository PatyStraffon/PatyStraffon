// Signs a woman up for Paty's free live class from the form on /class: creates or updates
// the Flodesk subscriber and adds her to the "Free class Dec 10" segment. A Flodesk workflow
// on that segment sends the Zoom link and the reminders. Women who click "Save my place"
// in an email are added to the same segment by Flodesk itself (a link action), not here.
import type { Config, Context } from "@netlify/functions"

const API = "https://api.flodesk.com/v1"
const SEGMENT = "Free class Dec 10"

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

async function segmentId() {
  for (let page = 1; page < 20; page++) {
    const res = await json(await flodesk(`/segments?page=${page}&per_page=100`), "list segments")
    const hit = (res.data || []).find((s: { name: string }) => s.name.trim().toLowerCase() === SEGMENT.toLowerCase())
    if (hit) return hit.id as string
    if (!res.meta || page >= res.meta.total_pages) break
  }
  const made = await json(await flodesk("/segments", { method: "POST", body: JSON.stringify({ name: SEGMENT }) }), "create segment")
  return made.id as string
}

export default async (req: Request, context: Context) => {
  let body: Record<string, string>
  try { body = await req.json() } catch { return Response.json({ ok: false, error: "bad request" }, { status: 400 }) }

  // Honeypot: real visitors never fill in "company". Answer as if it worked.
  if (body.company) return Response.json({ ok: true })

  const email = String(body.email || "").trim().toLowerCase()
  const firstName = String(body.first_name || "").trim().slice(0, 60)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200 || !firstName) {
    return Response.json({ ok: false, error: "missing or invalid details" }, { status: 400 })
  }
  if (!Netlify.env.get("FLODESK_API_KEY")) {
    console.error("FLODESK_API_KEY is not set; class sign-up not sent to Flodesk for", email)
    return Response.json({ ok: false, error: "email not set up yet" }, { status: 503 })
  }

  try {
    const segment = await segmentId()
    const sub = await json(await flodesk("/subscribers", {
      method: "POST",
      body: JSON.stringify({
        email, first_name: firstName, segment_ids: [segment],
        optin_ip: context.ip, optin_timestamp: new Date().toISOString(),
      }),
    }), "save subscriber")
    // Make sure she is in the segment even if she was already a subscriber
    // (by id: Flodesk answers 404 when this path uses the email).
    if (sub && sub.id) {
      const res = await flodesk(`/subscribers/${encodeURIComponent(String(sub.id))}/segments`, {
        method: "POST", body: JSON.stringify({ segment_ids: [segment] }),
      })
      if (!res.ok) console.error(`add to segment: ${res.status} ${await res.text()}`)
    }
    return Response.json({ ok: true })
  } catch (e) {
    console.error(String(e))
    return Response.json({ ok: false, error: "could not reach Flodesk" }, { status: 502 })
  }
}

export const config: Config = {
  path: "/api/class",
  method: "POST",
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] },
}
