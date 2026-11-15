// Episode 42: "Ikalabing-apat" (Season 5: a night guard's experience shared online, retold in our own
// words; no real building, agency or company). Taglish, Juanito. The PSX models; hard cuts only; an eerie
// score; a seamless loop (the last shot is the first shot, on negative time).
// Form: "the monitor". The lobby in colour, the 14th floor only through its CCTV (grey, 8 fps, so
// everything on it moves in stop-motion). Night by night the doors open on the 14th, and someone is
// nearer them; on the third night her head turns round to the camera. Last night she wasn't there.
// Tonight the guard stands aside at the lobby doors; on the lobby camera she walks out past him, and
// her head snaps up to the lens. Then the doors open on the empty car again (loop).
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep42-lift-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {ARMS_DOWN, merge, Pose, PsxCharacter, SIT} from '../psx/models';
import {F14, Floor, Floor14, Lobby, LOBBY, MatsProvider, V3} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep42Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep42_sound.py uses the same rules)
export const K = {
	ding: 0.15,
	open0: [0.35, 1.5] as [number, number], // the hook's doors open on the empty car
	cutDesk: L.l02.start - 0.3,
	cutMonitor: L.l03.start - 0.3,
	cutC1: L.l04.start - 0.3,
	c1Open: L.l04.start + 3.4,
	cutC2: L.l05.start - 0.3,
	c2Open: L.l05.start - 0.3 + 0.5,
	cutC3: L.l06.start - 0.3,
	snaps: [0.25, 0.6, 0.95].map((d) => L.l06.end + d), // her head turns round to the camera
	c3Open: L.l06.end + 1.0,
	cutC4: L.l07.start - 0.3,
	cutCount: L.l07.end + 0.25,
	cutEnd: L.l08.start - 0.3,
	endOpen: L.l08.start + 1.6,
	cutCctvL: L.l08.end + 0.15,
	tip: L.l08.end + 0.95, // on the lobby camera her head snaps up to the lens (the stinger)
	loopShot: DUR - 1.7,
};
export const STINGERS = [K.tip];

type Shot = 'hook' | 'desk' | 'monitor' | 'c1' | 'c2' | 'c3' | 'c4' | 'count' | 'end' | 'cctvL';
const CUTS: [number, Shot][] = [
	[K.cutDesk, 'hook'],
	[K.cutMonitor, 'desk'],
	[K.cutC1, 'monitor'],
	[K.cutC2, 'c1'],
	[K.cutC3, 'c2'],
	[K.cutC4, 'c3'],
	[K.cutCount, 'c4'],
	[K.cutEnd, 'count'],
	[K.cutCctvL, 'end'],
];
const shotOf = (t: number): Shot => CUTS.find(([c]) => t < c)?.[1] ?? 'cctvL';
const isCctv = (s: Shot) => s === 'c1' || s === 'c2' || s === 'c3' || s === 'c4' || s === 'cctvL';

/** a door that opens at a and closes after hold seconds */
const doors = (t: number, a: number, hold = 3.0) => ease(lin(t, a, a + 1.1)) * (1 - ease(lin(t, a + 1.1 + hold, a + 2.2 + hold)));
const down = (labels: string[], t: number, t0: number, step: number): Floor => {
	const i = Math.max(0, Math.min(labels.length - 1, Math.floor((t - t0) / step)));
	return {label: labels[i], down: i < labels.length - 1};
};
const COUNT = ['14', '12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', 'L'];

/** the lobby's elevator: floor shown and door opening */
const lobbyLift = (t: number, shot: Shot): {floor: Floor; open: number} => {
	switch (shot) {
		case 'hook':
			return {floor: t < -1.0 ? {label: '3', down: true} : t < -0.3 ? {label: '2', down: true} : {label: 'L', down: false}, open: doors(t, K.open0[0], 4.2)};
		case 'count':
			return {floor: down(COUNT, t, K.cutCount - 0.35, (K.cutEnd - 0.3 - K.cutCount) / (COUNT.length - 1)), open: 0};
		case 'end':
		case 'cctvL':
			return {floor: {label: 'L', down: false}, open: ease(lin(t, K.endOpen, K.endOpen + 1.1))};
		case 'monitor':
			return {floor: {label: '14', down: false}, open: 0};
		default:
			return {floor: {label: 'L', down: false}, open: 0};
	}
};
const floor14 = (t: number, shot: Shot): {floor: Floor; open: number} => {
	switch (shot) {
		case 'c1':
			return {floor: {label: '14', down: false}, open: doors(t, K.c1Open, 2.5)};
		case 'c2':
			return {floor: {label: '14', down: false}, open: doors(t, K.c2Open, 3.0)};
		case 'c3':
			return {floor: {label: '14', down: false}, open: ease(lin(t, K.c3Open, K.c3Open + 1.1))};
		default:
			return {floor: down(COUNT, t, K.cutC4 + 1.2, 0.4), open: 0};
	}
};

// ------------------------------------------------------------------ the people
const PALE = {color: '#d4dce0', emissive: '#20282c'};
/** the guard: seated at the desk (looking at the monitor or, look 1, toward the elevator), or standing
 *  aside by the elevator, head bowed */
const Guard: React.FC<{t: number; seated: boolean; look?: number}> = ({t, seated, look = 0}) => {
	const b = Math.sin(t * 1.5) * 0.025;
	return seated ? (
		<PsxCharacter
			name="Character_17_Police"
			height={1.72}
			position={[LOBBY.deskP[0] + 0.02, -0.27, LOBBY.deskP[2] + 0.72]}
			rotation={[0, Math.PI, 0]}
			pose={merge(SIT, {
				Spine2: [['x', 0.08 + b]],
				Neck: [['x', 0.2], ['y', 0.2 + 0.35 * look]],
				Head: [['y', 0.1 + 0.25 * look]],
				LeftForeArm: [['aim', [0.15, 0.25, 1]]],
				RightForeArm: [['aim', [-0.15, 0.25, 1]]],
			})}
		/>
	) : (
		<PsxCharacter
			name="Character_17_Police"
			height={1.72}
			position={[-1.0, 0, LOBBY.liftZ + 0.45]}
			rotation={[0, 0.25, 0]}
			pose={merge(ARMS_DOWN, {Spine2: [['x', b]], Neck: [['x', 0.45]], Head: [['x', 0.15]], LeftForeArm: [['aim', [-0.3, -0.6, 0.6]]], RightForeArm: [['aim', [0.3, -0.6, 0.6]]]})}
		/>
	);
};
/** her: Character_Female_09, pale, long dark hair, head bowed. turn: her head round toward her left
 *  (past where a neck goes); up: the head lifted toward the lens; walk: a stride phase (0 = still). */
const Her: React.FC<{p: V3; ry: number; turn?: number; up?: number; tilt?: number; walk?: number}> = ({p, ry, turn = 0, up = 0, tilt = 0, walk}) => {
	const s = walk === undefined ? 0 : Math.sin(walk);
	const legs: Pose =
		walk === undefined
			? {}
			: {
					LeftUpLeg: [['aim', [0.05, -1, 0.35 * s]]],
					RightUpLeg: [['aim', [-0.05, -1, -0.35 * s]]],
					LeftLeg: [['aim', [0, -1, -0.2 + 0.2 * s]]],
					RightLeg: [['aim', [0, -1, -0.2 - 0.2 * s]]],
				};
	return (
		<PsxCharacter
			name="Character_Female_09"
			height={1.6}
			tint={PALE}
			position={p}
			rotation={[0, ry, 0]}
			pose={merge(ARMS_DOWN, legs, {
				Neck: [['x', 0.55 * (1 - up)], ['y', 1.0 * turn]],
				Head: [['x', 0.25 * (1 - up) - 0.45 * up], ['y', 1.1 * turn], ['z', 0.9 * tilt]],
			})}
		/>
	);
};
const stepped = (t: number, steps: number[], snap = 0.1) => steps.reduce((v, s) => v + ease(lin(t, s, s + snap)) / steps.length, 0);

// ------------------------------------------------------------------ cameras
type CamPose = {p: V3; l: V3; fov: number};
const aim = (camera: THREE.Camera, pose: CamPose) => {
	camera.position.set(...pose.p);
	camera.up.set(0, 1, 0);
	camera.lookAt(...pose.l);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = pose.fov;
	c.near = 0.02;
	c.far = 80;
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
	return {p: [p[0] + hh.dp[0] * 0.3, p[1] + hh.dp[1] * 0.3, p[2]], l: mix3(la, lb, k), fov};
};
const o14 = (v: V3): V3 => [v[0] + F14.origin[0], v[1] + F14.origin[1], v[2] + F14.origin[2]];
const CCTV14: CamPose = {p: o14([1.0, 2.5, 0.9]), l: o14([-0.85, 0.85, -5.2]), fov: 64};
const CCTVL: CamPose = {p: [-2.6, 2.9, 0.6], l: [-0.1, 1.0, -3.0], fov: 52};
const LIFT_L: V3 = [0, 1.15, LOBBY.liftZ];

const poseAt = (t: number, shot: Shot): CamPose => {
	switch (shot) {
		case 'hook':
			return move(t, -1.7, K.cutDesk, [2.55, 1.3, 0.2], [2.3, 1.3, -0.3], LIFT_L, LIFT_L, 50);
		case 'desk':
			return move(t, K.cutDesk, K.cutMonitor, [2.68, 1.02, -1.55], [2.6, 1.04, -1.35], [2.2, 1.18, 0.12], [2.2, 1.18, 0.12], 52);
		case 'monitor':
			return move(t, K.cutMonitor, K.cutC1, [2.0, 1.2, 0.45], [1.98, 1.14, 0.3], [1.94, 0.96, -0.62], [1.94, 0.96, -0.62], 42, 0.08);
		case 'count':
			return move(t, K.cutCount, K.cutEnd, [0.35, 2.2, -2.5], [0.25, 2.25, -2.85], [0, 2.38, LOBBY.liftZ], [0, 2.38, LOBBY.liftZ], 32, 0.15);
		case 'end':
			return move(t, K.cutEnd, K.cutCctvL, [1.95, 1.38, 0.5], [1.7, 1.36, 0.0], [-0.45, 1.15, LOBBY.liftZ], [-0.4, 1.12, LOBBY.liftZ], 52);
		case 'cctvL':
			return CCTVL;
		default:
			return CCTV14;
	}
};

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotOf(t);
	const cam = <Cam get={() => poseAt(t, shot)} />;
	if (shot === 'c1' || shot === 'c2' || shot === 'c3' || shot === 'c4') {
		const f = floor14(t, shot);
		const tube = 0.75 + 0.25 * Math.sin(t * 31) * Math.sin(t * 7.3) > 0.62 ? 1 : 0.2;
		// night two: at the far end, and a little nearer each second; night three: at the doors
		const n2z = -11.0 + 0.18 * Math.floor((t - K.cutC2) / 1.1);
		return (
			<>
				{cam}
				<ambientLight intensity={1.3} color="#8a96a8" />
				<Floor14 open={f.open} floor={f.floor} tube={tube} />
				{shot === 'c2' && <Her p={o14([0.25, 0, n2z])} ry={0} />}
				{shot === 'c3' && <Her p={o14([-0.45, 0, F14.liftZ])} ry={-Math.PI / 2} turn={stepped(t, K.snaps)} up={0.4 * stepped(t, K.snaps)} />}
			</>
		);
	}
	const lift = lobbyLift(t, shot);
	const flick = shot === 'hook' && t > 4.0 && t < 4.35 ? 0.15 : shot === 'end' && t > K.endOpen + 1.6 && t < K.endOpen + 1.9 ? 0.2 : 1;
	// her walk out of the car on the lobby camera (in stop-motion: the CCTV runs at 8 fps)
	const wk = lin(t, K.cutCctvL - 0.4, K.loopShot + 0.3);
	return (
		<>
			{cam}
			<ambientLight intensity={1.15} color="#6a7488" />
			{[[-2, 0.5], [2, -2], [2, 3]].map(([x, z]) => (
				<pointLight key={`${x}${z}`} position={[x, LOBBY.h - 0.3, z]} intensity={1.3} distance={5.5} decay={1} color="#e6eeff" />
			))}
			<pointLight position={[LOBBY.deskP[0] + 0.5, 1.15, LOBBY.deskP[2] + 0.1]} intensity={1.1} distance={2.2} decay={1} color="#ffcc88" />
			<pointLight position={[LOBBY.deskP[0] - 0.25, 1.0, LOBBY.deskP[2] + 0.35]} intensity={0.7} distance={1.2} decay={1} color="#7affb0" />
			<pointLight position={[0, 2.2, 5.6]} intensity={1.6} distance={7} decay={1} color="#ffa860" />
			<Lobby open={lift.open} floor={lift.floor} carLight={flick} t={t} />
			{(shot === 'desk' || shot === 'count') && <Guard t={t} seated look={shot === 'desk' ? ease(lin(t, L.l02.end - 0.2, L.l02.end + 0.5)) : 0} />}
			{(shot === 'end' || shot === 'cctvL') && <Guard t={t} seated={false} />}
			{shot === 'cctvL' && (
				<Her p={[0.15, 0, LOBBY.liftZ - 0.9 + 2.6 * wk]} ry={0} walk={wk * 14} up={ease(lin(t, K.tip, K.tip + 0.09))} tilt={ease(lin(t, K.tip, K.tip + 0.09))} />
			)}
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: captions, grain
const Overlay: React.FC<{t: number; captions: boolean; osd: string[] | null}> = ({t, captions, osd}) => {
	const cap = useRef<HTMLCanvasElement>(null);
	const noise = useRef<HTMLCanvasElement>(null);
	useLayoutEffect(() => {
		const CW = 360, CH = 640;
		const g = cap.current!.getContext('2d')!;
		g.clearRect(0, 0, CW, CH);
		const out = (s: string, x: number, y: number, fill: string, align: CanvasTextAlign = 'center') => {
			g.textAlign = align;
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
		if (osd) {
			// the CCTV's on-screen display: channel, night, clock, REC
			g.font = 'bold 13px "DejaVu Sans Mono", monospace';
			g.textAlign = 'left';
			out(osd[0], 14, 40, '#f0f0f0', 'left');
			out(osd[1], 14, 58, '#f0f0f0', 'left');
			out(osd[2], CW - 14, 40, '#f0f0f0', 'right');
			if (Math.floor(t * 2) % 2 === 0) out('● REC', CW - 14, 58, '#ff4a3a', 'right');
		}
		const img = g.getImageData(0, 0, CW, CH);
		for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 120 ? 255 : 0;
		g.putImageData(img, 0, 0);
		const n = noise.current!.getContext('2d')!;
		const ni = n.createImageData(LW, LH);
		const r = rng(Math.floor(t * 24) * 7919 + 42);
		for (let i = 0; i < ni.data.length; i += 4) {
			const v = r() * 255;
			ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = v;
			ni.data[i + 3] = 20 * (r() < 0.5 ? 1 : 0.4);
		}
		n.putImageData(ni, 0, 0);
	}, [t, captions, osd]);
	return (
		<>
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

// ------------------------------------------------------------------ assembly

export const Episode42: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	// the loop shot runs on negative time: the hook's own first moments
	const tv = t >= K.loopShot ? t - DUR : t;
	const shot = shotOf(tv);
	const cctv = isCctv(shot);
	// the CCTV records at 8 fps: its picture (and everything in it) moves in steps
	const ts = cctv ? Math.floor(tv * 8) / 8 : tv;
	const night = shot === 'c1' ? 'GABI 1' : shot === 'c2' ? 'GABI 2' : shot === 'c3' ? 'GABI 3' : shot === 'c4' ? 'KAGABI' : 'NGAYON';
	const clock = (s0: number) => {
		const s = 12 + Math.floor(ts - s0);
		return `03:00:${String(s).padStart(2, '0')}`;
	};
	const start = CUTS.find(([, s]) => s === shot);
	const s0 = shot === 'cctvL' ? K.cutCctvL : start ? (CUTS[CUTS.indexOf(start) - 1]?.[0] ?? 0) : 0;
	const osd = cctv ? [shot === 'cctvL' ? 'CH01 LOBBY' : 'CH07 14F', night, clock(s0)] : null;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: 'scale(' + SCALE + ')', transformOrigin: '0 0', filter: cctv ? 'grayscale(1) contrast(1.35) brightness(1.15)' : 'saturate(0.62) contrast(1.15) hue-rotate(-6deg)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.02, far: 80}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={ts} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			{cctv && <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 6px, rgba(0,0,0,0) 6px, rgba(0,0,0,0) 12px)'}} />}
			<Overlay t={tv} captions={captions} osd={osd} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep42-lift-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
