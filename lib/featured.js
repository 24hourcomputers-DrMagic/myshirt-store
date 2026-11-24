// Featured artwork listings: committed seed (data/featured.seed.json) + runtime additions saved by the admin.
const fs = require('fs'), path = require('path');
const SEED_FILE = path.join(__dirname, '..', 'data', 'featured.seed.json');
let seed = null;
function loadSeed() { seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8')); return seed; }
function getSeed() { return seed || loadSeed(); }
function ensureState(s) { s.featuredExtra ||= []; s.featuredHidden ||= []; s.featuredFiles ||= {}; if (s.featuredPromo === undefined) s.featuredPromo = null; }
function resolve(l, s, source) {
  const sd = getSeed(), files = s.featuredFiles[l.id];
  const prints = { ...(l.prints || {}), ...(files?.prints || {}) };
  const status = files?.prints ? 'live' : l.status;
  const colors = {};
  for (const g of Object.keys(sd.garments)) colors[g] = (l.colors?.[g] || []).map(c => {
    const p = sd.palette[g]?.[c.name] || { hex: c.hex || '#ffffff', ink: 'dark' };
    const print = l.inkMode === 'auto' ? (prints[p.ink] || prints.light || prints.original) : (prints.original || prints.light || prints.dark);
    return { name: c.name, hex: p.hex, ink: p.ink, why: c.why || '', print: print || null, photo: l.photos?.[`${g}|${c.name}`] || null };
  }).filter(c => c.hex);
  return { id: l.id, title: l.title, description: l.description || '', status, source, inkMode: l.inkMode || 'original', prints, printNote: l.printNote || files?.note || '', ingest: l.ingest || null,
    hidden: s.featuredHidden.includes(l.id), colors, cover: Object.values(l.photos || {})[0] || null };
}
function all(s) { ensureState(s); return [...getSeed().listings.map(l => resolve(l, s, 'seed')), ...s.featuredExtra.map(l => resolve(l, s, 'admin'))]; }
function live(s) { return all(s).filter(l => l.status === 'live' && !l.hidden && Object.values(l.colors).some(cs => cs.some(c => c.print))); }
function promo(s) { ensureState(s); return s.featuredPromo || getSeed().promo; }
function publicData(s) { const sd = getSeed(); return { promo: promo(s), garments: sd.garments, palette: sd.palette, listings: live(s) }; }
function priceItem(s, it) {
  const sd = getSeed(), g = sd.garments[it.garment]; if (!g) throw new Error('Unknown garment type.');
  const l = live(s).find(x => x.id === it.listingId); if (!l) throw new Error('A featured design in your bag is unavailable.');
  const c = l.colors[it.garment]?.find(x => x.name === it.color && x.print); if (!c) throw new Error(`${it.color} isn't offered for ${l.title} (${g.label}).`);
  if (!g.sizes.includes(it.size)) throw new Error(`Size ${it.size} isn't available.`);
  return { listing: l, garment: g, color: c, unit: g.price, compareAt: g.compareAt };
}
module.exports = { loadSeed, getSeed, ensureState, all, live, promo, publicData, priceItem, SEED_FILE };
