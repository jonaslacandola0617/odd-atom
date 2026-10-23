import React from 'react';

const Window: React.FC<{x: number; y: number; w?: number; h?: number; warm?: boolean}> = ({x,y,w=78,h=126,warm=false}) => <g transform={`translate(${x} ${y})`}>
  <path d={`M0 ${h}V${w/2}Q0 0 ${w/2} 0Q${w} 0 ${w} ${w/2}V${h}Z`} fill={warm?'#D9A270':'#73508F'} />
  <path d={`M9 ${h-8}V${w/2}Q9 10 ${w/2} 10Q${w-9} 10 ${w-9} ${w/2}V${h-8}Z`} fill={warm?'#F3C98C':'#4F3676'} />
  <path d={`M${w/2} 13V${h}M8 ${h*.58}H${w-8}`} stroke={warm?'#BD7E62':'#856099'} strokeWidth="8" />
  <path d={`M0 ${h}H${w}`} stroke={warm?'#E4B181':'#90679E'} strokeWidth="12" strokeLinecap="round" />
  <path d={`M13 ${h*.5}L${w-14} ${h*.22}`} stroke={warm?'#FFE5A6':'#9871AA'} strokeWidth="8" opacity=".27" />
</g>;

export const StreetArt: React.FC = () => <g>
  <defs>
    <linearGradient id="street-sky" x2="0" y2="1"><stop stopColor="#30135A" /><stop offset="1" stopColor="#6A2B77" /></linearGradient>
    <linearGradient id="street-ground" x2="0" y2="1"><stop stopColor="#4E3164" /><stop offset="1" stopColor="#2B2147" /></linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#street-sky)" />
  <path d="M0 250H140V170H300V250H400V100H520V270H650V160H740V330H900V205H1080V280H1250V150H1370V290H1550V130H1660V280H1830V230H1920V830H0Z" fill="#492A66" />
  <path d="M0 260H445L520 323V828H0Z" fill="#4F306C" />
  <path d="M0 260H445V828H0Z" fill="#512478" />
  <path d="M445 260L520 323V828H445Z" fill="#3B2857" />
  <path d="M-25 277H450M-25 550H450M-25 775H450" stroke="#7B508E" strokeWidth="15" />
  {[70,260].map(x=><g key={x}><Window x={x} y={322} w={107} h={150} /><Window x={x} y={599} w={107} h={145} /></g>)}
  <path d="M500 390L895 342V827H500Z" fill="#51316B" />
  <path d="M500 390L895 342V373L500 421Z" fill="#8D5C96" />
  {[550,696,825].map((x,i)=><g key={x}><Window x={x} y={450-i*15} w={62} h={110} /><Window x={x} y={640-i*15} w={62} h={112} /></g>)}
  <path d="M920 195H1345V826H920Z" fill="#482367" />
  <path d="M920 195H1345V225H920Z" fill="#85518B" />
  <path d="M940 225V800M1320 225V800" stroke="#6E437D" strokeWidth="15" />
  {[980,1160].map(x=><g key={x}><Window x={x} y={280} w={93} h={140} /><Window x={x} y={510} w={93} h={150} /></g>)}
  <path d="M1410 130H1920V825H1410Z" fill="#6B427D" />
  <path d="M1410 130H1920V163H1410Z" fill="#A26991" />
  <Window x={1480} y={230} w={120} h={180} warm /><Window x={1700} y={230} w={120} h={180} />
  <path d="M1447 789V586Q1447 465 1600 465Q1753 465 1753 586V789Z" fill="#44305E" />
  <path d="M1467 789V586Q1467 488 1600 488Q1733 488 1733 586V789Z" fill="#BA887C" />
  <path d="M1600 489V791M1467 633H1733" stroke="#61415F" strokeWidth="14" />
  <path d="M1402 536H1790L1825 603H1384Z" fill="#3D756F" />
  <path d="M1435 536H1473L1466 603H1420ZM1534 536H1572L1570 603H1528ZM1633 536H1671L1675 603H1635ZM1732 536H1770L1788 603H1740Z" fill="#83AEA0" />
  <path d="M1383 603H1826" stroke="#28535E" strokeWidth="13" />
  <rect y="819" width="1920" height="261" fill="url(#street-ground)" />
  <path d="M0 820H1920M0 866H1920M0 946H1920M0 1068H1920" stroke="#644274" strokeWidth="5" />
  {[-400,0,400,800,1200,1600,2000].map(x=><path key={x} d={`M960 820L${x} 1080`} stroke="#664477" strokeWidth="3" opacity=".5" />)}
  <path d="M0 821H1920" stroke="#9A6E9A" strokeWidth="13" />
  <g transform="translate(1760 325)"><path d="M0 0V510M-36 510H36" stroke="#392B4E" strokeWidth="15" strokeLinecap="round" /><path d="M-32-10Q0-65 32-10L24 28H-24Z" fill="#E6B880" /><path d="M-32-10H32M-24 28H24" stroke="#3E3053" strokeWidth="9" /><path d="M0-51V-66" stroke="#3E3053" strokeWidth="8" strokeLinecap="round" /></g>
  <g transform="translate(90 838)"><path d="M-75-60H65L48 36H-55Z" fill="#3E2B55" /><path d="M-90-64Q-110-138-58-147Q-73-208-20-224Q15-237 27-184Q66-220 89-177Q122-130 69-101Q118-72 62-52Z" fill="#392950" /><path d="M-45-81Q-64-147-32-153Q-7-163 0-125Q23-166 50-136Q79-102 29-68Z" fill="#573667" /></g>
</g>;

export const CafeArt: React.FC = () => <g>
  <defs>
    <linearGradient id="cafe-light" x2="0" y2="1"><stop stopColor="#F8D58F" /><stop offset="1" stopColor="#D48E73" /></linearGradient>
    <linearGradient id="cafe-floor" x2="0" y2="1"><stop stopColor="#B87876" /><stop offset="1" stopColor="#74536E" /></linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="#6C4376" />
  <path d="M0 0H580V815H0Z" fill="#563565" />
  <path d="M0 215H500M0 430H500M0 650H500" stroke="#664171" strokeWidth="11" />
  {[95,290,455].map(x=><g key={x}><path d={`M${x} 0V817`} stroke="#764A7C" strokeWidth="4" /><path d={`M${x-70} 320H${x}M${x-70} 543H${x}`} stroke="#744A7C" strokeWidth="4" /></g>)}
  <path d="M520 834V337Q520 106 952 106Q1384 106 1384 337V834Z" fill="#A96D79" />
  <path d="M551 834V337Q551 137 952 137Q1353 137 1353 337V834Z" fill="url(#cafe-light)" />
  <path d="M552 565H1353M952 138V832" stroke="#8F6172" strokeWidth="18" />
  <path d="M680 191L571 583M1078 183L900 829M1233 252L1069 829" stroke="#FFE8AD" strokeWidth="56" opacity=".15" />
  <path d="M563 795H1343V828H563Z" fill="#95667A" />
  <g opacity=".55" fill="#BB847B"><path d="M600 791V682Q600 633 658 633Q716 633 716 682V791Z" /><path d="M1135 791V668Q1135 608 1207 608Q1280 608 1280 668V791Z" /></g>
  <path d="M1425 142H1920V833H1425Z" fill="#754879" /><Window x={1510} y={232} w={128} h={186} /><Window x={1730} y={232} w={128} h={186} />
  <path d="M449 64H1437L1490 184H410Z" fill="#397E7B" />
  {[480,650,820,990,1160,1330].map(x=><path key={x} d={`M${x} 64H${x+75}L${x+89} 184H${x-12}Z`} fill="#85B7A0" />)}
  <path d="M409 185H1490" stroke="#2D5D64" strokeWidth="17" />
  <path d="M553 832H1352L1592 1080H297Z" fill="url(#cafe-floor)" />
  <path d="M0 834H1920V1080H0Z" fill="#654167" opacity=".34" />
  <path d="M0 883H1920M0 985H1920" stroke="#AA777D" strokeWidth="5" opacity=".5" />
  {[-400,60,520,980,1440,1900,2360].map(x=><path key={x} d={`M960 834L${x} 1080`} stroke="#A8797F" strokeWidth="3" opacity=".4" />)}
  <g transform="translate(1770 790)"><path d="M-70-9H74L54 135H-48Z" fill="#4D3459" /><path d="M-71-12Q-122-77-64-105Q-105-158-47-171Q-76-229-18-246Q22-270 50-210Q100-205 89-157Q147-128 94-74Q124-15 65-1Z" fill="#3B5C60" /><path d="M-45-53Q-70-117-25-125Q-55-172-12-199Q27-219 34-157Q69-172 75-133Q86-94 49-85Q93-37 33-25Z" fill="#4E8171" /><path d="M6-7V-141" stroke="#83A586" strokeWidth="7" strokeLinecap="round" /></g>
  <g transform="translate(100 967)"><path d="M-55-12H50L43 113H-49Z" fill="#3A2B4D" /><path d="M0-15Q-95-16-123-90Q-52-104 0-31Q-58-145-21-196Q37-167 6-40Q65-143 130-113Q117-50 18-19Z" fill="#2F5C61" /><path d="M3-18Q-14-112-20-164M12-20Q76-87 108-100M-9-23Q-79-78-103-82" stroke="#4F8372" strokeWidth="7" fill="none" strokeLinecap="round" /></g>
</g>;

export const Chair: React.FC<{x: number; flip?: boolean}> = ({x,flip=false}) => <g transform={`translate(${x} 0) scale(${flip?-1:1} 1)`}>
  <path d="M-89 713Q-91 694-72 694H-47L-24 811H-71Z" fill="#7B3D5C" />
  <path d="M-79 708H-58L-35 811H-65Z" fill="#B66174" />
  <path d="M-74 806H71L80 825H-74Z" fill="#A7546A" />
  <path d="M-59 821L-76 954M54 821L74 954" stroke="#422E4D" strokeWidth="13" strokeLinecap="round" />
</g>;

export const CafeTable: React.FC = () => <g>
  <ellipse cx="955" cy="950" rx="195" ry="29" fill="#4F345A" opacity=".34" />
  <path d="M955 790V947M955 907L844 968M955 907L1066 968" stroke="#47394F" strokeWidth="16" strokeLinecap="round" />
  <ellipse cx="955" cy="800" rx="207" ry="44" fill="#8D4B62" />
  <ellipse cx="955" cy="787" rx="207" ry="44" fill="#CF8C79" />
  <path d="M759 793Q951 839 1151 794" stroke="#E9AD89" strokeWidth="5" fill="none" />
  <ellipse cx="950" cy="781" rx="37" ry="10" fill="#A16367" />
  <path d="M937 778L932 739H963L958 778Z" fill="#6A9C82" />
  <path d="M947 744Q909 725 917 710Q939 704 947 734Q949 696 972 697Q986 714 952 742Z" fill="#437C6E" />
  <path d="M948 754V724" stroke="#A8C49A" strokeWidth="3" />
</g>;
