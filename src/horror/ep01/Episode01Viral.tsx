// Episode 1 VIRAL CUT (v2): 49 s, second-person hook from frame 0, seamless loop,
// hidden rewatch details (clock jumps 10:39 -> 10:42, a figure in Mark's photo, a
// stranger staring east in the street, the shadow tilts its head like Mark).
// Base: Episode 1 v1, "Do Not Look at the Moon". 81 s portrait short in pixelated
// low-poly 3D (180x320 rendered, 6x nearest upscale) with a light tape look.
// The picture carries the story; the broadcast voice only confirms it:
//   alert on TV -> neighbours shut their curtains -> a photo from Mark -> Mark is in
//   the yard staring east -> the door opens -> he is in the doorway -> the light
//   over the rooftops -> he is standing behind her -> the TV dies but the voice goes
//   on, now outside -> a head's shadow on the glowing curtains -> black.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep01-moon-v2-timeline.json';
import {rng} from '../ps1';
import {FATHER, House, Human, MatsProvider, MOTHER, NEIGHBOUR, NotMoon, Outside, Pose, SNAP6, useM} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep01ViralConfig = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => x * x * (3 - 2 * x);
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const sm = (t: number, a: number, b: number, v0 = 0, v1 = 1) => v0 + (v1 - v0) * ease(lin(t, a, b));
type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l])) as Record<string, {start: number; end: number; text: string}>;

// ------------------------------------------------------------------ shot list
// Each shot: start time, camera from->to (pos, look, fov, roll). Cuts are hard; moves are slow dollies.
type Shot = {id: string; t: number; from: {p: V3; l: V3}; to?: {p: V3; l: V3}; fov?: number; roll?: number; set: 'in' | 'out'};
const A_TV = {p: [0, 0.86, 0.3] as V3, l: [0, 0.84, 2.3] as V3};
const SHOTS: Shot[] = [
	{id: 'A_tv_ecu', t: 0, set: 'in', from: A_TV, to: {p: [0, 0.86, 0.4], l: [0, 0.84, 2.3]}, fov: 42},
	{id: 'B_room_wide', t: 2.3, set: 'in', from: {p: [-2.55, 2.15, 2.25], l: [0.1, 0.55, -1.0]}, to: {p: [-2.4, 2.05, 2.05], l: [0.0, 0.6, -1.0]}, fov: 62},
	{id: 'F_pov_window', t: 3.9, set: 'in', from: {p: [-0.75, 1.5, -1.6], l: [-0.6, 1.6, -20]}, to: {p: [-0.75, 1.5, -1.9], l: [-0.6, 1.6, -20]}, fov: 52},
	{id: 'G_closing', t: 6.2, set: 'in', from: {p: [-0.1, 1.35, 0.6], l: [-0.8, 1.45, -2.5]}, to: {p: [-0.2, 1.35, 0.3], l: [-0.8, 1.45, -2.5]}, fov: 54},
	{id: 'D_vcr_clock', t: 8.4, set: 'in', from: {p: [0.15, 0.47, 1.55], l: [0.15, 0.44, 2.0]}, to: {p: [0.15, 0.47, 1.6], l: [0.15, 0.44, 2.0]}, fov: 34},
	{id: 'E_mother_mcu', t: 9.8, set: 'in', from: {p: [0.75, 1.05, 1.25], l: [-0.35, 0.95, -1.2]}, to: {p: [0.68, 1.05, 1.1], l: [-0.35, 0.95, -1.2]}, fov: 46},
	{id: 'I_phone', t: 12.4, set: 'in', from: {p: [0.2, 0.82, 0.5], l: [0.2, 0.24, 0.7]}, to: {p: [0.2, 0.74, 0.55], l: [0.2, 0.24, 0.7]}, fov: 40},
	{id: 'J_mother_turn', t: 15.2, set: 'in', from: {p: [0.85, 1.05, 1.05], l: [-0.3, 0.95, -0.9]}, to: {p: [0.75, 1.05, 0.9], l: [-0.3, 0.95, -0.9]}, fov: 42},
	{id: 'K_to_backdoor', t: 17.0, set: 'in', from: {p: [1.6, 1.35, 0.05], l: [8, 1.5, 0.15]}, to: {p: [4.9, 1.45, 0.05], l: [8, 1.6, 0.15]}, fov: 50},
	{id: 'L_yard', t: 22.6, set: 'out', from: {p: [6.9, 1.0, 1.5], l: [12, 2.5, -0.6]}, to: {p: [7.3, 1.0, 1.3], l: [12, 2.6, -0.6]}, fov: 58},
	{id: 'M_handle', t: 25.6, set: 'in', from: {p: [5.05, 1.2, 1.0], l: [5.95, 1.05, 0.2]}, to: {p: [5.15, 1.18, 0.9], l: [5.95, 1.05, 0.2]}, fov: 46},
	{id: 'N_doorway_dutch', t: 28.6, set: 'in', from: {p: [-1.55, 1.12, -1.55], l: [2.1, 1.12, 0.28]}, to: {p: [-1.4, 1.12, -1.45], l: [2.1, 1.12, 0.28]}, fov: 50, roll: 0.17},
	{id: 'O_rooftops', t: 31.8, set: 'out', from: {p: [-12, 8.5, -9], l: [60, 9, -14]}, to: {p: [-9.5, 8.7, -9.6], l: [60, 10.5, -14]}, fov: 56},
	{id: 'P_behind_her', t: 35.6, set: 'in', from: {p: [0.0, 0.98, 1.45], l: [0, 1.0, -0.8]}, to: {p: [0.0, 0.98, 1.0], l: [0, 1.0, -0.8]}, fov: 44},
	{id: 'Q_tv_dies', t: 38.6, set: 'in', from: {p: [0, 0.86, 0.45], l: [0, 0.84, 2.3]}, to: {p: [0, 0.86, 0.5], l: [0, 0.84, 2.3]}, fov: 42},
	{id: 'R_dark_room', t: 39.9, set: 'in', from: {p: [1.3, 1.1, 1.0], l: [-0.8, 1.2, -2.4]}, to: {p: [1.15, 1.1, 0.8], l: [-0.8, 1.2, -2.4]}, fov: 50},
	{id: 'S_curtain_cu', t: 43.4, set: 'in', from: {p: [-0.8, 1.48, -1.0], l: [-0.8, 1.5, -2.4]}, to: {p: [-0.8, 1.48, -1.45], l: [-0.8, 1.5, -2.4]}, fov: 52},
	{id: 'Z_black', t: 46.4, set: 'in', from: {p: [0, 0, 0], l: [0, 0, 1]}},
	// the TV clicks back on: identical framing to frame 0, so the end flows into the start
	{id: 'A_loop', t: 48.2, set: 'in', from: A_TV, fov: 42},
];
const shotAt = (t: number) => {
	let i = 0;
	for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].t) i = k;
	const s = SHOTS[i];
	const end = SHOTS[i + 1]?.t ?? timeline.duration_seconds;
	return {s, k: ease(lin(t, s.t, end)), local: t - s.t};
};

// ------------------------------------------------------------------ screens (canvas textures)

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

const LOOP_ON = 48.2;
const drawTV = (g: CanvasRenderingContext2D, t0: number) => {
	const W = 128, H = 96;
	const r = rng(Math.floor(t0 * 30) + 3);
	const dead = t0 >= 39.4 && t0 < LOOP_ON;
	const rolling = t0 >= 38.8 && t0 < 39.4;
	// after the loop point the card runs on "negative" time so the last frame matches frame 0
	const t = t0 >= LOOP_ON ? t0 - timeline.duration_seconds : t0;
	if (t0 >= LOOP_ON && t0 < LOOP_ON + 0.12) {
		g.fillStyle = '#000';
		g.fillRect(0, 0, W, H);
		g.fillStyle = '#fff';
		g.fillRect(0, H / 2 - 2, W, 4);
		return;
	}
	if (dead) {
		g.fillStyle = '#000';
		g.fillRect(0, 0, W, H);
		if (t0 < 39.7) {
			g.fillStyle = '#fff';
			g.fillRect(0, H / 2 - 1, W, 2);
		}
		return;
	}
	g.fillStyle = '#0a1a6a';
	g.fillRect(0, 0, W, H);
	g.fillStyle = '#c0141a';
	g.fillRect(0, 6, W, 16);
	g.font = 'bold 10px "DejaVu Sans Mono", monospace';
	g.textAlign = 'center';
	g.fillStyle = '#fff';
	g.fillText('EMERGENCY ALERT', W / 2, 18);
	g.font = 'bold 8px "DejaVu Sans Mono", monospace';
	g.fillStyle = '#d8dcff';
	g.fillText('CIVIL AUTHORITY', W / 2, 33);
	g.font = 'bold 13px "DejaVu Sans Mono", monospace';
	g.fillStyle = ((Math.floor(t * 2) % 2) + 2) % 2 ? '#ffffff' : '#ffe680';
	g.fillText('DO NOT LOOK', W / 2, 54);
	g.fillText('AT THE MOON', W / 2, 69);
	// crawl
	g.font = 'bold 8px "DejaVu Sans Mono", monospace';
	g.textAlign = 'left';
	g.fillStyle = '#000';
	g.fillRect(0, 80, W, 12);
	g.fillStyle = '#fff';
	g.fillText('CLOSE ALL CURTAINS  *  STAY INDOORS  *  DO NOT DESCRIBE IT  *  ', W - ((((t + 3) * 24) % 380) + 380) % 380, 89);
	// tape noise on the broadcast
	const n = rolling ? 0.5 : 0.04;
	for (let i = 0; i < W * H * n * 0.06; i++) {
		g.fillStyle = r() > 0.5 ? '#ffffff' : '#000000';
		g.fillRect(Math.floor(r() * W), Math.floor(r() * H), 1 + Math.floor(r() * 3), 1);
	}
	if (rolling) {
		const off = Math.floor(((t0 - 38.8) * 140) % H);
		const img = g.getImageData(0, 0, W, H);
		g.putImageData(img, 0, off);
		g.putImageData(img, 0, off - H);
		g.fillStyle = '#000';
		g.fillRect(0, off - 3, W, 4);
	}
};

const drawPhone = (g: CanvasRenderingContext2D, t: number) => {
	const W = 32, H = 56;
	const on = t >= 12.6 && t < 14.6;
	g.fillStyle = on ? '#10141c' : '#050506';
	g.fillRect(0, 0, W, H);
	if (!on) return;
	g.fillStyle = '#e8ecf4';
	g.fillRect(2, 6, 28, 18);
	g.fillStyle = '#20242c';
	g.font = 'bold 6px "DejaVu Sans Mono", monospace';
	g.fillText('MARK', 4, 13);
	g.font = '5px "DejaVu Sans Mono", monospace';
	g.fillText('look at', 4, 19);
	g.fillText('this', 4, 23);
	// the photo thumbnail: almost pure white, a hard disc in it
	g.fillStyle = '#f4f8e8';
	g.fillRect(4, 28, 24, 18);
	g.fillStyle = '#ffffff';
	g.beginPath();
	g.arc(16, 37, 7, 0, Math.PI * 2);
	g.fill();
	// hidden detail: someone standing in the photo, lower left
	g.fillStyle = '#2a2a30';
	g.fillRect(6, 40, 2, 6);
	g.fillRect(5, 38, 4, 3);
};

const drawVCR = (g: CanvasRenderingContext2D, t: number) => {
	g.fillStyle = '#050806';
	g.fillRect(0, 0, 32, 10);
	g.font = 'bold 8px "DejaVu Sans Mono", monospace';
	g.fillStyle = '#40ff70';
	const hm = t >= 30 && t < LOOP_ON ? ['10:42', '10 42'] : ['10:39', '10 39'];
	g.fillText(Math.floor(t * 1.5) % 2 ? hm[0] : hm[1], 3, 8);
};

const drawShadow = (g: CanvasRenderingContext2D) => {
	g.clearRect(0, 0, 32, 32);
	g.fillStyle = '#000';
	g.beginPath();
	g.ellipse(18, 11, 5.5, 7, 0.55, 0, Math.PI * 2);
	g.fill();
	g.fillRect(13, 16, 6, 5);
	g.beginPath();
	g.ellipse(16, 30, 13, 10, 0, Math.PI, 0);
	g.fill();
};

// ------------------------------------------------------------------ camera, fog, lights

const Cam: React.FC<{t: number}> = ({t}) => {
	const {camera} = useThree();
	const {s, k} = shotAt(t);
	const to = s.to ?? s.from;
	const p = mix3(s.from.p, to.p, k);
	const l = mix3(s.from.l, to.l, k);
	// tiny "operator" breathing so locked-off shots still feel shot, not rendered
	const b = 0.004;
	camera.position.set(p[0] + Math.sin(t * 0.9) * b, p[1] + Math.sin(t * 1.3) * b, p[2]);
	const roll = s.roll ?? 0;
	camera.up.set(Math.sin(roll), Math.cos(roll), 0);
	camera.lookAt(...l);
	(camera as THREE.PerspectiveCamera).fov = s.fov ?? 50;
	camera.updateProjectionMatrix();
	return null;
};

const Atmos: React.FC<{t: number; out: boolean; moon: number}> = ({t, out, moon}) => {
	const {scene} = useThree();
	const bg = new THREE.Color(out ? '#060a14' : '#020204').lerp(new THREE.Color('#2a3a34'), out ? moon * 0.5 : 0);
	if (!scene.fog) scene.fog = new THREE.Fog(bg, 10, 70);
	const f = scene.fog as THREE.Fog;
	f.color.copy(bg);
	f.near = out ? 8 : 6;
	f.far = out ? 75 : 30;
	scene.background = bg;
	void t;
	return null;
};

// ------------------------------------------------------------------ the world at time t

const World: React.FC<{t: number; screen: THREE.Texture; vcr: THREE.Texture; phone: THREE.Texture; shadow: THREE.Texture}> = ({t, screen, vcr, phone, shadow}) => {
	const mm = useM();
	const {s, local} = shotAt(t);
	const out = s.set === 'out';
	const tvOn = t < 39.4 || t >= LOOP_ON + 0.12;
	const tvFlick = tvOn ? 0.75 + 0.25 * Math.sin(t * 23) * Math.sin(t * 7.1) : 0;
	const moon = sm(t, 15, 34, 0, 1); // rise of the thing in the east
	const glow = sm(t, 26, 46, 0, 1); // how much it is lighting the world
	// curtains: ours close 20.2 -> 21.9; neighbours one by one
	const ours = sm(t, 6.5, 8.0);
	const neigh = [sm(t, 4.1, 4.6), sm(t, 4.8, 5.3), sm(t, 5.5, 6.0)];
	mm.curtain.emissive.setRGB(0.55 * glow, 0.62 * glow, 0.5 * glow);
	const doorOpen = sm(t, 26.6, 28.4, 0, 0.22);

	// mother
	let mother: {pose: Pose; pos: V3} = {pose: {sit: true, yaw: -Math.PI / 2, armL: [0.5, -0.9], armR: [0.5, -0.9], head: [0, 0]}, pos: [-0.25, 0, -0.62]};
	if (t >= 2.3 && t < 3.9) mother.pose.head = [0, sm(t, 2.6, 3.4, 0, 0.12)];
	if (t >= 6.2 && t < 8.4) mother = {pose: {yaw: Math.PI / 2, armL: [sm(t, 6.2, 6.5, 0.3, 2.3), 0.3], armR: [sm(t, 6.2, 6.5, 0.3, 2.3), 0.3], head: [0, -0.15]}, pos: [-0.8, 0, -2.05]};
	if (t >= 9.8 && t < 12.4) mother.pose.head = [sm(t, 10.4, 11.2, 0, -1.0), 0.05];
	if (t >= 15.2 && t < 17) mother.pose.head = [sm(t, 15.6, 16.6, 0, 1.15), 0];
	if (t >= 28.6 && t < 39.9) mother.pose.head = [0, 0.04];
	if (t >= 39.9 && t < LOOP_ON) mother.pose.head = [sm(t, 42.0, 43.0, 0, -0.9), 0];

	// father: yard (until he comes in), doorway, behind the couch, gone
	let father: {pose: Pose; pos: V3} | null = null;
	if (t < 28.4) father = {pose: {yaw: 0, head: [0, sm(t, 23.0, 25.0, 0.25, 0.55)], armL: [0, 0], armR: [0, 0]}, pos: [9.4, 0, 0.35]};
	else if (t < 35.6) father = {pose: {yaw: Math.PI, head: [0, 0.1], armL: [0, 0], armR: [0, 0]}, pos: [3.05, 0, 0.05]};
	else if (t < 39.9) father = {pose: {yaw: -Math.PI / 2, head: [0, sm(t, 36.0, 38.4, -0.05, -0.35)], armL: [0, 0], armR: [0, 0]}, pos: [-0.25, 0, -1.25 + sm(t, 35.8, 38.4, 0, 0.12)]};

	// hidden detail: a stranger in the street, already staring east, head tilted
	const neighbour = t >= 3.9 && t < 6.2 ? {x: -3.3} : null;
	const phoneFlip = sm(t, 14.4, 14.9, 0, Math.PI);
	const handIn = t >= 13.6 && t < 15.2 ? sm(t, 13.6, 14.4, 0, 1) : 0;
	const shadowO = sm(t, 43.9, 46.0, 0, 0.7);
	const kitchenMoon = sm(t, 15, 28, 0.2, 1);
	void local;
	return (
		<>
			<Atmos t={t} out={out} moon={moon} />
			<ambientLight intensity={out ? 1.3 : 0.6} color={out ? '#5a6a9a' : '#4a5070'} />
			<hemisphereLight args={['#6a7aaa', '#1a1a22', out ? 0.7 : 0.25]} />
			{/* TV key light, flickering */}
			<pointLight position={[0, 0.95, 1.55]} intensity={tvFlick * 9} distance={8} decay={1.2} color="#8aa0ff" />
			{/* moonlight from the east: fills the yard, pours through the kitchen and later the curtains */}
			<directionalLight position={[40, 18 + moon * 20, -6]} intensity={0.45 + moon * 1.6} color="#d6ecd2" />
			<pointLight position={[7.5, 1.6, 0]} intensity={kitchenMoon * 6} distance={9} decay={1.2} color="#cfe6cc" />
			<pointLight position={[5.2, 1.9, 0]} intensity={kitchenMoon * 2.2} distance={4} color="#bcd6c0" />
			<pointLight position={[5.75, 1.25, 0.4]} intensity={t >= 25.6 && t < 28.6 ? 2.5 + doorOpen * 12 : 0} distance={1.6} color="#d8ecd2" />
			<pointLight position={[-0.8, 1.5, -2.9]} intensity={glow * 5} distance={4.5} color="#dff2dc" />
			<House curtains={ours} screen={screen} vcr={vcr} doorOpen={doorOpen} handle={sm(t, 26.0, 26.5) * (1 - sm(t, 28.2, 28.6))} />
			<Outside closed={neigh} lit={t >= 31.8 ? [false, false, false] : [true, true, true]} />
			<NotMoon rise={moon} glow={glow} />
			<Human pose={mother.pose} pos={mother.pos} look={MOTHER} face />
			{father && <Human pose={father.pose} pos={father.pos} look={FATHER} />}
			{neighbour && <Human pose={{yaw: 0, head: [0, 0.5]}} pos={[neighbour.x, 0, -14.3]} look={NEIGHBOUR} />}
			{/* phone on the coffee table */}
			<group position={[0.2, 0.255, 0.68]} rotation={[0, 0, phoneFlip]}>
				<mesh rotation={[-Math.PI / 2, 0, Math.PI]} position={[0, 0.006, 0]}>
					<planeGeometry args={[0.08, 0.14]} />
					<meshBasicMaterial map={phone} />
				</mesh>
				<mesh>
					<boxGeometry args={[0.085, 0.01, 0.145]} />
					<meshLambertMaterial color="#111" />
				</mesh>
			</group>
			{handIn > 0 && (
				<mesh position={[0.2 - (1 - handIn) * 0.4, 0.3, 0.68]}>
					<boxGeometry args={[0.1, 0.05, 0.08]} />
					<meshLambertMaterial color="#b88a6e" />
				</mesh>
			)}
			{/* a head and shoulders pressed to the other side of the curtain */}
			{shadowO > 0 && (
				<mesh position={[-0.75, 1.42, -2.33]}>
					<planeGeometry args={[0.7, 0.7]} />
					<meshBasicMaterial map={shadow} transparent opacity={shadowO} depthWrite={false} />
				</mesh>
			)}
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: captions + tape

const Overlay: React.FC<{t: number; damage: number; captions: boolean}> = ({t, damage, captions}) => {
	const cap = useRef<HTMLCanvasElement>(null);
	const noise = useRef<HTMLCanvasElement>(null);
	useLayoutEffect(() => {
		const W = 360, H = 640;
		const g = cap.current!.getContext('2d')!;
		g.clearRect(0, 0, W, H);
		const line = timeline.lines.find((l) => t >= l.start - 0.05 && t < l.end + 0.35);
		if (captions && line && t < 46.4) {
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
			const show = rows.slice(-3);
			g.font = 'bold 15px "DejaVu Sans Mono", monospace';
			g.textAlign = 'center';
			const outside = line.id === 'l08' || line.id === 'l09';
			show.forEach((r, i) => {
				const y = 470 + i * 19 - (show.length - 1) * 19;
				for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) {
					g.fillStyle = '#000';
					g.fillText(r, W / 2 + dx, y + dy);
				}
				g.fillStyle = outside ? '#cfe6cc' : '#ffffff';
				g.fillText(r, W / 2, y);
			});
			const img = g.getImageData(0, 0, W, H);
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

export const Episode01Viral: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const tv = useCanvasTex(128, 96);
	const vcr = useCanvasTex(32, 10);
	const ph = useCanvasTex(32, 56);
	const sh = useCanvasTex(32, 32);
	drawTV(tv.g, t);
	tv.t.needsUpdate = true;
	drawVCR(vcr.g, t);
	vcr.t.needsUpdate = true;
	drawPhone(ph.g, t);
	ph.t.needsUpdate = true;
	drawShadow(sh.g);
	sh.t.needsUpdate = true;
	const black = t >= 46.4 && t < LOOP_ON;
	const damage = t >= 38.6 && t < 39.9 ? 0.6 : t >= 28.6 && t < 28.8 ? 0.8 : t >= LOOP_ON && t < LOOP_ON + 0.3 ? 0.7 : 0.05;
	const ca = 0.6 + damage * 2;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="tape" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			{!black && (
				<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'url(#tape)'}}>
					<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.03, far: 600}} style={{imageRendering: 'pixelated'}}>
						<MatsProvider>
							<Cam t={t} />
							<World t={t} screen={tv.t} vcr={vcr.t} phone={ph.t} shadow={sh.t} />
						</MatsProvider>
					</ThreeCanvas>
				</div>
			)}
			{!black && <Overlay t={t} damage={damage} captions={captions} />}
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep01-moon-v2/mix.m4a')} />}
		</AbsoluteFill>
	);
};
void SNAP6;
