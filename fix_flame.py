import re

OLD_CSS = """#flame-cursor {
  position: fixed;
  top: 0; left: 0;
  width: 48px;
  height: 58px;
  pointer-events: none;
  z-index: 99999;
  transform: translate(-50%, -50%);
  transition: transform 0.05s linear;
  will-change: transform;
  filter: drop-shadow(0 0 8px rgba(196,151,90,0.6));
}"""

NEW_CSS = """#flame-cursor {
  width: 40px;
  height: 48px;
  background: url('https://lirp.cdn-website.com/7aac0705/dms3rep/multi/opt/Flame+logo+%281%29-1920w.png') center/contain no-repeat;
  position: fixed;
  top: 0; left: 0;
  pointer-events: none;
  z-index: 2147483647;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 0 6px rgba(212,168,83,0.7));
  opacity: 0;
  transition: opacity 0.15s;
}
#flame-cursor.active { opacity: 1; }

@media (hover: none), (pointer: coarse) {
  #flame-cursor { display: none !important; }
}"""

# For the "end of file, truncated/broken" files
TRUNCATE_JS = """// Flame cursor follow
(function() {
  var cur = document.getElementById('flame-cursor');
  if (!cur) return;
  var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (isTouch) { return; }
  document.addEventListener('mousemove', function(e) {
    cur.style.left = e.clientX + 'px';
    cur.style.top = e.clientY + 'px';
    cur.classList.add('active');
  });
})();
</script>
</body>
</html>"""

# For corporate.html: in-place replace, preserving what follows
OLD_JS_INLINE = """// Flame cursor follow
(function() {
  const cursor = document.getElementById('flame-cursor');
  if (!cursor) return;
  document.addEventListener('mousemove', function(e) {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });
})();"""

NEW_JS_INLINE = """// Flame cursor follow
(function() {
  var cur = document.getElementById('flame-cursor');
  if (!cur) return;
  var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (isTouch) { return; }
  document.addEventListener('mousemove', function(e) {
    cur.style.left = e.clientX + 'px';
    cur.style.top = e.clientY + 'px';
    cur.classList.add('active');
  });
})();"""

def fix_common(content):
    if OLD_CSS not in content:
        print("  WARN: CSS block not matched")
    else:
        content = content.replace(OLD_CSS, NEW_CSS)
    content = re.sub(r'<img id="flame-cursor"[^>]*>', '<div id="flame-cursor"></div>', content)
    return content

# little-haven.html, about.html, day-events.html: these were genuinely
# truncated mid-script at the end of the file (missing closing tags).
# Cut from the marker and rebuild a clean ending.
for fname in ["little-haven.html", "about.html", "day-events.html"]:
    with open(fname, encoding="utf-8") as f:
        content = f.read()
    orig_len = len(content)
    content = fix_common(content)
    idx = content.find("// Flame cursor follow")
    if idx == -1:
        print(f"WARN: marker not found in {fname}")
    else:
        content = content[:idx] + TRUNCATE_JS + "\n"
    with open(fname, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"{fname}: {orig_len} -> {len(content)} bytes")

# corporate.html: file wasn't truncated (nav/hamburger + contact form JS
# follow the flame block), so swap only the flame IIFE in place.
fname = "corporate.html"
with open(fname, encoding="utf-8") as f:
    content = f.read()
orig_len = len(content)
content = fix_common(content)
if OLD_JS_INLINE not in content:
    print(f"WARN: JS block not matched in {fname}")
else:
    content = content.replace(OLD_JS_INLINE, NEW_JS_INLINE)
# corporate.html was also missing closing </body></html> — add if absent
if not content.rstrip().endswith("</html>"):
    content = content.rstrip() + "\n</body>\n</html>"
with open(fname, "w", encoding="utf-8") as f:
    f.write(content)
print(f"{fname}: {orig_len} -> {len(content)} bytes")
