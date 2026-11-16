// Unlocks the FitPass virtual classes on /clases-virtuales, the only page with videos. The page sends the
// passcode from the FitPass booking instructions; if it matches CLASES_PASSCODE
// (set in Netlify > Project configuration > Environment variables, changed
// monthly) this returns the unlisted YouTube videos. The video IDs never appear
// in the page itself, so the page alone shows nothing without the code.
import type { Config } from "@netlify/functions"

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
