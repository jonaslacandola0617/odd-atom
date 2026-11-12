"""NICO v3: the Quaternius Universal Base Characters male (CC0), reshaped to the approved design sheet detail by detail.

Inputs (all made by the scripts in fit/):
  fit_blend  - the base after fit/fit_nico_q.py (arms-down rest pose, landmark heights, per-height width/depth fit)
  parts_dir  - fit/sheet_parts.py output (per-view label/foreground/hair masks of the sheet, parts.json)
  faces_dir  - fit/make_faces.py output (seven face textures from the sheet's drawn expression heads, faces.json)
What this adds, every measure taken from the sheet:
  - hair: a volume carved from the sheet's hair outlines (front and back union x side), minus the skull, smoothed
  - clothes by region with clean cut lines: crew collar, sleeve ends, the shirt hem (lower at the belly), the shoes
  - the face: decals in the sheet's face rectangle, one per expression (toggle visibility), on a smoothed face
  - glasses: thick rectangular frames on the sheet's lens rectangles, wrapped to the head, with temples
  - a black digital watch on his left wrist at the sheet's height
  - total height 1.70 m (hair included); bone 'Head' renamed 'head' to match our other rigs
Run: <bpy venv>/bin/python -I build_nico_q.py -- <fit_blend> <parts_dir> <faces_dir> <out.glb>
"""
import bpy, bmesh, sys, os, json, math
import numpy as np
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

fit_blend, parts_dir, faces_dir, out_glb = [os.path.abspath(a) for a in sys.argv[sys.argv.index('--') + 1:][:4]]
bpy.ops.wm.open_mainfile(filepath=fit_blend)
scene = bpy.context.scene
for n in ('Eyes', 'Eyebrows'):
    if n in bpy.data.objects: bpy.data.objects.remove(bpy.data.objects[n])
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
body = bpy.data.objects['SuperHero_Male']
PARTS = json.load(open(os.path.join(parts_dir, 'parts.json')))
FACES = json.load(open(os.path.join(faces_dir, 'faces.json')))['_texture']
LAB = {v: np.load(os.path.join(parts_dir, f'lab_{v}.npy')) for v in ('front', 'side', 'back')}
FG = {v: np.load(os.path.join(parts_dir, f'fg_{v}.npy')) for v in ('front', 'side', 'back')}
HAIR = {v: np.load(os.path.join(parts_dir, f'hair_{v}.npy')) for v in ('front', 'side', 'back')}
SKIN_L = 2   # label index of skin in sheet_parts.py's palette order (bg, hair, skin, shirt, jeans, shoe, sole)

def verts(o): return np.array([tuple(o.matrix_world @ v.co) for v in o.data.vertices], float)
def dominant(o):
    names = {g.index: g.name for g in o.vertex_groups}
    res = []
    for v in o.data.vertices:
        best, bw = '', -1
        for g in v.groups:
            if g.weight > bw: best, bw = names[g.group], g.weight
        res.append(best)
    return res
def srgb2lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

SK = 0.975
V = verts(body); DOM = dominant(body)
z0, ztop = V[:, 2].min(), V[:, 2].max()
Hm = (ztop - z0) / SK                                  # figure height including the hair, in model units
def zf(frac): return z0 + frac * Hm
def mpp(view): return Hm / (PARTS[view]['H'] - 1)
def row(view, frac): return int(round((PARTS[view]['H'] - 1) * (1 - frac)))
HEADV = np.array([d in ('Head', 'neck_01') for d in DOM])

# ---------------------------------------------------------------- anchors between the sheet views and the model
def widest_run(mask_row):
    xs = np.where(mask_row)[0]
    if not len(xs): return None
    runs, s = [], xs[0]
    for a, b in zip(xs[:-1], xs[1:]):
        if b - a > 1: runs.append((s, a)); s = b
    runs.append((s, xs[-1]))
    return max(runs, key=lambda r: r[1] - r[0])
r = widest_run(LAB['front'][row('front', 0.87)] == SKIN_L); C_FRONT = (r[0] + r[1]) / 2
r = widest_run(FG['back'][row('back', 0.87)]); C_BACK = (r[0] + r[1]) / 2
CHIN_F = 0.83
r = widest_run(FG['side'][row('side', CHIN_F)]); SIDE_CHIN_COL = r[0]
hz = np.abs(V[:, 2] - zf(CHIN_F)) < 0.006
MODEL_CHIN_Y = V[HEADV & hz, 1].min()
def side_col_to_y(col): return MODEL_CHIN_Y + (col - SIDE_CHIN_COL) * mpp('side')
print('anchors: front centre col', C_FRONT, 'back centre col', C_BACK, 'side chin col', SIDE_CHIN_COL, 'model chin y', round(MODEL_CHIN_Y, 4))

# ---------------------------------------------------------------- the face: smooth the modelled features, then decals
EYE_FRAC = 0.8917                                      # the glasses' centre row on the sheet's front view
Z_EYE = zf(EYE_FRAC)
MPF = mpp('front')
rx0, ry0, rx1, ry1 = FACES['rect_front_px']             # around the glasses' centre; y down
FX0, FX1 = rx0 * MPF, rx1 * MPF
FZ1, FZ0 = Z_EYE - ry0 * MPF, Z_EYE - ry1 * MPF        # top, bottom
HEAD_Y = (arm.matrix_world @ arm.data.bones['Head'].head_local).y
def in_face(p, margin=0.0):
    u = (p[0] - FX0) / (FX1 - FX0) * 2 - 1
    zc = Z_EYE
    v = (p[2] - zc) / ((FZ1 - zc) if p[2] > zc else (zc - FZ0))
    return u * u + v * v <= (1 - margin) ** 2 and p[1] < HEAD_Y - 0.01
bm = bmesh.new(); bm.from_mesh(body.data); bm.verts.ensure_lookup_table()
mw = body.matrix_world; mwi = mw.inverted()
# close the mouth slit and any other openings in the head (the toon face is painted; the background must not show through)
head_edges = [e for e in bm.edges if e.is_boundary and all(HEADV[v.index] for v in e.verts)]
nb = len(bm.faces)
bmesh.ops.holes_fill(bm, edges=head_edges, sides=0)
print('filled head openings with', len(bm.faces) - nb, 'faces')
bm.verts.ensure_lookup_table()
face_vs = [v for v in bm.verts if HEADV[v.index] and in_face(mw @ v.co, 0.05)]
for _ in range(10):                                    # soften lips, eye sockets and brow ridge into a toon-simple face
    bmesh.ops.smooth_vert(bm, verts=face_vs, factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
bm.to_mesh(body.data); bm.free(); body.data.update()
V = verts(body)

# ---------------------------------------------------------------- clothes: cut lines and regions
def bisect(o, co, no):
    bm = bmesh.new(); bm.from_mesh(o.data)
    inv = o.matrix_world.inverted()
    geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(bm, geom=geom, dist=1e-5, plane_co=inv @ Vector(co), plane_no=(inv.to_3x3() @ Vector(no)).normalized())
    bm.to_mesh(o.data); bm.free(); o.data.update()
yF, yB = V[:, 1].min(), V[:, 1].max()
def tilted(frac_front, frac_back, yf=yF, yb=yB):
    a = Vector((0, yf, zf(frac_front))); b = Vector((0, yb, zf(frac_back)))
    d = (b - a); n = Vector((0, -d.z, d.y)).normalized()
    if n.z < 0: n = -n
    return a, n
# neck: the sheet's crew collar sits at 0.797 in front and 0.82 at the back, measured on the neck's own depth
neck_v = V[np.array([d == 'neck_01' for d in DOM])]
COLLAR = tilted(0.797, 0.822, neck_v[:, 1].min(), neck_v[:, 1].max())
HEM = tilted(0.488, 0.535)                             # lower at the belly, as in the side view
SLEEVE = (Vector((0, 0, zf(0.655))), Vector((0, 0, 1)))
SHOE = tilted(0.062, 0.036)
SOLE = (Vector((0, 0, zf(0.017))), Vector((0, 0, 1)))
for co, no in (COLLAR, HEM, SLEEVE, SHOE, SOLE): bisect(body, co, no)

def above(p, plane): return (Vector(p) - plane[0]).dot(plane[1]) > 0
PAL = {'skin': (172, 124, 88), 'shirt': (55, 72, 68), 'jeans': (56, 58, 66), 'shoe': (112, 108, 104), 'sole': (176, 166, 152),
       'hair': (34, 32, 31), 'frames': (14, 13, 14), 'watch': (20, 20, 22), 'watchface': (70, 78, 74)}
def mat(name, rgb=None, image=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Roughness'].default_value = 0.9
    if image:
        t = m.node_tree.nodes.new('ShaderNodeTexImage'); t.image = image; t.interpolation = 'Closest'
        m.node_tree.links.new(t.outputs['Color'], b.inputs['Base Color'])
    else:
        b.inputs['Base Color'].default_value = (*[srgb2lin(c) for c in rgb], 1)
    return m
MATS = {k: mat('nico_' + k, v) for k, v in PAL.items()}
body.data.materials.clear()
ORDER = ['skin', 'shirt', 'jeans', 'shoe', 'sole']
for k in ORDER: body.data.materials.append(MATS[k])
DOM = dominant(body); V = verts(body); HEADV = np.array([d in ('Head', 'neck_01') for d in DOM])
ARMB = ('upperarm', 'lowerarm', 'hand', 'thumb', 'index', 'middle', 'ring', 'pinky')
for p in body.data.polygons:
    c = mw @ p.center
    d = DOM[p.vertices[0]]
    if d.startswith(ARMB): k = 'shirt' if above(c, SLEEVE) and d.startswith('upperarm') else 'skin'
    elif d in ('Head', 'neck_01') or d.startswith('clavicle') or d.startswith('spine') or d in ('pelvis', 'root'):
        k = 'skin' if above(c, COLLAR) and d in ('Head', 'neck_01') else 'shirt' if above(c, HEM) else 'jeans'
        if d.startswith('clavicle'): k = 'shirt'
    else:
        k = 'jeans' if above(c, SHOE) else 'shoe' if above(c, SOLE) else 'sole'
    p.material_index = ORDER.index(k)

# ---------------------------------------------------------------- hair: visual hull of the sheet's hair outlines
STEP = 0.0025
xs = np.arange(-0.17, 0.17, STEP)
ys = np.arange(MODEL_CHIN_Y - 0.06, MODEL_CHIN_Y + 0.33, STEP)
zs = np.arange(zf(0.80), zf(1.005), STEP)
def lookup(mask, view, cols, zz):
    rows = np.clip(np.round((PARTS[view]['H'] - 1) * (1 - (zz - z0) / Hm)).astype(int), -1, mask.shape[0])
    ok = (rows >= 0) & (rows < mask.shape[0]) & (cols >= 0) & (cols < mask.shape[1])
    out = np.zeros(np.broadcast(rows, cols).shape, bool)
    rr, cc = np.broadcast_arrays(rows, cols)
    out[ok] = mask[rr[ok], cc[ok]]
    return out
X, Z = np.meshgrid(xs, zs, indexing='ij')
XZ_F = lookup(HAIR['front'], 'front', np.round(C_FRONT + X / mpp('front')).astype(int), Z)
XZ_B = lookup(HAIR['back'], 'back', np.round(C_BACK - X / mpp('back')).astype(int), Z)
Y2, Z2 = np.meshgrid(ys, zs, indexing='ij')
YZ = lookup(HAIR['side'], 'side', np.round(SIDE_CHIN_COL + (Y2 - MODEL_CHIN_Y) / mpp('side')).astype(int), Z2)
front_half = (ys < V[HEADV & (V[:, 2] > Z_EYE), 1].mean())[None, :, None]
occ = np.where(front_half, XZ_F[:, None, :], XZ_B[:, None, :]) & YZ[None, :, :]
# carve out the skull (and a 2 mm skin gap is left to the hull's smoothing)
deps = bpy.context.evaluated_depsgraph_get()
bvh = BVHTree.FromObject(body, deps)
idx = np.argwhere(occ)
for i, j, k in idx:
    p = Vector((xs[i], ys[j], zs[k]))
    hit = bvh.find_nearest(mwi @ p)
    if hit[0] is None: continue
    inside = (mwi @ p - hit[0]).dot(hit[1]) < 0
    cap = 0.05 if zs[k] > Z_EYE + 0.06 else 0.03 if zs[k] > Z_EYE + 0.02 else 0.016   # hair hugs the head lower down
    if inside or hit[3] > cap: occ[i, j, k] = False
# the scalp is always covered above the sheet's hairline (front 0.947 at the forehead, 0.905 over the ears, 0.85 at the nape):
# the front view cannot see hair behind the forehead, so the hull alone leaves bald patches there
HL = {0: 0.947, 90: 0.897, 180: 0.845}
SKULL_Y = V[HEADV & (V[:, 2] > Z_EYE), 1].mean()
cand = np.argwhere(~occ)
gx, gy, gz = np.meshgrid(xs, ys, zs, indexing='ij')
ang = np.degrees(np.arctan2(np.abs(gx), -(gy - SKULL_Y)))
hl = np.interp(ang, [0, 90, 180], [HL[0], HL[90], HL[180]])
near = (~occ) & (gz > zf(0.86)) & (gz > z0 + hl * Hm)
added = 0
for i, j, k in np.argwhere(near):
    p = Vector((xs[i], ys[j], zs[k]))
    hit = bvh.find_nearest(mwi @ p, 0.013)
    if hit[0] is not None and (mwi @ p - hit[0]).dot(hit[1]) >= 0:
        occ[i, j, k] = True; added += 1
print('scalp shell voxels added', added)
print('hair voxels', int(occ.sum()), 'of hull', len(idx))
from scipy.ndimage import gaussian_filter
from skimage.measure import marching_cubes
f = gaussian_filter(np.pad(occ, 2).astype(float), 0.9)
vv, ff, _, _ = marching_cubes(f, 0.45)
vv = (vv - 2) * STEP + np.array([xs[0], ys[0], zs[0]])
hme = bpy.data.meshes.new('nico_hair'); hme.from_pydata([tuple(v) for v in vv], [], [tuple(int(a) for a in t[::-1]) for t in ff])
hair = bpy.data.objects.new('nico_hair', hme); scene.collection.objects.link(hair)
hme.materials.append(MATS['hair'])
dec = hair.modifiers.new('dec', 'DECIMATE'); dec.ratio = min(1.0, 9000 / max(1, len(ff)))
bpy.context.view_layer.objects.active = hair
for x in bpy.context.selected_objects: x.select_set(False)
hair.select_set(True); bpy.ops.object.modifier_apply(modifier='dec')
for poly in hme.polygons: poly.use_smooth = True

# ---------------------------------------------------------------- face decals (one per expression)
FBM = bmesh.new(); FBM.from_mesh(body.data)
keep = [fc for fc in FBM.faces if all(HEADV[v.index] if v.index < len(HEADV) else False for v in fc.verts)
        and in_face(mw @ fc.calc_center_median()) and (mw.to_3x3() @ fc.normal).y < -0.15]
keep_set = set(keep)
bmesh.ops.delete(FBM, geom=[fc for fc in FBM.faces if fc not in keep_set], context='FACES')
FBM.normal_update()
for v in FBM.verts: v.co += v.normal * 0.0012
uvl = FBM.loops.layers.uv.active or FBM.loops.layers.uv.new('UVMap')
for fc in FBM.faces:
    fc.material_index = 0
    for l in fc.loops:
        p = mw @ l.vert.co
        l[uvl].uv = ((p[0] - FX0) / (FX1 - FX0), (p[2] - FZ0) / (FZ1 - FZ0))
EXPR = ['tired', 'focused', 'forcedSmile', 'worried', 'fear', 'terror', 'blink']
decals = []
for e in EXPR:
    me = bpy.data.meshes.new('nico_face_' + e); FBM.to_mesh(me)
    img = bpy.data.images.load(os.path.join(faces_dir, f'nico-face-{e}.png')); img.pack()
    me.materials.clear(); me.materials.append(mat('nico_face_' + e, image=img))
    o = bpy.data.objects.new('nico_face_' + e, me); o.matrix_world = mw.copy(); scene.collection.objects.link(o)
    o['expression'] = e
    decals.append(o)
FBM.free()
print('face decal faces', len(decals[0].data.polygons))

# ---------------------------------------------------------------- glasses from the sheet's lens rectangles
def surface_y(x, z):
    for rx, rz in ((0.006, 0.01), (0.012, 0.02), (0.02, 0.03)):
        sel = HEADV[:len(V)] & (np.abs(V[:, 0] - x) < rx) & (np.abs(V[:, 2] - z) < rz) & (V[:, 1] < HEAD_Y)
        if sel.any(): return V[sel, 1].min()
    return None
V = verts(body); HEADV = np.array([d in ('Head', 'neck_01') for d in dominant(body)])
LW = FACES['frame_line_front_px'] * MPF * 0.8           # frame bar width
DEPTH = 0.006
gbm = bmesh.new()
def box(a, b, w, h, up):
    """a bar from a to b with width w (in 'up' direction) and depth h (perpendicular)"""
    a, b = Vector(a), Vector(b); d = (b - a).normalized(); u = Vector(up).normalized(); n = d.cross(u).normalized()
    pts = [a + u * s1 * w / 2 + n * s2 * h / 2 for s1, s2 in ((-1, -1), (1, -1), (1, 1), (-1, 1))] + \
          [b + u * s1 * w / 2 + n * s2 * h / 2 for s1, s2 in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    vs = [gbm.verts.new(p) for p in pts]
    for f in ((0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)):
        gbm.faces.new([vs[i] for i in f])
hinges = []
for (lx0, ly0, lx1, ly1) in FACES['lens_rects_front_px']:
    xa, xb = lx0 * MPF, lx1 * MPF
    zt, zb = Z_EYE - ly0 * MPF, Z_EYE - ly1 * MPF
    ya, yb = surface_y(xa, Z_EYE), surface_y(xb, Z_EYE)
    ya = (ya if ya is not None else HEAD_Y - 0.1) - 0.012; yb = (yb if yb is not None else HEAD_Y - 0.08) - 0.012
    inner_y = min(ya, yb) if abs(xa) < abs(xb) else min(ya, yb)
    # the lens plane wraps a little toward the temples
    xin, yin, xout, yout = (xa, ya, xb, yb) if abs(xa) < abs(xb) else (xb, yb, xa, ya)
    P = lambda x, z: Vector((x, yin + (yout - yin) * (x - xin) / (xout - xin) * 0.55, z))   # wraps from the inner edge
    c = [P(xa, zt), P(xb, zt), P(xb, zb), P(xa, zb)]
    up_h = Vector((0, 0, 1))
    box(c[0] + Vector((-LW / 2, 0, 0)), c[1] + Vector((LW / 2, 0, 0)), LW, DEPTH, up_h)       # top bar
    box(c[3] + Vector((-LW / 2, 0, 0)), c[2] + Vector((LW / 2, 0, 0)), LW, DEPTH, up_h)       # bottom bar
    box(c[0], c[3], LW, DEPTH, (c[1] - c[0]))                                                  # side bars
    box(c[1], c[2], LW, DEPTH, (c[1] - c[0]))
    outer = c[0] if abs(xa) > abs(xb) else c[1]
    hinges.append((outer, c))
(l_out, lc), (r_out, rc) = hinges
inner_l = lc[1] if abs(lc[1].x) < abs(lc[0].x) else lc[0]
inner_r = rc[0] if abs(rc[0].x) < abs(rc[1].x) else rc[1]
box(inner_l + Vector((0, 0, -LW * 0.4)), inner_r + Vector((0, 0, -LW * 0.4)), LW * 0.7, DEPTH, (0, 0, 1))  # bridge
side_x = np.abs(V[HEADV & (np.abs(V[:, 2] - Z_EYE) < 0.01), 0]).max()
for hp in (l_out, r_out):
    s = 1 if hp.x > 0 else -1
    a = Vector((hp.x, hp.y, hp.z - LW * 0.6))
    b = Vector((s * (side_x + 0.002), HEAD_Y - 0.02, Z_EYE - 0.006))
    m_ = Vector((s * (side_x + 0.002), a.y + 0.012, a.z))
    box(a, m_, LW * 0.7, DEPTH * 0.8, (0, 0, 1))
    box(m_, b, LW * 0.6, DEPTH * 0.7, (0, 0, 1))
gme = bpy.data.meshes.new('nico_glasses'); gbm.to_mesh(gme); gbm.free()
glasses = bpy.data.objects.new('nico_glasses', gme); scene.collection.objects.link(glasses)
gme.materials.append(MATS['frames'])

# ---------------------------------------------------------------- the watch on his left wrist (+x), at the sheet's height
ZW = zf(0.485)
DOM = dominant(body)
armsel = np.array([d.startswith(('lowerarm_l', 'hand_l', 'upperarm_l')) for d in DOM]) & (V[:, 0] > 0.05)
zc = V[armsel, 2][np.argmin(np.abs(V[armsel, 2] - ZW))]
wsel = armsel & (np.abs(V[:, 2] - zc) < 0.012) & np.array([d.startswith('lowerarm_l') for d in DOM])
print('watch at', round(float(zc), 3), 'wanted', round(float(ZW), 3), 'verts', int(wsel.sum()), 'bones', sorted(set(d for d, k in zip(DOM, armsel) if k)))
ext = V[wsel].max(0) - V[wsel].min(0)
wc = (V[wsel].min(0) + V[wsel].max(0)) / 2; wc[2] = zc; wr = float(ext[:2].mean() / 2)
print('watch radius', round(float(wr), 4))
wbm = bmesh.new()
bmesh.ops.create_cone(wbm, cap_ends=False, segments=16, radius1=wr + 0.003, radius2=wr + 0.003, depth=0.014)
inner = [v.co.copy() for v in wbm.verts]
wme = bpy.data.meshes.new('nico_watch'); wbm.to_mesh(wme); wbm.free()
watch = bpy.data.objects.new('nico_watch', wme); watch.location = Vector(wc); scene.collection.objects.link(watch)
solid = watch.modifiers.new('s', 'SOLIDIFY'); solid.thickness = 0.003
wme.materials.append(MATS['watch'])
fbm = bmesh.new(); bmesh.ops.create_cube(fbm, size=1.0)
for v in fbm.verts: v.co = Vector((v.co.x * 0.008, v.co.y * 0.019, v.co.z * 0.022))
fme = bpy.data.meshes.new('nico_watchface'); fbm.to_mesh(fme); fbm.free()
wface = bpy.data.objects.new('nico_watchface', fme); wface.location = Vector((wc[0] + wr + 0.004, wc[1], wc[2])); scene.collection.objects.link(wface)
fme.materials.append(MATS['watchface'])
for o in (watch, wface):
    bpy.context.view_layer.objects.active = o
    for x in bpy.context.selected_objects: x.select_set(False)
    o.select_set(True)
    for md in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=md.name)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ---------------------------------------------------------------- skin the accessories to their bones
def skin_to(o, bone):
    o.vertex_groups.clear(); g = o.vertex_groups.new(name=bone); g.add(range(len(o.data.vertices)), 1.0, 'REPLACE')
    o.parent = arm; md = o.modifiers.new('Armature', 'ARMATURE'); md.object = arm
for o in [hair, glasses] + decals: skin_to(o, 'Head')
for o in (watch, wface): skin_to(o, 'lowerarm_l')

# ---------------------------------------------------------------- 1.70 m tall with the hair, feet on the ground, 'head' bone
S = 1.70 / Hm
bpy.ops.object.select_all(action='DESELECT')
for o in [arm] + [o for o in bpy.data.objects if o.type == 'MESH']: o.select_set(True)
bpy.context.view_layer.objects.active = arm
arm.location.z -= z0
arm.scale = (S, S, S)
bpy.ops.object.transform_apply(location=True, rotation=False, scale=True)
arm.data.bones['Head'].name = 'head'
for o in bpy.data.objects:
    if o.type == 'MESH' and 'Head' in o.vertex_groups: o.vertex_groups['Head'].name = 'head'
for o in decals[1:]: o.hide_render = True
Vf = verts(body)
print('final height body', round(Vf[:, 2].max() - Vf[:, 2].min(), 3), 'hair top', round(verts(hair)[:, 2].max(), 3),
      'scale', round(S, 4), 'meshes', [(o.name, len(o.data.vertices)) for o in bpy.data.objects if o.type == 'MESH'])
arm['nico_build'] = 'v3-quaternius-fit'
bpy.ops.export_scene.gltf(filepath=out_glb, export_format='GLB', export_extras=True, use_visible=False,
                          export_apply=False, export_image_format='AUTO')
print('wrote', out_glb, os.path.getsize(out_glb))
bpy.ops.wm.save_as_mainfile(filepath=out_glb.replace('.glb', '.blend'))
