// TRANSFERS: PSX/PS1 survival-horror look test (2026-11-15, after the user chose the PSX style).
// Built from the user's PSX packs (licences unconfirmed: the GLBs live in the git-ignored
// public/assets/3d/psx-local/, made by assets3d/characters/psx/convert_packs.py and restyle_textures.py).
// 320x180 internal (6x nearest upscale to 1080p), vertex snapping, affine textures, 15-bit colour + dither,
// fog, motivated dark light. Shop shots are letterboxed to 2.39:1; the 1991 tape plays 4:3.
import React, {useEffect, useMemo, useState} from 'react';
import {AbsoluteFill, Sequence, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone as skClone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {canvasTex, grimeTex, nearest, prng, psx, psxify} from '../../psx';
import {Expr, FaceSet, loadFaces, setFace} from './faces';

export const PSX_FPS = 30;
// Internal resolution: 320x180 by default (6x upscale); 640x360 tried at the user's request (3x).
// Set per render through the `lw` prop; vertex snapping follows the pixel grid.
let LW = 320, LH = 180, K = 6;
const P: {snap: [number, number]} = {snap: [LW / 2, LH / 2]};
const setRes = (lw: number) => {
	LW = lw;
	LH = Math.round((lw * 9) / 16);
	K = 1920 / lw;
	P.snap = [LW / 2, LH / 2];
};
const TW = () => Math.round((LH * 4) / 3); // the 4:3 tape picture

// ------------------------------------------------------------------ timeline (frames)
export const SHOTS = {wide: [0, 105], nico: [105, 195], tape: [195, 285], door: [285, 375]} as const;
export const PSX_FRAMES = 390;

// ------------------------------------------------------------------ math helpers
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const wp = (o: THREE.Object3D) => o.getWorldPosition(new THREE.Vector3());
const rotWorldQ = (bone: THREE.Object3D, q: THREE.Quaternion) => {
	bone.updateWorldMatrix(true, false);
	const pq = bone.parent!.getWorldQuaternion(new THREE.Quaternion());
	bone.quaternion.premultiply(pq.clone().invert().multiply(q).multiply(pq));
	bone.updateMatrixWorld(true);
};
const rotW = (bone: THREE.Object3D, axis: THREE.Vector3, a: number) => rotWorldQ(bone, new THREE.Quaternion().setFromAxisAngle(axis.clone().normalize(), a));
const aim = (bone: THREE.Object3D, child: THREE.Object3D, target: THREE.Vector3) => {
	const h = wp(bone);
	const cur = wp(child).sub(h).normalize(), des = target.clone().sub(h).normalize();
	rotWorldQ(bone, new THREE.Quaternion().setFromUnitVectors(cur, des));
};
const ik = (up: THREE.Object3D, lo: THREE.Object3D, hand: THREE.Object3D, target: THREE.Vector3, pole: THREE.Vector3) => {
	const S = wp(up), E0 = wp(lo), W0 = wp(hand);
	const a = E0.distanceTo(S), b = W0.distanceTo(E0);
	const toT = target.clone().sub(S);
	const d = Math.min(toT.length(), a + b - 1e-3);
	const n = toT.normalize();
	const x = (a * a - b * b + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a * a - x * x));
	const p = pole.clone().sub(n.clone().multiplyScalar(pole.dot(n))).normalize();
	const E = S.clone().add(n.clone().multiplyScalar(x)).add(p.multiplyScalar(h));
	aim(up, lo, E);
	aim(lo, hand, S.clone().add(n.multiplyScalar(d)));
};

// ------------------------------------------------------------------ assets
const GLBS = ['nico_base', 'bea_base', 'figure_base', 'tv', 'desk', 'desklamp', 'monitor', 'pc', 'keyboard', 'chair', 'bookcase', 'binders', 'cabinet',
	'wallclock', 'mug', 'shelf', 'box', 'floppy', 'trashcan', 'streetlight', 'trash_urban', 'conditioner', 'dorihome', 'fridge_old', 'glasses_user'] as const;
type GlbName = (typeof GLBS)[number];
export type Assets = {glb: Record<GlbName, THREE.Group>; faces: {nico: FaceSet; bea: FaceSet}};

export const useAssets = () => {
	const [assets, set] = useState<Assets | null>(null);
	const [handle] = useState(() => delayRender('psx assets', {timeoutInMilliseconds: 120000}));
	useEffect(() => {
		const loader = new GLTFLoader();
		Promise.all([
			Promise.all(GLBS.map((n) => loader.loadAsync(staticFile(`assets/3d/psx-local/${n}.glb`)).then((g) => [n, g.scene] as const))),
			loadFaces('nico'),
			loadFaces('bea'),
		]).then(([gs, nico, bea]) => {
			set({glb: Object.fromEntries(gs) as Assets['glb'], faces: {nico, bea}});
			continueRender(handle);
		}).catch((e) => { console.error(e); continueRender(handle); });
	}, [handle]);
	return assets;
};

/** Clone a prop, PSX its materials, rotate, scale (to height h or factor s) and stand it at `at` (bottom centre). */
const prop = (src: THREE.Object3D, at: [number, number, number], o: {ry?: number; h?: number; s?: number; tint?: THREE.ColorRepresentation} = {}) => {
	const c = src.clone(true);
	psxify(c, {...P, tint: o.tint});
	c.rotation.y = o.ry ?? 0;
	c.updateMatrixWorld(true);
	let b = new THREE.Box3().setFromObject(c);
	const k = o.h ? o.h / (b.max.y - b.min.y) : o.s ?? 1;
	c.scale.multiplyScalar(k);
	c.updateMatrixWorld(true);
	b = new THREE.Box3().setFromObject(c);
	c.position.x += at[0] - (b.min.x + b.max.x) / 2;
	c.position.y += at[1] - b.min.y;
	c.position.z += at[2] - (b.min.z + b.max.z) / 2;
	return c;
};

const lam = (o: THREE.MeshLambertMaterialParameters) => psx(new THREE.MeshLambertMaterial(o), P);
const box = (w: number, h: number, d: number, mat: THREE.Material, at: [number, number, number], seg = 1) => {
	const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d, Math.max(1, Math.round(w * seg)), Math.max(1, Math.round(h * seg)), Math.max(1, Math.round(d * seg))), mat);
	m.position.set(...at);
	return m;
};
const black = () => new THREE.MeshBasicMaterial({color: 0x000000});

// ------------------------------------------------------------------ characters
type Char = {holder: THREE.Group; root: THREE.Object3D; bone: (n: string) => THREE.Object3D; rest: Map<THREE.Object3D, THREE.Quaternion>; height: number; L: (x: number, y: number, z: number) => THREE.Vector3; D: (x: number, y: number, z: number) => THREE.Vector3};

const makeChar = (src: THREE.Group, height: number, opts: {faces?: FaceSet; material?: THREE.Material; frontRy?: number} = {}): Char => {
	const root = skClone(src);
	root.rotation.y = opts.frontRy ?? 0; // turn the model so it faces local +Z
	psxify(root, P);
	root.traverse((o) => {
		const m = o as THREE.Mesh;
		if (!m.isMesh) return;
		m.frustumCulled = false;
		if (opts.material) m.material = opts.material;
	});
	if (opts.faces) setFace(root, opts.faces, 'neutral');
	const holder = new THREE.Group();
	holder.add(root);
	root.updateMatrixWorld(true);
	const b = new THREE.Box3().setFromObject(root);
	const k = height / (b.max.y - b.min.y);
	root.scale.multiplyScalar(k);
	root.updateMatrixWorld(true);
	const b2 = new THREE.Box3().setFromObject(root);
	root.position.x -= (b2.min.x + b2.max.x) / 2;
	root.position.z -= (b2.min.z + b2.max.z) / 2;
	root.position.y -= b2.min.y;
	const rest = new Map<THREE.Object3D, THREE.Quaternion>();
	root.traverse((o) => { if ((o as THREE.Bone).isBone) rest.set(o, o.quaternion.clone()); });
	const byName = new Map<string, THREE.Object3D>();
	root.traverse((o) => byName.set(o.name, o));
	return {
		holder, root, rest, height,
		bone: (n) => { const b = byName.get(n); if (!b) throw new Error('no bone ' + n); return b; },
		L: (x, y, z) => holder.localToWorld(V(x, y, z)),
		D: (x, y, z) => V(x, y, z).transformDirection(holder.matrixWorld),
	};
};
const reset = (c: Char) => { c.rest.forEach((q, b) => b.quaternion.copy(q)); c.holder.updateMatrixWorld(true); };

// bone names per rig (three.js strips '.' and ':' from glTF node names)
const NICO_B = {hips: 'pelvis', spine: 'spine', chest: 'chest', neck: 'neck', head: 'head', ua: (s: 'l' | 'r') => `upper_arm_${s === 'l' ? 'left' : 'right'}`, fa: (s: 'l' | 'r') => `forearm_${s === 'l' ? 'left' : 'right'}`, hand: (s: 'l' | 'r') => `hand_${s === 'l' ? 'left' : 'right'}`, th: (s: 'l' | 'r') => `thigh_${s === 'l' ? 'left' : 'right'}`, sh: (s: 'l' | 'r') => `shin${s === 'l' ? 'L' : 'R'}`, ft: (s: 'l' | 'r') => `foot_${s === 'l' ? 'left' : 'right'}`};
const MIX = (s: 'l' | 'r') => (s === 'l' ? 'Left' : 'Right');
const MIX_B = {hips: 'mixamorigHips', spine: 'mixamorigSpine', chest: 'mixamorigSpine2', neck: 'mixamorigNeck', head: 'mixamorigHead', ua: (s: 'l' | 'r') => `mixamorig${MIX(s)}Arm`, fa: (s: 'l' | 'r') => `mixamorig${MIX(s)}ForeArm`, hand: (s: 'l' | 'r') => `mixamorig${MIX(s)}Hand`, th: (s: 'l' | 'r') => `mixamorig${MIX(s)}UpLeg`, sh: (s: 'l' | 'r') => `mixamorig${MIX(s)}Leg`, ft: (s: 'l' | 'r') => `mixamorig${MIX(s)}Foot`};
type Bones = typeof NICO_B;

/** Seated at a desk (desk in front, local +Z). `lean`, `look` (yaw, pitch) in radians. */
const poseSeated = (c: Char, B: Bones, o: {lean?: number; yaw?: number; pitch?: number; handZ?: number; deskY?: number} = {}) => {
	reset(c);
	const b = c.bone;
	const side = c.D(1, 0, 0), up = c.D(0, 1, 0);
	rotW(b(B.spine), side, o.lean ?? 0.18);
	for (const s of ['l', 'r'] as const) {
		const sx = s === 'l' ? 1 : -1;
		const hip = wp(b(B.th(s)));
		const knee = hip.clone().add(c.D(sx * 0.07, -0.02, 0.44));
		aim(b(B.th(s)), b(B.sh(s)), knee);
		aim(b(B.sh(s)), b(B.ft(s)), knee.clone().add(c.D(0, -0.45, 0.03)));
		const sh = wp(b(B.ua(s)));
		const tgt = c.L(sx * 0.2, o.deskY ?? 0.76, 0).setComponent(1, (o.deskY ?? 0.76) + c.holder.position.y * 0);
		const fwd = c.D(0, 0, 1).multiplyScalar(o.handZ ?? 0.42);
		const t2 = V(sh.x, 0, sh.z).add(fwd).add(c.D(sx * -0.05, 0, 0));
		t2.y = tgt.y;
		ik(b(B.ua(s)), b(B.fa(s)), b(B.hand(s)), t2, c.D(sx * 0.6, -1, -0.3));
	}
	rotW(b(B.neck), up, (o.yaw ?? 0) * 0.4);
	rotW(b(B.head), up, (o.yaw ?? 0) * 0.6);
	rotW(b(B.head), c.D(1, 0, 0), o.pitch ?? 0.05);
};

/** Asleep on her right side, knees drawn up, hands under her cheek. The holder's rotation lays her down. */
const poseAsleep = (c: Char, B: Bones) => {
	reset(c);
	const b = c.bone;
	for (const s of ['l', 'r'] as const) {
		const sx = s === 'l' ? 1 : -1;
		const hip = wp(b(B.th(s)));
		const knee = hip.clone().add(c.D(sx * 0.04, -0.12, 0.3));
		aim(b(B.th(s)), b(B.sh(s)), knee);
		aim(b(B.sh(s)), b(B.ft(s)), knee.clone().add(c.D(0, -0.3, -0.08)));
		const head = wp(b(B.head));
		ik(b(B.ua(s)), b(B.fa(s)), b(B.hand(s)), head.clone().add(c.D(sx * 0.02 - 0.06, -0.12, 0.12)), c.D(0, -1, 0.5));
	}
	rotW(b(B.head), c.D(0, 0, 1), -0.25);
	rotW(b(B.spine), c.D(1, 0, 0), 0.25);
};

/** Nico's own 3D additions on the restyled pack body: black rectangular glasses and messy black hair clumps. */
// The user's eyeglasses model (oculos.obj, 2026-11-15), measured in glTF units: frame front 1.547 wide
// (x -0.769..0.778), lens centres at x = +-0.414, lens/frame centre y = 0.005, frame back face z = 0.43,
// front z = 0.487, temples run back to z = -0.868.
const GL = {lensX: 0.414, frameW: 1.547, centreY: 0.005, backZ: 0.43};
/** Frame size relative to Nico's eye spacing (1 = lens centres exactly on the pupils). */
const GLASSES_SIZE = 1.18;
// Nico's pupils on his 256x256 face texture (texels), see assets3d/characters/psx/restyle_textures.py
const NICO_EYES_TEX: [number, number][] = [[161.5, 45.2], [182.6, 45.2]];

/** Find the surface point (holder frame) whose UV is `uv`, among triangles accepted by `keep`. */
const pointAtUV = (mesh: THREE.SkinnedMesh, toHolder: THREE.Matrix4, uv: [number, number], keep: (p: THREE.Vector3) => boolean) => {
	const g = mesh.geometry;
	const pos = g.getAttribute('position'), uvs = g.getAttribute('uv');
	const idx = g.getIndex();
	const n = idx ? idx.count : pos.count;
	const P = (i: number) => mesh.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(pos, i)).applyMatrix4(mesh.matrixWorld).applyMatrix4(toHolder);
	for (let t = 0; t < n; t += 3) {
		const [i0, i1, i2] = [0, 1, 2].map((k) => (idx ? idx.getX(t + k) : t + k));
		const [ax, ay, bx, by, cx, cy] = [uvs.getX(i0), uvs.getY(i0), uvs.getX(i1), uvs.getY(i1), uvs.getX(i2), uvs.getY(i2)];
		const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
		if (Math.abs(d) < 1e-12) continue;
		const w0 = ((by - cy) * (uv[0] - cx) + (cx - bx) * (uv[1] - cy)) / d;
		const w1 = ((cy - ay) * (uv[0] - cx) + (ax - cx) * (uv[1] - cy)) / d;
		const w2 = 1 - w0 - w1;
		if (w0 < -1e-4 || w1 < -1e-4 || w2 < -1e-4) continue;
		const p = P(i0).multiplyScalar(w0).add(P(i1).multiplyScalar(w1)).add(P(i2).multiplyScalar(w2));
		if (keep(p)) return p;
	}
	return null;
};

/** Measured fit of the glasses on Nico's head (holder frame, rest pose): centre, scale. */
export type GlassesFit = {centre: THREE.Vector3; k: number; eyeL: THREE.Vector3; eyeR: THREE.Vector3; headW: number; earW: number; noseZ: number};
const fitGlasses = (c: Char, mesh: THREE.SkinnedMesh, pts: THREE.Vector3[], top: number): GlassesFit => {
	const toHolder = c.holder.matrixWorld.clone().invert();
	const front = (p: THREE.Vector3) => p.y > top - 0.2 && p.z > 0;
	const [eyeL, eyeR] = NICO_EYES_TEX.map(([u, v]) => pointAtUV(mesh, toHolder, [u / 256, v / 256], front)!);
	const mid = eyeL.clone().add(eyeR).multiplyScalar(0.5);
	const eyeZ = Math.max(eyeL.z, eyeR.z);
	// head width just behind the eyes (temple level), and at the ears where the arms pass
	const band = pts.filter((p) => Math.abs(p.y - mid.y) < 0.025);
	const headW = 2 * Math.max(...band.filter((p) => p.z < eyeZ - 0.025 && p.z > eyeZ - 0.07).map((p) => Math.abs(p.x - mid.x)));
	const earW = 2 * Math.max(...band.filter((p) => p.z < eyeZ - 0.07 && p.z > eyeZ - 0.15).map((p) => Math.abs(p.x - mid.x)));
	// nose root: the most forward point between the eyes, at and just above eye level
	const noseZ = Math.max(...pts.filter((p) => Math.abs(p.x - mid.x) < 0.012 && p.y > mid.y - 0.004 && p.y < mid.y + 0.012).map((p) => p.z));
	const ipd = eyeL.distanceTo(eyeR);
	// sized from his eye spacing (user, 2026-11-15: "the frames look big for nico"); the arms end inside his
	// low-poly head, as in PS1 games, rather than the frame being widened to clear it
	const k = (GLASSES_SIZE * ipd) / (2 * GL.lensX);
	// sitting on the face: back face 5 mm off the eyes, the bridge resting on (slightly into) the nose root,
	// lowered so the pupils sit just above the lens centres
	const backZ = eyeZ + 0.005;
	const centre = V(mid.x, mid.y - GL.centreY * k - 0.005, backZ - GL.backZ * k);
	return {centre, k, eyeL, eyeR, headW, earW, noseZ};
};

const addNicoParts = (c: Char, glassesModel?: THREE.Object3D) => {
	const head = c.bone(NICO_B.head);
	c.holder.updateMatrixWorld(true);
	const mesh = (() => { let m: THREE.SkinnedMesh | null = null; c.root.traverse((o) => { if ((o as THREE.SkinnedMesh).isSkinnedMesh) m = o as THREE.SkinnedMesh; }); return m!; })();
	// head vertices in the holder's frame (rest pose == bind pose)
	const pos = mesh.geometry.getAttribute('position');
	const v = new THREE.Vector3();
	const inv = c.holder.matrixWorld.clone().invert();
	const pts: THREE.Vector3[] = [];
	for (let i = 0; i < pos.count; i++) {
		v.fromBufferAttribute(pos, i);
		mesh.applyBoneTransform(i, v);
		v.applyMatrix4(mesh.matrixWorld).applyMatrix4(inv);
		if (v.y > c.height * 0.86) pts.push(v.clone());
	}
	const top = Math.max(...pts.map((p) => p.y));
	const front = Math.max(...pts.filter((p) => p.y > top - 0.16 && p.y < top - 0.08).map((p) => p.z));
	const headInv = head.matrixWorld.clone().invert();
	const restQ = head.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(c.holder.getWorldQuaternion(new THREE.Quaternion()));
	const g = new THREE.Group();
	let at = V(0, top - 0.112, front - 0.001);
	if (glassesModel) {
		const fit = fitGlasses(c, mesh, pts, top);
		c.holder.userData.glassesFit = fit;
		const m = glassesModel.clone(true);
		psxify(m, P);
		m.traverse((o) => {
			const mm = o as THREE.Mesh;
			if (!mm.isMesh) return;
			const mat = mm.material as THREE.MeshLambertMaterial;
			mat.alphaTest = 0.5;
			mat.side = THREE.DoubleSide;
		});
		m.scale.setScalar(fit.k);
		g.add(m);
		at = fit.centre;
	} else {
		const frameMat = lam({color: '#0c0b0b'});
		const rim = 0.0045, lw = 0.04, lh = 0.025, gap = 0.012;
		for (const sx of [1, -1]) {
			const cx = sx * (gap / 2 + lw / 2);
			g.add(box(lw, rim, rim, frameMat, [cx, lh / 2, 0]));
			g.add(box(lw, rim, rim, frameMat, [cx, -lh / 2, 0]));
			g.add(box(rim, lh, rim, frameMat, [cx + sx * lw / 2, 0, 0]));
			g.add(box(rim, lh, rim, frameMat, [cx - sx * lw / 2, 0, 0]));
			g.add(box(rim, rim, 0.1, frameMat, [sx * (gap / 2 + lw), lh / 2 - 0.004, -0.05]));
		}
		g.add(box(gap, rim, rim, frameMat, [0, lh / 2 - 0.004, 0]));
	}
	g.traverse((o) => { (o as THREE.Mesh).userData.noFace = true; });
	g.position.copy(c.holder.localToWorld(at.clone()).applyMatrix4(headInv));
	g.quaternion.copy(restQ);
	g.scale.setScalar(1 / head.getWorldScale(new THREE.Vector3()).x);
	head.add(g);
	// hair: a few flat-ish clumps over the scalp, sticking out a little (messy, grown-out)
	const hairMat = lam({color: '#171515'});
	const r = prng(34);
	const scalp = pts.filter((p) => p.y > top - 0.07 && p.z < front - 0.02);
	const centre = V(0, top - 0.1, front - 0.1);
	const hair = new THREE.Group();
	for (let i = 0; i < 0; i++) { // hair cones tried and dropped: they read as a paper crown (see PSX-ASSETS.md)
		const p = scalp[Math.floor(r() * scalp.length)];
		if (!p) break;
		const n = p.clone().sub(centre).normalize();
		const len = 0.035 + r() * 0.035;
		const cone = new THREE.Mesh(new THREE.ConeGeometry(0.022 + r() * 0.01, len, 4), hairMat);
		cone.userData.noFace = true;
		const dir = n.clone().add(V((r() - 0.5) * 0.6, 0.15, -0.35 - r() * 0.3)).normalize();
		cone.quaternion.setFromUnitVectors(V(0, 1, 0), dir);
		cone.position.copy(p.clone().add(dir.clone().multiplyScalar(len * 0.35)));
		hair.add(cone);
	}
	hair.children.forEach((ch) => {
		const wpos = c.holder.localToWorld(ch.position.clone()).applyMatrix4(headInv);
		const q = restQ.clone().multiply(ch.quaternion);
		ch.position.copy(wpos);
		ch.quaternion.copy(q);
	});
	hair.scale.setScalar(1 / head.getWorldScale(new THREE.Vector3()).x);
	hair.children.forEach((ch) => ch.scale.setScalar(head.getWorldScale(new THREE.Vector3()).x));
	head.add(hair);
	hair.scale.setScalar(1);
	hair.children.forEach((ch) => ch.scale.setScalar(1 / head.getWorldScale(new THREE.Vector3()).x));
};

export const buildNico = (a: Assets) => {
	const c = makeChar(a.glb.nico_base, 1.68, {faces: a.faces.nico});
	addNicoParts(c, a.glb.glasses_user);
	return c;
};
export const buildBea = (a: Assets) => {
	const c = makeChar(a.glb.bea_base, 1.3, {faces: a.faces.bea});
	c.bone(MIX_B.head).scale.setScalar(1.1);
	return c;
};

// ------------------------------------------------------------------ the shop (Episode 1, night)
const SHOP = {w: 4, d: 6, h: 2.8};
type Shop = {group: THREE.Group; nico: Char; bea: Char; crt: {tex: THREE.CanvasTexture; ctx: CanvasRenderingContext2D}; crtLight: THREE.PointLight; lamp: THREE.PointLight; rain: THREE.LineSegments; rainBase: Float32Array; nicoSeat: THREE.Vector3};

const buildShop = (a: Assets): Shop => {
	const g = new THREE.Group();
	const {w, d, h} = SHOP;
	const x0 = -w / 2, x1 = w / 2, zb = -d / 2, zf = d / 2;
	const wallM = lam({map: grimeTex(3, '#8a8170', {streaks: true, stains: 10}), color: '#ffffff'});
	(wallM.map as THREE.Texture).wrapS = (wallM.map as THREE.Texture).wrapT = THREE.RepeatWrapping;
	(wallM.map as THREE.Texture).repeat.set(3, 2);
	const floorT = canvasTex(64, 64, (c) => {
		const r = prng(9);
		for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 16) {
			const v = 120 + Math.floor(r() * 24);
			c.fillStyle = `rgb(${v},${v - 6},${v - 14})`;
			c.fillRect(x, y, 16, 16);
			c.fillStyle = 'rgba(30,25,20,0.5)';
			c.fillRect(x, y, 16, 1);
			c.fillRect(x, y, 1, 16);
		}
		for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(0,0,0,${r() * 0.15})`; c.fillRect(Math.floor(r() * 64), Math.floor(r() * 64), 2, 1); }
	}, [6, 9]);
	const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d, 8, 12), lam({map: floorT}));
	floor.rotation.x = -Math.PI / 2;
	g.add(floor);
	const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d, 4, 6), lam({color: '#4a463f'}));
	ceil.rotation.x = Math.PI / 2;
	ceil.position.y = h;
	g.add(ceil);
	const wall = (W: number, H: number, at: [number, number, number], ry: number) => {
		const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H, Math.ceil(W * 3), Math.ceil(H * 3)), wallM);
		m.position.set(...at);
		m.rotation.y = ry;
		g.add(m);
	};
	wall(d, h, [x0, h / 2, 0], Math.PI / 2);
	wall(d, h, [x1, h / 2, 0], -Math.PI / 2);
	// back wall with the doorway to the storeroom (x 0.85..1.65)
	const dx0 = 0.85, dx1 = 1.65, dh = 2.02;
	wall(dx0 - x0, h, [(x0 + dx0) / 2, h / 2, zb], 0);
	wall(x1 - dx1, h, [(dx1 + x1) / 2, h / 2, zb], 0);
	wall(dx1 - dx0, h - dh, [(dx0 + dx1) / 2, (dh + h) / 2, zb], 0);
	g.add(box(dx1 - dx0 + 0.1, 0.05, 0.06, lam({color: '#3a2a1e'}), [(dx0 + dx1) / 2, dh + 0.025, zb + 0.02]));
	// the void beyond the doorway: unlit black (point lights pass through walls in three.js)
	g.add(box(dx1 - dx0, dh, 0.9, black(), [(dx0 + dx1) / 2, dh / 2, zb - 0.46]));
	// front: header above the shutter, the shutter half down
	wall(w, 0.25, [0, h - 0.125, zf], Math.PI);
	const shutT = grimeTex(21, '#7d8086', {w: 64, h: 64, slats: 4, speck: 300, stains: 12, streaks: true});
	shutT.wrapS = shutT.wrapT = THREE.RepeatWrapping;
	shutT.repeat.set(4, 3);
	const shutter = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.3, 8, 4), lam({map: shutT, side: THREE.DoubleSide}));
	shutter.position.set(0, h - 0.25 - 0.65, zf);
	g.add(shutter);
	g.add(box(w, 0.06, 0.05, lam({color: '#2a2b2e'}), [0, h - 0.25 - 1.3, zf]));
	// outside: wet road, kerb, a closed market front across the street, the streetlight, rain
	const road = new THREE.Mesh(new THREE.PlaneGeometry(30, 14, 30, 14), lam({map: grimeTex(5, '#2b2a2a', {speck: 900, stains: 20})}));
	road.rotation.x = -Math.PI / 2;
	road.position.set(0, -0.12, zf + 7);
	g.add(road);
	const kerb = box(30, 0.12, 1.2, lam({map: grimeTex(6, '#5d5a55')}), [0, -0.06, zf + 0.6], 2);
	g.add(kerb);
	const shopT = grimeTex(14, '#59605a', {w: 64, h: 64, slats: 4, streaks: true, stains: 14});
	shopT.wrapS = shopT.wrapT = THREE.RepeatWrapping;
	shopT.repeat.set(8, 2);
	const across = new THREE.Mesh(new THREE.PlaneGeometry(26, 6, 26, 6), lam({map: shopT}));
	across.position.set(0, 2.9, zf + 11);
	across.rotation.y = Math.PI;
	g.add(across);
	// a reflection smear of the streetlight on the wet road (additive)
	const smear = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 5), new THREE.MeshBasicMaterial({color: '#7a5a2a', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false}));
	smear.rotation.x = -Math.PI / 2;
	smear.position.set(-2.6, -0.11, zf + 3.6);
	g.add(smear);
	g.add(prop(a.glb.streetlight, [-3.2, -0.12, zf + 6.5], {h: 5.2, ry: Math.PI / 2}));
	g.add(prop(a.glb.trash_urban, [2.6, 0, zf + 1.2], {h: 0.9}));
	g.add(prop(a.glb.conditioner, [-1.4, 2.25, zf + 0.25], {h: 0.45, ry: Math.PI}));
	const street = new THREE.PointLight('#e8a050', 26, 14, 1.6);
	street.position.set(-3.0, 4.6, zf + 6.0);
	g.add(street);
	// rain: thin streaks beyond the shutter line
	const N = 700, rr = prng(77);
	const rainBase = new Float32Array(N * 3);
	for (let i = 0; i < N; i++) { rainBase[i * 3] = -7 + rr() * 14; rainBase[i * 3 + 1] = rr() * 5.5; rainBase[i * 3 + 2] = zf + 0.4 + rr() * 9; }
	const rg = new THREE.BufferGeometry();
	rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
	const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({color: '#8d97a3', transparent: true, opacity: 0.45, fog: true}));
	rain.frustumCulled = false;
	g.add(rain);

	// ---------------- furniture: the work desk on the left wall (Nico faces the wall, -X)
	const deskX = x0 + 0.38, deskZ = -0.7;
	g.add(prop(a.glb.desk, [deskX, 0, deskZ], {h: 0.76, ry: Math.PI / 2}));
	const deskTop = 0.76;
	const tv = prop(a.glb.tv, [x0 + 0.27, deskTop, deskZ - 0.25], {h: 0.42, ry: Math.PI});
	g.add(tv);
	const tvB = new THREE.Box3().setFromObject(tv);
	g.add(prop(a.glb.monitor, [x0 + 0.24, deskTop, deskZ + 0.38], {h: 0.36, ry: Math.PI}));
	g.add(prop(a.glb.keyboard, [x0 + 0.55, deskTop, deskZ + 0.3], {s: 1, ry: Math.PI / 2}));
	g.add(prop(a.glb.pc, [x0 + 0.3, 0, deskZ + 0.55], {h: 0.42, ry: Math.PI / 2}));
	g.add(prop(a.glb.desklamp, [x0 + 0.22, deskTop, deskZ + 0.05], {h: 0.42, ry: Math.PI / 2}));
	g.add(prop(a.glb.mug, [x0 + 0.62, deskTop, deskZ - 0.55], {h: 0.1}));
	g.add(prop(a.glb.floppy, [x0 + 0.55, deskTop, deskZ - 0.05], {h: 0.02}));
	g.add(prop(a.glb.chair, [x0 + 1.12, 0, deskZ], {h: 0.95, ry: -Math.PI / 2}));
	// tape shelves: bookcases on the left wall towards the back, crammed with labelled tape boxes
	const tapes = new THREE.Group();
	const tr = prng(5);
	const labels = ['#d8d2c0', '#c9b98e', '#e0dccf', '#b8b0a0', '#d9c27a'];
	const tapeMats = labels.map((l) => lam({color: l}));
	const caseMat = lam({color: '#1b1a1c'});
	for (const [bx, bz, ry] of [[x0 + 0.2, -2.15, Math.PI / 2], [x0 + 0.2, 1.4, Math.PI / 2]] as const) {
		const bc = prop(a.glb.bookcase, [bx, 0, bz], {h: 2.0, ry});
		g.add(bc);
		const bb = new THREE.Box3().setFromObject(bc);
		for (let shelf = 0; shelf < 5; shelf++) {
			const y = bb.min.y + 0.12 + shelf * ((bb.max.y - bb.min.y - 0.2) / 5);
			let z = bb.min.z + 0.05;
			while (z < bb.max.z - 0.06) {
				const tw = 0.03;
				if (tr() < 0.08) { z += 0.05; continue; }
				const t = box(0.19, 0.105, tw, caseMat, [bb.max.x - 0.12, y + 0.0525, z + tw / 2]);
				tapes.add(t);
				tapes.add(box(0.005, 0.06, tw * 0.8, tapeMats[Math.floor(tr() * labels.length)], [bb.max.x - 0.022, y + 0.05, z + tw / 2]));
				z += tw + 0.003;
			}
		}
	}
	g.add(tapes);
	// cartons of customers' tapes on the floor
	g.add(prop(a.glb.box, [x0 + 0.35, 0, 0.55], {h: 0.32, ry: 0.3}));
	g.add(prop(a.glb.box, [x0 + 0.38, 0.32, 0.6], {h: 0.28, ry: -0.2}));
	// the bench on the right wall, by the doorway; a file cabinet; a wall clock
	const benchM = lam({map: grimeTex(8, '#5b3e2a', {stains: 6}), color: '#ffffff'});
	g.add(box(0.42, 0.06, 1.7, benchM, [x1 - 0.26, 0.42, -1.78], 4));
	for (const z of [-2.55, -1.0]) g.add(box(0.36, 0.42, 0.06, benchM, [x1 - 0.26, 0.21, z]));
	g.add(prop(a.glb.cabinet, [x1 - 0.3, 0, 0.6], {h: 1.05, ry: -Math.PI / 2}));
	g.add(prop(a.glb.wallclock, [-0.6, 2.05, zb + 0.03], {h: 0.3}));
	g.add(prop(a.glb.fridge_old, [x1 - 0.35, 0, 1.75], {h: 1.3, ry: -Math.PI / 2, tint: '#b0b0b0'}));
	// Nico's jacket draped over sleeping Bea is part of the Bea group below

	// ---------------- the CRT picture (a small canvas redrawn per frame) placed on the TV's screen side
	const crtC = document.createElement('canvas');
	crtC.width = 48;
	crtC.height = 36;
	const crtTex = new THREE.CanvasTexture(crtC);
	crtTex.colorSpace = THREE.SRGBColorSpace;
	nearest(crtTex);
	const scr = new THREE.Mesh(new THREE.PlaneGeometry((tvB.max.z - tvB.min.z) * 0.62, (tvB.max.y - tvB.min.y) * 0.5), psx(new THREE.MeshBasicMaterial({map: crtTex}), P));
	scr.position.set(tvB.max.x + 0.004, tvB.min.y + (tvB.max.y - tvB.min.y) * 0.56, (tvB.min.z + tvB.max.z) / 2);
	scr.rotation.y = Math.PI / 2;
	g.add(scr);
	const crtLight = new THREE.PointLight('#8fb0ff', 2.2, 4.5, 1.6);
	crtLight.position.set(tvB.max.x + 0.25, scr.position.y, scr.position.z);
	g.add(crtLight);
	const lamp = new THREE.PointLight('#ffb366', 3.2, 5, 1.7);
	lamp.position.set(x0 + 0.45, deskTop + 0.38, deskZ + 0.05);
	g.add(lamp);
	g.add(new THREE.HemisphereLight('#2a3040', '#120e0a', 0.32));
	const night = new THREE.PointLight('#6f7f9a', 2.6, 5, 1.4); // spill from the street through the shutter gap
	night.position.set(1.0, 1.7, -0.4);
	g.add(night);

	// ---------------- characters
	const nico = buildNico(a);
	nico.holder.position.set(x0 + 1.1, -0.36, deskZ);
	nico.holder.rotation.y = -Math.PI / 2; // faces -X (the wall, the CRT)
	nico.holder.updateMatrixWorld(true);
	poseSeated(nico, NICO_B, {lean: 0.2, yaw: -0.12, pitch: 0.02});
	g.add(nico.holder);
	const bea = buildBea(a);
	bea.holder.quaternion.copy(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))));
	bea.holder.position.set(x1 - 0.32, 0.45 + 0.13, -1.12);
	bea.holder.updateMatrixWorld(true);
	poseAsleep(bea, MIX_B);
	setFace(bea.root, a.faces.bea, 'sleepy');
	const jacket = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.62, 0.36, 3, 6, 3), lam({map: grimeTex(31, '#2a2d33', {speck: 400}), color: '#ffffff'}));
	const jp = jacket.geometry.getAttribute('position');
	const jr = prng(12);
	for (let i = 0; i < jp.count; i++) jp.setXYZ(i, jp.getX(i) + (jr() - 0.5) * 0.03, jp.getY(i) + (jr() - 0.5) * 0.03, jp.getZ(i) + (jr() - 0.5) * 0.03);
	jacket.geometry.computeVertexNormals();
	jacket.position.set(0.0, 0.62, 0.06);
	bea.holder.add(jacket);
	g.add(bea.holder);
	return {group: g, nico, bea, crt: {tex: crtTex, ctx: crtC.getContext('2d')!}, crtLight, lamp, rain, rainBase, nicoSeat: nico.holder.position.clone()};
};

const drawCrt = (s: Shop, f: number, figure: number) => {
	const g = s.crt.ctx;
	const r = prng(1000 + f);
	// the paused tape: a dim greenish room, a black doorway on the left; tracking noise crawls over it
	g.fillStyle = '#3d4a46';
	g.fillRect(0, 0, 48, 36);
	g.fillStyle = '#56645c';
	g.fillRect(0, 22, 48, 14);
	g.fillStyle = '#0a0c0c';
	g.fillRect(6, 7, 9, 19);
	if (figure > 0) { g.fillStyle = `rgba(30,32,34,${figure})`; g.fillRect(9, 7, 4, 17); }
	for (let i = 0; i < 160; i++) { const v = Math.floor(r() * 255); g.fillStyle = `rgba(${v},${v},${v},0.18)`; g.fillRect(Math.floor(r() * 48), Math.floor(r() * 36), 1, 1); }
	const band = (f * 0.7) % 44 - 4;
	g.fillStyle = 'rgba(220,220,220,0.25)';
	g.fillRect(0, Math.floor(band), 48, 2);
	for (let y = 0; y < 36; y += 2) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, y, 48, 1); }
	s.crt.tex.needsUpdate = true;
};

const updateRain = (s: Shop, f: number) => {
	const a = s.rain.geometry.getAttribute('position') as THREE.BufferAttribute;
	const arr = a.array as Float32Array;
	const n = s.rainBase.length / 3;
	for (let i = 0; i < n; i++) {
		const x = s.rainBase[i * 3], z = s.rainBase[i * 3 + 2];
		let y = (s.rainBase[i * 3 + 1] - f * 0.32) % 5.5;
		if (y < 0) y += 5.5;
		y -= 0.1;
		arr.set([x, y, z, x - 0.02, y + 0.28, z], i * 6);
	}
	a.needsUpdate = true;
};

// ------------------------------------------------------------------ the 1991 living room (DoriHome pack)
type Room = {group: THREE.Group; figure: Char; tube: THREE.PointLight};
const buildRoom = (a: Assets): Room => {
	const g = new THREE.Group();
	const house = a.glb.dorihome.clone(true);
	psxify(house, {...P});
	house.traverse((o) => {
		if (o.name === 'Door001' || o.name === 'techo') o.visible = o.name === 'techo';
		const m = o as THREE.Mesh;
		if (m.isMesh) m.frustumCulled = false;
	});
	g.add(house);
	// the doorway (x = -3, z -6..-5) opens on an unlit room: fill it with black
	g.add(box(0.9, 2.0, 1.0, black(), [-2.5, 1.0, -5.5]));
	// the despedida banner on the far wall above the couch
	const banner = canvasTex(128, 24, (c) => {
		c.fillStyle = '#e9e3cf';
		c.fillRect(0, 0, 128, 24);
		c.fillStyle = '#b3262c';
		c.font = 'bold 13px monospace';
		c.textAlign = 'center';
		c.fillText('INGAT, TATAY RUDY!', 64, 17);
		c.fillStyle = '#2f5aa8';
		c.fillRect(0, 0, 128, 2);
		c.fillRect(0, 22, 128, 2);
	});
	const bn = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.45), lam({map: banner, side: THREE.DoubleSide}));
	bn.position.set(-3.06, 2.4, -7.0);
	bn.rotation.y = -Math.PI / 2;
	g.add(bn);
	const tube = new THREE.PointLight('#e8f4e0', 5, 9, 1.4);
	tube.position.set(-6.0, 2.6, -6.6);
	g.add(tube);
	g.add(new THREE.HemisphereLight('#4a5048', '#1a1612', 0.35));
	// the figure: a pack body rendered as a near-black silhouette, too tall, arms too long, its face a smear
	const fig = makeChar(a.glb.figure_base, 1.97, {material: lam({color: '#3b3e44'}), frontRy: Math.PI / 2});
	fig.holder.position.set(-3.3, 0, -5.5);
	fig.holder.rotation.y = -Math.PI / 2;
	fig.holder.updateMatrixWorld(true);
	reset(fig);
	for (const s of ['l', 'r'] as const) {
		fig.bone(MIX_B.fa(s)).scale.setScalar(1.28);
		const sh = wp(fig.bone(MIX_B.ua(s)));
		ik(fig.bone(MIX_B.ua(s)), fig.bone(MIX_B.fa(s)), fig.bone(MIX_B.hand(s)), sh.clone().add(fig.D(s === 'l' ? 0.1 : -0.1, -0.95, 0.02)), fig.D(0, 0, -1));
	}
	rotW(fig.bone(MIX_B.head), fig.D(0, 0, 1), 0.08);
	const smear = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.2), psx(new THREE.MeshBasicMaterial({color: '#77756f', transparent: true, opacity: 0.7}), P));
	smear.position.set(-3.19, 1.79, -5.5);
	smear.rotation.y = -Math.PI / 2;
	g.add(smear);
	g.add(fig.holder);
	return {group: g, figure: fig, tube};
};

// ------------------------------------------------------------------ r3f scene wrappers
const Cam: React.FC<{pos: THREE.Vector3; look: THREE.Vector3; fov: number; roll?: number}> = ({pos, look, fov, roll = 0}) => {
	const {camera, scene} = useThree();
	const cam = camera as THREE.PerspectiveCamera;
	cam.position.copy(pos);
	cam.up.set(Math.sin(roll), Math.cos(roll), 0);
	cam.lookAt(look);
	cam.fov = fov;
	cam.near = 0.03;
	cam.far = 40;
	cam.updateProjectionMatrix();
	return null;
};

const FogBg: React.FC<{color: string; near: number; far: number}> = ({color, near, far}) => {
	const {scene, gl} = useThree();
	scene.fog = new THREE.Fog(color, near, far);
	scene.background = new THREE.Color(color);
	gl.setPixelRatio(1);
	return null;
};

const Pixel: React.FC<{w: number; h: number; k?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({w, h, k = K, children, style}) => (
	<div style={{position: 'absolute', left: (1920 - w * k) / 2, top: (1080 - h * k) / 2, width: w, height: h, transform: `scale(${k})`, transformOrigin: '0 0', ...style}}>
		<ThreeCanvas width={w} height={h} gl={{antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance'}} camera={{fov: 50, near: 0.03, far: 40}} style={{imageRendering: 'pixelated'}}>
			{children}
		</ThreeCanvas>
	</div>
);

const Letterbox: React.FC = () => {
	const bar = Math.round((1080 - 1920 / 2.39) / 2);
	return (
		<>
			<div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: bar, background: '#000'}} />
			<div style={{position: 'absolute', left: 0, bottom: 0, width: 1920, height: bar, background: '#000'}} />
		</>
	);
};

// handheld drift: slow, small, deterministic
const drift = (f: number, amp = 0.012, seed = 0) => V(Math.sin(f * 0.031 + seed) * amp + Math.sin(f * 0.077 + seed * 2) * amp * 0.4, Math.sin(f * 0.043 + seed * 3) * amp * 0.6, Math.sin(f * 0.025 + seed) * amp * 0.5);

type ShopShot = 'wide' | 'nico' | 'door' | 'nicoface';
const ShopScene: React.FC<{a: Assets; shot: ShopShot; f: number; expr?: Expr}> = ({a, shot, f, expr}) => {
	const shop = useMemo(() => buildShop(a), [a]);
	updateRain(shop, f);
	drawCrt(shop, f, shot === 'door' ? 0 : 0.6);
	shop.crtLight.intensity = 2.0 + Math.sin(f * 1.7) * 0.25 + Math.sin(f * 5.3) * 0.15;
	let pos: THREE.Vector3, look: THREE.Vector3, fov: number;
	const e: Expr = expr ?? 'neutral';
	if (shot === 'wide') {
		const t = f / 105;
		pos = V(lerp(1.15, 1.0, t), 1.62, lerp(2.75, 2.55, t)).add(drift(f, 0.01));
		look = V(-0.55, 0.95, -1.4);
		fov = 52;
		setFace(shop.nico.root, a.faces.nico, 'neutral');
	} else if (shot === 'nico' || shot === 'nicoface') {
		// from beside the CRT, looking back at his face lit by the screen
		const t = shot === 'nico' ? f / 90 : 0;
		const head = wp(shop.nico.bone(NICO_B.head));
		(window as unknown as {psxDebug: string}).psxDebug = `head ${head.toArray().map((v) => v.toFixed(2))} pelvis ${wp(shop.nico.bone(NICO_B.hips)).toArray().map((v) => v.toFixed(2))}`;
		pos = V(-1.42, 1.2, -1.2).lerp(V(-1.38, 1.18, -1.05), ease(t)).add(drift(f, 0.004, 2));
		look = head.clone().add(V(0, 0.06, 0));
		fov = 30;
		const fe: Expr = shot === 'nicoface' ? e : t < 0.45 ? 'neutral' : t < 0.78 ? 'focused' : 'fear';
		setFace(shop.nico.root, a.faces.nico, fe);
		poseSeated(shop.nico, NICO_B, {lean: 0.2 + (fe === 'fear' ? -0.06 : 0), yaw: -0.12, pitch: fe === 'fear' ? -0.06 : 0.02});
	} else {
		const t = f / 90;
		pos = V(0.25, 1.25, 0.6).lerp(V(0.75, 1.12, -0.55), ease(t)).add(drift(f, 0.006, 4));
		look = V(1.25, 0.95, -3.0);
		fov = 46;
	}
	return (
		<>
			<FogBg color="#020203" near={4} far={13} />
			<Cam pos={pos} look={look} fov={fov} />
			<primitive object={shop.group} />
		</>
	);
};

const RoomScene: React.FC<{a: Assets; f: number}> = ({a, f}) => {
	const room = useMemo(() => buildRoom(a), [a]);
	room.tube.intensity = 7 + (Math.floor(f / 3) % 7 === 0 ? -1.5 : 0);
	// camcorder on a guest's shoulder, then the slow digital push on the doorway
	const t = f / 90;
	const pos = V(-8.2, 1.72, -7.3).add(drift(f, 0.02, 7));
	const look = V(-3.0, 1.05, -5.6).add(drift(f + 40, 0.03, 9));
	return (
		<>
			<FogBg color="#05070a" near={6} far={16} />
			<Cam pos={pos} look={look} fov={lerp(54, 30, ease((t - 0.35) / 0.65))} />
			<primitive object={room.group} />
		</>
	);
};

// ------------------------------------------------------------------ tape overlay (4:3)
const TapeOverlay: React.FC<{f: number; stamp: string}> = ({f, stamp}) => {
	const band = ((f * 13) % 1300) - 100;
	return (
		<>
			<svg width={1440} height={1080} style={{position: 'absolute', left: 240, top: 0, mixBlendMode: 'screen', opacity: 0.22}}>
				<filter id={`n${f}`}><feTurbulence type="fractalNoise" baseFrequency="0.9 0.35" numOctaves={1} seed={f % 97} /><feColorMatrix type="saturate" values="0" /></filter>
				<rect width={1440} height={1080} filter={`url(#n${f})`} />
			</svg>
			<div style={{position: 'absolute', left: 240, top: band, width: 1440, height: 42, background: 'linear-gradient(transparent, rgba(255,255,255,0.18), transparent)'}} />
			<div style={{position: 'absolute', left: 300, top: 60, color: '#f2f2f2', fontFamily: 'monospace', fontWeight: 700, fontSize: 52, letterSpacing: 4, textShadow: '4px 4px 0 #000'}}>PLAY ▶</div>
			<div style={{position: 'absolute', right: 300, bottom: 70, color: '#f2f2f2', fontFamily: 'monospace', fontWeight: 700, fontSize: 52, letterSpacing: 4, textShadow: '4px 4px 0 #000'}}>{stamp}</div>
		</>
	);
};

// ------------------------------------------------------------------ compositions
export type PsxTestProps = {lw?: number};
export const TransfersPsxTest: React.FC<PsxTestProps> = ({lw = 320}) => {
	setRes(lw);
	const frame = useCurrentFrame();
	const a = useAssets();
	if (!a) return <AbsoluteFill style={{background: '#000'}} />;
	const [w0, w1] = SHOTS.wide, [n0, n1] = SHOTS.nico, [t0, t1] = SHOTS.tape, [d0, d1] = SHOTS.door;
	const tf = frame - t0;
	const hunt = tf > 18 && tf < 62 ? Math.abs(Math.sin((tf - 18) * 0.21)) * 5 : 0;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence from={w0} durationInFrames={w1 - w0}><Pixel w={LW} h={LH}><ShopScene a={a} shot="wide" f={frame - w0} /></Pixel><Letterbox /></Sequence>
			<Sequence from={n0} durationInFrames={n1 - n0}><Pixel w={LW} h={LH}><ShopScene a={a} shot="nico" f={frame - n0} /></Pixel><Letterbox /></Sequence>
			<Sequence from={t0} durationInFrames={t1 - t0}>
				<Pixel w={TW()} h={LH} style={{filter: `blur(${((hunt * 6) / K).toFixed(2)}px) contrast(1.08) saturate(0.85)`}}><RoomScene a={a} f={tf} /></Pixel>
				<TapeOverlay f={tf} stamp="JUN.14 1991 8:31PM" />
			</Sequence>
			<Sequence from={d0} durationInFrames={d1 - d0}><Pixel w={LW} h={LH}><ShopScene a={a} shot="door" f={frame - d0} /></Pixel><Letterbox /></Sequence>
		</AbsoluteFill>
	);
};

// Character sheet in the same look: turnaround of the restyled Nico and Bea, or one character's faces.
export type PsxSheetProps = {mode: 'turn' | 'faces' | 'before' | 'glasses'; who?: 'nico' | 'bea'; expr?: Expr; turn?: number; lw?: number};
const SheetScene: React.FC<{a: Assets; mode: PsxSheetProps['mode']; who: 'nico' | 'bea'; expr: Expr; turn: number}> = ({a, mode, who, expr, turn}) => {
	const group = useMemo(() => {
		const g = new THREE.Group();
		const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 6, 14, 6), lam({map: grimeTex(4, '#3a3833', {speck: 600})}));
		floor.rotation.x = -Math.PI / 2;
		g.add(floor);
		const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 5, 14, 5), lam({map: grimeTex(2, '#4a463f', {stains: 8, streaks: true})}));
		back.position.set(0, 2.5, -1.2);
		g.add(back);
		const key = new THREE.DirectionalLight('#ffd9b0', 1.9);
		key.position.set(-2, 3, 4);
		g.add(key);
		const fill = new THREE.DirectionalLight('#8fb0ff', 0.5);
		fill.position.set(3, 1.5, 2);
		g.add(fill);
		g.add(new THREE.HemisphereLight('#3a4050', '#15110c', 0.5));
		if (mode === 'glasses') {
			const c = buildNico(a);
			c.holder.rotation.y = turn;
			const f = c.holder.userData.glassesFit as GlassesFit;
			(window as unknown as {psxDebug: string}).psxDebug = `k ${f.k.toFixed(4)} ipd ${f.eyeL.distanceTo(f.eyeR).toFixed(3)} headW ${f.headW.toFixed(3)} earW ${f.earW.toFixed(3)} frameW ${(GL.frameW * f.k).toFixed(3)} templesW ${(1.545 * f.k).toFixed(3)} eyeZ ${f.eyeL.z.toFixed(3)} noseZ ${f.noseZ.toFixed(3)} backZ ${(f.centre.z + GL.backZ * f.k).toFixed(3)}`;
			g.add(c.holder);
		} else if (mode === 'faces') {
			const c = who === 'nico' ? buildNico(a) : buildBea(a);
			setFace(c.root, who === 'nico' ? a.faces.nico : a.faces.bea, expr);
			g.add(c.holder);
		} else {
			const turns = [0, -0.7, -Math.PI / 2, Math.PI];
			turns.forEach((ry, i) => {
				const n = buildNico(a);
				if (mode === 'before') { setFace(n.root, a.faces.nico, 'source'); n.bone(NICO_B.head).children.filter((ch) => !(ch as THREE.Bone).isBone).forEach((ch) => (ch.visible = false)); }
				n.holder.position.set(-1.95 + i * 0.55, 0, 0);
				n.holder.rotation.y = ry;
				g.add(n.holder);
				const b = buildBea(a);
				if (mode === 'before') { setFace(b.root, a.faces.bea, 'source'); b.bone(MIX_B.head).scale.setScalar(1); }
				b.holder.position.set(0.45 + i * 0.5, 0, 0);
				b.holder.rotation.y = ry;
				g.add(b.holder);
			});
		}
		return g;
	}, [a, mode, who, expr, turn]);
	if (mode === 'glasses')
		return (
			<>
				<FogBg color="#0b0b0c" near={8} far={20} />
				<Cam pos={V(0, 1.575, 0.75)} look={V(0, 1.56, 0)} fov={26} />
				<primitive object={group} />
			</>
		);
	const faces = mode === 'faces';
	const y = faces ? (who === 'nico' ? 1.58 : 1.1) : 0.95;
	return (
		<>
			<FogBg color="#0b0b0c" near={8} far={20} />
			<Cam pos={V(0.08, y, faces ? (who === 'nico' ? 1.4 : 1.25) : 6.2)} look={V(0, faces ? y - 0.01 : 0.85, 0)} fov={faces ? 13 : 22} />
			<primitive object={group} />
		</>
	);
};
export const TransfersPsxSheet: React.FC<PsxSheetProps> = ({mode, who = 'nico', expr = 'neutral', turn = 0, lw = 320}) => {
	setRes(mode === 'glasses' ? 320 : lw);
	const a = useAssets();
	if (!a) return <AbsoluteFill style={{background: '#000'}} />;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Pixel w={lw} h={Math.round((lw * 9) / 16)} k={1920 / lw}><SheetScene a={a} mode={mode} who={who} expr={expr} turn={turn} /></Pixel>
			{mode === 'glasses' ? <DebugText /> : null}
		</AbsoluteFill>
	);
};

// Single shop frame for the stills (any shot at any time, any expression for the face close-up).
export type PsxStillProps = {shot: ShopShot | 'tape'; f: number; expr?: Expr; debug?: boolean; lw?: number};
const DebugText: React.FC = () => {
	const [t, setT] = useState('');
	useEffect(() => { const h = delayRender('dbg'); setTimeout(() => { setT((window as unknown as {psxDebug?: string}).psxDebug ?? '-'); continueRender(h); }, 500); }, []);
	return <div style={{position: 'absolute', left: 20, bottom: 10, color: '#0f0', fontSize: 30, fontFamily: 'monospace'}}>{t}</div>;
};
export const TransfersPsxStill: React.FC<PsxStillProps> = ({shot, f, expr, debug, lw = 320}) => {
	setRes(lw);
	const a = useAssets();
	if (!a) return <AbsoluteFill style={{background: '#000'}} />;
	if (shot === 'tape')
		return (
			<AbsoluteFill style={{background: '#000'}}>
				<Pixel w={TW()} h={LH}><RoomScene a={a} f={f} /></Pixel>
				<TapeOverlay f={f} stamp="JUN.14 1991 8:31PM" />
			</AbsoluteFill>
		);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Pixel w={LW} h={LH}><ShopScene a={a} shot={shot} f={f} expr={expr} /></Pixel>
			<Letterbox />
			{debug ? <DebugText /> : null}
		</AbsoluteFill>
	);
};
