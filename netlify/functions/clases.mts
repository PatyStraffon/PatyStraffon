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
  { title: "Dance cardio y core", minutes: 55, thumb: "fp1", file: "Black Belt ESP", youtube: "JetISFO7kgE" },
  { title: "Dance cardio para principiantes", minutes: 55, thumb: "fp2", file: "Newbie mali 2 ESP", youtube: "sQv7naRA4is" },
  { title: "Core esencial", minutes: 22, thumb: "fp3", file: "The Core ESP", youtube: "jm7S0Y1z22g" },
  { title: "Brazos y espalda", minutes: 28, thumb: "fp4", file: "10 Clase de Brazos y Upper Body 30 min (edited)", youtube: "2N3nm17lKoY" },
  { title: "Dance sculpt", minutes: 55, thumb: "fp5", file: "Dance Sculpt ESP", youtube: "4KHx8tEw9LQ" },
  { title: "30-minute full body class", minutes: 31, thumb: "fp6", lang: "en", file: "01 30-Min Full Body Strength and Cardio Class (edited)", youtube: "En3ueQJy9FQ" },
  { title: "9-minute dumbbell workout", minutes: 9, thumb: "fp7", lang: "en", file: "05 9-Min Dumbbell Workout (edited)", youtube: "js-vuEah-KY" },
  { title: "Box breathing", minutes: 4, thumb: "fp8", lang: "en", file: "11 Box Breathing (edited)", youtube: "poFCEsTxVSc" },
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
