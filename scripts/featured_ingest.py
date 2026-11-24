#!/usr/bin/env python3
"""Turn owner images into live Featured artwork listings (committed seed data).

Usage:  python3 scripts/featured_ingest.py [--id LISTING_ID] [--inbox DIR] [--tol 18]
Looks for <listing-id>.(png|jpg|jpeg|webp) in the inbox (default /workspace/myshirt-art/featured-inbox)
or seed/featured-src/, for every listing in data/featured.seed.json whose status is "awaiting-file".
  mode remove-bg : flat background -> transparent PNG print file
  mode photo     : photographic print kept as a rounded-corner panel
Then sets prints.original + status "live" + a printNote with the effective DPI at 10 in wide.
Review the result, re-check the provisional colours, then commit + push + deploy.
"""
import argparse, json, shutil, glob, os, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(__file__))
from featured_tools import remove_bg
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED = os.path.join(ROOT, 'data', 'featured.seed.json')
ap = argparse.ArgumentParser(); ap.add_argument('--id'); ap.add_argument('--inbox', default='/workspace/myshirt-art/featured-inbox'); ap.add_argument('--tol', type=float, default=18)
a = ap.parse_args(); seed = json.load(open(SEED)); done = 0
for l in seed['listings']:
    if (a.id and l['id'] != a.id) or (not a.id and l.get('status') != 'awaiting-file'): continue
    src = next(iter(sorted(glob.glob(os.path.join(a.inbox, l['id'] + '.*')) + glob.glob(os.path.join(ROOT, 'seed', 'featured-src', l['id'] + '.*')))), None)
    if not src: print(f"- {l['id']}: no file yet ({a.inbox}/{l['id']}.png|jpg)"); continue
    keep = os.path.join(ROOT, 'seed', 'featured-src', l['id'] + os.path.splitext(src)[1].lower())
    if os.path.abspath(src) != os.path.abspath(keep): shutil.copy(src, keep)
    out = os.path.join(ROOT, 'public', 'featured', l['id'] + '-print.png'); mode = (l.get('ingest') or {}).get('mode', 'remove-bg')
    if mode == 'photo':
        im = Image.open(keep).convert('RGBA'); im.thumbnail((2400, 2400))
        m = Image.new('L', im.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=max(12, im.width // 18), fill=255); im.putalpha(m); im.save(out)
    else:
        remove_bg(keep, out, a.tol)
    full = os.path.join(ROOT, 'public', 'featured', 'print', os.path.basename(out)); os.makedirs(os.path.dirname(full), exist_ok=True)
    shutil.move(out, full); web = Image.open(full); web.thumbnail((900, 900)); web.save(out, optimize=True)   # site preview copy
    l['printFiles'] = {'original': '/featured/print/' + os.path.basename(out)}
    w = Image.open(full).width; dpi = w / 10
    l['prints'] = {'original': '/featured/' + os.path.basename(out)}; l['status'] = 'live'; l.setdefault('ingest', {})['done'] = True
    l['printNote'] = f"Print file {w}px wide ≈ {dpi:.0f} dpi at 10 in ({'good' if dpi >= 150 else 'low — ask for a larger original before production'}). Mode: {mode}."
    print(f"+ {l['id']}: {mode} -> {out} ({dpi:.0f} dpi @10in)"); done += 1
json.dump(seed, open(SEED, 'w'), indent=2, ensure_ascii=False); print('updated', done, 'listing(s)')
