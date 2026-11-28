import React from 'react';
import * as THREE from 'three';
import type {BillsSt, V3} from './shots-full';
import {
  billTexture,
  checkTexture,
  codeTexture,
  fineSignTexture,
  footballTexture,
  jackpotTexture,
  qMarkTexture,
  rng,
  slowTexture,
  textPanel,
  woodTexture,
} from './textures';

const GOLD = '#D4A017';

// ---------------------------------------------------------------- flat held items (children of a Driver)

export const CheckProp: React.FC<{p: V3; s: number}> = ({p, s}) => (
  <group position={p} scale={[s, s, 1]}>
    <mesh position={[0, 0, -0.01]}>
      <planeGeometry args={[2.32, 1.18]} />
      <meshBasicMaterial color="#14532D" toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
    <mesh>
      <planeGeometry args={[2.2, 1.1]} />
      <meshBasicMaterial map={checkTexture()} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  </group>
);

export const TabletProp: React.FC<{p: V3; s: number}> = ({p, s}) => (
  <group position={p} scale={[s, s, 1]}>
    <mesh position={[0, 0, -0.01]}>
      <planeGeometry args={[1.7, 1.2]} />
      <meshBasicMaterial color="#1F2937" toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
    <mesh>
      <planeGeometry args={[1.58, 1.08]} />
      <meshBasicMaterial map={codeTexture()} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  </group>
);

// ---------------------------------------------------------------- ladder (leans on the camera pole)

export const Ladder: React.FC = () => {
  const L = 7.25;
  const rungs = Array.from({length: 14}, (_, i) => -L / 2 + 0.35 + i * ((L - 0.7) / 13));
  return (
    <group position={[1.4, 3.2, -3.5]} rotation={[-0.488, 0, 0]}>
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, 0, 0]} castShadow>
          <boxGeometry args={[0.08, L, 0.1]} />
          <meshStandardMaterial color="#E0A431" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
      {rungs.map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <boxGeometry args={[0.84, 0.05, 0.05]} />
          <meshStandardMaterial color="#C9CDD2" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------- mailbox + fence

export const Mailbox: React.FC<{open: number}> = ({open}) => (
  <group position={[9, 0, 7]}>
    <mesh position={[0, 0.7, 0]} castShadow>
      <boxGeometry args={[0.14, 1.4, 0.14]} />
      <meshStandardMaterial color="#6B4A2B" roughness={0.9} />
    </mesh>
    <group position={[0, 1.65, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1.0, 0.55, 0.55]} />
        <meshPhysicalMaterial color="#1E5FD6" metalness={0.4} roughness={0.3} clearcoat={0.8} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.02, 0.08, 0.57]} />
        <meshStandardMaterial color="#174BAE" metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh position={[-0.505, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.5, 0.5]} />
        <meshBasicMaterial color="#05070A" />
      </mesh>
      <group position={[0.2, 0.28, 0.3]}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.04, 0.6, 0.04]} />
          <meshStandardMaterial color="#CFCFCF" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0.15, 0.55, 0]}>
          <boxGeometry args={[0.3, 0.18, 0.03]} />
          <meshStandardMaterial color="#E11D2E" roughness={0.4} />
        </mesh>
      </group>
      <group position={[-0.5, -0.275, 0]} rotation={[0, 0, open * 1.5]}>
        <mesh position={[0, 0.275, 0]} castShadow>
          <boxGeometry args={[0.04, 0.55, 0.55]} />
          <meshStandardMaterial color="#174BAE" metalness={0.4} roughness={0.35} />
        </mesh>
      </group>
    </group>
  </group>
);

export const Fence: React.FC = () => {
  const posts = Array.from({length: 17}, (_, i) => 2 + i);
  return (
    <group position={[0, 0, 9]}>
      {posts.map((x) => (
        <mesh key={x} position={[x, 0.55, 0]} castShadow>
          <boxGeometry args={[0.13, 1.1, 0.13]} />
          <meshStandardMaterial color="#F5F5F0" roughness={0.7} />
        </mesh>
      ))}
      {[0.45, 0.85].map((y) => (
        <mesh key={y} position={[10, y, 0]} castShadow>
          <boxGeometry args={[16, 0.09, 0.06]} />
          <meshStandardMaterial color="#F5F5F0" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------- road signs

export const FineSign: React.FC<{flip: number}> = ({flip}) => {
  const sx = Math.max(0.02, Math.abs(Math.cos(flip * Math.PI)));
  return (
    <group position={[7, 0, -6.4]}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.14, 1.8, 0.14]} />
        <meshStandardMaterial color="#8A8F98" metalness={0.6} roughness={0.4} />
      </mesh>
      <group position={[0, 2.5, 0.05]} scale={[sx, 1, 1]}>
        <mesh castShadow>
          <boxGeometry args={[2.4, 1.8, 0.1]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[2.3, 1.7]} />
          <meshBasicMaterial
            map={fineSignTexture(flip >= 0.5 ? 300 : 150)}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
};

export const SlowPaint: React.FC = () => (
  <mesh position={[12, 0.04, -2.2]} rotation={[-Math.PI / 2, -Math.PI / 2, 0, 'YXZ']}>
    <planeGeometry args={[8, 3.4]} />
    <meshBasicMaterial map={slowTexture()} transparent toneMapped={false} />
  </mesh>
);

export const QMark: React.FC<{p: V3; s: number; cam: V3}> = ({p, s, cam}) => {
  const yaw = Math.atan2(cam[0] - p[0], cam[2] - p[2]);
  return (
    <group position={p} rotation={[0, yaw, 0]} scale={[s, s, s]}>
      <mesh>
        <planeGeometry args={[1.8, 1.8]} />
        <meshBasicMaterial map={qMarkTexture()} transparent toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export const Gantry: React.FC<{x: number}> = ({x}) => {
  const metal = <meshStandardMaterial color="#9AA3AD" metalness={0.6} roughness={0.4} />;
  const panels: Array<[number, string[]]> = [
    [-2.4, ['SLOW DOWN', 'THANK YOU']],
    [2.4, ['SPEED LIMIT', '55']],
  ];
  return (
    <group position={[x, 0, 0]}>
      {[-5.4, 5.4].map((z) => (
        <mesh key={z} position={[0, 3.4, z]} castShadow>
          <boxGeometry args={[0.25, 6.8, 0.25]} />
          {metal}
        </mesh>
      ))}
      <mesh position={[0, 6.7, 0]} castShadow>
        <boxGeometry args={[0.3, 0.3, 11.2]} />
        {metal}
      </mesh>
      {panels.map(([z, lines]) => {
        const tex = textPanel('gantry:' + lines.join('|'), lines, '#0E7A3F', '#FFFFFF');
        return (
          <group key={z} position={[0, 5.35, z]}>
            <mesh castShadow>
              <boxGeometry args={[0.12, 2.0, 3.6]} />
              <meshStandardMaterial color="#0A5C30" />
            </mesh>
            <mesh position={[-0.07, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[3.5, 1.9]} />
              <meshBasicMaterial map={tex} toneMapped={false} />
            </mesh>
            <mesh position={[0.07, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[3.5, 1.9]} />
              <meshBasicMaterial map={tex} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// ---------------------------------------------------------------- banknotes (burst / rain / inside the drum)

export const Bills: React.FC<{b: BillsSt}> = ({b}) => {
  const ref = React.useRef<THREE.InstancedMesh>(null);
  React.useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const r = rng(b.seed);
    const d = new THREE.Object3D();
    for (let i = 0; i < b.count; i++) {
      const a = r() * Math.PI * 2;
      const sp = 2 + r() * 4.5;
      const up = 3 + r() * 5;
      const ph = r();
      const s2 = r() * 6 - 3;
      const s3 = r() * 6 - 3;
      const sz = 0.9 + r() * 0.5;
      const zr = r() - 0.5;
      let x = b.origin[0];
      let y = b.origin[1];
      let z = b.origin[2];
      let rx = 0;
      let ry = 0;
      let rz = 0;
      let sc = sz;
      if (b.mode === 'burst') {
        const t = b.t;
        if (t <= 0) {
          sc = 0;
        } else {
          const dist = (sp * (1 - Math.exp(-1.6 * t))) / 1.6;
          x += Math.cos(a) * dist;
          z += Math.sin(a) * dist * 0.6;
          y = Math.max(0.06, b.origin[1] + up * t - 2.9 * t * t);
          const air = y > 0.07 ? 1 : 0;
          rx = s2 * t * air;
          ry = s3 * t * air;
          rz = a;
          if (air === 0) rx = Math.PI / 2;
        }
      } else if (b.mode === 'rain') {
        x += (ph - 0.5) * 5 + Math.sin(b.t * 2 + ph * 9) * 0.3;
        z += zr * 3.2;
        y = 11 - ((b.t * (2.6 + ph * 1.6) + ph * 11) % 11);
        rx = s2 * b.t;
        ry = s3 * b.t;
        rz = a;
      } else {
        const ang = a + b.t * (1.2 + ph);
        const rr = 0.12 + ph * 0.62;
        x += Math.cos(ang) * rr;
        y += Math.sin(ang) * rr;
        z += zr * 0.9;
        rx = s2 * b.t * 0.4;
        ry = s3 * b.t * 0.4;
        rz = ang * 2;
        sc = sz * 0.55;
      }
      d.position.set(x, y, z);
      d.rotation.set(rx, ry, rz);
      d.scale.setScalar(sc);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, b.count]} frustumCulled={false}>
      <planeGeometry args={[0.55, 0.26]} />
      <meshStandardMaterial
        map={billTexture()}
        side={THREE.DoubleSide}
        roughness={0.7}
        emissive="#2A6B2A"
        emissiveIntensity={0.35}
      />
    </instancedMesh>
  );
};

// ---------------------------------------------------------------- lottery drum full of cash

export const Drum: React.FC<{t: number}> = ({t}) => (
  <group position={[0, 6.4, -2.3]}>
    <group rotation={[0, 0, t * 0.9]}>
      {[[0, 0, 0], [Math.PI / 2, 0, 0], [0, Math.PI / 2, 0]].map((r, i) => (
        <mesh key={i} rotation={[r[0], r[1], r[2]]}>
          <torusGeometry args={[1.0, 0.035, 10, 48]} />
          <meshStandardMaterial color={GOLD} metalness={1} roughness={0.25} />
        </mesh>
      ))}
    </group>
    <mesh>
      <sphereGeometry args={[1.0, 40, 28]} />
      <meshPhysicalMaterial
        color="#9CC8FF"
        transparent
        opacity={0.16}
        roughness={0.05}
        clearcoat={1}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
    <Bills b={{mode: 'drum', t, origin: [0, 0, 0], count: 120, seed: 77}} />
    {[-1.15, 1.15].map((x) => (
      <mesh key={x} position={[x, -0.9, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 1.7, 12]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.25} />
      </mesh>
    ))}
    <mesh position={[0, -1.78, 0]}>
      <boxGeometry args={[2.8, 0.2, 1.1]} />
      <meshStandardMaterial color="#7A0C1E" metalness={0.4} roughness={0.35} />
    </mesh>
    <group position={[1.25, 0, 0]} rotation={[0, 0, -t * 0.9]}>
      <mesh position={[0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.25} />
      </mesh>
      <mesh position={[0.5, 0, 0]}>
        <sphereGeometry args={[0.14, 16, 12]} />
        <meshStandardMaterial color="#E11D2E" roughness={0.3} />
      </mesh>
    </group>
  </group>
);

// ---------------------------------------------------------------- jackpot machine (the camera box turns into this)

export const JackpotMachine: React.FC = () => (
  <group>
    <mesh castShadow>
      <boxGeometry args={[2.2, 3.0, 1.6]} />
      <meshPhysicalMaterial color="#B3122A" metalness={0.4} roughness={0.25} clearcoat={1} />
    </mesh>
    <mesh position={[0, 0.0, 0.81]}>
      <planeGeometry args={[2.0, 2.7]} />
      <meshBasicMaterial map={jackpotTexture()} toneMapped={false} />
    </mesh>
    <mesh position={[0, 1.6, 0]}>
      <boxGeometry args={[2.3, 0.2, 1.7]} />
      <meshStandardMaterial color={GOLD} metalness={1} roughness={0.25} />
    </mesh>
    <mesh position={[0, -1.65, 0]}>
      <boxGeometry args={[2.3, 0.3, 1.7]} />
      <meshStandardMaterial color={GOLD} metalness={1} roughness={0.25} />
    </mesh>
    {Array.from({length: 8}, (_, i) => (
      <mesh key={i} position={[-0.98 + i * 0.28, 1.4, 0.86]}>
        <sphereGeometry args={[0.07, 10, 8]} />
        <meshStandardMaterial color="#FFE08A" emissive="#FFD05A" emissiveIntensity={2.2} />
      </mesh>
    ))}
    <group position={[1.25, 0.3, 0]} rotation={[0, 0, -0.35]}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 1.0, 10]} />
        <meshStandardMaterial color="#D9DDE2" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.18, 16, 12]} />
        <meshStandardMaterial color="#E11D2E" roughness={0.3} />
      </mesh>
    </group>
  </group>
);

// ---------------------------------------------------------------- living room set (sofa, TV, rug)

export const LivingRoom: React.FC = () => {
  const wood = woodTexture();
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 14]} />
        <meshStandardMaterial map={wood} roughness={0.7} />
      </mesh>
      <mesh position={[0, 3, -3.6]}>
        <planeGeometry args={[16, 6]} />
        <meshStandardMaterial color="#C9A47A" roughness={0.9} />
      </mesh>
      <mesh position={[-8, 3, 3]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[14, 6]} />
        <meshStandardMaterial color="#B88F66" roughness={0.9} />
      </mesh>
      <mesh position={[8, 3, 3]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[14, 6]} />
        <meshStandardMaterial color="#B88F66" roughness={0.9} />
      </mesh>
      {/* rug */}
      <mesh position={[0, 0.02, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 3.6]} />
        <meshStandardMaterial color="#8E2A3A" roughness={1} />
      </mesh>
      <mesh position={[0, 0.03, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.4, 3.0]} />
        <meshStandardMaterial color="#B23A48" roughness={1} />
      </mesh>
      {/* sofa (backrest toward the camera) */}
      <mesh position={[0, 0.25, 1.2]} castShadow>
        <boxGeometry args={[5.2, 0.5, 1.5]} />
        <meshStandardMaterial color="#3B5B8C" roughness={0.8} />
      </mesh>
      {[-1.75, 0, 1.75].map((x) => (
        <mesh key={x} position={[x, 0.62, 1.1]} castShadow>
          <boxGeometry args={[1.65, 0.25, 1.2]} />
          <meshStandardMaterial color="#4A6EA8" roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[0, 0.95, 1.85]} castShadow>
        <boxGeometry args={[5.2, 1.0, 0.35]} />
        <meshStandardMaterial color="#3B5B8C" roughness={0.8} />
      </mesh>
      {[-2.8, 2.8].map((x) => (
        <mesh key={x} position={[x, 0.45, 1.3]} castShadow>
          <boxGeometry args={[0.4, 0.9, 1.5]} />
          <meshStandardMaterial color="#33507E" roughness={0.8} />
        </mesh>
      ))}
      {/* TV on a cabinet */}
      <group position={[0, 0, -3.2]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[4.6, 1.2, 0.9]} />
          <meshStandardMaterial color="#4A2E1B" roughness={0.6} />
        </mesh>
        <mesh position={[0, 2.75, 0]}>
          <boxGeometry args={[3.9, 2.3, 0.2]} />
          <meshStandardMaterial color="#0C0C0F" roughness={0.3} metalness={0.5} />
        </mesh>
        <mesh position={[0, 2.75, 0.11]}>
          <planeGeometry args={[3.7, 2.1]} />
          <meshBasicMaterial map={footballTexture()} toneMapped={false} />
        </mesh>
      </group>
      {/* lamp + frames */}
      <mesh position={[-6, 0.9, -2.4]}>
        <cylinderGeometry args={[0.06, 0.12, 1.8, 10]} />
        <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-6, 2.1, -2.4]}>
        <coneGeometry args={[0.6, 0.7, 20, 1, true]} />
        <meshStandardMaterial color="#FFE2A8" emissive="#FFC864" emissiveIntensity={1.4} side={THREE.DoubleSide} />
      </mesh>
      {[-5, 5].map((x, i) => (
        <mesh key={x} position={[x, 3.6, -3.55]}>
          <planeGeometry args={[1.6, 1.1]} />
          <meshBasicMaterial color={i ? '#E9C46A' : '#2A9D8F'} />
        </mesh>
      ))}
    </group>
  );
};
