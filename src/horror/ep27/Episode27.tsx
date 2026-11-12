// Episode 27: "The Ball" (Season 3, a real place with reported hauntings: Waverly Hills Sanatorium,
// Louisville, Kentucky). Built to the motion rule and the no-gimmick-transitions rule (hard cuts only).
// Form: an investigator's handheld infrared camera (black and white, its own lamp, REC and timecode),
// following the investigators' ball through the building. There is no jump scare: the ball does
// everything. It rolls away by itself on the third floor; from outside, the building and the
// camera's lamp in one window; it rolls along the open-air porch; in the body tunnel it comes
// bouncing down the steps from behind and past us into the dark; on the third floor it rolls ahead,
// turns into a ward and stops at an iron bed; it rolls back to our feet. "Roll it back." The boot
// nudges it into the dark. Silence. It comes back, fast. The camera lifts: two small points of
// eyeshine in the dark, at a child's height. A blink. Black.
// Care: no patient is ever shown; the deaths are told with respect, and the inflated toll is
// corrected; the boy is a story with no record; no suicide legend is used.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep27-ball-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {Ball, BALL_R, Boot, Building, DOOR_Z, EXT, Eyes, MatsProvider, Porch, PORCH, ROOM, ThirdFloor, TUN, TUN_SLOPE, Tunnel, V3} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep27Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));

// ------------------------------------------------------------------ key times (scripts/ep27_sound.py uses the same rules)
export const K = {
	roll1: 0.45, // the ball starts rolling away by itself
	cutExt: L.l02.start - 0.3,
	cutPorch: L.l03.start - 0.3,
	cutTun: L.l04.start - 0.3,
	bounce: L.l04.end + 1.0, // the ball bounces past us down the tunnel steps
	cutCor: L.l06.start - 0.4,
	turn: L.l06.end + 0.05, // it turns into the ward
	tap: L.l06.end + 2.1, // it stops against the bed
	back: L.l07.end + 0.7, // it rolls back to us
	atFeet: L.l07.end + 3.0,
	kick: L.l08.end + 0.35,
	away: L.l08.end + 2.6, // gone into the dark
	ret: L.l08.end + 3.95, // it comes back, fast
	atFeet2: L.l08.end + 5.05,
	lift: [L.l08.end + 5.35, L.l08.end + 6.05] as [number, number],
	eyes: [L.l08.end + 6.0, L.l08.end + 7.1] as [number, number],
	blink: L.l08.end + 6.6,
	black: timeline.duration_seconds - 0.45,
};
export const STINGERS = [K.bounce - 0.8, K.tap, K.atFeet2, K.eyes[0]];

type Shot = 'hook' | 'ext' | 'porch' | 'tun' | 'cor' | 'black';
const shotAt = (t: number): Shot => {
	if (t < K.cutExt) return 'hook';
	if (t < K.cutPorch) return 'ext';
	if (t < K.cutTun) return 'porch';
	if (t < K.cutCor) return 'tun';
	if (t < K.black) return 'cor';
	return 'black';
};

// ------------------------------------------------------------------ the ball
/** distance rolled from rest with acceleration a up to speed v (m), after time dt */
const roll = (dt: number, a: number, v: number) => {
	if (dt <= 0) return 0;
	const ta = v / a;
	return dt < ta ? 0.5 * a * dt * dt : 0.5 * a * ta * ta + v * (dt - ta);
};
const tunFloor = (z: number) => -TUN_SLOPE * (1.5 - z);
const ROOM_BED: V3 = [ROOM.x1 + 2.25, 0, -12.75]; // where it stops, at the foot of the bed
const FEET: V3 = [-2.15, 0, -12.05];
const DARK: V3 = [ROOM.x1 - 1.8, 0, -12.0];

const ballAt = (t: number, shot: Shot): {p: V3; dir: number; rot: number} | null => {
	switch (shot) {
		case 'hook': {
			const d = roll(t - K.roll1, 0.55, 1.25);
			return {p: [0.15, 0, 0.8 - d], dir: 0, rot: d / BALL_R};
		}
		case 'porch': {
			const d = roll(t - K.cutPorch + 0.4, 0.8, 1.1);
			return {p: [0.4, 0, -1.2 - d], dir: 0, rot: d / BALL_R};
		}
		case 'tun': {
			// from the top of the steps behind us, bouncing down past us into the dark
			const t0 = K.bounce - 0.9;
			if (t < t0 || t > K.bounce + 3) return null;
			const dt = t - t0;
			const z = -1.54 - 3.4 * dt; // level with the camera (z -4.6) at K.bounce
			const hopT = 0.26;
			const k = (dt % hopT) / hopT;
			const hop = 4 * k * (1 - k) * Math.max(0.06, 0.32 - 0.05 * dt);
			return {p: [TUN[0] - 0.62, tunFloor(z) + hop, z], dir: 0, rot: (3.4 * dt) / BALL_R};
		}
		case 'cor': {
			if (t < K.turn) {
				const d = roll(t - K.cutCor + 1, 0.5, 0.95);
				const z = Math.max(DOOR_Z, -6.8 - d);
				return {p: [0.1, 0, z], dir: 0, rot: (-6.8 - z) / BALL_R};
			}
			const seg = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, 0, a[2] + (b[2] - a[2]) * k];
			const dirOf = (a: V3, b: V3) => Math.atan2(-(b[0] - a[0]), -(b[2] - a[2]));
			const DOORP: V3 = [0.1, 0, DOOR_Z];
			if (t < K.back) {
				const k = 1 - (1 - lin(t, K.turn, K.tap)) ** 2;
				return {p: seg(DOORP, ROOM_BED, k), dir: dirOf(DOORP, ROOM_BED), rot: (k * 4.3) / BALL_R};
			}
			if (t < K.kick) {
				const k = 1 - (1 - lin(t, K.back, K.atFeet)) ** 2.2;
				return {p: seg(ROOM_BED, FEET, k), dir: dirOf(ROOM_BED, FEET), rot: (k * 2.3) / BALL_R};
			}
			if (t < K.ret) {
				const k = 1 - (1 - lin(t, K.kick, K.away)) ** 1.6;
				return {p: seg(FEET, DARK, k), dir: dirOf(FEET, DARK), rot: (k * 6.3) / BALL_R};
			}
			const k = lin(t, K.ret, K.atFeet2) ** 0.8;
			const p = seg(DARK, [FEET[0] + 0.08, 0, FEET[2]], k);
			return {p, dir: dirOf(DARK, FEET), rot: (k * 6.3) / BALL_R};
		}
		default:
			return null;
	}
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
	c.near = 0.03;
	c.far = 2500;
	camera.updateProjectionMatrix();
	return null;
};
const kf = (t: number, ts: number[], vs: number[]) => interpolate(t, ts, vs, {...cl, easing: (x) => ease(x)});
const yawTo = (from: V3, to: V3) => Math.atan2(-(to[0] - from[0]), -(to[2] - from[2]));

const pov = (t: number, shot: Shot): {p: V3; yaw: number; pitch: number; walk: number} => {
	switch (shot) {
		case 'hook':
			return {p: [0, 1.6, 2.4 - 1.6 * lin(t, 0, K.cutExt)], yaw: 0.02 * Math.sin(t * 0.7), pitch: kf(t, [0, 1.5, K.cutExt], [-0.5, -0.46, -0.3]), walk: 0.7};
		case 'porch':
			return {p: [PORCH[0] - 0.6, 1.6, 0.8 - 2.6 * lin(t, K.cutPorch, K.cutTun)], yaw: -0.12 + 0.05 * Math.sin(t * 0.5), pitch: -0.2, walk: 0.8};
		case 'tun': {
			const z = kf(t, [K.cutTun, K.bounce - 0.6, K.bounce + 2.6, K.cutCor], [-1.0, -4.6, -4.6, -6.0]);
			return {p: [TUN[0] - 0.25, tunFloor(z) + 1.6, z], yaw: 0.03 * Math.sin(t * 0.6), pitch: kf(t, [K.cutTun, K.bounce, K.bounce + 1.5], [-0.38, -0.32, -0.4]), walk: t < K.bounce - 0.6 ? 0.8 : 0.25};
		}
		case 'cor':
		case 'black': {
			const x = kf(t, [K.cutCor, K.turn + 0.8, K.tap + 0.6], [0, 0, -1.6]);
			const z = kf(t, [K.cutCor, K.turn + 0.8, K.tap + 0.6], [-4.6, -11.0, -12.0]);
			const p: V3 = [x, 1.6, z];
			const yBed = yawTo([-1.6, 0, -12], ROOM_BED);
			const yDark = yawTo([-1.6, 0, -12], DARK);
			const yaw = kf(t, [K.cutCor, K.turn, K.turn + 1.3, K.atFeet, K.kick, K.away, K.ret, K.atFeet2], [0, 0, yBed, yBed + 0.1, yDark, yDark, yDark, yDark + 0.08]);
			const pitch = kf(
				t,
				[K.cutCor, K.turn, K.tap, K.back, K.atFeet, K.kick, K.kick + 0.9, K.away, K.ret + 0.4, K.atFeet2, K.lift[0], K.lift[1]],
				[-0.3, -0.3, -0.38, -0.38, -1.05, -1.05, -0.45, -0.32, -0.45, -1.0, -1.0, -0.05],
			);
			return {p, yaw, pitch, walk: t < K.tap + 0.6 ? 0.8 : 0.15};
		}
		default:
			return {p: [0, 1.6, 0], yaw: 0, pitch: 0, walk: 0};
	}
};

const povPose = (t: number, shot: Shot): {pose: CamPose; lamp: V3} => {
	const v = pov(t, shot);
	const h = handheld(t, 1.3 + v.walk * 1.2);
	const bob = Math.abs(Math.sin(t * 5.0)) * 0.03 * v.walk;
	const p: V3 = [v.p[0] + h.dp[0], v.p[1] + bob + h.dp[1], v.p[2] + h.dp[2]];
	const c = Math.cos(v.pitch);
	const l: V3 = [p[0] - Math.sin(v.yaw) * c * 5, p[1] + Math.sin(v.pitch) * 5, p[2] - Math.cos(v.yaw) * c * 5];
	return {pose: {p, l, fov: 58, roll: h.roll * 2}, lamp: l};
};

const extPose = (t: number): CamPose => {
	const k = lin(t, K.cutExt, K.cutPorch);
	return {p: [EXT[0] - 30 + 12 * k, 24 + 4 * k, 215 - 45 * k], l: [EXT[0] - 8, 27, 0], fov: 50};
};

// ------------------------------------------------------------------ the scene
const IrLamp: React.FC<{p: V3; l: V3; on: number}> = ({p, l, on}) => {
	const light = useMemo(() => new THREE.SpotLight('#ffffff', 10, 14, 0.5, 0.65, 1.0), []);
	light.position.set(p[0], p[1] - 0.05, p[2]);
	light.target.position.set(...l);
	light.intensity = 10 * on;
	light.target.updateMatrixWorld();
	return (
		<>
			<primitive object={light} />
			<primitive object={light.target} />
		</>
	);
};

const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotAt(t);
	if (shot === 'black') return null;
	if (shot === 'ext') {
		return (
			<>
				<Cam pose={extPose(t)} />
				<ambientLight intensity={1.4} color="#c8c8c8" />
				<pointLight position={[EXT[0] - 100, 200, 300]} intensity={1.0} decay={0} color="#ffffff" />
				<MatsProvider>
					<Building irWin={10 + 3 * lin(t, K.cutExt, K.cutPorch)} />
				</MatsProvider>
			</>
		);
	}
	const {pose, lamp} = povPose(t, shot);
	const ball = ballAt(t, shot);
	const v = pov(t, shot);
	const bootRy = v.yaw;
	const kick = shot === 'cor' ? Math.sin(Math.PI * lin(t, K.kick - 0.15, K.kick + 0.25)) : 0;
	return (
		<>
			<Cam pose={pose} />
			<IrLamp p={pose.p} l={lamp} on={shot === 'tun' ? 1.5 : 1} />
			<ambientLight intensity={shot === 'porch' ? 0.35 : shot === 'tun' ? 0.12 : 0.05} color="#d0d0d0" />
			{shot === 'porch' && <pointLight position={[PORCH[0] + 40, 40, -20]} intensity={0.8} decay={0} color="#ffffff" />}
			<MatsProvider>
				{(shot === 'hook' || shot === 'cor') && <ThirdFloor />}
				{shot === 'porch' && <Porch />}
				{shot === 'tun' && <Tunnel />}
				{ball && <Ball p={ball.p} dir={ball.dir} rot={ball.rot} />}
				{shot === 'cor' && t > K.tap && <Boot p={[pose.p[0] - Math.sin(bootRy) * 0.2 + 0.08, 0, pose.p[2] - Math.cos(bootRy) * 0.2]} ry={bootRy} kick={kick} />}
				{shot === 'cor' && t >= K.eyes[0] && t < K.eyes[1] && (
					<Eyes p={[ROOM.x1 - 0.3, 0.92, -12.05]} ry={Math.PI / 2} open={t >= K.blink && t < K.blink + 0.12 ? 0 : 1} />
				)}
			</MatsProvider>
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: the IR camera's display, captions, grain
const tc = (t: number) => {
	const s = Math.floor(t) + 3 * 3600 + 12 * 60 + 7;
	const f = Math.floor((t % 1) * 30);
	return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
};

const Overlay: React.FC<{t: number; captions: boolean; ext: boolean}> = ({t, captions, ext}) => {
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
		// the camera's own display (not on the drone shot from outside)
		if (!ext) {
			g.font = 'bold 12px "DejaVu Sans Mono", monospace';
			if (Math.floor(t * 1.5) % 2 === 0) {
				g.fillStyle = '#ffffff';
				g.beginPath();
				g.arc(26, 34, 4, 0, Math.PI * 2);
				g.fill();
			}
			out('REC', 36, 38, '#ffffff', 'left');
			out('IR', 334, 38, '#ffffff', 'right');
			out(tc(t), 24, 612, '#ffffff', 'left');
			out('3F', 334, 612, '#ffffff', 'right');
			g.strokeStyle = '#ffffff';
			g.lineWidth = 1;
			for (const [x, y, dx, dy] of [[14, 14, 1, 1], [346, 14, -1, 1], [14, 626, 1, -1], [346, 626, -1, -1]]) {
				g.beginPath();
				g.moveTo(x + dx * 18, y);
				g.lineTo(x, y);
				g.lineTo(x, y + dy * 18);
				g.stroke();
			}
		}
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
		const r = rng(Math.floor(t * 30) * 7919 + 27);
		for (let i = 0; i < ni.data.length; i += 4) {
			const v = r() * 255;
			ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = v;
			ni.data[i + 3] = 34 * (r() < 0.5 ? 1 : 0.45);
		}
		n.putImageData(ni, 0, 0);
	}, [t, captions, ext]);
	return (
		<>
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

// ------------------------------------------------------------------ assembly
export const Episode27: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const shot = shotAt(t);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'grayscale(1) contrast(1.25) brightness(1.08)'}}>
				{shot !== 'black' && (
					<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 58, near: 0.03, far: 2500}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
						<Scene t={t} />
					</ThreeCanvas>
				)}
			</div>
			{shot !== 'black' && <Overlay t={t} captions={captions} ext={shot === 'ext'} />}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep27-ball-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
