// Episode 21: "Watch the Chair" (Season 3, a real reported case: the Enfield poltergeist, north
// London, 1977). Season 3 rule: no shared template. This one is ONE unbroken, locked-off take in
// real time, as if a camera had been left running on a tripod in the back bedroom.
// Form and scare: misdirection. The hook tells you to watch the chair. The chair never moves while you
// can see it; it moves only during tape dropouts, nearer the far bed each time, turning to face it.
// Many small scares (knocks inside the wall, knocks that answer, a shadow crossing the landing light,
// a low rasp from the far bed, the clock that stops ticking), then the last frames: the landing light
// fails, comes back, and someone is sitting in the chair, facing the bed. A final dropout, and frame 0.
// Sound: diegetic only (no score), in scripts/ep21_sound.py.
// Hidden details: the clock turns 12:59 -> 1:00 as the narration says "one in the morning"; the
// chair moves only in dropouts; the far bed stops breathing during the rasp; a shadow crosses the
// landing light while everyone is in bed; the picture over the far bed ends crooked.
// Care: the children are never named or shown (blanket shapes); the skeptics' view is given; no real
// recording is used; the figure is a silhouette from behind.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep21-chair-v1-timeline.json';
import {rng} from '../ps1';
import {Bedroom, CHAIR, clockTex, MatsProvider, V3} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep21Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));

// key times, all from the real line times (scripts/ep21_sound.py uses the same rules)
const DROP = 5 / 30; // a dropout lasts five frames
export const K = {
	car: L.l01.end + 0.3, // headlights sweep the ceiling (1.6 s)
	knocks: [L.l03.end + 0.5, L.l03.end + 0.9, L.l03.end + 1.3],
	minute: L.l04.start + 2.0, // the clock turns 1:00 as "one in the morning" is said
	answer: [L.l05.end + 0.45, L.l05.end + 1.2, L.l05.end + 1.42], // one; then two
	shadow: L.l05.end + 1.55, // a shadow crosses the landing light (0.8 s)
	rasp: [L.l06.end + 0.35, L.l06.end + 1.95],
	silence: [L.l07.end + 0.3, L.l08.start - 0.1], // the room tone and the clock stop
	bulb: L.l08.end + 0.35, // the landing light fails for 0.3 s; when it returns, someone is in the chair
	drops: [L.l04.start - 0.65, L.l06.start - 0.45, L.l07.start - 0.55, DUR - 0.2],
	loopOn: DUR - 0.2,
};
export const STINGERS: number[] = [K.bulb + 0.3];
const inDrop = (t: number) => K.drops.findIndex((d) => t >= d && t < d + DROP);
const chairAt = (t: number) => {
	let i = 0;
	K.drops.slice(0, 3).forEach((d, k) => {
		if (t >= d + DROP / 2) i = k + 1;
	});
	if (t >= K.drops[3]) i = 0; // the last dropout puts it back by the window: frame 0
	return CHAIR[i];
};
const sitterOn = (t: number) => t >= K.bulb + 0.3 && t < K.drops[3];
const landingOn = (t: number) => (t >= K.bulb && t < K.bulb + 0.3 ? 0 : t >= K.bulb + 0.3 && t < K.bulb + 0.36 ? 0.5 : 1);

// ONE locked-off camera on a tripod in the front-right corner, at eye height
const CAM: {p: V3; l: V3; fov: number} = {p: [0.5, 1.62, 2.95], l: [-0.32, 0.72, -1.2], fov: 62};
const Cam: React.FC = () => {
	const {camera} = useThree();
	camera.position.set(...CAM.p);
	camera.up.set(0, 1, 0);
	camera.lookAt(...CAM.l);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = CAM.fov;
	c.near = 0.03;
	c.far = 40;
	camera.updateProjectionMatrix();
	return null;
};

const Atmos: React.FC = () => {
	const {scene} = useThree();
	const bg = new THREE.Color('#030304');
	if (!scene.fog) scene.fog = new THREE.Fog(bg, 4, 11);
	scene.background = bg;
	return null;
};

const World: React.FC<{t: number}> = ({t}) => {
	const minute = t >= K.minute ? 0 : 59;
	const clock = useMemo(() => clockTex(minute === 0 ? 1 : 12, minute), [minute]);
	const knock = Math.max(...K.knocks.map((k) => (t >= k && t < k + 0.12 ? 1 - (t - k) / 0.12 : 0)), ...K.answer.map((k) => (t >= k && t < k + 0.12 ? 0.7 * (1 - (t - k) / 0.12) : 0)));
	const crooked = t >= K.knocks[2] ? 0.6 : 0; // the picture is left crooked by the knocks
	const car = t >= K.car && t < K.car + 1.6 ? (t - K.car) / 1.6 : -1;
	const shadow = t >= K.shadow && t < K.shadow + 0.8 ? (t - K.shadow) / 0.8 : -1;
	const landing = landingOn(t);
	const rasping = t >= K.rasp[0] - 0.2 && t < K.rasp[1] + 0.3;
	const near = 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 4.2);
	const far = rasping ? 0.9 : 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 3.7 + 1.3);
	const chair = chairAt(t);
	return (
		<>
			<Atmos />
			<ambientLight intensity={0.5} color="#2a3446" />
			{/* the streetlight through the curtains: orange, from the window */}
			<pointLight position={[0.0, 1.5, -1.6]} intensity={1.5} distance={3.2} decay={1.2} color="#ff9a40" />
			{/* the landing light through the door ajar */}
			{landing > 0 && <spotLight position={[-2.3, 2.1, 1.45]} target-position={[-0.3, 0, 0.6]} intensity={5 * landing} distance={5} angle={0.6} penumbra={0.6} decay={1.2} color="#ffc070" />}
			{landing > 0 && <pointLight position={[-1.6, 1.4, 1.4]} intensity={0.8 * landing} distance={1.8} decay={1.5} color="#ffb060" />}
			{car >= 0 && <pointLight position={[0.9 - car * 2.6, 2.2, -1.4 + car * 1.2]} intensity={1.2 * Math.sin(Math.PI * car)} distance={2.2} decay={1.0} color="#e8e8ff" />}
			<MatsProvider>
				<Bedroom clock={clock} knock={Math.max(knock, crooked)} car={car} shadow={shadow} landing={landing} breathe={[near, far]} chair={chair} sitter={sitterOn(t)} reel={t * 2.4} />
			</MatsProvider>
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: tape, REC counter, dropouts, captions
const Overlay: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
	const cap = useRef<HTMLCanvasElement>(null);
	const noise = useRef<HTMLCanvasElement>(null);
	const drop = inDrop(t);
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
		// the camera's own REC light and counter (it keeps counting through the loop)
		if (drop < 0) {
			g.font = 'bold 12px "DejaVu Sans Mono", monospace';
			const s = Math.floor(t) + 3121;
			const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
			if (Math.floor(t * 1.2) % 2 === 0) {
				g.fillStyle = '#d01808';
				g.beginPath();
				g.arc(22, 30, 4, 0, Math.PI * 2);
				g.fill();
			}
			out('REC', 32, 34, '#e8e0d0', 'left');
			out(`${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`, 338, 34, '#e8e0d0', 'right');
		}
		const line = timeline.lines.find((l) => t >= l.start - 0.05 && t < l.end + 0.35);
		if (captions && line && drop < 0) {
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
		// tape noise; a dropout is near-opaque noise with rolling bars
		const n = noise.current!.getContext('2d')!;
		const ni = n.createImageData(LW, LH);
		const r = rng(Math.floor(t * 30) * 7919 + 21);
		const band = ((t * 30 * 1.6) % (LH + 60)) - 30;
		const d = drop >= 0;
		const roll = d ? (Math.floor(t * 30) * 53) % LH : 0;
		for (let y = 0; y < LH; y++) {
			const inBand = Math.abs(y - band) < 3;
			const bar = d && ((y + roll) % 70 < 14);
			const torn = d && r() < 0.12;
			for (let x = 0; x < LW; x++) {
				const i = (y * LW + x) * 4;
				const v = bar ? 230 + r() * 25 : r() * 255;
				ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = v;
				ni.data[i + 3] = d ? (torn ? 90 : 245) : (inBand ? 46 : 16) * (r() < 0.5 ? 1 : 0.4);
			}
		}
		n.putImageData(ni, 0, 0);
	}, [t, captions, drop]);
	return (
		<>
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: drop >= 0 ? 'normal' : 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

// ------------------------------------------------------------------ assembly
export const Episode21: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const drop = inDrop(t);
	const ca = drop >= 0 ? 3 : 0.7;
	const shift = drop >= 0 ? Math.round(Math.sin(t * 97) * 4) : 0;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="tape21" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: shift, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'url(#tape21) saturate(0.8) contrast(1.05)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 64, near: 0.03, far: 40}} style={{imageRendering: 'pixelated'}}>
					<Cam />
					<World t={t} />
				</ThreeCanvas>
			</div>
			<Overlay t={t} captions={captions} />
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.8) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep21-chair-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
