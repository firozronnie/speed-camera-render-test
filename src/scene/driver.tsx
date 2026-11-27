import * as THREE from 'three';
import type {DriverState} from './shots-full';
import {bodyTexture, flatMaterial, headTexture, limbTexture, planeGeo} from './textures';

/** A flat, thick-outlined 2D cut-out living inside the 3D world. */
export const makeDriver = (state: DriverState): THREE.Group => {
  const root = new THREE.Group();
  root.position.set(state.x, state.y, state.z);
  root.rotation.y = state.yaw;
  root.scale.setScalar(state.scale);

  const jacket = state.jacket && state.jacket !== state.shirt ? state.jacket : undefined;
  const bodyMat = flatMaterial(bodyTexture(state.shirt, jacket));
  const body = new THREE.Mesh(planeGeo(1.02, 1.02), bodyMat);
  body.position.set(0, 0.75, 0);
  root.add(body);

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 1.35, 0.02);
  if (state.emotion === 'confusion') headPivot.rotation.z = 0.17;
  const headMat = flatMaterial(headTexture(state.emotion, state.faceColor ?? '#F2C29B'));
  const head = new THREE.Mesh(planeGeo(0.94, 0.94), headMat);
  headPivot.add(head);
  root.add(headPivot);

  const armMat = flatMaterial(limbTexture('arm', jacket ?? state.shirt));
  const legMat = flatMaterial(limbTexture('leg', '#243247'));

  const armLeft = new THREE.Group();
  armLeft.position.set(-0.46, 1.04, 0.04);
  const armLeftMesh = new THREE.Mesh(planeGeo(0.26, 0.86), armMat);
  armLeftMesh.position.set(0, -0.42, 0);
  armLeft.add(armLeftMesh);
  root.add(armLeft);

  const armRight = new THREE.Group();
  armRight.position.set(0.46, 1.04, 0.04);
  const armRightMesh = new THREE.Mesh(planeGeo(0.26, 0.86), armMat);
  armRightMesh.position.set(0, -0.42, 0);
  armRight.add(armRightMesh);
  root.add(armRight);

  const legLeft = new THREE.Group();
  legLeft.position.set(-0.2, 0.44, 0);
  const legLeftMesh = new THREE.Mesh(planeGeo(0.28, 0.92), legMat);
  legLeftMesh.position.set(0, -0.45, 0);
  legLeft.add(legLeftMesh);
  root.add(legLeft);

  const legRight = new THREE.Group();
  legRight.position.set(0.2, 0.44, 0);
  const legRightMesh = new THREE.Mesh(planeGeo(0.28, 0.92), legMat);
  legRightMesh.position.set(0, -0.45, 0);
  legRight.add(legRightMesh);
  root.add(legRight);

  const phase = state.walkPhase;
  const swing = Math.sin(phase);
  let leftArm = -0.12;
  let rightArm = 0.12;
  let leftLeg = 0;
  let rightLeg = 0;

  switch (state.pose) {
    case 'steer':
      leftArm = -1.02;
      rightArm = 1.02;
      legLeft.visible = false;
      legRight.visible = false;
      break;
    case 'wave':
      leftArm = -0.18;
      rightArm = 2.65 + swing * 0.22;
      break;
    case 'point':
      leftArm = -0.16;
      rightArm = 1.5;
      break;
    case 'reach':
      leftArm = -0.25;
      rightArm = 1.38;
      break;
    case 'arms-out':
      leftArm = -1.68;
      rightArm = 1.68;
      break;
    case 'climb':
      leftArm = -2.25 + swing * 0.45;
      rightArm = 2.25 - swing * 0.45;
      leftLeg = swing * 0.5;
      rightLeg = -swing * 0.5;
      break;
    case 'hold-check':
      leftArm = -1.22;
      rightArm = 1.22;
      break;
    case 'walk':
      leftLeg = swing * 0.62;
      rightLeg = -swing * 0.62;
      leftArm = -swing * 0.48;
      rightArm = swing * 0.48;
      break;
    case 'think': {
      leftArm = -0.14;
      rightArm = 1.3;
      const chinHand = new THREE.Mesh(
        new THREE.CircleGeometry(0.1, 16),
        new THREE.MeshBasicMaterial({color: '#F2C29B', side: THREE.DoubleSide}),
      );
      chinHand.position.set(0.3, 1.06, 0.18);
      root.add(chinHand);
      break;
    }
    case 'stand':
    default:
      break;
  }

  armLeft.rotation.z = leftArm;
  armRight.rotation.z = rightArm;
  legLeft.rotation.z = leftLeg;
  legRight.rotation.z = rightLeg;

  return root;
};
