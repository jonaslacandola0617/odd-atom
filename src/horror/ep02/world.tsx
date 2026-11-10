// Episode 2 world: "The Mask on Channel 11". One consistent low-poly set.
//
// Layout (metres, y up).
//   Apartment living room x[-3,3] z[-2.5,2.5] (3rd floor of a Chicago three-flat).
//   The CRT console sits against the south wall (z = +2.2), screen facing -z.
//   The armchair faces it from z = -0.5. The window with venetian blinds is on the
//   east wall (x = 3) and looks out to the downtown skyline and the transmitter
//   tower in the far east (+x, ~220 m away), so the tower in exterior shots is the
//   same one seen through the blinds.
//   Station master control (channel 9) is a separate interior set at x = -60.
//   Transmitter room (channel 11) is a separate interior set at x = -120.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1, rng} from '../ps1';
import {SNAP6} from '../ep01/world';

const M = (color: string, opts: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...opts}), 20, SNAP6);
const B = (color: string, opts: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...opts}), 20, SNAP6);

export const tex = (w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void, seed = 1, repeat?: [number, number]) => {
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	draw(c.getContext('2d')!, rng(seed));
	const t = new THREE.CanvasTexture(c);
	t.magFilter = THREE.NearestFilter;
	t.minFilter = THREE.NearestFilter;
	t.generateMipmaps = false;
	t.colorSpace = THREE.SRGBColorSpace;
	if (repeat) {
		t.wrapS = t.wrapT = THREE.RepeatWrapping;
		t.repeat.set(...repeat);
	}
	return t;
};

const useMats = () =>
	useMemo(() => {
		const carpet = tex(32, 32, (g, r) => {
			g.fillStyle = '#5a4a2e';
			g.fillRect(0, 0, 32, 32);
			for (let i = 0; i < 260; i++) {
				g.fillStyle = r() > 0.5 ? '#665636' : '#4a3c24';
				g.fillRect(Math.floor(r() * 32), Math.floor(r() * 32), 1, 1);
			}
		}, 2, [6, 5]);
		// 70s/80s wallpaper: muted vertical stripes with a small motif
		const wall = tex(16, 32, (g, r) => {
			g.fillStyle = '#6a5c44';
			g.fillRect(0, 0, 16, 32);
			for (let x = 0; x < 16; x += 8) {
				g.fillStyle = '#5c4f3a';
				g.fillRect(x, 0, 3, 32);
			}
			for (let y = 2; y < 32; y += 8) {
				g.fillStyle = '#7a6a4e';
				g.fillRect(5, y, 2, 2);
				g.fillRect(13, y + 4, 2, 2);
			}
			for (let i = 0; i < 8; i++) {
				g.fillStyle = '#504432';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 32), 1, 1);
			}
		}, 3, [10, 2]);
		const panel = tex(16, 32, (g) => {
			g.fillStyle = '#4a3220';
			g.fillRect(0, 0, 16, 32);
			for (let x = 0; x < 16; x += 4) {
				g.fillStyle = '#3a2618';
				g.fillRect(x, 0, 1, 32);
			}
		}, 4, [6, 1]);
		const fabric = tex(16, 16, (g, r) => {
			g.fillStyle = '#7a4a2a';
			g.fillRect(0, 0, 16, 16);
			for (let y = 0; y < 16; y += 2) for (let x = (y % 4) / 2; x < 16; x += 2) {
				g.fillStyle = r() > 0.6 ? '#8a5632' : '#6a3e22';
				g.fillRect(x, y, 1, 1);
			}
		}, 5, [2, 2]);
		const tile = tex(16, 16, (g) => {
			g.fillStyle = '#4a4e52';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#3a3e42';
			g.fillRect(0, 7, 16, 1);
			g.fillRect(7, 0, 1, 16);
			g.fillRect(0, 15, 16, 1);
			g.fillRect(15, 0, 1, 16);
		}, 6, [10, 6]);
		const rack = tex(16, 32, (g, r) => {
			g.fillStyle = '#2c3034';
			g.fillRect(0, 0, 16, 32);
			for (let y = 1; y < 32; y += 3) {
				g.fillStyle = '#3c4246';
				g.fillRect(1, y, 14, 2);
				if (r() > 0.4) {
					g.fillStyle = r() > 0.7 ? '#e04030' : r() > 0.5 ? '#40d060' : '#e0b040';
					g.fillRect(2 + Math.floor(r() * 10), y, 1, 1);
				}
			}
		}, 7);
		const concrete = tex(16, 16, (g, r) => {
			g.fillStyle = '#5a5a58';
			g.fillRect(0, 0, 16, 16);
			for (let i = 0; i < 40; i++) {
				g.fillStyle = r() > 0.5 ? '#626260' : '#4e4e4c';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
			}
		}, 8, [6, 3]);
		// office tower facade: a grid of mostly dark windows, a few lit
		const facade = (seed: number, lit: number) =>
			tex(16, 32, (g, r) => {
				g.fillStyle = '#16181e';
				g.fillRect(0, 0, 16, 32);
				for (let y = 1; y < 32; y += 2)
					for (let x = 1; x < 16; x += 2) {
						g.fillStyle = r() < lit ? (r() > 0.5 ? '#e8c880' : '#c8d0d8') : '#0c0e12';
						g.fillRect(x, y, 1, 1);
					}
			}, seed, [3, 6]);
		const brick = tex(16, 16, (g, r) => {
			g.fillStyle = '#5a3428';
			g.fillRect(0, 0, 16, 16);
			for (let y = 0; y < 16; y += 4) {
				g.fillStyle = '#3e241c';
				g.fillRect(0, y + 3, 16, 1);
				for (let x = (y % 8 ? 4 : 0); x < 16; x += 8) g.fillRect(x, y, 1, 3);
				if (r() > 0.5) {
					g.fillStyle = '#683c2e';
					g.fillRect(Math.floor(r() * 14), y, 3, 3);
				}
			}
		}, 9, [4, 4]);
		const steel = tex(8, 8, (g) => {
			g.fillStyle = '#3a3e44';
			g.fillRect(0, 0, 8, 8);
			g.fillStyle = '#4a4e54';
			g.fillRect(0, 0, 8, 1);
			g.fillRect(0, 4, 8, 1);
		}, 10, [1, 8]);
		return {
			carpet: M('#ffffff', {map: carpet}),
			wall: M('#ffffff', {map: wall, side: THREE.DoubleSide}),
			panel: M('#ffffff', {map: panel, side: THREE.DoubleSide}),
			ceiling: M('#3a362e', {side: THREE.DoubleSide}),
			fabric: M('#ffffff', {map: fabric}),
			fabricDark: M('#5a3420'),
			wood: M('#4a3020'),
			woodLight: M('#6a4a30'),
			tvBody: M('#3a2a1c'),
			tvDark: M('#121214'),
			metal: M('#8a8a88'),
			chrome: M('#b0b0b4'),
			blinds: M('#b8b0a0', {side: THREE.DoubleSide}),
			windowGlow: B('#1a2236'),
			lampShade: M('#c8b890'),
			paper: M('#d8d4c4'),
			tile: M('#ffffff', {map: tile, side: THREE.DoubleSide}),
			rack: M('#ffffff', {map: rack}),
			console: M('#4a4e50'),
			consoleTop: M('#2a2c2e'),
			concrete: M('#ffffff', {map: concrete, side: THREE.DoubleSide}),
			chair: M('#2a2a2e'),
			facadeA: B('#ffffff', {map: facade(11, 0.12)}),
			facadeB: B('#ffffff', {map: facade(12, 0.06)}),
			facadeC: B('#ffffff', {map: facade(13, 0.18)}),
			brick: M('#ffffff', {map: brick}),
			roof: M('#22242a'),
			steel: M('#ffffff', {map: steel}),
			beacon: B('#ff2a1a'),
			beaconOff: B('#3a0a08'),
			dish: M('#9a9a96', {side: THREE.DoubleSide}),
			black: B('#000000'),
			ground: M('#141618'),
			water: B('#05070c'),
			glass: B('#1a2a3a', {transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false}),
		};
	}, []);

export type Mats = ReturnType<typeof useMats>;
const MatsContext = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(MatsContext)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <MatsContext.Provider value={useMats()}>{children}</MatsContext.Provider>;

export const Box: React.FC<{p: [number, number, number]; s: [number, number, number]; m: THREE.Material; r?: [number, number, number]}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={s} />
	</mesh>
);

/** Plane with a canvas texture that faces -z (towards the room) when rotY = PI. */
const Screen: React.FC<{p: [number, number, number]; w: number; h: number; map: THREE.Texture; rotY?: number}> = ({p, w, h, map, rotY = Math.PI}) => {
	const m = useMemo(() => ps1(new THREE.MeshBasicMaterial({map}), 20, SNAP6), [map]);
	return (
		<mesh position={p} rotation={[0, rotY, 0]} material={m}>
			<planeGeometry args={[w, h]} />
		</mesh>
	);
};

export const VIEWER = {skin: '#c09070', hair: '#3a2a1e', top: '#5a3a3a', legs: '#2a3040'};
export const ENGINEER = {skin: '#a87e64', hair: '#2a2420', top: '#8a8a7a', legs: '#2c2a26'};

// ------------------------------------------------------------------ apartment

export const TV_SCREEN_Z = 1.885; // the glass of the CRT
export const Apartment: React.FC<{screen: THREE.Texture; vcr: THREE.Texture; clock: THREE.Texture; listings: THREE.Texture; tvOn: number; blindsLight: number; seeThrough?: boolean}> = ({screen, vcr, clock, listings, tvOn, blindsLight, seeThrough}) => {
	const mm = useM();
	const slats = useMemo(() => new Array(14).fill(0).map((_, i) => i), []);
	const glowM = useMemo(() => B('#2a3450'), []);
	glowM.color.setRGB(0.1 + blindsLight * 0.12, 0.12 + blindsLight * 0.13, 0.2 + blindsLight * 0.2);
	return (
		<group>
			<Box p={[0, -0.05, 0]} s={[6.2, 0.1, 5.2]} m={mm.carpet} />
			<Box p={[0, 2.65, 0]} s={[6.2, 0.1, 5.2]} m={mm.ceiling} />
			{/* south wall (behind the TV) wood panelling below, wallpaper above */}
			<Box p={[0, 1.3, 2.55]} s={[6.2, 2.6, 0.1]} m={mm.wall} />
			<Box p={[0, 0.5, 2.49]} s={[6.2, 1.0, 0.02]} m={mm.panel} />
			<Box p={[0, 1.3, -2.55]} s={[6.2, 2.6, 0.1]} m={mm.wall} />
			<Box p={[-3.05, 1.3, 0]} s={[0.1, 2.6, 5.2]} m={mm.wall} />
			<Box p={[-2.99, 0.5, 0]} s={[0.02, 1.0, 5.2]} m={mm.panel} />
			{/* east wall with window z[-0.9,0.9] y[0.9,2.1] */}
			<Box p={[3.05, 1.3, -1.75]} s={[0.1, 2.6, 1.7]} m={mm.wall} />
			<Box p={[3.05, 1.3, 1.75]} s={[0.1, 2.6, 1.7]} m={mm.wall} />
			<Box p={[3.05, 0.45, 0]} s={[0.1, 0.9, 1.8]} m={mm.wall} />
			<Box p={[3.05, 2.38, 0]} s={[0.1, 0.55, 1.8]} m={mm.wall} />
			<Box p={[3.06, 1.5, 0]} s={[0.02, 1.2, 1.8]} m={mm.glass} />
			<Box p={[2.95, 0.88, 0]} s={[0.2, 0.05, 1.95]} m={mm.woodLight} />
			{/* venetian blinds: half-open slats; the city glow shows between them */}
			{!seeThrough && (
				<mesh position={[3.12, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]} material={glowM}>
					<planeGeometry args={[1.8, 1.2]} />
				</mesh>
			)}
			{slats.map((i) => (
				<Box key={i} p={[2.97, 2.08 - i * 0.085, 0]} s={[0.05, 0.01, 1.84]} m={mm.blinds} r={[0, 0, 0.08]} />
			))}
			<Box p={[2.97, 2.14, 0]} s={[0.06, 0.05, 1.9]} m={mm.wood} />
			{/* TV console: wood cabinet CRT with rabbit ears; VCR on a shelf */}
			<group position={[0, 0, 2.2]}>
				<Box p={[0, 0.3, 0]} s={[1.3, 0.6, 0.55]} m={mm.wood} />
				<Box p={[0, 0.17, -0.28]} s={[1.2, 0.02, 0.02]} m={mm.woodLight} />
				<Box p={[0, 0.88, 0.05]} s={[0.92, 0.56, 0.6]} m={mm.tvBody} />
				<Box p={[0.0, 0.89, -0.255]} s={[0.66, 0.49, 0.03]} m={mm.tvDark} />
				{/* control strip right of the screen */}
				<Box p={[0.39, 0.89, -0.26]} s={[0.1, 0.46, 0.02]} m={mm.woodLight} />
				<Box p={[0.39, 1.0, -0.275]} s={[0.05, 0.05, 0.02]} m={mm.chrome} />
				<Box p={[0.39, 0.9, -0.275]} s={[0.05, 0.05, 0.02]} m={mm.chrome} />
				{/* rabbit ears */}
				<Box p={[0, 1.18, 0.05]} s={[0.14, 0.04, 0.1]} m={mm.tvDark} />
				<Box p={[-0.12, 1.42, 0.05]} s={[0.012, 0.5, 0.012]} m={mm.chrome} r={[0, 0, 0.5]} />
				<Box p={[0.12, 1.42, 0.05]} s={[0.012, 0.5, 0.012]} m={mm.chrome} r={[0, 0, -0.5]} />
				{/* VCR in the cabinet shelf */}
				<Box p={[-0.15, 0.42, -0.2]} s={[0.5, 0.09, 0.3]} m={mm.tvDark} />
				<Box p={[-0.3, 0.42, -0.352]} s={[0.16, 0.025, 0.005]} m={mm.black} />
			</group>
			<Screen p={[0, 0.89, 1.918]} w={0.6} h={0.45} map={screen} />
			<Screen p={[-0.02, 0.425, 1.847]} w={0.14} h={0.044} map={vcr} />
			{/* wall clock above and right of the TV */}
			<Box p={[0.95, 1.95, 2.49]} s={[0.36, 0.36, 0.04]} m={mm.wood} />
			<Screen p={[0.95, 1.95, 2.465]} w={0.3} h={0.3} map={clock} />
			{/* armchair facing the TV */}
			<group position={[-0.2, 0, -0.5]}>
				<Box p={[0, 0.22, 0]} s={[0.85, 0.44, 0.85]} m={mm.fabric} />
				<Box p={[0, 0.78, -0.36]} s={[0.85, 0.8, 0.18]} m={mm.fabric} />
				<Box p={[-0.47, 0.42, 0]} s={[0.16, 0.42, 0.85]} m={mm.fabricDark} />
				<Box p={[0.47, 0.42, 0]} s={[0.16, 0.42, 0.85]} m={mm.fabricDark} />
			</group>
			{/* side table + lamp (off) */}
			<Box p={[-1.0, 0.3, -0.5]} s={[0.45, 0.6, 0.45]} m={mm.wood} />
			<Box p={[-1.0, 0.72, -0.5]} s={[0.06, 0.24, 0.06]} m={mm.chrome} />
			<mesh position={[-1.0, 0.95, -0.5]} material={mm.lampShade}>
				<cylinderGeometry args={[0.12, 0.2, 0.24, 6, 1, true]} />
			</mesh>
			{/* coffee table with the TV listings */}
			<Box p={[-0.1, 0.22, 0.85]} s={[0.9, 0.05, 0.5]} m={mm.woodLight} />
			<Box p={[-0.45, 0.1, 0.85]} s={[0.05, 0.2, 0.45]} m={mm.wood} />
			<Box p={[0.25, 0.1, 0.85]} s={[0.05, 0.2, 0.45]} m={mm.wood} />
			<mesh position={[0.05, 0.249, 0.82]} rotation={[-Math.PI / 2, 0, Math.PI + 0.25]}>
				<planeGeometry args={[0.2, 0.26]} />
				<meshBasicMaterial map={listings} />
			</mesh>
			{/* a can and an ashtray: lived-in */}
			<mesh position={[-0.35, 0.29, 0.78]} material={mm.metal}>
				<cylinderGeometry args={[0.033, 0.033, 0.12, 6]} />
			</mesh>
			<mesh position={[-0.25, 0.255, 0.95]} material={mm.tvDark}>
				<cylinderGeometry args={[0.07, 0.06, 0.02, 7]} />
			</mesh>
			{/* framed picture, bookshelf on the west wall */}
			<Box p={[-2.97, 1.65, -0.9]} s={[0.03, 0.42, 0.6]} m={mm.wood} />
			<Box p={[-2.8, 0.9, 1.2]} s={[0.35, 1.8, 0.9]} m={mm.wood} />
			{[0.4, 0.85, 1.3, 1.7].map((y) => (
				<Box key={y} p={[-2.74, y, 1.2]} s={[0.2, 0.28, 0.8]} m={y > 1 ? mm.fabricDark : mm.panel} />
			))}
			{/* doorway to the hall, north wall, dark */}
			<Box p={[-1.6, 1.05, -2.49]} s={[0.9, 2.1, 0.02]} m={mm.black} />
		</group>
	);
};

// ------------------------------------------------------------------ station master control (channel 9), at x = -60

export const MC_X = -60;
export const MasterControl: React.FC<{feed: THREE.Texture; preview: THREE.Texture; lever: number}> = ({feed, preview, lever}) => (
	<MasterControlInner feed={feed} preview={preview} lever={lever} />
);
const MasterControlInner: React.FC<{feed: THREE.Texture; preview: THREE.Texture; lever: number}> = ({feed, preview, lever}) => {
	const mm = useM();
	return (
		<group position={[MC_X, 0, 0]}>
			<Box p={[0, -0.05, 0]} s={[8, 0.1, 6]} m={mm.tile} />
			<Box p={[0, 2.85, 0]} s={[8, 0.1, 6]} m={mm.ceiling} />
			<Box p={[0, 1.4, 2.6]} s={[8, 2.8, 0.1]} m={mm.concrete} />
			<Box p={[0, 1.4, -2.6]} s={[8, 2.8, 0.1]} m={mm.concrete} />
			<Box p={[-3.5, 1.4, 0]} s={[0.1, 2.8, 6]} m={mm.concrete} />
			<Box p={[3.5, 1.4, 0]} s={[0.1, 2.8, 6]} m={mm.concrete} />
			{/* monitor wall on the south side */}
			<Box p={[0, 1.55, 2.35]} s={[4.4, 1.9, 0.4]} m={mm.console} />
			{[-1.5, -0.5, 0.5, 1.5].map((x, i) => (
				<group key={x}>
					<Box p={[x, 1.85, 2.13]} s={[0.78, 0.6, 0.06]} m={mm.tvDark} />
					<Screen p={[x, 1.85, 2.095]} w={0.66} h={0.5} map={i === 1 ? feed : preview} />
					<Box p={[x, 1.15, 2.13]} s={[0.78, 0.6, 0.06]} m={mm.tvDark} />
					<Screen p={[x, 1.15, 2.095]} w={0.66} h={0.5} map={i === 2 ? feed : preview} />
				</group>
			))}
			{/* the desk with switch panel */}
			<Box p={[0, 0.45, 1.25]} s={[4.0, 0.9, 0.8]} m={mm.console} />
			<Box p={[0, 0.92, 1.2]} s={[4.1, 0.06, 0.95]} m={mm.consoleTop} r={[-0.18, 0, 0]} />
			{new Array(16).fill(0).map((_, i) => (
				<Box key={i} p={[-1.2 + i * 0.16, 0.97, 1.05 + (i % 2) * 0.12]} s={[0.06, 0.02, 0.06]} m={i % 5 === 0 ? mm.beacon : mm.chrome} />
			))}
			{/* the big switch the engineer throws */}
			<group position={[0.35, 0.98, 0.95]} rotation={[-0.6 + lever * 1.2, 0, 0]}>
				<Box p={[0, 0.09, 0]} s={[0.03, 0.18, 0.03]} m={mm.chrome} />
				<Box p={[0, 0.19, 0]} s={[0.06, 0.05, 0.06]} m={mm.beacon} />
			</group>
			<Box p={[-2.8, 1.0, 1.5]} s={[0.6, 2.0, 0.6]} m={mm.rack} />
			<Box p={[2.8, 1.0, 1.5]} s={[0.6, 2.0, 0.6]} m={mm.rack} />
			{/* chair */}
			<Box p={[0.3, 0.45, 0.25]} s={[0.5, 0.06, 0.5]} m={mm.chair} />
			<Box p={[0.3, 0.75, 0.02]} s={[0.5, 0.6, 0.06]} m={mm.chair} />
			<Box p={[0.3, 0.22, 0.25]} s={[0.06, 0.44, 0.06]} m={mm.chrome} />
		</group>
	);
};

// ------------------------------------------------------------------ transmitter room (channel 11), at x = -120

export const TX_X = -120;
export const TransmitterRoom: React.FC<{feed: THREE.Texture; beacon: number; flicker: number}> = ({feed, beacon, flicker}) => {
	const mm = useM();
	return (
		<group position={[TX_X, 0, 0]}>
			<Box p={[0, -0.05, 0]} s={[7, 0.1, 6]} m={mm.concrete} />
			<Box p={[0, 2.75, 0]} s={[7, 0.1, 6]} m={mm.concrete} />
			<Box p={[0, 1.35, 2.6]} s={[7, 2.7, 0.1]} m={mm.concrete} />
			<Box p={[-3.0, 1.35, 0]} s={[0.1, 2.7, 6]} m={mm.concrete} />
			<Box p={[3.0, 1.35, -1.5]} s={[0.1, 2.7, 3]} m={mm.concrete} />
			<Box p={[3.0, 1.35, 2.0]} s={[0.1, 2.7, 1.2]} m={mm.concrete} />
			<Box p={[3.0, 0.4, 0.75]} s={[0.1, 0.8, 1.3]} m={mm.concrete} />
			<Box p={[3.0, 2.35, 0.75]} s={[0.1, 0.8, 1.3]} m={mm.concrete} />
			{/* small window: the red beacon blinks outside */}
			<mesh position={[3.1, 1.37, 0.75]} rotation={[0, -Math.PI / 2, 0]}>
				<planeGeometry args={[1.3, 1.15]} />
				<meshBasicMaterial color={new THREE.Color(0.04 + beacon * 0.35, 0.02, 0.03)} />
			</mesh>
			<Box p={[0, 1.35, -2.6]} s={[7, 2.7, 0.1]} m={mm.concrete} />
			{/* transmitter cabinets along the west wall */}
			{[-2.0, -1.2, -0.4, 0.4, 1.2].map((z) => (
				<Box key={z} p={[-2.6, 1.05, z]} s={[0.7, 2.1, 0.75]} m={mm.rack} />
			))}
			{/* the air monitor on a cart, showing channel 11 */}
			<Box p={[0.6, 0.45, 2.0]} s={[0.8, 0.9, 0.6]} m={mm.console} />
			<Box p={[0.6, 1.17, 2.0]} s={[0.66, 0.52, 0.5]} m={mm.tvDark} />
			<Screen p={[0.6, 1.17, 1.745]} w={0.54} h={0.4} map={feed} />
			{/* empty desk and chair: nobody is on duty */}
			<Box p={[1.6, 0.72, 1.0]} s={[1.2, 0.05, 0.6]} m={mm.consoleTop} />
			<Box p={[1.1, 0.36, 1.0]} s={[0.05, 0.72, 0.55]} m={mm.chrome} />
			<Box p={[2.1, 0.36, 1.0]} s={[0.05, 0.72, 0.55]} m={mm.chrome} />
			<group position={[1.4, 0, 0.35]} rotation={[0, 0.5, 0]}>
				<Box p={[0, 0.45, 0]} s={[0.5, 0.06, 0.5]} m={mm.chair} />
				<Box p={[0, 0.75, -0.23]} s={[0.5, 0.6, 0.06]} m={mm.chair} />
				<Box p={[0, 0.22, 0]} s={[0.06, 0.44, 0.06]} m={mm.chrome} />
			</group>
			<mesh position={[1.75, 0.77, 1.05]} material={mm.paper} rotation={[-Math.PI / 2, 0, 0.2]}>
				<planeGeometry args={[0.3, 0.22]} />
			</mesh>
			{/* fluorescent tube, flickering */}
			<mesh position={[0, 2.68, 0.5]}>
				<boxGeometry args={[1.4, 0.05, 0.12]} />
				<meshBasicMaterial color={new THREE.Color(0.25 + flicker * 0.6, 0.3 + flicker * 0.6, 0.32 + flicker * 0.6)} />
			</mesh>
		</group>
	);
};

// ------------------------------------------------------------------ the city + the tower (far east of the apartment)

export const TOWER: [number, number, number] = [220, 0, 10];
export const TOWER_TOP = 150;

const Building: React.FC<{p: [number, number, number]; s: [number, number, number]; m: THREE.Material}> = ({p, s, m}) => {
	const mm = useM();
	return (
		<group position={p}>
			<mesh position={[0, s[1] / 2, 0]} material={m}>
				<boxGeometry args={s} />
			</mesh>
			<Box p={[0, s[1] + 0.5, 0]} s={[s[0] * 0.9, 1, s[2] * 0.9]} m={mm.roof} />
		</group>
	);
};

export const City: React.FC<{beacon: number}> = ({beacon}) => {
	const mm = useM();
	const blocks = useMemo(() => {
		const r = rng(77);
		const out: {p: [number, number, number]; s: [number, number, number]; k: number}[] = [];
		for (let i = 0; i < 46; i++) {
			const x = 120 + r() * 170;
			const z = -90 + r() * 180;
			if (Math.abs(x - TOWER[0]) < 14 && Math.abs(z - TOWER[2]) < 14) continue;
			const near = Math.max(0, 1 - Math.hypot(x - 200, z) / 120);
			const h = 20 + r() * 50 + near * 70;
			out.push({p: [x, 0, z], s: [8 + r() * 10, h, 8 + r() * 10], k: Math.floor(r() * 3)});
		}
		return out;
	}, []);
	const mats = [mm.facadeA, mm.facadeB, mm.facadeC];
	const bOn = beacon > 0.5 ? mm.beacon : mm.beaconOff;
	return (
		<group>
			<Box p={[100, -0.2, 0]} s={[500, 0.2, 500]} m={mm.ground} />
			{/* the lake to the north-east is just a black plane */}
			<Box p={[200, -0.1, -260]} s={[500, 0.1, 200]} m={mm.water} />
			{blocks.map((b, i) => (
				<Building key={i} p={b.p} s={b.s} m={mats[b.k]} />
			))}
			{/* the transmitter tower: a dark slab with an antenna mast, dishes and beacons */}
			<group position={TOWER}>
				<mesh position={[0, TOWER_TOP / 2, 0]} material={mm.facadeB}>
					<boxGeometry args={[16, TOWER_TOP, 16]} />
				</mesh>
				<Box p={[0, TOWER_TOP + 2, 0]} s={[13, 4, 13]} m={mm.roof} />
				<Box p={[0, TOWER_TOP + 4.5, 0]} s={[6, 1.2, 6]} m={mm.steel} />
				{[-3.5, 3.5].map((x) => (
					<group key={x} position={[x, TOWER_TOP + 4, 0]}>
						<Box p={[0, 22, 0]} s={[0.9, 44, 0.9]} m={mm.steel} />
						<Box p={[0, 44.5, 0]} s={[2.4, 2.4, 2.4]} m={bOn} />
						<Box p={[0, 24, 0]} s={[1.8, 1.8, 1.8]} m={bOn} />
						{beacon > 0.5 && (
							<mesh position={[-3, 44.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
								<circleGeometry args={[7, 8]} />
								<meshBasicMaterial color="#ff3a2a" transparent opacity={0.22} depthWrite={false} fog={false} />
							</mesh>
						)}
					</group>
				))}
				{/* microwave dishes (the studio-to-transmitter links) */}
				{[[-5, 0.6], [4.5, -0.9], [0, 2.6]].map(([z, ry], i) => (
					<group key={i} position={[-6.6, TOWER_TOP + 3.2 + i * 1.5, z]} rotation={[0, ry - Math.PI / 2, 0]}>
						<mesh material={mm.dish} rotation={[Math.PI / 2, 0, 0]}>
							<cylinderGeometry args={[1.4, 0.8, 0.6, 8, 1, true]} />
						</mesh>
						<Box p={[0, 0, 0.5]} s={[0.3, 0.3, 0.8]} m={mm.steel} />
					</group>
				))}
			</group>
			{/* near rooftops: Chicago three-flats on our block */}
			{[[18, -12], [30, 14], [42, -20], [55, 6], [12, 22], [70, -8]].map(([x, z], i) => (
				<group key={i} position={[x, 0, z]}>
					<Box p={[0, 5.5, 0]} s={[8, 11, 10]} m={mm.brick} />
					<Box p={[0, 11.2, 0]} s={[8.4, 0.4, 10.4]} m={mm.roof} />
					<Box p={[2, 12, 3]} s={[0.6, 1.6, 0.6]} m={mm.brick} />
				</group>
			))}
			{/* our building around the apartment */}
			<group>
				<Box p={[0, -5.6, 0]} s={[7, 11, 6]} m={mm.brick} />
				<Box p={[3.25, 1.3, -2.1]} s={[0.4, 2.8, 2.4]} m={mm.brick} />
				<Box p={[3.25, 1.3, 2.1]} s={[0.4, 2.8, 2.4]} m={mm.brick} />
				<Box p={[3.25, 0.4, 0]} s={[0.4, 1.0, 1.8]} m={mm.brick} />
				<Box p={[3.25, 2.5, 0]} s={[0.4, 0.8, 1.8]} m={mm.brick} />
				<Box p={[0, 3.0, 0]} s={[7, 0.6, 6]} m={mm.roof} />
			</group>
		</group>
	);
};
