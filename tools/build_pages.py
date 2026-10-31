"""Build the inner pages of patystraffon.com.

Each file in tools/pages/ holds one page body, preceded by a small header:
    title: ...
    description: ...
    path: /m-program
    nav: m-program
    image: m-program        (optional; a 1200x630 file in site/images/og/, default home)
    robots: noindex         (optional)
    ---
The script wraps every body in the shared head, header and footer and writes
site/<name>.html. Run it from the repository root:  python3 tools/build_pages.py
"""
import html, json, pathlib, re

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
    ("shop", "/shop", "Shop"),
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
<meta property="og:image" content="{base}/images/og/{image}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="en_CA">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{base}/images/og/{image}.jpg">
{robots}<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
{schema}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400&family=Lora:ital,wght@0,400..600;1,400..600&family=Nunito+Sans:opsz,wght@6..12,400..700&family=Montserrat:wght@400;500&display=swap">
<link rel="stylesheet" href="/styles.css">
</head>
<body class="page">
"""

PATY = {"@type": "Person", "@id": BASE + "/#paty", "name": "Paty Straffon", "url": BASE + "/about"}
ORG = {"@type": "Organization", "@id": BASE + "/#business", "name": "Paty Straffon Wellness", "url": BASE + "/"}

# Structured data (schema.org JSON-LD) for each page, keyed by file name.
# The Person and business themselves are described once, on the homepage.
SCHEMA = {
    "about": {"@type": "ProfilePage", "url": BASE + "/about", "mainEntity": PATY},
    "m-program": {
        "@type": "Service", "name": "The M Program", "url": BASE + "/m-program",
        "serviceType": "Menopause and perimenopause coaching",
        "description": "An eight-week coached program for women in perimenopause and beyond: Mind, Metabolism and Movement, built around sleep, protein, strategic carbs, exercise, and fueling and recovery.",
        "provider": ORG, "areaServed": "Worldwide (online)", "audience": {"@type": "PeopleAudience", "audienceType": "Women in midlife, perimenopause and menopause"},
    },
    "reset": {
        "@type": "Service", "name": "The 21-Day Reset", "url": BASE + "/reset",
        "serviceType": "Online strength and nutrition program for women in midlife",
        "provider": ORG, "areaServed": "Worldwide (online)",
    },
    "thrive": {
        "@type": "Service", "name": "THRIVE", "url": BASE + "/thrive",
        "serviceType": "Somatic cardio class for women: cardio, strength and breath",
        "provider": ORG, "areaServed": {"@type": "City", "name": "Vancouver"},
    },
    "retreats": {
        "@type": "Event", "name": "Move. Breathe. Restore. Day Retreat", "url": BASE + "/retreats",
        "startDate": "2026-11-27", "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "description": "A day retreat for women in midlife with THRIVE movement, breathwork and a nourishing meal.",
        "image": BASE + "/images/og/retreats.jpg",
        "location": {"@type": "Place", "name": "Vancouver", "address": {"@type": "PostalAddress", "addressLocality": "Vancouver", "addressRegion": "BC", "addressCountry": "CA"}},
        "organizer": ORG, "performer": PATY,
    },
    "shop": {
        "@type": "Product", "name": "Protein, Beautifully", "url": BASE + "/shop",
        "description": "A high-protein recipe ebook for women in midlife, by Paty Straffon.",
        "image": BASE + "/images/protein-beautifully-cover.jpg",
        "brand": {"@type": "Brand", "name": "Paty Straffon Wellness"},
        "offers": {"@type": "Offer", "price": "27.00", "priceCurrency": "CAD", "availability": "https://schema.org/InStock", "url": "https://payhip.com/b/7n38s"},
    },
}

def schema_tag(name):
    data = SCHEMA.get(name)
    if not data:
        return ""
    return ('<script type="application/ld+json">\n'
            + json.dumps({"@context": "https://schema.org", **data}, indent=1, ensure_ascii=False)
            + "\n</script>\n")

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
      <div style="display:grid;gap:16px;align-content:start"><img loading="lazy" decoding="async" src="/images/dfe5c3f6f0.png" alt="PSW monogram"><p style="font-size:.95rem;color:var(--mist)">Mind. Metabolism. Movement.<br>Grounded in science, rooted in calm. Wellness for midlife.</p></div>
      <div><h4>Programs</h4><ul><li><a href="/m-program">The M Program</a></li><li><a href="/reset">21-Day Reset</a></li><li><a href="/#programs">All programs</a></li><li><a href="/shop">Shop</a></li></ul></div>
      <div><h4>Explore</h4><ul><li><a href="/thrive">THRIVE</a></li><li><a href="/retreats">Retreats</a></li><li><a href="/#journal">Journal</a></li><li><a href="/about">About</a></li></ul></div>
      <div><h4>Connect</h4><ul><li><a href="/#guide">Newsletter</a></li><li><a href="https://www.instagram.com/thrivewithpaty/" target="_blank" rel="noopener">Instagram</a></li><li><a href="https://patystraffonwellness.substack.com/" target="_blank" rel="noopener">Substack</a></li><li><a href="mailto:paty@patystraffon.com">Contact</a></li></ul></div>
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
    robots = f'<meta name="robots" content="{meta["robots"]}">\n' if "robots" in meta else ""
    page = HEAD.format(title=html.escape(meta["title"]), desc=html.escape(meta["description"]),
                       url=BASE + meta["path"], base=BASE, image=meta.get("image", "home"),
                       robots=robots, schema=schema_tag(src.stem))
    page += header(meta.get("nav", "")) + body.strip() + "\n" + FOOTER
    out = SITE / (src.stem + ".html")
    out.write_text(page)
    return out

if __name__ == "__main__":
    for src in sorted(PAGES.glob("*.html")):
        print("built", build(src).relative_to(ROOT))
