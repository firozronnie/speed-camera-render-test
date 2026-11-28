import React from 'react';
import * as THREE from 'three';
import type {SkyKind, V3} from './shots-full';
import {JackpotMachine} from './props';
import {
  asphaltTexture,
  glowTexture,
  groundTexture,
  rng,
  skyTexture,
  textPanel,
  windowsTexture,
} from './textures';

// ---------------------------------------------------------------- sky: gradient + clouds + sun disc (never flat)

export const SkyDome: React.FC<{kind: SkyKind; sunPos: V3; sunColor: string}> = ({
  kind,
  sunPos,
  sunColor,
}) => {
  const n = Math.hypot(sunPos[0], sunPos[1], sunPos[2]) || 1;
  const k = 360 / n;
  const sp: V3 = [sunPos[0] * k, sunPos[1] * k, sunPos[2] * k];
  const showSun = kind === 'day' || kind === 'dusk';
  return (
    <group>
      <mesh renderOrder={-10}>
        <sphereGeometry args={[400, 48, 32]} />
        <meshBasicMaterial map={skyTexture(kind)} side={THREE.BackSide} fog={false} depthWrite={false} />
      </mesh>
      {showSun ? (
        <>
          <sprite position={sp} scale={[170, 170, 1]}>
            <spriteMaterial
              map={glowTexture()}
              color={sunColor}
              fog={false}
              transparent
              opacity={0.55}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
          <sprite position={sp} scale={[38, 38, 1]}>
            <spriteMaterial
              map={glowTexture()}
              color="#FFFBE6"
              fog={false}
              transparent
              depthWrite={false}
            />
          </sprite>
        </>
      ) : null}
    </group>
  );
};

// ---------------------------------------------------------------- instanced helpers

const Grass: React.FC = () => {
  const ref = React.useRef<THREE.InstancedMesh>(null);
  React.useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const r = rng(11);
    const d = new THREE.Object3D();
    const c = new THREE.Color();
    for (let i = 0; i < 2200; i++) {
      const side = r() < 0.5 ? -1 : 1;
      const x = (r() - 0.5) * 120;
      const z = side * (5.4 + r() * 12);
      const s = 0.6 + r() * 1.0;
      d.position.set(x, 0.3 * s, z);
      d.rotation.set((r() - 0.5) * 0.4, r() * 6.28, (r() - 0.5) * 0.4);
      d.scale.set(s, s, s);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
      c.setHSL(0.25 + r() * 0.08, 0.62, 0.26 + r() * 0.2);
      m.setColorAt(i, c);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 2200]} frustumCulled={false}>
      <coneGeometry args={[0.05, 0.6, 4]} />
      <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
    </instancedMesh>
  );
};

const Stones: React.FC = () => {
  const ref = React.useRef<THREE.InstancedMesh>(null);
  React.useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const r = rng(23);
    const d = new THREE.Object3D();
    const c = new THREE.Color();
    for (let i = 0; i < 1400; i++) {
      const side = r() < 0.5 ? -1 : 1;
      const x = (r() - 0.5) * 140;
      const z = side * (4.6 + r() * r() * 9);
      const s = 0.06 + r() * 0.14;
      d.position.set(x, s * 0.5, z);
      d.rotation.set(r() * 6, r() * 6, r() * 6);
      d.scale.set(s, s * (0.6 + r() * 0.4), s);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
      const g = 0.35 + r() * 0.4;
      c.setRGB(g, g * 0.97, g * 0.92);
      m.setColorAt(i, c);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 1400]} frustumCulled={false} castShadow>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#FFFFFF" roughness={0.95} flatShading />
    </instancedMesh>
  );
};

// ---------------------------------------------------------------- trees, skyline, hills

const Trees: React.FC = () => {
  const trees = React.useMemo(() => {
    const r = rng(5);
    const out: Array<{x: number; z: number; s: number; g: string[]}> = [];
    const greens = ['#2E8B3E', '#3AA04A', '#277A36', '#4AB05A', '#1F6B30'];
    for (let i = 0; i < 44; i++) {
      const side = r() < 0.5 ? -1 : 1;
      out.push({
        x: (r() - 0.5) * 190,
        z: side * (14 + r() * 32),
        s: 0.8 + r() * 0.9,
        g: [0, 1, 2].map(() => greens[Math.floor(r() * greens.length)]),
      });
    }
    return out;
  }, []);
  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={[t.s, t.s, t.s]}>
          <mesh position={[0, 1.0, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.32, 2.0, 8]} />
            <meshStandardMaterial color="#6B4A2B" roughness={0.95} />
          </mesh>
          <mesh position={[0, 3.1, 0]} castShadow>
            <icosahedronGeometry args={[1.6, 1]} />
            <meshStandardMaterial color={t.g[0]} roughness={0.9} flatShading />
          </mesh>
          <mesh position={[0.7, 3.8, 0.3]} castShadow>
            <icosahedronGeometry args={[1.2, 1]} />
            <meshStandardMaterial color={t.g[1]} roughness={0.9} flatShading />
          </mesh>
          <mesh position={[-0.6, 3.6, -0.4]} castShadow>
            <icosahedronGeometry args={[1.1, 1]} />
            <meshStandardMaterial color={t.g[2]} roughness={0.9} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const Skyline: React.FC = () => {
  const b = React.useMemo(() => {
    const r = rng(9);
    const bases = ['#46506B', '#3C4764', '#566184', '#4A5878'];
    return Array.from({length: 16}, (_, i) => ({
      x: 72 + r() * 38,
      z: -34 + i * 4.4 + r() * 2,
      w: 6 + r() * 5,
      h: 16 + r() * 40,
      seed: 100 + Math.floor(r() * 5),
      base: bases[Math.floor(r() * bases.length)],
    }));
  }, []);
  return (
    <group>
      {b.map((q, i) => (
        <mesh key={i} position={[q.x, q.h / 2, q.z]}>
          <boxGeometry args={[q.w, q.h, q.w]} />
          <meshLambertMaterial map={windowsTexture(q.seed, q.base)} />
        </mesh>
      ))}
    </group>
  );
};

const Hills: React.FC = () => (
  <group>
    {[-120, -70, -20, 30, 80, 130].map((x, i) => (
      <mesh key={x} position={[x, 0, -105 - (i % 2) * 14]} scale={[60, 20 + (i % 3) * 5, 36]}>
        <sphereGeometry args={[1, 28, 16]} />
        <meshStandardMaterial color={i % 2 ? '#2F7D46' : '#3C8F4F'} roughness={1} />
      </mesh>
    ))}
  </group>
);

const Mist: React.FC<{color: string}> = ({color}) => (
  <group>
    {Array.from({length: 14}, (_, i) => {
      const a = (i / 14) * Math.PI * 2;
      return (
        <sprite key={i} position={[Math.cos(a) * 150, 9, Math.sin(a) * 150]} scale={[120, 26, 1]}>
          <spriteMaterial map={glowTexture()} color={color} transparent opacity={0.22} depthWrite={false} fog={false} />
        </sprite>
      );
    })}
  </group>
);

// ---------------------------------------------------------------- the world

export const OutdoorWorld: React.FC<{fogColor: string}> = ({fogColor}) => {
  const asphalt = asphaltTexture();
  const lineMat = (c: string) => <meshBasicMaterial color={c} toneMapped={false} />;
  return (
    <group>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[900, 900]} />
        <meshStandardMaterial map={groundTexture()} roughness={1} />
      </mesh>
      {/* road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[400, 9]} />
        <meshStandardMaterial map={asphalt} roughness={0.92} />
      </mesh>
      {/* gravel shoulders */}
      {[-5.25, 5.25].map((z) => (
        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, z]} receiveShadow>
          <planeGeometry args={[400, 1.5]} />
          <meshStandardMaterial color="#8E8776" roughness={1} />
        </mesh>
      ))}
      {/* lane markings: double yellow centre, white edges */}
      {[-0.14, 0.14].map((z) => (
        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, z]}>
          <planeGeometry args={[400, 0.12]} />
          {lineMat('#F2C200')}
        </mesh>
      ))}
      {[-4.15, 4.15].map((z) => (
        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, z]}>
          <planeGeometry args={[400, 0.14]} />
          {lineMat('#F4F4F4')}
        </mesh>
      ))}
      <Grass />
      <Stones />
      <Trees />
      <Skyline />
      <Hills />
      <Mist color={fogColor} />
    </group>
  );
};

// ---------------------------------------------------------------- the speed camera pole

export const CameraPole: React.FC<{
  display?: string;
  displayColor?: string;
  flash: number;
  jackpot: number;
}> = ({display, displayColor = '#FFB020', flash, jackpot}) => {
  const text = display ?? 'SPEED CAMERA';
  const col = display ? displayColor : '#5C6B7A';
  const tex = textPanel('pole:' + text + col, [text], '#06080C', col, 1024, 480);
  const boxVisible = jackpot < 0.5;
  const machineVisible = jackpot >= 0.5;
  const boxScale = 1 - 0.4 * Math.min(1, jackpot * 2);
  const machineScale = 0.6 + 0.9 * Math.min(1, (jackpot - 0.5) * 2);
  return (
    <group>
      {/* pole */}
      <mesh position={[0, 3.1, -5.8]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 6.2, 16]} />
        <meshStandardMaterial color="#8C939C" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.1, -5.8]}>
        <cylinderGeometry args={[0.5, 0.55, 0.2, 18]} />
        <meshStandardMaterial color="#5B6169" metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[0, 6.25, -5.2]} castShadow>
        <boxGeometry args={[0.2, 0.2, 1.4]} />
        <meshStandardMaterial color="#8C939C" metalness={0.7} roughness={0.35} />
      </mesh>
      {/* display panel */}
      <group position={[0, 4.9, -5.55]}>
        <mesh castShadow>
          <boxGeometry args={[2.7, 1.3, 0.18]} />
          <meshStandardMaterial color="#14171C" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.1]}>
          <planeGeometry args={[2.6, 1.2]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      </group>
      {/* camera box */}
      <group position={[0, 6.9, -4.6]}>
        {boxVisible ? (
          <group scale={[boxScale, boxScale, boxScale]}>
            <mesh castShadow>
              <boxGeometry args={[1.7, 1.05, 1.3]} />
              <meshStandardMaterial color="#3B4350" metalness={0.6} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.56, 0]}>
              <boxGeometry args={[1.76, 0.08, 1.36]} />
              <meshStandardMaterial color="#F2B600" metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.75]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.3, 0.34, 0.4, 20]} />
              <meshStandardMaterial color="#0B0B0D" metalness={0.8} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0, 0.96]}>
              <sphereGeometry args={[0.2, 16, 12]} />
              <meshStandardMaterial color="#1B4F9C" emissive="#2E7BFF" emissiveIntensity={0.8} metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0.42, 0.55]}>
              <boxGeometry args={[1.2, 0.06, 0.9]} />
              <meshStandardMaterial color="#2B323D" metalness={0.6} roughness={0.4} />
            </mesh>
            {[-0.7, 0.7].flatMap((x) =>
              [-0.4, 0.4].map((y) => (
                <mesh key={`${x}${y}`} position={[x, y, 0.66]}>
                  <sphereGeometry args={[0.035, 8, 6]} />
                  <meshStandardMaterial color="#D9DDE2" metalness={1} roughness={0.2} />
                </mesh>
              )),
            )}
            {flash > 0.02 ? (
              <sprite position={[0, 0, 1.2]} scale={[2.5 + 5 * flash, 2.5 + 5 * flash, 1]}>
                <spriteMaterial
                  map={glowTexture()}
                  color="#FFFFFF"
                  transparent
                  opacity={Math.min(1, flash * 1.2)}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </sprite>
            ) : null}
          </group>
        ) : null}
        {machineVisible ? (
          <group scale={[machineScale, machineScale, machineScale]}>
            <JackpotMachine />
          </group>
        ) : null}
      </group>
    </group>
  );
};
