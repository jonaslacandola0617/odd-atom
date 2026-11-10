// Episode 4: "Rules for the Night Shift" (original). 55.8 s portrait short, pixelated
// low-poly 3D (180x320 rendered, 6x nearest upscale), PS1 shaders, a light tape layer.
// A night alone at Kestrel Ridge weather station, told through the rule sheet: each
// rule is read in Episode 1's us2 voice and then broken, or nearly broken, on screen.
// At 4 a.m. the same voice speaks from outside the door.
// Viral standard: second-person hook on frame 0 (the rule sheet, "You are alone up
// here"); a seamless loop (the last 1.5 s are the hook's own push-in on the sheet, on
// negative time: the night starts again); hidden rewatch details (rule 7 is already on
// the sheet in frame 0; the log's last row reads +37.0; a figure in the dark monitor
// for four frames; the clock in the last shot reads 03:59, before the knock); and an
// open question (who wrote the log?).
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep04-night-v1-timeline.json';
import {rng} from '../ps1';
import {Human, Pose} from '../ep01/world';
import {BoltHand, MatsProvider, Outside, PenHand, Room, Snow, WORKER} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep04Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => x * x * (3 - 2 * x);
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const sm = (t: number, a: number, b: number, v0 = 0, v1 = 1) => v0 + (v1 - v0) * ease(lin(t, a, b));
type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

export const K = {
	lightsOff: 25.8,
	knocks1: [27.0, 27.55, 28.1],
	knocks2: [31.9, 32.45, 33.0],
	boltOff: 40.6,
	reflection: 52.3, // hidden: a figure in the dark monitor, four frames
	loopOn: DUR - 1.45,
};

// ------------------------------------------------------------------ shot list
type Set = 'in' | 'out' | 'peep';
type Shot = {id: string; t: number; from: {p: V3; l: V3}; to?: {p: V3; l: V3}; fov?: number; set: Set};
const A = {from: {p: [1.42, 1.38, -1.0] as V3, l: [1.37, 1.36, -2.5] as V3}, to: {p: [1.38, 1.37, -1.15] as V3, l: [1.36, 1.36, -2.5] as V3}};
const SHOTS: Shot[] = [
	{id: 'A_sheet_hook', t: 0, set: 'in', ...A, fov: 54},
	{id: 'B_cable_car', t: 4.3, set: 'out', from: {p: [-1.5, 5.6, 4.5], l: [-20, -1, 0.5]}, to: {p: [-1.8, 5.5, 4.2], l: [-22, -3, 0.5]}, fov: 52},
	{id: 'C_log_pen', t: 7.2, set: 'in', from: {p: [-0.3, 1.2, -1.72], l: [-0.35, 0.78, -2.0]}, to: {p: [-0.32, 1.12, -1.78], l: [-0.35, 0.78, -2.0]}, fov: 44},
	{id: 'D_anemometer', t: 9.3, set: 'out', from: {p: [0.4, 5.2, 4.3], l: [-1.8, 6.1, 1.6]}, to: {p: [0.2, 5.25, 4.0], l: [-1.8, 6.15, 1.6]}, fov: 46},
	{id: 'E_wind_reading', t: 12.0, set: 'in', from: {p: [1.05, 1.55, -0.55], l: [0.4, 1.05, -2.2]}, to: {p: [0.95, 1.5, -0.75], l: [0.4, 1.05, -2.2]}, fov: 50},
	{id: 'F1_phone_rings', t: 14.4, set: 'in', from: {p: [-2.2, 1.5, -0.45], l: [-2.95, 1.42, -0.9]}, to: {p: [-2.3, 1.48, -0.55], l: [-2.95, 1.42, -0.9]}, fov: 46},
	{id: 'F2_cut_cord', t: 17.0, set: 'in', from: {p: [-2.5, 1.35, -0.62], l: [-2.9, 1.25, -0.85]}, to: {p: [-2.5, 1.05, -0.62], l: [-2.9, 0.95, -0.85]}, fov: 44},
	{id: 'G_east_window', t: 19.6, set: 'out', from: {p: [2.25, 1.75, -0.6], l: [9, -0.6, -3.2]}, to: {p: [2.45, 1.75, -0.55], l: [9, -0.6, -2.6]}, fov: 56},
	{id: 'H_switch', t: 25.3, set: 'in', from: {p: [-2.4, 1.85, -2.0], l: [2.4, 1.0, 2.1]}, fov: 62},
	{id: 'I_crouch_knock', t: 26.6, set: 'in', from: {p: [-2.8, 0.95, -2.35], l: [3.0, 0.9, 1.1]}, to: {p: [-2.72, 0.95, -2.25], l: [3.0, 0.9, 1.1]}, fov: 56},
	{id: 'J_clock', t: 29.3, set: 'in', from: {p: [-1.0, 2.2, -1.75], l: [-1.0, 2.27, -2.45]}, to: {p: [-1.0, 2.22, -1.85], l: [-1.0, 2.27, -2.45]}, fov: 36},
	{id: 'K_door', t: 31.4, set: 'in', from: {p: [0.2, 1.45, -0.6], l: [3.0, 1.15, 1.1]}, to: {p: [0.5, 1.45, -0.4], l: [3.0, 1.15, 1.1]}, fov: 52},
	{id: 'L_peephole', t: 34.3, set: 'peep', from: {p: [3.14, 1.62, 1.1], l: [10, -3.2, 0.4]}, to: {p: [3.14, 1.62, 1.1], l: [10, -3.4, 0.8]}, fov: 112},
	{id: 'M_bolt', t: 37.9, set: 'in', from: {p: [2.55, 1.2, 0.45], l: [3.0, 1.05, 0.75]}, to: {p: [2.58, 1.18, 0.5], l: [3.0, 1.05, 0.75]}, fov: 40},
	{id: 'N_face', t: 41.7, set: 'in', from: {p: [2.55, 1.6, -0.35], l: [2.25, 1.55, 1.15]}, to: {p: [2.5, 1.6, -0.2], l: [2.25, 1.55, 1.15]}, fov: 42},
	{id: 'O_log_filled', t: 45.0, set: 'in', from: {p: [-0.3, 1.22, -1.72], l: [-0.35, 0.78, -1.95]}, to: {p: [-0.33, 1.08, -1.85], l: [-0.35, 0.78, -2.06]}, fov: 44},
	{id: 'P_behind', t: 50.6, set: 'in', from: {p: [1.15, 1.6, -0.2], l: [-0.05, 1.45, -2.3]}, to: {p: [1.05, 1.58, -0.45], l: [-0.05, 1.45, -2.3]}, fov: 56},
	{id: 'A_loop', t: K.loopOn, set: 'in', ...A, fov: 54},
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

// ------------------------------------------------------------------ canvas textures

const useCanvasTex = (w: number, h: number) =>
	useMemo(() => {
		const c = document.createElement('canvas');
		c.width = w;
		c.height = h;
		const t = new THREE.CanvasTexture(c);
		t.magFilter = THREE.NearestFilter;
		t.minFilter = THREE.NearestFilter;
		t.generateMipmaps = false;
		t.colorSpace = THREE.SRGBColorSpace;
		return {c, t, g: c.getContext('2d')!};
	}, [w, h]);

const MONO = '"DejaVu Sans Mono", monospace';
const RULES = ['LOG TEMP HOURLY', 'WIND ON CALM', 'NIGHT = FAULT', 'PHONE: NO LINE', 'PRINTS: LIGHTS OFF', 'KNOCKING IS FINE', '4AM IS NOT 7AM', "DON'T TURN AROUND"];
/** Which rule is being read at t (0 = none). Rule 2 spans two rows on the sheet. */
const ruleAt = (t: number) => {
	if (t >= K.loopOn) return 0; // the loop shows the untouched sheet, as in frame 0
	const l = timeline.lines.find((x) => t >= x.start - 0.3 && t < x.end + 0.6);
	const map: Record<string, number> = {l02: 1, l03: 2, l04: 3, l05: 4, l06: 5, l07: 6, door: 6, l08: 6, l09: 6, l10: 7, l11: 7};
	return l ? map[l.id] ?? 0 : 0;
};

const drawSheet = (g: CanvasRenderingContext2D, t: number) => {
	const W = 72, H = 100;
	g.fillStyle = '#e4e0d4';
	g.fillRect(0, 0, W, H);
	g.fillStyle = '#1a1a1a';
	g.font = `bold 7px ${MONO}`;
	g.textAlign = 'center';
	g.fillText('KESTREL RIDGE', W / 2, 9);
	g.font = `bold 6px ${MONO}`;
	g.fillText('NIGHT SHIFT RULES', W / 2, 17);
	g.fillRect(4, 20, W - 8, 1);
	const cur = ruleAt(t);
	const rows: [number, string][] = [[1, RULES[0]], [2, RULES[1]], [0, RULES[2]], [3, RULES[3]], [4, RULES[4]], [5, RULES[5]], [6, RULES[6]], [7, RULES[7]]];
	g.textAlign = 'left';
	g.font = `5px ${MONO}`;
	let ruleNo = 0;
	rows.forEach(([n, txt], i) => {
		const y = 30 + i * 9;
		if (n) ruleNo = n;
		if (ruleNo === cur && cur > 0) {
			g.fillStyle = 'rgba(250,220,60,0.75)';
			g.fillRect(3, y - 6, W - 6, 8);
		}
		g.fillStyle = n === 7 ? '#5a1010' : '#1e1e1e';
		g.fillText(n ? `${n}.${txt}` : `  ${txt}`, 4, y);
	});
};

/** Monitor: the station's readout; WIND 84 on a calm night; dim when the lights go; a figure for four frames. */
const drawMonitor = (g: CanvasRenderingContext2D, t: number) => {
	const W = 64, H = 48;
	const dark = t >= K.lightsOff && t < K.loopOn;
	g.fillStyle = dark ? '#030805' : '#061208';
	g.fillRect(0, 0, W, H);
	const c = dark ? '#1a5a2a' : '#40e070';
	g.fillStyle = c;
	g.font = `bold 6px ${MONO}`;
	g.textAlign = 'left';
	g.fillText('KESTREL AWS', 3, 8);
	g.fillRect(3, 10, 58, 1);
	g.font = `6px ${MONO}`;
	g.fillText('TEMP  -14.2C', 3, 20);
	const windy = t >= 11.0 && t < K.loopOn;
	const wind = windy ? (84 + Math.floor(Math.sin(t * 3) * 3)).toString() : '0';
	g.fillStyle = windy && Math.floor(t * 2) % 2 ? '#ff5040' : c;
	g.fillText(`WIND  ${wind.padStart(3)} KM/H`, 3, 30);
	g.fillStyle = c;
	g.fillText('PRES  612 HPA', 3, 40);
	// scanlines
	g.fillStyle = 'rgba(0,0,0,0.25)';
	for (let y = 0; y < H; y += 2) g.fillRect(0, y, W, 1);
	if (t >= K.reflection && t < K.reflection + 0.134) {
		// a head and shoulders behind the chair, in the dark glass
		g.fillStyle = 'rgba(150,170,160,0.35)';
		g.beginPath();
		g.ellipse(46, 18, 5, 7, 0, 0, Math.PI * 2);
		g.fill();
		g.fillRect(38, 25, 16, 23);
	}
};

const drawLog = (g: CanvasRenderingContext2D, t: number) => {
	const W = 56, H = 72;
	g.fillStyle = '#ddd8c6';
	g.fillRect(0, 0, W, H);
	g.fillStyle = '#2a2a2a';
	g.font = `bold 6px ${MONO}`;
	g.textAlign = 'left';
	g.fillText('TEMP LOG', 3, 8);
	g.fillStyle = '#8aa0c0';
	for (let y = 12; y < H; y += 6) g.fillRect(0, y, W, 1);
	const hours = ['22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00'];
	const temps = ['-14.2', '-14.6', '-15.1', '-15.3', '-15.8', '-16.0', '-16.4', '-16.1', '-15.7', '+37.0'];
	const filled = t >= 44 ? 10 : t >= 7.2 ? 1 : 0;
	g.font = `5px ${MONO}`;
	hours.forEach((h, i) => {
		const y = 17 + i * 6;
		g.fillStyle = '#3a3a3a';
		g.fillText(h, 2, y);
		if (i < filled) {
			// handwriting: slightly jittered, and the same hand on every row
			const write = i === 0 && t < 9.3 ? lin(t, 7.6, 9.0) : 1;
			const s = temps[i].slice(0, Math.ceil(temps[i].length * write));
			g.fillStyle = i === 9 ? '#8a1a14' : '#1a2a6a';
			g.fillText(s, 30 + (i % 2), y + (i % 3 === 0 ? 0 : -1));
		}
	});
};

const clockAt = (t: number) => {
	if (t < 9.3 || t >= K.loopOn) return '21:59';
	if (t < 14.4) return '23:12';
	if (t < 19.6) return '01:07';
	if (t < 25.3) return '02:41';
	if (t < 29.3) return '03:58';
	if (t < 50.6) return '04:00';
	return '03:59'; // hidden: in the last shot the clock has gone back before the knock
};
const drawClock = (g: CanvasRenderingContext2D, t: number) => {
	const W = 48, H = 16;
	g.fillStyle = '#100404';
	g.fillRect(0, 0, W, H);
	g.fillStyle = '#ff3a2a';
	g.font = `bold 12px ${MONO}`;
	g.textAlign = 'center';
	const s = clockAt(t);
	g.fillText(Math.floor(t * 2) % 2 ? s : s.replace(':', ' '), W / 2, 13);
};

// ------------------------------------------------------------------ camera, atmosphere

const Cam: React.FC<{t: number}> = ({t}) => {
	const {camera} = useThree();
	const {s, k, u} = shotAt(t);
	const to = s.to ?? s.from;
	const p = mix3(s.from.p, to.p, k);
	const l = mix3(s.from.l, to.l, k);
	const b = s.set === 'out' ? 0.01 : 0.003;
	camera.position.set(p[0] + Math.sin(u * 0.9) * b, p[1] + Math.sin(u * 1.3) * b, p[2]);
	camera.up.set(0, 1, 0);
	camera.lookAt(...l);
	(camera as THREE.PerspectiveCamera).fov = s.fov ?? 50;
	(camera as THREE.PerspectiveCamera).far = 400;
	camera.updateProjectionMatrix();
	return null;
};

const Atmos: React.FC<{set: Set; lights: number}> = ({set, lights}) => {
	const {scene} = useThree();
	const bg = new THREE.Color(set === 'in' ? '#020203' : '#1c2232');
	void lights;
	if (!scene.fog) scene.fog = new THREE.Fog(bg, 10, 70);
	const f = scene.fog as THREE.Fog;
	f.color.copy(new THREE.Color(set === 'in' ? '#1c2232' : '#1c2232'));
	f.near = set === 'in' ? 8 : 6;
	f.far = set === 'in' ? 40 : 60;
	scene.background = bg;
	return null;
};

// ------------------------------------------------------------------ the world at time t

const World: React.FC<{t: number; tx: {sheet: THREE.Texture; monitor: THREE.Texture; log: THREE.Texture; clock: THREE.Texture}}> = ({t, tx}) => {
	const {s, u} = shotAt(t);
	const lights = t < K.lightsOff || t >= K.loopOn ? 1 : 0;
	const knock = [...K.knocks1, ...K.knocks2].some((k) => t >= k && t < k + 0.12) ? 1 : 0;
	const phone = t >= 14.6 && t < 19.4 ? (Math.floor((t - 14.6) / 1.2) % 2 === 0 ? 1 : 0) : 0;
	const calm = s.id === 'D_anemometer';
	const wind = calm ? 0 : s.id === 'B_cable_car' ? 0.6 : 0.35;
	const cups = t * (calm ? 9 : 4);
	// the worker
	let worker: {pose: Pose; pos: V3} | null = null;
	const seated: Pose = {sit: true, yaw: Math.PI / 2, armL: [0.9, -1.2], armR: [0.9, -1.2], head: [0, 0]};
	if (s.id === 'E_wind_reading') worker = {pose: {...seated, head: [0, sm(t, 13.0, 13.8, -0.1, 0.55)]}, pos: [0.4, 0, -1.4]};
	if (s.id === 'F1_phone_rings') worker = null;
	if (s.id === 'H_switch') worker = {pose: {yaw: 0, armR: [sm(t, 25.4, 25.75, 0, 1.4), -0.2], head: [0.3, 0]}, pos: [2.45, 0, 2.15]};
	if (s.id === 'I_crouch_knock') worker = {pose: {sit: true, yaw: 0.55, armL: [1.2, -2.0], armR: [1.2, -2.0], head: [0.1, -0.05]}, pos: [-1.75, -0.32, -1.45]};
	if (s.id === 'K_door') worker = {pose: {yaw: 0.35, step: sm(t, 31.6, 33.6, 0, 6), armL: [0.1, -0.2], armR: [0.3, -0.4], head: [0, -0.05]}, pos: [sm(t, 31.6, 33.6, 1.0, 2.1), 0, sm(t, 31.6, 33.6, 0.2, 0.95)]};
	if (s.id === 'N_face') worker = {pose: {yaw: 0, armR: [0.4, -0.6], head: [-0.15 + sm(t, 42.8, 43.6, 0, 0.12), -0.06]}, pos: [2.2, 0, 1.15]};
	if (s.id === 'P_behind') worker = {pose: {...seated, armL: [0.6, -0.9], armR: [0.6, -0.9], head: [0, -0.35]}, pos: [0.4, 0, -1.4]};
	if (s.id.startsWith('A_') || s.id === 'C_log_pen' || s.id === 'O_log_filled') worker = null;
	const tubes = lights * (0.92 + 0.08 * Math.sin(t * 40));
	const out = s.set !== 'in';
	return (
		<>
			<Atmos set={s.set} lights={lights} />
			<ambientLight intensity={out ? 1.1 : 0.12 + 0.25 * lights} color={out ? '#5a6890' : '#5a6070'} />
			<hemisphereLight args={['#8090b0', '#c8ccd6', out ? 0.6 : 0.05]} />
			{/* fluorescent tubes */}
			<pointLight position={[-1.2, 2.3, 0]} intensity={tubes * 4.5} distance={7} decay={1.2} color="#e8f0ff" />
			<pointLight position={[1.2, 2.3, 0]} intensity={tubes * 4.5} distance={7} decay={1.2} color="#e8f0ff" />
			{/* the CRT glow, always on */}
			<pointLight position={[0.4, 1.1, -1.8]} intensity={1.6} distance={2.6} decay={1.3} color="#40e070" />
			{/* the lamp over the door, and its spill through the east window and under the door */}
			<pointLight position={[3.6, 2.1, 1.1]} intensity={14} distance={9} decay={1.3} color="#ffd890" />
			<pointLight position={[2.6, 1.4, -1.0]} intensity={(1 - lights) * 1.5 + 0.4} distance={3} color="#8090b0" />
			{/* cold night light from the north window */}
			<pointLight position={[2.15, 1.6, -2.0]} intensity={0.8} distance={3} color="#8090b0" />
			<directionalLight position={[-30, 40, 20]} intensity={out ? 0.5 : 0} color="#a0b0d0" />
			<Room st={{lightsOn: lights, phone, doorShake: knock, bolt: s.id === 'M_bolt' ? 1 - sm(t, K.boltOff - 0.3, K.boltOff + 0.2) * 0.15 : 1, receiverOff: 0, t}} tx={tx} />
			<Outside t={t} printsShown={s.id === 'G_east_window' ? lin(t, 21.2, 24.6) : t >= 24.6 && t < K.loopOn ? 1 : 0} cups={cups} carPos={s.id === 'B_cable_car' ? lin(t, 4.3, 7.2, 0.04, 0.2) : 0.04} />
			<PenHand t={t} on={s.id === 'C_log_pen'} />
			{(s.id === 'M_bolt' || s.id === 'K_door' || s.id === 'N_face') && <pointLight position={[2.6, 1.3, 0.9]} intensity={1.6} distance={2.2} color="#ffd890" />}
			{s.id === 'M_bolt' && <BoltHand off={sm(t, K.boltOff, K.boltOff + 0.6)} />}
			{worker && <Human pose={worker.pose} pos={worker.pos} look={WORKER} face />}
			{(out || s.id.startsWith('A_')) && <Snow centre={s.id.startsWith('A_') ? [1.95, 0, -6] : s.id === 'G_east_window' ? [8, 0, 0] : s.id === 'L_peephole' ? [8, 0, 1] : (s.from.l as V3)} t={u} wind={wind} amount={1} />}
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: captions + tape + peephole

const Overlay: React.FC<{t: number; damage: number; captions: boolean}> = ({t, damage, captions}) => {
	const cap = useRef<HTMLCanvasElement>(null);
	const noise = useRef<HTMLCanvasElement>(null);
	useLayoutEffect(() => {
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
			// Every word is shown: long lines become balanced pages of at most 3 rows,
			// each page timed across the spoken line in proportion to its characters.
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
				const y = 470 + i * 19 - (show.length - 1) * 19;
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

export const Episode04: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const sheet = useCanvasTex(72, 100);
	const mon = useCanvasTex(64, 48);
	const log = useCanvasTex(56, 72);
	const clk = useCanvasTex(48, 16);
	drawSheet(sheet.g, t);
	sheet.t.needsUpdate = true;
	drawMonitor(mon.g, t);
	mon.t.needsUpdate = true;
	drawLog(log.g, t);
	log.t.needsUpdate = true;
	drawClock(clk.g, t);
	clk.t.needsUpdate = true;
	const {s} = shotAt(t);
	const peep = s.set === 'peep';
	const damage = (t >= K.lightsOff && t < K.lightsOff + 0.25) || (t >= K.reflection && t < K.reflection + 0.134) ? 0.5 : 0.05;
	const ca = 0.6 + damage * 2;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="tape4" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'url(#tape4)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.02, far: 400}} style={{imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Cam t={t} />
						<World t={t} tx={{sheet: sheet.t, monitor: mon.t, log: log.t, clock: clk.t}} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			{/* the peephole: a small round view with a dark brass ring */}
			{peep && <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 42%, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 330px, rgba(40,32,20,1) 345px, rgba(0,0,0,1) 380px)'}} />}
			<Overlay t={t} damage={damage} captions={captions} />
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep04-night-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
