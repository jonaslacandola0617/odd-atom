// Episode 18: "The Light in the Quezon Room" (reported legend: Malacañang, Manila). Season 2 horror
// standard (docs/production/EPISODE_PLAYBOOK.md): a dark key lit by a guard's flashlight, moonlight
// through capiz windows and one desk lamp; the stories withheld (a window lighting by itself, a strip
// of light under a door, an empty office with the lamp on and the chair turned to the window, dust
// sifting down as footsteps pace above, smoke in an empty room, a child's ball rolling out of a
// doorway), then ONE clear reveal: the guard turns, and down the hall a priest's cassock with nothing
// above the collar walks away. The guard switches the lamp off; outside, the window is dark, until
// the next night.
// Taglish narration (Juanito), Taglish captions. Portrait 1080x1920, rendered at 180x320 and
// upscaled 6x, PS1 shaders, a light tape layer.
// Viral standard: a hook on frame 0 (the palace at night, every window dark, and one switches on:
// "Gabi-gabi, sa Malacañang, may isang ilaw na kusang bumubukas."); a seamless loop (the last 1.6 s
// replay the hook's push, and the window lights again just after the seam); hidden details (the
// office clock at 3:15; the chair turned to the window, later back to the desk; a small shoe in the
// hall; smoke in a dark window outside in the last shot; three frames of the figure); an open question
// (what is he still worried about?).
// Care: staff recollections reported in the press, told as stories; no living official named; past
// presidents never shown or named; portraits are dark landscapes; nothing political; the palace is
// shown as historic.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep18-palace-v1-timeline.json';
import {rng} from '../ps1';
import {handheld, Headless} from '../entities';
import {DESK, Exterior, Guard, Interior, MatsProvider, OUT_Z} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep18Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => x * x * (3 - 2 * x);
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));

// key times, all from the real line times (scripts/ep18_sound.py reads the same rules)
export const K = {
	lightOn: 1.0, // the window switches on (on hook time u; it does so again just after the loop seam)
	sub: L.l05.end + 0.15, // three frames of the figure (between lines)
	ball: L.l07.start - 0.1, // a ball rolls out of a doorway
	turn: L.l07.end + 0.3, // the guard turns
	reveal: L.l07.end + 1.6, // down the hall, the figure (stinger in silence)
	off: L.l09.end - 0.6, // he switches off the lamp
	loopOn: DUR - 1.6,
};
export const STINGERS = [K.reveal];
const SUB = (t: number) => t >= K.sub && t < K.sub + 0.1;

// ------------------------------------------------------------------ shot list
type Mode = 'out' | 'in';
type Pose = {p: V3; l: V3};
type Shot = {id: string; t: number; from: Pose; to?: Pose; fov?: number; mode: Mode; hand?: number; torch?: boolean};
const A: {from: Pose; to: Pose} = {from: {p: [-1.2, 2.6, OUT_Z + 19], l: [-3.4, 5.0, OUT_Z]}, to: {p: [-1.5, 2.6, OUT_Z + 17.2], l: [-3.5, 5.1, OUT_Z]}};
const BALL_LOOK: V3 = [-1.0, 0.3, -14];
const BACK: V3 = [0, 1.25, 6];
const SHOTS: Shot[] = [
	{id: 'A_hook', t: 0, mode: 'out', ...A, fov: 50, hand: 0.15},
	{id: 'B_river', t: L.l01.end + 0.3, mode: 'out', from: {p: [16, 1.1, OUT_Z + 27], l: [-2, 4.2, OUT_Z]}, to: {p: [14.5, 1.1, OUT_Z + 26], l: [-2, 4.2, OUT_Z]}, fov: 50},
	{id: 'C_hall', t: L.l02.end + 0.3, mode: 'in', torch: true, from: {p: [0.3, 1.6, 6.5], l: [0, 1.3, -22]}, to: {p: [0.3, 1.6, 2.5], l: [-0.2, 1.3, -22]}, fov: 54, hand: 0.6},
	{id: 'D_door', t: L.l04.start - 0.3, mode: 'in', from: {p: [-0.5, 0.45, -0.8], l: [-2.1, 0.5, -2.1]}, to: {p: [-0.6, 0.42, -1.0], l: [-2.1, 0.5, -2.1]}, fov: 52, hand: 0.3},
	{id: 'D2_office', t: L.l04.start + 2.9, mode: 'in', from: {p: [-2.3, 1.6, -1.5], l: [-5.6, 0.9, -2.2]}, to: {p: [-2.9, 1.6, -1.6], l: [-5.6, 0.9, -2.2]}, fov: 54, hand: 0.4},
	{id: 'E_ceiling', t: L.l05.start - 0.3, mode: 'in', from: {p: [1.5, 0.7, -2.2], l: [-0.1, 3.2, -6.6]}, to: {p: [1.5, 0.65, -2.5], l: [-0.1, 3.4, -6.6]}, fov: 56, hand: 0.3},
	{id: 'F_smoke', t: L.l05.end + 0.3, mode: 'in', from: {p: [-2.5, 1.5, -7.5], l: [-4.4, 1.0, -8.0]}, to: {p: [-2.8, 1.45, -7.6], l: [-4.4, 1.1, -8.0]}, fov: 52, hand: 0.3},
	{id: 'G_ball', t: L.l07.start - 0.4, mode: 'in', torch: true, from: {p: [0.4, 1.6, -6.5], l: BALL_LOOK}, fov: 54, hand: 0.6},
	{id: 'H_turn', t: K.turn, mode: 'in', torch: true, from: {p: [0.4, 1.6, -6.5], l: BALL_LOOK}, to: {p: [0.4, 1.6, -6.5], l: BACK}, fov: 54, hand: 0.8},
	{id: 'I_reveal', t: K.reveal, mode: 'in', torch: true, from: {p: [0.4, 1.6, -6.5], l: BACK}, to: {p: [0.35, 1.58, -5.6], l: BACK}, fov: 46, hand: 0.5},
	{id: 'I2_empty', t: L.l08.start + 3.6, mode: 'in', torch: true, from: {p: [0.35, 1.58, -5.6], l: BACK}, to: {p: [0.3, 1.58, -5.2], l: [0.4, 1.2, 6]}, fov: 50, hand: 0.9},
	{id: 'J_off', t: L.l09.start - 0.3, mode: 'in', from: {p: [-2.4, 1.7, -1.3], l: [DESK[0] - 0.3, 0.95, DESK[2] - 0.4]}, to: {p: [-2.8, 1.65, -1.4], l: [DESK[0] - 0.3, 0.95, DESK[2] - 0.4]}, fov: 54, hand: 0.35},
	{id: 'L_ext', t: L.l10.start - 0.3, mode: 'out', from: A.from, fov: 50, hand: 0.15},
	{id: 'A_loop', t: K.loopOn, mode: 'out', ...A, fov: 50, hand: 0.15},
];
const shotAt = (t: number) => {
	let i = 0;
	for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].t) i = k;
	const s = SHOTS[i];
	if (s.id.startsWith('A_')) {
		const u = t >= K.loopOn ? t - DUR : t;
		return {s, k: lin(u, K.loopOn - DUR, SHOTS[1].t), u};
	}
	const end = SHOTS[i + 1]?.t ?? DUR;
	const k = s.id === 'H_turn' ? ease(lin(t, s.t, s.t + 0.9)) : ease(lin(t, s.t, end));
	return {s, k, u: t};
};

const camPose = (t: number) => {
	const r0 = shotAt(t);
	const sub = SUB(t);
	const s = sub ? SHOTS.find((x) => x.id === 'I_reveal')! : r0.s;
	const k = sub ? 0.3 : r0.k;
	const u = r0.u;
	const to = s.to ?? s.from;
	const p = mix3(s.from.p, to.p, k);
	const l = mix3(s.from.l, to.l, k);
	let roll = 0;
	if (s.hand) {
		const h = handheld(u, s.hand);
		p[0] += h.dp[0];
		p[1] += h.dp[1];
		p[2] += h.dp[2];
		roll = h.roll;
	}
	const jolt = STINGERS.reduce((a, kt) => a + (t >= kt && t < kt + 0.3 ? Math.sin((t - kt) * 60) * 0.02 * (1 - (t - kt) / 0.3) : 0), 0);
	p[1] += jolt;
	return {s, k, u, p, l, roll, sub};
};

const Cam: React.FC<{t: number}> = ({t}) => {
	const {camera} = useThree();
	const {s, p, l, roll} = camPose(t);
	camera.position.set(...p);
	camera.up.set(Math.sin(roll), Math.cos(roll), 0);
	camera.lookAt(...l);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = s.fov ?? 55;
	c.near = 0.03;
	c.far = 800;
	camera.updateProjectionMatrix();
	return null;
};

const FOG: Record<Mode, [string, number, number]> = {out: ['#0a0e18', 30, 220], in: ['#040508', 6, 30]};
const Atmos: React.FC<{mode: Mode}> = ({mode}) => {
	const {scene} = useThree();
	const [c, near, far] = FOG[mode];
	const bg = new THREE.Color(c);
	if (!scene.fog) scene.fog = new THREE.Fog(bg, near, far);
	const f = scene.fog as THREE.Fog;
	f.color.copy(bg);
	f.near = near;
	f.far = far;
	scene.background = bg;
	return null;
};

/** The guard's flashlight: a spotlight from (near) the camera, aimed where it looks. */
const Torch: React.FC<{p: V3; l: V3}> = ({p, l}) => {
	const light = React.useMemo(() => new THREE.SpotLight('#fff0d8', 10, 26, 0.4, 0.55, 1), []);
	light.position.set(p[0] + 0.15, p[1] - 0.15, p[2]);
	light.target.position.set(...l);
	light.intensity = 14;
	light.target.updateMatrixWorld();
	return (
		<>
			<primitive object={light} />
			<primitive object={light.target} />
		</>
	);
};

// ------------------------------------------------------------------ the world at time t
const World: React.FC<{t: number}> = ({t}) => {
	const {s, p, l, sub} = camPose(t);
	const mode = s.mode;
	const u = s.id.startsWith('A_') ? (t >= K.loopOn ? t - DUR : t) : 99;
	const lit = s.id.startsWith('A_') ? (u >= K.lightOn ? 1 : 0) : s.id === 'B_river' ? 1 : 0;
	const lamp = t < K.off;
	const door = s.id === 'D_door' ? 0 : 1;
	const chairRy = s.id === 'J_off' ? Math.PI / 2 : -Math.PI / 2;
	const ball = s.id === 'G_ball' || s.id === 'H_turn' || s.id === 'I_reveal' || s.id === 'I2_empty' ? ease(lin(t, K.ball, K.ball + 1.8)) : 0;
	const dust = s.id === 'E_ceiling' ? (t - s.t) : 0;
	const figure = s.id === 'I_reveal' || sub;
	const figZ = -1.4 + lin(t, K.reveal, L.l08.start + 3.6) * 2.6;
	return (
		<>
			<Atmos mode={mode} />
			{mode === 'out' && (
				<>
					<ambientLight intensity={2.8} color="#2e3650" />
					<directionalLight position={[30, 40, OUT_Z + 60]} intensity={2.2} color="#9aa8c8" />
					{lit > 0.5 && <pointLight position={[-3.6, 5.6, OUT_Z + 2]} intensity={3} distance={9} decay={1.0} color="#ffc880" />}
					{[-12, -4, 4, 12].map((x) => (
						<pointLight key={x} position={[x, 3.3, OUT_Z + 12.5]} intensity={1.6} distance={7} decay={1.0} color="#f0e0c0" />
					))}
				</>
			)}
			{mode === 'in' && (
				<>
					<ambientLight intensity={1.6} color="#1e2234" />
					{/* moonlight through the capiz windows of the hall */}
					<directionalLight position={[20, 14, -4]} intensity={1.4} color="#8a98c0" />
					{(figure || s.id === 'I2_empty') && <pointLight position={[1.4, 2.6, 0.2]} intensity={5} distance={6} decay={1.0} color="#a8b8e0" />}
					{s.torch && <Torch p={p} l={l} />}
					{lamp && <pointLight position={[DESK[0] - 0.2, 1.3, DESK[2] - 0.5]} intensity={4} distance={6} decay={1.0} color="#ffe0a0" />}
					{s.id === 'D_door' && lamp && <pointLight position={[-2.2, 0.15, -2]} intensity={1.6} distance={2.2} decay={1.0} color="#ffe0a0" />}
					{s.id === 'F_smoke' && <pointLight position={[-6.8, 2.4, -8]} intensity={3.5} distance={5} decay={1.0} color="#9aa8d0" />}
					{s.id === 'E_ceiling' && <pointLight position={[0.3, 1.0, -5.3]} intensity={2.4} distance={5} decay={1.0} color="#fff0d8" />}
				</>
			)}
			<MatsProvider>
				{mode === 'out' ? (
					<Exterior t={t} lit={lit} smoke={s.id === 'L_ext'} />
				) : (
					<>
						<Interior t={t} lamp={lamp} chairRy={chairRy} smoke={s.id === 'F_smoke'} ball={ball} dust={dust} door={door} />
						{s.id === 'E_ceiling' && <Guard t={t} position={[0.3, 0, -5.6]} ry={Math.PI} look={1} />}
						{s.id === 'J_off' && <Guard t={t} position={[DESK[0] + 0.9, 0, DESK[2] - 0.6]} ry={-Math.PI / 2 - 0.3} reach={lin(t, K.off - 1.0, K.off - 0.1)} />}
					</>
				)}
			</MatsProvider>
			{figure && <Headless t={t} habit="sotana" pose="walking" position={[0.1, 0, sub ? -1.2 : figZ]} rotation={[0, -0.75, 0]} />}
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: captions, tape
const Overlay: React.FC<{t: number; damage: number; captions: boolean}> = ({t, damage, captions}) => {
	const cap = useRef<HTMLCanvasElement>(null);
	const noise = useRef<HTMLCanvasElement>(null);
	useLayoutEffect(() => {
		// ---- captions (Taglish), every word shown, kept in the lower third
		const CW = 360, CH = 640;
		const g = cap.current!.getContext('2d')!;
		g.clearRect(0, 0, CW, CH);
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
			g.textAlign = 'center';
			show.forEach((r, i) => {
				const y = 478 + i * 19 - (show.length - 1) * 19;
				for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [2, 2]]) {
					g.fillStyle = '#000';
					g.fillText(r, CW / 2 + dx, y + dy);
				}
				g.fillStyle = '#ffffff';
				g.fillText(r, CW / 2, y);
			});
			const img = g.getImageData(0, 0, CW, CH);
			for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 120 ? 255 : 0;
			g.putImageData(img, 0, 0);
		}
		// ---- tape noise and the tracking band
		const n = noise.current!.getContext('2d')!;
		const ni = n.createImageData(LW, LH);
		const r = rng(Math.floor(t * 30) * 7919 + 5);
		const band = ((t * 30 * 2) % (LH + 60)) - 30;
		for (let y = 0; y < LH; y++) {
			const inBand = Math.abs(y - band) < 3 + damage * 12;
			for (let x = 0; x < LW; x++) {
				const i = (y * LW + x) * 4;
				const v = r() * 255;
				ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = v;
				ni.data[i + 3] = (inBand ? 40 + damage * 120 : 14 + damage * 60) * (r() < 0.5 ? 1 : 0.4);
			}
		}
		n.putImageData(ni, 0, 0);
	}, [t, damage, captions]);
	return (
		<>
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

const darkGrade = (t: number) => (t >= K.reveal && t < K.reveal + 1.2 ? 0.0 : 0.05);

// ------------------------------------------------------------------ assembly
export const Episode18: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const sub = SUB(t);
	const hit = STINGERS.reduce((a, kt) => Math.max(a, t >= kt && t < kt + 0.4 ? 1 - (t - kt) / 0.4 : 0), 0) + (sub ? 0.7 : 0);
	const damage = 0.05 + hit * 0.6;
	const ca = 0.6 + damage * 3;
	const shift = hit > 0.5 ? Math.round(Math.sin(t * 90) * 3) : 0;
	const g = darkGrade(t);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="tape18" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: shift, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'url(#tape18)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 55, near: 0.03, far: 800}} style={{imageRendering: 'pixelated'}}>
					<Cam t={t} />
					<World t={t} />
				</ThreeCanvas>
			</div>
			<AbsoluteFill style={{background: `rgba(6,10,18,${g})`}} />
			<Overlay t={t} damage={damage} captions={captions} />
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep18-palace-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
