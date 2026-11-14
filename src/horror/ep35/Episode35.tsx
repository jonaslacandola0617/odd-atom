// Episode 35: "Bantay" (Season 4, Visayan folklore: the amalanhig, and why the lamay is kept all
// night). Taglish, Juanito. Built to the motion rule; hard cuts only; an eerie score; a seamless loop
// (the last shot is the first shot, on negative time).
// Form: "the clock". One house, one night, in hard cuts by the hour, the camera orbiting the coffin a
// little lower each hour; then one top-down chase, the only fast motion in the episode.
// The picture: the coffin's glass fogs from the inside, then four finger streaks (hook); 9 p.m., the
// wake is full; 11 p.m., fewer, the candle flames lean toward the coffin; 1 a.m., one watcher left,
// dozing; 2 a.m., the cloth slides off the mirror, and in the mirror the lid is open while in the room
// it is shut; 3 a.m.; the body is standing beside its coffin; it turns to you; from above, you run
// zigzag through the chairs and it goes straight, slamming through them; dawn: everyone back, the
// coffin shut, and a straight line of mud from the door to it. Then the glass again (loop).
// Care: no real family or parlour; the dead man is never shown decayed or wounded; the custom is
// told with respect (keeping watch is love, not fear).
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep35-bantay-v1-timeline.json';
import {rng} from '../ps1';
import {handheld, Villager} from '../entities';
import {Body, CLOCK, COFFIN, DOOR, GLASS, MIRROR, MatsProvider, V3, WakeRoom} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep35Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep35_sound.py uses the same rules)
export const K = {
	fog: [0.3, 3.4] as [number, number],
	streaks: [L.l01.end + 0.12, L.l01.end + 0.85] as [number, number], // after the line: the stinger sits in the gap
	cutNine: L.l02.start - 0.3,
	cutEleven: L.l03.start - 0.3,
	cutOne: L.l04.start - 0.3,
	cutTwo: L.l05.start - 0.3,
	cloth: [L.l05.start + 0.8, L.l05.start + 1.8] as [number, number],
	toRoom: L.l05.end - 0.8, // the camera turns from the mirror to the real coffin: shut
	cutClock: L.l06.start - 0.3,
	three: L.l06.end - 0.6, // 2:59 -> 3:00
	cutStand: L.l06.end + 0.4,
	cutTurn: L.l08.start - 0.3,
	turned: L.l08.end + 0.15,
	cutChase: L.l08.end + 0.6,
	chase: [L.l08.end + 0.8, L.l08.end + 4.8] as [number, number],
	cutDawn: L.l08.end + 5.2,
	loopShot: DUR - 1.7,
};
export const STINGERS = [K.streaks[0], K.cutStand, K.turned];

type Shot = 'glass' | 'nine' | 'eleven' | 'one' | 'two' | 'clock' | 'stand' | 'turn' | 'chase' | 'dawn';
const shotAt = (t: number): Shot => {
	if (t < K.cutNine) return 'glass';
	if (t < K.cutEleven) return 'nine';
	if (t < K.cutOne) return 'eleven';
	if (t < K.cutTwo) return 'one';
	if (t < K.cutClock) return 'two';
	if (t < K.cutStand) return 'clock';
	if (t < K.cutTurn) return 'stand';
	if (t < K.cutChase) return 'turn';
	if (t < K.cutDawn) return 'chase';
	return 'dawn';
};

// ------------------------------------------------------------------ the chase (from above)
const BODY0: V3 = [0.15, 0, -1.95];
const WATCH0: V3 = [-0.5, 0, 0.4];
const PATH: [number, number][] = [[-0.5, 0.4], [-1.9, 1.1], [-0.2, 1.9], [-1.6, 2.6], [1.2, 3.5]];
const along = (pts: [number, number][], k: number): [number, number] => {
	const segs = pts.length - 1;
	const f = Math.min(segs - 1e-6, k * segs);
	const i = Math.floor(f), u = f - i;
	return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u];
};
const watcherAt = (t: number): [number, number] => along(PATH, ease(lin(t, K.chase[0], K.chase[1] - 0.3)));
const bodyAt = (t: number): [number, number] => {
	const k = lin(t, K.chase[0] + 0.35, K.chase[1]);
	return [BODY0[0] + (DOOR[0] - BODY0[0]) * k, BODY0[2] + (3.4 - BODY0[2]) * k];
};
// which chairs it slams through (the middle column on its straight line): 2, 6, 10
const chairFalls = (t: number) => {
	const out: number[] = [];
	const [, bz] = bodyAt(t);
	for (const [i, z] of [[2, -0.7], [6, 0.4], [10, 1.5]] as [number, number][]) out[i] = ease(lin(bz, z - 0.35, z + 0.1));
	return out;
};

// ------------------------------------------------------------------ cameras
type CamPose = {p: V3; l: V3; fov: number; up?: V3};
const Cam: React.FC<{pose: CamPose}> = ({pose}) => {
	const {camera} = useThree();
	camera.position.set(...pose.p);
	camera.up.set(...(pose.up ?? [0, 1, 0]));
	camera.lookAt(...pose.l);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = pose.fov;
	c.near = 0.03;
	c.far = 200;
	camera.updateProjectionMatrix();
	return null;
};
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
// the orbit: each hour lower and closer
const orbit = (t: number, a0: number, a1: number, h: number, r: number, t0: number, t1: number): CamPose => {
	const k = lin(t, t0, t1);
	const a = a0 + (a1 - a0) * k;
	return {p: [COFFIN[0] + Math.sin(a) * r, h, COFFIN[2] + Math.cos(a) * r], l: [COFFIN[0], 0.9, COFFIN[2]], fov: 52};
};

const poseAt = (t: number, shot: Shot): CamPose => {
	const hh = handheld(t, 0.5);
	switch (shot) {
		case 'glass': {
			const k = lin(t, -3, K.cutNine);
			return {p: add(GLASS, [0.0, 0.62 - 0.12 * k, 0.001]), l: GLASS, fov: 42, up: [-1, 0, 0]};
		}
		case 'nine':
			return orbit(t, 0.2, 0.0, 2.7, 5.7, K.cutNine, K.cutEleven);
		case 'eleven':
			return orbit(t, 0.4, -0.05, 2.1, 4.2, K.cutEleven, K.cutOne);
		case 'one':
			return orbit(t, -0.15, -0.55, 1.6, 3.6, K.cutOne, K.cutTwo);
		case 'two': {
			// from the watcher's chair: the mirror; then the turn to the real coffin, shut
			const turn = ease(lin(t, K.toRoom, K.toRoom + 0.8));
			const p: V3 = [-0.6 + hh.dp[0] * 0.3, 1.25, 0.6];
			const lm: V3 = [MIRROR[0], MIRROR[1] - 0.1, MIRROR[2]];
			const lc: V3 = [COFFIN[0], 0.95, COFFIN[2]];
			const push = ease(lin(t, K.cutTwo, K.toRoom));
			return {p: [p[0] - 1.0 * push * (1 - turn), p[1], p[2] - 0.3 * push * (1 - turn)], l: [lm[0] + (lc[0] - lm[0]) * turn, lm[1] + (lc[1] - lm[1]) * turn, lm[2] + (lc[2] - lm[2]) * turn], fov: 46 - 8 * push * (1 - turn)};
		}
		case 'clock': {
			const k = ease(lin(t, K.cutClock, K.cutStand));
			return {p: add(CLOCK, [0.1 + hh.dp[0] * 0.2, -0.1, 1.2 - 0.5 * k]), l: CLOCK, fov: 40};
		}
		case 'stand': {
			// over the sleeping watcher's shoulder to the coffin: something stands beside it
			const k = ease(lin(t, K.cutStand, K.cutTurn));
			return {p: [-0.9 + 0.2 * k + hh.dp[0] * 0.2, 1.3, 1.4 - 0.4 * k], l: [0.2, 1.1, -2.0], fov: 50};
		}
		case 'turn': {
			const k = ease(lin(t, K.cutTurn, K.cutChase));
			return {p: [0.15 + hh.dp[0] * 0.1, 1.55, -0.6 - 0.3 * k], l: [0.15, 1.55, -1.95], fov: 42};
		}
		case 'chase':
			return {p: [0.0, 6.4, 0.9], l: [0.0, 0, 0.9], fov: 58, up: [0, 0, -1]};
		case 'dawn': {
			const k = ease(lin(t, K.cutDawn, DUR));
			return {p: [0.8, 0.45 + 0.4 * k, 3.0 - 2.2 * k], l: [0.3, 0.3 + 0.5 * k, -2.6], fov: 50};
		}
	}
};

// ------------------------------------------------------------------ the fog on the glass, drawn from the inside
const Fog: React.FC<{k: number; streaks: number}> = ({k, streaks}) => {
	const W = 64, H = 32;
	const tx = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = W;
		c.height = H;
		const t = new THREE.CanvasTexture(c);
		t.magFilter = THREE.NearestFilter;
		t.minFilter = THREE.NearestFilter;
		t.generateMipmaps = false;
		return t;
	}, []);
	const g = (tx.image as HTMLCanvasElement).getContext('2d')!;
	g.clearRect(0, 0, W, H);
	if (k > 0) {
		const r = rng(35);
		for (let i = 0; i < 260; i++) {
			const x = r() * W, y = r() * H;
			const d = Math.hypot((x - W / 2) / W, (y - H / 2) / H);
			if (d < 0.75 * k) {
				g.fillStyle = `rgba(230,236,240,${0.55 * Math.min(1, (0.75 * k - d) * 4)})`;
				g.fillRect(Math.floor(x), Math.floor(y), 2, 2);
			}
		}
	}
	if (streaks > 0) {
		// four fingers wiped through the fog, from the inside
		g.globalCompositeOperation = 'destination-out';
		for (let i = 0; i < 4; i++) g.fillRect(18 + i * 7, 4, 3, Math.round(22 * streaks));
		g.globalCompositeOperation = 'source-over';
	}
	tx.needsUpdate = true;
	const m = useMemo(() => new THREE.MeshBasicMaterial({map: tx, transparent: true, depthWrite: false}), [tx]);
	return (
		<mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m}>
			<planeGeometry args={[0.58, 0.26]} />
		</mesh>
	);
};

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotAt(t);
	const pose = poseAt(t, shot);
	const hour = shot === 'nine' ? 9 : shot === 'eleven' ? 11 : shot === 'one' ? 1 : shot === 'two' ? 2 : shot === 'clock' ? (t < K.three ? 2 : 3) : shot === 'dawn' ? 5 : 3;
	const minute = shot === 'clock' ? (t < K.three ? 59 : 0) : shot === 'dawn' ? 40 : shot === 'two' ? 10 : 0;
	const dawn = shot === 'dawn' ? 1 : 0;
	const lean = shot === 'eleven' || shot === 'one' ? 0.8 : 0;
	const mourners = shot === 'nine' ? 9 : shot === 'eleven' ? 3 : shot === 'dawn' ? 4 : 0;
	const seats: [number, number][] = [[-1.5, -0.7], [-0.5, -0.7], [1.5, -0.7], [-1.5, 0.4], [0.5, 0.4], [1.5, 0.4], [-0.5, 1.5], [0.5, 1.5], [1.5, 1.5]];
	const watcherSits = shot === 'one' || shot === 'two' || shot === 'clock' || shot === 'stand' || shot === 'glass';
	const bodyStanding = shot === 'stand' || shot === 'turn';
	const inChase = shot === 'chase';
	const flick = 0.9 + 0.1 * Math.sin(t * 13) * Math.sin(t * 5.3);
	const w = watcherAt(t), b = bodyAt(t);
	const fogK = shot === 'glass' ? ease(lin(t, K.fog[0], K.fog[1])) : 0;
	const streak = shot === 'glass' ? ease(lin(t, K.streaks[0], K.streaks[1])) : 0;
	return (
		<>
			<Cam pose={pose} />
			<ambientLight intensity={dawn ? 1.1 : inChase ? 0.8 : 0.55} color={dawn ? '#d8c8b0' : '#8a90a0'} />
			<pointLight position={[0, 2.85, -0.5]} intensity={dawn ? 0.5 : (shot === 'nine' ? 3.2 : 2.2) * flick} distance={7} decay={1} color="#e8f4ff" />
			{!dawn && <pointLight position={[COFFIN[0], 1.5, COFFIN[2] + 0.4]} intensity={2.0 * flick} distance={3.5} decay={1} color="#ffc070" />}
			{dawn && <pointLight position={[1.4, 1.6, 3.5]} intensity={3.0} distance={8} decay={1} color="#ffd8a8" />}
			{shot === 'glass' && <pointLight position={add(GLASS, [0.2, 0.4, 0.3])} intensity={1.6} distance={1.5} decay={1} color="#ffc070" />}
			<WakeRoom t={t} dawn={dawn} cloth={shot === 'two' ? ease(lin(t, K.cloth[0], K.cloth[1])) : shot === 'nine' || shot === 'eleven' || shot === 'one' || shot === 'glass' ? 0 : 1}
				mirrorLid={shot === 'two' || shot === 'clock' ? 1 : 0} minute={minute} hour={hour} candleLean={lean} candlesLit={!dawn}
				chairsFall={inChase || shot === 'dawn' ? chairFalls(inChase ? t : K.cutDawn) : []} mud={dawn} lid={0} bodyIn={!bodyStanding && !inChase}
				fog={<Fog k={fogK} streaks={streak} />} ceiling={!inChase} />
			{Array.from({length: mourners}, (_, i) => (
				<Villager key={i} pose="sit" look={dawn ? 0.6 : 0.1} position={[seats[i][0], 0.5, seats[i][1] - 0.05]} rotation={[0, Math.PI, 0]} />
			))}
			{watcherSits && <Villager pose="sit" look={shot === 'one' || shot === 'two' || shot === 'clock' || shot === 'stand' ? 0.9 : 0.2} position={[WATCH0[0], 0.4, WATCH0[2] + 0.05]} rotation={[0, Math.PI, 0]} />}
			{inChase && <Villager pose="stand" look={0} position={[w[0], 0, w[1]]} rotation={[0, Math.atan2(PATH[4][0] - w[0], PATH[4][1] - w[1]), 0]} />}
			{/* standing with its back to us; then it turns, all of a piece, to face us */}
			{bodyStanding && <Body p={BODY0} ry={shot === 'turn' ? Math.PI * (1 - ease(lin(t, K.turned - 0.9, K.turned))) : Math.PI} t={t} />}
			{inChase && <Body p={[b[0], 0, b[1]]} ry={0} t={t} gait={1} />}
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
		const r = rng(Math.floor(t * 24) * 7919 + 35);
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
export const Episode35: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	// the loop shot runs on negative time: the hook's own first moments
	const tv = t >= K.loopShot ? t - DUR : t;
	const shot = shotAt(tv);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: shot === 'dawn' ? 'sepia(0.2) saturate(0.8) contrast(1.05) brightness(1.05)' : 'saturate(0.55) contrast(1.15)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.03, far: 200}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			<Overlay t={tv} captions={captions} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep35-bantay-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
