import React from 'react';
import * as THREE from 'three';
import type {DriverSt, Emotion, V3} from './shots-full';
import {CheckProp, TabletProp} from './props';

// FLAT 2D character: big round head, dot eyes, thick dark outline, small body.
// Hands and legs are separate pieces with pivots. Always billboarded toward the camera.
// Skin is warm (#F2C29B) per the look rules; change SKIN_DEFAULT to '#FBF6EC' for pure white heads.
const SKIN_DEFAULT = '#F2C29B';
const OUT = '#16120F';
const BONE = '#F4F1E6';

const Disc: React.FC<{r: number; c: string; p?: V3; sx?: number; sy?: number}> = ({
  r,
  c,
  p = [0, 0, 0],
  sx = 1,
  sy = 1,
}) => (
  <mesh position={p} scale={[sx, sy, 1]}>
    <circleGeometry args={[r, 36]} />
    <meshBasicMaterial color={c} side={THREE.DoubleSide} toneMapped={false} />
  </mesh>
);

const Rect: React.FC<{w: number; h: number; c: string; p?: V3; rz?: number}> = ({
  w,
  h,
  c,
  p = [0, 0, 0],
  rz = 0,
}) => (
  <mesh position={p} rotation={[0, 0, rz]}>
    <planeGeometry args={[w, h]} />
    <meshBasicMaterial color={c} side={THREE.DoubleSide} toneMapped={false} />
  </mesh>
);

// ---------------------------------------------------------------- face

interface BrowCfg {
  ly: number;
  lr: number;
  ry: number;
  rr: number;
}
const BROWS: Record<Emotion, BrowCfg | null> = {
  neutral: {ly: 0.2, lr: 0, ry: 0.2, rr: 0},
  shock: {ly: 0.34, lr: 0, ry: 0.34, rr: 0},
  worry: {ly: 0.25, lr: 0.38, ry: 0.25, rr: -0.38}, // raised inner brows
  confused: {ly: 0.36, lr: 0.12, ry: 0.2, rr: -0.04}, // one brow raised
  happy: {ly: 0.27, lr: 0.1, ry: 0.27, rr: -0.1},
  grumpy: {ly: 0.2, lr: -0.45, ry: 0.2, rr: 0.45}, // inner ends down
  thinking: {ly: 0.2, lr: 0, ry: 0.3, rr: -0.15},
  skeleton: null,
};

const Face: React.FC<{e: Emotion; lx: number; ly: number}> = ({e, lx, ly}) => {
  const z = 0.02;
  const ex = 0.18;
  let eyes: React.ReactNode;
  if (e === 'shock') {
    eyes = [-1, 1].map((s) => (
      <group key={s} position={[s * ex, 0.06, z]}>
        <Disc r={0.165} c={OUT} />
        <Disc r={0.14} c="#FFFFFF" p={[0, 0, 0.005]} />
        <Disc r={0.06} c={OUT} p={[lx, ly, 0.01]} />
      </group>
    ));
  } else if (e === 'skeleton') {
    eyes = [-1, 1].map((s) => <Disc key={s} r={0.15} c={OUT} p={[s * ex, 0.06, z]} />);
  } else if (e === 'grumpy') {
    eyes = [-1, 1].map((s) => <Disc key={s} r={0.085} c={OUT} p={[s * ex, 0.04, z]} sy={0.5} />);
  } else {
    eyes = [-1, 1].map((s) => <Disc key={s} r={0.075} c={OUT} p={[s * ex + lx, 0.06 + ly, z]} />);
  }

  const bc = BROWS[e];
  const brows = bc ? (
    <>
      <Rect w={0.21} h={0.06} c={OUT} p={[-ex, bc.ly, z]} rz={bc.lr} />
      <Rect w={0.21} h={0.06} c={OUT} p={[ex, bc.ry, z]} rz={bc.rr} />
    </>
  ) : null;

  let mouth: React.ReactNode;
  switch (e) {
    case 'shock': // round open O mouth
      mouth = <Disc r={0.1} c={OUT} p={[0, -0.24, z]} sy={1.15} />;
      break;
    case 'worry': // small downturned mouth
      mouth = (
        <mesh position={[0, -0.3, z]}>
          <ringGeometry args={[0.07, 0.115, 20, 1, 0, Math.PI]} />
          <meshBasicMaterial color={OUT} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      );
      break;
    case 'happy': // open smile
      mouth = (
        <group position={[0, -0.17, z]}>
          <mesh>
            <circleGeometry args={[0.2, 24, Math.PI, Math.PI]} />
            <meshBasicMaterial color={OUT} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
          <Rect w={0.3} h={0.05} c="#FFFFFF" p={[0, -0.03, 0.005]} />
        </group>
      );
      break;
    case 'grumpy': // gritted teeth
    case 'skeleton':
      mouth = (
        <group position={[0, -0.25, z]}>
          <Rect w={0.38} h={0.18} c={OUT} />
          <Rect w={0.34} h={0.14} c="#FFFFFF" p={[0, 0, 0.004]} />
          {[-0.085, 0, 0.085].map((x) => (
            <Rect key={x} w={0.022} h={0.14} c={OUT} p={[x, 0, 0.008]} />
          ))}
          <Rect w={0.34} h={0.02} c={OUT} p={[0, 0, 0.008]} />
        </group>
      );
      break;
    case 'confused': // flat, slightly slanted
      mouth = <Rect w={0.2} h={0.05} c={OUT} p={[0.03, -0.24, z]} rz={0.14} />;
      break;
    case 'thinking':
      mouth = <Rect w={0.14} h={0.05} c={OUT} p={[0.05, -0.24, z]} />;
      break;
    default: // neutral: small flat mouth
      mouth = <Rect w={0.22} h={0.05} c={OUT} p={[0, -0.24, z]} />;
  }

  const nose =
    e === 'skeleton' ? (
      <mesh position={[0, -0.08, z]}>
        <circleGeometry args={[0.05, 3]} />
        <meshBasicMaterial color={OUT} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    ) : null;

  return (
    <>
      {eyes}
      {brows}
      {nose}
      {mouth}
    </>
  );
};

// ---------------------------------------------------------------- pose angles
// Limb angle: 0 = hanging down, + = tip swings toward screen-right, - = toward screen-left.

interface Angles {
  la: number;
  ra: number;
  ll: number;
  rl: number;
  rLen: number;
  bob: number;
  legs: boolean;
}

function poseAngles(d: DriverSt): Angles {
  const ph = d.phase;
  const p = d.prog;
  const a: Angles = {la: -0.12, ra: 0.12, ll: 0, rl: 0, rLen: 0.9, bob: 0, legs: true};
  switch (d.pose) {
    case 'walk': {
      const s = Math.sin(ph * 8);
      a.ll = s * 0.55;
      a.rl = -s * 0.55;
      a.la = -a.ll * 0.9;
      a.ra = -a.rl * 0.9;
      a.bob = Math.abs(s) * 0.05;
      break;
    }
    case 'wave':
      a.ra = 2.5 + 0.35 * Math.sin(ph * 9);
      break;
    case 'point':
      a.ra = 1.5;
      break;
    case 'reach':
      a.ra = 0.2 + 1.3 * p;
      break;
    case 'armsOut': {
      const w = 1.55 + 0.08 * Math.sin(ph * 4);
      a.la = -w;
      a.ra = w;
      break;
    }
    case 'ladder': {
      const s = Math.sin(ph * 3);
      a.la = -2.7;
      a.ra = 2.7;
      a.ll = 0.35 * s;
      a.rl = -0.35 * s;
      break;
    }
    case 'holdCheck':
      a.ra = 0.3 + 1.95 * p;
      a.la = -0.14;
      break;
    case 'tablet':
      a.ra = 1.25;
      break;
    case 'thinking':
      a.ra = -2.28;
      a.rLen = 0.32;
      break;
    case 'seated':
      a.la = -0.3;
      a.ra = 0.3;
      a.legs = false;
      break;
    case 'cheer':
      a.la = -2.5 + 0.35 * Math.sin(ph * 7);
      a.ra = 2.5 - 0.35 * Math.sin(ph * 7 + 1);
      a.legs = false;
      break;
    default:
      a.la = -0.12 + 0.03 * Math.sin(ph * 2);
      a.ra = 0.12 - 0.03 * Math.sin(ph * 2);
  }
  return a;
}

const Limb: React.FC<{p: V3; angle: number; len: number; color: string; hand?: string; foot?: boolean}> = ({
  p,
  angle,
  len,
  color,
  hand,
  foot,
}) => (
  <group position={p} rotation={[0, 0, angle]}>
    <Rect w={0.1} h={len} c={color} p={[0, -len / 2, 0]} />
    {hand ? <Disc r={0.11} c={hand} p={[0, -len, 0.01]} /> : null}
    {foot ? <Rect w={0.32} h={0.11} c="#3A2A20" p={[0.1, -len + 0.03, 0.01]} /> : null}
  </group>
);

// ---------------------------------------------------------------- figure

const Figure: React.FC<{d: DriverSt}> = ({d}) => {
  const sk = d.emotion === 'skeleton';
  const skin = d.faceTint ?? (sk ? BONE : d.skin ?? SKIN_DEFAULT);
  const limb = sk ? BONE : OUT;
  const a = poseAngles(d);
  const lx = (d.lookX ?? 0) * 0.045;
  const ly = (d.lookY ?? 0) * 0.045 + (d.emotion === 'thinking' ? 0.04 : 0);
  const tilt = d.emotion === 'confused' ? 0.2 : 0;
  const bodyFill = sk ? '#1B2A4A' : d.shirt;

  return (
    <group position={[0, a.bob, 0]}>
      {/* legs (behind body) */}
      {a.legs ? (
        <>
          <Limb p={[-0.17, 1.1, -0.04]} angle={a.ll} len={1.1} color={limb} foot />
          <Limb p={[0.17, 1.1, -0.04]} angle={a.rl} len={1.1} color={limb} foot />
        </>
      ) : null}

      {/* body */}
      <Disc r={0.52} c={OUT} p={[0, 1.55, -0.01]} sx={0.82} sy={1.06} />
      <Disc r={0.47} c={bodyFill} p={[0, 1.55, 0]} sx={0.82} sy={1.06} />
      {!sk ? (
        <>
          {[1.35, 1.55, 1.75].map((y) => (
            <Disc key={y} r={0.035} c="#FFE9B0" p={[0.1, y, 0.02]} />
          ))}
        </>
      ) : (
        <>
          <Rect w={0.06} h={0.9} c={BONE} p={[0, 1.55, 0.01]} />
          {[1.25, 1.42, 1.59, 1.76].map((y) => (
            <Rect key={y} w={0.5} h={0.06} c={BONE} p={[0, y, 0.01]} />
          ))}
        </>
      )}

      {/* arms (in front of body) */}
      <Limb p={[-0.4, 1.95, 0.03]} angle={a.la} len={0.9} color={limb} hand={skin} />
      <Limb p={[0.4, 1.95, 0.03]} angle={a.ra} len={a.rLen} color={limb} hand={skin} />

      {/* head */}
      <group position={[0, 2.55, 0.05]} rotation={[0, 0, tilt]}>
        <Disc r={0.57} c={OUT} p={[0, 0, -0.01]} />
        <Disc r={0.5} c={skin} />
        <Face e={d.emotion} lx={lx} ly={ly} />
      </group>

      {/* held items */}
      {d.pose === 'holdCheck' && d.prog > 0.05 ? <CheckProp p={[1.55, 2.85, 0.12]} s={d.prog} /> : null}
      {d.pose === 'tablet' ? <TabletProp p={[1.45, 1.95, 0.12]} s={1} /> : null}
    </group>
  );
};

export const Driver: React.FC<{d: DriverSt; cam: V3}> = ({d, cam}) => {
  const dx = cam[0] - d.x;
  const dz = cam[2] - d.z;
  const yaw = Math.atan2(dx, dz);
  const horiz = Math.hypot(dx, dz);
  const pitch = Math.max(-0.5, Math.min(0.6, Math.atan2(cam[1] - (d.y + d.scale * 2), horiz)));
  return (
    <group
      position={[d.x, d.y, d.z]}
      rotation={[-pitch, yaw, 0, 'YXZ']}
      scale={[d.flip ? -d.scale : d.scale, d.scale, d.scale]}
    >
      <Figure d={d} />
    </group>
  );
};
