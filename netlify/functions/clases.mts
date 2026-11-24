// Unlocks the FitPass virtual classes on /clases-virtuales, the only page with videos. The page sends the
// passcode from the FitPass booking instructions; if it matches CLASES_PASSCODE
// (set in Netlify > Project configuration > Environment variables, changed
// every two months) this returns the unlisted YouTube videos. The video IDs never
// appear in the page itself, so the page alone shows nothing without the code.
// A new member also sends her name and email. Only if she ticked "Quiero recibir
// ideas y novedades" (optin) is she added to the Flodesk segment "FitPass"
// (FLODESK_API_KEY); everyone is listed in the Netlify form "fitpass-miembros".
import type { Config, Context } from "@netlify/functions"

const FLODESK = "https://api.flodesk.com/v1"
const SEGMENT = "FitPass"

// The FitPass classes: unlisted videos in the "FitPass" playlist on the Paty Straffon
// YouTube channel (UCFrUJPf12CYtRzeG0rYekVg). Paste each ID (the part after watch?v=)
// into `youtube`. A class with an empty ID is left off the page until it's uploaded.
// `thumb` is site/images/videos/<thumb>.jpg. `file` is the source video; edited versions are in
// ~/Movies/Upload to YouTube/Edited. `lang: "en"` puts a class under "Clases en inglés".
const ALL = [
  // November 2026: the 5 Spanish classes re-edited in the brand frame, with their original music.
  { title: "Dance cardio y core", minutes: 63, thumb: "fp9", file: "ES Dance cardio y core (audio original)", youtube: "msmBjGP-shE" },
  { title: "Dance cardio para principiantes", minutes: 55, thumb: "fp2", file: "ES Dance cardio para principiantes (audio original)", youtube: "W7RP9h4qe24" },
  { title: "Core esencial", minutes: 22, thumb: "fp3", file: "ES Core esencial (audio original)", youtube: "tmpUDbo_xpM" },
  { title: "Brazos y espalda", minutes: 28, thumb: "fp4", file: "ES Brazos y espalda (audio original)", youtube: "21cvqq_4Ugo" },
  { title: "Dance sculpt", minutes: 55, thumb: "fp5", file: "ES Dance sculpt (audio original)", youtube: "6lciAI13NAo" },
]
const VIDEOS = ALL.filter(v => v.youtube).map(({ file, ...v }) => v)

function same(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function flodesk(path: string, init: RequestInit = {}) {
  const key = Netlify.env.get("FLODESK_API_KEY") || ""
  return fetch(FLODESK + path, {
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

// The "FitPass" segment; created the first time a member says yes to emails.
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

async function addToFlodesk(name: string, email: string, ip: string) {
  if (!Netlify.env.get("FLODESK_API_KEY")) { console.error("FLODESK_API_KEY is not set; FitPass member not sent:", email); return }
  const [first_name, ...rest] = name.split(" ")
  try {
    const segment = await segmentId()
    const sub = await json(await flodesk("/subscribers", {
      method: "POST",
      body: JSON.stringify({ email, first_name, last_name: rest.join(" ") || undefined, segment_ids: [segment],
        optin_ip: ip, optin_timestamp: new Date().toISOString() }),
    }), "save subscriber")
    // Make sure she is in the segment even if she was already a subscriber
    // (by id: Flodesk answers 404 when this path uses the email).
    if (sub && sub.id) await json(await flodesk(`/subscribers/${encodeURIComponent(String(sub.id))}/segments`, {
      method: "POST", body: JSON.stringify({ segment_ids: [segment] }),
    }), "add to segment")
  } catch (e) { console.error(String(e)) }
}

export default async (req: Request, context: Context) => {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return Response.json({ ok: false }, { status: 400 }) }
  const code = String(body.code || "")
  const secret = Netlify.env.get("CLASES_PASSCODE") || ""
  if (!secret || !same(code.trim().toLowerCase(), secret.trim().toLowerCase())) {
    // A short pause makes guessing codes slow.
    await new Promise(r => setTimeout(r, 800))
    return Response.json({ ok: false }, { status: 401 })
  }
  const name = String(body.name || "").trim().replace(/\s+/g, " ").slice(0, 80)
  const email = String(body.email || "").trim().toLowerCase()
  if (body.optin === true && name && email.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    // Runs after the reply, so the classes open without waiting for Flodesk.
    const job = addToFlodesk(name, email, context.ip)
    if (typeof context.waitUntil === "function") context.waitUntil(job)
    else await job
  }
  return Response.json({ ok: true, videos: VIDEOS }, { headers: { "Cache-Control": "no-store" } })
}

export const config: Config = {
  path: "/api/clases",
  method: "POST",
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ["ip", "domain"] },
}
