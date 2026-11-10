// Episode 6: "The Sound That Matched Us" (original). 54.3 s portrait short, pixelated
// low-poly 3D (180x320 rendered, 6x nearest upscale), PS1 shaders, a tape layer that
// tears on every scare.
// Viral standard: second-person hook on frame 0 (the waterfall display, a contact dead
// astern); a seamless loop (the last 1.4 s are the hook's own push-in on negative time,
// the waterfall continuous); hidden rewatch details (a second dark hull behind the boat;
// the cook already standing beside the operator in the frozen-crew wide, before the
// reveal; a figure in the galley hatchway for two frames during the knocks; water
// dripping from the cook's sleeves; three dents at the end of the scrape) and an open
// question (who is standing next to him?).
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep06-sonar-v1-timeline.json';
import {rng} from '../ps1';
import {Human, Pose} from '../ep01/world';
import {CAPTAIN, COOK, Compartment, CREW, Headphones, MatsProvider, OPERATOR, Sea, SUB_X, Submarine} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep06Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => x * x * (3 - 2 * x);
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const sm = (t: number, a: number, b: number, v0 = 0, v1 = 1) => v0 + (v1 - v0) * ease(lin(t, a, b));
type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

export const K = {
	us: 15.97, // "Us." stinger
	stop: 24.0, // all stop
	traceStops: 27.0,
	knocks: [32.35, 33.15, 33.95],
	ghost: 33.2, // hidden: a figure in the galley hatchway, two frames
	reveal: 39.75, // the cook beside him: stinger
	loopOn: DUR - 1.4,
};
export const STINGERS = [17.06, K.reveal, 51.0];

// ------------------------------------------------------------------ shot list
type Mode = 'in' | 'deep' | 'dawn';
type Shot = {id: string; t: number; from: {p: V3; l: V3}; to?: {p: V3; l: V3}; fov?: number; mode: Mode; roll?: number};
const A = {from: {p: [-0.6, 1.17, -0.45] as V3, l: [-0.6, 1.17, -1.2] as V3}, to: {p: [-0.6, 1.17, -0.62] as V3, l: [-0.6, 1.17, -1.2] as V3}};
const S = SUB_X;
const SHOTS: Shot[] = [
	{id: 'A_waterfall_hook', t: 0, mode: 'in', ...A, fov: 52},
	{id: 'B_deep', t: 5.6, mode: 'deep', from: {p: [S + 10, 1.5, 16], l: [S - 16, 0, 0]}, to: {p: [S + 7, 1.2, 15], l: [S - 20, 0, 0]}, fov: 54},
	{id: 'C_sonar_room', t: 8.4, mode: 'in', from: {p: [0.9, 1.55, 0.95], l: [-0.6, 1.1, -1.1]}, to: {p: [0.7, 1.5, 0.75], l: [-0.6, 1.1, -1.1]}, fov: 58},
	{id: 'D_search', t: 11.6, mode: 'in', from: {p: [0.3, 1.25, -0.62], l: [0.3, 1.25, -1.2]}, to: {p: [0.3, 1.25, -0.68], l: [0.3, 1.25, -1.2]}, fov: 46},
	{id: 'E_match', t: 15.9, mode: 'in', from: {p: [0.3, 1.25, -0.6], l: [0.3, 1.25, -1.2]}, to: {p: [0.3, 1.25, -0.8], l: [0.3, 1.25, -1.2]}, fov: 46},
	{id: 'F_operator', t: 17.9, mode: 'in', from: {p: [-0.05, 1.45, -1.15], l: [-0.6, 1.3, -0.45]}, to: {p: [-0.1, 1.45, -1.08], l: [-0.6, 1.3, -0.45]}, fov: 52},
	{id: 'G_panel', t: 20.4, mode: 'in', from: {p: [0.85, 1.45, -0.55], l: [1.05, 1.52, -1.4]}, to: {p: [0.88, 1.47, -0.65], l: [1.05, 1.52, -1.4]}, fov: 46},
	{id: 'H_telegraph', t: 23.2, mode: 'in', from: {p: [1.05, 1.4, -0.15], l: [1.5, 1.12, -0.8]}, to: {p: [1.1, 1.38, -0.22], l: [1.5, 1.12, -0.8]}, fov: 50},
	{id: 'I_trace_stops', t: 26.0, mode: 'in', from: {p: [-0.6, 1.17, -0.62], l: [-0.6, 1.17, -1.2]}, to: {p: [-0.6, 1.17, -0.75], l: [-0.6, 1.17, -1.2]}, fov: 52},
	{id: 'J_frozen', t: 29.0, mode: 'in', from: {p: [2.3, 1.45, 1.1], l: [-0.4, 1.2, -0.6]}, to: {p: [2.2, 1.45, 1.0], l: [-0.4, 1.25, -0.6]}, fov: 62},
	{id: 'K_overhead', t: 32.2, mode: 'in', from: {p: [-1.6, 1.05, 0.5], l: [2.0, 1.45, 0.0]}, to: {p: [-1.5, 1.05, 0.45], l: [2.0, 1.5, 0.0]}, fov: 60},
	{id: 'L_hatch', t: 34.7, mode: 'in', from: {p: [0.6, 1.1, 0.2], l: [2.6, 1.05, 0]}, to: {p: [1.0, 1.08, 0.12], l: [2.6, 1.05, 0]}, fov: 50},
	{id: 'M_turn', t: 37.5, mode: 'in', from: {p: [-0.9, 1.45, -1.2], l: [-0.6, 1.3, -0.4]}, to: {p: [-0.88, 1.45, -1.12], l: [-0.6, 1.3, -0.4]}, fov: 54},
	{id: 'N_reveal', t: K.reveal, mode: 'in', from: {p: [-0.55, 1.32, -0.45], l: [0.08, 1.74, -0.3]}, to: {p: [-0.45, 1.36, -0.43], l: [0.08, 1.76, -0.3]}, fov: 50, roll: 0.08},
	{id: 'O_surface', t: 44.9, mode: 'dawn', from: {p: [S + 10, 2.2, 9.5], l: [S - 1, 1.8, 0]}, to: {p: [S + 9, 2.2, 8.5], l: [S - 1, 2.2, 0]}, fov: 54},
	{id: 'P_aft', t: 48.3, mode: 'dawn', from: {p: [S - 2, 3.6, 2.2], l: [S - 14, 1.4, 0.8]}, to: {p: [S - 7, 3.4, 2.4], l: [S - 16, 1.3, 0.8]}, fov: 54},
	{id: 'Q_dents', t: 51.0, mode: 'dawn', from: {p: [S - 13.0, 2.6, 2.3], l: [S - 13.5, 1.5, 1.05]}, to: {p: [S - 13.2, 2.4, 2.05], l: [S - 13.5, 1.5, 1.05]}, fov: 46},
	{id: 'A_loop', t: K.loopOn, mode: 'in', ...A, fov: 52},
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
	// "Us.": a fast punch-in instead of a slow push
	const k = s.id === 'E_match' ? ease(lin(t, s.t + 0.05, s.t + 0.35)) : ease(lin(t, s.t, end));
	return {s, k, u: t};
};

// ------------------------------------------------------------------ the displays

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
const hash = (x: number, y: number) => {
	const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
	return s - Math.floor(s);
};

/** Sonar waterfall: bearing across, time falling down; the contact sits dead astern (180). */
const drawWaterfall = (g: CanvasRenderingContext2D, u: number) => {
	const W = 96, H = 80;
	const img = g.createImageData(W, H);
	const rowDt = 0.12;
	for (let y = 0; y < H; y++) {
		const row = Math.floor(u / rowDt) - (y - 12);
		const rt = row * rowDt;
		for (let x = 0; x < W; x++) {
			let v = hash(x, row) * 0.35;
			if (y < 12) v = 0;
			const cx = 48 + Math.sin(rt * 0.4) * 1.5;
			const active = rt < K.traceStops || rt > DUR - 3; // stops after all-stop; the loop runs on negative time
			if (y >= 12 && active && Math.abs(x - cx) < 1.2) v = 0.75 + hash(x + 7, row) * 0.25;
			const i = (y * W + x) * 4;
			img.data[i] = v * 60;
			img.data[i + 1] = v * 255;
			img.data[i + 2] = v * 90;
			img.data[i + 3] = 255;
		}
	}
	g.putImageData(img, 0, 0);
	g.fillStyle = '#40ff80';
	g.font = `bold 6px ${MONO}`;
	g.textAlign = 'left';
	g.fillText('WATERFALL', 2, 7);
	g.textAlign = 'right';
	g.fillText('BRG 180', W - 2, 7);
	g.fillStyle = '#208040';
	g.fillRect(0, 10, W, 1);
	g.fillRect(48, 9, 1, 3);
};

/** The side display: library search, then the comparison with own ship. */
const drawSide = (g: CanvasRenderingContext2D, t: number) => {
	const W = 72, H = 60;
	g.fillStyle = '#020804';
	g.fillRect(0, 0, W, H);
	g.font = `bold 6px ${MONO}`;
	g.textAlign = 'left';
	if (t < 15.0 || t >= K.loopOn) {
		g.fillStyle = '#40ff80';
		g.fillText('LIBRARY', 3, 8);
		const n = Math.floor(Math.max(0, t - 11.6) * 6);
		for (let i = 0; i < 6; i++) {
			const k = n - 5 + i;
			if (k < 0) continue;
			g.fillStyle = '#208040';
			g.fillText(`#${(1200 + k * 37) % 9999}`, 3, 18 + i * 7);
			g.fillStyle = '#ff4030';
			g.fillText('NO MATCH', 30, 18 + i * 7);
		}
		return;
	}
	// two signatures side by side, identical
	const sig = (x0: number, label: string) => {
		g.fillStyle = '#40ff80';
		g.fillText(label, x0 + 1, 8);
		g.strokeStyle = '#40ff80';
		g.lineWidth = 1;
		g.beginPath();
		for (let x = 0; x < 32; x++) {
			const peak = [5, 11, 17, 23].some((p) => Math.abs(x - p) < 1) ? 20 : [8, 14, 27].some((p) => Math.abs(x - p) < 1) ? 10 : 0;
			const y = 44 - peak - hash(x, 3) * 4;
			if (x === 0) g.moveTo(x0 + x, y);
			else g.lineTo(x0 + x, y);
		}
		g.stroke();
	};
	sig(2, 'CONTACT');
	sig(38, 'OWN SHIP');
	if (t >= K.us) {
		g.fillStyle = Math.floor(t * 4) % 2 ? '#ff3020' : '#ffd0c0';
		g.font = `bold 8px ${MONO}`;
		g.textAlign = 'center';
		g.fillText('MATCH 100%', W / 2, 56);
	}
};

// ------------------------------------------------------------------ camera, sky

const Cam: React.FC<{t: number}> = ({t}) => {
	const {camera} = useThree();
	const {s, k, u} = shotAt(t);
	const to = s.to ?? s.from;
	const p = mix3(s.from.p, to.p, k);
	const l = mix3(s.from.l, to.l, k);
	// a jolt with each knock and on each stinger
	const jolt = [...K.knocks, ...STINGERS].reduce((a, kt) => a + (t >= kt && t < kt + 0.25 ? Math.sin((t - kt) * 60) * 0.012 * (1 - (t - kt) / 0.25) : 0), 0);
	const b = s.mode === 'in' ? 0.003 : 0.02;
	camera.position.set(p[0] + Math.sin(u * 0.9) * b, p[1] + Math.sin(u * 1.3) * b + jolt, p[2]);
	const roll = s.roll ?? 0;
	camera.up.set(Math.sin(roll), Math.cos(roll), 0);
	camera.lookAt(...l);
	(camera as THREE.PerspectiveCamera).fov = s.fov ?? 50;
	(camera as THREE.PerspectiveCamera).far = 300;
	camera.updateProjectionMatrix();
	return null;
};

const SKY: Record<Mode, string> = {in: '#030102', deep: '#06141c', dawn: '#6a6470'};
const Atmos: React.FC<{mode: Mode}> = ({mode}) => {
	const {scene} = useThree();
	const bg = new THREE.Color(SKY[mode]);
	if (!scene.fog) scene.fog = new THREE.Fog(bg, 10, 70);
	const f = scene.fog as THREE.Fog;
	f.color.copy(bg);
	f.near = mode === 'deep' ? 4 : mode === 'dawn' ? 30 : 4;
	f.far = mode === 'deep' ? 60 : mode === 'dawn' ? 160 : 14;
	scene.background = bg;
	return null;
};

// ------------------------------------------------------------------ the world at time t

const World: React.FC<{t: number; display: THREE.Texture; side: THREE.Texture}> = ({t, display, side}) => {
	const {s} = shotAt(t);
	const mode = s.mode;
	const knock = K.knocks.reduce((a, kt) => Math.max(a, t >= kt && t < kt + 0.4 ? 1 - (t - kt) / 0.4 : 0), 0);
	// the lamps stutter on each knock
	const lamps = K.knocks.some((kt) => t >= kt && t < kt + 0.13) ? 0 : 1;
	const panel = t < K.stop ? Math.sin(t * 38) * (0.6 + 0.4 * Math.sin(t * 3)) : 0;
	const telegraph = sm(t, K.stop - 0.2, K.stop + 0.3);
	// people
	const opHead: [number, number] = s.id === 'M_turn' ? [sm(t, 38.2, 39.6, 0, -0.9), 0] : s.id === 'N_reveal' ? [-1.0, 0] : s.id === 'J_frozen' || s.id === 'K_overhead' ? [0, 0.35] : s.id === 'F_operator' ? [0, -0.05] : [0, 0];
	const operator: Pose = {sit: true, yaw: Math.PI / 2, head: opHead, armL: [1.0, -1.2], armR: s.id === 'F_operator' ? [2.3, -1.6] : [1.0, -1.2]};
	const showCook = s.id === 'J_frozen' || s.id === 'N_reveal';
	const showOperator = s.id !== 'N_reveal';
	const cookTilt = s.id === 'N_reveal' ? sm(t, 41.2, 43.4, 0, 0.18) : 0;
	const inside = mode === 'in';
	const red = lamps * (0.9 + 0.1 * Math.sin(t * 9));
	return (
		<>
			<Atmos mode={mode} />
			<ambientLight intensity={inside ? 0.18 : mode === 'deep' ? 1.1 : 1.4} color={inside ? '#5a2020' : mode === 'deep' ? '#2a5068' : '#a098a8'} />
			{mode === 'dawn' && <directionalLight position={[60, 50, 70]} intensity={1.1} color="#e0b0a0" />}
			{mode === 'deep' && <directionalLight position={[10, 60, 20]} intensity={1.0} color="#6a9ab0" />}
			{/* red battle lamps and the green displays */}
			{inside && <pointLight position={[-1.2, 2.0, -0.3]} intensity={red * 5} distance={5} decay={1.2} color="#ff2a18" />}
			{inside && <pointLight position={[1.4, 2.0, -0.3]} intensity={red * 4} distance={5} decay={1.2} color="#ff2a18" />}
			{inside && <pointLight position={[-0.3, 1.2, -0.8]} intensity={1.6} distance={2.2} decay={1.3} color="#40ff80" />}
			{/* the reveal: a red lamp low under the faces */}
			{s.id === 'N_reveal' && <pointLight position={[-0.15, 1.15, -0.4]} intensity={4} distance={1.6} decay={1.2} color="#ff3020" />}
			{inside && (
				<>
					<Compartment display={display} side={side} panel={panel} telegraph={telegraph} lamps={lamps} knock={knock} t={t} />
					{s.id !== 'A_waterfall_hook' && s.id !== 'A_loop' && s.id !== 'I_trace_stops' && (
						<>
							{showOperator && <Human pose={operator} pos={[-0.6, 0, -0.45]} look={OPERATOR} face />}
							{showOperator && <Headphones p={[-0.6, 0.48 + 0.66 + 0.24, -0.45]} />}
						</>
					)}
					{(s.id === 'H_telegraph' || s.id === 'J_frozen') && <Human pose={{yaw: Math.PI / 2, armR: [s.id === 'H_telegraph' ? 1.6 : 0.3, -0.4], head: [0, s.id === 'J_frozen' ? 0.35 : 0]}} pos={[1.95, 0, -0.55]} look={CAPTAIN} face />}
					{s.id === 'J_frozen' && <Human pose={{yaw: -Math.PI / 2, head: [0, 0.4], armL: [0.1, -0.2], armR: [0.1, -0.2]}} pos={[0.6, 0, 0.9]} look={CREW} face />}
					{showCook && <Human pose={{yaw: Math.PI, head: [0, cookTilt], armL: [0.05, 0], armR: [0.05, 0]}} pos={[0.05, 0, -0.32]} look={COOK} face />}
					{/* water dripping from the cook's sleeves */}
					{s.id === 'N_reveal' && [0, 1].map((i) => <mesh key={i} position={[0.05, 0.62 - ((t * 1.8 + i * 0.5) % 1) * 0.6, -0.32 + (i ? 0.27 : -0.27)]}><boxGeometry args={[0.015, 0.03, 0.015]} /><meshBasicMaterial color="#a8c0d0" /></mesh>)}
					{/* hidden: someone standing in the galley hatchway, two frames */}
					{t >= K.ghost && t < K.ghost + 0.067 && <Human pose={{yaw: Math.PI, head: [0, 0.2]}} pos={[2.3, 0, 0]} look={COOK} face />}
					{t >= K.ghost && t < K.ghost + 0.067 && <pointLight position={[1.6, 1.6, 0.3]} intensity={6} distance={3} color="#ff4030" />}
				</>
			)}
			{!inside && (
				<>
					<Sea surface={mode === 'dawn'} />
					<Submarine p={[SUB_X, mode === 'dawn' ? (s.id === 'O_surface' ? sm(t, 44.9, 47.9, -2.5, 0.8) : 0.8) : 0, 0]} scrape={mode === 'dawn'} />
					{/* hidden: a second dark hull far astern, in the murk */}
					{mode === 'deep' && <Submarine p={[SUB_X - 62, -1.5, -4]} dark />}
				</>
			)}
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

// ------------------------------------------------------------------ assembly

export const Episode06: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const wf = useCanvasTex(96, 80);
	const sd = useCanvasTex(72, 60);
	const {u} = shotAt(t);
	drawWaterfall(wf.g, u);
	wf.t.needsUpdate = true;
	drawSide(sd.g, t);
	sd.t.needsUpdate = true;
	// tape tears on every scare and every knock
	const hit = [...STINGERS, ...K.knocks].reduce((a, kt) => Math.max(a, t >= kt && t < kt + 0.35 ? 1 - (t - kt) / 0.35 : 0), 0);
	const ghost = t >= K.ghost && t < K.ghost + 0.067 ? 1 : 0;
	const damage = 0.06 + hit * 0.7 + ghost * 0.5;
	const ca = 0.6 + damage * 3;
	const shift = hit > 0.5 ? Math.round(Math.sin(t * 90) * 3) : 0;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="tape6" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: shift, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'url(#tape6)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.02, far: 300}} style={{imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Cam t={t} />
						<World t={t} display={wf.t} side={sd.t} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			<Overlay t={t} damage={damage} captions={captions} />
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.8) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep06-sonar-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
