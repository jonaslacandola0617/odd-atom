import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Astronaut, Bird} from './Characters';
import {Earth} from './Earth';

const C = {ink: '#100B33', cream: '#FFF9E7', mint: '#6FFFD5', yellow: '#EFFF83', coral: '#FF7E9E', violet: '#5226BF'};
const ease = (x: number) => {const a = Math.max(0, Math.min(1, x)); return a * a * (3 - 2 * a);};
const progress = (frame: number, start: number, end: number) => ease((frame - start) / (end - start));
const lerp = (a: number, b: number, v: number) => a + (b - a) * v;
const pop = (frame: number, start: number) => spring({frame: frame - start, fps: 30, config: {damping: 16, stiffness: 190, mass: 0.85}});

const stars = Array.from({length: 100}, (_, i) => ({x: ((i * 337.37 + 17) % 1060) + 10, y: (i * 581.63 + 137) % 1910, r: 1 + (i % 4) * 0.6, phase: i * 1.7}));

const Title: React.FC<{frame: number; start: number; lines: string[]; colors?: string[]; sizes?: number[]; y?: number}> = ({frame, start, lines, colors = [C.cream, C.yellow], sizes = [108, 112], y = 235}) => (
  <g>
    {lines.map((line, i) => {
      const p = pop(frame, start + i * 3);
      const baseline = y + Array.from({length: i}, (_, j) => (sizes[j + 1] ?? sizes[0]) + 14).reduce((a, b) => a + b, 0);
      return <g key={line} opacity={Math.min(1, p * 1.3)} transform={`translate(540 ${baseline + (1 - p) * 50}) scale(${lerp(0.87, 1, p)})`}>
        <text textAnchor="middle" fill={colors[i % colors.length]} fontWeight={850} fontSize={sizes[i] ?? sizes[0]} letterSpacing="-3">{line}</text>
      </g>;
    })}
  </g>
);

const OrbitArrow: React.FC<{x: number; y: number; angle: number; length: number; color: string; direction: 'down' | 'right'; opacity: number}> = ({x, y, angle, length, color, direction, opacity}) => (
  <g transform={`translate(${x} ${y}) rotate(${angle})`} opacity={opacity}>
    {direction === 'down' ? <g>
      <path d={`M0 50V${length}`} fill="none" stroke={C.ink} strokeWidth="18" strokeLinecap="round" />
      <path d={`M0 50V${length}`} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <path d={`M-16 ${length - 20} 0 ${length} 16 ${length - 20}`} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </g> : <g>
      <path d={`M50 -20H${length}`} fill="none" stroke={C.ink} strokeWidth="18" strokeLinecap="round" />
      <path d={`M50 -20H${length}`} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <path d={`M${length - 20} -36 ${length} -20 ${length - 20} -4`} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </g>}
  </g>
);

const ControlBird: React.FC<{frame: number; visible: number}> = ({frame, visible}) => (
  <g transform={`translate(170 ${1400 + (1 - visible) * 120}) scale(${visible})`} opacity={Math.min(1, visible)}>
    <defs><clipPath id="porthole"><circle r="116" /></clipPath><linearGradient id="glass" x2="1" y2="1"><stop stopColor="#6FFFD5" stopOpacity=".24" /><stop offset="1" stopColor="#6FFFD5" stopOpacity=".01" /></linearGradient></defs>
    <circle r="131" fill="#332568" stroke="#9A87D4" strokeWidth="4" />
    <circle r="118" fill="#181241" stroke="#6FFFD5" strokeOpacity=".5" strokeWidth="3" />
    <g clipPath="url(#porthole)">
      <foreignObject x="-88" y="-110" width="176" height="243"><Bird frame={frame} /></foreignObject>
      <circle r="115" fill="url(#glass)" />
      <path d="M-80-65Q-40-104 8-102" fill="none" stroke="#FFF9E7" strokeWidth="10" strokeLinecap="round" opacity=".6" />
    </g>
    {[0, 1, 2, 3].map(i => <circle key={i} cx={Math.cos(i * Math.PI / 2 + .7) * 126} cy={Math.sin(i * Math.PI / 2 + .7) * 126} r="4" fill="#FFF9E7" />)}
    <rect x="-91" y="132" width="182" height="35" rx="17" fill="#6FFFD5" />
    <text y="156" textAnchor="middle" fontSize="18" fontWeight="750" letterSpacing="1.3" fill={C.ink}>GROUND CONTROL</text>
  </g>
);

const captions = [
  {start: 4, end: 66, lines: ["Why don't astronauts fall?"]},
  {start: 75, end: 102, lines: ['They do.']},
  {start: 108, end: 172, lines: ['Gravity still pulls them down.']},
  {start: 178, end: 229, lines: ['But they move sideways so fast,']},
  {start: 230, end: 297, lines: ['they keep missing Earth.']},
  {start: 307, end: 359, lines: ["That's an orbit."]},
];

export const Orbit: React.FC = () => {
  const frame = useCurrentFrame();
  const [fontHandle] = useState(() => delayRender('Load locally bundled Outfit font'));
  useEffect(() => {
    const face = new FontFace('Outfit', `url(${staticFile('assets/fonts/Outfit.ttf')})`, {weight: '100 900'});
    face.load().then(loaded => {document.fonts.add(loaded); continueRender(fontHandle);}).catch(error => {throw error;});
  }, [fontHandle]);

  const reveal = progress(frame, 96, 139);
  const theta = lerp(-115, 239, progress(frame, 135, 360)) * Math.PI / 180;
  const orbitRadius = 385;
  const cx = 540, cy = 1080;
  const ox = cx + Math.cos(theta) * orbitRadius;
  const oy = cy + Math.sin(theta) * orbitRadius;
  const heroX = 575 + Math.sin(frame / 37) * 20;
  const heroY = 1042 - frame * .62 + Math.sin(frame / 18) * 9;
  const astronautX = lerp(heroX, ox, reveal);
  const astronautY = lerp(heroY, oy, reveal);
  const astronautWidth = lerp(575, 170, reveal);
  const astronautHeight = astronautWidth * 1300 / 900;
  const rotation = lerp(-12 + frame * .22 + Math.sin(frame / 24) * 3, theta * 180 / Math.PI + 90, reveal);
  const expression = frame < 75 ? 'surprised' : frame < 110 ? 'worried' : frame > 307 ? 'happy' : 'neutral';
  const ringAlpha = progress(frame, 121, 145);
  const speedAlpha = progress(frame, 177, 195);
  const caption = captions.find(c => frame >= c.start && frame <= c.end);
  const birdVisibility = (1 - progress(frame, 94, 112)) * pop(frame, 10) + progress(frame, 304, 325);
  const trailLength = Math.max(0, Math.min(2 * Math.PI * orbitRadius, (theta + 115 * Math.PI / 180) * orbitRadius));
  const final = progress(frame, 307, 324);

  return (
    <AbsoluteFill style={{background: C.ink, fontFamily: 'Outfit, sans-serif'}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <defs>
          <radialGradient id="space"><stop stopColor="#3D2089" /><stop offset=".58" stopColor="#21104F" /><stop offset="1" stopColor="#0B0D2D" /></radialGradient>
          <radialGradient id="nebula"><stop stopColor="#8044EC" stopOpacity=".32" /><stop offset="1" stopColor="#8044EC" stopOpacity="0" /></radialGradient>
          <linearGradient id="caption-shade" x1="0" x2="0" y1="0" y2="1"><stop stopColor={C.ink} stopOpacity="0" /><stop offset=".5" stopColor={C.ink} stopOpacity=".75" /><stop offset="1" stopColor={C.ink} stopOpacity=".98" /></linearGradient>
          <linearGradient id="horizon" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#6FFFD5" /><stop offset=".13" stopColor="#3F84D5" /><stop offset="1" stopColor="#36167B" /></linearGradient>
          <linearGradient id="orbit-line"><stop stopColor={C.yellow} /><stop offset="1" stopColor={C.mint} /></linearGradient>
        </defs>
        <rect width="1080" height="1920" fill="url(#space)" />
        <ellipse cx={180 + frame * .13} cy="900" rx="690" ry="1030" fill="url(#nebula)" />
        <ellipse cx="1000" cy="1700" rx="640" ry="700" fill="url(#nebula)" opacity=".6" />
        <g opacity=".14" stroke="#8A6BD1" fill="none" strokeWidth="1">
          <circle cx="540" cy="1080" r="600" /><circle cx="540" cy="1080" r="800" /><circle cx="540" cy="1080" r="1030" />
        </g>
        {stars.map((s, i) => <g key={i} opacity={.3 + (Math.sin(frame / 22 + s.phase) + 1) * .22}>
          <circle cx={s.x} cy={s.y + Math.sin(frame / 90 + i) * 3} r={s.r} fill={i % 4 ? '#A5A3F2' : '#F6F1D9'} />
          {i % 19 === 0 && <path d={`M${s.x - 6} ${s.y}h12M${s.x} ${s.y - 6}v12`} stroke="#CFFFEF" strokeWidth="1.5" />}
        </g>)}

        {/* The opening horizon recedes into a complete planet in one camera move. */}
        <g opacity={1 - reveal}>
          <circle cx="540" cy="2647" r="1063" fill="#69E9E3" opacity=".13" />
          <circle cx="540" cy="2647" r="1047" fill="url(#horizon)" stroke="#8FFFF3" strokeWidth="5" />
          <path d="M-50 1765Q435 1625 1130 1810" stroke="#A1FFE4" strokeWidth="16" strokeLinecap="round" opacity=".12" fill="none" />
        </g>

        <g opacity={reveal}>
          <circle cx={cx} cy={cy} r={orbitRadius} fill="none" stroke="#B8A2FF" strokeOpacity=".22" strokeWidth="3" strokeDasharray="6 13" opacity={ringAlpha} />
          <circle cx={cx} cy={cy} r={orbitRadius} fill="none" stroke="url(#orbit-line)" strokeOpacity=".12" strokeWidth="30" strokeDasharray={`${trailLength} ${2 * Math.PI * orbitRadius}`} transform={`rotate(-115 ${cx} ${cy})`} />
          <circle cx={cx} cy={cy} r={orbitRadius} fill="none" stroke="url(#orbit-line)" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${trailLength} ${2 * Math.PI * orbitRadius}`} transform={`rotate(-115 ${cx} ${cy})`} />
          <foreignObject x="190" y="730" width="700" height="700"><Earth frame={frame} /></foreignObject>
          <text x="540" y="1112" fontSize="37" letterSpacing="10" fontWeight="800" fill="#E4FFF3" opacity=".85" textAnchor="middle">EARTH</text>
          {Array.from({length: 4}, (_, i) => {
            const angle = theta - (.17 + i * .12);
            return <circle key={i} cx={cx + Math.cos(angle) * orbitRadius} cy={cy + Math.sin(angle) * orbitRadius} r={5 - i * .6} fill={C.yellow} opacity={speedAlpha * (1 - i * .2)} />;
          })}
        </g>

        <g opacity={1 - progress(frame, 67, 74)}>
          <Title frame={frame} start={0} lines={["WHY DON'T", 'ASTRONAUTS', 'FALL?']} sizes={[87, 97, 160]} y={233} colors={[C.cream, C.cream, C.yellow]} />
          <path d="M364 559Q540 578 716 550" stroke={C.yellow} strokeWidth="9" strokeLinecap="round" fill="none" opacity={progress(frame, 20, 34)} />
        </g>
        {frame >= 75 && frame < 108 && <g>
          <g transform="translate(540 350)" opacity={1 - progress(frame, 101, 109)}>
            {Array.from({length: 12}, (_, i) => <path key={i} d={`M${Math.cos(i * Math.PI / 6) * 250} ${Math.sin(i * Math.PI / 6) * 125}l${Math.cos(i * Math.PI / 6) * 55 * pop(frame, 74)} ${Math.sin(i * Math.PI / 6) * 35 * pop(frame, 74)}`} stroke={C.coral} strokeWidth="6" strokeLinecap="round" opacity=".75" />)}
          </g>
          <Title frame={frame} start={75} lines={['THEY DO.']} sizes={[162]} y={365} colors={[C.yellow]} />
          <text x="540" y="445" fontSize="29" fontWeight="600" letterSpacing="3" fill={C.cream} textAnchor="middle" opacity={progress(frame, 79, 87)}>THE SURPRISE IS HOW.</text>
        </g>}
        {frame >= 108 && frame < 178 && <Title frame={frame} start={108} lines={['GRAVITY', 'STILL PULLS.']} sizes={[118, 115]} y={280} />}
        {frame >= 178 && frame < 247 && <Title frame={frame} start={178} lines={['ADD', 'SIDEWAYS SPEED.']} sizes={[115, 93]} y={280} />}
        {frame >= 247 && frame < 307 && <Title frame={frame} start={247} lines={['KEEP', 'MISSING EARTH.']} sizes={[115, 100]} y={280} />}
        {frame >= 307 && <Title frame={frame} start={307} lines={["THAT'S", 'AN ORBIT.']} sizes={[117, 141]} y={280} />}

        {/* Arrows follow the astronaut: gravity points inward; velocity is tangent. */}
        <OrbitArrow x={ox} y={oy} angle={theta * 180 / Math.PI + 90} length={lerp(55, 155, progress(frame, 123, 142))} color={C.coral} direction="down" opacity={reveal * ringAlpha} />
        <OrbitArrow x={ox} y={oy} angle={theta * 180 / Math.PI + 90} length={lerp(55, 205, speedAlpha)} color={C.yellow} direction="right" opacity={reveal * speedAlpha} />

        <g transform={`translate(${astronautX} ${astronautY}) rotate(${rotation})`}>
          <ellipse cy={astronautHeight * .02} rx={astronautWidth * .46} ry={astronautHeight * .43} fill="#8973E2" opacity=".07" />
          <foreignObject x={-astronautWidth / 2} y={-astronautHeight / 2} width={astronautWidth} height={astronautHeight}>
            <Astronaut frame={frame} expression={expression} excitement={lerp(1.2, .5, reveal)} />
          </foreignObject>
        </g>

        {/* A small reaction beat uses the supplied bird, visible through a porthole. */}
        <ControlBird frame={frame} visible={birdVisibility} />
        {frame > 75 && frame < 100 && <g transform={`translate(785 790) scale(${pop(frame, 75)})`}>
          <path d="M-55-65Q-55-90-30-90H35Q60-90 60-65V0Q60 25 35 25H0L-35 52-25 25H-30Q-55 25-55 0Z" fill={C.yellow} />
          <text x="4" y="-5" textAnchor="middle" fontWeight="850" fontSize="85" fill={C.ink}>!</text>
        </g>}
        <g opacity={reveal}>
          <g transform="translate(285 552)"><rect width="226" height="49" rx="24" fill="#FF7E9E" fillOpacity=".13" stroke="#FF7E9E" strokeOpacity=".3" /><circle cx="26" cy="25" r="6" fill={C.coral} /><text x="49" y="33" fontWeight="650" fontSize="23" fill={C.coral}>GRAVITY</text></g>
          <g transform="translate(534 552)" opacity={speedAlpha}><rect width="261" height="49" rx="24" fill="#EFFF83" fillOpacity=".1" stroke="#EFFF83" strokeOpacity=".3" /><circle cx="26" cy="25" r="6" fill={C.yellow} /><text x="48" y="33" fontWeight="650" fontSize="23" fill={C.yellow}>SIDEWAYS SPEED</text></g>
        </g>

        {/* Dedicated caption band stays separate from explanatory artwork. */}
        <rect x="0" y="1550" width="1080" height="370" fill="url(#caption-shade)" />
        {caption && <g>
          <rect x="99" y="1600" width="882" height="82" rx="25" fill="#0D0B2B" fillOpacity=".6" />
          <text x="540" y="1653" textAnchor="middle" fill={C.cream} fontSize="39" fontWeight="550">{caption.lines[0]}</text>
        </g>}
        <text x="540" y="1722" textAnchor="middle" fontSize="18" fontWeight="500" letterSpacing="2" fill="#A09ABB" opacity={reveal}>SCHEMATIC · NOT TO SCALE OR TIME</text>

        {/* A small channel signature, with no time spent on an intro card. */}
        <g transform="translate(77 98)">
          <ellipse rx="20" ry="9" fill="none" stroke={C.mint} strokeWidth="3" transform={`rotate(${frame * .25 + 35})`} />
          <ellipse rx="20" ry="9" fill="none" stroke={C.mint} strokeWidth="3" transform={`rotate(${frame * .25 - 35})`} />
          <circle r="4" fill={C.yellow} /><text x="40" y="10" fontWeight="750" fontSize="34" fill={C.cream} letterSpacing="-.8">odd atom</text>
        </g>
        <g transform="translate(827 77)"><rect width="180" height="41" rx="20" fill="#FFFFFF" fillOpacity=".04" stroke="#FFFFFF" strokeOpacity=".17" /><text x="90" y="28" textAnchor="middle" fontSize="19" letterSpacing="2.4" fontWeight="600" fill="#D3C9EC">SPACE / 001</text></g>
        <path d="M80 1762H1000" stroke="#8C78B3" strokeOpacity=".2" strokeWidth="2" />
        <path d={`M80 1762H${80 + 920 * frame / 359}`} stroke={C.mint} strokeOpacity=".7" strokeWidth="2" />
        <text x="80" y="1810" fontSize="19" letterSpacing="3" fontWeight="550" fill="#B3A8CD">SMALL QUESTIONS. BIG UNIVERSE.</text>
        <text x="1000" y="1810" textAnchor="end" fontSize="19" fontWeight="550" fill="#B3A8CD">{final > .5 ? '∞' : '12 SEC'}</text>
      </svg>
      <Audio src={staticFile('assets/audio/narration.wav')} />
      <Audio src={staticFile('assets/audio/music.wav')} />
      <Audio src={staticFile('assets/audio/sfx.wav')} />
    </AbsoluteFill>
  );
};
