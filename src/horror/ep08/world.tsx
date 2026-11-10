// Episode 8 world: "Room Zero" (original). One empty two-storey house, inside and out, seen
// with the eye and through a thermal camera.
//
// Layout (metres, y up). The house: x[-4,4] z[-8,6.2]. The front faces -z (the street, the
// van, the sale board). Ground floor y[0,2.7]: the entrance hall with the stairs rising along
// +z at x[-0.6,0.6] from z = -7 to the landing at z = -3 (y = 2.8); the kitchen at x[0.7,4]
// z[-8,-3]. Upstairs (floor y = 2.8, ceiling 5.3): the hallway x[-0.6,0.6] runs from the
// landing (z = -3) to the BLANK END WALL at z = 4 (its face at WALL_Z). Bedroom doors open
// off it. Behind the end wall is Room Zero, z[4.1,6.1], across the whole width: no door, and
// on the outside the east side wall shows its window at z = 5.1 with the curtains drawn
// (every other window is bare). In the thermal shots every material switches to the cold end
// of an ironbow palette; heat that shows through the end wall is drawn on the wall's own
// surface (HeatPatch).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1} from '../ps1';
import {SNAP6} from '../ep01/world';
import {tex} from '../ep02/world';

const M = (color: string, opts: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...opts}), 20, SNAP6);
const B = (color: string, opts: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...opts}), 20, SNAP6);

export const WALL_Z = 3.95; // the hallway face of the blank end wall
export const UP = 2.8; // upstairs floor height
export const HIDDEN_WINDOW_Z = 5.1;

const makeMats = (thermal: boolean) => {
	if (thermal) {
		// cold end of the ironbow palette; Lambert so the camera's own headlight gives form
		const c = (hex: string) => M(hex, {side: THREE.DoubleSide});
		const cold = {
			wall: c('#3a1c74'), wallDark: c('#2a1458'), ceiling: c('#24104e'), floor: c('#200e46'), carpet: c('#2a1256'),
			wood: c('#30166a'), door: c('#341870'), glass: B('#0a0420'), frost: B('#0c0626'), banister: c('#3a1c74'),
			counter: c('#3a1a72'), metal: c('#24104e'), pipe: c('#0e0628'), tile: c('#30166a'), curtain: c('#3a1a5a'),
			brick: c('#2a1452'), roof: c('#120a2a'), grass: c('#140a2e'), road: c('#100824'), van: c('#2a1656'), board: c('#2a1456'),
			tree: c('#1a0c38'), box: c('#2a1456'), tape: B('#3a1a6a'), glove: B('#e07030'), device: c('#1a0c3a'), black: B('#000000'),
			sky: B('#08041a'),
		};
		return cold;
	}
	const plaster = tex(16, 16, (g, r) => {
		g.fillStyle = '#b8b4aa';
		g.fillRect(0, 0, 16, 16);
		for (let i = 0; i < 30; i++) {
			g.fillStyle = r() > 0.5 ? '#aeaa9e' : '#c0bcb2';
			g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
		}
	}, 91, [6, 3]);
	const carpet = tex(16, 16, (g, r) => {
		g.fillStyle = '#7a6a56';
		g.fillRect(0, 0, 16, 16);
		for (let i = 0; i < 60; i++) {
			g.fillStyle = r() > 0.5 ? '#6e5e4a' : '#86765e';
			g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
		}
	}, 92, [2, 8]);
	const boards = tex(16, 16, (g) => {
		g.fillStyle = '#6a4a30';
		g.fillRect(0, 0, 16, 16);
		g.fillStyle = '#5a3c24';
		for (let x = 0; x < 16; x += 4) g.fillRect(x, 0, 1, 16);
	}, 93, [3, 3]);
	const brick = tex(16, 16, (g, r) => {
		g.fillStyle = '#8a6a5a';
		g.fillRect(0, 0, 16, 16);
		for (let y = 0; y < 16; y += 4) {
			g.fillStyle = '#6a5044';
			g.fillRect(0, y + 3, 16, 1);
			for (let x = y % 8 ? 4 : 0; x < 16; x += 8) g.fillRect(x, y, 1, 3);
			if (r() > 0.5) {
				g.fillStyle = '#967666';
				g.fillRect(Math.floor(r() * 14), y, 3, 3);
			}
		}
	}, 94, [6, 4]);
	const frost = tex(16, 16, (g, r) => {
		g.fillStyle = '#c8d4dc';
		g.fillRect(0, 0, 16, 16);
		for (let i = 0; i < 40; i++) {
			g.fillStyle = r() > 0.5 ? '#e8f0f4' : '#a8b8c4';
			g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
		}
	}, 95, [1, 1]);
	const grass = tex(16, 16, (g, r) => {
		g.fillStyle = '#6a7466';
		g.fillRect(0, 0, 16, 16);
		for (let i = 0; i < 60; i++) {
			g.fillStyle = r() > 0.5 ? '#8a9488' : '#56604e';
			g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
		}
	}, 96, [30, 30]);
	return {
		wall: M('#ffffff', {map: plaster, side: THREE.DoubleSide}), wallDark: M('#8a8478', {side: THREE.DoubleSide}), ceiling: M('#a8a49a', {side: THREE.DoubleSide}),
		floor: M('#ffffff', {map: boards}), carpet: M('#ffffff', {map: carpet}), wood: M('#5a4030'), door: M('#d0ccc0'), glass: B('#c4ccd4'),
		frost: B('#ffffff', {map: frost}), banister: M('#6a4a34'), counter: M('#8a8a84'), metal: M('#a0a0a0'), pipe: M('#8a6a4a'), tile: M('#c8c8bc'),
		curtain: M('#8a2a22', {side: THREE.DoubleSide}), brick: M('#ffffff', {map: brick}), roof: M('#3a3a40'), grass: M('#ffffff', {map: grass}),
		road: M('#3a3a3c'), van: M('#d8d8d4'), board: M('#e8e4d8'), tree: M('#3a3230'), box: M('#a08060'), tape: M('#e0c020'),
		glove: M('#2a2a2c'), device: M('#2a2a2a'), black: B('#000000'), sky: B('#9aa0a8'),
	};
};

export type Mats = ReturnType<typeof makeMats>;
const MatsContext = React.createContext<{n: Mats; th: Mats; thermal: boolean} | null>(null);
export const useM = () => {
	const c = React.useContext(MatsContext)!;
	return c.thermal ? c.th : c.n;
};
export const useThermal = () => React.useContext(MatsContext)!.thermal;
export const MatsProvider: React.FC<{thermal: boolean; children: React.ReactNode}> = ({thermal, children}) => {
	const sets = useMemo(() => ({n: makeMats(false), th: makeMats(true)}), []);
	return <MatsContext.Provider value={{...sets, thermal}}>{children}</MatsContext.Provider>;
};

export const Box: React.FC<{p: [number, number, number]; s: [number, number, number]; m: THREE.Material; r?: [number, number, number]}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={s} />
	</mesh>
);

/** A plane with a canvas texture facing +z when rotY = 0. */
export const Plane: React.FC<{p: [number, number, number]; w: number; h: number; map: THREE.Texture; rotY?: number; additive?: boolean}> = ({p, w, h, map, rotY = 0, additive}) => {
	const m = useMemo(() => new THREE.MeshBasicMaterial({map, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending}), [map, additive]);
	return (
		<mesh position={p} rotation={[0, rotY, 0]} material={m}>
			<planeGeometry args={[w, h]} />
		</mesh>
	);
};

// ------------------------------------------------------------------ the house
/** door: an open/closed interior door leaf on a wall facing ±x at (x, z). */
const Door: React.FC<{x: number; z: number; y0: number; open: number; side: 1 | -1}> = ({x, z, y0, open, side}) => {
	const mm = useM();
	return (
		<group position={[x, y0, z - 0.42]} rotation={[0, side * open * 1.2, 0]}>
			<Box p={[0, 1.0, 0.42]} s={[0.04, 2.0, 0.84]} m={mm.door} />
		</group>
	);
};

export const House: React.FC<{doorInWall?: boolean; buyers?: boolean}> = ({doorInWall, buyers}) => {
	const mm = useM();
	return (
		<group>
			{/* ---------- ground floor: hall, stairs, kitchen ---------- */}
			<Box p={[0, -0.05, -2]} s={[8, 0.1, 14.4]} m={mm.floor} />
			{/* the stairs: 14 steps from z = -7 up to the landing at z = -3 */}
			{new Array(14).fill(0).map((_, i) => (
				<Box key={i} p={[0, 0.1 * (i + 1), -7 + (i + 0.5) * 0.2857]} s={[1.2, 0.2 * (i + 1), 0.2857]} m={mm.carpet} />
			))}
			<Box p={[-0.65, 1.4, -5]} s={[0.1, 2.8, 4.2]} m={mm.wall} />
			{/* the banister */}
			{new Array(8).fill(0).map((_, i) => (
				<Box key={i} p={[0.62, 0.5 + i * 0.35 + 0.4, -6.8 + i * 0.5]} s={[0.04, 0.8, 0.04]} m={mm.banister} />
			))}
			<Box p={[0.62, 1.95, -5]} s={[0.06, 0.06, 4.6]} m={mm.banister} r={[0.61, 0, 0]} />
			{/* hall walls, front door with frosted glass */}
			<Box p={[0, 1.35, -8.05]} s={[8, 2.7, 0.1]} m={mm.wall} />
			<mesh position={[-2.2, 1.3, -7.99]} material={mm.frost}>
				<planeGeometry args={[0.5, 0.9]} />
			</mesh>
			<Box p={[-2.2, 1.0, -7.98]} s={[0.9, 2.0, 0.03]} m={mm.door} />
			<mesh position={[-2.2, 1.45, -7.96]} material={mm.frost}>
				<planeGeometry args={[0.4, 0.7]} />
			</mesh>
			<Box p={[0, 2.75, -5.5]} s={[8, 0.1, 5]} m={mm.ceiling} />
			{/* the kitchen: counter along the east wall, the sink and its pipe, the skirting */}
			<Box p={[4.05, 1.35, -5.5]} s={[0.1, 2.7, 5]} m={mm.wall} />
			<Box p={[0.7, 1.35, -3.6]} s={[0.1, 2.7, 1.2]} m={mm.wall} />
			<Box p={[3.65, 0.45, -5.6]} s={[0.7, 0.9, 3.6]} m={mm.counter} />
			<Box p={[3.65, 0.92, -5.6]} s={[0.74, 0.04, 3.64]} m={mm.tile} />
			<Box p={[3.95, 0.4, -5.0]} s={[0.05, 0.8, 0.05]} m={mm.pipe} />
			<Box p={[3.7, 0.1, -5.0]} s={[0.5, 0.05, 0.05]} m={mm.pipe} />
			<Box p={[2.3, 0.05, -3.05]} s={[3.2, 0.1, 0.03]} m={mm.wood} />
			<mesh position={[4.0, 1.7, -6.6]} rotation={[0, -Math.PI / 2, 0]} material={mm.frost}>
				<planeGeometry args={[1.0, 0.8]} />
			</mesh>
			{/* ---------- upstairs ---------- */}
			<Box p={[0, UP - 0.05, 0.5]} s={[8, 0.1, 7.2]} m={mm.floor} />
			<Box p={[0, UP + 0.005, 0.5]} s={[1.2, 0.01, 7]} m={mm.carpet} />
			<Box p={[0, 5.35, 0.5]} s={[8, 0.1, 7.2]} m={mm.ceiling} />
			{/* hallway walls with doorways (west: z -1.6, 1.8; east: z -0.6) */}
			{[[-2.6, 1.1], [0.0, 1.0], [2.9, 2.1]].map(([z, d], i) => (
				<Box key={'w' + i} p={[-0.65, UP + 1.25, z]} s={[0.1, 2.5, d]} m={mm.wall} />
			))}
			{[[-2.15, 1.7], [1.8, 4.3]].map(([z, d], i) => (
				<Box key={'e' + i} p={[0.65, UP + 1.25, z]} s={[0.1, 2.5, d]} m={mm.wall} />
			))}
			{[-1.6, 1.8].map((z) => (
				<Box key={'lw' + z} p={[-0.65, UP + 2.3, z - 0.0]} s={[0.1, 0.4, 0.9]} m={mm.wall} />
			))}
			<Box p={[0.65, UP + 2.3, -0.6]} s={[0.1, 0.4, 0.9]} m={mm.wall} />
			<Door x={-0.65} z={-1.6} y0={UP} open={0.9} side={-1} />
			<Door x={-0.65} z={1.8} y0={UP} open={0.25} side={-1} />
			<Door x={0.65} z={-0.6} y0={UP} open={0.6} side={1} />
			{/* the rooms beyond the doors: pale light from bare windows */}
			<Box p={[-2.3, UP + 1.25, 0]} s={[0.1, 2.5, 7]} m={mm.wallDark} />
			<Box p={[2.3, UP + 1.25, -1]} s={[0.1, 2.5, 4]} m={mm.wallDark} />
			{/* THE BLANK END WALL, and Room Zero behind it */}
			<Box p={[0, UP + 1.25, 4.03]} s={[8, 2.5, 0.16]} m={mm.wall} />
			{doorInWall && (
				<group position={[0, UP, WALL_Z - 0.005]}>
					<Box p={[0, 1.0, 0]} s={[0.84, 2.02, 0.03]} m={mm.wood} />
					<Box p={[-0.45, 1.02, -0.01]} s={[0.06, 2.1, 0.04]} m={mm.door} />
					<Box p={[0.45, 1.02, -0.01]} s={[0.06, 2.1, 0.04]} m={mm.door} />
					<Box p={[0, 2.08, -0.01]} s={[0.96, 0.06, 0.04]} m={mm.door} />
					{[0.5, 1.5].map((y) => (
						<Box key={y} p={[0, y, -0.02]} s={[0.6, 0.7, 0.01]} m={mm.banister} />
					))}
					{/* no handle on this side */}
				</group>
			)}
			{/* moving boxes once the buyers have moved in */}
			{buyers &&
				[[0.3, 2.6, 0.5], [-0.25, 3.0, 0.4], [0.28, 3.3, 0.35]].map(([x, z, s], i) => (
					<Box key={i} p={[x, UP + s / 2, z]} s={[s, s, s]} m={mm.box} />
				))}
			{buyers && (
				<mesh position={[0.3, UP + 0.55, 2.6]} material={mm.board}>
					<cylinderGeometry args={[0.04, 0.035, 0.09, 6]} />
				</mesh>
			)}
			{/* ---------- the shell ---------- */}
			<Box p={[-4.05, 2.7, -1]} s={[0.1, 5.4, 14.4]} m={mm.brick} />
			<Box p={[0, 2.7, 6.25]} s={[8.2, 5.4, 0.1]} m={mm.brick} />
			<Box p={[4.05, 1.35, 1.5]} s={[0.1, 2.7, 9.4]} m={mm.brick} />
			{/* east side wall upstairs, with the bedroom window (bare) and Room Zero's window (curtained) */}
			<Box p={[4.07, UP + 1.3, -6.0]} s={[0.1, 2.6, 4.2]} m={mm.brick} />
			<Box p={[4.07, UP + 1.3, -2.95]} s={[0.1, 2.6, 1.9]} m={mm.brick} />
			<Box p={[4.07, UP + 0.4, -1.5]} s={[0.1, 0.8, 1.0]} m={mm.brick} />
			<Box p={[4.07, UP + 2.2, -1.5]} s={[0.1, 0.8, 1.0]} m={mm.brick} />
			<Box p={[4.07, UP + 1.3, 1.8]} s={[0.1, 2.6, 5.6]} m={mm.brick} />
			<Box p={[4.07, UP + 0.4, HIDDEN_WINDOW_Z]} s={[0.1, 0.8, 1.0]} m={mm.brick} />
			<Box p={[4.07, UP + 2.2, HIDDEN_WINDOW_Z]} s={[0.1, 0.8, 1.0]} m={mm.brick} />
			<Box p={[4.07, UP + 1.3, 5.85]} s={[0.1, 2.6, 0.5]} m={mm.brick} />
			<mesh position={[4.1, UP + 1.3, -1.5]} rotation={[0, Math.PI / 2, 0]} material={mm.glass}>
				<planeGeometry args={[1.0, 1.0]} />
			</mesh>
			{/* Room Zero's window: curtains drawn, from the inside */}
			<mesh position={[4.1, UP + 1.3, HIDDEN_WINDOW_Z]} rotation={[0, Math.PI / 2, 0]} material={mm.curtain}>
				<planeGeometry args={[1.0, 1.0]} />
			</mesh>
			{/* west upstairs */}
			<Box p={[-4.07, UP + 1.3, 0]} s={[0.1, 2.6, 12.4]} m={mm.brick} />
			{/* front: ground floor door and windows, upstairs windows */}
			<Box p={[0, 1.35, -8.12]} s={[8.2, 2.7, 0.04]} m={mm.brick} />
			<Box p={[0, UP + 1.3, -8.12]} s={[8.2, 2.6, 0.04]} m={mm.brick} />
			{[[-2.2, 1.0, 0.9, 2.0, mm.door], [1.5, 1.4, 1.2, 1.0, mm.glass], [-2.0, UP + 1.3, 1.0, 1.0, mm.glass], [1.8, UP + 1.3, 1.0, 1.0, mm.glass]].map(([x, y, w, h, m], i) => (
				<mesh key={i} position={[x as number, y as number, -8.15]} rotation={[0, Math.PI, 0]} material={m as THREE.Material}>
					<planeGeometry args={[w as number, h as number]} />
				</mesh>
			))}
			{/* the gable roof */}
			<Box p={[-2.1, 6.4, -1]} s={[4.9, 0.14, 14.8]} m={mm.roof} r={[0, 0, 0.5]} />
			<Box p={[2.1, 6.4, -1]} s={[4.9, 0.14, 14.8]} m={mm.roof} r={[0, 0, -0.5]} />
			<Box p={[2.6, 7.4, 3]} s={[0.6, 1.6, 0.6]} m={mm.brick} />
		</group>
	);
};

export const VAN_POS: [number, number, number] = [3.2, 0, -14];
export const Outside: React.FC<{evening?: number; vanShift?: number}> = ({evening = 0, vanShift = 0}) => {
	const mm = useM();
	const lit = useMemo(() => B('#ffd090'), []);
	return (
		<group>
			<Box p={[0, -0.12, -2]} s={[200, 0.1, 200]} m={mm.grass} />
			<Box p={[0, -0.08, -17]} s={[200, 0.1, 6]} m={mm.road} />
			<Box p={[-2.2, -0.07, -11]} s={[1.2, 0.1, 6]} m={mm.road} />
			{/* the sale board */}
			<Box p={[-4.5, 1.0, -11]} s={[0.08, 2.0, 0.08]} m={mm.tree} />
			<Box p={[-4.5, 1.8, -11.05]} s={[1.2, 0.8, 0.05]} m={mm.board} />
			{/* the inspector's van */}
			<group position={[VAN_POS[0] + vanShift, VAN_POS[1], VAN_POS[2]]} rotation={[0, vanShift > 0 ? Math.PI / 2 : 0, 0]}>
				<Box p={[0, 1.1, 0]} s={[2.0, 1.9, 4.6]} m={mm.van} />
				<Box p={[0, 0.85, 2.7]} s={[1.9, 1.3, 1.0]} m={mm.van} />
				<mesh position={[0, 1.2, 3.21]} material={mm.glass}>
					<planeGeometry args={[1.6, 0.6]} />
				</mesh>
				{[[-0.95, 1.8], [0.95, 1.8], [-0.95, -1.6], [0.95, -1.6]].map(([x, z], i) => (
					<mesh key={i} position={[x, 0.35, z]} rotation={[0, 0, Math.PI / 2]} material={mm.black}>
						<cylinderGeometry args={[0.35, 0.35, 0.25, 8]} />
					</mesh>
				))}
			</group>
			{/* a bare tree */}
			<group position={[-7, 0, -9]}>
				<Box p={[0, 2.5, 0]} s={[0.4, 5, 0.4]} m={mm.tree} />
				{[0.6, -0.8, 1.4].map((a, i) => (
					<Box key={i} p={[Math.sin(a) * 1.2, 4.2 + i * 0.6, Math.cos(a) * 1.2]} s={[0.12, 2.4, 0.12]} m={mm.tree} r={[Math.cos(a) * 0.7, 0, -Math.sin(a) * 0.7]} />
				))}
			</group>
			{/* evening: the buyers' lights and their car */}
			{evening > 0.5 && (
				<>
					{[[1.5, 1.4], [-2.0, UP + 1.3], [1.8, UP + 1.3]].map(([x, y], i) => (
						<mesh key={i} position={[x, y, -8.17]} rotation={[0, Math.PI, 0]} material={lit}>
							<planeGeometry args={[1.0, 0.95]} />
						</mesh>
					))}
					{/* Room Zero's curtained window, lit from inside */}
					<mesh position={[4.13, UP + 1.3, HIDDEN_WINDOW_Z]} rotation={[0, Math.PI / 2, 0]}>
						<planeGeometry args={[1.0, 1.0]} />
						<meshBasicMaterial color="#8a3a22" />
					</mesh>
					<group position={[-2.2, 0, -12.5]}>
						<Box p={[0, 0.6, 0]} s={[1.7, 0.8, 4.0]} m={mm.counter} />
						<Box p={[0, 1.2, -0.2]} s={[1.5, 0.6, 2.0]} m={mm.counter} />
					</group>
				</>
			)}
		</group>
	);
};

/** Breath clouds in front of the inspector's face in the cold house. */
export const Breath: React.FC<{p: [number, number, number]; t: number}> = ({p, t}) => {
	const m = useMemo(() => new THREE.MeshBasicMaterial({color: '#e8eef2', transparent: true, depthWrite: false}), []);
	const k = (t % 3.2) / 3.2;
	m.opacity = k < 0.6 ? 0.28 * Math.sin((k / 0.6) * Math.PI) : 0;
	return (
		<mesh position={[p[0], p[1] - 0.05 + k * 0.12, p[2]]} material={m} scale={0.03 + k * 0.09}>
			<icosahedronGeometry args={[1, 0]} />
		</mesh>
	);
};
