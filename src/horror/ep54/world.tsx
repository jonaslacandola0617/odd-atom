// Episode 54 world: "Monitor" (Season 6; a babysitter's night with twins asleep upstairs and the baby monitor
// beside him, retold in our own words from accounts shared online; a suburban house in a Canadian winter, no
// real family or town).
// - THE NURSERY (x −2..2, z −2..2, 2.5 m high): two cribs against the back wall (the twins asleep, blanketed
//   bundles that breathe), a mobile over the left crib, a rocking chair, a dresser with a night light, the
//   window with snow outside, the door in the right wall, and the dark back-left corner. The monitor's camera
//   is high in the front-right corner.
// - THE LIVING ROOM downstairs: the couch (derelict pack), a dark TV, a lamp, the snowy window, the stairs up.
// - IT: the user's PSX Character_Monster_04 (a gaunt figure in a dark dress, a skull face, the jaw hanging open
//   to its chest), 2.3 m tall, perfectly still in the corner; later bent double over the crib, and at the end
//   bent over my shoulder. The twins are safe in every frame.
import React, {createContext, useContext, useMemo, useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {ps1} from '../ps1';
import {SNAP6} from '../ep01/world';
import {ARMS_DOWN, merge, Pose, PsxCharacter, PsxProp} from '../psx/models';
import {Box, tex} from '../ep41/world';

export type V3 = [number, number, number];
const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 64, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 64, SNAP6);

// ------------------------------------------------------------------ the nursery's measures
export const N = {x0: -2, x1: 2, z0: -2, z1: 2, h: 2.5};
export const CAM: V3 = [1.82, 2.25, 1.82]; // the monitor's camera, high in the front-right corner
export const CRIB_A: V3 = [-0.95, 0, -1.45]; // the left crib (the one it bends over)
export const CRIB_B: V3 = [0.72, 0, -1.45];
export const CORNER: V3 = [-1.62, 0, -1.55]; // where it stands, perfectly still
export const DOOR_Z = 0.4; // the door in the right wall (x = 2), its centre along z
export const IT_H = 2.3;

const useMatsInner = () =>
	useMemo(() => {
		const paper = tex(16, 16, (g) => {
			g.fillStyle = '#c8bca8';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#b4a890';
			for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? 2 : 0; x < 16; x += 4) g.fillRect(x, y, 1, 1);
		}, [6, 3]);
		const carpet = tex(16, 16, (g) => {
			g.fillStyle = '#7a6a5a';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 40; i++) {
				g.fillStyle = i % 2 ? '#6e5e50' : '#867664';
				g.fillRect((i * 7) % 16, (i * 5) % 16, 1, 1);
			}
		}, [6, 6]);
		const floor = tex(16, 16, (g) => {
			g.fillStyle = '#6a4e36';
			g.fillRect(0, 0, 16, 16);
			for (let y = 0; y < 16; y += 4) {
				g.fillStyle = '#5a4030';
				g.fillRect(0, y, 16, 1);
			}
		}, [5, 5]);
		const blanket = tex(8, 8, (g) => {
			g.fillStyle = '#c8d4e0';
			g.fillRect(0, 0, 8, 8);
			g.fillStyle = '#a8b8cc';
			for (let i = 0; i < 8; i += 2) g.fillRect(i, 0, 1, 8);
		});
		const blanket2 = tex(8, 8, (g) => {
			g.fillStyle = '#e0ccd0';
			g.fillRect(0, 0, 8, 8);
			g.fillStyle = '#ccb0b8';
			for (let i = 0; i < 8; i += 2) g.fillRect(0, i, 8, 1);
		});
		return {
			paper: lam('#ffffff', {map: paper}),
			carpet: lam('#ffffff', {map: carpet}),
			floor: lam('#ffffff', {map: floor}),
			ceiling: lam('#d8d4cc'),
			wood: lam('#d8d0c0'),
			woodDark: lam('#5a4232'),
			white: lam('#ece8e0'),
			mattress: lam('#e8e8e8'),
			blanket: lam('#ffffff', {map: blanket}),
			blanket2: lam('#ffffff', {map: blanket2}),
			skin: lam('#e0b898'),
			door: lam('#e4ded2'),
			knob: lam('#b8a060'),
			night: bas('#0a0e18'),
			snow: bas('#d8e0ec'),
			glow: bas('#ffd8a0'),
			toy: lam('#c86a5a'),
			toy2: lam('#5a8ac8'),
			toy3: lam('#d8c050'),
			string: bas('#888888'),
			tv: lam('#151515'),
			lampShade: lam('#e8d8b0'),
			stair: lam('#7a5a40'),
			rail: lam('#e4ded2'),
			black: bas('#000000'),
			eyeshine: bas('#ffffff'),
		};
	}, []);
type Mats = ReturnType<typeof useMatsInner>;
const Ctx = createContext<Mats | null>(null);
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMatsInner()}>{children}</Ctx.Provider>;
export const useM = () => useContext(Ctx)!;

// ------------------------------------------------------------------ the nursery
const Crib: React.FC<{p: V3; m: THREE.Material; breathe: number}> = ({p, m, breathe}) => {
	const M = useM();
	const bars = [];
	for (let i = 0; i <= 10; i++) {
		const x = -0.6 + i * 0.12;
		bars.push(<Box key={'f' + i} p={[x, 0.72, 0.32]} s={[0.025, 0.5, 0.025]} m={M.wood} />);
		bars.push(<Box key={'b' + i} p={[x, 0.72, -0.32]} s={[0.025, 0.5, 0.025]} m={M.wood} />);
	}
	for (let i = 0; i <= 5; i++) {
		const z = -0.3 + i * 0.12;
		bars.push(<Box key={'l' + i} p={[-0.62, 0.72, z]} s={[0.025, 0.5, 0.025]} m={M.wood} />);
		bars.push(<Box key={'r' + i} p={[0.62, 0.72, z]} s={[0.025, 0.5, 0.025]} m={M.wood} />);
	}
	return (
		<group position={p}>
			{/* posts, rails, the mattress */}
			{[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Box key={`${sx}${sz}`} p={[0.63 * sx, 0.5, 0.33 * sz]} s={[0.05, 1.0, 0.05]} m={M.wood} />))}
			<Box p={[0, 0.98, 0.32]} s={[1.3, 0.04, 0.04]} m={M.wood} />
			<Box p={[0, 0.98, -0.32]} s={[1.3, 0.04, 0.04]} m={M.wood} />
			<Box p={[-0.63, 0.98, 0]} s={[0.04, 0.04, 0.66]} m={M.wood} />
			<Box p={[0.63, 0.98, 0]} s={[0.04, 0.04, 0.66]} m={M.wood} />
			<Box p={[0, 0.46, 0]} s={[1.2, 0.04, 0.6]} m={M.wood} />
			<Box p={[0, 0.51, 0]} s={[1.18, 0.08, 0.58]} m={M.mattress} />
			{bars}
			{/* the baby: a small blanketed bundle, a little head on a pillow, breathing */}
			<Box p={[0.05, 0.6 + 0.008 * breathe, 0]} s={[0.42, 0.1 + 0.012 * breathe, 0.24]} m={m} />
			<mesh position={[-0.25, 0.61, 0]} scale={[1, 0.9, 1]} material={M.skin}>
				<sphereGeometry args={[0.065, 7, 5]} />
			</mesh>
		</group>
	);
};
const Mobile: React.FC<{t: number}> = ({t}) => {
	const M = useM();
	const a = t * 0.35;
	return (
		<group position={[CRIB_A[0], 1.75, CRIB_A[2]]} rotation={[0, a, 0]}>
			<Box p={[0, 0.25, 0]} s={[0.01, 0.5, 0.01]} m={M.string} />
			<Box p={[0, 0, 0]} s={[0.5, 0.015, 0.015]} m={M.wood} />
			<Box p={[0, 0, 0]} s={[0.015, 0.015, 0.5]} m={M.wood} />
			{[[0.25, 0, M.toy], [-0.25, 0, M.toy2], [0, 0.25, M.toy3], [0, -0.25, M.toy]].map(([x, z, m], i) => (
				<group key={i}>
					<Box p={[x as number, -0.1, z as number]} s={[0.006, 0.2, 0.006]} m={M.string} />
					<Box p={[x as number, -0.22, z as number]} s={[0.07, 0.07, 0.07]} m={m as THREE.Material} />
				</group>
			))}
		</group>
	);
};
export const Nursery: React.FC<{t: number; lit: boolean}> = ({t, lit}) => {
	const M = useM();
	const {x0, x1, z0, z1, h} = N;
	return (
		<group>
			<Box p={[0, -0.05, 0]} s={[x1 - x0, 0.1, z1 - z0]} m={M.carpet} />
			<Box p={[0, h + 0.05, 0]} s={[x1 - x0, 0.1, z1 - z0]} m={M.ceiling} />
			<Box p={[0, h / 2, z0 - 0.05]} s={[x1 - x0, h, 0.1]} m={M.paper} />
			<Box p={[x0 - 0.05, h / 2, 0]} s={[0.1, h, z1 - z0]} m={M.paper} />
			<Box p={[0, h / 2, z1 + 0.05]} s={[x1 - x0, h, 0.1]} m={M.paper} />
			{/* the right wall, with the door */}
			<Box p={[x1 + 0.05, h / 2, (z0 + DOOR_Z - 0.45) / 2]} s={[0.1, h, DOOR_Z - 0.45 - z0]} m={M.paper} />
			<Box p={[x1 + 0.05, h / 2, (z1 + DOOR_Z + 0.45) / 2]} s={[0.1, h, z1 - DOOR_Z - 0.45]} m={M.paper} />
			<Box p={[x1 + 0.05, 2.25, DOOR_Z]} s={[0.1, 0.5, 0.9]} m={M.paper} />
			<Box p={[x1 + 0.02, 1.0, DOOR_Z]} s={[0.04, 2.0, 0.88]} m={M.door} />
			<Box p={[x1 - 0.02, 1.0, DOOR_Z - 0.32]} s={[0.04, 0.06, 0.06]} m={M.knob} />
			{/* the window in the left wall: the night and the snow */}
			<group position={[x0 + 0.02, 1.5, 0.4]}>
				<mesh rotation={[0, Math.PI / 2, 0]} material={M.night}>
					<planeGeometry args={[0.9, 0.9]} />
				</mesh>
				{Array.from({length: 14}, (_, i) => {
					const y = (((i * 0.37 - t * 0.18) % 0.9) + 0.9) % 0.9 - 0.45;
					return <Box key={i} p={[0.01, y, -0.4 + ((i * 0.53) % 0.8)]} s={[0.01, 0.02, 0.02]} m={M.snow} />;
				})}
				<Box p={[0.03, 0.47, 0]} s={[0.04, 0.05, 1.0]} m={M.white} />
				<Box p={[0.03, -0.47, 0]} s={[0.04, 0.05, 1.0]} m={M.white} />
				<Box p={[0.03, 0, 0]} s={[0.04, 0.9, 0.04]} m={M.white} />
			</group>
			<Crib p={CRIB_A} m={M.blanket} breathe={Math.sin(t * 1.7)} />
			<Crib p={CRIB_B} m={M.blanket2} breathe={Math.sin(t * 1.9 + 1.3)} />
			<Mobile t={t} />
			{/* the dresser with the night light */}
			<Box p={[1.55, 0.45, -1.6]} s={[0.7, 0.9, 0.45]} m={M.white} />
			<Box p={[1.4, 0.98, -1.6]} s={[0.12, 0.12, 0.12]} m={lit ? M.white : M.glow} />
			{/* the monitor's camera on its bracket */}
			<Box p={[CAM[0] + 0.08, CAM[1] + 0.02, CAM[2] + 0.08]} s={[0.1, 0.12, 0.1]} m={M.white} />
		</group>
	);
};

// ------------------------------------------------------------------ downstairs
export const LivingRoom: React.FC<{t: number}> = ({t}) => {
	const M = useM();
	return (
		<group position={[0, 0, 12]}>
			<Box p={[0, -0.05, 0]} s={[6, 0.1, 6]} m={M.floor} />
			<Box p={[0, 1.3, -3.05]} s={[6, 2.6, 0.1]} m={M.paper} />
			<Box p={[-3.05, 1.3, 0]} s={[0.1, 2.6, 6]} m={M.paper} />
			<Box p={[3.05, 1.3, 0]} s={[0.1, 2.6, 6]} m={M.paper} />
			<Box p={[0, 2.65, 0]} s={[6, 0.1, 6]} m={M.ceiling} />
			{/* the window: the night and the snow */}
			<group position={[-1.2, 1.5, -2.98]}>
				<mesh material={M.night}>
					<planeGeometry args={[1.4, 1.0]} />
				</mesh>
				{Array.from({length: 22}, (_, i) => {
					const y = (((i * 0.31 - t * 0.2) % 1.0) + 1.0) % 1.0 - 0.5;
					return <Box key={i} p={[-0.65 + ((i * 0.61) % 1.3), y, 0.01]} s={[0.025, 0.025, 0.01]} m={M.snow} />;
				})}
				<Box p={[0, 0.52, 0.03]} s={[1.5, 0.06, 0.05]} m={M.white} />
				<Box p={[0, -0.52, 0.03]} s={[1.5, 0.06, 0.05]} m={M.white} />
			</group>
			{/* the dark TV */}
			<Box p={[1.6, 0.35, -2.7]} s={[1.2, 0.7, 0.45]} m={M.woodDark} />
			<Box p={[1.6, 1.05, -2.75]} s={[1.1, 0.65, 0.08]} m={M.tv} />
			{/* the lamp */}
			<Box p={[-2.5, 0.6, 1.2]} s={[0.06, 1.2, 0.06]} m={M.woodDark} />
			<Box p={[-2.5, 1.3, 1.2]} s={[0.4, 0.3, 0.4]} m={M.lampShade} />
			{/* the stairs up, at the back right */}
			{Array.from({length: 9}, (_, i) => (
				<Box key={i} p={[2.45, 0.11 + i * 0.22, 1.5 - i * 0.28]} s={[1.0, 0.22, 0.28]} m={M.stair} />
			))}
			<Box p={[1.93, 1.4, 0.4]} s={[0.05, 0.05, 2.6]} m={M.rail} r={[0.66, 0, 0]} />
			{/* the couch, facing the TV */}
			<group position={[0.3, 0, 0.9]} rotation={[0, Math.PI / 2, 0]}>
				<PsxProp path="assets/models/psx/props/derelict-couch.glb" s={1} />
			</group>
		</group>
	);
};
export const LR = (p: V3): V3 => [p[0], p[1], p[2] + 12]; // a point in the living room's own frame -> world

// ------------------------------------------------------------------ it
export type ItPose = {bend: number; reach?: number; lean?: number; lookUp?: number};
/** standing perfectly still (bend 0), or bent at the hips over something (bend 1 = 90°), its neck carrying
 *  the head down further; the arms hang. */
const IB = {head: new THREE.Vector3(), top: new THREE.Vector3(), ok: false};
export const It: React.FC<{p: V3; ry: number; pose: ItPose; eyes?: boolean}> = ({p, ry, pose, eyes}) => {
	const M = useM();
	const {bend, reach = 0, lookUp = 0} = pose;
	const b = bend * (Math.PI / 2);
	const P: Pose = merge(ARMS_DOWN, {
		Spine: [['x', b * 0.4]],
		Spine1: [['x', b * 0.35]],
		Spine2: [['x', b * 0.25]],
		Neck: [['x', 0.25 * bend - 0.6 * lookUp]],
		Head: [['x', 0.15 * bend - 0.5 * lookUp]],
		LeftArm: [['aim', [0.12, -1, 0.15 + 0.9 * bend + 0.3 * reach]]],
		RightArm: [['aim', [-0.12, -1, 0.15 + 0.9 * bend + 0.3 * reach]]],
		LeftForeArm: [['aim', [0.05, -1, 0.1 + 0.5 * bend]]],
		RightForeArm: [['aim', [-0.05, -1, 0.1 + 0.5 * bend]]],
	});
	// infrared eyeshine: two points in its sockets, placed from the head bones every frame
	const ref = useRef<THREE.Group>(null);
	const place = () => {
		const g = ref.current;
		if (!g || !IB.ok) return;
		const up = IB.top.clone().sub(IB.head);
		const len = up.length();
		up.normalize();
		const fwd = new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry));
		fwd.addScaledVector(up, -fwd.dot(up)).normalize();
		const side = new THREE.Vector3().crossVectors(up, fwd).normalize();
		g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, up, fwd));
		g.position.copy(IB.head).addScaledVector(up, 0.42 * len).addScaledVector(fwd, 0.55 * len);
		g.visible = true;
	};
	useFrame(place, -1);
	React.useLayoutEffect(place);
	return (
		<>
			<PsxCharacter name="Character_Monster_04" height={IT_H} tint={{color: '#e4e0dc', emissive: '#141014'}} position={p} rotation={[0, ry, 0]} pose={P}
				probe={(w) => {
					IB.head.copy(w('Head'));
					IB.top.copy(w('HeadTop_End'));
					IB.ok = true;
				}} />
			{eyes && (
				<group ref={ref} visible={false}>
					<Box p={[-0.05, 0, 0]} s={[0.05, 0.035, 0.01]} m={M.eyeshine} />
					<Box p={[0.05, 0, 0]} s={[0.05, 0.035, 0.01]} m={M.eyeshine} />
				</group>
			)}
		</>
	);
};
