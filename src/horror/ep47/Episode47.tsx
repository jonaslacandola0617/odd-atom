// Episode 47: "Sa Pader ng Bahay ni Lola" (Season 5: a childhood experience in an old house up north,
// shared online and retold in our own words; no real house, town or family). Taglish, Juanito. The PSX
// models; hard cuts only; an eerie score; a seamless loop (the last shot is the first shot, on
// negative time).
// Form: "the wall". A child's height, the old planks close, and what moves behind the gaps: small
// lights in a procession, dust sifting out, the gaps lighting one by one toward my head when my name
// is called; my ear to the planks; silence; an eye in the gap; and Lola, who told me not to answer,
// lying beside me with her eyes open and her head turned round to me further than a head turns.
// Me: Character_10 at a child's height (head ×1.35). Lola: Character_29_Female. Care: the child is
// never harmed; Lola is loved; the engkanto are never shown, only lights and an eye.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep47-wall-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {ARMS_DOWN, merge, Pose, PsxCharacter} from '../psx/models';
import {Behind, Dust, GAPS, House, MatsProvider, PlankWall, Room, V3} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep47Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep47_sound.py uses the same rules)
const EAR_GAP = GAPS[4] - 0.04; // the hole by my ear (z ≈ −0.94), in the split plank
export const K = {
	cutHouse: L.l02.start - 0.3,
	cutRoom: L.l03.start - 0.3,
	lampOut: L.l03.start + 0.6, // Lola blows out the gasera
	chatter: L.l03.start + 1.4, // they begin
	cutLola: L.l04.start - 0.3,
	cutCall: L.l05.start - 0.3,
	call: L.l05.start + 0.3, // the gaps light one by one toward my head (my name, from the wall)
	callSteps: 9,
	cutEar: L.l06.start - 0.3,
	answer: L.l06.end - 0.9, // I answer
	hush: L.l06.end + 0.35, // everything stops
	cutDark: L.l07.start - 0.3,
	whisper: L.l07.end + 0.1, // Lola's voice from the other side
	eye: L.l07.end + 0.25,
	cutTurn: L.l08.start - 0.3,
	snap: L.l08.end + 0.6, // her head snaps up and round at the lens (the stinger)
	loopShot: DUR - 1.7,
};
export const STINGERS = [K.snap];

type Shot = 'hook' | 'house' | 'room' | 'lola' | 'call' | 'ear' | 'dark' | 'turn';
const CUTS: [number, Shot][] = [
	[K.cutHouse, 'hook'],
	[K.cutRoom, 'house'],
	[K.cutLola, 'room'],
	[K.cutCall, 'lola'],
	[K.cutEar, 'call'],
	[K.cutDark, 'ear'],
	[K.cutTurn, 'dark'],
];
const shotOf = (t: number): Shot => CUTS.find(([c]) => t < c)?.[1] ?? 'turn';

// ------------------------------------------------------------------ the people
const CHILD: Pose = {Head: [['scale', 1.35]]};
/** someone lying on their back on the floor bed, head toward −z. look: head turned toward the wall
 *  (−1, me) or toward me (Lola: −1 as well, the wall is on her right too); lift: head raised. */
const Lying: React.FC<{name: string; p: V3; height: number; t: number; seed: number; look?: number; lift?: number; child?: boolean}> = ({name, p, height, t, seed, look = 0, lift = 0, child}) => (
	<group position={p}>
		<PsxCharacter
			name={name}
			height={height}
			position={[0, 0, 0]}
			rotation={[-Math.PI / 2, 0, 0]}
			pose={merge(ARMS_DOWN, child ? CHILD : {}, {
				Spine2: [['x', Math.sin(t * 1.3 + seed) * 0.03]],
				Neck: [['x', 0.2 + 0.4 * lift], ['y', -1.05 * look]],
				Head: [['y', -0.75 * look], ['x', 0.15 * lift]],
			})}
		/>
	</group>
);
const ME_P: V3 = [-1.66, 0.26, 0.2];
const LOLA_P: V3 = [-1.12, 0.27, 0.6];

/** Lola standing, a finger to her lips, shaking her head */
const LolaStanding: React.FC<{t: number}> = ({t}) => {
	const shake = 0.28 * Math.sin(t * 6) * lin(t, L.l04.start + 1.4, L.l04.start + 1.8) * (1 - lin(t, L.l04.end - 0.4, L.l04.end));
	return (
		<PsxCharacter
			name="Character_29_Female"
			height={1.52}
			position={[-0.55, 0, -0.35]}
			rotation={[0, -2.0, 0]}
			pose={merge(ARMS_DOWN, {
				Spine: [['x', 0.18]],
				Neck: [['x', 0.35], ['y', shake]],
				Head: [['x', 0.2]],
				RightArm: [['aim', [-0.15, -0.55, 0.75]]],
				RightForeArm: [['aim', [0.6, 0.38, 0.45]]],
			})}
		/>
	);
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

const poseAt = (t: number, shot: Shot): CamPose => {
	switch (shot) {
		case 'hook':
			return move(t, -1.7, K.cutHouse, [-1.4, 0.78, -0.05], [-1.5, 0.76, -0.2], [-2.0, 0.62, -0.25], [-2.0, 0.6, -0.35], 52, 0.06);
		case 'house':
			return move(t, K.cutHouse, K.cutRoom, [6.5, 1.6, 17], [5.2, 2.8, 13.5], [-0.5, 3.6, 0], [-0.8, 3.9, 0], 52, 0.1);
		case 'room':
			return move(t, K.cutRoom, K.cutLola, [-0.35, 0.95, 1.8], [-0.5, 0.88, 1.5], [-1.75, 0.45, -0.6], [-1.8, 0.45, -0.7], 58, 0.08);
		case 'lola':
			// up at her from my pillow
			return move(t, K.cutLola, K.cutCall, [-1.62, 0.5, -0.95], [-1.6, 0.52, -0.9], [-0.62, 1.35, -0.32], [-0.6, 1.4, -0.32], 56, 0.05);
		case 'call':
			// my eyes on the wall, lying
			return move(t, K.cutCall, K.cutEar, [-1.55, 0.55, -0.85], [-1.6, 0.52, -0.82], [-2.0, 0.55, 0.1], [-2.0, 0.5, -0.2], 60, 0.04);
		case 'ear':
			return move(t, K.cutEar, K.cutDark, [-1.25, 0.95, -0.4], [-1.32, 0.88, -0.48], [-1.88, 0.32, -0.86], [-1.9, 0.32, -0.86], 52, 0.05);
		case 'dark':
			return move(t, K.cutDark, K.cutTurn, [-1.48, 0.62, -0.42], [-1.6, 0.55, -0.58], [-2.0, 0.38, -0.9], [-2.0, 0.38, -0.9], 48, 0.04);
		case 'turn': {
			// from the wall, round to Lola beside me
			const k = ease(lin(t, K.cutTurn + 0.3, K.cutTurn + 1.5));
			const hh = handheld(t, 0.1);
			const p: V3 = [-1.72, 0.78, -0.52];
			const jolt = lin(t, K.snap, K.snap + 0.06) * (1 - lin(t, K.snap + 0.06, K.snap + 0.5));
			return {p: [p[0] + hh.dp[0] * 0.2, p[1] + hh.dp[1] * 0.2 - 0.03 * jolt, p[2] - 0.05 * jolt], l: mix3([-2.0, 0.5, -0.8], [-1.12, 0.34, -0.82], k), fov: 52};
		}
	}
};

// ------------------------------------------------------------------ the scene
/** what is behind the planks at t */
const behindAt = (t: number, shot: Shot): Behind => {
	const procession = (t0: number, k: number): Behind => ({
		lights: Array.from({length: 5}, (_, i) => {
			const z = 1.9 - 0.42 * (t - t0) - i * 0.35;
			return ((((z + 2) % 4) + 4) % 4) - 2;
		}),
		k,
	});
	if (shot === 'hook') return procession(-20, 1);
	if (shot === 'room') return procession(K.chatter, lin(t, K.chatter, K.chatter + 0.8));
	if (shot === 'call') {
		// one light stepping gap to gap toward my head, held then snapped
		const n = Math.min(K.callSteps, Math.floor(Math.max(0, t - K.call) / 0.55));
		return {lights: [GAPS[13 - n] ?? GAPS[4]], k: t > K.call ? 1 : 0};
	}
	if (shot === 'ear') return {lights: [EAR_GAP - 0.02, EAR_GAP + 0.05], k: t < K.hush ? 1 : 0};
	if (shot === 'dark') return {lights: [], k: 0, eye: {z: EAR_GAP, y: 0.36, open: ease(lin(t, K.eye, K.eye + 0.5))}};
	if (shot === 'turn') return {lights: [EAR_GAP], k: lin(t, K.snap - 0.05, K.snap) * 0.9, eye: {z: EAR_GAP, y: 0.36, open: 1}};
	return {lights: [], k: 0};
};

const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotOf(t);
	const cam = <Cam get={() => poseAt(t, shot)} />;
	if (shot === 'house')
		return (
			<>
				{cam}
				<ambientLight intensity={1.5} color="#4a5a78" />
				<House lit={1} />
			</>
		);
	const behind = behindAt(t, shot);
	const lamp = shot === 'room' ? 1 - lin(t, K.lampOut, K.lampOut + 0.15) : shot === 'lola' ? 1 : 0;
	// Lola beside me: in the last shot her head is turned round to me, too far, and lifts on the snap
	const snap = ease(lin(t, K.snap, K.snap + 0.07));
	return (
		<>
			{cam}
			<ambientLight intensity={shot === 'lola' ? 1.6 : 1.5} color="#5a6480" />
			{/* moonlight from the capiz, soft, near the lens */}
			<pointLight position={[-1.0, 1.4, 0.2]} intensity={1.4} distance={3.2} decay={1} color="#7a8cb8" />
			<Room lamp={lamp} t={t} />
			<PlankWall behind={behind} t={t} />
			{(shot === 'hook' || (shot === 'room' && t > K.chatter)) && <Dust zs={behind.lights.slice(0, 3).map((z) => GAPS.reduce((b, g) => (Math.abs(g - z) < Math.abs(b - z) ? g : b), GAPS[0]))} t={t} />}
			{shot !== 'lola' && <Lying name="Character_10" p={ME_P} height={1.15} t={t} seed={1} child look={shot === 'ear' || shot === 'dark' ? 1 : 0} />}
			{shot === 'lola' && <Lying name="Character_10" p={ME_P} height={1.15} t={t} seed={1} child />}
			{shot === 'lola' ? (
				<LolaStanding t={t} />
			) : (
				<Lying name="Character_29_Female" p={LOLA_P} height={1.52} t={t} seed={2} look={shot === 'turn' ? 1 + 0.25 * snap : 0} lift={shot === 'turn' ? 0.4 * snap : 0} />
			)}
			{/* a cold moon on Lola's face in the last shot */}
			{shot === 'turn' && <pointLight position={[-0.6, 1.2, -0.9]} intensity={0.8} distance={2} decay={1} color="#8aa0c8" />}
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
		const r = rng(Math.floor(t * 24) * 7919 + 47);
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
export const Episode47: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const tv = t >= K.loopShot ? t - DUR : t;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: 'scale(' + SCALE + ')', transformOrigin: '0 0', filter: 'saturate(0.62) contrast(1.15) hue-rotate(-4deg)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.02, far: 120}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			<Overlay t={tv} captions={captions} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep47-wall-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
