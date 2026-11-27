import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {makeCar} from './scene/car';
import {makeDriver} from './scene/driver';
import {makeProp} from './scene/props';
import {getFullShotState, HEIGHT, type FullShotState, WIDTH} from './scene/shots-full';
import {makeWorld} from './scene/world';

const buildScene = (state: FullShotState): THREE.Scene => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(state.night ? '#081229' : '#8CC7EA');
  scene.fog = new THREE.FogExp2(state.night ? '#081229' : '#C8DDE8', 0.011);

  scene.add(
    makeWorld({
      night: state.night,
      pole: state.pole,
      display: state.poleDisplay,
    }),
  );

  for (const car of state.cars) scene.add(makeCar(car));
  for (const driver of state.drivers) scene.add(makeDriver(driver));
  for (const prop of state.props) scene.add(makeProp(prop));

  return scene;
};

const buildCamera = (state: FullShotState): THREE.PerspectiveCamera => {
  const camera = new THREE.PerspectiveCamera(state.camera.fov, WIDTH / HEIGHT, 0.1, 400);
  camera.position.set(
    state.camera.position[0],
    state.camera.position[1],
    state.camera.position[2],
  );
  camera.lookAt(
    state.camera.lookAt[0],
    state.camera.lookAt[1],
    state.camera.lookAt[2],
  );
  return camera;
};

export const SpeedCameraFull: React.FC = () => {
  const frame = useCurrentFrame();
  const state = useMemo(() => getFullShotState(frame), [frame]);
  const scene = useMemo(() => buildScene(state), [state]);
  const camera = useMemo(() => buildCamera(state), [state]);

  const hud = state.hud;
  const fontSize = hud && hud.text.length > 13 ? 70 : hud && hud.text.length > 9 ? 84 : 106;

  return (
    <AbsoluteFill style={{backgroundColor: '#000000'}}>
      <Audio src={staticFile('speed-camera-voice-1.2x.mp3')} />
      <ThreeCanvas
        width={WIDTH}
        height={HEIGHT}
        camera={camera}
        style={{width: '100%', height: '100%'}}
        gl={{antialias: true, alpha: false, powerPreference: 'high-performance'}}
        onCreated={({gl}) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.12;
          gl.setClearColor(state.night ? '#081229' : '#8CC7EA');
        }}
      >
        <primitive object={scene} />
      </ThreeCanvas>

      {hud ? (
        <div
          style={{
            position: 'absolute',
            top: '6.5%',
            left: '7%',
            width: '86%',
            textAlign: 'center',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              maxWidth: '100%',
              padding: '18px 32px',
              borderRadius: 28,
              background: 'rgba(8,14,26,0.66)',
              border: `5px solid ${hud.color}`,
              boxShadow: '0 12px 34px rgba(0,0,0,0.38)',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                fontFamily: 'Arial Black, Impact, Arial, sans-serif',
                fontSize,
                fontWeight: 900,
                lineHeight: 1.08,
                letterSpacing: 2,
                color: hud.color,
                textShadow: '0 5px 0 rgba(0,0,0,0.55)',
                whiteSpace: 'nowrap',
              }}
            >
              {hud.text}
            </div>
            {hud.sub ? (
              <div
                style={{
                  fontFamily: 'Arial, sans-serif',
                  fontSize: 44,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  marginTop: 8,
                }}
              >
                {hud.sub}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {state.flash > 0 ? (
        <AbsoluteFill
          style={{
            backgroundColor: '#FFFFFF',
            opacity: state.flash,
            zIndex: 4,
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
