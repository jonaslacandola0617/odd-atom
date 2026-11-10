// Episode 7 world: "This Is the Voice of Vrillon" (true, 1977). One consistent low-poly set.
//
// Layout (metres, y up).
//   The living room of a terraced house: x[-2.5,2.5] z[-2,2], ceiling 2.4.
//   A through-lounge. The TV (wood-veneer cabinet on splayed legs) stands at the south
//   wall, screen centre TV_SCREEN, facing -z. The settee faces it at z = -1.2, the
//   father's armchair at x = -1.3, the child sits on the rug. The gas fire and mantel
//   (with the clock) are on the north wall. The front window (net curtains) is on the
//   east wall and faces the street; the back window on the west wall looks over the
//   gardens to the hill with the transmitter mast at MAST (about 480 m west), the same
//   mast that rises behind the rooftops in the street shot. A second hill far to the
//   north-west carries a faint red light (hidden detail; dramatisation).
//   The transmitter hut interior is a separate set at HUT_X.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1, rng} from '../ps1';
import {SNAP6} from '../ep01/world';
import {tex} from '../ep02/world';

const M = (color: string, opts: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...opts}), 20, SNAP6);
const B = (color: string, opts: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...opts}), 20, SNAP6);

const useMats = () =>
	useMemo(() => {
		// 1970s British wallpaper: brown and orange circles on cream-tan
		const wall = tex(16, 16, (g) => {
			g.fillStyle = '#8a6a44';
			g.fillRect(0, 0, 16, 16);
			for (const [cx, cy, c] of [[4, 4, '#b06a2a'], [12, 12, '#b06a2a'], [12, 4, '#5a3e24'], [4, 12, '#5a3e24']] as const) {
				g.fillStyle = c;
				g.beginPath();
				g.arc(cx, cy, 3, 0, Math.PI * 2);
				g.fill();
				g.fillStyle = '#8a6a44';
				g.beginPath();
				g.arc(cx, cy, 1.4, 0, Math.PI * 2);
				g.fill();
			}
		}, 71, [10, 4]);
		const carpet = tex(32, 32, (g, r) => {
			g.fillStyle = '#6a2e1e';
			g.fillRect(0, 0, 32, 32);
			for (let i = 0; i < 12; i++) {
				g.strokeStyle = r() > 0.5 ? '#8a4a24' : '#4a2016';
				g.beginPath();
				g.arc(r() * 32, r() * 32, 3 + r() * 6, 0, Math.PI * 1.4);
				g.stroke();
			}
		}, 72, [4, 3]);
		const veneer = tex(16, 16, (g, r) => {
			g.fillStyle = '#6a4224';
			g.fillRect(0, 0, 16, 16);
			for (let y = 0; y < 16; y++) {
				g.fillStyle = r() > 0.5 ? '#5a361c' : '#76492a';
				g.fillRect(0, y, 16, 1);
			}
		}, 73, [1, 1]);
		const grille = tex(8, 8, (g) => {
			g.fillStyle = '#3a2e22';
			g.fillRect(0, 0, 8, 8);
			g.fillStyle = '#2a2018';
			for (let y = 0; y < 8; y += 2) g.fillRect(0, y, 8, 1);
		}, 74, [3, 6]);
		const fabric = tex(16, 16, (g, r) => {
			g.fillStyle = '#a07a2a';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 40; i++) {
				g.fillStyle = r() > 0.5 ? '#8a6620' : '#b08a3a';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
			}
		}, 75, [2, 2]);
		const brick = tex(16, 16, (g, r) => {
			g.fillStyle = '#6a3a2a';
			g.fillRect(0, 0, 16, 16);
			for (let y = 0; y < 16; y += 4) {
				g.fillStyle = '#4a2a1e';
				g.fillRect(0, y + 3, 16, 1);
				for (let x = y % 8 ? 4 : 0; x < 16; x += 8) g.fillRect(x, y, 1, 3);
				if (r() > 0.5) {
					g.fillStyle = '#7a4632';
					g.fillRect(Math.floor(r() * 14), y, 3, 3);
				}
			}
		}, 76, [4, 3]);
		const slate = tex(16, 16, (g) => {
			g.fillStyle = '#2a2c32';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#1e2026';
			for (let y = 0; y < 16; y += 3) g.fillRect(0, y, 16, 1);
		}, 77, [4, 2]);
		const net = tex(16, 16, (g, r) => {
			g.clearRect(0, 0, 16, 16);
			for (let y = 0; y < 16; y++)
				for (let x = 0; x < 16; x++) {
					if ((x + y) % 2 === 0) {
						g.fillStyle = r() > 0.2 ? 'rgba(230,226,214,0.9)' : 'rgba(230,226,214,0.4)';
						g.fillRect(x, y, 1, 1);
					}
				}
		}, 78, [6, 6]);
		// a lattice mast face: an X-braced ladder, transparent between the members
		const lattice = tex(16, 32, (g) => {
			g.clearRect(0, 0, 16, 32);
			g.strokeStyle = '#6a6c78';
			g.lineWidth = 1.4;
			g.strokeRect(0.5, 0.5, 15, 31);
			for (let y = 0; y < 32; y += 8) {
				g.beginPath();
				g.moveTo(0, y);
				g.lineTo(16, y + 8);
				g.moveTo(16, y);
				g.lineTo(0, y + 8);
				g.moveTo(0, y);
				g.lineTo(16, y);
				g.stroke();
			}
		}, 79, [1, 18]);
		const grass = tex(16, 16, (g, r) => {
			g.fillStyle = '#26301e';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 50; i++) {
				g.fillStyle = r() > 0.5 ? '#2e3a24' : '#1e2618';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
			}
		}, 80, [40, 40]);
		const rack = tex(16, 32, (g, r) => {
			g.fillStyle = '#4a5048';
			g.fillRect(0, 0, 16, 32);
			for (let y = 1; y < 32; y += 4) {
				g.fillStyle = '#5a6258';
				g.fillRect(1, y, 14, 3);
				g.fillStyle = '#2a2e28';
				g.fillRect(2 + Math.floor(r() * 8), y + 1, 2, 1);
				if (r() > 0.5) {
					g.fillStyle = r() > 0.5 ? '#e0a040' : '#40c060';
					g.fillRect(12, y + 1, 1, 1);
				}
			}
		}, 81);
		const concrete = tex(16, 16, (g, r) => {
			g.fillStyle = '#6a6a62';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 40; i++) {
				g.fillStyle = r() > 0.5 ? '#72726a' : '#5e5e56';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
			}
		}, 82, [5, 3]);
		return {
			wall: M('#ffffff', {map: wall, side: THREE.DoubleSide}),
			carpet: M('#ffffff', {map: carpet}),
			ceiling: M('#8a8270', {side: THREE.DoubleSide}),
			skirting: M('#c8bca0'),
			veneer: M('#ffffff', {map: veneer}),
			grille: M('#ffffff', {map: grille}),
			tvDark: M('#121416'),
			knob: M('#b0a890'),
			chrome: M('#a8a8a8'),
			fabric: M('#ffffff', {map: fabric}),
			fabricDark: M('#6a4a1a'),
			armchair: M('#5a3a2a'),
			wood: M('#4a2e1a'),
			tile: M('#3a5a4a'),
			fire: B('#ff7a2a'),
			fireOff: M('#2a2420'),
			brass: M('#a08848'),
			curtain: M('#a0502a', {side: THREE.DoubleSide}),
			net: M('#ffffff', {map: net, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide}),
			lampShade: M('#d8c090'),
			lampGlow: B('#ffd890'),
			cup: M('#e0dcd0'),
			frame: M('#d8d0c0'),
			brick: M('#ffffff', {map: brick}),
			slate: M('#ffffff', {map: slate}),
			road: M('#202226'),
			pavement: M('#3a3a3c'),
			grass: M('#ffffff', {map: grass}),
			hill: M('#1e261a'),
			lattice: B('#ffffff', {map: lattice, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide}),
			beacon: B('#ff2a1a'),
			beaconOff: B('#3a0806'),
			rack: M('#ffffff', {map: rack}),
			concrete: M('#ffffff', {map: concrete, side: THREE.DoubleSide}),
			desk: M('#4a4a44'),
			paper: M('#d8d4c4'),
			lamppost: M('#2a2a2c'),
			sodium: B('#ffa040'),
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

/** A plane with a canvas texture; rotY = PI faces -z. */
export const Screen: React.FC<{p: [number, number, number]; w: number; h: number; map: THREE.Texture; rotY?: number}> = ({p, w, h, map, rotY = Math.PI}) => {
	const m = useMemo(() => ps1(new THREE.MeshBasicMaterial({map}), 20, SNAP6), [map]);
	return (
		<mesh position={p} rotation={[0, rotY, 0]} material={m}>
			<planeGeometry args={[w, h]} />
		</mesh>
	);
};

export const FATHER = {skin: '#b08468', hair: '#3a2a1e', top: '#5a5a3a', legs: '#2c2a26'};
export const MOTHER = {skin: '#c09878', hair: '#6a3a1e', top: '#3a5a6a', legs: '#4a3a2a', longHair: true};
export const CHILD = {skin: '#c8a080', hair: '#8a5a2a', top: '#8a2a22', legs: '#2a3a5a'};

// ------------------------------------------------------------------ the living room
export const TV_SCREEN: [number, number, number] = [-0.12, 0.92, 1.535];
export const TV_W = 0.46;
export const TV_H = 0.35;
export const CLOCK: [number, number, number] = [-1.5, 1.42, -1.765];
export const WINDOW_X = 2.5;

export const LivingRoom: React.FC<{screen: THREE.Texture; clock: THREE.Texture; fire: number; lamp: number; empty?: boolean}> = ({screen, clock, fire, lamp, empty}) => {
	const mm = useM();
	return (
		<group>
			<Box p={[0, -0.05, 0]} s={[5.0, 0.1, 4.0]} m={mm.carpet} />
			<Box p={[0, 2.45, 0]} s={[5.0, 0.1, 4.0]} m={mm.ceiling} />
			<Box p={[0, 1.2, 2.05]} s={[5.0, 2.4, 0.1]} m={mm.wall} />
			<Box p={[0, 1.2, -2.05]} s={[5.0, 2.4, 0.1]} m={mm.wall} />
			{/* west wall with the back window z[-0.6,0.6] y[0.9,2.0] */}
			<Box p={[-2.55, 1.2, -1.3]} s={[0.1, 2.4, 1.4]} m={mm.wall} />
			<Box p={[-2.55, 1.2, 1.3]} s={[0.1, 2.4, 1.4]} m={mm.wall} />
			<Box p={[-2.55, 0.45, 0]} s={[0.1, 0.9, 1.2]} m={mm.wall} />
			<Box p={[-2.55, 2.2, 0]} s={[0.1, 0.4, 1.2]} m={mm.wall} />
			<Box p={[-2.48, 0.9, 0]} s={[0.12, 0.04, 1.3]} m={mm.skirting} />
			<Box p={[-2.53, 1.45, 0]} s={[0.03, 1.1, 0.04]} m={mm.skirting} />
			<Box p={[-2.42, 1.4, -0.8]} s={[0.06, 1.3, 0.35]} m={mm.curtain} />
			<Box p={[-2.42, 1.4, 0.8]} s={[0.06, 1.3, 0.35]} m={mm.curtain} />
			<Box p={[-2.42, 2.08, 0]} s={[0.05, 0.05, 2.0]} m={mm.wood} />
			{/* east wall with the window z[-0.75,0.75] y[0.9,2.0] */}
			<Box p={[2.55, 1.2, -1.4]} s={[0.1, 2.4, 1.3]} m={mm.wall} />
			<Box p={[2.55, 1.2, 1.4]} s={[0.1, 2.4, 1.3]} m={mm.wall} />
			<Box p={[2.55, 0.45, 0]} s={[0.1, 0.9, 1.5]} m={mm.wall} />
			<Box p={[2.55, 2.2, 0]} s={[0.1, 0.4, 1.5]} m={mm.wall} />
			<Box p={[2.48, 0.9, 0]} s={[0.12, 0.04, 1.6]} m={mm.skirting} />
			<Box p={[2.53, 1.45, 0]} s={[0.03, 1.1, 0.04]} m={mm.skirting} />
			<Box p={[2.53, 1.62, 0]} s={[0.03, 0.03, 1.5]} m={mm.skirting} />
			{/* net curtain over the lower sash, heavy orange curtains drawn open */}
			<mesh position={[2.46, 1.3, 0]} rotation={[0, -Math.PI / 2, 0]} material={mm.net}>
				<planeGeometry args={[1.5, 0.8]} />
			</mesh>
			<Box p={[2.42, 1.4, -0.95]} s={[0.06, 1.3, 0.45]} m={mm.curtain} />
			<Box p={[2.42, 1.4, 0.95]} s={[0.06, 1.3, 0.45]} m={mm.curtain} />
			<Box p={[2.42, 2.08, 0]} s={[0.05, 0.05, 2.4]} m={mm.wood} />
			{/* skirting */}
			<Box p={[0, 0.06, 1.99]} s={[5.0, 0.12, 0.02]} m={mm.skirting} />
			<Box p={[0, 0.06, -1.99]} s={[5.0, 0.12, 0.02]} m={mm.skirting} />
			{/* the TV: wood-veneer cabinet on splayed legs, screen left, speaker and knobs right */}
			<group position={[0, 0, 1.75]}>
				<Box p={[0, 0.92, 0.05]} s={[0.82, 0.5, 0.5]} m={mm.veneer} />
				<Box p={[-0.12, 0.92, -0.2]} s={[0.52, 0.41, 0.02]} m={mm.tvDark} />
				<Box p={[0.27, 0.86, -0.21]} s={[0.18, 0.26, 0.01]} m={mm.grille} />
				{[0, 1, 2].map((i) => (
					<mesh key={i} position={[0.27, 1.07 - i * 0.0, -0.22]} rotation={[Math.PI / 2, 0, 0]} material={mm.knob}>
						<cylinderGeometry args={[0.022, 0.022, 0.02, 6]} />
					</mesh>
				))}
				<Box p={[0.21, 1.07, -0.22]} s={[0.03, 0.03, 0.02]} m={mm.knob} />
				<Box p={[0.33, 1.07, -0.22]} s={[0.03, 0.03, 0.02]} m={mm.knob} />
				{[[-0.34, -0.15], [0.34, -0.15], [-0.34, 0.22], [0.34, 0.22]].map(([x, z], i) => (
					<Box key={i} p={[x, 0.34, z]} s={[0.035, 0.7, 0.035]} m={mm.wood} r={[z < 0 ? 0.12 : -0.12, 0, x < 0 ? -0.1 : 0.1]} />
				))}
				{/* indoor aerial on top */}
				<Box p={[0, 1.18, 0.05]} s={[0.12, 0.03, 0.08]} m={mm.tvDark} />
				<Box p={[-0.1, 1.38, 0.05]} s={[0.01, 0.42, 0.01]} m={mm.chrome} r={[0, 0, 0.45]} />
				<Box p={[0.1, 1.38, 0.05]} s={[0.01, 0.42, 0.01]} m={mm.chrome} r={[0, 0, -0.45]} />
			</group>
			<Screen p={TV_SCREEN} w={TV_W} h={TV_H} map={screen} />
			{/* north wall: the tiled gas fire and the mantel with the clock */}
			<group position={[-1.5, 0, -1.95]} rotation={[0, -Math.PI / 2, 0]}>
				<Box p={[0.08, 0.55, 0]} s={[0.16, 1.1, 1.2]} m={mm.tile} />
				<Box p={[0.12, 1.14, 0]} s={[0.26, 0.06, 1.45]} m={mm.wood} />
				<Box p={[0.18, 0.35, 0]} s={[0.1, 0.4, 0.6]} m={mm.fireOff} />
				{[0, 1, 2, 3].map((i) => (
					<Box key={i} p={[0.235, 0.25 + i * 0.08, 0]} s={[0.01, 0.04, 0.5]} m={fire > 0.5 ? mm.fire : mm.fireOff} />
				))}
				<Box p={[0.12, 1.38, 0]} s={[0.12, 0.42, 0.34]} m={mm.wood} />
				<Box p={[0.14, 1.22, -0.5]} s={[0.06, 0.1, 0.06]} m={mm.brass} />
				<Box p={[0.14, 1.25, 0.48]} s={[0.05, 0.16, 0.05]} m={mm.cup} />
			</group>
			<Screen p={CLOCK} w={0.24} h={0.24} map={clock} rotY={0} />
			{/* a framed print above the settee */}
			<Box p={[0.8, 1.6, -1.98]} s={[0.7, 0.45, 0.03]} m={mm.frame} />
			{!empty && (
				<>
					{/* the settee facing the TV */}
					<group position={[0.7, 0, -1.2]}>
						<Box p={[0, 0.22, 0]} s={[1.7, 0.44, 0.8]} m={mm.fabric} />
						<Box p={[0, 0.7, -0.33]} s={[1.7, 0.6, 0.16]} m={mm.fabric} />
						<Box p={[-0.9, 0.38, 0]} s={[0.14, 0.36, 0.8]} m={mm.fabricDark} />
						<Box p={[0.9, 0.38, 0]} s={[0.14, 0.36, 0.8]} m={mm.fabricDark} />
					</group>
					{/* father's armchair, angled toward the TV */}
					<group position={[-1.3, 0, -0.3]} rotation={[0, -0.6, 0]}>
						<Box p={[0, 0.22, 0]} s={[0.8, 0.44, 0.8]} m={mm.armchair} />
						<Box p={[0, 0.72, -0.34]} s={[0.8, 0.66, 0.14]} m={mm.armchair} />
						<Box p={[-0.42, 0.38, 0]} s={[0.12, 0.34, 0.8]} m={mm.armchair} />
						<Box p={[0.42, 0.38, 0]} s={[0.12, 0.34, 0.8]} m={mm.armchair} />
					</group>
					{/* coffee table with tea cups */}
					<Box p={[0.65, 0.3, -0.3]} s={[0.9, 0.04, 0.45]} m={mm.wood} />
					{[[-0.38, -0.4], [0.38, -0.4], [-0.38, -0.1], [0.38, -0.1]].map(([x, z], i) => (
						<Box key={i} p={[0.65 + x, 0.15, z - 0.05]} s={[0.04, 0.3, 0.04]} m={mm.wood} />
					))}
					{[[0.45, -0.35], [0.85, -0.25]].map(([x, z], i) => (
						<mesh key={i} position={[x, 0.355, z]} material={mm.cup}>
							<cylinderGeometry args={[0.035, 0.03, 0.07, 6]} />
						</mesh>
					))}
				</>
			)}
			{empty && (
				// years later: dust sheets over the settee and the armchair
				<>
					<Box p={[0.7, 0.4, -1.2]} s={[1.8, 0.8, 0.9]} m={mm.paper} />
					<group position={[-1.3, 0, -0.3]} rotation={[0, -0.6, 0]}>
						<Box p={[0, 0.48, 0]} s={[0.85, 0.96, 0.85]} m={mm.paper} />
					</group>
				</>
			)}
			{/* the standard lamp in the corner */}
			<group position={[2.15, 0, -1.7]}>
				<Box p={[0, 0.03, 0]} s={[0.3, 0.06, 0.3]} m={mm.wood} />
				<Box p={[0, 0.75, 0]} s={[0.03, 1.4, 0.03]} m={mm.brass} />
				<mesh position={[0, 1.5, 0]} material={lamp > 0.5 ? mm.lampGlow : mm.lampShade}>
					<cylinderGeometry args={[0.16, 0.24, 0.28, 6, 1, true]} />
				</mesh>
			</group>
			{/* the door to the hall, north wall */}
			<Box p={[-2.0, 1.0, 1.99]} s={[0.7, 2.0, 0.02]} m={mm.wood} />
		</group>
	);
};

// ------------------------------------------------------------------ outside: the terrace, the street, the hill and the mast
export const MAST: [number, number, number] = [-300, 0, 30];
export const HILL_H = 46;
export const MAST_H = 150;
export const FAR_LIGHT: [number, number, number] = [-560, 70, -420];

const TOWN: [number, number, number][] = (() => {
	const r = rng(708);
	const out: [number, number, number][] = [];
	for (const x of [34, 48, 62])
		for (let k = -6; k <= 6; k++) out.push([x, k * 5.0 + (x % 3), 0.3 + r() * 0.7]);
	return out;
})();

const House: React.FC<{z: number; lit: number; mine?: boolean}> = ({z, lit, mine}) => {
	const mm = useM();
	const glow = useMemo(() => B('#2a3a6a'), []);
	glow.color.setRGB(0.1 + lit * 0.16, 0.14 + lit * 0.22, 0.28 + lit * 0.36);
	return (
		<group position={[0, 0, z]}>
			{/* facade at x = 2.62 with the bay of the front-room window; upstairs window above */}
			{!mine && <Box p={[0, 2.6, 0]} s={[5.2, 5.2, 4.9]} m={mm.brick} />}
			{mine && (
				<>
					<Box p={[2.64, 0.45, 0]} s={[0.08, 0.9, 1.6]} m={mm.brick} />
					<Box p={[2.64, 1.2, -1.6]} s={[0.08, 2.4, 1.7]} m={mm.brick} />
					<Box p={[2.64, 1.2, 1.6]} s={[0.08, 2.4, 1.7]} m={mm.brick} />
					<Box p={[2.64, 3.8, 0]} s={[0.08, 2.8, 4.9]} m={mm.brick} />
					<Box p={[2.64, 2.2, 0]} s={[0.08, 0.4, 1.6]} m={mm.brick} />
				</>
			)}
			{!mine && (
				<mesh position={[2.61, 1.45, 0]} rotation={[0, Math.PI / 2, 0]} material={glow}>
					<planeGeometry args={[1.5, 1.1]} />
				</mesh>
			)}
			{/* a lit kitchen window at the back */}
			<mesh position={[-2.66, 1.5, 1.2]} rotation={[0, -Math.PI / 2, 0]} material={mm.sodium}>
				<planeGeometry args={[0.8, 0.7]} />
			</mesh>
			<mesh position={[2.66, 3.6, 0.6]} rotation={[0, Math.PI / 2, 0]} material={mm.black}>
				<planeGeometry args={[0.9, 0.9]} />
			</mesh>
			{/* front door */}
			<mesh position={[2.66, 1.0, -1.8]} rotation={[0, Math.PI / 2, 0]} material={mm.wood}>
				<planeGeometry args={[0.8, 2.0]} />
			</mesh>
			{/* pitched slate roof and a chimney */}
			<Box p={[1.4, 5.9, 0]} s={[3.2, 0.12, 4.95]} m={mm.slate} r={[0, 0, -0.55]} />
			<Box p={[-1.4, 5.9, 0]} s={[3.2, 0.12, 4.95]} m={mm.slate} r={[0, 0, 0.55]} />
			<Box p={[0, 6.6, 2.3]} s={[0.6, 1.1, 0.5]} m={mm.brick} />
		</group>
	);
};

export const Outside: React.FC<{beacon: number; farLight: number; tvLit: number}> = ({beacon, farLight, tvLit}) => {
	const mm = useM();
	const lits = useMemo(() => {
		const r = rng(707);
		return new Array(11).fill(0).map(() => 0.5 + r() * 0.5);
	}, []);
	const bOn = beacon > 0.5 ? mm.beacon : mm.beaconOff;
	return (
		<group>
			{/* the terrace row along z; ours is at z = 0 */}
			{lits.map((l, i) => {
				const k = i - 5;
				return <House key={i} z={k * 5.0} lit={l * tvLit} mine={k === 0} />;
			})}
			{/* our roof and upstairs: the box around the living room */}
			<Box p={[0, 3.8, 0]} s={[5.2, 2.8, 4.9]} m={mm.brick} />
			<Box p={[-2.64, 1.2, -1.55]} s={[0.08, 2.4, 1.8]} m={mm.brick} />
			<Box p={[-2.64, 1.2, 1.55]} s={[0.08, 2.4, 1.8]} m={mm.brick} />
			<Box p={[-2.64, 0.45, 0]} s={[0.08, 0.9, 1.3]} m={mm.brick} />
			<Box p={[-2.64, 2.2, 0]} s={[0.08, 0.4, 1.3]} m={mm.brick} />
			{/* back gardens and their wall */}
			<Box p={[-9, 0.9, 0]} s={[0.25, 1.8, 60]} m={mm.brick} />
			<Box p={[-6, -0.04, 0]} s={[7, 0.06, 60]} m={mm.grass} />
			<Box p={[0, 1.2, 2.47]} s={[5.2, 2.4, 0.06]} m={mm.brick} />
			<Box p={[0, 1.2, -2.47]} s={[5.2, 2.4, 0.06]} m={mm.brick} />
			{/* low front walls, pavement, road, street lamps */}
			<Box p={[4.0, 0.3, 0]} s={[0.2, 0.6, 60]} m={mm.brick} />
			<Box p={[4.8, 0.02, 0]} s={[1.6, 0.06, 60]} m={mm.pavement} />
			<Box p={[7.5, -0.02, 0]} s={[4, 0.04, 60]} m={mm.road} />
			{[-18, -6, 6, 18].map((z) => (
				<group key={z} position={[5.4, 0, z]}>
					<Box p={[0, 2.2, 0]} s={[0.1, 4.4, 0.1]} m={mm.lamppost} />
					<Box p={[-0.3, 4.4, 0]} s={[0.6, 0.08, 0.12]} m={mm.lamppost} />
					<Box p={[-0.55, 4.32, 0]} s={[0.2, 0.08, 0.14]} m={mm.sodium} />
				</group>
			))}
			{/* the rest of the town: more terraces, their front windows lit by televisions */}
			{TOWN.map(([x, z, l], i) => (
				<group key={i} position={[x, 0, z]}>
					<Box p={[0, 2.6, 0]} s={[5.2, 5.2, 4.9]} m={mm.brick} />
					<Box p={[0, 5.6, 0]} s={[4.6, 0.8, 4.95]} m={mm.slate} />
					<mesh position={[-2.62, 1.5, 1.2]} rotation={[0, -Math.PI / 2, 0]} material={mm.sodium}>
						<planeGeometry args={[0.8, 0.7]} />
					</mesh>
					<mesh position={[2.61, 1.45, 0]} rotation={[0, Math.PI / 2, 0]}>
						<planeGeometry args={[1.5, 1.1]} />
						<meshBasicMaterial color={new THREE.Color(0.1 + l * tvLit * 0.25, 0.14 + l * tvLit * 0.3, 0.3 + l * tvLit * 0.5)} />
					</mesh>
				</group>
			))}
			{/* fields to the west, rising to the hill with the mast */}
			<Box p={[-300, -0.1, 0]} s={[1400, 0.1, 1400]} m={mm.grass} />
			<mesh position={[MAST[0], 0, MAST[2]]} material={mm.hill} scale={[1, HILL_H / 220, 1]}>
				<sphereGeometry args={[220, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
			</mesh>
			<mesh position={[FAR_LIGHT[0], 0, FAR_LIGHT[2]]} material={mm.hill} scale={[1, FAR_LIGHT[1] / 260, 1]}>
				<sphereGeometry args={[260, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
			</mesh>
			{/* hedgerows */}
			{[-60, 20, 90].map((z, i) => (
				<Box key={i} p={[-120 - i * 40, 1, z]} s={[180, 2.2, 2]} m={mm.hill} />
			))}
			{/* the transmitter mast: a tapering three-sided lattice with red lights */}
			<group position={[MAST[0], HILL_H, MAST[2]]}>
				{[0, 1, 2].map((i) => (
					<mesh key={i} position={[Math.cos((i * 2 * Math.PI) / 3) * 1.1, MAST_H / 2, Math.sin((i * 2 * Math.PI) / 3) * 1.1]} rotation={[0, -(i * 2 * Math.PI) / 3 + Math.PI / 2, 0]} material={mm.lattice}>
						<planeGeometry args={[3.2, MAST_H]} />
					</mesh>
				))}
				{/* a solid core so the mast reads as a silhouette from far away */}
				<Box p={[0, MAST_H / 2, 0]} s={[1.0, MAST_H, 1.0]} m={mm.lamppost} />
				{[MAST_H + 1, MAST_H * 0.66, MAST_H * 0.33].map((y, i) => (
					<group key={i}>
						<Box p={[0, y, 0]} s={[3.2, 3.2, 3.2]} m={bOn} />
						{beacon > 0.5 && (
							<mesh position={[0, y, 0]}>
								<sphereGeometry args={[i ? 6 : 9, 8, 6]} />
								<meshBasicMaterial color="#ff3a2a" transparent opacity={0.22} depthWrite={false} fog={false} />
							</mesh>
						)}
					</group>
				))}
				{/* the transmitter building at the foot of the mast, one lit window */}
				<Box p={[14, 2.2, 12]} s={[8, 5, 14]} m={mm.concrete} />
				<mesh position={[18.05, 2.6, 12]} rotation={[0, Math.PI / 2, 0]} material={mm.sodium}>
					<planeGeometry args={[2.2, 1.2]} />
				</mesh>
				<Box p={[14, 4.9, 12]} s={[8.6, 0.4, 14.6]} m={mm.slate} />
			</group>
			{/* hidden: a faint red light on the far hill where no mast stands */}
			{farLight > 0.5 && (
				<mesh position={FAR_LIGHT}>
					<boxGeometry args={[2.2, 2.2, 2.2]} />
					<meshBasicMaterial color="#c82418" fog={false} />
				</mesh>
			)}
		</group>
	);
};

// ------------------------------------------------------------------ inside the transmitter building (a separate set)
export const HUT_X = -150;
export const Hut: React.FC<{meters: THREE.Texture; tube: number}> = ({meters, tube}) => {
	const mm = useM();
	return (
		<group position={[HUT_X, 0, 0]}>
			<Box p={[0, -0.05, 0]} s={[6, 0.1, 5]} m={mm.concrete} />
			<Box p={[0, 2.85, 0]} s={[6, 0.1, 5]} m={mm.concrete} />
			<Box p={[0, 1.4, 2.5]} s={[6, 2.8, 0.1]} m={mm.concrete} />
			<Box p={[0, 1.4, -2.5]} s={[6, 2.8, 0.1]} m={mm.concrete} />
			<Box p={[-3, 1.4, 0]} s={[0.1, 2.8, 5]} m={mm.concrete} />
			<Box p={[3, 1.4, 0]} s={[0.1, 2.8, 5]} m={mm.concrete} />
			{/* the receiver and transmitter cabinets along the south wall */}
			{[-2.2, -1.4, -0.6, 1.0, 1.8].map((x) => (
				<Box key={x} p={[x, 1.05, 2.1]} s={[0.75, 2.1, 0.7]} m={mm.rack} />
			))}
			{/* the monitoring panel: VISION and SOUND meters */}
			<Box p={[0.2, 1.4, 2.18]} s={[0.5, 0.8, 0.55]} m={mm.desk} />
			<Screen p={[0.2, 1.42, 1.895]} w={0.38} h={0.64} map={meters} />
			<Box p={[0.2, 0.5, 2.0]} s={[0.8, 1.0, 0.8]} m={mm.desk} />
			{/* the log book on a desk, nobody on duty */}
			<Box p={[-0.6, 0.72, 0.6]} s={[1.2, 0.05, 0.6]} m={mm.desk} />
			<mesh position={[-0.55, 0.75, 0.6]} rotation={[-Math.PI / 2, 0, 0.15]} material={mm.paper}>
				<planeGeometry args={[0.36, 0.26]} />
			</mesh>
			<mesh position={[0, 2.78, 0.5]}>
				<boxGeometry args={[1.4, 0.05, 0.12]} />
				<meshBasicMaterial color={new THREE.Color(0.25 + tube * 0.6, 0.3 + tube * 0.6, 0.32 + tube * 0.55)} />
			</mesh>
		</group>
	);
};
