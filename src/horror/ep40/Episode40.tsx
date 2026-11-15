// Episode 40: "Patayin ang Ilaw" (Season 4 finale: Malinta Tunnel, Corregidor; the tunnel's history and
// the reported haunting on the night lateral tour). Taglish, Juanito. Built to the motion rule; hard cuts
// only; an eerie score (it drops out for the black); a seamless loop (the last shot is the first shot, on
// negative time).
// Form: "the count". The beams are the people: one beam, one visitor. The hook: a lateral, the group's
// beams on the concrete, going out one by one; the island at night; the main tunnel, bed bolts in the
// floor; the lateral sealed by rubble, dust trickling; the guide turns to the group; "Patayin ang ilaw":
// the beams go out one by one, then the longest black of the channel (sound only; after-images; at its
// end a dim glow where no one stands); the lights come back, the same group, almost: my beam swings back
// and finds, at the edge of the light, a man in an old helmet, head bowed; the lights die by themselves;
// the guide's beam counts heads: six, and a seventh; the group walks out at dawn (the last line honours
// all who died there). Then the hook again (loop). Hidden detail: the extra figure is already in the
// hook, among the group, at the edge of a beam.
// Care: no soldier's face, side or insignia; no wound, no gore; the 1945 deaths are only the rubble; a
// legitimate guided tour; the narration honours everyone who died there.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep40-malinta-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {Beam, Dust, GUIDE, Island, MatsProvider, Person, Soldier, Tunnel, V3, VISITORS, useM, Box} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep40Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep40_sound.py uses the same rules)
const NB = 7; // beams in the group: the guide's and six visitors' (mine among them)
export const K = {
	hookOut: 2.0, // the hook's beams go out one by one, 0.33 s apart
	cutIsland: L.l02.start - 0.3,
	cutTunnel: L.l02.start + 0.45 * (L.l02.end - L.l02.start),
	cutRubble: L.l03.start - 0.3,
	dust: [L.l03.start + 1.5, L.l03.end] as [number, number],
	cutGuide: L.l04.start - 0.3,
	cutOff: L.l05.start - 0.3,
	outStart: L.l05.end + 0.25, // the beams go out one by one, 0.22 s apart
	cutOn: L.l06.start - 0.3,
	found: L.l06.end + 0.5, // my beam finds the extra figure
	cutCount: L.l07.start - 0.3,
	seventh: L.l07.end + 0.2,
	cutHonor: L.l08.start - 0.3,
	loopShot: DUR - 1.7,
};
const BLACK = K.outStart + NB * 0.22;
const GLOW: [number, number] = [K.cutOn - 2.4, K.cutOn];
const DIE = K.found + 1.0;
export const STINGERS = [K.found, K.seventh];

type Shot = 'hook' | 'island' | 'walk' | 'rubble' | 'guide' | 'off' | 'on' | 'count' | 'honor';
const shotAt = (t: number): Shot => {
	if (t < K.cutIsland) return 'hook';
	if (t < K.cutTunnel) return 'island';
	if (t < K.cutRubble) return 'walk';
	if (t < K.cutGuide) return 'rubble';
	if (t < K.cutOff) return 'guide';
	if (t < K.cutOn) return 'off';
	if (t < K.cutCount) return 'on';
	if (t < K.cutHonor) return 'count';
	return 'honor';
};

// ------------------------------------------------------------------ the lateral: who stands where
const LAT = {w: 3.6, wh: 1.8, z0: 2, z1: -14};
const GUIDE_P: V3 = [0, 0, -9.6];
const VIS_P: V3[] = [
	[-0.85, 0, -7.6],
	[0.75, 0, -7.4],
	[-0.25, 0, -6.6],
	[1.05, 0, -6.1],
	[-1.0, 0, -5.6],
	[0.2, 0, -4.6], // me
];
const ME = VIS_P[5];
const EYE: V3 = [ME[0], 1.55, ME[2]];
const SOLDIER_END: V3 = [-0.55, 0, -3.0]; // behind me, at the back
const SOLDIER_HOOK: V3 = [-1.45, 0, -9.2]; // among the group, at the edge of a beam (hidden detail)
const hand = (p: V3, ry: number): V3 => [p[0] + 0.21 * Math.cos(ry) + 0.2 * Math.sin(ry), p[1] + 0.88, p[2] - 0.21 * Math.sin(ry) + 0.2 * Math.cos(ry)];
const head = (p: V3): V3 => [p[0], 1.56, p[2]];
// where each beam rests on the lateral: walls, vault, the rubble (guide first, then visitors 0..4)
const AIM: V3[] = [
	[0.1, 1.2, -13.4],
	[-1.75, 1.0, -11.2],
	[1.75, 1.5, -10.4],
	[0.3, 2.6, -12.2],
	[-0.6, 0.0, -10.6],
	[1.1, 0.4, -12.6],
];
const sway = (t: number, k: number, a = 0.12): V3 => [Math.sin(t * 0.7 + k * 1.9) * a, Math.sin(t * 0.53 + k * 2.7) * a * 0.7, 0];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

// beam k on (0..1) at time t in the lateral shots; k = 0 the guide, 1..5 visitors, 6 me
const beamOn = (t: number, shot: Shot, k: number): number => {
	if (shot === 'hook') return t < K.hookOut + k * 0.33 ? 1 : 0;
	if (shot === 'off') return t < K.outStart + (NB - 1 - k) * 0.22 ? 1 : 0;
	if (shot === 'on') {
		if (t < K.cutOn + 0.1 + k * 0.08) return 0;
		if (t >= DIE) return t < DIE + 0.35 ? (Math.sin(t * 90 + k) > 0 ? 0.6 : 0) : 0;
		return 1;
	}
	if (shot === 'count') return k === 0 ? 1 : 0;
	return 1;
};

// ------------------------------------------------------------------ cameras
type CamPose = {p: V3; l: V3; fov: number};
const Cam: React.FC<{pose: CamPose}> = ({pose}) => {
	const {camera} = useThree();
	camera.position.set(...pose.p);
	camera.up.set(0, 1, 0);
	camera.lookAt(...pose.l);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = pose.fov;
	c.near = 0.03;
	c.far = 80;
	camera.updateProjectionMatrix();
	return null;
};
const glide = (t: number, t0: number, t1: number, a: V3, b: V3, la: V3, lb: V3, fov: number, shake = 0.3): CamPose => {
	const k = ease(lin(t, t0, t1));
	const hh = handheld(t, shake);
	const p = mix3(a, b, k);
	return {p: [p[0] + hh.dp[0], p[1] + hh.dp[1], p[2]], l: mix3(la, lb, k), fov};
};
// the walk in the main tunnel: the group's lead position
const walkZ = (t: number) => -5 - (t - K.cutTunnel) * 0.75;
const countTarget = (t: number): V3 => {
	// the guide's beam hops head to head: nearest first, me sixth, then the seventh
	const order = [0, 1, 2, 3, 4, 5].sort((a, b) => VIS_P[b][2] - VIS_P[a][2]).reverse();
	const t0 = L.l07.start + 0.2, t1 = L.l07.end - 0.2;
	const heads = order.map((i) => head(VIS_P[i]));
	const seventh: V3 = [SOLDIER_END[0], 1.45, SOLDIER_END[2]];
	if (t >= K.seventh) return seventh;
	const x = lin(t, t0, t1, 0, heads.length - 1);
	const i = Math.floor(x), f = ease(Math.min(1, (x - i) * 3));
	if (t > t1) return mix3(heads[heads.length - 1], seventh, ease(lin(t, t1, K.seventh)));
	return mix3(heads[i], heads[Math.min(heads.length - 1, i + 1)], f);
};
const swingK = (t: number) => ease(lin(t, L.l06.end + 0.05, K.found));
const soldierLook: V3 = [SOLDIER_END[0] + 0.15, 1.38, SOLDIER_END[2]];

const poseAt = (t: number, shot: Shot): CamPose => {
	switch (shot) {
		case 'hook':
			return glide(t, -2, K.cutIsland, [0.35, 1.6, -3.0], [0.3, 1.58, -3.6], [-0.15, 1.05, -11], [-0.15, 1.05, -11], 58);
		case 'island':
			return glide(t, K.cutIsland, K.cutTunnel, [3.2, 3.6, 27], [1.4, 2.6, 15], [0, 2.4, 1], [0, 2.0, 1.6], 46, 0.15);
		case 'walk': {
			const z = walkZ(t);
			return {p: [0.5 + handheld(t, 0.3).dp[0], 1.6, z + 3.2], l: [0, 0.3, z - 3.5], fov: 58};
		}
		case 'rubble':
			return glide(t, K.cutRubble, K.cutGuide, [0.35, 1.5, -9.3], [0.2, 1.45, -11.2], [0, 1.6, -14], [0, 2.0, -14], 54);
		case 'guide':
			return glide(t, K.cutGuide, K.cutOff, [0.65, 1.6, -4.9], [0.45, 1.55, -5.7], [0, 1.35, -9.6], [0, 1.4, -9.6], 50);
		case 'off':
			return glide(t, K.cutOff, K.cutOn, [EYE[0] + 0.05, EYE[1], EYE[2] + 0.2], [EYE[0], EYE[1], EYE[2] - 0.1], [-0.1, 1.15, -10.5], [-0.1, 1.15, -10.5], 56, 0.2);
		case 'on': {
			// my eyes: the group ahead, then a whip over my left shoulder to the back
			const k = swingK(t);
			const a = Math.atan2(-10.5 - EYE[2], -0.1 - EYE[0]);
			const b = Math.atan2(soldierLook[2] - EYE[2], soldierLook[0] - EYE[0]);
			let d = b - a;
			if (d > 0) d -= Math.PI * 2; // turn left (counter-clockwise seen from above)
			const ang = a + d * k;
			const r = 4;
			const lk: V3 = [EYE[0] + Math.cos(ang) * r, 1.15 + (1.3 - 1.15) * k, EYE[2] + Math.sin(ang) * r];
			const hh = handheld(t, 0.25 + 0.6 * k);
			const lFinal = k >= 1 ? soldierLook : lk;
			return {p: [EYE[0] + hh.dp[0], EYE[1] + hh.dp[1], EYE[2]], l: k >= 1 ? lFinal : lk, fov: 56 - 8 * ease(lin(t, K.found, DIE))};
		}
		case 'count': {
			const target = countTarget(t);
			const gEye: V3 = [GUIDE_P[0] + 0.5, 2.15, GUIDE_P[2] + 0.1];
			const hh = handheld(t, 0.25);
			return {p: [gEye[0] + hh.dp[0], gEye[1] + hh.dp[1], gEye[2]], l: mix3([0, 1.3, -6], target, 0.75), fov: 50};
		}
		case 'honor':
			return glide(t, K.cutHonor, K.loopShot, [0.45, 1.5, -15], [0.3, 1.45, -11.5], [0, 1.5, 2], [0, 1.6, 2], 50, 0.15);
	}
};

// ------------------------------------------------------------------ fog and background per shot
const Atmos: React.FC<{color: string; near: number; far: number}> = ({color, near, far}) => {
	const {scene} = useThree();
	const bg = new THREE.Color(color);
	if (!scene.fog) scene.fog = new THREE.Fog(bg, near, far);
	const f = scene.fog as THREE.Fog;
	f.color.copy(bg);
	f.near = near;
	f.far = far;
	scene.background = bg;
	return null;
};

// ------------------------------------------------------------------ the scene
const Lateral: React.FC<{t: number; shot: Shot; pose: CamPose}> = ({t, shot, pose}) => {
	const dark = shot === 'off' && t >= BLACK;
	const glow = dark ? ease(lin(t, GLOW[0], GLOW[1])) : 0;
	const guideRy = shot === 'guide' ? Math.PI * (1 - ease(lin(t, K.cutGuide + 0.3, L.l04.start + 1.2))) : shot === 'count' || shot === 'on' || shot === 'off' ? 0 : Math.PI;
	const gather = shot === 'guide' ? ease(lin(t, L.l04.start + 0.6, L.l04.end)) : 0;
	// the beams: guide (0), visitors (1..5), me (6, from the camera)
	const beams: {p: V3; tg: V3; on: number; cone: boolean}[] = [];
	const gHand = hand(GUIDE_P, guideRy);
	let gTarget = add(AIM[0], sway(t, 0));
	if (shot === 'guide') gTarget = mix3(gTarget, [0, 0, -8.6], ease(lin(t, K.cutGuide + 0.3, L.l04.start + 1.2)));
	if (shot === 'off' || shot === 'on') gTarget = [0, 0, -8.4];
	if (shot === 'count') gTarget = countTarget(t);
	beams.push({p: shot === 'count' ? [GUIDE_P[0] + 0.6, 2.0, GUIDE_P[2] + 0.2] : gHand, tg: gTarget, on: beamOn(t, shot, 0), cone: shot !== 'count'});
	for (let i = 0; i < 5; i++) {
		const tg = mix3(add(AIM[i + 1], sway(t, i + 1)), add([0, 1.3, -9.5], sway(t, i + 1, 0.25)), gather);
		beams.push({p: hand(VIS_P[i], Math.PI), tg, on: beamOn(t, shot, i + 1), cone: true});
	}
	// mine: from just under the camera, along its look
	const dir = new THREE.Vector3(pose.l[0] - pose.p[0], pose.l[1] - pose.p[1], pose.l[2] - pose.p[2]).normalize();
	const mineP: V3 = [pose.p[0] + 0.12, pose.p[1] - 0.25, pose.p[2]];
	let mineT: V3 = [mineP[0] + dir.x * 6, mineP[1] + dir.y * 6, mineP[2] + dir.z * 6];
	if (shot === 'on' && swingK(t) >= 1) mineT = [SOLDIER_END[0] + 0.38, 1.55, SOLDIER_END[2] + 0.1]; // he is at the edge of my light
	const meInFrame = shot === 'hook' || shot === 'rubble' || shot === 'guide' || shot === 'count';
	if (shot !== 'count') beams.push({p: meInFrame ? hand(ME, Math.PI) : mineP, tg: meInFrame && shot !== 'rubble' ? add([0.6, 0.2, -11.5], sway(t, 6)) : mineT, on: beamOn(t, shot, 6), cone: meInFrame});
	const showSoldier = shot === 'hook' ? 'hook' : (shot === 'on' && t >= K.found - 0.15 && t < DIE + 0.35) || (shot === 'count' && t >= K.seventh - 0.6) ? 'end' : null;
	return (
		<>
			<Atmos color="#000000" near={4} far={dark ? 6 : 16} />
			<ambientLight intensity={dark ? 0 : shot === 'count' ? 0.12 : 0.2} color="#8a7a68" />
			<Tunnel w={LAT.w} wh={LAT.wh} z0={LAT.z0} z1={LAT.z1} sealed />
			{beams.map((b, i) => (
				<Beam key={i} p={b.p} target={b.tg} on={dark ? 0 : b.on} cone={b.cone} />
			))}
			{shot === 'count' && t >= K.seventh - 0.1 && <pointLight position={[SOLDIER_END[0] + 0.1, 1.7, SOLDIER_END[2] - 0.7]} intensity={1.6 * ease(lin(t, K.seventh - 0.1, K.seventh + 0.2))} distance={1.6} decay={1} color="#ffe0b0" />}
			{glow > 0 && <pointLight position={[-1.55, 1.0, -8.7]} intensity={2.2 * glow} distance={1.9} decay={1} color="#a8b8b0" />}
			{shot !== 'rubble' && (
				<>
					<Person look={GUIDE} p={GUIDE_P} ry={guideRy} />
					{VIS_P.slice(0, 5).map((p, i) => (
						<Person key={i} look={VISITORS[i]} p={p} ry={Math.PI} yaw={shot === 'count' ? 0 : Math.sin(t * 0.4 + i) * 0.2} />
					))}
					{shot === 'count' && <Person look={VISITORS[5]} p={ME} ry={Math.PI} />}
				</>
			)}
			{showSoldier === 'hook' && <Soldier p={SOLDIER_HOOK} ry={Math.PI} bow={0.5} />}
			{showSoldier === 'end' && <Soldier p={SOLDIER_END} ry={shot === 'count' ? Math.PI : Math.PI} bow={shot === 'count' ? 0.55 - 0.25 * ease(lin(t, K.seventh, K.seventh + 0.8)) : 0.6} />}
			{shot === 'rubble' && <Dust t={t} p={[0.15, 3.3, -13.3]} k={lin(t, K.dust[0], K.dust[0] + 1.5)} />}
		</>
	);
};

const MainTunnel: React.FC<{t: number; shot: Shot}> = ({t, shot}) => {
	const m = useM();
	const walking = shot === 'walk';
	const z = walking ? walkZ(t) : -9 + (t - K.cutHonor) * 0.55;
	const ry = walking ? Math.PI : 0;
	const offs: V3[] = [[0, 0, -1.6], [-0.9, 0, -0.8], [0.8, 0, -0.6], [-0.4, 0, 0], [1.1, 0, 0.5], [-1.2, 0, 0.9]];
	const ppl = offs.map((o, i) => [o[0], 0, z + (walking ? o[2] : -o[2])] as V3);
	return (
		<>
			<Atmos color={walking ? '#000000' : '#1a2028'} near={walking ? 4 : 6} far={walking ? 18 : 30} />
			<ambientLight intensity={walking ? 0.16 : 0.35} color={walking ? '#8a7a68' : '#8a98a8'} />
			<Tunnel w={5.6} wh={2.0} z0={0} z1={-40} bolts />
			{/* outside the mouth: the night, or the dawn */}
			<Box p={[0, 4, 9]} s={[40, 20, 0.2]} m={walking ? m.black : m.dawn} unit={20} />
			<Box p={[0, -0.06, 5]} s={[12, 0.1, 10]} m={m.floor} unit={1} />
			{!walking && <pointLight position={[0, 2.2, 0.5]} intensity={2.2} distance={14} decay={1} color="#a8b8c8" />}
			{ppl.map((p, i) => (
				<Person key={i} look={i === 0 ? GUIDE : VISITORS[i - 1]} p={p} ry={ry} walk={(t * 0.9 + i * 0.37) % 1} />
			))}
			{walking &&
				ppl.map((p, i) => (
					<Beam key={`b${i}`} p={hand(p, ry)} target={[p[0] * 0.6 + Math.sin(t * 0.6 + i * 2) * 1.2 + (i % 2 ? 1.8 : -1.8) * (i % 3 === 0 ? 0 : 1), i % 3 === 0 ? 0 : 0.6 + (i % 2) * 0.8, p[2] - 3.5]} on={1} />
				))}
		</>
	);
};

const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotAt(t);
	const pose = poseAt(t, shot);
	return (
		<>
			<Cam pose={pose} />
			{shot === 'island' ? (
				<>
					<Atmos color="#0a1018" near={18} far={70} />
					<ambientLight intensity={0.55} color="#6a7a98" />
					<directionalLight position={[-9, 14, -30]} intensity={0.5} color="#c8d0e8" />
					<pointLight position={[0, 2.4, 4.4]} intensity={3} distance={9} decay={1} color="#ffb860" />
					<Island t={t} />
				</>
			) : shot === 'walk' || shot === 'honor' ? (
				<MainTunnel t={t} shot={shot} />
			) : (
				<Lateral t={t} shot={shot} pose={pose} />
			)}
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: captions, grain, after-images in the black
const offPose = (): CamPose => poseAt(K.outStart, 'off');
const project = (pose: CamPose, q: V3): [number, number] => {
	const c = new THREE.PerspectiveCamera(pose.fov, LW / LH, 0.03, 80);
	c.position.set(...pose.p);
	c.lookAt(...pose.l);
	c.updateMatrixWorld();
	c.updateProjectionMatrix();
	const v = new THREE.Vector3(...q).project(c);
	return [(v.x * 0.5 + 0.5) * 360, (1 - (v.y * 0.5 + 0.5)) * 640];
};
const Overlay: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
	const cap = useRef<HTMLCanvasElement>(null);
	const noise = useRef<HTMLCanvasElement>(null);
	const after = useRef<HTMLCanvasElement>(null);
	useLayoutEffect(() => {
		const CW = 360, CH = 640;
		// after-images: each beam's spot lingers, greenish, after it goes out
		const a = after.current!.getContext('2d')!;
		a.clearRect(0, 0, CW, CH);
		if (t >= K.outStart && t < K.cutOn) {
			const pose = offPose();
			const spots: V3[] = [[0, 0, -8.4], ...AIM.slice(1), [-0.1, 1.15, -10.5]];
			spots.forEach((s, k) => {
				const tOff = K.outStart + (NB - 1 - k) * 0.22;
				if (t < tOff) return;
				const v = Math.exp(-(t - tOff) / 1.4) * 0.5;
				if (v < 0.01) return;
				const [x, y] = project(pose, s);
				const gr = a.createRadialGradient(x, y, 0, x, y, 34);
				gr.addColorStop(0, `rgba(120,150,110,${v})`);
				gr.addColorStop(1, 'rgba(0,0,0,0)');
				a.fillStyle = gr;
				a.fillRect(x - 40, y - 40, 80, 80);
			});
		}
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
		const r = rng(Math.floor(t * 24) * 7919 + 40);
		for (let i = 0; i < ni.data.length; i += 4) {
			const v = r() * 255;
			ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = v;
			ni.data[i + 3] = 22 * (r() < 0.5 ? 1 : 0.4);
		}
		n.putImageData(ni, 0, 0);
	}, [t, captions]);
	return (
		<>
			<canvas ref={after} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'screen', imageRendering: 'pixelated'}} />
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

// ------------------------------------------------------------------ assembly
export const Episode40: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	// the loop shot runs on negative time: the hook's own first moments
	const tv = t >= K.loopShot ? t - DUR : t;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'saturate(0.7) contrast(1.15) sepia(0.15)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.03, far: 80}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			<Overlay t={tv} captions={captions} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep40-malinta-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
