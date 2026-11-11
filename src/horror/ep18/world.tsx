// Episode 18 world: "The Light in the Quezon Room" (reported legend: Malacañang, Manila). Two sets:
// OUTSIDE, a historic two-storey palace by a river at night (a stone ground floor with arches, a
// white upper floor with rows of capiz windows, a hip roof, old lamp posts, acacias, the dark river
// with reflections); INSIDE, a long hall with narra floorboards, dark wainscot, portraits that are
// only dark landscapes, capiz windows letting in moonlight, and doors to an old office (a desk lamp,
// a chair, a clock stopped at 3:15) and a sitting room (an ashtray, an armchair).
// Respect: no portrait shows a face; no flag, seal or name; nothing political.
//
// Layout (metres, y up). Inside: the hall runs along z, x -2..2, z -22..8, 4.2 m high; capiz
// windows on the +x wall; doors on the -x wall to the office (z -4.5..0.5) and the sitting room
// (z -10.5..-5.5), and a third doorway at z -14 (where the ball comes from). Outside: the palace
// facade faces +z at z = OUT_Z, centred on x = 0, the river in front of it.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1, rng} from '../ps1';
import {SNAP6} from '../ep01/world';

const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 20, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 20, SNAP6);

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

type V3 = [number, number, number];
export const HALL_H = 4.2;
export const OUT_Z = -300;
export const LIT_WIN: V3 = [-3.6, 5.6, OUT_Z + 0.36]; // the upper window that switches on
export const DESK: V3 = [-5, 0, -2];
export const ASHTRAY: V3 = [-4.4, 0.62, -8];
export const BALL_DOOR_Z = -14;

const useMats = () =>
	useMemo(() => {
		const planks = tex(16, 32, (g) => {
			const r = rng(1801);
			for (let x = 0; x < 16; x += 4) {
				g.fillStyle = r() < 0.5 ? '#6a3e22' : '#5a341c';
				g.fillRect(x, 0, 4, 32);
				g.fillStyle = '#3a2010';
				g.fillRect(x, 0, 1, 32);
				g.fillRect(x, Math.floor(r() * 32), 4, 1);
			}
		}, [3, 30]);
		const capiz = (lit: boolean) =>
			tex(16, 24, (g) => {
				g.fillStyle = lit ? '#e8c890' : '#2a2c34';
				g.fillRect(0, 0, 16, 24);
				g.fillStyle = lit ? '#b08a50' : '#14161c';
				for (let i = 0; i <= 16; i += 4) g.fillRect(i, 0, 1, 24);
				for (let j = 0; j <= 24; j += 4) g.fillRect(0, j, 16, 1);
			});
		const capizIn = tex(16, 24, (g) => {
			g.fillStyle = '#9aa8c0';
			g.fillRect(0, 0, 16, 24);
			g.fillStyle = '#3a3a44';
			for (let i = 0; i <= 16; i += 4) g.fillRect(i, 0, 1, 24);
			for (let j = 0; j <= 24; j += 4) g.fillRect(0, j, 16, 1);
		});
		const painting = (seed: number) =>
			tex(16, 20, (g) => {
				// a dark landscape: no faces, no figures
				const r = rng(seed);
				g.fillStyle = '#1e1a14';
				g.fillRect(0, 0, 16, 20);
				g.fillStyle = '#3a3424';
				g.fillRect(0, 8 + Math.floor(r() * 4), 16, 12);
				g.fillStyle = '#2a3020';
				g.fillRect(Math.floor(r() * 8), 6, 6, 6);
				g.fillStyle = '#4a4430';
				g.fillRect(0, 16, 16, 4);
			});
		const clock = tex(32, 32, (g) => {
			g.fillStyle = '#d8d0b8';
			g.beginPath();
			g.arc(16, 16, 15, 0, Math.PI * 2);
			g.fill();
			g.fillStyle = '#1a1a1a';
			for (let i = 0; i < 12; i++) g.fillRect(16 + Math.round(Math.sin((i / 12) * Math.PI * 2) * 12), 16 - Math.round(Math.cos((i / 12) * Math.PI * 2) * 12), 1, 1);
			// 3:15
			g.fillRect(16, 16, 6, 2); // hour hand at a quarter past three
			g.fillRect(16, 15, 10, 1); // minute hand at 3
		});
		return {
			planks: lam('#ffffff', {map: planks}),
			wainscot: lam('#3a2416'),
			plaster: lam('#c8bea4'),
			ceiling: lam('#8a8270'),
			trim: lam('#2a1a10'),
			capizOut: lam('#ffffff', {map: capiz(false)}),
			capizLit: bas('#ffffff', {map: capiz(true)}),
			capizIn: bas('#ffffff', {map: capizIn}),
			paintings: [101, 202, 303, 404, 505].map((s) => lam('#ffffff', {map: painting(s)})),
			frame: lam('#6a5020'),
			black: bas('#020203'),
			desk: lam('#4a2a16'),
			green: lam('#1e4a2a'),
			brass: lam('#a88a40'),
			lampOn: bas('#fff0b8'),
			lampOff: lam('#4a4630'),
			paper: lam('#c8c0a8'),
			chair: lam('#3a2216'),
			leather: lam('#4a1e16'),
			clock: lam('#ffffff', {map: clock}),
			glass: lam('#8a9090'),
			smoke: new THREE.MeshBasicMaterial({color: '#d8d8e0', transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide}),
			ball: lam('#a82020'),
			shoe: lam('#1a1410'),
			dust: new THREE.MeshBasicMaterial({color: '#c8b898', transparent: true, opacity: 0.35, depthWrite: false}),
			// outside
			stone: lam('#6a665c'),
			white: lam('#d0ccbc'),
			roof: lam('#5a3a2c'),
			water: lam('#0c1218'),
			reflect: new THREE.MeshBasicMaterial({color: '#e8c890', transparent: true, opacity: 0.45, depthWrite: false}),
			lawn: lam('#1e2a18'),
			post: lam('#1a1a1a'),
			globe: bas('#f0e8d0'),
			tree: lam('#18241a'),
			trunk: lam('#2a2018'),
			sky: new THREE.MeshBasicMaterial({color: '#0a0e18', side: THREE.BackSide, fog: false}),
			city: new THREE.MeshBasicMaterial({color: '#1a1410', fog: false}),
			// the guard
			uniform: lam('#d8d8d0'),
			pants: lam('#1a1c24'),
			cap: lam('#14161e'),
			skin: lam('#7a5640'),
			torch: bas('#fff4d8'),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
const Ctx = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(Ctx)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMats()}>{children}</Ctx.Provider>;

// the PS1 shader lights per vertex: subdivide by size so lamps and beams land on vertices
const seg = (v: number) => Math.min(14, Math.max(1, Math.ceil(v / 0.5)));
export const Box: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={[s[0], s[1], s[2], seg(s[0]), seg(s[1]), seg(s[2])]} />
	</mesh>
);

/** A wall along z at x, z0..z1, with openings [za, zb, ya, yb] (sorted here). */
const WallZ: React.FC<{x: number; z0: number; z1: number; h: number; holes: [number, number, number, number][]; m: THREE.Material; t?: number}> = ({x, z0, z1, h, holes, m, t = 0.2}) => {
	const hs = [...holes].sort((a, b) => a[0] - b[0]);
	const parts: React.ReactNode[] = [];
	const zs = [z0, ...hs.flatMap(([a, b]) => [a, b]), z1];
	for (let i = 0; i < zs.length; i += 2) if (zs[i + 1] > zs[i]) parts.push(<Box key={`s${i}`} p={[x, h / 2, (zs[i] + zs[i + 1]) / 2]} s={[t, h, zs[i + 1] - zs[i]]} m={m} />);
	hs.forEach(([a, b, ya, yb], i) => {
		if (ya > 0) parts.push(<Box key={`b${i}`} p={[x, ya / 2, (a + b) / 2]} s={[t, ya, b - a]} m={m} />);
		parts.push(<Box key={`t${i}`} p={[x, (yb + h) / 2, (a + b) / 2]} s={[t, h - yb, b - a]} m={m} />);
	});
	return <group>{parts}</group>;
};
const WallX: React.FC<{z: number; x0: number; x1: number; h: number; holes: [number, number, number, number][]; m: THREE.Material; t?: number}> = ({z, x0, x1, h, holes, m, t = 0.2}) => (
	<group position={[0, 0, z]} rotation={[0, -Math.PI / 2, 0]}>
		<WallZ x={0} z0={-x1} z1={-x0} h={h} holes={holes.map(([a, b, ya, yb]) => [-b, -a, ya, yb] as [number, number, number, number])} m={m} t={t} />
	</group>
);

const HALL_WIN = [-18, -13, -8, -3, 2, 6];

/** The interior: hall, office, sitting room. lamp: the desk lamp on. chairRy: the office chair's facing. */
export const Interior: React.FC<{t: number; lamp: boolean; chairRy: number; smoke: boolean; ball: number; dust: number; door: number}> = ({t, lamp, chairRy, smoke, ball, dust, door}) => {
	const m = useM();
	const ballZ = BALL_DOOR_Z + 0.2;
	return (
		<group>
			{/* the hall */}
			<mesh position={[-2.5, 0, -7]} rotation={[-Math.PI / 2, 0, 0]} material={m.planks}>
				<planeGeometry args={[11, 32, 22, 64]} />
			</mesh>
			<mesh position={[-2.5, HALL_H, -7]} rotation={[Math.PI / 2, 0, 0]} material={m.ceiling}>
				<planeGeometry args={[11, 32, 11, 32]} />
			</mesh>
			<WallZ x={2.1} z0={-22} z1={8} h={HALL_H} holes={HALL_WIN.map((z) => [z - 0.8, z + 0.8, 0.9, 3.4] as [number, number, number, number])} m={m.plaster} />
			{HALL_WIN.map((z) => (
				<mesh key={z} position={[2.05, 2.15, z]} rotation={[0, -Math.PI / 2, 0]} material={m.capizIn}>
					<planeGeometry args={[1.6, 2.5]} />
				</mesh>
			))}
			<WallZ x={-2.1} z0={-22} z1={8} h={HALL_H} holes={[[-2.6, -1.4, 0, 2.6], [-8.6, -7.4, 0, 2.6], [BALL_DOOR_Z - 0.6, BALL_DOOR_Z + 0.6, 0, 2.6]]} m={m.plaster} />
			{/* dark wainscot along both walls */}
			{[-1.98, 1.98].map((x) => (
				<Box key={x} p={[x, 0.55, -7]} s={[0.04, 1.1, 30]} m={m.wainscot} />
			))}
			<Box p={[0, 2.1, -22]} s={[4.2, 4.2, 0.2]} m={m.black} />
			<Box p={[0, 2.1, 8]} s={[4.2, 4.2, 0.2]} m={m.black} />
			{/* portraits that are only dark landscapes */}
			{[-5, -11, -17, 3].map((z, i) => (
				<group key={z} position={[-1.96, 2.3, z]} rotation={[0, Math.PI / 2, 0]}>
					<Box p={[0, 0, -0.02]} s={[1.1, 1.35, 0.06]} m={m.frame} />
					<mesh position={[0, 0, 0.02]} material={m.paintings[i]}>
						<planeGeometry args={[0.9, 1.15]} />
					</mesh>
				</group>
			))}
			{/* the office door: closed, a strip of light under it while the lamp is on; or open */}
			<group position={[-2.1, 0, -1.4]} rotation={[0, door * 1.6, 0]}>
				<Box p={[0, 1.31, -0.6]} s={[0.06, 2.5, 1.2]} m={m.desk} />
				<Box p={[0.04, 1.1, -1.05]} s={[0.04, 0.06, 0.06]} m={m.brass} />
			</group>
			{lamp && door < 0.1 && (
				<mesh position={[-1.98, 0.012, -2]} rotation={[-Math.PI / 2, 0, 0]} material={m.lampOn}>
					<planeGeometry args={[0.18, 1.15]} />
				</mesh>
			)}
			{/* the office: walls, desk, lamp, chair, clock, window */}
			<WallX z={-4.5} x0={-7.5} x1={-2.1} h={HALL_H} holes={[]} m={m.plaster} />
			<WallX z={0.5} x0={-7.5} x1={-2.1} h={HALL_H} holes={[]} m={m.plaster} />
			<WallZ x={-7.5} z0={-4.5} z1={0.5} h={HALL_H} holes={[[-2.8, -1.2, 1.0, 3.2]]} m={m.plaster} />
			<mesh position={[-7.45, 2.1, -2]} rotation={[0, Math.PI / 2, 0]} material={m.capizIn}>
				<planeGeometry args={[1.6, 2.2]} />
			</mesh>
			<group position={DESK}>
				<Box p={[0, 0.76, 0]} s={[0.9, 0.06, 1.6]} m={m.desk} />
				{[-0.4, 0.4].map((x) => [-0.7, 0.7].map((z) => <Box key={`${x}${z}`} p={[x, 0.38, z]} s={[0.06, 0.76, 0.06]} m={m.desk} />))}
				<Box p={[0.1, 0.8, 0.2]} s={[0.3, 0.01, 0.22]} m={m.paper} />
				<Box p={[0.05, 0.82, -0.3]} s={[0.25, 0.04, 0.18]} m={m.leather} />
				{/* a green-shaded desk lamp */}
				<group position={[-0.2, 0.79, -0.55]}>
					<Box p={[0, 0.02, 0]} s={[0.14, 0.04, 0.14]} m={m.brass} />
					<Box p={[0, 0.2, 0]} s={[0.02, 0.36, 0.02]} m={m.brass} />
					<mesh position={[0, 0.4, 0.05]} rotation={[0, 0, Math.PI / 2]} material={m.green}>
						<cylinderGeometry args={[0.07, 0.09, 0.32, 8, 1, false, 0, Math.PI]} />
					</mesh>
					<mesh position={[0, 0.36, 0.05]} rotation={[0, 0, Math.PI / 2]} material={lamp ? m.lampOn : m.lampOff}>
						<cylinderGeometry args={[0.03, 0.03, 0.26, 6]} />
					</mesh>
				</group>
			</group>
			{/* the chair: turned to the window, or back to the desk */}
			<group position={[DESK[0] - 0.85, 0, DESK[2]]} rotation={[0, chairRy, 0]}>
				<Box p={[0, 0.48, 0]} s={[0.5, 0.08, 0.5]} m={m.leather} />
				<Box p={[0, 0.95, -0.24]} s={[0.5, 0.9, 0.08]} m={m.leather} />
				{[-0.2, 0.2].map((x) => [-0.2, 0.2].map((z) => <Box key={`${x}${z}`} p={[x, 0.24, z]} s={[0.05, 0.48, 0.05]} m={m.chair} />))}
			</group>
			<mesh position={[-4.4, 2.9, 0.38]} rotation={[0, Math.PI, 0]} material={m.clock}>
				<circleGeometry args={[0.24, 14]} />
			</mesh>
			{/* the sitting room: an armchair, a side table, an ashtray, a window */}
			<WallX z={-10.5} x0={-7.5} x1={-2.1} h={HALL_H} holes={[]} m={m.plaster} />
			<WallZ x={-7.5} z0={-10.5} z1={-4.5} h={HALL_H} holes={[[-8.8, -7.2, 1.0, 3.2]]} m={m.plaster} />
			<mesh position={[-7.45, 2.1, -8]} rotation={[0, Math.PI / 2, 0]} material={m.capizIn}>
				<planeGeometry args={[1.6, 2.2]} />
			</mesh>
			<group position={[-5.6, 0, -8.6]} rotation={[0, 0.7, 0]}>
				<Box p={[0, 0.42, 0]} s={[0.8, 0.3, 0.75]} m={m.leather} />
				<Box p={[0, 0.85, -0.32]} s={[0.8, 0.7, 0.14]} m={m.leather} />
				{[-0.38, 0.38].map((x) => (
					<Box key={x} p={[x, 0.62, 0]} s={[0.12, 0.25, 0.7]} m={m.leather} />
				))}
			</group>
			<Box p={[ASHTRAY[0], 0.3, ASHTRAY[2]]} s={[0.5, 0.6, 0.5]} m={m.desk} />
			<mesh position={ASHTRAY} material={m.glass}>
				<cylinderGeometry args={[0.08, 0.07, 0.03, 8]} />
			</mesh>
			{smoke &&
				[0, 1, 2, 3].map((i) => (
					<mesh key={i} position={[ASHTRAY[0] + Math.sin(t * 0.9 + i * 1.7) * 0.06 * (i + 1), ASHTRAY[1] + 0.25 + i * 0.35, ASHTRAY[2]]} rotation={[0, t * 0.4 + i, Math.sin(t + i) * 0.3]} material={m.smoke}>
						<planeGeometry args={[0.12 + i * 0.08, 0.4]} />
					</mesh>
				))}
			{/* the doorway the ball rolls out of; a small shoe left in the hall */}
			<mesh position={[-1.9 + ball * 2.6, 0.11, ballZ + ball * 1.2]} rotation={[ball * 12, 0, 0]} material={m.ball}>
				<icosahedronGeometry args={[0.11, 1]} />
			</mesh>
			<group position={[1.4, 0, -16.5]} rotation={[0, 0.6, 0]}>
				<Box p={[0, 0.03, 0]} s={[0.07, 0.05, 0.15]} m={m.shoe} />
			</group>
			{/* dust sifting from the ceiling boards with each footstep above */}
			{dust > 0 &&
				Array.from({length: 18}, (_, i) => (
					<mesh key={i} position={[-0.6 + (i % 6) * 0.25, HALL_H - 0.1 - ((dust * 2.5 + i * 0.13) % 2.4), -6 + Math.floor(i / 6) * 0.3]} material={m.dust}>
						<boxGeometry args={[0.02, 0.02, 0.02]} />
					</mesh>
				))}
		</group>
	);
};

/** The palace from outside, by the river. lit: the upper office window. smoke: a curl in a dark window. */
export const Exterior: React.FC<{t: number; lit: number; smoke: boolean}> = ({t, lit, smoke}) => {
	const m = useM();
	const trees = useMemo(() => {
		const r = rng(1802);
		return Array.from({length: 10}, (_, i) => ({x: (i < 5 ? -1 : 1) * (14 + r() * 14), z: OUT_Z - 6 + r() * 14, s: 3 + r() * 2}));
	}, []);
	const winX = [-10.8, -7.2, -3.6, 0, 3.6, 7.2, 10.8];
	return (
		<group>
			<mesh position={[0, 0, OUT_Z]} material={m.sky}>
				<sphereGeometry args={[350, 12, 8]} />
			</mesh>
			{/* the city's glow low across the water */}
			<Box p={[0, 3, OUT_Z + 160]} s={[400, 6, 1]} m={m.city} />
			{/* the palace: stone ground floor with arches, white upper floor with capiz windows, hip roof */}
			<group position={[0, 0, OUT_Z]}>
				<Box p={[0, 1.8, -4]} s={[26, 3.6, 8]} m={m.stone} />
				{winX.map((x) => (
					<Box key={`a${x}`} p={[x, 1.3, 0.02]} s={[1.6, 2.4, 0.06]} m={m.black} />
				))}
				<Box p={[0, 5.4, -4]} s={[26, 3.6, 8]} m={m.white} />
				<Box p={[0, 3.65, 0.1]} s={[26.4, 0.2, 0.4]} m={m.trim} />
				{winX.map((x) => (
					<mesh key={`w${x}`} position={[x, 5.6, 0.04]} material={x === LIT_WIN[0] && lit > 0.5 ? m.capizLit : m.capizOut}>
						<planeGeometry args={[2.2, 2.4]} />
					</mesh>
				))}
				<mesh position={[0, 8.4, -4]} rotation={[0, Math.PI / 4, 0]} scale={[1.9, 1, 0.6]} material={m.roof}>
					<coneGeometry args={[10, 2.4, 4, 1]} />
				</mesh>
				{smoke && (
					<mesh position={[7.2 + Math.sin(t) * 0.1, 5.8, 0.08]} material={m.smoke}>
						<planeGeometry args={[0.5, 1.2]} />
					</mesh>
				)}
			</group>
			{/* lawn, the river and the window's reflection in it */}
			<mesh position={[0, 0, OUT_Z + 7]} rotation={[-Math.PI / 2, 0, 0]} material={m.lawn}>
				<planeGeometry args={[80, 14, 20, 6]} />
			</mesh>
			<mesh position={[0, -0.3, OUT_Z + 40]} rotation={[-Math.PI / 2, 0, 0]} material={m.water}>
				<planeGeometry args={[200, 52, 20, 10]} />
			</mesh>
			{lit > 0.5 && (
				<mesh position={[LIT_WIN[0] + Math.sin(t * 2) * 0.1, -0.28, OUT_Z + 16]} rotation={[-Math.PI / 2, 0, 0]} material={m.reflect}>
					<planeGeometry args={[1.4, 12]} />
				</mesh>
			)}
			{[-12, -4, 4, 12].map((x) => (
				<group key={x} position={[x, 0, OUT_Z + 12.5]}>
					<Box p={[0, 1.6, 0]} s={[0.12, 3.2, 0.12]} m={m.post} />
					<mesh position={[0, 3.35, 0]} material={m.globe}>
						<sphereGeometry args={[0.2, 6, 5]} />
					</mesh>
				</group>
			))}
			{trees.map((tr, i) => (
				<group key={i} position={[tr.x, 0, tr.z]}>
					<Box p={[0, 2, 0]} s={[0.5, 4, 0.5]} m={m.trunk} />
					<mesh position={[0, 5, 0]} scale={[1.6, 0.6, 1.4]} material={m.tree}>
						<dodecahedronGeometry args={[tr.s, 0]} />
					</mesh>
				</group>
			))}
		</group>
	);
};

/** A palace guard: white shirt, dark trousers, a cap; a flashlight in one hand. */
export const Guard: React.FC<{t: number; position: V3; ry: number; look?: number; reach?: number}> = ({t, position, ry, look = 0, reach = 0}) => {
	const m = useM();
	return (
		<group position={position} rotation={[0, ry, 0]}>
			{[-0.1, 0.1].map((x) => (
				<Box key={x} p={[x, 0.43, 0]} s={[0.14, 0.86, 0.15]} m={m.pants} />
			))}
			<Box p={[0, 1.16, 0]} s={[0.42, 0.6, 0.25]} m={m.uniform} />
			<Box p={[0.26, 1.1, 0.12]} s={[0.1, 0.55, 0.11]} m={m.uniform} r={[-0.9 - reach * 0.6, 0, 0]} />
			<Box p={[0.26, 1.05, 0.45 + reach * 0.15]} s={[0.05, 0.05, 0.14]} m={m.torch} />
			<Box p={[-0.26, 1.15, 0]} s={[0.1, 0.55, 0.11]} m={m.uniform} />
			<group position={[0, 1.6, 0]} rotation={[-look * 0.6, 0, 0]}>
				<Box p={[0, 0, 0]} s={[0.2, 0.24, 0.21]} m={m.skin} />
				<Box p={[0, 0.11, 0.02]} s={[0.22, 0.06, 0.24]} m={m.cap} />
				<Box p={[0, 0.09, 0.15]} s={[0.2, 0.02, 0.1]} m={m.cap} />
			</group>
		</group>
	);
};
