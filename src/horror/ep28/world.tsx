// Episode 28 world: "Developing" (Season 3, a real documented photograph: the Brown Lady of Raynham
// Hall, Norfolk, 19 September 1936). Composites, not a survey of the house (a private home):
// - THE STAIRCASE HALL (origin): a broad oak staircase rising away from the hall (16 treads) to a
//   landing with a tall window; panelled walls, dark portraits (no faces), banisters and newels; the
//   photographers' view camera on its tripod in the hall, the photographer under the focusing cloth,
//   his assistant holding the flash pan; a standard lamp;
// - THE DARKROOM (x 100): a bench with three trays, the red safelight, tongs, a tap, prints hanging;
// - THE HOUSE (x 1000): a long gabled country house at night, the lawn, trees, a 1930s motor car;
// - the figure: a long dark dress and a pale veil over the head and shoulders, hands together, as the
//   1936 photograph is usually described; never identified as fact.
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

export const DARK: V3 = [100, 0, 0];
export const EXT: V3 = [1000, 0, 0];
// the staircase: 16 treads rising along -z from z 0
export const TREADS = 16;
export const RISE = 0.2;
export const RUN = 0.5;
export const SW = 2.6; // stair width
/** the point on the stair centre line at a fraction 0 (top landing) .. 1 (the hall floor at the foot) */
export const stairAt = (f: number): V3 => {
	const k = (1 - f) * TREADS; // treads up from the bottom
	return [0, Math.floor(k) * RISE, -Math.floor(k) * RUN - 0.25];
};
export const CAMERA_AT: V3 = [0.3, 0, 5.2]; // the view camera's tripod in the hall

const useMats = () =>
	useMemo(() => {
		const panel = tex(16, 16, (g) => {
			g.fillStyle = '#4a3220';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#3a2618';
			g.fillRect(0, 0, 16, 1);
			g.fillRect(0, 0, 1, 16);
			g.fillStyle = '#5a3e28';
			g.fillRect(3, 3, 10, 10);
			g.fillStyle = '#4a3220';
			g.fillRect(4, 4, 8, 8);
		}, [8, 2]);
		const boards = tex(16, 16, (g) => {
			g.fillStyle = '#3a2818';
			g.fillRect(0, 0, 16, 16);
			for (let x = 0; x < 16; x += 4) {
				g.fillStyle = '#2a1c10';
				g.fillRect(x, 0, 1, 16);
			}
		}, [4, 6]);
		const portrait = tex(16, 20, (g) => {
			g.fillStyle = '#1a140e';
			g.fillRect(0, 0, 16, 20);
			g.fillStyle = '#2a2016';
			g.fillRect(2, 10, 12, 8);
			g.fillRect(9, 4, 4, 6);
		});
		const runner = tex(8, 8, (g) => {
			g.fillStyle = '#4a2a20';
			g.fillRect(0, 0, 8, 8);
			g.fillStyle = '#6a3a28';
			g.fillRect(0, 0, 1, 8);
			g.fillRect(7, 0, 1, 8);
		});
		const gable = tex(16, 16, (g) => {
			g.fillStyle = '#8a8478';
			g.fillRect(0, 0, 16, 16);
			const r = rng(9);
			for (let i = 0; i < 30; i++) {
				g.fillStyle = r() < 0.5 ? '#7a7468' : '#9a9488';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 2, 1);
			}
		}, [10, 4]);
		return {
			panel: lam('#ffffff', {map: panel}),
			plaster: lam('#a8a090'),
			boards: lam('#ffffff', {map: boards}),
			oak: lam('#5a3a22'),
			oakD: lam('#3a2414'),
			runner: lam('#ffffff', {map: runner}),
			portrait: lam('#ffffff', {map: portrait}),
			gilt: lam('#6a5428'),
			window: bas('#8a9ab0'),
			lead: lam('#1a1a1c'),
			lampShade: lam('#c8b890', {emissive: '#3a3020'}),
			brass: lam('#8a7438'),
			suit: lam('#1c1c20'),
			suitL: lam('#2c2c30'),
			skin: lam('#6a5a4c'),
			cloth: lam('#0a0a0a'),
			wood: lam('#5a3e24'),
			bellows: lam('#141414'),
			glass: lam('#2a2c30'),
			pan: lam('#9a9a9a'),
			dress: lam('#5a4638', {emissive: '#0a0806'}),
			veil: lam('#d8d4cc', {emissive: '#2a2a28', transparent: true, opacity: 0.9}),
			face: lam('#cac6bc', {emissive: '#1a1a18'}),
			socket: bas('#050505'),
			// the darkroom
			bench: lam('#3a3430'),
			tray: lam('#d8d8d0'),
			liquid: lam('#202020', {transparent: true, opacity: 0.35}),
			steel: lam('#9a9a98'),
			hung: lam('#1a1a1a'),
			wall: lam('#4a4844'),
			safe: bas('#ff2010'),
			// the house
			stone: lam('#ffffff', {map: gable}),
			roof: lam('#2a2a2c'),
			winD: bas('#0c0c0e'),
			winL: bas('#c8b080'),
			lawn: lam('#3a3c38'),
			tree: lam('#2a2c28'),
			car: lam('#141416'),
			chrome: lam('#8a8a8a'),
			head: bas('#fff8e0'),
			sky: new THREE.MeshBasicMaterial({color: '#14161c', side: THREE.BackSide, fog: false}),
			moon: bas('#e8e8e0', {fog: false}),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
const Ctx = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(Ctx)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMats()}>{children}</Ctx.Provider>;

/** The staircase hall. lamp: the standard lamp is on. */
export const Hall: React.FC<{lamp: boolean}> = ({lamp}) => {
	const m = useM();
	const topY = TREADS * RISE;
	const topZ = -TREADS * RUN;
	return (
		<group>
			{/* the hall floor and walls */}
			<Floor p={[0, 0, 5]} w={8} d={12} m={m.boards} />
			{[-1, 1].map((sd) => (
				<group key={sd}>
					<Box p={[sd * 3.9, 1.0, 0]} s={[0.1, 2.0, 22]} m={m.panel} />
					<Box p={[sd * 3.9, 4.0, 0]} s={[0.1, 4.0, 22]} m={m.plaster} />
				</group>
			))}
			<Box p={[0, 6.0, -2]} s={[8, 0.1, 18]} m={m.plaster} />
			<Box p={[0, 3.0, 11]} s={[8, 6, 0.1]} m={m.panel} />
			{/* the treads, risers and runner */}
			{Array.from({length: TREADS}, (_, i) => (
				<group key={i}>
					<Box p={[0, (i + 1) * RISE - RISE / 2, -i * RUN - RUN / 2]} s={[SW, RISE, RUN]} m={m.oak} />
					<Box p={[0, (i + 1) * RISE + 0.005, -i * RUN - RUN / 2]} s={[SW * 0.6, 0.012, RUN]} m={m.runner} />
					{[-1, 1].map((sd) => [0.15, 0.35].map((dz) => (
						<Box key={`${sd}${dz}`} p={[sd * (SW / 2 - 0.06), (i + 1) * RISE + 0.45, -i * RUN - dz]} s={[0.04, 0.9, 0.04]} m={m.oakD} />
					)))}
				</group>
			))}
			{/* the handrails, following the pitch, and the newels */}
			{[-1, 1].map((sd) => (
				<group key={`h${sd}`}>
					<Box p={[sd * (SW / 2 - 0.06), topY / 2 + 0.95, topZ / 2]} s={[0.08, 0.08, Math.hypot(topY, topZ)]} m={m.oakD} r={[Math.atan2(topY, -topZ), 0, 0]} />
					<Box p={[sd * (SW / 2 - 0.06), 0.65, 0.15]} s={[0.16, 1.3, 0.16]} m={m.oakD} />
					<Box p={[sd * (SW / 2 - 0.06), topY + 0.6, topZ + 0.05]} s={[0.16, 1.2, 0.16]} m={m.oakD} />
				</group>
			))}
			{/* the stairwell walls and the landing with its tall window */}
			{[-1, 1].map((sd) => (
				<Box key={`w${sd}`} p={[sd * 1.9, 3.6, topZ / 2 - 1]} s={[1.2, 7.2, -topZ + 2]} m={m.panel} />
			))}
			<Floor p={[0, topY, topZ - 1.4]} w={SW + 1.2} d={2.8} m={m.boards} />
			<Box p={[0, topY + 2.2, topZ - 2.8]} s={[SW + 1.2, 4.4, 0.1]} m={m.plaster} />
			<Box p={[0, topY + 2.0, topZ - 2.74]} s={[1.0, 2.4, 0.03]} m={m.window} />
			{[-0.25, 0.25].map((x) => (
				<Box key={x} p={[x, topY + 2.0, topZ - 2.7]} s={[0.03, 2.4, 0.03]} m={m.lead} />
			))}
			{[0.8, 1.6, 2.4, 3.2].map((y) => (
				<Box key={y} p={[0, topY + y, topZ - 2.7]} s={[1.0, 0.03, 0.03]} m={m.lead} />
			))}
			{/* portraits (dark, no faces) up the stair wall */}
			{[1, 4, 7, 10].map((i) => (
				<group key={`p${i}`} position={[-1.28, i * RISE + 2.0, -i * RUN]} rotation={[0, Math.PI / 2, 0]}>
					<Box p={[0, 0, -0.01]} s={[0.7, 0.9, 0.04]} m={m.gilt} />
					<mesh position={[0, 0, 0.012]} material={m.portrait}>
						<planeGeometry args={[0.58, 0.76]} />
					</mesh>
				</group>
			))}
			{/* a wall sconce halfway up the stair */}
			<Box p={[-1.27, 3.4, -3.2]} s={[0.06, 0.24, 0.14]} m={lamp ? m.lampShade : m.oakD} />
			{/* the standard lamp in the hall */}
			<group position={[-2.6, 0, 2.2]}>
				<Box p={[0, 0.8, 0]} s={[0.05, 1.6, 0.05]} m={m.brass} />
				<mesh position={[0, 1.7, 0]} material={lamp ? m.lampShade : m.oakD}>
					<cylinderGeometry args={[0.16, 0.26, 0.3, 8, 1, true]} />
				</mesh>
			</group>
		</group>
	);
};

/** The view camera on its tripod (the lens faces -z), with or without the photographer under the cloth. */
export const ViewCamera: React.FC<{withMan: boolean; headUp: number}> = ({withMan, headUp}) => {
	const m = useM();
	const [x, , z] = CAMERA_AT;
	return (
		<group position={[x, 0, z]}>
			{[-0.3, 0.3].map((dx) => (
				<Box key={dx} p={[dx, 0.65, 0.12]} s={[0.04, 1.35, 0.04]} m={m.wood} r={[0.12, 0, dx * 0.5]} />
			))}
			<Box p={[0, 0.65, -0.2]} s={[0.04, 1.35, 0.04]} m={m.wood} r={[-0.25, 0, 0]} />
			<Box p={[0, 1.36, 0]} s={[0.3, 0.06, 0.3]} m={m.wood} />
			<Box p={[0, 1.55, 0.05]} s={[0.28, 0.32, 0.12]} m={m.wood} />
			<Box p={[0, 1.55, -0.12]} s={[0.24, 0.26, 0.24]} m={m.bellows} />
			<Box p={[0, 1.55, -0.27]} s={[0.22, 0.26, 0.04]} m={m.wood} />
			<mesh position={[0, 1.55, -0.32]} rotation={[Math.PI / 2, 0, 0]} material={m.brass}>
				<cylinderGeometry args={[0.05, 0.05, 0.08, 10]} />
			</mesh>
			{withMan && (
				<group position={[0, 0, 0.35]}>
					{/* the photographer, bent under the black focusing cloth (from behind) */}
					{[-0.11, 0.11].map((dx) => (
						<Box key={dx} p={[dx, 0.45, 0.1]} s={[0.15, 0.9, 0.16]} m={m.suit} />
					))}
					<group position={[0, 0.9, 0.1]} rotation={[-0.5 + headUp * 0.45, 0, 0]}>
						<Box p={[0, 0.35, 0]} s={[0.44, 0.7, 0.26]} m={m.suitL} />
						<Box p={[0, 0.78, -0.08]} s={[0.5, 0.36, 0.5]} m={m.cloth} />
						{[-1, 1].map((sd) => (
							<Box key={sd} p={[sd * 0.25, 0.45, -0.18]} s={[0.1, 0.12, 0.45]} m={m.suit} />
						))}
					</group>
				</group>
			)}
		</group>
	);
};

/** The assistant with the flash pan held up (from behind). raise: 0..1 the arm with the pan. */
export const Assistant: React.FC<{p: V3; raise: number}> = ({p, raise}) => {
	const m = useM();
	return (
		<group position={p}>
			{[-0.11, 0.11].map((dx) => (
				<Box key={dx} p={[dx, 0.45, 0]} s={[0.15, 0.9, 0.16]} m={m.suit} />
			))}
			<Box p={[0, 1.22, 0]} s={[0.44, 0.66, 0.26]} m={m.suitL} />
			<mesh position={[0, 1.68, 0]} material={m.skin}>
				<icosahedronGeometry args={[0.11, 1]} />
			</mesh>
			<Box p={[0, 1.76, 0]} s={[0.24, 0.05, 0.24]} m={m.suit} />
			<group position={[0.26, 1.48, 0]} rotation={[0, 0, -0.3 - raise * 2.2]}>
				<Box p={[0, -0.3, 0]} s={[0.1, 0.6, 0.1]} m={m.suit} />
				<group position={[0, -0.62, 0]}>
					<Box p={[0, -0.05, 0]} s={[0.03, 0.12, 0.03]} m={m.wood} />
					<Box p={[0, -0.12, 0]} s={[0.28, 0.02, 0.07]} m={m.pan} />
				</group>
			</group>
			<Box p={[-0.26, 1.2, 0]} s={[0.1, 0.6, 0.1]} m={m.suit} />
		</group>
	);
};
export const ASSISTANT_AT: V3 = [-1.1, 0, 5.0];
export const FLASH_AT: V3 = [-1.25, 2.1, 5.0];

/** The figure: a long dark dress, a pale veil over head and shoulders, hands together at the waist.
 * solid: 0 vapour .. 1 a woman; face: show the face under the veil (the last frame). */
export const Lady: React.FC<{p: V3; ry: number; solid: number; face?: boolean}> = ({p, ry, solid, face = false}) => {
	const m = useM();
	const veil = useMemo(() => {
		const v = (m.veil as THREE.MeshLambertMaterial).clone();
		v.onBeforeCompile = m.veil.onBeforeCompile;
		return v;
	}, [m]);
	veil.opacity = 0.25 + 0.65 * solid;
	const sy = 0.6 + 0.4 * solid;
	return (
		<group position={p} rotation={[0, ry, 0]} scale={[1, sy, 1]}>
			{solid > 0.35 && (
				<>
					<mesh position={[0, 0.6, 0]} material={m.dress}>
						<cylinderGeometry args={[0.18, 0.42, 1.2, 10]} />
					</mesh>
					<mesh position={[0, 1.28, 0]} material={m.dress}>
						<cylinderGeometry args={[0.15, 0.19, 0.4, 8]} />
					</mesh>
					<Box p={[0, 0.98, 0.17]} s={[0.16, 0.1, 0.08]} m={m.face} />
				</>
			)}
			{/* the veil: over the head, falling past the shoulders */}
			<mesh position={[0, 1.42, 0]} material={veil}>
				<coneGeometry args={[0.32, 0.75, 10, 2, true]} />
			</mesh>
			<mesh position={[0, 1.68, 0]} material={veil}>
				<sphereGeometry args={[0.13, 10, 8]} />
			</mesh>
			{face && (
				<group position={[0, 1.66, 0.11]}>
					{[-0.04, 0.04].map((x) => (
						<mesh key={x} position={[x, 0.01, 0.02]} material={m.socket}>
							<boxGeometry args={[0.028, 0.042, 0.02]} />
						</mesh>
					))}
				</group>
			)}
		</group>
	);
};

/** The darkroom bench: three trays, the print (its texture drawn by the caller) in the first or the
 * second; the safelight; tongs; prints hanging. rock: tray tilt; inTray: 0 developer, 1 stop bath. */
export const Darkroom: React.FC<{print: THREE.Texture; rock: number; inTray: number; tongs: V3}> = ({print, rock, inTray, tongs}) => {
	const m = useM();
	const pm = useMemo(() => ps1(new THREE.MeshLambertMaterial({map: print}), 64, SNAP6), [print]);
	const trayX = [-0.45, 0, 0.45];
	return (
		<group position={DARK}>
			<Box p={[0, 0.85, 0]} s={[1.8, 0.1, 0.8]} m={m.bench} />
			<Box p={[0, 1.6, -0.45]} s={[2.4, 1.6, 0.1]} m={m.wall} />
			<Box p={[-0.6, 1.9, -0.38]} s={[0.24, 0.14, 0.06]} m={m.safe} />
			{trayX.map((x, i) => (
				<group key={i} position={[x, 0.92, 0.05]} rotation={[0, 0, i === inTray ? rock : 0]}>
					<Box p={[0, 0, 0]} s={[0.4, 0.03, 0.5]} m={m.tray} />
					{[-1, 1].map((sd) => (
						<Box key={sd} p={[sd * 0.2, 0.03, 0]} s={[0.02, 0.06, 0.5]} m={m.tray} />
					))}
					{[-1, 1].map((sd) => (
						<Box key={`z${sd}`} p={[0, 0.03, sd * 0.25]} s={[0.4, 0.06, 0.02]} m={m.tray} />
					))}
					{i === inTray && (
						<mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={pm}>
							<planeGeometry args={[0.24, 0.32]} />
						</mesh>
					)}
					<mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.liquid}>
						<planeGeometry args={[0.38, 0.48]} />
					</mesh>
				</group>
			))}
			{/* the tongs */}
			<group position={tongs} rotation={[0.9, 0, 0.2]}>
				<Box p={[-0.01, 0, 0]} s={[0.012, 0.25, 0.01]} m={m.steel} />
				<Box p={[0.01, 0, 0]} s={[0.012, 0.25, 0.01]} m={m.steel} />
			</group>
			{/* the tap, the line with prints hanging */}
			<Box p={[0.85, 1.15, -0.3]} s={[0.04, 0.4, 0.04]} m={m.steel} />
			<Box p={[0.85, 1.32, -0.2]} s={[0.04, 0.04, 0.2]} m={m.steel} />
			<Box p={[0, 2.3, -0.2]} s={[2.4, 0.01, 0.01]} m={m.steel} />
			{[-0.8, -0.4, 0.4, 0.8].map((x) => (
				<Box key={x} p={[x, 2.12, -0.2]} s={[0.2, 0.28, 0.005]} m={m.hung} />
			))}
		</group>
	);
};

/** Draw the print: the staircase, a pale veiled figure at pos (0 top .. 1 at the lens), developed dev 0..1. */
export const drawPrint = (g: CanvasRenderingContext2D, w: number, h: number, dev: number, pos: number, figure: number) => {
	const r = rng(281);
	const img = g.createImageData(w, h);
	const fx = w / 2, fyTop = h * 0.3, fyBot = h * 1.05;
	const fy = fyTop + (fyBot - fyTop) * pos;
	const fs = 0.08 + 0.85 * pos * pos; // figure size as a fraction of the height
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const u = x / w, v = y / h;
			// the scene: dark panelled walls, the stair rising to a pale window
			let s = 0.12;
			const stairHalf = 0.12 + 0.36 * v;
			if (Math.abs(u - 0.5) < stairHalf && v > 0.25) {
				s = 0.22 + 0.12 * ((Math.floor(v * 40) % 2) === 0 ? 1 : 0) * v;
				if (Math.abs(Math.abs(u - 0.5) - stairHalf) < 0.025) s = 0.06; // the banisters
			}
			if (Math.abs(u - 0.5) < 0.07 && v > 0.08 && v < 0.24) s = 0.75; // the window
			// the figure: a pale veiled column, brighter at the head
			if (figure > 0) {
				const dx = (x - fx) / (h * fs * 0.22), dy = (y - (fy - h * fs * 0.5)) / (h * fs * 0.5);
				if (Math.abs(dy) < 1 && Math.abs(dx) < 1 - 0.3 * (1 - (dy + 1) / 2)) s = Math.max(s, 0.55 + 0.3 * (1 - (dy + 1) / 2));
				const hx = (x - fx) / (h * fs * 0.11), hy = (y - (fy - h * fs * 0.92)) / (h * fs * 0.11);
				if (hx * hx + hy * hy < 1) s = 0.92;
				// at the lens: two dark sockets under the veil
				if (pos > 0.85) {
					for (const ex of [-0.35, 0.35]) {
						const ox = (x - (fx + ex * h * fs * 0.11)) / (h * fs * 0.035), oy = (y - (fy - h * fs * 0.94)) / (h * fs * 0.03);
						if (ox * ox + oy * oy < 1) s = 0.05;
					}
				}
			}
			const grain = (r() - 0.5) * 0.08;
			// developing: from white paper to the image (dark areas come up first)
			const k = Math.min(1, Math.max(0, dev * 1.3 - (s * 0.6)));
			const val = 1 - (1 - s) * k + grain;
			const c = Math.max(0, Math.min(255, Math.round(val * 235)));
			const i = (y * w + x) * 4;
			img.data[i] = c;
			img.data[i + 1] = c;
			img.data[i + 2] = c;
			img.data[i + 3] = 255;
		}
	}
	g.putImageData(img, 0, 0);
};

/** The house at night: a long gabled front, its windows; the lawn; trees; a 1930s car on the drive. */
export const House: React.FC<{car: V3; carYaw: number; headlights: boolean}> = ({car, carYaw, headlights}) => {
	const m = useM();
	const trees = useMemo(() => {
		const r = rng(61);
		return Array.from({length: 30}, () => ({x: (r() - 0.5) * 220, z: -30 - r() * 60, h: 10 + r() * 10, s: 5 + r() * 4}));
	}, []);
	const gableShape = useMemo(() => {
		// a curved Dutch gable
		const s = new THREE.Shape();
		s.moveTo(-4, 0);
		s.lineTo(-4, 1.5);
		s.quadraticCurveTo(-2.6, 2.0, -2.4, 3.2);
		s.lineTo(-1.2, 3.4);
		s.quadraticCurveTo(-1.0, 4.6, 0, 5.0);
		s.quadraticCurveTo(1.0, 4.6, 1.2, 3.4);
		s.lineTo(2.4, 3.2);
		s.quadraticCurveTo(2.6, 2.0, 4, 1.5);
		s.lineTo(4, 0);
		return s;
	}, []);
	return (
		<group position={EXT}>
			<mesh material={m.sky}>
				<sphereGeometry args={[600, 10, 8]} />
			</mesh>
			<mesh position={[-120, 120, -400]} material={m.moon}>
				<circleGeometry args={[9, 14]} />
			</mesh>
			<Floor p={[0, 0, 30]} w={400} d={300} m={m.lawn} />
			<Box p={[0, 6, 0]} s={[56, 12, 14]} m={m.stone} />
			<Box p={[0, 13, 0]} s={[57, 2.5, 15]} m={m.roof} r={[0, 0, 0]} />
			{[-24, -8, 8, 24].map((x) => (
				<mesh key={x} position={[x, 12, 7.01]} material={m.stone}>
					<shapeGeometry args={[gableShape]} />
				</mesh>
			))}
			{Array.from({length: 3}, (_, f) =>
				Array.from({length: 12}, (_, i) => (
					<Box key={`${f}-${i}`} p={[-24.75 + i * 4.5, 2.4 + f * 3.4, 7.05]} s={[1.6, 2.2, 0.1]} m={f === 1 && i === 7 ? m.winL : m.winD} />
				)),
			)}
			{trees.map((t, i) => (
				<group key={i} position={[t.x, 0, t.z]}>
					<Box p={[0, t.h * 0.3, 0]} s={[0.8, t.h * 0.6, 0.8]} m={m.tree} />
					<mesh position={[0, t.h * 0.8, 0]} material={m.tree}>
						<icosahedronGeometry args={[t.s, 0]} />
					</mesh>
				</group>
			))}
			{/* the motor car */}
			<group position={car} rotation={[0, carYaw, 0]}>
				<Box p={[0, 0.7, 0]} s={[1.7, 0.7, 4.2]} m={m.car} />
				<Box p={[0, 1.35, 0.4]} s={[1.5, 0.7, 2.0]} m={m.car} />
				{[-0.65, 0.65].map((x) => [-1.4, 1.4].map((z) => (
					<mesh key={`${x}${z}`} position={[x * 1.15, 0.38, z]} rotation={[0, 0, Math.PI / 2]} material={m.car}>
						<cylinderGeometry args={[0.38, 0.38, 0.2, 10]} />
					</mesh>
				)))}
				{[-0.55, 0.55].map((x) => (
					<mesh key={x} position={[x, 0.95, -2.12]} material={headlights ? m.head : m.chrome}>
						<circleGeometry args={[0.14, 8]} />
					</mesh>
				))}
				<Box p={[0, 0.85, -2.12]} s={[0.5, 0.5, 0.05]} m={m.chrome} />
			</group>
		</group>
	);
};
