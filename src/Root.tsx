import React from 'react';
import {Composition} from 'remotion';
import {SpeedCameraTest} from './SpeedCameraTest';
import {SpeedCameraFull} from './SpeedCameraFull';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="SpeedCameraTest"
				component={SpeedCameraTest}
				durationInFrames={450}
				fps={30}
				width={1080}
				height={1920}
			/>
			<Composition
				id="SpeedCameraFull"
				component={SpeedCameraFull}
				durationInFrames={1732}
				fps={30}
				width={1080}
				height={1920}
			/>
		</>
	);
};
