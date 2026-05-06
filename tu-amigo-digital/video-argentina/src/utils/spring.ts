import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export function useFadeIn(startFrame: number, durationFrames: number): number {
  const frame = useCurrentFrame();
  return interpolate(frame, [startFrame, startFrame + durationFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

export function useFadeOut(startFrame: number, durationFrames: number): number {
  const frame = useCurrentFrame();
  return interpolate(frame, [startFrame, startFrame + durationFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

export function useSlideUp(startFrame: number, durationFrames: number, distance = 60): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - startFrame, fps, config: { damping: 18, stiffness: 120 } });
  return interpolate(s, [0, 1], [distance, 0]);
}

export function useProgress(startFrame: number, endFrame: number): number {
  const frame = useCurrentFrame();
  return interpolate(frame, [startFrame, endFrame], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}
