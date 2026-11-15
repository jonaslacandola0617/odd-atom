// Episode 46: "Huling Biyahe Pahilaga" (Season 5: a night-bus experience shared online, retold in our
// own words; no real bus line, crew, road or person). Taglish, Juanito. The PSX models; hard cuts only;
// an eerie score; a seamless loop (the last shot is the first shot, on negative time).
// Form: "the count". The conductor's ticket punch counts the riders, row by row, and every count is a
// click. Twenty-three of us; his count says twenty-four. She boards at a curve by the ravine, wet, in
// held-then-snapped steps, and sits behind me; when he comes to collect, the seat is empty. The bus
// stops, the lights come up, he counts everyone: twenty-three. The backrest behind me is still pressed
// in, and wet. He counts again, and stops at me, looking behind me: she is there, and she comes over my
// seat at the lens. Then his count down the aisle again (loop).
// Cast: me Character_14; her Character_Female_12 (navy long sleeves), pale and wet; the conductor
// Character_30; the driver Character_03; riders from the user's PSX packs.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep46-bus-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {ARMS_DOWN, merge, Pose, PsxCharacter, SIT} from '../psx/models';
import {BusBody, Cabin, Drips, HER_ROW, MatsProvider, ME_ROW, Road, SEAT_TOP, SEATX, V3} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep46Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep46_sound.py uses the same rules)
export const K = {
	hookClicks: [-1.5, -0.9, -0.3, 0.3], // the hook's count: four rows, the last one hers
	cutRoad: L.l02.start - 0.3,
	cutCurve: L.l03.start - 0.3,
	stop: L.l03.start + 3.0, // the bus stops beside her
	cutBoard: L.l04.start - 0.3,
	sit: L.l04.start + 3.3, // she reaches the seat behind me and sits (a snap)
	cutCollect: L.l05.start - 0.3,
	gone: L.l05.end - 0.85, // a flicker, and the seat is empty
	brake: L.l05.end + 0.35, // the bus stopping (heard in the gap)
	cutStop: L.l06.start - 0.3,
	counts: Array.from({length: 11}, (_, i) => L.l06.start + 0.9 + i * 0.42),
	cutDent: L.l07.start - 0.3,
	cutCount: L.l08.start - 0.3,
	recount: Array.from({length: 4}, (_, i) => L.l08.start + 0.3 + i * 0.5), // the last one is me; then he stops
	snap: L.l08.end + 0.6, // she comes over my seat at the lens (the stinger)
	loopShot: DUR - 1.7,
};
export const STINGERS = [K.snap];

type Shot = 'hook' | 'road' | 'curve' | 'board' | 'collect' | 'stop' | 'dent' | 'count';
const CUTS: [number, Shot][] = [
	[K.cutRoad, 'hook'],
	[K.cutCurve, 'road'],
	[K.cutBoard, 'curve'],
	[K.cutCollect, 'board'],
	[K.cutStop, 'collect'],
	[K.cutDent, 'stop'],
	[K.cutCount, 'dent'],
];
const shotOf = (t: number): Shot => CUTS.find(([c]) => t < c)?.[1] ?? 'count';
const inside = (s: Shot) => s !== 'road' && s !== 'curve';
const stopped = (s: Shot) => s === 'stop' || s === 'dent' || s === 'count';

// ------------------------------------------------------------------ the people
const PALE = {color: '#c8d0d4', emissive: '#14181c'};
const SIT_Y = SEAT_TOP - 0.79;
const sway = (t: number, moving: boolean, seed = 0) => (moving ? 0.022 * Math.sin(t * 0.8 + seed * 0.3) + 0.004 * Math.sin(t * 23 + seed) : 0);
/** a seated rider facing the front (−z). awake: head up, looking round (the stop). */
const Rider: React.FC<{name: string; at: [number, number]; t: number; seed: number; moving: boolean; height?: number; doze?: number; awake?: boolean; extra?: Pose; tint?: {color?: string; emissive?: string}}> = ({
	name,
	at,
	t,
	seed,
	moving,
	height = 1.68,
	doze = 0,
	awake,
	extra = {},
	tint,
}) => {
	const r = sway(t, moving, seed);
	const br = Math.sin(t * (1.2 + (seed % 3) * 0.1) + seed) * 0.022;
	const d = awake ? 0 : doze;
	const look = awake ? Math.sin(seed * 2.1) * 0.7 : 0;
	const pose = merge(
		SIT,
		{
			Spine: [['z', r * 1.4]],
			Spine2: [['x', br]],
			Neck: [['z', r * 2], ['x', 0.12 + d * 0.5], ['y', look]],
			Head: [['z', d * 0.3 * Math.sign((seed % 2) - 0.5)]],
		},
		extra,
	);
	return <PsxCharacter name={name} height={height} tint={tint} position={[at[0], SIT_Y, at[1] + 0.06]} rotation={[0, Math.PI, 0]} pose={pose} />;
};

const RIDERS: {name: string; at: [number, number]; seed: number; height?: number; doze: number}[] = [
	{name: 'Character_05', at: [SEATX[0], -2.4], seed: 1, doze: 0.8},
	{name: 'Character_Female_05', at: [SEATX[2], -2.4], seed: 2, height: 1.58, doze: 0.9},
	{name: 'Character_10', at: [SEATX[3], -1.6], seed: 3, doze: 0.6},
	{name: 'Character_31_Female', at: [SEATX[0], -0.8], seed: 4, height: 1.55, doze: 1},
	{name: 'Character_29', at: [SEATX[1], -0.8], seed: 5, height: 1.62, doze: 0.9},
	{name: 'Character_Female_09', at: [SEATX[3], 0], seed: 6, height: 1.6, doze: 0.7},
	{name: 'Character_08', at: [SEATX[0], ME_ROW], seed: 7, doze: 1},
	{name: 'Character_12', at: [SEATX[2], HER_ROW], seed: 8, doze: 0.9},
	{name: 'Character_Female_13', at: [SEATX[3], 2.4], seed: 9, height: 1.58, doze: 0.8},
	{name: 'Character_29_Female', at: [SEATX[0], 3.2], seed: 10, height: 1.52, doze: 1},
	{name: 'Character_11', at: [SEATX[2], 4.0], seed: 11, doze: 1},
];

/** her. walk: a stride phase (walking +z down the aisle), or seated behind me. bow: head bowed
 *  (1) or lifted to the lens (0). lunge: 0..1 over my seat back. */
const Her: React.FC<{t: number; p: V3; walk?: number; bow?: number; lunge?: number; moving: boolean}> = ({t, p, walk, bow = 1, lunge = 0, moving}) => {
	let pose: Pose;
	if (walk !== undefined) {
		const s = Math.sin(walk);
		pose = merge(ARMS_DOWN, {
			LeftUpLeg: [['aim', [0.05, -1, 0.3 * s]]],
			RightUpLeg: [['aim', [-0.05, -1, -0.3 * s]]],
			LeftLeg: [['aim', [0, -1, -0.2 + 0.15 * s]]],
			RightLeg: [['aim', [0, -1, -0.2 - 0.15 * s]]],
			Spine: [['x', 0.15]],
			Neck: [['x', 0.55 * bow]],
			Head: [['x', 0.25 * bow]],
		});
	} else {
		const r = sway(t, moving, 12);
		pose = merge(SIT, {
			Spine: [['x', 0.75 * lunge], ['z', r * 1.4]],
			Spine1: [['x', 0.35 * lunge]],
			Neck: [['x', 0.5 * bow - 0.35 * lunge]],
			Head: [['x', 0.25 * bow - 0.45 * lunge], ['z', 0.35 * lunge]],
			LeftForeArm: [['aim', [0.02, -0.25, 1]]],
			RightForeArm: [['aim', [-0.02, -0.25, 1]]],
		});
	}
	const seated = walk === undefined;
	return <PsxCharacter name="Character_Female_12" height={1.6} tint={PALE} position={seated ? [p[0], SIT_Y + 0.02 + 0.3 * lunge, p[2] + 0.06 - 0.55 * lunge] : p} rotation={[0, seated ? Math.PI : 0, 0]} pose={pose} />;
};

/** the conductor, standing in the aisle, his punch pointing at a seat. back: facing the front (−z,
 *  coming up from the rear), so he points with his left hand at the left-hand seats. */
const Conductor: React.FC<{z: number; point?: V3 | null; x?: number; back?: boolean}> = ({z, point, x = 0.05, back}) => {
	let arm: Pose = {};
	if (point) {
		const sh: V3 = [x + (back ? -0.18 : -0.18), 1.42, z];
		const w: V3 = [point[0] - sh[0], point[1] - sh[1], point[2] - sh[2]];
		// world direction to character space (facing −z turns x and z round)
		const d: V3 = back ? [-w[0], w[1], -w[2]] : w;
		arm = back ? {LeftArm: [['aim', d]], LeftForeArm: [['aim', d]]} : {RightArm: [['aim', d]], RightForeArm: [['aim', d]]};
	}
	return <PsxCharacter name="Character_30" height={1.68} position={[x, 0, z]} rotation={[0, back ? Math.PI : 0, 0]} pose={merge(ARMS_DOWN, arm, {Neck: [['x', 0.12]]})} />;
};

// ------------------------------------------------------------------ cameras
type CamPose = {p: V3; l: V3; fov: number};
const aim = (camera: THREE.Camera, pose: CamPose) => {
	camera.position.set(...pose.p);
	camera.up.set(0, 1, 0);
	camera.lookAt(...pose.l);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = pose.fov;
	c.near = 0.02;
	c.far = 120;
	c.updateProjectionMatrix();
};
const Cam: React.FC<{get: () => CamPose}> = ({get}) => {
	const {camera} = useThree();
	useFrame(() => aim(camera, get()));
	aim(camera, get());
	return null;
};
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const move = (t: number, t0: number, t1: number, a: V3, b: V3, la: V3, lb: V3, fov: number, shake = 0.2): CamPose => {
	const k = ease(lin(t, t0, t1));
	const hh = handheld(t, shake);
	const p = mix3(a, b, k);
	return {p: [p[0] + hh.dp[0] * 0.25, p[1] + hh.dp[1] * 0.25, p[2]], l: mix3(la, lb, k), fov};
};
/** the bus on the road shot: centre z */
const busZ = (t: number) => 62 - 8.5 * (t - K.cutRoad);
/** arriving at the curve: the door (front right, centre − 4.5) comes to rest at z 0.5 */
const arriveZ = (t: number) => 5 + 34 * (1 - ease(lin(t, K.cutCurve, K.stop))) ** 1.4;

const poseAt = (t: number, shot: Shot): CamPose => {
	switch (shot) {
		case 'hook':
			// over my seat from the front: her facing the lens behind me, the count coming up behind her
			return move(t, -1.7, K.cutRoad, [0.18, 1.62, -0.35], [0.16, 1.6, -0.15], [-0.52, 1.18, 1.66], [-0.52, 1.18, 1.66], 50, 0.12);
		case 'road': {
			const z = busZ(t);
			return {p: [-1.4, 4.6, z + 8.5], l: [2.2, 1.0, z - 5], fov: 54};
		}
		case 'curve':
			return move(t, K.cutCurve, K.cutBoard, [5.3, 1.25, -3.6], [5.2, 1.2, -3.2], [2.6, 1.4, 4.0], [2.8, 1.4, 3.6], 56, 0.1);
		case 'board':
			return move(t, K.cutBoard, K.cutCollect, [0.18, 1.6, 4.6], [0.15, 1.55, 4.2], [-0.15, 1.1, -2.0], [-0.2, 1.05, -1.0], 56, 0.12);
		case 'collect':
			return move(t, K.cutCollect, K.cutStop, [0.2, 1.66, -0.75], [0.18, 1.63, -0.45], [-0.45, 1.15, 1.9], [-0.45, 1.15, 1.9], 50, 0.12);
		case 'stop':
			return move(t, K.cutStop, K.cutDent, [0.65, 1.95, -4.5], [0.6, 1.92, -4.0], [-0.1, 0.85, 2.6], [-0.1, 0.85, 2.6], 60, 0.1);
		case 'dent':
			return move(t, K.cutDent, K.cutCount, [0.18, 1.55, 0.95], [0.1, 1.45, 1.15], [-0.52, 0.95, 1.82], [-0.52, 0.95, 1.82], 48, 0.08);
		case 'count': {
			// his eye-line: from the aisle onto me, and over my shoulder to the seat behind me
			const c = move(t, K.cutCount, L.l08.end, [0.22, 1.72, -0.35], [0.18, 1.68, -0.1], [-0.5, 1.05, 1.25], [-0.52, 1.12, 1.3], 58, 0.22);
			const jolt = lin(t, K.snap, K.snap + 0.06) * (1 - lin(t, K.snap + 0.06, K.snap + 0.5));
			return {...c, p: [c.p[0], c.p[1] + 0.04 * jolt, c.p[2] - 0.08 * jolt]};
		}
	}
};

// ------------------------------------------------------------------ the scene
/** the conductor's count: which click we are on (and how far through the step to the next row) */
const clickIndex = (t: number, at: number[]) => at.reduce((n, a) => n + (t >= a ? 1 : 0), 0);

const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotOf(t);
	const cam = <Cam get={() => poseAt(t, shot)} />;
	if (!inside(shot)) {
		const busx = 1.6;
		const bz = shot === 'road' ? busZ(t) : arriveZ(t);
		const door = shot === 'curve' ? ease(lin(t, K.stop + 0.4, K.stop + 1.1)) : 0;
		// she steps toward the door in held-then-snapped steps
		const steps = shot === 'curve' ? Math.floor(Math.max(0, t - (K.stop + 1.4)) / 0.6) : 0;
		const hx = 3.55 - Math.min(3, steps) * 0.18;
		return (
			<>
				{cam}
				<ambientLight intensity={1.35} color="#5a6a80" />
				<directionalLight position={[-20, 30, 10]} intensity={0.5} color="#8aa0c8" />
				<Road />
				<BusBody x={busx} z={bz} door={door} t={t} />
				{shot === 'curve' && (
					<>
						<PsxCharacter
							name="Character_Female_12"
							height={1.6}
							tint={PALE}
							position={[hx, 0, 0.5]}
							rotation={[0, -Math.PI / 2, 0]}
							pose={merge(ARMS_DOWN, {Neck: [['x', 0.5]], Head: [['x', 0.2]], Spine: [['x', 0.06]]})}
						/>
						<Drips p={[hx - 0.15, 1.3, 0.5]} t={t} fall={1.25} />
					</>
				)}
			</>
		);
	}
	const moving = !stopped(shot);
	const lights = stopped(shot) ? 1 : shot === 'collect' && t > K.gone - 0.12 && t < K.gone + 0.1 ? 0.1 : 0.55;
	const lamp = moving ? 9 - ((((t * 7) % 30) + 30) % 30) : null;
	// her
	let her: React.ReactNode = null;
	const herSeat: V3 = [SEATX[1], 0, HER_ROW];
	if (shot === 'hook') her = <Her t={t} p={herSeat} moving />;
	if (shot === 'board') {
		if (t < K.sit) {
			// down the aisle from the door toward the lens, in held-then-snapped steps
			const q = Math.floor((t - K.cutBoard) / 0.45) * 0.45;
			const z = -4.3 + (HER_ROW + 0.3 + 4.3) * Math.min(1, q / (K.sit - K.cutBoard - 0.3));
			her = <Her t={t} p={[0.02, 0, z]} walk={q * 6} moving />;
		} else her = <Her t={t} p={herSeat} moving />;
	}
	if (shot === 'collect' && t < K.gone) her = <Her t={t} p={herSeat} moving />;
	if (shot === 'count') {
		const lift = ease(lin(t, L.l08.end - 2.0, L.l08.end - 0.4));
		her = <Her t={t} p={herSeat} moving={false} bow={1 - 0.6 * lift} lunge={ease(lin(t, K.snap, K.snap + 0.07))} />;
	}
	// the conductor
	let cond: React.ReactNode = null;
	if (shot === 'hook') {
		// up from the rear, a row a click: 4.0, 3.2, 2.4, and hers
		const rows = [4.0, 3.2, 2.4, HER_ROW];
		const n = clickIndex(t, K.hookClicks);
		const row = rows[Math.max(0, n - 1)];
		cond = <Conductor back z={n === 0 ? 4.9 : row + 0.45} point={n === 0 ? null : [SEATX[1], 1.0, row]} />;
	}
	if (shot === 'collect') {
		const z = 4.6 - 2.5 * ease(lin(t, K.cutCollect + 0.3, K.gone - 0.9));
		cond = <Conductor back z={z} point={t > K.gone - 1.4 ? [SEATX[1], 0.9, HER_ROW] : null} />;
	}
	if (shot === 'stop') {
		const n = clickIndex(t, K.counts);
		const row = -3.6 + 0.8 * Math.floor(Math.max(0, n - 1) / 2);
		const side = (n - 1) % 2 === 0 ? SEATX[1] : SEATX[2];
		cond = <Conductor z={row - 0.5} point={n === 0 ? null : [side, 1.0, row]} />;
	}
	const awake = stopped(shot);
	// me: in the count I look up at him (toward the aisle)
	const meExtra: Pose = shot === 'count' ? {Neck: [['x', -0.15], ['y', -0.55]], Head: [['x', -0.2]]} : {};
	return (
		<>
			{cam}
			<ambientLight intensity={awake ? 1.3 : 1.05} color="#6a7a7a" />
			<Cabin t={t} lights={lights} lamp={lamp} dent={shot === 'dent' || shot === 'count' ? 1 : 0} />
			{RIDERS.map((r) => (
				<Rider key={r.name} {...r} t={t} moving={moving} awake={awake} />
			))}
			<Rider name="Character_14" at={[SEATX[1], ME_ROW]} t={t} seed={13} moving={moving} doze={shot === 'hook' || shot === 'board' ? 0.2 : 0} extra={meExtra} />
			<Rider
				name="Character_03"
				at={[-0.65, -3.65]}
				t={t}
				seed={14}
				moving={moving}
				extra={{LeftArm: [['aim', [0.3, -0.6, 0.75]]], RightArm: [['aim', [-0.3, -0.6, 0.75]]], LeftForeArm: [['aim', [-0.25, 0.25, 1]]], RightForeArm: [['aim', [0.25, 0.25, 1]]]}}
			/>
			{her}
			{cond}
			{/* the water: from her hair while she is there; from the backrest after */}
			{(shot === 'hook' || (shot === 'board' && t >= K.sit) || (shot === 'collect' && t < K.gone) || shot === 'count') && <Drips p={[SEATX[1], 1.02, HER_ROW - 0.12]} t={t} fall={0.45} />}
			{shot === 'dent' && <Drips p={[SEATX[1], 0.95, HER_ROW + 0.18]} t={t} rate={1.6} fall={0.5} />}
			{(shot === 'hook' || shot === 'collect' || shot === 'count' || (shot === 'board' && t >= K.sit)) && <pointLight position={[-0.3, 1.95, HER_ROW - 0.4]} intensity={1.0} distance={1.8} decay={1} color="#cfe4e0" />}
			{shot === 'board' && t < K.sit && <pointLight position={[0, 1.9, -0.5]} intensity={0.9} distance={3} decay={1} color="#cfe0e0" />}
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: captions, grain
const Overlay: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
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
		const r = rng(Math.floor(t * 24) * 7919 + 46);
		for (let i = 0; i < ni.data.length; i += 4) {
			const v = r() * 255;
			ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = v;
			ni.data[i + 3] = 20 * (r() < 0.5 ? 1 : 0.4);
		}
		n.putImageData(ni, 0, 0);
	}, [t, captions]);
	return (
		<>
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

// ------------------------------------------------------------------ assembly
export const Episode46: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	// the loop shot runs on negative time: the hook's own first moments
	const tv = t >= K.loopShot ? t - DUR : t;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: 'scale(' + SCALE + ')', transformOrigin: '0 0', filter: 'saturate(0.6) contrast(1.15) hue-rotate(-6deg)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.02, far: 120}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			<Overlay t={tv} captions={captions} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep46-bus-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
