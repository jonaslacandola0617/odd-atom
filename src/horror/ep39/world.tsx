// Episode 39 world: "Sino ang Susundo" (Season 4, Filipino folk belief: the sundo). A composite public
// hospital ward at night; no real hospital, family or staff:
// - THE WARD: a tiled floor, pale green walls, a green-white fluorescent tube, curtains on rails, two
//   other beds behind their curtains, the doorway onto a dim corridor at the foot end;
// - THE BED: an iron bed, a pillow and blanket; Tatay lying on his back (his head turns, his mouth
//   smiles or moves, his hand reaches); the IV stand with its bag and a drip that falls; an oxygen
//   concentrator with its green light;
// - TWO MONOBLOC CHAIRS: mine on the near side; the other across the bed, which moves;
// - ME (the son) in my chair; NANAY, pale, in the far chair (the hook) and in the doorway (the end);
// - THE WALL BEHIND THE BED: the drip's shadow, and later a woman's beside it (canvas silhouettes).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1} from '../ps1';
import {SNAP6} from '../ep01/world';
import {Rider, RiderLook} from '../ep36/world';

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
const seg = (v: number, unit: number) => Math.min(24, Math.max(1, Math.ceil(v / unit)));
export const Box: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3; unit?: number}> = ({p, s, m, r, unit = 0.3}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={[s[0], s[1], s[2], seg(s[0], unit), seg(s[1], unit), seg(s[2], unit)]} />
	</mesh>
);
const Cyl: React.FC<{p: V3; r0: number; r1?: number; h: number; m: THREE.Material; rot?: V3; n?: number}> = ({p, r0, r1, h, m, rot, n = 8}) => (
	<mesh position={p} rotation={rot} material={m}>
		<cylinderGeometry args={[r1 ?? r0, r0, h, n]} />
	</mesh>
);

export const useMats = () =>
	useMemo(() => {
		const tile = tex(16, 16, (g) => {
			g.fillStyle = '#b8bcb0';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#9a9e94';
			g.fillRect(0, 0, 16, 1);
			g.fillRect(0, 0, 1, 16);
		}, [10, 10]);
		const curtain = tex(16, 16, (g) => {
			for (let x = 0; x < 16; x++) {
				g.fillStyle = x % 4 < 2 ? '#8aa8a0' : '#7a9890';
				g.fillRect(x, 0, 1, 16);
			}
		}, [6, 1]);
		return {
			tile: lam('#ffffff', {map: tile}),
			wall: lam('#a8b8a4'),
			wallLow: lam('#7a9080'),
			ceiling: lam('#8a908a'),
			tube: bas('#e8fff0'),
			curtain: lam('#ffffff', {map: curtain, side: THREE.DoubleSide}),
			rail: lam('#c8c8c8'),
			iron: lam('#d8d8d0'),
			mattress: lam('#c8ccd0'),
			pillow: lam('#e8e8e0'),
			blanket: lam('#7a8aa8'),
			skin: lam('#9a7458'),
			skinPale: lam('#b8b0a8'),
			hair: lam('#d8d8d0'),
			hairDark: lam('#0c0a08'),
			mouth: lam('#3a2a24'),
			ivBag: bas('#d8e8e0', {transparent: true, opacity: 0.6}),
			drop: bas('#e8f8ff'),
			concentrator: lam('#d8d4c8'),
			led: bas('#7aff8a'),
			chair: lam('#e8e8e4'),
			dark: bas('#05060a'),
			corridor: lam('#4a5a52'),
			corridorLight: bas('#c8e0c8'),
			shadow: new THREE.MeshBasicMaterial({color: '#000000', transparent: true, depthWrite: false}),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
export const MatsContext = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(MatsContext)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <MatsContext.Provider value={useMats()}>{children}</MatsContext.Provider>;

// the bed: centre at the origin, head at −z, foot at +z; mattress top at y 0.62
export const DOOR: V3 = [0.2, 0, 3.6];
export const HEAD: V3 = [0, 0.74, -0.75];
export const MY_CHAIR: V3 = [0.85, 0, -0.25];
export const FAR_CHAIR0: V3 = [-0.9, 0, 0.3];

// ------------------------------------------------------------------ the ward
export const Ward: React.FC<{shadowK: number; tubeFlick: number}> = ({shadowK, tubeFlick}) => {
	const M = useM();
	// the wall behind the bed carries the IV's shadow and, later, a woman's
	const shadowTex = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = 64;
		c.height = 64;
		const t = new THREE.CanvasTexture(c);
		t.magFilter = THREE.NearestFilter;
		t.minFilter = THREE.NearestFilter;
		t.generateMipmaps = false;
		return t;
	}, []);
	const g = (shadowTex.image as HTMLCanvasElement).getContext('2d')!;
	g.clearRect(0, 0, 64, 64);
	g.fillStyle = 'rgba(0,0,0,0.55)';
	// the IV stand and bag
	g.fillRect(14, 10, 2, 50);
	g.fillRect(10, 8, 9, 13);
	if (shadowK > 0) {
		// a woman: head, long hair, narrow shoulders, standing beside the drip
		g.fillStyle = `rgba(0,0,0,${0.55 * shadowK})`;
		const x = 26;
		g.beginPath();
		g.ellipse(x + 4, 16, 4, 5, 0, 0, Math.PI * 2);
		g.fill();
		g.fillRect(x, 18, 9, 10);
		g.fillRect(x - 1, 26, 11, 30);
	}
	shadowTex.needsUpdate = true;
	const shadowMat = useMemo(() => new THREE.MeshBasicMaterial({map: shadowTex, transparent: true, depthWrite: false}), [shadowTex]);
	return (
		<group>
			<Box p={[0, -0.02, 1]} s={[6, 0.04, 7]} m={M.tile} unit={0.5} />
			{/* walls: behind the bed (z −1.4), the sides, and the foot wall with the doorway */}
			<Box p={[0, 1.5, -1.45]} s={[6, 3, 0.1]} m={M.wall} unit={0.4} />
			<Box p={[0, 0.5, -1.39]} s={[6, 1.0, 0.02]} m={M.wallLow} unit={0.4} />
			<Box p={[-3, 1.5, 1]} s={[0.1, 3, 7]} m={M.wall} unit={0.5} />
			<Box p={[3, 1.5, 1]} s={[0.1, 3, 7]} m={M.wall} unit={0.5} />
			<Box p={[-1.6, 1.5, 3.75]} s={[2.8, 3, 0.1]} m={M.wall} unit={0.5} />
			<Box p={[1.95, 1.5, 3.75]} s={[2.1, 3, 0.1]} m={M.wall} unit={0.5} />
			<Box p={[0.2, 2.6, 3.75]} s={[1.1, 0.8, 0.1]} m={M.wall} unit={0.5} />
			{/* the corridor beyond the doorway, dim */}
			<Box p={[0.2, 1.1, 5.2]} s={[1.1, 2.2, 0.1]} m={M.corridor} unit={0.5} />
			<Box p={[0.2, -0.01, 4.5]} s={[1.1, 0.02, 1.5]} m={M.corridor} unit={0.5} />
			<Box p={[0.2, 2.18, 4.6]} s={[0.4, 0.02, 0.08]} m={M.corridorLight} unit={1} />
			<Box p={[0, 3.0, 1]} s={[6, 0.04, 7]} m={M.ceiling} unit={0.6} />
			{/* the tube */}
			<Box p={[0, 2.95, 0.2]} s={[0.08, 0.04, 1.2]} m={tubeFlick > 0.5 ? M.tube : M.dark} unit={1} />
			{/* the shadows on the wall */}
			<mesh position={[-0.75, 1.3, -1.38]} material={shadowMat}>
				<planeGeometry args={[1.6, 1.6]} />
			</mesh>
			{/* curtains on their rails, the other beds behind them */}
			{[-2.0, 2.1].map((x) => (
				<group key={x}>
					<Box p={[x, 2.4, 1.0]} s={[0.03, 0.03, 4]} m={M.rail} unit={1} />
					<mesh position={[x, 1.3, 1.6]} rotation={[0, Math.PI / 2, 0]} material={M.curtain}>
						<planeGeometry args={[2.6, 2.2, 6, 2]} />
					</mesh>
				</group>
			))}
		</group>
	);
};

// ------------------------------------------------------------------ the bed, the IV, the machine, Tatay
export const Bed: React.FC<{t: number; look: number; smile: number; talk: number; reach: number; breathe?: number; figure?: boolean; mattress?: boolean}> = ({t, look, smile, talk, reach, breathe = 1, figure = true, mattress = true}) => {
	const M = useM();
	const b = Math.sin(t * 1.4) * 0.006 * breathe;
	const drop = (t * 0.9) % 1;
	const mouth = 0.006 + 0.012 * talk * Math.abs(Math.sin(t * 9));
	return (
		<group>
			{/* the iron frame */}
			{[-0.45, 0.45].map((x) =>
				[-1.0, 1.0].map((z) => <Cyl key={`${x}${z}`} p={[x, 0.45, z]} r0={0.025} h={0.9} m={M.iron} n={5} />),
			)}
			<Box p={[0, 0.8, -1.0]} s={[0.92, 0.04, 0.04]} m={M.iron} unit={1} />
			<Box p={[0, 0.5, 0]} s={[0.9, 0.06, 2.0]} m={M.iron} unit={0.4} />
			{mattress && <Box p={[0, 0.58, 0]} s={[0.86, 0.1, 1.95]} m={M.mattress} unit={0.3} />}
			<Box p={[0, mattress ? 0.66 : 0.75, -0.75]} s={[0.55, 0.08, 0.32]} m={M.pillow} unit={0.1} />
			{/* the blanket over his body (none on the PSX mattress: he lies on it) */}
			{mattress && <Box p={[0, 0.7 + b, 0.2]} s={[0.62, 0.14, 1.4]} m={M.blanket} unit={0.2} />}
			{figure && (
				<>
			{/* his head, lying face up, tipped toward the foot (the doorway); look > 0 turns it toward my chair */}
			<group position={HEAD} rotation={[-Math.PI / 2 + 0.25, 0, 0]}>
				<group rotation={[0, look * 0.6, 0]}>
					<Box p={[0, 0, 0]} s={[0.17, 0.2, 0.19]} m={M.skin} unit={0.05} />
					<Box p={[0, 0.06, -0.06]} s={[0.18, 0.12, 0.1]} m={M.hair} unit={0.05} />
					{/* eyes, half open; brows; mouth (a smile widens it, talking opens it) */}
					{[-0.04, 0.04].map((x) => (
						<Box key={x} p={[x, 0.03, 0.096]} s={[0.03, 0.01, 0.01]} m={M.mouth} unit={1} />
					))}
					<Box p={[0, -0.01, 0.105]} s={[0.025, 0.04, 0.02]} m={M.skin} unit={1} />
					<Box p={[0, -0.055, 0.097]} s={[0.045 + 0.03 * smile, mouth, 0.01]} m={M.mouth} unit={1} />
					{smile > 0 &&
						[-1, 1].map((s) => (
							<Box key={s} p={[s * (0.03 + 0.015 * smile), -0.05 + 0.005 * smile, 0.097]} s={[0.012, 0.008, 0.01]} m={M.mouth} unit={1} />
						))}
				</group>
			</group>
			{/* his arm, out from the blanket toward my chair; his hand reaches for mine */}
			<group position={[0.28, 0.72, -0.25]} rotation={[0, 0, -0.9 * reach]}>
				<Box p={[0.12, 0, 0]} s={[0.24, 0.06, 0.07]} m={M.skin} unit={1} />
				<Box p={[0.26, 0, 0]} s={[0.07, 0.03, 0.08]} m={M.skin} unit={1} />
			</group>
				</>
			)}
			{/* the IV stand at the head, the bag, the drip falling */}
			<Cyl p={[-0.65, 0.95, -1.05]} r0={0.015} h={1.9} m={M.iron} n={5} />
			<Box p={[-0.65, 1.75, -1.05]} s={[0.14, 0.2, 0.04]} m={M.ivBag} unit={1} />
			<Cyl p={[-0.65, 1.55, -1.05]} r0={0.012} h={0.08} m={M.ivBag} n={6} />
			<Box p={[-0.65, 1.575 - 0.05 * drop, -1.05]} s={[0.006, 0.01, 0.006]} m={M.drop} unit={1} />
			{/* the oxygen concentrator by the wall */}
			<Box p={[-0.95, 0.35, -1.15]} s={[0.35, 0.7, 0.3]} m={M.concentrator} unit={0.2} />
			<Box p={[-0.95, 0.6, -0.995]} s={[0.04, 0.03, 0.01]} m={M.led} unit={1} />
		</group>
	);
};

// ------------------------------------------------------------------ the chairs and the people
export const Chair: React.FC<{p: V3; ry: number}> = ({p, ry}) => {
	const M = useM();
	return (
		<group position={p} rotation={[0, ry, 0]}>
			{[-0.2, 0.2].map((x) =>
				[-0.18, 0.18].map((z) => <Box key={`${x}${z}`} p={[x, 0.21, z]} s={[0.04, 0.42, 0.04]} m={M.chair} unit={1} />),
			)}
			<Box p={[0, 0.44, 0]} s={[0.46, 0.04, 0.44]} m={M.chair} unit={0.2} />
			<Box p={[0, 0.72, -0.21]} s={[0.44, 0.5, 0.04]} m={M.chair} unit={0.2} />
		</group>
	);
};
const ME: RiderLook = {shirt: '#4a5a6a', pants: '#2a2a2a', hair: 'short'};
const NANAY: RiderLook = {shirt: '#d8d4c8', pants: '#c8c4b8', skin: '#b8b0a8', hair: 'long', hairColor: '#1a1816'};
export const Me: React.FC<{asleep: number; turn: number}> = ({asleep, turn}) => (
	<Rider look={ME} pose="sit" position={[MY_CHAIR[0], 0.0, MY_CHAIR[2]]} rotation={[0, -Math.PI / 2, 0]} bow={0.6 * asleep} yaw={turn * 1.4} hug={0} />
);
export const Nanay: React.FC<{pose: 'sit' | 'stand'; p: V3; ry: number; bow?: number}> = ({pose, p, ry, bow = 0}) => (
	<Rider look={NANAY} pose={pose} position={p} rotation={[0, ry, 0]} bow={bow} />
);
