"""TRANSFERS PSX faces: export the ChatGPT face templates, and paste painted faces back into the textures.

PS1-style expressions are whole-texture swaps: only the face square of the body texture changes.
This script works on that square (FACE_BOX, in texels of the native texture).

  # 1. templates for the user (needs bpy 5.3 for the UV mask; reads the git-ignored restyled textures)
  python3 assets3d/characters/psx/face_templates.py templates <extracted-packs-dir>
     -> assets3d/psx-local/face-templates/<who>-face-template.png      (1024x1024, the face to paint over)
        assets3d/psx-local/face-templates/<who>-face-guide.png         (same, with the UV mesh, eye and mouth lines)
        assets3d/psx-local/face-templates/<who>-face-mask.png          (white = the part that is pasted back)

  # 2. after the user shares ChatGPT's faces (nico-neutral.png, nico-fear.png, ... 1024x1024)
  python3 assets3d/characters/psx/face_templates.py composite <folder-with-the-pngs>
     -> public/assets/3d/psx-local/<who>/tex_<expr>.png (the procedural version is kept as tex_<expr>_auto.png)

Everything written is derived from the user's PSX packs (licences unconfirmed), so it stays in
git-ignored folders.
"""
import json
import os
import shutil
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
TEX = os.path.join(ROOT, 'public', 'assets', '3d', 'psx-local')
TPL = os.path.join(ROOT, 'assets3d', 'psx-local', 'face-templates')
SIZE = 1024
EXPRESSIONS = ['neutral', 'focused', 'worried', 'fear', 'smile', 'sleepy', 'shh']

CHARS = {
	# box = (x0, y0, x1, y1) on the native texture; fbx/tex inside the extracted packs
	'nico': dict(box=(130, 12, 218, 100), fbx='male_casual/male_casual/male_casual.fbx', tex=256, band=0.13,
		eyes=[(161.5, 45.2), (182.6, 45.2)], mouth=(172.8, 68.0)),
	'bea': dict(box=(424, 424, 512, 512), fbx='Schoolgirl/PSXJapaneseSchoolgirl/SkM_SchoolGirl.fbx', tex=512, band=0.17,
		eyes=[(452.8, 464.6), (482.8, 464.6)], mouth=(467.8, 483.8)),
}


def front_polys(fbx, band):
	"""UV polygons (0..1) of the head's front-facing faces, in rest pose."""
	import bpy
	bpy.ops.wm.read_factory_settings(use_empty=True)
	bpy.ops.import_scene.fbx(filepath=fbx)
	for o in bpy.data.objects:
		if o.type == 'ARMATURE':
			o.data.pose_position = 'REST'
	bpy.context.view_layer.update()
	m = [o for o in bpy.data.objects if o.type == 'MESH'][0]
	me = m.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh()
	W, N = m.matrix_world, m.matrix_world.to_3x3()
	zs = [(W @ v.co).z for v in me.vertices]
	zmax, H = max(zs), max(zs) - min(zs)
	uv = me.uv_layers.active.data
	out = []
	for p in me.polygons:
		if (W @ p.center).z < zmax - band * H:
			continue
		if (N @ p.normal).normalized().y < -0.35:  # Blender front is -Y for both models
			out.append([(uv[li].uv.x, 1 - uv[li].uv.y) for li in p.loop_indices])
	return out


def templates(packs):
	os.makedirs(TPL, exist_ok=True)
	meta = {}
	for who, c in CHARS.items():
		x0, y0, x1, y1 = c['box']
		k = SIZE / (x1 - x0)
		tex = Image.open(os.path.join(TEX, who, 'tex_neutral.png')).convert('RGB')
		crop = tex.crop(c['box']).resize((SIZE, SIZE), Image.NEAREST)
		crop.save(os.path.join(TPL, f'{who}-face-template.png'))
		polys = front_polys(os.path.join(packs, c['fbx']), c['band'])
		T = c['tex']
		mask = Image.new('L', (T, T), 0)
		dm = ImageDraw.Draw(mask)
		for poly in polys:
			dm.polygon([(u * T, v * T) for u, v in poly], fill=255)
		mask = mask.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7))  # close the gaps (lips face down)
		mask = mask.crop(c['box'])
		mask.save(os.path.join(TEX, who, 'face_mask_native.png'))
		mask.resize((SIZE, SIZE), Image.NEAREST).save(os.path.join(TPL, f'{who}-face-mask.png'))
		guide = crop.copy()
		d = ImageDraw.Draw(guide)
		for poly in polys:
			pts = [((u * T - x0) * k, (v * T - y0) * k) for u, v in poly]
			d.line(pts + [pts[0]], fill=(255, 0, 255), width=2)
		for ex, ey in c['eyes']:
			d.line([((ex - x0) * k - 60, (ey - y0) * k), ((ex - x0) * k + 60, (ey - y0) * k)], fill=(0, 255, 255), width=3)
		mx, my = c['mouth']
		d.line([((mx - x0) * k - 80, (my - y0) * k), ((mx - x0) * k + 80, (my - y0) * k)], fill=(255, 255, 0), width=3)
		guide.save(os.path.join(TPL, f'{who}-face-guide.png'))
		meta[who] = {'box': c['box'], 'texture': T, 'template_px': SIZE, 'texels_per_template_px': 1 / k}
	with open(os.path.join(TPL, 'templates.json'), 'w') as f:
		json.dump(meta, f, indent=1)
	print('wrote', TPL)


def composite(folder):
	for who, c in CHARS.items():
		x0, y0, x1, y1 = c['box']
		w, h = x1 - x0, y1 - y0
		mask_p = os.path.join(TEX, who, 'face_mask_native.png')
		if not os.path.exists(mask_p):
			sys.exit('run "templates" first')
		mask = Image.open(mask_p).convert('L').filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
		base = Image.open(os.path.join(TEX, who, 'tex_neutral.png')).convert('RGB')
		if os.path.exists(os.path.join(TEX, who, 'tex_neutral_auto.png')):
			base = Image.open(os.path.join(TEX, who, 'tex_neutral_auto.png')).convert('RGB')
		for e in EXPRESSIONS:
			src = os.path.join(folder, f'{who}-{e}.png')
			if not os.path.exists(src):
				continue
			out = os.path.join(TEX, who, f'tex_{e}.png')
			auto = os.path.join(TEX, who, f'tex_{e}_auto.png')
			if os.path.exists(out) and not os.path.exists(auto):
				shutil.copyfile(out, auto)
			face = Image.open(src).convert('RGB').resize((w, h), Image.BOX)
			tex = base.copy()
			region = tex.crop(c['box'])
			region = Image.composite(face, region, mask)
			tex.paste(region, (x0, y0))
			tex.save(out)
			print('composited', who, e)


if __name__ == '__main__':
	if sys.argv[1] == 'templates':
		templates(sys.argv[2])
	elif sys.argv[1] == 'composite':
		composite(sys.argv[2])
	else:
		sys.exit(__doc__)
