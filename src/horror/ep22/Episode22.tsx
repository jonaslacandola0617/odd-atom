// Episode 22: "Eighty-Eight Years" (Season 3, a real reported case: the Okiku doll, Mannenji temple,
// Iwamizawa, Hokkaido). Season 3 rule: no shared template. This one is a TIME-LAPSE from one fixed
// position: a camera on the temple's altar, one frame a year, 1938 to now.
// Scare mechanism: none in the usual sense. Nothing jumps. Her hair grows, is trimmed once, grows
// back; and over the whole episode her head turns, a little a year, from the wall to the lens, until
// she is looking at you over her shoulder. The narration only points at it at the end.
// Sound: one instrument: a temple bell, struck in the gaps, and silence (scripts/ep22_sound.py).
// Hidden details: the trim year (scissors and a cut lock on the altar); a visitor's photograph on the
// pillar in which she is already facing the camera, years before she does; candlelight in her eyes
// only at the end; breath on the INSIDE of the glass in the last seconds.
// Care: the girl the doll is named after is never shown; her death is one gentle line; the skeptics'
// explanation is in the narration. An original doll design.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep22-okiku-v1-timeline.json';
import {rng} from '../ps1';
import {Altar, Doll, HEAD_Y, MatsProvider} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep22Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));

// key times (scripts/ep22_sound.py uses the same rules): the bell is struck just after lines 1-7
export const BELLS = ['l01', 'l02', 'l03', 'l04', 'l05', 'l06', 'l07'].map((id) => L[id].end + 0.35);
// the years: held at 1938 until the first bell, then running; anchors at each bell; the present at line 9
const YEARS: [number, number][] = [[0, 1938], [BELLS[0], 1938], [BELLS[1], 1949], [BELLS[2], 1961], [BELLS[3], 1974], [BELLS[4], 1988], [BELLS[5], 2001], [BELLS[6], 2014], [L.l09.start, 2026]];
export const yearAt = (t: number) => Math.floor(interpolate(t, YEARS.map((y) => y[0]), YEARS.map((y) => y[1]), cl));
export const K = {
	trim: 1980,
	photo: 1976,
	fog: [L.l09.end + 0.4, DUR - 0.25],
};
// hair below the ear line (m): a bob in 1938, past the shoulders by 1979, trimmed in 1980, longer than ever now
const hairAt = (y: number) => (y < K.trim ? interpolate(y, [1938, 1979], [0.045, 0.17], cl) : interpolate(y, [1980, 2026], [0.06, 0.25], cl));
// her head: turned away towards the wall at the start, over her shoulder at the lens at the end
const headAt = (t: number) => interpolate(t, [0, BELLS[0], L.l09.start], [-0.75, -0.72, Math.PI / 2], cl);

// one fixed camera on a small tripod on the floor in front of the altar; it is set up again each year
// (a few millimetres off), as a once-a-year photograph would be
const Cam: React.FC<{year: number}> = ({year}) => {
	const {camera} = useThree();
	const r = rng(year * 17 + 3);
	const j = year === 1938 || year >= 2026 ? 0 : 1;
	camera.position.set((r() - 0.5) * 0.006 * j, 1.1 + (r() - 0.5) * 0.004 * j, 1.18);
	camera.up.set(0, 1, 0);
	camera.lookAt(0, 1.06, 0);
	const c = camera as THREE.PerspectiveCamera;
	c.fov = 40;
	c.near = 0.03;
	c.far = 20;
	camera.updateProjectionMatrix();
	return null;
};

const Atmos: React.FC = () => {
	const {scene} = useThree();
	const bg = new THREE.Color('#020202');
	if (!scene.fog) scene.fog = new THREE.Fog(bg, 1.6, 4);
	scene.background = bg;
	return null;
};

const World: React.FC<{t: number}> = ({t}) => {
	const year = yearAt(t);
	const r = rng(year * 7 + 1);
	const winter = r() < 0.5; // snow light through a window off to the left, some years
	const fog = interpolate(t, [K.fog[0], K.fog[0] + 0.5, K.fog[1] - 0.6, K.fog[1]], [0, 1, 0.8, 0], cl);
	const glint = interpolate(t, [L.l08.end, L.l09.start + 0.5], [0, 1], cl);
	return (
		<>
			<Cam year={year} />
			<Atmos />
			<ambientLight intensity={0.35} color="#2a2430" />
			{/* candlelight from below (the two candles), a little different every year */}
			<pointLight position={[-0.3, 1.0, 0.12]} intensity={(0.9 + r() * 0.3) * 1.0} distance={1.6} decay={1.4} color="#ffb060" />
			<pointLight position={[0.3, 1.0, 0.12]} intensity={(0.9 + r() * 0.3) * 1.0} distance={1.6} decay={1.4} color="#ffb060" />
			{/* the candles' glow on the altar cloth below */}
			<pointLight position={[0, 0.78, 0.55]} intensity={0.35} distance={0.9} decay={1.5} color="#ff9a50" />
			{/* moon or snow light through a window off to the left */}
			<directionalLight position={[-2, 1.6, 0.6]} intensity={winter ? 0.35 : 0.15} color="#8aa0d0" />
			<MatsProvider>
				<Altar year={year} scissors={year === K.trim} photo={year >= K.photo} fog={fog} t={t}>
					<Doll head={headAt(t)} hair={hairAt(year)} glint={glint} t={t} />
				</Altar>
			</MatsProvider>
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: the year, captions, film grain
const Overlay: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
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
		// the year, like a date stamp burned into a photograph
		g.font = 'bold 16px "DejaVu Sans Mono", monospace';
		out(String(yearAt(t)), 30, 40, '#ff9a3a', 'left');
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
			show.forEach((r, i) => out(r, CW / 2, 486 + i * 19 - (show.length - 1) * 19, '#ffffff'));
		}
		const img = g.getImageData(0, 0, CW, CH);
		for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 120 ? 255 : 0;
		g.putImageData(img, 0, 0);
		// grain changes once a year (each year is one photograph), plus a little per frame
		const n = noise.current!.getContext('2d')!;
		const ni = n.createImageData(LW, LH);
		const r = rng(yearAt(t) * 7919 + Math.floor(t * 30) * 13 + 22);
		for (let i = 0; i < LW * LH; i++) {
			const v = r() * 255;
			ni.data[i * 4] = ni.data[i * 4 + 1] = ni.data[i * 4 + 2] = v;
			ni.data[i * 4 + 3] = 18 * (r() < 0.5 ? 1 : 0.4);
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
export const Episode22: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const year = yearAt(t);
	// a faint exposure difference from one year's photograph to the next
	const ex = 1 + (rng(year * 3 + 9)() - 0.5) * 0.12;
	const ca = 0.6;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="tape22" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: `url(#tape22) brightness(${ex}) sepia(0.15) contrast(1.05)`}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 44, near: 0.03, far: 20}} style={{imageRendering: 'pixelated'}}>
					<World t={t} />
				</ThreeCanvas>
			</div>
			<Overlay t={t} captions={captions} />
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.88) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep22-okiku-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
export const HEAD = HEAD_Y;
