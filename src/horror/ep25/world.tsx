// Episode 25 world: "Camera Three" (Season 3, a real reported case: the Hampton Court Palace CCTV
// figure, October 2003). Composites at real scale, not a survey of the palace:
// - THE GALLERY (origin): a long Tudor-style panelled corridor (oak linenfold panelling, plaster,
//   dark portraits, leaded windows with moonlight), ending in a pair of modern fire doors with push
//   bars, a green EXIT sign and a CCTV camera above;
// - THE STAIRS (x 60): a dark stair hall (camera 2);
// - BASE COURT (x 120): a brick gatehouse arch with a lamp, outside at night (camera 1);
// - the robed figure: a long dark robe to the floor, a pale face (as the released footage was
//   described); never identified, never named;
// - the guard: a dark uniform and cap, seen only from behind on camera 3 (POV otherwise).
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
const seg = (v: number) => Math.min(16, Math.max(1, Math.ceil(v / 0.4)));
export const Box: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={[s[0], s[1], s[2], seg(s[0]), seg(s[1]), seg(s[2])]} />
	</mesh>
);

export const DOORS_Z = -12; // the fire doors at the end of the gallery
export const STAIRS: V3 = [60, 0, 0];
export const COURT: V3 = [120, 0, 0];
export const GW = 3.0; // gallery width

const useMats = () =>
	useMemo(() => {
		const linen = tex(16, 16, (g) => {
			g.fillStyle = '#3a2416';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#2a180e';
			g.fillRect(0, 0, 16, 1);
			g.fillRect(0, 0, 1, 16);
			g.fillStyle = '#4a3020';
			for (let x = 3; x < 15; x += 3) g.fillRect(x, 3, 1, 10);
		}, [10, 2]);
		const boards = tex(16, 16, (g) => {
			g.fillStyle = '#3a2a1c';
			g.fillRect(0, 0, 16, 16);
			for (let x = 0; x < 16; x += 4) {
				g.fillStyle = '#2a1e14';
				g.fillRect(x, 0, 1, 16);
			}
		}, [2, 14]);
		const brick = tex(16, 16, (g) => {
			g.fillStyle = '#5a2e22';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#3a2018';
			for (let y = 0; y < 16; y += 4) {
				g.fillRect(0, y, 16, 1);
				for (let x = (y / 4) % 2 ? 0 : 4; x < 16; x += 8) g.fillRect(x, y, 1, 4);
			}
		}, [6, 6]);
		const portrait = tex(16, 20, (g) => {
			g.fillStyle = '#1a140e';
			g.fillRect(0, 0, 16, 20);
			g.fillStyle = '#2a2016';
			g.fillRect(5, 5, 6, 7);
			g.fillRect(3, 12, 10, 8);
		});
		const exit = tex(32, 12, (g) => {
			g.fillStyle = '#10a040';
			g.fillRect(0, 0, 32, 12);
			g.fillStyle = '#e8ffe8';
			g.fillRect(4, 3, 3, 6);
			g.fillRect(9, 5, 10, 2);
			g.fillRect(16, 3, 3, 6);
		});
		return {
			linen: lam('#ffffff', {map: linen}),
			plaster: lam('#8a8270'),
			beam: lam('#2a1a10'),
			boards: lam('#ffffff', {map: boards}),
			portrait: lam('#ffffff', {map: portrait}),
			gilt: lam('#6a5428'),
			glass: bas('#2a3448'),
			lead: lam('#1a1a1c'),
			door: lam('#5a4630'),
			push: lam('#9a9a98'),
			exit: bas('#ffffff', {map: exit}),
			cctv: lam('#d8d8d0'),
			black: bas('#020202'),
			dim: lam('#4a4a44'),
			brick: lam('#ffffff', {map: brick}),
			stone: lam('#8a8476'),
			lamp: bas('#ffe0a0'),
			cobble: lam('#3a3a3a'),
			step: lam('#4a3a2a'),
			rail: lam('#2a1a10'),
			robe: lam('#141210'),
			robe2: lam('#2a2420'),
			pale: lam('#c8c4b4'),
			socket: bas('#050505'),
			uniform: lam('#1a1c22'),
			cap: lam('#101216'),
			hivis: lam('#6a7a2a'),
			glove: lam('#141414'),
			sky: new THREE.MeshBasicMaterial({color: '#0a0e18', side: THREE.BackSide, fog: false}),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
const Ctx = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(Ctx)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMats()}>{children}</Ctx.Provider>;

/** The gallery. doors: 0..1 open (each leaf swings outwards, away from us, by 1.45 rad at 1). */
export const Gallery: React.FC<{doors: number}> = ({doors}) => {
	const m = useM();
	const len = 22;
	const zc = DOORS_Z + len / 2;
	return (
		<group>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, zc]} material={m.boards}>
				<planeGeometry args={[GW, len, 6, 30]} />
			</mesh>
			<Box p={[0, 3.6, zc]} s={[GW, 0.1, len]} m={m.plaster} />
			{Array.from({length: 11}, (_, i) => (
				<Box key={`b${i}`} p={[0, 3.45, DOORS_Z + 1 + i * 2]} s={[GW, 0.2, 0.25]} m={m.beam} />
			))}
			{[-1, 1].map((sd) => (
				<group key={sd}>
					<Box p={[sd * (GW / 2), 0.6, zc]} s={[0.1, 1.2, len]} m={m.linen} />
					<Box p={[sd * (GW / 2), 2.4, zc]} s={[0.1, 2.4, len]} m={m.plaster} />
					<Box p={[sd * (GW / 2 - 0.06), 1.22, zc]} s={[0.04, 0.06, len]} m={m.beam} />
				</group>
			))}
			{/* dark portraits on the right wall; leaded windows on the left, with moonlight */}
			{Array.from({length: 5}, (_, i) => (
				<group key={`p${i}`} position={[GW / 2 - 0.07, 2.1, DOORS_Z + 3 + i * 3.6]} rotation={[0, -Math.PI / 2, 0]}>
					<Box p={[0, 0, -0.01]} s={[0.78, 1.0, 0.04]} m={m.gilt} />
					<mesh position={[0, 0, 0.012]} material={m.portrait}>
						<planeGeometry args={[0.66, 0.86]} />
					</mesh>
				</group>
			))}
			{Array.from({length: 4}, (_, i) => (
				<group key={`w${i}`} position={[-GW / 2 + 0.06, 2.1, DOORS_Z + 4.5 + i * 4.2]}>
					<Box p={[0, 0, 0]} s={[0.02, 1.4, 0.9]} m={m.glass} />
					{[-0.3, 0, 0.3].map((z) => (
						<Box key={z} p={[0.01, 0, z]} s={[0.02, 1.4, 0.03]} m={m.lead} />
					))}
					<Box p={[0.01, 0, 0]} s={[0.02, 0.03, 0.9]} m={m.lead} />
				</group>
			))}
			{/* the end wall, the doorway, the two fire-door leaves, the EXIT sign, the CCTV camera */}
			<Box p={[-1.15, 1.8, DOORS_Z]} s={[0.7, 3.6, 0.25]} m={m.plaster} />
			<Box p={[1.15, 1.8, DOORS_Z]} s={[0.7, 3.6, 0.25]} m={m.plaster} />
			<Box p={[0, 2.95, DOORS_Z]} s={[1.6, 1.3, 0.25]} m={m.plaster} />
			{/* the room beyond the doors: dim, so a figure in the doorway reads against it */}
			<Box p={[0, 1.6, DOORS_Z - 2.2]} s={[2.4, 3.2, 0.1]} m={m.dim} />
			<Box p={[0, 0.01, DOORS_Z - 1.2]} s={[2.4, 0.02, 2.0]} m={m.dim} />
			{[-1, 1].map((sd) => (
				<group key={`d${sd}`} position={[sd * 0.8, 0, DOORS_Z - 0.1]} rotation={[0, sd * doors * 1.45, 0]}>
					<Box p={[-sd * 0.4, 1.1, 0]} s={[0.78, 2.2, 0.06]} m={m.door} />
					<Box p={[-sd * 0.4, 1.0, 0.05]} s={[0.6, 0.05, 0.05]} m={m.push} />
				</group>
			))}
			<mesh position={[0, 2.45, DOORS_Z + 0.14]} material={m.exit}>
				<planeGeometry args={[0.5, 0.18]} />
			</mesh>
			<group position={[1.3, 3.2, DOORS_Z + 2.4]} rotation={[0.35, 0.3, 0]}>
				<Box p={[0, 0, 0]} s={[0.1, 0.1, 0.22]} m={m.cctv} />
			</group>
		</group>
	);
};

/** Camera 2: a dark stair hall. */
export const Stairs: React.FC = () => {
	const m = useM();
	return (
		<group position={STAIRS}>
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={m.boards}>
				<planeGeometry args={[6, 10, 6, 10]} />
			</mesh>
			{Array.from({length: 14}, (_, i) => (
				<Box key={i} p={[0, 0.1 + i * 0.2, -1 - i * 0.28]} s={[2.0, 0.2, 0.3]} m={m.step} />
			))}
			<Box p={[-1.05, 1.9, -2.9]} s={[0.06, 0.06, 4.6]} m={m.rail} r={[0.6, 0, 0]} />
			<Box p={[0, 2.5, -6]} s={[6, 5, 0.2]} m={m.linen} />
			<Box p={[-2.6, 2.5, -2]} s={[0.2, 5, 8]} m={m.plaster} />
			<Box p={[2.6, 2.5, -2]} s={[0.2, 5, 8]} m={m.plaster} />
		</group>
	);
};

/** Camera 1: Base Court, a brick gatehouse arch with a lamp, at night. */
export const Court: React.FC = () => {
	const m = useM();
	return (
		<group position={COURT}>
			<mesh material={m.sky}>
				<sphereGeometry args={[60, 10, 8]} />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={m.cobble}>
				<planeGeometry args={[30, 30, 10, 10]} />
			</mesh>
			<Box p={[-4, 5, -8]} s={[6, 10, 2]} m={m.brick} />
			<Box p={[4, 5, -8]} s={[6, 10, 2]} m={m.brick} />
			<Box p={[0, 8, -8]} s={[2, 4, 2]} m={m.brick} />
			<Box p={[0, 2.5, -9]} s={[2, 5, 0.2]} m={m.black} />
			{[-3.2, 3.2].map((x) => (
				<Box key={x} p={[x, 10.4, -8]} s={[1.2, 1.0, 1.2]} m={m.stone} />
			))}
			<Box p={[1.5, 3.2, -6.9]} s={[0.25, 0.35, 0.25]} m={m.lamp} />
		</group>
	);
};

/** The robed figure: a long dark robe to the floor, a pale face; arm: 0..1 reaching for the door. */
export const Robed: React.FC<{p: V3; ry: number; arm?: number}> = ({p, ry, arm = 0}) => {
	const m = useM();
	return (
		<group position={p} rotation={[0, ry, 0]}>
			<mesh position={[0, 0.82, 0]} material={m.robe}>
				<cylinderGeometry args={[0.22, 0.42, 1.64, 9]} />
			</mesh>
			<Box p={[0, 1.5, 0]} s={[0.5, 0.18, 0.28]} m={m.robe2} />
			<mesh position={[0, 1.72, 0.02]} scale={[0.85, 1.1, 0.9]} material={m.pale}>
				<icosahedronGeometry args={[0.11, 1]} />
			</mesh>
			{[-0.038, 0.038].map((x) => (
				<mesh key={x} position={[x, 1.745, 0.1]} material={m.socket}>
					<boxGeometry args={[0.042, 0.032, 0.02]} />
				</mesh>
			))}
			<mesh position={[0, 1.665, 0.1]} material={m.socket}>
				<boxGeometry args={[0.05, 0.016, 0.02]} />
			</mesh>
			{/* a hood that frames the pale face */}
			<mesh position={[0, 1.76, -0.03]} scale={[1.25, 1.35, 1.2]} material={m.robe}>
				<sphereGeometry args={[0.13, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.75]} />
			</mesh>
			<group position={[0.24, 1.45, 0]} rotation={[-arm * 1.3, 0, 0.1]}>
				<Box p={[0, -0.3, 0]} s={[0.11, 0.62, 0.11]} m={m.robe} />
				<Box p={[0, -0.64, 0]} s={[0.06, 0.1, 0.05]} m={m.pale} />
			</group>
			<group position={[-0.24, 1.45, 0]} rotation={[0, 0, -0.08]}>
				<Box p={[0, -0.3, 0]} s={[0.11, 0.62, 0.11]} m={m.robe} />
			</group>
		</group>
	);
};

/** The guard, seen from behind (camera 3 only). */
export const Guard: React.FC<{p: V3; ry: number; torch: boolean}> = ({p, ry, torch}) => {
	const m = useM();
	return (
		<group position={p} rotation={[0, ry, 0]}>
			{[-0.1, 0.1].map((x) => (
				<Box key={x} p={[x, 0.42, 0]} s={[0.15, 0.84, 0.16]} m={m.uniform} />
			))}
			<Box p={[0, 1.15, 0]} s={[0.46, 0.66, 0.26]} m={m.hivis} />
			<mesh position={[0, 1.6, 0]} material={m.pale}>
				<icosahedronGeometry args={[0.11, 1]} />
			</mesh>
			<mesh position={[0, 1.68, 0]} material={m.cap}>
				<cylinderGeometry args={[0.12, 0.12, 0.08, 8]} />
			</mesh>
			{[-1, 1].map((sd) => (
				<Box key={sd} p={[sd * 0.28, 1.12, torch && sd > 0 ? -0.18 : 0]} s={[0.1, 0.6, 0.12]} m={m.uniform} r={[torch && sd > 0 ? 1.2 : 0, 0, 0]} />
			))}
		</group>
	);
};

/** The guard's gloved hands on the push bars, in the world, in front of the doors (seen in his POV). */
export const Hands: React.FC<{push: number; z: number}> = ({push, z}) => {
	const m = useM();
	return (
		<group position={[0.12, 1.15, z]}>
			{[-1, 1].map((sd) => (
				<group key={sd} position={[sd * 0.24, 0, -push * 0.5]}>
					<Box p={[0, 0, 0.12]} s={[0.09, 0.08, 0.3]} m={m.uniform} />
					<Box p={[0, 0, -0.04]} s={[0.09, 0.05, 0.1]} m={m.glove} />
				</group>
			))}
		</group>
	);
};

export const flicker01 = (t: number, seed: number) => {
	const r = rng(seed * 7919 + Math.floor(t * 12) * 104729);
	r();
	return r() < 0.25 ? 0.15 : 1;
};
