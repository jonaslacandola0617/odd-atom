// Episode 33: "Igalaw Mo ang Daliri" (Season 4: the batibat, Ilocano folklore, and bangungot, the
// documented sudden deaths in sleep). Taglish, Juanito. Built to the motion rule (every shot moves,
// every scene has an event, it reads muted); hard cuts only; an eerie score; a seamless loop (the last
// shot is the first shot, on negative time).
// Form: "paralysis POV". Most of the episode is the sleeper's own view, locked to his head (it moves
// only with his breath and small jolts), cut hard against the one thing he is trying to move: his big
// toe. The tree and the house are the only wide shots.
// The picture: his POV, the ceiling; a vast dark shape leans in and the frame is pressed down (hook);
// the old tree at dusk, its branches bow under a weight; it falls; its trunk stands as the post of a new
// house, and something shifts in the rafters; the man and his wife asleep under the kulambo, the bark
// of the post breathes; the kulambo sags as weight settles on it and his chest is pressed flat; the
// clock goes from 2:59 to 3:00 and strikes three; his POV, the grey face comes down to him, eyes opening;
// his toe, trembling, then it moves; he wakes, gasping, the ceiling is empty, he turns to his wife; her
// foot in the moonlight: her toe does not move, and the shape is over her now. Then his POV again (loop).
// Care: real people die of bangungot: no death is shown; the medical view is in the narration; the
// batibat's size is dread, never a joke; the wife's state is left open.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep33-batibat-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {Batibat, CLOCK, HER_TOE, HIS_HEAD, HIS_TOE, House, MatsProvider, POST, TREE, Tree, V3} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep33Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep33_sound.py uses the same rules)
export const K = {
	press: [0.2, 3.6] as [number, number], // the hook: she leans in, the frame is pressed down
	cutTree: L.l02.start - 0.3,
	bow: [L.l02.start + 3.0, L.l02.end] as [number, number],
	fall: [L.l03.start + 0.05, L.l03.start + 1.2] as [number, number],
	cutPost: L.l03.start + 2.6,
	shift: L.l03.end - 0.6, // something shifts in the rafters
	cutHouse: L.l04.start - 0.3,
	cutSag: L.l05.start - 0.3,
	sag: [L.l05.start + 0.6, L.l05.start + 4.2] as [number, number],
	cutClock: L.l05.start + 5.2,
	three: L.l05.end - 1.7, // 2:59 -> 3:00
	chimes: [L.l05.end + 0.1, L.l05.end + 0.45, L.l05.end + 0.8],
	cutPov2: L.l06.start - 0.1,
	face: [L.l06.start + 0.2, L.l06.end + 0.3] as [number, number],
	eyes: L.l06.end + 0.3, // the eyes open
	cutToe: L.l07.start - 0.3,
	toe: [L.l07.end + 0.15, L.l07.end + 0.5] as [number, number], // it moves
	cutWake: L.l07.end + 0.6,
	turn: [L.l07.end + 0.9, L.l08.start - 0.4] as [number, number],
	cutHer: L.l08.start - 0.25,
	loopShot: DUR - 1.8,
};
export const STINGERS = [K.eyes, K.cutWake, K.cutHer];

type Shot = 'pov' | 'tree' | 'post' | 'house' | 'sag' | 'clock' | 'pov2' | 'toe' | 'wake' | 'her';
const shotAt = (t: number): Shot => {
	if (t < K.cutTree) return 'pov';
	if (t < K.cutPost) return 'tree';
	if (t < K.cutHouse) return 'post';
	if (t < K.cutSag) return 'house';
	if (t < K.cutClock) return 'sag';
	if (t < K.cutPov2) return 'clock';
	if (t < K.cutToe) return 'pov2';
	if (t < K.cutWake) return 'toe';
	if (t < K.cutHer) return 'wake';
	return 'her';
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
	c.near = 0.02;
	c.far = 700;
	camera.updateProjectionMatrix();
	return null;
};
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
// his eyes: lying on his back, the top of his view is beyond his head (-x)
const EYE: V3 = add(HIS_HEAD, [0.16, 0.16, 0]);

const poseAt = (t: number, shot: Shot): CamPose => {
	const h = handheld(t, 0.4);
	const breath = 0.006 * Math.sin(t * 2.2);
	switch (shot) {
		case 'pov':
		case 'pov2': {
			const press = shot === 'pov' ? ease(lin(t, K.press[0], K.press[1])) : 1;
			const shake = 0.004 * press * Math.sin(t * 31) * Math.sin(t * 7);
			const p = add(EYE, [shake, breath - 0.03 * press, shake]);
			return {p, l: add(p, [0.45, 2.6, 0.05 * Math.sin(t * 0.7)]), up: [-1, 0, 0], fov: 62};
		}
		case 'tree': {
			const k = ease(lin(t, K.cutTree, K.cutPost));
			return {p: add(TREE, [-15 + 4 * k, 2.4, 15 - 4 * k]), l: add(TREE, [1.5 * ease(lin(t, K.fall[0], K.fall[1])), 4.2 - 2.5 * ease(lin(t, K.fall[0], K.fall[1] + 0.5)), 0]), fov: 46};
		}
		case 'post': {
			const k = ease(lin(t, K.cutPost, K.cutHouse));
			return {p: [1.4, 1.1, 2.0], l: [POST[0], 0.9 + 1.7 * k, POST[2]], fov: 56};
		}
		case 'house': {
			const k = ease(lin(t, K.cutHouse, K.cutSag));
			return {p: [2.7 - 0.5 * k + h.dp[0], 1.8 - 0.2 * k, 1.9 - 0.3 * k], l: [0.0, 0.5, 0.0], fov: 52};
		}
		case 'sag': {
			const k = ease(lin(t, K.cutSag, K.cutClock));
			return {p: [1.1 + h.dp[0], 0.5 + 0.1 * k, 1.75 - 0.25 * k], l: [0.2, 0.75 - 0.2 * k, 0.1], fov: 54};
		}
		case 'clock': {
			const k = ease(lin(t, K.cutClock, K.cutPov2));
			return {p: add(CLOCK, [0.12 + h.dp[0] * 0.3, -0.08, 0.95 - 0.4 * k]), l: add(CLOCK, [0, -0.06, 0]), fov: 44};
		}
		case 'toe': {
			const k = ease(lin(t, K.cutToe, K.cutWake));
			return {p: add(HIS_TOE, [0.06, 0.14 - 0.03 * k, 0.34 - 0.08 * k]), l: add(HIS_TOE, [-0.04, 0.04, 0]), fov: 42};
		}
		case 'wake': {
			// a gasp: the view jolts; the ceiling is empty; he turns his head to his wife
			const jolt = Math.exp(-(t - K.cutWake) * 6) * 0.05 * Math.sin((t - K.cutWake) * 40);
			const turn = ease(lin(t, K.turn[0], K.turn[1]));
			const p = add(EYE, [jolt, breath, 0]);
			return {p, l: add(p, mix3([0.45, 2.6, 0.05], [0.4, 0.15, -1.6], turn)), up: mix3([-1, 0, 0], [0, 1, 0], turn), fov: 62};
		}
		case 'her': {
			const k = ease(lin(t, K.cutHer, DUR));
			return {p: add(HER_TOE, [0.55 - 0.12 * k + h.dp[0] * 0.2, 0.22 + 0.05 * k, 0.32]), l: add(HER_TOE, [-0.25, 0.25 + 0.15 * k, -0.05]), fov: 52};
		}
	}
};

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotAt(t);
	const pose = poseAt(t, shot);
	if (shot === 'tree') {
		const fall = lin(t, K.fall[0], K.fall[1]) ** 2;
		return (
			<>
				<Cam pose={pose} />
				<ambientLight intensity={1.0} color="#b08a7a" />
				<pointLight position={[TREE[0] - 60, 30, -150]} intensity={1.6} decay={0} color="#ff9a60" />
				<Tree t={t} fall={fall} bow={ease(lin(t, K.bow[0], K.bow[1]))} spirit={t < K.fall[0] + 0.3} />
			</>
		);
	}
	const night = shot !== 'post';
	const flick = 0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 7.7);
	// where she is
	let bat: React.ReactNode = null;
	if (shot === 'pov' || shot === 'pov2') {
		const k = shot === 'pov' ? ease(lin(t, K.press[0], K.press[1])) : 1;
		const lower = shot === 'pov2' ? ease(lin(t, K.face[0], K.face[1])) : 0;
		const head = mix3(add(EYE, [-0.5, 1.6, 0.9]), add(EYE, [0.12, 1.0 - 0.28 * lower, 0.02]), k);
		bat = <Batibat p={add(head, [-0.55, 0.75, 0])} r={[0, 0, -Math.PI / 2]} t={t} eyes={shot === 'pov2' ? 0.3 + 0.9 * lin(t, K.eyes - 0.3, K.eyes) : 0.15} />;
	} else if (shot === 'post') {
		const s = lin(t, K.shift, K.shift + 0.6);
		bat = <Batibat p={[POST[0] - 0.3 + 0.4 * s, 2.45, 0.6 - 0.2 * s]} r={[0, 0.4 + 0.6 * s, 0.2]} s={0.5} t={t} eyes={0.1} />;
	} else if (shot === 'sag') {
		// unseen: only the net and the blanket show the weight
	} else if (shot === 'her') {
		const k = ease(lin(t, K.cutHer, K.cutHer + 1.8));
		bat = <Batibat p={[0.75 + 0.15 * k, 0.5 - 0.05 * k, -0.4]} r={[0, 0, -0.25]} s={0.8} t={t} eyes={0.6} />;
	}
	const sag = shot === 'sag' ? ease(lin(t, K.sag[0], K.sag[1])) : shot === 'pov' || shot === 'pov2' || shot === 'clock' || shot === 'toe' ? 1 : 0;
	const minute = shot === 'clock' ? (t < K.three ? 59 / 60 : 1) : shot === 'house' || shot === 'sag' ? 58 / 60 : 1;
	return (
		<>
			<Cam pose={pose} />
			<ambientLight intensity={(shot === 'pov' || shot === 'pov2' || shot === 'wake' ? 0.6 : night ? 0.4 : 0.7)} color={night ? '#5a6488' : '#a07a5a'} />
			<pointLight position={[2.7, 1.7, 0.6]} intensity={night ? 2.6 : 3.2} distance={6} decay={1} color={night ? '#b8c4e8' : '#ffa060'} />
			<pointLight position={[-2.8, 1.55, -1.2]} intensity={0.8 * flick} distance={3} decay={1} color="#ffb060" />
			{(shot === 'toe' || shot === 'her') && <pointLight position={add(shot === 'toe' ? HIS_TOE : HER_TOE, [0.5, 0.6, 0.2])} intensity={1.6} distance={1.6} decay={1} color="#b8c4e8" />}
			{(shot === 'pov' || shot === 'pov2' || shot === 'wake') && <pointLight position={add(EYE, [0.9, 0.5, 0.6])} intensity={2.4} distance={3} decay={1} color="#9aa8d0" />}
			{(shot === 'pov' || shot === 'pov2' || shot === 'wake') && <pointLight position={add(EYE, [0.6, 2.3, 0.3])} intensity={1.6} distance={2.5} decay={1} color="#8a96c0" />}
			<House t={t} postBreathe={night ? 1 : 0.4} sag={sag} chest={sag} toe={shot === 'toe' ? ease(lin(t, K.toe[0], K.toe[1])) : shot === 'wake' || shot === 'her' ? 0.4 : 0}
				tremble={shot === 'toe' ? 0.4 + 0.6 * lin(t, K.cutToe, K.toe[0]) : 0} herToe={0} minute={minute} candle={shot === 'her' ? 0 : 1} />
			{bat}
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
		const r = rng(Math.floor(t * 24) * 7919 + 33);
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
export const Episode33: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	// the loop shot runs on negative time: the hook's own first moments, before she leans in
	const tv = t >= K.loopShot ? t - DUR : t;
	const shot = shotAt(tv);
	const grade = shot === 'tree' ? 'sepia(0.25) saturate(0.85) contrast(1.1)' : shot === 'post' ? 'sepia(0.3) saturate(0.8) contrast(1.1)' : 'saturate(0.6) contrast(1.15) brightness(1.02)';
	// paralysis: the edges of the view close in during his POV
	const tunnel = shot === 'pov' || shot === 'pov2' ? 0.55 + 0.3 * (shot === 'pov2' ? 1 : lin(tv, 0, 3.6)) : 0.35;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: grade}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.02, far: 700}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			<Overlay t={tv} captions={captions} />
			<AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) ${Math.round(70 - 40 * tunnel)}%, rgba(0,0,0,${0.6 + 0.35 * tunnel}) 100%)`}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep33-batibat-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
