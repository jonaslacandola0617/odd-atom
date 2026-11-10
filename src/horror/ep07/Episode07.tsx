// Episode 7: "This Is the Voice of Vrillon" (true: the Southern Television broadcast
// interruption, 26 November 1977). About 60 s portrait short, pixelated low-poly 3D
// (180x320 rendered, 6x nearest upscale), PS1 shaders, a tape layer that tears on every
// scare, a red grade that creeps in with the intruding voice.
// Viral standard: second-person hook on frame 0 (the newsreader on the CRT, lips moving,
// "...that is not his voice"); a seamless loop (the TV switches itself back on and the
// last 1.6 s are the hook's own push-in on negative time); hidden rewatch details (the
// clock moves exactly six minutes, 5:10 to 5:16; the child is the only one looking at
// the back window, toward the mast; the SOUND meter pinned while VISION reads normal; a
// faint red light on a far hill where no mast stands; the dark screen in the empty room
// still reflects three people watching, and they are there for two frames); an open
// question (whose voice, and where was it really coming from?).
// The picture is a dramatisation: no real broadcast footage or audio is used, the
// newsreader is a generic figure, and nobody is identified or implied.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep07-vrillon-v1-timeline.json';
import {rng} from '../ps1';
import {Human} from '../ep01/world';
import {CHILD, CLOCK, FATHER, Hut, HUT_X, LivingRoom, MAST, HILL_H, MatsProvider, MOTHER, Outside, TV_SCREEN} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep07Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => x * x * (3 - 2 * x);
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const sm = (t: number, a: number, b: number, v0 = 0, v1 = 1) => v0 + (v1 - v0) * ease(lin(t, a, b));
type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));

// key times (scripts/ep07_sound.py reads the same numbers)
export const K = {
	hum: L.l04.start, // the sound starts to go
	intrude: L.v01.start, // the other voice
	pov: 27.6, // stinger in silence; the room seen from inside the TV
	sub1: 34.6, // hidden: two frames of the room on the TV
	roll: 35.3, // the picture rolls once
	back: 43.4, // the sound snaps back: stinger
	apology: L.l10.start,
	empty: 51.6, // years later: stinger
	sub2: 55.2, // hidden: two frames of the family on the dust sheets
	tvOn: 57.75, // the TV switches itself on
	loopOn: DUR - 1.6,
};
export const STINGERS = [K.pov, K.back, K.empty];

// ------------------------------------------------------------------ shot list
type Mode = 'room' | 'empty' | 'dusk' | 'hut';
type Shot = {id: string; t: number; from: {p: V3; l: V3}; to?: {p: V3; l: V3}; fov?: number; mode: Mode; roll?: number};
const S = TV_SCREEN;
const A = {from: {p: [S[0], 0.97, 0.3] as V3, l: [S[0], 0.93, S[2]] as V3}, to: {p: [S[0], 0.94, 0.78] as V3, l: [S[0], 0.92, S[2]] as V3}};
const MT: V3 = [MAST[0], HILL_H, MAST[2]];
const SHOTS: Shot[] = [
	{id: 'A_hook', t: 0, mode: 'room', ...A, fov: 48},
	{id: 'B_town', t: L.l02.start - 0.7, mode: 'dusk', from: {p: [20, 1.7, -11], l: [-300, 72, 30]}, to: {p: [18.5, 1.7, -10], l: [-300, 76, 30]}, fov: 62},
	{id: 'C_room', t: L.l03.start - 0.5, mode: 'room', from: {p: [2.15, 1.8, -1.75], l: [-0.4, 0.75, 1.0]}, to: {p: [2.0, 1.75, -1.6], l: [-0.4, 0.78, 1.0]}, fov: 60},
	{id: 'C_clock', t: 13.2, mode: 'room', from: {p: [-1.5, 1.42, -1.22], l: [CLOCK[0], CLOCK[1], CLOCK[2]]}, to: {p: [-1.5, 1.42, -1.3], l: [CLOCK[0], CLOCK[1], CLOCK[2]]}, fov: 40},
	{id: 'D_tv', t: L.l04.start - 0.7, mode: 'room', from: {p: [0.55, 1.12, -0.3], l: [S[0], 0.88, S[2]]}, to: {p: [0.45, 1.08, 0.0], l: [S[0], 0.88, S[2]]}, fov: 50},
	{id: 'E_faces', t: L.l05.start - 0.5, mode: 'room', from: {p: [0.8, 1.2, 1.45], l: [-0.5, 0.82, -0.6]}, to: {p: [0.75, 1.18, 1.38], l: [-0.5, 0.82, -0.6]}, fov: 60},
	{id: 'F_push', t: L.v01.start - 0.7, mode: 'room', from: {p: [0.75, 1.45, -1.0], l: [S[0], 0.9, S[2]]}, to: {p: [0.35, 1.2, 0.3], l: [S[0], 0.92, S[2]]}, fov: 50},
	{id: 'F_mouth', t: 24.0, mode: 'room', from: {p: [S[0], 0.955, 1.18], l: [S[0], 0.945, S[2]]}, to: {p: [S[0], 0.952, 1.26], l: [S[0], 0.945, S[2]]}, fov: 40},
	{id: 'G_pov', t: K.pov, mode: 'room', from: {p: [0.3, 1.22, 1.45], l: [-0.55, 0.8, -0.7]}, to: {p: [0.28, 1.21, 1.38], l: [-0.55, 0.81, -0.7]}, fov: 70, roll: 0.05},
	{id: 'H_frozen', t: L.l06.start + 1.8, mode: 'room', from: {p: [2.05, 0.75, 1.55], l: [-1.0, 0.85, -0.6]}, to: {p: [1.95, 0.78, 1.45], l: [-1.0, 0.85, -0.6]}, fov: 58},
	{id: 'I_mouth', t: L.l07.start, mode: 'room', from: {p: [S[0], 0.955, 1.22], l: [S[0], 0.945, S[2]]}, to: {p: [S[0], 0.952, 1.3], l: [S[0], 0.945, S[2]]}, fov: 36},
	{id: 'I_window', t: 36.6, mode: 'room', from: {p: [-1.55, 1.15, -0.25], l: [MAST[0], 100, MAST[2]]}, to: {p: [-1.9, 1.15, -0.25], l: [MAST[0], 104, MAST[2]]}, fov: 56},
	{id: 'J_mast', t: L.l08.start, mode: 'dusk', from: {p: [MT[0] + 34, MT[1] + 0.6, MT[2] + 26], l: [MT[0], MT[1] + 95, MT[2]]}, to: {p: [MT[0] + 31, MT[1] + 0.6, MT[2] + 24], l: [MT[0], MT[1] + 105, MT[2]]}, fov: 62},
	{id: 'J_town', t: 40.9, mode: 'dusk', from: {p: [MT[0] - 40, MT[1] + 30, MT[2] - 10], l: [20, 0, 40]}, to: {p: [MT[0] - 38, MT[1] + 29, MT[2] - 10], l: [20, 0, 40]}, fov: 48},
	{id: 'J_meters', t: 42.3, mode: 'hut', from: {p: [HUT_X + 0.35, 1.5, 0.95], l: [HUT_X + 0.2, 1.42, 1.9]}, to: {p: [HUT_X + 0.3, 1.47, 1.1], l: [HUT_X + 0.2, 1.42, 1.9]}, fov: 50},
	{id: 'K_back', t: K.back, mode: 'room', from: {p: [0.45, 1.08, 0.0], l: [S[0], 0.88, S[2]]}, to: {p: [0.42, 1.06, 0.1], l: [S[0], 0.88, S[2]]}, fov: 50},
	{id: 'L_wide', t: L.l09.start, mode: 'room', from: {p: [-2.15, 1.65, 1.65], l: [0.6, 0.7, -1.0]}, to: {p: [-2.05, 1.6, 1.5], l: [0.6, 0.72, -1.0]}, fov: 58},
	{id: 'M_card', t: L.l10.start, mode: 'room', from: {p: [0.3, 1.0, 0.45], l: [S[0], 0.92, S[2]]}, to: {p: [0.25, 0.98, 0.6], l: [S[0], 0.92, S[2]]}, fov: 46},
	{id: 'M_clock', t: 49.6, mode: 'room', from: {p: [-1.5, 1.42, -1.22], l: [CLOCK[0], CLOCK[1], CLOCK[2]]}, to: {p: [-1.5, 1.42, -1.3], l: [CLOCK[0], CLOCK[1], CLOCK[2]]}, fov: 40},
	{id: 'N_empty', t: K.empty, mode: 'empty', from: {p: [2.15, 1.8, -1.75], l: [-0.4, 0.75, 1.0]}, to: {p: [1.85, 1.7, -1.45], l: [-0.4, 0.78, 1.0]}, fov: 60},
	{id: 'O_tv', t: 56.0, mode: 'empty', from: {p: [S[0], 1.0, -0.4], l: [S[0], 0.92, S[2]]}, to: {p: [S[0], 0.98, 0.25], l: [S[0], 0.92, S[2]]}, fov: 48},
	{id: 'A_loop', t: K.loopOn, mode: 'room', ...A, fov: 48},
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

// ------------------------------------------------------------------ the TV picture, the clock, the meters

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

/** The early-evening news on the CRT: a generic newsreader whose lips never stop. */
const drawNews = (g: CanvasRenderingContext2D, u: number, roll: number) => {
	const W = 64, H = 48;
	g.save();
	g.translate(0, roll);
	const grd = g.createLinearGradient(0, 0, 0, H);
	grd.addColorStop(0, '#46587a');
	grd.addColorStop(1, '#2a3450');
	g.fillStyle = grd;
	g.fillRect(0, 0, W, H);
	// a world-map backdrop panel behind him
	g.fillStyle = '#56688a';
	g.fillRect(40, 6, 20, 14);
	g.fillStyle = '#6a7c9a';
	for (const [x, y, w] of [[42, 9, 5], [48, 8, 4], [50, 12, 6], [43, 14, 3], [54, 15, 3]]) g.fillRect(x, y, w, 2);
	// the desk
	g.fillStyle = '#5a4630';
	g.fillRect(0, 40, W, 8);
	g.fillStyle = '#d8d4c4';
	g.fillRect(36, 38, 10, 3);
	// shoulders, suit, shirt, tie
	g.fillStyle = '#2a2e38';
	g.beginPath();
	g.moveTo(14, 48);
	g.lineTo(18, 33);
	g.lineTo(30, 30);
	g.lineTo(42, 33);
	g.lineTo(46, 48);
	g.fill();
	g.fillStyle = '#d8d8d0';
	g.beginPath();
	g.moveTo(26, 30);
	g.lineTo(30, 38);
	g.lineTo(34, 30);
	g.fill();
	g.fillStyle = '#6a2020';
	g.fillRect(29, 31, 2, 7);
	// head
	g.fillStyle = '#c09a7a';
	g.fillRect(27, 27, 6, 4);
	g.beginPath();
	g.ellipse(30, 20, 6.5, 8, 0, 0, Math.PI * 2);
	g.fill();
	g.fillStyle = '#4a3220';
	g.beginPath();
	g.ellipse(30, 14, 7, 4, 0, Math.PI, Math.PI * 2);
	g.fill();
	g.fillRect(23, 13, 2, 6);
	g.fillRect(36, 13, 2, 5);
	// eyes (he blinks), brows
	g.fillStyle = '#1a1210';
	const blink = Math.sin(u * 0.9) > 0.985;
	g.fillRect(27, 19, 2, blink ? 1 : 2);
	g.fillRect(32, 19, 2, blink ? 1 : 2);
	g.fillRect(26, 17, 3, 1);
	g.fillRect(31, 17, 3, 1);
	// the mouth: always moving, on the news's own rhythm
	const open = Math.max(0, Math.sin(u * 11.3) + 0.8 * Math.sin(u * 6.7 + 1.3));
	g.fillStyle = '#4a1a14';
	g.fillRect(28, 24, 5, 1 + Math.round(open * 1.2));
	g.restore();
	if (roll) {
		g.fillStyle = '#000';
		g.fillRect(0, roll > 0 ? roll - 3 : H + roll, W, 3);
	}
};

const drawTV = (g: CanvasRenderingContext2D, t: number, u: number) => {
	const W = 64, H = 48;
	const r = rng(Math.floor(t * 30) * 31 + 7);
	if (t >= K.empty && t < K.tvOn) {
		// off: dark glass; the room is reflected in it ... with three people still sitting there
		g.fillStyle = '#121614';
		g.fillRect(0, 0, W, H);
		g.fillStyle = '#1c2220';
		g.fillRect(4, 4, 56, 40);
		g.fillStyle = '#2a3432';
		g.fillRect(8, 8, 9, 13); // the back window, reflected
		g.fillStyle = '#0a0c0c';
		for (const [x, y, w, h] of [[22, 26, 5, 9], [32, 25, 5, 10], [43, 30, 4, 7]]) {
			g.fillRect(x, y, w, h);
			g.beginPath();
			g.arc(x + w / 2, y - 2, w / 2 + 0.5, 0, Math.PI * 2);
			g.fill();
		}
		g.fillStyle = 'rgba(255,255,255,0.06)';
		g.fillRect(44, 4, 6, 18);
		return;
	}
	if (t >= K.tvOn && t < K.loopOn) {
		// warming up: a white line opening into the picture
		const k = lin(t, K.tvOn, K.loopOn - 0.05);
		drawNews(g, u, 0);
		g.fillStyle = '#000';
		const h = Math.round((1 - k) * 23);
		g.fillRect(0, 0, W, h);
		g.fillRect(0, H - h, W, h);
		g.fillStyle = '#e8f0ff';
		if (k < 0.5) g.fillRect(0, 23 - 1, W, 2);
	} else if (t >= K.apology && t < K.empty) {
		// the apology card (dramatised wording)
		g.fillStyle = '#1a2a5a';
		g.fillRect(0, 0, W, H);
		g.fillStyle = '#e8e4d0';
		g.font = `bold 6px ${MONO}`;
		g.textAlign = 'center';
		g.fillText('WE APOLOGISE', 32, 18);
		g.fillText('FOR THE', 32, 26);
		g.fillText('INTERFERENCE', 32, 34);
	} else if (t >= K.sub1 && t < K.sub1 + 0.067) {
		// hidden: for two frames the TV shows the room it is standing in, seen from the screen
		g.fillStyle = '#5a3e26';
		g.fillRect(0, 0, W, H);
		g.fillStyle = '#7a5a2a';
		g.fillRect(6, 26, 52, 14);
		g.fillStyle = '#100c0a';
		for (const [x, y] of [[22, 18], [34, 17], [12, 30]]) {
			g.fillRect(x, y + 5, 7, 10);
			g.beginPath();
			g.arc(x + 3.5, y + 2, 4, 0, Math.PI * 2);
			g.fill();
		}
		g.fillStyle = '#e8e0d0';
		for (const [x, y] of [[24, 19], [27, 19], [36, 18], [39, 18], [14, 31], [17, 31]]) g.fillRect(x, y, 1, 1);
	} else {
		const roll = t >= K.roll && t < K.roll + 0.6 ? Math.round(((t - K.roll) / 0.6) * H) : 0;
		drawNews(g, u, roll);
	}
	// CRT: scanlines, noise, a soft dark rim
	const img = g.getImageData(0, 0, W, H);
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			const i = (y * W + x) * 4;
			const n = (r() - 0.5) * 26;
			const sl = y % 2 ? 0.82 : 1;
			const ex = Math.max(Math.abs(x - 31.5) / 32, Math.abs(y - 23.5) / 24);
			const rim = ex > 0.88 ? 0.55 : 1;
			for (let c = 0; c < 3; c++) img.data[i + c] = Math.max(0, Math.min(255, (img.data[i + c] + n) * sl * rim));
		}
	g.putImageData(img, 0, 0);
};

/** The mantel clock: 5:10 when the news starts, 5:16 when the sound comes back. */
const drawClock = (g: CanvasRenderingContext2D, t: number) => {
	const minutes = 10 + 6 * lin(t, 13.2, 49.6) + (t > 49.6 ? (t - 49.6) / 60 : 0);
	g.fillStyle = '#3a2414';
	g.fillRect(0, 0, 32, 32);
	g.fillStyle = '#e4dcc4';
	g.beginPath();
	g.arc(16, 16, 14, 0, Math.PI * 2);
	g.fill();
	g.fillStyle = '#2a2018';
	for (let i = 0; i < 12; i++) {
		const a = (i / 12) * Math.PI * 2;
		g.fillRect(Math.round(16 + Math.sin(a) * 12) - (i % 3 ? 0 : 1), Math.round(16 - Math.cos(a) * 12) - (i % 3 ? 0 : 1), i % 3 ? 1 : 2, i % 3 ? 1 : 2);
	}
	const hand = (a: number, len: number, w: number, c: string) => {
		g.strokeStyle = c;
		g.lineWidth = w;
		g.beginPath();
		g.moveTo(16, 16);
		g.lineTo(16 + Math.sin(a) * len, 16 - Math.cos(a) * len);
		g.stroke();
	};
	hand(((5 + minutes / 60) / 12) * Math.PI * 2, 7, 2, '#1a1410');
	hand((minutes / 60) * Math.PI * 2, 11, 1.5, '#1a1410');
	hand((Math.floor(t) / 60) * Math.PI * 2 * 1.0, 11, 1, '#8a2018');
};

/** VISION and SOUND level meters in the transmitter building: SOUND pinned. */
const drawMeters = (g: CanvasRenderingContext2D, t: number) => {
	const W = 38, H = 64;
	g.fillStyle = '#1a1c18';
	g.fillRect(0, 0, W, H);
	const meter = (y0: number, label: string, v: number) => {
		g.fillStyle = '#d8d0b0';
		g.fillRect(3, y0, 32, 22);
		g.fillStyle = '#b02a1e';
		g.fillRect(25, y0 + 4, 8, 3);
		g.strokeStyle = '#2a2018';
		g.lineWidth = 1;
		g.beginPath();
		g.arc(19, y0 + 22, 16, Math.PI * 1.2, Math.PI * 1.8);
		g.stroke();
		const a = Math.PI * (1.22 + 0.56 * v);
		g.strokeStyle = '#101010';
		g.lineWidth = 1.5;
		g.beginPath();
		g.moveTo(19, y0 + 21);
		g.lineTo(19 + Math.cos(a) * 17, y0 + 21 + Math.sin(a) * 17);
		g.stroke();
		g.fillStyle = '#e0dcc8';
		g.font = `bold 6px ${MONO}`;
		g.textAlign = 'center';
		g.fillText(label, 19, y0 + 29);
	};
	meter(2, 'VISION', 0.5 + Math.sin(t * 3.1) * 0.06);
	meter(33, 'SOUND', 0.97 + Math.sin(t * 40) * 0.02);
};

// ------------------------------------------------------------------ camera, sky

const Cam: React.FC<{t: number}> = ({t}) => {
	const {camera} = useThree();
	const {s, k, u} = shotAt(t);
	const to = s.to ?? s.from;
	const p = mix3(s.from.p, to.p, k);
	const l = mix3(s.from.l, to.l, k);
	const jolt = STINGERS.reduce((a, kt) => a + (t >= kt && t < kt + 0.3 ? Math.sin((t - kt) * 55) * 0.014 * (1 - (t - kt) / 0.3) : 0), 0);
	const b = s.mode === 'dusk' ? 0.05 : 0.003;
	camera.position.set(p[0] + Math.sin(u * 0.8) * b, p[1] + Math.sin(u * 1.1) * b + jolt, p[2]);
	const roll = s.roll ?? 0;
	camera.up.set(Math.sin(roll), Math.cos(roll), 0);
	camera.lookAt(...l);
	(camera as THREE.PerspectiveCamera).fov = s.fov ?? 50;
	(camera as THREE.PerspectiveCamera).far = 2500;
	camera.updateProjectionMatrix();
	return null;
};

const SkyDome: React.FC = () => {
	const m = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = 1;
		c.height = 32;
		const g = c.getContext('2d')!;
		const grd = g.createLinearGradient(0, 0, 0, 32);
		grd.addColorStop(0, '#0e1022');
		grd.addColorStop(0.42, '#262a48');
		grd.addColorStop(0.5, '#6a4450');
		grd.addColorStop(0.53, '#3a2a30');
		grd.addColorStop(1, '#141418');
		g.fillStyle = grd;
		g.fillRect(0, 0, 1, 32);
		const t = new THREE.CanvasTexture(c);
		t.colorSpace = THREE.SRGBColorSpace;
		return new THREE.MeshBasicMaterial({map: t, side: THREE.BackSide, fog: false, depthWrite: false});
	}, []);
	return (
		<mesh material={m} renderOrder={-1}>
			<sphereGeometry args={[2000, 16, 12]} />
		</mesh>
	);
};

const FOG: Record<Mode, [string, number, number]> = {room: ['#0a0806', 5, 1400], empty: ['#06080a', 5, 1400], dusk: ['#2a2a40', 60, 1500], hut: ['#101210', 4, 16]};
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

// ------------------------------------------------------------------ the world at time t

const World: React.FC<{t: number; screen: THREE.Texture; clock: THREE.Texture; meters: THREE.Texture}> = ({t, screen, clock, meters}) => {
	const {s} = shotAt(t);
	const mode = s.mode;
	const tvOn = mode === 'empty' ? (t >= K.tvOn ? 1 : 0) : 1;
	const flick = 0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 5.3);
	const beacon = Math.floor(t / 0.9) % 2 === 0 ? 1 : 0;
	const farLight = Math.floor(t / 1.37 + 0.4) % 2 === 0 ? 1 : 0;
	const sub2 = t >= K.sub2 && t < K.sub2 + 0.067;
	const intrusion = t >= K.intrude - 0.2 && t < K.back;
	// people: frozen while the voice speaks; the child turns to the back window (hidden)
	const childHead: [number, number] = s.id === 'H_frozen' ? [-1.1, 0.05] : [0, intrusion ? 0.1 : 0.05];
	const lookUp = s.id === 'E_faces' ? sm(t, L.l05.start - 0.3, L.l05.start + 0.8, 0, 0.12) : intrusion ? 0.12 : 0;
	return (
		<>
			<Atmos mode={mode} />
			<SkyDome />
			{mode === 'dusk' && (
				<>
					<ambientLight intensity={1.6} color="#6a6e90" />
					<directionalLight position={[-300, 60, 80]} intensity={0.6} color="#d08a70" />
					{/* the last of the sky behind the camera lights the east-facing terrace */}
					<directionalLight position={[200, 120, -60]} intensity={0.9} color="#8a90c0" />
					{[-18, -6, 6, 18].map((z) => (
						<pointLight key={z} position={[5.0, 4.0, z]} intensity={2.2} distance={9} decay={1.2} color="#ffa040" />
					))}
				</>
			)}
			{(mode === 'room' || mode === 'empty') && (
				<>
					<ambientLight intensity={mode === 'room' ? 0.62 : 1.25} color={mode === 'room' ? '#6a5442' : '#4a5a70'} />
					{/* the TV is the key light: cold, flickering with the picture */}
					{tvOn > 0 && <pointLight position={[S[0], 0.95, 1.2]} intensity={4.2 * flick} distance={7} decay={1.0} color="#8aa8ff" />}
					{s.id === 'G_pov' && <pointLight position={[0.1, 1.05, 1.1]} intensity={3.5} distance={4} decay={1.0} color="#a0b8ff" />}
					{mode === 'room' && <pointLight position={[2.0, 1.5, -1.55]} intensity={1.1} distance={3.2} decay={1.3} color="#ffc070" />}
					{mode === 'room' && <pointLight position={[-1.5, 0.45, -1.5]} intensity={0.7} distance={2.2} decay={1.3} color="#ff7a30" />}
					{mode === 'empty' && <pointLight position={[-2.1, 1.7, 0]} intensity={3.2} distance={6} decay={1.0} color="#7a8ab0" />}
				</>
			)}
			{mode === 'hut' && (
				<>
					<ambientLight intensity={0.45} color="#7a8a80" />
					<pointLight position={[HUT_X, 2.5, 0.8]} intensity={1.6} distance={6} decay={1.1} color="#d0e0d8" />
					<pointLight position={[HUT_X + 0.2, 1.3, 1.5]} intensity={0.8} distance={1.6} decay={1.2} color="#ff5a3a" />
				</>
			)}
			{(mode === 'room' || mode === 'empty') && <LivingRoom screen={screen} clock={clock} fire={mode === 'room' ? 1 : 0} lamp={mode === 'room' ? 1 : 0} empty={mode === 'empty'} />}
			{(mode === 'room' || (mode === 'empty' && sub2)) && (
				<>
					<Human pose={{sit: true, yaw: -0.97, head: [0, lookUp], armL: [0.6, -1.0], armR: [0.6, -1.0]}} pos={[-1.3, 0, -0.3]} look={FATHER} face />
					<Human pose={{sit: true, yaw: -Math.PI / 2, head: [0, lookUp], armL: [0.7, -1.2], armR: [0.7, -1.2]}} pos={[0.4, 0, -1.25]} look={MOTHER} face />
					<Human pose={{sit: true, yaw: -Math.PI / 2, head: childHead, armL: [0.4, -0.6], armR: [0.4, -0.6]}} pos={[0.1, -0.3, 0.45]} look={CHILD} face />
				</>
			)}
			{mode === 'hut' && <Hut meters={meters} tube={0.85 + 0.15 * Math.sin(t * 40)} />}
			<Outside beacon={beacon} farLight={farLight} tvLit={mode === 'empty' ? 0.15 : flick} />
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: captions + tape

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
			// the intruding voice is captioned in a pale red
			const ink = line.kind === 'vrillon' ? '#ffb4a8' : '#ffffff';
			show.forEach((r, i) => {
				const y = 470 + i * 19 - (show.length - 1) * 19;
				for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [2, 2]]) {
					g.fillStyle = '#000';
					g.fillText(r, CW / 2 + dx, y + dy);
				}
				g.fillStyle = ink;
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

/** How red and dark the picture is: it creeps in with the hum, peaks with the voice,
 *  lets go when the sound comes back, returns for the empty room; equal at both ends. */
const redGrade = (t: number) =>
	t < K.hum ? 0.12 : t < K.intrude ? sm(t, K.hum, K.intrude, 0.12, 0.35) : t < K.back ? (t < 30 ? sm(t, K.intrude, 27.0, 0.35, 0.5) : sm(t, 30, 43.0, 0.5, 0.38)) : t < K.empty ? 0.05 : sm(t, K.empty, K.loopOn, 0.22, 0.12);

// ------------------------------------------------------------------ assembly

export const Episode07: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const tv = useCanvasTex(64, 48);
	const ck = useCanvasTex(32, 32);
	const mt = useCanvasTex(38, 64);
	const {s, u} = shotAt(t);
	drawTV(tv.g, t, u);
	tv.t.needsUpdate = true;
	drawClock(ck.g, t);
	ck.t.needsUpdate = true;
	drawMeters(mt.g, t);
	mt.t.needsUpdate = true;
	// tape tears on every scare and on the subliminal frames
	const hit = STINGERS.reduce((a, kt) => Math.max(a, t >= kt && t < kt + 0.4 ? 1 - (t - kt) / 0.4 : 0), 0);
	const sub = (t >= K.sub1 && t < K.sub1 + 0.067) || (t >= K.sub2 && t < K.sub2 + 0.067) ? 1 : 0;
	const intr = t >= K.intrude && t < K.back ? 0.12 : 0;
	const damage = 0.06 + intr + hit * 0.7 + sub * 0.5;
	const ca = 0.6 + damage * 3;
	const shift = hit > 0.5 ? Math.round(Math.sin(t * 90) * 3) : 0;
	const red = redGrade(t);
	const pov = s.id === 'G_pov' ? 1 : 0;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="tape7" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: shift, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'url(#tape7)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.02, far: 2500}} style={{imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Cam t={t} />
						<World t={t} screen={tv.t} clock={ck.t} meters={mt.t} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			{/* red/dark grade */}
			<AbsoluteFill style={{background: `rgba(150,20,14,${red})`, mixBlendMode: 'multiply'}} />
			<AbsoluteFill style={{background: `rgba(0,0,0,${red * 0.2})`}} />
			<Overlay t={t} damage={damage} captions={captions} />
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
			<AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) ${42 - pov * 14}%, rgba(0,0,0,${0.8 + pov * 0.15}) 100%)`}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep07-vrillon-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
