// Episode 30: "What They Tell You" (Season 3 finale, a real place: Poveglia, the Venetian Lagoon).
// Built to the motion rule and the no-gimmick-transitions rule (hard cuts only).
// Form: an unreliable narrator. The legend, as tourists repeat it, over an old travel film (warm,
// faded, gate weave) with bells and water building to a wall; each claim is struck by a stamped
// RECORD card. At "That's what they tell you" the sound cuts dead and the picture is today: grey.
// The picture tells it: the boat crosses the lagoon and the birds lift off the tower; in the field the
// grass parts in a line coming towards us; a shutter swings on the hospital; the bell in the tower
// swings by itself; then today, the ruined corridor, the window at the end; the lagoon, and the boat
// we came in, leaving without us, someone standing in it, facing us. One bell. Black.
// Care: no patient shown; the suicide legend is named as a legend and never depicted (only the bell);
// the island is closed to visitors: no dares.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep30-poveglia-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {Birds, Boat, COR, Corridor, FIELD, HOSP, Island, MatsProvider, TOWER, V3} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep30Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep30_sound.py uses the same rules)
export const K = {
	birds: 0.4,
	cutField: L.l02.start - 0.3,
	part: [L.l02.start + 0.3, L.l03.start - 0.3] as [number, number], // the grass parts, coming towards us
	cutHosp: L.l03.start - 0.3,
	cutTower: L.l04.start - 0.3,
	bell: L.l04.start + 0.6, // the bell begins to swing by itself
	cutRuin: L.l05.end + 0.35, // the wall of sound cuts dead; today
	atWindow: L.l08.start - 0.6,
	boat: [L.l08.start + 0.2, DUR - 0.8] as [number, number], // the boat leaves without us
	bellOnce: DUR - 2.4,
	black: DUR - 0.6,
};
export const STINGERS = [K.cutRuin, K.bellOnce];
const CARDS: {at: number; until: number; text: string}[] = [
	{at: L.l01.end + 0.2, until: K.cutField, text: 'PEOPLE COME BACK. THE ISLAND IS CLOSED TO VISITORS.'},
	{at: L.l02.end + 0.2, until: K.cutHosp, text: 'NO SOURCE FOR THIS NUMBER. A QUARANTINE STATION, 1793-1814.'},
	{at: L.l03.end + 0.15, until: K.cutTower, text: 'A CARE HOME FOR THE ELDERLY, 1922-1968.'},
	{at: L.l04.end + 0.2, until: K.cutRuin, text: 'LEGEND. NO RECORD OF ANY SUCH DOCTOR.'},
	{at: L.l08.end + 0.3, until: K.black, text: 'EMPTY SINCE 1968.'},
];

type Shot = 'boat' | 'field' | 'hosp' | 'tower' | 'ruin' | 'black';
const shotAt = (t: number): Shot => {
	if (t < K.cutField) return 'boat';
	if (t < K.cutHosp) return 'field';
	if (t < K.cutTower) return 'hosp';
	if (t < K.cutRuin) return 'tower';
	if (t < K.black) return 'ruin';
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
	c.near = 0.05;
	c.far = 2500;
	camera.updateProjectionMatrix();
	return null;
};
const kf = (t: number, ts: number[], vs: number[]) => interpolate(t, ts, vs, {...cl, easing: ease});

const boatZ = (t: number) => 170 - 55 * lin(t, 0, K.cutField);
const corZ = (t: number) => kf(t, [K.cutRuin, K.atWindow], [-2, -22.6]);
const leavingBoat = (t: number): V3 => {
	const k = lin(t, K.boat[0], K.boat[1]);
	return [COR[0] + 2 * k, -0.25, -31 - 34 * k];
};

const poseAt = (t: number, shot: Shot): CamPose => {
	const h = handheld(t, 1.2);
	switch (shot) {
		case 'boat': {
			const z = boatZ(t);
			const bob = 0.15 * Math.sin(t * 1.6);
			return {p: [0, 2.2 + bob, z], l: [-6, 7, -6], fov: 50, roll: 0.02 * Math.sin(t * 1.1)};
		}
		case 'field': {
			const k = lin(t, K.cutField, K.cutHosp);
			return {p: [FIELD[0] + 0.6 + h.dp[0], 2.1 + h.dp[1], FIELD[2] + 9.5 - 1.2 * k], l: [FIELD[0], 0.2, FIELD[2] - 3], fov: 52, roll: h.roll};
		}
		case 'hosp': {
			const k = lin(t, K.cutHosp, K.cutTower);
			return {p: [HOSP[0] - 8 + 4 * k, 2.6, HOSP[2] + 24 - 5 * k], l: [HOSP[0] - 1.0, 5.6, HOSP[2] + 5], fov: 50};
		}
		case 'tower': {
			const look = kf(t, [K.cutTower, L.l04.end + 0.2], [6, 25.5]);
			const k = lin(t, K.cutTower, K.cutRuin);
			return {p: [TOWER[0] + 9 - 1.5 * k, 1.6, TOWER[2] + 13 - 2 * k], l: [TOWER[0], look, TOWER[2]], fov: 54, roll: h.roll};
		}
		case 'ruin':
		case 'black': {
			const z = corZ(t);
			const walk = t < K.atWindow ? 1 : 0.2;
			const bob = Math.abs(Math.sin(t * 4.6)) * 0.03 * walk;
			const p: V3 = [COR[0] + h.dp[0], 1.6 + bob + h.dp[1], z];
			if (t < K.atWindow) return {p, l: [COR[0], 1.5, z - 6], fov: 56, roll: h.roll};
			// at the window: watch the boat go
			const b = leavingBoat(t);
			const k = ease(lin(t, K.atWindow, K.atWindow + 1.2));
			return {p, l: [COR[0] + (b[0] - COR[0]) * k, 1.5 + (b[1] + 0.9 - 1.5) * k, z - 6 + (b[2] - (z - 6)) * k], fov: 56 - 30 * ease(lin(t, K.atWindow, K.black)), roll: h.roll};
		}
		default:
			return {p: [0, 2, 0], l: [0, 2, -1], fov: 50};
	}
};

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotAt(t);
	if (shot === 'black') return null;
	const pose = poseAt(t, shot);
	if (shot === 'ruin') {
		const b = leavingBoat(t);
		return (
			<>
				<Cam pose={pose} />
				<ambientLight intensity={0.55} color="#a0a8ac" />
				<pointLight position={[COR[0] + 30, 60, -200]} intensity={0.7} decay={0} color="#c8ccd0" />
				<pointLight position={[COR[0], 2.0, -23.4]} intensity={2.2} distance={8} decay={1} color="#b8c0c8" />
				<MatsProvider look="now">
					<mesh position={[COR[0], 0, -40]}>
						<sphereGeometry args={[900, 10, 8]} />
						<meshBasicMaterial color="#8a9096" side={THREE.BackSide} />
					</mesh>
					<mesh rotation={[-Math.PI / 2, 0, 0]} position={[COR[0], -0.4, -200]}>
						<planeGeometry args={[800, 400, 20, 10]} />
						<meshLambertMaterial color="#6a767c" />
					</mesh>
					<Corridor />
					{t >= K.atWindow - 0.5 && <Boat p={b} ry={0} withFigure />}
				</MatsProvider>
			</>
		);
	}
	const swing = shot === 'tower' ? 0.75 * ease(lin(t, K.bell, K.cutRuin - 0.5)) * Math.sin((t - K.bell) * 2.8) : 0;
	const shutter = shot === 'hosp' ? 0.9 + 0.8 * Math.sin(t * 1.9) * Math.sin(t * 0.7 + 1) : 0.4;
	const part: V3 | null = shot === 'field' && t >= K.part[0] ? [FIELD[0] - 0.5 + 0.8 * lin(t, K.part[0], K.part[1]), 0, FIELD[2] - 7 + 14.5 * lin(t, K.part[0], K.part[1])] : null;
	return (
		<>
			<Cam pose={pose} />
			<ambientLight intensity={0.85} color="#e0b890" />
			<pointLight position={[-160, 60, -480]} intensity={1.5} decay={0} color="#ffc890" />
			{shot === 'field' && <pointLight position={[FIELD[0] + 1, 4, FIELD[2] + 6]} intensity={6} distance={18} decay={1} color="#ffd8a0" />}
			<MatsProvider look="film">
				<Island shutter={shutter} swing={swing} part={part} />
				{shot === 'boat' && <Boat p={[0, -0.35, boatZ(t) - 3.6]} ry={0} />}
				{(shot === 'boat' || shot === 'tower') && <Birds k={shot === 'boat' ? lin(t, K.birds, K.cutField) : 0.6 + 0.4 * Math.sin(t * 0.3)} />}
			</MatsProvider>
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: the RECORD cards, captions, grain, the film's edge
const Overlay: React.FC<{t: number; captions: boolean; film: boolean}> = ({t, captions, film}) => {
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
		// the stamped RECORD card
		const card = CARDS.find((c) => t >= c.at && t < c.until);
		if (card) {
			const k = Math.min(1, (t - card.at) / 0.12);
			const s = 1.25 - 0.25 * k;
			const words = card.text.split(' ');
			const rows: string[] = [];
			let cur = '';
			for (const w of words) {
				if ((cur + ' ' + w).trim().length > 22) {
					rows.push(cur.trim());
					cur = w;
				} else cur += ' ' + w;
			}
			rows.push(cur.trim());
			g.save();
			g.translate(CW / 2, 150);
			g.rotate(-0.04);
			g.scale(s, s);
			const h = 34 + rows.length * 17;
			g.fillStyle = '#e8e0cc';
			g.fillRect(-130, -h / 2, 260, h);
			g.strokeStyle = '#2a2420';
			g.lineWidth = 1;
			g.strokeRect(-126.5, -h / 2 + 3.5, 253, h - 7);
			g.font = 'bold 14px "DejaVu Sans Mono", monospace';
			g.fillStyle = '#b01818';
			g.textAlign = 'left';
			g.fillText('RECORD:', -116, -h / 2 + 22);
			g.font = 'bold 13px "DejaVu Sans Mono", monospace';
			g.fillStyle = '#1a1612';
			rows.forEach((r, i) => g.fillText(r, -116, -h / 2 + 40 + i * 17));
			g.restore();
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
		const r = rng(Math.floor(t * (film ? 18 : 30)) * 7919 + 30);
		for (let i = 0; i < ni.data.length; i += 4) {
			const v = r() * 255;
			ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = v;
			ni.data[i + 3] = (film ? 34 : 16) * (r() < 0.5 ? 1 : 0.4);
		}
		if (film) {
			for (let k = 0; k < 6; k++) {
				const x = Math.floor(r() * LW), y = Math.floor(r() * LH);
				const i = (y * LW + x) * 4;
				ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = r() < 0.5 ? 0 : 255;
				ni.data[i + 3] = 220;
			}
		}
		n.putImageData(ni, 0, 0);
	}, [t, captions, film]);
	return (
		<>
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

// ------------------------------------------------------------------ assembly
export const Episode30: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const shot = shotAt(t);
	const film = shot === 'boat' || shot === 'field' || shot === 'hosp' || shot === 'tower';
	const weave = film ? 0.5 * Math.sin(t * 9.3) + 0.3 * Math.sin(t * 21.1) : 0;
	const flick = film ? 1 + 0.06 * Math.sin(t * 37) * Math.sin(t * 13) : 1;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: weave,
					width: LW,
					height: LH,
					transform: `scale(${SCALE})`,
					transformOrigin: '0 0',
					filter: film ? `sepia(0.45) saturate(1.35) contrast(1.08) brightness(${flick})` : 'grayscale(0.55) contrast(1.02) brightness(0.92)',
				}}
			>
				{shot !== 'black' && (
					<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.05, far: 2500}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
						<Scene t={t} />
					</ThreeCanvas>
				)}
			</div>
			{shot !== 'black' && <Overlay t={t} captions={captions} film={film} />}
			<AbsoluteFill style={{background: film ? 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 48%, rgba(30,10,0,0.75) 100%)' : 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.65) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep30-poveglia-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
