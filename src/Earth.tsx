import React from 'react';
import {geoOrthographic, geoPath, type GeoPermissibleObjects} from 'd3-geo';
import land from './generated/land.geojson.json';

export const Earth: React.FC<{frame: number; id?: string}> = ({frame, id = 'earth'}) => {
  const projection = geoOrthographic().translate([350, 350]).scale(247).rotate([-12 + (frame - 100) * .045, -14, 8]).clipAngle(90);
  const coastline = geoPath(projection)(land as unknown as GeoPermissibleObjects) ?? '';
  return (
  <svg viewBox="0 0 700 700" width="100%" height="100%" overflow="visible">
    <defs>
      <radialGradient id={`${id}-ocean`} cx="28%" cy="22%"><stop stopColor="#5EEAF1" /><stop offset=".53" stopColor="#2498DA" /><stop offset="1" stopColor="#4051BC" /></radialGradient>
      <linearGradient id={`${id}-shade`}><stop offset=".3" stopColor="#140A43" stopOpacity="0" /><stop offset=".75" stopColor="#160B48" stopOpacity=".25" /><stop offset="1" stopColor="#140A43" stopOpacity=".9" /></linearGradient>
      <radialGradient id={`${id}-halo`}><stop offset=".77" stopColor="#6FF9FF" stopOpacity="0" /><stop offset=".83" stopColor="#48C9FF" stopOpacity=".22" /><stop offset="1" stopColor="#48C9FF" stopOpacity="0" /></radialGradient>
      <clipPath id={`${id}-mask`}><circle cx="350" cy="350" r="247" /></clipPath>
    </defs>
    <circle cx="350" cy="350" r="303" fill={`url(#${id}-halo)`} />
    <circle cx="350" cy="350" r="253" fill="#43DDFF" opacity=".48" />
    <circle cx="350" cy="350" r="247" fill={`url(#${id}-ocean)`} />
    <g clipPath={`url(#${id}-mask)`}>
      <path d={coastline} fill="#75EDB8" stroke="#8CF5CB" strokeWidth=".6" />
      <g transform={`translate(${(frame - 100) * .035} 15) rotate(-12 350 350)`}>
        <path d="M132 212Q205 179 276 205M310 359Q352 338 392 349M422 134Q471 122 525 143M458 294Q513 275 569 298" fill="none" stroke="#D8FFF0" strokeWidth="12" strokeLinecap="round" opacity=".75" />
        <path d="M168 329Q204 320 230 333M333 185Q364 170 381 181" fill="none" stroke="#D8FFF0" strokeWidth="7" strokeLinecap="round" opacity=".65" />
      </g>
      <ellipse cx="350" cy="350" rx="245" ry="80" fill="none" stroke="#ACF4FF" opacity=".08" strokeWidth="2" />
      <ellipse cx="350" cy="350" rx="138" ry="245" fill="none" stroke="#ACF4FF" opacity=".08" strokeWidth="2" />
      <circle cx="350" cy="350" r="247" fill={`url(#${id}-shade)`} />
      <circle cx="325" cy="328" r="247" fill="none" stroke="#C1FFF3" strokeWidth="7" opacity=".4" />
    </g>
  </svg>
  );
};
