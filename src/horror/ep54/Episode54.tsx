// Episode 54: "Monitor" (Season 6: a babysitter's night with twins asleep upstairs and the baby monitor beside him;
// retold in our own words from accounts shared online; a suburban house in a Canadian winter, no real family).
// English, Jack. The PSX models; hard cuts only; a score of its own; a seamless loop (the last shot is the first).
// Form: "a baby monitor": most of the episode is the handheld unit in my hands, its low-res 4:3 night-vision
// picture refreshing a few times a second, with its temperature, sound-level LEDs and pan buttons.
// Mechanism: hidden in plain sight. It is in the corner from frame 0, and the viewer finds it before I do; it
// never moves on screen: between two refreshes it is bent over the crib; between two refreshes, behind me.
// The twins are safe in every frame. Cast: it, Character_Monster_04; me, Character_08.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep54-monitor-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {ARMS_DOWN, merge, PsxCharacter, SIT} from '../psx/models';
import {Box} from '../ep41/world';
import {CAM, CORNER, CRIB_A, DOOR_Z, It, LivingRoom, LR, MatsProvider, Nursery, useM, V3} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep54Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep54_sound.py reads the same rules)
export const K = {
	cutCouch: L.l01.start + 0.4,
	cutMon: L.l01.end - 1.6,
	leds: L.s01.start - 1.1, // the sound lights start jumping in a silent room
	panOut: [L.l02.end + 0.4, L.l02.end + 1.3], // to the door
	panBack: [L.l02.end + 2.2, L.l02.end + 3.1], // and back
	bent: L.l02.end + 2.75, // the refresh where it is bent over the crib (mid-pan back: seen as the view lands)
	cutStairs: L.l03.end + 0.35,
	cutLit: L.l03.end + 1.75,
	door: L.l03.end + 1.75, // the door bursts open; the light goes on 0.35 s later
	cutHand: L.l04.start + 3.85, // "Then I looked at the monitor in my hand"
	behind: L.l04.end + 0.3, // between two refreshes it is behind me (the stinger)
	loopShot: DUR - 1.4,
};
export const STINGERS = [K.panBack[1] - 0.05, K.behind];

type Shot = 'mon' | 'couch' | 'stairs' | 'lit' | 'hand';
const CUTS: [number, Shot][] = [
	[K.cutCouch, 'mon'],
	[K.cutMon, 'couch'],
	[K.cutStairs, 'mon'],
	[K.cutLit, 'stairs'],
	[K.cutHand, 'lit'],
	[K.loopShot, 'hand'],
];
const shotOf = (t: number): Shot => (t < 0 ? 'mon' : CUTS.find(([c]) => t < c)?.[1] ?? 'mon');

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
		c.near = 0.03;
		c.far = 60;
		c.updateProjectionMatrix();
	};
	useFrame(() => aim(get()));
	aim(get());
	return null;
};
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
// the monitor camera: its home view of the cribs and the corner, and the door it pans to
const HOME: V3 = [-0.55, 0.75, -1.15];
const DOORVIEW: V3 = [1.95, 1.0, DOOR_Z];
const pan = (t: number) => ease(lin(t, K.panOut[0], K.panOut[1])) * (1 - ease(lin(t, K.panBack[0], K.panBack[1])));
const monPose = (t: number): CamPose => ({p: CAM, l: mix3(HOME, DOORVIEW, pan(t)), fov: 64});
const ME_SIT: V3 = LR([0.3, 0.02, 0.85]);
const bgPose = (t: number, shot: Shot): CamPose => {
	const h = handheld(t * 1.2, 0.2);
	switch (shot) {
		case 'couch':
			return {p: LR([-1.7, 1.35, -1.5]), l: LR([0.6, 0.85, 0.9]), fov: 52};
		case 'stairs': {
			// running at the stairs, looking up into the dark landing
			const k = lin(t, K.cutStairs, K.cutLit);
			const bob = 0.05 * Math.sin(t * 22);
			return {p: LR([2.4 + h.dp[0] * 0.1, 1.55 + 0.5 * k + bob, 2.6 - 1.0 * k]), l: LR([2.45, 2.9, -1.2]), fov: 60};
		}
		case 'lit': {
			// in the doorway: the nursery lit; the corner empty; the twins asleep
			return {p: [1.75 + h.dp[0] * 0.15, 1.62 + h.dp[1] * 0.15, DOOR_Z + 0.25], l: [-1.35, 0.95, -1.0], fov: 74};
		}
		case 'hand':
			// looking down at the monitor in my hand: the lit carpet behind it
			return {p: [1.2, 1.6, 0.3], l: [0.4, 0.0, 0.1], fov: 50};
		default:
			// looking down at the monitor in my hands on the couch: my knees, the dark room
			return {p: LR([0.3, 1.2, 0.95]), l: LR([0.3, 0.2, 0.15]), fov: 50};
	}
};

// ------------------------------------------------------------------ the monitor's own world (its screen)
const ME = 'Character_08';
const ScreenScene: React.FC<{t: number; lit: boolean}> = ({t, lit}) => {
	const shot = shotOf(t);
	const bent = shot === 'mon' && t >= K.bent && t < K.cutStairs;
	const behindMe = shot === 'hand' && t >= K.behind;
	const it = behindMe ? (
		<It p={[1.62, 0, 0.3]} ry={0.25} pose={{bend: 0.38, lookUp: 0.8}} />
	) : bent ? (
		<It p={[CORNER[0], 0, CRIB_A[2] + 0.05]} ry={Math.PI / 2} pose={{bend: 1}} />
	) : shot === 'mon' ? (
		<It p={CORNER} ry={0.55} pose={{bend: 0}} eyes />
	) : null;
	return (
		<>
			<Cam get={() => (shot === 'hand' ? {p: CAM, l: [0.2, 0.9, -0.4], fov: 70} : monPose(t))} />
			<color attach="background" args={['#000000']} />
			{lit ? (
				<>
					<ambientLight intensity={1.5} color="#fff2dc" />
					<pointLight position={[0, 2.4, 0]} intensity={4} distance={8} decay={1} color="#fff0d8" />
				</>
			) : (
				<>
					{/* the camera's own infrared lamp: bright near, dark in the far corner */}
					<ambientLight intensity={0.06} color="#ffffff" />
					<pointLight position={[CAM[0] - 0.15, CAM[1] - 0.1, CAM[2] - 0.15]} intensity={7} distance={6.0} decay={1.6} color="#ffffff" />
					<pointLight position={[1.4, 1.1, -1.5]} intensity={0.6} distance={1.5} decay={1} color="#ffffff" />
					{/* a little of the lamp's light comes back off the far wall, so its shape just reads in the corner */}
					<pointLight position={[-0.9, 1.7, -0.6]} intensity={1.4} distance={2.4} decay={1} color="#ffffff" />
				</>
			)}
			<Nursery t={t} lit={lit} />
			{it}
			{shot === 'hand' && (
				<PsxCharacter name={ME} height={1.76} position={[1.2, 0, 0.42]} rotation={[0, -Math.PI / 2, 0]}
					pose={merge(ARMS_DOWN, {Neck: [['x', 0.45]], LeftArm: [['aim', [0.25, -0.6, 0.5]]], LeftForeArm: [['aim', [-0.2, 0.1, 1]]], RightArm: [['aim', [-0.25, -0.6, 0.5]]], RightForeArm: [['aim', [0.2, 0.1, 1]]]})} />
			)}
		</>
	);
};

// ------------------------------------------------------------------ the background world (my eyes)
const BgScene: React.FC<{t: number}> = ({t}) => {
	const shot = shotOf(t);
	if (shot === 'stairs') return <color attach="background" args={['#000000']} />;
	const on = shot === 'hand' || (shot === 'lit' && t >= K.door + 0.35);
	if (shot === 'lit' && !on)
		return (
			<>
				<Cam get={() => bgPose(t, shot)} />
				<color attach="background" args={['#000000']} />
				<ambientLight intensity={0.15} color="#8090b0" />
				<pointLight position={[1.4, 1.1, -1.5]} intensity={1.2} distance={2.5} decay={1} color="#ffc880" />
				<Nursery t={t} lit={false} />
			</>
		);
	const up = shot === 'lit' || shot === 'hand';
	return (
		<>
			<Cam get={() => bgPose(t, shot)} />
			<color attach="background" args={['#000000']} />
			{up ? (
				<>
					<ambientLight intensity={1.6} color="#fff2dc" />
					<pointLight position={[0, 2.4, 0]} intensity={4} distance={8} decay={1} color="#fff0d8" />
					<Nursery t={t} lit />
				</>
			) : (
				<>
					<ambientLight intensity={0.9} color="#3a4258" />
					{/* the lamp in the corner, the snow light at the window, the monitor's glow in my hands */}
					<pointLight position={LR([-2.5, 1.2, 1.2])} intensity={2.4} distance={4.5} decay={1} color="#ffc890" />
					<pointLight position={LR([-1.2, 1.5, -2.6])} intensity={1.2} distance={3.5} decay={1} color="#a8c0e8" />
					<pointLight position={LR([0.3, 0.95, 0.45])} intensity={1.6} distance={1.8} decay={1} color="#b8f0c0" />
					<LivingRoom t={t} />
					{shot === 'couch' && (
						<>
							<PsxCharacter name={ME} height={1.76} position={ME_SIT} rotation={[0, Math.PI, 0]}
								pose={merge(SIT, {Neck: [['x', 0.5]], LeftForeArm: [['aim', [-0.25, 0.05, 1]]], RightForeArm: [['aim', [0.25, 0.05, 1]]]})} />
							{/* the monitor in my hands, its screen glowing */}
							<MonitorProp p={LR([0.3, 0.86, 0.4])} />
						</>
					)}
				</>
			)}
		</>
	);
};
const MonitorProp: React.FC<{p: V3}> = ({p}) => {
	const M = useM();
	return (
		<group position={p} rotation={[-0.9, Math.PI, 0]}>
			<Box p={[0, 0, 0]} s={[0.12, 0.17, 0.03]} m={M.white} />
			<mesh position={[0, 0.02, -0.017]} rotation={[0, Math.PI, 0]}>
				<planeGeometry args={[0.1, 0.075]} />
				<meshBasicMaterial color="#9ff0a8" />
			</mesh>
		</group>
	);
};

// ------------------------------------------------------------------ the handheld unit (2D), its screen, captions
const SX = 50, SY = 200, SW = 260, SH = 195; // the screen on the 360×640 UI canvas (4:3)
const deviceShot = (s: Shot) => s === 'mon' || s === 'hand';
const ledLevel = (t: number) => {
	const s01 = L.s01;
	const f = Math.floor((t + 600) * 12);
	const r = rng(f * 7919 + 54)();
	if (t >= K.leds && t < s01.end + 0.4) return Math.min(5, 2 + Math.floor(r * 4) + (t > s01.start ? 1 : 0));
	return r > 0.7 ? 1 : 0;
};
const Overlay: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
	const ui = useRef<HTMLCanvasElement>(null);
	const grain = useRef<HTMLCanvasElement>(null);
	const shot = shotOf(t);
	useLayoutEffect(() => {
		const CW = 360, CH = 640;
		const g = ui.current!.getContext('2d')!;
		g.clearRect(0, 0, CW, CH);
		const txt = (s: string, x: number, y: number, col = '#e8ffe8', align: CanvasTextAlign = 'left', font = 'bold 9px "DejaVu Sans Mono", monospace') => {
			g.font = font;
			g.textAlign = align;
			g.fillStyle = col;
			g.fillText(s, x, y);
		};
		if (deviceShot(shot)) {
			// the handheld unit: white plastic, rounded, around the screen
			g.fillStyle = '#d8d6d0';
			g.beginPath();
			g.roundRect(SX - 22, SY - 30, SW + 44, SH + 150, 22);
			g.fill();
			g.fillStyle = '#b8b6b0';
			g.fillRect(SX - 22, SY + SH + 112, SW + 44, 6);
			g.fillStyle = '#101210';
			g.fillRect(SX - 4, SY - 4, SW + 8, SH + 8);
			g.clearRect(SX, SY, SW, SH); // the screen shows through
			// the screen's own display: CAM 1, temperature, signal, battery, the time
			txt('CAM 1', SX + 6, SY + 12);
			txt(shot === 'hand' ? '22°C' : '21°C', SX + SW - 6, SY + 12, '#e8ffe8', 'right');
			for (let i = 0; i < 4; i++) {
				g.fillStyle = '#e8ffe8';
				g.fillRect(SX + 50 + i * 4, SY + 11 - i * 2, 3, 2 + i * 2);
			}
			g.strokeStyle = '#e8ffe8';
			g.strokeRect(SX + SW - 60, SY + 4, 14, 7);
			g.fillStyle = '#e8ffe8';
			g.fillRect(SX + SW - 58, SY + 6, 7, 3);
			if (shot === 'mon') txt('NIGHT', SX + 6, SY + SH - 6, '#e8ffe8');
			txt(shot === 'hand' ? '02:41' : t < K.cutStairs ? '02:3' + Math.min(9, 7 + Math.floor(Math.max(0, t) / 12)) : '02:40', SX + SW - 6, SY + SH - 6, '#e8ffe8', 'right');
			// the sound-level LEDs, under the screen
			const lv = shot === 'mon' ? ledLevel(t) : shot === 'hand' && t >= K.behind ? 5 : 0;
			for (let i = 0; i < 5; i++) {
				const on = i < lv;
				g.fillStyle = on ? (i < 3 ? '#40e060' : i < 4 ? '#e8d040' : '#ff4030') : '#4a4a46';
				g.beginPath();
				g.arc(SX + 34 + i * 18, SY + SH + 30, 5, 0, Math.PI * 2);
				g.fill();
			}
			// the pan buttons: lit while I hold them
			const holding = t >= K.panOut[0] && t < K.panOut[1] ? 1 : t >= K.panBack[0] && t < K.panBack[1] ? -1 : 0;
			[[-1, SX + SW - 70], [1, SX + SW - 26]].forEach(([d, x]) => {
				g.fillStyle = holding === d ? '#808a84' : '#bcbab4';
				g.beginPath();
				g.arc(x, SY + SH + 30, 14, 0, Math.PI * 2);
				g.fill();
				g.fillStyle = '#5a5a56';
				g.beginPath();
				g.moveTo(x + 6 * d, SY + SH + 30);
				g.lineTo(x - 4 * d, SY + SH + 24);
				g.lineTo(x - 4 * d, SY + SH + 36);
				g.fill();
			});
			txt('VOL', SX + 34, SY + SH + 60, '#6a6a66', 'left', 'bold 8px "DejaVu Sans", sans-serif');
			// my thumbs on the edges of the unit
			g.fillStyle = '#c89a78';
			g.beginPath();
			g.roundRect(SX - 34, SY + SH + 40, 30, 70, 14);
			g.roundRect(SX + SW + 4, SY + SH + 40, 30, 70, 14);
			g.fill();
			// scanlines on the screen
			g.fillStyle = 'rgba(0,0,0,0.18)';
			for (let y = SY; y < SY + SH; y += 3) g.fillRect(SX, y, SW, 1);
		}
		const line = timeline.lines.find((l) => t >= l.start - 0.05 && t < l.end + 0.35);
		if (captions && line) {
			const words = line.text.split(' ');
			const rows: string[] = [];
			let cur = '';
			for (const w of words) {
				if ((cur + ' ' + w).trim().length > 30) {
					rows.push(cur.trim());
					cur = w;
				} else cur += ' ' + w;
			}
			rows.push(cur.trim());
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
			const speaker = line.kind === 'speaker';
			g.font = speaker ? 'italic bold 13px "DejaVu Sans", sans-serif' : 'bold 13px "DejaVu Sans", sans-serif';
			g.textAlign = 'center';
			show.forEach((r, i) => {
				const y = (deviceShot(shot) ? 572 : 548) + i * 17 - (show.length - 1) * 8;
				g.fillStyle = '#000';
				for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.fillText(r, CW / 2 + dx, y + dy);
				g.fillStyle = speaker ? '#b8ffc0' : '#ffffff';
				g.fillText(r, CW / 2, y);
			});
		}
		const img = g.getImageData(0, 0, CW, CH);
		for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 100 ? 255 : 0;
		g.putImageData(img, 0, 0);
		const b = grain.current!.getContext('2d')!;
		const bi = b.createImageData(60, 107);
		const r = rng(Math.floor((t + 600) * 24) * 104729 + 54);
		for (let i = 0; i < bi.data.length; i += 4) {
			const v = r() * 255;
			bi.data[i] = bi.data[i + 1] = bi.data[i + 2] = v;
			bi.data[i + 3] = 24 * r();
		}
		b.putImageData(bi, 0, 0);
	}, [t, captions, shot]);
	return (
		<>
			<canvas ref={grain} width={60} height={107} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={ui} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};
/** the screen's own noise: the low-res night picture breaks up a little, and hard on the refresh where it moved */
const ScreenNoise: React.FC<{t: number; burst: number}> = ({t, burst}) => {
	const ref = useRef<HTMLCanvasElement>(null);
	useLayoutEffect(() => {
		const g = ref.current!.getContext('2d')!;
		const im = g.createImageData(65, 49);
		const r = rng(Math.floor((t + 600) * 18) * 15485863 + 54);
		for (let i = 0; i < im.data.length; i += 4) {
			const v = r() * 255;
			im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
			im.data[i + 3] = (22 + 200 * burst) * r();
		}
		g.putImageData(im, 0, 0);
	}, [t, burst]);
	return <canvas ref={ref} width={65} height={49} style={{position: 'absolute', left: SX * 3, top: SY * 3, width: SW * 3, height: SH * 3, imageRendering: 'pixelated', mixBlendMode: 'screen'}} />;
};

// ------------------------------------------------------------------ assembly
const FPS_SCREEN = 6; // the monitor refreshes six times a second
export const Episode54: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const tv = t >= K.loopShot ? t - DUR : t;
	const shot = shotOf(tv);
	const ts = Math.floor((tv + 600) * FPS_SCREEN) / FPS_SCREEN - 600;
	const lit = shot === 'hand';
	const burst = shot === 'mon' && Math.abs(tv - K.bent) < 0.2 ? 1 : shot === 'hand' && Math.abs(tv - K.behind) < 0.2 ? 1 : 0;
	const bgGrade = shot === 'lit' || shot === 'hand' ? 'contrast(1.1) saturate(0.85) brightness(1.02)' : 'contrast(1.2) saturate(0.7) brightness(0.95)';
	const nightGrade = 'grayscale(1) sepia(1) hue-rotate(58deg) saturate(1.6) contrast(1.5) brightness(1.15)';
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: 'scale(' + SCALE + ')', transformOrigin: '0 0', filter: bgGrade + (deviceShot(shot) ? ' blur(1.2px) brightness(0.55)' : '')}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 60, near: 0.03, far: 60}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<BgScene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			{deviceShot(shot) && (
				<>
					<div style={{position: 'absolute', left: SX * 3, top: SY * 3, width: 130, height: 97.5, transform: `scale(${(SW * 3) / 130})`, transformOrigin: '0 0', filter: lit ? 'contrast(1.1) saturate(0.8) brightness(1.05)' : nightGrade}}>
						<ThreeCanvas width={130} height={98} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 64, near: 0.03, far: 30}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
							<MatsProvider>
								<ScreenScene t={ts} lit={lit} />
							</MatsProvider>
						</ThreeCanvas>
					</div>
					<ScreenNoise t={tv} burst={burst} />
				</>
			)}
			<Overlay t={tv} captions={captions} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep54-monitor-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
