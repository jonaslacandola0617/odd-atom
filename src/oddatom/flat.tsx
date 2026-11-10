// Odd Atom drawing kit v3: "flat cel" construction studied from the reference
// shorts and long-form frames (docs/style/drawing-study.md).
//   - every material = base fill + ONE hard-edged shadow shape in a darker,
//     more saturated version of the same hue (+ optional small highlight shape)
//   - no outlines, no gradients on objects; gradients only for skies and glows
//   - surfaces built from rounded blob/pill patches in 3-4 close tones
//   - a thin bright rim line on the limb, a soft glow only for emitters/atmospheres
//   - stars are dots plus small four-point sparkles in several colours
// All artwork is original procedural geometry.
import React from 'react';
import {random} from 'remotion';
import {Pose} from './kit';

const D = Math.PI / 180;
export const ldir = (deg: number) => ({x: Math.cos(deg * D), y: Math.sin(deg * D)});

/** Rect with a circular hole: used for hard terminator shadows (evenodd). */
const holed = (R: number, cx: number, cy: number, r: number) =>
	`M${-R},${-R} H${R} V${R} H${-R} Z M${cx + r},${cy} A${r},${r} 0 1 0 ${cx - r},${cy} A${r},${r} 0 1 0 ${cx + r},${cy} Z`;

export const sparkle = (s: number) =>
	`M0,${-s} C${s * 0.12},${-s * 0.12} ${s * 0.12},${-s * 0.12} ${s},0 C${s * 0.12},${s * 0.12} ${s * 0.12},${s * 0.12} 0,${s} C${-s * 0.12},${s * 0.12} ${-s * 0.12},${s * 0.12} ${-s},0 C${-s * 0.12},${-s * 0.12} ${-s * 0.12},${-s * 0.12} 0,${-s} Z`;

// ------------------------------------------------------------------ sky

export const FlatStars: React.FC<{f: number; seed: string; w: number; h: number; count?: number; ox?: number; oy?: number; streak?: number}> = ({f, seed, w, h, count = 140, ox = 0, oy = 0, streak = 0}) => {
	const cols = ['#ffffff', '#ffffff', '#9fe8ff', '#ff9fd8', '#ffe39a'];
	return (
		<g>
			{new Array(count).fill(0).map((_, i) => {
				const x = ((((random(`${seed}x${i}`) * w + ox) % w) + w) % w);
				const y = ((((random(`${seed}y${i}`) * h + oy) % h) + h) % h);
				const kind = random(`${seed}k${i}`);
				const c = cols[Math.floor(random(`${seed}c${i}`) * cols.length)];
				const tw = 0.6 + 0.4 * Math.sin(f / (8 + random(`${seed}t${i}`) * 18) + i * 1.7);
				if (streak > 1) return <line key={i} x1={x} y1={y} x2={x} y2={y + streak * (0.4 + kind)} stroke={c} strokeWidth={2 + kind * 2} strokeLinecap="round" opacity={0.7} />;
				if (kind > 0.93) return <path key={i} d={sparkle(7 + kind * 6)} transform={`translate(${x} ${y}) scale(${tw})`} fill={c} />;
				return <circle key={i} cx={x} cy={y} r={kind > 0.75 ? 2.6 : 1.4} fill={c} opacity={(0.35 + kind * 0.65) * tw} />;
			})}
		</g>
	);
};

// ------------------------------------------------------------------ sphere

/** Flat-shaded ball: base, hard shadow crescent, highlight chip, thin rim. */
export const FlatBall: React.FC<{id: string; r: number; base: string; shade: string; hi: string; light?: number; rim?: string}> = ({id, r, base, shade, hi, light = -135, rim}) => {
	const L = ldir(light);
	return (
		<g>
			<defs>
				<clipPath id={id}>
					<circle r={r} />
				</clipPath>
			</defs>
			<circle r={r} fill={base} />
			<g clipPath={`url(#${id})`}>
				<path d={holed(r * 2, L.x * r * 0.38, L.y * r * 0.38, r * 1.02)} fill={shade} fillRule="evenodd" />
				{rim && <circle r={r * 0.97} fill="none" stroke={rim} strokeWidth={r * 0.07} strokeDasharray={`${r * 1.6} ${r * 9}`} transform={`rotate(${light + 180 - 45})`} />}
			</g>
			<ellipse cx={L.x * r * 0.42} cy={L.y * r * 0.42} rx={r * 0.26} ry={r * 0.15} fill={hi} transform={`rotate(${light + 90} ${L.x * r * 0.42} ${L.y * r * 0.42})`} />
		</g>
	);
};

// ------------------------------------------------------------------ gas giant

const TILT = 0.28;
const latY = (r: number, v: number, x: number) => {
	const vv = Math.max(-0.999, Math.min(0.999, v));
	const c = Math.sqrt(1 - vv * vv);
	const q = Math.min(1, Math.abs(x) / (r * c));
	return r * (vv * Math.cos(TILT) + c * Math.sin(TILT) * Math.sqrt(1 - q * q));
};
const bandPath = (r: number, v0: number, v1: number, ph = 0) => {
	const n = 40;
	const wv = (x: number, v: number) => (Math.abs(v) > 0.99 ? 0 : r * 0.012 * Math.sin((x / r) * 7 + v * 13 + ph) + r * 0.006 * Math.sin((x / r) * 17 - v * 7 + ph * 1.6));
	const top: string[] = [];
	const bot: string[] = [];
	for (let i = 0; i <= n; i++) {
		const x = -r * 1.02 + (2.04 * r * i) / n;
		top.push(`${x.toFixed(1)},${(latY(r, v0, x) + wv(x, v0)).toFixed(1)}`);
		bot.push(`${x.toFixed(1)},${(latY(r, v1, x) + wv(x, v1)).toFixed(1)}`);
	}
	return `M${top.join(' L')} L${bot.reverse().join(' L')} Z`;
};

/** A rounded pill lying on a latitude line, positioned in longitude so it rotates with the planet. */
const Pill: React.FC<{r: number; lon: number; v: number; len: number; th: number; fill: string}> = ({r, lon, v, len, th, fill}) => {
	const c = Math.cos(lon);
	if (c < 0.05) return null;
	const cl = Math.sqrt(1 - Math.min(0.98, v * v));
	const x = r * Math.sin(lon) * cl;
	const y = r * (v * Math.cos(TILT) + cl * Math.sin(TILT) * c);
	const w = len * r * c;
	const h = th * r;
	const slope = (latY(r, v, x + 2) - latY(r, v, x - 2)) / 4;
	return <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={Math.min(h / 2, w / 2)} fill={fill} transform={`rotate(${(Math.atan(slope) * 180) / Math.PI} ${x} ${y})`} />;
};

export type GiantStyle = {
	bands: {v0: number; v1: number; c: string}[];
	pills: {v: number; c: string; th: number}[];
	accents: [string, string];
	shade: string;
	rimNight: string;
	rimDay: string;
	halo: string;
};

export const JUPITER_FLAT: GiantStyle = {
	bands: [
		{v0: -1, v1: -0.74, c: '#a8697a'},
		{v0: -0.74, v1: -0.56, c: '#f2c38a'},
		{v0: -0.56, v1: -0.42, c: '#e2844d'},
		{v0: -0.42, v1: -0.24, c: '#fde2b8'},
		{v0: -0.24, v1: -0.1, c: '#f0a465'},
		{v0: -0.1, v1: 0.08, c: '#fff0d6'},
		{v0: 0.08, v1: 0.2, c: '#d8643a'},
		{v0: 0.2, v1: 0.36, c: '#f7cf98'},
		{v0: 0.36, v1: 0.52, c: '#e79558'},
		{v0: 0.52, v1: 0.72, c: '#f4d3a4'},
		{v0: 0.72, v1: 1, c: '#b77079'},
	],
	pills: [
		{v: -0.74, c: '#e9b07d', th: 0.07},
		{v: -0.56, c: '#f6c992', th: 0.06},
		{v: -0.42, c: '#f6c99a', th: 0.07},
		{v: -0.24, c: '#ffd7a8', th: 0.06},
		{v: -0.1, c: '#f8c486', th: 0.06},
		{v: 0.08, c: '#ffe4c2', th: 0.07},
		{v: 0.2, c: '#ec8a52', th: 0.06},
		{v: 0.36, c: '#fbd8a8', th: 0.07},
		{v: 0.52, c: '#eba066', th: 0.06},
		{v: 0.72, c: '#d99a8a', th: 0.08},
	],
	accents: ['#fff4de', '#c4553a'],
	shade: '#3a1d5c',
	rimNight: '#ff8f5c',
	rimDay: '#fff5df',
	halo: '#ffb070',
};

export const FlatGiant: React.FC<{id: string; r: number; f: number; light: number; style?: GiantStyle; spin?: number; lit?: number; cutaway?: number; redSpot?: boolean}> = ({
	id,
	r,
	f,
	light,
	style = JUPITER_FLAT,
	spin = 0.006,
	lit = 0.55,
	cutaway = 0,
	redSpot = true,
}) => {
	const L = ldir(light);
	const off = r * (1 - lit) * 1.5;
	const rot = f * spin;
	const shadowPath = holed(r * 2, L.x * off, L.y * off, r * 1.04);
	const pills = style.pills.flatMap((p, i) =>
		new Array(9).fill(0).map((_, k) => {
			const q = random(`${id}q${i}${k}`);
			return {
				...p,
				key: `${i}-${k}`,
				lon: -Math.PI + (k / 9) * 2 * Math.PI + random(`${id}l${i}${k}`) * 0.5 + rot,
				len: 0.08 + random(`${id}n${i}${k}`) ** 1.5 * 0.5,
				th: p.th * (0.45 + random(`${id}t${i}${k}`) * 1.0),
				v: p.v + (random(`${id}v${i}${k}`) - 0.5) * 0.06,
				c: q > 0.82 ? style.accents[0] : q > 0.68 ? style.accents[1] : p.c,
			};
		}),
	);
	const wrap = (a: number) => ((((a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
	const spotLon = wrap(-0.45 + rot);
	const sc = Math.cos(spotLon);
	const sv = 0.28;
	const scl = Math.sqrt(1 - sv * sv);
	const sx = r * Math.sin(spotLon) * scl;
	const sy = r * (sv * Math.cos(TILT) + scl * Math.sin(TILT) * sc);
	const a0 = -15;
	const a1 = a0 + 95 * cutaway;
	const pt = (a: number, rr: number) => `${(rr * Math.cos(a * D)).toFixed(1)},${(rr * Math.sin(a * D)).toFixed(1)}`;
	const wedge = `M0,0 L${pt(a0, r * 1.001)} A${r},${r} 0 0 1 ${pt(a1, r * 1.001)} Z`;
	const layers = [
		{rr: 1, c: '#f3c78f'},
		{rr: 0.94, c: '#9fc0ff'},
		{rr: 0.8, c: '#6f8df2'},
		{rr: 0.62, c: '#4a4fc9'},
		{rr: 0.4, c: '#3a2c8f'},
		{rr: 0.2, c: '#ff8a4c'},
		{rr: 0.12, c: '#ffd27a'},
	];
	return (
		<g>
			<defs>
				<clipPath id={`${id}-c`}>
					<circle r={r} />
				</clipPath>
				<clipPath id={`${id}-night`}>
					<path d={shadowPath} clipRule="evenodd" />
				</clipPath>
				<clipPath id={`${id}-w`}>
					<path d={wedge} />
				</clipPath>
			</defs>
			{/* atmosphere glow: the only soft element */}
			<circle r={r * 1.03} fill={style.halo} opacity={0.35} style={{filter: `blur(${r * 0.06}px)`}} />
			<g clipPath={`url(#${id}-c)`}>
				{style.bands.map((b, i) => (
					<path key={i} d={bandPath(r, b.v0, b.v1, rot * 3)} fill={b.c} />
				))}
				{pills.map((p) => (
					<Pill key={p.key} r={r} lon={wrap(p.lon)} v={p.v} len={p.len} th={p.th} fill={p.c} />
				))}
				{redSpot && sc > 0.05 && (
					<g transform={`translate(${sx} ${sy}) scale(${sc} 1)`}>
						<ellipse rx={r * 0.2} ry={r * 0.1} fill="#fde2b8" />
						<ellipse rx={r * 0.16} ry={r * 0.078} fill="#e0603a" />
						<ellipse rx={r * 0.11} ry={r * 0.052} cx={r * 0.012} cy={r * 0.008} fill="#b8402e" />
						<ellipse rx={r * 0.05} ry={r * 0.022} cx={-r * 0.03} cy={-r * 0.02} fill="#f08a5c" />
					</g>
				)}
				{/* thin day-side rim highlight */}
				<circle r={r * 0.988} fill="none" stroke={style.rimDay} strokeWidth={r * 0.016} opacity={0.85} />
				{/* hard terminator shadow */}
				<path d={shadowPath} fill={style.shade} fillRule="evenodd" opacity={0.58} />
				<g clipPath={`url(#${id}-night)`}>
					<circle r={r * 0.99} fill="none" stroke={style.rimNight} strokeWidth={r * 0.02} />
				</g>
			</g>
			{cutaway > 0.001 && (
				<g>
					<g clipPath={`url(#${id}-w)`}>
						{layers.map((l, i) => (
							<circle key={i} r={r * l.rr} fill={l.c} />
						))}
						{/* thin bright edges between layers read as cut surfaces */}
						{layers.slice(1).map((l, i) => (
							<circle key={`e${i}`} r={r * l.rr} fill="none" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={r * 0.006} />
						))}
						{/* the wedge's far wall is in shadow: a hard darker band along one cut edge */}
						<path d={`M0,0 L${pt(a0, r * 1.1)} L${pt(a0 + 9, r * 1.1)} Z`} fill={style.shade} opacity={0.35} />
					</g>
					<circle r={r * 0.2} fill="#ffb060" opacity={0.5 * cutaway} style={{filter: `blur(${r * 0.06}px)`}} />
				</g>
			)}
		</g>
	);
};

// ------------------------------------------------------------------ astronaut

const P = {
	suit: '#f6f4ff',
	suitS: '#c3c0ea',
	suitD: '#9d98d6',
	glove: '#ff4f7b',
	gloveS: '#d42e62',
	boot: '#6b62e0',
	bootS: '#4a3fb8',
	visor: '#2b1f74',
	visorS: '#1b1450',
	skin: '#ffb78c',
	skinS: '#f08d68',
	hair: '#16c2ad',
	hairS: '#0c8f8c',
	stripe: '#4f7bff',
	scarf: '#ff4f7b',
	scarfS: '#d42e62',
};

const seg = (x: number, y: number, a1: number, l1: number, a2: number, l2: number) => {
	const ex = x + Math.cos(a1 * D) * l1;
	const ey = y + Math.sin(a1 * D) * l1;
	const hx = ex + Math.cos((a1 + a2) * D) * l2;
	const hy = ey + Math.sin((a1 + a2) * D) * l2;
	return {d: `M${x},${y} Q${ex},${ey} ${hx},${hy}`, hx, hy, ang: a1 + a2};
};

/** A puffy limb with hard shading: dark tube, lighter tube nudged toward the light, cuff and mitt/boot. */
const PuffLimb: React.FC<{s: ReturnType<typeof seg>; w: number; base: string; shade: string; end: 'glove' | 'boot'; back?: boolean}> = ({s, w, base, shade, end, back}) => (
	<g opacity={back ? 1 : 1}>
		<path d={s.d} stroke={shade} strokeWidth={w} strokeLinecap="round" fill="none" />
		<path d={s.d} stroke={base} strokeWidth={w * 0.72} strokeLinecap="round" fill="none" transform={`translate(${-w * 0.12} ${-w * 0.12})`} />
		{end === 'glove' ? (
			<g transform={`translate(${s.hx} ${s.hy}) rotate(${s.ang - 90})`}>
				<rect x={-w * 0.62} y={-w * 0.25} width={w * 1.24} height={w * 0.34} rx={w * 0.17} fill={P.stripe} />
				<ellipse cx={0} cy={w * 0.45} rx={w * 0.62} ry={w * 0.55} fill={P.gloveS} />
				<ellipse cx={-w * 0.08} cy={w * 0.38} rx={w * 0.5} ry={w * 0.44} fill={P.glove} />
				<ellipse cx={w * 0.55} cy={w * 0.25} rx={w * 0.2} ry={w * 0.28} fill={P.glove} />
			</g>
		) : (
			<g transform={`translate(${s.hx} ${s.hy}) rotate(${s.ang - 90})`}>
				<rect x={-w * 0.62} y={-w * 0.3} width={w * 1.24} height={w * 0.36} rx={w * 0.18} fill={P.stripe} />
				<rect x={-w * 0.66} y={0} width={w * 1.4} height={w * 0.86} rx={w * 0.36} fill={P.bootS} />
				<rect x={-w * 0.66} y={-w * 0.02} width={w * 1.22} height={w * 0.7} rx={w * 0.32} fill={P.boot} />
			</g>
		)}
	</g>
);

export const FlatAstronaut: React.FC<{pose: Pose; f: number; id: string; heat?: number}> = ({pose, f, id, heat = 0}) => {
	const look = pose.look ?? [0, 0];
	const blink = (f % 97) < 3;
	const eyeH = pose.mouth === 'o' ? 9 : blink ? 1.5 : 7.5;
	const arm = (a: [number, number], x: number) => seg(x, -38, a[0], 34, a[1], 32);
	const leg = (a: [number, number], x: number) => seg(x, 26, a[0], 34, a[1], 30);
	return (
		<g>
			<defs>
				<clipPath id={`${id}-v`}>
					<ellipse cx={0} cy={-112} rx={46} ry={42} />
				</clipPath>
				<clipPath id={`${id}-h`}>
					<circle cx={0} cy={-112} r={62} />
				</clipPath>
				<clipPath id={`${id}-t`}>
					<path d="M-38,-58 C-46,-20 -42,14 -30,34 C-10,44 10,44 30,34 C42,14 46,-20 38,-58 C18,-70 -18,-70 -38,-58 Z" />
				</clipPath>
			</defs>
			{heat > 0 && <ellipse cx={0} cy={-60} rx={110} ry={150} fill="#ff9b4a" opacity={heat * 0.45} style={{filter: 'blur(24px)'}} />}
			{/* backpack */}
			<rect x={-50} y={-70} width={100} height={102} rx={30} fill={P.suitD} />
			<rect x={-50} y={-70} width={86} height={88} rx={28} fill={P.suitS} />
			{/* back limbs */}
			<PuffLimb s={leg(pose.legR, 14)} w={34} base={P.suitS} shade={P.suitD} end="boot" back />
			<PuffLimb s={arm(pose.armR, 30)} w={28} base={P.suitS} shade={P.suitD} end="glove" back />
			{/* torso: shadow body + lit body nudged toward the light, clipped */}
			<path d="M-38,-58 C-46,-20 -42,14 -30,34 C-10,44 10,44 30,34 C42,14 46,-20 38,-58 C18,-70 -18,-70 -38,-58 Z" fill={P.suitS} />
			<g clipPath={`url(#${id}-t)`}>
				<path d="M-38,-58 C-46,-20 -42,14 -30,34 C-10,44 10,44 22,34 C28,10 30,-24 26,-62 C10,-70 -18,-70 -38,-58 Z" fill={P.suit} />
				<rect x={-50} y={4} width={100} height={11} fill={P.stripe} />
				<rect x={-50} y={24} width={100} height={8} fill={P.scarf} />
				<rect x={-20} y={-40} width={30} height={24} rx={7} fill="#e3e0fb" />
				<circle cx={-11} cy={-28} r={4.5} fill={P.glove} />
				<circle cx={1} cy={-28} r={4.5} fill="#ffc83d" />
				<ellipse cx={-26} cy={-44} rx={6} ry={12} fill="#ffffff" opacity={0.9} />
			</g>
			<PuffLimb s={leg(pose.legL, -14)} w={36} base={P.suit} shade={P.suitS} end="boot" />
			{/* helmet */}
			<g transform={`rotate(${pose.head ?? 0} 0 -70)`}>
				<circle cx={0} cy={-112} r={62} fill={P.suitS} />
				<circle cx={-5} cy={-117} r={57} fill={P.suit} />
				<g clipPath={`url(#${id}-h)`}>
					<circle cx={30} cy={-80} r={20} fill={P.suitS} opacity={0.6} />
				</g>
				{/* warm bounce from the planet below: thin hard rim on the lower edge */}
				<g clipPath={`url(#${id}-h)`}>
					<circle cx={-8} cy={-124} r={62} fill="none" stroke="#ffb07a" strokeWidth={10} opacity={0.0} />
				</g>
				<path d="M44,-80 A62,62 0 0 1 -30,-58" stroke="#ffad78" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.85} />
				<ellipse cx={0} cy={-112} rx={46} ry={42} fill={P.visorS} />
				<g clipPath={`url(#${id}-v)`}>
					<ellipse cx={-3} cy={-115} rx={44} ry={40} fill={P.visor} />
					<g transform={`translate(${look[0] * 7} ${look[1] * 5})`}>
						{/* face: base + hard shadow, big hair masses in two tones */}
						<ellipse cx={0} cy={-104} rx={31} ry={30} fill={P.skinS} />
						<ellipse cx={-3} cy={-106} rx={28} ry={28} fill={P.skin} />
						<path d="M-38,-108 C-42,-146 -10,-160 16,-152 C36,-146 42,-126 36,-104 C30,-120 16,-128 2,-130 C-10,-128 -24,-122 -38,-108 Z" fill={P.hairS} />
						<path d="M-36,-114 C-38,-142 -12,-154 10,-148 C28,-142 34,-130 32,-116 C28,-124 22,-126 18,-122 C14,-130 6,-132 0,-126 C-6,-134 -16,-134 -20,-124 C-26,-126 -32,-122 -36,-114 Z" fill={P.hair} />
						<path d="M-14,-146 C-4,-152 10,-150 18,-144 C8,-146 -2,-146 -14,-146 Z" fill="#7ff0e0" />
						<rect x={-20} y={-122} width={14} height={5} rx={2.5} fill={P.hairS} transform={`rotate(${pose.mouth === 'o' ? -10 : -4} -13 -120)`} />
						<rect x={6} y={-122} width={14} height={5} rx={2.5} fill={P.hairS} transform={`rotate(${pose.mouth === 'o' ? 10 : 4} 13 -120)`} />
						<ellipse cx={-12} cy={-106} rx={4.6} ry={eyeH / 2 + 2} fill="#20154a" />
						<ellipse cx={12} cy={-106} rx={4.6} ry={eyeH / 2 + 2} fill="#20154a" />
						<ellipse cx={-21} cy={-94} rx={6} ry={4} fill="#ff7d96" />
						<ellipse cx={20} cy={-94} rx={6} ry={4} fill="#ff7d96" />
						<ellipse cx={2} cy={-97} rx={3.5} ry={3} fill={P.skinS} />
						{pose.mouth === 'o' ? (
							<ellipse cx={1} cy={-86} rx={5} ry={6.5} fill="#8a1f45" />
						) : pose.mouth === 'flat' ? (
							<rect x={-6} y={-88} width={14} height={4} rx={2} fill="#8a1f45" />
						) : (
							<path d="M-7,-89 Q1,-80 9,-89 Z" fill="#8a1f45" />
						)}
					</g>
					{/* visor reflection: hard-edged crescent + chip */}
					<path d="M-44,-118 C-42,-146 -16,-160 10,-156 C-12,-150 -30,-138 -36,-112 Z" fill="#ffffff" opacity={0.42} />
					<ellipse cx={24} cy={-142} rx={6} ry={4} fill="#ffffff" opacity={0.55} />
				</g>
			</g>
			{/* scarf */}
			<path d="M-32,-60 C-12,-50 12,-50 32,-60 L30,-48 C10,-40 -10,-40 -30,-48 Z" fill={P.scarfS} />
			<path d="M-32,-62 C-12,-53 12,-53 32,-62 L30,-54 C10,-46 -10,-46 -30,-54 Z" fill={P.scarf} />
			<g transform={`rotate(${Math.sin(f / 12) * 9} 14 -50)`}>
				<path d="M8,-50 C12,-36 18,-26 30,-22 C26,-34 24,-44 22,-52 Z" fill={P.scarfS} />
			</g>
			<PuffLimb s={arm(pose.armL, -30)} w={30} base={P.suit} shade={P.suitS} end="glove" />
		</g>
	);
};

// ------------------------------------------------------------------ clouds

/** One cloud bank: shadow mass, lit mass nudged up-left, highlight lobes. Hard edges throughout. */
export const FlatCloudBank: React.FC<{seed: string; y: number; base: string; shade: string; hi: string; w: number; n?: number; scale?: number}> = ({seed, y, base, shade, hi, w, n = 7, scale = 1}) => {
	const puffs = new Array(n).fill(0).map((_, i) => ({x: -80 + (i * (w + 160)) / (n - 1) + (random(`${seed}${i}`) - 0.5) * 60, r: (110 + random(`${seed}r${i}`) * 90) * scale}));
	return (
		<g transform={`translate(0 ${y})`}>
			{puffs.map((p, i) => <circle key={`s${i}`} cx={p.x + 16} cy={14} r={p.r} fill={shade} />)}
			<rect x={-60} y={14} width={w + 120} height={900} fill={shade} />
			{puffs.map((p, i) => <circle key={`b${i}`} cx={p.x} cy={0} r={p.r * 0.94} fill={base} />)}
			<rect x={-60} y={10} width={w + 120} height={80 * scale} fill={base} />
			{puffs.map((p, i) => <ellipse key={`h${i}`} cx={p.x - p.r * 0.25} cy={-p.r * 0.5} rx={p.r * 0.42} ry={p.r * 0.2} fill={hi} />)}
			{/* second, lower row of bumps inside the shaded body gives the bank volume */}
			{puffs.map((p, i) => <circle key={`l${i}`} cx={p.x + 70} cy={p.r * 1.2} r={p.r * 0.62} fill={base} opacity={0.32} />)}
			{puffs.map((p, i) => <circle key={`m${i}`} cx={p.x + 92} cy={p.r * 1.32} r={p.r * 0.6} fill={shade} />)}
		</g>
	);
};
