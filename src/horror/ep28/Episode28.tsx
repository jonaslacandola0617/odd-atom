// Episode 28: "Developing" (Season 3, a real documented photograph: the Brown Lady of Raynham Hall,
// Norfolk, 19 September 1936). Built to the motion rule and the no-gimmick-transitions rule.
// Form: two times, cut hard against each other: the staircase hall in 1936 (black and white, lit by
// a lamp, then by magnesium flash) and the darkroom (red safelight), where the print develops.
// The picture tells it: the print surfaces in the tray (a staircase, a pale shape); the house at
// night, a motor car's headlights across its front; in the hall the view camera, the first flash,
// nothing on the stairs; on the ground glass under the focusing cloth (upside down, as a view camera
// sees) a pale vapour at the top of the stairs comes down and becomes a woman in a veil; the flash:
// she is lit on the stairs; the lamp: the stairs are empty, the photographer lifts his head; the
// darkroom: she comes up out of the paper; the staircase by moonlight, a figure on the landing
// against the window, then not; the print in the stop bath keeps developing, and she comes down the
// stairs in it to the lens; the hall, a last flash: she is at the lens. Black.
// Care: no living person; the photographers are seen from behind and not named on screen; the
// skeptics' explanations are said; the house is a private home.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep28-brown-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {ASSISTANT_AT, Assistant, CAMERA_AT, DARK, Darkroom, drawPrint, EXT, FLASH_AT, Hall, House, Lady, MatsProvider, RISE, RUN, stairAt, TREADS, V3, ViewCamera} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep28Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));

// ------------------------------------------------------------------ key times (scripts/ep28_sound.py uses the same rules)
export const K = {
	cutExt: L.l02.start - 0.4,
	cutHall: L.l03.start - 0.4,
	flash1: L.l03.end + 0.35, // the first photograph: nothing on the stairs
	cutGlass: L.l04.start - 0.3,
	vapour: L.l04.start + 1.6, // the assistant sees something at the top of the stairs
	cutFlash: L.l04.end + 0.25,
	flash2: L.l05.start - 0.6, // the second photograph
	lampOn: L.l05.start + 0.9,
	headUp: [L.l05.end - 1.6, L.l05.end - 0.6] as [number, number],
	cutDark2: L.l06.start - 0.3,
	toStop: L.l07.end + 0.2, // the tongs move the print to the stop bath
	cutStair2: L.l08.start - 0.4,
	landing: [L.l08.start + 1.2, L.l08.start + 2.9] as [number, number],
	cutDark3: L.l09.start - 0.5,
	cutFinal: L.l09.end + 1.9,
	flash3: L.l09.end + 2.2,
	black: L.l09.end + 2.9,
};
export const STINGERS = [K.flash1, K.flash2, K.flash3];

type Shot = 'dark1' | 'ext' | 'hall' | 'glass' | 'flash' | 'dark2' | 'stair2' | 'dark3' | 'final' | 'black';
const shotAt = (t: number): Shot => {
	if (t < K.cutExt) return 'dark1';
	if (t < K.cutHall) return 'ext';
	if (t < K.cutGlass) return 'hall';
	if (t < K.cutFlash) return 'glass';
	if (t < K.cutDark2) return 'flash';
	if (t < K.cutStair2) return 'dark2';
	if (t < K.cutDark3) return 'stair2';
	if (t < K.cutFinal) return 'dark3';
	if (t < K.black) return 'final';
	return 'black';
};
const flashLevel = (t: number, at: number) => (t < at ? 0 : Math.exp(-(t - at) * 7));

// ------------------------------------------------------------------ cameras
type CamPose = {p: V3; l: V3; fov: number; roll?: number};
const Cam: React.FC<{pose: CamPose}> = ({pose}) => {
	const {camera} = useThree();
	camera.position.set(...pose.p);
	camera.up.set(Math.sin(pose.roll ?? 0), Math.cos(pose.roll ?? 0), 0);
	camera.lookAt(...pose.l);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = pose.fov;
	c.near = 0.03;
	c.far = 2000;
	camera.updateProjectionMatrix();
	return null;
};
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const stairEye = (z: number) => (z >= 0 ? 0 : Math.min(TREADS, Math.floor(-z / RUN) + 1) * RISE) + 1.62;

const poseAt = (t: number, shot: Shot): CamPose => {
	const h = handheld(t, 1.0);
	const hp = (p: V3): V3 => [p[0] + h.dp[0], p[1] + h.dp[1], p[2] + h.dp[2]];
	switch (shot) {
		case 'dark1':
		case 'dark2':
		case 'dark3': {
			const t0 = shot === 'dark1' ? 0 : shot === 'dark2' ? K.cutDark2 : K.cutDark3;
			const t1 = shot === 'dark1' ? K.cutExt : shot === 'dark2' ? K.cutStair2 : K.cutFinal;
			const k = ease(lin(t, t0, t1));
			const tray = shot === 'dark3' || (shot === 'dark2' && t > K.toStop) ? 0 : -0.45;
			const trayX = shot === 'dark2' ? interpolate(t, [K.toStop - 0.3, K.toStop + 0.9], [-0.45, 0], {...cl, easing: ease}) : tray;
			const low = shot === 'dark3' ? 0.62 - 0.22 * k : 0.75 - 0.15 * k;
			return {p: hp([DARK[0] + trayX, 0.95 + low, 0.05 + 0.18 - 0.1 * k]), l: [DARK[0] + trayX, 0.93, 0.05], fov: 46, roll: h.roll};
		}
		case 'ext': {
			const k = lin(t, K.cutExt, K.cutHall);
			return {p: [EXT[0] - 26 + 8 * k, 3.2, 44 - 8 * k], l: [EXT[0] - 6 + 3 * k, 6.5, 0], fov: 52};
		}
		case 'hall': {
			const k = ease(lin(t, K.cutHall, K.cutGlass));
			return {p: hp([2.8 - 0.8 * k, 1.9, 9.8 - 0.6 * k]), l: [0.1, 1.5, 1.5], fov: 56, roll: h.roll};
		}
		case 'glass': {
			// the view camera's own view, upside down and reversed, as on its ground glass
			const k = lin(t, K.cutGlass, K.cutFlash);
			const p = add(CAMERA_AT, [0, 1.55, -0.33]);
			const tgt = add(stairAt(0.42), [0, 1.0, 0]);
			return {p, l: tgt, fov: 48 - 10 * k, roll: Math.PI};
		}
		case 'flash': {
			const k = lin(t, K.cutFlash, K.cutDark2);
			return {p: hp([0.95, 1.7, 6.3 - 0.5 * k]), l: add(stairAt(0.5), [0, 1.0, 0]), fov: 52, roll: h.roll};
		}
		case 'stair2': {
			const k = lin(t, K.cutStair2, K.cutDark3);
			const z = 1.6 - 4.4 * k;
			const bob = Math.abs(Math.sin(t * 4.2)) * 0.035;
			return {p: hp([0.2, stairEye(z) + bob, z]), l: [0, stairEye(z) + 1.9, z - 6], fov: 56, roll: h.roll};
		}
		case 'final':
		case 'black':
			return {p: add(CAMERA_AT, [0, 1.55, -0.4]), l: add(CAMERA_AT, [0, 1.62, -3]), fov: 50};
		default:
			return {p: [0, 1.6, 0], l: [0, 1.6, -1], fov: 50};
	}
};

/** where the lady is, and how solid */
const ladyAt = (t: number, shot: Shot): {p: V3; solid: number; face?: boolean} | null => {
	if (shot === 'glass' && t >= K.vapour) {
		const k = lin(t, K.vapour, K.cutFlash);
		return {p: stairAt(0.04 + 0.42 * ease(k)), solid: ease(lin(t, K.vapour, K.cutFlash - 0.8))};
	}
	if (shot === 'flash' && t >= K.flash2 - 0.02 && t < K.flash2 + 0.5) return {p: stairAt(0.5), solid: 1};
	if (shot === 'stair2' && t >= K.landing[0] && t < K.landing[1]) return {p: [0, TREADS * RISE, -TREADS * RUN - 1.6], solid: 1};
	if (shot === 'final' && t >= K.flash3 - 0.1) return {p: add(CAMERA_AT, [0, 0, -1.25]), solid: 1, face: true};
	return null;
};

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{t: number; print: THREE.CanvasTexture}> = ({t, print}) => {
	const shot = shotAt(t);
	if (shot === 'black') return null;
	const pose = poseAt(t, shot);
	const lady = ladyAt(t, shot);
	if (shot === 'dark1' || shot === 'dark2' || shot === 'dark3') {
		const inStop = shot === 'dark3' || (shot === 'dark2' && t > K.toStop);
		const lift = shot === 'dark2' ? Math.sin(Math.PI * lin(t, K.toStop - 0.3, K.toStop + 0.6)) : 0;
		const tongs: V3 = shot === 'dark2' ? [interpolate(t, [K.toStop - 0.6, K.toStop + 0.9], [-0.55, 0.1], cl), 1.0 + 0.12 * lift, 0.2] : [-0.2, 1.0, 0.3];
		const safe = shot === 'dark3' && t > K.cutFinal - 0.5 ? (Math.floor(t * 20) % 3 === 0 ? 0.2 : 1) : 1;
		return (
			<>
				<Cam pose={pose} />
				<ambientLight intensity={0.4 * safe} color="#ff3020" />
				<pointLight position={[DARK[0] - 0.6, 1.9, -0.3]} intensity={3.5 * safe} distance={3} decay={1} color="#ff2a18" />
				<MatsProvider>
					<Darkroom print={print} rock={0.05 * Math.sin(t * 2.4)} inTray={inStop ? 1 : 0} tongs={tongs} />
				</MatsProvider>
			</>
		);
	}
	if (shot === 'ext') {
		const k = lin(t, K.cutExt, K.cutHall);
		const car: V3 = [EXT[0] - 30 + 22 * ease(k), 0, 36 - 22 * ease(k)];
		const yaw = -0.72;
		const fwd: V3 = [-Math.sin(yaw), 0, -Math.cos(yaw)];
		return (
			<>
				<Cam pose={pose} />
				<ambientLight intensity={0.9} color="#8a9ab0" />
				<pointLight position={[EXT[0] - 120, 120, -300]} intensity={0.35} decay={0} color="#c8d0e0" />
				{[-0.55, 0.55].map((x) => (
					<CarLamp key={x} p={[car[0] + x * Math.cos(yaw) + fwd[0] * 2.1, 0.95, car[2] - x * Math.sin(yaw) + fwd[2] * 2.1]} dir={fwd} />
				))}
				<MatsProvider>
					<House car={car} carYaw={yaw} headlights />
				</MatsProvider>
			</>
		);
	}
	// the hall: lamp, moonlight from the landing window, and the flashes
	const f = flashLevel(t, K.flash1) + flashLevel(t, K.flash2) + flashLevel(t, K.flash3);
	const lamp = shot === 'hall' || shot === 'glass' || (shot === 'flash' && t >= K.lampOn);
	const assistantRaise = shot === 'hall' ? lin(t, K.flash1 - 1.4, K.flash1 - 0.6) : shot === 'flash' ? (t < K.lampOn ? 1 : 1 - lin(t, K.lampOn, K.lampOn + 0.8)) : 0.2;
	return (
		<>
			<Cam pose={pose} />
			<ambientLight intensity={(shot === 'hall' ? 0.22 : 0.1) + 0.2 * Math.min(1, f)} color="#b8b8c0" />
			{lamp && <pointLight position={[-2.6, 1.7, 2.2]} intensity={7} distance={14} decay={1} color="#ffd8a0" />}
			{lamp && <pointLight position={[-0.9, 3.4, -3.2]} intensity={4} distance={7} decay={1} color="#ffd8a0" />}
			<pointLight position={[0, TREADS * RISE + 2.0, -TREADS * RUN - 2.3]} intensity={shot === 'stair2' ? 4 : 1.2} distance={9} decay={1} color="#a0b0d0" />
			{f > 0.01 && <pointLight position={FLASH_AT} intensity={(shot === 'final' ? 22 : 60) * f} distance={30} decay={1} color="#ffffff" />}
			<MatsProvider>
				<Hall lamp={lamp} />
				{shot !== 'stair2' && shot !== 'glass' && shot !== 'final' && <ViewCamera withMan headUp={shot === 'flash' ? ease(lin(t, K.headUp[0], K.headUp[1])) : 0} />}
				{(shot === 'hall' || shot === 'flash') && <Assistant p={ASSISTANT_AT} raise={assistantRaise} />}
				{lady && <Lady p={lady.p} ry={0} solid={lady.solid} face={lady.face} />}
			</MatsProvider>
		</>
	);
};

const CarLamp: React.FC<{p: V3; dir: V3}> = ({p, dir}) => {
	const light = useMemo(() => new THREE.SpotLight('#fff4d8', 30, 90, 0.35, 0.5, 1.0), []);
	light.position.set(...p);
	light.target.position.set(p[0] + dir[0] * 20, p[1] - 0.3, p[2] + dir[2] * 20);
	light.target.updateMatrixWorld();
	return (
		<>
			<primitive object={light} />
			<primitive object={light.target} />
		</>
	);
};

// ------------------------------------------------------------------ the print, developing
const printState = (t: number, shot: Shot) => {
	if (shot === 'dark1') return {dev: 0.3 + 0.62 * lin(t, 0, K.cutExt - 0.6), pos: 0.5, fig: 1};
	if (shot === 'dark2') return {dev: 0.05 + 0.85 * lin(t, K.cutDark2, L.l07.end), pos: 0.5, fig: 1};
	// the stop bath: it should stop; it keeps developing, and she comes down the stairs to the lens
	return {dev: 0.9 + 0.1 * lin(t, K.cutDark3, K.cutFinal), pos: interpolate(t, [K.cutDark3 + 0.4, K.cutFinal - 0.2], [0.5, 1.0], {...cl, easing: (x) => x * x}), fig: 1};
};

// ------------------------------------------------------------------ 2D overlay: captions, grain, the ground glass
const Overlay: React.FC<{t: number; captions: boolean; shot: Shot}> = ({t, captions, shot}) => {
	const cap = useRef<HTMLCanvasElement>(null);
	const noise = useRef<HTMLCanvasElement>(null);
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
		if (shot === 'glass') {
			// the focusing cloth around the ground glass, and its grid
			g.fillStyle = '#000';
			g.fillRect(0, 0, CW, 80);
			g.fillRect(0, CH - 110, CW, 110);
			g.fillRect(0, 0, 30, CH);
			g.fillRect(CW - 30, 0, 30, CH);
			g.strokeStyle = 'rgba(220,220,220,0.95)';
			g.lineWidth = 1;
			g.strokeRect(30.5, 80.5, CW - 61, CH - 191);
			for (let i = 1; i < 3; i++) {
				g.beginPath();
				g.moveTo(30 + ((CW - 60) * i) / 3, 80);
				g.lineTo(30 + ((CW - 60) * i) / 3, CH - 110);
				g.stroke();
				g.beginPath();
				g.moveTo(30, 80 + ((CH - 190) * i) / 3);
				g.lineTo(CW - 30, 80 + ((CH - 190) * i) / 3);
				g.stroke();
			}
		}
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
			show.forEach((r, i) => out(r, CW / 2, 572 + i * 19 - (show.length - 1) * 19, '#ffffff'));
		}
		const img = g.getImageData(0, 0, CW, CH);
		for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 120 ? 255 : 0;
		g.putImageData(img, 0, 0);
		const n = noise.current!.getContext('2d')!;
		const ni = n.createImageData(LW, LH);
		const r = rng(Math.floor(t * 24) * 7919 + 28);
		for (let i = 0; i < ni.data.length; i += 4) {
			const v = r() * 255;
			ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = v;
			ni.data[i + 3] = 26 * (r() < 0.5 ? 1 : 0.4);
		}
		// dust and a scratch on the old film
		for (let k = 0; k < 4; k++) {
			const x = Math.floor(r() * LW), y = Math.floor(r() * LH);
			const i = (y * LW + x) * 4;
			ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = r() < 0.5 ? 0 : 255;
			ni.data[i + 3] = 200;
		}
		n.putImageData(ni, 0, 0);
	}, [t, captions, shot]);
	return (
		<>
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

// ------------------------------------------------------------------ assembly
export const Episode28: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const shot = shotAt(t);
	const print = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = 48;
		c.height = 64;
		const tx = new THREE.CanvasTexture(c);
		tx.magFilter = THREE.NearestFilter;
		tx.minFilter = THREE.NearestFilter;
		tx.generateMipmaps = false;
		tx.colorSpace = THREE.SRGBColorSpace;
		return tx;
	}, []);
	if (shot === 'dark1' || shot === 'dark2' || shot === 'dark3') {
		const ps = printState(t, shot);
		drawPrint(print.image.getContext('2d') as CanvasRenderingContext2D, 48, 64, ps.dev, ps.pos, ps.fig);
		print.needsUpdate = true;
	}
	const dark = shot === 'dark1' || shot === 'dark2' || shot === 'dark3';
	const gate = 0.6 * Math.sin(t * 9.1) + 0.4 * Math.sin(t * 23.7);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: gate, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: dark ? 'contrast(1.15)' : 'grayscale(1) sepia(0.18) contrast(1.22) brightness(1.04)'}}>
				{shot !== 'black' && (
					<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.03, far: 2000}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
						<Scene t={t} print={print} />
					</ThreeCanvas>
				)}
			</div>
			{shot !== 'black' && <Overlay t={t} captions={captions} shot={shot} />}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.8) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep28-brown-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
