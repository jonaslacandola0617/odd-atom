// Episode 23: "Backwards" (Season 3, a real reported case: the Bell Witch, Adams, Tennessee,
// 1817-1821). Season 3 rule: no shared template; and, from the user's note after Episode 22, the
// PICTURE must tell the story and frighten with motion, not only the narration.
// Form: told BACKWARDS, scene by scene, each joined by a rewind in which the previous scene runs
// backwards fast: the funeral (1820) -> the sickroom and the vial -> supper, when the voice talked
// (1819) -> the children's room (1818) -> outside, the first scratching (1817) -> the first night.
// Every shot moves (tracking, creeping, orbiting, pushing), and every scene has one event the
// picture shows: the lanterns blown out down the line and the mourners turning; a vial rolling on
// its own; candle flames leaning to an empty chair that scrapes back, and its sitter's shadow on the
// wall; a quilt slid off a bed and then yanked towards the door; scratches appearing on the logs
// ahead of the camera and something moving through the corn; a scratch drawing itself into a post.
// Scare placement: the front (a laugh and the gust at about 5.7 s), then several small ones.
// Visual language: a damaged old film print (sepia, dust, scratches, gate weave, flicker).
// Care: John Bell and his family were real people: faces stay in shadow; no one is shown harmed;
// the narration says almost all of it comes from one book written 70 years later.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep23-bell-v1-timeline.json';
import {rng} from '../ps1';
import {flicker, handheld} from '../entities';
import {Grave, Kids, MatsProvider, Outside, OUT, Post, POST, Sick, SICK, Table, TABLE, KIDS, V3} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep23Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

// ------------------------------------------------------------------ key times (scripts/ep23_sound.py uses the same rules)
export const K = {
	laugh: L.l01.end + 0.25,
	gust: [L.l01.end + 0.55, L.l01.end + 1.75] as [number, number],
	turn: [L.l01.end + 1.1, L.l01.end + 2.3] as [number, number],
	rew: [
		[L.l02.end + 0.15, L.l03.start - 0.4],
		[L.l04.end + 0.3, L.l05.start - 0.2],
		[L.l05.end + 1.4, L.l06.start - 0.05],
		[L.l06.end + 1.85, L.l07.start],
	] as [number, number][],
	vial: [L.l03.end + 0.1, L.l04.start - 0.1] as [number, number],
	twitch: [L.l04.start - 0.4, L.l04.end + 0.2] as [number, number],
	lean: [L.l05.end + 0.1, L.l05.end + 0.6] as [number, number],
	scrape: [L.l05.end + 0.5, L.l05.end + 0.75] as [number, number],
	shadow: [L.l05.end + 0.6, L.l05.end + 1.2] as [number, number],
	slide: [L.l06.start + 0.5, L.l06.end + 0.15] as [number, number],
	yank: [L.l06.end + 0.25, L.l06.end + 0.7] as [number, number],
	marks: [L.l07.start + 0.6, L.l07.end + 0.8] as [number, number],
	corn: [L.l08.start + 0.4, L.l08.end - 0.4] as [number, number],
	post: L.l08.end + 0.4,
	groove: [L.l09.start - 0.2, L.l09.end + 0.3] as [number, number],
};
export const STINGERS = [K.laugh, K.yank[0]];

type Scene = 'grave' | 'sick' | 'table' | 'kids' | 'out' | 'post';
const SCENES: [number, Scene, string][] = [
	[0, 'grave', 'DECEMBER 1820'],
	[K.rew[0][1], 'sick', 'DECEMBER 1820'],
	[K.rew[1][1], 'table', '1819'],
	[K.rew[2][1], 'kids', '1818'],
	[K.rew[3][1], 'out', '1817'],
	[K.post, 'post', '1817'],
];
/** which scene, and at what scene time: inside a rewind the PREVIOUS scene runs backwards, fast */
const sceneAt = (t: number): {scene: Scene; label: string; tt: number; rew: boolean} => {
	for (const [a, b] of K.rew) {
		if (t >= a && t < b) {
			const prev = [...SCENES].reverse().find((s) => s[0] <= a)!;
			return {scene: prev[1], label: prev[2], tt: a - (t - a) * 7, rew: true};
		}
	}
	const cur = [...SCENES].reverse().find((s) => s[0] <= t)!;
	return {scene: cur[1], label: cur[2], tt: t, rew: false};
};

// ------------------------------------------------------------------ cameras: every shot moves
type Shot = {from: [V3, V3]; to: [V3, V3]; t0: number; t1: number; fov: number; hand: number};
const shotFor = (scene: Scene, tt: number): Shot => {
	switch (scene) {
		case 'grave':
			return tt < K.gust[1] + 0.3
				? {from: [[-3.2, 2.4, 8.2], [-0.3, 0.8, 0]], to: [[2.6, 2.3, 7.7], [0.3, 0.8, 0]], t0: 0, t1: K.gust[1] + 0.3, fov: 50, hand: 0.6}
				: {from: [[0.3, 1.8, 7.2], [0, 1.35, 1.6]], to: [[0.1, 1.6, 4.4], [0, 1.45, 1.6]], t0: K.gust[1] + 0.3, t1: K.rew[0][0], fov: 50, hand: 0.9};
		case 'sick':
			return tt < K.vial[1]
				? {from: [add(SICK, [0.3, 1.65, 3.2]), add(SICK, [-0.2, 0.75, -1.0])], to: [add(SICK, [0.8, 1.45, 0.75]), add(SICK, [1.55, 1.05, -0.55])], t0: K.rew[0][1], t1: K.vial[1], fov: 52, hand: 0.8}
				: {from: [add(SICK, [0.75, 1.4, 0.55]), add(SICK, [1.4, 1.05, -0.9])], to: [add(SICK, [0.6, 1.2, 0.2]), add(SICK, [0.0, 0.78, -0.95])], t0: K.vial[1], t1: K.rew[1][0], fov: 50, hand: 0.7};
		case 'table':
			if (tt < K.lean[0]) {
				const a0 = 0.9, a1 = -0.5;
				const k = ease(lin(tt, K.rew[1][1], K.lean[0]));
				const a = a0 + (a1 - a0) * k;
				const p = add(TABLE, [Math.sin(a) * 2.4, 1.7, 0.3 + Math.cos(a) * 2.4]);
				return {from: [p, add(TABLE, [0, 0.85, -0.2])], to: [p, add(TABLE, [0, 0.85, -0.2])], t0: 0, t1: 1, fov: 52, hand: 0.4};
			}
			return {from: [add(TABLE, [0.9, 1.5, 1.6]), add(TABLE, [0.05, 1.0, -1.6])], to: [add(TABLE, [0.55, 1.45, 0.95]), add(TABLE, [0.1, 1.05, -2.0])], t0: K.lean[0], t1: K.rew[2][0], fov: 52, hand: 0.6};
		case 'kids':
			return {from: [add(KIDS, [-0.3, 1.45, 2.7]), add(KIDS, [-0.85, 0.55, -0.6])], to: [add(KIDS, [-0.45, 1.3, 1.7]), add(KIDS, [-0.8, 0.5, -0.4])], t0: K.rew[2][1], t1: K.rew[3][0], fov: 54, hand: 0.9};
		case 'out':
			return tt < L.l08.start - 0.2
				? {from: [add(OUT, [1.15, 1.45, 3.4]), add(OUT, [0.25, 1.15, 0.6])], to: [add(OUT, [1.05, 1.35, -2.2]), add(OUT, [0.2, 1.1, -4.8])], t0: K.rew[3][1], t1: L.l08.start - 0.2, fov: 52, hand: 0.7}
				: {from: [add(OUT, [1.0, 1.5, -2.0]), add(OUT, [5.5, 1.0, -1.2])], to: [add(OUT, [1.3, 1.3, -1.6]), add(OUT, [3.0, 0.9, -1.2])], t0: L.l08.start - 0.2, t1: K.post, fov: 52, hand: 0.8};
		case 'post':
			return {from: [add(POST, [-0.62, 1.3, 0.8]), add(POST, [-0.2, 1.0, 0.1])], to: [add(POST, [-0.38, 1.15, 0.5]), add(POST, [-0.2, 0.98, 0.1])], t0: K.post, t1: DUR, fov: 50, hand: 0.5};
	}
};

const Cam: React.FC<{scene: Scene; tt: number}> = ({scene, tt}) => {
	const {camera} = useThree();
	const s = shotFor(scene, tt);
	const k = ease(lin(tt, s.t0, s.t1));
	const p = mix3(s.from[0], s.to[0], k);
	const l = mix3(s.from[1], s.to[1], k);
	const h = handheld(tt, s.hand);
	// the gust and the yank shake the camera
	const jolt = STINGERS.reduce((a, kt) => a + (tt >= kt && tt < kt + 0.35 ? Math.sin((tt - kt) * 70) * 0.03 * (1 - (tt - kt) / 0.35) : 0), 0);
	camera.position.set(p[0] + h.dp[0], p[1] + h.dp[1] + jolt, p[2] + h.dp[2]);
	camera.up.set(Math.sin(h.roll), Math.cos(h.roll), 0);
	camera.lookAt(...l);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = s.fov;
	c.near = 0.03;
	c.far = 120;
	camera.updateProjectionMatrix();
	return null;
};

const FOG: Record<Scene, [string, number, number]> = {grave: ['#141a2a', 6, 30], sick: ['#050404', 3, 9], table: ['#050404', 4, 11], kids: ['#04050a', 3, 9], out: ['#04060c', 8, 40], post: ['#040303', 2, 7]};
const Atmos: React.FC<{scene: Scene}> = ({scene}) => {
	const {scene: sc} = useThree();
	const [c, near, far] = FOG[scene];
	const bg = new THREE.Color(c);
	if (!sc.fog) sc.fog = new THREE.Fog(bg, near, far);
	const f = sc.fog as THREE.Fog;
	f.color.copy(bg);
	f.near = near;
	f.far = far;
	sc.background = bg;
	return null;
};

const World: React.FC<{t: number}> = ({t}) => {
	const {scene, tt} = sceneAt(t);
	const gust = lin(tt, K.gust[0], K.gust[1]);
	const lanternsOn = 1 - gust;
	const fl = flicker(tt, 23, 10, 0.3);
	return (
		<>
			<Cam scene={scene} tt={tt} />
			<Atmos scene={scene} />
			{scene === 'grave' && (
				<>
					<ambientLight intensity={1.35} color="#6a7aa8" />
					{[-1.5, 0, 1.5].map((x, i) => (
						<pointLight key={x} position={[x, 0.9, 2.0]} intensity={2.4 * (gust > (i + 0.5) / 3 ? 0 : 1) * fl} distance={4} decay={1.2} color="#ffb060" />
					))}
				</>
			)}
			{scene === 'sick' && (
				<>
					<ambientLight intensity={1.4} color="#3a4060" />
					<pointLight position={add(SICK, [0.65, 0.75, -1.3])} intensity={7 * fl} distance={6} decay={1.0} color="#ffa050" />
					<pointLight position={add(SICK, [1.5, 1.4, -0.6])} intensity={2.5} distance={3} decay={1.0} color="#8a9ad0" />
				</>
			)}
			{scene === 'table' && (
				<>
					<ambientLight intensity={1.2} color="#3a3040" />
					<pointLight position={add(TABLE, [0, 1.1, 0.1])} intensity={6 * fl} distance={4} decay={1.3} color="#ffb060" />
					<pointLight position={add(TABLE, [-1.9, 0.6, -0.4])} intensity={1.8 * flicker(tt, 24, 7, 0.4)} distance={4} decay={1.2} color="#ff7020" />
				</>
			)}
			{scene === 'kids' && (
				<>
					<ambientLight intensity={2.2} color="#4a5678" />
					<pointLight position={add(KIDS, [0.6, 1.6, -1.2])} intensity={10} distance={6} decay={1.0} color="#8a9ad0" />
					<pointLight position={add(KIDS, [-0.3, 1.6, 3.4])} intensity={5 * fl} distance={7} decay={1.0} color="#ffa050" />
				</>
			)}
			{scene === 'out' && (
				<>
					<ambientLight intensity={2.5} color="#4a5a88" />
					<pointLight position={add(OUT, [6, 6, 2])} intensity={30} distance={30} decay={1.0} color="#9aa8d8" />
					<pointLight position={add(OUT, [0.6, 1.45, 1.6])} intensity={4} distance={4} decay={1.0} color="#ffa050" />
				</>
			)}
			{scene === 'post' && (
				<>
					<ambientLight intensity={1.0} color="#3a3040" />
					<pointLight position={add(POST, [-0.75, 0.85, -0.45])} intensity={2.8 * fl} distance={3.5} decay={1.3} color="#ffa050" />
				</>
			)}
			<MatsProvider>
				{scene === 'grave' && <Grave t={tt} gust={gust} lowered={ease(lin(tt, 0, K.laugh))} look={ease(lin(tt, K.turn[0], K.turn[1]))} />}
				{scene === 'sick' && <Sick t={tt} vial={ease(lin(tt, K.vial[0], K.vial[1]))} twitch={lin(tt, K.twitch[0], K.twitch[0] + 0.3) * (1 - lin(tt, K.twitch[1], K.twitch[1] + 0.5))} lean={0.5 * lin(tt, K.vial[0], K.vial[0] + 0.4)} />}
				{scene === 'table' && <Table t={tt} lean={ease(lin(tt, K.lean[0], K.lean[1]))} scrape={ease(lin(tt, K.scrape[0], K.scrape[1]))} shadow={lin(tt, K.shadow[0], K.shadow[1]) * (0.7 + 0.3 * flicker(tt, 25, 8, 0.6))} look={ease(lin(tt, K.lean[0] + 0.3, K.shadow[1]))} fire={1 + 0.3 * Math.sin(tt * 11)} />}
				{scene === 'kids' && <Kids pull={0.6 * ease(lin(tt, K.slide[0], K.slide[1])) + 0.4 * lin(tt, K.yank[0], K.yank[1])} curl={lin(tt, K.yank[0], K.yank[1] + 0.4)} />}
				{scene === 'out' && <Outside t={tt} marks={lin(tt, K.marks[0], K.marks[1])} corn={lin(tt, K.corn[0], K.corn[1])} />}
				{scene === 'post' && <Post t={tt} groove={ease(lin(tt, K.groove[0], K.groove[1]))} lean={0.3 * Math.sin(tt * 3)} />}
			</MatsProvider>
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: date, rewind, film damage, captions
const Overlay: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
	const cap = useRef<HTMLCanvasElement>(null);
	const noise = useRef<HTMLCanvasElement>(null);
	const {label, rew} = sceneAt(t);
	useLayoutEffect(() => {
		const CW = 360, CH = 640;
		const g = cap.current!.getContext('2d')!;
		g.clearRect(0, 0, CW, CH);
		const out = (s: string, x: number, y: number, fill: string, align: CanvasTextAlign = 'center') => {
			g.textAlign = align;
			for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [2, 2]]) {
				g.fillStyle = '#000';
				g.fillText(s, x + dx, y + dy);
			}
			g.fillStyle = fill;
			g.fillText(s, x, y);
		};
		g.font = 'bold 14px "DejaVu Sans Mono", monospace';
		out(rew ? '<< REWIND' : label, 24, 40, rew ? '#ffffff' : '#e8d8b0', 'left');
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
			show.forEach((r, i) => out(r, CW / 2, 486 + i * 19 - (show.length - 1) * 19, '#ffffff'));
		}
		const img = g.getImageData(0, 0, CW, CH);
		for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 120 ? 255 : 0;
		g.putImageData(img, 0, 0);
		// an old film print: grain, dust, a vertical scratch or two; a rewind is torn by bright bars
		const n = noise.current!.getContext('2d')!;
		const ni = n.createImageData(LW, LH);
		const r = rng(Math.floor(t * 30) * 7919 + 23);
		const roll = Math.floor(t * 30 * 37) % LH;
		for (let y = 0; y < LH; y++) {
			const bar = rew && (y + roll) % 64 < 10;
			for (let x = 0; x < LW; x++) {
				const i = (y * LW + x) * 4;
				const v = bar ? 220 + r() * 35 : r() * 255;
				ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = v;
				ni.data[i + 3] = bar ? 150 : 20 * (r() < 0.5 ? 1 : 0.4);
			}
		}
		for (let k = 0; k < 6; k++) {
			const x = Math.floor(r() * LW), y = Math.floor(r() * LH), dark = r() < 0.6;
			for (let d = 0; d < 2; d++) {
				const i = ((y + d) * LW + x) * 4;
				if (i < ni.data.length - 4) {
					ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = dark ? 0 : 255;
					ni.data[i + 3] = 200;
				}
			}
		}
		if (r() < 0.6) {
			const x = Math.floor(r() * LW);
			for (let y = 0; y < LH; y++) {
				const i = (y * LW + x) * 4;
				ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = 230;
				ni.data[i + 3] = 70;
			}
		}
		n.putImageData(ni, 0, 0);
	}, [t, captions, label, rew]);
	return (
		<>
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: rew ? 'normal' : 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

// ------------------------------------------------------------------ assembly
export const Episode23: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const {rew} = sceneAt(t);
	const r = rng(f * 31 + 5);
	// gate weave and projector flicker; a rewind smears sideways
	const weaveX = Math.round((r() - 0.5) * 2) + (rew ? Math.round(Math.sin(t * 80) * 10) : 0);
	const weaveY = Math.round((r() - 0.5) * 2);
	const bright = 0.94 + r() * 0.1;
	const ca = rew ? 4 : 0.6;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="tape23" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: weaveX, top: weaveY, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: `url(#tape23) sepia(0.55) brightness(${bright}) contrast(1.1)`}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.03, far: 120}} style={{imageRendering: 'pixelated'}}>
					<World t={t} />
				</ThreeCanvas>
			</div>
			<Overlay t={t} captions={captions} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 36%, rgba(0,0,0,0.9) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep23-bell-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
