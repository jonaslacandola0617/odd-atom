// Episode 13: "Half of Her" (folklore: the manananggal of the Visayas). Season 2 horror standard
// (docs/production/EPISODE_PLAYBOOK.md): a dark key lit by the moon and one gasera; the creature
// withheld (a pair of legs in the banana grove, a winged shape across the moon, a shadow on the
// capiz, a flame leaning towards the roof, a tongue between the thatch), then ONE clear, lit reveal
// (her face in the broken capiz pane, wings spread outside, lit by the lamp) after a held silence.
// Taglish narration (Juanito), Taglish captions. Portrait 1080x1920, rendered at 180x320 and
// upscaled 6x, PS1 shaders, a light tape layer.
// Viral standard: a hook on frame 0 (the legs standing in the grove: "Kapag may nakita kang
// kalahating babae na nakatayo sa sagingan, huwag kang sisigaw. Hanapin mo ang asin."); a seamless
// loop (the last 1.6 s replay the hook's move); hidden details (the legs in frame 0; the neighbour
// by day wears the same patadyong; garlic by the door with one bulb missing; the broken capiz panes
// from the first inside shot; the legs fallen at dawn); an open question (which neighbour didn't
// come to Mass that Sunday?).
// Care: no named town, no Capiz; the pregnant woman and her baby are never harmed (the tongue never
// reaches her; she is asleep and safe at dawn); the waist is a clean black void, never gore; the
// manananggal's end is off-screen, as sound.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep13-half-v1-timeline.json';
import {rng} from '../ps1';
import {Aswang, handheld, Manananggal, Tongue, Villager} from '../entities';
import {Barrio, CAPIZ, DOOR, FLOOR, HUSBAND, Hut, LAMP, LEGS, MatsProvider, WIFE} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep13Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => x * x * (3 - 2 * x);
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const sm = (t: number, a: number, b: number, v0 = 0, v1 = 1) => v0 + (v1 - v0) * ease(lin(t, a, b));
type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));

// key times, all from the real line times (scripts/ep13_sound.py reads the same rules)
const mid = (l: {start: number; end: number}) => (l.start + l.end) / 2;
export const K = {
	split: L.l04.start + 0.6, // the upper half lifts away
	lean: mid(L.l06) + 0.3, // the gasera flame leans towards the roof
	silence: L.l07.end + 0.25,
	reveal: L.l07.end + 1.6, // her face in the broken capiz (stinger in silence)
	run: L.l08.start - 0.25,
	pour: L.l08.end - 1.6,
	scream: L.l09.end + 0.35, // far off, in the gap before the last line (off-screen)
	dawn: L.l10.start - 0.4,
	loopOn: DUR - 1.6,
};
export const STINGERS = [K.reveal];
// three subliminal frames of her face at the capiz, between two lines (never on a word)
const SUB = (t: number) => t >= L.l06.end + 0.35 && t < L.l06.end + 0.45;

// ------------------------------------------------------------------ shot list
type Mode = 'night' | 'day' | 'predawn' | 'dawn' | 'inside' | 'black';
type Pose = {p: V3; l: V3};
type Shot = {id: string; t: number; from: Pose; to?: Pose; fov?: number; mode: Mode; hand?: number; path?: V3[]};
const LG = (dy: number): V3 => [LEGS[0], LEGS[1] + dy, LEGS[2]];
const A: {from: Pose; to: Pose} = {from: {p: [-8.4, 1.05, 10.3], l: LG(0.7)}, to: {p: [-8.0, 1.0, 9.7], l: LG(0.7)}};
const NEIGHBOUR_W: V3 = [6.4, 0, 3.6];
const SHOTS: Shot[] = [
	{id: 'A_hook', t: 0, mode: 'night', ...A, fov: 52},
	{id: 'B_barrio', t: L.l01.end + 0.35, mode: 'night', from: {p: [11, 6.5, 15], l: [-2, 1.2, 0]}, to: {p: [10, 6.0, 14], l: [-2, 1.2, 0]}, fov: 56},
	{id: 'C_day', t: L.l03.start - 0.3, mode: 'day', from: {p: [3.6, 1.5, 8.2], l: [NEIGHBOUR_W[0], 1.2, NEIGHBOUR_W[2]]}, to: {p: [3.9, 1.5, 7.6], l: [NEIGHBOUR_W[0], 1.25, NEIGHBOUR_W[2]]}, fov: 46},
	{id: 'D_split', t: L.l04.start - 0.4, mode: 'night', from: {p: [-4.6, 0.45, 9.6], l: [-8.2, 2.6, 3.6]}, to: {p: [-4.7, 0.45, 9.5], l: [-8.3, 3.0, 3.5]}, fov: 62, hand: 0.4},
	{id: 'E_fly', t: L.l05.start - 0.4, mode: 'night', from: {p: [2.5, 1.6, 9.5], l: [-1, 3.2, 0]}, to: {p: [2.3, 1.6, 9.0], l: [-1, 3.0, 0]}, fov: 58},
	{id: 'E_inside', t: mid(L.l05) + 0.4, mode: 'inside', from: {p: [1.7, FLOOR + 1.45, 1.25], l: [-0.1, FLOOR + 0.25, -0.6]}, to: {p: [1.6, FLOOR + 1.42, 1.15], l: [-0.1, FLOOR + 0.25, -0.6]}, fov: 66},
	{id: 'F_capiz', t: L.l06.start - 0.5, mode: 'inside', from: {p: [-0.6, FLOOR + 1.2, 0.5], l: [CAPIZ[0], CAPIZ[1], CAPIZ[2]]}, to: {p: [-0.75, FLOOR + 1.22, 0.4], l: [CAPIZ[0], CAPIZ[1], CAPIZ[2]]}, fov: 50},
	{id: 'F_lamp', t: K.lean - 0.6, mode: 'inside', from: {p: [-0.05, FLOOR + 0.32, 0.75], l: [LAMP[0], LAMP[1] + 0.2, LAMP[2]]}, to: {p: [-0.1, FLOOR + 0.35, 0.7], l: [LAMP[0], LAMP[1] + 0.35, LAMP[2]]}, fov: 50},
	{id: 'G_down', t: L.l07.start - 0.3, mode: 'inside', from: {p: [0.9, FLOOR + 0.75, -0.2], l: [HUSBAND[0], HUSBAND[1] + 0.55, HUSBAND[2]]}, to: {p: [0.8, FLOOR + 0.75, -0.3], l: [HUSBAND[0], HUSBAND[1] + 0.6, HUSBAND[2]]}, fov: 54, hand: 0.3},
	{id: 'G_tongue', t: K.silence, mode: 'inside', from: {p: [WIFE[0] - 0.95, FLOOR + 0.45, WIFE[2] + 0.55], l: [WIFE[0] - 0.1, FLOOR + 1.9, WIFE[2]]}, to: {p: [WIFE[0] - 0.9, FLOOR + 0.45, WIFE[2] + 0.5], l: [WIFE[0] - 0.1, FLOOR + 1.6, WIFE[2]]}, fov: 58, hand: 0.5},
	{id: 'H_reveal', t: K.reveal, mode: 'inside', from: {p: [-1.25, FLOOR + 1.24, 0.14], l: [CAPIZ[0], CAPIZ[1], CAPIZ[2] + 0.01]}, to: {p: [-1.45, FLOOR + 1.25, 0.12], l: [CAPIZ[0], CAPIZ[1], CAPIZ[2] + 0.01]}, fov: 48},
	{id: 'I_run', t: K.run, mode: 'night', from: {p: [DOOR[0], FLOOR + 1.2, DOOR[2] + 0.4], l: [-3.5, 1.0, 5.5]}, to: {p: [-5.9, 1.3, 7.4], l: LG(0.6)}, fov: 64, hand: 2.2, path: [[DOOR[0], FLOOR + 1.2, DOOR[2] + 0.4], [DOOR[0], 1.3, DOOR[2] + 1.6], [-3.5, 1.4, 5.0], [-5.9, 1.3, 7.4]]},
	{id: 'I_pour', t: K.pour, mode: 'night', from: {p: [-5.6, 1.75, 8.2], l: LG(0.55)}, to: {p: [-5.7, 1.7, 8.0], l: LG(0.55)}, fov: 58, hand: 0.6},
	{id: 'J_wait', t: L.l09.start - 0.2, mode: 'predawn', from: {p: [-3.0, 1.2, 11.5], l: [-6.5, 2.5, 4.0]}, to: {p: [-3.2, 1.2, 11.2], l: [-6.5, 2.8, 4.0]}, fov: 58},
	{id: 'K_dawn', t: K.dawn, mode: 'dawn', from: {p: [-4.3, 0.7, 7.8], l: LG(0.15)}, to: {p: [-4.5, 0.65, 7.7], l: LG(0.15)}, fov: 56},
	{id: 'K_wife', t: L.l10.end + 0.1, mode: 'inside', from: {p: [1.6, FLOOR + 1.3, 1.1], l: [WIFE[0] - 0.3, FLOOR + 0.15, WIFE[2]]}, fov: 58},
	{id: 'A_loop', t: K.loopOn, mode: 'night', ...A, fov: 52},
];
const DAWN_INSIDE = (id: string) => id === 'K_wife';
const shotAt = (t: number) => {
	let i = 0;
	for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].t) i = k;
	const s = SHOTS[i];
	if (s.id.startsWith('A_')) {
		const u = t >= K.loopOn ? t - DUR : t;
		return {s, k: lin(u, K.loopOn - DUR, SHOTS[1].t), u};
	}
	const end = SHOTS[i + 1]?.t ?? DUR;
	return {s, k: s.path ? lin(t, s.t, end) : ease(lin(t, s.t, end)), u: t};
};
const along = (path: V3[], k: number): V3 => {
	const n = path.length - 1;
	const x = Math.min(n - 1e-6, k * n);
	const i = Math.floor(x);
	return mix3(path[i], path[i + 1], x - i);
};
const camPose = (t: number) => {
	const r0 = shotAt(t);
	const sub = SUB(t);
	const s = sub ? SHOTS.find((x) => x.id === 'H_reveal')! : r0.s;
	const k = sub ? 0.6 : r0.k;
	const u = r0.u;
	const to = s.to ?? s.from;
	const p = s.path ? along(s.path, k) : mix3(s.from.p, to.p, k);
	const l = mix3(s.from.l, to.l, s.path ? ease(k) : k);
	let roll = 0;
	if (s.hand) {
		const h = handheld(t * (s.path ? 2.2 : 1), s.hand);
		p[0] += h.dp[0];
		p[1] += h.dp[1] + (s.path ? Math.abs(Math.sin(t * 9)) * 0.05 : 0);
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
	c.far = 500;
	camera.updateProjectionMatrix();
	return null;
};

const FOG: Record<Mode, [string, number, number]> = {night: ['#080c16', 12, 70], inside: ['#060608', 6, 30], day: ['#a8b8c8', 30, 160], predawn: ['#2a3448', 12, 70], dawn: ['#7a7a88', 14, 90], black: ['#000000', 1, 2]};
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

// ------------------------------------------------------------------ the world at time t
const World: React.FC<{t: number}> = ({t}) => {
	const {s, sub} = camPose(t);
	const mode = DAWN_INSIDE(s.id) ? 'dawn' : s.mode;
	const inside = s.mode === 'inside';
	const night = mode === 'night' || mode === 'inside';
	const lampOn = DAWN_INSIDE(s.id) ? 0 : t >= K.silence && t < K.reveal ? 0.35 : 1;
	const lean = s.id === 'F_lamp' ? sm(t, K.lean - 0.3, K.lean + 0.6, 0, 0.9) : t >= K.lean && t < K.run ? 0.6 : 0;
	const rise = s.id === 'D_split' ? sm(t, K.split, K.split + 3.0) : 0;
	const flapK = Math.sin(t * 6.5);
	const salt = t >= K.pour ? sm(t, K.pour + 0.2, K.pour + 1.3) : 0;
	// the upper half: rising in the grove; crossing the moon; outside the capiz; returning at predawn
	let upper: React.ReactNode = null;
	if (s.id === 'D_split') upper = <Manananggal t={t} mode="upper" flap={rise > 0.3 ? flapK * 0.8 : -0.9 + rise * 2} position={[LEGS[0], LEGS[1] + 0.95 + rise * 1.6, LEGS[2]]} rotation={[0, 0.6, 0]} />;
	if (s.id === 'E_fly') {
		const k = lin(t, L.l05.start - 0.2, mid(L.l05) + 0.4);
		upper = <Manananggal t={t} mode="upper" flap={flapK} position={[-14 + k * 14, 7.5 - k * 3.2, -4 + k * 2]} rotation={[0.5, Math.PI / 2, 0]} scale={1.3} />;
	}
	if (s.id === 'H_reveal' || sub)
		upper = (
			<>
				{/* the body and wings stay outside, dark behind the capiz */}
				<Manananggal t={t} mode="upper" flap={0.25} position={[CAPIZ[0] - 0.75, CAPIZ[1] - 0.95, CAPIZ[2] + 0.01]} rotation={[0, -Math.PI / 2, 0]} scale={1.2} />
				{/* her face in the broken panes, turned into the room, lit by the lamp */}
				<Aswang t={t} faceOnly smile={sub ? 0.8 : sm(t, K.reveal, K.reveal + 0.6, 0.5, 1)} eyes={1.1} position={[CAPIZ[0] - 0.05, FLOOR + 1.27, CAPIZ[2] + 0.01]} rotation={[0, Math.PI / 2, 0.25]} scale={1.15} />
			</>
		);
	if (s.id === 'J_wait') {
		const k = lin(t, L.l09.start, L.l09.end + 0.3);
		upper = <Manananggal t={t} mode="upper" flap={flapK} position={[-2 - k * 5, 8 - k * 4.5, -2 + k * 7]} rotation={[0.4, -Math.PI * 0.75, 0]} scale={1.2} />;
	}
	// the wing shadow sweeping across the capiz from outside
	const shadowK = s.id === 'F_capiz' ? lin(t, L.l06.start + 0.2, L.l06.start + 1.6) : -1;
	return (
		<>
			<Atmos mode={mode} />
			{mode === 'night' && (
				<>
					<ambientLight intensity={3.2} color="#34405e" />
					<directionalLight position={[-60, 50, -85]} intensity={2.2} color="#a8bce0" />
					{/* moonlight pooling in the clearing of the grove where the legs stand */}
					<pointLight position={[LEGS[0] + 0.5, 4.5, LEGS[2] + 1]} intensity={5} distance={9} decay={1.0} color="#9ab0e0" />
					{/* the hut's window glow on the yard */}
					<pointLight position={[-2.6, FLOOR + 1.2, 0.1]} intensity={2} distance={7} decay={1.0} color="#e0a050" />
				</>
			)}
			{mode === 'inside' && (
				<>
					<ambientLight intensity={0.8} color="#2a2e44" />
					<pointLight position={[LAMP[0], LAMP[1] + 0.35, LAMP[2]]} intensity={3.6 * lampOn * (0.92 + 0.08 * Math.sin(t * 17))} distance={6} decay={1.0} color="#ffb860" />
					<directionalLight position={[-20, 15, 2]} intensity={0.4} color="#8aa0d0" />
					{/* in the silence the lamp is low: a little moonlight between the thatch shows what comes down */}
					{s.id === 'G_tongue' && <pointLight position={[WIFE[0] - 0.5, FLOOR + 1.5, WIFE[2] + 0.5]} intensity={3.5} distance={2.2} decay={1.0} color="#c0a080" />}
					{/* the reveal: the lamp light reaching her face through the broken panes */}
					{(s.id === "H_reveal" || sub) && <pointLight position={[CAPIZ[0] + 0.35, CAPIZ[1] - 0.65, CAPIZ[2]]} intensity={2.0} distance={1.5} decay={1.0} color="#ffc070" />}
				</>
			)}
			{mode === 'day' && (
				<>
					<ambientLight intensity={2.4} color="#b8c0c8" />
					<directionalLight position={[40, 60, 20]} intensity={1.6} color="#fff0d0" />
				</>
			)}
			{mode === 'predawn' && (
				<>
					<ambientLight intensity={3.4} color="#4a5672" />
					<directionalLight position={[60, 20, -40]} intensity={1.4} color="#d8a8a0" />
				</>
			)}
			{mode === 'dawn' && (
				<>
					<ambientLight intensity={4.0} color="#8a8a98" />
					<directionalLight position={[60, 12, 30]} intensity={2.2} color="#ffd0a0" />
				</>
			)}
			<MatsProvider>
				<Hut t={t} flameLean={lean} lampOn={lampOn} />
				{!inside || s.id === 'K_wife' ? <Barrio salt={salt} /> : <Barrio salt={0} />}
				{/* the lower half stands in the grove (fallen at dawn) */}
				<Manananggal t={t} mode="lower" fallen={mode === 'dawn' ? 1 : 0} position={LEGS} rotation={[0, 0.5, 0]} />
				{/* by day: the neighbour at her gate, waving, in the same patadyong */}
				{mode === 'day' && <Manananggal t={t} mode="whole" wave={sm(t, L.l03.start, L.l03.start + 0.6)} position={NEIGHBOUR_W} rotation={[0, -0.7, 0]} />}
				{upper}
				{shadowK >= 0 && shadowK <= 1 && (
					<mesh position={[CAPIZ[0] - 0.12, CAPIZ[1] + 0.4 - shadowK * 0.9, CAPIZ[2] - 0.9 + shadowK * 1.8]} rotation={[0, Math.PI / 2, 0.5]}>
						<planeGeometry args={[1.6, 0.6]} />
						<meshBasicMaterial color="#000000" side={THREE.DoubleSide} />
					</mesh>
				)}
				{s.id === 'G_tongue' && (
					<group position={[WIFE[0] - 0.1, FLOOR + 2.75, WIFE[2]]} scale={[1.8, 1, 1.8]}>
						<Tongue t={t} len={sm(t, K.silence + 0.1, K.reveal - 0.1, 0.2, 1.5)} />
					</group>
				)}
				{/* the husband: sitting against the back wall with a bolo; looking up for the reveal; asleep at dawn */}
				{inside && <Villager pose="sit" bolo look={s.id === 'H_reveal' ? 0.15 : s.id === 'G_down' ? -0.3 : DAWN_INSIDE(s.id) ? -0.5 : 0} position={HUSBAND} rotation={[0, 0.25, 0]} />}
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

const darkGrade = (t: number) => (t >= K.reveal && t < K.reveal + 1.0 ? 0.0 : t >= K.silence && t < K.reveal ? 0.18 : 0.06);

// ------------------------------------------------------------------ assembly
export const Episode13: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
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
				<filter id="tape13" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: shift, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'url(#tape13)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 55, near: 0.03, far: 400}} style={{imageRendering: 'pixelated'}}>
					<Cam t={t} />
					<World t={t} />
				</ThreeCanvas>
			</div>
			<AbsoluteFill style={{background: `rgba(6,10,18,${g})`}} />
			<Overlay t={t} damage={damage} captions={captions} />
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep13-half-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
