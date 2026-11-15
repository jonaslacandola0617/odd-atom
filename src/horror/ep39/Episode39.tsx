// Episode 39: "Sino ang Susundo" (Season 4, Filipino folk belief: the sundo, the dead who come to fetch the
// dying). Taglish, Juanito, told by the son. Built to the motion rule; hard cuts only; an eerie score; a
// seamless loop (the last shot is the first shot, on negative time).
// Form: "the nights". Four nights, each a hard cut that opens on the same slow push across the ward
// toward the bed, a little closer each night, as if the camera were the visitor. Day never comes.
// The picture: from the doorway, my chair by Tatay's bed, and across the bed the other chair, with
// someone in it (hook); the ward, the push; night 1, Tatay smiles at the empty doorway; night 2, the
// drip, and on the wall beside its shadow a woman's; night 3, I sleep, and the other chair slides nearer;
// night 4, his hand takes mine; "she's here, but it's not me she's fetching", his eyes past me; I turn:
// Nanay in the doorway, looking at me. Then the doorway view of the bed again (loop).
// Care: no real hospital; the father's death is not shown; grief treated tenderly; the fetcher is
// loving; nothing claims the son will die: it ends on her look.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep39-sundo-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {Bed, Chair, DOOR, FAR_CHAIR0, HEAD, MatsProvider, Me, MY_CHAIR, Nanay, V3, Ward} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep39Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep39_sound.py uses the same rules)
export const K = {
	cutWard: L.l02.start - 0.3,
	cutN1: L.l03.start - 0.3,
	smile: [L.l03.start + 1.0, L.l03.start + 2.0] as [number, number],
	cutN2: L.l04.start - 0.3,
	shadow: [L.l04.start + 2.6, L.l04.end + 0.2] as [number, number], // a woman's shadow beside the drip's
	cutN3: L.l05.start - 0.3,
	slide: [L.l05.end - 0.4, L.l05.end + 0.4] as [number, number], // the other chair slides nearer
	cutN4: L.l06.start - 0.3,
	reach: [L.l06.start + 1.4, L.l06.end] as [number, number],
	cutWhisper: L.l07.start - 0.3,
	cutTurn: L.l07.end + 0.4,
	turned: L.l07.end + 1.0, // Nanay in the doorway
	loopShot: DUR - 1.7,
};
export const STINGERS = [K.turned];

type Shot = 'hook' | 'ward' | 'n1' | 'n2' | 'n3' | 'n4' | 'whisper' | 'turn';
const shotAt = (t: number): Shot => {
	if (t < K.cutWard) return 'hook';
	if (t < K.cutN1) return 'ward';
	if (t < K.cutN2) return 'n1';
	if (t < K.cutN3) return 'n2';
	if (t < K.cutN4) return 'n3';
	if (t < K.cutWhisper) return 'n4';
	if (t < K.cutTurn) return 'whisper';
	return 'turn';
};

// the other chair: across the bed, then nearer after night 3
const FAR_CHAIR1: V3 = [-0.62, 0, -0.15];
const farChair = (t: number, shot: Shot): V3 => {
	const k = shot === 'n3' ? ease(lin(t, K.slide[0], K.slide[1])) : shot === 'n4' || shot === 'whisper' || shot === 'turn' ? 1 : 0;
	return [FAR_CHAIR0[0] + (FAR_CHAIR1[0] - FAR_CHAIR0[0]) * k, 0, FAR_CHAIR0[2] + (FAR_CHAIR1[2] - FAR_CHAIR0[2]) * k];
};

// ------------------------------------------------------------------ cameras
type CamPose = {p: V3; l: V3; fov: number};
const Cam: React.FC<{pose: CamPose}> = ({pose}) => {
	const {camera} = useThree();
	camera.position.set(...pose.p);
	camera.up.set(0, 1, 0);
	camera.lookAt(...pose.l);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = pose.fov;
	c.near = 0.02;
	c.far = 60;
	camera.updateProjectionMatrix();
	return null;
};
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
// the visitor's push: from the doorway toward the bed, starting a little closer each night
const push = (t: number, t0: number, t1: number, a: V3, b: V3, la: V3, lb: V3, fov = 50): CamPose => {
	const k = ease(lin(t, t0, t1));
	const hh = handheld(t, 0.3);
	const p = mix3(a, b, k);
	return {p: [p[0] + hh.dp[0], p[1] + hh.dp[1], p[2]], l: mix3(la, lb, k), fov};
};

const poseAt = (t: number, shot: Shot): CamPose => {
	switch (shot) {
		case 'hook':
			return push(t, -2, K.cutWard, [0.2, 1.6, 3.2], [0.15, 1.5, 2.6], [-0.1, 0.75, -0.2], [-0.15, 0.75, -0.2], 62);
		case 'ward':
			return push(t, K.cutWard, K.cutN1, [0.2, 1.75, 3.4], [0.15, 1.6, 2.7], [0, 0.75, -0.3], [0, 0.75, -0.3], 60);
		case 'n1':
			return push(t, K.cutN1, K.cutN2, [0.25, 1.5, 2.6], [0.1, 1.2, 0.9], [0, 0.8, -0.5], HEAD, 46);
		case 'n2':
			return push(t, K.cutN2, K.cutN3, [0.25, 1.45, 2.3], [-0.1, 1.35, 0.7], [0, 0.9, -0.6], [-0.7, 1.3, -1.4], 48);
		case 'n3':
			return push(t, K.cutN3, K.cutN4, [0.05, 2.1, 2.4], [0.0, 1.9, 1.8], [0.0, 0.5, -0.15], [-0.1, 0.5, -0.15], 62);
		case 'n4':
			return push(t, K.cutN4, K.cutWhisper, [0.6, 1.3, 1.6], [0.85, 1.05, 0.55], [0.5, 0.7, -0.25], [0.65, 0.7, -0.25], 46);
		case 'whisper':
			return push(t, K.cutWhisper, K.cutTurn, [0.45, 1.2, -0.3], [0.35, 1.05, -0.45], HEAD, HEAD, 44);
		case 'turn': {
			// my eyes: from Tatay, a turn over my shoulder to the doorway; then a slow push toward her
			const turn = ease(lin(t, K.cutTurn + 0.1, K.turned));
			const p0: V3 = [MY_CHAIR[0] - 0.05, 1.15, MY_CHAIR[2]];
			const near = ease(lin(t, K.turned, K.loopShot));
			const door: V3 = [DOOR[0], 1.45, DOOR[2]];
			const l = mix3(HEAD, door, turn);
			return {p: [p0[0] - 0.15 * near, p0[1], p0[2] + 0.5 * near], l, fov: 50 - 14 * near};
		}
	}
};

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotAt(t);
	const pose = poseAt(t, shot);
	const flick = 0.93 + 0.07 * Math.sin(t * 13) * Math.sin(t * 5.1);
	const tubeFlick = shot === 'turn' && t > K.turned - 0.1 && t < K.turned + 0.15 ? 0 : 1;
	const fc = farChair(t, shot);
	return (
		<>
			<Cam pose={pose} />
			<ambientLight intensity={0.75} color="#8aa098" />
			<pointLight position={[0, 2.8, 0.2]} intensity={2.6 * flick * tubeFlick} distance={6} decay={1} color="#d8ffe8" />
			<pointLight position={[DOOR[0], 2.0, DOOR[2] + 0.9]} intensity={1.6} distance={3} decay={1} color="#b8d8c0" />
			{shot === 'turn' && <pointLight position={[DOOR[0], 1.5, DOOR[2] - 1.0]} intensity={1.4} distance={2} decay={1} color="#c8d8e0" />}
			<Ward shadowK={shot === 'n2' ? ease(lin(t, K.shadow[0], K.shadow[1])) : 0} tubeFlick={tubeFlick} />
			<Bed t={t} look={shot === 'whisper' ? 0.35 : shot === 'n4' ? 0.6 : 0} smile={shot === 'n1' ? ease(lin(t, K.smile[0], K.smile[1])) : 0}
				talk={(shot === 'n2' && t > L.l04.start + 1.4 && t < L.l04.end) || (shot === 'whisper' && t > L.l07.start && t < L.l07.end) ? 1 : 0}
				reach={shot === 'n4' ? ease(lin(t, K.reach[0], K.reach[1])) : shot === 'whisper' ? 1 : 0} breathe={shot === 'whisper' ? 0.5 : 1} />
			<Chair p={MY_CHAIR} ry={-Math.PI / 2} />
			<Chair p={fc} ry={Math.PI / 2} />
			{shot !== 'turn' && <Me asleep={shot === 'n3' ? 1 : 0} turn={0} />}
			{/* Nanay: in the far chair (the hook), in the doorway (the end) */}
			{shot === 'hook' && <Nanay pose="sit" p={[FAR_CHAIR0[0], 0, FAR_CHAIR0[2]]} ry={Math.PI / 2} bow={0.35} />}
			{shot === 'turn' && t > K.turned - 0.05 && <Nanay pose="stand" p={[DOOR[0], 0, DOOR[2] - 0.1]} ry={Math.PI} bow={-0.1} />}
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: captions, grain
const Overlay: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
	const cap = useRef<HTMLCanvasElement>(null);
	const noise = useRef<HTMLCanvasElement>(null);
	useLayoutEffect(() => {
		const CW = 360, CH = 640;
		const g = cap.current!.getContext('2d')!;
		g.clearRect(0, 0, CW, CH);
		const out = (s: string, x: number, y: number, fill: string) => {
			g.textAlign = 'center';
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
			show.forEach((r, i) => out(r, CW / 2, 512 + i * 19 - (show.length - 1) * 19, '#ffffff'));
		}
		const img = g.getImageData(0, 0, CW, CH);
		for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 120 ? 255 : 0;
		g.putImageData(img, 0, 0);
		const n = noise.current!.getContext('2d')!;
		const ni = n.createImageData(LW, LH);
		const r = rng(Math.floor(t * 24) * 7919 + 39);
		for (let i = 0; i < ni.data.length; i += 4) {
			const v = r() * 255;
			ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = v;
			ni.data[i + 3] = 20 * (r() < 0.5 ? 1 : 0.4);
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
export const Episode39: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	// the loop shot runs on negative time: the hook's own first moments
	const tv = t >= K.loopShot ? t - DUR : t;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'saturate(0.6) contrast(1.12) hue-rotate(-8deg)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.02, far: 60}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			<Overlay t={tv} captions={captions} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep39-sundo-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
