(async () => {
  const { $, $$, esc, fmt } = MS;
  const cfg = await MS.loadConfig(); MS.chrome(cfg);
  const cur = cfg.shipping.currency;
  let designs = await (await fetch('/api/designs')).json();
  const products = cfg.products.filter(p => p.inStock);
  const state = { design: designs[0], product: products[0], color: products[0]?.colors[0]?.name, size: products[0]?.sizes.includes('L') ? 'L' : products[0]?.sizes[0], qty: 1, filter: 'All', q: '' };
  let bag = JSON.parse(localStorage.getItem('ms_bag') || '[]').filter(i => products.find(p => p.id === i.productId) && designs.find(d => d.id === i.designId));
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600); };

  // ---------- section renderers (data-driven; owner edits via /admin) ----------
  const R = {
    hero: s => `<section class="hero" id="${s.id}">${s.image ? `<div class="hero-img" style="background-image:url('${esc(s.image)}')"></div>` : MS.scenery()}
      <div class="hero-mist"></div><div class="wrap hero-copy reveal"><p class="eyebrow">${esc(s.eyebrow)}</p><h1>${esc(s.title)}</h1><p class="lede">${esc(s.subtitle)}</p>
      <div class="cta-row"><a class="btn btn-primary" href="#configurator">${esc(s.cta || 'Shop')}</a><a class="btn btn-ghost" href="#gallery">Browse ${designs.length} designs</a></div></div>
      <div class="hero-scroll">Scroll</div></section>`,
    featured: s => `<section class="band" id="${s.id}"><div class="wrap"><div class="sec-head reveal"><p class="eyebrow">Gallery picks</p><h2>${esc(s.title)}</h2><p class="muted">${esc(s.subtitle || '')}</p></div>
      <div class="feat-grid">${designs.filter(d => d.featured).slice(0, 8).map(d => `<button class="feat-card reveal" data-pick="${d.id}"><div class="feat-img"><img src="${esc(d.file)}" alt="${esc(d.title)}" loading="lazy"></div><div class="feat-meta"><span>${esc(d.title)}</span><small>${esc(d.category)}</small></div></button>`).join('')}</div></div></section>`,
    configurator: s => `<section class="band configurator" id="${s.id}"><div class="wrap"><div class="sec-head reveal"><p class="eyebrow">Studio</p><h2>${esc(s.title)}</h2><p class="muted">${esc(s.subtitle || '')}</p></div>
      <div class="studio">
        <div class="preview-col"><div class="preview-stage"><div class="stage-glow"></div><div id="shirtPreview"></div></div>
          <div class="preview-caption"><div><strong id="pvTitle"></strong><span id="pvSub" class="muted"></span></div><div class="price" id="pvPrice"></div></div></div>
        <div class="opts-col">
          <div class="opt" id="gallery"><div class="opt-head"><span class="step">01</span><h3>Design</h3><input id="gSearch" class="search" placeholder="Search designs…"></div>
            <div class="chips" id="gChips"></div><div class="gallery-grid" id="gGrid"></div></div>
          <div class="opt"><div class="opt-head"><span class="step">02</span><h3>Style</h3></div><div class="styles" id="styles"></div></div>
          <div class="opt"><div class="opt-head"><span class="step">03</span><h3>Colour</h3><span class="muted" id="colorName"></span></div><div class="swatches" id="swatches"></div></div>
          <div class="opt"><div class="opt-head"><span class="step">04</span><h3>Size</h3><a class="muted small" href="/page/faq">Size guide</a></div><div class="sizes" id="sizes"></div></div>
          <div class="buy-row"><div class="qty"><button data-q="-1">−</button><span id="qty">1</span><button data-q="1">+</button></div><button class="btn btn-primary grow" id="addBtn">Add to bag</button></div>
          <p class="fine" id="shipHint"></p>
        </div></div></div></section>`,
    collections: s => `<section class="band" id="${s.id}"><div class="wrap"><div class="sec-head reveal"><p class="eyebrow">Explore</p><h2>${esc(s.title)}</h2></div>
      <div class="coll-grid">${(s.items || []).map(it => { const d = designs.find(x => x.category === it.category); const img = it.image || d?.file || '';
        return `<a class="coll-card reveal" href="#gallery" data-cat="${esc(it.category)}"><div class="coll-img">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : ''}</div><div class="coll-body"><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p><span class="arrow">Shop →</span></div></a>`; }).join('')}</div></div></section>`,
    story: s => `<section class="band story" id="${s.id}"><div class="wrap story-grid"><div class="story-art reveal">${s.image ? `<img src="${esc(s.image)}" alt="">` : MS.scenery('mini')}</div>
      <div class="reveal"><p class="eyebrow">Our story</p><h2>${esc(s.title)}</h2>${String(s.text || '').split(/\n\n+/).map(p => `<p class="lede">${esc(p)}</p>`).join('')}<a class="btn btn-ghost" href="/page/about">More about us</a></div></div></section>`,
    testimonials: s => `<section class="band" id="${s.id}"><div class="wrap"><div class="sec-head reveal"><p class="eyebrow">Reviews</p><h2>${esc(s.title)}</h2></div>
      <div class="quotes">${(s.items || []).map(q => `<figure class="quote reveal"><blockquote>“${esc(q.quote)}”</blockquote><figcaption>${esc(q.name)}</figcaption></figure>`).join('')}</div></div></section>`,
    newsletter: s => `<section class="band newsletter" id="${s.id}"><div class="wrap news-inner reveal"><div><h2>${esc(s.title)}</h2><p class="muted">${esc(s.text)}</p></div>
      <form id="newsForm" class="news-form"><input type="email" required placeholder="you@example.com" aria-label="Email"><button class="btn btn-primary">${esc(s.button || 'Join')}</button></form></div></section>`,
    footer: () => '',
  };
  $('#sections').innerHTML = cfg.sections.filter(s => s.visible && R[s.type]).map(s => R[s.type](s)).join('');
  $('#footer').innerHTML = cfg.sections.find(s => s.type === 'footer')?.visible === false ? '' : MS.footerHtml(cfg);
  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))), { threshold: .12 });
  $$('.reveal').forEach(el => io.observe(el));

  // ---------- configurator ----------
  const hasStudio = !!$('#shirtPreview');
  function colorHex() { return state.product.colors.find(c => c.name === state.color)?.hex || '#111'; }
  function renderPreview() {
    if (!hasStudio) return;
    $('#shirtPreview').innerHTML = Shirt.svg({ silhouette: state.product.silhouette, color: colorHex(), design: state.design?.file, id: 'pv' });
    $('#pvTitle').textContent = state.design?.title || 'Pick a design'; $('#pvSub').textContent = ` · ${state.product.name} · ${state.color} · ${state.size}`;
    $('#pvPrice').textContent = fmt(state.product.price, cur); $('#colorName').textContent = state.color; $('#qty').textContent = state.qty;
  }
  function renderGallery() {
    if (!hasStudio) return;
    const cats = ['All', ...new Set(designs.map(d => d.category))];
    $('#gChips').innerHTML = cats.map(c => `<button class="chip ${c === state.filter ? 'on' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
    const q = state.q.toLowerCase();
    const list = designs.filter(d => (state.filter === 'All' || d.category === state.filter) && (!q || (d.title + ' ' + d.category + ' ' + (d.tags || []).join(' ')).toLowerCase().includes(q)));
    $('#gGrid').innerHTML = list.map(d => `<button class="g-item ${d.id === state.design?.id ? 'on' : ''}" data-pick="${d.id}" title="${esc(d.title)}"><img src="${esc(d.file)}" alt="${esc(d.title)}" loading="lazy"></button>`).join('') || '<p class="muted">No designs match.</p>';
  }
  function renderOpts() {
    if (!hasStudio) return;
    $('#styles').innerHTML = products.map(p => `<button class="style-card ${p.id === state.product.id ? 'on' : ''}" data-style="${p.id}"><span class="s-name">${esc(p.name)}</span><span class="s-price">${fmt(p.price, cur)}</span><span class="s-desc">${esc(p.description)}</span></button>`).join('');
    $('#swatches').innerHTML = state.product.colors.map(c => `<button class="swatch ${c.name === state.color ? 'on' : ''}" data-color="${esc(c.name)}" style="--c:${c.hex}" title="${esc(c.name)}" aria-label="${esc(c.name)}"></button>`).join('');
    $('#sizes').innerHTML = state.product.sizes.map(z => `<button class="size ${z === state.size ? 'on' : ''}" data-size="${z}">${z}</button>`).join('');
    const ft = cfg.shipping.freeThreshold; $('#shipHint').textContent = `Ships across North America from Sooke, BC. Free shipping over ${fmt(ft.CA, cur)} (CA) · ${fmt(ft.US, cur)} (US) · ${fmt(ft.MX, cur)} (MX).`;
  }
  function pick(id, scroll) { const d = designs.find(x => x.id === id); if (!d) return; state.design = d; renderGallery(); renderPreview(); if (scroll && hasStudio) $('#configurator').scrollIntoView({ behavior: 'smooth' }); }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-pick],[data-style],[data-color],[data-size],[data-q],.chip,.coll-card'); if (!t) return;
    if (t.classList.contains('coll-card')) { state.filter = t.dataset.cat; renderGallery(); return; }
    if (t.classList.contains('chip')) { state.filter = t.dataset.cat; renderGallery(); return; }
    if (t.dataset.pick) return pick(t.dataset.pick, !t.classList.contains('g-item'));
    if (t.dataset.style) { state.product = products.find(p => p.id === t.dataset.style); if (!state.product.colors.find(c => c.name === state.color)) state.color = state.product.colors[0].name; if (!state.product.sizes.includes(state.size)) state.size = state.product.sizes[Math.min(2, state.product.sizes.length - 1)]; }
    if (t.dataset.color) state.color = t.dataset.color;
    if (t.dataset.size) state.size = t.dataset.size;
    if (t.dataset.q) state.qty = Math.max(1, Math.min(20, state.qty + Number(t.dataset.q)));
    renderOpts(); renderPreview();
  });
  if (hasStudio) {
    $('#gSearch').addEventListener('input', e => { state.q = e.target.value; renderGallery(); });
    $('#addBtn').addEventListener('click', () => {
      const key = [state.product.id, state.design.id, state.color, state.size].join('|'); const ex = bag.find(i => i.key === key);
      if (ex) ex.qty = Math.min(20, ex.qty + state.qty); else bag.push({ key, productId: state.product.id, designId: state.design.id, color: state.color, size: state.size, qty: state.qty });
      saveBag(); toast(`Added ${state.design.title} · ${state.product.name} (${state.size})`); openBag();
    });
    renderGallery(); renderOpts(); renderPreview();
  }
  $('#newsForm')?.addEventListener('submit', async e => { e.preventDefault(); const inp = e.target.querySelector('input'); const r = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: inp.value }) }); const j = await r.json(); toast(r.ok ? 'You’re on the list. See you at high tide.' : j.error); if (r.ok) inp.value = ''; });

  // ---------- bag + shipping ----------
  const countrySel = $('#shipCountry'), regionSel = $('#shipRegion');
  countrySel.innerHTML = cfg.countries.map(c => `<option value="${c.code}">${esc(c.name)}</option>`).join('');
  const saved = JSON.parse(localStorage.getItem('ms_ship') || '{"country":"CA","region":"BC"}');
  function fillRegions(country, region) { const c = cfg.countries.find(x => x.code === country); $('#regionLabel').textContent = c.regionLabel;
    regionSel.innerHTML = Object.entries(c.regions).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join(''); if (region && c.regions[region]) regionSel.value = region; }
  countrySel.value = saved.country; fillRegions(saved.country, saved.region);
  countrySel.addEventListener('change', () => { fillRegions(countrySel.value); updateTotals(); });
  regionSel.addEventListener('change', updateTotals);
  function saveBag() { localStorage.setItem('ms_bag', JSON.stringify(bag)); renderBag(); }
  function renderBag() {
    $('#bagCount').textContent = bag.reduce((a, i) => a + i.qty, 0);
    $('#bagItems').innerHTML = bag.length ? bag.map((i, n) => { const p = products.find(x => x.id === i.productId), d = designs.find(x => x.id === i.designId), hex = p.colors.find(c => c.name === i.color)?.hex;
      return `<div class="bag-item"><div class="bag-thumb">${Shirt.svg({ silhouette: p.silhouette, color: hex, design: d.file, id: 'b' + n })}</div><div class="bag-info"><strong>${esc(d.title)}</strong><span class="muted">${esc(p.name)} · ${esc(i.color)} · ${i.size}</span>
        <div class="qty sm"><button data-bq="${n}:-1">−</button><span>${i.qty}</span><button data-bq="${n}:1">+</button></div></div><div class="bag-price">${fmt(p.price * i.qty, cur)}<button class="link" data-rm="${n}">Remove</button></div></div>`; }).join('') : '<p class="muted empty">Your bag is empty. Pick a design and a cut to get started.</p>';
    updateTotals();
  }
  let quoteSeq = 0;
  async function updateTotals() {
    localStorage.setItem('ms_ship', JSON.stringify({ country: countrySel.value, region: regionSel.value }));
    const subtotal = bag.reduce((a, i) => a + products.find(p => p.id === i.productId).price * i.qty, 0), count = bag.reduce((a, i) => a + i.qty, 0);
    const seq = ++quoteSeq; let q = null;
    if (count) { const r = await fetch('/api/shipping/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ country: countrySel.value, region: regionSel.value, itemCount: count, subtotal }) }); q = await r.json(); if (seq !== quoteSeq) return; }
    $('#totals').innerHTML = `<div><span>Subtotal</span><span>${fmt(subtotal, cur)}</span></div>
      <div><span>Shipping${q?.ok ? ` · ${esc(q.label)} (${esc(q.days)} days)` : ''}</span><span>${q?.ok ? (q.free ? '<em class="free">Free</em>' : fmt(q.amount, cur)) : '—'}</span></div>
      ${q?.ok && !q.free ? `<div class="nudge">Add ${fmt(q.remainingForFree, cur)} more for free shipping</div>` : ''}
      <div class="grand"><span>Total</span><span>${fmt(subtotal + (q?.ok ? q.amount : 0), cur)} <small>${cur}</small></span></div>`;
    $('#checkoutBtn').disabled = !count;
  }
  $('#bagItems').addEventListener('click', e => { const b = e.target.closest('[data-bq],[data-rm]'); if (!b) return;
    if (b.dataset.rm !== undefined) bag.splice(+b.dataset.rm, 1); else { const [n, d] = b.dataset.bq.split(':').map(Number); bag[n].qty = Math.max(1, Math.min(20, bag[n].qty + d)); } saveBag(); });
  const openBag = () => { $('#bag').classList.add('open'); $('#scrim').classList.add('open'); $('#bag').setAttribute('aria-hidden', 'false'); };
  const closeBag = () => { $('#bag').classList.remove('open'); $('#scrim').classList.remove('open'); $('#bag').setAttribute('aria-hidden', 'true'); };
  $('#bagBtn').onclick = openBag; $('#bagClose').onclick = closeBag; $('#scrim').onclick = closeBag;
  $('#payNote').innerHTML = cfg.stripe.mode === 'test' ? '🔒 Secure checkout by Stripe (test mode — use card 4242 4242 4242 4242)' : 'Demo checkout — Stripe test key not configured yet, no card is charged.';
  $('#checkoutBtn').onclick = async () => {
    const btn = $('#checkoutBtn'); btn.disabled = true; btn.textContent = 'Opening checkout…';
    try { const r = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: bag, country: countrySel.value, region: regionSel.value, email: $('#shipEmail').value || undefined }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error); if (j.mode === 'demo') { bag = []; saveBag(); } location.href = j.url;
    } catch (e) { toast(e.message || 'Checkout failed'); btn.disabled = false; btn.textContent = 'Checkout securely'; }
  };
  if (location.hash === '#bag' || new URLSearchParams(location.search).get('checkout') === 'cancelled') { openBag(); if (location.search.includes('cancelled')) toast('Checkout cancelled — your bag is saved.'); }
  renderBag();
})();
