// Episode 53 world: "Two Nights in the Cold Room" (Season 6; two nights in a Nigerian hospital mortuary with my
// brother, the night attendant, retold in our own words; no real hospital).
// - THE COLD ROOM: a long tiled room (x −2.7..2.7, z 1.6..−14.6, 3 m high), two rows of seven steel trays
//   (x ±1.3, z −0.8 … −12.8, head ends toward the back), three ceiling tubes over the aisle, the steel double
//   door in the back wall, a high window in the left wall (black at night, grey at dawn), the attendant's desk
//   with the register at the front left and my chair against the left wall.
// - THE DEAD: covered bodies (box-built under a sheet), each head a separate bump that can turn under the
//   sheet (the nose ridge points where the head looks); one can sit up under its sheet.
// - THE ONE THAT SITS UP: the user's PSX Character_Monster_01 (flayed, a split face, a seam down the chest),
//   sitting on the tray by the door with its Y-incision pulled open (a decal drawn every frame).
import React, {createContext, useContext, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {ps1} from '../ps1';
import {SNAP6} from '../ep01/world';
import {ARMS_DOWN, merge, Pose, PsxCharacter} from '../psx/models';
import {Box, tex} from '../ep41/world';

export type V3 = [number, number, number];
const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 64, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 64, SNAP6);

// ------------------------------------------------------------------ the room's measures
export const ROOM = {x0: -2.7, x1: 2.7, zf: 1.6, zb: -14.6, h: 3.0};
export const TRAY_TOP = 0.9;
export const ROWS = [-1.3, 1.3];
export const TRAY_Z = [-0.8, -2.8, -4.8, -6.8, -8.8, -10.8, -12.8];
/** the trays: [x, z centre] in order (left row front to back, then right row) */
export const TRAYS: [number, number][] = ROWS.flatMap((x) => TRAY_Z.map((z) => [x, z] as [number, number]));
export const SLIP = 8; // right row, second tray: the sheet slips, an arm hangs
export const DOOR_TRAY = 6; // left row, last tray, by the door: the one that sits up
export const HOOK_TRAY = 10; // right row, fourth tray: the one sitting up under its sheet in the hook
export const DESK: V3 = [-1.95, 0, 0.75];
export const MY_CHAIR: V3 = [-2.25, 0, -0.35];
export const FLOOR15: V3 = [0.1, 0, -2.6]; // the fifteenth, on the floor in the aisle

const useMatsInner = () =>
	useMemo(() => {
		const tile = (a: string, b: string, n: number) =>
			tex(16, 16, (g) => {
				g.fillStyle = a;
				g.fillRect(0, 0, 16, 16);
				g.fillStyle = b;
				for (let i = 0; i < 16; i += 8) {
					g.fillRect(i, 0, 1, 16);
					g.fillRect(0, i, 16, 1);
				}
				for (let i = 0; i < 18; i++) {
					g.fillStyle = i % 3 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)';
					g.fillRect((i * 7) % 16, (i * 5) % 16, 2, 1);
				}
			}, [n, n]);
		const sheet = tex(16, 32, (g) => {
			g.fillStyle = '#d8d8cf';
			g.fillRect(0, 0, 16, 32);
			// folds and old stains
			for (let y = 0; y < 32; y += 5) {
				g.fillStyle = 'rgba(0,0,0,0.12)';
				g.fillRect(0, y + ((y * 3) % 4), 16, 1);
			}
			g.fillStyle = 'rgba(120,100,60,0.18)';
			g.fillRect(4, 18, 5, 3);
			g.fillRect(10, 7, 3, 2);
		});
		const steel = tex(16, 16, (g) => {
			g.fillStyle = '#8a9096';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 30; i++) {
				g.fillStyle = i % 2 ? '#7a8086' : '#9aa0a6';
				g.fillRect((i * 5) % 16, (i * 3) % 16, 3, 1);
			}
		}, [1, 2]);
		const page = (() => {
			const c = document.createElement('canvas');
			c.width = 96;
			c.height = 128;
			const g = c.getContext('2d')!;
			g.fillStyle = '#d8d0b8';
			g.fillRect(0, 0, 96, 128);
			g.strokeStyle = '#8a9ab0';
			for (let y = 18; y < 128; y += 7) {
				g.beginPath();
				g.moveTo(0, y + 0.5);
				g.lineTo(96, y + 0.5);
				g.stroke();
			}
			g.strokeStyle = '#b06060';
			g.beginPath();
			g.moveTo(12.5, 0);
			g.lineTo(12.5, 128);
			g.moveTo(72.5, 0);
			g.lineTo(72.5, 128);
			g.stroke();
			g.fillStyle = '#20263a';
			g.font = 'bold 7px "DejaVu Sans", sans-serif';
			g.fillText('No.', 2, 13);
			g.fillText('IN', 76, 13);
			// fourteen rows: a number, a scribbled entry (no names) and a time
			g.font = '6px "DejaVu Sans", sans-serif';
			for (let i = 0; i < 14; i++) {
				const y = 23 + i * 7;
				g.fillText(String(i + 1), 2, y);
				g.strokeStyle = '#2a3048';
				g.beginPath();
				let x = 15;
				g.moveTo(x, y - 2);
				for (let k = 0; k < 9 + (i * 5) % 6; k++) {
					x += 3 + ((i + k) % 3);
					g.lineTo(x, y - 2 - ((k + i) % 2) * 2);
				}
				g.stroke();
				g.fillText(`${(7 + i) % 24}:${String((i * 17) % 60).padStart(2, '0')}`, 75, y);
			}
			g.font = 'bold 7px "DejaVu Sans", sans-serif';
			g.fillText('TOTAL  14', 30, 124);
			const t = new THREE.CanvasTexture(c);
			t.magFilter = t.minFilter = THREE.NearestFilter;
			return t;
		})();
		return {
			floor: lam('#ffffff', {map: tile('#6e7672', '#4e5652', 18)}),
			wallTile: lam('#ffffff', {map: tile('#b8c4bc', '#8e9a92', 8)}),
			paint: lam('#7e9488'),
			ceiling: lam('#5e6662'),
			steel: lam('#ffffff', {map: steel}),
			steelDark: lam('#4a5056'),
			sheet: lam('#ffffff', {map: sheet}),
			sheetBack: lam('#c8c8bf'),
			tube: bas('#e8fbff'),
			tubeOff: lam('#7a8486'),
			door: lam('#7a8288'),
			doorWin: bas('#0a0e10'),
			wood: lam('#5a3e28'),
			book: lam('#2a3a5a'),
			page: bas('#ffffff', {map: page}),
			pen: lam('#1a1a20'),
			lamp: lam('#20302a'),
			chair: lam('#3a4a5a'),
			winNight: bas('#06080a'),
			winDawn: bas('#c8d0d4'),
			skin: lam('#9a9890'),
			hollow: bas('#2a2c2a'),
			black: bas('#020202'),
			blood: bas('#5a0608'),
			gut: lam('#6a1418'),
			torch: bas('#fff4d8'),
		};
	}, []);
type Mats = ReturnType<typeof useMatsInner>;
const Ctx = createContext<Mats | null>(null);
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMatsInner()}>{children}</Ctx.Provider>;
export const useM = () => useContext(Ctx)!;

// ------------------------------------------------------------------ the room
export const Room: React.FC<{dawn: number; tubes: number}> = ({dawn, tubes}) => {
	const M = useM();
	const {x0, x1, zf, zb, h} = ROOM;
	const L = zf - zb, zc = (zf + zb) / 2;
	return (
		<group>
			<Box p={[0, -0.05, zc]} s={[x1 - x0, 0.1, L]} m={M.floor} />
			<Box p={[0, h + 0.05, zc]} s={[x1 - x0, 0.1, L]} m={M.ceiling} />
			{/* side walls: tiles to 1.8 m, paint above */}
			{[x0, x1].map((x, i) => (
				<group key={i}>
					<Box p={[x + (i ? 0.05 : -0.05), 0.9, zc]} s={[0.1, 1.8, L]} m={M.wallTile} />
					<Box p={[x + (i ? 0.05 : -0.05), 2.4, zc]} s={[0.1, 1.2, L]} m={M.paint} />
				</group>
			))}
			{/* the high window in the left wall */}
			<mesh position={[x0 + 0.01, 2.35, -6.0]} rotation={[0, Math.PI / 2, 0]} material={dawn > 0.5 ? M.winDawn : M.winNight}>
				<planeGeometry args={[1.6, 0.6]} />
			</mesh>
			{/* back wall with the steel double door */}
			<Box p={[-1.75, h / 2, zb - 0.05]} s={[1.9, h, 0.1]} m={M.wallTile} />
			<Box p={[1.75, h / 2, zb - 0.05]} s={[1.9, h, 0.1]} m={M.wallTile} />
			<Box p={[0, 2.6, zb - 0.05]} s={[1.6, 0.8, 0.1]} m={M.paint} />
			<Box p={[-0.4, 1.1, zb - 0.02]} s={[0.78, 2.2, 0.06]} m={M.door} />
			<Box p={[0.4, 1.1, zb - 0.02]} s={[0.78, 2.2, 0.06]} m={M.door} />
			<Box p={[-0.4, 1.55, zb + 0.02]} s={[0.24, 0.32, 0.02]} m={M.doorWin} />
			<Box p={[0.4, 1.55, zb + 0.02]} s={[0.24, 0.32, 0.02]} m={M.doorWin} />
			{/* front wall behind the camera */}
			<Box p={[0, h / 2, zf + 0.05]} s={[x1 - x0, h, 0.1]} m={M.wallTile} />
			{/* the tubes over the aisle */}
			{[-2.2, -6.6, -11].map((z) => (
				<group key={z}>
					<Box p={[0, h - 0.06, z]} s={[0.16, 0.06, 1.3]} m={M.steelDark} />
					<mesh position={[0, h - 0.11, z]} material={tubes > 0.05 ? M.tube : M.tubeOff}>
						<boxGeometry args={[0.07, 0.05, 1.2]} />
					</mesh>
				</group>
			))}
			{/* a drain in the aisle */}
			<Box p={[0, 0.002, -6.0]} s={[0.25, 0.01, 0.25]} m={M.steelDark} />
		</group>
	);
};

export const Tray: React.FC<{x: number; z: number}> = ({x, z}) => {
	const M = useM();
	return (
		<group position={[x, 0, z]}>
			<Box p={[0, TRAY_TOP - 0.03, 0]} s={[0.74, 0.05, 2.0]} m={M.steel} />
			<Box p={[0, TRAY_TOP - 0.01, 1.0]} s={[0.74, 0.07, 0.03]} m={M.steel} />
			<Box p={[0, TRAY_TOP - 0.01, -1.0]} s={[0.74, 0.07, 0.03]} m={M.steel} />
			{[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Box key={`${sx}${sz}`} p={[0.32 * sx, TRAY_TOP / 2 - 0.03, 0.9 * sz]} s={[0.04, TRAY_TOP - 0.06, 0.04]} m={M.steelDark} />))}
			<Box p={[0, 0.2, 0]} s={[0.66, 0.03, 1.84]} m={M.steelDark} />
		</group>
	);
};

/** a body under a sheet on a tray. Head toward −z. look: the head's turn under the sheet, radians about the
 *  body's long axis (+ turns the face toward +x); sit: 0 lying … 1 sitting up (the upper half folds at the
 *  hips); slip: 0..1 the sheet slides down off the near (−x) side and an arm hangs. */
export const Covered: React.FC<{x: number; z: number; look?: number; sit?: number; slip?: number; y?: number; small?: number}> = ({x, z, look = 0, sit = 0, slip = 0, y = TRAY_TOP, small = 1}) => {
	const M = useM();
	const hip = 0.05; // the hips sit a little behind the tray's centre
	const ang = (Math.PI / 2) * sit; // +x rotation folds the upper half up, its face to +z
	return (
		<group position={[x, y, z]} scale={[small, small, small]}>
			{/* legs: from the hips to the feet, toward +z */}
			<group position={[0, 0, hip]}>
				<Box p={[0, 0.1, 0.42]} s={[0.46, 0.18, 0.84]} m={M.sheet} />
				{/* the feet tent the sheet */}
				<Box p={[-0.1, 0.2, 0.88]} s={[0.12, 0.16, 0.12]} m={M.sheet} />
				<Box p={[0.1, 0.2, 0.88]} s={[0.12, 0.16, 0.12]} m={M.sheet} />
				{/* the sheet hangs over the tray's sides and foot */}
				<Box p={[-0.37, -0.02, 0.45]} s={[0.95, 0.26, 0.012]} m={M.sheet} r={[0, Math.PI / 2, 0]} />
				<Box p={[0.37, -0.02, 0.45]} s={[0.95, 0.26, 0.012]} m={M.sheet} r={[0, Math.PI / 2, 0]} />
				<Box p={[0, -0.02, 0.96]} s={[0.74, 0.26, 0.012]} m={M.sheet} />
			</group>
			{/* the upper body folds up about the hips */}
			{/* sitting all the way up, the sheet hangs from the head like a shroud */}
			{sit > 0.95 && (
				<mesh position={[0, 0.5, hip + 0.02]} material={M.sheetBack}>
					<cylinderGeometry args={[0.12, 0.24, 0.92, 9, 2, true]} />
				</mesh>
			)}
			<group position={[0, 0.06, hip]} rotation={[ang, 0, 0]}>
				<group position={[0, 0, 0]} visible>
					{sit <= 0.95 && <Box p={[0, 0.06, -0.38]} s={[0.5, 0.22, 0.76]} m={M.sheet} />}
					{/* shoulders */}
					{sit <= 0.95 && <Box p={[0, 0.06, -0.72]} s={[0.56, 0.2, 0.12]} m={M.sheet} />}
					{/* the head under the sheet: it turns about the body's axis */}
					<group position={[0, 0.06, -0.92]} rotation={[0, 0, -look]}>
						<mesh position={[0, 0.02, 0]} scale={[1, 0.85, 1.15]} material={M.sheet}>
							<sphereGeometry args={[0.13, 7, 5]} />
						</mesh>
						{/* the nose ridge and the brow, so a turned face reads through cloth */}
						<Box p={[0, 0.14, 0.0]} s={[0.04, 0.06, 0.07]} m={M.sheet} />
						<Box p={[0, 0.12, -0.07]} s={[0.15, 0.04, 0.04]} m={M.sheet} />
						<Box p={[0, 0.115, 0.07]} s={[0.1, 0.03, 0.03]} m={M.sheet} />
						{(Math.abs(look) > 0.2 || sit > 0.5) && (
							<>
								{/* the cloth sunk into two eye sockets and a mouth hanging open */}
								<Box p={[-0.05, 0.122, -0.03]} s={[0.036, 0.014, 0.036]} m={M.hollow} />
								<Box p={[0.05, 0.122, -0.03]} s={[0.036, 0.014, 0.036]} m={M.hollow} />
								<Box p={[0, 0.112, 0.075]} s={[0.05, 0.014, 0.07]} m={M.hollow} />
							</>
						)}
					</group>
					{/* the sheet falls from the head end */}
					<Box p={[0, -0.04, -1.07]} s={[0.6, 0.26, 0.012]} m={M.sheet} />
					{slip < 0.5 && (
						<>
							<Box p={[-0.37, -0.03, -0.5]} s={[1.1, 0.26, 0.012]} m={M.sheet} r={[0, Math.PI / 2, 0]} />
							<Box p={[0.37, -0.03, -0.5]} s={[1.1, 0.26, 0.012]} m={M.sheet} r={[0, Math.PI / 2, 0]} />
						</>
					)}
				</group>
			</group>
			{slip > 0 && <SlipArm slip={slip} />}
		</group>
	);
};
/** the slipped corner: the sheet in a heap on the floor and a grey arm hanging over the tray's edge */
const SlipArm: React.FC<{slip: number}> = ({slip}) => {
	const M = useM();
	const k = Math.min(1, slip);
	return (
		<group>
			{/* the heap on the floor below the near edge */}
			<Box p={[-0.5, -TRAY_TOP + 0.05, -0.4]} s={[0.4, 0.1, 0.8]} m={M.sheet} />
			{/* a bare shoulder showing on the tray where the sheet came away */}
			<Box p={[-0.2, 0.07, -0.62]} s={[0.14, 0.12, 0.3]} m={M.skin} />
			{/* the arm hanging: upper arm and forearm down the tray's side, the hand open */}
			<group position={[-0.32, 0.06, -0.55]} rotation={[0, 0, -1.25 * k]}>
				<Box p={[0, -0.18, 0]} s={[0.075, 0.36, 0.08]} m={M.skin} />
				<group position={[0, -0.36, 0]} rotation={[0, 0, 0.25 * k]}>
					<Box p={[0, -0.15, 0]} s={[0.065, 0.3, 0.07]} m={M.skin} />
					<Box p={[0, -0.36, 0.01]} s={[0.07, 0.13, 0.03]} m={M.skin} />
					{[-0.022, -0.007, 0.008, 0.023].map((dx, i) => (
						<Box key={i} p={[0, -0.47, dx]} s={[0.012, 0.09 - (i === 0 ? 0.02 : 0), 0.012]} m={M.skin} />
					))}
				</group>
			</group>
		</group>
	);
};

// ------------------------------------------------------------------ the one that sits up
const SB = {hips: new THREE.Vector3(), chest: new THREE.Vector3(), neck: new THREE.Vector3(), ok: false};
export const opened = SB;
const OPEN_H = 1.72;
/** Monster_01 on its tray: lean 0 upright … 1 lying back; the Y-incision drawn open on its chest; head tilt
 *  is a slow tell (never a snap). hands: where my brother's hands push its shoulders (just a jolt here). */
export const Opened: React.FC<{x: number; z: number; lean: number; tilt: number; t: number; ooze: number}> = ({x, z, lean, tilt, t, ooze}) => {
	const M = useM();
	const a = (Math.PI / 2) * lean * 0.92; // tilting back toward −z
	const hh = 0.52 * OPEN_H; // the hips' height above the feet, standing
	const breath = 0.015 * Math.sin(t * 1.3);
	const legs: [number, number, number] = [0, -Math.sin(a), Math.cos(a)];
	const P: Pose = merge(ARMS_DOWN, {
		LeftUpLeg: [['aim', [0.08 + legs[0], legs[1], legs[2]]]],
		RightUpLeg: [['aim', [-0.08 + legs[0], legs[1], legs[2]]]],
		LeftLeg: [['aim', legs]],
		RightLeg: [['aim', legs]],
		LeftFoot: [['aim', [0.05, 0.5, 1]]],
		RightFoot: [['aim', [-0.05, 0.5, 1]]],
		// arms hang slack at its sides, hands on the tray
		LeftArm: [['aim', [0.32, -1, 0.15]]],
		RightArm: [['aim', [-0.32, -1, 0.15]]],
		LeftForeArm: [['aim', [0.1, -1, 0.45]]],
		RightForeArm: [['aim', [-0.1, -1, 0.45]]],
		Spine: [['x', 0.12 + breath]],
		Spine1: [['x', 0.08]],
		Neck: [['x', 0.25], ['z', tilt * 0.5]],
		Head: [['x', 0.1], ['z', tilt * 0.6]],
	});
	return (
		<>
		<group position={[x, TRAY_TOP + 0.04, z - 0.25]}>
				{/* the sheet fallen to its lap */}
				<Box p={[0, 0.07, 0.55]} s={[0.52, 0.16, 1.05]} m={M.sheet} />
				<Box p={[-0.1, 0.18, 0.98]} s={[0.12, 0.14, 0.12]} m={M.sheet} />
				<Box p={[0.1, 0.18, 0.98]} s={[0.12, 0.14, 0.12]} m={M.sheet} />
				<Box p={[-0.37, -0.03, 0.42]} s={[0.8, 0.24, 0.012]} m={M.sheet} r={[0, Math.PI / 2, 0]} />
		</group>
		<group position={[x, TRAY_TOP + 0.04, z - 0.25]} rotation={[-a, 0, 0]}>
			<PsxCharacter
				name="Character_Monster_01"
				height={OPEN_H}
				tint={{color: '#c8c0b4', emissive: '#140e0c'}}
				position={[0, -hh, 0]}
				pose={P}
				probe={(w) => {
					SB.hips.copy(w('Hips'));
					SB.chest.copy(w('Spine2'));
					SB.neck.copy(w('Neck'));
					SB.ok = true;
					if ((globalThis as any).EP53_PROBE) console.log('PROBE', JSON.stringify({chest: w('Spine2').toArray().map((v) => +v.toFixed(2)), neck: w('Neck').toArray().map((v) => +v.toFixed(2)), head: w('Head').toArray().map((v) => +v.toFixed(2))}));
				}}
			/>
			<Incision ooze={ooze} t={t} />
		</group>
		</>
	);
};
/** the Y-incision, open: drawn every frame on a canvas (the stitches torn, the edges parted, dark inside,
 *  blood running down), laid on the chest from the Spine2 / Neck bones */
const Incision: React.FC<{ooze: number; t: number}> = ({ooze, t}) => {
	const ref = useRef<THREE.Mesh>(null);
	const {canvas, texture, mat} = useMemo(() => {
		const canvas = document.createElement('canvas');
		canvas.width = 48;
		canvas.height = 72;
		const texture = new THREE.CanvasTexture(canvas);
		texture.magFilter = texture.minFilter = THREE.NearestFilter;
		const mat = new THREE.MeshBasicMaterial({map: texture, transparent: true, alphaTest: 0.3, depthWrite: false});
		return {canvas, texture, mat};
	}, []);
	const g = canvas.getContext('2d')!;
	g.clearRect(0, 0, 48, 72);
	const open = 0.6 + 0.4 * ooze;
	const draw = (pts: [number, number][], w: number) => {
		// the gaping wound: a dark core inside a wet red lip
		g.lineCap = 'round';
		g.strokeStyle = '#7a0c10';
		g.lineWidth = w + 3;
		g.beginPath();
		pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
		g.stroke();
		g.strokeStyle = '#2a0204';
		g.lineWidth = w;
		g.beginPath();
		pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
		g.stroke();
	};
	// the Y: shoulders to the sternum, then straight down
	draw([[4, 6], [24, 24]], 2 + 3 * open);
	draw([[44, 6], [24, 24]], 2 + 3 * open);
	draw([[24, 24], [24, 66]], 3 + 5 * open);
	// torn stitches across the cut
	g.strokeStyle = '#1a1612';
	g.lineWidth = 1;
	for (let y = 28; y < 64; y += 5) {
		g.beginPath();
		g.moveTo(17 - 2 * open, y);
		g.lineTo(20 - open, y + 1);
		g.moveTo(28 + open, y + 1);
		g.lineTo(31 + 2 * open, y);
		g.stroke();
	}
	// blood running down from the cut
	g.fillStyle = '#8a0c10';
	for (let i = 0; i < 5; i++) {
		const x = 20 + i * 2.2;
		const len = 4 + ooze * (8 + ((i * 7) % 9)) + 1.5 * Math.sin(t * 0.7 + i);
		g.fillRect(Math.round(x), 66, 1, Math.max(1, Math.round(len)));
	}
	texture.needsUpdate = true;
	const place = () => {
		const m = ref.current;
		if (!m || !SB.ok) return;
		// the probe gives positions in the character's parent frame, which is this mesh's parent too
		const c = SB.chest.clone();
		const n = SB.neck.clone();
		const up = n.clone().sub(c).normalize();
		const fwd = new THREE.Vector3(0, 0, 1);
		fwd.addScaledVector(up, -fwd.dot(up)).normalize();
		const side = new THREE.Vector3().crossVectors(up, fwd);
		m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, up, fwd));
		m.position.copy(c).addScaledVector(fwd, 0.135).addScaledVector(up, -0.06);
		m.visible = true;
	};
	useFrame(place, -1);
	React.useLayoutEffect(place);
	return (
		<mesh ref={ref} visible={false} material={mat}>
			<planeGeometry args={[0.3, 0.45]} />
		</mesh>
	);
};

// ------------------------------------------------------------------ the living
/** walking / standing. p: feet; ry: heading; stride: phase (0 still); look: head yaw; head: neck bow */
export const Person: React.FC<{name: string; p: V3; ry: number; stride?: number; look?: number; bow?: number; pose?: Pose; h?: number}> = ({name, p, ry, stride = 0, look = 0, bow = 0, pose = {}, h = 1.74}) => {
	const sw = Math.sin(stride) * (stride ? 1 : 0);
	const P: Pose = merge(
		ARMS_DOWN,
		{
			LeftUpLeg: [['aim', [0.05, -1, 0.38 * sw]]],
			RightUpLeg: [['aim', [-0.05, -1, -0.38 * sw]]],
			LeftLeg: [['aim', [0, -1, 0.12 * sw - 0.12 * Math.max(0, -sw)]]],
			RightLeg: [['aim', [0, -1, -0.12 * sw - 0.12 * Math.max(0, sw)]]],
			LeftArm: [['aim', [0.2, -1, -0.25 * sw]]],
			RightArm: [['aim', [-0.2, -1, 0.25 * sw]]],
			Neck: [['x', bow], ['y', look * 0.5]],
			Head: [['y', look * 0.5]],
		},
		pose,
	);
	return <PsxCharacter name={name} height={h} position={p} rotation={[0, ry, 0]} pose={P} />;
};
