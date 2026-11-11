// Episode 19 world: "Santelmo" (folklore and science). Two sets:
// THE PADDIES: flooded rice fields at night, planted in rows of young palay; raised pilapil paths in
// a grid (the farmer walks the main one, along z at x = 0); an irrigation canal along x = CANAL_X
// with a pump; a nipa hut; coconut palms and hills on the horizon; clouds over a dim moon.
// THE STORM: a sailing ship at sea in a storm, a blue glow clinging to its mast tips (St. Elmo's fire,
// the real phenomenon), far to the side of the paddies at SHIP.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {ps1, rng} from '../ps1';
import {SNAP6} from '../ep01/world';

const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 20, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 20, SNAP6);

type V3 = [number, number, number];
export const CANAL_X = -7;
export const PATH_Y = 0.35;
export const HUT: V3 = [14, 0, -42];
export const PUMP: V3 = [CANAL_X + 2.2, 0, -18];
export const SHIP: V3 = [600, 0, 0];

const seg = (v: number) => Math.min(14, Math.max(1, Math.ceil(v / 0.5)));
export const Box: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={[s[0], s[1], s[2], seg(s[0]), seg(s[1]), seg(s[2])]} />
	</mesh>
);

const useMats = () =>
	useMemo(
		() => ({
			water: lam('#16222a'),
			canal: new THREE.MeshLambertMaterial({color: '#101a20', transparent: true, opacity: 0.78}),
			deep: bas('#ff8a30'),
			mud: lam('#3a2e22'),
			path: lam('#4a3a2a'),
			palay: lam('#ffffff', {vertexColors: true}),
			scorched: lam('#1e140c'),
			nipa: lam('#7a6a46'),
			nipaDark: lam('#4a3e28'),
			bamboo: lam('#6a5a34'),
			pump: lam('#3a4a5a'),
			rust: lam('#6a3a22'),
			palm: lam('#3a3226'),
			frond: lam('#1e2a18'),
			hill: lam('#0e1218'),
			cloud: new THREE.MeshBasicMaterial({color: '#1a2030', transparent: true, opacity: 0.85, fog: false}),
			moon: new THREE.MeshBasicMaterial({color: '#c8c4b0', fog: false}),
			sky: new THREE.MeshBasicMaterial({color: '#070a12', side: THREE.BackSide, fog: false}),
			skyDawn: new THREE.MeshBasicMaterial({color: '#a8a8a4', side: THREE.BackSide, fog: false}),
			// the farmer
			skin: lam('#7a5640'),
			hair: lam('#0e0c0c'),
			shirt: lam('#7a8a9a'),
			shirtIn: lam('#a8b4c0'),
			seam: lam('#d8e0e8'),
			shorts: lam('#2a2e24'),
			hat: lam('#a88a50'),
			torch: bas('#fff4d8'),
			slipper: lam('#2a4a8a'),
			strap: lam('#e8e8e8'),
			// the fire
			core: new THREE.MeshBasicMaterial({color: '#fff0b0', fog: false}),
			flame: new THREE.MeshBasicMaterial({color: '#ff9a30', transparent: true, opacity: 0.8, depthWrite: false, fog: false, side: THREE.DoubleSide}),
			halo: new THREE.MeshBasicMaterial({color: '#ff7a20', transparent: true, opacity: 0.22, depthWrite: false, fog: false}),
			// the ship
			sea: lam('#0e1a24'),
			hull: lam('#2a1e16'),
			mast: lam('#3a2a1e'),
			sail: lam('#8a8474'),
			elmo: new THREE.MeshBasicMaterial({color: '#9ab8ff', transparent: true, opacity: 0.85, depthWrite: false, fog: false}),
			rain: new THREE.MeshBasicMaterial({color: '#a8b8d0', transparent: true, opacity: 0.35, depthWrite: false, fog: false}),
		}),
		[],
	);
export type Mats = ReturnType<typeof useMats>;
const Ctx = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(Ctx)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMats()}>{children}</Ctx.Provider>;

const SCORCH: V3 = [3.5, 0, -14];

/** Young palay in rows: three blades per tuft, merged into one mesh with vertex colours. scorched: the burnt circle at dawn. */
const Palay: React.FC<{t: number}> = ({t}) => {
	const m = useM();
	const {geo, tips, base} = useMemo(() => {
		const r = rng(1901);
		const pos: number[] = [], col: number[] = [], tips: number[] = [];
		const lo = new THREE.Color('#1a2a14'), hi = new THREE.Color('#5a8a3a');
		const burnt = new THREE.Color('#2a1a10');
		for (let x = -40; x < 40; x += 0.75)
			for (let z = -70; z < 20; z += 0.75) {
				if (Math.abs(x) < 0.7 || Math.abs(x - CANAL_X) < 2.2 || Math.abs(((z + 6) % 12 + 12) % 12) < 0.35) continue; // paths and canal
				if (Math.abs(x - 20) < 0.35 || Math.abs(x + 20) < 0.35) continue;
				const sc = Math.hypot(x - SCORCH[0], z - SCORCH[2]) < 1.8;
				for (let b = 0; b < 3; b++) {
					const h = (0.45 + r() * 0.3) * (sc ? 0.3 : 1);
					const a = r() * Math.PI, w = 0.03;
					const bx = x + (r() - 0.5) * 0.15, bz = z + (r() - 0.5) * 0.15;
					const lx = (r() - 0.5) * 0.25, lz = (r() - 0.5) * 0.25;
					pos.push(bx - Math.cos(a) * w, 0, bz - Math.sin(a) * w, bx + Math.cos(a) * w, 0, bz + Math.sin(a) * w, bx + lx, h, bz + lz);
					const tip = sc ? burnt : lo.clone().lerp(hi, 0.5 + r() * 0.5);
					const bot = sc ? burnt : lo;
					col.push(bot.r, bot.g, bot.b, bot.r, bot.g, bot.b, tip.r, tip.g, tip.b);
					tips.push(pos.length / 3 - 1);
				}
			}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
		g.computeVertexNormals();
		return {geo: g, tips, base: Float32Array.from(pos)};
	}, []);
	const p = geo.attributes.position as THREE.BufferAttribute;
	for (const i of tips) {
		const bx = base[i * 3], bz = base[i * 3 + 2];
		p.setX(i, bx + Math.sin(t * 1.2 + bx * 0.3 + bz * 0.2) * 0.05);
	}
	p.needsUpdate = true;
	return <mesh geometry={geo} material={m.palay} />;
};

/** The paddies, paths, canal, hut, pump, palms, hills, sky. dawn: daylight sky and the scorched circle. deepGlow: a glow under the canal water. */
export const Paddies: React.FC<{t: number; dawn: boolean; deepGlow: number; tsinelas: boolean}> = ({t, dawn, deepGlow, tsinelas}) => {
	const m = useM();
	const palms = useMemo(() => {
		const r = rng(1902);
		return Array.from({length: 22}, () => ({x: (r() < 0.5 ? -1 : 1) * (45 + r() * 60), z: -150 + r() * 160, h: 8 + r() * 5, ry: r() * 6, lean: (r() - 0.5) * 0.25}));
	}, []);
	return (
		<group>
			<mesh material={dawn ? m.skyDawn : m.sky}>
				<sphereGeometry args={[400, 12, 8]} />
			</mesh>
			{!dawn && (
				<>
					<mesh position={[80, 110, -260]} material={m.moon}>
						<circleGeometry args={[9, 14]} />
					</mesh>
					{[[60, 100, -255, 50, 10], [110, 120, -255, 40, 8], [-40, 90, -250, 70, 12]].map(([x, y, z, w, h], i) => (
						<mesh key={i} position={[x + Math.sin(t * 0.05 + i) * 4, y, z]} material={m.cloud}>
							<planeGeometry args={[w, h]} />
						</mesh>
					))}
				</>
			)}
			{/* the flooded field */}
			<mesh position={[0, 0.02, -25]} rotation={[-Math.PI / 2, 0, 0]} material={m.water}>
				<planeGeometry args={[100, 110, 50, 55]} />
			</mesh>
			<Palay t={t} />
			{/* the pilapil grid: the main path along z, cross paths every 12 m */}
			<Box p={[0, PATH_Y / 2, -25]} s={[1.0, PATH_Y, 110]} m={m.path} />
			{[-20, 20].map((x) => (
				<Box key={x} p={[x, PATH_Y / 2, -25]} s={[0.7, PATH_Y, 110]} m={m.path} />
			))}
			{Array.from({length: 10}, (_, i) => (
				<Box key={`c${i}`} p={[0, PATH_Y / 2, 18 - i * 12]} s={[80, PATH_Y, 0.7]} m={m.path} />
			))}
			{/* the canal, its banks, a glow deep under the water */}
			<mesh position={[CANAL_X, -0.3, -25]} rotation={[-Math.PI / 2, 0, 0]} material={m.canal}>
				<planeGeometry args={[3, 110, 6, 110]} />
			</mesh>
			{[-1.7, 1.7].map((dx) => (
				<Box key={dx} p={[CANAL_X + dx, 0.15, -25]} s={[0.5, 0.5, 110]} m={m.mud} />
			))}
			<Box p={[CANAL_X, -1.4, -25]} s={[3, 0.1, 110]} m={m.mud} />
			{deepGlow > 0 && (
				<mesh position={[CANAL_X + 0.2, -1.0, -21]} scale={deepGlow} material={m.deep}>
					<sphereGeometry args={[0.18, 8, 6]} />
				</mesh>
			)}
			{/* the irrigation pump on the bank */}
			<group position={PUMP}>
				<Box p={[0, 0.35, 0]} s={[0.8, 0.6, 0.6]} m={m.pump} />
				<Box p={[-0.9, 0.2, 0]} s={[1.2, 0.12, 0.12]} m={m.rust} />
				<Box p={[0, 0.75, 0]} s={[0.3, 0.2, 0.3]} m={m.rust} />
			</group>
			{/* the nipa hut on stilts */}
			<group position={HUT}>
				{[-1.4, 1.4].map((x) => [-1.2, 1.2].map((z) => <Box key={`${x}${z}`} p={[x, 0.8, z]} s={[0.15, 1.6, 0.15]} m={m.bamboo} />))}
				<Box p={[0, 1.65, 0]} s={[3.2, 0.12, 2.8]} m={m.bamboo} />
				<Box p={[0, 2.5, 0]} s={[3.0, 1.6, 2.6]} m={m.nipaDark} />
				<mesh position={[0, 3.9, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.5, 1, 1.3]} material={m.nipa}>
					<coneGeometry args={[2.6, 1.6, 4, 1]} />
				</mesh>
			</group>
			{/* a pair of wet tsinelas on the path by the canal */}
			{tsinelas && (
				<group position={[CANAL_X + 1.7, 0.41, -18.6]}>
					{[[-0.07, 0], [0.08, 0.05]].map(([x, z], i) => (
						<group key={i} position={[x, 0, z]} rotation={[0, 0.3 + i * 0.4, 0]}>
							<Box p={[0, 0.01, 0]} s={[0.09, 0.02, 0.25]} m={m.slipper} />
							<Box p={[0, 0.03, 0.02]} s={[0.07, 0.01, 0.01]} m={m.strap} />
						</group>
					))}
				</group>
			)}
			{palms.map((p, i) => (
				<group key={i} position={[p.x, 0, p.z]} rotation={[0, p.ry, p.lean]}>
					<Box p={[0, p.h / 2, 0]} s={[0.3, p.h, 0.3]} m={m.palm} />
					{Array.from({length: 7}, (_, k) => (
						<group key={k} position={[0, p.h, 0]} rotation={[0, (k / 7) * Math.PI * 2, 0]}>
							<mesh position={[1.1, -0.35, 0]} rotation={[0, 0, -0.55]} material={m.frond}>
								<boxGeometry args={[2.4, 0.05, 0.5]} />
							</mesh>
						</group>
					))}
				</group>
			))}
			{Array.from({length: 8}, (_, i) => (
				<mesh key={`h${i}`} position={[-260 + i * 75, 12, -280]} material={m.hill}>
					<coneGeometry args={[60, 40, 7]} />
				</mesh>
			))}
		</group>
	);
};

/** The santelmo: a ball of fire with a hot core, flickering flame tongues and a glow; scale for shrinking. */
export const Santelmo: React.FC<{t: number; position: V3; scale?: number; seed?: number; core?: boolean}> = ({t, position, scale = 1, seed = 0, core = true}) => {
	const m = useM();
	const tongues = useMemo(() => {
		const r = rng(1904 + seed);
		return Array.from({length: core ? 10 : 16}, (_, i) => ({a: r() * Math.PI * 2, b: core ? (r() - 0.5) * 1.6 : (i < 11 ? (r() - 0.5) * 2.4 : (r() < 0.5 ? -1 : 1) * (1.5 + r() * 0.7)), ph: r() * 6, len: core ? 0.25 + r() * 0.25 : (i < 11 ? 0.12 + r() * 0.26 : 0.06 + r() * 0.08)}));
	}, [seed, core]);
	return (
		<group position={position} scale={scale}>
			{core && (
				<>
					<mesh material={m.core}>
						<icosahedronGeometry args={[0.15, 1]} />
					</mesh>
					<mesh scale={1 + 0.08 * Math.sin(t * 17 + seed)} material={m.flame}>
						<icosahedronGeometry args={[0.23, 1]} />
					</mesh>
					<mesh material={m.halo}>
						<sphereGeometry args={[0.5, 10, 8]} />
					</mesh>
				</>
			)}
			{/* tongues of flame, licking outward and up, flickering */}
			{tongues.map((g, i) => {
				const f = (core ? 0.7 : 0.45) + (core ? 0.5 : 0.8) * Math.abs(Math.sin(t * (8 + i) + g.ph) * Math.sin(t * (3.1 + i * 0.7)));
				return (
					<group key={i} rotation={core ? [g.b, g.a + Math.sin(t * 3 + g.ph) * 0.3, 0] : [g.b, 0, 0]}>
						<mesh position={[0, (core ? 0.12 : 0.17) + (g.len * f) / 2, 0]} scale={[1, f, 1]} material={m.flame}>
							<coneGeometry args={[core ? 0.06 : 0.035, g.len, 4, 1, true]} />
						</mesh>
					</group>
				);
			})}
		</group>
	);
};

/** The farmer: a salakot, a faded shirt, shorts, a flashlight. walk: stride on/off. shirt: 'on' | 'off' (held, inside out) | 'in'. */
export const Farmer: React.FC<{t: number; position: V3; ry: number; walk: boolean; shirt?: 'on' | 'off' | 'in'; look?: number}> = ({t, position, ry, walk, shirt = 'on', look = 0}) => {
	const m = useM();
	const ph = walk ? Math.sin(t * 5.4) * 0.35 : 0;
	return (
		<group position={position} rotation={[0, ry, 0]}>
			{[-1, 1].map((sd) => (
				<group key={sd} position={[sd * 0.1, 0.82, 0]} rotation={[sd * ph, 0, 0]}>
					<Box p={[0, -0.18, 0]} s={[0.14, 0.36, 0.15]} m={m.shorts} />
					<Box p={[0, -0.6, 0]} s={[0.1, 0.46, 0.1]} m={m.skin} />
				</group>
			))}
			<Box p={[0, 1.12, 0]} s={[0.4, 0.58, 0.24]} m={shirt === 'off' ? m.skin : shirt === 'in' ? m.shirtIn : m.shirt} />
			{shirt === 'in' && [-1, 1].map((sd) => <Box key={`s${sd}`} p={[sd * 0.2, 1.12, 0]} s={[0.012, 0.52, 0.25]} m={m.seam} />)}
			{shirt === 'off' ? (
				<group position={[0, 1.5, 0.3]} rotation={[0.2, Math.sin(t * 3) * 0.3, 0]}>
					<Box p={[0, 0, 0]} s={[0.44, 0.5, 0.03]} m={m.shirtIn} />
					<Box p={[0, 0.2, 0.02]} s={[0.06, 0.04, 0.01]} m={m.seam} />
				</group>
			) : (
				<>
					<group position={[0.25, 1.36, 0]} rotation={[-1.0, 0, 0]}>
						<Box p={[0, -0.25, 0]} s={[0.09, 0.5, 0.1]} m={m.skin} />
						<Box p={[0, -0.52, 0]} s={[0.06, 0.06, 0.16]} m={m.torch} />
					</group>
					<group position={[-0.25, 1.36, 0]} rotation={[-ph * 0.8, 0, 0]}>
						<Box p={[0, -0.25, 0]} s={[0.09, 0.5, 0.1]} m={m.skin} />
					</group>
				</>
			)}
			<group position={[0, 1.56, 0]} rotation={[-look * 0.5, look * 0.6, 0]}>
				<Box p={[0, 0, 0]} s={[0.2, 0.24, 0.21]} m={m.skin} />
				<mesh position={[0, 0.16, 0]} material={m.hat}>
					<coneGeometry args={[0.3, 0.16, 8]} />
				</mesh>
			</group>
		</group>
	);
};

/** The storm at sea: a sailing ship rolling in the waves, St. Elmo's fire on its mast tips. */
export const Storm: React.FC<{t: number}> = ({t}) => {
	const m = useM();
	const roll = Math.sin(t * 0.9) * 0.12;
	const drops = useMemo(() => {
		const r = rng(1903);
		return Array.from({length: 120}, () => ({x: (r() - 0.5) * 30, z: (r() - 0.5) * 30, y0: r() * 14, s: 10 + r() * 4}));
	}, []);
	return (
		<group position={SHIP}>
			<mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.sea}>
				<planeGeometry args={[300, 300, 30, 30]} />
			</mesh>
			<group rotation={[roll * 0.4, 0, roll]} position={[0, Math.sin(t * 1.3) * 0.3, 0]}>
				<Box p={[0, 0.6, 0]} s={[3, 1.6, 12]} m={m.hull} />
				{[-3, 0.5, 3.5].map((z, i) => (
					<group key={z} position={[0, 0, z]}>
						<Box p={[0, 6 + i, 0]} s={[0.22, 11 + i * 2, 0.22]} m={m.mast} />
						<Box p={[0, 9 + i, 0]} s={[5, 0.15, 0.15]} m={m.mast} />
						<Box p={[0, 7 + i, 0.1]} s={[4.4, 3.4, 0.05]} m={m.sail} />
						{/* St. Elmo's fire: a blue glow clinging to the mast tip and the yard ends */}
						{[[0, 11.6 + i * 2], [-2.5, 9 + i], [2.5, 9 + i]].map(([x, y], k) => (
							<mesh key={k} position={[x, y, 0]} scale={0.8 + 0.3 * Math.abs(Math.sin(t * 13 + k + i))} material={m.elmo}>
								<icosahedronGeometry args={[0.22, 1]} />
							</mesh>
						))}
					</group>
				))}
			</group>
			{drops.map((d, i) => (
				<mesh key={i} position={[d.x, ((d.y0 - t * d.s) % 14 + 14) % 14, d.z]} material={m.rain}>
					<boxGeometry args={[0.02, 0.6, 0.02]} />
				</mesh>
			))}
		</group>
	);
};
