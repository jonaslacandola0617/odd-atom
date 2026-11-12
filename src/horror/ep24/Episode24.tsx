// Episode 24: "They Turn Their Heads" (Season 3, a real reported case: the Island of the Dolls,
// Xochimilco, Mexico City). Built to the motion rule: ONE gliding first-person boat ride, there and
// back, at dusk in fog, like a visitor's phone video; no transitions at all.
// The picture tells it: dolls hang from the trees facing the water; one turns its head as you pass;
// the boat turns round; on the way back the same dolls all face you, and one floats beside the boat;
// the camera tilts down to the black water and the reflection shows a doll hanging right above you;
// "Don't look up." It looks up: the doll, upside down, inches from the lens. Black. Loop.
// Care: the girl and Don Julian are never shown; his death is one line, as his family reports it;
// the drowning legend is told as unverified. A working, family-run site: no dares.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep24-dolls-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {Bow, Canal, Doll, Floater, Hanging, MatsProvider, useM, V3} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep24Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));

// key times (scripts/ep24_sound.py uses the same rules)
export const K = {
	oneTurns: [L.l04.end + 0.15, L.l05.end + 0.6] as [number, number], // a doll turns its head as we pass
	turnBoat: [L.l06.end + 0.3, L.l07.end + 0.4] as [number, number], // the boat turns round
	back: L.l07.end + 0.4,
	tiltDown: [L.l08.end + 0.1, L.l09.start - 0.1] as [number, number],
	tiltUp: [L.l09.end + 0.15, L.l09.end + 0.55] as [number, number],
	black: DUR - 0.55,
};
export const STINGERS = [K.tiltUp[1]];

// the boat's path: out along the canal (x 0.8, z +6 -> -32), turn, back closer to the bank (x -0.9)
const Z_TURN = -32;
const boatAt = (t: number): {p: V3; yaw: number} => {
	if (t < K.turnBoat[0]) {
		const k = lin(t, 0, K.turnBoat[0]);
		return {p: [-1.1, 0, 6 + (Z_TURN - 6) * k], yaw: 0};
	}
	if (t < K.back) {
		const k = ease(lin(t, K.turnBoat[0], K.back));
		return {p: [-1.1 + 1.6 * Math.sin(Math.PI * k) - 0.6 * k, 0, Z_TURN - 1.2 * Math.sin(Math.PI * k)], yaw: -Math.PI * k};
	}
	const k = lin(t, K.back, DUR);
	return {p: [-1.7, 0, Z_TURN + 8 * k], yaw: -Math.PI};
};
// where the camera looks, relative to the boat's heading: left towards the island, and down / up at the end
const lookAt = (t: number): {yawOff: number; pitch: number} => {
	let yawOff = 0.45 + 0.12 * Math.sin(t * 0.35); // towards the island on our left
	if (t >= K.back) yawOff = -0.55 + 0.1 * Math.sin(t * 0.4); // on the way back the island is on our right
	yawOff += (-0.75 - yawOff) * ease(lin(t, K.tiltDown[0], K.tiltDown[1])); // over the side, to the water
	if (t >= K.turnBoat[0] && t < K.back) yawOff = 0.2;
	let pitch = -0.05 + (t > L.l03.start && t < L.l04.end ? 0.18 : 0); // look up into the trees as they pass
	// the doll hangs 0.75 m above the lens and 0.3 m ahead: its reflection is about 84 degrees down, the doll itself about 68 degrees up
	pitch += (-1.47 - pitch) * ease(lin(t, K.tiltDown[0], K.tiltDown[1]));
	pitch += (1.19 - pitch) * ease(lin(t, K.tiltUp[0], K.tiltUp[1]));
	return {yawOff, pitch};
};

const Cam: React.FC<{t: number}> = ({t}) => {
	const {camera} = useThree();
	const b = boatAt(t);
	const {yawOff, pitch} = lookAt(t);
	const h = handheld(t, 1.1);
	const bob = Math.sin(t * 1.3) * 0.02;
	camera.position.set(b.p[0] + h.dp[0], 1.3 + bob + h.dp[1], b.p[2] + h.dp[2]);
	const yaw = b.yaw + yawOff;
	camera.rotation.order = 'YXZ';
	camera.rotation.set(pitch, yaw, h.roll * 1.5);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = 58;
	c.near = 0.03;
	c.far = 140;
	camera.updateProjectionMatrix();
	return null;
};

const Atmos: React.FC = () => {
	const {scene} = useThree();
	const bg = new THREE.Color('#3a403a');
	if (!scene.fog) scene.fog = new THREE.Fog(bg, 5, 42);
	scene.background = bg;
	return null;
};

/** the doll that hangs right above the boat at the end (seen first in the water, then looking up) */
const Overhead: React.FC<{p: V3; t: number}> = ({p, t}) => {
	const m = useM();
	return (
		<group position={[p[0], 2.1, p[2]]}>
			<mesh position={[0, 0.5, 0]} material={m.string}>
				<boxGeometry args={[0.006, 1.0, 0.006]} />
			</mesh>
			{/* hung by its feet, upside down, face turned down to the boat */}
			<group rotation={[Math.PI / 2, 0, Math.sin(t * 0.8) * 0.06]}>
				<Doll spec={{kind: 'whole', skin: 0, dress: 1, eyes: 2, hair: false, size: 1.6, limbs: 3}} yaw={0} swing={0} m={m} />
			</group>
		</group>
	);
};

const World: React.FC<{t: number}> = ({t}) => {
	const b = boatAt(t);
	const backHome = t >= K.back;
	const turn = (i: number, h: Hanging) => {
		if (backHome) return 1; // on the way back, all of them face the boat
		if (i === 7) return 1; // one already faces you at frame 0 (a hidden detail)
		// one doll beside the boat turns its head as we pass, in plain sight
		const dz = h.p[2] - b.p[2];
		if (h.p[1] < 2.6 && dz < -0.5 && dz > -5 && t > K.oneTurns[0] && i % 9 === 4) return ease(lin(t, K.oneTurns[0], K.oneTurns[1]));
		return 0;
	};
	const wind = 1 + 0.6 * Math.max(0, Math.sin(t * 0.21));
	const overhead = t >= K.tiltDown[0] - 0.5;
	const Y = b.yaw - 0.75; // the camera's heading during the tilts
	const ov: V3 = [b.p[0] - Math.sin(Y) * 0.3, 0, b.p[2] - Math.cos(Y) * 0.3];
	const m = useM();
	return (
		<>
			<Cam t={t} />
			<Atmos />
			<ambientLight intensity={1.6} color="#7a8478" />
			<directionalLight position={[-60, 10, -80]} intensity={0.6} color="#d89a5a" />
			<Canal t={t} boat={b.p} turn={turn} wind={wind} />
			{/* the world reflected in the black water (seen through it) */}
			<Canal t={t} boat={b.p} turn={turn} wind={wind} mirror />
			{overhead && <Overhead p={ov} t={t} />}
			{overhead && (
				<group scale={[1, -1, 1]}>
					<Overhead p={ov} t={t} />
				</group>
			)}
			<mesh position={[0.2, 0.0, -20]} rotation={[-Math.PI / 2, 0, 0]} material={m.water}>
				<planeGeometry args={[7.6, 90, 8, 40]} />
			</mesh>
			{backHome && <Floater p={[b.p[0] + 0.75, 0.05, b.p[2] + 0.4 + Math.sin(t) * 0.05]} yaw={0.4} m={m} />}
			{/* our boat's bow, carried with the boat (heading only) */}
			<group position={[b.p[0], 1.3, b.p[2]]} rotation={[0, b.yaw, 0]}>
				<Bow />
			</group>
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: captions, a phone's grain
const Overlay: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
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
		const n = noise.current!.getContext('2d')!;
		const ni = n.createImageData(LW, LH);
		const r = rng(Math.floor(t * 30) * 7919 + 24);
		for (let i = 0; i < LW * LH; i++) {
			const v = r() * 255;
			ni.data[i * 4] = ni.data[i * 4 + 1] = ni.data[i * 4 + 2] = v;
			ni.data[i * 4 + 3] = 16 * (r() < 0.5 ? 1 : 0.4);
		}
		n.putImageData(ni, 0, 0);
	}, [t, captions]);
	return (
		<>
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

// ------------------------------------------------------------------ assembly
export const Episode24: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	// a phone's auto-exposure: it brightens a little as the light drops, then the black at the end
	const black = t >= K.black;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			{!black && (
				<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'saturate(0.75) contrast(1.08)'}}>
					<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 58, near: 0.03, far: 140}} style={{imageRendering: 'pixelated'}}>
						<MatsProvider>
							<World t={t} />
						</MatsProvider>
					</ThreeCanvas>
				</div>
			)}
			{!black && <Overlay t={t} captions={captions} />}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep24-dolls-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
