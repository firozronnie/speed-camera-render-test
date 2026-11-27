export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const TOTAL_FRAMES = 1732;

export const HUD_RED = '#EF2B2B';
export const HUD_GREEN = '#22C55E';

export type CarColor = 'red' | 'blue' | 'silver' | 'green' | 'white' | 'gold';
export type Emotion =
  | 'neutral'
  | 'shock'
  | 'worry'
  | 'confusion'
  | 'happy'
  | 'grumpy'
  | 'thinking'
  | 'skeleton';
export type Pose =
  | 'stand'
  | 'steer'
  | 'wave'
  | 'point'
  | 'reach'
  | 'arms-out'
  | 'climb'
  | 'hold-check'
  | 'walk'
  | 'think';

export type PropKind =
  | 'fineSign'
  | 'roadText'
  | 'ladder'
  | 'tablet'
  | 'mailbox'
  | 'check'
  | 'cash'
  | 'question'
  | 'overhead'
  | 'fence'
  | 'livingRoom'
  | 'drum'
  | 'jackpot';

export interface CameraState {
  readonly position: readonly [number, number, number];
  readonly lookAt: readonly [number, number, number];
  readonly fov: number;
}

export interface CarState {
  id: string;
  color: CarColor;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  brake: boolean;
  wheelSpin: number;
  sports: boolean;
}

export interface DriverState {
  id: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  emotion: Emotion;
  pose: Pose;
  scale: number;
  seated: boolean;
  walking: boolean;
  walkPhase: number;
  shirt: string;
  jacket?: string;
  faceColor?: string;
}

export interface PropState {
  kind: PropKind;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  scale: number;
  text?: string;
  mode?: 'burst' | 'rain';
  count?: number;
}

export interface HudState {
  text: string;
  color: string;
  sub?: string;
}

export interface FullShotState {
  shot: number;
  frame: number;
  progress: number;
  camera: CameraState;
  cars: CarState[];
  drivers: DriverState[];
  props: PropState[];
  hud: HudState | null;
  flash: number;
  night: boolean;
  pole: boolean;
  poleDisplay?: string;
}

/** Voice-beat start frames. Content still switches on the exact measured beats. */
const STORY_BEATS: ReadonlyArray<number> = [
  0, 103, 150, 185, 229, 333, 402, 441, 504, 551, 612, 728, 761, 805, 902,
  989, 1080, 1115, 1187, 1235, 1303, 1392, 1476, 1514, 1577, 1642,
];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => t * t * (3 - 2 * t);

interface CameraKeyframe {
  frame: number;
  position: readonly [number, number, number];
  lookAt: readonly [number, number, number];
  fov: number;
}

/**
 * One continuous camera path. Keyframes land every 36-39 frames and alternate
 * wide (11-14), medium (7), close (3.3-4.5) and extreme (2.1-2.2) distances,
 * rotating through aerial, high, eye-level, low, side and over-shoulder angles.
 */
const CAMERA_KEYS: ReadonlyArray<CameraKeyframe> = [
  {frame: 0, position: [1.43, 12.28, 3.85], lookAt: [0, 1, 0], fov: 52},
  {frame: 36, position: [-1.7, 1.68, 6.33], lookAt: [-1.7, 1, 3], fov: 68},
  {frame: 72, position: [-4.49, 3.94, 4.49], lookAt: [0, 1, 0], fov: 66},
  {frame: 108, position: [2.28, 1.73, -1.05], lookAt: [0, 1, -3.33], fov: 68},
  {frame: 144, position: [7.09, 7.6, -5.56], lookAt: [0, 1, 1.53], fov: 42},
  {frame: 180, position: [0, 2.02, -2.02], lookAt: [0, 1, 1.22], fov: 66},
  {frame: 216, position: [-4.55, 4.24, -3.06], lookAt: [0, 1, 1.49], fov: 54},
  {frame: 252, position: [-5.44, 1.07, -3.75], lookAt: [-2.04, 0.9, -3.75], fov: 68},
  {frame: 288, position: [-7.25, 7.24, 5.47], lookAt: [0, 1, -1.78], fov: 56},
  {frame: 324, position: [0.68, 1.65, 3.14], lookAt: [0.68, 0.9, -0.18], fov: 68},
  {frame: 360, position: [4.29, 4.5, 2.28], lookAt: [0, 1, -2.01], fov: 54},
  {frame: 396, position: [0, 1.51, 3.86], lookAt: [0, 0.85, 0.63], fov: 68},
  {frame: 432, position: [-4.44, 4.81, 4.34], lookAt: [-0.1, 1.45, 0], fov: 52},
  {frame: 468, position: [1.67, 13.26, 2.49], lookAt: [0, 0.1, -2], fov: 56},
  {frame: 504, position: [2.74, 4.95, -4.45], lookAt: [2.74, 3.78, -0.1], fov: 58},
  {frame: 540, position: [0.78, 4.77, -0.42], lookAt: [2.74, 3.78, -0.42], fov: 54},
  {frame: 576, position: [1.68, 10.85, 4.51], lookAt: [0, 0.95, 0], fov: 48},
  {frame: 612, position: [2.35, 1.65, -0.65], lookAt: [0, 0.9, -3], fov: 68},
  {frame: 648, position: [-4.13, 4.85, 2.55], lookAt: [0, 1, -1.58], fov: 54},
  {frame: 684, position: [1.37, 1.65, 0.3], lookAt: [0, 0.85, -1.07], fov: 56},
  {frame: 720, position: [10.39, 7, 2.76], lookAt: [0, 1, 2.76], fov: 44},
  {frame: 756, position: [5.93, 3.85, 2.43], lookAt: [3.6, 3, 0.1], fov: 66},
  {frame: 792, position: [0.5, 4.51, 6.34], lookAt: [0.5, 1.15, 0.2], fov: 52},
  {frame: 828, position: [-2.28, 1.63, 2.44], lookAt: [0, 0.9, 0.16], fov: 66},
  {frame: 864, position: [1.65, 12.04, 4.95], lookAt: [0, 1, 0.53], fov: 52},
  {frame: 900, position: [0, 1.53, 4.24], lookAt: [0, 0.85, 0.91], fov: 68},
  {frame: 936, position: [-4.23, 5.14, 4.43], lookAt: [0, 1.5, 0.2], fov: 56},
  {frame: 972, position: [0, 3.08, 2.22], lookAt: [0, 2.2, 0.2], fov: 66},
  {frame: 1008, position: [-9.61, 2.54, 0], lookAt: [-2.78, 1, 0], fov: 66},
  {frame: 1044, position: [-0.63, 4.1, 1.06], lookAt: [-1.02, 1, 0], fov: 52},
  {frame: 1080, position: [1.05, 3.64, 11.71], lookAt: [1.05, 1, 0], fov: 64},
  {frame: 1116, position: [2.11, 3.23, 2.51], lookAt: [0, 1.6, 0.4], fov: 68},
  {frame: 1152, position: [0, 4.54, 6.75], lookAt: [0, 1.6, 0.4], fov: 56},
  {frame: 1188, position: [-1.36, 1.84, 1.36], lookAt: [0, 1, 0], fov: 66},
  {frame: 1224, position: [1.43, 12.58, 3.85], lookAt: [0, 1.3, 0], fov: 54},
  {frame: 1260, position: [0.6, 1.88, 3.53], lookAt: [0.6, 1.2, 0.2], fov: 64},
  {frame: 1296, position: [4.65, 4.84, 4.45], lookAt: [0.3, 1.1, 0.1], fov: 56},
  {frame: 1332, position: [0, 1.89, 3.2], lookAt: [0, 1.1, 0], fov: 68},
  {frame: 1368, position: [1.65, 12.24, 4.42], lookAt: [0, 1.2, 0], fov: 52},
  {frame: 1404, position: [-1.43, 2.18, -1.43], lookAt: [0, 1.3, 0], fov: 74},
  {frame: 1440, position: [0, 4.5, -8.17], lookAt: [0, 1, -2.11], fov: 56},
  {frame: 1476, position: [1.51, 1.66, -4.29], lookAt: [3.8, 1, -2], fov: 68},
  {frame: 1512, position: [1.65, 12.04, -7.42], lookAt: [0, 1, -3], fov: 56},
  {frame: 1548, position: [-2.35, 1.65, 1.99], lookAt: [0, 0.9, -0.36], fov: 68},
  {frame: 1584, position: [0, 4.7, 6.44], lookAt: [0, 1.1, 0.2], fov: 56},
  {frame: 1620, position: [1.36, 2.64, -0.14], lookAt: [0, 1.8, -1.5], fov: 56},
  {frame: 1656, position: [1.51, 11.12, 4.05], lookAt: [0, 1, 0], fov: 48},
  {frame: 1692, position: [-3.04, 1.97, 3.04], lookAt: [0, 1, 0], fov: 68},
  {frame: 1731, position: [0, 1.88, 1.91], lookAt: [0, 1, 0], fov: 56},
];

const cameraAt = (frame: number): CameraState => {
  const f = clamp(Math.round(frame), 0, TOTAL_FRAMES - 1);
  let index = CAMERA_KEYS.length - 2;
  for (let i = 0; i < CAMERA_KEYS.length - 1; i++) {
    if (f <= CAMERA_KEYS[i + 1].frame) {
      index = i;
      break;
    }
  }
  const a = CAMERA_KEYS[index];
  const b = CAMERA_KEYS[index + 1];
  const raw = clamp((f - a.frame) / (b.frame - a.frame), 0, 1);
  const t = easeInOut(raw);
  const shimmer = Math.sin(Math.PI * raw);
  const driftX = shimmer * Math.sin(f * 0.17) * 0.06;
  const driftY = shimmer * Math.cos(f * 0.13) * 0.05;
  const driftZ = driftX * 0.5;
  return {
    position: [
      lerp(a.position[0], b.position[0], t) + driftX,
      lerp(a.position[1], b.position[1], t) + driftY,
      lerp(a.position[2], b.position[2], t) + driftZ,
    ],
    lookAt: [
      lerp(a.lookAt[0], b.lookAt[0], t) + driftX,
      lerp(a.lookAt[1], b.lookAt[1], t) + driftY,
      lerp(a.lookAt[2], b.lookAt[2], t) + driftZ,
    ],
    fov: lerp(a.fov, b.fov, t),
  };
};

const mkCar = (over: Partial<CarState> = {}): CarState => ({
  id: 'car',
  color: 'red',
  x: 0,
  y: 0,
  z: 0,
  rotationY: 0,
  brake: false,
  wheelSpin: 0,
  sports: false,
  ...over,
});

const mkDriver = (over: Partial<DriverState> = {}): DriverState => ({
  id: 'driver',
  x: 0,
  y: 0,
  z: 0,
  yaw: 0,
  emotion: 'neutral',
  pose: 'stand',
  scale: 1,
  seated: false,
  walking: false,
  walkPhase: 0,
  shirt: '#2C7BC7',
  ...over,
});

/** Warm-skinned face, fully below the roofline, seen only through the glass. */
const inCar = (z: number, over: Partial<DriverState> = {}): DriverState =>
  mkDriver({
    seated: true,
    pose: 'steer',
    y: 0.34,
    z: z - 0.25,
    scale: 0.62,
    ...over,
  });

const mkProp = (kind: PropKind, over: Partial<PropState> = {}): PropState => ({
  kind,
  x: 0,
  y: 0,
  z: 0,
  rotationY: 0,
  scale: 1,
  ...over,
});

export const getFullShotState = (frame: number): FullShotState => {
  const f = clamp(Math.round(frame), 0, TOTAL_FRAMES - 1);
  let shot = STORY_BEATS.length - 1;
  for (let i = STORY_BEATS.length - 1; i >= 0; i--) {
    if (f >= STORY_BEATS[i]) {
      shot = i;
      break;
    }
  }
  const start = STORY_BEATS[shot];
  const end = shot + 1 < STORY_BEATS.length ? STORY_BEATS[shot + 1] - 1 : TOTAL_FRAMES - 1;
  const progress = clamp((f - start) / Math.max(1, end - start), 0, 1);
  const camera = cameraAt(f);
  const t = f / FPS;

  let cars: CarState[] = [];
  let drivers: DriverState[] = [];
  let props: PropState[] = [];
  let hud: HudState | null = null;
  let flash = 0;
  let night = false;
  let pole = true;
  let poleDisplay: string | undefined;

  switch (shot) {
    case 0: {
      // 1. Hook: aerial push-in, blue and silver cars passing opposite ways.
      cars = [
        mkCar({
          id: 'blue',
          color: 'blue',
          x: -1.7,
          z: lerp(9, -8, progress),
          rotationY: Math.PI,
          wheelSpin: t * 7,
        }),
        mkCar({
          id: 'silver',
          color: 'silver',
          x: 1.7,
          z: lerp(-11, 7, progress),
          wheelSpin: t * 7,
        }),
      ];
      break;
    }
    case 1: {
      // 2. Head-on red car, 62 MPH.
      const z = lerp(-4, 2.2, progress);
      cars = [mkCar({id: 'red', color: 'red', x: 0, z, wheelSpin: t * 8})];
      drivers = [inCar(z, {id: 'red-driver', emotion: progress < 0.3 ? 'shock' : 'neutral'})];
      hud = {text: '62 MPH', color: HUD_RED};
      break;
    }
    case 2: {
      // 3. Side profile braking, 62 -> 18, shock then neutral.
      const z = lerp(-1.6, 1.6, progress);
      cars = [mkCar({id: 'red', color: 'red', x: 0, z, brake: true, wheelSpin: t * 3})];
      drivers = [
        inCar(z, {id: 'red-driver', emotion: progress < 0.55 ? 'shock' : 'neutral'}),
      ];
      hud = {text: '18 MPH', color: HUD_GREEN};
      break;
    }
    case 3: {
      // 4. Rear view, speeding away again at 62.
      const z = lerp(-5, 4, progress);
      cars = [
        mkCar({id: 'red', color: 'red', x: 0, z, rotationY: Math.PI, wheelSpin: t * 9}),
      ];
      drivers = [inCar(z, {id: 'red-driver', emotion: 'grumpy'})];
      hud = {text: '62 MPH', color: HUD_RED};
      break;
    }
    case 4: {
      // 5. Six cars all braking at the pole.
      const cols: CarColor[] = ['red', 'blue', 'silver', 'green', 'white', 'white'];
      cars = cols.map((color, i) =>
        mkCar({
          id: `six-${i}`,
          color,
          x: -3.4 + i * 1.36,
          z: lerp(-5, 0.6, progress),
          brake: true,
          wheelSpin: t * 2,
        }),
      );
      break;
    }
    case 5: {
      // 6. Highway to skyline, 101 MPH, grumpy.
      const z = lerp(-4, 1, progress);
      cars = [mkCar({id: 'red', color: 'red', x: 0, z, wheelSpin: t * 9})];
      drivers = [inCar(z, {id: 'red-driver', emotion: 'grumpy'})];
      hud = {text: '101 MPH', color: HUD_RED};
      break;
    }
    case 6: {
      // 7. Fine sign flips $150 -> $300, man points and thinks.
      props = [
        mkProp('fineSign', {
          x: -1.2,
          y: 0,
          z: 0,
          scale: 0.85,
          text: progress < 0.5 ? '$150' : '$300',
        }),
      ];
      drivers = [
        mkDriver({
          id: 'official',
          x: 1.05,
          z: 0.2,
          pose: 'point',
          emotion: 'thinking',
          shirt: '#E8A33D',
        }),
      ];
      break;
    }
    case 7: {
      // 8. Giant SLOW! painted on the road, top-down.
      props = [mkProp('roadText', {x: 0, y: 0.02, z: -2, text: 'SLOW!', scale: 1.1})];
      cars = [mkCar({id: 'passer', color: 'silver', x: 2.2, z: -6, wheelSpin: t * 3})];
      break;
    }
    case 8: {
      // 9. Camera box close-up: 27 UNDER LIMIT.
      poleDisplay = '27 UNDER LIMIT';
      break;
    }
    case 9: {
      // 10. The one and only X-ray skeleton gag, with bright opening flash.
      cars = [mkCar({id: 'red', color: 'red', x: 0, z: 0})];
      drivers = [inCar(0, {id: 'xray', emotion: 'skeleton'})];
      flash = progress < 0.18 ? clamp(1 - progress / 0.18, 0, 1) : 0;
      break;
    }
    case 10: {
      // 11. Rich mocker: cash burst, then rear view, 112 MPH.
      if (progress < 0.55) {
        const z = lerp(-3, -0.5, progress / 0.55);
        cars = [
          mkCar({id: 'sports', color: 'red', x: 0, z, sports: true, wheelSpin: t * 9}),
        ];
        drivers = [inCar(z, {id: 'mocker', emotion: 'grumpy'})];
        props = [mkProp('cash', {x: 0, y: 0, z: 0, mode: 'burst', count: 26})];
        hud = {text: '112 MPH', color: HUD_RED};
      } else {
        const q = (progress - 0.55) / 0.45;
        const z = lerp(-2, 3.5, q);
        cars = [
          mkCar({
            id: 'sports',
            color: 'red',
            x: 0,
            z,
            rotationY: Math.PI,
            sports: true,
            wheelSpin: t * 9,
          }),
        ];
        drivers = [inCar(z, {id: 'mocker', emotion: 'grumpy'})];
        hud = {text: '112 MPH', color: HUD_RED};
      }
      break;
    }
    case 11: {
      // 12. The pivot hero on his ladder at the camera pole.
      props = [mkProp('ladder', {x: 3.6, y: 0, z: 0})];
      drivers = [
        mkDriver({
          id: 'hero',
          x: 3.6,
          y: 2.9,
          z: 0.1,
          pose: 'wave',
          emotion: 'happy',
          shirt: '#2E9E44',
          jacket: '#2E9E44',
          scale: 0.85,
        }),
      ];
      break;
    }
    case 12: {
      // 13. Inventor close-up, tablet shows the new rule as code BESIDE his face.
      drivers = [
        mkDriver({
          id: 'inventor',
          x: 0,
          y: 0,
          z: 0,
          pose: 'think',
          emotion: 'thinking',
          shirt: '#3D5A80',
        }),
      ];
      props = [
        mkProp('tablet', {
          x: 1.05,
          y: 1.0,
          z: 0.5,
          scale: 0.75,
          text: 'if (speed < limit) flash()',
        }),
      ];
      break;
    }
    case 13: {
      // 14. Three good drivers flashed in turn.
      const cols: CarColor[] = ['green', 'blue', 'gold'];
      const texts = ['58 MPH FLASHED!', '55 MPH FLASHED!', '59 MPH FLASHED!'];
      const segment = progress < 1 / 3 ? 0 : progress < 2 / 3 ? 1 : 2;
      const q = segment === 0 ? progress * 3 : segment === 1 ? (progress - 1 / 3) * 3 : (progress - 2 / 3) * 3;
      const z = lerp(-2, 1, q);
      cars = [mkCar({id: `good-${segment}`, color: cols[segment], x: 0, z, wheelSpin: t * 6})];
      drivers = [inCar(z, {id: `good-driver-${segment}`, emotion: 'happy'})];
      hud = {text: texts[segment], color: HUD_GREEN};
      flash = q < 0.14 ? clamp(1 - q / 0.14, 0, 1) * 0.85 : 0;
      break;
    }
    case 14: {
      // 15. Confused driver, big yellow question mark.
      cars = [mkCar({id: 'silver', color: 'silver', x: 0, z: 0})];
      drivers = [inCar(0, {id: 'confused', emotion: 'confusion'})];
      props = [mkProp('question', {x: 0, y: 3.0, z: 0.4})];
      hud = {text: '57 MPH UNDER LIMIT', color: HUD_GREEN};
      break;
    }
    case 15: {
      // 16. A week later: real walk gait to the mailbox.
      const x = lerp(-3.6, 0.3, progress);
      drivers = [
        mkDriver({
          id: 'walker',
          x,
          y: 0,
          z: 0,
          pose: 'walk',
          walking: true,
          walkPhase: t * 9,
          shirt: '#E8A33D',
          scale: 0.9,
        }),
      ];
      props = [
        mkProp('fence', {x: 0, y: 0, z: -2}),
        mkProp('mailbox', {x: 1.1, y: 0, z: 0}),
      ];
      cars = [mkCar({id: 'parked', color: 'silver', x: -2.2, z: -4.5})];
      break;
    }
    case 16: {
      // 17. Worried, reaching into the mailbox.
      drivers = [
        mkDriver({
          id: 'worried',
          x: 0.7,
          y: 0,
          z: 0,
          pose: 'reach',
          emotion: 'worry',
          shirt: '#E8A33D',
          scale: 0.95,
        }),
      ];
      props = [mkProp('mailbox', {x: 1.4, y: 0, z: 0})];
      break;
    }
    case 17: {
      // 18. Shock: readable $2,000 check.
      drivers = [
        mkDriver({
          id: 'winner',
          x: 0,
          y: 0,
          z: 0,
          pose: 'hold-check',
          emotion: 'shock',
          shirt: '#E8A33D',
        }),
      ];
      props = [mkProp('check', {x: 0, y: 1.75, z: 0.6, scale: 0.85})];
      break;
    }
    case 18: {
      // 19. Money rain, arms out, orange shirt.
      drivers = [
        mkDriver({
          id: 'winner',
          x: 0,
          y: 0,
          z: 0,
          pose: 'arms-out',
          emotion: 'happy',
          shirt: '#EF8B2C',
        }),
      ];
      props = [mkProp('cash', {x: 0, y: 0, z: 0, mode: 'rain', count: 38})];
      break;
    }
    case 19: {
      // 20. Visual-mode switch: dark navy, camera box is a jackpot machine.
      night = true;
      pole = false;
      props = [mkProp('jackpot', {x: 0, y: 0, z: 0})];
      drivers = [
        mkDriver({
          id: 'host',
          x: 1.7,
          y: 0,
          z: 0.5,
          pose: 'point',
          emotion: 'happy',
          shirt: '#D4A017',
          scale: 0.9,
        }),
      ];
      break;
    }
    case 20: {
      // 21. The mechanism: lottery drum full of cash.
      night = true;
      pole = false;
      props = [mkProp('drum', {x: 0, y: 0, z: 0})];
      break;
    }
    case 21: {
      // 22. Calm slow traffic under green overhead signs.
      const cols: CarColor[] = ['white', 'green', 'silver'];
      cars = cols.map((color, i) =>
        mkCar({
          id: `calm-${i}`,
          color,
          x: -2.2 + i * 2.2,
          z: lerp(-5, 0, progress),
          wheelSpin: t * 3,
        }),
      );
      props = [mkProp('overhead', {x: 0, y: 4.6, z: -3})];
      break;
    }
    case 22: {
      // 23. A white car enters from the right into orderly traffic.
      cars = [
        mkCar({id: 'enter', color: 'white', x: lerp(4.2, 0.9, progress), z: -2, wheelSpin: t * 3}),
        mkCar({id: 'calm', color: 'green', x: -1.8, z: -6, wheelSpin: t * 2}),
      ];
      props = [mkProp('overhead', {x: 0, y: 4.6, z: -3})];
      break;
    }
    case 23: {
      // 24. Same red car, same grumpy mocker, now a green 58 MPH.
      const z = lerp(-2, 1, progress);
      cars = [mkCar({id: 'red', color: 'red', x: 0, z, wheelSpin: t * 5})];
      drivers = [inCar(z, {id: 'mocker', emotion: 'grumpy'})];
      hud = {text: '58 MPH', color: HUD_GREEN};
      break;
    }
    case 24: {
      // 25. The stranger's new TV: family of three on the sofa.
      props = [mkProp('livingRoom', {x: 0, y: 0, z: 0})];
      drivers = [
        mkDriver({id: 'family-1', x: -1.05, y: 0.45, z: 1.75, pose: 'stand', emotion: 'happy', shirt: '#D94F4F', scale: 0.85}),
        mkDriver({id: 'family-2', x: 0, y: 0.45, z: 1.75, pose: 'stand', emotion: 'neutral', shirt: '#2C7BC7', scale: 0.85}),
        mkDriver({id: 'family-3', x: 1.05, y: 0.45, z: 1.75, pose: 'stand', emotion: 'happy', shirt: '#2E9E44', scale: 0.85}),
      ];
      break;
    }
    case 25: {
      // 26. The payoff lands, the face goes solid red, then it stops dead.
      const frozen = f >= 1691;
      const z = 0;
      cars = [
        mkCar({id: 'red', color: 'red', x: 0, z, wheelSpin: frozen ? 390 : t * 5}),
      ];
      drivers = [
        inCar(z, {
          id: 'mocker',
          emotion: 'grumpy',
          faceColor: frozen ? '#E02020' : undefined,
        }),
      ];
      break;
    }
  }

  return {
    shot: shot + 1,
    frame: f,
    progress,
    camera,
    cars,
    drivers,
    props,
    hud,
    flash,
    night,
    pole,
    poleDisplay,
  };
};
