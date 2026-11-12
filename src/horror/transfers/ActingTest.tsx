// TRANSFERS: 20 s acting test (no dialogue). Nico v1 (rigged GLB) posed every frame with two-bone IK and
// world-axis bone rotations, rendered through the PS1 pipeline at 640x360 and upscaled 3x to 1920x1080.
import React, {useEffect, useMemo, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone as skClone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {ps1, rng} from '../ps1';

export const ACT_FPS = 30;
export const ACT_FRAMES = 600;
const LW = 640, LH = 360, SC = 3;
const S1 = 0, S2 = 150, S3 = 270, S4 = 420, S5 = 540, BLACK = 576;

// ------------------------------------------------------------------ easing / keys
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
const span = (f: number, a: number, b: number) => ease((f - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const vl = (a: THREE.Vector3, b: THREE.Vector3, t: number) => a.clone().lerp(b, t);
/** piecewise eased vector keys [[frame, vec], ...] */
const vkeys = (f: number, keys: [number, THREE.Vector3][]) => {
	if (f <= keys[0][0]) return keys[0][1].clone();
	for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) return vl(keys[i - 1][1], keys[i][1], span(f, keys[i - 1][0], keys[i][0]));
	return keys[keys.length - 1][1].clone();
};
const nkeys = (f: number, keys: [number, number][]) => {
	if (f <= keys[0][0]) return keys[0][1];
	for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], span(f, keys[i - 1][0], keys[i][0]));
	return keys[keys.length - 1][1];
};

// ------------------------------------------------------------------ bone helpers
const wp = (o: THREE.Object3D) => o.getWorldPosition(new THREE.Vector3());
const rotWorldQ = (bone: THREE.Object3D, q: THREE.Quaternion) => {
	bone.updateWorldMatrix(true, false);
	const pq = bone.parent!.getWorldQuaternion(new THREE.Quaternion());
	bone.quaternion.premultiply(pq.clone().invert().multiply(q).multiply(pq));
	bone.updateMatrixWorld(true);
};
const rotW = (bone: THREE.Object3D, axis: THREE.Vector3, a: number) => rotWorldQ(bone, new THREE.Quaternion().setFromAxisAngle(axis, a));
const aim = (bone: THREE.Object3D, child: THREE.Object3D, target: THREE.Vector3) => {
	const h = wp(bone);
	const cur = wp(child).sub(h).normalize(), des = target.clone().sub(h).normalize();
	rotWorldQ(bone, new THREE.Quaternion().setFromUnitVectors(cur, des));
};
/** two-bone IK: places the wrist (hand head) at target, elbow towards pole */
const ik = (up: THREE.Object3D, lo: THREE.Object3D, hand: THREE.Object3D, target: THREE.Vector3, pole: THREE.Vector3) => {
	const S = wp(up), E0 = wp(lo), W0 = wp(hand);
	const a = E0.distanceTo(S), b = W0.distanceTo(E0);
	const toT = target.clone().sub(S); const d = Math.min(toT.length(), a + b - 1e-3);
	const n = toT.normalize();
	const x = (a * a - b * b + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a * a - x * x));
	const p = pole.clone().sub(n.clone().multiplyScalar(pole.dot(n))).normalize();
	const E = S.clone().add(n.clone().multiplyScalar(x)).add(p.multiplyScalar(h));
	aim(up, lo, E);
	aim(lo, hand, S.clone().add(n.multiplyScalar(d)));
};
const X = V(1, 0, 0), Y = V(0, 1, 0), Z = V(0, 0, 1);

type Rig = {root: THREE.Group; bone: (n: string) => THREE.Object3D; rest: Map<THREE.Object3D, THREE.Quaternion>; meshes: THREE.Mesh[]};
const makeRig = (src: THREE.Group, mode: 'actor' | 'figure'): Rig => {
	const root = skClone(src) as THREE.Group;
	const meshes: THREE.Mesh[] = [];
	root.traverse((o) => {
		const m = o as THREE.Mesh;
		if (!m.isMesh) return;
		m.frustumCulled = false;
		const old = m.material as THREE.MeshStandardMaterial;
		if (mode === 'figure') {
			if (m.name.includes('glasses')) m.visible = false;
			m.material = ps1(new THREE.MeshLambertMaterial({color: '#060607'}), 22, 'vec2(160.0, 90.0)');
		} else {
			const skin = old.name === 'skin' && !!m.geometry.getAttribute('color');
			m.material = ps1(new THREE.MeshLambertMaterial({color: skin ? 0xffffff : old.color, vertexColors: skin}), 22, 'vec2(160.0, 90.0)');
		}
		meshes.push(m);
	});
	const rest = new Map<THREE.Object3D, THREE.Quaternion>();
	root.traverse((o) => { if ((o as THREE.Bone).isBone) rest.set(o, o.quaternion.clone()); });
	return {root, rest, meshes, bone: (n) => root.getObjectByName(n)!};
};
const resetRig = (r: Rig) => { r.rest.forEach((q, b) => b.quaternion.copy(q)); r.root.updateMatrixWorld(true); };
const setMorphs = (r: Rig, w: Record<string, number>) => {
	for (const m of r.meshes) {
		if (!m.morphTargetDictionary || !m.morphTargetInfluences) continue;
		m.morphTargetInfluences.fill(0);
		for (const [k, v] of Object.entries(w)) { const i = m.morphTargetDictionary[k]; if (i !== undefined) m.morphTargetInfluences[i] = v; }
	}
};
const curl = (r: Rig, side: 'l' | 'r', amt: number, thumb = amt) => {
	const across = wp(r.bone(`index_01_${side}`)).sub(wp(r.bone(`pinky_01_${side}`))).normalize();
	const s = side === 'l' ? 1 : -1;
	for (const f of ['index', 'middle', 'ring', 'pinky']) for (const k of ['01', '02', '03']) rotW(r.bone(`${f}_${k}_${side}`), across, s * amt * (k === '01' ? 0.8 : 1.1));
	for (const k of ['02', '03']) rotW(r.bone(`thumb_${k}_${side}`), across, s * thumb * 0.5);
};

// ------------------------------------------------------------------ world layout (glTF axes: y up, Nico faces +z)
const SEAT_DROP = 0.40;
const TAPE_HOME = V(-0.30, 0.757, 0.50);
const SLOT = V(0.0, 0.818, 0.505);
const DOOR = {x: -0.25, z: -2.8};
const FIGURE_AT = V(-0.25, 0, -3.1);

/** Nico's pose at frame f. Returns the right hand's tape grip point if he holds the tape. */
const poseNico = (r: Rig, f: number) => {
	resetRig(r);
	r.root.position.set(0, -SEAT_DROP, 0);
	r.root.updateMatrixWorld(true);
	const b = r.bone;
	// spine: seated slump, lean towards the screen in S3, twist to look back in S4
	const breathe = Math.sin((f / ACT_FPS) * Math.PI * 2 / (f > S3 + 90 ? 2.2 : 4.2)) * (f > S3 + 90 ? 0.022 : 0.012);
	const lean = nkeys(f, [[0, 0.10], [40, 0.16], [110, 0.2], [150, 0.12], [S3, 0.14], [S3 + 70, 0.30], [S4, 0.30], [S4 + 30, 0.12]]);
	const twist = nkeys(f, [[S4 + 25, 0], [S4 + 85, 0.42]]);
	rotW(b('pelvis'), X, -0.05);
	rotW(b('spine_01'), X, lean * 0.3);
	rotW(b('spine_02'), X, lean * 0.35 + breathe);
	rotW(b('spine_02'), Y, twist * 0.45);
	rotW(b('spine_03'), X, lean * 0.35);
	rotW(b('spine_03'), Y, twist * 0.55);
	// head: looks at tape, at slot, at screen; over the shoulder in S4
	const headYaw = nkeys(f, [[10, 0], [30, -0.45], [70, -0.25], [100, 0], [S4 + 30, 0], [S4 + 95, 0.95]]);
	const headPitch = nkeys(f, [[10, 0.05], [30, 0.32], [90, 0.25], [125, 0.0], [S3 + 40, -0.04], [S3 + 110, -0.08], [S4 + 40, 0], [S4 + 95, 0.05]]);
	rotW(b('neck_01'), Y, headYaw * 0.4); rotW(b('head'), Y, headYaw * 0.6);
	rotW(b('neck_01'), X, headPitch * 0.4); rotW(b('head'), X, headPitch * 0.6);
	// legs: sit
	for (const s of ['l', 'r'] as const) {
		const hip = wp(b(`thigh_${s}`)); const k = hip.clone().add(V(s === 'l' ? 0.035 : -0.035, -0.04, 0.44));
		aim(b(`thigh_${s}`), b(`calf_${s}`), k);
		aim(b(`calf_${s}`), b(`foot_${s}`), k.clone().add(V(0, -0.45, -0.02)));
		rotW(b(`foot_${s}`), X, -0.15);
	}
	// left hand rests on the desk edge
	ik(b('upperarm_l'), b('lowerarm_l'), b('hand_l'), V(0.20, 0.775, 0.43).add(V(0, 0, nkeys(f, [[S3, 0], [S3 + 70, 0.05]]))), V(0.5, -1, -0.4));
	curl(r, 'l', 0.35);
	// right hand: reach tape, lift, carry to slot, push in, withdraw, rest
	const grip = TAPE_HOME.clone().add(V(0.015, 0.03, -0.075));     // wrist position when gripping the tape
	const slotW = SLOT.clone().add(V(0.01, 0.015, -0.13));
	const restR = V(-0.22, 0.775, 0.42);
	const rk: [number, THREE.Vector3][] = [
		[14, restR], [44, grip.clone().add(V(0, 0.05, -0.02))], [56, grip], [66, grip], [88, grip.clone().add(V(0.1, 0.12, -0.03))],
		[110, slotW.clone().add(V(0, 0.01, -0.03))], [118, slotW], [134, slotW.clone().add(V(0, 0, 0.065))], [150, V(-0.18, 0.80, 0.38)], [190, restR],
	];
	const wristR = vkeys(f, rk);
	ik(b('upperarm_r'), b('lowerarm_r'), b('hand_r'), wristR, V(-0.6, -1, -0.3));
	rotW(b('hand_r'), X, nkeys(f, [[40, 0], [56, 0.35], [100, 0.2], [134, 0.1], [160, 0]]));
	curl(r, 'r', nkeys(f, [[40, 0.25], [56, 0.85], [130, 0.85], [140, 0.3]]), 0.6);
	// face
	const blink = (c: number) => (f >= c && f < c + 5 ? Math.sin(((f - c) / 5) * Math.PI) : 0);
	const bl = Math.max(blink(8), blink(96), blink(S3 + 20), blink(S4 + 10));
	const focus = nkeys(f, [[S3 + 20, 0], [S3 + 60, 1], [S3 + 90, 0.4]]);
	const fear = nkeys(f, [[S3 + 85, 0], [S3 + 130, 1], [S4 + 20, 0.7], [S4 + 80, 0.7], [S4 + 100, 1]]);
	setMorphs(r, {
		'eye-left-closure': bl, 'eye-right-closure': bl,
		'eye-left-slit': focus * 0.55, 'eye-right-slit': focus * 0.55,
		'eyebrows-left-down': focus * 0.45, 'eyebrows-right-down': focus * 0.45,
		'eyebrows-left-inner-up': fear * 0.9, 'eyebrows-right-inner-up': fear * 0.9,
		'eye-left-opened-up': fear * 0.85, 'eye-right-opened-up': fear * 0.85,
		'mouth-open': fear * 0.28 + (f > S3 + 100 ? Math.max(0, Math.sin(f * 0.3)) * 0.05 : 0), 'neck-platysma': fear * 0.4,
	});
	r.root.updateMatrixWorld(true);
	const held = f >= 58 && f < 140;
	if (!held) return null;
	const hand = b('hand_r'), mid = b('middle_01_r');
	return {pos: wp(hand).lerp(wp(mid), 1.15), quat: hand.getWorldQuaternion(new THREE.Quaternion())};
};

const poseFigure = (r: Rig, f: number, tilt: number) => {
	resetRig(r);
	r.root.position.copy(FIGURE_AT);
	r.root.updateMatrixWorld(true);
	const b = r.bone;
	rotW(b('upperarm_l'), Z, -0.78); rotW(b('upperarm_r'), Z, 0.78);
	rotW(b('spine_03'), X, 0.04);
	rotW(b('head'), X, 0.18); rotW(b('head'), Z, tilt);
	setMorphs(r, {});
	r.root.updateMatrixWorld(true);
};

// ------------------------------------------------------------------ set
const mat = (c: string) => ps1(new THREE.MeshLambertMaterial({color: c}), 22, 'vec2(160.0, 90.0)');
const CONE_MAT = mat('#3a3020'), CAKE_MAT = mat('#e8d8c8'), CANDLE_MAT = mat('#f0a0b0');
const Box: React.FC<{p: [number, number, number]; s: [number, number, number]; c: string; seg?: number}> = ({p, s, c, seg}) => {
	const m = useMemo(() => mat(c), [c]);
	const n = seg ?? Math.max(1, Math.round(Math.max(...s) / 0.4));
	return (
		<mesh position={p} material={m}>
			<boxGeometry args={[...s, n, n, n]} />
		</mesh>
	);
};

const useCanvasTex = (w: number, h: number) => useMemo(() => {
	const c = document.createElement('canvas'); c.width = w; c.height = h;
	const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace;
	return {c, t, g: c.getContext('2d')!};
}, [w, h]);

const Shop: React.FC<{f: number}> = ({f}) => {
	// monitor picture (what plays on the CRT)
	const scr = useCanvasTex(96, 72);
	{
		const g = scr.g, r = rng(f * 7 + 3);
		if (f < 132) { g.fillStyle = '#1b2fa8'; g.fillRect(0, 0, 96, 72); g.fillStyle = '#dfe6ff'; g.font = '9px monospace'; g.fillText('VIDEO 1', 6, 14); }
		else {
			const lit = f < S3 + 140 ? 1 : 0.8;
			g.fillStyle = '#1a1410'; g.fillRect(0, 0, 96, 72);
			g.fillStyle = `rgba(255,190,120,${0.55 * lit})`; g.fillRect(28, 40, 40, 14);          // the table in candlelight
			g.fillStyle = '#ffd9a0'; for (let i = 0; i < 4; i++) g.fillRect(40 + i * 5, 34 + (r() > 0.5 ? 1 : 0), 1, 3);
			g.fillStyle = '#2a221c'; g.fillRect(0, 0, 18, 72);                                     // the dark corner
			g.fillStyle = 'rgba(255,255,255,0.75)'; g.font = '7px monospace'; g.fillText('PM 9:41', 58, 66);
		}
		for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.12})`; g.fillRect(Math.floor(r() * 96), Math.floor(r() * 72), 1, 1); }
		scr.t.needsUpdate = true;
	}
	const lcd = useCanvasTex(48, 12);
	{
		const g = lcd.g; g.fillStyle = '#031006'; g.fillRect(0, 0, 48, 12); g.fillStyle = '#5dff8a'; g.font = '9px monospace';
		g.fillText(f < 132 ? '-:--' : `PLAY ${String(Math.floor((f - 132) / 30)).padStart(2, '0')}`, 2, 10); lcd.t.needsUpdate = true;
	}
	const tapes = useMemo(() => {
		const r = rng(42); const out: {p: [number, number, number]; c: string}[] = [];
		for (let shelf = 0; shelf < 5; shelf++) for (let i = 0; i < 26; i++) {
			if (r() < 0.12) continue;
			out.push({p: [-1.52, 0.36 + shelf * 0.38, -2.2 + i * 0.105 + r() * 0.01], c: ['#151515', '#1e1c1a', '#2a2620', '#3a3530', '#4a2c22'][Math.floor(r() * 5)]});
		}
		return out;
	}, []);
	const spineMat = useMemo(() => mat('#1a1a1a'), []);
	const labelMat = useMemo(() => mat('#bdb3a0'), []);
	const screenMat = useMemo(() => new THREE.MeshBasicMaterial({map: scr.t}), [scr.t]);
	const lcdMat = useMemo(() => new THREE.MeshBasicMaterial({map: lcd.t}), [lcd.t]);
	const crtFlicker = f < 132 ? 0.9 : 0.75 + 0.25 * Math.abs(Math.sin(f * 0.9)) * (f % 7 === 0 ? 0.4 : 1);
	return (
		<>
			{/* room */}
			<Box p={[0, -0.025, -0.9]} s={[3.6, 0.05, 5]} c="#2b2620" seg={12} />
			<Box p={[-1.62, 1.3, -0.9]} s={[0.05, 2.6, 5]} c="#3b3a33" seg={10} />
			<Box p={[1.72, 1.3, -0.9]} s={[0.05, 2.6, 5]} c="#3b3a33" seg={10} />
			<Box p={[-1.2, 1.3, DOOR.z]} s={[1.1, 2.6, 0.08]} c="#35342e" />
			<Box p={[0.95, 1.3, DOOR.z]} s={[1.6, 2.6, 0.08]} c="#35342e" />
			<Box p={[DOOR.x, 2.35, DOOR.z]} s={[0.8, 0.5, 0.08]} c="#35342e" />
			<Box p={[0, 2.62, -0.9]} s={[3.6, 0.05, 5]} c="#1d1c19" seg={10} />
			{/* back room behind the doorway: a pale wall so a dark figure reads */}
			<Box p={[DOOR.x, 1.2, -4.3]} s={[2.4, 2.6, 0.06]} c="#5a6658" />
			<Box p={[DOOR.x, -0.02, -3.6]} s={[2.4, 0.04, 1.6]} c="#2a2a26" />
			<pointLight position={[DOOR.x, 1.7, -4.0]} intensity={3.2} distance={3.2} decay={1.3} color="#9fd0a8" />
			{/* tape shelves on the left wall */}
			{[0, 1, 2, 3, 4].map((s) => <Box key={s} p={[-1.45, 0.3 + s * 0.38, -0.85]} s={[0.3, 0.03, 2.9]} c="#4a3a2a" />)}
			{tapes.map((t, i) => (
				<group key={i} position={t.p}>
					<mesh material={spineMat}><boxGeometry args={[0.1, 0.19, 0.026]} /></mesh>
					<mesh position={[0.051, 0.02, 0]} material={labelMat}><boxGeometry args={[0.002, 0.1, 0.02]} /></mesh>
				</group>
			))}
			{/* window with blinds, street light outside (right wall) */}
			<mesh position={[1.69, 1.45, -0.6]}><planeGeometry args={[0.01, 0.01]} /></mesh>
			{Array.from({length: 12}).map((_, i) => <Box key={i} p={[1.68, 1.0 + i * 0.075, -0.6]} s={[0.02, 0.02, 1.0]} c="#7a7a70" seg={1} />)}
			<pointLight position={[2.4, 1.8, -0.6]} intensity={3.2} distance={4} decay={1.4} color="#7f95c9" />
			{/* desk */}
			<Box p={[0, 0.725, 0.72]} s={[1.5, 0.04, 0.64]} c="#5a4a38" />
			<Box p={[-0.7, 0.36, 0.72]} s={[0.04, 0.72, 0.6]} c="#3d3226" />
			<Box p={[0.7, 0.36, 0.72]} s={[0.04, 0.72, 0.6]} c="#3d3226" />
			{/* VCR + CRT */}
			<Box p={[0, 0.79, 0.66]} s={[0.43, 0.09, 0.3]} c="#1d1d1f" seg={1} />
			<Box p={[0, 0.818, 0.508]} s={[0.21, 0.03, 0.006]} c="#020202" seg={1} />
			<mesh position={[0.14, 0.785, 0.506]} material={lcdMat}><planeGeometry args={[0.08, 0.02]} /></mesh>
			<Box p={[0, 1.03, 0.78]} s={[0.46, 0.38, 0.42]} c="#2a2826" seg={2} />
			<mesh position={[0, 1.03, 0.565]} rotation={[0, Math.PI, 0]} material={screenMat}><planeGeometry args={[0.36, 0.27]} /></mesh>
			<pointLight position={[0, 1.03, 0.45]} intensity={2.0 * crtFlicker} distance={2.6} decay={1.5} color="#8fb0ff" />
			{/* desk lamp (his left), warm and low */}
			<Box p={[-0.62, 0.755, 0.95]} s={[0.12, 0.02, 0.12]} c="#222" seg={1} />
			<Box p={[-0.62, 0.92, 0.95]} s={[0.015, 0.32, 0.015]} c="#222" seg={1} />
			<mesh position={[-0.58, 1.08, 0.86]} rotation={[0.5, 0, -0.3]} material={CONE_MAT}><coneGeometry args={[0.08, 0.12, 10, 1, true]} /></mesh>
			<pointLight position={[-0.52, 1.0, 0.74]} intensity={3.6} distance={2.6} decay={1.5} color="#ffae66" />
			{/* clutter: tape stack, mug, the next tapes from the box */}
			<Box p={[0.32, 0.79, 0.56]} s={[0.19, 0.1, 0.105]} c="#161616" seg={1} />
			<Box p={[-0.5, 0.79, 0.82]} s={[0.08, 0.1, 0.08]} c="#d8d0c0" seg={1} />
			<Box p={[-0.5, 0.81, 0.66]} s={[0.3, 0.12, 0.22]} c="#7a6248" seg={1} />
			{/* chair */}
			<Box p={[0, 0.44, 0.02]} s={[0.46, 0.05, 0.44]} c="#2a2a2a" seg={1} />
			<Box p={[0, 0.78, -0.2]} s={[0.44, 0.6, 0.04]} c="#2a2a2a" seg={1} />
			<Box p={[0, 0.22, 0.02]} s={[0.05, 0.44, 0.05]} c="#1a1a1a" seg={1} />
			<ambientLight intensity={0.16} color="#5a6070" />
		</>
	);
};

// ------------------------------------------------------------------ main 3D scene
const MainScene: React.FC<{f: number; actor: Rig; figure: Rig}> = ({f, actor, figure}) => {
	const {camera} = useThree();
	const tapeMat = useMemo(() => mat('#121212'), []);
	const tapeLabel = useMemo(() => mat('#d6cdb8'), []);
	const held = poseNico(actor, f);
	const head = wp(actor.bone('head')).add(V(0, 0.085, 0));
	const tilt = nkeys(f, [[S5 + 6, 0], [S5 + 30, 0.32]]);
	poseFigure(figure, f, tilt);
	// tape: on the desk, in the hand, then swallowed by the slot
	let tp = TAPE_HOME.clone(), tq = new THREE.Quaternion();
	if (held) { tp = held.pos; tq = held.quat; }
	if (f >= 140) { tp = SLOT.clone().add(V(0, 0, 0.12 + nkeys(f, [[140, 0], [148, 0.12]]))); tq = new THREE.Quaternion(); }
	const tapeVisible = f < 148;
	// cameras
	const cam = camera as THREE.PerspectiveCamera;
	const shake = (a: number) => { const r = rng(Math.floor(f / 2) + 11); return (r() - 0.5) * a; };
	if (f < S2) {           // his left side, slightly in front: face, hands, tape and VCR in one frame
		const t = f / S2;
		cam.position.set(lerp(1.05, 0.92, t), lerp(1.22, 1.18, t), lerp(0.2, 0.26, t)); cam.fov = 44;
		cam.lookAt(-0.14, 0.88, 0.40);
	} else if (f < S4) {    // close-up on the face in screen light
		const t = (f - S3) / (S4 - S3);
		// from inside the TV, at screen height (the CRT's faces are culled from inside): the screen watches him
		cam.position.set(0.03 + shake(0.002), lerp(1.04, 1.06, t), lerp(0.63, 0.58, t)); cam.fov = 40;
		cam.lookAt(head.x + 0.01, head.y - 0.075, head.z);
	} else if (f < S5) {    // past Nico to the doorway
		cam.position.set(0.95, 1.2, 0.9); cam.fov = 40;
		cam.lookAt(-0.12, 0.95, -1.6);
	} else {                // the doorway, closer
		const t = (f - S5) / (BLACK - S5);
		cam.position.set(DOOR.x + 0.04, 1.5, lerp(-1.1, -1.45, t)); cam.fov = 30;
		cam.lookAt(FIGURE_AT.x, 1.47, FIGURE_AT.z);
	}
	cam.updateProjectionMatrix();
	return (
		<>
			<color attach="background" args={['#020203']} />
			<Shop f={f} />
			<primitive object={actor.root} />
			<primitive object={figure.root} />
			{tapeVisible && (
				<group position={tp} quaternion={tq}>
					<mesh material={tapeMat}><boxGeometry args={[0.187, 0.025, 0.103]} /></mesh>
					<mesh position={[0, 0.0131, 0]} material={tapeLabel}><boxGeometry args={[0.12, 0.001, 0.05]} /></mesh>
				</group>
			)}
		</>
	);
};

// ------------------------------------------------------------------ the tape (4:3 home video)
const TapeScene: React.FC<{f: number; figure: Rig}> = ({f, figure}) => {
	const {camera} = useThree();
	const t = f - S2;
	poseFigure(figure, f, 0);
	figure.root.position.set(-1.25, 0, -2.0);
	figure.root.rotation.y = 0.45;
	figure.root.updateMatrixWorld(true);
	const cam = camera as THREE.PerspectiveCamera;
	const r = rng(Math.floor(t) + 5);
	if (t < 55) {          // handheld over the table
		cam.position.set(0.25 + Math.sin(t * 0.13) * 0.03 + (r() - 0.5) * 0.01, 1.32 + Math.sin(t * 0.21) * 0.02, 1.1 - t * 0.003);
		cam.lookAt(0, 0.82, 0);
		cam.rotation.z += Math.sin(t * 0.17) * 0.03;
	} else {               // set down on the table edge, tilted, left running
		const k = ease((t - 55) / 14);
		cam.position.set(lerp(0.25, 0.55, k), lerp(1.32, 0.86, k), lerp(0.94, 0.62, k));
		cam.lookAt(lerp(0, -0.55, k), lerp(0.82, 0.95, k), lerp(0, -1.0, k));
		cam.rotation.z += lerp(0, -0.11, k);
	}
	cam.fov = 50; cam.updateProjectionMatrix();
	const flick = 0.85 + 0.15 * Math.sin(t * 1.7) * Math.sin(t * 0.61);
	return (
		<>
			<color attach="background" args={['#050403']} />
			<ambientLight intensity={0.12} color="#806050" />
			<Box p={[0, -0.02, -0.5]} s={[4, 0.04, 4]} c="#5a4232" seg={10} />
			<Box p={[0, 1.3, -2.3]} s={[4, 2.6, 0.05]} c="#8a7a62" seg={8} />
			<Box p={[-2.0, 1.3, -0.5]} s={[0.05, 2.6, 4]} c="#7a6a56" seg={8} />
			{/* the corner doorway is dark */}
			<Box p={[-1.95, 1.0, -1.55]} s={[0.06, 2.0, 0.8]} c="#0a0806" seg={1} />
			{/* table, cake, candles */}
			<Box p={[0, 0.72, 0]} s={[1.4, 0.04, 0.9]} c="#d8cfc0" seg={3} />
			<Box p={[0, 0.36, 0]} s={[1.3, 0.72, 0.8]} c="#6a4a32" seg={2} />
			<mesh position={[0, 0.8, 0]} material={CAKE_MAT}><cylinderGeometry args={[0.16, 0.16, 0.12, 14]} /></mesh>
			{[-0.06, -0.02, 0.02, 0.06].map((x, i) => (
				<group key={i} position={[x, 0.9, 0.02 * (i % 2)]}>
					<mesh material={CANDLE_MAT}><cylinderGeometry args={[0.005, 0.005, 0.07, 5]} /></mesh>
					<mesh position={[0, 0.05, 0]}><sphereGeometry args={[0.009, 5, 4]} /><meshBasicMaterial color="#ffd38a" /></mesh>
				</group>
			))}
			<pointLight position={[0, 1.0, 0.05]} intensity={3.4 * flick} distance={5} decay={1.2} color="#ffb070" />
			{/* chairs pushed back, a framed photo, a sofa */}
			<Box p={[-0.6, 0.45, 0.6]} s={[0.4, 0.9, 0.05]} c="#4a3426" seg={1} />
			<Box p={[0.65, 0.45, 0.6]} s={[0.4, 0.9, 0.05]} c="#4a3426" seg={1} />
			<Box p={[0.5, 1.6, -2.27]} s={[0.4, 0.3, 0.02]} c="#2a2018" seg={1} />
			<Box p={[1.2, 0.4, -1.8]} s={[1.4, 0.8, 0.6]} c="#5a3a3a" seg={2} />
			<primitive object={figure.root} />
		</>
	);
};

// ------------------------------------------------------------------ 2D overlays
const Grain: React.FC<{f: number; w: number; h: number; amt: number; seed: number}> = ({f, w, h, amt, seed}) => {
	const ref = React.useRef<HTMLCanvasElement>(null);
	useEffect(() => {
		const c = ref.current!; const g = c.getContext('2d')!; const r = rng(f * 13 + seed);
		const img = g.createImageData(w, h);
		for (let i = 0; i < w * h; i++) { const v = 128 + (r() - 0.5) * 255 * amt; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
		g.putImageData(img, 0, 0);
	}, [f, w, h, amt, seed]);
	return <canvas ref={ref} width={w} height={h} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'overlay', imageRendering: 'pixelated', opacity: 0.55}} />;
};

const useNicoGltf = () => {
	const [g, setG] = useState<THREE.Group | null>(null);
	const [handle] = useState(() => delayRender('nico glb'));
	useEffect(() => {
		new GLTFLoader().load(staticFile('assets/3d/nico/nico-v1.glb'), (x) => { setG(x.scene); continueRender(handle); }, undefined, (e) => { console.error(e); continueRender(handle); });
	}, [handle]);
	return g;
};

export const TransfersActingTest: React.FC<{withAudio?: boolean}> = ({withAudio = false}) => {
	const f = useCurrentFrame();
	const gltf = useNicoGltf();
	const rigs = useMemo(() => gltf && {actor: makeRig(gltf, 'actor'), figure: makeRig(gltf, 'figure'), tapeFig: makeRig(gltf, 'figure')}, [gltf]);
	const bar = Math.round((1080 - 1920 / 2.39) / 2);
	const inTape = f >= S2 && f < S3;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			{withAudio && <Audio src={staticFile('assets/audio/transfers/acting-test-v1/mix.m4a')} />}
			{rigs && f < BLACK && !inTape && (
				<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${SC})`, transformOrigin: '0 0', filter: 'saturate(0.85) contrast(1.08)'}}>
					<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 40, near: 0.02, far: 40}} style={{imageRendering: 'pixelated'}}>
						<MainScene f={f} actor={rigs.actor} figure={rigs.figure} />
					</ThreeCanvas>
				</div>
			)}
			{rigs && inTape && (
				<div style={{position: 'absolute', left: 240, top: 0, width: 1440, height: 1080, overflow: 'hidden'}}>
					<div style={{position: 'absolute', left: 0, top: 0, width: 320, height: 240, transform: `scale(4.5) translateX(${(f % 11 === 0 ? 1 : 0)}px)`, transformOrigin: '0 0', filter: 'saturate(0.7) contrast(1.15) blur(0.25px)'}}>
						<ThreeCanvas width={320} height={240} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.02, far: 30}} style={{imageRendering: 'pixelated'}}>
							<TapeScene f={f} figure={rigs.tapeFig} />
						</ThreeCanvas>
					</div>
					<Grain f={f} w={160} h={120} amt={0.45} seed={2} />
					{/* tracking band */}
					<div style={{position: 'absolute', left: 0, right: 0, top: ((f * 37) % 1300) - 100, height: 26, background: 'rgba(255,255,255,0.07)', filter: 'blur(2px)'}} />
					<div style={{position: 'absolute', left: 70, top: 60, color: '#f2f2f2', fontFamily: 'monospace', fontSize: 58, textShadow: '4px 4px 0 #000', opacity: f - S2 < 30 ? 1 : 0}}>PLAY ▶</div>
					<div style={{position: 'absolute', right: 80, bottom: 70, color: '#f2f2f2', fontFamily: 'monospace', fontSize: 58, textShadow: '4px 4px 0 #000', textAlign: 'right', lineHeight: 1.1}}>PM 9:41<br />OCT. 3 1997</div>
				</div>
			)}
			{!inTape && f < BLACK && <Grain f={f} w={320} h={180} amt={0.22} seed={9} />}
			{!inTape && <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: bar, background: '#000'}} />}
			{!inTape && <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: bar, background: '#000'}} />}
		</AbsoluteFill>
	);
};
