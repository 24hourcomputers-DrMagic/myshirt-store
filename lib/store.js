// Tiny JSON file store (data/site.json). Atomic writes; deep-cloned defaults on first run.
const fs = require('fs'), path = require('path');
const D = require('./defaults');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'site.json');
const clone = o => JSON.parse(JSON.stringify(o));
function seedGallery() {
  const gen = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'designs.generated.json'), 'utf8'));
  const featured = new Set(['waves-teal','mountains-mist','orca-teal','cedars-forest','lighthouse-dusk','sunset-dusk','tidepool-teal','type-sooke']);
  return gen.map((d, i) => ({ ...d, source:'generated', featured: featured.has(d.id), hidden:false, order:i }));
}
function fresh() { return { theme: clone(D.theme), sections: clone(D.sections), products: clone(D.products), shipping: clone(D.shipping), content: clone(D.content), gallery: seedGallery(), orders: [], subscribers: [] }; }
let state;
function load() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(FILE)) { try { state = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { console.error('site.json unreadable, reseeding', e.message); state = fresh(); } }
  else state = fresh();
  const f = fresh(); for (const k of Object.keys(f)) if (state[k] === undefined) state[k] = f[k];
  save(); return state;
}
function save() { const tmp = FILE + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(state, null, 2)); fs.renameSync(tmp, FILE); }
function get() { return state || load(); }
function reset(key) { const f = fresh(); state[key] = f[key]; save(); return state[key]; }
module.exports = { load, save, get, reset, DATA_DIR };
