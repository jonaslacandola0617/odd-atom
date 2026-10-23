import React from 'react';

// Original artwork. Filled contours, separate head views, and pose-specific hands;
// no geometry from the rejected Citizen/City drawings or downloaded reference art.
export const colors = {
  ink: '#180638', blue: '#25116A', violet: '#40209B', cobalt: '#3C22B1',
  pink: '#F56BA6', pinkShade: '#CA3887', gold: '#FFCB57', coral: '#EF795B',
  mint: '#5BE0C4', teal: '#168E99', lilac: '#BC86EA', cream: '#FFF1BF',
};
const {ink, pink, pinkShade, gold, coral, mint, lilac} = colors;

export const ArtDefinitions: React.FC = () => <defs>
  <linearGradient id="connection-night" x1="0" y1="0" x2="0" y2="1">
    <stop stopColor="#190640"/><stop offset="1" stopColor="#4122B0"/>
  </linearGradient>
  <linearGradient id="connection-ground" x1="0" y1="0" x2="1" y2="1">
    <stop stopColor="#4F2BA2"/><stop offset="1" stopColor="#1B0B50"/>
  </linearGradient>
  <linearGradient id="connection-glass" x1="0" y1="0" x2="1" y2="1">
    <stop stopColor="#55CFBD"/><stop offset="1" stopColor="#258698"/>
  </linearGradient>
  <linearGradient id="connection-day" x1="0" y1="0" x2="1" y2="1">
    <stop stopColor="#FFE8A7"/><stop offset="1" stopColor="#F3A38D"/>
  </linearGradient>
  <linearGradient id="connection-table" x1="0" y1="0" x2="0" y2="1">
    <stop stopColor="#F4B993"/><stop offset="1" stopColor="#DC8B82"/>
  </linearGradient>
  <linearGradient id="connection-mira-coat" x1="0" y1="0" x2="1" y2="1">
    <stop stopColor="#FFDC71"/><stop offset="1" stopColor="#FFC04B"/>
  </linearGradient>
</defs>;

/** Right-facing three-quarter head. Its offset fringe and single visible ear
 * are designed around the asymmetrical face, rather than a mirrored front rig. */
export const MiraHead: React.FC<{lift?: number; smile?: number; blink?: number}> = ({lift=0, smile=0, blink=1}) => <g transform={`rotate(${10-lift*14} 0 55)`}>
  <path d="M-71-44C-80-89-51-113-10-109C31-119 66-94 68-51L65 56C43 77-6 72-48 60Z" fill={ink}/>
  <path d="M-62-69C-49-100-16-108 17-96C-12-97-35-74-40-36L-48 48L-65 48Z" fill="#3C1673"/>
  <path d="M-24 34L19 35L20 68L-5 75L-27 61Z" fill={pinkShade}/>
  <path d="M-35-64C-10-81 22-74 34-49L38-29L46-12Q53-5 43 1L40 5C39 33 21 54-5 53C-28 52-44 35-45 6L-45-30Z" fill={pink}/>
  <path d="M-35-59L-25-62C-29-33-31-9-24 14C-19 32-9 44 9 49C-14 62-38 40-44 15L-44-26Z" fill={pinkShade}/>
  <path d="M-48-7C-65-22-73-1-61 13Q-53 24-42 15L-42 0Z" fill={pink}/>
  <path d="M-58-1Q-52-6-49 4" stroke={pinkShade} strokeWidth="4" fill="none" strokeLinecap="round"/>
  <path d="M-65-48C-68-94-33-111 0-105C35-110 61-89 66-60C45-43 24-38 9-56C-6-40-21-34-39-34L-43 2L-55-6Z" fill={ink}/>
  <path d="M-55-74Q-30-103 3-92Q-21-88-35-62Z" fill="#45207F"/>
  <g transform={`translate(0 ${-lift*1.5})`}>
    <ellipse cx="3" cy="-12" rx="6" ry={9*blink} fill="#3C105A"/>
    <ellipse cx="29" cy="-16" rx="5" ry={8*blink} fill="#3C105A"/>
    <path d={`M-7 ${-29-lift*2}Q0 ${-34+smile*3} 10 -29M24-33L33-34`} stroke="#60206D" strokeWidth="4" fill="none" strokeLinecap="round"/>
    <path d={`M20 22Q${29+smile*2} ${18+smile*13} 37 20`} stroke="#9C286B" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
  </g>
</g>;

/** A separate left profile: longer nose, angular jaw, cropped quiff, one eye. */
export const SolHead: React.FC<{nod?: number; blink?: number; speak?: number}> = ({nod=0,blink=1,speak=0}) => <g transform={`rotate(${nod} 4 56)`}>
  <path d="M-12 30L35 26L35 66L8 75L-16 62Z" fill="#8554C3"/>
  <path d="M34-68C0-85-30-68-41-48L-44-28L-65-9Q-76 1-48 7L-46 26Q-37 58 1 57L40 36L52-6Z" fill={lilac}/>
  <path d="M28-45L42-26L35 13Q25 42-7 52Q15 66 41 36L52-5L43-46Z" fill="#9364CF"/>
  <path d="M-44-40C-59-53-49-70-32-72C-42-90-22-105-4-98C9-118 36-109 42-95C64-100 77-77 64-63C79-49 67-25 49-24L36 3L25-8L25-38C8-27-10-33-18-45Q-30-35-44-40Z" fill={ink}/>
  <path d="M-31-76Q-13-94 5-81Q21-95 38-83L41-74Q19-75 8-64Q-12-71-25-63Z" fill="#42307C"/>
  <path d="M31-8C45-25 60-12 53 5Q47 21 32 17Z" fill={lilac}/>
  <path d="M43-6Q50-8 45 4" stroke="#8255B4" strokeWidth="4" strokeLinecap="round" fill="none"/>
  <ellipse cx="-28" cy="-15" rx="6.5" ry={9*blink} fill="#2D1554"/>
  <path d="M-38-34Q-28-42-19-36" stroke="#4B2770" strokeWidth="5" fill="none" strokeLinecap="round"/>
  <path d={`M-43 26Q-33 ${29+speak*6} -25 24`} stroke="#623A97" strokeWidth={3+speak*2} fill="none" strokeLinecap="round"/>
</g>;

/** Complete standing silhouette. Limbs are tapered filled outlines, not strokes. */
export const MiraStanding: React.FC<{frame: number}> = ({frame}) => <g>
  <ellipse cx="0" cy="3" rx="115" ry="20" fill="#190A45" opacity=".65"/>
  <path d="M1-230L52-228L75-115L51-17L15-13L27-120L-13-197Z" fill="#39216B"/>
  <path d="M-65-230L-10-222L-22-113L-50-20L-88-25L-65-122Z" fill="#21104E"/>
  <path d="M-87-33L-49-28L-30-10Q-15 3-35 5L-110 3Q-120-9-105-18Z" fill="#F58C8C"/>
  <path d="M16-25L53-24L79-7Q92 8 74 9L1 8Q-5-1 6-10Z" fill="#F58C8C"/>
  <path d="M-113 0L-27 2M3 5H78" stroke="#201042" strokeWidth="7" strokeLinecap="round"/>
  <g transform="translate(-5 4) rotate(4 -5 -220)">
  <path d="M-74-419Q-110-404-115-366L-131-283Q-133-264-113-259L-89-265L-63-365Z" fill={coral}/>
  <path d="M-129-278Q-137-257-120-244L-109-234Q-98-228-99-238L-106-251Q-91-241-92-250L-101-266L-100-278Z" fill={pinkShade}/>
  <path d="M-30-442Q-56-434-83-418Q-102-405-93-361L-82-293L-88-227Q-27-190 75-224L67-333Q91-405 49-424L15-441L-2-411Z" fill="url(#connection-mira-coat)"/>
  <path d="M-30-441L-2-412L-20-358L-35-214Q-63-217-88-229L-80-306L-92-368Q-103-406-79-420Z" fill={coral}/>
  <path d="M-28-444L-4-424L17-446L38-430L12-390L-9-413L-33-392L-51-428Z" fill="#FFF0B7"/>
  <path d="M0-406L4-214" stroke="#ECA05A" strokeWidth="4" fill="none"/>
  <path d="M19-277L58-285L52-247L17-238Z" fill="#F3A34D"/>
  <path d="M50-421C85-412 100-383 88-346L67-281L58-250L29-257L38-296L53-351L38-386Z" fill={gold}/>
  <path d="M53-349L67-331L48-264L31-258L39-302Z" fill="#F6AE4A"/>
  <path d="M31-265L61-257L57-244L27-253Z" fill="#FFF0B7"/>
  <path d="M29-253L54-247L54-227Q52-211 45-220L43-231Q40-210 34-219L34-234Q25-219 22-229L26-242Z" fill={pink}/>
  <g transform="translate(-8 -493)"><MiraHead lift={.1+Math.sin(frame/70)*.025} blink={(frame+57)%161<5?.15:1}/></g>
  </g>
</g>;

/** Mira's seated pose has its own torso, bent trousers, sleeve and cup grip. */
export const MiraSeated: React.FC<{frame: number; attention: number; reply: number}> = ({frame,attention,reply}) => {
  const rise=reply*22;
  const blink=(frame+37)%173<5?.12:1;
  return <g>
    <path d="M-63 20L24 17L99 75L78 220L41 226L44 96L-37 80Z" fill="#251052"/>
    <path d="M-10 23L69 15L136 65Q147 75 142 94L119 220L84 219L93 97L21 82Z" fill="#4B2782"/>
    <path d="M42 217L78 213L97 238L38 241Q19 236 29 228Z" fill="#EF898C"/>
    <path d="M85 215L118 213L144 235Q156 248 133 249L76 247Q63 237 76 229Z" fill="#EF898C"/>
    <path d="M29 239L97 239M73 246L144 246" stroke={ink} strokeWidth="6" strokeLinecap="round"/>
    <path d="M-33-232C-62-223-76-195-77-153L-74-60L-92 30Q-43 65 58 42L81-45L63-172Q49-219 7-234L-13-218Z" fill="url(#connection-mira-coat)"/>
    <path d="M-36-230C-69-209-75-164-67-110L-58-35L-75 39L-93 30L-76-62L-78-160Q-74-210-45-225Z" fill={coral}/>
    <path d="M-21-242L4-223L25-244L45-225L18-193L1-212L-21-199L-40-224Z" fill="#FFF1BD"/>
    <path d="M3-212L17 42" stroke="#E4A14D" strokeWidth="4"/>
    <path d="M22-17L56-24L50 6L24 16Z" fill="#EFA34E"/>
    <path d="M-67-185Q-98-130-74-78L-10-42L5-64L-40-109L-34-163Z" fill={coral}/>
    <path d="M-10-64Q14-63 31-47Q42-36 27-34L4-40L-13-45Z" fill={pinkShade}/>
    <g transform={`translate(0 ${-rise}) rotate(${-reply*3} 37 -166)`}>
      <path d="M45-208Q73-206 77-172L80-115L142-100L134-71L59-79Q39-85 38-109L30-170Z" fill={gold}/>
      <path d="M62-109L76-114L141-99L136-85L69-93Z" fill="#F3A34D"/>
      <path d="M133-102L148-98L143-69L130-72Z" fill="#FFF1BD"/>
      <path d="M146-96Q162-103 176-95L183-81L165-69L142-73Z" fill={pinkShade}/>
      <path d="M181-123C208-129 211-99 187-96" stroke="#F5DDB1" strokeWidth="10" fill="none"/>
      <path d="M155-133L190-129L186-91Q172-80 153-93Z" fill="#FFF0C1"/>
      <path d="M155-133Q171-141 190-129Q173-120 155-133Z" fill="#6D3B75"/>
      <path d="M143-99Q152-106 166-101L175-94Q177-86 168-86L158-91L162-82Q163-75 155-78L144-85Z" fill={pink}/>
      <path d={`M168-151Q${157+Math.sin(frame/18)*5}-168 172-181`} fill="none" stroke="#B5C9C3" strokeWidth="3" opacity=".5" strokeLinecap="round"/>
    </g>
    <g transform={`translate(${8+attention*4} -293)`}><MiraHead lift={attention} smile={reply*.7+attention*.25} blink={blink}/></g>
  </g>;
};

export const SolSeated: React.FC<{frame: number; gesture: number}> = ({frame,gesture}) => <g>
  <path d="M-77 18L-24 8L-101 81L-136 225L-174 226L-144 67Z" fill="#1C1243"/>
  <path d="M-16 11L52 23L-51 101L-61 234L-98 237L-91 81Z" fill="#342362"/>
  <path d="M-173 216L-135 217L-132 238L-198 242Q-211 236-198 228Z" fill="#8A63B5"/>
  <path d="M-98 227L-61 227L-42 245Q-35 257-55 257L-124 252Q-133 243-119 238Z" fill="#8A63B5"/>
  <path d="M-206 240L-133 239M-128 252L-43 255" stroke={ink} strokeWidth="6" strokeLinecap="round"/>
  <path d="M-12-237Q-69-221-90-187L-77-79L-88 20Q-42 58 60 44L73-74L61-179Q52-220 27-236Z" fill="#208C98"/>
  <path d="M34-229Q64-213 68-172L75-70L60 44L26 48L38-65L29-179Z" fill="#126273"/>
  <path d="M-14-246L11-230L33-246L44-228L20-197L6-212L-20-205L-36-224Z" fill="#A2E9CE"/>
  <path d="M10-211L9 45" stroke="#126B80" strokeWidth="5"/>
  <path d="M-54-38L-21-34L-27 5L-57-2Z" fill="#147988"/>
  <path d="M47-192Q81-172 69-113L33-58L9-75L34-126L29-163Z" fill="#187989"/>
  <path d="M9-78Q-7-82-18-65L-18-54Q-6-44 7-52L23-65Z" fill="#9362CA"/>
  <g transform={`rotate(${gesture*24} -64 -198)`}>
    <path d="M-57-209Q-87-211-102-165L-114-114L-178-121L-189-90L-102-77Q-85-77-80-96L-57-151Z" fill="#46BFAE"/>
    <path d="M-104-117L-119-111L-179-120L-184-106L-109-95Z" fill="#32A396"/>
    <path d="M-179-124L-195-126L-203-94L-185-88Z" fill="#A2E9CE"/>
    <path d="M-196-120C-210-129-214-144-220-144Q-229-141-220-121L-234-127L-255-134Q-267-135-261-126L-246-116L-267-120Q-280-119-267-110L-245-102Q-264-104-263-96Q-254-87-232-89L-203-96Z" fill={lilac}/>
  </g>
  <g transform={`translate(-3 -296)`}><SolHead nod={-3+Math.sin(frame/29)*1.4} blink={(frame+81)%167<5?.12:1} speak={gesture*(.4+.6*Math.sin(frame/4)**2)}/></g>
</g>;

/** Rear-view shoulder for the final reaction shot, separately drawn. */
export const SolBack: React.FC<{frame: number}> = ({frame}) => <g transform={`rotate(${Math.sin(frame/45)*.3} 0 -100)`}>
  <path d="M-170 190C-165 30-147-117-68-175L61-171Q174-132 214 40L250 300H-194Z" fill="#164C64"/>
  <path d="M-162 168Q-162-61-89-120L-60-158L-42-134Q-114-17-109 198Z" fill="#227A83"/>
  <path d="M-53-189L64-199L75-144L17-97L-69-133Z" fill="#7F4FA8"/>
  <path d="M-109-301C-129-363-86-403-46-395Q-17-426 29-404Q77-420 102-377Q145-361 125-316L119-218Q93-167 43-161L-53-179Q-106-202-104-249Z" fill={ink}/>
  <path d="M-104-308Q-120-351-82-370Q-72-402-32-382Q1-410 24-388Q61-400 84-373Q26-379 5-343Q-47-365-73-318L-83-242Z" fill="#392065"/>
  <path d="M-105-264Q-133-276-131-250Q-126-223-104-230Z" fill="#9362CA"/>
</g>;

export const Passer: React.FC<{frame: number; variant?: number; near?: boolean}> = ({frame,variant=0,near=false}) => {
  const step=Math.sin(frame/8), other=-step;
  const coat=near?'#200A50':['#351379','#2D0C70','#36118B'][variant%3];
  const face=near?'#553292':'#7447BC';
  const leg=(x:number,p:number,front:boolean)=><g>
    <path d={`M${x-20}-155L${x+22}-155L${x+p*20+7}-73L${x-p*37+13}-8L${x-p*37-10}-6L${x+p*20-15}-78Z`} fill={front?coat:'#1D084F'}/>
    <path d={`M${x-p*37-11}-15L${x-p*37+16}-13L${x-p*37+37} 0Q${x-p*37+41} 10 ${x-p*37+15} 9L${x-p*37-22} 7Z`} fill={near?'#30115C':'#59409D'}/>
  </g>;
  return <g transform={`translate(0 ${-Math.abs(step)*4})`}>
    {leg(-16,other,false)}{leg(23,step,true)}
    <path d="M-31-352Q-77-338-83-284L-70-166Q-25-146 59-165L66-278Q66-335 22-353Z" fill={coat}/>
    <path d="M-15-374L19-369L25-334L-8-317L-30-341Z" fill={face}/>
    <path d="M-24-437Q13-459 37-433L43-407L57-392Q65-382 44-380Q40-353 14-352L-20-368Q-44-400-24-437Z" fill={face}/>
    {variant%2===0?<path d="M-40-405Q-59-456-8-467Q30-482 47-447L44-420Q29-424 19-437L-10-424L-22-396Z" fill="#17053A"/>:<path d="M-38-405Q-64-430-36-450Q-59-477-28-481Q-4-504 10-477Q43-479 46-444L35-425L11-434L-12-417L-21-393Z" fill="#17053A"/>}
    <ellipse cx="25" cy="-399" rx="4" ry="7" fill="#210846"/>
    <path d="M44-290Q64-286 69-259L88-238L104-253L117-239L93-208Q79-197 65-213L31-248Z" fill={coat}/>
    <path d="M102-253Q110-267 120-253L124-238L113-232L104-240Z" fill={face}/>
    <path d="M108-277L131-273L127-240L104-244Z" fill={near?'#765199':'#9B71C8'}/>
    <path d="M112-272L126-269L123-250L109-252Z" fill={near?'#4D2B77':'#7045AC'}/>
    <path d={`M-59-304Q-90-274-67-227L${-53+step*8}-177L${-34+step*8}-185L-38-239L-29-291Z`} fill={coat}/>
  </g>;
};

export const NightStreet: React.FC = () => <g>
  <rect width="1920" height="1080" fill="url(#connection-night)"/>
  <path d="M0 410H130V304H223V365H315V216H408V338H485V280H595V415H692V313H795V189H872V306H955V232H1045V411H1125V292H1240V371H1321V239H1416V319H1545V208H1640V381H1740V286H1849V355H1920V822H0Z" fill="#2A1075"/>
  <path d="M0 118L298 194V810H0Z" fill="#210A58"/>
  <path d="M298 194L409 250V809H298Z" fill="#2B116B"/>
  <path d="M0 129L298 204L409 261V283L295 226L0 150Z" fill="#32147C"/>
  <path d="M18 340L261 392V518L18 475ZM18 559L261 600V727L18 702Z" fill="#2A106D"/>
  <path d="M535 318L778 262L819 284V816H535Z" fill="#230A64"/>
  <path d="M778 262L819 284V816H778Z" fill="#33127F"/>
  <path d="M567 375L744 340V417L567 446ZM567 507L744 484V556L567 578Z" fill="#32127D"/>
  <path d="M925 126H1267V822H925Z" fill="#250B65"/>
  <path d="M1267 126L1380 189V822H1267Z" fill="#2F1079"/>
  <path d="M925 120H1267L1380 184V211L1267 148H925Z" fill="#3D188E"/>
  <path d="M967 205H1227V361H967ZM967 409H1227V568H967Z" fill="#301077"/>
  <path d="M1620 351L1920 275V825H1620Z" fill="#220959"/>
  <path d="M1650 422L1885 366V546L1650 577Z" fill="#2D106E"/>
  <path d="M0 810Q900 765 1920 838V1080H0Z" fill="url(#connection-ground)"/>
  <path d="M0 853Q960 774 1920 874L1920 891Q900 807 0 874Z" fill="#5432AD" opacity=".45"/>
  <path d="M0 1045L1920 933L1920 953L0 1075Z" fill="#381974"/>
  <path d="M1470 0L1591 0L1581 725L1469 724Z" fill="#1E074D"/>
  <path d="M1453 714H1601L1583 755H1468Z" fill="#24105F"/>
  <path d="M1531 144Q1494 104 1444 145L1442 181L1517 183Z" fill="#533A8E"/>
  <path d="M1442 179Q1470 195 1506 181" stroke="#6C50AB" strokeWidth="6" fill="none"/>
</g>;

export const Terrace: React.FC = () => <g>
  <rect width="1920" height="1080" fill="#24175B"/>
  <path d="M0 0H687V730H0Z" fill="url(#connection-day)"/>
  <circle cx="236" cy="243" r="153" fill="#FFF2BC"/>
  <path d="M0 481L68 450V333H112V468L169 455V392H223V464L285 493V362H331V481L384 465V282H421V463L475 440V343H511V477L557 489V391H617V504L688 493V753H0Z" fill="#E6A58E"/>
  <path d="M0 598Q174 520 340 593T696 575V758H0Z" fill="#C88D9E"/>
  <path d="M0 653L687 602V785H0Z" fill="#926CA3"/>
  <path d="M0 728L672 675V706L0 758Z" fill="#D0ADB8"/>
  <path d="M675 0H1310V865H675Z" fill="#2B1A66"/>
  <path d="M675 0H704V812H675Z" fill="#4D3784"/>
  <path d="M705 0H1260V176H705Z" fill="#302173"/>
  <path d="M1260 0H1920V905H1260Z" fill="#35246C"/>
  <path d="M1510 228Q1655 100 1801 229V789H1510Z" fill="#B68192"/>
  <path d="M1540 245Q1656 140 1770 245V766H1540Z" fill="url(#connection-glass)"/>
  <path d="M1688 190L1739 218L1574 764H1542Z" fill="#93E4C8" opacity=".35"/>
  <path d="M1655 172V766" stroke="#366F86" strokeWidth="13"/>
  <path d="M1460 187L1844 175L1873 229L1432 245Z" fill="#17214E"/>
  <path d="M1460 187L1844 175L1849 190L1453 206Z" fill="#4C4B7F"/>
  <path d="M0 791L1260 759L1920 877V1080H0Z" fill="#746193"/>
  <path d="M0 934L793 766L1260 759L668 1080H0Z" fill="#D9999E"/>
  <path d="M33 1080L756 788L835 785L227 1080Z" fill="#E6B4AB"/>
  <path d="M1074 906L1783 1080H1652L1000 930Z" fill="#513E77"/>
  <path d="M0 1070L677 934L885 920L248 1080Z" fill="#A87897" opacity=".6"/>
  <path d="M0 225L118 250V804H0Z" fill="#371C65"/>
  <path d="M118 250L180 290V802L118 825Z" fill="#6A427B"/>
  <path d="M0 219L121 245L188 287V312L118 269L0 244Z" fill="#956191"/>
  <path d="M0 377L118 398M0 539L118 548M0 701L118 695" stroke="#4E2A75" strokeWidth="12"/>
  <path d="M0 188Q66 230 108 181Q169 129 137 94Q194 78 166 29Q125-9 76 19Q18-21-17 36Z" fill="#246C6F"/>
  <path d="M0 166Q41 126 99 159Q148 119 114 91Q159 55 116 33Q80 26 51 57Q18 25 0 49Z" fill="#57B491"/>
  <path d="M1920 0H1368Q1370 80 1462 97Q1495 168 1570 135Q1624 208 1697 158Q1762 227 1821 176Q1882 216 1920 153Z" fill="#153A50"/>
  <path d="M1920 0H1538Q1516 48 1570 69Q1558 132 1637 115Q1677 172 1730 125Q1782 178 1830 128Q1887 160 1920 99Z" fill="#236E70"/>
  <path d="M1920 25Q1746 68 1638 106Q1548 115 1486 81" stroke="#16364F" strokeWidth="21" fill="none"/>
  <path d="M1828 0Q1818 52 1760 70M1709 0Q1736 43 1746 71" stroke="#16364F" strokeWidth="13" fill="none"/>
</g>;

export const Seat: React.FC<{x: number; y: number; mirror?: boolean; scale?: number}> = ({x,y,mirror=false,scale=1}) => <g transform={`translate(${x} ${y}) scale(${(mirror?-1:1)*scale} ${scale})`}>
  <path d="M-98-162Q-111-180-106-132L-77 50L-59 45L-77-157Z" fill="#A25B86"/>
  <path d="M-79 35L88 32L103 52L-73 62Z" fill="#AD6B91"/>
  <path d="M-67 58L-98 246L-83 250L-47 60ZM72 55L115 235L131 235L93 52Z" fill="#321B59"/>
</g>;

export const Table: React.FC<{frame: number}> = ({frame}) => <g>
  <ellipse cx="1028" cy="1010" rx="285" ry="49" fill="#493064" opacity=".3"/>
  <path d="M1054 804L1068 1000L1250 1067L1241 1080L1037 1018L883 1080L858 1071L1025 998L1022 800Z" fill="#382650"/>
  <path d="M682 797Q1022 663 1366 809L1363 842Q1027 981 683 834Z" fill="#99547A"/>
  <ellipse cx="1024" cy="801" rx="344" ry="88" fill="url(#connection-table)" transform="rotate(1 1024 801)"/>
  <path d="M697 827Q1030 938 1354 833" stroke="#F7CBA4" strokeWidth="5" fill="none"/>
  <ellipse cx="1167" cy="799" rx="50" ry="12" fill="#B56E86"/>
  <path d="M1150 756L1185 755L1178 793Q1167 803 1157 792Z" fill="#1A7F83"/>
  <path d="M1165 760Q1126 747 1132 728Q1156 725 1165 750Q1169 710 1194 720Q1197 743 1168 761Z" fill="#236966"/>
  <path d="M1167 779L1166 747" stroke="#78B891" strokeWidth="3" fill="none"/>
  <ellipse cx="1231" cy="764" rx="40" ry="9" fill="#C78288"/>
  <path d="M1245 716Q1277 712 1272 733Q1268 748 1247 742" stroke="#F8D7AC" strokeWidth="8" fill="none"/>
  <path d="M1205 712H1249L1245 748Q1228 759 1209 747Z" fill="#FFE7BA"/>
  <ellipse cx="1227" cy="712" rx="22" ry="6" fill="#6D4270"/>
  <path d={`M1223 697Q${1212+Math.sin(frame/17)*4} 680 1226 667`} stroke="#A5B8B2" strokeWidth="3" fill="none" opacity=".5" strokeLinecap="round"/>
</g>;

export const ForegroundLeaves: React.FC<{frame: number}> = ({frame}) => <g transform={`translate(0 0) rotate(${Math.sin(frame/67)*.45} 100 950)`}>
  <path d="M-36 1080L90 1080L125 910L-7 921Z" fill="#1A133C"/>
  <path d="M54 941Q-56 852-10 772Q64 788 68 904Q33 750 106 680Q164 737 93 897Q166 766 248 807Q236 897 90 938Z" fill="#164F65"/>
  <path d="M65 930Q-20 844 4 799Q52 825 65 930M82 920Q92 777 111 721Q136 783 82 920M96 923Q177 824 217 827Q192 890 96 923" fill="#2C8F8B"/>
  <path d="M61 962L111 734M65 957L13 825M73 956L204 842" stroke="#65B99B" strokeWidth="4" fill="none"/>
</g>;
