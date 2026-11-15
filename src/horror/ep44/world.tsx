// Episode 44 world: "Sumunod ang Katok" (Season 5, an experience shared online, retold). Composites:
// - THE HOUSE: a one-storey city house seen mostly from above (no ceiling): the sala at the front
//   (front door, bottom), the kitchen (its door on the right wall), a hall running up the middle with
//   Mama and Papa's room off it (its door mid-hall) and my room at the top (my door). Each knock shakes
//   its door and lights the gap under it, so the knocking climbs the plan toward me.
// - THE WAKE: Lolo's lamay in the province: the coffin with its glass, candles, white flowers.
import React, {createContext, useContext, useMemo} from 'react';
import * as THREE from 'three';
import {ps1} from '../ps1';
import {SNAP6} from '../ep01/world';
import {PsxProp} from '../psx/models';
import {Box, tex} from '../ep41/world';

export type V3 = [number, number, number];
const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 64, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 64, SNAP6);

export const H = 2.6; // wall height
/** the doors: where they are, which wall they sit in ('x': a wall along x; 'z': a wall along z) */
export const DOORS = {
	front: {p: [-1.5, 0, 5] as V3, along: 'x' as const},
	kitchen: {p: [4, 0, 3] as V3, along: 'z' as const},
	mama: {p: [0.2, 0, -0.4] as V3, along: 'z' as const},
	mine: {p: [-1, 0, -4] as V3, along: 'z' as const},
};
export type DoorId = keyof typeof DOORS;

const useMatsInner = () =>
	useMemo(() => {
		const wood = tex(16, 16, (g) => {
			g.fillStyle = '#7a5a42';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 16; i += 4) {
				g.fillStyle = '#4a3428';
				g.fillRect(0, i, 16, 1);
			}
			for (let i = 0; i < 24; i++) {
				g.fillStyle = '#634a38';
				g.fillRect((i * 7) % 16, (i * 5) % 16, 2, 1);
			}
		}, [8, 10]);
		return {
			floor: lam('#ffffff', {map: wood}),
			wall: lam('#a8a090'),
			wallTop: lam('#2a2622'),
			door: lam('#6a4a34'),
			glow: bas('#ffcf8a', {transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false}),
			sheet: lam('#c8c4b8'),
			table: lam('#4a3628'),
			coffin: lam('#d8d2c4'),
			glass: bas('#9ab0c0', {transparent: true, opacity: 0.25}),
			flower: lam('#f0f0e8'),
			candle: lam('#f4ecd8'),
			flame: bas('#ffc060'),
			cloth: lam('#3a3238'),
			knob: lam('#c8b070'),
			shadow: bas('#000000', {transparent: true, opacity: 0.85}),
			ceil: lam('#7a7468'),
			frame: lam('#20180f'),
		};
	}, []);
type Mats = ReturnType<typeof useMatsInner>;
const Ctx = createContext<Mats | null>(null);
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMatsInner()}>{children}</Ctx.Provider>;
export const useM = () => useContext(Ctx)!;

/** a wall from a to b (axis-aligned) with optional door gaps (1.0 m wide) centred at the given points */
const Wall: React.FC<{a: [number, number]; b: [number, number]; gaps?: number[]}> = ({a, b, gaps = []}) => {
	const M = useM();
	const alongX = a[1] === b[1];
	const lo = alongX ? Math.min(a[0], b[0]) : Math.min(a[1], b[1]);
	const hi = alongX ? Math.max(a[0], b[0]) : Math.max(a[1], b[1]);
	const cuts = [...gaps].sort((p, q) => p - q);
	const pieces: [number, number][] = [];
	let s = lo;
	for (const g of cuts) {
		pieces.push([s, g - 0.5]);
		s = g + 0.5;
	}
	pieces.push([s, hi]);
	return (
		<group>
			{pieces.filter(([p, q]) => q - p > 0.01).map(([p, q], i) => {
				const c = (p + q) / 2;
				const len = q - p;
				return alongX ? (
					<group key={i}>
						<Box p={[c, H / 2, a[1]]} s={[len, H, 0.12]} m={M.wall} />
						<Box p={[c, H + 0.01, a[1]]} s={[len, 0.02, 0.14]} m={M.wallTop} />
					</group>
				) : (
					<group key={i}>
						<Box p={[a[0], H / 2, c]} s={[0.12, H, len]} m={M.wall} />
						<Box p={[a[0], H + 0.01, c]} s={[0.14, 0.02, len]} m={M.wallTop} />
					</group>
				);
			})}
			{/* lintels over the gaps */}
			{cuts.map((g) => (alongX ? <Box key={g} p={[g, (H + 2.1) / 2, a[1]]} s={[1.0, H - 2.1, 0.12]} m={M.wall} /> : <Box key={g} p={[a[0], (H + 2.1) / 2, g]} s={[0.12, H - 2.1, 1.0]} m={M.wall} />))}
		</group>
	);
};

/** a door in its gap. shake: the knock (0..1 pulse); open: 0 shut .. 1 swung open; glow: light in the gap under it */
export const Door: React.FC<{id: DoorId; shake?: number; open?: number; glow?: number}> = ({id, shake = 0, open = 0, glow = 0}) => {
	const M = useM();
	const d = DOORS[id];
	const ry = d.along === 'x' ? 0 : Math.PI / 2;
	return (
		<group position={d.p} rotation={[0, ry, 0]}>
			{/* hinge at the door's left edge (local x = −0.48) */}
			<group position={[-0.48, 0, 0]} rotation={[0, open * 1.5 + shake * 0.025, 0]}>
				<Box p={[0.48, 1.03, 0]} s={[0.95, 2.06, 0.05]} m={M.door} />
				<mesh position={[0.85, 1.0, 0.04]} material={M.knob}>
					<sphereGeometry args={[0.035, 6, 4]} />
				</mesh>
				<mesh position={[0.85, 1.0, -0.04]} material={M.knob}>
					<sphereGeometry args={[0.035, 6, 4]} />
				</mesh>
			</group>
			{glow > 0.01 && (
				<>
					<mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.glow} scale={[1, 1, 1]}>
						<planeGeometry args={[0.95, 0.5 * glow + 0.1]} />
					</mesh>
					<pointLight position={[0, 0.3, 0]} intensity={2.2 * glow} distance={2.2} decay={1} color="#ffcf8a" />
				</>
			)}
		</group>
	);
};

/** the house's shell: floor, outer walls, rooms; ceiling only when shot from inside */
export const House: React.FC<{ceiling?: boolean; children?: React.ReactNode}> = ({ceiling, children}) => {
	const M = useM();
	return (
		<group>
			<Box p={[0, -0.05, 0]} s={[8.2, 0.1, 10.2]} m={M.floor} />
			{ceiling && <Box p={[0, H + 0.05, 0]} s={[8.2, 0.1, 10.2]} m={M.ceil} />}
			{/* outer walls */}
			<Wall a={[-4, -5]} b={[4, -5]} />
			<Wall a={[-4, 5]} b={[4, 5]} gaps={[-1.5]} />
			<Wall a={[-4, -5]} b={[-4, 5]} />
			<Wall a={[4, -5]} b={[4, 5]} gaps={[3]} />
			{/* the hall (x −1 .. 0.2, from z −5 to the sala at z 1) */}
			<Wall a={[-1, -5]} b={[-1, -1]} gaps={[-4]} />
			<Wall a={[0.2, -5]} b={[0.2, 1]} gaps={[-0.4]} />
			{/* my room's lower wall, the storage room under it; Mama's room's lower wall; the kitchen partition */}
			<Wall a={[-4, -1]} b={[-1, -1]} />
			<Wall a={[0.2, -1.8]} b={[4, -1.8]} />
			<Wall a={[0.2, 1]} b={[4, 1]} gaps={[2.2]} />
			{/* furniture */}
			<group position={[-3.2, 0, 3.2]} rotation={[0, Math.PI / 2, 0]}>
				<PsxProp path="assets/models/psx/props/derelict-couch.glb" />
			</group>
			<group position={[-3.75, 0, 1.6]} rotation={[0, Math.PI / 2, 0]}>
				<PsxProp path="assets/models/psx/props/derelict-shelf.glb" />
			</group>
			<group position={[-3.7, 1.6, 1.6]}>
				<PsxProp path="assets/models/psx/props/derelict-vase.glb" />
			</group>
			<group position={[3.5, 0, 1.6]} rotation={[0, -Math.PI / 2, 0]}>
				<PsxProp path="assets/models/psx/props/derelict-fridge.glb" />
			</group>
			<Box p={[2.4, 0.38, 3.6]} s={[1.2, 0.76, 0.8]} m={M.table} />
			<group position={[1.7, 0, 3.6]} rotation={[0, Math.PI / 2, 0]}>
				<PsxProp path="assets/models/psx/props/derelict-chair.glb" />
			</group>
			{/* beds: Mama and Papa's (right), mine (top left) */}
			<group position={[2.6, 0, -0.4]} rotation={[0, 0, 0]}>
				<PsxProp path="assets/models/psx/props/derelict-mattress.glb" s={1.1} />
			</group>
			<group position={[-2.7, 0, -3.6]} rotation={[0, Math.PI / 2, 0]}>
				<PsxProp path="assets/models/psx/props/derelict-mattress.glb" />
			</group>
			{children}
		</group>
	);
};

/** the wake: the coffin on its stand, candles, flowers, a framed photo turned dark */
export const Wake: React.FC<{t: number}> = ({t}) => {
	const M = useM();
	const fl = (k: number) => 0.9 + 0.1 * Math.sin(t * 17 + k * 2) * Math.sin(t * 6.3 + k);
	return (
		<group position={[40, 0, 0]}>
			<Box p={[0, -0.05, 0]} s={[8, 0.1, 8]} m={M.floor} />
			<Box p={[0, 1.5, -2.5]} s={[8, 3, 0.1]} m={M.cloth} />
			<Box p={[-3, 1.5, 0]} s={[0.1, 3, 8]} m={M.cloth} />
			<Box p={[3, 1.5, 0]} s={[0.1, 3, 8]} m={M.cloth} />
			<Box p={[0, 3.0, 0]} s={[8, 0.1, 8]} m={M.ceil} />
			{/* the stand and the coffin */}
			<Box p={[0, 0.35, -1.2]} s={[2.2, 0.7, 0.8]} m={M.cloth} />
			<Box p={[0, 0.95, -1.2]} s={[2.1, 0.5, 0.7]} m={M.coffin} />
			<Box p={[-0.45, 1.21, -1.2]} s={[0.5, 0.02, 0.4]} m={M.glass} />
			{/* the framed photo (turned dark: no face) */}
			<Box p={[0, 1.7, -2.4]} s={[0.4, 0.5, 0.04]} m={M.frame} />
			{/* candles and flowers */}
			{[-1.2, 1.2].map((x, k) => (
				<group key={x} position={[x, 0, -1.2]}>
					<Box p={[0, 0.6, 0]} s={[0.08, 1.2, 0.08]} m={M.frame} />
					<mesh position={[0, 1.32, 0]} material={M.candle}>
						<cylinderGeometry args={[0.035, 0.035, 0.22, 6]} />
					</mesh>
					<mesh position={[0, 1.47, 0]} material={M.flame} scale={[1, fl(k), 1]}>
						<coneGeometry args={[0.022, 0.08, 5]} />
					</mesh>
					<pointLight position={[0, 1.55, 0.1]} intensity={1.6 * fl(k)} distance={4} decay={1} color="#ffb860" />
				</group>
			))}
			{[-1.7, -1.9, 1.7, 1.9].map((x, k) => (
				<mesh key={k} position={[x, 0.5 + (k % 2) * 0.25, -1.6]} material={M.flower} scale={[1, 0.8, 1]}>
					<icosahedronGeometry args={[0.22, 0]} />
				</mesh>
			))}
		</group>
	);
};
