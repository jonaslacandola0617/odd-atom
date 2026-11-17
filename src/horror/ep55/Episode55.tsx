// Episode 55: "The Lift" (Season 6: a taxi driver's night on a hill road in Himachal, India; retold in our own
// words from a driver's account shared online and from churel/chudail folklore; no real road, shrine or person).
// English, Jack. The PSX models; hard cuts only; a score of its own; a seamless loop (the last shot is the first).
// Form: "a dashcam": a three-channel taxi dashcam (CH1 front, CH2 cabin, CH3 rear), fisheye, with its speed
// readout, date stamp and REC; the footage is what he watched afterwards (a PLAYBACK ×4 zoom on her feet).
// Mechanism: pursuit. It gains, whatever the speed. Gore: the bones of her shins through the skin, blood across
// the windscreen. Cast: her, Character_Monster_05 (shawl, ankle bells, feet turned back); me, Character_30.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep55-lift-v1-timeline.json';
import {rng} from '../ps1';
import {bendX, CAR, Driver, Her, HerState, MatsProvider, Road, ROAD, Taxi, V3} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep55Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep55_sound.py reads the same rules)
const HIT = L.l04.end + 0.12;
const ACC = 4.58; // m/s² from a standstill: she is 8 m ahead, the bumper 2.1 m in front of me
export const K = {
	cutFront: L.l01.end + 0.6, // the front dashcam: the road down
	slow: L.l02.start + 1.4, // she is on the bend, waving; I slow
	stop: L.l02.end + 1.0,
	walk0: L.l02.end + 1.4, // she walks out into my headlights
	walk1: L.l03.end - 1.6,
	cutZoom: L.l03.start - 0.5, // PLAYBACK ×4 on her feet (before the line says it)
	cutFront2: L.l03.end + 0.3,
	go: HIT - Math.sqrt((2 * (8.0 - 2.1)) / 4.58), // I put my foot down
	hit: HIT, // the impact (stinger)
	cutRear: HIT + 0.9, // the rear camera: she is on the road behind
	stopRear: HIT + 1.2,
	rise0: L.l05.start + 0.4,
	rise1: L.l05.start + 3.8,
	run: L.l05.end - 0.9, // "And she runs"
	cutCabin: L.l05.end + 0.7,
	ramp: L.l06.start, // sixty, seventy, eighty
	window: L.l06.start + 2.6, // her face at the passenger window
	look: L.l06.start + 3.1, // I look left
	slam: L.l06.end + 0.15, // her palm and face hit the glass (stinger)
	cutDawn: L.l06.end + 1.2,
	cutSeat: L.l07.end + 0.8, // the cabin camera, played back at dawn
	tap: L.l08.start + 1.2, // the nails tap on my seat
	lean: L.l08.end + 0.25, // her face comes out from behind my seat (stinger)
	loopShot: DUR - 1.6,
};
const DEBUG = false;
export const STINGERS = [K.hit, K.slam, K.lean];

type Shot = 'rear' | 'front' | 'zoom' | 'cabin' | 'dawn' | 'seat';
const CUTS: [number, Shot][] = [
	[K.cutFront, 'rear'],
	[K.cutZoom, 'front'],
	[K.cutFront2, 'zoom'],
	[K.cutRear, 'front'],
	[K.cutCabin, 'rear'],
	[K.cutDawn, 'cabin'],
	[K.cutSeat, 'dawn'],
	[K.loopShot, 'seat'],
];
const shotOf = (t: number): Shot => (t < 0 ? 'rear' : CUTS.find(([c]) => t < c)?.[1] ?? 'rear');
const channel = (s: Shot) => (s === 'rear' ? 'CH3 REAR' : s === 'cabin' || s === 'seat' ? 'CH2 CABIN' : 'CH1 FRONT');

// ------------------------------------------------------------------ the taxi's speed and the road it covers
/** km/h */
export const speed = (t: number): number => {
	if (t < K.cutFront) return 55;
	if (t < K.slow) return 42;
	if (t < K.stop) return 42 * (1 - ease(lin(t, K.slow, K.stop)));
	if (t < K.go) return 0;
	if (t < K.hit) return ACC * (t - K.go) * 3.6;
	if (t < K.stopRear) return ACC * (K.hit - K.go) * 3.6 * (1 - lin(t, K.hit, K.stopRear));
	if (t < K.run + 0.2) return 0;
	if (t < K.ramp) return 55 * lin(t, K.run + 0.2, K.ramp);
	if (t < K.cutDawn) return 55 + 25 * ease(lin(t, K.ramp, K.ramp + 2.4));
	if (t < K.cutSeat) return 38;
	return 32;
};
const T0 = -4, DT = 1 / 120;
const S_TABLE = (() => {
	const n = Math.ceil((DUR + 2 - T0) / DT);
	const a = new Float64Array(n + 1);
	for (let i = 1; i <= n; i++) a[i] = a[i - 1] + (speed(T0 + (i - 0.5) * DT) / 3.6) * DT;
	return a;
})();
const dist = (t: number) => {
	const x = (t - T0) / DT;
	const i = Math.max(0, Math.min(S_TABLE.length - 2, Math.floor(x)));
	return S_TABLE[i] + (S_TABLE[i + 1] - S_TABLE[i]) * (x - i);
};
// the bend of the road at each moment (slowly winding)
const bend = (t: number) => 0.0035 * Math.sin((t + 600) * 0.23) + 0.0015 * Math.sin((t + 600) * 0.61);

// ------------------------------------------------------------------ where she is (car-relative)
const STAND_Z = -8.7; // when I stop, she is 20 m ahead, on the verge
const HIT_Z = -8.0; // where she stands in the road
const her = (t: number, shot: Shot): {p: V3; ry: number; state: HerState; gore: number; eyes?: boolean; reach?: V3; look?: V3} | null => {
	const c = bend(t);
	const at = (x: number, z: number): V3 => [x + bendX(z, c), 0, z];
	switch (shot) {
		case 'rear': {
			if (t < K.cutFront) {
				// the hook (and the loop): on all fours behind the car, gaining
				const z = 5.5 - 0.27 * t;
				return {p: at(-0.25 + 0.15 * Math.sin(t * 1.3), z), ry: Math.PI, state: {mode: 'run', phase: (t + 600) * 13}, gore: 1, eyes: true};
			}
			// after the hit: she lies on the road behind, rises, and runs
			const zLand = 5.3 - (dist(K.stopRear) - dist(t));
			if (t < K.rise0) return {p: at(-0.1, zLand), ry: Math.PI, state: {mode: 'lie'}, gore: 1};
			if (t < K.run) {
				const k = ease(lin(t, K.rise0, K.rise1));
				return {p: at(-0.1, zLand), ry: Math.PI, state: {mode: 'rise', k}, gore: 1, eyes: k > 0.9};
			}
			const z = Math.max(3.4, zLand - 9.5 * (t - K.run) + (dist(t) - dist(K.run)) * 0);
			return {p: at(-0.1, z), ry: Math.PI, state: {mode: 'run', phase: (t + 600) * 13}, gore: 1, eyes: true};
		}
		case 'front':
		case 'zoom': {
			if (t < K.stop + 0.01 || t < K.walk0) {
				const z = STAND_Z - (dist(K.stop) - dist(t));
				return {p: at(ROAD.x0 + 0.25, z), ry: 0, state: {mode: 'stand', wave: ease(lin(t, K.cutFront + 0.5, K.cutFront + 1.3)) * (1 - ease(lin(t, K.stop - 0.6, K.stop + 0.2)))}, gore: 0};
			}
			if (t < K.walk1) {
				const k = lin(t, K.walk0, K.walk1);
				return {p: at(ROAD.x0 + 0.25 + (-0.1 - ROAD.x0 - 0.25) * ease(k), STAND_Z + (HIT_Z - STAND_Z) * k), ry: 1.25 * (1 - ease(lin(k, 0.8, 1))), state: {mode: 'stand', walk: (t - K.walk0) * 3.6}, gore: 0};
			}
			if (t < K.hit) {
				const z = HIT_Z + (dist(t) - dist(K.go));
				return {p: at(-0.1, z), ry: 0, state: {mode: 'stand', look: ease(lin(t, K.walk1 + 0.6, K.go))}, gore: 0};
			}
			return null;
		}
		case 'cabin': {
			// alongside the passenger door, gaining from behind until her face is at the glass
			const z = 3.6 - 2.55 * ease(lin(t, K.window - 1.6, K.window));
			const press = ease(lin(t, K.slam - 0.12, K.slam));
			return {p: [-1.25 + 0.1 * press, 0.0, z], ry: Math.PI, state: {mode: 'window', press}, gore: 1, eyes: true, look: [1, 0, -0.25]};
		}
		case 'seat':
			return {p: [0.56, -0.3, 0.8], ry: Math.PI, state: {mode: 'seat', lean: ease(lin(t, K.lean - 0.1, K.lean + 0.35)), tap: t}, gore: 0, reach: [0.25, 1.19, 0.1], eyes: t > K.lean};
		default:
			return null;
	}
};

// ------------------------------------------------------------------ cameras
type CamPose = {p: V3; l: V3; fov: number; roll?: number};
const Cam: React.FC<{get: () => CamPose}> = ({get}) => {
	const {camera} = useThree();
	const aim = (pose: CamPose) => {
		camera.position.set(...pose.p);
		camera.up.set(Math.sin(pose.roll ?? 0), Math.cos(pose.roll ?? 0), 0);
		camera.lookAt(...pose.l);
		const c = camera as THREE.PerspectiveCamera;
		c.fov = pose.fov;
		c.near = 0.03;
		c.far = 200;
		c.updateProjectionMatrix();
	};
	useFrame(() => aim(get()));
	aim(get());
	return null;
};
// the car's ride: road shake that grows with speed, and the jolt of the impact
const shake = (t: number): V3 => {
	const v = speed(t) / 80;
	const r = rng(Math.floor((t + 600) * 30) * 7919 + 55);
	const j = Math.max(0, 1 - Math.abs(t - K.hit) / 0.25) * (t >= K.hit ? 1 : 0);
	return [(r() - 0.5) * 0.012 * v + j * 0.05 * (r() - 0.5), (r() - 0.5) * 0.018 * v - j * 0.06, 0];
};
const camPose = (t: number, shot: Shot): CamPose => {
	const k = shake(t);
	if ((globalThis as any).DBG !== undefined || DEBUG) return shot === 'front' ? {p: [0.6, 1.4, -4.5], l: [-0.1, 0.9, -8], fov: 40} : {p: [-2.6, 1.5, 0.6], l: [-1.0, 1.1, 0.5], fov: 50};
	switch (shot) {
		case 'rear':
			return {p: [k[0], 1.32 + k[1], 1.85], l: [0, 0.35, 10], fov: 84};
		case 'zoom': {
			// the playback, zoomed ×4 on her feet as she walks into the light
			const h = her(t, 'zoom');
			const f = h ? h.p : ([0, 0, -14] as V3);
			return {p: [0, 1.3, -1.15], l: [f[0], 0.3, f[2]], fov: 7};
		}
		case 'front':
		case 'dawn':
			return {p: [k[0], 1.3 + k[1], -1.15], l: [0, 0.95 + k[1], -14], fov: 90};
		case 'cabin':
		case 'seat':
			return shot === 'seat'
				? {p: [k[0] * 0.5, 1.36 + k[1] * 0.5, -1.02], l: [0.26, 1.1, 0.4], fov: 66}
				: {p: [k[0] * 0.5, 1.36 + k[1] * 0.5, -1.02], l: [-0.8, 1.08, 1.2], fov: 88};
	}
};

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotOf(t);
	const s = dist(t);
	const c = bend(t);
	const h = her(t, shot);
	const dawn = shot === 'dawn' || shot === 'seat';
	const show = h && !(shot === 'front' && t >= K.hit);
	const fog = dawn ? '#6c7484' : '#040508';
	return (
		<>
			<Cam get={() => camPose(t, shot)} />
			<color attach="background" args={[dawn ? '#5a6274' : '#03040a']} />
			<fog attach="fog" args={[fog, dawn ? 6 : 10, dawn ? 70 : 60]} />
			{dawn ? (
				<>
					<ambientLight intensity={shot === 'seat' ? 2.4 : 1.5} color="#9aa2b4" />
					<directionalLight position={[-20, 15, -30]} intensity={0.6} color="#d8c8b0" />
					{shot === 'seat' && <pointLight position={[0.0, 1.4, -0.3]} intensity={2.6} distance={1.6} decay={1} color="#d8dce8" />}
				</>
			) : shot === 'rear' ? (
				<>
					<ambientLight intensity={1.1} color="#2c2c40" />
					{/* the tail lights: everything behind the car is red */}
					<pointLight position={[0, 0.8, 2.3]} intensity={6} distance={10} decay={1} color="#ff3020" />
					<pointLight position={[0, 0.8, 8.5]} intensity={3.5} distance={10} decay={1} color="#ff2814" />
				</>
			) : shot === 'cabin' ? (
				<>
					{/* the cabin channel sees by its own infrared lamp: bright close to the lens, falling off fast */}
					<ambientLight intensity={0.45} color="#ffffff" />
					<pointLight position={[0, 1.0, -0.8]} intensity={3.2} distance={3.4} decay={1.3} color="#ffffff" />
					{/* the lamp's light reaches just past the glass on her side */}
					<pointLight position={[-0.75, 1.3, 0.55]} intensity={3.5} distance={1.4} decay={1} color="#ffffff" />
				</>
			) : (
				<>
					<ambientLight intensity={1.2} color="#283048" />
					{/* the halogen headlights: a hot pool close in, a long throw down the road */}
					<pointLight position={[0, 0.7, -5.5]} intensity={7} distance={9} decay={1} color="#ffe2a8" />
					<pointLight position={[0.3, 0.9, -13]} intensity={6} distance={14} decay={1} color="#ffd890" />
					<pointLight position={[0.5, 1.2, -24]} intensity={3} distance={14} decay={1} color="#ffd080" />
				</>
			)}
			<Road s={s} c={c} dawn={dawn ? 1 : 0} />
			<Taxi view={(globalThis as any).NOCAB && shot === 'cabin' ? 'front' : shot === 'rear' ? 'rear' : shot === 'cabin' || shot === 'seat' ? 'cabin' : 'front'} dent={t > K.hit ? 1 : 0} />
			{(shot === 'cabin' || shot === 'seat') && <Driver look={shot === 'cabin' ? ease(lin(t, K.look, K.look + 0.4)) : 0} />}
			{show && (shot === 'front' || shot === 'zoom') && <pointLight position={[h!.p[0] + 0.2, 1.2, h!.p[2] + 2.4]} intensity={5} distance={5.5} decay={1} color="#ffe0a0" />}
			{show && <Her p={h!.p} ry={h!.ry} state={h!.state} gore={h!.gore} t={t} eyes={h!.eyes} reach={h!.reach} look={h!.look} />}
		</>
	);
};

// ------------------------------------------------------------------ the dashcam's overlay, the glass, captions
const two = (n: number) => String(Math.floor(n)).padStart(2, '0');
const stamp = (t: number, shot: Shot) => {
	// 02:07 at the hook; the drive down; dawn about 05:52
	const secs = shot === 'dawn' || shot === 'seat' ? 5 * 3600 + 52 * 60 + (t - K.cutDawn) : 2 * 3600 + 7 * 60 + 14 + (t < K.cutDawn ? t : 0) * 1;
	const s = ((secs % 86400) + 86400) % 86400;
	return `2024/02/11 ${two(s / 3600)}:${two((s / 60) % 60)}:${two(s % 60)}`;
};
const Overlay: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
	const ui = useRef<HTMLCanvasElement>(null);
	const grain = useRef<HTMLCanvasElement>(null);
	const shot = shotOf(t);
	const blood = useMemo(() => {
		const r = rng(5505);
		return Array.from({length: 26}, (_, i) => ({x: 180 + (r() - 0.5) * 200, y: 250 + (r() - 0.5) * 160 - (i < 4 ? 40 : 0), rad: 3 + r() * (i < 4 ? 26 : 10), drip: 20 + r() * 90}));
	}, []);
	useLayoutEffect(() => {
		const CW = 360, CH = 640;
		const g = ui.current!.getContext('2d')!;
		g.clearRect(0, 0, CW, CH);
		const front = shot === 'front' || shot === 'dawn' || shot === 'zoom';
		// the windscreen after the hit: cracks from the strike, blood thrown across it (smeared to arcs by dawn)
		if (front && t >= K.hit) {
			const cx = 175, cy = 300;
			g.strokeStyle = 'rgba(230,236,240,0.75)';
			g.lineWidth = 1;
			const rr = rng(77);
			for (let i = 0; i < 16; i++) {
				const a = (i / 16) * Math.PI * 2 + rr() * 0.3;
				g.beginPath();
				g.moveTo(cx, cy);
				let x = cx, y = cy;
				for (let j = 0; j < 5; j++) {
					x += Math.cos(a + (rr() - 0.5) * 0.6) * (14 + rr() * 22);
					y += Math.sin(a + (rr() - 0.5) * 0.6) * (14 + rr() * 22);
					g.lineTo(x, y);
				}
				g.stroke();
			}
			for (let k = 1; k < 4; k++) {
				g.beginPath();
				g.arc(cx, cy, k * 13, 0, Math.PI * 2);
				g.stroke();
			}
			const dried = shot === 'dawn';
			for (const b of blood) {
				g.fillStyle = dried ? 'rgba(70,12,10,0.85)' : 'rgba(120,6,4,0.92)';
				g.beginPath();
				g.arc(b.x, b.y, b.rad, 0, Math.PI * 2);
				g.fill();
				const run = dried ? b.drip : b.drip * Math.min(1, (t - K.hit) / 1.5);
				g.fillRect(b.x - Math.max(1, b.rad * 0.25), b.y, Math.max(2, b.rad * 0.5), run);
			}
			if (dried) {
				// the wipers' arcs through it
				g.strokeStyle = 'rgba(80,16,12,0.7)';
				g.lineWidth = 9;
				for (const ox of [110, 250]) {
					g.beginPath();
					g.arc(ox, 600, 300, -Math.PI * 0.82, -Math.PI * 0.42);
					g.stroke();
				}
			}
		}
		// the dashcam's own display
		const txt = (s: string, x: number, y: number, col = '#f4f4ec', align: CanvasTextAlign = 'left', font = 'bold 10px "DejaVu Sans Mono", monospace') => {
			g.font = font;
			g.textAlign = align;
			g.fillStyle = '#000';
			for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.fillText(s, x + dx, y + dy);
			g.fillStyle = col;
			g.fillText(s, x, y);
		};
		const playback = shot === 'zoom' || shot === 'seat';
		txt(channel(shot), 14, 24);
		if (playback) txt(shot === 'zoom' ? '▶ PLAYBACK  ×4' : '▶ PLAYBACK', 346, 24, '#ffe070', 'right');
		else if (Math.floor((t + 600) * 1.6) % 2 === 0) {
			g.fillStyle = '#ff2a20';
			g.beginPath();
			g.arc(318, 20, 4.5, 0, Math.PI * 2);
			g.fill();
			txt('REC', 346, 24, '#f4f4ec', 'right');
		}
		txt(stamp(t, shot), 14, 40, '#f4f4ec', 'left', 'bold 9px "DejaVu Sans Mono", monospace');
		const v = Math.round(speed(t));
		txt(`${String(v).padStart(3, ' ')} km/h`, 346, 40, v >= 70 ? '#ff7a60' : '#f4f4ec', 'right', 'bold 12px "DejaVu Sans Mono", monospace');
		txt('GPS ●  G-SENSOR', 14, 54, '#a8b0a8', 'left', 'bold 7px "DejaVu Sans Mono", monospace');
		if (t >= K.hit && t < K.hit + 1.2 && shot === 'front') txt('⚠ G-SENSOR EVENT  FILE LOCKED', 180, 80, '#ffd040', 'center', 'bold 9px "DejaVu Sans Mono", monospace');
		// captions
		const line = timeline.lines.find((l) => t >= l.start - 0.05 && t < l.end + 0.35);
		if (captions && line) {
			const words = line.text.split(' ');
			const rows: string[] = [];
			let cur = '';
			for (const w of words) {
				if ((cur + ' ' + w).trim().length > 30) {
					rows.push(cur.trim());
					cur = w;
				} else cur += ' ' + w;
			}
			rows.push(cur.trim());
			const pages: string[][] = [];
			for (let i = 0; i < rows.length; i += 2) pages.push(rows.slice(i, i + 2));
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
			g.font = 'bold 13px "DejaVu Sans", sans-serif';
			g.textAlign = 'center';
			show.forEach((r, i) => {
				const y = 548 + i * 17 - (show.length - 1) * 8;
				g.fillStyle = '#000';
				for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.fillText(r, CW / 2 + dx, y + dy);
				g.fillStyle = '#ffffff';
				g.fillText(r, CW / 2, y);
			});
		}
		const img = g.getImageData(0, 0, CW, CH);
		for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 100 ? 255 : 0;
		g.putImageData(img, 0, 0);
		// grain, and a hard break-up on the impact and the two stingers' frames
		const b = grain.current!.getContext('2d')!;
		const bi = b.createImageData(60, 107);
		const burst = STINGERS.some((k) => t >= k && t < k + 0.1) ? 1 : 0;
		const r = rng(Math.floor((t + 600) * 24) * 104729 + 55);
		for (let i = 0; i < bi.data.length; i += 4) {
			const v2 = r() * 255;
			bi.data[i] = bi.data[i + 1] = bi.data[i + 2] = v2;
			bi.data[i + 3] = (26 + 200 * burst) * r();
		}
		b.putImageData(bi, 0, 0);
	}, [t, captions, shot, blood]);
	return (
		<>
			<canvas ref={grain} width={60} height={107} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={ui} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

// ------------------------------------------------------------------ assembly
export const Episode55: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const tv = t >= K.loopShot ? t - DUR : t;
	const shot = shotOf(tv);
	const grade =
		shot === 'rear'
			? 'contrast(1.25) saturate(1.1) brightness(1.05)'
			: shot === 'dawn' || shot === 'seat'
				? 'contrast(1.1) saturate(0.55) brightness(1.0)'
				: shot === 'cabin'
					? 'grayscale(1) contrast(1.3) brightness(1.1)'
					: 'contrast(1.3) saturate(1.05) sepia(0.25) brightness(1.08)'; // halogen warmth, blown highlights
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: 'scale(' + SCALE + ')', transformOrigin: '0 0', filter: grade + (shot === 'zoom' ? ' blur(0.6px)' : '')}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 90, near: 0.03, far: 200}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			{/* the fisheye's dark corners */}
			<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 78% 62% at 50% 50%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.55) 86%, rgba(0,0,0,0.95) 100%)'}} />
			<Overlay t={tv} captions={captions} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep55-lift-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
