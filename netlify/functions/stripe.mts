// Stripe tells this function about every finished checkout (Stripe Payment Links),
// and it adds the buyer to the right Flodesk segment(s). A Flodesk workflow on each
// segment then sends the welcome email, on the current Flodesk email plan.
//
// Stripe webhook: POST https://patystraffon.com/api/stripe, event checkout.session.completed.
// Netlify environment variables (scope: Functions):
//   STRIPE_WEBHOOK_SECRET  the endpoint's signing secret (whsec_...), required
//   FLODESK_API_KEY        already set for the 5 Levers course
//   STRIPE_SECRET_KEY      optional, a restricted key with write access to Subscriptions.
//                          If set, the 3-payment plan stops by itself after the third charge.
//
// Each Payment Link on the site and in the emails ends with ?client_reference_id=<plan>,
// so this function knows what was bought without trusting prices or names.
import type { Config } from "@netlify/functions"

const FLODESK = "https://api.flodesk.com/v1"
const PROGRAM = "M Program – Jan 2027"
const PRIVATE = "Private clients"
const MOMENTUM = "M Momentum"
const DEPOSIT = "Deposit – balance due Jan 15"

// What each plan means in Flodesk. Segments are created the first time they're needed.
export const PLANS: Record<string, { segments: string[]; label: string }> = {
  founding: { segments: [PROGRAM], label: "The M Program, founding price" },
  regular: { segments: [PROGRAM], label: "The M Program" },
  plan3: { segments: [PROGRAM], label: "The M Program, 3 payments" },
  private: { segments: [PROGRAM, PRIVATE], label: "The M Program + Private" },
  deposit: { segments: [PROGRAM, DEPOSIT], label: "Founding deposit" },
  momentum: { segments: [MOMENTUM], label: "M Momentum" },
  "momentum-private": { segments: [MOMENTUM, PRIVATE], label: "M Momentum + Private" },
}

// ---------- Stripe signature (https://docs.stripe.com/webhooks#verify-manually) ----------
const enc = new TextEncoder()
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("")

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let x = 0
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return x === 0
}

export async function verify(payload: string, header: string, secret: string, now = Date.now(), toleranceSec = 300) {
  const parts = header.split(",").map((p) => p.trim().split("="))
  const t = parts.find(([k]) => k === "t")?.[1]
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v)
  if (!t || !sigs.length) return false
  if (Math.abs(now / 1000 - Number(t)) > toleranceSec) return false
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const expected = hex(await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${payload}`)))
  return sigs.some((s) => safeEqual(s, expected))
}

// ---------- Flodesk (same calls as the 5 Levers course function) ----------
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

async function segmentIds(names: string[]) {
  const found = new Map<string, string>()
  for (let page = 1; page < 20; page++) {
    const res = await json(await flodesk(`/segments?page=${page}&per_page=100`), "list segments")
    for (const s of res.data || []) found.set(String(s.name).trim().toLowerCase(), s.id)
    if (!res.meta || page >= res.meta.total_pages) break
  }
  const ids: string[] = []
  for (const name of names) {
    let id = found.get(name.toLowerCase())
    if (!id) {
      const made = await json(await flodesk("/segments", { method: "POST", body: JSON.stringify({ name }) }), "create segment " + name)
      id = made.id as string
    }
    ids.push(id)
  }
  return ids
}

async function addToFlodesk(email: string, name: string, segments: string[]) {
  const [first_name, ...rest] = (name || "").trim().split(/\s+/)
  const ids = await segmentIds(segments)
  await json(await flodesk("/subscribers", {
    method: "POST",
    body: JSON.stringify({ email, first_name: first_name || undefined, last_name: rest.join(" ") || undefined, segment_ids: ids }),
  }), "create or update subscriber")
  // Make sure she is in the segments even if she was already on the list.
  await json(await flodesk(`/subscribers/${encodeURIComponent(email)}/segments`, {
    method: "POST", body: JSON.stringify({ segment_ids: ids }),
  }), "add to segments")
}

// ---------- 3-payment plan: stop the subscription after the third monthly charge ----------
async function endAfterThree(subscriptionId: string, startedSec: number) {
  const key = Netlify.env.get("STRIPE_SECRET_KEY")
  if (!key) {
    console.log(`plan3 ${subscriptionId}: no STRIPE_SECRET_KEY, set "cancel after 3 payments" by hand in Stripe`)
    return
  }
  // Charges on day 0, +1 month, +2 months; cancel at +2 months and 15 days, before the 4th.
  const cancelAt = startedSec + Math.round((2 * 30.44 + 15) * 86400)
  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ cancel_at: String(cancelAt) }).toString(),
  })
  if (!res.ok) throw new Error(`set cancel_at: ${res.status} ${await res.text()}`)
}

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 })
  const secret = Netlify.env.get("STRIPE_WEBHOOK_SECRET") || ""
  const payload = await req.text()
  if (!secret || !(await verify(payload, req.headers.get("stripe-signature") || "", secret))) {
    return new Response("Bad signature", { status: 400 })
  }
  const event = JSON.parse(payload)
  if (event.type !== "checkout.session.completed") return new Response("Ignored", { status: 200 })

  const s = event.data.object
  const plan = String(s.client_reference_id || "")
  const email = String(s.customer_details?.email || s.customer_email || "").toLowerCase()
  const name = String(s.customer_details?.name || "")
  const info = PLANS[plan]
  if (!email) return new Response("No email", { status: 200 })
  if (!info) {
    console.log(`checkout ${s.id}: unknown plan "${plan}", buyer ${email} not added to Flodesk`)
    return new Response("Unknown plan", { status: 200 })
  }

  try {
    await addToFlodesk(email, name, info.segments)
    if (plan === "plan3" && s.subscription) await endAfterThree(String(s.subscription), Number(s.created) || Math.round(Date.now() / 1000))
  } catch (err) {
    console.error(`checkout ${s.id} (${plan}):`, err)
    return new Response("Error, Stripe will retry", { status: 500 })
  }
  console.log(`checkout ${s.id}: ${info.label}, added to ${info.segments.join(" + ")}`)
  return new Response("OK", { status: 200 })
}

export const config: Config = { path: "/api/stripe", method: "POST" }
