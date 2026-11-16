// Episode 52 world: "The Branch" (Season 6; a utility lineman's night call in a South Texas colonia, retold
// from a reader-submitted account; no real company, town or family).
// - THE STREET: a dirt-edged road along x (z −3.5..3.5), small stucco houses behind chain-link at z −10..−15,
//   a sodium lamp at x −6, the utility pole at (3, z −4.5) with its transformer can, and the tree at
//   (5.6, z −6.4) with one thick branch reaching toward the pole at about 5.6 m.
// - THE TRUCK: a box-built bucket truck (white, no markings) at the curb, z −2.2, its boom from the bed to
//   the bucket, a work light on the bucket.
// - IT: on the branch, the user's PSX Character_05, grey, perched with its knees bent the wrong way, half
//   grown into an owl: feathers that follow its bones (instanced), wings that unfold from its arms far too
//   long, talons on its toes, and skin that splits where the quills come through.
import React, {createContext, useContext, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {useFrame, useThree} from '@react-three/fiber';
import {ps1} from '../ps1';
import {SNAP6} from '../ep01/world';
import {merge, Pose, PsxCharacter} from '../psx/models';
import {Box, tex} from '../ep41/world';

export type V3 = [number, number, number];
const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 64, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 64, SNAP6);

export const POLE: V3 = [3, 0, -4.5];
export const TREE: V3 = [5.6, 0, -6.4];
export const PERCH: V3 = [4.4, 5.55, -5.3]; // where its feet grip the branch
export const PIVOT: V3 = [1.7, 2.3, -2.2]; // the boom's foot on the truck bed
export const BUCKET_UP: V3 = [3.35, 5.25, -3.25]; // the bucket's floor, raised beside the pole
export const BUCKET_DOWN: V3 = [2.6, 1.6, -2.2];

const useMatsInner = () =>
	useMemo(() => {
		const dirt = tex(16, 16, (g) => {
			g.fillStyle = '#6a5c48';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 60; i++) {
				g.fillStyle = i % 3 ? '#5a4c3a' : '#7a6c56';
				g.fillRect((i * 7) % 16, (i * 11) % 16, 1, 1);
			}
		}, [30, 6]);
		const asphalt = tex(16, 16, (g) => {
			g.fillStyle = '#3a3a3c';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 50; i++) {
				g.fillStyle = i % 2 ? '#2e2e30' : '#48484a';
				g.fillRect((i * 5) % 16, (i * 13) % 16, 1, 1);
			}
		}, [40, 3]);
		const stucco = (base: string) =>
			tex(16, 16, (g) => {
				g.fillStyle = base;
				g.fillRect(0, 0, 16, 16);
				for (let i = 0; i < 24; i++) {
					g.fillStyle = i % 2 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.06)';
					g.fillRect((i * 7) % 16, (i * 5) % 16, 2, 1);
				}
			}, [3, 2]);
		const fence = tex(16, 16, (g) => {
			g.clearRect(0, 0, 16, 16);
			g.strokeStyle = 'rgba(170,170,170,0.9)';
			g.lineWidth = 1;
			for (let i = -16; i < 32; i += 4) {
				g.beginPath();
				g.moveTo(i, 0);
				g.lineTo(i + 16, 16);
				g.stroke();
				g.beginPath();
				g.moveTo(i + 16, 0);
				g.lineTo(i, 16);
				g.stroke();
			}
		}, [20, 1]);
		const bark = tex(16, 16, (g) => {
			g.fillStyle = '#3a2e24';
			g.fillRect(0, 0, 16, 16);
			for (let x = 0; x < 16; x += 3) {
				g.fillStyle = '#2a2018';
				g.fillRect(x, 0, 1, 16);
			}
			for (let i = 0; i < 20; i++) {
				g.fillStyle = '#4a3c30';
				g.fillRect((i * 7) % 16, (i * 11) % 16, 1, 2);
			}
		}, [2, 4]);
		const leaves = tex(32, 32, (g) => {
			g.fillStyle = '#1e2a16';
			g.fillRect(0, 0, 32, 32);
			let s = 3;
			const r = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
			for (let i = 0; i < 380; i++) {
				g.fillStyle = ['#2c3c1e', '#3a4e28', '#142010', '#46602e'][i % 4];
				g.fillRect(Math.floor(r() * 32), Math.floor(r() * 32), 1 + (i % 2), 1);
			}
		}, [3, 3]);
		const feather = tex(8, 32, (g) => {
			g.clearRect(0, 0, 8, 32);
			// a vane, barred dark and pale, its shaft down the middle, a dark tip
			for (let y = 0; y < 32; y++) {
				const w = Math.max(1, Math.round(4 * Math.sin((Math.PI * (y + 3)) / 35)));
				// soft, ragged and dark (the barred vane read as a checkerboard at this size)
				g.fillStyle = ['#2a2219', '#2f261c', '#251e16', '#33291e'][(y * 7) % 4];
				if (y > 24) g.fillStyle = '#120e0a';
				if ((y * 13) % 5 === 0) g.fillStyle = '#1a140f';
				g.fillRect(4 - w, y, w * 2, 1);
			}
			g.fillStyle = '#3e3428';
			g.fillRect(4, 0, 1, 25);
		});
		const curtain = tex(8, 8, (g) => {
			g.fillStyle = '#e8a050';
			g.fillRect(0, 0, 8, 8);
			g.fillStyle = '#c87830';
			for (let x = 0; x < 8; x += 2) g.fillRect(x, 0, 1, 8);
		});
		return {
			dirt: lam('#ffffff', {map: dirt}),
			asphalt: lam('#ffffff', {map: asphalt}),
			houses: ['#c89a7a', '#7aa4a0', '#d8d0c0', '#b0a8c8'].map((c) => lam('#ffffff', {map: stucco(c)})),
			roof: lam('#3a3634'),
			fence: lam('#ffffff', {map: fence, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide}),
			bark: lam('#ffffff', {map: bark}),
			leaves: lam('#ffffff', {map: leaves}),
			pole: lam('#5a4a3a'),
			can: lam('#8a8e90'),
			wire: bas('#1a1a1a'),
			lamp: bas('#ffb050'),
			white: lam('#e4e2dc'),
			yellow: lam('#d8b030'),
			dark: lam('#1c1c1e'),
			glass: bas('#1a2230'),
			lit: bas('#ffffff', {map: curtain}),
			black: bas('#050505'),
			wingFeather: lam('#e0d4bc', {map: feather, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide}),
			feather: lam('#8a8070', {map: feather, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide}),
			talon: lam('#1a1612'),
			blood: bas('#7a0806'),
			vest: lam('#d8e020'),
			hat: lam('#e8e4d8'),
			worklight: bas('#fff8e8'),
		};
	}, []);
type Mats = ReturnType<typeof useMatsInner>;
const Ctx = createContext<Mats | null>(null);
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMatsInner()}>{children}</Ctx.Provider>;
export const useM = () => useContext(Ctx)!;

/** a cylinder from a to b (for the branch, wires) */
export const Rod: React.FC<{a: V3; b: V3; r: number; m: THREE.Material; seg?: number}> = ({a, b, r, m, seg = 6}) => {
	const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
	const d = B.clone().sub(A);
	const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
	return (
		<mesh position={A.clone().add(B).multiplyScalar(0.5).toArray() as V3} quaternion={q} material={m}>
			<cylinderGeometry args={[r * 0.8, r, d.length(), seg, 1]} />
		</mesh>
	);
};

// ------------------------------------------------------------------ the street
const HOUSES = [
	{x: -12, w: 6, c: 0, cur: 0.2},
	{x: -4.5, w: 6.5, c: 1, cur: 0.6},
	{x: 4.5, w: 7, c: 2, cur: 0.0},
	{x: 13, w: 6, c: 3, cur: 0.4},
	{x: 21, w: 6, c: 0, cur: 0.8},
];
/** curtain: 0..1, how far one curtain in the second house is pulled aside (someone watching) */
export const Street: React.FC<{curtain?: number}> = ({curtain = 0}) => {
	const M = useM();
	return (
		<group>
			<Box p={[0, -0.05, 0]} s={[90, 0.1, 7]} m={M.asphalt} />
			<Box p={[0, -0.04, -9]} s={[90, 0.1, 11]} m={M.dirt} />
			<Box p={[0, -0.04, 9]} s={[90, 0.1, 11]} m={M.dirt} />
			{HOUSES.map((h, i) => (
				<group key={i} position={[h.x, 0, -13]}>
					<Box p={[0, 1.5, 0]} s={[h.w, 3, 5]} m={M.houses[h.c]} />
					<Box p={[0, 3.08, 0.2]} s={[h.w + 0.4, 0.16, 5.6]} m={M.roof} />
					{/* two windows: dark glass, one lit with a curtain */}
					<mesh position={[-h.w * 0.25, 1.5, 2.51]} material={M.glass}>
						<planeGeometry args={[1.0, 0.9]} />
					</mesh>
					<mesh position={[h.w * 0.22, 1.5, 2.51]} material={i === 1 || i === 3 ? M.lit : M.glass}>
						<planeGeometry args={[1.0, 0.9]} />
					</mesh>
					{i === 1 && (
						// the curtain pulled aside: a dark gap, and a pale face-height smudge in it
						<group position={[h.w * 0.22 - 0.3 + 0.25 * curtain, 1.5, 2.52]}>
							<mesh material={M.black}>
								<planeGeometry args={[0.5 * curtain + 0.001, 0.9]} />
							</mesh>
						</group>
					)}
					<Box p={[0, 0.9, 2.51]} s={[0.9, 1.8, 0.04]} m={M.dark} />
					{/* the chain-link fence along the front of the yard */}
					<mesh position={[0, 0.6, 5.2]} material={M.fence}>
						<planeGeometry args={[h.w + 1.5, 1.2]} />
					</mesh>
				</group>
			))}
			{/* a porch light at the house behind the pole */}
			<mesh position={[4.5, 2.4, -10.45]} material={M.lamp}>
				<boxGeometry args={[0.15, 0.15, 0.1]} />
			</mesh>
			{/* the sodium lamp down the street */}
			<Box p={[-6, 3.3, -3.8]} s={[0.16, 6.6, 0.16]} m={M.pole} />
			<Box p={[-6, 6.55, -3.2]} s={[0.12, 0.1, 1.2]} m={M.pole} />
			<mesh position={[-6, 6.45, -2.7]} material={M.lamp}>
				<boxGeometry args={[0.3, 0.1, 0.4]} />
			</mesh>
			{/* the utility pole and its transformer, wires to the houses */}
			<Box p={[POLE[0], 4.6, POLE[2]]} s={[0.26, 9.2, 0.26]} m={M.pole} />
			<Box p={[POLE[0], 8.3, POLE[2]]} s={[2.4, 0.14, 0.14]} m={M.pole} />
			<mesh position={[POLE[0] + 0.32, 7.4, POLE[2]]} material={M.can}>
				<cylinderGeometry args={[0.26, 0.26, 0.8, 8]} />
			</mesh>
			<Rod a={[POLE[0] - 1.1, 8.38, POLE[2]]} b={[-20, 8.0, -4.5]} r={0.012} m={M.wire} seg={3} />
			<Rod a={[POLE[0] + 1.1, 8.38, POLE[2]]} b={[30, 8.0, -4.5]} r={0.012} m={M.wire} seg={3} />
			<Rod a={[POLE[0] + 0.3, 7.8, POLE[2]]} b={[4.5, 3.0, -10.6]} r={0.012} m={M.wire} seg={3} />
			<Tree />
		</group>
	);
};

const Tree: React.FC = () => {
	const M = useM();
	const blobs = useMemo(() => {
		const out: {p: V3; s: V3}[] = [];
		let s = 11;
		const r = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
		for (let i = 0; i < 26; i++) {
			const a = r() * Math.PI * 2;
			const d = 1.2 + r() * 2.4;
			const p: V3 = [TREE[0] + Math.cos(a) * d, 5.4 + r() * 3.2, TREE[2] + Math.sin(a) * d];
			// keep a hollow round the branch and the creature, so it is seen from the bucket
			if (Math.hypot(p[0] - PERCH[0], p[1] - (PERCH[1] + 0.6), p[2] - PERCH[2]) < 1.8) continue;
			out.push({p, s: [1.2 + r(), 0.8 + r() * 0.7, 1.2 + r()]});
		}
		return out;
	}, []);
	return (
		<group>
			<Rod a={[TREE[0], 0, TREE[2]]} b={[TREE[0] - 0.2, 6.8, TREE[2] + 0.1]} r={0.36} m={M.bark} />
			{/* the branch toward the pole, and a smaller fork */}
			<Rod a={[TREE[0] - 0.1, 4.5, TREE[2] + 0.05]} b={[PERCH[0] - 0.8, PERCH[1] - 0.05, PERCH[2] + 0.6]} r={0.17} m={M.bark} />
			{blobs.map((b, i) => (
				<Box key={i} p={b.p} s={b.s} m={M.leaves} />
			))}
		</group>
	);
};

// ------------------------------------------------------------------ the truck
export const Truck: React.FC<{p: V3; bucket: V3; light?: boolean; boomOnly?: boolean}> = ({p, bucket, light, boomOnly}) => {
	const M = useM();
	const piv: V3 = [p[0] + PIVOT[0], PIVOT[1], p[2]];
	return (
		<group>
			<group position={p} visible={!boomOnly}>
				<Box p={[-1.3, 1.05, 0]} s={[1.9, 1.7, 2.1]} m={M.white} />
				<Box p={[-2.15, 0.8, 0]} s={[0.4, 0.9, 2.0]} m={M.white} />
				<mesh position={[-2.36, 1.45, 0]} rotation={[0, -Math.PI / 2, 0]} material={M.glass}>
					<planeGeometry args={[1.7, 0.6]} />
				</mesh>
				<Box p={[1.4, 1.05, 0]} s={[3.6, 0.9, 2.2]} m={M.white} />
				<Box p={[1.4, 0.5, 0]} s={[5.6, 0.25, 2.0]} m={M.dark} />
				{[-1.5, 2.4].map((x) =>
					[-1, 1].map((z) => (
						<mesh key={`${x}${z}`} position={[x, 0.42, z * 1.02]} rotation={[Math.PI / 2, 0, 0]} material={M.dark}>
							<cylinderGeometry args={[0.42, 0.42, 0.28, 10]} />
						</mesh>
					)),
				)}
				{/* amber beacon on the cab */}
				<Box p={[-1.3, 1.98, 0]} s={[0.3, 0.14, 0.3]} m={M.yellow} />
			</group>
			{/* the boom: foot, elbow, bucket */}
			<Rod a={piv} b={[bucket[0], bucket[1] + 0.2, bucket[2]]} r={0.14} m={M.yellow} seg={6} />
			<group position={bucket}>
				<Box p={[0, 0.5, 0]} s={[0.85, 1.0, 0.85]} m={M.white} />
				<Box p={[0, 1.02, 0]} s={[0.9, 0.06, 0.9]} m={M.yellow} />
				{light && (
					<mesh position={[0.3, 1.2, -0.3]} material={M.worklight}>
						<boxGeometry args={[0.18, 0.12, 0.08]} />
					</mesh>
				)}
			</group>
		</group>
	);
};

// ------------------------------------------------------------------ it
/** turn: 0..1 its head round to the light (an owl's swivel, 180°); open: 0..1 its arms out into wings;
 *  grow: 0..1 the quills pushed through on its arms; split: 0..1 the skin splitting on its forearm */
export type ItPose = {turn: number; open: number; grow: number; split: number; tilt?: number; lean?: number};
const BN = ['Hips', 'Spine2', 'Neck', 'Head', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand', 'LeftToeBase', 'RightToeBase', 'LeftFoot', 'RightFoot'] as const;
const B: Record<string, THREE.Vector3> & {ready?: boolean} = Object.fromEntries(BN.map((n) => [n, new THREE.Vector3()]));
export const itBones = B;
const ITH = 1.75;
export const It: React.FC<{p: V3; ry: number; pose: ItPose; t: number}> = ({p, ry, pose, t}) => {
	const {turn, open, tilt = 0, lean = 0} = pose;
	const breathe = 0.04 * Math.sin(t * 2.2);
	const st = 1 + 0.5 * open; // the arms lengthen as they open
	const P: Pose = merge(
		{
			// perched: thighs back and down, shins forward (its knees bent the wrong way), hunched over
			LeftUpLeg: [['aim', [0.2, -0.55, -0.9]]],
			RightUpLeg: [['aim', [-0.2, -0.55, -0.9]]],
			LeftLeg: [['aim', [0.05, -0.75, 0.8]]],
			RightLeg: [['aim', [-0.05, -0.75, 0.8]]],
			LeftFoot: [['aim', [0.05, -0.3, 1]]],
			RightFoot: [['aim', [-0.05, -0.3, 1]]],
			Spine: [['x', 0.45 + lean + breathe]],
			Spine1: [['x', 0.25]],
			Spine2: [['x', 0.15 - 0.2 * open]],
			Neck: [['x', -0.6], ['y', -Math.PI * 0.27 * turn]],
			Head: [['x', -0.15], ['y', -Math.PI * 0.27 * turn], ['z', tilt]],
		},
		// the arms: folded back along the body, or flung out as wings
		{
			LeftArm: [['aim', [0.14 + 0.86 * open, -0.85 + 1.1 * open, -0.45 + 0.35 * open]], ['stretch', st]],
			RightArm: [['aim', [-0.14 - 0.86 * open, -0.85 + 1.1 * open, -0.45 + 0.35 * open]], ['stretch', st]],
			LeftForeArm: [['aim', [0.05 + 0.95 * open, -0.6 + 0.75 * open, 0.55 - 0.25 * open]], ['stretch', st]],
			RightForeArm: [['aim', [-0.05 - 0.95 * open, -0.6 + 0.75 * open, 0.55 - 0.25 * open]], ['stretch', st]],
			LeftHand: [['stretch', 1 / st]],
			RightHand: [['stretch', 1 / st]],
		},
	);
	return (
		<>
			<PsxCharacter
				name="Character_Monster"
				height={ITH}
				tint={{color: '#b4ada0', emissive: '#0e0c0a'}}
				position={[p[0], p[1] - 0.42, p[2]]}
				rotation={[0, ry, 0]}
				pose={P}
				probe={(w) => {
					for (const n of BN) B[n].copy(w(n));
					B.ready = true;
					if ((globalThis as any).EP52_PROBE_OFF) console.log('PROBE', JSON.stringify(Object.fromEntries(['Hips', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase', 'Neck', 'Head'].map((n) => [n, w(n).toArray().map((v) => +v.toFixed(2))]))));
				}}
			/>
			<Feathers pose={pose} ry={ry} />
			<Talons />
			<Wound split={pose.split} t={t} />
		</>
	);
};

const NB = 340, NW = 34;
/** every feather, placed from the bones each frame: a hunched mantle down its back and shoulders, a ruff
 *  round the neck, and a wing's worth hanging from each arm (which push out through the skin as grow rises) */
const Feathers: React.FC<{pose: ItPose; ry: number}> = ({pose, ry}) => {
	const M = useM();
	const body = useRef<THREE.InstancedMesh>(null);
	const wings = useRef<THREE.InstancedMesh>(null);
	const geo = useMemo(() => {
		const g = new THREE.PlaneGeometry(1, 1);
		g.translate(0, -0.5, 0); // pivot at the root of the feather
		return g;
	}, []);
	const seeds = useMemo(() => {
		let s = 52;
		const r = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
		return Array.from({length: NB}, () => [r(), r(), r()]);
	}, []);
	const place = () => {
		if (!B.ready || !body.current || !wings.current) return;
		const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3();
		const fwd = new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry));
		// mantle: around the spine from the hips to the neck, mostly on its back
		const a = B.Hips, b = B.Neck;
		const axis = b.clone().sub(a);
		const L = axis.length();
		axis.normalize();
		const side = new THREE.Vector3().crossVectors(axis, fwd).normalize();
		const back = new THREE.Vector3().crossVectors(side, axis).normalize(); // points away from its chest
		for (let i = 0; i < NB; i++) {
			const [u, v, w] = seeds[i];
			const along = i < 300 ? -0.25 + u * 1.25 : 0.95 + u * 0.12; // from below the hips; the last few: a ruff at the neck
			const ang = (v - 0.5) * (i < 220 ? 3.4 : 6.28); // the back, then all the way round
			const rad = (i < 300 ? 0.17 + 0.08 * Math.max(0, 0.3 - along) : 0.13) * (1 + 0.15 * w);
			const out = back.clone().multiplyScalar(Math.cos(ang)).addScaledVector(side, Math.sin(ang));
			pos.copy(a).addScaledVector(axis, along * L).addScaledVector(out, rad);
			// lie the feather down the body, its face outward
			const down = axis.clone().negate().addScaledVector(out, 0.35).normalize();
			const xAx = new THREE.Vector3().crossVectors(down, out).normalize();
			m.makeBasis(xAx, down.clone().negate(), out);
			q.setFromRotationMatrix(m);
			const len = i < 300 ? 0.2 + 0.1 * w : 0.12;
			sc.set(0.075 + 0.03 * w, len, 1);
			m.compose(pos, q, sc);
			body.current.setMatrixAt(i, m);
		}
		body.current.instanceMatrix.needsUpdate = true;
		// wings: along shoulder -> elbow -> wrist -> past the hand, feathers hang off the trailing edge
		let k = 0;
		for (const s of ['Left', 'Right']) {
			const p0 = B[`${s}Arm`], p1 = B[`${s}ForeArm`], p2 = B[`${s}Hand`];
			const p3 = p2.clone().addScaledVector(p2.clone().sub(p1).normalize(), 0.25 + 0.35 * pose.open);
			const pts = [p0, p1, p2, p3];
			const seg = [p1.distanceTo(p0), p2.distanceTo(p1), p3.distanceTo(p2)];
			const tot = seg[0] + seg[1] + seg[2];
			for (let i = 0; i < NW; i++) {
				const u = (i + 0.5) / NW;
				let d = u * tot, j = 0;
				while (j < 2 && d > seg[j]) {
					d -= seg[j];
					j++;
				}
				const dir = pts[j + 1].clone().sub(pts[j]).normalize();
				pos.copy(pts[j]).addScaledVector(dir, d);
				// hang: down (folded) or behind and down (open), at right angles to the arm
				const hang = new THREE.Vector3(0, -1, 0).addScaledVector(fwd, -0.6 * pose.open);
				hang.addScaledVector(dir, -hang.dot(dir)).normalize();
				const nrm = new THREE.Vector3().crossVectors(dir, hang).normalize();
				m.makeBasis(dir, hang.clone().negate(), nrm);
				q.setFromRotationMatrix(m);
				const g = Math.min(1, pose.grow * 1.3 - u * 0.3); // the outer feathers come through last
				const len = (0.2 + 0.55 * u) * (0.15 + 0.85 * Math.max(0, g)) * (1 + 1.3 * pose.open);
				sc.set((0.1 + 0.05 * u) * (1 + 0.9 * pose.open), Math.max(0.01, len), 1);
				m.compose(pos, q, sc);
				wings.current.setMatrixAt(k++, m);
			}
		}
		wings.current.instanceMatrix.needsUpdate = true;
	};
	useFrame(place, -1);
	React.useLayoutEffect(place);
	return (
		<>
			<instancedMesh ref={body} args={[geo, M.feather, NB]} frustumCulled={false} />
			<instancedMesh ref={wings} args={[geo, M.wingFeather, NW * 2]} frustumCulled={false} />
		</>
	);
};

/** three hooked talons from each foot's toes, gripping */
const Talons: React.FC = () => {
	const M = useM();
	const ref = useRef<THREE.InstancedMesh>(null);
	const geo = useMemo(() => {
		const g = new THREE.ConeGeometry(0.018, 0.12, 4);
		g.translate(0, 0.06, 0);
		return g;
	}, []);
	const place = () => {
		if (!B.ready || !ref.current) return;
		const m = new THREE.Matrix4(), q = new THREE.Quaternion();
		let k = 0;
		for (const s of ['Left', 'Right']) {
			const toe = B[`${s}ToeBase`], foot = B[`${s}Foot`];
			const dir = toe.clone().sub(foot).setY(0).normalize();
			for (let i = -1; i <= 1; i++) {
				const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(0.035 * i);
				const tipDir = dir.clone().addScaledVector(new THREE.Vector3(0, -1, 0), 0.9).normalize();
				q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tipDir);
				m.compose(toe.clone().addScaledVector(dir, 0.05).add(side), q, new THREE.Vector3(1, 1, 1));
				ref.current.setMatrixAt(k++, m);
			}
		}
		ref.current.instanceMatrix.needsUpdate = true;
	};
	useFrame(place, -1);
	React.useLayoutEffect(place);
	return <instancedMesh ref={ref} args={[geo, M.talon, 6]} frustumCulled={false} />;
};

/** the forearm's skin splitting: a patch drawn every frame (slits open, dark quills push out, blood runs),
 *  laid on the left forearm and turned to the camera; drops fall from it */
const Wound: React.FC<{split: number; t: number}> = ({split, t}) => {
	const M = useM();
	const {camera} = useThree();
	const plane = useRef<THREE.Mesh>(null);
	const drops = useRef<THREE.InstancedMesh>(null);
	const {canvas, texture, mat} = useMemo(() => {
		const canvas = document.createElement('canvas');
		canvas.width = 48;
		canvas.height = 24;
		const texture = new THREE.CanvasTexture(canvas);
		texture.magFilter = THREE.NearestFilter;
		texture.minFilter = THREE.NearestFilter;
		texture.generateMipmaps = false;
		texture.colorSpace = THREE.SRGBColorSpace;
		const mat = ps1(new THREE.MeshBasicMaterial({map: texture, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide}), 64, SNAP6);
		return {canvas, texture, mat};
	}, []);
	const g = canvas.getContext('2d')!;
	g.clearRect(0, 0, 48, 24);
	if (split > 0) {
		// grey skin (the forearm's colour), an oval patch
		// only the wounds are drawn (the arm itself shows round them)
		const slits = [[9, 8], [17, 15], [24, 6], [31, 13], [38, 9], [14, 4], [34, 18]];
		slits.forEach(([x, y], i) => {
			const k = Math.max(0, Math.min(1, split * 1.6 - i * 0.12));
			if (k <= 0) return;
			g.fillStyle = '#c0442e'; // raw, swollen edges
			g.beginPath();
			g.ellipse(x, y, 4 * k + 0.6, 1.6 * k + 0.5, -0.35, 0, Math.PI * 2);
			g.fill();
			g.fillStyle = '#2a0302';
			g.beginPath();
			g.ellipse(x, y, 3.2 * k + 0.3, 0.9 * k + 0.2, -0.35, 0, Math.PI * 2);
			g.fill();
			// the quill pushing out of it, dark and wet
			g.fillStyle = '#16120e';
			g.fillRect(x, y - 1, 1, -5 * k);
			g.fillStyle = '#4e4232';
			g.fillRect(x - 1, y - 2 - 5 * k, 3, 2);
			// blood running down from the slit
			g.fillStyle = '#7a0a06';
			g.fillRect(x, y + 1, 2, Math.min(23 - y, 10 * k + 3 * Math.sin(t * 2 + i)));
		});
	}
	texture.needsUpdate = true;
	const place = () => {
		if (!B.ready || !plane.current || !drops.current) return;
		const at = B.RightForeArm.clone().lerp(B.RightHand, 0.45); // the side toward the bucket
		plane.current.position.copy(at.clone().addScaledVector(camera.position.clone().sub(at).normalize(), 0.035));
		plane.current.lookAt(camera.position);
		plane.current.visible = split > 0;
		// drops: each falls from the wound on its own clock
		const m = new THREE.Matrix4();
		for (let i = 0; i < 10; i++) {
			const ph = (t * 0.9 + i * 0.37) % 1;
			const y = at.y - 0.04 - 4.5 * ph * ph;
			const on = split > 0.3 + i * 0.05;
			m.makeTranslation(at.x + 0.03 * Math.sin(i * 2.3), on ? y : -100, at.z + 0.03 * Math.cos(i * 1.7));
			drops.current.setMatrixAt(i, m);
		}
		drops.current.instanceMatrix.needsUpdate = true;
	};
	useFrame(place, -1);
	React.useLayoutEffect(place);
	return (
		<>
			<mesh ref={plane} material={mat} visible={false}>
				<planeGeometry args={[0.2, 0.1]} />
			</mesh>
			<instancedMesh ref={drops} args={[undefined, M.blood, 10]} frustumCulled={false}>
				<boxGeometry args={[0.018, 0.045, 0.018]} />
			</instancedMesh>
		</>
	);
};

// ------------------------------------------------------------------ the people
export const Lineman: React.FC<{p: V3; ry: number; look?: number}> = ({p, ry, look = 0}) => {
	const M = useM();
	const ref = useRef<THREE.Group>(null);
	const head = useRef(new THREE.Vector3());
	const chest = useRef(new THREE.Vector3());
	const place = () => {
		const g = ref.current;
		if (!g) return;
		(g.children[0] as THREE.Object3D).position.copy(head.current).add(new THREE.Vector3(0, 0.15, 0));
		(g.children[1] as THREE.Object3D).position.copy(chest.current);
		(g.children[1] as THREE.Object3D).rotation.set(0, ry, 0);
	};
	useFrame(place, -1);
	React.useLayoutEffect(place);
	return (
		<>
			<PsxCharacter
				name="Character_30"
				height={1.76}
				position={p}
				rotation={[0, ry, 0]}
				pose={{
					LeftArm: [['aim', [0.2, -1, 0.1]]],
					RightArm: [['aim', [-0.3, -0.2, 1]]],
					LeftForeArm: [['aim', [0.1, -1, 0.1]]],
					RightForeArm: [['aim', [-0.1, 0.7, 0.7]]],
					Neck: [['x', -0.35 * look]],
					Head: [['x', -0.35 * look]],
				}}
				probe={(w) => {
					head.current.copy(w('Head'));
					chest.current.copy(w('Spine2'));
				}}
			/>
			<group ref={ref}>
				<mesh material={M.hat}>
					<sphereGeometry args={[0.15, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
				</mesh>
				<mesh material={M.vest}>
					<boxGeometry args={[0.44, 0.5, 0.3]} />
				</mesh>
			</group>
		</>
	);
};
