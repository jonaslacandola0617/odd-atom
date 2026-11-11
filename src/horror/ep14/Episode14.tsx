// Episode 14: "The Guests of Dominican Hill" (reported legend: the old Diplomat Hotel on Dominican
// Hill, Baguio). Season 2 horror standard (docs/production/EPISODE_PLAYBOOK.md): a dark key lit by a
// flashlight (a spotlight that follows the camera), candles and fog; the legend withheld (a table set
// for dinner, knocking behind a door, plates and voices, a figure walking away down the corridor),
// then ONE clear, lit reveal: the flashlight dies, chairs scrape in the dark, and when it comes back a
// figure in a white habit is seated at the head of the table, with nothing above the collar.
// Taglish narration (Juanito), Taglish captions. Portrait 1080x1920, rendered at 180x320 and
// upscaled 6x, PS1 shaders, a light tape layer.
// Viral standard: a hook on frame 0 (the flashlight down the set table: "Sa Baguio, may hotel na
// bumababa pa rin ang mga bisita para maghapunan."); a seamless loop (the last 1.6 s replay the
// hook's move); hidden details (a place set at the head of the table only after the reveal; the door
// moving with the knocks; every chair pulled out after the reveal; three frames of the figure between
// lines; a candle lit in an upper window at dawn); an open question (who set the table?).
// Care: the wartime suffering at the site is real: shown only as people sheltering, with no harm.
// The beheadings are legend, and the narration says historians have no record of them. The figure
// has no wound: an absence, not gore. The site is a heritage park; no "go at night" framing.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep14-hill-v1-timeline.json';
import {rng} from '../ps1';
import {flicker, handheld, Headless} from '../entities';
import {Exterior, Interior, MatsProvider, Shelter, Table, TABLE_END} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep14Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => x * x * (3 - 2 * x);
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const sm = (t: number, a: number, b: number, v0 = 0, v1 = 1) => v0 + (v1 - v0) * ease(lin(t, a, b));
type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));

// key times, all from the real line times (scripts/ep14_sound.py reads the same rules)
export const K = {
	knock: L.l05.end + 0.12, // three knocks behind a door (in the gap)
	dark: L.l07.end + 0.3, // the flashlight flickers and dies
	reveal: L.l07.end + 1.75, // the light comes back on the figure (stinger in silence)
	after: L.l08.end + 0.35, // cut back: the chair empty, every chair pulled out
	sub: L.l05.end + 0.55, // three frames of the figure (between lines)
	loopOn: DUR - 1.6,
};
export const STINGERS = [K.reveal];
const SUB = (t: number) => t >= K.sub && t < K.sub + 0.1;

// ------------------------------------------------------------------ shot list
type Mode = 'hall' | 'night' | 'war' | 'dawn';
type Pose = {p: V3; l: V3};
type Shot = {id: string; t: number; from: Pose; to?: Pose; fov?: number; mode: Mode; hand?: number; torch?: boolean};
const A: {from: Pose; to: Pose} = {from: {p: [-5.6, 1.6, 1.5], l: [TABLE_END[0], 0.8, 0]}, to: {p: [-5.0, 1.58, 1.25], l: [TABLE_END[0], 0.8, 0]}};
const REVEAL: {from: Pose; to: Pose} = {from: {p: [2.2, 1.95, 1.7], l: [TABLE_END[0], 1.05, 0]}, to: {p: [2.9, 1.85, 1.35], l: [TABLE_END[0], 1.1, 0]}};
const SHOTS: Shot[] = [
	{id: 'A_hook', t: 0, mode: 'hall', ...A, fov: 54, hand: 0.6, torch: true},
	{id: 'B_hill', t: L.l01.end + 0.35, mode: 'night', from: {p: [-2, -2.3, 16], l: [-2, 4.5, 3]}, to: {p: [-2, -2.0, 14.5], l: [-2, 4.8, 3]}, fov: 58},
	{id: 'C_war', t: L.l03.start - 0.35, mode: 'war', from: {p: [-2.4, 1.2, -3.4], l: [-9, 0.6, -5.0]}, to: {p: [-2.8, 1.2, -3.45], l: [-9, 0.6, -5.0]}, fov: 54},
	{id: 'D_empty', t: L.l04.start - 0.35, mode: 'night', from: {p: [22, 3, 19], l: [-2, 3.5, 0]}, to: {p: [20, 3, 18], l: [-2, 3.5, 0]}, fov: 52},
	{id: 'E_corr', t: L.l05.start - 0.4, mode: 'hall', from: {p: [8.5, 1.6, -4.0], l: [-16, 1.2, -4.4]}, to: {p: [6.0, 1.6, -4.1], l: [-16, 1.2, -4.6]}, fov: 54, hand: 0.8, torch: true},
	{id: 'F_dining', t: L.l06.start - 0.4, mode: 'hall', from: {p: [-4.5, 1.6, -3.7], l: [-4.5, 1.2, -1]}, to: {p: [-4.4, 1.6, -2.3], l: [4.5, 0.8, 0]}, fov: 56, hand: 0.8, torch: true},
	{id: 'G_figure', t: L.l07.start - 0.3, mode: 'hall', from: {p: [-6, 1.6, -4.0], l: [9, 1.3, -4.3]}, to: {p: [-5.6, 1.6, -4.05], l: [9, 1.3, -4.3]}, fov: 50, hand: 0.5, torch: true},
	{id: 'H_dark', t: K.dark - 0.3, mode: 'hall', from: REVEAL.from, fov: 50, hand: 0.4, torch: true},
	{id: 'I_reveal', t: K.reveal, mode: 'hall', ...REVEAL, fov: 50, hand: 0.4, torch: true},
	{id: 'J_after', t: K.after, mode: 'hall', from: REVEAL.from, to: {p: [-2.9, 1.55, 1.25], l: [TABLE_END[0], 0.95, 0]}, fov: 50, hand: 0.4, torch: true},
	{id: 'K_dawn', t: L.l10.start - 0.3, mode: 'dawn', from: {p: [9, 0.4, 21], l: [-2, 5, 3]}, to: {p: [8, 0.6, 20], l: [-2, 5, 3]}, fov: 56},
	{id: 'A_loop', t: K.loopOn, mode: 'hall', ...A, fov: 54, hand: 0.6, torch: true},
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
	const k = sub ? 0.2 : r0.k;
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
	const jolt = STINGERS.reduce((a, kt) => a + (t >= kt && t < kt + 0.3 ? Math.sin((t - kt) * 60) * 0.025 * (1 - (t - kt) / 0.3) : 0), 0);
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
	c.far = 500;
	camera.updateProjectionMatrix();
	return null;
};

const FOG: Record<Mode, [string, number, number]> = {hall: ['#06070a', 5, 26], night: ['#20262e', 8, 70], war: ['#060504', 4, 18], dawn: ['#6e727c', 10, 90]};
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

/** The flashlight: a spotlight at the camera, aimed where the camera looks. */
const Torch: React.FC<{p: V3; l: V3; on: number}> = ({p, l, on}) => {
	const light = React.useMemo(() => {
		const s = new THREE.SpotLight('#fff0d8', 6, 22, 0.42, 0.6, 1);
		return s;
	}, []);
	light.position.set(p[0] + 0.15, p[1] - 0.12, p[2]);
	light.target.position.set(...l);
	light.intensity = 9 * on;
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
	// the flashlight: dies after "Mga pari. Mga madre.", black with chairs scraping, back for the reveal
	let on = 1;
	if (t >= K.dark && t < K.reveal) on = t < K.dark + 0.45 ? flicker(t, 14, 14, 1.0) * (1 - (t - K.dark) / 0.45) : 0;
	if (s.id === 'G_figure' && t > L.l07.end - 0.6) on *= flicker(t, 7, 10, 0.6);
	const figure = s.id === 'I_reveal' || sub;
	const pull = s.id === 'J_after' ? 1 : 0;
	const knock = t >= K.knock && t < K.knock + 1.2 ? Math.sin((t - K.knock) * 18) * (1 - (t - K.knock) / 1.2) : 0;
	const priestX = s.id === 'G_figure' ? 0.5 + lin(t, s.t, K.dark, 0, 2.5) : 0;
	return (
		<>
			<Atmos mode={mode} />
			{mode === 'hall' && (
				<>
					<ambientLight intensity={0.5} color="#22283a" />
					{/* fog-light through the tall openings */}
					<directionalLight position={[2, 6, 20]} intensity={0.45} color="#8a96b0" />
					{s.torch && <Torch p={p} l={l} on={on} />}
					{/* the open end of the corridor: cold fog-light, so whatever walks there is a silhouette */}
					{s.id === 'G_figure' && <pointLight position={[11.5, 1.8, -4.2]} intensity={4} distance={9} decay={1.0} color="#9aa8c8" />}
					{/* the candles on the table (dark for the black) */}
					<pointLight position={[0, 1.3, 0]} intensity={(t >= K.dark && t < K.reveal ? 0 : 1.2)} distance={5} decay={1.0} color="#ffb060" />
				</>
			)}
			{mode === 'war' && (
				<>
					<ambientLight intensity={0.3} color="#1a1a22" />
					{[-9.2, -6.0, -3.2].map((x) => (
						<pointLight key={x} position={[x, 0.4, -4.3]} intensity={1.4 * (0.9 + 0.1 * Math.sin(t * 11 + x))} distance={3.5} decay={1.0} color="#ffa850" />
					))}
				</>
			)}
			{mode === 'night' && (
				<>
					<ambientLight intensity={1.0} color="#3a4458" />
					<directionalLight position={[-40, 60, 50]} intensity={0.7} color="#a8b4cc" />
				</>
			)}
			{mode === 'dawn' && (
				<>
					<ambientLight intensity={1.8} color="#7a7c88" />
					<directionalLight position={[60, 20, 40]} intensity={1.1} color="#ffd8b0" />
				</>
			)}
			<MatsProvider>
				{mode === 'night' || mode === 'dawn' ? (
					<Exterior t={t} candleUp={mode === 'dawn'} />
				) : (
					<>
						<Interior doorKnock={knock} />
						<Table pull={pull} candles={mode === 'hall'} extra={figure || pull > 0} />
						{mode === 'war' && <Shelter />}
					</>
				)}
				{figure && <Headless t={t} habit="nun" pose="seated" position={[TABLE_END[0], 0.02, 0]} rotation={[0, -Math.PI / 2, 0]} />}
				{s.id === 'G_figure' && <Headless t={t} habit="priest" pose="walking" position={[priestX, 0, -4.3]} rotation={[0, Math.PI / 2, 0]} />}
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

const darkGrade = (t: number) => (t >= K.reveal && t < K.reveal + 1.0 ? 0.0 : 0.05);

// ------------------------------------------------------------------ assembly
export const Episode14: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
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
				<filter id="tape14" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: shift, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'url(#tape14)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 55, near: 0.03, far: 400}} style={{imageRendering: 'pixelated'}}>
					<Cam t={t} />
					<World t={t} />
				</ThreeCanvas>
			</div>
			<AbsoluteFill style={{background: `rgba(6,10,18,${g})`}} />
			<Overlay t={t} damage={damage} captions={captions} />
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep14-hill-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
