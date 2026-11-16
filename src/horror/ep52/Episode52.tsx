// Episode 52: "The Branch" (Season 6: a utility lineman's night call in a South Texas colonia, retold in our
// own words from a reader-submitted account; no real company, town or family). English, Jack. The PSX
// models; hard cuts only; a score of its own; a seamless loop (the last shot is the first, on negative time).
// Form: "a found phone video": everything is the lineman's phone (REC, timer, focus box, compression), up to
// the gallery, where the last clip is one he never took: from the branch, looking down at his truck.
// Mechanism: transformation, caught halfway. It is a man with an owl's mantle growing through him: it turns
// its head round to the light (a man's face), its knees bend the wrong way, and its arms unfold as wings far
// too long. Gore: the skin of its forearm splits where the quills push through, and it bleeds.
// Cast: it, Character_05 (grey); the neighbour, Character_31_Female; the lineman, Character_30 (vest, hat).
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep52-branch-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {ARMS_DOWN, merge, PsxCharacter} from '../psx/models';
import {Box} from '../ep41/world';
import {BUCKET_DOWN, BUCKET_UP, It, itBones, ItPose, Lineman, MatsProvider, PERCH, Street, Truck, useM, V3} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep52Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep52_sound.py reads the same rules)
export const K = {
	cutStreet: L.l01.start - 0.25,
	park: L.l01.start + 4.9, // the truck stops by the pole
	curtain: L.l01.start + 3.4, // a curtain pulled aside as the truck passes
	cutNeighbour: L.l02.start - 0.35,
	point: L.l02.start + 3.0, // she points up
	tiltUp: [L.l02.start + 3.5, L.l02.end + 0.1],
	shift: L.l02.end - 0.4, // something big shifts in the dark leaves
	cutBucket: L.l03.start - 1.9,
	rise: [L.l03.start - 1.7, L.l03.start + 3.0],
	lightOn: L.l03.start + 1.2, // the work light clicks on: a hunched feathered back
	turn: [L.l03.start + 4.6, L.l03.start + 5.8], // "Then it turned to the light"
	cutLegs: L.l04.start - 0.3,
	cutGore: L.l04.start + 3.78,
	wings: [L.l04.end + 0.27, L.l04.end + 0.95], // they open at the lens (the stinger)
	drop: L.l04.end + 1.55, // the phone falls
	cutDrive: L.l05.start - 0.38,
	cutGallery: L.l05.start + 3.87,
	play: L.l05.start + 5.0, // the clip he never took plays
	loopShot: DUR - 2.4,
};
export const STINGERS = [K.wings[0]];

type Shot = 'hook' | 'street' | 'neighbour' | 'bucket' | 'turn' | 'legs' | 'gore' | 'wings' | 'drive' | 'gallery' | 'branch';
const CUTS: [number, Shot][] = [
	[K.cutStreet, 'hook'],
	[K.cutNeighbour, 'street'],
	[K.cutBucket, 'neighbour'],
	[K.turn[0] - 0.7, 'bucket'],
	[K.cutLegs, 'turn'],
	[K.cutGore, 'legs'],
	[K.wings[0] - 0.2, 'gore'],
	[K.cutDrive, 'wings'],
	[K.cutGallery, 'drive'],
	[K.play, 'gallery'],
	[K.loopShot, 'branch'],
];
const shotOf = (t: number): Shot => (t < 0 ? 'hook' : CUTS.find(([c]) => t < c)?.[1] ?? 'hook');

// ------------------------------------------------------------------ cameras: a phone in a shaking hand
type CamPose = {p: V3; l: V3; fov: number; roll?: number};
const Cam: React.FC<{get: () => CamPose}> = ({get}) => {
	const {camera} = useThree();
	const aim = (pose: CamPose) => {
		camera.position.set(...pose.p);
		camera.up.set(Math.sin(pose.roll ?? 0), Math.cos(pose.roll ?? 0), 0);
		camera.lookAt(...pose.l);
		const c = camera as THREE.PerspectiveCamera;
		c.fov = pose.fov;
		c.near = 0.03;
		c.far = 160;
		c.updateProjectionMatrix();
	};
	useFrame(() => aim(get()));
	aim(get());
	return null;
};
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
/** a phone: handheld wobble in the look point as well as the position */
const phone = (t: number, p: V3, l: V3, fov: number, shake: number): CamPose => {
	const h = handheld(t * 1.3, shake);
	const h2 = handheld(t * 0.9 + 17, shake);
	return {p: [p[0] + h.dp[0] * 0.25, p[1] + h.dp[1] * 0.25, p[2] + h.dp[2] * 0.25], l: [l[0] + h2.dp[0] * 0.6, l[1] + h2.dp[1] * 0.6, l[2] + h2.dp[2] * 0.6], fov, roll: h.roll * 0.4};
};
const truckX = (t: number) => (t < K.park ? 26 * (1 - ease(lin(t, K.cutStreet - 0.5, K.park))) : 0);
const driveX = (t: number) => -12 * lin(t, K.cutDrive, K.cutGallery) ** 1.4;
const bucketAt = (t: number): V3 => mix3(BUCKET_DOWN, BUCKET_UP, ease(lin(t, K.rise[0], K.rise[1])));
const EYE = 1.45;
const HEAD: V3 = [PERCH[0], PERCH[1] + 0.85, PERCH[2]];

const poseAt = (t: number, shot: Shot): CamPose => {
	const b = BUCKET_UP;
	const eye: V3 = [b[0], b[1] + EYE, b[2]];
	switch (shot) {
		case 'hook':
		case 'turn': {
			// level with its face across the gap; the digital zoom creeps in
			const z = shot === 'turn' ? lin(t, K.turn[1], K.cutLegs) : lin(t, -2.4, K.cutStreet);
			return phone(t, eye, HEAD, 46 - 9 * z, 0.35);
		}
		case 'street': {
			// the phone on the dash, as I roll down the street (the truck drives toward −x)
			const x = truckX(t);
			return phone(t, [x - 1.1, 1.75, -2.2], [x - 10, 1.4, -4.2], 52, 0.22);
		}
		case 'neighbour': {
			const k = ease(lin(t, K.cutNeighbour, K.point));
			const up = ease(lin(t, K.tiltUp[0], K.tiltUp[1]));
			const p: V3 = [-1.2 + 0.9 * k, 1.62, -4.0 - 0.2 * k];
			const l = mix3([2.3, 1.2, -4.0], [PERCH[0], PERCH[1] + 0.5, PERCH[2]], up);
			return phone(t, p, l, 50 - 8 * up, 0.3);
		}
		case 'bucket': {
			const bb = bucketAt(t);
			const pe: V3 = [bb[0], bb[1] + EYE, bb[2]];
			const k = ease(lin(t, K.rise[0], K.rise[1]));
			const l = mix3([PERCH[0], PERCH[1] + 1.6, PERCH[2]], [PERCH[0], PERCH[1] + 0.55, PERCH[2]], k);
			return phone(t, pe, l, 46 - 10 * ease(lin(t, K.lightOn + 0.4, K.turn[0])), 0.3);
		}
		case 'legs': {
			const k = ease(lin(t, K.cutLegs, K.cutLegs + 1.2));
			const knee = itBones.ready ? (itBones.LeftFoot.clone().lerp(itBones.Hips, 0.4).toArray() as V3) : PERCH;
			return phone(t, eye, mix3(HEAD, knee, k), 38, 0.35);
		}
		case 'gore': {
			// zoomed right in on its near forearm
			const k = ease(lin(t, K.cutGore, K.cutGore + 1.5));
			const arm = itBones.ready ? (itBones.RightForeArm.clone().lerp(itBones.RightHand, 0.45).toArray() as V3) : PERCH;
			return phone(t, eye, arm, 16 - 5 * k, 0.4);
		}
		case 'wings': {
			const fall = ease(lin(t, K.drop, K.drop + 0.6));
			const c = phone(t, eye, [PERCH[0], PERCH[1] + 0.95, PERCH[2]], 56, 0.6 + 2.5 * fall);
			return {...c, p: [c.p[0], c.p[1] - 4 * fall * fall, c.p[2]], l: [c.l[0], c.l[1] - 6 * fall, c.l[2] + 3 * fall], roll: (c.roll ?? 0) + 2.6 * fall};
		}
		case 'drive': {
			// filming back through the cab's rear window as I drive off
			const x = driveX(t);
			return phone(t, [x - 1.0, 1.85, -2.2], [x + 8, 4.2, -4.6], 52, 0.7);
		}
		case 'branch':
		case 'gallery': {
			// from the branch, its own eyes: down onto the truck; it leans out, slowly
			const k = ease(lin(t, K.play, K.loopShot));
			return {p: [3.85 - 0.25 * k, 6.75 - 0.2 * k, -4.55 + 0.3 * k], l: [1.3, 0.3, -3.0], fov: 52 - 10 * k, roll: 0.06 * Math.sin(t * 0.7)};
		}
	}
};

// ------------------------------------------------------------------ it, by shot
const itPose = (t: number, shot: Shot): ItPose => {
	const turn = shot === 'hook' || shot === 'legs' || shot === 'gore' || shot === 'wings' ? 1 : shot === 'turn' || shot === 'bucket' ? ease(lin(t, K.turn[0], K.turn[1])) : 0;
	const tilt = shot === 'hook' ? 0.35 * Math.sin(Math.PI * lin(t, -2.4, K.cutStreet)) : shot === 'turn' ? 0.4 * ease(lin(t, K.turn[1] + 1.0, K.turn[1] + 1.8)) : 0;
	const open = shot === 'wings' ? ease(lin(t, K.wings[0], K.wings[1])) : 0;
	const grow = shot === 'gore' ? 0.25 + 0.75 * ease(lin(t, K.cutGore + 0.6, K.wings[0] - 0.4)) : shot === 'wings' ? 1 : 0.35;
	const split = shot === 'gore' ? ease(lin(t, K.cutGore + 0.3, K.wings[0] - 0.6)) : shot === 'wings' ? 1 : 0;
	const lean = shot === 'neighbour' ? 0.15 * ease(lin(t, K.shift, K.shift + 0.4)) : 0;
	return {turn, tilt, open, grow, split, lean};
};
const IT_RY = 1.09; // side-on to the bucket (its right side to the light)

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotOf(t);
	const gal = shot === 'gallery';
	const cam = (
		<>
			<Cam get={() => poseAt(t, shot === 'gallery' ? 'branch' : shot)} />
			<color attach="background" args={['#06070a']} />
			<fog attach="fog" args={['#0a0c10', 14, 60]} />
		</>
	);
	const light = (t >= K.lightOn || t < 0 || shot === 'hook') && shot !== 'street' && shot !== 'neighbour' && shot !== 'drive' && shot !== 'branch' && !gal;
	const bucket = shot === 'street' || shot === 'neighbour' || shot === 'branch' || gal ? BUCKET_DOWN : shot === 'bucket' ? bucketAt(t) : BUCKET_UP;
	const tx = shot === 'street' ? truckX(t) : shot === 'drive' ? driveX(t) : 0;
	const beacon = 0.5 + 0.5 * Math.sin(t * 7.5);
	return (
		<>
			{cam}
			<ambientLight intensity={shot === 'neighbour' || shot === 'drive' || shot === 'branch' || gal ? 1.6 : 1.15} color="#2e3448" />
			{/* the truck's headlights wash the yard in front of it */}
			<pointLight position={[tx - 3.0, 1.0, -2.6]} intensity={3} distance={12} decay={1} color="#fff0d8" />
			{/* the sodium lamp, and the amber beacon turning on the cab */}
			<pointLight position={[-6, 6.3, -2.7]} intensity={9} distance={22} decay={1} color="#ff9a3a" />
			<pointLight position={[tx - 1.3, 2.3, -2.2]} intensity={2.2 * beacon} distance={9} decay={1} color="#ffa020" />
			{light && <pointLight position={[BUCKET_UP[0] + 0.4, BUCKET_UP[1] + 1.3, BUCKET_UP[2] - 0.5]} intensity={7} distance={5} decay={1} color="#f4f6ff" />}
			{light && <pointLight position={[BUCKET_UP[0] + 0.4, BUCKET_UP[1] + 1.4, BUCKET_UP[2] - 0.6]} intensity={2.4} distance={3.5} decay={1} color="#e8ecff" />}
			{light && <pointLight position={[BUCKET_UP[0] + 0.6, BUCKET_UP[1] + 0.4, BUCKET_UP[2] - 1.0]} intensity={3} distance={3} decay={1} color="#dfe4ff" />}
			{/* the lamp-lit dark: a little fill on the tree from the street, so its shape reads */}
			<pointLight position={[2, 4, -2]} intensity={1.2} distance={9} decay={1} color="#ff9a50" />
			<Street curtain={shot === 'street' ? ease(lin(t, K.curtain, K.curtain + 0.8)) : 0} />
			{shot !== 'street' && <Truck p={[tx, 0, -2.2]} bucket={shot === 'drive' ? [tx + 2.6, 4.6, -2.2] : bucket} light={light} boomOnly={shot === 'drive'} />}
			<pointLight position={[4.5, 2.4, -10.2]} intensity={2.5} distance={8} decay={1} color="#ffc070" />
			<pointLight position={[-30, 6.3, -2.7]} intensity={9} distance={22} decay={1} color="#ff9a3a" />
			<pointLight position={[22, 6.3, -2.7]} intensity={9} distance={22} decay={1} color="#ff9a3a" />
			{shot === 'street' && <Dash x={tx} />}
			{shot === 'drive' && <pointLight position={[PERCH[0] - 1.5, PERCH[1] + 1, PERCH[2] + 2]} intensity={4.5} distance={7} decay={1} color="#ffb070" />}
			{shot !== 'street' && shot !== 'branch' && !gal && <It p={PERCH} ry={IT_RY} t={t} pose={itPose(t, shot)} />}
			{shot === 'neighbour' && <Neighbour t={t} />}
			{(shot === 'branch' || gal) && <Lineman p={[1.2, 0, -3.7]} ry={2.6} look={1} />}
			{(shot === 'bucket' || shot === 'turn' || shot === 'hook' || shot === 'legs' || shot === 'gore' || shot === 'wings') && <BucketRim t={t} />}
		</>
	);
};

/** the neighbour by the pole, silent; she points up into the tree */
const Neighbour: React.FC<{t: number}> = ({t}) => {
	const k = ease(lin(t, K.point, K.point + 0.5));
	return (
		<PsxCharacter
			name="Character_31_Female"
			height={1.55}
			position={[2.3, 0, -4.0]}
			rotation={[0, -2.6, 0]}
			reach={k > 0.05 ? {arm: 'Right', target: mix3([2.1, 0.9, -3.9], [PERCH[0], PERCH[1] + 0.4, PERCH[2]], k)} : undefined}
			pose={merge(ARMS_DOWN, {Neck: [['x', -0.1 - 0.4 * k], ['y', -0.3 * k]], Head: [['x', -0.1 - 0.3 * k]]})}
		/>
	);
};
/** the dashboard under the phone in the cab */
const Dash: React.FC<{x: number}> = ({x}) => {
	const M = useM();
	return <Box p={[x - 1.75, 1.2, -2.2]} s={[0.5, 0.3, 1.9]} m={M.dark} />;
};
/** the bucket's rim at the bottom of the frame when I film from it */
const BucketRim: React.FC<{t: number}> = ({t}) => {
	const M = useM();
	const b = t < K.rise[1] ? bucketAt(t) : BUCKET_UP;
	return (
		<group position={b}>
			<Box p={[0.15, 1.02, -0.38]} s={[0.9, 0.08, 0.08]} m={M.yellow} />
			<Box p={[0.45, 1.02, 0]} s={[0.08, 0.08, 0.9]} m={M.yellow} />
		</group>
	);
};
/** in the clip from the branch: bark and two feather tips at the edge of its view */
const BranchEdge: React.FC<{t: number}> = ({t}) => {
	const M = useM();
	return (
		<group>
			<mesh position={[HEAD[0] - 0.55, HEAD[1] - 0.45, HEAD[2] + 0.55]} rotation={[0.3, 0.6, 0.2 + 0.03 * Math.sin(t * 2)]} material={M.feather}>
				<planeGeometry args={[0.12, 0.5]} />
			</mesh>
			<mesh position={[HEAD[0] - 0.75, HEAD[1] - 0.35, HEAD[2] + 0.35]} rotation={[0.2, 0.9, -0.3]} material={M.feather}>
				<planeGeometry args={[0.1, 0.45]} />
			</mesh>
		</group>
	);
};

// ------------------------------------------------------------------ 2D overlay: the phone, the gallery, captions, compression
const timecode = (s: number) => {
	const m = Math.floor(s / 60), ss = Math.floor(s % 60);
	return `00:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};
const Overlay: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
	const ui = useRef<HTMLCanvasElement>(null);
	const blocks = useRef<HTMLCanvasElement>(null);
	const shot = shotOf(t);
	useLayoutEffect(() => {
		const CW = 360, CH = 640;
		const g = ui.current!.getContext('2d')!;
		g.clearRect(0, 0, CW, CH);
		g.textBaseline = 'alphabetic';
		const txt = (s: string, x: number, y: number, col = '#fff', align: CanvasTextAlign = 'left', font = 'bold 11px "DejaVu Sans", sans-serif') => {
			g.font = font;
			g.textAlign = align;
			g.fillStyle = 'rgba(0,0,0,0.75)';
			g.fillText(s, x + 1, y + 1);
			g.fillStyle = col;
			g.fillText(s, x, y);
		};
		// the clip starts: every take resets the timer
		const start = shot === 'hook' ? -2.4 : shot === 'street' ? K.cutStreet : shot === 'neighbour' ? K.cutNeighbour : shot === 'drive' ? K.cutDrive : K.cutBucket;
		const recording = shot !== 'gallery' && shot !== 'branch' && !(shot === 'wings' && t > K.drop + 0.6);
		if (recording) {
			const blink = Math.floor((t + 600) * 2) % 2 === 0;
			if (blink) {
				g.fillStyle = '#e02020';
				g.beginPath();
				g.arc(150, 30, 4, 0, Math.PI * 2);
				g.fill();
			}
			txt(timecode(t - start + (shot === 'hook' ? 31 : 0)), 160, 34);
			txt('HD · 30', 22, 34, '#ddd');
			txt('1×', 180, 600, '#fff', 'center');
			// focus square on what it is hunting
			if (shot === 'turn' || shot === 'hook' || shot === 'gore' || shot === 'legs') {
				const hunt = 3 * Math.sin(t * 5.3);
				g.strokeStyle = '#ffd040';
				g.lineWidth = 1;
				g.strokeRect(150 + hunt, 250 - hunt, 60, 60);
			}
		}
		if (shot === 'wings' && t > K.drop + 0.6) {
			g.fillStyle = '#000';
			g.fillRect(0, 0, CW, CH);
		}
		if (shot === 'gallery') {
			// the phone's gallery: today's clips; the newest one I did not take
			g.fillStyle = '#0d0d0f';
			g.fillRect(0, 0, CW, CH);
			txt('Today', 18, 66, '#fff', 'left', 'bold 17px "DejaVu Sans", sans-serif');
			const tiles = [
				['#2a2018', '#d08a40'],
				['#1a1d22', '#ff9a3a'],
				['#101214', '#e8e8e0'],
				['#0a0b0c', '#5a5a52'],
			];
			tiles.forEach(([bg, fg], i) => {
				const x = 14 + (i % 3) * 112, y = 84 + Math.floor(i / 3) * 150;
				g.fillStyle = bg;
				g.fillRect(x, y, 108, 146);
				g.fillStyle = fg;
				g.fillRect(x + 30 + i * 9, y + 50, 26, 30);
				txt(['0:42', '1:07', '0:58', '0:31'][i], x + 100, y + 138, '#fff', 'right', '10px "DejaVu Sans", sans-serif');
			});
			// the last tile: selected
			const sel = 0.5 + 0.5 * Math.sin(t * 6);
			g.strokeStyle = `rgba(255,255,255,${0.5 + 0.5 * sel})`;
			g.lineWidth = 2;
			g.strokeRect(126, 234, 108, 146);
			txt('2:17 AM', 180, 412, '#ccc', 'center', '11px "DejaVu Sans", sans-serif');
		}
		if (shot === 'branch') {
			// playback: no REC, a scrub bar running
			const k = lin(t, K.play, K.loopShot);
			g.fillStyle = 'rgba(255,255,255,0.35)';
			g.fillRect(30, 610, 300, 3);
			g.fillStyle = '#fff';
			g.fillRect(30, 610, 300 * (0.2 + 0.8 * k), 3);
			txt('2:17 AM', 30, 600, '#ddd', 'left', '10px "DejaVu Sans", sans-serif');
		}
		// captions: this episode's own, a plain sans, white with a thin dark edge, lower third
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
			g.font = 'bold 14px "DejaVu Sans", sans-serif';
			g.textAlign = 'center';
			show.forEach((r, i) => {
				const y = 520 + i * 18 - (show.length - 1) * 9;
				g.fillStyle = '#000';
				for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.fillText(r, CW / 2 + dx, y + dy);
				g.fillStyle = '#ffffff';
				g.fillText(r, CW / 2, y);
			});
		}
		const img = g.getImageData(0, 0, CW, CH);
		for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 100 ? 255 : 0;
		g.putImageData(img, 0, 0);
		// the phone's compression: 8x8 blocks that drift and pump, heavier in motion
		const b = blocks.current!.getContext('2d')!;
		const bi = b.createImageData(23, 40);
		const r = rng(Math.floor((t + 600) * 15) * 104729 + 52);
		const amt = shot === 'gallery' ? 0 : shot === 'wings' || shot === 'drive' ? 60 : 30;
		for (let i = 0; i < bi.data.length; i += 4) {
			const v = r() * 255;
			bi.data[i] = bi.data[i + 1] = bi.data[i + 2] = v;
			bi.data[i + 3] = amt * r();
		}
		b.putImageData(bi, 0, 0);
	}, [t, captions, shot]);
	return (
		<>
			<canvas ref={blocks} width={23} height={40} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={ui} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

// ------------------------------------------------------------------ assembly
export const Episode52: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const tv = t >= K.loopShot ? t - DUR : t;
	const shot = shotOf(tv);
	const lit = tv >= K.lightOn && (shot === 'bucket' || shot === 'turn' || shot === 'legs' || shot === 'gore' || shot === 'wings') ? 1 : shot === 'hook' ? 1 : 0;
	// a phone's exposure: sodium orange in the dark street; the work light blows it out cold and bright
	const pump = 1 + 0.06 * Math.sin(tv * 3.1) * Math.sin(tv * 1.7);
	const grade = shot === 'branch' ? 'contrast(1.1) saturate(0.7) brightness(0.95) sepia(0.2)' : lit ? `contrast(1.25) saturate(0.85) brightness(${(1.12 * pump).toFixed(3)})` : `contrast(1.2) saturate(1.4) sepia(0.25) hue-rotate(-12deg) brightness(${(1.05 * pump).toFixed(3)})`;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: 'scale(' + SCALE + ')', transformOrigin: '0 0', filter: grade}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.03, far: 160}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			{shot === 'branch' && <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)'}} />}
			<Overlay t={tv} captions={captions} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep52-branch-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
