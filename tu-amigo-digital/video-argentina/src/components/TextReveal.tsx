import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface TextRevealProps {
  children: React.ReactNode;
  startFrame: number;
  durationFrames: number;
  style?: React.CSSProperties;
}

export const TextReveal: React.FC<TextRevealProps> = ({
  children,
  startFrame,
  durationFrames,
  style,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [startFrame, startFrame + durationFrames], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        clipPath: `inset(0 ${100 - progress}% 0 0)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
