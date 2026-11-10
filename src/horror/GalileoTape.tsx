// Analog-horror style test: "recovered" telemetry footage of NASA's Galileo
// atmospheric probe falling into Jupiter (7 Dec 1995). Low-poly PS1-style 3D at
// 270x480, upscaled 4x with nearest-neighbour, plus VHS damage and an OSD.
// Facts used on screen: entry speed ~47 km/s, peak deceleration ~228 g,
// parachute at ~0.4 bar, last data near ~22 bar and ~150 C, about 58 minutes
// of transmission. In-between readouts are interpolated for display only.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {LOW_H, LOW_W, cloudTexture, jupiterTexture, ps1, rng} from './ps1';

export const galileoTapeConfig = {durationInFrames: 720, fps: 30, width: 1080, height: 1920};

const S = {approach: [0, 150], entry: [150, 300], descent: [300, 630], lost: [630, 720]} as const;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lerp = (f: number, a: number, b: number, v0: number, v1: number) => interpolate(f, [a, b], [v0, v1], clamp);
const smooth = (x: number) => x * x * (3 - 2 * x);

// ------------------------------------------------------------------ 3D parts

const Stars: React.FC = () => {
	const geo = useMemo(() => {
		const r = rng(3);
		const pts: number[] = [];
		for (let i = 0; i < 500; i++) {
			const u = r() * 2 - 1, t = r() * Math.PI * 2, s = Math.sqrt(1 - u * u);
			pts.push(s * Math.cos(t) * 300, u * 300, s * Math.sin(t) * 300);
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
		return g;
	}, []);
	return (
		<points geometry={geo}>
			<pointsMaterial color="#d8d8ff" size={1} sizeAttenuation={false} />
		</points>
	);
};

const Jupiter: React.FC<{f: number}> = ({f}) => {
	const mat = useMemo(() => ps1(new THREE.MeshLambertMaterial({map: jupiterTexture(), flatShading: true})), []);
	return (
		<mesh rotation={[0.12, f * 0.0015 + 2.2, 0.05]} material={mat}>
			<icosahedronGeometry args={[10, 4]} />
		</mesh>
	);
};

const Probe: React.FC<{heat: number; shield: boolean; chute: number; f: number}> = ({heat, shield, chute, f}) => {
	const mats = useMemo(
		() => ({
			body: ps1(new THREE.MeshLambertMaterial({color: '#c4cad6', flatShading: true})),
			dark: ps1(new THREE.MeshLambertMaterial({color: '#3b3f4a', flatShading: true})),
			gold: ps1(new THREE.MeshLambertMaterial({color: '#c09040', flatShading: true})),
			shield: ps1(new THREE.MeshLambertMaterial({color: '#7a5a3a', flatShading: true, emissive: new THREE.Color('#ff5a1a')})),
			chuteA: ps1(new THREE.MeshLambertMaterial({color: '#e8e2d0', flatShading: true, side: THREE.DoubleSide})),
			chuteB: ps1(new THREE.MeshLambertMaterial({color: '#d0602a', flatShading: true, side: THREE.DoubleSide})),
			line: new THREE.LineBasicMaterial({color: '#7a7064'}),
		}),
		[],
	);
	mats.shield.emissiveIntensity = heat * 2.2;
	mats.shield.emissive.setRGB(1, 0.35 + heat * 0.4, 0.1 + heat * 0.3);
	const lines = useMemo(() => {
		const g = new THREE.BufferGeometry();
		const p: number[] = [];
		for (let i = 0; i < 6; i++) {
			const a = (i / 6) * Math.PI * 2;
			p.push(0, 0.25, 0, Math.cos(a) * 1.1, 2.0, Math.sin(a) * 1.1);
		}
		g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
		return g;
	}, []);
	return (
		<group>
			{/* descent module */}
			<mesh material={mats.body} position={[0, 0.05, 0]}>
				<cylinderGeometry args={[0.32, 0.36, 0.42, 7]} />
			</mesh>
			<mesh material={mats.gold} position={[0, 0.3, 0]}>
				<cylinderGeometry args={[0.2, 0.3, 0.12, 7]} />
			</mesh>
			<mesh material={mats.dark} position={[0.18, 0.4, 0.1]}>
				<boxGeometry args={[0.06, 0.22, 0.06]} />
			</mesh>
			{shield && (
				<mesh material={mats.shield} position={[0, -0.28, 0]} rotation={[Math.PI, 0, 0]}>
					<coneGeometry args={[0.62, 0.36, 8]} />
				</mesh>
			)}
			{chute > 0 && (
				<group scale={[chute, chute, chute]} rotation={[0, f * 0.01, Math.sin(f / 23) * 0.06]}>
					<lineSegments geometry={lines} material={mats.line} />
					<mesh material={mats.chuteA} position={[0, 2.0, 0]}>
						<sphereGeometry args={[1.25, 8, 3, 0, Math.PI * 2, 0, Math.PI / 2.4]} />
					</mesh>
					<mesh material={mats.chuteB} position={[0, 2.02, 0]} rotation={[0, Math.PI / 8, 0]}>
						<sphereGeometry args={[1.22, 4, 3, 0, Math.PI / 2, 0, Math.PI / 2.4]} />
					</mesh>
					<mesh material={mats.chuteB} position={[0, 2.02, 0]} rotation={[0, Math.PI + Math.PI / 8, 0]}>
						<sphereGeometry args={[1.22, 4, 3, 0, Math.PI / 2, 0, Math.PI / 2.4]} />
					</mesh>
				</group>
			)}
		</group>
	);
};

const Plasma: React.FC<{f: number; heat: number}> = ({f, heat}) => {
	const mat = useMemo(() => ps1(new THREE.MeshBasicMaterial({color: '#ffb050', transparent: true})), []);
	const mat2 = useMemo(() => ps1(new THREE.MeshBasicMaterial({color: '#fff2c0', transparent: true})), []);
	mat.opacity = heat * 0.7;
	mat2.opacity = heat * 0.9;
	const r = rng(11);
	return (
		<group>
			{new Array(70).fill(0).map((_, i) => {
				const a = r() * Math.PI * 2, rad = 0.2 + r() * 0.55, sp = 0.05 + r() * 0.08, ph = r();
				const y = (((f * sp + ph * 4) % 4) + 4) % 4;
				return (
					<mesh key={i} material={i % 3 ? mat : mat2} position={[Math.cos(a) * rad * (1 + y * 0.25), -0.2 + y, Math.sin(a) * rad * (1 + y * 0.25)]}>
						<boxGeometry args={[0.025, 0.25 + y * 0.12, 0.025]} />
					</mesh>
				);
			})}
		</group>
	);
};

const CLOUD_TINTS: [number, number, number][] = [
	[236, 214, 172],
	[214, 150, 96],
	[160, 84, 56],
	[104, 44, 40],
	[60, 22, 28],
];

const Clouds: React.FC<{depth: number}> = ({depth}) => {
	const mats = useMemo(
		() =>
			CLOUD_TINTS.map((t, i) => {
				const tex = cloudTexture(20 + i, t);
				tex.repeat.set(5, 5);
				return ps1(new THREE.MeshLambertMaterial({map: tex, alphaTest: 0.5, side: THREE.DoubleSide, flatShading: true}));
			}),
		[],
	);
	// cloud layers every 6 units; the probe sits still and the decks rise past it
	return (
		<group>
			{new Array(16).fill(0).map((_, i) => {
				const y = -6 - i * 6 + depth;
				if (y > 14 || y < -40) return null;
				const k = Math.min(CLOUD_TINTS.length - 1, Math.floor(i / 3));
				return (
					<mesh key={i} material={mats[k]} position={[(i % 2) * 7 - 3, y, (i % 3) * 5 - 5]} rotation={[-Math.PI / 2, 0, i]}>
						<planeGeometry args={[70, 70, 2, 2]} />
					</mesh>
				);
			})}
		</group>
	);
};

const Cam: React.FC<{pos: [number, number, number]; look: [number, number, number]; roll?: number}> = ({pos, look, roll = 0}) => {
	const {camera} = useThree();
	camera.position.set(...pos);
	camera.up.set(Math.sin(roll), Math.cos(roll), 0);
	camera.lookAt(...look);
	camera.updateProjectionMatrix();
	return null;
};

const FogAndBg: React.FC<{color: THREE.Color; near: number; far: number}> = ({color, near, far}) => {
	const {scene} = useThree();
	if (!scene.fog) scene.fog = new THREE.Fog(color, near, far);
	const fog = scene.fog as THREE.Fog;
	fog.color.copy(color);
	fog.near = near;
	fog.far = far;
	scene.background = color.clone();
	return null;
};

const FOG = ['#c9a46a', '#9a5a34', '#6a2a22', '#3a1216', '#1a080c'].map((c) => new THREE.Color(c));
const fogAt = (t: number) => {
	const x = Math.min(FOG.length - 1.0001, Math.max(0, t * (FOG.length - 1)));
	const i = Math.floor(x);
	return FOG[i].clone().lerp(FOG[i + 1], x - i);
};

const Scene: React.FC<{f: number}> = ({f}) => {
	const shake = (amp: number) => [Math.sin(f * 2.7) * amp, Math.cos(f * 3.3) * amp, 0] as const;
	if (f < S.entry[0]) {
		const t = smooth(lerp(f, 0, 150, 0, 1));
		const pz = 40 - t * 12;
		return (
			<>
				<FogAndBg color={new THREE.Color('#000000')} near={500} far={600} />
				<Cam pos={[1.6, 1.1, pz + 6.5]} look={[0, 1.5, 0]} />
				<pointLight position={[2.6, 2.4, pz + 3]} intensity={10} distance={9} color="#9fb4ff" />
				<ambientLight intensity={0.05} />
				<directionalLight position={[-30, 8, 14]} intensity={2.6} color="#fff1dc" />
				<Stars />
				<Jupiter f={f} />
				<group position={[1.15, -0.55, pz + 1.2]} rotation={[-Math.PI / 2 + 0.6, 0.4, 0.2]}>
					<Probe heat={0} shield chute={0} f={f} />
				</group>
			</>
		);
	}
	if (f < S.descent[0]) {
		const local = f - S.entry[0];
		const heat = smooth(lerp(local, 20, 110, 0, 1));
		const py = 11.4 - smooth(lerp(local, 0, 150, 0, 1)) * 1.3;
		const sh = shake(heat * 0.05);
		return (
			<>
				<FogAndBg color={new THREE.Color('#000000')} near={500} far={600} />
				<Cam pos={[1.5 + sh[0], py + 0.9 + sh[1], 2.0]} look={[0, py - 0.5, 0]} roll={0.25} />
				<ambientLight intensity={0.08 + heat * 0.4} color="#ff9050" />
				<directionalLight position={[-30, 8, 14]} intensity={2.4} color="#fff1dc" />
				<pointLight position={[0, py - 0.6, 0]} intensity={heat * 25} distance={6} color="#ff8030" />
				<Stars />
				<Jupiter f={f} />
				<group position={[0, py, 0]}>
					<Probe heat={heat} shield chute={0} f={f} />
					<Plasma f={f} heat={heat} />
				</group>
			</>
		);
	}
	const local = f - S.descent[0];
	const t = lerp(local, 0, 330, 0, 1);
	const depth = local * 0.22;
	const col = fogAt(t);
	const chute = smooth(lerp(local, 4, 22, 0.05, 1));
	const sway = Math.sin(local / 28) * 0.18;
	const orbit = 0.6 + local * 0.004;
	const flash = [468, 473, 520, 524].reduce((m, k) => Math.max(m, Math.exp(-(((f - k) / 1.6) ** 2))), 0);
	return (
		<>
			<FogAndBg color={col.clone().lerp(new THREE.Color('#c8d4ff'), flash * 0.55)} near={2} far={lerp(local, 0, 330, 40, 14)} />
			<Cam pos={[Math.sin(orbit) * 5.2, -1.4 - t * 0.4, Math.cos(orbit) * 5.2]} look={[0, 1.1, 0]} roll={sway * 0.3} />
			<pointLight position={[Math.sin(orbit) * 4, 0, Math.cos(orbit) * 4]} intensity={lerp(local, 0, 330, 3, 1.2)} distance={7} color="#ffd2a8" />
			<ambientLight intensity={lerp(local, 0, 330, 0.9, 0.18)} color={col} />
			<directionalLight position={[-6, 12, 4]} intensity={lerp(local, 0, 260, 1.8, 0.1)} color="#ffe0b8" />
			<pointLight position={[3, -9, -2]} intensity={lerp(local, 120, 330, 0, 30)} distance={30} color="#ff5020" />
			<pointLight position={[-6, -10, -5]} intensity={flash * 400} distance={40} color="#d8e4ff" />
			<group rotation={[0, 0, sway]} position={[0, Math.sin(local / 17) * 0.05, 0]}>
				<Probe heat={0} shield={false} chute={chute} f={f} />
			</group>
			<Clouds depth={depth} />
		</>
	);
};

// ------------------------------------------------------------------ 2D overlay (low-res)

type Line = {text: string; x: number; y: number; size?: number; color?: string; align?: CanvasTextAlign};

const osdFor = (f: number): Line[] => {
	const L: Line[] = [];
	const blink = Math.floor(f / 15) % 2 === 0;
	if (f < S.lost[0]) {
		L.push({text: 'GALILEO PROBE  //  RELAY CH-2', x: 8, y: 34, color: '#bfe8ff'});
		L.push({text: 'DEC 07 1995', x: 8, y: 45, color: '#bfe8ff'});
		if (blink) L.push({text: '● RX', x: 262, y: 34, color: '#ff5050', align: 'right'});
	}
	if (f < 96) {
		L.push({text: 'GALILEO PROBE', x: 135, y: 200, size: 20, align: 'center', color: '#ffffff'});
		L.push({text: 'FINAL TRANSMISSION', x: 135, y: 222, size: 12, align: 'center', color: '#ffd27a'});
	}
	if (f >= 100 && f < S.entry[0]) L.push({text: 'TARGET: JUPITER', x: 8, y: 352, color: '#ffffff'});
	if (f >= S.entry[0] && f < S.descent[0]) {
		L.push({text: 'ATMOSPHERIC ENTRY', x: 8, y: 330, color: '#ffffff'});
		L.push({text: `SPEED  ${Math.round(lerp(f, 150, 190, 0, 47))} KM/S`, x: 8, y: 342, color: '#ffd27a'});
		if (f > 215) L.push({text: `DECEL  ${Math.round(lerp(f, 215, 250, 40, 228))} G`, x: 8, y: 354, color: f > 245 && blink ? '#ff5050' : '#ffd27a'});
	}
	if (f >= S.descent[0] && f < S.lost[0]) {
		const t = lerp(f, 300, 600, 0, 1);
		const p = 0.4 * Math.pow(22 / 0.4, t);
		const temp = -143 + (150 + 143) * t;
		if (f < 360) L.push({text: 'PARACHUTE DEPLOYED', x: 8, y: 318, color: '#ffffff'});
		const glitch = f > 570 ? (Math.floor(f / 2) % 5 === 0 ? '#?' : '') : '';
		L.push({text: `PRESSURE  ${p.toFixed(p < 10 ? 1 : 0)} BAR${glitch}`, x: 8, y: 342, color: '#ffd27a'});
		L.push({text: `TEMP  ${Math.round(temp)} °C`, x: 8, y: 354, color: temp > 60 ? '#ff7050' : '#ffd27a'});
		if (f > 540 && blink) L.push({text: 'SIGNAL DEGRADED', x: 262, y: 354, color: '#ff5050', align: 'right'});
	}
	if (f >= S.lost[0]) {
		L.push({text: 'SIGNAL LOST', x: 135, y: 150, size: 20, align: 'center', color: '#ffffff'});
		if (f >= 652) L.push({text: 'IT KEPT TRANSMITTING', x: 135, y: 230, size: 11, align: 'center', color: '#ffffff'});
		if (f >= 652) L.push({text: 'FOR 58 MINUTES.', x: 135, y: 244, size: 11, align: 'center', color: '#ffffff'});
		if (f >= 682) L.push({text: 'THEN THE HEAT AND PRESSURE', x: 135, y: 272, size: 11, align: 'center', color: '#ffd27a'});
		if (f >= 682) L.push({text: 'DESTROYED IT.', x: 135, y: 286, size: 11, align: 'center', color: '#ffd27a'});
	}
	return L;
};

const Overlay: React.FC<{f: number; damage: number}> = ({f, damage}) => {
	const osd = useRef<HTMLCanvasElement>(null);
	const noise = useRef<HTMLCanvasElement>(null);
	useLayoutEffect(() => {
		// OSD text, thresholded so every pixel is fully on or off
		const c = osd.current!;
		const g = c.getContext('2d')!;
		g.clearRect(0, 0, LOW_W, LOW_H);
		for (const l of osdFor(f)) {
			g.font = `bold ${l.size ?? 10}px "DejaVu Sans Mono", monospace`;
			g.textAlign = l.align ?? 'left';
			g.fillStyle = '#000000';
			g.fillText(l.text, l.x + 1, l.y + 1);
			g.fillStyle = l.color ?? '#ffffff';
			g.fillText(l.text, l.x, l.y);
		}
		const img = g.getImageData(0, 0, LOW_W, LOW_H);
		for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 110 ? 255 : 0;
		g.putImageData(img, 0, 0);
		// VHS noise, tracking band and dropouts
		const n = noise.current!;
		const h = n.getContext('2d')!;
		const ni = h.createImageData(LOW_W, LOW_H);
		const r = rng(f * 7919 + 1);
		const band = (f * 3) % (LOW_H + 80) - 40;
		for (let y = 0; y < LOW_H; y++) {
			const inBand = Math.abs(y - band) < 6 + damage * 20;
			const drop = r() < 0.004 + damage * 0.05;
			for (let x = 0; x < LOW_W; x++) {
				const i = (y * LOW_W + x) * 4;
				const v = r() * 255;
				const a = inBand ? 70 + damage * 120 : 22 + damage * 90;
				ni.data[i] = ni.data[i + 1] = ni.data[i + 2] = drop && r() < 0.6 ? 255 : v;
				ni.data[i + 3] = drop ? 160 : a * (r() < 0.5 ? 1 : 0.4);
			}
		}
		h.putImageData(ni, 0, 0);
	}, [f, damage]);
	const px = {position: 'absolute' as const, left: 0, top: 0, width: LOW_W, height: LOW_H, imageRendering: 'pixelated' as const};
	return (
		<>
			<canvas ref={noise} width={LOW_W} height={LOW_H} style={{...px, mixBlendMode: 'overlay'}} />
			<canvas ref={osd} width={LOW_W} height={LOW_H} style={px} />
		</>
	);
};

// ------------------------------------------------------------------ assembly

export const GalileoTape: React.FC<{includeAudio?: boolean}> = ({includeAudio = true}) => {
	const f = useCurrentFrame();
	// signal failure: damage ramps, frames stutter and hold
	const damage = f < 540 ? 0.05 + (f >= 285 && f < 300 ? 0.8 : 0) : lerp(f, 540, 628, 0.1, 1);
	const hold = f >= 560 && f < S.lost[0] ? (Math.floor(f / 7) % 3 === 0 ? f - (f % 7) : f - (f % 2)) : f;
	const flash = f >= 286 && f < 300 ? 1 - (f - 286) / 14 : 0;
	const jitterX = damage > 0.3 ? Math.round(Math.sin(f * 12.9) * 3 * damage) : 0;
	const roll = f >= 600 && f < S.lost[0] ? ((f - 600) * 11) % LOW_H : 0;
	const ca = 1 + damage * 3;
	const lost = f >= S.lost[0];
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<style>{'canvas{image-rendering:pixelated}'}</style>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="vhs" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={ca} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-ca} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: 0, top: 0, width: LOW_W, height: LOW_H, transform: `scale(4) translate(${jitterX}px, ${-roll}px)`, transformOrigin: '0 0', filter: 'url(#vhs)'}}>
				{!lost && (
					<ThreeCanvas width={LOW_W} height={LOW_H} gl={{antialias: false, preserveDrawingBuffer: true}} camera={{fov: 55, near: 0.05, far: 1000}} style={{imageRendering: 'pixelated'}}>
						<Scene f={hold} />
					</ThreeCanvas>
				)}
				{lost && <div style={{position: 'absolute', inset: 0, background: '#0b0b3a'}} />}
				{flash > 0 && <div style={{position: 'absolute', inset: 0, background: '#fff4e0', opacity: flash}} />}
				<Overlay f={f} damage={lost ? 0.35 : damage} />
			</div>
			{roll > 0 && <div style={{position: 'absolute', left: 0, top: (LOW_H - roll) * 4, width: 1080, height: 16, background: '#000'}} />}
			{/* scanlines + vignette + slight analog grade */}
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 4px)'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.65) 100%)'}} />
			{includeAudio && <Audio src={staticFile('assets/audio/horror-galileo-v1/mix.m4a')} />}
		</AbsoluteFill>
	);
};
