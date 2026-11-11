// Episode 13 world: "Half of Her" (folklore: the manananggal, Visayas). One consistent set: a nipa
// hut on stilts in an unnamed Visayan barrio, its one room inside and out, the banana grove beside
// it, neighbouring huts, coconut trees and the moon.
//
// Layout (metres, y up). Ground y = 0. The hut floor is FLOOR = 1.2 (bamboo stilts); the room is
// x -2..2, z -1.5..1.5; the door is in the front wall (z = +1.5) with a bamboo ladder down to the
// yard; the CAPIZ window is in the left wall (x = -2), its two lower-middle panes broken. Inside: a
// gasera (kerosene lamp) on the floor, the wife asleep on a banig, the husband sitting against the
// back wall with a bolo, garlic hanging by the door, a nipa thatch roof (ridge along x).
// The grove of saging (banana) is to the left-front; the lower half stands at LEGS.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1, rng} from '../ps1';
import {SNAP6} from '../ep01/world';

const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 20, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 20, SNAP6);

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

export const FLOOR = 1.2;
export const LEGS: [number, number, number] = [-6.5, 0, 6.5];
export const CAPIZ: [number, number, number] = [-2, FLOOR + 1.25, 0.1];
export const WIFE: [number, number, number] = [0.6, FLOOR, -0.4];
export const HUSBAND: [number, number, number] = [-0.6, FLOOR, -1.2];
export const LAMP: [number, number, number] = [-0.4, FLOOR, 0.3];
export const DOOR: [number, number, number] = [0.6, FLOOR, 1.5];

const useMats = () =>
	useMemo(() => {
		const amakan = tex(16, 16, (g) => {
			for (let y = 0; y < 16; y++)
				for (let x = 0; x < 16; x++) {
					g.fillStyle = ((x >> 1) + (y >> 1)) % 2 ? '#8c7a52' : '#a8925e';
					g.fillRect(x, y, 1, 1);
				}
		}, [5, 3]);
		const nipa = tex(16, 16, (g) => {
			for (let y = 0; y < 16; y++) {
				g.fillStyle = y % 4 === 0 ? '#3a2e1a' : y % 2 ? '#6a5630' : '#7a6438';
				g.fillRect(0, y, 16, 1);
			}
			for (let i = 0; i < 20; i++) {
				g.fillStyle = '#4a3c22';
				g.fillRect((i * 7) % 16, (i * 5) % 16, 1, 3);
			}
		}, [6, 4]);
		const bamboo = tex(8, 16, (g) => {
			for (let x = 0; x < 8; x += 2) {
				g.fillStyle = x % 4 ? '#8a7a48' : '#9a8a52';
				g.fillRect(x, 0, 2, 16);
				g.fillStyle = '#5a4a2a';
				g.fillRect(x, 0, 1, 16);
			}
		}, [6, 4]);
		const banig = tex(16, 16, (g) => {
			const cols = ['#a83a3a', '#d8b05a', '#3a6a5a', '#d8c8a0'];
			for (let y = 0; y < 16; y++)
				for (let x = 0; x < 16; x++) {
					g.fillStyle = cols[(Math.floor(x / 4) + Math.floor(y / 4) + ((x + y) % 2)) % 4];
					g.fillRect(x, y, 1, 1);
				}
		}, [2, 3]);
		return {
			amakan: lam('#ffffff', {map: amakan}),
			nipa: lam('#ffffff', {map: nipa, side: THREE.DoubleSide}),
			floor: lam('#ffffff', {map: bamboo}),
			banig: lam('#ffffff', {map: banig}),
			post: lam('#5a4a30'),
			capiz: lam('#b8ac90', {transparent: true, opacity: 0.88}),
			capizFrame: lam('#3a2a1a'),
			kumot: lam('#5a5a7a'),
			pillow: lam('#c8c0b0'),
			hair: lam('#0e0c0c'),
			skin: lam('#8a6448'),
			tin: lam('#6a6a62'),
			flame: bas('#ffc060'),
			garlic: lam('#e8e0cc'),
			cord: lam('#151515'),
			ground: lam('#4a4232'),
			grass: lam('#3c5430'),
			stem: lam('#6a7a44'),
			leaf: lam('#4a6e3c', {side: THREE.DoubleSide}),
			leafDry: lam('#7a6638', {side: THREE.DoubleSide}),
			trunk: lam('#5a4a38'),
			palm: lam('#3a5e36'),
			moon: bas('#e8ecf0', {fog: false}),
			salt: bas('#f0f0ea'),
			void: bas('#000000'),
			warmWin: bas('#d8a050'),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
const Ctx = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(Ctx)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMats()}>{children}</Ctx.Provider>;

export const Box: React.FC<{p: [number, number, number]; s: [number, number, number]; m: THREE.Material; r?: [number, number, number]}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={s} />
	</mesh>
);

/** A nipa hut (shell only) of half-width w, half-depth d, at the origin; the hero hut adds its interior. */
const HutShell: React.FC<{w: number; d: number; lit?: boolean; capiz?: boolean}> = ({w, d, lit, capiz}) => {
	const m = useM();
	const H = 2.0;
	const slope = Math.atan2(1.2, d + 0.4);
	const len = Math.hypot(1.2, d + 0.4);
	return (
		<group>
			{[-w + 0.1, 0, w - 0.1].map((x) => [-d + 0.1, d - 0.1].map((z) => <Box key={`${x}${z}`} p={[x, FLOOR / 2, z]} s={[0.12, FLOOR, 0.12]} m={m.post} />))}
			<Box p={[0, FLOOR - 0.03, 0]} s={[w * 2, 0.06, d * 2]} m={m.floor} />
			<Box p={[0, FLOOR + H / 2, -d]} s={[w * 2, H, 0.05]} m={m.amakan} />
			<Box p={[w, FLOOR + H / 2, 0]} s={[0.05, H, d * 2]} m={m.amakan} />
			{/* the left wall, with the capiz window opening at y FLOOR+0.9..1.6, z -0.25..0.45 */}
			<Box p={[-w, FLOOR + 0.45, 0]} s={[0.05, 0.9, d * 2]} m={m.amakan} />
			<Box p={[-w, FLOOR + 1.8, 0]} s={[0.05, 0.4, d * 2]} m={m.amakan} />
			<Box p={[-w, FLOOR + 1.25, -0.25 - (d - 0.25) / 2]} s={[0.05, 0.7, d - 0.25]} m={m.amakan} />
			<Box p={[-w, FLOOR + 1.25, 0.45 + (d - 0.45) / 2]} s={[0.05, 0.7, d - 0.45]} m={m.amakan} />
			{/* the front wall with the door opening */}
			<Box p={[-w / 2 - 0.15, FLOOR + H / 2, d]} s={[w + 0.7, H, 0.05]} m={m.amakan} />
			<Box p={[w - 0.35, FLOOR + H / 2, d]} s={[0.7, H, 0.05]} m={m.amakan} />
			<Box p={[0.6, FLOOR + 1.85, d]} s={[0.6, 0.3, 0.05]} m={m.amakan} />
			{/* the nipa roof */}
			{[-1, 1].map((sd) => (
				<mesh key={sd} position={[0, FLOOR + H + 0.6, (sd * (d + 0.4)) / 2]} rotation={[sd * slope, 0, 0]} material={m.nipa}>
					<boxGeometry args={[w * 2 + 0.6, 0.08, len]} />
				</mesh>
			))}
			{[-1, 1].map((sd) => (
				<mesh key={`g${sd}`} position={[sd * w * 1.0, FLOOR + H, 0]} rotation={[0, Math.PI / 2, 0]} material={m.amakan}>
					<shapeGeometry args={[new THREE.Shape([new THREE.Vector2(-d, 0), new THREE.Vector2(d, 0), new THREE.Vector2(0, 1.2)])]} />
				</mesh>
			))}
			{lit && <Box p={[-w - 0.03, FLOOR + 1.25, 0.1]} s={[0.02, 0.62, 0.62]} m={m.warmWin} />}
			{capiz && null}
		</group>
	);
};

/** The capiz window: a 4x4 grid of pearly panes; panes (1,1),(2,1) are broken (an opening). */
const Capiz: React.FC = () => {
	const m = useM();
	const panes: React.ReactNode[] = [];
	for (let i = 0; i < 4; i++)
		for (let j = 0; j < 4; j++) {
			const broken = (j === 1 || j === 2) && (i === 1 || i === 2);
			const y = FLOOR + 0.95 + j * 0.155 + 0.0775;
			const z = -0.2 + i * 0.155 + 0.0775;
			if (!broken) panes.push(<Box key={`${i}${j}`} p={[-2, y, z]} s={[0.012, 0.14, 0.14]} m={m.capiz} />);
			else panes.push(<Box key={`${i}${j}`} p={[-2, y - 0.05, z + 0.03]} s={[0.012, 0.04, 0.05]} m={m.capiz} />);
		}
	for (let k = 0; k <= 4; k++) {
		panes.push(<Box key={`h${k}`} p={[-2, FLOOR + 0.95 + k * 0.155, 0.11]} s={[0.03, 0.02, 0.64]} m={m.capizFrame} />);
		panes.push(<Box key={`v${k}`} p={[-2, FLOOR + 1.26, -0.2 + k * 0.155]} s={[0.03, 0.64, 0.02]} m={m.capizFrame} />);
	}
	return <group>{panes}</group>;
};

/** The hero hut, inside and out. flameLean: radians the gasera's flame leans towards the roof. */
export const Hut: React.FC<{t: number; flameLean: number; lampOn: number; wifeSafe?: boolean}> = ({t, flameLean, lampOn}) => {
	const m = useM();
	return (
		<group>
			<HutShell w={2} d={1.5} />
			<Capiz />
			{/* the bamboo ladder from the door to the yard */}
			{[-0.22, 0.22].map((x) => (
				<Box key={x} p={[DOOR[0] + x, FLOOR / 2, DOOR[2] + 0.65]} s={[0.06, 1.45, 0.06]} m={m.post} r={[-0.5, 0, 0]} />
			))}
			{[0.2, 0.5, 0.8, 1.1].map((y) => (
				<Box key={y} p={[DOOR[0], y, DOOR[2] + 1.15 - (y / FLOOR) * 0.62]} s={[0.5, 0.04, 0.04]} m={m.post} />
			))}
			{/* garlic hanging by the door */}
			{Array.from({length: 4}, (_, i) => (
				<mesh key={i} position={[DOOR[0] - 0.42, FLOOR + 1.6 - i * 0.08, DOOR[2] - 0.05]} material={m.garlic}>
					<icosahedronGeometry args={[0.03, 0]} />
				</mesh>
			))}
			<Box p={[DOOR[0] - 0.42, FLOOR + 1.5, DOOR[2] - 0.05]} s={[0.006, 0.36, 0.006]} m={m.cord} />
			{/* the gasera on the floor: a tin can with a wick; the flame leans */}
			<group position={LAMP}>
				<mesh position={[0, 0.07, 0]} material={m.tin}>
					<cylinderGeometry args={[0.05, 0.055, 0.14, 8]} />
				</mesh>
				{lampOn > 0.05 && (
					<mesh position={[Math.sin(flameLean) * 0.04, 0.2 + Math.cos(flameLean) * 0.0, 0]} rotation={[0, 0, -flameLean + Math.sin(t * 13) * 0.08]} material={m.flame} scale={[1, 0.6 + lampOn * 0.6, 1]}>
						<coneGeometry args={[0.022, 0.1, 5]} />
					</mesh>
				)}
			</group>
			{/* the wife asleep on her side on a banig, her belly round under the kumot */}
			<mesh position={[WIFE[0], FLOOR + 0.006, WIFE[2]]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} material={m.banig}>
				<planeGeometry args={[0.9, 1.8]} />
			</mesh>
			<mesh position={[WIFE[0] + 0.1, FLOOR + 0.12, WIFE[2]]} scale={[0.75, 0.13, 0.32]} material={m.kumot}>
				<sphereGeometry args={[0.5, 8, 6]} />
			</mesh>
			<mesh position={[WIFE[0] + 0.05, FLOOR + 0.2, WIFE[2] + 0.07]} scale={[0.16, 0.12, 0.16]} material={m.kumot}>
				<sphereGeometry args={[1, 8, 6]} />
			</mesh>
			<Box p={[WIFE[0] - 0.65, FLOOR + 0.05, WIFE[2]]} s={[0.25, 0.1, 0.4]} m={m.pillow} />
			<mesh position={[WIFE[0] - 0.55, FLOOR + 0.17, WIFE[2]]} scale={[1, 0.9, 1]} material={m.hair}>
				<sphereGeometry args={[0.1, 6, 5]} />
			</mesh>
			<Box p={[WIFE[0] - 0.75, FLOOR + 0.12, WIFE[2] + 0.12]} s={[0.25, 0.02, 0.25]} m={m.hair} />
		</group>
	);
};

const Banana: React.FC<{p: [number, number, number]; seed: number; h?: number}> = ({p, seed, h = 2.6}) => {
	const m = useM();
	const leaves = useMemo(() => {
		const r = rng(seed);
		return Array.from({length: 7}, (_, i) => ({a: (i / 7) * Math.PI * 2 + r() * 0.5, droop: 0.3 + r() * 0.7, dry: r() < 0.25, len: 1.4 + r() * 0.8}));
	}, [seed]);
	return (
		<group position={p}>
			<mesh position={[0, h / 2, 0]} material={m.stem}>
				<cylinderGeometry args={[0.1, 0.16, h, 6]} />
			</mesh>
			{leaves.map((l, i) => (
				<group key={i} position={[0, h, 0]} rotation={[0, l.a, 0]}>
					<mesh position={[l.len / 2, -0.25 * l.droop, 0]} rotation={[0, 0, -0.5 * l.droop]} material={l.dry ? m.leafDry : m.leaf}>
						<boxGeometry args={[l.len, 0.01, 0.42]} />
					</mesh>
				</group>
			))}
		</group>
	);
};

const Coconut: React.FC<{p: [number, number, number]; lean?: number; seed?: number}> = ({p, lean = 0.15, seed = 1}) => {
	const m = useM();
	const fronds = useMemo(() => {
		const r = rng(seed);
		return Array.from({length: 9}, (_, i) => ({a: (i / 9) * Math.PI * 2 + r() * 0.3, droop: 0.5 + r() * 0.5}));
	}, [seed]);
	return (
		<group position={p} rotation={[0, 0, lean]}>
			<Box p={[0, 4.5, 0]} s={[0.25, 9, 0.25]} m={m.trunk} />
			{fronds.map((f, i) => (
				<group key={i} position={[0, 9, 0]} rotation={[0, f.a, 0]}>
					<Box p={[1.1, -0.3 * f.droop, 0]} s={[2.4, 0.04, 0.5]} m={m.palm} r={[0, 0, -0.35 * f.droop]} />
				</group>
			))}
		</group>
	);
};

/** The yard, the grove, the neighbours, the trees and the moon. salt: 0..1 salt poured on the waist. */
export const Barrio: React.FC<{salt: number}> = ({salt}) => {
	const m = useM();
	const grove = useMemo(() => {
		const r = rng(1313);
		const out: [number, number, number][] = [];
		for (let i = 0; i < 26; i++) {
			const x = -11 + r() * 9, z = 3 + r() * 9;
			if (Math.hypot(x - LEGS[0], z - LEGS[2]) < 1.3) continue;
			if (Math.abs(x - -3.5) < 0.9 && z < 6) continue; // the path from the ladder into the grove
			out.push([x, 0, z]);
		}
		return out;
	}, []);
	const saltBits = useMemo(() => {
		const r = rng(77);
		return Array.from({length: 40}, () => ({x: (r() - 0.5) * 0.4, z: (r() - 0.5) * 0.4}));
	}, []);
	return (
		<group>
			<Box p={[0, -0.05, 0]} s={[200, 0.1, 200]} m={m.ground} />
			<Box p={[-6, 0.01, 7]} s={[12, 0.02, 12]} m={m.grass} />
			{grove.map((p, i) => (
				<Banana key={i} p={p} seed={i + 3} h={2.2 + (i % 4) * 0.3} />
			))}
			{/* neighbours' huts across the yard; one window lit */}
			<group position={[8, 0, 2]} rotation={[0, -0.4, 0]}>
				<HutShell w={1.8} d={1.4} lit />
			</group>
			<group position={[-2, 0, -12]} rotation={[0, 0.2, 0]}>
				<HutShell w={1.8} d={1.4} />
			</group>
			<group position={[12, 0, -10]} rotation={[0, 0.7, 0]}>
				<HutShell w={1.6} d={1.3} />
			</group>
			<Coconut p={[3.5, 0, 4]} seed={3} />
			<Coconut p={[-12, 0, -2]} lean={0.2} seed={5} />
			<Coconut p={[6, 0, -6]} lean={-0.12} seed={7} />
			<Coconut p={[-4, 0, 14]} lean={-0.18} seed={9} />
			{/* salt on the void at the waist (it is poured into the open waist and on the ground around it) */}
			{salt > 0 &&
				saltBits.slice(0, Math.floor(40 * salt)).map((b, i) => (
					<Box key={i} p={[LEGS[0] + b.x, i < 14 ? 0.95 : 0.01, LEGS[2] + b.z * (i < 14 ? 0.4 : 1)]} s={[0.025, 0.012, 0.025]} m={m.salt} />
				))}
			<group position={[-120, 95, -170]} rotation={[0, Math.atan2(120, 170), 0]}>
				<mesh material={m.moon}>
					<circleGeometry args={[16, 20]} />
				</mesh>
				<mesh position={[0, 0, -1]}>
					<circleGeometry args={[30, 24]} />
					<meshBasicMaterial color="#8a9ac0" transparent opacity={0.22} fog={false} />
				</mesh>
			</group>
		</group>
	);
};
