// Shared: load config, apply theme tokens as CSS variables, header/footer chrome, scenery SVG.
window.MS = (() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n, cur = 'CAD') => new Intl.NumberFormat('en-CA', { style: 'currency', currency: cur }).format(n);
  function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return `${n >> 16 & 255}, ${n >> 8 & 255}, ${n & 255}`; }
  function applyTheme(t, fontPairs) {
    const r = document.documentElement.style, fp = fontPairs[t.fontPair] || Object.values(fontPairs)[0];
    r.setProperty('--bg', t.bg); r.setProperty('--surface', t.surface); r.setProperty('--text', t.text); r.setProperty('--silver', t.silver);
    r.setProperty('--accent', t.accent); r.setProperty('--accent-2', t.accent2); r.setProperty('--accent-rgb', hexToRgb(t.accent)); r.setProperty('--bg-rgb', hexToRgb(t.bg)); r.setProperty('--silver-rgb', hexToRgb(t.silver));
    r.setProperty('--radius-btn', t.radius >= 999 ? '999px' : t.radius + 'px'); r.setProperty('--font-heading', `'${fp.heading}', Georgia, serif`); r.setProperty('--font-body', `'${fp.body}', system-ui, sans-serif`);
    document.documentElement.dataset.fog = t.fog ? 'on' : 'off';
    let link = document.getElementById('gfonts'); const href = `https://fonts.googleapis.com/css2?family=${fp.url}&display=swap`;
    if (!link) { link = document.createElement('link'); link.id = 'gfonts'; link.rel = 'stylesheet'; document.head.appendChild(link); }
    if (link.href !== href) link.href = href;
  }
  function scenery(extraClass = '') { return `<svg class="scenery ${extraClass}" viewBox="0 0 1440 720" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1016"/><stop offset=".55" stop-color="#1d2a36"/><stop offset=".8" stop-color="#5d6b78"/><stop offset="1" stop-color="#c9b39a"/></linearGradient>
      <radialGradient id="glow" cx=".68" cy=".62" r=".35"><stop offset="0" stop-color="#f6d5a6" stop-opacity=".85"/><stop offset="1" stop-color="#f6d5a6" stop-opacity="0"/></radialGradient>
      <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a5566"/><stop offset="1" stop-color="#0a1218"/></linearGradient>
      <linearGradient id="shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#f6d5a6" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="18"/></filter></defs>
    <rect width="1440" height="720" fill="url(#sky)"/><rect width="1440" height="720" fill="url(#glow)"/>
    <circle cx="980" cy="440" r="46" fill="#f8e2bf" opacity=".9"/>
    <path d="M0 470 L120 380 L210 420 L330 300 L440 400 L560 330 L700 430 L820 350 L940 410 L1080 290 L1200 380 L1320 330 L1440 400 V520 H0Z" fill="#46596a" opacity=".55"/>
    <path d="M1080 290 L1050 330 L1072 322 L1090 336 L1108 318 Z M330 300 L306 334 L326 326 L346 340 Z" fill="#dfe6ee" opacity=".55"/>
    <g class="fog fog-1"><ellipse cx="400" cy="440" rx="520" ry="40" fill="#cfd8e0" opacity=".35" filter="url(#blur)"/><ellipse cx="1300" cy="430" rx="480" ry="36" fill="#cfd8e0" opacity=".3" filter="url(#blur)"/></g>
    <path d="M0 520 L90 450 L190 480 L300 410 L420 470 L520 430 L640 490 L760 440 L900 500 L1010 460 L1130 500 L1260 440 L1440 490 V560 H0Z" fill="#26343f"/>
    <rect y="540" width="1440" height="180" fill="url(#sea)"/>
    <rect x="760" y="548" width="440" height="3" fill="url(#shine)"/><rect x="820" y="566" width="320" height="2" fill="url(#shine)"/><rect x="880" y="590" width="200" height="2" fill="url(#shine)"/>
    <g class="fog fog-2"><ellipse cx="900" cy="520" rx="620" ry="34" fill="#dfe5ea" opacity=".28" filter="url(#blur)"/><ellipse cx="100" cy="530" rx="420" ry="30" fill="#dfe5ea" opacity=".25" filter="url(#blur)"/></g>
    <g fill="#0b1115">${trees()}</g>
    <path class="swell" d="M0 650 Q 180 630 360 650 T 720 650 T 1080 650 T 1440 650 V720 H0Z" fill="rgba(var(--bg-rgb, 10,10,11), .9)"/>
    <g class="fog fog-3"><ellipse cx="600" cy="610" rx="700" ry="40" fill="#e9eef2" opacity=".18" filter="url(#blur)"/></g>
  </svg>`; }
  function trees() { let s = ''; const ts = [[30,170],[70,230],[110,190],[150,260],[200,210],[240,150],[1250,180],[1290,240],[1335,200],[1380,270],[1420,210]];
    for (const [x, h] of ts) { const b = 700; s += `<rect x="${x-3}" y="${b-20}" width="6" height="30"/>`; for (let i = 0; i < 7; i++) { const y = b - 20 - i * h / 8, w = (h * .28) * (1 - i * .12); s += `<path d="M${x-w} ${y} L${x} ${y - h / 4} L${x+w} ${y}Z"/>`; } }
    return s + `<path d="M0 700 Q 120 640 280 690 L280 720 H0Z M1200 700 Q 1320 650 1440 670 V720 H1200Z"/>`; }
  async function loadConfig() { const r = await fetch('/api/config'); const c = await r.json(); applyTheme(c.theme, c.fontPairs); return c; }
  function chrome(cfg, { bag = false } = {}) {
    const c = cfg.content, ann = $('#announce'); if (ann) { ann.hidden = !c.announcement?.enabled; ann.textContent = c.announcement?.text || ''; }
    const brand = $('#brand'); if (brand) brand.innerHTML = c.logo ? `<img src="${esc(c.logo)}" alt="${esc(c.siteName)}">` : `<span class="brand-word">${esc(c.siteName)}</span>`;
    document.title = document.title.includes('|') ? document.title : `${c.siteName} — ${c.tagline}`;
  }
  function footerHtml(cfg) { const f = cfg.sections.find(s => s.type === 'footer') || {}; const c = cfg.content;
    return `<footer class="site-footer"><div class="wrap footer-grid"><div><div class="brand-word lg">${esc(c.siteName)}</div><p class="muted">${esc(c.tagline)}</p></div>
      <nav>${(f.links || []).map(l => `<a href="/page/${esc(l.page)}">${esc(l.label)}</a>`).join('')}<a href="/admin">Owner login</a></nav></div>
      <div class="wrap fine">${esc(f.text || '')} · © ${new Date().getFullYear()} ${esc(c.siteName)}</div></footer>`; }
  return { $, $$, esc, fmt, applyTheme, scenery, loadConfig, chrome, footerHtml };
})();
