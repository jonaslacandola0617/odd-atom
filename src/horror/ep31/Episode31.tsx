// Episode 31: "Dalawa Sila" (Season 4 opener, a documented case: Clarita Villanueva, the Manila City
// Jail / old Bilibid, May 1953). Taglish, Juanito. Built to the motion rule; hard cuts only.
// Form: "the examination". We only ever see hands, arms, shoes and paper: her forearm in a pool of
// torchlight, the examiners' hands, the press, the report. She is never seen above the shoulder.
// The picture tells it: a bite presses into clean skin (hook); the jail wall at night, a guard runs
// with a lamp to the one lit window; the corridor, keys, her door; in the cell a cup rolls by itself
// and two shadows grow on the wall, one tall, one small; the doctor's hands, the mark is wet, a second,
// smaller bite presses in beside it; the page comes off the press; polished shoes at the bars, the hat
// falls from his hand; a photographer's flash: the cot sinks as someone unseen sits on it, and in the
// second flash the two shadows stand by the cot; prayer, the blanket ripples as something crosses
// under it, then lies still; the report is typed, the typing stops, and a bite presses into the
// doctor's own wrist (our dramatisation, never claimed). Black; the loop returns to the first bite.
// Care: she was a minor: no face, nothing sexualised; doctors' explanation in the narration; the
// mayor and the pastor are shown only as shoes, hands and a hat; the prayer is reported, not mocked.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep31-clarita-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {ARM, Blanket, Book, CELL, COR, Cell, Corridor, Decal, Hand, MatsProvider, OFFICE, Office, PRESS, Press, PrisonWall, V3, Visitor, WALL, WallShadow, drawBite, useM} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep31Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep31_sound.py uses the same rules)
export const K = {
	bite: [0.3, 2.6] as [number, number], // the hook: the bite presses in
	cutWall: L.l02.start - 0.3,
	cutCor: L.l02.start + 4.8,
	keys: L.l03.start - 2.2, // the guard's keys in the lock
	doorOpen: [L.l03.start - 1.6, L.l03.start - 0.5] as [number, number],
	cutCell: L.l03.start - 0.3,
	cup: [L.l03.start + 0.1, L.l03.start + 1.6] as [number, number],
	tall: L.l03.start + 2.9, // "isang malaki at maitim"
	small: L.l03.start + 5.6, // "at isang maliit"
	lean: [L.l03.end, L.l04.start - 0.3] as [number, number],
	cutExam: L.l04.start - 0.3,
	touch: [L.l04.start + 3.0, L.l04.start + 5.6] as [number, number],
	bite2: [L.l04.end + 0.15, L.l04.end + 1.0] as [number, number], // a second, smaller bite, in the gap
	cutPress: L.l05.start - 0.3,
	cutMayor: L.l05.start + 2.4,
	hatDrop: [L.l05.end + 0.15, L.l05.end + 0.55] as [number, number],
	cutPhoto: L.l06.start - 0.3,
	flash1: L.l06.start - 0.15,
	sit: [L.l06.start + 2.2, L.l06.end - 0.4] as [number, number], // the cot sinks: someone sits on it
	flash2: L.l06.end + 0.18, // the shadows stand by the cot
	cutPrayer: L.l07.start - 0.3,
	ripple: [L.l07.start + 1.4, L.l07.start + 4.4] as [number, number],
	cutReport: L.l08.start - 0.3,
	typeStop: L.l08.end + 0.3,
	wrist: [L.l08.end + 0.6, L.l08.end + 2.0] as [number, number],
	black: DUR - 0.4,
};
export const STINGERS = [K.cutWall, K.cutCell, K.bite2[0], K.hatDrop[0], K.flash1, K.flash2, K.wrist[0]];

type Shot = 'arm' | 'wall' | 'cor' | 'cell' | 'exam' | 'press' | 'mayor' | 'photo' | 'prayer' | 'report' | 'black';
const shotAt = (t: number): Shot => {
	if (t < K.cutWall) return 'arm';
	if (t < K.cutCor) return 'wall';
	if (t < K.cutCell) return 'cor';
	if (t < K.cutExam) return 'cell';
	if (t < K.cutPress) return 'exam';
	if (t < K.cutMayor) return 'press';
	if (t < K.cutPhoto) return 'mayor';
	if (t < K.cutPrayer) return 'photo';
	if (t < K.cutReport) return 'prayer';
	if (t < K.black) return 'report';
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
	c.near = 0.02;
	c.far = 900;
	camera.updateProjectionMatrix();
	return null;
};
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
// where the marks are: the top of her forearm
const MARK: V3 = add(ARM, [-0.1, 0.037, 0]);
// the doctor's right wrist at the typewriter (where the last bite presses in)
const RHAND: V3 = [OFFICE[0] + 0.1, 0.93, 0.47];
const WRIST: V3 = [RHAND[0], RHAND[1] + 0.047, RHAND[2] - 0.0];

const poseAt = (t: number, shot: Shot): CamPose => {
	const h = handheld(t, 0.6);
	switch (shot) {
		case 'arm': {
			const k = ease(lin(t, 0, K.cutWall));
			return {p: add(MARK, [0.08 + h.dp[0] * 0.1, 0.36 - 0.12 * k, 0.36 - 0.12 * k]), l: add(MARK, [0.04, -0.02, 0]), fov: 38, roll: h.roll * 0.5};
		}
		case 'wall': {
			const k = lin(t, K.cutWall, K.cutCor);
			return {p: [WALL[0] - 7 + 6 * k, 1.6, 10 - 1 * k], l: [WALL[0] - 6.5 + 7 * k, 2.4, 0], fov: 58};
		}
		case 'cor': {
			const k = ease(lin(t, K.cutCor, K.cutCell - 0.2));
			const walk = Math.abs(Math.sin(t * 4.4)) * 0.03 * (1 - k);
			return {p: [COR[0] + h.dp[0], 1.6 + walk + h.dp[1], 4 - 13.4 * k], l: [COR[0] + 0.05, 1.3 - 0.2 * k, -11.2], fov: 52, roll: h.roll};
		}
		case 'cell': {
			const k = ease(lin(t, K.cutCell, K.cutExam));
			return {p: add([0.35 + h.dp[0], 1.45 + h.dp[1], 2.7], [0, -0.2 * k, -1.5 * k]), l: [0.35, 1.15, -1.4], fov: 54, roll: h.roll};
		}
		case 'exam': {
			const k = ease(lin(t, K.cutExam, K.cutPress));
			return {p: add(MARK, [0.1 + h.dp[0] * 0.1, 0.5 - 0.16 * k, 0.55 - 0.2 * k]), l: add(MARK, [0.06, 0, 0.04]), fov: 42, roll: h.roll * 0.5};
		}
		case 'press': {
			const k = lin(t, K.cutPress, K.cutMayor);
			return {p: [PRESS[0], 2.2 - 0.25 * k, 0.9], l: [PRESS[0], 1.0, 0.25], fov: 48, roll: 0.03 * Math.sin(t * 2)};
		}
		case 'mayor': {
			const k = ease(lin(t, K.cutMayor, K.cutPhoto));
			return {p: [0.05 + h.dp[0], 0.3 + 0.1 * k, 0.5], l: [0.05, 0.5 + 0.15 * k, 2.7], fov: 62, roll: h.roll};
		}
		case 'photo': {
			const k = ease(lin(t, K.cutPhoto, K.cutPrayer));
			return {p: [0.45 + h.dp[0], 1.3 + h.dp[1], 1.45 - 0.5 * k], l: [0.45, 0.7, -1.0], fov: 56, roll: h.roll};
		}
		case 'prayer': {
			const k = ease(lin(t, K.cutPrayer, K.cutReport));
			return {p: add(ARM, [0.1 + h.dp[0] * 0.2, 0.62 - 0.12 * k, 0.75 - 0.2 * k]), l: add(ARM, [0.1, 0, -0.12]), fov: 50, roll: h.roll * 0.5};
		}
		case 'report':
		case 'black': {
			const k = ease(lin(t, K.typeStop - 0.4, K.wrist[1]));
			const a: V3 = [OFFICE[0] + h.dp[0] * 0.3, 1.32, 0.98];
			const la: V3 = [OFFICE[0] + 0.02, 0.92, 0.25];
			const b: V3 = add(WRIST, [0.0, 0.42, 0.3]);
			return {p: mix3(a, b, k), l: mix3(la, WRIST, k), fov: 46 - 8 * k, roll: h.roll * 0.5};
		}
		default:
			return {p: [0, 2, 0], l: [0, 2, -1], fov: 50};
	}
};

// ------------------------------------------------------------------ live canvas textures
const useLive = (w: number, h: number) =>
	useMemo(() => {
		const c = document.createElement('canvas');
		c.width = w;
		c.height = h;
		const tx = new THREE.CanvasTexture(c);
		tx.magFilter = THREE.NearestFilter;
		tx.minFilter = THREE.NearestFilter;
		tx.generateMipmaps = false;
		tx.colorSpace = THREE.SRGBColorSpace;
		return tx;
	}, [w, h]);

/** The newspaper page: our words, a reconstruction (no real masthead). */
const drawPage = (g: CanvasRenderingContext2D, W: number, H: number) => {
	g.fillStyle = '#d6cfba';
	g.fillRect(0, 0, W, H);
	g.fillStyle = '#141414';
	g.fillRect(6, 8, W - 12, 2);
	g.font = 'bold 9px "DejaVu Sans Mono", monospace';
	g.textAlign = 'center';
	g.fillText('MANILA, MAY 1953', W / 2, 20);
	g.fillRect(6, 24, W - 12, 1);
	g.font = 'bold 19px "DejaVu Sans", sans-serif';
	['GIRL IN CITY', 'JAIL "BITTEN"', 'BY UNSEEN'].forEach((s, i) => g.fillText(s, W / 2, 46 + i * 21));
	g.font = 'bold 10px "DejaVu Sans Mono", monospace';
	g.fillText('MAYOR SAYS HE SAW THE MARKS', W / 2, 118);
	// the photograph, in halftone: an arm, and the ring of marks
	const px = 12, py = 126, pw = W - 24, ph = 80;
	for (let y = 0; y < ph; y += 3)
		for (let x = 0; x < pw; x += 3) {
			const armY = ph * 0.55 + 6 * Math.sin(x / 40);
			const onArm = Math.abs(y - armY) < 14;
			const ring = Math.abs(Math.hypot((x - pw * 0.45) / 1.4, y - armY) - 6) < 1.6;
			let v = onArm ? 0.35 : 0.85;
			if (ring) v = 1;
			const r = v * 1.45;
			g.beginPath();
			g.arc(px + x + 1.5, py + y + 1.5, r, 0, Math.PI * 2);
			g.fill();
		}
	// columns of text
	for (let col = 0; col < 3; col++)
		for (let y = py + ph + 8; y < H - 6; y += 4) g.fillRect(8 + col * ((W - 16) / 3), y, (W - 16) / 3 - 6 - ((y * 7 + col * 13) % 9), 1.5);
};

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{t: number; page: THREE.CanvasTexture; report: THREE.CanvasTexture}> = ({t, page, report}) => {
	const M = useM();
	const shot = shotAt(t);
	if (shot === 'black') return null;
	const pose = poseAt(t, shot);
	const flick = 0.9 + 0.1 * Math.sin(t * 13) * Math.sin(t * 7.3);
	const flashAt = (a: number) => Math.max(0, 1 - Math.abs(t - a) / 0.12) * (t >= a - 0.02 ? 1 : 0);
	if (shot === 'wall') {
		const k = lin(t, K.cutWall, K.cutCor);
		const win = 0.6 + 0.4 * Math.abs(Math.sin(t * 9) * Math.sin(t * 3.1));
		return (
			<>
				<Cam pose={pose} />
				<ambientLight intensity={0.35} color="#5a6a8a" />
				<pointLight position={[WALL[0] - 30, 60, 80]} intensity={0.6} decay={0} color="#8a9ac0" />
				<PrisonWall t={t} guardX={WALL[0] - 9 + 8 * k} window={win} />
			</>
		);
	}
	if (shot === 'cor') {
		const door = ease(lin(t, K.doorOpen[0], K.doorOpen[1]));
		return (
			<>
				<Cam pose={pose} />
				<ambientLight intensity={0.3} color="#8a7a60" />
				{[0, -3.2, -6.4].map((z) => (
					<pointLight key={z} position={[COR[0], 2.35, z]} intensity={2.4} distance={6} decay={1} color="#ffe0a8" />
				))}
				<pointLight position={[COR[0] + 0.6, 0.6, -12.6]} intensity={3} distance={4} decay={1} color="#ffb060" />
				<Corridor t={t} door={door} cup={lin(t, K.cutCor + 0.8, K.cutCor + 3.6)} />
			</>
		);
	}
	if (shot === 'press') {
		return (
			<>
				<Cam pose={pose} />
				<ambientLight intensity={0.5} color="#ffffff" />
				<pointLight position={[PRESS[0], 3, 0.5]} intensity={4} distance={8} decay={1} color="#ffffff" />
				<Press t={t} page={page} feed={ease(lin(t, K.cutPress, K.cutMayor - 0.2))} />
			</>
		);
	}
	if (shot === 'report') {
		const typing = t < K.typeStop ? 1 : 0;
		const kk = (i: number) => (typing ? Math.max(0, Math.sin(t * 15 + i * 2.1)) * 0.012 : 0);
		const lamp = t > K.wrist[1] - 0.4 ? 0.4 + 0.6 * Math.abs(Math.sin(t * 23)) : 1;
		return (
			<>
				<Cam pose={pose} />
				<ambientLight intensity={0.22} color="#a08060" />
				<Office report={report} lamp={lamp} typed={lin(t, K.cutReport, K.typeStop)} />
				<Hand p={[OFFICE[0] - 0.1, 0.93 - kk(0), 0.47]} r={[0, Math.PI / 2, 0.15]} skin={M.skinPale} sleeve={M.white} cuff={M.cuff} curl={0.55} sleeveLen={0.2} />
				<Hand p={[RHAND[0], RHAND[1] - kk(1), RHAND[2]]} r={[0, Math.PI / 2, 0.15]} skin={M.skinPale} sleeve={M.white} cuff={M.cuff} curl={typing ? 0.55 : 0.2 + 0.5 * lin(t, K.wrist[0], K.wrist[1])} sleeveLen={0.2} />
				<Decal p={add(WRIST, [0, 0.001, 0])} r={[-Math.PI / 2, 0, 0]} w={0.085} h={0.065} dim={0.8 * lamp}
					draw={(g, W, H) => drawBite(g, W / 2, H / 2, W * 0.22, H * 0.28, ease(lin(t, K.wrist[0], K.wrist[1])), lin(t, K.wrist[1] - 0.3, K.wrist[1] + 0.4), 57)} />
			</>
		);
	}
	// ---- the cell (arm, cell, exam, mayor, photo, prayer)
	const cup = shot === 'cell' ? ease(lin(t, K.cup[0], K.cup[1])) : shot === 'arm' || shot === 'exam' ? 0 : 1;
	const tallOp = shot === 'cell' ? lin(t, K.tall - 0.6, K.tall + 0.5, 0, 0.9) : shot === 'photo' ? 0.85 * flashAt(K.flash2) * (t >= K.flash2 ? 1 : 0) : 0;
	const smallOp = shot === 'cell' ? lin(t, K.small - 0.6, K.small + 0.4, 0, 0.85) : tallOp;
	const lean = shot === 'cell' ? 0.25 * ease(lin(t, K.lean[0], K.lean[1])) : 0.1;
	const wave = shot === 'prayer' ? {x: -0.8 + 1.7 * lin(t, K.ripple[0], K.ripple[1]), amp: 0.07 * Math.sin(Math.PI * lin(t, K.ripple[0], K.ripple[1]))} : shot === 'cell' ? {x: 0.2, amp: 0.012 * Math.max(0, Math.sin(t * 5.3))} : undefined;
	const dent = shot === 'photo' ? {x: 0.55, z: 0.2, depth: 0.11 * ease(lin(t, K.sit[0], K.sit[1]))} : undefined;
	const flash = shot === 'photo' ? Math.max(flashAt(K.flash1), flashAt(K.flash2)) : 0;
	const prayFlame = shot === 'prayer' ? 1 - 0.7 * Math.sin(Math.PI * lin(t, K.ripple[0], K.ripple[1])) : 1;
	const bite1 = shot === 'arm' ? ease(lin(t, K.bite[0], K.bite[1])) : 1;
	const small1 = shot === 'arm' ? ease(lin(t, K.bite[0] + 1.0, K.bite[1] + 1.2)) * 0.6 : 0.6; // hidden detail: a small bite already, in the hook
	const bite2 = shot === 'exam' ? ease(lin(t, K.bite2[0], K.bite2[1])) : shot === 'arm' ? 0 : 1;
	const wet = shot === 'arm' ? lin(t, K.bite[1] - 0.4, K.bite[1] + 0.6) : shot === 'exam' ? 0.5 + 0.5 * lin(t, K.touch[0], K.touch[1]) : 0.4;
	const torch = shot === 'arm' || shot === 'exam';
	const touch = shot === 'exam' ? Math.sin(Math.PI * lin(t, K.touch[0], K.touch[1])) : 0;
	return (
		<>
			<Cam pose={pose} />
			<ambientLight intensity={0.32 + 2.5 * flash} color={flash > 0 ? '#ffffff' : '#7a6448'} />
			<pointLight position={add(CELL, [0.2, 2.6, -0.3])} intensity={(shot === 'prayer' ? 1.6 : 2.4) * (shot === 'prayer' ? prayFlame : 1)} distance={5} decay={1} color="#ffe2b0" />
			<pointLight position={add(CELL, [1.1, 0.35, -0.3])} intensity={3.6 * flick * prayFlame} distance={4.5} decay={1} color="#ffb060" />
			{torch && <pointLight position={add(MARK, [0.05, 0.35, 0.3])} intensity={2.4} distance={1.4} decay={1} color="#ffe8c0" />}
			{shot === 'mayor' && <pointLight position={[0.4, 2.2, 2.6]} intensity={5} distance={5} decay={1} color="#ffe0a8" />}
			{shot === 'prayer' && <pointLight position={add(ARM, [0.35, 0.3, 0.15])} intensity={2.2 * prayFlame} distance={1.6} decay={1} color="#ffc880" />}
			<Cell cup={cup} blanketWave={wave} dent={dent} door={0} />
			<Decal p={MARK} r={[-Math.PI / 2, 0, 0]} w={0.15} h={0.09} dim={torch ? 1 : 0.55 + 0.6 * flash}
				draw={(g, W, H) => {
					drawBite(g, W * 0.42, H * 0.5, W * 0.15, H * 0.24, bite1, wet, 31);
					drawBite(g, W * 0.78, H * 0.42, W * 0.08, H * 0.13, Math.max(small1 * (shot === 'arm' ? 1 : 0), bite2), wet * 0.7, 32);
				}} />
			<WallShadow kind="tall" p={[0.72, 0.62, -1.49]} h={1.95} op={tallOp} lean={-lean} />
			<WallShadow kind="small" p={[-0.02, 0.62, -1.49]} h={1.0} op={smallOp} lean={-lean * 0.6} />
			{shot === 'exam' && (
				<>
					{/* the doctor's left hand holds her wrist; the right touches the mark */}
					<Hand p={add(ARM, [0.26, 0.07, -0.01])} r={[0, Math.PI, -0.35]} skin={M.skinPale} sleeve={M.white} cuff={M.cuff} curl={1.0} sleeveLen={0.22} />
					<Hand p={add(MARK, [0.01, 0.07 - 0.04 * touch, -0.2 + 0.05 * touch])} r={[0, -Math.PI / 2, -0.35 - 0.15 * touch]} skin={M.skinPale} sleeve={M.white} cuff={M.cuff} curl={0.8} point sleeveLen={0.22} />
				</>
			)}
			{shot === 'prayer' && (
				<>
					{/* two hands over hers, the pastor's dark sleeves */}
					<Hand p={add(ARM, [0.3, 0.06, 0.05])} r={[0, Math.PI + 0.25, -0.3]} skin={M.skinPale} sleeve={M.darkSleeve} cuff={M.cuff} curl={0.85} sleeveLen={0.25} />
					<Hand p={add(ARM, [0.3, 0.09, -0.06])} r={[0, Math.PI - 0.25, -0.35]} skin={M.skinPale} sleeve={M.darkSleeve} cuff={M.cuff} curl={0.95} sleeveLen={0.25} />
					<Book p={add(ARM, [0.32, -0.03, -0.12])} ry={0.3} />
				</>
			)}
			{shot === 'mayor' && <Visitor p={[0.05, 0, 4.4 - 1.7 * ease(lin(t, K.cutMayor, K.cutMayor + 1.6))]} t={t} walk={t < K.cutMayor + 1.6 ? 1 : 0} hatDrop={ease(lin(t, K.hatDrop[0], K.hatDrop[1]))} />}
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: captions, grain, flash, halftone
const Overlay: React.FC<{t: number; captions: boolean; shot: Shot}> = ({t, captions, shot}) => {
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
		const r = rng(Math.floor(t * 24) * 7919 + 31);
		for (let i = 0; i < ni.data.length; i += 4) {
			const v = r() * 255;
			ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = v;
			ni.data[i + 3] = 22 * (r() < 0.5 ? 1 : 0.4);
		}
		n.putImageData(ni, 0, 0);
	}, [t, captions, shot]);
	const halftone = shot === 'press';
	const flash = shot === 'photo' ? Math.max(...[K.flash1, K.flash2].map((a) => (t >= a ? Math.max(0, 1 - (t - a) / 0.25) : 0))) : 0;
	return (
		<>
			{halftone && (
				<div style={{position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.45) 34%, rgba(0,0,0,0) 38%)', backgroundSize: '18px 18px', mixBlendMode: 'multiply'}} />
			)}
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			{flash > 0 && <AbsoluteFill style={{background: '#fffaf0', opacity: 0.85 * flash}} />}
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

const GRADE: Record<Shot, string> = {
	arm: 'sepia(0.3) saturate(0.85) contrast(1.12)',
	wall: 'saturate(0.55) contrast(1.05) brightness(0.95)',
	cor: 'sepia(0.35) saturate(0.6) contrast(1.1)',
	cell: 'sepia(0.35) saturate(0.6) contrast(1.12)',
	exam: 'sepia(0.3) saturate(0.85) contrast(1.12)',
	press: 'grayscale(1) contrast(1.5) brightness(1.05)',
	mayor: 'sepia(0.35) saturate(0.55) contrast(1.12)',
	photo: 'grayscale(0.85) contrast(1.25)',
	prayer: 'sepia(0.35) saturate(0.7) contrast(1.1)',
	report: 'sepia(0.4) saturate(0.7) contrast(1.12)',
	black: 'none',
};

// ------------------------------------------------------------------ assembly
export const Episode31: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const shot = shotAt(t);
	const page = useLive(180, 300);
	const report = useLive(72, 90);
	// draw the page once and the report every frame (it is being typed)
	{
		const g = (page.image as HTMLCanvasElement).getContext('2d')!;
		if (!(page as unknown as {drawn?: boolean}).drawn) {
			drawPage(g, 180, 300);
			(page as unknown as {drawn?: boolean}).drawn = true;
			page.needsUpdate = true;
		}
		const r = (report.image as HTMLCanvasElement).getContext('2d')!;
		r.fillStyle = '#ddd5c0';
		r.fillRect(0, 0, 72, 90);
		r.fillStyle = '#1a1a1a';
		const typed = lin(t, K.cutReport, K.typeStop);
		const rows = Math.floor(typed * 16);
		const rr = rng(311);
		for (let i = 0; i < 18; i++) {
			const len = 30 + Math.floor(rr() * 30);
			if (i < rows) for (let x = 6; x < 6 + len; x += 2) if (rr() > 0.18) r.fillRect(x, 8 + i * 4.4, 1, 2);
		}
		report.needsUpdate = true;
	}
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: GRADE[shot]}}>
				{shot !== 'black' && (
					<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.02, far: 900}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
						<MatsProvider>
							<Scene t={t} page={page} report={report} />
						</MatsProvider>
					</ThreeCanvas>
				)}
			</div>
			{shot !== 'black' && <Overlay t={t} captions={captions} shot={shot} />}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep31-clarita-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
