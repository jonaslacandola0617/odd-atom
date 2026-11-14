// Episode 32 world: "Tatlong Katok" (Season 4, folklore: the kumakatok). A composite Tagalog
// barangay at midnight, no real place:
// - THE STREET (origin): a concrete street along z, houses on both sides facing it (hollow-block
//   walls, yero roofs, wooden doors, a window each that can light and then turn to candlelight),
//   electric poles and one sodium streetlight, a moon; white chalk crosses on some doors;
// - OUR HOUSE (right side, z 0): its front wall with our jalousie window (slats that close) and door;
// - THE HALL (x 200): inside our house, a narrow hall to Lola's door with light under it;
// - THE THREE: hooded, robed figures (one smaller), faces only darkness; a pale hand that knocks.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1, rng} from '../ps1';
import {SNAP6} from '../ep01/world';

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
const seg = (v: number) => Math.min(40, Math.max(1, Math.ceil(v / 0.4)));
export const Box: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={[s[0], s[1], s[2], seg(s[0]), seg(s[1]), seg(s[2])]} />
	</mesh>
);

const noise = (base: string, dots: string[], seed: number, rep: [number, number], n = 40) =>
	tex(16, 16, (g) => {
		g.fillStyle = base;
		g.fillRect(0, 0, 16, 16);
		const r = rng(seed);
		for (let i = 0; i < n; i++) {
			g.fillStyle = dots[Math.floor(r() * dots.length)];
			g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1 + Math.floor(r() * 3), 1 + Math.floor(r() * 2));
		}
	}, rep);

export const useMats = () =>
	useMemo(() => {
		const block = tex(16, 16, (g) => {
			g.fillStyle = '#8a8a80';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#6e6e66';
			for (let y = 0; y < 16; y += 4) {
				g.fillRect(0, y, 16, 1);
				for (let x = (y / 4) % 2 ? 0 : 4; x < 16; x += 8) g.fillRect(x, y, 1, 4);
			}
			const r = rng(9);
			for (let i = 0; i < 14; i++) {
				g.fillStyle = r() < 0.5 ? '#7a7a70' : '#5e6a5a';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 2, 1);
			}
		}, [3, 2]);
		const yero = tex(16, 16, (g) => {
			g.fillStyle = '#6a5a4a';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#4a3e34';
			for (let x = 0; x < 16; x += 3) g.fillRect(x, 0, 1, 16);
			g.fillStyle = '#8a4a2a';
			const r = rng(11);
			for (let i = 0; i < 10; i++) g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 2, 2);
		}, [4, 2]);
		const road = noise('#4a4a48', ['#3e3e3c', '#565654', '#424240'], 13, [6, 30], 50);
		const plank = tex(16, 16, (g) => {
			g.fillStyle = '#5a3c26';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#44301e';
			for (let x = 0; x < 16; x += 4) g.fillRect(x, 0, 1, 16);
		}, [1, 1]);
		return {
			block: lam('#ffffff', {map: block}),
			yero: lam('#ffffff', {map: yero}),
			road: lam('#ffffff', {map: road}),
			door: lam('#ffffff', {map: plank}),
			frame: lam('#3a2a1c'),
			grass: lam('#1e2a1c'),
			pole: lam('#3a3a36'),
			wire: lam('#141414'),
			lamp: bas('#ffb860'),
			moon: bas('#d8dce8'),
			sky: bas('#0b1020', {side: THREE.BackSide}),
			win: bas('#ffd890'),
			winDark: bas('#0a0c10'),
			candle: bas('#ff9a40'),
			chalk: bas('#b8b8b0'),
			robe: lam('#4a4640'),
			robeDark: lam('#2a2826'),
			void: bas('#000000'),
			hand: lam('#b8a890'),
			slat: lam('#9aa0a0', {side: THREE.DoubleSide}),
			wood: lam('#4a3220'),
			wall: lam('#7a7262'),
			floor: lam('#3a3024'),
			stripLit: bas('#ffcc80'),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
export const MatsContext = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(MatsContext)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <MatsContext.Provider value={useMats()}>{children}</MatsContext.Provider>;

// ------------------------------------------------------------------ geography
export const STREET_X = 3.0; // house fronts at x = ±3
export const HALL: V3 = [200, 0, 0];
export type HouseId = string; // 'L0', 'R-6', ...
export const HOUSES: {id: HouseId; side: -1 | 1; z: number; cross: boolean}[] = [];
for (const side of [-1, 1] as const)
	for (const z of [18, 12, 6, 0, -6, -12, -18, -24]) HOUSES.push({id: `${side < 0 ? 'L' : 'R'}${z}`, side, z, cross: false});
// doors already crossed before tonight
for (const id of ['R-12', 'R6', 'R12', 'L6', 'R-24', 'L-18']) HOUSES.find((h) => h.id === id)!.cross = true;
export const OURS = 'R0';
export const doorPos = (id: HouseId): V3 => {
	const h = HOUSES.find((x) => x.id === id)!;
	// the door sits at local z -0.6; the right-hand houses are turned round, so it lands at z + 0.6
	return [h.side * STREET_X, 0, h.z - 0.6 * (h.side < 0 ? 1 : -1)];
};

/** A chalk cross drawn on a door: k 0..1 draws the vertical stroke, then the horizontal. */
export const ChalkCross: React.FC<{k: number}> = ({k}) => {
	const M = useM();
	const v = Math.min(1, k * 2), h = Math.max(0, k * 2 - 1);
	return (
		<group>
			{v > 0 && <Box p={[0, 1.3 + 0.35 * (1 - v), 0]} s={[0.06, 0.7 * v, 0.01]} m={M.chalk} />}
			{h > 0 && <Box p={[-0.22 + 0.22 * h, 1.45, 0]} s={[0.44 * h, 0.06, 0.01]} m={M.chalk} />}
		</group>
	);
};

/** One house facing the street. light 0..1: the window lit; candle 0..1: it has turned to candlelight. */
export const House: React.FC<{side: -1 | 1; z: number; light: number; candle: number; cross: number; t: number; seed: number; isOurs?: boolean; slats?: number}> = ({side, z, light, candle, cross, t, seed, isOurs, slats = 0.6}) => {
	const M = useM();
	const r = rng(seed);
	const w = 5.2, d = 5, h = 2.8;
	const tint = useMemo(() => {
		const c = ['#8a8a80', '#9a8a70', '#7a8a84', '#8a7a7a'][Math.floor(r() * 4)];
		return lam(c, {map: (M.block as THREE.MeshLambertMaterial).map!});
	}, [seed, M.block]);
	const fl = 0.75 + 0.25 * Math.sin(t * 11 + seed) * Math.sin(t * 7.3 + seed * 2);
	const winM = useMemo(() => new THREE.MeshBasicMaterial({color: '#ffd890'}), []);
	const lit = light * (1 - candle) + candle * 0.55 * fl;
	winM.color.set(candle > 0.5 ? '#ff9a40' : '#ffd890').multiplyScalar(Math.max(0.03, lit));
	// local frame: +x points at the street
	return (
		<group position={[side * (STREET_X + w / 2), 0, z]} rotation={[0, side < 0 ? 0 : Math.PI, 0]}>
			<Box p={[0, h / 2, 0]} s={[w, h, d]} m={tint} />
			{/* the yero roof, a low ridge */}
			<mesh position={[0, h + 0.45, 0]} rotation={[0, 0, 0]} material={M.yero}>
				<cylinderGeometry args={[0.01, 3.2, 0.9, 4, 1]} />
			</mesh>
			{/* door, at the street face */}
			<group position={[w / 2 + 0.01, 0, -0.6]} rotation={[0, Math.PI / 2, 0]}>
				<Box p={[0, 1.05, 0]} s={[0.9, 2.1, 0.06]} m={M.door} />
				<Box p={[0, 2.15, 0]} s={[1.05, 0.1, 0.08]} m={M.frame} />
				<group position={[0, 0, 0.04]}>
					<ChalkCross k={cross} />
				</group>
			</group>
			{/* window, with jalousie slats */}
			<group position={[w / 2 + 0.01, 0, 1.2]} rotation={[0, Math.PI / 2, 0]}>
				<mesh position={[0, 1.55, 0]} material={isOurs ? M.winDark : winM}>
					<planeGeometry args={[1.2, 0.9]} />
				</mesh>
				{Array.from({length: 6}, (_, i) => (
					<mesh key={i} position={[0, 1.18 + i * 0.15, 0.03]} rotation={[-(isOurs ? slats : 0.7), 0, 0]} material={M.slat}>
						<planeGeometry args={[1.2, 0.13]} />
					</mesh>
				))}
				{!isOurs && light > 0.05 && <pointLight position={[0, 1.5, 1.2]} intensity={2.5 * lit} distance={5} decay={1} color={candle > 0.5 ? '#ff9a40' : '#ffd890'} />}
			</group>
		</group>
	);
};

export const Street: React.FC<{t: number; state: (id: HouseId) => {light: number; candle: number; cross: number}; slats?: number}> = ({t, state, slats}) => {
	const M = useM();
	return (
		<group>
			<mesh position={[0, 0, -3]} material={M.sky}>
				<sphereGeometry args={[300, 10, 8]} />
			</mesh>
			<mesh position={[-60, 70, -160]} material={M.moon}>
				<sphereGeometry args={[7, 10, 8]} />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -3]} material={M.road}>
				<planeGeometry args={[6, 60, 12, 80]} />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -3]} material={M.grass}>
				<planeGeometry args={[80, 80, 20, 20]} />
			</mesh>
			{HOUSES.map((h, i) => {
				const s = state(h.id);
				return <House key={h.id} side={h.side} z={h.z} light={s.light} candle={s.candle} cross={s.cross} t={t} seed={i * 7 + 3} isOurs={h.id === OURS} slats={slats} />;
			})}
			{/* poles and the one streetlight */}
			{[15, 3, -9, -21].map((z) => (
				<group key={z} position={[-2.6, 0, z]}>
					<Box p={[0, 3.5, 0]} s={[0.18, 7, 0.18]} m={M.pole} />
					<Box p={[0, 6.6, 0]} s={[0.1, 0.1, 1.4]} m={M.pole} />
				</group>
			))}
			{/* porch bulbs over a few doors (the doors they knock on are lit) */}
			{['L0', 'L-6', 'R0', 'R-18', 'R-6'].map((id) => {
				const d = doorPos(id);
				const side = d[0] < 0 ? -1 : 1;
				return (
					<group key={id} position={[d[0] - side * 0.35, 2.35, d[2] + (side < 0 ? -0.65 : 0.65)]}>
						<mesh material={M.lamp}>
							<sphereGeometry args={[0.06, 5, 4]} />
						</mesh>
						<pointLight position={[-side * 0.3, -0.2, 0]} intensity={3.2} distance={6} decay={1} color="#ffc070" />
					</group>
				);
			})}
			<group position={[-2.6, 0, -9]}>
				<Box p={[0.7, 5.2, 0]} s={[1.4, 0.08, 0.08]} m={M.pole} />
				<mesh position={[1.35, 5.1, 0]} material={M.lamp}>
					<sphereGeometry args={[0.14, 6, 4]} />
				</mesh>
				<pointLight position={[1.35, 4.9, 0]} intensity={9} distance={16} decay={1} color="#ffaa50" />
			</group>
		</group>
	);
};

// ------------------------------------------------------------------ the three
export const Robed: React.FC<{p: V3; ry: number; t: number; walk: number; scale?: number; knock?: number; hoodTurn?: number; seed?: number}> = ({p, ry, t, walk, scale = 1, knock = 0, hoodTurn = 0, seed = 0}) => {
	const M = useM();
	const bob = walk * 0.025 * Math.abs(Math.sin(t * 3.2 + seed));
	const sway = walk * 0.05 * Math.sin(t * 3.2 + seed);
	return (
		<group position={[p[0], p[1] + bob, p[2]]} rotation={[0, ry, 0]} scale={scale}>
			{/* the robe: long, to the ground, the hem swaying */}
			<mesh position={[0, 0.82, 0]} rotation={[sway * 0.3, 0, sway * 0.2]} material={M.robe}>
				<cylinderGeometry args={[0.2, 0.42, 1.64, 9, 4]} />
			</mesh>
			<mesh position={[0, 1.62, 0]} material={M.robe}>
				<cylinderGeometry args={[0.24, 0.22, 0.12, 9, 1]} />
			</mesh>
			{/* the hood, and darkness where the face should be */}
			<group position={[0, 1.86, 0]} rotation={[0, 0, hoodTurn]}>
				<mesh scale={[1, 1.15, 1.05]} material={M.robeDark}>
					<sphereGeometry args={[0.2, 9, 7]} />
				</mesh>
				<mesh position={[0.15, -0.02, 0]} rotation={[0, Math.PI / 2, 0]} material={M.void}>
					<circleGeometry args={[0.13, 10]} />
				</mesh>
				{/* when it looks at you: two faint points of light in the dark */}
				{hoodTurn > 0.3 &&
					[-0.045, 0.045].map((z) => (
						<mesh key={z} position={[0.16, 0.0, z]} material={M.chalk}>
							<boxGeometry args={[0.012, 0.012, 0.018]} />
						</mesh>
					))}
				<mesh position={[0.05, 0.16, 0]} rotation={[0, 0, -0.5]} material={M.robeDark}>
					<coneGeometry args={[0.12, 0.22, 7]} />
				</mesh>
			</group>
			{/* the knocking arm: a sleeve and a pale old hand */}
			<group position={[0.05, 1.45, 0.2]} rotation={[0, 0, -1.2 * knock]}>
				<mesh position={[0.0, -0.3, 0]} material={M.robe}>
					<cylinderGeometry args={[0.07, 0.09, 0.6, 7, 2]} />
				</mesh>
				<mesh position={[0.0, -0.64, 0]} material={M.hand}>
					<boxGeometry args={[0.07, 0.1, 0.08]} />
				</mesh>
			</group>
		</group>
	);
};

// ------------------------------------------------------------------ inside: the hall to Lola's door
export const Hall: React.FC<{under: number; bulge: number; cross?: boolean}> = ({under, bulge, cross = true}) => {
	const M = useM();
	const stripM = useMemo(() => new THREE.MeshBasicMaterial({color: '#ffcc80'}), []);
	stripM.color.set('#ffcc80').multiplyScalar(Math.max(0, under));
	return (
		<group position={HALL}>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -3]} material={M.floor}>
				<planeGeometry args={[1.6, 8, 4, 20]} />
			</mesh>
			<Box p={[-0.8, 1.4, -3]} s={[0.08, 2.8, 8]} m={M.wall} />
			<Box p={[0.8, 1.4, -3]} s={[0.08, 2.8, 8]} m={M.wall} />
			<Box p={[0, 2.8, -3]} s={[1.6, 0.08, 8]} m={M.wall} />
			<Box p={[0, 1.4, -6.95]} s={[1.6, 2.8, 0.08]} m={M.wall} />
			{/* a calendar and a small altar shelf with a dark Santo Niño shape (a hidden detail: its candle is out) */}
			<Box p={[0.75, 1.5, -2.2]} s={[0.02, 0.5, 0.36]} m={M.slat} />
			<Box p={[-0.72, 1.2, -3.4]} s={[0.12, 0.04, 0.4]} m={M.wood} />
			{/* Lola's door, pushed outward by the knocks from inside */}
			<group position={[0, 0, -6.88 + 0.04 * bulge]}>
				<Box p={[0, 1.05, 0]} s={[0.85, 2.05, 0.05]} m={M.door} />
				<Box p={[0, 2.12, 0]} s={[1.0, 0.08, 0.07]} m={M.frame} />
				{cross && (
					<group position={[0, 0, 0.035]}>
						<ChalkCross k={1} />
					</group>
				)}
			</group>
			<mesh position={[0, 0.012, -6.84]} rotation={[-Math.PI / 2, 0, 0]} material={stripM}>
				<planeGeometry args={[0.8, 0.06]} />
			</mesh>
			{under > 0.05 && <pointLight position={[0, 0.05, -6.6]} intensity={1.2 * under} distance={2.5} decay={1} color="#ffcc80" />}
		</group>
	);
};
