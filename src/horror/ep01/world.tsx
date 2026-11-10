// Episode 1 world: one consistent low-poly set so every shot shares geography.
//
// Layout (metres, y up). Our house: living room x[-3,3] z[-2.5,2.5], kitchen x[3,6].
// The front window is on the north wall (z = -2.5) and faces the street (z -8..-14).
// Neighbours' houses are across the street (z = -20). The kitchen's glass back door
// is on the east wall (x = 6); the yard runs east to a fence at x = 14. The thing
// that is not the Moon rises in the far east (+x).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1, rng} from '../ps1';

export const SNAP6 = 'vec2(80.0, 142.0)';
const M = (color: string, opts: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...opts}), 20, SNAP6);
const B = (color: string, opts: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...opts}), 20, SNAP6);

const tex = (w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void, seed = 1, repeat?: [number, number]) => {
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	draw(c.getContext('2d')!, rng(seed));
	const t = new THREE.CanvasTexture(c);
	t.magFilter = THREE.NearestFilter;
	t.minFilter = THREE.NearestFilter;
	t.generateMipmaps = false;
	t.colorSpace = THREE.SRGBColorSpace;
	if (repeat) {
		t.wrapS = t.wrapT = THREE.RepeatWrapping;
		t.repeat.set(...repeat);
	}
	return t;
};

const useMats = () =>
	useMemo(() => {
		const floor = tex(32, 32, (g, r) => {
			for (let y = 0; y < 32; y += 4) {
				g.fillStyle = ['#5a3b28', '#4e3222', '#634230'][Math.floor(r() * 3)];
				g.fillRect(0, y, 32, 4);
				g.fillStyle = '#2e1d14';
				g.fillRect(0, y + 3, 32, 1);
				g.fillRect(Math.floor(r() * 32), y, 1, 3);
			}
		}, 2, [6, 5]);
		const wall = tex(16, 32, (g, r) => {
			g.fillStyle = '#6e6a52';
			g.fillRect(0, 0, 16, 32);
			for (let x = 0; x < 16; x += 4) {
				g.fillStyle = '#625e48';
				g.fillRect(x, 0, 1, 32);
			}
			for (let i = 0; i < 10; i++) {
				g.fillStyle = '#7a7660';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 32), 1, 1);
			}
		}, 3, [10, 2]);
		const siding = tex(16, 16, (g) => {
			g.fillStyle = '#8c8a80';
			g.fillRect(0, 0, 16, 16);
			for (let y = 0; y < 16; y += 3) {
				g.fillStyle = '#6a685f';
				g.fillRect(0, y, 16, 1);
			}
		}, 4, [4, 3]);
		const roof = tex(16, 16, (g, r) => {
			g.fillStyle = '#3a3438';
			g.fillRect(0, 0, 16, 16);
			for (let y = 0; y < 16; y += 4)
				for (let x = 0; x < 16; x += 4) {
					g.fillStyle = r() > 0.5 ? '#2c272b' : '#443d42';
					g.fillRect(x + (y % 8 ? 2 : 0), y, 3, 3);
				}
		}, 5, [4, 2]);
		const grass = tex(32, 32, (g, r) => {
			g.fillStyle = '#26331f';
			g.fillRect(0, 0, 32, 32);
			for (let i = 0; i < 220; i++) {
				g.fillStyle = r() > 0.5 ? '#2f3f26' : '#1d2818';
				g.fillRect(Math.floor(r() * 32), Math.floor(r() * 32), 1, 2);
			}
		}, 6, [20, 20]);
		const road = tex(32, 32, (g, r) => {
			g.fillStyle = '#26262a';
			g.fillRect(0, 0, 32, 32);
			for (let i = 0; i < 160; i++) {
				g.fillStyle = r() > 0.5 ? '#2e2e33' : '#1e1e22';
				g.fillRect(Math.floor(r() * 32), Math.floor(r() * 32), 1, 1);
			}
			g.fillStyle = '#8a7a3a';
			g.fillRect(0, 15, 10, 2);
			g.fillRect(16, 15, 10, 2);
		}, 7, [12, 1]);
		const curtain = tex(16, 32, (g) => {
			for (let x = 0; x < 16; x++) {
				const v = 0.75 + 0.25 * Math.sin((x / 16) * Math.PI * 6);
				g.fillStyle = `rgb(${Math.round(120 * v)},${Math.round(84 * v)},${Math.round(64 * v)})`;
				g.fillRect(x, 0, 1, 32);
			}
		}, 8, [1, 1]);
		const fence = tex(16, 16, (g) => {
			g.fillStyle = '#4a3a2c';
			g.fillRect(0, 0, 16, 16);
			for (let x = 0; x < 16; x += 4) {
				g.fillStyle = '#2e241b';
				g.fillRect(x + 3, 0, 1, 16);
			}
		}, 9, [10, 1]);
		return {
			floor: M('#ffffff', {map: floor}),
			wall: M('#ffffff', {map: wall, side: THREE.DoubleSide}),
			ceiling: M('#3a3830', {side: THREE.DoubleSide}),
			kitchenWall: M('#5a6458', {side: THREE.DoubleSide}),
			siding: M('#ffffff', {map: siding}),
			sidingB: M('#c8b8a0', {map: siding}),
			sidingC: M('#9aa8b0', {map: siding}),
			roof: M('#ffffff', {map: roof}),
			grass: M('#ffffff', {map: grass}),
			road: M('#ffffff', {map: road}),
			sidewalk: M('#5a5a58'),
			curtain: M('#ffffff', {map: curtain, side: THREE.DoubleSide}),
			fence: M('#ffffff', {map: fence, side: THREE.DoubleSide}),
			couch: M('#4a5a3a'),
			couchDark: M('#36442a'),
			wood: M('#4a3020'),
			woodLight: M('#6a4a30'),
			tvBody: M('#2a2a2c'),
			tvDark: M('#121214'),
			rug: M('#5a2a2a'),
			frame: M('#2a1e14'),
			counter: M('#7a786c'),
			cabinet: M('#4c5a4a'),
			glass: B('#1a2a3a', {transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false}),
			trunk: M('#2a2018'),
			leaves: M('#16221a'),
			pole: M('#2a2c30'),
			lampHead: B('#ffd9a0'),
			windowWarm: B('#ffcf80'),
			windowDark: B('#10141c'),
			doorDark: M('#2a2420'),
			black: B('#000000'),
		};
	}, []);

export type Mats = ReturnType<typeof useMats>;
export const MatsContext = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(MatsContext)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <MatsContext.Provider value={useMats()}>{children}</MatsContext.Provider>;

const Box: React.FC<{p: [number, number, number]; s: [number, number, number]; m: THREE.Material; r?: [number, number, number]}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={s} />
	</mesh>
);

// ------------------------------------------------------------------ people

export type Pose = {
	sit?: boolean;
	yaw?: number; // body facing, radians (0 = +x)
	head?: [number, number]; // [turn, tilt]
	armL?: [number, number]; // [shoulder pitch, elbow]
	armR?: [number, number];
	step?: number; // walking phase
};

export const Human: React.FC<{pose: Pose; look: {skin: string; hair: string; top: string; legs: string; longHair?: boolean}; pos: [number, number, number]; face?: boolean}> = ({pose, look, pos, face}) => {
	const m = useMemo(() => ({skin: M(look.skin), hair: M(look.hair), top: M(look.top), legs: M(look.legs), eye: B('#0a0808')}), [look]);
	const sit = !!pose.sit;
	const hipY = sit ? 0.48 : 0.92;
	const sw = pose.step ? Math.sin(pose.step) * 0.5 : 0;
	const leg = (side: number) => (
		<group position={[0, hipY, side * 0.1]} rotation={[0, 0, sit ? Math.PI / 2 - 0.05 : sw * side]}>
			<Box p={[0, -0.22, 0]} s={[0.16, 0.44, 0.15]} m={m.legs} />
			<group position={[0, -0.44, 0]} rotation={[0, 0, sit ? -Math.PI / 2 + 0.1 : Math.max(0, -sw * side) * 0.6]}>
				<Box p={[0, -0.22, 0]} s={[0.14, 0.44, 0.14]} m={m.legs} />
				<Box p={[0.05, -0.46, 0]} s={[0.24, 0.07, 0.13]} m={m.hair} />
			</group>
		</group>
	);
	const arm = (side: number, a: [number, number] = [0, 0]) => (
		<group position={[0, hipY + 0.52, side * 0.27]} rotation={[0, 0, a[0] - sw * side * 0.6]}>
			<Box p={[0, -0.16, 0]} s={[0.12, 0.32, 0.11]} m={m.top} />
			<group position={[0, -0.32, 0]} rotation={[0, 0, a[1]]}>
				<Box p={[0, -0.14, 0]} s={[0.1, 0.28, 0.1]} m={m.top} />
				<Box p={[0, -0.32, 0]} s={[0.09, 0.1, 0.08]} m={m.skin} />
			</group>
		</group>
	);
	return (
		<group position={pos} rotation={[0, pose.yaw ?? 0, 0]}>
			{leg(1)}
			{leg(-1)}
			<Box p={[0, hipY + 0.28, 0]} s={[0.24, 0.58, 0.44]} m={m.top} />
			{arm(1, pose.armL)}
			{arm(-1, pose.armR)}
			<group position={[0, hipY + 0.66, 0]} rotation={[0, pose.head?.[0] ?? 0, pose.head?.[1] ?? 0]}>
				<Box p={[0, 0.03, 0]} s={[0.09, 0.08, 0.09]} m={m.skin} />
				<mesh position={[0.01, 0.2, 0]} material={m.skin} scale={[1, 1.15, 0.95]}>
					<icosahedronGeometry args={[0.13, 1]} />
				</mesh>
				<mesh position={[-0.02, 0.25, 0]} material={m.hair} scale={[1.05, 0.9, 1.02]}>
					<sphereGeometry args={[0.14, 6, 4, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
				</mesh>
				<Box p={[-0.09, 0.2, 0]} s={[0.1, 0.24, 0.27]} m={m.hair} />
				{look.longHair && <Box p={[-0.1, 0.12, 0]} s={[0.12, 0.34, 0.3]} m={m.hair} />}
				{face && (
					<>
						<Box p={[0.12, 0.21, 0.05]} s={[0.02, 0.03, 0.03]} m={m.eye} />
						<Box p={[0.12, 0.21, -0.05]} s={[0.02, 0.03, 0.03]} m={m.eye} />
					</>
				)}
			</group>
		</group>
	);
};

export const MOTHER = {skin: '#b88a6e', hair: '#2a1a14', top: '#7a3a3a', legs: '#2a2a3a', longHair: true};
export const FATHER = {skin: '#a87e64', hair: '#1a1410', top: '#4a5a6a', legs: '#2c2a26'};
export const NEIGHBOUR = {skin: '#b08a70', hair: '#5a4a3a', top: '#3a4a3a', legs: '#202024'};

// ------------------------------------------------------------------ house interior

export const Curtains: React.FC<{x0: number; x1: number; y0: number; y1: number; z: number; closed: number; normalZ?: number}> = ({x0, x1, y0, y1, z, closed}) => {
	const mm = useM();
	const w = x1 - x0;
	const panel = 0.18 * w + (0.5 * w - 0.18 * w + 0.1) * closed + 0.02;
	const h = y1 - y0 + 0.3;
	return (
		<group>
			<Box p={[x0 + panel / 2 - 0.05, (y0 + y1) / 2 + 0.05, z]} s={[panel, h, 0.04]} m={mm.curtain} />
			<Box p={[x1 - panel / 2 + 0.05, (y0 + y1) / 2 + 0.05, z]} s={[panel, h, 0.04]} m={mm.curtain} />
			<Box p={[(x0 + x1) / 2, y1 + 0.22, z]} s={[w + 0.4, 0.05, 0.05]} m={mm.wood} />
		</group>
	);
};

export const TV_POS: [number, number, number] = [0, 0, 2.05];

export const House: React.FC<{curtains: number; screen: THREE.Texture; vcr: THREE.Texture; doorOpen: number; handle?: number}> = ({curtains, screen, vcr, doorOpen, handle = 0}) => {
	const mm = useM();
	const scr = useMemo(() => ps1(new THREE.MeshBasicMaterial({map: screen}), 20, SNAP6), [screen]);
	const vcrM = useMemo(() => ps1(new THREE.MeshBasicMaterial({map: vcr}), 20, SNAP6), [vcr]);
	return (
		<group>
			{/* floor + ceiling */}
			<Box p={[1.5, -0.05, 0]} s={[9, 0.1, 5]} m={mm.floor} />
			<Box p={[1.5, 2.65, 0]} s={[9, 0.1, 5]} m={mm.ceiling} />
			{/* north wall with front window x[-1.8,0.2] y[0.9,2.1] */}
			<Box p={[-2.4, 1.3, -2.5]} s={[1.2, 2.6, 0.12]} m={mm.wall} />
			<Box p={[1.6, 1.3, -2.5]} s={[2.8, 2.6, 0.12]} m={mm.wall} />
			<Box p={[-0.8, 0.45, -2.5]} s={[2.0, 0.9, 0.12]} m={mm.wall} />
			<Box p={[-0.8, 2.37, -2.5]} s={[2.0, 0.55, 0.12]} m={mm.wall} />
			<Box p={[-0.8, 1.5, -2.52]} s={[2.0, 1.2, 0.02]} m={mm.glass} />
			<Box p={[-0.8, 0.88, -2.42]} s={[2.1, 0.06, 0.2]} m={mm.woodLight} />
			<Curtains x0={-1.8} x1={0.2} y0={0.9} y1={2.1} z={-2.36} closed={curtains} />
			{/* south + west walls */}
			<Box p={[0, 1.3, 2.5]} s={[6.2, 2.6, 0.12]} m={mm.wall} />
			<Box p={[-3, 1.3, 0]} s={[0.12, 2.6, 5]} m={mm.wall} />
			{/* east wall with kitchen doorway z[-0.55,0.55] */}
			<Box p={[3, 1.3, -1.55]} s={[0.12, 2.6, 1.9]} m={mm.wall} />
			<Box p={[3, 1.3, 1.55]} s={[0.12, 2.6, 1.9]} m={mm.wall} />
			<Box p={[3, 2.35, 0]} s={[0.12, 0.6, 1.2]} m={mm.wall} />
			{/* kitchen x[3,6] */}
			<Box p={[4.5, 1.3, -2.5]} s={[3, 2.6, 0.12]} m={mm.kitchenWall} />
			<Box p={[4.5, 1.3, 2.5]} s={[3, 2.6, 0.12]} m={mm.kitchenWall} />
			<Box p={[4.5, 0.45, -2.15]} s={[2.6, 0.9, 0.6]} m={mm.cabinet} />
			<Box p={[4.5, 0.93, -2.15]} s={[2.7, 0.06, 0.66]} m={mm.counter} />
			<Box p={[4.4, 1.9, -2.3]} s={[2.4, 0.7, 0.35]} m={mm.cabinet} />
			<Box p={[4.2, 0.5, 1.6]} s={[1.0, 1.0, 1.4]} m={mm.counter} />
			{/* back door on east wall x=6, door z[-0.45,0.45] with glass upper half */}
			<Box p={[6, 1.3, -1.5]} s={[0.12, 2.6, 2.1]} m={mm.kitchenWall} />
			<Box p={[6, 1.3, 1.5]} s={[0.12, 2.6, 2.1]} m={mm.kitchenWall} />
			<Box p={[6, 2.4, 0]} s={[0.12, 0.5, 0.9]} m={mm.kitchenWall} />
			<group position={[6, 0, -0.45]} rotation={[0, -doorOpen * 1.2, 0]}>
				<Box p={[0, 0.5, 0.45]} s={[0.06, 1.0, 0.9]} m={mm.doorDark} />
				<Box p={[0, 1.6, 0.45]} s={[0.04, 1.2, 0.86]} m={mm.glass} />
				<Box p={[0, 2.12, 0.45]} s={[0.06, 0.06, 0.9]} m={mm.doorDark} />
				<Box p={[0, 1.6, 0.04]} s={[0.06, 1.2, 0.08]} m={mm.doorDark} />
				<Box p={[0, 1.6, 0.86]} s={[0.06, 1.2, 0.08]} m={mm.doorDark} />
				<Box p={[-0.04, 1.0, 0.78]} s={[0.03, 0.08, 0.08]} m={mm.counter} />
				<group position={[-0.07, 1.0, 0.78]} rotation={[-handle * 0.7, 0, 0]}>
					<Box p={[0, 0, -0.06]} s={[0.025, 0.025, 0.13]} m={mm.counter} />
				</group>
			</group>
			{/* living room furniture: couch faces the TV on the south wall */}
			<group position={[0, 0, -0.6]}>
				<Box p={[0, 0.22, 0]} s={[2.0, 0.44, 0.9]} m={mm.couch} />
				<Box p={[0, 0.62, -0.38]} s={[2.0, 0.6, 0.2]} m={mm.couchDark} />
				<Box p={[-1.05, 0.4, 0]} s={[0.2, 0.5, 0.9]} m={mm.couchDark} />
				<Box p={[1.05, 0.4, 0]} s={[0.2, 0.5, 0.9]} m={mm.couchDark} />
			</group>
			<Box p={[0, 0.005, 0.6]} s={[2.6, 0.01, 1.6]} m={mm.rug} />
			<Box p={[0, 0.22, 0.65]} s={[1.0, 0.06, 0.55]} m={mm.wood} />
			<Box p={[-0.4, 0.1, 0.65]} s={[0.06, 0.2, 0.5]} m={mm.wood} />
			<Box p={[0.4, 0.1, 0.65]} s={[0.06, 0.2, 0.5]} m={mm.wood} />
			{/* TV stand, CRT, VCR */}
			<Box p={[0, 0.25, 2.2]} s={[1.3, 0.5, 0.45]} m={mm.wood} />
			<group position={[0, 0.5, 2.15]}>
				<Box p={[0, 0.33, 0.12]} s={[0.78, 0.66, 0.55]} m={mm.tvBody} />
				<Box p={[0, 0.34, -0.17]} s={[0.66, 0.5, 0.04]} m={mm.tvDark} />
				<mesh position={[0, 0.34, -0.195]} rotation={[0, Math.PI, 0]} material={scr}>
					<planeGeometry args={[0.6, 0.45]} />
				</mesh>
			</group>
			<Box p={[0, 0.44, 2.05]} s={[0.6, 0.08, 0.3]} m={mm.tvDark} />
			<mesh position={[0.15, 0.44, 1.895]} rotation={[0, Math.PI, 0]} material={vcrM}>
				<planeGeometry args={[0.16, 0.05]} />
			</mesh>
			{/* wall frames, lamp, plant shadows */}
			<Box p={[-2.93, 1.6, -0.6]} s={[0.03, 0.5, 0.7]} m={mm.frame} />
			<Box p={[-2.93, 1.55, 0.6]} s={[0.03, 0.4, 0.4]} m={mm.frame} />
			<Box p={[-1.6, 0.6, 2.0]} s={[0.06, 1.2, 0.06]} m={mm.pole} />
			<Box p={[-1.6, 1.3, 2.0]} s={[0.36, 0.3, 0.36]} m={mm.woodLight} />
		</group>
	);
};

// ------------------------------------------------------------------ outside

const roofGeo = new THREE.CylinderGeometry(1, 1, 1, 3, 1);

export const HouseShell: React.FC<{p: [number, number, number]; w: number; d: number; h?: number; m: THREE.Material; facing: 1 | -1; windows: {x: number; closed: number; lit: boolean}[]}> = ({p, w, d, h = 2.8, m, facing, windows}) => {
	const mm = useM();
	return (
		<group position={p}>
			<Box p={[0, h / 2, 0]} s={[w, h, d]} m={m} />
			<mesh position={[0, h + 0.6, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.95, w + 0.4, d * 0.62]} material={mm.roof}>
				<primitive object={roofGeo} attach="geometry" />
			</mesh>
			{windows.map((wi, i) => {
				const z = (facing * d) / 2 + facing * 0.02;
				const cw = 0.55 + 0.45 * wi.closed;
				return (
					<group key={i}>
						<mesh position={[wi.x, 1.5, z]} rotation={[0, facing === 1 ? 0 : Math.PI, 0]} material={wi.lit ? mm.windowWarm : mm.windowDark}>
							<planeGeometry args={[1.0, 0.9]} />
						</mesh>
						{wi.lit && (
							<>
								<mesh position={[wi.x - 0.5 + (cw * 0.5) / 2, 1.5, z + facing * 0.01]} rotation={[0, facing === 1 ? 0 : Math.PI, 0]} material={mm.curtain}>
									<planeGeometry args={[cw * 0.5, 0.9]} />
								</mesh>
								<mesh position={[wi.x + 0.5 - (cw * 0.5) / 2, 1.5, z + facing * 0.01]} rotation={[0, facing === 1 ? 0 : Math.PI, 0]} material={mm.curtain}>
									<planeGeometry args={[cw * 0.5, 0.9]} />
								</mesh>
							</>
						)}
						<mesh position={[wi.x, 1.5, z - facing * 0.005]} rotation={[0, facing === 1 ? 0 : Math.PI, 0]} material={mm.frame}>
							<planeGeometry args={[1.12, 1.02]} />
						</mesh>
					</group>
				);
			})}
			<mesh position={[w * 0.3, 1.0, (facing * d) / 2 + facing * 0.02]} rotation={[0, facing === 1 ? 0 : Math.PI, 0]} material={mm.doorDark}>
				<planeGeometry args={[0.9, 2.0]} />
			</mesh>
		</group>
	);
};

const Tree: React.FC<{p: [number, number, number]; s?: number}> = ({p, s = 1}) => {
	const mm = useM();
	return (
		<group position={p} scale={s}>
			<Box p={[0, 1, 0]} s={[0.25, 2, 0.25]} m={mm.trunk} />
			<mesh position={[0, 3.0, 0]} material={mm.leaves}>
				<icosahedronGeometry args={[1.5, 0]} />
			</mesh>
			<mesh position={[0.3, 4.0, 0.2]} material={mm.leaves}>
				<icosahedronGeometry args={[1.0, 0]} />
			</mesh>
		</group>
	);
};

export const StreetLight: React.FC<{p: [number, number, number]; on?: number}> = ({p, on = 1}) => {
	const mm = useM();
	const cone = useMemo(() => B('#ffd9a0', {transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide}), []);
	return (
		<group position={p}>
			<Box p={[0, 2.2, 0]} s={[0.12, 4.4, 0.12]} m={mm.pole} />
			<Box p={[0, 4.4, -0.4]} s={[0.1, 0.1, 0.9]} m={mm.pole} />
			<Box p={[0, 4.3, -0.8]} s={[0.3, 0.12, 0.3]} m={mm.lampHead} />
			<mesh position={[0, 2.1, -0.8]} material={cone}>
				<coneGeometry args={[1.8 * on, 4.3, 8, 1, true]} />
			</mesh>
			<pointLight position={[0, 4.0, -0.8]} intensity={on * 14} distance={14} decay={1.2} color="#ffcf90" />
		</group>
	);
};

/** Everything outside: street, neighbours, yard, fence, trees. */
export const Outside: React.FC<{closed: number[]; lit?: boolean[]}> = ({closed, lit = [true, true, true]}) => {
	const mm = useM();
	return (
		<group>
			<Box p={[0, -0.06, -6]} s={[120, 0.1, 120]} m={mm.grass} />
			<Box p={[0, -0.02, -11]} s={[120, 0.05, 6]} m={mm.road} />
			<Box p={[0, 0.0, -7.6]} s={[120, 0.06, 1.2]} m={mm.sidewalk} />
			<Box p={[0, 0.0, -14.4]} s={[120, 0.06, 1.2]} m={mm.sidewalk} />
			{/* our house exterior shell (front + roof), with the front-window opening x[-1.8,0.2] y[0.9,2.1] */}
			<Box p={[-2.45, 1.4, -2.62]} s={[1.3, 2.8, 0.1]} m={mm.siding} />
			<Box p={[3.15, 1.4, -2.62]} s={[5.9, 2.8, 0.1]} m={mm.siding} />
			<Box p={[-0.8, 0.45, -2.62]} s={[2.0, 0.9, 0.1]} m={mm.siding} />
			<Box p={[-0.8, 2.45, -2.62]} s={[2.0, 0.7, 0.1]} m={mm.siding} />
			<mesh position={[1.5, 3.4, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1.2, 9.6, 3.6]} material={mm.roof}>
				<primitive object={roofGeo} attach="geometry" />
			</mesh>
			{/* across the street, facing south (toward us) */}
			<HouseShell p={[-9, 0, -20]} w={7} d={6} m={mm.sidingB} facing={1} windows={[{x: -1.6, closed: closed[0], lit: lit[0]}]} />
			<HouseShell p={[1, 0, -20]} w={8} d={6} m={mm.siding} facing={1} windows={[{x: -2, closed: closed[1], lit: lit[1]}, {x: 0.2, closed: closed[1], lit: lit[1]}]} />
			<HouseShell p={[11, 0, -20]} w={7} d={6} m={mm.sidingC} facing={1} windows={[{x: -1.4, closed: closed[2], lit: lit[2]}]} />
			<HouseShell p={[-12, 0, 0]} w={6} d={6} m={mm.sidingC} facing={-1} windows={[{x: -1, closed: 1, lit: false}]} />
			<HouseShell p={[22, 0, 0]} w={7} d={6} m={mm.sidingB} facing={-1} windows={[{x: 0, closed: 1, lit: false}]} />
			<StreetLight p={[-4, 0, -14.6]} />
			<StreetLight p={[8, 0, -14.6]} />
			<Tree p={[-5.5, 0, -5]} s={0.9} />
			<Tree p={[16, 0, 4]} s={1.2} />
			<Tree p={[-15, 0, -24]} s={1.1} />
			<Tree p={[20, 0, -24]} s={1.0} />
			{/* backyard fence */}
			<Box p={[14, 0.7, 0]} s={[0.08, 1.4, 12]} m={mm.fence} />
			<Box p={[10, 0.7, 6]} s={[8, 1.4, 0.08]} m={mm.fence} />
			<Box p={[10, 0.7, -6]} s={[8, 1.4, 0.08]} m={mm.fence} />
		</group>
	);
};

// ------------------------------------------------------------------ the thing that is not the Moon

export const NotMoon: React.FC<{rise: number; glow: number}> = ({rise, glow}) => {
	const mats = useMemo(
		() => ({
			disc: new THREE.MeshBasicMaterial({color: '#f4f8e8', fog: false}),
			halo: new THREE.MeshBasicMaterial({color: '#d8ecd0', transparent: true, opacity: 0.25, fog: false, depthWrite: false}),
			halo2: new THREE.MeshBasicMaterial({color: '#b8d0c0', transparent: true, opacity: 0.12, fog: false, depthWrite: false}),
		}),
		[],
	);
	mats.halo.opacity = 0.3 + glow * 0.2;
	mats.halo2.opacity = 0.16 + glow * 0.14;
	const y = -60 + rise * 80;
	const glowTex = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = c.height = 64;
		const g = c.getContext('2d')!;
		const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
		gr.addColorStop(0, 'rgba(220,240,214,1)');
		gr.addColorStop(0.35, 'rgba(160,200,170,0.45)');
		gr.addColorStop(1, 'rgba(60,90,90,0)');
		g.fillStyle = gr;
		g.fillRect(0, 0, 64, 64);
		return new THREE.CanvasTexture(c);
	}, []);
	return (
		<group position={[260, y, -20]} rotation={[0, -Math.PI / 2, 0]}>
			<mesh position={[0, 20, -5]}>
				<planeGeometry args={[520, 420]} />
				<meshBasicMaterial map={glowTex} transparent opacity={0.35 + glow * 0.4} fog={false} depthWrite={false} />
			</mesh>
			<mesh material={mats.halo2}>
				<circleGeometry args={[130, 12]} />
			</mesh>
			<mesh material={mats.halo} position={[0, 0, 1]}>
				<circleGeometry args={[85, 12]} />
			</mesh>
			<mesh material={mats.disc} position={[0, 0, 2]}>
				<circleGeometry args={[55, 10]} />
			</mesh>
		</group>
	);
};
