// Unlocks the FitPass virtual classes on /clases-virtuales. The page sends the
// passcode from the FitPass booking instructions; if it matches CLASES_PASSCODE
// (set in Netlify > Project configuration > Environment variables, changed
// monthly) this returns the unlisted YouTube videos. The video IDs never appear
// in the page itself, so the page alone shows nothing without the code.
import type { Config } from "@netlify/functions"

// Fill in each `youtube` ID after the video is uploaded as Unlisted
// (the part after watch?v= in its YouTube link). Empty = "coming soon".
const VIDEOS = [
  { title: "Dance cardio y core", minutes: 60, youtube: "" },
  { title: "Sculpt cuerpo completo y piso pélvico", minutes: 55, youtube: "" },
  { title: "Core", minutes: 30, youtube: "" },
  { title: "Core nivel 2", minutes: 20, youtube: "" },
  { title: "Core nivel 3", minutes: 20, youtube: "" },
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
