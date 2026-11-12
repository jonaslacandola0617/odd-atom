"""Review sheets for Nico v5 clay renders: the design sheet over the four clay views, and the detail close-ups.
Run: python3 compose.py <renders_dir> <sheet.png>"""
import sys
from PIL import Image
d, sheet = sys.argv[1].rstrip('/') + '/', sys.argv[2]
sh = Image.open(sheet).convert('RGB').crop((40, 0, 1260, 620))
a = [Image.open(d + f'clay_{n}.png').convert('RGB').crop((40, 20, 380, 740)) for n in ['front', 'quarter', 'side', 'back']]
k = 620 / 720
row = Image.new('RGB', (1220, 620), (60, 60, 64))
for i, m in enumerate(a): row.paste(m.resize((int(340 * k), 620)), (int(i * 305 + 10), 0))
o = Image.new('RGB', (1220, 1250), (20, 20, 20)); o.paste(sh, (0, 0)); o.paste(row, (0, 630)); o.save(d + 'compare-sheet-vs-v5-clay.png')
b = [Image.open(d + f'clay_{n}.png').convert('RGB') for n in ['head_front', 'head_quarter', 'head_side', 'hands', 'feet']]
o = Image.new('RGB', (2500, 500)); [o.paste(m, (i * 500, 0)) for i, m in enumerate(b)]; o.save(d + 'clay-details.png')
