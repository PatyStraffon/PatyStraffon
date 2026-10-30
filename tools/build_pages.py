"""Build the inner pages of patystraffon.com.

Each file in tools/pages/ holds one page body, preceded by a small header:
    title: ...
    description: ...
    path: /m-program
    nav: m-program
    ---
The script wraps every body in the shared head, header and footer and writes
site/<name>.html. Run it from the repository root:  python3 tools/build_pages.py
"""
import html, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ROOT / "tools" / "pages"
SITE = ROOT / "site"
BASE = "https://patystraffon.com"

NAV = [
    ("m-program", "/m-program", "The M Program"),
    ("programs", "/#programs", "Programs"),
    ("thrive", "/thrive", "THRIVE"),
    ("retreats", "/retreats", "Retreats"),
    ("journal", "/#journal", "Journal"),
    ("about", "/about", "About"),
]

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#FAF6F1">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Paty Straffon Wellness">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400&family=Lora:ital,wght@0,400..600;1,400..600&family=Nunito+Sans:opsz,wght@6..12,400..700&family=Montserrat:wght@400;500&display=swap">
<link rel="stylesheet" href="/styles.css">
</head>
<body class="page">
"""

def header(current):
    items, mitems = [], []
    for key, href, label in NAV:
        cur = ' aria-current="page"' if key == current else ""
        items.append(f'      <li><a href="{href}"{cur}>{label}</a></li>')
        mitems.append(f'    <a href="{href}"{cur}>{label}</a>')
    return f"""<header>
  <div class="wrap nav">
    <a class="wordmark" href="/" aria-label="Paty Straffon Wellness, home"><span class="wm-name">Paty Straffon</span><span class="wm-sub">Wellness</span></a>
    <ul>
{chr(10).join(items)}
    </ul>
    <a class="btn btn-bronze" href="/#guide">Free guide</a>
    <button class="burger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mnav"><span></span><span></span><span></span></button>
  </div>
  <nav class="mnav" id="mnav" hidden>
{chr(10).join(mitems)}
    <a class="btn btn-bronze" href="/#guide">Free guide</a>
  </nav>
</header>
<main>
"""

FOOTER = """</main>
<footer>
  <div class="wrap">
    <div class="fgrid">
      <div style="display:grid;gap:16px;align-content:start"><img src="/images/dfe5c3f6f0.png" alt="PSW monogram"><p style="font-size:.95rem;color:var(--mist)">Mind. Metabolism. Movement.<br>Grounded in science, rooted in calm. Wellness for midlife.</p></div>
      <div><h4>Programs</h4><ul><li><a href="/m-program">The M Program</a></li><li><a href="/reset">21-Day Reset</a></li><li><a href="/#programs">All programs</a></li><li><a href="/shop">Shop</a></li></ul></div>
      <div><h4>Explore</h4><ul><li><a href="/thrive">THRIVE</a></li><li><a href="/retreats">Retreats</a></li><li><a href="/#journal">Journal</a></li><li><a href="/about">About</a></li></ul></div>
      <div><h4>Connect</h4><ul><li><a href="/#guide">Newsletter</a></li><li><a href="https://www.instagram.com/thrivewithpaty/" target="_blank" rel="noopener">Instagram</a></li><li><a href="#">Substack</a></li><li><a href="mailto:paty@patystraffon.com">Contact</a></li></ul></div>
    </div>
    <div class="fine"><span>© 2026 Paty Straffon Wellness</span><span><a href="/privacy" style="color:inherit">Privacy</a> · <a href="/terms" style="color:inherit">Terms &amp; refunds</a></span></div>
  </div>
</footer>
<script src="/site.js"></script>
</body>
</html>
"""

def build(src):
    meta_txt, body = src.read_text().split("\n---\n", 1)
    meta = dict(line.split(": ", 1) for line in meta_txt.strip().splitlines())
    page = HEAD.format(title=html.escape(meta["title"]), desc=html.escape(meta["description"]),
                       url=BASE + meta["path"])
    page += header(meta.get("nav", "")) + body.strip() + "\n" + FOOTER
    out = SITE / (src.stem + ".html")
    out.write_text(page)
    return out

if __name__ == "__main__":
    for src in sorted(PAGES.glob("*.html")):
        print("built", build(src).relative_to(ROOT))
