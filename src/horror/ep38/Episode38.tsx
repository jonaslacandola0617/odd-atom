// Episode 38: "FWD: Ingat Kayo" (Season 4, Visayan urban legend: Maria Labo, told as a chain text).
// Taglish, Juanito. Built to the motion rule; hard cuts only; an eerie score; a seamless loop (the last
// shot is the first shot, on negative time).
// Form: "the chain". The episode is the rumour itself: hard cuts between a 2000s phone screen (a
// monochrome green LCD, pixel font, signal bars, "1 message received") and what each message claims,
// so the claims visibly contradict each other.
// The picture: a phone buzzing in a hand in the dark, 1 message received, FWD (hook); the town from
// above, phones lighting green window after window; the forwards piling up, each FWD longer, each place
// different; the market by day, a manicure stall, a woman with her hair over half her face; the thread
// scrolling, the inbox climbing; night, a mother hurries her children in and bars the door; the phone
// on the table vibrates: an unknown number; "Diin kamo? Ara ko sa gwa."; the phone's light lifts to the
// jalousie: between the slats, half a face with a scar. Then the phone again (loop).
// Care: no child is shown harmed or named; the crime is never shown; the narration says no victim is on
// record; no OFW or woman is blamed; no real town is "her" town; no real number; no dares.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep38-labo-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {House, Market, MatsProvider, PHONE, Room, Town, TOWN, V3, WIN} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep38Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep38_sound.py uses the same rules)
export const K = {
	open: 0.8, // the hook's message opens
	cutTown: L.l02.start - 0.3,
	cutThread: L.l03.start - 0.3,
	fwd: [L.l03.start + 0.1, L.l03.start + 1.9, L.l03.start + 3.4], // each forward arrives with its claim
	cutMarket: L.l04.start - 0.3,
	lift: [L.l04.end + 0.05, L.l04.end + 0.6] as [number, number], // she lifts her head a little
	cutCount: L.l05.start - 0.3,
	cutNight: L.l06.start - 0.3,
	shut: L.l06.end + 0.15, // the door shuts (after the line); the bar drops
	cutUnknown: L.l07.start - 0.3,
	msgOpen: L.l07.end + 0.25,
	cutWindow: L.l08.start - 0.3,
	face: L.l08.end + 0.2, // half a face between the slats
	loopShot: DUR - 1.7,
};
export const STINGERS = [K.face];
// every message tone in the episode (the sound script places the tone on each)
export const TONES = [-0.4, K.fwd[0], K.fwd[1], K.fwd[2], K.cutUnknown + 0.2];

type Shot = 'phone' | 'town' | 'thread' | 'market' | 'count' | 'night' | 'unknown' | 'window';
const shotAt = (t: number): Shot => {
	if (t < K.cutTown) return 'phone';
	if (t < K.cutThread) return 'town';
	if (t < K.cutMarket) return 'thread';
	if (t < K.cutCount) return 'market';
	if (t < K.cutNight) return 'count';
	if (t < K.cutUnknown) return 'night';
	if (t < K.cutWindow) return 'unknown';
	return 'window';
};
const isPhone = (s: Shot) => s === 'phone' || s === 'thread' || s === 'count' || s === 'unknown';

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
	c.far = 200;
	camera.updateProjectionMatrix();
	return null;
};
const Atmos: React.FC<{c: string; near: number; far: number}> = ({c, near, far}) => {
	const {scene} = useThree();
	const bg = new THREE.Color(c);
	if (!scene.fog) scene.fog = new THREE.Fog(bg, near, far);
	const f = scene.fog as THREE.Fog;
	f.color.copy(bg);
	f.near = near;
	f.far = far;
	scene.background = bg;
	return null;
};

const poseAt = (t: number, shot: Shot): CamPose => {
	const hh = handheld(t, 0.4);
	switch (shot) {
		case 'phone':
		case 'thread':
		case 'count':
		case 'unknown':
			// behind the phone: our dark room, the window far and soft
			return {p: [0.3 + hh.dp[0], 1.25 + hh.dp[1], 1.6], l: [0.0, 1.2, -1.6], fov: 50};
		case 'town': {
			const k = ease(lin(t, K.cutTown, K.cutThread));
			return {p: [6 - 4 * k, 16 - 3 * k, 18 - 6 * k], l: [0, 0, 0], fov: 46};
		}
		case 'market': {
			const k = ease(lin(t, K.cutMarket, K.cutCount));
			return {p: [0.35 + hh.dp[0] * 0.5, 1.25 - 0.05 * k, 2.4 - 0.9 * k], l: [0, 1.1, -0.1], fov: 42};
		}
		case 'night': {
			const k = ease(lin(t, K.cutNight, K.cutUnknown));
			return {p: [1.2 - 0.6 * k + hh.dp[0], 1.6, 7.5 - 1.5 * k], l: [0, 1.3, 0], fov: 50};
		}
		case 'window': {
			// from the phone on the table, the light lifts to the jalousie and pushes in
			const up = ease(lin(t, K.cutWindow, K.cutWindow + 1.6));
			const push = ease(lin(t, K.cutWindow + 1.6, K.face + 0.6));
			const p: V3 = [0.15 + hh.dp[0] * 0.3, 1.3 + hh.dp[1] * 0.3, 0.9 - 1.3 * push];
			const lo: V3 = [PHONE[0], PHONE[1], PHONE[2]];
			const hi: V3 = [WIN[0] + 0.05, WIN[1], WIN[2]];
			return {p, l: [lo[0] + (hi[0] - lo[0]) * up, lo[1] + (hi[1] - lo[1]) * up, lo[2] + (hi[2] - lo[2]) * up], fov: 50 - 26 * push};
		}
	}
};

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotAt(t);
	const pose = poseAt(t, shot);
	const phoneLight = shot === 'window' ? 1 : isPhone(shot) ? 0.6 : 0;
	return (
		<>
			<Cam pose={pose} />
			{(isPhone(shot) || shot === 'window') && (
				<>
					<Atmos c="#030406" near={1.5} far={5} />
					<ambientLight intensity={0.35} color="#6a7a9a" />
					{/* the phone's light: cold green-white, from our hand */}
					<pointLight position={[pose.p[0] - 0.1, pose.p[1] - 0.2, pose.p[2] - 0.3]} intensity={3.2 * phoneLight} distance={4} decay={1} color="#c8f0b0" />
					<pointLight position={[0, WIN[1], WIN[2] - 0.5]} intensity={shot === 'window' ? 0.9 : 0.3} distance={1.2} decay={1} color="#8a9ab0" />
					<Room t={t} glow={1} face={shot === 'window' ? ease(lin(t, K.face - 0.05, K.face + 0.15)) : 0} />
				</>
			)}
			{shot === 'town' && (
				<>
					<Atmos c="#0a0c18" near={18} far={60} />
					<ambientLight intensity={1.4} color="#6a7aaa" />
					{[-9, -3, 3, 9].map((x) => (
						<pointLight key={x} position={[x, 3.8, 0.2]} intensity={3} distance={8} decay={1} color="#ffb060" />
					))}
					<Town lit={Math.round(lin(t, K.cutTown + 0.3, K.cutThread - 0.3, 1, TOWN.length))} />
				</>
			)}
			{shot === 'market' && (
				<>
					<Atmos c="#d8c8a8" near={6} far={30} />
					<ambientLight intensity={1.3} color="#f0e0c0" />
					<directionalLight position={[3, 8, 5]} intensity={1.0} color="#fff0d0" />
					<pointLight position={[0, 1.85, 0.6]} intensity={1.5} distance={2} decay={1} color="#ffd890" />
					<Market t={t} lift={ease(lin(t, K.lift[0], K.lift[1]))} />
				</>
			)}
			{shot === 'night' && (
				<>
					<Atmos c="#070912" near={8} far={30} />
					<ambientLight intensity={0.9} color="#5a6a9a" />
					<pointLight position={[0, 2.0, 1.2]} intensity={3.0 * (1 - 0.7 * ease(lin(t, K.shut, K.shut + 0.2)))} distance={5} decay={1} color="#ffc070" />
					<pointLight position={[3, 4, 4]} intensity={1.5} distance={10} decay={1} color="#8a9ac8" />
					<House t={t} inK={ease(lin(t, K.cutNight + 0.4, K.shut - 0.2))} door={ease(lin(t, K.shut - 0.15, K.shut + 0.1))} bar={ease(lin(t, K.shut + 0.3, K.shut + 0.6))} />
				</>
			)}
		</>
	);
};

// ------------------------------------------------------------------ the phone (2D, pixel art) and what its screen says
type Screen = {title: string; lines: string[]; icon?: 'env'; inbox?: string};
const MSG1 = ['FWD: Si Maria Labo', 'nakabalik na daw.', 'Ingat kayo. Ipasa', 'sa 10 ka tao.'];
const screenAt = (t: number, shot: Shot): Screen => {
	if (shot === 'phone') {
		if (t < K.open) return {title: '', lines: ['1 message', 'received'], icon: 'env'};
		return {title: 'Mensahe', lines: MSG1};
	}
	if (shot === 'thread') {
		const rows = [
			['FWD:FWD: Nasa', 'Iloilo daw siya.'],
			['FWD:FWD:FWD: Indi,', 'sa Capiz!'],
			['FWD:FWD:FWD:FWD:', 'Ari na siya diri.'],
		];
		const n = K.fwd.filter((x) => t >= x).length;
		const show = rows.slice(Math.max(0, n - 2), n).flat();
		return {title: `Inbox (${3 + n})`, lines: n ? show : ['...']};
	}
	if (shot === 'count') {
		const n = Math.round(lin(t, K.cutCount, K.cutNight, 7, 99));
		const k = Math.floor((t - K.cutCount) * 3);
		const lines = Array.from({length: 4}, (_, i) => 'FWD:'.repeat(1 + ((k + i) % 4)) + ' Maria');
		return {title: `Inbox (${n})`, lines};
	}
	// the unknown number
	if (t < K.msgOpen) return {title: '', lines: ['1 message', 'received', '', 'Hindi kilalang', 'numero'], icon: 'env'};
	return {title: 'Hindi kilala', lines: ['Diin kamo?', '', 'Ara ko sa gwa.']};
};

const drawPhone = (g: CanvasRenderingContext2D, t: number, shot: Shot) => {
	// buzzing: whole phone jitters for a moment when a message arrives
	const buzz = TONES.some((x) => t >= x && t < x + 0.6) ? Math.sin(t * 90) * 2 : 0;
	const hh = handheld(t, 1.0);
	const ox = Math.round(95 + hh.dp[0] * 300 + buzz), oy = Math.round(70 + hh.dp[1] * 300);
	const W = 170, H = 380;
	// the hand: palm and fingers from the left and below
	g.fillStyle = '#8a5e42';
	g.fillRect(ox - 18, oy + 230, 40, 150);
	g.fillRect(ox + 130, oy + 250, 52, 22);
	g.fillRect(ox + 136, oy + 284, 50, 20);
	g.fillRect(ox + 140, oy + 318, 44, 20);
	// the body
	g.fillStyle = '#26282c';
	g.fillRect(ox, oy, W, H);
	g.fillStyle = '#34373c';
	g.fillRect(ox + 4, oy + 4, W - 8, H - 8);
	g.fillStyle = '#26282c';
	g.fillRect(ox + W - 34, oy - 16, 18, 18); // the antenna nub
	// the screen
	const sx = ox + 17, sy = oy + 30, sw = W - 34, sh = 128;
	g.fillStyle = '#1a1c1e';
	g.fillRect(sx - 5, sy - 5, sw + 10, sh + 10);
	g.fillStyle = '#9ab85a';
	g.fillRect(sx, sy, sw, sh);
	g.fillStyle = '#1e2a10';
	// signal bars and battery
	for (let b = 0; b < 4; b++) g.fillRect(sx + 4 + b * 4, sy + 14 - b * 3, 3, 3 + b * 3);
	g.fillRect(sx + sw - 20, sy + 6, 14, 8);
	g.fillStyle = '#9ab85a';
	g.fillRect(sx + sw - 18, sy + 8, 4, 4);
	g.fillStyle = '#1e2a10';
	const sc = screenAt(t, shot);
	g.font = 'bold 12px "DejaVu Sans Mono", monospace';
	g.textAlign = 'left';
	if (sc.title) {
		g.fillText(sc.title, sx + 28, sy + 15);
		g.fillRect(sx + 3, sy + 20, sw - 6, 1);
	}
	if (sc.icon === 'env') {
		// a blinking envelope
		if (((Math.floor(t * 3) % 2) + 2) % 2 === 0) {
			g.fillRect(sx + sw / 2 - 18, sy + 26, 36, 22);
			g.fillStyle = '#9ab85a';
			g.fillRect(sx + sw / 2 - 16, sy + 28, 32, 18);
			g.fillStyle = '#1e2a10';
			for (let i = 0; i < 16; i++) g.fillRect(sx + sw / 2 - 16 + i, sy + 28 + Math.floor(i / 2), 1, 1), g.fillRect(sx + sw / 2 + 15 - i, sy + 28 + Math.floor(i / 2), 1, 1);
		}
		sc.lines.forEach((ln, i) => g.fillText(ln, sx + 6, sy + 66 + i * 14));
	} else {
		sc.lines.forEach((ln, i) => g.fillText(ln, sx + 4, sy + 36 + i * 15));
	}
	// keys
	g.fillStyle = '#1e2024';
	for (let r = 0; r < 4; r++)
		for (let c = 0; c < 3; c++) g.fillRect(ox + 22 + c * 44, oy + 200 + r * 40, 36, 28);
	g.fillStyle = '#4a4e54';
	g.fillRect(ox + 60, oy + 168, 50, 22); // the navigation key
	// the screen glow on the hand and the body edge
	g.fillStyle = 'rgba(160,220,120,0.10)';
	g.fillRect(ox - 20, oy - 20, W + 40, 200);
};

// ------------------------------------------------------------------ 2D overlay: the phone, captions, grain
const Overlay: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
	const cap = useRef<HTMLCanvasElement>(null);
	const ph = useRef<HTMLCanvasElement>(null);
	const noise = useRef<HTMLCanvasElement>(null);
	useLayoutEffect(() => {
		const CW = 360, CH = 640;
		const shot = shotAt(t);
		const p = ph.current!.getContext('2d')!;
		p.clearRect(0, 0, CW, CH);
		if (isPhone(shot)) drawPhone(p, t, shot);
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
			show.forEach((r, i) => out(r, CW / 2, 548 + i * 19 - (show.length - 1) * 19, '#ffffff'));
		}
		const img = g.getImageData(0, 0, CW, CH);
		for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 120 ? 255 : 0;
		g.putImageData(img, 0, 0);
		const n = noise.current!.getContext('2d')!;
		const ni = n.createImageData(LW, LH);
		const r = rng(Math.floor(t * 24) * 7919 + 38);
		for (let i = 0; i < ni.data.length; i += 4) {
			const v = r() * 255;
			ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = v;
			ni.data[i + 3] = 20 * (r() < 0.5 ? 1 : 0.4);
		}
		n.putImageData(ni, 0, 0);
	}, [t, captions]);
	return (
		<>
			<canvas ref={ph} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

// ------------------------------------------------------------------ assembly
export const Episode38: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	// the loop shot runs on negative time: the hook's own first moments (the phone buzzing)
	const tv = t >= K.loopShot ? t - DUR : t;
	const shot = shotAt(tv);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: shot === 'market' ? 'saturate(0.9) contrast(1.05)' : 'saturate(0.6) contrast(1.15)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.02, far: 200}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			<Overlay t={tv} captions={captions} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep38-labo-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
