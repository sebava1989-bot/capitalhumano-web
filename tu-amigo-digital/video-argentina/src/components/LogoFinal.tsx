import React from 'react';
import { useFadeIn, useSlideUp } from '../utils/spring';

interface LogoFinalProps {
  startFrame: number;
  showWhatsapp?: boolean;
}

export const LogoFinal: React.FC<LogoFinalProps> = ({ startFrame, showWhatsapp = false }) => {
  const opacity = useFadeIn(startFrame, 30);
  const y = useSlideUp(startFrame, 30, 30);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        textAlign: 'center',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        style={{
          fontSize: 80,
          fontWeight: 900,
          color: '#fff',
          letterSpacing: -2,
          lineHeight: 1.1,
        }}
      >
        Tu Amigo{' '}
        <span style={{ color: '#0071e3' }}>Digital</span>
      </div>
      <div style={{ fontSize: 36, color: '#74ACDF', marginTop: 20 }}>
        tuamigodigital.cl
      </div>
      {showWhatsapp && (
        <div style={{ fontSize: 28, color: '#888', marginTop: 16 }}>
          📲 +56 9 7154 2893
        </div>
      )}
    </div>
  );
};
