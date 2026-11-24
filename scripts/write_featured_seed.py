#!/usr/bin/env python3
"""One-off bootstrap of data/featured.seed.json. DO NOT re-run after ingesting art: it resets listing status/prints. Edit the JSON directly instead."""
import json
SIZES = ['S', 'M', 'L', 'XL', 'XXL']
palette = {
  'tee': {  # Bella+Canvas 3001 colour names (hex = screen approximations)
    'White': ['#ffffff', 'dark'], 'Heather Mint': ['#a9d9c4', 'dark'], 'Soft Pink': ['#f6d0d6', 'dark'], 'Baby Blue': ['#b5cfe9', 'dark'],
    'Heather Prism Lilac': ['#d6c6e3', 'dark'], 'Yellow': ['#f8e27c', 'dark'], 'Peach': ['#f8c6a6', 'dark'], 'Turquoise': ['#19a3a8', 'light'],
    'Kelly': ['#1f9a57', 'light'], 'True Royal': ['#2a4c9f', 'light'], 'Heather Navy': ['#3b4560', 'light']},
  'longsleeve': {  # Gildan 2400 Ultra Cotton long sleeve
    'White': ['#ffffff', 'dark'], 'Light Blue': ['#b6cde4', 'dark'], 'Light Pink': ['#f4c9d3', 'dark'], 'Carolina Blue': ['#7ea7d8', 'dark'],
    'Daisy': ['#f7d64a', 'dark'], 'Irish Green': ['#1f9450', 'light'], 'Royal': ['#2b4b9e', 'light'], 'Purple': ['#5b3f8c', 'light'], 'Navy': ['#25304a', 'light']},
  'hoodie': {  # Gildan 18500 Heavy Blend hoodie
    'White': ['#ffffff', 'dark'], 'Light Pink': ['#f3c6d0', 'dark'], 'Light Blue': ['#b3cde3', 'dark'], 'Mint Green': ['#b9e3c9', 'dark'],
    'Orchid': ['#c9a8d6', 'dark'], 'Carolina Blue': ['#7ba4db', 'dark'], 'Sapphire': ['#0f7fb3', 'light'], 'Irish Green': ['#1f8f4e', 'light'],
    'Royal': ['#2b4b9e', 'light'], 'Heliconia': ['#e0479e', 'light'], 'Navy': ['#25304a', 'light']},
}
def C(names): return [{'name': n, 'why': w} for n, w in names]
PROV = 'Provisional: picked from the owner\'s description only (art not viewed yet); re-check against the art at ingest.'
listings = [
  dict(id='my-shirt-turquoise', title='my shirt — Coast Range', status='live', inkMode='auto',
       description='The original "my shirt" art: clean lowercase wordmark over misty Coast Range peaks and a calm inlet.',
       prints={'light': '/featured/my-shirt-print-light.png', 'dark': '/featured/my-shirt-print-dark.png'},
       photos={'tee|Turquoise': '/featured/my-shirt-turquoise-photo.jpg'}, ingest={'mode': 'extract-mockup', 'done': True},
       printNote='Print extracted from the owner\'s turquoise mockup photo (475×400 px ≈ 48 dpi at 10 in). Fine for web previews; get the original art file (or a vector redraw) before production printing. Light shirts use a dark-teal ink version of the same art.',
       colors={
         'tee': C([('Turquoise', 'The owner\'s own mockup colour — real product photo; white-ink print as designed.'),
                   ('White', 'Always offered; uses the dark-teal ink version so the wordmark stays readable.'),
                   ('Heather Mint', 'Pastel sea-glass green that echoes the misty water; dark-teal ink.'),
                   ('Baby Blue', 'Soft sky pastel that matches the coastal scene; dark-teal ink.'),
                   ('Heather Prism Lilac', 'Pastel dusk tone for variety beyond blues/greens; dark-teal ink.'),
                   ('True Royal', 'One bold colourful option where the original white-ink print pops.')]),
         'longsleeve': C([('White', 'Always offered; dark-teal ink.'), ('Light Blue', 'Closest pastel to the coast palette; dark-teal ink.'),
                   ('Carolina Blue', 'Brighter mid-blue, still light enough for dark ink.'), ('Light Pink', 'Pastel contrast colour; dark-teal ink.'),
                   ('Royal', 'Colourful option carrying the original white-ink print.')]),
         'hoodie': C([('Sapphire', 'Gildan 18500\'s closest match to the turquoise original; white-ink print.'), ('White', 'Always offered; dark-teal ink.'),
                   ('Mint Green', 'Pastel sea-glass; dark-teal ink.'), ('Light Blue', 'Pastel sky; dark-teal ink.'), ('Orchid', 'Pastel lilac for variety; dark-teal ink.')])}),
  dict(id='ha-celtic-knot', title='(HA)ₙ Celtic Knot', status='awaiting-file', inkMode='original',
       description='The owner\'s hyaluronic-acid Celtic-knot mark: teal and silver triquetra in parentheses with subscript n and the formula (C14H21NO11)n.',
       prints={}, photos={}, ingest={'mode': 'remove-bg', 'note': 'Off-white background removed to transparent; check the small caption line is legible at ~10 in print width (needs ≥ ~150 dpi).'},
       colors={
         'tee': C([('White', 'Always offered; the teal/silver ink reads cleanly.'), ('Heather Mint', 'Pastel that harmonises with the teal knot.'),
                   ('Baby Blue', 'Pastel cool tone; teal stays visible.'), ('Heather Prism Lilac', 'Pastel contrast to teal.'), ('Soft Pink', 'Warm pastel contrast; no dark colours because the dark-teal ink would disappear.')]),
         'longsleeve': C([('White', 'Always offered.'), ('Light Blue', 'Pastel cool tone.'), ('Light Pink', 'Warm pastel contrast.'), ('Daisy', 'Light, cheerful pastel yellow; teal still reads.')]),
         'hoodie': C([('White', 'Always offered.'), ('Mint Green', 'Pastel match for the teal.'), ('Light Blue', 'Pastel cool tone.'), ('Orchid', 'Pastel lilac contrast.'), ('Light Pink', 'Warm pastel contrast.')])}),
  dict(id='search-me-cologne', title='Search Me — cologne for two', status='awaiting-file', inkMode='original',
       description='"Search Me" fragrance art: two navy bottles nested along a curve with gold caps on a soft blue backdrop.',
       prints={}, photos={}, ingest={'mode': 'photo', 'note': 'Photographic print with its soft-blue backdrop kept as a rounded panel.'},
       colors={'tee': C([('White', 'Always offered; frames the soft-blue photo panel.'), ('Baby Blue', 'Pastel that matches the photo backdrop.'), ('Heather Prism Lilac', PROV), ('Soft Pink', PROV), ('Heather Navy', 'Echoes the navy bottles. ' + PROV)]),
               'longsleeve': C([('White', 'Always offered.'), ('Light Blue', 'Matches the backdrop.'), ('Light Pink', PROV), ('Navy', 'Echoes the bottles. ' + PROV)]),
               'hoodie': C([('White', 'Always offered.'), ('Light Blue', 'Matches the backdrop.'), ('Orchid', PROV), ('Light Pink', PROV), ('Navy', 'Echoes the bottles. ' + PROV)])}),
  dict(id='search-me-statue', title='Search Me — silver statue', status='awaiting-file', inkMode='original',
       description='Chrome male/female torso sculpture from the "Search Me" campaign.',
       prints={}, photos={}, ingest={'mode': 'photo', 'note': 'Use remove-bg instead if the photo has a plain backdrop.'},
       colors={'tee': C([('White', 'Always offered.'), ('Baby Blue', PROV), ('Heather Prism Lilac', PROV), ('Soft Pink', PROV), ('Heather Navy', 'Chrome tones pop on navy. ' + PROV)]),
               'longsleeve': C([('White', 'Always offered.'), ('Light Blue', PROV), ('Light Pink', PROV), ('Navy', PROV)]),
               'hoodie': C([('White', 'Always offered.'), ('Light Blue', PROV), ('Orchid', PROV), ('Light Pink', PROV), ('Navy', PROV)])}),
  dict(id='sooke-rainforest', title='Sooke Rainforest', status='awaiting-file', inkMode='original', description='Sooke rainforest artwork.', prints={}, photos={}, ingest={'mode': 'photo'},
       colors={'tee': C([('White', 'Always offered.'), ('Heather Mint', PROV), ('Baby Blue', PROV), ('Yellow', PROV), ('Kelly', PROV)]),
               'longsleeve': C([('White', 'Always offered.'), ('Light Blue', PROV), ('Daisy', PROV), ('Irish Green', PROV)]),
               'hoodie': C([('White', 'Always offered.'), ('Mint Green', PROV), ('Light Blue', PROV), ('Irish Green', PROV)])}),
  dict(id='sooke-vintage-badge', title='Sooke Vintage Badge', status='awaiting-file', inkMode='original', description='Vintage-style Sooke badge artwork.', prints={}, photos={}, ingest={'mode': 'remove-bg'},
       colors={'tee': C([('White', 'Always offered.'), ('Peach', PROV), ('Yellow', PROV), ('Heather Mint', PROV), ('Baby Blue', PROV)]),
               'longsleeve': C([('White', 'Always offered.'), ('Daisy', PROV), ('Light Blue', PROV), ('Light Pink', PROV)]),
               'hoodie': C([('White', 'Always offered.'), ('Light Pink', PROV), ('Mint Green', PROV), ('Light Blue', PROV)])}),
  dict(id='sooke-trail-sign', title='Sooke Trail Sign', status='awaiting-file', inkMode='original', description='Sooke trail-sign artwork.', prints={}, photos={}, ingest={'mode': 'remove-bg'},
       colors={'tee': C([('White', 'Always offered.'), ('Heather Mint', PROV), ('Peach', PROV), ('Baby Blue', PROV), ('Kelly', PROV)]),
               'longsleeve': C([('White', 'Always offered.'), ('Light Blue', PROV), ('Daisy', PROV), ('Irish Green', PROV)]),
               'hoodie': C([('White', 'Always offered.'), ('Mint Green', PROV), ('Light Blue', PROV), ('Irish Green', PROV)])}),
  dict(id='botbucks-logo', title='BotBucks', status='awaiting-file', inkMode='original', description='BotBucks logo tee.', prints={}, photos={}, ingest={'mode': 'remove-bg'},
       colors={'tee': C([('White', 'Always offered.'), ('Baby Blue', PROV), ('Heather Mint', PROV), ('Yellow', PROV), ('Heather Prism Lilac', PROV)]),
               'longsleeve': C([('White', 'Always offered.'), ('Light Blue', PROV), ('Daisy', PROV), ('Carolina Blue', PROV)]),
               'hoodie': C([('White', 'Always offered.'), ('Light Blue', PROV), ('Mint Green', PROV), ('Orchid', PROV)])}),
]
seed = {
  'promo': {'enabled': True, 'text': 'Launch sale: featured artwork half price — tees $49.99 · long sleeves $54.99 · hoodies $69.99 (CAD)'},
  'garments': {
    'tee': {'label': 'T-shirt', 'blank': 'Bella+Canvas 3001 Unisex Jersey Tee (100% cotton)', 'price': 49.99, 'compareAt': 99.98, 'sizes': SIZES, 'silhouette': 'crew'},
    'longsleeve': {'label': 'Long sleeve', 'blank': 'Gildan 2400 Ultra Cotton Long Sleeve (100% cotton)', 'price': 54.99, 'compareAt': 109.98, 'sizes': SIZES, 'silhouette': 'longsleeve'},
    'hoodie': {'label': 'Pullover hoodie', 'blank': 'Gildan 18500 Heavy Blend Hoodie (50/50 cotton-poly)', 'price': 69.99, 'compareAt': 139.98, 'sizes': SIZES, 'silhouette': 'hoodie'}},
  'palette': {g: {n: {'hex': v[0], 'ink': v[1]} for n, v in p.items()} for g, p in palette.items()},
  'listings': listings,
}
json.dump(seed, open('data/featured.seed.json', 'w'), indent=2, ensure_ascii=False)
print('listings', len(listings))
