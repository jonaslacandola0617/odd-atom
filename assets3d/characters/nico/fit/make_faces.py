"""Nico's face textures, taken from the six expression heads drawn on the approved design sheet.

Each head is aligned on its glasses (template-matched against the first head's frame), the frame is painted out
(the glasses are 3D geometry on the model), hair at the edges becomes skin (the hair is 3D too), and the face is
resampled to a small pixel-art texture with one shared palette and no dithering. A blink is made from 'tired'.
Run: python3 make_faces.py <sheet.png> <out_dir>
"""
import sys, os, json
import numpy as np
from PIL import Image

sheet, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
A = np.array(Image.open(sheet).convert('RGB')).astype(float)
LUM = A.mean(2)
EXPR = ['tired', 'focused', 'forcedSmile', 'worried', 'fear', 'terror']
HEAD_X = [27, 256, 486, 714, 940, 1165]          # left edge of each expression head's column on the sheet
# head 0 ('tired'), measured on the sheet: lens rectangles (outer edges) and the frame line thickness
LENS0 = [(81, 810, 134, 843), (141, 810, 195, 843)]
T = 7
TI = 10                                           # inpaint band reaches this far inside each lens
SKIN = np.array([172.0, 124.0, 88.0])          # the sheet's face skin
# texture rectangle around the glasses' centre, in head pixels (front view: 55.5 px of glasses = 114 px here)
S = 55.5 / 114.0
CX0, CY0 = 138.0, 826.5
RECT = (-64, -54, 64, 78)                         # x0, y0, x1, y1 relative to the glasses' centre
TEX = (96, 112)

def frame_mask(lenses, shape, oy=0, ox=0, t=None, keep_top=False):
    t = t or T
    m = np.zeros(shape, bool)
    for x0, y0, x1, y1 in lenses:
        x0 += ox; x1 += ox; y0 += oy; y1 += oy
        m[y0 - 2:y1 + 3, x0 - 2:x1 + 3] = True
        m[y0 + t:y1 - t + 1, x0 + t:x1 - t + 1] = False
        if keep_top: m[y0 - 2:y0 + t, x0 + 4:x1 - 3] = False
    (ax0, ay0, ax1, ay1), (bx0, by0, bx1, by1) = [(l[0] + ox, l[1] + oy, l[2] + ox, l[3] + oy) for l in lenses]
    m[ay0 - 2:ay0 + 13, ax1 - 4:bx0 + 5] = True                            # bridge
    m[ay0:ay0 + 9, ax0 - 16:ax0] = True; m[by0:by0 + 9, bx1:bx1 + 16] = True   # hinges toward the temples
    return m

# template: dark frame pixels of head 0
dark = LUM < 85
tmpl = frame_mask(LENS0, dark.shape) & dark
ty, tx = np.where(tmpl)
info = {}
faces = {}
for name, hx in zip(EXPR, HEAD_X):
    best = (-1, 0, 0)
    for dy in range(-30, 31):
        for dx in range(-20, 21):
            sc = dark[ty + dy, tx + (hx - HEAD_X[0]) + dx].sum()
            if sc > best[0]: best = (sc, dy, dx)
    _, dy, dx = best
    ox = hx - HEAD_X[0] + dx
    cx, cy = CX0 + ox, CY0 + dy
    KEEP_TOP = name == 'focused'      # its brows are drawn down onto the frame's top bar
    fm = frame_mask(LENS0, dark.shape, dy, ox, TI, KEEP_TOP) & (LUM < 110)
    # grow the frame mask by 1 px to take the anti-aliased edge
    g = fm.copy()
    for sy in (-1, 0, 1):
        for sx in (-1, 0, 1): g |= np.roll(np.roll(fm, sy, 0), sx, 1)
    band = frame_mask(LENS0, dark.shape, dy, ox, TI, KEEP_TOP)
    hole = g & band
    # brows that dip into the frame's top bar (focused, worried) stay: a dark column continuing above the band is a brow
    for (lx0, ly0, lx1, ly1) in LENS0:
        X0, X1, Y0 = lx0 + ox - 2, lx1 + ox + 3, ly0 + dy - 2
        for x in range(X0, X1):
            if dark[Y0 - 5:Y0 - 1, x].sum() >= 3: hole[Y0:Y0 + T + 2, x] = False
    x0, y0, x1, y1 = int(cx + RECT[0]), int(cy + RECT[1]), int(cx + RECT[2]), int(cy + RECT[3])
    img = A[y0:y1, x0:x1].copy(); hm = hole[y0:y1, x0:x1].copy()
    # hair at the crop's sides and top (dark, touching the left/right/top border) -> filled like the frame
    lum = img.mean(2)
    hairish = lum < 70
    reach = np.zeros_like(hairish)
    reach[:, :3] = hairish[:, :3]; reach[:, -3:] = hairish[:, -3:]; reach[:3] = hairish[:3]
    for _ in range(60):
        nb = reach.copy()
        nb[1:] |= reach[:-1]; nb[:-1] |= reach[1:]; nb[:, 1:] |= reach[:, :-1]; nb[:, :-1] |= reach[:, 1:]
        nb &= hairish
        if (nb == reach).all(): break
        reach = nb
    # the background (outside the head) also gets filled
    bgm = np.abs(img - np.array([190, 190, 191])).sum(2) < 40
    fill = hm | reach | bgm
    known = ~fill
    # diffusion inpaint: repeatedly average known neighbours into the holes
    work = img.copy(); work[fill] = 0
    k = known.astype(float)
    for _ in range(400):
        acc = np.zeros_like(work); cnt = np.zeros(k.shape)
        for sy, sx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            acc += np.roll(np.roll(work * k[..., None], sy, 0), sx, 1); cnt += np.roll(np.roll(k, sy, 0), sx, 1)
        newk = (cnt > 0) & ~known
        work[newk] = acc[newk] / cnt[newk][:, None]
        k = np.maximum(k, newk.astype(float)); known = known | newk
        if known.all(): break
    # outside the face oval: plain skin (the decal only covers the oval; this keeps the resampled edge clean)
    hh, ww = work.shape[:2]
    yy, xx = np.mgrid[0:hh, 0:ww]
    ex = (xx - (cx - x0)) / (0.47 * ww); ey = (yy - (cy - y0)) / np.where(yy < (cy - y0), 0.75 * (cy - y0) / 0.75, (y1 - cy) * 1.02)
    oval = ex ** 2 + ey ** 2 <= 1.0
    sk = np.median(work[int(hh * 0.55):int(hh * 0.62), int(ww * 0.25):int(ww * 0.4)].reshape(-1, 3), 0)
    work[~oval] = sk
    # flat skin: anything close to the skin tone becomes exactly the skin tone (the toon light makes the bands)
    near = np.abs(work - sk).sum(2) < 70
    work[near] = SKIN
    faces[name] = work
    info[name] = {'offset_px': [int(dx), int(dy)], 'glasses_centre_on_sheet': [float(cx), float(cy)], 'crop': [x0, y0, x1, y1]}

# one shared palette, no dithering
stack = np.concatenate([f.reshape(-1, 3) for f in faces.values()]).astype(np.uint8)
pal_img = Image.fromarray(stack.reshape(1, -1, 3)).quantize(colors=16, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
def to_tex(f):
    im = Image.fromarray(np.clip(f, 0, 255).astype(np.uint8)).resize(TEX, Image.BOX)
    return im.quantize(palette=pal_img, dither=Image.Dither.NONE).convert('RGB')
texs = {n: to_tex(f) for n, f in faces.items()}

# blink from 'tired': close the eye openings (bright eye-whites and the dark iris inside each lens) with skin + a lid line
t = np.array(texs['tired']).astype(int)
H_, W_ = t.shape[:2]
sx, sy = TEX[0] / (RECT[2] - RECT[0]), TEX[1] / (RECT[3] - RECT[1])
b = t.copy()
skin = np.array(texs['tired'].getpixel((2, H_ // 2))).astype(int)
for x0, y0, x1, y1 in LENS0:
    lx0, lx1 = int((x0 + T - CX0 - RECT[0]) * sx), int((x1 - T - CX0 - RECT[0]) * sx)
    ly0, ly1 = int((y0 + T - CY0 - RECT[1]) * sy), int((y1 - T - CY0 - RECT[1]) * sy)
    reg = t[ly0:ly1, lx0:lx1]
    wh = reg.mean(2) > 150                       # the eye-whites
    ys, xs = np.where(wh)
    if not len(ys): continue
    ya, yb, xa, xb = max(0, ys.min() - 2), min(reg.shape[0], ys.max() + 2), max(0, xs.min() - 1), min(reg.shape[1], xs.max() + 2)
    r = b[ly0:ly1, lx0:lx1]
    r[ya:yb, xa:xb] = skin
    ly = ya + int((yb - ya) * 0.6)
    r[ly, xa:xb] = (26, 18, 19)
    r[ly + 1, xa + 1:xb - 1] = (26, 18, 19)
texs['blink'] = Image.fromarray(b.astype(np.uint8))

for n, im in texs.items(): im.save(os.path.join(out, f'nico-face-{n}.png'))
# where the texture sits on the front view of the sheet (for the 3D decal): pixels in the full-body front view
info['_texture'] = {'size': TEX, 'rect_head_px': RECT, 'head_to_front_scale': S,
                    'rect_front_px': [RECT[0] * S, RECT[1] * S, RECT[2] * S, RECT[3] * S],
                    'eye_centres_front_px': [[((l[0] + l[2]) / 2 - CX0) * S, ((l[1] + l[3]) / 2 - CY0) * S] for l in LENS0],
                    'lens_rects_front_px': [[(l[0] - CX0) * S, (l[1] - CY0) * S, (l[2] - CX0) * S, (l[3] - CY0) * S] for l in LENS0],
                    'frame_line_front_px': T * S, 'skin_rgb': [int(v) for v in skin]}
json.dump(info, open(os.path.join(out, 'faces.json'), 'w'), indent=1)
print(json.dumps(info, indent=1))
# preview: all seven, 4x nearest
row = Image.new('RGB', (7 * (TEX[0] * 3 + 6), TEX[1] * 3), (20, 20, 20))
for i, n in enumerate(EXPR + ['blink']): row.paste(texs[n].resize((TEX[0] * 3, TEX[1] * 3), Image.NEAREST), (i * (TEX[0] * 3 + 6), 0))
row.save(os.path.join(out, 'preview.png'))
