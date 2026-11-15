// Episode 43: "Si Jun-Jun" (Season 5: call-center agents' experiences shared online, retold in our own
// words; no real company, building or account). Taglish, Juanito. The PSX models; hard cuts only; an
// eerie score; a seamless loop (the last shot is the first shot, on negative time).
// Form: "under the desks". The boy is never seen whole and lit: only his small bare feet running past
// in the aisle, his reflection in my dark second monitor (sitting at my feet), and, on the new floor in
// another building, under my desk, hugging his knees, holding my headset cable. His head snaps up to the
// lens. Then his feet run past under the old desks again (loop).
// The boy: Character_12 (white T-shirt, black shorts) scaled to a child's height with a larger head,
// tinted pale. Care: a child figure, never harmed or harming; no face held lit; no company named.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep43-junjun-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {merge, Pose, PsxCharacter, SIT} from '../psx/models';
import {Chair, COLS, CHAIR_DZ, Desk, DESK, Floor, Headset, MatsProvider, ROWS, V3} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep43Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep43_sound.py uses the same rules)
export const K = {
	run0: [-1.7, 2.0] as [number, number], // the hook: his feet run across the aisle (and on, past the seam)
	cutFloor: L.l02.start - 0.3,
	cutSenior: L.l03.start - 0.3,
	look: L.l03.start + 0.6, // she leans back and looks at me…
	down: L.l03.end - 0.4, // …then down at the floor
	cutPov: L.l04.start - 0.3,
	behind: L.l04.end + 0.15, // the running behind me (sound), then I turn
	turn: [L.l04.end + 0.75, L.l04.end + 1.15] as [number, number],
	cutReflect: L.l05.start - 0.3,
	lift: L.l05.end + 0.35, // in the reflection his head lifts toward the monitor
	cutLeave: L.l06.start - 0.3,
	cutNew: L.l06.start + 1.75,
	cutCable: L.l07.start - 0.3,
	tugs: [0.9, 1.5, 2.0, 2.7].map((d) => L.l07.start + d),
	drop: L.l07.end + 0.25,
	cutUnder: L.l07.end + 0.6,
	reveal: L.l08.start + 2.6, // the light reaches him
	snap: L.l08.end + 0.45, // his head snaps up to the lens (the stinger)
	loopShot: DUR - 1.7,
};
export const STINGERS = [K.snap];

type Shot = 'hook' | 'floor' | 'senior' | 'pov' | 'reflect' | 'leave' | 'newfloor' | 'cable' | 'under';
const CUTS: [number, Shot][] = [
	[K.cutFloor, 'hook'],
	[K.cutSenior, 'floor'],
	[K.cutPov, 'senior'],
	[K.cutReflect, 'pov'],
	[K.cutLeave, 'reflect'],
	[K.cutNew, 'leave'],
	[K.cutCable, 'newfloor'],
	[K.cutUnder, 'cable'],
];
const shotOf = (t: number): Shot => CUTS.find(([c]) => t < c)?.[1] ?? 'under';
const floorB = (s: Shot) => s === 'newfloor' || s === 'cable' || s === 'under';

// ------------------------------------------------------------------ the people
const PALE = {color: '#d0d8dc', emissive: '#1c2226'};
const CHILD = {Head: [['scale', 1.38]] as Pose['x']};
/** him: running (a stride phase), or sitting on the floor hugging his knees. up: his head lifted
 *  toward the lens (0 bowed, 1 up and tipped). */
const Boy: React.FC<{p: V3; ry: number; run?: number; sit?: boolean; up?: number}> = ({p, ry, run, sit, up = 0}) => {
	let pose: Pose;
	if (sit) {
		pose = {
			...CHILD,
			LeftUpLeg: [['aim', [0.12, 0.6, 0.8]]],
			RightUpLeg: [['aim', [-0.12, 0.6, 0.8]]],
			LeftLeg: [['aim', [0.02, -0.9, 0.35]]],
			RightLeg: [['aim', [-0.02, -0.9, 0.35]]],
			Spine: [['x', 0.3]],
			Spine2: [['x', 0.15]],
			LeftArm: [['aim', [0.2, -0.35, 1]]],
			RightArm: [['aim', [-0.2, -0.35, 1]]],
			LeftForeArm: [['aim', [-0.8, 0.05, 0.5]]],
			RightForeArm: [['aim', [0.8, 0.0, 0.5]]],
			Neck: [['x', 0.65 * (1 - up) - 0.35 * up]],
			Head: [['x', 0.3 * (1 - up) - 0.2 * up], ['z', 0.55 * up]],
		};
	} else {
		const s = Math.sin(run ?? 0);
		pose = {
			...CHILD,
			LeftUpLeg: [['aim', [0.05, -1, 0.55 * s]]],
			RightUpLeg: [['aim', [-0.05, -1, -0.55 * s]]],
			LeftLeg: [['aim', [0, -1, -0.35 + 0.25 * s]]],
			RightLeg: [['aim', [0, -1, -0.35 - 0.25 * s]]],
			LeftArm: [['aim', [0.25, -1, -0.4 * s]]],
			RightArm: [['aim', [-0.25, -1, 0.4 * s]]],
			LeftForeArm: [['aim', [0.1, -0.6, 0.6]]],
			RightForeArm: [['aim', [-0.1, -0.6, 0.6]]],
			Spine: [['x', 0.12]],
			Neck: [['x', 0.3]],
		};
	}
	return <PsxCharacter name="Character_12" height={1.12} tint={PALE} position={sit ? [p[0], p[1] - 0.5, p[2]] : p} rotation={[0, ry, 0]} pose={pose} />;
};
/** a seated agent at a desk (row z, column x), facing the monitors (−z) */
const Agent: React.FC<{name: string; x: number; z: number; t: number; seed: number; height?: number; extra?: Pose}> = ({name, x, z, t, seed, height = 1.68, extra = {}}) => {
	const b = Math.sin(t * (1.3 + seed * 0.07) + seed) * 0.025;
	return (
		<PsxCharacter
			name={name}
			height={height}
			position={[x, -0.27, z + CHAIR_DZ]}
			rotation={[0, Math.PI, 0]}
			pose={merge(SIT, {Spine2: [['x', b]], Neck: [['x', 0.18]], LeftForeArm: [['aim', [0.12, 0.2, 1]]], RightForeArm: [['aim', [-0.12, 0.2, 1]]]}, extra)}
		/>
	);
};

// ------------------------------------------------------------------ cameras
type CamPose = {p: V3; l: V3; fov: number};
const aim = (camera: THREE.Camera, pose: CamPose) => {
	camera.position.set(...pose.p);
	camera.up.set(0, 1, 0);
	camera.lookAt(...pose.l);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = pose.fov;
	c.near = 0.02;
	c.far = 40;
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
const ME_X = 0;
const EYE: V3 = [ME_X, 1.2, CHAIR_DZ + 0.05];
const MON2: V3 = [ME_X + 0.3, 1.15, -0.2];

const poseAt = (t: number, shot: Shot): CamPose => {
	switch (shot) {
		case 'hook':
			// inside the empty end desk's cave, low, looking out across the aisle
			return move(t, -1.7, K.cutFloor, [3.05, 0.24, -0.12], [3.0, 0.24, 0.0], [2.2, 0.2, 1.6], [2.2, 0.2, 1.6], 64, 0.1);
		case 'floor':
			return move(t, K.cutFloor, K.cutSenior, [4.6, 2.5, 3.4], [4.2, 2.4, 3.0], [-0.4, 0.7, -0.9], [-0.4, 0.7, -0.9], 60);
		case 'senior':
			return move(t, K.cutSenior, K.cutPov, [2.75, 1.32, 1.75], [2.6, 1.3, 1.6], [0.9, 1.0, 0.55], [0.9, 1.0, 0.55], 54);
		case 'pov': {
			const k = ease(lin(t, K.turn[0], K.turn[1]));
			const hh = handheld(t, 0.25);
			const ahead: V3 = [ME_X - 0.25, 1.0, -0.22];
			const behind: V3 = [0.9 + 1.4 * lin(t, K.behind - 0.4, K.turn[1] + 1.5), 0.45, 2.1];
			return {p: [EYE[0] + hh.dp[0] * 0.3, EYE[1] + hh.dp[1] * 0.3, EYE[2]], l: mix3(ahead, behind, k), fov: 58};
		}
		case 'reflect':
			// what the dark monitor sees: me, and beside my legs (it is shown mirrored)
			return move(t, K.cutReflect, K.cutLeave, [MON2[0], MON2[1], MON2[2] + 0.05], [MON2[0], MON2[1] - 0.02, MON2[2] + 0.12], [ME_X + 0.3, 0.7, CHAIR_DZ + 0.1], [ME_X + 0.32, 0.68, CHAIR_DZ + 0.1], 70, 0.05);
		case 'leave':
			return move(t, K.cutLeave, K.cutNew, [1.4, 1.35, 2.3], [1.2, 1.3, 2.0], [ME_X, 0.7, 0.4], [ME_X, 0.7, 0.4], 54);
		case 'newfloor':
			return move(t, K.cutNew, K.cutCable, [-3.6, 2.3, 3.2], [-3.3, 2.2, 2.9], [0.4, 0.8, -0.6], [0.4, 0.8, -0.6], 58);
		case 'cable':
			return move(t, K.cutCable, K.cutUnder, [ME_X + 0.3, 1.3, 1.0], [ME_X + 0.28, 1.25, 0.92], [ME_X - 0.15, DESK.top, 0.3], [ME_X - 0.15, DESK.top - 0.05, 0.32], 50, 0.12);
		case 'under':
			return move(t, K.cutUnder, K.snap, [ME_X + 0.05, 0.56, 1.35], [ME_X + 0.03, 0.5, 1.05], [ME_X, 0.3, -0.1], [ME_X, 0.32, -0.1], 60, 0.15);
	}
};

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotOf(t);
	const b = floorB(shot);
	const cam = <Cam get={() => poseAt(t, shot)} />;
	const panel = b ? 'panelB' : 'panelA';
	const lit = b ? [[0.2, -0.8], [-2.4, 1.4], [2.6, -2.8], [0.2, 1.4]] : [[-2.4, -2.8], [2.6, 1.4], [0.2, 1.4]];
	// the hook's run (stop-motion: his position steps every 1/10 s), along the aisle behind row 0
	const rq = Math.floor(t * 10) / 10;
	const runX = 5.0 - 1.25 * (rq - K.run0[0]);
	// the chair behind me that rolls by itself
	const roll = shot === 'pov' ? lin(t, K.behind - 0.4, K.turn[1] + 1.5) : 0;
	const tug = K.tugs.reduce((v, s) => v + ease(lin(t, s, s + 0.08)), 0) / K.tugs.length;
	const fall = ease(lin(t, K.drop, K.drop + 0.2));
	const glow = shot === 'under' ? lin(t, K.reveal - 1.2, K.reveal + 0.3) : 0;
	return (
		<>
			{cam}
			<ambientLight intensity={shot === 'under' ? 0.75 : b ? 1.3 : 1.05} color="#6a7690" />
			<Floor b={b} lit={lit} />
			{ROWS.map((z) =>
				COLS.map((x) => {
					const mine = x === ME_X && z === 0;
					const on = mine ? false : (x + z * 3) % 3 !== 0 || (b && x !== 3.0);
					return (
						<group key={`${x}${z}`}>
							<Desk x={x} z={z} panel={panel} on={on} cleared={mine && shot === 'leave'} mine={mine && shot !== 'leave' ? {t, state: shot === 'pov' && t < L.l04.end ? 'call' : 'ready'} : undefined} />
							{!(mine && (shot === 'leave' || shot === 'under')) && !(x === 3.0 && z === 0) && <Chair x={x} z={z + CHAIR_DZ + 0.05} ry={0} />}
						</group>
					);
				}),
			)}
			{shot === 'leave' && <Chair x={ME_X} z={CHAIR_DZ + 0.05} ry={-1.2 * ease(lin(t, K.cutLeave + 0.8, K.cutNew - 0.3))} />}
			{shot === 'pov' && <Chair x={0.9 + 1.4 * roll} z={2.1} ry={0.6 * roll} />}
			{shot === 'pov' && <pointLight position={[1.4, 2.4, 2.0]} intensity={2.2} distance={4} decay={1} color="#dfe8ff" />}
			{/* the agents */}
			{!b && (
				<>
					<Agent name="Character_Female_05" x={-1.5} z={-2.2} t={t} seed={1} height={1.58} />
					<Agent name="Character_10" x={1.5} z={-2.2} t={t} seed={2} />
					<Agent name="Character_05" x={-3.0} z={0} t={t} seed={3} />
					<Agent
						name="Character_29_Female"
						x={1.5}
						z={0}
						t={t}
						seed={4}
						height={1.52}
						extra={{Spine: [['x', -0.12 * ease(lin(t, K.look, K.look + 0.4))]], Neck: [['y', 0.9 * ease(lin(t, K.look, K.look + 0.4)) * (1 - ease(lin(t, K.down, K.down + 0.4)))], ['x', 0.55 * ease(lin(t, K.down, K.down + 0.4))]]}}
					/>
				</>
			)}
			{b && (
				<>
					<Agent name="Character_31_Female" x={-1.5} z={0} t={t} seed={5} height={1.55} />
					<Agent name="Character_03" x={1.5} z={-2.2} t={t} seed={6} />
				</>
			)}
			{/* me (not in my own POV shots) */}
			{(shot === 'floor' || shot === 'senior' || shot === 'reflect' || shot === 'newfloor') && <Agent name="Character_08" x={ME_X} z={0} t={t} seed={7} extra={shot === 'reflect' ? {Neck: [['x', 0.1]]} : {}} />}
			{/* the boy */}
			{shot === 'hook' && <Boy p={[runX, 0, 1.55]} ry={-Math.PI / 2} run={rq * 15} />}
			{shot === 'reflect' && <Boy p={[ME_X + 0.5, 0, CHAIR_DZ + 0.1]} ry={-Math.PI / 2 - 0.5} sit up={0.6 * ease(lin(t, K.lift, K.lift + 0.12))} />}
			{shot === 'under' && <Boy p={[ME_X + 0.05, 0, -0.08]} ry={0} sit up={ease(lin(t, K.snap, K.snap + 0.08))} />}
			{shot === 'under' && <pointLight position={[ME_X, 0.55, 0.6]} intensity={0.9 * glow} distance={1.3} decay={1} color="#9ac0ff" />}
			{/* my headset (the new floor) */}
			{(shot === 'cable' || shot === 'under') && (
				<group position={[ME_X, 0, 0]}>
					<Headset p={shot === 'under' ? [-0.1, 0.35, 0.3] : [-0.2, DESK.top + 0.05 - 0.4 * fall, 0.05 + 0.32 * tug]} fall={shot === 'under' ? 1 : fall} />
				</group>
			)}
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
		const r = rng(Math.floor(t * 24) * 7919 + 43);
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

export const Episode43: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	// the loop shot runs on negative time: the hook's own first moments
	const tv = t >= K.loopShot ? t - DUR : t;
	const shot = shotOf(tv);
	const reflect = shot === 'reflect';
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: reflect ? 'translateX(' + LW * SCALE + 'px) scale(' + -SCALE + ', ' + SCALE + ')' : 'scale(' + SCALE + ')', transformOrigin: '0 0', filter: reflect ? 'saturate(0.35) brightness(1.0) contrast(1.2)' : 'saturate(0.62) contrast(1.15) hue-rotate(-6deg)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.02, far: 40}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			{reflect && (
				<>
					{/* the dark monitor's glass: a cold tint, a glare, its bezel */}
					<AbsoluteFill style={{background: 'linear-gradient(160deg, rgba(160,190,230,0.10) 0%, rgba(0,0,0,0) 35%), rgba(6,10,20,0.35)'}} />
					<AbsoluteFill style={{border: '54px solid #0b0b0d', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.9)'}} />
				</>
			)}
			<Overlay t={tv} captions={captions} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep43-junjun-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
