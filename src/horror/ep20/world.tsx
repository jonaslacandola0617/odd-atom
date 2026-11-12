// Episode 20 world: "The Theatre by the Bay" (a reported legend over a real accident: the Manila
// Film Center, 1981). Four sets, all built as composites, not surveys:
// THE BUILDING (at the origin): a white, temple-like building on reclaimed land, a colonnade on a
// raised plinth with wide steps, Manila Bay black behind it and city lights far across the water. In
// 1981 it wears scaffolding and work lights, with a site clock at 3:00 (no people, ever). At the
// festival, searchlights and an empty red carpet.
// THE LOBBY (at LOBBY): a grand marble staircase in the dark.
// THE THEATRE (at THEATRE): a raked auditorium of red folding seats facing a stage with a closed
// curtain; a clock on the side wall at 3:00; dust handprints on the stage edge.
// Care: no worker is shown at any time. The seated figures (in Episode20.tsx) are dust-grey backs,
// never faces.
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
export const THEATRE: V3 = [300, 0, 0];
export const LOBBY: V3 = [-300, 0, 0];
export const ROWS = 10;
export const COLS = 14;
export const seatPos = (r: number, c: number): V3 => [THEATRE[0] - 5.2 + c * 0.8, r * 0.32, THEATRE[2] + 2 + r * 1.0];
export const HOOK_SEAT: [number, number] = [3, 11]; // the seat that folds down in the hook
export const DOWN_SEAT: [number, number] = [5, 4]; // already down at frame 0 (a hidden detail)
export const HAT_SEAT: [number, number] = [4, 13]; // the hard hat in the dark wide

const seg = (v: number) => Math.min(14, Math.max(1, Math.ceil(v / 0.5)));
export const Box: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3}> = ({p, s, m, r}) => (
	<mesh position={p} rotation={r} material={m}>
		<boxGeometry args={[s[0], s[1], s[2], seg(s[0]), seg(s[1]), seg(s[2])]} />
	</mesh>
);

const clockTex = () =>
	tex(32, 32, (g) => {
		g.fillStyle = '#d8d4c4';
		g.beginPath();
		g.arc(16, 16, 15, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = '#1a1a1a';
		for (let i = 0; i < 12; i++) g.fillRect(16 + Math.round(Math.sin((i / 12) * Math.PI * 2) * 12), 16 - Math.round(Math.cos((i / 12) * Math.PI * 2) * 12), 1, 1);
		// 3:00
		g.fillRect(16, 15, 8, 2); // hour hand at 3
		g.fillRect(15, 4, 2, 12); // minute hand at 12
	});

const useMats = () =>
	useMemo(() => {
		const handprints = tex(64, 16, (g) => {
			g.clearRect(0, 0, 64, 16);
			const r = rng(2001);
			for (let i = 0; i < 7; i++) {
				const x = 4 + i * 8 + r() * 3, y = 4 + r() * 6;
				g.fillStyle = 'rgba(30,26,22,0.65)';
				g.fillRect(x, y, 4, 4);
				for (let f = 0; f < 4; f++) g.fillRect(x + f, y - 3, 1, 3);
				g.fillRect(x + 4, y + 1, 2, 1);
			}
		});
		return {
			white: lam('#d8d4c8'),
			plinth: lam('#a8a498'),
			bay: lam('#0a1018'),
			lights: bas('#f0d8a0'),
			sky: new THREE.MeshBasicMaterial({color: '#080a12', side: THREE.BackSide, fog: false}),
			ground: lam('#1e2418'),
			road: lam('#2a2a2e'),
			palm: lam('#3a3226'),
			frond: lam('#1e2a18'),
			pipe: lam('#8a8a84'),
			plank: lam('#6a5236'),
			lamp: bas('#fff4d0'),
			pole: lam('#3a3a3a'),
			clock: lam('#ffffff', {map: clockTex()}),
			hat: lam('#b89a3a'),
			hatDust: lam('#8a8270'),
			carpet: lam('#7a1416'),
			brass: lam('#a88a40'),
			beam: new THREE.MeshBasicMaterial({color: '#e8e8ff', transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, fog: false}),
			marble: lam('#b8b4ac'),
			marbleDark: lam('#7a766e'),
			rail: lam('#2a1e16'),
			// theatre
			seat: lam('#7a1a1a'),
			seatBack: lam('#4a1012'),
			seatFrame: lam('#1a1a1a'),
			step: lam('#2a2422'),
			wall: lam('#2a2224'),
			stage: lam('#3a2a20'),
			curtain: lam('#4a0e10'),
			arch: lam('#8a7a5a'),
			prints: new THREE.MeshBasicMaterial({map: handprints, transparent: true, depthWrite: false}),
			exit: bas('#40ff70'),
			black: bas('#020203'),
			dust: lam('#6a665e'),
			dustDark: lam('#56524c'),
		};
	}, []);
export type Mats = ReturnType<typeof useMats>;
const Ctx = React.createContext<Mats | null>(null);
export const useM = () => React.useContext(Ctx)!;
export const MatsProvider: React.FC<{children: React.ReactNode}> = ({children}) => <Ctx.Provider value={useMats()}>{children}</Ctx.Provider>;

/** A hard hat, dusty. */
export const HardHat: React.FC<{position: V3; ry?: number}> = ({position, ry = 0}) => {
	const m = useM();
	return (
		<group position={position} rotation={[0, ry, 0]}>
			<mesh position={[0, 0.08, 0]} scale={[1, 0.75, 1.15]} material={m.hat}>
				<sphereGeometry args={[0.14, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2]} />
			</mesh>
			<mesh position={[0, 0.07, 0.03]} material={m.hatDust}>
				<cylinderGeometry args={[0.17, 0.17, 0.015, 10]} />
			</mesh>
		</group>
	);
};

/** The building on reclaimed land, the bay and the far city. era: 'now' | '1981' (scaffold, work lights, site clock) | 'festival'. */
export const Building: React.FC<{t: number; era: 'now' | '1981' | 'festival'; sway: number; hat: boolean}> = ({t, era, sway, hat}) => {
	const m = useM();
	const cityLights = useMemo(() => {
		const r = rng(2002);
		return Array.from({length: 70}, () => ({x: -260 + r() * 520, y: 0.5 + r() * 9, z: -380 - r() * 60}));
	}, []);
	return (
		<group>
			<mesh material={m.sky}>
				<sphereGeometry args={[450, 12, 8]} />
			</mesh>
			<mesh position={[0, -0.05, 30]} rotation={[-Math.PI / 2, 0, 0]} material={m.ground}>
				<planeGeometry args={[200, 80, 40, 16]} />
			</mesh>
			<mesh position={[0, -0.6, -200]} rotation={[-Math.PI / 2, 0, 0]} material={m.bay}>
				<planeGeometry args={[800, 340, 20, 10]} />
			</mesh>
			{cityLights.map((c, i) => (
				<mesh key={i} position={[c.x, c.y, c.z]} material={m.lights}>
					<boxGeometry args={[1.2, 0.8, 0.5]} />
				</mesh>
			))}
			{/* the plinth and its wide steps */}
			<Box p={[0, 1.0, -14]} s={[48, 2.0, 32]} m={m.plinth} />
			{Array.from({length: 6}, (_, i) => (
				<Box key={`st${i}`} p={[0, 0.17 + i * 0.33, 4 - i * 0.6]} s={[20, 0.34, 0.6]} m={m.plinth} />
			))}
			{/* the hall: a white box behind a colonnade, a deep flat roof */}
			<Box p={[0, 9, -18]} s={[38, 14, 22]} m={m.white} />
			{Array.from({length: 12}, (_, i) => (
				<Box key={`c${i}`} p={[-16.5 + i * 3, 9, -5.5]} s={[1.0, 14, 1.0]} m={m.white} />
			))}
			<Box p={[0, 16.6, -12]} s={[42, 1.2, 15]} m={m.white} />
			{/* far palms along the bay road */}
			{[-40, -30, 30, 40, 52].map((x, i) => (
				<group key={`p${i}`} position={[x, 0, 8 + (i % 2) * 6]}>
					<Box p={[0, 5, 0]} s={[0.35, 10, 0.35]} m={m.palm} />
					{Array.from({length: 7}, (_, k) => (
						<group key={k} position={[0, 10, 0]} rotation={[0, (k / 7) * Math.PI * 2, 0]}>
							<mesh position={[1.1, -0.35, 0]} rotation={[0, 0, -0.55]} material={m.frond}>
								<boxGeometry args={[2.4, 0.05, 0.5]} />
							</mesh>
						</group>
					))}
				</group>
			))}
			{era === '1981' && (
				<group>
					{/* scaffolding against the colonnade: standards, ledgers, planks; it sways */}
					<group position={[0, 2, -3.8]} rotation={[sway * 0.4, 0, sway]}>
						{Array.from({length: 11}, (_, i) =>
							[0, 1.6].map((dz) => <Box key={`s${i}${dz}`} p={[-15 + i * 3, 7, dz]} s={[0.08, 14, 0.08]} m={m.pipe} />),
						)}
						{Array.from({length: 7}, (_, j) => (
							<group key={`l${j}`}>
								<Box p={[0, j * 2, 0]} s={[30, 0.08, 0.08]} m={m.pipe} />
								<Box p={[0, j * 2, 1.6]} s={[30, 0.08, 0.08]} m={m.pipe} />
								<Box p={[0, j * 2 + 0.06, 0.8]} s={[30, 0.06, 1.4]} m={m.plank} />
							</group>
						))}
						{hat && <HardHat position={[-2.2, 4.1, 0.9]} ry={0.6} />}
					</group>
					{/* work lights on poles */}
					{[-12, 0, 12].map((x) => (
						<group key={x} position={[x, 2, 6]}>
							<Box p={[0, 2.5, 0]} s={[0.12, 5, 0.12]} m={m.pole} />
							<Box p={[0, 5.1, -0.1]} s={[0.6, 0.4, 0.2]} m={m.lamp} />
						</group>
					))}
					{/* the site clock on a post: 3:00 */}
					<group position={[7.5, 2, 7]}>
						<Box p={[0, 1.2, 0]} s={[0.1, 2.4, 0.1]} m={m.pole} />
						<Box p={[0, 2.6, -0.05]} s={[0.7, 0.7, 0.08]} m={m.pole} />
						<mesh position={[0, 2.6, 0.0]} material={m.clock}>
							<circleGeometry args={[0.3, 14]} />
						</mesh>
					</group>
				</group>
			)}
			{era === 'festival' && (
				<group>
					{/* an empty red carpet up the steps, brass stanchions, searchlights sweeping the sky */}
					<Box p={[0, 1.02, 1]} s={[4, 0.04, 8]} m={m.carpet} />
					{Array.from({length: 6}, (_, i) => (
						<Box key={`cp${i}`} p={[0, 0.36 + i * 0.33, 4.02 - i * 0.6]} s={[4, 0.02, 0.62]} m={m.carpet} />
					))}
					{[-2.4, 2.4].map((x) =>
						Array.from({length: 4}, (_, i) => (
							<group key={`${x}${i}`} position={[x, 0, 6 + i * 2]}>
								<Box p={[0, 0.5, 0]} s={[0.08, 1.0, 0.08]} m={m.brass} />
							</group>
						)),
					)}
					{[-14, -5, 5, 14].map((x, i) => (
						<group key={`sl${i}`} position={[x, 0.5, 12]} rotation={[0.25 * Math.sin(t * 0.4 + i), 0, 0.35 * Math.sin(t * 0.5 + i * 1.7)]}>
							<mesh position={[0, 40, 0]} material={m.beam}>
								<coneGeometry args={[3.5, 80, 8, 1, true]} />
							</mesh>
						</group>
					))}
				</group>
			)}
		</group>
	);
};

/** The lobby: a grand marble staircase rising away from you, a landing, dark walls. */
export const Lobby: React.FC = () => {
	const m = useM();
	return (
		<group position={LOBBY}>
			<mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.marbleDark}>
				<planeGeometry args={[20, 30, 20, 30]} />
			</mesh>
			{Array.from({length: 18}, (_, i) => (
				<Box key={i} p={[0, 0.09 + i * 0.18, -2 - i * 0.32]} s={[6, 0.18, 0.32]} m={i % 2 ? m.marble : m.marbleDark} />
			))}
			<Box p={[0, 3.1, -9.2]} s={[10, 0.2, 2.4]} m={m.marble} />
			{[-3.1, 3.1].map((x) => (
				<group key={x}>
					{Array.from({length: 18}, (_, i) => (
						<Box key={i} p={[x, 0.5 + i * 0.18, -2 - i * 0.32]} s={[0.05, 0.9, 0.05]} m={m.rail} />
					))}
					<mesh position={[x, 2.0, -4.8]} rotation={[0.51, 0, 0]} material={m.rail}>
						<boxGeometry args={[0.12, 0.08, 6.6]} />
					</mesh>
				</group>
			))}
			{[-5.5, 5.5].map((x) => (
				<Box key={`w${x}`} p={[x, 4, -5]} s={[0.3, 8, 16]} m={m.wall} />
			))}
			<Box p={[0, 4, -10.6]} s={[11, 8, 0.3]} m={m.black} />
		</group>
	);
};

/** The theatre: raked rows of folding seats, aisles, the stage and its closed curtain, a wall clock at 3:00, an exit sign.
 * down(r, c) says whether a seat is folded down (0..1). */
export const Theatre: React.FC<{down: (r: number, c: number) => number; prints: boolean}> = ({down, prints}) => {
	const m = useM();
	return (
		<group>
			<group position={THEATRE}>
				{/* the raked floor in steps */}
				{Array.from({length: ROWS}, (_, r) => (
					<Box key={`f${r}`} p={[0, r * 0.32 - 0.05, 2 + r * 1.0]} s={[16, 0.1, 1.0]} m={m.step} />
				))}
				<Box p={[0, -0.05, 0.5]} s={[16, 0.1, 2]} m={m.step} />
				{/* walls and ceiling */}
				{[-8, 8].map((x) => (
					<Box key={x} p={[x, 4, 5]} s={[0.3, 9, 22]} m={m.wall} />
				))}
				<Box p={[0, 7.8, 5]} s={[16, 0.3, 22]} m={m.wall} />
				<Box p={[0, 4, 13.5]} s={[16, 9, 0.3]} m={m.wall} />
				{/* the stage, its lip with dust handprints, the arch, the closed curtain */}
				<Box p={[0, 0.45, -4]} s={[16, 0.9, 8]} m={m.stage} />
				{prints && (
					<mesh position={[-1.5, 0.6, 0.02]} material={m.prints}>
						<planeGeometry args={[4, 0.5]} />
					</mesh>
				)}
				<Box p={[-7, 4, -0.6]} s={[2, 8, 0.6]} m={m.arch} />
				<Box p={[7, 4, -0.6]} s={[2, 8, 0.6]} m={m.arch} />
				<Box p={[0, 7.2, -0.6]} s={[16, 1.6, 0.6]} m={m.arch} />
				<Box p={[0, 3.8, -1.2]} s={[12, 6.0, 0.2]} m={m.curtain} />
				{[-4.5, -1.5, 1.5, 4.5].map((x) => (
					<Box key={`fold${x}`} p={[x, 3.8, -1.05]} s={[0.12, 6.0, 0.08]} m={m.seatBack} />
				))}
				{/* the wall clock at 3:00 and a green exit sign */}
				<mesh position={[7.83, 4.6, 6]} rotation={[0, -Math.PI / 2, 0]} material={m.clock}>
					<circleGeometry args={[0.35, 14]} />
				</mesh>
				<Box p={[7.83, 3.2, 11]} s={[0.04, 0.25, 0.7]} m={m.exit} />
			</group>
			{/* the seats: a frame and back, and a pad that folds down */}
			{Array.from({length: ROWS}, (_, r) =>
				Array.from({length: COLS}, (_, c) => {
					const p = seatPos(r, c);
					const d = down(r, c);
					return (
						<group key={`${r}-${c}`} position={p}>
							<Box p={[0, 0.72, 0.28]} s={[0.56, 0.7, 0.08]} m={m.seatBack} />
							<Box p={[-0.29, 0.4, 0.05]} s={[0.04, 0.55, 0.5]} m={m.seatFrame} />
							<group position={[0, 0.42, 0.24]} rotation={[(1 - d) * (Math.PI / 2 - 0.15), 0, 0]}>
								<Box p={[0, 0.0, -0.21]} s={[0.5, 0.09, 0.42]} m={m.seat} />
							</group>
						</group>
					);
				}),
			)}
		</group>
	);
};

/** A seated figure seen from behind: grey with dust from head to shoulders, still, facing the stage. turn: its head, a little. Never a face. */
export const DustFigure: React.FC<{position: V3; turn?: number; seed: number}> = ({position, turn = 0, seed}) => {
	const m = useM();
	const s = 0.92 + ((seed * 37) % 11) / 60;
	return (
		<group position={position} scale={s}>
			<Box p={[0, 0.82, 0.08]} s={[0.4, 0.62, 0.24]} m={seed % 3 ? m.dust : m.dustDark} />
			<Box p={[0, 1.08, 0.08]} s={[0.46, 0.12, 0.26]} m={m.dust} />
			<mesh position={[0, 1.3, 0.06]} rotation={[0, turn, 0]} scale={[0.9, 1.1, 1]} material={m.dust}>
				<icosahedronGeometry args={[0.12, 1]} />
			</mesh>
		</group>
	);
};
