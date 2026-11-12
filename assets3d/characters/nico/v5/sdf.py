"""Implicit-surface ("SDF") modelling helpers for Nico v5: shapes are blended with smooth unions, like clay added in a
sculpt, then meshed with marching cubes. All functions work on numpy arrays of points (..., 3) in sheet pixels."""
import numpy as np


def smin(a, b, k):
    """polynomial smooth minimum: blends two shapes with a fillet of size k"""
    if k <= 0: return np.minimum(a, b)
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return b * (1 - h) + a * h - k * h * (1 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


def ellipsoid(P, c, r, R=None):
    """approximate distance to an ellipsoid centred at c with radii r (optionally rotated by matrix R, world->local)"""
    q = P - np.asarray(c, float)
    if R is not None: q = q @ np.asarray(R, float).T
    r = np.asarray(r, float)
    k0 = np.linalg.norm(q / r, axis=-1)
    k1 = np.linalg.norm(q / (r * r), axis=-1)
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)


def round_cone(P, a, b, ra, rb):
    """a capsule whose radius goes from ra at a to rb at b"""
    a = np.asarray(a, float); b = np.asarray(b, float)
    ba = b - a; L2 = ba @ ba
    t = np.clip(((P - a) @ ba) / L2, 0.0, 1.0)
    proj = a + t[..., None] * ba
    return np.linalg.norm(P - proj, axis=-1) - (ra + (rb - ra) * t)


def chain(P, pts, radii, k=0.0):
    """a smooth chain of round cones through several points (a limb, a finger, a hair clump)"""
    d = None
    for i in range(len(pts) - 1):
        di = round_cone(P, pts[i], pts[i + 1], radii[i], radii[i + 1])
        d = di if d is None else smin(d, di, k)
    return d


def loft(P, rows, power=2.4):
    """a vertical stack of super-ellipse cross-sections: rows = [(z, half_width, half_depth, centre_y), ...] sorted by z.
    Between rows the section is interpolated; outside [z0, z1] the shape is capped flat (cut it with planes as needed)."""
    rows = np.asarray(rows, float)
    z = P[..., 2]
    hw = np.interp(z, rows[:, 0], rows[:, 1]); hd = np.interp(z, rows[:, 0], rows[:, 2]); cy = np.interp(z, rows[:, 0], rows[:, 3])
    nx = np.abs(P[..., 0]) / hw; ny = np.abs(P[..., 1] - cy) / hd
    n = (nx ** power + ny ** power) ** (1.0 / power)
    d = (n - 1.0) * np.minimum(hw, hd)
    d = np.maximum(d, rows[0, 0] - z)
    return np.maximum(d, z - rows[-1, 0])


def box(P, c, half, r=0.0):
    q = np.abs(P - np.asarray(c, float)) - (np.asarray(half, float) - r)
    return np.linalg.norm(np.maximum(q, 0.0), axis=-1) + np.minimum(np.max(q, axis=-1), 0.0) - r


def rot_z(deg):
    t = np.radians(deg); c, s = np.cos(t), np.sin(t)
    return np.array([[c, s, 0], [-s, c, 0], [0, 0, 1]])


def rot_x(deg):
    t = np.radians(deg); c, s = np.cos(t), np.sin(t)
    return np.array([[1, 0, 0], [0, c, s], [0, -s, c]])


def rot_y(deg):
    t = np.radians(deg); c, s = np.cos(t), np.sin(t)
    return np.array([[c, 0, -s], [0, 1, 0], [s, 0, c]])


class Grid:
    """a sampling grid over a box; evaluate a field function on it and mesh the zero level"""
    def __init__(self, lo, hi, step):
        self.lo = np.asarray(lo, float); self.step = step
        n = np.ceil((np.asarray(hi, float) - self.lo) / step).astype(int) + 1
        self.n = n
        xs, ys, zs = [self.lo[i] + np.arange(n[i]) * step for i in range(3)]
        self.P = np.stack(np.meshgrid(xs, ys, zs, indexing='ij'), -1)

    def mesh(self, field):
        from skimage.measure import marching_cubes
        f = np.pad(field, 1, constant_values=1e3)
        v, faces, _, _ = marching_cubes(f, 0.0)
        v = (v - 1) * self.step + self.lo
        return v, faces[:, ::-1]


    def add(self, field, d_fn, lo, hi, k=0.0):
        """smooth-union a small part into field, evaluating it only inside its box [lo, hi]"""
        i0 = np.clip(np.floor((np.asarray(lo) - self.lo) / self.step).astype(int), 0, self.n - 1)
        i1 = np.clip(np.ceil((np.asarray(hi) - self.lo) / self.step).astype(int) + 1, 0, self.n)
        sl = tuple(slice(a, b) for a, b in zip(i0, i1))
        field[sl] = smin(field[sl], d_fn(self.P[sl]), k)
