// Episode 30 world: "What They Tell You" (Season 3 finale, a real place: Poveglia, the Venetian
// Lagoon). Composites, not a survey of the island (closed to visitors):
// - THE ISLAND (origin): a low island in the lagoon: the brick bell tower (campanile) with its belfry
//   and bell, the long hospital block with rows of windows and shutters, trees, an overgrown field,
//   the embankment and the wooden posts (bricole) in the water;
// - THE CORRIDOR (x 500): inside the hospital today: a long corridor with fallen ceiling, ivy and
//   rubble, window bays on the lagoon side, and the window at the end;
// - the boat (a small wooden launch), the birds, and a figure standing in the boat.
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
const seg = (v: number) => Math.min(48, Math.max(1, Math.ceil(v / 0.6)));
export const Box: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={[s[0], s[1], s[2], seg(s[0]), seg(s[1]), seg(s[2])]} />
	</mesh>
);
const Floor: React.FC<{p: V3; w: number; d: number; m: THREE.Material}> = ({p, w, d, m}) => (
	<mesh rotation={[-Math.PI / 2, 0, 0]} position={p} material={m}>
		<planeGeometry args={[w, d, seg(w), seg(d)]} />
	</mesh>
);

export const COR: V3 = [500, 0, 0];
export const TOWER: V3 = [-12, 0, -6];
export const BELL_Y = 25;
export const HOSP: V3 = [12, 0, -8];
export const FIELD: V3 = [-8, 0, 22];

/** Materials: the same world in two looks: 'film' (a warm, faded old travel film at dusk) and 'now'
 * (grey, overcast, today). Only the sky and water change; the grade does the rest. */
const useMats = (look: 'film' | 'now') =>
	useMemo(() => {
		const brick = tex(16, 16, (g) => {
			g.fillStyle = '#8a4a34';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#6a3424';
			for (let y = 0; y < 16; y += 4) {
				g.fillRect(0, y, 16, 1);
				for (let x = (y / 4) % 2 ? 0 : 4; x < 16; x += 8) g.fillRect(x, y, 1, 4);
			}
			const r = rng(3);
			for (let i = 0; i < 10; i++) {
				g.fillStyle = '#a06048';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 2, 1);
			}
		}, [4, 12]);
		const plaster = tex(16, 16, (g) => {
			g.fillStyle = '#b8a888';
			g.fillRect(0, 0, 16, 16);
			const r = rng(5);
			for (let i = 0; i < 24; i++) {
				g.fillStyle = r() < 0.5 ? '#8a7a60' : '#c8b898';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1 + Math.floor(r() * 4), 1 + Math.floor(r() * 2));
			}
		}, [10, 3]);
		const rubble = tex(16, 16, (g) => {
			g.fillStyle = '#5a564c';
			g.fillRect(0, 0, 16, 16);
			const r = rng(7);
			for (let i = 0; i < 40; i++) {
				g.fillStyle = r() < 0.5 ? '#3a3830' : '#7a7468';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 2, 2);
			}
		}, [4, 16]);
		const water = tex(16, 16, (g) => {
			g.fillStyle = look === 'film' ? '#3a4e5a' : '#3a4448';
			g.fillRect(0, 0, 16, 16);
			const r = rng(9);
			for (let i = 0; i < 20; i++) {
				g.fillStyle = look === 'film' ? '#c89a6a' : '#5a6468';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 3, 1);
			}
		}, [60, 60]);
		return {
			brick: lam('#ffffff', {map: brick}),
			plaster: lam('#ffffff', {map: plaster}),
			plasterD: lam('#ffffff', {map: plaster, side: THREE.DoubleSide}),
			rubble: lam('#ffffff', {map: rubble}),
			water: lam('#ffffff', {map: water}),
			stone: lam('#8a8270'),
			roof: lam('#5a3a2c'),
			dark: bas('#050505'),
			winD: bas('#0e0c0a'),
			shutter: lam('#3a4a38'),
			grass: lam('#5a6a3a'),
			blade: lam('#9aa458'),
			tree: lam('#3a4a2a'),
			trunk: lam('#3a2c20'),
			ivy: lam('#2a3a22'),
			post: lam('#3a2a1c'),
			boat: lam('#6a4a2c'),
			boatD: lam('#3a2a1c'),
			bell: lam('#6a5a30'),
			bird: bas('#141414'),
			coat: lam('#141416'),
			pale: lam('#b8b4aa'),
			sky: new THREE.MeshBasicMaterial({color: look === 'film' ? '#c88a5a' : '#8a9096', side: THREE.BackSide, fog: false}),
			sun: bas(look === 'film' ? '#ffd8a0' : '#a8acb0', {fog: false}),
		};
	}, [look]);
export type Mats = ReturnType<typeof useMats>;
const Ctx = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(Ctx)!;
export const MatsProvider: React.FC<{look: 'film' | 'now'; children: React.ReactNode}> = ({look, children}) => <Ctx.Provider value={useMats(look)}>{children}</Ctx.Provider>;

/** The campanile: brick shaft, belfry arches, the bell (swing: radians), a pointed cap. */
export const Campanile: React.FC<{swing: number}> = ({swing}) => {
	const m = useM();
	return (
		<group position={TOWER}>
			<Box p={[0, 11.5, 0]} s={[4.4, 23, 4.4]} m={m.brick} />
			{/* the belfry: four corner piers and a band, so the bell shows through the arches */}
			{[-1, 1].map((sx) => [-1, 1].map((sz) => <Box key={`${sx}${sz}`} p={[sx * 1.9, 25, sz * 1.9]} s={[0.6, 4, 0.6]} m={m.brick} />))}
			<Box p={[0, 23.2, 0]} s={[4.6, 0.4, 4.6]} m={m.stone} />
			<Box p={[0, 27.2, 0]} s={[4.6, 0.5, 4.6]} m={m.stone} />
			<mesh position={[0, 29.6, 0]} rotation={[0, Math.PI / 4, 0]} material={m.roof}>
				<coneGeometry args={[3.2, 4.4, 4]} />
			</mesh>
			<group position={[0, 26.6, 0]} rotation={[swing, 0, 0]}>
				<Box p={[0, 0.1, 0]} s={[0.12, 0.4, 0.12]} m={m.post} />
				<mesh position={[0, -0.8, 0]} material={m.bell}>
					<cylinderGeometry args={[0.45, 0.85, 1.3, 10, 1, true]} />
				</mesh>
				<mesh position={[0, -0.1, 0]} material={m.bell}>
					<sphereGeometry args={[0.45, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
				</mesh>
			</group>
		</group>
	);
};

/** The hospital block: three storeys of windows; one shutter (shutter: radians open) swings. */
export const Hospital: React.FC<{shutter: number}> = ({shutter}) => {
	const m = useM();
	return (
		<group position={HOSP}>
			<Box p={[0, 6, 0]} s={[40, 12, 10]} m={m.plaster} />
			<Box p={[0, 12.6, 0]} s={[41, 1.2, 11]} m={m.roof} />
			{[0, 1, 2].map((f) =>
				Array.from({length: 12}, (_, i) => (
					<Box key={`${f}-${i}`} p={[-17.6 + i * 3.2, 2.2 + f * 3.6, 5.03]} s={[1.3, 2.0, 0.1]} m={m.winD} />
				)),
			)}
			{/* shutters, some hanging; one swings in the wind */}
			{[[2, 3], [1, 7], [0, 10]].map(([f, i]) => (
				<Box key={`s${f}${i}`} p={[-17.6 + i * 3.2 - 0.95, 2.2 + f * 3.6, 5.1]} s={[0.6, 2.0, 0.06]} m={m.shutter} r={[0, 0.4, 0.1]} />
			))}
			<group position={[-17.6 + 5 * 3.2 + 0.65, 2.2 + 3.6, 5.1]} rotation={[0, -shutter, 0]}>
				<Box p={[0.32, 0, 0]} s={[0.64, 2.0, 0.06]} m={m.shutter} />
			</group>
		</group>
	);
};

/** The island: ground, embankment, trees, posts in the water; and the lagoon around it. */
export const Island: React.FC<{shutter: number; swing: number; part?: V3 | null}> = ({shutter, swing, part = null}) => {
	const m = useM();
	const trees = useMemo(() => {
		const r = rng(31);
		return Array.from({length: 40}, () => {
			const a = r() * Math.PI * 2, d = 8 + r() * 42;
			return {x: Math.cos(a) * d, z: Math.sin(a) * d * 0.8, h: 6 + r() * 6, s: 2 + r() * 2.5};
		}).filter((t) => Math.hypot(t.x - TOWER[0], t.z - TOWER[2]) > 5 && !(Math.abs(t.x - HOSP[0]) < 22 && Math.abs(t.z - HOSP[2]) < 7) && Math.hypot(t.x - FIELD[0], t.z - FIELD[2]) > 9 && !(t.x > -4 && t.x < 22 && t.z > -4 && t.z < 24));
	}, []);
	const posts = useMemo(() => {
		const r = rng(37);
		return Array.from({length: 18}, (_, i) => ({x: -40 + i * 5 + r() * 2, z: 62 + r() * 6}));
	}, []);
	const blades = useMemo(() => {
		const r = rng(41);
		return Array.from({length: 420}, () => ({x: (r() - 0.5) * 14, z: (r() - 0.5) * 14, h: 0.8 + r() * 0.6, a: r() * Math.PI}));
	}, []);
	return (
		<group>
			<mesh material={m.sky}>
				<sphereGeometry args={[900, 12, 8]} />
			</mesh>
			<mesh position={[-160, 30, -500]} material={m.sun}>
				<circleGeometry args={[18, 16]} />
			</mesh>
			<Floor p={[0, -0.4, 0]} w={1600} d={1600} m={m.water} />
			<mesh position={[0, 0.2, 0]} scale={[1, 0.02, 0.85]} material={m.grass}>
				<sphereGeometry args={[60, 24, 8]} />
			</mesh>
			<mesh position={[0, -0.1, 0]} scale={[1, 0.04, 0.85]} material={m.stone}>
				<cylinderGeometry args={[61, 61, 12, 32, 1, true]} />
			</mesh>
			{trees.map((t, i) => (
				<group key={i} position={[t.x, 0.6, t.z]}>
					<Box p={[0, t.h * 0.3, 0]} s={[0.4, t.h * 0.6, 0.4]} m={m.trunk} />
					<mesh position={[0, t.h * 0.8, 0]} material={m.tree}>
						<icosahedronGeometry args={[t.s, 0]} />
					</mesh>
				</group>
			))}
			{posts.map((p, i) => (
				<Box key={`p${i}`} p={[p.x, 0.6, p.z]} s={[0.3, 2.4, 0.3]} m={m.post} />
			))}
			<Campanile swing={swing} />
			<Hospital shutter={shutter} />
			{/* the overgrown field: tall grass that bends away from something moving through it */}
			<group position={[FIELD[0], 0.6, FIELD[2]]}>
				{blades.map((b, i) => {
					let lean = 0, dir = 0;
					if (part) {
						const dx = FIELD[0] + b.x - part[0], dz = FIELD[2] + b.z - part[2];
						const d = Math.hypot(dx, dz);
						if (d < 1.6) {
							lean = (1 - d / 1.6) * 1.25;
							dir = Math.atan2(dx, dz);
						}
					}
					return (
						<group key={i} position={[b.x, 0, b.z]} rotation={[0, dir, 0]}>
							<mesh position={[0, b.h / 2, 0]} rotation={[lean, b.a, 0.05 * Math.sin(i)]} material={m.blade}>
								<boxGeometry args={[0.05, b.h, 0.02]} />
							</mesh>
						</group>
					);
				})}
			</group>
		</group>
	);
};

/** The boat: a small wooden launch (bow at -z). withFigure: someone standing in the stern. */
export const Boat: React.FC<{p: V3; ry: number; withFigure?: boolean}> = ({p, ry, withFigure = false}) => {
	const m = useM();
	return (
		<group position={p} rotation={[0, ry, 0]}>
			<Box p={[0, 0.2, 0]} s={[1.6, 0.5, 5.0]} m={m.boat} />
			<mesh position={[0, 0.2, -2.9]} rotation={[0, Math.PI / 4, 0]} material={m.boat}>
				<boxGeometry args={[1.13, 0.5, 1.13]} />
			</mesh>
			<Box p={[0, 0.48, 0.3]} s={[1.4, 0.06, 3.6]} m={m.boatD} />
			<Box p={[0, 0.6, 2.2]} s={[1.2, 0.3, 0.4]} m={m.boatD} />
			{withFigure && (
				<group position={[0, 0.5, 2.0]} rotation={[0, Math.PI, 0]}>
					<mesh position={[0, 0.75, 0]} material={m.coat}>
						<cylinderGeometry args={[0.18, 0.3, 1.5, 8]} />
					</mesh>
					<mesh position={[0, 1.62, 0]} material={m.pale}>
						<icosahedronGeometry args={[0.11, 1]} />
					</mesh>
				</group>
			)}
		</group>
	);
};

/** The birds lifting off the tower: k 0 sitting .. 1 gone. */
export const Birds: React.FC<{k: number}> = ({k}) => {
	const m = useM();
	const b = useMemo(() => {
		const r = rng(43);
		return Array.from({length: 14}, () => ({a: r() * Math.PI * 2, s: 4 + r() * 8, u: 3 + r() * 6}));
	}, []);
	return (
		<group position={[TOWER[0], 30, TOWER[2]]}>
			{b.map((x, i) => (
				<mesh key={i} position={[Math.cos(x.a) * x.s * k, x.u * k + Math.sin(k * 30 + i) * 0.2, Math.sin(x.a) * x.s * k]} rotation={[0, x.a, Math.sin(k * 40 + i) * 0.6]} material={m.bird}>
					<coneGeometry args={[0.4, 0.2, 3]} />
				</mesh>
			))}
		</group>
	);
};

/** The corridor inside the hospital, today: fallen ceiling, ivy, rubble; window bays on +x; the end window. */
export const Corridor: React.FC = () => {
	const m = useM();
	const len = 24;
	return (
		<group position={COR}>
			<Floor p={[0, 0, -len / 2]} w={3} d={len} m={m.rubble} />
			<Box p={[-1.55, 1.7, -len / 2]} s={[0.1, 3.4, len]} m={m.plaster} />
			{/* the window side: piers between open bays */}
			{Array.from({length: 7}, (_, i) => (
				<Box key={i} p={[1.55, 1.7, -2 - i * 3.4]} s={[0.1, 3.4, 1.6]} m={m.plaster} />
			))}
			<Box p={[1.55, 0.45, -len / 2]} s={[0.1, 0.9, len]} m={m.plaster} />
			<Box p={[1.55, 3.1, -len / 2]} s={[0.1, 0.6, len]} m={m.plaster} />
			{/* the ceiling, with holes where it has fallen */}
			{Array.from({length: 6}, (_, i) => (
				<Box key={`c${i}`} p={[0, 3.45, -1.5 - i * 4]} s={[3.1, 0.1, i % 2 ? 1.5 : 3.2]} m={m.plasterD} />
			))}
			{Array.from({length: 10}, (_, i) => (
				<Box key={`r${i}`} p={[((i * 37) % 10) / 10 * 2 - 1, 0.15, -2 - i * 2.1]} s={[0.6, 0.3, 0.5]} m={m.rubble} r={[0, i, 0.2]} />
			))}
			{Array.from({length: 8}, (_, i) => (
				<Box key={`v${i}`} p={[-1.48, 2.4 - (i % 3) * 0.5, -3 - i * 2.7]} s={[0.04, 1.4, 0.8]} m={m.ivy} />
			))}
			{/* the end wall with its window, looking out over the lagoon */}
			<Box p={[-0.95, 1.7, -len]} s={[1.1, 3.4, 0.2]} m={m.plaster} />
			<Box p={[0.95, 1.7, -len]} s={[1.1, 3.4, 0.2]} m={m.plaster} />
			<Box p={[0, 0.5, -len]} s={[0.8, 1.0, 0.2]} m={m.plaster} />
			<Box p={[0, 3.0, -len]} s={[0.8, 0.8, 0.2]} m={m.plaster} />
		</group>
	);
};
