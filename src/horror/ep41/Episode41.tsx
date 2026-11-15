// Episode 41: "Bilang sa Bintana" (Season 5 opener: a commuter's experience shared online, retold in our
// own words; no real person, operator, route or plate). Taglish, Juanito. The PSX models; hard cuts
// only; an eerie score; a seamless loop (the last shot is the first shot, on negative time).
// Form: "the count in the window". One night ride in a UV Express, cut between the van and its dark
// left window, where the reflection keeps a different count from the van.
// The picture: the window: in it, two pale women right beside me, faces turned to me (hook); the van
// alone on the avenue; from the front, everyone sways at a bump, the two women don't; my phone, their
// knees still beside it, one breath; the window: in it their heads turn toward me in jerks, too far;
// I turn: the two seats are empty, dented; the van goes on, nobody looks up; my hand on the warm seat;
// the window again: they are in it, nearer, at my shoulder, and the nearer one's head tips to the
// lens. Then the window of the hook (loop).
// Wrong movement (Season 5 standard): heads turned past where a neck can go, in held-then-snapped
// steps; bodies that don't ride the road; one breath from a body that never breathes.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep41-uv-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {Avenue, Cabin, LeftGlass, MatsProvider, Reflection, ROW, SEAT_TOP, SEATX, tex, useM, V3, VAN, VanExterior} from './world';
import {HANDS, Me, Others, road, setBumps, Women, WomanState} from './cast';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep41Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;
const SPEED = 11; // m/s, about 40 km/h

// ------------------------------------------------------------------ key times (scripts/ep41_sound.py uses the same rules)
const turnStart = L.l04.end + 0.85;
export const K = {
	cutExt: L.l02.start - 0.3,
	cutWide: L.l03.start - 0.3,
	lubak: L.l03.start + 2.9, // the big bump, on "lubak"
	cutSide: L.l03.start + 2.0, // a hard cut to the side, for the bump
	cutPhone: L.l04.start - 0.3,
	breath: [L.l04.end - 0.2, L.l04.end + 0.5] as [number, number], // her one breath
	cutWin1: L.l04.end + 0.5,
	// the heads turn in four held-then-snapped steps, in the silence before line 5
	snaps: [0, 0.42, 0.8, 1.22].map((d) => turnStart + d),
	cutEmpty: L.l05.end + 0.4,
	turnAway: [L.l05.end + 0.55, L.l05.end + 0.95] as [number, number], // I turn from the window to the seats
	cutAisle: L.l07.start - 0.3,
	cutHand: L.l07.start + 2.1,
	cutWin2: L.l07.end + 0.65,
	tip: L.l08.end + 0.4, // the nearer one's head tips to the lens (a snap) — the stinger
	loopShot: DUR - 1.7,
};
export const STINGERS = [K.tip];
setBumps([1.6, 4.4, 8.0, 9.9, K.cutWide + 0.9, K.lubak, K.lubak + 1.5, 21.0, 27.5, 33.5, 37.0, 38.7, 44.0, 47.9]);

type Shot = 'hook' | 'ext' | 'wide' | 'side' | 'phone' | 'win1' | 'empty' | 'aisle' | 'hand' | 'win2';
const CUTS: [number, Shot][] = [
	[K.cutExt, 'hook'],
	[K.cutWide, 'ext'],
	[K.cutSide, 'wide'],
	[K.cutPhone, 'side'],
	[K.cutWin1, 'phone'],
	[K.cutEmpty, 'win1'],
	[K.cutAisle, 'empty'],
	[K.cutHand, 'aisle'],
	[K.cutWin2, 'hand'],
];
const shotOf = (t: number): Shot => CUTS.find(([c]) => t < c)?.[1] ?? 'win2';

/** the stop-motion turn: held, then snapped (3 frames) to the next step */
const stepped = (t: number, steps: number[], snap = 0.1) => {
	let v = 0;
	for (const s of steps) v += ease(lin(t, s, s + snap)) / steps.length;
	return v;
};

const womenAt = (t: number, shot: Shot): {s: WomanState; monster: boolean} | null => {
	switch (shot) {
		case 'hook':
		case 'win2': {
			const tip = shot === 'win2' ? ease(lin(t, K.tip, K.tip + 0.09)) : 1;
			return {s: {turn: 1 + 0.12 * tip, near: 1, tilt: tip}, monster: true};
		}
		case 'wide':
		case 'side':
			return {s: {turn: 0, near: 0}, monster: false};
		case 'phone':
			return {s: {turn: 0, near: 0, breathe: Math.sin(Math.PI * lin(t, K.breath[0], K.breath[1]))}, monster: false};
		case 'win1':
			return {s: {turn: stepped(t, K.snaps), near: 0}, monster: false};
		default:
			return null; // the van: they are gone
	}
};

// ------------------------------------------------------------------ cameras
type CamPose = {p: V3; l: V3; fov: number; roll?: number};
const Cam: React.FC<{get: () => CamPose}> = ({get}) => {
	const {camera} = useThree();
	// set now, and again just before each draw (a shot that follows my hands needs them posed first)
	useFrame(() => aim(camera, get()));
	aim(camera, get());
	return null;
};
const aim = (camera: THREE.Camera, pose: CamPose) => {
	camera.position.set(...pose.p);
	camera.up.set(Math.sin(pose.roll ?? 0), Math.cos(pose.roll ?? 0), 0);
	camera.lookAt(...pose.l);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = pose.fov;
	c.near = 0.02;
	c.far = 120;
	c.updateProjectionMatrix();
};
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
/** a move from a to b over [t0, t1], riding the van's road (inside) and a hand's tremble */
const move = (t: number, t0: number, t1: number, a: V3, b: V3, la: V3, lb: V3, fov: number, inside = true): CamPose => {
	const k = ease(lin(t, t0, t1));
	const hh = handheld(t, 0.25);
	const r = inside ? road(t) : {y: 0, roll: 0};
	const p = mix3(a, b, k);
	return {p: [p[0] + hh.dp[0] * 0.4, p[1] + hh.dp[1] * 0.4 + r.y * 0.5, p[2]], l: mix3(la, lb, k), fov, roll: r.roll * 0.5};
};
// the window: from the rear bench's legroom, looking back-left into the glass, so the mirrored bench
// reads obliquely (my face at one edge, the seats beside me in the middle)
export const WIN_P: V3 = [-0.72, 1.15, 0.9];
export const WIN_L1: V3 = [-1.429, 1.08, 1.454]; // the turn: they are still in their own seats
export const WIN_L: V3 = [-1.367, 1.08, 1.525];
const vanZ = (t: number) => -SPEED * (t - K.cutExt);

const poseAt = (t: number, shot: Shot): CamPose => {
	switch (shot) {
		case 'hook':
			return move(t, -1.7, K.cutExt, [-0.72, 1.15, 0.92], [-0.73, 1.15, 0.97], WIN_L, WIN_L, 64);
		case 'win2':
			return move(t, K.cutWin2, K.tip, [-0.71, 1.15, 0.86], [-0.72, 1.15, 0.92], WIN_L, WIN_L, 64);
		case 'win1':
			return move(t, K.cutWin1, K.cutEmpty, [-0.71, 1.15, 0.86], [-0.72, 1.15, 0.92], WIN_L1, WIN_L1, 64);
		case 'ext': {
			const z = vanZ(t);
			const k = ease(lin(t, K.cutExt, K.cutWide));
			return {p: [-3.0 - 0.6 * k, 0.8 + 0.9 * k, z - 7.5 + 2.0 * k], l: [0.9, 0.9, z], fov: 50};
		}
		case 'wide':
			return move(t, K.cutWide, K.cutSide, [0.1, 1.36, -1.85], [0.06, 1.35, -1.6], [-0.15, 0.92, 1.6], [-0.15, 0.92, 1.6], 54);
		case 'side':
			return move(t, K.cutSide, K.cutPhone, [0.72, 1.2, 0.98], [0.7, 1.18, 1.05], [-0.4, 0.82, 1.55], [-0.4, 0.82, 1.55], 60);
		case 'phone': {
			// over my right shoulder, down at the phone in my hands (its place comes from my hands)
			const ph = phoneAt();
			// my eyes, down at the phone in my lap; at the edge, her hand on her thigh, never moving
			const e = HANDS.head;
			const c0 = mix3([e[0] + 0.03, e[1] + 0.17, e[2] - 0.17], ph, 0.45);
			return move(t, K.cutPhone, K.cutWin1, c0, mix3(c0, ph, 0.12), [ph[0] + 0.04, ph[1] - 0.02, ph[2] + 0.02], [ph[0] + 0.06, ph[1] - 0.02, ph[2] + 0.04], 70);
		}
		case 'empty': {
			const k = ease(lin(t, K.turnAway[0], K.turnAway[1]));
			const hh = handheld(t, 0.3);
			const r = road(t);
			return {p: [-0.6 + hh.dp[0] * 0.3, 1.16 + r.y * 0.5, 1.36], l: mix3([-1.4, 1.0, 1.0], [0.05, 0.42, 1.48], k), fov: 60, roll: r.roll * 0.5};
		}
		case 'aisle':
			return move(t, K.cutAisle, K.cutHand, [-0.5, 1.18, 1.55], [-0.45, 1.16, 1.4], [0.05, 0.85, -1.9], [0.0, 0.85, -1.9], 58);
		case 'hand':
			return move(t, K.cutHand, K.cutWin2, [0.02, 1.06, 1.0], [-0.02, 0.98, 1.06], [-0.22, 0.44, 1.48], [-0.22, 0.44, 1.48], 54);
	}
};

// ------------------------------------------------------------------ the phone (an original little runner game)
const Phone: React.FC<{t: number; r: V3; glow: number}> = ({t, r, glow}) => {
	const grp = useRef<THREE.Group>(null);
	useFrame(() => grp.current?.position.set(...phoneAt()));
	const canvas = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = 24;
		c.height = 44;
		return c;
	}, []);
	const map = useMemo(() => {
		const tx = new THREE.CanvasTexture(canvas);
		tx.magFilter = THREE.NearestFilter;
		tx.minFilter = THREE.NearestFilter;
		tx.generateMipmaps = false;
		tx.colorSpace = THREE.SRGBColorSpace;
		return tx;
	}, [canvas]);
	const g = canvas.getContext('2d')!;
	g.fillStyle = '#0a1830';
	g.fillRect(0, 0, 24, 44);
	g.fillStyle = '#1e3a68';
	g.fillRect(0, 30, 24, 14);
	const run = t * 14;
	g.fillStyle = '#ffd040';
	for (let i = 0; i < 4; i++) {
		const x = 24 - (((run + i * 9) % 36) | 0);
		g.fillRect(x, 26, 2, 4);
	}
	const jump = Math.max(0, Math.sin(t * 5.2)) * 6;
	g.fillStyle = '#7ff0ff';
	g.fillRect(5, 25 - jump, 3, 4);
	g.fillStyle = '#ffffff';
	g.fillRect(2, 3, 1 + ((t * 3) | 0) % 9, 1);
	map.needsUpdate = true;
	return (
		<group ref={grp} position={phoneAt()} rotation={r}>
			<pointLight position={[0, 0.22, 0.12]} intensity={glow} distance={0.8} decay={1} color="#8cc8ff" />
			<mesh>
				<boxGeometry args={[0.075, 0.145, 0.01]} />
				<meshBasicMaterial color="#111" />
			</mesh>
			<mesh position={[0, 0, 0.0055]}>
				<planeGeometry args={[0.066, 0.128]} />
				<meshBasicMaterial map={map} />
			</mesh>
		</group>
	);
};
const PHONE_R: V3 = [-1.0, 0, 0];
/** the phone: between my hands, a little forward of them */
const phoneAt = (): V3 => [(HANDS.l[0] + HANDS.r[0]) / 2, (HANDS.l[1] + HANDS.r[1]) / 2 + 0.03, (HANDS.l[2] + HANDS.r[2]) / 2 - 0.03];

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotOf(t);
	const cam = <Cam get={() => poseAt(t, shot)} />;
	const travel = SPEED * t;
	// the nearest street lamp, sweeping past outside (both sides); 0..1 brightness
	const lampK = (side: number) => {
		const z = (((travel + side * 7) % 22) + 22) % 22 - 11;
		return {z: z * 0.6, k: Math.exp(-(z * z) / 12)};
	};
	const lr = lampK(0), ll = lampK(1);
	if (shot === 'ext') {
		const z = vanZ(t);
		const lamps = [0, 1, 2].map((i) => Math.floor(z / 22) * 22 + (i - 1) * 22);
		return (
			<>
				{cam}
				<ambientLight intensity={1.7} color="#4a5878" />
				{lamps.map((lz) => (
					<pointLight key={lz} position={[7.0, 6.2, lz]} intensity={16} distance={26} decay={1} color="#ffa850" />
				))}
				<spotLight position={[0, 0.9, z - 2.2]} target-position={[0, 0, z - 14]} intensity={6} distance={24} angle={0.45} penumbra={0.5} color="#fff0d0" />
				<Avenue z0={z - 70} z1={z + 50} />
				<VanExterior p={[0.9, 0, z]} roll={road(t).roll * 0.3} />
			</>
		);
	}
	const w = womenAt(t, shot);
	const reflect = shot === 'hook' || shot === 'win1' || shot === 'win2' || shot === 'empty';
	const refl = w ?? (shot === 'empty' ? {s: {turn: 1, near: 0}, monster: false} : null);
	const phone = shot !== 'hand' && shot !== 'empty' && shot !== 'aisle';
	// dents where they sat (the empty seats keep them)
	const dents = [0, w ? 0 : 1, w ? 0 : 0.9, 0];
	const pov = shot === 'hook' || shot === 'win1' || shot === 'win2' || shot === 'empty';
	return (
		<>
			<ambientLight intensity={1.6} color="#5a6a88" />
			{/* a weak dome light mid-cabin and a weaker one at the back */}
			<pointLight position={[0, 1.36, -0.2]} intensity={1.4} distance={3.2} decay={1} color="#a8c0d8" />
			<pointLight position={[0, 1.36, 1.2]} intensity={1.8} distance={2.4} decay={1} color="#a8c0d8" />
			<pointLight position={[2.2, 1.6, lr.z]} intensity={6 * lr.k} distance={4.5} decay={1} color="#ffa040" />
			<pointLight position={[-2.6, 1.6, ll.z]} intensity={4 * ll.k} distance={4.5} decay={1} color="#ffa040" />
			<Cabin dents={dents}>
				<Others t={t} hideB2Left={shot === 'hook' || shot === 'win1' || shot === 'win2'} />
				{!pov && <Me t={t} phone={shot === 'hand' ? 0 : 1} reach={shot === 'hand' ? ease(lin(t, K.cutHand + 0.4, K.cutHand + 1.6)) : 0} />}
				{w && !(shot === 'hook' || shot === 'win2') && <Women s={w.s} monster={false} />}
				{phone && !pov && <Phone t={t} r={PHONE_R} glow={shot === 'phone' ? 2.2 : 0.8} />}
			</Cabin>
			<LeftGlass travel={travel} />
			<group scale={[-1, 1, 1]}>
				<LeftGlass travel={travel + 7} />
			</group>
			{reflect && (
				<Reflection dents={[0, 0, 0, 0]}>
					{/* the faces in the glass catch a little cold light */}
					<pointLight position={[-0.1, 1.3, 0.85]} intensity={0.9} distance={1.4} decay={1} color="#b8c8e0" />
					<Others t={t} front={false} />
					<Me t={t} phone={shot === 'empty' ? 0 : 1} look={shot === 'empty' ? ease(lin(t, K.turnAway[0], K.turnAway[1])) : 0} />
					{shot !== 'empty' && <Phone t={t} r={PHONE_R} glow={0.9} />}
					{refl && <Women s={refl.s} monster={refl.monster} />}
				</Reflection>
			)}
			{cam}
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
		const r = rng(Math.floor(t * 24) * 7919 + 41);
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

export const Episode41: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	// the loop shot runs on negative time: the hook's own first moments
	const tv = t >= K.loopShot ? t - DUR : t;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: 'scale(' + SCALE + ')', transformOrigin: '0 0', filter: 'saturate(0.62) contrast(1.15) hue-rotate(-6deg)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.02, far: 120}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			<Overlay t={tv} captions={captions} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep41-uv-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
