// Episode 27 world: "The Ball" (Season 3, a real place with reported hauntings: Waverly Hills
// Sanatorium, Louisville, Kentucky). Composites at real scale, not a survey of the building:
// - THE THIRD FLOOR (origin): a long, wide concrete corridor, paint peeling in two tones, dead light
//   fittings, doorways to the wards; WARD ROOM on the left (iron bed frames, a window opening onto the
//   porch beyond, dark);
// - THE PORCH (x 100): the open-air sun porch along the face of the building: bays open to the night,
//   pillars, the trees outside (pale in infrared);
// - THE TUNNEL (x 200): the long tunnel down the hill: concrete steps on one side, the cart rail on
//   the other, a vaulted roof with vents;
// - THE BUILDING (x 1000): the five-storey block with its wings on the hill, trees, the sky;
// - the ball (a child's rubber ball with a band, so its turning reads), the investigator's boot, and
//   two small points of eyeshine at a child's height. No patient is ever shown.
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
// subdivide every surface: the PS1 shader lights per vertex, so a big face under the IR lamp stays black
const seg = (v: number) => Math.min(48, Math.max(1, Math.ceil(v / 0.4)));
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

export const PORCH: V3 = [100, 0, 0];
export const TUN: V3 = [200, 0, 0];
export const EXT: V3 = [1000, 0, 0];
export const CW = 2.8; // corridor width
export const DOOR_Z = -12; // the ward door in the corridor's left wall
export const ROOM = {x0: -CW / 2, x1: -CW / 2 - 5, z0: -9.6, z1: -14.4};
export const TUN_SLOPE = 0.3;

const useMats = () =>
	useMemo(() => {
		const conc = tex(16, 16, (g) => {
			g.fillStyle = '#6a6862';
			g.fillRect(0, 0, 16, 16);
			const r = rng(7);
			for (let i = 0; i < 40; i++) {
				g.fillStyle = r() < 0.5 ? '#5a5852' : '#7a7870';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1 + Math.floor(r() * 2), 1);
			}
			// debris and flakes of paint on the floor
			for (let i = 0; i < 6; i++) {
				g.fillStyle = '#a8a69c';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 2, 1);
			}
		}, [3, 20]);
		const paint = tex(16, 32, (g) => {
			// two-tone hospital paint: dark below the dado line, pale above; peeling in patches
			g.fillStyle = '#9a9a90';
			g.fillRect(0, 0, 16, 32);
			g.fillStyle = '#5e605a';
			g.fillRect(0, 20, 16, 12);
			g.fillStyle = '#3e3e3a';
			g.fillRect(0, 19, 16, 1);
			const r = rng(13);
			for (let i = 0; i < 14; i++) {
				g.fillStyle = r() < 0.5 ? '#6e6c64' : '#b4b2a8';
				const x = Math.floor(r() * 14), y = Math.floor(r() * 30);
				g.fillRect(x, y, 2 + Math.floor(r() * 3), 1 + Math.floor(r() * 2));
			}
		}, [10, 1]);
		const ceil = tex(16, 16, (g) => {
			g.fillStyle = '#7a7a72';
			g.fillRect(0, 0, 16, 16);
			const r = rng(17);
			for (let i = 0; i < 16; i++) {
				g.fillStyle = '#4a4a44';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 3, 1);
			}
		}, [3, 20]);
		const leaves = tex(8, 8, (g) => {
			g.fillStyle = '#b8bab0';
			g.fillRect(0, 0, 8, 8);
			const r = rng(23);
			for (let i = 0; i < 14; i++) {
				g.fillStyle = r() < 0.5 ? '#8a8c84' : '#d8dad0';
				g.fillRect(Math.floor(r() * 8), Math.floor(r() * 8), 1, 1);
			}
		}, [3, 3]);
		const brick = tex(16, 16, (g) => {
			g.fillStyle = '#7a7670';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#5a5650';
			for (let y = 0; y < 16; y += 4) {
				g.fillRect(0, y, 16, 1);
				for (let x = (y / 4) % 2 ? 0 : 4; x < 16; x += 8) g.fillRect(x, y, 1, 4);
			}
		}, [24, 8]);
		return {
			conc: lam('#ffffff', {map: conc}),
			paint: lam('#ffffff', {map: paint}),
			paintD: lam('#ffffff', {map: paint, side: THREE.DoubleSide}),
			ceil: lam('#ffffff', {map: ceil}),
			vault: lam('#7a7870', {side: THREE.DoubleSide}),
			step: lam('#6e6c66'),
			rail: lam('#4a4a48'),
			iron: lam('#3a3a3a'),
			ironL: lam('#7a7a76'),
			fitting: lam('#8a8a84'),
			dark: bas('#020202'),
			ball: lam('#9a8a86'),
			band: lam('#d8d4cc'),
			boot: lam('#1a1a1a'),
			bootL: lam('#3a3a38'),
			leaves: lam('#ffffff', {map: leaves}),
			trunk: lam('#4a4a46'),
			grass: lam('#9a9c94'),
			brick: lam('#ffffff', {map: brick}),
			roof: lam('#2a2a2a'),
			winD: bas('#0a0a0a'),
			winIR: bas('#f0f0f0'),
			vent: bas('#2a2c30'),
			eye: bas('#ffffff', {fog: false}),
			glow: new THREE.MeshBasicMaterial({color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false, fog: false}),
			sky: new THREE.MeshBasicMaterial({color: '#3a3c42', side: THREE.BackSide, fog: false}),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
const Ctx = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(Ctx)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMats()}>{children}</Ctx.Provider>;

/** A barrel vault along z (axis along z, the top half). */
const Vault: React.FC<{p: V3; r: number; len: number; m: THREE.Material}> = ({p, r, len, m}) => (
	<mesh position={p} rotation={[Math.PI / 2, 0, 0]} material={m}>
		<cylinderGeometry args={[r, r, len, 12, seg(len), true, Math.PI / 2, Math.PI]} />
	</mesh>
);

const Bed: React.FC<{p: V3; ry?: number}> = ({p, ry = 0}) => {
	const m = useM();
	return (
		<group position={p} rotation={[0, ry, 0]}>
			{[-0.45, 0.45].map((x) => [-0.95, 0.95].map((z) => <Box key={`${x}${z}`} p={[x, 0.3, z]} s={[0.04, 0.6, 0.04]} m={m.iron} />))}
			{[-0.45, 0.45].map((x) => <Box key={`r${x}`} p={[x, 0.5, 0]} s={[0.04, 0.04, 1.9]} m={m.iron} />)}
			{[-0.95, 0.95].map((z) => <Box key={`h${z}`} p={[0, 0.85, z]} s={[0.94, 0.04, 0.04]} m={m.iron} />)}
			{[-0.95, 0.95].map((z) => [-0.3, -0.1, 0.1, 0.3].map((x) => <Box key={`b${z}${x}`} p={[x, 0.68, z]} s={[0.025, 0.34, 0.025]} m={m.iron} />))}
			{/* the bare springs */}
			{Array.from({length: 8}, (_, i) => (
				<Box key={`s${i}`} p={[0, 0.5, -0.8 + i * 0.23]} s={[0.9, 0.015, 0.02]} m={m.ironL} />
			))}
		</group>
	);
};

/** The third floor: the corridor and the ward room off its left wall. */
export const ThirdFloor: React.FC = () => {
	const m = useM();
	const len = 40;
	const zc = 4 - len / 2;
	const R = ROOM;
	return (
		<group>
			<Floor p={[0, 0, zc]} w={CW} d={len} m={m.conc} />
			<Box p={[0, 3.2, zc]} s={[CW, 0.1, len]} m={m.ceil} />
			{/* right wall, whole; left wall with the ward door at DOOR_Z and other doorways */}
			<Box p={[CW / 2 + 0.05, 1.6, zc]} s={[0.1, 3.2, len]} m={m.paint} />
			<Box p={[-CW / 2 - 0.05, 1.6, (4 + DOOR_Z + 0.6) / 2]} s={[0.1, 3.2, 4 - DOOR_Z - 0.6]} m={m.paint} />
			<Box p={[-CW / 2 - 0.05, 1.6, (DOOR_Z - 0.6 - 36) / 2]} s={[0.1, 3.2, DOOR_Z - 0.6 + 36]} m={m.paint} />
			<Box p={[-CW / 2 - 0.05, 2.75, DOOR_Z]} s={[0.1, 0.9, 1.2]} m={m.paint} />
			{[-4, -20, -26].map((z) => (
				<Box key={z} p={[CW / 2 + 0.02, 1.15, z]} s={[0.06, 2.3, 1.1]} m={m.dark} />
			))}
			{[-24, -31].map((z) => (
				<Box key={z} p={[-CW / 2 - 0.02, 1.15, z]} s={[0.06, 2.3, 1.1]} m={m.dark} />
			))}
			{/* dead light fittings */}
			{[-2, -8, -14, -20, -26, -32].map((z) => (
				<group key={`l${z}`}>
					<Box p={[0, 3.1, z]} s={[0.04, 0.2, 0.04]} m={m.iron} />
					<Box p={[0, 2.95, z]} s={[0.3, 0.1, 0.3]} m={m.fitting} />
				</group>
			))}
			<Box p={[0, 1.6, -36]} s={[CW, 3.2, 0.1]} m={m.paint} />
			{/* the ward room */}
			<Floor p={[(R.x0 + R.x1) / 2, 0.001, (R.z0 + R.z1) / 2]} w={R.x0 - R.x1} d={R.z0 - R.z1} m={m.conc} />
			<Box p={[(R.x0 + R.x1) / 2, 3.2, (R.z0 + R.z1) / 2]} s={[R.x0 - R.x1, 0.1, R.z0 - R.z1]} m={m.ceil} />
			<Box p={[(R.x0 + R.x1) / 2, 1.6, R.z0]} s={[R.x0 - R.x1, 3.2, 0.1]} m={m.paint} />
			<Box p={[(R.x0 + R.x1) / 2, 1.6, R.z1]} s={[R.x0 - R.x1, 3.2, 0.1]} m={m.paint} />
			{/* the far wall: a wide opening onto the porch beyond (dark), with a sill */}
			<Box p={[R.x1, 1.6, R.z0 - 0.7]} s={[0.1, 3.2, 1.4]} m={m.paint} />
			<Box p={[R.x1, 1.6, R.z1 + 0.7]} s={[0.1, 3.2, 1.4]} m={m.paint} />
			<Box p={[R.x1, 2.9, (R.z0 + R.z1) / 2]} s={[0.1, 0.6, 3.4]} m={m.paint} />
			<Box p={[R.x1 - 3, 1.6, (R.z0 + R.z1) / 2]} s={[0.1, 3.2, 6]} m={m.dark} />
			<Floor p={[R.x1 - 1.5, 0.0, (R.z0 + R.z1) / 2]} w={3} d={4.8} m={m.conc} />
			<Bed p={[R.x1 + 1.2, 0, R.z1 + 1.1]} ry={Math.PI / 2} />
			<Bed p={[R.x1 + 1.2, 0, R.z0 - 1.0]} ry={Math.PI / 2} />
			<Bed p={[R.x0 - 1.0, 0, R.z1 + 1.1]} ry={Math.PI / 2} />
		</group>
	);
};

/** The sun porch: bays open to the night on the right, pillars, the trees outside. */
export const Porch: React.FC = () => {
	const m = useM();
	const trees = useMemo(() => {
		const r = rng(41);
		return Array.from({length: 26}, () => ({x: 6 + r() * 20, z: 6 - r() * 50, h: 6 + r() * 6, s: 1.5 + r() * 2}));
	}, []);
	return (
		<group position={PORCH}>
			<mesh material={m.sky}>
				<sphereGeometry args={[120, 10, 8]} />
			</mesh>
			<Floor p={[0, 0, -14]} w={4} d={40} m={m.conc} />
			<Box p={[0, 3.2, -14]} s={[4, 0.1, 40]} m={m.ceil} />
			<Box p={[-2.05, 1.6, -14]} s={[0.1, 3.2, 40]} m={m.paint} />
			{Array.from({length: 14}, (_, i) => (
				<group key={i}>
					<Box p={[2.0, 1.6, 4 - i * 3]} s={[0.4, 3.2, 0.4]} m={m.brick} />
					<Box p={[2.0, 0.45, 4 - i * 3 - 1.5]} s={[0.3, 0.9, 2.6]} m={m.brick} />
				</group>
			))}
			<Box p={[2.0, 3.0, -14]} s={[0.4, 0.4, 40]} m={m.brick} />
			{/* the ground two floors below, and the trees, pale in infrared */}
			<Floor p={[16, -7, -14]} w={28} d={70} m={m.grass} />
			{trees.map((t, i) => (
				<group key={i} position={[t.x, -7, t.z]}>
					<Box p={[0, t.h * 0.3, 0]} s={[0.3, t.h * 0.6, 0.3]} m={m.trunk} />
					<mesh position={[0, t.h * 0.7, 0]} material={m.leaves}>
						<icosahedronGeometry args={[t.s, 0]} />
					</mesh>
				</group>
			))}
		</group>
	);
};

/** The tunnel down the hill: steps on the left, the cart rail on the right, a vault with vents. */
export const Tunnel: React.FC = () => {
	const m = useM();
	const len = 44;
	const th = Math.atan(TUN_SLOPE);
	return (
		<group position={TUN}>
			{/* the walls and vault, in a frame tilted down the slope */}
			<group rotation={[-th, 0, 0]}>
				{[-1, 1].map((sd) => (
					<Box key={sd} p={[sd * 1.3, 0.9, -len / 2 + 2]} s={[0.12, 1.8, len]} m={m.paint} />
				))}
				<Vault p={[0, 1.8, -len / 2 + 2]} r={1.3} len={len} m={m.vault} />
				{[-6, -16, -26, -36].map((z) => (
					<Box key={z} p={[0, 3.05, z]} s={[0.5, 0.05, 0.5]} m={m.vent} />
				))}
				{/* the ramp on the right with the cart rail */}
				<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.62, 0.0, -len / 2 + 2]} material={m.conc}>
					<planeGeometry args={[1.2, len, 3, seg(len)]} />
				</mesh>
				{[0.35, 0.9].map((x) => (
					<Box key={x} p={[x, 0.04, -len / 2 + 2]} s={[0.06, 0.06, len]} m={m.rail} />
				))}
				<Box p={[0.0, 0.9, -len / 2 + 2]} s={[0.05, 0.05, len]} m={m.rail} />
			</group>
			{/* the steps on the left, level in the world */}
			{Array.from({length: 120}, (_, i) => {
				const z = 1.5 - i * 0.36;
				const y = -TUN_SLOPE * (1.5 - z) - 0.06;
				return <Box key={i} p={[-0.62, y, z]} s={[1.2, 0.12, 0.36]} m={m.step} />;
			})}
			{/* the top: the end wall behind us */}
			<Box p={[0, 1.6, 2.2]} s={[2.8, 3.4, 0.2]} m={m.paint} />
		</group>
	);
};

/** The building on its hill: a long five-storey block with wings, its rows of porch openings. */
export const Building: React.FC<{irWin: number}> = ({irWin}) => {
	const m = useM();
	const trees = useMemo(() => {
		const r = rng(53);
		return Array.from({length: 60}, () => {
			const a = r() * Math.PI * 2, d = 60 + r() * 120;
			return {x: Math.cos(a) * d, z: Math.sin(a) * d * 0.7 + 30, h: 8 + r() * 8, s: 3 + r() * 3};
		}).filter((t) => t.z > -20 && t.z < 95);
	}, []);
	const W = 120, H = 22;
	return (
		<group position={EXT}>
			<mesh material={m.sky}>
				<sphereGeometry args={[900, 10, 8]} />
			</mesh>
			<Floor p={[0, -0.1, 40]} w={500} d={400} m={m.grass} />
			{/* the hill it stands on */}
			<mesh position={[0, -8, -10]} scale={[1, 0.12, 0.7]} material={m.grass}>
				<sphereGeometry args={[190, 16, 8]} />
			</mesh>
			<group position={[0, 14, 0]}>
			{/* the main block and two wings */}
			<Box p={[0, H / 2, 0]} s={[W, H, 14]} m={m.brick} />
			<Box p={[0, H + 2.5, 0]} s={[W + 2, 5, 15]} m={m.roof} />
			{[-1, 1].map((sd) => (
				<Box key={sd} p={[sd * (W / 2 - 8), H / 2, -16]} s={[16, H, 26]} m={m.brick} />
			))}
			{/* the windows: five floors of porch openings */}
			{Array.from({length: 5}, (_, f) =>
				Array.from({length: 24}, (_, i) => {
					const lit = f === 2 && i === Math.floor(irWin);
					return <Box key={`${f}-${i}`} p={[-W / 2 + 4 + i * 4.8, 2.5 + f * 4.1, 7.05]} s={[3.2, 2.6, 0.1]} m={lit ? m.winIR : m.winD} />;
				}),
			)}
			</group>
			{trees.map((t, i) => (
				<group key={i} position={[t.x, Math.max(0, 14 - Math.hypot(t.x, t.z + 10) * 0.07), t.z]}>
					<Box p={[0, t.h * 0.3, 0]} s={[0.6, t.h * 0.6, 0.6]} m={m.trunk} />
					<mesh position={[0, t.h * 0.75, 0]} material={m.leaves}>
						<icosahedronGeometry args={[t.s, 0]} />
					</mesh>
				</group>
			))}
		</group>
	);
};

/** The ball: a child's rubber ball with a band; rot is how far it has rolled (radians). */
export const BALL_R = 0.1;
export const Ball: React.FC<{p: V3; dir: number; rot: number}> = ({p, dir, rot}) => {
	const m = useM();
	return (
		<group position={[p[0], p[1] + BALL_R, p[2]]} rotation={[0, dir, 0]}>
			<group rotation={[-rot, 0, 0]}>
				<mesh material={m.ball}>
					<icosahedronGeometry args={[BALL_R, 1]} />
				</mesh>
				<mesh material={m.band} rotation={[0, 0, Math.PI / 2]}>
					<torusGeometry args={[BALL_R * 0.98, BALL_R * 0.12, 4, 12]} />
				</mesh>
			</group>
		</group>
	);
};

/** The investigator's boot (seen when the camera looks down); kick 0..1 swings the toe forward. */
export const Boot: React.FC<{p: V3; ry: number; kick: number}> = ({p, ry, kick}) => {
	const m = useM();
	return (
		<group position={p} rotation={[0, ry, 0]}>
			<group position={[0, 0, 0.1 - kick * 0.18]} rotation={[-kick * 0.25, 0, 0]}>
				<Box p={[0, 0.06, -0.1]} s={[0.12, 0.12, 0.3]} m={m.boot} />
				<Box p={[0, 0.02, -0.24]} s={[0.12, 0.05, 0.06]} m={m.bootL} />
				<Box p={[0, 0.2, 0.0]} s={[0.12, 0.2, 0.12]} m={m.boot} />
			</group>
		</group>
	);
};

/** Two points of eyeshine at a child's height; open 0..1 (a blink closes them). */
export const Eyes: React.FC<{p: V3; ry: number; open: number}> = ({p, ry, open}) => {
	const m = useM();
	if (open <= 0.02) return null;
	return (
		<group position={p} rotation={[0, ry, 0]}>
			{[-0.035, 0.035].map((x) => (
				<group key={x} position={[x, 0, 0]} scale={[1, open, 1]}>
					<mesh material={m.eye}>
						<planeGeometry args={[0.04, 0.028]} />
					</mesh>
					<mesh material={m.glow} position={[0, 0, -0.001]}>
						<planeGeometry args={[0.12, 0.09]} />
					</mesh>
				</group>
			))}
		</group>
	);
};
