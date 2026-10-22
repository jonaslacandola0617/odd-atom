import React from 'react';
import artwork from './generated/characters.json';

type Expression = keyof typeof artwork.astronaut.heads;

// These expressions are supplied artwork. Move each helmet to the same anchor.
const headOffsets: Record<Expression, [number, number]> = {
  neutral: [0, 0],
  surprised: [-759, -679],
  worried: [-1401, 21],
  happy: [-757, 21],
};

export const Astronaut: React.FC<{
  frame: number;
  expression?: Expression;
  excitement?: number;
}> = ({frame, expression = 'neutral', excitement = 1}) => {
  const left = -9 + Math.sin(frame / 12) * 10 * excitement;
  const right = 8 + Math.sin(frame / 13 + 2) * 11 * excitement;
  const kick = Math.sin(frame / 16) * 5 * excitement;
  const [hx, hy] = headOffsets[expression];
  const smooth = (v: number) => {const s = Math.max(0, Math.min(1, v)); return s * s * (3 - 2 * s);};
  const warp = (x: number, y: number) => {
    let dx = 0, dy = 0;
    const fields = [
      {cx: 375, cy: 680, angle: left, w: smooth((435 - x) / 140) * smooth((y - 590) / 240) * (1 - smooth((y - 1110) / 90))},
      {cx: 715, cy: 680, angle: right, w: smooth((x - 655) / 140) * smooth((y - 590) / 240) * (1 - smooth((y - 1110) / 90))},
      {cx: 440, cy: 1055, angle: kick, w: smooth((y - 1020) / 230) * smooth((550 - x) / 100) * smooth((x - 270) / 80)},
      {cx: 650, cy: 1055, angle: -kick, w: smooth((y - 1020) / 230) * smooth((x - 550) / 100) * smooth((820 - x) / 80)},
    ];
    for (const field of fields) {
      const a = field.angle * Math.PI / 180;
      dx += ((x - field.cx) * Math.cos(a) - (y - field.cy) * Math.sin(a) + field.cx - x) * field.w;
      dy += ((x - field.cx) * Math.sin(a) + (y - field.cy) * Math.cos(a) + field.cy - y) * field.w;
    }
    return `${(x + dx).toFixed(2)},${(y + dy).toFixed(2)}`;
  };
  return (
    <svg viewBox="100 120 900 1300" width="100%" height="100%" overflow="visible">
      <style>{artwork.astronaut.css}</style>
      {artwork.astronaut.shapes.map((shape, i) => <path key={i} className={shape.className} d={shape.commands.map(c => {
        const points = [];
        for (let j = 0; j < c.points.length; j += 2) points.push(warp(c.points[j], c.points[j + 1]));
        return c.type + points.join(' ');
      }).join(' ')} />)}
      <g transform={`rotate(${Math.sin(frame / 24) * 2.5} 545 663)`}>
        <g transform={`translate(${hx} ${hy})`} dangerouslySetInnerHTML={{__html: artwork.astronaut.heads[expression]}} />
      </g>
    </svg>
  );
};

export const Bird: React.FC<{frame: number}> = ({frame}) => {
  const parts = artwork.bird.parts;
  const wing = Math.sin(frame / 6) * 15;
  return (
    <svg viewBox="800 60 1000 1380" width="100%" height="100%" overflow="visible">
      <style>{artwork.bird.css}</style>
      {parts.map((part, index) => (
        <g key={index} transform={index === 7 ? `rotate(${wing} 1225 840)` : index === 2 ? `rotate(${-wing * 0.45} 1540 815)` : index < 2 ? `rotate(${Math.sin(frame / 12 + index) * 5} 1390 1160)` : undefined}
          dangerouslySetInnerHTML={{__html: part}} />
      ))}
    </svg>
  );
};
