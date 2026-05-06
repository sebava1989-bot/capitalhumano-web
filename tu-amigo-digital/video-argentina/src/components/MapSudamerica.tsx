import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface MapSudamericaProps {
  startFrame: number;
  highlightArgentina?: boolean;
}

export const MapSudamerica: React.FC<MapSudamericaProps> = ({
  startFrame,
  highlightArgentina = false,
}) => {
  const frame = useCurrentFrame();

  const mapOpacity = interpolate(frame, [startFrame, startFrame + 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const argOpacity = highlightArgentina
    ? interpolate(frame, [150, 180], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  const chileGlow = interpolate(frame, [startFrame + 10, startFrame + 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ opacity: mapOpacity, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg
        viewBox="0 0 400 560"
        width={320}
        height={448}
        style={{ filter: 'drop-shadow(0 0 20px rgba(0,113,227,0.3))' }}
      >
        {/* Contorno Sudamérica */}
        <path
          d="M165,18 C190,8 225,15 260,32 C298,50 328,82 345,120 C362,158 368,200 362,242 C355,285 338,324 314,358 C290,392 262,422 232,445 C210,462 186,470 165,462 C145,452 130,432 118,408 C104,380 96,348 90,314 C82,272 78,228 80,184 C82,140 92,98 112,62 C132,28 148,22 165,18 Z"
          fill="#111"
          stroke="#333"
          strokeWidth="2"
        />

        {/* Chile — franja costera oeste-sur */}
        <path
          d="M88,280 C88,248 90,214 95,182 C80,185 78,228 80,272 C82,310 88,348 96,382 C104,414 118,442 134,458 C140,448 144,434 142,418 C138,398 130,374 124,348 C116,318 108,300 88,280 Z"
          fill="#0071e3"
          opacity={chileGlow}
          style={{ filter: `drop-shadow(0 0 ${chileGlow * 12}px #0071e3)` }}
        />

        {/* Chile label */}
        <text
          x="52"
          y="340"
          fill="#0071e3"
          fontSize="18"
          fontWeight="bold"
          opacity={chileGlow}
          fontFamily="Inter, sans-serif"
        >
          Chile ★
        </text>

        {/* Argentina — zona sur grande */}
        <path
          d="M165,340 C185,345 210,348 232,345 C262,340 290,318 314,295 C314,325 308,358 290,390 C272,420 248,444 220,456 C205,462 186,470 165,462 C145,452 130,432 118,408 C108,388 100,365 96,340 C110,348 135,342 165,340 Z"
          fill="#74ACDF"
          opacity={argOpacity * 0.6}
          style={{
            filter: argOpacity > 0.1 ? `drop-shadow(0 0 ${argOpacity * 20}px #74ACDF)` : 'none',
          }}
        />

        {/* Argentina label */}
        <text
          x="148"
          y="418"
          fill="#74ACDF"
          fontSize="20"
          fontWeight="bold"
          opacity={argOpacity}
          fontFamily="Inter, sans-serif"
        >
          Argentina ★
        </text>
      </svg>
    </div>
  );
};
