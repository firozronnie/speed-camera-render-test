import React from 'react';
import {Composition} from 'remotion';
import {SpeedCameraFull} from './SpeedCameraFull';

export const Root: React.FC = () => {
  return (
    <Composition
      id="SpeedCameraFull"
      component={SpeedCameraFull}
      durationInFrames={1732}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
