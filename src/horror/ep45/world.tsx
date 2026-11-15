// Episode 45 world: "Ang Humahaplos" (Season 5, a student's experience shared online, retold).
// A composite old campus building at night (no real school):
// - THE CR: x −1.5..1.5, z −4..1, 2.7 m high. Two sinks under one long mirror on the left wall
//   (x = −1.5); four cubicles on the right (x 0.5..1.5) with partitions at z −3.8, −2.9, −2.0, −1.1,
//   −0.2 and doors at x = 0.5, each hinged on its far (−z) edge so it swings out toward −x; the
//   entrance is a gap in the front wall (z = 1) at x −1.1..−0.3. One fluorescent tube that flickers.
// - THE CORRIDOR: beyond the entrance, +z, 1.4 m wide (x −1.4..0), classroom doors dark, one lamp.
// The mirror is never a real reflection: mirror shots are a camera at my eye's mirror image (x < −1.5)
// with the left wall hidden, shown flipped; so the mirror can disagree with the room.
import React, {createContext, useContext, useMemo} from 'react';
import * as THREE from 'three';
import {ps1} from '../ps1';
import {SNAP6} from '../ep01/world';
import {Box, tex} from '../ep41/world';

export type V3 = [number, number, number];
const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 64, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 64, SNAP6);

export const CR = {x0: -1.5, x1: 1.5, z0: -4, z1: 1, h: 2.7, stallX: 0.5, door: [-1.1, -0.3] as [number, number]};
export const PARTS = [-3.8, -2.9, -2.0, -1.1, -0.2];
export const SINKS = [-2.3, -1.4];
export const MIRROR = {z0: -3.0, z1: -0.9, y0: 1.15, y1: 2.05};

const tiles = (base: string, line: string, n: number) =>
	tex(16, 16, (g) => {
		g.fillStyle = base;
		g.fillRect(0, 0, 16, 16);
		g.fillStyle = line;
		g.fillRect(0, 0, 16, 1);
		g.fillRect(0, 0, 1, 16);
		g.fillRect(0, 8, 16, 1);
		g.fillRect(8, 0, 1, 16);
		// grime in the grout
		for (let i = 0; i < 9; i++) {
			g.fillStyle = 'rgba(60,50,30,0.25)';
			g.fillRect((i * 7) % 16, (i * 5 + 3) % 16, 1 + (i % 2), 1);
		}
	}, [n, n]);

const useMatsInner = () =>
	useMemo(() => {
		const sign = tex(32, 16, (g) => {
			g.fillStyle = '#d8d4c4';
			g.fillRect(0, 0, 32, 16);
			g.fillStyle = '#1a2a4a';
			g.font = 'bold 11px "DejaVu Sans", sans-serif';
			g.textAlign = 'center';
			g.fillText('CR', 16, 12);
		});
		return {
			wall: lam('#ffffff', {map: tiles('#a8b8a8', '#7e8c7e', 6)}),
			wallHi: lam('#8c8a7c'),
			floor: lam('#ffffff', {map: tiles('#8a8a84', '#5e5e58', 5)}),
			ceil: lam('#6e6c64'),
			part: lam('#4e6a5c'),
			door: lam('#5a7666'),
			metal: lam('#9a9a96'),
			porcelain: lam('#d6d8d2'),
			dark: lam('#141414'),
			mirror: lam('#2a3034'),
			tubeOn: bas('#eef6ff'),
			tubeOff: lam('#6a6c6a'),
			sign: bas('#ffffff', {map: sign}),
			hall: lam('#6e6a5e'),
			hallFloor: lam('#ffffff', {map: tiles('#5a5650', '#3e3a36', 8)}),
			classDoor: lam('#3a2c22'),
			glass: bas('#0c1018'),
		};
	}, []);
type Mats = ReturnType<typeof useMatsInner>;
const Ctx = createContext<Mats | null>(null);
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMatsInner()}>{children}</Ctx.Provider>;
export const useM = () => useContext(Ctx)!;

/** the tube: patay-sindi. Irregular, deterministic in t (safe for negative time): mostly on, with
 *  short drop-outs and a buzzing stutter. Returns 0..1. */
export const tube = (t: number) => {
	const k = Math.floor(t * 12);
	const h = (n: number) => {
		const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
		return x - Math.floor(x);
	};
	// a 2.6 s cycle with a stutter near its end
	const c = ((t % 2.6) + 2.6) % 2.6;
	if (c > 2.1 && c < 2.45) return h(k) > 0.5 ? 1 : 0.15;
	if (h(k * 3 + 7) > 0.96) return 0.2;
	return 1;
};

/** one toilet (boxes), facing −x */
const Toilet: React.FC<{z: number}> = ({z}) => {
	const M = useM();
	return (
		<group position={[1.2, 0, z]}>
			<Box p={[0, 0.2, 0]} s={[0.3, 0.4, 0.26]} m={M.porcelain} />
			<Box p={[-0.04, 0.41, 0]} s={[0.4, 0.04, 0.36]} m={M.porcelain} />
			<Box p={[0.2, 0.62, 0]} s={[0.12, 0.4, 0.42]} m={M.porcelain} />
		</group>
	);
};

/** a stall door at x = 0.5 between partitions za < zb, hinged at za; open 0 shut, 1 wide (toward −x) */
const StallDoor: React.FC<{za: number; zb: number; open: number}> = ({za, zb, open}) => {
	const M = useM();
	const w = zb - za - 0.06;
	return (
		<group position={[CR.stallX, 0, za + 0.03]} rotation={[0, -1.45 * open, 0]}>
			<Box p={[0, 1.05, w / 2]} s={[0.035, 1.75, w]} m={M.door} />
			<Box p={[-0.03, 1.05, w - 0.08]} s={[0.03, 0.06, 0.04]} m={M.metal} />
		</group>
	);
};

/** the CR. open: the last cubicle's door (0..1). mirrorShot: hide the mirror wall (the camera is
 *  behind it). light: the tube's level now. */
export const Restroom: React.FC<{open?: number; mirrorShot?: boolean; light: number}> = ({open = 0, mirrorShot, light}) => {
	const M = useM();
	const {x0, x1, z0, z1, h, stallX, door} = CR;
	const W = x1 - x0;
	return (
		<group>
			<Box p={[0, -0.05, (z0 + z1) / 2]} s={[W, 0.1, z1 - z0]} m={M.floor} />
			<Box p={[0, h + 0.05, (z0 + z1) / 2]} s={[W, 0.1, z1 - z0]} m={M.ceil} />
			<Box p={[x1 + 0.05, h / 2, (z0 + z1) / 2]} s={[0.1, h, z1 - z0]} m={M.wall} />
			<Box p={[0, h / 2, z0 - 0.05]} s={[W, h, 0.1]} m={M.wall} />
			{/* the front wall with the entrance gap; a lintel over it */}
			<Box p={[(x0 + door[0]) / 2, h / 2, z1 + 0.05]} s={[door[0] - x0, h, 0.1]} m={M.wall} />
			<Box p={[(door[1] + x1) / 2, h / 2, z1 + 0.05]} s={[x1 - door[1], h, 0.1]} m={M.wall} />
			<Box p={[(door[0] + door[1]) / 2, 2.35, z1 + 0.05]} s={[door[1] - door[0], 0.7, 0.1]} m={M.wall} />
			{!mirrorShot && (
				<>
					<Box p={[x0 - 0.05, h / 2, (z0 + z1) / 2]} s={[0.1, h, z1 - z0]} m={M.wall} />
					<Box p={[x0 + 0.01, (MIRROR.y0 + MIRROR.y1) / 2, (MIRROR.z0 + MIRROR.z1) / 2]} s={[0.02, MIRROR.y1 - MIRROR.y0, MIRROR.z1 - MIRROR.z0]} m={M.mirror} />
				</>
			)}
			{/* the sinks: a counter slab, two basins, two taps */}
			<Box p={[x0 + 0.27, 0.82, (MIRROR.z0 + MIRROR.z1) / 2]} s={[0.54, 0.08, MIRROR.z1 - MIRROR.z0]} m={M.porcelain} />
			<Box p={[x0 + 0.27, 0.4, (MIRROR.z0 + MIRROR.z1) / 2]} s={[0.5, 0.78, 0.04]} m={M.part} />
			{SINKS.map((z) => (
				<group key={z}>
					<Box p={[x0 + 0.3, 0.84, z]} s={[0.34, 0.04, 0.4]} m={M.dark} />
					<Box p={[x0 + 0.08, 0.98, z]} s={[0.05, 0.2, 0.05]} m={M.metal} />
					<Box p={[x0 + 0.15, 1.06, z]} s={[0.14, 0.03, 0.03]} m={M.metal} />
				</group>
			))}
			{/* the cubicles */}
			{PARTS.map((z) => (
				<Box key={z} p={[(stallX + x1) / 2, 1.05, z]} s={[x1 - stallX, 1.8, 0.04]} m={M.part} />
			))}
			<Box p={[stallX, 2.0, (PARTS[0] + PARTS[4]) / 2]} s={[0.05, 0.06, PARTS[4] - PARTS[0]]} m={M.metal} />
			{PARTS.slice(0, 4).map((za, i) => (
				<group key={za}>
					<StallDoor za={za} zb={PARTS[i + 1]} open={i === 0 ? open : 0} />
					<Toilet z={(za + PARTS[i + 1]) / 2} />
				</group>
			))}
			{/* the tube, over the middle of the room */}
			<mesh position={[-0.2, h - 0.03, -1.6]} material={light > 0.5 ? M.tubeOn : M.tubeOff}>
				<boxGeometry args={[0.08, 0.05, 1.3]} />
			</mesh>
			<pointLight position={[-0.2, h - 0.25, -1.6]} intensity={2.4 * light} distance={6} decay={1} color="#e4f0f0" />
			{/* a weak spill inside the last cubicle, so what is there can be seen */}
			<pointLight position={[1.0, 2.3, -3.35]} intensity={0.55 * light} distance={2.2} decay={1} color="#cfe0e0" />
		</group>
	);
};

/** the corridor outside, running +z from the entrance (z = 1) to z = 16 */
export const Corridor: React.FC<{lamp: number}> = ({lamp}) => {
	const M = useM();
	const xl = -1.45, xr = 0.05, z0 = 1.1, z1 = 16;
	const L = z1 - z0, zc = (z0 + z1) / 2, h = 2.9;
	return (
		<group>
			<Box p={[(xl + xr) / 2, -0.05, zc]} s={[xr - xl, 0.1, L]} m={M.hallFloor} />
			<Box p={[(xl + xr) / 2, h, zc]} s={[xr - xl, 0.1, L]} m={M.ceil} />
			<Box p={[xl - 0.05, h / 2, zc]} s={[0.1, h, L]} m={M.hall} />
			<Box p={[xr + 0.05, h / 2, zc]} s={[0.1, h, L]} m={M.hall} />
			<Box p={[(xl + xr) / 2, h / 2, z1 + 0.05]} s={[xr - xl, h, 0.1]} m={M.hall} />
			{[4, 8, 12].map((z) => (
				<group key={z}>
					<Box p={[xl + 0.02, 1.05, z]} s={[0.04, 2.1, 0.9]} m={M.classDoor} />
					<Box p={[xl + 0.045, 1.55, z + 0.2]} s={[0.01, 0.4, 0.25]} m={M.glass} />
					<Box p={[xr - 0.02, 1.05, z + 1.8]} s={[0.04, 2.1, 0.9]} m={M.classDoor} />
				</group>
			))}
			{/* the CR sign over its door */}
			<mesh position={[-0.7, 2.55, 1.16]} material={M.sign}>
				<planeGeometry args={[0.36, 0.18]} />
			</mesh>
			<pointLight position={[-0.7, 2.6, 6]} intensity={0.9 * lamp} distance={7} decay={1} color="#d8c8a0" />
			<mesh position={[-0.7, h - 0.04, 6]} material={lamp > 0.5 ? M.tubeOn : M.tubeOff}>
				<boxGeometry args={[0.07, 0.04, 1.0]} />
			</mesh>
		</group>
	);
};
