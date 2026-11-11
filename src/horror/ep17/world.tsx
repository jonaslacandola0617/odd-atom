// Episode 17 world: "The Road That Wouldn't End" (folklore: the tikbalang). One consistent set: a
// barrio dirt road at night between towering bamboo; along it, in order, a sari-sari store
// (TINDAHAN NI ALING NENA, an invented name), the balete at the bend (Episode 11's tree, mirrored to
// the left), a small chapel and a waiting shed; a tricycle with its rider; a big moon.
//
// Layout (metres, y up). The road runs along z, x -2.5..2.5; the tricycle rides the right side
// (x = TX) heading -z. Store at STORE (right), balete at z = -45 (left), chapel at z = -65 (left),
// waiting shed at z = -82 (right). Bamboo groves line both sides except at the landmarks.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
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
export const TX = 0.9;
export const STORE: V3 = [4.6, 0, -20];
export const BALETE_Z = -45;
export const CHAPEL: V3 = [-7, 0, -65];
export const SHED: V3 = [4.6, 0, -82];
export const STOP_Z = -38; // where the tricycle stops
export const TIK: V3 = [3.3, 0, -44.2]; // where it squats, in the bamboo ahead and to the right

/** The price list on the store's board: different on every pass (a hidden detail). */
const PRICES = [
	['KAPE 10', 'ITLOG 9', 'YELO 5', 'LOAD 20'],
	['KAPE 12', 'ITLOG 8', 'YELO 5', 'KANDILA 15'],
	['KAPE 10', 'ITLOG 9', 'ASIN 3', 'KANDILA 15'],
];

const useMats = () =>
	useMemo(() => {
		const mud = tex(16, 16, (g) => {
			g.fillStyle = '#4a3c2c';
			g.fillRect(0, 0, 16, 16);
			const r = rng(1701);
			for (let i = 0; i < 50; i++) {
				g.fillStyle = r() < 0.5 ? '#3a2e22' : '#5a4a36';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1 + Math.floor(r() * 2), 1);
			}
			g.fillStyle = '#2e241a';
			g.fillRect(5, 0, 1, 16);
			g.fillRect(10, 0, 1, 16);
		}, [3, 60]);
		const sign = tex(64, 16, (g) => {
			g.fillStyle = '#e8d8a8';
			g.fillRect(0, 0, 64, 16);
			g.fillStyle = '#b02020';
			g.font = 'bold 6px "DejaVu Sans", sans-serif';
			g.textAlign = 'center';
			g.textBaseline = 'middle';
			g.fillText('TINDAHAN NI', 32, 5);
			g.fillStyle = '#1a3a8a';
			g.font = 'bold 7px "DejaVu Sans", sans-serif';
			g.fillText('ALING NENA', 32, 12);
		});
		const price = (rows: string[]) =>
			lam('#ffffff', {
				map: tex(32, 40, (g) => {
					g.fillStyle = '#1e2a1e';
					g.fillRect(0, 0, 32, 40);
					g.fillStyle = '#e8e8d8';
					g.font = 'bold 6px "DejaVu Sans Mono", monospace';
					g.textAlign = 'left';
					rows.forEach((r, i) => g.fillText(r, 2, 8 + i * 9));
				}),
			});
		const sky = new THREE.MeshBasicMaterial({
			side: THREE.BackSide,
			fog: false,
			map: tex(4, 64, (g) => {
				const gr = g.createLinearGradient(0, 0, 0, 64);
				gr.addColorStop(0, '#020308');
				gr.addColorStop(0.45, '#0a1020');
				gr.addColorStop(0.5, '#141c2c');
				gr.addColorStop(1, '#141c2c');
				g.fillStyle = gr;
				g.fillRect(0, 0, 4, 64);
			}),
		});
		const skyDawn = new THREE.MeshBasicMaterial({
			side: THREE.BackSide,
			fog: false,
			map: tex(4, 64, (g) => {
				const gr = g.createLinearGradient(0, 0, 0, 64);
				gr.addColorStop(0, '#5a6274');
				gr.addColorStop(0.45, '#a8a4a0');
				gr.addColorStop(0.5, '#d8b898');
				gr.addColorStop(1, '#d8b898');
				g.fillStyle = gr;
				g.fillRect(0, 0, 4, 64);
			}),
		});
		return {
			mud: lam('#ffffff', {map: mud}),
			ground: lam('#2a3420'),
			culm: lam('#6a7a3a'),
			culmDark: lam('#4a5a2a'),
			leaf: lam('#2e4422'),
			wood: lam('#5a4230'),
			woodDark: lam('#3a2a1e'),
			tin: lam('#7a7a70'),
			rust: lam('#6a3a22'),
			sign: lam('#ffffff', {map: sign}),
			prices: PRICES.map(price),
			grille: lam('#2a2a2a'),
			bulbOn: bas('#ffd890'),
			bulbOff: lam('#4a4438'),
			white: lam('#c8c4b8'),
			cross: lam('#d8d4c8'),
			concrete: lam('#7a786e'),
			bench: lam('#5a4a3a'),
			sky,
			skyDawn,
			moon: new THREE.MeshBasicMaterial({color: '#f0ecd8', fog: false}),
			ember: bas('#ff7a20'),
			smoke: new THREE.MeshBasicMaterial({color: '#8a8a8a', transparent: true, opacity: 0.18, depthWrite: false}),
			trike: lam('#1e4a8a'),
			trikeRed: lam('#9a2020'),
			chrome: lam('#b8bcc0'),
			tire: lam('#141414'),
			seat: lam('#2a2420'),
			lampOn: bas('#fff4d8'),
			lampOff: lam('#5a5a50'),
			skin: lam('#7a5640'),
			hair: lam('#0e0c0c'),
			shirt: lam('#c8a030'),
			shirtIn: lam('#d8c890'),
			seam: lam('#f0e8c8'),
			pants: lam('#2a2e3a'),
			slipper: lam('#2a4a8a'),
			hoofprint: lam('#1e160e'),
			rain: new THREE.MeshBasicMaterial({color: '#a8b8d0', transparent: true, opacity: 0.35, depthWrite: false, fog: false}),
			flare: new THREE.MeshBasicMaterial({color: '#fff0c8', transparent: true, opacity: 0.5, depthWrite: false, fog: false}),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
const Ctx = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(Ctx)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMats()}>{children}</Ctx.Provider>;

// segments: the PS1 shader lights per vertex, so big faces need vertices where the light lands
const seg = (v: number) => Math.min(12, Math.max(1, Math.ceil(v / 0.5)));
export const Box: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={[s[0], s[1], s[2], seg(s[0]), seg(s[1]), seg(s[2])]} />
	</mesh>
);

const clear = (x: number, z: number) => {
	// keep bamboo off the landmarks
	if (Math.abs(z - STORE[2]) < 6 && x > 0) return false;
	if (Math.abs(z - BALETE_Z) < 9 && x < 0) return false;
	if (Math.abs(z - CHAPEL[2]) < 6 && x < 0) return false;
	if (Math.abs(z - SHED[2]) < 4 && x > 0) return false;
	if (Math.abs(z - TIK[2]) < 1.6 && x > 0 && x < 5.5) return false; // the gap where it squats
	return true;
};

/** Bamboo groves: tall culms in clumps, leaning out over the road, leaf masses at the top. One merged mesh each. */
const Bamboo: React.FC<{t: number}> = ({t}) => {
	const m = useM();
	const {culms, culmsDark, leaves} = useMemo(() => {
		const r = rng(1702);
		const a: THREE.BufferGeometry[] = [], b: THREE.BufferGeometry[] = [], c: THREE.BufferGeometry[] = [];
		for (let k = 0; k < 140; k++) {
			const sd = r() < 0.5 ? -1 : 1;
			const cx = sd * (3.4 + r() * 9), cz = -130 + r() * 150;
			if (!clear(cx, cz)) continue;
			const n = 5 + Math.floor(r() * 6);
			for (let i = 0; i < n; i++) {
				const h = 7 + r() * 5;
				const lean = -sd * (0.08 + r() * 0.22); // toward the road
				const g = new THREE.BoxGeometry(0.09, h, 0.09, 1, 10, 1);
				g.translate(0, h / 2, 0);
				g.rotateZ(lean);
				g.rotateY(r() * 0.4);
				g.translate(cx + (r() - 0.5) * 0.9, 0, cz + (r() - 0.5) * 0.9);
				(i % 2 ? a : b).push(g);
				const top = new THREE.Vector3(Math.sin(-lean) * h, Math.cos(lean) * h, 0);
				const lg = new THREE.BoxGeometry(1.6 + r(), 0.5, 1.4 + r());
				lg.rotateY(r() * 3);
				lg.translate(cx + top.x, top.y - 0.5, cz + (r() - 0.5));
				c.push(lg);
			}
		}
		return {culms: mergeGeometries(a), culmsDark: mergeGeometries(b), leaves: mergeGeometries(c)};
	}, []);
	const sway = Math.sin(t * 0.6) * 0.004;
	return (
		<group rotation={[0, 0, sway]}>
			<mesh geometry={culms} material={m.culm} />
			<mesh geometry={culmsDark} material={m.culmDark} />
			<mesh geometry={leaves} material={m.leaf} />
		</group>
	);
};

/** The sari-sari store: wooden front, tin roof, grilled window, hand-painted sign, price board, a bulb. */
export const Store: React.FC<{pass: number; bulb: number; figure?: React.ReactNode}> = ({pass, bulb, figure}) => {
	const m = useM();
	return (
		<group position={STORE}>
			<Box p={[1.6, 1.4, 0]} s={[3.2, 2.8, 4.2]} m={m.wood} />
			<Box p={[1.6, 3.0, 0]} s={[3.8, 0.08, 4.8]} m={m.tin} r={[0, 0, -0.12]} />
			{/* the grilled window onto the road, lit from inside */}
			<Box p={[-0.02, 1.35, 0]} s={[0.04, 1.0, 2.2]} m={bulb > 0.5 ? m.bulbOn : m.woodDark} />
			{Array.from({length: 9}, (_, i) => (
				<Box key={i} p={[-0.06, 1.35, -1.0 + i * 0.25]} s={[0.03, 1.0, 0.03]} m={m.grille} />
			))}
			<Box p={[-0.15, 0.8, 0]} s={[0.3, 0.06, 2.4]} m={m.woodDark} />
			{/* the sign above the window */}
			<mesh position={[-0.06, 2.3, 0]} rotation={[0, -Math.PI / 2, 0]} material={m.sign}>
				<planeGeometry args={[2.6, 0.65]} />
			</mesh>
			{/* the price board beside it: different every pass */}
			<mesh position={[-0.06, 1.35, 1.65]} rotation={[0, -Math.PI / 2, 0]} material={m.prices[pass % 3]}>
				<planeGeometry args={[0.55, 0.7]} />
			</mesh>
			{/* the bulb under the eave */}
			<mesh position={[-0.5, 2.65, 0]} material={bulb > 0.5 ? m.bulbOn : m.bulbOff}>
				<sphereGeometry args={[0.07, 6, 5]} />
			</mesh>
			{/* a bench out front */}
			<Box p={[-0.9, 0.42, -1.4]} s={[0.4, 0.06, 1.2]} m={m.bench} />
			{figure}
		</group>
	);
};

export const Chapel: React.FC = () => {
	const m = useM();
	return (
		<group position={CHAPEL}>
			<Box p={[0, 1.8, 0]} s={[4, 3.6, 5]} m={m.white} />
			<mesh position={[0, 4.1, 0]} rotation={[0, 0, 0]} scale={[1, 1, 1]} material={m.tin}>
				<coneGeometry args={[3.4, 1.4, 4, 1]} />
			</mesh>
			<Box p={[2.02, 1.2, 0]} s={[0.05, 2.2, 1.2]} m={m.woodDark} />
			<Box p={[0, 5.4, 0]} s={[0.12, 1.2, 0.12]} m={m.cross} />
			<Box p={[0, 5.6, 0]} s={[0.12, 0.12, 0.6]} m={m.cross} />
		</group>
	);
};

export const Shed: React.FC = () => {
	const m = useM();
	return (
		<group position={SHED}>
			<Box p={[0.8, 1.2, 0]} s={[0.2, 2.4, 3]} m={m.concrete} />
			<Box p={[0.2, 2.5, 0]} s={[1.8, 0.12, 3.4]} m={m.concrete} />
			<Box p={[0.3, 0.45, 0]} s={[0.4, 0.08, 2.6]} m={m.bench} />
			<Box p={[-0.6, 1.2, -1.5]} s={[0.12, 2.4, 0.12]} m={m.concrete} />
			<Box p={[-0.6, 1.2, 1.5]} s={[0.12, 2.4, 0.12]} m={m.concrete} />
		</group>
	);
};

/** The road, the ground, the sky and moon, the bamboo, the chapel and shed. ember: the kapre's cigar in the balete. */
export const Land: React.FC<{t: number; dawn: boolean; ember: boolean}> = ({t, dawn, ember}) => {
	const m = useM();
	const glow = 0.6 + 0.4 * Math.max(0, Math.sin(t * 0.9) * Math.sin(t * 2.3));
	return (
		<group>
			<mesh material={dawn ? m.skyDawn : m.sky}>
				<sphereGeometry args={[400, 16, 10]} />
			</mesh>
			{!dawn && (
				<mesh position={[-120, 120, -260]} material={m.moon}>
					<circleGeometry args={[16, 16]} />
				</mesh>
			)}
			<mesh position={[0, 0, -55]} rotation={[-Math.PI / 2, 0, 0]} material={m.mud}>
				<planeGeometry args={[5, 300, 8, 600]} />
			</mesh>
			{[-1, 1].map((sd) => (
				<mesh key={sd} position={[sd * 52.5, -0.02, -55]} rotation={[-Math.PI / 2, 0, 0]} material={m.ground}>
					<planeGeometry args={[100, 300, 50, 150]} />
				</mesh>
			))}
			<Bamboo t={t} />
			<Chapel />
			<Shed />
			{/* the kapre's cigar: an ember high in the balete, a thread of smoke */}
			{ember && (
				<group position={[-5.4, 6.4, BALETE_Z + 1.2]}>
					<mesh scale={glow} material={m.ember}>
						<boxGeometry args={[0.09, 0.09, 0.09]} />
					</mesh>
					<mesh position={[0.1, 0.5, 0]} material={m.smoke}>
						<planeGeometry args={[0.2, 0.9]} />
					</mesh>
				</group>
			)}
		</group>
	);
};

/** The tricycle (motorcycle with a sidecar on its right) heading -z, with its rider.
 * shirt: 'on' | 'off' (held, inside out) | 'in' (back on, inside out). */
export const Tricycle: React.FC<{t: number; z: number; lamp: number; moving: boolean; rider: boolean; shirt?: 'on' | 'off' | 'in'}> = ({t, z, lamp, moving, rider, shirt = 'on'}) => {
	const m = useM();
	const bob = moving ? Math.sin(t * 13) * 0.012 : 0;
	return (
		<group position={[TX, bob, z]}>
			{/* the motorcycle */}
			{[-0.7, 0.55].map((dz) => (
				<mesh key={dz} position={[0, 0.3, dz]} rotation={[0, 0, Math.PI / 2]} material={m.tire}>
					<cylinderGeometry args={[0.3, 0.3, 0.1, 10]} />
				</mesh>
			))}
			<Box p={[0, 0.62, 0.0]} s={[0.24, 0.3, 1.2]} m={m.trike} />
			<Box p={[0, 0.85, 0.2]} s={[0.26, 0.1, 0.6]} m={m.seat} />
			<Box p={[0, 1.0, -0.62]} s={[0.08, 0.6, 0.08]} m={m.chrome} r={[-0.3, 0, 0]} />
			<Box p={[0, 1.28, -0.7]} s={[0.7, 0.04, 0.04]} m={m.chrome} />
			<mesh position={[0, 1.08, -0.82]} rotation={[Math.PI / 2, 0, 0]} material={lamp > 0.5 ? m.lampOn : m.lampOff}>
				<cylinderGeometry args={[0.09, 0.09, 0.06, 8]} />
			</mesh>
			{/* the sidecar with its roof */}
			<group position={[0.85, 0, 0.05]}>
				<mesh position={[0.25, 0.25, 0.3]} rotation={[0, 0, Math.PI / 2]} material={m.tire}>
					<cylinderGeometry args={[0.25, 0.25, 0.1, 10]} />
				</mesh>
				<Box p={[0, 0.65, 0]} s={[0.8, 0.6, 1.4]} m={m.trike} />
				<Box p={[0.41, 0.7, 0]} s={[0.02, 0.12, 1.4]} m={m.trikeRed} />
				<Box p={[0, 1.55, 0.05]} s={[0.9, 0.06, 1.6]} m={m.trike} />
				{[-0.4, 0.4].map((x) => [-0.65, 0.7].map((zz) => <Box key={`${x}${zz}`} p={[x, 1.2, zz]} s={[0.04, 0.7, 0.04]} m={m.chrome} />))}
			</group>
			{rider && (
				<group position={[0, 0.9, 0.25]}>
					{[-1, 1].map((sd) => (
						<group key={sd}>
							<Box p={[sd * 0.12, 0.06, -0.2]} s={[0.13, 0.13, 0.45]} m={m.pants} />
							<Box p={[sd * 0.16, -0.3, -0.42]} s={[0.1, 0.5, 0.1]} m={m.pants} />
						</group>
					))}
					<Box p={[0, 0.4, 0]} s={[0.4, 0.55, 0.24]} m={shirt === 'off' ? m.skin : shirt === 'in' ? m.shirtIn : m.shirt} />
					{shirt === 'in' && <Box p={[0, 0.66, 0.125]} s={[0.05, 0.04, 0.01]} m={m.seam} />}
					{shirt === 'in' && [-1, 1].map((sd) => <Box key={`s${sd}`} p={[sd * 0.2, 0.4, 0.0]} s={[0.012, 0.5, 0.25]} m={m.seam} />)}
					{/* arms to the handlebar, or holding the shirt up, turning it inside out */}
					{[-1, 1].map((sd) =>
						shirt === 'off' ? (
							<Box key={`a${sd}`} p={[sd * 0.22, 0.55, -0.25]} s={[0.08, 0.08, 0.5]} m={m.skin} r={[0.6, 0, 0]} />
						) : (
							<Box key={`a${sd}`} p={[sd * 0.25, 0.42, -0.4]} s={[0.09, 0.09, 0.6]} m={m.skin} r={[0.4, 0, 0]} />
						),
					)}
					{shirt === 'off' && (
						<group position={[0, 0.72, -0.5]} rotation={[0, Math.sin(t * 3) * 0.3, 0]}>
							<Box p={[0, 0, 0]} s={[0.42, 0.5, 0.03]} m={m.shirtIn} />
							<Box p={[0, 0.2, 0.02]} s={[0.06, 0.04, 0.01]} m={m.seam} />
						</group>
					)}
					<group position={[0, 0.82, 0]}>
						<Box p={[0, 0, 0]} s={[0.2, 0.24, 0.21]} m={m.skin} />
						<Box p={[0, 0.1, 0.02]} s={[0.21, 0.07, 0.23]} m={m.hair} />
					</group>
				</group>
			)}
		</group>
	);
};

/** Hoofprints in the mud, circling the parked tricycle. */
export const Hoofprints: React.FC<{z: number}> = ({z}) => {
	const m = useM();
	const pr = useMemo(() => Array.from({length: 26}, (_, i) => {
		const a = (i / 26) * Math.PI * 2;
		return {x: TX + 0.3 + Math.cos(a) * 2.0 + (i % 2) * 0.12, z: z + Math.sin(a) * 2.4, ry: -a};
	}), [z]);
	return (
		<group>
			{pr.map((p, i) => (
				<group key={i} position={[p.x, 0.01, p.z]} rotation={[0, p.ry, 0]}>
					<Box p={[0, 0, 0]} s={[0.18, 0.015, 0.22]} m={m.hoofprint} />
				</group>
			))}
		</group>
	);
};

/** Rain falling past the camera while the moon is out. */
export const Rain: React.FC<{t: number; at: V3; amount: number}> = ({t, at, amount}) => {
	const m = useM();
	const drops = useMemo(() => {
		const r = rng(1703);
		return Array.from({length: 160}, () => ({x: (r() - 0.5) * 12, z: (r() - 0.5) * 12, y0: r() * 8, s: 7 + r() * 3}));
	}, []);
	if (amount <= 0) return null;
	return (
		<group position={at}>
			{drops.slice(0, Math.floor(drops.length * amount)).map((d, i) => (
				<mesh key={i} position={[d.x, ((d.y0 - t * d.s) % 8 + 8) % 8, d.z]} material={m.rain}>
					<boxGeometry args={[0.01, 0.35, 0.01]} />
				</mesh>
			))}
		</group>
	);
};
