import * as THREE from 'three';
import type {CarColor, CarState} from './shots-full';
import {boxGeo, cylGeo, planeGeo, sphereGeo, torusGeo} from './textures';

export const CAR_HEX: Record<CarColor, string> = {
  red: '#C8102E',
  blue: '#1565C0',
  silver: '#C8CDD2',
  green: '#2E9E44',
  white: '#F2F2F2',
  gold: '#D4A017',
};

const paint = (color: string) =>
  new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.52,
    roughness: 0.14,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    reflectivity: 0.95,
    envMapIntensity: 1.55,
  });

const gold = () =>
  new THREE.MeshStandardMaterial({
    color: '#D4A017',
    metalness: 0.94,
    roughness: 0.16,
    emissive: '#4A3405',
    emissiveIntensity: 0.22,
    envMapIntensity: 1.7,
  });

const glass = () =>
  new THREE.MeshPhysicalMaterial({
    color: '#BFE3F2',
    metalness: 0.18,
    roughness: 0.04,
    transparent: true,
    opacity: 0.32,
    side: THREE.DoubleSide,
    depthWrite: false,
    envMapIntensity: 1.9,
  });

const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material) => new THREE.Mesh(geo, mat);

/** Rear lamps are red in every frame; braking only increases their glow. */
const brakeMaterial = (braking: boolean) =>
  new THREE.MeshStandardMaterial({
    color: '#EF2B2B',
    emissive: '#EF2B2B',
    emissiveIntensity: braking ? 3.2 : 0.9,
    metalness: 0.15,
    roughness: 0.22,
  });

const makeWheel = (spinning: number): THREE.Group => {
  const wheel = new THREE.Group();

  const tire = mesh(cylGeo(0.42, 0.42, 0.28, 28), new THREE.MeshStandardMaterial({
    color: '#15181D',
    roughness: 0.86,
    metalness: 0.05,
  }));
  tire.rotation.z = Math.PI / 2;
  wheel.add(tire);

  const rim = mesh(cylGeo(0.27, 0.27, 0.3, 24), gold());
  rim.rotation.z = Math.PI / 2;
  wheel.add(rim);

  const ring = mesh(torusGeo(0.3, 0.035, 8, 28), new THREE.MeshStandardMaterial({
    color: '#F6D774',
    metalness: 0.95,
    roughness: 0.18,
  }));
  ring.rotation.y = Math.PI / 2;
  wheel.add(ring);

  const brakeDisc = mesh(cylGeo(0.22, 0.22, 0.06, 20), new THREE.MeshStandardMaterial({
    color: '#6B7280',
    metalness: 0.9,
    roughness: 0.3,
    envMapIntensity: 1.4,
  }));
  brakeDisc.rotation.z = Math.PI / 2;
  wheel.add(brakeDisc);

  const spokeMat = new THREE.MeshStandardMaterial({
    color: '#F6D774',
    metalness: 0.95,
    roughness: 0.15,
    envMapIntensity: 1.8,
  });
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const spoke = mesh(boxGeo(0.07, 0.24, 0.05), spokeMat);
    spoke.position.set(0, Math.cos(a) * 0.14, Math.sin(a) * 0.14);
    spoke.rotation.x = a;
    wheel.add(spoke);
  }
  const hub = mesh(sphereGeo(0.07, 12), spokeMat);
  wheel.add(hub);

  wheel.rotation.x = spinning;
  return wheel;
};

export const makeCar = (state: CarState): THREE.Group => {
  const car = new THREE.Group();
  car.position.set(state.x, state.y, state.z);
  car.rotation.y = state.rotationY;

  const bodyPaint = paint(CAR_HEX[state.color]);
  const trim = gold();

  const shadow = mesh(
    planeGeo(2.9, 5.0),
    new THREE.MeshBasicMaterial({
      color: '#0A1420',
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  car.add(shadow);

  const bodyHeight = state.sports ? 0.52 : 0.64;
  const lower = mesh(boxGeo(2.1, bodyHeight, 4.2), bodyPaint);
  lower.position.y = state.sports ? 0.68 : 0.74;
  car.add(lower);

  const lowerGloss = mesh(
    boxGeo(2.12, 0.08, 4.05),
    new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      transparent: true,
      opacity: 0.18,
      metalness: 0.6,
      roughness: 0.1,
    }),
  );
  lowerGloss.position.y = state.sports ? 0.95 : 1.04;
  car.add(lowerGloss);

  const hood = mesh(boxGeo(1.94, 0.18, 1.24), bodyPaint);
  hood.position.set(0, state.sports ? 0.98 : 1.04, 1.4);
  car.add(hood);

  const trunk = mesh(boxGeo(1.94, 0.16, 0.9), bodyPaint);
  trunk.position.set(0, state.sports ? 0.98 : 1.04, -1.58);
  car.add(trunk);

  const roofY = state.sports ? 1.4 : 1.52;
  const roof = mesh(boxGeo(1.62, 0.11, 1.66), bodyPaint);
  roof.position.set(0, roofY, -0.16);
  car.add(roof);

  const glassMat = glass();
  const windshield = mesh(planeGeo(1.52, 0.62), glassMat);
  windshield.position.set(0, roofY - 0.34, 0.86);
  windshield.rotation.x = -0.3;
  car.add(windshield);

  const rearWindow = mesh(planeGeo(1.5, 0.54), glassMat);
  rearWindow.position.set(0, roofY - 0.34, -1.16);
  rearWindow.rotation.x = 0.3;
  car.add(rearWindow);

  for (const side of [-1, 1]) {
    const sideGlass = mesh(planeGeo(1.5, 0.52), glassMat);
    sideGlass.position.set(side * 0.88, roofY - 0.34, -0.16);
    sideGlass.rotation.y = Math.PI / 2;
    car.add(sideGlass);

    for (const zPos of [0.82, -1.12]) {
      const pillar = mesh(boxGeo(0.12, 0.66, 0.12), bodyPaint);
      pillar.position.set(side * 0.87, roofY - 0.34, zPos);
      car.add(pillar);
    }

    const sill = mesh(boxGeo(0.05, 0.06, 3.9), trim);
    sill.position.set(side * 1.06, 0.48, 0);
    car.add(sill);

    const roofRail = mesh(boxGeo(0.05, 0.05, 1.7), trim);
    roofRail.position.set(side * 0.68, roofY + 0.09, -0.16);
    car.add(roofRail);

    for (let i = 0; i < 9; i++) {
      const rivet = mesh(sphereGeo(0.035, 8), trim);
      rivet.position.set(side * 1.07, 0.72, -1.7 + i * 0.42);
      car.add(rivet);
    }
  }

  const lamps = brakeMaterial(state.brake);
  for (const side of [-1, 1]) {
    const rearLamp = mesh(boxGeo(0.44, 0.2, 0.09), lamps);
    rearLamp.position.set(side * 0.72, 0.88, -2.13);
    car.add(rearLamp);

    const lampGlint = mesh(
      planeGeo(0.34, 0.1),
      new THREE.MeshBasicMaterial({
        color: '#FF8080',
        transparent: true,
        opacity: state.brake ? 0.9 : 0.45,
        side: THREE.DoubleSide,
      }),
    );
    lampGlint.position.set(side * 0.72, 0.91, -2.19);
    lampGlint.rotation.y = Math.PI;
    car.add(lampGlint);

    const headLamp = mesh(
      boxGeo(0.42, 0.16, 0.08),
      new THREE.MeshStandardMaterial({
        color: '#FFF3C4',
        emissive: '#FFE9A8',
        emissiveIntensity: 2.5,
        roughness: 0.18,
        envMapIntensity: 1.5,
      }),
    );
    headLamp.position.set(side * 0.72, 0.9, 2.13);
    car.add(headLamp);
  }

  const grille = mesh(
    boxGeo(1.1, 0.24, 0.06),
    new THREE.MeshStandardMaterial({color: '#202733', metalness: 0.8, roughness: 0.35}),
  );
  grille.position.set(0, 0.72, 2.14);
  car.add(grille);

  if (state.sports) {
    const wing = mesh(boxGeo(1.96, 0.08, 0.42), bodyPaint);
    wing.position.set(0, 1.36, -1.9);
    car.add(wing);
    for (const side of [-1, 1]) {
      const stand = mesh(boxGeo(0.08, 0.34, 0.08), trim);
      stand.position.set(side * 0.72, 1.19, -1.9);
      car.add(stand);
    }
  }

  for (const xPos of [-1.02, 1.02]) {
    for (const zPos of [-1.36, 1.36]) {
      const wheel = makeWheel(state.wheelSpin);
      wheel.position.set(xPos, 0.42, zPos);
      car.add(wheel);
    }
  }

  if (state.color === 'red' || state.sports || state.brake) {
    const headLight = new THREE.PointLight('#FFE9B8', state.sports ? 1.8 : 1.1, 11, 2);
    headLight.position.set(0, 0.95, 2.3);
    car.add(headLight);
    const tailLight = new THREE.PointLight('#EF2B2B', state.brake ? 1.9 : 0.5, 5, 2);
    tailLight.position.set(0, 0.92, -2.25);
    car.add(tailLight);
  }

  car.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const material = child.material as THREE.Material;
    if (material.transparent || material.opacity < 1) {
      child.castShadow = false;
      child.receiveShadow = false;
      return;
    }
    child.castShadow = true;
    child.receiveShadow = true;
  });

  return car;
};
