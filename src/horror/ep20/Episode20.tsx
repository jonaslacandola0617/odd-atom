// Episode 20: "The Theatre by the Bay" (a reported legend over a real accident: the Manila Film
// Center, 1981). The Season 2 finale. Season 2 horror standard (docs/production/EPISODE_PLAYBOOK.md):
// a dark key lit by a guard's flashlight, work lights and searchlights; the legend withheld (a seat
// folding down by itself, the empty scaffold swaying, a hard hat left on a plank, footsteps on the
// stairs, seats folding down one by one as if people are taking them), then ONE clear reveal: the
// flashlight sweeps the rows and every seat is down, with rows of dust-grey figures sitting in the
// dark, all facing the stage, seen only from behind; one turns its head. Lights out; a hard hat on a
// seat, then gone.
// Taglish narration (Juanito), Taglish captions. Portrait 1080x1920, rendered at 180x320 and
// upscaled 6x, PS1 shaders, a light tape layer.
// Viral standard: a hook on frame 0 (the flashlight on the rows of folded seats; one folds down:
// "Sa teatrong ito, laging may nakaupo sa mga bakanteng upuan."); a seamless loop (the last 1.6 s
// replay the hook); hidden details (a site clock at 3:00 in 1981 and a clock at 3:00 in the theatre;
// one seat already down at frame 0; a hard hat on a seat in the dark wide; dust handprints on the
// stage edge; three frames of the figures); an open question (how many were there?).
// Care: a real accident with real dead and grieving families. No worker is shown, falling, trapped
// or dead, at any time; the 1981 shots are an empty scaffold and an empty site. The figures are
// dust-grey backs, never faces, never wounds. The toll is told as disputed; entombment is legend. No
// living person is named; nothing political. The last line honours the workers.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep20-theatre-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {Building, COLS, DOWN_SEAT, DustFigure, HardHat, HAT_SEAT, HOOK_SEAT, Lobby, LOBBY, MatsProvider, ROWS, seatPos, Theatre, THEATRE} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep20Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => x * x * (3 - 2 * x);
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const TH = (x: number, y: number, z: number): V3 => [THEATRE[0] + x, y, THEATRE[2] + z];
const LB = (x: number, y: number, z: number): V3 => [LOBBY[0] + x, y, LOBBY[2] + z];

// key times, all from the real line times (scripts/ep20_sound.py reads the same rules)
export const K = {
	fold: 1.2, // the hook seat folds down (hook time u; again just after the loop seam)
	black: L.l04.end + 0.15, // the scaffold scene cuts to black
	site: L.l05.start + 0.5, // the dark, empty site; a hard hat on a plank
	sub: L.l06.end + 0.25, // three frames of the figures (between lines)
	folds: L.l08.start, // seats begin folding down, one by one
	reveal: L.l08.end + 1.5, // the beam sweeps the rows (stinger in silence)
	turn: L.l08.end + 2.6, // one turns its head
	out: L.l09.end + 0.3, // lights out
	hatGone: L.l10.start + 2.2, // the hard hat on the seat is gone
	loopOn: DUR - 1.6,
};
export const STINGERS = [K.reveal];
const SUB = (t: number) => t >= K.sub && t < K.sub + 0.1;

// ------------------------------------------------------------------ shot list
type Mode = 'theatre' | 'ext' | 'lobby' | 'black';
type Pose = {p: V3; l: V3};
type Shot = {id: string; t: number; from: Pose; to?: Pose; fov?: number; mode: Mode; hand?: number; torch?: boolean; era?: 'now' | '1981' | 'festival'};
const A: {from: Pose; to: Pose} = {from: {p: TH(7.2, 3.6, 9.5), l: TH(1.5, 0.9, 4.2)}, to: {p: TH(7.1, 3.55, 9.1), l: TH(1.5, 0.9, 4.0)}};
const BACK: V3 = TH(0.3, 5.0, 12.9);
const SHOTS: Shot[] = [
	{id: 'A_hook', t: 0, mode: 'theatre', torch: true, ...A, fov: 52, hand: 0.5},
	{id: 'B_ext', t: L.l01.end + 0.3, mode: 'ext', era: 'now', from: {p: [14, 3, 55], l: [0, 8, -10]}, to: {p: [12.5, 3.2, 51], l: [0, 8.5, -10]}, fov: 50},
	{id: 'C_1981', t: L.l03.start - 0.3, mode: 'ext', era: '1981', from: {p: [12, 3.5, 22], l: [4, 5.5, -4]}, to: {p: [11, 3.6, 20], l: [4, 6, -4]}, fov: 52, hand: 0.3},
	{id: 'D_sway', t: L.l04.start - 0.3, mode: 'ext', era: '1981', from: {p: [5, 5, 11], l: [0, 9, -4]}, to: {p: [4.5, 5.2, 10], l: [0, 10, -4]}, fov: 52, hand: 0.4},
	{id: 'D2_black', t: K.black, mode: 'black', from: {p: [0, 1, 0], l: [0, 1, -1]}},
	{id: 'E_site', t: K.site, mode: 'ext', era: '1981', from: {p: [-0.6, 7.1, 0.8], l: [-2.2, 6.1, -2.9]}, to: {p: [-0.9, 6.9, 0.2], l: [-2.2, 6.1, -2.9]}, fov: 50, hand: 0.3},
	{id: 'F_fest', t: L.l05.end + 0.3, mode: 'ext', era: 'festival', from: {p: [3, 1.3, 22], l: [0, 7, 0]}, to: {p: [2.5, 1.3, 19], l: [0, 7.5, 0]}, fov: 54},
	{id: 'G_stair', t: L.l07.start - 0.3, mode: 'lobby', torch: true, from: {p: LB(0.5, 1.7, 3.0), l: LB(0, 3.3, -9)}, to: {p: LB(0.4, 1.7, 1.6), l: LB(0, 3.6, -9)}, fov: 54, hand: 0.6},
	{id: 'H_seats', t: L.l08.start - 0.3, mode: 'theatre', torch: true, from: {p: TH(7.2, 3.4, 8.6), l: TH(2.0, 1.2, 6.0)}, to: {p: TH(7.1, 3.4, 8.3), l: TH(1.0, 1.2, 6.0)}, fov: 54, hand: 0.6},
	{id: 'I_dark', t: L.l08.end + 0.3, mode: 'theatre', torch: true, from: {p: BACK, l: TH(-5.5, 0.6, 0.2)}, to: {p: BACK, l: TH(-3, 0.6, 0.2)}, fov: 52, hand: 0.5},
	{id: 'I_reveal', t: K.reveal, mode: 'theatre', torch: true, from: {p: BACK, l: TH(-1.5, 1.5, 6)}, to: {p: TH(0.3, 4.8, 12.3), l: TH(0.5, 1.4, 6)}, fov: 52, hand: 0.4},
	{id: 'J_out', t: K.out, mode: 'black', from: {p: [0, 1, 0], l: [0, 1, -1]}},
	{id: 'J_hat', t: K.out + 0.5, mode: 'theatre', from: {p: TH(6.6, 2.9, 7.2), l: [seatPos(HAT_SEAT[0], HAT_SEAT[1])[0], 1.6, 5.8]}, to: {p: TH(6.3, 2.8, 7.0), l: [seatPos(HAT_SEAT[0], HAT_SEAT[1])[0], 1.6, 5.8]}, fov: 50},
	{id: 'A_loop', t: K.loopOn, mode: 'theatre', torch: true, ...A, fov: 52, hand: 0.5},
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
	return {s, k: ease(lin(t, s.t, end)), u: t};
};

const camPose = (t: number) => {
	const r0 = shotAt(t);
	const sub = SUB(t);
	const s = sub ? SHOTS.find((x) => x.id === 'I_reveal')! : r0.s;
	const k = sub ? 0.4 : r0.k;
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
	c.far = 900;
	camera.updateProjectionMatrix();
	return null;
};

const FOG: Record<Mode, [string, number, number]> = {theatre: ['#040304', 8, 30], ext: ['#080a12', 30, 300], lobby: ['#040405', 6, 26], black: ['#000000', 0.1, 0.2]};
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

/** The guard's flashlight: a spotlight from the camera, aimed where it looks. */
const Torch: React.FC<{p: V3; l: V3; wide?: boolean}> = ({p, l, wide = false}) => {
	const light = React.useMemo(() => new THREE.SpotLight('#fff0d8', 10, 30, 0.42, 0.55, 1), []);
	light.position.set(p[0] + 0.12, p[1] - 0.12, p[2]);
	light.target.position.set(...l);
	light.intensity = wide ? 9 : 16;
	light.angle = wide ? 0.6 : 0.42;
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
	const {s, p, l, sub, u} = camPose(t);
	const mode = s.mode;
	if (mode === 'black') return <Atmos mode="black" />;
	const reveal = s.id === 'I_reveal' || sub;
	// which seats are down
	const folded = Math.floor(lin(t, K.folds, L.l08.end + 0.2) * 12);
	const down = (r: number, c: number) => {
		if (reveal) return 1;
		if (r === DOWN_SEAT[0] && c === DOWN_SEAT[1]) return 1;
		if (s.id === 'J_hat' && r === HAT_SEAT[0] && c === HAT_SEAT[1]) return 1;
		if (s.id.startsWith('A_') && r === HOOK_SEAT[0] && c === HOOK_SEAT[1]) return ease(lin(u, K.fold, K.fold + 0.18));
		if (s.id === 'H_seats' && r === 4 && c >= 13 - folded) return 1;
		if (s.id === 'H_seats' && r === 4 && c === 13 - folded - 1) return ease(lin((t - K.folds) % ((L.l08.end + 0.2 - K.folds) / 12), 0, 0.12));
		if (s.id === 'H_seats' && r === 4 && c === 12) return 1;
		return 0;
	};
	const sway = s.id === 'D_sway' ? Math.sin(t * 3.1) * 0.006 * lin(t, s.t, K.black) * 3 : s.id === 'C_1981' ? Math.sin(t * 1.3) * 0.002 : 0;
	const workLights = s.id === 'C_1981' || s.id === 'D_sway';
	return (
		<>
			<Atmos mode={mode} />
			{mode === 'theatre' && (
				<>
					<ambientLight intensity={1.0} color="#1c1418" />
					<pointLight position={TH(7.4, 3.3, 11)} intensity={1.6} distance={6} decay={1.0} color="#40ff70" />
					{s.torch && <Torch p={p} l={l} wide={reveal} />}
					{s.id === 'J_hat' && <pointLight position={TH(3.4, 2.8, 6.6)} intensity={t < K.hatGone ? 6 : 2} distance={6} decay={1.0} color="#a8b0c8" />}
				</>
			)}
			{mode === 'lobby' && (
				<>
					<ambientLight intensity={1.0} color="#181a22" />
					{s.torch && <Torch p={p} l={l} />}
				</>
			)}
			{mode === 'ext' && (
				<>
					<ambientLight intensity={1.3} color="#222840" />
					<directionalLight position={[60, 80, 120]} intensity={0.8} color="#9aa8c8" />
					{workLights && [-12, 0, 12].map((x) => <pointLight key={x} position={[x, 7.1, 5.6]} intensity={3.5} distance={18} decay={1.0} color="#fff0d0" />)}
					{s.id === 'E_site' && <pointLight position={[-1.0, 7.4, 0.4]} intensity={1.6} distance={5} decay={1.0} color="#a8b8d8" />}
					{s.id === 'F_fest' && <pointLight position={[0, 3, 8]} intensity={5} distance={16} decay={1.0} color="#ffe0c0" />}
				</>
			)}
			<MatsProvider>
				{mode === 'ext' && <Building t={t} era={s.era ?? 'now'} sway={sway} hat={s.id === 'E_site'} />}
				{mode === 'lobby' && <Lobby />}
				{mode === 'theatre' && (
					<>
						<Theatre down={down} prints />
						{reveal &&
							Array.from({length: ROWS}, (_, r) =>
								Array.from({length: COLS}, (_, c) => {
									if ((r * 7 + c * 3) % 5 === 0 && !(r === 4 && c === 7)) return null; // a few seats stay empty
									const sp = seatPos(r, c);
									const turn = r === 4 && c === 7 ? ease(lin(t, K.turn, K.turn + 0.8)) * 0.7 : 0;
									return <DustFigure key={`${r}-${c}`} position={[sp[0], sp[1], sp[2]]} turn={turn} seed={r * COLS + c} />;
								}),
							)}
						{s.id === 'J_hat' && t < K.hatGone && <HardHat position={[seatPos(HAT_SEAT[0], HAT_SEAT[1])[0], seatPos(HAT_SEAT[0], HAT_SEAT[1])[1] + 0.47, seatPos(HAT_SEAT[0], HAT_SEAT[1])[2] - 0.2]} ry={0.4} />}
					</>
				)}
			</MatsProvider>
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
export const Episode20: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
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
				<filter id="tape20" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: shift, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'url(#tape20)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 55, near: 0.03, far: 900}} style={{imageRendering: 'pixelated'}}>
					<Cam t={t} />
					<World t={t} />
				</ThreeCanvas>
			</div>
			<AbsoluteFill style={{background: `rgba(6,10,18,${g})`}} />
			<Overlay t={t} damage={damage} captions={captions} />
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep20-theatre-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
