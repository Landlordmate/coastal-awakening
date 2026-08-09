/* ─────────────────────────────────────────────────────────────
   Coastal Awakening — Share + Add to Home Screen
   Self-contained. Injects its own CSS and markup.
   Add to any page with:  <script src="/ca-share.js" defer></script>
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var GOLD = '#c4975a';
  var NAVY = '#0d1b3e';
  var STORE_KEY = 'ca_a2hs_dismissed_v1';

  var ua = navigator.userAgent;
  var isIOS = /iPad|iPhone|iPod/.test(ua) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // On iOS, Add to Home Screen only exists in real Safari. Chrome (CriOS),
  // Firefox (FxiOS), Edge (EdgiOS) and in-app browsers all report "Safari"
  // in the UA, so they have to be excluded by name.
  var isRealSafari = isIOS && !/CriOS|FxiOS|EdgiOS|OPiOS|Instagram|FBAN|FBAV|Line\/|WhatsApp/.test(ua);
  var isStandalone = window.navigator.standalone === true ||
                     (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  var deferredPrompt = null;

  /* ── styles ─────────────────────────────────────────────── */
  var css = '' +
  '.ca-share-btn{background:none;border:1px solid rgba(196,151,90,.45);color:' + GOLD + ';' +
    'width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;' +
    'cursor:pointer;transition:all .3s;flex:0 0 auto;padding:0;}' +
  '.ca-share-btn:hover{background:' + GOLD + ';color:' + NAVY + ';border-color:' + GOLD + ';}' +
  '.ca-share-btn svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.6;}' +
  '@media(max-width:768px){nav .ca-share-btn{display:none;}}' +

  '.ca-menu-item{font-family:\'Cinzel\',serif;font-size:1.1rem;letter-spacing:.2em;' +
    'text-transform:uppercase;color:' + GOLD + ';background:none;border:none;cursor:pointer;' +
    'padding:0;display:flex;align-items:center;gap:12px;}' +
  '.ca-menu-item svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.6;}' +

  '.ca-ov{position:fixed;inset:0;background:rgba(6,12,28,.82);backdrop-filter:blur(6px);' +
    'z-index:2000;display:none;align-items:center;justify-content:center;padding:24px;opacity:0;' +
    'transition:opacity .28s ease;}' +
  '.ca-ov.on{display:flex;opacity:1;}' +
  '.ca-card{background:' + NAVY + ';border:1px solid rgba(196,151,90,.28);max-width:400px;width:100%;' +
    'padding:36px 30px 30px;position:relative;transform:translateY(14px);transition:transform .28s ease;' +
    'max-height:86vh;overflow-y:auto;}' +
  '.ca-ov.on .ca-card{transform:none;}' +
  '.ca-card h3{font-family:\'Cinzel\',serif;font-size:1.05rem;letter-spacing:.16em;text-transform:uppercase;' +
    'color:#faf7f2;font-weight:500;margin:0 0 6px;}' +
  '.ca-card p.ca-sub{font-family:\'Cormorant Garamond\',serif;font-style:italic;font-size:1.02rem;' +
    'color:rgba(250,247,242,.68);margin:0 0 24px;line-height:1.5;}' +
  '.ca-x{position:absolute;top:12px;right:14px;background:none;border:none;color:rgba(250,247,242,.5);' +
    'font-size:1.5rem;line-height:1;cursor:pointer;padding:6px;}' +
  '.ca-x:hover{color:' + GOLD + ';}' +

  '.ca-opts{display:flex;flex-direction:column;gap:1px;background:rgba(196,151,90,.16);' +
    'border:1px solid rgba(196,151,90,.16);}' +
  '.ca-opt{display:flex;align-items:center;gap:14px;background:' + NAVY + ';border:none;' +
    'padding:15px 16px;cursor:pointer;text-align:left;width:100%;text-decoration:none;' +
    'font-family:\'DM Sans\',sans-serif;font-weight:300;font-size:.92rem;color:#faf7f2;transition:background .2s;}' +
  '.ca-opt:hover{background:#152347;}' +
  '.ca-opt svg{width:18px;height:18px;flex:0 0 18px;stroke:' + GOLD + ';fill:none;stroke-width:1.5;}' +
  '.ca-opt-note{margin-left:auto;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;' +
    'color:rgba(250,247,242,.4);font-family:\'Cinzel\',serif;}' +

  '.ca-steps{list-style:none;margin:0;padding:0;counter-reset:s;}' +
  '.ca-steps li{counter-increment:s;position:relative;padding:0 0 18px 42px;' +
    'font-family:\'DM Sans\',sans-serif;font-weight:300;font-size:.94rem;line-height:1.55;color:rgba(250,247,242,.9);}' +
  '.ca-steps li::before{content:counter(s);position:absolute;left:0;top:-1px;width:26px;height:26px;' +
    'border:1px solid rgba(196,151,90,.5);color:' + GOLD + ';display:flex;align-items:center;' +
    'justify-content:center;font-family:\'Cinzel\',serif;font-size:.72rem;}' +
  '.ca-steps b{font-weight:500;color:' + GOLD + ';}' +
  '.ca-inline-ico{display:inline-block;width:14px;height:14px;vertical-align:-2px;stroke:' + GOLD + ';' +
    'fill:none;stroke-width:1.6;margin:0 2px;}' +

  '.ca-banner{position:fixed;left:12px;right:12px;bottom:12px;z-index:1900;background:' + NAVY + ';' +
    'border:1px solid rgba(196,151,90,.3);box-shadow:0 10px 40px rgba(0,0,0,.5);padding:14px 16px;' +
    'display:none;align-items:center;gap:14px;transform:translateY(140%);transition:transform .45s cubic-bezier(.2,.8,.2,1);}' +
  '.ca-banner.on{display:flex;transform:none;}' +
  '.ca-banner img{width:42px;height:42px;flex:0 0 42px;}' +
  '.ca-banner-txt{flex:1;min-width:0;}' +
  '.ca-banner-txt strong{display:block;font-family:\'Cinzel\',serif;font-size:.72rem;letter-spacing:.14em;' +
    'text-transform:uppercase;color:#faf7f2;font-weight:500;margin-bottom:3px;}' +
  '.ca-banner-txt span{font-family:\'DM Sans\',sans-serif;font-size:.78rem;font-weight:300;' +
    'color:rgba(250,247,242,.62);line-height:1.35;display:block;}' +
  '.ca-banner-add{font-family:\'Cinzel\',serif;font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;' +
    'background:' + GOLD + ';border:none;color:' + NAVY + ';padding:10px 14px;cursor:pointer;flex:0 0 auto;}' +
  '.ca-banner-x{background:none;border:none;color:rgba(250,247,242,.45);font-size:1.3rem;line-height:1;' +
    'cursor:pointer;padding:4px;flex:0 0 auto;}' +

  '.ca-toast{position:fixed;left:50%;bottom:88px;transform:translate(-50%,10px);z-index:2100;' +
    'background:' + GOLD + ';color:' + NAVY + ';font-family:\'Cinzel\',serif;font-size:.66rem;' +
    'letter-spacing:.16em;text-transform:uppercase;padding:11px 22px;opacity:0;pointer-events:none;' +
    'transition:opacity .3s,transform .3s;}' +
  '.ca-toast.on{opacity:1;transform:translate(-50%,0);}';

  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* ── icons ──────────────────────────────────────────────── */
  var I = {
    share: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
    iosShare: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>',
    plus: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/></svg>',
    link: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.7-1.7"/></svg>',
    mail: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/></svg>',
    wa: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 01-12.6 7.4L3 20.5l1.7-5.2A8.5 8.5 0 1121 11.5z"/><path d="M8.6 9.2c.3 2.6 2.4 4.7 5 5.1"/></svg>',
    fb: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M14 8.5V7c0-1 .4-1.5 1.6-1.5H17V2.6C16.6 2.5 15.7 2.4 14.7 2.4c-2.3 0-3.9 1.4-3.9 4V8.5H8v3.2h2.8V21H14v-9.3h2.6l.4-3.2H14z"/></svg>',
    x: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l16 16M20 4L4 20"/></svg>'
  };

  /* ── helpers ────────────────────────────────────────────── */
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  }
  function meta(name) {
    var m = document.querySelector('meta[property="' + name + '"], meta[name="' + name + '"]');
    return m ? m.getAttribute('content') : '';
  }
  function shareData() {
    return {
      title: meta('og:title') || document.title,
      text: meta('og:description') || meta('description') ||
            'Small-group coastal wellness retreats at Oxwich Bay, Gower.',
      url: (document.querySelector('link[rel="canonical"]') || {}).href || window.location.href
    };
  }
  function toast(msg) {
    var t = document.getElementById('caToast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.classList.remove('on'); }, 2200);
  }

  /* ── overlay shell ──────────────────────────────────────── */
  var ov = el('div', { class: 'ca-ov', id: 'caOverlay', role: 'dialog', 'aria-modal': 'true' });
  var card = el('div', { class: 'ca-card', id: 'caCard' });
  ov.appendChild(card);
  ov.addEventListener('click', function (e) { if (e.target === ov) closeOv(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeOv(); });

  function openOv(html) {
    card.innerHTML = '<button class="ca-x" type="button" aria-label="Close">&times;</button>' + html;
    card.querySelector('.ca-x').addEventListener('click', closeOv);
    // close the panel once a share destination has been picked
    Array.prototype.forEach.call(card.querySelectorAll('a.ca-opt'), function (a) {
      a.addEventListener('click', function () { setTimeout(closeOv, 250); });
    });
    ov.classList.add('on');
    document.body.style.overflow = 'hidden';
  }
  function closeOv() {
    ov.classList.remove('on');
    document.body.style.overflow = '';
  }

  /* ── share ──────────────────────────────────────────────── */
  function doShare() {
    var d = shareData();
    if (navigator.share) {
      navigator.share(d).catch(function () {});
      return;
    }
    var u = encodeURIComponent(d.url);
    var t = encodeURIComponent(d.title);
    openOv(
      '<h3>Share</h3>' +
      '<p class="ca-sub">Pass this on to someone who needs a weekend by the sea.</p>' +
      '<div class="ca-opts">' +
        '<button class="ca-opt" data-copy>' + I.link + 'Copy link</button>' +
        '<a class="ca-opt" target="_blank" rel="noopener" href="https://wa.me/?text=' + t + '%20' + u + '">' + I.wa + 'WhatsApp</a>' +
        '<a class="ca-opt" href="mailto:?subject=' + t + '&body=' + u + '">' + I.mail + 'Email</a>' +
        '<a class="ca-opt" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=' + u + '">' + I.fb + 'Facebook</a>' +
        '<a class="ca-opt" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=' + t + '&url=' + u + '">' + I.x + 'X</a>' +
      '</div>'
    );
    card.querySelector('[data-copy]').addEventListener('click', function () {
      copy(d.url);
      closeOv();
    });
  }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { toast('Link copied'); })
        .catch(function () { legacyCopy(text); });
    } else { legacyCopy(text); }
  }
  function legacyCopy(text) {
    var ta = el('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast('Link copied'); }
    catch (e) { toast('Copy failed'); }
    document.body.removeChild(ta);
  }

  /* ── add to home screen ─────────────────────────────────── */
  function doInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () { deferredPrompt = null; });
      hideBanner(true);
      return;
    }
    if (isIOS) {
      openOv(
        '<h3>Add to Home Screen</h3>' +
        '<p class="ca-sub">Keep Coastal Awakening one tap away on your iPhone.</p>' +
        '<ol class="ca-steps">' +
          '<li>Tap the <b>Share</b> icon <svg class="ca-inline-ico" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg> at the bottom of Safari.</li>' +
          '<li>Scroll down and choose <b>Add to Home Screen</b>.</li>' +
          '<li>Tap <b>Add</b> in the top right.</li>' +
        '</ol>' +
        '<p class="ca-sub" style="margin:4px 0 0;font-size:.9rem;">This only works in Safari, not Chrome or in-app browsers.</p>'
      );
      return;
    }
    openOv(
      '<h3>Add to Home Screen</h3>' +
      '<p class="ca-sub">Keep Coastal Awakening one tap away.</p>' +
      '<ol class="ca-steps">' +
        '<li>Open your browser <b>menu</b> (⋮ or ⋯).</li>' +
        '<li>Choose <b>Add to Home screen</b>, <b>Install app</b>, or <b>Install</b>.</li>' +
        '<li>Confirm to finish.</li>' +
      '</ol>'
    );
  }

  /* ── banner ─────────────────────────────────────────────── */
  var banner;
  function buildBanner() {
    banner = el('div', { class: 'ca-banner', id: 'caBanner' },
      '<img src="/icon-192.png" alt="">' +
      '<div class="ca-banner-txt"><strong>Add to Home Screen</strong>' +
      '<span>Keep Coastal Awakening one tap away.</span></div>' +
      '<button class="ca-banner-add">Add</button>' +
      '<button class="ca-banner-x" aria-label="Dismiss">&times;</button>');
    document.body.appendChild(banner);
    banner.querySelector('.ca-banner-add').addEventListener('click', doInstall);
    banner.querySelector('.ca-banner-x').addEventListener('click', function () { hideBanner(true); });
  }
  function showBanner() {
    if (isStandalone) return;
    if (window.innerWidth > 900) return;
    try { if (localStorage.getItem(STORE_KEY)) return; } catch (e) {}
    if (isIOS && !isRealSafari) return;
    if (!isIOS && !deferredPrompt) return;
    if (!banner) buildBanner();
    requestAnimationFrame(function () { banner.classList.add('on'); });
  }
  function hideBanner(remember) {
    if (banner) banner.classList.remove('on');
    if (remember) { try { localStorage.setItem(STORE_KEY, '1'); } catch (e) {} }
  }

  var delayPassed = false;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (delayPassed) showBanner();
  });
  window.addEventListener('appinstalled', function () { hideBanner(true); });

  /* ── inject buttons ─────────────────────────────────────── */
  function inject() {
    document.body.appendChild(ov);
    document.body.appendChild(el('div', { class: 'ca-toast', id: 'caToast' }));

    var nav = document.getElementById('nav') || document.querySelector('nav');
    if (nav && !nav.querySelector('.ca-share-btn')) {
      var b = el('button', { class: 'ca-share-btn', type: 'button', 'aria-label': 'Share this page', title: 'Share' }, I.share);
      b.addEventListener('click', doShare);
      // Prefer sitting inside .nav-links: it already has the right spacing and
      // is already hidden at the mobile breakpoint, so nav layout is untouched.
      var list = nav.querySelector('.nav-links');
      if (list) {
        var li = el('li');
        li.appendChild(b);
        list.appendChild(li);
      } else {
        var anchor = nav.querySelector('.nav-book');
        if (anchor) nav.insertBefore(b, anchor); else nav.appendChild(b);
      }
    }

    var mm = document.getElementById('mobileMenu');
    if (mm && !mm.querySelector('.ca-menu-item')) {
      var s = el('button', { class: 'ca-menu-item', type: 'button' }, I.share + '<span>Share</span>');
      s.addEventListener('click', function () {
        if (typeof window.closeMobile === 'function') window.closeMobile();
        setTimeout(doShare, 180);
      });
      mm.appendChild(s);

      if (!isStandalone) {
        var a = el('button', { class: 'ca-menu-item', type: 'button' }, I.plus + '<span>Add to Home</span>');
        a.addEventListener('click', function () {
          if (typeof window.closeMobile === 'function') window.closeMobile();
          setTimeout(doInstall, 180);
        });
        mm.appendChild(a);
      }
    }

    setTimeout(function () { delayPassed = true; showBanner(); }, 12000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else { inject(); }

  /* ── service worker ─────────────────────────────────────── */
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }

  window.CAShare = { share: doShare, install: doInstall };
})();
