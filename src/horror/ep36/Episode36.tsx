// Episode 36: "Sunugin Mo ang Damit" (Season 4, campus legend: the UP Ikot jeep). Taglish, Juanito.
// Built to the motion rule; hard cuts only; an eerie score; a seamless loop (the last shot is the
// first shot, on negative time).
// Form: "two jeeps". Every shot shows the jeep and its reflection, and they disagree: the dark
// windows across the aisle, and a puddle on the campus road.
// The picture: your view across the aisle; in the window the bench is full, beside you it is empty
// (hook); the campus at night, the Ikot coming under the acacias, in the puddle; stop by stop the
// riders get off, each looking back (in the window they are still seated); two coins on the bench,
// and the vinyl sinks beside you; alone: in the window a grey figure leans its head on your
// shoulder, then lifts it and looks at you; the driver, from behind, never turning (his mirror is
// turned up to the roof); her room: the lamp comes on: two grey handprints on the back of her
// jacket; the can, the fire, a shape in the smoke; the Ikot passes, empty; in the puddle she sits
// in it. Then the view across the aisle again (loop).
// Care: a legend; no real driver, student or dorm is named or shown as the source; the driver is
// kind (he saves her); no call to ride it at night.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep36-ikot-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {Can, CLINGER, Ground, HER, Ikot, Jacket, MatsProvider, Occupant, PUDDLE, Rider, RIDERS, Roadside, Room, useM, V3, Yard} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep36Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep36_sound.py uses the same rules)
export const K = {
	cutCampus: L.l02.start - 0.3,
	cutRiders: L.l03.start - 0.3,
	leave: [L.l03.start + 0.3, L.l03.start + 2.4, L.l03.start + 4.5],
	cutCoins: L.l04.start - 0.3,
	coin: L.l04.start + 2.2, // the second coin drops
	sink: [L.l04.end - 0.3, L.l04.end + 0.25] as [number, number],
	cutAlone: L.l04.end + 0.3,
	looks: L.l04.end + 1.6, // in the window, it lifts its head and looks at you
	cutDriver: L.l05.start - 0.3,
	stop: [L.l05.start - 0.1, L.l05.start + 0.9] as [number, number],
	cutRoom: L.l06.end + 0.4,
	lampOn: L.l06.end + 1.6, // the prints, in the light
	off: [L.l06.end + 2.4, L.l06.end + 3.2] as [number, number],
	cutBurn: L.l07.start - 0.3,
	cutPass: L.l08.start - 0.3,
	inPuddle: L.l08.end + 0.25, // her reflection, sitting in the empty jeep
	loopShot: DUR - 1.7,
};
export const STINGERS = [K.looks, K.lampOn, K.inPuddle];

type Shot = 'hook' | 'campus' | 'riders' | 'coins' | 'alone' | 'driver' | 'room' | 'burn' | 'pass';
const shotAt = (t: number): Shot => {
	if (t < K.cutCampus) return 'hook';
	if (t < K.cutRiders) return 'campus';
	if (t < K.cutCoins) return 'riders';
	if (t < K.cutAlone) return 'coins';
	if (t < K.cutDriver) return 'alone';
	if (t < K.cutRoom) return 'driver';
	if (t < K.cutBurn) return 'room';
	if (t < K.cutPass) return 'burn';
	return 'pass';
};

// ------------------------------------------------------------------ who sits where
const SEAT_HER = 0.1;
const full: Occupant[] = [
	{look: HER, side: 1, z: SEAT_HER},
	{look: RIDERS[0], side: 1, z: -1.0},
	{look: RIDERS[1], side: 1, z: -0.45},
	{look: RIDERS[2], side: 1, z: 0.65},
	{look: RIDERS[3], side: 1, z: 1.2},
	{look: RIDERS[4], side: 1, z: 1.75},
];
const clung = (t: number): Occupant[] => {
	const k = ease(lin(t, K.looks - 0.4, K.looks + 0.2));
	return [
		{look: HER, side: 1, z: SEAT_HER},
		{look: CLINGER, side: 1, z: SEAT_HER + 0.42, lean: -0.42 * (1 - 0.4 * k), bow: 0.55 * (1 - k), yaw: -0.5 * (1 - k), hug: 0.9},
	];
};
// the riders who get off, nearest the rear first: (look, side, seat z)
const LEAVERS: [number, 1 | -1, number][] = [[4, -1, 1.75], [1, -1, 1.2], [3, 1, 0.65]];
const STAYERS: [number, 1 | -1, number][] = [[0, -1, -0.45], [2, 1, -1.0]];
const ridersAt = (t: number): Occupant[] => {
	const out: Occupant[] = [{look: HER, side: 1, z: SEAT_HER}];
	for (const [li, side, z] of STAYERS) out.push({look: RIDERS[li], side, z});
	LEAVERS.forEach(([li, side, z], i) => {
		const t0 = K.leave[i];
		if (t > t0 + 2.3) return;
		const k1 = ease(lin(t, t0, t0 + 0.5));
		const k2 = lin(t, t0 + 0.5, t0 + 1.9);
		if (k1 < 0.3) {
			out.push({look: RIDERS[li], side, z});
			return;
		}
		const x = side * 0.6 * (1 - k1);
		const zz = z + (2.75 - z) * k2;
		const ry = -side * (Math.PI / 2) * (1 - k1);
		out.push({look: RIDERS[li], side, z: zz, x, pose: 'stand', ry, walk: (t - t0) * 1.6, yaw: Math.PI * 0.8 * ease(lin(k2, 0.45, 0.8))});
	});
	return out;
};

// ------------------------------------------------------------------ cameras
type CamPose = {p: V3; l: V3; fov: number; up?: V3};
const Cam: React.FC<{pose: CamPose}> = ({pose}) => {
	const {camera} = useThree();
	camera.position.set(...pose.p);
	camera.up.set(...(pose.up ?? [0, 1, 0]));
	camera.lookAt(...pose.l);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = pose.fov;
	c.near = 0.03;
	c.far = 200;
	camera.updateProjectionMatrix();
	return null;
};
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
// your view from your seat: across the aisle to the dark window; then down to the seat beside you
const pov = (t: number, push: number, pan: number): CamPose => {
	const hh = handheld(t * 2.2, 0.6);
	const ride = Math.sin(t * 23) * 0.003 + Math.sin(t * 9.7) * 0.004;
	const p: V3 = [0.5 - 0.12 * push + hh.dp[0] * 0.3, 1.08 + ride + hh.dp[1] * 0.3, SEAT_HER - 0.02];
	const win: V3 = [-0.85, 0.98, SEAT_HER + 0.12];
	const seat: V3 = [0.62, 0.45, SEAT_HER + 0.75];
	return {p, l: mix3(win, seat, pan), fov: 62 - 8 * push};
};
const jeepZ = (t: number, shot: Shot) => (shot === 'campus' ? -40 + 37 * lin(t, K.cutCampus, K.cutRiders) : -8 + 15 * lin(t, K.cutPass, K.loopShot));
const JEEP_X = -1.5;

const poseAt = (t: number, shot: Shot): CamPose => {
	switch (shot) {
		case 'hook':
			return pov(t, ease(lin(t, -2, K.cutCampus)), 0);
		case 'alone':
			return pov(t, 0.3 + 0.7 * ease(lin(t, K.cutAlone, K.cutDriver)), 0);
		case 'campus': {
			const k = ease(lin(t, K.cutCampus, K.cutRiders));
			return {p: [0.7, 0.42 + 0.1 * k, 5.2 - 0.6 * k], l: [-0.9, 0.2 + 0.4 * k, -10], fov: 52};
		}
		case 'riders': {
			const hh = handheld(t * 2, 0.6);
			const k = lin(t, K.cutRiders, K.cutCoins);
			return {p: [0.05 + hh.dp[0] * 0.4, 1.28 + Math.sin(t * 21) * 0.003, -1.25 + 0.3 * k], l: [0.0, 0.85, 2.5], fov: 54};
		}
		case 'coins': {
			const k = ease(lin(t, K.cutCoins, K.cutAlone));
			return {p: [0.6, 1.35 - 0.35 * k, SEAT_HER + 0.35], l: [0.6, 0.44, SEAT_HER + 0.42], fov: 50, up: [-1, 0, 0]};
		}
		case 'driver': {
			const k = ease(lin(t, K.cutDriver, K.cutRoom));
			const lurch = Math.sin(Math.PI * lin(t, K.stop[0], K.stop[1])) * 0.06;
			return {p: mix3([0.3, 1.12, -0.6], [0.0, 1.2, -1.15], k), l: [-0.45, 1.3 - lurch, -1.95], fov: 50};
		}
		case 'room': {
			const k = ease(lin(t, K.cutRoom, K.cutBurn));
			return {p: [0.15, 1.3, 1.4 - 0.7 * k], l: [0, 1.15, -0.4], fov: 50};
		}
		case 'burn': {
			const k = ease(lin(t, K.cutBurn, K.cutPass));
			return {p: [0.2, 0.9 + 0.3 * k, 2.4 - 0.5 * k], l: [0, 1.2 + 0.6 * k, 0], fov: 52};
		}
		case 'pass': {
			const k = ease(lin(t, K.cutPass, K.loopShot));
			// from the roadside, across the puddle: the jeep passes left to right of frame; its windows face us
			const jz = jeepZ(t, shot);
			return {p: [3.45, 0.12, 2.2 + 0.1 * k], l: [-1.5, -1.45, 2.2 + (jz - 2.2) * 0.35], fov: 46};
		}
	}
};

// ------------------------------------------------------------------ the shape in the smoke
const Smoke: React.FC<{t: number; k: number}> = ({t, k}) => {
	const tx = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = 24;
		c.height = 48;
		const g = c.getContext('2d')!;
		const r = rng(361);
		for (let i = 0; i < 500; i++) {
			const y = r() * 48, x = 12 + (r() - 0.5) * (y < 12 ? 8 : 14 + (y / 48) * 6);
			// a bowed head and long hair on narrow shoulders
			const inHead = Math.hypot(x - 13, y - 9) < 5;
			const inBody = y > 12 && Math.abs(x - 12) < 4 + (y - 12) * 0.12;
			if (inHead || inBody) {
				g.fillStyle = `rgba(150,150,150,${0.25 + r() * 0.35})`;
				g.fillRect(Math.floor(x), Math.floor(y), 2, 2);
			}
		}
		const t2 = new THREE.CanvasTexture(c);
		t2.magFilter = THREE.NearestFilter;
		t2.minFilter = THREE.NearestFilter;
		t2.generateMipmaps = false;
		return t2;
	}, []);
	const m = useMemo(() => new THREE.MeshBasicMaterial({map: tx, transparent: true, depthWrite: false, opacity: 1}), [tx]);
	m.opacity = k;
	return (
		<mesh position={[Math.sin(t * 0.7) * 0.05, 1.5 + 0.6 * k, 0]} scale={[1, 1 + 0.2 * k, 1]} material={m}>
			<planeGeometry args={[0.7, 1.4]} />
		</mesh>
	);
};

// ------------------------------------------------------------------ the scene
const Coins: React.FC<{t: number}> = ({t}) => {
	const M = useM();
	const drop = 1 - ease(lin(t, K.coin - 0.25, K.coin));
	const sink = ease(lin(t, K.sink[0], K.sink[1]));
	return (
		<group>
			<mesh position={[0.58, 0.452, SEAT_HER + 0.33]} material={M.coin}>
				<cylinderGeometry args={[0.024, 0.024, 0.005, 10]} />
			</mesh>
			{t > K.coin - 0.25 && (
				<mesh position={[0.64, 0.452 + 0.25 * drop, SEAT_HER + 0.4]} material={M.coin2}>
					<cylinderGeometry args={[0.026, 0.026, 0.005, 10]} />
				</mesh>
			)}
			{/* the vinyl sinks where no one sits */}
			<mesh position={[0.62, 0.452, SEAT_HER + 0.56]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.3, 1]}>
				<circleGeometry args={[0.15 * sink + 0.001, 12]} />
				<meshBasicMaterial color="#000" transparent opacity={0.45 * sink} depthWrite={false} />
			</mesh>
		</group>
	);
};

const IkotAt: React.FC<{t: number; shot: Shot; occupants: Occupant[]}> = ({t, shot, occupants}) => (
	<group position={[JEEP_X, 0.55, jeepZ(t, shot)]} rotation={[0, Math.PI, 0]}>
		<Ikot occupants={occupants} exterior />
		<pointLight position={[0, 1.3, 0.4]} intensity={6.0} distance={3.2} decay={1} color="#e8fff0" />
		{/* a lamp on the near side lights the riders' backs through the windows */}
		<pointLight position={[-1.3, 1.5, 0.3]} intensity={3.0} distance={2.2} decay={1} color="#ffc070" />
	</group>
);

const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotAt(t);
	const pose = poseAt(t, shot);
	const inside = shot === 'hook' || shot === 'alone' || shot === 'riders' || shot === 'coins' || shot === 'driver';
	const road = shot === 'campus' || shot === 'pass';
	// the sodium lamps sweep past the windows while the jeep moves; stopped at the driver shot
	const moving = shot !== 'driver' || t < K.stop[0];
	const sweep = moving ? ((t * 2.4) % 6) - 3 : -1.5;
	const flick = 0.92 + 0.08 * Math.sin(t * 17) * Math.sin(t * 6.1);
	// in the puddle, seen from below: on the near bench, backs to the window, her head and its head together
	const passOcc: Occupant[] = [{look: HER, side: -1, z: SEAT_HER}, {look: CLINGER, side: -1, z: SEAT_HER + 0.42, lean: 0.42, bow: 0.55, yaw: 0.5, hug: -0.9}];
	const fire = shot === 'burn' ? ease(lin(t, K.cutBurn, K.cutBurn + 0.8)) : 0;
	return (
		<>
			<Cam pose={pose} />
			{inside && (
				<>
					<ambientLight intensity={1.0} color="#8a90a0" />
					<pointLight position={[0, 1.45, 0.4]} intensity={3.4 * flick} distance={4.5} decay={1} color="#e8fff0" />
					<pointLight position={[-1.7, 1.45, 0.4]} intensity={2.6 * flick} distance={4.5} decay={1} color="#a8c0ff" />
					<pointLight position={[2.4, 2.0, sweep]} intensity={2.6} distance={4} decay={1} color="#ffb050" />
					<pointLight position={[-4.1, 2.0, sweep]} intensity={1.8} distance={4} decay={1} color="#ffb050" />
					<Ikot
						occupants={shot === 'riders' ? ridersAt(t) : shot === 'coins' ? [{look: HER, side: 1, z: SEAT_HER}] : []}
						reflected={shot === 'hook' ? full : shot === 'alone' ? clung(t) : shot === 'riders' ? [...full.slice(0, 1), {look: RIDERS[0], side: -1, z: -0.45}, {look: RIDERS[2], side: 1, z: -1.0}, {look: RIDERS[4], side: -1, z: 1.75}, {look: RIDERS[1], side: -1, z: 1.2}, {look: RIDERS[3], side: 1, z: 0.65}] : undefined}
						coins={shot === 'coins' ? <Coins t={t} /> : undefined}
						driverLean={shot === 'driver' ? 0.25 * ease(lin(t, L.l06.start - 0.2, L.l06.start + 0.6)) : 0}
					/>
				</>
			)}
			{road && (
				<>
					<ambientLight intensity={1.0} color="#6070a0" />
					{[[-4.2 + 0.95, -0], [4.2 - 0.95, 8], [-4.2 + 0.95, -15], [4.2 - 0.95, -7]].map(([x, z], i) => (
						<React.Fragment key={i}>
							<pointLight position={[x, 4.9, z]} intensity={6} distance={13} decay={1} color="#ffb050" />
							<pointLight position={[x, -4.9, z]} intensity={6} distance={13} decay={1} color="#ffb050" />
						</React.Fragment>
					))}
					<Ground />
					<Roadside />
					<IkotAt t={t} shot={shot} occupants={shot === 'campus' ? full : []} />
					{/* the puddle's world: everything mirrored in y; its jeep carries its own riders */}
					<group scale={[1, -1, 1]}>
						<Roadside />
						<IkotAt t={t} shot={shot} occupants={shot === 'campus' ? full : passOcc} />
					</group>
				</>
			)}
			{shot === 'room' && (
				<>
					<ambientLight intensity={t < K.lampOn ? 0.55 : 0.7} color="#7a84a0" />
					{t >= K.lampOn && <pointLight position={[0.3, 2.3, 1.0]} intensity={4.5} distance={5} decay={1} color="#ffe8c0" />}
					<pointLight position={[-0.5, 2.0, 1.2]} intensity={t < K.lampOn ? 1.0 : 0.4} distance={4} decay={1} color="#8090c0" />
					<Room />
					<RoomHer t={t} />
				</>
			)}
			{shot === 'burn' && (
				<>
					<ambientLight intensity={0.45} color="#5a6080" />
					<pointLight position={[0, 1.3, 0.3]} intensity={(3.5 + Math.sin(t * 19) * 0.6 + Math.sin(t * 7) * 0.5) * fire} distance={6} decay={1} color="#ff9040" />
					<Yard />
					<Can t={t} fire={fire} />
					<Jacket prints={1} p={[0, 0.95, 0]} r={[-0.3, 0.4, 0.2]} burn={lin(t, K.cutBurn + 0.3, K.cutPass)} />
					<Smoke t={t} k={ease(lin(t, K.cutBurn + 1.6, K.cutPass - 0.6))} />
				</>
			)}
		</>
	);
};

// her room: her back to us; the lamp comes on: the prints; she pulls the jacket off and holds it
const RoomHer: React.FC<{t: number}> = ({t}) => {
	const k = ease(lin(t, K.off[0], K.off[1]));
	return (
		<group>
			<Rider look={k > 0.5 ? {...HER, shirt: '#d8d8d0', bag: false} : {...HER, bag: false}} pose="stand" position={[0, 0, -0.4]} rotation={[0, Math.PI, 0]} />
			<Jacket prints={1} p={[0.3 * k, 1.1 - 0.35 * k, -0.27 + 0.05 * k]} r={[0, 0, -0.3 * k]} />
		</group>
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
		const r = rng(Math.floor(t * 24) * 7919 + 36);
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
export const Episode36: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	// the loop shot runs on negative time: the hook's own first moments
	const tv = t >= K.loopShot ? t - DUR : t;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'saturate(0.7) contrast(1.12)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.03, far: 200}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			<Overlay t={tv} captions={captions} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep36-ikot-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
