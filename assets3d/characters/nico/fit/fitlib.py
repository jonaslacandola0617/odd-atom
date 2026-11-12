"""Shared helpers for fitting a 3D body to the approved Nico design sheet by silhouette.

The sheet (assets3d/characters/nico/design/nico-sheet-chatgpt-v1.png) shows Nico front / three-quarter / side / back on
a plain grey ground. We measure the sheet's silhouette per height (width in the front view, depth in the side view)
and compare it with the model's orthographic silhouette, rasterised from its triangles.
"""
import numpy as np

SHEET_W, SHEET_H = 1536, 1024
FRONT_X = (150, 370)
SIDE_X = (770, 920)


def sheet_mask(rgb_path):
    a = np.fromfile(rgb_path, np.uint8).reshape(SHEET_H, SHEET_W, 3).astype(int)
    bg = np.median(a[5:40, 5:40].reshape(-1, 3), 0)
    return np.abs(a - bg).sum(2) > 45


def view_crop(mask, xr):
    m = mask[:606, xr[0]:xr[1]]
    ys = np.where(m.any(1))[0]
    return m[ys.min():ys.max() + 1]


def runs(row):
    out, start = [], None
    for x, c in enumerate(row):
        if c and start is None: start = x
        if not c and start is not None:
            if x - 1 - start >= 2: out.append((int(start), int(x - 1)))
            start = None
    if start is not None and len(row) - 1 - start >= 2: out.append((int(start), int(len(row) - 1)))
    return out


def rasterize(tris2d, res_h, bounds):
    """tris2d: (n,3,2) in metres (u = horizontal, v = up). bounds = (umin, umax, vmin, vmax). Returns a bool mask with
    row 0 at the top, scaled so that vmax-vmin spans res_h rows (square pixels)."""
    umin, umax, vmin, vmax = bounds
    s = (res_h - 1) / (vmax - vmin)
    res_w = int((umax - umin) * s) + 2
    m = np.zeros((res_h, res_w), bool)
    P = np.empty_like(tris2d)
    P[..., 0] = (tris2d[..., 0] - umin) * s
    P[..., 1] = (vmax - tris2d[..., 1]) * s
    for t in P:
        x0, x1 = int(max(0, np.floor(t[:, 0].min()))), int(min(res_w - 1, np.ceil(t[:, 0].max())))
        y0, y1 = int(max(0, np.floor(t[:, 1].min()))), int(min(res_h - 1, np.ceil(t[:, 1].max())))
        if x1 < x0 or y1 < y0: continue
        xs, ys = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        (ax, ay), (bx, by), (cx, cy) = t
        d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
        if abs(d) < 1e-9: continue
        l1 = ((by - cy) * (xs - cx) + (cx - bx) * (ys - cy)) / d
        l2 = ((cy - ay) * (xs - cx) + (ax - cx) * (ys - cy)) / d
        inside = (l1 >= -0.01) & (l2 >= -0.01) & (1 - l1 - l2 >= -0.01)
        m[y0:y1 + 1, x0:x1 + 1] |= inside
    return m
