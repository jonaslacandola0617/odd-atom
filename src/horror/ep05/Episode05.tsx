// Episode 5: "Nine Hikers, One Cut Tent" (true story: the Dyatlov Pass incident, 1959).
// 57.5 s portrait short, pixelated low-poly 3D (180x320 rendered, 6x nearest upscale),
// PS1 shaders, a light tape layer.
// Nine real people died. Nothing of their deaths is shown: no bodies, no injuries. The
// hikers appear only as distant silhouettes with torches on the night they camped; the
// rest of the film is the tent, the prints, the cedar, the ravine and the file.
// Viral standard: second-person hook on frame 0 (inside the tent, a blade already
// through the canvas); a seamless loop (the last 1.6 s are the hook's own shot on
// negative time); hidden rewatch details (the boots left inside; nine lines of prints;
// the cedar's branches broken high up; a faint orange light in the sky through the cut)
// and an open question (what made them cut their way out?).
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep05-tent-v1-timeline.json';
import {rng} from '../ps1';
import {Human, Pose} from '../ep01/world';
import {Snowfall} from '../ep03/world';
import {Cedar, CaseFile, gy, HIKER, KnifeHand, MatsProvider, Ravine, Slab, Slope, Tent} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep05Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => x * x * (3 - 2 * x);
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const sm = (t: number, a: number, b: number, v0 = 0, v1 = 1) => v0 + (v1 - v0) * ease(lin(t, a, b));
type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

export const K = {loopOn: DUR - 1.6, slab: 40.6};

// ------------------------------------------------------------------ shot list
type Mode = 'tent' | 'dusk' | 'day' | 'spring' | 'night' | 'desk';
type Shot = {id: string; t: number; from: {p: V3; l: V3}; to?: {p: V3; l: V3}; fov?: number; mode: Mode};
const A = {from: {p: [0.42, 0.52, -0.22] as V3, l: [0.4, 0.5, 0.9] as V3}, to: {p: [0.42, 0.5, -0.05] as V3, l: [0.4, 0.48, 0.9] as V3}};
const SHOTS: Shot[] = [
	{id: 'A_cut_hook', t: 0, mode: 'tent', ...A, fov: 66},
	{id: 'B_camp_dusk', t: 5.8, mode: 'dusk', from: {p: [9, gy(32) + 5, 32], l: [0, gy(0) + 1.2, 0]}, to: {p: [8, gy(28) + 4.5, 28], l: [0, gy(0) + 1.2, 0]}, fov: 44},
	{id: 'B2_camp_close', t: 9.8, mode: 'dusk', from: {p: [4.2, gy(7) + 1.7, 7], l: [0, gy(0) + 0.9, 0]}, to: {p: [3.6, gy(6) + 1.6, 6], l: [0, gy(0) + 0.9, 0]}, fov: 50},
	{id: 'C_tent_found', t: 13.6, mode: 'day', from: {p: [2.6, gy(4.5) + 1.4, 4.5], l: [0.4, gy(0) + 0.5, 0.3]}, to: {p: [2.2, gy(3.8) + 1.25, 3.8], l: [0.4, gy(0) + 0.5, 0.3]}, fov: 52},
	{id: 'D_prints', t: 19.4, mode: 'day', from: {p: [0.6, gy(2.5) + 2.2, 2.5], l: [0.1, gy(40), 40]}, to: {p: [0.4, gy(7) + 2.0, 7], l: [0.1, gy(46), 46]}, fov: 54},
	{id: 'E_cedar', t: 24.8, mode: 'day', from: {p: [1.5, gy(119) + 1.4, 119], l: [6, gy(112) + 1.0, 112]}, to: {p: [1.8, gy(119) + 1.6, 119], l: [6, gy(112) + 5.5, 112]}, fov: 54},
	{id: 'F_ravine', t: 29.3, mode: 'spring', from: {p: [10, gy(127.5) + 3.6, 127.5], l: [40, gy(128) - 1, 128]}, to: {p: [12, gy(127.5) + 3.4, 127.5], l: [42, gy(128) - 1, 128]}, fov: 54},
	{id: 'G_file', t: 34.0, mode: 'desk', from: {p: [200, 0.6, 200.4], l: [200, 0, 200.1]}, to: {p: [200, 0.52, 200.34], l: [200, 0, 200.1]}, fov: 44},
	{id: 'H1_slab_side', t: 39.1, mode: 'night', from: {p: [6.5, gy(-15) + 3.2, -15], l: [0, gy(-4) + 0.3, -4]}, to: {p: [5.0, gy(-11) + 2.6, -11], l: [0, gy(-2) + 0.4, -2]}, fov: 56},
	{id: 'I_tent_alone', t: 46.3, mode: 'dusk', from: {p: [2.6, gy(4.5) + 1.4, 4.5], l: [0.4, gy(0) + 0.5, 0.3]}, to: {p: [2.4, gy(4.2) + 1.35, 4.2], l: [0.4, gy(0) + 0.5, 0.3]}, fov: 52},
	{id: 'J_inside', t: 49.2, mode: 'tent', from: {p: [-0.9, 0.55, -0.3], l: [0.6, 0.45, 0.6]}, to: {p: [0.3, 0.53, -0.25], l: [0.4, 0.5, 0.9]}, fov: 66},
	{id: 'A_loop', t: K.loopOn, mode: 'tent', ...A, fov: 66},
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

// ------------------------------------------------------------------ the case file texture

const useCanvasTex = (w: number, h: number) =>
	useMemo(() => {
		const c = document.createElement('canvas');
		c.width = w;
		c.height = h;
		const t = new THREE.CanvasTexture(c);
		t.magFilter = THREE.NearestFilter;
		t.minFilter = THREE.NearestFilter;
		t.generateMipmaps = false;
		t.colorSpace = THREE.SRGBColorSpace;
		return {c, t, g: c.getContext('2d')!};
	}, [w, h]);

const drawFile = (g: CanvasRenderingContext2D, t: number) => {
	const W = 72, H = 96;
	const r = rng(5);
	g.fillStyle = '#d8d2bc';
	g.fillRect(0, 0, W, H);
	g.fillStyle = '#1e1c18';
	g.font = 'bold 7px "DejaVu Sans Mono", monospace';
	g.textAlign = 'left';
	g.fillText('CASE FILE', 4, 10);
	g.fillText('1959', W - 26, 10);
	g.fillRect(4, 13, W - 8, 1);
	for (let y = 20; y < 58; y += 5) {
		g.fillStyle = '#4a463e';
		g.fillRect(4, y, 30 + Math.floor(r() * 32), 2);
	}
	// the conclusion, typed out letter by letter
	const line = 'A COMPELLING NATURAL FORCE.';
	const n = Math.floor(lin(t, 35.2, 37.6) * line.length);
	g.font = 'bold 6px "DejaVu Sans Mono", monospace';
	g.fillStyle = '#101010';
	g.fillText(line.slice(0, 13), 4, 68);
	g.fillText(line.slice(13, Math.max(13, n)), 4, 76);
	if (n < 13) {
		g.fillStyle = '#d8d2bc';
		g.fillRect(4 + n * 3.6, 62, 60, 8);
	}
	// the stamp lands
	if (t >= 38.0) {
		g.save();
		g.translate(46, 88);
		g.rotate(-0.15);
		g.strokeStyle = '#a0201a';
		g.lineWidth = 1.5;
		g.strokeRect(-20, -7, 40, 12);
		g.fillStyle = '#a0201a';
		g.font = 'bold 7px "DejaVu Sans Mono", monospace';
		g.textAlign = 'center';
		g.fillText('CLOSED', 0, 2);
		g.restore();
	}
};

// ------------------------------------------------------------------ camera, sky

const Cam: React.FC<{t: number}> = ({t}) => {
	const {camera} = useThree();
	const {s, k, u} = shotAt(t);
	const to = s.to ?? s.from;
	const p = mix3(s.from.p, to.p, k);
	const l = mix3(s.from.l, to.l, k);
	const b = s.mode === 'tent' || s.mode === 'desk' ? 0.003 : 0.012;
	camera.position.set(p[0] + Math.sin(u * 0.9) * b, p[1] + Math.sin(u * 1.3) * b, p[2]);
	camera.up.set(0, 1, 0);
	camera.lookAt(...l);
	(camera as THREE.PerspectiveCamera).fov = s.fov ?? 50;
	(camera as THREE.PerspectiveCamera).far = 500;
	camera.updateProjectionMatrix();
	return null;
};

const SKY: Record<Mode, string> = {tent: '#0c1220', dusk: '#4a4a66', day: '#9aa0aa', spring: '#a8b0b4', night: '#0c1220', desk: '#060504'};
const Atmos: React.FC<{mode: Mode}> = ({mode}) => {
	const {scene} = useThree();
	const bg = new THREE.Color(SKY[mode]);
	if (!scene.fog) scene.fog = new THREE.Fog(bg, 10, 70);
	const f = scene.fog as THREE.Fog;
	f.color.copy(bg);
	f.near = mode === 'desk' ? 5 : 20;
	f.far = mode === 'desk' ? 20 : mode === 'day' || mode === 'spring' ? 170 : 130;
	scene.background = bg;
	return null;
};

// ------------------------------------------------------------------ the world at time t

const HIKERS: {x: number; z: number; yaw: number; arm: number}[] = [
	{x: -2.6, z: 0.6, yaw: 0.3, arm: 1.2}, {x: -2.2, z: 1.6, yaw: -0.4, arm: 0.4}, {x: -1.0, z: 2.1, yaw: 1.2, arm: 1.4}, {x: 0.2, z: 2.3, yaw: 1.6, arm: 0.3},
	{x: 1.3, z: 2.0, yaw: 2.2, arm: 1.3}, {x: 2.4, z: 1.4, yaw: 2.8, arm: 0.5}, {x: 2.9, z: 0.1, yaw: 3.2, arm: 1.1}, {x: 2.6, z: -1.5, yaw: -2.6, arm: 0.4}, {x: -2.9, z: -1.2, yaw: -0.6, arm: 1.0},
];

const World: React.FC<{t: number; file: THREE.Texture}> = ({t, file}) => {
	const {s, u} = shotAt(t);
	const mode = s.mode;
	const tentShot = mode === 'tent';
	// the cut: on the hook (and its loop copy) it opens from a blade already in the canvas
	const cutOpen = s.id.startsWith('A_') ? lin(u, K.loopOn - DUR - 0.2, 4.6, 0.0, 1) : s.id === 'J_inside' ? 0 : s.id === 'B_camp_dusk' || s.id === 'B2_camp_close' || s.id.startsWith('H') ? 0 : 1;
	const knifeY = s.id.startsWith('A_') ? lin(u, K.loopOn - DUR, 3.6, 1.0, 0.25) : null;
	const flap = Math.sin(t * 5.3) * Math.sin(t * 2.1);
	const buried = s.id === 'C_tent_found' ? 1 : s.id === 'I_tent_alone' ? 0.6 : 0;
	const slabK = s.id === 'H1_slab_side' ? sm(t, K.slab, K.slab + 2.0) : 0;
	const ambient = {tent: 0.4, dusk: 1.0, day: 1.5, spring: 1.6, night: 0.7, desk: 0.3}[mode];
	const ambCol = {tent: '#4a5470', dusk: '#8a84a8', day: '#a8acb4', spring: '#b0b8b8', night: '#4a5880', desk: '#806a50'}[mode];
	const out = mode !== 'tent' && mode !== 'desk';
	const torch = 0.85 + 0.15 * Math.sin(t * 17) * Math.sin(t * 6.1);
	return (
		<>
			<Atmos mode={mode} />
			<ambientLight intensity={ambient} color={ambCol} />
			<hemisphereLight args={['#a0a8c0', '#d8dce4', out ? 0.6 : 0.1]} />
			{(mode === 'night' || mode === 'tent') && <directionalLight position={[-40, 60, 80]} intensity={mode === 'tent' ? 0.9 : 0.8} color="#a8b8e0" />}
			{mode === 'dusk' && <directionalLight position={[80, 20, 40]} intensity={0.6} color="#d0a0a0" />}
			{(mode === 'day' || mode === 'spring') && <directionalLight position={[30, 50, 60]} intensity={0.7} color="#e0e4ea" />}
			{/* inside the tent: a torch lying on the floor */}
			{tentShot && <pointLight position={[0.1, 0.3, 0.05]} intensity={5.5 * torch} distance={3.5} decay={1.2} color="#ffc070" />}
			{/* the desk lamp */}
			{mode === 'desk' && <pointLight position={[199.6, 0.8, 199.8]} intensity={4} distance={3} decay={1.2} color="#ffd8a0" />}
			{/* the hikers' torches at dusk */}
			{(s.id === 'B_camp_dusk' || s.id === 'B2_camp_close') && (
				<>
					<pointLight position={[-1.5, gy(0) + 1.5, 1.4]} intensity={4 * torch} distance={7} decay={1.3} color="#ffb060" />
					<pointLight position={[2.0, gy(0) + 1.5, 1.2]} intensity={4 * torch} distance={7} decay={1.3} color="#ffb060" />
				</>
			)}
			<Slope printsOn={s.id !== 'B_camp_dusk' && s.id !== 'B2_camp_close' && !s.id.startsWith('H') && !tentShot} />
			<Tent open={cutOpen} buried={buried} flap={flap} />
			<Cedar />
			<Ravine thaw={mode === 'spring' ? 1 : 0} />
			{s.id.startsWith('H') && <Slab k={slabK} />}
			<CaseFile map={file} />
			{knifeY !== null && <KnifeHand p={[0.4, knifeY, 0.95 * (1 - knifeY / 1.2) - 0.03]} />}
			{(s.id === 'B_camp_dusk' || s.id === 'B2_camp_close') &&
				HIKERS.map((h, i) => {
					const pose: Pose = {yaw: h.yaw, armR: [h.arm, -0.4], armL: [0.2 + Math.sin(t * 1.3 + i) * 0.1, -0.3], head: [Math.sin(t * 0.7 + i) * 0.3, 0.05], step: i % 3 === 0 ? t * 3 + i : 0};
					return (
						<group key={i}>
							<Human pose={pose} pos={[h.x, gy(h.z), h.z]} look={HIKER} />
							{h.arm > 1 && (
								<mesh position={[h.x + Math.cos(h.yaw) * 0.45, gy(h.z) + 1.75, h.z - Math.sin(h.yaw) * 0.45]}>
									<boxGeometry args={[0.07, 0.07, 0.07]} />
									<meshBasicMaterial color="#ffd080" />
								</mesh>
							)}
						</group>
					);
				})}
			{/* hidden: a faint orange light in the sky beyond the treeline, seen through the cut */}
			{tentShot && (
				<mesh position={[40, gy(250) + 70, 250]}>
					<sphereGeometry args={[2.4, 6, 4]} />
					<meshBasicMaterial color="#c0703a" transparent opacity={0.55} fog={false} />
				</mesh>
			)}
			{out && <Snowfall centre={new THREE.Vector3(...(s.from.p as V3))} t={u} amount={mode === 'spring' ? 0.15 : mode === 'night' || mode === 'dusk' ? 1 : 0.5} />}
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: captions + tape

const Overlay: React.FC<{t: number; damage: number; captions: boolean}> = ({t, damage, captions}) => {
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
	}, [t, damage, captions]);
	return (
		<>
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

// ------------------------------------------------------------------ assembly

export const Episode05: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const file = useCanvasTex(72, 96);
	drawFile(file.g, t);
	file.t.needsUpdate = true;
	const damage = t >= K.slab + 1.6 && t < K.slab + 2.0 ? 0.5 : 0.05;
	const ca = 0.6 + damage * 2;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="tape5" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'url(#tape5)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.02, far: 500}} style={{imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Cam t={t} />
						<World t={t} file={file.t} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			<Overlay t={t} damage={damage} captions={captions} />
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep05-tent-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
