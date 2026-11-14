// Episode 34: "Paatras" (Season 4, Visayan and Mindanao folklore: the sigbin). Taglish, Juanito.
// Built to the motion rule; hard cuts only; an eerie score; a seamless loop (the last shot is the first
// shot, on negative time).
// Form: "the tracker". Ground-level shots that follow footprints, cut against the creature's own
// reversing walk. The audience learns the rule with the farmer (the prints point the wrong way) and
// sees the danger before he does.
// The picture: low along the trail of prints, all pointing away; far down it, two eyes between two
// legs, coming closer (hook); the farm at night, the goats all turned toward the field; out in the
// field, the sigbin walks backwards, head hanging upside down between its hind legs; the pen: three
// goats where there were four, the gate swinging open; the dog backs into its kennel; the farmer
// follows the prints out into the field; behind him it backs up the trail toward the house, stepping
// into its own prints, ears dragging; inside, the child asleep, and at the window its back rises; the
// farmer turns: the prints lead back to the house, to the window; its face, upside down, looks up at
// us. Then the trail again (loop).
// Care: folklore told as folklore; no family is shown or accused of keeping a sigbin; the child is
// safe in every frame; nothing is harmed on screen.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep34-sigbin-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {Farm, Farmer, HOUSE, KENNEL, MatsProvider, PEN, ROOM, Room, Sigbin, V3, WIN, trailX} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep34Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep34_sound.py uses the same rules)
export const K = {
	cutFarm: L.l02.start - 0.3,
	cutDemo: L.l02.start + 5.0, // the sigbin, walking backwards in the field (as the line describes it)
	cutPen: L.l03.start - 0.3,
	gate: [L.l03.end + 0.2, L.l03.end + 1.0] as [number, number],
	cutDog: L.l04.start - 0.3,
	cower: [L.l04.start + 0.6, L.l04.end + 0.4] as [number, number],
	cutFarmer: L.l05.start - 0.3,
	cutCreature: L.l06.start - 0.3,
	cutRoom: L.l07.start - 0.3,
	rise: [L.l07.end + 0.2, L.l08.start - 0.5] as [number, number],
	cutTurn: L.l08.start - 0.3,
	cutFace: L.l08.end + 0.3,
	loopShot: DUR - 1.7,
};
export const STINGERS = [K.gate[0], K.rise[0], K.cutFace];

type Shot = 'trail' | 'farm' | 'demo' | 'pen' | 'dog' | 'farmer' | 'creature' | 'room' | 'turn' | 'face';
const shotAt = (t: number): Shot => {
	if (t < K.cutFarm) return 'trail';
	if (t < K.cutDemo) return 'farm';
	if (t < K.cutPen) return 'demo';
	if (t < K.cutDog) return 'pen';
	if (t < K.cutFarmer) return 'dog';
	if (t < K.cutCreature) return 'farmer';
	if (t < K.cutRoom) return 'creature';
	if (t < K.cutTurn) return 'room';
	if (t < K.cutFace) return 'turn';
	return 'face';
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
	c.far = 700;
	camera.updateProjectionMatrix();
	return null;
};
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

// where the sigbin is (it backs toward the house, -z, with its body facing +z)
const sigbinZ = (t: number, shot: Shot) => {
	if (shot === 'trail') return 9.5 - 3.5 * lin(t, -3, K.cutFarm);
	if (shot === 'creature') return 9.0 - 8.5 * lin(t, K.cutCreature, K.cutRoom);
	if (shot === 'turn' || shot === 'face') return -3.6;
	return 9;
};
// the farmer walks out along the trail (+z), then turns
const farmerZ = (t: number, shot: Shot) => (shot === 'farmer' ? 1.0 + 6.0 * lin(t, K.cutFarmer, K.cutCreature) : shot === 'creature' ? 7.0 + 3.0 * lin(t, K.cutCreature, K.cutRoom) : 10.4);

const poseAt = (t: number, shot: Shot): CamPose => {
	const h = handheld(t, 0.6);
	switch (shot) {
		case 'trail': {
			// low over the trail by the house, looking out along it; a slow creep forward
			const k = lin(t, -3, K.cutFarm);
			return {p: [0.9 + h.dp[0] * 0.3, 0.35 + h.dp[1] * 0.2, -3.0 + 1.4 * k], l: [0.85, 0.35, 12], fov: 40, roll: h.roll * 0.5};
		}
		case 'farm': {
			const k = ease(lin(t, K.cutFarm, K.cutDemo));
			return {p: mix3([3, 4.5, 11], [2.4, 3.2, 7], k), l: [0.8, 1.0, -2.5], fov: 54};
		}
		case 'demo': {
			const k = lin(t, K.cutDemo, K.cutPen);
			const sz = 13.5 - 3.0 * k;
			return {p: [4.6, 1.1, sz - 0.6], l: [0.8, 0.55, sz], fov: 42};
		}
		case 'pen': {
			const k = ease(lin(t, K.cutPen, K.cutDog));
			return {p: add(PEN, [-2.4 + 0.4 * k, 1.5, 2.6 - 0.4 * k]), l: add(PEN, [0.2, 0.5, 0.3]), fov: 50, roll: h.roll * 0.5};
		}
		case 'dog': {
			const k = ease(lin(t, K.cutDog, K.cutFarmer));
			return {p: add(KENNEL, [1.0 - 0.2 * k, 0.55, 1.7 - 0.3 * k]), l: add(KENNEL, [0, 0.4, -0.2]), fov: 48};
		}
		case 'farmer': {
			const z = farmerZ(t, shot);
			return {p: [1.6 + h.dp[0], 1.6 + h.dp[1], z - 3.2], l: [0.8, 0.6, z + 3], fov: 52, roll: h.roll};
		}
		case 'creature': {
			// from beside the trail near the house: it backs toward us, the farmer's lamp far beyond
			const k = lin(t, K.cutCreature, K.cutRoom);
			return {p: [2.3 + h.dp[0] * 0.3, 0.55, -1.2], l: mix3([0.8, 0.6, 9], [0.8, 0.5, 1.5], ease(k)), fov: 46, roll: h.roll * 0.5};
		}
		case 'room': {
			const k = ease(lin(t, K.cutRoom, K.cutTurn));
			return {p: add(ROOM, [0.6 - 0.2 * k + h.dp[0] * 0.2, 1.7, 1.35 - 0.2 * k]), l: add(ROOM, [0.0, 0.55 + 0.25 * k, -0.9]), fov: 56};
		}
		case 'turn': {
			// over his shoulder as he turns: the lamp follows the prints back to the house, to the window
			const k = ease(lin(t, K.cutTurn, K.cutFace));
			return {p: [1.3, 1.7, 11.8], l: mix3([0.8, 0.4, 7], [0.8, 1.4, -4.5], k), fov: 40 - 8 * k};
		}
		case 'face': {
			const k = ease(lin(t, K.cutFace, K.loopShot));
			const z = sigbinZ(t, 'turn');
			return {p: [0.82, 0.3, z - 1.15 + 0.25 * k], l: [0.82, 0.24, z - 0.38], fov: 44 - 8 * k};
		}
	}
};

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotAt(t);
	const pose = poseAt(t, shot);
	if (shot === 'room') {
		const r = ease(lin(t, K.rise[0], K.rise[1]));
		return (
			<>
				<Cam pose={pose} />
				<ambientLight intensity={0.25} color="#6a6a8a" />
				<Room t={t} lamp={1 - 0.7 * r * (0.5 + 0.5 * Math.sin(t * 23))} rise={r} press={r} />
			</>
		);
	}
	const z = sigbinZ(t, shot);
	const showSig = shot === 'trail' || shot === 'demo' || shot === 'creature' || shot === 'turn' || shot === 'face';
	const goats = shot === 'farm' ? 4 : 3;
	const gate = shot === 'pen' ? ease(lin(t, K.gate[0], K.gate[1])) : shot === 'trail' || shot === 'farm' || shot === 'demo' ? 0 : 1;
	const fz = farmerZ(t, shot);
	const lampAt: V3 = [1.05, 1.0, fz + 0.5];
	return (
		<>
			<Cam pose={pose} />
			<ambientLight intensity={1.25} color="#56668e" />
			<pointLight position={[70, 80, 160]} intensity={2.2} decay={0} color="#a8b4d8" />
			{showSig && <pointLight position={[0.8, 1.6, z + 1.6]} intensity={2.6} distance={4} decay={1} color="#b8c4e8" />}
			<Farm t={t} goats={goats} gate={gate} dogCower={shot === 'dog' ? ease(lin(t, K.cower[0], K.cower[1])) : shot === 'trail' || shot === 'farm' || shot === 'demo' || shot === 'pen' ? 0 : 1} winLit={1} prints={60} />
			{showSig && shot !== 'demo' && <Sigbin p={[0.82, 0, z]} ry={0} t={t} walk={shot === 'turn' || shot === 'face' ? 0 : 1} look={shot === 'face' ? -0.55 * ease(lin(t, K.cutFace, K.cutFace + 0.5)) : 0} eyes={shot === 'face' ? 1.8 : 1.3} />}
			{shot === 'demo' && <Sigbin p={[0.8, 0, 13.5 - 3.0 * lin(t, K.cutDemo, K.cutPen)]} ry={0} t={t} walk={1} />}
			{(shot === 'farmer' || shot === 'creature' || shot === 'turn') && (
				<>
					<Farmer p={[0.6, 0, fz]} ry={0} t={t} walk={shot === 'turn' ? 0 : 1} turn={shot === 'turn' ? Math.PI * ease(lin(t, K.cutTurn, K.cutTurn + 0.9)) : 0} />
					<pointLight position={lampAt} intensity={4} distance={7} decay={1} color="#ffc070" />
				</>
			)}
			{shot === 'turn' && <pointLight position={[0.8, 0.8, -3.0]} intensity={2.0} distance={4} decay={1} color="#ffb060" />}
			{shot === 'face' && <pointLight position={[0.82, 0.3, z - 1.4]} intensity={2.2} distance={2.5} decay={1} color="#c8d0e8" />}
			{shot === 'trail' && <pointLight position={[0.9, 1.2, 4]} intensity={1.8} distance={14} decay={1} color="#9aa8d0" />}
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
		const r = rng(Math.floor(t * 24) * 7919 + 34);
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
export const Episode34: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	// the loop shot runs on negative time: it is the hook's own first moments
	const tv = t >= K.loopShot ? t - DUR : t;
	const shot = shotAt(tv);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: shot === 'room' ? 'sepia(0.3) saturate(0.8) contrast(1.12)' : 'saturate(0.7) contrast(1.12) brightness(1.03)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.03, far: 700}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			<Overlay t={tv} captions={captions} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep34-sigbin-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
