import React from 'react';
import { Composition } from 'remotion';
import { Short } from './Short';
import { Long } from './Long';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ShortVertical"
        component={Short}
        durationInFrames={510}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{}}
      />
      <Composition
        id="ShortHorizontal"
        component={Short}
        durationInFrames={510}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="LongVertical"
        component={Long}
        durationInFrames={990}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{}}
      />
      <Composition
        id="LongHorizontal"
        component={Long}
        durationInFrames={990}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
