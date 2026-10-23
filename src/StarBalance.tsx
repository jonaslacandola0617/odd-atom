import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {Ember} from './characters/Ember';
import {IllustratedTitle} from './IllustratedTitle';
import narration from './data/star-narration.json';

const P = {night: '#100D35', violet: '#29215F', purple: '#A08BFF', mint: '#76E6DA', cream: '#FFF8DF', yellow: '#FFE487', orange: '#FFAE4C', coral: '#F17864'};
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {const v = clamp(x); return v * v * (3 - 2 * v);};
const at = (f: number, a: number, b: number) => smooth((f - a) / (b - a));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const sky = Array.from({length: 135}, (_, i) => ({x: 15 + (i * 317.617) % 1890, y: 15 + (i * 179.331) % 1050, r: .8 + i % 4 * .55}));

const Vector: React.FC<{cx: number; cy: number; angle: number; r1: number; r2: number; offset: number; color: string; alpha: number}> = ({cx, cy, angle, r1, r2, offset, color, alpha}) => {
  const u = [Math.cos(angle), Math.sin(angle)];
  const t = [-u[1], u[0]];
  const p1 = [cx + u[0] * r1 + t[0] * offset, cy + u[1] * r1 + t[1] * offset];
  const p2 = [cx + u[0] * r2 + t[0] * offset, cy + u[1] * r2 + t[1] * offset];
  const direction = r2 > r1 ? 1 : -1;
  return <g opacity={alpha}>
    <path d={`M${p1}L${p2}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
    <path d={`M${p2[0] - direction * u[0] * 21 + t[0] * 15} ${p2[1] - direction * u[1] * 21 + t[1] * 15}L${p2} ${p2[0] - direction * u[0] * 21 - t[0] * 15} ${p2[1] - direction * u[1] * 21 - t[1] * 15}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
  </g>;
};

const FusionDetail: React.FC<{frame: number; opacity: number}> = ({frame, opacity}) => {
  const phase = clamp((frame - 238) / 66);
  const merge = smooth((phase - .12) / .5);
  const helium = at(frame, 273, 285);
  const flash = Math.max(0, 1 - Math.abs(frame - 280) / 12);
  const positions = [[-108, -75], [90, -92], [-82, 85], [110, 72]];
  return <g opacity={opacity} transform="translate(1390 490)">
    <defs><radialGradient id="fusion-halo"><stop stopColor="#F5C36D" stopOpacity=".18" /><stop offset="1" stopColor="#F5C36D" stopOpacity="0" /></radialGradient></defs>
    <circle r="280" fill="url(#fusion-halo)" />
    <circle r="224" fill="#28173D" stroke="#FAB968" strokeWidth="4" />
    <circle r="212" fill="#35204C" />
    {positions.map((p, i) => <g key={i} transform={`translate(${mix(p[0], (i % 2 ? 1 : -1) * 25, merge)} ${mix(p[1], (i < 2 ? -1 : 1) * 25, merge)})`} opacity={1 - helium}>
      <circle r="27" fill="#A84B56" /><circle cy="-3" r="22" fill={P.coral} /><circle cx="-6" cy="-10" r="6" fill="#FFC8A0" />
    </g>)}
    <g opacity={helium} transform={`rotate(${(frame - 280) * .09})`}>
      {[[-24, -22], [24, -22], [-24, 22], [24, 22]].map((p, i) => <g key={i} transform={`translate(${p})`}><circle r="30" fill={i % 3 === 0 ? '#B95563' : '#346A9F'} /><circle cy="-4" r="25" fill={i % 3 === 0 ? P.coral : '#6FC2DB'} /><circle cx="-7" cy="-11" r="7" fill={i % 3 === 0 ? '#FFD3A3' : '#C6FFFF'} /></g>)}
    </g>
    <circle r={45 + flash * 22} fill="#FFFFD6" opacity={flash * .65} />
    {Array.from({length: 12}, (_, i) => {
      const a = i * Math.PI / 6;
      const dist = 60 + at(frame, 278, 325) * 140;
      return <g key={i} opacity={helium * (.5 + Math.sin(frame / 7 + i) * .18)} transform={`translate(${Math.cos(a) * dist} ${Math.sin(a) * dist}) rotate(${i * 30})`}><path d="M-11 0H11M0-11V11" stroke={P.yellow} strokeWidth="5" strokeLinecap="round" /></g>;
    })}
    <text y="-265" textAnchor="middle" fill={P.cream} fontFamily="Nunito" fontWeight="900" fontSize="52">Fusion</text>
  </g>;
};

export const StarBalance: React.FC<{includeNarration: boolean}> = ({includeNarration}) => {
  const actualFrame = useCurrentFrame();
  const anchors = [[0, 0], [narration.beats.gravity, 3.7], [narration.beats.fusion, 6.2], [narration.beats.energy, 10.6], [narration.beats.balance, 15.2], [20, 20]];
  const time = actualFrame / 30;
  const interval = anchors.findIndex((a, i) => i < anchors.length - 1 && time >= a[0] && time < anchors[i + 1][0]);
  const a = anchors[Math.max(0, interval)], b = anchors[Math.max(0, interval) + 1];
  const frame = (a[1] + (time - a[0]) / (b[0] - a[0]) * (b[1] - a[1])) * 30;
  const [fontHandle] = useState(() => delayRender('Load local production fonts'));
  useEffect(() => {
    Promise.all([
      new FontFace('Outfit', `url(${staticFile('assets/fonts/Outfit.ttf')})`, {weight: '100 900'}).load(),
      new FontFace('Nunito', `url(${staticFile('assets/fonts/Nunito.ttf')})`, {weight: '200 1000'}).load(),
    ]).then(fonts => {for (const font of fonts) document.fonts.add(font); continueRender(fontHandle);}).catch(cancelRender);
  }, [fontHandle]);
  if (includeNarration && (narration.status !== 'generated' || !narration.audioFile)) {
    throw new Error('ElevenLabs narration is pending. Configure ELEVENLABS_API_KEY and run npm run narrate. Use StarBalancePreview only for the explicitly unvoiced visual preview.');
  }

  const toCenter = at(frame, 90, 135);
  const inside = at(frame, 185, 230) * (1 - at(frame, 345, 408));
  const cx = mix(mix(1320, 960, toCenter), 550, inside);
  const cy = 500 + Math.sin(frame / 43) * (1 - inside) * 4;
  const size = mix(mix(1100, 1280, toCenter), 1450, inside);
  const scale = size / 1100;
  const compress = at(frame, 118, 170) * (1 - at(frame, 330, 420));
  const pressure = at(frame, 350, 405);
  const gravity = at(frame, 112, 140) * (1 - inside);
  const openness = mix(mix(.5, .13, compress), .88, pressure);
  const caption = narration.captions.find(c => time >= c.start && time < c.end);
  const look = frame < 185 ? -at(frame, 90, 130) : frame < 450 ? at(frame, 350, 390) : Math.sin((frame - 450) / 48) * .5;
  const detail = at(frame, 222, 242) * (1 - at(frame, 330, 355));
  const angles = [-150, -105, -60, -15, 30, 75, 120, 165];

  return <AbsoluteFill style={{background: P.night, fontFamily: 'Outfit, sans-serif'}}>
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
      <defs>
        <radialGradient id="stellar-space" cx="62%" cy="42%"><stop stopColor="#352264" /><stop offset=".55" stopColor="#1D1849" /><stop offset="1" stopColor="#0D1231" /></radialGradient>
        <radialGradient id="violet-cloud"><stop stopColor="#75459C" stopOpacity=".23" /><stop offset="1" stopColor="#75459C" stopOpacity="0" /></radialGradient>
        <radialGradient id="blue-cloud"><stop stopColor="#126B86" stopOpacity=".19" /><stop offset="1" stopColor="#126B86" stopOpacity="0" /></radialGradient>
        <linearGradient id="core-link"><stop stopColor="#FFE487" stopOpacity=".6" /><stop offset="1" stopColor="#FFE487" stopOpacity=".2" /></linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#stellar-space)" />
      <ellipse cx="1550" cy="150" rx="860" ry="600" fill="url(#violet-cloud)" />
      <ellipse cx="220" cy="940" rx="800" ry="550" fill="url(#blue-cloud)" />
      {sky.map((s, i) => <g key={i} opacity={.25 + (.5 + Math.sin(frame / 40 + i)) * .16}>
        <circle cx={s.x} cy={s.y} r={s.r} fill={i % 3 ? '#AFA7D7' : '#A9EAE9'} />
        {i % 28 === 0 && <path d={`M${s.x - 5} ${s.y}h10M${s.x} ${s.y - 5}v10`} stroke="#CEEFDB" strokeWidth="1.3" />}
      </g>)}

      <g opacity={1 - at(frame, 85, 103)}>
        <IllustratedTitle centerX={465} centerY={440} strokeScale={.54} tilt={-2} lines={[
          {text: 'The battle', size: 94, baseline: 409},
          {text: 'inside a star', size: 88, baseline: 526},
        ]} />
      </g>

      <g>
        {angles.map((deg, i) => {
          const a = deg * Math.PI / 180;
          const pulse = 1 + Math.sin(frame / 14 + i * .8) * .025 * (1 - pressure);
          return <g key={deg}>
            <Vector cx={cx} cy={cy} angle={a} r1={(245 + 168 * pulse) * scale} r2={(245 + 64) * scale} offset={-13 * scale} color={P.purple} alpha={gravity} />
            <Vector cx={cx} cy={cy} angle={a} r1={(245 + 35) * scale} r2={(245 + 139) * scale} offset={13 * scale} color={P.yellow} alpha={pressure} />
          </g>;
        })}
        <g transform={`translate(${cx} ${cy})`}>
          <foreignObject x={-size / 2} y={-size / 2} width={size} height={size}>
            <Ember frame={frame} concern={compress * (1 - pressure)} compression={compress * .85} openness={openness} cutaway={inside} energy={mix(.25, 1, at(frame, 270, 360))} look={look} />
          </foreignObject>
        </g>
        <g opacity={gravity * (1 - inside)}><text x="440" y="228" textAnchor="middle" fill={P.purple} fontFamily="Nunito" fontWeight="850" fontSize="43">Gravity</text></g>
        <g opacity={pressure}><text x="1490" y="228" textAnchor="middle" fill={P.yellow} fontFamily="Nunito" fontWeight="850" fontSize="43">Pressure</text></g>
      </g>

      <g opacity={detail}>
        <circle cx="550" cy="500" r="29" fill="none" stroke={P.cream} strokeWidth="3" />
        <path d="M577 486C780 353 1018 370 1168 435M577 514C799 649 1019 630 1168 545" fill="none" stroke="url(#core-link)" strokeWidth="3" />
      </g>
      <FusionDetail frame={frame} opacity={detail} />

      {caption && <text x="960" y="1018" textAnchor="middle" fontSize="38" fontWeight="500" fill="#FFFFFF" stroke="#101126" strokeWidth="3" paintOrder="stroke" strokeLinejoin="round">{caption.text}</text>}
    </svg>
    <Audio src={staticFile('assets/audio/star-balance/music.wav')} />
    <Audio src={staticFile('assets/audio/star-balance/sfx.wav')} />
    {includeNarration && narration.audioFile && <Audio src={staticFile(narration.audioFile)} />}
  </AbsoluteFill>;
};
