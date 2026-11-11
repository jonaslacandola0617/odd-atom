// Episode 12 world: "Tik-Tik" (original, built on the Philippine tiktik belief).
// One consistent set: a wooden barrio house on stilts, its one room inside and out, and the barrio
// street on a fiesta night.
//
// Layout (metres, y up). The room is x -2..2, z -1.75..1.75, floor y = 0 (the house stands on
// stilts; the ground outside is y = -0.9). Walls are sawali (woven bamboo) to y = 2.3; the yero
// (corrugated iron) roof is a gable along x (ridge y = 3.3 at z = 0, eaves y = 2.55 at z = +-2.0),
// so between the top of the back wall and the roof there is an open GAP (y 2.3..2.64): that is
// where it looks in. One bulb hangs from the ridge. The jalousie window is in the left wall
// (x = -2); garlic hangs on it and a line of salt runs along its sill (with a gap). The child
// sleeps on a banig; Lola sits on a stool by the window; a small altar on the front wall.
// Outside: the street runs along x at z = 6.5 in front of the door; neighbours left and right;
// banderitas across the street; a sari-sari store opposite; a videoke tent far down the street.
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

export const GROUND = -0.9;
export const GAP_Y = 2.47; // the middle of the gap under the roof at the back wall
export const BACK_Z = -1.75;
export const WINDOW: [number, number, number] = [-2, 1.35, 0.1];
export const CHILD: [number, number, number] = [0.7, 0, -0.8];
export const LOLA: [number, number, number] = [-1.3, 0, 0.35];
export const STREET_Z = 6.5;
export const VIDEOKE: [number, number, number] = [-24, GROUND, 9.5];
export const STORE: [number, number, number] = [7, GROUND, 9.8];

const useMats = () =>
	useMemo(() => {
		const sawali = tex(16, 16, (g) => {
			g.fillStyle = '#8a7650';
			g.fillRect(0, 0, 16, 16);
			for (let y = 0; y < 16; y += 2)
				for (let x = 0; x < 16; x += 4) {
					g.fillStyle = (x / 4 + y / 2) % 2 ? '#6e5c3c' : '#a08a5e';
					g.fillRect((x + (y % 4 ? 2 : 0)) % 16, y, 3, 2);
				}
		}, [4, 4]);
		const yero = tex(8, 8, (g) => {
			for (let x = 0; x < 8; x++) {
				g.fillStyle = x % 2 ? '#5a4a3e' : '#7a6656';
				g.fillRect(x, 0, 1, 8);
			}
			g.fillStyle = 'rgba(120,60,30,0.6)';
			g.fillRect(2, 3, 3, 2);
		}, [10, 3]);
		const banig = tex(16, 16, (g) => {
			const cols = ['#a83a3a', '#d8b05a', '#3a6a5a', '#d8c8a0'];
			for (let y = 0; y < 16; y++)
				for (let x = 0; x < 16; x++) {
					g.fillStyle = cols[(Math.floor(x / 4) + Math.floor(y / 4) + ((x + y) % 2)) % cols.length];
					g.fillRect(x, y, 1, 1);
				}
		}, [2, 3]);
		const plank = tex(8, 16, (g) => {
			for (let x = 0; x < 8; x += 2) {
				g.fillStyle = x % 4 ? '#5a3e28' : '#6a4a30';
				g.fillRect(x, 0, 2, 16);
				g.fillStyle = '#2a1c12';
				g.fillRect(x, 0, 1, 16);
			}
		}, [4, 3]);
		return {
			sawali: lam('#ffffff', {map: sawali}),
			yero: lam('#7a7a7a', {map: yero, side: THREE.DoubleSide}),
			floor: lam('#ffffff', {map: plank}),
			banig: lam('#ffffff', {map: banig}),
			wood: lam('#4a3222'),
			darkWood: lam('#2a1c12'),
			kumot: lam('#5a6a8a'),
			pillow: lam('#c8c0b0'),
			childHair: lam('#141010'),
			skin: lam('#8a6448'),
			duster: lam('#6a4a6a'),
			grey: lam('#a8a8a4'),
			glass: bas('#6a8aa0', {transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false}),
			garlic: lam('#e8e0cc'),
			salt: bas('#f0f0ec'),
			bulb: bas('#ffe0a0'),
			bulbOff: lam('#6a6050'),
			cord: lam('#151515'),
			candle: bas('#ffb050'),
			santo: lam('#8a1e1e'),
			gold: lam('#c8a850'),
			ground: lam('#3a3024'),
			street: lam('#4a4036'),
			leaf: lam('#2a4a2a'),
			trunk: lam('#5a4a38'),
			flagR: bas('#c83a3a'),
			flagY: bas('#e8c040'),
			flagB: bas('#3a6ac8'),
			flagG: bas('#3a9a5a'),
			screen: bas('#5aa0ff'),
			screenOff: bas('#08080c'),
			tarp: lam('#3a5a8a'),
			sign: bas('#e8d8a0'),
			signText: bas('#a82a2a'),
			grille: lam('#2a2a2a'),
			storeLight: bas('#fff0c0'),
			black: bas('#000000'),
			moon: bas('#e8ecf0', {fog: false}),
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

/** A gable roof of yero over a house of half-width w (x) and half-depth d (z). */
const Roof: React.FC<{w: number; d: number; eave: number; ridge: number}> = ({w, d, eave, ridge}) => {
	const m = useM();
	const slope = Math.atan2(ridge - eave, d + 0.25);
	const len = Math.hypot(ridge - eave, d + 0.25);
	return (
		<group>
			{[-1, 1].map((sd) => (
				<mesh key={sd} position={[0, (eave + ridge) / 2, (sd * (d + 0.25)) / 2]} rotation={[sd * slope, 0, 0]} material={m.yero}>
					<boxGeometry args={[w * 2 + 0.5, 0.03, len]} />
				</mesh>
			))}
		</group>
	);
};

/** The house: interior and exterior share the same walls. salt: 0..1 how much of the line is poured; scattered: dawn. */
export const House: React.FC<{salt: number; scattered: boolean; garlic: number; bulbOn: number; bulbSwing: number; lolaLook: number; candle: boolean}> = ({salt, scattered, garlic, bulbOn, bulbSwing, lolaLook, candle}) => {
	const m = useM();
	const saltBits = useMemo(() => {
		const r = rng(1212);
		return Array.from({length: 70}, (_, i) => { const k = i / 70; return {x: -1.85 + k * 2.4 + (r() - 0.5) * 0.4, z: 0.1 - k * 0.8 + (r() - 0.5) * 0.5, s: 0.02 + r() * 0.025}; });
	}, []);
	const H = 2.3;
	return (
		<group>
			{/* floor, stilts */}
			<Box p={[0, -0.03, 0]} s={[4, 0.06, 3.5]} m={m.floor} />
			{[-1.9, 0, 1.9].map((x) => [-1.65, 1.65].map((z) => <Box key={`${x}${z}`} p={[x, GROUND / 2 - 0.03, z]} s={[0.12, -GROUND, 0.12]} m={m.darkWood} />))}
			{/* walls (sawali); the left wall has the window opening */}
			<Box p={[0, H / 2, BACK_Z]} s={[4, H, 0.05]} m={m.sawali} />
			<Box p={[-1.2, H / 2, 1.75]} s={[1.6, H, 0.05]} m={m.sawali} />
			<Box p={[1.35, H / 2, 1.75]} s={[1.3, H, 0.05]} m={m.sawali} />
			<Box p={[0.25, 2.1, 1.75]} s={[0.9, 0.4, 0.05]} m={m.sawali} />
			<Box p={[0.25, 0.95, 1.77]} s={[0.86, 1.9, 0.04]} m={m.wood} />
			<Box p={[2, H / 2, 0]} s={[0.05, H, 3.5]} m={m.sawali} />
			<Box p={[-2, 0.5, 0]} s={[0.05, 1.0, 3.5]} m={m.sawali} />
			<Box p={[-2, 2.0, 0]} s={[0.05, 0.6, 3.5]} m={m.sawali} />
			<Box p={[-2, 1.35, -1.08]} s={[0.05, 0.7, 1.35]} m={m.sawali} />
			<Box p={[-2, 1.35, 1.25]} s={[0.05, 0.7, 1.0]} m={m.sawali} />
			{/* corner posts and the wall plate (the top of the wall, under the gap) */}
			{[-1.97, 1.97].map((x) => [-1.72, 1.72].map((z) => <Box key={`${x}${z}`} p={[x, H / 2, z]} s={[0.1, H, 0.1]} m={m.darkWood} />))}
			<Box p={[0, H, BACK_Z]} s={[4.1, 0.08, 0.1]} m={m.darkWood} />
			<Box p={[0, H, 1.75]} s={[4.1, 0.08, 0.1]} m={m.darkWood} />
			{/* gable ends closed with sawali; the long sides stay open under the eaves (the gap) */}
			{[-2.02, 2.02].map((x) => (
				<mesh key={x} position={[x, H, 0]} rotation={[0, Math.PI / 2, 0]} material={m.sawali}>
					<shapeGeometry args={[new THREE.Shape([new THREE.Vector2(-2.0, 0.25), new THREE.Vector2(2.0, 0.25), new THREE.Vector2(0, 1.0)])]} />
				</mesh>
			))}
			<Roof w={2.0} d={2.0} eave={2.55} ridge={3.3} />
			{/* rafters and the ridge beam */}
			{[-1.6, -0.8, 0, 0.8, 1.6].map((x) => [-1, 1].map((sd) => <Box key={`${x}${sd}`} p={[x, 2.9, sd * 1.0]} s={[0.06, 0.08, 2.15]} m={m.wood} r={[sd * -0.36, 0, 0]} />))}
			<Box p={[0, 3.24, 0]} s={[4.2, 0.1, 0.1]} m={m.wood} />
			{/* the bulb on its cord */}
			<group position={[0, 3.2, 0]} rotation={[bulbSwing * 0.5, 0, bulbSwing]}>
				<Box p={[0, -0.35, 0]} s={[0.01, 0.7, 0.01]} m={m.cord} />
				<mesh position={[0, -0.74, 0]} material={bulbOn > 0.5 ? m.bulb : m.bulbOff}>
					<sphereGeometry args={[0.045, 6, 5]} />
				</mesh>
			</group>
			{/* the jalousie window: frame, glass slats, the sill with its line of salt, garlic */}
			<Box p={[-2.0, 1.0, 0.1]} s={[0.14, 0.05, 1.0]} m={m.wood} />
			<Box p={[-2.0, 1.7, 0.1]} s={[0.1, 0.05, 1.0]} m={m.wood} />
			{Array.from({length: 7}, (_, i) => (
				<mesh key={i} position={[-2.0, 1.08 + i * 0.09, 0.1]} rotation={[0, 0, 0.6]} material={m.glass}>
					<boxGeometry args={[0.1, 0.012, 0.9]} />
				</mesh>
			))}
			{salt > 0 && !scattered && (
				<>
					{/* the line of salt along the sill, with a gap near the end (it was never whole) */}
					<Box p={[-1.95, 1.04, -0.35 + (0.9 * Math.min(salt, 0.62)) / 2]} s={[0.06, 0.02, 0.9 * Math.min(salt, 0.62)]} m={m.salt} />
					{salt > 0.7 && <Box p={[-1.95, 1.04, 0.33 + (0.2 * (salt - 0.7)) / 0.3]} s={[0.06, 0.02, (0.4 * (salt - 0.7)) / 0.3]} m={m.salt} />}
				</>
			)}
			{scattered && (
				<>
					{saltBits.map((b, i) => (
						<Box key={i} p={[b.x, 0.005, b.z]} s={[b.s, 0.006, b.s]} m={m.salt} />
					))}
					{[-0.3, -0.1, 0.12, 0.3, 0.45].map((z, i) => (
						<Box key={`s${i}`} p={[-1.93 + (i % 2) * 0.03, 1.035, z]} s={[0.03, 0.012, 0.03 + (i % 3) * 0.02]} m={m.salt} />
					))}
				</>
			)}
			{garlic > 0 &&
				Array.from({length: 5}, (_, i) => (
					<group key={i}>
						<Box p={[-1.92, 1.66 - i * 0.08 * garlic, -0.3]} s={[0.006, 0.08, 0.006]} m={m.cord} />
						{i < 4 && (
							<mesh position={[-1.9, 1.62 - i * 0.08 * garlic, -0.3 + (i % 2) * 0.03]} material={m.garlic}>
								<icosahedronGeometry args={[0.03, 0]} />
							</mesh>
						)}
					</group>
				))}
			{/* the child asleep on the banig under a kumot */}
			<mesh position={[CHILD[0], 0.006, CHILD[2]]} rotation={[-Math.PI / 2, 0, 0]} material={m.banig}>
				<planeGeometry args={[1.0, 1.8]} />
			</mesh>
			<mesh position={[CHILD[0], 0.1, CHILD[2] + 0.15]} scale={[0.42, 0.13, 0.7]} material={m.kumot}>
				<sphereGeometry args={[0.5, 8, 6]} />
			</mesh>
			<Box p={[CHILD[0], 0.05, CHILD[2] - 0.62]} s={[0.4, 0.1, 0.25]} m={m.pillow} />
			<mesh position={[CHILD[0], 0.15, CHILD[2] - 0.5]} material={m.childHair}>
				<sphereGeometry args={[0.09, 6, 5]} />
			</mesh>
			{/* Lola on her stool by the window, seen from behind: a duster, grey hair in a bun */}
			<group position={LOLA}>
				<Box p={[0, 0.22, 0]} s={[0.3, 0.44, 0.3]} m={m.darkWood} />
				<mesh position={[0, 0.72, 0]} scale={[1, 1, 0.75]} material={m.duster}>
					<cylinderGeometry args={[0.15, 0.22, 0.6, 8]} />
				</mesh>
				<group position={[0, 1.08, 0.02]} rotation={[-lolaLook * 0.7, 0, 0]}>
					<mesh material={m.skin}>
						<sphereGeometry args={[0.1, 7, 6]} />
					</mesh>
					<mesh position={[0, 0.03, -0.03]} scale={[1.05, 1, 1.05]} material={m.grey}>
						<sphereGeometry args={[0.1, 7, 6, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
					</mesh>
					<mesh position={[0, 0.06, -0.1]} material={m.grey}>
						<sphereGeometry args={[0.045, 6, 5]} />
					</mesh>
				</group>
				{[-1, 1].map((sd) => (
					<Box key={sd} p={[sd * 0.17, 0.8, 0.1]} s={[0.06, 0.3, 0.06]} m={m.duster} r={[0.6, 0, 0]} />
				))}
			</group>
			{/* a small altar on the front wall: a Santo Nino in red, a candle */}
			<Box p={[1.4, 1.3, 1.62]} s={[0.5, 0.04, 0.2]} m={m.wood} />
			<mesh position={[1.3, 1.42, 1.62]} material={m.santo}>
				<coneGeometry args={[0.05, 0.2, 6]} />
			</mesh>
			<mesh position={[1.3, 1.55, 1.62]} material={m.gold}>
				<sphereGeometry args={[0.03, 5, 4]} />
			</mesh>
			{candle && <Box p={[1.52, 1.36, 1.62]} s={[0.02, 0.08, 0.02]} m={m.candle} />}
		</group>
	);
};

/** A neighbour's house (exterior only): stilts, sawali walls, a yero roof, a window that may be open and dark. */
const Neighbour: React.FC<{p: [number, number, number]; r?: number; openDark?: boolean; lit?: boolean}> = ({p, r = 0, openDark, lit}) => {
	const m = useM();
	return (
		<group position={p} rotation={[0, r, 0]}>
			<Box p={[0, 1.15 - GROUND, 0]} s={[3.6, 2.3, 3.2]} m={m.sawali} />
			{[-1.6, 1.6].map((x) => [-1.4, 1.4].map((z) => <Box key={`${x}${z}`} p={[x, -GROUND / 2, z]} s={[0.12, -GROUND, 0.12]} m={m.darkWood} />))}
			<group position={[0, -GROUND, 0]}>
				<Roof w={1.8} d={1.6} eave={2.45} ridge={3.15} />
			</group>
			<Box p={[0, 1.35 - GROUND, 1.62]} s={[0.7, 0.6, 0.04]} m={openDark ? m.black : lit ? m.storeLight : m.wood} />
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
			<Box p={[0, 4, 0]} s={[0.25, 8, 0.25]} m={m.trunk} />
			{fronds.map((f, i) => (
				<group key={i} position={[0, 8, 0]} rotation={[0, f.a, 0]}>
					<Box p={[1.1, -0.3 * f.droop, 0]} s={[2.4, 0.04, 0.5]} m={m.leaf} r={[0, 0, -0.35 * f.droop]} />
				</group>
			))}
		</group>
	);
};

/** The barrio street at night (the fiesta): neighbours, banderitas, the store, the videoke tent, coconut trees. */
export const Barrio: React.FC<{t: number; videokeOn: boolean; screenHue: number}> = ({t, videokeOn, screenHue}) => {
	const m = useM();
	const flags = [m.flagR, m.flagY, m.flagB, m.flagG];
	const scr = useMemo(() => new THREE.MeshBasicMaterial({color: new THREE.Color().setHSL(screenHue, 0.6, 0.55)}), [screenHue]);
	return (
		<group>
			<Box p={[0, GROUND - 0.05, 10]} s={[160, 0.1, 80]} m={m.ground} />
			<Box p={[0, GROUND - 0.03, STREET_Z + 2]} s={[160, 0.06, 4.5]} m={m.street} />
			{/* houses line both sides of the street, close to it */}
			<Neighbour p={[-7.5, GROUND, 2.6]} openDark />
			<Neighbour p={[7.5, GROUND, 2.4]} lit />
			<Neighbour p={[-13, GROUND, 2.8]} />
			<Neighbour p={[-18.5, GROUND, 2.5]} lit />
			<Neighbour p={[15, GROUND, 2.6]} lit />
			<Neighbour p={[-6, GROUND, 12.6]} r={Math.PI} />
			<Neighbour p={[-12, GROUND, 12.8]} r={Math.PI} lit />
			<Neighbour p={[-17.5, GROUND, 12.5]} r={Math.PI} />
			<Neighbour p={[16, GROUND, 12.8]} r={Math.PI} />
			{/* the sari-sari store opposite: a lit grille window and a hand-painted sign */}
			<group position={STORE}>
				<Box p={[0, 1.3, 0]} s={[3.4, 2.6, 2.6]} m={m.sawali} />
				<Box p={[0, 1.3, -1.32]} s={[2.0, 0.9, 0.04]} m={m.storeLight} />
				{Array.from({length: 9}, (_, i) => (
					<Box key={i} p={[-0.9 + i * 0.225, 1.3, -1.36]} s={[0.03, 0.95, 0.03]} m={m.grille} />
				))}
				<Box p={[0, 2.3, -1.36]} s={[2.6, 0.4, 0.04]} m={m.sign} />
				<Box p={[0, 2.3, -1.39]} s={[2.0, 0.12, 0.02]} m={m.signText} />
				<Box p={[0, 2.75, 0]} s={[3.8, 0.06, 3.0]} m={m.yero} r={[-0.1, 0, 0]} />
			</group>
			{/* the videoke tent far down the street: a tarp, a screen, string lights */}
			<group position={VIDEOKE}>
				<Box p={[0, 2.6, 0]} s={[5, 0.05, 4]} m={m.tarp} />
				{[-2.4, 2.4].map((x) => [-1.9, 1.9].map((z) => <Box key={`${x}${z}`} p={[x, 1.3, z]} s={[0.08, 2.6, 0.08]} m={m.darkWood} />))}
				<Box p={[0, 1.4, 1.6]} s={[1.4, 0.85, 0.08]} m={videokeOn ? scr : m.screenOff} />
				{videokeOn && [-2, 0, 2].map((z) => Array.from({length: 12}, (_, i) => <Box key={`${z}-${i}`} p={[-2.4 + i * 0.44, 2.5, z]} s={[0.1, 0.1, 0.1]} m={flags[i % 4]} />))}
			</group>
			{/* banderitas strung across the street */}
			{[-20, -12, -4, 4, 12].map((x) =>
				Array.from({length: 14}, (_, i) => {
					const z = STREET_Z - 1 + i * 0.5;
					const sag = Math.sin((i / 13) * Math.PI) * 0.5;
					return (
						<mesh key={`${x}-${i}`} position={[x + Math.sin(t * 2 + i) * 0.03, 4.0 - sag, z]} rotation={[0, Math.PI / 2, Math.PI]} material={flags[(i + x) % 4 < 0 ? ((i + x) % 4) + 4 : (i + x) % 4]}>
							<coneGeometry args={[0.16, 0.3, 3]} />
						</mesh>
					);
				}),
			)}
			<Coconut p={[-4, GROUND, 4]} seed={3} />
			<Coconut p={[4.5, GROUND, -4]} lean={-0.12} seed={5} />
			<Coconut p={[-11, GROUND, -5]} lean={0.2} seed={7} />
			<Coconut p={[11, GROUND, 18]} seed={9} />
			<Coconut p={[-20, GROUND, 16]} lean={-0.2} seed={11} />
			<mesh position={[-120, 90, -160]} material={m.moon}>
				<circleGeometry args={[7, 14]} />
			</mesh>
		</group>
	);
};
