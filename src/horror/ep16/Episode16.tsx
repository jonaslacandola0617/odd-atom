// Episode 16: "Ward Three" (reported legend: the abandoned hospital at the former Clark Air Base,
// Angeles, Pampanga). Season 2 horror standard (docs/production/EPISODE_PLAYBOOK.md): a dark key lit
// by flashlights, an orange city glow and a camcorder's infrared; the legend withheld (a wheelchair
// turning, pebbles thrown by no one, a nurse between the beds who is three beds closer every time
// the camera looks away), then ONE clear reveal in the night-vision viewfinder: she lifts her head,
// the face full, the eyes white; the tape tears. On the road, a woman in white crosses; in the back
// seat, a white sleeve.
// Taglish narration (Juanito), Taglish captions. Portrait 1080x1920, rendered at 180x320 and
// upscaled 6x, PS1 shaders, a light tape layer.
// Viral standard: a hook on frame 0 (a flashlight down the corridor, the wheelchair at the end
// turning to face us: "Abandonado na raw ang ospital na 'to..."); a seamless loop (the last 1.6 s
// replay the hook's move); hidden details (the wheelchair in a window in the exterior; the ward
// clock stopped at 3:07 in every shot; a palm print on the viewfinder glass; seven pebbles thrown
// and eight on the floor; three frames of her face between lines); an open question (what did they
// hear on the tape?).
// Care: a reported legend: the nurse is a legend figure, not a real person; the paranormal is told as
// report; the site is managed land (no trespass call); no US-PH political framing.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep16-ward-v1-timeline.json';
import {rng} from '../ps1';
import {handheld, Nurse, WhiteLady} from '../entities';
import {Land, MatsProvider as LandMats} from '../ep15/world';
import {AISLE_X, Car, CarGlare, H, Hospital, Hunter, MatsProvider, PEBBLE_AT, WHEEL} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep16Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => x * x * (3 - 2 * x);
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));

// key times, all from the real line times (scripts/ep16_sound.py reads the same rules)
export const K = {
	pebbles: L.l05.start - 0.1, // the first of seven pebbles lands
	behind: L.l05.start + 4.2, // the flashlight swings to the doorway behind
	sub: L.l05.end + 0.25, // three frames of her face (between lines)
	vf: L.l07.start - 0.3, // the camcorder's viewfinder
	away1: L.l08.start - 0.3, // looks away, at a friend
	back1: L.l08.start + 0.8, // looks back: three beds closer
	away2: L.l08.end - 0.3,
	back2: L.l08.end + 0.5, // closer again, at the foot of the nearest bed
	reveal: L.l08.end + 1.55, // she lifts her head (stinger in silence)
	tear: L.l08.end + 2.3, // the tape tears
	run: L.l08.end + 2.65, // outside: running to the car
	cross: L.l09.start + 3.3, // in the car: a woman in white crosses
	back: L.l10.start - 0.3, // the back seat
	loopOn: DUR - 1.6,
};
export const STINGERS = [K.reveal];
const SUB = (t: number) => t >= K.sub && t < K.sub + 0.1;

// ------------------------------------------------------------------ shot list
type Mode = 'torch' | 'ext' | 'vf' | 'black' | 'car';
type Pose = {p: V3; l: V3};
type Shot = {id: string; t: number; from: Pose; to?: Pose; fov?: number; mode: Mode; hand?: number; car?: boolean};
const hp = (p: V3): V3 => H(...p);
const A: {from: Pose; to: Pose} = {from: {p: hp([4.0, 1.6, 0.4]), l: hp([4.4, 0.6, -10.5])}, to: {p: hp([4.0, 1.58, -0.6]), l: hp([4.4, 0.6, -10.5])}};
const VFP: V3 = hp([AISLE_X + 0.2, 1.5, -0.6]);
const DOWN: V3 = hp([AISLE_X, 1.0, -15]);
const FRIEND: V3 = hp([0.35, 1.45, -1.6]);
const FACE: V3 = hp([AISLE_X, 1.66, -3.4]);
const REVEAL: {from: Pose; to: Pose} = {from: {p: VFP, l: FACE}, to: {p: hp([AISLE_X + 0.05, 1.62, -2.5]), l: FACE}};
const SHOTS: Shot[] = [
	{id: 'A_hook', t: 0, mode: 'torch', ...A, fov: 50, hand: 0.6},
	{id: 'B_ext', t: L.l01.end + 0.3, mode: 'ext', from: {p: [-2.6, 2.6, 15], l: hp([6, 1.2, -3])}, to: {p: [-2.9, 2.5, 13.5], l: hp([6, 1.2, -3])}, fov: 50},
	{id: 'C_entr', t: L.l03.start - 0.3, mode: 'ext', from: {p: hp([12.5, 1.6, 0.4]), l: hp([6, 1.5, 0])}, to: {p: hp([10.5, 1.55, 0.2]), l: hp([6, 1.4, 0])}, fov: 50, hand: 0.4},
	{id: 'D_ward', t: L.l04.start - 0.3, mode: 'torch', from: {p: hp([3.6, 1.6, -2.9]), l: hp([-4, 1.0, -8])}, to: {p: hp([0.4, 1.6, -3.2]), l: hp([-3, 0.9, -10])}, fov: 52, hand: 0.6},
	{id: 'E1_floor', t: L.l05.start - 0.4, mode: 'torch', from: {p: hp([-0.55, 1.25, -1.05]), l: hp([-1.35, 0, -2.3])}, to: {p: hp([-0.6, 1.2, -1.1]), l: hp([-1.4, 0, -2.4])}, fov: 52, hand: 0.5},
	{id: 'E2_behind', t: L.l05.start + 4.2, mode: 'torch', from: {p: hp([0.05, 1.5, -0.85]), l: hp([1.2, 1.0, -2.0])}, to: {p: hp([0.05, 1.5, -0.85]), l: hp([3.5, 1.2, -2.9])}, fov: 52, hand: 0.8},
	{id: 'F_hunters', t: L.l05.end + 0.3, mode: 'ext', from: {p: hp([12.4, 1.6, -0.7]), l: hp([7.6, 1.3, 0.2])}, to: {p: hp([11.6, 1.55, -0.6]), l: hp([7.6, 1.3, 0.2])}, fov: 50, hand: 0.4},
	{id: 'G_vf', t: K.vf, mode: 'vf', from: {p: VFP, l: DOWN}, to: {p: hp([AISLE_X + 0.2, 1.5, -0.8]), l: DOWN}, fov: 48, hand: 0.5},
	{id: 'H_away1', t: K.away1, mode: 'vf', from: {p: VFP, l: FRIEND}, fov: 48, hand: 0.6},
	{id: 'H_back1', t: K.back1, mode: 'vf', from: {p: VFP, l: DOWN}, fov: 48, hand: 0.6},
	{id: 'H_away2', t: K.away2, mode: 'vf', from: {p: VFP, l: FRIEND}, fov: 48, hand: 0.7},
	{id: 'H_back2', t: K.back2, mode: 'vf', from: {p: VFP, l: hp([AISLE_X, 1.2, -6])}, fov: 48, hand: 0.6},
	{id: 'I_reveal', t: K.reveal, mode: 'vf', ...REVEAL, fov: 42, hand: 0.4},
	{id: 'J_tear', t: K.tear, mode: 'black', from: {p: [0, 1, 0], l: [0, 1, -1]}},
	{id: 'K_run', t: K.run, mode: 'ext', from: {p: [3.5, 3.0, 7], l: [-12, 0.6, -3]}, to: {p: [3.2, 2.9, 6.2], l: [-10, 0.6, -2]}, fov: 52, hand: 0.7},
	{id: 'L_cross', t: K.cross, mode: 'car', car: true, from: {p: [-0.38, 1.25, -0.25], l: [0.2, 0.95, -20]}, to: {p: [-0.38, 1.25, -0.25], l: [0.0, 0.95, -20]}, fov: 54, hand: 0.3},
	{id: 'M_back', t: K.back, mode: 'car', car: true, from: {p: [-1.75, 1.2, 0.75], l: [-0.3, 0.98, 0.8]}, to: {p: [-1.45, 1.18, 0.78], l: [-0.3, 0.98, 0.8]}, fov: 50, hand: 0.25},
	{id: 'A_loop', t: K.loopOn, mode: 'torch', ...A, fov: 50, hand: 0.6},
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
	return {s, k: ease(lin(t, s.t, end)), u: t};
};

/** The car: parked at the roadside, then driving off down the right lane (-z), slowing to a stop. */
const carAt = (t: number): V3 => {
	if (t < K.cross) return [-2.4, 0, -1];
	return [1.5, 0, -2 - 24 * ease(lin(t, K.cross, K.back))];
};

const camPose = (t: number) => {
	const r0 = shotAt(t);
	const sub = SUB(t);
	const s = sub ? SHOTS.find((x) => x.id === 'I_reveal')! : r0.s;
	const k = sub ? 0.4 : r0.k;
	const u = r0.u;
	const to = s.to ?? s.from;
	let p = mix3(s.from.p, to.p, k);
	let l = mix3(s.from.l, to.l, k);
	if (s.car) {
		const c = carAt(t);
		p = [c[0] + p[0], p[1], c[2] + p[2]];
		l = [c[0] + l[0], l[1], c[2] + l[2]];
	}
	let roll = 0;
	if (s.hand) {
		const h = handheld(u, s.hand);
		p[0] += h.dp[0];
		p[1] += h.dp[1];
		p[2] += h.dp[2];
		roll = h.roll;
	}
	const jolt = STINGERS.reduce((a, kt) => a + (t >= kt && t < kt + 0.3 ? Math.sin((t - kt) * 60) * 0.02 * (1 - (t - kt) / 0.3) : 0), 0);
	p[1] += jolt;
	return {s, k, u, p, l, roll, sub};
};

const Cam: React.FC<{t: number}> = ({t}) => {
	const {camera} = useThree();
	const {s, p, l, roll} = camPose(t);
	camera.position.set(...p);
	camera.up.set(Math.sin(roll), Math.cos(roll), 0);
	camera.lookAt(...l);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = s.fov ?? 55;
	c.near = 0.02;
	c.far = 900;
	camera.updateProjectionMatrix();
	return null;
};

const FOG: Record<Mode, [string, number, number]> = {torch: ['#040507', 6, 34], ext: ['#0a0808', 14, 140], vf: ['#020302', 8, 26], black: ['#000000', 0.1, 0.2], car: ['#06070a', 10, 110]};
const Atmos: React.FC<{mode: Mode}> = ({mode}) => {
	const {scene} = useThree();
	const [c, near, far] = FOG[mode];
	const bg = new THREE.Color(c);
	if (!scene.fog) scene.fog = new THREE.Fog(bg, near, far);
	const f = scene.fog as THREE.Fog;
	f.color.copy(bg);
	f.near = near;
	f.far = far;
	scene.background = bg;
	return null;
};

/** A spotlight from (near) the camera, aimed where it looks: a flashlight, or a car's headlights. */
const Spot: React.FC<{p: V3; l: V3; intensity: number; angle?: number; dist?: number; color?: string}> = ({p, l, intensity, angle = 0.42, dist = 22, color = '#fff0d8'}) => {
	const light = React.useMemo(() => new THREE.SpotLight(color, 6, dist, angle, 0.6, 1), [color, dist, angle]);
	light.position.set(p[0] + 0.12, p[1] - 0.12, p[2]);
	light.target.position.set(...l);
	light.intensity = intensity;
	light.target.updateMatrixWorld();
	return (
		<>
			<primitive object={light} />
			<primitive object={light.target} />
		</>
	);
};

/** Where the nurse stands in the viewfinder shots: far, then three beds closer each time it looks back. */
const nurseZ = (t: number) => (t < K.back1 ? -14.4 : t < K.back2 ? -8.6 : -3.4);

// ------------------------------------------------------------------ the world at time t
const World: React.FC<{t: number}> = ({t}) => {
	const {s, p, l, sub} = camPose(t);
	const mode = s.mode;
	if (mode === 'black') return <Atmos mode="black" />;
	const u = s.id.startsWith('A_') ? (t >= K.loopOn ? t - DUR : t) : 99;
	const wheelRy = Math.PI * (1 - ease(lin(u, -1.0, 5.2)));
	let pebbles = 0;
	for (let i = 0; i < 7; i++) if (t >= PEBBLE_AT(i, K.pebbles)) pebbles++;
	if (t >= K.vf) pebbles = 8;
	const nurse = (mode === 'vf' && !s.id.startsWith('H_away')) || sub;
	const bow = s.id === 'I_reveal' || sub ? 1 - ease(lin(t, K.reveal, K.reveal + 0.25)) * (sub ? 0 : 1) : 1;
	const c = carAt(t);
	return (
		<>
			<Atmos mode={mode} />
			{mode === 'torch' && (
				<>
					<ambientLight intensity={0.35} color="#1a1e28" />
					<directionalLight position={[-20, 30, 20]} intensity={0.25} color="#6a6a7a" />
					<Spot p={p} l={l} intensity={s.id === 'E1_floor' ? 18 : 9} />
				</>
			)}
			{mode === 'vf' && (
				<>
					<ambientLight intensity={0.5} color="#ffffff" />
					<pointLight position={p} intensity={4.5} distance={22} decay={1.0} color="#ffffff" />
				</>
			)}
			{(mode === 'ext' || mode === 'car') && (
				<>
					<ambientLight intensity={2.0} color="#4a4450" />
					<directionalLight position={[40, 30, 30]} intensity={1.2} color="#c89070" />
					<directionalLight position={[-30, 50, 20]} intensity={0.6} color="#7a86a0" />
				</>
			)}
			{mode === 'car' && <Spot p={[c[0], 0.66, c[2] - 2.2]} l={[c[0] - 0.4, 0, c[2] - 30]} intensity={30} angle={0.5} dist={60} />}
			{s.id === 'M_back' && <pointLight position={[c[0] - 0.2, 1.35, c[2] + 0.5]} intensity={1.6} distance={2.5} decay={1.0} color="#8a9ab8" />}
			{s.id === 'F_hunters' && <pointLight position={H(7.8, 1.2, 0.2)} intensity={2.5} distance={6} decay={1.0} color="#fff0d0" />}
			<LandMats>
				<Land t={t} dawn={false} city />
			</LandMats>
			<MatsProvider>
				<Hospital t={t} pebbles={pebbles} wheelRy={u < 50 ? wheelRy : 0} outside={mode === 'ext' || mode === 'car'} />
				{nurse && <Nurse t={t} bow={bow} position={H(AISLE_X, 0, sub ? -3.4 : nurseZ(t))} />}
				{mode === 'vf' && <Hunter t={t} position={H(0.4, 0, -1.6)} ry={Math.PI} lamp={false} />}
				{s.id === 'F_hunters' &&
					([[7.4, -0.8, 0], [7.9, 0.2, 1], [7.2, 1.0, 0]] as [number, number, number][]).map(([x, z, cam], i) => (
						<Hunter key={i} t={t} position={H(x, 0, z)} ry={-Math.PI / 2 + (i - 1) * 0.3} camcorder={cam === 1} />
					))}
				{s.id === 'K_run' &&
					[0, 1, 2].map((i) => {
						const k = lin(t, K.run + i * 0.35, K.cross, 0, 1);
						const x = -19 + k * 14 + i * 0.8, z = -3 + i * 1.1 + k * 1.5;
						return (
							<group key={i}>
								<Hunter t={t + i * 0.3} run position={[x, 0, z]} ry={Math.PI / 2 - 0.15} />
								<pointLight position={[x + 0.6, 1.0, z]} intensity={2.2} distance={4} decay={1.0} color="#fff0d0" />
							</group>
						);
					})}
				{(s.id === 'K_run' || mode === 'car') && <Car position={c} lights sleeve={s.id === 'M_back'} />}
				{s.id === 'K_run' && <CarGlare position={c} size={0.0} />}
			</MatsProvider>
			{s.id === 'L_cross' && <WhiteLady t={t} position={[4.5 - lin(t, K.cross + 0.9, K.back - 0.4) * 8.5, 0, -32]} rotationY={-Math.PI / 2} glow={0.8} />}
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: captions, tape
const Overlay: React.FC<{t: number; damage: number; captions: boolean; vf: boolean; print: boolean}> = ({t, damage, captions, vf, print}) => {
	const cap = useRef<HTMLCanvasElement>(null);
	const noise = useRef<HTMLCanvasElement>(null);
	useLayoutEffect(() => {
		// ---- captions (Taglish), every word shown, kept in the lower third
		const CW = 360, CH = 640;
		const g = cap.current!.getContext('2d')!;
		g.clearRect(0, 0, CW, CH);
		if (vf) {
			// the camcorder's viewfinder: corner brackets, REC, battery, timecode, night mode
			g.fillStyle = '#d8ffd8';
			g.font = 'bold 13px "DejaVu Sans Mono", monospace';
			g.textAlign = 'left';
			for (const [x, y, dx, dy] of [[30, 70, 1, 1], [330, 70, -1, 1], [30, 410, 1, -1], [330, 410, -1, -1]]) {
				g.fillRect(x, y, 18 * dx, 2 * dy);
				g.fillRect(x, y, 2 * dx, 18 * dy);
			}
			if (Math.floor(t * 2) % 2 === 0) {
				g.fillStyle = '#ff3020';
				g.beginPath();
				g.arc(44, 92, 5, 0, Math.PI * 2);
				g.fill();
			}
			g.fillStyle = '#d8ffd8';
			g.fillText('REC', 54, 97);
			g.fillText('NIGHT', 262, 97);
			g.strokeStyle = '#d8ffd8';
			g.strokeRect(286, 384, 24, 10);
			g.fillRect(310, 387, 3, 4);
			g.fillRect(289, 387, 6, 4);
			const s = Math.floor(t) + 2832;
			g.fillText(`00:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`, 44, 394);
			if (print) {
				// a palm print on the viewfinder glass
				g.fillStyle = 'rgba(220,255,220,0.13)';
				g.fillRect(250, 170, 30, 34);
				for (let f = 0; f < 4; f++) g.fillRect(251 + f * 8, 140 - (f === 1 || f === 2 ? 5 : 0), 6, 28);
				g.fillRect(280, 182, 14, 8);
			}
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
	}, [t, damage, captions]);
	return (
		<>
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

// ------------------------------------------------------------------ assembly
export const Episode16: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const sub = SUB(t);
	const {s} = camPose(t);
	const vf = s.mode === 'vf' || sub;
	const tearing = t >= K.tear && t < K.run;
	const hit = STINGERS.reduce((a, kt) => Math.max(a, t >= kt && t < kt + 0.4 ? 1 - (t - kt) / 0.4 : 0), 0) + (sub ? 0.7 : 0) + (tearing ? 1.2 : 0);
	const damage = 0.05 + hit * 0.6;
	const ca = 0.6 + damage * 3;
	const shift = hit > 0.5 ? Math.round(Math.sin(t * 90) * (tearing ? 9 : 3)) : 0;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="tape16" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
				{/* night vision: luminance into green */}
				<filter id="nv16" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix type="matrix" values="0.06 0.12 0.02 0 0  0.3 0.6 0.12 0 0.03  0.06 0.12 0.02 0 0  0 0 0 1 0" />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: shift, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: vf ? 'url(#nv16) url(#tape16)' : 'url(#tape16)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 55, near: 0.02, far: 900}} style={{imageRendering: 'pixelated'}}>
					<Cam t={t} />
					<World t={t} />
				</ThreeCanvas>
			</div>
			<AbsoluteFill style={{background: 'rgba(6,10,18,0.05)'}} />
			<Overlay t={t} damage={damage} captions={captions} vf={vf} print={vf && t >= K.back1} />
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep16-ward-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
