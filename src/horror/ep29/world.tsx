// Episode 29 world: "Checkout Is at Ten" (Season 3, a real place with reported hauntings: Monte Cristo
// Homestead, Junee, New South Wales). Composites, not a survey of the house (private property):
// - THE BEDROOM (origin): a Victorian guest bedroom: floral paper, an iron bed (you are sitting on it),
//   a dressing table with an oval mirror, a cedar wardrobe whose door can swing, French doors onto the
//   upstairs veranda (lace curtain, glass), the iron-lace railing outside, rain that stops in the air;
//   the door to the hall on the right;
// - THE HALL (x 60): the upstairs hall, dark, doors; candlelight under the far door;
// - THE HOUSE (x 1000): a two-storey red-brick homestead with deep verandas and iron lace, on a rise;
// - the woman in black (a long black dress, a high collar, her hair up, a pale face), never identified
//   as fact; you (the guest), seen only on the phone's front camera.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1, rng} from '../ps1';
import {SNAP6} from '../ep01/world';

const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 64, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 64, SNAP6);

const tex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rep: [number, number] = [1, 1]) => {
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	draw(c.getContext('2d')!);
	const t = new THREE.CanvasTexture(c);
	t.magFilter = THREE.NearestFilter;
	t.minFilter = THREE.NearestFilter;
	t.generateMipmaps = false;
	t.colorSpace = THREE.SRGBColorSpace;
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	t.repeat.set(rep[0], rep[1]);
	return t;
};

export type V3 = [number, number, number];
const seg = (v: number) => Math.min(48, Math.max(1, Math.ceil(v / 0.4)));
export const Box: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={[s[0], s[1], s[2], seg(s[0]), seg(s[1]), seg(s[2])]} />
	</mesh>
);
const Floor: React.FC<{p: V3; w: number; d: number; m: THREE.Material}> = ({p, w, d, m}) => (
	<mesh rotation={[-Math.PI / 2, 0, 0]} position={p} material={m}>
		<planeGeometry args={[w, d, seg(w), seg(d)]} />
	</mesh>
);

export const HALL: V3 = [60, 0, 0];
export const EXT: V3 = [1000, 0, 0];
export const RW = 5; // room width (x)
export const RD = 5.4; // room depth (z): the French doors at z = -RD/2
export const RH = 3.4;
export const DOORS_Z = -RD / 2;
export const BALCONY_Z = DOORS_Z - 1.2;

const useMats = () =>
	useMemo(() => {
		const paper = tex(16, 16, (g) => {
			g.fillStyle = '#5a4a3a';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#6e5a42';
			for (const [x, y] of [[3, 3], [11, 7], [6, 12], [14, 14], [1, 9]]) {
				g.fillRect(x, y, 2, 2);
				g.fillRect(x - 1, y + 1, 4, 1);
			}
			g.fillStyle = '#4a3c2e';
			for (let x = 0; x < 16; x += 8) g.fillRect(x, 0, 1, 16);
		}, [10, 4]);
		const boards = tex(16, 16, (g) => {
			g.fillStyle = '#3a2818';
			g.fillRect(0, 0, 16, 16);
			for (let x = 0; x < 16; x += 4) {
				g.fillStyle = '#2a1c10';
				g.fillRect(x, 0, 1, 16);
			}
		}, [5, 6]);
		const rug = tex(16, 16, (g) => {
			g.fillStyle = '#4a1e1a';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#6a3424';
			g.fillRect(2, 2, 12, 12);
			g.fillStyle = '#4a1e1a';
			g.fillRect(4, 4, 8, 8);
		});
		const lace = tex(16, 16, (g) => {
			g.clearRect(0, 0, 16, 16);
			g.fillStyle = 'rgba(220,214,200,0.55)';
			for (let y = 0; y < 16; y += 2) for (let x = (y / 2) % 2; x < 16; x += 2) g.fillRect(x, y, 1, 1);
			g.fillStyle = 'rgba(230,224,210,0.8)';
			for (const [x, y] of [[4, 4], [11, 9], [6, 13]]) g.fillRect(x, y, 2, 2);
		}, [3, 5]);
		const brick = tex(16, 16, (g) => {
			g.fillStyle = '#6a3424';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#4a2418';
			for (let y = 0; y < 16; y += 4) {
				g.fillRect(0, y, 16, 1);
				for (let x = (y / 4) % 2 ? 0 : 4; x < 16; x += 8) g.fillRect(x, y, 1, 4);
			}
		}, [20, 6]);
		return {
			paper: lam('#ffffff', {map: paper}),
			boards: lam('#ffffff', {map: boards}),
			rug: lam('#ffffff', {map: rug}),
			ceiling: lam('#8a8478'),
			cornice: lam('#a8a090'),
			cedar: lam('#5a2e1a'),
			cedarD: lam('#3a1c10'),
			iron: lam('#1c1c1c'),
			brass: lam('#8a7438'),
			linen: lam('#a8a296'),
			quilt: lam('#5a3a3a'),
			mirror: lam('#1a1e24'),
			glass: new THREE.MeshLambertMaterial({color: '#20283a', transparent: true, opacity: 0.35}),
			lace: (() => {
				const m = new THREE.MeshLambertMaterial({map: lace, transparent: true, side: THREE.DoubleSide, alphaTest: 0.1});
				return m;
			})(),
			frame: lam('#c8c0b0'),
			white: lam('#c8c4bc'),
			night: bas('#3a4864'),
			rain: bas('#8a96aa', {transparent: true, opacity: 0.55}),
			dark: bas('#020202'),
			candle: bas('#ffb860'),
			brick: lam('#ffffff', {map: brick}),
			roof: lam('#3a3c40'),
			winD: bas('#0c0c10'),
			winL: bas('#e8c070'),
			grass: lam('#2a2e24'),
			tree: lam('#1e221c'),
			dress: lam('#0e0e10'),
			dressL: lam('#1c1c20'),
			pale: lam('#cfcac0'),
			hair: lam('#2a2622'),
			socket: bas('#040404'),
			skin: lam('#8a7666'),
			shirt: lam('#2a303a'),
			hand: lam('#7e7a72'),
			sky: new THREE.MeshBasicMaterial({color: '#1a2030', side: THREE.BackSide, fog: false}),
			moon: bas('#e8e8e0', {fog: false}),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
const Ctx = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(Ctx)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMats()}>{children}</Ctx.Provider>;

/** The iron lace railing along the veranda (in front of the French doors, outside). */
const Railing: React.FC<{z: number; len: number}> = ({z, len}) => {
	const m = useM();
	return (
		<group>
			<Box p={[0, 1.0, z]} s={[len, 0.06, 0.08]} m={m.white} />
			<Box p={[0, 0.1, z]} s={[len, 0.06, 0.08]} m={m.white} />
			{Array.from({length: Math.floor(len / 0.12)}, (_, i) => (
				<Box key={i} p={[-len / 2 + i * 0.12, 0.55, z]} s={[0.02, 0.9, 0.02]} m={m.white} />
			))}
			{[-2.4, 0, 2.4].map((x) => (
				<Box key={`p${x}`} p={[x, 1.5, z]} s={[0.12, 3.0, 0.12]} m={m.white} />
			))}
		</group>
	);
};

/** The bedroom. wardrobe: 0 shut .. 1 open; rainStop: the rain hangs in the air from now (seconds since
 * the storm stopped, negative while it still falls); t: time (rain motion). */
export const Bedroom: React.FC<{wardrobe: number; t: number; rainStop: number}> = ({wardrobe, t, rainStop}) => {
	const m = useM();
	const drops = useMemo(() => {
		const r = rng(29);
		return Array.from({length: 90}, () => ({x: (r() - 0.5) * 6, z: DOORS_Z - 0.6 - r() * 4, y: r() * 4, s: 0.25 + r() * 0.3}));
	}, []);
	const tr = rainStop < 0 ? t : t - rainStop; // the rain's own clock stops when the storm stops
	const fall = rainStop < 0 ? tr : 0;
	return (
		<group>
			<Floor p={[0, 0, 0]} w={RW} d={RD} m={m.boards} />
			<Floor p={[-0.2, 0.005, 0.4]} w={2.6} d={2.8} m={m.rug} />
			<Box p={[0, RH, 0]} s={[RW, 0.1, RD]} m={m.ceiling} />
			<Box p={[-RW / 2, RH / 2, 0]} s={[0.1, RH, RD]} m={m.paper} />
			<Box p={[RW / 2, RH / 2, -1.2]} s={[0.1, RH, RD - 2.4]} m={m.paper} />
			<Box p={[RW / 2, RH / 2, 2.4]} s={[0.1, RH, 0.6]} m={m.paper} />
			<Box p={[RW / 2, 2.75, 1.55]} s={[0.1, 1.3, 1.1]} m={m.paper} />
			<Box p={[RW / 2 + 0.02, 1.05, 1.55]} s={[0.06, 2.1, 1.0]} m={m.dark} />
			<Box p={[0, RH / 2, RD / 2]} s={[RW, RH, 0.1]} m={m.paper} />
			{/* the French doors to the veranda (wall z = DOORS_Z) */}
			<Box p={[-1.75, RH / 2, DOORS_Z]} s={[1.5, RH, 0.12]} m={m.paper} />
			<Box p={[1.75, RH / 2, DOORS_Z]} s={[1.5, RH, 0.12]} m={m.paper} />
			<Box p={[0, 3.05, DOORS_Z]} s={[2.0, 0.7, 0.12]} m={m.paper} />
			{[-0.5, 0.5].map((x) => (
				<group key={x} position={[x, 1.35, DOORS_Z]}>
					<mesh material={m.glass}>
						<planeGeometry args={[0.9, 2.6]} />
					</mesh>
					{[-0.44, 0.44].map((dx) => (
						<Box key={dx} p={[dx, 0, 0.02]} s={[0.05, 2.7, 0.05]} m={m.white} />
					))}
					{[-1.3, -0.4, 0.5, 1.3].map((dy) => (
						<Box key={dy} p={[0, dy, 0.02]} s={[0.9, 0.04, 0.04]} m={m.white} />
					))}
				</group>
			))}
			{/* lace curtains, drawn back to each side */}
			{[-1, 1].map((sd) => (
				<mesh key={sd} position={[sd * 0.78, 1.5, DOORS_Z + 0.12]} material={m.lace}>
					<planeGeometry args={[0.5, 2.9]} />
				</mesh>
			))}
			{/* outside: the veranda floor, the iron lace, the night, the rain */}
			<Floor p={[0, 0, DOORS_Z - 0.7]} w={8} d={1.4} m={m.boards} />
			<group position={[0, 0, 0]}>
				<Railing z={BALCONY_Z} len={8} />
			</group>
			<Box p={[0, 1.6, DOORS_Z - 9]} s={[30, 10, 0.1]} m={m.night} />
			{drops.map((d, i) => {
				const y = ((d.y - fall * 9) % 4 + 4) % 4;
				return (
					<mesh key={i} position={[d.x, y, d.z]} material={m.rain}>
						<planeGeometry args={[0.012, d.s]} />
					</mesh>
				);
			})}
			{/* the iron bed (you are sitting on it, its foot towards the doors) */}
			<group position={[0.6, 0, 1.4]}>
				<Box p={[0, 0.5, 0]} s={[1.4, 0.2, 2.0]} m={m.linen} />
				<Box p={[0, 0.62, -0.3]} s={[1.42, 0.06, 1.3]} m={m.quilt} />
				{[-0.7, 0.7].map((x) => [-1.0, 1.0].map((z) => <Box key={`${x}${z}`} p={[x, 0.5, z]} s={[0.04, 1.0, 0.04]} m={m.iron} />))}
				<Box p={[0, 0.95, -1.0]} s={[1.42, 0.04, 0.04]} m={m.brass} />
				<Box p={[0, 1.3, 1.0]} s={[1.42, 0.04, 0.04]} m={m.brass} />
			</group>
			{/* the dressing table and its oval mirror on the left wall */}
			<group position={[-RW / 2 + 0.3, 0, -0.6]} rotation={[0, Math.PI / 2, 0]}>
				<Box p={[0, 0.72, 0]} s={[1.1, 0.06, 0.5]} m={m.cedar} />
				{[-0.5, 0.5].map((x) => <Box key={x} p={[x, 0.36, 0]} s={[0.06, 0.72, 0.45]} m={m.cedarD} />)}
				<mesh position={[0, 1.4, -0.2]} scale={[0.4, 0.55, 1]} material={m.cedar}>
					<circleGeometry args={[1, 16]} />
				</mesh>
				<mesh position={[0, 1.4, -0.19]} scale={[0.34, 0.49, 1]} material={m.mirror}>
					<circleGeometry args={[1, 16]} />
				</mesh>
			</group>
			{/* the cedar wardrobe in the corner by the doors; its door swings open */}
			<group position={[-RW / 2 + 0.4, 0, DOORS_Z + 1.0]} rotation={[0, Math.PI / 2, 0]}>
				<Box p={[0, 1.1, -0.05]} s={[1.0, 2.2, 0.5]} m={m.cedarD} />
				<Box p={[0, 2.25, 0]} s={[1.1, 0.1, 0.6]} m={m.cedar} />
				<Box p={[0, 1.1, 0.205]} s={[0.92, 2.1, 0.02]} m={m.dark} />
				<group position={[0.48, 0, 0.23]} rotation={[0, wardrobe * 1.6, 0]}>
					<Box p={[-0.24, 1.1, 0]} s={[0.46, 2.1, 0.04]} m={m.cedar} />
					<Box p={[-0.42, 1.1, 0.03]} s={[0.03, 0.08, 0.03]} m={m.brass} />
				</group>
				<Box p={[-0.24, 1.1, 0.23]} s={[0.46, 2.1, 0.04]} m={m.cedar} />
			</group>
			{/* a framed picture (a landscape), and a chair */}
			<Box p={[-0.6, 2.2, RD / 2 - 0.07]} s={[0.8, 0.6, 0.04]} m={m.cedarD} />
			<group position={[1.8, 0, -1.4]} rotation={[0, -0.6, 0]}>
				<Box p={[0, 0.45, 0]} s={[0.45, 0.06, 0.45]} m={m.cedar} />
				{[-0.2, 0.2].map((x) => [-0.2, 0.2].map((z) => <Box key={`${x}${z}`} p={[x, 0.22, z]} s={[0.04, 0.44, 0.04]} m={m.cedarD} />))}
				<Box p={[0, 0.85, 0.2]} s={[0.45, 0.8, 0.05]} m={m.cedar} />
			</group>
		</group>
	);
};

/** The upstairs hall: dark; candlelight under the far door (candle: 0 out .. 1 lit). */
export const Hall: React.FC<{candle: number}> = ({candle}) => {
	const m = useM();
	return (
		<group position={HALL}>
			<Floor p={[0, 0, -6]} w={2.2} d={14} m={m.boards} />
			<Box p={[0, RH, -6]} s={[2.2, 0.1, 14]} m={m.ceiling} />
			{[-1, 1].map((sd) => (
				<Box key={sd} p={[sd * 1.1, RH / 2, -6]} s={[0.1, RH, 14]} m={m.paper} />
			))}
			{[-3, -7, -10].map((z, i) => (
				<Box key={z} p={[(i % 2 ? 1 : -1) * 1.07, 1.05, z]} s={[0.04, 2.1, 0.9]} m={m.cedarD} />
			))}
			<Box p={[0, RH / 2, -13]} s={[2.2, RH, 0.1]} m={m.paper} />
			<Box p={[0, 1.05, -12.95]} s={[0.9, 2.1, 0.04]} m={m.cedarD} />
			{candle > 0.02 && <Box p={[0, 0.02, -12.9]} s={[0.86, 0.03, 0.06]} m={m.candle} />}
			<Box p={[0, 0.9, 0.2]} s={[2.2, 1.8, 0.1]} m={m.dark} />
		</group>
	);
};

/** The house at night: two storeys of red brick, deep verandas with iron lace, a central gable. */
export const House: React.FC<{lit: boolean}> = ({lit}) => {
	const m = useM();
	const trees = useMemo(() => {
		const r = rng(71);
		return Array.from({length: 22}, () => ({x: (r() - 0.5) * 140, z: -20 - r() * 40, h: 8 + r() * 6, s: 3 + r() * 3}));
	}, []);
	return (
		<group position={EXT}>
			<mesh material={m.sky}>
				<sphereGeometry args={[500, 10, 8]} />
			</mesh>
			<mesh position={[80, 90, -300]} material={m.moon}>
				<circleGeometry args={[7, 14]} />
			</mesh>
			<Floor p={[0, 0, 20]} w={300} d={200} m={m.grass} />
			<Box p={[0, 4, 0]} s={[22, 8, 10]} m={m.brick} />
			<Box p={[0, 9, 0]} s={[23, 2.2, 11]} m={m.roof} r={[0, 0, 0]} />
			<mesh position={[0, 8, 5.2]} material={m.brick}>
				<cylinderGeometry args={[0, 3.2, 3, 4, 1, false, Math.PI / 4]} />
			</mesh>
			{/* the verandas: floors, posts and the iron lace, upstairs and down */}
			{[0.05, 4.0].map((y) => (
				<group key={y}>
					<Box p={[0, y, 6.4]} s={[22, 0.15, 2.6]} m={m.boards} />
					{Array.from({length: 9}, (_, i) => (
						<Box key={i} p={[-10.5 + i * 2.625, y + 2, 7.6]} s={[0.15, 4, 0.15]} m={m.white} />
					))}
					<Box p={[0, y + 3.7, 7.6]} s={[22, 0.4, 0.1]} m={m.white} />
					{y > 1 && <Box p={[0, y + 1.0, 7.6]} s={[22, 0.06, 0.08]} m={m.white} />}
				</group>
			))}
			<Box p={[0, 8.0, 6.4]} s={[23, 0.2, 2.8]} m={m.roof} />
			{/* windows and doors, upstairs and down; ours (upstairs, second from the right) is lit */}
			{[1.6, 5.6].map((y) =>
				[-8, -4, 0, 4, 8].map((x) => (
					<Box key={`${y}${x}`} p={[x, y, 5.05]} s={[1.2, 2.2, 0.1]} m={lit && y > 3 && x === 4 ? m.winL : m.winD} />
				)),
			)}
			{trees.map((t, i) => (
				<group key={i} position={[t.x, 0, t.z]}>
					<Box p={[0, t.h * 0.3, 0]} s={[0.5, t.h * 0.6, 0.5]} m={m.tree} />
					<mesh position={[0, t.h * 0.8, 0]} material={m.tree}>
						<icosahedronGeometry args={[t.s, 0]} />
					</mesh>
				</group>
			))}
		</group>
	);
};

/** The woman in black: a long black dress, a high collar, her hair up, a pale face. walk: stride phase. */
export const WomanInBlack: React.FC<{p: V3; ry: number; walk?: number; face?: boolean}> = ({p, ry, walk = 0, face = true}) => {
	const m = useM();
	const sw = Math.sin(walk);
	return (
		<group position={p} rotation={[0, ry, 0]}>
			<mesh position={[0, 0.55, 0]} rotation={[sw * 0.06, 0, 0]} material={m.dress}>
				<cylinderGeometry args={[0.2, 0.44, 1.1, 10]} />
			</mesh>
			<mesh position={[0, 1.25, 0]} material={m.dressL}>
				<cylinderGeometry args={[0.15, 0.19, 0.45, 8]} />
			</mesh>
			<Box p={[0, 1.5, 0]} s={[0.12, 0.1, 0.12]} m={m.dress} />
			<mesh position={[0, 1.64, 0.01]} scale={[0.85, 1.1, 0.9]} material={face ? m.pale : m.dress}>
				<icosahedronGeometry args={[0.1, 1]} />
			</mesh>
			{face && (
				<>
					{[-0.032, 0.032].map((x) => (
						<mesh key={x} position={[x, 1.655, 0.085]} material={m.socket}>
							<boxGeometry args={[0.024, 0.03, 0.02]} />
						</mesh>
					))}
				</>
			)}
			<mesh position={[0, 1.72, -0.04]} material={m.hair}>
				<sphereGeometry args={[0.1, 8, 6]} />
			</mesh>
			<mesh position={[0, 1.76, -0.12]} material={m.hair}>
				<sphereGeometry args={[0.06, 6, 5]} />
			</mesh>
			{[-1, 1].map((sd) => (
				<group key={sd} position={[sd * 0.2, 1.42, 0]} rotation={[sd * sw * 0.3, 0, sd * 0.1]}>
					<Box p={[0, -0.3, 0]} s={[0.08, 0.6, 0.08]} m={m.dressL} />
				</group>
			))}
		</group>
	);
};

/** You, as the phone's front camera sees you: head and shoulders, lit by the screen. */
export const Guest: React.FC<{p: V3; ry: number}> = ({p, ry}) => {
	const m = useM();
	return (
		<group position={p} rotation={[0, ry, 0]}>
			<Box p={[0, 1.15, 0]} s={[0.46, 0.5, 0.26]} m={m.shirt} />
			<mesh position={[0, 1.55, 0]} scale={[0.9, 1.1, 0.95]} material={m.skin}>
				<icosahedronGeometry args={[0.11, 1]} />
			</mesh>
			<mesh position={[0, 1.62, -0.02]} scale={[1, 0.7, 1]} material={m.hair}>
				<sphereGeometry args={[0.115, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
			</mesh>
			{[-0.035, 0.035].map((x) => (
				<mesh key={x} position={[x, 1.565, 0.095]} material={m.socket}>
					<boxGeometry args={[0.022, 0.012, 0.01]} />
				</mesh>
			))}
		</group>
	);
};

/** Pale fingers resting on your shoulder (seen from your own point of view). */
export const HandOnShoulder: React.FC<{p: V3; ry: number; k: number}> = ({p, ry, k}) => {
	const m = useM();
	return (
		<group position={p} rotation={[0, ry, 0]}>
			<Box p={[0, 0, 0]} s={[0.2, 0.1, 0.16]} m={m.shirt} />
			<group position={[0.02, 0.06 + 0.06 * (1 - k), -0.06 - 0.12 * (1 - k)]}>
				{[0, 1, 2, 3].map((i) => (
					<group key={i} position={[-0.045 + i * 0.03, 0, 0]} rotation={[0.9 * k, 0, 0]}>
						<Box p={[0, 0, 0.05]} s={[0.02, 0.016, 0.12 - Math.abs(i - 1.5) * 0.015]} m={m.hand} />
					</group>
				))}
				<Box p={[0, 0.01, -0.03]} s={[0.12, 0.02, 0.07]} m={m.hand} />
				{/* her black sleeve, from behind you */}
				<Box p={[0.01, 0.06, -0.15]} s={[0.08, 0.08, 0.2]} m={m.dress} r={[0.5, 0, 0]} />
			</group>
		</group>
	);
};
