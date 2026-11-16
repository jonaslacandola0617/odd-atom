// Episode 48: "Bedspace" (Season 5: students' experience in an old Manila boarding house, shared online and
// retold in our own words; no real building, street or landlord). Taglish, Juanito. The PSX models; hard
// cuts only; an eerie score; a seamless loop (the last shot is the first shot, on negative time).
// Form: "the count from the corner". A camera high in the ceiling corner, where all three double-decks
// face it; a phone torch counts the sleepers, one pool of light per count. Five of us; six sleeping. The
// sixth lies on its side in the bunk above mine, facing the wall. In the morning that mattress is bare
// and dusty. The next night the upper bunk is empty and the count is still six: it is in my bed, behind
// me. Its head turns round, held then snapped, past where a neck goes, to my nape; then it comes up over
// my shoulder at the lens.
// Cast: me Character_10; friends Character_05, 08, 11 and 12; the sixth Character_Monster_02, pale.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep48-bedspace-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {ARMS_DOWN, merge, Pose, PsxCharacter} from '../psx/models';
import {Building, HIGH, LOW, MatsProvider, Motes, Room, Torch, V3} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep48Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ who sleeps where (head positions)
type Sleeper = {name: string; head: V3; dir: '-x' | '-z'; roll?: number; height?: number};
const FRIENDS: Sleeper[] = [
	{name: 'Character_12', head: [1.2, HIGH + 0.1, -2.05], dir: '-x'}, // D upper
	{name: 'Character_11', head: [1.2, LOW + 0.1, -2.05], dir: '-x'}, // D lower
	{name: 'Character_08', head: [-1.0, HIGH + 0.1, -2.05], dir: '-x'}, // C upper
	{name: 'Character_05', head: [-1.0, LOW + 0.1, -2.05], dir: '-x'}, // C lower
];
const ME_HEAD: V3 = [-2.33, LOW + 0.2, -0.55];
const SIXTH_UP: V3 = [-2.62, HIGH + 0.2, -0.55];
const SIXTH_BED: V3 = [-2.72, LOW + 0.2, -0.78];
/** the count's targets, in order: four friends, my bed, the bunk above mine */
const COUNT: V3[] = [...FRIENDS.map((f) => f.head), [-2.33, LOW + 0.15, -0.3], [-2.55, HIGH + 0.15, -0.3]];

// ------------------------------------------------------------------ key times (scripts/ep48_sound.py uses the same rules)
export const K = {
	hookClicks: [-1.6, -1.15, -0.7, -0.25, 0.2, 0.65], // the hook's count, ending on the sixth
	cutBuilding: L.l02.start - 0.3,
	cutWake: L.l03.start - 0.3,
	torchOn: L.l03.start + 2.4,
	cutCount: L.l04.start - 0.3,
	counts: [0.03, 1.02, 2.03, 2.98, 3.91, 4.73].map((d) => L.l04.start + d), // on the spoken words "isa … lima… anim" (measured in voice/l04.wav)
	cutMorning: L.l05.start - 0.3,
	cutRecount: L.l06.start - 0.3,
	recount: [0.15, 0.55, 0.95, 1.35, 1.9, 3.5, 5.2].map((d) => L.l06.start + d), // four, me, the empty bunk ("wala na siya sa itaas"), my bed again
	cutBed: L.l07.start - 0.3,
	cutNape: L.l08.start - 0.3,
	turns: [1.0, 2.3, 3.6].map((d) => L.l08.start + d), // its head round to my nape, held then snapped
	snap: L.l08.end + 0.6, // over my shoulder at the lens (the stinger)
	loopShot: DUR - 1.7,
};
export const STINGERS = [K.snap];

type Shot = 'hook' | 'building' | 'wake' | 'count' | 'morning' | 'recount' | 'bed' | 'nape';
const CUTS: [number, Shot][] = [
	[K.cutBuilding, 'hook'],
	[K.cutWake, 'building'],
	[K.cutCount, 'wake'],
	[K.cutMorning, 'count'],
	[K.cutRecount, 'morning'],
	[K.cutBed, 'recount'],
	[K.cutNape, 'bed'],
];
const shotOf = (t: number): Shot => CUTS.find(([c]) => t < c)?.[1] ?? 'nape';
const clickIndex = (t: number, at: number[]) => at.reduce((n, a) => n + (t >= a ? 1 : 0), 0);

// ------------------------------------------------------------------ the people
const PALE = {color: '#c8ccc8', emissive: '#141818'};
/** someone lying with the head at `head`, the body running away along +dir; roll turns them onto a side
 *  (+π/2 faces −x for a −z sleeper). */
const Lying: React.FC<{s: Sleeper; t: number; seed: number; pose?: Pose; tint?: {color?: string; emissive?: string}; lift?: V3}> = ({s, t, seed, pose = {}, tint, lift = [0, 0, 0]}) => {
	const h = s.height ?? 1.68;
	const ry = s.dir === '-z' ? 0 : Math.PI / 2;
	// feet = head moved back along the body: the head bone sits 0.87 h from the feet (measured with the probe)
	const back = 0.87 * h;
	const feet: V3 = s.dir === '-z' ? [s.head[0], s.head[1], s.head[2] + back] : [s.head[0] + back, s.head[1], s.head[2]];
	const y = s.roll ? 0.02 : -0.1; // on the back the origin sits a little below the head's centre
	return (
		<group position={[feet[0] + lift[0], feet[1] + y + lift[1], feet[2] + lift[2]]} rotation={[0, ry, 0]}>
			<group rotation={[0, 0, s.roll ?? 0]}>
				<PsxCharacter
					name={s.name}
					height={h}
					tint={tint}
					rotation={[-Math.PI / 2, 0, 0]}
					pose={merge(ARMS_DOWN, {Spine2: [['x', Math.sin(t * 1.2 + seed) * 0.03]], Neck: [['x', 0.2]]}, pose)}
				/>
			</group>
		</group>
	);
};
/** standing, turned to face `at`; point: the right arm out at it */
const Standing: React.FC<{name: string; p: V3; at: V3; point?: boolean; height?: number}> = ({name, p, at, point, height = 1.68}) => {
	const d: V3 = [at[0] - p[0], at[1] - 1.45, at[2] - p[2]];
	const ry = Math.atan2(d[0], d[2]);
	const c: V3 = [d[0] * Math.cos(ry) - d[2] * Math.sin(ry), d[1], d[0] * Math.sin(ry) + d[2] * Math.cos(ry)];
	const arm: Pose = point ? {RightArm: [['aim', c]], RightForeArm: [['aim', c]]} : {};
	return <PsxCharacter name={name} height={height} position={p} rotation={[0, ry, 0]} pose={merge(ARMS_DOWN, arm, {Neck: [['x', -0.25]]})} />;
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
	return {p: [p[0] + hh.dp[0] * 0.2, p[1] + hh.dp[1] * 0.2, p[2]], l: mix3(la, lb, k), fov};
};
const CORNER: V3 = [2.8, 2.65, 2.3];
const STAND_EYE: V3 = [0.4, 1.6, 0.9];
/** where the torch points at t, given the count times and targets (a quick whip between counts) */
const torchAt = (t: number, at: number[], targets: V3[]): V3 => {
	const n = clickIndex(t, at);
	if (n === 0) return targets[0];
	const i = n - 1;
	const prev = targets[Math.max(0, i - 1)];
	return mix3(prev, targets[i], ease(lin(t, at[i] - 0.12, at[i])));
};
const RECOUNT_T: V3[] = [...COUNT.slice(0, 4), [-2.3, LOW + 0.2, -0.45], [-2.55, HIGH + 0.15, -0.3], [-2.55, LOW + 0.2, -0.6]];

const poseAt = (t: number, shot: Shot): CamPose => {
	switch (shot) {
		case 'hook':
		case 'recount':
			// the ceiling corner: a slow creep in
			return move(t, shot === 'hook' ? -1.7 : K.cutRecount, shot === 'hook' ? K.cutBuilding : K.cutBed, CORNER, [2.6, 2.55, 2.1], [-1.1, 0.75, -0.9], [-1.2, 0.8, -0.8], 72, 0.04);
		case 'building':
			return move(t, K.cutBuilding, K.cutWake, [2.2, 1.6, 12.5], [1.6, 2.6, 9.2], [-1.0, 4.4, -3], [-1.6, 4.8, -3], 52, 0.15);
		case 'wake':
			// from the head end, under the upper bunk, down onto my face
			return move(t, K.cutWake, K.cutCount, [-1.62, 1.26, -0.15], [-1.7, 1.22, -0.25], [-2.35, 0.62, -0.58], [-2.35, 0.62, -0.58], 54, 0.06);
		case 'count': {
			const q = torchAt(t, K.counts, COUNT);
			const hh = handheld(t, 0.3);
			return {p: [STAND_EYE[0] + hh.dp[0] * 0.3, STAND_EYE[1] + hh.dp[1] * 0.3, STAND_EYE[2]], l: q, fov: 58};
		}
		case 'morning':
			return move(t, K.cutMorning, K.cutRecount, CORNER, [2.65, 2.6, 2.15], [-1.4, 1.0, -0.4], [-1.6, 1.1, -0.4], 70, 0.04);
		case 'bed':
			return move(t, K.cutBed, K.cutNape, [-1.6, 1.45, 0.1], [-1.7, 1.42, 0.0], [-2.58, 0.62, -0.68], [-2.6, 0.62, -0.72], 58, 0.05);
		case 'nape': {
			// over my head, down into the gap between me and the wall: its head, coming round
			const c = move(t, K.cutNape, L.l08.end, [-1.72, 1.24, -0.3], [-1.86, 1.2, -0.42], [-2.55, 0.64, -0.7], [-2.58, 0.66, -0.74], 50, 0.06);
			const jolt = lin(t, K.snap, K.snap + 0.06) * (1 - lin(t, K.snap + 0.06, K.snap + 0.5));
			return {...c, p: [c.p[0] + 0.05 * jolt, c.p[1] - 0.03 * jolt, c.p[2]]};
		}
	}
};

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotOf(t);
	const cam = <Cam get={() => poseAt(t, shot)} />;
	if (shot === 'building')
		return (
			<>
				{cam}
				<ambientLight intensity={1.4} color="#4a5a78" />
				<directionalLight position={[10, 20, 20]} intensity={0.6} color="#7a8ab8" />
				<Building />
			</>
		);
	const day = shot === 'morning';
	// the sixth: above me until the recount's empty bunk; then in my bed
	const sixthAbove = shot === 'hook' || shot === 'count';
	const sixthBelow = (shot === 'recount' && t > K.recount[5]) || shot === 'bed' || shot === 'nape';
	// its head coming round to me (held then snapped), then up over my shoulder at the lens
	const turn = shot === 'nape' ? K.turns.reduce((n, a) => n + ease(lin(t, a, a + 0.08)), 0) / K.turns.length : 0;
	const snap = shot === 'nape' ? ease(lin(t, K.snap, K.snap + 0.07)) : 0;
	const sixthPose: Pose = {Neck: [['y', 1.45 * turn], ['x', 0.2 - 0.3 * snap]], Head: [['y', 1.35 * turn], ['z', 0.3 * turn]]};
	// me: standing with my phone in the hook and the count; in my bed otherwise
	const meStanding = shot === 'hook' || shot === 'count';
	// the torch
	let torch: React.ReactNode = null;
	if (shot === 'hook') torch = <Torch p={[0.42, 1.35, 0.75]} q={torchAt(t, K.hookClicks, COUNT)} on={t > -1.65 ? 1 : 0} />;
	if (shot === 'count') torch = <Torch p={[STAND_EYE[0] - 0.05, STAND_EYE[1] - 0.25, STAND_EYE[2] - 0.15]} q={torchAt(t, K.counts, COUNT)} on={1} />;
	if (shot === 'recount') torch = <Torch p={[-2.05, LOW + 0.35, -0.2]} q={torchAt(t, K.recount, RECOUNT_T)} on={t > K.cutRecount + 0.1 ? 1 : 0} />;
	const phone = shot === 'wake' ? lin(t, K.torchOn, K.torchOn + 0.1) : shot === 'bed' || shot === 'nape' ? 0.45 : 0;
	return (
		<>
			{cam}
			<ambientLight intensity={day ? 2.6 : 1.4} color={day ? '#d8d0c0' : '#5a6480'} />
			{day && <directionalLight position={[-6, 5, 3]} intensity={1.2} color="#fff0d0" />}
			<Room day={day} t={t} />
			{!day &&
				FRIENDS.map((f, i) => (
					<Lying key={f.name} s={f} t={t} seed={i} pose={{Neck: [['x', 0.2], ['y', ((i % 2) - 0.5) * 0.6]]}} />
				))}
			{!meStanding && !day && <Lying s={{name: 'Character_10', head: ME_HEAD, dir: '-z', roll: -Math.PI / 2}} t={t} seed={9} pose={shot === 'nape' ? {Neck: [['x', 0.1]]} : {}} />}
			{meStanding && <Standing name="Character_10" p={[0.42, 0, 1.05]} at={torchAt(t, shot === 'hook' ? K.hookClicks : K.counts, COUNT)} point />}
			{day && (
				<>
					<Standing name="Character_05" p={[-1.0, 0, 0.95]} at={[-2.5, 1.7, 0.2]} />
					<Standing name="Character_08" p={[-0.55, 0, 1.55]} at={[-2.5, 1.7, 0.2]} />
					<Standing name="Character_11" p={[-1.45, 0, 1.7]} at={[-2.5, 1.7, 0.2]} point />
					<Standing name="Character_12" p={[-0.3, 0, 0.55]} at={[-2.5, 1.7, 0.2]} />
					<Standing name="Character_10" p={[-1.25, 0, 0.25]} at={[-2.5, 1.7, 0.2]} />
					<Motes t={t} c={[-2.5, HIGH + 0.1, 0.2]} />
				</>
			)}
			{sixthAbove && <Lying s={{name: 'Character_Monster_02', head: SIXTH_UP, dir: '-z', roll: Math.PI / 2}} t={t} seed={11} tint={PALE} />}
			{sixthBelow && (
				<Lying s={{name: 'Character_Monster_02', head: SIXTH_BED, dir: '-z', roll: Math.PI / 2}} t={t} seed={11} tint={PALE} pose={sixthPose} lift={[0.32 * snap, 0.28 * snap, 0.1 * snap]} />
			)}
			{torch}
			{/* my phone's light on my face, in bed */}
			{phone > 0.01 && <pointLight position={[-2.05, LOW + 0.3, -0.45]} intensity={2.2 * phone} distance={1.3} decay={1} color="#e8f0ff" />}
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
		const r = rng(Math.floor(t * 24) * 7919 + 48);
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
export const Episode48: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
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
			{includeAudio && <Audio src={staticFile('assets/audio/ep48-bedspace-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
