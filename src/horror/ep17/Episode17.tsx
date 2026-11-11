// Episode 17: "The Road That Wouldn't End" (folklore: the tikbalang). Season 2 horror standard
// (docs/production/EPISODE_PLAYBOOK.md): a dark key lit by a tricycle's single headlight, a store's
// bulb and a big moon; the creature withheld (the same store coming back, an ember in the balete, a
// tall shape in the bamboo, rain under a clear moon), then ONE clear, lit reveal: the rider stops,
// turns his handlebar toward a breath in the bamboo, and the beam finds it squatting, knees above its
// head, its long horse face lowering into the light. He turns his shirt inside out; the road lets him
// go. Dawn: the tricycle by the store, hoofprints circling it.
// Taglish narration (Juanito), Taglish captions. Portrait 1080x1920, rendered at 180x320 and
// upscaled 6x, PS1 shaders, a light tape layer.
// Viral standard: a hook on frame 0 (the headlight passing the store for the third time: "Kapag
// tatlong beses mo nang nadaanan ang parehong tindahan, huminto ka."); a seamless loop (the last 1.6
// s replay the hook's ride); hidden details (the kapre's ember in the balete on every pass; the price
// board different on every pass; rain under a clear moon, the tikbalang's wedding; hoofprints circling
// the tricycle; on the third pass, a tall figure already standing behind the store, unlit; three frames
// of the face); an open question (did you say "tabi tabi po" on your way home?).
// Care: the beliefs are wisdom that saves the rider; no comic tikbalang; the store's name is invented.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep17-road-v1-timeline.json';
import {rng} from '../ps1';
import {flicker, handheld, Tikbalang} from '../entities';
import {Balete, MatsProvider as BaleteMats} from '../ep11/world';
import {BALETE_Z, Hoofprints, Land, MatsProvider, Rain, STOP_Z, STORE, Store, TIK, Tricycle, TX} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep17Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => x * x * (3 - 2 * x);
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));

// key times, all from the real line times (scripts/ep17_sound.py reads the same rules)
export const K = {
	sub: L.l04.end + 0.3, // three frames of the face (between lines)
	rain: L.l06.start - 0.3, // rain under a clear moon
	stop: L.l08.start - 0.3, // the tricycle slows to a stop at the balete
	breath: L.l08.end + 0.5, // a deep breath in the bamboo; he turns the handlebar
	reveal: L.l08.end + 1.5, // the beam finds it (stinger in silence)
	shirt: L.l09.start - 0.25, // he turns his shirt inside out
	black: L.l09.end + 0.1,
	dawn: L.l10.start - 0.3,
	loopOn: DUR - 1.6,
};
export const STINGERS = [K.reveal];
const SUB = (t: number) => t >= K.sub && t < K.sub + 0.1;

// ------------------------------------------------------------------ shot list
type Mode = 'night' | 'black' | 'dawn';
type Pose = {p: V3; l: V3};
// rel: p and l are relative to the tricycle (x from TX, z from its position)
type Shot = {id: string; t: number; from: Pose; to?: Pose; fov?: number; mode: Mode; hand?: number; rel?: boolean; pass?: number};
const POV: {from: Pose; to: Pose} = {from: {p: [0.05, 2.0, 1.35], l: [0.9, 1.1, -9]}, to: {p: [0.05, 2.0, 1.35], l: [0.9, 1.1, -9]}};
const SHOTS: Shot[] = [
	{id: 'A_hook', t: 0, mode: 'night', rel: true, pass: 2, ...POV, fov: 56, hand: 0.25},
	{id: 'B_wide', t: L.l01.end + 0.4, mode: 'night', from: {p: [3.8, 10, -22], l: [-3, 2.5, -48]}, to: {p: [3.6, 9.6, -23.5], l: [-3, 2.5, -48]}, fov: 50},
	{id: 'C_bamboo', t: L.l03.start - 0.3, mode: 'night', from: {p: [-2.0, 1.3, -21.5], l: [4.3, 2.6, -28.5]}, to: {p: [-1.8, 1.3, -22.3], l: [4.3, 2.6, -28.5]}, fov: 50, hand: 0.3},
	{id: 'D_pass', t: L.l04.start - 0.3, mode: 'night', rel: true, from: {p: [-2.6, 1.5, 0.6], l: [0.4, 1.1, -1.2]}, to: {p: [-2.6, 1.5, 0.2], l: [0.4, 1.1, -1.6]}, fov: 54},
	{id: 'E1_store', t: L.l05.start - 0.3, mode: 'night', rel: true, pass: 0, ...POV, fov: 56, hand: 0.3},
	{id: 'E2_store', t: L.l05.start + 2.7, mode: 'night', rel: true, pass: 1, ...POV, fov: 56, hand: 0.45},
	{id: 'F_rain', t: L.l06.start - 0.3, mode: 'night', from: {p: [3.2, 1.0, -8], l: [-3, 6.5, -60]}, to: {p: [3.0, 1.0, -9], l: [-3, 6.2, -60]}, fov: 58},
	{id: 'G_balete', t: L.l07.start - 0.3, mode: 'night', from: {p: [2.0, 1.2, -33], l: [-5.5, 5.8, -45]}, to: {p: [1.8, 1.2, -34], l: [-5.5, 5.6, -45]}, fov: 56, hand: 0.25},
	{id: 'H_stop', t: K.stop, mode: 'night', from: {p: [TX + 0.6, 1.4, STOP_Z + 3.2], l: [TX - 0.3, 1.0, -56]}, to: {p: [TX + 0.5, 1.35, STOP_Z + 2.6], l: [TX + 0.4, 1.0, -56]}, fov: 54, hand: 0.35},
	{id: 'I_reveal', t: K.reveal, mode: 'night', from: {p: [TX + 0.1, 1.9, STOP_Z + 1.2], l: [TIK[0], 2.0, TIK[2]]}, to: {p: [TX + 0.25, 1.85, STOP_Z + 0.4], l: [TIK[0], 1.9, TIK[2]]}, fov: 40, hand: 0.35},
	{id: 'J_shirt', t: K.shirt, mode: 'night', from: {p: [TX - 1.7, 1.55, STOP_Z - 2.4], l: [TX, 1.45, STOP_Z + 0.2]}, to: {p: [TX - 1.5, 1.5, STOP_Z - 2.0], l: [TX, 1.45, STOP_Z + 0.2]}, fov: 52, hand: 0.3},
	{id: 'K_black', t: K.black, mode: 'black', from: {p: [0, 1, 0], l: [0, 1, -1]}},
	{id: 'L_dawn', t: K.dawn, mode: 'dawn', from: {p: [-2.6, 3.4, -9.5], l: [TX + 0.3, 0.2, -17.5]}, to: {p: [-2.2, 3.1, -10.5], l: [TX + 0.3, 0.2, -17.5]}, fov: 52},
	{id: 'A_loop', t: K.loopOn, mode: 'night', rel: true, pass: 2, ...POV, fov: 56, hand: 0.25},
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

/** Where the tricycle is along the road (its z) in each shot. */
const triZ = (t: number, id: string, u: number) => {
	const S = (n: string) => SHOTS.find((x) => x.id === n)!.t;
	if (id.startsWith('A_')) return -6 - (u + 1.6) * 2.6;
	if (id === 'B_wide') return -29.4 - (t - S('B_wide')) * 2.6;
	if (id === 'D_pass') return -52 - (t - S('D_pass')) * 9;
	if (id === 'E1_store') return -6 - (t - S('E1_store')) * 6;
	if (id === 'E2_store') return -6 - (t - S('E2_store')) * 7.5;
	if (id === 'F_rain') return -12 - (t - S('F_rain')) * 3.6;
	if (id === 'G_balete') return -28 - lin(t, S('G_balete'), K.stop) * 7.5;
	if (id === 'H_stop') return STOP_Z + 2.5 * (1 - ease(lin(t, K.stop, K.stop + 1.4)));
	if (id === 'L_dawn') return -17.5;
	return STOP_Z;
};

const camPose = (t: number) => {
	const r0 = shotAt(t);
	const sub = SUB(t);
	const s = sub ? SHOTS.find((x) => x.id === 'I_reveal')! : r0.s;
	const k = sub ? 0.5 : r0.k;
	const u = r0.u;
	const z = sub ? STOP_Z : triZ(t, s.id, u);
	const to = s.to ?? s.from;
	let p = mix3(s.from.p, to.p, k);
	let l = mix3(s.from.l, to.l, k);
	if (s.rel) {
		p = [TX + p[0], p[1], z + p[2]];
		l = [TX + l[0], l[1], z + l[2]];
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
	return {s, k, u, p, l, roll, sub, z};
};

const Cam: React.FC<{t: number}> = ({t}) => {
	const {camera} = useThree();
	const {s, p, l, roll} = camPose(t);
	camera.position.set(...p);
	camera.up.set(Math.sin(roll), Math.cos(roll), 0);
	camera.lookAt(...l);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = s.fov ?? 55;
	c.near = 0.03;
	c.far = 900;
	camera.updateProjectionMatrix();
	return null;
};

const FOG: Record<Mode, [string, number, number]> = {night: ['#070a12', 10, 75], black: ['#000000', 0.1, 0.2], dawn: ['#b8aca0', 12, 140]};
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

/** The headlight: a spotlight from the tricycle's lamp; aim swings when he turns the handlebar. */
const Headlight: React.FC<{z: number; aim: V3; on: number}> = ({z, aim, on}) => {
	const light = React.useMemo(() => new THREE.SpotLight('#fff0d0', 12, 45, 0.42, 0.5, 1), []);
	light.position.set(TX, 1.08, z - 0.85);
	light.target.position.set(...aim);
	light.intensity = 22 * on;
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
	const {s, sub, z} = camPose(t);
	const mode = s.mode;
	if (mode === 'black') return <Atmos mode="black" />;
	const night = mode === 'night';
	const pass = s.pass ?? 2;
	const bulb = s.id === 'E2_store' ? flicker(t, 17, 11, 0.9) : 1;
	// the handlebar turns toward the breath: the beam swings from the road onto the bamboo where it squats
	const turn = s.id === 'I_reveal' || sub ? 1 : s.id === 'H_stop' ? ease(lin(t, K.breath, K.reveal)) : 0;
	const aim: V3 = mix3([TX - 0.2, 0, z - 18], [TIK[0], 1.6, TIK[2]], turn);
	const tik = s.id === 'I_reveal' || sub;
	const lower = sub ? 1 : ease(lin(t, K.reveal + 0.1, K.reveal + 1.3));
	const rain = t >= K.rain && t < K.stop + 0.5 ? lin(t, K.rain, K.rain + 2) : 0;
	const moving = !['H_stop', 'I_reveal', 'J_shirt', 'L_dawn'].includes(s.id) || (s.id === 'H_stop' && t < K.stop + 1.4);
	const shirt: 'on' | 'off' | 'in' = s.id === 'J_shirt' ? (t < L.l09.start + 2.2 ? 'off' : 'in') : 'on';
	const showTri = s.id !== 'C_bamboo';
	return (
		<>
			<Atmos mode={mode} />
			{night && (
				<>
					<ambientLight intensity={3.6} color="#3e4a6a" />
					<directionalLight position={[-120, 120, -260]} intensity={3.0} color="#a8b4d0" />
					{tik && <pointLight position={[TIK[0] - 1.6, 1.6, TIK[2] + 3]} intensity={3 * Math.min(1, lin(t, K.reveal - 0.05, K.reveal) + (sub ? 1 : 0))} distance={7} decay={1.0} color="#fff0d0" />}
					{showTri && <Headlight z={z} aim={aim} on={1} />}
					{bulb > 0.5 && <pointLight position={[STORE[0] - 0.6, 2.6, STORE[2]]} intensity={7} distance={9} decay={1.0} color="#ffc880" />}
					{s.id === 'J_shirt' && <pointLight position={[TX - 0.6, 1.6, STOP_Z - 1.4]} intensity={1.2} distance={3} decay={1.0} color="#fff0d0" />}
				</>
			)}
			{mode === 'dawn' && (
				<>
					<ambientLight intensity={1.6} color="#9a948c" />
					<directionalLight position={[60, 20, -40]} intensity={1.1} color="#ffd8b0" />
				</>
			)}
			<MatsProvider>
				<Land t={t} dawn={mode === 'dawn'} ember={night} />
				<Store
					pass={mode === 'dawn' ? 0 : pass}
					bulb={mode === 'dawn' ? 0 : bulb}
					figure={s.id.startsWith('A_') ? <Tikbalang t={t} pose="stand" position={[4.2, 0, 1.6]} rotation={[0, -Math.PI / 2, 0]} /> : null}
				/>
				{showTri && <Tricycle t={t} z={z} lamp={mode === 'dawn' ? 0 : 1} moving={moving && night} rider={mode !== 'dawn'} shirt={shirt} />}
				{mode === 'dawn' && <Hoofprints z={-17.5} />}
				<Rain t={t} at={[TX, 0, z - 3]} amount={rain} />
			</MatsProvider>
			<BaleteMats>
				<group scale={[-1, 1, 1]}>
					<Balete z={BALETE_Z} x={6.6} />
				</group>
			</BaleteMats>
			{s.id === 'C_bamboo' && <pointLight position={[7.5, 3.5, -31]} intensity={5} distance={7} decay={1.0} color="#8a9ac8" />}
			{s.id === 'C_bamboo' && <Tikbalang t={t} pose="stand" position={[4.3, 0, -28.5]} rotation={[0, -Math.PI / 2, 0]} />}
			{tik && <Tikbalang t={t} pose="squat" lower={lower} position={TIK} rotation={[0, -Math.PI / 2 + 0.35, 0]} />}
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

const darkGrade = (t: number) => (t >= K.reveal && t < K.reveal + 1.2 ? 0.0 : 0.05);

// ------------------------------------------------------------------ assembly
export const Episode17: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
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
				<filter id="tape17" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: shift, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'url(#tape17)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 55, near: 0.03, far: 900}} style={{imageRendering: 'pixelated'}}>
					<Cam t={t} />
					<World t={t} />
				</ThreeCanvas>
			</div>
			<AbsoluteFill style={{background: `rgba(6,10,18,${g})`}} />
			<Overlay t={t} damage={damage} captions={captions} />
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep17-road-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
