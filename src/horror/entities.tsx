// Season 2 entity kit (Season 2 horror standard, docs/production/EPISODE_PLAYBOOK.md).
// Entities are human-ish silhouettes that are wrong by a little: a neck slightly too long, arms
// that reach past the knees, long black hair that hides the face. Faces are pale low-poly masks
// with unlit eye sockets and a tiny point of reflected light. No gore, ever.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1, rng} from './ps1';
import {SNAP6} from './ep01/world';

const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 20, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 20, SNAP6);

type Strip = {x: number; y: number; z: number; len: number; w: number; ry: number; front: boolean; side: number; ph: number};

/**
 * The White Lady: about 1.7 m, a white dress with a ragged hem, long black hair over the face.
 * - t: time (s), drives a slow hair sway (always on, even when everything else is still)
 * - part: 0..1 parts the hair on her right side (screen left when she faces the camera), showing half the face
 * - arm: 0..1 raises her right arm, palm out (flagging a ride)
 * - seated: hides the dress below the hips (she sits on a seat; the seat hides the rest)
 * - glow: 0..1 how much the eye catches the light
 * - headTurn: radians the head is turned away (0 = facing forward); turning it to 0 is a reveal
 */
export const WhiteLady: React.FC<{t: number; part?: number; arm?: number; seated?: boolean; glow?: number; headTurn?: number; position?: [number, number, number]; rotationY?: number; scale?: number}> = ({t, part = 0, arm = 0, seated = false, glow = 0.6, headTurn = 0, position = [0, 0, 0], rotationY = 0, scale = 1}) => {
	const m = useMemo(
		() => ({
			dress: lam('#c4beb0'),
			skin: lam('#aeaa9c'),
			hair: lam('#16161c'),
			socket: bas('#000000'),
			glint: bas('#f4f0e6'),
			mouth: bas('#0c0606'),
			neck: lam('#6e6a60'),
			shade: lam('#7c786c'),
		}),
		[],
	);
	const dress = useMemo(() => {
		const g = new THREE.CylinderGeometry(0.17, 0.34, 1.22, 11, 3, true);
		const p = g.attributes.position as THREE.BufferAttribute;
		const r = rng(77);
		for (let i = 0; i < p.count; i++) {
			const y = p.getY(i);
			// ragged hem: the bottom ring is torn to uneven lengths
			if (y < -0.6) p.setY(i, y - r() * 0.16);
			p.setX(i, p.getX(i) * (0.94 + r() * 0.12));
		}
		g.computeVertexNormals();
		return g;
	}, []);
	const strips = useMemo(() => {
		const r = rng(913);
		const out: Strip[] = [];
		// the front curtain: thin, uneven strands over the face, with gaps, ragged at the tips
		for (let i = 0; i < 24; i++) {
			const x = -0.09 + (i / 23) * 0.18 + (r() - 0.5) * 0.012;
			if (r() < 0.12) continue; // a gap
			out.push({x, y: 0.07 + r() * 0.03, z: 0.1 + Math.cos(x * 9) * 0.012, len: 0.42 + r() * 0.42, w: 0.008 + r() * 0.014, ry: 0, front: true, side: x, ph: r() * 6.28});
		}
		// sides and back: longer, splaying outward past the shoulders
		for (let i = 0; i < 46; i++) {
			const a = Math.PI * 0.08 + (i / 45) * Math.PI * 0.84 + Math.PI; // around the back half
			const aa = i % 2 ? a : Math.PI - (a - Math.PI) ; // both sides
			const x = Math.cos(aa) * 0.1, z = -Math.abs(Math.sin(aa)) * 0.1 + 0.02;
			out.push({x, y: 0.06 + r() * 0.04, z, len: 0.6 + r() * 0.35, w: 0.018 + r() * 0.02, ry: -aa + Math.PI / 2, front: false, side: x, ph: r() * 6.28});
		}
		return out;
	}, []);
	const headY = 1.5;
	return (
		<group position={position} rotation={[0, rotationY, 0]} scale={scale}>
			{!seated && <mesh geometry={dress} position={[0, 0.66, 0]} material={m.dress} />}
			{/* bodice and shoulders */}
			<mesh position={[0, 1.17, 0]} scale={[1, 1, 0.62]} material={m.dress}>
				<cylinderGeometry args={[0.1, 0.17, 0.34, 9]} />
			</mesh>
			{seated && (
				<mesh position={[0, 0.98, 0.02]} material={m.dress}>
					<cylinderGeometry args={[0.16, 0.2, 0.22, 9]} />
				</mesh>
			)}
			{/* a neck a little too long */}
			<mesh position={[0, 1.37, 0]} material={m.neck}>
				<cylinderGeometry args={[0.045, 0.05, 0.16, 6]} />
			</mesh>
			{/* head: pale mask, unlit sockets, a point of light in one eye, a mouth slightly open */}
			<group position={[0, headY, 0.02]} rotation={[0.32 - Math.abs(headTurn) * 0.2, headTurn, 0.16 + headTurn * 0.3]}>
				<mesh scale={[0.86, 1.12, 0.92]} material={m.skin}>
					<icosahedronGeometry args={[0.105, 1]} />
				</mesh>
				<mesh position={[-0.034, 0.012, 0.088]} material={m.socket}>
					<boxGeometry args={[0.034, 0.022, 0.02]} />
				</mesh>
				<mesh position={[0.034, 0.012, 0.088]} material={m.socket}>
					<boxGeometry args={[0.034, 0.022, 0.02]} />
				</mesh>
				{glow > 0 && (
					<mesh position={[-0.03, 0.014, 0.1]} material={m.glint} scale={glow}>
						<boxGeometry args={[0.008, 0.008, 0.004]} />
					</mesh>
				)}
				<mesh position={[0, -0.012, 0.098]} material={m.shade}>
					<boxGeometry args={[0.014, 0.05, 0.016]} />
				</mesh>
				<mesh position={[-0.05, -0.035, 0.08]} rotation={[0, 0.5, 0]} material={m.shade}>
					<boxGeometry args={[0.03, 0.04, 0.012]} />
				</mesh>
				<mesh position={[0, -0.058, 0.086]} material={m.mouth}>
					<boxGeometry args={[0.058, 0.014, 0.02]} />
				</mesh>
				{/* hair: thin strips that sway; the front curtain parts on one side */}
				{strips.map((s, i) => {
					const sway = Math.sin(t * 1.1 + s.ph) * 0.05 + Math.sin(t * 0.37 + s.ph * 2) * 0.03;
					const parted = s.front && s.side < 0.012 ? part : 0;
					const x = s.x - parted * (0.075 + Math.max(0, -s.side) * 0.35);
					return (
						<mesh key={i} position={[x, s.y - s.len / 2, s.z - (s.front ? parted * 0.03 : 0)]} rotation={[sway * 0.6 - (s.front ? 0.06 : 0.12), s.ry, sway * 0.4 + parted * 0.08 + (s.front ? 0 : Math.sign(s.side) * 0.16)]} material={m.hair}>
							<boxGeometry args={[s.w, s.len, 0.008]} />
						</mesh>
					);
				})}
				{/* the crown, so the hair has a top */}
				<mesh position={[0, 0.04, -0.01]} scale={[0.95, 0.75, 1.0]} material={m.hair}>
					<icosahedronGeometry args={[0.112, 1]} />
				</mesh>
			</group>
			{/* arms reach past the knees; the right one rises to flag a ride */}
			<group position={[-0.17, 1.27, 0]} rotation={[-arm * 1.6, 0, -0.05 - arm * 0.25]}>
				<mesh position={[0, -0.39, 0]} material={m.dress}>
					<boxGeometry args={[0.06, 0.5, 0.06]} />
				</mesh>
				<mesh position={[0, -0.72, 0]} material={m.skin}>
					<boxGeometry args={[0.045, 0.2, 0.03]} />
				</mesh>
			</group>
			<group position={[0.17, 1.27, 0]} rotation={[0, 0, 0.05]}>
				<mesh position={[0, -0.39, 0]} material={m.dress}>
					<boxGeometry args={[0.06, 0.5, 0.06]} />
				</mesh>
				<mesh position={[0, -0.72, 0]} material={m.skin}>
					<boxGeometry args={[0.045, 0.2, 0.03]} />
				</mesh>
			</group>
		</group>
	);
};

/** Seeded light flicker: a bulb or lamp dropping out at irregular intervals (never a sine). */
export const flicker = (t: number, seed: number, rate = 9, depth = 0.85) => {
	const i = Math.floor(t * rate);
	const r = rng(seed * 7919 + i * 104729);
	r();
	const v = r();
	return v < 0.22 ? 1 - depth : v < 0.3 ? 1 - depth * 0.5 : 1;
};

/** Handheld camera: layered noise offsets (position in metres, rotation in radians). */
export const handheld = (t: number, amount = 1): {dp: [number, number, number]; roll: number} => {
	const n = (f: number, p: number) => Math.sin(t * f + p) * 0.6 + Math.sin(t * f * 2.31 + p * 1.7) * 0.3 + Math.sin(t * f * 5.13 + p * 0.3) * 0.1;
	return {dp: [n(0.9, 1) * 0.02 * amount, n(1.1, 2) * 0.015 * amount, n(0.7, 3) * 0.01 * amount], roll: n(0.8, 4) * 0.008 * amount};
};

/**
 * The aswang (here, the tiktik): a gaunt crouching figure, wrong by a little. Long limbs folded,
 * fingers gripping, a long skull, stringy hair, eyes that catch the light (eyeshine), a mouth too
 * wide. Built to be seen in parts (a face in a gap, a hand on a beam) and once, in full, lit.
 * - t: time (hair sway, breathing)
 * - smile: 0..1 how far the mouth is open
 * - eyes: 0..1 eyeshine
 * - lean: radians it leans forward (towards its prey)
 */
export const Aswang: React.FC<{t: number; smile?: number; eyes?: number; lean?: number; position?: [number, number, number]; rotation?: [number, number, number]; scale?: number; faceOnly?: boolean}> = ({t, smile = 0.6, eyes = 1, lean = 0.4, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, faceOnly = false}) => {
	const m = useMemo(
		() => ({
			skin: lam('#a6a294'),
			dark: lam('#4a463c'),
			hair: lam('#0e0e10'),
			mouth: bas('#050202'),
			teeth: lam('#b8b09a'),
			eye: bas('#e8d080'),
			socket: bas('#000000'),
		}),
		[],
	);
	const breathe = Math.sin(t * 1.7) * 0.012;
	const strands = useMemo(() => {
		const r = rng(4411);
		// sides of the face (|x| 0.05..0.09, in front) and the back of the head
		return Array.from({length: 46}, (_, i) => {
			const side = i % 2 ? 1 : -1;
			const front = i < 24;
			return {x: side * (front ? 0.048 + r() * 0.04 : r() * 0.08), z: front ? 0.02 + r() * 0.05 : -0.03 - r() * 0.07, len: 0.35 + r() * 0.4, ph: r() * 6};
		});
	}, []);
	const Head = (
		<group position={[0, 0.92, 0.18]} rotation={[0.35, 0, 0]}>
			{/* a long, narrow, pale skull */}
			<mesh scale={[0.68, 1.22, 0.85]} material={m.skin}>
				<icosahedronGeometry args={[0.1, 1]} />
			</mesh>
			{/* deep sockets, hollow cheeks, a pinpoint of eyeshine in each */}
			{[-0.03, 0.03].map((x) => (
				<group key={x} position={[x, 0.025, 0.07]}>
					<mesh material={m.socket}>
						<boxGeometry args={[0.03, 0.03, 0.02]} />
					</mesh>
					<mesh position={[x * 0.25, -0.045, 0.002]} material={m.dark}>
						<boxGeometry args={[0.02, 0.035, 0.012]} />
					</mesh>
					{eyes > 0 && (
						<mesh position={[0, 0, 0.011]} material={m.eye} scale={Math.min(eyes, 1)}>
							<boxGeometry args={[0.005, 0.005, 0.003]} />
						</mesh>
					)}
				</group>
			))}
			{/* the jaw hangs open, further than a jaw should */}
			<group position={[0, -0.07, 0.02]} rotation={[0.15 + smile * 0.55, 0, 0]}>
				<mesh position={[0, -0.04, 0.03]} material={m.skin}>
					<boxGeometry args={[0.07, 0.035, 0.08]} />
				</mesh>
				{[-0.022, -0.006, 0.01, 0.024].map((x, i) => (
					<mesh key={i} position={[x, -0.016, 0.065]} material={m.teeth}>
						<boxGeometry args={[0.006, 0.02 + (i % 2) * 0.012, 0.004]} />
					</mesh>
				))}
			</group>
			<mesh position={[0, -0.085, 0.05]} material={m.mouth} scale={[1, 0.6 + smile * 1.2, 1]}>
				<boxGeometry args={[0.06, 0.04, 0.03]} />
			</mesh>
			{[-0.024, -0.01, 0.006, 0.02].map((x, i) => (
				<mesh key={i} position={[x, -0.075 - (i % 2) * 0.006, 0.072]} material={m.teeth}>
					<boxGeometry args={[0.006, 0.026 + ((i * 7) % 3) * 0.008, 0.004]} />
				</mesh>
			))}
			{/* long black hair from the crown, framing the face and hanging past it */}
			{strands.map((s, i) => (
				<mesh key={i} position={[s.x, 0.06 - s.len / 2, s.z]} rotation={[0.1 + Math.sin(t * 0.9 + s.ph) * 0.05, 0, Math.sin(t * 0.7 + s.ph) * 0.05]} material={m.hair}>
					<boxGeometry args={[0.016, s.len, 0.008]} />
				</mesh>
			))}
			<mesh position={[0, 0.07, -0.01]} scale={[0.75, 0.6, 0.95]} material={m.hair}>
				<icosahedronGeometry args={[0.105, 1]} />
			</mesh>
		</group>
	);
	if (faceOnly)
		return (
			<group position={position} rotation={rotation} scale={scale}>
				<group position={[0, -0.92, -0.18]}>{Head}</group>
			</group>
		);
	return (
		<group position={position} rotation={rotation} scale={scale}>
			<group rotation={[lean, 0, 0]}>
				{/* a thin ribbed torso, crouched */}
				<mesh position={[0, 0.6 + breathe, 0.05]} rotation={[0.5, 0, 0]} scale={[1, 1, 0.7]} material={m.skin}>
					<cylinderGeometry args={[0.1, 0.13, 0.5, 7]} />
				</mesh>
				{[0, 1, 2].map((i) => (
					<mesh key={i} position={[0, 0.66 - i * 0.07, 0.15 - i * 0.03]} rotation={[0.5, 0, 0]} material={m.dark}>
						<boxGeometry args={[0.2, 0.012, 0.02]} />
					</mesh>
				))}
				{/* a neck too long */}
				<mesh position={[0, 0.84, 0.13]} rotation={[0.7, 0, 0]} material={m.skin}>
					<cylinderGeometry args={[0.03, 0.04, 0.2, 5]} />
				</mesh>
				{Head}
				{/* long arms folded down to the beam, fingers gripping */}
				{[-1, 1].map((sd) => (
					<group key={sd} position={[sd * 0.13, 0.76, 0.1]} rotation={[-0.3, 0, sd * 0.25]}>
						<mesh position={[0, -0.25, 0]} material={m.skin}>
							<boxGeometry args={[0.035, 0.5, 0.035]} />
						</mesh>
						<group position={[0, -0.5, 0.02]} rotation={[1.2, 0, 0]}>
							<mesh position={[0, -0.2, 0]} material={m.skin}>
								<boxGeometry args={[0.03, 0.4, 0.03]} />
							</mesh>
							{[-1, 0, 1].map((f) => (
								<mesh key={f} position={[f * 0.018, -0.44, 0.02]} rotation={[0.6, 0, 0]} material={m.dark}>
									<boxGeometry args={[0.008, 0.11, 0.008]} />
								</mesh>
							))}
						</group>
					</group>
				))}
				{/* folded legs, knees up past the shoulders */}
				{[-1, 1].map((sd) => (
					<group key={sd} position={[sd * 0.1, 0.38, -0.02]}>
						<mesh position={[0, 0.2, 0.12]} rotation={[-0.9, 0, sd * 0.2]} material={m.skin}>
							<boxGeometry args={[0.045, 0.55, 0.045]} />
						</mesh>
						<mesh position={[0, 0.12, -0.02]} rotation={[0.9, 0, 0]} material={m.skin}>
							<boxGeometry args={[0.04, 0.5, 0.04]} />
						</mesh>
					</group>
				))}
			</group>
		</group>
	);
};

/** A long, thin, wet tongue hanging from `from` (in local space), `len` metres, swaying; segments curl at the tip. */
export const Tongue: React.FC<{t: number; len: number; position?: [number, number, number]}> = ({t, len, position = [0, 0, 0]}) => {
	const m = useMemo(() => ({flesh: lam('#4a1e1c'), wet: lam('#6e3430')}), []);
	const n = 14;
	const seg = len / n;
	let x = 0, y = 0, z = 0;
	const parts: React.ReactNode[] = [];
	for (let i = 0; i < n; i++) {
		const k = i / n;
		const a = Math.sin(t * 1.3 + k * 4) * 0.15 * k + k * k * 0.5;
		const nx = x + Math.sin(a) * seg * 0.3, ny = y - seg, nz = z + Math.sin(a * 0.7) * seg * 0.2;
		parts.push(
			<mesh key={i} position={[(x + nx) / 2, (y + ny) / 2, (z + nz) / 2]} rotation={[0, 0, a * 0.3]} material={i % 5 === 2 ? m.wet : m.flesh}>
				<cylinderGeometry args={[0.016 * (1 - k * 0.5), 0.018 * (1 - k * 0.5), seg * 1.05, 5]} />
			</mesh>,
		);
		x = nx;
		y = ny;
		z = nz;
	}
	return <group position={position}>{parts}</group>;
};
