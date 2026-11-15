// TRANSFERS Episode 1 "Bayad Na": full-length PSX draft (2026-11-15).
// Picture cut to the sound-only draft mix v1 (public/assets/audio/transfers/ep01-mix/, 6:00) and its cue
// list. Present-day shots: 640x360 with PS1 wobble at 320x180 strength (snap grid 160x90), letterboxed
// to 2.39:1. The 1991 tape: 320x240, 4:3. Phone clips: 640x360, full frame. One performance timeline
// drives every character from the episode clock; shots are cameras on it. The 1991 tape has its own
// clock (tapeT), so fast-forward, rewind and frame-stepping replay the same footage.
// Uses the user's PSX packs from the git-ignored public/assets/3d/psx-local/ (see PSX-ASSETS.md).
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {grimeTex, canvasTex, nearest, prng, psx, psxify} from '../../psx';
import {Expr, setFace} from '../psx/faces';
import {
	Assets, Bones, Cam, Char, FogBg, Letterbox, MIX_B, NICO_B, P, Pixel, TapeOverlay, aim, black, box, buildBea, buildNico, buildShopEnv, clamp, drawCrt, drift, ease, ik,
	lam, lerp, makeChar, poseAsleep, poseSeated, prop, reset, rotW, updateRain, useAssets, V, wp, ShopEnv,
} from '../psx/PsxTest';
import {Ctx, drawBlue, drawPaper, drawPc, drawWedding, PcState} from './screens';
import lipsync from './lipsync.json';
import captions from './captions.json';

export const EP01_FPS = 30;
export const EP01_SECONDS = 360;
export const EP01_FRAMES = EP01_SECONDS * EP01_FPS;
const F = (s: number) => Math.round(s * EP01_FPS);

// ------------------------------------------------------------------ timeline helpers
type Key = [number, number];
const kn = (t: number, keys: Key[]) => {
	if (t <= keys[0][0]) return keys[0][1];
	for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], ease((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])));
	return keys[keys.length - 1][1];
};
type VKey = [number, THREE.Vector3];
const kv = (t: number, keys: VKey[]) => {
	if (t <= keys[0][0]) return keys[0][1].clone();
	for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return keys[i - 1][1].clone().lerp(keys[i][1], ease((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])));
	return keys[keys.length - 1][1].clone();
};
const inR = (t: number, a: number, b: number) => t >= a && t < b;
const LIPS = lipsync as unknown as Record<string, [number, number][]>;
const mouthOpen = (who: string, t: number) => {
	const f = F(t);
	return (LIPS[who] ?? []).some(([a, b]) => f >= a && f < b);
};

// ------------------------------------------------------------------ pose library (works on both rigs)
const snapQ = (c: Char) => new Map([...c.rest.keys()].map((b) => [b, b.quaternion.clone()] as const));
/** Pose A, pose B, and blend t (0..1) between them, bone by bone. */
const blendPose = (c: Char, A: () => void, B: () => void, t: number) => {
	if (t <= 0.001) return A();
	if (t >= 0.999) return B();
	A();
	const qa = snapQ(c);
	B();
	const qb = snapQ(c);
	qa.forEach((q, b) => b.quaternion.copy(q).slerp(qb.get(b)!, t));
	c.holder.updateMatrixWorld(true);
};
const SIDES = ['l', 'r'] as const;
const sx = (s: 'l' | 'r') => (s === 'l' ? 1 : -1);
/** Arms hanging, slightly bent. */
const armsDown = (c: Char, B: Bones, which: readonly ('l' | 'r')[] = SIDES) => {
	const k = c.height / 1.7;
	for (const s of which) {
		const sh = wp(c.bone(B.ua(s)));
		ik(c.bone(B.ua(s)), c.bone(B.fa(s)), c.bone(B.hand(s)), sh.clone().add(c.D(sx(s) * 0.1 * k, -0.55 * k, 0.07 * k)), c.D(0, 0, -1));
	}
};
const look = (c: Char, B: Bones, yaw: number, pitch: number) => {
	rotW(c.bone(B.neck), c.D(0, 1, 0), yaw * 0.4);
	rotW(c.bone(B.head), c.D(0, 1, 0), yaw * 0.6);
	rotW(c.bone(B.head), c.D(1, 0, 0), pitch);
};
const hand = (c: Char, B: Bones, s: 'l' | 'r', target: THREE.Vector3, pole?: THREE.Vector3) =>
	ik(c.bone(B.ua(s)), c.bone(B.fa(s)), c.bone(B.hand(s)), target, pole ?? c.D(sx(s) * 0.6, -1, -0.4));
const poseStand = (c: Char, B: Bones, o: {yaw?: number; pitch?: number; lean?: number; twist?: number} = {}) => {
	reset(c);
	if (o.lean) rotW(c.bone(B.spine), c.D(1, 0, 0), o.lean);
	if (o.twist) rotW(c.bone(B.chest), c.D(0, 1, 0), o.twist);
	armsDown(c, B);
	look(c, B, o.yaw ?? 0, o.pitch ?? 0);
};
/** Walking, phase in radians; the holder moves the body, this moves the limbs. */
const poseWalk = (c: Char, B: Bones, phase: number, o: {arms?: boolean; yaw?: number} = {}) => {
	reset(c);
	const k = c.height / 1.7;
	for (const s of SIDES) {
		const sw = Math.sin(phase + (s === 'l' ? 0 : Math.PI));
		const hip = wp(c.bone(B.th(s)));
		const a = 0.34 * sw;
		const knee = hip.clone().add(c.D(sx(s) * 0.06 * k, -Math.cos(a) * 0.43 * k, Math.sin(a) * 0.43 * k));
		const bend = 0.55 * Math.max(0, Math.sin(phase + (s === 'l' ? 0 : Math.PI) + 1.2));
		aim(c.bone(B.th(s)), c.bone(B.sh(s)), knee);
		aim(c.bone(B.sh(s)), c.bone(B.ft(s)), knee.clone().add(c.D(0, -Math.cos(a - bend) * 0.43 * k, Math.sin(a - bend) * 0.43 * k)));
	}
	if (o.arms !== false)
		for (const s of SIDES) {
			const sw = Math.sin(phase + (s === 'l' ? Math.PI : 0));
			const sh = wp(c.bone(B.ua(s)));
			hand(c, B, s, sh.clone().add(c.D(sx(s) * 0.1 * k, -0.53 * k, 0.16 * sw * k)), c.D(0, 0, -1));
		}
	look(c, B, o.yaw ?? 0, 0.05);
};
/** Seated on a bench or chair with no desk: hands on the lap. */
const poseSit = (c: Char, B: Bones, o: {yaw?: number; pitch?: number; lean?: number; lap?: boolean} = {}) => {
	poseSeated(c, B, {lean: o.lean ?? 0.12, yaw: o.yaw ?? 0, pitch: o.pitch ?? 0.1, handZ: 0.3, deskY: wp(c.bone(B.th('l'))).y + 0.05});
};

// ------------------------------------------------------------------ props made here
const vhs = (label = false) => {
	const g = new THREE.Group();
	g.add(box(0.188, 0.025, 0.104, lam({color: '#121214'}), [0, 0.0125, 0]));
	if (label) g.add(box(0.06, 0.004, 0.018, lam({color: '#e6e0cc'}), [0, 0.026, 0.03]));
	return g;
};
const envelope = () => {
	const t = canvasTex(32, 20, (g) => {
		g.fillStyle = '#5b8fd0';
		g.fillRect(0, 0, 32, 20);
		for (let x = 0; x < 32; x += 4) { g.fillStyle = (x / 4) % 2 ? '#c42424' : '#1d3f9a'; g.fillRect(x, 0, 2, 2); g.fillRect(x + 2, 18, 2, 2); }
	});
	const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.006, 0.1), lam({map: t}));
	return m;
};
type ScreenTex = {tex: THREE.CanvasTexture; ctx: Ctx; w: number; h: number};
const screenTex = (w: number, h: number): ScreenTex => {
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	nearest(tex);
	return {tex, ctx: c.getContext('2d')!, w, h};
};

// ------------------------------------------------------------------ the shop, with its people and props
type ShopScene = {
	env: ShopEnv; nico: Char; bea: Char; boxP: THREE.Object3D; tapesRow: THREE.Group; tape1: THREE.Group; env1: THREE.Object3D; phone: THREE.Group; phoneScr: ScreenTex;
	jacket: THREE.Mesh; notebook: THREE.Mesh; vcr: THREE.Object3D; figure: Char | null; glow: THREE.PointLight;
};
const buildShopScene = (a: Assets, evening: boolean, withFigure = false): ShopScene => {
	P.snap = [160, 90];
	const env = buildShopEnv(a, {evening});
	const g = env.group;
	const {x0, deskZ, deskTop} = env.at;
	const nico = buildNico(a);
	g.add(nico.holder);
	addFaceMarker(nico, NICO_B);
	const bea = buildBea(a);
	g.add(bea.holder);
	addFaceMarker(bea, MIX_B);
	// the soaked box, the nine tapes, the envelope; a VCR left of the CRT
	const boxP = prop(a.glb.box, [0, 0, 0], {h: 0.3});
	g.add(boxP);
	const tapesRow = new THREE.Group();
	for (let i = 0; i < 8; i++) { const v = vhs(); v.rotation.z = Math.PI / 2; v.position.set(0, 0.094, -0.18 + i * 0.03); tapesRow.add(v); }
	tapesRow.position.set(x0 + 0.62, deskTop, deskZ - 0.45);
	g.add(tapesRow);
	const tape1 = vhs(false);
	g.add(tape1);
	const env1 = envelope();
	g.add(env1);
	const vcr = box(0.32, 0.08, 0.26, lam({map: grimeTex(40, '#26262a', {speck: 120, stains: 2})}), [x0 + 0.3, deskTop + 0.04, deskZ - 0.68]);
	g.add(vcr);
	// phone: a slab with a live screen
	const phone = new THREE.Group();
	phone.add(box(0.075, 0.155, 0.009, lam({color: '#101012'}), [0, 0, 0]));
	const phoneScr = screenTex(36, 72);
	const ps = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.14), psx(new THREE.MeshBasicMaterial({map: phoneScr.tex}), P));
	ps.position.z = 0.0055;
	phone.add(ps);
	g.add(phone);
	const glow = new THREE.PointLight('#a8c4ff', 0, 1.6, 1.8);
	g.add(glow);
	// Bea's things: the jacket over her at night, her notebook in the evening
	const jacket = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.62, 0.36, 3, 6, 3), lam({map: grimeTex(31, '#2a2d33', {speck: 400}), color: '#ffffff'}));
	const jp = jacket.geometry.getAttribute('position');
	const jr = prng(12);
	for (let i = 0; i < jp.count; i++) jp.setXYZ(i, jp.getX(i) + (jr() - 0.5) * 0.03, jp.getY(i) + (jr() - 0.5) * 0.03, jp.getZ(i) + (jr() - 0.5) * 0.03);
	jacket.geometry.computeVertexNormals();
	jacket.position.set(0, 0.62, 0.06);
	bea.holder.add(jacket);
	const notebook = box(0.2, 0.012, 0.15, lam({color: '#e8e4d6'}), [0, 0, 0]);
	g.add(notebook);
	let figure: Char | null = null;
	if (withFigure) {
		figure = makeChar(a.glb.figure_base, 1.97, {material: lam({color: '#6a6e78'}), frontRy: Math.PI / 2});
		figure.holder.position.set(env.at.doorX, 0, env.at.zb + 0.06);
		figure.holder.rotation.y = 0.35; // facing into the shop, towards the phone
		g.add(figure.holder);
	}
	return {env, nico, bea, boxP, tapesRow, tape1, env1, phone, phoneScr, jacket, notebook, vcr, figure, glow};
};

// world landmarks in the shop
const LM = {
	seat: V(-0.9, -0.36, -0.7), stand: V(-1.05, 0, -0.25), step: V(-0.2, 0, 2.75), elbow: V(-0.85, 0, 0.18),
	bench: V(1.62, 0, -2.05), keyboard: V(-1.45, 0.79, -0.4), mouse: V(-1.4, 0.79, -0.12), vcr: V(-1.55, 0.86, -1.38), crtTop: V(-1.7, 1.25, -0.95),
	tapeStack: V(-1.45, 0.86, -1.15), deskFront: V(-1.32, 0.78, -0.6), face: V(0, 0, 0),
};

/** Nico's whole performance (episode time t). */
const performNico = (s: ShopScene, a: Assets, t: number) => {
	const c = s.nico, B = NICO_B, h = c.holder;
	const seated = (o: Parameters<typeof poseSeated>[2] = {}) => {
		h.position.copy(LM.seat);
		h.rotation.set(0, -Math.PI / 2, 0);
		h.updateMatrixWorld(true);
		poseSeated(c, B, {lean: 0.2, yaw: -0.1, pitch: 0.02, ...o});
	};
	const headPos = () => wp(c.bone(B.head));
	let expr: Expr = 'neutral';
	// ---- Scene 1 (evening)
	if (t < 96.5) {
		const yaw = kn(t, [[44, -0.1], [61, 0.25], [66, 0.25], [70, -0.1], [87.6, -0.1], [88.4, 1.5], [93.6, 1.5], [94.4, 1.1]]);
		seated({yaw, pitch: t < 48 ? 0.3 : 0.02});
		if (t < 48) { hand(c, B, 'r', LM.deskFront.clone().add(V(0, 0.02, 0.08))); hand(c, B, 'l', LM.deskFront.clone().add(V(0.02, 0.0, -0.12))); }
		else if (inR(t, 61, 66) || inR(t, 86.2, 87.4)) hand(c, B, 'r', LM.mouse);
		if (inR(t, 72.6, 75.4)) { hand(c, B, 'r', headPos().add(V(0.06, 0.02, -0.04)), c.D(-0.5, -1, 0)); expr = 'sleepy'; }
	} else if (t < 102.4) {
		// up, out to the step for the box, back with it
		const p = kv(t, [[96.5, LM.stand], [99.6, LM.step], [100.6, LM.step], [102.4, LM.stand]]);
		h.position.copy(p);
		h.rotation.set(0, t < 100.1 ? 0 : Math.PI, 0);
		h.updateMatrixWorld(true);
		if (inR(t, 99.6, 100.6)) poseStand(c, B, {lean: 0.6, pitch: 0.4});
		else poseWalk(c, B, t * 6.5, {arms: t < 100.6});
		if (t >= 100.1) { const k = c.D(0, 0, 0.32); hand(c, B, 'l', wp(c.bone(B.chest)).add(k).add(c.D(0.12, -0.12, 0))); hand(c, B, 'r', wp(c.bone(B.chest)).add(k).add(c.D(-0.12, -0.12, 0))); }
		expr = 'focused';
	} else if (t < 128.5) {
		// standing at the desk front with the box
		h.position.copy(LM.stand);
		h.rotation.set(0, -Math.PI / 2 + kn(t, [[111, 0], [114.6, 0.6], [128, 0.6]]), 0);
		h.updateMatrixWorld(true);
		const toBea = kn(t, [[111, 0], [114.6, 0.4], [124, 0.4]]);
		poseStand(c, B, {lean: kn(t, [[102.4, 0.35], [111, 0.35], [114, 0.1]]), pitch: kn(t, [[102.4, 0.45], [111, 0.45], [114, 0.25]]), yaw: toBea});
		if (t < 111) {
			hand(c, B, 'l', LM.deskFront.clone().add(V(-0.05, 0.12, -0.15 + Math.sin(t * 3) * 0.02)));
			hand(c, B, 'r', LM.deskFront.clone().add(V(0.0, 0.12, 0.05 + Math.sin(t * 4) * 0.03)));
		}
		if (inR(t, 119, 121.6)) hand(c, B, 'r', headPos().add(c.D(0, -0.07, 0.11)), c.D(-0.3, -1, 0.2));
		expr = t < 108 ? 'focused' : t < 111.6 ? 'smile' : inR(t, 119, 120.2) ? 'shh' : 'neutral';
	}
	// ---- Scene 2 (night)
	else if (t < 250.5) {
		const watch = -0.12, toBea = 1.6;
		const yaw = kn(t, [[128.5, -0.1], [163.8, watch], [164.4, toBea], [167.6, toBea], [168.4, watch], [229.8, watch], [230.6, toBea], [233.2, toBea], [233.8, 0.6], [241.6, 0.6], [242.2, toBea], [250, toBea]]);
		const lean = inR(t, 197, 204) ? 0.32 : 0.2;
		seated({yaw, lean, pitch: inR(t, 168, 175) ? -0.04 : 0.02});
		if (t < 130.6) {
			const tp = kv(t, [[128.5, V(-1.4, 0.86, -1.15)], [129.6, wp(c.bone(B.head)).add(V(-0.2, -0.2, 0))], [130.6, wp(c.bone(B.head)).add(V(-0.25, -0.22, 0))]]);
			hand(c, B, 'r', tp.clone().add(V(0, -0.02, 0.06)));
			hand(c, B, 'l', tp.clone().add(V(0, -0.02, -0.06)));
		} else if (inR(t, 130.6, 133.4) || inR(t, 158, 163) || inR(t, 182, 189) || inR(t, 192.2, 197)) hand(c, B, 'r', LM.vcr.clone().add(V(0.12, 0.02, 0.05)), c.D(-0.4, -1, -0.5));
		else if (inR(t, 139, 140)) hand(c, B, 'r', LM.mouse);
		expr = t < 168 ? 'neutral' : t < 197 ? 'focused' : t < 204 ? 'fear' : t < 229 ? 'worried' : 'worried';
	}
	// ---- Scene 3
	else if (t < 303.5) {
		const yaw = kn(t, [[250.5, -0.1], [256.4, -0.35], [264.4, -0.35], [266.6, 0.3], [303, 0.3]]);
		seated({yaw, lean: inR(t, 258.8, 264) ? 0.42 : 0.2, pitch: t < 256 ? 0.35 : 0.04});
		if (t < 256.5) { hand(c, B, 'r', LM.deskFront.clone().add(V(0, 0.03, 0.05))); hand(c, B, 'l', LM.deskFront.clone().add(V(0.01, 0.03, -0.12))); }
		else if (t < 264.6) hand(c, B, 'r', LM.tapeStack.clone().add(V(0.1, 0.12, 0.12)));
		else if (t >= 268) {
			hand(c, B, 'r', LM.mouse);
			if (t < 276 || inR(t, 287.6, 294)) hand(c, B, 'l', LM.keyboard);
		}
		if (inR(t, 283.5, 286.5)) { hand(c, B, 'l', headPos().add(c.D(0.05, 0.02, 0.05)), c.D(0.5, -1, 0)); expr = 'sleepy'; }
		else expr = inR(t, 258.8, 264) ? 'shh' : 'neutral';
	}
	// ---- Scene 4
	else {
		if (t < 336) {
			seated({yaw: 0.05, pitch: 0.18, lean: 0.25});
			const ph = wp(c.bone(B.head)).add(c.D(0, -0.2, 0.32));
			hand(c, B, 'r', ph.clone().add(c.D(-0.03, 0, 0)));
			hand(c, B, 'l', ph.clone().add(c.D(0.03, 0, 0)));
			expr = t < 318 ? 'neutral' : 'fear';
			if (inR(t, 322, 328)) { reset(c); seated({yaw: 2.0, pitch: 0, lean: 0.1}); }
		} else if (t < 340) {
			const p = kv(t, [[336, LM.stand], [339.6, V(1.15, 0, -1.7)]]);
			h.position.copy(p);
			h.rotation.set(0, Math.atan2(1.15 - LM.stand.x, -1.7 - LM.stand.z), 0);
			h.updateMatrixWorld(true);
			poseWalk(c, B, t * 4.2, {arms: true});
			expr = 'fear';
		} else {
			// carrying Bea, backing towards the shutter, eyes on the doorway
			const p = kv(t, [[340, V(1.15, 0, -1.7)], [341.4, V(1.15, 0, -1.7)], [345.6, V(0.3, 0, 2.7)], [347, V(0.3, -0.5, 3.6)]]);
			h.position.copy(p);
			h.rotation.set(0, Math.PI + 0.35, 0);
			h.updateMatrixWorld(true);
			if (t < 341.4) poseStand(c, B, {lean: kn(t, [[340, 0.7], [341.4, 0.1]]), pitch: 0.3});
			else poseWalk(c, B, t * 3.6, {arms: false});
			const k = c.D(0, 0, 0.3);
			hand(c, B, 'l', wp(c.bone(B.chest)).add(k).add(c.D(0.16, -0.18, 0)));
			hand(c, B, 'r', wp(c.bone(B.chest)).add(k).add(c.D(-0.16, -0.1, 0)));
			expr = 'fear';
			h.visible = t < 346.6;
		}
	}
	// lip flap over the neutral and worried faces
	const talk = mouthOpen('nico', t);
	if (talk && (expr === 'neutral' || expr === 'worried' || expr === 'focused')) expr = 'talk';
	setFace(c.root, a.faces.nico, expr);
};

/** Bea's whole performance. */
const performBea = (s: ShopScene, a: Assets, t: number) => {
	const c = s.bea, B = MIX_B, h = c.holder;
	const lie = (facingDoor: number) => {
		h.quaternion.copy(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))));
		h.position.set(1.68, 0.58, -1.12);
		h.updateMatrixWorld(true);
		poseAsleep(c, B);
		if (facingDoor > 0) rotW(c.bone(B.head), c.D(0, 1, 0), 0.5 * facingDoor);
	};
	s.jacket.visible = t >= 128.5;
	s.notebook.visible = t < 128.5;
	let expr: Expr = 'neutral';
	if (t < 106) {
		h.position.copy(LM.bench).add(V(0, -0.21, 0));
		h.rotation.set(0, -Math.PI / 2, 0);
		h.updateMatrixWorld(true);
		const yaw = kn(t, [[44, 0], [87.6, 0], [88.4, 0.5], [93.6, 0.5], [94.4, -1.2], [97, -1.2], [97.8, 0]]);
		poseSit(c, B, {yaw, pitch: yaw === 0 && !inR(t, 84, 86) ? 0.45 : 0.05});
		const lap = wp(c.bone(B.hand('l'))).add(wp(c.bone(B.hand('r')))).multiplyScalar(0.5);
		s.notebook.position.copy(lap).add(V(0, -0.03, 0));
		s.notebook.rotation.set(0, -Math.PI / 2, 0);
	} else if (t < 110.6) {
		const p = kv(t, [[106, LM.bench.clone().add(V(-0.25, 0, 0))], [110.6, LM.elbow]]);
		h.position.copy(p);
		h.rotation.set(0, Math.atan2(LM.elbow.x - LM.bench.x, LM.elbow.z - LM.bench.z), 0);
		h.updateMatrixWorld(true);
		poseWalk(c, B, t * 7);
		s.notebook.visible = false;
	} else if (t < 128.5) {
		h.position.copy(LM.elbow);
		h.rotation.set(0, -Math.PI / 2 - 0.5, 0);
		h.updateMatrixWorld(true);
		poseStand(c, B, {yaw: kn(t, [[110.6, 0.1], [115, 0.6], [128, 0.6]]), pitch: kn(t, [[110.6, 0.35], [115, -0.25], [128, -0.25]])});
		s.notebook.visible = false;
	} else if (t < 340) {
		// asleep (awake) under the jacket; turns to face the doorway at 245
		lie(kn(t, [[245, 0], [247, 1]]));
		if (inR(t, 163, 168) || inR(t, 175, 182) || inR(t, 230, 245)) rotW(c.bone(B.head), c.D(0, 1, 0), -0.35); // towards Papa
		expr = inR(t, 163, 168) || inR(t, 175, 182) || inR(t, 230, 247) ? 'neutral' : 'sleepy';
	} else {
		// in Nico's arms
		const n = s.nico;
		const chest = wp(n.bone(NICO_B.chest)).add(n.D(0, -0.2, 0.32));
		h.quaternion.copy(n.holder.quaternion).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, Math.PI / 2 - 0.25)));
		h.position.copy(chest).add(n.D(-0.55, -0.12, 0));
		h.updateMatrixWorld(true);
		poseAsleep(c, B);
		expr = 'sleepy';
		h.visible = n.holder.visible && t >= 340.6;
	}
	if (mouthOpen('bea', t) && expr === 'neutral') expr = 'talk';
	setFace(c.root, a.faces.bea, expr);
};

/** Props over time: the box, the tapes, the envelope, the phone, the screens. */
const performProps = (s: ShopScene, t: number, f: number) => {
	const {x0, deskZ, deskTop} = s.env.at;
	const n = s.nico;
	// the box: outside on the step, carried in, on the desk
	if (t < 100.6) { s.boxP.position.set(-0.35, 0, 3.05); }
	else if (t < 102.4) { const ch = wp(n.bone(NICO_B.chest)).add(n.D(0, -0.3, 0.38)); s.boxP.position.copy(ch).add(V(0, -0.15, 0)); }
	else s.boxP.position.set(x0 + 0.66, deskTop, deskZ - 0.5);
	s.boxP.visible = t >= 94 || t < 0;
	s.tapesRow.visible = t >= 106.2;
	s.tapesRow.position.set(x0 + 0.68, deskTop, deskZ + 0.05);
	// tape 1: in the row, lifted at 128.5, into the VCR at 131; labelled 01 later
	if (t < 128.5) s.tape1.visible = false;
	else if (t < 130.8) {
		s.tape1.visible = true;
		const hl = wp(n.bone(NICO_B.hand('l'))), hr = wp(n.bone(NICO_B.hand('r')));
		s.tape1.position.copy(hl.add(hr).multiplyScalar(0.5));
		s.tape1.rotation.set(Math.PI / 2, 0, 0);
	} else if (t < 250.5) s.tape1.visible = false;
	else { s.tape1.visible = true; s.tape1.position.set(x0 + 0.62, deskTop, deskZ + 0.02); s.tape1.rotation.set(0, 0, 0); }
	s.env1.visible = t >= 106.2;
	s.env1.position.set(x0 + 0.55, deskTop + 0.003, deskZ + 0.32);
	// phone: on the desk (call), propped on the tape stack (recording), in his hands, dropped face up
	const scr = s.phoneScr, g = scr.ctx;
	if (t < 250) {
		s.phone.position.set(x0 + 0.72, deskTop + 0.005, deskZ - 0.05);
		s.phone.rotation.set(-Math.PI / 2, 0, 0.3);
		g.fillStyle = inR(t, 48, 85.6) ? '#1e5a2e' : '#060606';
		g.fillRect(0, 0, scr.w, scr.h);
		if (inR(t, 48, 85.6)) { g.fillStyle = '#d8f0dc'; g.font = '7px monospace'; g.fillText('LIZA', 8, 20); g.fillText(`${Math.floor((t - 48) / 60)}:${String(Math.floor(t - 48) % 60).padStart(2, '0')}`, 8, 34); }
	} else if (t < 303.6) {
		const on = t >= 256.8;
		s.phone.position.set(on ? -1.45 : x0 + 0.72, on ? 0.95 : deskTop + 0.005, on ? 0.33 : deskZ - 0.05);
		s.phone.rotation.set(on ? -0.1 : -Math.PI / 2, on ? -2.6 : 0, on ? 0 : 0.3);
		g.fillStyle = '#0b0d10';
		g.fillRect(0, 0, scr.w, scr.h);
		if (t >= 258.2) { g.fillStyle = '#3a4048'; g.fillRect(2, 10, 32, 50); g.fillStyle = '#d02020'; g.fillRect(14, 62, 8, 6); }
	} else if (t < 340) {
		const hl = wp(n.bone(NICO_B.hand('l'))), hr = wp(n.bone(NICO_B.hand('r')));
		s.phone.position.copy(hl.add(hr).multiplyScalar(0.5));
		s.phone.quaternion.copy(n.holder.quaternion).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.3, Math.PI, 0)));
		drawPhoneThumb(g, scr.w, scr.h, t);
	} else {
		s.phone.position.set(-1.45, deskTop + 0.006, -0.15);
		s.phone.rotation.set(-Math.PI / 2, 0, 0.5);
		if (t < 353.6) drawPhoneThumb(g, scr.w, scr.h, t);
		else { g.fillStyle = '#000'; g.fillRect(0, 0, scr.w, scr.h); }
	}
	scr.tex.needsUpdate = true;
	s.glow.position.copy(s.phone.position).add(V(0, 0.12, 0));
	s.glow.intensity = t >= 303.6 && t < 353.6 ? 1.6 : 0;
	// the CRT: wedding (scene 1), off, then the tape (live), blue screen after 226
	const cg = s.env.crt.ctx;
	if (t < 128.5) { drawWedding(cg, f); s.env.crt.tex.needsUpdate = true; }
	else if (t < 134.6) { cg.fillStyle = '#050505'; cg.fillRect(0, 0, 48, 36); s.env.crt.tex.needsUpdate = true; }
	else if (t < 226) drawCrt(s.env, f, inR(t, 168, 226) ? 0.5 : 0.15);
	else if (t < 250.5) { drawBlue(cg, 48, 36); s.env.crt.tex.needsUpdate = true; }
	else drawCrt(s.env, 0, 0.5); // paused on the doorway
	s.env.crtLight.intensity = t < 128.5 ? 1.2 : t < 134.6 ? 0 : 2.0 + Math.sin(f * 1.7) * 0.25;
	// the PC monitor
	const pc: PcState = t < 86.6 ? 'dashboard' : t < 139.4 ? 'desktop' : t < 226 ? 'capture' : t < 268 ? 'complete' : t < 288 ? 'search' : t < 297 ? 'upload' : 'uploaded';
	const mg = s.env.mon.ctx;
	const tmp = document.createElement('canvas');
	tmp.width = 320;
	tmp.height = 180;
	drawPc(tmp.getContext('2d')!, pc, pcTime(pc, t));
	mg.imageSmoothingEnabled = false;
	mg.drawImage(tmp, 0, 0, 64, 48);
	s.env.mon.tex.needsUpdate = true;
	// light: the lamp at night only, rain everywhere
	s.env.lamp.intensity = t < 128.5 ? 1.6 : 3.2;
	updateRain(s.env, f);
};
const pcTime = (pc: PcState, t: number) => ({dashboard: t - 44, desktop: 0, capture: t - 139.4, complete: 0, search: t - 268, upload: t - 288, uploaded: t - 297, off: 0}[pc]);
/** The phone's own screen when Nico watches the clip: a tiny dark frame, a doorway, a shape. */
const drawPhoneThumb = (g: Ctx, w: number, h: number, t: number) => {
	g.fillStyle = '#20232a';
	g.fillRect(0, 0, w, h);
	g.fillStyle = '#6a6e78';
	g.fillRect(2, 18, w - 4, 36);
	g.fillStyle = '#050505';
	g.fillRect(22, 22, 8, 26);
	g.fillStyle = '#16171a';
	g.fillRect(24, 23, 4, 22);
	g.fillStyle = '#c02020';
	g.fillRect(3, 60, 6, 3);
	g.fillStyle = '#ddd';
	g.fillRect(10, 61, Math.min(24, ((t - 303) / 40) * 24), 1);
};

// ------------------------------------------------------------------ shop shots
type CamKey = {pos: THREE.Vector3; look: THREE.Vector3; fov: number};
type ShopShotDef = {from: number; to: number; cam: (t: number, s: ShopScene) => CamKey; evening?: boolean; figure?: boolean; phone?: boolean};
const headOf = (c: Char, B: Bones) => wp(c.bone(B.head)).add(V(0, 0.05, 0));
const ST = (from: number, to: number, cam: ShopShotDef['cam'], o: Partial<ShopShotDef> = {}): ShopShotDef => ({from, to, cam, evening: from < 128.5, ...o});
const fixed = (pos: THREE.Vector3, look: THREE.Vector3, fov: number, push?: [THREE.Vector3, number]) => (t: number, _s: ShopScene, ) => ({pos: push ? pos.clone().lerp(push[0], ease(clamp(t))) : pos.clone(), look, fov: push ? lerp(fov, push[1], ease(clamp(t))) : fov});
/** Close-ups from where a face actually points: off = (side, up, distance) in the face's own frame. */
const faceCam = (c: Char, B: Bones, off: THREE.Vector3, fov: number): CamKey => {
	const hd = headOf(c, B);
	const mk = c.bone(B.head).getObjectByName('faceFront')!;
	const fwd = wp(mk).sub(wp(c.bone(B.head))).setY(0).normalize();
	const side = new THREE.Vector3().crossVectors(V(0, 1, 0), fwd).normalize();
	return {pos: hd.clone().add(fwd.multiplyScalar(off.z)).add(side.multiplyScalar(off.x)).add(V(0, off.y, 0)), look: hd, fov};
};
const onNico = (off: THREE.Vector3, fov: number) => (t: number, s: ShopScene) => faceCam(s.nico, NICO_B, off, fov);
const onBea = (off: THREE.Vector3, fov: number) => (t: number, s: ShopScene) => faceCam(s.bea, MIX_B, off, fov);
/** A marker in front of the face, riding on the head bone (for face-relative cameras). */
const addFaceMarker = (c: Char, B: Bones) => {
	c.holder.updateMatrixWorld(true);
	const m = new THREE.Object3D();
	m.name = 'faceFront';
	m.position.copy(wp(c.bone(B.head)).add(c.D(0, 0, 0.15)));
	c.holder.parent ? null : null;
	c.bone(B.head).attach(m);
};

const SHOP_SHOTS: ShopShotDef[] = [
	// Scene 1
	ST(44.0, 47.4, fixed(V(0.4, 1.45, 6.4), V(-0.3, 1.0, -1.0), 44, [V(0.3, 1.45, 5.2), 40])),
	ST(47.4, 54.5, fixed(V(1.25, 1.6, 2.7), V(-0.55, 0.95, -1.4), 50, [V(1.05, 1.6, 2.4), 48])),
	ST(54.5, 61.0, onNico(V(0.18, 0.04, 0.6), 32)),
	ST(66.0, 78.0, fixed(V(-0.15, 1.5, 0.25), V(-1.3, 1.0, -0.75), 44, [V(-0.3, 1.45, 0.05), 40])),
	ST(78.0, 84.0, fixed(V(-0.6, 1.25, -0.3), V(1.6, 0.7, -2.2), 48)),
	ST(84.0, 86.4, onBea(V(-0.15, 0.08, 0.7), 30)),
	ST(87.6, 94.0, fixed(V(1.35, 1.15, -2.5), V(-1.0, 1.0, -0.6), 46)),
	ST(94.0, 97.0, onBea(V(0.2, 0.06, 0.7), 30)),
	ST(97.0, 102.6, fixed(V(0.6, 1.6, -2.6), V(-0.2, 0.9, 2.8), 50)),
	ST(105.4, 108.0, fixed(V(-0.2, 1.55, 0.35), V(-1.4, 0.85, -0.5), 42)),
	ST(111.4, 119.0, fixed(V(-1.6, 1.55, 0.75), V(-0.85, 1.05, -0.05), 46)),
	ST(119.0, 124.4, onNico(V(-0.1, 0.0, 0.6), 30)),
	ST(124.4, 128.5, onBea(V(0.1, 0.1, 0.65), 30)),
	// Scene 2
	ST(128.5, 134.0, fixed(V(1.15, 1.62, 2.75), V(-0.55, 0.95, -1.4), 50)),
	ST(134.0, 139.2, onNico(V(0.18, 0.04, 0.6), 32)),
	ST(160.5, 163.0, fixed(V(-1.05, 1.2, -1.75), V(-1.55, 0.86, -1.3), 38)),
	ST(163.0, 168.0, fixed(V(-0.55, 1.35, -0.15), V(1.5, 0.7, -2.0), 48)),
	ST(175.0, 177.3, onNico(V(0.15, 0.02, 0.55), 30)),
	ST(177.3, 179.7, onBea(V(0.0, 0.08, 0.6), 30)),
	ST(179.7, 182.0, onNico(V(0.15, 0.02, 0.55), 30)),
	ST(197.0, 204.0, onNico(V(0.05, 0.0, 0.3), 30)),
	ST(230.0, 233.3, onBea(V(0.0, 0.08, 0.6), 30)),
	ST(233.3, 237.5, onNico(V(0.12, 0.02, 0.6), 32)),
	ST(237.5, 241.9, onBea(V(0.0, 0.08, 0.6), 30)),
	ST(241.9, 245.0, onNico(V(0.12, 0.02, 0.6), 32)),
	ST(245.0, 250.5, fixed(V(-0.3, 1.45, 0.4), V(1.4, 0.6, -2.6), 46)),
	// Scene 3
	ST(250.5, 256.5, fixed(V(-0.85, 1.35, -0.15), V(-1.38, 0.78, -0.62), 34)),
	ST(256.5, 264.5, fixed(V(-0.35, 1.3, -1.65), V(-1.2, 1.05, -0.75), 40)),
	ST(264.5, 268.0, fixed(V(1.15, 1.62, 2.75), V(-0.55, 0.95, -1.4), 50)),
	ST(281.0, 288.0, onNico(V(0.2, 0.04, 0.6), 32)),
	// Scene 4
	ST(303.5, 309.0, onNico(V(0.25, 0.0, 0.6), 32)),
	ST(318.0, 322.0, onNico(V(0.1, -0.02, 0.45), 28)),
	ST(322.0, 328.0, fixed(V(-1.0, 1.35, 0.35), V(1.35, 0.85, -2.8), 46)),
	ST(334.0, 340.0, fixed(V(-0.2, 1.5, 0.9), V(0.6, 0.9, -1.6), 50)),
	ST(340.0, 349.0, fixed(V(1.3, 1.5, -2.55), V(0.2, 1.0, 2.8), 52)),
	ST(349.0, 355.4, fixed(V(-1.35, 1.05, 0.45), V(1.0, 0.0, -2.9), 50)),
];

// phone clip: what the propped phone recorded (episode time tc), shown at full frame
const PHONE_CLIPS: {from: number; to: number; tc: (t: number) => number}[] = [
	{from: 309.0, to: 318.0, tc: (t) => 270 + (t - 309)},
	{from: 328.0, to: 334.0, tc: (t) => 295 + (t - 328)},
];
const PHONE_POS = V(-1.45, 0.98, 0.33), PHONE_LOOK = V(0.4, 0.98, -2.55);

// ------------------------------------------------------------------ the 1991 tape
type Party = {g: THREE.Group; cast: Record<string, Char>; figure: Char; tube: THREE.PointLight; window: THREE.PointLight; hemi: THREE.HemisphereLight; plate: THREE.Mesh; env: THREE.Mesh; cam: THREE.Mesh};
const buildParty = (a: Assets): Party => {
	P.snap = [160, 120];
	const g = new THREE.Group();
	const house = a.glb.dorihome.clone(true);
	psxify(house, P);
	house.traverse((o) => {
		const m = o as THREE.Mesh;
		if (m.isMesh) m.frustumCulled = false;
		if (o.name === 'Door001' || /^couch/.test(o.name) || o.name === 'lilTableXD') o.visible = false;
	});
	g.add(house);
	g.add(box(0.9, 2.0, 1.0, black(), [-2.5, 1.0, -5.5]));
	// the despedida: a long table under a floral plastic cloth, food, a cake, softdrinks, monobloc chairs, the banner
	const cloth = canvasTex(32, 16, (c) => {
		c.fillStyle = '#e9e4da';
		c.fillRect(0, 0, 32, 16);
		const r = prng(3);
		for (let i = 0; i < 22; i++) { c.fillStyle = ['#d0464e', '#3c8a4a', '#e0a63a', '#4a6ad0'][i % 4]; c.fillRect(Math.floor(r() * 32), Math.floor(r() * 16), 2, 2); }
	}, [2, 1]);
	// the long table runs along the left wall (z), Rudy at its head (z = -8.3)
	const T = V(-10.05, 0, -6.8);
	g.add(box(0.9, 0.06, 2.4, lam({map: cloth}), [T.x, 0.74, T.z], 3));
	g.add(box(0.92, 0.25, 2.42, lam({map: cloth}), [T.x, 0.6, T.z], 3));
	for (const [dx, dz] of [[-0.4, -1.1], [0.4, -1.1], [-0.4, 1.1], [0.4, 1.1]]) g.add(box(0.05, 0.72, 0.05, lam({color: '#6a5a4a'}), [T.x + dx, 0.36, T.z + dz]));
	const foodCols = ['#c49a4a', '#e8d8a0', '#7a2a1a', '#d8c070', '#f0e8e0'];
	foodCols.forEach((c, i) => g.add(box(0.22, 0.07, 0.28, lam({color: c}), [T.x + (i % 2 ? 0.15 : -0.15), 0.81, T.z - 0.9 + i * 0.42])));
	g.add(box(0.3, 0.14, 0.3, lam({color: '#f4ece4'}), [T.x, 0.84, T.z + 0.95])); // cake
	for (let i = 0; i < 5; i++) g.add(box(0.07, 0.26, 0.07, lam({color: ['#2a1a12', '#e0402a', '#2a6a2a'][i % 3]}), [T.x + 0.32, 0.9, T.z - 0.6 + i * 0.3]));
	const mono = lam({color: '#e8e4dc'});
	for (let i = 0; i < 4; i++) {
		const cx = T.x + 0.75, cz = T.z - 0.9 + i * 0.6;
		g.add(box(0.42, 0.04, 0.42, mono, [cx, 0.44, cz]));
		g.add(box(0.04, 0.42, 0.42, mono, [cx + 0.2, 0.68, cz]));
	}
	const banner = canvasTex(128, 24, (c) => {
		c.fillStyle = '#e9e3cf';
		c.fillRect(0, 0, 128, 24);
		c.fillStyle = '#b3262c';
		c.font = 'bold 13px monospace';
		c.textAlign = 'center';
		c.fillText('INGAT, TATAY RUDY!', 64, 17);
		c.fillStyle = '#2f5aa8';
		c.fillRect(0, 0, 128, 2);
		c.fillRect(0, 22, 128, 2);
	});
	const bn = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.45), lam({map: banner, side: THREE.DoubleSide}));
	bn.position.set(-10.6, 2.4, -6.8);
	bn.rotation.y = Math.PI / 2;
	g.add(bn);
	// light: the fluorescent tube, and later only the street light through the window
	const tube = new THREE.PointLight('#e8f4e0', 6, 10, 1.3);
	tube.position.set(-7.6, 2.7, -6.6);
	g.add(tube);
	g.add(box(1.2, 0.04, 0.05, new THREE.MeshBasicMaterial({color: '#f0f8ec'}), [-7.6, 2.96, -6.6]));
	const window = new THREE.PointLight('#7a8cb0', 0, 9, 1.2);
	window.position.set(-8.4, 2.0, -3.6);
	g.add(window);
	const hemi = new THREE.HemisphereLight('#4a5048', '#1a1612', 0.35);
	g.add(hemi);
	// the cast
	const cast: Record<string, Char> = {};
	const mk = (n: string, h: number) => {
		const c = makeChar(a.glb[n as 'rudy'], h, {frontRy: -Math.PI / 2});
		g.add(c.holder);
		cast[n] = c;
		return c;
	};
	mk('rudy', 1.7);
	mk('lola', 1.52);
	const jojo = mk('jojo', 1.22);
	jojo.bone(MIX_B.head).scale.setScalar(1.15);
	mk('guest_m1', 1.72);
	mk('guest_m2', 1.66);
	mk('guest_f1', 1.58);
	mk('guest_f2', 1.55);
	// a price tag on Rudy's sleeve, Lola's envelope, JoJo's paper plate, the camcorder in hands
	const tag = box(0.03, 0.04, 0.005, new THREE.MeshBasicMaterial({color: '#f4f4f0'}), [0, 0, 0]);
	cast.rudy.bone(MIX_B.ua('l')).add(tag);
	tag.position.set(0, 12, 6);
	const envM = envelope();
	g.add(envM);
	const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.015, 8), lam({color: '#f2f0ea'}));
	g.add(plate);
	const camM = box(0.12, 0.12, 0.26, lam({color: '#1a1a1c'}), [0, 0, 0]);
	g.add(camM);
	camM.visible = false;
	const figure = makeChar(a.glb.figure_base, 1.97, {material: lam({color: '#1d1f23'}), frontRy: Math.PI / 2});
	figure.holder.position.set(-3.3, 0, -5.5);
	figure.holder.rotation.y = Math.atan2(SETDOWN.pos.x + 3.3, SETDOWN.pos.z + 5.5); // facing the lens on the cabinet
	figure.holder.updateMatrixWorld(true);
	reset(figure);
	for (const s of SIDES) {
		figure.bone(MIX_B.fa(s)).scale.setScalar(1.28);
		ik(figure.bone(MIX_B.ua(s)), figure.bone(MIX_B.fa(s)), figure.bone(MIX_B.hand(s)), wp(figure.bone(MIX_B.ua(s))).add(figure.D(sx(s) * 0.1, -0.95, 0.02)), figure.D(0, 0, -1));
	}
	rotW(figure.bone(MIX_B.head), figure.D(0, 0, 1), 0.08);
	g.add(figure.holder);
	return {g, cast, figure, tube, window, hemi, plate, env: envM, cam: camM};
};

// tape-time staging. Positions in the DoriHome living room (three.js coordinates).
const TP = {
	rudyHead: V(-10.0, 0, -8.45), lolaIn: V(-7.0, 0, -8.2), lolaAt: V(-9.45, 0, -8.15), lolaLater: V(-8.95, 0, -7.35), guestA: V(-9.3, 0, -5.7), guestB: V(-8.35, 0, -6.0), guestC: V(-8.1, 0, -8.35), guestD: V(-7.7, 0, -7.0),
	door: V(-4.5, 0, -3.3), jojo: V(-8.75, 0, -6.75), tito: V(-8.3, 1.55, -4.5), rudyCam: V(-10.0, 1.35, -8.25),
};
// the camcorder set down on the radio cabinet: the family centre frame, the kitchen doorway at frame left
const SETDOWN = {pos: V(-9.0, 0.95, -10.2), look: V(-5.5, 1.1, -3.6)};
const GROUP = [V(-6.85, 0, -6.1), V(-7.3, 0, -6.55), V(-6.4, 0, -6.6), V(-7.55, 0, -5.9), V(-6.95, 0, -5.55), V(-6.2, 0, -5.95), V(-7.7, 0, -6.95)];
const faceTo = (c: Char, from: THREE.Vector3, to: THREE.Vector3) => { c.holder.rotation.set(0, Math.atan2(to.x - from.x, to.z - from.z), 0); };
/** Everything in the 1991 room at tape time tt. Returns the camcorder pose and whether the flash fires. */
const performParty = (p: Party, tt: number) => {
	const C = p.cast;
	const place = (c: Char, at: THREE.Vector3, to: THREE.Vector3) => { c.holder.position.copy(at); faceTo(c, at, to); c.holder.visible = true; c.holder.updateMatrixWorld(true); };
	// group photo / mingling / leaving / coming back
	const out = tt >= 108 && tt < 160, back = tt >= 160;
	const walkOut = (c: Char, from: THREE.Vector3, t0: number) => {
		const p2 = kv(tt, [[t0, from], [t0 + 5.5, TP.door]]);
		place(c, p2, TP.door);
		c.holder.visible = tt < t0 + 5.4;
		poseWalk(c, MIX_B, tt * 6.5);
	};
	const walkIn = (c: Char, to: THREE.Vector3, t0: number, exitAt: number) => {
		const p2 = kv(tt, [[t0, TP.door], [t0 + 2.2, V(-3.75, 0, -5.4)], [t0 + 4.5, to], [exitAt, to], [exitAt + 3.5, V(-9.9, 0, -4.2)]]);
		const moving = tt < t0 + 4.5 || tt > exitAt;
		place(c, p2, tt > exitAt ? V(-9.6, 0, -5.4) : moving ? to : SETDOWN.pos);
		c.holder.visible = tt >= t0 && tt < exitAt + 3.4;
		if (moving) poseWalk(c, MIX_B, tt * 6.5); else poseStand(c, MIX_B, {yaw: 0.2});
	};
	const names = ['rudy', 'lola', 'jojo', 'guest_m1', 'guest_m2', 'guest_f1', 'guest_f2'];
	if (tt < 33) {
		// at the table: Rudy at its head facing the camera; guests seen from behind; Lola comes in
		place(C.rudy, TP.rudyHead, TP.tito);
		if (tt < 17.3) {
			const cover = tt < 6 ? kn(tt, [[0, 0], [1.6, 1], [4.2, 1], [5.4, 0]]) : 0;
			blendPose(C.rudy, () => poseStand(C.rudy, MIX_B, {}), () => { poseStand(C.rudy, MIX_B, {pitch: 0.2}); for (const s of SIDES) hand(C.rudy, MIX_B, s, wp(C.rudy.bone(MIX_B.head)).add(C.rudy.D(sx(s) * 0.04, -0.02, 0.1)), C.rudy.D(sx(s), -1, 0)); }, cover);
			if (inR(tt, 10, 13)) hand(C.rudy, MIX_B, 'r', wp(C.rudy.bone(MIX_B.chest)).add(C.rudy.D(-0.06, 0.02, 0.12)));
		} else {
			// Rudy holds the camcorder (it is "our" view now): keep him out of shot, at the camera
			C.rudy.holder.visible = false;
		}
		place(C.guest_m1, TP.guestA, TP.rudyHead);
		place(C.guest_f1, TP.guestB, TP.rudyHead);
		place(C.guest_m2, TP.guestC, TP.rudyHead);
		place(C.guest_f2, TP.guestD, TP.rudyHead);
		for (const n of ['guest_m1', 'guest_f1', 'guest_m2', 'guest_f2']) {
			const wave = tt < 6 ? kn(tt, [[0.5, 0], [2, 1], [5, 1], [6, 0]]) : 0;
			const c = C[n];
			blendPose(c, () => poseStand(c, MIX_B, {}), () => { poseStand(c, MIX_B, {}); hand(c, MIX_B, 'r', wp(c.bone(MIX_B.ua('r'))).add(c.D(-0.15, 0.5 + Math.sin(tt * 9 + n.length) * 0.05, 0.15)), c.D(-1, 0, -0.5)); }, wave);
		}
		const lp = kv(tt, [[5.4, TP.lolaIn], [7.6, TP.lolaAt], [16, TP.lolaAt], [17.5, TP.lolaLater]]);
		place(C.lola, lp, tt < 16 ? TP.rudyHead : TP.rudyCam);
		if (tt < 7.6 || inR(tt, 16, 17.5)) poseWalk(C.lola, MIX_B, tt * 6); else poseStand(C.lola, MIX_B, {pitch: 0.15});
		if (inR(tt, 7.6, 10.2)) hand(C.lola, MIX_B, 'r', wp(C.lola.bone(MIX_B.chest)).add(C.lola.D(0, -0.1, 0.32)));
		place(C.jojo, TP.jojo, TP.rudyCam);
		poseStand(C.jojo, MIX_B, {yaw: 0, pitch: -0.1});
		for (const s of SIDES) hand(C.jojo, MIX_B, s, wp(C.jojo.bone(MIX_B.chest)).add(C.jojo.D(sx(s) * 0.07, -0.12, 0.2)));
		p.env.visible = inR(tt, 6.4, 11.5);
		if (p.env.visible) p.env.position.copy(wp(C.lola.bone(MIX_B.hand('r'))));
	} else if (!out && !back) {
		// the set-down photo (33-40) and mingling until they go outside (108)
		const spots = GROUP;
		names.forEach((n, i) => {
			const c = C[n];
			const at = n === 'rudy' ? kv(tt, [[33, V(-8.4, 0, -8.6)], [34.6, spots[0]]]) : spots[i];
			place(c, at, SETDOWN.pos);
			if (n === 'rudy' && tt < 34.6) { faceTo(c, at, spots[0]); c.holder.updateMatrixWorld(true); poseWalk(c, MIX_B, tt * 9); }
			else poseStand(c, MIX_B, {yaw: Math.sin(tt * 0.3 + i) * 0.15});
		});
		C.jojo.holder.position.y = 0;
		if (tt > 104) { /* "Sa labas tayo!" — they start turning to the door */ }
	} else if (out) {
		names.forEach((n, i) => walkOut(C[n], GROUP[i], 108 + i * 0.9));
	} else {
		// back in from the drizzle, past the kitchen doorway; JoJo waves at the camera; then they leave by the far side
		names.forEach((n, i) => {
			if (n === 'jojo') return;
			walkIn(C[n], V(-5.6 - i * 0.3, 0, -6.6 - i * 0.25), 160 + i * 0.7, 165 + i * 0.4);
		});
		const j = C.jojo;
		const jstop = V(-8.3, 0, -8.7);
		const jp = kv(tt, [[160.5, TP.door], [161.8, V(-3.75, 0, -5.4)], [163.4, jstop], [165.2, jstop], [167.5, V(-9.9, 0, -4.2)]]);
		place(j, jp, tt < 163.4 ? jstop : tt < 165.2 ? SETDOWN.pos : V(-9.9, 0, -4.2));
		j.holder.visible = tt >= 160.5 && tt < 167.4;
		if (inR(tt, 163.4, 165.2)) { poseStand(j, MIX_B, {pitch: -0.3}); hand(j, MIX_B, 'r', wp(j.bone(MIX_B.ua('r'))).add(j.D(-0.1, 0.42, 0.15 + Math.sin(tt * 14) * 0.05)), j.D(-1, 0, -0.5)); }
		else poseWalk(j, MIX_B, tt * 8);
	}
	// lights: the tube goes off at 168.6, then only the street light through the window
	const dark = tt >= 168.6;
	p.tube.intensity = dark ? 0 : 6 + (Math.floor(tt * 10) % 13 === 0 ? -1.2 : 0);
	p.window.intensity = dark ? 7 : 0;
	p.hemi.intensity = dark ? 0.05 : 0.35;
	// the figure: always in the kitchen doorway; near-black until the light changes, a thin outline after
	(p.figure.root.children[0] as THREE.Object3D) && p.figure.root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) (m.material as THREE.MeshLambertMaterial).color.set(dark ? '#3a4050' : '#1d1f23'); });
	p.plate.visible = tt < 33 || back;
	if (p.plate.visible) { const hl = wp(C.jojo.bone(MIX_B.hand('l'))); p.plate.position.copy(hl).add(V(0, 0.03, 0)); }
	// the camcorder's view
	let pos: THREE.Vector3, lk: THREE.Vector3, fov = 54, roll = 0;
	if (tt < 14.4) {
		pos = kv(tt, [[0, TP.tito], [6, V(-8.45, 1.55, -4.9)], [14.4, V(-8.6, 1.5, -5.3)]]).add(drift(tt * 30, 0.03, 1));
		lk = kv(tt, [[0, V(-9.2, 1.2, -5.8)], [3, V(-10.0, 1.45, -8.45)], [6.2, V(-9.6, 1.3, -8.2)], [14.4, V(-10.0, 1.45, -8.45)]]).add(drift(tt * 30 + 50, 0.05, 2));
		roll = Math.sin(tt * 1.3) * 0.03;
	} else if (tt < 17.3) {
		// the hand-over: a whip across the ceiling tube, hands fumbling
		const u = (tt - 14.4) / 2.9;
		pos = V(-8.6, 1.5, -5.3).lerp(TP.rudyCam, ease(u));
		lk = kv(tt, [[14.4, V(-10.0, 1.45, -8.45)], [15.2, V(-8.0, 3.2, -6.8)], [16.1, V(-7.6, 2.6, -6.0)], [17.3, V(-9.2, 1.1, -6.6)]]);
		roll = Math.sin(u * 9) * 0.25;
	} else if (tt < 32) {
		// Rudy films his family: lower, unsteady, a loving hold on Lola, then JoJo with his spaghetti
		pos = TP.rudyCam.clone().add(drift(tt * 30, 0.05, 3));
		lk = kv(tt, [[17.3, V(-9.2, 1.1, -6.6)], [19, wp(C.lola.bone(MIX_B.head))], [24.6, wp(C.lola.bone(MIX_B.head))], [26, wp(C.jojo.bone(MIX_B.head))], [29, wp(C.jojo.bone(MIX_B.head))], [32, V(-9.0, 1.0, -6.4)]]).add(drift(tt * 30 + 9, 0.06, 4));
		fov = kn(tt, [[17.3, 54], [20, 40], [24.6, 40], [26, 34], [29, 34], [31, 54]]);
		roll = Math.sin(tt * 1.7) * 0.06;
	} else if (tt < 33) {
		const u = tt - 32;
		pos = TP.rudyCam.clone().lerp(SETDOWN.pos, ease(u));
		lk = V(-9.0, 1.0, -6.4).lerp(SETDOWN.look, ease(u)).add(V(0, -0.8 * Math.sin(u * Math.PI), 0));
		roll = Math.sin(u * Math.PI) * 0.4 + ease(u) * 0.07;
	} else {
		pos = SETDOWN.pos.clone();
		lk = SETDOWN.look.clone();
		roll = 0.07; // set down slightly crooked
	}
	const flash = (tt >= 36.3 && tt < 36.37) || false;
	return {pos, look: lk, fov, roll, flash};
};

/** Episode time → tape time, plus how the tape is being played (for the overlay). */
type TapeView = {tt: number; mode: 'play' | 'ff' | 'rew' | 'step' | 'pause'; stamp: string; zoom: number; hunt: number};
const tapeView = (t: number): TapeView => {
	const stamp = (tt: number) => {
		const base = tt < 100 ? 8 * 60 + 12 + tt / 60 : 8 * 60 + 31 + (tt - 105) / 60;
		const m = Math.floor(base) % 60, h = Math.floor(base / 60);
		return `JUN.14 1991 ${h}:${String(m).padStart(2, '0')}PM`;
	};
	if (t < 40.4) return {tt: t, mode: 'play', stamp: stamp(t), zoom: 1, hunt: 0};
	if (t < 145) { const tt = lerp(41, 104, (t - 141) / 4); return {tt, mode: 'ff', stamp: stamp(tt), zoom: 1, hunt: 0}; }
	if (t < 182) {
		const tt = t - 41;
		const hunt = inR(t, 158, 163) ? Math.abs(Math.sin((t - 158) * 3.1)) * 1.6 : 0;
		const zoom = t >= 168 ? 1 + ease((t - 168) / 7) * 1.4 : 1;
		return {tt, mode: 'play', stamp: stamp(tt), zoom, hunt};
	}
	if (t < 188.4) { const tt = lerp(141, 32.8, (t - 182) / 6.4); return {tt, mode: 'rew', stamp: stamp(tt), zoom: 1, hunt: 0}; }
	if (t < 192.4) { const tt = t - 155.6; return {tt, mode: 'play', stamp: stamp(tt), zoom: 1, hunt: 0}; }
	if (t < 197) { const steps = [36.0, 36.1, 36.2, 36.3]; const tt = steps[Math.min(3, Math.floor((t - 192.4) / 1.3))] + (t >= 196.3 ? 0.01 : 0); return {tt, mode: 'step', stamp: stamp(tt), zoom: 1, hunt: 0}; }
	const tt = t - 44;
	return {tt, mode: 'play', stamp: stamp(tt), zoom: 1, hunt: 0};
};
// which episode spans show the tape full screen
const TAPE_SPANS: [number, number][] = [[0, 40.4], [141, 158], [158, 160.5], [168, 175], [182, 197], [204, 226]];

// ------------------------------------------------------------------ components
const ShopShot: React.FC<{a: Assets; def: ShopShotDef}> = ({a, def}) => {
	const frame = useCurrentFrame();
	const t = def.from + frame / EP01_FPS;
	const s = useMemo(() => buildShopScene(a, !!def.evening, !!def.figure), [a, def]);
	performNico(s, a, t);
	performBea(s, a, t);
	performProps(s, t, F(t));
	const cam = def.cam((t - def.from) / (def.to - def.from), s);
	return (
		<>
			<FogBg color={def.evening ? '#1a1e28' : '#020203'} near={def.evening ? 6 : 4} far={def.evening ? 18 : 13} />
			<Cam pos={cam.pos} look={cam.look} fov={cam.fov} />
			<primitive object={s.env.group} />
		</>
	);
};

const PhoneClip: React.FC<{a: Assets; tc: (t: number) => number; from: number}> = ({a, tc, from}) => {
	const frame = useCurrentFrame();
	const t = from + frame / EP01_FPS;
	const s = useMemo(() => buildShopScene(a, false, true), [a]);
	const tcv = tc(t);
	performNico(s, a, tcv);
	performBea(s, a, tcv);
	performProps(s, tcv, F(tcv));
	s.phone.visible = false;
	// the figure: still; its head tilts when Nico (in the clip) clicks UPLOAD (297)
	if (s.figure) {
		reset(s.figure);
		for (const sd of SIDES) {
			s.figure.bone(MIX_B.fa(sd)).scale.setScalar(1.28);
			ik(s.figure.bone(MIX_B.ua(sd)), s.figure.bone(MIX_B.fa(sd)), s.figure.bone(MIX_B.hand(sd)), wp(s.figure.bone(MIX_B.ua(sd))).add(s.figure.D(sx(sd) * 0.1, -0.95, 0.02)), s.figure.D(0, 0, -1));
		}
		rotW(s.figure.bone(MIX_B.head), s.figure.D(0, 0, 1), kn(tcv, [[297, 0.05], [300, 0.55]]));
	}
	return (
		<>
			<FogBg color="#020203" near={4} far={13} />
			<Cam pos={PHONE_POS} look={PHONE_LOOK} fov={52} />
			<primitive object={s.env.group} />
		</>
	);
};

const TapeScene: React.FC<{a: Assets; from: number}> = ({a, from}) => {
	const frame = useCurrentFrame();
	const t = from + frame / EP01_FPS;
	const p = useMemo(() => buildParty(a), [a]);
	const v = tapeView(t);
	const c = performParty(p, v.tt);
	if (c.flash || (v.mode === 'step' && t >= 196.3)) { p.tube.intensity = 16; p.figure.root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) (m.material as THREE.MeshLambertMaterial).color.set('#3a3f4a'); }); }
	return (
		<>
			<FogBg color="#05070a" near={6} far={16} />
			<Cam pos={c.pos} look={c.look} fov={c.fov / v.zoom} roll={c.roll} />
			<primitive object={p.g} />
		</>
	);
};

/** A small canvas drawn every frame and shown pixelated at 1920x1080 (PC inserts, paper inserts). */
const Flat: React.FC<{draw: (g: Ctx) => void; w?: number; h?: number; bars?: boolean}> = ({draw, w = 320, h = 180, bars = true}) => {
	const ref = useRef<HTMLCanvasElement>(null);
	const frame = useCurrentFrame();
	useLayoutEffect(() => { const g = ref.current!.getContext('2d')!; g.clearRect(0, 0, w, h); draw(g); }, [frame, draw, w, h]);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<canvas ref={ref} width={w} height={h} style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, imageRendering: 'pixelated'}} />
			{bars ? <Letterbox /> : null}
		</AbsoluteFill>
	);
};

const Caption: React.FC<{t: number}> = ({t}) => {
	const c = (captions as unknown as [number, number, string][]).find(([a, b]) => t >= a && t < b);
	if (!c) return null;
	const tape = c[2].startsWith('[');
	return (
		<div style={{position: 'absolute', left: 0, right: 0, bottom: 14, textAlign: 'center', color: '#f2efe6', fontFamily: 'Georgia, serif', fontStyle: tape ? 'italic' : 'normal', fontSize: 40, textShadow: '0 0 6px #000, 2px 2px 0 #000'}}>
			{c[2]}
		</div>
	);
};

export const Episode01: React.FC<{audio?: boolean; from?: number; to?: number}> = ({audio = true}) => {
	const frame = useCurrentFrame();
	const t = frame / EP01_FPS;
	const a = useAssets();
	if (!a) return <AbsoluteFill style={{background: '#000'}} />;
	const seq = (from: number, to: number, node: React.ReactNode, key: string) => (
		<Sequence key={key} from={F(from)} durationInFrames={Math.max(1, F(to) - F(from))}>{node}</Sequence>
	);
	const tv = tapeView(t);
	const huntPx = tv.hunt * 1.5;
	const tapeNode = (from: number, to: number) => seq(from, to, (
		<AbsoluteFill style={{background: '#000'}}>
			<Pixel w={320} h={240} k={4.5} style={{filter: `blur(${huntPx.toFixed(2)}px) contrast(1.1) saturate(0.8)${tv.mode === 'step' && t >= 196.3 ? ' brightness(1.6)' : ''}`}}>
				<TapeScene a={a} from={from} />
			</Pixel>
			<TapeOverlay f={frame} stamp={tv.stamp} />
			{tv.mode !== 'play' ? <div style={{position: 'absolute', left: 300, top: 130, color: '#f2f2f2', fontFamily: 'monospace', fontWeight: 700, fontSize: 52, textShadow: '4px 4px 0 #000'}}>{tv.mode === 'ff' ? '▶▶' : tv.mode === 'rew' ? '◀◀' : '❚❚ ▶'}</div> : null}
			{tv.mode === 'ff' || tv.mode === 'rew' ? [0.2, 0.55, 0.8].map((y, i) => <div key={i} style={{position: 'absolute', left: 240, top: ((y * 1080 + frame * 37 * (i + 1)) % 1080), width: 1440, height: 30, background: 'rgba(230,230,230,0.35)'}} />) : null}
		</AbsoluteFill>
	), `tape${from}`);
	const nodes: React.ReactNode[] = [];
	for (const [a0, b0] of TAPE_SPANS) nodes.push(tapeNode(a0, b0));
	// the flash: two white frames over the tape
	nodes.push(seq(36.3, 36.37, <AbsoluteFill style={{background: 'rgba(255,255,250,0.35)', left: 240, width: 1440}} />, 'flash'));
	// title
	nodes.push(seq(41.0, 43.6, <AbsoluteFill style={{background: '#000', justifyContent: 'center', alignItems: 'center'}}><div style={{color: '#e8e8e2', fontFamily: 'monospace', fontSize: 34, letterSpacing: 14}}>TRANSFERS</div></AbsoluteFill>, 'title'));
	for (const d of SHOP_SHOTS) nodes.push(seq(d.from, d.to, <AbsoluteFill style={{background: '#000'}}><Pixel w={640} h={360} k={3}><ShopShot a={a} def={d} /></Pixel><Letterbox /></AbsoluteFill>, `shop${d.from}`));
	for (const pc of PHONE_CLIPS) nodes.push(seq(pc.from, pc.to, (
		<AbsoluteFill style={{background: '#000'}}>
			<Pixel w={640} h={360} k={3} style={{filter: `blur(${(Math.abs(Math.sin(t * 2.3)) * 0.9).toFixed(2)}px)`}}><PhoneClip a={a} tc={pc.tc} from={pc.from} /></Pixel>
			<div style={{position: 'absolute', left: 60, top: 40, color: '#fff', fontFamily: 'sans-serif', fontSize: 34}}><span style={{color: '#e02020'}}>●</span> {(() => { const s = pc.tc(t) - 258.2; return `00:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s) % 60).padStart(2, '0')}`; })()}</div>
		</AbsoluteFill>
	), `phone${pc.from}`));
	// PC and paper inserts
	const pcIns = (from: number, to: number, st: PcState, t0: number) => nodes.push(seq(from, to, <Flat draw={(g) => drawPc(g, st, t - t0)} />, `pc${from}`));
	pcIns(61.0, 66.0, 'dashboard', 61);
	pcIns(86.4, 87.6, 'desktop', 86.4);
	pcIns(139.2, 141.0, 'capture', 139.4);
	pcIns(226.0, 230.0, 'complete', 226);
	pcIns(268.0, 281.0, 'search', 268);
	pcIns(288.0, 297.2, 'upload', 288);
	pcIns(297.2, 303.5, 'uploaded', 297.2);
	nodes.push(seq(102.6, 105.4, <Flat draw={(g) => drawPaper(g, 'waybill', t - 102.6)} />, 'waybill'));
	nodes.push(seq(108.0, 109.6, <Flat draw={(g) => drawPaper(g, 'card', t - 108)} />, 'card'));
	nodes.push(seq(109.6, 111.4, <Flat draw={(g) => drawPaper(g, 'money', t - 109.6)} />, 'money'));
	// end card
	nodes.push(seq(356.0, 360, <AbsoluteFill style={{background: '#000', justifyContent: 'center', alignItems: 'center'}}><div style={{color: '#d8d8d0', fontFamily: 'monospace', fontSize: 32, letterSpacing: 6}}>TRANSFERS — 1 — "Bayad Na"</div></AbsoluteFill>, 'end'));
	return (
		<AbsoluteFill style={{background: '#000'}}>
			{nodes}
			<Caption t={t} />
			{audio ? <Audio src={staticFile('assets/audio/transfers/ep01-mix/transfers-ep01-mix-v1.m4a')} /> : null}
		</AbsoluteFill>
	);
};
