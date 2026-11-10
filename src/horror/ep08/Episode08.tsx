// Episode 8: "Room Zero" (original). About 58 s portrait short, pixelated low-poly 3D (180x320
// rendered, 6x nearest upscale), PS1 shaders, half of it seen through a thermal camera
// (ironbow palette, its own UI), a tape layer that tears on every scare.
// Viral standard: second-person hook on frame 0 (a thermal image of a blank wall with a warm,
// room-sized rectangle: "If a wall in your house looks like this on a thermal camera, don't
// knock."); a seamless loop (the last 1.6 s are the hook's own push-in on negative time, out
// of the buyers' photo of the new door); hidden rewatch details (warm footprints on the
// hallway carpet that lead to the wall, only in thermal; an erased pencil box beyond the wall
// on the floor plan; one upstairs window with its curtains drawn, where there is no room, and
// lit in the evening; the reading creeping 36.8 -> 37.4; a door-shaped seam and a handle-sized
// hot spot already in the hook's thermal image, and no handle on the new door); an open
// question (what lives in Room Zero?).
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep08-room-v1-timeline.json';
import {rng} from '../ps1';
import {Human} from '../ep01/world';
import {Box, Breath, House, MatsProvider, Outside, UP, useM, VAN_POS, WALL_Z} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep08Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => x * x * (3 - 2 * x);
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const sm = (t: number, a: number, b: number, v0 = 0, v1 = 1) => v0 + (v1 - v0) * ease(lin(t, a, b));
type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));

// key times (scripts/ep08_sound.py reads the same numbers)
export const K = {
	reveal: 24.75, // the camera comes up: the warm rectangle (stinger in silence)
	knocks: [37.4, 37.65, 37.9], // the inspector
	answer: [38.25, 38.6], // two knocks back
	figure: 41.5, // thermal: the figure behind the wall surges (stinger in silence)
	door: 54.0, // the second photo: a door (stinger in silence)
	sub: 24.1, // hidden: two frames of a pale figure at the end of the hallway
	loopOn: DUR - 1.6,
};
export const STINGERS = [K.reveal, K.figure, K.door];

// ------------------------------------------------------------------ shot list
type Mode = 'thermal' | 'cold' | 'day' | 'evening' | 'photo';
type Shot = {id: string; t: number; from: {p: V3; l: V3}; to?: {p: V3; l: V3}; fov?: number; mode: Mode; roll?: number};
const EYE = UP + 1.6;
const A = {from: {p: [0, EYE - 0.05, -0.9] as V3, l: [0, UP + 1.15, WALL_Z] as V3}, to: {p: [0, EYE - 0.1, 0.5] as V3, l: [0, UP + 1.15, WALL_Z] as V3}};
const V = VAN_POS;
const SHOTS: Shot[] = [
	{id: 'A_hook', t: 0, mode: 'thermal', ...A, fov: 52},
	{id: 'B_house', t: L.l02.start - 0.6, mode: 'day', from: {p: [10.5, 1.7, -25], l: [0.5, 3.0, -7]}, to: {p: [9.8, 1.7, -24], l: [0.5, 3.1, -7]}, fov: 56},
	{id: 'B_mouse', t: 8.3, mode: 'thermal', from: {p: [2.0, 1.0, -4.0], l: [3.4, 0.1, -6.0]}, to: {p: [2.0, 0.95, -4.3], l: [3.4, 0.1, -6.2]}, fov: 54},
	{id: 'C_hall', t: L.l03.start - 0.5, mode: 'cold', from: {p: [-2.2, 1.62, -3.6], l: [-2.2, 1.3, -8]}, to: {p: [-2.2, 1.6, -4.4], l: [-2.2, 1.3, -8]}, fov: 56},
	{id: 'D_stairs', t: L.l04.start - 0.6, mode: 'cold', from: {p: [0, 1.75, -7.9], l: [0, 3.0, -3.5]}, to: {p: [0, 3.9, -4.4], l: [0, EYE, -1.0]}, fov: 58},
	{id: 'D_plan', t: 21.2, mode: 'cold', from: {p: [0, EYE, -2.75], l: [0, UP + 1.02, -2.28]}, to: {p: [0, EYE - 0.02, -2.68], l: [0, UP + 1.02, -2.28]}, fov: 46},
	{id: 'D_wall', t: 22.6, mode: 'cold', from: {p: [0, EYE, -2.6], l: [0, UP + 1.25, WALL_Z]}, to: {p: [0, EYE, -1.5], l: [0, UP + 1.25, WALL_Z]}, fov: 52},
	{id: 'E_thermal', t: K.reveal, mode: 'thermal', from: {p: [0, EYE - 0.05, -0.6], l: [0, UP + 1.0, WALL_Z]}, to: {p: [0, EYE - 0.1, 0.4], l: [0, UP + 1.15, WALL_Z]}, fov: 54},
	{id: 'F_tape', t: L.l06.start - 0.8, mode: 'day', from: {p: [5.2, 0.7, -9.0], l: [4.1, 0.25, -3.5]}, to: {p: [5.0, 0.6, -6.0], l: [4.1, 0.25, 0.0]}, fov: 52},
	{id: 'F_side', t: 33.0, mode: 'day', from: {p: [20, 2.2, 1.8], l: [4.1, UP + 0.9, 1.8]}, to: {p: [19, 2.2, 1.8], l: [4.1, UP + 0.9, 1.8]}, fov: 52},
	{id: 'G_knock', t: L.l07.start - 0.6, mode: 'cold', from: {p: [0.45, EYE - 0.35, 0.4], l: [-0.15, UP + 1.15, WALL_Z]}, to: {p: [0.45, EYE - 0.35, 0.7], l: [-0.15, UP + 1.15, WALL_Z]}, fov: 50},
	{id: 'G_thermal', t: L.l08.start, mode: 'thermal', from: {p: [0, EYE - 0.1, 0.9], l: [0, UP + 1.2, WALL_Z]}, to: {p: [0, EYE - 0.1, 1.5], l: [0, UP + 1.2, WALL_Z]}, fov: 54},
	{id: 'H_report', t: L.l09.start, mode: 'day', from: {p: [V[0] - 0.3, 1.62, V[2] + 3.75], l: [V[0] - 0.3, 1.0, V[2] + 4.05]}, to: {p: [V[0] - 0.3, 1.55, V[2] + 3.8], l: [V[0] - 0.3, 1.0, V[2] + 4.05]}, fov: 46},
	{id: 'H_away', t: 44.9, mode: 'day', from: {p: [-6, 1.6, -20], l: [2, 2.6, -8]}, to: {p: [-5.5, 1.6, -19.5], l: [2, 2.6, -8]}, fov: 56},
	{id: 'I_evening', t: L.l10.start, mode: 'evening', from: {p: [11, 1.7, -16], l: [1.0, 3.2, -2.0]}, to: {p: [10.2, 1.7, -15], l: [1.0, 3.3, -2.0]}, fov: 56},
	{id: 'J_photo', t: L.l11.start, mode: 'photo', from: {p: [0.12, EYE - 0.15, 1.2], l: [0, UP + 1.1, WALL_Z]}, to: {p: [0.12, EYE - 0.15, 1.2], l: [0, UP + 1.1, WALL_Z]}, fov: 56},
	{id: 'K_door', t: K.door, mode: 'photo', from: {p: [0.0, EYE - 0.15, 0.6], l: [0, UP + 1.1, WALL_Z]}, to: {p: [0.0, EYE - 0.15, 1.3], l: [0, UP + 1.1, WALL_Z]}, fov: 56},
	{id: 'A_loop', t: K.loopOn, mode: 'thermal', ...A, fov: 52},
];
const shotAt = (t: number) => {
	let i = 0;
	for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].t) i = k;
	const s = SHOTS[i];
	if (s.id.startsWith('A_')) {
		const u = t >= K.loopOn ? t - DUR : t;
		return {s, k: lin(u, K.loopOn - DUR, SHOTS[1].t), u};
	}
	const end = SHOTS[i + 1]?.t ?? DUR;
	return {s, k: ease(lin(t, s.t, end)), u: t};
};
const camPose = (t: number) => {
	const {s, k, u} = shotAt(t);
	const to = s.to ?? s.from;
	const p = mix3(s.from.p, to.p, k);
	const l = mix3(s.from.l, to.l, k);
	const shake = STINGERS.concat(K.answer).reduce((a, kt) => a + (t >= kt && t < kt + 0.3 ? Math.sin((t - kt) * 55) * 0.016 * (1 - (t - kt) / 0.3) : 0), 0);
	const b = s.mode === 'day' || s.mode === 'evening' ? 0.02 : 0.004;
	p[0] += Math.sin(u * 0.8) * b;
	p[1] += Math.sin(u * 1.1) * b + shake;
	return {s, p, l};
};

// ------------------------------------------------------------------ the heat, the plan, the report

const useCanvasTex = (w: number, h: number) =>
	useMemo(() => {
		const c = document.createElement('canvas');
		c.width = w;
		c.height = h;
		const t = new THREE.CanvasTexture(c);
		t.magFilter = THREE.NearestFilter;
		t.minFilter = THREE.NearestFilter;
		t.generateMipmaps = false;
		t.colorSpace = THREE.SRGBColorSpace;
		return {c, t, g: c.getContext('2d')!};
	}, [w, h]);

const MONO = '"DejaVu Sans Mono", monospace';
const IRON: [number, number, number, number][] = [[0, 8, 4, 32], [0.22, 60, 14, 110], [0.42, 150, 24, 110], [0.6, 220, 70, 40], [0.78, 248, 160, 32], [0.92, 255, 230, 120], [1, 255, 252, 230]];
export const iron = (v: number): [number, number, number] => {
	v = Math.max(0, Math.min(1, v));
	for (let i = 1; i < IRON.length; i++)
		if (v <= IRON[i][0]) {
			const [a, b] = [IRON[i - 1], IRON[i]];
			const k = (v - a[0]) / (b[0] - a[0]);
			return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] + (b[3] - a[3]) * k];
		}
	return [255, 252, 230];
};

/** The heat on the hallway face of the end wall (1.2 x 2.5 m), in the ironbow palette.
 *  base: a warm room-sized field; door: a door-shaped seam and a handle spot (always faintly
 *  there); fig: a body pressed against the other side, palms up. */
const FIG = (() => {
	// a body pressed against the far side of the wall, palms up, blurred by the plaster
	const W = 36, H = 75;
	let m = new Float32Array(W * H);
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			const fx = ((x + 0.5) / W - 0.5) * 1.2, fy = (1 - (y + 0.5) / H) * 2.5;
			const head = Math.hypot(fx * 1.1, (fy - 1.6) * 0.95) < 0.11;
			const body = Math.abs(fx) < 0.17 - Math.max(0, fy - 1.3) * 0.25 && fy > 0.5 && fy < 1.46;
			const palms = Math.hypot(Math.abs(fx) - 0.27, fy - 1.56) < 0.06;
			const arms = Math.abs(Math.abs(fx) - 0.22) < 0.035 && fy > 1.2 && fy < 1.52;
			m[y * W + x] = palms ? 0.42 : head || body || arms ? 0.3 : 0;
		}
	for (let pass = 0; pass < 2; pass++) {
		const o = new Float32Array(W * H);
		for (let y = 0; y < H; y++)
			for (let x = 0; x < W; x++) {
				let a = 0, n = 0;
				for (let dy = -1; dy <= 1; dy++)
					for (let dx = -1; dx <= 1; dx++) {
						const xx = x + dx, yy = y + dy;
						if (xx >= 0 && yy >= 0 && xx < W && yy < H) {
							a += m[yy * W + xx];
							n++;
						}
					}
				o[y * W + x] = a / n;
			}
		m = o;
	}
	return m;
})();

const drawHeat = (g: CanvasRenderingContext2D, t: number, fig: number) => {
	const W = 36, H = 75;
	const img = g.createImageData(W, H);
	const r = rng(Math.floor(t * 15) * 13 + 3);
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			const nx = (x + 0.5) / W - 0.5, ny = (y + 0.5) / H; // ny 0 = top
			// the room behind: warm everywhere, cooler toward the edges and the floor
			let v = 0.42 + 0.12 * (1 - Math.abs(nx) * 1.6) - 0.1 * Math.abs(ny - 0.45);
			// a door-shaped seam (0.84 x 2.0 m, from the floor) leaking warmer air, and a handle spot
			const dx = Math.abs(nx) * 1.2, dy = (1 - ny) * 2.5;
			if (dy < 2.02 && Math.abs(dx - 0.42) < 0.035) v += 0.06;
			if (dy < 2.05 && dy > 1.99 && dx < 0.44) v += 0.06;
			if (Math.hypot(nx * 1.2 + 0.32, dy - 1.0) < 0.045) v += 0.1;
			v += fig * FIG[y * W + x];
			v += (r() - 0.5) * 0.05;
			const [R, G, B] = iron(v);
			const i = (y * W + x) * 4;
			img.data[i] = R;
			img.data[i + 1] = G;
			img.data[i + 2] = B;
			// fade the field into the cold wall at the edges
			const edge = Math.min(1, Math.min(x + 1, W - x, y + 1, H - y) / 4);
			img.data[i + 3] = 255 * edge;
		}
	g.putImageData(img, 0, 0);
};

/** The floor plan on the clipboard: the upstairs hallway ends at the wall; beyond it, nothing
 *  (and, if you look, a faint erased pencil box). */
const drawPlan = (g: CanvasRenderingContext2D) => {
	const W = 48, H = 64;
	g.fillStyle = '#e8e4d6';
	g.fillRect(0, 0, W, H);
	g.strokeStyle = '#2a3a6a';
	g.lineWidth = 1;
	g.strokeRect(4.5, 6.5, 39, 48);
	g.strokeRect(19.5, 6.5, 9, 38); // the hallway
	g.strokeRect(4.5, 6.5, 15, 18);
	g.strokeRect(4.5, 24.5, 15, 20);
	g.strokeRect(28.5, 6.5, 15, 38);
	g.fillStyle = '#2a3a6a';
	g.fillRect(19, 44, 10, 1.5); // the end wall
	// the erased box beyond it
	g.strokeStyle = 'rgba(80,80,80,0.28)';
	g.strokeRect(6.5, 46.5, 35, 7);
	g.font = `bold 5px ${MONO}`;
	g.fillStyle = '#2a3a6a';
	g.textAlign = 'center';
	g.fillText('FIRST FLOOR', 24, 61);
};

/** The survey report on the clipboard. */
const drawReport = (g: CanvasRenderingContext2D, t: number) => {
	const W = 48, H = 64;
	g.fillStyle = '#ecead8';
	g.fillRect(0, 0, W, H);
	g.fillStyle = '#9aa0a8';
	for (let y = 10; y < 60; y += 6) g.fillRect(3, y, 42, 1);
	g.fillStyle = '#2a2a3a';
	g.font = `bold 5px ${MONO}`;
	g.textAlign = 'left';
	g.fillText('SURVEY', 3, 7);
	// the line being written, letter by letter
	const txt = 'POSSIBLE WATER';
	const n = Math.floor(lin(t, 43.2, 45.0) * txt.length);
	g.fillStyle = '#1a2a7a';
	g.fillText(txt.slice(0, n), 3, 33);
	if (t > 45.1) g.fillText('DAMAGE', 3, 39);
	g.fillStyle = '#2a2a3a';
	g.fillRect(3, 29, 2, 1);
};

// ------------------------------------------------------------------ camera and atmosphere

const Cam: React.FC<{t: number}> = ({t}) => {
	const {camera} = useThree();
	const {s, p, l} = camPose(t);
	camera.position.set(...p);
	camera.up.set(0, 1, 0);
	camera.lookAt(...l);
	(camera as THREE.PerspectiveCamera).fov = s.fov ?? 50;
	(camera as THREE.PerspectiveCamera).far = 400;
	camera.updateProjectionMatrix();
	return null;
};

const FOG: Record<Mode, [string, number, number]> = {thermal: ['#06021a', 3, 16], cold: ['#1a1e22', 6, 30], day: ['#9aa0a8', 25, 160], evening: ['#20263a', 20, 140], photo: ['#140c08', 6, 30]};
const Atmos: React.FC<{mode: Mode}> = ({mode}) => {
	const {scene} = useThree();
	const [c, near, far] = FOG[mode];
	const bg = new THREE.Color(c);
	if (!scene.fog) scene.fog = new THREE.Fog(bg, near, far);
	const f = scene.fog as THREE.Fog;
	f.color.copy(bg);
	f.near = near;
	f.far = far;
	scene.background = bg;
	return null;
};

const INSPECTOR = {skin: '#c09a7a', hair: '#4a3a2a', top: '#5a6a52', legs: '#3a3a40'};
const rapAt = (t: number) => K.knocks.reduce((a, kt) => Math.max(a, t >= kt - 0.1 && t < kt + 0.08 ? 1 - Math.abs(t - kt) / 0.1 : 0), 0);

/** The inspector's gloved hand, knocking (attached to the camera; unused since the knock is shot from down the hallway). */
const Hand: React.FC<{t: number; p: V3; l: V3}> = ({t, p, l}) => {
	const mm = useM();
	const f = new THREE.Vector3(l[0] - p[0], l[1] - p[1], l[2] - p[2]).normalize();
	const right = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize();
	const up = new THREE.Vector3().crossVectors(right, f);
	const raise = sm(t, 36.3, 36.9);
	const rap = K.knocks.reduce((a, kt) => Math.max(a, t >= kt - 0.12 && t < kt + 0.1 ? 1 - Math.abs(t - kt) / 0.12 : 0), 0);
	const lower = sm(t, 38.15, 38.5);
	const reach = 0.42 + rap * 0.33;
	const pos = new THREE.Vector3(...p).addScaledVector(f, reach).addScaledVector(right, 0.12).addScaledVector(up, -0.35 + raise * 0.27 - lower * 0.35);
	const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, f.clone().negate()));
	return (
		<group position={pos} quaternion={q}>
			<Box p={[0, 0, 0]} s={[0.09, 0.1, 0.07]} m={mm.glove} />
			<Box p={[0, -0.02, 0.18]} s={[0.07, 0.07, 0.28]} m={mm.glove} />
		</group>
	);
};

// ------------------------------------------------------------------ the world at time t

const World: React.FC<{t: number; heat: THREE.Texture; plan: THREE.Texture; report: THREE.Texture}> = ({t, heat, plan, report}) => {
	const {s, p, l} = camPose(t);
	const mode = s.mode;
	const thermal = mode === 'thermal';
	const heatMat = useMemo(() => new THREE.MeshBasicMaterial({map: heat, transparent: true, depthWrite: false}), [heat]);
	const warm = useMemo(() => new THREE.MeshBasicMaterial({color: '#f0902a', transparent: true, opacity: 0.8, depthWrite: false}), []);
	const planMat = useMemo(() => new THREE.MeshBasicMaterial({map: plan}), [plan]);
	const repMat = useMemo(() => new THREE.MeshBasicMaterial({map: report}), [report]);
	const tapeMat = useMemo(() => new THREE.MeshBasicMaterial({color: '#e8c020'}), []);
	const dust = K.answer.reduce((a, kt) => Math.max(a, t >= kt && t < kt + 1.2 ? 1 - (t - kt) / 1.2 : 0), 0);
	const vanGone = s.id === 'H_away' ? sm(t, 45.3, 47.1, 0, 40) : 0;
	return (
		<>
			<Atmos mode={mode} />
			{thermal && (
				<>
					<ambientLight intensity={0.8} color="#ffffff" />
					<pointLight position={p} intensity={2.2} distance={10} decay={0.9} color="#ffffff" />
				</>
			)}
			{mode === 'cold' && (
				<>
					<ambientLight intensity={0.75} color="#8a96a6" />
					<pointLight position={[-2.2, 1.5, -7.4]} intensity={2.2} distance={6} decay={1.1} color="#d8e4f0" />
					{[[-1.6, -1.6], [-1.6, 1.8], [1.6, -0.6]].map(([x, z], i) => (
						<pointLight key={i} position={[x, UP + 1.6, z]} intensity={1.8} distance={4} decay={1.1} color="#c8d4e0" />
					))}
					<pointLight position={[0, UP + 2.2, -2.4]} intensity={0.8} distance={7} decay={1.0} color="#b8c4d0" />
				</>
			)}
			{mode === 'day' && (
				<>
					<ambientLight intensity={1.35} color="#aab0b8" />
					<directionalLight position={[30, 50, -40]} intensity={1.1} color="#e0e4ea" />
				</>
			)}
			{mode === 'evening' && (
				<>
					<ambientLight intensity={0.8} color="#4a5274" />
					<pointLight position={[0, 2.5, -9.5]} intensity={2.5} distance={8} decay={1.0} color="#ffc070" />
				</>
			)}
			{mode === 'photo' && (
				<>
					<ambientLight intensity={0.45} color="#8a6a50" />
					<pointLight position={[0, UP + 2.3, 2.6]} intensity={2.2} distance={5} decay={1.1} color="#ffd090" />
					<pointLight position={p} intensity={1.6} distance={5} decay={1.0} color="#ffffff" />
				</>
			)}
			<MatsProvider thermal={thermal}>
				<House doorInWall={mode === 'photo' && s.id === 'K_door'} buyers={mode === 'photo'} />
				<Outside evening={mode === 'evening' ? 1 : 0} vanShift={mode === 'evening' ? 99 : vanGone} />
				{/* the heat on the end wall: only the thermal camera sees it */}
				{thermal && (
					<mesh position={[0, UP + 1.25, WALL_Z - 0.01]} rotation={[0, Math.PI, 0]} material={heatMat}>
						<planeGeometry args={[1.2, 2.5]} />
					</mesh>
				)}
				{/* hidden: warm footprints on the hallway carpet, leading to the wall (thermal only) */}
				{thermal &&
					(s.id === 'E_thermal' || s.id === 'A_hook' || s.id === 'A_loop') &&
					[0, 1, 2, 3, 4, 5, 6].map((i) => (
						<mesh key={i} position={[(i % 2 ? 0.13 : -0.13), UP + 0.02, 0.6 + i * 0.48]} rotation={[-Math.PI / 2, 0, 0]} material={warm} scale={[1, 1, 1]}>
							<planeGeometry args={[0.1, 0.24]} />
						</mesh>
					))}
				{/* a mouse along the kitchen skirting, thermal */}
				{s.id === 'B_mouse' && (
					<mesh position={[3.15, 0.05, -7.4 + lin(t, 8.3, 11.3) * 2.6]} material={warm}>
						<boxGeometry args={[0.06, 0.06, 0.12]} />
					</mesh>
				)}
				{/* the floor plan on the clipboard */}
				{s.id === 'D_plan' && (
					<mesh position={[0, UP + 1.02, -2.28]} rotation={[-1.05, 0, 0]} material={planMat}>
						<planeGeometry args={[0.24, 0.32]} />
					</mesh>
				)}
				{/* the report on the passenger seat */}
				{s.id === 'H_report' && (
					<mesh position={[V[0] - 0.3, 1.0, V[2] + 4.05]} rotation={[-Math.PI / 2, 0, 0]} material={repMat}>
						<planeGeometry args={[0.24, 0.32]} />
					</mesh>
				)}
				{/* breath in the cold */}
				{(s.id === 'C_hall' || s.id === 'D_wall' || s.id === 'G_knock') && <Breath p={[p[0] + (l[0] - p[0]) * 0.12, p[1] - 0.12, p[2] + Math.sign(l[2] - p[2]) * 0.35]} t={t} />}
				{s.id === 'G_knock' && <Human pose={{yaw: -Math.PI / 2, head: [0, -0.1], armL: [0.9, -1.4], armR: [t < 36.4 ? 0.2 : t > 38.4 ? sm(t, 38.4, 38.9, 1.8, 0.4) : sm(t, 36.4, 36.9, 0.2, 1.8) + rapAt(t) * 0.12, t < 36.4 ? 0 : -1.0 + rapAt(t) * 0.75]}} pos={[-0.25, UP, 3.5]} look={INSPECTOR} face />}
				{s.id === 'G_knock' && <pointLight position={[0.4, UP + 2.2, 3.0]} intensity={2.2} distance={3} decay={1.1} color="#c8d4e0" />}
				{/* plaster dust from the top of the wall when it answers */}
				{s.id === 'G_knock' &&
					dust > 0 &&
					[0, 1, 2, 3, 4, 5].map((i) => (
						<mesh key={i} position={[-0.5 + i * 0.2, UP + 2.45 - (1 - dust) * (1.2 + i * 0.15), WALL_Z - 0.05]} material={warm}>
							<boxGeometry args={[0.012, 0.012, 0.012]} />
						</mesh>
					))}
				{/* hidden: a pale figure at the end of the hallway for two frames */}
				{t >= K.sub && t < K.sub + 0.067 && <Human pose={{yaw: -Math.PI / 2, head: [0, 0.1]}} pos={[0, UP, WALL_Z - 0.3]} look={{skin: '#d8d8d0', hair: '#d0d0c8', top: '#c8c8c0', legs: '#c0c0b8'}} face />}
				{/* the tape measure along the east side wall */}
				{s.id === 'F_tape' && (
					<>
						<Box p={[4.16, 0.3, -8.1 + lin(t, 30.4, 32.9, 0.1, 12.5) / 2]} s={[0.01, 0.03, lin(t, 30.4, 32.9, 0.1, 12.5)]} m={tapeMat} />
						<Box p={[4.2, 0.3, -8.1 + lin(t, 30.4, 32.9, 0.1, 12.5)]} s={[0.08, 0.1, 0.1]} m={tapeMat} />
					</>
				)}
			</MatsProvider>
		</>
	);
};

// ------------------------------------------------------------------ 2D overlays: thermal UI, phone, captions, tape

const ThermalUI: React.FC<{t: number; reading: number}> = ({t, reading}) => (
	<AbsoluteFill style={{fontFamily: MONO, color: '#f0f0f0', imageRendering: 'pixelated'}}>
		<svg width={1080} height={1920} style={{position: 'absolute'}}>
			{/* crosshair */}
			<g stroke="#ffffff" strokeWidth={6} fill="none" opacity={0.85}>
				<path d="M540 900 v-40 M540 1020 v40 M480 960 h-40 M600 960 h40" />
				<rect x={516} y={936} width={48} height={48} />
			</g>
			{/* palette bar */}
			<defs>
				<linearGradient id="iron" x1="0" y1="1" x2="0" y2="0">
					{IRON.map(([v, r, g, b]) => (
						<stop key={v} offset={v} stopColor={`rgb(${r},${g},${b})`} />
					))}
				</linearGradient>
			</defs>
			<rect x={990} y={360} width={36} height={600} fill="url(#iron)" stroke="#000" strokeWidth={4} />
			{/* frame corners */}
			<g stroke="#ffffff" strokeWidth={6} fill="none" opacity={0.7}>
				<path d="M70 300 h70 M70 300 v70 M1010 300 h-70 M70 1620 h70 M70 1620 v-70" />
			</g>
		</svg>
		<div style={{position: 'absolute', left: 90, top: 200, fontSize: 54, fontWeight: 700, textShadow: '4px 4px 0 #000'}}>{`${reading.toFixed(1)}°C`}</div>
		<div style={{position: 'absolute', left: 930, top: 300, fontSize: 36, fontWeight: 700, textShadow: '3px 3px 0 #000'}}>38</div>
		<div style={{position: 'absolute', left: 940, top: 975, fontSize: 36, fontWeight: 700, textShadow: '3px 3px 0 #000'}}>-2</div>
		<div style={{position: 'absolute', left: 90, top: 1650, fontSize: 36, fontWeight: 700, textShadow: '3px 3px 0 #000', opacity: Math.floor(t * 2) % 2 ? 1 : 0.6}}>● IR</div>
	</AbsoluteFill>
);

const PhoneUI: React.FC = () => (
	<AbsoluteFill>
		<svg width={1080} height={1920} style={{position: 'absolute'}}>
			<path fillRule="evenodd" fill="#08080a" d="M0 0 H1080 V1920 H0 Z M110 230 Q110 170 170 170 H910 Q970 170 970 230 V1690 Q970 1750 910 1750 H170 Q110 1750 110 1690 Z" />
			<rect x={470} y={190} width={140} height={14} rx={7} fill="#1a1a1e" />
		</svg>
	</AbsoluteFill>
);

const Overlay: React.FC<{t: number; damage: number; captions: boolean}> = ({t, damage, captions}) => {
	const cap = useRef<HTMLCanvasElement>(null);
	const noise = useRef<HTMLCanvasElement>(null);
	useLayoutEffect(() => {
		const CW = 360, CH = 640;
		const g = cap.current!.getContext('2d')!;
		g.clearRect(0, 0, CW, CH);
		const line = timeline.lines.find((l) => t >= l.start - 0.05 && t < l.end + 0.35);
		if (captions && line) {
			const words = line.text.split(' ');
			const rows: string[] = [];
			let cur = '';
			for (const w of words) {
				if ((cur + ' ' + w).trim().length > 26) {
					rows.push(cur.trim());
					cur = w;
				} else cur += ' ' + w;
			}
			rows.push(cur.trim());
			// Every word is shown: long lines become balanced pages of at most 3 rows,
			// each page timed across the spoken line in proportion to its characters.
			const nPages = Math.ceil(rows.length / 3);
			const per = Math.ceil(rows.length / nPages);
			const pages: string[][] = [];
			for (let i = 0; i < rows.length; i += per) pages.push(rows.slice(i, i + per));
			const total = pages.reduce((n, pg) => n + pg.join(' ').length, 0);
			let acc = 0;
			let show = pages[pages.length - 1];
			for (const pg of pages) {
				const pageEnd = line.start + ((acc + pg.join(' ').length) / total) * (line.end - line.start);
				acc += pg.join(' ').length;
				if (t < pageEnd) {
					show = pg;
					break;
				}
			}
			g.font = 'bold 15px "DejaVu Sans Mono", monospace';
			g.textAlign = 'center';
			show.forEach((r, i) => {
				const y = 470 + i * 19 - (show.length - 1) * 19;
				for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [2, 2]]) {
					g.fillStyle = '#000';
					g.fillText(r, CW / 2 + dx, y + dy);
				}
				g.fillStyle = '#ffffff';
				g.fillText(r, CW / 2, y);
			});
			const img = g.getImageData(0, 0, CW, CH);
			for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 120 ? 255 : 0;
			g.putImageData(img, 0, 0);
		}
		const n = noise.current!.getContext('2d')!;
		const ni = n.createImageData(LW, LH);
		const r = rng(Math.floor(t * 30) * 7919 + 5);
		const band = ((t * 30 * 2) % (LH + 60)) - 30;
		for (let y = 0; y < LH; y++) {
			const inBand = Math.abs(y - band) < 3 + damage * 12;
			for (let x = 0; x < LW; x++) {
				const i = (y * LW + x) * 4;
				const v = r() * 255;
				ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = v;
				ni.data[i + 3] = (inBand ? 40 + damage * 120 : 14 + damage * 60) * (r() < 0.5 ? 1 : 0.4);
			}
		}
		n.putImageData(ni, 0, 0);
	}, [t, damage, captions]);
	return (
		<>
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

/** The thermal reading at the crosshair: creeping up all episode (36.8 -> 37.4); the hook and the
 *  loop both read 37.0. Elsewhere it reads the cold house. */
const readingAt = (t: number, id: string) => {
	if (id === 'A_hook' || id === 'A_loop') return 37.0;
	if (id === 'B_mouse') return 4.1;
	if (id === 'E_thermal') return t < 26.0 ? lin(t, K.reveal, 26.0, 4.2, 36.8) : 36.8 + lin(t, 26.0, 30.9, 0, 0.2);
	if (id === 'G_thermal') return 37.2 + lin(t, 39.0, 42.8, 0, 0.2);
	return 0;
};

const redGrade = (t: number) => (t < L.l08.start ? 0 : t < L.l09.start ? sm(t, L.l08.start, K.figure, 0.05, 0.4) : t < K.door ? 0.12 : sm(t, K.door, K.loopOn, 0.3, 0.0));

// ------------------------------------------------------------------ assembly

export const Episode08: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const heat = useCanvasTex(36, 75);
	const plan = useCanvasTex(48, 64);
	const rep = useCanvasTex(48, 64);
	const {s} = shotAt(t);
	const figure = s.id === 'G_thermal' ? (t < K.figure ? sm(t, 39.0, 40.5, 0.3, 0.75) : 1) : 0;
	drawHeat(heat.g, t, figure);
	heat.t.needsUpdate = true;
	drawPlan(plan.g);
	plan.t.needsUpdate = true;
	drawReport(rep.g, t);
	rep.t.needsUpdate = true;
	const hit = STINGERS.reduce((a, kt) => Math.max(a, t >= kt && t < kt + 0.4 ? 1 - (t - kt) / 0.4 : 0), 0);
	const sub = t >= K.sub && t < K.sub + 0.067 ? 1 : 0;
	const damage = 0.06 + hit * 0.7 + sub * 0.5;
	const ca = 0.6 + damage * 3;
	const shift = hit > 0.5 ? Math.round(Math.sin(t * 90) * 3) : 0;
	const red = redGrade(t);
	const thermal = s.mode === 'thermal';
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="tape8" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: shift, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'url(#tape8)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.02, far: 400}} style={{imageRendering: 'pixelated'}}>
					<Cam t={t} />
					<World t={t} heat={heat.t} plan={plan.t} report={rep.t} />
				</ThreeCanvas>
			</div>
			{!thermal && <AbsoluteFill style={{background: `rgba(150,20,14,${red})`, mixBlendMode: 'multiply'}} />}
			{thermal && <ThermalUI t={t} reading={readingAt(t, s.id)} />}
			{s.mode === 'photo' && <PhoneUI />}
			<Overlay t={t} damage={damage} captions={captions} />
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.8) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep08-room-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
