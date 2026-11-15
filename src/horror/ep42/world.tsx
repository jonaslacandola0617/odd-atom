// Episode 42 world: "Ikalabing-apat" (Season 5, a night guard's experience shared online, retold).
// A composite old office building (no real building, agency or company):
// - THE LOBBY: marble floor, the elevator in the back wall (z = −4) with sliding steel doors, a lit
//   car and a red LED floor indicator; the guard's desk (the user's PSX OFFICE pack), its status
//   monitor, a wall clock, a water cooler; the glass entrance at the front (z = +5).
// - THE 14TH FLOOR: a closed-off corridor, the same elevator in its left wall, one tube flickering by
//   the doors, an EXIT sign at the far end. Seen only through the CCTV.
// The building has no 13th floor: the floor list on the guard's monitor skips it (12, 14…), so the
// "fourteenth" is really the thirteenth (a hidden detail, never said).
import React, {createContext, useContext, useMemo} from 'react';
import * as THREE from 'three';
import {ps1} from '../ps1';
import {SNAP6} from '../ep01/world';
import {PsxProp} from '../psx/models';
import {Box, tex} from '../ep41/world';

export type V3 = [number, number, number];
const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 64, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 64, SNAP6);

/** A canvas texture redrawn on every render (screens, the floor indicator). */
export const useLiveTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
	const {c, t} = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = w;
		c.height = h;
		const t = new THREE.CanvasTexture(c);
		t.magFilter = THREE.NearestFilter;
		t.minFilter = THREE.NearestFilter;
		t.generateMipmaps = false;
		t.colorSpace = THREE.SRGBColorSpace;
		return {c, t};
	}, [w, h]);
	draw(c.getContext('2d')!);
	t.needsUpdate = true;
	return t;
};

const useMatsInner = () =>
	useMemo(() => {
		const marble = tex(32, 32, (g) => {
			g.fillStyle = '#8a8478';
			g.fillRect(0, 0, 32, 32);
			g.fillStyle = '#7a746a';
			g.fillRect(0, 0, 32, 1);
			g.fillRect(0, 0, 1, 32);
			for (let i = 0; i < 40; i++) {
				g.fillStyle = i % 2 ? '#948e82' : '#827c70';
				g.fillRect((i * 13) % 32, (i * 7) % 32, 2, 1);
			}
		}, [8, 10]);
		const carpet = tex(16, 16, (g) => {
			g.fillStyle = '#3a3430';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 30; i++) {
				g.fillStyle = i % 2 ? '#423a34' : '#2e2a26';
				g.fillRect((i * 5) % 16, (i * 11) % 16, 1, 1);
			}
		}, [3, 14]);
		const exit = tex(32, 12, (g) => {
			g.fillStyle = '#0a4a1a';
			g.fillRect(0, 0, 32, 12);
			g.fillStyle = '#9affa8';
			g.font = 'bold 9px "DejaVu Sans", sans-serif';
			g.textAlign = 'center';
			g.fillText('EXIT', 16, 10);
		});
		return {
			marble: lam('#ffffff', {map: marble}),
			carpet: lam('#ffffff', {map: carpet}),
			wall: lam('#b8ae9a'),
			wallDark: lam('#6e6a60'),
			ceil: lam('#9a968c'),
			steel: lam('#a8acb0'),
			steelDark: lam('#5a5e64'),
			car: lam('#c8c2b0'),
			frame: lam('#3a3a3e'),
			panel: bas('#e8f0ff'),
			panelOff: lam('#4a4c50'),
			glass: bas('#0a1018', {transparent: true, opacity: 0.85}),
			street: bas('#ffb060'),
			exit: bas('#ffffff', {map: exit}),
			led: bas('#ff3020'),
			desk: lam('#4a3a2c'),
			bezel: lam('#1a1a1c'),
			plant: lam('#2e4a2a'),
			pot: lam('#5a4030'),
		};
	}, []);
type Mats = ReturnType<typeof useMatsInner>;
const Ctx = createContext<Mats | null>(null);
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMatsInner()}>{children}</Ctx.Provider>;
export const useM = () => useContext(Ctx)!;

// ------------------------------------------------------------------ the elevator (local: doors in the plane z = 0, facing +z)
export const LIFT = {w: 1.1, h: 2.1, depth: 1.5};
/** floor shown by the indicator: a label ('L', '14', …) and whether the car is moving down */
export type Floor = {label: string; down: boolean};
const Indicator: React.FC<{floor: Floor}> = ({floor}) => {
	const t = useLiveTex(32, 16, (g) => {
		g.fillStyle = '#120404';
		g.fillRect(0, 0, 32, 16);
		g.fillStyle = '#ff3a24';
		g.font = 'bold 12px "DejaVu Sans Mono", monospace';
		g.textAlign = 'center';
		g.fillText(floor.label, 19, 13);
		if (floor.down) {
			g.beginPath();
			g.moveTo(3, 6);
			g.lineTo(9, 6);
			g.lineTo(6, 11);
			g.fill();
		}
	});
	return (
		<mesh position={[0, LIFT.h + 0.28, 0.03]}>
			<planeGeometry args={[0.42, 0.21]} />
			<meshBasicMaterial map={t} />
		</mesh>
	);
};
/** open: 0 shut, 1 fully open. carLight: the car's ceiling light (0 off). */
export const Elevator: React.FC<{open: number; floor: Floor; carLight?: number; wallW?: number; wallH?: number; wallM?: 'wall' | 'wallDark'}> = ({open, floor, carLight = 1, wallW = 4, wallH = 3.2, wallM = 'wall'}) => {
	const M = useM();
	const {w, h, depth} = LIFT;
	const half = w / 2;
	const side = (wallW - w) / 2;
	return (
		<group>
			{/* the wall around the opening */}
			<Box p={[-(half + side / 2), wallH / 2, -0.05]} s={[side, wallH, 0.1]} m={M[wallM]} />
			<Box p={[half + side / 2, wallH / 2, -0.05]} s={[side, wallH, 0.1]} m={M[wallM]} />
			<Box p={[0, (h + wallH) / 2, -0.05]} s={[w, wallH - h, 0.1]} m={M[wallM]} />
			{/* the steel frame */}
			<Box p={[-half - 0.05, h / 2, 0.01]} s={[0.1, h + 0.1, 0.06]} m={M.steelDark} />
			<Box p={[half + 0.05, h / 2, 0.01]} s={[0.1, h + 0.1, 0.06]} m={M.steelDark} />
			<Box p={[0, h + 0.05, 0.01]} s={[w + 0.2, 0.1, 0.06]} m={M.steelDark} />
			<Box p={[0, h + 0.28, 0.0]} s={[0.5, 0.28, 0.04]} m={M.frame} />
			<Indicator floor={floor} />
			{/* the call button */}
			<Box p={[half + 0.3, 1.1, 0.0]} s={[0.1, 0.18, 0.03]} m={M.steelDark} />
			<mesh position={[half + 0.3, 1.08, 0.02]}>
				<circleGeometry args={[0.025, 8]} />
				<meshBasicMaterial color={floor.down ? '#ffb040' : '#4a3a20'} />
			</mesh>
			{/* the doors: two steel halves sliding apart */}
			<Box p={[-half / 2 - open * half * 0.98, h / 2, 0.0]} s={[half, h, 0.04]} m={M.steel} />
			<Box p={[half / 2 + open * half * 0.98, h / 2, 0.0]} s={[half, h, 0.04]} m={M.steel} />
			{/* the car */}
			<Box p={[0, -0.02, -depth / 2 - 0.05]} s={[w + 0.2, 0.04, depth]} m={M.steelDark} />
			<Box p={[0, h + 0.02, -depth / 2 - 0.05]} s={[w + 0.2, 0.04, depth]} m={M.car} />
			<Box p={[-half - 0.1, h / 2, -depth / 2 - 0.05]} s={[0.04, h, depth]} m={M.car} />
			<Box p={[half + 0.1, h / 2, -depth / 2 - 0.05]} s={[0.04, h, depth]} m={M.car} />
			<Box p={[0, h / 2, -depth - 0.05]} s={[w + 0.2, h, 0.04]} m={M.car} />
			<Box p={[0, 1.0, -depth + 0.0]} s={[w, 0.04, 0.06]} m={M.steel} />
			<mesh position={[0, h - 0.01, -depth / 2]} rotation={[Math.PI / 2, 0, 0]} material={carLight > 0.05 ? M.panel : M.panelOff}>
				<planeGeometry args={[0.6, 0.6]} />
			</mesh>
			{carLight > 0.05 && <pointLight position={[0, h - 0.2, -depth / 2]} intensity={2.2 * carLight} distance={3.2} decay={1} color="#f0f4ff" />}
		</group>
	);
};

// ------------------------------------------------------------------ the guard's status monitor (screen drawn live)
/** what the screen shows: the floor list (no 13), the car's floor, and a dark 14F camera tile */
export const StatusScreen: React.FC<{floor: Floor; t: number}> = ({floor, t}) => {
	const map = useLiveTex(96, 72, (g) => {
		g.fillStyle = '#04120c';
		g.fillRect(0, 0, 96, 72);
		g.fillStyle = '#5aff9a';
		g.font = 'bold 9px "DejaVu Sans Mono", monospace';
		g.fillText('ELEV 1', 4, 11);
		// the car's floor, big
		g.fillRect(4, 16, 40, 30);
		g.fillStyle = '#04120c';
		g.font = 'bold 24px "DejaVu Sans Mono", monospace';
		g.textAlign = 'center';
		g.fillText(floor.label, 24, 40);
		g.textAlign = 'left';
		// the floor list around it: there is no 13
		g.font = '8px "DejaVu Sans Mono", monospace';
		['16', '15', '14', '12', '11', '10'].forEach((f, i) => {
			g.fillStyle = f === floor.label ? '#5aff9a' : '#2a8a50';
			g.fillText((f === floor.label ? '>' : ' ') + f, 54, 12 + i * 9);
		});
		// its camera: closed, no one should be there
		g.fillStyle = '#ff5a40';
		g.font = 'bold 9px "DejaVu Sans Mono", monospace';
		g.fillText('14F SARADO', 4, 60);
		g.fillStyle = Math.floor(t * 2) % 2 ? '#ff5a40' : '#4a1a10';
		g.fillRect(84, 53, 6, 6);
	});
	return (
		<group>
			<Box p={[0, 0.2, 0]} s={[0.5, 0.36, 0.06]} m={useM().bezel} />
			<Box p={[0, 0.0, 0.0]} s={[0.12, 0.04, 0.12]} m={useM().bezel} />
			<mesh position={[0, 0.2, 0.031]}>
				<planeGeometry args={[0.44, 0.31]} />
				<meshBasicMaterial map={map} />
			</mesh>
		</group>
	);
};

// ------------------------------------------------------------------ the lobby (elevator at x = 0, z = −4)
export const LOBBY = {w: 9, d: 9, h: 3.2, liftZ: -4, deskP: [2.2, 0, -0.6] as V3};
export const Lobby: React.FC<{open: number; floor: Floor; carLight?: number; t: number}> = ({open, floor, carLight, t}) => {
	const M = useM();
	const {w, d, h, liftZ} = LOBBY;
	const zc = liftZ + d / 2;
	return (
		<group>
			<Box p={[0, -0.05, zc]} s={[w, 0.1, d]} m={M.marble} />
			<Box p={[0, h + 0.05, zc]} s={[w, 0.1, d]} m={M.ceil} />
			<Box p={[-w / 2, h / 2, zc]} s={[0.1, h, d]} m={M.wall} />
			<Box p={[w / 2, h / 2, zc]} s={[0.1, h, d]} m={M.wall} />
			<group position={[0, 0, liftZ]}>
				<Elevator open={open} floor={floor} carLight={carLight} wallW={w} wallH={h} />
			</group>
			{/* ceiling panels: half of them off for the night */}
			{[-2, 0.5, 3].map((z) =>
				[-2, 2].map((x) => (
					<mesh key={`${x}${z}`} position={[x, h - 0.005, z]} rotation={[Math.PI / 2, 0, 0]} material={(x + z) % 2 === 0 ? M.panelOff : M.panel}>
						<planeGeometry args={[1.2, 0.6]} />
					</mesh>
				)),
			)}
			{/* the glass entrance at the front, the street's orange beyond */}
			<Box p={[0, h / 2, zc + d / 2]} s={[w, h, 0.05]} m={M.glass} />
			<Box p={[0, 1.4, zc + d / 2 + 2]} s={[w * 2, 2.8, 0.1]} m={M.street} />
			{[-1.5, 0, 1.5].map((x) => (
				<Box key={x} p={[x, h / 2, zc + d / 2 - 0.03]} s={[0.06, h, 0.06]} m={M.frame} />
			))}
			{/* the guard's desk */}
			<group position={LOBBY.deskP}>
				<PsxProp path="assets/models/psx/props/office/desk1_weathered.glb" s={0.85} rotation={[0, Math.PI, 0]} />
				<group position={[-0.25, 0.76, 0.0]} rotation={[0, Math.PI - 0.15, 0]}>
					<group rotation={[0, Math.PI, 0]}>
						<StatusScreen floor={floor} t={t} />
					</group>
				</group>
				<group position={[0.5, 0.76, 0.05]}>
					<PsxProp path="assets/models/psx/props/office/square_desklamp.glb" rotation={[0, Math.PI, 0]} />
				</group>
			</group>
			<group position={[LOBBY.deskP[0], 0, LOBBY.deskP[2] + 0.75]}>
				<PsxProp path="assets/models/psx/props/office/office_chair_black.glb" rotation={[0, Math.PI, 0]} />
			</group>
			{/* the clock over the elevator's right, the water cooler, a plant */}
			<group position={[1.6, 2.5, liftZ + 0.06]}>
				<PsxProp path="assets/models/psx/props/office/wall_clock.glb" s={0.6} />
			</group>
			<group position={[-3.6, 0, liftZ + 0.5]}>
				<PsxProp path="assets/models/psx/props/office/water_cooler.glb" />
			</group>
			<Box p={[3.8, 0.25, liftZ + 0.5]} s={[0.4, 0.5, 0.4]} m={M.pot} />
			<mesh position={[3.8, 0.9, liftZ + 0.5]} material={M.plant}>
				<icosahedronGeometry args={[0.4, 0]} />
			</mesh>
		</group>
	);
};

// ------------------------------------------------------------------ the 14th floor (its own set, far from the lobby)
export const F14 = {origin: [60, 0, 0] as V3, w: 2.4, h: 2.7, z0: 1.2, z1: -12, liftZ: -3.6};
export const Floor14: React.FC<{open: number; floor: Floor; tube: number}> = ({open, floor, tube}) => {
	const M = useM();
	const {w, h, z0, z1, liftZ} = F14;
	const L = z0 - z1;
	const zc = (z0 + z1) / 2;
	const lw = 3.0; // the wall piece the elevator sits in
	return (
		<group position={F14.origin}>
			<Box p={[0, -0.05, zc]} s={[w, 0.1, L]} m={M.carpet} />
			<Box p={[0, h + 0.05, zc]} s={[w, 0.1, L]} m={M.ceil} />
			<Box p={[w / 2, h / 2, zc]} s={[0.1, h, L]} m={M.wallDark} />
			{/* left wall, with the elevator in it (facing +x) */}
			<Box p={[-w / 2, h / 2, (z0 + liftZ + lw / 2) / 2]} s={[0.1, h, z0 - (liftZ + lw / 2)]} m={M.wallDark} />
			<Box p={[-w / 2, h / 2, (liftZ - lw / 2 + z1) / 2]} s={[0.1, h, liftZ - lw / 2 - z1]} m={M.wallDark} />
			<group position={[-w / 2 + 0.05, 0, liftZ]} rotation={[0, Math.PI / 2, 0]}>
				<Elevator open={open} floor={floor} carLight={open > 0.02 ? 1 : 0} wallW={lw} wallH={h} wallM="wallDark" />
			</group>
			{/* end walls; doors along the right (closed offices) */}
			<Box p={[0, h / 2, z1]} s={[w, h, 0.1]} m={M.wallDark} />
			<Box p={[0, h / 2, z0]} s={[w, h, 0.1]} m={M.wallDark} />
			{[-1.5, -6, -9.5].map((z) => (
				<Box key={z} p={[w / 2 - 0.03, 1.0, z]} s={[0.04, 2.0, 0.9]} m={M.frame} />
			))}
			{/* the EXIT sign at the far end, and its green light */}
			<mesh position={[0, h - 0.25, z1 + 0.06]} material={M.exit}>
				<planeGeometry args={[0.5, 0.18]} />
			</mesh>
			<pointLight position={[0, h - 0.4, z1 + 0.5]} intensity={1.1} distance={4} decay={1} color="#60ff90" />
			{/* one tube by the elevator, flickering */}
			<mesh position={[0, h - 0.01, liftZ]} rotation={[Math.PI / 2, 0, 0]} material={tube > 0.3 ? M.panel : M.panelOff}>
				<planeGeometry args={[0.2, 1.2]} />
			</mesh>
			<pointLight position={[0, h - 0.3, liftZ]} intensity={1.8 * tube} distance={5} decay={1} color="#e0ecff" />
		</group>
	);
};
