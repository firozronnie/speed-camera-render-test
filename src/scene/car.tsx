import React from 'react';
import * as THREE from 'three';
import type {CarSt, DriverSt} from './shots-full';
import {glowTexture} from './textures';

const GOLD = '#D4A017';
const REAR = '#EF2B2B'; // rear lights are ALWAYS red
const WHEEL_R = 0.38;

// Where the flat 2D driver sits: head fully BELOW the roofline, face seen through the windscreen.
export function seatedDriver(car: CarSt): DriverSt | null {
  if (!car.driver) return null;
  const ch = car.sports ? 0.4 : 0.55;
  const headY = 1.0 + ch - 0.3;
  const s = 0.5;
  return {
    id: car.id + '-driver',
    x: car.x - 0.15 * Math.cos(car.ry),
    y: headY - 2.55 * s,
    z: car.z + 0.15 * Math.sin(car.ry),
    scale: s,
    emotion: car.driver.emotion,
    pose: 'seated',
    phase: 0,
    prog: 1,
    shirt: car.driver.shirt,
    faceTint: car.driver.faceTint,
    lookX: car.driver.lookX,
  };
}

const Paint: React.FC<{c: string; op: number}> = ({c, op}) => (
  <meshPhysicalMaterial
    color={c}
    metalness={0.35}
    roughness={0.28}
    clearcoat={1}
    clearcoatRoughness={0.08}
    transparent={op < 1}
    opacity={op}
    emissive={op < 1 ? '#3AA0FF' : '#000000'}
    emissiveIntensity={op < 1 ? 0.35 : 0}
  />
);

const Solid: React.FC<{c: string; op: number; metal?: number; rough?: number}> = ({
  c,
  op,
  metal = 0.2,
  rough = 0.6,
}) => (
  <meshStandardMaterial
    color={c}
    metalness={metal}
    roughness={rough}
    transparent={op < 1}
    opacity={op}
  />
);

const Wheel: React.FC<{x: number; z: number; odo: number; op: number}> = ({x, z, odo, op}) => {
  const side = z > 0 ? 1 : -1;
  return (
    <group position={[x, WHEEL_R, z]}>
      <group rotation={[0, 0, -odo / WHEEL_R]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[WHEEL_R, WHEEL_R, 0.26, 28]} />
          <Solid c="#141414" op={op} rough={0.85} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.275, 24]} />
          <Solid c="#D9DDE2" op={op} metal={0.9} rough={0.2} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, 0, side * 0.14]} rotation={[0, 0, (i * Math.PI) / 5]}>
            <boxGeometry args={[0.5, 0.045, 0.02]} />
            <Solid c="#9AA0A8" op={op} metal={0.9} rough={0.25} />
          </mesh>
        ))}
        <mesh position={[0, 0, side * 0.15]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.03, 12]} />
          <Solid c={GOLD} op={op} metal={1} rough={0.2} />
        </mesh>
      </group>
    </group>
  );
};

export const Car: React.FC<{car: CarSt}> = ({car}) => {
  const op = car.ghost ?? 1;
  const sports = !!car.sports;
  const ch = sports ? 0.4 : 0.55; // cabin height
  const rivets = Array.from({length: 14}, (_, i) => -1.95 + i * 0.3);
  const brake = car.brake;

  return (
    <group position={[car.x, 0, car.z]} rotation={[0, car.ry, 0]}>
      {/* chassis */}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[4.0, 0.25, 1.7]} />
        <Solid c="#111111" op={op} />
      </mesh>
      {/* main body */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 0.6, 1.9]} />
        <Paint c={car.color} op={op} />
      </mesh>
      {/* sloped hood and trunk */}
      <mesh position={[1.5, 1.03, 0]} rotation={[0, 0, -0.12]} castShadow>
        <boxGeometry args={[1.2, 0.12, 1.7]} />
        <Paint c={car.color} op={op} />
      </mesh>
      <mesh position={[-1.7, 1.03, 0]} rotation={[0, 0, 0.1]} castShadow>
        <boxGeometry args={[0.9, 0.12, 1.7]} />
        <Paint c={car.color} op={op} />
      </mesh>
      {/* glass cabin */}
      <mesh position={[-0.15, 1.0 + ch / 2, 0]}>
        <boxGeometry args={[2.0, ch, 1.6]} />
        <meshStandardMaterial
          color="#1A2B3D"
          metalness={0.6}
          roughness={0.1}
          transparent
          opacity={0.5 * op}
          depthWrite={false}
        />
      </mesh>
      {/* pillars */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[-0.15 + sx * 0.96, 1.0 + ch / 2, sz * 0.76]}>
            <boxGeometry args={[0.09, ch, 0.09]} />
            <Paint c={car.color} op={op} />
          </mesh>
        )),
      )}
      {/* roof + sunroof + gold roof rack */}
      <mesh position={[-0.15, 1.0 + ch + 0.035, 0]} castShadow>
        <boxGeometry args={[1.95, 0.07, 1.66]} />
        <Paint c={car.color} op={op} />
      </mesh>
      <mesh position={[-0.15, 1.0 + ch + 0.075, 0]}>
        <boxGeometry args={[0.9, 0.02, 0.9]} />
        <Solid c="#0E1620" op={op} metal={0.6} rough={0.15} />
      </mesh>
      {[-0.7, 0.4].map((x) => (
        <mesh key={x} position={[x, 1.0 + ch + 0.11, 0]}>
          <boxGeometry args={[0.05, 0.04, 1.5]} />
          <Solid c={GOLD} op={op} metal={1} rough={0.2} />
        </mesh>
      ))}
      {/* gold trim stripe + rivets on both sides */}
      {[-1, 1].map((sz) => (
        <group key={sz}>
          <mesh position={[0, 0.72, sz * 0.955]}>
            <boxGeometry args={[4.22, 0.05, 0.02]} />
            <Solid c={GOLD} op={op} metal={1} rough={0.2} />
          </mesh>
          {rivets.map((x) => (
            <mesh key={x} position={[x, 0.55, sz * 0.96]}>
              <sphereGeometry args={[0.03, 8, 6]} />
              <Solid c="#E8C95A" op={op} metal={1} rough={0.2} />
            </mesh>
          ))}
          <mesh position={[0.75, 1.05, sz * 1.0]}>
            <boxGeometry args={[0.18, 0.1, 0.1]} />
            <Paint c={car.color} op={op} />
          </mesh>
        </group>
      ))}
      {/* bumpers, grille */}
      <mesh position={[2.1, 0.5, 0]}>
        <boxGeometry args={[0.2, 0.25, 1.92]} />
        <Solid c="#A9AEB5" op={op} metal={0.9} rough={0.25} />
      </mesh>
      <mesh position={[-2.1, 0.5, 0]}>
        <boxGeometry args={[0.2, 0.25, 1.92]} />
        <Solid c="#A9AEB5" op={op} metal={0.9} rough={0.25} />
      </mesh>
      <mesh position={[2.11, 0.72, 0]}>
        <boxGeometry args={[0.04, 0.22, 0.7]} />
        <Solid c="#0B0B0B" op={op} />
      </mesh>
      {/* headlights */}
      {[-0.62, 0.62].map((z) => (
        <mesh key={z} position={[2.08, 0.82, z]} scale={[0.5, 1, 1.3]}>
          <sphereGeometry args={[0.14, 16, 12]} />
          <meshStandardMaterial color="#FFF6D0" emissive="#FFF0B0" emissiveIntensity={2.2} transparent={op < 1} opacity={op} />
        </mesh>
      ))}
      {/* tail lights: always RED, brighter when braking */}
      {[-0.65, 0.65].map((z) => (
        <mesh key={z} position={[-2.11, 0.82, z]}>
          <boxGeometry args={[0.06, 0.18, 0.45]} />
          <meshStandardMaterial
            color={REAR}
            emissive={REAR}
            emissiveIntensity={brake ? 3.6 : 0.9}
            transparent={op < 1}
            opacity={op}
          />
        </mesh>
      ))}
      {sports ? (
        <group>
          <mesh position={[-2.0, 1.28, 0]}>
            <boxGeometry args={[0.32, 0.05, 1.6]} />
            <Paint c={car.color} op={op} />
          </mesh>
          {[-0.6, 0.6].map((z) => (
            <mesh key={z} position={[-1.95, 1.15, z]}>
              <boxGeometry args={[0.06, 0.2, 0.06]} />
              <Solid c="#111111" op={op} />
            </mesh>
          ))}
        </group>
      ) : null}
      {/* wheels */}
      <Wheel x={1.3} z={0.93} odo={car.odo} op={op} />
      <Wheel x={1.3} z={-0.93} odo={car.odo} op={op} />
      <Wheel x={-1.3} z={0.93} odo={car.odo} op={op} />
      <Wheel x={-1.3} z={-0.93} odo={car.odo} op={op} />
      {/* glows: headlights always, brake lights when braking */}
      <sprite position={[2.4, 0.82, 0]} scale={[1.6, 1.6, 1]}>
        <spriteMaterial
          map={glowTexture()}
          color="#FFE9A8"
          transparent
          opacity={0.5 * op}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      {brake ? (
        <sprite position={[-2.4, 0.82, 0]} scale={[2.2, 2.2, 1]}>
          <spriteMaterial
            map={glowTexture()}
            color="#FF2A2A"
            transparent
            opacity={0.9 * op}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ) : null}
    </group>
  );
};
