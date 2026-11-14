"""Build the inner pages of patystraffon.com.

Each file in tools/pages/ holds one page body, preceded by a small header:
    title: ...
    description: ...
    path: /m-program
    nav: m-program
    image: m-program        (optional; a 1200x630 file in site/images/og/, default home)
    robots: noindex         (optional)
    lang: es                (optional; default en)
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
    ("shop", "/shop", "Shop"),
    ("journal", "/journal", "Journal"),
    ("about", "/about", "About"),
]

HEAD = """<!DOCTYPE html>
<html lang="{lang}">
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
<meta property="og:locale" content="{locale}">
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
        "startDate": "2027-01-23", "previousStartDate": "2026-11-27", "eventStatus": "https://schema.org/EventRescheduled",
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

CRUMB = {"about": "About", "m-program": "The M Program", "thrive": "THRIVE", "retreats": "Retreats",
         "shop": "Shop", "journal": "Journal", "privacy": "Privacy policy", "terms": "Terms & refunds"}

def breadcrumb_tag(name, path):
    """Home > Page breadcrumb for Google results (indexable pages only)."""
    if name not in CRUMB:
        return ""
    data = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": BASE + "/"},
        {"@type": "ListItem", "position": 2, "name": CRUMB[name], "item": BASE + path}]}
    return '<script type="application/ld+json">\n' + json.dumps(data, ensure_ascii=False) + "\n</script>\n"

JOURNAL = ROOT / "tools" / "journal"

def read_page(src):
    meta_txt, body = src.read_text().split("\n---\n", 1)
    return dict(line.split(": ", 1) for line in meta_txt.strip().splitlines()), body

def articles():
    """On-site journal articles, newest first. Each file in tools/journal/ has a header like the pages."""
    out = []
    for src in JOURNAL.glob("*.html"):
        meta, body = read_page(src)
        out.append({**meta, "slug": src.stem, "body": body})
    return sorted(out, key=lambda a: a["date"], reverse=True)

def nice_date(iso):
    import datetime
    d = datetime.date.fromisoformat(iso)
    return f"{d.strftime('%B')} {d.day}, {d.year}"

def journal_cards():
    cards = []
    for i, a in enumerate(articles()):
        k = f"{html.escape(a['kicker'])} · {nice_date(a['date'])}"
        img = f'<img loading="lazy" decoding="async" src="{a["image"]}" alt="">'
        if i == 0:
            cards.append(f"""      <a class="post feat" href="/journal/{a['slug']}">{img}<div class="ft"><span class="k">{k}</span><h3>{html.escape(a['heading'])}</h3><p>{html.escape(a['excerpt'])}</p><span class="go">Read the article</span></div></a>""")
        else:
            cards.append(f"""      <a class="post" href="/journal/{a['slug']}">{img}<span class="k">{k}</span><h3>{html.escape(a['heading'])}</h3><p>{html.escape(a['excerpt'])}</p></a>""")
    return "\n".join(cards)

def build_article(a):
    path = "/journal/" + a["slug"]
    schema = {"@context": "https://schema.org", "@type": "BlogPosting", "headline": a["heading"],
              "description": a["description"], "image": BASE + a["image"], "datePublished": a["date"],
              "dateModified": a.get("updated", a["date"]), "author": PATY, "publisher": ORG,
              "mainEntityOfPage": BASE + path, "inLanguage": "en"}
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": BASE + "/"},
        {"@type": "ListItem", "position": 2, "name": "Journal", "item": BASE + "/journal"},
        {"@type": "ListItem", "position": 3, "name": a["heading"], "item": BASE + path}]}
    tags = "".join('<script type="application/ld+json">\n' + json.dumps(x, ensure_ascii=False) + "\n</script>\n" for x in (schema, crumbs))
    page = HEAD.format(title=html.escape(a["title"]), desc=html.escape(a["description"]), url=BASE + path, base=BASE,
                       image=a.get("og", "home"), robots="", schema=tags, lang="en", locale="en_CA")
    page = page.replace('<meta property="og:type" content="website">', '<meta property="og:type" content="article">')
    if "og" not in a:
        page = page.replace(f'{BASE}/images/og/home.jpg', BASE + a["image"])
    body = f"""<article class="post-page">
  <div class="wrap post-head">
    <a class="back" href="/journal">&larr; The Journal</a>
    <span class="label">{html.escape(a['kicker'])}</span>
    <h1>{html.escape(a['heading'])}</h1>
    <p class="byline">By <a href="/about">Paty Straffon</a> · Menopause coach · <time datetime="{a['date']}">{nice_date(a['date'])}</time></p>
  </div>
  <figure class="wrap post-hero"><img src="{a['image']}" alt="{html.escape(a['alt'])}" decoding="async"></figure>
  <div class="wrap"><div class="prose">
{a['body'].strip()}
  </div></div>
</article>

<section class="cta">
  <div class="wrap">
    <span class="label">Free mini course</span>
    <h2>The 5 Levers of <em class="b">midlife strength</em></h2>
    <p>Four minutes a lesson, then your personal results. The same levers that power The M Program.</p>
    <div class="ctas"><a class="btn btn-bronze" href="/#guide">Start the free course</a><a class="btn btn-line" href="/m-program">See The M Program</a></div>
  </div>
</section>
"""
    out = SITE / "journal" / (a["slug"] + ".html")
    out.parent.mkdir(exist_ok=True)
    out.write_text(page + header("journal") + body + FOOTER)
    return out

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
    return f"""<a class="skip" href="#main">Skip to content</a>
<header>
  <div class="wrap nav">
    <a class="wordmark" href="/" aria-label="Paty Straffon Wellness, home"><span class="wm-name">Paty Straffon</span><span class="wm-sub">Wellness</span></a>
    <ul>
{chr(10).join(items)}
    </ul>
    <a class="btn btn-bronze" href="/#guide">Free guide</a>
    <button class="burger" type="button" aria-expanded="false" aria-controls="mnav"><span class="bars" aria-hidden="true"><span></span><span></span><span></span></span><span class="btxt">Menu</span></button>
  </div>
  <nav class="mnav" id="mnav" aria-label="Menu" hidden>
{chr(10).join(mitems)}
    <a class="btn btn-bronze" href="/#guide">Free guide</a>
  </nav>
</header>
<main id="main">
"""

FOOTER = """</main>
<footer>
  <div class="wrap">
    <div class="fgrid">
      <div style="display:grid;gap:16px;align-content:start"><img loading="lazy" decoding="async" src="/images/dfe5c3f6f0.png" alt="PSW monogram"><p style="font-size:.95rem;color:var(--mist)">Mind. Metabolism. Movement.<br>Grounded in science, rooted in calm. Wellness for midlife.</p></div>
      <div><h4>Programs</h4><ul><li><a href="/m-program">The M Program</a></li><li><a href="/#programs">All programs</a></li><li><a href="/shop">Shop</a></li></ul></div>
      <div><h4>Explore</h4><ul><li><a href="/thrive">THRIVE</a></li><li><a href="/retreats">Retreats</a></li><li><a href="/journal">Journal</a></li><li><a href="/about">About</a></li></ul></div>
      <div><h4>Connect</h4><ul><li><a href="/#guide">Free 5 Levers course</a></li><li><a href="https://www.instagram.com/thrivewithpaty/" target="_blank" rel="noopener">Instagram</a></li><li><a href="https://www.youtube.com/channel/UCFrUJPf12CYtRzeG0rYekVg" target="_blank" rel="noopener">YouTube</a></li><li><a href="https://patystraffonwellness.substack.com/" target="_blank" rel="noopener">Substack</a></li><li><a href="mailto:paty@patystraffon.com">Contact</a></li></ul></div>
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
                       robots=robots, schema=schema_tag(src.stem) + breadcrumb_tag(src.stem, meta["path"]),
                       lang=meta.get("lang", "en"), locale="es_MX" if meta.get("lang") == "es" else "en_CA")
    if "{{journal}}" in body:
        body = body.replace("{{journal}}", journal_cards())
    page += header(meta.get("nav", "")) + body.strip() + "\n" + FOOTER
    out = SITE / (src.stem + ".html")
    out.write_text(page)
    return out

if __name__ == "__main__":
    for src in sorted(PAGES.glob("*.html")):
        print("built", build(src).relative_to(ROOT))
    for a in articles():
        print("built", build_article(a).relative_to(ROOT))
