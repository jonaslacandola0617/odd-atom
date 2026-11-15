"""TRANSFERS PSX look test: convert the chosen models from the user's PSX packs to GLB for three.js.

Headless Blender (bpy 5.3). The packs' licences are unconfirmed (see
docs/stories/original-series/transfers/PSX-ASSETS.md), so all output goes to the git-ignored
public/assets/3d/psx-local/. Only this script is committed.

  python3 assets3d/characters/psx/convert_packs.py <extracted-packs-dir>

GLB models from the packs (OFFICE, URBAN, PSX Derelict Furniture) already embed their textures
and are copied as they are. FBX models get their PNG wired in and are exported. Textures larger
than MAX_TEX are scaled down (nearest), as PS1-era texture pages were small.
"""
import os
import shutil
import sys

import bpy

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT = os.path.join(ROOT, 'public', 'assets', '3d', 'psx-local')
MAX_TEX = 256

# (output name, path inside the packs dir, texture png or None)
FBX = [
	('nico_base', 'male_casual/male_casual/male_casual.fbx', 'male_casual/male_casual/man_tex.png'),
	('bea_base', 'Schoolgirl/PSXJapaneseSchoolgirl/SkM_SchoolGirl.fbx', 'Schoolgirl/PSXJapaneseSchoolgirl/T_Girl.png'),
	('tv', 'RetroModelPack/Models/Tv/Tv.fbx', 'RetroModelPack/Models/Tv/Tv.png'),
	('clock', 'RetroModelPack/Models/Clock/Clock.fbx', 'RetroModelPack/Models/Clock/Clock.png'),
	('table_old', 'RetroModelPack/Models/Tabel/Tabel.fbx', 'RetroModelPack/Models/Tabel/Tabel.png'),
	('box', 'StreetFurniture/street/Box/Box.fbx', 'StreetFurniture/street/Box/Box.png'),
	('floppy', 'StreetFurniture/street/Floppy/Floppy.fbx', 'StreetFurniture/street/Floppy/Floppy.png'),
	('trashcan', 'StreetFurniture/street/TrashCan/TrashCan.fbx', 'StreetFurniture/street/TrashCan/TrashCan.png'),
	('conditioner', 'StreetFurniture/street/Conditioner/Conditioner.fbx', 'StreetFurniture/street/Conditioner/Conditioner.png'),
	('dorihome', 'DoriHome/DoriHome.fbx', None),
	('figure_base', 'CharactersPsx/Characters_psx/Models/Male/Character_29.fbx', None),  # rendered as a black silhouette only
]
GLB = [
	('desk', 'OFFICE/OFFICE/desks/desk1_alt_weathered.glb'),
	('desklamp', 'OFFICE/OFFICE/extras/square_desklamp.glb'),
	('monitor', 'OFFICE/OFFICE/computers/computer_monitor.glb'),
	('pc', 'OFFICE/OFFICE/computers/computer_tower.glb'),
	('keyboard', 'OFFICE/OFFICE/computers/computer_keyboard.glb'),
	('chair', 'OFFICE/OFFICE/chairs/office_chair_black_alt.glb'),
	('bookcase', 'OFFICE/OFFICE/book_things/book_case_with_back.glb'),
	('binders', 'OFFICE/OFFICE/book_things/file_binder_alt3.glb'),
	('cabinet', 'OFFICE/OFFICE/file_cabinets/file_cabinet_small.glb'),
	('wallclock', 'OFFICE/OFFICE/extras/wall_clock.glb'),
	('mug', 'OFFICE/OFFICE/extras/mug_alt.glb'),
	('shelf', 'DerelictFurniture/PSX-Derelict-Furniture-Standard/glb/shelf.glb'),
	('chair_old', 'DerelictFurniture/PSX-Derelict-Furniture-Standard/glb/chair.glb'),
	('couch_old', 'DerelictFurniture/PSX-Derelict-Furniture-Standard/glb/couch.glb'),
	('fridge_old', 'DerelictFurniture/PSX-Derelict-Furniture-Standard/glb/fridge.glb'),
	('streetlight', 'URBAN/URBAN/Traffic lights/street_light.glb'),
	('trash_urban', 'URBAN/URBAN/Litter/TrashCan/trash_can_alt1_full.glb'),
]


def find(src, rel):
	p = os.path.join(src, rel)
	if os.path.exists(p):
		return p
	# names inside the packs vary a little (sub-folders); search by file name
	name = os.path.basename(rel)
	for d, _, fs in os.walk(os.path.join(src, rel.split('/')[0])):
		if name in fs:
			return os.path.join(d, name)
	raise FileNotFoundError(rel)


def wire_texture(png):
	img = bpy.data.images.load(png)
	for m in bpy.data.materials:
		m.use_nodes = True
		nt = m.node_tree
		bsdf = [n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED']
		if not bsdf:
			continue
		t = nt.nodes.new('ShaderNodeTexImage')
		t.image = img
		t.interpolation = 'Closest'
		nt.links.new(t.outputs['Color'], bsdf[0].inputs['Base Color'])
		bsdf[0].inputs['Roughness'].default_value = 1.0
		bsdf[0].inputs['Metallic'].default_value = 0.0


def shrink_images():
	for im in list(bpy.data.images):
		if not im.has_data and im.size[0] == 0:
			bpy.data.images.remove(im)  # broken absolute path from the author's machine
			continue
		if im.size[0] > MAX_TEX or im.size[1] > MAX_TEX:
			k = MAX_TEX / max(im.size)
			im.scale(max(8, int(im.size[0] * k)), max(8, int(im.size[1] * k)))
		im.pack()


def main():
	src = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else sys.argv[1]
	os.makedirs(OUT, exist_ok=True)
	only = set(sys.argv[sys.argv.index('--') + 2:]) if '--' in sys.argv else set()
	for name, rel in GLB:
		if only and name not in only:
			continue
		shutil.copyfile(find(src, rel), os.path.join(OUT, name + '.glb'))
	for name, rel, tex in FBX:
		if only and name not in only:
			continue
		bpy.ops.wm.read_factory_settings(use_empty=True)
		bpy.ops.import_scene.fbx(filepath=find(src, rel))
		if tex:
			wire_texture(find(src, tex))
		shrink_images()
		bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, name + '.glb'), export_format='GLB', export_animations=False,
			export_apply=False, export_yup=True)
		print('exported', name)


if __name__ == '__main__':
	main()
