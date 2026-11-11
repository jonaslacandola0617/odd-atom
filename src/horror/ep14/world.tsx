// Episode 14 world: "The Guests of Dominican Hill" (reported legend: the old Diplomat Hotel on
// Dominican Hill, Baguio). One consistent set: the white, roofless ruin among Benguet pines in the
// fog; inside, its long corridor with doors, and the dining hall with tall empty window openings
// and a long table set for dinner.
//
// Layout (metres, y up). Ground floor y = 0. The dining hall is x -6..6, z -3..3, 4.2 m high; its
// front wall (z = +3) has four tall window openings onto the fog. The corridor runs behind it,
// x -16..10, z -5.4..-3, with doors on the back wall (z = -5.4); a doorway at x = -4.5 joins it to
// the hall. Outside, the building is x -16..12, z -6..3.2, two storeys, roofless, with a central
// entrance block; the hill falls away to +z; pines all around.
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

export const HALL_H = 4.2;
export const TABLE_Z = 0;
export const TABLE_END: [number, number, number] = [4.6, 0, 0]; // the head of the table (where it sits)
export const CORRIDOR_Z = -4.2;

const useMats = () =>
	useMemo(() => {
		const plaster = tex(16, 16, (g) => {
			g.fillStyle = '#b8b2a4';
			g.fillRect(0, 0, 16, 16);
			const r = rng(31);
			for (let i = 0; i < 40; i++) {
				g.fillStyle = r() < 0.5 ? '#8a8476' : '#cfc8b8';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1 + Math.floor(r() * 3), 1);
			}
			g.fillStyle = '#5a5a4a';
			g.fillRect(3, 9, 5, 1);
			g.fillRect(10, 2, 1, 4);
		}, [3, 2]);
		const tiles = tex(8, 8, (g) => {
			for (let y = 0; y < 8; y++)
				for (let x = 0; x < 8; x++) {
					g.fillStyle = (x + y) % 2 ? '#4a4038' : '#6a5a4a';
					g.fillRect(x, y, 1, 1);
				}
			g.fillStyle = '#2a2420';
			g.fillRect(2, 5, 3, 1);
		}, [12, 6]);
		return {
			plaster: lam('#ffffff', {map: plaster}),
			outer: lam('#d8d4c8'),
			floor: lam('#ffffff', {map: tiles}),
			beam: lam('#3a3028'),
			black: bas('#020203'),
			table: lam('#4a3020'),
			cloth: lam('#d8d0c0'),
			plate: lam('#e8e4dc'),
			glass: lam('#8a9aa0'),
			chair: lam('#3a2618'),
			candle: lam('#e8e0c8'),
			flame: bas('#ffc060'),
			door: lam('#3a2a1e'),
			pine: lam('#1e3424'),
			pineDark: lam('#16261c'),
			trunk: lam('#4a3a2c'),
			ground: lam('#3a4430'),
			fog: new THREE.MeshBasicMaterial({color: '#b8c0c8', transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide}),
			shelter: lam('#1a1816'),
			debris: lam('#6a6458'),
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

/** A wall along x at z, from x0 to x1, with rectangular openings [xa, xb, ya, yb]. */
const WallX: React.FC<{z: number; x0: number; x1: number; h: number; holes: [number, number, number, number][]; m: THREE.Material; t?: number}> = ({z, x0, x1, h, holes, m, t = 0.25}) => {
	const parts: React.ReactNode[] = [];
	const xs = [x0, ...holes.flatMap(([a, b]) => [a, b]), x1];
	for (let i = 0; i < xs.length; i += 2) if (xs[i + 1] > xs[i]) parts.push(<Box key={`s${i}`} p={[(xs[i] + xs[i + 1]) / 2, h / 2, z]} s={[xs[i + 1] - xs[i], h, t]} m={m} />);
	holes.forEach(([a, b, ya, yb], i) => {
		parts.push(<Box key={`b${i}`} p={[(a + b) / 2, ya / 2, z]} s={[b - a, ya, t]} m={m} />);
		parts.push(<Box key={`t${i}`} p={[(a + b) / 2, (yb + h) / 2, z]} s={[b - a, h - yb, t]} m={m} />);
	});
	return <group>{parts}</group>;
};

/** The table set for dinner. pull: 0..1 every chair pulled out. extra: one more place setting at the end. */
export const Table: React.FC<{pull: number; candles: boolean; extra: boolean}> = ({pull, candles, extra}) => {
	const m = useM();
	const seats = useMemo(() => {
		const out: {x: number; z: number; ry: number}[] = [];
		for (let i = 0; i < 6; i++) {
			const x = -3.6 + i * 1.4;
			out.push({x, z: 0.85, ry: Math.PI});
			out.push({x, z: -0.85, ry: 0});
		}
		out.push({x: -4.6, z: 0, ry: Math.PI / 2});
		return out;
	}, []);
	return (
		<group>
			<Box p={[0, 0.74, TABLE_Z]} s={[9.2, 0.08, 1.2]} m={m.table} />
			<Box p={[0, 0.785, TABLE_Z]} s={[9.0, 0.01, 1.1]} m={m.cloth} />
			{[-4.4, 4.4].map((x) => [-0.5, 0.5].map((z) => <Box key={`${x}${z}`} p={[x, 0.37, z]} s={[0.1, 0.74, 0.1]} m={m.table} />))}
			{seats.map((s, i) => {
				const away = pull * (0.35 + (i % 3) * 0.1);
				const dx = s.ry === Math.PI / 2 ? -away : 0;
				const dz = s.ry === Math.PI ? away : s.ry === 0 ? -away : 0;
				return (
					<group key={i} position={[s.x + dx, 0, s.z + dz]} rotation={[0, s.ry + pull * (i % 2 ? 0.25 : -0.2), 0]}>
						<Box p={[0, 0.45, 0]} s={[0.46, 0.06, 0.44]} m={m.chair} />
						<Box p={[0, 0.9, -0.2]} s={[0.46, 0.85, 0.06]} m={m.chair} />
						{[-0.2, 0.2].map((x) => [-0.18, 0.18].map((z) => <Box key={`${x}${z}`} p={[x, 0.22, z]} s={[0.05, 0.45, 0.05]} m={m.chair} />))}
						{/* the place setting in front of this chair */}
						<mesh position={[0, 0.8, 0.42]} material={m.plate}>
							<cylinderGeometry args={[0.13, 0.13, 0.012, 10]} />
						</mesh>
						<Box p={[0.18, 0.84, 0.42]} s={[0.03, 0.1, 0.03]} m={m.glass} />
					</group>
				);
			})}
			{/* the head of the table: a chair, and (as a hidden detail) a place set there only later */}
			<group position={[TABLE_END[0] + pull * 0.4, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
				<Box p={[0, 0.45, 0]} s={[0.5, 0.06, 0.48]} m={m.chair} />
				<Box p={[0, 1.0, -0.22]} s={[0.5, 1.05, 0.06]} m={m.chair} />
				{[-0.2, 0.2].map((x) => [-0.2, 0.2].map((z) => <Box key={`${x}${z}`} p={[x, 0.22, z]} s={[0.05, 0.45, 0.05]} m={m.chair} />))}
			</group>
			{extra && (
				<mesh position={[TABLE_END[0] - 0.42, 0.8, 0]} material={m.plate}>
					<cylinderGeometry args={[0.13, 0.13, 0.012, 10]} />
				</mesh>
			)}
			{candles &&
				[-2.5, 0, 2.5].map((x) => (
					<group key={x} position={[x, 0.79, 0]}>
						<Box p={[0, 0.12, 0]} s={[0.05, 0.24, 0.05]} m={m.candle} />
						<mesh position={[0, 0.28, 0]} material={m.flame}>
							<coneGeometry args={[0.022, 0.07, 5]} />
						</mesh>
					</group>
				))}
		</group>
	);
};

/** The interior: dining hall, corridor, doors; debris on the floor. */
export const Interior: React.FC<{doorKnock: number}> = ({doorKnock}) => {
	const m = useM();
	const debris = useMemo(() => {
		const r = rng(1414);
		return Array.from({length: 30}, () => ({x: -15 + r() * 26, z: -5.2 + r() * 8, s: 0.05 + r() * 0.2, ry: r() * 3}));
	}, []);
	return (
		<group>
			<Box p={[-3, -0.05, -1.2]} s={[28, 0.1, 9]} m={m.floor} />
			{/* the dining hall's front wall, four tall openings onto the fog */}
			<WallX z={3} x0={-6.2} x1={6.2} h={HALL_H} holes={[[-4.6, -3.4, 0.9, 3.4], [-1.8, -0.6, 0.9, 3.4], [0.6, 1.8, 0.9, 3.4], [3.4, 4.6, 0.9, 3.4]]} m={m.plaster} />
			{/* the wall between hall and corridor, with a doorway at x -4.5 */}
			<WallX z={-3} x0={-16} x1={10} h={HALL_H} holes={[[-5.1, -3.9, 0.0, 2.5]]} m={m.plaster} />
			{/* the end walls of the hall */}
			<Box p={[-6.2, HALL_H / 2, 0]} s={[0.25, HALL_H, 6]} m={m.plaster} />
			<Box p={[6.2, HALL_H / 2, 0]} s={[0.25, HALL_H, 6]} m={m.plaster} />
			{/* the corridor: its back wall with doors; the far end opens into black */}
			<WallX z={-5.4} x0={-16} x1={10} h={3.4} holes={[[-13, -12, 0, 2.2], [-9, -8, 0, 2.2], [-5, -4, 0, 2.2], [-1, 0, 0, 2.2], [3, 4, 0, 2.2], [7, 8, 0, 2.2]]} m={m.plaster} />
			{[-12.5, -8.5, -4.5, -0.5, 3.5, 7.5].map((x, i) => (
				<group key={x} position={[x - 0.5, 0, -5.38]} rotation={[0, i === 3 ? doorKnock * 0.06 : 0, 0]}>
					<Box p={[0.5, 1.1, 0]} s={[1.0, 2.2, 0.06]} m={i === 3 ? m.door : m.door} />
				</group>
			))}
			<Box p={[-16, 1.7, -4.2]} s={[0.1, 3.4, 2.4]} m={m.black} />
			{/* ceiling beams over the corridor (roofless above the hall: the night shows through) */}
			{Array.from({length: 13}, (_, i) => <Box key={i} p={[-15 + i * 2, 3.4, -4.2]} s={[0.15, 0.15, 2.5]} m={m.beam} />)}
			{debris.map((d, i) => (
				<Box key={i} p={[d.x, d.s / 4, d.z]} s={[d.s, d.s / 2, d.s * 0.8]} m={m.debris} r={[0, d.ry, 0]} />
			))}
		</group>
	);
};

/** People sheltering in the corridor in the war: dark seated shapes by candlelight (no harm shown). */
export const Shelter: React.FC = () => {
	const m = useM();
	const people = useMemo(() => {
		const r = rng(77);
		return Array.from({length: 7}, (_, i) => ({x: -10 + i * 1.3 + r() * 0.4, small: r() < 0.35}));
	}, []);
	return (
		<group>
			{people.map((p, i) => (
				<group key={i} position={[p.x, 0, -5.0]} scale={p.small ? 0.65 : 1}>
					<Box p={[0, 0.35, 0]} s={[0.4, 0.7, 0.35]} m={m.shelter} />
					<mesh position={[0, 0.85, 0]} material={m.shelter}>
						<sphereGeometry args={[0.13, 6, 5]} />
					</mesh>
				</group>
			))}
			{[-9.2, -6.0, -3.2].map((x) => (
				<group key={x} position={[x, 0, -4.3]}>
					<Box p={[0, 0.08, 0]} s={[0.05, 0.16, 0.05]} m={m.candle} />
					<mesh position={[0, 0.2, 0]} material={m.flame}>
						<coneGeometry args={[0.022, 0.07, 5]} />
					</mesh>
				</group>
			))}
		</group>
	);
};

/** The ruin from outside, the hill, the pines, drifting fog. candleUp: a candle lit in an upper window. */
export const Exterior: React.FC<{t: number; candleUp: boolean}> = ({t, candleUp}) => {
	const m = useM();
	const pines = useMemo(() => {
		const r = rng(2020);
		const out: {x: number; z: number; h: number}[] = [];
		for (let i = 0; i < 46; i++) {
			const x = -45 + r() * 90, z = -30 + r() * 70;
			if (x > -19 && x < 15 && z > -9 && z < 12) continue;
			out.push({x, z, h: 9 + r() * 9});
		}
		return out;
	}, []);
	const gy = (z: number) => (z > 4 ? -(z - 4) * 0.35 : 0);
	return (
		<group>
			{/* the hill: a terrace for the building, falling away in front */}
			<Box p={[0, -0.1, -10]} s={[120, 0.2, 40]} m={m.ground} />
			<mesh position={[0, -4, 24]} rotation={[-0.34, 0, 0]} material={m.ground}>
				<boxGeometry args={[120, 0.2, 42]} />
			</mesh>
			{/* the building: long white walls, two storeys, roofless; the windows black */}
			{[3.2, -6].map((z) => (
				<WallX key={z} z={z} x0={-16} x1={12} h={8} holes={Array.from({length: 9}, (_, i) => [-14.5 + i * 3, -13.3 + i * 3, 1.2, 3.2] as [number, number, number, number]).concat(Array.from({length: 9}, (_, i) => [-14.5 + i * 3, -13.3 + i * 3, 5.0, 7.0] as [number, number, number, number]).filter(() => false))} m={m.outer} t={0.35} />
			))}
			{/* upper-storey window voids drawn as black insets on the facade */}
			{Array.from({length: 9}, (_, i) => (
				<Box key={i} p={[-13.9 + i * 3, 6.0, 3.39]} s={[1.2, 2.0, 0.05]} m={m.black} />
			))}
			{candleUp && (
				<mesh position={[-1.9, 5.6, 3.42]}>
					<sphereGeometry args={[0.07, 5, 4]} />
					<meshBasicMaterial color="#ffc060" />
				</mesh>
			)}
			{[-16, 12].map((x) => (
				<Box key={x} p={[x, 4, -1.4]} s={[0.35, 8, 9.2]} m={m.outer} />
			))}
			{/* broken tops of the walls (no roof) */}
			{Array.from({length: 10}, (_, i) => (
				<Box key={`c${i}`} p={[-15 + i * 3, 8.1 + (i % 3) * 0.25, 3.2]} s={[1.6, 0.4 + (i % 2) * 0.4, 0.36]} m={m.outer} />
			))}
			{/* the central entrance block */}
			<Box p={[-2, 5, 4.6]} s={[4.2, 10, 2.8]} m={m.outer} />
			<Box p={[-2, 1.4, 6.02]} s={[1.6, 2.8, 0.05]} m={m.black} />
			<Box p={[-2, 6.5, 6.02]} s={[1.0, 1.8, 0.05]} m={m.black} />
			{/* steps down the hill */}
			{Array.from({length: 8}, (_, i) => <Box key={`st${i}`} p={[-2, -0.15 - i * 0.35, 6.5 + i * 0.9]} s={[4, 0.3, 0.9]} m={m.outer} />)}
			{pines.map((p, i) => (
				<group key={i} position={[p.x, gy(p.z), p.z]}>
					<Box p={[0, p.h * 0.25, 0]} s={[0.35, p.h * 0.5, 0.35]} m={m.trunk} />
					{[0, 1, 2, 3].map((k) => (
						<mesh key={k} position={[0, p.h * (0.35 + k * 0.16), 0]} material={k % 2 ? m.pine : m.pineDark}>
							<coneGeometry args={[p.h * (0.2 - k * 0.04), p.h * 0.28, 7]} />
						</mesh>
					))}
				</group>
			))}
			{/* drifting fog banks */}
			{Array.from({length: 7}, (_, i) => (
				<mesh key={`f${i}`} position={[-30 + ((i * 13 + t * 0.6) % 70), 1.5 + (i % 3) * 1.6, -2 + i * 4]} material={m.fog}>
					<planeGeometry args={[28, 6]} />
				</mesh>
			))}
		</group>
	);
};
