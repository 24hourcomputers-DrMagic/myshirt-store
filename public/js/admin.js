// Owner admin panel: Theme, Homepage Sections, Gallery, Products, Shipping, Content, Orders.
(() => {
  const { $, $$, esc, fmt } = MS;
  let cfg, tab = location.hash.slice(1) || 'theme';
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400); };
  async function api(method, url, body, isForm) {
    const r = await fetch(url, { method, headers: isForm || !body ? {} : { 'Content-Type': 'application/json' }, body: isForm ? body : body ? JSON.stringify(body) : undefined, credentials: 'same-origin' });
    const j = await r.json().catch(() => ({})); if (r.status === 401 && !url.endsWith('/login')) { showLogin(); throw new Error('Signed out'); } if (!r.ok) throw new Error(j.error || 'Request failed'); return j;
  }
  async function uploadOne(file) { const fd = new FormData(); fd.append('file', file); return (await api('POST', '/api/admin/upload', fd, true)).url; }
  const reload = async () => { cfg = await (await fetch('/api/config')).json(); MS.applyTheme(cfg.theme, cfg.fontPairs); };
  function showLogin() { $('#login').hidden = false; $('#app').hidden = true; }
  $('#loginForm').onsubmit = async e => { e.preventDefault(); try { const j = await api('POST', '/api/admin/login', { password: $('#pw').value }); $('#pw').value = ''; start(j); } catch (err) { $('#loginErr').textContent = err.message; } };
  $('#logout').onclick = async () => { await api('POST', '/api/admin/logout'); showLogin(); };
  async function start(me) {
    $('#login').hidden = true; $('#app').hidden = false; await reload();
    const w = []; if (me.defaultPassword) w.push('You are using the default admin password. Set ADMIN_PASSWORD in the server environment.'); if (me.stripe !== 'test') w.push('Stripe test key not configured: checkout runs in demo mode (no card charged).');
    $('#warn').hidden = !w.length; $('#warn').innerHTML = w.map(esc).join('<br>'); render();
  }
  $('#tabs').onclick = e => { const b = e.target.closest('[data-tab]'); if (!b) return; tab = b.dataset.tab; location.hash = tab; render(); };
  function render() { $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab)); ({ theme, sections, gallery, products, shipping, content, orders })[tab](); }
  const frame = (src = '/') => `<iframe class="preview-frame" id="pf" src="${src}" title="Live preview"></iframe>`;
  const refreshFrame = () => { const f = $('#pf'); if (f) f.contentWindow.location.reload(); };

  // 1. Theme Settings
  function theme() {
    const t = { ...cfg.theme }; const labels = { bg: 'Background', surface: 'Cards / surfaces', text: 'Text', silver: 'Silver (secondary text)', accent: 'Accent (teal)', accent2: 'Highlight (prices)' };
    $('#panel').innerHTML = `<h2>Theme Settings</h2><p class="muted">Colours, fonts and shape. Changes preview live on the right; press Save to publish.</p>
      <div class="split"><div><div class="card">${Object.entries(labels).map(([k, l]) => `<label class="color-row"><input type="color" data-k="${k}" value="${t[k]}"><span>${l}</span><code>${t[k]}</code></label>`).join('')}</div>
        <div class="card"><label class="field">Font pairing<select id="font">${Object.entries(cfg.fontPairs).map(([k, f]) => `<option value="${k}" ${k === t.fontPair ? 'selected' : ''}>${esc(f.label)}</option>`).join('')}</select></label>
        <label class="field">Button corner radius: <b id="radV">${t.radius >= 999 ? 'pill' : t.radius + 'px'}</b><input type="range" id="rad" min="0" max="40" value="${Math.min(t.radius, 40)}"><span class="row"><button class="mini" id="pill">Use pill shape</button></span></label>
        <label class="row" style="gap:8px"><input type="checkbox" id="fog" ${t.fog ? 'checked' : ''}> Animated hero fog</label></div>
        <div class="bar"><button class="btn btn-primary" id="save">Save theme</button><button class="btn btn-ghost" id="reset">Reset to default</button></div></div>
      <div>${frame()}</div></div>`;
    const live = () => { const w = $('#pf').contentWindow; if (w.MS) w.MS.applyTheme(t, cfg.fontPairs); };
    $$('[data-k]').forEach(i => i.oninput = () => { t[i.dataset.k] = i.value; i.parentElement.querySelector('code').textContent = i.value; live(); });
    $('#font').onchange = e => { t.fontPair = e.target.value; live(); };
    $('#rad').oninput = e => { t.radius = +e.target.value; $('#radV').textContent = t.radius + 'px'; live(); };
    $('#pill').onclick = () => { t.radius = 999; $('#radV').textContent = 'pill'; live(); };
    $('#fog').onchange = e => { t.fog = e.target.checked; live(); };
    $('#save').onclick = async () => { try { await api('PUT', '/api/admin/theme', t); await reload(); toast('Theme saved — live on the site'); } catch (e) { toast(e.message); } };
    $('#reset').onclick = async () => { if (!confirm('Reset all theme settings to the defaults?')) return; await api('POST', '/api/admin/reset/theme'); await reload(); theme(); toast('Theme reset'); };
  }

  // 2. Homepage Section Builder
  function sections() {
    let list = JSON.parse(JSON.stringify(cfg.sections)); let open = new Set();
    const itemFields = { collections: ['title', 'text', 'category', 'image'], testimonials: ['quote', 'name'], footer: ['label', 'page'] };
    const isImg = k => k === 'image';
    const fieldHtml = (k, v, path) => isImg(k) ? `<div class="field">${k}<div class="img-field">${v ? `<img src="${esc(v)}">` : ''}<input data-p="${path}" value="${esc(v)}" placeholder="Image URL or upload →"><input type="file" accept="image/*" data-up="${path}"></div></div>`
      : `<label class="field">${k}${String(v).length > 60 || k === 'text' ? `<textarea data-p="${path}">${esc(v)}</textarea>` : `<input data-p="${path}" value="${esc(v)}">`}</label>`;
    function draw() {
      $('#panel').innerHTML = `<h2>Homepage Section Builder</h2><p class="muted">Drag ☰ (or use ↑ ↓) to reorder, toggle visibility, and edit each block. Save to publish.</p>
      <div class="split"><div><div id="secList">${list.map((s, i) => `<div class="sec-item" draggable="true" data-i="${i}"><div class="sec-head2"><span class="handle">☰</span><strong>${esc(s.type)}</strong>
        <button class="mini" data-mv="${i}:-1" title="Move up">↑</button><button class="mini" data-mv="${i}:1" title="Move down">↓</button>
        <button class="mini ${s.visible ? 'on' : ''}" data-vis="${i}">${s.visible ? 'Visible' : 'Hidden'}</button><button class="mini" data-open="${i}">${open.has(i) ? 'Close' : 'Edit'}</button></div>
        ${open.has(i) ? `<div class="sec-body">${Object.entries(s).filter(([k, v]) => !['id', 'type', 'visible'].includes(k) && typeof v === 'string').map(([k, v]) => fieldHtml(k, v, `${i}.${k}`)).join('')}
          ${Array.isArray(s.items || s.links) ? `<p class="fine">${s.items ? 'Items' : 'Links'}</p>${(s.items || s.links).map((it, j) => `<div class="sub-item">${(itemFields[s.type] || Object.keys(it)).map(k => fieldHtml(k, it[k] ?? '', `${i}.${s.items ? 'items' : 'links'}.${j}.${k}`)).join('')}<button class="mini danger" data-rmi="${i}:${j}">Remove</button></div>`).join('')}<button class="mini" data-addi="${i}">+ Add</button>` : ''}
          ${s.type === 'configurator' ? '<p class="fine">The shirt builder pulls designs from the Gallery Manager and styles from the Product Editor.</p>' : ''}</div>` : ''}</div>`).join('')}</div>
        <div class="bar"><button class="btn btn-primary" id="save">Save homepage</button><button class="btn btn-ghost" id="reset">Reset to default</button></div></div><div>${frame()}</div></div>`;
      bind();
    }
    const setPath = (p, v) => { const ks = p.split('.'); let o = list; while (ks.length > 1) o = o[ks.shift()]; o[ks[0]] = v; };
    function bind() {
      $$('[data-p]').forEach(i => i.oninput = () => setPath(i.dataset.p, i.value));
      $$('[data-up]').forEach(i => i.onchange = async () => { try { setPath(i.dataset.up, await uploadOne(i.files[0])); draw(); toast('Image uploaded — remember to Save'); } catch (e) { toast(e.message); } });
      $$('[data-mv]').forEach(b => b.onclick = () => { const [i, d] = b.dataset.mv.split(':').map(Number); const j = i + d; if (j < 0 || j >= list.length) return; [list[i], list[j]] = [list[j], list[i]]; open = new Set(); draw(); });
      $$('[data-vis]').forEach(b => b.onclick = () => { list[b.dataset.vis].visible = !list[b.dataset.vis].visible; draw(); });
      $$('[data-open]').forEach(b => b.onclick = () => { const i = +b.dataset.open; open.has(i) ? open.delete(i) : open.add(i); draw(); });
      $$('[data-rmi]').forEach(b => b.onclick = () => { const [i, j] = b.dataset.rmi.split(':').map(Number); (list[i].items || list[i].links).splice(j, 1); draw(); });
      $$('[data-addi]').forEach(b => b.onclick = () => { const s = list[+b.dataset.addi]; const arr = s.items || s.links; arr.push(Object.fromEntries((itemFields[s.type] || []).map(k => [k, '']))); draw(); });
      let from = null; $$('.sec-item').forEach(el => {
        el.ondragstart = () => { from = +el.dataset.i; el.classList.add('dragging'); }; el.ondragend = () => el.classList.remove('dragging');
        el.ondragover = e => { e.preventDefault(); el.classList.add('over'); }; el.ondragleave = () => el.classList.remove('over');
        el.ondrop = e => { e.preventDefault(); const to = +el.dataset.i; if (from === null || from === to) return; const [m] = list.splice(from, 1); list.splice(to, 0, m); open = new Set(); draw(); };
      });
      $('#save').onclick = async () => { try { await api('PUT', '/api/admin/sections', list); await reload(); refreshFrame(); toast('Homepage saved'); } catch (e) { toast(e.message); } };
      $('#reset').onclick = async () => { if (!confirm('Reset all homepage sections and text to the defaults?')) return; await api('POST', '/api/admin/reset/sections'); await reload(); sections(); toast('Homepage reset'); };
    }
    draw();
  }

  // 3. Gallery Manager
  async function gallery() {
    let g = await api('GET', '/api/admin/gallery'); let filter = '';
    const cats = () => [...new Set(g.map(d => d.category))];
    function draw() {
      const shown = g.filter(d => !filter || (d.title + d.category + (d.tags || []).join(' ')).toLowerCase().includes(filter));
      $('#panel').innerHTML = `<h2>Gallery Manager</h2><p class="muted">${g.length} designs. Upload your own photos or art, drag to reorder, mark featured (shown on the homepage), hide, replace or delete.</p>
        <form class="card row" id="upForm"><label class="field">Images<input type="file" name="files" accept="image/*" multiple required></label><label class="field">Title (optional)<input name="title"></label>
          <label class="field">Category<input name="category" list="catList" value="Owner uploads"></label><label class="field">Tags (comma separated)<input name="tags"></label><button class="btn btn-primary">Upload</button></form>
        <datalist id="catList">${cats().map(c => `<option value="${esc(c)}">`).join('')}</datalist>
        <div class="bar"><input id="gf" placeholder="Filter…" style="max-width:260px" value="${esc(filter)}"><span class="spacer"></span><button class="btn btn-ghost" id="saveOrder">Save order</button></div>
        <div class="g-admin">${shown.map(d => `<div class="g-card ${d.hidden ? 'hiddenD' : ''}" draggable="true" data-id="${d.id}"><div class="thumb"><img src="${esc(d.file)}?v=${encodeURIComponent(d.file)}" alt=""></div>
          <input data-f="title" value="${esc(d.title)}"><input data-f="category" list="catList" value="${esc(d.category)}"><input data-f="tags" value="${esc((d.tags || []).join(', '))}" placeholder="tags">
          <div class="row"><button class="mini ${d.featured ? 'on' : ''}" data-act="featured">${d.featured ? '★ Featured' : '☆ Feature'}</button><button class="mini ${d.hidden ? '' : 'on'}" data-act="hidden">${d.hidden ? 'Hidden' : 'Shown'}</button><span class="badge">${d.source}</span></div>
          <div class="row"><label class="mini">Replace<input type="file" accept="image/*" data-act="replace" hidden></label><button class="mini danger" data-act="delete">Delete</button></div></div>`).join('')}</div>`;
      $('#gf').oninput = e => { filter = e.target.value.toLowerCase(); draw(); $('#gf').focus(); };
      $('#upForm').onsubmit = async e => { e.preventDefault(); try { const added = await api('POST', '/api/admin/gallery', new FormData(e.target), true); g = await api('GET', '/api/admin/gallery'); draw(); toast(`Uploaded ${added.length} image(s)`); } catch (err) { toast(err.message); } };
      $$('.g-card').forEach(card => {
        const id = card.dataset.id, d = g.find(x => x.id === id);
        card.querySelectorAll('[data-f]').forEach(i => i.onchange = async () => { try { Object.assign(d, await api('PUT', `/api/admin/gallery/${id}`, { [i.dataset.f]: i.value })); toast('Saved'); } catch (e) { toast(e.message); } });
        card.querySelectorAll('button[data-act]').forEach(b => b.onclick = async () => {
          try { if (b.dataset.act === 'delete') { if (!confirm(`Delete "${d.title}"?`)) return; await api('DELETE', `/api/admin/gallery/${id}`); g = g.filter(x => x.id !== id); }
            else Object.assign(d, await api('PUT', `/api/admin/gallery/${id}`, { [b.dataset.act]: !d[b.dataset.act] })); draw(); } catch (e) { toast(e.message); } });
        card.querySelector('input[data-act=replace]').onchange = async ev => { const fd = new FormData(); fd.append('file', ev.target.files[0]); try { Object.assign(d, await api('POST', `/api/admin/gallery/${id}/replace`, fd, true)); draw(); toast('Image replaced'); } catch (e) { toast(e.message); } };
        card.ondragstart = () => { card.classList.add('dragging'); gallery.drag = id; }; card.ondragend = () => card.classList.remove('dragging');
        card.ondragover = e => { e.preventDefault(); card.classList.add('over'); }; card.ondragleave = () => card.classList.remove('over');
        card.ondrop = e => { e.preventDefault(); const from = g.findIndex(x => x.id === gallery.drag), to = g.findIndex(x => x.id === id); if (from < 0 || from === to) return; const [m] = g.splice(from, 1); g.splice(to, 0, m); draw(); toast('Order changed — press Save order'); };
      });
      $('#saveOrder').onclick = async () => { try { await api('PUT', '/api/admin/gallery-order', { ids: g.map(d => d.id) }); toast('Gallery order saved'); } catch (e) { toast(e.message); } };
    }
    draw();
  }

  // 4. Product Editor
  function products() {
    let list = JSON.parse(JSON.stringify(cfg.products)); const ALL = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    function draw() {
      $('#panel').innerHTML = `<h2>Product Editor</h2><p class="muted">Styles (cuts), prices in ${cfg.shipping.currency}, colours, sizes and stock.</p>
        ${list.map((p, i) => `<div class="card prod"><div class="mock">${Shirt.svg({ silhouette: p.silhouette, color: p.colors[0]?.hex || '#111', design: '/designs/waves-teal.svg', id: 'p' + i })}</div><div>
          <div class="row"><label class="field">Name<input data-p="${i}.name" value="${esc(p.name)}"></label><label class="field">Price<input type="number" step="0.01" min="1" data-p="${i}.price" value="${p.price}"></label>
          <label class="field">Shape<select data-p="${i}.silhouette">${['crew', 'vneck', 'longsleeve', 'womens'].map(s => `<option ${s === p.silhouette ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
          <label class="field">ID<input data-p="${i}.id" value="${esc(p.id)}"></label></div>
          <label class="field">Description<textarea data-p="${i}.description">${esc(p.description)}</textarea></label>
          <div class="field">Sizes<div class="sizes-pick">${ALL.map(z => `<label><input type="checkbox" data-size="${i}:${z}" ${p.sizes.includes(z) ? 'checked' : ''}>${z}</label>`).join('')}</div></div>
          <div class="field colors-edit">Colours${p.colors.map((c, j) => `<div class="color-line"><input type="color" data-c="${i}.${j}.hex" value="${c.hex}"><input type="text" data-c="${i}.${j}.name" value="${esc(c.name)}"><button class="mini danger" data-rmc="${i}:${j}">×</button></div>`).join('')}<button class="mini" data-addc="${i}" style="justify-self:start">+ Colour</button></div>
          <div class="row"><label class="row" style="gap:6px"><input type="checkbox" data-stock="${i}" ${p.inStock ? 'checked' : ''}> In stock (shown in shop)</label><span class="spacer"></span><button class="mini danger" data-rm="${i}">Delete style</button></div></div></div>`).join('')}
        <div class="bar"><button class="btn btn-ghost" id="add">+ Add style</button><span class="spacer"></span><button class="btn btn-primary" id="save">Save products</button><button class="btn btn-ghost" id="reset">Reset to default</button></div>`;
      $$('[data-p]').forEach(i => i.oninput = () => { const [n, k] = i.dataset.p.split('.'); list[n][k] = k === 'price' ? Number(i.value) : i.value; if (k === 'silhouette') draw(); });
      $$('[data-c]').forEach(i => i.oninput = () => { const [n, j, k] = i.dataset.c.split('.'); list[n].colors[j][k] = i.value; });
      $$('[data-size]').forEach(i => i.onchange = () => { const [n, z] = i.dataset.size.split(':'); const s = new Set(list[n].sizes); i.checked ? s.add(z) : s.delete(z); list[n].sizes = ALL.filter(x => s.has(x)); });
      $$('[data-stock]').forEach(i => i.onchange = () => list[i.dataset.stock].inStock = i.checked);
      $$('[data-rmc]').forEach(b => b.onclick = () => { const [n, j] = b.dataset.rmc.split(':').map(Number); list[n].colors.splice(j, 1); draw(); });
      $$('[data-addc]').forEach(b => b.onclick = () => { list[b.dataset.addc].colors.push({ name: 'New colour', hex: '#888888' }); draw(); });
      $$('[data-rm]').forEach(b => b.onclick = () => { if (confirm(`Delete ${list[b.dataset.rm].name}?`)) { list.splice(b.dataset.rm, 1); draw(); } });
      $('#add').onclick = () => { list.push({ id: 'new-style-' + (list.length + 1), name: 'New Style', description: '', price: 35, silhouette: 'crew', inStock: true, sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: [{ name: 'Coastal Black', hex: '#111214' }] }); draw(); };
      $('#save').onclick = async () => { try { list = await api('PUT', '/api/admin/products', list); await reload(); draw(); toast('Products saved'); } catch (e) { toast(e.message); } };
      $('#reset').onclick = async () => { if (!confirm('Reset all styles, prices and colours to the defaults?')) return; await api('POST', '/api/admin/reset/products'); await reload(); products(); toast('Products reset'); };
    }
    draw();
  }

  // 5. Shipping Rates Editor
  function shipping() {
    const s = JSON.parse(JSON.stringify(cfg.shipping)), cur = s.currency;
    $('#panel').innerHTML = `<h2>Shipping Rates</h2><p class="muted">Rate = base + per-extra-item × (items − 1). Free when the order subtotal reaches the country threshold. Amounts in ${cur}.</p>
      <div class="card"><table><thead><tr><th>Zone</th><th>Label shown to customers</th><th>Base</th><th>Each extra item</th><th>Delivery days</th></tr></thead><tbody>
      ${Object.entries(s.zones).map(([k, z]) => `<tr><td><code>${k}</code></td><td><input data-z="${k}.label" value="${esc(z.label)}"></td><td><input type="number" step="0.5" min="0" data-z="${k}.base" value="${z.base}"></td><td><input type="number" step="0.5" min="0" data-z="${k}.perItem" value="${z.perItem}"></td><td><input data-z="${k}.days" value="${esc(z.days)}"></td></tr>`).join('')}</tbody></table></div>
      <div class="card row">${['CA', 'US', 'MX'].map(c => `<label class="field">Free shipping threshold — ${c}<input type="number" min="0" data-t="${c}" value="${s.freeThreshold[c]}"></label>`).join('')}</div>
      <div class="card"><p class="fine">Test a quote (uses saved rates)</p><div class="calc"><label class="field">Country<select id="qc">${cfg.countries.map(c => `<option value="${c.code}">${c.name}</option>`).join('')}</select></label>
        <label class="field">Region<select id="qr"></select></label><label class="field">Items<input type="number" id="qn" value="2" min="1"></label><label class="field">Subtotal<input type="number" id="qs" value="70"></label><button class="btn btn-ghost" id="qgo">Quote</button><span class="out" id="qout"></span></div></div>
      <div class="bar"><button class="btn btn-primary" id="save">Save rates</button><button class="btn btn-ghost" id="reset">Reset to default</button></div>`;
    $$('[data-z]').forEach(i => i.oninput = () => { const [k, f] = i.dataset.z.split('.'); s.zones[k][f] = i.type === 'number' ? Number(i.value) : i.value; });
    $$('[data-t]').forEach(i => i.oninput = () => s.freeThreshold[i.dataset.t] = Number(i.value));
    const fillR = () => { const c = cfg.countries.find(x => x.code === $('#qc').value); $('#qr').innerHTML = Object.entries(c.regions).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join(''); }; $('#qc').onchange = fillR; fillR();
    $('#qgo').onclick = async () => { const r = await fetch('/api/shipping/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ country: $('#qc').value, region: $('#qr').value, itemCount: +$('#qn').value, subtotal: +$('#qs').value }) }); const q = await r.json(); $('#qout').textContent = q.ok ? `${q.label}: ${q.free ? 'FREE' : fmt(q.amount, cur)} (${q.days} days)` : q.error; };
    $('#save').onclick = async () => { try { await api('PUT', '/api/admin/shipping', s); await reload(); toast('Shipping rates saved'); } catch (e) { toast(e.message); } };
    $('#reset').onclick = async () => { if (!confirm('Reset shipping rates to defaults?')) return; await api('POST', '/api/admin/reset/shipping'); await reload(); shipping(); toast('Rates reset'); };
  }

  // 6. Site Content
  function content() {
    const c = JSON.parse(JSON.stringify(cfg.content));
    $('#panel').innerHTML = `<h2>Site Content</h2><p class="muted">Logo, name, announcement bar and the About / FAQ / Shipping &amp; Returns pages. Blank line = new paragraph. In the FAQ, a line ending in “?” becomes a question heading.</p>
      <div class="card"><div class="row"><label class="field">Site name<input id="sn" value="${esc(c.siteName)}"></label><label class="field">Tagline<input id="tg" value="${esc(c.tagline)}"></label></div>
        <div class="field">Logo (optional — replaces the text wordmark)<div class="img-field">${c.logo ? `<img src="${esc(c.logo)}">` : '<span class="badge">text wordmark</span>'}<input type="file" accept="image/*" id="logo"><button class="mini danger" id="clearLogo">Remove logo</button></div></div>
        <label class="row" style="gap:8px"><input type="checkbox" id="annOn" ${c.announcement.enabled ? 'checked' : ''}> Show announcement bar</label><label class="field"><input id="annT" value="${esc(c.announcement.text)}"></label></div>
      ${Object.entries(c.pages).map(([k, p]) => `<div class="card"><p class="fine">/page/${k}</p><label class="field">Title<input data-pg="${k}.title" value="${esc(p.title)}"></label><label class="field">Text<textarea rows="8" data-pg="${k}.body">${esc(p.body)}</textarea></label></div>`).join('')}
      <div class="bar"><button class="btn btn-primary" id="save">Save content</button><button class="btn btn-ghost" id="reset">Reset to default</button></div>`;
    $('#sn').oninput = e => c.siteName = e.target.value; $('#tg').oninput = e => c.tagline = e.target.value;
    $('#annOn').onchange = e => c.announcement.enabled = e.target.checked; $('#annT').oninput = e => c.announcement.text = e.target.value;
    $$('[data-pg]').forEach(i => i.oninput = () => { const [k, f] = i.dataset.pg.split('.'); c.pages[k][f] = i.value; });
    $('#logo').onchange = async e => { try { c.logo = await uploadOne(e.target.files[0]); await api('PUT', '/api/admin/content', c); await reload(); content(); toast('Logo updated'); } catch (err) { toast(err.message); } };
    $('#clearLogo').onclick = async () => { c.logo = ''; await api('PUT', '/api/admin/content', c); await reload(); content(); toast('Logo removed'); };
    $('#save').onclick = async () => { try { await api('PUT', '/api/admin/content', c); await reload(); toast('Content saved'); } catch (e) { toast(e.message); } };
    $('#reset').onclick = async () => { if (!confirm('Reset site name, logo, announcement and pages to defaults?')) return; await api('POST', '/api/admin/reset/content'); await reload(); content(); toast('Content reset'); };
  }

  // Orders + newsletter list (read-only)
  async function orders() {
    const [o, subs] = await Promise.all([api('GET', '/api/admin/orders'), api('GET', '/api/admin/subscribers')]);
    $('#panel').innerHTML = `<h2>Orders &amp; Mailing list</h2><div class="card"><table><thead><tr><th>Order</th><th>When</th><th>Status</th><th>Ship to</th><th>Items</th><th>Total</th></tr></thead><tbody>
      ${o.map(x => `<tr><td>${esc(x.id)}<br><span class="badge">${esc(x.mode)}</span></td><td>${new Date(x.createdAt).toLocaleString()}</td><td>${esc(x.status)}</td><td>${esc(x.region)}, ${esc(x.country)}</td><td>${x.items.map(i => `${i.qty}× ${esc(i.design)} — ${esc(i.style)} ${esc(i.color)} ${i.size}`).join('<br>')}</td><td>${fmt(x.total, x.currency)}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">No orders yet.</td></tr>'}</tbody></table></div>
      <div class="card"><p class="fine">${subs.length} newsletter sign-ups</p>${subs.map(s => esc(s.email)).join(', ')}</div>`;
  }

  fetch('/api/admin/me').then(r => r.ok ? r.json().then(start) : showLogin());
})();
