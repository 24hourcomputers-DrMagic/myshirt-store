// Shirt mockup renderer: silhouette per style, fabric shading, design placed on chest print area.
window.Shirt = (() => {
  const BODY = {
    crew: 'M150 40 Q250 92 350 40 L470 108 L432 210 L382 186 L384 528 Q250 548 116 528 L118 186 L68 210 L30 108 Z',
    vneck: 'M150 40 Q250 92 350 40 L470 108 L432 210 L382 186 L384 528 Q250 548 116 528 L118 186 L68 210 L30 108 Z',
    longsleeve: 'M150 40 Q250 92 350 40 L438 92 L496 404 L446 416 L384 196 L384 528 Q250 548 116 528 L116 196 L54 416 L4 404 L62 92 Z',
    hoodie: 'M140 70 Q250 100 360 70 L440 104 L496 410 L446 422 L388 206 L392 540 Q250 552 108 540 L112 206 L54 422 L4 410 L60 104 Z',
    womens: 'M160 44 Q250 96 340 44 L452 106 L418 196 L372 176 Q352 300 384 522 Q250 544 116 522 Q148 300 128 176 L82 196 L48 106 Z',
  };
  const COLLAR = { crew: 'M150 40 Q250 92 350 40 Q345 62 330 70 Q250 110 170 70 Q155 62 150 40 Z', vneck: 'M150 40 Q200 70 250 150 Q300 70 350 40 Q340 58 330 66 L250 168 L170 66 Q160 58 150 40 Z',
    longsleeve: 'M150 40 Q250 92 350 40 Q345 62 330 70 Q250 110 170 70 Q155 62 150 40 Z', hoodie: 'M180 70 Q250 150 320 70 Q300 82 250 118 Q200 82 180 70 Z', womens: 'M160 44 Q250 120 340 44 Q336 62 324 70 Q250 132 176 70 Q164 62 160 44 Z' };
  const lum = hex => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; };
  const HOOD = 'M138 74 Q140 4 250 0 Q360 4 362 74 Q320 104 250 108 Q180 104 138 74 Z';
  function svg({ silhouette = 'crew', color = '#111214', design = null, id = 'm' }) {
    const s = BODY[silhouette] ? silhouette : 'crew', light = lum(color) > 0.6;
    return `<svg viewBox="0 0 500 560" class="shirt-svg" role="img" aria-label="T-shirt mockup">
      <defs><linearGradient id="${id}-shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset=".22" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
        <linearGradient id="${id}-v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
        <clipPath id="${id}-clip"><path d="${BODY[s]}"/></clipPath><filter id="${id}-ds" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-opacity=".45"/></filter></defs>
 ${s === 'hoodie' ? `<path d="${HOOD}" fill="${color}"/><path d="${HOOD}" fill="#000" opacity=".22"/>` : ''}
      <g filter="url(#${id}-ds)"><path d="${BODY[s]}" fill="${color}" stroke="${light ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.06)'}" stroke-width="1.5"/></g>
      <g clip-path="url(#${id}-clip)">
         ${design ? `<image href="${design}" x="${s === 'hoodie' ? 165 : 155}" y="${s === 'vneck' ? 172 : s === 'hoodie' ? 160 : 140}" width="${s === 'hoodie' ? 170 : 190}" height="${s === 'hoodie' ? 170 : 190}" preserveAspectRatio="xMidYMid meet" style="mix-blend-mode:${light ? 'multiply' : 'normal'}"/>` : ''}
        <rect width="500" height="560" fill="url(#${id}-shade)"/><rect width="500" height="560" fill="url(#${id}-v)"/>
        <path d="M150 300 Q170 380 160 470 M350 290 Q330 380 345 480 M200 520 Q230 470 260 520" stroke="#000" stroke-opacity=".08" stroke-width="6" fill="none"/>
      </g>
 ${s === 'hoodie' ? `<path d="M170 400 L330 400 L356 486 L144 486 Z" fill="none" stroke="#000" stroke-opacity=".2" stroke-width="3"/><path d="M226 112 L222 206 M274 112 L278 206" stroke="${light ? '#9aa3ad' : '#e9edf2'}" stroke-width="4" stroke-linecap="round"/><rect x="108" y="520" width="284" height="22" fill="#000" opacity=".12"/>` : ''}
      <path d="${COLLAR[s]}" fill="${color}" stroke="#000" stroke-opacity=".25" stroke-width="2"/><path d="${COLLAR[s]}" fill="#000" opacity=".18"/>
    </svg>`;
  }
  return { svg };
})();
