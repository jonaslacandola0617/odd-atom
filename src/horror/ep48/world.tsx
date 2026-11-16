// Episode 48 world: "Bedspace" (Season 5, students' experience in an old boarding house, shared online
// and retold). A composite old Manila boarding house (no real building, street or landlord):
// - THE ROOM: x −3..3, z −2.5..2.5, 2.8 m high. Three metal double-decks whose open sides all face the
//   ceiling corner at (+x, +z): A along the left wall (x −2.5, z −0.8..1.2; mine below, the sixth above),
//   C and D along the back wall (z −2.05; C x −1.3..0.7, D x 0.9..2.9). A window in the left wall past
//   A's foot; a stand fan; clothes on hooks.
// - THE BUILDING: three storeys of tired concrete with grilles, a clothesline, wires, one lit window.
import React, {createContext, useContext, useMemo} from 'react';
import * as THREE from 'three';
import {ps1} from '../ps1';
import {SNAP6} from '../ep01/world';
import {PsxProp} from '../psx/models';
import {Box, tex} from '../ep41/world';

export type V3 = [number, number, number];
const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 64, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 64, SNAP6);

export const ROOM = {x0: -3, x1: 3, z0: -2.5, z1: 2.5, h: 2.8};
export const LOW = 0.45; // lower mattress top
export const HIGH = 1.55; // upper mattress top
/** each bunk: centre, and whether its long axis runs along z (A) or x (C, D) */
export const BUNKS = {
	A: {c: [-2.5, 0.2] as [number, number], alongZ: true},
	C: {c: [-0.3, -2.05] as [number, number], alongZ: false},
	D: {c: [1.9, -2.05] as [number, number], alongZ: false},
};

const useMatsInner = () =>
	useMemo(() => {
		const paint = tex(16, 16, (g) => {
			g.fillStyle = '#8a9a8a';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 18; i++) {
				g.fillStyle = i % 3 ? 'rgba(60,50,30,0.25)' : 'rgba(255,255,255,0.08)';
				g.fillRect((i * 7) % 16, (i * 11) % 16, 2 + (i % 2), 1);
			}
		}, [3, 2]);
		const tiles = tex(16, 16, (g) => {
			g.fillStyle = '#7a6a5a';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#5a4c40';
			g.fillRect(0, 0, 16, 1);
			g.fillRect(0, 0, 1, 16);
			g.fillRect(0, 8, 16, 1);
			g.fillRect(8, 0, 1, 16);
		}, [6, 5]);
		const foam = tex(16, 16, (g) => {
			g.fillStyle = '#9a8e70';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 20; i++) {
				g.fillStyle = i % 2 ? '#7a6e54' : '#b0a484';
				g.fillRect((i * 5) % 16, (i * 7) % 16, 2, 2);
			}
		});
		const facade = tex(16, 16, (g) => {
			g.fillStyle = '#8a8478';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 14; i++) {
				g.fillStyle = 'rgba(40,36,30,0.35)';
				g.fillRect((i * 5) % 16, (i * 9) % 16, 1, 3 + (i % 3));
			}
		}, [4, 3]);
		const grille = tex(16, 16, (g) => {
			g.fillStyle = '#10141a';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#4a4a46';
			for (let i = 0; i < 16; i += 3) {
				g.fillRect(i, 0, 1, 16);
				g.fillRect(0, i, 16, 1);
			}
		});
		const grilleLit = tex(16, 16, (g) => {
			g.fillStyle = '#e0b870';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#2a2a26';
			for (let i = 0; i < 16; i += 3) {
				g.fillRect(i, 0, 1, 16);
				g.fillRect(0, i, 16, 1);
			}
		});
		return {
			wall: lam('#ffffff', {map: paint}),
			floor: lam('#ffffff', {map: tiles}),
			ceil: lam('#6a6a62'),
			metal: lam('#5a6a72'),
			sheet: lam('#a8b0b8'),
			sheetB: lam('#b8a890'),
			sheetC: lam('#90a088'),
			foam: lam('#ffffff', {map: foam}),
			pillow: lam('#d0ccc0'),
			window: bas('#ffffff', {map: grille}),
			sky: bas('#1a2030'),
			fan: lam('#2a3a5a'),
			cloth: lam('#7a4a4a'),
			cloth2: lam('#4a5a7a'),
			facade: lam('#ffffff', {map: facade}),
			winOut: bas('#ffffff', {map: grille}),
			winLit: bas('#ffffff', {map: grilleLit}),
			street: lam('#2a2a2c'),
			wire: lam('#0a0a0a'),
			dust: bas('#d8d0b8'),
			beam: bas('#f4f0d8', {transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false}),
		};
	}, []);
type Mats = ReturnType<typeof useMatsInner>;
const Ctx = createContext<Mats | null>(null);
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMatsInner()}>{children}</Ctx.Provider>;
export const useM = () => useContext(Ctx)!;

/** one metal double-deck, local long axis z (0.9 × 2.0). bare: the upper mattress is bare dusty foam */
const Bunk: React.FC<{c: [number, number]; alongZ: boolean; sheet: 'sheet' | 'sheetB' | 'sheetC'; bare?: boolean}> = ({c, alongZ, sheet, bare}) => {
	const M = useM();
	return (
		<group position={[c[0], 0, c[1]]} rotation={[0, alongZ ? 0 : Math.PI / 2, 0]}>
			{[-0.43, 0.43].map((x) =>
				[-0.98, 0.98].map((z) => <Box key={`${x}${z}`} p={[x, 0.95, z]} s={[0.04, 1.9, 0.04]} m={M.metal} />),
			)}
			{[0.3, 1.4].map((y) => (
				<group key={y}>
					<Box p={[-0.43, y, 0]} s={[0.04, 0.05, 2]} m={M.metal} />
					<Box p={[0.43, y, 0]} s={[0.04, 0.05, 2]} m={M.metal} />
					<Box p={[0, y, -0.98]} s={[0.9, 0.05, 0.04]} m={M.metal} />
					<Box p={[0, y, 0.98]} s={[0.9, 0.05, 0.04]} m={M.metal} />
				</group>
			))}
			{/* the head and foot rails */}
			{[0.75, 1.85].map((y) => (
				<group key={y}>
					<Box p={[0, y, -0.98]} s={[0.9, 0.04, 0.04]} m={M.metal} />
					<Box p={[0, y, 0.98]} s={[0.9, 0.04, 0.04]} m={M.metal} />
				</group>
			))}
			<Box p={[0, LOW - 0.07, 0]} s={[0.84, 0.14, 1.92]} m={M[sheet]} />
			<Box p={[0, HIGH - 0.07, 0]} s={[0.84, 0.14, 1.92]} m={bare ? M.foam : M[sheet]} />
			<Box p={[0, LOW + 0.03, -0.8]} s={[0.5, 0.07, 0.3]} m={M.pillow} />
			{!bare && <Box p={[0, HIGH + 0.03, -0.8]} s={[0.5, 0.07, 0.3]} m={M.pillow} />}
			{/* the ladder at the foot */}
			{[0.75, 1.05, 1.3].map((y) => (
				<Box key={y} p={[0.43, y, 0.98]} s={[0.04, 0.03, 0.04]} m={M.metal} />
			))}
		</group>
	);
};

/** the room. day: morning light instead of the street lamp. */
export const Room: React.FC<{day?: boolean; t: number}> = ({day, t}) => {
	const M = useM();
	const {x0, x1, z0, z1, h} = ROOM;
	const W = x1 - x0, D = z1 - z0;
	const fanA = Math.sin(t * 0.8) * 0.7;
	return (
		<group>
			<Box p={[0, -0.05, 0]} s={[W, 0.1, D]} m={M.floor} />
			<Box p={[x0 - 0.05, h / 2, 0]} s={[0.1, h, D]} m={M.wall} />
			<Box p={[x1 + 0.05, h / 2, 0]} s={[0.1, h, D]} m={M.wall} />
			<Box p={[0, h / 2, z0 - 0.05]} s={[W, h, 0.1]} m={M.wall} />
			<Box p={[0, h / 2, z1 + 0.05]} s={[W, h, 0.1]} m={M.wall} />
			{/* the window in the left wall past A's foot */}
			<mesh position={[x0 + 0.01, 1.55, 1.85]} rotation={[0, Math.PI / 2, 0]} material={M.window}>
				<planeGeometry args={[0.9, 0.9]} />
			</mesh>
			<pointLight position={[x0 + 0.6, 1.6, 1.85]} intensity={day ? 3.0 : 1.4} distance={5.5} decay={1} color={day ? '#fff0d0' : '#ffb060'} />
			<Bunk {...BUNKS.A} sheet="sheet" bare={day} />
			<Bunk {...BUNKS.C} sheet="sheetB" />
			<Bunk {...BUNKS.D} sheet="sheetC" />
			{/* the stand fan in the far corner, turning its head */}
			<group position={[2.6, 0, 1.6]}>
				<Box p={[0, 0.5, 0]} s={[0.04, 1.0, 0.04]} m={M.metal} />
				<group position={[0, 1.05, 0]} rotation={[0, -2.3 + fanA, 0]}>
					<Box p={[0, 0, 0.08]} s={[0.36, 0.36, 0.06]} m={M.fan} />
				</group>
			</group>
			{/* clothes on hooks by the window */}
			<Box p={[x0 + 0.05, 1.6, 2.25]} s={[0.06, 0.6, 0.3]} m={M.cloth} />
			<Box p={[x0 + 0.05, 1.7, -1.6]} s={[0.06, 0.5, 0.3]} m={M.cloth2} />
		</group>
	);
};

/** the phone torch: a soft cone from p to q and a pool of light at q */
export const Torch: React.FC<{p: V3; q: V3; on: number}> = ({p, q, on}) => {
	const M = useM();
	const {pos, quat, len} = useMemo(() => {
		const a = new THREE.Vector3(...p), b = new THREE.Vector3(...q);
		const d = b.clone().sub(a);
		const len = d.length();
		const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), d.clone().normalize());
		return {pos: a.clone().add(d.multiplyScalar(0.5)), quat, len};
	}, [p, q]);
	if (on < 0.02) return null;
	const back = new THREE.Vector3(...q).lerp(new THREE.Vector3(...p), 0.25);
	return (
		<group>
			<mesh position={pos} quaternion={quat} material={M.beam}>
				<cylinderGeometry args={[0.01, 0.32, len, 10, 1, true]} />
			</mesh>
			<pointLight position={back.toArray() as V3} intensity={3.2 * on} distance={1.5} decay={1} color="#f4f0d8" />
		</group>
	);
};

/** dust motes drifting in the morning light by the bare mattress */
export const Motes: React.FC<{t: number; c: V3}> = ({t, c}) => {
	const M = useM();
	return (
		<group position={c}>
			{Array.from({length: 18}, (_, i) => {
				const ph = (((t * 0.07 + i * 0.13) % 1) + 1) % 1;
				return (
					<mesh key={i} position={[((i * 37) % 9) * 0.06 - 0.24, 0.9 * ph - 0.1, ((i * 53) % 11) * 0.12 - 0.6]} material={M.dust}>
						<boxGeometry args={[0.012, 0.012, 0.012]} />
					</mesh>
				);
			})}
		</group>
	);
};

/** the boarding house from the street at night: one window lit (ours, second floor) */
export const Building: React.FC = () => {
	const M = useM();
	return (
		<group>
			<mesh position={[0, 12, -25]} material={M.sky}>
				<planeGeometry args={[120, 50]} />
			</mesh>
			<Box p={[0, -0.05, 4]} s={[40, 0.1, 20]} m={M.street} />
			<Box p={[0, 4.5, -3]} s={[10, 9, 6]} m={M.facade} />
			{[1.6, 4.6, 7.6].map((y, fi) =>
				[-3, 0, 3].map((x, i) => (
					<mesh key={`${y}${x}`} position={[x, y, 0.01]} material={fi === 1 && i === 0 ? M.winLit : M.winOut}>
						<planeGeometry args={[1.5, 1.3]} />
					</mesh>
				)),
			)}
			<pointLight position={[-3, 4.6, 1.5]} intensity={1.6} distance={6} decay={1} color="#ffb060" />
			{/* a clothesline on the second floor, wires across the street */}
			<Box p={[1.5, 5.6, 0.4]} s={[4, 0.02, 0.02]} m={M.wire} />
			{[0.2, 1.0, 1.9, 2.8].map((x, i) => (
				<Box key={x} p={[x, 5.3, 0.4]} s={[0.4, 0.55, 0.02]} m={i % 2 ? M.cloth : M.cloth2} />
			))}
			{[7.2, 7.8].map((y) => (
				<Box key={y} p={[0, y, 2.5]} s={[30, 0.03, 0.03]} m={M.wire} />
			))}
			<group position={[5.5, 0, 2.2]} rotation={[0, -Math.PI / 2, 0]}>
				<PsxProp path="assets/models/psx/props/urban/street_light.glb" s={1.15} />
			</group>
			<pointLight position={[4.6, 5.5, 2.2]} intensity={2.6} distance={12} decay={1} color="#ffb060" />
		</group>
	);
};
