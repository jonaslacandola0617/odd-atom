"""NICO v1 (TRANSFERS lead) from the CC0 MakeHuman base mesh, in headless Blender.

Only DATA from the MPFB 2.0.18 package is read (base.obj, targets, rig/weights JSON,
all marked CC0 in the files themselves); none of the add-on's code is run.
The character design, clothing, hair, glasses and colouring are our own.

Run: <venv-with-bpy>/bin/python -I build_nico_mh.py -- <mpfb_data_dir> <out_dir> [--sheet]
"""
import bpy, bmesh, gzip, json, math, os, sys, random
import numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
DATA, OUT = os.path.abspath(argv[0]), os.path.abspath(argv[1])
SHEET = '--sheet' in argv
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ------------------------------------------------------------------ base mesh
verts, uvs, faces = [], [], []          # faces: (vids, uvids, group)
grp = None
with open(os.path.join(DATA, '3dobjs/base.obj')) as fh:
    for line in fh:
        if line.startswith('v '):
            verts.append([float(x) for x in line.split()[1:4]])
        elif line.startswith('vt '):
            uvs.append([float(x) for x in line.split()[1:3]])
        elif line.startswith('g '):
            grp = line.split()[1]
        elif line.startswith('f '):
            vi, ti = [], []
            for tok in line.split()[1:]:
                a = tok.split('/')
                vi.append(int(a[0]) - 1); ti.append(int(a[1]) - 1 if len(a) > 1 and a[1] else 0)
            faces.append((vi, ti, grp))
BASE = np.array(verts)
N = len(BASE)
VGROUPS = json.load(open(os.path.join(DATA, 'mesh_metadata/basemesh_vertex_groups.json')))

def target(rel):
    d = np.zeros((N, 3))
    with gzip.open(os.path.join(DATA, 'targets', rel), 'rt') as fh:
        for line in fh:
            p = line.split()
            if len(p) == 4 and not p[0].startswith('#'):
                d[int(p[0])] = [float(p[1]), float(p[2]), float(p[3])]
    return d

# ------------------------------------------------------------------ Nico's body (macro blend)
# age 34 (young 25 -> old 90), slightly under-muscled, a little over average weight, shortish, Asian
AGE = {'young': 0.86, 'old': 0.14}
MUS = {'averagemuscle': 0.85, 'minmuscle': 0.15}
WGT = {'averageweight': 0.75, 'maxweight': 0.25}
co = BASE.copy()
for a, wa in AGE.items():
    for m, wm in MUS.items():
        for w, ww in WGT.items():
            co += wa * wm * ww * target(f'macrodetails/universal-male-{a}-{m}-{w}.target.gz')
    co += wa * target(f'macrodetails/asian-male-{a}.target.gz')
HEIGHT_W = float(os.environ.get('NICO_HEIGHT_W', '0.08'))
if HEIGHT_W < 0: co += -HEIGHT_W * target('macrodetails/height/male-young-averagemuscle-averageweight-minheight.target.gz')
elif HEIGHT_W > 0: co += HEIGHT_W * target('macrodetails/height/male-young-averagemuscle-averageweight-maxheight.target.gz')
co += 0.25 * target('macrodetails/proportions/male-young-averagemuscle-averageweight-idealproportions.target.gz')
DETAIL = {  # face/head character (our design choices)
    'nose/nose-scale-horiz-incr.target.gz': 0.35, 'nose/nose-flaring-incr.target.gz': 0.3,
    'nose/nose-point-width-incr.target.gz': 0.3, 'head/head-square.target.gz': 0.25,
    'head/head-fat-incr.target.gz': 0.15, 'stomach/stomach-pregnant-incr.target.gz': 0.12,
}
for rel, w in DETAIL.items():
    if os.path.exists(os.path.join(DATA, 'targets', rel)):
        co += w * target(rel)
    else:
        print('missing detail target', rel)

def to_b(a):  # MakeHuman (y up, decimetres, facing +z) -> Blender (z up, metres, facing -y)
    a = np.asarray(a)
    return np.stack([a[..., 0], -a[..., 2], a[..., 1]], -1) * 0.1

CO = to_b(co)

def grp_idx(name):
    out = []
    for a, b in VGROUPS[name]:
        out.extend(range(a, b + 1))
    return out

def joint(name):
    return Vector(CO[grp_idx(name)].mean(0))

KEEP = {'body', 'helper-l-eye', 'helper-r-eye', 'helper-upper-teeth', 'helper-lower-teeth', 'helper-tongue'}
body_set = set(grp_idx('body'))
feet_z = CO[list(body_set)][:, 2].min()
CO[:, 2] -= feet_z
print('height m', round(CO[list(body_set)][:, 2].max(), 3))

# ------------------------------------------------------------------ mesh object (all verts kept until weighting is done)
kf = [f for f in faces if f[2] in KEEP]
me = bpy.data.meshes.new('nico')
me.from_pydata([tuple(v) for v in CO], [], [f[0] for f in kf])
uvl = me.uv_layers.new(name='UVMap')
li = 0
for f in kf:
    for t in f[1]:
        uvl.data[li].uv = uvs[t]; li += 1
body = bpy.data.objects.new('nico_body', me)
scene.collection.objects.link(body)
for p in me.polygons: p.use_smooth = True
FACE_GROUP = [f[2] for f in kf]

# ------------------------------------------------------------------ rig (game-engine skeleton) + CC0 weights
RIG = json.load(open(os.path.join(DATA, 'rigs/standard/rig.game_engine.json')))
WTS = json.load(open(os.path.join(DATA, 'rigs/standard/weights.game_engine.json')))['weights']
def endpoint(spec):
    if spec['strategy'] == 'CUBE': return joint(spec['cube_name'])
    return Vector(CO[spec['vertex_indices']].mean(0))
arm = bpy.data.armatures.new('nico_rig'); rig = bpy.data.objects.new('nico_rig', arm)
scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig; rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
for name, b in RIG.items():
    eb = arm.edit_bones.new(name); eb.head = endpoint(b['head']); eb.tail = endpoint(b['tail']); eb.roll = b.get('roll', 0.0)
    if (eb.tail - eb.head).length < 1e-4: eb.tail = eb.head + Vector((0, 0, 0.02))
for name, b in RIG.items():
    if b.get('parent'):
        eb = arm.edit_bones[name]; eb.parent = arm.edit_bones[b['parent']]; eb.use_connect = b.get('use_connect', False)
bpy.ops.object.mode_set(mode='OBJECT')
dominant = np.full(N, -1); domw = np.zeros(N)
bone_names = list(WTS)
for bi, (bn, lst) in enumerate(WTS.items()):
    vg = body.vertex_groups.new(name=bn)
    for vid, w in lst:
        vg.add([vid], w, 'REPLACE')
        if w > domw[vid]: domw[vid] = w; dominant[vid] = bi
body.parent = rig
body.modifiers.new('Armature', 'ARMATURE').object = rig

# ------------------------------------------------------------------ materials
def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)
def mat(name, rgb, rough=0.8, vcol=False):
    m = bpy.data.materials.new(name)
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*rgb, 1); bsdf.inputs['Roughness'].default_value = rough
    if vcol:
        a = m.node_tree.nodes.new('ShaderNodeVertexColor'); a.layer_name = 'Col'
        m.node_tree.links.new(a.outputs['Color'], bsdf.inputs['Base Color'])
    return m
SKIN = srgb('#9c6a4a')
MATS = [mat('skin', SKIN, 0.55, vcol=True), mat('eye_white', srgb('#d8d2c6'), 0.3),
        mat('iris', srgb('#2a1a12'), 0.2), mat('pupil', (0.004, 0.004, 0.004), 0.1),
        mat('teeth', srgb('#cfc6b0'), 0.4), mat('mouth', srgb('#5a2a26'), 0.6),
        mat('shirt', srgb('#2f4f4c'), 0.95), mat('jeans', srgb('#262c38'), 0.9),
        mat('shoe', srgb('#5d5c58'), 0.8), mat('sole', srgb('#b9b2a4'), 0.8),
        mat('watch', srgb('#0e0e0e'), 0.35)]
for m in MATS: me.materials.append(m)
MI = {m.name: i for i, m in enumerate(MATS)}

# eyes: iris / pupil by angle from forward
for side in ('l', 'r'):
    ids = grp_idx(f'helper-{side}-eye'); c = Vector(CO[ids].mean(0))
    for p in me.polygons:
        if FACE_GROUP[p.index] != f'helper-{side}-eye': continue
        d = (Vector(p.center) - c).normalized()
        ang = math.degrees(math.acos(max(-1, min(1, -d.y))))
        p.material_index = MI['pupil'] if ang < 9 else MI['iris'] if ang < 21 else MI['eye_white']
for p in me.polygons:
    g = FACE_GROUP[p.index]
    if g in ('helper-upper-teeth', 'helper-lower-teeth'): p.material_index = MI['teeth']
    elif g == 'helper-tongue': p.material_index = MI['mouth']

# skin painting (vertex colours: brows, stubble, lips, under-eye) from joint positions
EYE_L, EYE_R, MOUTH, JAW, HEAD = joint('joint-l-eye'), joint('joint-r-eye'), joint('joint-mouth'), joint('joint-jaw'), joint('joint-head')
col = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
dark, stub, lip, bag = srgb('#1c1411'), srgb('#4a3427'), srgb('#7a4636'), srgb('#7a5038')
random.seed(3)
for i, v in enumerate(me.vertices):
    p = v.co; c = list(SKIN)
    def mix(target, a):
        for k in range(3): c[k] = c[k] * (1 - a) + target[k] * a
    front = p.y < HEAD.y - 0.02
    if front:
        for E in (EYE_L, EYE_R):
            dx, dz = p.x - E.x, p.z - E.z
            if abs(dx) < 0.024 and 0.011 < dz < 0.02 + 0.004 * (1 - abs(dx) / 0.024) and p.y < E.y + 0.01:
                mix(dark, 0.85)                                           # eyebrow
            if abs(dx) < 0.016 and -0.014 < dz < -0.006 and p.y < E.y:
                mix(bag, 0.45)                                            # under-eye bags
        # beard shadow: soft, on the chin, jawline and upper lip only
        dz = p.z - MOUTH.z
        if -0.065 < dz < 0.017 and abs(p.x) < 0.06 and p.y < JAW.y + 0.01:
            a = 0.26 * min(1, (0.06 - abs(p.x)) / 0.015) * min(1, (0.017 - dz) / 0.008)
            if dz > -0.012 and abs(p.x) > 0.03: a *= 0.25                # keep the cheeks clean
            if abs(p.x) < 0.024 and abs(dz) < 0.007: a = 0
            mix(stub, a * (0.8 + 0.2 * random.random()))
        if abs(p.x) < 0.024 and abs(p.z - MOUTH.z) < 0.0065:
            mix(lip, 0.55)
    col.data[i].color = (*c, 1)

# ------------------------------------------------------------------ clothing zones from the dominant bone
SHIRT_B = {'spine_01', 'spine_02', 'spine_03', 'clavicle_l', 'clavicle_r'}
JEANS_B = {'thigh_l', 'thigh_r', 'calf_l', 'calf_r'}
SHOE_B = {'foot_l', 'foot_r', 'ball_l', 'ball_r'}
pel = Vector(arm.bones['pelvis'].head_local); nk = Vector(arm.bones['neck_01'].head_local)
def zone_v(i):
    b = bone_names[dominant[i]] if dominant[i] >= 0 else ''
    p = Vector(CO[i])
    if b in SHOE_B: return 'shoe'
    if b in ('calf_l', 'calf_r'):
        ank = Vector(arm.bones['foot_' + b[-1]].head_local)
        return 'jeans' if p.z > ank.z + 0.035 else 'shoe'
    if b in JEANS_B: return 'jeans'
    if b == 'pelvis': return 'shirt' if p.z > pel.z + 0.075 else 'jeans'
    if b in SHIRT_B: return 'shirt'
    if b == 'neck_01': return 'shirt' if p.z < nk.z + 0.005 else 'skin'
    if b.startswith('upperarm'):
        bn = arm.bones[b]; h, t = Vector(bn.head_local), Vector(bn.tail_local)
        s = (p - h).dot(t - h) / (t - h).length_squared
        return 'shirt' if s < 0.52 else 'skin'
    if b == 'lowerarm_l':
        bn = arm.bones[b]; h, t = Vector(bn.head_local), Vector(bn.tail_local)
        s = (p - h).dot(t - h) / (t - h).length_squared
        if 0.86 < s < 0.97: return 'watch'
    return 'skin'
from collections import Counter
HEM = pel.z + 0.075
def bone_s(bname, p):
    bn = arm.bones[bname]; h, t = Vector(bn.head_local), Vector(bn.tail_local)
    return (p - h).dot(t - h) / (t - h).length_squared
TORSO_B = SHIRT_B | {'pelvis', 'neck_01'}
for p in me.polygons:
    if FACE_GROUP[p.index] != 'body': continue
    c = Vector(p.center)
    b = Counter(bone_names[dominant[v]] for v in p.vertices if dominant[v] >= 0).most_common(1)[0][0]
    z = 'skin'
    if b in TORSO_B:   # straight hem and collar lines
        z = 'jeans' if c.z < HEM else ('skin' if c.z > nk.z + 0.005 else 'shirt')
    elif b in SHOE_B or b in ('calf_l', 'calf_r', 'thigh_l', 'thigh_r'):
        side = b[-1]; ank = Vector(arm.bones['foot_' + side].head_local)
        z = 'jeans' if c.z > ank.z + 0.035 else 'shoe'
        if z == 'jeans' and c.z > HEM and b.startswith('thigh'): z = 'shirt'
    elif b.startswith('upperarm') or b.startswith('clavicle'):
        z = 'shirt' if b.startswith('clavicle') or bone_s(b, c) < 0.5 else 'skin'
    elif b == 'lowerarm_l' and 0.86 < bone_s(b, c) < 0.96:
        z = 'watch'
    p.material_index = MI['skin'] if z == 'skin' else MI[z]
    if z == 'shoe' and c.z < 0.012: p.material_index = MI['sole']

def shell(name, mats, push, thick, smooth=0, snap=None):
    o = body.copy(); o.data = body.data.copy(); o.name = name; scene.collection.objects.link(o)
    bm = bmesh.new(); bm.from_mesh(o.data)
    bm.faces.ensure_lookup_table()
    drop = [f for f in bm.faces if f.material_index not in {MI[m] for m in mats}]
    bmesh.ops.delete(bm, geom=drop, context='FACES')
    bm.normal_update()
    for v in bm.verts: v.co += v.normal * push
    if snap:
        for v in bm.verts:
            if any(e.is_boundary for e in v.link_edges): v.co = snap(v.co)
    bm.to_mesh(o.data); bm.free()
    if smooth:
        sm = o.modifiers.new('Smooth', 'SMOOTH'); sm.factor = 1.0; sm.iterations = smooth
        o.modifiers.move(len(o.modifiers) - 1, 0)
    sol = o.modifiers.new('Solid', 'SOLIDIFY'); sol.thickness = thick; sol.offset = 1
    o.modifiers.move(len(o.modifiers) - 1, 1 if smooth else 0)   # before armature
    return o
def snap_shirt(c):
    c = c.copy()
    for side in 'lr':
        bn = arm.bones['upperarm_' + side]; h, t = Vector(bn.head_local), Vector(bn.tail_local)
        if (c - h).dot(t - h) / (t - h).length_squared > 0.3 and abs(c.x) > abs(h.x):
            d = (t - h).normalized(); c -= d * ((c - h).dot(d) - 0.54 * (t - h).length)   # sleeve plane (covers the body's stepped edge)
            return c
    if c.z < (HEM + nk.z) / 2: c.z = HEM - 0.012          # hem hangs just over the waistband
    else: c.z = nk.z + 0.02                                  # collar (covers the body's stepped edge)
    return c
def snap_jeans(c):
    c = c.copy()
    if c.z > 0.5: c.z = HEM + 0.01                          # waistband (under the shirt hem)
    else:
        side = 'l' if c.x > 0 else 'r'; c.z = Vector(arm.bones['foot_' + side].head_local).z + 0.02
    return c
shirt = shell('nico_shirt', ['shirt'], 0.012, 0.004, smooth=5, snap=snap_shirt)
jeans = shell('nico_jeans', ['jeans'], 0.015, 0.003, smooth=5, snap=snap_jeans)

# sneakers: modelled per foot (skin-modifier last), weighted to foot / ball bones
shoe_objs = []
for side in 'lr':
    ank = Vector(arm.bones['foot_' + side].head_local); ball = Vector(arm.bones['ball_' + side].head_local)
    toe = Vector(arm.bones['ball_' + side].tail_local)
    fwd = (Vector((toe.x, toe.y, 0)) - Vector((ank.x, ank.y, 0))).normalized()
    pts = [ (ank - fwd * 0.045, (0.046, 0.05)), (ank + fwd * 0.03, (0.052, 0.055)),
            (ball, (0.054, 0.045)), (ball + fwd * 0.055, (0.046, 0.036)) ]
    zs = [0.055, 0.055, 0.04, 0.034]
    sv = [Vector((p.x, p.y, z)) for (p, r), z in zip(pts, zs)]
    sme = bpy.data.meshes.new('nico_shoe_' + side); sme.from_pydata(sv, [(0, 1), (1, 2), (2, 3)], [])
    so = bpy.data.objects.new('nico_shoe_' + side, sme); scene.collection.objects.link(so)
    so.modifiers.new('Skin', 'SKIN')
    for i, (p, r) in enumerate(pts): sme.skin_vertices[0].data[i].radius = r
    sme.skin_vertices[0].data[0].use_root = True
    so.modifiers.new('Sub', 'SUBSURF').levels = 2
    bpy.context.view_layer.objects.active = so
    for x in bpy.context.selected_objects: x.select_set(False)
    so.select_set(True)
    bpy.ops.object.modifier_apply(modifier='Skin'); bpy.ops.object.modifier_apply(modifier='Sub')
    for v in sme.vertices:                       # flat sole on the floor
        if v.co.z < 0.0: v.co.z = 0.0
    sme.materials.append(MATS[MI['shoe']]); sme.materials.append(MATS[MI['sole']])
    for pl in sme.polygons:
        pl.use_smooth = True
        if pl.center.z < 0.016: pl.material_index = 1
    gf = so.vertex_groups.new(name='foot_' + side); gb = so.vertex_groups.new(name='ball_' + side)
    for v in sme.vertices:
        t = (v.co - ank).dot(fwd)
        wb = max(0.0, min(1.0, (t - (ball - ank).dot(fwd) + 0.02) / 0.04))
        gf.add([v.index], 1 - wb, 'REPLACE'); gb.add([v.index], wb, 'REPLACE')
    so.parent = rig; so.modifiers.new('Armature', 'ARMATURE').object = rig
    shoe_objs.append(so)
# hide the bare foot under the shoe
bmb = bmesh.new(); bmb.from_mesh(me)
bmesh.ops.delete(bmb, geom=[f for f in bmb.faces if f.material_index in (MI['shoe'], MI['sole'])], context='FACES_ONLY')  # keep verts: shape keys index all base verts
bmb.to_mesh(me); bmb.free()

# ------------------------------------------------------------------ hair from the scalp helper
EYE_Z = (EYE_L.z + EYE_R.z) / 2
def scalp(c):
    zl = EYE_Z + 0.045 if c.y < HEAD.y - 0.035 else (EYE_Z + 0.015 if c.y < HEAD.y + 0.02 else EYE_Z - 0.055)
    if abs(c.x) > 0.06 and EYE_Z - 0.05 < c.z < EYE_Z + 0.03 and HEAD.y - 0.035 < c.y < HEAD.y + 0.045:
        return False   # keep ears clear
    return c.z > zl
hair_faces = []
for i, f in enumerate(kf):
    if f[2] != 'body': continue
    c = Vector(CO[f[0]].mean(0))
    if bone_names[dominant[f[0][0]]] in ('head', 'neck_01') and scalp(c):
        hair_faces.append(f[0])
hv = sorted({v for f in hair_faces for v in f}); remap = {v: i for i, v in enumerate(hv)}
hme = bpy.data.meshes.new('nico_hair')
hme.from_pydata([tuple(CO[v]) for v in hv], [], [[remap[v] for v in f] for f in hair_faces])
hair = bpy.data.objects.new('nico_hair', hme); scene.collection.objects.link(hair)
bm = bmesh.new(); bm.from_mesh(hme); bm.normal_update()
random.seed(11)
for v in bm.verts:
    top = max(0.0, min(1.0, (v.co.z - EYE_Z) / 0.11))
    v.co += v.normal * (0.003 + 0.012 * top * (0.55 + 0.45 * random.random()))
bm.to_mesh(hme); bm.free()
hsm = hair.modifiers.new('Smooth', 'SMOOTH'); hsm.factor = 0.8; hsm.iterations = 4
hsol = hair.modifiers.new('Solid', 'SOLIDIFY'); hsol.thickness = 0.004; hsol.offset = -1
hme.materials.append(mat('hair', srgb('#120f0d'), 0.75))
for p in hme.polygons: p.use_smooth = True

# ------------------------------------------------------------------ glasses (skin-modifier wire)
gv, ge, gr = [], [], []
def gp(c, r=0.0017): gv.append(Vector(c)); gr.append(r); return len(gv) - 1
front_y = min(CO[grp_idx('helper-l-eye')][:, 1].min(), CO[grp_idx('helper-r-eye')][:, 1].min()) - 0.011
inner = []
for E in (EYE_L, EYE_R):
    s = 1 if E.x > 0 else -1; w, h = 0.023, 0.0155; cx, cz = E.x + s * 0.002, E.z - 0.001
    ids = [gp((cx - w, front_y, cz + h)), gp((cx + w, front_y, cz + h)), gp((cx + w, front_y, cz - h)), gp((cx - w, front_y, cz - h))]
    for a in range(4): ge.append((ids[a], ids[(a + 1) % 4]))
    outer = ids[1] if s > 0 else ids[0]; inner.append(ids[0] if s > 0 else ids[1])
    t1 = gp((E.x + s * 0.034, front_y + 0.02, cz + 0.01)); t2 = gp((E.x + s * 0.04, HEAD.y + 0.02, cz + 0.002))
    t3 = gp((E.x + s * 0.038, HEAD.y + 0.05, cz - 0.022))
    ge += [(outer, t1), (t1, t2), (t2, t3)]
br = gp((0, front_y - 0.003, EYE_L.z + 0.004)); ge += [(inner[0], br), (br, inner[1])]
gme = bpy.data.meshes.new('nico_glasses'); gme.from_pydata(gv, ge, [])
glasses = bpy.data.objects.new('nico_glasses', gme); scene.collection.objects.link(glasses)
glasses.modifiers.new('Skin', 'SKIN')
gme.skin_vertices[0].data[0].use_root = True
for i, r in enumerate(gr): gme.skin_vertices[0].data[i].radius = (r, r)
gme.materials.append(mat('frames', srgb('#0b0b0c'), 0.3))
for o in (hair, glasses):
    mw = o.matrix_world.copy(); o.parent = rig; o.parent_type = 'BONE'; o.parent_bone = 'head'; o.matrix_world = mw

# ------------------------------------------------------------------ facial expression shape keys (CC0 expression units)
assert len(body.data.vertices) == N, 'vertex count must match the base mesh before shape keys'
body.shape_key_add(name='Basis')
EXPR = os.path.join(DATA, 'targets/expression/units/asian')
for fn in sorted(os.listdir(EXPR)):
    d = to_b(target('expression/units/asian/' + fn))
    if not np.abs(d).max(): continue
    sk = body.shape_key_add(name=fn.replace('.target.gz', ''), from_mix=False)
    flat = (CO + d).reshape(-1)
    sk.data.foreach_set('co', flat)

# drop helper / joint-cube vertices that no face uses (keeps groups and shape keys)
for o in (body, shirt, jeans):
    bpy.context.view_layer.objects.active = o
    for x in bpy.context.selected_objects: x.select_set(False)
    o.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.delete_loose(use_verts=True, use_edges=True, use_faces=False)
    bpy.ops.object.mode_set(mode='OBJECT')
# bake every modifier except the armature on the objects without shape keys (glTF export would drop them)
for o in [shirt, jeans, hair, glasses]:
    bpy.context.view_layer.objects.active = o
    for x in bpy.context.selected_objects: x.select_set(False)
    o.select_set(True)
    for md in list(o.modifiers):
        if md.type != 'ARMATURE': bpy.ops.object.modifier_apply(modifier=md.name)
print('NICO_MH verts', len(body.data.vertices), 'faces', len(body.data.polygons), 'bones', len(arm.bones),
      'shape keys', len(body.data.shape_keys.key_blocks) - 1)

bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'nico.glb'), export_format='GLB', export_apply=False)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'nico.blend'))

# ------------------------------------------------------------------ sheet renders
if SHEET:
    world = bpy.data.worlds.new('w'); scene.world = world
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.05, 0.05, 0.055, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6
    def light(name, loc, energy, size, aim=(0, 0, 1.1)):
        ld = bpy.data.lights.new(name, 'AREA'); ld.energy = energy; ld.size = size
        lo = bpy.data.objects.new(name, ld); scene.collection.objects.link(lo); lo.location = loc
        lo.rotation_euler = (Vector(aim) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    light('key', (1.6, -2.2, 2.4), 220, 1.2); light('fill', (-2.2, -1.6, 1.5), 70, 2.0); light('rim', (0.4, 2.4, 2.2), 160, 1.0)
    bpy.ops.mesh.primitive_plane_add(size=6); bpy.context.active_object.data.materials.append(mat('floor', (0.09, 0.09, 0.095), 0.9))
    cam_d = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cam_d); scene.collection.objects.link(cam); scene.camera = cam
    scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = 48; scene.cycles.use_denoising = True
    def shot(name, ang, target, dist, lens, res=(540, 960)):
        a = math.radians(ang)
        cam.location = Vector(target) + Vector((math.sin(a) * dist, -math.cos(a) * dist, 0.02))
        cam.rotation_euler = (Vector(target) - cam.location).to_track_quat('-Z', 'Y').to_euler(); cam_d.lens = lens
        scene.render.resolution_x, scene.render.resolution_y = res
        scene.render.filepath = os.path.join(OUT, f'sheet_{name}.png'); bpy.ops.render.render(write_still=True)
    for k in body.data.shape_keys.key_blocks[1:]: k.value = 0
    H = CO[list(body_set)][:, 2].max()
    for nm, ang in (('front', 0), ('three_quarter', 35), ('side', 90), ('back', 180)):
        shot(nm, ang, (0, 0, H / 2), 4.2, 50)
    hc = (0, 0, EYE_L.z - 0.02)
    kb = body.data.shape_keys.key_blocks
    EXPRS = {
        'neutral': {},
        'focused': {'eye-left-slit': 0.6, 'eye-right-slit': 0.6, 'eyebrows-left-down': 0.5, 'eyebrows-right-down': 0.5},
        'fear': {'eyebrows-left-inner-up': 0.9, 'eyebrows-right-inner-up': 0.9, 'eye-left-opened-up': 0.8,
                 'eye-right-opened-up': 0.8, 'mouth-open': 0.35, 'neck-platysma': 0.5},
        'forced_smile': {'mouth-corner-puller': 0.55, 'eye-left-slit': 0.25, 'eye-right-slit': 0.25},
    }
    for nm, keys in EXPRS.items():
        for k in kb[1:]: k.value = 0
        for k, v in keys.items():
            if k in kb: kb[k].value = v
            else: print('no key', k)
        shot('face_' + nm, 20, hc, 1.0, 85, (480, 480))
    for k in kb[1:]: k.value = 0
    shot('head_front', 0, hc, 1.0, 85, (480, 480))
