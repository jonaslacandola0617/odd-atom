// Episode 32: "Tatlong Katok" (Season 4, folklore: the kumakatok). Taglish, Juanito. Built to the
// motion rule (every shot moves, every scene has an event, it reads muted); hard cuts only; an eerie
// score; and a seamless loop: the last shot is the first shot, on negative time.
// Form: "the street". One barangay at midnight, told from above and from across the street, through
// our jalousie window. The pattern of lights is the story: each knock lights a window; each death
// turns that window to candlelight. Never inside a room until the last shot.
// The picture: three robed figures knock three times on the door across the street, its window lights
// (hook); the crane over the roofs, they walk under the one streetlight, a candle already burns where
// they first knocked; another door, knock, knock, knock, a window lights, then turns to a candle;
// Nanay's hand chalks a white cross on our door; the street from above, windows lighting and turning to
// candles, the three coming up our side and passing the crossed doors; through our jalousie they stop in
// front of our house, and one hood turns up to our window; they move on, we close the slats; inside,
// the hall to Lola's door, three knocks from the inside, the light under it goes out; and we are back at
// the window, the three at the door across the street, about to knock.
// Care: folklore told as folklore; no real barangay; Lola's fate is never shown; the white-cross
// custom is treated with respect.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep32-katok-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {Hall, HALL, HouseId, MatsProvider, Robed, Street, V3, doorPos, useM} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep32Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep32_sound.py uses the same rules)
export const K = {
	knock0: [0.25, 0.85, 1.45], // the hook: three knocks across the street
	light0: 2.1,
	walkAway: [L.l01.end - 1.2, L.l02.start - 0.3] as [number, number],
	cutCrane: L.l02.start - 0.3,
	cutDoor: L.l03.start - 2.0,
	knock1: [L.l03.start - 1.75, L.l03.start - 1.15, L.l03.start - 0.55], // before the line
	light1: L.l03.start + 0.4,
	candle1: L.l03.end - 1.6,
	cutChalk: L.l04.start - 0.3,
	chalk: [L.l04.start + 0.1, L.l04.end - 0.2] as [number, number],
	cutStreet: L.l05.start - 0.3,
	cutGate: L.l05.end + 0.4,
	stop: L.l06.start - 0.7, // they stop in front of our house
	hood: L.l06.end + 0.15, // one hood turns up to our window
	cutPass: L.l07.start - 0.3,
	slats: [L.l07.end + 0.2, L.l07.end + 1.0] as [number, number],
	cutHall: L.l08.start - 0.4,
	knock2: [L.l08.end + 0.25, L.l08.end + 0.85, L.l08.end + 1.45], // from inside Lola's room
	lampOut: L.l08.end + 2.05,
	loopShot: L.l08.end + 2.7, // the last shot is the first shot
};
export const STINGERS = [K.knock0[0], K.knock1[0], K.hood, K.knock2[0], K.lampOut];

type Shot = 'window' | 'crane' | 'door' | 'chalk' | 'street' | 'gate' | 'pass' | 'hall';
const shotAt = (t: number): Shot => {
	if (t < K.cutCrane) return 'window';
	if (t < K.cutDoor) return 'crane';
	if (t < K.cutChalk) return 'door';
	if (t < K.cutStreet) return 'chalk';
	if (t < K.cutGate) return 'street';
	if (t < K.cutPass) return 'gate';
	if (t < K.cutHall) return 'pass';
	return 'hall';
};

// ------------------------------------------------------------------ the lights in the windows: the story
const SCHEDULE: Record<HouseId, {light?: number; candle?: number}> = {
	'L18': {light: -99, candle: -99}, // a candle already burns at the end of the street (a hidden detail: an earlier night)
	'L0': {light: K.light0, candle: K.cutCrane + 3.0},
	'L-6': {light: K.light1, candle: K.candle1},
	'R-18': {light: K.cutStreet + 0.5, candle: K.cutStreet + 2.6},
	'R-6': {light: K.cutStreet + 2.2, candle: K.cutStreet + 4.2},
	'L-12': {light: K.cutDoor - 1.5, candle: K.cutChalk - 1.0},
};
const stateAt = (t: number) => (id: HouseId) => {
	const s = SCHEDULE[id] ?? {};
	const light = s.light === undefined ? 0 : lin(t, s.light, s.light + 0.25);
	const candle = s.candle === undefined ? 0 : t >= s.candle ? 1 : 0;
	const preset = ['R-12', 'R6', 'R12', 'L6', 'R-24', 'L-18'].includes(id) ? 1 : 0;
	const cross = id === 'R0' ? lin(t, K.chalk[0], K.chalk[1]) : preset;
	return {light, candle, cross};
};

// ------------------------------------------------------------------ the three: where they are
type Fig = {p: V3; ry: number; walk: number; knock: number; hood: number};
const knockAt = (t: number, ks: number[]) => Math.max(0, ...ks.map((k) => Math.max(0, 1 - Math.abs(t - k) / 0.18)));
const threeAt = (t: number, shot: Shot): Fig[] => {
	const offs: V3[] = [[0, 0, 0], [0.75, 0, -0.55], [0.75, 0, 0.55]];
	const scales = [1.0, 1.08, 0.86];
	let lead: V3 = [0, 0, 0], ry = 0, walk = 0, knock = 0, hood = 0;
	if (shot === 'window' || shot === 'crane') {
		const d = doorPos('L0');
		const k = ease(lin(t, K.walkAway[0], K.cutCrane + 6));
		lead = [d[0] + 0.55 + 0.4 * k, 0, d[2] - 9 * k];
		ry = k > 0.02 ? Math.PI / 2 : Math.PI; // walking away up the street (-z), or facing the door (-x)
		walk = k > 0.02 && k < 0.98 ? 1 : 0;
		knock = knockAt(t, K.knock0);
		if (k > 0.02) return offs.map((o, i) => ({p: [lead[0] + o[2] * 0.8, 0, lead[2] + o[0] * 1.2], ry, walk, knock: 0, hood: 0, s: scales[i]} as Fig));
	} else if (shot === 'door') {
		const d = doorPos('L-6');
		lead = [d[0] + 0.55, 0, d[2]];
		ry = Math.PI;
		knock = knockAt(t, K.knock1);
	} else if (shot === 'street' || shot === 'gate') {
		const k = ease(lin(t, K.cutStreet, K.stop));
		lead = [1.6, 0, -20 + 18.8 * k];
		ry = -Math.PI / 2; // walking toward +z, up our side
		walk = k < 0.999 ? 1 : 0;
		if (shot === 'gate' && t > K.stop) ry = 0; // they turn to face our house (+x)
		return offs.map((o, i) => ({p: [lead[0] + o[2] * 0.6 * (shot === 'gate' && t > K.stop ? 1 : 0.7), 0, lead[2] - o[0] * (shot === 'gate' && t > K.stop ? 0.5 : 1.3)], ry, walk, knock: 0, hood: i === 0 && shot === 'gate' ? ease(lin(t, K.hood, K.hood + 0.5)) * 0.75 : 0, s: scales[i]} as Fig));
	} else if (shot === 'pass') {
		const k = ease(lin(t, K.cutPass + 0.3, K.cutHall));
		lead = [1.6, 0, -1.2 + 7 * k];
		ry = -Math.PI / 2;
		walk = 1;
		return offs.map((o, i) => ({p: [lead[0] + o[2] * 0.42, 0, lead[2] - o[0] * 1.3], ry, walk, knock: 0, hood: 0, s: scales[i]} as Fig));
	} else return [];
	return offs.map((o, i) => ({p: [lead[0] + o[0], 0, lead[2] + o[2]], ry, walk, knock: i === 0 ? knock : 0, hood, s: scales[i]} as Fig));
};

// ------------------------------------------------------------------ cameras
type CamPose = {p: V3; l: V3; fov: number; roll?: number};
const Cam: React.FC<{pose: CamPose}> = ({pose}) => {
	const {camera} = useThree();
	camera.position.set(...pose.p);
	camera.up.set(Math.sin(pose.roll ?? 0), Math.cos(pose.roll ?? 0), 0);
	camera.lookAt(...pose.l);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = pose.fov;
	c.near = 0.05;
	c.far = 700;
	camera.updateProjectionMatrix();
	return null;
};
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
// our window: in our front wall at x = 3, z = -1.2
const WIN: V3 = [3.0, 1.55, -1.2];

const poseAt = (t: number, shot: Shot): CamPose => {
	const h = handheld(t, 0.5);
	switch (shot) {
		case 'window': {
			// across the street, through our jalousie; a slow push (the loop shot is this, on negative time)
			const k = lin(t, -3, K.cutCrane);
			return {p: [WIN[0] + 1.25 - 0.35 * k + h.dp[0] * 0.3, 1.55 + h.dp[1] * 0.3, WIN[2] + 0.05], l: [-3, 1.15, -0.3 - 1.2 * ease(lin(t, K.walkAway[0], K.cutCrane))], fov: 36, roll: h.roll * 0.4};
		}
		case 'crane': {
			const k = ease(lin(t, K.cutCrane, K.cutDoor));
			return {p: mix3([0.6, 10, 9], [0.4, 7, 3], k), l: mix3([-2, 0.5, -2], [-2.2, 0.6, -8], k), fov: 50};
		}
		case 'door': {
			const k = ease(lin(t, K.cutDoor, K.cutChalk));
			const d = doorPos('L-6');
			return {p: mix3([0.9, 1.35, d[2] + 4.5], [0.3, 1.25, d[2] + 3.0], k), l: [d[0], 1.15, d[2] + 0.6], fov: 52, roll: h.roll};
		}
		case 'chalk': {
			const k = ease(lin(t, K.cutChalk, K.cutStreet));
			const d = doorPos('R0');
			return {p: add([1.9 + h.dp[0] * 0.3, 1.3 + h.dp[1] * 0.3, d[2] - 0.6], [0.25 * k, 0, 0.2 * k]), l: [d[0], 1.35, d[2]], fov: 46, roll: h.roll * 0.5};
		}
		case 'street': {
			const k = ease(lin(t, K.cutStreet, K.cutGate));
			return {p: mix3([1.0, 9.5, 7], [1.2, 7.5, 4], k), l: mix3([1.0, 0.4, -12], [1.4, 0.4, -6], k), fov: 52};
		}
		case 'gate':
		case 'pass': {
			// through our jalousie, looking down at the street in front of our house
			const k = ease(lin(t, K.cutGate, K.cutHall));
			const look: V3 = shot === 'gate' ? mix3([0.5, 0.6, -8], [1.4, 1.1, -1.2], ease(lin(t, K.cutGate, K.stop))) : mix3([1.4, 1.1, -1.2], [1.4, 1.0, 2.5], ease(lin(t, K.cutPass, K.cutHall)));
			return {p: [WIN[0] + 1.7 - 0.3 * k + h.dp[0] * 0.3, 2.3 + h.dp[1] * 0.3, WIN[2]], l: [look[0], look[1] + 0.45, look[2]], fov: 48, roll: h.roll * 0.4};
		}
		case 'hall': {
			const k = ease(lin(t, K.cutHall, K.knock2[0]));
			return {p: add(HALL, [h.dp[0] * 0.5, 1.5 + h.dp[1] * 0.5, -0.4 - 4.0 * k]), l: add(HALL, [0, 1.05, -6.9]), fov: 52, roll: h.roll};
		}
	}
};

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{t: number}> = ({t}) => {
	const M = useM();
	const shot = shotAt(t);
	const pose = poseAt(t, shot);
	if (shot === 'hall') {
		const bulge = knockAt(t, K.knock2);
		return (
			<>
				<Cam pose={pose} />
				<ambientLight intensity={0.16} color="#6a6a80" />
				<pointLight position={add(HALL, [0, 2.6, -1.0])} intensity={0.9} distance={5} decay={1} color="#9aa0c0" />
				<Hall under={t < K.lampOut ? 1 : 0} bulge={bulge} />
			</>
		);
	}
	const window = shot === 'window' || shot === 'gate' || shot === 'pass';
	const slats = shot === 'pass' ? 1.38 - 1.38 * ease(lin(t, K.slats[0], K.slats[1])) : 1.38;
	const figs = threeAt(t, shot);
	const d = doorPos('R0');
	const chalkK = lin(t, K.chalk[0], K.chalk[1]);
	const v = Math.min(1, chalkK * 2), hz = Math.max(0, chalkK * 2 - 1);
	const tip: V3 = chalkK < 0.5 ? [d[0] - 0.08, 1.65 - 0.7 * v, d[2]] : [d[0] - 0.08, 1.45, d[2] - 0.22 + 0.44 * hz];
	return (
		<>
			<Cam pose={pose} />
			<ambientLight intensity={1.0} color="#5a6a94" />
			<pointLight position={[-120, 140, -260]} intensity={1.6} decay={0} color="#9aa8d0" />
			<pointLight position={[160, 90, 120]} intensity={0.5} decay={0} color="#6a78a0" />
			<Street t={t} state={stateAt(t)} slats={slats} />
			{figs.map((f, i) => (
				<Robed key={i} p={f.p} ry={f.ry} t={t} walk={f.walk} knock={f.knock} hoodTurn={f.hood} scale={(f as Fig & {s?: number}).s ?? 1} seed={i * 1.7} />
			))}
			{shot === 'chalk' && (
				<group position={tip}>
					{/* Nanay's hand with the chalk, from the right */}
					<mesh position={[-0.05, -0.02, 0.09]} material={M.hand}>
						<boxGeometry args={[0.06, 0.09, 0.1]} />
					</mesh>
					<mesh position={[-0.1, -0.08, 0.32]} rotation={[0.9, 0, 0]} material={M.wood}>
						<cylinderGeometry args={[0.05, 0.06, 0.4, 7, 1]} />
					</mesh>
					<mesh position={[-0.02, 0, 0.03]} material={M.chalk}>
						<boxGeometry args={[0.02, 0.02, 0.06]} />
					</mesh>
					<pointLight position={[-0.6, 0.3, 0.2]} intensity={1.2} distance={2.5} decay={1} color="#ffd8a0" />
				</group>
			)}
			{window && <pointLight position={[WIN[0] - 0.4, 1.6, WIN[2]]} intensity={0.25} distance={1.2} decay={1} color="#8090b0" />}
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: captions, grain, our window's frame
const Overlay: React.FC<{t: number; captions: boolean; frame: boolean}> = ({t, captions, frame}) => {
	const cap = useRef<HTMLCanvasElement>(null);
	const noise = useRef<HTMLCanvasElement>(null);
	useLayoutEffect(() => {
		const CW = 360, CH = 640;
		const g = cap.current!.getContext('2d')!;
		g.clearRect(0, 0, CW, CH);
		const out = (s: string, x: number, y: number, fill: string) => {
			g.textAlign = 'center';
			for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [2, 2]]) {
				g.fillStyle = '#000';
				g.fillText(s, x + dx, y + dy);
			}
			g.fillStyle = fill;
			g.fillText(s, x, y);
		};
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
			show.forEach((r, i) => out(r, CW / 2, 512 + i * 19 - (show.length - 1) * 19, '#ffffff'));
		}
		const img = g.getImageData(0, 0, CW, CH);
		for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 120 ? 255 : 0;
		g.putImageData(img, 0, 0);
		const n = noise.current!.getContext('2d')!;
		const ni = n.createImageData(LW, LH);
		const r = rng(Math.floor(t * 24) * 7919 + 32);
		for (let i = 0; i < ni.data.length; i += 4) {
			const v = r() * 255;
			ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = v;
			ni.data[i + 3] = 20 * (r() < 0.5 ? 1 : 0.4);
		}
		n.putImageData(ni, 0, 0);
	}, [t, captions]);
	return (
		<>
			{frame && (
				// our window's dark frame: the room around the jalousie
				<div style={{position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 36px #050608, inset 0 0 140px 50px rgba(0,0,0,0.8)'}} />
			)}
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

// ------------------------------------------------------------------ assembly
export const Episode32: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	// the loop shot runs on negative time: it is the hook's own first moments, before the first knock
	const tv = t >= K.loopShot ? t - DUR : t;
	const shot = shotAt(tv);
	const frame = shot === 'window' || shot === 'gate' || shot === 'pass';
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: shot === 'hall' ? 'saturate(0.6) contrast(1.15)' : 'saturate(0.75) contrast(1.12) brightness(1.02)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.05, far: 700}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			<Overlay t={tv} captions={captions} frame={frame} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.7) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep32-katok-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
