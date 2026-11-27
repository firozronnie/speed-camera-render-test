import * as THREE from 'three';
import {boxGeo, cylGeo, displayTexture, makeTexture, planeGeo, sphereGeo} from './textures';

export interface WorldOptions {
  night: boolean;
  pole: boolean;
  display?: string;
}

const standard = (color: string, roughness = 0.9, metalness = 0.05) =>
  new THREE.MeshStandardMaterial({color, roughness, metalness});

const rand = (i: number, salt = 0): number => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const mistTexture = () =>
  makeTexture('mist', 512, 160, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.55, 'rgba(255,255,255,0.32)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  });

const addRoad = (world: THREE.Group, night: boolean) => {
  const ground = new THREE.Mesh(
    planeGeo(140, 140),
    standard(night ? '#172B3E' : '#4C7C39', 1),
  );
  ground.rotation.x = -Math.PI / 2;
  world.add(ground);

  const road = new THREE.Mesh(
    planeGeo(9.2, 140),
    standard(night ? '#242E3B' : '#3A4149', 0.72, 0.08),
  );
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.025;
  world.add(road);

  for (const side of [-1, 1]) {
    const edge = new THREE.Mesh(boxGeo(0.12, 0.02, 140), standard('#F3F4F2', 0.8));
    edge.position.set(side * 4.45, 0.04, 0);
    world.add(edge);
  }

  const dashes = new THREE.InstancedMesh(
    boxGeo(0.14, 0.02, 1.5),
    standard('#F1F3F2', 0.8),
    70,
  );
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 70; i++) {
    dummy.position.set(0, 0.045, -69 + i * 2);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    dashes.setMatrixAt(i, dummy.matrix);
  }
  dashes.instanceMatrix.needsUpdate = true;
  world.add(dashes);
};

const addPole = (world: THREE.Group, display: string, night: boolean) => {
  const pole = new THREE.Group();
  pole.position.set(3.6, 0, 0);

  const stand = new THREE.Mesh(cylGeo(0.11, 0.15, 4.2, 16), standard('#9AA3AC', 0.35, 0.85));
  stand.position.y = 2.1;
  pole.add(stand);

  const base = new THREE.Mesh(cylGeo(0.38, 0.44, 0.24, 20), standard('#C8CDD2', 0.4, 0.7));
  base.position.y = 0.12;
  pole.add(base);

  const arm = new THREE.Mesh(boxGeo(0.96, 0.12, 0.14), standard('#AEB6BE', 0.4, 0.7));
  arm.position.set(-0.42, 3.95, 0);
  pole.add(arm);

  const boxBody = new THREE.Mesh(boxGeo(0.82, 0.62, 0.72), standard('#E8EDF0', 0.4, 0.45));
  boxBody.position.set(-0.86, 3.78, 0);
  pole.add(boxBody);

  const lens = new THREE.Mesh(cylGeo(0.17, 0.2, 0.18, 20), standard('#182338', 0.2, 0.7));
  lens.rotation.x = Math.PI / 2;
  lens.position.set(-0.86, 3.78, -0.42);
  pole.add(lens);

  const flashBulb = new THREE.Mesh(
    sphereGeo(0.13, 16),
    new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      emissive: '#FFFFFF',
      emissiveIntensity: night ? 2.4 : 1.5,
      roughness: 0.1,
    }),
  );
  flashBulb.position.set(-0.54, 4.05, -0.3);
  pole.add(flashBulb);

  const screen = new THREE.Mesh(
    planeGeo(0.78, 0.2),
    new THREE.MeshBasicMaterial({map: displayTexture(display), side: THREE.DoubleSide}),
  );
  screen.position.set(0, 2.86, 0.16);
  pole.add(screen);

  world.add(pole);
};

const addSkyline = (world: THREE.Group, night: boolean) => {
  const buildingMat = standard(night ? '#0E1C33' : '#5E6B7A', 0.85, 0.12);
  const windowMat = new THREE.MeshStandardMaterial({
    color: night ? '#FFD98A' : '#BFD3DE',
    emissive: night ? '#FFC860' : '#5C7484',
    emissiveIntensity: night ? 1.8 : 0.25,
    roughness: 0.4,
  });
  for (let i = 0; i < 16; i++) {
    const w = 2.4 + rand(i, 1) * 2.6;
    const h = 3 + rand(i, 2) * 9;
    const x = -28 + i * 3.7;
    const z = -52 - rand(i, 3) * 8;
    const building = new THREE.Mesh(boxGeo(w, h, 3), buildingMat);
    building.position.set(x, h / 2, z);
    world.add(building);
    for (let row = 0; row < Math.floor(h / 1.3); row++) {
      for (let col = 0; col < 3; col++) {
        if (rand(i * 31 + row * 3 + col, 4) < 0.36) continue;
        const win = new THREE.Mesh(boxGeo(0.34, 0.4, 0.05), windowMat);
        win.position.set(
          x - w / 2 + (col + 1) * (w / 4),
          0.9 + row * 1.3,
          z + 1.55,
        );
        world.add(win);
      }
    }
  }
};

const addTrees = (world: THREE.Group, night: boolean) => {
  const trunk = standard('#6A4526', 1);
  const leaves = standard(night ? '#1C4C37' : '#2F7C39', 0.95);
  const highlights = standard(night ? '#276347' : '#54A64A', 0.9);
  for (let i = 0; i < 30; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * (6.5 + rand(i, 5) * 14);
    const z = -34 + rand(i, 6) * 68;
    const scale = 0.8 + rand(i, 7) * 0.8;
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    const stem = new THREE.Mesh(cylGeo(0.16 * scale, 0.24 * scale, 1.5 * scale, 10), trunk);
    stem.position.y = 0.75 * scale;
    tree.add(stem);
    const cone1 = new THREE.Mesh(cylGeo(0, 1.05 * scale, 2 * scale, 12), leaves);
    cone1.position.y = 2.1 * scale;
    tree.add(cone1);
    const cone2 = new THREE.Mesh(cylGeo(0, 0.78 * scale, 1.5 * scale, 12), highlights);
    cone2.position.y = 3.0 * scale;
    tree.add(cone2);
    world.add(tree);
  }
};

const addGrassAndStones = (world: THREE.Group, night: boolean) => {
  const dummy = new THREE.Object3D();
  const grass = new THREE.InstancedMesh(
    planeGeo(0.11, 0.44),
    new THREE.MeshStandardMaterial({
      color: night ? '#2D6B42' : '#3E9438',
      roughness: 1,
      side: THREE.DoubleSide,
    }),
    2200,
  );
  for (let i = 0; i < 2200; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * (4.8 + rand(i, 8) * 28);
    const z = -55 + rand(i, 9) * 110;
    dummy.position.set(x, 0.22, z);
    dummy.rotation.set(0, rand(i, 10) * Math.PI, (rand(i, 11) - 0.5) * 0.35);
    dummy.scale.setScalar(0.75 + rand(i, 12) * 0.6);
    dummy.updateMatrix();
    grass.setMatrixAt(i, dummy.matrix);
    grass.setColorAt(
      i,
      new THREE.Color().setHSL(0.27 + rand(i, 13) * 0.05, 0.65, night ? 0.19 : 0.34),
    );
  }
  grass.instanceMatrix.needsUpdate = true;
  if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
  world.add(grass);

  const stones = new THREE.InstancedMesh(
    sphereGeo(0.13, 7),
    standard(night ? '#5B6675' : '#A9A093', 0.95),
    1400,
  );
  for (let i = 0; i < 1400; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * (4.7 + rand(i, 14) * 26);
    const z = -55 + rand(i, 15) * 110;
    const s = 0.45 + rand(i, 16) * 1.4;
    dummy.position.set(x, 0.08 * s, z);
    dummy.rotation.set(rand(i, 17), rand(i, 18) * Math.PI, rand(i, 19));
    dummy.scale.set(s, s * 0.62, s * 0.85);
    dummy.updateMatrix();
    stones.setMatrixAt(i, dummy.matrix);
  }
  stones.instanceMatrix.needsUpdate = true;
  world.add(stones);
};

const addAtmosphere = (world: THREE.Group, night: boolean) => {
  const mistMat = new THREE.MeshBasicMaterial({
    map: mistTexture(),
    transparent: true,
    opacity: night ? 0.35 : 0.55,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  for (const z of [-16, -28, -40]) {
    const mist = new THREE.Mesh(planeGeo(44, 3.4), mistMat);
    mist.position.set(0, 1.5, z);
    world.add(mist);
  }

  const sun = new THREE.Mesh(
    sphereGeo(2.4, 24),
    new THREE.MeshBasicMaterial({
      color: night ? '#B9D6FF' : '#FFE9B0',
      transparent: true,
      opacity: night ? 0.55 : 0.9,
    }),
  );
  sun.position.set(17, 24, -46);
  world.add(sun);

  const key = new THREE.DirectionalLight(
    night ? '#8FB4FF' : '#FFE2B4',
    night ? 0.65 : 2.35,
  );
  key.position.set(9, 17, 8);
  world.add(key);

  const fill = new THREE.HemisphereLight(
    night ? '#36517D' : '#DCEEFF',
    night ? '#0B1526' : '#4E6B32',
    night ? 0.45 : 1.15,
  );
  world.add(fill);

  const ambient = new THREE.AmbientLight('#FFFFFF', night ? 0.2 : 0.35);
  world.add(ambient);
};

const worldCache = new Map<string, THREE.Group>();

export const makeWorld = (options: WorldOptions): THREE.Group => {
  const key = `${options.night ? 'night' : 'day'}|${options.pole ? 'pole' : 'nopole'}|${options.display ?? ''}`;
  const cached = worldCache.get(key);
  if (cached) return cached;

  const world = new THREE.Group();
  addRoad(world, options.night);
  if (options.pole) addPole(world, options.display ?? 'SPEED CAMERA', options.night);
  addSkyline(world, options.night);
  addTrees(world, options.night);
  addGrassAndStones(world, options.night);
  addAtmosphere(world, options.night);
  worldCache.set(key, world);
  return world;
};
