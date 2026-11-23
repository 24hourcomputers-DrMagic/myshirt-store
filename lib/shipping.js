const { zoneFor } = require('./regions');
const round2 = n => Math.round(n * 100) / 100;
function quote(cfg, country, region, itemCount, subtotal) {
  const zoneId = zoneFor(country, region);
  if (!zoneId) return { ok:false, error:'We ship to Canada, the United States and Mexico only.' };
  const z = cfg.zones[zoneId]; if (!z) return { ok:false, error:'No rate configured for that region.' };
  const n = Math.max(1, itemCount | 0);
  const threshold = Number(cfg.freeThreshold?.[country] ?? Infinity);
  const raw = round2(Number(z.base) + Number(z.perItem) * (n - 1));
  const free = subtotal >= threshold;
  return { ok:true, zone:zoneId, label:z.label, days:z.days, amount: free ? 0 : raw, standard: raw, free, threshold, currency: cfg.currency || 'CAD', remainingForFree: free ? 0 : round2(Math.max(0, threshold - subtotal)) };
}
module.exports = { quote };
