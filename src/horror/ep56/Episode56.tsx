// Episode 56: "The Music in the Forest" (Season 6: students on a village posting in East Java; past the forest
// gate, gamelan where no one lives; retold in our own words from a thread shared online; no village is named).
// English, Jack. The PSX models; a score of its own; a seamless loop (the last moments are the first).
// Form: "a single unbroken take": one torch walk, my eyes and the beam together, following the music and my
// friend through the gate into the forest. No cuts until the loop.
// Mechanism: the lure (the music calls you to it). Gore: my friend's arm swollen black with bites, snakes from
// under his sarong. His fate is left open. Cast: her, Character_Monster_07 dressed as a dancer; my friend,
// Character_10.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import timeline from '../../data/ep56-forest-v1-timeline.json';
import {rng} from '../ps1';
import {handheld} from '../entities';
import {Dancer, Forest, Friend, MatsProvider, pathX, STREAM_Z, V3} from './world';

export const LW = 180;
export const LH = 320;
const SCALE = 6;
export const ep56Config = {durationInFrames: timeline.duration_frames, fps: 30, width: 1080, height: 1920};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lin = (t: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(t, [a, b], [v0, v1], cl);
const ease = (x: number) => x * x * (3 - 2 * x);
const L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
const DUR = timeline.duration_seconds;

// ------------------------------------------------------------------ key times (scripts/ep56_sound.py reads the same rules)
export const K = {
	music: L.l01.end - 2.2, // the gamelan starts, past the gate
	walk: L.l01.end + 0.3, // through the gate
	swings: [L.l03.start - 1.4, L.l03.start + 1.6, L.l03.start + 4.6], // the torch goes off into the trees and back (0.6 out, 0.3, 0.6 back)
	stop: L.l04.start - 1.4, // she is in the path; I stop
	feet: L.l04.start - 0.6, // the torch drops to her feet
	reach: L.l04.start + 2.4, // her arms reach for the light
	gone: L.l04.end + 0.45, // the torch dies a moment; she is gone; the music stops dead
	walk2: L.l04.end + 0.9,
	gong: L.l05.start - 0.35, // at the stream: the torch finds him (the gong)
	rise: L.l06.start + 0.6, // the torch rises from him
	end: L.l06.end + 0.25, // she is holding him; the gamelan crashes back in (stinger)
	loopShot: DUR - 1.6,
};
export const STINGERS = [K.gong, K.end];
const SW = (k: number) => K.swings[k];
// how far the beam has swung out into the trees (0..1)
const swingOut = (t: number) => Math.max(0, ...K.swings.map((s) => ease(lin(t, s, s + 0.6)) * (1 - ease(lin(t, s + 0.9, s + 1.5)))));

// ------------------------------------------------------------------ the walk (one take)
const FRIEND_SIT: V3 = [pathX(STREAM_Z - 0.4) - 0.1, -0.3, STREAM_Z - 0.4];
const CAM_END_Z = STREAM_Z + 2.1;
const walkSpeed = (t: number) => {
	if (t < K.walk) return 0.12; // edging up to the gate
	if (t < K.stop) return 1.0;
	if (t < K.walk2) return 0;
	return 1.0;
};
const T0 = -4, DT = 1 / 60;
const Z_TABLE = (() => {
	const n = Math.ceil((DUR + 2 - T0) / DT);
	const a = new Float64Array(n + 1);
	for (let i = 1; i <= n; i++) a[i] = a[i - 1] + walkSpeed(T0 + (i - 0.5) * DT) * DT;
	return a;
})();
const rawDist = (t: number) => {
	const x = (t - T0) / DT;
	const i = Math.max(0, Math.min(Z_TABLE.length - 2, Math.floor(x)));
	return Z_TABLE[i] + (Z_TABLE[i + 1] - Z_TABLE[i]) * (x - i);
};
// scale the walk so I arrive at the stream bank as the torch finds him
const Z_START = 2.4;
const SCALE_WALK = (Z_START - CAM_END_Z) / (rawDist(K.gong - 0.6) - rawDist(0));
const camZ = (t: number) => Math.max(CAM_END_Z, Z_START - (rawDist(t) - rawDist(0)) * SCALE_WALK);
const camPos = (t: number): V3 => {
	const z = camZ(t);
	const h = handheld(t * 1.1, 0.35);
	const moving = walkSpeed(t) > 0.5 ? 1 : 0.25;
	const bob = 0.03 * Math.sin((t + 600) * 9.4) * moving;
	return [pathX(z) + h.dp[0] * 0.08, 1.58 + bob + h.dp[1] * 0.05, z];
};

// where she is
type HerAt = {p: V3; ry: number; reach?: number; hold?: number; look?: number} | null;
const her = (t: number): HerAt => {
	if (t < K.walk) {
		// the hook: past the gate, in the black, in the dance
		const z = -5.8;
		return {p: [pathX(z) + 0.6, 0, z], ry: 0.15};
	}
	// each time the beam comes back, she is in the path ahead, nearer
	const dists = [11, 7.5, 4.8];
	for (let k = 2; k >= 0; k--) {
		if (t >= SW(k) + 0.6 && (k === 2 ? t < K.stop : t < SW(k + 1) + 0.6)) {
			const z = camZ(SW(k) + 0.6) - dists[k];
			return {p: [pathX(z) + 0.55 - 0.15 * k, 0, z], ry: 0.1};
		}
	}
	if (t >= K.stop && t < K.gone) {
		const z = camZ(K.stop) - 4.4;
		return {p: [pathX(z) + 0.15, 0, z], ry: 0, reach: ease(lin(t, K.reach, K.gone - 0.2))};
	}
	if (t >= K.rise - 0.3) {
		// behind him in the stream, her arms round him, looking at me
		// on the last beat she comes forward over him, at the light
		const lunge = ease(lin(t, K.end - 0.08, K.end + 0.22));
		return {p: [FRIEND_SIT[0] + 0.05, -0.35 + 0.15 * lunge, FRIEND_SIT[2] - 0.5 + 1.25 * lunge], ry: 0, hold: 1, look: lunge};
	}
	return null;
};

// what the torch (and my eyes) are on
const look = (t: number): V3 => {
	const z = camZ(t);
	const ahead: V3 = [pathX(z - 7), 0.95, z - 7];
	if (t < K.walk) {
		// the gate, and the black between its pillars
		return [pathX(-6) + 0.3, 1.35, -6];
	}
	const sw = swingOut(t);
	const into: V3 = [pathX(z - 3) + 5.5, 1.3, z - 3];
	let p: V3 = [ahead[0] + (into[0] - ahead[0]) * sw, ahead[1] + (into[1] - ahead[1]) * sw, ahead[2] + (into[2] - ahead[2]) * sw];
	if (t >= K.stop - 0.4 && t < K.walk2) {
		const h = her(Math.min(t, K.gone - 0.05))!;
		const feet: V3 = [h.p[0], 0.15, h.p[2]];
		const face: V3 = [h.p[0], 1.45, h.p[2]];
		const k1 = ease(lin(t, K.feet, K.feet + 0.9));
		const k2 = ease(lin(t, K.reach - 0.6, K.reach + 1.4));
		const body: V3 = [h.p[0], 1.1, h.p[2]];
		const a = k1 < 1 ? [body, feet, k1] : [feet, face, k2];
		const [u, v, k] = a as [V3, V3, number];
		const tgt: V3 = [u[0] + (v[0] - u[0]) * k, u[1] + (v[1] - u[1]) * k, u[2] + (v[2] - u[2]) * k];
		const kin = ease(lin(t, K.stop - 0.4, K.stop + 0.3));
		p = [p[0] + (tgt[0] - p[0]) * kin, p[1] + (tgt[1] - p[1]) * kin, p[2] + (tgt[2] - p[2]) * kin];
	}
	if (t >= K.gong - 0.8) {
		// down to him in the stream; along his arm; to the sarong; then up, to her
		const kin = ease(lin(t, K.gong - 0.8, K.gong));
		const arm: V3 = [FRIEND_SIT[0] - 0.35, 0.25, FRIEND_SIT[2] + 0.1];
		const lap: V3 = [FRIEND_SIT[0] - 0.05, 0.05, FRIEND_SIT[2] - 0.25];
		const faceH: V3 = [FRIEND_SIT[0] + 0.05, 1.5, FRIEND_SIT[2] - 0.5];
		const k2 = ease(lin(t, L.l05.start + 3.0, L.l05.start + 4.4));
		const k3 = ease(lin(t, K.rise, K.rise + 2.2));
		let tgt: V3 = [arm[0] + (lap[0] - arm[0]) * k2, arm[1] + (lap[1] - arm[1]) * k2, arm[2] + (lap[2] - arm[2]) * k2];
		tgt = [tgt[0] + (faceH[0] - tgt[0]) * k3, tgt[1] + (faceH[1] - tgt[1]) * k3, tgt[2] + (faceH[2] - tgt[2]) * k3];
		p = [p[0] + (tgt[0] - p[0]) * kin, p[1] + (tgt[1] - p[1]) * kin, p[2] + (tgt[2] - p[2]) * kin];
	}
	return p;
};

// the torch: steady, flickering when it dies on her
const torchOn = (t: number) => {
	if (t >= K.gone && t < K.gone + 0.35) return 0;
	if (t >= K.gone - 0.25 && t < K.gone) return rng(Math.floor((t + 600) * 30) * 31 + 7)() > 0.5 ? 1 : 0.2;
	if (t >= K.end && t < K.end + 0.12) return 0.3;
	return 1;
};

// ------------------------------------------------------------------ the scene
const Scene: React.FC<{t: number}> = ({t}) => {
	const {camera} = useThree();
	const torch = useRef<THREE.SpotLight>(null);
	const aim = () => {
		const p = camPos(t), l = look(t);
		camera.position.set(...p);
		camera.up.set(0, 1, 0);
		camera.lookAt(...l);
		const c = camera as THREE.PerspectiveCamera;
		c.fov = 62;
		c.near = 0.05;
		c.far = 60;
		c.updateProjectionMatrix();
		if (torch.current) {
			torch.current.position.set(p[0] + 0.15, p[1] - 0.25, p[2]);
			torch.current.target.position.set(...l);
			torch.current.target.updateMatrixWorld();
		}
	};
	useFrame(aim);
	aim();
	const h = her(t);
	const on = torchOn(t);
	// my friend: ahead on the path, falling behind the dark as the music pulls him on; then in the stream
	const fz = camZ(t) - (4.2 + 9 * ease(lin(t, L.l03.start, K.stop)));
	const showFriendWalking = t >= K.walk - 1.5 && t < K.stop && t < K.gong - 2;
	const beat = 60 / 72; // the gamelan's pulse (sound: the same tempo)
	return (
		<>
			<color attach="background" args={['#020403']} />
			<fog attach="fog" args={['#030806', 2.5, 15]} />
			<ambientLight intensity={0.55} color="#18241c" />
			{/* the torch, and the light it throws back off whatever it is on */}
			<spotLight ref={torch} intensity={46 * on} distance={16} angle={0.42} penumbra={0.55} decay={1.2} color="#fff0d0" />
			<pointLight position={[look(t)[0], look(t)[1] + 0.3, look(t)[2] + 0.8]} intensity={2.4 * on} distance={3.6} decay={1} color="#ffe8c0" />
			<Forest />
			{showFriendWalking && <Friend p={[pathX(fz), 0, fz]} ry={Math.PI} walk={((t + 600) * Math.PI) / beat} tilt={ease(lin(t, L.l02.start + 2.5, L.l02.end))} t={t} />}
			{t >= K.gong - 2 && <Friend p={FRIEND_SIT} ry={Math.PI} sit t={t} />}
			{h && on > 0.1 && <Dancer p={h.p} ry={h.ry} phase={(t + 600) * 0.9} reach={h.reach} hold={h.hold} look={h.look} />}
		</>
	);
};

// ------------------------------------------------------------------ overlay: the torch's edge, grain, captions
const Overlay: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
	const ui = useRef<HTMLCanvasElement>(null);
	const grain = useRef<HTMLCanvasElement>(null);
	useLayoutEffect(() => {
		const CW = 360, CH = 640;
		const g = ui.current!.getContext('2d')!;
		g.clearRect(0, 0, CW, CH);
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
			g.font = 'bold 13px "DejaVu Sans", sans-serif';
			g.textAlign = 'center';
			show.forEach((r, i) => {
				const y = 548 + i * 17 - (show.length - 1) * 8;
				g.fillStyle = '#000';
				for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.fillText(r, CW / 2 + dx, y + dy);
				g.fillStyle = '#ffffff';
				g.fillText(r, CW / 2, y);
			});
		}
		const img = g.getImageData(0, 0, CW, CH);
		for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 100 ? 255 : 0;
		g.putImageData(img, 0, 0);
		const b = grain.current!.getContext('2d')!;
		const bi = b.createImageData(60, 107);
		const r = rng(Math.floor((t + 600) * 24) * 104729 + 56);
		for (let i = 0; i < bi.data.length; i += 4) {
			const v = r() * 255;
			bi.data[i] = bi.data[i + 1] = bi.data[i + 2] = v;
			bi.data[i + 3] = 30 * r();
		}
		b.putImageData(bi, 0, 0);
	}, [t, captions]);
	return (
		<>
			<canvas ref={grain} width={60} height={107} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<canvas ref={ui} width={360} height={640} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, imageRendering: 'pixelated'}} />
		</>
	);
};

// ------------------------------------------------------------------ assembly
export const Episode56: React.FC<{includeAudio?: boolean; captions?: boolean}> = ({includeAudio = true, captions = true}) => {
	const f = useCurrentFrame();
	const t = f / 30;
	const tv = t >= K.loopShot ? t - DUR : t;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: 'scale(' + SCALE + ')', transformOrigin: '0 0', filter: 'contrast(1.25) saturate(0.85) brightness(1.08)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 62, near: 0.05, far: 60}} style={{position: 'absolute', left: 0, top: 0, imageRendering: 'pixelated'}}>
					<MatsProvider>
						<Scene t={tv} />
					</MatsProvider>
				</ThreeCanvas>
			</div>
			{/* the torch's circle: the dark closes in round it */}
			<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle 560px at 50% 47%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 75%, rgba(0,0,0,0.92) 100%)'}} />
			<Overlay t={tv} captions={captions} />
			{includeAudio && <Audio src={staticFile('assets/audio/ep56-forest-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
