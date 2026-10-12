import React from 'react';

interface EmblemProps {
  className?: string;
  size?: number;
}

export const TamilNaduPoliceEmblem: React.FC<EmblemProps> = ({ className = '', size = 70 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Tamil Nadu Police Emblem"
    >
      {/* Outer Circle */}
      <circle cx="80" cy="80" r="74" stroke="#000000" strokeWidth="2.5" />
      <circle cx="80" cy="80" r="69" stroke="#000000" strokeWidth="1" strokeDasharray="2,2" />
      <circle cx="80" cy="80" r="54" stroke="#000000" strokeWidth="1.5" />

      {/* Top Curved Text: TAMIL NADU POLICE */}
      <path id="curveTop" d="M 28 80 A 52 52 0 0 1 132 80" fill="none" />
      <text fill="#000000" fontSize="9.5" fontWeight="bold" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="1.2">
        <textPath href="#curveTop" startOffset="50%" textAnchor="middle">
          TAMIL NADU POLICE
        </textPath>
      </text>

      {/* Star Accents */}
      <circle cx="34" cy="81" r="2" fill="#000000" />
      <circle cx="126" cy="81" r="2" fill="#000000" />

      {/* Central Gopuram (Temple Tower) */}
      <g transform="translate(80, 78) scale(0.82)">
        {/* Kalasam & Indian Flag at Peak */}
        <line x1="0" y1="-50" x2="0" y2="-32" stroke="#000000" strokeWidth="1.5" />
        <path d="M 0 -50 L 14 -46 L 0 -42 Z" fill="#000000" />
        <circle cx="0" cy="-33" r="2" fill="#000000" />

        {/* Tier 1 (Topmost) */}
        <polygon points="-8,-31 8,-31 6,-25 -6,-25" fill="#000000" />
        <rect x="-4" y="-25" width="8" height="2" fill="#FFFFFF" />

        {/* Tier 2 */}
        <polygon points="-12,-24 12,-24 10,-17 -10,-17" fill="#000000" />
        <line x1="-8" y1="-21" x2="8" y2="-21" stroke="#FFFFFF" strokeWidth="1" />

        {/* Tier 3 */}
        <polygon points="-16,-16 16,-16 14,-8 -14,-8" fill="#000000" />
        <rect x="-10" y="-13" width="5" height="4" fill="#FFFFFF" />
        <rect x="5" y="-13" width="5" height="4" fill="#FFFFFF" />

        {/* Tier 4 */}
        <polygon points="-21,-7 21,-7 19,3 -19,3" fill="#000000" />
        <line x1="-15" y1="-2" x2="15" y2="-2" stroke="#FFFFFF" strokeWidth="1" />

        {/* Tier 5 (Base Pillar & Arch) */}
        <polygon points="-26,4 26,4 24,18 -24,18" fill="#000000" />
        {/* Temple Doorway / Arch */}
        <path d="M -8,18 L -8,9 A 8,8 0 0,1 8,9 L 8,18 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="0.8" />

        {/* Plinth Base */}
        <rect x="-30" y="18" width="60" height="4" fill="#000000" />
      </g>

      {/* Laurel Wreath on Left and Right */}
      <path
        d="M 40 85 C 38 72 43 60 52 50 C 47 62 49 76 52 86"
        stroke="#000000"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M 120 85 C 122 72 117 60 108 50 C 113 62 111 76 108 86"
        stroke="#000000"
        strokeWidth="1.2"
        fill="none"
      />

      {/* Bottom Ribbon / Banner */}
      <path
        d="M 32 128 L 44 122 L 56 126 L 104 126 L 116 122 L 128 128 L 120 138 L 104 134 L 56 134 L 40 138 Z"
        fill="#FFFFFF"
        stroke="#000000"
        strokeWidth="1.2"
      />
      <text
        x="80"
        y="132"
        fill="#000000"
        fontSize="6.5"
        fontWeight="bold"
        fontFamily="Arial, Helvetica, sans-serif"
        textAnchor="middle"
        letterSpacing="0.8"
      >
        TRUTH ALONE TRIUMPHS
      </text>
    </svg>
  );
};
