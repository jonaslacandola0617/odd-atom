// Episode 19: "Santelmo" (folklore and science). Season 2 horror standard
// (docs/production/EPISODE_PLAYBOOK.md): a dark key lit by a farmer's flashlight, a clouded moon and
// the santelmo itself (a ball of fire that lights the palay around it); the legend withheld (a light
// keeping exact pace, stopping when he stops, its reflection in the canal and a second glow under the
// water, the frogs stopping, the light splitting into three), then ONE clear, lit reveal: it comes
// close, at face height, and inside the fire is a drowned face, mouth open, hair floating as if under
// water. He turns his shirt inside out; the light shrinks and sinks into the canal. Dawn: a scorched
// circle in the palay. The real St. Elmo's fire (a blue glow on a ship's masts in a storm) is shown
// as science, and the narration says it does not follow you home.
// Taglish narration (Juanito), Taglish captions. Portrait 1080x1920, rendered at 180x320 and
// upscaled 6x, PS1 shaders, a light tape layer.
// Viral standard: a hook on frame 0 (the light keeping pace over the palay: "Kapag may liwanag na
// sumusunod sa'yo sa palayan, huwag mo itong sundan."); a seamless loop (the last 1.6 s replay the
// hook's walk, as "Kadalasan." ends); hidden details (the glow under the canal water from the first
// wide; wet tsinelas on the canal bank; the scorched circle at dawn; a fourth light far off at dawn;
// three frames of the face); an open question (who never came home from the river?).
// Care: drowning is real in farming and fishing communities; no drowning is depicted; the face is a
// legend image, not a person.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep19-santelmo-v1-timeline.json';
import {rng} from '../ps1';
import {DrownedFace, handheld} from '../entities';
import {CANAL_X, Farmer, MatsProvider, Paddies, PATH_Y, Santelmo, SHIP, Storm} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep19Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => x * x * (3 - 2 * x);
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));

// key times, all from the real line times (scripts/ep19_sound.py reads the same rules)
export const K = {
	stop: L.l05.start + 0.5, // he stops; it stops
	go: L.l05.start + 1.9, // he walks; it walks
	sub: L.l05.end + 0.25, // three frames of the face (between lines)
	frogs: L.l07.start - 0.2, // the frogs stop
	split: L.l07.start + 0.6, // it splits into three
	close: L.l07.end + 0.3, // it comes close, at face height (silence)
	reveal: L.l07.end + 1.5, // the face inside the fire (stinger in silence)
	sink: L.l09.start + 2.6, // it sinks into the canal
	loopOn: DUR - 1.6,
};
export const STINGERS = [K.reveal];
const SUB = (t: number) => t >= K.sub && t < K.sub + 0.1;

// ------------------------------------------------------------------ shot list
type Mode = 'night' | 'storm' | 'dawn';
type Pose = {p: V3; l: V3};
type Shot = {id: string; t: number; from: Pose; to?: Pose; fov?: number; mode: Mode; hand?: number};
const FARM_Z = -18; // where he stands at the canal
const FACE_P: V3 = [-0.6, 1.86, FARM_Z - 0.05];
const S = (p: V3): V3 => [SHIP[0] + p[0], p[1], SHIP[2] + p[2]];
const SHOTS: Shot[] = [
	{id: 'A_hook', t: 0, mode: 'night', from: {p: [0, 1.65, 0], l: [0.9, 0.7, -8]}, fov: 56, hand: 0.5},
	{id: 'B_farmer', t: L.l01.end + 0.3, mode: 'night', from: {p: [9, 1.4, -9], l: [0.5, 1.0, -9.5]}, to: {p: [9, 1.4, -10.5], l: [0.5, 1.0, -12.5]}, fov: 50},
	{id: 'C_wide', t: L.l02.end + 0.3, mode: 'night', from: {p: [14, 13, 8], l: [-3, 0, -24]}, to: {p: [13, 12.5, 6], l: [-3, 0, -25]}, fov: 52},
	{id: 'D_ship', t: L.l04.start - 0.3, mode: 'storm', from: {p: S([16, 4, 22]), l: S([0, 7, 0])}, to: {p: S([13, 4.5, 19]), l: S([0, 8, 0])}, fov: 52, hand: 0.4},
	{id: 'E_stop', t: L.l05.start - 0.3, mode: 'night', from: {p: [0.25, 2.0, -11.6], l: [0.6, 1.2, -19]}, to: {p: [0.25, 2.0, -12.2], l: [0.6, 1.2, -19.6]}, fov: 52, hand: 0.4},
	{id: 'F_canal', t: L.l05.end + 0.4, mode: 'night', from: {p: [CANAL_X + 3.4, 1.3, -16.2], l: [CANAL_X, -0.2, -21.5]}, to: {p: [CANAL_X + 3.2, 1.25, -16.6], l: [CANAL_X, -0.2, -21.5]}, fov: 52, hand: 0.3},
	{id: 'G_split', t: L.l07.start - 0.3, mode: 'night', from: {p: [1.8, 1.8, FARM_Z + 1.8], l: [CANAL_X, 1.1, FARM_Z - 2.5]}, to: {p: [1.6, 1.75, FARM_Z + 1.5], l: [CANAL_X, 1.1, FARM_Z - 2.5]}, fov: 52, hand: 0.4},
	{id: 'H_close', t: K.close, mode: 'night', from: {p: [0, 1.9, FARM_Z], l: [-3, 1.6, FARM_Z - 1]}, to: {p: [0, 1.9, FARM_Z], l: [-1, 1.85, FARM_Z - 0.1]}, fov: 52, hand: 0.6},
	{id: 'I_reveal', t: K.reveal, mode: 'night', from: {p: [0.25, 1.88, FARM_Z], l: FACE_P}, to: {p: [0.12, 1.88, FARM_Z - 0.02], l: FACE_P}, fov: 50, hand: 0.4},
	{id: 'J_shirt', t: L.l08.start + 0.9, mode: 'night', from: {p: [2.6, 1.6, FARM_Z + 2.4], l: [-2.5, 1.0, FARM_Z - 1.5]}, to: {p: [2.4, 1.6, FARM_Z + 2.2], l: [-3.5, 0.6, FARM_Z - 2]}, fov: 54, hand: 0.4},
	{id: 'K_dawn', t: L.l09.end + 0.3, mode: 'dawn', from: {p: [6.5, 3.4, -6.5], l: [2.5, 0.4, -20]}, to: {p: [6.2, 3.2, -7.2], l: [2.5, 0.4, -20]}, fov: 52},
	{id: 'A_loop', t: K.loopOn, mode: 'night', from: {p: [0, 1.65, 0], l: [0.9, 0.7, -8]}, fov: 56, hand: 0.5},
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

/** The farmer's position along the main path (z) in the walking shots. */
const walkZ = (t: number, id: string, u: number) => {
	if (id.startsWith('A_')) return 2 - (u + 1.6) * 1.15;
	if (id === 'B_farmer') return -8 - (t - SHOTS[1].t) * 1.15;
	if (id === 'C_wide') return -11.5 - (t - SHOTS[2].t) * 0.4;
	if (id === 'E_stop') {
		const t0 = SHOTS[4].t;
		const moving = Math.min(t, K.stop) - t0 + Math.max(0, t - K.go);
		return -14 - moving * 1.0;
	}
	return FARM_Z;
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
	if (s.id.startsWith('A_')) {
		const z = walkZ(t, s.id, u);
		p[2] += z;
		l[2] += z;
		p[1] += Math.abs(Math.sin(u * 5.4)) * 0.03;
	}
	if (s.id === 'E_stop') {
		const z = walkZ(t, s.id, u) + 14;
		p[2] += z;
		l[2] += z;
	}
	let roll = 0;
	if (s.hand) {
		const h = handheld(u, s.hand);
		p[0] += h.dp[0];
		p[1] += h.dp[1];
		p[2] += h.dp[2];
		roll = h.roll;
	}
	const jolt = STINGERS.reduce((a, kt) => a + (t >= kt && t < kt + 0.3 ? Math.sin((t - kt) * 60) * 0.015 * (1 - (t - kt) / 0.3) : 0), 0);
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
	c.near = 0.02;
	c.far = 900;
	camera.updateProjectionMatrix();
	return null;
};

const FOG: Record<Mode, [string, number, number]> = {night: ['#070a12', 14, 120], storm: ['#0a0e16', 20, 140], dawn: ['#a8a8a4', 20, 200]};
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

/** A spotlight: the farmer's flashlight (from his hand, or from the camera in his point of view). */
const Spot: React.FC<{p: V3; l: V3; intensity: number}> = ({p, l, intensity}) => {
	const light = React.useMemo(() => new THREE.SpotLight('#fff0d8', 8, 24, 0.38, 0.55, 1), []);
	light.position.set(...p);
	light.target.position.set(...l);
	light.intensity = intensity;
	light.target.updateMatrixWorld();
	return (
		<>
			<primitive object={light} />
			<primitive object={light.target} />
		</>
	);
};

/** Where the santelmo is: pacing the farmer over the palay to his right, then over the canal, then close. */
const fireAt = (t: number, id: string, z: number): V3[] => {
	const bob = Math.sin(t * 1.7) * 0.12;
	if (id.startsWith('A_')) return [[1.7, 1.25 + bob, z - 6]];
	if (id === 'B_farmer' || id === 'C_wide') return [[2.4, 1.3 + bob, z - 1.2]];
	if (id === 'E_stop') return [[1.5, 1.4 + bob, z - 2.2]];
	if (id === 'F_canal') return [[CANAL_X + Math.sin(t * 0.4) * 0.3, 1.1 + bob, -21.5 + lin(t, SHOTS[5].t, SHOTS[6].t) * 1.2]];
	if (id === 'G_split') {
		const sp = ease(lin(t, K.split, K.split + 1.2));
		const c: V3 = [CANAL_X + 0.5, 1.2 + bob, FARM_Z - 2.5];
		return sp > 0 ? [-1, 0, 1].map((k) => [c[0] + k * sp * 0.4, c[1] + Math.abs(k) * sp * 0.3, c[2] + k * sp * 1.6] as V3) : [c];
	}
	if (id === 'H_close') return [mix3([CANAL_X + 1.0, 1.4, FARM_Z - 2.0], FACE_P, ease(lin(t, K.close, K.reveal)))];
	if (id === 'I_reveal') return [FACE_P];
	if (id === 'J_shirt') {
		const back = ease(lin(t, L.l09.start, K.sink));
		const p = mix3([-1.8, 1.7, FARM_Z - 0.6], [CANAL_X, 0.8, FARM_Z - 2], back);
		if (t > K.sink) p[1] = 0.8 - lin(t, K.sink, K.sink + 1.0) * 1.6;
		return [p];
	}
	return [];
};

// ------------------------------------------------------------------ the world at time t
const World: React.FC<{t: number}> = ({t}) => {
	const {s, sub, u} = camPose(t);
	const mode = s.mode;
	const z = walkZ(t, s.id, u);
	const fires = sub ? [FACE_P] : fireAt(t, s.id, z);
	const reveal = s.id === 'I_reveal' || sub;
	const shrink = s.id === 'J_shirt' ? 1 - lin(t, L.l09.start + 0.4, K.sink + 0.8) * 0.75 : 1;
	const walking = s.id.startsWith('A_') || s.id === 'B_farmer' || s.id === 'C_wide' || (s.id === 'E_stop' && (t < K.stop || t > K.go));
	const farmerZ = s.id === 'E_stop' || s.id === 'B_farmer' || s.id === 'C_wide' ? z : FARM_Z;
	const showFarmer = ['B_farmer', 'C_wide', 'E_stop', 'G_split', 'J_shirt'].includes(s.id);
	const farmerRy = s.id === 'G_split' || s.id === 'J_shirt' ? -Math.PI / 2 : Math.PI;
	const shirt: 'on' | 'off' | 'in' = s.id === 'J_shirt' ? (t < L.l09.start + 1.8 ? 'off' : 'in') : 'on';
	const lightning = mode === 'storm' ? (Math.sin(t * 2.3) > 0.97 || (t > SHOTS[3].t + 1.2 && t < SHOTS[3].t + 1.35) || (t > SHOTS[3].t + 5.1 && t < SHOTS[3].t + 5.2) ? 1 : 0) : 0;
	return (
		<>
			<Atmos mode={mode} />
			{mode === 'night' && (
				<>
					<ambientLight intensity={3.0} color="#2c3450" />
					<directionalLight position={[80, 110, -260]} intensity={2.2} color="#a8b0c8" />
					{fires.map((f, i) => (
						<pointLight key={i} position={f} intensity={(reveal ? 3 : 4.5) * shrink} distance={9} decay={1.0} color="#ff9a40" />
					))}
					{s.id.startsWith('A_') && <Spot p={[0.15, 1.5, z - 0.2]} l={[0.1, 0, z - 7]} intensity={10} />}
					{showFarmer && s.id !== 'J_shirt' && <Spot p={[0.3, 1.0, farmerZ - 0.5]} l={farmerRy === Math.PI ? [0.2, 0, farmerZ - 7] : [-6, 0, farmerZ - 1]} intensity={8} />}
					{reveal && <pointLight position={[-0.2, 1.9, FARM_Z]} intensity={2.2} distance={1.5} decay={1.0} color="#ffb060" />}
				</>
			)}
			{mode === 'storm' && (
				<>
					<ambientLight intensity={1.2 + lightning * 6} color="#2a3248" />
					<directionalLight position={[SHIP[0] + 30, 40, 20]} intensity={0.6 + lightning * 3} color="#c8d0ff" />
					<pointLight position={S([0, 12, 0])} intensity={3} distance={10} decay={1.0} color="#9ab8ff" />
				</>
			)}
			{mode === 'dawn' && (
				<>
					<ambientLight intensity={3.2} color="#a09a90" />
					<directionalLight position={[60, 20, -40]} intensity={2.0} color="#ffd8b0" />
				</>
			)}
			<MatsProvider>
				{mode === 'storm' ? (
					<Storm t={t} />
				) : (
					<>
						<Paddies t={t} dawn={mode === 'dawn'} deepGlow={mode === 'night' ? 1 : 0} tsinelas />
						{showFarmer && <Farmer t={t} position={[0, PATH_Y, farmerZ]} ry={farmerRy} walk={walking} shirt={shirt} look={s.id === 'E_stop' ? 1 : 0} />}
						{fires.map((f, i) => (
							<Santelmo key={i} t={t} position={f} seed={i * 2} scale={(reveal ? 1.25 : 1) * shrink} core={!reveal} />
						))}
						{/* the reflection of the light in the canal */}
						{s.id === 'F_canal' && fires[0] && <Santelmo t={t} position={[fires[0][0], -0.6 - fires[0][1], fires[0][2]]} scale={0.8} seed={9} />}
						{mode === 'dawn' && <Santelmo t={t} position={[-34, 1.6, -64]} scale={0.8} seed={5} />}
					</>
				)}
				{reveal && <DrownedFace t={t} position={FACE_P} rotation={[0, Math.PI / 2, 0]} scale={1.15} />}
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
export const Episode19: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
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
				<filter id="tape19" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: shift, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'url(#tape19)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 55, near: 0.02, far: 900}} style={{imageRendering: 'pixelated'}}>
					<Cam t={t} />
					<World t={t} />
				</ThreeCanvas>
			</div>
			<AbsoluteFill style={{background: `rgba(6,10,18,${g})`}} />
			<Overlay t={t} damage={damage} captions={captions} />
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep19-santelmo-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
