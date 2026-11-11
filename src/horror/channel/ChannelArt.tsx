// Channel identity for "After Sign-Off": the profile picture and the YouTube banner, rendered
// in the channel's own pixel-3D analog-horror style (low-res Three.js + PS1 shaders, nearest
// upscale, scanlines, chromatic fringe). No generated images, no third-party art.
//   ChannelAvatar  800x800  (YouTube profile picture; TikTok uses the same file)
//   ChannelBanner  2560x1440 (YouTube banner; the title sits inside the 1546x423 safe area)
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {ps1, rng} from '../ps1';
import {SNAP6} from '../ep01/world';
import {MatsProvider as Mats7, Outside, MAST, HILL_H} from '../ep07/world';

const M = (color: string, opts: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...opts}), 20, SNAP6);
const MONO = '"DejaVu Sans Mono", monospace';

const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	draw(c.getContext('2d')!);
	const t = new THREE.CanvasTexture(c);
	t.magFilter = THREE.NearestFilter;
	t.minFilter = THREE.NearestFilter;
	t.generateMipmaps = false;
	t.colorSpace = THREE.SRGBColorSpace;
	return t;
};

const Cam: React.FC<{p: [number, number, number]; l: [number, number, number]; fov: number; far?: number}> = ({p, l, fov, far = 100}) => {
	const {camera} = useThree();
	camera.position.set(...p);
	camera.lookAt(...l);
	(camera as THREE.PerspectiveCamera).fov = fov;
	(camera as THREE.PerspectiveCamera).far = far;
	camera.updateProjectionMatrix();
	return null;
};

const Tape: React.FC<{w: number; h: number; scale: number; seed: number}> = ({w, h, scale, seed}) => {
	const ref = useRef<HTMLCanvasElement>(null);
	useLayoutEffect(() => {
		const g = ref.current!.getContext('2d')!;
		const img = g.createImageData(w, h);
		const r = rng(seed);
		for (let i = 0; i < w * h; i++) {
			const v = r() * 255;
			img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
			img.data[i * 4 + 3] = r() < 0.5 ? 18 : 8;
		}
		g.putImageData(img, 0, 0);
	}, [w, h, seed]);
	return (
		<>
			<canvas ref={ref} width={w} height={h} style={{position: 'absolute', inset: 0, width: w * scale, height: h * scale, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
			<AbsoluteFill style={{background: `repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) ${scale / 2}px, rgba(0,0,0,0) ${scale / 2}px, rgba(0,0,0,0) ${scale}px)`}} />
		</>
	);
};

const Fringe: React.FC<{id: string; ca: number}> = ({id, ca}) => (
	<svg width={0} height={0} style={{position: 'absolute'}}>
		<filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
			<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
			<feOffset in="r" dx={ca} dy={0} result="r2" />
			<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
			<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
			<feOffset in="b" dx={-ca} dy={0} result="b2" />
			<feBlend in="r2" in2="g" mode="screen" result="rg" />
			<feBlend in="rg" in2="b2" mode="screen" />
		</filter>
	</svg>
);

// ------------------------------------------------------------------ the profile picture: a CRT, and someone standing in the static
const TV: React.FC = () => {
	const mats = useMemo(() => {
		const screen = canvasTex(48, 36, (g) => {
			const r = rng(11);
			const img = g.createImageData(48, 36);
			for (let y = 0; y < 36; y++)
				for (let x = 0; x < 48; x++) {
					// bright static, a darker tracking band, and a black figure standing in it
					let v = 150 + r() * 105;
					if (y >= 27 && y <= 29) v *= 0.55;
					const fx = x - 24, fy = y;
					const head = Math.hypot(fx * 1.05, fy - 11) < 3.4;
					const body = Math.abs(fx) < 5.2 - Math.max(0, 17 - fy) * 0.9 && fy > 14 && fy < 36;
					if (head || body) v = 8 + r() * 14;
					const ex = Math.max(Math.abs(x - 23.5) / 24, Math.abs(y - 17.5) / 18);
					if (ex > 0.9) v *= 0.6;
					const i = (y * 48 + x) * 4;
					img.data[i] = v * 0.92;
					img.data[i + 1] = v * 0.97;
					img.data[i + 2] = v;
					img.data[i + 3] = 255;
				}
			g.putImageData(img, 0, 0);
		});
		const veneer = canvasTex(16, 16, (g) => {
			const r = rng(73);
			for (let y = 0; y < 16; y++) {
				g.fillStyle = r() > 0.5 ? '#4a2c18' : '#5c3820';
				g.fillRect(0, y, 16, 1);
			}
		});
		return {
			screen: ps1(new THREE.MeshBasicMaterial({map: screen}), 20, SNAP6),
			veneer: M('#ffffff', {map: veneer}),
			dark: M('#141416'),
			knob: M('#b0a890'),
			chrome: M('#a8a8a8'),
			led: new THREE.MeshBasicMaterial({color: '#ff2a1a'}),
			floor: M('#1a1214'),
		};
	}, []);
	const B = (p: [number, number, number], s: [number, number, number], m: THREE.Material, r?: [number, number, number]) => (
		<mesh position={p} rotation={r} material={m}>
			<boxGeometry args={s} />
		</mesh>
	);
	return (
		<group rotation={[0, -0.12, 0]}>
			{B([0, 0, 0], [0.86, 0.66, 0.6], mats.veneer)}
			{B([-0.1, 0, 0.301], [0.58, 0.46, 0.01], mats.dark)}
			<mesh position={[-0.1, 0, 0.307]} material={mats.screen}>
				<planeGeometry args={[0.52, 0.39]} />
			</mesh>
			{B([0.31, 0.1, 0.305], [0.05, 0.05, 0.02], mats.knob)}
			{B([0.31, -0.02, 0.305], [0.05, 0.05, 0.02], mats.knob)}
			{B([0.31, -0.2, 0.306], [0.03, 0.03, 0.01], mats.led)}
			{B([0, 0.35, -0.05], [0.12, 0.04, 0.08], mats.dark)}
			{B([-0.11, 0.57, -0.05], [0.012, 0.46, 0.012], mats.chrome, [0, 0, 0.5])}
			{B([0.11, 0.57, -0.05], [0.012, 0.46, 0.012], mats.chrome, [0, 0, -0.5])}
			{B([0, -0.6, 0], [3, 0.5, 3], mats.floor)}
		</group>
	);
};

export const ChannelAvatar: React.FC = () => {
	const LW = 160, LH = 160, S = 5;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<Fringe id="fa" ca={2.5} />
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${S})`, transformOrigin: '0 0', filter: 'url(#fa)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 40, near: 0.02, far: 50}} style={{imageRendering: 'pixelated'}}>
					<Cam p={[-0.02, 0.06, 1.42]} l={[-0.1, 0.03, 0.3]} fov={40} />
					<color attach="background" args={['#060304']} />
					<ambientLight intensity={0.25} color="#6a4a4a" />
					{/* the screen is the only real light: cold, from the front */}
					<pointLight position={[-0.1, 0.0, 0.75]} intensity={2.2} distance={3} decay={1.1} color="#c8d8ff" />
					<pointLight position={[0.9, 0.9, -0.8]} intensity={1.2} distance={4} decay={1.0} color="#ff3020" />
					<TV />
				</ThreeCanvas>
			</div>
			<Tape w={LW} h={LH} scale={S} seed={5} />
			<AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.85) 72%)'}} />
		</AbsoluteFill>
	);
};

// ------------------------------------------------------------------ the banner: the town at night, every TV on, the mast on the hill
const Sky: React.FC = () => {
	const m = useMemo(() => {
		const t = canvasTex(1, 32, (g) => {
			const grd = g.createLinearGradient(0, 0, 0, 32);
			grd.addColorStop(0, '#05060e');
			grd.addColorStop(0.4, '#10142a');
			grd.addColorStop(0.5, '#3a2236');
			grd.addColorStop(0.53, '#1a1218');
			grd.addColorStop(1, '#0a0a0c');
			g.fillStyle = grd;
			g.fillRect(0, 0, 1, 32);
		});
		t.magFilter = THREE.LinearFilter;
		return new THREE.MeshBasicMaterial({map: t, side: THREE.BackSide, fog: false, depthWrite: false});
	}, []);
	return (
		<mesh material={m} renderOrder={-1}>
			<sphereGeometry args={[1800, 16, 12]} />
		</mesh>
	);
};

const Title: React.FC<{LW: number; LH: number; S: number}> = ({LW, LH, S}) => {
	const ref = useRef<HTMLCanvasElement>(null);
	useLayoutEffect(() => {
		const g = ref.current!.getContext('2d')!;
		g.clearRect(0, 0, LW, LH);
		const cx = LW / 2;
		// the name, chunky: drawn at low resolution and thresholded, so it upscales as pixels
		g.textAlign = 'center';
		g.font = `bold 30px ${MONO}`;
		const draw = (txt: string, y: number, col: string, edge = 2) => {
			for (let dx = -edge; dx <= edge; dx++)
				for (let dy = -edge; dy <= edge; dy++) {
					g.fillStyle = '#000';
					g.fillText(txt, cx + dx, y + dy);
				}
			g.fillStyle = col;
			g.fillText(txt, cx, y);
		};
		draw('AFTER SIGN-OFF', 146, '#f2f0e8');
		g.font = `bold 9px ${MONO}`;
		draw('TRUE CASES  ·  ORIGINAL NIGHTMARES  ·  ANALOG HORROR', 166, '#ff5a44', 1);
		const img = g.getImageData(0, 0, LW, LH);
		for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 110 ? 255 : 0;
		g.putImageData(img, 0, 0);
	}, [LW, LH]);
	return <canvas ref={ref} width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, width: LW * S, height: LH * S, imageRendering: 'pixelated'}} />;
};

export const ChannelBanner: React.FC = () => {
	const LW = 512, LH = 288, S = 5;
	const MT: [number, number, number] = [MAST[0], HILL_H, MAST[2]];
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<Fringe id="fb" ca={3} />
			<div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${S})`, transformOrigin: '0 0', filter: 'url(#fb)'}}>
				<ThreeCanvas width={LW} height={LH} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 50, near: 0.05, far: 2500}} style={{imageRendering: 'pixelated'}}>
					{/* from the green across the street: the terrace's TV-lit windows below, the mast over the rooftops */}
					<Cam p={[78, 16, -30]} l={[MT[0], MT[1] + 55, MT[2] + 172]} fov={44} far={2500} />
					<fog attach="fog" args={['#0c0c18', 60, 1500]} />
					<Sky />
					<ambientLight intensity={1.0} color="#4a5070" />
					<directionalLight position={[200, 120, -60]} intensity={0.6} color="#7a80b0" />
					{[-18, -6, 6, 18].map((z) => (
						<pointLight key={z} position={[5.0, 4.0, z]} intensity={2.2} distance={9} decay={1.2} color="#ffa040" />
					))}
					<Mats7>
						<Outside beacon={1} farLight={0} tvLit={1} />
					</Mats7>
				</ThreeCanvas>
			</div>
			{/* darken the band behind the title so it reads on every device */}
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 44%, rgba(0,0,0,0.55) 62%, rgba(0,0,0,0) 74%)'}} />
			<Title LW={LW} LH={LH} S={S} />
			<Tape w={LW} h={LH} scale={S} seed={9} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)'}} />
		</AbsoluteFill>
	);
};
