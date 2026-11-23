// Generates 36 original West Coast t-shirt designs as SVG into public/designs + data/designs.json
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '..', 'public', 'designs');
fs.mkdirSync(OUT, { recursive: true });
const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "Inter, 'Helvetica Neue', Arial, sans-serif";
const P = {
  teal:   { a:'#1fb5a8', b:'#0e6f73', c:'#d7dbe2', d:'#0a0a0b', e:'#f2c26b' },
  dusk:   { a:'#f28a5b', b:'#7a4f9e', c:'#ffd9a8', d:'#1c1a2e', e:'#e85d75' },
  mist:   { a:'#9fb3c8', b:'#4d6378', c:'#eef2f6', d:'#1d2733', e:'#7fd1c7' },
  forest: { a:'#3f7d5a', b:'#1f4433', c:'#cfe3c9', d:'#0f1f17', e:'#d9a441' },
  silver: { a:'#d7dbe2', b:'#8a93a3', c:'#ffffff', d:'#0a0a0b', e:'#1fb5a8' },
};
const svg = (body, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">${bg||''}${body}</svg>`;
const txt = (t, y, size, fill, fam = SANS, extra = '') => `<text x="200" y="${y}" text-anchor="middle" font-family="${fam}" font-size="${size}" fill="${fill}" ${extra}>${String(t).replace(/&(?!amp;)/g, '&amp;')}</text>`;
const circleClip = (id, body) => `<defs><clipPath id="${id}"><circle cx="200" cy="185" r="140"/></clipPath></defs><g clip-path="url(#${id})">${body}</g>`;
function wavePath(y, amp, len, w = 400) { let d = `M0 ${y}`; for (let x = 0; x < w; x += len) d += ` q ${len/4} ${-amp} ${len/2} 0 t ${len/2} 0`; return d + ` V400 H0 Z`; }
function mountains(p, base = 260) {
  return `<path d="M-10 ${base} L70 150 L120 210 L190 95 L260 200 L310 140 L410 ${base} Z" fill="${p.b}"/>
  <path d="M190 95 L170 126 L184 122 L196 134 L208 120 L222 128 Z" fill="${p.c}"/>
  <path d="M70 150 L56 172 L70 166 L84 176 Z" fill="${p.c}"/>
  <path d="M-10 ${base} L40 210 L100 245 L160 190 L230 250 L300 205 L410 ${base+10} Z" fill="${p.d}" opacity=".55"/>`;
}
function sun(p, cy = 170, r = 60) { return `<circle cx="200" cy="${cy}" r="${r}" fill="${p.e}"/>` + [0,1,2,3].map(i=>`<rect x="120" y="${cy+8+i*13}" width="160" height="${4+i}" fill="${p.d}" opacity=".9"/>`).join(''); }
function waves(p, y = 250) { return `<path d="${wavePath(y,18,80)}" fill="${p.a}"/><path d="${wavePath(y+28,14,60)}" fill="${p.b}"/><path d="${wavePath(y+56,10,50)}" fill="${p.d}" opacity=".8"/>`; }
function tree(x, y, h, fill) { const w = h*0.42; let s = `<rect x="${x-3}" y="${y-8}" width="6" height="14" fill="${fill}"/>`; for (let i=0;i<5;i++){ const ty = y - 8 - i*h/6; const tw = w*(1-i*0.17); s += `<path d="M${x-tw} ${ty} L${x} ${ty - h/3} L${x+tw} ${ty} Z" fill="${fill}"/>`; } return s; }
function cedars(p, base = 300) { return [[70,90],[120,130],[175,105],[230,150],[290,115],[340,95]].map(([x,h])=>tree(x,base,h,p.b)).join('') + `<rect x="0" y="${base}" width="400" height="100" fill="${p.b}"/>`; }
function orca(p) { return `<g transform="translate(70 120)">
  <path d="M10 120 C40 40 160 20 240 70 C262 84 270 100 262 112 C220 128 130 140 60 130 C40 128 22 126 10 120 Z" fill="${p.d}"/>
  <path d="M120 52 C126 10 138 -6 150 -16 C150 20 148 40 156 58 Z" fill="${p.d}"/>
  <path d="M160 92 C190 86 220 92 240 104 C210 116 180 116 160 108 Z" fill="${p.c}"/>
  <ellipse cx="210" cy="78" rx="14" ry="6" fill="${p.c}"/>
  <path d="M10 120 C-6 100 -14 92 -20 70 C-2 84 6 92 18 104 C10 82 12 70 14 56 C22 80 26 100 24 118 Z" fill="${p.d}"/>
  <path d="M150 118 C140 140 120 150 100 152 C112 140 120 130 124 120 Z" fill="${p.d}"/></g>`; }
function lighthouse(p) { return `<path d="M180 300 L188 140 L212 140 L220 300 Z" fill="${p.c}"/>
  <path d="M182 250 h36 v18 h-36z M185 195 h30 v16 h-30z" fill="${p.e}"/>
  <rect x="184" y="118" width="32" height="24" fill="${p.d}"/><rect x="190" y="122" width="20" height="16" fill="${p.e}"/>
  <path d="M180 118 L200 98 L220 118 Z" fill="${p.e}"/>
  <path d="M210 130 L400 90 L400 160 Z" fill="${p.e}" opacity=".35"/><path d="M190 130 L0 90 L0 160 Z" fill="${p.e}" opacity=".2"/>
  <path d="M120 300 C150 280 250 280 280 300 Z" fill="${p.b}"/>`; }
function starfish(p, cx=200, cy=190, r=80) { let d=''; for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5; const rr = i%2? r*0.42 : r; d += (i?'L':'M') + (cx+rr*Math.cos(a)).toFixed(1)+' '+(cy+rr*Math.sin(a)).toFixed(1);} return `<path d="${d}Z" fill="${p.e}" stroke="${p.d}" stroke-width="4" stroke-linejoin="round"/>` + [0,1,2,3,4].map(i=>{const a=-Math.PI/2+i*2*Math.PI/5;return `<circle cx="${cx+r*0.5*Math.cos(a)}" cy="${cy+r*0.5*Math.sin(a)}" r="5" fill="${p.d}" opacity=".5"/>`}).join(''); }
function anemone(p, cx, cy, r) { let s=''; for(let i=0;i<14;i++){const a=Math.PI+i*Math.PI/13; s+=`<path d="M${cx} ${cy} Q ${cx+r*0.6*Math.cos(a)-8} ${cy+r*0.6*Math.sin(a)} ${cx+r*Math.cos(a)} ${cy+r*Math.sin(a)}" stroke="${p.a}" stroke-width="7" stroke-linecap="round" fill="none"/>`;} return s+`<ellipse cx="${cx}" cy="${cy+6}" rx="${r*0.45}" ry="${r*0.2}" fill="${p.b}"/>`; }
function salmon(p) { return `<g transform="translate(60 150)"><path d="M0 50 C60 0 200 0 260 50 C200 100 60 100 0 50 Z" fill="${p.a}"/><path d="M250 50 L300 15 L290 50 L300 85 Z" fill="${p.a}"/><circle cx="40" cy="44" r="6" fill="${p.d}"/><path d="M70 40 C110 30 170 30 220 46" stroke="${p.c}" stroke-width="4" fill="none" stroke-dasharray="2 10" stroke-linecap="round"/></g>`; }
function kayak(p) { return `<path d="M60 250 C140 270 260 270 340 250 C260 240 140 240 60 250 Z" fill="${p.e}"/><circle cx="200" cy="218" r="12" fill="${p.d}"/><path d="M190 230 L210 230 L206 252 L194 252 Z" fill="${p.d}"/><path d="M120 200 L290 262" stroke="${p.d}" stroke-width="5" stroke-linecap="round"/>`; }
function moon(p) { return `<circle cx="200" cy="150" r="70" fill="${p.c}"/><circle cx="228" cy="132" r="64" fill="${p.d}"/>`; }
function topo(p) { let s=''; for(let i=0;i<9;i++){ const r=20+i*16; s+=`<path d="M${200-r} 190 C${200-r} ${150-r*0.6} ${200+r*0.9} ${140-r*0.7} ${200+r} 185 C${200+r*1.05} ${230+r*0.4} ${200-r*0.7} ${240+r*0.5} ${200-r} 190 Z" fill="none" stroke="${i%3?p.a:p.e}" stroke-width="${i%3?2:3.5}"/>`;} return s; }
function compass(p) { return `<circle cx="200" cy="190" r="110" fill="none" stroke="${p.a}" stroke-width="4"/><circle cx="200" cy="190" r="96" fill="none" stroke="${p.a}" stroke-width="1.5" stroke-dasharray="3 6"/>
  <path d="M200 70 L218 190 L200 310 L182 190 Z" fill="${p.c}"/><path d="M80 190 L200 172 L320 190 L200 208 Z" fill="${p.a}"/><path d="M200 70 L218 190 L200 190 Z" fill="${p.e}"/>${txt('N',62,22,p.c,SERIF,'font-weight="700"')}`; }
function ferry(p) { return `<path d="M90 240 L310 240 L290 270 L110 270 Z" fill="${p.c}"/><rect x="130" y="212" width="140" height="28" fill="${p.c}"/><rect x="160" y="190" width="80" height="22" fill="${p.c}"/><rect x="210" y="170" width="16" height="20" fill="${p.e}"/>${[0,1,2,3,4,5].map(i=>`<rect x="${140+i*21}" y="220" width="12" height="9" fill="${p.b}"/>`).join('')}`; }
function islands(p) { return `<path d="M0 230 C60 200 100 190 150 222 C190 200 240 180 300 215 C340 200 380 205 400 214 V260 H0Z" fill="${p.b}"/>`; }
function fog(p, y, op=.5) { return `<path d="M-20 ${y} C60 ${y-20} 140 ${y+10} 220 ${y-8} C300 ${y-24} 360 ${y} 420 ${y-10} V${y+28} H-20Z" fill="${p.c}" opacity="${op}"/>`; }

const designs = [];
function add(id, title, category, tags, body, pal) { fs.writeFileSync(path.join(OUT, id + '.svg'), svg(body)); designs.push({ id, title, category, tags, palette: pal, file: `/designs/${id}.svg` }); }
const badge = (p, inner, top, bottom, clip) => circleClip(clip, `<rect width="400" height="400" fill="${p.d}"/>${inner}`) + `<circle cx="200" cy="185" r="140" fill="none" stroke="${p.c}" stroke-width="6"/>` + txt(top, 360, 30, p.c, SERIF, 'font-weight="700" letter-spacing="2"') + (bottom ? txt(bottom, 390, 14, p.a, SANS, 'letter-spacing="6" font-weight="600"') : '');

// Scenic badges
Object.entries({teal:'Pacific Swell', dusk:'Golden Hour Swell', mist:'Misty Swell'}).forEach(([k,t],i)=>{const p=P[k];add(`waves-${k}`,t,'Ocean',['waves','ocean','surf'],badge(p, sun(p,150,55)+waves(p,215), 'PACIFIC', 'SOOKE · BC', 'c'+k+'w'), k);});
Object.entries({teal:'Coast Range', forest:'Cedar Peaks', mist:'Misty Peaks', dusk:'Alpenglow'}).forEach(([k,t])=>{const p=P[k];add(`mountains-${k}`,t,'Mountains',['mountains','alpine'],badge(p, `<rect width="400" height="400" fill="${p.d}"/>`+sun(p,130,40)+mountains(p,330)+fog(p,250,.45)+fog(p,290,.35), 'WILD COAST','48°N · 123°W','c'+k+'m'),k);});
['teal','silver','mist'].forEach(k=>{const p=P[k];add(`orca-${k}`,`Orca ${k[0].toUpperCase()+k.slice(1)}`,'Wildlife',['orca','whale','ocean'], `<circle cx="200" cy="190" r="150" fill="${p.a}" opacity=".18"/>`+orca({...p,d:k==='silver'?'#0a0a0b':p.d})+`<path d="${wavePath(285,10,70)}" fill="${p.a}" opacity=".5" transform="translate(0 0) scale(1 .4) translate(0 430)"/>`+txt('SALISH SEA',360,34,p.a,SERIF,'font-weight="700" letter-spacing="3"'),k);});
['forest','mist','teal'].forEach(k=>{const p=P[k];add(`cedars-${k}`,`Cedar Grove ${k}`,'Forest',['cedar','trees','forest'],badge(p,`<rect width="400" height="400" fill="${p.c}" opacity=".15"/>`+fog(p,170,.4)+cedars(p,290)+fog(p,270,.5),'CEDAR & SALT','WEST COAST','c'+k+'c'),k);});
['dusk','teal','silver'].forEach(k=>{const p=P[k];add(`lighthouse-${k}`,`Sheringham Light ${k}`,'Coast',['lighthouse','coast','night'],badge(p,`<rect width="400" height="400" fill="${p.d}"/>`+lighthouse(p)+`<path d="${wavePath(290,10,60)}" fill="${p.a}"/>`,'KEEP THE LIGHT','SHIRLEY · BC','c'+k+'l'),k);});
['dusk','teal','forest'].forEach(k=>{const p=P[k];add(`sunset-${k}`,`Juan de Fuca Sunset ${k}`,'Sunset',['sunset','ocean','retro'],`<defs><linearGradient id="g${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.e}"/><stop offset="1" stop-color="${p.a}"/></linearGradient></defs><circle cx="200" cy="200" r="130" fill="url(#g${k})"/>`+[0,1,2,3,4].map(i=>`<rect x="60" y="${215+i*18}" width="280" height="${5+i*2}" fill="${p.d}"/>`).join('')+islands({...p,b:p.d})+txt('JUAN DE FUCA',375,30,p.a,SERIF,'font-weight="700" letter-spacing="2"'),k);});
['teal','dusk'].forEach(k=>{const p=P[k];add(`tidepool-${k}`,`Tide Pool ${k}`,'Tide Pools',['starfish','anemone','tide pool'],`<circle cx="200" cy="200" r="150" fill="${p.b}" opacity=".25"/>`+anemone(p,110,280,60)+anemone({...p,a:p.e},300,290,50)+starfish(p,200,170,85)+txt("TIDE'S OUT",370,34,p.e,SERIF,'font-weight="700" letter-spacing="2"'),k);});
['teal','forest'].forEach(k=>{const p=P[k];add(`salmon-${k}`,`Run Home ${k}`,'Wildlife',['salmon','river'],salmon(p)+`<path d="${wavePath(270,8,50)}" fill="${p.b}" opacity=".6" transform="scale(1 .5) translate(0 300)"/>`+txt('RUN HOME',110,44,p.a,SERIF,'font-weight="700" letter-spacing="3"')+txt('SOOKE RIVER',310,16,p.c,SANS,'letter-spacing="8" font-weight="600"'),k);});
['mist','teal'].forEach(k=>{const p=P[k];add(`kayak-${k}`,`Paddle Out ${k}`,'Adventure',['kayak','paddle'],badge(p,`<rect width="400" height="400" fill="${p.d}"/>`+mountains({...p,b:p.b},230)+fog(p,215,.5)+`<rect x="0" y="230" width="400" height="170" fill="${p.a}" opacity=".35"/>`+kayak(p),'PADDLE OUT','EAST SOOKE','c'+k+'k'),k);});
['silver','mist'].forEach(k=>{const p=P[k];add(`moon-${k}`,`Moon Tide ${k}`,'Night',['moon','tide','night'],badge(p,`<rect width="400" height="400" fill="${p.d}"/>`+moon(p)+waves({...p,a:p.b,b:p.a},245),'MOON TIDE','PACIFIC TIME','c'+k+'n'),k);});
['teal','forest'].forEach(k=>{const p=P[k];add(`topo-${k}`,`Topo Sooke ${k}`,'Maps',['topographic','map'],topo(p)+txt('SOOKE',200,54,p.c,SERIF,'font-weight="700" letter-spacing="6" stroke="'+p.d+'" stroke-width="8" paint-order="stroke"')+txt('48.37°N 123.73°W',380,16,p.a,SANS,'letter-spacing="4"'),k);});
add('compass-teal','True North','Maps',['compass','nautical'],compass(P.teal)+txt('TRUE NORTH',370,28,P.teal.c,SERIF,'font-weight="700" letter-spacing="4"'),'teal');
add('ferry-mist','Ferry Days','Coast',['ferry','islands'],badge(P.mist,`<rect width="400" height="400" fill="${P.mist.d}"/>`+islands(P.mist)+ferry(P.mist)+`<path d="${wavePath(270,6,40)}" fill="${P.mist.b}"/>`,'FERRY DAYS','GULF ISLANDS','cfm'),'mist');
// Typographic
const typo = [
  ['type-sooke','Sooke BC Classic', p => txt('SOOKE',200,92,p.c,SERIF,'font-weight="700" letter-spacing="4"')+`<rect x="80" y="225" width="240" height="3" fill="${p.a}"/>`+txt('BRITISH COLUMBIA',262,20,p.a,SANS,'letter-spacing="9" font-weight="600"'),'silver'],
  ['type-saltwater','Salt Water Soul', p => txt('Salt Water',170,64,p.a,SERIF,'font-style="italic" font-weight="700"')+txt('SOUL',250,88,p.c,SANS,'font-weight="800" letter-spacing="14"'),'teal'],
  ['type-mist','Mist & Mountain', p => mountains(p,200).replace(/fill="[^"]+" opacity=".55"/,'fill="none"')+txt('MIST',260,64,p.c,SERIF,'font-weight="700" letter-spacing="10"')+txt('& MOUNTAIN',310,30,p.a,SANS,'letter-spacing="8" font-weight="600"'),'mist'],
  ['type-pacific-time','Pacific Time', p => `<circle cx="200" cy="170" r="110" fill="none" stroke="${p.a}" stroke-width="6"/><path d="M200 170 V90 M200 170 L255 200" stroke="${p.c}" stroke-width="8" stroke-linecap="round"/>`+txt('PACIFIC TIME',335,40,p.c,SERIF,'font-weight="700" letter-spacing="3"'),'dusk'],
  ['type-48n','48° North', p => txt('48°N',230,140,p.a,SERIF,'font-weight="700"')+txt('LIFE ON THE EDGE OF THE PACIFIC',290,13,p.c,SANS,'letter-spacing="4" font-weight="600"'),'teal'],
  ['type-stay-misty','Stay Misty', p => fog(p,150,.5)+fog(p,240,.4)+txt('stay',180,52,p.c,SERIF,'font-style="italic"')+txt('MISTY',260,90,p.c,SANS,'font-weight="800" letter-spacing="6"'),'mist'],
  ['type-wild-coast','Wild Coast Est.', p => `<rect x="60" y="100" width="280" height="200" rx="8" fill="none" stroke="${p.c}" stroke-width="5"/>`+txt('WILD',185,70,p.c,SERIF,'font-weight="700" letter-spacing="8"')+txt('COAST',255,62,p.a,SERIF,'font-weight="700" letter-spacing="8"')+txt('EST. SOOKE',330,18,p.c,SANS,'letter-spacing="8"'),'forest'],
  ['type-tide-schedule','Ruled by Tides', p => txt('RULED',150,58,p.c,SANS,'font-weight="800" letter-spacing="10"')+txt('by the',200,40,p.a,SERIF,'font-style="italic"')+txt('TIDES',270,74,p.c,SANS,'font-weight="800" letter-spacing="12"')+`<path d="${wavePath(300,8,40)}" fill="${p.a}" transform="scale(1 .3) translate(0 700)"/>`,'teal'],
  ['type-cedar-salt','Cedar & Salt Script', p => tree(200,190,110,p.a)+txt('Cedar &amp; Salt',270,54,p.c,SERIF,'font-style="italic" font-weight="700"'),'forest'],
  ['type-westcoast','West Coast Wordmark', p => txt('WEST',170,80,p.c,SANS,'font-weight="800" letter-spacing="18"')+txt('COAST',255,80,'none',SANS,`font-weight="800" letter-spacing="18" stroke="${p.a}" stroke-width="3"`)+txt('VANCOUVER ISLAND',305,16,p.e,SANS,'letter-spacing="7"'),'silver'],
  ['type-high-tide','High Tide Good Vibes', p => txt('HIGH TIDE',180,58,p.e,SERIF,'font-weight="700" letter-spacing="4"')+txt('good vibes',245,44,p.a,SERIF,'font-style="italic"'),'dusk'],
];
typo.forEach(([id,title,fn,k]) => add(id, title, 'Typographic', ['type','wordmark'], fn(P[k]), k));
fs.mkdirSync(path.join(__dirname,'..','data'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'..','data','designs.generated.json'), JSON.stringify(designs, null, 2));
console.log('generated', designs.length, 'designs');
