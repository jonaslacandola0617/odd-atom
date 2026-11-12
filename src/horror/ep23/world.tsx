// Episode 23 world: "Backwards" (Season 3, a real reported case: the Bell Witch, Adams, Tennessee,
// 1817-1821). Six small sets, each built for a moving camera and one event the picture shows:
//   GRAVE (origin): the family graveyard at dusk in snow; mourners with lanterns; a coffin on ropes.
//   SICK (x 200): a log-walled bedroom; a man's shape under a quilt, his hand; a vial on the sill.
//   TABLE (x 400): the main room at supper; the family; candles; the hearth; an empty chair.
//   KIDS (x 600): the children's room; two small beds; a quilt that leaves the bed.
//   OUT (x 800): the cabin's outside wall at night; scratches on the logs; a cornfield.
//   POST (x 1000): a carved bedpost by candlelight.
// People are period silhouettes with their faces in shadow or turned away: John Bell and his family
// were real people. No one is shown harmed. A composite, not a survey of the Bell farm.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1, rng} from '../ps1';
import {SNAP6} from '../ep01/world';

const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 96, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 96, SNAP6);

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
const seg = (v: number) => Math.min(16, Math.max(1, Math.ceil(v / 0.3)));
export const Box: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={[s[0], s[1], s[2], seg(s[0]), seg(s[1]), seg(s[2])]} />
	</mesh>
);

export const SICK: V3 = [200, 0, 0];
export const TABLE: V3 = [400, 0, 0];
export const KIDS: V3 = [600, 0, 0];
export const OUT: V3 = [800, 0, 0];
export const POST: V3 = [1000, 0, 0];

const useMats = () =>
	useMemo(() => {
		const logs = tex(16, 32, (g) => {
			for (let y = 0; y < 32; y += 8) {
				g.fillStyle = '#4a3422';
				g.fillRect(0, y, 16, 8);
				g.fillStyle = '#5a4230';
				g.fillRect(0, y + 1, 16, 3);
				g.fillStyle = '#2a1c12';
				g.fillRect(0, y + 7, 16, 1);
				g.fillStyle = '#7a6a54';
				g.fillRect(0, y + 6, 16, 1); // chinking
			}
		}, [3, 3]);
		const quilt = tex(16, 16, (g) => {
			const cs = ['#6a2a24', '#3a4a5a', '#8a7a4a', '#4a5a3a'];
			for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
				g.fillStyle = cs[(x + y * 3) % 4];
				g.fillRect(x * 4, y * 4, 4, 4);
			}
		}, [2, 2]);
		const boards = tex(16, 16, (g) => {
			g.fillStyle = '#3a2a1c';
			g.fillRect(0, 0, 16, 16);
			for (let x = 0; x < 16; x += 4) {
				g.fillStyle = '#2a1e14';
				g.fillRect(x, 0, 1, 16);
			}
		}, [6, 6]);
		const snow = tex(16, 16, (g) => {
			g.fillStyle = '#a0aac0';
			g.fillRect(0, 0, 16, 16);
			const r = rng(2301);
			for (let i = 0; i < 30; i++) {
				g.fillStyle = r() > 0.5 ? '#8a94a8' : '#6a7488';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
			}
		}, [20, 20]);
		const shadow = tex(32, 48, (g) => {
			// the shadow of someone sitting in a chair, thrown on the wall by the hearth
			g.clearRect(0, 0, 32, 48);
			g.fillStyle = 'rgba(0,0,0,0.85)';
			g.beginPath();
			g.arc(16, 10, 6, 0, Math.PI * 2);
			g.fill();
			g.fillRect(8, 16, 16, 18);
			g.fillRect(6, 34, 22, 4);
			g.fillRect(6, 38, 4, 10);
			g.fillRect(24, 38, 4, 10);
		});
		const scratch = tex(16, 16, (g) => {
			g.clearRect(0, 0, 16, 16);
			g.fillStyle = 'rgba(150,120,90,0.75)';
			for (let k = 0; k < 3; k++) for (let y = 0; y < 16; y++) g.fillRect(4 + k * 3 + Math.floor(y / 6), y, 1, 1);
		});
		return {
			logs: lam('#ffffff', {map: logs}),
			boards: lam('#ffffff', {map: boards}),
			snow: lam('#ffffff', {map: snow}),
			quilt: lam('#ffffff', {map: quilt}),
			sheet: lam('#9a9282'),
			bed: lam('#3a2616'),
			wood: lam('#5a3e26'),
			darkWood: lam('#2a1a10'),
			coat: lam('#2e2a2c'),
			coat2: lam('#3a3430'),
			bonnet: lam('#4a443c'),
			face: lam('#241e1a'), // faces stay in shadow
			hand: lam('#8a7a68'),
			lantern: bas('#ffc070'),
			lanternOff: lam('#2a2622'),
			flame: bas('#ffd890'),
			candle: lam('#d8d0b8'),
			glass: bas('#9ab8a8'),
			fire: bas('#ff7a20'),
			stone: lam('#5a5a60'),
			earth: lam('#2a2018'),
			hole: bas('#030303'),
			coffin: lam('#3a2414'),
			rope: lam('#8a7a5a'),
			tree: lam('#1a1816'),
			sky: new THREE.MeshBasicMaterial({color: '#3a4664', side: THREE.BackSide, fog: false}),
			nightSky: new THREE.MeshBasicMaterial({color: '#141c30', side: THREE.BackSide, fog: false}),
			moon: new THREE.MeshBasicMaterial({color: '#d8dce8', fog: false}),
			window: bas('#ffb060'),
			stalk: lam('#7a8a5a'),
			leaf: lam('#5a6a40'),
			dirt: lam('#2a2016'),
			shadow: new THREE.MeshBasicMaterial({map: shadow, transparent: true, depthWrite: false, opacity: 0}),
			scratch: new THREE.MeshBasicMaterial({map: scratch, transparent: true, depthWrite: false}),
			snowFlake: bas('#c8d0e0'),
			pewter: lam('#7a7a78'),
			black: bas('#020202'),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
const Ctx = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(Ctx)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMats()}>{children}</Ctx.Provider>;

/** A standing period figure: long coat or dress, hat or bonnet; look turns the head (radians). */
export const Mourner: React.FC<{p: V3; ry: number; look: number; woman?: boolean; lantern?: number}> = ({p, ry, look, woman, lantern = -1}) => {
	const m = useM();
	return (
		<group position={p} rotation={[0, ry, 0]}>
			<mesh position={[0, 0.62, 0]} material={woman ? m.coat2 : m.coat}>
				<cylinderGeometry args={[0.17, woman ? 0.34 : 0.24, 1.24, 8]} />
			</mesh>
			<Box p={[0, 1.32, 0]} s={[0.4, 0.18, 0.24]} m={woman ? m.coat2 : m.coat} />
			<group position={[0, 1.55, 0]} rotation={[0, look, 0]}>
				<mesh material={m.face} scale={[0.85, 1.05, 0.9]}>
					<icosahedronGeometry args={[0.11, 1]} />
				</mesh>
				{woman ? (
					<mesh position={[0, 0.03, -0.02]} material={m.bonnet} scale={[1.15, 1.2, 1.25]}>
						<sphereGeometry args={[0.12, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
					</mesh>
				) : (
					<>
						<mesh position={[0, 0.09, 0]} material={m.coat}>
							<cylinderGeometry args={[0.2, 0.2, 0.015, 10]} />
						</mesh>
						<mesh position={[0, 0.17, 0]} material={m.coat}>
							<cylinderGeometry args={[0.1, 0.11, 0.16, 8]} />
						</mesh>
					</>
				)}
			</group>
			{lantern >= 0 && (
				<group position={[0.22, 0.75, 0.12]}>
					<Box p={[0, 0, 0]} s={[0.1, 0.16, 0.1]} m={lantern > 0.5 ? m.lantern : m.lanternOff} />
					<Box p={[0, 0.1, 0]} s={[0.012, 0.06, 0.012]} m={m.darkWood} />
				</group>
			)}
		</group>
	);
};

/** A seated period figure from the side or behind; look turns the head. */
export const Seated: React.FC<{p: V3; ry: number; look: number; woman?: boolean; small?: boolean}> = ({p, ry, look, woman, small}) => {
	const m = useM();
	const s = small ? 0.75 : 1;
	return (
		<group position={p} rotation={[0, ry, 0]} scale={s}>
			<Box p={[0, 0.48, 0.05]} s={[0.4, 0.14, 0.44]} m={woman ? m.coat2 : m.coat} />
			<mesh position={[0, 0.82, -0.05]} material={woman ? m.coat2 : m.coat}>
				<cylinderGeometry args={[0.15, 0.2, 0.6, 8]} />
			</mesh>
			<group position={[0, 1.24, -0.04]} rotation={[0, look, 0]}>
				<mesh material={m.face} scale={[0.85, 1.05, 0.9]}>
					<icosahedronGeometry args={[0.11, 1]} />
				</mesh>
				{woman && (
					<mesh position={[0, 0.03, -0.02]} material={m.bonnet} scale={[1.1, 1.1, 1.2]}>
						<sphereGeometry args={[0.12, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
					</mesh>
				)}
			</group>
			{[-0.1, 0.1].map((x) => (
				<Box key={x} p={[x, 0.24, 0.24]} s={[0.1, 0.46, 0.1]} m={woman ? m.coat2 : m.coat} />
			))}
		</group>
	);
};

const Chair: React.FC<{p: V3; ry: number}> = ({p, ry}) => {
	const m = useM();
	return (
		<group position={p} rotation={[0, ry, 0]}>
			<Box p={[0, 0.45, 0]} s={[0.42, 0.04, 0.4]} m={m.wood} />
			{[[-0.18, -0.17], [0.18, -0.17], [-0.18, 0.17], [0.18, 0.17]].map(([x, z], i) => (
				<Box key={i} p={[x, 0.22, z]} s={[0.04, 0.45, 0.04]} m={m.darkWood} />
			))}
			{[-0.18, 0.18].map((x) => (
				<Box key={x} p={[x, 0.75, -0.18]} s={[0.04, 0.6, 0.04]} m={m.darkWood} />
			))}
			{[0.62, 0.82, 1.0].map((y) => (
				<Box key={y} p={[0, y, -0.18]} s={[0.38, 0.05, 0.03]} m={m.wood} />
			))}
		</group>
	);
};

const Candle: React.FC<{p: V3; lean?: number; t: number; seed: number}> = ({p, lean = 0, t, seed}) => {
	const m = useM();
	return (
		<group position={p}>
			<mesh position={[0, 0.06, 0]} material={m.candle}>
				<cylinderGeometry args={[0.018, 0.018, 0.12, 6]} />
			</mesh>
			<group position={[0, 0.125, 0]} rotation={[0, 0, lean]}>
				<mesh position={[0, 0.02, 0]} material={m.flame} scale={[1, 1 + 0.25 * Math.sin(t * 15 + seed), 1]}>
					<coneGeometry args={[0.012, 0.045, 5]} />
				</mesh>
			</group>
		</group>
	);
};

/** A log-walled room shell: floor, three walls, ceiling beams. Open towards +z. */
const Room: React.FC<{at: V3; w: number; d: number; win?: number}> = ({at, w, d, win}) => {
	const m = useM();
	return (
		<group position={at}>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={m.boards}>
				<planeGeometry args={[w, d + 4, 12, 12]} />
			</mesh>
			<Box p={[0, 1.3, -d / 2]} s={[w, 2.6, 0.2]} m={m.logs} />
			<Box p={[-w / 2, 1.3, 0]} s={[0.2, 2.6, d + 4]} m={m.logs} />
			<Box p={[w / 2, 1.3, 0]} s={[0.2, 2.6, d + 4]} m={m.logs} />
			<Box p={[0, 2.6, 0]} s={[w, 0.1, d + 4]} m={m.darkWood} />
			{[-1, 0, 1].map((k) => (
				<Box key={k} p={[0, 2.5, k * 1.3]} s={[w, 0.16, 0.16]} m={m.darkWood} />
			))}
			{win !== undefined && <Box p={[win, 1.4, -d / 2 + 0.11]} s={[0.6, 0.6, 0.02]} m={m.black} />}
		</group>
	);
};

// ------------------------------------------------------------------ GRAVE
/** gust: 0..1 progress of the gust down the line; lowered: 0..1 the coffin's descent; look: mourners' head turn */
export const Grave: React.FC<{t: number; gust: number; lowered: number; look: number}> = ({t, gust, lowered, look}) => {
	const m = useM();
	const flakes = useMemo(() => {
		const r = rng(2302);
		return Array.from({length: 160}, () => ({x: -8 + r() * 16, y: r() * 6, z: -6 + r() * 12, s: 0.4 + r() * 0.6}));
	}, []);
	const trees = useMemo(() => {
		const r = rng(2303);
		return Array.from({length: 14}, () => ({x: -14 + r() * 28, z: -9 - r() * 8, h: 4 + r() * 4}));
	}, []);
	const MOURNERS: [number, number, boolean][] = [[-1.8, 1.4, false], [-1.1, 1.75, true], [-0.35, 1.95, false], [0.4, 1.95, true], [1.15, 1.75, false], [1.85, 1.4, true]];
	return (
		<group>
			<mesh material={m.sky}>
				<sphereGeometry args={[60, 12, 8]} />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={m.snow}>
				<planeGeometry args={[60, 60, 30, 30]} />
			</mesh>
			{/* the open grave, the dug earth, the coffin on two ropes */}
			<Box p={[0, 0.005, 0]} s={[0.9, 0.01, 2.0]} m={m.hole} />
			<Box p={[1.1, 0.2, 0]} s={[0.7, 0.4, 2.0]} m={m.earth} />
			<group position={[0, 0.45 - lowered * 1.3, 0]}>
				<Box p={[0, 0, 0]} s={[0.55, 0.32, 1.85]} m={m.coffin} />
			</group>
			{[-0.5, 0.5].map((z) => (
				<Box key={z} p={[0, 0.9 - lowered * 0.65, z]} s={[0.03, 0.9 + lowered * 1.3, 0.03]} m={m.rope} />
			))}
			{/* headstones, a split-rail fence, bare trees, the cabin far off with one lit window */}
			{[[-2.6, -1.6], [-3.4, -0.4], [2.8, -1.2]].map(([x, z], i) => (
				<Box key={i} p={[x, 0.35, z]} s={[0.4, 0.7, 0.1]} m={m.stone} r={[0, 0.2 * i, 0.06 * (i - 1)]} />
			))}
			{Array.from({length: 9}, (_, i) => (
				<group key={i} position={[-6 + i * 1.5, 0, -4]}>
					<Box p={[0, 0.5, 0]} s={[0.08, 1.0, 0.08]} m={m.darkWood} />
					<Box p={[0.75, 0.75, 0]} s={[1.5, 0.06, 0.06]} m={m.darkWood} r={[0, 0, 0.08]} />
					<Box p={[0.75, 0.4, 0]} s={[1.5, 0.06, 0.06]} m={m.darkWood} r={[0, 0, -0.06]} />
				</group>
			))}
			{trees.map((tr, i) => (
				<group key={i} position={[tr.x, 0, tr.z]}>
					<Box p={[0, tr.h / 2, 0]} s={[0.18, tr.h, 0.18]} m={m.tree} />
					{[0.6, 0.75, 0.9].map((k, j) => (
						<Box key={j} p={[0.4 * (j % 2 ? 1 : -1), tr.h * k, 0]} s={[0.9, 0.05, 0.05]} m={m.tree} r={[0, j, (j % 2 ? 1 : -1) * 0.6]} />
					))}
				</group>
			))}
			<group position={[-9, 0, -16]}>
				<Box p={[0, 1.4, 0]} s={[5, 2.8, 3.5]} m={m.logs} />
				<Box p={[0, 3.2, 0]} s={[5.4, 0.8, 3.8]} m={m.darkWood} r={[0, 0, 0]} />
				<Box p={[0.8, 1.3, 1.77]} s={[0.5, 0.5, 0.02]} m={m.window} />
			</group>
			{/* the mourners with lanterns, their backs to us; the gust puts the lanterns out down the line */}
			{MOURNERS.map(([x, z, w], i) => {
				const out = gust > (i + 0.5) / MOURNERS.length;
				return <Mourner key={i} p={[x, 0, z]} ry={Math.PI + Math.atan2(x, z) * 0.6} look={look * (i % 2 ? 1 : -1) * 0.9 + look * 2.4} woman={w} lantern={out ? 0 : 1} />;
			})}
			{/* snow, falling; the gust drives it sideways */}
			{flakes.map((f, i) => {
				const drift = gust > 0 && gust < 1.2 ? gust * 14 : 0;
				const y = ((f.y - t * 0.6 * f.s) % 6 + 6) % 6;
				return (
					<mesh key={i} position={[((f.x + drift + t * 0.2 + 8) % 16) - 8, y, f.z]} material={m.snowFlake}>
						<boxGeometry args={[0.03, 0.03, 0.03]} />
					</mesh>
				);
			})}
		</group>
	);
};

// ------------------------------------------------------------------ SICK
/** vial: 0..1 how far it has rolled along the sill; twitch: 0..1 the hand */
export const Sick: React.FC<{t: number; vial: number; twitch: number; lean: number}> = ({t, vial, twitch, lean}) => {
	const m = useM();
	return (
		<group>
			<Room at={SICK} w={3.6} d={3.6} />
			<group position={SICK}>
				{/* the bed against the back wall; his shape under the quilt; his hand on it */}
				<Box p={[-0.4, 0.25, -1.0]} s={[1.0, 0.5, 2.0]} m={m.bed} />
				<Box p={[-0.4, 0.55, -1.0]} s={[0.95, 0.1, 1.95]} m={m.sheet} />
				<Box p={[-0.4, 0.66, -1.7]} s={[0.6, 0.12, 0.3]} m={m.sheet} />
				<mesh position={[-0.4, 0.7, -0.85]} scale={[1, 0.45, 1]} material={m.quilt}>
					<boxGeometry args={[0.9, 0.3, 1.45, 4, 2, 6]} />
				</mesh>
				<mesh position={[-0.35, 0.78, -1.55]} scale={[1.1, 0.7, 1.2]} material={m.face}>
					<icosahedronGeometry args={[0.12, 1]} />
				</mesh>
				<group position={[0.0, 0.77, -0.95]} rotation={[0, 0.3, twitch * 0.25 * Math.sin(t * 40)]}>
					<Box p={[0, 0, 0]} s={[0.07, 0.03, 0.14]} m={m.hand} />
					{[-0.025, -0.008, 0.009, 0.026].map((x) => (
						<Box key={x} p={[x, -0.005, 0.09 + twitch * 0.01]} s={[0.012, 0.012, 0.05]} m={m.hand} r={[twitch * 0.5, 0, 0]} />
					))}
				</group>
				{/* the window on the right wall; its sill; the vial rolling towards the bed */}
				<Box p={[1.7, 1.4, -0.6]} s={[0.04, 0.7, 0.6]} m={m.black} />
				<Box p={[1.62, 1.03, -0.6]} s={[0.16, 0.05, 0.75]} m={m.wood} />
				<group position={[1.62, 1.09, -0.32 - vial * 0.55]} rotation={[vial * 9, 0, Math.PI / 2]}>
					<mesh material={m.glass}>
						<cylinderGeometry args={[0.018, 0.018, 0.08, 6]} />
					</mesh>
				</group>
				{/* a candle on a stool by the bed */}
				<Box p={[0.65, 0.25, -1.4]} s={[0.3, 0.5, 0.3]} m={m.darkWood} />
				<Candle p={[0.65, 0.5, -1.4]} lean={lean} t={t} seed={1} />
			</group>
		</group>
	);
};

// ------------------------------------------------------------------ TABLE
/** lean: 0..1 flames lean to the empty chair; scrape: 0..1 it slides back; shadow: 0..1; look: heads turn */
export const Table: React.FC<{t: number; lean: number; scrape: number; shadow: number; look: number; fire: number}> = ({t, lean, scrape, shadow, look, fire}) => {
	const m = useM();
	m.shadow.opacity = shadow * 0.9;
	const empty: V3 = [0, 0, -0.95 - scrape * 0.2];
	return (
		<group>
			<Room at={TABLE} w={5} d={4.4} />
			<group position={TABLE}>
				{/* the hearth on the left wall */}
				<Box p={[-2.3, 0.6, -0.4]} s={[0.4, 1.2, 1.4]} m={m.stone} />
				<Box p={[-2.15, 0.35, -0.4]} s={[0.12, 0.5, 0.8]} m={m.black} />
				<mesh position={[-2.08, 0.3 + 0.03 * Math.sin(t * 9), -0.4]} material={m.fire} scale={[1, fire, 1]}>
					<coneGeometry args={[0.18, 0.4, 6]} />
				</mesh>
				{/* the table, pewter plates, five candles */}
				<Box p={[0, 0.74, 0]} s={[1.0, 0.06, 1.7]} m={m.wood} />
				{[[-0.42, -0.75], [0.42, -0.75], [-0.42, 0.75], [0.42, 0.75]].map(([x, z], i) => (
					<Box key={i} p={[x, 0.36, z]} s={[0.07, 0.72, 0.07]} m={m.darkWood} />
				))}
				{[[-0.28, -0.4], [0.28, -0.4], [-0.28, 0.4], [0.28, 0.4], [0, -0.7]].map(([x, z], i) => (
					<mesh key={i} position={[x, 0.775, z]} material={m.pewter}>
						<cylinderGeometry args={[0.1, 0.1, 0.01, 8]} />
					</mesh>
				))}
				{[[-0.15, -0.1], [0.15, -0.1], [0, 0.2], [-0.15, 0.45], [0.15, 0.45]].map(([x, z], i) => {
					// every flame leans towards the empty chair at the head of the table (-z)
					return <Candle key={i} p={[x, 0.77, z]} lean={-lean * 1.1 * Math.sign(x || 0.001) * 0.25} t={t} seed={i + 3} />;
				})}
				{/* flames also tip towards -z: done by rotating the whole candle group a little */}
				{/* the family: two on each side; the empty chair at the head */}
				<Seated p={[-0.75, 0, -0.35]} ry={Math.PI / 2} look={look * 0.9} />
				<Seated p={[-0.75, 0, 0.4]} ry={Math.PI / 2} look={look * 0.7} woman />
				<Seated p={[0.75, 0, -0.35]} ry={-Math.PI / 2} look={-look * 0.9} woman small />
				<Seated p={[0.75, 0, 0.4]} ry={-Math.PI / 2} look={-look * 0.7} small />
				<Chair p={empty} ry={0} />
				{/* the shadow of someone sitting in the empty chair, on the back wall */}
				<mesh position={[0.15, 1.05, -2.08]} material={m.shadow}>
					<planeGeometry args={[0.9, 1.35]} />
				</mesh>
			</group>
		</group>
	);
};

// ------------------------------------------------------------------ KIDS
/** pull: 0..1 the quilt slides off the bed (0..0.6 slow, then yanked to the floor and towards the door) */
export const Kids: React.FC<{pull: number; curl: number}> = ({pull, curl}) => {
	const m = useM();
	const slide = Math.min(pull, 0.6) / 0.6;
	const yank = Math.max(0, (pull - 0.6) / 0.4);
	return (
		<group>
			<Room at={KIDS} w={3.4} d={3.4} win={0.6} />
			<group position={KIDS}>
				{[-0.85, 0.85].map((x, i) => (
					<group key={x} position={[x, 0, -0.9]}>
						<Box p={[0, 0.2, 0]} s={[0.8, 0.4, 1.6]} m={m.bed} />
						<Box p={[0, 0.44, 0]} s={[0.76, 0.08, 1.56]} m={m.sheet} />
						<Box p={[0, 0.52, -0.62]} s={[0.5, 0.1, 0.24]} m={m.sheet} />
						<mesh position={[0, 0.56, -0.05]} scale={[1, i === 0 ? 0.5 - curl * 0.15 : 0.5, i === 0 ? 1 - curl * 0.3 : 1]} material={m.sheet}>
							<boxGeometry args={[0.6, 0.24, 1.0, 3, 2, 4]} />
						</mesh>
						{/* the quilt on the near-left bed leaves it */}
						{i === 0 ? (
							<group position={[0, 0.62 - yank * 0.6, 0.0 + slide * 0.5 + yank * 1.9]} rotation={[-slide * 0.5 - yank * 1.07, 0, yank * 0.2]}>
								<Box p={[0, 0, 0]} s={[0.84, 0.03, 1.3]} m={m.quilt} />
							</group>
						) : (
							<Box p={[0, 0.62, 0.0]} s={[0.84, 0.03, 1.3]} m={m.quilt} />
						)}
					</group>
				))}
			</group>
		</group>
	);
};

// ------------------------------------------------------------------ OUT
/** marks: 0..1 how far along the wall the scratches have come; corn: 0..1 the wave through the corn */
export const Outside: React.FC<{t: number; marks: number; corn: number}> = ({t, marks, corn}) => {
	const m = useM();
	const stalks = useMemo(() => {
		const r = rng(2304);
		const out: {x: number; z: number; h: number; ph: number}[] = [];
		for (let row = 0; row < 9; row++) for (let k = 0; k < 18; k++) out.push({x: 2.2 + row * 0.6 + r() * 0.1, z: -7 + k * 0.55 + r() * 0.2, h: 1.7 + r() * 0.5, ph: r() * 6});
		return out;
	}, []);
	const SCR = 9;
	return (
		<group position={OUT}>
			<mesh material={m.nightSky}>
				<sphereGeometry args={[60, 12, 8]} />
			</mesh>
			<mesh position={[30, 26, -40]} material={m.moon}>
				<circleGeometry args={[2.2, 16]} />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={m.dirt}>
				<planeGeometry args={[40, 40, 20, 20]} />
			</mesh>
			{/* the cabin's long wall (x = 0 plane, facing +x), a lit window, the corner */}
			<Box p={[-0.15, 1.4, -1]} s={[0.3, 2.8, 10]} m={m.logs} />
			<Box p={[-0.15, 3.2, -1]} s={[1.4, 0.6, 10.4]} m={m.darkWood} r={[0, 0, 0.2]} />
			<Box p={[0.01, 1.45, 1.6]} s={[0.02, 0.6, 0.5]} m={m.window} />
			{/* scratches on the logs, appearing ahead of the camera */}
			{Array.from({length: SCR}, (_, i) => {
				if (marks < i / SCR) return null;
				return (
					<mesh key={i} position={[0.02, 0.7 + (i % 3) * 0.35, -4.6 + i * 0.75]} rotation={[0, Math.PI / 2, 0.3 * ((i % 2) - 0.5)]} material={m.scratch}>
						<planeGeometry args={[0.32, 0.42]} />
					</mesh>
				);
			})}
			{/* the cornfield: a wave of disturbance runs through it towards the house */}
			{stalks.map((s, i) => {
				const front = 7.6 - corn * 5.8; // x of the moving disturbance
				const near = Math.exp(-((s.x - front) ** 2) / 0.25) * Math.exp(-((s.z + 1.2) ** 2) / 1.2);
				const sway = Math.sin(t * 1.3 + s.ph) * 0.03 + near * 0.5 * Math.sin(t * 22 + s.ph);
				return (
					<group key={i} position={[s.x, 0, s.z]} rotation={[sway, 0, sway * 0.6]}>
						<Box p={[0, s.h / 2, 0]} s={[0.04, s.h, 0.04]} m={m.stalk} />
						<Box p={[0.12, s.h * 0.6, 0]} s={[0.3, 0.02, 0.06]} m={m.leaf} r={[0, s.ph, -0.4]} />
						<Box p={[-0.12, s.h * 0.75, 0]} s={[0.3, 0.02, 0.06]} m={m.leaf} r={[0, s.ph, 0.4]} />
					</group>
				);
			})}
		</group>
	);
};

// ------------------------------------------------------------------ POST
/** groove: 0..1 how far the scratch has drawn itself down the post */
export const Post: React.FC<{t: number; groove: number; lean: number}> = ({t, groove, lean}) => {
	const m = useM();
	return (
		<group>
			<Room at={POST} w={3.4} d={3.4} />
			<group position={POST}>
				<Box p={[0.3, 0.25, -0.9]} s={[1.0, 0.5, 2.0]} m={m.bed} />
				<Box p={[0.3, 0.55, -0.9]} s={[0.95, 0.1, 1.95]} m={m.sheet} />
				<mesh position={[0.3, 0.7, -0.75]} scale={[1, 0.45, 1]} material={m.quilt}>
					<boxGeometry args={[0.9, 0.3, 1.45, 4, 2, 6]} />
				</mesh>
				{/* a carved bedpost at the foot of the bed, near the lens */}
				<group position={[-0.2, 0, 0.1]}>
					<Box p={[0, 0.65, 0]} s={[0.1, 1.3, 0.1]} m={m.wood} />
					<mesh position={[0, 1.36, 0]} material={m.wood}>
						<sphereGeometry args={[0.08, 8, 6]} />
					</mesh>
					{[0.4, 0.9].map((y) => (
						<mesh key={y} position={[0, y, 0]} material={m.darkWood}>
							<cylinderGeometry args={[0.07, 0.07, 0.04, 8]} />
						</mesh>
					))}
					{groove > 0 && (
						<mesh position={[0, 1.12 - groove * 0.2, 0.052]} material={m.scratch} scale={[1, groove, 1]}>
							<planeGeometry args={[0.05, 0.4]} />
						</mesh>
					)}
				</group>
				<Box p={[-0.75, 0.3, -0.5]} s={[0.3, 0.6, 0.3]} m={m.darkWood} />
				<Candle p={[-0.75, 0.6, -0.5]} lean={lean} t={t} seed={9} />
			</group>
		</group>
	);
};
