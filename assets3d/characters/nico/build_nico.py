"""Build NICO (TRANSFERS, lead) procedurally in headless Blender.

Run:  <venv-with-bpy>/bin/python -I assets3d/characters/nico/build_nico.py -- <out_dir> [--sheet]
Outputs nico.glb (rigged, A-pose) and, with --sheet, turnaround renders (Cycles CPU).
Original design; no third-party assets.
"""
import bpy, bmesh, math, sys, os
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else '.')
SHEET = '--sheet' in argv
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------------------------------------------------------------- materials
def mat(name, rgb, rough=0.8, image=None):
    m = bpy.data.materials.new(name)
    try: m.use_nodes = True
    except Exception: pass
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    bsdf.inputs['Roughness'].default_value = rough
    if image is not None:
        tex = m.node_tree.nodes.new('ShaderNodeTexImage')
        tex.image = image
        tex.interpolation = 'Closest'
        m.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    return m

def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

SKIN = srgb('#a8724f'); SKIN_D = srgb('#7d5038')
M_SKIN = mat('skin', SKIN, 0.6)
M_SHIRT = mat('shirt', srgb('#2f4f4c'), 0.95)
M_JEANS = mat('jeans', srgb('#262c38'), 0.9)
M_SHOE = mat('shoe', srgb('#6b6a66'), 0.8)
M_SOLE = mat('sole', srgb('#bdb6a8'), 0.8)
M_HAIR = mat('hair', srgb('#141110'), 0.7)
M_FRAME = mat('frames', srgb('#0b0b0c'), 0.35)
M_WATCH = mat('watch', srgb('#101010'), 0.4)

# ---------------------------------------------------------------- face texture (pixel-painted, 64x64)
FW = FH = 64
def hx(h):
    h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) / 255 for i in (0, 2, 4))

def face_image(name, expr='neutral'):
    SK = hx('#a8724f')
    px = [list(SK) + [1] for _ in range(FW * FH)]
    def put(x, y, c, a=1.0):
        if 0 <= x < FW and 0 <= y < FH:
            p = px[y * FW + x]
            for i in range(3): p[i] = p[i] * (1 - a) + c[i] * a
    def rect(x0, y0, x1, y1, c, a=1.0):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): put(x, y, c, a)
    dark = hx('#1a1210'); white = hx('#d9d2c4'); bag = hx('#7d5038'); lip = hx('#7a4a3a')
    # uv: x 0..63 left->right of face as seen from front; y 0 = chin, 63 = crown
    stub = hx('#4a3428')
    for y in range(8, 22):                  # beard shadow (jaw + upper lip), dithered
        for x in range(14, 50):
            if (x + y) % 2 == 0 and not (y > 15 and 24 <= x <= 39 and y < 17):
                put(x, y, stub, 0.55)
    rect(26, 20, 37, 20, stub, 0.6)         # moustache shadow
    for side in (-1, 1):
        cx = 32 + side * 10
        if expr == 'fear':
            rect(cx - 3, 32, cx + 2, 35, white); rect(cx - 1, 33, cx, 34, dark)
            rect(cx - 4, 39, cx + 3, 39, dark)                       # raised brow
        elif expr == 'focused':
            rect(cx - 3, 33, cx + 2, 33, white); rect(cx - 1, 33, cx, 33, dark)
            rect(cx - 3, 34, cx + 2, 34, dark)                       # heavy lid
            rect(cx - 4, 36, cx + 3, 36, dark); put(cx - side * 4, 35, dark)
        else:  # neutral / tired
            rect(cx - 3, 32, cx + 2, 33, white); rect(cx - 1, 32, cx, 33, dark)
            rect(cx - 3, 34, cx + 2, 34, dark)                       # upper lid line
            rect(cx - 4, 37, cx + 3, 37, dark); rect(cx - 3, 38, cx + 2, 38, dark, 0.5)
        rect(cx - 3, 30, cx + 2, 31, bag, 0.8)                       # under-eye bags
    if expr == 'fear':
        rect(28, 13, 35, 16, dark); rect(29, 16, 34, 16, lip)
    else:
        rect(27, 15, 36, 15, lip); rect(28, 14, 35, 14, dark, 0.7)
    flat = [c for p in px for c in p]
    img = bpy.data.images.new(name, FW, FH, alpha=False)
    img.pixels.foreach_set(flat)
    img.pack()
    return img

FACE_IMGS = {e: face_image('nico_face_' + e, e) for e in ('neutral', 'focused', 'fear')}
M_FACE = mat('face', SKIN, 0.6, FACE_IMGS['neutral'])

# ---------------------------------------------------------------- body: skin-modifier graph (character faces -Y)
V = {}; E = []; R = {}
def v(name, co, r):
    V[name] = Vector(co); R[name] = r
def e(a, b): E.append((a, b))

v('pelvis', (0, 0.0, 0.95), (0.165, 0.115))
v('spine', (0, 0.0, 1.08), (0.152, 0.118))
v('belly', (0, -0.01, 1.17), (0.158, 0.125))
v('chest', (0, 0.0, 1.32), (0.185, 0.122))
v('neck0', (0, 0.012, 1.44), (0.062, 0.06))
v('neck1', (0, 0.008, 1.51), (0.054, 0.054))
e('pelvis', 'spine'); e('spine', 'belly'); e('belly', 'chest'); e('chest', 'neck0'); e('neck0', 'neck1')
for s in (1, -1):
    k = 'L' if s > 0 else 'R'
    v('clav' + k, (s * 0.135, 0.015, 1.405), (0.07, 0.062))
    v('shoulder' + k, (s * 0.205, 0.02, 1.385), (0.058, 0.058))
    v('elbow' + k, (s * 0.262, 0.035, 1.12), (0.046, 0.045))
    v('wrist' + k, (s * 0.295, 0.005, 0.89), (0.033, 0.026))
    v('palm' + k, (s * 0.305, -0.002, 0.845), (0.026, 0.042))
    e('chest', 'clav' + k); e('clav' + k, 'shoulder' + k); e('shoulder' + k, 'elbow' + k)
    e('elbow' + k, 'wrist' + k); e('wrist' + k, 'palm' + k)
    # four fingers along the palm's front-back spread, curled slightly
    for i, dy in enumerate((-0.028, -0.010, 0.008, 0.024)):
        ln = (0.042, 0.048, 0.045, 0.036)[i]
        base = Vector((s * 0.308, dy, 0.815))
        names = []
        for j, f in enumerate((0.0, 0.45, 0.8, 1.0)):
            n = f'f{i}{j}{k}'
            co = base + Vector((s * 0.004 * f, -0.004 * f, -ln * f * 1.25))
            v(n, co, (0.0098 - 0.0016 * f, 0.0098 - 0.0016 * f)); names.append(n)
        e('palm' + k, names[0])
        for a, b in zip(names, names[1:]): e(a, b)
    t0 = Vector((s * 0.300, -0.030, 0.862))
    for j, f in enumerate((0.0, 0.5, 1.0)):
        n = f't{j}{k}'
        v(n, t0 + Vector((s * 0.008 * f, -0.022 * f, -0.034 * f)), (0.010 - 0.002 * f,) * 2)
    e('palm' + k, f't0{k}'); e(f't0{k}', f't1{k}'); e(f't1{k}', f't2{k}')
    v('hip' + k, (s * 0.09, 0.0, 0.9), (0.094, 0.098))
    v('thigh' + k, (s * 0.097, -0.005, 0.7), (0.08, 0.082))
    v('knee' + k, (s * 0.1, -0.008, 0.5), (0.06, 0.062))
    v('calf' + k, (s * 0.1, 0.008, 0.33), (0.06, 0.062))
    v('ankle' + k, (s * 0.1, 0.012, 0.1), (0.05, 0.05))
    v('ball' + k, (s * 0.104, -0.085, 0.038), (0.054, 0.04))
    v('toe' + k, (s * 0.106, -0.155, 0.036), (0.048, 0.034))
    e('pelvis', 'hip' + k); e('hip' + k, 'thigh' + k); e('thigh' + k, 'knee' + k); e('knee' + k, 'calf' + k)
    e('calf' + k, 'ankle' + k); e('ankle' + k, 'ball' + k); e('ball' + k, 'toe' + k)

names = list(V)
me = bpy.data.meshes.new('nico_body')
me.from_pydata([V[n] for n in names], [(names.index(a), names.index(b)) for a, b in E], [])
body = bpy.data.objects.new('nico_body', me)
scene.collection.objects.link(body)
skin_mod = body.modifiers.new('Skin', 'SKIN')
skin_mod.use_smooth_shade = True
sv = me.skin_vertices[0].data
for i, n in enumerate(names):
    sv[i].radius = R[n]
    sv[i].use_root = (n == 'pelvis')
sub = body.modifiers.new('Sub', 'SUBSURF'); sub.levels = 2; sub.render_levels = 2
bpy.context.view_layer.objects.active = body; body.select_set(True)
bpy.ops.object.modifier_apply(modifier='Skin')
bpy.ops.object.modifier_apply(modifier='Sub')

# clean edge loops where clothing ends, so zones follow straight lines
bm = bmesh.new(); bm.from_mesh(body.data)
for zc in (0.028, 0.115, 0.885, 0.925, 0.975, 1.24, 1.465):
    geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(0, 0, zc), plane_no=(0, 0, 1))
bm.to_mesh(body.data); bm.free()
# material zones by position
for m in (M_SKIN, M_SHIRT, M_JEANS, M_SHOE, M_SOLE, M_WATCH):
    body.data.materials.append(m)
def zone(c):
    ax = abs(c.x)
    if c.z < 0.028: return 4
    if c.z < 0.115 and ax > 0.04: return 3
    if c.z < 0.975 and ax < 0.215 and c.z < 0.99: return 2           # jeans (legs + seat)
    if ax > 0.17:                                                    # arm
        if c.z > 1.22: return 1                                      # short sleeve
        if ax > 0.26 and 0.885 < c.z < 0.925 and c.x > 0: return 5   # watch (left wrist)
        return 0
    if c.z > 1.465: return 0                                         # neck
    return 1
for p in body.data.polygons:
    p.material_index = zone(p.center)
bpy.ops.object.shade_smooth()

# cloth shells (separate meshes with real thickness: hems and cuffs read as geometry)
def shell(name, zone_ids, thick, push):
    bm = bmesh.new(); bm.from_mesh(body.data)
    drop = [f for f in bm.faces if f.material_index not in zone_ids]
    bmesh.ops.delete(bm, geom=drop, context='FACES')
    for vt in bm.verts: vt.co += vt.normal * push
    m = bpy.data.meshes.new(name); bm.to_mesh(m); bm.free()
    for mi, mt in enumerate(body.data.materials): m.materials.append(mt)
    o = bpy.data.objects.new(name, m); scene.collection.objects.link(o)
    sol = o.modifiers.new('Solid', 'SOLIDIFY'); sol.thickness = thick; sol.offset = 1
    for p in o.data.polygons: p.use_smooth = True
    return o
shirt = shell('nico_shirt', {1}, 0.006, 0.006)
jeans = shell('nico_jeans', {2}, 0.004, 0.004)

# ---------------------------------------------------------------- head
HC = Vector((0, 0.004, 1.612))
bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, radius=1, location=HC)
head = bpy.context.active_object; head.name = 'nico_head'
bm = bmesh.new(); bm.from_mesh(head.data)
RX, RY, RZ = 0.079, 0.098, 0.112
for vt in bm.verts:
    x, y, z = vt.co
    t = (z + 1) / 2                          # 0 chin .. 1 crown
    w = 1.0
    if z < 0: w = 1 - 0.22 * (-z) ** 1.6   # narrow jaw / chin
    xx, yy, zz = x * RX * w, y * RY, z * RZ
    if z < -0.2 and y < 0: yy *= 0.9 + 0.1 * (1 + z)   # flatten front of jaw slightly
    if y > 0: yy *= 1.0 + 0.08 * max(0, z)               # occiput
    # nose
    d = math.exp(-((x / 0.13) ** 2 + ((z + 0.03) / 0.17) ** 2))
    if y < 0: yy -= 0.034 * d * (-y) ** 3
    # brow ridge
    db = math.exp(-((z - 0.22) / 0.07) ** 2) * math.exp(-(x / 0.6) ** 2)
    if y < 0: yy -= 0.008 * db * (-y)
    # eye sockets
    for sx in (-0.42, 0.42):
        de = math.exp(-(((x - sx) / 0.2) ** 2 + ((z - 0.12) / 0.11) ** 2))
        if y < 0: yy += 0.006 * de
    vt.co = Vector((xx, yy, zz))
bm.to_mesh(head.data); bm.free()
# front-projected UV for the painted face
head.data.uv_layers.new(name='UV')
uvl = head.data.uv_layers.active.data
for poly in head.data.polygons:
    for li in poly.loop_indices:
        co = head.data.vertices[head.data.loops[li].vertex_index].co
        u = 0.5 + co.x / 0.15                 # 0.15 m across the face texture
        vv = (co.z + RZ) / (2 * RZ)
        if co.y > 0.02: u, vv = 0.02, 0.5      # back/sides: plain skin texel column
        uvl[li].uv = (min(max(u, 0), 1), min(max(vv, 0), 1))
head.data.materials.append(M_FACE)
bpy.ops.object.shade_smooth()

# ears
for s in (1, -1):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=1,
                                         location=HC + Vector((s * 0.075, 0.012, 0.0)))
    ear = bpy.context.active_object; ear.scale = (0.01, 0.019, 0.028); ear.name = 'nico_ear_' + 'LR'[s < 0]
    ear.data.materials.append(M_SKIN); bpy.ops.object.shade_smooth()

# hair: shell of the head above a hairline, with clumps
bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, radius=1, location=HC)
hair = bpy.context.active_object; hair.name = 'nico_hair'
bm = bmesh.new(); bm.from_mesh(hair.data)
import random
random.seed(7)
kill = []
for vt in bm.verts:
    x, y, z = vt.co
    zl = 0.06 + 0.26 * max(0, -y) if y < 0 else 0.06 - 0.55 * y   # hairline: forehead, above ears, nape
    if abs(x) > 0.8 and -0.3 < y < 0.35: zl = max(zl, 0.18)        # clear the ears
    if z < zl:
        kill.append(vt); continue
    s = 1.075 + 0.03 * random.random() + 0.04 * max(0, z) ** 2
    if z > 0.85 and x > 0 and y > 0: s += 0.05                       # cowlick
    vt.co = Vector((x * RX * s, y * RY * s, z * RZ * s + 0.004))
bmesh.ops.delete(bm, geom=kill, context='VERTS')
bm.to_mesh(hair.data); bm.free()
sol = hair.modifiers.new('Solid', 'SOLIDIFY'); sol.thickness = 0.008
hair.data.materials.append(M_HAIR); bpy.ops.object.shade_smooth()

# glasses: skin-modifier wire frames
gv, ge, gr = [], [], []
def gpt(co, r=0.0022):
    gv.append(Vector(co)); gr.append(r); return len(gv) - 1
yF = HC.y - RY * 0.86
zE = HC.z + 0.12 * RZ
for s in (1, -1):
    cx = s * 0.033; w, h = 0.026, 0.018
    corners = [(cx - w, yF, zE + h), (cx + w, yF, zE + h), (cx + w, yF, zE - h), (cx - w, yF, zE - h)]
    if s < 0: corners = corners[::-1]
    ids = [gpt(c) for c in corners]
    for a in range(4): ge.append((ids[a], ids[(a + 1) % 4]))
    outer = ids[1] if s > 0 else ids[2]
    hinge = gpt((s * (0.033 + 0.026), yF, zE + h * 0.6))
    temple = gpt((s * 0.074, HC.y + 0.03, zE + 0.004))
    ear_end = gpt((s * 0.072, HC.y + 0.065, zE - 0.02))
    ge += [(hinge, temple), (temple, ear_end)]
    if s > 0: hingeL = hinge; innerL = ids[0]
    else: hingeR = hinge; innerR = ids[0]
    ge.append((outer, hinge))
bridge = gpt((0, yF - 0.002, zE + 0.006))
ge += [(innerL, bridge), (bridge, innerR)]
gme = bpy.data.meshes.new('nico_glasses'); gme.from_pydata(gv, ge, [])
glasses = bpy.data.objects.new('nico_glasses', gme); scene.collection.objects.link(glasses)
gs = glasses.modifiers.new('Skin', 'SKIN')
for i, r in enumerate(gr):
    gme.skin_vertices[0].data[i].radius = (r, r)
gme.skin_vertices[0].data[0].use_root = True
bpy.context.view_layer.objects.active = glasses
for o in bpy.context.selected_objects: o.select_set(False)
glasses.select_set(True)
bpy.ops.object.modifier_apply(modifier='Skin')
gme.materials.append(M_FRAME)
# lenses (slightly reflective, used later for screen reflections)
M_LENS = mat('lens', (0.6, 0.65, 0.7), 0.04)
M_LENS.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = 0.12
for s in (1, -1):
    bpy.ops.mesh.primitive_plane_add(size=1, location=(s * 0.033, yF + 0.001, zE))
    ln = bpy.context.active_object; ln.name = 'nico_lens_' + 'LR'[s < 0]
    ln.rotation_euler = (math.pi / 2, 0, 0); ln.scale = (0.05, 0.034, 1)
    ln.data.materials.append(M_LENS)

# ---------------------------------------------------------------- armature (A-pose, matches the graph)
arm_data = bpy.data.armatures.new('nico_rig')
rig = bpy.data.objects.new('nico_rig', arm_data); scene.collection.objects.link(rig)
for o in bpy.context.selected_objects: o.select_set(False)
bpy.context.view_layer.objects.active = rig; rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
eb = arm_data.edit_bones
def bone(name, a, b, parent=None, connect=False):
    bn = eb.new(name); bn.head = Vector(a) if not isinstance(a, str) else V[a]; bn.tail = Vector(b) if not isinstance(b, str) else V[b]
    if parent: bn.parent = eb[parent]; bn.use_connect = connect
    return bn
bone('hips', (0, 0, 0.9), 'spine')
bone('spine', 'spine', 'belly', 'hips', True)
bone('chest', 'belly', 'chest', 'spine', True)
bone('upper_chest', 'chest', 'neck0', 'chest', True)
bone('neck', 'neck0', 'neck1', 'upper_chest', True)
bone('head', 'neck1', (0, 0.0, 1.76), 'neck', True)
bone('jaw', (0, 0.01, 1.6), (0, -0.07, 1.545), 'head')
for k in 'LR':
    s = 1 if k == 'L' else -1
    bone('shoulder.' + k, (s * 0.04, 0.01, 1.41), 'shoulder' + k, 'upper_chest')
    bone('upper_arm.' + k, 'shoulder' + k, 'elbow' + k, 'shoulder.' + k, True)
    bone('forearm.' + k, 'elbow' + k, 'wrist' + k, 'upper_arm.' + k, True)
    bone('hand.' + k, 'wrist' + k, 'palm' + k, 'forearm.' + k, True)
    for i in range(4):
        prev = 'hand.' + k
        for j in range(3):
            prev = bone(f'finger{i}_{j}.{k}', f'f{i}{j}{k}', f'f{i}{j+1}{k}', prev, j > 0).name
    prev = 'hand.' + k
    for j in range(2):
        prev = bone(f'thumb_{j}.{k}', f't{j}{k}', f't{j+1}{k}', prev, j > 0).name
    bone('thigh.' + k, 'hip' + k, 'knee' + k, 'hips')
    bone('shin.' + k, 'knee' + k, 'ankle' + k, 'thigh.' + k, True)
    bone('foot.' + k, 'ankle' + k, 'ball' + k, 'shin.' + k, True)
    bone('toe.' + k, 'ball' + k, 'toe' + k, 'foot.' + k, True)
bpy.ops.object.mode_set(mode='OBJECT')

# skin the body with automatic (heat) weights; rigid parts to bones
for o in bpy.context.selected_objects: o.select_set(False)
for o in (body, shirt, jeans):
    for x in bpy.context.selected_objects: x.select_set(False)
    o.select_set(True); rig.select_set(True); bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
rigid = [head, hair, glasses] + [o for o in bpy.data.objects if o.name.startswith(('nico_ear', 'nico_lens'))]
for o in rigid:
    mw = o.matrix_world.copy()
    o.parent = rig; o.parent_type = 'BONE'; o.parent_bone = 'head'
    o.matrix_world = mw
# empty vertex groups mean heat weighting failed; report it
groups = {g.index: g.name for g in body.vertex_groups}
unweighted = sum(1 for vt in body.data.vertices if not vt.groups)
print('NICO verts', len(body.data.vertices), 'faces', len(body.data.polygons), 'bones', len(arm_data.bones), 'unweighted', unweighted)

bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'nico.glb'), export_format='GLB', export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'nico.blend'))

# ---------------------------------------------------------------- turnaround sheet (Cycles CPU)
if SHEET:
    world = bpy.data.worlds.new('w'); scene.world = world
    try: world.use_nodes = True
    except Exception: pass
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.05, 0.05, 0.055, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6
    def light(name, loc, energy, size=1.0):
        ld = bpy.data.lights.new(name, 'AREA'); ld.energy = energy; ld.size = size
        lo = bpy.data.objects.new(name, ld); scene.collection.objects.link(lo); lo.location = loc
        lo.rotation_euler = (Vector((0, 0, 1.1)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    light('key', (1.6, -2.2, 2.4), 220, 1.2); light('fill', (-2.2, -1.6, 1.5), 70, 2.0); light('rim', (0.4, 2.4, 2.2), 160, 1.0)
    bpy.ops.mesh.primitive_plane_add(size=6, location=(0, 0, 0))
    bpy.context.active_object.data.materials.append(mat('floor', (0.09, 0.09, 0.095), 0.9))
    cam_d = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cam_d); scene.collection.objects.link(cam)
    scene.camera = cam
    scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = 48
    try: scene.cycles.use_denoising = True
    except Exception: pass
    def shot(name, angle_deg, target, dist, lens, res=(540, 960)):
        a = math.radians(angle_deg)
        cam.location = Vector(target) + Vector((math.sin(a) * dist, -math.cos(a) * dist, 0.02))
        cam.rotation_euler = (Vector(target) - cam.location).to_track_quat('-Z', 'Y').to_euler()
        cam_d.lens = lens
        scene.render.resolution_x, scene.render.resolution_y = res
        scene.render.filepath = os.path.join(OUT, f'sheet_{name}.png')
        bpy.ops.render.render(write_still=True)
    for nm, ang in (('front', 0), ('three_quarter', 35), ('side', 90), ('back', 180)):
        shot(nm, ang, (0, 0, 0.88), 4.2, 50)
    for nm, ang in (('head_front', 0), ('head_three_quarter', 35)):
        shot(nm, ang, (0, 0, 1.63), 1.2, 85, (540, 540))
