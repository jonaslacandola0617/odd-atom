"""Fit the Quaternius base male (CC0) to the approved Nico design sheet, by silhouette, region by region.

Steps (all measured, no eyeballing):
 1. pose the base into the sheet's arms-down stance and apply it as the rest pose;
 2. remap heights piecewise-linearly so the model's landmarks (knee, crotch, fingertips, armpit, shoulder line,
    chin, skull top) land on the sheet's;
 3. per height, scale each region's width (front view) and depth (side view) to the sheet's clothed silhouette:
    legs, torso, arms (about their own axes), neck and head (below the hairline);
 4. re-measure and repeat (two passes); write overlays and a match report.
Run: <bpy venv>/bin/python -I fit_nico_q.py -- <base.gltf> <sheet.rgb> <out_dir>
"""
import bpy, sys, os, math, json
import numpy as np
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fitlib as F

base, rgb, out = sys.argv[sys.argv.index('--') + 1:][:3]
os.makedirs(out, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=base)
for o in list(bpy.data.objects):
    if o.name == 'Icosphere': bpy.data.objects.remove(o)
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
body = bpy.data.objects['SuperHero_Male']
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
# weld the base's split seams first (head/neck and others): regions are scaled differently and would open up
import bmesh
_bm = bmesh.new(); _bm.from_mesh(body.data); _n = len(_bm.verts)
bmesh.ops.remove_doubles(_bm, verts=_bm.verts, dist=1e-4); _bm.to_mesh(body.data); _bm.free(); body.data.update()
print('welded', _n - len(body.data.vertices), 'duplicate vertices')

# ---------------------------------------------------------------- 1. arms-down rest pose
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE')
ARM_OUT = 8.0
for side, s in (('l', 1), ('r', -1)):
    pb = arm.pose.bones['upperarm_' + side]; bone = arm.data.bones['upperarm_' + side]
    cur = (bone.tail_local - bone.head_local).normalized()
    want = Vector((s * math.sin(math.radians(ARM_OUT)), 0, -math.cos(math.radians(ARM_OUT))))
    M = bone.matrix_local.to_3x3()
    pb.rotation_mode = 'QUATERNION'
    pb.rotation_quaternion = (M.inverted() @ cur.rotation_difference(want).to_matrix() @ M).to_quaternion()
bpy.ops.object.mode_set(mode='OBJECT')
for o in meshes:
    bpy.context.view_layer.objects.active = o
    for x in bpy.context.selected_objects: x.select_set(False)
    o.select_set(True)
    md = next(m for m in o.modifiers if m.type == 'ARMATURE')
    bpy.ops.object.modifier_copy(modifier=md.name)                 # keep a live armature modifier after applying
    bpy.ops.object.modifier_apply(modifier=md.name)
bpy.context.view_layer.objects.active = arm
for x in bpy.context.selected_objects: x.select_set(False)
arm.select_set(True)
bpy.ops.object.mode_set(mode='POSE'); bpy.ops.pose.armature_apply(selected=False); bpy.ops.object.mode_set(mode='OBJECT')

# ---------------------------------------------------------------- helpers
def verts(o): return np.array([tuple(o.matrix_world @ v.co) for v in o.data.vertices], float)
def set_verts(o, V):
    inv = o.matrix_world.inverted()
    for v, p in zip(o.data.vertices, V): v.co = inv @ Vector(p)
    o.data.update()
def dominant(o):
    names = {g.index: g.name for g in o.vertex_groups}
    out_ = []
    for v in o.data.vertices:
        best, bw = '', -1
        for g in v.groups:
            if g.weight > bw: best, bw = names[g.group], g.weight
        out_.append(best)
    return out_
def tris(o):
    m = o.data; m.calc_loop_triangles()
    return np.array([lt.vertices[:] for lt in m.loop_triangles])

mask = F.sheet_mask(rgb)
front = F.view_crop(mask, F.FRONT_X); side = F.view_crop(mask, F.SIDE_X)
H = front.shape[0]

def sheet_row(view, frac):
    return F.runs(view[int(round((H - 1) * (1 - frac)))])

# ---------------------------------------------------------------- 2. vertical landmarks
V = verts(body); DOM = dominant(body)
z0 = V[:, 2].min(); ztop = V[:, 2].max()
SK = 0.975                                   # the sheet's skull top (hair adds the rest)
def hfrac(z): return (z - z0) / ((ztop - z0) / SK)
bone = lambda n: arm.data.bones[n]
def bz(n, tail=False): return (arm.matrix_world @ (bone(n).tail_local if tail else bone(n).head_local)).z
model_marks = {
    'sole': 0.0,
    'knee': hfrac(bz('calf_l')),
    'crotch': hfrac(np.max(V[[i for i, d in enumerate(DOM) if d.startswith('thigh')], 2][V[[i for i, d in enumerate(DOM) if d.startswith('thigh')], 0] ** 2 < 0.0004])) if False else hfrac(bz('thigh_l')) - 0.035,
    'finger': hfrac(V[[i for i, d in enumerate(DOM) if d.startswith(('middle', 'index', 'ring', 'pinky'))], 2].min()),
    'shoulder': hfrac(bz('upperarm_l')),
    'chin': hfrac(V[[i for i, d in enumerate(DOM) if d == 'Head' and abs(V[i, 0]) < 0.02 and V[i, 1] < (arm.matrix_world @ bone('Head').head_local).y - 0.03], 2].min()),
    'top': SK,
}
sheet_marks = {'sole': 0.0, 'knee': 0.237, 'crotch': 0.398, 'finger': 0.365, 'shoulder': 0.755, 'chin': 0.818, 'top': SK}   # measured on the front view (chin = jaw's lowest skin row)
print('landmarks model', {k: round(v, 3) for k, v in model_marks.items()})
print('landmarks sheet', sheet_marks)
# the finger landmark rides on the arm, not the body column: remap the body with sole/knee/crotch/shoulder/chin/top,
# then scale the arms' length so the fingertips land on the sheet's
keys = ['sole', 'knee', 'crotch', 'shoulder', 'chin', 'top']
xs = [model_marks[k] for k in keys]; ys = [sheet_marks[k] for k in keys]
def remap_h(h): return np.interp(h, xs, ys)
scale_z = (ztop - z0) / SK
for o in meshes:
    P = verts(o)
    P[:, 2] = z0 + remap_h(hfrac(P[:, 2])) * scale_z
    set_verts(o, P)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
for eb in arm.data.edit_bones:
    for attr in ('head', 'tail'):
        p = arm.matrix_world @ getattr(eb, attr)
        p.z = z0 + remap_h(hfrac(p.z)) * scale_z
        setattr(eb, attr, arm.matrix_world.inverted() @ p)
bpy.ops.object.mode_set(mode='OBJECT')

# arm length: scale arm vertices along the arm from the shoulder so the fingertips reach the sheet's height
V = verts(body)
arm_idx = {s: [i for i, d in enumerate(DOM) if d.endswith('_' + s) and any(d.startswith(p) for p in ('upperarm', 'lowerarm', 'hand', 'thumb', 'index', 'middle', 'ring', 'pinky'))] for s in 'lr'}
for s in 'lr':
    sh = arm.matrix_world @ bone('upperarm_' + s).head_local
    tip = V[arm_idx[s], 2].min()
    want_tip = z0 + sheet_marks['finger'] * scale_z
    k = (sh.z - want_tip) / (sh.z - tip)
    for o in meshes:
        P = verts(o); D = dominant(o)
        sel = [i for i, d in enumerate(D) if d.endswith('_' + s) and any(d.startswith(p) for p in ('upperarm', 'lowerarm', 'hand', 'thumb', 'index', 'middle', 'ring', 'pinky'))]
        if sel:
            P[sel] = np.array(sh) + (P[sel] - np.array(sh)) * k
            set_verts(o, P)
    bpy.ops.object.mode_set(mode='EDIT')
    for eb in arm.data.edit_bones:
        if eb.name.endswith('_' + s) and any(eb.name.startswith(p) for p in ('upperarm', 'lowerarm', 'hand', 'thumb', 'index', 'middle', 'ring', 'pinky')):
            for attr in ('head', 'tail'):
                p = arm.matrix_world @ getattr(eb, attr)
                setattr(eb, attr, arm.matrix_world.inverted() @ (sh + (p - sh) * k))
    bpy.ops.object.mode_set(mode='OBJECT')

# ---------------------------------------------------------------- 3. width / depth fitting per height and region
def region(d):
    if d.startswith(('thigh', 'calf', 'foot', 'ball')): return 'leg_' + d[-1]
    if any(d.startswith(p) for p in ('upperarm', 'lowerarm', 'hand', 'thumb', 'index', 'middle', 'ring', 'pinky')): return 'arm_' + d[-1]
    if d in ('Head', 'neck_01'): return 'head'
    return 'torso'

def model_masks():
    P = verts(body); T = tris(body)
    zmin = P[:, 2].min(); vmax = zmin + (P[:, 2].max() - zmin) / SK
    fb = (P[:, 0].min() - 0.05, P[:, 0].max() + 0.05); sb = (P[:, 1].min() - 0.05, P[:, 1].max() + 0.05)
    mf = F.rasterize(np.stack([P[T][..., 0], P[T][..., 2]], -1), H, (fb[0], fb[1], zmin, vmax))
    ms = F.rasterize(np.stack([P[T][..., 1], P[T][..., 2]], -1), H, (sb[0], sb[1], zmin, vmax))   # side: front (-y) to the left, as on the sheet
    return mf, ms, (H - 1) / (vmax - zmin), zmin, fb[0], sb[0]

def report(tag):
    mf, ms, ppm, zmin, _, _ = model_masks()
    errs = []
    for frac in np.arange(0.03, 0.97, 0.01):
        y = int(round((H - 1) * (1 - frac)))
        a = front[y].sum(); b = mf[y].sum(); c = side[y].sum(); d = ms[y].sum()
        if a and b: errs.append(abs(a - b) / a)
        if c and d: errs.append(abs(c - d) / c)
    iou_f = (np.logical_and(*_align(front, mf)).sum() / np.logical_or(*_align(front, mf)).sum())
    iou_s = (np.logical_and(*_align(side, ms)).sum() / np.logical_or(*_align(side, ms)).sum())
    print(f'[{tag}] mean width/depth error {100 * np.mean(errs):.1f}%  silhouette overlap front {100 * iou_f:.1f}%  side {100 * iou_s:.1f}%')
    return mf, ms, {'mean_row_error_pct': round(100 * float(np.mean(errs)), 1), 'iou_front_pct': round(100 * float(iou_f), 1), 'iou_side_pct': round(100 * float(iou_s), 1)}

def _align(a, b):
    """centre both masks horizontally on their own centre of mass and pad to the same size"""
    h = max(a.shape[0], b.shape[0]); w = max(a.shape[1], b.shape[1]) + 40
    out_ = []
    for m in (a, b):
        cx = np.where(m)[1].mean()
        c = np.zeros((h, w), bool)
        ox = int(round(w / 2 - cx))
        c[:m.shape[0], max(0, ox):max(0, ox) + m.shape[1]] = m[:, :min(m.shape[1], w - max(0, ox))]
        out_.append(c)
    return out_

HAND = ('hand', 'thumb', 'index', 'middle', 'ring', 'pinky')
def smooth(a, w=9):
    a = np.asarray(a, float); ok = ~np.isnan(a)
    if not ok.any(): return np.ones_like(a)
    a = np.interp(np.arange(len(a)), np.where(ok)[0], a[ok])
    k = np.hanning(w); k /= k.sum()
    return np.convolve(np.pad(a, w // 2, mode='edge'), k, 'valid')

def fit_pass(strength=1.0):
    mf, ms, ppm, zmin, fu0, su0 = model_masks()
    cs = np.where(side)[1].mean(); cm = np.where(ms)[1].mean()
    n = H; nan = np.full(n, np.nan)
    leg_k, tor_k, head_k = nan.copy(), nan.copy(), nan.copy()
    arm_k, arm_c_s, arm_c_m = nan.copy(), nan.copy(), nan.copy()
    sd_k, sd_lo_s, sd_lo_m = nan.copy(), nan.copy(), nan.copy()
    for y in range(n):
        frac = 1 - y / (H - 1)
        sr, mr, ss, msr = F.runs(front[y]), F.runs(mf[y]), F.runs(side[y]), F.runs(ms[y])
        w = lambda r: r[1] - r[0] + 1
        if 0.025 < frac < sheet_marks['crotch'] - 0.01 and len(sr) >= 2 and len(mr) >= 2:
            inner = lambda rr: sorted(rr, key=w)[-2:] if len(rr) > 2 else rr       # the two legs are the widest runs
            leg_k[y] = np.mean([w(r) for r in inner(sr)]) / np.mean([w(r) for r in inner(mr)])
        in_arm_zone = sheet_marks['finger'] - 0.02 < frac < sheet_marks['shoulder'] + 0.01
        if frac > sheet_marks['crotch'] and sr and mr and not (in_arm_zone and len(sr) != len(mr)):
            mid = lambda rr: rr[len(rr) // 2] if len(rr) == 3 else max(rr, key=w)       # the torso is the middle run
            k = w(mid(sr)) / w(mid(mr))
            if frac < sheet_marks['chin']: tor_k[y] = k
            elif frac < 0.885: head_k[y] = k
        if sheet_marks['finger'] + 0.03 < frac < sheet_marks['shoulder'] - 0.06 and len(sr) >= 3 and len(mr) >= 3:
            arm_k[y] = (w(sr[0]) + w(sr[-1])) / (w(mr[0]) + w(mr[-1]))
            arm_c_s[y] = ((sr[-1][0] + sr[-1][1]) - (sr[0][0] + sr[0][1])) / 4       # half the distance between the arms' centres
            arm_c_m[y] = ((mr[-1][0] + mr[-1][1]) - (mr[0][0] + mr[0][1])) / 4
        if ss and msr and 0.025 < frac < 0.885:
            s0 = max(ss, key=w); m0 = max(msr, key=w)
            sd_k[y] = w(s0) / w(m0); sd_lo_s[y] = s0[0] - cs + cm; sd_lo_m[y] = m0[0]
    leg_k, tor_k, head_k, arm_k = smooth(leg_k), smooth(tor_k), smooth(head_k), smooth(arm_k)
    arm_c_s, arm_c_m = smooth(arm_c_s), smooth(arm_c_m)
    sd_k, sd_lo_s, sd_lo_m = smooth(sd_k), smooth(sd_lo_s), smooth(sd_lo_m)
    blend = lambda k: 1 + (np.clip(k, 0.55, 2.2) - 1) * strength
    for o in meshes:
        P = verts(o); DOM_ = dominant(o); Pn = P.copy()
        for i, (p, d) in enumerate(zip(P, DOM_)):
            rg = region(d)
            frac = (p[2] - zmin) * ppm / (H - 1)
            y = int(np.clip(round((H - 1) * (1 - frac)), 0, H - 1))
            if rg.startswith('leg'):
                cx = (arm.matrix_world @ arm.data.bones['calf_' + rg[-1]].head_local).x
                Pn[i, 0] = cx + (p[0] - cx) * blend(leg_k[y])
            elif rg.startswith('arm'):
                sgn = 1 if p[0] > 0 else -1
                if d.startswith(HAND):                                   # hands keep their shape; ride with the wrist
                    yw = int((H - 1) * (1 - (sheet_marks['finger'] + 0.06)))
                    shift = (arm_c_s[yw] - arm_c_m[yw]) / ppm * strength
                    Pn[i, 0] = p[0] + sgn * shift
                else:
                    cxm = sgn * (arm_c_m[y] / ppm)                            # arm centre in metres from the body's middle
                    cxs = sgn * (arm_c_s[y] / ppm)
                    Pn[i, 0] = p[0] + (cxs - cxm) * strength + (p[0] - cxm) * (blend(arm_k[y]) - 1)
            else:
                k = tor_k[y] if frac < sheet_marks['chin'] else head_k[min(y, int((H - 1) * (1 - 0.885)))] if frac > 0.885 else head_k[y]
                if frac > 0.885: k = head_k[int((H - 1) * (1 - 0.884))]
                Pn[i, 0] = p[0] * blend(k)
            yy = max(y, int((H - 1) * (1 - 0.884)))
            if rg.startswith('arm') and d.startswith(HAND): yy = int((H - 1) * (1 - (sheet_marks['finger'] + 0.06)))
            if True:
                u = (p[1] - su0) * ppm
                k = blend(sd_k[yy]) if (frac < sheet_marks['chin'] and not rg.startswith('arm')) else 1.0
                un = sd_lo_s[yy] + (u - sd_lo_m[yy]) * k
                Pn[i, 1] = su0 + (u + (un - u) * strength) / ppm
        set_verts(o, Pn)

before_f, before_s, rep0 = report('base after pose + heights')
for k in range(4):
    fit_pass(0.8 if k < 3 else 0.5)
    _, _, rep = report(f'pass {k + 1}')

mf, ms, rep = report('final')
json.dump({'before': rep0, 'after': rep}, open(os.path.join(out, 'match.json'), 'w'), indent=1)

def overlay(sm_, mm, path):
    A, B = _align(sm_, mm)
    img = np.zeros(A.shape + (3,), np.uint8) + 18
    img[..., 0] = np.where(A, 235, 18)
    img[..., 1] = np.where(B, 210, img[..., 1]); img[..., 2] = np.where(B, 210, img[..., 2])
    img.tofile(path + f'_{A.shape[1]}x{A.shape[0]}.rgb')
overlay(front, before_f, os.path.join(out, 'before_front')); overlay(side, before_s, os.path.join(out, 'before_side'))
overlay(front, mf, os.path.join(out, 'after_front')); overlay(side, ms, os.path.join(out, 'after_side'))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, 'nico_fit.blend'))
print('saved', os.path.join(out, 'nico_fit.blend'))
