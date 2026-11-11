// Episode 11: "The Passenger on Balete Drive" (reported Philippine urban legend: the White Lady of
// Balete Drive, New Manila, Quezon City). Season 2, the first episode to the Season 2 horror
// standard (docs/production/EPISODE_PLAYBOOK.md): a dark key with motivated light (dashboard,
// meter, sodium street lights, headlights), the entity withheld (a figure at the roadside, hair
// over a headrest) and then ONE clear, lit, held reveal in the rear-view mirror after a held
// silence; a "moves when you look away" pair (the mirror empty, a glance at the road, the same
// mirror framing with someone in the back); handheld cameras inside the cab; a seeded flicker.
// Portrait 1080x1920, rendered at 180x320 and upscaled 6x, PS1 shaders, a light tape layer.
// Taglish narration (Juanito), Taglish captions.
// Viral standard: a hook on frame 0 (the mirror, the empty back seat, "Kung dadaan ka sa Balete
// Drive pagkalipas ng hatinggabi, huwag kang titingin sa salamin."); a seamless loop (the street
// repeats every PERIOD metres and the taxi travels a whole number of periods; the rosary swings on
// a snapped period; the last 1.6 s replay the hook's mirror move on negative time); hidden details
// (sampaguita petals on the back seat from frame 0; the meter starts by itself and is running again
// at the end; the rosary pulled towards the back seat while she is there; she is at the side window
// after the taxi has passed her; the balete ahead again in the last shot); an open question (who
// was she, before she was a story?).
// Care: a legend with no identified victim. No violence, no named person, no taxi driver as killer.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep11-balete-v1-timeline.json';
import {rng} from '../ps1';
import {flicker, handheld, WhiteLady} from '../entities';
import {Balete, MatsProvider, nearestLamp, PERIOD, Street, Taxi} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep11Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => x * x * (3 - 2 * x);
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const sm = (t: number, a: number, b: number, v0 = 0, v1 = 1) => v0 + (v1 - v0) * ease(lin(t, a, b));
type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
/** a period snapped so a whole number of cycles fits the episode (seamless loop) */
const qf = (p: number) => DUR / Math.max(1, Math.round(DUR / p));

// The taxi drives at about 9 m/s; the speed is snapped so it covers a whole number of PERIODs.
const V = (Math.round((9 * DUR) / PERIOD) * PERIOD) / DUR;
const taxiZ = (t: number) => V * t;

// key times, all from the real line times (scripts/ep11_sound.py reads the same rules)
export const K = {
	meterOn: L.l05.end + 0.75, // the meter starts by itself (in the gap, no word)
	beside: L.l05.start + 1.2, // the taxi passes the balete and the woman
	window: L.l05.end + 0.12, // she is at the side window, after the taxi has passed her
	silence: L.l07.end + 0.25, // the held silence before the reveal
	reveal: L.l07.end + 1.55, // the reveal (stinger in silence)
	turn: L.l07.end + 2.55, // the driver turns: the back seat is empty
	loopOn: DUR - 1.6,
};
export const STINGERS = [K.reveal];
export const SOFT_HITS = [K.window, K.turn];
const ZB = taxiZ(K.beside) + 1.5; // the balete, in street space
const ZB2 = taxiZ(L.l10.start) + 42; // the balete again, ahead, in the last shot
const LADY_X = 4.3;

// ------------------------------------------------------------------ shot list
type Mode = 'cab' | 'mirror' | 'street';
type Pose = {p: V3; l: V3};
type Shot = {id: string; t: number; from: Pose; to?: Pose; fov?: number; mode: Mode; world?: boolean; hand?: number};
// mirror camera: at the glass, looking back at the bench (the picture is flipped left-right)
const MIRROR_A: Pose = {p: [0.02, 1.29, 0.7], l: [-0.04, 1.12, -1.2]};
const MIRROR_B: Pose = {p: [0.0, 1.29, 0.69], l: [-0.05, 1.11, -1.2]};
const MIRROR_FACE: Pose = {p: [-0.04, 1.27, 0.42], l: [-0.06, 1.17, -0.8]};
const SHOTS: Shot[] = [
	{id: 'A_hook', t: 0, mode: 'mirror', from: MIRROR_A, to: MIRROR_B, fov: 46},
	{id: 'B_back', t: L.l01.end + 0.3, mode: 'cab', from: {p: [0.28, 1.12, -0.95], l: [-0.3, 0.95, 6]}, to: {p: [0.22, 1.13, -0.85], l: [-0.25, 0.95, 6]}, fov: 58, hand: 0.8},
	{id: 'C_balete', t: L.l03.start, mode: 'cab', from: {p: [-0.38, 1.12, 0.15], l: [1.6, 2.6, 30]}, to: {p: [-0.38, 1.12, 0.2], l: [2.4, 2.4, 20]}, fov: 54, hand: 0.5},
	{id: 'C_lady', t: L.l04.start, mode: 'street', world: true, from: {p: [-2.2, 0.9, ZB - 14], l: [LADY_X, 2.6, ZB - 1.5]}, to: {p: [-1.9, 0.9, ZB - 12], l: [LADY_X, 2.3, ZB - 1.5]}, fov: 56},
	{id: 'D_pass', t: L.l05.start, mode: 'cab', from: {p: [-0.35, 1.08, -0.6], l: [6, 1.1, -0.2]}, to: {p: [-0.3, 1.08, -0.6], l: [6, 1.05, -0.6]}, fov: 54, hand: 0.9},
	{id: 'E_meter', t: L.l05.end + 0.42, mode: 'cab', from: {p: [0.05, 1.12, 0.42], l: [0.3, 0.98, 0.84]}, to: {p: [0.08, 1.1, 0.48], l: [0.3, 0.99, 0.84]}, fov: 44},
	{id: 'F_mirror1', t: L.l06.start, mode: 'mirror', from: MIRROR_B, fov: 46},
	{id: 'F_road', t: L.l06.end + 0.12, mode: 'cab', from: {p: [-0.38, 1.12, 0.15], l: [-0.2, 0.9, 30]}, fov: 54, hand: 0.4},
	{id: 'F_mirror2', t: L.l07.start, mode: 'mirror', from: MIRROR_B, fov: 46},
	{id: 'G_push', t: K.silence, mode: 'mirror', from: MIRROR_B, to: MIRROR_FACE, fov: 40},
	{id: 'H_turn', t: K.turn, mode: 'cab', from: {p: [0.32, 1.1, 0.2], l: [0.5, 1.0, 3]}, to: {p: [0.3, 1.08, 0.15], l: [-0.35, 0.6, -0.75]}, fov: 56, hand: 1.0},
	{id: 'I_high', t: L.l08.start + 3.6, mode: 'street', from: {p: [-9, 16, -26], l: [0, 0, 10]}, to: {p: [-8, 15, -20], l: [0, 0, 14]}, fov: 50},
	{id: 'J_ahead', t: L.l09.end + 0.3, mode: 'cab', from: {p: [0.05, 1.14, -0.3], l: [0.4, 1.4, 40]}, to: {p: [0.05, 1.14, -0.2], l: [0.9, 1.6, 40]}, fov: 50, hand: 0.4},
	{id: 'A_loop', t: K.loopOn, mode: 'mirror', from: MIRROR_A, to: MIRROR_B, fov: 46},
];
const shotAt = (t: number) => {
	let i = 0;
	for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].t) i = k;
	const s = SHOTS[i];
	if (s.id.startsWith('A_')) {
		const u = t >= K.loopOn ? t - DUR : t;
		return {s, k: lin(u, K.loopOn - DUR, SHOTS[1].t), u};
	}
	const end = SHOTS[i + 1]?.t ?? DUR;
	if (s.id === 'H_turn') return {s, k: ease(lin(t, s.t, s.t + 0.35)), u: t}; // a fast turn, then hold
	if (s.id === 'G_push') return {s, k: ease(lin(t, s.t, K.reveal + 0.2)), u: t};
	return {s, k: ease(lin(t, s.t, end)), u: t};
};
const camPose = (t: number) => {
	const {s, k, u} = shotAt(t);
	const to = s.to ?? s.from;
	const p = mix3(s.from.p, to.p, k);
	const l = mix3(s.from.l, to.l, k);
	if (s.world) {
		p[2] -= taxiZ(t);
		l[2] -= taxiZ(t);
	}
	let roll = 0;
	if (s.hand) {
		const h = handheld(t, s.hand);
		p[0] += h.dp[0];
		p[1] += h.dp[1];
		p[2] += h.dp[2];
		roll = h.roll;
	}
	// road vibration inside the cab, and a jolt on the stinger
	if (s.mode !== 'street' || s.world) p[1] += Math.sin(u * 23) * 0.002 + Math.sin(u * 7.3) * 0.002;
	const jolt = STINGERS.reduce((a, kt) => a + (t >= kt && t < kt + 0.3 ? Math.sin((t - kt) * 60) * 0.02 * (1 - (t - kt) / 0.3) : 0), 0);
	p[0] += jolt;
	if (s.mode === 'mirror') {
		// the mirror image: the scene is drawn mirrored (World), so the camera's x is mirrored too
		p[0] = -p[0];
		l[0] = -l[0];
	}
	return {s, k, u, p, l, roll};
};

const Cam: React.FC<{t: number}> = ({t}) => {
	const {camera} = useThree();
	const {s, p, l, roll} = camPose(t);
	camera.position.set(...p);
	camera.up.set(Math.sin(roll), Math.cos(roll), 0);
	camera.lookAt(...l);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = s.id === 'G_push' ? interpolate(t, [K.silence, K.reveal + 0.2], [46, 34], cl) : s.fov ?? 50;
	c.near = 0.03;
	c.far = 400;
	camera.updateProjectionMatrix();
	return null;
};

const Atmos: React.FC = () => {
	const {scene} = useThree();
	const bg = new THREE.Color('#05070c');
	if (!scene.fog) scene.fog = new THREE.Fog(bg, 18, 120);
	(scene.fog as THREE.Fog).color.copy(bg);
	scene.background = bg;
	return null;
};

// ------------------------------------------------------------------ the world at time t
const rosaryAt = (t: number) => {
	const pullK = t >= K.meterOn && t < K.turn ? sm(t, K.meterOn, K.meterOn + 0.8) : t >= K.turn ? 1 - sm(t, K.turn, K.turn + 1.2) : 0;
	const swing = Math.sin((2 * Math.PI * t) / qf(1.9)) * 0.22 * (1 - pullK) + Math.sin((2 * Math.PI * t) / qf(0.83)) * 0.04 * (1 - pullK);
	return {swing, pull: pullK * 0.55};
};
const meterAt = (t: number): [string, boolean] => {
	const on = (t >= K.meterOn && t < K.turn + 0.6) || (t >= L.l10.start && t < K.loopOn);
	const since = t >= L.l10.start ? t - L.l10.start : t - K.meterOn;
	const fare = 45 + Math.floor(Math.max(0, since) / 2.5) * 2.5;
	return [`P${fare.toFixed(2).padStart(6, ' ')}`, on];
};

const Headlights: React.FC = () => {
	const light = React.useMemo(() => {
		const l = new THREE.SpotLight('#fff0d0', 30, 80, 0.45, 0.5, 1);
		l.position.set(0, 0.8, 2.4);
		l.target.position.set(0, 0, 40);
		return l;
	}, []);
	return (
		<>
			<primitive object={light} />
			<primitive object={light.target} />
		</>
	);
};

const World: React.FC<{t: number}> = ({t}) => {
	const {s} = camPose(t);
	const z = taxiZ(t);
	const lamp = nearestLamp(z);
	const {swing, pull} = rosaryAt(t);
	const [fare, meterOn] = meterAt(t);
	const inCab = s.mode !== 'street';
	// the dash light flickers once she is in the car; it comes back strong for the reveal
	const fl = t >= L.l07.start && t < K.reveal ? flicker(t, 11, 11, 0.9) : 1;
	const dashI = (t >= K.silence && t < K.reveal ? 0.15 : 1) * fl;
	const revealI = t >= K.reveal && t < K.turn ? 1 : 0;
	const seated = (s.id === 'F_mirror2' || s.id === 'G_push') && t < K.turn;
	const part = s.id === 'G_push' ? sm(t, K.reveal - 0.05, K.reveal + 0.25) : 0;
	const atWindow = t >= K.window && t < K.window + 0.33;
	const showLady = s.id === 'C_balete' || s.id === 'C_lady' || s.id === 'D_pass' || s.id === 'I_high';
	return (
		<>
			<Atmos />
			<group scale={[s.mode === 'mirror' ? -1 : 1, 1, 1]}>
			<ambientLight intensity={2.6} color="#3a4a6a" />
			<directionalLight position={[-30, 60, -20]} intensity={0.9} color="#8a9ac0" />
			{/* the nearest sodium lamp: its light sweeps through the cab as the taxi passes */}
			<pointLight position={lamp} intensity={7} distance={26} decay={1.0} color="#ffa04a" />
			<pointLight position={[lamp[0], lamp[1], lamp[2] + PERIOD]} intensity={6} distance={26} decay={1.0} color="#ffa04a" />
			{/* street light coming in through the rear window onto the back bench */}
			{inCab && <pointLight position={[0.1, 1.35, -1.7]} intensity={3.2 * (0.6 + 0.4 * Math.cos(((z % PERIOD) / PERIOD) * Math.PI * 2))} distance={4} decay={1.0} color="#e0a070" />}
			{/* a sodium lamp stands under the balete: it lights the roots and her */}
			{Math.abs(ZB - z) < 90 && <pointLight position={[2.4, 5.8, ZB - 4 - z]} intensity={8} distance={22} decay={1.0} color="#ffa850" />}
			{s.id === 'J_ahead' && <pointLight position={[2.4, 5.8, ZB2 - 4 - z]} intensity={8} distance={22} decay={1.0} color="#ffa850" />}
			{/* headlights */}
			<Headlights />
			{/* dashboard glow on the driver and the cab (green-amber) */}
			{inCab && <pointLight position={[0, 1.0, 0.7]} intensity={2.2 * dashI} distance={3.2} decay={1.2} color="#9adcae" />}
			{/* the reveal: the dash light rises on her face */}
			{revealI > 0 && <pointLight position={[-0.15, 1.05, 0.2]} intensity={2.6} distance={2.4} decay={1.0} color="#c8e8cc" />}
			<MatsProvider>
				<Street taxiZ={z} />
				{Math.abs(ZB - z) < 140 && <Balete z={ZB - z} />}
				{s.id === 'J_ahead' && <Balete z={ZB2 - z} />}
				{showLady && <WhiteLady t={t} arm={sm(t, L.l04.start + 0.6, L.l04.start + 1.6)} position={[LADY_X, 0.16, ZB - 1.5 - z]} rotationY={-Math.PI / 2 - 0.25} glow={0.4} />}
				{s.id === 'J_ahead' && <WhiteLady t={t} position={[LADY_X, 0.16, ZB2 - 1.5 - z]} rotationY={-Math.PI / 2 - 0.3} glow={0.5} />}
				{atWindow && <WhiteLady t={t} position={[1.0, -0.3, -0.62]} rotationY={-Math.PI / 2} glow={0.8} />}
				{seated && <WhiteLady t={t} seated part={part} glow={revealI ? 1.2 : 0.5} position={[-0.05, -0.03, -0.82]} scale={0.85} />}
				<Taxi rosary={swing} pull={pull} meter={fare} meterOn={meterOn} wet={t >= K.turn ? 1 : 0} exterior={s.mode === 'street'} driverTurn={s.id === 'H_turn' ? sm(t, K.turn, K.turn + 0.3, 0, 2.4) : 0} />
			</MatsProvider>
			</group>
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: mirror frame, captions, tape

/** The mirror's glass in low-res screen space for a mirror shot (x0, y0, x1, y1). */
const mirrorRect = (t: number, id: string): [number, number, number, number] => {
	if (id === 'G_push') {
		const k = sm(t, K.silence, K.reveal + 0.2);
		return [interpolate(k, [0, 1], [8, -40]), interpolate(k, [0, 1], [96, 30]), interpolate(k, [0, 1], [172, 220]), interpolate(k, [0, 1], [196, 300])];
	}
	return [8, 96, 172, 196];
};

const Overlay: React.FC<{t: number; damage: number; captions: boolean}> = ({t, damage, captions}) => {
	const cap = useRef<HTMLCanvasElement>(null);
	const noise = useRef<HTMLCanvasElement>(null);
	const frame = useRef<HTMLCanvasElement>(null);
	const {s} = camPose(t);
	useLayoutEffect(() => {
		// ---- the mirror: everything outside the glass is the dark cab; the rosary hangs in front
		const f = frame.current!.getContext('2d')!;
		f.clearRect(0, 0, LW, LH);
		if (s.mode === 'mirror') {
			const [x0, y0, x1, y1] = mirrorRect(t, s.id);
			f.fillStyle = '#030305';
			f.fillRect(0, 0, LW, LH);
			// street lights smeared through the windshield above and below the mirror
			const r = rng(Math.floor(taxiZ(t) / PERIOD) * 13 + 3);
			const ph = (taxiZ(t) % PERIOD) / PERIOD;
			for (let i = 0; i < 3; i++) {
				const yy = 30 + ((ph * 320 + i * 107 + r() * 20) % 320);
				const g = f.createRadialGradient(40 + i * 50, yy, 0, 40 + i * 50, yy, 26);
				g.addColorStop(0, 'rgba(255,150,60,0.22)');
				g.addColorStop(1, 'rgba(255,150,60,0)');
				f.fillStyle = g;
				f.fillRect(0, 0, LW, LH);
			}
			// the green dash glow at the bottom of the frame
			const gd = f.createLinearGradient(0, LH - 60, 0, LH);
			gd.addColorStop(0, 'rgba(40,120,80,0)');
			gd.addColorStop(1, 'rgba(40,120,80,0.25)');
			f.fillStyle = gd;
			f.fillRect(0, LH - 60, LW, 60);
			// cut the glass out (rounded), with a dark plastic rim
			f.save();
			f.globalCompositeOperation = 'destination-out';
			f.fillStyle = '#000';
			f.beginPath();
			f.roundRect(x0, y0, x1 - x0, y1 - y0, 10);
			f.fill();
			f.restore();
			f.strokeStyle = '#14141a';
			f.lineWidth = 4;
			f.beginPath();
			f.roundRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4, 12);
			f.stroke();
			f.strokeStyle = 'rgba(160,170,190,0.18)';
			f.lineWidth = 1;
			f.beginPath();
			f.moveTo(x0 + 6, y0 + 4);
			f.lineTo(x1 - 30, y0 + 4);
			f.stroke();
			// the mirror stem
			f.fillStyle = '#14141a';
			f.fillRect((x0 + x1) / 2 - 5, Math.min(y0 - 30, 0), 10, Math.max(4, y0 - Math.min(y0 - 30, 0)));
			// the rosary, hanging in front of the glass from the stem
			const {swing, pull} = rosaryAt(t);
			const ax = (x0 + x1) / 2 + 10, ay = y0 + 2;
			const ang = swing * 1.2 - pull * 0.6;
			const len = 70 * (1 - pull * 0.35);
			for (let i = 0; i < 14; i++) {
				const k = i / 13;
				const bx = ax + Math.sin(ang) * len * k + Math.sin(k * 3) * 2;
				const by = ay + Math.cos(ang) * len * k;
				f.fillStyle = i % 5 === 4 ? '#c9b87a' : '#6a1e1e';
				f.fillRect(Math.round(bx) - 1, Math.round(by) - 1, 3, 3);
			}
			const cx = ax + Math.sin(ang) * (len + 6), cy = ay + Math.cos(ang) * (len + 6);
			f.fillStyle = '#c9b87a';
			f.fillRect(Math.round(cx) - 1, Math.round(cy) - 3, 2, 9);
			f.fillRect(Math.round(cx) - 3, Math.round(cy) - 1, 6, 2);
		}
		// ---- captions (Taglish), every word shown, kept in the lower third
		const CW = 360, CH = 640;
		const g = cap.current!.getContext('2d')!;
		g.clearRect(0, 0, CW, CH);
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
			g.textAlign = 'center';
			show.forEach((r, i) => {
				const y = 478 + i * 19 - (show.length - 1) * 19;
				for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [2, 2]]) {
					g.fillStyle = '#000';
					g.fillText(r, CW / 2 + dx, y + dy);
				}
				g.fillStyle = '#ffffff';
				g.fillText(r, CW / 2, y);
			});
			const img = g.getImageData(0, 0, CW, CH);
			for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 120 ? 255 : 0;
			g.putImageData(img, 0, 0);
		}
		// ---- tape noise and the tracking band
		const n = noise.current!.getContext('2d')!;
		const ni = n.createImageData(LW, LH);
		const r = rng(Math.floor(t * 30) * 7919 + 5);
		const band = ((t * 30 * 2) % (LH + 60)) - 30;
		for (let y = 0; y < LH; y++) {
			const inBand = Math.abs(y - band) < 3 + damage * 12;
			for (let x = 0; x < LW; x++) {
				const i = (y * LW + x) * 4;
				const v = r() * 255;
				ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = v;
				ni.data[i + 3] = (inBand ? 40 + damage * 120 : 14 + damage * 60) * (r() < 0.5 ? 1 : 0.4);
			}
		}
		n.putImageData(ni, 0, 0);
	}, [t, damage, captions, s.id, s.mode]);
	return (
		<>
			<canvas ref={frame} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

// a cold dark grade, a little lighter for the reveal; black on the turn's first frames
const darkGrade = (t: number) => (t >= K.reveal && t < K.turn ? 0.0 : t >= K.silence && t < K.reveal ? 0.22 : 0.06);

// ------------------------------------------------------------------ assembly
export const Episode11: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const {s} = camPose(t);
	const hit = [...STINGERS, ...SOFT_HITS].reduce((a, kt) => Math.max(a, t >= kt && t < kt + 0.4 ? 1 - (t - kt) / 0.4 : 0), 0);
	const damage = 0.05 + hit * 0.6;
	const ca = 0.6 + damage * 3;
	const shift = hit > 0.5 ? Math.round(Math.sin(t * 90) * 3) : 0;
	const g = darkGrade(t);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="tape11" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: shift, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'url(#tape11)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.03, far: 400}} style={{imageRendering: 'pixelated'}}>
					<Cam t={t} />
					<World t={t} />
				</ThreeCanvas>
			</div>
			<AbsoluteFill style={{background: `rgba(6,12,20,${g})`}} />
			<Overlay t={t} damage={damage} captions={captions} />
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep11-balete-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
