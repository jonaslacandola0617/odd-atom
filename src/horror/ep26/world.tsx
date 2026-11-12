// Episode 26 world: "Post Three" (Season 3, a real reported case: the Castle of Good Hope, Cape Town).
// Composites at real scale, not a survey of the castle:
// - THE CORRIDOR (origin): a long lime-washed passage with a stone barrel vault and flagstones; dark
//   side doorways; at the far end an opening onto the moonlit courtyard (so a figure there reads in
//   silhouette and the torch catches her grey dress);
// - THE COURTYARD (x 80): cobbles, the low ochre-yellow buildings with white trim, a balcony, a bell
//   turret over the gate; behind the guard, a door under a dim wall lamp;
// - THE GOVERNOR'S ROOM (x 160): boards, beams, a dark portrait, a window, a desk with a ledger, a
//   quill and a cold candle, and a chair pushed in;
// - THE RAMPARTS (x 240): the walk along the top of the wall, the parapet, the city's lights and the
//   bay below, the mountain;
// - THE DUNGEON (x 320): steps down into a low windowless vault with an iron-bound door; seven
//   scratched tallies on the wall;
// - THE CASTLE FROM ABOVE (x 1000): the five-pointed plan of bastions, the moat, the yellow buildings
//   inside, the city, the mountain;
// - the woman in grey (reported: seen running through the corridors); a tall man leaning over the
//   battlements (reported); neither has a face we see clearly, neither is identified;
// - the guard's radio and gloved hand (rendered in their own small canvas), and a grey hand.
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
// subdivide every surface: the PS1 shader lights per vertex, so a big face under a torch stays black
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

export const YARD: V3 = [80, 0, 0];
export const GOV: V3 = [160, 0, 0];
export const RAMP: V3 = [240, 0, 0];
export const DUN: V3 = [320, 0, 0];
export const EXT: V3 = [1000, 0, 0];
export const CW = 2.4; // corridor width
export const COR_END = -22; // the opening onto the courtyard at the far end of the corridor

const useMats = () =>
	useMemo(() => {
		const flags = tex(16, 16, (g) => {
			g.fillStyle = '#5e5a50';
			g.fillRect(0, 0, 16, 16);
			const r = rng(11);
			for (let i = 0; i < 30; i++) {
				g.fillStyle = r() < 0.5 ? '#54504a' : '#686458';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 2, 1);
			}
			g.fillStyle = '#3a3832';
			g.fillRect(0, 0, 16, 1);
			g.fillRect(0, 8, 16, 1);
			g.fillRect(0, 0, 1, 8);
			g.fillRect(8, 8, 1, 8);
		}, [2, 14]);
		const lime = tex(16, 16, (g) => {
			g.fillStyle = '#b4ac9a';
			g.fillRect(0, 0, 16, 16);
			const r = rng(5);
			for (let i = 0; i < 40; i++) {
				g.fillStyle = r() < 0.6 ? '#a49c88' : '#c0b8a6';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1 + Math.floor(r() * 3), 1);
			}
			// damp at the foot of the wall
			g.fillStyle = '#8a8270';
			g.fillRect(0, 13, 16, 3);
		}, [12, 1]);
		const vault = tex(16, 16, (g) => {
			g.fillStyle = '#7a7466';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#5a5448';
			for (let y = 0; y < 16; y += 4) {
				g.fillRect(0, y, 16, 1);
				for (let x = (y / 4) % 2 ? 0 : 3; x < 16; x += 6) g.fillRect(x, y, 1, 4);
			}
		}, [10, 4]);
		const cobble = tex(16, 16, (g) => {
			g.fillStyle = '#4a4640';
			g.fillRect(0, 0, 16, 16);
			const r = rng(21);
			for (let y = 0; y < 16; y += 3)
				for (let x = (y / 3) % 2 ? 0 : 2; x < 16; x += 4) {
					g.fillStyle = r() < 0.5 ? '#5a564e' : '#625e54';
					g.fillRect(x, y, 3, 2);
				}
		}, [16, 16]);
		const ochre = tex(16, 16, (g) => {
			g.fillStyle = '#a8883c';
			g.fillRect(0, 0, 16, 16);
			const r = rng(31);
			for (let i = 0; i < 30; i++) {
				g.fillStyle = r() < 0.5 ? '#9a7c34' : '#b49444';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 2, 1);
			}
		}, [6, 2]);
		const boards = tex(16, 16, (g) => {
			g.fillStyle = '#3a2a1c';
			g.fillRect(0, 0, 16, 16);
			for (let x = 0; x < 16; x += 4) {
				g.fillStyle = '#2a1e14';
				g.fillRect(x, 0, 1, 16);
			}
		}, [3, 6]);
		const portrait = tex(16, 20, (g) => {
			g.fillStyle = '#16120c';
			g.fillRect(0, 0, 16, 20);
			g.fillStyle = '#241c12';
			g.fillRect(5, 4, 6, 7);
			g.fillRect(2, 12, 12, 8);
		});
		// the ledger: seven lines struck through (a hidden detail; illegible, no names)
		const ledger = tex(32, 24, (g) => {
			g.fillStyle = '#c8bc98';
			g.fillRect(0, 0, 32, 24);
			g.fillStyle = '#7a6a50';
			g.fillRect(15, 0, 2, 24);
			for (let i = 0; i < 9; i++) {
				g.fillStyle = '#4a3a2a';
				g.fillRect(2, 3 + i * 2.2, 10 - (i % 3), 1);
				g.fillRect(19, 3 + i * 2.2, 9 - (i % 2), 1);
			}
			g.fillStyle = '#2a1008';
			for (let i = 0; i < 7; i++) g.fillRect(18, 3 + i * 2.2, 12, 1);
		});
		// seven tallies scratched in the dungeon wall
		const tally = tex(32, 16, (g) => {
			g.fillStyle = '#6e685a';
			g.fillRect(0, 0, 32, 16);
			g.fillStyle = '#c8c2b0';
			for (let i = 0; i < 4; i++) g.fillRect(3 + i * 3, 3, 1, 10);
			g.fillRect(2, 7, 13, 1);
			for (let i = 0; i < 3; i++) g.fillRect(19 + i * 3, 3, 1, 10);
		});
		return {
			flags: lam('#ffffff', {map: flags}),
			lime: lam('#ffffff', {map: lime}),
			limeD: lam('#ffffff', {map: lime, side: THREE.DoubleSide}),
			vault: lam('#ffffff', {map: vault, side: THREE.DoubleSide}),
			cobble: lam('#ffffff', {map: cobble}),
			ochre: lam('#ffffff', {map: ochre}),
			trim: lam('#c8c0aa'),
			slate: lam('#2a2c30'),
			boards: lam('#ffffff', {map: boards}),
			beam: lam('#2a1a10'),
			wood: lam('#4a3220'),
			woodD: lam('#2e2014'),
			portrait: lam('#ffffff', {map: portrait}),
			gilt: lam('#5a4824'),
			ledger: lam('#ffffff', {map: ledger}),
			tally: lam('#ffffff', {map: tally}),
			quill: lam('#d8d0c0'),
			wax: lam('#d8d0b0'),
			iron: lam('#2a2a2c'),
			stone: lam('#6e685a'),
			dark: bas('#030304'),
			moonGap: bas('#1a2438'),
			window: bas('#1e2a40'),
			lampOn: bas('#ffd890'),
			lampOff: bas('#2a2418'),
			winLit: bas('#e8b860'),
			winDark: bas('#0e0c0a'),
			city: bas('#e0a050'),
			city2: bas('#a8b8d0'),
			sea: lam('#0c1420'),
			ground: lam('#16181a'),
			moat: lam('#0a1018'),
			mountain: bas('#0c1018', {fog: false}),
			grey: lam('#9a9c96'),
			greyD: lam('#6e706a'),
			greyFace: lam('#b4b6ae'),
			hair: lam('#3a3a38'),
			socket: bas('#050505'),
			coat: lam('#14141a'),
			coatL: lam('#22222a'),
			skin: lam('#5a5048'),
			moon: bas('#d8dce0', {fog: false}),
			sky: new THREE.MeshBasicMaterial({color: '#070a12', side: THREE.BackSide, fog: false}),
			skyR: new THREE.MeshBasicMaterial({color: '#1c2638', side: THREE.BackSide, fog: false}),
			stoneX: lam('#a49c88'),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
const Ctx = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(Ctx)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMats()}>{children}</Ctx.Provider>;

/** A barrel vault along z: a half cylinder from wall top to wall top. */
const Vault: React.FC<{p: V3; r: number; len: number; m: THREE.Material}> = ({p, r, len, m}) => (
	<mesh position={p} rotation={[Math.PI / 2, 0, 0]} material={m}>
		<cylinderGeometry args={[r, r, len, 12, seg(len), true, Math.PI / 2, Math.PI]} />
	</mesh>
);

/** The corridor: lime-washed walls, a stone vault, flagstones; the far end opens onto moonlight. */
export const Corridor: React.FC = () => {
	const m = useM();
	const len = 30;
	const zc = COR_END + len / 2;
	return (
		<group>
			<Floor p={[0, 0, zc]} w={CW} d={len} m={m.flags} />
			{[-1, 1].map((sd) => (
				<Box key={sd} p={[sd * (CW / 2 + 0.05), 1.1, zc]} s={[0.1, 2.2, len]} m={m.lime} />
			))}
			<Vault p={[0, 2.2, zc]} r={CW / 2} len={len} m={m.vault} />
			{/* dark side doorways and a few iron rings */}
			{[-3, -8, -13, -17].map((z, i) => (
				<group key={z}>
					<Box p={[(i % 2 ? 1 : -1) * (CW / 2 + 0.02), 0.95, z]} s={[0.06, 1.9, 0.95]} m={m.dark} />
					<Box p={[(i % 2 ? -1 : 1) * (CW / 2 - 0.01), 1.5, z + 1.6]} s={[0.04, 0.12, 0.12]} m={m.iron} />
				</group>
			))}
			{/* the end: a wall with an opening onto the moonlit yard, the yard's cobbles and a far wall */}
			<Box p={[-0.85, 1.8, COR_END]} s={[0.7, 3.6, 0.4]} m={m.lime} />
			<Box p={[0.85, 1.8, COR_END]} s={[0.7, 3.6, 0.4]} m={m.lime} />
			<Box p={[0, 3.0, COR_END]} s={[1.0, 1.2, 0.4]} m={m.lime} />
			<Floor p={[0, 0.0, COR_END - 3]} w={8} d={6} m={m.cobble} />
			<Box p={[0, 2.5, COR_END - 6]} s={[8, 5, 0.3]} m={m.ochre} />
			<Box p={[0, 1.6, COR_END - 5.8]} s={[0.9, 1.6, 0.1]} m={m.woodD} />
			{/* the corridor behind the guard */}
			<Box p={[0, 1.8, COR_END + len]} s={[CW, 3.6, 0.2]} m={m.lime} />
		</group>
	);
};

/** The courtyard; door: 0 open .. 1 shut (the door behind the guard). */
export const Yard: React.FC<{door: number; lamp: boolean}> = ({door, lamp}) => {
	const m = useM();
	return (
		<group position={YARD}>
			<mesh material={m.sky}>
				<sphereGeometry args={[90, 10, 8]} />
			</mesh>
			<mesh position={[-30, 40, -60]} material={m.moon}>
				<circleGeometry args={[3, 12]} />
			</mesh>
			<Floor p={[0, 0, 0]} w={30} d={40} m={m.cobble} />
			{/* the low ochre buildings ahead (with the balcony) and behind; white trim, dark roofs */}
			{[-14, 18].map((z) => (
				<group key={z} position={[0, 0, z]} rotation={[0, z > 0 ? Math.PI : 0, 0]}>
					<Box p={[0, 3.5, 0]} s={[30, 7, 1]} m={m.ochre} />
					<Box p={[0, 7.2, 0]} s={[30, 0.4, 1.4]} m={m.trim} />
					<Box p={[0, 8.4, -0.6]} s={[30, 2, 2.4]} m={m.slate} r={[0.5, 0, 0]} />
					{Array.from({length: 9}, (_, i) => (
						<group key={i} position={[-12 + i * 3, 0, 0.52]}>
							<Box p={[0, 4.6, 0]} s={[1.1, 1.6, 0.06]} m={m.window} />
							<Box p={[0, 4.6, 0.02]} s={[1.3, 0.1, 0.06]} m={m.trim} />
							{i % 2 === 0 && <Box p={[0, 1.6, 0]} s={[1.3, 2.4, 0.06]} m={m.window} />}
						</group>
					))}
				</group>
			))}
			{/* the balcony ahead, and the bell turret over the gate to the left */}
			<Box p={[0, 3.0, -13.2]} s={[6, 0.25, 1.6]} m={m.trim} />
			{[-2.8, -1.4, 0, 1.4, 2.8].map((x) => (
				<Box key={x} p={[x, 3.6, -12.5]} s={[0.12, 1.0, 0.12]} m={m.trim} />
			))}
			<Box p={[-14, 3.5, 2]} s={[1, 7, 30]} m={m.ochre} />
			<Box p={[-14, 9.5, 2]} s={[1.6, 3, 3]} m={m.trim} />
			<Box p={[-14, 11.6, 2]} s={[1.8, 1.2, 3.2]} m={m.slate} />
			<Box p={[14, 3.5, 2]} s={[1, 7, 30]} m={m.ochre} />
			{/* the door behind the guard, under its wall lamp; it swings shut */}
			<Box p={[-0.9, 1.3, 17.45]} s={[0.15, 2.6, 0.2]} m={m.trim} />
			<Box p={[0.9, 1.3, 17.45]} s={[0.15, 2.6, 0.2]} m={m.trim} />
			<Box p={[0, 1.25, 17.6]} s={[1.6, 2.5, 0.05]} m={m.dark} />
			<group position={[-0.8, 0, 17.4]} rotation={[0, -(1 - door) * 1.4, 0]}>
				<Box p={[0.8, 1.25, 0]} s={[1.6, 2.5, 0.08]} m={m.wood} />
				<Box p={[1.4, 1.2, -0.06]} s={[0.06, 0.06, 0.06]} m={m.iron} />
			</group>
			<Box p={[0, 3.0, 17.3]} s={[0.25, 0.3, 0.25]} m={lamp ? m.lampOn : m.lampOff} />
		</group>
	);
};

/** The governor's room; chair: 0 pushed in .. 1 pushed back (by itself); page: 0..1 a page turning. */
export const GovRoom: React.FC<{chair: number; page: number}> = ({chair, page}) => {
	const m = useM();
	return (
		<group position={GOV}>
			<Floor p={[0, 0, 0]} w={6} d={7} m={m.boards} />
			<Box p={[0, 1.6, -3.5]} s={[6, 3.2, 0.1]} m={m.lime} />
			<Box p={[-3, 1.6, 0]} s={[0.1, 3.2, 7]} m={m.lime} />
			<Box p={[3, 1.6, 0]} s={[0.1, 3.2, 7]} m={m.lime} />
			<Box p={[0, 1.6, 3.5]} s={[6, 3.2, 0.1]} m={m.lime} />
			<Box p={[0, 3.2, 0]} s={[6, 0.08, 7]} m={m.lime} />
			{[-2.5, -1, 0.5, 2].map((z) => (
				<Box key={z} p={[0, 3.08, z]} s={[6, 0.18, 0.22]} m={m.beam} />
			))}
			{/* the window on the back wall, moonlight; shutters */}
			<Box p={[-1.6, 1.8, -3.42]} s={[1.1, 1.5, 0.04]} m={m.window} />
			{[-0.3, 0.3].map((x) => (
				<Box key={x} p={[-1.6 + x * 1.8, 1.8, -3.38]} s={[0.04, 1.5, 0.04]} m={m.woodD} />
			))}
			<Box p={[-1.6, 1.8, -3.38]} s={[1.1, 0.04, 0.04]} m={m.woodD} />
			{/* a dark portrait on the left wall (no face) */}
			<group position={[-2.92, 1.9, -0.6]} rotation={[0, Math.PI / 2, 0]}>
				<Box p={[0, 0, -0.01]} s={[0.9, 1.15, 0.04]} m={m.gilt} />
				<mesh position={[0, 0, 0.012]} material={m.portrait}>
					<planeGeometry args={[0.76, 1.0]} />
				</mesh>
			</group>
			{/* the desk, the ledger, the quill, the cold candle */}
			<group position={[0.7, 0, -1.6]}>
				<Box p={[0, 0.76, 0]} s={[1.5, 0.06, 0.8]} m={m.wood} />
				{[-0.68, 0.68].map((x) => [-0.34, 0.34].map((z) => <Box key={`${x}${z}`} p={[x, 0.37, z]} s={[0.07, 0.74, 0.07]} m={m.woodD} />))}
				<mesh position={[0, 0.795, 0.05]} rotation={[-Math.PI / 2, 0, 0.08]} material={m.ledger}>
					<planeGeometry args={[0.5, 0.36]} />
				</mesh>
				{/* the turning page */}
				<group position={[0.0, 0.8, 0.05]} rotation={[0, 0.08, 0]}>
					<group rotation={[0, 0, page * Math.PI]}>
						<mesh position={[0.12, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.quill}>
							<planeGeometry args={[0.24, 0.35]} />
						</mesh>
					</group>
				</group>
				<Box p={[0.45, 0.83, -0.15]} s={[0.04, 0.12, 0.04]} m={m.wax} />
				<Box p={[0.45, 0.78, -0.15]} s={[0.12, 0.02, 0.12]} m={m.iron} />
				<Box p={[-0.42, 0.84, -0.1]} s={[0.02, 0.02, 0.26]} m={m.quill} r={[0.3, 0.4, 0]} />
				<Box p={[-0.48, 0.8, -0.2]} s={[0.07, 0.05, 0.07]} m={m.iron} />
			</group>
			{/* the chair: pushed in at the desk; it slides back as if someone stood up */}
			<group position={[0.7, 0, -1.05 + chair * 0.6]} rotation={[0, chair * 0.35, 0]}>
				<Box p={[0, 0.46, 0]} s={[0.5, 0.06, 0.48]} m={m.wood} />
				{[-0.22, 0.22].map((x) => [-0.2, 0.2].map((z) => <Box key={`${x}${z}`} p={[x, 0.22, z]} s={[0.05, 0.44, 0.05]} m={m.woodD} />))}
				<Box p={[0, 0.95, 0.22]} s={[0.5, 0.9, 0.06]} m={m.wood} />
				<Box p={[0, 1.42, 0.22]} s={[0.56, 0.08, 0.08]} m={m.woodD} />
			</group>
		</group>
	);
};

/** The ramparts: a wall walk along -z, the parapet on the right, the city and the bay beyond. */
export const Ramparts: React.FC = () => {
	const m = useM();
	const lights = useMemo(() => {
		const r = rng(77);
		return Array.from({length: 160}, () => ({x: 8 + r() * 140, z: 30 - r() * 220, y: -11.8 + r() * 0.5, c: r() < 0.75}));
	}, []);
	return (
		<group position={RAMP}>
			<mesh material={m.skyR}>
				<sphereGeometry args={[400, 10, 8]} />
			</mesh>
			<mesh position={[120, 70, -300]} material={m.moon}>
				<circleGeometry args={[8, 12]} />
			</mesh>
			{/* the mountain, flat-topped, black against the sky */}
			<mesh position={[60, -12, -360]} material={m.mountain}>
				<shapeGeometry args={[useMemo(() => {
					const s = new THREE.Shape();
					s.moveTo(-260, 0);
					s.lineTo(-150, 60);
					s.lineTo(-90, 120);
					s.lineTo(70, 124);
					s.lineTo(120, 110);
					s.lineTo(190, 60);
					s.lineTo(300, 0);
					return s;
				}, [])]} />
			</mesh>
			<Floor p={[0, 0, -10]} w={3.2} d={44} m={m.flags} />
			{/* the parapet on the right; a low wall on the left over the yard */}
			<Box p={[1.75, 0.5, -10]} s={[0.35, 1.0, 44]} m={m.stone} />
			<Box p={[1.75, 1.04, -10]} s={[0.45, 0.08, 44]} m={m.trim} />
			<Box p={[-1.7, 0.3, -10]} s={[0.25, 0.6, 44]} m={m.stone} />
			{/* the outer wall face, the moat and the city below */}
			<Box p={[2.5, -6, -10]} s={[1.2, 12, 44]} m={m.stone} />
			<Floor p={[12, -11.9, -10]} w={18} d={80} m={m.moat} />
			<Floor p={[90, -12, -90]} w={160} d={260} m={m.ground} />
			{lights.map((l, i) => (
				<mesh key={i} position={[l.x, l.y, l.z]} material={l.c ? m.city : m.city2}>
					<boxGeometry args={[0.6, 0.3, 0.6]} />
				</mesh>
			))}
			<Floor p={[-60, -12.2, -200]} w={200} d={200} m={m.sea} />
		</group>
	);
};

/** The dungeon: steps down from the door into a low windowless vault. door: 0 open .. 1 shut. */
export const Dungeon: React.FC<{door: number}> = ({door}) => {
	const m = useM();
	return (
		<group position={DUN}>
			<Floor p={[0, 0, -1]} w={3.6} d={5} m={m.flags} />
			{[-1, 1].map((sd) => (
				<Box key={sd} p={[sd * 1.85, 0.8, 0]} s={[0.1, 1.6, 8]} m={m.stone} />
			))}
			<Vault p={[0, 1.6, 0]} r={1.85} len={8} m={m.vault} />
			<Box p={[0, 1.4, -3.5]} s={[3.6, 2.8, 0.1]} m={m.stone} />
			{/* the tallies on the left wall */}
			<mesh position={[-1.79, 1.05, -1.4]} rotation={[0, Math.PI / 2, 0]} material={m.tally}>
				<planeGeometry args={[0.7, 0.35]} />
			</mesh>
			{/* a ring and a chain on the right wall; straw */}
			<Box p={[1.78, 1.2, -2.2]} s={[0.04, 0.14, 0.14]} m={m.iron} />
			<Box p={[1.76, 0.8, -2.2]} s={[0.03, 0.7, 0.03]} m={m.iron} />
			<Box p={[-1.2, 0.03, -2.6]} s={[0.9, 0.06, 0.7]} m={m.trim} />
			{/* the steps up to the door */}
			{Array.from({length: 7}, (_, i) => (
				<Box key={i} p={[0, (i + 1) * 0.1, 1.6 + i * 0.28]} s={[1.6, (i + 1) * 0.2, 0.3]} m={m.stone} />
			))}
			<Box p={[0, 1.4, 3.75]} s={[1.6, 0.04, 0.6]} m={m.stone} />
			<Box p={[0, 3.6, 3.65]} s={[3.6, 0.8, 0.2]} m={m.stone} />
			<Box p={[-1.3, 1.8, 3.65]} s={[1.0, 3.6, 0.2]} m={m.stone} />
			<Box p={[1.3, 1.8, 3.65]} s={[1.0, 3.6, 0.2]} m={m.stone} />
			<Box p={[0, 2.3, 3.9]} s={[1.6, 1.8, 0.05]} m={m.dark} />
			<group position={[-0.8, 1.4, 3.62]} rotation={[0, -(1 - door) * 1.5, 0]}>
				<Box p={[0.8, 0.9, 0]} s={[1.6, 1.8, 0.1]} m={m.woodD} />
				{[0.3, 1.0, 1.6].map((y) => (
					<Box key={y} p={[0.8, y, -0.06]} s={[1.6, 0.08, 0.03]} m={m.iron} />
				))}
				<Box p={[1.4, 0.9, -0.08]} s={[0.12, 0.08, 0.06]} m={m.iron} />
			</group>
		</group>
	);
};

/** The castle from above: five bastions, curtain walls, the moat, the yellow buildings, the city. */
export const CastleFromAbove: React.FC<{window: boolean; torchAt: number | null}> = ({window: win, torchAt}) => {
	const m = useM();
	const R = 70;
	const pts = useMemo(() => Array.from({length: 5}, (_, i) => {
		const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
		return [Math.cos(a) * R, Math.sin(a) * R] as [number, number];
	}), []);
	const bastion = useMemo(() => {
		const s = new THREE.Shape();
		s.moveTo(0, 18);
		s.lineTo(-11, 2);
		s.lineTo(-8, -6);
		s.lineTo(8, -6);
		s.lineTo(11, 2);
		s.lineTo(0, 18);
		return s;
	}, []);
	const lights = useMemo(() => {
		const r = rng(91);
		return Array.from({length: 400}, () => {
			const a = r() * Math.PI * 2, d = 110 + r() * 380;
			return {x: Math.cos(a) * d, z: Math.sin(a) * d * 0.8 + 60, c: r() < 0.8};
		}).filter((l) => !(l.z < -200 && l.x < 150 && l.x > -250)); // nothing on the mountain's slopes
	}, []);
	// the torch dot travels along one curtain wall (between bastions 1 and 2)
	const tp = torchAt === null ? null : [pts[1][0] + (pts[2][0] - pts[1][0]) * torchAt, pts[1][1] + (pts[2][1] - pts[1][1]) * torchAt];
	return (
		<group position={EXT}>
			<mesh material={m.sky}>
				<sphereGeometry args={[1500, 12, 8]} />
			</mesh>
			<mesh position={[-400, 380, -1200]} material={m.moon}>
				<circleGeometry args={[30, 14]} />
			</mesh>
			<mesh position={[-120, -1, -900]} material={m.mountain}>
				<shapeGeometry args={[useMemo(() => {
					const s = new THREE.Shape();
					s.moveTo(-700, 0);
					s.lineTo(-420, 200);
					s.lineTo(-260, 420);
					s.lineTo(240, 440);
					s.lineTo(340, 380);
					s.lineTo(520, 160);
					s.lineTo(800, 0);
					return s;
				}, [])]} />
			</mesh>
			<Floor p={[0, -0.2, 0]} w={1400} d={1400} m={m.ground} />
			<Floor p={[400, -0.15, 500]} w={900} d={500} m={m.sea} />
			{lights.map((l, i) => (
				<mesh key={i} position={[l.x, 0.6, l.z]} material={l.c ? m.city : m.city2}>
					<boxGeometry args={[2.2, 1.2, 2.2]} />
				</mesh>
			))}
			{/* the moat ring */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} material={m.moat}>
				<ringGeometry args={[R + 6, R + 24, 40, 2]} />
			</mesh>
			{/* curtain walls between the bastions */}
			{pts.map((p, i) => {
				const q = pts[(i + 1) % 5];
				const cx = (p[0] + q[0]) / 2, cz = (p[1] + q[1]) / 2;
				const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
				return <Box key={i} p={[cx, 5, cz]} s={[len, 10, 5]} m={m.stoneX} r={[0, -Math.atan2(q[1] - p[1], q[0] - p[0]), 0]} />;
			})}
			{/* the bastions, pointing outwards */}
			{pts.map((p, i) => (
				<mesh key={i} position={[p[0], 10, p[1]]} rotation={[-Math.PI / 2, 0, Math.atan2(p[1], p[0]) - Math.PI / 2]} material={m.stoneX}>
					<extrudeGeometry args={[bastion, {depth: 10, bevelEnabled: false}]} />
				</mesh>
			))}
			{/* the yard and the yellow building across it, with its windows; one lights by itself */}
			<Floor p={[0, 0.3, 0]} w={90} d={90} m={m.cobble} />
			<Box p={[0, 6, 0]} s={[70, 12, 8]} m={m.ochre} />
			<Box p={[0, 13, 0]} s={[70, 2, 9]} m={m.slate} />
			{Array.from({length: 12}, (_, i) => (
				<Box key={i} p={[-30 + i * 5.4, 7, 4.05]} s={[2, 3, 0.2]} m={win && i === 8 ? m.winLit : m.winDark} />
			))}
			{tp && (
				<mesh position={[tp[0], 10.8, tp[1]]} material={m.lampOn}>
					<boxGeometry args={[2.0, 1.2, 2.0]} />
				</mesh>
			)}
		</group>
	);
};

/** The woman in grey: a long grey dress, her hair up; run: phase (radians) of her stride. */
export const GreyLady: React.FC<{p: V3; ry: number; run: number; lean?: number}> = ({p, ry, run, lean = 0.18}) => {
	const m = useM();
	const sw = Math.sin(run);
	return (
		<group position={p} rotation={[0, ry, 0]}>
			<group rotation={[lean, 0, 0]}>
				{/* the skirt, swinging with her stride */}
				<mesh position={[0, 0.55, 0]} rotation={[sw * 0.12, 0, sw * 0.05]} material={m.grey}>
					<cylinderGeometry args={[0.2, 0.46, 1.1, 10]} />
				</mesh>
				<mesh position={[0, 1.22, 0]} material={m.greyD}>
					<cylinderGeometry args={[0.15, 0.19, 0.42, 8]} />
				</mesh>
				<Box p={[0, 1.42, 0]} s={[0.36, 0.08, 0.2]} m={m.grey} />
				<mesh position={[0, 1.6, 0.01]} scale={[0.85, 1.1, 0.9]} material={m.greyFace}>
					<icosahedronGeometry args={[0.1, 1]} />
				</mesh>
				{[-0.033, 0.033].map((x) => (
					<mesh key={x} position={[x, 1.62, 0.085]} material={m.socket}>
						<boxGeometry args={[0.03, 0.022, 0.02]} />
					</mesh>
				))}
				<mesh position={[0, 1.66, -0.05]} material={m.hair}>
					<sphereGeometry args={[0.1, 8, 6]} />
				</mesh>
				<mesh position={[0, 1.7, -0.13]} material={m.hair}>
					<sphereGeometry args={[0.055, 6, 5]} />
				</mesh>
				{[-1, 1].map((sd) => (
					<group key={sd} position={[sd * 0.2, 1.38, 0]} rotation={[sd * sw * 0.9, 0, sd * 0.12]}>
						<Box p={[0, -0.28, 0]} s={[0.08, 0.56, 0.08]} m={m.greyD} />
						<Box p={[0, -0.6, 0]} s={[0.05, 0.09, 0.04]} m={m.greyFace} />
					</group>
				))}
			</group>
		</group>
	);
};

/** A tall man in a long dark coat; lean: 0 upright .. 1 bent over the parapet; head: yaw of his head. */
export const TallMan: React.FC<{p: V3; ry: number; lean: number; head: number}> = ({p, ry, lean, head}) => {
	const m = useM();
	return (
		<group position={p} rotation={[0, ry, 0]}>
			{[-0.11, 0.11].map((x) => (
				<Box key={x} p={[x, 0.5, 0]} s={[0.16, 1.0, 0.18]} m={m.coat} />
			))}
			<group position={[0, 1.0, 0]} rotation={[lean * 0.95, 0, 0]}>
				<Box p={[0, 0.5, 0]} s={[0.5, 1.0, 0.28]} m={m.coat} />
				<Box p={[0, 0.25, 0]} s={[0.56, 0.5, 0.32]} m={m.coatL} />
				<group position={[0, 1.15, 0]} rotation={[-lean * 0.5, head, 0]}>
					<mesh scale={[0.85, 1.15, 0.9]} material={m.skin}>
						<icosahedronGeometry args={[0.12, 1]} />
					</mesh>
					{[-0.04, 0.04].map((x) => (
						<mesh key={x} position={[x, 0.02, 0.1]} material={m.socket}>
							<boxGeometry args={[0.035, 0.03, 0.02]} />
						</mesh>
					))}
				</group>
				{[-1, 1].map((sd) => (
					<group key={sd} position={[sd * 0.3, 0.95, 0]} rotation={[-lean * 0.4, 0, sd * 0.06]}>
						<Box p={[0, -0.4, 0]} s={[0.12, 0.8, 0.12]} m={m.coat} />
					</group>
				))}
			</group>
		</group>
	);
};

// ------------------------------------------------------------------ the radio (its own small canvas)
// A 5x7 pixel font for the radio's LCD.
const FONT: Record<string, string> = {
	A: '01110100011000111111100011000110001', B: '11110100011000111110100011000111110', C: '01110100011000010000100001000101110',
	D: '11110100011000110001100011000111110', E: '11111100001000011110100001000011111', F: '11111100001000011110100001000010000',
	G: '01110100011000010111100011000101111', H: '10001100011000111111100011000110001', I: '01110001000010000100001000010001110',
	J: '00111000100001000010000101001001100', K: '10001100101010011000101001001010001', L: '10000100001000010000100001000011111',
	M: '10001110111010110101100011000110001', N: '10001110011010110011100011000110001', O: '01110100011000110001100011000101110',
	P: '11110100011000111110100001000010000', Q: '01110100011000110001101011001001101', R: '11110100011000111110101001001010001',
	S: '01111100001000001110000010000111110', T: '11111001000010000100001000010000100', U: '10001100011000110001100011000101110',
	V: '10001100011000110001100010101000100', W: '10001100011000110101101011010101010', X: '10001100010101000100010101000110001',
	Y: '10001100010101000100001000010000100', Z: '11111000010001000100010001000011111',
	'0': '01110100011001110101110011000101110', '1': '00100011000010000100001000010001110', '2': '01110100010000100010001000100011111',
	'3': '11111000100010000010000011000101110', '4': '00010001100101010010111110001000010', '5': '11111100001111000001000011000101110',
	'6': '00110010001000011110100011000101110', '7': '11111000010001000100010000100001000', '8': '01110100011000101110100011000101110',
	'9': '01110100011000101111000010001001100', ':': '00000011000110000000011000110000000', '?': '01110100010000100010001000000000100',
	'.': '00000000000000000000000000110001100', ',': '00000000000000000000001100010001000', '-': '00000000000000011111000000000000000',
	' ': '00000000000000000000000000000000000',
};
export const LCD_W = 88;
export const LCD_H = 56;
/** Draw lines of text on the LCD canvas (LCD_W x LCD_H), each glyph 5x7 with 1 px spacing. */
export const drawLcd = (g: CanvasRenderingContext2D, lines: string[], glow: number, invert: number[] = []) => {
	const bg = Math.round(14 + 40 * glow);
	g.fillStyle = `rgb(${Math.round(bg * 0.5)},${bg + 12},${Math.round(bg * 0.6)})`;
	g.fillRect(0, 0, LCD_W, LCD_H);
	lines.forEach((ln, row) => {
		const y0 = 3 + row * 9;
		const inv = invert.includes(row);
		if (inv) {
			g.fillStyle = `rgb(10,${Math.round(30 + 200 * glow)},40)`;
			g.fillRect(1, y0 - 1, LCD_W - 2, 9);
		}
		g.fillStyle = inv ? `rgb(4,${bg},10)` : `rgb(${Math.round(40 + 150 * glow)},${Math.round(80 + 175 * glow)},${Math.round(60 + 120 * glow)})`;
		for (let i = 0; i < ln.length && i < 14; i++) {
			const f = FONT[ln[i].toUpperCase()] ?? FONT[' '];
			for (let k = 0; k < 35; k++) if (f[k] === '1') g.fillRect(3 + i * 6 + (k % 5), y0 + Math.floor(k / 5), 1, 1);
		}
	});
};

/** The handheld radio in the guard's gloved hand, origin at the radio's centre, LCD facing +z. */
export const Radio: React.FC<{lcd: THREE.Texture}> = ({lcd}) => {
	const mats = useMemo(() => ({
		body: lam('#18191b'),
		edge: lam('#26282a'),
		key: lam('#3a3c3e'),
		glove: lam('#101010'),
		sleeve: lam('#1a1c22'),
		lcd: ps1(new THREE.MeshBasicMaterial({map: lcd}), 64, SNAP6),
	}), [lcd]);
	return (
		<group>
			<Box p={[0, 0, 0]} s={[0.075, 0.16, 0.035]} m={mats.body} />
			<Box p={[0, 0.082, 0]} s={[0.079, 0.006, 0.037]} m={mats.edge} />
			<mesh position={[0.024, 0.15, -0.004]} material={mats.body}>
				<cylinderGeometry args={[0.005, 0.007, 0.15, 6]} />
			</mesh>
			<mesh position={[-0.02, 0.092, 0]} material={mats.key}>
				<cylinderGeometry args={[0.008, 0.008, 0.016, 8]} />
			</mesh>
			<mesh position={[0, 0.038, 0.0181]} material={mats.lcd}>
				<planeGeometry args={[0.064, 0.0407]} />
			</mesh>
			{Array.from({length: 6}, (_, i) => (
				<Box key={i} p={[-0.02 + (i % 3) * 0.02, -0.01 - Math.floor(i / 3) * 0.016, 0.019]} s={[0.014, 0.01, 0.004]} m={mats.key} />
			))}
			{/* the speaker grille */}
			{Array.from({length: 4}, (_, i) => (
				<Box key={`g${i}`} p={[0, -0.05 - i * 0.008, 0.0182]} s={[0.05, 0.003, 0.002]} m={mats.edge} />
			))}
			{/* the gloved hand around it from below and the right; the sleeve */}
			<Box p={[0.03, -0.055, 0.005]} s={[0.03, 0.08, 0.05]} m={mats.glove} />
			{[0, 1, 2, 3].map((i) => (
				<Box key={`f${i}`} p={[-0.012 + 0.0, -0.035 - i * 0.02, 0.024]} s={[0.07, 0.016, 0.016]} m={mats.glove} r={[0, 0, 0.05]} />
			))}
			<Box p={[0.03, -0.04, -0.03]} s={[0.05, 0.1, 0.03]} m={mats.glove} />
			<Box p={[0.05, -0.17, -0.04]} s={[0.07, 0.16, 0.07]} m={mats.sleeve} r={[0.3, 0, -0.25]} />
		</group>
	);
};

/** The grey hand: long grey fingers that curl over the top of the radio from behind it. reach: 0..1. */
export const GreyHand: React.FC<{reach: number}> = ({reach}) => {
	const mats = useMemo(() => ({skin: lam('#7e807a'), sleeve: lam('#4a4c48')}), []);
	const k = reach * reach * (3 - 2 * reach);
	const curl = Math.min(1, k * 1.3);
	return (
		<group position={[0, 0.05 * (1 - k), -0.025 * (1 - k)]}>
			<Box p={[-0.006, 0.112, -0.03]} s={[0.064, 0.05, 0.02]} m={mats.skin} r={[-0.5, 0, 0.1]} />
			<Box p={[-0.02, 0.17, -0.07]} s={[0.07, 0.1, 0.05]} m={mats.sleeve} r={[-0.7, 0, 0.25]} />
			{[0, 1, 2, 3].map((i) => (
				<group key={i} position={[-0.03 + i * 0.016, 0.089, -0.012]} rotation={[-1.3 * (1 - curl), 0, 0]}>
					<Box p={[0, 0, 0.016]} s={[0.009, 0.007, 0.034 - Math.abs(i - 1.5) * 0.004]} m={mats.skin} />
					<group position={[0, 0, 0.032]} rotation={[1.45 * curl, 0, 0]}>
						<Box p={[0, 0, 0.012]} s={[0.008, 0.006, 0.026]} m={mats.skin} />
					</group>
				</group>
			))}
		</group>
	);
};

export const flicker01 = (t: number, seed: number) => {
	const r = rng(seed * 7919 + Math.floor(t * 12) * 104729);
	r();
	return r() < 0.3 ? 0.1 : 1;
};
