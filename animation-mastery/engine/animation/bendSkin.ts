/** A continuous angular bend. Unlike linear position blending over a narrow
 * strip, the mapping can retain orientation at a larger forearm excursion.
 * The periodic sector returns to zero behind the joint, avoiding atan2's seam.
 * Art/pose registration still needs visual validation for each supplied skin. */
export function bendSector(point:readonly [number,number],pivot:readonly [number,number],degrees:number):[number,number] {
  const x=point[0]-pivot[0],y=point[1]-pivot[1],angle=Math.atan2(y,x)*180/Math.PI;
  const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
  const weight=smooth((angle+75)/45)*(1-smooth((angle-30)/75));
  const turn=degrees*weight*Math.PI/180;
  return [pivot[0]+x*Math.cos(turn)-y*Math.sin(turn),pivot[1]+x*Math.sin(turn)+y*Math.cos(turn)];
}
