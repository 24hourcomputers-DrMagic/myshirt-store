#!/usr/bin/env python3
"""Featured-artwork image tools (Pillow + numpy).

  extract-mockup SRC OUT --box x0,y0,x1,y1   Pull a light-ink chest print off a photo mockup of a coloured tee
                                             (alpha from the red channel vs. the local shirt colour). Approximation
                                             of the original art, not a substitute for the source file.
  remove-bg SRC OUT [--tol 18]               Flat/near-flat background (sampled from the corners) -> transparent.
  dark-ink SRC OUT [--ink #0e5e63]           Recolour a light-ink print to a dark ink for white/pastel shirts.
  trim SRC OUT [--pad 24]                    Crop to visible pixels.
  info SRC [--width-in 10]                   Size / effective DPI at a given print width.
"""
import sys, argparse
import numpy as np
from PIL import Image, ImageFilter

def load(p): return Image.open(p)

def extract_mockup(src, out, box):
    im = load(src).convert('RGB'); x0, y0, x1, y1 = box
    a = np.asarray(im).astype(float)
    R = a[..., 0]
    # local shirt red-channel estimate: blur of pixels that look like bare shirt (R < 45)
    shirt = (R < 45).astype(float)
    Rb = Image.fromarray(np.clip(R * shirt, 0, 255).astype('uint8')).filter(ImageFilter.GaussianBlur(25))
    Wb = Image.fromarray((shirt * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(25))
    rbg = np.asarray(Rb).astype(float) / np.maximum(np.asarray(Wb).astype(float) / 255, 1e-3)
    rbg = np.clip(rbg, 0, 60)
    alpha = np.clip((R - rbg - 6) / (245 - rbg), 0, 1)
    alpha = np.where(alpha < 0.05, 0, alpha)
    # ink colour: unmix against local shirt colour, fall back to soft white
    bg = np.asarray(im.filter(ImageFilter.GaussianBlur(30))).astype(float)
    safe = np.maximum(alpha, 0.15)[..., None]
    ink = np.clip((a - (1 - safe) * bg) / safe, 0, 255)
    ink = 0.55 * ink + 0.45 * np.array([240, 246, 245])
    rgba = np.dstack([ink, alpha * 255]).astype('uint8')[y0:y1, x0:x1]
    img = Image.fromarray(rgba, 'RGBA')
    img = trim_img(img, 8); img.save(out); print('wrote', out, img.size)

def remove_bg(src, out, tol=18):
    im = load(src).convert('RGBA'); a = np.asarray(im).astype(float)
    h, w = a.shape[:2]; k = max(4, min(h, w) // 50)
    corners = np.concatenate([a[:k, :k, :3].reshape(-1, 3), a[:k, -k:, :3].reshape(-1, 3), a[-k:, :k, :3].reshape(-1, 3), a[-k:, -k:, :3].reshape(-1, 3)])
    bgc = np.median(corners, axis=0)
    d = np.sqrt(((a[..., :3] - bgc) ** 2).sum(-1))
    alpha = np.clip((d - tol) / (tol * 1.5), 0, 1)              # soft edge between tol and 2.5*tol
    # un-premultiply the background out of semi-transparent edge pixels
    safe = np.maximum(alpha, 0.2)[..., None]
    rgb = np.clip((a[..., :3] - (1 - safe) * bgc) / safe, 0, 255)
    rgba = np.dstack([rgb, np.minimum(alpha * 255, a[..., 3])]).astype('uint8')
    img = trim_img(Image.fromarray(rgba, 'RGBA'), 16); img.save(out); print('wrote', out, img.size, 'bg', bgc.round())

def dark_ink(src, out, ink='#0e5e63'):
    im = load(src).convert('RGBA'); a = np.asarray(im).astype(float)
    c = np.array([int(ink[i:i + 2], 16) for i in (1, 3, 5)], float)
    lum = (a[..., :3] @ np.array([.299, .587, .114])) / 255
    # light ink -> dark ink; keep relative tone (lighter source = full ink, darker source = lighter tint)
    t = np.clip(lum, 0, 1)[..., None]
    rgb = c * t + (c + (255 - c) * 0.45) * (1 - t)
    img = Image.fromarray(np.dstack([rgb, a[..., 3]]).astype('uint8'), 'RGBA'); img.save(out); print('wrote', out)

def trim_img(img, pad=24):
    bb = img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    if not bb: return img
    x0, y0, x1, y1 = bb
    return img.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))

def info(src, width_in=10.0):
    im = load(src); print(src, im.size, im.mode, f'{im.width / width_in:.0f} dpi at {width_in}in wide')

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('cmd'); ap.add_argument('src'); ap.add_argument('out', nargs='?')
    ap.add_argument('--box'); ap.add_argument('--tol', type=float, default=18); ap.add_argument('--ink', default='#0e5e63'); ap.add_argument('--pad', type=int, default=24); ap.add_argument('--width-in', type=float, default=10)
    a = ap.parse_args()
    if a.cmd == 'extract-mockup': extract_mockup(a.src, a.out, [int(v) for v in a.box.split(',')])
    elif a.cmd == 'remove-bg': remove_bg(a.src, a.out, a.tol)
    elif a.cmd == 'dark-ink': dark_ink(a.src, a.out, a.ink)
    elif a.cmd == 'trim': trim_img(load(a.src).convert('RGBA'), a.pad).save(a.out)
    elif a.cmd == 'info': info(a.src, a.width_in)
    else: sys.exit(__doc__)
