import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import type * as THREE from 'three';
import {getCaption, getFullShotState} from './scene/shots-full';
import type {HudSt, Look, PropsSt, Theme, V3} from './scene/shots-full';
import {Car, seatedDriver} from './scene/car';
import {Driver} from './scene/driver';
import {
  Bills,
  Drum,
  Fence,
  FineSign,
  Gantry,
  Ladder,
  LivingRoom,
  Mailbox,
  QMark,
  SlowPaint,
} from './scene/props';
import {CameraPole, OutdoorWorld, SkyDome} from './scene/world';

// Moves the one real camera every frame (no hard cuts: the path is continuous).
const CameraRig: React.FC<{pos: V3; tgt: V3; fov: number}> = ({pos, tgt, fov}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const invalidate = useThree((s) => s.invalidate);
  React.useLayoutEffect(() => {
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.fov = fov;
    camera.near = 0.1;
    camera.far = 600;
    camera.up.set(0, 1, 0);
    camera.lookAt(tgt[0], tgt[1], tgt[2]);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    invalidate();
  });
  return null;
};

const Lights: React.FC<{look: Look; theme: Theme}> = ({look, theme}) => (
  <>
    <ambientLight intensity={look.ambient} />
    <hemisphereLight
      args={[
        theme === 'outdoor' ? '#BFE3FF' : '#6B7FD6',
        theme === 'outdoor' ? '#4C7A3A' : '#1A1030',
        look.hemi,
      ]}
    />
    <directionalLight
      position={look.sunPos}
      color={look.sun}
      intensity={look.sunInt}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-left={-32}
      shadow-camera-right={32}
      shadow-camera-top={32}
      shadow-camera-bottom={-32}
      shadow-camera-near={1}
      shadow-camera-far={140}
      shadow-bias={-0.0004}
    />
    {theme === 'dark' ? (
      <pointLight position={[0, 9, 2]} color="#FFC46B" intensity={140} distance={45} decay={2} />
    ) : null}
    {theme === 'living' ? (
      <>
        <pointLight position={[0, 3, -2]} color="#9DD6FF" intensity={30} distance={14} decay={2} />
        <pointLight position={[-4, 4, 4]} color="#FFD9A0" intensity={60} distance={20} decay={2} />
      </>
    ) : null}
  </>
);

const PropsLayer: React.FC<{p: PropsSt; cam: V3}> = ({p, cam}) => (
  <>
    {p.ladder ? <Ladder /> : null}
    {p.mailbox ? <Mailbox open={p.mailbox.open} /> : null}
    {p.fence ? <Fence /> : null}
    {p.fineSign ? <FineSign flip={p.fineSign.flip} /> : null}
    {p.gantry !== undefined ? <Gantry x={p.gantry} /> : null}
    {p.qMark ? <QMark p={p.qMark.p} s={p.qMark.s} cam={cam} /> : null}
    {p.slowPaint ? <SlowPaint /> : null}
    {p.bills ? p.bills.map((b, i) => <Bills key={`${b.mode}${i}`} b={b} />) : null}
    {p.drum ? <Drum t={p.drum.t} /> : null}
    {p.living ? <LivingRoom /> : null}
  </>
);

// Scoreboard HUD: numbers CHANGE (62 -> 18 -> 62 ...). Digits only ever appear on screen.
const HudBoard: React.FC<{hud: HudSt; frame: number}> = ({hud, frame}) => {
  const age = frame - hud.since;
  const pop = age >= 0 && age < 8 ? 1 + 0.18 * (1 - age / 8) : 1;
  const parts = hud.text.split(' ');
  const line1 = parts.slice(0, 2).join(' ');
  const line2 = parts.slice(2).join(' ');
  return (
    <div
      style={{
        position: 'absolute',
        top: 170,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          transform: `scale(${pop})`,
          padding: '16px 44px',
          borderRadius: 30,
          background: 'rgba(8,10,16,0.82)',
          border: `6px solid ${hud.color}`,
          boxShadow: `0 0 40px ${hud.color}88`,
          textAlign: 'center',
          color: hud.color,
          fontFamily: '"DejaVu Sans Mono", "Courier New", monospace',
          fontWeight: 900,
          lineHeight: 1.05,
        }}
      >
        <div style={{fontSize: 150}}>{line1}</div>
        {line2 ? <div style={{fontSize: 78}}>{line2}</div> : null}
      </div>
    </div>
  );
};

export const SpeedCameraFull: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const st = getFullShotState(frame);
  const caption = getCaption(frame);
  const outdoor = st.theme === 'outdoor';

  return (
    <AbsoluteFill style={{backgroundColor: st.look.bg}}>
      <Audio src={staticFile('speed-camera-voice-1.2x.mp3')} />
      <ThreeCanvas
        width={width}
        height={height}
        shadows
        camera={{fov: st.fov, near: 0.1, far: 600, position: st.camPos}}
      >
        <CameraRig pos={st.camPos} tgt={st.camTgt} fov={st.fov} />
        <color attach="background" args={[st.look.bg]} />
        <fog attach="fog" args={[st.look.fog, st.look.fogNear, st.look.fogFar]} />
        <Lights look={st.look} theme={st.theme} />
        {st.theme !== 'living' ? (
          <SkyDome kind={st.look.sky} sunPos={st.look.sunPos} sunColor={st.look.sun} />
        ) : null}
        <group visible={outdoor}>
          <OutdoorWorld fogColor={st.look.fog} />
        </group>
        {st.theme !== 'living' ? (
          <CameraPole
            display={st.props.poleDisplay}
            displayColor={st.props.poleDisplayColor}
            flash={st.props.flashLens ?? 0}
            jackpot={st.props.jackpot ?? 0}
          />
        ) : null}
        {st.cars.map((c) => {
          const d = seatedDriver(c);
          return (
            <React.Fragment key={c.id}>
              <Car car={c} />
              {d ? <Driver d={d} cam={st.camPos} /> : null}
            </React.Fragment>
          );
        })}
        {st.drivers.map((d) => (
          <Driver key={d.id} d={d} cam={st.camPos} />
        ))}
        <PropsLayer p={st.props} cam={st.camPos} />
      </ThreeCanvas>

      {st.hud ? <HudBoard hud={st.hud} frame={frame} /> : null}

      {st.flash > 0.01 ? (
        <AbsoluteFill style={{background: '#FFFFFF', opacity: Math.min(0.9, st.flash * 0.9), pointerEvents: 'none'}} />
      ) : null}

      {caption ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 230,
            textAlign: 'center',
            color: '#FFFFFF',
            fontFamily: '"Arial Black", "Helvetica Neue", Arial, "DejaVu Sans", sans-serif',
            fontWeight: 900,
            fontSize: 124,
            lineHeight: 1,
            WebkitTextStroke: '14px #000000',
            paintOrder: 'stroke fill',
            textShadow: '0 6px 0 rgba(0,0,0,0.55)',
          }}
        >
          {caption}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
