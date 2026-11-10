// Episode 5 world: "Nine Hikers, One Cut Tent" (Dyatlov Pass, 1959). One consistent slope.
//
// Layout (metres, y up). The slope falls towards +z at about 18 degrees: ground height
// is gy(z) = -0.325 z (scaled down from the real ~1.5 km so it fits one world).
//   The tent sits at the origin, its long axis along x, the cut side facing downhill (+z).
//   The ridge and the slab that could have released are uphill (-z, around z -10..-60).
//   Nine lines of prints run downhill from the tent to the treeline (z ~ 105).
//   The cedar with the small dead fire stands at (6, gy(112), 112); the ravine runs
//   along x at z ~ 128, to the east of the cedar.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1, rng} from '../ps1';
import {SNAP6} from '../ep01/world';
import {tex} from '../ep02/world';

const M = (color: string, opts: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...opts}), 20, SNAP6);
const B = (color: string, opts: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...opts}), 20, SNAP6);

export const SLOPE = Math.atan(0.325);
export const gy = (z: number) => -0.325 * z;

const useMats = () =>
	useMemo(() => {
		const snow = tex(32, 32, (g, r) => {
			g.fillStyle = '#d0d4de';
			g.fillRect(0, 0, 32, 32);
			for (let i = 0; i < 160; i++) {
				g.fillStyle = r() > 0.5 ? '#dce0e8' : '#bcc0cc';
				g.fillRect(Math.floor(r() * 32), Math.floor(r() * 32), 3, 1);
			}
		}, 51, [60, 60]);
		const canvas = tex(16, 16, (g, r) => {
			g.fillStyle = '#8a8466';
			g.fillRect(0, 0, 16, 16);
			for (let y = 0; y < 16; y += 2) {
				g.fillStyle = '#7e785c';
				g.fillRect(0, y, 16, 1);
			}
			for (let i = 0; i < 14; i++) {
				g.fillStyle = r() > 0.5 ? '#96906e' : '#6e6a52';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 2, 1);
			}
		}, 52, [3, 2]);
		const bark = tex(8, 16, (g, r) => {
			g.fillStyle = '#4a3828';
			g.fillRect(0, 0, 8, 16);
			for (let i = 0; i < 12; i++) {
				g.fillStyle = r() > 0.5 ? '#3a2c20' : '#5a4632';
				g.fillRect(Math.floor(r() * 8), Math.floor(r() * 16), 1, 3);
			}
		}, 53, [1, 4]);
		return {
			snow: M('#ffffff', {map: snow}),
			canvas: M('#ffffff', {map: canvas, side: THREE.DoubleSide}),
			canvasIn: M('#ffffff', {map: canvas, side: THREE.DoubleSide}),
			pole: M('#5a4a34'),
			bark: M('#ffffff', {map: bark}),
			pine: M('#18261e'),
			pineSnow: M('#c4ccd6'),
			rock: M('#3a3c40'),
			char: M('#141210'),
			ember: B('#2a1208'),
			boot: M('#2a2420'),
			bootLight: M('#4a3c30'),
			blade: B('#dfe4ec'),
			skin: M('#b88a6e'),
			sleeve: M('#3a4a5a'),
			print: B('#3a4458'),
			water: B('#10161e'),
			torch: B('#ffc070'),
			paper: M('#d8d2bc'),
			desk: M('#3e3226'),
			slab: M('#e4e8f0'),
			black: B('#000000'),
		};
	}, []);

export type Mats = ReturnType<typeof useMats>;
const MatsContext = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(MatsContext)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <MatsContext.Provider value={useMats()}>{children}</MatsContext.Provider>;

export const Box: React.FC<{p: [number, number, number]; s: [number, number, number]; m: THREE.Material; r?: [number, number, number]}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={s} />
	</mesh>
);

export const HIKER = {skin: '#b88a6e', hair: '#2a2420', top: '#3a4a5a', legs: '#2a2a30'};

// ------------------------------------------------------------------ the tent

/** A low ridge tent, 4 m long along x, 1.9 m wide, 1.2 m high. open: how far the cut gapes (0..1). */
export const Tent: React.FC<{open: number; buried: number; flap: number}> = ({open, buried, flap}) => {
	const mm = useM();
	const half = 0.95, h = 1.2, len = 4.0;
	const ang = Math.atan2(h, half);
	const side = Math.hypot(half, h);
	// the downhill (+z) panel is split by a vertical cut at x = 0.4; each half swings out
	const gap = open * 0.18;
	return (
		<group position={[0, gy(0) + 0.02, 0]}>
			{/* uphill panel */}
			<group position={[0, h / 2, -half / 2]} rotation={[Math.PI / 2 - ang, 0, 0]}>
				<Box p={[0, 0, 0]} s={[len, side, 0.02]} m={mm.canvas} />
			</group>
			{/* downhill panel, in two pieces either side of the cut */}
			<group position={[0, h / 2, half / 2]} rotation={[-(Math.PI / 2 - ang), 0, 0]}>
				<group position={[-len / 2, 0, 0]} rotation={[0, gap * 0.25, flap * 0.04]}>
					<Box p={[(len / 2 + 0.4) / 2 - gap * 0.2, 0, 0]} s={[len / 2 + 0.4 - gap * 0.4, side, 0.02]} m={mm.canvas} />
				</group>
				<group position={[len / 2, 0, 0]} rotation={[0, -gap * 0.25, -flap * 0.04]}>
					<Box p={[-(len / 2 - 0.4) / 2 + gap * 0.2, 0, 0]} s={[len / 2 - 0.4 - gap * 0.4, side, 0.02]} m={mm.canvas} />
				</group>
			</group>
			{/* ends, poles, ridge line, floor */}
			{[-len / 2, len / 2].map((x) => (
				<mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={mm.canvas}>
					<shapeGeometry args={[new THREE.Shape([new THREE.Vector2(-half, 0), new THREE.Vector2(half, 0), new THREE.Vector2(0, h)])]} />
				</mesh>
			))}
			{[-len / 2 - 0.05, len / 2 + 0.05].map((x) => (
				<Box key={x} p={[x, h / 2, 0]} s={[0.05, h, 0.05]} m={mm.pole} />
			))}
			<Box p={[0, 0.01, 0]} s={[len, 0.02, half * 2]} m={mm.canvas} />
			{/* drifted snow burying the uphill side */}
			{buried > 0 && (
				<mesh position={[0, 0.1, -0.9]} material={mm.snow} scale={[2.6, 0.7 * buried, 1.1]}>
					<icosahedronGeometry args={[1, 1]} />
				</mesh>
			)}
			{/* the boots, left inside in a row */}
			{[-1.5, -1.25, -1.0, -0.75, -0.5, -0.25, 0.0, 0.25, 0.5].map((x, i) => (
				<group key={x} position={[x + 0.6, 0.06, 0.55]}>
					<Box p={[0, 0.05, 0]} s={[0.1, 0.12, 0.24]} m={i % 2 ? mm.boot : mm.bootLight} />
					<Box p={[0, 0.16, -0.06]} s={[0.1, 0.16, 0.1]} m={i % 2 ? mm.boot : mm.bootLight} />
				</group>
			))}
		</group>
	);
};

// ------------------------------------------------------------------ the slope, prints, forest, cedar, ravine

/** Nine lines of prints from the tent downhill to the treeline. */
export const trails = (() => {
	const r = rng(59);
	const out: {x: number; z: number; a: number}[][] = [];
	for (let k = 0; k < 9; k++) {
		const pts: {x: number; z: number; a: number}[] = [];
		const x0 = -1.2 + k * 0.32;
		let x = x0;
		for (let z = 1.6; z < 104; z += 0.55) {
			x += (r() - 0.5) * 0.12 + (k - 4) * 0.004 + Math.sin(z * 0.05 + k) * 0.02;
			pts.push({x: x + ((pts.length % 2) - 0.5) * 0.16, z, a: (r() - 0.5) * 0.3});
		}
		out.push(pts);
	}
	return out;
})();

export const Slope: React.FC<{printsOn: boolean}> = ({printsOn}) => {
	const mm = useM();
	const pgeo = useMemo(() => new THREE.PlaneGeometry(0.15, 0.32), []);
	const trees = useMemo(() => {
		const r = rng(63);
		const out: {x: number; z: number; s: number}[] = [];
		for (let i = 0; i < 300; i++) {
			const x = (r() - 0.5) * 220;
			const z = 100 + r() * 90;
			if (Math.abs(x - 6) < 5 && Math.abs(z - 112) < 5) continue;
			if (z > 110 && z < 142 && x > 10 && x < 50) continue;
			out.push({x, z, s: 0.7 + r() * 0.8});
		}
		return out;
	}, []);
	const prints = useMemo(() => trails.flat(), []);
	return (
		<group>
			{/* the slope: one long tilted slab, then the ridge behind the tent */}
			<mesh position={[0, gy(60) - 1, 60]} rotation={[SLOPE, 0, 0]} material={mm.snow}>
				<boxGeometry args={[400, 2, 360]} />
			</mesh>
			<mesh position={[0, 26, -80]} rotation={[-0.25, 0, 0]} material={mm.snow}>
				<boxGeometry args={[400, 2, 80]} />
			</mesh>
			<Box p={[0, -0.25, 0]} s={[5.4, 0.5, 3.2]} m={mm.snow} />
			{/* rocks on the ridge */}
			{printsOn &&
				prints.map((p, i) => (
					<mesh key={i} geometry={pgeo} material={mm.print} position={[p.x, gy(p.z) + 0.1, p.z]} rotation={[-Math.PI / 2 + SLOPE, 0, p.a]} />
				))}
			{trees.map((t, i) => (
				<group key={i} position={[t.x, gy(t.z) - 0.2, t.z]} scale={t.s}>
					<Box p={[0, 1, 0]} s={[0.35, 2, 0.35]} m={mm.bark} />
					<mesh position={[0, 4.4, 0]} material={mm.pine}>
						<coneGeometry args={[1.8, 6, 6]} />
					</mesh>
					<mesh position={[0, 7.4, 0]} material={mm.pineSnow}>
						<coneGeometry args={[0.9, 2.4, 6]} />
					</mesh>
				</group>
			))}
		</group>
	);
};

/** The cedar: a tall bare trunk with branches broken off high up, and the small dead fire. */
export const Cedar: React.FC = () => {
	const mm = useM();
	const z = 112, base = gy(112);
	return (
		<group position={[6, base, z]}>
			<Box p={[0, 4, 0]} s={[0.7, 8, 0.7]} m={mm.bark} />
			{/* broken branch stubs up to about 5 m */}
			{[1.8, 2.6, 3.3, 4.1, 4.8].map((y, i) => (
				<Box key={y} p={[Math.cos(i * 2.1) * 0.5, y, Math.sin(i * 2.1) * 0.5]} s={[0.5, 0.1, 0.1]} m={mm.bark} r={[0, i * 2.1, 0.3]} />
			))}
			{/* living crown above */}
			<mesh position={[0, 9.5, 0]} material={mm.pine}>
				<coneGeometry args={[3.2, 6, 7]} />
			</mesh>
			<mesh position={[0, 12, 0]} material={mm.pineSnow}>
				<coneGeometry args={[1.6, 2.8, 7]} />
			</mesh>
			{/* fallen branches in the snow */}
			{[[-1.4, 1.2, 0.4], [1.2, 1.8, -0.6], [-0.4, 2.4, 1.1]].map(([x, zz, a], i) => (
				<Box key={i} p={[x, 0.08, zz]} s={[1.4, 0.08, 0.08]} m={mm.bark} r={[0, a, 0]} />
			))}
			{/* the small dead fire: a ring of stones and charred sticks */}
			<group position={[1.5, 0.05, 1.6]}>
				{new Array(7).fill(0).map((_, i) => (
					<mesh key={i} position={[Math.cos((i / 7) * Math.PI * 2) * 0.45, 0.06, Math.sin((i / 7) * Math.PI * 2) * 0.45]} material={mm.rock} scale={[0.14, 0.1, 0.12]}>
						<icosahedronGeometry args={[1, 0]} />
					</mesh>
				))}
				{[0, 1, 2].map((i) => (
					<Box key={i} p={[0, 0.06, 0]} s={[0.6, 0.06, 0.06]} m={mm.char} r={[0, i * 1.05, 0.1]} />
				))}
				<Box p={[0, 0.02, 0]} s={[0.4, 0.02, 0.4]} m={mm.ember} />
			</group>
		</group>
	);
};

export const Ravine: React.FC<{thaw: number}> = ({thaw}) => {
	const mm = useM();
	const z = 128, base = gy(128);
	return (
		<group position={[30, base, z]}>
			{/* a gully: two steep snow banks either side of a dark, half-thawed stream */}
			<mesh position={[0, 0.6, -3.0]} material={mm.snow} scale={[26, 2.2, 2.6]}>
				<icosahedronGeometry args={[1, 1]} />
			</mesh>
			<mesh position={[0, 0.9, 3.0]} material={mm.snow} scale={[26, 2.6, 2.6]}>
				<icosahedronGeometry args={[1, 1]} />
			</mesh>
			<Box p={[0, 0.12, 0]} s={[46, 0.04, 2.2]} m={mm.water} />
			{thaw > 0 && [-12, -4, 6, 15].map((x) => <Box key={x} p={[x, 0.2, (x % 3) * 0.3]} s={[1.6 * thaw, 0.3, 0.9]} m={mm.rock} />)}
		</group>
	);
};

/** The slab above the tent: k = 0 in place, 1 = released and slid down onto the tent end. */
export const Slab: React.FC<{k: number}> = ({k}) => {
	const mm = useM();
	const z = -9 + k * 7.2;
	const crack = k > 0 ? 1 : 0;
	return (
		<group>
			{[-1.4, 0, 1.4].map((x, i) => (
				<group key={x} position={[x + (i - 1) * k * 0.3, gy(z) + 0.45 - k * 0.25 + Math.sin(k * 6 + i) * 0.05 * k, z + i * 0.2 * k]} rotation={[SLOPE + k * (i - 1) * 0.15, k * (i - 1) * 0.3, 0]}>
					<Box p={[0, 0, 0]} s={[1.3, 0.6, 2.4]} m={mm.slab} />
				</group>
			))}
			{/* the fracture line in the snow above it */}
			<Box p={[0, gy(-10.3) + 0.3, -10.3]} s={[4.6, 0.1 + crack * 0.1, 0.05 + crack * 0.2]} m={mm.char} r={[SLOPE, 0, 0]} />
		</group>
	);
};

/** One hand holding a knife, pushing the blade down the inside of the canvas. */
export const KnifeHand: React.FC<{p: [number, number, number]}> = ({p}) => {
	const mm = useM();
	return (
		<group position={p}>
			{/* the blade is through the canvas; the hand grips it from the left, the arm runs off frame left */}
			<Box p={[0, 0.02, 0.03]} s={[0.012, 0.13, 0.03]} m={mm.blade} />
			<Box p={[0, -0.08, 0]} s={[0.03, 0.07, 0.03]} m={mm.boot} />
			<Box p={[-0.05, -0.08, -0.01]} s={[0.07, 0.07, 0.06]} m={mm.skin} />
			<Box p={[-0.26, -0.1, -0.06]} s={[0.36, 0.09, 0.09]} m={mm.sleeve} r={[0, 0.25, -0.12]} />
		</group>
	);
};

/** The case file on a desk. */
export const CaseFile: React.FC<{map: THREE.Texture}> = ({map}) => {
	const mm = useM();
	const m = useMemo(() => ps1(new THREE.MeshLambertMaterial({map}), 20, SNAP6), [map]);
	return (
		<group position={[200, 0, 200]}>
			<Box p={[0, -0.03, 0]} s={[2, 0.06, 1.4]} m={mm.desk} />
			<mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0.06]} material={m}>
				<planeGeometry args={[0.42, 0.56]} />
			</mesh>
		</group>
	);
};
