import React from 'react';
import { AbsoluteFill, Composition } from 'remotion';
import { TextReveal } from './components/TextReveal';

const TestComp: React.FC = () => (
  <AbsoluteFill style={{ background: '#000', justifyContent: 'center', alignItems: 'center' }}>
    <TextReveal startFrame={10} durationFrames={40}>
      <div style={{ color: '#fff', fontSize: 80, fontWeight: 900 }}>Tu Amigo Digital</div>
    </TextReveal>
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <Composition id="Test" component={TestComp} durationInFrames={120} fps={30} width={1080} height={1080} />
);
