// Episode 24 world: "They Turn Their Heads" (Season 3, a real reported case: the Island of the
// Dolls, Xochimilco, Mexico City). One long canal at dusk in fog, to real scale:
// - the canal (8 m wide, black water that shows a faint mirrored world under it), the chinampa bank
//   on the left with a line of tall, thin ahuejote trees, a reed fringe, a fence of sticks;
// - the island: hundreds of old plastic dolls and doll heads hung from the trees and the fence by
//   string, dirty, eyeless or with sleep-eyes, hair matted; a small tin-roofed hut with dolls nailed
//   to its walls (Don Julián's, a composite);
// - the right bank: farther trees in fog;
// - our boat: the painted bow of a trajinera at the bottom of the frame (an invented name).
// Each doll has a `face` angle: 0 = towards the water's centre line, 1 = turned to the boat.
// No person is shown; the girl and Don Julián are never depicted.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1, rng} from '../ps1';
import {SNAP6} from '../ep01/world';

const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 64, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 64, SNAP6);

const tex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rep: [number, number] = [1, 1]) => {
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	draw(c.getContext('2d')!);
	const t = new THREE.CanvasTexture(c);
	t.magFilter = THREE.NearestFilter;
	t.minFilter = THREE.NearestFilter;
	t.generateMipmaps = false;
	t.colorSpace = THREE.SRGBColorSpace;
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	t.repeat.set(rep[0], rep[1]);
	return t;
};

export type V3 = [number, number, number];
const seg = (v: number) => Math.min(16, Math.max(1, Math.ceil(v / 0.5)));
export const Box: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={[s[0], s[1], s[2], seg(s[0]), seg(s[1]), seg(s[2])]} />
	</mesh>
);

export const BANK_X = -3.6; // the island's edge
export const ISLAND: [number, number] = [-34, -4]; // z range of the doll trees

const useMats = () =>
	useMemo(() => {
		const bow = tex(32, 16, (g) => {
			g.fillStyle = '#b8402a';
			g.fillRect(0, 0, 32, 16);
			g.fillStyle = '#e8c040';
			g.fillRect(0, 0, 32, 2);
			g.fillRect(0, 14, 32, 2);
			g.fillStyle = '#2a6a3a';
			for (let x = 2; x < 32; x += 6) g.fillRect(x, 4, 3, 8);
		});
		return {
			water: new THREE.MeshLambertMaterial({color: '#1a2420', transparent: true, opacity: 0.55, depthWrite: false}),
			mud: lam('#2a2a1e'),
			grass: lam('#2e3a22'),
			reed: lam('#3e4a2a'),
			bark: lam('#5a5244'),
			leaf: lam('#5a6a52'),
			stick: lam('#4a4030'),
			string: lam('#9a9282'),
			skin1: lam('#c8b8a4'),
			skin2: lam('#a89a88'),
			skin3: lam('#8a8070'),
			grime: lam('#5a5246'),
			dress1: lam('#7a6a5a'),
			dress2: lam('#5a4a4a'),
			dress3: lam('#6a6a5a'),
			hair: lam('#3a2a1a'),
			eye: bas('#060606'),
			eyeBlue: bas('#3a5a7a'),
			tin: lam('#5a5a58'),
			plank: lam('#4a3a28'),
			bow: lam('#ffffff', {map: bow}),
			sky: new THREE.MeshBasicMaterial({color: '#4a5048', side: THREE.BackSide, fog: false}),
			sun: new THREE.MeshBasicMaterial({color: '#c88a4a', fog: false}),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
const Ctx = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(Ctx)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMats()}>{children}</Ctx.Provider>;

type DollSpec = {kind: 'whole' | 'head'; skin: 0 | 1 | 2; dress: 0 | 1 | 2; eyes: 0 | 1 | 2; hair: boolean; size: number; limbs: number};

/**
 * An old plastic doll, hanging by a string from its head (whole) or a doll's head alone.
 * yaw: radians it is turned; the face is local +z. eyes: 0 sockets, 1 one eye, 2 both (sleep-eyes).
 */
export const Doll: React.FC<{spec: DollSpec; yaw: number; swing: number; m: Mats}> = ({spec, yaw, swing, m}) => {
	const skin = [m.skin1, m.skin2, m.skin3][spec.skin];
	const dress = [m.dress1, m.dress2, m.dress3][spec.dress];
	const s = spec.size;
	return (
		<group rotation={[swing * 0.6, yaw, swing]} scale={s}>
			{/* the head (a big baby head), hanging just below the string's end */}
			<group position={[0, -0.09, 0]}>
				<mesh material={skin} scale={[1, 1.05, 1]}>
					<icosahedronGeometry args={[0.08, 1]} />
				</mesh>
				<mesh position={[0.03, 0.03, 0.05]} material={m.grime} scale={[0.6, 0.3, 0.3]}>
					<icosahedronGeometry args={[0.04, 0]} />
				</mesh>
				{[-0.028, 0.028].map((x, i) => {
					const open = spec.eyes === 2 || (spec.eyes === 1 && i === 0);
					return (
						<mesh key={x} position={[x, 0.008, 0.07]} material={open ? m.eyeBlue : m.eye}>
							<boxGeometry args={[0.024, open ? 0.016 : 0.02, 0.012]} />
						</mesh>
					);
				})}
				<mesh position={[0, -0.035, 0.074]} material={m.eye}>
					<boxGeometry args={[0.014, 0.008, 0.01]} />
				</mesh>
				{spec.hair && (
					<mesh position={[0, 0.03, -0.02]} material={m.hair} scale={[1.08, 0.8, 1.05]}>
						<icosahedronGeometry args={[0.08, 1]} />
					</mesh>
				)}
			</group>
			{spec.kind === 'whole' && (
				<group position={[0, -0.25, 0]}>
					<mesh material={dress}>
						<cylinderGeometry args={[0.05, 0.08, 0.16, 7]} />
					</mesh>
					{spec.limbs > 0 && (
						<>
							<Box p={[-0.07, 0.02, 0.01]} s={[0.03, 0.1, 0.03]} m={skin} r={[0, 0, 0.3]} />
							{spec.limbs > 1 && <Box p={[0.07, 0.02, 0.01]} s={[0.03, 0.1, 0.03]} m={skin} r={[0, 0, -0.3]} />}
							<Box p={[-0.03, -0.13, 0]} s={[0.035, 0.1, 0.035]} m={skin} />
							{spec.limbs > 2 && <Box p={[0.03, -0.13, 0]} s={[0.035, 0.1, 0.035]} m={skin} />}
						</>
					)}
				</group>
			)}
		</group>
	);
};

export type Hanging = {p: V3; len: number; spec: DollSpec; ph: number; base: number};

/** every doll on the island: hung from the trees and the fence, facing the canal (yaw towards +x) */
export const useHangings = () =>
	useMemo(() => {
		const r = rng(2401);
		const out: Hanging[] = [];
		const spec = (): DollSpec => ({
			kind: r() < 0.3 ? 'head' : 'whole',
			skin: Math.floor(r() * 3) as 0 | 1 | 2,
			dress: Math.floor(r() * 3) as 0 | 1 | 2,
			eyes: (r() < 0.4 ? 0 : r() < 0.6 ? 1 : 2) as 0 | 1 | 2,
			hair: r() < 0.55,
			size: 0.8 + r() * 0.6,
			limbs: Math.floor(r() * 4),
		});
		for (let z = ISLAND[0]; z < ISLAND[1]; z += 0.55 + r() * 0.5) {
			// on the trees along the bank, at several heights
			const x = BANK_X - 0.2 + r() * 0.9;
			out.push({p: [x, 1.4 + r() * 2.6, z], len: 0.3 + r() * 0.6, spec: spec(), ph: r() * 6.28, base: (r() - 0.5) * 0.6});
			// on the stick fence at the water's edge
			if (r() < 0.6) out.push({p: [BANK_X + 0.35, 1.0 + r() * 0.3, z + 0.2], len: 0.1 + r() * 0.15, spec: spec(), ph: r() * 6.28, base: (r() - 0.5) * 0.5});
		}
		return out;
	}, []);

/** the canal, both banks, the trees, the hut and the dolls. turn(i): 0..1 how far doll i has turned to the boat */
export const Canal: React.FC<{t: number; boat: V3; turn: (i: number, h: Hanging) => number; wind: number; mirror?: boolean}> = ({t, boat, turn, wind, mirror = false}) => {
	const m = useM();
	const hang = useHangings();
	const trees = useMemo(() => {
		const r = rng(2402);
		const left = Array.from({length: 34}, (_, i) => ({x: BANK_X - 0.9 - r() * 1.6, z: 18 - i * 2.2 - r() * 0.8, h: 9 + r() * 6}));
		const right = Array.from({length: 26}, (_, i) => ({x: 4.6 + r() * 3, z: 18 - i * 3 - r(), h: 8 + r() * 6}));
		return {left, right};
	}, []);
	return (
		<group scale={mirror ? [1, -1, 1] : [1, 1, 1]}>
			{!mirror && (
				<>
					<mesh material={m.sky}>
						<sphereGeometry args={[120, 12, 8]} />
					</mesh>
					<mesh position={[-60, 6, -80]} material={m.sun}>
						<circleGeometry args={[4, 12]} />
					</mesh>
				</>
			)}
			{/* banks */}
			<Box p={[BANK_X - 6, 0.15, -20]} s={[12, 0.6, 90]} m={m.mud} />
			<Box p={[BANK_X - 6, 0.46, -20]} s={[11.6, 0.04, 90]} m={m.grass} />
			<Box p={[4 + 6, 0.15, -20]} s={[12, 0.6, 90]} m={m.mud} />
			{/* reeds along the island's edge */}
			{Array.from({length: 90}, (_, i) => (
				<Box key={i} p={[BANK_X + 0.15 + ((i * 37) % 7) * 0.05, 0.7, 20 - i * 0.95]} s={[0.04, 0.9 + ((i * 13) % 5) * 0.12, 0.04]} m={m.reed} r={[0, 0, 0.1 * Math.sin(t * 0.8 + i)]} />
			))}
			{/* the stick fence along the island */}
			{Array.from({length: 60}, (_, i) => {
				const z = ISLAND[0] + i * 0.5;
				return <Box key={`f${i}`} p={[BANK_X + 0.35, 0.8, z]} s={[0.05, 1.2 + ((i * 7) % 3) * 0.1, 0.05]} m={m.stick} r={[0, 0, ((i * 11) % 5 - 2) * 0.04]} />;
			})}
			<Box p={[BANK_X + 0.35, 1.25, (ISLAND[0] + ISLAND[1]) / 2]} s={[0.03, 0.03, ISLAND[1] - ISLAND[0]]} m={m.stick} />
			{/* ahuejote trees: tall, thin, columnar; a few bare */}
			{[...trees.left, ...trees.right].map((tr, i) => (
				<group key={`t${i}`} position={[tr.x, 0.4, tr.z]}>
					<Box p={[0, tr.h / 2, 0]} s={[0.22, tr.h, 0.22]} m={m.bark} />
					{i % 5 !== 2 && (
						<mesh position={[0, tr.h * 0.62, 0]} material={m.leaf} scale={[1, 4.2, 1]}>
							<icosahedronGeometry args={[0.9, 0]} />
						</mesh>
					)}
					{[0.35, 0.5, 0.65].map((k, j) => (
						<Box key={j} p={[(j % 2 ? 0.5 : -0.5) * (tr.x < 0 ? -1 : 1), tr.h * k * 0.6 + 1.2, 0]} s={[1.0, 0.05, 0.05]} m={m.bark} r={[0, j, (j % 2 ? 1 : -1) * 0.5]} />
					))}
				</group>
			))}
			{/* Don Julián's hut: a tin roof, plank walls, dolls nailed to them (a composite) */}
			<group position={[BANK_X - 3.2, 0.45, -22]}>
				<Box p={[0, 1.1, 0]} s={[2.6, 2.2, 3.2]} m={m.plank} />
				<Box p={[0, 2.35, 0]} s={[3.0, 0.08, 3.6]} m={m.tin} r={[0, 0, 0.12]} />
				{Array.from({length: 14}, (_, i) => (
					<group key={i} position={[1.32, 0.5 + (i % 4) * 0.42, -1.3 + Math.floor(i / 4) * 0.75]} rotation={[0, Math.PI / 2, 0]}>
						<Doll spec={{kind: i % 3 ? 'whole' : 'head', skin: (i % 3) as 0 | 1 | 2, dress: ((i + 1) % 3) as 0 | 1 | 2, eyes: (i % 3) as 0 | 1 | 2, hair: i % 2 === 0, size: 0.9, limbs: i % 4}} yaw={0} swing={0} m={m} />
					</group>
				))}
			</group>
			{/* the dolls on strings; each swings a little, and turns to the boat as `turn` says */}
			{hang.map((h, i) => {
				const d = Math.hypot(boat[0] - h.p[0], boat[2] - h.p[2]);
				if (d > 26) return null;
				const toBoat = Math.atan2(boat[0] - h.p[0], boat[2] - h.p[2]);
				const k = turn(i, h);
				const faceWater = Math.PI / 2 + h.base; // facing +x, the canal
				let dy = toBoat - faceWater;
				dy = Math.atan2(Math.sin(dy), Math.cos(dy));
				const swing = (Math.sin(t * 0.9 + h.ph) * 0.12 + Math.sin(t * 2.1 + h.ph * 2) * 0.04) * wind;
				return (
					<group key={i} position={h.p}>
						<Box p={[0, -h.len / 2, 0]} s={[0.006, h.len, 0.006]} m={m.string} />
						<group position={[0, -h.len, 0]}>
							<Doll spec={h.spec} yaw={faceWater + dy * k} swing={swing} m={m} />
						</group>
					</group>
				);
			})}
		</group>
	);
};

/** The painted bow of our trajinera, fixed to the camera rig (at the bottom of the frame). */
export const Bow: React.FC = () => {
	const m = useM();
	return (
		<group>
			<Box p={[0, -1.15, -1.6]} s={[1.3, 0.1, 1.8]} m={m.plank} />
			<Box p={[-0.68, -1.02, -1.6]} s={[0.08, 0.24, 1.8]} m={m.bow} />
			<Box p={[0.68, -1.02, -1.6]} s={[0.08, 0.24, 1.8]} m={m.bow} />
			<Box p={[0, -1.02, -2.5]} s={[1.4, 0.24, 0.08]} m={m.bow} />
		</group>
	);
};

/** A doll floating face-up in the water beside the boat. */
export const Floater: React.FC<{p: V3; yaw: number; m: Mats}> = ({p, yaw, m}) => (
	<group position={p} rotation={[-Math.PI / 2 + 0.2, 0, yaw]}>
		<Doll spec={{kind: 'whole', skin: 0, dress: 2, eyes: 2, hair: true, size: 1.2, limbs: 3}} yaw={0} swing={0} m={m} />
	</group>
);
