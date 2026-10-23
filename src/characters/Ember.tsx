import React from 'react';

export type EmberProps = {
  frame: number;
  concern?: number;
  compression?: number;
  openness?: number;
  cutaway?: number;
  energy?: number;
  look?: number;
  id?: string;
};

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const R = 245;

/** Original star character. Arms use two-bone IK; every hand remains attached to its wrist. */
export const Ember: React.FC<EmberProps> = ({frame, concern = 0, compression = 0, openness = .4, cutaway = 0, energy = .3, look = 0, id = 'ember'}) => {
  const bodyScale = 1 - compression * .08;
  const coronaPoints = Array.from({length: 72}, (_, i) => {
    const a = i / 72 * Math.PI * 2;
    const radius = 276 + Math.sin(a * 12 + frame / 37) * 8 + Math.sin(a * 7 - frame / 53) * 6;
    return `${Math.cos(a) * radius},${Math.sin(a) * radius}`;
  }).join(' ');
  const blink = Math.max(...[72, 182, 493].map(t => clamp(1 - Math.abs(frame - t) / 5)));
  const eyeHeight = Math.max(3, (32 - concern * 8) * (1 - blink));
  const pupils = look * 9;
  const arm = (side: number) => {
    const sx = R * .86, sy = -R * .02;
    const tx = R * (1.22 + openness * .4 - compression * .25);
    const ty = R * (.45 - openness * .55 + concern * .12);
    const upper = R * .41, lower = R * .40;
    const dist = clamp(Math.hypot(tx - sx, ty - sy), 2, upper + lower - .1);
    const base = Math.atan2(ty - sy, tx - sx);
    const bend = Math.acos(clamp((upper * upper + dist * dist - lower * lower) / (2 * upper * dist), -1, 1));
    const ex = sx + Math.cos(base + bend) * upper;
    const ey = sy + Math.sin(base + bend) * upper;
    const wrist = -15 + openness * 32 + Math.sin(frame / 32) * 3;
    return <g key={side} transform={`scale(${side} 1)`}>
      <path d={`M${sx} ${sy}L${ex} ${ey} ${tx} ${ty}`} fill="none" stroke="#BD453D" strokeWidth="37" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${sx} ${sy}L${ex} ${ey} ${tx} ${ty}`} fill="none" stroke="#FFD070" strokeWidth="27" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={ex} cy={ey} r="13" fill="#FFB64B" />
      <g transform={`translate(${tx} ${ty}) rotate(${wrist})`}>
        <path d="M-13 9C-26-1-19-18-9-16L-5-33C-2-44 9-40 9-31L10-41C13-51 24-45 23-36L27-40C37-45 43-34 38-23L35-15C48-23 58-15 49-5L27 17C15 28-3 26-13 9Z" fill="#FFE69A" stroke="#BD453D" strokeWidth="5" strokeLinejoin="round" />
        <path d="M9-28 8-8M23-31 20-10M34-24 29-8" fill="none" stroke="#EFA84B" strokeWidth="3" strokeLinecap="round" />
      </g>
    </g>;
  };
  return <svg viewBox="-550 -550 1100 1100" width="100%" height="100%" overflow="visible">
    <defs>
      <radialGradient id={`${id}-body`} cx="34%" cy="28%"><stop stopColor="#FFF4B3" /><stop offset=".45" stopColor="#FFCB55" /><stop offset="1" stopColor="#F0713D" /></radialGradient>
      <radialGradient id={`${id}-glow`}><stop offset=".55" stopColor="#FFBF51" stopOpacity=".14" /><stop offset="1" stopColor="#FF8B4A" stopOpacity="0" /></radialGradient>
      <radialGradient id={`${id}-core`}><stop stopColor="#FFFFE1" /><stop offset=".4" stopColor="#FFF180" /><stop offset="1" stopColor="#FFAC45" /></radialGradient>
      <clipPath id={`${id}-surface`}><circle r={R} /></clipPath>
    </defs>
    <circle r="376" fill={`url(#${id}-glow)`} />
    <g transform={`scale(${bodyScale} ${1 - compression * .1})`}>
      {[-1, 1].map(arm)}
      <polygon points={coronaPoints} fill="#FF982F" />
      {Array.from({length: 18}, (_, i) => {
        const length = 43 + Math.sin(i * 1.7 + frame / 38) * 12;
        return <g key={i} transform={`rotate(${i * 20 + Math.sin(frame / 60) * 2})`}>
          <path d={`M-26-237C-23-260-7 ${-245 - length + 8} 13 ${-245 - length}C8 ${-245 - length + 16} 31-265 26-237Z`} fill={i % 2 ? '#FFB341' : '#FFA332'} />
          <path d={`M-12-239Q-8 ${-260 - length * .25} 6 ${-262 - length * .35}Q5-251 15-239Z`} fill="#FFD767" opacity=".8" />
        </g>;
      })}
      <circle r={R} fill={`url(#${id}-body)`} />
      <g clipPath={`url(#${id}-surface)`}>
        <path d="M111-230C242-139 216 127 35 247L286 252 286-271Z" fill="#D9593F" opacity=".15" />
        <g opacity={.33 * (1 - cutaway)}>
          {Array.from({length: 14}, (_, i) => {
            const a = i * 2.39996;
            const r = i < 7 ? 209 : 176;
            const x = Math.cos(a) * r, y = Math.sin(a) * r;
            return <path key={i} transform={`translate(${x} ${y}) rotate(${i * 31 + Math.sin(frame / 45 + i) * 5})`} d="M-23-4C-9-30 25-22 24 0S-14 28-23 9" fill="none" stroke={i % 2 ? '#F79535' : '#FFE69C'} strokeWidth="6" strokeLinecap="round" />;
          })}
        </g>
        <g opacity={cutaway}>
          <circle r="233" fill="#F48136" />
          <circle r="181" fill="#FFA642" />
          <circle r="133" fill="#FFD166" />
          <circle r="80" fill={`url(#${id}-core)`} />
          <circle r={82 + Math.sin(frame / 9) * 5} fill="none" stroke="#FFF8B8" strokeWidth="3" opacity=".7" />
          {Array.from({length: 12}, (_, i) => <path key={i} transform={`rotate(${i * 30})`} d="M0-204C45-178 47-150 13-137C-18-126-25-151-3-165" fill="none" stroke="#FFE4A1" strokeWidth="5" strokeLinecap="round" opacity=".38" />)}
          {Array.from({length: 22}, (_, i) => {
            const a = i * 2.39996;
            const dist = 90 + ((frame * 1.45 + i * 23) % 140);
            return <circle key={i} cx={Math.cos(a) * dist} cy={Math.sin(a) * dist} r="4" fill="#FFF8CE" opacity={energy * .8} />;
          })}
        </g>
        <path d="M-181-92Q-146-174-66-196" fill="none" stroke="#FFFFD6" strokeWidth="12" strokeLinecap="round" opacity={.48 * (1 - cutaway)} />
      </g>
      <g opacity={1 - cutaway}>
        {[-1, 1].map(side => <g key={side} transform={`translate(${side * 69} -22)`}>
          <defs><clipPath id={`${id}-eye-${side}`}><ellipse rx="27" ry={eyeHeight} /></clipPath></defs>
          <ellipse rx="32" ry={eyeHeight + 5} fill="#E99857" opacity=".35" />
          <ellipse rx="27" ry={eyeHeight} fill="#5F2339" />
          {blink < .8 && <g clipPath={`url(#${id}-eye-${side})`}><g transform={`translate(${pupils} 0)`}><ellipse cx="-5" cy="-10" rx="8" ry="11" fill="#FFFEE7" /><circle cx="10" cy="12" r="4" fill="#F6C5A8" /></g></g>}
          <path d={`M-30 ${-65 - side * concern * 10}Q0 ${-83 + concern * 13} 30 ${-65 + side * concern * 10}`} fill="none" stroke="#9E493B" strokeWidth="10" strokeLinecap="round" />
        </g>)}
        <ellipse cx="-116" cy="51" rx="29" ry="13" fill="#F5774A" opacity=".45" /><ellipse cx="116" cy="51" rx="29" ry="13" fill="#F5774A" opacity=".45" />
        <path d={`M-42 70Q0 ${104 - concern * 62} 42 70`} fill="none" stroke="#843244" strokeWidth="11" strokeLinecap="round" />
      </g>
    </g>
  </svg>;
};
