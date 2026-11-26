import React from 'react';
import {Composition} from 'remotion';
import {SpeedCameraTest} from './SpeedCameraTest';

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
		</>
	);
};
