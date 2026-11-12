// Episode 21 world: "Watch the Chair" (Season 3, a real reported case: the Enfield poltergeist,
// London, 1977). One room only, built to real scale: the back bedroom of a 1920s council semi, at
// night, as if a camera had been left running on a tripod in the corner.
// - 3.6 x 4.2 m, 2.4 m ceiling; 1970s wallpaper, lino, a sash window with thin curtains lit orange
//   by the streetlight outside, two single beds (blanket shapes only: the children are never shown),
//   a wooden kitchen chair, a wall clock, a framed picture, a door ajar to the landing light.
// - A cassette recorder on a stool in the foreground (the investigators' tapes), its red light on.
// - The figure who sits in the chair at the very end is a dark silhouette from behind: no face.
// A composite, not a survey of the real house.
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

export type V3 = [number, number, number];
export const ROOM = {x0: -1.8, x1: 1.8, z0: -2.0, z1: 3.1, h: 2.4};
// the chair: by the window at frame 0; it moves only during the tape dropouts, nearer the far bed,
// turning to face it [x, z, rotationY]
export const CHAIR: [number, number, number][] = [
	[0.12, -1.35, 0.2],
	[0.0, -0.8, 1.1],
	[0.1, -0.25, 2.5],
	[0.12, 0.3, 4.35],
];

// subdivided boxes so lights read across big surfaces (the PS1 shader lights per vertex)
const seg = (v: number) => Math.min(16, Math.max(1, Math.ceil(v / 0.25)));
export const Box: React.FC<{p: V3; s: V3; m: THREE.Material | THREE.Material[]; r?: V3}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={[s[0], s[1], s[2], seg(s[0]), seg(s[1]), seg(s[2])]} />
	</mesh>
);

/** clock face reading h:mm */
export const clockTex = (h: number, mm: number) =>
	tex(32, 32, (g) => {
		g.fillStyle = '#2a2420';
		g.fillRect(0, 0, 32, 32);
		g.fillStyle = '#d8d0b8';
		g.beginPath();
		g.arc(16, 16, 14, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = '#1a1612';
		for (let i = 0; i < 12; i++) g.fillRect(16 + Math.round(Math.sin((i / 12) * Math.PI * 2) * 11.5), 16 - Math.round(Math.cos((i / 12) * Math.PI * 2) * 11.5), 1, 1);
		const hand = (a: number, len: number, w: number) => {
			g.save();
			g.translate(16, 16);
			g.rotate(a);
			g.fillRect(-w / 2, -len, w, len + 1);
			g.restore();
		};
		hand(((h % 12) + mm / 60) * (Math.PI / 6), 7, 2);
		hand(mm * (Math.PI / 30), 11, 1.5);
	});

const useMats = () =>
	useMemo(() => {
		const paper = tex(32, 32, (g) => {
			// 1970s wallpaper: brown and mustard interlocking rounds
			g.fillStyle = '#6a4a2c';
			g.fillRect(0, 0, 32, 32);
			for (const [cx, cy] of [[8, 8], [24, 24], [24, 8], [8, 24]]) {
				g.strokeStyle = cx === cy ? '#7a5a30' : '#54381e';
				g.lineWidth = 3;
				g.beginPath();
				g.arc(cx, cy, 6, 0, Math.PI * 2);
				g.stroke();
			}
			g.fillStyle = '#8a6a3a';
			g.fillRect(15, 15, 2, 2);
		}, [6, 4]);
		const lino = tex(32, 32, (g) => {
			g.fillStyle = '#5a5248';
			g.fillRect(0, 0, 32, 32);
			const r = rng(2101);
			for (let i = 0; i < 40; i++) {
				g.fillStyle = r() > 0.5 ? '#6a6256' : '#4a4238';
				g.fillRect(Math.floor(r() * 32), Math.floor(r() * 32), 2, 2);
			}
			g.fillStyle = '#4a4238';
			g.fillRect(0, 15, 32, 1);
			g.fillRect(15, 0, 1, 32);
		}, [6, 6]);
		const candlewick = tex(16, 16, (g) => {
			g.fillStyle = '#8a7a8a';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#a08ea0';
			for (let y = 1; y < 16; y += 4) for (let x = (y % 8 === 1 ? 1 : 3); x < 16; x += 4) g.fillRect(x, y, 2, 2);
		}, [3, 4]);
		const candlewick2 = tex(16, 16, (g) => {
			g.fillStyle = '#5a6a7a';
			g.fillRect(0, 0, 16, 16);
			g.fillStyle = '#6e7e8e';
			for (let y = 1; y < 16; y += 4) for (let x = (y % 8 === 1 ? 1 : 3); x < 16; x += 4) g.fillRect(x, y, 2, 2);
		}, [3, 4]);
		const curtain = tex(16, 32, (g) => {
			g.fillStyle = '#c0742a';
			g.fillRect(0, 0, 16, 32);
			for (let x = 0; x < 16; x += 4) {
				g.fillStyle = '#7a4416';
				g.fillRect(x, 0, 1, 32);
			}
			g.fillStyle = '#e0a050';
			for (let x = 2; x < 16; x += 4) g.fillRect(x, 0, 1, 32);
		}, [2, 1]);
		const picture = tex(16, 20, (g) => {
			g.fillStyle = '#3a2a1a';
			g.fillRect(0, 0, 16, 20);
			g.fillStyle = '#4a6a7a';
			g.fillRect(2, 2, 12, 9);
			g.fillStyle = '#3a5a2a';
			g.fillRect(2, 11, 12, 7);
			g.fillStyle = '#c8c0a0';
			g.fillRect(9, 4, 3, 3);
		});
		return {
			paper: lam('#ffffff', {map: paper}),
			ceiling: lam('#8a8478'),
			lino: lam('#ffffff', {map: lino}),
			skirting: lam('#3a2a1e'),
			gloss: lam('#c8bea8'),
			frame: lam('#9a907e'),
			glass: bas('#0a0806'),
			curtain: bas('#7a5a40', {map: curtain}),
			bedframe: lam('#3a2a1c'),
			sheet: lam('#b8b0a0'),
			pillow: lam('#c4bcac'),
			spread1: lam('#ffffff', {map: candlewick}),
			spread2: lam('#ffffff', {map: candlewick2}),
			hair: lam('#2a1e16'),
			chair: lam('#9a6e40'),
			chairDark: lam('#6a4a2a'),
			wardrobe: lam('#4a3420'),
			door: lam('#b8ae96'),
			landing: bas('#c89858'),
			stool: lam('#4a4a44'),
			recorder: lam('#2a2a2a'),
			recorderTop: lam('#8a8a86'),
			led: bas('#ff2010'),
			reel: lam('#d0d0c8'),
			picture: lam('#ffffff', {map: picture}),
			clockBack: lam('#3a2a1e'),
			wedge: new THREE.MeshBasicMaterial({color: '#ffb860', transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending}),
			shade: new THREE.MeshBasicMaterial({color: '#000000', transparent: true, opacity: 0.85, depthWrite: false}),
			sil: bas('#050404'),
			silEdge: lam('#2a2622'),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
const Ctx = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(Ctx)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMats()}>{children}</Ctx.Provider>;

/** A wooden kitchen chair; its front faces local +z. */
export const Chair: React.FC<{x: number; z: number; ry: number; children?: React.ReactNode}> = ({x, z, ry, children}) => {
	const m = useM();
	return (
		<group position={[x, 0, z]} rotation={[0, ry, 0]}>
			<Box p={[0, 0.45, 0]} s={[0.42, 0.04, 0.4]} m={m.chair} />
			{[[-0.18, -0.17], [0.18, -0.17], [-0.18, 0.17], [0.18, 0.17]].map(([lx, lz], i) => (
				<Box key={i} p={[lx, 0.22, lz]} s={[0.035, 0.45, 0.035]} m={m.chairDark} />
			))}
			{[-0.18, 0.18].map((lx) => (
				<Box key={lx} p={[lx, 0.7, -0.18]} s={[0.035, 0.5, 0.035]} m={m.chairDark} />
			))}
			<Box p={[0, 0.88, -0.18]} s={[0.42, 0.1, 0.03]} m={m.chair} />
			<Box p={[0, 0.66, -0.18]} s={[0.36, 0.04, 0.025]} m={m.chair} />
			{children}
		</group>
	);
};

/** Someone sitting in the chair, seen from behind: a dark, slightly stooped silhouette. No face. */
export const Sitter: React.FC = () => {
	const m = useM();
	return (
		<group>
			<Box p={[0, 0.56, 0.06]} s={[0.36, 0.14, 0.4]} m={m.sil} />
			<mesh position={[0, 0.82, -0.04]} rotation={[0.18, 0, 0]} material={m.sil}>
				<boxGeometry args={[0.4, 0.5, 0.22, 2, 3, 2]} />
			</mesh>
			<Box p={[0, 1.09, 0.0]} s={[0.46, 0.1, 0.24]} m={m.sil} />
			<mesh position={[0, 1.15, 0.05]} material={m.sil}>
				<cylinderGeometry args={[0.05, 0.06, 0.1, 6]} />
			</mesh>
			<mesh position={[0.02, 1.29, 0.09]} rotation={[0.3, 0.2, 0.08]} scale={[0.9, 1.1, 1]} material={m.sil}>
				<icosahedronGeometry args={[0.11, 1]} />
			</mesh>
			{/* arms hang between the knees */}
			{[-0.2, 0.2].map((ax) => (
				<mesh key={ax} position={[ax * 0.9, 0.78, 0.12]} rotation={[0.6, 0, -ax * 0.3]} material={m.sil}>
					<boxGeometry args={[0.08, 0.42, 0.08]} />
				</mesh>
			))}
			{[-0.1, 0.1].map((lx) => (
				<Box key={lx} p={[lx, 0.24, 0.24]} s={[0.12, 0.46, 0.12]} m={m.sil} />
			))}
		</group>
	);
};

/** A blanket-covered sleeper (a mound only; never a face). breathe: 0..1 */
const Sleeper: React.FC<{x: number; spread: THREE.Material; breathe: number; turned?: number}> = ({x, spread, breathe, turned = 0}) => {
	const m = useM();
	return (
		<group position={[x, 0, -0.95]}>
			<Box p={[0, 0.2, 0]} s={[0.9, 0.4, 2.0]} m={m.bedframe} />
			<Box p={[0, 0.44, 0]} s={[0.86, 0.1, 1.96]} m={m.sheet} />
			<Box p={[0, 0.54, -0.82]} s={[0.6, 0.12, 0.3]} m={m.pillow} />
			{/* the mound under the bedspread */}
			<mesh position={[turned * 0.05, 0.56, 0.05]} scale={[1, 0.55 + breathe * 0.05, 1]} material={spread}>
				<boxGeometry args={[0.8, 0.3, 1.5, 4, 2, 6]} />
			</mesh>
			<mesh position={[0.04 + turned * 0.06, 0.66 + breathe * 0.015, -0.4]} scale={[1.2, 0.6, 1.4]} material={spread}>
				<icosahedronGeometry args={[0.24, 1]} />
			</mesh>
			{/* a little dark hair on the pillow */}
			<mesh position={[0.05, 0.62, -0.76]} scale={[1.1, 0.5, 0.8]} material={m.hair}>
				<icosahedronGeometry args={[0.1, 1]} />
			</mesh>
			{/* bedspread hanging over the side */}
			<Box p={[0.42 * Math.sign(-x), 0.38, 0.05]} s={[0.02, 0.32, 1.5]} m={spread} />
			<Box p={[0, 0.5, 1.02]} s={[0.9, 0.5, 0.05]} m={m.bedframe} />
		</group>
	);
};

/**
 * The room. clock: [h, mm]; knock: 0..1 jolts the picture over the far bed; car: 0..1 a headlight
 * sweep across the ceiling (-1 = none); shadow: 0..1 a shadow crossing the landing light (-1 none);
 * landing: 0..1 the landing light; breathe: [near, far].
 */
export const Bedroom: React.FC<{clock: THREE.Texture; knock: number; car: number; shadow: number; landing: number; breathe: [number, number]; chair: [number, number, number]; sitter: boolean; reel: number}> = ({clock, knock, car, shadow, landing, breathe, chair, sitter, reel}) => {
	const m = useM();
	const {x0, x1, z0, z1, h} = ROOM;
	const W = x1 - x0, D = z1 - z0;
	const wedge = useMemo(() => {
		// the landing light spilling through the door ajar: a fan on the floor
		const g = new THREE.BufferGeometry();
		const v = new Float32Array([x0 + 0.01, 0.006, 1.1, x0 + 0.01, 0.006, 1.75, 0.6, 0.006, 0.9, 0.3, 0.006, -0.1]);
		g.setAttribute('position', new THREE.BufferAttribute(v, 3));
		g.setIndex([0, 1, 2, 0, 2, 3]);
		return g;
	}, [x0]);
	return (
		<group>
			{/* floor, ceiling, walls */}
			<mesh position={[0, 0, (z0 + z1) / 2]} rotation={[-Math.PI / 2, 0, 0]} material={m.lino}>
				<planeGeometry args={[W, D, 14, 16]} />
			</mesh>
			<mesh position={[0, h, (z0 + z1) / 2]} rotation={[Math.PI / 2, 0, 0]} material={m.ceiling}>
				<planeGeometry args={[W, D, 14, 16]} />
			</mesh>
			{/* back wall with the window opening (x -0.55..0.55, y 0.95..2.0) */}
			<Box p={[-1.175, h / 2, z0]} s={[1.25, h, 0.1]} m={m.paper} />
			<Box p={[1.175, h / 2, z0]} s={[1.25, h, 0.1]} m={m.paper} />
			<Box p={[0, 0.475, z0]} s={[1.1, 0.95, 0.1]} m={m.paper} />
			<Box p={[0, 2.2, z0]} s={[1.1, 0.4, 0.1]} m={m.paper} />
			{/* the window: black glass behind thin curtains lit by the streetlight */}
			<Box p={[0, 1.475, z0 - 0.04]} s={[1.1, 1.05, 0.02]} m={m.glass} />
			<Box p={[0, 1.475, z0 + 0.02]} s={[0.04, 1.05, 0.04]} m={m.frame} />
			<Box p={[0, 0.93, z0 + 0.08]} s={[1.3, 0.04, 0.16]} m={m.gloss} />
			<mesh position={[-0.3, 1.45, z0 + 0.1]} material={m.curtain}>
				<planeGeometry args={[0.62, 1.2]} />
			</mesh>
			<mesh position={[0.3, 1.45, z0 + 0.1]} material={m.curtain}>
				<planeGeometry args={[0.56, 1.2]} />
			</mesh>
			{/* side walls; the left one has the door to the landing (z 1.0..1.8) */}
			<Box p={[x0, h / 2, (z0 + 1.0) / 2]} s={[0.1, h, 1.0 - z0]} m={m.paper} />
			<Box p={[x0, h / 2, (1.8 + z1) / 2]} s={[0.1, h, z1 - 1.8]} m={m.paper} />
			<Box p={[x0, 2.15, 1.4]} s={[0.1, 0.5, 0.8]} m={m.paper} />
			<Box p={[x1, h / 2, (z0 + z1) / 2]} s={[0.1, h, D]} m={m.paper} />
			<Box p={[0, h / 2, z1]} s={[W, h, 0.1]} m={m.paper} />
			{/* skirting */}
			<Box p={[0, 0.05, z0 + 0.06]} s={[W, 0.1, 0.02]} m={m.skirting} />
			<Box p={[x1 - 0.06, 0.05, 0]} s={[0.02, 0.1, D]} m={m.skirting} />
			{/* the door ajar, the landing beyond it (lit) */}
			<mesh position={[x0 - 0.35, 1.0, 1.4]} rotation={[0, Math.PI / 2, 0]} material={m.landing} scale={[1, 1, 1]}>
				<planeGeometry args={[0.8, 2.0]} />
			</mesh>
			<group position={[x0 + 0.02, 0, 1.8]} rotation={[0, -0.55, 0]}>
				<Box p={[0, 0.98, -0.4]} s={[0.04, 1.96, 0.78]} m={m.door} />
			</group>
			{landing > 0 && <mesh geometry={wedge} material={m.wedge} scale={[1, 1, 1]} />}
			{shadow >= 0 && landing > 0 && (
				<mesh position={[x0 + 0.4 + shadow * 1.2, 0.008, 1.5 - shadow * 0.9]} rotation={[-Math.PI / 2, 0, -0.5]} material={m.shade}>
					<planeGeometry args={[0.35, 1.6]} />
				</mesh>
			)}
			{/* the beds, heads to the back wall */}
			<Sleeper x={-1.2} spread={m.spread1} breathe={breathe[1]} turned={1} />
			<Sleeper x={1.3} spread={m.spread2} breathe={breathe[0]} />
			{/* the picture over the far bed jumps with each knock */}
			<group position={[-1.2, 1.55 + knock * 0.02, z0 + 0.07]} rotation={[0, 0, 0.03 + knock * 0.06]}>
				<Box p={[0, 0, 0]} s={[0.36, 0.44, 0.03]} m={m.picture} />
			</group>
			{/* the wall clock, right of the window */}
			<group position={[-0.85, 1.95, z0 + 0.07]}>
				<mesh material={m.clockBack}>
					<cylinderGeometry args={[0.17, 0.17, 0.04, 14]} />
				</mesh>
				<mesh position={[0, 0, 0.025]} material={useMemo(() => lam('#ffffff', {map: clock}), [clock])}>
					<circleGeometry args={[0.15, 14]} />
				</mesh>
			</group>
			{/* a wardrobe against the back wall corner */}
			<Box p={[1.55, 1.0, z0 + 0.35]} s={[0.4, 2.0, 0.6]} m={m.wardrobe} />
			{/* the chair */}
			<Chair x={chair[0]} z={chair[1]} ry={chair[2]}>
				{sitter && <Sitter />}
			</Chair>
			{/* the investigators' cassette recorder on the bedside cabinet under the window, recording */}
			<group position={[0.68, 0, -1.72]}>
				<Box p={[0, 0.3, 0]} s={[0.34, 0.6, 0.4]} m={m.stool} />
				<Box p={[0, 0.65, 0]} s={[0.3, 0.09, 0.2]} m={m.recorder} />
				<Box p={[0, 0.7, 0.0]} s={[0.24, 0.01, 0.12]} m={m.recorderTop} />
				{[-0.045, 0.045].map((rx) => (
					<mesh key={rx} position={[rx, 0.708, 0]} rotation={[0, reel, 0]} material={m.reel}>
						<cylinderGeometry args={[0.022, 0.022, 0.006, 6]} />
					</mesh>
				))}
				<Box p={[0.12, 0.7, 0.08]} s={[0.018, 0.018, 0.018]} m={m.led} />
			</group>
			{/* the headlight of a passing car sweeping across the ceiling */}
			{car >= 0 && car <= 1 && (
				<mesh position={[0.9 - car * 2.6, h - 0.01, -1.4 + car * 1.2]} rotation={[Math.PI / 2, 0, 0.5]} material={m.wedge}>
					<planeGeometry args={[0.5, 1.7]} />
				</mesh>
			)}
		</group>
	);
};
