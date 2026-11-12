// Episode 26: "Post Three" (Season 3, a real reported case: the Castle of Good Hope, Cape Town).
// Built to the motion rule and the no-gimmick-transitions rule (hard cuts only).
// Form: a night guard's radio log, first person (a composite guard), his torch POV with his radio
// in his hand; the radio's LCD shows his post, the time, and when it transmits or receives.
// The picture tells it, escalating: a woman in grey runs across the end of the corridor; from above,
// the castle, and a window lights by itself; in the courtyard he stops, two more footsteps sound
// behind him, and when he turns a door is closing; in the governor's room a page turns and the
// chair slides back from the desk by itself; on the ramparts a tall man leans over the battlements,
// straightens, turns his head; gone; in the corridor she runs straight at him and the torch dies;
// in the dungeon the door slams behind him, the torch dies, and in the radio's glow control's last
// message comes in ("WHO IS WITH YOU?") as a grey hand comes to rest on the radio. Black.
// Care: the hanged soldiers and the governor are never shown; the curse is told as legend, the
// heart as history; the guard is a composite; no one is identified.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep26-castle-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {CastleFromAbove, COR_END, Corridor, drawLcd, Dungeon, DUN, EXT, flicker01, GOV, GovRoom, GreyHand, GreyLady, LCD_H, LCD_W, MatsProvider, Radio, RAMP, Ramparts, TallMan, V3, Yard, YARD} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep26Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));

// ------------------------------------------------------------------ key times (scripts/ep26_sound.py uses the same rules)
export const K = {
	hookRun: [0.25, 1.45] as [number, number], // she runs out of a side door and away down the corridor
	cutExt: L.l01.end + 1.0,
	window: L.l02.end + 0.25,
	cutYard: L.l03.start - 0.5,
	stop: L.l03.start + 3.1, // he stops walking ("and when you stop")
	steps2: [L.l03.end + 0.35, L.l03.end + 0.9] as [number, number], // two more footsteps behind him
	turnYard: [L.l03.end + 1.25, L.l03.end + 1.95] as [number, number],
	door: [L.l03.end + 1.55, L.l03.end + 2.55] as [number, number], // the door behind him swings shut
	cutGov: L.l04.start - 0.45,
	page: [L.l04.end - 0.6, L.l04.end + 0.2] as [number, number],
	chair: [L.l05.end + 0.25, L.l05.end + 0.85] as [number, number],
	cutRamp: L.l06.start - 0.55,
	rise: [L.l06.end + 0.15, L.l06.end + 1.0] as [number, number], // the tall man straightens, turns his head
	gone: [L.l06.end + 1.0, L.l06.end + 1.45] as [number, number], // the torch flickers; he is gone
	cutCor: L.l07.start - 0.5,
	appear: L.l08.end + 0.3,
	run: [L.l08.end + 0.55, L.l08.end + 1.75] as [number, number], // she runs at him
	corOut: [L.l08.end + 1.48, L.l08.end + 2.15] as [number, number], // the torch dies; she passes in the dark
	cutDun: L.l09.start - 0.25,
	slam: L.l09.end + 0.45,
	turnDun: [L.l09.end + 0.55, L.l09.end + 1.05] as [number, number],
	torchOut: L.l09.end + 1.35,
	raise: [L.l09.end + 1.45, L.l09.end + 2.05] as [number, number],
	msg: L.l09.end + 2.25,
	hand: [L.l09.end + 3.1, L.l09.end + 4.0] as [number, number],
	black: timeline.duration_seconds - 0.4,
};
export const STINGERS = [K.door[1], K.chair[0], K.rise[0], K.run[0], K.slam, K.hand[0]];

type Shot = 'hook' | 'ext' | 'yard' | 'gov' | 'ramp' | 'cor' | 'dun' | 'black';
const shotAt = (t: number): Shot => {
	if (t < K.cutExt) return 'hook';
	if (t < K.cutYard) return 'ext';
	if (t < K.cutGov) return 'yard';
	if (t < K.cutRamp) return 'gov';
	if (t < K.cutCor) return 'ramp';
	if (t < K.cutDun) return 'cor';
	if (t < K.black) return 'dun';
	return 'black';
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
	c.near = 0.03;
	c.far = 3000;
	camera.updateProjectionMatrix();
	return null;
};

const kf = (t: number, ts: number[], vs: number[]) => interpolate(t, ts, vs, {...cl, easing: (x) => ease(x)});

/** the guard's eye: position, yaw (0 = looking along -z), pitch; walking amount for the bob */
const pov = (t: number, shot: Shot): {p: V3; yaw: number; pitch: number; walk: number} => {
	switch (shot) {
		case 'hook': {
			const z = -9 - 2.2 * lin(t, 0, K.cutExt);
			return {p: [0.1, 1.62, z], yaw: 0.04 * Math.sin(t * 0.8), pitch: -0.04, walk: 1};
		}
		case 'yard': {
			const z = 12 - 9 * lin(t, K.cutYard, K.stop);
			const yaw = kf(t, [K.cutYard, K.stop, K.turnYard[0], K.turnYard[1]], [0.15, -0.05, -0.05, Math.PI + 0.05]);
			return {p: [YARD[0] + 0.3, 1.62, z], yaw, pitch: t > K.turnYard[0] ? -0.02 : -0.12, walk: t < K.stop ? 1 : 0};
		}
		case 'gov': {
			const z = kf(t, [K.cutGov, K.cutGov + 3, K.page[0], K.cutRamp], [2.9, 1.7, 1.45, 1.2]);
			const yaw = kf(t, [K.cutGov, K.cutGov + 1.5, K.cutGov + 3.6, K.cutGov + 6.0, K.page[0] - 0.6, K.cutRamp], [0.15, 0.45, 1.05, 0.42, -0.36, -0.4]);
			const pitch = kf(t, [K.cutGov, K.page[0] - 0.6, K.cutRamp], [-0.05, -0.28, -0.3]);
			return {p: [GOV[0] - 0.5, 1.62, z], yaw, pitch, walk: t < K.cutGov + 3 ? 0.7 : 0.15};
		}
		case 'ramp': {
			const z = -4.5 * lin(t, K.cutRamp, K.gone[1]);
			const yaw = kf(t, [K.cutRamp, K.rise[0], K.gone[1]], [0.02, -0.06, -0.07]);
			return {p: [RAMP[0] + 0.1, 1.62, z], yaw, pitch: 0.02, walk: t < K.rise[0] ? 1 : 0};
		}
		case 'cor': {
			const z = -4 - 5 * lin(t, K.cutCor, K.appear);
			return {p: [0.05, 1.62, z], yaw: 0.03 * Math.sin(t * 0.7), pitch: -0.03, walk: t < K.appear ? 0.8 : 0};
		}
		case 'dun':
		case 'black': {
			const d = ease(lin(t, K.cutDun, K.cutDun + 1.6));
			const y = 1.62 + 1.4 * (1 - d);
			const z = 3.0 - 2.2 * d;
			const yaw = kf(t, [K.cutDun, K.cutDun + 1.8, K.cutDun + 3.2, L.l09.end, K.turnDun[0], K.turnDun[1]], [0, 0, 0.75, 0.6, 0.6, Math.PI - 0.05]);
			const pitch = kf(t, [K.cutDun, K.cutDun + 1.6, K.cutDun + 3.2, K.turnDun[0], K.turnDun[1], K.torchOut, K.raise[1]], [-0.35, -0.12, -0.25, -0.2, 0.22, 0.22, -0.25]);
			return {p: [DUN[0] + 0.1, y, z], yaw, pitch, walk: t < K.cutDun + 1.6 ? 0.8 : 0.1};
		}
		default:
			return {p: [0, 1.62, 0], yaw: 0, pitch: 0, walk: 0};
	}
};

const povPose = (t: number, shot: Shot): {pose: CamPose; torch: V3} => {
	const v = pov(t, shot);
	const h = handheld(t, 1.3 + v.walk * 1.2);
	const bob = Math.abs(Math.sin(t * 5.4)) * 0.035 * v.walk;
	const p: V3 = [v.p[0] + h.dp[0], v.p[1] + bob + h.dp[1], v.p[2] + h.dp[2]];
	const c = Math.cos(v.pitch);
	const l: V3 = [p[0] - Math.sin(v.yaw) * c * 5, p[1] + Math.sin(v.pitch) * 5, p[2] - Math.cos(v.yaw) * c * 5];
	return {pose: {p, l, fov: 58, roll: h.roll * 2}, torch: l};
};

const extPose = (t: number): CamPose => {
	const k = lin(t, K.cutExt, K.cutYard);
	const p: V3 = [EXT[0] - 60 + 40 * k, 270 - 40 * k, 270 - 50 * k];
	return {p, l: [EXT[0] - 5 + 5 * k, 0, -80], fov: 62};
};

// ------------------------------------------------------------------ the state of the world at time t
const torchOn = (t: number, shot: Shot) => {
	if (shot === 'ramp' && t >= K.gone[0] && t < K.gone[1]) return t < K.gone[0] + 0.25 ? flicker01(t, 3) > 0.5 : false;
	if (shot === 'cor' && t >= K.corOut[0] && t < K.corOut[1] + 0.25) return t < K.corOut[0] + 0.12 ? flicker01(t, 5) > 0.5 : t >= K.corOut[1] && flicker01(t, 6) > 0.5;
	if (shot === 'dun' && t >= K.torchOut - 0.3) return t < K.torchOut && flicker01(t, 9) > 0.5;
	return shot !== 'black' && shot !== 'ext';
};

/** the woman in grey, when and where she is */
const ladyAt = (t: number, shot: Shot): {p: V3; ry: number; run: number; lean: number} | null => {
	if (shot === 'hook' && t >= K.hookRun[0] && t < K.hookRun[1]) {
		const k = lin(t, K.hookRun[0], K.hookRun[1]);
		// out of the right-hand doorway at z -17, then away down the corridor and out into the yard
		const x = interpolate(k, [0, 0.25, 1], [1.15, 0.1, 0], cl);
		const z = interpolate(k, [0, 0.25, 1], [-17, -18, -24.5], cl);
		return {p: [x, 0, z], ry: k < 0.25 ? -Math.PI / 2 - 0.6 : Math.PI, run: t * 16, lean: 0.25};
	}
	if (shot === 'cor' && t >= K.appear && t < K.corOut[1]) {
		if (t < K.run[0]) return {p: [0, 0, COR_END - 0.8], ry: 0, run: 0, lean: 0};
		const k = lin(t, K.run[0], K.run[1]);
		const camZ = pov(t, 'cor').p[2];
		return {p: [0.05 + 0.25 * k, 0, COR_END - 0.8 + (camZ - 0.3 - COR_END + 0.8) * k], ry: 0, run: t * 17, lean: 0.22};
	}
	return null;
};

const radioState = (t: number, shot: Shot) => {
	const clock = {hook: '02:14', ext: '02:14', yard: '02:22', gov: '02:31', ramp: '02:40', cor: '02:52', dun: '03:05', black: '03:07'}[shot];
	const tx = (t >= L.l01.start && t < L.l01.end + 0.1) || (t >= L.l09.start && t < L.l09.end + 0.1);
	// the receive light comes on when she is near (a hidden detail)
	const rx =
		(t >= K.hookRun[0] && t < K.hookRun[1] + 0.2) ||
		(t >= K.appear && t < K.corOut[1]) ||
		(t >= K.hand[0] - 0.2 && Math.floor(t * 4) % 2 === 0);
	if (t >= K.msg) {
		return {lines: ['RX CONTROL', 'POST 3. WHO IS', 'WITH YOU?', '03:07'], glow: 1, invert: [0]};
	}
	return {lines: ['POST 3    CH3', clock, tx ? 'TX' : rx ? 'RX' : '', ''], glow: shot === 'dun' && t >= K.torchOut ? 0.75 : 0.45, invert: rx && !tx ? [2] : []};
};

// ------------------------------------------------------------------ one rendered view of the world
const PovTorch: React.FC<{p: V3; l: V3; t: number}> = ({p, l, t}) => {
	const light = useMemo(() => new THREE.SpotLight('#fff2dc', 14, 18, 0.4, 0.5, 1.0), []);
	light.position.set(p[0] + 0.15, p[1] - 0.15, p[2]);
	light.target.position.set(...l);
	light.intensity = 14 * (0.9 + 0.1 * Math.sin(t * 40));
	light.target.updateMatrixWorld();
	return (
		<>
			<primitive object={light} />
			<primitive object={light.target} />
		</>
	);
};

const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotAt(t);
	if (shot === 'black') return null;
	if (shot === 'ext') {
		return (
			<>
				<Cam pose={extPose(t)} />
				<ambientLight intensity={1.6} color="#4a5a7a" />
				<pointLight position={[EXT[0] - 300, 500, -400]} intensity={2.2} decay={0} color="#8a9ac0" />
				<MatsProvider>
					<CastleFromAbove window={t >= K.window} torchAt={0.15 + 0.5 * lin(t, K.cutExt, K.cutYard)} />
				</MatsProvider>
			</>
		);
	}
	const {pose, torch} = povPose(t, shot);
	const on = torchOn(t, shot);
	const lady = ladyAt(t, shot);
	const yardDoor = t < K.door[0] ? 0 : ease(lin(t, K.door[0], K.door[1]));
	const dunDoor = t < K.slam - 0.12 ? 0 : Math.min(1, (t - (K.slam - 0.12)) / 0.12);
	return (
		<>
			<Cam pose={pose} />
			{on && <PovTorch p={pose.p} l={torch} t={t} />}
			{(shot === 'hook' || shot === 'cor') && (
				<>
					<ambientLight intensity={0.22} color="#303848" />
					<pointLight position={[0, 4, COR_END - 3]} intensity={6} distance={12} decay={1} color="#8090c0" />
				</>
			)}
			{shot === 'yard' && (
				<>
					<ambientLight intensity={0.45} color="#34405a" />
					<pointLight position={[YARD[0] - 10, 20, -10]} intensity={0.6} decay={0} color="#8090c0" />
					<pointLight position={[YARD[0], 3.0, 16.6]} intensity={5} distance={7} decay={1} color="#ffc070" />
				</>
			)}
			{shot === 'gov' && (
				<>
					<ambientLight intensity={0.16} color="#303848" />
					<pointLight position={[GOV[0] - 1.6, 1.9, -3.0]} intensity={2.2} distance={4.5} decay={1} color="#7a8ab8" />
				</>
			)}
			{shot === 'ramp' && (
				<>
					<ambientLight intensity={0.32} color="#304058" />
					<pointLight position={[RAMP[0] + 100, 80, -200]} intensity={0.55} decay={0} color="#8a9ac0" />
					<pointLight position={[RAMP[0] + 6, -4, -10]} intensity={3} distance={18} decay={1} color="#d08a40" />
				</>
			)}
			{shot === 'dun' && <ambientLight intensity={on ? 0.06 : 0.0} color="#303848" />}
			<MatsProvider>
				{(shot === 'hook' || shot === 'cor') && <Corridor />}
				{shot === 'yard' && <Yard door={yardDoor} lamp />}
				{shot === 'gov' && <GovRoom chair={ease(lin(t, K.chair[0], K.chair[1]))} page={ease(lin(t, K.page[0], K.page[1]))} />}
				{shot === 'ramp' && (
					<>
						<Ramparts />
						{t < K.gone[0] + 0.25 && <TallMan p={[RAMP[0] + 1.25, 0, -10]} ry={Math.PI / 2} lean={1 - 0.85 * ease(lin(t, K.rise[0], K.rise[1]))} head={-1.35 * ease(lin(t, K.rise[0] + 0.3, K.rise[1] + 0.2))} />}
					</>
				)}
				{shot === 'dun' && <Dungeon door={dunDoor} />}
				{lady && <GreyLady p={lady.p} ry={lady.ry} run={lady.run} lean={lady.lean} />}
			</MatsProvider>
		</>
	);
};

// ------------------------------------------------------------------ the radio, in its own canvas
const RadioScene: React.FC<{t: number; shot: Shot; lcd: THREE.CanvasTexture}> = ({t, shot, lcd}) => {
	const {camera} = useThree();
	camera.position.set(0, 0, 0);
	camera.lookAt(0, 0, -1);
	const st = radioState(t, shot);
	const g = lcd.image.getContext('2d') as CanvasRenderingContext2D;
	drawLcd(g, st.lines, st.glow, st.invert);
	lcd.needsUpdate = true;
	const v = pov(t, shot);
	const h = handheld(t * 1.1 + 3, 1.2 + v.walk * 1.4);
	const bob = Math.sin(t * 5.4) * 0.012 * v.walk;
	const up = shot === 'dun' ? ease(lin(t, K.raise[0], K.raise[1])) : 0;
	const pos: V3 = [0.1 - 0.1 * up + h.dp[0] * 0.6, -0.16 + 0.14 * up + bob + h.dp[1] * 0.6, -0.42 + 0.22 * up];
	const rot: V3 = [-0.3 + 0.32 * up, -0.4 + 0.36 * up, 0.12 - 0.1 * up + h.roll * 3];
	const on = torchOn(t, shot);
	const hand = shot === 'dun' ? lin(t, K.hand[0], K.hand[1]) : 0;
	return (
		<>
			<ambientLight intensity={on ? 0.5 : 0.04} color="#4a5468" />
			{on && <pointLight position={[0.15, 0.05, -0.2]} intensity={0.6} distance={1} decay={1} color="#fff0d8" />}
			<group position={pos} rotation={rot}>
				<Radio lcd={lcd} />
				<pointLight position={[0, 0.04, 0.06]} intensity={st.glow >= 1 ? 0.8 : 0.25} distance={0.35} decay={1} color="#60ff90" />
				{hand > 0 && <GreyHand reach={hand} />}
			</group>
		</>
	);
};

const RadioLayer: React.FC<{t: number; shot: Shot}> = ({t, shot}) => {
	const lcd = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = LCD_W;
		c.height = LCD_H;
		const tx = new THREE.CanvasTexture(c);
		tx.magFilter = THREE.NearestFilter;
		tx.minFilter = THREE.NearestFilter;
		tx.generateMipmaps = false;
		tx.colorSpace = THREE.SRGBColorSpace;
		return tx;
	}, []);
	return (
		<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true, alpha: true}} camera={{fov: 58, near: 0.01, far: 5}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
			<RadioScene t={t} shot={shot} lcd={lcd} />
		</ThreeCanvas>
	);
};

// ------------------------------------------------------------------ 2D overlay: captions and grain
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
			show.forEach((r, i) => out(r, CW / 2, 400 + i * 19 - (show.length - 1) * 19, '#ffffff'));
		}
		const img = g.getImageData(0, 0, CW, CH);
		for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 120 ? 255 : 0;
		g.putImageData(img, 0, 0);
		const n = noise.current!.getContext('2d')!;
		const ni = n.createImageData(LW, LH);
		const r = rng(Math.floor(t * 30) * 7919 + 26);
		for (let i = 0; i < ni.data.length; i += 4) {
			const v = r() * 255;
			ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = v;
			ni.data[i + 3] = 16 * (r() < 0.5 ? 1 : 0.4);
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
export const Episode26: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const shot = shotAt(t);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'saturate(0.75) contrast(1.06)'}}>
				{shot !== 'black' && (
					<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 58, near: 0.03, far: 3000}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
						<Scene t={t} />
					</ThreeCanvas>
				)}
				{shot !== 'black' && shot !== 'ext' && <RadioLayer t={t} shot={shot} />}
			</div>
			{shot !== 'black' && <Overlay t={t} captions={captions} />}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep26-castle-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
