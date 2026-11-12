// Episode 22 world: "Eighty-Eight Years" (Season 3, a real reported case: the Okiku doll, Mannenji
// temple, Iwamizawa, Hokkaido). One fixed frame, to real scale: a temple altar at night, a glass
// case on it, and in the case a traditional doll about 40 cm tall in a red kimono with bobbed black
// hair. Candles, incense, offerings, a dark wooden wall, a hanging scroll, a pillar.
// An original doll design (no film doll). The girl the doll is named after is never shown.
// A composite, not a survey of the real temple.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ps1, rng} from '../ps1';
import {SNAP6} from '../ep01/world';

const lam = (color: string, o: THREE.MeshLambertMaterialParameters = {}) => ps1(new THREE.MeshLambertMaterial({color, flatShading: true, ...o}), 24, SNAP6);
const bas = (color: string, o: THREE.MeshBasicMaterialParameters = {}) => ps1(new THREE.MeshBasicMaterial({color, ...o}), 24, SNAP6);

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
const seg = (v: number) => Math.min(12, Math.max(1, Math.ceil(v / 0.08)));
export const Box: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={[s[0], s[1], s[2], seg(s[0]), seg(s[1]), seg(s[2])]} />
	</mesh>
);

export const ALTAR_Y = 0.85;
export const HEAD_Y = ALTAR_Y + 0.04 + 0.33;

const useMats = () =>
	useMemo(() => {
		const kimono = tex(16, 16, (g) => {
			g.fillStyle = '#8a1418';
			g.fillRect(0, 0, 16, 16);
			const r = rng(2201);
			for (let i = 0; i < 6; i++) {
				const x = Math.floor(r() * 14), y = Math.floor(r() * 14);
				g.fillStyle = '#d8a8a0';
				g.fillRect(x, y, 2, 1);
				g.fillRect(x + 1, y - 1, 1, 3);
				g.fillStyle = '#e0c060';
				g.fillRect(x + 1, y, 1, 1);
			}
		}, [2, 2]);
		const wood = tex(16, 32, (g) => {
			g.fillStyle = '#2a1a10';
			g.fillRect(0, 0, 16, 32);
			for (let x = 0; x < 16; x += 4) {
				g.fillStyle = '#20140c';
				g.fillRect(x, 0, 1, 32);
			}
			const r = rng(2202);
			for (let i = 0; i < 20; i++) {
				g.fillStyle = '#34200f';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 32), 1, 3);
			}
		}, [4, 2]);
		const scroll = tex(16, 48, (g) => {
			g.fillStyle = '#b8ac90';
			g.fillRect(0, 0, 16, 48);
			g.fillStyle = '#1a1410';
			for (let y = 6; y < 42; y += 4) g.fillRect(7 + ((y * 7) % 3) - 1, y, 2 + ((y * 5) % 3), 2);
		});
		const photo = tex(16, 20, (g) => {
			// a visitor's photograph of the doll: in it, she is facing the camera
			g.fillStyle = '#e8e4d8';
			g.fillRect(0, 0, 16, 20);
			g.fillStyle = '#1a1612';
			g.fillRect(2, 2, 12, 12);
			g.fillStyle = '#0a0808';
			g.fillRect(5, 4, 6, 6);
			g.fillStyle = '#d8d0c0';
			g.fillRect(6, 6, 4, 4);
			g.fillStyle = '#000';
			g.fillRect(6, 7, 1, 1);
			g.fillRect(9, 7, 1, 1);
			g.fillStyle = '#7a1416';
			g.fillRect(6, 10, 4, 4);
		});
		const fog = tex(32, 32, (g) => {
			const grd = g.createRadialGradient(16, 16, 1, 16, 16, 15);
			grd.addColorStop(0, 'rgba(230,230,235,0.9)');
			grd.addColorStop(1, 'rgba(230,230,235,0)');
			g.fillStyle = grd;
			g.fillRect(0, 0, 32, 32);
		});
		return {
			kimono: lam('#ffffff', {map: kimono}),
			obi: lam('#b8902a'),
			skin: lam('#e8e0d0'),
			hair: lam('#0c0a0a'),
			eye: bas('#050404'),
			glint: bas('#fff4dc'),
			lips: lam('#8a1a1a'),
			collar: lam('#e8e0d4'),
			wood: lam('#ffffff', {map: wood}),
			darkWood: lam('#1a100a'),
			lacquer: lam('#2a0c0a'),
			gold: lam('#9a7a2a'),
			cloth: lam('#5a1a1a'),
			glass: new THREE.MeshBasicMaterial({color: '#c8d0e0', transparent: true, opacity: 0.07, depthWrite: false}),
			frame: lam('#3a2414'),
			silk: lam('#6e5c3c'),
			candle: lam('#e8e0cc'),
			flame: bas('#ffd890'),
			scroll: lam('#6a6250', {map: scroll}),
			mikan: lam('#d0701a'),
			cup: lam('#c8c0b0'),
			brass: lam('#8a6a2a'),
			photo: lam('#b8b0a0', {map: photo}),
			steel: lam('#9a9a9a'),
			cut: lam('#0c0a0a'),
			fog: new THREE.MeshBasicMaterial({map: fog, transparent: true, depthWrite: false, opacity: 0}),
			smoke: new THREE.MeshBasicMaterial({color: '#a8a8b0', transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide}),
			black: bas('#020202'),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
const Ctx = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(Ctx)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMats()}>{children}</Ctx.Provider>;

/**
 * The doll, about 40 cm. Her body faces the left wall (-x). head: radians her head is turned from
 * her body towards the camera (negative = further away). hair: length of the hair below the ear
 * line in metres (a bob is about 0.045). glint: 0..1 candlelight caught in her eyes.
 */
export const Doll: React.FC<{head: number; hair: number; glint: number; t: number}> = ({head, hair, glint, t}) => {
	const m = useM();
	const strands = useMemo(() => {
		const r = rng(2203);
		// around the back and sides of the head (front is the fringe)
		return Array.from({length: 34}, (_, i) => {
			const a = -Math.PI * 0.7 + (i / 33) * Math.PI * 1.4 + Math.PI; // behind and to the sides
			return {a, w: 0.012 + r() * 0.008, j: 0.9 + r() * 0.2, ph: r() * 6};
		});
	}, []);
	return (
		<group position={[0, ALTAR_Y + 0.04, 0]} rotation={[0, -Math.PI / 2, 0]}>
			{/* kimono body, kneeling-standing figure, slightly flared */}
			<mesh position={[0, 0.11, 0]} material={m.kimono}>
				<cylinderGeometry args={[0.05, 0.075, 0.22, 10, 3]} />
			</mesh>
			<mesh position={[0, 0.21, 0]} material={m.kimono}>
				<cylinderGeometry args={[0.042, 0.05, 0.06, 10]} />
			</mesh>
			<Box p={[0, 0.17, 0]} s={[0.104, 0.035, 0.09]} m={m.obi} />
			<Box p={[0, 0.235, 0.028]} s={[0.04, 0.03, 0.01]} m={m.collar} r={[0.2, 0, 0]} />
			{/* sleeves hang, hands together in front */}
			{[-1, 1].map((sd) => (
				<Box key={sd} p={[sd * 0.058, 0.15, 0.01]} s={[0.03, 0.12, 0.06]} m={m.kimono} />
			))}
			<Box p={[0, 0.13, 0.05]} s={[0.04, 0.02, 0.02]} m={m.skin} />
			{/* the neck and head: the head turns on the neck, further than a neck should */}
			<mesh position={[0, 0.255, 0]} material={m.skin}>
				<cylinderGeometry args={[0.016, 0.018, 0.03, 6]} />
			</mesh>
			<group position={[0, 0.3, 0]} rotation={[0, head, 0]}>
				<mesh scale={[0.92, 1.05, 0.95]} material={m.skin}>
					<icosahedronGeometry args={[0.05, 1]} />
				</mesh>
				{/* small black eyes, a little red mouth */}
				{[-0.017, 0.017].map((x) => (
					<group key={x} position={[x, 0.004, 0.045]}>
						<mesh material={m.eye}>
							<boxGeometry args={[0.012, 0.007, 0.006]} />
						</mesh>
						{glint > 0 && (
							<mesh position={[0.002, 0.001, 0.0035]} material={m.glint} scale={glint}>
								<boxGeometry args={[0.003, 0.003, 0.002]} />
							</mesh>
						)}
					</group>
				))}
				<Box p={[0, -0.022, 0.044]} s={[0.012, 0.006, 0.006]} m={m.lips} />
				{/* the crown and the straight fringe */}
				<mesh position={[0, 0.012, -0.004]} scale={[1.02, 0.95, 1.04]} material={m.hair}>
					<sphereGeometry args={[0.053, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
				</mesh>
				<Box p={[0, 0.026, 0.044]} s={[0.088, 0.024, 0.012]} m={m.hair} />
				{/* the hair below the ears: strips around the sides and back, as long as the years have made them */}
				{strands.map((s, i) => {
					const len = 0.02 + hair * s.j;
					// each strand hangs from the crown edge and flares out a little so it falls over the kimono
					const R = 0.056 + len * 0.07;
					const x = Math.sin(s.a) * R, z = Math.cos(s.a) * R;
					const sway = Math.sin(t * 0.6 + s.ph) * 0.01;
					return (
						<mesh key={i} position={[x, 0.005 - len / 2, z]} rotation={[sway - 0.07, s.a, 0]} rotation-order="YXZ" material={m.hair}>
							<boxGeometry args={[s.w, len, 0.006]} />
						</mesh>
					);
				})}
				{/* two side locks that frame the face and fall in front of the shoulders */}
				{[-1, 1].map((sd) => (
					<Box key={sd} p={[sd * (0.05 + hair * 0.05), 0.005 - (0.02 + hair) / 2, 0.03 + hair * 0.05]} s={[0.014, 0.02 + hair, 0.012]} m={m.hair} />
				))}
			</group>
		</group>
	);
};

/**
 * The altar. year: drives the per-year changes (candles, offerings); scissors: the trim year;
 * photo: the photograph on the pillar; fog: 0..1 breath on the inside of the glass.
 */
export const Altar: React.FC<{year: number; scissors: boolean; photo: boolean; fog: number; t: number; children: React.ReactNode}> = ({year, scissors, photo, fog, t, children}) => {
	const m = useM();
	const r = rng(year * 31 + 7);
	const c1 = 0.06 + r() * 0.1, c2 = 0.06 + r() * 0.1;
	const mikan = 1 + Math.floor(r() * 3);
	const tea = r() > 0.4;
	m.fog.opacity = fog * 0.75;
	return (
		<group>
			{/* back wall: dark wooden planks; the hanging scroll; a pillar on the right */}
			<Box p={[0, 1.4, -0.65]} s={[2.4, 2.8, 0.06]} m={m.wood} />
			<mesh position={[-0.42, 1.55, -0.61]} material={m.scroll}>
				<planeGeometry args={[0.18, 0.6]} />
			</mesh>
			<Box p={[-0.42, 1.86, -0.6]} s={[0.22, 0.02, 0.02]} m={m.darkWood} />
			<Box p={[0.34, 1.4, -0.2]} s={[0.12, 2.8, 0.12]} m={m.darkWood} />
			{photo && (
				<mesh position={[0.275, 1.2, -0.17]} rotation={[0, -0.25, 0.06]} material={m.photo}>
					<planeGeometry args={[0.06, 0.075]} />
				</mesh>
			)}
			{/* the altar: lacquered top, gold edge, a cloth hanging in front */}
			<Box p={[0, ALTAR_Y - 0.03, -0.1]} s={[1.0, 0.06, 0.62]} m={m.lacquer} />
			<Box p={[0, ALTAR_Y - 0.065, 0.21]} s={[1.0, 0.012, 0.012]} m={m.gold} />
			<Box p={[0, ALTAR_Y - 0.4, 0.2]} s={[0.9, 0.62, 0.02]} m={m.cloth} />
			<Box p={[0, ALTAR_Y - 0.43, -0.1]} s={[0.98, 0.8, 0.6]} m={m.darkWood} />
			{/* the glass case: a wooden frame, glass panes, a base */}
			<group>
				<Box p={[0, ALTAR_Y + 0.02, 0]} s={[0.4, 0.04, 0.3]} m={m.frame} />
				{[[-0.19, -0.14], [0.19, -0.14], [-0.19, 0.14], [0.19, 0.14]].map(([x, z], i) => (
					<Box key={i} p={[x, ALTAR_Y + 0.29, z]} s={[0.018, 0.5, 0.018]} m={m.frame} />
				))}
				<Box p={[0, ALTAR_Y + 0.545, 0]} s={[0.4, 0.02, 0.3]} m={m.frame} />
				{/* the case is lined at the back with pale silk: her hair reads against it */}
				<Box p={[0, ALTAR_Y + 0.29, -0.135]} s={[0.36, 0.5, 0.01]} m={m.silk} />
				{children}
				<mesh position={[0, ALTAR_Y + 0.29, 0.141]} material={m.glass}>
					<planeGeometry args={[0.37, 0.5]} />
				</mesh>
				<mesh position={[-0.191, ALTAR_Y + 0.29, 0]} rotation={[0, Math.PI / 2, 0]} material={m.glass}>
					<planeGeometry args={[0.28, 0.5]} />
				</mesh>
				{/* breath on the inside of the front pane, at the height of her face */}
				{fog > 0 && (
					<mesh position={[0.0, HEAD_Y - 0.01, 0.138]} material={m.fog}>
						<planeGeometry args={[0.14, 0.12]} />
					</mesh>
				)}
			</group>
			{/* two candles, lit; a brass incense burner with a thread of smoke; offerings */}
			{[[-0.3, c1], [0.3, c2]].map(([x, h], i) => (
				<group key={i} position={[x, ALTAR_Y, 0.08]}>
					<Box p={[0, 0.02, 0]} s={[0.07, 0.04, 0.07]} m={m.brass} />
					<mesh position={[0, 0.04 + h / 2, 0]} material={m.candle}>
						<cylinderGeometry args={[0.013, 0.013, h, 6]} />
					</mesh>
					<mesh position={[0, 0.06 + h + 0.012 * Math.sin(t * 13 + i), 0]} material={m.flame} scale={[1, 1 + 0.2 * Math.sin(t * 17 + i * 2), 1]}>
						<coneGeometry args={[0.008, 0.03, 5]} />
					</mesh>
				</group>
			))}
			<group position={[-0.16, ALTAR_Y, 0.22]}>
				<mesh position={[0, 0.025, 0]} material={m.brass}>
					<cylinderGeometry args={[0.04, 0.03, 0.05, 8]} />
				</mesh>
				<mesh position={[0.01 * Math.sin(t * 0.7), 0.17, 0]} rotation={[0, t * 0.3, 0.08 * Math.sin(t * 0.5)]} material={m.smoke}>
					<planeGeometry args={[0.012, 0.24]} />
				</mesh>
			</group>
			{Array.from({length: mikan}, (_, i) => (
				<mesh key={i} position={[0.18 + (i % 2) * 0.05, ALTAR_Y + 0.025 + Math.floor(i / 2) * 0.04, 0.17 - (i % 2) * 0.02]} material={m.mikan}>
					<icosahedronGeometry args={[0.025, 0]} />
				</mesh>
			))}
			{tea && (
				<mesh position={[-0.17, ALTAR_Y + 0.025, 0.18]} material={m.cup}>
					<cylinderGeometry args={[0.025, 0.02, 0.05, 8]} />
				</mesh>
			)}
			{/* the trim: scissors and a lock of cut hair on a sheet of paper, for one year */}
			{scissors && (
				<group position={[-0.12, ALTAR_Y + 0.003, 0.2]} rotation={[0, 0.4, 0]}>
					<Box p={[0, 0, 0]} s={[0.12, 0.002, 0.09]} m={m.candle} />
					<Box p={[0.01, 0.006, 0.0]} s={[0.07, 0.006, 0.01]} m={m.steel} r={[0, 0.3, 0]} />
					<Box p={[0.01, 0.006, 0.0]} s={[0.07, 0.006, 0.01]} m={m.steel} r={[0, -0.3, 0]} />
					<Box p={[-0.03, 0.005, 0.02]} s={[0.06, 0.004, 0.012]} m={m.cut} r={[0, 0.9, 0]} />
				</group>
			)}
		</group>
	);
};
