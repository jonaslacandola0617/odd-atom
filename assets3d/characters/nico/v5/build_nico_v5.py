"""NICO v5: a sculpted stylized model, built shape by shape like the studied reference models (MODEL-STUDY.md).

Every part is an implicit surface made of blended shapes (smooth unions, like clay added in a sculpt) and meshed with
marching cubes, then reduced. Sizes and positions come from the approved sheet's front and side views (sheet pixels:
x = the character's left, y = forward is negative, z up from the sole; 592 px = 1.70 m with the hair).
Clothes are their own shells (shirt, jeans, sneakers with soles), as on the references; skin shows only where the sheet
shows it (head, neck, forearms, hands).

Run: <bpy venv with scikit-image>/bin/python -I build_nico_v5.py -- <out.glb> [renders_dir]
"""
import bpy, bmesh, sys, os, math, random
import numpy as np
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sdf import smin, smax, ellipsoid, round_cone, chain, loft, box, rot_y, rot_x, rot_z, Grid

args = sys.argv[sys.argv.index('--') + 1:]
OUT = os.path.abspath(args[0]); RENDERS = os.path.abspath(args[1]) if len(args) > 1 else None
PX = 1.70 / 592
random.seed(11)
parts = {}                                   # name -> (verts px, faces, rgb)

# ------------------------------------------------------------------ landmarks (sheet front/side, px from the sole)
EYE, CHIN, COLLAR, SHOULDER, SLEEVE, HEM, CROTCH, KNEE = 527, 484, 472, 446, 387, 288, 236, 140
HEAD_Y = -20.0; EYE -= 5                               # head-local origin: the face front at eye level lands at y = -55 (sheet col 33)

# ------------------------------------------------------------------ head (local: eye line z = 0, face centre x = 0)
def head_fn(Q):
    d = ellipsoid(Q, (0, 4, 8), (32.5, 37, 38))                                   # cranium
    d = smin(d, ellipsoid(Q, (0, -8, -20), (28, 27, 25)), 10)                     # jaw and lower face
    d = smin(d, ellipsoid(Q, (0, -21, -37), (12.5, 9.5, 7.5)), 8)                 # chin
    for s in (-1, 1):
        d = smin(d, ellipsoid(Q, (s * 18, -22, -6), (9, 8, 8)), 9)                # cheekbones (soft)
    d = smin(d, round_cone(Q, (-15, -30.5, 12), (15, -30.5, 12), 2.5, 2.5), 7)    # brow ridge (very soft)
    d = smin(d, round_cone(Q, (0, -33.0, -2), (0, -37.2, -13.5), 1.6, 2.6), 3)     # small nose: a short bridge and a soft tip
    d = smin(d, ellipsoid(Q, (0, -35.2, -15.0), (4.6, 2.6, 2.4)), 2.5)            # nostril wings
    for s in (-1, 1):
        d = smin(d, ellipsoid(Q, (s * 31.5, 6, -4), (4.5, 7.5, 11.5), rot_y(s * 12)), 2)   # ears
    d = smin(d, round_cone(Q, (0, 9, -26), (0, 13, -66), 17.0, 18.0), 7)          # neck (runs down into the shirt)
    return d
g = Grid((-48, -62, -72), (48, 54, 62), 0.6)
v, f = g.mesh(head_fn(g.P)); del g
parts['head'] = (v + np.array([0, HEAD_Y, EYE]), f, (172, 124, 88))

# ------------------------------------------------------------------ hair: a scalp cap and sculpted clumps
CRAN_C = np.array([0, 4, 8]); CRAN_R = np.array([32.5, 37, 38])
def cran_surface(th, ph):
    """point on the cranium (local) at azimuth th (deg, 0 = front, + = character's left) and elevation ph about its centre"""
    t, p = math.radians(th), math.radians(ph)
    dvec = np.array([math.sin(t) * math.cos(p), -math.cos(t) * math.cos(p), math.sin(p)])
    lo, hi = 0.0, 80.0
    for _ in range(40):
        mid = (lo + hi) / 2
        if head_fn((CRAN_C + dvec * mid)[None])[0] < 0: lo = mid
        else: hi = mid
    pt = CRAN_C + dvec * lo
    n = (pt - CRAN_C) / CRAN_R ** 2; n /= np.linalg.norm(n)
    return pt, n
def hairline(th):
    a = abs(th)
    base = np.interp(a, [0, 40, 62, 82, 100, 118, 145, 180], [24, 21, 11, 8.5, 7, -8, -24, -28])
    return base + (4.0 * math.sin(th * 0.21) * math.sin(th * 0.083 + 1.0) if a < 70 else 0.0)
def cap_fn(Q):
    d = ellipsoid(Q, CRAN_C + np.array([0, 1.0, 0]), CRAN_R + np.array([5.0, 4.0, 4.0]))
    th = np.degrees(np.arctan2(Q[..., 0], -(Q[..., 1] - CRAN_C[1])))
    hl = np.interp(np.abs(th), [0, 40, 62, 82, 100, 118, 145, 180], [24, 21, 11, 8.5, 7, -8, -24, -28])
    return smax(d, hl - Q[..., 2], 2.0)
gh = Grid((-56, -62, -40), (56, 64, 76), 0.6)
hair = cap_fn(gh.P)
def flow(th, ph, n):
    a = abs(th); s = math.sin(math.radians(th))
    down, back = np.array([0, 0, -1.0]), np.array([0, 1.0, 0])
    if ph > 60: return back * 1.0 + np.array([0, 0, 0.15]) + n * 0.3                  # crown: back, a little up
    if a < 55: return down * 0.9 + np.array([-s * 0.25, -0.4, 0])                     # fringe: forward and down
    if a < 120: return down * 0.7 + back * 0.35 + np.array([s * 0.65, 0, 0])           # sides: down, back and out (volume)
    return down * 0.9 + back * 0.3                                                     # back: down to the nape
clumps = 0
for ring_ph, n_az, Lr, Rr in ((80, 4, (18, 24), (8, 10)), (62, 9, (20, 26), (8, 10)), (44, 12, (18, 24), (7.5, 9.5)),
                              (28, 14, (16, 21), (7, 8.5)), (12, 14, (14, 18), (6.5, 8)), (-4, 12, (12, 16), (6, 7.5)),
                              (-18, 9, (10, 13), (5.5, 7))):
    for k in range(n_az):
        th = -180 + (k + random.uniform(0.15, 0.85)) * 360 / n_az
        ph = ring_ph + random.uniform(-5, 5)
        root, n = cran_surface(th, ph)
        if root[2] < hairline(th) + 2.5: continue
        fl = flow(th, ph, n); fl = fl / np.linalg.norm(fl)
        L = random.uniform(*Lr); R = random.uniform(*Rr)
        if abs(th) < 55 and ph < 60:                     # fringe clumps stop at the brow line (eye + 15 px)
            L = min(max(L, 18.0), max(8.0, (root[2] - 14.0) * 1.35))
        d1 = fl * 0.9 + n * 0.1; d1 /= np.linalg.norm(d1)
        side = np.cross(d1, n); side /= max(np.linalg.norm(side), 1e-6)
        tw = random.uniform(-0.3, 0.3)
        p0 = root - n * 1.5
        p1 = root + d1 * L * 0.5 + n * (2.2 if ph > 20 else 1.4)
        d2 = d1 + n * random.uniform(-0.05, 0.15) + side * tw; d2 /= np.linalg.norm(d2)
        p2 = p1 + d2 * L * 0.6
        pts = [p0, p1, p2]
        lo = np.min(pts, 0) - R - 2; hi = np.max(pts, 0) + R + 2
        def clump(Q, pts=pts, R=R, n=n, root=root):
            # a flattened clump (a ribbon-like lock): squash the space along the scalp normal
            q = Q - root; qn = q @ n
            Qs = Q + np.outer(qn, n).reshape(Q.shape) * 0.9
            ps = [p + n * ((p - root) @ n) * 0.9 for p in pts]
            return chain(Qs, ps, [R * 1.25, R * 0.75, 0.4], 1.2) / 1.5
        gh.add(hair, clump, lo, hi, k=2.2)
        clumps += 1
# the cowlick: rises from the crown and flicks back
root, n = cran_surface(10, 82)
pts = [root - n, root + np.array([0.5, 2, 9]), root + np.array([1, 9, 15]), root + np.array([2, 14, 12])]
gh.add(hair, lambda Q: chain(Q, pts, [4.5, 3.4, 2.0, 0.5], 1.0), np.min(pts, 0) - 6, np.max(pts, 0) + 6, k=2.0)
v, f = gh.mesh(hair); del gh
parts['hair'] = (v + np.array([0, HEAD_Y, EYE]), f, (34, 32, 31))
print('hair clumps', clumps)

# ------------------------------------------------------------------ the shirt (an outer shell), with short sleeves
def ring(P, c, rx, ry, tilt, r, n=20):
    """a soft rib around an ellipse (the crew collar); tilt drops the front edge (z falls as y goes forward)"""
    pts = []
    for i in range(n + 1):
        t = 2 * math.pi * i / n
        x, y = rx * math.sin(t), -ry * math.cos(t)
        pts.append((c[0] + x, c[1] + y, c[2] + tilt * (-y / ry)))
    return chain(P, pts, [r] * len(pts), 0.5)
def shirt_fn(P):
    # the body: straight, a little loose, the belly forward (side view), sloped shoulders
    torso = loft(P, [(288, 58, 52, -5.5), (300, 59, 52.5, -6.5), (330, 56.5, 52, -7.5), (360, 54, 49.5, -6), (390, 55.5, 45, -0.5),
                     (420, 57, 42, 3.5), (442, 57, 38, 6.5), (455, 54, 34, 7.5), (464, 46, 30, 8), (471, 33, 25, 8), (476, 21, 19, 7)], power=2.3)
    d = torso
    for s_ in (-1, 1):
        # loose sleeve: from the sloped shoulder, angled out, widening to an open hem at the sheet's line
        sl = round_cone(P, (s_ * 46, 6, 445), (s_ * 72, 4, 392), 19.0, 21.0)
        cut = (P[..., 2] - 387) - (P[..., 0] * s_ - 72) * 0.25              # the hem is cut square to the sleeve's angle
        sl = smax(sl, -cut, 1.2)
        d = smin(d, sl, 9)
    d = smin(d, ring(P, (0, 6.5, 470.5), 19.5, 17.5, 4.0, 2.4), 1.5)        # crew collar rib
    # folds: broad soft grooves (from the armpits toward the belly, across the lower front) and a turned hem
    return d
g = Grid((-100.37, -72, 282), (100, 62, 480), 1.0)
v, f = g.mesh(shirt_fn(g.P)); del g
parts['shirt'] = (v, f, (55, 72, 68))

# ------------------------------------------------------------------ arms and hands (skin)
def arm_fn(P, s):
    x0 = s * 79
    d = chain(P, [(s * 50, 6, 444), (s * 71, 4, 372), (s * 76.5, 2, 334), (s * 79, 1, 296), (s * 79.5, 0.5, 276)], [14.5, 13.2, 12.6, 10.3, 9.6], 5)
    # the hand hangs relaxed, palm toward the thigh, fingers curled into a loose half-fist (sheet side view)
    inward = -s
    d = smin(d, ellipsoid(P, (x0, 0.5, 261), (7.0, 12.2, 13.0)), 5)                  # palm
    for yi, L in ((-7.6, 0.95), (-2.6, 1.0), (2.3, 0.97), (6.8, 0.82)):
        k0 = (x0 + inward * 0.5, yi, 251); k1 = (x0 + inward * 2.0, yi, 251 - 8.5 * L)
        k2 = (x0 + inward * 6.0, yi * 1.02, 251 - 14.5 * L); k3 = (x0 + inward * 9.5, yi * 1.02, 251 - 16.5 * L)
        d = smin(d, chain(P, [k0, k1, k2, k3], [3.0, 2.75, 2.45, 2.1], 1.0), 1.6)
    t0 = (x0 + inward * 3.5, -8.5, 262); t1 = (x0 + inward * 7.0, -12.0, 251); t2 = (x0 + inward * 9.5, -11.0, 244)
    d = smin(d, chain(P, [t0, t1, t2], [3.7, 3.0, 2.5], 1.0), 2.5)                   # thumb, in front, along the index finger
    return d
for s, nm in ((1, 'arm_l'), (-1, 'arm_r')):
    g = Grid((s * 78 - 30, -30, 210), (s * 78 + 30, 28, 452), 0.5) if s > 0 else Grid((s * 78 - 30, -30, 210), (s * 78 + 30, 28, 452), 0.5)
    lo = np.minimum(g.lo, g.lo)
    v, f = g.mesh(arm_fn(g.P, s)); del g
    parts[nm] = (v, f, (172, 124, 88))

# ------------------------------------------------------------------ jeans (loose, straight legs)
def jeans_fn(P):
    d = ellipsoid(P, (0, -4, 266), (58, 46, 40))                                       # hips and seat (flat with the shirt's back)
    for s_ in (-1, 1):
        d = smin(d, chain(P, [(s_ * 30, -6, 290), (s_ * 31, -5, 240), (s_ * 34, -3, 170), (s_ * 36, -1, KNEE), (s_ * 38, 3, 70), (s_ * 39, 5, 40)],
                          [30, 29.5, 26, 24.5, 24.0, 25.0], 6), 12)
    d = smax(d, P[..., 2] - 298, 2.0)
    d = smax(d, (40 - 0.2 * P[..., 1]) - P[..., 2], 1.0)                              # the hem breaks on the shoe, lower at the back
    fold = 1.4 * np.sin(P[..., 2] * 0.36 + 0.25 * P[..., 0]) * np.clip(1 - (P[..., 2] - 36) / 40, 0, 1)
    return d + fold
g = Grid((-75, -62, 30), (75, 52, 300), 1.0)
v, f = g.mesh(jeans_fn(g.P)); del g
parts['jeans'] = (v, f, (44, 45, 52))

# ------------------------------------------------------------------ sneakers: upper + sole
SHOE_X, TOE_Y, HEEL_Y = 47.0, -71.0, 35.0
def plan(P, s, hw_toe, hw_heel, grow=0.0):
    """the shoe's footprint (plan view): a rounded toe and a rounded heel, as a 2D distance"""
    x = P[..., 0] - s * SHOE_X; y = P[..., 1]
    toe_c = TOE_Y + hw_toe + 4; heel_c = HEEL_Y - hw_heel
    d_toe = np.hypot(x / (hw_toe + grow), (y - toe_c) / (hw_toe + 8 + grow)) - 1
    d_heel = np.hypot(x / (hw_heel + grow), (y - heel_c) / (hw_heel + grow)) - 1
    t = np.clip((y - toe_c) / (heel_c - toe_c), 0, 1)
    hw = hw_toe + (hw_heel - hw_toe) * t + grow
    d_mid = np.where((y > toe_c) & (y < heel_c), np.abs(x) / hw - 1, 1e3)
    return np.minimum(np.minimum(d_toe, d_heel), d_mid) * min(hw_toe, hw_heel)
def shoe_fn(P, s):
    x = s * SHOE_X
    d = ellipsoid(P, (x, -47, 13), (25.5, 24, 12.5))                                   # toe cap
    d = smin(d, ellipsoid(P, (x, -24, 17), (27, 27, 16)), 8)                           # vamp
    d = smin(d, ellipsoid(P, (x, 11, 19), (25, 25, 19)), 9)                          # quarter and heel
    d = smin(d, round_cone(P, (x, 10, 26), (x, 8, 38), 18.5, 17.5), 6)                # ankle collar (under the jeans)
    d = smin(d, ellipsoid(P, (x, -25, 28), (10.5, 19, 4.2), rot_x(-26)), 4)            # lace panel / tongue
    for i in range(4):                                                                 # laces, following the panel's slope
        yy = -37 + i * 7.5; zz = 24.0 + i * 3.4
        d = smin(d, round_cone(P, (x - 9, yy, zz), (x + 9, yy + 2, zz), 1.4, 1.4), 0.8)
    return smax(d, 7.5 - P[..., 2], 1.0)
def sole_fn(P, s):
    z = P[..., 2]
    footprint = plan(P, s, 31.5, 28.0, 0.0)
    d = smax(footprint, z - 10.0, 2.5)                                                  # a thick cup sole, rounded top edge
    d = smax(d, -z - 0.3 + 2.0 * np.clip((TOE_Y + 18 - P[..., 1]) / 18, 0, 1), 1.0)     # toe spring: the toe lifts
    return d
for nm, fn, col in (('shoes', shoe_fn, (108, 104, 100)), ('soles', sole_fn, (176, 166, 152))):
    g = Grid((-88, -76, -1), (88, 42, 52), 0.6)
    field = np.minimum(fn(g.P, 1), fn(g.P, -1))
    v, f = g.mesh(field); del g
    parts[nm] = (v, f, col)

# ------------------------------------------------------------------ to Blender: meshes, reduction, materials
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
def srgb2lin(c):
    c /= 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
TARGET = {'head': 9000, 'hair': 16000, 'shirt': 14000, 'arm_l': 5000, 'arm_r': 5000, 'jeans': 7000, 'shoes': 5000, 'soles': 1500}
objs = {}
for nm, (v, f, rgb) in parts.items():
    me = bpy.data.meshes.new('nico_' + nm)
    me.from_pydata([tuple(p * PX) for p in v], [], [tuple(int(i) for i in t) for t in f])
    me.validate(); me.update()
    o = bpy.data.objects.new('nico_' + nm, me); scene.collection.objects.link(o)
    m = bpy.data.materials.new('nico_' + nm); m.use_nodes = True
    m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*[srgb2lin(float(c)) for c in rgb], 1)
    m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.85
    me.materials.append(m)
    n0 = len(me.polygons)
    if n0 > TARGET[nm]:
        dm = o.modifiers.new('dec', 'DECIMATE'); dm.ratio = TARGET[nm] / n0
        bpy.context.view_layer.objects.active = o
        for x in bpy.context.selected_objects: x.select_set(False)
        o.select_set(True); bpy.ops.object.modifier_apply(modifier='dec')
    for p in me.polygons: p.use_smooth = True
    objs[nm] = o
    print(f'{nm:7s} tris {n0:7d} -> {len(me.polygons):6d}')
os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_extras=True)
print('wrote', OUT, os.path.getsize(OUT))

# ------------------------------------------------------------------ clay review renders (shape only), like the reference study
if RENDERS:
    os.makedirs(RENDERS, exist_ok=True)
    clay = bpy.data.materials.new('clay'); clay.use_nodes = True
    clay.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.62, 0.6, 0.58, 1)
    clay.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.7
    for o in objs.values(): o.data.materials[0] = clay
    sc = scene; sc.render.engine = 'CYCLES'; sc.cycles.samples = 24
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (0.24, 0.24, 0.26, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.6
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sc.collection.objects.link(sun)
    sun.data.energy = 3.2; sun.rotation_euler = (math.radians(55), 0, math.radians(-35))
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.type = 'ORTHO'
    H = 1.70
    for name, ang, zc, scale, res in (('front', 0, 0.85, 1.8, (420, 760)), ('quarter', 35, 0.85, 1.8, (420, 760)),
                                      ('side', 90, 0.85, 1.8, (420, 760)), ('back', 180, 0.85, 1.8, (420, 760)),
                                      ('head_front', 0, 1.53, 0.42, (500, 500)), ('head_quarter', 35, 1.53, 0.42, (500, 500)),
                                      ('head_side', 90, 1.53, 0.42, (500, 500)), ('hands', 20, 0.74, 0.36, (500, 500)),
                                      ('feet', 30, 0.07, 0.42, (500, 500))):
        a = math.radians(ang)
        cx = 0.225 if name == 'hands' else 0.0
        cam.location = Vector((cx + math.sin(a) * 6, -math.cos(a) * 6, zc)); cam.rotation_euler = (math.radians(90), 0, a)
        cam.data.ortho_scale = scale
        sc.render.resolution_x, sc.render.resolution_y = res
        sc.render.filepath = os.path.join(RENDERS, f'clay_{name}.png'); bpy.ops.render.render(write_still=True)
    print('renders in', RENDERS)
