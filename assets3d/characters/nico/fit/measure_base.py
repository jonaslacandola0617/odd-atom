"""Pose the Quaternius base (CC0) into the sheet's arms-down stance, scale it, and compare its silhouette with the sheet.
Run: <bpy venv>/bin/python -I measure_base.py -- <base.gltf> <sheet.rgb> <out_dir>"""
import bpy, sys, os, math, json
import numpy as np
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fitlib as F

base, rgb, out = sys.argv[sys.argv.index('--') + 1:][:3]
os.makedirs(out, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=base)
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
body = bpy.data.objects['SuperHero_Male']
for o in list(bpy.data.objects):
    if o.name == 'Icosphere': bpy.data.objects.remove(o)

# which way does it face? (eyes are in front of the head centre)
eyes = bpy.data.objects['Eyes']
ey = np.mean([(eyes.matrix_world @ v.co).y for v in eyes.data.vertices])
hd = arm.matrix_world @ arm.data.bones['Head'].head_local
print('eyes y', round(ey, 3), 'head y', round(hd.y, 3), '-> faces', '-Y' if ey < hd.y else '+Y')

# arms down: rotate upper arms about the forward axis so they hang about 9 degrees out from vertical
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE')
for side, s in (('l', 1), ('r', -1)):
    pb = arm.pose.bones['upperarm_' + side]
    bone = arm.data.bones['upperarm_' + side]
    h = arm.matrix_world @ bone.head_local; t = arm.matrix_world @ bone.tail_local
    cur = (t - h).normalized()
    want = Vector((s * math.sin(math.radians(9)), 0, -math.cos(math.radians(9))))
    q = cur.rotation_difference(want)
    pb.rotation_mode = 'QUATERNION'
    M = bone.matrix_local.to_3x3()
    pb.rotation_quaternion = (M.inverted() @ q.to_matrix() @ M).to_quaternion()
bpy.context.view_layer.update()
bpy.ops.object.mode_set(mode='OBJECT')

deps = bpy.context.evaluated_depsgraph_get()
ev = body.evaluated_get(deps)
mesh = ev.to_mesh()
V = np.array([tuple(ev.matrix_world @ v.co) for v in mesh.vertices], float)
mesh.calc_loop_triangles()
T = np.array([lt.vertices[:] for lt in mesh.loop_triangles])
print('posed body bounds', V.min(0).round(3), V.max(0).round(3))

# sheet silhouettes
mask = F.sheet_mask(rgb)
front = F.view_crop(mask, F.FRONT_X); side = F.view_crop(mask, F.SIDE_X)
H = front.shape[0]
# model: scale so the skull top sits where the sheet's skull would be (hair adds about 2.5% on top)
zmin, zmax = V[:, 2].min(), V[:, 2].max()
skull_frac = 0.975
vmax = zmin + (zmax - zmin) / skull_frac
fb = (V[:, 0].min() - 0.05, V[:, 0].max() + 0.05, zmin, vmax)
sb = (V[:, 1].min() - 0.05, V[:, 1].max() + 0.05, zmin, vmax)
mf = F.rasterize(np.stack([V[T][..., 0], V[T][..., 2]], -1), H, fb)
ms = F.rasterize(np.stack([-V[T][..., 1], V[T][..., 2]], -1), H, sb)   # side view: front (-y) to the left like the sheet

rows = []
for frac in np.round(np.arange(0.02, 0.99, 0.03), 2):
    y = int((H - 1) * (1 - frac))
    rows.append({'h': float(frac), 'sheet_front': F.runs(front[y]), 'model_front': F.runs(mf[y]),
                 'sheet_side': F.runs(side[y]), 'model_side': F.runs(ms[y])})
json.dump({'H': H, 'model_px_per_m': float((H - 1) / (vmax - zmin)), 'rows': rows}, open(os.path.join(out, 'profiles.json'), 'w'), indent=1)
for r in rows:
    w = lambda rr: [b - a + 1 for a, b in rr]
    print(f"h={r['h']:.2f} front sheet {w(r['sheet_front'])} model {w(r['model_front'])} | side sheet {w(r['sheet_side'])} model {w(r['model_side'])}")

# overlay images (sheet silhouette red, model silhouette cyan) for a visual check
def overlay(sm, mm, path):
    h = max(sm.shape[0], mm.shape[0]); w = max(sm.shape[1], mm.shape[1])
    img = np.zeros((h, w, 3), np.uint8) + 20
    ox = (w - sm.shape[1]) // 2; img[:sm.shape[0], ox:ox + sm.shape[1], 0] = np.where(sm, 230, 20)
    ox2 = (w - mm.shape[1]) // 2; sub = img[:mm.shape[0], ox2:ox2 + mm.shape[1]]
    sub[..., 1] = np.where(mm, 200, sub[..., 1]); sub[..., 2] = np.where(mm, 200, sub[..., 2])
    img.tofile(path + '.rgb'); print('overlay', path, img.shape)
overlay(front, mf, os.path.join(out, 'front'))
overlay(side, ms, os.path.join(out, 'side'))
