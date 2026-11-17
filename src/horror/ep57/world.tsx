// Episode 57 world: "The Station That Isn't" (Season 6; a woman posting to a forum from a late train that stops at a
// station on no map; retold in our own words from the 2004 thread; the poster isn't named).
// - THE STATION: one concrete platform beside a single line (the track along z), a mercury lamp on a pole, the name
//   board KISARAGI with no station before or after it, dark fields, a ridge.
// - THE CARRIAGE: an empty commuter car (long side benches, straps, tube lights, black windows).
// - THE LINE: rails and sleepers on ballast, running −z to a tunnel mouth in the hill.
// - THE MAN ON ONE LEG: the user's PSX Character_Monster_06 (a rotting ghoul, a skull face with an open mouth),
//   standing on the rail in the tunnel mouth on his right leg; the left is gone below the knee, the stump bleeding.
// - THE CAR: a small car's front seats from the passenger side; the driver is the user's PSX Character_Killer_09
//   (ordinary clothes, a grinning old man's face).
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

export const TUNNEL_Z = -46;

const useMatsInner = () =>
	useMemo(() => {
		const concrete = tex(16, 16, (g) => {
			g.fillStyle = '#8a8a84';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 50; i++) {
				g.fillStyle = ['#7a7a74', '#969690', '#6e6e68'][i % 3];
				g.fillRect((i * 7) % 16, (i * 11) % 16, 1, 1);
			}
			g.fillStyle = '#5e5e58';
			g.fillRect(0, 15, 16, 1);
		}, [2, 8]);
		const ballast = tex(16, 16, (g) => {
			g.fillStyle = '#5a5650';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 90; i++) {
				g.fillStyle = ['#46423c', '#6e6a62', '#3a3630', '#7a766c'][i % 4];
				g.fillRect((i * 5) % 16, (i * 7) % 16, 2, 1);
			}
		}, [2, 20]);
		const sign = tex(96, 32, (g) => {
			g.fillStyle = '#f0f0e8';
			g.fillRect(0, 0, 96, 32);
			g.fillStyle = '#1a1a1a';
			g.font = 'bold 14px "DejaVu Sans", sans-serif';
			g.textAlign = 'center';
			g.fillText('KISARAGI', 48, 15);
			// the bar under the name, and the two neighbours' places, empty
			g.fillStyle = '#2a6a3a';
			g.fillRect(0, 19, 96, 3);
			g.fillStyle = '#1a1a1a';
			g.font = 'bold 7px "DejaVu Sans", sans-serif';
			g.textAlign = 'left';
			g.fillText('◀', 3, 30);
			g.textAlign = 'right';
			g.fillText('▶', 93, 30);
		});
		const seat = tex(8, 8, (g) => {
			g.fillStyle = '#3a4a6a';
			g.fillRect(0, 0, 8, 8);
			g.fillStyle = '#2e3c58';
			for (let y = 0; y < 8; y += 2) g.fillRect(0, y, 8, 1);
		});
		const rock = tex(16, 16, (g) => {
			g.fillStyle = '#3a3a36';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 40; i++) {
				g.fillStyle = ['#2c2c28', '#4a4a44', '#34342e'][i % 3];
				g.fillRect((i * 5) % 16, (i * 7) % 16, 3, 1);
			}
		}, [3, 2]);
		return {
			concrete: lam('#ffffff', {map: concrete}),
			edge: lam('#c8b020'),
			ballast: lam('#ffffff', {map: ballast}),
			rail: lam('#8a8c90'),
			sleeper: lam('#3e3428'),
			pole: lam('#5a5a5a'),
			lamp: bas('#d8fff0'),
			sign: lam('#ffffff', {map: sign, emissive: '#1a201c'}),
			field: lam('#16201a'),
			ridge: bas('#060a0c'),
			wall: lam('#c8c8c0'),
			floor: lam('#5a5850'),
			seat: lam('#ffffff', {map: seat}),
			tube: bas('#f0fff4'),
			strap: lam('#d8d8d0'),
			window: bas('#05070a'),
			streak: bas('#6a8a80'),
			rock: lam('#ffffff', {map: rock}),
			black: bas('#000000'),
			blood: lam('#6a0806', {emissive: '#200000'}),
			bone: lam('#e0d8c4', {emissive: '#1a1810'}),
			dash: lam('#1e1e20'),
			carSeat: lam('#2a2a2c'),
			glow: bas('#ff9a40'),
			tree: lam('#141c16'),
			road: lam('#2a2a2c'),
			eye: bas('#e8e0c8'),
		};
	}, []);
type Mats = ReturnType<typeof useMatsInner>;
const Ctx = createContext<Mats | null>(null);
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMatsInner()}>{children}</Ctx.Provider>;
export const useM = () => useContext(Ctx)!;

// ------------------------------------------------------------------ the line (rails and sleepers along z)
export const Line: React.FC<{z0: number; z1: number}> = ({z0, z1}) => {
	const M = useM();
	const sleepers: React.ReactNode[] = [];
	for (let z = z0; z > z1; z -= 0.65) sleepers.push(<Box key={z} p={[0, 0.08, z]} s={[2.3, 0.12, 0.22]} m={M.sleeper} />);
	return (
		<group>
			<Box p={[0, 0, (z0 + z1) / 2]} s={[3.6, 0.08, z0 - z1]} m={M.ballast} />
			{sleepers}
			{[-0.72, 0.72].map((x) => (
				<Box key={x} p={[x, 0.2, (z0 + z1) / 2]} s={[0.07, 0.12, z0 - z1]} m={M.rail} />
			))}
		</group>
	);
};

// ------------------------------------------------------------------ the station
export const Station: React.FC<{flicker?: number}> = ({flicker = 1}) => {
	const M = useM();
	return (
		<group>
			<Line z0={30} z1={-60} />
			{/* the platform on the left of the line, its yellow edge */}
			<Box p={[-3.3, 0.5, 0]} s={[3.6, 1.0, 26]} m={M.concrete} />
			<Box p={[-1.6, 1.0, 0]} s={[0.2, 0.02, 26]} m={M.edge} />
			{/* the name board on two posts, facing the line */}
			<group position={[-3.2, 0, -1.5]}>
				<Box p={[-0.9, 1.9, 0]} s={[0.08, 1.8, 0.08]} m={M.pole} />
				<Box p={[0.9, 1.9, 0]} s={[0.08, 1.8, 0.08]} m={M.pole} />
				<mesh position={[0, 2.45, 0.05]} rotation={[0, Math.PI / 2, 0]} material={M.sign}>
					<boxGeometry args={[2.1, 0.7, 0.04, 6, 2, 1]} />
				</mesh>
			</group>
			{/* the mercury lamp */}
			<Box p={[-4.4, 2.2, 2.5]} s={[0.12, 3.4, 0.12]} m={M.pole} />
			<Box p={[-3.9, 3.85, 2.5]} s={[1.0, 0.08, 0.1]} m={M.pole} />
			<mesh position={[-3.45, 3.75, 2.5]} material={M.lamp} scale={flicker > 0.5 ? 1 : 0.001}>
				<boxGeometry args={[0.3, 0.1, 0.18]} />
			</mesh>
			{/* fields either side, a ridge far off */}
			<Box p={[-25, -0.1, -10]} s={[40, 0.1, 90]} m={M.field} />
			<Box p={[25, -0.1, -10]} s={[40, 0.1, 90]} m={M.field} />
			<mesh position={[0, 6, -80]} material={M.ridge}>
				<boxGeometry args={[200, 20, 4]} />
			</mesh>
		</group>
	);
};

// ------------------------------------------------------------------ the tunnel mouth at the end of the line
export const Tunnel: React.FC = () => {
	const M = useM();
	return (
		<group position={[0, 0, TUNNEL_Z]}>
			{/* the hill face round the mouth, and the black inside */}
			<Box p={[-4.2, 3, 0]} s={[5, 6, 1]} m={M.rock} />
			<Box p={[4.2, 3, 0]} s={[5, 6, 1]} m={M.rock} />
			<Box p={[0, 5.2, 0]} s={[3.6, 1.6, 1]} m={M.rock} />
			<mesh position={[0, 2.2, -0.6]} material={M.black}>
				<boxGeometry args={[3.6, 4.4, 0.2]} />
			</mesh>
		</group>
	);
};

// ------------------------------------------------------------------ the carriage
export const Carriage: React.FC<{t: number}> = ({t}) => {
	const M = useM();
	const L = 18;
	const streaks: React.ReactNode[] = [];
	// lights outside sliding past the black windows (now and then)
	for (let i = 0; i < 4; i++) {
		const z = ((((t + 600) * 14 + i * 9) % 36) + 36) % 36 - 18;
		streaks.push(
			<mesh key={i} position={[(i % 2 ? 1 : -1) * 1.48, 1.6, z]} material={M.streak}>
				<boxGeometry args={[0.02, 0.05, 1.4]} />
			</mesh>,
		);
	}
	return (
		<group>
			<Box p={[0, 0, 0]} s={[3, 0.1, L]} m={M.floor} />
			<Box p={[0, 2.4, 0]} s={[3, 0.1, L]} m={M.wall} />
			{[-1, 1].map((s) => (
				<group key={s}>
					{/* wall below the windows, the black windows, above */}
					<Box p={[s * 1.5, 0.6, 0]} s={[0.06, 1.2, L]} m={M.wall} />
					<mesh position={[s * 1.49, 1.6, 0]} rotation={[0, -s * Math.PI / 2, 0]} material={M.window}>
						<planeGeometry args={[L, 0.8]} />
					</mesh>
					<Box p={[s * 1.5, 2.15, 0]} s={[0.06, 0.4, L]} m={M.wall} />
					{/* the long bench */}
					<Box p={[s * 1.22, 0.45, 0]} s={[0.5, 0.12, L - 2]} m={M.seat} />
					<Box p={[s * 1.42, 0.8, 0]} s={[0.1, 0.6, L - 2]} m={M.seat} />
					{/* the tube lights and straps */}
					<mesh position={[s * 0.7, 2.33, 0]} material={M.tube}>
						<boxGeometry args={[0.1, 0.04, L - 1]} />
					</mesh>
					{Array.from({length: 14}, (_, i) => (
						<Box key={i} p={[s * 0.75, 1.95 + 0.02 * Math.sin(t * 2 + i), -7.8 + i * 1.2]} s={[0.04, 0.3, 0.04]} m={M.strap} />
					))}
				</group>
			))}
			{/* the dark door to the driver's cab at the far end */}
			<Box p={[0, 1.2, -L / 2]} s={[3, 2.4, 0.1]} m={M.wall} />
			<mesh position={[0, 1.55, -L / 2 + 0.06]} material={M.window}>
				<planeGeometry args={[0.6, 0.6]} />
			</mesh>
			{streaks}
		</group>
	);
};

// ------------------------------------------------------------------ the man on one leg
const MN = ['Hips', 'Neck', 'Head', 'HeadTop_End', 'LeftUpLeg', 'LeftLeg', 'RightArm', 'RightHand'] as const;
const MB: Record<string, THREE.Vector3> & {ready?: boolean} = Object.fromEntries(MN.map((n) => [n, new THREE.Vector3()]));
/** shout 0..1: he leans in, his arm out at me, his mouth open; hop: a lurch forward on the one leg */
export const OneLeg: React.FC<{p: V3; ry: number; shout: number; t: number}> = ({p, ry, shout, t}) => {
	const M = useM();
	const sway = 0.06 * Math.sin(t * 3.1);
	const pose: Pose = merge(ARMS_DOWN, {
		// the left leg ends at the knee: the shin and foot shrink to nothing
		LeftUpLeg: [['aim', [0.15, -0.8, 0.45]]],
		LeftLeg: [['stretch', 0.02]],
		RightUpLeg: [['aim', [-0.05, -1, 0.05]]],
		RightLeg: [['aim', [0, -1, -0.05]]],
		Spine: [['x', 0.15 + 0.35 * shout], ['z', sway]],
		Neck: [['x', -0.2 - 0.3 * shout]],
		Head: [['x', -0.1 - 0.2 * shout], ['z', -0.15 * shout]],
		// his right arm out at me, the hand open; the left thrown out for balance
		RightArm: [['aim', [-0.15, 0.05 + 0.25 * shout, 1]]],
		RightForeArm: [['aim', [-0.05, 0.1 + 0.2 * shout, 1]]],
		LeftArm: [['aim', [0.9, -0.35, -0.1]]],
		LeftForeArm: [['aim', [0.8, -0.5, 0.2]]],
	});
	const stump = useRef<THREE.Group>(null);
	const place = () => {
		if (!MB.ready || !stump.current) return;
		const k = MB.LeftLeg;
		const d = k.clone().sub(MB.LeftUpLeg).normalize();
		stump.current.position.copy(k);
		stump.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), d);
	};
	useFrame(place, -1);
	React.useLayoutEffect(place);
	return (
		<>
			<PsxCharacter
				name="Character_Monster_06"
				height={1.8}
				tint={{color: '#c8c8b8', emissive: '#0a0c08'}}
				position={p}
				rotation={[0, ry, 0]}
				pose={pose}
				probe={(w) => {
					for (const n of MN) MB[n].copy(w(n));
					MB.ready = true;
				}}
			/>
			{/* the stump: torn, the bone out of it, blood running down to the rail */}
			<group ref={stump}>
				<mesh material={M.blood} position={[0, -0.04, 0]}>
					<boxGeometry args={[0.13, 0.1, 0.13]} />
				</mesh>
				<mesh material={M.bone} position={[0.02, -0.11, 0.01]} rotation={[0.2, 0, 0.15]}>
					<coneGeometry args={[0.025, 0.14, 4]} />
				</mesh>
				<mesh material={M.blood} position={[0, -0.18, 0.02]}>
					<boxGeometry args={[0.02, 0.2, 0.02]} />
				</mesh>
			</group>
		</>
	);
};

// ------------------------------------------------------------------ the car (passenger side, right-hand drive)
export const Car: React.FC<{t: number; turn: number}> = ({t, turn}) => {
	const M = useM();
	// trees sliding past the windscreen
	const trees: React.ReactNode[] = [];
	for (let i = 0; i < 16; i++) {
		const z = -(((((t + 600) * 9 + i * 4.3) % 60) + 60) % 60) - 3;
		const x = (i % 2 ? 1 : -1) * (3.5 + (i % 3));
		trees.push(<Box key={i} p={[x + 0.3 * Math.sin(z * 0.2), 3, z]} s={[0.4, 6, 0.4]} m={M.tree} />);
	}
	return (
		<group>
			<Box p={[0, -0.02, -20]} s={[6, 0.04, 40]} m={M.road} />
			{trees}
			{/* the dash and its glow, the A-pillars, the roof */}
			<Box p={[0, 0.8, -0.95]} s={[1.6, 0.3, 0.5]} m={M.dash} />
			<mesh position={[0.4, 0.97, -0.75]} material={M.glow}>
				<boxGeometry args={[0.18, 0.04, 0.02]} />
			</mesh>
			{[-0.78, 0.78].map((x) => (
				<Box key={x} p={[x, 1.2, -0.95]} s={[0.06, 0.6, 0.06]} r={[0.5, 0, 0]} m={M.dash} />
			))}
			<Box p={[0, 1.48, -0.1]} s={[1.6, 0.04, 1.8]} m={M.dash} />
			{/* his seat */}
			<Box p={[0.4, 0.45, 0.05]} s={[0.5, 0.12, 0.5]} m={M.carSeat} />
			<Box p={[0.4, 0.85, 0.32]} s={[0.5, 0.75, 0.12]} r={[-0.15, 0, 0]} m={M.carSeat} />
			<mesh position={[0.4, 1.0, -0.62]} rotation={[-1.1, 0, 0]} material={M.dash}>
				<torusGeometry args={[0.18, 0.025, 4, 12]} />
			</mesh>
			<Driver turn={turn} />
		</group>
	);
};
const Driver: React.FC<{turn: number}> = ({turn}) => (
	<PsxCharacter
		name="Character_Killer_09"
		height={1.74}
		tint={{color: '#d0c8b8'}}
		position={[0.4, -0.32, 0.05]}
		rotation={[0, Math.PI, 0]}
		pose={merge(ARMS_DOWN, {
			LeftUpLeg: [['aim', [0.08, -0.15, 1]]],
			RightUpLeg: [['aim', [-0.08, -0.15, 1]]],
			LeftLeg: [['aim', [0, -1, 0.3]]],
			RightLeg: [['aim', [0, -1, 0.3]]],
			// hands on the wheel
			LeftArm: [['aim', [0.15, -0.55, 0.8]]],
			RightArm: [['aim', [-0.15, -0.55, 0.8]]],
			LeftForeArm: [['aim', [-0.25, 0.2, 1]]],
			RightForeArm: [['aim', [0.25, 0.2, 1]]],
			// his head turns, slowly, to me (on his left)
			Neck: [['y', turn * 0.75]],
			Head: [['y', turn * 0.6], ['x', 0.1 * turn]],
		})}
	/>
);
