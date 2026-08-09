#!/usr/bin/env python3
"""
Coastal Awakening — adds share buttons, Add to Home Screen support,
and social share preview (Open Graph) tags to all pages.

Run from inside the coastal-awakening-git folder:
    python3 add-share.py

Safe to run more than once — it skips anything already there.
"""

import os
import re

SITE = "https://coastalawakening.com"
OG_IMAGE = SITE + "/og-image.jpg"

PAGES = {
    "index.html": {
        "canon": "/",
        "desc": "Small-group coastal wellness retreats at Oxwich Bay on the Gower "
                "Peninsula. Cold water dipping, yoga, sound baths and real rest, "
                "two nights by the sea.",
        "ogtitle": "Coastal Awakening — Wellness Retreats at Oxwich Bay, Gower",
    },
    "about.html": {
        "canon": "/about.html",
        "desc": "The story behind Coastal Awakening and the people who hold the "
                "space, on the Gower Peninsula in South Wales.",
        "ogtitle": "About — Coastal Awakening",
    },
    "little-haven.html": {
        "canon": "/little-haven.html",
        "desc": "Little Haven, our retreat house above Oxwich Bay. Sea views, "
                "hot tub, sauna and room for a small group to properly switch off.",
        "ogtitle": "Little Haven — Coastal Awakening, Oxwich Bay",
    },
    "day-events.html": {
        "canon": "/day-events.html",
        "desc": "Day retreats and single-day wellness events on the Gower "
                "Peninsula with Coastal Awakening.",
        "ogtitle": "Day Retreats — Coastal Awakening, Gower",
    },
    "corporate.html": {
        "canon": "/corporate.html",
        "desc": "Corporate wellness retreats and team away days on the Gower "
                "Peninsula. Away from the desk, beside the sea.",
        "ogtitle": "Corporate Wellness Retreats — Coastal Awakening",
    },
}

HEAD_BLOCK = """<meta name="description" content="{desc}">
<link rel="canonical" href="{site}{canon}">
<meta name="theme-color" content="#0d1b3e">
<link rel="manifest" href="/site.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Coastal">
<meta name="application-name" content="Coastal Awakening">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Coastal Awakening">
<meta property="og:locale" content="en_GB">
<meta property="og:url" content="{site}{canon}">
<meta property="og:title" content="{ogtitle}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="A table set for dinner outside Little Haven, Oxwich Bay">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{ogtitle}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{img}">
"""

SCRIPT_TAG = '<script src="/ca-share.js" defer></script>'
MARKER = "CA share/PWA block"


def patch(filename, cfg):
    if not os.path.exists(filename):
        print("  SKIP  %-20s (not found)" % filename)
        return

    with open(filename, "r", encoding="utf-8") as f:
        html = f.read()
    original = html
    notes = []

    # 1. head meta block
    if MARKER not in html:
        block = ("<!-- " + MARKER + " -->\n" + HEAD_BLOCK.format(
            desc=cfg["desc"], canon=cfg["canon"], ogtitle=cfg["ogtitle"],
            site=SITE, img=OG_IMAGE) + "<!-- /" + MARKER + " -->\n")
        m = re.search(r"</title>\s*\n?", html)
        if m:
            html = html[:m.end()] + block + html[m.end():]
            notes.append("meta + og tags")
        else:
            print("  WARN  %-20s no <title> found, head block skipped" % filename)

    # 2. script tag
    if "ca-share.js" not in html:
        if "</body>" in html:
            html = html.replace("</body>", SCRIPT_TAG + "\n</body>", 1)
        else:
            html = html.rstrip() + "\n" + SCRIPT_TAG + "\n"
        notes.append("share script")

    # 3. close the document properly (index.html was missing these)
    if "</body>" not in html:
        html = html.rstrip() + "\n</body>\n"
        notes.append("added </body>")
    if "</html>" not in html:
        html = html.rstrip() + "\n</html>\n"
        notes.append("added </html>")

    if html != original:
        with open(filename, "w", encoding="utf-8") as f:
            f.write(html)
        print("  OK    %-20s %s" % (filename, ", ".join(notes)))
    else:
        print("  --    %-20s already done" % filename)


def check_assets():
    needed = ["site.webmanifest", "sw.js", "ca-share.js",
              "icon-192.png", "icon-512.png", "icon-maskable-512.png",
              "og-image.jpg"]
    missing = [n for n in needed if not os.path.exists(n)]
    if missing:
        print("\n!! These files still need copying into this folder:")
        for m in missing:
            print("     " + m)
    else:
        print("\nAll supporting files present.")


if __name__ == "__main__":
    print("Patching Coastal Awakening pages...\n")
    for name, cfg in PAGES.items():
        patch(name, cfg)
    check_assets()
    print("\nDone. Now: git add -A && git commit -m 'Add share + home screen' && git push")
