// Default site config. Owner edits are saved to data/site.json; "reset" restores these.
const theme = { bg:'#0a0a0b', surface:'#14161a', text:'#eef1f5', silver:'#d7dbe2', accent:'#1fb5a8', accent2:'#f2c26b', fontPair:'playfair-inter', radius:999, fog:true };
const fontPairs = {
  'playfair-inter': { label:'Playfair Display + Inter', heading:'Playfair Display', body:'Inter', url:'Playfair+Display:ital,wght@0,500;0,700;1,500&family=Inter:wght@300;400;500;600;700' },
  'cormorant-manrope': { label:'Cormorant Garamond + Manrope', heading:'Cormorant Garamond', body:'Manrope', url:'Cormorant+Garamond:ital,wght@0,500;0,700;1,500&family=Manrope:wght@300;400;500;600;700' },
  'dmserif-dmsans': { label:'DM Serif Display + DM Sans', heading:'DM Serif Display', body:'DM Sans', url:'DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;700' },
  'fraunces-worksans': { label:'Fraunces + Work Sans', heading:'Fraunces', body:'Work Sans', url:'Fraunces:ital,wght@0,500;0,700;1,500&family=Work+Sans:wght@300;400;500;600' },
  'bebas-inter': { label:'Bebas Neue + Inter', heading:'Bebas Neue', body:'Inter', url:'Bebas+Neue&family=Inter:wght@300;400;500;600;700' },
  'spacegrotesk': { label:'Space Grotesk (solo)', heading:'Space Grotesk', body:'Space Grotesk', url:'Space+Grotesk:wght@300;400;500;700' },
};
const sections = [
  { id:'hero', type:'hero', visible:true, eyebrow:'Sooke · British Columbia', title:'Wear the West Coast.', subtitle:'Heavyweight cotton tees printed with mist, cedar, orcas and tide lines. Designed on the edge of the Pacific.', cta:'Design your tee', image:'' },
  { id:'featured', type:'featured', visible:true, title:'Featured designs', subtitle:'Hand-picked from the gallery. Tap one to put it on a shirt.' },
  { id:'configurator', type:'configurator', visible:true, title:'Build your shirt', subtitle:'Pick a design, a cut, a colour and a size.' },
  { id:'collections', type:'collections', visible:true, title:'Collections', items:[
    { title:'Ocean', text:'Swells, orcas and salt air.', category:'Ocean', image:'' },
    { title:'Mountains', text:'Coast Range peaks in the fog.', category:'Mountains', image:'' },
    { title:'Forest', text:'Old-growth cedar and fern.', category:'Forest', image:'' },
    { title:'Typographic', text:'Clean wordmarks for the coast.', category:'Typographic', image:'' } ] },
  { id:'story', type:'story', visible:true, title:'Made where the road ends', text:'Myshirt started in Sooke, where the rainforest runs straight into the Strait of Juan de Fuca. Every design is drawn from this coastline — the lighthouses, the tide pools, the fog that rolls in at four o\'clock. We print on soft, ring-spun cotton and ship anywhere in North America.', image:'' },
  { id:'testimonials', type:'testimonials', visible:true, title:'From the coast', items:[
    { quote:'Softest tee I own, and the orca print gets compliments on every ferry ride.', name:'Jess, Victoria BC' },
    { quote:'Ordered three for the family reunion in Tofino. Arrived in four days.', name:'Marco, Seattle WA' },
    { quote:'The misty mountains design is gorgeous in person.', name:'Ana, Guadalajara MX' } ] },
  { id:'newsletter', type:'newsletter', visible:true, title:'Catch the next drop', text:'New designs land with the spring tides. Join the list — no spam, just the coast.', button:'Join' },
  { id:'footer', type:'footer', visible:true, text:'Designed in Sooke, BC · Shipping across Canada, the USA and Mexico', links:[ {label:'About', page:'about'}, {label:'FAQ', page:'faq'}, {label:'Shipping & Returns', page:'policy'} ] },
];
const products = [
  { id:'classic-crew', name:'Classic Crew', description:'Everyday 5.3 oz ring-spun cotton crew neck. Relaxed, true to size.', price:32, silhouette:'crew', inStock:true, sizes:['S','M','L','XL','XXL','XXXL'], colors:[{name:'Coastal Black',hex:'#111214'},{name:'Fog White',hex:'#f3f4f2'},{name:'Heather Silver',hex:'#c9ced6'},{name:'Deep Teal',hex:'#0f5c5c'},{name:'Cedar Green',hex:'#2f4a3a'},{name:'Harbour Navy',hex:'#1b2a44'}] },
  { id:'premium-heavyweight', name:'Premium Heavyweight', description:'7.1 oz heavyweight organic cotton, boxy fit, structured collar.', price:44, silhouette:'crew', inStock:true, sizes:['S','M','L','XL','XXL'], colors:[{name:'Coastal Black',hex:'#111214'},{name:'Bone',hex:'#e9e4d8'},{name:'Slate',hex:'#4a5160'},{name:'Kelp',hex:'#3c4a2a'}] },
  { id:'v-neck', name:'Coastline V-Neck', description:'Lightweight 4.3 oz combed cotton with a tailored V.', price:34, silhouette:'vneck', inStock:true, sizes:['S','M','L','XL','XXL'], colors:[{name:'Coastal Black',hex:'#111214'},{name:'Fog White',hex:'#f3f4f2'},{name:'Heather Silver',hex:'#c9ced6'},{name:'Harbour Navy',hex:'#1b2a44'}] },
  { id:'long-sleeve', name:'Long Sleeve Tide', description:'Midweight cotton long sleeve for cool mornings on the water.', price:42, silhouette:'longsleeve', inStock:true, sizes:['S','M','L','XL','XXL','XXXL'], colors:[{name:'Coastal Black',hex:'#111214'},{name:'Fog White',hex:'#f3f4f2'},{name:'Deep Teal',hex:'#0f5c5c'},{name:'Cedar Green',hex:'#2f4a3a'}] },
  { id:'womens-fit', name:"Women's Relaxed Fit", description:'Soft slub cotton, slightly cropped relaxed fit.', price:34, silhouette:'womens', inStock:true, sizes:['S','M','L','XL','XXL'], colors:[{name:'Coastal Black',hex:'#111214'},{name:'Fog White',hex:'#f3f4f2'},{name:'Sea Glass',hex:'#9fd3c7'},{name:'Sunset Clay',hex:'#c7765a'}] },
];
const shipping = { currency:'CAD', freeThreshold:{ CA:100, US:150, MX:175 }, zones:{
  'ca-bc':    { label:'British Columbia', base:8,  perItem:2,  days:'2–4' },
  'ca-west':  { label:'Prairies (AB/SK/MB)', base:12, perItem:2.5, days:'3–6' },
  'ca-east':  { label:'Eastern Canada', base:15, perItem:3, days:'4–8' },
  'ca-north': { label:'Northern Canada (YT/NT/NU)', base:24, perItem:4, days:'6–12' },
  'us-west':  { label:'US West Coast', base:14, perItem:3, days:'4–7' },
  'us-main':  { label:'Continental US', base:18, perItem:3.5, days:'5–9' },
  'us-remote':{ label:'Alaska, Hawaii & US Territories', base:28, perItem:5, days:'7–14' },
  'mx':       { label:'Mexico', base:26, perItem:5, days:'7–15' } } };
const content = { siteName:'Myshirt', tagline:'West Coast cotton, printed in Sooke', logo:'', announcement:{ enabled:true, text:'Free shipping in Canada over $100 · US over $150 · Mexico over $175' },
  pages:{
    about:{ title:'About Myshirt', body:'Myshirt is a small apparel studio in Sooke, British Columbia, run by Dr Paul Magic.\n\nWe design every print around the coastline we live on and print on soft, durable cotton.' },
    faq:{ title:'FAQ', body:'How do sizes run?\nTrue to size. Heavyweight tees run slightly boxy.\n\nWhere do you ship?\nAnywhere in Canada, the United States and Mexico.\n\nHow long does printing take?\n2–3 business days before shipping.' },
    policy:{ title:'Shipping & Returns', body:'Shipping is calculated at checkout by region and number of items. Orders over the free-shipping threshold ship free.\n\nUnworn items can be returned within 30 days. Custom prints are final sale unless defective.' } } };
module.exports = { theme, fontPairs, sections, products, shipping, content };
