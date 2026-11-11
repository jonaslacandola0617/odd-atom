// Episode 16 world: "Ward Three" (reported legend: the abandoned hospital at the former Clark Air
// Base, Angeles, Pampanga). One consistent set beside the night road of Episode 15's land (cogon,
// poles, hills, an orange city glow): a long, low, single-storey hospital in tall grass; inside, a
// front corridor with a wheelchair and Ward 3 (two rows of bare bed frames, peeling two-tone paint, a
// stopped clock); the ghost hunters (generic and faceless) and their car.
//
// Layout (metres, y up). The hospital's own frame: front wall x = 6 (facing the road, +x), back
// wall x = -5.5, ends z = ±16; the corridor x 2.2..6; Ward 3 x -5.5..2.2, z -15.8..0, its door at
// z -3.5..-2.3; beds at z = -14, -12 ... -2 along both long walls; the aisle at x = -1.65. The
// hospital stands at HP in the world, unrotated; the road (Episode 15) runs along z at x = 0.
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

type V3 = [number, number, number];
export const HP: V3 = [-30, 0, 0];
export const H = (x: number, y: number, z: number): V3 => [HP[0] + x, y, HP[2] + z];
export const AISLE_X = -1.65;
export const WHEEL: V3 = [4.5, 0, -10.5];

const useMats = () =>
	useMemo(() => {
		// hospital two-tone: green below the dado line, cream above; peeling, water stains
		const wall = tex(16, 32, (g) => {
			g.fillStyle = '#b8b49a';
			g.fillRect(0, 0, 16, 32);
			g.fillStyle = '#5a7a62';
			g.fillRect(0, 18, 16, 14);
			g.fillStyle = '#3a4a3a';
			g.fillRect(0, 17, 16, 1);
			const r = rng(1603);
			for (let i = 0; i < 26; i++) {
				g.fillStyle = r() < 0.5 ? '#8a8670' : '#6a6656';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 32), 1 + Math.floor(r() * 3), 1 + Math.floor(r() * 2));
			}
			g.fillStyle = '#5a5444';
			g.fillRect(4, 2, 1, 12);
			g.fillRect(11, 5, 1, 9);
		}, [4, 1]);
		const floor = tex(8, 8, (g) => {
			const r = rng(1604);
			for (let y = 0; y < 8; y++)
				for (let x = 0; x < 8; x++) {
					g.fillStyle = r() < 0.5 ? '#8a867c' : '#7a766c';
					g.fillRect(x, y, 1, 1);
				}
			g.fillStyle = '#2e2a26';
			g.fillRect(1, 3, 3, 1);
			g.fillRect(5, 6, 2, 1);
		}, [16, 24]);
		const outer = tex(16, 16, (g) => {
			g.fillStyle = '#8a867a';
			g.fillRect(0, 0, 16, 16);
			const r = rng(1605);
			for (let i = 0; i < 30; i++) {
				g.fillStyle = r() < 0.6 ? '#4a4a3e' : '#6a685c';
				g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1 + Math.floor(r() * 4));
			}
			g.fillStyle = '#2e3a26';
			g.fillRect(0, 13, 16, 3);
		}, [8, 1]);
		const sign = (text: string, w: number, h: number, font: string, bg: string, fg: string) =>
			tex(w, h, (g) => {
				g.fillStyle = bg;
				g.fillRect(0, 0, w, h);
				g.fillStyle = fg;
				g.font = font;
				g.textAlign = 'center';
				g.textBaseline = 'middle';
				g.fillText(text, w / 2, h / 2 + 1);
			});
		const clock = tex(32, 32, (g) => {
			g.fillStyle = '#d8d4c4';
			g.beginPath();
			g.arc(16, 16, 15, 0, Math.PI * 2);
			g.fill();
			g.fillStyle = '#1a1a1a';
			for (let i = 0; i < 12; i++) g.fillRect(16 + Math.round(Math.sin((i / 12) * Math.PI * 2) * 12), 16 - Math.round(Math.cos((i / 12) * Math.PI * 2) * 12), 1, 1);
			// stopped at 3:07
			g.fillRect(16, 16, 7, 2);
			g.fillRect(16, 5, 1, 11);
			g.fillRect(17, 6, 1, 4);
		});
		return {
			wall: lam('#ffffff', {map: wall, side: THREE.DoubleSide}),
			outer: lam('#ffffff', {map: outer}),
			floor: lam('#ffffff', {map: floor}),
			ceiling: lam('#4a4842', {side: THREE.DoubleSide}),
			black: bas('#020203'),
			frame: lam('#6a6e70'),
			rust: lam('#5a3a28'),
			metal: lam('#9a9ea0'),
			seat: lam('#2a2622'),
			paper: lam('#a8a490'),
			pebble: lam('#c8c2b4'),
			sign: lam('#ffffff', {map: sign('WARD 3', 48, 14, 'bold 11px "DejaVu Sans", sans-serif', '#d8d4c4', '#1a2a4a')}),
			clock: lam('#ffffff', {map: clock}),
			weed: lam('#ffffff', {vertexColors: true}),
			vine: lam('#1e2a18'),
			jacket: lam('#1a1c20'),
			pack: lam('#2a3a2a'),
			cap: lam('#141414'),
			face: lam('#3a2c22'),
			lampOn: bas('#fff4d8'),
			cam: lam('#202022'),
			red: bas('#ff2010'),
			car: lam('#6a1e1e'),
			carDark: lam('#1a1a1c'),
			glass: new THREE.MeshBasicMaterial({color: '#0a0e12', transparent: true, opacity: 0.25, depthWrite: false}),
			carSeat: lam('#5a5044', {side: THREE.DoubleSide}),
			roof: lam('#2a2422', {side: THREE.DoubleSide}),
			sleeve: lam('#d4d0c2'),
			hand: lam('#b8b4a8'),
			flare: new THREE.MeshBasicMaterial({color: '#fff0c8', transparent: true, opacity: 0.55, depthWrite: false, fog: false}),
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

/** A wall along z at x, from z0 to z1, with openings [za, zb, ya, yb]. */
const WallZ: React.FC<{x: number; z0: number; z1: number; h: number; holes: [number, number, number, number][]; m: THREE.Material; t?: number}> = ({x, z0, z1, h, holes, m, t = 0.25}) => {
	const parts: React.ReactNode[] = [];
	holes = [...holes].sort((a, b) => a[0] - b[0]);
	const zs = [z0, ...holes.flatMap(([a, b]) => [a, b]), z1];
	for (let i = 0; i < zs.length; i += 2) if (zs[i + 1] > zs[i]) parts.push(<Box key={`s${i}`} p={[x, h / 2, (zs[i] + zs[i + 1]) / 2]} s={[t, h, zs[i + 1] - zs[i]]} m={m} />);
	holes.forEach(([a, b, ya, yb], i) => {
		if (ya > 0) parts.push(<Box key={`b${i}`} p={[x, ya / 2, (a + b) / 2]} s={[t, ya, b - a]} m={m} />);
		parts.push(<Box key={`t${i}`} p={[x, (yb + h) / 2, (a + b) / 2]} s={[t, h - yb, b - a]} m={m} />);
	});
	return <group>{parts}</group>;
};

const WIN = Array.from({length: 10}, (_, i) => -13.5 + i * 3);
export const HALL_H = 3.4;

/** A rusted bed frame with no mattress: head against the wall at x = wx, foot toward the aisle. */
const Bed: React.FC<{wx: number; z: number; dir: 1 | -1}> = ({wx, z, dir}) => {
	const m = useM();
	const cx = wx + dir * 1.0;
	return (
		<group position={[cx, 0, z]}>
			{[-0.95, 0.95].map((dx) => [-0.45, 0.45].map((dz) => <Box key={`${dx}${dz}`} p={[dx * dir, 0.3, dz]} s={[0.04, 0.6, 0.04]} m={m.frame} />))}
			{[-0.45, 0.45].map((dz) => (
				<Box key={dz} p={[0, 0.5, dz]} s={[1.95, 0.04, 0.04]} m={m.frame} />
			))}
			<Box p={[-0.95 * dir, 0.85, 0]} s={[0.04, 0.5, 0.94]} m={m.frame} />
			<Box p={[-0.95 * dir, 1.08, 0]} s={[0.05, 0.05, 0.94]} m={m.frame} />
			{Array.from({length: 7}, (_, k) => (
				<Box key={k} p={[(-0.8 + k * 0.27) * dir, 0.5, 0]} s={[0.02, 0.02, 0.9]} m={m.rust} />
			))}
		</group>
	);
};

export const Wheelchair: React.FC<{position: V3; ry: number}> = ({position, ry}) => {
	const m = useM();
	return (
		<group position={position} rotation={[0, ry, 0]}>
			{[-1, 1].map((sd) => (
				<group key={sd}>
					<mesh position={[sd * 0.3, 0.3, -0.05]} rotation={[0, Math.PI / 2, 0]} material={m.metal}>
						<torusGeometry args={[0.3, 0.018, 4, 14]} />
					</mesh>
					<mesh position={[sd * 0.22, 0.08, 0.32]} rotation={[0, Math.PI / 2, 0]} material={m.metal}>
						<torusGeometry args={[0.07, 0.015, 4, 8]} />
					</mesh>
					<Box p={[sd * 0.23, 0.62, 0.05]} s={[0.03, 0.03, 0.45]} m={m.metal} />
					<Box p={[sd * 0.23, 0.72, -0.2]} s={[0.03, 0.55, 0.03]} m={m.metal} />
					<Box p={[sd * 0.23, 0.98, -0.3]} s={[0.03, 0.03, 0.18]} m={m.seat} />
				</group>
			))}
			<Box p={[0, 0.5, 0.05]} s={[0.44, 0.04, 0.42]} m={m.seat} />
			<Box p={[0, 0.78, -0.2]} s={[0.44, 0.48, 0.03]} m={m.seat} />
			<Box p={[0, 0.2, 0.35]} s={[0.3, 0.02, 0.12]} m={m.metal} />
		</group>
	);
};

/** Tall weeds around the hospital (one triangle per blade). */
const Weeds: React.FC<{t: number}> = ({t}) => {
	const m = useM();
	const {geo, tips, base} = useMemo(() => {
		const r = rng(1606);
		const pos: number[] = [], col: number[] = [], tips: number[] = [];
		const lo = new THREE.Color('#22301a'), hi = new THREE.Color('#b8b494'), mid = new THREE.Color('#3a4a26');
		for (let i = 0; i < 9000; i++) {
			const x = -40 + r() * 23, z = -26 + r() * 52;
			const lx = x - HP[0], lz = z - HP[2];
			if (lx > -6 && lx < 6.4 && lz > -16.4 && lz < 16.4) continue; // the building
			if (lx > 6 && lx < 13 && Math.abs(lz) < 1.3) continue; // the path to the door
			const h = 0.6 + r() * 1.1;
			const w = 0.015 + r() * 0.02, a = r() * Math.PI, ox = (r() - 0.5) * 0.3, oz = (r() - 0.5) * 0.3;
			pos.push(x - Math.cos(a) * w, 0, z - Math.sin(a) * w, x + Math.cos(a) * w, 0, z + Math.sin(a) * w, x + ox, h, z + oz);
			const tip = mid.clone().lerp(hi, 0.3 + r() * 0.5);
			col.push(lo.r, lo.g, lo.b, lo.r, lo.g, lo.b, tip.r, tip.g, tip.b);
			tips.push(pos.length / 3 - 1);
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
		p.setX(i, bx + Math.sin(t * 1.3 + bx * 0.4 + bz * 0.25) * 0.1);
	}
	p.needsUpdate = true;
	return <mesh geometry={geo} material={m.weed} />;
};

/** The hospital, inside and out. pebbles: how many have landed (0..8). wheelRy: the wheelchair's facing. */
export const Hospital: React.FC<{t: number; pebbles: number; wheelRy: number; outside: boolean}> = ({t, pebbles, wheelRy, outside}) => {
	const m = useM();
	const debris = useMemo(() => {
		const r = rng(1607);
		return Array.from({length: 40}, () => ({x: -5 + r() * 10.6, z: -15.5 + r() * 31, s: 0.06 + r() * 0.2, ry: r() * 3, paper: r() < 0.5}));
	}, []);
	const peb = useMemo(() => {
		const r = rng(1608);
		return Array.from({length: 8}, () => ({x: AISLE_X - 0.6 + r() * 1.4, z: -1.6 - r() * 1.4}));
	}, []);
	return (
		<group position={HP}>
			<mesh position={[0.25, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.floor}>
				<planeGeometry args={[11.8, 32.4, 30, 80]} />
			</mesh>
			{/* front wall with windows and the main door; back wall with windows */}
			<WallZ x={6} z0={-16} z1={16} h={HALL_H} holes={[...WIN.filter((z) => Math.abs(z) > 2).map((z) => [z - 0.6, z + 0.6, 0.75, 2.3] as [number, number, number, number]), [-1.0, 1.0, 0, 2.5]]} m={outside ? m.outer : m.wall} />
			<WallZ x={-5.5} z0={-16} z1={16} h={HALL_H} holes={WIN.map((z) => [z - 0.6, z + 0.6, 1.0, 2.3] as [number, number, number, number])} m={outside ? m.outer : m.wall} />
			{[-16, 16].map((z) => (
				<Box key={z} p={[0.25, HALL_H / 2, z]} s={[11.8, HALL_H, 0.25]} m={outside ? m.outer : m.wall} />
			))}
			{/* the corridor wall with the doors to the wards */}
			<WallZ x={2.2} z0={-16} z1={16} h={HALL_H} holes={[[-3.5, -2.3, 0, 2.3], [8, 9.2, 0, 2.3]]} m={m.wall} />
			<Box p={[-1.65, HALL_H / 2, 0]} s={[7.7, HALL_H, 0.2]} m={m.wall} />
			{/* ceiling with missing panels; a flat roof with an overhang outside */}
			{Array.from({length: 16}, (_, i) =>
				i % 5 === 2 ? null : <Box key={`c${i}`} p={[0.25, HALL_H, -15 + i * 2]} s={[11.6, 0.06, 1.95]} m={m.ceiling} />,
			)}
			{outside && <Box p={[0.6, HALL_H + 0.2, 0]} s={[13.2, 0.3, 33.4]} m={m.outer} />}
			{outside && (
				<>
					<Box p={[7.4, 2.7, 0]} s={[2.8, 0.15, 3.2]} m={m.outer} />
					{[-1.4, 1.4].map((z) => (
						<Box key={z} p={[8.6, 1.3, z]} s={[0.15, 2.6, 0.15]} m={m.outer} />
					))}
					{/* vines climbing the front wall */}
					{[-12, -7, -4.5, 3.5, 9, 13].map((z, i) => (
						<Box key={`v${i}`} p={[6.14, 1.1 + (i % 3) * 0.4, z]} s={[0.04, 2.2 + (i % 2), 0.5 + (i % 3) * 0.3]} m={m.vine} />
					))}
				</>
			)}
			{/* the ward sign over the door, on the corridor side */}
			<mesh position={[2.34, 2.55, -2.9]} rotation={[0, Math.PI / 2, 0]} material={m.sign}>
				<planeGeometry args={[0.9, 0.26]} />
			</mesh>
			{/* the stopped clock on the ward's end wall */}
			<mesh position={[AISLE_X, 2.55, -15.85]} material={m.clock}>
				<circleGeometry args={[0.28, 14]} />
			</mesh>
			{/* Ward 3: two rows of bare bed frames */}
			{[-14, -12, -10, -8, -6, -4, -2].map((z) => (
				<group key={z}>
					<Bed wx={-5.4} z={z} dir={1} />
					<Bed wx={2.1} z={z} dir={-1} />
				</group>
			))}
			<Wheelchair position={WHEEL} ry={wheelRy} />
			{debris.map((d, i) => (
				<Box key={i} p={[d.x, 0.01, d.z]} s={[d.s, 0.015, d.s * 0.7]} m={d.paper ? m.paper : m.rust} r={[0, d.ry, 0]} />
			))}
			{/* the pebbles that are thrown: one more than were counted */}
			{peb.slice(0, pebbles).map((p, i) => (
				<mesh key={`p${i}`} position={[p.x, 0.03, p.z]} material={m.pebble}>
					<icosahedronGeometry args={[0.05, 0]} />
				</mesh>
			))}
			{outside && <Weeds t={t} />}
		</group>
	);
};
export const PEBBLE_AT = (i: number, start: number) => start + [0, 0.9, 1.5, 2.6, 3.1, 3.9, 4.6][i];

/** A ghost hunter: dark clothes, a cap, a backpack; faceless in the dark. walk: stride phase or null. */
export const Hunter: React.FC<{t: number; position: V3; ry: number; run?: boolean; camcorder?: boolean; lamp?: boolean}> = ({t, position, ry, run = false, camcorder = false, lamp = true}) => {
	const m = useM();
	const ph = run ? Math.sin(t * 9) * 0.6 : 0;
	return (
		<group position={position} rotation={[0, ry, 0]}>
			{[-1, 1].map((sd) => (
				<group key={sd} position={[sd * 0.1, 0.85, 0]} rotation={[sd * ph, 0, 0]}>
					<Box p={[0, -0.42, 0]} s={[0.13, 0.85, 0.14]} m={m.jacket} />
				</group>
			))}
			<group rotation={[run ? 0.2 : 0, 0, 0]} position={[0, 0.85, 0]}>
				<Box p={[0, 0.3, 0]} s={[0.42, 0.6, 0.26]} m={m.jacket} />
				<Box p={[0, 0.32, -0.2]} s={[0.32, 0.42, 0.16]} m={m.pack} />
				<group position={[0, 0.74, 0]}>
					<Box p={[0, 0, 0]} s={[0.2, 0.24, 0.21]} m={m.face} />
					<Box p={[0, 0.11, 0.02]} s={[0.22, 0.06, 0.24]} m={m.cap} />
					<Box p={[0, 0.09, 0.15]} s={[0.2, 0.02, 0.1]} m={m.cap} />
				</group>
				{[-1, 1].map((sd) => (
					<group key={`a${sd}`} position={[sd * 0.25, 0.55, 0]} rotation={[camcorder && sd === 1 ? -1.3 : -sd * ph * 0.8 - (lamp && sd === -1 ? 1.0 : 0), 0, 0]}>
						<Box p={[0, -0.25, 0]} s={[0.1, 0.55, 0.11]} m={m.jacket} />
						{lamp && sd === -1 && <Box p={[0, -0.55, 0.03]} s={[0.05, 0.05, 0.12]} m={m.lampOn} />}
					</group>
				))}
				{camcorder && (
					<group position={[0.18, 0.72, 0.22]}>
						<Box p={[0, 0, 0]} s={[0.09, 0.11, 0.2]} m={m.cam} />
						<Box p={[0.02, 0.02, 0.11]} s={[0.012, 0.012, 0.012]} m={m.red} />
					</group>
				)}
			</group>
		</group>
	);
};

/** The hunters' car (front toward -z). sleeve: a white sleeve and a pale hand on the back seat. */
export const Car: React.FC<{position: V3; ry?: number; lights: boolean; sleeve: boolean}> = ({position, ry = 0, lights, sleeve}) => {
	const m = useM();
	return (
		<group position={position} rotation={[0, ry, 0]}>
			{[-0.78, 0.78].map((x) => [-1.35, 1.35].map((z) => (
				<mesh key={`${x}${z}`} position={[x, 0.32, z]} rotation={[0, 0, Math.PI / 2]} material={m.carDark}>
					<cylinderGeometry args={[0.32, 0.32, 0.2, 10]} />
				</mesh>
			)))}
			<Box p={[0, 0.6, 0]} s={[1.7, 0.5, 4.3]} m={m.car} />
			<Box p={[0, 0.84, -1.75]} s={[1.6, 0.03, 0.8]} m={m.car} />
			{[-0.6, 0.6].map((x) => (
				<group key={x}>
					<mesh position={[x, 0.66, -2.16]} material={lights ? m.lampOn : m.carDark}>
						<boxGeometry args={[0.32, 0.12, 0.02]} />
					</mesh>
					<mesh position={[x, 0.66, 2.16]} material={lights ? m.red : m.carDark}>
						<boxGeometry args={[0.3, 0.1, 0.02]} />
					</mesh>
				</group>
			))}
			{/* the cabin: pillars and a roof; seats inside */}
			{[-0.78, 0.78].map((x) => [-1.0, 0.2, 1.3].map((z) => (
				<Box key={`${x}${z}`} p={[x, 1.12, z]} s={[0.06, 0.55, 0.06]} m={m.car} />
			)))}
			<Box p={[0, 1.42, 0.15]} s={[1.62, 0.06, 2.4]} m={m.roof} />
			<mesh position={[0, 1.12, -1.0]} material={m.glass}>
				<planeGeometry args={[1.5, 0.5]} />
			</mesh>
			<Box p={[0, 0.95, -0.9]} s={[1.5, 0.2, 0.3]} m={m.carDark} />
			{[-0.38, 0.38].map((x) => (
				<group key={x}>
					<Box p={[x, 0.85, -0.25]} s={[0.55, 0.1, 0.5]} m={m.carSeat} />
					<Box p={[x, 1.15, 0.02]} s={[0.55, 0.55, 0.1]} m={m.carSeat} />
				</group>
			))}
			<mesh position={[0, 0.85, 0.85]} material={m.carSeat}>
				<boxGeometry args={[1.4, 0.1, 0.5, 10, 1, 4]} />
			</mesh>
			<mesh position={[0, 1.15, 1.12]} material={m.carSeat}>
				<boxGeometry args={[1.4, 0.55, 0.1, 10, 4, 1]} />
			</mesh>
			{sleeve && <Box p={[-0.35, 0.95, 0.95]} s={[0.36, 0.08, 0.34]} m={m.sleeve} />}
			{sleeve && (
				<group position={[-0.2, 0.92, 0.85]} rotation={[0, 0.35, 0]}>
					<Box p={[0, 0.02, -0.05]} s={[0.1, 0.08, 0.3]} m={m.sleeve} />
					<Box p={[0, 0.0, -0.3]} s={[0.065, 0.05, 0.25]} m={m.hand} />
					{[-0.02, 0, 0.02].map((x) => (
						<Box key={x} p={[x, -0.01, -0.47]} s={[0.012, 0.012, 0.1]} m={m.hand} />
					))}
				</group>
			)}
		</group>
	);
};

export const CarGlare: React.FC<{position: V3; size: number}> = ({position, size}) => {
	const m = useM();
	return (
		<group position={position}>
			{[-0.6, 0.6].map((x) => (
				<mesh key={x} position={[x, 0.66, -2.2]} rotation={[0, Math.PI, 0]} material={m.flare}>
					<circleGeometry args={[size, 10]} />
				</mesh>
			))}
		</group>
	);
};
