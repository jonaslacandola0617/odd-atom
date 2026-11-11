// Episode 15 world: "Don't Pick Up the Baby" (folklore: the tiyanak). One consistent set: an
// empty two-lane provincial road at night between walls of tall cogon grass, coconut palms and
// electric poles, a dark range of hills; one jeepney on its last trip (LAST TRIP on its signboard,
// GOD BLESS OUR TRIP inside, a rosary on the mirror, a fluorescent tube in the ceiling).
//
// Layout (metres, y up). The road runs along z, x -3.2..3.2, its top at y = 0; traffic heads -z, so
// the right-hand lane is +x. The jeepney's centre is (JX, 0, jz) with its front at jz - 2.9; it
// stops at jz = 0. The bundle lies in the grass at BUNDLE, ahead and to the right of where it stops.
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
const label = (w: number, h: number, bg: string, fg: string, text: string, font: string, border?: string) =>
	tex(w, h, (g) => {
		g.fillStyle = bg;
		g.fillRect(0, 0, w, h);
		if (border) {
			g.strokeStyle = border;
			g.lineWidth = 2;
			g.strokeRect(1, 1, w - 2, h - 2);
		}
		g.fillStyle = fg;
		g.font = font;
		g.textAlign = 'center';
		g.textBaseline = 'middle';
		g.fillText(text, w / 2, h / 2 + 1);
	});

export const JX = 1.5;
export const BUNDLE: [number, number, number] = [4.4, 0.02, -7.2];
export const BUNDLE2: [number, number, number] = [-4.3, 0.02, 5.5];
type V3 = [number, number, number];
export const J = (jz: number, x: number, y: number, z: number): V3 => [JX + x, y, jz + z];

const useMats = () =>
	useMemo(() => {
		const asphalt = tex(16, 64, (g) => {
			g.fillStyle = '#2a2a2e';
			g.fillRect(0, 0, 16, 64);
			const r = rng(15);
			for (let i = 0; i < 90; i++) {
				g.fillStyle = r() < 0.5 ? '#202024' : '#36363a';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 64), 1, 1);
			}
			g.fillStyle = '#a8a69a';
			g.fillRect(7, 0, 2, 24);
			g.fillStyle = '#6a6860';
			g.fillRect(0, 0, 1, 64);
			g.fillRect(15, 0, 1, 64);
		}, [1, 40]);
		const sky = (top: string, mid: string, hor: string) =>
			new THREE.MeshBasicMaterial({
				side: THREE.BackSide,
				fog: false,
				map: tex(4, 64, (g) => {
					const gr = g.createLinearGradient(0, 0, 0, 64);
					gr.addColorStop(0, top);
					gr.addColorStop(0.44, mid);
					gr.addColorStop(0.5, hor);
					gr.addColorStop(1, hor);
					g.fillStyle = gr;
					g.fillRect(0, 0, 4, 64);
				}),
			});
		const hands = tex(64, 32, (g) => {
			g.clearRect(0, 0, 64, 32);
			const r = rng(1515);
			// small smeared handprints: a palm and four short fingers, at baby size
			for (let i = 0; i < 9; i++) {
				const x = 6 + r() * 52, y = 6 + r() * 20, a = (r() - 0.5) * 0.8;
				g.save();
				g.translate(x, y);
				g.rotate(a);
				g.fillStyle = 'rgba(200,190,170,0.55)';
				g.fillRect(-2, 0, 4, 4);
				for (let f = 0; f < 4; f++) g.fillRect(-2 + f * 1.2, -3 - (f === 1 || f === 2 ? 1 : 0), 1, 3);
				g.fillRect(2, 1, 2, 1);
				g.restore();
			}
		});
		return {
			road: lam('#ffffff', {map: asphalt}),
			shoulder: lam('#3a3428'),
			ground: lam('#1c2416'),
			grass: lam('#ffffff', {vertexColors: true}),
			palm: lam('#3a3226'),
			frond: lam('#1e2a18'),
			pole: lam('#4a4440'),
			wire: lam('#18181a'),
			hill: lam('#0e1218'),
			house: bas('#ffb860'),
			skyNight: sky('#010204', '#06080c', '#121822'),
			skyDawn: sky('#6a707c', '#9a9ca0', '#b4b0a8'),
			body: lam('#9aa0a6'),
			chrome: lam('#c8ccd0'),
			red: lam('#8a1e1e'),
			blue: lam('#1e3a7a'),
			yellow: lam('#c8a030'),
			tire: lam('#141414'),
			under: lam('#1a1a1c'),
			floor: lam('#2a2a2c'),
			vinyl: lam('#4a1c1c'),
			dash: lam('#1c1c1e'),
			glass: new THREE.MeshBasicMaterial({color: '#0a0e12', transparent: true, opacity: 0.22, depthWrite: false}),
			hands: new THREE.MeshBasicMaterial({map: hands, transparent: true, depthWrite: false}),
			lensOn: bas('#fff4d8'),
			lensOff: lam('#6a6a60'),
			tailOn: bas('#ff2010'),
			tailOff: lam('#4a1010'),
			tubeOn: bas('#eef6ff'),
			tubeOff: lam('#4a5056'),
			flare: new THREE.MeshBasicMaterial({color: '#fff0c8', transparent: true, opacity: 0.55, depthWrite: false, fog: false}),
			bead: lam('#2a1a14'),
			sign: lam('#ffffff', {map: label(64, 12, '#e8e4d8', '#b01818', 'LAST TRIP', 'bold 10px "DejaVu Sans Mono", monospace', '#1a1a1a')}),
			bless: lam('#ffffff', {map: label(64, 10, '#101014', '#d8c880', 'GOD BLESS OUR TRIP', 'bold 7px "DejaVu Sans", sans-serif')}),
			skin: lam('#7a5640'),
			hair: lam('#0e0c0c'),
			shirt: lam('#2c4636'),
			print: lam('#c8c0a8'),
			shirtIn: lam('#7a9a88'),
			seam: lam('#c8dcd0'),
			tag: lam('#f0eee6'),
			pants: lam('#2a2e3a'),
			towel: lam('#d8d4c8'),
			slipper: lam('#2a4a8a'),
			strap: lam('#e8e8e8'),
			rot: lam('#9a9280'),
			rot2: lam('#7a7262'),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
const Ctx = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(Ctx)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMats()}>{children}</Ctx.Provider>;

export const Box: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={s} />
	</mesh>
);

/** A box of width w stretched between two points (arms, legs). */
const UP = new THREE.Vector3(0, 1, 0);
export const Limb: React.FC<{a: V3; b: V3; w: number; m: THREE.Material}> = ({a, b, w, m}) => {
	const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
	const d = vb.clone().sub(va);
	const q = new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize());
	const mid = va.add(vb).multiplyScalar(0.5);
	return (
		<mesh position={mid} quaternion={q} material={m}>
			<boxGeometry args={[w, d.length(), w]} />
		</mesh>
	);
};

// ------------------------------------------------------------------ the land
/** Cogon grass: one triangle per blade, pale plumed tips, the tips swaying in the wind. */
const Grass: React.FC<{t: number; wind: number}> = ({t, wind}) => {
	const m = useM();
	const {geo, tips, base} = useMemo(() => {
		const r = rng(1505);
		const pos: number[] = [], col: number[] = [];
		const tips: number[] = [];
		const lo = new THREE.Color('#22301a'), hi = new THREE.Color('#c8c4a0'), mid = new THREE.Color('#3a4a26');
		const add = (x: number, z: number, h: number) => {
			const w = 0.015 + r() * 0.02, a = r() * Math.PI, lx = (r() - 0.5) * 0.35, lz = (r() - 0.5) * 0.35;
			const cx = Math.cos(a) * w, cz = Math.sin(a) * w;
			pos.push(x - cx, 0, z - cz, x + cx, 0, z + cz, x + lx, h, z + lz);
			const tip = mid.clone().lerp(hi, 0.35 + r() * 0.5);
			col.push(lo.r, lo.g, lo.b, lo.r, lo.g, lo.b, tip.r, tip.g, tip.b);
			tips.push(pos.length / 3 - 1);
		};
		for (const sd of [-1, 1])
			for (let i = 0; i < 9000; i++) {
				const x = sd * (3.9 + Math.pow(r(), 1.3) * 13), z = -75 + r() * 150;
				const dB = Math.hypot(x - BUNDLE[0], z - BUNDLE[2]);
				const dB2 = Math.hypot(x - BUNDLE2[0], z - BUNDLE2[2]);
				let h = 0.9 + r() * 0.9;
				// and the path he walks to it from the road
				const path = x > 2.5 && x < 4.9 && z > -7.4 && z < -2.5 && Math.abs(x - (2.6 + ((-2.4 - z) / 4.0) * 1.55)) < 0.6;
				if (dB < 0.5 || dB2 < 0.6 || path) h *= 0.2; // the flattened place where it lies
				else if (dB < 1.3) h *= 0.42;
				else if (dB < 1.9) h *= 0.6;
				add(x, z, h);
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
		const s = Math.sin(t * 1.4 + bx * 0.35 + bz * 0.22) * 0.12 * wind + Math.sin(t * 3.1 + bz) * 0.03 * wind;
		p.setX(i, bx + s);
		p.setZ(i, bz + s * 0.4);
	}
	p.needsUpdate = true;
	return <mesh geometry={geo} material={m.grass} />;
};

export const Land: React.FC<{t: number; dawn: boolean; wind?: number}> = ({t, dawn, wind = 1}) => {
	const m = useM();
	const palms = useMemo(() => {
		const r = rng(808);
		const out: {x: number; z: number; h: number; lean: number; ry: number}[] = [];
		while (out.length < 34) {
			const x = (r() < 0.5 ? -1 : 1) * (10 + r() * 60), z = -140 + r() * 210;
			out.push({x, z, h: 7 + r() * 6, lean: (r() - 0.5) * 0.25, ry: r() * 6});
		}
		return out;
	}, []);
	const hills = useMemo(() => {
		const r = rng(99);
		return Array.from({length: 9}, (_, i) => ({x: -260 + i * 65 + r() * 30, z: -240 - r() * 80, rad: 50 + r() * 50, h: 25 + r() * 35}));
	}, []);
	return (
		<group>
			<mesh material={dawn ? m.skyDawn : m.skyNight}>
				<sphereGeometry args={[420, 16, 10]} />
			</mesh>
			<Box p={[0, -0.05, 0]} s={[6.4, 0.1, 400]} m={m.road} />
			{[-1, 1].map((sd) => (
				<Box key={sd} p={[sd * 3.6, -0.06, 0]} s={[0.8, 0.1, 400]} m={m.shoulder} />
			))}
			{[-1, 1].map((sd) => (
				<Box key={`g${sd}`} p={[sd * 104, -0.08, 0]} s={[200, 0.1, 500]} m={m.ground} />
			))}
			<Grass t={t} wind={wind} />
			{palms.map((p, i) => (
				<group key={i} position={[p.x, 0, p.z]} rotation={[0, p.ry, p.lean]}>
					{[0, 1, 2].map((k) => (
						<Box key={k} p={[0, p.h * (k + 0.5) / 3, 0]} s={[0.28 - k * 0.04, p.h / 3, 0.28 - k * 0.04]} m={m.palm} />
					))}
					{Array.from({length: 8}, (_, k) => (
						<group key={`f${k}`} position={[0, p.h, 0]} rotation={[0, (k / 8) * Math.PI * 2, 0]}>
							<mesh position={[1.1, -0.35, 0]} rotation={[0, 0, -0.5 - (k % 2) * 0.25 + Math.sin(t * 0.8 + k + i) * 0.04]} material={m.frond}>
								<boxGeometry args={[2.4, 0.05, 0.5]} />
							</mesh>
						</group>
					))}
				</group>
			))}
			{/* electric poles down the left side of the road, the wires running between them */}
			{Array.from({length: 8}, (_, i) => (
				<group key={`p${i}`} position={[-4.5, 0, -140 + i * 35]}>
					<Box p={[0, 4, 0]} s={[0.2, 8, 0.2]} m={m.pole} />
					<Box p={[0, 7.6, 0]} s={[1.3, 0.1, 0.1]} m={m.pole} />
				</group>
			))}
			{[-5.05, -3.95].map((x) => (
				<Box key={x} p={[x, 7.68, -20]} s={[0.025, 0.025, 260]} m={m.wire} />
			))}
			{hills.map((h, i) => (
				<mesh key={`h${i}`} position={[h.x, h.h / 2 - 2, h.z]} material={m.hill}>
					<coneGeometry args={[h.rad, h.h, 7]} />
				</mesh>
			))}
			{/* one lit window, far across the fields */}
			{!dawn && <Box p={[-70, 1.6, -95]} s={[0.8, 0.6, 0.1]} m={m.house} />}
		</group>
	);
};

// ------------------------------------------------------------------ the jeepney
export type JeepState = {jz: number; head: boolean; tube: number; tail: boolean; hands: boolean; rosary: number};
export const Jeepney: React.FC<{t: number; st: JeepState}> = ({t, st}) => {
	const m = useM();
	const lens = st.head ? m.lensOn : m.lensOff;
	return (
		<group position={[JX, 0, st.jz]}>
			{/* wheels, chassis */}
			{[-0.86, 0.86].map((x) => [-1.95, 1.85].map((z) => (
				<mesh key={`${x}${z}`} position={[x, 0.38, z]} rotation={[0, 0, Math.PI / 2]} material={m.tire}>
					<cylinderGeometry args={[0.38, 0.38, 0.22, 10]} />
				</mesh>
			)))}
			<Box p={[0, 0.55, 0]} s={[1.7, 0.2, 5.6]} m={m.under} />
			{/* the long hood, fenders, grille, bumper, headlights and a chrome horse */}
			<Box p={[0, 0.95, -2.42]} s={[1.5, 0.42, 1.0]} m={m.body} />
			{[-1, 1].map((sd) => (
				<Box key={sd} p={[sd * 0.82, 0.8, -2.38]} s={[0.3, 0.26, 0.95]} m={m.body} />
			))}
			<Box p={[0, 0.88, -2.94]} s={[1.2, 0.42, 0.06]} m={m.chrome} />
			{[-0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45].map((x) => (
				<Box key={x} p={[x, 0.88, -2.975]} s={[0.03, 0.36, 0.02]} m={m.dash} />
			))}
			<Box p={[0, 0.58, -3.0]} s={[1.9, 0.12, 0.12]} m={m.chrome} />
			{[-0.66, 0.66].map((x) => (
				<mesh key={x} position={[x, 0.86, -2.97]} rotation={[Math.PI / 2, 0, 0]} material={lens}>
					<cylinderGeometry args={[0.11, 0.11, 0.05, 10]} />
				</mesh>
			))}
			<group position={[0, 1.2, -2.78]}>
				<Box p={[0, 0.06, 0]} s={[0.05, 0.07, 0.16]} m={m.chrome} />
				<Box p={[0, 0.13, -0.09]} s={[0.04, 0.1, 0.05]} m={m.chrome} r={[0.4, 0, 0]} />
				{[-0.05, 0.05].map((z) => (
					<Box key={z} p={[0, 0.0, z]} s={[0.03, 0.06, 0.02]} m={m.chrome} />
				))}
			</group>
			{/* the cab: windshield frame, glass, dashboard, wheel, seats, mirror and rosary */}
			{[-0.8, 0.8].map((x) => (
				<Box key={x} p={[x, 1.66, -1.9]} s={[0.06, 1.0, 0.06]} m={m.chrome} />
			))}
			<Box p={[0, 1.15, -1.9]} s={[1.66, 0.06, 0.06]} m={m.body} />
			<mesh position={[0, 1.66, -1.9]} material={m.glass}>
				<planeGeometry args={[1.54, 0.96]} />
			</mesh>
			{st.hands && (
				<mesh position={[0, 1.6, -1.93]} rotation={[0, Math.PI, 0]} material={m.hands}>
					<planeGeometry args={[1.5, 0.75]} />
				</mesh>
			)}
			<Box p={[0, 1.05, -1.72]} s={[1.6, 0.28, 0.32]} m={m.dash} />
			<mesh position={[-0.42, 1.28, -1.5]} rotation={[-1.1, 0, 0]} material={m.dash}>
				<torusGeometry args={[0.17, 0.02, 5, 12]} />
			</mesh>
			{[-0.42, 0.42].map((x) => (
				<group key={x}>
					<Box p={[x, 0.98, -1.12]} s={[0.55, 0.12, 0.45]} m={m.vinyl} />
					<Box p={[x, 1.28, -0.88]} s={[0.55, 0.52, 0.08]} m={m.vinyl} />
				</group>
			))}
			<Box p={[0, 1.98, -1.78]} s={[0.22, 0.07, 0.03]} m={m.dash} />
			<mesh position={[0, 2.03, -1.86]} material={m.bless}>
				<planeGeometry args={[1.0, 0.16]} />
			</mesh>
			<group position={[0, 1.94, -1.76]} rotation={[0, 0, Math.sin(t * 2.2) * 0.25 * st.rosary]}>
				{Array.from({length: 9}, (_, i) => (
					<Box key={i} p={[Math.sin(i * 0.7) * 0.025, -i * 0.025, 0]} s={[0.014, 0.014, 0.014]} m={m.bead} />
				))}
				<Box p={[0, -0.25, 0]} s={[0.01, 0.04, 0.008]} m={m.chrome} />
				<Box p={[0, -0.24, 0]} s={[0.03, 0.01, 0.008]} m={m.chrome} />
			</group>
			{/* the passenger body: floor, painted lower sides with stripes, window posts, roof */}
			<Box p={[0, 0.66, 0.5]} s={[1.84, 0.06, 4.8]} m={m.floor} />
			{[-1, 1].map((sd) => (
				<group key={sd}>
					<Box p={[sd * 0.95, 1.1, 0.5]} s={[0.06, 0.9, 4.8]} m={m.body} />
					<Box p={[sd * 0.95, 1.0, -1.4]} s={[0.06, 0.7, 1.0]} m={m.body} />
					<Box p={[sd * 0.985, 1.24, 0.5]} s={[0.01, 0.08, 4.8]} m={m.red} />
					<Box p={[sd * 0.985, 1.36, 0.5]} s={[0.01, 0.06, 4.8]} m={m.blue} />
					<Box p={[sd * 0.985, 1.46, 0.5]} s={[0.01, 0.04, 4.8]} m={m.yellow} />
					{Array.from({length: 7}, (_, i) => (
						<Box key={i} p={[sd * 0.95, 1.86, -0.9 + i * 0.63]} s={[0.05, 0.62, 0.05]} m={m.chrome} />
					))}
					{/* benches facing each other along the sides */}
					<Box p={[sd * 0.7, 0.98, 0.85]} s={[0.38, 0.1, 3.9]} m={m.vinyl} />
					<Box p={[sd * 0.88, 1.32, 0.85]} s={[0.08, 0.36, 3.9]} m={m.vinyl} />
					<Box p={[sd * 0.35, 2.06, 0.9]} s={[0.03, 0.03, 4.0]} m={m.chrome} />
				</group>
			))}
			<Box p={[0, 2.19, 0.45]} s={[2.0, 0.08, 5.1]} m={m.body} />
			<Box p={[0, 2.12, 0.45]} s={[1.9, 0.02, 5.0]} m={m.under} />
			{/* the route signboard on the roof */}
			<Box p={[0, 2.38, -1.95]} s={[1.62, 0.28, 0.05]} m={m.dash} />
			<mesh position={[0, 2.38, -1.98]} rotation={[0, Math.PI, 0]} material={m.sign}>
				<planeGeometry args={[1.56, 0.25]} />
			</mesh>
			{/* the fluorescent tube */}
			<mesh position={[0, 2.09, 0.9]} rotation={[Math.PI / 2, 0, 0]} material={st.tube > 0.5 ? m.tubeOn : m.tubeOff}>
				<cylinderGeometry args={[0.025, 0.025, 1.6, 6]} />
			</mesh>
			{/* the back: open entrance, step, tail lights */}
			{[-1, 1].map((sd) => (
				<group key={`b${sd}`}>
					<Box p={[sd * 0.72, 1.1, 2.92]} s={[0.46, 0.9, 0.06]} m={m.body} />
					<Box p={[sd * 0.85, 0.9, 2.96]} s={[0.1, 0.12, 0.03]} m={st.tail ? m.tailOn : m.tailOff} />
					<Box p={[sd * 0.47, 1.6, 2.9]} s={[0.03, 1.0, 0.03]} m={m.chrome} />
				</group>
			))}
			<Box p={[0, 0.36, 3.08]} s={[0.9, 0.05, 0.32]} m={m.chrome} />
		</group>
	);
};

/** A glare disc in front of each headlight (only when it is seen from ahead). */
export const Glare: React.FC<{jz: number; size: number; halo?: boolean}> = ({jz, size, halo = false}) => {
	const m = useM();
	return (
		<group>
			{[-0.66, 0.66].map((x) => (
				<mesh key={x} position={[JX + x, 0.86, jz - 3.02]} rotation={[0, Math.PI, 0]} material={m.flare}>
					<circleGeometry args={[size, 10]} />
				</mesh>
			))}
			{halo && (
				<mesh position={[JX, 0.9, jz - 3.05]} rotation={[0, Math.PI, 0]}>
					<circleGeometry args={[2.2, 14]} />
					<meshBasicMaterial color="#fff0c8" transparent opacity={0.16} depthWrite={false} fog={false} />
				</mesh>
			)}
		</group>
	);
};

// ------------------------------------------------------------------ the driver
/** The driver (a decent man): green shirt with a print, a towel over the shoulder.
 * pose 'walk' (phase from t) or 'sit' (cradling: the bundle goes in his arms; sag 0..1 its weight). */
export const Driver: React.FC<{t: number; pose: 'walk' | 'sit'; sag?: number; head?: boolean; position?: V3; rotation?: V3; children?: React.ReactNode}> = ({t, pose, sag = 0, head = true, position = [0, 0, 0], rotation = [0, 0, 0], children}) => {
	const m = useM();
	if (pose === 'walk') {
		const ph = Math.sin(t * 5.2) * 0.32;
		return (
			<group position={position} rotation={rotation}>
				{[-1, 1].map((sd) => (
					<group key={sd} position={[sd * 0.1, 0.86, 0]} rotation={[sd * ph, 0, 0]}>
						<Box p={[0, -0.43, 0]} s={[0.13, 0.86, 0.14]} m={m.pants} />
						<Box p={[0, -0.84, 0.05]} s={[0.1, 0.04, 0.24]} m={m.slipper} />
					</group>
				))}
				<Box p={[0, 1.15, 0]} s={[0.4, 0.58, 0.24]} m={m.shirt} />
				<Box p={[0, 1.22, 0.125]} s={[0.16, 0.12, 0.01]} m={m.print} />
				<Box p={[0.14, 1.43, 0]} s={[0.12, 0.04, 0.26]} m={m.towel} />
				{[-1, 1].map((sd) => (
					<group key={`a${sd}`} position={[sd * 0.24, 1.4, 0]} rotation={[-sd * ph * 0.8, 0, sd * 0.06]}>
						<Box p={[0, -0.18, 0]} s={[0.1, 0.36, 0.11]} m={m.shirt} />
						<Box p={[0, -0.48, 0]} s={[0.08, 0.3, 0.08]} m={m.skin} />
					</group>
				))}
				{head && (
					<group position={[0, 1.6, 0]}>
						<Box p={[0, 0, 0]} s={[0.2, 0.24, 0.21]} m={m.skin} />
						<Box p={[0, 0.1, -0.02]} s={[0.21, 0.07, 0.23]} m={m.hair} />
					</group>
				)}
			</group>
		);
	}
	// sitting on the bench, hips at the local origin, facing +z; the bundle across his forearms
	const dy = -sag * 0.11;
	const sh: V3[] = [[-0.23, 0.55, -0.04], [0.23, 0.55, -0.04]];
	const el: V3[] = [[-0.25, 0.3 + dy * 0.6, 0.16], [0.25, 0.3 + dy * 0.6, 0.16]];
	const hd: V3[] = [[0.12, 0.24 + dy, 0.36], [-0.12, 0.24 + dy, 0.36]];
	return (
		<group position={position} rotation={rotation}>
			{[-1, 1].map((sd) => (
				<group key={sd}>
					<Box p={[sd * 0.1, 0.07, 0.2]} s={[0.14, 0.14, 0.44]} m={m.pants} />
					<Box p={[sd * 0.1, -0.15, 0.44]} s={[0.11, 0.42, 0.11]} m={m.pants} />
					<Box p={[sd * 0.1, -0.34, 0.5]} s={[0.1, 0.04, 0.24]} m={m.slipper} />
				</group>
			))}
			<group rotation={[-0.06 + sag * 0.12, 0, 0]}>
				<Box p={[0, 0.3, -0.04]} s={[0.4, 0.56, 0.24]} m={m.shirt} />
				<Box p={[0, 0.38, 0.085]} s={[0.16, 0.12, 0.01]} m={m.print} />
				<Box p={[0.14, 0.58, -0.04]} s={[0.12, 0.04, 0.26]} m={m.towel} />
				{[0, 1].map((i) => (
					<group key={i}>
						<Limb a={sh[i]} b={el[i]} w={0.1} m={m.shirt} />
						<Limb a={el[i]} b={hd[i]} w={0.08} m={m.skin} />
					</group>
				))}
				{head && (
					<group position={[0, 0.75, -0.04]} rotation={[0.45 + sag * 0.15, 0, 0]}>
						<Box p={[0, 0, 0]} s={[0.2, 0.24, 0.21]} m={m.skin} />
						<Box p={[0, 0.1, -0.02]} s={[0.21, 0.07, 0.23]} m={m.hair} />
					</group>
				)}
				<group position={[0, 0.3 + dy, 0.27]}>{children}</group>
			</group>
		</group>
	);
};

/** The driver's shirt left on the bench, turned inside out: seams out, the tag showing, the print gone. */
export const ShirtInsideOut: React.FC<{position: V3; rotation?: V3}> = ({position, rotation = [0, 0, 0]}) => {
	const m = useM();
	return (
		<group position={position} rotation={rotation}>
			<Box p={[0, 0, 0]} s={[0.4, 0.02, 0.5]} m={m.shirtIn} />
			{[-1, 1].map((sd) => (
				<group key={sd}>
					<Box p={[sd * 0.28, 0.0, -0.17]} s={[0.18, 0.018, 0.16]} m={m.shirtIn} r={[0, sd * 0.4, 0]} />
					<Box p={[sd * 0.199, 0.012, 0.02]} s={[0.012, 0.006, 0.44]} m={m.seam} />
					<Box p={[sd * 0.2, 0.012, -0.21]} s={[0.012, 0.006, 0.12]} m={m.seam} r={[0, sd * 0.5, 0]} />
				</group>
			))}
			<Box p={[0, 0.012, -0.24]} s={[0.16, 0.006, 0.012]} m={m.seam} />
			<Box p={[0, 0.014, -0.215]} s={[0.04, 0.006, 0.03]} m={m.tag} />
			<Box p={[0, 0.012, 0.245]} s={[0.4, 0.006, 0.012]} m={m.seam} />
		</group>
	);
};

/** A pair of rubber tsinelas. */
export const Tsinelas: React.FC<{position: V3; rotation?: V3}> = ({position, rotation = [0, 0, 0]}) => {
	const m = useM();
	return (
		<group position={position} rotation={rotation}>
			{[[-0.07, 0, 0.1], [0.08, 0.03, -0.25]].map(([x, z, r], i) => (
				<group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
					<Box p={[0, 0.01, 0]} s={[0.09, 0.02, 0.25]} m={m.slipper} />
					<Box p={[-0.025, 0.03, 0.02]} s={[0.01, 0.01, 0.08]} m={m.strap} r={[0, 0.5, 0]} />
					<Box p={[0.025, 0.03, 0.02]} s={[0.01, 0.01, 0.08]} m={m.strap} r={[0, -0.5, 0]} />
				</group>
			))}
		</group>
	);
};

/** Old lampins rotting in the grass where it lies: it has done this before. */
export const OldCloths: React.FC = () => {
	const m = useM();
	const cl = useMemo(() => {
		const r = rng(404);
		return Array.from({length: 6}, (_, i) => ({a: (i / 6) * Math.PI * 2 + r(), d: 0.5 + r() * 0.5, s: 0.18 + r() * 0.14, ry: r() * 3, dark: r() < 0.5}));
	}, []);
	return (
		<group position={BUNDLE}>
			{cl.map((c, i) => (
				<Box key={i} p={[Math.cos(c.a) * c.d, 0.01, Math.sin(c.a) * c.d]} s={[c.s, 0.015, c.s * 0.8]} m={c.dark ? m.rot2 : m.rot} r={[0.05, c.ry, 0.04]} />
			))}
		</group>
	);
};
