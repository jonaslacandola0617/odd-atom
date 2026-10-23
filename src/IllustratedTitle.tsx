import React from 'react';

type Line = {text: string; size: number; baseline: number};

/** Paint all outline passes before the letter faces, preserving clean overlapping borders. */
export const IllustratedTitle: React.FC<{
  lines: Line[];
  centerY: number;
  tilt?: number;
}> = ({lines, centerY, tilt = -3}) => {
  const layers = [
    {color: '#872B46', width: 38, x: 2, y: 10, face: false},
    {color: '#E48321', width: 31, x: 0, y: 0, face: false},
    {color: '#FFCB38', width: 21, x: 0, y: 0, face: false},
    {color: '#FFF09A', width: 10, x: 0, y: 0, face: false},
    {color: '#FFFFF3', width: 0, x: 0, y: 0, face: true},
  ];
  return (
    <g transform={`rotate(${tilt} 540 ${centerY})`} fontFamily="Nunito, sans-serif" fontWeight={1000}>
      {layers.map((layer, index) => <g key={index} transform={`translate(${layer.x} ${layer.y})`}>
        {lines.map(line => <text
          key={line.text}
          x="540"
          y={line.baseline}
          textAnchor="middle"
          fontSize={line.size}
          letterSpacing="-2"
          fill={layer.face ? layer.color : 'none'}
          stroke={layer.face ? 'none' : layer.color}
          strokeWidth={layer.width}
          strokeLinejoin="round"
          strokeLinecap="round"
        >{line.text}</text>)}
      </g>)}
    </g>
  );
};
