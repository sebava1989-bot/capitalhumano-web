import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { TextReveal } from './TextReveal';

const APPS = [
  { emoji: '📷', name: 'LensLingo', desc: 'Traducción por cámara' },
  { emoji: '🤝', name: 'Alma AI', desc: 'Tu compañero emocional' },
  { emoji: '👥', name: 'CapitalHumano', desc: 'Gestión de RR.HH.' },
  { emoji: '✂️', name: 'barberDesk', desc: 'Sistema para barberías' },
  { emoji: '💪', name: 'FitPulse', desc: 'Fitness para gimnasios' },
  { emoji: '🥑', name: 'KetoSmart', desc: 'Dieta keto inteligente' },
];

interface AppShowcaseProps {
  startFrame: number;
}

export const AppShowcase: React.FC<AppShowcaseProps> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ textAlign: 'center', width: '100%', padding: '0 40px' }}>
      <TextReveal startFrame={startFrame} durationFrames={25}>
        <div style={{ fontSize: 52, fontWeight: 900, color: '#fff', marginBottom: 32 }}>
          Nuestras <span style={{ color: '#0071e3' }}>Apps</span>
        </div>
      </TextReveal>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        {APPS.map((app, i) => {
          const delay = startFrame + 20 + i * 6;
          const s0 = spring({ frame: frame - delay, fps, config: { damping: 20 } });
          const y = interpolate(s0, [0, 1], [40, 0]);
          const opacity = interpolate(s0, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' });

          return (
            <div
              key={app.name}
              style={{
                transform: `translateY(${y}px)`,
                opacity,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 16,
                padding: '20px 16px',
                border: '1px solid rgba(116,172,223,0.3)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 48 }}>{app.emoji}</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: '#fff', marginTop: 8 }}>
                {app.name}
              </div>
              <div style={{ fontSize: 20, color: '#74ACDF', marginTop: 4 }}>{app.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
