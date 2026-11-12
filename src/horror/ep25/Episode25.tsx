// Episode 25: "Camera Three" (Season 3, a real reported case: the Hampton Court Palace CCTV figure,
// October 2003). Built to the motion rule and the no-gimmick-transitions rule (hard cuts only).
// Form: a guard's handheld night patrol (colour, torch, walking), cut hard against the palace CCTV
// (monochrome, 8 frames a second, timestamps): camera 4 full screen on the fire doors; the four-camera
// wall with a slow push-in; camera 3 full screen.
// The picture tells it: the doors burst open on camera 4; the guard walks the gallery and pushes
// them shut; on camera 4 the doors burst open again and a robed figure with a pale face steps out
// and pulls them shut (as the released footage was described); the guard hurries back: shut; on the
// camera wall, camera 3 shows a figure in the gallery behind him, closer each time; camera 3 full
// screen: right behind him; he turns: the gallery is empty; the torch dies; the pale face in the
// green of the EXIT sign; black.
// Care: no staff named; no historical identity claimed for the figure; the skeptics' view is said.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep25-hampton-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {COURT, Court, DOORS_Z, Gallery, Guard, Hands, MatsProvider, Robed, STAIRS, Stairs, V3} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep25Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));

// ------------------------------------------------------------------ key times (scripts/ep25_sound.py uses the same rules)
export const K = {
	burst1: L.l01.end + 0.35,
	cutPOV1: L.l01.end + 1.75,
	reach: L.l03.end + 0.35, // the guard reaches the doors
	shut1: [L.l03.end + 0.5, L.l03.end + 1.3] as [number, number],
	cutGrid1: L.l04.start - 0.1,
	cutCam4: L.l04.end + 0.15,
	burst2: L.l04.end + 0.45,
	figure: [L.l05.start + 0.2, L.l05.start + 1.6] as [number, number], // it appears in the doorway, steps out
	pull: [L.l05.end - 1.6, L.l05.end + 0.6] as [number, number], // it pulls the doors shut behind it
	cutPOV2: L.l05.end + 2.0,
	cutGrid2: L.l06.end + 0.4,
	behind: [L.l07.start + 0.6, L.l09.end] as [number, number], // on camera 3, behind the guard, closer
	cutCam3: L.l09.end + 0.25,
	cutTurn: L.l09.end + 1.6,
	torchOut: L.l09.end + 2.55,
	face: [L.l09.end + 2.6, L.l09.end + 2.8] as [number, number],
};
export const STINGERS = [K.burst1, K.burst2, K.face[0]];

type Shot = 'cam4' | 'pov1' | 'grid1' | 'cam4b' | 'pov2' | 'grid2' | 'cam3' | 'turn' | 'black';
const shotAt = (t: number): Shot => {
	if (t < K.cutPOV1) return 'cam4';
	if (t < K.cutGrid1) return 'pov1';
	if (t < K.cutCam4) return 'grid1';
	if (t < K.cutPOV2) return 'cam4b';
	if (t < K.cutGrid2) return 'pov2';
	if (t < K.cutCam3) return 'grid2';
	if (t < K.cutTurn) return 'cam3';
	if (t < K.face[1]) return 'turn';
	return 'black';
};

// ------------------------------------------------------------------ the state of the world at time t
const doorsAt = (t: number) => {
	const burst = (t0: number) => (t >= t0 ? Math.min(1, (t - t0) / 0.12) * (1 + 0.08 * Math.exp(-(t - t0) * 6) * Math.sin((t - t0) * 30)) : 0);
	if (t < K.shut1[0]) return burst(K.burst1);
	if (t < K.burst2) return 1 - ease(lin(t, K.shut1[0], K.shut1[1]));
	if (t < K.pull[0]) return burst(K.burst2);
	return 1 - ease(lin(t, K.pull[0], K.pull[1]));
};
// the guard's position in the gallery (z) at time t
const guardZ = (t: number) => {
	if (t < K.cutPOV1) return 7;
	if (t < K.reach) return 7 + (DOORS_Z + 1.2 - 7) * ease(lin(t, K.cutPOV1, K.reach));
	if (t < K.cutPOV2) return DOORS_Z + 1.2 + 6 * lin(t, K.shut1[1] + 0.4, K.cutGrid1 + 2); // he walks away again
	return -2 + (DOORS_Z + 1.2 + 2) * ease(lin(t, K.cutPOV2, K.cutGrid2 - 0.3));
};
// the robed figure: in the doorway on camera 4; later in the gallery behind the guard
const figureAt = (t: number): {p: V3; ry: number; arm: number} | null => {
	if (t >= K.figure[0] && t < K.pull[1] - 0.2) {
		const step = ease(lin(t, K.figure[0], K.figure[1]));
		const back = ease(lin(t, K.pull[0], K.pull[1] - 0.3));
		return {p: [0.1, 0, DOORS_Z - 1.0 + step * 0.9 - back * 1.1], ry: 0, arm: lin(t, K.pull[0] - 0.6, K.pull[0]) * (1 - back * 0.5)};
	}
	if (t >= K.cutTurn) {
		// he turns: the gallery is empty; when the torch dies, it is right in front of him
		if (t < K.face[0]) return null;
		const pv = povPose(t, 'turn').pose;
		const dx = pv.l[0] - pv.p[0], dz = pv.l[2] - pv.p[2], d = Math.hypot(dx, dz);
		return {p: [pv.p[0] + (dx / d) * 1.6, 0, pv.p[2] + (dz / d) * 1.6], ry: Math.atan2(-dx, -dz), arm: 0};
	}
	if (t >= K.cutGrid1 && t < K.cutCam4) {
		// a hidden detail: on the first camera wall, it is already standing far down the gallery (camera 3)
		return {p: [-0.6, 0, DOORS_Z + 7.6], ry: 0.15, arm: 0};
	}
	if (t >= K.behind[0] && t < K.cutTurn) {
		const z = interpolate(t, [K.behind[0], K.behind[1], K.cutTurn], [DOORS_Z + 7.0, DOORS_Z + 4.0, DOORS_Z + 2.1], cl);
		return {p: [-0.35, 0, z], ry: 0.15, arm: 0}; // it faces the camera, behind the guard's back
	}
	return null;
};

// ------------------------------------------------------------------ cameras
type CamPose = {p: V3; l: V3; fov: number; roll?: number};
const CCTV: Record<'c1' | 'c2' | 'c3' | 'c4', CamPose> = {
	c4: {p: [1.2, 3.1, DOORS_Z + 6.5], l: [0, 1.1, DOORS_Z], fov: 52},
	c3: {p: [1.1, 3.0, DOORS_Z + 8.5], l: [0, 1.1, DOORS_Z + 0.5], fov: 50},
	c2: {p: [STAIRS[0] + 2, 3.5, 3], l: [STAIRS[0], 1.5, -3], fov: 60},
	c1: {p: [COURT[0] + 6, 4, 8], l: [COURT[0], 2, -8], fov: 58},
};

const Cam: React.FC<{pose: CamPose}> = ({pose}) => {
	const {camera} = useThree();
	camera.position.set(...pose.p);
	camera.up.set(Math.sin(pose.roll ?? 0), Math.cos(pose.roll ?? 0), 0);
	camera.lookAt(...pose.l);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = pose.fov;
	c.near = 0.03;
	c.far = 200;
	camera.updateProjectionMatrix();
	return null;
};

const povPose = (t: number, shot: Shot): {pose: CamPose; torch: V3; walk: number} => {
	const z = guardZ(t);
	const walking = shot === 'pov1' ? (t < K.reach ? 1 : 0) : shot === 'pov2' ? (t < K.cutGrid2 - 0.3 ? 1.6 : 0) : 0;
	const h = handheld(t, 1.4 + walking);
	const bob = Math.abs(Math.sin(t * 5.2)) * 0.04 * walking;
	let yaw = 0.06 * Math.sin(t * 0.7);
	let pitch = -0.05;
	if (shot === 'turn') {
		yaw = Math.PI * ease(lin(t, K.cutTurn, K.cutTurn + 0.45)) + 0.08 * Math.sin(t * 3);
		pitch = -0.02;
	}
	const p: V3 = [0.15 + h.dp[0], 1.62 + bob + h.dp[1], z + h.dp[2]];
	const l: V3 = [p[0] - Math.sin(yaw) * 5, p[1] + pitch * 5, p[2] - Math.cos(yaw) * 5];
	return {pose: {p, l, fov: 56, roll: h.roll * 2}, torch: l, walk: walking};
};

// ------------------------------------------------------------------ one rendered view of the world
const Scene: React.FC<{t: number; view: 'c1' | 'c2' | 'c3' | 'c4' | 'pov'; zoom?: number}> = ({t, view, zoom = 1}) => {
	const shot = shotAt(t);
	const fig = figureAt(t);
	const doors = doorsAt(t);
	const torchOn = shot !== 'black' && !(shot === 'turn' && t >= K.torchOut);
	let pose: CamPose;
	let torch: V3 | null = null;
	if (view === 'pov') {
		const pv = povPose(t, shot);
		pose = pv.pose;
		torch = pv.torch;
	} else {
		const c = CCTV[view];
		pose = {...c, fov: c.fov / zoom};
	}
	const cctv = view !== 'pov';
	const gz = guardZ(t);
	const showGuard = cctv && (view === 'c3' || view === 'c4') && t >= K.cutPOV1 + 0.5;
	return (
		<>
			<Cam pose={pose} />
			<ambientLight intensity={cctv ? 2.4 : 0.35} color={cctv ? '#c8d0c8' : '#30384a'} />
			{/* moonlight through the leaded windows; the EXIT sign's green; a dim lamp at Base Court */}
			{[DOORS_Z + 4.5, DOORS_Z + 8.7, DOORS_Z + 12.9].map((z) => (
				<pointLight key={z} position={[-1.2, 2.2, z]} intensity={cctv ? 0 : 1.2} distance={3} decay={1.2} color="#7a8ab8" />
			))}
			<pointLight position={[0, 2.3, DOORS_Z + 0.5]} intensity={cctv ? 0 : t >= K.face[0] ? 3 : 1.6} distance={t >= K.face[0] ? 5 : 3} decay={1.0} color={t >= K.face[0] ? '#dcefe2' : '#30ff70'} />
			{view === 'pov' && torchOn && torch && <PovTorch p={pose.p} l={torch} t={t} />}
			<MatsProvider>
				<Gallery doors={doors} />
				{(view === 'c2' || view === 'c1') && (view === 'c2' ? <Stairs /> : <Court />)}
				{fig && <Robed p={fig.p} ry={fig.ry} arm={fig.arm} />}
				{showGuard && <Guard p={[0.15, 0, gz]} ry={0} torch={true} />}
				{view === 'pov' && shot === 'pov1' && t >= K.shut1[0] - 0.4 && <Hands push={ease(lin(t, K.shut1[0], K.shut1[1]))} z={DOORS_Z + 0.75} />}
			</MatsProvider>
		</>
	);
};

const PovTorch: React.FC<{p: V3; l: V3; t: number}> = ({p, l, t}) => {
	const light = React.useMemo(() => new THREE.SpotLight('#fff2dc', 14, 18, 0.38, 0.5, 1.0), []);
	light.position.set(p[0] + 0.15, p[1] - 0.15, p[2]);
	light.target.position.set(...l);
	light.intensity = 14 * (0.9 + 0.1 * Math.sin(t * 40));
	light.target.updateMatrixWorld();
	return (
		<>
			<primitive object={light} />
			<primitive object={light.target} />
		</>
	);
};

// ------------------------------------------------------------------ CCTV chrome: label and timestamp on a tile
const stamp = (t: number) => {
	const s = Math.floor(t) + 23 * 3600 + 41 * 60 + 7;
	const hh = Math.floor(s / 3600) % 24, mm = Math.floor((s % 3600) / 60), ss = s % 60;
	return `10/2003 ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};
const NAMES = {c1: 'CAM1 BASE COURT', c2: 'CAM2 STAIRS', c3: 'CAM3 GALLERY', c4: 'CAM4 FIRE EXIT'};

/** one CCTV feed: monochrome, 8 frames a second, label and timestamp */
const Feed: React.FC<{t: number; cam: 'c1' | 'c2' | 'c3' | 'c4'; w: number; h: number; zoom?: number; label: boolean}> = ({t, cam, w, h, zoom = 1, label}) => {
	const tq = Math.floor(t * 8) / 8;
	return (
		<div style={{position: 'relative', width: w, height: h, overflow: 'hidden', background: '#000'}}>
			<div style={{position: 'absolute', inset: 0, filter: 'grayscale(1) sepia(0.25) hue-rotate(60deg) contrast(1.35) brightness(1.05)'}}>
				<ThreeCanvas width={w} height={h} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 60, near: 0.03, far: 200}} style={{imageRendering: 'pixelated'}}>
					<Scene t={tq} view={cam} zoom={zoom} />
				</ThreeCanvas>
			</div>
			{label && (
				<div style={{position: 'absolute', left: 2, top: 1, right: 2, fontFamily: '"DejaVu Sans Mono", monospace', fontSize: w > 120 ? 8 : 6, color: '#e8f0e8', lineHeight: 1.1, textShadow: '0 0 1px #000'}}>
					<div>{w > 120 ? NAMES[cam] : NAMES[cam].slice(0, 4)}</div>
					{w > 120 && <div style={{marginTop: 1}}>{stamp(t + (cam === 'c3' ? 2 : 0))}</div>}
				</div>
			)}
		</div>
	);
};

// ------------------------------------------------------------------ 2D overlay: captions and grain
const Overlay: React.FC<{t: number; captions: boolean; cctv: boolean}> = ({t, captions, cctv}) => {
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
			show.forEach((r, i) => out(r, CW / 2, 486 + i * 19 - (show.length - 1) * 19, '#ffffff'));
		}
		const img = g.getImageData(0, 0, CW, CH);
		for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 120 ? 255 : 0;
		g.putImageData(img, 0, 0);
		const n = noise.current!.getContext('2d')!;
		const ni = n.createImageData(LW, LH);
		const r = rng(Math.floor(t * (cctv ? 8 : 30)) * 7919 + 25);
		for (let y = 0; y < LH; y++) {
			const line = cctv && y % 2 === 0;
			for (let x = 0; x < LW; x++) {
				const i = (y * LW + x) * 4;
				const v = r() * 255;
				ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = line ? 0 : v;
				ni.data[i + 3] = line ? 40 : (cctv ? 30 : 16) * (r() < 0.5 ? 1 : 0.4);
			}
		}
		n.putImageData(ni, 0, 0);
	}, [t, captions, cctv]);
	return (
		<>
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

// ------------------------------------------------------------------ assembly
export const Episode25: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const shot = shotAt(t);
	const cctv = shot === 'cam4' || shot === 'cam4b' || shot === 'cam3' || shot === 'grid1' || shot === 'grid2';
	let body: React.ReactNode = null;
	if (shot === 'cam4' || shot === 'cam4b' || shot === 'cam3') {
		// one camera full screen; the operator zooms in slowly
		const t0 = shot === 'cam4' ? 0 : shot === 'cam4b' ? K.cutCam4 : K.cutCam3;
		const t1 = shot === 'cam4' ? K.cutPOV1 : shot === 'cam4b' ? K.cutPOV2 : K.cutTurn;
		const zoom = 1 + (shot === 'cam4b' ? 0.9 : 0.35) * ease(lin(t, t0, t1));
		body = <Feed t={t} cam={shot === 'cam3' ? 'c3' : 'c4'} w={LW} h={LH} zoom={zoom} label />;
	} else if (shot === 'grid1' || shot === 'grid2') {
		// the camera wall: four feeds in a monitor bezel, pushing in (towards camera 3 the second time)
		const t0 = shot === 'grid1' ? K.cutGrid1 : K.cutGrid2;
		const t1 = shot === 'grid1' ? K.cutCam4 : K.cutCam3;
		const k = ease(lin(t, t0, t1));
		// the second time, the push ends with camera 3 (bottom left) filling the frame
		const s = 1 + (shot === 'grid2' ? 1.0 : 0.2) * k;
		const ox = shot === 'grid2' ? 88 * k : 0;
		const oy = shot === 'grid2' ? -68 * k : 0;
		const W = 86, H = 66;
		body = (
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, background: '#050606'}}>
				<div style={{position: 'absolute', left: 2 + ox, top: 92 + oy, width: 176, height: 140, transform: `scale(${s})`, transformOrigin: '50% 50%', background: '#1a1c1c', padding: 2, display: 'grid', gridTemplateColumns: `${W}px ${W}px`, gap: 2}}>
					{(['c1', 'c2', 'c3', 'c4'] as const).map((c) => (
						<Feed key={c} t={t} cam={c} w={W} h={H} label />
					))}
				</div>
			</div>
		);
	} else if (shot !== 'black') {
		body = (
			<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 56, near: 0.03, far: 200}} style={{imageRendering: 'pixelated'}}>
				<Scene t={t} view="pov" />
			</ThreeCanvas>
		);
	}
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: cctv ? 'none' : 'saturate(0.8) contrast(1.05)'}}>{body}</div>
			{shot !== 'black' && <Overlay t={t} captions={captions} cctv={cctv} />}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep25-hampton-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};

