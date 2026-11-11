// Episode 12: "Tik-Tik" (original, built on the Philippine tiktik belief: the fainter the sound, the
// closer it is). Season 2 horror standard (docs/production/EPISODE_PLAYBOOK.md): a dark key lit by
// one bulb, the moon, a store and a videoke screen; the entity withheld (a crouched shape on a far
// roof in the street wide, a dark gap under the roof), then ONE clear, lit reveal (the face in the
// gap between the wall and the roof, as the flickering bulb comes back), after a held silence; a
// three-frame subliminal of the same face earlier, never on a word; Filipino setting and sound.
// Taglish narration (Juanito), Taglish captions. Portrait 1080x1920, rendered at 180x320 and
// upscaled 6x, PS1 shaders, a light tape layer.
// Viral standard: a hook on frame 0 (the bulb, the sleeping child, the dark gap: "Pag humihina ang
// tunog, hindi siya lumalayo. Lumalapit siya."); a seamless loop (the last 1.6 s replay the hook's
// move on negative time; the bulb swing and ambience on whole cycles); hidden details (the gap in
// the salt line from the first close-up; the shape crouched on a neighbour's roof in the street
// wide; the neighbour's open, dark window; the subliminal face; the salt scattered inward); an open
// question (who opened the window?).
// Care: an original story, labelled fiction. No town is named. Lola is wise and right. The child
// is never harmed: asleep and safe at dawn.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep12-tiktik-v1-timeline.json';
import {rng} from '../ps1';
import {Aswang, flicker, handheld, Tongue} from '../entities';
import {Barrio, BACK_Z, CHILD, GAP_Y, GROUND, House, LOLA, MatsProvider, STORE, STREET_Z, VIDEOKE, WINDOW} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep12Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => x * x * (3 - 2 * x);
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const sm = (t: number, a: number, b: number, v0 = 0, v1 = 1) => v0 + (v1 - v0) * ease(lin(t, a, b));
type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const qf = (p: number) => DUR / Math.max(1, Math.round(DUR / p));

// key times, all from the real line times (scripts/ep12_sound.py reads the same rules)
export const K = {
	videokeOff: L.l07.start - 0.25, // the videoke stops mid-song (in the gap, before the line)
	silence: L.l08.end + 0.3, // the held silence
	reveal: L.l08.end + 1.75, // the face in the gap (stinger in silence)
	black: L.l08.end + 2.75,
	sub: L.l06.end + 0.6, // three subliminal frames of the face (never on a word)
	loopOn: DUR - 1.6,
};
export const STINGERS = [K.reveal];
const GAP_X = 0.35;
const FACE: V3 = [GAP_X, GAP_Y + 0.03, BACK_Z - 0.06];

// ------------------------------------------------------------------ shot list
type Mode = 'night' | 'out' | 'dawn' | 'black';
type Pose = {p: V3; l: V3};
type Shot = {id: string; t: number; from: Pose; to?: Pose; fov?: number; mode: Mode; hand?: number};
const A: {from: Pose; to: Pose} = {from: {p: [1.0, 1.05, 1.45], l: [0.4, 1.45, BACK_Z]}, to: {p: [0.95, 1.08, 1.25], l: [0.38, 1.5, BACK_Z]}};
const SHOTS: Shot[] = [
	{id: 'A_hook', t: 0, mode: 'night', ...A, fov: 62},
	{id: 'B_street', t: L.l01.end + 0.35, mode: 'out', from: {p: [3.2, GROUND + 1.5, STREET_Z + 2.2], l: [-24, GROUND + 2.2, STREET_Z + 0.5]}, to: {p: [2.4, GROUND + 1.5, STREET_Z + 2.2], l: [-24, GROUND + 2.0, STREET_Z + 0.8]}, fov: 58},
	{id: 'C_garlic', t: L.l03.start, mode: 'night', from: {p: [-1.25, 1.42, 0.55], l: [WINDOW[0], 1.45, -0.3]}, to: {p: [-1.32, 1.42, 0.45], l: [WINDOW[0], 1.45, -0.3]}, fov: 50, hand: 0.5},
	{id: 'C_salt', t: L.l03.start + 2.6, mode: 'night', from: {p: [-1.7, 1.2, -0.25], l: [-1.98, 1.03, 0.2]}, to: {p: [-1.72, 1.18, -0.15], l: [-1.98, 1.03, 0.25]}, fov: 46, hand: 0.4},
	{id: 'D_roofs', t: L.l04.start, mode: 'out', from: {p: [7, 5.5, 17], l: [-5, 1.2, -1]}, to: {p: [6, 5.2, 16], l: [-5, 1.2, -1]}, fov: 56},
	{id: 'E_inside', t: L.l05.start - 0.5, mode: 'night', from: {p: [1.75, 1.75, 1.5], l: [-0.9, 0.9, -0.6]}, to: {p: [1.7, 1.72, 1.4], l: [-0.9, 1.0, -0.6]}, fov: 62},
	{id: 'F_tilt', t: L.l06.start - 0.7, mode: 'night', from: {p: [1.0, 0.65, 0.05], l: [CHILD[0], 0.1, CHILD[2]]}, to: {p: [0.95, 0.6, 0.0], l: [GAP_X, GAP_Y, BACK_Z]}, fov: 60, hand: 0.5},
	{id: 'G_videoke', t: L.l07.start - 0.9, mode: 'out', from: {p: [-15, GROUND + 1.7, STREET_Z + 1.4], l: [VIDEOKE[0], GROUND + 1.4, VIDEOKE[2]]}, to: {p: [-15.5, GROUND + 1.7, STREET_Z + 1.5], l: [VIDEOKE[0], GROUND + 1.4, VIDEOKE[2]]}, fov: 50},
	{id: 'H_lola', t: L.l08.start, mode: 'night', from: {p: [-0.7, 1.3, 1.2], l: [LOLA[0], 0.95, LOLA[2] - 0.2]}, to: {p: [-0.75, 1.3, 1.1], l: [LOLA[0] + 0.15, 1.35, LOLA[2] - 0.9]}, fov: 56, hand: 0.3},
	{id: 'I_tongue', t: K.silence, mode: 'night', from: {p: [1.0, 0.42, -0.35], l: [GAP_X, 1.6, BACK_Z]}, to: {p: [0.98, 0.42, -0.4], l: [GAP_X, 2.0, BACK_Z]}, fov: 62, hand: 0.6},
	{id: 'J_face', t: K.reveal, mode: 'night', from: {p: [0.45, 2.12, -0.55], l: [FACE[0], FACE[1] - 0.05, FACE[2]]}, to: {p: [0.43, 2.18, -0.8], l: [FACE[0], FACE[1] - 0.05, FACE[2]]}, fov: 40},
	{id: 'K_black', t: K.black, mode: 'black', from: {p: [0, 1, 0], l: [0, 1, 1]}},
	{id: 'L_dawn', t: L.l09.start, mode: 'dawn', from: {p: [-1.45, 1.32, -0.15], l: [-1.98, 1.03, 0.1]}, to: {p: [-1.5, 1.3, -0.05], l: [-1.98, 1.03, 0.1]}, fov: 50},
	{id: 'M_floor', t: L.l10.start - 0.3, mode: 'dawn', from: {p: [0.1, 1.8, 1.3], l: [-0.35, 0, -0.6]}, to: {p: [0.05, 1.75, 1.2], l: [-0.35, 0, -0.6]}, fov: 66},
	{id: 'A_loop', t: K.loopOn, mode: 'night', ...A, fov: 62},
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
const SUB = (t: number) => t >= K.sub && t < K.sub + 0.1;
const camPose = (t: number) => {
	const {s, k, u} = shotAt(t);
	const sub = SUB(t);
	const sh = sub ? SHOTS.find((x) => x.id === 'J_face')! : s;
	const to = sh.to ?? sh.from;
	const p = mix3(sh.from.p, to.p, sub ? 0.5 : k);
	const l = mix3(sh.from.l, to.l, sub ? 0.5 : k);
	let roll = 0;
	if (s.hand && !sub) {
		const h = handheld(t, s.hand);
		p[0] += h.dp[0];
		p[1] += h.dp[1];
		p[2] += h.dp[2];
		roll = h.roll;
	}
	const jolt = STINGERS.reduce((a, kt) => a + (t >= kt && t < kt + 0.3 ? Math.sin((t - kt) * 60) * 0.02 * (1 - (t - kt) / 0.3) : 0), 0);
	p[1] += jolt;
	return {s: sh, k, u, p, l, roll, sub};
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
	c.far = 400;
	camera.updateProjectionMatrix();
	return null;
};

const FOG: Record<Mode, [string, number, number]> = {night: ['#05060a', 6, 30], out: ['#0a0e18', 20, 120], dawn: ['#3a4250', 6, 40], black: ['#000000', 1, 2]};
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
	const {s, u, sub} = camPose(t);
	const mode = s.mode;
	if (mode === 'black') return <Atmos mode="black" />;
	const night = mode !== 'dawn';
	// the bulb: steady, then dropping out once it is close; dark for the silence; back for the reveal
	const fl = t >= L.l06.start - 0.7 && t < K.silence ? flicker(t, 12, 8, 0.65) : 1;
	const bulb = !night ? 0 : t >= K.silence && t < K.reveal ? (t < K.silence + 0.25 ? 1 - (t - K.silence) / 0.25 : 0.2) * fl : fl;
	const swing = Math.sin((2 * Math.PI * u) / qf(2.6)) * 0.05 + (t >= L.l05.start && t < K.black ? Math.sin(t * 2.3) * 0.08 : 0);
	const saltK = t < L.l03.start + 2.6 ? (t < L.l03.start ? 1 : 0) : s.id === 'C_salt' ? lin(t, L.l03.start + 2.7, L.l04.start - 0.4) : 1;
	const tongue = s.id === 'I_tongue' ? sm(t, K.silence + 0.2, K.reveal - 0.05, 0.05, 1.5) : 0;
	const videokeOn = t < K.videokeOff || t >= L.l10.start;
	const hue = (Math.floor(t * 1.2) % 5) / 5;
	return (
		<>
			<Atmos mode={mode} />
			{mode === 'night' && (
				<>
					<ambientLight intensity={0.9} color="#2a3452" />
					<pointLight position={[0, 2.46, 0]} intensity={4.2 * bulb} distance={7} decay={1.0} color="#ffc480" />
					{/* moonlight through the jalousie, and its cold bounce by the window */}
					<directionalLight position={[-12, 7, 2]} intensity={0.55} color="#8aa0d0" />
					<pointLight position={[-1.6, 1.7, 0.1]} intensity={1.4} distance={3} decay={1.0} color="#8aa0d8" />
					{/* a faint cold shaft from the gap: what comes through it is seen in silhouette */}
					{(s.id === 'I_tongue' || s.id === 'F_tilt') && <pointLight position={[GAP_X + 0.3, 1.5, BACK_Z + 0.7]} intensity={1.4} distance={2.6} decay={1.0} color="#7a90c0" />}
					{/* the candle on the altar */}
					<pointLight position={[1.5, 1.5, 1.45]} intensity={0.8} distance={2.2} decay={1.0} color="#ff9a40" />
					{/* moonlight leaking in through the gap under the roof (it silhouettes what comes through) */}
					<pointLight position={[GAP_X, GAP_Y + 0.05, BACK_Z - 0.35]} intensity={1.6} distance={3.2} decay={1.0} color="#9ab0e0" />
					{/* the reveal: the bulb comes back on the face in the gap */}
					{s.id === 'J_face' && <pointLight position={[GAP_X, GAP_Y - 0.35, BACK_Z + 0.7]} intensity={2.0} distance={1.8} decay={1.2} color="#ffc890" />}
				</>
			)}
			{mode === 'out' && (
				<>
					<ambientLight intensity={2.4} color="#34405e" />
					<directionalLight position={[-60, 50, -80]} intensity={1.2} color="#9ab0d8" />
					<pointLight position={[STORE[0], STORE[1] + 1.4, STORE[2] - 2.2]} intensity={8} distance={14} decay={1.0} color="#ffe0a0" />
					{/* a street bulb on a post by the banderitas */}
					<pointLight position={[-4, GROUND + 4.2, STREET_Z + 0.5]} intensity={6} distance={14} decay={1.0} color="#ffd090" />
					<pointLight position={[-14, GROUND + 4.2, STREET_Z + 0.5]} intensity={5} distance={12} decay={1.0} color="#ffd090" />
					{videokeOn && <pointLight position={[VIDEOKE[0], VIDEOKE[1] + 1.6, VIDEOKE[2] + 2.5]} intensity={6} distance={12} decay={1.0} color={new THREE.Color().setHSL(hue, 0.6, 0.6)} />}
					{/* our house's bulb through the walls */}
					<pointLight position={[0, 1.8, 2.4]} intensity={2.2} distance={6} decay={1.0} color="#ffc480" />
				</>
			)}
			{mode === 'dawn' && (
				<>
					<ambientLight intensity={3.2} color="#5a6478" />
					<directionalLight position={[-12, 5, 3]} intensity={1.0} color="#c8d0e0" />
				</>
			)}
			<MatsProvider>
				<House salt={saltK} scattered={mode === 'dawn'} garlic={1} bulbOn={bulb} bulbSwing={swing} lolaLook={s.id === 'H_lola' ? sm(t, L.l08.start + 0.3, L.l08.end) : s.id === 'E_inside' ? 0.2 : 0} candle={night} />
				{mode === 'out' && <Barrio t={t} videokeOn={videokeOn} screenHue={hue} />}
				{/* the shape crouched on the neighbour's roof (the street wide only) */}
				{s.id === 'B_street' && <Aswang t={t} eyes={0.6} position={[-7.5, GROUND + 3.0, 2.6]} rotation={[0, 0.9, 0]} scale={1.1} />}
				{s.id === 'I_tongue' && <Tongue t={t} len={tongue} position={[GAP_X, GAP_Y - 0.05, BACK_Z + 0.05]} />}
				{(s.id === 'J_face' || sub) && <Aswang t={t} faceOnly smile={s.id === 'J_face' ? sm(t, K.reveal, K.reveal + 0.5, 0.4, 1) : 0.8} eyes={1.2} position={FACE} rotation={[0.1, 0, s.id === 'J_face' ? 0.55 + 0.25 * sm(t, K.reveal, K.reveal + 0.8) : 0.7]} scale={1.15} />}
				{(s.id === 'J_face' || sub) &&
					[0, 1, 2, 3].map((i) => (
						<mesh key={i} position={[GAP_X + 0.2 + i * 0.03, GAP_Y - 0.13 - (i % 2) * 0.01, BACK_Z + 0.03]} rotation={[0, 0, 0.1 * i]}>
							<boxGeometry args={[0.014, 0.14, 0.014]} />
							<meshLambertMaterial color="#5e564a" flatShading />
						</mesh>
					))}
				{s.id === 'J_face' && <Tongue t={t} len={0.6 * (1 - sm(t, K.reveal, K.reveal + 0.6))} position={[GAP_X, GAP_Y - 0.15, BACK_Z + 0.05]} />}
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

const darkGrade = (t: number) => (t >= K.reveal && t < K.black ? 0.0 : t >= K.silence && t < K.reveal ? 0.2 : 0.06);

// ------------------------------------------------------------------ assembly
export const Episode12: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
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
				<filter id="tape12" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: shift, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'url(#tape12)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 55, near: 0.03, far: 400}} style={{imageRendering: 'pixelated'}}>
					<Cam t={t} />
					<World t={t} />
				</ThreeCanvas>
			</div>
			<AbsoluteFill style={{background: `rgba(6,10,18,${g})`}} />
			<Overlay t={t} damage={damage} captions={captions} />
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep12-tiktik-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
