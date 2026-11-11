// Episode 10: "The Night the Lake Breathed Out" (true: Lake Nyos, Cameroon, 21 August 1986).
// Portrait short, pixelated low-poly 3D (180x320 rendered, 6x nearest upscale), PS1 shaders,
// a light tape layer. A real disaster with living survivors: it is told as science and as
// stillness, not as a monster. No person or animal is ever shown harmed or dead: the gas is
// seen arriving as a mist, a lamp goes out, and at dawn the village is empty and silent.
// Viral standard: second-person hook on frame 0 (the still crater lake at night, "Look at this
// lake. Calm. Blue. In one night, it breathed out."); a seamless loop (the last 1.6 s are the
// hook's own move on negative time; a ring on the water bridges the two lakes); hidden rewatch
// details (a lamp goes out as the mist reaches it; the crickets stop before the word "silent";
// cold ash where the cooking fire was; the lake dull red at dawn; a ring rising on the water in
// the first and last seconds); an open question (which lakes are still holding their breath?).
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep10-lake-v1-timeline.json';
import {rng} from '../ps1';
import {Deep, Degasser, hutPos, hutWindow, Lake, LAMP_HUT, MatsProvider, Mist, OTHER_X, OtherLake, Terrain, terrainH, Village, VILLAGE} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep10Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => x * x * (3 - 2 * x);
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const sm = (t: number, a: number, b: number, v0 = 0, v1 = 1) => v0 + (v1 - v0) * ease(lin(t, a, b));
type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));

// key times, all from the real line times (scripts/ep10_sound.py reads the same rules)
export const K = {
	bulge: L.l03.start + 2.2, // the lake surface lifts after "a deep rumble"
	plume: L.l03.end + 0.35, // stinger in silence: the plume rises
	lampOut: L.l05.start - 0.9, // the lamp in the window goes out as the mist reaches it
	black: L.l05.start - 0.45, // a held black before dawn
	erupt: L.l08.end + 0.45, // stinger in silence: the deep layer lets go
	ring: L.l10.end + 0.2, // a ring on the other lake (and on Nyos at frame 0)
	loopOn: DUR - 1.6,
};
export const STINGERS = [K.plume, K.erupt];

// ------------------------------------------------------------------ shot list
type Mode = 'night' | 'dawn' | 'day' | 'under' | 'black';
type Shot = {id: string; t: number; from: {p: V3; l: V3}; to?: {p: V3; l: V3}; fov?: number; mode: Mode};
const rim = (x: number, z: number, up = 3): V3 => [x, terrainH(x, z) + up, z];
const HUT = hutPos(LAMP_HUT);
const [WIN_EYE, WIN] = hutWindow(LAMP_HUT, 7.5);
const [WIN_EYE2] = hutWindow(LAMP_HUT, 6.4);
const gnd = (x: number, z: number, up = 1.7): V3 => [x, terrainH(x, z) + up, z];
const over = (x: number, z: number, h: number): V3 => [x, Math.max(terrainH(x, z) + 3, HUT[1] + h), z];
const A = {from: {p: rim(-14, -66, 3), l: [0, -2, 14] as V3}, to: {p: rim(-12, -62, 3), l: [0, -2, 14] as V3}};
const SHOTS: Shot[] = [
	{id: 'A_hook', t: 0, mode: 'night', ...A, fov: 50},
	{id: 'B_village', t: L.l01.end, mode: 'night', from: {p: [VILLAGE[0] - 34, VILLAGE[1] + 26, VILLAGE[2] - 46], l: [VILLAGE[0], VILLAGE[1] + 2, VILLAGE[2]]}, to: {p: [VILLAGE[0] - 30, VILLAGE[1] + 24, VILLAGE[2] - 42], l: [VILLAGE[0], VILLAGE[1] + 2, VILLAGE[2]]}, fov: 52},
	{id: 'C_rumble', t: L.l02.end, mode: 'night', from: {p: [-36, 3.5, -34], l: [0, 1.5, 0]}, to: {p: [-34, 3.5, -32], l: [0, 2.5, 0]}, fov: 50},
	{id: 'C_plume', t: K.plume, mode: 'night', from: {p: rim(48, -50, 3), l: [0, 18, 6]}, to: {p: rim(46, -48, 3), l: [0, 26, 10]}, fov: 58},
	{id: 'D_flow', t: L.l04.start + 2.6, mode: 'night', from: {p: [52, terrainH(52, 90) + 14, 90], l: [10, terrainH(10, 140) + 2, 140]}, to: {p: [50, terrainH(50, 100) + 13, 100], l: [12, terrainH(12, 170) + 2, 170]}, fov: 56},
	{id: 'E_village', t: L.l04.end - 1.2, mode: 'night', from: {p: [WIN_EYE[0] - 1.2, Math.max(WIN_EYE[1] + 1.2, terrainH(WIN_EYE[0] - 1.2, WIN_EYE[2]) + 1.6), WIN_EYE[2]], l: WIN}, to: {p: [WIN_EYE2[0] - 1.0, Math.max(WIN_EYE2[1] + 1.0, terrainH(WIN_EYE2[0] - 1.0, WIN_EYE2[2]) + 1.6), WIN_EYE2[2]], l: WIN}, fov: 50},
	{id: 'E_black', t: K.black, mode: 'black', from: {p: [0, 0, 0], l: [0, 0, 1]}, fov: 50},
	{id: 'F_dawn', t: L.l05.start, mode: 'dawn', from: {p: [VILLAGE[0] - 34, VILLAGE[1] + 26, VILLAGE[2] - 46], l: [VILLAGE[0], VILLAGE[1] + 2, VILLAGE[2]]}, to: {p: [VILLAGE[0] - 32, VILLAGE[1] + 25, VILLAGE[2] - 44], l: [VILLAGE[0], VILLAGE[1] + 2, VILLAGE[2]]}, fov: 54},
	{id: 'F_path', t: L.l06.start, mode: 'dawn', from: {p: gnd(VILLAGE[0] - 3, VILLAGE[2] - 34, 2.2), l: [VILLAGE[0], VILLAGE[1] + 1.0, VILLAGE[2]]}, to: {p: gnd(VILLAGE[0] - 2, VILLAGE[2] - 24, 2.0), l: [VILLAGE[0], VILLAGE[1] + 1.2, VILLAGE[2] + 10]}, fov: 54},
	{id: 'G_red', t: L.l06.end + 0.1, mode: 'dawn', from: {p: rim(-14, -66, 3), l: [0, -2, 14]}, to: {p: rim(-13, -64, 3), l: [0, -2, 14]}, fov: 50},
	{id: 'G_down', t: L.l07.start, mode: 'under', from: {p: [0, -1.0, -6], l: [0, -8, 4]}, to: {p: [0, -4.8, -3], l: [0, -8.5, 4]}, fov: 56},
	{id: 'H_deep', t: L.l08.start, mode: 'under', from: {p: [0, -5.2, -2.5], l: [0, -7.6, 3]}, to: {p: [0, -5.4, -2.0], l: [0, -7.4, 3]}, fov: 52},
	{id: 'I_today', t: L.l09.start, mode: 'day', from: {p: rim(40, -50, 3), l: [4, 6, -6]}, to: {p: rim(37, -47, 3), l: [4, 10, -6]}, fov: 52},
	{id: 'J_other', t: L.l10.start - 0.5, mode: 'night', from: {p: [OTHER_X, 6, -20], l: [OTHER_X, 0.5, 70]}, to: {p: [OTHER_X, 5, -10], l: [OTHER_X, 0.5, 70]}, fov: 50},
	{id: 'A_loop', t: K.loopOn, mode: 'night', ...A, fov: 50},
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
	const {s, k, u} = shotAt(t);
	const to = s.to ?? s.from;
	const p = mix3(s.from.p, to.p, k);
	const l = mix3(s.from.l, to.l, k);
	const shake = STINGERS.reduce((a, kt) => a + (t >= kt && t < kt + 0.3 ? Math.sin((t - kt) * 55) * 0.05 * (1 - (t - kt) / 0.3) : 0), 0);
	const rumble = t >= L.l03.start + 1.5 && t < K.plume ? Math.sin(t * 40) * 0.03 : 0;
	p[1] += shake + rumble + Math.sin(u * 0.9) * 0.015;
	return {s, k, u, p, l};
};

// ------------------------------------------------------------------ camera and atmosphere

const Cam: React.FC<{t: number}> = ({t}) => {
	const {camera} = useThree();
	const {s, p, l} = camPose(t);
	camera.position.set(...p);
	camera.up.set(0, 1, 0);
	camera.lookAt(...l);
	(camera as THREE.PerspectiveCamera).fov = s.fov ?? 50;
	(camera as THREE.PerspectiveCamera).far = 3000;
	camera.updateProjectionMatrix();
	return null;
};

const FOG: Record<Mode, [string, number, number]> = {night: ['#141e34', 80, 800], dawn: ['#6a5e60', 40, 500], day: ['#9ab4c8', 80, 900], under: ['#143232', 1, 16], black: ['#000000', 1, 2]};
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

/** Stars: single pixels on a far sphere, only at night. */
const Stars: React.FC = () => {
	const pts = useMemo(() => {
		const r = rng(4242);
		const a = new Float32Array(600 * 3);
		for (let i = 0; i < 600; i++) {
			const th = r() * Math.PI * 2, ph = Math.acos(0.15 + r() * 0.85);
			a.set([Math.cos(th) * Math.sin(ph) * 1500, Math.cos(ph) * 1500, Math.sin(th) * Math.sin(ph) * 1500], i * 3);
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.BufferAttribute(a, 3));
		return g;
	}, []);
	const m = useMemo(() => new THREE.PointsMaterial({color: '#dfe4f0', size: 1, sizeAttenuation: false, fog: false}), []);
	return <points geometry={pts} material={m} />;
};

// ------------------------------------------------------------------ the world at time t

const World: React.FC<{t: number}> = ({t}) => {
	const {s, u} = camPose(t);
	const mode = s.mode;
	if (mode === 'black') return <Atmos mode="black" />;
	const tone = mode === 'day' ? 'day' : mode === 'dawn' ? 'dawn' : 'night';
	const bulge = sm(t, K.bulge, K.plume) * (1 - sm(t, K.plume, K.plume + 2.5));
	const mistK = lin(t, K.plume, L.l05.start - 0.3, 0, 1);
	const mistOn = t >= K.plume && t < K.black ? 1 : 0;
	const rise = s.id === 'H_deep' ? sm(t, K.erupt, K.erupt + 1.5) : 0;
	const ringK = (uu: number) => (uu > -1.6 && uu < 1.2 ? lin(uu, -1.6, 1.2) : 0);
	return (
		<>
			<Atmos mode={mode} />
			{mode === 'night' && (
				<>
					<Stars />
					<ambientLight intensity={1.5} color="#5a6a8a" />
					<directionalLight position={[-200, 300, -100]} intensity={0.8} color="#aabad8" />
					<mesh position={[-600, 700, 900]}>
						<circleGeometry args={[30, 16]} />
						<meshBasicMaterial color="#e8ecf0" fog={false} />
					</mesh>
				</>
			)}
			{mode === 'dawn' && (
				<>
					<ambientLight intensity={1.5} color="#9a8c88" />
					<directionalLight position={[300, 80, -200]} intensity={0.9} color="#e0b090" />
				</>
			)}
			{mode === 'day' && (
				<>
					<ambientLight intensity={1.2} color="#b0bcc8" />
					<directionalLight position={[200, 300, -100]} intensity={0.9} color="#fff4e0" />
				</>
			)}
			{mode === 'under' && (
				<>
					<ambientLight intensity={2.0} color="#4a7a7a" />
					<pointLight position={[0, -1, -2]} intensity={2.5} distance={14} color="#8ac0c0" />
				</>
			)}
			<MatsProvider>
				{s.id === 'J_other' ? (
					<OtherLake t={t} bubble={lin(t, K.ring, DUR)} />
				) : (
					<>
						<Terrain tone={tone} />
						{mode !== 'under' && <Lake t={t} bulge={bulge} tone={tone} red={mode === 'dawn' ? 1 : 0} />}
						<Village lamps={mode === 'night' ? 1 : 0} lampOut={t >= K.lampOut ? 1 : 0} dawn={mode === 'dawn' || mode === 'day'} />
						{mistOn > 0 && <Mist k={mistK} t={t} fade={1} />}
						{mode === 'under' && <Deep t={t} rise={rise} />}
						{mode === 'day' && <Degasser t={t} />}
						{/* a ring rising on the water in the first and last seconds (the loop) */}
						{s.id.startsWith('A_') && ringK(u) > 0 && (
							<mesh position={[0, 0.15, 10]} rotation={[-Math.PI / 2, 0, 0]} scale={0.5 + ringK(u) * 5}>
								<ringGeometry args={[0.8, 1, 18]} />
								<meshBasicMaterial color="#c8d4e0" transparent opacity={0.7 * (1 - ringK(u) * 0.6)} />
							</mesh>
						)}
					</>
				)}
			</MatsProvider>
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: captions, tape

const Overlay: React.FC<{t: number; damage: number; captions: boolean; rain: number}> = ({t, damage, captions, rain}) => {
	const cap = useRef<HTMLCanvasElement>(null);
	const noise = useRef<HTMLCanvasElement>(null);
	useLayoutEffect(() => {
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
			// Every word is shown: long lines become balanced pages of at most 3 rows,
			// each page timed across the spoken line in proportion to its characters.
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
				const y = 470 + i * 19 - (show.length - 1) * 19;
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
		// wind-driven rain: short slanted streaks
		if (rain > 0) {
			const rr = rng(Math.floor(t * 30) * 31 + 9);
			n.strokeStyle = `rgba(200,210,220,${0.35 * rain})`;
			n.lineWidth = 1;
			n.beginPath();
			for (let i = 0; i < 70 * rain; i++) {
				const x = rr() * (LW + 40) - 20, y = rr() * LH;
				n.moveTo(x, y);
				n.lineTo(x - 4, y + 9);
			}
			n.stroke();
		}
	}, [t, damage, captions, rain]);
	return (
		<>
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};




// a cold dark grade; no red: this is grief, not gore
const darkGrade = (t: number) => (t < K.plume ? 0.1 : t < L.l05.start ? 0.28 : t < L.l07.start ? 0.12 : t < L.l09.start ? 0.22 : sm(t, L.l10.start, K.loopOn, 0.06, 0.1));

// ------------------------------------------------------------------ assembly

export const Episode10: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const hit = STINGERS.reduce((a, kt) => Math.max(a, t >= kt && t < kt + 0.4 ? 1 - (t - kt) / 0.4 : 0), 0);
	const damage = 0.05 + hit * 0.6;
	const ca = 0.6 + damage * 3;
	const shift = hit > 0.5 ? Math.round(Math.sin(t * 90) * 3) : 0;
	const g = darkGrade(t);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="tape10" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: shift, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'url(#tape10)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.05, far: 3000}} style={{imageRendering: 'pixelated'}}>
					<Cam t={t} />
					<World t={t} />
				</ThreeCanvas>
			</div>
			<AbsoluteFill style={{background: `rgba(10,16,30,${g})`}} />
			<Overlay t={t} damage={damage} captions={captions} rain={0} />
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.8) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep10-lake-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
