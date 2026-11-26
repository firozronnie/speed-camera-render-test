import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {getFullShotState, type FullDriverState} from './scene/shots-full';
import {World} from './scene/world';
import {CarBody} from './scene/car';
import {Driver} from './scene/driver';

/** Drives the three.js camera from the measured full shot plan every frame. */
function CameraRig() {
	const frame = useCurrentFrame();
	const camera = useThree((s) => s.camera);
	useFrame(() => {
		const st = getFullShotState(frame);
		camera.position.set(st.camPos[0], st.camPos[1], st.camPos[2]);
		camera.lookAt(st.camLook[0], st.camLook[1], st.camLook[2]);
	});
	return null;
}

/** One-time image-based lighting so metallic paint and chrome read as glossy
 *  instead of black (no env map = metals reflect darkness). */
function Environment() {
	const scene = useThree((s) => s.scene);
	const gl = useThree((s) => s.gl);
	React.useMemo(() => {
		const pmrem = new THREE.PMREMGenerator(gl);
		const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
		scene.environment = envTex;
		scene.environmentIntensity = 0.55;
		pmrem.dispose();
	}, [scene, gl]);
	return null;
}

function DriverView({d, frame}: {d: FullDriverState; frame: number}) {
	return (
		<Driver
			position={[d.x, d.y, d.z]}
			yaw={d.yaw}
			shirt={d.shirt}
			seated={d.seated}
			emotion={d.emotion}
			frame={frame}
			steering={d.steering}
			pointing={d.pointing}
			scale={d.scale}
			walk={d.walk}
			pose={d.pose}
			skeleton={d.skeleton}
			redFace={d.redFace}
			noShadow={d.noShadow}
		/>
	);
}

function Scene() {
	const frame = useCurrentFrame();
	const st = getFullShotState(frame);
	return (
		<>
			<CameraRig />
			<Environment />
			<World
				frame={frame}
				signFlip={st.signFlip}
				showSlow={st.showSlow}
				navy={st.navy}
				room={st.room}
				poleDisplay={st.poleDisplay}
				showProps={st.props}
			/>
			{st.cars.map((car, i) => (
				<group key={i} position={[car.x, 0, car.z]} rotation={[0, car.rotY, 0]}>
					<CarBody color={car.color} brake={car.brake} wheelSpin={car.wheelSpin} />
				</group>
			))}
			{st.driver && <DriverView d={st.driver} frame={frame} />}
			{st.extraDrivers.map((d, i) => (
				<DriverView key={i} d={d} frame={frame} />
			))}
		</>
	);
}

export const SpeedCameraFull: React.FC = () => {
	const frame = useCurrentFrame();
	const st = getFullShotState(frame);
	return (
		<AbsoluteFill style={{backgroundColor: '#8FC3EE'}}>
			<ThreeCanvas
				width={1080}
				height={1920}
				camera={{fov: 50, near: 0.1, far: 400, position: [0, 2, 10]}}
				style={{width: '100%', height: '100%'}}
			>
				<Scene />
			</ThreeCanvas>
			{/* the full voiceover, mixed in from the public folder */}
			<Audio src={staticFile('speed-camera-voice-1.2x.mp3')} />
			{/* camera-flash moment (X-ray gag, good-driver flashes): brief white light */}
			{st.flash && (
				<div
					style={{
						position: 'absolute',
						inset: 0,
						backgroundColor: '#FFFFFF',
						opacity: 0.85,
						pointerEvents: 'none',
					}}
				/>
			)}
			{/* HUD scoreboard number — screen-space overlay, top centre */}
			{st.hud && (
				<div
					style={{
						position: 'absolute',
						top: 110,
						left: 0,
						right: 0,
						textAlign: 'center',
						fontSize: 118,
						fontWeight: 900,
						fontFamily: "'Arial Black', 'DejaVu Sans', sans-serif",
						color: st.hud.color,
						textShadow: `0 0 28px ${st.hud.color}, 0 4px 0 rgba(0,0,0,0.35)`,
						letterSpacing: 2,
					}}
				>
					{st.hud.text}
				</div>
			)}
		</AbsoluteFill>
	);
};
