// Myshirt — West Coast t-shirt store. Express + JSON store + Stripe Checkout (test mode).
const fs = require('fs'), path = require('path'), crypto = require('crypto');
// minimal .env.local loader (never logs values)
for (const f of ['.env.local', '.env']) { const p = path.join(__dirname, f); if (fs.existsSync(p)) for (const line of fs.readFileSync(p, 'utf8').split('\n')) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, ''); } }
const express = require('express');
const multer = require('multer');
const store = require('./lib/store');
const { COUNTRIES } = require('./lib/regions');
const { quote } = require('./lib/shipping');
const D = require('./lib/defaults');

const PORT = process.env.PORT || 4317;
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim() || 'sooke-tides';
const SK = process.env.STRIPE_SECRET_KEY || '';
const PK = process.env.STRIPE_PUBLISHABLE_KEY || '';
const stripeMode = SK.startsWith('sk_test_') || SK.startsWith('rk_test_') ? 'test' : SK ? 'refused-live' : 'off';
const stripe = stripeMode === 'test' ? require('stripe')(SK) : null;
if (stripeMode === 'refused-live') console.warn('[stripe] A non-test key was provided; checkout stays in demo mode (test keys only).');
console.log(`[stripe] mode: ${stripeMode}`);

store.load();
const UPLOAD_DIR = path.join(store.DATA_DIR, 'uploads'); fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({ storage: multer.diskStorage({ destination: UPLOAD_DIR, filename: (req, file, cb) => cb(null, Date.now().toString(36) + '-' + crypto.randomBytes(3).toString('hex') + (path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '') || '.png')) }),
  limits: { fileSize: 8 * 1024 * 1024 }, fileFilter: (req, file, cb) => cb(null, /^image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(file.mimetype)) });

const app = express();
app.disable('x-powered-by');
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(400).send('webhook not configured');
  let ev; try { ev = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET); } catch (e) { return res.status(400).send('bad signature'); }
  if (ev.type === 'checkout.session.completed') markPaid(ev.data.object);
  if (ev.type === 'payment_intent.succeeded') { const o = S().orders.find(x => x.paymentIntentId === ev.data.object.id); if (o) { o.status = 'paid'; store.save(); } }
  res.json({ received: true });
});
app.use(express.json({ limit: '1mb' }));
// CORS for public JSON API so the mobile app / other clients can reuse it (admin routes stay cookie + same-origin).
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '*').split(',').map(s => s.trim());
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/admin')) return next();
  const o = req.headers.origin; res.setHeader('Access-Control-Allow-Origin', CORS_ORIGINS.includes('*') ? '*' : (CORS_ORIGINS.includes(o) ? o : CORS_ORIGINS[0]));
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204); next();
});
app.use('/uploads', (req, res, next) => { res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:"); res.setHeader('X-Content-Type-Options', 'nosniff'); next(); }, express.static(UPLOAD_DIR, { maxAge: '1h' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

const S = () => store.get();
const siteUrl = req => process.env.PUBLIC_URL || `${req.headers['x-forwarded-proto'] || req.protocol}://${req.get('host')}`;
const money = n => Math.round(Number(n) * 100);

// ---------- public API ----------
app.get('/api/health', (req, res) => res.json({ ok: true, stripe: stripeMode, designs: S().gallery.length }));
app.get('/api/config', (req, res) => {
  const s = S();
  res.json({ theme: s.theme, fontPairs: D.fontPairs, sections: s.sections, content: s.content, products: s.products,
    shipping: { currency: s.shipping.currency, freeThreshold: s.shipping.freeThreshold, zones: s.shipping.zones }, countries: COUNTRIES,
    stripe: { mode: stripeMode, publishableKey: stripeMode === 'test' && PK.startsWith('pk_test_') ? PK : null } });
});
app.get('/api/designs', (req, res) => {
  let g = S().gallery.filter(d => !d.hidden).sort((a, b) => a.order - b.order);
  if (req.query.category) g = g.filter(d => d.category === req.query.category);
  if (req.query.featured) g = g.filter(d => d.featured);
  res.json(g);
});
app.get('/api/products', (req, res) => res.json(S().products));
app.get('/api/countries', (req, res) => res.json(COUNTRIES));
app.post('/api/shipping/quote', (req, res) => {
  const { country, region, itemCount = 1, subtotal = 0 } = req.body || {};
  const q = quote(S().shipping, country, region, itemCount, Number(subtotal) || 0);
  res.status(q.ok ? 200 : 400).json(q);
});
app.post('/api/newsletter', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email.' });
  const s = S(); if (!s.subscribers.find(x => x.email === email)) { s.subscribers.push({ email, at: new Date().toISOString() }); store.save(); }
  res.json({ ok: true });
});

function priceCart(items) {
  const s = S(); const out = [];
  if (!Array.isArray(items) || !items.length) throw new Error('Your bag is empty.');
  for (const it of items.slice(0, 50)) {
    const p = s.products.find(x => x.id === it.productId); if (!p || !p.inStock) throw new Error('A style in your bag is unavailable.');
    const d = s.gallery.find(x => x.id === it.designId && !x.hidden); if (!d) throw new Error('A design in your bag is unavailable.');
    if (!p.sizes.includes(it.size)) throw new Error(`Size ${it.size} isn't available in ${p.name}.`);
    const c = p.colors.find(x => x.name === it.color); if (!c) throw new Error(`Colour ${it.color} isn't available in ${p.name}.`);
    const qty = Math.min(20, Math.max(1, parseInt(it.qty, 10) || 1));
    out.push({ product: p, design: d, color: c.name, size: it.size, qty, unit: Number(p.price) });
  }
  return out;
}
function buildOrder(body, channel) {
    const { items, country, region, email } = body || {};
    const lines = priceCart(items);
    const subtotal = lines.reduce((a, l) => a + l.unit * l.qty, 0);
    const count = lines.reduce((a, l) => a + l.qty, 0);
    const ship = quote(S().shipping, country, region, count, subtotal);
    if (!ship.ok) throw new Error(ship.error);
    const order = { channel, id: 'MS-' + Date.now().toString(36).toUpperCase(), createdAt: new Date().toISOString(), status: 'pending', mode: stripe ? 'stripe-test' : 'demo',
      country, region, email: email || null, items: lines.map(l => ({ style: l.product.name, design: l.design.title, designId: l.design.id, color: l.color, size: l.size, qty: l.qty, unit: l.unit })),
      subtotal, shipping: ship.amount, total: subtotal + ship.amount, currency: ship.currency };
    return { order, lines, ship };
}
app.post('/api/checkout/quote', (req, res) => { try { const { order } = buildOrder(req.body, 'quote'); res.json({ items: order.items, subtotal: order.subtotal, shipping: order.shipping, total: order.total, currency: order.currency }); } catch (e) { res.status(400).json({ error: e.message }); } });
// Mobile: PaymentIntent for Stripe React Native PaymentSheet (test mode). Same pricing/shipping logic + same webhook.
app.post('/api/checkout/payment-intent', async (req, res) => {
  try {
    const { order } = buildOrder(req.body, req.body?.channel || 'app');
    if (!stripe) return res.status(503).json({ error: 'Stripe test key not configured on the server.', mode: 'demo' });
    const pi = await stripe.paymentIntents.create({ amount: money(order.total), currency: order.currency.toLowerCase(), automatic_payment_methods: { enabled: true }, receipt_email: order.email || undefined, metadata: { orderId: order.id } });
    order.paymentIntentId = pi.id; S().orders.push(order); store.save();
    res.json({ orderId: order.id, clientSecret: pi.client_secret, publishableKey: PK.startsWith('pk_test_') ? PK : null, total: order.total, currency: order.currency });
  } catch (e) { console.error('[payment-intent]', e.message); res.status(400).json({ error: e.message }); }
});
app.post('/api/checkout', async (req, res) => {
  try {
    const { order, lines, ship } = buildOrder(req.body, req.body?.channel || 'web');
    const base = (req.body?.returnBaseUrl && /^(https?|myshirt):\/\//.test(req.body.returnBaseUrl)) ? req.body.returnBaseUrl.replace(/\/$/, '') : siteUrl(req);
    if (!stripe) { // graceful demo flow
      order.status = 'demo-paid'; S().orders.push(order); store.save();
      return res.json({ mode: 'demo', url: `${base}/success?order=${order.id}&demo=1`, notice: 'Stripe test key not configured — demo checkout (no card charged).' });
    }
    const cur = (ship.currency || 'CAD').toLowerCase();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', customer_email: order.email || undefined,
      line_items: lines.map(l => ({ quantity: l.qty, price_data: { currency: cur, unit_amount: money(l.unit), product_data: { name: `${l.product.name} — ${l.design.title}`, description: `${l.color} · Size ${l.size}`, metadata: { productId: l.product.id, designId: l.design.id } } } })),
      shipping_address_collection: { allowed_countries: ['CA', 'US', 'MX'] },
      shipping_options: [{ shipping_rate_data: { type: 'fixed_amount', display_name: ship.free ? `Free shipping — ${ship.label}` : `Standard — ${ship.label}`, fixed_amount: { amount: money(ship.amount), currency: cur },
        delivery_estimate: { minimum: { unit: 'business_day', value: parseInt(ship.days) || 3 }, maximum: { unit: 'business_day', value: parseInt(String(ship.days).split(/[–-]/)[1]) || 10 } } } }],
      metadata: { orderId: order.id, shipZone: ship.zone, region: `${order.country}-${order.region}` },
      success_url: `${base}/success?order=${order.id}&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${base}/?checkout=cancelled#bag`,
    });
    order.sessionId = session.id; S().orders.push(order); store.save();
    res.json({ mode: 'stripe-test', url: session.url });
  } catch (e) { console.error('[checkout]', e.message); res.status(400).json({ error: e.message || 'Checkout failed.' }); }
});
function markPaid(session) { const o = S().orders.find(x => x.sessionId === session.id); if (o && o.status !== 'paid') { o.status = session.payment_status === 'paid' ? 'paid' : session.payment_status; o.email = session.customer_details?.email || o.email; o.shipTo = session.shipping_details || session.collected_information?.shipping_details || null; store.save(); } return o; }
app.get('/api/orders/:id', async (req, res) => {
  const o = S().orders.find(x => x.id === req.params.id); if (!o) return res.status(404).json({ error: 'Order not found' });
  if (stripe && o.sessionId && o.status === 'pending') { try { markPaid(await stripe.checkout.sessions.retrieve(o.sessionId)); } catch (e) { console.error('[order lookup]', e.message); } }
  if (stripe && o.paymentIntentId && o.status === 'pending') { try { const pi = await stripe.paymentIntents.retrieve(o.paymentIntentId); if (pi.status === 'succeeded') { o.status = 'paid'; store.save(); } } catch (e) { console.error('[order lookup]', e.message); } }
  const { email, shipTo, ...pub } = o; res.json(pub);
});

// ---------- admin ----------
const sessions = new Map(); // token -> expiry
const cookieToken = req => (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('ms_admin='))?.slice(9);
function requireAdmin(req, res, next) { const t = cookieToken(req); const exp = t && sessions.get(t); if (exp && exp > Date.now()) return next(); res.status(401).json({ error: 'Not signed in' }); }
const safeEq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
app.post('/api/admin/login', (req, res) => {
  if (!safeEq(req.body?.password || '', ADMIN_PASSWORD)) return setTimeout(() => res.status(401).json({ error: 'Wrong password' }), 400);
  const t = crypto.randomBytes(24).toString('hex'); sessions.set(t, Date.now() + 12 * 3600e3);
  res.setHeader('Set-Cookie', `ms_admin=${t}; HttpOnly; Path=/; SameSite=Lax; Max-Age=43200${req.secure || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`);
  res.json({ ok: true, defaultPassword: ADMIN_PASSWORD === 'sooke-tides' });
});
app.post('/api/admin/logout', (req, res) => { sessions.delete(cookieToken(req)); res.setHeader('Set-Cookie', 'ms_admin=; Path=/; Max-Age=0'); res.json({ ok: true }); });
app.get('/api/admin/me', requireAdmin, (req, res) => res.json({ ok: true, defaultPassword: ADMIN_PASSWORD === 'sooke-tides', stripe: stripeMode }));
const A = express.Router(); A.use(requireAdmin); app.use('/api/admin', A);

const isHex = v => /^#[0-9a-fA-F]{6}$/.test(v);
A.put('/theme', (req, res) => {
  const b = req.body || {}, t = S().theme;
  for (const k of ['bg', 'surface', 'text', 'silver', 'accent', 'accent2']) if (b[k] !== undefined) { if (!isHex(b[k])) return res.status(400).json({ error: `${k} must be a hex colour` }); t[k] = b[k]; }
  if (b.fontPair !== undefined) { if (!D.fontPairs[b.fontPair]) return res.status(400).json({ error: 'Unknown font pair' }); t.fontPair = b.fontPair; }
  if (b.radius !== undefined) t.radius = Math.max(0, Math.min(999, Number(b.radius) || 0));
  if (b.fog !== undefined) t.fog = !!b.fog;
  store.save(); res.json(t);
});
const SECTION_TYPES = new Set(D.sections.map(s => s.type));
A.put('/sections', (req, res) => {
  const arr = req.body; if (!Array.isArray(arr) || arr.some(s => !s || !SECTION_TYPES.has(s.type))) return res.status(400).json({ error: 'Invalid sections' });
  S().sections = arr.map(s => ({ ...s, id: String(s.id || s.type), visible: s.visible !== false })); store.save(); res.json(S().sections);
});
A.put('/products', (req, res) => {
  const arr = req.body; if (!Array.isArray(arr)) return res.status(400).json({ error: 'Expected a list of styles' });
  for (const p of arr) { if (!p.id || !p.name || !(Number(p.price) > 0) || !Array.isArray(p.sizes) || !p.sizes.length || !Array.isArray(p.colors) || !p.colors.length || p.colors.some(c => !c.name || !isHex(c.hex))) return res.status(400).json({ error: `Check "${p.name || p.id || 'style'}": needs id, name, price > 0, at least one size and colour.` }); }
  S().products = arr.map(p => ({ id: String(p.id).toLowerCase().replace(/[^a-z0-9-]+/g, '-'), name: String(p.name), description: String(p.description || ''), price: Math.round(Number(p.price) * 100) / 100, silhouette: ['crew', 'vneck', 'longsleeve', 'womens'].includes(p.silhouette) ? p.silhouette : 'crew', inStock: p.inStock !== false, sizes: p.sizes.map(String), colors: p.colors.map(c => ({ name: String(c.name), hex: c.hex })) }));
  store.save(); res.json(S().products);
});
A.put('/shipping', (req, res) => {
  const b = req.body || {}, s = S().shipping;
  if (b.freeThreshold) for (const c of ['CA', 'US', 'MX']) if (b.freeThreshold[c] !== undefined) s.freeThreshold[c] = Math.max(0, Number(b.freeThreshold[c]) || 0);
  if (b.zones) for (const [k, z] of Object.entries(b.zones)) if (s.zones[k]) { if (z.base !== undefined) s.zones[k].base = Math.max(0, Number(z.base) || 0); if (z.perItem !== undefined) s.zones[k].perItem = Math.max(0, Number(z.perItem) || 0); if (z.days !== undefined) s.zones[k].days = String(z.days); if (z.label !== undefined) s.zones[k].label = String(z.label); }
  store.save(); res.json(s);
});
A.put('/content', (req, res) => {
  const b = req.body || {}, c = S().content;
  for (const k of ['siteName', 'tagline', 'logo']) if (b[k] !== undefined) c[k] = String(b[k]);
  if (b.announcement) c.announcement = { enabled: !!b.announcement.enabled, text: String(b.announcement.text || '') };
  if (b.pages) for (const k of ['about', 'faq', 'policy']) if (b.pages[k]) c.pages[k] = { title: String(b.pages[k].title || ''), body: String(b.pages[k].body || '') };
  store.save(); res.json(c);
});
A.post('/reset/:key', (req, res) => { if (!['theme', 'sections', 'products', 'shipping', 'content'].includes(req.params.key)) return res.status(400).json({ error: 'Unknown section' }); res.json(store.reset(req.params.key)); });
A.post('/upload', upload.single('file'), (req, res) => { if (!req.file) return res.status(400).json({ error: 'Upload a PNG, JPG, WebP, GIF or SVG under 8 MB.' }); res.json({ url: '/uploads/' + req.file.filename }); });
// gallery
A.get('/gallery', (req, res) => res.json(S().gallery.slice().sort((a, b) => a.order - b.order)));
A.post('/gallery', upload.array('files', 20), (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'No images received.' });
  const g = S().gallery, min = Math.min(0, ...g.map(d => d.order));
  const added = req.files.map((f, i) => ({ id: 'up-' + path.parse(f.filename).name, title: (req.body.title || path.parse(f.originalname).name).slice(0, 80), category: req.body.category || 'Owner uploads', tags: String(req.body.tags || '').split(',').map(s => s.trim()).filter(Boolean), file: '/uploads/' + f.filename, source: 'upload', featured: false, hidden: false, order: min - req.files.length + i }));
  g.push(...added); store.save(); res.json(added);
});
A.put('/gallery/:id', (req, res) => {
  const d = S().gallery.find(x => x.id === req.params.id); if (!d) return res.status(404).json({ error: 'Not found' });
  const b = req.body || {}; if (b.title !== undefined) d.title = String(b.title); if (b.category !== undefined) d.category = String(b.category);
  if (b.tags !== undefined) d.tags = (Array.isArray(b.tags) ? b.tags : String(b.tags).split(',')).map(s => String(s).trim()).filter(Boolean);
  if (b.featured !== undefined) d.featured = !!b.featured; if (b.hidden !== undefined) d.hidden = !!b.hidden;
  store.save(); res.json(d);
});
A.post('/gallery/:id/replace', upload.single('file'), (req, res) => {
  const d = S().gallery.find(x => x.id === req.params.id); if (!d) return res.status(404).json({ error: 'Not found' });
  if (!req.file) return res.status(400).json({ error: 'No image received.' });
  if (d.source === 'upload') { const old = path.join(UPLOAD_DIR, path.basename(d.file)); fs.rm(old, () => {}); }
  d.file = '/uploads/' + req.file.filename; d.source = 'upload'; store.save(); res.json(d);
});
A.delete('/gallery/:id', (req, res) => {
  const g = S().gallery, i = g.findIndex(x => x.id === req.params.id); if (i < 0) return res.status(404).json({ error: 'Not found' });
  const [d] = g.splice(i, 1); if (d.source === 'upload') fs.rm(path.join(UPLOAD_DIR, path.basename(d.file)), () => {});
  store.save(); res.json({ ok: true });
});
A.put('/gallery-order', (req, res) => { const ids = req.body?.ids; if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids required' }); const pos = new Map(ids.map((id, i) => [id, i])); S().gallery.forEach(d => { d.order = pos.has(d.id) ? pos.get(d.id) : 10000 + d.order; }); store.save(); res.json({ ok: true }); });
A.get('/orders', (req, res) => res.json(S().orders.slice().reverse()));
A.get('/subscribers', (req, res) => res.json(S().subscribers));

app.get(['/page/:slug'], (req, res) => res.sendFile(path.join(__dirname, 'public', 'page.html')));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.listen(PORT, () => console.log(`Myshirt running on http://localhost:${PORT}  (admin: /admin)`));
