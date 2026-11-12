"""Measure Nico's parts on the approved design sheet: per-view masks for hair, skin, shirt, jeans and shoes, and the
landmark heights (hairline, brows, glasses, chin, sleeve ends, hem, watch, shoe tops) as fractions of the figure height.
Run: python3 sheet_parts.py <sheet.png> <out_dir>   (writes parts.json and parts_<view>.png previews)"""
import sys, os, json
import numpy as np
from PIL import Image

sheet, out = sys.argv[1], sys.argv[2]
a = np.array(Image.open(sheet).convert('RGB')).astype(int)
VIEWS = {'front': (150, 370), 'side': (770, 920), 'back': (1030, 1250)}
PAL = {'bg': (190, 190, 191), 'hair': (35, 33, 32), 'skin': (172, 125, 88), 'shirt': (55, 69, 67), 'jeans': (44, 45, 51),
       'shoe': (100, 95, 92), 'sole': (150, 136, 125)}
names = list(PAL); pal = np.array([PAL[n] for n in names])

def erode(m, r=1):
    o = m.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1): o &= np.roll(np.roll(m, dy, 0), dx, 1)
    return o
def dilate(m, r=1):
    o = m.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1): o |= np.roll(np.roll(m, dy, 0), dx, 1)
    return o

res = {}
for view, (x0, x1) in VIEWS.items():
    c = a[:606, x0:x1]
    fg = np.abs(c - np.array(PAL['bg'])).sum(2) > 45
    ys = np.where(fg.any(1))[0]; top, bot = ys.min(), ys.max()
    c = c[top:bot + 1]; fg = fg[top:bot + 1]; H = bot - top + 1
    lab = np.argmin(((c[:, :, None, :] - pal[None, None]) ** 2).sum(3), 2)
    m = {n: (lab == i) & fg for i, n in enumerate(names)}
    frac = lambda y: round(1 - y / (H - 1), 4)
    # hair: dark pixels in the head (above the shirt's top), opened to drop the 2-3 px ink lines; then closed
    shirt_rows = np.where(m['shirt'].sum(1) > 8)[0]
    neck_y = shirt_rows.min()
    dark = (m['hair'] | m['jeans']) & fg
    dark[neck_y:] = False
    hair = dilate(erode(dark, 2), 2) & dark
    hair = erode(dilate(hair, 2), 2) & fg
    skin = m['skin'].copy()
    r = {'H': int(H), 'top_px': int(top), 'x0': x0}
    hy = np.where(hair.any(1))[0]
    sk_head = skin.copy(); sk_head[neck_y:] = False
    sy = np.where(sk_head.sum(1) > 3)[0]
    r['hair_top'] = frac(hy.min()); r['hair_bottom'] = frac(hy.max())
    r['skin_head_top'] = frac(sy.min()) if len(sy) else None          # the hairline (forehead top) in this view
    r['chin'] = frac(sy.max()) if len(sy) else None
    r['shirt_top'] = frac(neck_y); r['shirt_bottom'] = frac(np.where(m['shirt'].sum(1) > 8)[0].max())
    jy = np.where(m['jeans'].sum(1) > 15)[0]; jy = jy[jy > neck_y + 30]
    r['jeans_top'] = frac(jy.min()); r['jeans_bottom'] = frac(jy.max())
    shoe = (m['shoe'] | m['sole']); shy = np.where(shoe.sum(1) > 10)[0]; shy = shy[shy > H * 0.8]
    r['shoe_top'] = frac(shy.min())
    # sleeve ends: lowest shirt row in the arm columns (outside the torso's run at mid-chest)
    rows = []
    for y in range(neck_y, int(H * 0.6)):
        xs = np.where(m['shirt'][y])[0]
        if len(xs): rows.append((y, xs.min(), xs.max()))
    r['shirt_rows'] = len(rows)
    # skin of the arms: the highest skin row below the neck (where the sleeve ends)
    ska = skin.copy(); ska[:neck_y + 10] = False
    say = np.where(ska.sum(1) > 2)[0]
    r['arm_skin_top'] = frac(say.min()) if len(say) else None
    res[view] = r
    np.save(os.path.join(out, f'hair_{view}.npy'), hair)
    np.save(os.path.join(out, f'fg_{view}.npy'), fg)
    np.save(os.path.join(out, f'lab_{view}.npy'), lab.astype(np.uint8))
    prev = np.zeros(c.shape, np.uint8) + 230
    cols = {'hair': (220, 30, 30), 'skin': (230, 170, 120), 'shirt': (40, 140, 110), 'jeans': (60, 60, 140), 'shoe': (150, 150, 150), 'sole': (240, 240, 200)}
    for n, col in cols.items(): prev[m[n]] = col
    prev[hair] = (255, 0, 255)
    Image.fromarray(prev).save(os.path.join(out, f'parts_{view}.png'))
json.dump(res, open(os.path.join(out, 'parts.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
