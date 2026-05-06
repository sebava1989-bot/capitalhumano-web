import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { TextReveal } from './components/TextReveal';
import { MapSudamerica } from './components/MapSudamerica';
import { ParticleBurst } from './components/ParticleBurst';
import { ServiceCards } from './components/ServiceCards';
import { AppShowcase } from './components/AppShowcase';
import { LogoFinal } from './components/LogoFinal';

// Frame schedule (510 frames = 17s @ 30fps):
// 0-60:   Título "Tu Amigo Digital"
// 60-150: Mapa Sudamérica + Chile brilla
// 150-270: Burst partículas + "Llegamos a Argentina"
// 270-345: 3 servicios
// 345-435: Nuestras Apps (6 apps grid)
// 435-510: Logo final + URL

export const Short: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = frame < 130
    ? 1
    : interpolate(frame, [130, 155], [1, 0], { extrapolateRight: 'clamp' });

  const mapOpacity = interpolate(frame, [55, 85, 255, 280], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const argTextOpacity = frame >= 160 && frame < 280
    ? interpolate(frame, [255, 280], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 0;

  return (
    <AbsoluteFill
      style={{
        background: '#000',
        fontFamily: 'Inter, sans-serif',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Escena 1: Título */}
      <div style={{ position: 'absolute', opacity: titleOpacity, textAlign: 'center', padding: '0 60px' }}>
        <TextReveal startFrame={5} durationFrames={55}>
          <div style={{ fontSize: 96, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
            Tu Amigo<br />
            <span style={{ color: '#0071e3' }}>Digital</span>
          </div>
        </TextReveal>
      </div>

      {/* Escena 2: Mapa */}
      {frame >= 55 && frame < 285 && (
        <div style={{ position: 'absolute', opacity: mapOpacity }}>
          <MapSudamerica startFrame={60} highlightArgentina={frame >= 150} />
        </div>
      )}

      {/* Escena 3: Partículas + texto Argentina */}
      {frame >= 150 && frame < 285 && (
        <>
          <ParticleBurst startFrame={150} durationFrames={90} />
          <div
            style={{
              position: 'absolute',
              textAlign: 'center',
              opacity: argTextOpacity,
              padding: '0 40px',
            }}
          >
            <TextReveal startFrame={162} durationFrames={45}>
              <div style={{ fontSize: 88, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                Llegamos a<br />
                <span style={{ color: '#74ACDF' }}>Argentina 🇦🇷</span>
              </div>
            </TextReveal>
          </div>
        </>
      )}

      {/* Escena 4: Servicios */}
      {frame >= 270 && frame < 350 && (
        <div style={{ position: 'absolute', width: '100%' }}>
          <ServiceCards startFrame={272} />
        </div>
      )}

      {/* Escena 5: Nuestras Apps */}
      {frame >= 345 && frame < 440 && (
        <div style={{ position: 'absolute', width: '100%' }}>
          <AppShowcase startFrame={347} />
        </div>
      )}

      {/* Escena 6: Logo final */}
      {frame >= 435 && (
        <div style={{ position: 'absolute' }}>
          <LogoFinal startFrame={437} />
        </div>
      )}
    </AbsoluteFill>
  );
};
