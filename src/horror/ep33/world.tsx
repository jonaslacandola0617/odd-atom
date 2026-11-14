// Episode 33 world: "Igalaw Mo ang Daliri" (Season 4: the batibat and bangungot). Composites:
// - THE HOUSE (origin): one room of a wooden house: plank floor and walls, a capiz window with a
//   shaft of moonlight, rafters; THE POST, a whole tree trunk with its bark, from floor to rafters;
//   a banig with a man and his wife asleep under a kulambo; his feet and hers at the net's edge (his
//   big toe can move); a wall clock with a pendulum; a small altar shelf;
// - THE TREE (x 300): an old tree alone in a field at dusk, where the batibat lives; it can fall;
// - THE BATIBAT: a vast, soft, dark mass with bark-grey skin, long hair, a heavy grey face with
//   half-closed eyes (never comic; her size is dread, not a joke).
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

export const useMats = () =>
	useMemo(() => {
		const plank = tex(16, 16, (g) => {
			g.fillStyle = '#6a4a30';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#4e3622';
			for (let y = 0; y < 16; y += 4) g.fillRect(0, y, 16, 1);
			const r = rng(3);
			for (let i = 0; i < 12; i++) {
				g.fillStyle = r() < 0.5 ? '#5a3e28' : '#7a5838';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 3, 1);
			}
		}, [4, 4]);
		const bark = tex(16, 32, (g) => {
			g.fillStyle = '#4a3a2c';
			g.fillRect(0, 0, 16, 32);
			const r = rng(5);
			for (let i = 0; i < 40; i++) {
				g.fillStyle = r() < 0.5 ? '#2e241a' : '#5e4c3a';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 32), 1, 3 + Math.floor(r() * 6));
			}
		}, [2, 3]);
		const banig = tex(16, 16, (g) => {
			for (let y = 0; y < 16; y++)
				for (let x = 0; x < 16; x++) {
					const k = ((x >> 1) + (y >> 1)) % 2;
					g.fillStyle = k ? '#a8885a' : '#8a6a42';
					g.fillRect(x, y, 1, 1);
				}
			g.fillStyle = '#7a2a2a';
			g.fillRect(0, 7, 16, 2);
		}, [3, 2]);
		const skinBark = tex(16, 16, (g) => {
			g.fillStyle = '#5a5248';
			g.fillRect(0, 0, 16, 16);
			const r = rng(13);
			for (let i = 0; i < 30; i++) {
				g.fillStyle = r() < 0.5 ? '#3e3830' : '#6a6256';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 2 + Math.floor(r() * 3));
			}
		}, [3, 3]);
		return {
			plank: lam('#ffffff', {map: plank}),
			bark: lam('#ffffff', {map: bark}),
			banig: lam('#ffffff', {map: banig}),
			net: ps1(new THREE.MeshLambertMaterial({color: '#e8e8e0', transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false}), 64, SNAP6),
			blanket: lam('#6a4a5a'),
			blanket2: lam('#4a5a6a'),
			pillow: lam('#c8c0b0'),
			hair: lam('#141210'),
			skin: lam('#9a6a4e'),
			sole: lam('#b08a6a'),
			capiz: bas('#d8d8c8'),
			capizFrame: lam('#3a2a1a'),
			moon: bas('#c8d0e0', {transparent: true, opacity: 0.12, depthWrite: false}),
			clockFace: lam('#d8d0b8'),
			brass: lam('#8a7038'),
			ink: lam('#121212'),
			wood: lam('#3a2a1a'),
			candle: bas('#ffb060'),
			batBody: lam('#ffffff', {map: skinBark}),
			batFace: lam('#8a847a', {emissive: '#2c2a26'}),
			batDark: lam('#1a1816'),
			eye: bas('#e0dcc8'),
			sky: bas('#2a2034', {side: THREE.BackSide}),
			sun: bas('#c86a3a'),
			field: lam('#3a4a2a'),
			leaves: lam('#1e2e1a'),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
export const MatsContext = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(MatsContext)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <MatsContext.Provider value={useMats()}>{children}</MatsContext.Provider>;

export const TREE: V3 = [300, 0, 0];
export const POST: V3 = [-1.3, 0, 0];
export const HIS_HEAD: V3 = [-0.3, 0.2, 0.35];
export const HER_HEAD: V3 = [-0.3, 0.2, -0.35];
export const HIS_TOE: V3 = [1.62, 0.12, 0.42];
export const HER_TOE: V3 = [1.58, 0.11, -0.4];
export const CLOCK: V3 = [0.4, 2.0, -1.95];

// ------------------------------------------------------------------ a foot with toes (the big toe can lift)
export const Foot: React.FC<{p: V3; toe: number; tremble?: number; t: number; mirror?: boolean}> = ({p, toe, tremble = 0, t, mirror = false}) => {
	const M = useM();
	const tr = tremble * 0.12 * Math.sin(t * 37) * Math.sin(t * 11);
	const zs = mirror ? -1 : 1;
	// lying on the back: the heel on the banig, the foot points up (+y), toes along the top
	return (
		<group position={p}>
			<mesh position={[-0.06, -0.02, 0]} rotation={[0, 0, 0.25]} material={M.skin}>
				<boxGeometry args={[0.07, 0.15, 0.08, 2, 3, 2]} />
			</mesh>
			<mesh position={[-0.1, -0.06, 0]} rotation={[0, 0, Math.PI / 2]} material={M.skin}>
				<cylinderGeometry args={[0.035, 0.04, 0.14, 7, 2]} />
			</mesh>
			{[0.012, -0.006, -0.022, -0.036].map((z, i) => (
				<Box key={i} p={[-0.035, 0.065 - i * 0.006, zs * z]} s={[0.022, 0.026 - i * 0.003, 0.014]} m={M.skin} />
			))}
			{/* the big toe */}
			<group position={[-0.045, 0.06, zs * 0.034]} rotation={[0, 0, 0.9 * toe + tr]}>
				<Box p={[0.004, 0.018, 0]} s={[0.026, 0.038, 0.022]} m={M.skin} />
			</group>
		</group>
	);
};

// ------------------------------------------------------------------ the batibat
export const Batibat: React.FC<{p: V3; r?: V3; s?: number; eyes?: number; t: number; breathe?: number}> = ({p, r = [0, 0, 0], s = 1, eyes = 0.3, t, breathe = 1}) => {
	const M = useM();
	const b = 1 + 0.03 * breathe * Math.sin(t * 1.3);
	return (
		<group position={p} rotation={r} scale={s}>
			{/* a vast soft body */}
			<mesh scale={[1.0 * b, 0.8 * b, 0.85 * b]} material={M.batBody}>
				<sphereGeometry args={[0.9, 12, 9]} />
			</mesh>
			<mesh position={[0.2, -0.45, 0.35]} scale={[0.8, 0.5, 0.6]} material={M.batBody}>
				<sphereGeometry args={[0.6, 10, 7]} />
			</mesh>
			{/* long arms hanging */}
			{[-1, 1].map((k) => (
				<mesh key={k} position={[0.5, -0.4, k * 0.75]} rotation={[k * 0.25, 0, 0.5]} material={M.batBody}>
					<cylinderGeometry args={[0.12, 0.2, 1.1, 8, 3]} />
				</mesh>
			))}
			{/* the head: heavy, grey, half-closed eyes; the face points along +x */}
			<group position={[0.75, 0.55, 0]}>
				<mesh scale={[0.9, 1.05, 0.95]} material={M.batFace}>
					<sphereGeometry args={[0.36, 12, 9]} />
				</mesh>
				{/* heavy cheeks */}
				{[-1, 1].map((k) => (
					<mesh key={k} position={[0.14, -0.16, k * 0.17]} scale={[0.8, 1, 0.8]} material={M.batFace}>
						<sphereGeometry args={[0.17, 8, 6]} />
					</mesh>
				))}
				{/* half-closed eyes: dark lids, a pale sliver under each */}
				{[-1, 1].map((k) => (
					<group key={k} position={[0.31, 0.06, k * 0.12]}>
						<Box p={[0, 0.012, 0]} s={[0.02, 0.035, 0.09]} m={M.batDark} />
						<Box p={[0.004, -0.012, 0]} s={[0.02, 0.012 * (0.3 + eyes), 0.07]} m={M.eye} />
					</group>
				))}
				{/* a mouth: a dark, slightly open line */}
				<Box p={[0.32, -0.17, 0]} s={[0.02, 0.025, 0.14]} m={M.batDark} />
				{/* hair: long dark curtains */}
				{[-1, 0, 1].map((k) => (
					<mesh key={k} position={[-0.1, -0.3, k * 0.24]} rotation={[k * 0.15, 0, 0.05]} material={M.hair}>
						<boxGeometry args={[0.35, 1.2, 0.06, 2, 6, 1]} />
					</mesh>
				))}
				<mesh position={[-0.05, 0.12, 0]} scale={[1.0, 0.9, 1.05]} material={M.hair}>
					<sphereGeometry args={[0.37, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2]} />
				</mesh>
			</group>
		</group>
	);
};

// ------------------------------------------------------------------ the house
export const Kulambo: React.FC<{sag: number}> = ({sag}) => {
	const M = useM();
	const top = useMemo(() => new THREE.PlaneGeometry(2.6, 1.7, 16, 10), []);
	const pos = top.attributes.position as THREE.BufferAttribute;
	for (let i = 0; i < pos.count; i++) {
		const x = pos.getX(i), y = pos.getY(i);
		const w = Math.max(0, 1 - (x / 1.3) ** 2) * Math.max(0, 1 - (y / 0.85) ** 2);
		pos.setZ(i, -sag * 0.55 * w ** 1.2);
	}
	pos.needsUpdate = true;
	top.computeVertexNormals();
	return (
		<group position={[0.65, 0, 0]}>
			<mesh geometry={top} position={[0, 1.45, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.net} />
			{[-0.85, 0.85].map((z) => (
				<mesh key={z} position={[0, 0.72, z]} material={M.net}>
					<planeGeometry args={[2.6, 1.45]} />
				</mesh>
			))}
			{[-1.3, 1.3].map((x) => (
				<mesh key={x} position={[x, 0.72, 0]} rotation={[0, Math.PI / 2, 0]} material={M.net}>
					<planeGeometry args={[1.7, 1.45]} />
				</mesh>
			))}
		</group>
	);
};

export const Sleeper: React.FC<{head: V3; m: THREE.Material; turned?: boolean; chest?: number}> = ({head, m, turned = false, chest = 0}) => {
	const M = useM();
	return (
		<group>
			<mesh position={[head[0], head[1] + 0.02, head[2]]} scale={[1, 0.5, 1]} material={M.pillow}>
				<boxGeometry args={[0.45, 0.16, 0.5]} />
			</mesh>
			<mesh position={[head[0] + 0.08, head[1] + 0.13, head[2]]} material={M.hair}>
				<sphereGeometry args={[0.12, 8, 6]} />
			</mesh>
			{!turned && (
				<mesh position={[head[0] + 0.15, head[1] + 0.14, head[2]]} material={M.skin}>
					<sphereGeometry args={[0.1, 8, 6]} />
				</mesh>
			)}
			{/* the body under the blanket; the chest can be pressed flat */}
			<mesh position={[head[0] + 0.95, head[1] + 0.05 - 0.04 * chest, head[2]]} scale={[1, 0.55 - 0.25 * chest, 0.75]} material={m}>
				<boxGeometry args={[1.6, 0.3, 0.5, 6, 2, 3]} />
			</mesh>
		</group>
	);
};

export const House: React.FC<{t: number; postBreathe: number; sag: number; chest: number; toe: number; tremble: number; herToe: number; minute: number; candle: number}> = ({t, postBreathe, sag, chest, toe, tremble, herToe, minute, candle}) => {
	const M = useM();
	const pb = 1 + 0.035 * postBreathe * Math.sin(t * 1.5);
	const sw = 0.28 * Math.sin(t * 2.9);
	return (
		<group>
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={M.plank}>
				<planeGeometry args={[6, 5, 20, 16]} />
			</mesh>
			<Box p={[0, 1.5, -2.05]} s={[6, 3, 0.1]} m={M.plank} />
			<Box p={[0, 1.5, 2.05]} s={[6, 3, 0.1]} m={M.plank} />
			<Box p={[-3.05, 1.5, 0]} s={[0.1, 3, 4.2]} m={M.plank} />
			<Box p={[3.05, 1.5, 0]} s={[0.1, 3, 4.2]} m={M.plank} />
			<Box p={[0, 3.05, 0]} s={[6, 0.1, 4.2]} m={M.wood} />
			{[-2, -1, 0, 1, 2].map((x) => (
				<Box key={x} p={[x, 2.9, 0]} s={[0.12, 0.16, 4.1]} m={M.wood} />
			))}
			{/* the post: a whole trunk, bark and all */}
			<mesh position={[POST[0], 1.5, POST[2]]} scale={[pb, 1, pb]} material={M.bark}>
				<cylinderGeometry args={[0.2, 0.26, 3, 10, 10]} />
			</mesh>
			{/* the capiz window and its shaft of moonlight */}
			<group position={[3.0, 1.6, 0.6]} rotation={[0, -Math.PI / 2, 0]}>
				<mesh material={M.capiz}>
					<planeGeometry args={[1.0, 0.8]} />
				</mesh>
				{[-0.25, 0, 0.25].map((x) => (
					<Box key={x} p={[x, 0, 0.01]} s={[0.02, 0.8, 0.02]} m={M.capizFrame} />
				))}
				{[-0.2, 0.2].map((y) => (
					<Box key={y} p={[0, y, 0.01]} s={[1.0, 0.02, 0.02]} m={M.capizFrame} />
				))}
			</group>
			<mesh position={[2.0, 0.9, 0.5]} rotation={[0, 0, 0.75]} material={M.moon}>
				<boxGeometry args={[0.9, 2.4, 0.8]} />
			</mesh>
			{/* the clock and its pendulum */}
			<group position={CLOCK}>
				<Box p={[0, -0.15, 0.04]} s={[0.36, 0.7, 0.08]} m={M.wood} />
				<mesh position={[0, 0, 0.09]} rotation={[Math.PI / 2, 0, 0]} material={M.clockFace}>
					<cylinderGeometry args={[0.14, 0.14, 0.01, 14, 1]} />
				</mesh>
				<group position={[0, 0, 0.1]} rotation={[0, 0, -((2 + minute) / 12) * Math.PI * 2]}>
					<Box p={[0, 0.04, 0.001]} s={[0.012, 0.08, 0.005]} m={M.ink} />
				</group>
				<group position={[0, 0, 0.1]} rotation={[0, 0, -minute * Math.PI * 2]}>
					<Box p={[0, 0.055, 0.002]} s={[0.008, 0.11, 0.005]} m={M.ink} />
				</group>
				<group position={[0, -0.22, 0.09]} rotation={[0, 0, sw]}>
					<Box p={[0, -0.12, 0]} s={[0.01, 0.24, 0.01]} m={M.brass} />
					<mesh position={[0, -0.26, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.brass}>
						<cylinderGeometry args={[0.04, 0.04, 0.01, 10, 1]} />
					</mesh>
				</group>
			</group>
			{/* a small altar shelf and a candle */}
			<Box p={[-2.95, 1.4, -1.2]} s={[0.12, 0.04, 0.5]} m={M.wood} />
			{candle > 0 && (
				<mesh position={[-2.92, 1.5, -1.2]} material={M.candle}>
					<coneGeometry args={[0.015, 0.05, 5]} />
				</mesh>
			)}
			{/* the banig, the sleepers, their feet, the kulambo */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.65, 0.012, 0]} material={M.banig}>
				<planeGeometry args={[2.4, 1.5, 8, 6]} />
			</mesh>
			<Sleeper head={HIS_HEAD} m={M.blanket} chest={chest} />
			<Sleeper head={HER_HEAD} m={M.blanket2} turned />
			<Foot p={HIS_TOE} toe={toe} tremble={tremble} t={t} />
			<Foot p={HER_TOE} toe={herToe} t={t} mirror />
			<Kulambo sag={sag} />
		</group>
	);
};

// ------------------------------------------------------------------ the tree in the field
export const Tree: React.FC<{t: number; fall: number; bow: number; spirit: boolean}> = ({t, fall, bow, spirit}) => {
	const M = useM();
	const r = rng(33);
	const blobs = useMemo(() => Array.from({length: 14}, () => [(r() - 0.5) * 7, 5.5 + r() * 3, (r() - 0.5) * 7, 1.4 + r() * 1.3] as [number, number, number, number]), []);
	const sway = 0.03 * Math.sin(t * 0.9);
	return (
		<group position={TREE}>
			<mesh position={[0, 0, 0]} material={M.sky}>
				<sphereGeometry args={[300, 10, 8]} />
			</mesh>
			<mesh position={[-60, 6, -200]} material={M.sun}>
				<sphereGeometry args={[9, 10, 8]} />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={M.field}>
				<planeGeometry args={[200, 200, 30, 30]} />
			</mesh>
			{/* the tree falls about its base toward +x */}
			<group rotation={[0, 0, -fall * (Math.PI / 2) * 0.96 + sway]}>
				<mesh position={[0, 3, 0]} material={M.bark}>
					<cylinderGeometry args={[0.55, 0.85, 6, 10, 8]} />
				</mesh>
				{[[-1, 4.8, 0.4, 0.7], [1.2, 5.2, -0.3, -0.6], [0.2, 5.6, 1.1, 0.3]].map(([x, y, z, a], i) => (
					<mesh key={i} position={[x / 2, y, z / 2]} rotation={[a, 0, x > 0 ? -0.7 : 0.7]} material={M.bark}>
						<cylinderGeometry args={[0.15, 0.3, 2.6, 7, 3]} />
					</mesh>
				))}
				<group position={[0, -0.6 * bow, 0]}>
					{blobs.map(([x, y, z, s], i) => (
						<mesh key={i} position={[x, y - bow * 0.3 * (1 - Math.abs(x) / 4), z]} material={M.leaves}>
							<sphereGeometry args={[s, 8, 6]} />
						</mesh>
					))}
					{spirit && <Batibat p={[0.4, 5.2, 0.6]} r={[0, -0.6, 0]} s={1.15} t={t} eyes={0.1} />}
				</group>
			</group>
		</group>
	);
};
