// Episode 55 world: "The Lift" (Season 6; a taxi driver's night on a hill road in Himachal, retold in our own
// words from a driver's account shared online and from churel/chudail folklore; no real road, shrine or person).
// Everything is built round the taxi: the car sits at the origin facing −z and the road runs past it (its
// distance s), bending as c·z² ahead and behind.
// - THE ROAD: a two-lane ghat road (x −1.9..4.1, the taxi in the left lane at x 0), white-and-black parapet
//   blocks on the valley edge (left), a cut rock wall and deodars up the hill (right), deodars falling away below
//   the parapets, the valley's few lights far down on the left, a ridge and stars.
// - THE TAXI: a white box-built hatchback taxi, its bonnet seen by the front dashcam, its boot by the rear one,
//   and its cabin (dash, two front seats, the back bench, pillars, roof) seen by the cabin camera.
// - HER: the user's PSX Character_Monster_05 (long black hair over the face, a white shirt bloodied down the
//   front), with a dark red shawl, brass ankle bells and her feet turned backwards; after the hit, her knees bend
//   the wrong way and the bones of her shins are out through the skin.
import React, {createContext, useContext, useMemo, useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {ps1} from '../ps1';
import {SNAP6} from '../ep01/world';
import {ARMS_DOWN, merge, Pose, PsxCharacter} from '../psx/models';
import {Box, tex} from '../ep41/world';

export type V3 = [number, number, number];
const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 64, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 64, SNAP6);

export const ROAD = {x0: -1.9, x1: 4.1};
export const CAR = {halfW: 0.82, front: -2.1, rear: 2.0, roof: 1.48, belt: 0.95};
const SPAN = 120; // the road repeats every SPAN metres
const Z_AHEAD = -80, Z_BEHIND = 40;
/** the road's bend: lateral offset of a point at car-relative z */
export const bendX = (z: number, c: number) => c * z * z;

const useMatsInner = () =>
	useMemo(() => {
		const asphalt = tex(16, 16, (g) => {
			g.fillStyle = '#6a6660';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 70; i++) {
				g.fillStyle = ['#5a5650', '#7a7670', '#625e58'][i % 3];
				g.fillRect((i * 7) % 16, (i * 11) % 16, 1 + (i % 2), 1);
			}
		}, [3, 1]);
		const parapet = tex(8, 8, (g) => {
			g.fillStyle = '#e8e4da';
			g.fillRect(0, 0, 8, 8);
			g.fillStyle = '#141414';
			g.fillRect(0, 3, 8, 2);
			g.fillStyle = 'rgba(80,70,50,0.35)';
			g.fillRect(1, 6, 3, 2);
		});
		const rock = tex(16, 16, (g) => {
			g.fillStyle = '#4a4640';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 40; i++) {
				g.fillStyle = ['#3a3630', '#5a564e', '#423e38'][i % 3];
				g.fillRect((i * 5) % 16, (i * 7) % 16, 3, 1 + (i % 2));
			}
		}, [1, 3]);
		const needles = tex(16, 16, (g) => {
			g.fillStyle = '#1a2a1e';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 60; i++) {
				g.fillStyle = ['#223628', '#12201a', '#2c4232'][i % 3];
				g.fillRect((i * 7) % 16, (i * 3) % 16, 1, 2);
			}
		}, [2, 2]);
		const shawl = tex(16, 16, (g) => {
			g.fillStyle = '#6a1418';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 30; i++) {
				g.fillStyle = i % 2 ? '#581014' : '#7a1c20';
				g.fillRect((i * 7) % 16, (i * 5) % 16, 2, 1);
			}
			// a worn gold border
			g.fillStyle = '#a88438';
			g.fillRect(0, 13, 16, 2);
			g.fillStyle = '#6a5020';
			for (let x = 0; x < 16; x += 3) g.fillRect(x, 13, 1, 2);
		});
		const seat = tex(8, 8, (g) => {
			g.fillStyle = '#4a4440';
			g.fillRect(0, 0, 8, 8);
			g.fillStyle = '#3a3532';
			for (let y = 0; y < 8; y += 2) g.fillRect(0, y, 8, 1);
		});
		return {
			asphalt: lam('#ffffff', {map: asphalt}),
			paint: bas('#c8c4b4'),
			verge: lam('#4a4236'),
			parapet: lam('#ffffff', {map: parapet}),
			rock: lam('#ffffff', {map: rock}),
			pine: lam('#ffffff', {map: needles}),
			trunk: lam('#2e241c'),
			ridge: bas('#0a0c12'),
			star: bas('#c8ccd8'),
			village: bas('#ffb860'),
			carWhite: lam('#d8d6ce'),
			carDark: lam('#1c1c1e'),
			trim: lam('#2a2a2c'),
			dash: lam('#222224'),
			seat: lam('#ffffff', {map: seat}),
			headliner: lam('#1e1c1a'),
			plate: lam('#e8c830'),
			tail: bas('#ff2010'),
			head: bas('#fff4d8'),
			dashGlow: bas('#60d0a0'),
			shawl: lam('#ffffff', {map: shawl, side: THREE.DoubleSide}),
			bell: lam('#c8a040', {emissive: '#3a2a08'}),
			bone: lam('#e8e0cc', {emissive: '#2a2620'}),
			blood: bas('#5a0404'),
			bloodWet: lam('#8a0a08', {emissive: '#2a0000'}),
			nail: lam('#3a3226'),
			eye: bas('#f0f0e0'),
			rosary: lam('#6a4a2a'),
		};
	}, []);
type Mats = ReturnType<typeof useMatsInner>;
const Ctx = createContext<Mats | null>(null);
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMatsInner()}>{children}</Ctx.Provider>;
export const useM = () => useContext(Ctx)!;

// ------------------------------------------------------------------ the road (moves past the car)
const wrap = (z0: number, s: number) => {
	// car-relative z of a road feature at road distance z0 after the car has driven s (the car drives toward −z)
	let z = (z0 + s) % SPAN;
	if (z < 0) z += SPAN;
	return z + Z_AHEAD; // Z_AHEAD .. Z_AHEAD + SPAN
};
const rnd = (seed: number) => {
	let s = seed;
	return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
};
const PINES = (() => {
	const r = rnd(55);
	const out: {z0: number; x: number; y: number; h: number}[] = [];
	for (let i = 0; i < 70; i++) {
		const hill = i % 2 === 0;
		out.push({z0: r() * SPAN, x: hill ? 5.2 + r() * 7 : -4.5 - r() * 9, y: hill ? 2 + r() * 5 : -2.5 - r() * 7, h: 7 + r() * 6});
	}
	return out;
})();

/** s: metres driven; c: the bend */
export const Road: React.FC<{s: number; c: number; dawn?: number}> = ({s, c, dawn = 0}) => {
	const M = useM();
	const pines = useRef<THREE.InstancedMesh>(null);
	const trunks = useRef<THREE.InstancedMesh>(null);
	const pineGeo = useMemo(() => {
		const parts = [0, 1, 2].map((i) => {
			const g = new THREE.ConeGeometry(1.4 - i * 0.35, 2.4, 6, 1);
			g.translate(0, 1.6 + i * 1.3, 0);
			return g;
		});
		return mergeGeometries(parts)!;
	}, []);
	const trunkGeo = useMemo(() => {
		const g = new THREE.CylinderGeometry(0.12, 0.18, 2, 5);
		g.translate(0, 1, 0);
		return g;
	}, []);
	const place = () => {
		if (!pines.current || !trunks.current) return;
		const m = new THREE.Matrix4();
		PINES.forEach((p, i) => {
			const z = wrap(p.z0, s);
			const k = p.h / 6;
			m.makeScale(k, k, k).setPosition(p.x + bendX(z, c), p.y, z);
			pines.current!.setMatrixAt(i, m);
			trunks.current!.setMatrixAt(i, m);
		});
		pines.current.instanceMatrix.needsUpdate = true;
		trunks.current.instanceMatrix.needsUpdate = true;
	};
	useFrame(place, -1);
	React.useLayoutEffect(place);
	const segs: React.ReactNode[] = [];
	for (let z0 = 0; z0 < SPAN; z0 += 2) {
		const z = wrap(z0, s);
		const x = bendX(z, c);
		const yaw = -Math.atan(2 * c * z); // the slab turns with the bend
		segs.push(
			<group key={z0} position={[x, 0, z]} rotation={[0, yaw, 0]}>
				<Box p={[(ROAD.x0 + ROAD.x1) / 2, -0.05, 0]} s={[ROAD.x1 - ROAD.x0, 0.1, 2.02]} m={M.asphalt} />
				{/* the centre line, dashed; the edge line on the valley side */}
				{z0 % 6 === 0 && <Box p={[(ROAD.x0 + ROAD.x1) / 2, 0.005, 0]} s={[0.12, 0.02, 1.4]} m={M.paint} />}
				<Box p={[ROAD.x0 + 0.15, 0.005, 0]} s={[0.1, 0.02, 2.02]} m={M.paint} />
				{/* the verge and a parapet block every 4 m on the valley edge */}
				<Box p={[ROAD.x0 - 0.35, -0.08, 0]} s={[0.7, 0.1, 2.02]} m={M.verge} />
				{z0 % 4 === 0 && <Box p={[ROAD.x0 - 0.45, 0.3, 0]} s={[0.4, 0.6, 0.7]} m={M.parapet} />}
				{/* the drop below the parapets: a steep dark slope */}
				<Box p={[ROAD.x0 - 3.5, -3.2, 0]} s={[5.6, 0.3, 2.02]} r={[0, 0, -1.0]} m={M.verge} />
				{/* the cut rock wall on the hill side */}
				<Box p={[ROAD.x1 + 0.6, 2.4, 0]} s={[0.8, 5.2, 2.02]} r={[0, 0, 0.12]} m={M.rock} />
				<Box p={[ROAD.x1 + 0.2, 0.03, 0]} s={[0.6, 0.12, 2.02]} m={M.verge} />
			</group>,
		);
	}
	// far away: the ridge across the valley, the village's few lights down on the left, the stars
	const lights = useMemo(() => {
		const r = rnd(9);
		return Array.from({length: 26}, () => [-45 - r() * 70, -38 - r() * 10, -30 - r() * 90] as V3);
	}, []);
	const stars = useMemo(() => {
		const r = rnd(31);
		return Array.from({length: 90}, () => {
			const a = r() * Math.PI * 2, e = 0.12 + r() * 1.1;
			return [Math.cos(a) * Math.cos(e) * 150, Math.sin(e) * 150, Math.sin(a) * Math.cos(e) * 150] as V3;
		});
	}, []);
	return (
		<group>
			{segs}
			<instancedMesh ref={pines} args={[pineGeo, M.pine, PINES.length]} frustumCulled={false} />
			<instancedMesh ref={trunks} args={[trunkGeo, M.trunk, PINES.length]} frustumCulled={false} />
			{lights.map((p, i) => (
				<mesh key={i} position={p} material={M.village}>
					<boxGeometry args={[0.6, 0.6, 0.6]} />
				</mesh>
			))}
			{dawn < 0.6 &&
				stars.map((p, i) => (
					<mesh key={'s' + i} position={p} material={M.star}>
						<boxGeometry args={[0.5, 0.5, 0.5]} />
					</mesh>
				))}
			{/* the ridge across the valley (left) and the hill's shoulder ahead */}
			<mesh position={[-120, -10, -60]} rotation={[0, 0.5, 0]} material={M.ridge}>
				<boxGeometry args={[30, 50, 260]} />
			</mesh>
		</group>
	);
};

// ------------------------------------------------------------------ the taxi
/** which parts to draw: 'out' the whole body from outside; 'front' the bonnet (front dashcam); 'rear' the boot
 *  (rear camera); 'cabin' the inside */
export const Taxi: React.FC<{view: 'front' | 'rear' | 'cabin'; lights?: boolean; dent?: number}> = ({view, lights = true, dent = 0}) => {
	const M = useM();
	const {halfW, front, rear, roof, belt} = CAR;
	return (
		<group>
			{view === 'front' && (
				<>
					{/* the bonnet, sloping down from the windscreen; dented after the hit */}
					<Box p={[0, 0.88 - 0.05 * dent, -1.7]} s={[halfW * 2, 0.08, 1.1]} r={[-0.16 - 0.06 * dent, 0, 0.03 * dent]} m={M.carWhite} />
					<Box p={[0, 0.98, -1.12]} s={[halfW * 2, 0.05, 0.12]} m={M.trim} />
					{/* a wiper resting on the glass */}
					<Box p={[-0.2, 1.02, -1.08]} s={[0.7, 0.02, 0.03]} r={[0, 0, 0.1]} m={M.carDark} />
				</>
			)}
			{view === 'rear' && (
				<>
					<Box p={[0, 0.95, rear - 0.25]} s={[halfW * 2, 0.06, 0.55]} r={[0.25, 0, 0]} m={M.carWhite} />
					<Box p={[0, 0.7, rear]} s={[halfW * 2, 0.5, 0.06]} m={M.carWhite} />
					{lights && (
						<>
							<mesh position={[-0.68, 0.82, rear + 0.04]} material={M.tail}>
								<boxGeometry args={[0.18, 0.12, 0.02]} />
							</mesh>
							<mesh position={[0.68, 0.82, rear + 0.04]} material={M.tail}>
								<boxGeometry args={[0.18, 0.12, 0.02]} />
							</mesh>
						</>
					)}
				</>
			)}
			{view === 'cabin' && (
				<>
					{/* floor, roof, the dash under the windscreen */}
					<Box p={[0, 0.2, 0]} s={[halfW * 2, 0.06, 3.6]} m={M.carDark} />
					<Box p={[0, roof, 0.1]} s={[halfW * 2, 0.04, 2.9]} m={M.headliner} />
					<Box p={[0, 0.82, -1.2]} s={[halfW * 2, 0.32, 0.5]} m={M.dash} />
					{/* the side panels below the windows, both sides, front to back */}
					{[-1, 1].map((sd) => (
						<group key={sd}>
							<Box p={[sd * halfW, 0.58, 0.2]} s={[0.05, 0.75, 3.2]} m={M.trim} />
							{/* pillars: A, B, C */}
							<Box p={[sd * halfW, 1.2, -1.15]} s={[0.06, 0.55, 0.08]} r={[0.5, 0, 0]} m={M.trim} />
							<Box p={[sd * halfW, 1.2, 0.05]} s={[0.06, 0.55, 0.1]} m={M.trim} />
							<Box p={[sd * halfW, 1.2, 1.35]} s={[0.06, 0.55, 0.14]} r={[-0.4, 0, 0]} m={M.trim} />
						</group>
					))}
					{/* the back window's frame and the parcel shelf */}
					<Box p={[0, 0.92, 1.55]} s={[halfW * 2, 0.05, 0.4]} m={M.trim} />
					<Box p={[0, 1.45, 1.6]} s={[halfW * 2, 0.08, 0.1]} m={M.trim} />
					{/* the front seats (driver on the right, +x) and the back bench */}
					{[-0.42, 0.42].map((x) => (
						<group key={x}>
							<Box p={[x, 0.42, -0.25]} s={[0.5, 0.12, 0.5]} m={M.seat} />
							{/* the passenger seat is reclined flat back (a taxi's front seat, folded for luggage) */}
							{x > 0 ? (
								<>
									<Box p={[x, 0.82, 0.02]} s={[0.5, 0.72, 0.12]} r={[-0.15, 0, 0]} m={M.seat} />
									<Box p={[x, 1.24, 0.08]} s={[0.26, 0.18, 0.1]} r={[-0.15, 0, 0]} m={M.seat} />
								</>
							) : (
								<Box p={[x, 0.62, 0.28]} s={[0.5, 0.62, 0.12]} r={[-1.05, 0, 0]} m={M.seat} />
							)}
						</group>
					))}
					<Box p={[0, 0.42, 0.95]} s={[1.5, 0.14, 0.5]} m={M.seat} />
					<Box p={[0, 0.8, 1.22]} s={[1.5, 0.66, 0.12]} r={[-0.2, 0, 0]} m={M.seat} />
					{/* the dash's green glow; the steering wheel on the right; a small rosary from the mirror */}
					<mesh position={[0.42, 0.99, -1.0]} material={M.dashGlow}>
						<boxGeometry args={[0.2, 0.05, 0.02]} />
					</mesh>
					<mesh position={[0.42, 1.0, -0.82]} rotation={[-1.1, 0, 0]} material={M.carDark}>
						<torusGeometry args={[0.18, 0.025, 4, 12]} />
					</mesh>
					<Box p={[0, 1.36, -1.02]} s={[0.24, 0.07, 0.03]} m={M.carDark} />
					<Box p={[0, 1.22, -1.0]} s={[0.012, 0.22, 0.012]} m={M.rosary} />
					<Box p={[0, 1.1, -1.0]} s={[0.04, 0.05, 0.02]} m={M.rosary} />
				</>
			)}
		</group>
	);
};

// ------------------------------------------------------------------ her
/** what she is doing:
 *  'stand': upright in the shawl, an arm raised to wave (wave 0..1), or walking (walk: the stride phase);
 *  'lie': face down on the road after the hit; 'rise': from the road onto her backwards knees (k 0..1);
 *  'run': on all fours, knees bent the wrong way (phase); 'window': bent alongside the car, her face at the
 *  glass; 'seat': in the back seat, one hand on the top of the seat in front (lean 0..1 brings her face out) */
export type HerState =
	| {mode: 'stand'; wave?: number; walk?: number; look?: number}
	| {mode: 'lie'}
	| {mode: 'rise'; k: number}
	| {mode: 'run'; phase: number}
	| {mode: 'window'; press: number}
	| {mode: 'seat'; lean: number; tap: number};

type BonePose = Record<string, {aim?: V3; x?: number; y?: number; z?: number}>;
const lerpPose = (a: BonePose, b: BonePose, k: number): BonePose => {
	const out: BonePose = {};
	for (const n of new Set([...Object.keys(a), ...Object.keys(b)])) {
		const A = a[n] ?? {}, B = b[n] ?? {};
		const o: {aim?: V3; x?: number; y?: number; z?: number} = {};
		if (A.aim || B.aim) {
			const pa = A.aim ?? B.aim!, pb = B.aim ?? A.aim!;
			o.aim = [pa[0] + (pb[0] - pa[0]) * k, pa[1] + (pb[1] - pa[1]) * k, pa[2] + (pb[2] - pa[2]) * k];
		}
		for (const ax of ['x', 'y', 'z'] as const) if (A[ax] !== undefined || B[ax] !== undefined) o[ax] = (A[ax] ?? 0) + ((B[ax] ?? 0) - (A[ax] ?? 0)) * k;
		out[n] = o;
	}
	return out;
};
const toPose = (b: BonePose): Pose =>
	Object.fromEntries(
		Object.entries(b).map(([n, v]) => [n, [...(v.x !== undefined ? [['x', v.x]] : []), ...(v.y !== undefined ? [['y', v.y]] : []), ...(v.z !== undefined ? [['z', v.z]] : []), ...(v.aim ? [['aim', v.aim]] : [])] as Pose[string]]),
	);
// her feet are always turned back: the toes point behind her
const FEET: BonePose = {LeftFoot: {aim: [0.05, -0.35, -1]}, RightFoot: {aim: [-0.05, -0.35, -1]}};
const STAND: BonePose = {
	...FEET,
	LeftArm: {aim: [0.2, -1, 0.05]},
	RightArm: {aim: [-0.2, -1, 0.05]},
	LeftForeArm: {aim: [0.1, -1, 0.15]},
	RightForeArm: {aim: [-0.1, -1, 0.15]},
	Neck: {x: 0.25},
	Head: {x: 0.15},
};
// standing on knees bent the wrong way: thighs down and back, shins forward and down
const BACKKNEE: BonePose = {
	...FEET,
	LeftUpLeg: {aim: [0.12, -0.8, -0.6]},
	RightUpLeg: {aim: [-0.12, -0.8, -0.6]},
	LeftLeg: {aim: [0.05, -0.75, 0.66]},
	RightLeg: {aim: [-0.05, -0.75, 0.66]},
	Spine: {x: 0.35},
	Spine1: {x: 0.15},
	LeftArm: {aim: [0.35, -1, 0.2]},
	RightArm: {aim: [-0.35, -1, 0.2]},
	LeftForeArm: {aim: [0.1, -1, 0.35]},
	RightForeArm: {aim: [-0.1, -1, 0.35]},
	Neck: {x: 0.6},
	Head: {x: 0.4, z: 0.35},
};
// on all fours, the knees still the wrong way, the head up and forward
const FOURS = (ph: number): BonePose => {
	const a = Math.sin(ph), b = Math.sin(ph + Math.PI);
	return {
		...FEET,
		LeftUpLeg: {aim: [0.15, -0.55 + 0.15 * a, -0.8 + 0.3 * a]},
		RightUpLeg: {aim: [-0.15, -0.55 + 0.15 * b, -0.8 + 0.3 * b]},
		LeftLeg: {aim: [0.05, -0.7, 0.7 + 0.25 * a]},
		RightLeg: {aim: [-0.05, -0.7, 0.7 + 0.25 * b]},
		Spine: {x: 1.0},
		Spine1: {x: 0.35},
		Spine2: {x: 0.15},
		Neck: {x: -0.8},
		Head: {x: -0.45},
		LeftArm: {aim: [0.25, -0.75, 0.6 + 0.35 * b]},
		RightArm: {aim: [-0.25, -0.75, 0.6 + 0.35 * a]},
		LeftForeArm: {aim: [0.1, -1, 0.25 + 0.35 * b]},
		RightForeArm: {aim: [-0.1, -1, 0.25 + 0.35 * a]},
	};
};
const LIE: BonePose = {
	// face down (the body is laid down by the root rotation): arms flung forward, one leg twisted
	LeftFoot: {aim: [0.4, -1, -0.2]},
	RightFoot: {aim: [-0.2, -1, -0.5]},
	LeftUpLeg: {aim: [0.25, -1, 0.1]},
	RightUpLeg: {aim: [-0.1, -1, 0.15]},
	LeftLeg: {aim: [0.45, -0.8, 0.4]},
	RightLeg: {aim: [-0.05, -1, 0]},
	LeftArm: {aim: [0.45, 0.85, 0.1]},
	RightArm: {aim: [-0.9, 0.1, 0.1]},
	LeftForeArm: {aim: [0.2, 1, 0.1]},
	RightForeArm: {aim: [-0.6, -0.6, 0.2]},
	Neck: {y: 0.9},
	Head: {y: 0.4},
};

export const HER_H = 1.68;
const BN = ['Hips', 'Spine2', 'Neck', 'Head', 'HeadTop_End', 'LeftArm', 'RightArm', 'LeftHand', 'RightHand', 'LeftLeg', 'RightLeg', 'LeftFoot', 'RightFoot', 'LeftToeBase', 'RightToeBase', 'LeftUpLeg', 'RightUpLeg'] as const;
const B: Record<string, THREE.Vector3> & {ready?: boolean} = Object.fromEntries(BN.map((n) => [n, new THREE.Vector3()]));
export const herBones = B;

/** p: where her feet (root) go; ry: which way she faces (0 = +z); gore 0..1: the shins broken through */
export const Her: React.FC<{p: V3; ry: number; state: HerState; gore?: number; t: number; reach?: V3; eyes?: boolean; look?: V3}> = ({p, ry, state, gore = 0, t, reach, eyes, look}) => {
	let bp: BonePose;
	let rx = 0;
	let pos: V3 = p;
	switch (state.mode) {
		case 'stand': {
			bp = {...STAND};
			if (state.wave) {
				const w = state.wave;
				bp.LeftArm = {aim: [0.5, 0.2 + 0.6 * w, 0.2]};
				bp.LeftForeArm = {aim: [0.2 + 0.25 * Math.sin(t * 3), 1, 0.15]};
			}
			if (state.walk !== undefined) {
				// she walks forward, but her feet trail behind her, heels first
				const a = Math.sin(state.walk), b = -a;
				bp.LeftUpLeg = {aim: [0.08, -1, 0.3 * a]};
				bp.RightUpLeg = {aim: [-0.08, -1, 0.3 * b]};
				bp.LeftLeg = {aim: [0.04, -1, -0.15 + 0.2 * Math.max(0, -a)]};
				bp.RightLeg = {aim: [-0.04, -1, -0.15 + 0.2 * Math.max(0, -b)]};
			}
			if (state.look) bp.Head = {x: 0.15 - 0.3 * state.look, z: 0.3 * state.look};
			break;
		}
		case 'lie':
			bp = LIE;
			rx = -Math.PI / 2;
			pos = [p[0], p[1] + 0.16, p[2]];
			break;
		case 'rise': {
			// 0..0.45 push up off the road; 0.45..1 the legs fold back under her and she stands, crooked
			const k = state.k;
			const k1 = Math.min(1, k / 0.45), k2 = Math.max(0, (k - 0.45) / 0.55);
			bp = k < 0.45 ? lerpPose(LIE, {...FOURS(0), Neck: {x: 0.6}, Head: {x: 0.6}}, k1) : lerpPose({...FOURS(0), Neck: {x: 0.6}, Head: {x: 0.6}}, BACKKNEE, k2);
			rx = -Math.PI / 2 * (1 - k1);
			pos = [p[0], p[1] + 0.16 * (1 - k1) - (k < 0.45 ? 0.3 * k1 : 0.3 * (1 - k2)), p[2]];
			break;
		}
		case 'run':
			bp = FOURS(state.phase);
			pos = [p[0], p[1] - 0.32 + 0.05 * Math.abs(Math.sin(state.phase)), p[2]];
			break;
		case 'window': {
			// running bent beside the car, upright enough that her face is at the glass, turned in to me
			const a = Math.sin(t * 15);
			bp = {
				...BACKKNEE,
				LeftUpLeg: {aim: [0.12, -0.8, -0.6 + 0.4 * a]},
				RightUpLeg: {aim: [-0.12, -0.8, -0.6 - 0.4 * a]},
				Spine: {x: 0.3},
				Spine1: {x: 0.1},
				Neck: {x: 0.1, y: -0.45},
				Head: {x: 0.05, y: -0.45 - 0.25 * state.press, z: 0.1},
				LeftArm: {aim: [0.4, -0.6, -0.4 * a]},
				LeftForeArm: {aim: [0.2, -0.8, 0.4]},
				RightArm: {aim: [-0.75, 0.0, 0.65]},
				RightForeArm: {aim: [-0.6 - 0.3 * state.press, 0.45, 0.6 - 0.4 * state.press]},
			};
			break;
		}
		case 'seat': {
			bp = {
				LeftUpLeg: {aim: [0.1, -0.1, 1]},
				RightUpLeg: {aim: [-0.1, -0.1, 1]},
				LeftLeg: {aim: [0, -1, 0.1]},
				RightLeg: {aim: [0, -1, 0.1]},
				...FEET,
				Spine: {x: 0.25 + 0.45 * state.lean, z: -0.55 * state.lean},
				Spine1: {z: -0.25 * state.lean},
				Neck: {x: 0.1, y: 0.55 * state.lean, z: -0.2 * state.lean},
				Head: {x: -0.25 * state.lean, y: 0.35 * state.lean, z: -0.2 * state.lean},
				LeftArm: {aim: [0.25, -1, 0.1]},
				LeftForeArm: {aim: [0.1, -1, 0.3]},
			};
			break;
		}
	}
	const breathe = 0.03 * Math.sin(t * 2.6);
	const pose = merge(toPose(bp), {Spine1: [['x', breathe]]});
	return (
		<>
			<PsxCharacter
				name="Character_Monster_05"
				height={HER_H}
				tint={{color: '#d8d4cc', emissive: '#0a0808'}}
				position={pos}
				rotation={[rx, ry, 0]}
				pose={pose}
				reach={reach ? {arm: 'Right', target: reach} : undefined}
				probe={(w) => {
					for (const n of BN) B[n].copy(w(n));
					B.ready = true;
					if ((globalThis as any).EP55_PROBE) console.log('PROBE', JSON.stringify(Object.fromEntries(['Hips', 'Neck', 'Head', 'HeadTop_End', 'LeftLeg', 'LeftFoot', 'RightHand'].map((n) => [n, w(n).toArray().map((v) => +v.toFixed(2))]))));
				}}
			/>
			<Shawl />
			<Bells t={t} />
			{gore > 0 && <Shins gore={gore} />}
			{reach && <Nails />}
			{eyes && <Eyes ry={ry} look={look} />}
		</>
	);
};

/** the shawl: a dark red cloth over her shoulders and down her back, its corners hanging in front */
const Shawl: React.FC = () => {
	const M = useM();
	const back = useRef<THREE.Mesh>(null);
	const l = useRef<THREE.Mesh>(null);
	const r = useRef<THREE.Mesh>(null);
	const place = () => {
		if (!B.ready || !back.current) return;
		const sh = B.LeftArm.clone().add(B.RightArm).multiplyScalar(0.5);
		const across = B.LeftArm.clone().sub(B.RightArm);
		const w = across.length() + 0.18;
		across.normalize();
		const up = B.Neck.clone().sub(B.Hips).normalize();
		const fwd = new THREE.Vector3().crossVectors(across, up).normalize();
		// the back panel: from the shoulders down to the hips, behind the body
		const len = B.Neck.distanceTo(B.Hips) * 1.05;
		const m = new THREE.Matrix4().makeBasis(across, up, fwd);
		const q = new THREE.Quaternion().setFromRotationMatrix(m);
		back.current.quaternion.copy(q);
		back.current.position.copy(sh).addScaledVector(up, -len / 2 + 0.06).addScaledVector(fwd, -0.11);
		back.current.scale.set(w, len, 1);
		// the two ends over the shoulders, hanging down the front
		for (const [ref, arm, sgn] of [[l, B.LeftArm, 1], [r, B.RightArm, -1]] as const) {
			if (!ref.current) continue;
			ref.current.quaternion.copy(q);
			ref.current.position.copy(arm).addScaledVector(across, -0.05 * sgn).addScaledVector(up, -len * 0.4).addScaledVector(fwd, 0.09);
			ref.current.scale.set(0.09, len * 0.8, 1);
		}
	};
	useFrame(place, -1);
	React.useLayoutEffect(place);
	return (
		<>
			<mesh ref={back} material={M.shawl} frustumCulled={false}>
				<boxGeometry args={[1, 1, 0.04]} />
			</mesh>
			<mesh ref={l} material={M.shawl} frustumCulled={false}>
				<boxGeometry args={[1, 1, 0.04]} />
			</mesh>
			<mesh ref={r} material={M.shawl} frustumCulled={false}>
				<boxGeometry args={[1, 1, 0.04]} />
			</mesh>
		</>
	);
};

/** brass bells round each ankle, jingling */
const Bells: React.FC<{t: number}> = ({t}) => {
	const M = useM();
	const ref = useRef<THREE.InstancedMesh>(null);
	const place = () => {
		if (!B.ready || !ref.current) return;
		const m = new THREE.Matrix4();
		let k = 0;
		for (const s of ['Left', 'Right']) {
			const f = B[`${s}Foot`], kn = B[`${s}Leg`];
			const dir = kn.clone().sub(f).normalize();
			const c = f.clone().addScaledVector(dir, 0.07);
			const a1 = new THREE.Vector3(1, 0, 0).addScaledVector(dir, -dir.x).normalize();
			const a2 = new THREE.Vector3().crossVectors(dir, a1).normalize();
			for (let i = 0; i < 8; i++) {
				const ang = (i / 8) * Math.PI * 2 + 0.3 * Math.sin(t * 20 + i);
				m.makeScale(1, 1, 1).setPosition(c.clone().addScaledVector(a1, Math.cos(ang) * 0.05).addScaledVector(a2, Math.sin(ang) * 0.05));
				ref.current.setMatrixAt(k++, m);
			}
		}
		ref.current.instanceMatrix.needsUpdate = true;
	};
	useFrame(place, -1);
	React.useLayoutEffect(place);
	return (
		<instancedMesh ref={ref} args={[undefined, M.bell, 16]} frustumCulled={false}>
			<boxGeometry args={[0.014, 0.014, 0.014]} />
		</instancedMesh>
	);
};

/** the broken shins: the bone out through the front of each shin, blood down to the ankle */
const Shins: React.FC<{gore: number}> = ({gore}) => {
	const M = useM();
	const refs = [useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
	const place = () => {
		if (!B.ready) return;
		['Left', 'Right'].forEach((s, i) => {
			const g = refs[i].current;
			if (!g) return;
			const kn = B[`${s}Leg`], f = B[`${s}Foot`];
			const dir = f.clone().sub(kn);
			const L = dir.length();
			dir.normalize();
			const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
			g.position.copy(kn);
			g.quaternion.copy(q);
			g.scale.setScalar(L / 0.42);
		});
	};
	useFrame(place, -1);
	React.useLayoutEffect(place);
	const leg = (
		<>
			{/* blood soaking the shin from the break down to the ankle (local −y runs knee to foot) */}
			<mesh position={[0, -0.27, 0]} material={M.bloodWet}>
				<boxGeometry args={[0.11, 0.3, 0.11]} />
			</mesh>
			{/* the bone ends, jagged, out through the front of the shin and out to the side */}
			<mesh position={[0, -0.2, 0.09 * gore]} rotation={[0.9, 0, 0.2]} material={M.bone} scale={[1, gore, 1]}>
				<coneGeometry args={[0.022, 0.2, 4]} />
			</mesh>
			<mesh position={[0.05 * gore, -0.24, 0.05]} rotation={[0.5, 0, -1.0]} material={M.bone} scale={[1, gore, 1]}>
				<coneGeometry args={[0.018, 0.15, 4]} />
			</mesh>
			<mesh position={[0, -0.16, 0.07]} material={M.blood}>
				<boxGeometry args={[0.13, 0.08, 0.06]} />
			</mesh>
		</>
	);
	return (
		<>
			<group ref={refs[0]}>{leg}</group>
			<group ref={refs[1]}>{leg}</group>
		</>
	);
};

/** long dark nails from the reaching (right) hand */
const Nails: React.FC = () => {
	const M = useM();
	const ref = useRef<THREE.InstancedMesh>(null);
	const geo = useMemo(() => {
		const g = new THREE.ConeGeometry(0.008, 0.07, 4);
		g.translate(0, 0.035, 0);
		return g;
	}, []);
	const place = () => {
		if (!B.ready || !ref.current) return;
		const h = B.RightHand;
		const arm = h.clone().sub(B.RightArm).normalize();
		const side = new THREE.Vector3().crossVectors(arm, new THREE.Vector3(0, 1, 0)).normalize();
		const m = new THREE.Matrix4(), q = new THREE.Quaternion();
		for (let i = 0; i < 5; i++) {
			// fingers curl down over the seat's top edge; the nails point down its back
			const tip = h.clone().addScaledVector(arm, 0.13 - 0.02 * Math.abs(i - 2)).addScaledVector(side, (i - 2) * 0.022).add(new THREE.Vector3(0, -0.04, 0));
			const d = arm.clone().multiplyScalar(0.3).add(new THREE.Vector3(0, -1, 0)).normalize();
			q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
			m.compose(tip, q, new THREE.Vector3(1, 1, 1));
			ref.current.setMatrixAt(i, m);
		}
		ref.current.instanceMatrix.needsUpdate = true;
	};
	useFrame(place, -1);
	React.useLayoutEffect(place);
	return <instancedMesh ref={ref} args={[geo, M.nail, 5]} frustumCulled={false} />;
};

/** two points of eyeshine through the hair, placed in the face's own frame */
const Eyes: React.FC<{ry: number; look?: V3}> = ({ry, look}) => {
	const M = useM();
	const a = useRef<THREE.Mesh>(null), b = useRef<THREE.Mesh>(null);
	const place = () => {
		if (!B.ready || !a.current || !b.current) return;
		const up = B.HeadTop_End.clone().sub(B.Head).normalize();
		const fwd = look ? new THREE.Vector3(...look).normalize() : new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry));
		fwd.addScaledVector(up, -fwd.dot(up)).normalize();
		const side = new THREE.Vector3().crossVectors(up, fwd).normalize();
		const c = B.Head.clone().addScaledVector(up, (window as any).EP55_EYE_UP ?? 0.07).addScaledVector(fwd, (window as any).EP55_EYE_FWD ?? 0.1);
		a.current.position.copy(c).addScaledVector(side, 0.032);
		b.current.position.copy(c).addScaledVector(side, -0.032);
	};
	useFrame(place, -1);
	React.useLayoutEffect(place);
	return (
		<>
			<mesh ref={a} material={M.eye} frustumCulled={false}>
				<boxGeometry args={[0.022, 0.014, 0.01]} />
			</mesh>
			<mesh ref={b} material={M.eye} frustumCulled={false}>
				<boxGeometry args={[0.022, 0.014, 0.01]} />
			</mesh>
		</>
	);
};

// ------------------------------------------------------------------ me, the driver
export const ME = 'Character_30';
export const Driver: React.FC<{look?: number; grip?: number}> = ({look = 0}) => (
	<PsxCharacter
		name={ME}
		height={1.74}
		tint={{color: '#b89478'}}
		position={[0.42, -0.36, -0.2]}
		rotation={[0, Math.PI, 0]}
		pose={merge(
			ARMS_DOWN,
			{
				LeftUpLeg: [['aim', [0.08, -0.15, 1]]],
				RightUpLeg: [['aim', [-0.08, -0.15, 1]]],
				LeftLeg: [['aim', [0, -1, 0.3]]],
				RightLeg: [['aim', [0, -1, 0.3]]],
				Spine: [['x', -0.12]],
				// hands on the wheel
				LeftArm: [['aim', [0.15, -0.55, 0.8]]],
				RightArm: [['aim', [-0.15, -0.55, 0.8]]],
				LeftForeArm: [['aim', [-0.25, 0.2, 1]]],
				RightForeArm: [['aim', [0.25, 0.2, 1]]],
				Neck: [['y', look * 0.7]],
				Head: [['y', look * 0.5]],
			},
		)}
	/>
);
