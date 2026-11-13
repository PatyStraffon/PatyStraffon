// Unlocks the FitPass virtual classes on /clases-virtuales and /videos. The page sends the
// passcode from the FitPass booking instructions; if it matches CLASES_PASSCODE
// (set in Netlify > Project configuration > Environment variables, changed
// monthly) this returns the unlisted YouTube videos. The video IDs never appear
// in the page itself, so the page alone shows nothing without the code.
import type { Config } from "@netlify/functions"

// The FitPass classes: unlisted videos on the Paty Straffon YouTube channel
// (UCFrUJPf12CYtRzeG0rYekVg). Paste each ID (the part after watch?v=) into
// `youtube`; an empty ID shows "Próximamente". `thumb` is site/images/videos/<thumb>.jpg.
const VIDEOS = [
  { title: "Dance cardio y core", minutes: 55, thumb: "fp1", youtube: "" },
  { title: "Dance cardio para principiantes", minutes: 55, thumb: "fp2", youtube: "" },
  { title: "Core esencial", minutes: 22, thumb: "fp3", youtube: "" },
  { title: "Brazos y espalda", minutes: 28, thumb: "10", youtube: "zqe8XKVans8" },
]

function same(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export default async (req: Request) => {
  let code = ""
  try { code = String((await req.json()).code || "") } catch { return Response.json({ ok: false }, { status: 400 }) }
  const secret = Netlify.env.get("CLASES_PASSCODE") || ""
  if (!secret || !same(code.trim().toLowerCase(), secret.trim().toLowerCase())) {
    // A short pause makes guessing codes slow.
    await new Promise(r => setTimeout(r, 800))
    return Response.json({ ok: false }, { status: 401 })
  }
  return Response.json({ ok: true, videos: VIDEOS }, { headers: { "Cache-Control": "no-store" } })
}

export const config: Config = { path: "/api/clases", method: "POST" }
