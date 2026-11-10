// Episode 3: "Footprints in the Snow" (true story: Hinterkaifeck, Bavaria, 1922).
// 58.4 s portrait short, pixelated low-poly 3D (180x320 rendered, 6x nearest upscale),
// PS1 shaders, a light tape layer.
// Six real people died here, children among them. Nothing violent is shown and no one
// is accused: the film shows only the house and its traces. The farmer is seen from
// behind or in shadow; the family is only ever lit windows.
// Viral standard: second-person hook on frame 0 (the tracks lead to YOUR door); a
// seamless loop (the last shot is the hook's own camera move, run on negative time,
// with the snow continuous); hidden rewatch details (a glow in the attic gable window
// from frame 0; a breath in the lantern light; two points of light between the ceiling
// boards; the missing keys in the hay); and an open question (how long was someone
// living above them?).
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep03-snow-v1-timeline.json';
import {rng} from '../ps1';
import {Human, Pose} from '../ep01/world';
import {Cattle, Farm, FARMER, Forest, Hollow, Interiors, MatsProvider, Snowfall, steps, useM} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep03Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => x * x * (3 - 2 * x);
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const sm = (t: number, a: number, b: number, v0 = 0, v1 = 1) => v0 + (v1 - v0) * ease(lin(t, a, b));
type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

export const K = {
	glint: 20.6, // hidden: two points of light between the ceiling boards
	rise: 24.0, // the lantern comes up through the hatch
	breath: 25.6, // hidden: a breath in the lantern light, right in front of us
	down: 26.9,
	lightOut: 37.2, // the last lit window goes dark
	loopOn: DUR - 1.8, // the hook's camera move, on negative time
};

// ------------------------------------------------------------------ shot list
type Mode = 'dusk' | 'night' | 'day' | 'inDay' | 'inNight' | 'attic' | 'barn';
type Shot = {id: string; t: number; from: {p: V3; l: V3}; to?: {p: V3; l: V3}; fov?: number; roll?: number; mode: Mode; t0?: number};
// hook: low over the tracks, near the forest edge, looking along them to the door
const A = {from: {p: [-10.4, 1.45, 16.4] as V3, l: [-0.8, 0.9, 4.2] as V3}, to: {p: [-8.6, 1.4, 14.6] as V3, l: [-0.6, 0.95, 4.2] as V3}};
const SHOTS: Shot[] = [
	{id: 'A_tracks_hook', t: 0, t0: K.loopOn - DUR, mode: 'dusk', ...A, fov: 46},
	{id: 'B_threshold', t: 4.6, mode: 'dusk', from: {p: [1.6, 1.35, 7.9], l: [-0.3, 0.25, 4.9]}, to: {p: [1.4, 1.25, 7.4], l: [-0.3, 0.25, 4.9]}, fov: 48},
	{id: 'C_clearing', t: 7.0, mode: 'dusk', from: {p: [-30, 24, 38], l: [0, 1, 2]}, to: {p: [-27, 21, 34], l: [0, 1, 2]}, fov: 44},
	{id: 'C2_farm_front', t: 10.0, mode: 'dusk', from: {p: [-12.5, 2.6, 12.5], l: [-2, 3.0, 0]}, to: {p: [-11.6, 2.6, 11.4], l: [-2, 3.0, 0]}, fov: 48},
	{id: 'D_key_board', t: 12.8, mode: 'inDay', from: {p: [-2.75, 1.45, -0.32], l: [-1.09, 1.45, -0.3]}, to: {p: [-2.5, 1.45, -0.31], l: [-1.09, 1.45, -0.3]}, fov: 36},
	{id: 'E_newspaper', t: 15.2, mode: 'inDay', from: {p: [-3.3, 1.62, -1.35], l: [-3.4, 0.79, -1.72]}, to: {p: [-3.33, 1.52, -1.45], l: [-3.4, 0.79, -1.72]}, fov: 40},
	{id: 'F_ceiling', t: 18.4, mode: 'inNight', from: {p: [-4.9, 0.85, 0.9], l: [-3.2, 2.5, -1.9]}, to: {p: [-4.7, 0.85, 0.6], l: [-3.2, 2.55, -1.9]}, fov: 52},
	{id: 'G_attic_hatch', t: 23.4, mode: 'attic', from: {p: [-1.9, 3.12, -3.3], l: [0, 3.0, -1.5]}, to: {p: [-1.75, 3.1, -3.2], l: [0, 3.05, -1.5]}, fov: 50},
	{id: 'H_maid_room', t: 28.1, mode: 'inDay', from: {p: [1.35, 1.5, -0.4], l: [2.3, 0.8, -3.4]}, to: {p: [1.45, 1.45, -0.75], l: [2.3, 0.85, -3.4]}, fov: 54},
	{id: 'I_night_window', t: 33.9, mode: 'night', from: {p: [-8, 2.0, 16], l: [-3.2, 1.6, 4]}, to: {p: [-7.5, 2.0, 15], l: [-3.2, 1.6, 4]}, fov: 44},
	{id: 'J_smoke_day', t: 40.0, mode: 'day', from: {p: [-16, 4, 18], l: [-2, 6, 0]}, to: {p: [-15, 4, 17], l: [-2, 6.5, 0]}, fov: 50},
	{id: 'K_barn', t: 43.0, mode: 'barn', from: {p: [7.4, 2.55, 3.4], l: [6.6, 0.6, -3.3]}, to: {p: [7.3, 2.45, 3.0], l: [6.6, 0.6, -3.3]}, fov: 58},
	{id: 'L_hatch_open', t: 45.6, mode: 'inDay', from: {p: [0.05, 0.95, 0.75], l: [0, 2.8, -1.45]}, to: {p: [0.05, 1.15, 0.45], l: [0, 2.8, -1.45]}, fov: 50},
	{id: 'M_farm_snow', t: 49.2, mode: 'dusk', from: {p: [-18, 7.5, 22], l: [-1, 2, 2]}, to: {p: [-16.5, 7, 20], l: [-1, 2, 2]}, fov: 44},
	{id: 'N_hollow', t: 52.1, mode: 'attic', from: {p: [-2.0, 4.45, 0.35], l: [-3.45, 3.3, 1.9]}, to: {p: [-2.3, 4.25, 0.65], l: [-3.45, 3.3, 1.9]}, fov: 48},
	{id: 'A_loop', t: K.loopOn, t0: K.loopOn - DUR, mode: 'dusk', ...A, fov: 46},
];
const shotAt = (t: number) => {
	let i = 0;
	for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].t) i = k;
	const s = SHOTS[i];
	// the hook and its loop copy share one continuous move over [loopOn - DUR, 4.6]
	if (s.id.startsWith('A_')) {
		const u = t >= K.loopOn ? t - DUR : t;
		return {s, k: lin(u, K.loopOn - DUR, SHOTS[1].t), u};
	}
	const end = SHOTS[i + 1]?.t ?? DUR;
	return {s, k: ease(lin(t, s.t, end)), u: t};
};

// ------------------------------------------------------------------ the newspaper

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

const drawPaper = (g: CanvasRenderingContext2D) => {
	const W = 48, H = 64;
	const r = rng(12);
	g.fillStyle = '#d4ccb4';
	g.fillRect(0, 0, W, H);
	g.fillStyle = '#1a1814';
	g.font = 'bold 8px "DejaVu Serif", serif';
	g.textAlign = 'center';
	g.fillText('MÜNCHEN', W / 2, 10);
	g.fillRect(3, 12, W - 6, 1);
	g.font = '5px "DejaVu Sans Mono", monospace';
	g.fillText('MÄRZ 1922', W / 2, 18);
	for (let col = 0; col < 3; col++)
		for (let y = 22; y < H - 3; y += 2) {
			if (r() > 0.88) continue;
			g.fillStyle = r() > 0.5 ? '#3a362e' : '#5a544a';
			g.fillRect(3 + col * 14, y, 11 - Math.floor(r() * 4), 1);
		}
};

// ------------------------------------------------------------------ camera, sky, lights

const Cam: React.FC<{t: number}> = ({t}) => {
	const {camera} = useThree();
	const {s, k, u} = shotAt(t);
	const to = s.to ?? s.from;
	const p = mix3(s.from.p, to.p, k);
	const l = mix3(s.from.l, to.l, k);
	const b = s.mode === 'dusk' || s.mode === 'day' || s.mode === 'night' ? 0.01 : 0.004;
	camera.position.set(p[0] + Math.sin(u * 0.9) * b, p[1] + Math.sin(u * 1.3) * b, p[2]);
	const roll = s.roll ?? 0;
	camera.up.set(Math.sin(roll), Math.cos(roll), 0);
	camera.lookAt(...l);
	(camera as THREE.PerspectiveCamera).fov = s.fov ?? 50;
	(camera as THREE.PerspectiveCamera).far = 260;
	camera.updateProjectionMatrix();
	return null;
};

const SKY: Record<Mode, string> = {dusk: '#3a4660', night: '#0a0e18', day: '#8a909a', inDay: '#0c0c0e', inNight: '#020203', attic: '#020203', barn: '#0c0c0e'};
const Atmos: React.FC<{mode: Mode}> = ({mode}) => {
	const {scene} = useThree();
	const bg = new THREE.Color(SKY[mode]);
	if (!scene.fog) scene.fog = new THREE.Fog(bg, 10, 70);
	const f = scene.fog as THREE.Fog;
	f.color.copy(bg);
	const out = mode === 'dusk' || mode === 'night' || mode === 'day';
	f.near = out ? 14 : 5;
	f.far = out ? (mode === 'day' ? 90 : 75) : 22;
	scene.background = bg;
	return null;
};

// ------------------------------------------------------------------ the world at time t

const Puff: React.FC<{o: number; p: V3}> = ({o, p}) => {
	const m = useMemo(() => new THREE.MeshBasicMaterial({color: '#d8dce4', transparent: true, depthWrite: false}), []);
	m.opacity = o;
	return (
		<mesh position={p} material={m} scale={[1.4, 0.8, 1]}>
			<icosahedronGeometry args={[0.07, 1]} />
		</mesh>
	);
};

const Glint: React.FC<{on: boolean}> = ({on}) => {
	const mm = useM();
	void mm;
	if (!on) return null;
	// two points of light in the gap between two ceiling boards, above the table
	return (
		<group position={[-3.15, 2.68, -2.05]}>
			{[-0.05, 0.05].map((x) => (
				<mesh key={x} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
					<planeGeometry args={[0.04, 0.025]} />
					<meshBasicMaterial color="#e8e0b0" side={THREE.DoubleSide} />
				</mesh>
			))}
		</group>
	);
};

/** Dust sifting down between the ceiling boards as someone walks overhead. */
const Dust: React.FC<{t: number}> = ({t}) => {
	const pts = useMemo(() => {
		const r = rng(8);
		return new Array(60).fill(0).map(() => [-3.9 + r() * 1.2, -2.4 + r() * 1.0, r() * 1.4, r()] as const);
	}, []);
	const m = useMemo(() => new THREE.MeshBasicMaterial({color: '#e8c890', transparent: true, opacity: 0.8}), []);
	return (
		<group>
			{pts.map(([x, z, delay, k], i) => {
				const local = t - 19.2 - delay;
				if (local < 0 || local > 2.6) return null;
				return (
					<mesh key={i} position={[x, 2.68 - local * (0.5 + k * 0.4), z]} material={m}>
						<boxGeometry args={[0.012, 0.012, 0.012]} />
					</mesh>
				);
			})}
		</group>
	);
};

const World: React.FC<{t: number; paper: THREE.Texture}> = ({t, paper}) => {
	const {s, u} = shotAt(t);
	const mode = s.mode;
	const snowT = u; // continuous across the loop
	const lamp = 0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 5.3);
	const stubeLit = mode === 'night' ? 1 - sm(t, K.lightOut, K.lightOut + 0.12) : mode === 'dusk' ? (s.id === 'M_farm_snow' ? 0 : 0.85) : 0;
	const atticGlow = mode === 'dusk' && s.id !== 'M_farm_snow' ? 0.32 : 0;
	const hatchOpen = s.id === 'G_attic_hatch' ? sm(t, K.rise - 0.6, K.rise) * (1 - sm(t, 27.6, 28.0)) : s.id === 'L_hatch_open' || s.id === 'N_hollow' ? 1 : 0;
	// the farmer
	let farmer: {pose: Pose; pos: V3} | null = null;
	let lantern: V3 | null = null;
	if (s.id === 'F_ceiling') {
		const up = sm(t, 19.4, 20.4);
		farmer = {pose: {sit: true, yaw: Math.PI / 2, head: [sm(t, 21.4, 22.4, 0, 0.5), up * 0.7], armL: [0.6, -1.0], armR: [0.6, -1.0]}, pos: [-3.6, 0, -1.05]};
	}
	if (s.id === 'G_attic_hatch') {
		const base = sm(t, K.rise, K.rise + 1.1, 0.95, 1.3) - sm(t, K.down, K.down + 0.9, 0, 0.6);
		const look = Math.sin(Math.max(0, t - 25.0) * 1.3) * 1.0 * sm(t, 25.0, 25.4) * (1 - sm(t, 26.6, 26.9));
		farmer = {pose: {yaw: Math.PI, head: [look, 0.05], armR: [2.6, -0.2], armL: [0.6, -0.8]}, pos: [0.0, base, -1.6]};
		lantern = [-0.32, base + 1.86, -1.33];
	}
	const breath = s.id === 'G_attic_hatch' ? Math.sin(Math.PI * lin(t, K.breath, K.breath + 0.8)) : 0;
	const ambient = {dusk: 1.1, night: 0.45, day: 1.5, inDay: 0.9, inNight: 0.12, attic: 0.08, barn: 0.6}[mode];
	const ambCol = {dusk: '#7080a8', night: '#2a3450', day: '#a0a6b0', inDay: '#8088a0', inNight: '#3a3040', attic: '#303848', barn: '#8a8a90'}[mode];
	const out = mode === 'dusk' || mode === 'night' || mode === 'day';
	return (
		<>
			<Atmos mode={mode} />
			<ambientLight intensity={ambient} color={ambCol} />
			<hemisphereLight args={[mode === 'day' ? '#c0c4cc' : '#5a6890', '#d8dce4', out ? 0.5 : 0.08]} />
			{mode === 'dusk' && <directionalLight position={[60, 12, -40]} intensity={0.5} color="#c0a0b0" />}
			{mode === 'day' && <directionalLight position={[20, 40, 20]} intensity={0.6} color="#d0d4dc" />}
			{/* warm light from the Stube spilling out of the windows at dusk/night */}
			<pointLight position={[-3.5, 1.4, 5.0]} intensity={stubeLit * 3} distance={6} decay={1.4} color="#ffb060" />
			{/* daylight through the windows inside */}
			{(mode === 'inDay' || mode === 'barn') && <pointLight position={[-3.5, 1.6, 3.4]} intensity={4} distance={8} decay={1.2} color="#c8d0e0" />}
			{(mode === 'inDay' || mode === 'barn') && <pointLight position={[2.2, 1.6, -3.2]} intensity={2.5} distance={4} decay={1.2} color="#b8c4d8" />}
			{mode === 'barn' && <pointLight position={[6.0, 2.3, 0.5]} intensity={12} distance={10} decay={1.1} color="#c0c4cc" />}
			{/* the oil lamp over the table at night */}
			{mode === 'inNight' && <pointLight position={[-3.6, 1.95, -1.8]} intensity={lamp * (s.id === 'L_hatch_open' ? 0 : 6)} distance={7} decay={1.3} color="#ffb870" />}
			{s.id === 'L_hatch_open' && <pointLight position={[0.3, 2.2, 0.3]} intensity={10} distance={5} decay={1.1} color="#a8b0c4" />}
			{/* the lantern */}
			{lantern && <pointLight position={lantern} intensity={3.5 * lamp} distance={6} decay={1.3} color="#ffb060" />}
			{/* cold light from the attic gable window */}
			{mode === 'attic' && <pointLight position={[-5.5, 4.2, 0]} intensity={s.id === 'N_hollow' ? 7 : 1.2} distance={8} decay={1.1} color="#8090b0" />}
			{mode === 'attic' && s.id === 'N_hollow' && <pointLight position={[-3.3, 4.3, 1.5]} intensity={5} distance={3} decay={1.1} color="#8090b0" />}
			<Forest />
			<Farm st={{stubeLit, maidLit: 0, atticGlow, hatchOpen, smoke: mode === 'day' ? 1 : 0, t}} />
			<Interiors paper={paper} keys={0} lampSwing={mode === 'inNight' ? Math.sin(t * 1.6) * 0.04 : 0} />
			{(s.id === 'K_barn' || mode === 'day') && <Cattle t={t} />}
			{s.id === 'N_hollow' && <Hollow />}
			{farmer && <Human pose={farmer.pose} pos={farmer.pos} look={FARMER} />}
			{lantern && (
				<group position={lantern}>
					<mesh>
						<boxGeometry args={[0.08, 0.12, 0.08]} />
						<meshBasicMaterial color="#e8a050" />
					</mesh>
					<mesh position={[0, 0.12, 0]}>
						<boxGeometry args={[0.14, 0.04, 0.14]} />
						<meshLambertMaterial color="#2a2420" />
					</mesh>
				</group>
			)}
			{breath > 0 && <Puff o={breath * 0.16} p={[-1.45, 2.98, -2.8]} />}
			<Glint on={t >= K.glint && t < K.glint + 0.1} />
			{s.id === 'F_ceiling' && <Dust t={t} />}
			{out && <Snowfall centre={new THREE.Vector3(...(s.from.p as V3))} t={snowT} amount={mode === 'day' ? 0.6 : 1} />}
		</>
	);
};
void steps;

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

export const Episode03: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const pp = useCanvasTex(48, 64);
	drawPaper(pp.g);
	pp.t.needsUpdate = true;
	const {s} = shotAt(t);
	// a short hold of black after the window goes out
	const black = t >= 38.7 && t < 40.0;
	const damage = black ? 0 : (t >= K.lightOut && t < K.lightOut + 0.3) || (t >= K.glint && t < K.glint + 0.1) ? 0.5 : 0.05;
	const ca = 0.6 + damage * 2;
	void s;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="tape3" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			{!black && (
				<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'url(#tape3)'}}>
					<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.03, far: 260}} style={{imageRendering: 'pixelated'}}>
						<MatsProvider>
							<Cam t={t} />
							<World t={t} paper={pp.t} />
						</MatsProvider>
					</ThreeCanvas>
				</div>
			)}
			<Overlay t={t} damage={damage} captions={captions} />
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep03-snow-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
