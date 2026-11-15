// Episode 37: "Pitong Biyernes" (Season 4, Siquijor folk belief: the barang, and the island's healers).
// Taglish, Juanito. Built to the motion rule; hard cuts only; an eerie score; a seamless loop (the last
// shot is the first shot, on negative time).
// Form: "insect's-eye". Most shots are at insect scale (macro lenses; the world huge and soft behind),
// with a hard cut to human scale only for the healers.
// The picture: the cork of a bamboo tube lifts and jiggles; antennae in the gap (hook); the beetle
// crawls out across the table past a folded paper with a name; on the window sill, Good Friday dusk
// over the island, the church bell hanging still; it opens its wings and goes; low over the road
// between the houses to the lit gap under a door; a sleeping face, huge; it lands by his ear and goes
// in; morning: his forearm on the banig, something moving under the skin; the healers' cauldron on
// the mountain at golden hour; the bottle at his lips, silence, a click of wings inside him; he
// coughs: a beetle on the banig, on its back, legs paddling. Then the tube again (loop).
// Care: belief told as belief; most mananambal heal; no real healer, family or barangay; no wound,
// no gore; the Church is not mocked.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep37-barang-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {Rider} from '../ep36/world';
import {Beetle, Bottle, Box, Cauldron, DOOR_Z, HEAD, Island, MatsProvider, Road, Sleeper, Table, TUBE, TUBE_L, useM, V3} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep37Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep37_sound.py uses the same rules)
export const K = {
	cork: [0.6, 3.6] as [number, number], // the cork lifts and jiggles
	antennae: L.l01.end + 0.2, // antennae push out of the gap
	cutTable: L.l02.start - 0.3,
	cutSill: L.l03.start - 0.3,
	wings: L.l03.end + 0.1,
	takeoff: L.l03.end + 0.45,
	cutFlight: L.l04.start - 0.3,
	under: L.l05.start - 0.6, // it slips under the door
	cutFace: L.l05.start - 0.3,
	land: L.l05.start + 0.3,
	inEar: L.l05.end + 0.25, // it is gone into the ear
	cutArm: L.l06.start - 0.3,
	ripple: [L.l06.start + 2.6, L.l06.end + 0.6] as [number, number],
	cutMountain: L.l07.start - 0.3,
	cutBottle: L.l07.end + 0.3,
	click: L.l07.end + 1.3, // in the silence: a click of wings inside him
	cough: L.l08.end + 0.35,
	cutMat: L.l08.end + 0.6,
	loopShot: DUR - 1.7,
};
export const STINGERS = [K.antennae, K.inEar, K.cough];

type Shot = 'tube' | 'table' | 'sill' | 'flight' | 'face' | 'arm' | 'mountain' | 'bottle' | 'mat';
const shotAt = (t: number): Shot => {
	if (t < K.cutTable) return 'tube';
	if (t < K.cutSill) return 'table';
	if (t < K.cutFlight) return 'sill';
	if (t < K.cutFace) return 'flight';
	if (t < K.cutArm) return 'face';
	if (t < K.cutMountain) return 'arm';
	if (t < K.cutBottle) return 'mountain';
	if (t < K.cutMat) return 'bottle';
	return 'mat';
};

// ------------------------------------------------------------------ where the beetle is
const TOP = 0.761; // the table's top
const along = (pts: [number, number][], k: number): [number, number, number] => {
	const segs = pts.length - 1;
	const f = Math.min(segs - 1e-6, Math.max(0, k) * segs);
	const i = Math.floor(f), u = f - i;
	const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u;
	const z = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u;
	return [x, z, Math.atan2(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1])];
};
const TABLE_PATH: [number, number][] = [[0, 0.1], [0, 0.2], [0.03, 0.27], [0.1, 0.33], [0.14, 0.4]];
const SILL_Y = 2.5;
const flightAt = (t: number): V3 => {
	const k = lin(t, K.cutFlight, K.under);
	const z = 3 + (DOOR_Z + 0.4 - 3) * k;
	const x = Math.sin(k * 9) * 0.5 * (1 - k);
	const y = 0.5 - 0.15 * Math.sin(k * 5) - 0.35 * ease(lin(k, 0.8, 1));
	return [x, y, z];
};
// on the pillow by his ear; it crawls to the ear and in
const FACE_PATH: [number, number][] = [[0.15, 0.08], [0.12, 0.05], [0.1, 0.02]];

// ------------------------------------------------------------------ cameras
type CamPose = {p: V3; l: V3; fov: number; up?: V3};
const Cam: React.FC<{pose: CamPose}> = ({pose}) => {
	const {camera} = useThree();
	camera.position.set(...pose.p);
	camera.up.set(...(pose.up ?? [0, 1, 0]));
	camera.lookAt(...pose.l);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = pose.fov;
	c.near = 0.004;
	c.far = 900;
	camera.updateProjectionMatrix();
	return null;
};
const Atmos: React.FC<{c: string; near: number; far: number}> = ({c, near, far}) => {
	const {scene} = useThree();
	const bg = new THREE.Color(c);
	if (!scene.fog) scene.fog = new THREE.Fog(bg, near, far);
	const f = scene.fog as THREE.Fog;
	f.color.copy(bg);
	f.near = near;
	f.far = far;
	scene.background = bg;
	return null;
};

const poseAt = (t: number, shot: Shot): CamPose => {
	const hh = handheld(t, 0.15);
	switch (shot) {
		case 'tube': {
			const k = ease(lin(t, -2, K.cutTable));
			return {p: [0.09 - 0.02 * k + hh.dp[0] * 0.05, TUBE[1] + 0.05 - 0.01 * k, TUBE[2] + TUBE_L / 2 + 0.2 - 0.05 * k], l: [0, TUBE[1] + 0.004, TUBE[2] + TUBE_L / 2 + 0.01], fov: 38};
		}
		case 'table': {
			const [bx, bz] = along(TABLE_PATH, lin(t, K.cutTable + 0.3, K.cutSill));
			return {p: [0.2 + hh.dp[0] * 0.05, TOP + 0.04, 0.62], l: [bx, TOP + 0.01, bz], fov: 36};
		}
		case 'sill': {
			const k = ease(lin(t, K.cutSill, K.cutFlight));
			return {p: [0.0, SILL_Y + 0.06 + 0.01 * k, 0.17 - 0.03 * k], l: [0, SILL_Y + 0.2, -20], fov: 48};
		}
		case 'flight': {
			const b = flightAt(t);
			const k = lin(t, K.under - 0.6, K.under);
			return {p: [b[0] * 0.8 + hh.dp[0] * 0.5, b[1] + 0.14 - 0.1 * k, Math.max(DOOR_Z + 0.9, b[2] + 0.5)], l: [b[0], b[1] - 0.05, b[2] - 2.5], fov: 55};
		}
		case 'face': {
			const k = ease(lin(t, K.cutFace, K.cutArm));
			return {p: [0.2 - 0.04 * k, 0.36 - 0.05 * k, 0.16], l: [0.05, 0.1, 0.01], fov: 44};
		}
		case 'arm': {
			const k = ease(lin(t, K.cutArm, K.cutMountain));
			return {p: [0.78 - 0.1 * k, 0.36 - 0.06 * k, 0.86], l: [0.33, 0.04, 0.6], fov: 40};
		}
		case 'mountain': {
			const a = 0.6 - 0.5 * lin(t, K.cutMountain, K.cutBottle);
			return {p: [Math.sin(a) * 2.6, 1.4, Math.cos(a) * 2.6], l: [0, 0.8, 0], fov: 50};
		}
		case 'bottle': {
			const k = ease(lin(t, K.cutBottle, K.cutMat));
			const jolt = t > K.cough ? Math.exp(-(t - K.cough) * 10) * 0.02 : 0;
			return {p: [0.08 - 0.02 * k, 0.3 - 0.03 * k + jolt, 0.4 - 0.05 * k], l: [0.02, 0.15, 0.02], fov: 46};
		}
		case 'mat': {
			const k = ease(lin(t, K.cutMat, DUR));
			return {p: [0.17 - 0.02 * k, 0.07 - 0.01 * k, 0.33], l: [0.08, 0.012, 0.2], fov: 40};
		}
	}
};

// ------------------------------------------------------------------ the window sill
const Sill: React.FC = () => {
	const M = useM();
	return (
		<group position={[0, SILL_Y, 0]}>
			<Box p={[0, -0.02, 0.05]} s={[1.4, 0.04, 0.3]} m={M.table} unit={0.05} />
			<Box p={[-0.6, 0.5, 0.05]} s={[0.08, 1.0, 0.3]} m={M.door} />
			<Box p={[0.6, 0.5, 0.05]} s={[0.08, 1.0, 0.3]} m={M.door} />
			<Box p={[-0.0, -0.6, 0.12]} s={[2, 1.2, 0.1]} m={M.wall} />
		</group>
	);
};

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{t: number}> = ({t}) => {
	const M = useM();
	const shot = shotAt(t);
	const pose = poseAt(t, shot);
	const cork = shot === 'tube' ? ease(lin(t, K.cork[0], K.cork[0] + 1.0)) : 1;
	return (
		<>
			<Cam pose={pose} />
			{(shot === 'tube' || shot === 'table') && (
				<>
					<Atmos c="#1a100a" near={0.35} far={1.4} />
					<ambientLight intensity={0.55} color="#c89a6a" />
					<pointLight position={[0.25, 0.95, -0.25]} intensity={3.2} distance={2.5} decay={1} color="#ffb060" />
					<pointLight position={[-0.16, 0.9, 0.1]} intensity={0.9 + 0.1 * Math.sin(t * 13)} distance={0.8} decay={1} color="#ffc070" />
					<Table t={t} cork={shot === 'table' ? 0 : cork} />
					{shot === 'table' && <CorkOff />}
					{shot === 'tube' ? (
						<Beetle t={t} walk={0} ant={1} position={[0, TUBE[1] - 0.018, TUBE[2] + TUBE_L / 2 - 0.035 + 0.03 * ease(lin(t, K.antennae - 0.6, K.antennae))]} scale={0.95} />
					) : (
						(() => {
							const [bx, bz, ry] = along(TABLE_PATH, lin(t, K.cutTable + 0.3, K.cutSill));
							const inTube = bz < TUBE[2] + TUBE_L / 2;
							return <Beetle t={t} walk={t * 2.4} ant={1} position={[bx, inTube ? TUBE[1] - 0.018 : TOP, bz]} rotation={[0, ry, 0]} />;
						})()
					)}
				</>
			)}
			{shot === 'sill' && (
				<>
					<Atmos c="#2a1a2a" near={60} far={420} />
					<ambientLight intensity={0.9} color="#a07a8a" />
					<directionalLight position={[0, 5, -30]} intensity={0.8} color="#ff9a5a" />
					<pointLight position={[0.1, SILL_Y + 0.2, 0.3]} intensity={2.5} distance={1.2} decay={1} color="#ffb070" />
					<pointLight position={[0, SILL_Y + 0.15, -0.35]} intensity={3} distance={1.0} decay={1} color="#ff9a6a" />
					<Island />
					<Sill />
					{(() => {
						const k = ease(lin(t, K.takeoff, K.cutFlight));
						return <Beetle t={t} open={ease(lin(t, K.wings - 0.3, K.wings + 0.2))} fly={t > K.wings ? 1 : 0} ant={1} position={[0, SILL_Y + 0.0 + 0.6 * k, -0.02 - 2.0 * k]} rotation={[-0.3 * k, Math.PI, 0]} />;
					})()}
				</>
			)}
			{shot === 'flight' && (
				<>
					<Atmos c="#1a1c2c" near={6} far={30} />
					<ambientLight intensity={1.8} color="#7a7aa0" />
					<directionalLight position={[3, 8, 4]} intensity={0.9} color="#a0b0e0" />
					<pointLight position={[0, 0.3, DOOR_Z + 0.6]} intensity={3} distance={4} decay={1} color="#ffc070" />
					<Road />
					<Beetle t={t} open={1} fly={1} position={flightAt(t)} rotation={[0.2, Math.PI, 0]} scale={2.6} />
				</>
			)}
			{(shot === 'face' || shot === 'arm' || shot === 'bottle' || shot === 'mat') && (
				<>
					<Atmos c={shot === 'arm' ? '#2a2c30' : '#0e0a08'} near={0.5} far={2.5} />
					<ambientLight intensity={shot === 'arm' ? 1.1 : 0.6} color={shot === 'arm' ? '#a0a8b8' : '#8a6a50'} />
					<pointLight position={[0.5, 0.8, 0.3]} intensity={shot === 'arm' ? 1.5 : 2.2} distance={2.5} decay={1} color={shot === 'arm' ? '#d0e0ff' : '#ffb060'} />
					<Sleeper t={t} ripple={shot === 'arm' ? lin(t, K.ripple[0], K.ripple[1], 0, 1) - (t < K.ripple[0] ? 1 : 0) : -1}
						mouth={shot === 'bottle' ? ease(lin(t, K.cutBottle + 0.6, K.cutBottle + 1.2)) : 0}
						cough={shot === 'bottle' && t > K.cough ? lin(t, K.cough, K.cough + 0.25) : 0} breathe={shot === 'bottle' ? 0.4 : 1} />
					{shot === 'face' && t > K.land - 0.5 && t < K.inEar && (() => {
						const fly = t < K.land;
						const k = lin(t, K.land, K.inEar);
						const [x, z, ry] = along(FACE_PATH, k);
						return fly ? (
							<Beetle t={t} open={1} fly={1} position={[0.16 + (K.land - t) * 0.3, 0.085 + (K.land - t) * 0.5, 0.1]} rotation={[0, -2.0, 0]} />
						) : (
							<Beetle t={t} walk={t * 2.2} ant={1} position={[x + HEAD[0], 0.08 + 0.02 * k, z]} rotation={[0, ry, 0]} scale={0.9} />
						);
					})()}
					{shot === 'bottle' && (() => {
						const k = ease(lin(t, K.cutBottle, K.cutBottle + 0.8));
						const back = ease(lin(t, K.cough - 0.2, K.cough + 0.2));
						return (
							<group position={[0.12 + 0.25 * (1 - k) + 0.2 * back, 0.15 + 0.05 * (1 - k), 0.07]} rotation={[0, 0, 1.15 * k]}>
								<Bottle p={[0, 0, 0]} />
								<Box p={[0.0, -0.07, 0]} s={[0.08, 0.04, 0.08]} m={M.skinDark} unit={0.02} />
							</group>
						);
					})()}
					{shot === 'mat' && <Beetle t={t} flip ant={1} position={[0.08, 0.012, 0.2]} rotation={[0, 0.8, 0]} />}
				</>
			)}
			{shot === 'mountain' && (
				<>
					<Atmos c="#e0a870" near={10} far={300} />
					<ambientLight intensity={1.0} color="#e8c8a0" />
					<directionalLight position={[-10, 6, -20]} intensity={1.2} color="#ffb070" />
					<pointLight position={[0, 0.4, 0]} intensity={2.5 + Math.sin(t * 17) * 0.4} distance={3} decay={1} color="#ff8a30" />
					<Cauldron t={t} />
					<Rider look={{shirt: '#e8e4d8', pants: '#3a3a3a', hair: 'short', hairColor: '#8a8a88', skin: '#8a6448'}} pose="stand" position={[0.15, 0, -0.85]} rotation={[0, 0.2, 0]} />
					{/* the ladle, stirring */}
					<group position={[Math.sin(t * 1.8) * 0.15, 0.95, Math.cos(t * 1.8) * 0.15 - 0.1]} rotation={[0.5, t * 1.8, 0]}>
						<Box p={[0, 0, 0]} s={[0.025, 0.7, 0.025]} m={M.ladle} unit={1} />
					</group>
				</>
			)}
		</>
	);
};

// the cork, fallen on its side on the table
const CorkOff: React.FC = () => {
	const M = useM();
	return (
		<mesh position={[0.05, TOP + 0.016, TUBE[2] + TUBE_L / 2 + 0.06]} rotation={[0, 0.6, Math.PI / 2]} material={M.cork}>
			<cylinderGeometry args={[0.019, 0.019, 0.03, 10]} />
		</mesh>
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
		const r = rng(Math.floor(t * 24) * 7919 + 37);
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
export const Episode37: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	// the loop shot runs on negative time: the hook's own first moments
	const tv = t >= K.loopShot ? t - DUR : t;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'saturate(0.8) contrast(1.1)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.004, far: 900}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			<Overlay t={tv} captions={captions} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep37-barang-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
