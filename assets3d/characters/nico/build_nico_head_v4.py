"""NICO v4 HEAD TEST: a designed stylized head, built the way the studied reference models are built (MODEL-STUDY.md):

- a simple egg-shaped skull with a nearly flat face, a small jaw and a tiny wedge nose (no modelled lips or sockets);
- the face painted (the sheet's own drawn expressions from faces-v3/, as decals that swap per expression);
- hair as many separate pointed locks rooted on a scalp cap, flowing like the sheet's messy spiky clumps;
- thick rectangular glasses on the sheet's lens rectangles; simple ears; a neck stub.

Everything is laid out in the sheet's front-view pixels (eye line at z = 0, the face centre at x = 0, 1 px = 1.70 m / 592),
so the painted faces line up by construction. Run: <bpy venv>/bin/python -I build_nico_head_v4.py -- <faces_dir> <out.glb>
"""
import bpy, bmesh, sys, os, json, math, random
from mathutils import Vector

faces_dir, out_glb = [os.path.abspath(a) for a in sys.argv[sys.argv.index('--') + 1:][:2]]
FJ = json.load(open(os.path.join(faces_dir, 'faces.json')))['_texture']
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
PX = 1.70 / 592                     # metres per sheet pixel
EYE_Z = 1.70 * 0.8917               # eye line height in metres when standing
random.seed(7)

def srgb2lin(c):
    c /= 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def mat(name, rgb=None, image=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']; b.inputs['Roughness'].default_value = 0.9
    if image:
        t = m.node_tree.nodes.new('ShaderNodeTexImage'); t.image = image; t.interpolation = 'Closest'
        m.node_tree.links.new(t.outputs['Color'], b.inputs['Base Color'])
    else:
        b.inputs['Base Color'].default_value = (*[srgb2lin(float(c)) for c in rgb], 1)
    return m
SKIN = mat('nico_skin', (172, 124, 88)); HAIR = mat('nico_hair', (34, 32, 31)); FRAME = mat('nico_frames', (16, 15, 16))
SHIRT = mat('nico_shirt', (55, 72, 68))
def obj(name, bm, material):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    o = bpy.data.objects.new(name, me); scene.collection.objects.link(o); me.materials.append(material); return o
def lerp(a, b, t): return a + (b - a) * t
def piece(z, pts):                   # piecewise-linear profile, pts sorted by z descending
    for (z0, v0), (z1, v1) in zip(pts[:-1], pts[1:]):
        if z0 >= z >= z1: return lerp(v0, v1, (z0 - z) / (z0 - z1))
    return pts[0][1] if z > pts[0][0] else pts[-1][1]

# ---------------------------------------------------------------- the skull + face (one smooth designed form)
TOP, CHIN = 40.0, -43.5             # skull top and chin, px from the eye line (the sheet: chin at eye + 43.7 px)
CY = 4.0                            # skull centre sits 4 px behind the face's middle depth
HALF_W = [(0, 31.0), (-14, 30.5), (-26, 27.5), (-35, 22.0), (-41, 15.0), (-43.5, 10.0)]   # half-width below the eyes
FRONT = [(40, 30), (14, 34.5), (0, 35.0), (-20, 34.0), (-34, 31.0), (-43.5, 28.0)]       # front depth (y-) from centre
BACK = [(40, 34), (0, 37.0), (-18, 33.0), (-30, 24.0), (-43.5, 14.0)]                      # back depth (y+)
def head_point(dx, dy, dz):
    """unit-sphere direction -> designed head surface (px)"""
    z = dz * (TOP if dz >= 0 else -CHIN)
    r = math.sqrt(max(0.0, 1 - dz * dz))
    c, s = (dx / r, dy / r) if r > 1e-6 else (0.0, 0.0)
    if dz >= 0: w = 31.0 * math.sqrt(max(0.0, 1 - (z / TOP) ** 2)) ** 0.9
    else: w = piece(z, HALF_W)
    if dz >= 0:
        k = math.sqrt(max(0.0, 1 - (z / TOP) ** 2)) ** 0.9
        df, db = piece(z, FRONT) * k / max(k, 1e-6) * k, piece(z, BACK) * k
    else: df, db = piece(z, FRONT), piece(z, BACK)
    if s < 0:                           # the face side is flatter: a superellipse across the front
        sgn = -1; mag = abs(s) ** 0.55
        y = sgn * mag * df
        xx = math.copysign(abs(c) ** 0.8, c) * w
    else:
        y = s * db; xx = c * w
    return Vector((xx, y + CY, z))
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=64, v_segments=48, radius=1.0)
for v in bm.verts:
    d = v.co.normalized(); v.co = head_point(d.x, d.y, d.z)
head = obj('nico_head', bm, SKIN)

# tiny wedge nose (the sheet: a small simple nose about 15 px below the eye line)
bm = bmesh.new()
NZ, NY = -16.0, CY - 35.0
nv = [bm.verts.new(p) for p in [(0, NY - 4.0, NZ - 1), (-3.5, NY + 0.5, NZ - 3), (3.5, NY + 0.5, NZ - 3), (0, NY + 0.5, NZ + 8), (0, NY + 1.5, NZ - 4)]]
for f in ((0, 1, 3), (0, 3, 2), (0, 2, 4), (0, 4, 1), (1, 4, 2, 3)): bm.faces.new([nv[i] for i in f])
nose = obj('nico_nose', bm, SKIN)
# ears: flattened half-discs on the sides, from the eye line down to the nose line
for sgn in (-1, 1):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=1.0)
    for v in bm.verts: v.co = Vector((sgn * (28.5 + max(0.0, v.co.x * sgn) * 6.0), CY + 5 + v.co.y * 5.5, -5 + v.co.z * 10.5))
    obj('nico_ear_' + ('l' if sgn > 0 else 'r'), bm, SKIN)
# neck and a collar ring of the shirt
bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=20, radius1=16, radius2=15, depth=30)
for v in bm.verts: v.co += Vector((0, CY + 6, -48))
obj('nico_neck', bm, SKIN)
bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=46, radius2=17, depth=16)
for v in bm.verts: v.co = Vector((v.co.x, v.co.y * 0.62, v.co.z)) + Vector((0, CY + 6, -64))
obj('nico_shoulders', bm, SHIRT)

# ---------------------------------------------------------------- hair: a scalp cap + many pointed locks
def hairline(th_deg):
    a = abs(th_deg)                      # 0 = front, 180 = back: the hairline height in px
    return piece(-a, [(0, 21.0), (-40, 19.0), (-62, 8.0), (-80, 2.0), (-100, -4.0), (-125, -22.0), (-180, -30.0)])
def scalp(th, ph, lift=2.2):
    """a point on the skull at azimuth th (deg, 0 = front, + to the character's left) and elevation ph, lifted off it"""
    t, p = math.radians(th), math.radians(ph)
    dx, dy, dz = math.sin(t) * math.cos(p), -math.cos(t) * math.cos(p), math.sin(p)
    base = head_point(dx, dy, dz)
    n = (base - Vector((0, CY, 4))).normalized()
    return base + n * lift, n
def elev_for_z(th, z):
    lo, hi = -60.0, 90.0
    for _ in range(30):
        mid = (lo + hi) / 2
        if scalp(th, mid, 0)[0].z < z: lo = mid
        else: hi = mid
    return (lo + hi) / 2
# cap: the skull surface above the hairline, lifted
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=36, radius=1.0)
kill = []
for v in bm.verts:
    d = v.co.normalized()
    p = head_point(d.x, d.y, d.z)
    th = math.degrees(math.atan2(d.x, -d.y))
    if p.z < hairline(th) - 1.0: kill.append(v)
    else: v.co = p + (p - Vector((0, CY, 4))).normalized() * 2.4
bmesh.ops.delete(bm, geom=kill, context='VERTS')
cap = obj('nico_hair_cap', bm, HAIR)

locks = bmesh.new()
def add_lock(root, n, flow, L, W, th_k=0.42, curl=0.0, twist=0.0):
    d0 = (flow.normalized() * 0.8 + n * 0.2).normalized()
    side = d0.cross(n)
    if side.length < 1e-4: side = Vector((1, 0, 0))
    side.normalize()
    rings = []
    steps = 6
    pos = root - n * 2.0
    d = d0.copy()
    for i in range(steps + 1):
        t = i / steps
        w = W * (1 - t) ** 0.85
        th = w * th_k
        b = side.cross(d).normalized()
        if i < steps:
            ring = [pos + side * w / 2, pos + b * th / 2, pos - side * w / 2, pos - b * th / 2]
            rings.append([locks.verts.new(p) for p in ring])
        else:
            tip = locks.verts.new(pos)
        # bend: tips flick outward (spiky) and curl as given
        d = (d + n * (0.06 + curl) + side * twist).normalized()
        pos = pos + d * (L / steps)
    for a, b2 in zip(rings[:-1], rings[1:]):
        for k in range(4): locks.faces.new((a[k], a[(k + 1) % 4], b2[(k + 1) % 4], b2[k]))
    for k in range(4): locks.faces.new((rings[-1][k], rings[-1][(k + 1) % 4], tip))
    locks.faces.new(list(reversed(rings[0])))

def flow_at(th, ph, root, n):
    a = abs(th)
    down = Vector((0, 0, -1)); back = Vector((0, 1, 0)); out = Vector((math.sin(math.radians(th)), 0, 0))
    if ph > 62: return (back * 1.0 + Vector((0, 0, 0.1)) + n * 0.25)             # crown: back, a little up
    if a < 55: return (down * 0.9 + Vector((-math.sin(math.radians(th)) * 0.25, -0.35, 0)))   # fringe: forward and down
    if a < 120: return (down * 0.8 + back * 0.35 + out * 0.2)                   # sides: down and back over the ears' tops
    return (down * 0.9 + back * 0.3)                                            # back: down to the nape

count = 0
for ring_ph, n_az, Lr, Wr in ((82, 5, (12, 16), (17, 21)), (68, 10, (13, 17), (17, 21)), (54, 13, (13, 18), (16, 20)),
                              (40, 15, (12, 17), (15, 19)), (26, 15, (11, 15), (14, 18)), (12, 14, (10, 14), (13, 17)), (-2, 10, (10, 14), (13, 16))):
    for k in range(n_az):
        th = -180 + (k + random.uniform(0.2, 0.8)) * 360 / n_az
        ph = ring_ph + random.uniform(-4, 4)
        root, n = scalp(th, ph)
        if root.z < hairline(th) + 3: continue
        f = flow_at(th, ph, root, n)
        L = random.uniform(*Lr); W = random.uniform(*Wr)
        if abs(th) < 55 and ph < 62:                    # fringe: tips stop above the brows (brow line at eye + 14 px)
            L = min(L, max(5.0, root.z - 21.0) * 1.1); W *= 0.85
        add_lock(root, n, f, L, W, th_k=0.55, curl=random.uniform(-0.02, 0.06), twist=random.uniform(-0.15, 0.15)); count += 1
# the cowlick: one lock that rises from the crown and flicks back
root, n = scalp(10, 80)
add_lock(root, n, Vector((0.1, 0.3, 1.0)), 22, 9, curl=-0.25, twist=0.05); count += 1
hair = obj('nico_hair_locks', locks, HAIR)
print('hair locks', count)

# ---------------------------------------------------------------- glasses: thick frames on the sheet's lens rectangles
gbm = bmesh.new()
def bar(a, b, w, depth, up):
    a, b = Vector(a), Vector(b); dd = (b - a).normalized(); u = Vector(up).normalized(); nn = dd.cross(u).normalized()
    P = [a + u * s1 * w / 2 + nn * s2 * depth / 2 for s1, s2 in ((-1, -1), (1, -1), (1, 1), (-1, 1))] + \
        [b + u * s1 * w / 2 + nn * s2 * depth / 2 for s1, s2 in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    vs = [gbm.verts.new(p) for p in P]
    for f in ((0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)): gbm.faces.new([vs[i] for i in f])
LW = FJ['frame_line_front_px'] * 0.85
FY = CY - 35.0 - 2.5                    # frames stand 2.5 px in front of the face
hinge = []
for (x0, y0, x1, y1) in FJ['lens_rects_front_px']:
    zt, zb = -y0, -y1
    xin, xout = (x0, x1) if abs(x0) < abs(x1) else (x1, x0)
    yin, yout = FY, FY + 4.0             # a slight wrap toward the temples
    P = lambda x, z: Vector((x, yin + (yout - yin) * (x - xin) / (xout - xin), z))
    a, b, c, d = P(x0, zt), P(x1, zt), P(x1, zb), P(x0, zb)
    bar(a - Vector((LW / 2, 0, 0)), b + Vector((LW / 2, 0, 0)), LW, 3.0, (0, 0, 1)); bar(d - Vector((LW / 2, 0, 0)), c + Vector((LW / 2, 0, 0)), LW, 3.0, (0, 0, 1))
    inner_w = LW * 0.65                  # the two inner sides nearly meet at the nose: keep them thin
    bar(a, d, LW if abs(x0) > abs(x1) else inner_w, 3.0, (1, 0, 0)); bar(b, c, LW if abs(x1) > abs(x0) else inner_w, 3.0, (1, 0, 0))
    hinge.append(P(xout, zt - LW * 0.6))
bar(Vector((-2.5, FY, 4.5)), Vector((2.5, FY, 4.5)), LW * 0.5, 2.4, (0, 0, 1))
for h in hinge:
    s = 1 if h.x > 0 else -1
    mid = Vector((s * 31.5, FY + 8, h.z)); end = Vector((s * 31.0, CY + 4, -5))
    bar(h, mid, LW * 0.7, 2.4, (0, 0, 1)); bar(mid, end, LW * 0.6, 2.2, (0, 0, 1))
glasses = obj('nico_glasses', gbm, FRAME)
for p in glasses.data.polygons: p.use_smooth = False

# ---------------------------------------------------------------- painted face decals (the sheet's seven expressions)
rx0, ry0, rx1, ry1 = FJ['rect_front_px']                 # around the glasses' centre (= eye line); y down
FX0, FX1, FZ1, FZ0 = rx0, rx1, -ry0, -ry1
EXPR = ['tired', 'focused', 'forcedSmile', 'worried', 'fear', 'terror', 'blink']
src = bmesh.new(); src.from_mesh(head.data)
keep = [f for f in src.faces if f.normal.y < -0.35 and abs(f.calc_center_median().x) <= 25.5 and FZ0 + 3 <= f.calc_center_median().z <= FZ1]
bmesh.ops.delete(src, geom=[f for f in src.faces if f not in set(keep)], context='FACES')
src.normal_update()
for v in src.verts: v.co += v.normal * 0.35
uvl = src.loops.layers.uv.new('UVMap')
for f in src.faces:
    for l in f.loops: l[uvl].uv = ((l.vert.co.x - FX0) / (FX1 - FX0), (l.vert.co.z - FZ0) / (FZ1 - FZ0))
decals = []
for e in EXPR:
    img = bpy.data.images.load(os.path.join(faces_dir, f'nico-face-{e}.png')); img.pack()
    me = bpy.data.meshes.new('nico_face_' + e); src.to_mesh(me)
    for p in me.polygons: p.use_smooth = True
    o = bpy.data.objects.new('nico_face_' + e, me); scene.collection.objects.link(o); me.materials.append(mat('nico_face_' + e, image=img))
    decals.append(o)
src.free()

# ---------------------------------------------------------------- to metres, standing height; export
for o in [o for o in bpy.data.objects if o.type == 'MESH']:
    for v in o.data.vertices: v.co = Vector((v.co.x * PX, v.co.y * PX, v.co.z * PX + EYE_Z))
    o.data.update()
print('tris', {o.name: len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH' and not o.name.startswith('nico_face_')})
bpy.ops.export_scene.gltf(filepath=out_glb, export_format='GLB', export_extras=True, use_visible=False)
print('wrote', out_glb, os.path.getsize(out_glb))
