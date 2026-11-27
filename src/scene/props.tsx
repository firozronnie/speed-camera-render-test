import * as THREE from 'three';
import type {PropState} from './shots-full';
import {
  banknoteTexture,
  boxGeo,
  checkTexture,
  codeTexture,
  cylGeo,
  flatMaterial,
  planeGeo,
  questionTexture,
  roadTextTexture,
  signTexture,
  sphereGeo,
  torusGeo,
  tvTexture,
} from './textures';

const standard = (color: string, metalness = 0.15, roughness = 0.55) =>
  new THREE.MeshStandardMaterial({color, metalness, roughness});

const addCash = (
  group: THREE.Group,
  count: number,
  mode: 'burst' | 'rain',
) => {
  const dummy = new THREE.Object3D();
  const notes = new THREE.InstancedMesh(
    planeGeo(0.42, 0.21),
    flatMaterial(banknoteTexture()),
    count,
  );
  for (let i = 0; i < count; i++) {
    const a = i * 2.39996;
    if (mode === 'burst') {
      const r = 0.25 + (i % 6) * 0.13;
      dummy.position.set(
        Math.cos(a) * r * 0.8,
        1.0 + Math.sin(i * 1.7) * 0.95,
        0.35 + Math.cos(i * 0.9) * 0.35,
      );
      dummy.rotation.set(0, Math.sin(a) * 0.5, a * 0.31);
    } else {
      const column = i % 9;
      const row = Math.floor(i / 9);
      dummy.position.set(
        -1.05 + column * 0.26 + Math.sin(i * 2.1) * 0.05,
        0.55 + row * 0.72 + Math.cos(i) * 0.18,
        -0.6 + (i % 4) * 0.4,
      );
      dummy.rotation.set(0, Math.sin(a) * 0.4, a * 0.27);
    }
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    notes.setMatrixAt(i, dummy.matrix);
  }
  notes.instanceMatrix.needsUpdate = true;
  group.add(notes);
};

export const makeProp = (state: PropState): THREE.Group => {
  const group = new THREE.Group();
  group.position.set(state.x, state.y, state.z);
  group.rotation.y = state.rotationY;
  group.scale.setScalar(state.scale);

  switch (state.kind) {
    case 'fineSign': {
      const post = new THREE.Mesh(cylGeo(0.07, 0.09, 2.05, 12), standard('#8A939E', 0.8, 0.35));
      post.position.y = 1.02;
      group.add(post);
      const backing = new THREE.Mesh(boxGeo(2.0, 1.06, 0.12), standard('#1B2940', 0.5, 0.4));
      backing.position.y = 2.12;
      group.add(backing);
      const board = new THREE.Mesh(
        planeGeo(1.88, 0.94),
        flatMaterial(signTexture(state.text ?? '$150')),
      );
      board.position.set(0, 2.12, 0.08);
      group.add(board);
      break;
    }
    case 'roadText': {
      const paint = new THREE.Mesh(
        planeGeo(5.2, 2.6),
        flatMaterial(roadTextTexture(state.text ?? 'SLOW!')),
      );
      paint.rotation.x = -Math.PI / 2;
      paint.position.y = 0.01;
      group.add(paint);
      break;
    }
    case 'ladder': {
      for (const side of [-1, 1]) {
        const rail = new THREE.Mesh(boxGeo(0.09, 3.7, 0.09), standard('#C0C6CC', 0.75, 0.3));
        rail.position.set(side * 0.42, 1.85, 0);
        group.add(rail);
        const foot = new THREE.Mesh(cylGeo(0.08, 0.08, 0.2, 10), standard('#333A44', 0.4, 0.7));
        foot.rotation.z = Math.PI / 2;
        foot.position.set(side * 0.42, 0.08, 0);
        group.add(foot);
      }
      for (let i = 0; i < 11; i++) {
        const rung = new THREE.Mesh(boxGeo(0.94, 0.06, 0.08), standard('#D4A017', 0.85, 0.28));
        rung.position.set(0, 0.3 + i * 0.33, 0);
        group.add(rung);
      }
      break;
    }
    case 'tablet': {
      const shell = new THREE.Mesh(boxGeo(1.1, 0.72, 0.08), standard('#1B2434', 0.7, 0.28));
      group.add(shell);
      const screen = new THREE.Mesh(
        planeGeo(1.02, 0.64),
        flatMaterial(codeTexture(state.text ?? 'if (speed < limit) flash()')),
      );
      screen.position.z = 0.05;
      group.add(screen);
      const glow = new THREE.PointLight('#7DE2A9', 2.2, 4);
      glow.position.z = 0.5;
      group.add(glow);
      break;
    }
    case 'mailbox': {
      const post = new THREE.Mesh(cylGeo(0.07, 0.09, 1.15, 12), standard('#6B7280', 0.55, 0.6));
      post.position.y = 0.57;
      group.add(post);
      const box = new THREE.Mesh(boxGeo(0.62, 0.42, 0.46), standard('#1565C0', 0.35, 0.4));
      box.position.y = 1.32;
      group.add(box);
      const lid = new THREE.Mesh(boxGeo(0.08, 0.42, 0.46), standard('#1565C0', 0.35, 0.4));
      lid.position.set(0.31, 1.53, 0);
      group.add(lid);
      const flag = new THREE.Mesh(boxGeo(0.06, 0.34, 0.06), standard('#EF2B2B', 0.3, 0.5));
      flag.position.set(0.36, 1.58, 0);
      group.add(flag);
      const slot = new THREE.Mesh(boxGeo(0.4, 0.035, 0.02), standard('#0B1B2E', 0.2, 0.8));
      slot.position.set(0, 1.32, 0.24);
      group.add(slot);
      break;
    }
    case 'check': {
      const paper = new THREE.Mesh(planeGeo(1.9, 0.95), flatMaterial(checkTexture()));
      group.add(paper);
      const glint = new THREE.Mesh(
        planeGeo(1.9, 0.95),
        new THREE.MeshBasicMaterial({
          color: '#FFFFFF',
          transparent: true,
          opacity: 0.12,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      glint.position.z = 0.01;
      group.add(glint);
      break;
    }
    case 'cash':
      addCash(group, state.count ?? 26, state.mode ?? 'burst');
      break;
    case 'question': {
      const sign = new THREE.Mesh(planeGeo(1.35, 1.35), flatMaterial(questionTexture()));
      group.add(sign);
      break;
    }
    case 'overhead': {
      for (const side of [-1, 1]) {
        const post = new THREE.Mesh(cylGeo(0.1, 0.12, 4.7, 12), standard('#8A939E', 0.75, 0.38));
        post.position.set(side * 2.6, 2.35, 0);
        group.add(post);
      }
      const backing = new THREE.Mesh(boxGeo(5.0, 0.86, 0.16), standard('#0B6B3A', 0.25, 0.5));
      backing.position.y = 4.6;
      group.add(backing);
      const face = new THREE.Mesh(
        planeGeo(4.8, 0.68),
        flatMaterial(signTexture('GOOD DRIVERS FLASHED', '#0B6B3A', '#FFFFFF')),
      );
      face.position.set(0, 4.6, 0.1);
      group.add(face);
      break;
    }
    case 'fence': {
      for (let i = 0; i <= 12; i++) {
        const post = new THREE.Mesh(boxGeo(0.08, 1.1, 0.08), standard('#E8EDF0', 0.2, 0.7));
        post.position.set(-3 + i * 0.5, 0.55, 0);
        group.add(post);
      }
      for (const y of [0.35, 0.85]) {
        const rail = new THREE.Mesh(boxGeo(6.1, 0.08, 0.08), standard('#F4F6F7', 0.2, 0.65));
        rail.position.set(0, y, 0);
        group.add(rail);
      }
      break;
    }
    case 'livingRoom': {
      const rug = new THREE.Mesh(
        planeGeo(5.4, 3.4),
        new THREE.MeshStandardMaterial({color: '#A63D3D', roughness: 0.95}),
      );
      rug.rotation.x = -Math.PI / 2;
      rug.position.set(0, 0.02, 0.2);
      group.add(rug);
      const rugBorder = new THREE.Mesh(
        torusGeo(1.6, 0.08, 8, 36),
        standard('#D4A017', 0.5, 0.6),
      );
      rugBorder.rotation.x = -Math.PI / 2;
      rugBorder.scale.set(1.5, 0.95, 1);
      rugBorder.position.set(0, 0.04, 0.2);
      group.add(rugBorder);

      const sofa = new THREE.Mesh(boxGeo(3.3, 0.34, 0.95), standard('#3E74A6', 0.1, 0.85));
      sofa.position.set(0, 0.34, 0.85);
      group.add(sofa);
      const back = new THREE.Mesh(boxGeo(3.3, 0.3, 0.2), standard('#2F6696', 0.1, 0.85));
      back.position.set(0, 0.6, 1.12);
      group.add(back);
      for (const side of [-1, 1]) {
        const arm = new THREE.Mesh(boxGeo(0.24, 0.38, 0.95), standard('#2F6696', 0.1, 0.85));
        arm.position.set(side * 1.55, 0.56, 0.85);
        group.add(arm);
      }

      const tvCase = new THREE.Mesh(boxGeo(2.5, 1.5, 0.18), standard('#182338', 0.45, 0.35));
      tvCase.position.set(0, 1.95, -1.8);
      group.add(tvCase);
      const screen = new THREE.Mesh(planeGeo(2.32, 1.32), flatMaterial(tvTexture()));
      screen.position.set(0, 1.95, -1.69);
      group.add(screen);
      const stand = new THREE.Mesh(boxGeo(0.16, 0.8, 0.16), standard('#4B5563', 0.6, 0.4));
      stand.position.set(0, 0.85, -1.8);
      group.add(stand);
      break;
    }
    case 'drum': {
      const base = new THREE.Mesh(boxGeo(2.4, 0.24, 2.4), standard('#D4A017', 0.85, 0.26));
      base.position.y = 0.12;
      group.add(base);
      const glassShell = new THREE.Mesh(
        cylGeo(1.02, 1.02, 1.5, 32),
        new THREE.MeshPhysicalMaterial({
          color: '#BFE3F2',
          transparent: true,
          opacity: 0.24,
          metalness: 0.1,
          roughness: 0.06,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      glassShell.position.y = 0.99;
      group.add(glassShell);
      for (const y of [0.25, 1.74]) {
        const rim = new THREE.Mesh(torusGeo(1.03, 0.055, 10, 36), standard('#F6D774', 0.95, 0.18));
        rim.rotation.x = Math.PI / 2;
        rim.position.y = y;
        group.add(rim);
      }
      const dummy = new THREE.Object3D();
      const notes = new THREE.InstancedMesh(
        planeGeo(0.34, 0.17),
        flatMaterial(banknoteTexture()),
        34,
      );
      for (let i = 0; i < 34; i++) {
        const a = i * 2.39996;
        const r = 0.2 + (i % 6) * 0.11;
        dummy.position.set(
          Math.cos(a) * r,
          0.45 + (i % 7) * 0.18,
          Math.sin(a) * r,
        );
        dummy.rotation.set(0, a, Math.sin(a) * 0.6);
        dummy.updateMatrix();
        notes.setMatrixAt(i, dummy.matrix);
      }
      notes.instanceMatrix.needsUpdate = true;
      group.add(notes);
      const glow = new THREE.PointLight('#FFD36B', 3, 7);
      glow.position.set(0, 2.2, 0);
      group.add(glow);
      break;
    }
    case 'jackpot': {
      const bodyMesh = new THREE.Mesh(
        boxGeo(1.7, 2.3, 0.95),
        new THREE.MeshPhysicalMaterial({
          color: '#C8102E',
          metalness: 0.45,
          roughness: 0.16,
          clearcoat: 1,
          clearcoatRoughness: 0.06,
          envMapIntensity: 1.7,
        }),
      );
      bodyMesh.position.y = 1.15;
      group.add(bodyMesh);
      const goldTrim = new THREE.MeshStandardMaterial({
        color: '#D4A017',
        metalness: 0.96,
        roughness: 0.14,
        emissive: '#6B4A05',
        emissiveIntensity: 0.42,
        envMapIntensity: 1.9,
      });
      const trim = new THREE.Mesh(boxGeo(1.78, 2.38, 0.12), goldTrim);
      trim.position.z = 0.48;
      group.add(trim);
      for (let i = 0; i < 14; i++) {
        const rivet = new THREE.Mesh(sphereGeo(0.035, 8), goldTrim);
        rivet.position.set(i % 2 ? 0.83 : -0.83, 0.2 + Math.floor(i / 2) * 0.32, 0.55);
        group.add(rivet);
      }
      const marquee = new THREE.Mesh(
        planeGeo(1.56, 0.42),
        flatMaterial(signTexture('JACKPOT', '#17233C', '#FFD400')),
      );
      marquee.position.set(0, 2.06, 0.56);
      group.add(marquee);
      for (let i = 0; i < 3; i++) {
        const reel = new THREE.Mesh(
          planeGeo(0.4, 0.62),
          flatMaterial(signTexture('$', '#F7F7F2', '#1F6B45')),
        );
        reel.position.set(-0.52 + i * 0.52, 1.3, 0.57);
        group.add(reel);
      }
      const tray = new THREE.Mesh(boxGeo(1.1, 0.14, 0.36), standard('#D4A017', 0.9, 0.22));
      tray.position.set(0, 0.62, 0.6);
      group.add(tray);
      const lever = new THREE.Mesh(sphereGeo(0.14, 16), standard('#EF2B2B', 0.3, 0.3));
      lever.position.set(0.98, 1.45, 0.35);
      group.add(lever);
      const leverRod = new THREE.Mesh(cylGeo(0.04, 0.04, 0.6, 10), standard('#C8CDD2', 0.9, 0.2));
      leverRod.position.set(0.98, 1.15, 0.35);
      group.add(leverRod);
      const glow = new THREE.PointLight('#FFD98A', 5.2, 10, 2);
      glow.position.set(0, 2.4, 1.6);
      group.add(glow);
      const rimGlow = new THREE.PointLight('#6E9BFF', 2.6, 9, 2);
      rimGlow.position.set(-1.4, 1.4, -0.8);
      group.add(rimGlow);
      break;
    }
  }

  group.traverse((child) => {
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

  return group;
};
