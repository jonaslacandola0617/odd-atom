// Episode 44: "Sumunod ang Katok" (Season 5: an experience shared online, retold in our own words; no
// real family or town). Taglish, Juanito. The PSX models; hard cuts only; an eerie score; a seamless loop.
// Form: "the plan". The house from above, ceiling off. After Lolo's wake, the knocking comes home and
// climbs the plan night by night: the front door, the kitchen door, Mama and Papa's door, mine. Each
// knock shakes its door and lights the gap under it. From my bed: the light under my door, the shadows
// of two feet. I open it. At the end of the hall, Lolo, his back to me; his head turns round, his body
// does not; then he is nearer. Then the house from above, three knocks at my door (loop).
// Care: grief treated kindly (the narration's last word is Mama's: he may not have said goodbye);
// the wake shown with respect; Lolo never harmed, never grotesque: pale, still, wrong only in the turn.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep44-katok-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {ARMS_DOWN, merge, PsxCharacter, PsxProp, SIT} from '../psx/models';
import {Door, DoorId, DOORS, House, MatsProvider, V3, Wake} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep44Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;
const three = (t0: number) => [t0, t0 + 0.3, t0 + 0.6];

// ------------------------------------------------------------------ key times (scripts/ep44_sound.py uses the same rules)
export const K = {
	knocks0: three(-0.6), // the hook's three knocks at my door (they straddle the loop seam)
	cutWake: L.l02.start - 0.3,
	cutN1: L.l03.start - 1.2,
	knocks1: three(L.l03.start - 1.04),
	cutN2: L.l04.start - 1.2,
	knocks2: three(L.l04.start - 1.05),
	cutN3: L.l05.start - 1.2,
	knocks3: three(L.l05.start - 1.06),
	lift3: L.l05.start - 0.2, // Mama and Papa lift their heads
	cutBed: L.l06.start - 1.4,
	knocks4: three(L.l06.start - 1.13),
	cutKnob: L.l07.start - 0.3,
	knob: L.l07.end + 0.4,
	cutOpen: L.l08.start - 1.0,
	cutHall: L.l08.start + 1.2,
	turns: [3.6, 4.4, 5.2].map((d) => L.l08.start + d), // his head comes round in three snaps
	snap: L.l08.end + 0.45, // he is nearer, face to me (the stinger)
	loopShot: DUR - 1.7,
};
export const KNOCKS = [...K.knocks0, ...K.knocks1, ...K.knocks2, ...K.knocks3, ...K.knocks4];
export const STINGERS = [K.snap];

type Shot = 'hook' | 'wake' | 'n1' | 'n2' | 'n3' | 'bed' | 'knob' | 'open' | 'hall';
const CUTS: [number, Shot][] = [
	[K.cutWake, 'hook'],
	[K.cutN1, 'wake'],
	[K.cutN2, 'n1'],
	[K.cutN3, 'n2'],
	[K.cutBed, 'n3'],
	[K.cutKnob, 'bed'],
	[K.cutOpen, 'knob'],
	[K.cutHall, 'open'],
];
const shotOf = (t: number): Shot => CUTS.find(([c]) => t < c)?.[1] ?? 'hall';
const topdown = (s: Shot) => s === 'hook' || s === 'n1' || s === 'n2' || s === 'n3';

/** a door's state at t: a short shudder on each knock, the light in its gap rising with the knocks */
const knockState = (t: number, ks: number[]) => {
	let shake = 0;
	for (const k of ks) {
		const d = t - k;
		if (d >= 0 && d < 0.18) shake = Math.max(shake, Math.sin(d * 70) * Math.exp(-d * 18));
	}
	const glow = ks.reduce((g, k) => g + (t >= k ? 0.33 : 0), 0) * (0.8 + 0.2 * Math.sin(t * 9));
	return {shake, glow: Math.min(1, glow)};
};

// ------------------------------------------------------------------ the people
const PALE = {color: '#d0d8dc', emissive: '#1e2428'};
/** someone lying on their back on a bed; lift: the head raised toward the door */
const Lying: React.FC<{name: string; p: V3; ry: number; height?: number; t: number; seed: number; lift?: number}> = ({name, p, ry, height = 1.66, t, seed, lift = 0}) => (
	<group position={p} rotation={[0, ry, 0]}>
		<PsxCharacter name={name} height={height} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} pose={merge(ARMS_DOWN, {Spine2: [['x', Math.sin(t * 1.2 + seed) * 0.03]], Neck: [['x', 0.25 + 0.45 * lift]]})} />
	</group>
);
/** Lolo: standing, his back to me; turn: his head coming round (to ~175°), the body never moving */
const Lolo: React.FC<{p: V3; turn: number; tilt?: number}> = ({p, turn, tilt = 0}) => (
	<PsxCharacter
		name="Character_29"
		height={1.62}
		tint={PALE}
		position={p}
		rotation={[0, 0, 0]}
		pose={merge(ARMS_DOWN, {Neck: [['x', 0.1], ['y', 1.3 * turn]], Head: [['y', 1.75 * turn], ['z', 0.35 * tilt], ['x', -0.1 * tilt]]})}
	/>
);
const stepped = (t: number, steps: number[], snap = 0.1) => steps.reduce((v, s) => v + ease(lin(t, s, s + snap)) / steps.length, 0);

// ------------------------------------------------------------------ cameras
type CamPose = {p: V3; l: V3; fov: number; up?: V3};
const aim = (camera: THREE.Camera, pose: CamPose) => {
	camera.position.set(...pose.p);
	camera.up.set(...(pose.up ?? [0, 1, 0]));
	camera.lookAt(...pose.l);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = pose.fov;
	c.near = 0.02;
	c.far = 60;
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
/** straight down from above, the plan's −z toward the top of the frame, pushing down a little */
const above = (t: number, t0: number, t1: number, c: V3, h0: number, h1: number): CamPose => {
	const k = ease(lin(t, t0, t1));
	const h = h0 + (h1 - h0) * k;
	return {p: [c[0], h * 2.2, c[2] + 0.001], l: [c[0], 0, c[2]], fov: 26, up: [0, 0, -1]};
};
const LOLO_FAR: V3 = [-0.4, 0, 0.5];
const LOLO_NEAR: V3 = [-0.4, 0, -1.7];

const poseAt = (t: number, shot: Shot): CamPose => {
	switch (shot) {
		case 'hook':
			return above(t, -1.7, K.cutWake, [-1.6, 0, -3.3], 9.0, 6.2);
		case 'wake':
			return move(t, K.cutWake, K.cutN1, [40.1, 1.75, 3.6], [40.05, 1.6, 2.9], [40, 0.95, -1.2], [40, 0.95, -1.2], 60);
		case 'n1':
			return above(t, K.cutN1, K.cutN2, [-1.2, 0, 3.4], 8.0, 6.5);
		case 'n2':
			return above(t, K.cutN2, K.cutN3, [2.6, 0, 2.6], 8.0, 6.5);
		case 'n3':
			return above(t, K.cutN3, K.cutBed, [1.6, 0, -0.6], 8.0, 6.0);
		case 'bed':
			// my eyes from the pillow, down the bed to my door
			return move(t, K.cutBed, K.cutKnob, [-2.75, 0.62, -4.35], [-2.7, 0.6, -4.2], [-1.05, 0.25, -4.0], [-1.05, 0.22, -4.0], 54, 0.1);
		case 'knob':
			return move(t, K.cutKnob, K.cutOpen, [-1.75, 1.32, -3.55], [-1.6, 1.25, -3.75], [-1.04, 1.0, -4.3], [-1.04, 1.0, -4.33], 46, 0.2);
		case 'open':
			return move(t, K.cutOpen, K.cutHall, [-2.4, 1.5, -4.0], [-2.1, 1.5, -4.0], [-1.0, 1.1, -4.0], [-1.0, 1.1, -4.0], 56, 0.2);
		case 'hall':
			// in my doorway, down the hall to its end
			return move(t, K.cutHall, K.snap, [-0.55, 1.5, -4.3], [-0.5, 1.48, -4.0], [-0.4, 1.2, 0.8], [-0.4, 1.25, 0.8], 50, 0.25);
	}
};

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotOf(t);
	const cam = <Cam get={() => poseAt(t, shot)} />;
	if (shot === 'wake') {
		return (
			<>
				{cam}
				<ambientLight intensity={1.4} color="#6a6070" />
				<Wake t={t} />
				<PsxCharacter name="Character_Female_05" height={1.58} position={[39.2, -0.33, 0.6]} rotation={[0, Math.PI, 0]} pose={merge(SIT, {Neck: [['x', 0.45]]})} />
				<group position={[39.2, 0, 0.6]}>
					<PsxProp path="assets/models/psx/props/derelict-chair.glb" />
				</group>
				<PsxCharacter name="Character_10" height={1.68} position={[40.9, -0.33, 0.9]} rotation={[0, Math.PI, 0]} pose={merge(SIT, {Neck: [['x', 0.35]]})} />
				<group position={[40.9, 0, 0.9]}>
					<PsxProp path="assets/models/psx/props/derelict-chair.glb" />
				</group>
			</>
		);
	}
	const td = topdown(shot);
	const door = (id: DoorId) => {
		const ks = id === 'front' ? K.knocks1 : id === 'kitchen' ? K.knocks2 : id === 'mama' ? K.knocks3 : [...K.knocks0, ...K.knocks4];
		const on = (id === 'front' && shot === 'n1') || (id === 'kitchen' && shot === 'n2') || (id === 'mama' && shot === 'n3') || (id === 'mine' && (shot === 'hook' || shot === 'bed' || shot === 'knob'));
		const st = on ? knockState(t, ks) : {shake: 0, glow: 0};
		const open = id === 'mine' ? (shot === 'open' ? ease(lin(t, K.cutOpen + 0.3, K.cutOpen + 1.4)) : shot === 'hall' ? 1 : 0) : 0;
		return <Door key={id} id={id} shake={st.shake} glow={shot === 'bed' || shot === 'knob' ? 0.85 : st.glow} open={open} />;
	};
	const lift = shot === 'n3' ? ease(lin(t, K.lift3, K.lift3 + 0.8)) : 0;
	const turn = stepped(t, K.turns);
	const near = shot === 'hall' && t >= K.snap;
	return (
		<>
			{cam}
			<ambientLight intensity={td ? 1.9 : 1.0} color="#4a5a7a" />
			{td && <pointLight position={[0, 7, 0]} intensity={1.6} distance={22} decay={1} color="#9ab4e0" />}
			{(shot === 'open' || shot === 'hall') && <pointLight position={[-0.4, 2.1, -3.6]} intensity={1.3} distance={3.5} decay={1} color="#a8bcd8" />}
			{/* moonlight through the sala and kitchen windows */}
			<pointLight position={[-2.5, 2.2, 4.4]} intensity={1.4} distance={6} decay={1} color="#8aa8d8" />
			<pointLight position={[2.5, 2.2, 4.4]} intensity={1.0} distance={5} decay={1} color="#8aa8d8" />
			<pointLight position={[-2.6, 2.0, -4.4]} intensity={0.8} distance={4} decay={1} color="#8aa8d8" />
			<House ceiling={!td}>
				{(['front', 'kitchen', 'mama', 'mine'] as DoorId[]).map(door)}
				{/* me in bed (not in my own POV shots) */}
				{td && <Lying name="Character_14" p={[-2.7, 0.27, -2.8]} ry={0} t={t} seed={1} />}
				{(shot === 'knob' || shot === 'open') && (
					<PsxCharacter
						name="Character_14"
						height={1.7}
						position={[-1.65, 0, -4.15]}
						rotation={[0, Math.PI / 2, 0]}
						pose={merge(ARMS_DOWN, {
							RightArm: [['aim', [0.25, -0.35, 1]]],
							RightForeArm: [['aim', [0.4, -0.15 + 0.03 * Math.sin(t * 40), 1]]],
							Neck: [['x', 0.1]],
						})}
					/>
				)}
				{/* Mama and Papa */}
				<Lying name="Character_31_Female" p={[2.6, 0.29, -0.7]} ry={-Math.PI / 2} height={1.55} t={t} seed={2} lift={lift} />
				<Lying name="Character_05" p={[2.6, 0.29, -0.1]} ry={-Math.PI / 2} t={t} seed={3} lift={lift * 0.8} />
				{/* the shadows of two feet in the light under my door */}
				{(shot === 'bed' || shot === 'knob') &&
					[-0.12, 0.12].map((dz) => (
						<mesh key={dz} position={[DOORS.mine.p[0] - 0.1, 0.012, DOORS.mine.p[2] + dz]} rotation={[-Math.PI / 2, 0, 0]}>
							<planeGeometry args={[0.18, 0.09]} />
							<meshBasicMaterial color="#000000" transparent opacity={0.85} />
						</mesh>
					))}
				{shot === 'hall' && (
					<>
						<Lolo p={near ? LOLO_NEAR : LOLO_FAR} turn={near ? 1.04 : turn} tilt={near ? 1 : 0} />
						<pointLight position={[-0.4, 2.2, near ? -0.8 : 1.4]} intensity={near ? 1.6 : 1.1} distance={3.2} decay={1} color="#a8bcd8" />
					</>
				)}
			</House>
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
		const r = rng(Math.floor(t * 24) * 7919 + 44);
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

export const Episode44: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	// the loop shot runs on negative time: the hook's own first moments
	const tv = t >= K.loopShot ? t - DUR : t;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: 'scale(' + SCALE + ')', transformOrigin: '0 0', filter: 'saturate(0.6) contrast(1.15) hue-rotate(-6deg)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.02, far: 60}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			<Overlay t={tv} captions={captions} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep44-katok-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
