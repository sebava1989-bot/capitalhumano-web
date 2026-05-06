import React from 'react';
import { interpolate, random, useCurrentFrame } from 'remotion';

interface ParticleData {
  id: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  speed: number;
}

interface ParticleBurstProps {
  startFrame: number;
  count?: number;
  durationFrames?: number;
}

export const ParticleBurst: React.FC<ParticleBurstProps> = ({
  startFrame,
  count = 70,
  durationFrames = 80,
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  if (progress <= 0) return null;

  const particles: ParticleData[] = Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: random(`angle-${i}`) * 360,
    distance: random(`dist-${i}`) * 500 + 120,
    size: random(`size-${i}`) * 14 + 5,
    color: i % 3 === 0 ? '#FFFFFF' : i % 3 === 1 ? '#74ACDF' : '#B0D4F0',
    speed: random(`speed-${i}`) * 0.5 + 0.8,
  }));

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {particles.map((p) => {
        const t = Math.min(progress * p.speed, 1);
        const x = Math.cos((p.angle * Math.PI) / 180) * p.distance * t;
        const y = Math.sin((p.angle * Math.PI) / 180) * p.distance * t;
        const opacity = interpolate(t, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: p.color,
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
};
