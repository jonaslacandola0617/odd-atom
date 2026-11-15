// Episode 41 world: "Bilang sa Bintana" (Season 5, a commuter's experience shared online, retold).
// A composite night UV Express (no real operator, route or plate) and a composite avenue:
// - THE VAN: a boxy commuter van seen from inside, forward −z: driver on the left (Philippine
//   left-hand drive), a front passenger, two benches, the rear bench where I sit by the left window,
//   a sliding door on the right. The left wall is built around open window bays.
// - THE REFLECTION: behind the left windows, a mirrored copy of the cabin (scale x −1 about the
//   window plane) with its own occupants, under a dark tint pane, so the reflection can disagree
//   with the van; street lamps sweep across the glass.
// - THE AVENUE: a wide dark road, sodium lamps every 22 m, mid-rise buildings (the user's PSX URBAN
//   pack) and the van itself (the PSX car pack's van, light grey).
// The people are the user's PSX characters (see ./cast.tsx).
import React, {createContext, useContext, useMemo} from 'react';
import * as THREE from 'three';
import {ps1} from '../ps1';
import {SNAP6} from '../ep01/world';
import {PsxProp} from '../psx/models';

export type V3 = [number, number, number];
const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 64, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 64, SNAP6);
export const tex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rep: [number, number] = [1, 1]) => {
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
const seg = (v: number) => Math.min(40, Math.max(1, Math.ceil(v / 0.25)));
export const Box: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={[s[0], s[1], s[2], seg(s[0]), seg(s[1]), seg(s[2])]} />
	</mesh>
);

// ------------------------------------------------------------------ the cabin's measures
export const VAN = {halfW: 0.86, roof: 1.42, front: -2.2, rear: 2.05, winLo: 0.82, winHi: 1.28};
/** seat rows (z) and the four seat places across a bench (x) */
export const ROW = {front: -1.45, b1: -0.45, b2: 0.5, rear: 1.45};
export const SEATX = [-0.63, -0.21, 0.21, 0.63];
export const SEAT_TOP = 0.44;

const useMatsInner = () =>
	useMemo(() => {
		const vinyl = tex(8, 8, (g) => {
			g.fillStyle = '#5a5c66';
			g.fillRect(0, 0, 8, 8);
			g.fillStyle = '#4a4c54';
			g.fillRect(0, 3, 8, 1);
			g.fillRect(0, 7, 8, 1);
		}, [3, 1]);
		const floor = tex(8, 8, (g) => {
			g.fillStyle = '#1c1c1e';
			g.fillRect(0, 0, 8, 8);
			g.fillStyle = '#26262a';
			for (let i = 0; i < 8; i += 2) g.fillRect(i, 0, 1, 8);
		}, [6, 12]);
		const road = tex(32, 32, (g) => {
			g.fillStyle = '#26262a';
			g.fillRect(0, 0, 32, 32);
			for (let i = 0; i < 90; i++) {
				g.fillStyle = i % 2 ? '#2e2e33' : '#202024';
				g.fillRect((i * 37) % 32, (i * 13) % 32, 1, 1);
			}
		}, [8, 60]);
		// a lamp passing the glass: a soft orange bar
		const sweep = tex(32, 4, (g) => {
			const gr = g.createLinearGradient(0, 0, 32, 0);
			gr.addColorStop(0, 'rgba(255,150,60,0)');
			gr.addColorStop(0.5, 'rgba(255,170,80,1)');
			gr.addColorStop(1, 'rgba(255,150,60,0)');
			g.fillStyle = gr;
			g.fillRect(0, 0, 32, 4);
		});
		return {
			wall: lam('#6e6e72'),
			liner: lam('#7a7870'),
			trim: lam('#2e2e32'),
			vinyl: lam('#ffffff', {map: vinyl}),
			floor: lam('#ffffff', {map: floor}),
			dash: lam('#1e1e22'),
			chrome: lam('#8a8a90'),
			tint: bas('#04070c', {transparent: true, opacity: 0.35, depthWrite: false}),
			outside: bas('#020305'),
			sweep: bas('#ffffff', {map: sweep, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.6}),
			road: lam('#ffffff', {map: road}),
			line: lam('#a8a490'),
			kerb: lam('#4a4a4c'),
			walk: lam('#3a3a3c'),
			lamp: bas('#ffc070'),
			screenGlow: bas('#9cd0ff'),
			dent: lam('#3e4048', {transparent: true, opacity: 0.7}),
		};
	}, []);
type Mats = ReturnType<typeof useMatsInner>;
const Ctx = createContext<Mats | null>(null);
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMatsInner()}>{children}</Ctx.Provider>;
export const useM = () => useContext(Ctx)!;

// ------------------------------------------------------------------ a bench
const Bench: React.FC<{z: number; w?: number; x?: number; dents?: number[]}> = ({z, w = 1.66, x = 0, dents = []}) => {
	const M = useM();
	return (
		<group>
			<Box p={[x, SEAT_TOP - 0.06, z + 0.02]} s={[w, 0.12, 0.46]} m={M.vinyl} />
			<Box p={[x, 0.18, z + 0.02]} s={[w - 0.06, 0.3, 0.4]} m={M.trim} />
			<Box p={[x, SEAT_TOP + 0.33, z + 0.27]} s={[w, 0.66, 0.1]} m={M.vinyl} r={[-0.12, 0, 0]} />
			{/* dents: where someone sat (k 0..1, one per seat place) */}
			{dents.map((k, i) =>
				k > 0.01 ? (
					<mesh key={i} position={[SEATX[i], SEAT_TOP + 0.003, z + 0.02]} rotation={[-Math.PI / 2, 0, 0]} material={M.dent} scale={[1, 0.8, 1]}>
						<circleGeometry args={[0.15 * k, 12]} />
					</mesh>
				) : null,
			)}
		</group>
	);
};

/** The cabin. leftWall false: for the mirrored copy (its left wall is the glass itself). */
export const Cabin: React.FC<{leftWall?: boolean; dents?: number[]; children?: React.ReactNode}> = ({leftWall = true, dents, children}) => {
	const M = useM();
	const {halfW: W, roof, front, rear, winLo, winHi} = VAN;
	const L = rear - front;
	const zc = (front + rear) / 2;
	// window bays along the sides (z ranges), between pillars
	const bays: [number, number][] = [[-1.9, -1.0], [-0.9, -0.05], [0.05, 0.72], [0.8, 1.95]];
	const pillars = [[front, -1.9], [-1.0, -0.9], [-0.05, 0.05], [0.72, 0.8], [1.95, rear]] as [number, number][];
	const side = (x: number, s: 1 | -1) => (
		<group>
			<Box p={[x, winLo / 2, zc]} s={[0.05, winLo, L]} m={M.wall} />
			<Box p={[x, (winHi + roof) / 2, zc]} s={[0.05, roof - winHi, L]} m={M.wall} />
			{pillars.map(([a, b], i) => (
				<Box key={i} p={[x, (winLo + winHi) / 2, (a + b) / 2]} s={[0.06, winHi - winLo, b - a]} m={M.trim} />
			))}
			{/* the sill */}
			<Box p={[x - s * 0.04, winLo, zc]} s={[0.08, 0.03, L]} m={M.trim} />
		</group>
	);
	return (
		<group>
			<Box p={[0, -0.03, zc]} s={[2 * W, 0.06, L]} m={M.floor} />
			<Box p={[0, roof + 0.03, zc]} s={[2 * W, 0.06, L]} m={M.liner} />
			{leftWall && side(-W, -1)}
			{side(W, 1)}
			{/* outside the right windows: night */}
			{bays.map(([a, b], i) => (
				<mesh key={i} position={[W + 0.04, (winLo + winHi) / 2, (a + b) / 2]} rotation={[0, -Math.PI / 2, 0]} material={M.outside}>
					<planeGeometry args={[b - a, winHi - winLo]} />
				</mesh>
			))}
			{/* rear door and its window */}
			<Box p={[0, roof / 2, rear]} s={[2 * W, roof, 0.05]} m={M.wall} />
			{/* the dash, the wheel, the windscreen dark */}
			<Box p={[0, 0.55, front + 0.15]} s={[2 * W, 0.5, 0.3]} m={M.dash} />
			<mesh position={[-0.45, 0.82, front + 0.45]} rotation={[-1.05, 0, 0]} material={M.dash}>
				<torusGeometry args={[0.17, 0.02, 4, 12]} />
			</mesh>
			<mesh position={[0, 1.05, front + 0.02]} material={M.outside}>
				<planeGeometry args={[2 * W, 0.6]} />
			</mesh>
			{/* the rear-view mirror */}
			<Box p={[0, 1.28, front + 0.32]} s={[0.24, 0.07, 0.02]} m={M.trim} />
			{/* front seats (two buckets) and the three benches */}
			<Bench z={ROW.front} w={0.5} x={-0.45} />
			<Bench z={ROW.front} w={0.5} x={0.45} />
			<Bench z={ROW.b1} />
			<Bench z={ROW.b2} />
			<Bench z={ROW.rear} dents={dents} />
			{children}
		</group>
	);
};

/** The glass of the left windows: dark tint, with lamps sweeping across (phase from the van's travel). */
export const LeftGlass: React.FC<{travel: number}> = ({travel}) => {
	const M = useM();
	const {halfW: W, winLo, winHi} = VAN;
	const SP = 22; // lamp spacing (m)
	const sweeps = [];
	for (let k = -1; k <= 1; k++) {
		// a lamp passes from front (−z) to rear (+z) as the van drives on
		const z = ((travel % SP) + SP) % SP - SP / 2 + k * SP;
		const zz = z * 0.32; // its glint moves slower across the near glass than the lamp itself
		sweeps.push(
			<mesh key={k} position={[-W + 0.012, (winLo + winHi) / 2 + 0.05, zz]} rotation={[0, Math.PI / 2, 0]} material={M.sweep}>
				<planeGeometry args={[1.6, winHi - winLo]} />
			</mesh>,
		);
	}
	return (
		<group>
			<mesh position={[-W + 0.006, (winLo + winHi) / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={M.tint}>
				<planeGeometry args={[3.9, winHi - winLo]} />
			</mesh>
			{sweeps}
		</group>
	);
};

/** The mirrored copy behind the left glass. */
export const Reflection: React.FC<{children?: React.ReactNode; dents?: number[]}> = ({children, dents}) => (
	<group position={[-2 * VAN.halfW, 0, 0]} scale={[-1, 1, 1]}>
		<Cabin leftWall={false} dents={dents}>
			{children}
		</Cabin>
	</group>
);

// ------------------------------------------------------------------ the avenue
export const LAMP_SP = 22;
export const Avenue: React.FC<{z0: number; z1: number}> = ({z0, z1}) => {
	const M = useM();
	const lamps: number[] = [];
	for (let z = Math.floor(z0 / LAMP_SP) * LAMP_SP; z < z1; z += LAMP_SP) lamps.push(z);
	const blocks: number[] = [];
	for (let z = Math.floor(z0 / 26) * 26; z < z1; z += 26) blocks.push(z);
	const zc = (z0 + z1) / 2;
	const L = z1 - z0;
	return (
		<group>
			<Box p={[0, -0.05, zc]} s={[16, 0.1, L]} m={M.road} />
			{/* lane marks */}
			{Array.from({length: Math.ceil(L / 6)}, (_, i) => z0 + i * 6).map((z) => (
				<group key={z}>
					<Box p={[-2.6, 0.005, z]} s={[0.12, 0.01, 2.6]} m={M.line} />
					<Box p={[2.6, 0.005, z]} s={[0.12, 0.01, 2.6]} m={M.line} />
				</group>
			))}
			<Box p={[-8.4, 0.08, zc]} s={[0.4, 0.16, L]} m={M.kerb} />
			<Box p={[8.4, 0.08, zc]} s={[0.4, 0.16, L]} m={M.kerb} />
			<Box p={[-10.6, 0.1, zc]} s={[4, 0.2, L]} m={M.walk} />
			<Box p={[10.6, 0.1, zc]} s={[4, 0.2, L]} m={M.walk} />
			{lamps.map((z) => (
				<group key={z}>
					<PsxProp path="assets/models/psx/props/urban/street_light.glb" position={[8.9, 0, z]} rotation={[0, Math.PI / 2, 0]} s={1.15} />
					<mesh position={[7.4, 6.6, z]} material={M.lamp}>
						<boxGeometry args={[0.5, 0.08, 0.25]} />
					</mesh>
				</group>
			))}
			{blocks.map((z, i) => (
				<group key={z}>
					<PsxProp path={`assets/models/psx/props/urban/${['flat_square_concrete', 'flat_Lshape_brick', 'flat_square_brick_alt'][i % 3]}.glb`} position={[-17, 0, z]} rotation={[0, Math.PI / 2, 0]} s={1} />
					<PsxProp path={`assets/models/psx/props/urban/${['flat_square_brick_alt', 'flat_square_concrete', 'flat_Lshape_brick'][i % 3]}.glb`} position={[17, 0, z + 10]} rotation={[0, -Math.PI / 2, 0]} s={1} />
				</group>
			))}
		</group>
	);
};

/** The van from outside (the car pack's van, light grey), nose toward −z. */
export const VanExterior: React.FC<{p: V3; roll?: number}> = ({p, roll = 0}) => (
	<group position={p} rotation={[0, 0, roll]}>
		<PsxProp path="assets/models/psx/props/car4/Car4.obj" tex="assets/models/psx/props/car4/car4_lightgrey.png" s={0.6} rotation={[0, Math.PI, 0]} />
	</group>
);
