// Episode 29: "Checkout Is at Ten" (Season 3, a real place with reported hauntings: Monte Cristo
// Homestead, Junee, New South Wales). Built to the motion rule and the no-gimmick-transitions rule.
// Form: second person, in real time on the phone's own clock (2:58 to 3:01): you are the overnight
// guest, filming on your phone (its torch on, its status bar, REC, the shutter and flip buttons).
// Bookends: it opens in a roaring storm that cuts to dead silence (the rain stops in the air); it
// ends when you flip the camera around, and the storm slams back.
// The picture tells it: the storm stops and the rain hangs in the air; the house from outside, your
// window lit; the hall from your door, candlelight under the far door, which goes out; the wardrobe
// door creaks open by itself; behind the lace of the French doors a woman in black walks along the
// balcony and stops, facing you; pale fingers on your shoulder; you turn the camera around: your own
// face, and hers, just behind you. The storm. Black.
// Care: no living person named; the family's story is told as reported and nothing as proven; the
// house is private property (closed to visitors since January 2025): no visiting framing.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep29-monte-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {Bedroom, DOORS_Z, EXT, Guest, Hall, HALL, HandOnShoulder, House, MatsProvider, V3, WomanInBlack} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep29Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));

// ------------------------------------------------------------------ key times (scripts/ep29_sound.py uses the same rules)
export const K = {
	silence: 1.3, // the storm stops dead
	cutExt: L.l02.start - 0.4,
	cutHall: L.l03.start - 0.4,
	candleOut: L.l03.end + 0.6,
	cutRoom: L.l04.start - 0.4,
	wardrobe: [L.l04.end + 0.4, L.l04.end + 1.6] as [number, number],
	turnDoors: [L.l05.end + 0.2, L.l05.end + 1.3] as [number, number],
	walk: [L.l06.start + 0.8, L.l06.end + 0.45] as [number, number], // she walks along the balcony
	faces: [L.l06.end + 0.45, L.l06.end + 1.1] as [number, number], // she turns to face the doors
	touch: [L.l07.end + 0.1, L.l07.end + 0.9] as [number, number], // the camera finds the hand on your shoulder
	flip: L.l08.end + 0.4,
	storm: L.l08.end + 3.1, // the storm slams back
	black: L.l08.end + 3.35,
};
export const STINGERS = [K.wardrobe[0], K.faces[0], K.touch[0] + 0.3, K.flip + 0.3, K.storm];

type Shot = 'room' | 'ext' | 'hall' | 'selfie' | 'black';
const shotAt = (t: number): Shot => {
	if (t < K.cutExt) return 'room';
	if (t < K.cutHall) return 'ext';
	if (t < K.cutRoom) return 'hall';
	if (t < K.flip) return 'room';
	if (t < K.black) return 'selfie';
	return 'black';
};
const lightning = (t: number) => {
	if (t >= K.silence && t < K.storm) return 0;
	const r = rng(Math.floor(t * 15) * 31 + 7);
	r();
	return r() < (t >= K.storm ? 0.9 : 0.22) ? 1 : 0;
};

// ------------------------------------------------------------------ cameras
type CamPose = {p: V3; l: V3; fov: number; roll?: number};
const Cam: React.FC<{pose: CamPose}> = ({pose}) => {
	const {camera} = useThree();
	camera.position.set(...pose.p);
	camera.up.set(Math.sin(pose.roll ?? 0), Math.cos(pose.roll ?? 0), 0);
	camera.lookAt(...pose.l);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = pose.fov;
	c.near = 0.02;
	c.far = 1500;
	camera.updateProjectionMatrix();
	return null;
};
const kf = (t: number, ts: number[], vs: number[]) => interpolate(t, ts, vs, {...cl, easing: ease});
const EYE: V3 = [0.4, 1.32, 1.55]; // sitting on the end of the bed
const SHOULDER: V3 = [0.08, 1.0, 1.66]; // your left shoulder

const roomPose = (t: number): CamPose => {
	const storm = t < K.silence;
	const h = handheld(t, storm ? 3.0 : 1.4);
	const p: V3 = [EYE[0] + h.dp[0], EYE[1] + h.dp[1], EYE[2] + h.dp[2]];
	// where the phone points: the doors, the dressing table, the wardrobe, the doors, your shoulder
	const doors: V3 = [0, 1.45, DOORS_Z];
	const table: V3 = [-2.2, 1.2, -0.6];
	const robe: V3 = [-2.1, 1.25, DOORS_Z + 1.0];
	let l: V3 = doors;
	if (t >= K.cutRoom) {
		const a = kf(t, [K.cutRoom, K.cutRoom + 2.5, K.wardrobe[0] - 1.2, K.wardrobe[0] - 0.3, K.turnDoors[0], K.turnDoors[1]], [0, 1, 1, 2, 2, 3]);
		const pts = [doors, table, robe, doors];
		const i = Math.min(2, Math.floor(a));
		const f = a - i;
		l = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f, pts[i][2] + (pts[i + 1][2] - pts[i][2]) * f];
		const s = ease(lin(t, K.touch[0], K.touch[1]));
		if (s > 0) l = [l[0] + (SHOULDER[0] - l[0]) * s, l[1] + (SHOULDER[1] - l[1]) * s, l[2] + (SHOULDER[2] - l[2]) * s];
	}
	return {p, l, fov: 60, roll: h.roll * 2};
};

// ------------------------------------------------------------------ the scene
const PhoneTorch: React.FC<{p: V3; l: V3; on: number}> = ({p, l, on}) => {
	const light = useMemo(() => new THREE.SpotLight('#f4f0ff', 6, 9, 0.6, 0.6, 1.0), []);
	light.position.set(p[0], p[1] - 0.05, p[2] - 0.1);
	light.target.position.set(...l);
	light.intensity = 6 * on;
	light.target.updateMatrixWorld();
	return (
		<>
			<primitive object={light} />
			<primitive object={light.target} />
		</>
	);
};

const womanAt = (t: number): {p: V3; ry: number; walk: number} | null => {
	if (t < K.walk[0]) return null;
	const k = lin(t, K.walk[0], K.walk[1]);
	const x = 3.2 - 3.2 * k;
	const ry = t < K.faces[0] ? -Math.PI / 2 : -Math.PI / 2 + (Math.PI / 2) * ease(lin(t, K.faces[0], K.faces[1]));
	return {p: [x, 0, DOORS_Z - 0.55], ry, walk: t < K.walk[1] ? t * 4.5 : 0};
};

const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotAt(t);
	if (shot === 'black') return null;
	if (shot === 'ext') {
		const k = lin(t, K.cutExt, K.cutHall);
		return (
			<>
				<Cam pose={{p: [EXT[0] - 6 + 4 * k, 2.2 + 1.2 * k, 46 - 8 * k], l: [EXT[0], 5, 0], fov: 50}} />
				<ambientLight intensity={1.1} color="#7080a0" />
				<pointLight position={[EXT[0] + 30, 40, 60]} intensity={1.2} decay={0} color="#c0c8e0" />
				<pointLight position={[EXT[0] + 4, 5.6, 7]} intensity={2.5} distance={8} decay={1} color="#ffc070" />
				<MatsProvider>
					<House lit />
				</MatsProvider>
			</>
		);
	}
	if (shot === 'hall') {
		const k = lin(t, K.cutHall, K.cutRoom);
		const h = handheld(t, 1.4);
		const candle = t < K.candleOut ? 0.8 + 0.2 * Math.sin(t * 13) : 0;
		return (
			<>
				<Cam pose={{p: [HALL[0] + h.dp[0], 1.4 + h.dp[1], -0.2 - 0.6 * k], l: [HALL[0], 1.0, -13], fov: 56, roll: h.roll * 2}} />
				<ambientLight intensity={0.4} color="#405070" />
				<PhoneTorch p={[HALL[0], 1.4, -0.2 - 0.6 * k]} l={[HALL[0], 1.0, -13]} on={1.6} />
				{candle > 0 && <pointLight position={[HALL[0], 0.05, -12.7]} intensity={1.6 * candle} distance={2.5} decay={1} color="#ffa040" />}
				<MatsProvider>
					<Hall candle={candle} />
				</MatsProvider>
			</>
		);
	}
	if (shot === 'selfie') {
		// the front camera: the phone held out in front of you, looking back at you
		const k = lin(t, K.flip, K.storm);
		const cam: V3 = [0.45 + 0.02 * Math.sin(t * 3), 1.3, 0.95 - 0.05 * k];
		const flash = lightning(t);
		return (
			<>
				<Cam pose={{p: cam, l: [0.35, 1.36, 1.8], fov: 62}} />
				<ambientLight intensity={0.04 + 0.6 * flash} color="#8090b0" />
				<pointLight position={[cam[0], cam[1], cam[2] + 0.05]} intensity={1.6} distance={2.2} decay={1} color="#e8f0ff" />
				<MatsProvider>
					<Bedroom wardrobe={1} t={t} rainStop={t >= K.storm ? -1 : K.silence} />
					<Guest p={[0.4, -0.28, 1.6]} ry={Math.PI} />
					<group position={[0.12, -0.16, 1.9]} rotation={[0.18, Math.PI + 0.25, 0]}>
						<WomanInBlack p={[0, 0, 0]} ry={0} />
					</group>
				</MatsProvider>
			</>
		);
	}
	// the room
	const pose = roomPose(t);
	const flash = lightning(t);
	const w = womanAt(t);
	const fingers = ease(lin(t, K.touch[0] + 0.2, K.touch[1]));
	return (
		<>
			<Cam pose={pose} />
			<ambientLight intensity={0.04 + 0.5 * flash} color="#8090b0" />
			<pointLight position={[0.5, 2.2, DOORS_Z - 3]} intensity={t < K.silence ? 0.5 + 30 * flash : 3.2} distance={9} decay={1} color="#a0b0d0" />
			<pointLight position={[0, 1.6, DOORS_Z - 1.0]} intensity={t < K.silence ? 0 : 1.2} distance={3} decay={1} color="#a8b8d8" />
			<PhoneTorch p={pose.p} l={pose.l} on={t < K.silence ? 0.5 : 1 - 0.85 * ease(lin(t, K.touch[0], K.touch[1]))} />
			<MatsProvider>
				<Bedroom wardrobe={ease(lin(t, K.wardrobe[0], K.wardrobe[1])) * 0.7} t={t} rainStop={K.silence} />
				{w && <WomanInBlack p={w.p} ry={w.ry} walk={w.walk} />}
				{t >= K.touch[0] && <HandOnShoulder p={SHOULDER} ry={0.35} k={fingers} />}
			</MatsProvider>
		</>
	);
};

// ------------------------------------------------------------------ the phone's screen: status bar, REC, buttons, captions, grain
const clock = (t: number) => (t < 18 ? '2:58' : t < 38 ? '2:59' : t < K.flip ? '3:00' : '3:01');
const Overlay: React.FC<{t: number; captions: boolean; phone: boolean; selfie: boolean}> = ({t, captions, phone, selfie}) => {
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
		if (phone) {
			g.font = 'bold 13px "DejaVu Sans", sans-serif';
			out(clock(t), 22, 24, '#ffffff', 'left');
			g.font = 'bold 10px "DejaVu Sans", sans-serif';
			out('No Service', 290, 23, '#ffffff', 'right');
			g.strokeStyle = '#ffffff';
			g.lineWidth = 1;
			g.strokeRect(300.5, 14.5, 22, 10);
			g.fillStyle = '#e04040';
			g.fillRect(302, 16, 3, 7);
			// recording: the red dot and the elapsed time
			const rec = Math.floor(t + 12);
			g.fillStyle = '#e02020';
			if (Math.floor(t * 2) % 2 === 0) g.fillRect(146, 44, 8, 8);
			g.font = 'bold 12px "DejaVu Sans Mono", monospace';
			out(`00:${String(Math.floor(rec / 60)).padStart(2, '0')}:${String(rec % 60).padStart(2, '0')}`, 160, 52, '#ffffff', 'left');
			// the shutter (stop) button and the flip-camera button
			g.strokeStyle = '#ffffff';
			g.lineWidth = 3;
			g.beginPath();
			g.arc(180, 590, 22, 0, Math.PI * 2);
			g.stroke();
			g.fillStyle = '#e02020';
			g.fillRect(171, 581, 18, 18);
			const hot = t > K.flip - 0.5 && t < K.flip + 0.3;
			g.strokeStyle = hot ? '#ffd040' : '#ffffff';
			g.lineWidth = 2;
			g.beginPath();
			g.arc(290, 590, 13, 0.3, Math.PI - 0.3);
			g.stroke();
			g.beginPath();
			g.arc(290, 590, 13, Math.PI + 0.3, Math.PI * 2 - 0.3);
			g.stroke();
			g.fillStyle = '#000';
			g.globalAlpha = 0.35;
			g.fillRect(0, 0, CW, 32);
			g.globalAlpha = 1;
			g.font = 'bold 13px "DejaVu Sans", sans-serif';
			out(clock(t), 22, 24, '#ffffff', 'left');
			g.font = 'bold 10px "DejaVu Sans", sans-serif';
			out(selfie ? 'FRONT' : '1x', 70, 560, '#ffffff', 'center');
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
			show.forEach((r, i) => out(r, CW / 2, 500 + i * 19 - (show.length - 1) * 19, '#ffffff'));
		}
		const img = g.getImageData(0, 0, CW, CH);
		for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 120 ? 255 : 0;
		g.putImageData(img, 0, 0);
		const n = noise.current!.getContext('2d')!;
		const ni = n.createImageData(LW, LH);
		const r = rng(Math.floor(t * 30) * 7919 + 29);
		for (let i = 0; i < ni.data.length; i += 4) {
			const v = r() * 255;
			ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = v;
			ni.data[i + 3] = 30 * (r() < 0.5 ? 1 : 0.4);
		}
		n.putImageData(ni, 0, 0);
	}, [t, captions, phone, selfie]);
	return (
		<>
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

// ------------------------------------------------------------------ assembly
export const Episode29: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const shot = shotAt(t);
	const selfie = shot === 'selfie';
	const phone = shot === 'room' || shot === 'hall' || selfie;
	// switching cameras, the phone blurs the picture for a moment; the front camera is mirrored
	const switching = selfie && t < K.flip + 0.3 ? 4 : 0;
	const white = t >= K.storm && t < K.black ? 0.85 : 0;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: selfie ? `translateX(${LW * SCALE}px) scale(${-SCALE}, ${SCALE})` : `scale(${SCALE})`, transformOrigin: '0 0', filter: `saturate(0.7) contrast(1.08)${switching ? ` blur(${switching}px)` : ''}`}}>
				{shot !== 'black' && (
					<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 60, near: 0.02, far: 1500}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
						<Scene t={t} />
					</ThreeCanvas>
				)}
			</div>
			{white > 0 && <AbsoluteFill style={{background: `rgba(230,236,255,${white})`}} />}
			{shot !== 'black' && <Overlay t={t} captions={captions} phone={phone} selfie={selfie} />}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep29-monte-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
