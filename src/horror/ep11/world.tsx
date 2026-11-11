// Episode 11 world: "The Passenger on Balete Drive" (reported urban legend, New Manila, Quezon City).
// One consistent set: a white Manila taxi (left-hand drive; Philippine traffic keeps right) and
// Balete Drive at night: a two-lane road between the high perimeter walls and gates of old New
// Manila compounds, mango and acacia trees over the walls, sodium street lights every 24 m, newer
// condominiums beyond, and the balete: a strangler fig with hanging aerial roots on the right
// (passenger) side, its canopy over the road.
//
// Coordinates (metres, y up): the taxi is fixed at the origin, facing +z; its floor is y = 0.25.
// The street moves past it: street-space z minus taxiZ(t) gives taxi space. Street furniture
// repeats every PERIOD metres, so the street is identical whenever taxiZ moves by a whole
// PERIOD (that is what makes the loop seamless; see Episode11.tsx).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1, rng} from '../ps1';
import {SNAP6} from '../ep01/world';

const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 20, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 20, SNAP6);

export const PERIOD = 24;
export const ROAD_W = 7;

const useMats = () =>
	useMemo(
		() => ({
			asphalt: lam('#34343a'),
			paint: lam('#8a8678'),
			curb: lam('#4a4844'),
			wall: lam('#8a8476'),
			wallTop: lam('#5a564c'),
			gate: lam('#1c1e1c'),
			leaf: lam('#2a4430'),
			leafDark: lam('#1c3020'),
			bark: lam('#564a3a'),
			root: lam('#7a6c56'),
			pole: lam('#2a2a2a'),
			sodium: bas('#ffb35a'),
			pool: bas('#ff9a3a', {transparent: true, opacity: 0.16, depthWrite: false}),
			condo: lam('#3e4048'),
			winLit: bas('#d8b878'),
			winDim: bas('#5a5a6a'),
			roof: lam('#5a4034'),
			// taxi
			body: lam('#d8d8d0'),
			sign: bas('#ffd84a'),
			head: bas('#fff4d8'),
			tail: bas('#c81818'),
			cab: lam('#3a3a3e'),
			seat: lam('#6a6258'),
			seatBack: lam('#5e564c'),
			dash: lam('#2a2a2e'),
			dashGlow: bas('#3ad08a'),
			trim: lam('#5a5a5e'),
			mirror: bas('#0a0c10'),
			bead: lam('#8a2a2a'),
			cross: lam('#c8b878'),
			petal: bas('#f4f2e8'),
			wet: bas('#0a0a0c', {transparent: true, opacity: 0.32, depthWrite: false}),
			driverSkin: lam('#7a5a44'),
			driverShirt: lam('#4e6680'),
			driverHair: lam('#0e0c0c'),
			glass: bas('#0c1018', {transparent: true, opacity: 0.25, depthWrite: false}),
		}),
		[],
	);
export type Mats = ReturnType<typeof useMats>;
const Ctx = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(Ctx)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMats()}>{children}</Ctx.Provider>;

export const Box: React.FC<{p: [number, number, number]; s: [number, number, number]; m: THREE.Material; r?: [number, number, number]}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={s} />
	</mesh>
);

/** The street segment for one period, in its own local z (0..PERIOD). `k` picks variations. */
const Segment: React.FC<{k: number}> = ({k}) => {
	const m = useM();
	const r = rng(1000 + (((k % 7) + 7) % 7) * 17);
	const gateL = r() < 0.5, gateR = r() < 0.5;
	const treeL = 4 + r() * 14, treeR = 4 + r() * 14;
	const condo = (((k % 3) + 3) % 3) === 0;
	const condoX = (r() < 0.5 ? -1 : 1) * (22 + r() * 10);
	const lampSide = k % 2 === 0 ? 1 : -1;
	return (
		<group>
			<Box p={[0, -0.05, PERIOD / 2]} s={[ROAD_W, 0.1, PERIOD]} m={m.asphalt} />
			<Box p={[0, 0.01, 4]} s={[0.12, 0.02, 3]} m={m.paint} />
			<Box p={[0, 0.01, 16]} s={[0.12, 0.02, 3]} m={m.paint} />
			{[-1, 1].map((sd) => (
				<group key={sd}>
					<Box p={[sd * (ROAD_W / 2 + 0.9), 0.08, PERIOD / 2]} s={[1.8, 0.16, PERIOD]} m={m.curb} />
					{/* the high perimeter wall of an old compound, with a gate on some segments */}
					{(sd < 0 ? gateL : gateR) ? (
						<>
							<Box p={[sd * 5.7, 1.4, 4.5]} s={[0.35, 2.8, 9]} m={m.wall} />
							<Box p={[sd * 5.7, 1.3, 11.5]} s={[0.12, 2.6, 5]} m={m.gate} />
							<Box p={[sd * 5.7, 1.4, 19]} s={[0.35, 2.8, 10]} m={m.wall} />
							<Box p={[sd * 5.7, 2.95, 8.9]} s={[0.5, 0.3, 0.5]} m={m.wallTop} />
							<Box p={[sd * 5.7, 2.95, 14.1]} s={[0.5, 0.3, 0.5]} m={m.wallTop} />
						</>
					) : (
						<Box p={[sd * 5.7, 1.4, PERIOD / 2]} s={[0.35, 2.8, PERIOD]} m={m.wall} />
					)}
					<Box p={[sd * 5.7, 2.85, PERIOD / 2]} s={[0.45, 0.1, PERIOD]} m={m.wallTop} />
					{/* a mango or acacia behind the wall */}
					<mesh position={[sd * 9, 5.5, sd < 0 ? treeL : treeR]} material={m.leaf} scale={[1.3, 0.75, 1.2]}>
						<dodecahedronGeometry args={[3.4, 0]} />
					</mesh>
					<Box p={[sd * 9, 2, sd < 0 ? treeL : treeR]} s={[0.4, 4, 0.4]} m={m.bark} />
					{/* an old house roof beyond the wall */}
					<mesh position={[sd * 13, 4.2, sd < 0 ? treeR : treeL]} rotation={[0, Math.PI / 4, 0]} material={m.roof}>
						<coneGeometry args={[5, 2.2, 4]} />
					</mesh>
				</group>
			))}
			{/* sodium street light and its pool on the road */}
			<Box p={[lampSide * 4.1, 3.2, 2]} s={[0.12, 6.4, 0.12]} m={m.pole} />
			<Box p={[lampSide * 3.3, 6.35, 2]} s={[1.6, 0.1, 0.12]} m={m.pole} />
			<Box p={[lampSide * 2.6, 6.25, 2]} s={[0.45, 0.12, 0.25]} m={m.sodium} />
			<mesh position={[lampSide * 2.2, 0.03, 2]} rotation={[-Math.PI / 2, 0, 0]} material={m.pool}>
				<circleGeometry args={[4.2, 12]} />
			</mesh>
			{condo && (
				<group position={[condoX, 0, 12]}>
					<Box p={[0, 18, 0]} s={[10, 36, 10]} m={m.condo} />
					{Array.from({length: 22}, (_, i) => {
						const fl = 2 + Math.floor(i / 2) * 3;
						const lit = rng(k * 31 + i)() < 0.4;
						return <Box key={i} p={[i % 2 ? 2.2 : -2.2, fl, -Math.sign(condoX) * 5.05]} s={[1.6, 1.1, 0.1]} m={lit ? m.winLit : m.winDim} />;
					})}
				</group>
			)}
		</group>
	);
};

/** All segments around the taxi, from 4 periods behind to 8 ahead. */
export const Street: React.FC<{taxiZ: number}> = ({taxiZ}) => {
	const k0 = Math.floor(taxiZ / PERIOD);
	return (
		<group>
			{Array.from({length: 13}, (_, i) => {
				const k = k0 - 4 + i;
				return (
					<group key={k} position={[0, 0, k * PERIOD - taxiZ]}>
						<Segment k={k} />
					</group>
				);
			})}
		</group>
	);
};

/** The nearest street light ahead of or beside the taxi, in taxi space (to place a real light). */
export const nearestLamp = (taxiZ: number): [number, number, number] => {
	let best: [number, number, number] = [0, 6, 100];
	let bd = 1e9;
	const k0 = Math.floor(taxiZ / PERIOD);
	for (let k = k0 - 1; k <= k0 + 2; k++) {
		const z = k * PERIOD + 2 - taxiZ;
		const d = Math.abs(z - 2);
		if (d < bd) {
			bd = d;
			best = [(k % 2 === 0 ? 1 : -1) * 2.6, 6.1, z];
		}
	}
	return best;
};

/** The balete: a strangler fig, a bundle of trunks, a wide low canopy over the road, aerial roots hanging like curtains. */
export const Balete: React.FC<{z: number; x?: number}> = ({z, x = 6.2}) => {
	const m = useM();
	const parts = useMemo(() => {
		const r = rng(5150);
		const trunks = Array.from({length: 10}, () => {
			const a = r() * Math.PI * 2, d = 0.4 + r() * 1.0;
			return {x: Math.cos(a) * d * 0.8, z: Math.sin(a) * d * 0.8, rad: 0.3 + r() * 0.3, h: 5 + r() * 1.5, lean: (r() - 0.5) * 0.3};
		});
		// aerial roots hang in curtains: clusters of strands from the low canopy, many reaching the ground
		const roots: {x: number; z: number; top: number; len: number; rad: number}[] = [];
		for (let c = 0; c < 26; c++) {
			const a = r() * Math.PI * 2, d = 1.6 + r() * 7;
			const cx = Math.max(-1.9, Math.cos(a) * d * 1.2 - 1.0), cz = Math.sin(a) * d; // roots stay off the road
			const top = 5.2 + r() * 2;
			for (let k = 0; k < 9; k++) {
				const len = r() < 0.6 ? top - 0.05 : 1.5 + r() * 3.5;
				roots.push({x: cx + (r() - 0.5) * 0.7, z: cz + (r() - 0.5) * 0.7, top, len, rad: 0.025 + r() * 0.045});
			}
		}
		const leaves = Array.from({length: 14}, () => ({x: (r() - 0.6) * 15, y: 6.6 + r() * 2.6, z: (r() - 0.5) * 14, s: 2.6 + r() * 2.4}));
		return {trunks, roots, leaves};
	}, []);
	return (
		<group position={[x, 0, z]}>
			{parts.trunks.map((t, i) => (
				<mesh key={i} position={[t.x, t.h / 2, t.z]} rotation={[t.lean, 0, -t.lean]} material={m.bark}>
					<cylinderGeometry args={[t.rad * 0.45, t.rad * 1.6, t.h, 7]} />
				</mesh>
			))}
			{parts.roots.map((t, i) => (
				<mesh key={i} position={[t.x, t.top - t.len / 2, t.z]} material={m.root}>
					<cylinderGeometry args={[t.rad, t.rad * 1.3, t.len, 4]} />
				</mesh>
			))}
			{parts.leaves.map((l, i) => (
				<mesh key={i} position={[l.x, l.y, l.z]} scale={[1.4, 0.6, 1.3]} material={i % 2 ? m.leaf : m.leafDark}>
					<dodecahedronGeometry args={[l.s, 0]} />
				</mesh>
			))}
		</group>
	);
};

/** Meter display texture: red seven-segment-ish digits on black, e.g. "P 45.00". */
export const meterTexture = (text: string, on: boolean) => {
	const c = document.createElement('canvas');
	c.width = 40;
	c.height = 12;
	const g = c.getContext('2d')!;
	g.fillStyle = '#060202';
	g.fillRect(0, 0, 40, 12);
	if (on) {
		g.fillStyle = '#ff3a2a';
		g.font = 'bold 10px "DejaVu Sans Mono", monospace';
		g.textBaseline = 'middle';
		g.fillText(text, 1, 6.5);
	}
	const t = new THREE.CanvasTexture(c);
	t.magFilter = THREE.NearestFilter;
	t.minFilter = THREE.NearestFilter;
	t.generateMipmaps = false;
	t.colorSpace = THREE.SRGBColorSpace;
	return t;
};

/**
 * The taxi, in taxi space. Interior: dashboard with a green glow and the meter, steering wheel on
 * the left, the driver, front seats, the back bench, the rear-view mirror with a rosary.
 * - rosary: swing angle (radians) and pull towards the back seat
 * - meter: the fare text; meterOn: lit
 * - petals: sampaguita petals on the back seat (always there: a hidden detail)
 * - wet: the wet ring where she sat
 * - exterior: draw the body shell (for outside shots)
 */
export const Taxi: React.FC<{rosary: number; pull: number; meter: string; meterOn: boolean; wet: number; exterior: boolean; driverTurn?: number}> = ({rosary, pull, meter, meterOn, wet, exterior, driverTurn = 0}) => {
	const m = useM();
	const tex = useMemo(() => meterTexture(meter, meterOn), [meter, meterOn]);
	const meterMat = useMemo(() => new THREE.MeshBasicMaterial({map: tex}), [tex]);
	const petals = useMemo(() => {
		const r = rng(808);
		return Array.from({length: 9}, () => ({x: 0.1 + r() * 0.35, z: -0.78 + r() * 0.2, ry: r() * 3}));
	}, []);
	const beads = 11;
	return (
		<group>
			{/* cab shell: floor, roof, pillars, door panels below the window line */}
			<Box p={[0, 0.25, 0]} s={[1.5, 0.06, 2.6]} m={m.cab} />
			<Box p={[0, 1.42, -0.1]} s={[1.5, 0.05, 2.1]} m={m.cab} />
			{[-1, 1].map((sd) => (
				<group key={sd}>
					<Box p={[sd * 0.74, 0.55, 0]} s={[0.04, 0.6, 2.4]} m={m.trim} />
					<Box p={[sd * 0.72, 1.12, 0.92]} s={[0.05, 0.6, 0.06]} m={m.cab} r={[-0.5, 0, 0]} />
					<Box p={[sd * 0.73, 1.1, -0.15]} s={[0.05, 0.62, 0.08]} m={m.cab} />
					<Box p={[sd * 0.72, 1.08, -1.05]} s={[0.05, 0.66, 0.16]} m={m.cab} r={[0.45, 0, 0]} />
				</group>
			))}
			{/* dashboard, its glow, the meter */}
			<Box p={[0, 0.82, 0.98]} s={[1.46, 0.22, 0.4]} m={m.dash} />
			<Box p={[-0.38, 0.94, 0.86]} s={[0.3, 0.025, 0.02]} m={m.dashGlow} />
			<Box p={[0.12, 0.93, 0.86]} s={[0.12, 0.02, 0.02]} m={m.dashGlow} />
			<mesh position={[0.32, 0.99, 0.82]} rotation={[-0.25, 0, 0]} material={meterMat}>
				<boxGeometry args={[0.2, 0.06, 0.004]} />
			</mesh>
			<mesh position={[-0.38, 0.95, 0.68]} rotation={[-1.1, 0, 0]} material={m.trim}>
				<torusGeometry args={[0.17, 0.02, 4, 12]} />
			</mesh>
			{/* front seats and the back bench */}
			{[-0.38, 0.38].map((x) => (
				<group key={x}>
					<Box p={[x, 0.48, 0.15]} s={[0.5, 0.12, 0.5]} m={m.seat} />
					<Box p={[x, 0.85, -0.12]} s={[0.5, 0.65, 0.12]} m={m.seatBack} r={[-0.12, 0, 0]} />
					<Box p={[x, 1.24, -0.16]} s={[0.26, 0.17, 0.1]} m={m.seatBack} />
				</group>
			))}
			<Box p={[0, 0.46, -0.72]} s={[1.36, 0.14, 0.52]} m={m.seat} />
			<Box p={[0, 0.8, -1.0]} s={[1.36, 0.64, 0.14]} m={m.seatBack} r={[-0.18, 0, 0]} />
			<Box p={[0, 1.02, -1.25]} s={[1.36, 0.06, 0.4]} m={m.trim} />
			{petals.map((p, i) => (
				<Box key={i} p={[p.x, 0.535, p.z]} s={[0.03, 0.006, 0.02]} m={m.petal} r={[0, p.ry, 0]} />
			))}
			{wet > 0 && (
				<mesh position={[-0.05, 0.534, -0.72]} rotation={[-Math.PI / 2, 0, 0]} material={m.wet} scale={0.45 + wet * 0.2}>
					<circleGeometry args={[0.2, 12]} />
				</mesh>
			)}
			{/* the driver: a working man in a polo shirt, seen from behind or in profile */}
			<group position={[-0.38, 0.5, 0.12]} rotation={[0, driverTurn, 0]}>
				<Box p={[0, 0.38, 0]} s={[0.42, 0.55, 0.24]} m={m.driverShirt} />
				<Box p={[0, 0.7, 0.02]} s={[0.1, 0.1, 0.1]} m={m.driverSkin} />
				<Box p={[0, 0.84, 0.02]} s={[0.19, 0.22, 0.21]} m={m.driverSkin} />
				<Box p={[0, 0.94, -0.01]} s={[0.2, 0.08, 0.22]} m={m.driverHair} />
				<Box p={[0, 0.86, -0.08]} s={[0.2, 0.16, 0.06]} m={m.driverHair} />
				<Box p={[0.18, 0.42, 0.25]} s={[0.08, 0.08, 0.42]} m={m.driverShirt} r={[0.3, 0, 0]} />
				<Box p={[-0.18, 0.42, 0.25]} s={[0.08, 0.08, 0.42]} m={m.driverShirt} r={[0.3, 0, 0]} />
			</group>
			{/* rear-view mirror and the rosary hanging from it */}
			<Box p={[0, 1.3, 0.74]} s={[0.26, 0.075, 0.03]} m={m.mirror} />
			<Box p={[0, 1.37, 0.76]} s={[0.03, 0.08, 0.03]} m={m.trim} />
			<group position={[0, 1.26, 0.72]} rotation={[rosary * 0.4 - pull, 0, rosary]}>
				{Array.from({length: beads}, (_, i) => (
					<Box key={i} p={[Math.sin(i * 0.6) * 0.012, -0.018 * (i + 1), 0]} s={[0.012, 0.012, 0.012]} m={m.bead} />
				))}
				<Box p={[0, -0.018 * beads - 0.03, 0]} s={[0.012, 0.05, 0.008]} m={m.cross} />
				<Box p={[0, -0.018 * beads - 0.02, 0]} s={[0.032, 0.01, 0.008]} m={m.cross} />
			</group>
			{exterior && (
				<group>
					<Box p={[0, 0.6, 1.75]} s={[1.62, 0.5, 1.1]} m={m.body} />
					<Box p={[0, 0.6, -1.6]} s={[1.62, 0.55, 0.9]} m={m.body} />
					<Box p={[-0.8, 0.55, 0]} s={[0.04, 0.5, 2.5]} m={m.body} />
					<Box p={[0.8, 0.55, 0]} s={[0.04, 0.5, 2.5]} m={m.body} />
					<Box p={[0, 1.44, -0.1]} s={[1.5, 0.04, 2.1]} m={m.body} />
					<Box p={[0, 1.56, -0.1]} s={[0.5, 0.18, 0.22]} m={m.sign} />
					{[-0.6, 0.6].map((x) => (
						<group key={x}>
							<Box p={[x, 0.66, 2.31]} s={[0.3, 0.12, 0.04]} m={m.head} />
							<Box p={[x, 0.7, -2.06]} s={[0.26, 0.12, 0.04]} m={m.tail} />
						</group>
					))}
				</group>
			)}
		</group>
	);
};
