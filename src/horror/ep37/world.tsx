// Episode 37 world: "Pitong Biyernes" (Season 4, Siquijor folk belief: the barang, and the island's
// healers). Composites; no real healer, family or barangay:
// - THE TABLE: a bamboo tube with a cork on a grained wooden table under a kerosene lamp, a folded
//   paper with an unreadable name, a candle stub (all at real scale; the camera is insect-sized);
// - THE BEETLE: original, about 3.5 cm: glossy elytra that open, membranous wings that beat, six legs
//   in a tripod gait, antennae;
// - THE ISLAND AT DUSK: the sea, hills, palms, a church tower whose bell hangs still (Good Friday);
// - THE ROAD: a dirt road at knee height between stilt houses and a bamboo fence, to a door with a gap
//   under it;
// - THE ROOM: a banig on the floor, the sleeping man's head, his forearm (a ripple under the skin, no
//   wound), a bottle of the healers' medicine;
// - THE MOUNTAIN: the healers' cauldron on three stones, the fire, smoke, herbs, at golden hour.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1, rng} from '../ps1';
import {SNAP6} from '../ep01/world';

export type V3 = [number, number, number];
const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 64, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 64, SNAP6);
export const tex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rep: [number, number] = [1, 1]) => {
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
const seg = (v: number, unit: number) => Math.min(24, Math.max(1, Math.ceil(v / unit)));
/** A box subdivided relative to `unit` (so small sets light as well as big ones). */
export const Box: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3; unit?: number}> = ({p, s, m, r, unit = 0.3}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={[s[0], s[1], s[2], seg(s[0], unit), seg(s[1], unit), seg(s[2], unit)]} />
	</mesh>
);
export const Cyl: React.FC<{p: V3; r0: number; r1?: number; h: number; m: THREE.Material; rot?: V3; n?: number; hs?: number}> = ({p, r0, r1, h, m, rot, n = 8, hs = 1}) => (
	<mesh position={p} rotation={rot} material={m}>
		<cylinderGeometry args={[r1 ?? r0, r0, h, n, hs]} />
	</mesh>
);
const Ball: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3; n?: number}> = ({p, s, m, r, n = 8}) => (
	<mesh position={p} rotation={r} scale={s} material={m}>
		<sphereGeometry args={[1, n, Math.max(4, n - 2)]} />
	</mesh>
);

export const useMats = () =>
	useMemo(() => {
		const grain = tex(16, 32, (g) => {
			g.fillStyle = '#6a4428';
			g.fillRect(0, 0, 16, 32);
			const r = rng(37);
			for (let i = 0; i < 26; i++) {
				g.fillStyle = r() < 0.5 ? '#5a381e' : '#7a5232';
				g.fillRect(Math.floor(r() * 16), 0, 1, 32);
			}
			for (let i = 0; i < 6; i++) {
				g.fillStyle = '#4a2c16';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 32), 2, 1);
			}
		}, [6, 3]);
		const bamboo = tex(16, 16, (g) => {
			g.fillStyle = '#a89058';
			g.fillRect(0, 0, 16, 16);
			const r = rng(371);
			for (let i = 0; i < 20; i++) {
				g.fillStyle = r() < 0.5 ? '#988048' : '#b8a068';
				g.fillRect(0, Math.floor(r() * 16), 16, 1);
			}
		}, [1, 4]);
		const banig = tex(16, 16, (g) => {
			for (let y = 0; y < 16; y += 2)
				for (let x = 0; x < 16; x += 2) {
					g.fillStyle = (x + y) % 4 ? '#b89a68' : '#8a3a3a';
					g.fillRect(x, y, 2, 2);
				}
		}, [6, 6]);
		const dirt = tex(16, 16, (g) => {
			g.fillStyle = '#6a5a44';
			g.fillRect(0, 0, 16, 16);
			const r = rng(372);
			for (let i = 0; i < 40; i++) {
				g.fillStyle = r() < 0.5 ? '#5a4a36' : '#7a6a52';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
			}
		}, [20, 60]);
		const sky = tex(4, 64, (g) => {
			const gr = g.createLinearGradient(0, 0, 0, 64);
			gr.addColorStop(0, '#1a1a3a');
			gr.addColorStop(0.45, '#6a3a5a');
			gr.addColorStop(0.7, '#d86a3a');
			gr.addColorStop(1, '#f0b060');
			g.fillStyle = gr;
			g.fillRect(0, 0, 4, 64);
		});
		const goldSky = tex(4, 64, (g) => {
			const gr = g.createLinearGradient(0, 0, 0, 64);
			gr.addColorStop(0, '#4a6a9a');
			gr.addColorStop(0.6, '#e8a860');
			gr.addColorStop(1, '#f8d890');
			g.fillStyle = gr;
			g.fillRect(0, 0, 4, 64);
		});
		const paper = tex(16, 16, (g) => {
			g.fillStyle = '#d8ccb0';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#3a2a20';
			// a name, unreadable: a scribble
			for (let x = 2; x < 14; x++) g.fillRect(x, 7 + Math.round(Math.sin(x * 1.7) * 1.2), 1, 1);
		});
		return {
			table: lam('#ffffff', {map: grain}),
			bamboo: lam('#ffffff', {map: bamboo}),
			node: lam('#7a6838'),
			cork: lam('#8a6a40'),
			paper: lam('#ffffff', {map: paper, side: THREE.DoubleSide}),
			candle: lam('#d8d0b8'),
			flame: bas('#ffd890'),
			lampGlass: bas('#ffe8b0', {transparent: true, opacity: 0.7}),
			lampBase: lam('#3a4a3a'),
			shell: lam('#16120e'),
			shellHi: lam('#3a2e22'),
			leg: lam('#0e0c0a'),
			wing: bas('#b8a078', {transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false}),
			sea: lam('#2a3a5a'),
			hill: lam('#2a3424'),
			palm: lam('#1a2418'),
			trunk: lam('#3a2e22'),
			stone: lam('#c8beb0'),
			bell: lam('#6a5a3a'),
			sky: bas('#ffffff', {map: sky, side: THREE.BackSide, fog: false}),
			goldSky: bas('#ffffff', {map: goldSky, side: THREE.BackSide, fog: false}),
			dirt: lam('#ffffff', {map: dirt}),
			wall: lam('#8a7a5a'),
			nipa: lam('#6a5a3a'),
			door: lam('#5a3e28'),
			gap: bas('#ffd890'),
			banig: lam('#ffffff', {map: banig}),
			floor: lam('#5a4630'),
			skin: lam('#a87a58'),
			skinDark: lam('#7a5440'),
			hair: lam('#141210'),
			shirt: lam('#c8c0a8'),
			sheet: lam('#8a8a9a'),
			bottle: bas('#6a8a5a', {transparent: true, opacity: 0.75}),
			potion: lam('#3a2a14'),
			cauldron: lam('#2a2624'),
			rock: lam('#5a5650'),
			fire: bas('#ff9a40', {transparent: true, opacity: 0.85, depthWrite: false}),
			fire2: bas('#ffe08a', {transparent: true, opacity: 0.9, depthWrite: false}),
			smoke: lam('#b8b0a8', {transparent: true, opacity: 0.35, depthWrite: false}),
			herb: lam('#3a5a2a'),
			herb2: lam('#5a7a3a'),
			healer: lam('#d8d4c8'),
			ladle: lam('#6a4a2a'),
			grass: lam('#4a5a2a'),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
export const MatsContext = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(MatsContext)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <MatsContext.Provider value={useMats()}>{children}</MatsContext.Provider>;

// ------------------------------------------------------------------ the beetle (original), facing +z
/** walk: gait phase (cycles); open: elytra 0..1; fly: wing beat on/off; flip: lying on its back,
 *  legs paddling; size ≈ 3.5 cm long. */
export const Beetle: React.FC<{t: number; walk?: number; open?: number; fly?: number; flip?: boolean; ant?: number; position?: V3; rotation?: V3; scale?: number}> = ({t, walk = 0, open = 0, fly = 0, flip = false, ant = 0, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1}) => {
	const M = useM();
	const legs: [number, number, number][] = [[1, 0.009, 0.3], [1, 0.0, 0], [1, -0.01, -0.35], [-1, 0.009, 0.3], [-1, 0.0, 0], [-1, -0.01, -0.35]];
	const beat = fly ? Math.sin(t * 90) : 0;
	return (
		<group position={position} rotation={rotation} scale={scale}>
			<group rotation={flip ? [0, 0, Math.PI] : [0, 0, 0]} position={[0, flip ? 0.016 : 0.008, 0]}>
				{/* abdomen under the shell; pronotum; head; eyes; antennae */}
				<Ball p={[0, 0.002, -0.004]} s={[0.011, 0.006, 0.016]} m={M.leg} />
				<Ball p={[0, 0.004, 0.014]} s={[0.01, 0.006, 0.007]} m={M.shell} />
				<Ball p={[0, 0.003, 0.023]} s={[0.006, 0.004, 0.005]} m={M.shell} />
				{[-1, 1].map((s) => (
					<React.Fragment key={s}>
						<Ball p={[s * 0.004, 0.004, 0.026]} s={[0.0018, 0.0018, 0.0018]} m={M.shellHi} n={5} />
						<group position={[s * 0.003, 0.005, 0.027]} rotation={[-0.4 + 0.15 * Math.sin(t * 3 + s), s * (0.5 + 0.2 * ant * Math.sin(t * 7 + s)), 0]}>
							<Box p={[0, 0, 0.006]} s={[0.0008, 0.0008, 0.012]} m={M.leg} unit={1} />
							<Box p={[0, 0.0015, 0.0125]} s={[0.0016, 0.003, 0.0016]} m={M.leg} unit={1} />
						</group>
					</React.Fragment>
				))}
				{/* the elytra: two shells hinged at the front; they lift and spread */}
				{[-1, 1].map((s) => (
					<group key={s} position={[s * 0.0005, 0.006, 0.009]} rotation={[-0.5 * open, s * 0.25 * open, s * 0.9 * open]}>
						<Ball p={[s * 0.0055, 0.0, -0.012]} s={[0.0058, 0.0045, 0.0135]} m={M.shell} />
						<Ball p={[s * 0.0045, 0.002, -0.009]} s={[0.002, 0.001, 0.006]} m={M.shellHi} n={5} />
					</group>
				))}
				{/* the wings, folded under, unfold and beat */}
				{open > 0.3 &&
					[-1, 1].map((s) => (
						<group key={s} position={[0, 0.007, 0.006]} rotation={[0, 0, s * (0.3 + 0.6 * beat)]}>
							<mesh position={[s * 0.016 * open, 0, -0.012]} rotation={[-Math.PI / 2, 0, s * 0.2]} material={M.wing}>
								<planeGeometry args={[0.03 * open, 0.018]} />
							</mesh>
						</group>
					))}
				{/* six legs, tripod gait */}
				{legs.map(([s, z, ang], i) => {
					const ph = walk * Math.PI * 2 + (i % 2 === (s > 0 ? 0 : 1) ? 0 : Math.PI);
					const swing = flip ? Math.sin(t * 14 + i) * 0.6 : Math.sin(ph) * 0.35;
					const lift = flip ? 0 : Math.max(0, Math.cos(ph)) * 0.3;
					return (
						<group key={i} position={[s * 0.007, 0.002, z]} rotation={[0, s * (ang + swing) + (s > 0 ? 0 : 0), s * (-0.5 - lift)]}>
							<Box p={[s * 0.006, 0, 0]} s={[0.012, 0.0014, 0.0014]} m={M.leg} unit={1} />
							<group position={[s * 0.012, 0, 0]} rotation={[0, 0, s * -1.0]}>
								<Box p={[s * 0.006, 0, 0]} s={[0.012, 0.0011, 0.0011]} m={M.leg} unit={1} />
							</group>
						</group>
					);
				})}
			</group>
		</group>
	);
};

// ------------------------------------------------------------------ the table and the tube
export const TUBE: V3 = [0, 0.78, 0]; // the tube's axis along z; its cork end at +z
export const TUBE_R = 0.022;
export const TUBE_L = 0.32;
export const Table: React.FC<{t: number; cork: number}> = ({t, cork}) => {
	const M = useM();
	const [x, y, z] = TUBE;
	const jig = cork > 0 ? Math.sin(t * 31) * 0.003 * cork : 0;
	return (
		<group>
			<Box p={[0, 0.74, 0]} s={[1.6, 0.04, 1.0]} m={M.table} unit={0.08} />
			{[[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]].map(([a, b]) => (
				<Box key={`${a}${b}`} p={[a, 0.36, b]} s={[0.06, 0.72, 0.06]} m={M.table} />
			))}
			{/* the tube lying on the table, its nodes, the cork */}
			<Cyl p={[x, y, z]} r0={TUBE_R} h={TUBE_L} m={M.bamboo} rot={[Math.PI / 2, 0, 0]} n={10} hs={8} />
			{[-0.1, 0.06].map((dz) => (
				<Cyl key={dz} p={[x, y, z + dz]} r0={TUBE_R + 0.002} h={0.008} m={M.node} rot={[Math.PI / 2, 0, 0]} n={10} />
			))}
			<group position={[x, y + 0.016 * cork + jig, z + TUBE_L / 2 + 0.008 + 0.014 * cork]} rotation={[0.6 * cork, 0, jig * 30]}>
				<Cyl p={[0, 0, 0]} r0={TUBE_R - 0.003} h={0.03} m={M.cork} rot={[Math.PI / 2, 0, 0]} n={10} />
			</group>
			{/* the dark inside, seen when the cork lifts */}
			<mesh position={[x, y, z + TUBE_L / 2 + 0.001]} material={M.leg}>
				<circleGeometry args={[TUBE_R - 0.003, 10]} />
			</mesh>
			{/* the paper with a name; a candle stub */}
			<mesh position={[0.12, 0.761, 0.12]} rotation={[-Math.PI / 2, 0, 0.3]} material={M.paper}>
				<planeGeometry args={[0.1, 0.07]} />
			</mesh>
			<Cyl p={[-0.16, 0.8, 0.1]} r0={0.018} h={0.08} m={M.candle} n={8} />
			<mesh position={[-0.16, 0.855, 0.1]} scale={[1, 1 + 0.15 * Math.sin(t * 13), 1]} material={M.flame}>
				<coneGeometry args={[0.007, 0.03, 5]} />
			</mesh>
			{/* the kerosene lamp at the back */}
			<Cyl p={[0.25, 0.8, -0.25]} r0={0.05} r1={0.04} h={0.08} m={M.lampBase} n={8} />
			<Cyl p={[0.25, 0.9, -0.25]} r0={0.03} r1={0.04} h={0.12} m={M.lampGlass} n={8} />
		</group>
	);
};

// ------------------------------------------------------------------ the island at dusk (seen from a window sill)
export const Island: React.FC<{gold?: boolean}> = ({gold = false}) => {
	const M = useM();
	const palms = useMemo(() => {
		const r = rng(373);
		return Array.from({length: 14}, () => ({x: -30 + r() * 60, z: -20 - r() * 40, h: 5 + r() * 4, lean: (r() - 0.5) * 0.4}));
	}, []);
	return (
		<group>
			<mesh material={gold ? M.goldSky : M.sky}>
				<sphereGeometry args={[400, 12, 8]} />
			</mesh>
			<mesh position={[0, -0.5, -150]} rotation={[-Math.PI / 2, 0, 0]} material={M.sea}>
				<planeGeometry args={[800, 300, 8, 8]} />
			</mesh>
			{/* hills */}
			{[[-60, -120, 30], [20, -140, 40], [80, -110, 25]].map(([x, z, h], i) => (
				<mesh key={i} position={[x, h / 2 - 2, z]} scale={[h * 1.6, h, h]} material={M.hill}>
					<sphereGeometry args={[1, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2]} />
				</mesh>
			))}
			<mesh position={[0, -0.3, -30]} rotation={[-Math.PI / 2, 0, 0]} material={M.hill}>
				<planeGeometry args={[200, 60, 10, 6]} />
			</mesh>
			{palms.map((p, i) => (
				<group key={i} position={[p.x, 0, p.z]} rotation={[0, 0, p.lean]}>
					<Cyl p={[0, p.h / 2, 0]} r0={0.25} r1={0.15} h={p.h} m={M.trunk} n={5} />
					{[0, 1, 2, 3, 4].map((k) => (
						<Box key={k} p={[Math.cos(k * 1.26) * 1.2, p.h, Math.sin(k * 1.26) * 1.2]} s={[2.6, 0.1, 0.6]} r={[0, -k * 1.26, -0.4]} m={M.palm} />
					))}
				</group>
			))}
			{/* the church: a stone tower, its bell hanging still */}
			<group position={[6, 0, -45]}>
				<Box p={[0, 6, 0]} s={[4, 12, 4]} m={M.stone} unit={2} />
				<Box p={[-5, 3.5, 0]} s={[7, 7, 8]} m={M.stone} unit={2} />
				<Box p={[0, 12.5, 0]} s={[4.4, 0.6, 4.4]} m={M.stone} unit={2} />
				<Box p={[0, 10.2, 2.01]} s={[1.6, 2.2, 0.05]} m={M.leg} unit={2} />
				<mesh position={[0, 10.1, 1.5]} material={M.bell}>
					<cylinderGeometry args={[0.35, 0.65, 1.0, 8]} />
				</mesh>
				<mesh position={[0, 14.5, 0]} material={M.stone}>
					<coneGeometry args={[2.6, 3.5, 4]} />
				</mesh>
			</group>
		</group>
	);
};

// ------------------------------------------------------------------ the road at knee height (runs along −z)
export const DOOR_Z = -24;
export const Road: React.FC = () => {
	const M = useM();
	const houses = useMemo(() => {
		const r = rng(374);
		return Array.from({length: 8}, (_, i) => ({side: i % 2 ? 1 : -1, z: 4 - i * 3.6 - r() * 1.2, w: 3 + r() * 1.5, h: 2.6 + r() * 0.8}));
	}, []);
	return (
		<group>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]} material={M.dirt}>
				<planeGeometry args={[10, 60, 10, 60]} />
			</mesh>
			{houses.map((h, i) => (
				<group key={i} position={[h.side * (3.2 + h.w / 2), 0, h.z]}>
					{[-1, 1].map((a) =>
						[-1, 1].map((b) => <Box key={`${a}${b}`} p={[a * (h.w / 2 - 0.1), 0.4, b * 1.2]} s={[0.12, 0.8, 0.12]} m={M.trunk} />),
					)}
					<Box p={[0, 0.8 + h.h / 2, 0]} s={[h.w, h.h, 2.6]} m={M.wall} />
					<Box p={[0, 0.8 + h.h + 0.5, 0]} s={[h.w + 0.6, 0.15, 3.2]} r={[0, 0, h.side * 0.25]} m={M.nipa} />
					<Box p={[-h.side * (h.w / 2 + 0.01), 1.7, 0.2]} s={[0.02, 0.5, 0.6]} m={M.gap} />
				</group>
			))}
			{/* a bamboo fence along the right */}
			{Array.from({length: 30}, (_, i) => (
				<Cyl key={i} p={[2.6, 0.45, 4 - i * 0.9]} r0={0.04} h={0.9} m={M.bamboo} n={5} />
			))}
			{/* the house at the end: its door, and the lamplit gap under it */}
			<group position={[0, 0, DOOR_Z]}>
				<Box p={[-2.4, 1.6, 0]} s={[3.6, 3.2, 0.2]} m={M.wall} />
				<Box p={[2.4, 1.6, 0]} s={[3.6, 3.2, 0.2]} m={M.wall} />
				<Box p={[0, 2.9, 0]} s={[1.2, 0.6, 0.2]} m={M.wall} />
				<Box p={[0, 1.33, 0.02]} s={[1.2, 2.54, 0.08]} m={M.door} />
				<Box p={[0, 0.02, 0.0]} s={[1.2, 0.04, 0.14]} m={M.gap} />
				<Box p={[0, 3.6, 0]} s={[9, 0.2, 3]} r={[0.2, 0, 0]} m={M.nipa} />
			</group>
		</group>
	);
};

// ------------------------------------------------------------------ the room: banig, the sleeper's head and arm
export const HEAD: V3 = [0, 0.1, 0]; // centre of his head, lying face up, crown toward −z
export const Sleeper: React.FC<{t: number; breathe?: number; ripple?: number; mouth?: number; cough?: number}> = ({t, breathe = 1, ripple = -1, mouth = 0, cough = 0}) => {
	const M = useM();
	const b = Math.sin(t * 1.6) * 0.004 * breathe;
	const jerk = cough > 0 ? Math.sin(cough * Math.PI) * 0.02 : 0;
	return (
		<group>
			<Box p={[0, 0.005, 0.4]} s={[1.0, 0.01, 2.2]} m={M.banig} unit={0.1} />
			<Box p={[0, -0.01, 0]} s={[6, 0.02, 6]} m={M.floor} unit={0.5} />
			{/* a pillow */}
			<Box p={[0, 0.04, -0.06]} s={[0.45, 0.08, 0.3]} m={M.sheet} unit={0.05} />
			{/* the head, face up */}
			<group position={[HEAD[0], HEAD[1] + jerk, HEAD[2]]} rotation={[-jerk * 4, 0, 0]}>
				<Box p={[0, 0, 0]} s={[0.16, 0.18, 0.22]} m={M.skin} unit={0.03} />
				<Box p={[0, -0.005, -0.085]} s={[0.17, 0.17, 0.07]} m={M.hair} unit={0.03} />
				{/* closed eyes, brows, nose, mouth */}
				{[-0.035, 0.035].map((x) => (
					<React.Fragment key={x}>
						<Box p={[x, 0.091, -0.012]} s={[0.035, 0.004, 0.006]} m={M.skinDark} unit={1} />
						<Box p={[x, 0.092, -0.035]} s={[0.04, 0.006, 0.01]} m={M.hair} unit={1} />
					</React.Fragment>
				))}
				<Box p={[0, 0.1, 0.022]} s={[0.03, 0.025, 0.05]} m={M.skin} unit={0.03} />
				<Box p={[0, 0.091, 0.07]} s={[0.05, 0.004, 0.012 + 0.02 * mouth]} m={M.skinDark} unit={1} />
				{/* the ear, on the side toward +x */}
				<Box p={[0.083, 0.0, 0.01]} s={[0.012, 0.05, 0.035]} m={M.skin} unit={1} />
				<Box p={[0.09, 0.0, 0.01]} s={[0.003, 0.016, 0.012]} m={M.leg} unit={1} />
			</group>
			{/* the body under a blanket, rising with his breath */}
			<Box p={[0, 0.09 + b, 0.55]} s={[0.5, 0.18, 0.9]} m={M.sheet} unit={0.1} />
			<Box p={[0, 0.07 + b * 0.5, 1.2]} s={[0.45, 0.13, 0.5]} m={M.sheet} unit={0.1} />
			{/* his forearm on the banig, out from under the blanket */}
			<group position={[0.35, 0.045, 0.45]} rotation={[0, -0.25, 0]}>
				<Cyl p={[0, 0, 0.15]} r0={0.038} r1={0.032} h={0.32} m={M.skin} rot={[Math.PI / 2, 0, 0]} n={10} hs={16} />
				<Box p={[0, 0.0, 0.34]} s={[0.07, 0.03, 0.09]} m={M.skin} unit={0.02} />
				{/* the ripple: a bump travelling under the skin toward the elbow (no wound) */}
				{ripple >= 0 && ripple <= 1 && (
					<mesh position={[0.004 * Math.sin(t * 9), 0.03 + 0.005 * Math.sin(t * 17), 0.3 - 0.28 * ripple]} scale={[0.032, 0.024 + 0.006 * Math.sin(t * 11), 0.05]} material={M.skin}>
						<sphereGeometry args={[1, 8, 6]} />
					</mesh>
				)}
			</group>
		</group>
	);
};

export const Bottle: React.FC<{p: V3; r?: V3}> = ({p, r = [0, 0, 0]}) => {
	const M = useM();
	return (
		<group position={p} rotation={r}>
			<Cyl p={[0, 0, 0]} r0={0.035} h={0.16} m={M.bottle} n={8} />
			<Cyl p={[0, -0.01, 0]} r0={0.03} h={0.12} m={M.potion} n={8} />
			{[0, 1, 2].map((i) => (
				<Box key={i} p={[0.01 * Math.cos(i * 2), -0.01 + i * 0.03, 0.01 * Math.sin(i * 2)]} s={[0.004, 0.06, 0.002]} r={[0, 0, 0.3 * i]} m={M.herb} unit={1} />
			))}
			<Cyl p={[0, 0.11, 0]} r0={0.012} h={0.06} m={M.bottle} n={6} />
		</group>
	);
};

// ------------------------------------------------------------------ the mountain: the healers' cauldron
export const Cauldron: React.FC<{t: number}> = ({t}) => {
	const M = useM();
	return (
		<group>
			<Island gold />
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={M.grass}>
				<planeGeometry args={[30, 30, 12, 12]} />
			</mesh>
			{[0, 1, 2].map((i) => (
				<Ball key={i} p={[Math.cos(i * 2.1) * 0.45, 0.12, Math.sin(i * 2.1) * 0.45]} s={[0.2, 0.15, 0.2]} m={M.rock} n={6} />
			))}
			<mesh position={[0, 0.55, 0]} material={M.cauldron}>
				<sphereGeometry args={[0.45, 10, 8, 0, Math.PI * 2, Math.PI / 2.6, Math.PI / 1.6]} />
			</mesh>
			<mesh position={[0, 0.72, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.potion}>
				<circleGeometry args={[0.4, 12]} />
			</mesh>
			{/* herbs floating, turning */}
			{Array.from({length: 9}, (_, i) => (
				<Box key={i} p={[Math.cos(i * 0.7 + t * 0.6) * 0.25, 0.725, Math.sin(i * 0.7 + t * 0.6) * 0.25]} s={[0.07, 0.01, 0.025]} r={[0, i + t * 0.6, 0]} m={i % 2 ? M.herb : M.herb2} unit={1} />
			))}
			{/* the fire under it */}
			{[0, 1, 2, 3, 4, 5].map((i) => {
				const h = 0.25 + 0.12 * Math.sin(t * (6 + i) + i);
				return (
					<mesh key={i} position={[Math.cos(i * 1.05) * 0.2, 0.12 + h / 2, Math.sin(i * 1.05) * 0.2]} material={i % 2 ? M.fire : M.fire2}>
						<coneGeometry args={[0.07, h, 4]} />
					</mesh>
				);
			})}
			{/* smoke and steam rising */}
			{Array.from({length: 7}, (_, i) => {
				const k = ((t * 0.25 + i / 7) % 1);
				return (
					<mesh key={i} position={[Math.sin(i * 2.3 + t * 0.3) * 0.2 + k * 0.4, 0.9 + k * 3.0, Math.cos(i * 1.7) * 0.15]} scale={0.25 + k * 0.7} material={M.smoke}>
						<icosahedronGeometry args={[1, 0]} />
					</mesh>
				);
			})}
		</group>
	);
};
