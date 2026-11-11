// Episode 9 world: "The Lighthouse That Went Dark" (true: Flannan Isles, Eilean Mor, December
// 1900). One consistent low-poly island, its sea, two steamers and a rowing boat.
//
// Layout (metres, y up). The sea is at y = 0. The island is a cliff-sided rock x[-60,60]
// z[-42,42] with a grassy top near y = 50. The lighthouse tower stands on the summit at TOWER
// (white, 23 m, a dark lantern room on top). The keepers' quarters are the low flat-roofed
// block to the south of it (QUARTERS); the kitchen is modelled inside it, with its door in the
// WEST wall, looking along the path toward the west landing. The east landing (x ~ 60) has
// steps up the cliff and a flagstaff at the top; the west landing (x ~ -60) has steps, a crane
// bracket and iron railings at about 33 m above the sea, torn and bent.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1, rng} from '../ps1';
import {SNAP6} from '../ep01/world';
import {tex} from '../ep02/world';

const M = (color: string, opts: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...opts}), 20, SNAP6);
const B = (color: string, opts: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...opts}), 20, SNAP6);

export const TOP = 50;
export const TOWER: [number, number, number] = [0, TOP, 6];
export const QUARTERS: [number, number, number] = [0, TOP, -8]; // centre of the kitchen floor
export const EAST_LANDING: [number, number, number] = [67, 2, 10];
export const WEST_RAIL: [number, number, number] = [-67, 33, -6];

const useMats = () =>
	useMemo(() => {
		const rock = tex(16, 16, (g, r) => {
			g.fillStyle = '#6e6c66';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 70; i++) {
				g.fillStyle = r() > 0.5 ? '#5a5854' : '#82807a';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 2, 1);
			}
		}, 91, [10, 6]);
		const grass = tex(16, 16, (g, r) => {
			g.fillStyle = '#3e4a32';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 60; i++) {
				g.fillStyle = r() > 0.5 ? '#4a5838' : '#323c28';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
			}
		}, 92, [12, 12]);
		const harl = tex(16, 16, (g, r) => {
			g.fillStyle = '#d0ccc0';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 30; i++) {
				g.fillStyle = r() > 0.5 ? '#c0bcb0' : '#dcd8cc';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
			}
		}, 93, [4, 3]);
		const boards = tex(16, 16, (g) => {
			g.fillStyle = '#6a5038';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#5a4230';
			for (let x = 0; x < 16; x += 4) g.fillRect(x, 0, 1, 16);
		}, 94, [3, 3]);
		const plaster = tex(16, 16, (g, r) => {
			g.fillStyle = '#b8b0a0';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 20; i++) {
				g.fillStyle = r() > 0.5 ? '#aca494' : '#c4bcac';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
			}
		}, 95, [4, 2]);
		return {
			rock: M('#ffffff', {map: rock}),
			rockDark: M('#4a4a46'),
			grass: M('#ffffff', {map: grass}),
			white: M('#ffffff', {map: harl}),
			whitePlain: M('#d8d4c8'),
			lantern: M('#1a1e22'),
			glassDark: B('#141a1e'),
			dome: M('#2a2e2a'),
			concrete: M('#8a8a84'),
			iron: M('#3a3634'),
			rust: M('#6a3a24'),
			boards: M('#ffffff', {map: boards}),
			plaster: M('#ffffff', {map: plaster, side: THREE.DoubleSide}),
			wood: M('#5a3e28'),
			table: M('#7a5a3a'),
			range: M('#1e1e1e'),
			ash: M('#6a6a66'),
			mug: M('#d8d4c8'),
			oilskin: M('#c8a020'),
			hook: M('#2a2a2a'),
			paper: M('#e0dccc'),
			hull: M('#141414'),
			hullRed: M('#5a1a14'),
			deck: M('#7a6a54'),
			superWhite: M('#d0ccc0'),
			funnel: M('#2a2a2a'),
			funnelBand: M('#a08040'),
			porthole: B('#ffd27a'),
			boat: M('#5a4632'),
			lamp: B('#ffc060'),
			black: B('#000000'),
		};
	}, []);

export type Mats = ReturnType<typeof useMats>;
const MatsContext = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(MatsContext)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <MatsContext.Provider value={useMats()}>{children}</MatsContext.Provider>;

export const Box: React.FC<{p: [number, number, number]; s: [number, number, number]; m: THREE.Material; r?: [number, number, number]}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={s} />
	</mesh>
);

export const Plane: React.FC<{p: [number, number, number]; w: number; h: number; map: THREE.Texture; rotY?: number}> = ({p, w, h, map, rotY = 0}) => {
	const m = useMemo(() => ps1(new THREE.MeshBasicMaterial({map}), 20, SNAP6), [map]);
	return (
		<mesh position={p} rotation={[0, rotY, 0]} material={m}>
			<planeGeometry args={[w, h]} />
		</mesh>
	);
};

// ------------------------------------------------------------------ the sea: a heaving low-poly surface around the island
export const seaHeight = (x: number, z: number, t: number, storm: number) =>
	(Math.sin(x * 0.09 + t * 0.9) * 0.9 + Math.sin(z * 0.13 - t * 1.2) * 0.7 + Math.sin((x + z) * 0.05 + t * 0.5) * 1.1) * (0.5 + storm);

export const Sea: React.FC<{t: number; storm: number; centre: [number, number]}> = ({t, storm, centre}) => {
	const mm = useMemo(() => ({
		water: ps1(new THREE.MeshLambertMaterial({color: '#2a3438', flatShading: true}), 20, SNAP6),
		foam: ps1(new THREE.MeshLambertMaterial({color: '#9aa6aa'}), 20, SNAP6),
		far: ps1(new THREE.MeshLambertMaterial({color: '#262e32'}), 20, SNAP6),
	}), []);
	const geo = useMemo(() => new THREE.PlaneGeometry(420, 420, 56, 56).rotateX(-Math.PI / 2), []);
	const pos = geo.attributes.position as THREE.BufferAttribute;
	for (let i = 0; i < pos.count; i++) {
		const x = pos.getX(i) + centre[0], z = pos.getZ(i) + centre[1];
		pos.setY(i, seaHeight(x, z, t, storm));
	}
	pos.needsUpdate = true;
	geo.computeVertexNormals();
	// surf around the foot of the cliffs
	const surf = useMemo(() => {
		const r = rng(31);
		return new Array(26).fill(0).map(() => {
			const a = r() * Math.PI * 2;
			return [Math.cos(a) * 66, Math.sin(a) * 50, r() * 6] as [number, number, number];
		});
	}, []);
	return (
		<group>
			<mesh geometry={geo} material={mm.water} position={[centre[0], 0, centre[1]]} />
			<mesh material={mm.far} position={[0, -1.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[6000, 6000]} />
			</mesh>
			{surf.map(([x, z, ph], i) => {
				const k = 0.5 + 0.5 * Math.sin(t * 1.3 + ph);
				return (
					<mesh key={i} material={mm.foam} position={[x, 0.6 + k * 2 * (0.5 + storm), z]} scale={[1.5 + k * 2, 0.3 + k * 0.8 * (0.5 + storm), 1.5]}>
						<boxGeometry args={[1, 1, 1]} />
					</mesh>
				);
			})}
		</group>
	);
};

// ------------------------------------------------------------------ the island
export const Island: React.FC<{railings: 'torn' | 'whole'}> = ({railings}) => {
	const mm = useM();
	const rocks = useMemo(() => {
		const r = rng(77);
		const out: {p: [number, number, number]; s: [number, number, number]; ry: number}[] = [];
		// the cliff mass: overlapping slabs with ragged tops
		for (let i = 0; i < 20; i++) {
			const a = (i / 20) * Math.PI * 2;
			const rx = 52 + r() * 8, rz = 36 + r() * 6;
			out.push({p: [Math.cos(a) * rx * 0.75, (TOP - 3 + r() * 4) / 2, Math.sin(a) * rz * 0.75], s: [26 + r() * 10, TOP - 3 + r() * 4, 22 + r() * 8], ry: r() * 1.2});
		}
		return out;
	}, []);
	return (
		<group>
			{rocks.map((b, i) => (
				<Box key={i} p={b.p} s={b.s} m={i % 3 ? mm.rock : mm.rockDark} r={[0, b.ry, 0]} />
			))}
			<Box p={[0, TOP / 2 - 1, 0]} s={[100, TOP - 2, 70]} m={mm.rock} />
			{/* the grassy top, a little domed */}
			<Box p={[0, TOP - 0.5, 0]} s={[104, 1.6, 74]} m={mm.grass} />
			<Box p={[0, TOP + 0.6, 2]} s={[60, 1.2, 44]} m={mm.grass} />
			{/* the lighthouse */}
			<group position={TOWER}>
				<mesh position={[0, 11.5 + 1.2, 0]} material={mm.white}>
					<cylinderGeometry args={[2.0, 2.5, 23, 10]} />
				</mesh>
				<mesh position={[0, 24.6, 0]} material={mm.lantern}>
					<cylinderGeometry args={[3.0, 3.0, 0.5, 10]} />
				</mesh>
				{/* the dark lantern room: no light */}
				<mesh position={[0, 26.4, 0]} material={mm.glassDark}>
					<cylinderGeometry args={[1.6, 1.6, 3.2, 10]} />
				</mesh>
				<mesh position={[0, 28.6, 0]} material={mm.dome}>
					<coneGeometry args={[1.9, 1.6, 10]} />
				</mesh>
				{new Array(10).fill(0).map((_, i) => (
					<Box key={i} p={[Math.cos((i / 10) * Math.PI * 2) * 2.9, 25.4, Math.sin((i / 10) * Math.PI * 2) * 2.9]} s={[0.12, 1.0, 0.12]} m={mm.iron} />
				))}
			</group>
			{/* the keepers' quarters: a low flat-roofed block; the kitchen (KitchenInterior) sits inside its west end */}
			<group position={[QUARTERS[0] + 2, TOP + 1.2, QUARTERS[2]]}>
				<Box p={[0, 1.6, -3.1]} s={[14, 3.2, 0.3]} m={mm.white} />
				<Box p={[0, 1.6, 3.1]} s={[14, 3.2, 0.3]} m={mm.white} />
				<Box p={[7, 1.6, 0]} s={[0.3, 3.2, 6.5]} m={mm.white} />
				{/* west wall with the door (z[-0.5,0.5]) */}
				<Box p={[-5, 1.6, -1.9]} s={[0.3, 3.2, 2.7]} m={mm.white} />
				<Box p={[-5, 1.6, 1.9]} s={[0.3, 3.2, 2.7]} m={mm.white} />
				<Box p={[-5, 2.85, 0]} s={[0.3, 0.7, 1.1]} m={mm.white} />
				<Box p={[1, 3.3, 0]} s={[12.6, 0.3, 6.8]} m={mm.whitePlain} />
				<Box p={[1, 3.6, 0]} s={[13, 0.3, 7.2]} m={mm.dome} />
				{/* windows (dark) on the south side */}
				{[-2, 2, 5].map((x) => (
					<mesh key={x} position={[x, 1.9, -3.27]} rotation={[0, Math.PI, 0]} material={mm.glassDark}>
						<planeGeometry args={[1.0, 1.2]} />
					</mesh>
				))}
			</group>
			{/* the wall around the station */}
			{[[0, -16, 40, 1.2], [0, 18, 40, 1.2]].map(([x, z, w], i) => (
				<Box key={i} p={[x as number, TOP + 1.6, z as number]} s={[w as number, 1.2, 0.5]} m={mm.whitePlain} />
			))}
			{/* the path from the door toward the west landing */}
			<Box p={[-24, TOP + 1.25, -8]} s={[38, 0.1, 1.6]} m={mm.concrete} />
			{/* ---- east landing: steps up the cliff, a jetty, the flagstaff ---- */}
			<Box p={EAST_LANDING} s={[8, 1.2, 6]} m={mm.concrete} />
			{new Array(12).fill(0).map((_, i) => (
				<Box key={i} p={[64.5 - i * 0.15, 3 + i * 4, 14 - (i % 2) * 5]} s={[2.4, 4.2, 4]} m={mm.concrete} />
			))}
			<group position={[50, TOP + 1.2, 14]}>
				<Box p={[0, 6, 0]} s={[0.25, 12, 0.25]} m={mm.wood} />
				<Box p={[0, 11.8, 0]} s={[1.6, 0.12, 0.12]} m={mm.wood} />
			</group>
			{/* ---- west landing: steps, the crane bracket, the railings 33 m above the sea ---- */}
			{new Array(8).fill(0).map((_, i) => (
				<Box key={i} p={[-64.5 + i * 0.1, 3 + i * 4.2, -10 + (i % 2) * 3]} s={[2.4, 4.4, 4]} m={mm.concrete} />
			))}
			<group position={WEST_RAIL}>
				<Box p={[2.0, -0.3, 0]} s={[6, 0.6, 7]} m={mm.concrete} />
				{railings === 'whole'
					? [-3, -1.5, 0, 1.5, 3].map((z) => <Box key={z} p={[-1.4, 0.6, z]} s={[0.12, 1.2, 0.12]} m={mm.iron} />)
					: [
							[-1.4, 0.6, -3, 0, 0, 0],
							[-1.7, 0.4, -1.5, 0.9, 0.3, 0.6],
							[-2.2, 0.1, 0.0, 1.4, 0.6, -0.3],
							[-1.9, 0.3, 1.5, -0.8, 0.2, 1.1],
							[-1.4, 0.6, 3, 0, 0, 0.2],
						].map(([x, y, z, rx, ry, rz], i) => <Box key={i} p={[x, y, z]} s={[0.12, 1.2, 0.12]} m={i % 2 ? mm.rust : mm.iron} r={[rx, ry, rz]} />)}
				{/* the top rail: whole, or wrenched out and twisted down toward the sea */}
				{railings === 'whole' ? (
					<Box p={[-1.4, 1.2, 0]} s={[0.1, 0.1, 6.2]} m={mm.iron} />
				) : (
					<>
						<Box p={[-1.5, 1.1, -2.2]} s={[0.1, 0.1, 1.8]} m={mm.iron} r={[0.2, 0, 0]} />
						<Box p={[-2.4, 0.3, 0.4]} s={[0.1, 0.1, 3.2]} m={mm.rust} r={[-0.7, 0.6, 0.5]} />
						<Box p={[-1.5, 1.1, 2.6]} s={[0.1, 0.1, 1.0]} m={mm.iron} r={[0.3, 0.2, 0]} />
					</>
				)}
				{/* the crane bracket and the empty iron frame of a rope box */}
				<Box p={[1.4, 1.5, -2.6]} s={[0.3, 3, 0.3]} m={mm.iron} />
				<Box p={[0.3, 2.9, -2.6]} s={[2.5, 0.2, 0.2]} m={mm.iron} />
				<Box p={[1.5, 0.3, 2.0]} s={[1.2, 0.1, 0.8]} m={mm.rust} />
				<Box p={[2.1, 0.6, 2.0]} s={[0.08, 0.6, 0.8]} m={mm.rust} r={[0, 0, 0.5]} />
			</group>
		</group>
	);
};

// ------------------------------------------------------------------ the kitchen in the quarters (west end), door in the west wall
export const KitchenInterior: React.FC<{clock: THREE.Texture; calendar: THREE.Texture; oilskins: number}> = ({clock, calendar, oilskins}) => {
	const mm = useM();
	const x0 = QUARTERS[0], y0 = TOP + 1.2, z0 = QUARTERS[2];
	return (
		<group position={[x0, y0, z0]}>
			{/* floor, ceiling, plaster walls (inside the harled shell) */}
			<Box p={[-0.5, 0.02, 0]} s={[8.6, 0.04, 6]} m={mm.boards} />
			<Box p={[-0.5, 3.1, 0]} s={[8.6, 0.05, 6]} m={mm.plaster} />
			<Box p={[-0.5, 1.55, -2.9]} s={[8.6, 3.1, 0.05]} m={mm.plaster} />
			<Box p={[-0.5, 1.55, 2.9]} s={[8.6, 3.1, 0.05]} m={mm.plaster} />
			<Box p={[3.7, 1.55, 0]} s={[0.05, 3.1, 6]} m={mm.plaster} />
			<Box p={[-2.82, 1.55, -1.9]} s={[0.05, 3.1, 2.3]} m={mm.plaster} />
			<Box p={[-2.82, 1.55, 1.9]} s={[0.05, 3.1, 2.3]} m={mm.plaster} />
			<Box p={[-2.82, 2.85, 0]} s={[0.05, 0.6, 1.5]} m={mm.plaster} />
			{/* the open door, swung inward against the wall */}
			<group position={[-2.8, 0, 0.5]} rotation={[0, -1.4, 0]}>
				<Box p={[0, 1.15, -0.5]} s={[0.06, 2.3, 1.0]} m={mm.wood} />
			</group>
			{/* the range against the north wall: cold, grey ash in the grate */}
			<group position={[1.2, 0, 2.55]}>
				<Box p={[0, 0.5, 0]} s={[1.4, 1.0, 0.6]} m={mm.range} />
				<Box p={[0, 1.05, 0]} s={[1.5, 0.08, 0.66]} m={mm.range} />
				<Box p={[0, 0.35, -0.31]} s={[0.6, 0.3, 0.02]} m={mm.ash} />
				<Box p={[0, 2.0, 0.15]} s={[0.5, 1.9, 0.3]} m={mm.range} />
			</group>
			{/* the table, three chairs pushed in, three mugs */}
			<Box p={[0.2, 0.78, 0]} s={[1.8, 0.06, 1.0]} m={mm.table} />
			{[[-0.7, -0.4], [1.1, -0.4], [-0.7, 0.4], [1.1, 0.4]].map(([x, z], i) => (
				<Box key={i} p={[0.2 + x * 0.95, 0.38, z * 1.1]} s={[0.06, 0.76, 0.06]} m={mm.table} />
			))}
			{[-0.5, 0.2, 0.9].map((x, i) => (
				<group key={i} position={[x, 0, i === 1 ? 0.75 : -0.75]}>
					<Box p={[0, 0.45, 0]} s={[0.45, 0.05, 0.42]} m={mm.wood} />
					<Box p={[0, 0.75, i === 1 ? 0.2 : -0.2]} s={[0.45, 0.6, 0.05]} m={mm.wood} />
				</group>
			))}
			{[-0.4, 0.2, 0.8].map((x, i) => (
				<mesh key={i} position={[x, 0.86, (i - 1) * 0.15]} material={mm.mug}>
					<cylinderGeometry args={[0.05, 0.045, 0.1, 6]} />
				</mesh>
			))}
			{/* the clock and the calendar on the south wall */}
			<Box p={[0.5, 2.1, -2.86]} s={[0.42, 0.42, 0.04]} m={mm.wood} />
			<Plane p={[0.5, 2.1, -2.83]} w={0.34} h={0.34} map={clock} />
			<Plane p={[-1.2, 1.8, -2.86]} w={0.42} h={0.56} map={calendar} />
			{/* the coat hooks by the door: three hooks, one set of oilskins */}
			{[-0.75, -1.15, -1.55].map((z, i) => (
				<group key={i}>
					<Box p={[-2.77, 1.75, z]} s={[0.08, 0.04, 0.04]} m={mm.hook} />
					{i < oilskins && (
						<group position={[-2.68, 1.2, z]}>
							<Box p={[0, 0.1, 0]} s={[0.12, 1.0, 0.38]} m={mm.oilskin} />
							<Box p={[0, 0.55, 0]} s={[0.14, 0.12, 0.2]} m={mm.oilskin} />
						</group>
					)}
				</group>
			))}
		</group>
	);
};

// ------------------------------------------------------------------ boats
/** A small steamer, bow toward +x. tender: the lighthouse tender (white upperworks, banded funnel). */
export const Steamer: React.FC<{p: [number, number, number]; ry: number; pitch: number; roll: number; tender?: boolean; lit?: boolean; len?: number}> = ({p, ry, pitch, roll, tender, lit, len = 40}) => {
	const mm = useM();
	const L = len;
	return (
		<group position={p} rotation={[roll, ry, pitch]}>
			<Box p={[0, 1.2, 0]} s={[L, 3.6, L * 0.17]} m={mm.hull} />
			<mesh position={[L / 2 + 2, 1.4, 0]} rotation={[0, 0, -Math.PI / 2]} material={mm.hull}>
				<coneGeometry args={[L * 0.085, 4, 4]} />
			</mesh>
			<Box p={[0, -0.8, 0]} s={[L, 0.6, L * 0.17]} m={mm.hullRed} />
			<Box p={[0, 3.1, 0]} s={[L, 0.2, L * 0.16]} m={mm.deck} />
			<Box p={[-L * 0.05, 4.6, 0]} s={[L * 0.3, 2.8, L * 0.11]} m={tender ? mm.superWhite : mm.hull} />
			<Box p={[-L * 0.05, 8.0, 0]} s={[1.6, 4.4, 1.6]} m={mm.funnel} />
			{tender && <Box p={[-L * 0.05, 9.0, 0]} s={[1.65, 0.6, 1.65]} m={mm.funnelBand} />}
			<Box p={[L * 0.3, 8, 0]} s={[0.3, 10, 0.3]} m={mm.wood} />
			<Box p={[-L * 0.35, 7, 0]} s={[0.3, 8, 0.3]} m={mm.wood} />
			{lit &&
				new Array(7).fill(0).map((_, i) => (
					<Box key={i} p={[-L * 0.3 + i * L * 0.1, 2.2, L * 0.086]} s={[0.5, 0.5, 0.05]} m={mm.porthole} />
				))}
		</group>
	);
};

/** The rowing boat from the tender: its bow in the foreground of the hook. */
export const RowingBoat: React.FC<{p: [number, number, number]; ry: number; pitch: number; roll: number}> = ({p, ry, pitch, roll}) => {
	const mm = useM();
	return (
		<group position={p} rotation={[roll, ry, pitch]}>
			<Box p={[0, 0.3, 0]} s={[5.2, 0.6, 1.6]} m={mm.boat} />
			<Box p={[0, 0.7, 0.78]} s={[5.2, 0.5, 0.08]} m={mm.boat} />
			<Box p={[0, 0.7, -0.78]} s={[5.2, 0.5, 0.08]} m={mm.boat} />
			<mesh position={[3.2, 0.55, 0]} rotation={[0, 0, -Math.PI / 2]} material={mm.boat}>
				<coneGeometry args={[0.8, 1.6, 4]} />
			</mesh>
			<Box p={[0.6, 0.65, 0]} s={[0.3, 0.06, 1.5]} m={mm.wood} />
			<Box p={[-1.0, 0.65, 0]} s={[0.3, 0.06, 1.5]} m={mm.wood} />
		</group>
	);
};
