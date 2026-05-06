import React from 'react';
import { Composition } from 'remotion';
import { Short } from './Short';
import { Long } from './Long';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ShortTest" component={Short} durationInFrames={450} fps={30} width={1080} height={1920} />
    <Composition id="LongTest" component={Long} durationInFrames={900} fps={30} width={1080} height={1920} />
  </>
);
