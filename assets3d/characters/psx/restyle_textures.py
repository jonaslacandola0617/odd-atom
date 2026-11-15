"""TRANSFERS PSX look: restyle two of the user's PSX pack characters into Nico and Bea by
editing their textures only, and generate PS1-style face-swap textures (one full texture per
expression, as PS1-era games swapped face texture pages instead of rigging faces).

Inputs are the user's PSX packs (licences unconfirmed, see
docs/stories/original-series/transfers/PSX-ASSETS.md), so every output goes to the
git-ignored folder public/assets/3d/psx-local/. Only this script is committed.

  python3 assets3d/characters/psx/restyle_textures.py <extracted-packs-dir>

<extracted-packs-dir> holds male_casual/ and Schoolgirl/ as unpacked from Drive.
Deterministic: same inputs give the same PNGs.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT = os.path.join(ROOT, 'public', 'assets', '3d', 'psx-local')
SS = 4  # supersampling for warps and paint, then box-filtered back to the native texture size

EXPRESSIONS = ['neutral', 'focused', 'worried', 'fear', 'smile', 'sleepy', 'shh', 'talk']


def hexc(h):
	return np.array([int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)])


def lum(a):
	return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def rect(shape, x0, y0, x1, y1):
	m = np.zeros(shape[:2], bool)
	m[y0:y1, x0:x1] = True
	return m


def remap(img, mask, target, ref=None, strength=1.0, contrast=1.0):
	"""Recolour masked pixels to `target`, keeping their shading (luminance ratio to the region median)."""
	if not mask.any():
		return img
	L = lum(img)
	ref = ref if ref is not None else float(np.median(L[mask]))
	k = np.clip(1 + (L / max(ref, 1e-3) - 1) * contrast, 0.25, 1.9)[..., None]
	new = np.clip(target[None, None, :] * k, 0, 1)
	out = img.copy()
	out[mask] = img[mask] * (1 - strength) + new[mask] * strength
	return out


def up(img):
	return np.array(Image.fromarray((img * 255).astype(np.uint8)).resize((img.shape[1] * SS, img.shape[0] * SS), Image.BICUBIC)) / 255


def down(img, size):
	return np.array(Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).resize(size, Image.BOX)) / 255


def sample(img, sx, sy):
	h, w = img.shape[:2]
	sx = np.clip(sx, 0, w - 1.001)
	sy = np.clip(sy, 0, h - 1.001)
	x0 = sx.astype(int)
	y0 = sy.astype(int)
	fx = (sx - x0)[..., None]
	fy = (sy - y0)[..., None]
	a = img[y0, x0] * (1 - fx) + img[y0, x0 + 1] * fx
	b = img[y0 + 1, x0] * (1 - fx) + img[y0 + 1, x0 + 1] * fx
	return a * (1 - fy) + b * fy


def warp(img, ops):
	"""Liquify in native texel units. ops: ('move', cx, cy, dx, dy, r) or ('scale', cx, cy, sx, sy, r).
	Backward mapping: each output texel looks up where its content came from."""
	h, w = img.shape[:2]
	yy, xx = np.mgrid[0:h, 0:w].astype(float)
	px = (xx + 0.5) / SS
	py = (yy + 0.5) / SS
	ox = np.zeros_like(px)
	oy = np.zeros_like(py)
	for op in ops:
		kind, cx, cy, a, b, r = op
		f = np.exp(-((px - cx) ** 2 + (py - cy) ** 2) / (r * r))
		if kind == 'move':
			ox -= a * f
			oy -= b * f
		else:  # scale about (cx, cy): a, b are scale factors (>1 enlarges)
			ox -= (px - cx) * (1 - 1 / a) * f
			oy -= (py - cy) * (1 - 1 / b) * f
	return sample(img, (px + ox) * SS - 0.5, (py + oy) * SS - 0.5)


def paint(img, fn):
	"""Draw on a supersampled RGBA layer in native texel coordinates, then alpha-composite."""
	h, w = img.shape[:2]
	layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
	d = ImageDraw.Draw(layer)
	fn(d, lambda *v: [c * SS for c in v])
	la = np.array(layer) / 255
	a = la[..., 3:4]
	return img * (1 - a) + la[..., :3] * a


def col(c, a=1.0):
	return tuple(int(v * 255) for v in c) + (int(a * 255),)


# --------------------------------------------------------------------------- faces
class Face:
	"""Feature positions on the native texture (texels)."""

	def __init__(self, eyeL, eyeR, eye_w, eye_h, brow_y, mouth, mouth_w, skin, lid, lip, dark):
		self.eL, self.eR = np.array(eyeL, float), np.array(eyeR, float)
		self.ew, self.eh = eye_w, eye_h
		self.by = brow_y
		self.m = np.array(mouth, float)
		self.mw = mouth_w
		self.skin, self.lid, self.lip, self.dark = skin, lid, lip, dark
		self.u = (self.eR[0] - self.eL[0]) / 21.0  # unit: Nico's eye spacing is 21 texels


def expression(img, F, expr):
	u = F.u
	eL, eR, m = F.eL, F.eR, F.m
	inner = lambda e, s: e[0] + s * F.ew * 0.45  # inner brow x (towards the nose)
	if expr == 'neutral':
		return img
	if expr == 'focused':
		img = warp(img, [
			('move', inner(eL, 1), F.by, 0.8 * u, 1.3 * u, 2.6 * u), ('move', inner(eR, -1), F.by, -0.8 * u, 1.3 * u, 2.6 * u),
			('move', eL[0] - F.ew * 0.4, F.by, 0, 0.6 * u, 2.4 * u), ('move', eR[0] + F.ew * 0.4, F.by, 0, 0.6 * u, 2.4 * u),
			('scale', eL[0], eL[1], 1.0, 0.75, 2.2 * u), ('scale', eR[0], eR[1], 1.0, 0.75, 2.2 * u),
			('scale', m[0], m[1], 0.88, 0.85, 3.2 * u)])
		return paint(img, lambda d, s: [d.rectangle(s(e[0] - F.ew / 2, e[1] - F.eh * 0.9, e[0] + F.ew / 2, e[1] - F.eh * 0.25), fill=col(F.lid, 0.85)) for e in (eL, eR)])
	if expr == 'worried':
		return warp(img, [
			('move', inner(eL, 1), F.by, 0.3 * u, -1.6 * u, 2.2 * u), ('move', inner(eR, -1), F.by, -0.3 * u, -1.6 * u, 2.2 * u),
			('move', eL[0] - F.ew * 0.5, F.by + 0.5, 0, 0.7 * u, 2.2 * u), ('move', eR[0] + F.ew * 0.5, F.by + 0.5, 0, 0.7 * u, 2.2 * u),
			('scale', eL[0], eL[1], 1.05, 1.15, 2.0 * u), ('scale', eR[0], eR[1], 1.05, 1.15, 2.0 * u),
			('move', m[0] - F.mw, m[1], 0, 1.0 * u, 1.8 * u), ('move', m[0] + F.mw, m[1], 0, 1.0 * u, 1.8 * u)])
	if expr == 'fear':
		img = warp(img, [
			('move', eL[0], F.by, 0, -2.2 * u, 3.0 * u), ('move', eR[0], F.by, 0, -2.2 * u, 3.0 * u),
			('scale', eL[0], eL[1], 1.35, 1.6, 2.4 * u), ('scale', eR[0], eR[1], 1.35, 1.6, 2.4 * u),
			('move', m[0], m[1] + 2 * u, 0, 1.6 * u, 3.5 * u), ('scale', m[0], m[1], 0.85, 1.0, 3.0 * u)])
		# white showing around the iris, a dark open mouth
		def p(d, s):
			for e in (eL, eR):
				d.ellipse(s(e[0] - F.ew * 0.5, e[1] - F.eh * 0.8, e[0] + F.ew * 0.5, e[1] + F.eh * 0.8), fill=col(np.clip(F.skin * 1.45, 0, 0.82), 0.8))
				d.ellipse(s(e[0] - F.eh * 0.45, e[1] - F.eh * 0.45, e[0] + F.eh * 0.45, e[1] + F.eh * 0.45), fill=col(np.array([0.12, 0.09, 0.08])))
			d.ellipse(s(m[0] - F.mw * 0.6, m[1] - 0.6 * u, m[0] + F.mw * 0.6, m[1] + 3.2 * u), fill=col(F.dark, 0.95))
			d.rectangle(s(m[0] - F.mw * 0.45, m[1] - 0.4 * u, m[0] + F.mw * 0.45, m[1] + 0.2 * u), fill=col(np.array([0.75, 0.72, 0.66]), 0.8))
		return paint(img, p)
	if expr == 'smile':  # forced: the mouth smiles, the eyes don't
		img = warp(img, [
			('move', m[0] - F.mw, m[1], -0.9 * u, -1.5 * u, 1.9 * u), ('move', m[0] + F.mw, m[1], 0.9 * u, -1.5 * u, 1.9 * u),
			('move', eL[0], eL[1] + 3.5 * u, 0, -0.8 * u, 2.5 * u), ('move', eR[0], eR[1] + 3.5 * u, 0, -0.8 * u, 2.5 * u),
			('move', inner(eL, 1), F.by, 0.2 * u, -0.7 * u, 2.0 * u), ('move', inner(eR, -1), F.by, -0.2 * u, -0.7 * u, 2.0 * u)])
		return paint(img, lambda d, s: d.line(s(m[0] - F.mw * 0.8, m[1] - 0.6 * u, m[0], m[1] + 0.3 * u, m[0] + F.mw * 0.8, m[1] - 0.6 * u), fill=col(F.dark, 0.7), width=max(1, int(SS * 0.7))))
	if expr == 'sleepy':
		img = warp(img, [('move', eL[0], F.by, 0, 0.8 * u, 3.0 * u), ('move', eR[0], F.by, 0, 0.8 * u, 3.0 * u),
			('move', m[0], m[1], 0, 0.4 * u, 3.0 * u)])
		def p(d, s):
			for e in (eL, eR):
				d.rectangle(s(e[0] - F.ew * 0.6, e[1] - F.eh * 1.1, e[0] + F.ew * 0.6, e[1] + F.eh * 0.15), fill=col(F.lid, 0.95))
				d.line(s(e[0] - F.ew * 0.55, e[1] + F.eh * 0.15, e[0] + F.ew * 0.55, e[1] + F.eh * 0.2), fill=col(F.dark, 0.8), width=max(1, int(SS * 0.8)))
		return paint(img, p)
	if expr == 'shh':  # whisper: pursed lips, wary eyes
		img = warp(img, [('scale', m[0], m[1], 0.55, 1.15, 3.0 * u), ('move', m[0], m[1], 0, 0.3 * u, 2.0 * u),
			('scale', eL[0], eL[1], 1.0, 0.85, 2.0 * u), ('scale', eR[0], eR[1], 1.0, 0.85, 2.0 * u),
			('move', inner(eL, 1), F.by, 0.4 * u, 0.5 * u, 2.0 * u), ('move', inner(eR, -1), F.by, -0.4 * u, 0.5 * u, 2.0 * u)])
		return paint(img, lambda d, s: d.ellipse(s(m[0] - 1.1 * u, m[1] - 0.6 * u, m[0] + 1.1 * u, m[1] + 0.9 * u), fill=col(F.dark, 0.9)))
	if expr == 'talk':  # mid-word: jaw down a little, mouth open (swapped with neutral for lip flap)
		img = warp(img, [('move', m[0], m[1] + 2 * u, 0, 1.0 * u, 3.2 * u)])
		return paint(img, lambda d, s: d.ellipse(s(m[0] - F.mw * 0.55, m[1] - 0.3 * u, m[0] + F.mw * 0.55, m[1] + 1.9 * u), fill=col(F.dark, 0.9)))
	raise ValueError(expr)


def save(img, path):
	os.makedirs(os.path.dirname(path), exist_ok=True)
	Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(path)


# --------------------------------------------------------------------------- Nico
NICO = dict(hair='#151314', skin='#9c7051', shade='#4d3326', tee='#364a48', jeans='#2e313a', shoes='#7c7975')


def build_nico(src):
	im = np.array(Image.open(os.path.join(src, 'male_casual', 'male_casual', 'man_tex.png')).convert('RGB')) / 255
	before = im.copy()
	r, g, b = im[..., 0], im[..., 1], im[..., 2]
	L = lum(im)
	sh = im.shape
	skinish = (r > g) & (g > b * 0.95) & (r - b > 0.12) & (L > 0.33)
	teal = (g > r + 0.02) & (b > r) & ~((b - g) > 0.09)
	blue = (b > r + 0.1) & ((b - g) > 0.05)
	shirt = (rect(sh, 0, 0, 146, 80) | rect(sh, 90, 110, 176, 168)) & teal & ~skinish
	jeans = rect(sh, 0, 72, 150, 256) & blue
	head = rect(sh, 144, 0, 256, 92)
	hair = head & (L < 0.36) & ~skinish & ~rect(sh, 150, 52, 196, 100)
	shoes = rect(sh, 168, 200, 256, 256) & (L < 0.45) & ~skinish
	# beard -> stubble: lift the dark beard texels towards the surrounding skin
	face = rect(sh, 150, 54, 197, 100)
	skin_med = np.median(im[skinish & head], axis=0)
	# soft: the darker a texel is than the skin, the more it is lifted (keeps a shadow of stubble)
	Ls = lum(skin_med[None, None, :])[0, 0]
	dk = np.clip((Ls - L) / Ls * 1.6, 0, 1)[..., None] * 0.92
	lips = (r > g + 0.1) & (L > 0.3)
	beard = face & ~lips & rect(sh, 148, 57, 199, 104)
	stub = skin_med * 0.86
	im[beard] = (im + (stub - im) * dk)[beard]
	im = remap(im, shirt, hexc(NICO['tee']))
	im = remap(im, jeans, hexc(NICO['jeans']))
	im = remap(im, hair, hexc(NICO['hair']), strength=0.92)
	im = remap(im, shoes, hexc(NICO['shoes']), strength=0.8)
	r, g, b = im[..., 0], im[..., 1], im[..., 2]
	L2 = lum(im)
	skin_all = (((r > g) & (g > b * 0.9) & (r - b > 0.1) & (L > 0.25)) | beard) & ~shirt & ~jeans & ~hair
	im = remap(im, skin_all, hexc(NICO['skin']), ref=float(np.median(L2[skin_all])), strength=0.85)
	skin = np.median(im[skin_all & face], axis=0)
	F = Face(eyeL=(161.5, 45.2), eyeR=(182.6, 45.2), eye_w=7.5, eye_h=2.4, brow_y=41.0, mouth=(172.8, 68.0), mouth_w=6.0,
		skin=skin, lid=skin * 0.82, lip=np.array([0.55, 0.36, 0.32]), dark=np.array([0.16, 0.08, 0.07]))
	return before, im, F


# --------------------------------------------------------------------------- Bea
BEA = dict(blouse='#d9d6cc', skirt='#232a45', socks='#d8d6d0', skin='#b88a68', hair='#141212')


def build_bea(src):
	im = np.array(Image.open(os.path.join(src, 'Schoolgirl', 'PSXJapaneseSchoolgirl', 'T_Girl.png')).convert('RGB')) / 255
	before = im.copy()
	r, g, b = im[..., 0], im[..., 1], im[..., 2]
	L = lum(im)
	sh = im.shape
	skinish = (r > g) & (g > b * 0.92) & (r - b > 0.08) & (L > 0.45)
	slate = (b >= r - 0.02) & ~skinish  # the blazer and skirt are blue-grey
	beige = (r > b + 0.08) & (L > 0.35) & ~skinish & rect(sh, 390, 50, 512, 215)
	# the blazer becomes the white blouse; the vest goes white too; the pleated skirt goes navy
	skirt = (rect(sh, 0, 70, 166, 160) | rect(sh, 255, 40, 432, 148)) & slate
	blazer = slate & ~skirt & ~rect(sh, 150, 330, 512, 512) & ~rect(sh, 0, 300, 160, 512)
	sleeves_lower = rect(sh, 0, 300, 160, 512) & slate  # the trousers-like island under the skirt is the blazer back
	im = remap(im, skirt, hexc(BEA['skirt']))
	im = remap(im, blazer | sleeves_lower, hexc(BEA['blouse']), strength=0.95, contrast=0.45)
	im = remap(im, beige, hexc(BEA['blouse']), strength=0.95, contrast=0.45)
	skin_all = (r > g) & (g > b * 0.9) & (r - b > 0.06) & (L > 0.4) & ~beige
	im = remap(im, skin_all, hexc(BEA['skin']), ref=float(np.median(L[skin_all])), strength=0.8)
	face = rect(sh, 430, 440, 512, 512)
	skin = np.median(im[skin_all & face], axis=0)
	F = Face(eyeL=(452.8, 464.6), eyeR=(482.8, 464.6), eye_w=7.0, eye_h=2.2, brow_y=458.0, mouth=(467.8, 483.8), mouth_w=7.0,
		skin=skin, lid=skin * 0.84, lip=np.array([0.66, 0.42, 0.40]), dark=np.array([0.20, 0.10, 0.10]))
	F.u = 1.25
	hi = up(im)
	hi = paint(hi, lambda d, s_: [d.ellipse(s_(e[0] - 1.1, e[1] - 1.1, e[0] + 1.1, e[1] + 1.1), fill=col(np.array([0.2, 0.13, 0.1]), 0.85)) for e in (F.eL, F.eR)])
	im = down(hi, (im.shape[1], im.shape[0]))
	return before, im, F


def main():
	src = sys.argv[1]
	meta = {}
	for name, fn in (('nico', build_nico), ('bea', build_bea)):
		before, base, F = fn(src)
		size = (base.shape[1], base.shape[0])
		save(before, os.path.join(OUT, name, 'tex_source.png'))
		hi = up(base)
		for e in EXPRESSIONS:
			save(down(expression(hi, F, e), size), os.path.join(OUT, name, f'tex_{e}.png'))
		meta[name] = {'size': size, 'eyeL': F.eL.tolist(), 'eyeR': F.eR.tolist(), 'mouth': F.m.tolist(), 'expressions': EXPRESSIONS}
	with open(os.path.join(OUT, 'faces.json'), 'w') as f:
		json.dump(meta, f, indent=1)
	print('wrote', OUT)


if __name__ == '__main__':
	main()
