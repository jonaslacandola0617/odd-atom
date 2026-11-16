// Episode 51 world: "Po Po Po" (Season 6 opener; a teenager's summer at his grandparents' farmhouse in the
// Japanese countryside, retold from a 2ch post; no real village, family or shrine).
// - THE GARDEN (day): a lawn, a hedge 2.45 m tall along z −6 (x ±9), hills and poles beyond, a white sky.
// - THE ROOM (night): the upstairs tatami room, x −2..2, z −2..2, 2.4 m high. Windows: W1 in the back wall
//   (z −2) at x −0.5, W2 in the left wall (x −2) at z −1.2, both papered over with newspaper; the sliding
//   paper door in the right wall (x 2) at z −0.45..0.45. Salt bowls in the four corners and one by the futon.
// - THE ROAD (dawn): a valley road along −z, fields, mist, poles; the family car (the PSX car pack's Car4).
// - HER: the user's PSX Character_Monster_03 (long black hair, hollow eyes), pale, stretched to 2.75 m, in a built white dress and a wide
//   white hat; she folds at the waist. She is never shown as a real person.
import React, {createContext, useContext, useMemo} from 'react';
import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {ps1} from '../ps1';
import {SNAP6} from '../ep01/world';
import {ARMS_DOWN, merge, Pose, PsxCharacter, PsxProp} from '../psx/models';
import {Box, tex} from '../ep41/world';

export type V3 = [number, number, number];
const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 64, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 64, SNAP6);

export const ROOM = {w: 2, h: 2.4};
export const W1: V3 = [-0.5, 1.35, -2]; // window centre, back wall
export const W2: V3 = [-2, 1.35, -1.2]; // window centre, left wall
export const DOOR = {x: 2, z0: -0.45, z1: 0.45, h: 1.8};
export const HEDGE = {z: -6, h: 2.45, d: 0.9};

/** a newspaper sheet: grey columns of unreadable type and a dark headline block (no real masthead) */
const paperTex = (seed: number) =>
	tex(32, 24, (g) => {
		g.fillStyle = '#cfc8b4';
		g.fillRect(0, 0, 32, 24);
		g.fillStyle = '#4a463e';
		g.fillRect(2, 2, 18 + (seed % 3) * 3, 3);
		let s = seed * 97 + 13;
		const r = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
		for (let c = 0; c < 4; c++)
			for (let y = 7; y < 23; y += 2) {
				g.fillStyle = r() < 0.15 ? '#8a8476' : '#9a9486';
				g.fillRect(2 + c * 7.5, y, 6 - (r() < 0.2 ? 3 : 0), 1);
			}
		g.fillStyle = 'rgba(120,96,50,0.25)'; // tape stains at the corners
		g.fillRect(0, 0, 4, 3);
		g.fillRect(28, 21, 4, 3);
	});

const useMatsInner = () =>
	useMemo(() => {
		const grass = tex(16, 16, (g) => {
			g.fillStyle = '#7a8a4c';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 40; i++) {
				g.fillStyle = i % 2 ? '#6a7a40' : '#8c9a5a';
				g.fillRect((i * 7) % 16, (i * 5) % 16, 1, 2);
			}
		}, [24, 24]);
		const leaf = tex(32, 32, (g) => {
			g.fillStyle = '#3a4e26';
			g.fillRect(0, 0, 32, 32);
			let s = 7;
			const r = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
			for (let i = 0; i < 420; i++) {
				g.fillStyle = ['#2a3a1a', '#54703a', '#46602c', '#62803f'][i % 4];
				g.fillRect(Math.floor(r() * 32), Math.floor(r() * 32), 1, 1 + (i % 2));
			}
		}, [40, 5]);
		const tatami = tex(16, 32, (g) => {
			g.fillStyle = '#a89a62';
			g.fillRect(0, 0, 16, 32);
			for (let y = 0; y < 32; y += 2) {
				g.fillStyle = '#968854';
				g.fillRect(0, y, 16, 1);
			}
			g.fillStyle = '#3a3226';
			g.fillRect(0, 0, 1, 32);
			g.fillRect(15, 0, 1, 32);
		}, [4, 2]);
		const plaster = tex(16, 16, (g) => {
			g.fillStyle = '#b4a888';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 18; i++) {
				g.fillStyle = i % 3 ? 'rgba(80,66,40,0.16)' : 'rgba(255,255,255,0.08)';
				g.fillRect((i * 7) % 16, (i * 11) % 16, 2, 1);
			}
		}, [3, 2]);
		const road = tex(16, 32, (g) => {
			g.fillStyle = '#6a6862';
			g.fillRect(0, 0, 16, 32);
			for (let i = 0; i < 50; i++) {
				g.fillStyle = i % 2 ? '#5a5852' : '#7a786e';
				g.fillRect((i * 5) % 16, (i * 13) % 32, 1, 1);
			}
		}, [1, 30]);
		const field = tex(16, 16, (g) => {
			g.fillStyle = '#6a7454';
			g.fillRect(0, 0, 16, 16);
			for (let x = 0; x < 16; x += 3) {
				g.fillStyle = '#566046';
				g.fillRect(x, 0, 1, 16);
			}
		}, [20, 40]);
		return {
			grass: lam('#ffffff', {map: grass}),
			leaf: lam('#ffffff', {map: leaf}),
			tatami: lam('#ffffff', {map: tatami}),
			plaster: lam('#ffffff', {map: plaster}),
			ceil: lam('#6e604a'),
			wood: lam('#4a3624'),
			darkwood: lam('#2a1e14'),
			paper: [0, 1, 2, 3].map((i) => lam('#ffffff', {map: paperTex(i + 1), side: THREE.DoubleSide})),
			bowl: lam('#d8d4c8'),
			shoji: lam('#e2dac4', {side: THREE.DoubleSide}),
			futon: lam('#8a92a8'),
			pillow: lam('#c8c4b4'),
			bulb: bas('#ffe8b0'),
			cord: lam('#1a1410'),
			glass: bas('#20262e', {transparent: true, opacity: 0.35, depthWrite: false}),
			nightOut: bas('#0c1016'),
			hill: lam('#7a8a6a'),
			pole: lam('#5a4a3a'),
			road: lam('#ffffff', {map: road}),
			field: lam('#ffffff', {map: field}),
			white: lam('#eeeee8'),
			hat: lam('#d6d0c2'),
			hatband: lam('#16120e'),
			mouth: bas('#050404'),
			eye: bas('#000000'),
			blood: bas('#6e0a0c'),
			seat: lam('#4a4a52'),
			trim: lam('#2e2e34'),
		};
	}, []);
type Mats = ReturnType<typeof useMatsInner>;
const Ctx = createContext<Mats | null>(null);
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMatsInner()}>{children}</Ctx.Provider>;
export const useM = () => useContext(Ctx)!;

// ------------------------------------------------------------------ the garden (day)
export const Garden: React.FC = () => {
	const M = useM();
	// a lumpy top edge so the hedge reads as clipped leaves, not a wall
	const lumps = useMemo(() => Array.from({length: 26}, (_, i) => ({x: -9 + i * 0.7 + ((i * 37) % 5) * 0.06, h: 0.08 + ((i * 53) % 7) * 0.025, w: 0.5 + ((i * 29) % 4) * 0.08})), []);
	return (
		<group>
			<Box p={[0, -0.05, -4]} s={[40, 0.1, 40]} m={M.grass} />
			<Box p={[0, HEDGE.h / 2, HEDGE.z]} s={[18, HEDGE.h, HEDGE.d]} m={M.leaf} />
			{lumps.map((l, i) => (
				<Box key={i} p={[l.x, HEDGE.h + l.h / 2 - 0.02, HEDGE.z + ((i % 3) - 1) * 0.15]} s={[l.w, l.h, HEDGE.d * 0.85]} m={M.leaf} />
			))}
			{/* hills far beyond, and one leaning pole */}
			<mesh position={[-14, 0, -40]} material={M.hill}>
				<coneGeometry args={[16, 9, 6]} />
			</mesh>
			<mesh position={[12, 0, -46]} material={M.hill}>
				<coneGeometry args={[18, 12, 6]} />
			</mesh>
			<Box p={[3.2, 3.6, -14]} s={[0.18, 7.2, 0.18]} m={M.pole} r={[0, 0, 0.04]} />
			<Box p={[3.35, 6.9, -14]} s={[1.4, 0.1, 0.1]} m={M.pole} />
			{/* the house's eave at the top of frame (we stand on the engawa) */}
			<Box p={[0, 3.25, 1.2]} s={[12, 0.14, 2.4]} m={M.darkwood} />
		</group>
	);
};

// ------------------------------------------------------------------ salt bowl
/** black: 0..1, how far the salt has turned (from the rim inward) */
export const SaltBowl: React.FC<{p: V3; black: number}> = ({p, black}) => {
	const M = useM();
	const salt = useMemo(() => lam('#f4f2ec'), []);
	salt.color.setRGB(0.95 - 0.88 * black, 0.94 - 0.88 * black, 0.92 - 0.86 * black);
	return (
		<group position={p}>
			<mesh position={[0, 0.03, 0]} material={M.bowl}>
				<cylinderGeometry args={[0.09, 0.055, 0.06, 10]} />
			</mesh>
			{/* the salt heaped in a cone */}
			<mesh position={[0, 0.085, 0]} material={salt}>
				<coneGeometry args={[0.08, 0.07, 10]} />
			</mesh>
		</group>
	);
};

// ------------------------------------------------------------------ the room (night)
/** papers: per window, a press inward (0..1) for the taps; tear: 0..1 the back window's paper ripped off */
export const Room: React.FC<{press?: number[]; tear?: number; salt?: number; nearSalt?: number; doorOpen?: number; t: number; dusk?: boolean; cover?: number; hideDoor?: boolean}> = ({press = [0, 0], tear = 0, salt = 0, nearSalt = 0, doorOpen = 0, t, dusk = false, cover = 1, hideDoor = false}) => {
	const M = useM();
	M.nightOut.color.set(dusk ? '#c0783c' : '#0c1016');
	const W = ROOM.w, H = ROOM.h;
	return (
		<group>
			<Box p={[0, -0.02, 0]} s={[4, 0.04, 4]} m={M.tatami} />
			<Box p={[0, H, 0]} s={[4, 0.04, 4]} m={M.ceil} />
			{/* back wall with W1 (x −1.1..0.1, y 0.9..1.8) */}
			<Box p={[0, 0.45, -W]} s={[4, 0.9, 0.06]} m={M.plaster} />
			<Box p={[0, 2.1, -W]} s={[4, 0.6, 0.06]} m={M.plaster} />
			<Box p={[-1.55, 1.35, -W]} s={[0.9, 0.9, 0.06]} m={M.plaster} />
			<Box p={[1.05, 1.35, -W]} s={[1.9, 0.9, 0.06]} m={M.plaster} />
			{/* left wall with W2 (z −1.8..−0.6) */}
			<Box p={[-W, 0.45, 0]} s={[0.06, 0.9, 4]} m={M.plaster} />
			<Box p={[-W, 2.1, 0]} s={[0.06, 0.6, 4]} m={M.plaster} />
			<Box p={[-W, 1.35, -1.9]} s={[0.06, 0.9, 0.2]} m={M.plaster} />
			<Box p={[-W, 1.35, 0.7]} s={[0.06, 0.9, 2.6]} m={M.plaster} />
			{/* front wall */}
			<Box p={[0, H / 2, W]} s={[4, H, 0.06]} m={M.plaster} />
			{/* right wall with the sliding door (z −0.45..0.45, up to 1.8) */}
			<Box p={[W, 2.1, 0]} s={[0.06, 0.6, 4]} m={M.plaster} />
			<Box p={[W, 0.9, -1.225]} s={[0.06, 1.8, 1.55]} m={M.plaster} />
			<Box p={[W, 0.9, 1.225]} s={[0.06, 1.8, 1.55]} m={M.plaster} />
			{/* the windows: dark night behind, glass, frame, and newspaper taped over */}
			<Win at={W1} axis="z" press={press[0]} tear={tear} paper={M.paper[0]} cover={cover} mullion={false} />
			<Win at={W2} axis="x" press={press[1]} paper={M.paper[1]} />
			{/* the bulb on its cord, swaying a little */}
			<Bulb t={t} />
			{/* the futon and the salt in the corners */}
			<Box p={[-0.35, 0.04, -0.4]} s={[1.0, 0.08, 2.0]} m={M.futon} />
			{([[-1.7, -1.7], [1.7, -1.7], [-1.7, 1.7], [1.7, 1.7]] as [number, number][]).map(([x, z], i) => (
				<SaltBowl key={i} p={[x, 0, z]} black={salt} />
			))}
			<SaltBowl p={[0.82, 0, 0.82]} black={nearSalt} />
			{!hideDoor && <SlidingDoor open={doorOpen} />}
		</group>
	);
};

/** a papered window; axis: which way the wall faces (z: back wall, x: left wall) */
const Win: React.FC<{at: V3; axis: 'x' | 'z'; press: number; tear?: number; paper: THREE.Material; cover?: number; mullion?: boolean}> = ({at, axis, press, tear = 0, paper, cover = 1, mullion = true}) => {
	const M = useM();
	const ry = axis === 'z' ? 0 : Math.PI / 2;
	const dz = axis === 'z' ? 1 : 1; // inward is +z for the back wall, +x for the left wall (local +z after ry)
	// the tear: the upper flap peels down toward the room and falls; the lower strip stays taped
	const flap = Math.min(1, tear * 1.4);
	return (
		<group position={at} rotation={[0, ry, 0]}>
			<mesh position={[0, 0, -0.08]} material={M.nightOut}>
				<planeGeometry args={[1.3, 1.0]} />
			</mesh>
			<mesh position={[0, 0, 0]} material={M.glass}>
				<planeGeometry args={[1.2, 0.9]} />
			</mesh>
			<Box p={[0, 0.47, 0.02]} s={[1.28, 0.06, 0.06]} m={M.wood} />
			<Box p={[0, -0.47, 0.02]} s={[1.28, 0.06, 0.06]} m={M.wood} />
			<Box p={[-0.62, 0, 0.02]} s={[0.06, 0.98, 0.06]} m={M.wood} />
			<Box p={[0.62, 0, 0.02]} s={[0.06, 0.98, 0.06]} m={M.wood} />
			{mullion && <Box p={[0, 0, 0.02]} s={[0.04, 0.9, 0.04]} m={M.wood} />}
			{/* paper: pressed inward in the middle by press (a bulge toward the room) */}
			{tear < 1 && cover > 0.01 && (
				<group position={[0, -0.45, 0.06 * dz]} rotation={[flap * 1.6, 0, 0]}>
					<mesh position={[0, (0.9 * cover) / 2 + 0.02, 0.01 + 0.07 * press]} material={paper}>
						<planeGeometry args={[1.2, 0.9 * cover * (1 - 0.72 * Math.min(1, tear * 3)), 4, 4]} />
					</mesh>
				</group>
			)}
			{/* the strip that stays taped at the bottom once it tears */}
			{tear > 0 && (
				<mesh position={[0, -0.36, 0.07]} material={paper}>
					<planeGeometry args={[1.2, 0.18]} />
				</mesh>
			)}
		</group>
	);
};

const Bulb: React.FC<{t: number}> = ({t}) => {
	const M = useM();
	const sw = 0.05 * Math.sin(t * 1.3);
	return (
		<group position={[-0.2, ROOM.h, -0.2]} rotation={[sw, 0, sw * 0.6]}>
			<Box p={[0, -0.35, 0]} s={[0.01, 0.7, 0.01]} m={M.cord} />
			<mesh position={[0, -0.74, 0]} material={M.bulb}>
				<sphereGeometry args={[0.04, 6, 4]} />
			</mesh>
		</group>
	);
};

/** the sliding door in the right wall: lattice and paper; open: 0..1 slid back along −z */
export const SlidingDoor: React.FC<{open: number; paperMat?: THREE.Material}> = ({open, paperMat}) => {
	const M = useM();
	const paper = paperMat ?? M.shoji;
	const z = -0.9 * open;
	return (
		<group position={[DOOR.x - 0.02, DOOR.h / 2, z]}>
			<mesh rotation={[0, -Math.PI / 2, 0]} material={paper}>
				<planeGeometry args={[0.9, DOOR.h]} />
			</mesh>
			{[-0.45, -0.15, 0.15, 0.45].map((zz) => (
				<Box key={zz} p={[-0.02, 0, zz]} s={[0.03, DOOR.h, 0.025]} m={M.darkwood} />
			))}
			{[-0.9, -0.45, 0, 0.45, 0.9].map((yy) => (
				<Box key={yy} p={[-0.02, yy * 0.99, 0]} s={[0.03, 0.025, 0.9]} m={M.darkwood} />
			))}
		</group>
	);
};

// ------------------------------------------------------------------ the shadow on the door's paper
/** the hallway lamp behind her throws her shadow on the paper: fold 0..1 (at the waist), drop 0..1 (her
 *  neck stretching down below the shoulders), tilt (radians, the head's roll), nod (a syllable bob) */
export const shadowCanvas = () => {
	const c = document.createElement('canvas');
	c.width = 72;
	c.height = 144;
	return c;
};
export const drawShadow = (c: HTMLCanvasElement, fold: number, drop: number, tilt: number, nod: number, lamp: number) => {
	const g = c.getContext('2d')!;
	const W = c.width, H = c.height;
	const px = H / DOOR.h; // pixels per metre (80)
	const Y = (m: number) => H - m * px; // metres above the floor -> canvas y
	// the paper, lit warm from behind (the lamp flickers a touch)
	const v = Math.round(150 + 50 * lamp);
	g.fillStyle = `rgb(${v + 30},${v + 12},${v - 30})`;
	g.fillRect(0, 0, W, H);
	const grad = g.createRadialGradient(W * 0.55, H * 0.2, 4, W * 0.55, H * 0.2, H * 0.9);
	grad.addColorStop(0, 'rgba(255,240,200,0.25)');
	grad.addColorStop(1, 'rgba(0,0,0,0.35)');
	g.fillStyle = grad;
	g.fillRect(0, 0, W, H);
	g.filter = 'blur(1px)';
	g.fillStyle = 'rgba(16,10,6,0.9)';
	const cx = W * 0.5;
	// the dress: from the floor to the hips (1.45 m)
	g.beginPath();
	g.moveTo(cx - 0.3 * px, Y(0));
	g.lineTo(cx + 0.3 * px, Y(0));
	g.lineTo(cx + 0.13 * px, Y(1.45));
	g.lineTo(cx - 0.13 * px, Y(1.45));
	g.closePath();
	g.fill();
	// the torso folds toward the door: its shadow shortens; at full fold it hangs past the hips
	const a = fold * 1.75; // radians from upright
	const torso = 0.62;
	const shY = 1.45 + torso * Math.cos(a); // shoulders' height
	g.fillRect(cx - 0.13 * px, Math.min(Y(1.45), Y(shY)), 0.26 * px, Math.abs(Y(1.45) - Y(shY)) + 1);
	g.fillRect(cx - 0.18 * px, Y(shY) - 0.04 * px, 0.36 * px, 0.08 * px);
	// arms, too long, hanging from the shoulders (to below the knees)
	for (const s of [-1, 1]) g.fillRect(cx + s * 0.2 * px - 0.025 * px, Y(shY), 0.05 * px, (0.95 - 0.3 * fold) * px);
	// the neck: up when standing, down below the shoulders as she folds and it stretches
	const neck = (0.15 + 0.55 * drop) * (Math.cos(a) >= 0 ? 1 : -1);
	const hy = shY + neck + 0.12 * Math.cos(a) + nod * 0.015;
	g.fillRect(cx - 0.035 * px, Math.min(Y(shY), Y(hy)), 0.07 * px, Math.abs(Y(shY) - Y(hy)));
	// the head with its hair and the wide hat, rolled by tilt
	g.save();
	g.translate(cx, Y(hy));
	g.rotate(tilt);
	g.beginPath();
	g.ellipse(0, 0, 0.1 * px, 0.13 * px, 0, 0, Math.PI * 2);
	g.fill();
	g.fillRect(-0.12 * px, 0, 0.24 * px, 0.32 * px); // long hair hanging
	const up = Math.cos(a) >= -0.2 ? -1 : 1; // the hat on top of the head, whichever way the head hangs
	g.beginPath();
	g.ellipse(0, up * 0.1 * px, 0.34 * px, 0.045 * px, 0, 0, Math.PI * 2);
	g.fill();
	g.fillRect(-0.13 * px, up > 0 ? 0.1 * px : -0.24 * px, 0.26 * px, 0.14 * px);
	g.restore();
	g.filter = 'none';
};

// ------------------------------------------------------------------ the road (dawn)
export const Road: React.FC<{z: number}> = ({z}) => {
	const M = useM();
	const poles = useMemo(() => Array.from({length: 14}, (_, i) => -i * 18), []);
	return (
		<group>
			<Box p={[0, -0.05, z - 60]} s={[5, 0.1, 200]} m={M.road} />
			<Box p={[-27.5, -0.08, z - 60]} s={[50, 0.1, 200]} m={M.field} />
			<Box p={[27.5, -0.08, z - 60]} s={[50, 0.1, 200]} m={M.field} />
			{poles.map((pz) => (
				<group key={pz} position={[4.2, 0, Math.round(z / 18) * 18 + pz + 20]}>
					<Box p={[0, 3.5, 0]} s={[0.2, 7, 0.2]} m={M.pole} />
					<Box p={[0, 6.6, 0]} s={[1.3, 0.1, 0.1]} m={M.pole} />
				</group>
			))}
			<mesh position={[-30, 0, z - 90]} material={M.hill}>
				<coneGeometry args={[30, 22, 6]} />
			</mesh>
			<mesh position={[30, 0, z - 110]} material={M.hill}>
				<coneGeometry args={[34, 26, 6]} />
			</mesh>
		</group>
	);
};
export const Car: React.FC<{z: number; bump: number}> = ({z, bump}) => (
	<group position={[0.6, 0.02 * bump, z]}>
		<PsxProp path="assets/models/psx/props/car4/Car4.obj" tex="assets/models/psx/props/car4/car4.png" s={0.55} rotation={[0, Math.PI, 0]} />
	</group>
);

// ------------------------------------------------------------------ her
export const HER_H = 2.75;
// Monster_03's own face (hollow black eyes, a slack open mouth) with the pale cast kept light so the face stays white
const HER_PALE = {color: '#f2f0ea', emissive: '#2c2c28'};
export type HerPose = {fold: number; drop?: number; headYaw?: number; headRoll?: number; stride?: number; armsOut?: number};
/** where her head and hips are, read each time she is drawn (the hat and the skirt follow) */
const BONES = {head: new THREE.Vector3(), top: new THREE.Vector3(), hips: new THREE.Vector3(), ready: false};
export const Her: React.FC<{p: V3; ry: number; pose: HerPose; t: number; reach?: {arm: 'Left' | 'Right'; target: V3}}> = ({p, ry, pose, t, reach}) => {
	const {fold, drop = 0, headYaw = 0, headRoll = 0, stride = 0, armsOut = 0} = pose;
	const sw = Math.sin(stride);
	// the fold: the spine bends forward at the waist; the neck and head bring the face back level
	const bend = fold * 1.55;
	const P: Pose = merge(ARMS_DOWN, {
		LeftUpLeg: [['aim', [0.05, -1, 0.42 * sw]]],
		RightUpLeg: [['aim', [-0.05, -1, -0.42 * sw]]],
		LeftLeg: [['aim', [0, -1, 0.15 * sw - 0.1 * Math.max(0, -sw)]]],
		RightLeg: [['aim', [0, -1, -0.15 * sw - 0.1 * Math.max(0, sw)]]],
		LeftArm: [['aim', [0.15 + 0.4 * armsOut, -1, 0.1 + 0.5 * fold]]],
		RightArm: [['aim', [-0.15 - 0.4 * armsOut, -1, 0.1 + 0.5 * fold]]],
		LeftForeArm: [['aim', [0.05, -1, 0.2 * fold]]],
		RightForeArm: [['aim', [-0.05, -1, 0.2 * fold]]],
		Spine: [['x', bend * 0.34]],
		Spine1: [['x', bend * 0.36]],
		Spine2: [['x', bend * 0.32]],
		// the neck carries the bend on (and stretches); only the head levels out to look ahead
		Neck: [['stretch', 1 + 2.2 * drop], ['x', 0.9 * drop], ['y', headYaw * 0.4]],
		Head: [['stretch', 1 / (1 + 2.2 * drop)], ['x', -bend * 0.95 - 0.9 * drop], ['y', headYaw * 0.6], ['z', headRoll]],
	});
	return (
		<>
			<PsxCharacter
				name="Character_Monster_03"
				height={HER_H}
				tint={HER_PALE}
				position={p}
				rotation={[0, ry, 0]}
				pose={P}
				reach={reach}
				probe={(w) => {
					BONES.head.copy(w('Head'));
					BONES.top.copy(w('HeadTop_End'));
					BONES.hips.copy(w('Hips'));
					BONES.ready = true;
					if ((globalThis as any).EP51_PROBE) console.log('PROBE', JSON.stringify({p, fold, head: w('Head').toArray().map((v) => +v.toFixed(3)), top: w('HeadTop_End').toArray().map((v) => +v.toFixed(3)), hips: w('Hips').toArray().map((v) => +v.toFixed(3)), sh: w('Spine2').toArray().map((v) => +v.toFixed(3))}));
				}}
			/>
			<HerDress p={p} ry={ry} />
			<HerHat />
		</>
	);
};
/** the white dress: a flared skirt from her hips to the ground (it follows her hips every frame) */
const HerDress: React.FC<{p: V3; ry: number}> = ({p, ry}) => {
	const M = useM();
	const ref = React.useRef<THREE.Mesh>(null);
	const place = () => {
		const m = ref.current;
		if (!m || !BONES.ready) return;
		const top = BONES.hips.y + 0.05;
		const hgt = Math.max(0.3, top - p[1] - 0.02);
		m.position.set(BONES.hips.x, p[1] + 0.02 + hgt / 2, BONES.hips.z);
		m.scale.set(1, hgt, 1);
		m.rotation.set(0, ry, 0);
		m.visible = true;
	};
	useFrame(place, -1);
	React.useLayoutEffect(place);
	return (
		<mesh ref={ref} visible={false} material={M.white}>
			<cylinderGeometry args={[0.17, 0.42, 1, 10, 3, true]} />
		</mesh>
	);
};
/** the wide hat on her head, tipped with it (it follows her head every frame) */
const HerHat: React.FC = () => {
	const M = useM();
	const ref = React.useRef<THREE.Group>(null);
	const place = () => {
		const g = ref.current;
		if (!g || !BONES.ready) return;
		const up = BONES.top.clone().sub(BONES.head).normalize();
		g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
		g.position.copy(BONES.head.clone().add(up.multiplyScalar(0.27)));
		g.visible = true;
	};
	useFrame(place, -1);
	React.useLayoutEffect(place);
	return (
		<group ref={ref} visible={false}>
			<mesh material={M.hat}>
				<cylinderGeometry args={[0.36, 0.36, 0.025, 14]} />
			</mesh>
			<mesh position={[0, 0.08, 0]} material={M.hat}>
				<cylinderGeometry args={[0.12, 0.14, 0.15, 10]} />
			</mesh>
			<mesh position={[0, 0.03, 0]} material={M.hatband}>
				<cylinderGeometry args={[0.145, 0.145, 0.045, 10]} />
			</mesh>
		</group>
	);
};
export const herHead = () => BONES.head.clone();
