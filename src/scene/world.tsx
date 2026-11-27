import * as THREE from 'three';
import {
  asphaltTexture,
  boxGeo,
  cloudTexture,
  cylGeo,
  displayTexture,
  facadeTexture,
  glowTexture,
  grassVariationTexture,
  laneMarkTexture,
  makeTexture,
  planeGeo,
  signTexture,
  skyGradientTexture,
  sphereGeo,
  roadTextTexture,
} from './textures';

export interface WorldOptions {
  night: boolean;
  pole: boolean;
  display?: string;
  frame?: number;
}

const standard = (color: string, roughness = 0.85, metalness = 0.1) =>
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
    grad.addColorStop(0.55, 'rgba(255,255,255,0.34)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  });

/** Real sky: gradient dome, glowing sun/moon, stars and slowly drifting clouds. */
const addSky = (world: THREE.Group, night: boolean) => {
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(190, 40, 28),
    new THREE.MeshBasicMaterial({
      map: skyGradientTexture(night),
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    }),
  );
  dome.renderOrder = -10;
  dome.userData.noShadow = true;
  world.add(dome);

  const bodyDir = night
    ? new THREE.Vector3(-26, 30, -42).normalize()
    : new THREE.Vector3(17, 24, -46).normalize();
  const bodyColor = night ? '#CFE0FF' : '#FFF1C2';

  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture(),
      color: night ? '#9FC4FF' : '#FFD98A',
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  halo.position.copy(bodyDir).multiplyScalar(150);
  halo.scale.setScalar(night ? 44 : 62);
  world.add(halo);

  const disc = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture(),
      color: bodyColor,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  disc.position.copy(bodyDir).multiplyScalar(149);
  disc.scale.setScalar(night ? 12 : 16);
  world.add(disc);

  if (night) {
    const positions: number[] = [];
    for (let i = 0; i < 320; i++) {
      const a = rand(i, 21) * Math.PI * 2;
      const b = 0.12 + rand(i, 22) * 1.05;
      const r = 172;
      positions.push(
        Math.cos(a) * Math.sin(b) * r,
        Math.cos(b) * r,
        Math.sin(a) * Math.sin(b) * r,
      );
    }
    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const stars = new THREE.Points(
      starsGeo,
      new THREE.PointsMaterial({
        color: '#E4EEFF',
        size: 1.6,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
        fog: false,
      }),
    );
    stars.userData.noShadow = true;
    world.add(stars);
  }

  const clouds = new THREE.Group();
  clouds.userData.noShadow = true;
  const cloudMat = new THREE.SpriteMaterial({
    map: cloudTexture(),
    transparent: true,
    opacity: night ? 0.24 : 0.62,
    depthWrite: false,
    fog: false,
  });
  for (let i = 0; i < 9; i++) {
    const a = rand(i, 23) * Math.PI * 2;
    const elevation = 0.22 + rand(i, 24) * 0.4;
    const r = 138;
    const cloud = new THREE.Sprite(cloudMat);
    cloud.position.set(
      Math.cos(a) * Math.cos(elevation) * r,
      Math.sin(elevation) * r + 16,
      Math.sin(a) * Math.cos(elevation) * r,
    );
    cloud.scale.set(58 + rand(i, 25) * 34, 24 + rand(i, 26) * 14, 1);
    clouds.add(cloud);
  }
  world.add(clouds);
  world.userData.clouds = clouds;
};

const addRoad = (world: THREE.Group, night: boolean) => {
  const ground = new THREE.Mesh(
    planeGeo(140, 140),
    new THREE.MeshStandardMaterial({
      map: grassVariationTexture(),
      color: night ? '#9FB8C8' : '#FFFFFF',
      roughness: 1,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.userData.receiveOnly = true;
  world.add(ground);

  const road = new THREE.Mesh(
    planeGeo(9.2, 140),
    new THREE.MeshStandardMaterial({
      map: asphaltTexture(),
      color: night ? '#AAB4C2' : '#FFFFFF',
      roughness: 0.66,
      metalness: 0.12,
    }),
  );
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.025;
  road.userData.receiveOnly = true;
  world.add(road);

  const shoulderMat = new THREE.MeshStandardMaterial({
    map: asphaltTexture(),
    color: night ? '#7A8794' : '#A69C8B',
    roughness: 0.95,
  });
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Mesh(planeGeo(1.4, 140), shoulderMat);
    shoulder.rotation.x = -Math.PI / 2;
    shoulder.position.set(side * 5.15, 0.02, 0);
    shoulder.userData.receiveOnly = true;
    world.add(shoulder);

    const edge = new THREE.Mesh(
      boxGeo(0.14, 0.02, 140),
      new THREE.MeshStandardMaterial({
        map: laneMarkTexture(),
        roughness: 0.8,
        metalness: 0.05,
      }),
    );
    edge.position.set(side * 4.45, 0.045, 0);
    edge.userData.receiveOnly = true;
    world.add(edge);
  }

  const dashes = new THREE.InstancedMesh(
    boxGeo(0.16, 0.02, 1.5),
    new THREE.MeshStandardMaterial({map: laneMarkTexture(), roughness: 0.8}),
    70,
  );
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 70; i++) {
    dummy.position.set(0, 0.05, -69 + i * 2);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    dashes.setMatrixAt(i, dummy.matrix);
  }
  dashes.instanceMatrix.needsUpdate = true;
  dashes.userData.receiveOnly = true;
  world.add(dashes);

  const grates = new THREE.InstancedMesh(
    boxGeo(0.5, 0.025, 1.15),
    standard('#232A32', 0.45, 0.75),
    24,
  );
  for (let i = 0; i < 24; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    dummy.position.set(side * 4.02, 0.055, -55 + Math.floor(i / 2) * 9.5);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    grates.setMatrixAt(i, dummy.matrix);
  }
  grates.instanceMatrix.needsUpdate = true;
  grates.userData.receiveOnly = true;
  world.add(grates);

  for (const [text, z, scale] of [
    ['40', -22, 0.72],
    ['SLOW', -38, 0.9],
    ['40', 26, 0.72],
  ] as Array<[string, number, number]>) {
    const marking = new THREE.Mesh(
      planeGeo(2.8, 1.4),
      new THREE.MeshStandardMaterial({
        map: roadTextTexture(text),
        transparent: true,
        roughness: 0.95,
        depthWrite: false,
      }),
    );
    marking.rotation.x = -Math.PI / 2;
    marking.position.set(0, 0.06, z);
    marking.scale.setScalar(scale);
    marking.userData.receiveOnly = true;
    world.add(marking);
  }
};

const addPole = (world: THREE.Group, display: string, night: boolean) => {
  const pole = new THREE.Group();
  pole.position.set(3.6, 0, 0);

  const plinth = new THREE.Mesh(boxGeo(1.05, 0.3, 1.05), standard('#B6BCC2', 0.9, 0.05));
  plinth.position.y = 0.15;
  pole.add(plinth);

  const stand = new THREE.Mesh(
    cylGeo(0.11, 0.15, 4.2, 16),
    new THREE.MeshStandardMaterial({color: '#AEB6BE', roughness: 0.24, metalness: 0.88}),
  );
  stand.position.y = 2.1;
  pole.add(stand);

  const base = new THREE.Mesh(
    cylGeo(0.38, 0.44, 0.24, 20),
    new THREE.MeshStandardMaterial({color: '#C8CDD2', roughness: 0.3, metalness: 0.8}),
  );
  base.position.y = 0.35;
  pole.add(base);

  const arm = new THREE.Mesh(
    boxGeo(0.96, 0.12, 0.14),
    new THREE.MeshStandardMaterial({color: '#B8C0C8', roughness: 0.26, metalness: 0.85}),
  );
  arm.position.set(-0.42, 3.95, 0);
  pole.add(arm);

  const boxBody = new THREE.Mesh(boxGeo(0.82, 0.62, 0.72), standard('#E8EDF0', 0.32, 0.42));
  boxBody.position.set(-0.86, 3.78, 0);
  pole.add(boxBody);

  const lens = new THREE.Mesh(
    cylGeo(0.17, 0.2, 0.18, 20),
    new THREE.MeshStandardMaterial({color: '#182338', roughness: 0.12, metalness: 0.6}),
  );
  lens.rotation.x = Math.PI / 2;
  lens.position.set(-0.86, 3.78, -0.42);
  pole.add(lens);

  const flashBulb = new THREE.Mesh(
    sphereGeo(0.13, 16),
    new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      emissive: '#FFFFFF',
      emissiveIntensity: night ? 2.8 : 1.8,
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

  const warning = new THREE.Mesh(
    planeGeo(0.62, 0.62),
    new THREE.MeshBasicMaterial({
      map: signTexture('!', '#FFD400', '#182338'),
      side: THREE.DoubleSide,
    }),
  );
  warning.position.set(-0.16, 2.05, 0.19);
  pole.add(warning);

  const cable = new THREE.Mesh(
    cylGeo(0.025, 0.025, 1.6, 8),
    standard('#2A3038', 0.6, 0.4),
  );
  cable.rotation.z = Math.PI / 2;
  cable.position.set(0.55, 3.86, 0);
  pole.add(cable);

  for (let i = -1; i <= 1; i++) {
    const bollard = new THREE.Mesh(
      cylGeo(0.09, 0.11, 0.78, 12),
      standard('#D4A017', 0.28, 0.75),
    );
    bollard.position.set(i * 0.42, 0.54, 0.72);
    pole.add(bollard);
  }

  world.add(pole);
};

const addSkyline = (world: THREE.Group, night: boolean) => {
  const buildingMat = standard(night ? '#13213A' : '#5B6875', 0.82, 0.16);
  const facadeMat = new THREE.MeshStandardMaterial({
    map: facadeTexture(night),
    roughness: 0.62,
    metalness: 0.22,
    emissive: night ? '#243C63' : '#000000',
    emissiveIntensity: night ? 0.5 : 0,
  });
  const roofMat = standard(night ? '#0C172A' : '#45515D', 0.75, 0.3);

  for (let i = 0; i < 18; i++) {
    const w = 2.4 + rand(i, 1) * 2.8;
    const h = 3.5 + rand(i, 2) * 10;
    const x = -30 + i * 3.6;
    const z = -52 - rand(i, 3) * 9;
    const building = new THREE.Mesh(boxGeo(w, h, 3.4), buildingMat);
    building.position.set(x, h / 2, z);
    world.add(building);

    const facade = new THREE.Mesh(planeGeo(w, h), facadeMat);
    facade.position.set(x, h / 2, z + 1.72);
    world.add(facade);

    const cap = new THREE.Mesh(boxGeo(w + 0.2, 0.25, 3.6), roofMat);
    cap.position.set(x, h + 0.12, z);
    world.add(cap);

    if (i % 3 === 0) {
      const antenna = new THREE.Mesh(cylGeo(0.03, 0.04, 1.6, 8), roofMat);
      antenna.position.set(x + w * 0.25, h + 0.9, z);
      world.add(antenna);
    }
  }
};

const addTrees = (world: THREE.Group, night: boolean) => {
  const bark = standard('#6A4526', 0.96, 0.02);
  const greens = [
    night ? '#18452F' : '#2F7C39',
    night ? '#235A3B' : '#439348',
    night ? '#2C6B45' : '#5AAA52',
    night ? '#1E5036' : '#357F42',
  ].map((color) => standard(color, 0.92, 0.03));

  for (let i = 0; i < 30; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * (6.5 + rand(i, 5) * 14);
    const z = -38 + rand(i, 6) * 74;
    const scale = 0.85 + rand(i, 7) * 0.75;
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);

    const stem = new THREE.Mesh(cylGeo(0.16 * scale, 0.26 * scale, 1.8 * scale, 10), bark);
    stem.position.y = 0.9 * scale;
    tree.add(stem);

    for (let blob = 0; blob < 4; blob++) {
      const a = blob * 1.57 + rand(i, 27) * 0.4;
      const foliage = new THREE.Mesh(sphereGeo(0.78 * scale, 14), greens[blob % greens.length]);
      foliage.position.set(
        Math.cos(a) * 0.44 * scale,
        (2.05 + blob * 0.36) * scale,
        Math.sin(a) * 0.44 * scale,
      );
      foliage.scale.set(1, 0.84, 1);
      tree.add(foliage);
    }
    world.add(tree);
  }
};

const addGrassAndStones = (world: THREE.Group, night: boolean) => {
  const dummy = new THREE.Object3D();
  const grass = new THREE.InstancedMesh(
    planeGeo(0.12, 0.46),
    new THREE.MeshStandardMaterial({
      map: grassVariationTexture(),
      color: night ? '#AFC8CF' : '#FFFFFF',
      roughness: 1,
      side: THREE.DoubleSide,
    }),
    2200,
  );
  for (let i = 0; i < 2200; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * (4.65 + rand(i, 8) * 28);
    const z = -55 + rand(i, 9) * 110;
    dummy.position.set(x, 0.23, z);
    dummy.rotation.set(0, rand(i, 10) * Math.PI, (rand(i, 11) - 0.5) * 0.35);
    dummy.scale.setScalar(0.75 + rand(i, 12) * 0.6);
    dummy.updateMatrix();
    grass.setMatrixAt(i, dummy.matrix);
    grass.setColorAt(
      i,
      new THREE.Color().setHSL(0.27 + rand(i, 13) * 0.05, 0.62, night ? 0.2 : 0.35),
    );
  }
  grass.instanceMatrix.needsUpdate = true;
  if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
  grass.userData.receiveOnly = true;
  world.add(grass);

  const stoneMat = new THREE.MeshStandardMaterial({
    color: night ? '#69788A' : '#ADA394',
    roughness: 0.92,
    metalness: 0.08,
  });
  const stones = new THREE.InstancedMesh(sphereGeo(0.13, 7), stoneMat, 1400);
  for (let i = 0; i < 1400; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const edge = i % 3 === 0;
    const x = side * (edge ? 5.0 + rand(i, 14) * 1.1 : 5.8 + rand(i, 14) * 25);
    const z = -55 + rand(i, 15) * 110;
    const s = 0.45 + rand(i, 16) * 1.4;
    dummy.position.set(x, 0.08 * s, z);
    dummy.rotation.set(rand(i, 17), rand(i, 18) * Math.PI, rand(i, 19));
    dummy.scale.set(s, s * 0.62, s * 0.85);
    dummy.updateMatrix();
    stones.setMatrixAt(i, dummy.matrix);
  }
  stones.instanceMatrix.needsUpdate = true;
  stones.userData.receiveOnly = true;
  world.add(stones);

  const hedge = new THREE.InstancedMesh(
    sphereGeo(0.5, 10),
    standard(night ? '#1E4C36' : '#347B3B', 0.95),
    140,
  );
  for (let i = 0; i < 140; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    dummy.position.set(
      side * (6.1 + rand(i, 28) * 0.5),
      0.34,
      -48 + rand(i, 29) * 96,
    );
    dummy.rotation.set(0, rand(i, 30) * Math.PI, 0);
    dummy.scale.set(1.1, 0.72, 1);
    dummy.updateMatrix();
    hedge.setMatrixAt(i, dummy.matrix);
  }
  hedge.instanceMatrix.needsUpdate = true;
  world.add(hedge);
};

const addStreetProps = (world: THREE.Group, night: boolean) => {
  const metal = new THREE.MeshStandardMaterial({
    color: '#B7C0C9',
    roughness: 0.25,
    metalness: 0.86,
  });
  const lampGlow = new THREE.MeshStandardMaterial({
    color: night ? '#FFF0C2' : '#F7F1D8',
    emissive: night ? '#FFD98A' : '#FFF3CC',
    emissiveIntensity: night ? 2.6 : 1.4,
    roughness: 0.25,
  });

  for (const z of [-34, -14, 6, 26]) {
    for (const side of [-1, 1]) {
      const lamp = new THREE.Group();
      lamp.position.set(side * 5.8, 0, z);
      const post = new THREE.Mesh(cylGeo(0.07, 0.11, 4.4, 12), metal);
      post.position.y = 2.2;
      lamp.add(post);
      const arm = new THREE.Mesh(boxGeo(0.7, 0.08, 0.08), metal);
      arm.position.set(-side * 0.32, 4.3, 0);
      lamp.add(arm);
      const head = new THREE.Mesh(boxGeo(0.42, 0.12, 0.24), lampGlow);
      head.position.set(-side * 0.6, 4.22, 0);
      lamp.add(head);
      world.add(lamp);
    }
  }

  for (const z of [-9, 9]) {
    for (const side of [-1, 1]) {
      const bin = new THREE.Group();
      bin.position.set(side * 5.35, 0, z);
      const drum = new THREE.Mesh(cylGeo(0.24, 0.2, 0.72, 14), standard('#2F6B4A', 0.6, 0.25));
      drum.position.y = 0.36;
      bin.add(drum);
      const lid = new THREE.Mesh(cylGeo(0.28, 0.28, 0.08, 14), standard('#1E4A34', 0.5, 0.3));
      lid.position.y = 0.76;
      bin.add(lid);
      world.add(bin);
    }
  }

  for (const [text, x, z] of [
    ['SLOW', -5.2, -20],
    ['CAMERA', 5.2, 16],
  ] as Array<[string, number, number]>) {
    const sign = new THREE.Group();
    sign.position.set(x, 0, z);
    const post = new THREE.Mesh(cylGeo(0.05, 0.06, 1.7, 10), metal);
    post.position.y = 0.85;
    sign.add(post);
    const face = new THREE.Mesh(
      planeGeo(0.9, 0.46),
      new THREE.MeshBasicMaterial({
        map: signTexture(text, '#FFFFFF', '#182338'),
        side: THREE.DoubleSide,
      }),
    );
    face.position.y = 1.85;
    sign.add(face);
    world.add(sign);
  }
};

const addAtmosphere = (world: THREE.Group, night: boolean) => {
  const mistMat = new THREE.MeshBasicMaterial({
    map: mistTexture(),
    transparent: true,
    opacity: night ? 0.42 : 0.5,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  for (const z of [-16, -28, -40]) {
    const mist = new THREE.Mesh(planeGeo(46, 3.6), mistMat);
    mist.position.set(0, 1.6, z);
    mist.userData.noShadow = true;
    world.add(mist);
  }

  const key = new THREE.DirectionalLight(night ? '#9BBEFF' : '#FFD9A6', night ? 1.35 : 3.0);
  key.position.set(18, 13, -9);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -40;
  key.shadow.camera.right = 40;
  key.shadow.camera.top = 40;
  key.shadow.camera.bottom = -40;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 100;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.028;
  key.shadow.radius = 3.5;
  key.target.position.set(0, 0, -6);
  world.add(key);
  world.add(key.target);

  const fill = new THREE.DirectionalLight(night ? '#4E71B8' : '#BFD9FF', night ? 0.55 : 0.7);
  fill.position.set(-12, 9, 14);
  world.add(fill);

  const hemi = new THREE.HemisphereLight(
    night ? '#4E6EA8' : '#DCEEFF',
    night ? '#101B2E' : '#5C7740',
    night ? 0.85 : 1.15,
  );
  world.add(hemi);
  world.add(new THREE.AmbientLight('#FFFFFF', night ? 0.5 : 0.38));
};

/** Long, soft, world-space shadows; never applied to faces or HUD planes. */
const enableShadows = (world: THREE.Group) => {
  world.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const material = child.material as THREE.Material;
    if (child.userData.noShadow || material.transparent || material.opacity < 1) {
      child.castShadow = false;
      child.receiveShadow = false;
      return;
    }
    child.castShadow = !child.userData.receiveOnly;
    child.receiveShadow = true;
  });
};

const worldCache = new Map<string, THREE.Group>();

export const makeWorld = (options: WorldOptions): THREE.Group => {
  const key = `${options.night ? 'night' : 'day'}|${options.pole ? 'pole' : 'nopole'}|${options.display ?? ''}`;
  const cached = worldCache.get(key);
  if (cached) {
    const clouds = cached.userData.clouds as THREE.Group | undefined;
    if (clouds) clouds.rotation.y = (options.frame ?? 0) * 0.000013;
    return cached;
  }

  const world = new THREE.Group();
  addSky(world, options.night);
  addRoad(world, options.night);
  if (options.pole) addPole(world, options.display ?? 'SPEED CAMERA', options.night);
  addSkyline(world, options.night);
  addTrees(world, options.night);
  addGrassAndStones(world, options.night);
  addStreetProps(world, options.night);
  addAtmosphere(world, options.night);
  enableShadows(world);
  worldCache.set(key, world);

  const clouds = world.userData.clouds as THREE.Group | undefined;
  if (clouds) clouds.rotation.y = (options.frame ?? 0) * 0.000013;
  return world;
};
