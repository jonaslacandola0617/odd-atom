// Episode 53: "Two Nights in the Cold Room" (Season 6: two nights in a Nigerian hospital mortuary with my brother,
// the night attendant; retold in our own words from accounts shared online; no real hospital). English, Jack.
// The PSX models; hard cuts only; a score of its own; a seamless loop (the last shot is the first, on negative time).
// Form: "the blackouts": one locked wide on the cold room, cut by power cuts. The picture only changes in the
// black: every time the generator brings the light back, the room is in a new state.
// Mechanism: it moves only when unseen. Gore: the one that sits up has its post-mortem Y-incision torn open.
// Cast: the one that sits up, Character_Monster_01; my brother, Character_25_Doctor (white coat); me,
// Character_14. The covered dead are box-built under sheets (no faces; the dead are treated with respect).
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep53-cold-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {merge, PsxCharacter, SIT} from '../psx/models';
import {Box} from '../ep41/world';
import {Covered, DESK, DOOR_TRAY, FLOOR15, HOOK_TRAY, MatsProvider, MY_CHAIR, Opened, Person, Room, SLIP, Tray, TRAY_TOP, TRAYS, useM, V3} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep53Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep53_sound.py reads the same rules)
export const K = {
	hookOff: 1.3, // the hook's light dies
	cutWide: L.l01.start,
	off1: L.l02.end + 0.45, // the first cut (the tubes stutter first)
	on1: L.l03.start - 0.3, // the generator brings it back: the sheet has slipped
	walk: [L.l04.start - 0.2, L.l04.start + 3.0],
	cover: [L.l04.end - 1.3, L.l04.end - 0.4],
	off2: L.l04.end + 0.3,
	on2: L.l04.end + 1.2, // nothing has changed
	off3: L.l04.end + 2.3,
	on3: L.l05.start - 0.5, // one is sitting up by the door, chest open (the stinger)
	enter: [L.l06.start - 0.3, L.l06.start + 1.9], // my brother comes to it
	lay: [L.l06.start + 2.0, L.l06.end + 0.1],
	night: L.l06.end + 0.35, // the second night
	off4: L.l07.start - 0.2, // and the generator does not come back
	torchOn: L.l07.end + 0.25,
	sweep: [L.l07.end + 0.4, L.l08.end - 0.3],
	rise: [L.l08.end + 0.15, L.l08.end + 0.85], // the one nearest me sits up toward me (the second stinger)
	torchDie: L.l08.end + 1.0,
	cutLedger: L.l09.start - 0.45,
	cutMorning: L.l09.start + 3.25,
	loopShot: L.l09.end + 0.6, // black; the generator; the hook's light comes back on
};
(globalThis as any).EP53_PROBE = false;
export const STINGERS = [K.on3, K.rise[0]];

type Shot = 'hook' | 'wide' | 'close' | 'night' | 'torch' | 'ledger' | 'morning';
const CUTS: [number, Shot][] = [
	[K.cutWide, 'hook'],
	[K.on3, 'wide'],
	[K.night, 'close'],
	[K.torchOn, 'night'],
	[K.cutLedger, 'torch'],
	[K.cutMorning, 'ledger'],
	[K.loopShot, 'morning'],
];
const shotOf = (t: number): Shot => (t < 0 ? 'hook' : CUTS.find(([c]) => t < c)?.[1] ?? 'hook');

// ------------------------------------------------------------------ the power: tube level 0..1 and the generator's green surge
const hash = (n: number) => rng(n * 7919 + 53)();
/** light level and green: black in every cut; on each return the tubes stutter and surge green, then settle cyan */
export const power = (t: number): {lvl: number; green: number} => {
	const back = (since: number) => {
		const f = Math.floor((t + 600) * 30);
		const stutter = since < 0.45 ? (hash(f) > 0.45 ? 1 : 0.15) : 1;
		return {lvl: stutter * (since < 0.45 ? 1.25 : 1), green: Math.max(0, 1 - since / 1.1)};
	};
	const shot = shotOf(t);
	if (shot === 'hook') {
		if (t < -0.3 || (t >= K.hookOff && t < K.cutWide)) return {lvl: 0, green: 0};
		return back(t + 0.3);
	}
	if (shot === 'wide') {
		if (t >= K.off1 && t < K.on1) return {lvl: 0, green: 0};
		if (t >= K.off2 && t < K.on2) return {lvl: 0, green: 0};
		if (t >= K.off3) return {lvl: 0, green: 0};
		if (t >= K.on2) return back(t - K.on2);
		if (t >= K.on1) return back(t - K.on1);
		// before the first cut the tubes stutter
		if (t > K.off1 - 0.4) return {lvl: hash(Math.floor((t + 600) * 30)) > 0.5 ? 1 : 0.3, green: 0};
		return {lvl: 1, green: 0};
	}
	if (shot === 'close') return back(t - K.on3);
	if (shot === 'night') return t >= K.off4 ? {lvl: 0, green: 0} : {lvl: 0.85, green: 0};
	return {lvl: 0, green: 0};
};

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
const WIDE: CamPose = {p: [0.35, 2.6, 1.35], l: [-0.1, 0.5, -7.2], fov: 62};
const HOOK_AT = TRAYS[HOOK_TRAY];
const DOOR_AT = TRAYS[DOOR_TRAY];
const ME_EYE: V3 = [MY_CHAIR[0] + 0.4, 1.62, MY_CHAIR[2] + 0.15]; // standing by my chair with the torch
/** where the torch points (the sweep: the right row from the back to the front, then the near tray) */
const headOf = (i: number): V3 => [TRAYS[i][0], TRAY_TOP + 0.16, TRAYS[i][1] - 0.97];
const torchAim = (t: number): V3 => {
	const k = ease(lin(t, K.sweep[0], K.sweep[1]));
	// the heads: right row, third, second, first; across the aisle; then the one beside me
	const path: V3[] = [headOf(9), headOf(8), headOf(7), headOf(1), headOf(0)];
	const s = k * (path.length - 1);
	const i = Math.min(path.length - 2, Math.floor(s));
	// the beam rests on each head, then moves on
	const f = s - i;
	const hold = f < 0.55 ? 0 : ease((f - 0.55) / 0.45);
	return mix3(path[i], path[i + 1], hold);
};
const poseAt = (t: number, shot: Shot): CamPose => {
	switch (shot) {
		case 'hook':
			// the same locked wide: one of them is sitting up, facing us
			return WIDE;
		case 'close':
			// a new locked frame, in the aisle, on the tray by the door
			return {p: [-0.15, 1.6, DOOR_AT[1] + 2.75], l: [DOOR_AT[0] + 0.05, 1.35, DOOR_AT[1] - 0.2], fov: 52};
		case 'torch': {
			const h = handheld(t * 1.1, 0.25);
			const a = torchAim(t);
			const r = ease(lin(t, K.rise[0], K.rise[1]));
			return {p: [ME_EYE[0] + h.dp[0] * 0.2, ME_EYE[1] + h.dp[1] * 0.2 - 0.05 * r, ME_EYE[2] + h.dp[2] * 0.2], l: [a[0] + h.dp[0] * 0.3, a[1] + h.dp[1] * 0.3 + 0.35 * r, a[2]], fov: 54 - 8 * r};
		}
		case 'ledger':
			return {p: [DESK[0] + 0.1, 1.28, DESK[2] + 0.36], l: [DESK[0] + 0.1, 0.78, DESK[2] + 0.0], fov: 44};
		default:
			return WIDE;
	}
};

// ------------------------------------------------------------------ props: the desk, the register, my chair
const Desk: React.FC<{pen: number; lamp: boolean}> = ({pen, lamp}) => {
	const M = useM();
	const [x, , z] = DESK;
	return (
		<group>
			<Box p={[x, 0.74, z]} s={[0.62, 0.04, 1.1]} m={M.wood} />
			{[-1, 1].flatMap((a) => [-1, 1].map((b) => <Box key={`${a}${b}`} p={[x + 0.26 * a, 0.36, z + 0.5 * b]} s={[0.04, 0.72, 0.04]} m={M.wood} />))}
			{/* the register, open */}
			<Box p={[x, 0.77, z]} s={[0.5, 0.02, 0.34]} m={M.book} />
			<mesh position={[x + 0.12, 0.785, z]} rotation={[-Math.PI / 2, 0, 0]} material={M.page}>
				<planeGeometry args={[0.23, 0.3]} />
			</mesh>
			<mesh position={[x - 0.12, 0.785, z]} rotation={[-Math.PI / 2, 0, 0]} material={M.sheet}>
				<planeGeometry args={[0.23, 0.3]} />
			</mesh>
			{/* his pen, running down the column */}
			<Box p={[x + 0.07, 0.8, z - 0.12 + 0.24 * pen]} s={[0.012, 0.012, 0.13]} m={M.pen} r={[0, -0.6, 0]} />
			{/* the lamp */}
			<Box p={[x - 0.2, 0.86, z + 0.42]} s={[0.1, 0.2, 0.1]} m={M.lamp} />
			{lamp && <pointLight position={[x - 0.1, 1.05, z + 0.3]} intensity={0.9} distance={1.6} decay={1} color="#ffd8a0" />}
			{/* his chair */}
			<Box p={[x + 0.55, 0.45, z]} s={[0.42, 0.04, 0.42]} m={M.chair} />
			<Box p={[x + 0.76, 0.75, z]} s={[0.04, 0.6, 0.42]} m={M.chair} />
			{/* my chair against the wall */}
			<Box p={[MY_CHAIR[0] + 0.05, 0.45, MY_CHAIR[2]]} s={[0.42, 0.04, 0.42]} m={M.chair} />
			<Box p={[MY_CHAIR[0] - 0.16, 0.75, MY_CHAIR[2]]} s={[0.04, 0.6, 0.42]} m={M.chair} />
		</group>
	);
};
const Seated: React.FC<{name: string; p: V3; ry: number; bow?: number; write?: number; t: number}> = ({name, p, ry, bow = 0, write = 0, t}) => (
	<PsxCharacter
		name={name}
		height={1.74}
		position={p}
		rotation={[0, ry, 0]}
		pose={merge(SIT, {
			Spine: [['x', 0.12 + 0.25 * write + 0.3 * bow]],
			Neck: [['x', 0.25 * write + 0.6 * bow + 0.01 * Math.sin(t * 1.1)]],
			RightForeArm: [['aim', [-0.15 + 0.05 * Math.sin(t * 3) * write, -0.4, 1]]],
		})}
	/>
);

// ------------------------------------------------------------------ the scene
const BROTHER = 'Character_25_Doctor_B'; // the pack's doctor, his skin darkened in a derived texture (see PROVENANCE.md)
const ME = 'Character_14';
const lookAtMe = (x: number, z: number) => Math.atan2(ME_EYE[0] - x, ME_EYE[1] - (TRAY_TOP + 0.12)) * (Math.abs(z - ME_EYE[2]) < 30 ? 1 : 0);
const Scene: React.FC<{t: number}> = ({t}) => {
	const shot = shotOf(t);
	const {lvl, green} = power(t);
	const day = shot === 'ledger' || shot === 'morning';
	const torch = shot === 'torch' && t < K.torchDie;
	// the room's state, by the story
	const slip = t >= K.on1 && t < K.cover[1] ? 1 - ease(lin(t, K.cover[0], K.cover[1])) : 0;
	const sitting = shot === 'close';
	const turned = shot === 'torch';
	const rise = shot === 'torch' ? ease(lin(t, K.rise[0], K.rise[1])) : 0;
	const tube = new THREE.Color('#aeeeff').lerp(new THREE.Color('#9effa8'), green);
	// my brother: at the desk; walking to the slipped tray; standing there; at the door tray; asleep at the desk
	const w = ease(lin(t, K.walk[0], K.walk[1]));
	const from: V3 = [DESK[0] + 0.6, 0, DESK[2]];
	const to: V3 = [0.45, 0, TRAYS[SLIP][1] + 0.35];
	let brother: React.ReactNode = null;
	if (shot === 'wide' && t < K.walk[0]) brother = <Seated name={BROTHER} p={[DESK[0] + 0.52, 0.02, DESK[2]]} ry={-Math.PI / 2} write={1} t={t} />;
	else if (shot === 'wide') {
		const moving = t < K.walk[1];
		const p = mix3(from, to, w);
		const ry = moving ? Math.atan2(to[0] - from[0], to[2] - from[2]) : Math.PI / 2;
		const reach = ease(lin(t, K.cover[0] - 0.3, K.cover[0])) * (1 - ease(lin(t, K.cover[1], K.cover[1] + 0.4)));
		const glance = t > K.on2 ? Math.sin((t - K.on2) * 2.2) * 1.1 : -1.2; // he does not look at it; then he looks round
		brother = (
			<Person name={BROTHER} p={p} ry={ry} stride={moving ? t * 7.5 : 0} look={moving ? 0 : glance} bow={0.15}
				pose={reach > 0 ? {RightArm: [['aim', [-0.15, -0.3 + 0.2 * reach, 1]]], RightForeArm: [['aim', [-0.05, -0.6, 1]]], LeftArm: [['aim', [0.15, -0.3 + 0.2 * reach, 1]]], LeftForeArm: [['aim', [0.05, -0.6, 1]]]} : {}} />
		);
	} else if (shot === 'close' && t > K.enter[0]) {
		const k = ease(lin(t, K.enter[0], K.enter[1]));
		const p = mix3([0.55, 0, DOOR_AT[1] + 1.2], [DOOR_AT[0] + 0.62, 0, DOOR_AT[1] - 0.15], k);
		const shake = 0.05 * Math.sin(t * 43) * lin(t, K.lay[0], K.lay[0] + 0.3);
		const reach = ease(lin(t, K.enter[1] - 0.4, K.lay[0]));
		brother = (
			<Person name={BROTHER} p={p} ry={k < 1 ? Math.atan2(-0.9, -1.0) : -Math.PI / 2} stride={k < 1 ? t * 7.5 : 0} bow={0.2 + 0.2 * reach} look={0.3}
				pose={reach > 0 ? {RightArm: [['aim', [-0.1, -0.1 * reach + shake, 1]]], RightForeArm: [['aim', [0.15, -0.25 + shake, 1]]], LeftArm: [['aim', [0.1, -0.1 * reach - shake, 1]]], LeftForeArm: [['aim', [-0.15, -0.25 - shake, 1]]]} : {}} />
		);
	} else if (shot === 'night' || shot === 'torch' || shot === 'morning' || shot === 'ledger') {
		brother = shot === 'ledger' ? null : <Seated name={BROTHER} p={[DESK[0] + 0.52, 0.02, DESK[2]]} ry={-Math.PI / 2} bow={shot === 'morning' ? 0.1 : 1} t={t} />;
	}
	const me = shot !== 'torch' && shot !== 'hook' && shot !== 'close' && shot !== 'ledger' ? <Seated name={ME} p={[MY_CHAIR[0] + 0.08, 0.02, MY_CHAIR[2]]} ry={Math.PI / 2} bow={shot === 'night' ? 0.15 : 0} t={t} /> : null;
	const ta = torchAim(t);
	return (
		<>
			<Cam get={() => poseAt(t, shot)} />
			<color attach="background" args={[day ? '#3a4044' : '#000000']} />
			{lvl > 0 && <ambientLight intensity={1.05 * lvl} color={new THREE.Color('#41525c').lerp(new THREE.Color('#3a5a40'), green)} />}
			{/* the tube over the door end of the corridor spills back toward us: a soft fill from the camera side */}
			{lvl > 0 && <pointLight position={[0.3, 2.6, 0.9]} intensity={1.6 * lvl} distance={6} decay={1} color={tube} />}
			{lvl > 0 && [-2.2, -6.6, -11].map((z) => <pointLight key={z} position={[0, 2.75, z]} intensity={5.5 * lvl} distance={7.5} decay={1} color={tube} />)}
			{day && <ambientLight intensity={1.9} color="#8e9aa2" />}
			{day && <pointLight position={[-2.2, 2.4, -6]} intensity={4} distance={11} decay={1} color="#c8d4dc" />}
			{torch && (
				<>
					{/* the torch in my hand: everything it reaches is lit from where I stand */}
					<pointLight position={[ME_EYE[0] + 0.15, ME_EYE[1] - 0.15, ME_EYE[2] - 0.2]} intensity={3.2} distance={11} decay={1} color="#fff0d0" />
				</>
			)}
			{shot === 'hook' && lvl > 0 && <pointLight position={[HOOK_AT[0] - 0.6, 2.2, HOOK_AT[1] + 1.2]} intensity={1.6 * lvl} distance={3} decay={1} color={tube} />}
			{shot === 'close' && lvl > 0 && <pointLight position={[DOOR_AT[0] + 0.6, 2.1, DOOR_AT[1] + 1.1]} intensity={3.2 * lvl} distance={3.5} decay={1} color={tube} />}
			<Room dawn={day ? 1 : 0} tubes={lvl} />
			{TRAYS.map(([x, z], i) => (
				<Tray key={i} x={x} z={z} />
			))}
			{TRAYS.map(([x, z], i) => {
				if (i === DOOR_TRAY && sitting) return null;
				if (i === HOOK_TRAY && shot === 'hook') return <Covered key={i} x={x} z={z} sit={1} />;
				const near = i === 0;
				const look = turned ? lookAtMe(x, z) : 0;
				return <Covered key={i} x={x} z={z} slip={i === SLIP ? slip : 0} look={look} sit={near ? rise * 0.75 : 0} />;
			})}
			{sitting && <Opened x={DOOR_AT[0]} z={DOOR_AT[1]} lean={ease(lin(t, K.lay[0], K.lay[1])) * 0.85} tilt={0.35 * ease(lin(t, K.on3 + 1.5, L.l05.end))} t={t} ooze={ease(lin(t, K.on3, L.l05.end))} />}
			{shot === 'morning' && <Covered x={FLOOR15[0]} z={FLOOR15[2]} y={0.02} />}
			<Desk pen={shot === 'ledger' ? ease(lin(t, K.cutLedger + 0.3, K.cutMorning - 0.4)) : 0.3} lamp={shot === 'wide' || shot === 'close' || shot === 'night'} />
			{brother}
			{me}
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: the torch, captions, grain
const Overlay: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
	const ui = useRef<HTMLCanvasElement>(null);
	const grain = useRef<HTMLCanvasElement>(null);
	const shot = shotOf(t);
	useLayoutEffect(() => {
		const CW = 360, CH = 640;
		const g = ui.current!.getContext('2d')!;
		g.clearRect(0, 0, CW, CH);
		// the torch: everything outside its circle is black
		if (shot === 'torch') {
			const dead = t >= K.torchDie;
			const flick = t > K.torchDie - 0.45 && hash(Math.floor((t + 600) * 30)) > 0.5;
			const r = dead || flick ? 0 : 175;
			const grd = g.createRadialGradient(CW / 2, CH / 2 - 20, r * 0.35, CW / 2, CH / 2 - 20, r + 1);
			grd.addColorStop(0, 'rgba(0,0,0,0)');
			grd.addColorStop(1, 'rgba(0,0,0,1)');
			g.fillStyle = r ? grd : '#000';
			g.fillRect(0, 0, CW, CH);
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
			g.font = 'bold 13px "DejaVu Sans Mono", monospace';
			g.textAlign = 'center';
			show.forEach((r, i) => {
				const y = 530 + i * 18 - (show.length - 1) * 9;
				g.fillStyle = '#000';
				for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.fillText(r, CW / 2 + dx, y + dy);
				g.fillStyle = '#e8f6f4';
				g.fillText(r, CW / 2, y);
			});
		}
		const img = g.getImageData(0, 0, CW, CH);
		for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 100 ? 255 : 0;
		g.putImageData(img, 0, 0);
		const b = grain.current!.getContext('2d')!;
		const bi = b.createImageData(60, 107);
		const r = rng(Math.floor((t + 600) * 24) * 104729 + 53);
		for (let i = 0; i < bi.data.length; i += 4) {
			const v = r() * 255;
			bi.data[i] = bi.data[i + 1] = bi.data[i + 2] = v;
			bi.data[i + 3] = 26 * r();
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

// ------------------------------------------------------------------ assembly
export const Episode53: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const tv = t >= K.loopShot ? t - DUR : t;
	const shot = shotOf(tv);
	const day = shot === 'ledger' || shot === 'morning';
	const grade = day ? 'contrast(1.1) saturate(0.45) brightness(1.0)' : shot === 'torch' ? 'contrast(1.3) saturate(0.8) brightness(1.1) sepia(0.15)' : 'contrast(1.28) saturate(0.85) brightness(1.08)';
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: 'scale(' + SCALE + ')', transformOrigin: '0 0', filter: grade}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 60, near: 0.03, far: 60}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			{!day && shot !== 'torch' && <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)'}} />}
			<Overlay t={tv} captions={captions} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep53-cold-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
