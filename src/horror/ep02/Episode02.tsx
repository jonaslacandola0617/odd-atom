// Episode 2: "The Mask on Channel 11" (true story: the Chicago broadcast signal
// intrusions of 22 November 1987). 58.7 s portrait short, pixelated low-poly 3D
// (180x320 rendered, 6x nearest upscale), PS1 shaders and a light tape layer.
// Viral standard: second-person hook on frame 0 (the mask is already on your TV),
// seamless loop (the static at the end resolves into the frame-0 mask), hidden
// rewatch details (VCR REC light taping CH09 then CH11; the listing with 11:00
// circled; the wall clock at the real times 9:14 and 11:15; a 2-frame mask in the
// final static) and an open question (who was under the mask?).
// The picture tells the story; the archive voice only confirms it:
//   the mask on a CRT -> Chicago, the tower -> a man watching the Sunday sports ->
//   black, the mask, a buzz -> he leans in -> master control throws the switch ->
//   the anchor is back (the VCR was recording) -> the tower, two hours later ->
//   11:15, the listing -> a sci-fi show -> black, the mask, now with sound and a
//   soda can -> the man stands and backs away -> the transmitter room: nobody on
//   duty -> the mask bends out of frame and a hand swings a flyswatter in from off
//   screen -> static -> the tower through the blinds -> the empty armchair ->
//   push into the static -> the mask (loop).
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep02-mask-v1-timeline.json';
import {rng} from '../ps1';
import {Human, Pose} from '../ep01/world';
import {Apartment, City, ENGINEER, MasterControl, MatsProvider, MC_X, TOWER, TOWER_TOP, TransmitterRoom, TX_X, VIEWER} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
const DUR = timeline.duration_seconds;
export const ep02Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => x * x * (3 - 2 * x);
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const sm = (t: number, a: number, b: number, v0 = 0, v1 = 1) => v0 + (v1 - v0) * ease(lin(t, a, b));
type V3 = [number, number, number];
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

// ------------------------------------------------------------------ key times (seconds)
export const K = {
	sportsOff: 10.5, // the sports report cuts to black
	mask1: 10.9, // first intrusion (silent, a buzz)
	lever: 17.55, // master control throws the switch
	mask1End: 17.9,
	tvShow: 25.4, // two hours later: the sci-fi show on channel 11
	black2: 29.1,
	mask2: 29.5, // second intrusion, with sound
	canUp: 32.6,
	canDown: 34.8,
	swat: 39.6, // he bends out of frame; a hand with a flyswatter from off screen
	staticOn: 43.6,
	sub: 55.3, // hidden: a two-frame mask inside the static
	loopOn: DUR - 0.6, // the static resolves into the frame-0 mask
};

// ------------------------------------------------------------------ shot list
type Shot = {id: string; t: number; from: {p: V3; l: V3}; to?: {p: V3; l: V3}; fov?: number; roll?: number; set: 'apt' | 'city' | 'mc' | 'tx'};
const A_TV = {p: [0, 0.89, 0.12] as V3, l: [0, 0.89, 2.0] as V3};
const WIDE_BEHIND = {p: [-0.8, 1.58, -2.35] as V3, l: [0.1, 0.92, 2.0] as V3};
const SHOTS: Shot[] = [
	{id: 'A_tv_mask_hook', t: 0, set: 'apt', from: A_TV, to: {p: [0, 0.89, 0.24], l: [0, 0.89, 2.0]}, fov: 42},
	{id: 'B_city_tower', t: 4.4, set: 'city', from: {p: [10, 34, -40], l: [220, 150, 10]}, to: {p: [16, 35, -38], l: [220, 156, 10]}, fov: 40},
	{id: 'C_room_wide', t: 6.9, set: 'apt', from: WIDE_BEHIND, to: {p: [-0.76, 1.56, -2.15], l: [0.1, 0.92, 2.0]}, fov: 58},
	{id: 'D_over_shoulder', t: 9.9, set: 'apt', from: {p: [0.38, 1.06, -0.3], l: [0, 0.89, 2.0]}, to: {p: [0.26, 1.0, 0.25], l: [0, 0.89, 2.0]}, fov: 40},
	{id: 'E_viewer_mcu', t: 13.4, set: 'apt', from: {p: [0.2, 1.0, 1.35], l: [-0.2, 0.98, -0.6]}, to: {p: [0.17, 1.0, 1.15], l: [-0.2, 0.98, -0.6]}, fov: 40},
	{id: 'F_master_control', t: 16.3, set: 'mc', from: {p: [MC_X + 0.85, 1.7, -0.85], l: [MC_X + 0.0, 1.15, 1.8]}, to: {p: [MC_X + 0.78, 1.66, -0.6], l: [MC_X + 0.0, 1.15, 1.8]}, fov: 54},
	{id: 'G_tv_low_vcr', t: 19.3, set: 'apt', from: {p: [0.3, 0.5, 0.95], l: [-0.02, 0.72, 2.2]}, to: {p: [0.26, 0.5, 1.05], l: [-0.02, 0.72, 2.2]}, fov: 44},
	{id: 'H_tower_top', t: 22.6, set: 'city', from: {p: [TOWER[0] - 46, TOWER_TOP - 6, TOWER[2] - 30], l: [TOWER[0] - 6, TOWER_TOP + 6, TOWER[2]]}, to: {p: [TOWER[0] - 44, TOWER_TOP - 5, TOWER[2] - 28], l: [TOWER[0] - 6, TOWER_TOP + 26, TOWER[2]]}, fov: 46},
	{id: 'I_clock', t: 25.4, set: 'apt', from: {p: [0.95, 1.92, 1.4], l: [0.95, 1.95, 2.5]}, to: {p: [0.95, 1.93, 1.5], l: [0.95, 1.95, 2.5]}, fov: 34},
	{id: 'J_listings', t: 26.9, set: 'apt', from: {p: [0.03, 0.74, 0.62], l: [0.05, 0.24, 0.83]}, to: {p: [0.04, 0.7, 0.66], l: [0.05, 0.24, 0.83]}, fov: 40},
	{id: 'K_tv_show', t: 28.2, set: 'apt', from: {p: [0, 0.89, 0.3], l: [0, 0.89, 2.0]}, to: {p: [0, 0.89, 0.42], l: [0, 0.89, 2.0]}, fov: 42},
	{id: 'L_can_push', t: 32.6, set: 'apt', from: {p: [0, 0.89, 0.62], l: [0, 0.89, 2.0]}, to: {p: [0, 0.89, 0.86], l: [0, 0.89, 2.0]}, fov: 42},
	{id: 'M_viewer_backs', t: 34.4, set: 'apt', from: {p: [2.35, 1.35, -1.75], l: [-0.3, 0.95, 0.9]}, to: {p: [2.25, 1.35, -1.6], l: [-0.3, 0.95, 0.9]}, fov: 58},
	{id: 'N_tx_room', t: 36.4, set: 'tx', from: {p: [TX_X + 2.55, 1.55, -2.0], l: [TX_X + 0.5, 1.05, 2.0]}, to: {p: [TX_X + 2.35, 1.5, -1.6], l: [TX_X + 0.5, 1.05, 2.0]}, fov: 54},
	{id: 'O_tv_swat', t: 39.4, set: 'apt', from: {p: [0, 0.89, 0.36], l: [0, 0.89, 2.0]}, to: {p: [0, 0.89, 0.44], l: [0, 0.89, 2.0]}, fov: 42, roll: 0.06},
	{id: 'P_blinds_tower', t: 44.4, set: 'apt', from: {p: [2.62, 1.25, 0.12], l: [220, 172, 6]}, to: {p: [2.7, 1.25, 0.1], l: [220, 172, 6]}, fov: 40},
	{id: 'Q_empty_room', t: 49.0, set: 'apt', from: WIDE_BEHIND, to: {p: [-0.72, 1.52, -1.85], l: [0.1, 0.92, 2.0]}, fov: 58},
	{id: 'R_push_static', t: 53.7, set: 'apt', from: {p: [0, 0.98, -0.9], l: [0, 0.89, 2.0]}, to: A_TV, fov: 42},
	// static resolves into the mask: identical framing to frame 0, so the end flows into the start
	{id: 'A_loop', t: K.loopOn, set: 'apt', from: A_TV, fov: 42},
];
const shotAt = (t: number) => {
	let i = 0;
	for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].t) i = k;
	const s = SHOTS[i];
	const end = SHOTS[i + 1]?.t ?? DUR;
	// the final push lands on frame-0 framing exactly at loopOn
	return {s, k: ease(lin(t, s.t, end)), local: t - s.t};
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

const W = 128, H = 96;
const FONT = '"DejaVu Sans Mono", monospace';

/** What is on the air (channel 9 then channel 11) at time t. */
export type Feed = 'mask' | 'maskVoice' | 'sports' | 'black' | 'show' | 'swat' | 'static' | 'sub' | 'roll';
export const feedAt = (t: number): Feed => {
	if (t >= K.loopOn) return t < K.loopOn + 0.1 ? 'roll' : 'mask';
	if (t < 4.4) return 'mask';
	if (t < K.sportsOff) return 'sports';
	if (t < K.mask1) return 'black';
	if (t < K.mask1End) return 'mask';
	if (t < K.mask1End + 0.2) return 'roll';
	if (t < K.tvShow) return 'sports';
	if (t < K.black2) return 'show';
	if (t < K.mask2) return 'black';
	if (t < K.swat) return 'maskVoice';
	if (t < K.staticOn) return 'swat';
	if (t >= K.sub && t < K.sub + 0.067) return 'sub';
	return 'static';
};

// the corrugated metal sheet behind him, turning slowly: highlight bands sweep and compress
const drawMetal = (g: CanvasRenderingContext2D, t: number, dark = 1) => {
	const rot = t * 1.9;
	const c = Math.abs(Math.cos(rot)) * 0.75 + 0.25;
	for (let x = 0; x < W; x++) {
		const u = (x - W / 2) / c;
		const ridge = 0.5 + 0.5 * Math.sin(u * 1.05 + rot * 2);
		const sweep = Math.exp(-(((x / W - ((rot / Math.PI) % 1)) * 3) ** 2));
		const v = (40 + ridge * 70 + sweep * 90 * c) * dark;
		g.fillStyle = `rgb(${Math.round(v * 0.85)},${Math.round(v * 0.9)},${Math.round(v)})`;
		g.fillRect(x, 0, 1, H);
	}
};

/** The mask: a pale rubber face with dark glasses and a fixed grin, never a real face. */
const drawFigure = (g: CanvasRenderingContext2D, t: number, mouth: number, drop = 0) => {
	const sx = Math.sin(t * 2.1) * 4 + Math.sin(t * 0.73) * 2;
	const tilt = Math.sin(t * 1.3) * 0.12;
	const cx = 64 + sx;
	const cy = 44 + drop;
	// shoulders: dark jacket, white shirt
	g.fillStyle = '#16161a';
	g.beginPath();
	g.moveTo(cx - 40, H + 2);
	g.lineTo(cx - 30, cy + 26);
	g.lineTo(cx + 30, cy + 26);
	g.lineTo(cx + 40, H + 2);
	g.fill();
	g.fillStyle = '#c8c8c0';
	g.beginPath();
	g.moveTo(cx - 7, cy + 24);
	g.lineTo(cx + 7, cy + 24);
	g.lineTo(cx, cy + 40);
	g.fill();
	g.save();
	g.translate(cx, cy);
	g.rotate(tilt);
	// head: rubber, flat-lit from the front, darker on one side
	g.fillStyle = '#cfc6b4';
	g.beginPath();
	g.ellipse(0, 0, 17, 22, 0, 0, Math.PI * 2);
	g.fill();
	g.fillStyle = '#a89e8c';
	g.beginPath();
	g.ellipse(-6, 2, 11, 20, 0, Math.PI * 0.5, Math.PI * 1.5);
	g.fill();
	g.fillStyle = '#ece6d8';
	g.fillRect(4, -14, 5, 3);
	// slicked-back hair moulded into the rubber
	g.fillStyle = '#8a8478';
	g.beginPath();
	g.ellipse(0, -14, 17, 10, 0, Math.PI, 0);
	g.fill();
	g.fillStyle = '#6e685e';
	for (let i = -12; i <= 12; i += 5) g.fillRect(i, -20, 1, 6);
	// dark glasses
	g.fillStyle = '#050506';
	g.fillRect(-15, -5, 13, 7);
	g.fillRect(2, -5, 13, 7);
	g.fillRect(-2, -4, 4, 2);
	g.fillStyle = '#5a6070';
	g.fillRect(-12, -4, 3, 1);
	g.fillRect(5, -4, 3, 1);
	// fixed grin; it opens a little when he makes sounds
	g.fillStyle = '#2a1c18';
	g.beginPath();
	g.ellipse(0, 9, 10, 2 + mouth * 4, 0, 0, Math.PI);
	g.fill();
	g.fillStyle = '#e8e0cc';
	g.fillRect(-7, 9, 14, 1);
	g.restore();
};

const rollAndNoise = (g: CanvasRenderingContext2D, t: number, n: number, r: () => number) => {
	// rolling sync bar and line tearing, as in the surviving off-air tapes
	const band = ((t * 22) % (H + 24)) - 12;
	g.fillStyle = 'rgba(0,0,0,0.45)';
	g.fillRect(0, band, W, 7);
	g.fillStyle = 'rgba(255,255,255,0.08)';
	g.fillRect(0, band + 7, W, 2);
	const img = g.getImageData(0, 0, W, H);
	const out = g.createImageData(W, H);
	for (let y = 0; y < H; y++) {
		const shift = Math.abs(y - band) < 10 ? Math.round(Math.sin(y * 1.7 + t * 40) * 3) : Math.round(Math.sin(y * 0.3 + t * 9) * 0.6);
		for (let x = 0; x < W; x++) {
			const sx = Math.min(W - 1, Math.max(0, x - shift));
			const i = (y * W + x) * 4, j = (y * W + sx) * 4;
			out.data[i] = img.data[j];
			out.data[i + 1] = img.data[j + 1];
			out.data[i + 2] = img.data[j + 2];
			out.data[i + 3] = 255;
		}
	}
	g.putImageData(out, 0, 0);
	for (let i = 0; i < W * H * n * 0.05; i++) {
		g.fillStyle = r() > 0.5 ? '#ffffff' : '#000000';
		g.fillRect(Math.floor(r() * W), Math.floor(r() * H), 1 + Math.floor(r() * 3), 1);
	}
};

const drawStatic = (g: CanvasRenderingContext2D, r: () => number, k = 1) => {
	const img = g.createImageData(W, H);
	for (let i = 0; i < W * H; i++) {
		const v = r() * 255 * k;
		img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
		img.data[i * 4 + 3] = 255;
	}
	g.putImageData(img, 0, 0);
};

/** The sports anchor (no real person): a figure at a desk, head turns when the picture comes back. */
const drawAnchor = (g: CanvasRenderingContext2D, t: number, look: number, graphic: boolean) => {
	const gr = g.createLinearGradient(0, 0, 0, H);
	gr.addColorStop(0, '#1a2a5a');
	gr.addColorStop(1, '#0a1230');
	g.fillStyle = gr;
	g.fillRect(0, 0, W, H);
	g.fillStyle = '#24387a';
	for (let x = 0; x < W; x += 16) g.fillRect(x, 0, 1, 70);
	const ax = 42 + look * 2;
	g.fillStyle = '#2a2a34';
	g.fillRect(ax - 20, 54, 40, 42);
	g.fillStyle = '#c8c8c0';
	g.fillRect(ax - 4, 54, 8, 10);
	g.fillStyle = '#7a1a1a';
	g.fillRect(ax - 1, 56, 2, 10);
	g.fillStyle = '#b08a6a';
	g.beginPath();
	g.ellipse(ax + look * 3, 40, 10, 13, 0, 0, Math.PI * 2);
	g.fill();
	g.fillStyle = '#2a1e16';
	g.beginPath();
	g.ellipse(ax + look * 3, 32, 10, 6, 0, Math.PI, 0);
	g.fill();
	g.fillStyle = '#1a1210';
	g.fillRect(ax - 5 + look * 5, 39, 2, 2);
	g.fillRect(ax + 3 + look * 5, 39, 2, 2);
	// desk
	g.fillStyle = '#5a4a3a';
	g.fillRect(0, 76, W, 20);
	g.fillStyle = '#7a6a5a';
	g.fillRect(0, 76, W, 2);
	if (graphic) {
		// over-the-shoulder box: a football and SPORTS
		g.fillStyle = '#d8d8e0';
		g.fillRect(72, 14, 46, 36);
		g.fillStyle = '#1a6a2a';
		g.fillRect(74, 16, 42, 32);
		g.fillStyle = '#6a3a1a';
		g.beginPath();
		g.ellipse(95, 32, 12, 7, -0.4, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = '#e8e8e0';
		g.fillRect(90, 31, 10, 1);
		for (let i = 0; i < 4; i++) g.fillRect(91 + i * 3, 29, 1, 5);
		g.fillStyle = '#c01818';
		g.fillRect(0, 80, 66, 11);
		g.font = `bold 8px ${FONT}`;
		g.textAlign = 'left';
		g.fillStyle = '#ffffff';
		g.fillText('SPORTS', 6, 89);
	}
	void t;
};

/** A late-night science-fiction serial (generic, not a recreation): a lighthouse on a rock in fog. */
const drawShow = (g: CanvasRenderingContext2D, t: number) => {
	g.fillStyle = '#06100e';
	g.fillRect(0, 0, W, H);
	for (let y = 0; y < 60; y++) {
		g.fillStyle = `rgb(${8 + y * 0.3},${20 + y * 0.6},${22 + y * 0.6})`;
		g.fillRect(0, y, W, 1);
	}
	const bx = 84;
	const a = t * 1.6;
	g.fillStyle = 'rgba(200,230,210,0.18)';
	g.beginPath();
	g.moveTo(bx, 26);
	g.lineTo(bx + Math.cos(a) * 160, 26 + Math.sin(a) * 18 - 10);
	g.lineTo(bx + Math.cos(a + 0.18) * 160, 26 + Math.sin(a + 0.18) * 18 + 10);
	g.fill();
	g.fillStyle = '#0a1412';
	g.fillRect(0, 62, W, 34);
	g.fillStyle = '#121c1a';
	g.beginPath();
	g.moveTo(60, 70);
	g.lineTo(76, 56);
	g.lineTo(100, 58);
	g.lineTo(116, 72);
	g.fill();
	g.fillStyle = '#c8ccc0';
	g.fillRect(bx - 4, 30, 8, 28);
	g.fillStyle = '#7a2a22';
	g.fillRect(bx - 4, 38, 8, 3);
	g.fillRect(bx - 4, 48, 8, 3);
	g.fillStyle = '#ffe8a0';
	g.fillRect(bx - 3, 24, 6, 5);
	g.fillStyle = '#222';
	g.fillRect(bx - 5, 22, 10, 2);
	for (let i = 0; i < 6; i++) {
		g.fillStyle = 'rgba(40,70,66,0.6)';
		g.fillRect(((i * 37 + t * 8) % (W + 20)) - 20, 62 + (i % 3) * 7, 26, 2);
	}
};

const drawTV = (g: CanvasRenderingContext2D, t0: number) => {
	const r = rng(Math.floor(t0 * 30) + 3);
	const f = feedAt(t0);
	// after the loop point the mask runs on "negative" time so the last frame matches frame 0
	const t = t0 >= K.loopOn ? t0 - DUR : t0;
	if (f === 'black') {
		g.fillStyle = '#000';
		g.fillRect(0, 0, W, H);
		g.fillStyle = '#222';
		g.fillRect(0, H / 2 - 1 + Math.floor(r() * 4), W, 1);
		return;
	}
	if (f === 'static' || f === 'sub') {
		const resolve = t0 >= K.loopOn - 0.35 ? lin(t0, K.loopOn - 0.35, K.loopOn, 1, 0.55) : 1;
		drawStatic(g, r, resolve);
		if (f === 'sub') {
			g.globalAlpha = 0.55;
			drawMetal(g, t, 0.6);
			drawFigure(g, t, 0.6);
			g.globalAlpha = 1;
		}
		return;
	}
	if (f === 'roll') {
		drawStatic(g, r, 0.5);
		g.globalAlpha = 0.5;
		drawMetal(g, t);
		drawFigure(g, t, 0);
		g.globalAlpha = 1;
		return;
	}
	if (f === 'sports') {
		const back = t0 >= K.mask1End;
		const look = back ? Math.sin(Math.max(0, t0 - 18.3) * 2.2) * sm(t0, 18.3, 18.8) * (1 - sm(t0, 21.4, 22.2)) : 0;
		drawAnchor(g, t0, look, !back || t0 > 21.6);
		rollAndNoise(g, t0, 0.03, r);
		return;
	}
	if (f === 'show') {
		drawShow(g, t0);
		rollAndNoise(g, t0, 0.04, r);
		return;
	}
	if (f === 'mask' || f === 'maskVoice') {
		drawMetal(g, t);
		let mouth = 0;
		if (f === 'maskVoice') mouth = Math.max(0, Math.sin(t * 9) * Math.sin(t * 3.3)) * (t > 30.6 ? 1 : 0.2);
		drawFigure(g, t, mouth);
		if (f === 'maskVoice' && t >= K.canUp && t < K.canDown) {
			// he holds up a can of soda (no brand)
			const up = sm(t, K.canUp, K.canUp + 0.5) * (1 - sm(t, K.canDown - 0.4, K.canDown));
			const x = 92 + Math.sin(t * 2.1) * 3, y = 100 - up * 54;
			g.fillStyle = '#b0b4bc';
			g.fillRect(x, y, 13, 22);
			g.fillStyle = '#8a1e22';
			g.fillRect(x, y + 5, 13, 11);
			g.fillStyle = '#d8dce4';
			g.fillRect(x + 1, y + 1, 11, 2);
			g.fillStyle = '#e8e8ec';
			g.fillRect(x + 3, y + 8, 7, 2);
			// the hand around it
			g.fillStyle = '#16161a';
			g.fillRect(x - 3, y + 16, 19, 12);
			g.fillStyle = '#b8a890';
			g.fillRect(x - 2, y + 12, 4, 9);
		}
		rollAndNoise(g, t, f === 'maskVoice' ? 0.07 : 0.05, r);
		return;
	}
	// swat: he bends down out of frame; only the metal and a hand from off screen
	const k = t0 - K.swat;
	drawMetal(g, t0);
	drawFigure(g, t0, 0.4, sm(k, 0, 0.9, 0, 70));
	if (k > 0.9) {
		const sw = Math.max(0, Math.sin((k - 0.9) * 6.5));
		const ang = -0.9 + sw * 1.3;
		const ox = W + 8, oy = 30;
		// cast shadow on the metal first, then the arm in silhouette
		for (const [dx, col] of [[-10, 'rgba(0,0,0,0.35)'], [0, '#0c0c10']] as const) {
			g.save();
			g.translate(ox + dx, oy + (dx ? 6 : 0));
			g.rotate(Math.PI - ang);
			g.fillStyle = col;
			g.fillRect(0, -3, 46, 6);
			g.fillRect(46, -1, 22, 2);
			g.fillRect(66, -9, 14, 18);
			g.restore();
		}
	}
	rollAndNoise(g, t0, 0.07, r);
};

/** Master-control preview monitor: the studio camera on the anchor, always. */
const drawPreview = (g: CanvasRenderingContext2D, t: number) => {
	drawAnchor(g, t, 0, false);
	g.font = `bold 7px ${FONT}`;
	g.textAlign = 'left';
	g.fillStyle = '#e8e8e8';
	g.fillText('PVW', 4, 10);
};

const drawVCR = (g: CanvasRenderingContext2D, t: number) => {
	g.fillStyle = '#050806';
	g.fillRect(0, 0, 48, 15);
	g.font = `bold 7px ${FONT}`;
	g.textAlign = 'left';
	// hidden detail: somebody at home is taping (that is why the intrusion survives)
	if (Math.floor(t * 1.4) % 2) {
		g.fillStyle = '#ff3020';
		g.beginPath();
		g.arc(5, 7.5, 2.5, 0, Math.PI * 2);
		g.fill();
	}
	g.fillStyle = '#ff5a40';
	g.fillText('REC', 10, 10);
	g.fillStyle = '#40ff70';
	g.fillText(t < K.tvShow - 3 || t >= K.loopOn ? 'CH09' : 'CH11', 27, 10);
};

/** Wall clock: 9:14 during the first intrusion, 11:15 during the second (the reported times). */
const clockAt = (t: number) => (t < 22.6 || t >= K.loopOn ? 9 * 60 + 13.6 + t / 60 : 11 * 60 + 14.6 + (t - 22.6) / 60 + (t > 44 ? 1.5 : 0));
const drawClock = (g: CanvasRenderingContext2D, t: number) => {
	const S = 32;
	g.fillStyle = '#d8d0b8';
	g.fillRect(0, 0, S, S);
	g.fillStyle = '#e8e2cc';
	g.beginPath();
	g.arc(16, 16, 14, 0, Math.PI * 2);
	g.fill();
	g.fillStyle = '#2a2420';
	for (let i = 0; i < 12; i++) {
		const a = (i / 12) * Math.PI * 2;
		g.fillRect(Math.round(16 + Math.sin(a) * 12) - (i % 3 ? 0 : 1), Math.round(16 - Math.cos(a) * 12) - (i % 3 ? 0 : 1), i % 3 ? 1 : 2, i % 3 ? 1 : 2);
	}
	const m = clockAt(t);
	const hand = (a: number, len: number, w: number) => {
		g.save();
		g.translate(16, 16);
		g.rotate(a);
		g.fillRect(-w / 2, -len, w, len + 1);
		g.restore();
	};
	hand((((m / 60) % 12) / 12) * Math.PI * 2, 7, 2);
	hand(((m % 60) / 60) * Math.PI * 2, 11, 1);
	g.fillStyle = '#a02018';
	hand((((m * 60) % 60) / 60) * Math.PI * 2, 12, 1);
};

/** The TV listings page on the coffee table, with 11:00 circled in red. */
const drawListings = (g: CanvasRenderingContext2D) => {
	g.fillStyle = '#dcd6c2';
	g.fillRect(0, 0, 64, 84);
	g.fillStyle = '#1a1a1a';
	g.font = `bold 9px ${FONT}`;
	g.textAlign = 'left';
	g.fillText('SUNDAY', 4, 11);
	g.fillRect(4, 14, 56, 1);
	g.font = `bold 7px ${FONT}`;
	const rows = [['9:00', '9', 'NEWS'], ['9:30', '2', 'MOVIE'], ['10:00', '11', 'SERIES'], ['10:30', '7', 'NEWS'], ['11:00', '11', 'DR.WHO'], ['11:30', '9', 'FILM']];
	rows.forEach(([a, ch, b], i) => {
		const y = 25 + i * 10;
		g.fillStyle = '#2a2a2a';
		g.fillText(a, 3, y);
		g.fillText(ch.padStart(2), 27, y);
		g.fillText(b.slice(0, 6), 40, y);
	});
	g.strokeStyle = '#c01c18';
	g.lineWidth = 1.5;
	g.beginPath();
	g.ellipse(32, 62, 30, 6, -0.03, 0, Math.PI * 2);
	g.stroke();
};

// ------------------------------------------------------------------ camera, fog

const Cam: React.FC<{t: number}> = ({t}) => {
	const {camera} = useThree();
	const {s, k} = shotAt(t);
	const to = s.to ?? s.from;
	const p = mix3(s.from.p, to.p, k);
	const l = mix3(s.from.l, to.l, k);
	const b = s.set === 'city' ? 0.04 : 0.004;
	// operator breathing is zero at frame 0 and at the end, so the loop lands exactly
	const br = Math.sin((t / DUR) * Math.PI * 2 * 23);
	camera.position.set(p[0] + br * b, p[1] + Math.sin((t / DUR) * Math.PI * 2 * 31) * b, p[2]);
	const roll = s.roll ?? 0;
	camera.up.set(Math.sin(roll), Math.cos(roll), 0);
	camera.lookAt(...l);
	(camera as THREE.PerspectiveCamera).fov = s.fov ?? 50;
	(camera as THREE.PerspectiveCamera).far = s.set === 'city' || s.id === 'P_blinds_tower' ? 900 : 60;
	camera.updateProjectionMatrix();
	return null;
};

const Atmos: React.FC<{set: Shot['set']; through: boolean}> = ({set, through}) => {
	const {scene} = useThree();
	const bg = new THREE.Color(set === 'city' || through ? '#1a2034' : '#020204');
	if (!scene.fog) scene.fog = new THREE.Fog(bg, 10, 70);
	const f = scene.fog as THREE.Fog;
	f.color.copy(bg);
	f.near = set === 'city' || through ? 60 : 6;
	f.far = set === 'city' || through ? 520 : 28;
	scene.background = bg;
	return null;
};

// ------------------------------------------------------------------ the world at time t

type Tex = {screen: THREE.Texture; preview: THREE.Texture; vcr: THREE.Texture; clock: THREE.Texture; listings: THREE.Texture};
const World: React.FC<{t: number; tx: Tex}> = ({t, tx}) => {
	const {s} = shotAt(t);
	const f = feedAt(t);
	const bright = f === 'static' || f === 'sub' ? 1.0 : f === 'black' ? 0.05 : f === 'mask' || f === 'maskVoice' || f === 'swat' ? 0.75 : 0.85;
	const flick = 0.8 + 0.2 * Math.sin(t * 23) * Math.sin(t * 7.1);
	const tvKey = bright * flick;
	const tvCol = f === 'sports' ? '#7a90ff' : f === 'show' ? '#7ab0a0' : '#c0c8d8';
	const beacon = Math.floor(t * 0.75 + 0.3) % 2 === 0 && (t * 0.75 + 0.3) % 1 < 0.55 ? 1 : 0;
	const through = s.id === 'P_blinds_tower';

	// the viewer
	let viewer: {pose: Pose; pos: V3; lean: number} | null = {pose: {sit: true, yaw: -Math.PI / 2, armL: [0.4, -0.7], armR: [0.4, -0.7], head: [0, 0]}, pos: [-0.2, 0, -0.55], lean: 0};
	if (t >= 13.4 && t < 16.3) {
		viewer.lean = sm(t, 13.6, 15.4, 0, 0.32);
		viewer.pose.head = [0, -0.08];
		viewer.pose.armL = [sm(t, 13.6, 15.4, 0.4, 1.0), -0.9];
		viewer.pose.armR = [sm(t, 13.6, 15.4, 0.4, 1.0), -0.9];
	}
	if (t >= 9.9 && t < 13.4) viewer.lean = sm(t, 11.3, 13.2, 0, 0.12);
	if (t >= 19.3 && t < 22.6) viewer.lean = 0.12;
	if (t >= 28.2 && t < 34.4) viewer.lean = 0.05;
	if (t >= 34.4 && t < 36.4) {
		const k = sm(t, 34.4, 36.2);
		viewer = {pose: {yaw: -Math.PI / 2, step: k * 9, head: [0, -0.05], armL: [0.25, -0.3], armR: [0.6, -0.6]}, pos: [-0.2 - k * 0.25, 0, -0.75 - k * 0.85], lean: -0.06};
	}
	if (t >= 36.4) viewer = null; // the chair is empty from here on

	// the engineer at master control throws the switch
	const lever = sm(t, K.lever - 0.15, K.lever + 0.1);
	const reach = sm(t, 16.9, K.lever - 0.15) * (1 - sm(t, 18.3, 18.9));
	const flicker = Math.sin(t * 31) > 0.85 || Math.sin(t * 13.7) > 0.97 ? 0.15 : 1;
	return (
		<>
			<Atmos set={s.set} through={through} />
			<ambientLight intensity={s.set === 'city' ? 1.4 : through ? 0.25 : s.set === 'apt' ? 0.75 : 0.6} color={s.set === 'city' ? '#4a5a8a' : '#4a5070'} />
			<hemisphereLight args={['#6a7aaa', '#1a1a22', s.set === 'city' ? 0.8 : 0.22]} />
			{/* apartment: the TV is the key light; the city glows faintly through the blinds */}
			<pointLight position={[0, 1.0, 1.55]} intensity={tvKey * 9} distance={8} decay={1.2} color={tvCol} />
			<pointLight position={[2.6, 1.6, 0]} intensity={through ? 0.4 : 2.6} distance={5} decay={1.2} color="#7a86b0" />
			<pointLight position={[0.7, 2.3, -2.0]} intensity={4.5} distance={4.5} decay={1.3} color="#5a6890" />
			{/* master control: overhead fluorescents and monitor spill */}
			<pointLight position={[MC_X, 2.6, 0.4]} intensity={4} distance={7} decay={1.2} color="#cfd8e0" />
			<pointLight position={[MC_X, 1.5, 1.6]} intensity={tvKey * 4} distance={4} color={tvCol} />
			{/* transmitter room: one flickering tube, the monitor and the red beacon through the window */}
			<pointLight position={[TX_X, 2.5, 0.5]} intensity={3 * flicker} distance={7} decay={1.2} color="#c8d4cc" />
			<pointLight position={[TX_X + 0.6, 1.2, 1.4]} intensity={tvKey * 3.5} distance={3.5} color={tvCol} />
			<pointLight position={[TX_X + 2.6, 1.4, 0.75]} intensity={beacon * 5} distance={5} color="#ff3a2a" />
			{/* city: moonless night, sodium glow from below */}
			<directionalLight position={[-40, 60, -30]} intensity={0.9} color="#8090c0" />
			<pointLight position={[TOWER[0] - 30, TOWER_TOP + 10, TOWER[2] - 20]} intensity={s.set === 'city' ? 400 : 0} distance={80} decay={1.2} color="#9aa4c8" />
			<pointLight position={[TOWER[0] - 20, TOWER_TOP + 48, TOWER[2]]} intensity={beacon * 900} distance={70} decay={1.4} color="#ff3a2a" />
			<Apartment screen={tx.screen} vcr={tx.vcr} clock={tx.clock} listings={tx.listings} tvOn={tvKey} blindsLight={0.4} seeThrough={through} />
			<City beacon={beacon} />
			<MasterControl feed={tx.screen} preview={tx.preview} lever={lever} />
			<TransmitterRoom feed={tx.screen} beacon={beacon} flicker={flicker} />
			{viewer && (
				<group position={[viewer.pos[0], 0.48, viewer.pos[2]]} rotation={[viewer.lean, 0, 0]}>
					<Human pose={viewer.pose} pos={[0, -0.48, 0]} look={VIEWER} face />
				</group>
			)}
			<Human pose={{sit: true, yaw: -Math.PI / 2, head: [0, reach * 0.1], armL: [0.3, -0.6], armR: [reach * 1.25, -0.35 + reach * 0.15]}} pos={[MC_X + 0.3, 0, 0.32]} look={ENGINEER} />
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay: captions + tape

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

export const Episode02: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const tv = useCanvasTex(W, H);
	const pv = useCanvasTex(W, H);
	const vcr = useCanvasTex(48, 15);
	const ck = useCanvasTex(32, 32);
	const ls = useCanvasTex(64, 84);
	drawTV(tv.g, t);
	tv.t.needsUpdate = true;
	drawPreview(pv.g, t);
	pv.t.needsUpdate = true;
	drawVCR(vcr.g, t);
	vcr.t.needsUpdate = true;
	drawClock(ck.g, t);
	ck.t.needsUpdate = true;
	drawListings(ls.g);
	ls.t.needsUpdate = true;
	const feed = feedAt(t);
	const {s} = shotAt(t);
	const onTV = s.id.startsWith('A_') || s.id === 'K_tv_show' || s.id === 'L_can_push' || s.id === 'O_tv_swat' || s.id === 'R_push_static';
	const damage = feed === 'roll' || feed === 'black' ? 0.6 : onTV && (feed === 'maskVoice' || feed === 'swat') ? 0.2 : feed === 'sub' ? 0.5 : 0.05;
	const ca = 0.6 + damage * 2;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="tape2" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: 'url(#tape2)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.03, far: 900}} style={{imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Cam t={t} />
						<World t={t} tx={{screen: tv.t, preview: pv.t, vcr: vcr.t, clock: ck.t, listings: ls.t}} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			<Overlay t={t} damage={damage} captions={captions} />
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep02-mask-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
