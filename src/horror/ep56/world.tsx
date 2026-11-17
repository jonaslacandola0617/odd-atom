// Episode 56 world: "The Music in the Forest" (Season 6; students on a village posting in East Java follow
// gamelan past the forest gate; retold in our own words from a thread shared online; no village is named).
// - THE FOREST: a footpath running −z from a split stone gate (z −1) through tall trunks, banyan roots, banana
//   leaves and ferns, to a shallow stream across the path at z ≈ −35. The path wanders in x (pathX).
// - MY FRIEND: the user's PSX Character_10 in a batik sarong, walking ahead in time to the music; later sitting
//   in the stream, his arm swollen black with bites, snakes coming out from under the sarong.
// - HER: the user's PSX Character_Monster_07 (a skull face on a dark ragged body) dressed as a dancer: a gold
//   headdress, a green scarf (selendang) from her shoulders, a batik cloth from the hips; she floats a hand's
//   width above the leaves, and her arms reach far too long. A guardian of the forest, never mocked.
import React, {createContext, useContext, useMemo, useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {ps1} from '../ps1';
import {SNAP6} from '../ep01/world';
import {ARMS_DOWN, merge, Pose, PsxCharacter} from '../psx/models';
import {Box, tex} from '../ep41/world';

export type V3 = [number, number, number];
const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 64, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 64, SNAP6);

export const pathX = (z: number) => 0.9 * Math.sin(z * 0.09) + 0.4 * Math.sin(z * 0.23 + 1);
export const STREAM_Z = -35;
const rnd = (seed: number) => {
	let s = seed;
	return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
};

const batik = (base: string, ink: string) =>
	tex(16, 16, (g) => {
		g.fillStyle = base;
		g.fillRect(0, 0, 16, 16);
		// small kawung-like rings, staggered, soft
		for (let y = 0; y < 16; y += 4)
			for (let x = (y / 4) % 2 ? 2 : 0; x < 16; x += 4) {
				g.fillStyle = ink;
				g.fillRect(x, y + 1, 1, 1);
				g.fillRect(x + 2, y + 1, 1, 1);
				g.fillRect(x + 1, y, 1, 1);
				g.fillRect(x + 1, y + 2, 1, 1);
			}
	}, [2, 3]);

const useMatsInner = () =>
	useMemo(() => {
		const litter = tex(16, 16, (g) => {
			g.fillStyle = '#4a3c28';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 90; i++) {
				g.fillStyle = ['#5c4a30', '#3a2e1e', '#6a5a36', '#40482a'][i % 4];
				g.fillRect((i * 7) % 16, (i * 11) % 16, 2, 1);
			}
		}, [2, 2]);
		const bark = tex(16, 16, (g) => {
			g.fillStyle = '#4a4034';
			g.fillRect(0, 0, 16, 16);
			for (let x = 0; x < 16; x += 3) {
				g.fillStyle = '#3a3228';
				g.fillRect(x, 0, 1, 16);
			}
			for (let i = 0; i < 24; i++) {
				g.fillStyle = i % 2 ? '#56604a' : '#5a5040'; // moss
				g.fillRect((i * 5) % 16, (i * 7) % 16, 2, 2);
			}
		}, [1, 6]);
		const leaf = tex(16, 16, (g) => {
			g.fillStyle = '#2e4a22';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#3e5e2a';
			g.fillRect(0, 7, 16, 2);
			for (let x = 1; x < 16; x += 3) {
				g.fillStyle = '#26401c';
				g.fillRect(x, 0, 1, 7);
				g.fillRect(x, 9, 1, 7);
			}
		});
		const stone = tex(16, 16, (g) => {
			g.fillStyle = '#6a6458';
			g.fillRect(0, 0, 16, 16);
			for (let y = 0; y < 16; y += 4) {
				g.fillStyle = '#4e4a40';
				g.fillRect(0, y, 16, 1);
				g.fillRect((y * 3) % 16, y, 1, 4);
			}
			for (let i = 0; i < 20; i++) {
				g.fillStyle = '#4c5a3a'; // moss
				g.fillRect((i * 7) % 16, (i * 5) % 16, 2, 1);
			}
		}, [1, 3]);
		const water = tex(16, 16, (g) => {
			g.fillStyle = '#1a2a2a';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 30; i++) {
				g.fillStyle = i % 2 ? '#2a4040' : '#3a5450';
				g.fillRect((i * 5) % 16, (i * 3) % 16, 3, 1);
			}
		}, [3, 2]);
		const bites = tex(16, 32, (g) => {
			g.fillStyle = '#1e1418';
			g.fillRect(0, 0, 16, 32);
			for (let i = 0; i < 40; i++) {
				g.fillStyle = i % 3 ? '#4a1a1e' : '#2a0a0e';
				g.fillRect((i * 7) % 16, (i * 11) % 32, 2, 2);
				g.fillStyle = '#8a1010';
				g.fillRect((i * 7) % 16, (i * 11) % 32, 1, 1);
			}
		});
		const snake = tex(8, 8, (g) => {
			g.fillStyle = '#1e2418';
			g.fillRect(0, 0, 8, 8);
			g.fillStyle = '#3a4426';
			for (let x = 0; x < 8; x += 2) g.fillRect(x, (x * 3) % 8, 1, 2);
		});
		return {
			litter: lam('#ffffff', {map: litter}),
			bark: lam('#ffffff', {map: bark}),
			root: lam('#3e3428'),
			leaf: lam('#ffffff', {map: leaf, side: THREE.DoubleSide}),
			fern: lam('#24381c', {side: THREE.DoubleSide}),
			stone: lam('#ffffff', {map: stone}),
			water: lam('#ffffff', {map: water, emissive: '#060c0c'}),
			sarong: lam('#ffffff', {map: batik('#4a3220', '#24160c'), side: THREE.DoubleSide}),
			jarik: lam('#ffffff', {map: batik('#3a2a14', '#140c06'), side: THREE.DoubleSide}),
			scarf: lam('#12402a', {side: THREE.DoubleSide}),
			gold: lam('#9a7830'),
			swollen: lam('#ffffff', {map: bites}),
			snake: lam('#ffffff', {map: snake}),
			blood: bas('#4a0404'),
			eye: bas('#e8e8d8'),
		};
	}, []);
type Mats = ReturnType<typeof useMatsInner>;
const Ctx = createContext<Mats | null>(null);
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMatsInner()}>{children}</Ctx.Provider>;
export const useM = () => useContext(Ctx)!;

// ------------------------------------------------------------------ the forest
const TREES = (() => {
	const r = rnd(56);
	const out: {x: number; z: number; r: number; h: number; banyan: boolean}[] = [];
	for (let i = 0; i < 140; i++) {
		const z = 4 - r() * 52;
		const side = r() > 0.5 ? 1 : -1;
		const x = pathX(z) + side * (1.7 + r() * 9);
		out.push({x, z, r: 0.18 + r() * 0.35, h: 9 + r() * 8, banyan: r() > 0.85});
	}
	return out;
})();
const PLANTS = (() => {
	const r = rnd(560);
	const out: {x: number; z: number; ry: number; s: number; kind: number}[] = [];
	for (let i = 0; i < 120; i++) {
		const z = 3 - r() * 48;
		const side = r() > 0.5 ? 1 : -1;
		out.push({x: pathX(z) + side * (1.25 + r() * 6), z, ry: r() * 6.28, s: 0.6 + r() * 0.9, kind: Math.floor(r() * 3)});
	}
	return out;
})();

export const Forest: React.FC = () => {
	const M = useM();
	const ground: React.ReactNode[] = [];
	for (let z = 4; z > -50; z -= 2) {
		const x = pathX(z);
		const inStream = Math.abs(z - STREAM_Z) < 1.6;
		ground.push(<Box key={'g' + z} p={[x, inStream ? -0.35 : -0.05, z]} s={[3.2, 0.1, 2.02]} m={M.litter} />);
		// the forest floor either side, a little higher and darker
		ground.push(<Box key={'l' + z} p={[x - 6.5, 0.0, z]} s={[10, 0.1, 2.02]} m={M.litter} />);
		ground.push(<Box key={'r' + z} p={[x + 6.5, 0.0, z]} s={[10, 0.1, 2.02]} m={M.litter} />);
	}
	return (
		<group>
			{ground}
			{/* the stream: a shallow channel of dark water across the path, stones on its banks */}
			<Box p={[pathX(STREAM_Z), -0.12, STREAM_Z]} s={[24, 0.06, 2.8]} m={M.water} />
			{[-1.6, -0.7, 0.9, 1.7].map((dx, i) => (
				<Box key={i} p={[pathX(STREAM_Z) + dx, 0.0, STREAM_Z + 1.5 - (i % 2) * 3]} s={[0.5, 0.3, 0.4]} r={[0, i, 0.2]} m={M.stone} />
			))}
			{/* the split stone gate: two stepped pillars with the path between them */}
			{[-1, 1].map((s) => (
				<group key={s} position={[pathX(-1) + s * 1.15, 0, -1]}>
					<Box p={[0, 1.1, 0]} s={[0.9, 2.2, 0.9]} m={M.stone} />
					<Box p={[0, 2.45, 0]} s={[0.7, 0.5, 0.7]} m={M.stone} />
					<Box p={[0, 2.95, 0]} s={[0.45, 0.5, 0.45]} m={M.stone} />
					<Box p={[0, 3.35, 0]} s={[0.2, 0.3, 0.2]} m={M.stone} />
				</group>
			))}
			{TREES.map((t, i) => (
				<group key={i} position={[t.x, 0, t.z]}>
					<Box p={[0, t.h / 2, 0]} s={[t.r * 2, t.h, t.r * 2]} m={M.bark} />
					{t.banyan &&
						[0, 1, 2, 3, 4, 5].map((k) => (
							// aerial roots hanging round the trunk like a curtain
							<Box key={k} p={[Math.cos(k) * (t.r + 0.5), 2.8, Math.sin(k) * (t.r + 0.5)]} s={[0.06, 5.6, 0.06]} m={M.root} />
						))}
				</group>
			))}
			{PLANTS.map((p, i) => (
				<group key={'p' + i} position={[p.x, 0, p.z]} rotation={[0, p.ry, 0]} scale={p.s}>
					{p.kind === 0 ? (
						// a banana plant: a stem and three broad leaves
						<>
							<Box p={[0, 0.9, 0]} s={[0.12, 1.8, 0.12]} m={M.root} />
							{[0, 2.1, 4.2].map((a) => (
								<mesh key={a} position={[Math.cos(a) * 0.55, 1.8, Math.sin(a) * 0.55]} rotation={[0.5, a, 0.3]} material={M.leaf}>
									<boxGeometry args={[1.2, 0.02, 0.4, 4, 1, 2]} />
								</mesh>
							))}
						</>
					) : (
						// a fern: low fronds
						[0, 1.3, 2.6, 3.9, 5.2].map((a) => (
							<mesh key={a} position={[Math.cos(a) * 0.3, 0.3, Math.sin(a) * 0.3]} rotation={[0.6, a, 0]} material={M.fern}>
								<boxGeometry args={[0.7, 0.02, 0.18, 3, 1, 1]} />
							</mesh>
						))
					)}
				</group>
			))}
		</group>
	);
};

// ------------------------------------------------------------------ bone attachments (read after posing)
type Bones = Record<string, THREE.Vector3> & {ready?: boolean};
const mkBones = (names: readonly string[]): Bones => Object.fromEntries(names.map((n) => [n, new THREE.Vector3()]));
/** a box laid from a to b (thickness w×d), re-placed every frame */
const Limb: React.FC<{get: () => [THREE.Vector3, THREE.Vector3] | null; w: number; d?: number; m: THREE.Material; extend?: number}> = ({get, w, d = w, m, extend = 0}) => {
	const ref = useRef<THREE.Mesh>(null);
	const place = () => {
		const ab = get();
		if (!ab || !ref.current) return;
		const [a, b] = ab;
		const dir = b.clone().sub(a);
		const L = dir.length() + extend;
		dir.normalize();
		ref.current.position.copy(a).addScaledVector(dir, L / 2 - extend / 2);
		ref.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
		ref.current.scale.set(w, L, d);
	};
	useFrame(place, -1);
	React.useLayoutEffect(place);
	return (
		<mesh ref={ref} material={m} frustumCulled={false}>
			<boxGeometry args={[1, 1, 1, 1, 2, 1]} />
		</mesh>
	);
};

// ------------------------------------------------------------------ my friend
const FN = ['Hips', 'Spine2', 'Neck', 'Head', 'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg', 'LeftFoot', 'RightFoot', 'RightArm', 'RightForeArm', 'RightHand', 'LeftArm', 'LeftForeArm', 'LeftHand'] as const;
const FB = mkBones(FN);
export const friendBones = FB;
/** walk: stride phase (walking in time); sit: in the stream, back to me; tilt: his head tilting like hers */
export const Friend: React.FC<{p: V3; ry: number; walk?: number; sit?: boolean; tilt?: number; t: number}> = ({p, ry, walk, sit, tilt = 0, t}) => {
	const M = useM();
	let pose: Pose;
	if (sit) {
		pose = merge(ARMS_DOWN, {
			LeftUpLeg: [['aim', [0.15, -0.1, 1]]],
			RightUpLeg: [['aim', [-0.15, -0.1, 1]]],
			LeftLeg: [['aim', [0.05, -0.6, 0.8]]],
			RightLeg: [['aim', [-0.05, -0.6, 0.8]]],
			Spine: [['x', 0.35]],
			Neck: [['x', 0.7]],
			Head: [['x', 0.3], ['z', 0.2]],
			// his right arm hangs out to the side, swollen; the left in his lap
			RightArm: [['aim', [-0.55, -0.8, 0.1]]],
			RightForeArm: [['aim', [-0.25, -1, 0.15]]],
			LeftArm: [['aim', [0.2, -0.8, 0.4]]],
			LeftForeArm: [['aim', [-0.3, -0.4, 1]]],
		});
	} else {
		const a = Math.sin(walk ?? 0);
		pose = merge(ARMS_DOWN, {
			LeftUpLeg: [['aim', [0.05, -1, 0.35 * a]]],
			RightUpLeg: [['aim', [-0.05, -1, -0.35 * a]]],
			LeftLeg: [['aim', [0.03, -1, 0.15 * a - 0.12]]],
			RightLeg: [['aim', [-0.03, -1, -0.15 * a - 0.12]]],
			Neck: [['z', 0.35 * tilt]],
			Head: [['z', 0.3 * tilt], ['x', 0.1]],
			// arms loose, a little out from the body: walking in a trance
			LeftArm: [['aim', [0.3, -1, 0.1]]],
			RightArm: [['aim', [-0.3, -1, 0.1]]],
		});
	}
	return (
		<>
			<PsxCharacter
				name="Character_10"
				height={1.7}
				tint={{color: '#c09a80'}}
				position={sit ? [p[0], p[1] - 0.62, p[2]] : p}
				rotation={[0, ry, 0]}
				pose={pose}
				probe={(w) => {
					for (const n of FN) FB[n].copy(w(n));
					FB.ready = true;
				}}
			/>
			{/* the sarong: a batik tube from his waist to his shins (or across his lap) */}
			<Limb get={() => (FB.ready ? [FB.Hips.clone().add(new THREE.Vector3(0, 0.05, 0)), sit ? FB.LeftLeg.clone().add(FB.RightLeg).multiplyScalar(0.5) : FB.LeftLeg.clone().add(FB.RightLeg).multiplyScalar(0.5).add(new THREE.Vector3(0, -0.2, 0))] : null)} w={0.42} d={0.32} m={M.sarong} extend={0.1} />
			{sit && (
				<>
					{/* his right forearm and hand, swollen black and bitten */}
					<Limb get={() => (FB.ready ? [FB.RightForeArm, FB.RightHand] : null)} w={0.15} m={M.swollen} extend={0.08} />
					<Limb get={() => (FB.ready ? [FB.RightArm.clone().lerp(FB.RightForeArm, 0.4), FB.RightForeArm] : null)} w={0.12} m={M.swollen} />
					<Snakes t={t} />
				</>
			)}
		</>
	);
};

/** three snakes out from under the sarong: chains of segments along a moving wave, over his thigh and into the water */
const Snakes: React.FC<{t: number}> = ({t}) => {
	const M = useM();
	const ref = useRef<THREE.InstancedMesh>(null);
	const NS = 3, SEG = 16;
	const place = () => {
		if (!FB.ready || !ref.current) return;
		const m = new THREE.Matrix4(), q = new THREE.Quaternion();
		const hip = FB.Hips, knee = FB.RightLeg.clone().lerp(FB.LeftLeg, 0.5);
		const fwd = knee.clone().sub(hip).setY(0).normalize();
		const side = new THREE.Vector3(-fwd.z, 0, fwd.x);
		for (let s = 0; s < NS; s++) {
			const out = ((t * 0.18 + s * 0.31) % 1) * 0.9; // how far it has come out
			const base = hip.clone().lerp(knee, 0.55).addScaledVector(side, (s - 1) * 0.12);
			let prev: THREE.Vector3 | null = null;
			for (let k = 0; k < SEG; k++) {
				const u = k / (SEG - 1);
				const along = out - u * 0.8;
				const pos = base.clone().addScaledVector(fwd, along * 0.9).addScaledVector(side, 0.09 * Math.sin(u * 9 - t * 6 + s * 2) + (s - 1) * 0.25 * Math.max(0, along)).add(new THREE.Vector3(0, 0.08 - 0.25 * Math.max(0, along) * along, 0));
				const dir = prev ? prev.clone().sub(pos).normalize() : fwd.clone();
				q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
				const r = (k === 0 ? 0.05 : 0.04) * (1 - 0.6 * u);
				m.compose(pos, q, new THREE.Vector3(r, r * 0.8, 0.06));
				ref.current.setMatrixAt(s * SEG + k, m);
				prev = pos;
			}
		}
		ref.current.instanceMatrix.needsUpdate = true;
	};
	useFrame(place, -1);
	React.useLayoutEffect(place);
	return (
		<instancedMesh ref={ref} args={[undefined, M.snake, NS * SEG]} frustumCulled={false}>
			<boxGeometry args={[1, 1, 1]} />
		</instancedMesh>
	);
};

// ------------------------------------------------------------------ her
const HN = ['Hips', 'Spine2', 'Neck', 'Head', 'HeadTop_End', 'LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm', 'LeftHand', 'RightHand', 'LeftLeg', 'RightLeg', 'LeftFoot', 'RightFoot'] as const;
const HB = mkBones(HN);
export const herBones = HB;
export const DANCER_H = 1.75;
/** phase: the slow dance; reach 0..1: her arms reach toward a point, too long; hold: 0..1 arms round him */
export const Dancer: React.FC<{p: V3; ry: number; phase: number; reach?: number; reachTo?: V3; hold?: number; look?: number}> = ({p, ry, phase, reach = 0, reachTo, hold = 0, look = 0}) => {
	const M = useM();
	const a = Math.sin(phase), b = Math.cos(phase * 0.7);
	const st = 1 + 1.5 * reach;
	// a court dance pose: knees bent, one arm out to the side with the hand flexed back, the other before the
	// chest; the head tilts on the beat; her toes point down (she does not stand on anything)
	const pose: Pose = merge(
		{
			LeftUpLeg: [['aim', [0.25, -1, 0.15]]],
			RightUpLeg: [['aim', [-0.25, -1, 0.15]]],
			LeftLeg: [['aim', [0.05, -1, -0.1]]],
			RightLeg: [['aim', [-0.05, -1, -0.1]]],
			LeftFoot: [['aim', [0.05, -1, 0.25]]],
			RightFoot: [['aim', [-0.05, -1, 0.25]]],
			Spine: [['x', 0.12], ['z', 0.08 * a]],
			Neck: [['z', 0.25 * a + 0.2 * look], ['y', 0.15 * b]],
			Head: [['z', 0.3 * a], ['x', -0.1 - 0.25 * look]],
			LeftArm: [['aim', [1, 0.05 + 0.15 * b, 0.25]]],
			LeftForeArm: [['aim', [0.9, 0.3 + 0.1 * a, 0.35]]],
			LeftHand: [['aim', [0.2, 1, 0.1]]],
			RightArm: [['aim', [-0.45, -0.5, 0.75]]],
			RightForeArm: [['aim', [0.35, 0.1, 0.9]]],
			RightHand: [['aim', [0.1, 1, 0.3]]],
		},
		reach > 0 || hold > 0
			? {
					// both arms out at the light, longer and longer; or wrapped round him
					LeftArm: [['aim', hold > 0 ? [-0.3, -0.35, 1] : [0.55, 0.1, 0.85]], ['stretch', st]],
					RightArm: [['aim', hold > 0 ? [0.3, -0.35, 1] : [-0.55, 0.1, 0.85]], ['stretch', st]],
					LeftForeArm: [['aim', hold > 0 ? [-1, -0.2, 0.4] : [0.35, 0.05, 1]], ['stretch', st]],
					RightForeArm: [['aim', hold > 0 ? [1, -0.2, 0.4] : [-0.35, 0.05, 1]], ['stretch', st]],
					LeftHand: [['stretch', 1 / st], ['aim', [0, -0.3, 1]]],
					RightHand: [['stretch', 1 / st], ['aim', [0, -0.3, 1]]],
				}
			: {},
	);
	void reachTo;
	return (
		<>
			<PsxCharacter
				name="Character_Monster_07"
				height={DANCER_H}
				tint={{color: '#b8b0a8', emissive: '#0c0a0a'}}
				position={[p[0], p[1] + 0.34, p[2]]}
				rotation={[0, ry, 0]}
				pose={pose}
				probe={(w) => {
					for (const n of HN) HB[n].copy(w(n));
					HB.ready = true;
				}}
			/>
			<Costume ry={ry} />
		</>
	);
};

/** the headdress, the scarf from her shoulders, the batik cloth from her hips, two pale eyes in the skull */
const Costume: React.FC<{ry: number}> = ({ry}) => {
	const M = useM();
	const crown = useRef<THREE.Group>(null);
	const eyes = useRef<THREE.Group>(null);
	const place = () => {
		if (!HB.ready) return;
		const up = HB.HeadTop_End.clone().sub(HB.Head).normalize();
		const fwd = new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry));
		fwd.addScaledVector(up, -fwd.dot(up)).normalize();
		const side = new THREE.Vector3().crossVectors(up, fwd).normalize();
		const m = new THREE.Matrix4().makeBasis(side, up, fwd);
		for (const g of [crown.current, eyes.current]) if (g) g.quaternion.setFromRotationMatrix(m);
		crown.current?.position.copy(HB.HeadTop_End).addScaledVector(up, -0.02);
		eyes.current?.position.copy(HB.Head).addScaledVector(up, 0.075).addScaledVector(fwd, 0.1);
	};
	useFrame(place, -1);
	React.useLayoutEffect(place);
	return (
		<>
			<group ref={crown}>
				<mesh material={M.gold} position={[0, 0.02, 0]}>
					<boxGeometry args={[0.2, 0.06, 0.2]} />
				</mesh>
				{[-0.07, 0, 0.07].map((x, i) => (
					<mesh key={i} material={M.gold} position={[x, 0.09 + (i === 1 ? 0.04 : 0), 0.06]}>
						<boxGeometry args={[0.04, i === 1 ? 0.16 : 0.1, 0.02]} />
					</mesh>
				))}
				{/* the long tail at the back of the headdress */}
				<mesh material={M.gold} position={[0, -0.12, -0.11]} rotation={[0.2, 0, 0]}>
					<boxGeometry args={[0.06, 0.3, 0.02]} />
				</mesh>
			</group>
			<group ref={eyes}>
				<mesh material={M.eye} position={[0.03, 0, 0]}>
					<boxGeometry args={[0.018, 0.012, 0.01]} />
				</mesh>
				<mesh material={M.eye} position={[-0.03, 0, 0]}>
					<boxGeometry args={[0.018, 0.012, 0.01]} />
				</mesh>
			</group>
			{/* the scarf: from each shoulder over the forearm, hanging long */}
			<Limb get={() => (HB.ready ? [HB.LeftArm, HB.LeftForeArm.clone().add(new THREE.Vector3(0, -0.5, 0))] : null)} w={0.07} d={0.015} m={M.scarf} />
			<Limb get={() => (HB.ready ? [HB.RightArm, HB.RightForeArm.clone().add(new THREE.Vector3(0, -0.5, 0))] : null)} w={0.07} d={0.015} m={M.scarf} />
			{/* the batik cloth: hips to just above the ankles */}
			<Limb get={() => (HB.ready ? [HB.Hips.clone().add(new THREE.Vector3(0, 0.08, 0)), HB.LeftLeg.clone().add(HB.RightLeg).multiplyScalar(0.5).add(new THREE.Vector3(0, -0.22, 0))] : null)} w={0.34} d={0.28} m={M.jarik} />
		</>
	);
};
