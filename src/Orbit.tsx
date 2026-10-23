import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, cancelRender, continueRender, delayRender, spring, staticFile, useCurrentFrame} from 'remotion';
import {Astronaut, Bird} from './Characters';
import {Earth} from './Earth';
import {IllustratedTitle} from './IllustratedTitle';

const C = {ink: '#100B33', mint: '#6FFFD5', yellow: '#EFFF83', coral: '#FF7E9E'};
const ease = (x: number) => {const a = Math.max(0, Math.min(1, x)); return a * a * (3 - 2 * a);};
const progress = (frame: number, start: number, end: number) => ease((frame - start) / (end - start));
const lerp = (a: number, b: number, v: number) => a + (b - a) * v;
const pop = (frame: number, start: number) => spring({frame: frame - start, fps: 30, config: {damping: 16, stiffness: 190, mass: 0.85}});
const stars = Array.from({length: 100}, (_, i) => ({x: ((i * 337.37 + 17) % 1060) + 10, y: (i * 581.63 + 137) % 1910, r: 1 + (i % 4) * 0.6, phase: i * 1.7}));

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
  <g transform={`translate(165 ${1400 + (1 - visible) * 120}) scale(${visible})`} opacity={Math.min(1, visible)}>
    <defs><clipPath id="porthole"><circle r="116" /></clipPath><linearGradient id="glass" x2="1" y2="1"><stop stopColor="#6FFFD5" stopOpacity=".24" /><stop offset="1" stopColor="#6FFFD5" stopOpacity=".01" /></linearGradient></defs>
    <circle r="131" fill="#332568" stroke="#9A87D4" strokeWidth="4" />
    <circle r="118" fill="#181241" stroke="#6FFFD5" strokeOpacity=".5" strokeWidth="3" />
    <g clipPath="url(#porthole)">
      <foreignObject x="-88" y="-110" width="176" height="243"><Bird frame={frame} /></foreignObject>
      <circle r="115" fill="url(#glass)" />
      <path d="M-80-65Q-40-104 8-102" fill="none" stroke="#FFF9E7" strokeWidth="10" strokeLinecap="round" opacity=".6" />
    </g>
    {[0, 1, 2, 3].map(i => <circle key={i} cx={Math.cos(i * Math.PI / 2 + .7) * 126} cy={Math.sin(i * Math.PI / 2 + .7) * 126} r="4" fill="#FFF9E7" />)}
  </g>
);

const captions = [
  {start: 4, end: 66, text: "Why don't astronauts fall?"},
  {start: 75, end: 102, text: 'They do.'},
  {start: 108, end: 172, text: 'Gravity still pulls them down.'},
  {start: 178, end: 213, text: 'But they move sideways'},
  {start: 214, end: 229, text: 'so fast,'},
  {start: 230, end: 297, text: 'they keep missing Earth.'},
  {start: 307, end: 359, text: "That's an orbit."},
];

export const Orbit: React.FC = () => {
  const frame = useCurrentFrame();
  const [fontHandle] = useState(() => delayRender('Load local title and caption fonts'));
  useEffect(() => {
    Promise.all([
      new FontFace('Outfit', `url(${staticFile('assets/fonts/Outfit.ttf')})`, {weight: '100 900'}).load(),
      new FontFace('Nunito', `url(${staticFile('assets/fonts/Nunito.ttf')})`, {weight: '200 1000'}).load(),
    ]).then(fonts => {
      for (const font of fonts) document.fonts.add(font);
      continueRender(fontHandle);
    }).catch(cancelRender);
  }, [fontHandle]);

  const reveal = progress(frame, 96, 139);
  const theta = lerp(-115, 239, progress(frame, 135, 360)) * Math.PI / 180;
  const orbitRadius = 400;
  const cx = 540, cy = 930;
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
  const answerScale = lerp(.9, 1, pop(frame, 75));

  return (
    <AbsoluteFill style={{background: C.ink, fontFamily: 'Outfit, sans-serif'}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <defs>
          <radialGradient id="space"><stop stopColor="#3D2089" /><stop offset=".58" stopColor="#21104F" /><stop offset="1" stopColor="#0B0D2D" /></radialGradient>
          <radialGradient id="nebula"><stop stopColor="#8044EC" stopOpacity=".32" /><stop offset="1" stopColor="#8044EC" stopOpacity="0" /></radialGradient>
          <linearGradient id="horizon" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#6FFFD5" /><stop offset=".13" stopColor="#3F84D5" /><stop offset="1" stopColor="#36167B" /></linearGradient>
          <linearGradient id="orbit-line"><stop stopColor={C.yellow} /><stop offset="1" stopColor={C.mint} /></linearGradient>
        </defs>
        <rect width="1080" height="1920" fill="url(#space)" />
        <ellipse cx={180 + frame * .13} cy="900" rx="690" ry="1030" fill="url(#nebula)" />
        <ellipse cx="1000" cy="1700" rx="640" ry="700" fill="url(#nebula)" opacity=".6" />
        {stars.map((s, i) => <g key={i} opacity={.3 + (Math.sin(frame / 22 + s.phase) + 1) * .22}>
          <circle cx={s.x} cy={s.y + Math.sin(frame / 90 + i) * 3} r={s.r} fill={i % 4 ? '#A5A3F2' : '#F6F1D9'} />
          {i % 19 === 0 && <path d={`M${s.x - 6} ${s.y}h12M${s.x} ${s.y - 6}v12`} stroke="#CFFFEF" strokeWidth="1.5" />}
        </g>)}

        <g opacity={1 - reveal}>
          <circle cx="540" cy="2647" r="1063" fill="#69E9E3" opacity=".13" />
          <circle cx="540" cy="2647" r="1047" fill="url(#horizon)" stroke="#8FFFF3" strokeWidth="5" />
          <path d="M-50 1765Q435 1625 1130 1810" stroke="#A1FFE4" strokeWidth="16" strokeLinecap="round" opacity=".12" fill="none" />
        </g>

        <g opacity={reveal}>
          <circle cx={cx} cy={cy} r={orbitRadius} fill="none" stroke="#B8A2FF" strokeOpacity=".22" strokeWidth="3" strokeDasharray="6 13" opacity={ringAlpha} />
          <circle cx={cx} cy={cy} r={orbitRadius} fill="none" stroke="url(#orbit-line)" strokeOpacity=".12" strokeWidth="30" strokeDasharray={`${trailLength} ${2 * Math.PI * orbitRadius}`} transform={`rotate(-115 ${cx} ${cy})`} />
          <circle cx={cx} cy={cy} r={orbitRadius} fill="none" stroke="url(#orbit-line)" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${trailLength} ${2 * Math.PI * orbitRadius}`} transform={`rotate(-115 ${cx} ${cy})`} />
          <foreignObject x={cx - 367.5} y={cy - 367.5} width="735" height="735"><Earth frame={frame} /></foreignObject>
          {Array.from({length: 4}, (_, i) => {
            const angle = theta - (.17 + i * .12);
            return <circle key={i} cx={cx + Math.cos(angle) * orbitRadius} cy={cy + Math.sin(angle) * orbitRadius} r={5 - i * .6} fill={C.yellow} opacity={speedAlpha * (1 - i * .2)} />;
          })}
        </g>

        {/* The opening title is fully readable at frame zero, as in the supplied shorts. */}
        <g opacity={1 - progress(frame, 67, 74)}>
          <IllustratedTitle centerY={365} lines={[
            {text: "Why Don't", size: 105, baseline: 237},
            {text: 'Astronauts', size: 146, baseline: 383},
            {text: 'FALL?', size: 170, baseline: 548},
          ]} />
        </g>
        {frame >= 75 && frame < 108 && <g transform={`translate(540 360) scale(${answerScale}) translate(-540 -360)`}>
          <IllustratedTitle centerY={360} tilt={-3} lines={[{text: 'They do.', size: 166, baseline: 390}]} />
        </g>}

        {/* Inward force and tangent velocity explain the orbit without extra headings. */}
        <OrbitArrow x={ox} y={oy} angle={theta * 180 / Math.PI + 90} length={lerp(55, 155, progress(frame, 123, 142))} color={C.coral} direction="down" opacity={reveal * ringAlpha} />
        <OrbitArrow x={ox} y={oy} angle={theta * 180 / Math.PI + 90} length={lerp(55, 205, speedAlpha)} color={C.yellow} direction="right" opacity={reveal * speedAlpha} />
        <g transform={`translate(${astronautX} ${astronautY}) rotate(${rotation})`}>
          <foreignObject x={-astronautWidth / 2} y={-astronautHeight / 2} width={astronautWidth} height={astronautHeight}>
            <Astronaut frame={frame} expression={expression} excitement={lerp(1.2, .5, reveal)} />
          </foreignObject>
        </g>
        <ControlBird frame={frame} visible={birdVisibility} />
        {frame > 75 && frame < 100 && <g transform={`translate(785 790) scale(${pop(frame, 75)})`}>
          <path d="M-55-65Q-55-90-30-90H35Q60-90 60-65V0Q60 25 35 25H0L-35 52-25 25H-30Q-55 25-55 0Z" fill={C.yellow} />
          <text x="4" y="-5" textAnchor="middle" fontWeight="850" fontSize="85" fill={C.ink}>!</text>
        </g>}
        {caption && <text x="540" y="1600" textAnchor="middle" fill="#FFFFFF" stroke="#150A30" strokeWidth="3" paintOrder="stroke" strokeLinejoin="round" fontSize="38" fontWeight="500">{caption.text}</text>}
      </svg>
      <Audio src={staticFile('assets/audio/narration.wav')} />
      <Audio src={staticFile('assets/audio/music.wav')} />
      <Audio src={staticFile('assets/audio/sfx.wav')} />
    </AbsoluteFill>
  );
};
