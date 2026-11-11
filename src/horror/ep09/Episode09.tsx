// Episode 9: "The Lighthouse That Went Dark" (true: the Flannan Isles, December 1900). About
// 54 s portrait short, pixelated low-poly 3D (180x320 rendered, 6x nearest upscale), PS1
// shaders, a tape layer that tears on every scare, wind-driven rain in the storm shots.
// Viral standard: second-person hook on frame 0 (from the relief boat, the dark tower: "You
// row toward a lighthouse that should be lit. It has been dark for eleven days."); a seamless
// loop (the last 1.6 s are the hook's own approach on negative time); hidden rewatch details
// (the cold grey ash in the range; three hooks, one set of oilskins; the calendar crossed off
// to the 15th; three mugs, three chairs pushed in; two frames of a lantern far down the path
// in the last shot); an open question (what did he see from the doorway?).
// Victim care: three real men. Nothing violent is shown: the wave fills the frame and the next
// shot is the empty landing in the morning. The keepers are never named and never shown
// harmed. The dramatic "logbook entries", the overturned chair and the uneaten meal of later
// retellings are not used.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep09-lighthouse-v1-timeline.json';
import {rng} from '../ps1';
import {Human} from '../ep01/world';
import {Island, KitchenInterior, MatsProvider, QUARTERS, RowingBoat, Sea, seaHeight, Steamer, TOP, WEST_RAIL} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep09Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => x * x * (3 - 2 * x);
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const sm = (t: number, a: number, b: number, v0 = 0, v1 = 1) => v0 + (v1 - v0) * ease(lin(t, a, b));
type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));

// key times (scripts/ep09_sound.py reads the same numbers)
export const K = {
	door: 20.2, // the dark doorway (small stinger in silence)
	rail: 31.1, // the west landing (stinger in silence)
	run: 40.4, // the third man runs out of the door
	wave: 43.6, // the wave rises
	morning: 46.2, // the empty landing the next day
	doorway: 48.1, // the doorway POV (stinger in silence)
	sub: 51.0, // hidden: two frames of a lantern far down the path
	loopOn: DUR - 1.6,
};
export const STINGERS = [K.door, K.rail, K.doorway];

// ------------------------------------------------------------------ shot list
type Mode = 'grey' | 'night' | 'storm' | 'inside' | 'insideNight';
type Shot = {id: string; t: number; from: {p: V3; l: V3}; to?: {p: V3; l: V3}; fov?: number; mode: Mode; boat?: boolean};
const Q = QUARTERS;
const DOOR: V3 = [Q[0] - 2.8, TOP + 1.2, Q[2]];
const A = {from: {p: [300, 2.1, 40] as V3, l: [0, 58, 6] as V3}, to: {p: [282, 2.1, 37] as V3, l: [0, 60, 6] as V3}};
const SHOTS: Shot[] = [
	{id: 'A_hook', t: 0, mode: 'grey', ...A, fov: 30, boat: true},
	{id: 'B_night', t: L.l01.end, mode: 'night', from: {p: [205, 5, -150], l: [0, 45, 6]}, to: {p: [203, 5, -148], l: [0, 47, 6]}, fov: 38},
	{id: 'C_storm', t: L.l02.end, mode: 'storm', from: {p: [230, 7, 50], l: [204, 4, 30]}, to: {p: [226, 7, 48], l: [204, 4, 30]}, fov: 54},
	{id: 'D_landing', t: L.l03.end, mode: 'grey', from: {p: [125, 3, 16], l: [55, 40, 12]}, to: {p: [118, 3.2, 15], l: [55, 42, 12]}, fov: 42},
	{id: 'E_door', t: L.l04.end, mode: 'grey', from: {p: [DOOR[0] - 9, TOP + 2.8, Q[2] + 1.5], l: [DOOR[0], TOP + 2.2, Q[2]]}, to: {p: [DOOR[0] - 3.5, TOP + 2.7, Q[2] + 0.5], l: [DOOR[0], TOP + 2.3, Q[2]]}, fov: 52},
	{id: 'E_clock', t: 21.0, mode: 'inside', from: {p: [Q[0] + 0.5, TOP + 3.3, Q[2] - 2.05], l: [Q[0] + 0.5, TOP + 3.3, Q[2] - 2.9]}, to: {p: [Q[0] + 0.5, TOP + 3.3, Q[2] - 2.25], l: [Q[0] + 0.5, TOP + 3.3, Q[2] - 2.9]}, fov: 44},
	{id: 'F_hooks', t: L.l05.end, mode: 'inside', from: {p: [Q[0] - 1.2, TOP + 2.9, Q[2] - 0.2], l: [Q[0] - 2.8, TOP + 2.5, Q[2] - 1.15]}, to: {p: [Q[0] - 1.5, TOP + 2.85, Q[2] - 0.4], l: [Q[0] - 2.8, TOP + 2.5, Q[2] - 1.15]}, fov: 50},
	{id: 'G_kitchen', t: L.l06.end, mode: 'inside', from: {p: [Q[0] + 3.3, TOP + 3.0, Q[2] + 2.3], l: [Q[0] - 1.0, TOP + 1.9, Q[2] - 0.6]}, to: {p: [Q[0] + 3.5, TOP + 3.2, Q[2] + 2.5], l: [Q[0] - 1.0, TOP + 1.9, Q[2] - 0.6]}, fov: 62},
	{id: 'H_rail', t: K.rail, mode: 'grey', from: {p: [WEST_RAIL[0] + 2.0, WEST_RAIL[1] + 3.2, WEST_RAIL[2] + 4.5], l: [WEST_RAIL[0] - 1.8, WEST_RAIL[1] + 0.4, WEST_RAIL[2]]}, to: {p: [WEST_RAIL[0] + 1.5, WEST_RAIL[1] + 3.8, WEST_RAIL[2] + 4.0], l: [WEST_RAIL[0] - 14, 0, WEST_RAIL[2] - 2]}, fov: 56},
	{id: 'I_lanterns', t: L.l08.end, mode: 'storm', from: {p: [-100, 30, -40], l: [-66, 36, -8]}, to: {p: [-98, 30, -39], l: [-66, 33, -8]}, fov: 44},
	{id: 'I_run', t: K.run, mode: 'insideNight', from: {p: [Q[0] + 2.8, TOP + 2.9, Q[2] + 0.6], l: [DOOR[0], TOP + 2.3, Q[2]]}, to: {p: [Q[0] + 2.4, TOP + 2.85, Q[2] + 0.5], l: [DOOR[0], TOP + 2.3, Q[2]]}, fov: 54},
	{id: 'J_wave', t: K.wave, mode: 'storm', from: {p: [-130, 14, -46], l: [-66, 30, -6]}, to: {p: [-128, 14, -45], l: [-66, 36, -6]}, fov: 48},
	{id: 'J_morning', t: K.morning, mode: 'grey', from: {p: [-130, 14, -46], l: [-66, 30, -6]}, to: {p: [-129, 14, -45.5], l: [-66, 30, -6]}, fov: 48},
	{id: 'K_doorway', t: K.doorway, mode: 'insideNight', from: {p: [Q[0] + 2.2, TOP + 2.8, Q[2] + 0.1], l: [-40, TOP + 1.6, Q[2] - 0.5]}, to: {p: [Q[0] - 0.6, TOP + 2.75, Q[2]], l: [-40, TOP + 1.4, Q[2] - 0.5]}, fov: 54},
	{id: 'A_loop', t: K.loopOn, mode: 'grey', ...A, fov: 30, boat: true},
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
const STORM: Record<Mode, number> = {grey: 0.9, night: 0.6, storm: 2.2, inside: 0.9, insideNight: 2.2};
/** The boat (and the camera in it) ride the swell. */
const boatAt = (u: number, x: number, z: number) => {
	const h = seaHeight(x, z, u, 0.9);
	const pitch = (seaHeight(x + 2, z, u, 0.9) - seaHeight(x - 2, z, u, 0.9)) * 0.12;
	const roll = (seaHeight(x, z + 1, u, 0.9) - seaHeight(x, z - 1, u, 0.9)) * 0.1;
	return {h, pitch, roll};
};
const camPose = (t: number) => {
	const {s, k, u} = shotAt(t);
	const to = s.to ?? s.from;
	const p = mix3(s.from.p, to.p, k);
	const l = mix3(s.from.l, to.l, k);
	if (s.boat) {
		const b = boatAt(u, p[0], p[2]);
		p[1] += b.h;
		l[1] += b.pitch * 60;
	}
	if (s.id === 'C_storm') p[1] += seaHeight(p[0], p[2], t, 1.6) * 0.6;
	const shake = STINGERS.reduce((a, kt) => a + (t >= kt && t < kt + 0.3 ? Math.sin((t - kt) * 55) * 0.05 * (1 - (t - kt) / 0.3) : 0), 0);
	p[1] += shake + Math.sin(u * 1.1) * (s.mode.startsWith('inside') ? 0.004 : 0.03);
	return {s, k, u, p, l};
};

// ------------------------------------------------------------------ textures: the stopped clock, the calendar

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

const drawClock = (g: CanvasRenderingContext2D) => {
	g.fillStyle = '#2a1a10';
	g.fillRect(0, 0, 32, 32);
	g.fillStyle = '#e4dcc4';
	g.beginPath();
	g.arc(16, 16, 14, 0, Math.PI * 2);
	g.fill();
	g.fillStyle = '#2a2018';
	for (let i = 0; i < 12; i++) {
		const a = (i / 12) * Math.PI * 2;
		g.fillRect(Math.round(16 + Math.sin(a) * 12), Math.round(16 - Math.cos(a) * 12), 1, 1);
	}
	// stopped: the hands never move (no time is claimed)
	const hand = (a: number, len: number, w: number) => {
		g.strokeStyle = '#1a1410';
		g.lineWidth = w;
		g.beginPath();
		g.moveTo(16, 16);
		g.lineTo(16 + Math.sin(a) * len, 16 - Math.cos(a) * len);
		g.stroke();
	};
	hand(-2.3, 7, 2);
	hand(2.6, 11, 1.5);
};

/** December 1900 (the 1st was a Saturday), crossed off up to the 15th. Dramatisation. */
const drawCalendar = (g: CanvasRenderingContext2D) => {
	const W = 36, H = 48;
	g.fillStyle = '#e0dccc';
	g.fillRect(0, 0, W, H);
	g.fillStyle = '#7a1a14';
	g.fillRect(0, 0, W, 9);
	g.fillStyle = '#f0ece0';
	g.font = `bold 5px ${MONO}`;
	g.textAlign = 'center';
	g.fillText('DEC 1900', W / 2, 7);
	for (let d = 1; d <= 31; d++) {
		const i = d + 5; // Saturday column
		const x = 2 + (i % 7) * 4.6, y = 12 + Math.floor(i / 7) * 6;
		g.fillStyle = '#3a3a3a';
		g.fillRect(x, y, 3, 3);
		if (d <= 15) {
			g.strokeStyle = '#2a2a5a';
			g.beginPath();
			g.moveTo(x - 0.5, y - 0.5);
			g.lineTo(x + 3.5, y + 3.5);
			g.stroke();
		}
	}
};

// ------------------------------------------------------------------ camera and atmosphere

const Cam: React.FC<{t: number}> = ({t}) => {
	const {camera} = useThree();
	const {s, p, l} = camPose(t);
	camera.position.set(...p);
	camera.up.set(0, 1, 0);
	camera.lookAt(...l);
	(camera as THREE.PerspectiveCamera).fov = s.fov ?? 50;
	(camera as THREE.PerspectiveCamera).far = 4000;
	camera.updateProjectionMatrix();
	return null;
};

const FOG: Record<Mode, [string, number, number]> = {grey: ['#6e767c', 40, 520], night: ['#1a2232', 30, 520], storm: ['#2a323c', 14, 260], inside: ['#2a2c2e', 6, 60], insideNight: ['#0e1216', 4, 80]};
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

const KEEPER_OIL = {skin: '#b08a70', hair: '#2a2420', top: '#b89020', legs: '#2a2a28'};
const KEEPER_SHIRT = {skin: '#b8907a', hair: '#3a2a20', top: '#c8c4b8', legs: '#2a2a2e'};

// ------------------------------------------------------------------ the world at time t

const World: React.FC<{t: number; clock: THREE.Texture; calendar: THREE.Texture}> = ({t, clock, calendar}) => {
	const {s, u, p} = camPose(t);
	const mode = s.mode;
	const storm = STORM[mode];
	const flash = mode === 'storm' || mode === 'insideNight' ? [38.6, 42.3, 44.9, 49.6].reduce((a, ft) => Math.max(a, t >= ft && t < ft + 0.12 ? 1 : 0), 0) : 0;
	const waveRise = s.id === 'J_wave' ? sm(t, K.wave, 46.1) : 0;
	const waveMat = useMemo(() => new THREE.MeshBasicMaterial({color: '#c8d4d8', transparent: true, opacity: 0.92}), []);
	const lampMat = useMemo(() => new THREE.MeshBasicMaterial({color: '#ffc060'}), []);
	const boat = boatAt(u, (s.from.p[0] + (s.to ?? s.from).p[0]) / 2, 25);
	const inside = mode === 'inside' || mode === 'insideNight';
	// the two lanterns going down the west landing steps
	const down = lin(t, L.l08.end, K.run, 0, 1);
	return (
		<>
			<Atmos mode={mode} />
			{mode === 'grey' && (
				<>
					<ambientLight intensity={1.15} color="#9aa0a8" />
					<directionalLight position={[80, 120, 40]} intensity={0.55} color="#c8ccd0" />
				</>
			)}
			{mode === 'night' && (
				<>
					<ambientLight intensity={1.0} color="#4a5a74" />
					<directionalLight position={[-60, 80, -40]} intensity={0.25} color="#6a7a9a" />
				</>
			)}
			{mode === 'storm' && (
				<>
					<ambientLight intensity={1.0 + flash * 2.5} color="#5a6478" />
					<directionalLight position={[-60, 80, 40]} intensity={0.3 + flash * 2} color="#a0b0c8" />
				</>
			)}
			{mode === 'inside' && (
				<>
					<ambientLight intensity={0.55} color="#7a7c80" />
					<pointLight position={[DOOR[0] + 0.3, TOP + 3.0, Q[2]]} intensity={2.6} distance={8} decay={1.1} color="#c8d0d8" />
				</>
			)}
			{mode === 'insideNight' && (
				<>
					<ambientLight intensity={0.3 + flash * 1.5} color="#3a3c44" />
					<pointLight position={[Q[0] + 0.2, TOP + 2.4, Q[2]]} intensity={s.id === 'K_doorway' ? 1.4 : 2.0} distance={6} decay={1.2} color="#ffb060" />
					<pointLight position={[DOOR[0] - 1.5, TOP + 3, Q[2]]} intensity={1.6 + flash * 4} distance={14} decay={1.0} color="#a0b0c8" />
				</>
			)}
			<MatsProvider>
				{!inside || s.id === 'K_doorway' || s.id === 'I_run' ? <Sea t={t} storm={storm} centre={[Math.round(p[0] / 30) * 30, Math.round(p[2] / 30) * 30]} /> : null}
				<Island railings={t < K.rail && s.id !== 'A_loop' && s.id !== 'A_hook' ? 'whole' : 'torn'} />
				<KitchenInterior clock={clock} calendar={calendar} oilskins={s.id === 'I_run' && t < K.run + 0.6 ? 2 : 1} />
				{/* the rowing boat under the camera in the hook */}
				{s.boat && <RowingBoat p={[p[0] - 4.2, boat.h - 0.9, p[2] - 0.3]} ry={Math.PI + 0.12} pitch={boat.pitch * 0.4} roll={boat.roll * 0.4} />}
				{/* the steamer passing in the night: lit portholes, the tower dark behind */}
				{s.id === 'B_night' && <Steamer p={[178 - (t - L.l01.end) * 3.2, 0.4, -112]} ry={Math.PI + 0.35} pitch={Math.sin(t * 0.7) * 0.02} roll={Math.sin(t * 0.9) * 0.03} lit />}
				{/* the tender in the storm, pitching hard */}
				{s.id === 'C_storm' && <Steamer p={[204, seaHeight(204, 30, t, 2.2) * 0.8, 30]} ry={2.6} pitch={Math.sin(t * 1.3) * 0.16} roll={Math.sin(t * 0.9 + 1) * 0.12} tender len={32} />}
				{/* the tender lying off the east landing on the 26th */}
				{s.id === 'D_landing' && <Steamer p={[150, 0.4, -40]} ry={2.2} pitch={0} roll={Math.sin(t) * 0.02} tender len={32} />}
				{/* the reconstruction: two men in oilskins going down to the west landing with lanterns */}
				{s.id === 'I_lanterns' &&
					[0, 1].map((i) => {
						const k = Math.max(0, down - i * 0.12);
						const pos: V3 = [-60 - k * 5, TOP + 1 - k * 17.5, -8 + (i ? 1.2 : 0)];
						return (
							<group key={i}>
								<Human pose={{yaw: Math.PI, step: t * 6 + i, armR: [0.6, -0.2]}} pos={pos} look={KEEPER_OIL} />
								<mesh position={[pos[0] - 0.4, pos[1] + 0.9, pos[2] - 0.3]} material={lampMat}>
									<boxGeometry args={[0.25, 0.3, 0.25]} />
								</mesh>
								<pointLight position={[pos[0] - 0.4, pos[1] + 1.0, pos[2] - 0.3]} intensity={2.2} distance={6} decay={1.2} color="#ffb050" />
							</group>
						);
					})}
				{/* the third man runs out without his coat */}
				{s.id === 'I_run' && t >= K.run && <Human pose={{yaw: Math.PI, step: t * 9, armL: [0.9, -0.6], armR: [-0.4, -0.3]}} pos={[Q[0] + 1.2 - sm(t, K.run, K.run + 1.6, 0, 5.4), TOP + 1.2, Q[2] + 0.1]} look={KEEPER_SHIRT} />}
				{/* the wave */}
				{waveRise > 0 && (
					<mesh position={[-78 + waveRise * 8, -10 + waveRise * 32, -6]} material={waveMat} scale={[10 + waveRise * 8, 20 + waveRise * 30, 46]}>
						<boxGeometry args={[1, 1, 1]} />
					</mesh>
				)}
				{s.id === 'J_wave' &&
					t < 45.6 &&
					[0, 1].map((i) => <pointLight key={i} position={[-66 - i, 34 + i, -6 + i]} intensity={3 * (1 - waveRise)} distance={8} color="#ffb050" />)}
				{/* hidden: two frames of a lantern far down the path */}
				{t >= K.sub && t < K.sub + 0.067 && (
					<>
						<mesh position={[-34, TOP + 2.0, Q[2] - 0.5]} material={lampMat}>
							<boxGeometry args={[0.4, 0.5, 0.4]} />
						</mesh>
						<pointLight position={[-34, TOP + 2.2, Q[2] - 0.5]} intensity={4} distance={10} color="#ffb050" />
					</>
				)}
			</MatsProvider>
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: captions, tape, rain

const Overlay: React.FC<{t: number; damage: number; captions: boolean; rain: number}> = ({t, damage, captions, rain}) => {
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
		// wind-driven rain: short slanted streaks
		if (rain > 0) {
			const rr = rng(Math.floor(t * 30) * 31 + 9);
			n.strokeStyle = `rgba(200,210,220,${0.35 * rain})`;
			n.lineWidth = 1;
			n.beginPath();
			for (let i = 0; i < 70 * rain; i++) {
				const x = rr() * (LW + 40) - 20, y = rr() * LH;
				n.moveTo(x, y);
				n.lineTo(x - 4, y + 9);
			}
			n.stroke();
		}
	}, [t, damage, captions, rain]);
	return (
		<>
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};


const darkGrade = (t: number) => (t < K.rail ? 0.08 : t < K.morning ? sm(t, K.rail, 40, 0.15, 0.35) : t < K.doorway ? 0.1 : sm(t, K.doorway, K.loopOn, 0.35, 0.08));

// ------------------------------------------------------------------ assembly

export const Episode09: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const clock = useCanvasTex(32, 32);
	const cal = useCanvasTex(36, 48);
	drawClock(clock.g);
	clock.t.needsUpdate = true;
	drawCalendar(cal.g);
	cal.t.needsUpdate = true;
	const {s} = shotAt(t);
	const hit = STINGERS.reduce((a, kt) => Math.max(a, t >= kt && t < kt + 0.4 ? 1 - (t - kt) / 0.4 : 0), 0);
	const sub = t >= K.sub && t < K.sub + 0.067 ? 1 : 0;
	const damage = 0.06 + hit * 0.7 + sub * 0.5;
	const ca = 0.6 + damage * 3;
	const shift = hit > 0.5 ? Math.round(Math.sin(t * 90) * 3) : 0;
	const rain = s.mode === 'storm' ? 1 : s.id === 'K_doorway' ? 0.8 : s.id === 'C_storm' ? 1 : 0;
	const red = darkGrade(t);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="tape9" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: shift, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'url(#tape9)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.05, far: 4000}} style={{imageRendering: 'pixelated'}}>
					<Cam t={t} />
					<World t={t} clock={clock.t} calendar={cal.t} />
				</ThreeCanvas>
			</div>
			<AbsoluteFill style={{background: `rgba(120,24,18,${red})`, mixBlendMode: 'multiply'}} />
			<Overlay t={t} damage={damage} captions={captions} rain={rain} />
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.8) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep09-lighthouse-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
