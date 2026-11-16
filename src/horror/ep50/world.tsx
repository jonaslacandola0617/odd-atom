// Episode 50 world: "Si Lola sa Panaginip" (Season 5 finale; a family's experience shared online and retold).
// A composite Filipino house (no real family, street or barangay):
// - MY ROOM: x −2..2, z −2.5..2.5, 2.6 m high. My bed along the left wall, head at z −1.6, foot at z 0.4
//   (mattress top 0.5); the door in the front wall (z 2.5) at x 0.9..1.7; a window in the right wall.
// - THE SALA: x −2.5..2.5, z −3..0 (its own set). The front door in the far wall (z −3) at x 0.35..1.25,
//   hinged on its left; the altar shelf with Lola's photo and a candle; the old couch.
// - THE STREET (from the window, the morning after the storm): houses across, brown water chest-deep.
import React, {createContext, useContext, useMemo} from 'react';
import * as THREE from 'three';
import {ps1} from '../ps1';
import {SNAP6} from '../ep01/world';
import {PsxProp} from '../psx/models';
import {Box, tex} from '../ep41/world';

export type V3 = [number, number, number];
const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 64, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 64, SNAP6);

export const BED = {x: -0.95, head: -1.6, foot: 0.4, top: 0.5, w: 1.0};

const useMatsInner = () =>
	useMemo(() => {
		const plank = tex(16, 16, (g) => {
			g.fillStyle = '#6a4e36';
			g.fillRect(0, 0, 16, 16);
			for (let x = 0; x < 16; x += 4) {
				g.fillStyle = '#4e3826';
				g.fillRect(x, 0, 1, 16);
			}
		}, [6, 2]);
		const paint = tex(16, 16, (g) => {
			g.fillStyle = '#b8b09a';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 14; i++) {
				g.fillStyle = i % 3 ? 'rgba(70,60,40,0.18)' : 'rgba(255,255,255,0.06)';
				g.fillRect((i * 7) % 16, (i * 11) % 16, 2, 1);
			}
		}, [3, 2]);
		const sheet = tex(16, 16, (g) => {
			g.fillStyle = '#8a9ab0';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#6a7a94';
			for (let i = 0; i < 16; i += 4) g.fillRect(i, 0, 2, 16);
		}, [2, 3]);
		const photo = tex(16, 20, (g) => {
			g.fillStyle = '#d8ccb0';
			g.fillRect(0, 0, 16, 20);
			g.fillStyle = '#4a4036';
			g.fillRect(2, 2, 12, 16);
			g.fillStyle = '#b8a890';
			g.fillRect(5, 5, 6, 7); // her face
			g.fillStyle = '#d8d4cc';
			g.fillRect(4, 3, 8, 3); // grey hair
			g.fillStyle = '#2a2420';
			g.fillRect(6, 7, 1, 1);
			g.fillRect(9, 7, 1, 1);
			g.fillRect(7, 10, 2, 1);
			g.fillStyle = '#6a5a7a';
			g.fillRect(3, 13, 10, 5);
		});
		const houses = tex(16, 16, (g) => {
			g.fillStyle = '#8a8270';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#3a3a3a';
			g.fillRect(3, 4, 3, 4);
			g.fillRect(10, 4, 3, 4);
			g.fillStyle = '#6a3a2a';
			g.fillRect(0, 0, 16, 2);
		}, [4, 1]);
		const rain = tex(8, 32, (g) => {
			g.clearRect(0, 0, 8, 32);
			g.fillStyle = 'rgba(200,220,255,0.5)';
			for (let i = 0; i < 6; i++) g.fillRect((i * 5) % 8, (i * 11) % 32, 1, 5);
		}, [6, 2]);
		return {
			floor: lam('#ffffff', {map: plank}),
			wall: lam('#ffffff', {map: paint}),
			ceil: lam('#8a8476'),
			wood: lam('#5a4030'),
			sheet: lam('#ffffff', {map: sheet}),
			pillow: lam('#c8c4b8'),
			dent: bas('#000000', {transparent: true, opacity: 0.35, depthWrite: false}),
			photo: lam('#ffffff', {map: photo}),
			frame: lam('#2a2018'),
			candle: lam('#e8e0c8'),
			flame: bas('#ffcc66'),
			door: lam('#5a3e2a'),
			knob: lam('#b09040'),
			night: bas('#34445e'),
			rain: bas('#ffffff', {map: rain, transparent: true, depthWrite: false}),
			glass: bas('#9ab0c0', {transparent: true, opacity: 0.18, depthWrite: false}),
			houses: lam('#ffffff', {map: houses}),
			water: lam('#8a7a56'),
			strip: bas('#7a90b8'),
			sky: bas('#a8aca8'),
			bead: lam('#3a2a1e'),
			cross: lam('#c8b070'),
			bulb: bas('#ffe8b0'),
		};
	}, []);
type Mats = ReturnType<typeof useMatsInner>;
const Ctx = createContext<Mats | null>(null);
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMatsInner()}>{children}</Ctx.Provider>;
export const useM = () => useContext(Ctx)!;

/** my room. dent: 0..1, the hollow at the foot of the mattress */
export const Room: React.FC<{dent?: number; t: number}> = ({dent = 0, t}) => {
	const M = useM();
	return (
		<group>
			<Box p={[0, -0.02, 0]} s={[4, 0.04, 5]} m={M.floor} />
			<Box p={[0, 2.6, 0]} s={[4, 0.04, 5]} m={M.ceil} />
			<Box p={[-2.02, 1.3, 0]} s={[0.04, 2.6, 5]} m={M.wall} />
			{/* the right wall, with the window opening (z −0.6..0.6, y 0.9..1.9) */}
			<Box p={[2.02, 0.45, 0]} s={[0.04, 0.9, 5]} m={M.wall} />
			<Box p={[2.02, 2.25, 0]} s={[0.04, 0.7, 5]} m={M.wall} />
			<Box p={[2.02, 1.4, -1.55]} s={[0.04, 1.0, 1.9]} m={M.wall} />
			<Box p={[2.02, 1.4, 1.55]} s={[0.04, 1.0, 1.9]} m={M.wall} />
			<mesh position={[2.03, 1.4, 0]} rotation={[0, -Math.PI / 2, 0]} material={M.glass}>
				<planeGeometry args={[1.2, 1.0]} />
			</mesh>
			<Box p={[0, 1.3, -2.52]} s={[4, 2.6, 0.04]} m={M.wall} />
			{/* the front wall with my door (x 0.9..1.7) */}
			<Box p={[-0.55, 1.3, 2.52]} s={[2.9, 2.6, 0.04]} m={M.wall} />
			<Box p={[1.85, 1.3, 2.52]} s={[0.3, 2.6, 0.04]} m={M.wall} />
			<Box p={[1.3, 2.35, 2.52]} s={[0.8, 0.5, 0.04]} m={M.wall} />
			<Box p={[1.3, 1.05, 2.6]} s={[0.8, 2.1, 0.04]} m={M.night} />
			{/* the bed: frame, mattress, sheet, pillow at the head (kept low, off my face) */}
			<Box p={[BED.x, 0.2, (BED.head + BED.foot) / 2]} s={[BED.w + 0.06, 0.4, BED.foot - BED.head + 0.06]} m={M.wood} />
			<Box p={[BED.x, 0.45, (BED.head + BED.foot) / 2]} s={[BED.w, 0.1, BED.foot - BED.head]} m={M.sheet} />
			<Box p={[BED.x, 0.6, BED.head - 0.08]} s={[BED.w + 0.06, 0.4, 0.06]} m={M.wood} />
			<Box p={[BED.x + 0.15, 0.53, BED.head + 0.2]} s={[0.45, 0.06, 0.28]} m={M.pillow} />
			{dent > 0.01 && (
				<mesh position={[BED.x, 0.502, BED.foot - 0.28]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.7, 1]} material={M.dent}>
					<circleGeometry args={[0.24 * dent, 12]} />
				</mesh>
			)}
			{/* a small table and a lamp by the bed */}
			<Box p={[-1.7, 0.3, -2.1]} s={[0.4, 0.6, 0.4]} m={M.wood} />
			<group position={[1.6, 0, -2.15]} rotation={[0, Math.PI, 0]}>
				<PsxProp path="assets/models/psx/props/derelict-shelf.glb" s={0.9} />
			</group>
		</group>
	);
};

/** the sala. open: the front door's swing (0 shut .. 1 open); knob: its turn (radians) */
export const Sala: React.FC<{open: number; knob: number; t: number; feet?: boolean}> = ({open, knob, t, feet}) => {
	const M = useM();
	const flame = 0.8 + 0.2 * Math.sin(t * 13) * Math.sin(t * 7.3);
	return (
		<group>
			<Box p={[0, -0.02, -1.5]} s={[5, 0.04, 3]} m={M.floor} />
			<Box p={[0, 2.6, -1.5]} s={[5, 0.04, 3]} m={M.ceil} />
			<Box p={[-2.52, 1.3, -1.5]} s={[0.04, 2.6, 3]} m={M.wall} />
			<Box p={[2.52, 1.3, -1.5]} s={[0.04, 2.6, 3]} m={M.wall} />
			{/* the far wall with the front door opening (x 0.35..1.25, up to 2.1) */}
			<Box p={[-1.08, 1.3, -3.02]} s={[2.86, 2.6, 0.04]} m={M.wall} />
			<Box p={[1.88, 1.3, -3.02]} s={[1.26, 2.6, 0.04]} m={M.wall} />
			<Box p={[0.8, 2.35, -3.02]} s={[0.9, 0.5, 0.04]} m={M.wall} />
			{/* outside the door: the night and the rain */}
			<Box p={[0.8, 1.05, -3.6]} s={[2.2, 2.4, 0.05]} m={M.night} />
			<mesh position={[0.8, 1.05 - ((t * 3) % 1) * 0.3, -3.3]} material={M.rain}>
				<planeGeometry args={[1.6, 2.4]} />
			</mesh>
			{/* the light under the door, broken by two feet while someone stands there */}
			{open < 0.05 && <Box p={[0.8, 0.006, -2.93]} s={[0.86, 0.008, 0.09]} m={M.strip} />}
			{open < 0.05 && feet && [0.62, 0.92].map((x) => <Box key={x} p={[x, 0.009, -2.93]} s={[0.12, 0.01, 0.095]} m={M.frame} />)}
			{/* the door, hinged at x 0.35, swinging in */}
			<group position={[0.35, 0, -3.0]} rotation={[0, -open * 1.4, 0]}>
				<Box p={[0.45, 1.05, 0]} s={[0.9, 2.1, 0.05]} m={M.door} />
				<group position={[0.8, 1.0, 0.05]} rotation={[0, 0, knob]}>
					<Box p={[0, 0, 0]} s={[0.03, 0.09, 0.03]} m={M.knob} />
				</group>
			</group>
			{/* the altar shelf on the left wall: Lola's photo, a candle, a rosary hook */}
			<Box p={[-2.35, 1.2, -1.6]} s={[0.3, 0.04, 0.8]} m={M.wood} />
			<mesh position={[-2.33, 1.42, -1.75]} rotation={[0, Math.PI / 2 - 0.15, 0]} material={M.photo}>
				<planeGeometry args={[0.28, 0.35]} />
			</mesh>
			<Box p={[-2.35, 1.29, -1.38]} s={[0.04, 0.14, 0.04]} m={M.candle} />
			<Box p={[-2.35, 1.38, -1.38]} s={[0.02, 0.04, 0.02]} m={M.flame} />
			<pointLight position={[-2.2, 1.45, -1.4]} intensity={1.3 * flame} distance={3.5} decay={1} color="#ffb060" />
			{/* the couch */}
			<group position={[-0.6, 0, -2.5]} rotation={[0, 0, 0]}>
				<PsxProp path="assets/models/psx/props/derelict-couch.glb" s={1} />
			</group>
		</group>
	);
};

/** the street from my window, the morning after: houses across and brown water chest-deep */
export const Flood: React.FC<{t: number}> = ({t}) => {
	const M = useM();
	return (
		<group>
			<mesh position={[0, 6, 12]} material={M.sky}>
				<planeGeometry args={[40, 14]} />
			</mesh>
			{[-6, -2, 2, 6].map((x, i) => (
				<Box key={x} p={[x, 2.2, 8 + (i % 2) * 0.6]} s={[3.6, 4.4, 2]} m={M.houses} />
			))}
			<mesh position={[0, 1.1 + 0.02 * Math.sin(t * 1.3), 4]} rotation={[-Math.PI / 2, 0, 0]} material={M.water}>
				<planeGeometry args={[30, 12, 12, 6]} />
			</mesh>
			{/* things floating */}
			{[[-2.5, 3.2], [1.2, 5.1], [3.4, 2.6]].map(([x, z], i) => (
				<Box key={i} p={[x + 0.15 * Math.sin(t * 0.7 + i), 1.13, z]} s={[0.3, 0.06, 0.2]} m={[M.wood, M.pillow, M.door][i]} />
			))}
		</group>
	);
};

/** a rosary hanging from a hand at `p`: a loop of beads and the cross */
export const Rosary: React.FC<{p: V3; swing: number}> = ({p, swing}) => {
	const M = useM();
	return (
		<group position={p} rotation={[swing * 0.15, 0, swing * 0.1]}>
			{Array.from({length: 14}, (_, i) => {
				const a = (i / 14) * Math.PI * 2;
				return <Box key={i} p={[Math.sin(a) * 0.045, -0.06 - 0.06 * (1 - Math.cos(a)), 0]} s={[0.014, 0.014, 0.014]} m={M.bead} />;
			})}
			<Box p={[0, -0.21, 0]} s={[0.012, 0.05, 0.008]} m={M.cross} />
			<Box p={[0, -0.2, 0]} s={[0.034, 0.012, 0.008]} m={M.cross} />
		</group>
	);
};
