import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { TextReveal } from './components/TextReveal';
import { MapSudamerica } from './components/MapSudamerica';
import { ParticleBurst } from './components/ParticleBurst';
import { ServiceCards } from './components/ServiceCards';
import { LogoFinal } from './components/LogoFinal';

const WordReveal: React.FC<{ text: string; startFrame: number; style?: React.CSSProperties }> = ({
  text,
  startFrame,
  style,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 16px', justifyContent: 'center', ...style }}>
      {words.map((word, i) => {
        const delay = startFrame + i * 8;
        const opacity = interpolate(frame, [delay, delay + 12], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const y = interpolate(frame, [delay, delay + 12], [20, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <span key={i} style={{ display: 'inline-block', opacity, transform: `translateY(${y}px)` }}>
            {word}
          </span>
        );
      })}
    </div>
  );
};

export const Long: React.FC = () => {
  const frame = useCurrentFrame();

  const introOpacity = interpolate(frame, [95, 120], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const stepOpacity = frame >= 120 && frame < 240
    ? interpolate(frame, [215, 240], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 0;
  const argOpacity = frame >= 240 && frame < 440
    ? interpolate(frame, [415, 440], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 0;
  const taglineOpacity = frame >= 600 && frame < 770
    ? interpolate(frame, [745, 770], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 0;
  const contactOpacity = frame >= 750 && frame < 855
    ? interpolate(frame, [830, 855], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
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
      {frame < 125 && (
        <div style={{ position: 'absolute', opacity: introOpacity, textAlign: 'center', padding: '0 80px' }}>
          <WordReveal
            text="En Chile ayudamos a negocios a crecer digitalmente"
            startFrame={5}
            style={{ fontSize: 64, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}
          />
        </div>
      )}

      {frame >= 115 && frame < 245 && (
        <div style={{ position: 'absolute', opacity: stepOpacity, textAlign: 'center', padding: '0 80px' }}>
          <TextReveal startFrame={125} durationFrames={50}>
            <div style={{ fontSize: 72, fontWeight: 900, color: '#fff', lineHeight: 1.3 }}>
              Hoy,<br />
              <span style={{ color: '#0071e3' }}>damos el siguiente paso.</span>
            </div>
          </TextReveal>
        </div>
      )}

      {frame >= 235 && frame < 445 && (
        <div style={{ position: 'absolute', opacity: argOpacity || 1 }}>
          <MapSudamerica startFrame={240} highlightArgentina={frame >= 300} />
        </div>
      )}
      {frame >= 300 && frame < 445 && (
        <>
          <ParticleBurst startFrame={300} durationFrames={100} count={80} />
          <div style={{ position: 'absolute', textAlign: 'center', opacity: argOpacity, padding: '0 40px' }}>
            <TextReveal startFrame={315} durationFrames={50}>
              <div style={{ fontSize: 84, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                Llegamos a<br />
                <span style={{ color: '#74ACDF' }}>Argentina 🇦🇷</span>
              </div>
            </TextReveal>
          </div>
        </>
      )}

      {frame >= 420 && frame < 620 && (
        <div style={{ position: 'absolute', width: '100%' }}>
          <ServiceCards startFrame={425} />
        </div>
      )}

      {frame >= 595 && frame < 775 && (
        <div style={{ position: 'absolute', textAlign: 'center', opacity: taglineOpacity, padding: '0 60px' }}>
          <WordReveal
            text="Porque tu negocio merece un amigo digital"
            startFrame={605}
            style={{ fontSize: 68, fontWeight: 900, color: '#fff', lineHeight: 1.4 }}
          />
        </div>
      )}

      {frame >= 745 && frame < 860 && (
        <div style={{ position: 'absolute', textAlign: 'center', opacity: contactOpacity }}>
          <div style={{ fontSize: 52, color: '#74ACDF', fontWeight: 700 }}>tuamigodigital.cl</div>
          <div style={{ fontSize: 40, color: '#888', marginTop: 20 }}>📲 +56 9 7154 2893</div>
        </div>
      )}

      {frame >= 840 && (
        <div style={{ position: 'absolute' }}>
          <LogoFinal startFrame={845} showWhatsapp={false} />
        </div>
      )}
    </AbsoluteFill>
  );
};
