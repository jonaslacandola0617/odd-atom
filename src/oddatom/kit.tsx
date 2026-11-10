// Odd Atom style kit v2: reusable vector lighting, depth and character parts.
// Principles come from docs/style/odd-atom-visual-system.md (study of the
// reference archive): one defined light source per shot, rim light on the lit
// edge, soft terminator, bounce light on the night side, atmospheric halo,
// depth-of-field foreground occluders, parallax particles and per-shot colour
// scripts. Everything here is original procedural artwork.
import React from 'react';
import {Easing, interpolate, random} from 'remotion';

export const W = 1080;
export const H = 1920;

export const smooth = Easing.bezier(0.45, 0, 0.2, 1);
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.55, 0, 0.9, 0.4);

/** Piecewise keyframe interpolation with a shared easing. */
export const keys = (f: number, pts: [number, number][], ease = smooth) => {
	if (f <= pts[0][0]) return pts[0][1];
	for (let i = 1; i < pts.length; i++) {
		if (f <= pts[i][0]) {
			const [f0, v0] = pts[i - 1];
			const [f1, v1] = pts[i];
			return v0 + (v1 - v0) * ease((f - f0) / (f1 - f0));
		}
	}
	return pts[pts.length - 1][1];
};

export const ramp = (f: number, a: number, b: number, ease = smooth) =>
	interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

/** Light-direction helper: unit vector pointing from the object toward the light. */
export const dir = (deg: number) => {
	const r = (deg * Math.PI) / 180;
	return {x: Math.cos(r), y: Math.sin(r)};
};

/** objectBoundingBox gradient endpoints along a light direction. */
const gradAxis = (deg: number) => {
	const d = dir(deg);
	return {x1: 0.5 + 0.5 * d.x, y1: 0.5 + 0.5 * d.y, x2: 0.5 - 0.5 * d.x, y2: 0.5 - 0.5 * d.y};
};

// ---------------------------------------------------------------- background

export const Starfield: React.FC<{
	f: number;
	seed: string;
	count?: number;
	w?: number;
	h?: number;
	ox?: number;
	oy?: number;
	streak?: number; // vertical streak length for fast camera motion
	color?: string;
}> = ({f, seed, count = 160, w = W, h = H, ox = 0, oy = 0, streak = 0, color = '#ffffff'}) => (
	<g>
		{new Array(count).fill(0).map((_, i) => {
			const x = (((random(`${seed}x${i}`) * w + ox) % w) + w) % w;
			const y = (((random(`${seed}y${i}`) * h + oy) % h) + h) % h;
			const s = 0.6 + random(`${seed}s${i}`) ** 3 * 2.6;
			const tw = 0.55 + 0.45 * Math.sin(f / (9 + random(`${seed}t${i}`) * 20) + i);
			const o = (0.25 + random(`${seed}o${i}`) * 0.75) * tw;
			if (streak > 0.5)
				return <line key={i} x1={x} y1={y} x2={x} y2={y + streak * s * 0.5} stroke={color} strokeOpacity={o * 0.8} strokeWidth={s} strokeLinecap="round" />;
			return <circle key={i} cx={x} cy={y} r={s} fill={color} opacity={o} />;
		})}
	</g>
);

/** Soft out-of-focus dust in front of / behind the subject. */
export const Bokeh: React.FC<{f: number; seed: string; count?: number; color: string; blur?: number; size?: number; drift?: number; vy?: number; opacity?: number}> = ({
	f,
	seed,
	count = 24,
	color,
	blur = 6,
	size = 14,
	drift = 0.3,
	vy = -0.4,
	opacity = 0.35,
}) => (
	<g style={{filter: `blur(${blur}px)`}}>
		{new Array(count).fill(0).map((_, i) => {
			const sp = 0.5 + random(`${seed}v${i}`);
			const x = (((random(`${seed}x${i}`) * W + Math.sin(f / 50 + i) * 30 * drift) % W) + W) % W;
			const y = (((random(`${seed}y${i}`) * H + f * vy * sp) % H) + H) % H;
			const r = size * (0.4 + random(`${seed}r${i}`));
			return <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={opacity * (0.4 + 0.6 * random(`${seed}o${i}`))} />;
		})}
	</g>
);

// ---------------------------------------------------------------- gas giant

export type Band = {lat: number; h: number; color: string; amp?: number; k?: number; speed?: number};

export const JUPITER_BANDS: Band[] = [
	{lat: -1.0, h: 0.22, color: '#7d5a78'},
	{lat: -0.8, h: 0.12, color: '#b4776a', amp: 0.012, k: 9},
	{lat: -0.66, h: 0.1, color: '#f0cf9e', amp: 0.015, k: 7},
	{lat: -0.52, h: 0.14, color: '#de8a4f', amp: 0.02, k: 6, speed: 1.3},
	{lat: -0.36, h: 0.12, color: '#fbe7c4', amp: 0.018, k: 8},
	{lat: -0.22, h: 0.1, color: '#e9a25f', amp: 0.025, k: 5, speed: 1.6},
	{lat: -0.1, h: 0.14, color: '#fff1d8', amp: 0.02, k: 10},
	{lat: 0.06, h: 0.12, color: '#f0b46e', amp: 0.02, k: 6, speed: 1.2},
	{lat: 0.18, h: 0.11, color: '#c4552f', amp: 0.028, k: 7, speed: 1.8},
	{lat: 0.31, h: 0.12, color: '#f9dfb4', amp: 0.018, k: 9},
	{lat: 0.45, h: 0.12, color: '#d98b55', amp: 0.016, k: 6},
	{lat: 0.6, h: 0.13, color: '#ecc796', amp: 0.012, k: 8},
	{lat: 0.75, h: 0.3, color: '#9a6a6e'},
];

const TILT = 0.28; // viewer slightly above the equator: latitude lines bow downward
const latY = (r: number, v: number, x: number) => {
	const vv = Math.max(-0.999, Math.min(0.999, v));
	const c = Math.sqrt(1 - vv * vv);
	const q = Math.min(1, Math.abs(x) / (r * c));
	return r * (vv * Math.cos(TILT) + c * Math.sin(TILT) * Math.sqrt(1 - q * q));
};

const wavyBand = (r: number, b: Band, phase: number) => {
	const a = (b.amp ?? 0) * r;
	const k = (b.k ?? 6) / r;
	const n = 36;
	const top: string[] = [];
	const bot: string[] = [];
	for (let i = 0; i <= n; i++) {
		const x = -r * 1.05 + (2.1 * r * i) / n;
		top.push(`${x.toFixed(1)},${(latY(r, b.lat, x) + a * Math.sin(k * x + phase * (b.speed ?? 1))).toFixed(1)}`);
		bot.push(`${x.toFixed(1)},${(latY(r, b.lat + b.h, x) + a * Math.sin(k * x * 1.3 - phase * 0.7 * (b.speed ?? 1) + 2)).toFixed(1)}`);
	}
	return `M${top.join(' L')} L${bot.reverse().join(' L')} Z`;
};

/** Storm oval positioned in longitude so it rotates across the visible disc. */
const Storm: React.FC<{r: number; lon: number; lat: number; w: number; h: number; color: string; ring?: string}> = ({r, lon, lat, w, h, color, ring}) => {
	const c = Math.cos(lon);
	if (c <= 0.02) return null;
	const cl = Math.sqrt(1 - Math.min(0.98, lat * lat));
	const x = r * Math.sin(lon) * cl;
	const y = r * (lat * Math.cos(TILT) + cl * Math.sin(TILT) * c);
	return (
		<g transform={`translate(${x} ${y}) scale(${c} 1)`}>
			{ring && <ellipse rx={w * 1.35} ry={h * 1.45} fill={ring} opacity={0.75} />}
			<ellipse rx={w} ry={h} fill={color} />
			<ellipse rx={w * 0.55} ry={h * 0.45} cx={-w * 0.15} cy={-h * 0.15} fill="#ffffff" opacity={0.14} />
		</g>
	);
};

export const GasGiant: React.FC<{
	id: string;
	r: number;
	f: number;
	light: number; // degrees, direction toward the light (screen space, y down)
	bands?: Band[];
	spin?: number;
	night?: string;
	rim?: string;
	bounce?: string;
	halo?: string;
	litAmount?: number; // 0..1 how much of disc is lit (phase)
	cutaway?: number; // 0..1 opening of interior wedge
	redSpot?: boolean;
}> = ({id, r, f, light, bands = JUPITER_BANDS, spin = 0.012, night = '#1a0f2e', rim = '#fff1d6', bounce = '#5b4bc4', halo = '#ffd9a8', litAmount = 0.62, cutaway = 0, redSpot = true}) => {
	const L = dir(light);
	const phase = f * spin * 6;
	const ax = gradAxis(light);
	const litOff = r * (1 - litAmount) * 1.6;
	const storms = [
		{lon: -0.5 + f * spin, lat: 0.25, w: r * 0.16, h: r * 0.075, color: '#c4512f', ring: '#f2cfa5', red: true},
		{lon: 0.6 + f * spin * 1.1, lat: -0.42, w: r * 0.06, h: r * 0.03, color: '#fbf1dc'},
		{lon: 1.9 + f * spin * 1.1, lat: -0.42, w: r * 0.05, h: r * 0.026, color: '#fbf1dc'},
		{lon: -0.2 + f * spin * 0.9, lat: 0.55, w: r * 0.05, h: r * 0.025, color: '#f7e4c6'},
		{lon: 2.6 + f * spin, lat: 0.12, w: r * 0.09, h: r * 0.03, color: '#a75332'},
	].filter((s) => redSpot || !s.red);
	const wedgeA0 = -15;
	const wedgeA1 = wedgeA0 + 95 * cutaway;
	const pt = (a: number, rr: number) => `${(rr * Math.cos((a * Math.PI) / 180)).toFixed(1)},${(rr * Math.sin((a * Math.PI) / 180)).toFixed(1)}`;
	const wedge = `M0,0 L${pt(wedgeA0, r)} A${r},${r} 0 0 1 ${pt(wedgeA1, r)} Z`;
	return (
		<g>
			<defs>
				<clipPath id={`${id}-clip`}>
					<circle r={r} />
				</clipPath>
				<radialGradient id={`${id}-halo`}>
					<stop offset="0.78" stopColor={halo} stopOpacity="0" />
					<stop offset="0.84" stopColor={halo} stopOpacity="0.38" />
					<stop offset="1" stopColor={halo} stopOpacity="0" />
				</radialGradient>
				<linearGradient id={`${id}-rim`} {...ax}>
					<stop offset="0" stopColor={rim} stopOpacity="1" />
					<stop offset="0.45" stopColor={rim} stopOpacity="0" />
				</linearGradient>
				<linearGradient id={`${id}-bounce`} {...ax}>
					<stop offset="0.6" stopColor={bounce} stopOpacity="0" />
					<stop offset="1" stopColor={bounce} stopOpacity="0.9" />
				</linearGradient>
				<linearGradient id={`${id}-haloMask`} {...ax}>
					<stop offset="0" stopColor="#fff" stopOpacity="1" />
					<stop offset="0.75" stopColor="#fff" stopOpacity="0.15" />
				</linearGradient>
				<mask id={`${id}-night`} maskUnits="userSpaceOnUse" x={-r * 2} y={-r * 2} width={r * 4} height={r * 4}>
					<rect x={-r * 2} y={-r * 2} width={r * 4} height={r * 4} fill="#fff" />
					<circle cx={L.x * litOff} cy={L.y * litOff} r={r * 1.02} fill="#000" style={{filter: `blur(${r * 0.07}px)`}} />
				</mask>
				<mask id={`${id}-hm`} maskUnits="userSpaceOnUse" x={-r * 2} y={-r * 2} width={r * 4} height={r * 4}>
					<rect x={-r * 1.4} y={-r * 1.4} width={r * 2.8} height={r * 2.8} fill={`url(#${id}-haloMask)`} />
				</mask>
				<radialGradient id={`${id}-interior`} gradientUnits="userSpaceOnUse" cx="0" cy="0" r={r}>
					<stop offset="0" stopColor="#ffb25c" />
					<stop offset="0.16" stopColor="#c8573a" />
					<stop offset="0.3" stopColor="#4a2a8a" />
					<stop offset="0.62" stopColor="#3c5bd6" />
					<stop offset="0.86" stopColor="#8fb3ff" />
					<stop offset="0.95" stopColor="#d7c6b2" />
					<stop offset="1" stopColor="#e8c79a" />
				</radialGradient>
				<radialGradient id={`${id}-sheen`} cx={0.5 + L.x * 0.22} cy={0.5 + L.y * 0.22} r="0.55">
					<stop offset="0" stopColor="#ffffff" stopOpacity="0.32" />
					<stop offset="1" stopColor="#ffffff" stopOpacity="0" />
				</radialGradient>
			</defs>
			{/* atmospheric halo, brighter on the lit side */}
			<circle r={r * 1.2} fill={`url(#${id}-halo)`} mask={`url(#${id}-hm)`} />
			<g clipPath={`url(#${id}-clip)`}>
				<rect x={-r} y={-r} width={r * 2} height={r * 2} fill="#7d5a78" />
				{bands.map((b, i) => (
					<path key={i} d={wavyBand(r, b, phase)} fill={b.color} />
				))}
				{storms.map((s, i) => (
					<Storm key={i} r={r} {...s} />
				))}
				{/* limb darkening + sheen give volume */}
				<circle r={r} fill={`url(#${id}-sheen)`} />
				<circle r={r} fill="none" stroke="#3a1d2a" strokeOpacity={0.25} strokeWidth={r * 0.18} style={{filter: `blur(${r * 0.05}px)`}} />
				<rect x={-r * 2} y={-r * 2} width={r * 4} height={r * 4} fill={night} opacity={0.88} mask={`url(#${id}-night)`} />
				{/* bounce light on the night limb */}
				<circle r={r * 0.985} fill="none" stroke={`url(#${id}-bounce)`} strokeWidth={r * 0.05} style={{filter: `blur(${r * 0.012}px)`}} />
				{/* crisp rim light on the lit limb */}
				<circle r={r * 0.99} fill="none" stroke={`url(#${id}-rim)`} strokeWidth={r * 0.035} />
			</g>
			{cutaway > 0.001 && (
				<g>
					<path d={wedge} fill={`url(#${id}-interior)`} transform="scale(1)" style={{}} />
					{/* soft dark faces at the cut edges add thickness */}
					<path d={`M0,0 L${pt(wedgeA0, r)}`} stroke="#2a1530" strokeOpacity={0.55} strokeWidth={r * 0.02} />
					<path d={`M0,0 L${pt(wedgeA1, r)}`} stroke="#fff3dd" strokeOpacity={0.5} strokeWidth={r * 0.012} />
					<circle r={r * 0.05} fill="#ffd28a" opacity={0.5} style={{filter: `blur(${r * 0.03}px)`}} />
				</g>
			)}
		</g>
	);
};

// ---------------------------------------------------------------- molecules

export const Sphere: React.FC<{id: string; r: number; base: string; dark: string; light: string; glow?: number}> = ({id, r, base, dark, light, glow = 0}) => (
	<g>
		<defs>
			<radialGradient id={id} cx="0.36" cy="0.32" r="0.75">
				<stop offset="0" stopColor={light} />
				<stop offset="0.45" stopColor={base} />
				<stop offset="1" stopColor={dark} />
			</radialGradient>
		</defs>
		{glow > 0 && <circle r={r * 1.6} fill={base} opacity={0.35 * glow} style={{filter: `blur(${r * 0.5}px)`}} />}
		<circle r={r} fill={`url(#${id})`} />
		<ellipse cx={-r * 0.35} cy={-r * 0.4} rx={r * 0.26} ry={r * 0.16} fill="#fff" opacity={0.7} transform={`rotate(-30 ${-r * 0.35} ${-r * 0.4})`} />
	</g>
);

// ---------------------------------------------------------------- astronaut

export type Pose = {
	armL: [number, number];
	armR: [number, number];
	legL: [number, number];
	legR: [number, number];
	head?: number;
	mouth?: 'smile' | 'o' | 'flat';
	look?: [number, number];
};

export const POSE_FLOAT: Pose = {armL: [150, 40], armR: [30, -40], legL: [100, 15], legR: [80, -15], mouth: 'smile', look: [0.2, 0.3]};

const limb = (x: number, y: number, a1: number, l1: number, a2: number, l2: number) => {
	const r1 = (a1 * Math.PI) / 180;
	const ex = x + Math.cos(r1) * l1;
	const ey = y + Math.sin(r1) * l1;
	const r2 = ((a1 + a2) * Math.PI) / 180;
	const hx = ex + Math.cos(r2) * l2;
	const hy = ey + Math.sin(r2) * l2;
	return {d: `M${x},${y} Q${ex},${ey} ${hx},${hy}`, ex, ey, hx, hy};
};

/** Odd Atom astronaut, rebuilt: no outlines, shape-based shading, lit from upper-left. */
export const Astronaut: React.FC<{pose: Pose; f: number; id: string; glowSuit?: number}> = ({pose, f, id, glowSuit = 0}) => {
	const suit = '#f5f7fd';
	const shade = '#c3cbe6';
	const deep = '#8d97c4';
	const legs = [
		{a: pose.legR, x: 14, back: true},
		{a: pose.legL, x: -14, back: false},
	];
	const arms = [
		{a: pose.armR, x: 34, back: true},
		{a: pose.armL, x: -34, back: false},
	];
	const look = pose.look ?? [0, 0];
	const Limb: React.FC<{d: ReturnType<typeof limb>; w: number; back: boolean; end: string; endR: number}> = ({d, w, back, end, endR}) => (
		<g>
			<path d={d.d} stroke={back ? shade : suit} strokeWidth={w} strokeLinecap="round" fill="none" />
			{!back && <path d={d.d} stroke={shade} strokeWidth={w * 0.42} strokeLinecap="round" fill="none" transform={`translate(${w * 0.22} ${w * 0.18})`} opacity={0.9} />}
			<path d={d.d} stroke="#ff5470" strokeWidth={w * 0.98} strokeDasharray={`0 ${w * 1.5} ${w * 0.32} 999`} fill="none" opacity={back ? 0.6 : 1} />
			<circle cx={d.hx} cy={d.hy} r={endR} fill={end} />
			<circle cx={d.hx - endR * 0.3} cy={d.hy - endR * 0.3} r={endR * 0.4} fill="#fff" opacity={0.25} />
		</g>
	);
	return (
		<g>
			<defs>
				<radialGradient id={`${id}-glass`} cx="0.35" cy="0.3" r="0.8">
					<stop offset="0" stopColor="#3b5bb5" />
					<stop offset="0.6" stopColor="#1a2457" />
					<stop offset="1" stopColor="#0c1030" />
				</radialGradient>
				<clipPath id={`${id}-visor`}>
					<circle cx="0" cy="-118" r="47" />
				</clipPath>
			</defs>
			{glowSuit > 0 && <ellipse cx="0" cy="-60" rx="120" ry="150" fill="#ffb066" opacity={glowSuit * 0.5} style={{filter: 'blur(30px)'}} />}
			{/* back limbs */}
			{legs.filter((l) => l.back).map((l, i) => <Limb key={i} d={limb(l.x, 20, l.a[0], 46, l.a[1], 44)} w={30} back end="#5b6aa8" endR={17} />)}
			{arms.filter((l) => l.back).map((l, i) => <Limb key={i} d={limb(l.x, -48, l.a[0], 40, l.a[1], 38)} w={25} back end="#ff5470" endR={14} />)}
			{/* backpack */}
			<rect x="-46" y="-78" width="92" height="98" rx="26" fill={deep} />
			{/* torso */}
			<path d="M-40,-70 C-44,-30 -42,10 -32,30 L32,30 C42,10 44,-30 40,-70 C20,-82 -20,-82 -40,-70 Z" fill={suit} />
			<path d="M14,-74 C34,-70 42,-40 38,0 C36,18 32,28 26,30 L32,30 C42,10 44,-30 40,-70 Z" fill={shade} />
			<rect x="-38" y="-6" width="76" height="12" fill="#3f6bff" />
			<rect x="-36" y="18" width="72" height="9" rx="4" fill="#ff5470" />
			<rect x="-20" y="-50" width="34" height="26" rx="6" fill="#dfe5f5" />
			<circle cx="-11" cy="-42" r="4.5" fill="#ff5470" />
			<circle cx="1" cy="-42" r="4.5" fill="#ffc83d" />
			<rect x="-15" y="-34" width="22" height="5" rx="2.5" fill="#3f6bff" />
			{/* front limbs */}
			{legs.filter((l) => !l.back).map((l, i) => <Limb key={i} d={limb(l.x, 20, l.a[0], 46, l.a[1], 44)} w={32} back={false} end="#6b7bc0" endR={18} />)}
			{/* helmet */}
			<g transform={`rotate(${pose.head ?? 0} 0 -80)`}>
				<circle cx="0" cy="-118" r="60" fill={suit} />
				<path d="M20,-172 A60,60 0 0 1 20,-64 A56,56 0 0 0 20,-172 Z" fill={shade} />
				<circle cx="0" cy="-118" r="60" fill="none" stroke={shade} strokeWidth="6" />
				<circle cx="0" cy="-118" r="47" fill={`url(#${id}-glass)`} />
				<g clipPath={`url(#${id}-visor)`}>
					<g transform={`translate(${look[0] * 8} ${look[1] * 6})`}>
						<ellipse cx="0" cy="-108" rx="30" ry="33" fill="#f8c7a4" />
						<path d="M-34,-118 C-36,-152 -6,-160 14,-150 C30,-146 36,-130 32,-112 C24,-124 10,-130 -4,-128 C-14,-126 -26,-120 -34,-118 Z" fill="#17b3a3" />
						<path d="M-6,-150 C6,-156 22,-150 28,-138 C18,-142 6,-144 -6,-150 Z" fill="#6fe3d4" />
						<ellipse cx="-11" cy="-104" rx="4" ry={pose.mouth === 'o' ? 5.5 : 4.6} fill="#1b1838" />
						<ellipse cx="12" cy="-104" rx="4" ry={pose.mouth === 'o' ? 5.5 : 4.6} fill="#1b1838" />
						<circle cx="-18" cy="-94" r="5" fill="#ff7c8f" opacity="0.55" />
						<circle cx="19" cy="-94" r="5" fill="#ff7c8f" opacity="0.55" />
						{pose.mouth === 'o' ? (
							<ellipse cx="1" cy="-88" rx="4.5" ry="5.5" fill="#7a2240" />
						) : pose.mouth === 'flat' ? (
							<rect x="-5" y="-90" width="12" height="3" rx="1.5" fill="#7a2240" />
						) : (
							<path d="M-6,-91 Q1,-84 8,-91" stroke="#7a2240" strokeWidth="3" strokeLinecap="round" fill="none" />
						)}
					</g>
					{/* visor reflections */}
					<path d="M-38,-128 A40,40 0 0 1 -6,-160" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="7" strokeLinecap="round" fill="none" />
					<circle cx="20" cy="-150" r="5" fill="#fff" opacity="0.6" />
					<ellipse cx="20" cy="-90" rx="30" ry="12" fill="#ffb87a" opacity="0.12" />
				</g>
			</g>
			{arms.filter((l) => !l.back).map((l, i) => <Limb key={i} d={limb(l.x, -48, l.a[0], 40, l.a[1], 38)} w={26} back={false} end="#ff5470" endR={15} />)}
			{/* scarf of the Odd Atom astronaut */}
			<path d="M-30,-66 C-12,-58 12,-58 30,-66 L28,-56 C10,-48 -10,-48 -28,-56 Z" fill="#ff5470" />
			<path d="M10,-56 C14,-44 20,-34 30,-30 C26,-40 24,-50 22,-58 Z" fill="#e23d5c" transform={`rotate(${Math.sin(f / 14) * 8} 14 -56)`} />
		</g>
	);
};

// ---------------------------------------------------------------- text

/** Approved title treatment: heavy rounded type, several outline passes, offset shadow. */
export const Title: React.FC<{lines: {text: string; size: number; fill: string}[]; x: number; y: number; opacity?: number; scale?: number}> = ({lines, x, y, opacity = 1, scale = 1}) => {
	let yy = 0;
	return (
		<g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity} fontFamily="Nunito, sans-serif" fontWeight={1000} textAnchor="middle">
			{lines.map((l, i) => {
				yy += l.size * (i === 0 ? 0 : 1.02);
				const common = {x: 0, y: yy, fontSize: l.size, strokeLinejoin: 'round' as const, paintOrder: 'stroke' as const};
				return (
					<g key={i}>
						<text {...common} transform="translate(7 9)" fill="#0d0a2a" stroke="#0d0a2a" strokeWidth={l.size * 0.34}>{l.text}</text>
						<text {...common} fill="#1a1140" stroke="#1a1140" strokeWidth={l.size * 0.34}>{l.text}</text>
						<text {...common} fill="#ff8a3d" stroke="#ff8a3d" strokeWidth={l.size * 0.2}>{l.text}</text>
						<text {...common} fill={l.fill} stroke="#fff4e0" strokeWidth={l.size * 0.06}>{l.text}</text>
					</g>
				);
			})}
		</g>
	);
};

export type Cue = {start: number; end: number; text: string};

/** Plain narration caption with a thin dark edge, no panel. */
export const Caption: React.FC<{t: number; cues: Cue[]; y?: number}> = ({t, cues, y = 1420}) => {
	const c = cues.find((q) => t >= q.start && t < q.end);
	if (!c) return null;
	const age = t - c.start;
	const o = Math.min(1, age / 0.08);
	return (
		<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
			<text
				x={W / 2}
				y={y + (1 - o) * 6}
				opacity={o}
				textAnchor="middle"
				fontFamily="Nunito, sans-serif"
				fontWeight={900}
				fontSize={56}
				fill="#ffffff"
				stroke="#120c2e"
				strokeWidth={7}
				strokeLinejoin="round"
				paintOrder="stroke"
			>
				{c.text}
			</text>
		</svg>
	);
};
