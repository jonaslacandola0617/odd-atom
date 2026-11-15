// Episode 38 world: "FWD: Ingat Kayo" (Season 4, Visayan urban legend: Maria Labo, told as a chain text).
// Composites; no real town, market, stall, family or number:
// - THE TOWN AT NIGHT, from above: blocks of houses with lit windows, where phone screens light green
//   one after another as the message is passed on;
// - THE MARKET BY DAY: a manicure stall under a tarpaulin (bottles of polish, a stool, a bulb), a woman
//   with her hair over half her face, a customer's hand; stalls and passers-by behind;
// - THE HOUSE AT NIGHT: a front wall with a door and lit windows, a yard; a mother and two children;
// - OUR ROOM: a table with the phone, a wall with a jalousie window; outside it, between the slats,
//   half a face with a scar (the other half under her hair).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1, rng} from '../ps1';
import {SNAP6} from '../ep01/world';
import {Rider, RiderLook} from '../ep36/world';

export type V3 = [number, number, number];
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
const seg = (v: number, unit: number) => Math.min(24, Math.max(1, Math.ceil(v / unit)));
export const Box: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3; unit?: number}> = ({p, s, m, r, unit = 0.3}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={[s[0], s[1], s[2], seg(s[0], unit), seg(s[1], unit), seg(s[2], unit)]} />
	</mesh>
);
const Cyl: React.FC<{p: V3; r0: number; r1?: number; h: number; m: THREE.Material; rot?: V3; n?: number}> = ({p, r0, r1, h, m, rot, n = 8}) => (
	<mesh position={p} rotation={rot} material={m}>
		<cylinderGeometry args={[r1 ?? r0, r0, h, n]} />
	</mesh>
);

export const useMats = () =>
	useMemo(() => {
		const tarp = tex(16, 16, (g) => {
			for (let x = 0; x < 16; x += 4) {
				g.fillStyle = x % 8 ? '#c84a3a' : '#e8d8b0';
				g.fillRect(x, 0, 4, 16);
			}
		}, [3, 1]);
		const ground = tex(16, 16, (g) => {
			g.fillStyle = '#4a4640';
			g.fillRect(0, 0, 16, 16);
			const r = rng(381);
			for (let i = 0; i < 40; i++) {
				g.fillStyle = r() < 0.5 ? '#3e3a36' : '#56524a';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
			}
		}, [20, 20]);
		return {
			ground: lam('#ffffff', {map: ground}),
			roof: lam('#5a5a60'),
			roof2: lam('#6a4a3a'),
			wall: lam('#a89a80'),
			wall2: lam('#8a8a78'),
			win: bas('#e8b860'),
			winDark: bas('#141418'),
			glow: bas('#9aff7a'),
			lamp: bas('#ffc070'),
			pole: lam('#3a3a3a'),
			tarp: lam('#ffffff', {map: tarp, side: THREE.DoubleSide}),
			table: lam('#c8b890'),
			stool: lam('#4a6a9a'),
			bottle: [lam('#c82a4a'), lam('#e86aa0'), lam('#8a2a8a'), lam('#e8c8b0'), lam('#2a2a2a')],
			crate: lam('#8a6a40'),
			fruit: lam('#d8a020'),
			fruit2: lam('#5a8a2a'),
			skin: lam('#a87a58'),
			hair: lam('#0c0a08'),
			face: lam('#b8a898'),
			scar: lam('#5a2a2a'),
			eye: bas('#1a1210'),
			glint: bas('#e8e8d8'),
			door: lam('#5a3e28'),
			bar: lam('#3a2a1a'),
			floor: lam('#4a3a2a'),
			room: lam('#6a6458'),
			slat: bas('#8aa0a8', {transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false}),
			frame: lam('#4a3a2a'),
			night: bas('#05070c'),
			phone: lam('#2a2c30'),
			screen: bas('#9ab85a'),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
export const MatsContext = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(MatsContext)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <MatsContext.Provider value={useMats()}>{children}</MatsContext.Provider>;

// ------------------------------------------------------------------ the town from above: phones lighting window by window
export const TOWN = (() => {
	const r = rng(382);
	const houses: {x: number; z: number; w: number; d: number; h: number; ry: number; order: number}[] = [];
	for (let i = -3; i <= 3; i++)
		for (let j = -4; j <= 3; j++) {
			if (j === 0) continue; // the street
			houses.push({x: i * 3.6 + (r() - 0.5) * 0.6, z: j * 3.4 + (r() - 0.5) * 0.6, w: 2.2 + r() * 0.8, d: 2.0 + r() * 0.6, h: 2.2 + r() * 1.2, ry: (r() - 0.5) * 0.2, order: 0});
		}
	// the message spreads outward from one house near the middle
	const by = houses.map((h, k) => ({k, d: Math.hypot(h.x - 1.8, h.z - 3.4) + r() * 2.5})).sort((a, b) => a.d - b.d);
	by.forEach((o, n) => (houses[o.k].order = n));
	return houses;
})();
export const Town: React.FC<{lit: number}> = ({lit}) => {
	const M = useM();
	return (
		<group>
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={M.ground}>
				<planeGeometry args={[60, 60, 20, 20]} />
			</mesh>
			{TOWN.map((h, i) => (
				<group key={i} position={[h.x, 0, h.z]} rotation={[0, h.ry, 0]}>
					<Box p={[0, h.h / 2, 0]} s={[h.w, h.h, h.d]} m={i % 3 ? M.wall : M.wall2} unit={1} />
					<mesh position={[0, h.h + 0.5, 0]} rotation={[0, Math.PI / 4, 0]} scale={[h.w * 0.78, 1, h.d * 0.78]} material={i % 2 ? M.roof : M.roof2}>
						<coneGeometry args={[1, 1, 4]} />
					</mesh>
					{/* a window facing the street, lit; a phone glowing in it once the message arrives */}
					<Box p={[0, h.h * 0.55, h.d / 2 + 0.01]} s={[0.7, 0.55, 0.02]} m={h.order < lit ? M.glow : i % 4 ? M.win : M.winDark} unit={1} />
					<Box p={[h.w / 2 + 0.01, h.h * 0.55, 0]} s={[0.02, 0.55, 0.7]} m={h.order < lit ? M.glow : M.winDark} unit={1} />
				</group>
			))}
			{[-9, -3, 3, 9].map((x) => (
				<group key={x} position={[x, 0, 0.2]}>
					<Cyl p={[0, 2, 0]} r0={0.06} h={4} m={M.pole} n={5} />
					<Box p={[0, 4.0, 0]} s={[0.3, 0.1, 0.2]} m={M.lamp} unit={1} />
				</group>
			))}
		</group>
	);
};

// ------------------------------------------------------------------ the market by day
const HER: RiderLook = {shirt: '#c88a9a', pants: '#3a3a4a', hair: 'long', skin: '#b08a6a'};
const PASSERS: RiderLook[] = [
	{shirt: '#3a6a9a', pants: '#2a2a2a', hair: 'short'},
	{shirt: '#d8c890', pants: '#4a3a2a', hair: 'long'},
	{shirt: '#8a3a3a', pants: '#2a3a5a', hair: 'cap'},
	{shirt: '#4a7a4a', pants: '#3a3a3a', hair: 'short'},
];
export const Market: React.FC<{t: number; lift: number}> = ({t, lift}) => {
	const M = useM();
	return (
		<group>
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={M.ground}>
				<planeGeometry args={[40, 40, 16, 16]} />
			</mesh>
			{/* the stall: tarpaulin, table, bottles of polish, a hanging bulb */}
			<mesh position={[0, 2.2, 0]} rotation={[-Math.PI / 2 + 0.15, 0, 0]} material={M.tarp}>
				<planeGeometry args={[3, 2.4, 6, 4]} />
			</mesh>
			{[-1.4, 1.4].map((x) => (
				<Cyl key={x} p={[x, 1.1, 0.9]} r0={0.04} h={2.2} m={M.pole} n={5} />
			))}
			<Box p={[0, 0.72, 0.5]} s={[1.6, 0.06, 0.7]} m={M.table} unit={0.2} />
			<Box p={[0, 0.36, 0.5]} s={[1.5, 0.66, 0.6]} m={M.tarp} unit={0.2} />
			{Array.from({length: 10}, (_, i) => (
				<Cyl key={i} p={[-0.7 + i * 0.07, 0.79, 0.75]} r0={0.02} h={0.08} m={M.bottle[i % 5]} n={6} />
			))}
			<Box p={[0, 1.9, 0.5]} s={[0.06, 0.06, 0.06]} m={M.lamp} unit={1} />
			<Box p={[0, 0.25, -0.15]} s={[0.4, 0.5, 0.4]} m={M.stool} unit={0.2} />
			{/* her, seated behind the table, facing out; her hair falls over the left half of her face */}
			<Rider look={HER} pose="sit" position={[0, 0.05, -0.15]} bow={0.35 * (1 - lift)} />
			<group position={[0, 0.05 + 0.46 + 0.6, -0.15]} rotation={[0.35 * (1 - lift), 0, 0]}>
				<Box p={[-0.04, 0.06, 0.125]} s={[0.12, 0.34, 0.05]} m={M.hair} unit={1} />
			</group>
			{/* the customer's hand on the table, and the file moving over a nail */}
			<group position={[0.25, 0.77, 0.55]} rotation={[0, -0.4, 0]}>
				<Box p={[0, 0, 0]} s={[0.09, 0.03, 0.11]} m={M.skin} unit={1} />
				{[0, 1, 2, 3].map((k) => (
					<Box key={k} p={[-0.03 + k * 0.02, 0, -0.08]} s={[0.014, 0.02, 0.06]} m={M.skin} unit={1} />
				))}
				<Box p={[-0.0 + Math.sin(t * 9) * 0.015, 0.02, -0.11]} s={[0.01, 0.006, 0.08]} m={M.table} r={[0, 0.3, 0]} unit={1} />
			</group>
			{/* stalls behind, crates of fruit */}
			{[-4, -2, 2, 4].map((x, i) => (
				<group key={x} position={[x, 0, -3.5 - (i % 2)]}>
					<Box p={[0, 0.5, 0]} s={[1.6, 1.0, 0.8]} m={M.crate} unit={0.4} />
					<Box p={[0, 1.05, 0]} s={[1.5, 0.12, 0.7]} m={i % 2 ? M.fruit : M.fruit2} unit={0.4} />
					<mesh position={[0, 2.2, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.tarp}>
						<planeGeometry args={[2, 1.6]} />
					</mesh>
				</group>
			))}
			{/* passers-by in the aisle behind her */}
			{PASSERS.map((look, i) => {
				const x = (((t * 0.9 + i * 2.7) % 12) - 6) * (i % 2 ? 1 : -1);
				return <Rider key={i} look={look} pose="stand" walk={t * 1.6 + i} position={[x, 0, -2.0 - (i % 2) * 0.6]} rotation={[0, i % 2 ? Math.PI / 2 : -Math.PI / 2, 0]} />;
			})}
		</group>
	);
};

// ------------------------------------------------------------------ the house at night: a mother and two children go in; the door shuts
const MOTHER: RiderLook = {shirt: '#7a5a8a', pants: '#2a2a3a', hair: 'long'};
const KID1: RiderLook = {shirt: '#d8d0b0', pants: '#3a4a6a', hair: 'short'};
const KID2: RiderLook = {shirt: '#c86a5a', pants: '#3a3a3a', hair: 'long'};
export const HOUSE_DOOR: V3 = [0, 0, 0];
export const House: React.FC<{t: number; inK: number; door: number; bar: number}> = ({t, inK, door, bar}) => {
	const M = useM();
	// inK: 0 in the yard → 1 inside; door: 0 open → 1 shut
	const path = (dx: number, lag: number): V3 => {
		const k = Math.min(1, Math.max(0, (inK - lag) / (1 - lag * 0.8)));
		return [dx * (1 - k) + dx * 0.2 * k, 0, 2.6 - 3.2 * k];
	};
	return (
		<group>
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={M.ground}>
				<planeGeometry args={[30, 30, 12, 12]} />
			</mesh>
			<Box p={[-2.6, 1.6, 0]} s={[4, 3.2, 0.2]} m={M.wall} unit={0.6} />
			<Box p={[2.6, 1.6, 0]} s={[4, 3.2, 0.2]} m={M.wall} unit={0.6} />
			<Box p={[0, 2.75, 0]} s={[1.2, 0.9, 0.2]} m={M.wall} unit={0.6} />
			<Box p={[0, 3.6, 0.3]} s={[9.6, 0.25, 1.4]} r={[0.25, 0, 0]} m={M.roof} unit={1} />
			{/* the doorway glows; the door swings shut */}
			<Box p={[0, 1.15, -0.4]} s={[1.2, 2.3, 0.05]} m={M.win} unit={1} />
			<group position={[-0.6, 0, 0.0]} rotation={[0, -1.6 * (1 - door), 0]}>
				<Box p={[0.6, 1.15, 0]} s={[1.2, 2.3, 0.08]} m={M.door} unit={0.5} />
			</group>
			{/* two windows, lit; one goes dark when the door shuts */}
			<Box p={[-2.6, 1.7, 0.11]} s={[1.0, 0.8, 0.02]} m={door > 0.95 ? M.winDark : M.win} unit={1} />
			<Box p={[2.6, 1.7, 0.11]} s={[1.0, 0.8, 0.02]} m={M.win} unit={1} />
			{bar > 0 && <Box p={[0, 1.2 + 0.4 * (1 - bar), 0.07]} s={[1.3, 0.1, 0.08]} m={M.bar} unit={1} />}
			{/* the mother and children, hurrying in (gone once inside) */}
			{inK < 0.98 && (
				<>
					<Rider look={MOTHER} pose="stand" walk={t * 2.2} position={path(-0.4, 0.15)} rotation={[0, Math.PI, 0]} yaw={inK < 0.6 ? 0.7 * Math.sin(t * 2) : 0} />
					<group scale={0.6}>
						<Rider look={KID1} pose="stand" walk={t * 2.8} position={path(0.4, 0).map((v) => v / 0.6) as V3} rotation={[0, Math.PI, 0]} />
						<Rider look={KID2} pose="stand" walk={t * 2.8 + 0.5} position={path(0.9, 0.05).map((v) => v / 0.6) as V3} rotation={[0, Math.PI, 0]} />
					</group>
				</>
			)}
		</group>
	);
};

// ------------------------------------------------------------------ our room: the phone on the table, the jalousie, and her outside
export const PHONE: V3 = [0.1, 0.78, 0.2];
export const WIN: V3 = [0, 1.45, -1.6]; // the jalousie window centre, in the far wall (facing +z)
export const Room: React.FC<{t: number; glow: number; face: number}> = ({t, glow, face}) => {
	const M = useM();
	return (
		<group>
			<Box p={[0, -0.02, 0]} s={[4, 0.04, 4]} m={M.floor} unit={0.5} />
			{/* the far wall, with the window opening */}
			<Box p={[-1.35, 1.3, -1.6]} s={[1.9, 2.6, 0.1]} m={M.room} unit={0.4} />
			<Box p={[1.35, 1.3, -1.6]} s={[1.9, 2.6, 0.1]} m={M.room} unit={0.4} />
			<Box p={[0, 0.5, -1.6]} s={[0.8, 1.0, 0.1]} m={M.room} unit={0.4} />
			<Box p={[0, 2.3, -1.6]} s={[0.8, 0.6, 0.1]} m={M.room} unit={0.4} />
			<Box p={[-2, 1.3, 0]} s={[0.1, 2.6, 4]} m={M.room} unit={0.6} />
			<Box p={[2, 1.3, 0]} s={[0.1, 2.6, 4]} m={M.room} unit={0.6} />
			{/* the window frame and its glass slats, half open */}
			{[-0.41, 0.41].map((x) => (
				<Box key={x} p={[x, WIN[1], WIN[2]]} s={[0.04, 1.0, 0.12]} m={M.frame} unit={1} />
			))}
			{Array.from({length: 7}, (_, k) => (
				<mesh key={k} position={[0, WIN[1] - 0.42 + k * 0.14, WIN[2] + 0.02]} rotation={[1.1, 0, 0]} material={M.slat}>
					<planeGeometry args={[0.78, 0.13]} />
				</mesh>
			))}
			{[-0.36, 0.36].map((x) => (
				<Box key={x} p={[x, WIN[1], WIN[2] + 0.02]} s={[0.012, 0.95, 0.012]} m={M.frame} unit={1} />
			))}
			{/* the night outside */}
			<mesh position={[0, WIN[1], WIN[2] - 2.5]} material={M.night}>
				<planeGeometry args={[6, 4]} />
			</mesh>
			{/* the table and the phone on it, its screen glowing */}
			<Box p={[0.1, 0.38, 0.2]} s={[1.0, 0.76, 0.6]} m={M.door} unit={0.3} />
			<group position={PHONE} rotation={[0, 0.3, 0]}>
				<Box p={[0, 0.012, 0]} s={[0.05, 0.022, 0.11]} m={M.phone} unit={1} />
				<mesh position={[0, 0.0235, -0.02]} rotation={[-Math.PI / 2, 0, 0]} material={M.screen} visible={glow > 0}>
					<planeGeometry args={[0.036, 0.03]} />
				</mesh>
			</group>
			{/* her, outside: half a face between the slats, the other half under her hair; a scar across */}
			{face > 0 && (
				<group position={[0.04, WIN[1] + 0.02, WIN[2] - 0.1 - 0.12 * (1 - face)]}>
					<Box p={[0, 0, 0]} s={[0.2, 0.27, 0.2]} m={M.face} unit={0.04} />
					{/* her hair: over the left half, and framing the top and the right edge */}
					<Box p={[-0.055, 0.0, 0.105]} s={[0.1, 0.34, 0.03]} m={M.hair} unit={1} />
					<Box p={[0, 0.15, 0.03]} s={[0.24, 0.06, 0.24]} m={M.hair} unit={1} />
					<Box p={[0.11, 0.0, 0.03]} s={[0.03, 0.34, 0.2]} m={M.hair} unit={1} />
					<Box p={[0.05, 0.065, 0.103]} s={[0.05, 0.01, 0.01]} m={M.hair} unit={1} />
					<Box p={[0.05, 0.04, 0.102]} s={[0.04, 0.022, 0.01]} m={M.eye} unit={1} />
					<Box p={[0.058, 0.043, 0.108]} s={[0.01, 0.01, 0.004]} m={M.glint} unit={1} />
					<Box p={[0.012, -0.01, 0.115]} s={[0.025, 0.06, 0.03]} m={M.face} unit={1} />
					<Box p={[0.045, -0.005, 0.104]} s={[0.014, 0.2, 0.01]} r={[0, 0, 0.55]} m={M.scar} unit={1} />
					<Box p={[0.03, -0.085, 0.103]} s={[0.06, 0.012, 0.01]} m={M.eye} unit={1} />
				</group>
			)}
		</group>
	);
};
