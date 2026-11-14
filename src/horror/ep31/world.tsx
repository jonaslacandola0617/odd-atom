// Episode 31 world: "Dalawa Sila" (Season 4 opener, a documented case: Clarita Villanueva, Manila
// City Jail, the old Bilibid, May 1953). Composites, not a survey of the real jail:
// - THE CELL (origin): concrete walls, a barred front with a door, an iron cot with a blanket, a
//   kerosene lamp, a tin cup, a wall clock; her forearm and hand on the blanket (she is never seen
//   above the shoulder: the head end of the cot stays in darkness);
// - THE CORRIDOR (x 100): a row of barred cells under swinging bulbs, ending at her cell door;
// - THE WALL (x 300): the jail's long stone wall at night, a watchtower, one lit barred window;
// - THE PRESS (x 500): two rollers and the page coming off them;
// - THE OFFICE (x 700): a desk, a typewriter, the report, the doctor's lamp and clock.
// Props: hands with sleeves, the mayor's shoes, trousers and hat (no face), a guard, the shadows.
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

const seg = (v: number) => Math.min(40, Math.max(1, Math.ceil(v / 0.25)));
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

export const CELL: V3 = [0, 0, 0];
export const COR: V3 = [100, 0, 0];
export const WALL: V3 = [300, 0, 0];
export const PRESS: V3 = [500, 0, 0];
export const OFFICE: V3 = [700, 0, 0];
// her forearm on the blanket (the bite marks are on its upper face)
export const ARM: V3 = [0.12, 0.66, -0.62];
export const COT_Y = 0.55;

const noiseTex = (base: string, dots: string[], seed: number, rep: [number, number], n = 40, w = 16) =>
	tex(w, w, (g) => {
		g.fillStyle = base;
		g.fillRect(0, 0, w, w);
		const r = rng(seed);
		for (let i = 0; i < n; i++) {
			g.fillStyle = dots[Math.floor(r() * dots.length)];
			g.fillRect(Math.floor(r() * w), Math.floor(r() * w), 1 + Math.floor(r() * 3), 1 + Math.floor(r() * 2));
		}
	}, rep);

export const useMats = () =>
	useMemo(() => {
		const concrete = noiseTex('#7a7468', ['#6a645a', '#8a8476', '#5e584e'], 31, [3, 3], 60);
		const stone = tex(16, 16, (g) => {
			g.fillStyle = '#6e6a60';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#4e4a42';
			for (let y = 0; y < 16; y += 5) {
				g.fillRect(0, y, 16, 1);
				for (let x = (y / 5) % 2 ? 2 : 7; x < 16; x += 10) g.fillRect(x, y, 1, 5);
			}
			const r = rng(7);
			for (let i = 0; i < 20; i++) {
				g.fillStyle = r() < 0.5 ? '#5a564c' : '#827e72';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 2, 1);
			}
		}, [24, 3]);
		const blanket = tex(16, 16, (g) => {
			g.fillStyle = '#6a5a44';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#5a4a36';
			for (let y = 0; y < 16; y += 4) g.fillRect(0, y, 16, 1);
			g.fillStyle = '#7a6a52';
			for (let x = 0; x < 16; x += 4) g.fillRect(x, 0, 1, 16);
		}, [3, 2]);
		const floor = noiseTex('#5a554c', ['#4a463e', '#66605a', '#3e3a34'], 33, [4, 4], 50);
		const wood = noiseTex('#5a3e28', ['#4a3220', '#6a4a30'], 35, [2, 2], 30);
		return {
			concrete: lam('#ffffff', {map: concrete}),
			stone: lam('#ffffff', {map: stone}),
			floor: lam('#ffffff', {map: floor}),
			blanket: lam('#ffffff', {map: blanket}),
			iron: lam('#2a2a2c'),
			rust: lam('#4a3a30'),
			skin: lam('#9a6a4e'),
			skinPale: lam('#b48a6c'),
			skinDark: lam('#8a5e44'),
			white: lam('#d8d4c8'),
			cuff: lam('#e8e4d8'),
			darkSleeve: lam('#2e3034'),
			suit: lam('#3a3a40'),
			shoe: lam('#141414', {}),
			shoeShine: bas('#5a5a5a'),
			hat: lam('#3e3a34'),
			band: lam('#141210'),
			wood: lam('#ffffff', {map: wood}),
			metal: lam('#3a3c40'),
			tin: lam('#8a8a86'),
			paper: lam('#d8d0bc'),
			pages: lam('#e0d8c4'),
			cover: lam('#2a1a14'),
			ink: lam('#121212'),
			roller: lam('#1e1e20'),
			glass: bas('#fff0c8', {transparent: true, opacity: 0.35}),
			flame: bas('#ffd890'),
			bulb: bas('#fff4d0'),
			window: bas('#ffc070'),
			sky: bas('#0e1420', {side: THREE.BackSide}),
			ground: lam('#2c2a24'),
			guard: lam('#4a4a3a'),
			cap: lam('#2a2a22'),
			black: bas('#000000'),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
export const MatsContext = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(MatsContext)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <MatsContext.Provider value={useMats()}>{children}</MatsContext.Provider>;

// ------------------------------------------------------------------ the bite marks (a decal drawn live)
/** Draw one bite (two arcs of tooth marks) into a canvas: k 0..1 is how deep it has pressed in. */
export const drawBite = (g: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, k: number, wet: number, seed: number) => {
	if (k <= 0) return;
	const r = rng(seed);
	// the bruise around it
	g.fillStyle = `rgba(120,30,30,${0.28 * k})`;
	g.beginPath();
	g.ellipse(cx, cy, rx * 1.35, ry * 1.5, 0, 0, Math.PI * 2);
	g.fill();
	const teeth = 7;
	for (const side of [-1, 1]) {
		for (let i = 0; i < teeth; i++) {
			const a = Math.PI * (0.12 + 0.76 * (i / (teeth - 1)));
			const x = cx + Math.cos(a) * rx * (side > 0 ? 1 : -1) * (side > 0 ? 1 : 1);
			const y = cy + side * Math.sin(a) * ry;
			// each tooth presses in a little after the one before it
			const kk = Math.max(0, Math.min(1, k * 1.6 - (i / teeth) * 0.6 + (r() - 0.5) * 0.1));
			if (kk <= 0) continue;
			g.fillStyle = `rgba(70,14,14,${0.95 * kk})`;
			g.fillRect(Math.round(x - 1), Math.round(y - 1), 2, 2);
			g.fillStyle = `rgba(160,60,50,${0.7 * kk})`;
			g.fillRect(Math.round(x - 1), Math.round(y + side), 2, 1);
		}
	}
	if (wet > 0) {
		// saliva: a few bright glints on the marks
		g.fillStyle = `rgba(255,250,235,${0.9 * wet})`;
		for (let i = 0; i < 4; i++) g.fillRect(Math.round(cx - rx + r() * rx * 2), Math.round(cy - ry + r() * ry * 2), 1, 1);
	}
};

/** A transparent decal of skin marks on a small plane: `draw` is called whenever `key` changes. */
export const Decal: React.FC<{p: V3; r?: V3; w: number; h: number; draw: (g: CanvasRenderingContext2D, W: number, H: number) => void; dim?: number}> = ({p, r, w, h, draw, dim = 1}) => {
	const W = 48, H = Math.max(8, Math.round((48 * h) / w));
	const t = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = W;
		c.height = H;
		const tx = new THREE.CanvasTexture(c);
		tx.magFilter = THREE.NearestFilter;
		tx.minFilter = THREE.NearestFilter;
		tx.generateMipmaps = false;
		tx.colorSpace = THREE.SRGBColorSpace;
		return tx;
	}, [W, H]);
	const c = t.image as HTMLCanvasElement;
	const g = c.getContext('2d')!;
	g.clearRect(0, 0, W, H);
	draw(g, W, H);
	t.needsUpdate = true;
	const m = useMemo(() => new THREE.MeshBasicMaterial({map: t, transparent: true, depthWrite: false}), [t]);
	m.color.setScalar(dim);
	return (
		<mesh position={p} rotation={r} material={m}>
			<planeGeometry args={[w, h]} />
		</mesh>
	);
};

// ------------------------------------------------------------------ hands
/** A low-poly hand with a sleeve. Built along +x from the wrist; `curl` bends the fingers down. */
export const Hand: React.FC<{p: V3; r?: V3; skin: THREE.Material; sleeve: THREE.Material; cuff?: THREE.Material; curl?: number; scale?: number; spread?: number; point?: boolean; sleeveLen?: number}> = ({p, r = [0, 0, 0], skin, sleeve, cuff, curl = 0.3, scale = 1, spread = 0, point = false, sleeveLen = 0.32}) => (
	<group position={p} rotation={r} scale={scale}>
		<mesh position={[-sleeveLen / 2 - 0.01, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={sleeve}>
			<cylinderGeometry args={[0.045, 0.05, sleeveLen, 8, 2]} />
		</mesh>
		{cuff && (
			<mesh position={[-0.015, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={cuff}>
				<cylinderGeometry args={[0.042, 0.042, 0.03, 8, 1]} />
			</mesh>
		)}
		<mesh position={[0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={skin}>
			<cylinderGeometry args={[0.028, 0.032, 0.05, 8, 1]} />
		</mesh>
		{/* palm */}
		<Box p={[0.075, 0, 0]} s={[0.08, 0.025, 0.075]} m={skin} />
		{/* fingers */}
		{[-0.027, -0.009, 0.009, 0.027].map((z, i) => {
			const c = point && i === 1 ? 0 : curl;
			const len = [0.05, 0.058, 0.055, 0.044][i];
			return (
				<group key={i} position={[0.115, 0, z * (1 + spread)]} rotation={[0, 0, -c]}>
					<Box p={[len / 2, 0, 0]} s={[len, 0.018, 0.016]} m={skin} />
					<group position={[len, 0, 0]} rotation={[0, 0, -c * 1.2]}>
						<Box p={[0.018, 0, 0]} s={[0.036, 0.016, 0.015]} m={skin} />
					</group>
				</group>
			);
		})}
		{/* thumb */}
		<group position={[0.06, -0.004, 0.04]} rotation={[0, -0.7, -curl * 0.5]}>
			<Box p={[0.025, 0, 0]} s={[0.05, 0.02, 0.02]} m={skin} />
		</group>
	</group>
);

// ------------------------------------------------------------------ the blanket (rippling: something moves under it)
export const Blanket: React.FC<{p: V3; w: number; d: number; wave?: {x: number; amp: number}; dent?: {x: number; z: number; depth: number}}> = ({p, w, d, wave, dent}) => {
	const M = useM();
	const geo = useMemo(() => new THREE.PlaneGeometry(w, d, 24, 10), [w, d]);
	const pos = geo.attributes.position as THREE.BufferAttribute;
	for (let i = 0; i < pos.count; i++) {
		const x = pos.getX(i), y = pos.getY(i);
		// a body-shaped lump along the length, lower at the feet end (+x)
		const across = 1 - Math.min(1, Math.abs(y) / (d * 0.5)) ** 2;
		let h = 0.09 * across * (0.75 + 0.25 * Math.cos((x / w) * Math.PI));
		h += 0.008 * Math.sin(x * 23 + y * 11);
		if (wave && wave.amp > 0) h += wave.amp * Math.exp(-(((x - wave.x) / 0.18) ** 2)) * across;
		if (dent && dent.depth > 0) h -= dent.depth * Math.exp(-(((x - dent.x) / 0.2) ** 2) - (((y + dent.z) / 0.14) ** 2));
		pos.setZ(i, h);
	}
	pos.needsUpdate = true;
	geo.computeVertexNormals();
	return <mesh geometry={geo} position={p} rotation={[-Math.PI / 2, 0, 0]} material={M.blanket} />;
};

// ------------------------------------------------------------------ a shadow cast by no one (on the wall)
export const useShadowTex = (kind: 'tall' | 'small') =>
	useMemo(
		() =>
			tex(32, 64, (g) => {
				g.clearRect(0, 0, 32, 64);
				g.fillStyle = '#000';
				if (kind === 'tall') {
					// hunched, too-long arms, head forward
					g.beginPath();
					g.ellipse(19, 11, 5, 6, 0.3, 0, Math.PI * 2);
					g.fill();
					g.beginPath();
					g.moveTo(8, 18);
					g.quadraticCurveTo(16, 13, 25, 17);
					g.lineTo(27, 44);
					g.lineTo(22, 64);
					g.lineTo(10, 64);
					g.lineTo(7, 44);
					g.closePath();
					g.fill();
					g.fillRect(4, 20, 4, 30);
					g.fillRect(25, 20, 4, 34);
				} else {
					// child-height: a round head, narrow shoulders, arms hanging
					g.beginPath();
					g.ellipse(16, 27, 5, 5.5, 0, 0, Math.PI * 2);
					g.fill();
					g.beginPath();
					g.moveTo(9, 35);
					g.quadraticCurveTo(16, 31, 23, 35);
					g.lineTo(22, 52);
					g.lineTo(21, 64);
					g.lineTo(11, 64);
					g.lineTo(10, 52);
					g.closePath();
					g.fill();
					g.fillRect(6, 36, 3, 18);
					g.fillRect(23, 36, 3, 18);
				}
			}),
		[kind]
	);
export const WallShadow: React.FC<{kind: 'tall' | 'small'; p: V3; h: number; op: number; lean?: number; ry?: number}> = ({kind, p, h, op, lean = 0, ry = 0}) => {
	const t = useShadowTex(kind);
	const m = useMemo(() => new THREE.MeshBasicMaterial({map: t, transparent: true, depthWrite: false, color: '#000'}), [t]);
	m.opacity = op;
	if (op <= 0.001) return null;
	return (
		<group position={p} rotation={[0, ry, 0]}>
			<mesh position={[0, h / 2, 0]} rotation={[0, 0, lean]} material={m}>
				<planeGeometry args={[h / 2, h]} />
			</mesh>
		</group>
	);
};

// ------------------------------------------------------------------ the cell
export const Bars: React.FC<{x0: number; x1: number; z: number; h: number; gap?: number; door?: {x0: number; x1: number; open: number}}> = ({x0, x1, z, h, gap = 0.13, door}) => {
	const M = useM();
	const out: React.ReactNode[] = [];
	for (let x = x0; x <= x1 + 1e-6; x += gap) {
		if (door && x >= door.x0 - 1e-6 && x <= door.x1 + 1e-6) continue;
		out.push(<Cyl key={x} p={[x, h / 2, z]} r0={0.014} h={h} m={M.iron} n={5} />);
	}
	out.push(<Box key="t" p={[(x0 + x1) / 2, h - 0.04, z]} s={[x1 - x0 + 0.06, 0.06, 0.05]} m={M.iron} />);
	out.push(<Box key="m" p={[(x0 + x1) / 2, 1.1, z]} s={[x1 - x0 + 0.06, 0.04, 0.04]} m={M.iron} />);
	if (door) {
		const dw = door.x1 - door.x0;
		const leaf: React.ReactNode[] = [];
		for (let x = 0; x <= dw + 1e-6; x += gap) leaf.push(<Cyl key={x} p={[x, h / 2 - 0.05, 0]} r0={0.014} h={h - 0.1} m={M.iron} n={5} />);
		leaf.push(<Box key="a" p={[dw / 2, 1.1, 0]} s={[dw, 0.05, 0.04]} m={M.iron} />);
		leaf.push(<Box key="b" p={[dw / 2, 0.08, 0]} s={[dw, 0.05, 0.04]} m={M.iron} />);
		leaf.push(<Box key="l" p={[dw - 0.06, 1.0, 0.03]} s={[0.1, 0.14, 0.05]} m={M.rust} />);
		out.push(
			<group key="door" position={[door.x0, 0, z]} rotation={[0, -door.open * 1.4, 0]}>
				{leaf}
			</group>
		);
	}
	return <>{out}</>;
};

export const Cell: React.FC<{cup: number; clock?: number; blanketWave?: {x: number; amp: number}; dent?: {x: number; z: number; depth: number}; arm?: boolean; door?: number}> = ({cup, clock = 0, blanketWave, dent, arm = true, door = 0}) => {
	const M = useM();
	// the cup rolls from under the cot toward the bars
	const cx = 0.6 + 0.2 * cup, cz = -0.5 + 1.75 * cup;
	return (
		<group position={CELL}>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={M.floor}>
				<planeGeometry args={[3.2, 3.4, 16, 16]} />
			</mesh>
			<Box p={[0, 1.5, -1.55]} s={[3.2, 3, 0.1]} m={M.concrete} />
			<Box p={[-1.6, 1.5, 0]} s={[0.1, 3, 3.2]} m={M.concrete} />
			<Box p={[1.6, 1.5, 0]} s={[0.1, 3, 3.2]} m={M.concrete} />
			<Box p={[0, 3.0, 0]} s={[3.2, 0.1, 3.4]} m={M.concrete} />
			{/* a small high window, barred and dark */}
			<Box p={[0.6, 2.4, -1.49]} s={[0.4, 0.3, 0.02]} m={M.black} />
			{[0.48, 0.6, 0.72].map((x) => (
				<Cyl key={x} p={[x, 2.4, -1.47]} r0={0.012} h={0.3} m={M.iron} n={4} />
			))}
			{/* the wall clock: stopped at ten past two */}
			<group position={[1.54, 2.2, -0.6]} rotation={[0, -Math.PI / 2, 0]}>
				<Cyl p={[0, 0, 0]} r0={0.14} h={0.03} m={M.white} rot={[Math.PI / 2, 0, 0]} n={12} />
				<Box p={[0.03, 0.045, 0.02]} s={[0.012, 0.09, 0.005]} m={M.ink} r={[0, 0, -0.35 - clock]} />
				<Box p={[0.04, 0.0, 0.021]} s={[0.08, 0.012, 0.005]} m={M.ink} r={[0, 0, -0.2]} />
			</group>
			{/* the cot */}
			<group position={[0, 0, -0.95]}>
				{[-0.95, 0.95].map((x) =>
					[-0.38, 0.38].map((z) => <Cyl key={`${x}${z}`} p={[x, COT_Y / 2, z]} r0={0.02} h={COT_Y} m={M.iron} n={5} />)
				)}
				<Box p={[0, COT_Y - 0.02, 0]} s={[2.0, 0.04, 0.8]} m={M.iron} />
				<Box p={[0, COT_Y + 0.03, 0]} s={[1.96, 0.06, 0.76]} m={M.white} />
				<Blanket p={[0.1, COT_Y + 0.06, 0]} w={1.8} d={0.78} wave={blanketWave} dent={dent} />
				{/* the head end is in darkness: a dark pillow and nothing more */}
				<Box p={[-0.85, COT_Y + 0.12, 0]} s={[0.3, 0.1, 0.5]} m={M.band} />
			</group>
			{/* her forearm and hand, resting on the blanket's edge */}
			{arm && (
				<group position={ARM}>
					<mesh rotation={[0, 0, Math.PI / 2]} position={[-0.12, 0, 0]} material={M.skin}>
						<cylinderGeometry args={[0.032, 0.036, 0.3, 8, 4]} />
					</mesh>
					<Hand p={[0.03, 0, 0]} r={[0, 0, -0.1]} skin={M.skin} sleeve={M.skin} curl={0.55} scale={0.85} sleeveLen={0.04} />
				</group>
			)}
			{/* a caged bulb in the ceiling */}
			<mesh position={[0.2, 2.75, -0.3]} material={M.bulb}>
				<sphereGeometry args={[0.05, 6, 4]} />
			</mesh>
			{/* the kerosene lamp on the floor */}
			<group position={[1.1, 0, -0.3]}>
				<Cyl p={[0, 0.05, 0]} r0={0.07} r1={0.06} h={0.1} m={M.metal} n={8} />
				<Cyl p={[0, 0.17, 0]} r0={0.05} r1={0.035} h={0.14} m={M.glass} n={8} />
				<mesh position={[0, 0.16, 0]} material={M.flame}>
					<coneGeometry args={[0.012, 0.05, 5]} />
				</mesh>
			</group>
			{/* the tin cup */}
			<group position={[cx, 0.04, cz]} rotation={[cup * 14, 0, Math.PI / 2]}>
				<Cyl p={[0, 0, 0]} r0={0.04} h={0.08} m={M.tin} n={8} />
			</group>
			<Bars x0={-1.55} x1={1.55} z={1.6} h={3} door={{x0: -0.35, x1: 0.45, open: door}} />
			{/* the corridor outside the bars */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 3.2]} material={M.floor}>
				<planeGeometry args={[6, 3.2, 16, 10]} />
			</mesh>
			<Box p={[0, 1.5, 4.8]} s={[6, 3, 0.1]} m={M.concrete} />
		</group>
	);
};

// ------------------------------------------------------------------ the corridor
export const Corridor: React.FC<{t: number; door: number; cup: number}> = ({t, door, cup}) => {
	const M = useM();
	const cells: React.ReactNode[] = [];
	for (let i = 0; i < 4; i++) {
		const z = -i * 3.2;
		for (const side of [-1, 1]) {
			cells.push(
				<group key={`${i}${side}`} position={[COR[0] + side * 1.3, 0, z]} rotation={[0, -side * (Math.PI / 2), 0]}>
					<Bars x0={-1.5} x1={1.5} z={0} h={3} gap={0.16} />
					<Box p={[0, 1.5, -2.6]} s={[3.1, 3, 0.1]} m={M.concrete} />
					<Box p={[1.55, 1.5, -1.3]} s={[0.08, 3, 2.6]} m={M.concrete} />
				</group>
			);
		}
	}
	return (
		<group>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[COR[0], 0, -4]} material={M.floor}>
				<planeGeometry args={[9, 18, 18, 36]} />
			</mesh>
			<Box p={[COR[0], 3.05, -4]} s={[9, 0.1, 18]} m={M.concrete} />
			{/* swinging bulbs */}
			{[0, -3.2, -6.4].map((z, i) => {
				const sw = 0.25 * Math.sin(t * 1.3 + i);
				return (
					<group key={z} position={[COR[0], 3.0, z]} rotation={[sw * 0.5, 0, sw]}>
						<Cyl p={[0, -0.3, 0]} r0={0.005} h={0.6} m={M.iron} n={3} />
						<mesh position={[0, -0.62, 0]} material={M.bulb}>
							<sphereGeometry args={[0.05, 6, 4]} />
						</mesh>
					</group>
				);
			})}
			{cells}
			{/* a cup in the next cell rolls too (a hidden detail) */}
			<group position={[COR[0] - 2.0, 0.04, -6.4 + 1.2 * cup]} rotation={[cup * 12, 0, Math.PI / 2]}>
				<Cyl p={[0, 0, 0]} r0={0.04} h={0.08} m={M.tin} n={8} />
			</group>
			{/* her cell door at the end, facing us */}
			<group position={[COR[0], 0, -11.2]}>
				<Bars x0={-1.5} x1={1.5} z={0} h={3} door={{x0: -0.35, x1: 0.45, open: door}} />
				<Box p={[0, 1.5, -3]} s={[3.2, 3, 0.1]} m={M.concrete} />
			</group>
		</group>
	);
};

// ------------------------------------------------------------------ the prison wall at night
export const Guard: React.FC<{p: V3; t: number; run: number; ry?: number}> = ({p, t, run, ry = 0}) => {
	const M = useM();
	const s = Math.sin(t * 11) * run;
	return (
		<group position={p} rotation={[0, ry, 0]}>
			<group position={[0, 0.9, 0]} rotation={[0, 0, 0]}>
				<Box p={[0, 0.35, 0]} s={[0.36, 0.6, 0.24]} m={M.guard} />
				<mesh position={[0, 0.8, 0]} material={M.skinDark}>
					<sphereGeometry args={[0.11, 6, 5]} />
				</mesh>
				<Cyl p={[0, 0.9, 0]} r0={0.12} h={0.06} m={M.cap} n={8} />
				<Box p={[0.06, 0.88, 0]} s={[0.18, 0.02, 0.2]} m={M.cap} />
				{[-1, 1].map((k) => (
					<group key={k} position={[0, 0.6, k * 0.22]} rotation={[0, 0, k * s * 0.9]}>
						<Box p={[0, -0.28, 0]} s={[0.1, 0.55, 0.1]} m={M.guard} />
					</group>
				))}
			</group>
			{[-1, 1].map((k) => (
				<group key={k} position={[0, 0.92, k * 0.09]} rotation={[0, 0, -k * s]}>
					<Box p={[0, -0.45, 0]} s={[0.13, 0.9, 0.13]} m={M.suit} />
				</group>
			))}
		</group>
	);
};
export const PrisonWall: React.FC<{t: number; guardX: number; window: number}> = ({t, guardX, window: win}) => {
	const M = useM();
	return (
		<group>
			<mesh position={[WALL[0], 0, 0]} material={M.sky}>
				<sphereGeometry args={[400, 10, 8]} />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[WALL[0], 0, 6]} material={M.ground}>
				<planeGeometry args={[120, 30, 40, 12]} />
			</mesh>
			<Box p={[WALL[0], 3, 0]} s={[60, 6, 0.8]} m={M.stone} />
			<Box p={[WALL[0], 6.15, 0]} s={[60, 0.3, 1.0]} m={M.stone} />
			{/* the watchtower */}
			<group position={[WALL[0] + 9, 0, 0.4]}>
				<Box p={[0, 5, 0]} s={[3, 10, 3]} m={M.stone} />
				<Box p={[0, 10.6, 0]} s={[3.8, 0.4, 3.8]} m={M.stone} />
				<mesh position={[0, 11.6, 0]} material={M.rust}>
					<coneGeometry args={[2.8, 1.6, 4]} />
				</mesh>
				<Box p={[0, 9.4, 1.51]} s={[1, 0.8, 0.02]} m={M.black} />
			</group>
			{/* the one lit barred window */}
			<group position={[WALL[0] - 2, 4.3, 0.41]}>
				<mesh material={M.window}>
					<planeGeometry args={[0.9, 0.7]} />
				</mesh>
				{[-0.3, -0.1, 0.1, 0.3].map((x) => (
					<Cyl key={x} p={[x, 0, 0.02]} r0={0.02} h={0.7} m={M.iron} n={4} />
				))}
				<pointLight position={[0, 0, 0.6]} intensity={3 * win} distance={7} decay={1} color="#ffb060" />
			</group>
			<Guard p={[guardX, 0, 2.2]} t={t} run={1} ry={0} />
			{/* the guard's lamp */}
			<pointLight position={[guardX + 0.4, 1.2, 2.5]} intensity={4} distance={6} decay={1} color="#ffc070" />
			<mesh position={[guardX + 0.35, 1.1, 2.45]} material={M.flame}>
				<sphereGeometry args={[0.06, 5, 4]} />
			</mesh>
		</group>
	);
};

// ------------------------------------------------------------------ the press
export const Press: React.FC<{t: number; page: THREE.Texture; feed: number}> = ({t, page, feed}) => {
	const M = useM();
	const pm = useMemo(() => new THREE.MeshLambertMaterial({map: page}), [page]);
	return (
		<group position={PRESS}>
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={M.floor}>
				<planeGeometry args={[10, 10, 20, 20]} />
			</mesh>
			{[1.25, 0.95].map((y, i) => (
				<group key={y} position={[0, y, -0.6]} rotation={[t * (i ? 6 : -6), 0, 0]}>
					<Cyl p={[0, 0, 0]} r0={0.15} h={1.6} m={M.roller} rot={[0, 0, Math.PI / 2]} n={10} />
					<Box p={[0, 0.15, 0]} s={[1.6, 0.02, 0.02]} m={M.metal} />
				</group>
			))}
			<Box p={[-0.9, 1.1, -0.6]} s={[0.12, 1.2, 0.6]} m={M.metal} />
			<Box p={[0.9, 1.1, -0.6]} s={[0.12, 1.2, 0.6]} m={M.metal} />
			{/* the page comes off the rollers toward us on the table */}
			<Box p={[0, 0.5, 0.5]} s={[1.5, 1.0, 2.2]} m={M.wood} />
			<mesh position={[0, 1.02, -0.4 + 1.3 * feed]} rotation={[-Math.PI / 2, 0, 0]} material={pm}>
				<planeGeometry args={[0.9, 1.3]} />
			</mesh>
		</group>
	);
};

// ------------------------------------------------------------------ the office: desk, typewriter, report
export const Office: React.FC<{report: THREE.Texture; lamp: number; typed: number}> = ({report, lamp, typed}) => {
	const M = useM();
	const rm = useMemo(() => new THREE.MeshLambertMaterial({map: report}), [report]);
	return (
		<group position={OFFICE}>
			<mesh rotation={[-Math.PI / 2, 0, 0]} material={M.floor}>
				<planeGeometry args={[6, 6, 12, 12]} />
			</mesh>
			<Box p={[0, 1.5, -1.4]} s={[6, 3, 0.1]} m={M.concrete} />
			<Box p={[0, 0.38, 0]} s={[1.6, 0.76, 0.9]} m={M.wood} />
			{/* the typewriter */}
			<group position={[0, 0.76, 0.05]}>
				<Box p={[0, 0.06, 0.05]} s={[0.46, 0.12, 0.36]} m={M.metal} />
				<Box p={[0, 0.14, -0.08]} s={[0.4, 0.08, 0.14]} m={M.metal} />
				<Cyl p={[(typed - 0.5) * -0.12, 0.2, -0.12]} r0={0.035} h={0.5} m={M.roller} rot={[0, 0, Math.PI / 2]} n={8} />
				{/* the keys */}
				{[0, 1, 2].map((row) =>
					Array.from({length: 9}, (_, i) => <Box key={`${row}${i}`} p={[-0.16 + i * 0.04, 0.125 + row * 0.012, 0.18 - row * 0.04]} s={[0.022, 0.012, 0.022]} m={M.white} />)
				)}
				{/* the page in the machine, rising as it is typed */}
				<mesh position={[(typed - 0.5) * -0.12, 0.3 + 0.08 * typed, -0.15]} rotation={[-0.25, 0, 0]} material={rm}>
					<planeGeometry args={[0.24, 0.3]} />
				</mesh>
			</group>
			{/* the desk lamp */}
			<group position={[0.55, 0.76, -0.2]}>
				<Cyl p={[0, 0.02, 0]} r0={0.08} h={0.04} m={M.metal} n={8} />
				<Cyl p={[0, 0.25, 0]} r0={0.01} h={0.45} m={M.metal} n={4} />
				<mesh position={[-0.08, 0.46, 0.05]} rotation={[0, 0, 0.9]} material={M.metal}>
					<coneGeometry args={[0.09, 0.14, 8, 1, true]} />
				</mesh>
				<pointLight position={[-0.2, 0.36, 0.1]} intensity={4 * lamp} distance={3} decay={1} color="#ffd8a0" />
			</group>
			{/* the clock: the same ten past two as the cell (a hidden detail) */}
			<group position={[-0.6, 2.0, -1.34]}>
				<Cyl p={[0, 0, 0]} r0={0.16} h={0.03} m={M.white} rot={[Math.PI / 2, 0, 0]} n={12} />
				<Box p={[0.03, 0.05, 0.02]} s={[0.012, 0.1, 0.005]} m={M.ink} r={[0, 0, -0.35]} />
				<Box p={[0.04, 0.0, 0.021]} s={[0.09, 0.012, 0.005]} m={M.ink} r={[0, 0, -0.2]} />
			</group>
		</group>
	);
};

// ------------------------------------------------------------------ the mayor: shoes, trousers, a hat in his hand (no face)
export const Visitor: React.FC<{p: V3; t: number; walk: number; hatDrop: number}> = ({p, t, walk, hatDrop}) => {
	const M = useM();
	const s = Math.sin(t * 7) * walk * 0.35;
	const hy = 0.75 - 0.72 * Math.min(1, hatDrop * hatDrop);
	return (
		<group position={p}>
			{[-1, 1].map((k) => (
				<group key={k} position={[0, 0.95, k * 0.1]} rotation={[0, 0, k * s]}>
					<Box p={[0, -0.47, 0]} s={[0.15, 0.9, 0.15]} m={M.suit} />
					<Box p={[0.05, -0.92, 0]} s={[0.27, 0.07, 0.11]} m={M.shoe} />
					<Box p={[0.12, -0.885, 0]} s={[0.05, 0.005, 0.07]} m={M.shoeShine} />
				</group>
			))}
			<Box p={[0, 1.3, 0]} s={[0.3, 0.7, 0.42]} m={M.suit} />
			{/* the hand and the hat */}
			<Hand p={[0.02, 0.86, 0.27]} r={[0, 0, -1.45]} skin={M.skinPale} sleeve={M.suit} cuff={M.cuff} curl={0.9} scale={1} sleeveLen={0.3} />
			<group position={[0.05 + 0.25 * hatDrop, hy, 0.33 + 0.1 * hatDrop]} rotation={[1.3 + 1.4 * hatDrop, 0, 0.4 * hatDrop]}>
				<Cyl p={[0, 0, 0]} r0={0.17} h={0.012} m={M.hat} n={12} />
				<Cyl p={[0, 0.06, 0]} r0={0.1} r1={0.09} h={0.11} m={M.hat} n={10} />
				<Cyl p={[0, 0.02, 0]} r0={0.102} h={0.025} m={M.band} n={10} />
			</group>
		</group>
	);
};

// ------------------------------------------------------------------ the Bible (prayer)
export const Book: React.FC<{p: V3; ry?: number}> = ({p, ry = 0}) => {
	const M = useM();
	return (
		<group position={p} rotation={[0, ry, 0]}>
			<Box p={[0, 0.005, 0]} s={[0.26, 0.01, 0.18]} m={M.cover} />
			<Box p={[-0.062, 0.018, 0]} s={[0.12, 0.016, 0.17]} m={M.pages} r={[0, 0, 0.06]} />
			<Box p={[0.062, 0.018, 0]} s={[0.12, 0.016, 0.17]} m={M.pages} r={[0, 0, -0.06]} />
		</group>
	);
};
