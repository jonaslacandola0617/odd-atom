// Episode 46 world: "Huling Biyahe Pahilaga" (Season 5, a night-bus experience shared online, retold).
// A composite provincial bus (no real line, no logo) and a composite mountain road (no real place):
// - THE CABIN: x −1.25..1.25, z −5 (windshield) .. 5 (rear), floor 0, roof 2.1. 2+2 seats in rows
//   every 0.8 m (ROWS), seat places at SEATX; the aisle is x −0.28..0.28. Everyone faces −z.
//   Fluorescent strips down the roof, the dash glowing, street lamps sweeping past the windows.
// - THE ROAD: a road along z (the bus drives −z in the right lane, x ≈ 1.6), a cut rock face on the left
//   (x −5), a guardrail on the right (x 4.2) and beyond it the ravine: a drop into fog, far ridges.
//   One street lamp at the curve (z 0), where she stands.
import React, {createContext, useContext, useMemo} from 'react';
import * as THREE from 'three';
import {ps1} from '../ps1';
import {SNAP6} from '../ep01/world';
import {PsxProp} from '../psx/models';
import {Box, tex} from '../ep41/world';

export type V3 = [number, number, number];
const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 64, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 64, SNAP6);

export const BUS = {halfW: 1.25, roof: 2.1, front: -5, rear: 5, aisle: 0.28};
/** seat rows (z of the cushion centre), front to back */
export const ROWS = [-3.2, -2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4, 3.2, 4.0];
export const SEATX = [-0.95, -0.52, 0.52, 0.95];
export const SEAT_TOP = 0.44;
export const ME_ROW = 0.8;
export const HER_ROW = 1.6;

const useMatsInner = () =>
	useMemo(() => {
		const vinyl = tex(8, 8, (g) => {
			g.fillStyle = '#7a4c4e';
			g.fillRect(0, 0, 8, 8);
			g.fillStyle = '#8a5a5c';
			for (let i = 0; i < 8; i += 2) g.fillRect(0, i, 8, 1);
		});
		const cover = tex(16, 8, (g) => {
			// the white headrest cover with a stripe, as on old provincial buses
			g.fillStyle = '#c8c4b4';
			g.fillRect(0, 0, 16, 8);
			g.fillStyle = '#6a2a2a';
			g.fillRect(0, 5, 16, 1);
		});
		const sign = tex(48, 12, (g) => {
			g.fillStyle = '#0a0a0a';
			g.fillRect(0, 0, 48, 12);
			g.fillStyle = '#ff9a2a';
			g.font = 'bold 9px "DejaVu Sans Mono", monospace';
			g.textAlign = 'center';
			g.fillText('LAST TRIP', 24, 9);
		});
		const rock = tex(16, 16, (g) => {
			g.fillStyle = '#3c3a34';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 30; i++) {
				g.fillStyle = i % 2 ? '#4a4840' : '#2c2a26';
				g.fillRect((i * 7) % 16, (i * 5) % 16, 2, 1);
			}
		}, [8, 2]);
		const asphalt = tex(16, 16, (g) => {
			g.fillStyle = '#2a2a2c';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 24; i++) {
				g.fillStyle = i % 2 ? '#323234' : '#222224';
				g.fillRect((i * 5) % 16, (i * 7) % 16, 1, 1);
			}
		}, [2, 30]);
		return {
			floor: lam('#3a3632'),
			wall: lam('#8a8c84'),
			roof: lam('#a4a69c'),
			seat: lam('#ffffff', {map: vinyl}),
			cover: lam('#b8b4a8', {map: cover}),
			metal: lam('#8a8a86'),
			dark: lam('#141414'),
			dash: lam('#1e1e20'),
			glass: bas('#06080c'),
			stripOn: bas('#e2f4ec'),
			stripOff: lam('#5a5c58'),
			gauge: bas('#5affa0'),
			sign: bas('#ffffff', {map: sign}),
			body: lam('#b8b2a2'),
			bodyStripe: lam('#7a2a26'),
			winLit: bas('#3c5a4c'),
			headl: bas('#fff4d0'),
			taill: bas('#ff2a1a'),
			rock: lam('#ffffff', {map: rock}),
			road: lam('#ffffff', {map: asphalt}),
			line: bas('#c8b878'),
			rail: lam('#9a9a94'),
			post: lam('#5a5650'),
			fog: bas('#1a2028', {transparent: true, opacity: 0.85}),
			ridge: bas('#0c1016'),
			wet: lam('#120c0c'),
			drop: bas('#a8c0c8'),
		};
	}, []);
type Mats = ReturnType<typeof useMatsInner>;
const Ctx = createContext<Mats | null>(null);
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMatsInner()}>{children}</Ctx.Provider>;
export const useM = () => useContext(Ctx)!;

/** one seat (cushion, backrest, headrest cover) for the place at x in the row at z. dent: the
 *  headrest of the empty seat behind me, pressed in and wet (0..1). */
const Seat: React.FC<{x: number; z: number; dent?: number}> = ({x, z, dent = 0}) => {
	const M = useM();
	return (
		<group position={[x, 0, z]}>
			<Box p={[0, SEAT_TOP - 0.06, 0]} s={[0.42, 0.12, 0.44]} m={M.seat} />
			<Box p={[0, 0.2, 0]} s={[0.36, 0.38, 0.36]} m={M.dark} />
			<Box p={[0, 0.82, 0.26]} s={[0.42, 0.72, 0.1]} m={M.seat} />
			<Box p={[0, 1.12, 0.22 + 0.02 * dent]} s={[0.4, 0.16, 0.04]} m={M.cover} />
			{dent > 0 && (
				<>
					{/* the hollow where a head lay back, dark with water */}
					<mesh position={[0, 1.0, 0.2]} rotation={[0, Math.PI, 0]} scale={[1, 1.25, 1]}>
						<circleGeometry args={[0.1 * dent, 10]} />
						<meshBasicMaterial color="#060404" />
					</mesh>
					<mesh position={[0, 0.66, 0.2]} rotation={[0, Math.PI, 0]} scale={[0.6, 2.2, 1]}>
						<circleGeometry args={[0.07 * dent, 8]} />
						<meshBasicMaterial color="#0a0606" />
					</mesh>
				</>
			)}
		</group>
	);
};

/** drips falling from a point, deterministic in t */
export const Drips: React.FC<{p: V3; t: number; rate?: number; fall?: number}> = ({p, t, rate = 2.2, fall = 0.7}) => {
	const M = useM();
	const n = 4;
	return (
		<group position={p}>
			{Array.from({length: n}, (_, i) => {
				const ph = (((t * rate + i / n) % 1) + 1) % 1;
				const y = -fall * ph * ph;
				return (
					<mesh key={i} position={[((i * 37) % 7) * 0.012 - 0.036, y, ((i * 13) % 5) * 0.01 - 0.02]} material={M.drop}>
						<boxGeometry args={[0.012, 0.03, 0.012]} />
					</mesh>
				);
			})}
		</group>
	);
};

/** the cabin. lights: the roof strips' level (0..1; the stop turns them all on). lamp: a street lamp
 *  sweeping past the right windows (its z). dent: the empty seat behind me. hide: seat places
 *  to leave out (a camera inside them). */
export const Cabin: React.FC<{t: number; lights: number; lamp?: number | null; dent?: number}> = ({t, lights, lamp, dent = 0}) => {
	const M = useM();
	const {halfW, roof, front, rear} = BUS;
	const L = rear - front, zc = (front + rear) / 2;
	return (
		<group>
			<Box p={[0, -0.05, zc]} s={[halfW * 2, 0.1, L]} m={M.floor} />
			<Box p={[0, roof + 0.05, zc]} s={[halfW * 2, 0.1, L]} m={M.roof} />
			{[-1, 1].map((sd) => (
				<group key={sd}>
					{/* below and above the windows, and the pillars between */}
					<Box p={[sd * (halfW + 0.05), 0.42, zc]} s={[0.1, 0.84, L]} m={M.wall} />
					<Box p={[sd * (halfW + 0.05), 1.85, zc]} s={[0.1, 0.5, L]} m={M.wall} />
					{ROWS.map((z) => (
						<Box key={z} p={[sd * (halfW + 0.04), 1.22, z + 0.42]} s={[0.08, 0.76, 0.1]} m={M.wall} />
					))}
					<mesh position={[sd * (halfW + 0.1), 1.22, zc]} rotation={[0, -sd * Math.PI / 2, 0]} material={M.glass}>
						<planeGeometry args={[L, 0.76]} />
					</mesh>
				</group>
			))}
			<Box p={[0, roof / 2, rear + 0.05]} s={[halfW * 2, roof, 0.1]} m={M.wall} />
			{/* the front: windshield, dash with its gauges, the wheel; the door well on the right */}
			<mesh position={[0, 1.35, front - 0.05]} material={M.glass}>
				<planeGeometry args={[halfW * 2, 1.1]} />
			</mesh>
			<Box p={[0, 0.5, front - 0.05]} s={[halfW * 2, 1.0, 0.1]} m={M.wall} />
			<Box p={[-0.4, 0.95, front + 0.35]} s={[1.6, 0.18, 0.5]} m={M.dash} />
			{[-0.75, -0.55, -0.35].map((x) => (
				<mesh key={x} position={[x, 1.05, front + 0.6]} rotation={[-0.6, 0, 0]} material={M.gauge}>
					<circleGeometry args={[0.04, 8]} />
				</mesh>
			))}
			<mesh position={[-0.65, 1.05, front + 0.75]} rotation={[-1.0, 0, 0]} material={M.dark}>
				<torusGeometry args={[0.2, 0.025, 4, 12]} />
			</mesh>
			<mesh position={[0, 1.95, front + 0.02]} material={M.sign}>
				<planeGeometry args={[0.8, 0.2]} />
			</mesh>
			{/* seats: everyone's, the driver's, and a grab rail along the aisle at the top */}
			{ROWS.map((z) => SEATX.map((x) => <Seat key={`${x}${z}`} x={x} z={z} dent={x === SEATX[1] && z === HER_ROW ? dent : 0} />))}
			<Seat x={-0.65} z={front + 1.35} />
			{[-0.3, 0.3].map((x) => (
				<Box key={x} p={[x, 1.95, zc]} s={[0.03, 0.03, L]} m={M.metal} />
			))}
			{/* the roof strips: every second one is dead */}
			{[-3.6, -2.0, -0.4, 1.2, 2.8, 4.2].map((z, i) => {
				const on = i % 2 === 0 ? lights : lights > 0.9 ? 1 : 0;
				return (
					<group key={z}>
						<mesh position={[0, roof - 0.01, z]} rotation={[Math.PI / 2, 0, 0]} material={on > 0.5 ? M.stripOn : M.stripOff}>
							<planeGeometry args={[0.16, 0.9]} />
						</mesh>
						{on > 0.05 && <pointLight position={[0, roof - 0.25, z]} intensity={1.1 * on} distance={3.4} decay={1} color="#d8f0e4" />}
					</group>
				);
			})}
			<pointLight position={[-0.5, 1.2, front + 0.9]} intensity={0.6} distance={2} decay={1} color="#6affb0" />
			{lamp != null && <pointLight position={[halfW + 1.5, 2.6, lamp]} intensity={3.0} distance={4.5} decay={1} color="#ffb860" />}
			{void t}
		</group>
	);
};

/** the bus from outside: centre (x, z), driving −z. door: 0..1 (front right). */
export const BusBody: React.FC<{x: number; z: number; door?: number; t: number}> = ({x, z, door = 0, t}) => {
	const M = useM();
	const hw = BUS.halfW + 0.05, L = 11;
	return (
		<group position={[x, 0, z]}>
			<Box p={[0, 1.65, 0]} s={[hw * 2, 2.7, L]} m={M.body} />
			<Box p={[0, 0.75, 0]} s={[hw * 2 + 0.01, 0.12, L + 0.01]} m={M.bodyStripe} />
			{[-1, 1].map((sd) => (
				<mesh key={sd} position={[sd * (hw + 0.006), 1.95, 0.4]} rotation={[0, sd * Math.PI / 2, 0]} material={M.winLit}>
					<planeGeometry args={[L - 2.6, 0.75]} />
				</mesh>
			))}
			<mesh position={[0, 1.8, -L / 2 - 0.006]} rotation={[0, Math.PI, 0]} material={M.glass}>
				<planeGeometry args={[hw * 2 - 0.2, 1.2]} />
			</mesh>
			<mesh position={[0, 2.75, -L / 2 - 0.008]} rotation={[0, Math.PI, 0]} material={M.sign}>
				<planeGeometry args={[1.4, 0.3]} />
			</mesh>
			{[-0.9, 0.9].map((dx) => (
				<group key={dx}>
					<mesh position={[dx, 0.75, -L / 2 - 0.01]} rotation={[0, Math.PI, 0]} material={M.headl}>
						<planeGeometry args={[0.32, 0.16]} />
					</mesh>
					<mesh position={[dx, 0.85, L / 2 + 0.01]} material={M.taill}>
						<planeGeometry args={[0.2, 0.3]} />
					</mesh>
				</group>
			))}
			{/* the front door, folding open on the right */}
			<group position={[hw + 0.01, 0, -L / 2 + 1.0]}>
				<Box p={[0.02, 1.5, -0.3 * (1 - door)]} s={[0.04, 2.3, 0.6 * (1 - 0.8 * door)]} m={M.dark} />
				{door > 0.3 && <pointLight position={[-0.4, 1.8, 0]} intensity={1.6 * door} distance={3} decay={1} color="#d8f0e4" />}
			</group>
			{[[-1.1, -3.6], [1.1, -3.6], [-1.1, 3.4], [1.1, 3.4]].map(([dx, dz]) => (
				<mesh key={`${dx}${dz}`} position={[dx, 0.42, dz]} rotation={[0, 0, Math.PI / 2]} material={M.dark}>
					<cylinderGeometry args={[0.42, 0.42, 0.3, 10]} />
				</mesh>
			))}
			<spotLight position={[0, 0.9, -L / 2 - 0.3]} target-position={[x, 0, z - 30]} angle={0.5} penumbra={0.6} intensity={6} distance={40} decay={1} color="#fff0c8" />
			<pointLight position={[0, 1.2, -L / 2 - 3]} intensity={1.6} distance={9} decay={1} color="#fff0c8" />
			<pointLight position={[0, 1.0, L / 2 + 1]} intensity={0.8} distance={4} decay={1} color="#ff3a20" />
			{void t}
		</group>
	);
};

/** the mountain road: rock face (x −5), road, guardrail (x 4.2), the ravine and its fog, far ridges,
 *  the lamp at the curve (z 0). */
export const Road: React.FC = () => {
	const M = useM();
	return (
		<group>
			<Box p={[0, -0.05, 0]} s={[9, 0.1, 140]} m={M.road} />
			{Array.from({length: 24}, (_, i) => (
				<Box key={i} p={[0, 0.005, -66 + i * 6]} s={[0.12, 0.01, 2.6]} m={M.line} />
			))}
			<Box p={[-5.5, 4, 0]} s={[1, 8, 140]} m={M.rock} />
			{Array.from({length: 36}, (_, i) => (
				<Box key={i} p={[4.3, 0.4, -70 + i * 4]} s={[0.1, 0.8, 0.1]} m={M.post} />
			))}
			<Box p={[4.25, 0.62, 0]} s={[0.05, 0.22, 140]} m={M.rail} />
			{/* the ravine: the ground falls away past the rail into fog; ridges far off */}
			<Box p={[5.0, -0.05, 0]} s={[1.4, 0.1, 140]} m={M.rock} />
			<mesh position={[18, -6, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.fog}>
				<planeGeometry args={[30, 140]} />
			</mesh>
			{[-40, -18, 6, 30].map((z, i) => (
				<mesh key={z} position={[60, 4 + (i % 2) * 5, z]} rotation={[0, -Math.PI / 2, 0]} material={M.ridge}>
					<planeGeometry args={[40, 16 + i * 3]} />
				</mesh>
			))}
			<group position={[4.6, 0, 0.3]} rotation={[0, Math.PI / 2, 0]}>
				<PsxProp path="assets/models/psx/props/urban/street_light.glb" s={1} />
			</group>
			<pointLight position={[3.6, 5.0, 0.3]} intensity={3.2} distance={11} decay={1} color="#ffb860" />
		</group>
	);
};
