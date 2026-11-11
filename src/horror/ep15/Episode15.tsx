// Episode 15: "Don't Pick Up the Baby" (folklore: the tiyanak). Season 2 horror standard
// (docs/production/EPISODE_PLAYBOOK.md): a dark key lit by a jeepney's headlights, a moon and one
// fluorescent tube; the creature withheld (a white bundle crying in the cogon grass, its point of
// view as the driver walks to it, the weight in his arms, the crying stopping), then ONE clear, lit
// reveal: in held silence the lampin falls open under the tube on an old, wrinkled face with black
// eyes and a mouth too full of teeth; the tube goes out. Morning: the jeepney empty, its back open,
// the tsinelas on the step, the shirt on the bench turned inside out.
// Taglish narration (Juanito), Taglish captions. Portrait 1080x1920, rendered at 180x320 and
// upscaled 6x, PS1 shaders, a light tape layer.
// Viral standard: a hook on frame 0 (the bundle in the grass, headlights coming: "Sa madilim na
// daan, kapag may narinig kang umiiyak na sanggol sa damuhan, huwag kang hihinto."); a seamless loop
// (the last 1.6 s replay the hook's move); hidden details (LAST TRIP on the signboard; a faint cry
// under the hook from frame 0; old rotted lampins where it lies; small handprints on the windshield
// in the morning; the shirt inside out; a second bundle in the grass down the road; three frames of
// the face between lines); an open question (did he remember in time?).
// Care: folklore, told with respect: the tiyanak is a creature, not a real infant; no harm to a
// baby is shown or implied; no abortion framing and no mother is blamed; the driver is a decent man
// who stops to help; what happened to him is never shown.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep15-baby-v1-timeline.json';
import {rng} from '../ps1';
import {flicker, handheld, Tiyanak} from '../entities';
import {BUNDLE, BUNDLE2, Driver, Glare, J, JeepState, Jeepney, JX, Land, MatsProvider, OldCloths, ShirtInsideOut, Tsinelas} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep15Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => x * x * (3 - 2 * x);
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));

// key times, all from the real line times (scripts/ep15_sound.py reads the same rules)
export const K = {
	cryStop: L.l06.start - 0.25, // the crying stops, just before "At tumitigil ang iyak."
	flick: L.l06.end + 0.15, // the tube flickers
	open: L.l06.end + 1.15, // the lampin's flap slips back
	reveal: L.l06.end + 1.55, // the face, lit by the tube (stinger in silence)
	out: L.l07.start - 0.45, // the tube and the headlights go out: black
	sub: L.l04.end + 0.3, // three frames of the face (between lines)
	walk: L.l04.start - 0.1, // the driver steps down and walks to it
	loopOn: DUR - 1.6,
};
export const STINGERS = [K.reveal];
const SUB = (t: number) => t >= K.sub && t < K.sub + 0.1;

// ------------------------------------------------------------------ shot list
type Mode = 'night' | 'inside' | 'black' | 'dark' | 'morning';
type Pose = {p: V3; l: V3};
// rel: p (and l if lrel) are in the jeepney's frame and move with it
type Shot = {id: string; t: number; from: Pose; to?: Pose; fov?: number; mode: Mode; hand?: number; rel?: boolean; lrel?: boolean};
const A: {from: Pose; to: Pose} = {from: {p: [4.85, 0.88, -8.25], l: [3.9, -1.2, -4.5]}, to: {p: [4.8, 0.84, -8.12], l: [3.9, -1.2, -4.5]}};
const FACE: V3 = [-0.36, 1.37, 1.3];
const REVEAL: {from: Pose; to: Pose} = {from: {p: [-0.37, 1.86, 1.06], l: FACE}, to: {p: [-0.365, 1.76, 1.13], l: FACE}};
const tC2 = L.l03.start + 3.6;
const SHOTS: Shot[] = [
	{id: 'A_hook', t: 0, mode: 'night', ...A, fov: 62, hand: 0.35},
	{id: 'B_road', t: L.l01.end + 0.3, mode: 'night', from: {p: [-2.7, 1.05, 4.5], l: [1.5, 1.6, 20]}, to: {p: [-2.75, 1.0, 4.2], l: [1.5, 1.6, 18]}, fov: 34},
	{id: 'C1_cab', t: L.l03.start - 0.3, mode: 'night', rel: true, from: {p: [-0.42, 1.72, -1.15], l: BUNDLE}, to: {p: [-0.4, 1.7, -1.2], l: BUNDLE}, fov: 50, hand: 0.25},
	{id: 'C2_bundle', t: tC2, mode: 'night', from: {p: [3.85, 0.5, -6.2], l: [4.42, 0.08, -7.3]}, to: {p: [3.95, 0.45, -6.4], l: [4.42, 0.08, -7.3]}, fov: 48, hand: 0.3},
	{id: 'D_pov', t: L.l04.start - 0.35, mode: 'night', from: {p: [4.45, 0.62, -7.5], l: [3.2, 1.2, -4.2]}, to: {p: [4.45, 0.6, -7.5], l: [3.7, 1.35, -5.4]}, fov: 54, hand: 0.15},
	{id: 'E_hold', t: L.l05.start - 0.4, mode: 'inside', rel: true, lrel: true, from: {p: [0.55, 1.62, 2.85], l: [-0.5, 1.3, 1.1]}, to: {p: [0.48, 1.58, 2.5], l: [-0.48, 1.28, 1.1]}, fov: 52, hand: 0.4},
	{id: 'F_stop', t: L.l06.start - 0.3, mode: 'inside', rel: true, lrel: true, from: {p: [0.5, 1.6, 1.9], l: [-0.4, 1.3, 1.2]}, to: {p: [0.42, 1.56, 1.75], l: [-0.4, 1.3, 1.22]}, fov: 50, hand: 0.3},
	{id: 'I_reveal', t: K.reveal, mode: 'inside', rel: true, lrel: true, ...REVEAL, fov: 52, hand: 0.3},
	{id: 'J_black', t: K.out, mode: 'black', from: {p: [0, 1, 0], l: [0, 1, -1]}},
	{id: 'G_dark', t: L.l07.start + 0.4, mode: 'dark', from: {p: [-3.4, 1.3, 4.6], l: [1.5, 1.35, -0.4]}, to: {p: [-3.05, 1.28, 3.7], l: [1.5, 1.35, -0.4]}, fov: 46, hand: 0.25},
	{id: 'H_nest', t: L.l07.start + 4.4, mode: 'dark', from: {p: [5.1, 1.0, -8.0], l: [4.35, 0.0, -7.0]}, to: {p: [4.95, 0.85, -7.8], l: [4.35, 0.0, -7.0]}, fov: 50, hand: 0.25},
	{id: 'K_morning', t: L.l08.start - 0.35, mode: 'morning', from: {p: [2.7, 1.05, 7.6], l: [1.5, 0.75, 3.0]}, to: {p: [2.3, 0.95, 6.3], l: [1.5, 0.7, 3.0]}, fov: 50},
	{id: 'L_shirt', t: L.l09.start - 0.3, mode: 'morning', rel: true, lrel: true, from: {p: [0.3, 1.85, 2.45], l: [-0.68, 1.04, 1.6]}, to: {p: [0.22, 1.78, 2.3], l: [-0.68, 1.04, 1.6]}, fov: 50},
	{id: 'M_day', t: L.l10.start - 0.35, mode: 'morning', from: {p: [2.9, 1.75, -6.4], l: [0.9, 1.35, -1.0]}, to: {p: [2.6, 1.7, -5.7], l: [0.9, 1.35, -1.0]}, fov: 50},
	{id: 'A_loop', t: K.loopOn, mode: 'night', ...A, fov: 62, hand: 0.35},
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

/** Where the jeepney is (its centre z): coming down the road, slowing, stopped. */
const jzAt = (t: number, id: string, u: number) => {
	if (id.startsWith('A_')) return 72 - (u + 1.6) * 4.2;
	if (id === 'B_road') return 30 - (t - SHOTS[1].t) * 3.6;
	if (id === 'C1_cab') {
		const x = lin(t, SHOTS[2].t, tC2);
		return 1.2 + 9.8 * (1 - x) * (1 - x);
	}
	if (id === 'C2_bundle') return 1.2 * (1 - ease(lin(t, tC2, tC2 + 2.5)));
	return 0;
};

const camPose = (t: number) => {
	const r0 = shotAt(t);
	const sub = SUB(t);
	const s = sub ? SHOTS.find((x) => x.id === 'I_reveal')! : r0.s;
	const k = sub ? 0.3 : r0.k;
	const u = r0.u;
	const jz = sub ? 0 : jzAt(t, s.id, u);
	const to = s.to ?? s.from;
	let p = mix3(s.from.p, to.p, k);
	let l = mix3(s.from.l, to.l, k);
	if (s.rel) p = J(jz, ...p);
	if (s.lrel) l = J(jz, ...l);
	let roll = 0;
	if (s.hand) {
		const h = handheld(u, s.hand);
		p[0] += h.dp[0];
		p[1] += h.dp[1];
		p[2] += h.dp[2];
		roll = h.roll;
	}
	const jolt = STINGERS.reduce((a, kt) => a + (t >= kt && t < kt + 0.3 ? Math.sin((t - kt) * 60) * 0.012 * (1 - (t - kt) / 0.3) : 0), 0);
	p[1] += jolt;
	return {s, k, u, p, l, roll, sub, jz};
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

const FOG: Record<Mode, [string, number, number]> = {night: ['#06080c', 12, 110], inside: ['#06080c', 10, 80], black: ['#000000', 0.1, 0.2], dark: ['#05070a', 8, 80], morning: ['#9ea2a6', 10, 160]};
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

/** The headlights: one spotlight from the jeepney's front, down the road and into the right-hand grass. */
const Headlights: React.FC<{jz: number}> = ({jz}) => {
	const light = React.useMemo(() => new THREE.SpotLight('#fff0d0', 10, 70, 0.5, 0.55, 1), []);
	light.position.set(...J(jz, 0.6, 0.9, -3.05));
	light.target.position.set(...J(jz, 1.6, 0, -18));
	light.intensity = 14;
	light.target.updateMatrixWorld();
	return (
		<>
			<primitive object={light} />
			<primitive object={light.target} />
		</>
	);
};

// ------------------------------------------------------------------ the world at time t
const World: React.FC<{t: number}> = ({t}) => {
	const {s, sub, jz} = camPose(t);
	const mode = s.mode;
	if (mode === 'black') return <Atmos mode="black" />;
	const night = mode === 'night' || mode === 'inside';
	// the tube: on once he sits with it; flickers after the crying stops; out at K.out
	let tube = mode === 'inside' ? 1 : 0;
	if (mode === 'inside' && t >= K.flick && t < K.reveal) tube = flicker(t, 15, 12, 0.9);
	if (mode === 'inside' && t >= K.reveal) tube = 1;
	const reveal = s.id === 'I_reveal' || sub;
	const opened = reveal ? 1 : s.id === 'F_stop' ? ease(lin(t, K.open, K.open + 0.35)) : 0;
	const cry = t < K.cryStop && !reveal ? 1 : 0;
	const sag = s.id === 'E_hold' ? ease(lin(t, L.l05.start, L.l05.end)) : s.id === 'F_stop' || reveal ? 1 : 0;
	const st: JeepState = {jz, head: night, tube, tail: night, hands: mode === 'morning', rosary: s.id === 'C1_cab' ? 1 : 0.3};
	const holding = s.id === 'E_hold' || s.id === 'F_stop' || reveal;
	const walkK = lin(t, K.walk, L.l04.end + 0.25);
	const driverP: V3 = [2.6 + walkK * 1.55, 0, -2.4 - walkK * 4.0];
	const eyesZ = 2.2 - lin(t, SHOTS[9].t, SHOTS[10].t) * 2.4;
	return (
		<>
			<Atmos mode={mode} />
			{night && (
				<>
					<ambientLight intensity={1.6} color="#34405a" />
					<directionalLight position={[-30, 50, 40]} intensity={1.5} color="#8a9ac0" />
					<Headlights jz={jz} />
					{/* the tube, and a faint green dashboard glow */}
					{tube > 0.05 && <pointLight position={J(jz, 0, 1.98, 0.9)} intensity={3.2 * tube} distance={5} decay={1.2} color="#dcecff" />}
					{s.id === 'C1_cab' && <pointLight position={J(jz, -0.2, 1.3, -1.6)} intensity={0.12} distance={1.2} decay={1.0} color="#6aff9a" />}
				</>
			)}
			{mode === 'dark' && (
				<>
					<ambientLight intensity={1.6} color="#303c54" />
					<directionalLight position={[-30, 50, 40]} intensity={1.6} color="#8a9ac0" />
				</>
			)}
			{mode === 'morning' && (
				<>
					<ambientLight intensity={1.6} color="#8a909c" />
					<directionalLight position={[40, 15, -60]} intensity={1.0} color="#ffe0c0" />
				</>
			)}
			<MatsProvider>
				<Land t={t} dawn={mode === 'morning'} />
				<Jeepney t={t} st={st} />
				{(s.id === 'A_hook' || s.id === 'A_loop' || s.id === 'B_road') && <Glare jz={jz} size={s.id === 'B_road' ? 0.2 : 0.35} />}
				{s.id === 'D_pov' && <Glare jz={jz} size={0.5} halo />}
				{/* the bundle in the grass, until he picks it up */}
				{['A_hook', 'A_loop', 'B_road', 'C1_cab', 'C2_bundle'].includes(s.id) && <Tiyanak t={t} cry={cry} hand position={BUNDLE} rotation={[0, 0.5, 0]} />}
				{s.id === 'D_pov' && <Driver t={t} pose="walk" position={driverP} rotation={[0, 2.77, 0]} />}
				{holding && (
					<Driver t={t} pose="sit" sag={sag} head={!reveal} position={J(jz, -0.68, 1.03, 1.1)} rotation={[0, Math.PI / 2, 0]}>
						<Tiyanak t={t} cry={cry * 0.6} open={opened} grin={reveal ? 0.35 + lin(t, K.reveal, K.out) * 0.6 : 0.3} rotation={[0, Math.PI / 2, 0]} position={[0, 0.02, 0]} scale={0.8} />
					</Driver>
				)}
				{s.id === 'H_nest' && <OldCloths />}
				{s.id === 'G_dark' &&
					[-0.06, 0.06].map((dx) => (
						<mesh key={dx} position={[JX - 0.2 + dx, 1.5, eyesZ]}>
							<boxGeometry args={[0.035, 0.035, 0.035]} />
							<meshBasicMaterial color="#e8d080" />
						</mesh>
					))}
				{mode === 'morning' && (
					<>
						<Tsinelas position={J(0, 0.05, 0.39, 3.1)} rotation={[0, 0.3, 0]} />
						<ShirtInsideOut position={J(0, -0.7, 1.04, 1.6)} rotation={[0, 0.2, 0]} />
						<Tiyanak t={t} position={BUNDLE2} rotation={[0, -0.8, 0]} scale={1.3} />
					</>
				)}
			</MatsProvider>
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: captions, tape
const Overlay: React.FC<{t: number; damage: number; captions: boolean}> = ({t, damage, captions}) => {
	const cap = useRef<HTMLCanvasElement>(null);
	const noise = useRef<HTMLCanvasElement>(null);
	useLayoutEffect(() => {
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
	}, [t, damage, captions]);
	return (
		<>
			<canvas ref={noise} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={cap} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

const darkGrade = (t: number) => (t >= K.reveal && t < K.out ? 0.0 : 0.05);

// ------------------------------------------------------------------ assembly
export const Episode15: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const sub = SUB(t);
	const hit = STINGERS.reduce((a, kt) => Math.max(a, t >= kt && t < kt + 0.4 ? 1 - (t - kt) / 0.4 : 0), 0) + (sub ? 0.7 : 0);
	const damage = 0.05 + hit * 0.6;
	const ca = 0.6 + damage * 3;
	const shift = hit > 0.5 ? Math.round(Math.sin(t * 90) * 3) : 0;
	const g = darkGrade(t);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="tape15" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: shift, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'url(#tape15)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 55, near: 0.02, far: 900}} style={{imageRendering: 'pixelated'}}>
					<Cam t={t} />
					<World t={t} />
				</ThreeCanvas>
			</div>
			<AbsoluteFill style={{background: `rgba(6,10,18,${g})`}} />
			<Overlay t={t} damage={damage} captions={captions} />
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep15-baby-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
