// Episode 35 world: "Bantay" (Season 4, Visayan folklore: the amalanhig, and the lamay, the all-night
// wake). A composite provincial house, no real family or parlour:
// - THE WAKE (origin): a tiled front room under a fluorescent tube; the coffin at the back on its
//   stand (a glass window over the face at the head end), two tall candle stands, flowers; rows of
//   white plastic chairs; a card table; the wall clock; the mirror on the side wall, covered with a
//   white cloth as custom asks; the front door and the yard;
// - THE MIRROR'S WORLD: the mirror is an opening in the wall onto a mirrored copy of the coffin set
//   behind it, so when the cloth slides, the reflection can disagree with the room (its lid is open);
// - THE BODY: an old man in a barong and dark trousers, stiff, arms at his sides, a grey face in
//   shadow (no decay, no wound); it can lie, stand, and move only in straight lines.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1, rng} from '../ps1';
import {SNAP6} from '../ep01/world';

export type V3 = [number, number, number];
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
const seg = (v: number) => Math.min(40, Math.max(1, Math.ceil(v / 0.3)));
export const Box: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={[s[0], s[1], s[2], seg(s[0]), seg(s[1]), seg(s[2])]} />
	</mesh>
);
const Cyl: React.FC<{p: V3; r0: number; r1?: number; h: number; m: THREE.Material; rot?: V3; n?: number}> = ({p, r0, r1, h, m, rot, n = 8}) => (
	<mesh position={p} rotation={rot} material={m}>
		<cylinderGeometry args={[r1 ?? r0, r0, h, n, Math.max(1, Math.ceil(h / 0.3))]} />
	</mesh>
);

export const useMats = () =>
	useMemo(() => {
		const tile = tex(16, 16, (g) => {
			for (let y = 0; y < 16; y += 8)
				for (let x = 0; x < 16; x += 8) {
					g.fillStyle = (x + y) % 16 ? '#b8b0a0' : '#8a8478';
					g.fillRect(x, y, 8, 8);
				}
			g.fillStyle = '#6a645a';
			g.fillRect(0, 0, 16, 1);
			g.fillRect(0, 0, 1, 16);
		}, [10, 10]);
		const paint = tex(16, 16, (g) => {
			g.fillStyle = '#9aa894';
			g.fillRect(0, 0, 16, 16);
			const r = rng(35);
			for (let i = 0; i < 18; i++) {
				g.fillStyle = r() < 0.5 ? '#8a9884' : '#a8b6a2';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 2, 1);
			}
		}, [4, 2]);
		return {
			tile: lam('#ffffff', {map: tile}),
			paint: lam('#ffffff', {map: paint}),
			coffin: lam('#d8d4cc'),
			coffinTrim: lam('#8a7a50'),
			lining: lam('#e8e0e8'),
			glass: bas('#c8d4dc', {transparent: true, opacity: 0.25, depthWrite: false}),
			stand: lam('#3a3030'),
			candle: lam('#e8e4d8'),
			flame: bas('#ffd890'),
			flower: lam('#e8e8f0'),
			flower2: lam('#c84a5a'),
			leaf: lam('#3a5a3a'),
			chair: lam('#e8e8e4'),
			table: lam('#6a4a30'),
			card: lam('#e8e4dc'),
			tube: bas('#f0f8ff'),
			cloth: lam('#f0f0ec', {side: THREE.DoubleSide}),
			frame: lam('#4a3624'),
			clockFace: lam('#e8e0d0'),
			ink: lam('#141414'),
			barong: lam('#d8d0b8'),
			trousers: lam('#1e1e22'),
			deadSkin: lam('#8a8478'),
			deadDark: lam('#2a2826'),
			hair: lam('#3a3a3a'),
			door: lam('#5a3e28'),
			night: bas('#0a0e18'),
			dawn: bas('#d8c0a0'),
			mud: bas('#3a2a1a'),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
export const MatsContext = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(MatsContext)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <MatsContext.Provider value={useMats()}>{children}</MatsContext.Provider>;

export const COFFIN: V3 = [0, 0, -2.6]; // centre, on its stand; head end at -x
export const GLASS: V3 = [-0.55, 0.98, -2.6];
export const MIRROR: V3 = [-3.0, 1.5, -0.6]; // on the left wall, facing +x
export const CLOCK: V3 = [1.2, 2.2, -3.45];
export const DOOR: V3 = [1.2, 0, 3.5];

// ------------------------------------------------------------------ the coffin
export const Coffin: React.FC<{p: V3; lid: number; body: boolean; fog?: React.ReactNode}> = ({p, lid, body, fog}) => {
	const M = useM();
	return (
		<group position={p}>
			{/* the stand */}
			{[-0.8, 0.8].map((x) => (
				<Box key={x} p={[x, 0.3, 0]} s={[0.08, 0.6, 0.6]} m={M.stand} />
			))}
			<Box p={[0, 0.62, 0]} s={[2.1, 0.04, 0.7]} m={M.stand} />
			{/* the box */}
			<Box p={[0, 0.8, 0]} s={[2.0, 0.32, 0.62]} m={M.coffin} />
			<Box p={[0, 0.64, 0]} s={[2.04, 0.04, 0.66]} m={M.coffinTrim} />
			<Box p={[0, 0.79, 0]} s={[1.9, 0.3, 0.52]} m={M.lining} />
			{body && (
				<group position={[0, 0.85, 0]}>
					<Box p={[0.15, 0, 0]} s={[1.3, 0.14, 0.34]} m={M.barong} />
					<mesh position={[-0.6, 0.04, 0]} scale={[1.2, 0.9, 1]} material={M.deadSkin}>
						<sphereGeometry args={[0.1, 8, 6]} />
					</mesh>
				</group>
			)}
			{/* the lid swings up on its long hinge (the far side) */}
			<group position={[0, 0.96, -0.31]} rotation={[-lid * 1.6, 0, 0]}>
				<Box p={[0.45, 0.03, 0.31]} s={[1.1, 0.06, 0.62]} m={M.coffin} />
				{/* the head panel, with its glass window over the face */}
				<group position={[-0.5, 0.03, 0.31]}>
					<Box p={[0, 0, 0.22]} s={[0.9, 0.06, 0.18]} m={M.coffin} />
					<Box p={[0, 0, -0.22]} s={[0.9, 0.06, 0.18]} m={M.coffin} />
					<Box p={[0.37, 0, 0]} s={[0.16, 0.06, 0.26]} m={M.coffin} />
					<Box p={[-0.37, 0, 0]} s={[0.16, 0.06, 0.26]} m={M.coffin} />
					<mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.glass}>
						<planeGeometry args={[0.58, 0.26]} />
					</mesh>
					{fog}
				</group>
			</group>
		</group>
	);
};

export const CandleStand: React.FC<{p: V3; t: number; lean?: number; lit?: boolean}> = ({p, t, lean = 0, lit = true}) => {
	const M = useM();
	return (
		<group position={p}>
			<Cyl p={[0, 0.6, 0]} r0={0.04} h={1.2} m={M.stand} />
			<Cyl p={[0, 0.02, 0]} r0={0.18} h={0.04} m={M.stand} />
			<Cyl p={[0, 1.32, 0]} r0={0.035} h={0.22} m={M.candle} />
			{lit && (
				<mesh position={[0.02 * lean, 1.47, 0]} rotation={[0, 0, -lean * 0.7]} material={M.flame}>
					<coneGeometry args={[0.02, 0.07 + 0.01 * Math.sin(t * 17), 5]} />
				</mesh>
			)}
		</group>
	);
};

export const Chair: React.FC<{p: V3; ry?: number; fall?: number}> = ({p, ry = 0, fall = 0}) => {
	const M = useM();
	return (
		<group position={[p[0], p[1], p[2]]} rotation={[0, ry + fall * 1.3, fall * 1.4]}>
			<Box p={[0, 0.42, 0]} s={[0.42, 0.04, 0.4]} m={M.chair} />
			<Box p={[0, 0.7, -0.18]} s={[0.42, 0.5, 0.04]} m={M.chair} />
			{[[-0.18, -0.17], [0.18, -0.17], [-0.18, 0.17], [0.18, 0.17]].map(([x, z], i) => (
				<Box key={i} p={[x, 0.2, z]} s={[0.04, 0.42, 0.04]} m={M.chair} />
			))}
		</group>
	);
};

// ------------------------------------------------------------------ the body, standing (stiff)
export const Body: React.FC<{p: V3; ry: number; lean?: number; t: number; gait?: number}> = ({p, ry, lean = 0, t, gait = 0}) => {
	const M = useM();
	// it cannot bend: the whole body rocks side to side as it moves, legs straight
	const rock = gait * 0.12 * Math.sin(t * 9);
	return (
		<group position={p} rotation={[lean, ry, rock]}>
			{[-0.1, 0.1].map((x) => (
				<Box key={x} p={[x, 0.45, 0]} s={[0.14, 0.9, 0.14]} m={M.trousers} />
			))}
			<Box p={[0, 1.2, 0]} s={[0.44, 0.62, 0.24]} m={M.barong} />
			{[-1, 1].map((k) => (
				<group key={k}>
					<Box p={[k * 0.27, 1.17, 0]} s={[0.09, 0.62, 0.1]} m={M.barong} />
					<Box p={[k * 0.27, 0.8, 0]} s={[0.07, 0.14, 0.08]} m={M.deadSkin} />
				</group>
			))}
			<group position={[0, 1.66, 0]}>
				<mesh scale={[0.9, 1.1, 0.95]} material={M.deadSkin}>
					<sphereGeometry args={[0.13, 8, 6]} />
				</mesh>
				<mesh position={[0, 0.07, -0.02]} scale={[1, 0.5, 1]} material={M.hair}>
					<sphereGeometry args={[0.13, 8, 5]} />
				</mesh>
				{/* sunken eyes in shadow, a closed mouth */}
				{[-0.045, 0.045].map((x) => (
					<Box key={x} p={[x, 0.02, 0.115]} s={[0.05, 0.03, 0.01]} m={M.deadDark} />
				))}
				<Box p={[0, -0.07, 0.115]} s={[0.06, 0.01, 0.01]} m={M.deadDark} />
			</group>
		</group>
	);
};

// ------------------------------------------------------------------ the room
export const WakeRoom: React.FC<{t: number; dawn: number; cloth: number; mirrorLid: number; minute: number; hour: number; candleLean: number; candlesLit: boolean; chairsFall?: number[]; mud?: number; lid: number; bodyIn: boolean; fog?: React.ReactNode; ceiling?: boolean}> = ({t, dawn, cloth, mirrorLid, minute, hour, candleLean, candlesLit, chairsFall = [], mud = 0, lid, bodyIn, fog, ceiling = true}) => {
	const M = useM();
	const chairs: [number, number, number][] = [];
	for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) chairs.push([-1.5 + c * 1.0, 0, -0.7 + r * 1.1]);
	return (
		<group>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={M.tile}>
				<planeGeometry args={[6, 7.4, 20, 24]} />
			</mesh>
			{/* walls: the left wall has an opening for the mirror */}
			<Box p={[0, 1.5, -3.55]} s={[6, 3, 0.1]} m={M.paint} />
			<Box p={[3.05, 1.5, 0]} s={[0.1, 3, 7.4]} m={M.paint} />
			<Box p={[-3.05, 1.5, -2.35]} s={[0.1, 3, 2.7]} m={M.paint} />
			<Box p={[-3.05, 1.5, 1.85]} s={[0.1, 3, 3.7]} m={M.paint} />
			<Box p={[-3.05, 0.5, -0.6]} s={[0.1, 1.0, 0.8]} m={M.paint} />
			<Box p={[-3.05, 2.5, -0.6]} s={[0.1, 1.0, 0.8]} m={M.paint} />
			{ceiling && <Box p={[0, 3.0, 0]} s={[6, 0.08, 7.4]} m={M.paint} />}
			{/* the front wall with the door */}
			<Box p={[-1.0, 1.5, 3.7]} s={[4, 3, 0.1]} m={M.paint} />
			<Box p={[2.55, 1.5, 3.7]} s={[1.0, 3, 0.1]} m={M.paint} />
			<Box p={[1.4, 2.6, 3.7]} s={[1.3, 0.8, 0.1]} m={M.paint} />
			<mesh position={[1.4, 1.1, 3.9]} material={dawn > 0.5 ? M.dawn : M.night}>
				<planeGeometry args={[1.3, 2.2]} />
			</mesh>
			{/* the fluorescent tube */}
			{ceiling && <Box p={[0, 2.95, -0.5]} s={[1.2, 0.05, 0.08]} m={M.tube} />}
			{/* the mirror frame and the cloth over it */}
			<group position={MIRROR}>
				<Box p={[0.02, 0.43, 0]} s={[0.06, 0.06, 0.86]} m={M.frame} />
				<Box p={[0.02, -0.43, 0]} s={[0.06, 0.06, 0.86]} m={M.frame} />
				<Box p={[0.02, 0, 0.43]} s={[0.06, 0.86, 0.06]} m={M.frame} />
				<Box p={[0.02, 0, -0.43]} s={[0.06, 0.86, 0.06]} m={M.frame} />
				<mesh position={[0.08, -cloth * 1.05, 0]} rotation={[0, Math.PI / 2, cloth * 0.15]} material={M.cloth}>
					<planeGeometry args={[0.95, 0.95, 3, 3]} />
				</mesh>
			</group>
			{/* the mirror's world: the coffin and candles, reflected, behind the wall; its lid can be open */}
			<group position={[-6.1, 0, 0]} scale={[-1, 1, 1]}>
				<Coffin p={COFFIN} lid={mirrorLid} body={mirrorLid < 0.5} />
				<CandleStand p={[COFFIN[0] - 1.25, 0, COFFIN[2]]} t={t} lit={candlesLit} />
				<CandleStand p={[COFFIN[0] + 1.25, 0, COFFIN[2]]} t={t} lit={candlesLit} />
				<mesh rotation={[-Math.PI / 2, 0, 0]} material={M.tile}>
					<planeGeometry args={[6, 7.4, 20, 24]} />
				</mesh>
				<Box p={[0, 1.5, -3.55]} s={[6, 3, 0.1]} m={M.paint} />
				<Box p={[0, 3.0, 0]} s={[6, 0.08, 7.4]} m={M.paint} />
				<pointLight position={[COFFIN[0], 2.0, COFFIN[2] + 1.0]} intensity={2.4} distance={5} decay={1} color="#d8e0ff" />
			</group>
			{/* the clock */}
			<group position={CLOCK}>
				<Cyl p={[0, 0, 0.02]} r0={0.18} h={0.03} m={M.clockFace} rot={[Math.PI / 2, 0, 0]} n={14} />
				<group position={[0, 0, 0.04]} rotation={[0, 0, -((hour + minute / 60) / 12) * Math.PI * 2]}>
					<Box p={[0, 0.045, 0]} s={[0.014, 0.09, 0.005]} m={M.ink} />
				</group>
				<group position={[0, 0, 0.045]} rotation={[0, 0, -(minute / 60) * Math.PI * 2]}>
					<Box p={[0, 0.065, 0]} s={[0.009, 0.13, 0.005]} m={M.ink} />
				</group>
			</group>
			{/* the coffin, the candles and the flowers */}
			<Coffin p={COFFIN} lid={lid} body={bodyIn} fog={fog} />
			<CandleStand p={[COFFIN[0] - 1.25, 0, COFFIN[2]]} t={t} lean={candleLean} lit={candlesLit} />
			<CandleStand p={[COFFIN[0] + 1.25, 0, COFFIN[2]]} t={t} lean={candleLean} lit={candlesLit} />
			{[[-0.6, -3.3], [0.6, -3.3]].map(([x, z], i) => (
				<group key={i} position={[x, 0, z]}>
					<Cyl p={[0, 0.5, 0]} r0={0.06} h={1.0} m={M.stand} />
					{Array.from({length: 7}, (_, k) => (
						<mesh key={k} position={[Math.cos(k * 0.9) * 0.18, 1.05 + 0.08 * Math.sin(k * 2.1), Math.sin(k * 0.9) * 0.1]} material={k % 3 ? M.flower : M.flower2}>
							<sphereGeometry args={[0.07, 6, 4]} />
						</mesh>
					))}
				</group>
			))}
			{/* the card table */}
			<group position={[2.1, 0, 1.6]}>
				<Box p={[0, 0.72, 0]} s={[0.9, 0.04, 0.9]} m={M.table} />
				{[[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].map(([x, z], i) => (
					<Box key={i} p={[x, 0.36, z]} s={[0.05, 0.72, 0.05]} m={M.table} />
				))}
				{[0, 1, 2, 3, 4].map((k) => (
					<Box key={k} p={[-0.2 + k * 0.1, 0.745, 0.05 * Math.sin(k)]} s={[0.06, 0.005, 0.09]} m={M.card} r={[0, k * 0.4, 0]} />
				))}
			</group>
			{/* rows of chairs; some fall over in the chase */}
			{chairs.map((c, i) => (
				<Chair key={i} p={c} ry={Math.PI} fall={chairsFall[i] ?? 0} />
			))}
			{/* at dawn: a straight line of mud from the door to the coffin */}
			{mud > 0 &&
				Array.from({length: Math.round(14 * mud)}, (_, i) => (
					<mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0.45 + (i % 2 ? 0.1 : -0.1), 0.006, 3.2 - i * 0.42]} material={M.mud}>
						<circleGeometry args={[0.07, 6]} />
					</mesh>
				))}
		</group>
	);
};
