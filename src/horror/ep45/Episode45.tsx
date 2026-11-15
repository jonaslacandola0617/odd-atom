// Episode 45: "Ang Humahaplos" (Season 5: a student's experience in an old campus CR at night, shared
// online and retold in our own words; no real school, building or person). Taglish, Juanito. The PSX
// models; hard cuts only; an eerie score; a seamless loop (the last shot is the first shot, on
// negative time).
// Form: "the mirror and the room": the mirror is cut against the room, and they disagree. In the
// mirror a pale hand strokes my hair, slowly, like a mother; in the room nothing touches me, only my
// head dips with each stroke. The mirror's last cubicle is open, and the arm comes all the way across
// the room from inside it. Her head leans out of the cubicle, tipped too far, in held-then-snapped
// steps; the last snap is to the lens. Then the hook again (loop).
// Me: Character_08. Her: Character_Monster_05 (long hair over the face), pale, the arm stretched by
// the kit's `reach`. Care: no school named; no harm shown.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep45-cr-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {ARMS_DOWN, merge, Pose, PsxCharacter} from '../psx/models';
import {Corridor, MatsProvider, Restroom, tube, V3} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep45Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep45_sound.py uses the same rules)
export const K = {
	cutHall: L.l02.start - 0.3,
	cutEnter: L.l03.start - 0.3,
	cutWash: L.l04.start - 0.3,
	splash: [L.l04.start + 0.35, L.l04.start + 1.55] as [number, number], // hands to the face, twice
	cutReal: L.l05.start - 0.3,
	touch: L.l05.start + 0.5, // the first stroke (I freeze)
	creak: L.l05.end + 0.45, // the last cubicle's door, heard, not seen
	cutMirror: L.l06.start - 0.3,
	cutWide: L.l07.start - 0.3,
	cutHer: L.l08.start - 0.3,
	lean: [L.l08.end - 1.6, L.l08.end - 0.7, L.l08.end + 0.05] as number[], // her head out of the cubicle, in snaps
	snap: L.l08.end + 0.6, // her head snaps round to the lens (the stinger)
	loopShot: DUR - 1.7,
};
export const STINGERS = [K.snap];
/** the strokes: one every 2.2 s (0 at the brow, 1 at the crown), on whole cycles of t (loop-safe) */
export const STROKE = 2.2;
const stroke = (t: number) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / STROKE);

type Shot = 'hook' | 'hall' | 'enter' | 'wash' | 'real' | 'mirror' | 'wide' | 'her';
const CUTS: [number, Shot][] = [
	[K.cutHall, 'hook'],
	[K.cutEnter, 'hall'],
	[K.cutWash, 'enter'],
	[K.cutReal, 'wash'],
	[K.cutMirror, 'real'],
	[K.cutWide, 'mirror'],
	[K.cutHer, 'wide'],
];
const shotOf = (t: number): Shot => CUTS.find(([c]) => t < c)?.[1] ?? 'her';
const isMirror = (s: Shot) => s === 'hook' || s === 'wash' || s === 'mirror' || s === 'wide' || s === 'her';

// ------------------------------------------------------------------ the people
const PALE = {color: '#d6dcdc', emissive: '#1e2424'};
const ME_AT: V3 = [-0.78, 0, -2.3];
/** the crown of my head at the sink, bowed by dip (measured with the probe: (−0.957, 1.619) at dip 0.71) */
const crown = (d: number): V3 => [-0.88 - 0.11 * d, 1.66 - 0.057 * d, -2.31];
/** me. walk: a stride phase (walking −z); at the sink: facing the mirror (−x), hands on the counter;
 *  wash: 0..1 bending to the basin and up to the face; dip: my head giving under the strokes. */
const Me: React.FC<{t: number; p?: V3; walk?: number; wash?: number; dip?: number}> = ({t, p = ME_AT, walk, wash = 0, dip = 0}) => {
	const br = Math.sin(t * 1.6) * 0.02;
	let pose: Pose;
	if (walk !== undefined) {
		const s = Math.sin(walk);
		pose = {
			LeftUpLeg: [['aim', [0.05, -1, 0.4 * s]]],
			RightUpLeg: [['aim', [-0.05, -1, -0.4 * s]]],
			LeftLeg: [['aim', [0, -1, -0.25 + 0.2 * s]]],
			RightLeg: [['aim', [0, -1, -0.25 - 0.2 * s]]],
			LeftArm: [['aim', [0.2, -1, -0.3 * s]]],
			RightArm: [['aim', [-0.2, -1, 0.3 * s]]],
			LeftForeArm: [['aim', [0.1, -1, 0.3]]],
			RightForeArm: [['aim', [-0.1, -1, 0.3]]],
			Neck: [['x', 0.12]],
		};
	} else {
		// wash: down to the basin (0..0.5), up to the face (0.5..1), twice
		const w = wash;
		const bend = Math.sin(Math.PI * w);
		pose = merge(
			{
				LeftArm: [['aim', [0.18, -0.75 + 0.6 * bend, 0.6]]],
				RightArm: [['aim', [-0.18, -0.75 + 0.6 * bend, 0.6]]],
				LeftForeArm: [['aim', [-0.15 - 0.5 * bend, -0.75 + 1.2 * bend, 0.6]]],
				RightForeArm: [['aim', [0.15 + 0.5 * bend, -0.75 + 1.2 * bend, 0.6]]],
				Spine: [['x', 0.12 + 0.45 * bend]],
				Spine2: [['x', br]],
				Neck: [['x', 0.1 + 0.25 * dip], ['z', -0.06 * dip]],
				Head: [['x', 0.12 * dip]],
			},
		);
	}
	return <PsxCharacter name="Character_08" height={1.7} position={p} rotation={[0, walk !== undefined ? Math.PI : -Math.PI / 2, 0]} pose={pose} />;
};

/** her, inside the last cubicle facing out (−x). reach: where her left hand is (on my head), or none.
 *  lean: 0..3 the held-then-snapped steps out of the cubicle; face: 0..1 the last snap to the lens. */
const HER_AT: V3 = [0.95, 0, -3.5];
const Her: React.FC<{t: number; hand?: V3; lean?: number; face?: number}> = ({t, hand, lean = 0, face = 0}) => {
	const br = Math.sin(t * 0.9) * 0.015;
	const pose = merge(ARMS_DOWN, {
		Spine: [['x', 0.12 * lean], ['z', -0.16 * lean]],
		Spine2: [['x', br + 0.06 * lean]],
		// out of the door, her head tips over onto its side, past where a neck goes; the last snap
		// throws it upright again and up, at the lens
		Neck: [['x', 0.3 - 0.25 * face], ['z', -0.42 * lean + 0.6 * face]],
		Head: [['z', -0.25 * lean + 0.55 * face], ['x', -0.3 * face]],
		RightArm: [['aim', [-0.15, -1, 0.05]]],
	});
	return (
		<PsxCharacter
			name="Character_Monster_05"
			height={1.66}
			tint={PALE}
			position={[HER_AT[0] - 0.12 * lean - 0.3 * face, 0, HER_AT[2] + 0.07 * lean]}
			rotation={[0, -Math.PI / 2, 0]}
			pose={pose}
			reach={hand ? {arm: 'Left', target: hand} : undefined}
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
const move = (t: number, t0: number, t1: number, a: V3, b: V3, la: V3, lb: V3, fov: number, shake = 0.2, fov1 = fov): CamPose => {
	const k = ease(lin(t, t0, t1));
	const hh = handheld(t, shake);
	const p = mix3(a, b, k);
	return {p: [p[0], p[1] + hh.dp[1] * 0.25, p[2] + hh.dp[0] * 0.25], l: mix3(la, lb, k), fov: fov + (fov1 - fov) * k};
};
// the mirror shots look from my eye's mirror image (x < −1.5) into the room; the picture is flipped
const poseAt = (t: number, shot: Shot): CamPose => {
	switch (shot) {
		case 'hook':
			return move(t, -1.7, K.cutHall, [-1.95, 1.74, -2.0], [-1.88, 1.73, -2.04], [-0.8, 1.62, -2.36], [-0.8, 1.62, -2.36], 44, 0.08);
		case 'hall':
			return move(t, K.cutHall, K.cutEnter, [-0.7, 1.6, 14.8], [-0.7, 1.55, 12.6], [-0.7, 1.15, 1.0], [-0.7, 1.15, 1.0], 50, 0.25);
		case 'enter':
			return move(t, K.cutEnter, K.cutWash, [-1.3, 2.3, 0.82], [-1.25, 2.26, 0.7], [0.45, 0.8, -3.0], [0.4, 0.8, -3.0], 62, 0.12);
		case 'wash':
			return move(t, K.cutWash, K.cutReal, [-2.25, 1.76, -1.92], [-2.15, 1.74, -1.96], [0.4, 1.25, -2.85], [0.4, 1.25, -2.85], 54, 0.08);
		case 'real':
			return move(t, K.cutReal, K.cutMirror, [0.05, 1.95, -1.55], [-0.08, 1.9, -1.62], [-0.85, 1.5, -2.32], [-0.85, 1.52, -2.32], 46, 0.1);
		case 'mirror':
			return move(t, K.cutMirror, K.cutWide, [-1.9, 1.74, -2.05], [-1.82, 1.73, -2.1], [-0.8, 1.64, -2.38], [-0.8, 1.64, -2.38], 42, 0.06);
		case 'wide':
			return move(t, K.cutWide, K.cutHer, [-2.5, 1.86, -1.68], [-2.42, 1.84, -1.74], [0.2, 1.4, -2.8], [0.2, 1.4, -2.8], 62, 0.08);
		case 'her':
			// along the arm, from my head back into the cubicle, then held on her
			return move(t, K.cutHer, L.l08.end - 1.8, [-2.25, 1.74, -2.15], [-2.1, 1.62, -2.6], [-0.85, 1.62, -2.3], [0.45, 1.45, -3.3], 44, 0.06, 38);
	}
};

// ------------------------------------------------------------------ the scene
/** the last cubicle stands open in the mirror once the creak has been heard (and in the hook) */
const openAt = (t: number, shot: Shot) => (shot === 'hook' ? 1 : isMirror(shot) ? ease(lin(t, K.creak, K.creak + 1.2)) : 0);
const handAt = (t: number): V3 => {
	// the stroke presses my head down as it goes from the brow to the crown
	const s = stroke(t);
	const c = crown(s);
	return [c[0] - 0.07 + 0.2 * s, c[1] + 0.05 + 0.02 * Math.sin(Math.PI * s), c[2]];
};
const step = (t: number, at: number[]) => at.reduce((n, a) => n + ease(lin(t, a, a + 0.07)), 0);

const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotOf(t);
	const mirror = isMirror(shot);
	const cam = <Cam get={() => poseAt(t, shot)} />;
	const light = tube(t);
	// the hand is on me in the hook, from the touch on (heard and felt), and in every later mirror
	const touched = shot === 'hook' || t >= K.touch;
	const dip = touched && (shot === 'hook' || shot === 'real' || shot === 'mirror' || shot === 'wide' || shot === 'her') ? stroke(t) * (shot === 'real' ? lin(t, K.touch, K.touch + 0.6) : 1) : 0;
	const washK = shot === 'wash' ? (t < K.splash[1] ? lin(t, K.splash[0], K.splash[0] + 1.0) : lin(t, K.splash[1], K.splash[1] + 1.0)) : 0;
	return (
		<>
			{cam}
			<ambientLight intensity={shot === 'hall' ? 0.9 : 1.45} color="#7a8a8a" />
			<Restroom open={openAt(t, shot)} mirrorShot={mirror} light={light} />
			{shot === 'hall' && <Corridor lamp={tube(t + 0.9) > 0.5 ? 1 : 0.4} />}
			{shot === 'hall' && <Me t={t} p={[-0.7, 0, 9.2 - 1.0 * (t - K.cutHall)]} walk={(t - K.cutHall) * 5.2} />}
			{shot === 'enter' && <Me t={t} p={[-0.75, 0, 0.9 - 0.62 * (t - K.cutEnter)]} walk={(t - K.cutEnter) * 5.2} />}
			{shot !== 'hall' && shot !== 'enter' && <Me t={t} wash={washK} dip={dip} />}
			{/* her: only ever in the mirror (and her hand on me only from the touch on) */}
			{mirror && shot !== 'wash' && (
				<Her t={t} hand={touched ? handAt(t) : undefined} lean={shot === 'her' ? step(t, K.lean) : 0} face={shot === 'her' ? ease(lin(t, K.snap, K.snap + 0.07)) : 0} />
			)}
			{/* a cold light on her in the last shot, so the leaning head reads against the cubicle */}
			{shot === 'her' && <pointLight position={[-0.2, 1.9, -3.0]} intensity={0.9 * light} distance={2.6} decay={1} color="#cfe4e4" />}
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
		const r = rng(Math.floor(t * 24) * 7919 + 45);
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
export const Episode45: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	// the loop shot runs on negative time: the hook's own first moments
	const tv = t >= K.loopShot ? t - DUR : t;
	const shot = shotOf(tv);
	const mirror = isMirror(shot);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: mirror ? 'translateX(' + LW * SCALE + 'px) scale(' + -SCALE + ', ' + SCALE + ')' : 'scale(' + SCALE + ')', transformOrigin: '0 0', filter: mirror ? 'saturate(0.45) contrast(1.18) brightness(0.95)' : 'saturate(0.6) contrast(1.15) hue-rotate(-8deg)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.02, far: 40}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			{mirror && (
				<>
					{/* the old mirror: a cold cast, a smear of glare, black spots where the silvering has gone */}
					<AbsoluteFill style={{background: 'linear-gradient(200deg, rgba(190,210,210,0.10) 0%, rgba(0,0,0,0) 30%), rgba(8,14,16,0.25)'}} />
					<AbsoluteFill style={{background: 'radial-gradient(circle at 8% 92%, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 14%), radial-gradient(circle at 94% 6%, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 10%)'}} />
				</>
			)}
			<Overlay t={tv} captions={captions} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep45-cr-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
