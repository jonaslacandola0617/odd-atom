// Episode 57: "The Station That Isn't" (Season 6: a woman posting to a forum, as it happened, from a late train in
// Japan that stops at a station on no map; retold in our own words from the 2004 thread; she isn't named, nothing
// claims she died, and the last post is ours).
// English, Jack: only three spoken lines; the rest of the story is on screen as her posts. A score of its own; a
// seamless loop (the last shot is the first).
// Form: "a text thread": a 2004 forum's grey page, her posts and the replies with their timestamps, cut hard
// against the station in mercury-vapour blue-green. Mechanism: wrong geometry (a station and a line that aren't on
// any map). Gore: the man on one leg, his stump. Cast: Character_Monster_06 (the man on one leg), Character_Killer_09
// (the driver).
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep57-station-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {Car, Carriage, Line, MatsProvider, OneLeg, Station, Tunnel, TUNNEL_Z, V3} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep57Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep57_sound.py reads the same rules)
export const K = {
	t1: L.l01.end + 0.45, // the thread
	train: 14.6,
	t2: 18.4,
	platform: 22.6,
	t3: 26.0,
	tracks: 28.6,
	tunnel: L.l02.end + 0.4, // the torch reaches the tunnel mouth
	man: L.l02.end + 1.9, // he is standing on the rail in it
	shout: L.l02.end + 2.6, // he shouts (the stinger), lurching at me
	t4: L.l02.end + 5.3,
	car: 45.4,
	turn: 48.2, // he stops talking; his head comes round to me
	turned: 50.0, // (the stinger)
	t5: 51.6,
	loopShot: DUR - 1.6,
};
export const STINGERS = [K.shout, K.turned];

type Shot = 'sign' | 'thread' | 'train' | 'platform' | 'tracks' | 'car';
const CUTS: [number, Shot][] = [
	[K.t1, 'sign'],
	[K.train, 'thread'],
	[K.t2, 'train'],
	[K.platform, 'thread'],
	[K.t3, 'platform'],
	[K.tracks, 'thread'],
	[K.t4, 'tracks'],
	[K.car, 'thread'],
	[K.t5, 'car'],
	[K.loopShot, 'thread'],
];
const shotOf = (t: number): Shot => (t < 0 ? 'sign' : CUTS.find(([c]) => t < c)?.[1] ?? 'sign');

// ------------------------------------------------------------------ the thread
const HER = 'Anonymous ID:a4Nk02';
type Post = {at: number; who: 'her' | 'reply'; time: string; text: string; no: number};
const POSTS: Post[] = [
	{at: K.t1 + 0.2, who: 'her', time: '23:14', text: "My train hasn't stopped for twenty minutes. It always stops every five.", no: 31},
	{at: K.t1 + 2.6, who: 'reply', time: '23:15', text: 'Ask the driver?', no: 32},
	{at: K.t1 + 3.6, who: 'her', time: '23:17', text: "The driver's cab is dark. I'm the only one in the carriage.", no: 33},
	{at: K.t2 + 0.2, who: 'her', time: '23:31', text: "It stopped. The sign says KISARAGI. It's not on any map.", no: 41},
	{at: K.t2 + 2.6, who: 'reply', time: '23:32', text: "There's no station called that.", no: 42},
	{at: K.t3 + 0.2, who: 'her', time: '23:40', text: 'Nobody here. No exit. I am walking back along the tracks.', no: 47},
	{at: K.t4 + 0.2, who: 'her', time: '00:05', text: 'A man in a tunnel shouted at me to get off the rails. He only had one leg.', no: 63},
	{at: K.t4 + 2.6, who: 'her', time: '00:06', text: "Then he wasn't there.", no: 64},
	{at: K.t4 + 3.6, who: 'her', time: '00:21', text: "A man stopped his car. He'll drive me to a station.", no: 70},
	{at: K.t4 + 5.0, who: 'reply', time: '00:21', text: "DON'T GET IN", no: 71},
	{at: K.t5 + 0.2, who: 'her', time: '00:40', text: "We're going up into the mountains. He hasn't said a word for a long time.", no: 82},
	{at: L.l03.start + 0.15, who: 'her', time: '00:44', text: "Battery low. I'll run when he stops.", no: 85},
	{at: L.l03.start + 2.6, who: 'reply', time: '00:52', text: 'are you there?', no: 86},
	{at: L.l03.start + 3.8, who: 'reply', time: '01:30', text: 'hello?', no: 87},
	{at: L.l03.start + 4.8, who: 'reply', time: '03:12', text: 'still here. waiting.', no: 88},
];

// ------------------------------------------------------------------ cameras
type CamPose = {p: V3; l: V3; fov: number};
const Cam: React.FC<{get: () => CamPose}> = ({get}) => {
	const {camera} = useThree();
	const aim = (pose: CamPose) => {
		camera.position.set(...pose.p);
		camera.up.set(0, 1, 0);
		camera.lookAt(...pose.l);
		const c = camera as THREE.PerspectiveCamera;
		c.fov = pose.fov;
		c.near = 0.05;
		c.far = 160;
		c.updateProjectionMatrix();
	};
	useFrame(() => aim(get()));
	aim(get());
	return null;
};
const WALK_END = TUNNEL_Z + 8.5;
const walkZ = (t: number) => 2 + (WALK_END - 2) * lin(t, K.tracks, K.man, 0, 1);
const camPose = (t: number, shot: Shot): CamPose => {
	const h = handheld(t * 1.1, 0.3);
	switch (shot) {
		case 'sign': {
			// standing on the line, looking up at the board: a slow push in
			const k = t < 0 ? lin(t, -1.6, 0, 0, 0.15) : lin(t, 0, K.t1, 0.15, 1);
			return {p: [-0.4 - 0.6 * k, 1.75, 3.6 - 1.4 * k], l: [-3.2, 2.35, -1.5], fov: 54};
		}
		case 'train':
			return {p: [0.25 + h.dp[0] * 0.04, 1.5, 7.5], l: [0.1, 1.3, -9], fov: 64};
		case 'platform':
			return {p: [-2.6 + h.dp[0] * 0.06, 1.62 + h.dp[1] * 0.04, 6.5 - 0.5 * lin(t, K.platform, K.t3)], l: [-2.4, 2.1, -4], fov: 60};
		case 'tracks': {
			const z = walkZ(t);
			const bob = 0.03 * Math.sin((t + 600) * 8.6) * (t < K.man ? 1 : 0.2);
			return {p: [0.05 + h.dp[0] * 0.06, 1.55 + bob, z], l: [0, 1.1 + (t > K.tunnel ? 0.25 : 0), z - 8], fov: 58};
		}
		default:
			// in the passenger seat, looking across at him and the road
			return {p: [-0.5, 1.22, 0.6], l: [0.42, 1.05, -0.55], fov: 68};
	}
};

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotOf(t);
	const torch = useRef<THREE.SpotLight>(null);
	const flicker = rng(Math.floor((t + 600) * 12) * 13 + 57)() > 0.06 ? 1 : 0;
	useFrame(() => {
		if (!torch.current || shot !== 'tracks') return;
		const c = camPose(t, shot);
		torch.current.position.set(c.p[0] + 0.15, c.p[1] - 0.2, c.p[2]);
		torch.current.target.position.set(c.l[0], c.l[1] - 0.5, c.l[2]);
		torch.current.target.updateMatrixWorld();
	});
	if (shot === 'thread') return <color attach="background" args={['#000000']} />;
	const shout = ease(lin(t, K.shout - 0.15, K.shout + 0.2));
	const manZ = TUNNEL_Z + 1.4 + 2.2 * ease(lin(t, K.shout - 0.1, K.shout + 0.35));
	return (
		<>
			<Cam get={() => camPose(t, shot)} />
			{shot === 'sign' || shot === 'platform' ? (
				<>
					<color attach="background" args={['#020605']} />
					<fog attach="fog" args={['#06120e', 6, 40]} />
					<ambientLight intensity={0.6} color="#1a3a30" />
					{/* the mercury lamp's blue-green, flickering now and then */}
					<pointLight position={[-3.45, 3.6, 2.5]} intensity={5.5 * flicker} distance={14} decay={1} color="#a8ffe0" />
					<pointLight position={[-2.5, 2.6, -0.5]} intensity={1.6} distance={4} decay={1} color="#a8ffe0" />
					<Station flicker={flicker} />
				</>
			) : shot === 'train' ? (
				<>
					<color attach="background" args={['#000000']} />
					<ambientLight intensity={0.55} color="#e8fff0" />
					<pointLight position={[0, 2.2, 0]} intensity={0.9} distance={12} decay={1} color="#f0fff4" />
					<Carriage t={t} />
				</>
			) : shot === 'tracks' ? (
				<>
					<color attach="background" args={['#010303']} />
					<fog attach="fog" args={['#03080a', 4, 26]} />
					<ambientLight intensity={0.45} color="#14282a" />
					{/* her phone's light */}
					<spotLight ref={torch} intensity={40} distance={20} angle={0.38} penumbra={0.5} decay={1.2} color="#f4f8ff" />
					<pointLight position={[0, 1.6, manZ + 2.5]} intensity={t >= K.man ? 2.4 : 0} distance={4.5} decay={1} color="#e8f0ff" />
					<Line z0={8} z1={TUNNEL_Z - 4} />
					<Tunnel />
					{t >= K.man && <OneLeg p={[0.7, 0.26, manZ]} ry={0} shout={shout} t={t} />}
				</>
			) : (
				<>
					<color attach="background" args={['#010203']} />
					<fog attach="fog" args={['#020406', 3, 30]} />
					<ambientLight intensity={1.4} color="#2a3038" />
					{/* the dash lights his face from below */}
					<pointLight position={[0.25, 0.95, -0.45]} intensity={2.4} distance={1.4} decay={1} color="#ffa860" />
					<pointLight position={[-0.3, 1.3, 0.2]} intensity={1.0} distance={1.6} decay={1} color="#8090a8" />
					{/* the headlights out on the road */}
					<pointLight position={[0, 1, -8]} intensity={3} distance={12} decay={1} color="#fff0d0" />
					<Car t={t} turn={ease(lin(t, K.turn, K.turned))} />
				</>
			)}
		</>
	);
};

// ------------------------------------------------------------------ overlay: the forum page; grain; captions
const wrapText = (g: CanvasRenderingContext2D, s: string, w: number) => {
	const out: string[] = [];
	let cur = '';
	for (const word of s.split(' ')) {
		const next = cur ? cur + ' ' + word : word;
		if (g.measureText(next).width > w && cur) {
			out.push(cur);
			cur = word;
		} else cur = next;
	}
	out.push(cur);
	return out;
};
const Overlay: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
	const ui = useRef<HTMLCanvasElement>(null);
	const grain = useRef<HTMLCanvasElement>(null);
	const shot = shotOf(t);
	useLayoutEffect(() => {
		const CW = 360, CH = 640;
		const g = ui.current!.getContext('2d')!;
		g.clearRect(0, 0, CW, CH);
		if (shot === 'thread') {
			g.fillStyle = '#efefef';
			g.fillRect(0, 0, CW, CH);
			const shown = POSTS.filter((p) => t >= p.at);
			// lay out from the bottom up
			const blocks: {p: Post; lines: string[]; h: number}[] = [];
			g.font = '11px "DejaVu Sans", sans-serif';
			for (const p of shown) {
				g.font = p.text === p.text.toUpperCase() && p.who === 'reply' ? 'bold 13px "DejaVu Sans", sans-serif' : '11px "DejaVu Sans", sans-serif';
				const lines = wrapText(g, p.text, 316);
				blocks.push({p, lines, h: 22 + lines.length * 15 + 12});
			}
			let y = 512;
			for (let i = blocks.length - 1; i >= 0 && y > 56; i--) {
				const {p, lines, h} = blocks[i];
				const top = y - h;
				// the newest post types in
				const age = t - p.at;
				const chars = Math.floor(Math.min(1, age / Math.max(0.5, p.text.length / 38)) * p.text.length);
				g.font = 'bold 9px "DejaVu Sans Mono", monospace';
				g.fillStyle = '#1a1a1a';
				g.fillText(String(p.no), 12, top + 12);
				g.fillStyle = p.who === 'her' ? '#227722' : '#3a3a9a';
				g.fillText(p.who === 'her' ? HER : 'Anonymous', 32, top + 12);
				g.fillStyle = '#6a6a6a';
				g.textAlign = 'right';
				g.fillText(`2004/01/0${p.time < '12' ? 9 : 8} ${p.time}`, 348, top + 12);
				g.textAlign = 'left';
				g.fillStyle = '#1a1a1a';
				const loud = p.text === p.text.toUpperCase() && p.who === 'reply';
				g.font = loud ? 'bold 13px "DejaVu Sans", sans-serif' : '11px "DejaVu Sans", sans-serif';
				let left = chars;
				lines.forEach((ln, j) => {
					const part = ln.slice(0, Math.max(0, left));
					left -= ln.length + 1;
					g.fillStyle = loud ? '#c00000' : '#1a1a1a';
					g.fillText(part, 24, top + 30 + j * 15);
				});
				g.fillStyle = '#d8d8d8';
				g.fillRect(12, y - 4, 336, 1);
				y = top;
			}
			{
			// a 2004 forum page: grey, plain, a thread title, the posts stacked to the newest at the bottom
			g.fillStyle = '#cfcfd8';
			g.fillRect(0, 0, CW, 46);
			g.fillStyle = '#c00000';
			g.font = 'bold 11px "DejaVu Sans", sans-serif';
			g.textAlign = 'left';
			g.fillText("Something strange is happening.", 12, 20);
			g.fillText('Can I write here?', 12, 35);
			g.fillStyle = '#7a7a8a';
			g.fillRect(0, 46, CW, 1);
			}
			// the bottom bar: the reply count, and the new-reply mark blinking once she stops posting
			g.fillStyle = '#dcdce4';
			g.fillRect(0, 516, CW, 26);
			g.fillStyle = '#4a4a5a';
			g.font = 'bold 9px "DejaVu Sans Mono", monospace';
			g.fillText(`${shown.length ? shown[shown.length - 1].no : 30} replies`, 12, 533);
			const waiting = t > L.l03.start + 2.4;
			if (waiting && Math.floor((t + 600) * 1.5) % 2 === 0) {
				g.fillStyle = '#c00000';
				g.textAlign = 'right';
				g.fillText('▼ new reply', 348, 533);
				g.textAlign = 'left';
			}
		}
		const line = timeline.lines.find((l) => t >= l.start - 0.05 && t < l.end + 0.35);
		if (captions && line) {
			const rows = wrapText((g.font = 'bold 13px "DejaVu Sans", sans-serif', g), line.text, 300);
			const pages: string[][] = [];
			for (let i = 0; i < rows.length; i += 2) pages.push(rows.slice(i, i + 2));
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
			g.font = 'bold 13px "DejaVu Sans", sans-serif';
			g.textAlign = 'center';
			show.forEach((r, i) => {
				const yy = 572 + i * 17 - (show.length - 1) * 8;
				g.fillStyle = '#000';
				for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.fillText(r, CW / 2 + dx, yy + dy);
				g.fillStyle = '#ffffff';
				g.fillText(r, CW / 2, yy);
			});
			g.textAlign = 'left';
		}
		const img = g.getImageData(0, 0, CW, CH);
		for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 100 ? 255 : 0;
		g.putImageData(img, 0, 0);
		const b = grain.current!.getContext('2d')!;
		const bi = b.createImageData(60, 107);
		const burst = STINGERS.some((k) => t >= k && t < k + 0.1) ? 1 : 0;
		const r = rng(Math.floor((t + 600) * 24) * 104729 + 57);
		for (let i = 0; i < bi.data.length; i += 4) {
			const v = r() * 255;
			bi.data[i] = bi.data[i + 1] = bi.data[i + 2] = v;
			bi.data[i + 3] = (shot === 'thread' ? 10 : 30) * r() + 160 * burst * r();
		}
		b.putImageData(bi, 0, 0);
	}, [t, captions, shot]);
	return (
		<>
			<canvas ref={ui} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
			<canvas ref={grain} width={60} height={107} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
		</>
	);
};

// ------------------------------------------------------------------ assembly
export const Episode57: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const tv = t >= K.loopShot ? t - DUR : t;
	const shot = shotOf(tv);
	const grade = shot === 'train' ? 'contrast(1.15) saturate(0.6) brightness(1.0) hue-rotate(-8deg)' : shot === 'car' ? 'contrast(1.2) saturate(0.8) brightness(1.05)' : 'contrast(1.25) saturate(0.9) brightness(1.1)';
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: 'scale(' + SCALE + ')', transformOrigin: '0 0', filter: grade}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 60, near: 0.05, far: 160}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			{shot !== 'thread' && <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 65% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)'}} />}
			<Overlay t={tv} captions={captions} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep57-station-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
