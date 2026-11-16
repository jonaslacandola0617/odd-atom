// Episode 49: "Bukas Pa Kagabi" (Season 5: a delivery rider's experience shared online and retold in our
// own words; no real shop, brand, street or barangay). Taglish, Juanito. The PSX models; hard cuts only; an
// eerie score; a seamless loop (the last shot is the first shot, on negative time).
// Form: "the shopfront". One milk tea shop seen through its glass, cut against itself by day. At 2 a.m. it is
// the only light on the corner: a queue of five stands facing the counter, nobody moving. The crew's head
// tips in held-then-snapped steps as she hands over the order and the receipt. Walking out I look back:
// every head has turned round to me, past where a neck goes, the bodies still facing the counter. By day:
// the shutter down, a padlock, dust, FOR RENT; a guard says six months. The receipt in my hand: last night,
// 2:00 a.m. On its back, handwriting: come back, the queue is one short. Night again: she is at the glass.
// Cast: me (rider) Character_14; the queue Character_03, 29_Female, 30, 31_Female, 05; the crew
// Character_Female_12, pale; the guard Character_17_Police.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep49-milktea-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {ARMS_DOWN, merge, Pose, PsxCharacter, SIT} from '../psx/models';
import {CREW_P, Cup, MatsProvider, QUEUE, Receipt, Scooter, Shop, V3} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep49Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep49_sound.py uses the same rules)
export const K = {
	hookTurns: [0.3, 0.75], // the queue's heads round to the lens, two held-then-snapped steps
	cutStreet: L.l02.start - 0.3,
	arrive: L.l02.start + 3.2, // the scooter stops
	cutQueue: L.l03.start - 0.3,
	breath: L.l03.start + 5.6, // the whole queue breathes once, together
	cutCounter: L.l04.start - 0.3,
	tilts: [0.5, 1.5].map((d) => L.l04.start + d), // her head tips, held then snapped
	seal: L.l04.start + 2.3,
	handOver: L.l04.start + 3.0,
	print: L.l04.start + 4.3,
	cutExit: L.l05.start - 0.3,
	exitTurns: [2.0, 2.5, 3.0].map((d) => L.l05.start + d),
	cutDay: L.l06.start - 0.3,
	dayWide: L.l06.start + 2.6,
	rattle: L.l06.start + 1.4,
	cutReceipt: L.l07.start - 0.3,
	flip: L.l08.start + 0.1,
	cutGlass: L.l08.end + 0.3,
	snap: L.l08.end + 0.85, // her head comes up at the lens (the stinger)
	loopShot: DUR - 1.7,
};
export const STINGERS = [K.snap];

type Shot = 'hook' | 'street' | 'queue' | 'counter' | 'exit' | 'lock' | 'day' | 'receipt' | 'glass';
const CUTS: [number, Shot][] = [
	[K.cutStreet, 'hook'],
	[K.cutQueue, 'street'],
	[K.cutCounter, 'queue'],
	[K.cutExit, 'counter'],
	[K.cutDay, 'exit'],
	[K.dayWide, 'lock'],
	[K.cutReceipt, 'day'],
	[K.cutGlass, 'receipt'],
	[K.loopShot, 'glass'],
];
const shotOf = (t: number): Shot => (t < 0 ? 'hook' : CUTS.find(([c]) => t < c)?.[1] ?? 'hook');
/** held-then-snapped: each step is a 0.07 s snap, then held */
const steps = (t: number, at: number[]) => at.reduce((n, a) => n + ease(lin(t, a, a + 0.07)), 0) / at.length;

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
const HOOK = (t: number) => move(t, -1.7, K.cutStreet, [0.5, 1.45, 3.9], [0.45, 1.42, 3.3], [0.05, 1.3, -1.6], [0.05, 1.3, -1.6], 46, 0.05);

const poseAt = (t: number, shot: Shot): CamPose => {
	switch (shot) {
		case 'hook':
			return HOOK(t);
		case 'street':
			return move(t, K.cutStreet, K.cutQueue, [5.5, 5.2, 9.4], [4.8, 4.6, 8.6], [0.4, 1.0, 0.5], [0.3, 1.2, 0.0], 50, 0.06);
		case 'queue':
			// just inside the door, along the queue's backs to the counter: a slow creep
			return move(t, K.cutQueue, K.cutCounter, [1.0, 1.62, -0.25], [0.8, 1.6, -0.55], [0.0, 1.45, -3.8], [0.0, 1.5, -4.0], 50, 0.08);
		case 'counter':
			return move(t, K.cutCounter, K.cutExit, [0.45, 1.6, -2.7], [0.4, 1.58, -2.88], [0.12, 1.42, -4.4], [0.12, 1.44, -4.4], 50, 0.06);
		case 'exit':
			// walking out on to the sidewalk, looking back in through the glass
			return move(t, K.cutExit, K.cutDay, [0.75, 1.6, 0.55], [0.6, 1.6, 1.7], [0.1, 1.5, -2.0], [0.1, 1.5, -2.2], 48, 0.15);
		case 'lock':
			return move(t, K.cutDay, K.dayWide, [0.7, 0.3, 0.5], [0.68, 0.27, 0.42], [0.6, 0.1, 0.12], [0.6, 0.1, 0.12], 50, 0.06);
		case 'day':
			return move(t, K.dayWide, K.cutReceipt, [0.9, 1.45, 5.2], [0.85, 1.42, 4.8], [-0.2, 1.3, 0.3], [-0.2, 1.3, 0.3], 48, 0.1);
		case 'receipt':
			return move(t, K.cutReceipt, K.cutGlass, [0.26, 1.33, 1.24], [0.26, 1.31, 1.2], [0.25, 1.28, 0.9], [0.25, 1.28, 0.9], 50, 0.05);
		case 'glass': {
			const c = move(t, K.cutGlass, K.loopShot, [0.2, 1.52, 0.95], [0.2, 1.5, 0.8], [0.1, 1.42, -0.6], [0.1, 1.45, -0.6], 50, 0.05);
			const jolt = lin(t, K.snap, K.snap + 0.06) * (1 - lin(t, K.snap + 0.06, K.snap + 0.5));
			return {...c, p: [c.p[0] + 0.03 * jolt, c.p[1] - 0.03 * jolt, c.p[2] + 0.04 * jolt]};
		}
	}
};

// ------------------------------------------------------------------ the people
const PALE = {color: '#c8ccc8', emissive: '#141818'};
const GREY = {color: '#b4b8b4'};
/** one in the queue: body to the counter (−z); its head turned round by `turn` (0..1 = half a turn, past where a neck goes) */
const Queuer: React.FC<{name: string; p: V3; turn: number; breath: number; seed: number}> = ({name, p, turn, breath, seed}) => (
	<PsxCharacter
		name={name}
		height={name.includes('Female') ? 1.58 : 1.68}
		tint={GREY}
		position={p}
		rotation={[0, Math.PI, 0]}
		pose={merge(ARMS_DOWN, {
			Spine2: [['x', -0.05 * breath]],
			Neck: [['y', 1.55 * turn * (seed % 2 ? 1 : -1)], ['x', 0.05]],
			Head: [['y', 1.5 * turn * (seed % 2 ? 1 : -1)], ['z', 0.18 * turn]],
		})}
	/>
);

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotOf(t);
	const cam = <Cam get={() => poseAt(t, shot)} />;
	const day = shot === 'lock' || shot === 'day' || shot === 'receipt';
	const queueTurn = shot === 'hook' ? steps(t, K.hookTurns) : shot === 'exit' ? steps(t, K.exitTurns) : 0;
	const breath = shot === 'queue' ? Math.sin(Math.PI * lin(t, K.breath, K.breath + 1.6)) : 0;
	// the queue: whole by night; with a gap where I should stand at the end (the glass shot)
	const queue = !day && shot !== 'street' && (
		<>
			{QUEUE.map((q, i) => (
				<Queuer key={q.name} name={q.name} p={q.p} turn={queueTurn} breath={breath} seed={i} />
			))}
		</>
	);
	// the crew: behind the counter; at the glass in the last shot
	const tilt = shot === 'counter' ? steps(t, K.tilts) : shot === 'exit' ? 1 : 0;
	const hand = shot === 'counter' ? ease(lin(t, K.handOver, K.handOver + 0.5)) : 0;
	const reachT: V3 = [0.32, 1.12 + 0.1 * hand, -3.95 + 0.55 * hand];
	const up = shot === 'glass' ? ease(lin(t, K.snap, K.snap + 0.07)) : 0;
	const crew =
		shot === 'glass' ? (
			<PsxCharacter
				name="Character_Female_12"
				height={1.6}
				tint={PALE}
				position={[0.1, 0, -0.32]}
				rotation={[0, 0, 0]}
				pose={merge(ARMS_DOWN, {Neck: [['x', 0.55 - 0.85 * up]], Head: [['x', 0.25 - 0.35 * up], ['z', 0.35 * up]]})}
			/>
		) : (
			!day &&
			shot !== 'street' && (
				<PsxCharacter
					name="Character_Female_12"
					height={1.6}
					tint={PALE}
					position={CREW_P}
					rotation={[0, 0, 0]}
					pose={merge(ARMS_DOWN, {Neck: [['x', 0.12], ['z', 0.35 * tilt]], Head: [['z', 0.3 * tilt], ['x', 0.1 * tilt]]})}
					reach={shot === 'counter' && t > K.handOver - 0.4 ? {arm: 'Right', target: reachT} : undefined}
				/>
			)
		);
	return (
		<>
			{cam}
			<ambientLight intensity={day ? 2.4 : 1.5} color={day ? '#d8d4c8' : '#5a6478'} />
			{day && <directionalLight position={[6, 10, 8]} intensity={1.1} color="#fff2d8" />}
			{!day && <pointLight position={[0.2, 1.6, 1.8]} intensity={1.2} distance={4} decay={1} color="#c8d8e8" />}
			{/* a cold fill from the glass, so the turned faces read against the tubes behind them */}
			{(shot === 'hook' || shot === 'exit' || shot === 'glass') && <pointLight position={[0.4, 1.7, -0.15]} intensity={3.2} distance={4.5} decay={1} color="#d0e0f0" />}
			<Shop day={day} t={t} />
			{queue}
			{crew}
			{shot === 'counter' && hand > 0 && <Cup p={[reachT[0], reachT[1] + 0.02, reachT[2]]} />}
			{shot === 'counter' && t > K.seal - 0.8 && hand === 0 && <Cup p={[0.9, 1.1, -3.95]} />}
			{shot === 'counter' && t > K.print + 0.4 && <Receipt p={[0.3, 1.03, -3.7]} flip={0} sway={0} />}
			{shot === 'street' && (
				<>
					<Scooter p={[lin(t, K.cutStreet, K.arrive, 9, 0.9) * 1, 0, 2.6]} ry={-Math.PI / 2} light />
					<PsxCharacter name="Character_14" height={1.7} position={[lin(t, K.cutStreet, K.arrive, 9, 0.9) + 0.05, 0.12, 2.6]} rotation={[0, -Math.PI / 2, 0]} pose={merge(SIT, {LeftArm: [['aim', [0.25, -0.5, 1]]], RightArm: [['aim', [-0.25, -0.5, 1]]], LeftForeArm: [['aim', [0.1, -0.1, 1]]], RightForeArm: [['aim', [-0.1, -0.1, 1]]]})} />
				</>
			)}
			{shot === 'day' && <Guard t={t} />}
			{shot === 'receipt' && <Receipt p={[0.25, 1.28, 0.95]} flip={ease(lin(t, K.flip, K.flip + 0.35))} sway={Math.sin(t * 1.3)} />}
		</>
	);
};
const Guard: React.FC<{t: number}> = ({t}) => {
	const point = ease(lin(t, L.l06.start + 4.6, L.l06.start + 5.0));
	return (
		<PsxCharacter
			name="Character_17_Police"
			height={1.72}
			position={[-0.55, 0, 1.3]}
			rotation={[0, 0.37, 0]}
			pose={merge(ARMS_DOWN, {
				RightArm: [['aim', [-0.2 - 0.8 * point, -1 + 0.8 * point, -0.4 * point]]],
				RightForeArm: [['aim', [-0.1 - 0.9 * point, -1 + 1.0 * point, -0.5 * point]]],
				Neck: [['y', -0.3 * point]],
			})}
		/>
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
		const r = rng(Math.floor(t * 24) * 7919 + 49);
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
export const Episode49: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
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
			{includeAudio && <Audio src={staticFile('assets/audio/ep49-milktea-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
