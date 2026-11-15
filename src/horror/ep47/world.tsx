// Episode 47 world: "Sa Pader ng Bahay ni Lola" (Season 5, a childhood experience shared online, retold).
// A composite old house up north (no real house, town or family):
// - THE ROOM: x −2..2, z −2..2, 2.8 m high, wood floor. The left wall (x = −2) is old vertical planks
//   with gaps between them; behind it a hollow (to x −2.45) where small lights move and, once, an eye.
//   A mattress on the floor along that wall: me nearest the planks, Lola beside me. A capiz window on
//   the right wall, a small altar with a candle at the far end, a gasera (oil lamp) by the bed.
// - THE HOUSE: a bahay na bato from outside at night: stone below, wood above, capiz windows, a hip
//   roof, a big tree.
import React, {createContext, useContext, useMemo} from 'react';
import * as THREE from 'three';
import {ps1} from '../ps1';
import {SNAP6} from '../ep01/world';
import {PsxProp} from '../psx/models';
import {Box, tex} from '../ep41/world';

export type V3 = [number, number, number];
const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 64, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 64, SNAP6);

export const ROOM = {x0: -2, x1: 2, z0: -2, z1: 2, h: 2.8};
export const PLANK = {w: 0.19, gap: 0.03, x: -2};
/** plank centres along z */
export const PLANKS = Array.from({length: 18}, (_, i) => ROOM.z0 + 0.11 + i * (PLANK.w + PLANK.gap));
/** the gap centres (between plank i and i+1) */
export const GAPS = PLANKS.slice(0, -1).map((z) => z + (PLANK.w + PLANK.gap) / 2);

const useMatsInner = () =>
	useMemo(() => {
		const grain = tex(16, 32, (g) => {
			g.fillStyle = '#8e6a4c';
			g.fillRect(0, 0, 16, 32);
			for (let i = 0; i < 12; i++) {
				g.fillStyle = i % 2 ? '#7a5a40' : '#9a7656';
				g.fillRect((i * 5) % 16, 0, 1, 32);
			}
			g.fillStyle = '#3a2618';
			g.fillRect(6, 12, 2, 2);
		});
		const floor = tex(16, 16, (g) => {
			g.fillStyle = '#5a3e2a';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#3e2a1c';
			for (let i = 0; i < 16; i += 4) g.fillRect(0, i, 16, 1);
		}, [4, 4]);
		const capiz = tex(16, 16, (g) => {
			g.fillStyle = '#2a2016';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#d8c8a0';
			for (let x = 1; x < 16; x += 3) for (let y = 1; y < 16; y += 3) g.fillRect(x, y, 2, 2);
		});
		const stone = tex(16, 16, (g) => {
			g.fillStyle = '#7a7468';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#5e584e';
			for (let y = 0; y < 16; y += 4) {
				g.fillRect(0, y, 16, 1);
				g.fillRect(((y / 4) % 2) * 4 + 2, y, 1, 4);
				g.fillRect(((y / 4) % 2) * 4 + 10, y, 1, 4);
			}
		}, [4, 2]);
		return {
			plank: lam('#ffffff', {map: grain}),
			floor: lam('#ffffff', {map: floor}),
			wall: lam('#7a6048'),
			ceil: lam('#3e2e22'),
			hollow: lam('#0a0806'),
			capizLit: bas('#ffffff', {map: capiz}),
			capizDark: lam('#ffffff', {map: capiz}),
			altar: lam('#4a3020'),
			santo: lam('#d8d0c0'),
			flame: bas('#ffd27a'),
			glow: bas('#ffb860'),
			dust: bas('#c8b898'),
			eyeW: bas('#d8d4c8'),
			eyeD: bas('#050403'),
			stone: lam('#ffffff', {map: stone}),
			woodOut: lam('#4a3424'),
			roof: lam('#3a2a24'),
			leaves: lam('#14200e'),
			trunk: lam('#2a1e14'),
			sky: bas('#0a0e18'),
			ground: lam('#1e1c16'),
			sheet: lam('#b8b0a0'),
			pillow: lam('#c8c0b0'),
		};
	}, []);
type Mats = ReturnType<typeof useMatsInner>;
const Ctx = createContext<Mats | null>(null);
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMatsInner()}>{children}</Ctx.Provider>;
export const useM = () => useContext(Ctx)!;

/** what moves behind the planks. lights: z positions of the small lights (a procession), with level
 *  k (0..1); eye: the eye at a gap (its z), open 0..1. glow: the gaps' own glow, 0..1 (0 = silent). */
export type Behind = {lights: number[]; k: number; eye?: {z: number; y: number; open: number} | null};

/** the plank wall and the hollow behind it */
export const PlankWall: React.FC<{behind: Behind; t: number}> = ({behind, t}) => {
	const M = useM();
	const {h} = ROOM;
	return (
		<group>
			{PLANKS.map((z, i) =>
				i === 4 ? (
					// the split plank by my ear: low down it is broken away, leaving a hole the width of an eye
					<group key={z}>
						<Box p={[PLANK.x - 0.015, h / 2 + 0.25, z]} s={[0.03, h - 0.5, PLANK.w]} m={M.plank} />
						<Box p={[PLANK.x - 0.015, 0.14, z - 0.04]} s={[0.03, 0.28, PLANK.w - 0.08]} m={M.plank} />
						<Box p={[PLANK.x - 0.015, 0.47, z - 0.05]} s={[0.03, 0.06, PLANK.w - 0.1]} m={M.plank} />
					</group>
				) : (
					<Box key={z} p={[PLANK.x - 0.015, h / 2, z]} s={[0.03, h, PLANK.w]} m={M.plank} r={[0, 0, (i % 3) * 0.004 - 0.004]} />
				),
			)}
			{/* the hollow: back wall, floor and top, all dark */}
			<Box p={[-2.45, h / 2, 0]} s={[0.04, h, 4]} m={M.hollow} />
			<Box p={[-2.22, 0.01, 0]} s={[0.46, 0.02, 4]} m={M.hollow} />
			<Box p={[-2.22, h, 0]} s={[0.46, 0.04, 4]} m={M.hollow} />
			{/* the small lights, low, moving along the hollow */}
			{behind.k > 0.01 &&
				behind.lights.map((z, i) => {
					const y = 0.18 + ((i * 37) % 5) * 0.09 + 0.03 * Math.sin(t * 7 + i * 2);
					// the gap nearest the light glows as a lit slit
					const gz = GAPS.reduce((b, g) => (Math.abs(g - z) < Math.abs(b - z) ? g : b), GAPS[0]);
					const near = Math.max(0, 1 - Math.abs(gz - z) / 0.22);
					return (
						<group key={i}>
							<group position={[-2.2, y, z]}>
								<mesh material={M.glow}>
									<boxGeometry args={[0.05, 0.05, 0.05]} />
								</mesh>
								<pointLight intensity={1.6 * behind.k} distance={1.1} decay={1} color="#ffb860" />
							</group>
							<mesh position={[PLANK.x - 0.035, y + 0.05, gz]} rotation={[0, Math.PI / 2, 0]} material={M.glow} scale={[1, 0.3 + 0.7 * near * behind.k, 1]}>
								<planeGeometry args={[PLANK.gap + 0.01, 0.45]} />
							</mesh>
						</group>
					);
				})}
			{/* the eye, right at a gap */}
			{behind.eye && behind.eye.open > 0.01 && (
				<group position={[-2.05, behind.eye.y, behind.eye.z]} rotation={[0, Math.PI / 2, 0]}>
					<mesh material={M.eyeW} scale={[1, behind.eye.open, 1]}>
						<circleGeometry args={[0.035, 10]} />
					</mesh>
					<mesh position={[0, 0, 0.002]} material={M.eyeD} scale={[1, behind.eye.open, 1]}>
						<circleGeometry args={[0.015, 8]} />
					</mesh>
					<pointLight position={[0.05, 0, 0]} intensity={0.35} distance={0.4} decay={1} color="#d8d4c8" />
				</group>
			)}
		</group>
	);
};

/** dust sifting out of the gaps where the lights pass */
export const Dust: React.FC<{zs: number[]; t: number}> = ({zs, t}) => {
	const M = useM();
	return (
		<group>
			{zs.map((z, i) =>
				[0, 1, 2].map((j) => {
					const ph = (((t * 0.8 + j / 3 + i * 0.37) % 1) + 1) % 1;
					return (
						<mesh key={`${i}${j}`} position={[PLANK.x + 0.03 + ph * 0.05, 1.3 - ph * 1.1 + j * 0.2, z + 0.01 * j]} material={M.dust}>
							<boxGeometry args={[0.008, 0.008, 0.008]} />
						</mesh>
					);
				}),
			)}
		</group>
	);
};

/** the room: floor, the other walls, the window, the altar, the bed on the floor, the gasera.
 *  lamp: the gasera's flame (0 out). */
export const Room: React.FC<{lamp: number; t: number}> = ({lamp, t}) => {
	const M = useM();
	const {x1, z0, z1, h} = ROOM;
	const fl = 0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 5.3);
	return (
		<group>
			<Box p={[0, -0.05, 0]} s={[4.6, 0.1, 4]} m={M.floor} />
			<Box p={[0, h + 0.05, 0]} s={[4.6, 0.1, 4]} m={M.ceil} />
			<Box p={[x1 + 0.05, h / 2, 0]} s={[0.1, h, 4]} m={M.wall} />
			<Box p={[0, h / 2, z0 - 0.05]} s={[4, h, 0.1]} m={M.wall} />
			<Box p={[0, h / 2, z1 + 0.05]} s={[4, h, 0.1]} m={M.wall} />
			{/* the capiz window on the right wall, closed, faintly lit by the moon */}
			<mesh position={[x1 - 0.01, 1.5, 0.3]} rotation={[0, -Math.PI / 2, 0]} material={M.capizDark}>
				<planeGeometry args={[1.4, 1.0]} />
			</mesh>
			<pointLight position={[1.4, 1.6, 0.3]} intensity={1.3} distance={5.5} decay={1} color="#6a80b0" />
			{/* the altar at the far (−z) end: a shelf, a santo, a candle */}
			<Box p={[0.9, 1.0, z0 + 0.15]} s={[0.7, 0.05, 0.25]} m={M.altar} />
			<Box p={[0.9, 1.17, z0 + 0.15]} s={[0.1, 0.28, 0.08]} m={M.santo} />
			<mesh position={[1.12, 1.07, z0 + 0.18]} material={M.flame}>
				<boxGeometry args={[0.02, 0.05, 0.02]} />
			</mesh>
			<pointLight position={[1.0, 1.25, z0 + 0.35]} intensity={0.55 * fl} distance={2.4} decay={1} color="#ffb060" />
			{/* the bed on the floor along the plank wall: the mattress, a sheet, two pillows */}
			<group position={[-1.38, 0, 0.1]} rotation={[0, Math.PI / 2, 0]}>
				<PsxProp path="assets/models/psx/props/derelict-mattress.glb" s={1.05} />
			</group>
			{/* the gasera by the bed */}
			<group position={[-0.5, 0, -1.1]}>
				<Box p={[0, 0.08, 0]} s={[0.1, 0.16, 0.1]} m={M.altar} />
				{lamp > 0.05 && (
					<mesh position={[0, 0.21, 0]} material={M.flame}>
						<boxGeometry args={[0.025, 0.07, 0.025]} />
					</mesh>
				)}
				<pointLight position={[0, 0.35, 0]} intensity={1.8 * lamp * fl} distance={3.6} decay={1} color="#ffb060" />
			</group>
		</group>
	);
};

/** the house from outside at night; windows: how many capiz windows are lit (one, ours, at the end) */
export const House: React.FC<{lit: number}> = ({lit}) => {
	const M = useM();
	return (
		<group>
			<mesh position={[0, 12, -30]} material={M.sky}>
				<planeGeometry args={[120, 50]} />
			</mesh>
			<Box p={[0, -0.05, 0]} s={[60, 0.1, 60]} m={M.ground} />
			<Box p={[0, 1.4, 0]} s={[8, 2.8, 6]} m={M.stone} />
			<Box p={[0, 4.0, 0]} s={[8.8, 2.4, 6.8]} m={M.woodOut} />
			<mesh position={[0, 6.4, 0]} rotation={[0, Math.PI / 4, 0]} material={M.roof}>
				<coneGeometry args={[6.6, 2.4, 4]} />
			</mesh>
			{[-3.0, -1.0, 1.0, 3.0].map((x, i) => (
				<mesh key={x} position={[x, 4.0, 3.42]} material={i < lit ? M.capizLit : M.capizDark}>
					<planeGeometry args={[1.4, 1.3]} />
				</mesh>
			))}
			{lit > 0 && <pointLight position={[-3.0, 4.0, 4.5]} intensity={1.6} distance={7} decay={1} color="#ffb060" />}
			<Box p={[0, 1.1, 3.02]} s={[1.4, 2.2, 0.06]} m={M.altar} />
			<group position={[-7.5, 0, 2]}>
				<mesh position={[0, 3, 0]} material={M.trunk}>
					<cylinderGeometry args={[0.45, 0.7, 6, 6]} />
				</mesh>
				<mesh position={[0, 7.2, 0]} material={M.leaves}>
					<icosahedronGeometry args={[4.2, 0]} />
				</mesh>
			</group>
			<directionalLight position={[10, 20, 20]} intensity={0.9} color="#7a8ab8" />
		</group>
	);
};
