import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const SERVICES = [
  { emoji: '🌐', title: 'Páginas Web', desc: 'Diseño profesional' },
  { emoji: '🤖', title: 'Apps con IA', desc: 'Tecnología inteligente' },
  { emoji: '📱', title: 'Marketing Digital', desc: 'Crecé online' },
];

interface ServiceCardsProps {
  startFrame: number;
}

export const ServiceCards: React.FC<ServiceCardsProps> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        display: 'flex',
        gap: 48,
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        padding: '0 40px',
      }}
    >
      {SERVICES.map((s, i) => {
        const delay = startFrame + i * 9;
        const s0 = spring({ frame: frame - delay, fps, config: { damping: 20 } });
        const y = interpolate(s0, [0, 1], [80, 0]);
        const opacity = interpolate(s0, [0, 0.3], [0, 1], {
          extrapolateRight: 'clamp',
        });

        return (
          <div
            key={s.title}
            style={{
              transform: `translateY(${y}px)`,
              opacity,
              textAlign: 'center',
              minWidth: 220,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 24,
              padding: '32px 24px',
              border: '1px solid rgba(116,172,223,0.3)',
            }}
          >
            <div style={{ fontSize: 72 }}>{s.emoji}</div>
            <div style={{ fontSize: 38, fontWeight: 700, color: '#fff', marginTop: 12 }}>
              {s.title}
            </div>
            <div style={{ fontSize: 26, color: '#74ACDF', marginTop: 8 }}>{s.desc}</div>
          </div>
        );
      })}
    </div>
  );
};
