// Episode 50: "Si Lola sa Panaginip" (Season 5 finale: a family's experience shared online and retold in
// our own words; no real family, street or barangay). Taglish, Juanito. The PSX models; hard cuts only; an
// eerie score; a seamless loop (the last shot is the first shot, on negative time).
// Form: "the dream and the house". The dream (cold, washed, fog) cut against the house (dark, warm). Lola,
// who died, sits at the foot of my bed and warns me; I stay in; the street floods chest-deep. She keeps
// watch from my doorway. The last time, the woman at the foot of the bed has her back to me, and asks me to
// open the door to her; in the house the front doorknob turns. Her head comes round first, past where a neck
// goes, and the body after: Lola's rosary, not Lola's face. I wake: the front door is open on the rain, and
// the foot of my mattress is still dented. Then she is sitting there, in the house.
// Cast: Lola Character_29_Female (kind, warm); the stranger Character_31_Female, pale; a neighbour wading,
// Character_03. Grief is treated kindly: Lola is never the threat.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep50-lola-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {ARMS_DOWN, merge, Pose, PsxCharacter, SIT} from '../psx/models';
import {BED, Flood, MatsProvider, Room, Rosary, Sala, V3} from './world';
import {Box} from '../ep41/world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep50Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep50_sound.py uses the same rules)
export const K = {
	hookTurns: [0.3, 0.75], // her head round toward me, two snaps, still in shadow
	cutDream1: L.l02.start - 0.3,
	cutFlood: L.l03.start - 0.3,
	watch: L.l03.start + 4.2,
	cutLast: L.l04.start - 0.3,
	cutDoor: L.l05.start - 0.3,
	knobs: [0.6, 2.2].map((d) => L.l05.start + d),
	cutTurn: L.l06.start - 0.3,
	turns: [1.0, 1.6, 2.2].map((d) => L.l06.start + d), // the head first, held then snapped
	body: L.l06.start + 2.9, // then the body follows
	cutWake: L.l07.start - 0.3,
	cutBed: L.l08.start - 0.3,
	cutSit: L.l08.end + 0.3,
	snap: L.l08.end + 0.85, // her head round to the lens (the stinger)
	loopShot: DUR - 1.7,
};
export const STINGERS = [K.snap];

type Shot = 'hook' | 'dream1' | 'flood' | 'watch' | 'last' | 'door' | 'turn' | 'wake' | 'bed' | 'sit';
const CUTS: [number, Shot][] = [
	[K.cutDream1, 'hook'],
	[K.cutFlood, 'dream1'],
	[K.watch, 'flood'],
	[K.cutLast, 'watch'],
	[K.cutDoor, 'last'],
	[K.cutTurn, 'door'],
	[K.cutWake, 'turn'],
	[K.cutBed, 'wake'],
	[K.cutSit, 'bed'],
	[K.loopShot, 'sit'],
];
const shotOf = (t: number): Shot => (t < 0 ? 'hook' : CUTS.find(([c]) => t < c)?.[1] ?? 'hook');
const isDream = (s: Shot) => s === 'hook' || s === 'dream1' || s === 'last' || s === 'turn';
const steps = (t: number, at: number[]) => at.reduce((n, a) => n + ease(lin(t, a, a + 0.07)), 0) / at.length;

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
const POV: V3 = [-0.85, 0.92, -1.3];
const FOOT: V3 = [BED.x, 0.85, BED.foot + 0.2];

const poseAt = (t: number, shot: Shot): CamPose => {
	switch (shot) {
		case 'hook':
			return move(t, -1.7, K.cutDream1, POV, [-0.86, 0.95, -1.1], FOOT, FOOT, 52, 0.04);
		case 'last':
			return move(t, K.cutLast, K.cutDoor, POV, [-0.86, 0.95, -1.05], FOOT, FOOT, 52, 0.04);
		case 'dream1':
			return move(t, K.cutDream1, K.cutFlood, [-0.85, 0.95, -1.25], [-0.84, 0.97, -1.05], [-0.55, 0.95, 0.15], [-0.55, 0.98, 0.15], 52, 0.04);
		case 'flood':
			return move(t, K.cutFlood, K.watch, [0.0, 2.9, -0.2], [0.0, 2.9, 0.1], [0.0, 1.0, 6], [0.3, 1.0, 6], 54, 0.1);
		case 'watch':
			return move(t, K.watch, K.cutLast, POV, POV, [1.3, 1.25, 2.45], [1.3, 1.3, 2.45], 50, 0.03);
		case 'door':
			return move(t, K.cutDoor, K.cutTurn, [-0.3, 1.55, 0.0], [-0.1, 1.5, -0.6], [0.8, 0.35, -3], [0.8, 0.35, -3], 50, 0.12);
		case 'turn':
			// I come closer: up the bed toward her
			return move(t, K.cutTurn, K.cutWake, [-0.8, 1.05, -1.0], [-0.88, 1.12, -0.38], [BED.x, 1.05, 0.35], [BED.x, 1.12, 0.32], 50, 0.06);
		case 'wake':
			return move(t, K.cutWake, K.cutBed, [0.0, 1.5, -0.4], [0.15, 1.5, -0.9], [0.8, 1.1, -3], [0.8, 1.1, -3.2], 50, 0.18);
		case 'bed':
			return move(t, K.cutBed, K.cutSit, [-0.55, 1.45, -0.35], [-0.6, 1.3, -0.2], [BED.x, 0.5, 0.12], [BED.x, 0.5, 0.12], 50, 0.06);
		case 'sit': {
			const c = move(t, K.cutSit, K.loopShot, [-0.85, 1.0, -0.75], [-0.86, 1.02, -0.62], [BED.x, 1.05, 0.35], [BED.x, 1.08, 0.35], 50, 0.05);
			const jolt = lin(t, K.snap, K.snap + 0.06) * (1 - lin(t, K.snap + 0.06, K.snap + 0.5));
			return {...c, p: [c.p[0] + 0.03 * jolt, c.p[1] - 0.03 * jolt, c.p[2] - 0.04 * jolt]};
		}
	}
};

// ------------------------------------------------------------------ the people
const PALE = {color: '#c8ccc8', emissive: '#141818'};
const sitY = (h: number) => BED.top - 0.79 * (h / 1.68);
/** the stranger at the foot of the bed, her back to me; head: 0..1 of the way round (past a neck's limit); body: 0..1 of its turn after */
const Stranger: React.FC<{head: number; body: number; tilt: number; t: number}> = ({head, body, tilt, t}) => {
	const h = 1.55;
	const b = 1.25 * body; // the body comes only part way round, its legs still over the edge
	const turn = Math.PI * head - b; // the head carries the rest of the way to me
	return (
		<PsxCharacter
			name="Character_31_Female"
			height={h}
			tint={PALE}
			position={[BED.x, sitY(h), BED.foot - 0.12]}
			rotation={[0, -b, 0]}
			pose={merge(SIT, {
				Spine2: [['x', 0.03 * Math.sin(t * 0.9)]],
				Neck: [['y', -turn * 0.5], ['x', 0.12]],
				Head: [['y', -turn * 0.5], ['z', 0.35 * tilt], ['x', 0.12 * tilt]],
			})}
		/>
	);
};

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotOf(t);
	const cam = <Cam get={() => poseAt(t, shot)} />;
	const dream = isDream(shot);
	if (shot === 'flood')
		return (
			<>
				{cam}
				<ambientLight intensity={2.2} color="#c8ccc8" />
				<directionalLight position={[3, 8, -2]} intensity={0.9} color="#e8e8e0" />
				<Flood t={t} />
				<PsxCharacter name="Character_03" height={1.68} position={[1.1 - 0.15 * (t - K.cutFlood), -0.4, 3.0]} rotation={[0, -Math.PI / 2, 0]} pose={merge(ARMS_DOWN, {LeftArm: [['aim', [0.3, 0.6, 0.5]]], RightArm: [['aim', [-0.3, 0.6, 0.5]]], LeftForeArm: [['aim', [0.1, 1, 0]]], RightForeArm: [['aim', [-0.1, 1, 0]]]})} />
				<PsxCharacter name="Character_05" height={1.68} position={[-1.3 + 0.12 * (t - K.cutFlood), -0.35, 4.6]} rotation={[0, Math.PI / 2, 0]} pose={ARMS_DOWN} />
				{/* my window's frame, close */}
				<WindowFrame />
			</>
		);
	if (shot === 'door' || shot === 'wake') {
		const open = shot === 'wake' ? 0.95 + 0.05 * Math.sin(t * 1.7) : 0;
		const knob = shot === 'door' ? K.knobs.reduce((n, a) => n + 0.6 * Math.sin(Math.PI * lin(t, a, a + 0.5)), 0) : 0;
		return (
			<>
				{cam}
				<ambientLight intensity={1.9} color="#6a7490" />
				<pointLight position={[0, 2.3, -1.2]} intensity={1.4} distance={4} decay={1} color="#d8c0a0" />
				<Sala open={open} knob={knob} t={t} feet={shot === 'door' && t > K.knobs[0] - 0.8} />
				{shot === 'door' && <pointLight position={[0.8, 0.1, -3.3]} intensity={1.0} distance={1.5} decay={1} color="#8aa0c0" />}
				{shot === 'wake' && <pointLight position={[0.8, 1.2, -3.3]} intensity={2.0} distance={4} decay={1} color="#8aa0c0" />}
			</>
		);
	}
	// my room: the dream (cold, fog) or the house (dark)
	const head = shot === 'hook' ? 0.5 * steps(t, K.hookTurns) : shot === 'turn' ? steps(t, K.turns) : shot === 'sit' ? ease(lin(t, K.snap, K.snap + 0.07)) : 0;
	const body = shot === 'turn' ? ease(lin(t, K.body, K.body + 1.1)) : 0;
	const tilt = shot === 'turn' ? lin(t, K.turns[2], K.turns[2] + 0.07) : shot === 'sit' ? ease(lin(t, K.snap, K.snap + 0.07)) : 0;
	const dent = shot === 'bed' ? 0.4 + 0.6 * ease(lin(t, L.l08.start, L.l08.start + 3.0)) : shot === 'sit' ? 1 : 0;
	const stranger = shot === 'hook' || shot === 'last' || shot === 'turn' || shot === 'sit';
	return (
		<>
			{cam}
			{dream && <fog attach="fog" args={['#8a96aa', 0.6, 4.2]} />}
			<ambientLight intensity={dream ? 1.9 : 1.8} color={dream ? '#9aa8c0' : '#5a6480'} />
			<pointLight position={[1.8, 1.5, 0]} intensity={dream ? 1.5 : 3.0} distance={5} decay={1} color="#a0b4d8" />
			{/* a cold fill on her face when she turns to me in the house */}
			{shot === 'sit' && <pointLight position={[-0.85, 1.2, -0.3]} intensity={2.2} distance={1.6} decay={1} color="#c0d0e8" />}
			{!dream && <pointLight position={[-1.6, 1.0, -1.9]} intensity={0.8} distance={2.5} decay={1} color="#ffb070" />}
			<Room dent={dent} t={t} />
			{stranger && <Stranger head={head} body={body} tilt={tilt} t={t} />}
			{shot === 'turn' && t > L.l06.start + 4.3 && <Rosary p={[BED.x - 0.18, 0.62, BED.foot + 0.12]} swing={Math.sin(t * 2.1)} />}
			{shot === 'dream1' && (
				<>
					<PsxCharacter
						name="Character_29_Female"
						height={1.55}
						position={[BED.x + 0.42, sitY(1.55), 0.05]}
						rotation={[0, Math.PI / 2, 0]}
						pose={merge(SIT, {Spine2: [['y', 0.45]], Neck: [['y', 0.45], ['x', 0.1]], Head: [['y', 0.35], ['z', -0.12]]})}
					/>
					<Rosary p={[BED.x + 0.75, 0.6, 0.05]} swing={Math.sin(t * 1.4)} />
				</>
			)}
			{shot === 'watch' && (
				<PsxCharacter name="Character_29_Female" height={1.55} tint={{color: '#d8d4cc', emissive: '#16140f'}} position={[1.3, 0, 2.42]} rotation={[0, Math.PI, 0]} pose={merge(ARMS_DOWN, {Neck: [['x', 0.12], ['z', -0.12]]})} />
			)}
		</>
	);
};
const WindowFrame: React.FC = () => {
	const m = React.useMemo(() => new THREE.MeshLambertMaterial({color: '#3a2a1e'}), []);
	return (
		<group position={[0, 1.3, 0.75]}>
			<Box p={[-0.62, 1.4, 0]} s={[0.12, 1.4, 0.08]} m={m} />
			<Box p={[0.62, 1.4, 0]} s={[0.12, 1.4, 0.08]} m={m} />
			<Box p={[0, 2.06, 0]} s={[1.36, 0.12, 0.08]} m={m} />
			<Box p={[0, 0.74, 0]} s={[1.36, 0.12, 0.08]} m={m} />
			{[-0.3, 0, 0.3].map((x) => (
				<Box key={x} p={[x, 1.4, 0]} s={[0.02, 1.3, 0.02]} m={m} />
			))}
		</group>
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
		const r = rng(Math.floor(t * 24) * 7919 + 50);
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
export const Episode50: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const tv = t >= K.loopShot ? t - DUR : t;
	const dream = isDream(shotOf(tv));
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: 'scale(' + SCALE + ')', transformOrigin: '0 0', filter: dream ? 'saturate(0.3) contrast(0.92) brightness(1.08) hue-rotate(8deg)' : 'saturate(0.6) contrast(1.15) hue-rotate(-6deg)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.02, far: 120}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			<Overlay t={tv} captions={captions} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep50-lola-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
