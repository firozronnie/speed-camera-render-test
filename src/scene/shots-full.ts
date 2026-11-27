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

/** Inclusive frame ranges, locked to the measured voice beats. */
export const SHOT_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0, 102],
  [103, 149],
  [150, 184],
  [185, 228],
  [229, 332],
  [333, 401],
  [402, 440],
  [441, 503],
  [504, 550],
  [551, 611],
  [612, 727],
  [728, 760],
  [761, 804],
  [805, 901],
  [902, 988],
  [989, 1079],
  [1080, 1114],
  [1115, 1186],
  [1187, 1234],
  [1235, 1302],
  [1303, 1391],
  [1392, 1475],
  [1476, 1513],
  [1514, 1576],
  [1577, 1641],
  [1642, 1731],
];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const mkCam = (
  position: readonly [number, number, number],
  lookAt: readonly [number, number, number],
  fov: number,
  progress: number,
  push = 0.045,
): CameraState => {
  const k = clamp(progress * push, 0, push);
  return {
    position: [
      lerp(position[0], lookAt[0], k),
      lerp(position[1], lookAt[1], k),
      lerp(position[2], lookAt[2], k),
    ],
    lookAt: [lookAt[0], lookAt[1], lookAt[2]],
    fov,
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
  let shot = SHOT_RANGES.findIndex(([a, b]) => f >= a && f <= b);
  if (shot < 0) shot = SHOT_RANGES.length - 1;
  const [start, end] = SHOT_RANGES[shot];
  const progress = clamp((f - start) / Math.max(1, end - start), 0, 1);
  const t = f / FPS;

  let camera = mkCam([0, 3, 10], [0, 1.2, 0], 32, progress);
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
      camera = mkCam([6.4, 11.5, 15], [0, 0.4, -2], 40, progress);
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
      camera = mkCam([0, 2.8, 10], [0, 1.1, -1], 32, progress);
      cars = [mkCar({id: 'red', color: 'red', x: 0, z, wheelSpin: t * 8})];
      drivers = [inCar(z, {id: 'red-driver', emotion: progress < 0.3 ? 'shock' : 'neutral'})];
      hud = {text: '62 MPH', color: HUD_RED};
      break;
    }
    case 2: {
      // 3. Side profile braking, 62 -> 18, shock then neutral.
      const z = lerp(-1.6, 1.6, progress);
      camera = mkCam([8.5, 2.6, 0], [0, 1.0, 0], 30, progress);
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
      camera = mkCam([0, 2.8, -10], [0, 1.2, 2], 32, progress);
      cars = [
        mkCar({id: 'red', color: 'red', x: 0, z, rotationY: Math.PI, wheelSpin: t * 9}),
      ];
      drivers = [inCar(z, {id: 'red-driver', emotion: 'grumpy'})];
      hud = {text: '62 MPH', color: HUD_RED};
      break;
    }
    case 4: {
      // 5. Six cars all braking at the pole.
      camera = mkCam([0, 15, 17], [0, 0, -1], 42, progress);
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
      camera = mkCam([0, 3.4, 11], [0, 1.4, -18], 34, progress);
      cars = [mkCar({id: 'red', color: 'red', x: 0, z, wheelSpin: t * 9})];
      drivers = [inCar(z, {id: 'red-driver', emotion: 'grumpy'})];
      hud = {text: '101 MPH', color: HUD_RED};
      break;
    }
    case 6: {
      // 7. Fine sign flips $150 -> $300, man points and thinks.
      camera = mkCam([0, 2.8, 12], [-0.3, 1.7, 0], 38, progress);
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
      camera = mkCam([0, 14, 10], [0, 0, -3], 40, progress);
      props = [mkProp('roadText', {x: 0, y: 0.02, z: -2, text: 'SLOW!', scale: 1.1})];
      cars = [mkCar({id: 'passer', color: 'silver', x: 2.2, z: -6, wheelSpin: t * 3})];
      break;
    }
    case 8: {
      // 9. Camera box close-up: 27 UNDER LIMIT.
      camera = mkCam([5.8, 2.8, 5.5], [3.6, 2.6, 0], 28, progress);
      poleDisplay = '27 UNDER LIMIT';
      break;
    }
    case 9: {
      // 10. The one and only X-ray skeleton gag, with bright opening flash.
      camera = mkCam([0, 2.5, 6.5], [0, 1.3, 0], 30, progress);
      cars = [mkCar({id: 'red', color: 'red', x: 0, z: 0})];
      drivers = [inCar(0, {id: 'xray', emotion: 'skeleton'})];
      flash = progress < 0.18 ? clamp(1 - progress / 0.18, 0, 1) : 0;
      break;
    }
    case 10: {
      // 11. Rich mocker: cash burst, then rear view, 112 MPH.
      if (progress < 0.55) {
        const z = lerp(-3, -0.5, progress / 0.55);
        camera = mkCam([0, 3.2, 12], [0, 1.2, 0], 38, progress);
        cars = [
          mkCar({id: 'sports', color: 'red', x: 0, z, sports: true, wheelSpin: t * 9}),
        ];
        drivers = [inCar(z, {id: 'mocker', emotion: 'grumpy'})];
        props = [mkProp('cash', {x: 0, y: 0, z: 0, mode: 'burst', count: 26})];
        hud = {text: '112 MPH', color: HUD_RED};
      } else {
        const q = (progress - 0.55) / 0.45;
        const z = lerp(-2, 3.5, q);
        camera = mkCam([0, 2.9, -10], [0, 1.2, 1], 34, progress);
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
      camera = mkCam([3.6, 3.0, 9], [3.6, 2.5, 0], 32, progress);
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
      camera = mkCam([0, 2.4, 9], [0, 1.5, 0], 34, progress);
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
      camera = mkCam([0, 2.8, 10], [0, 1.2, 0], 32, progress);
      cars = [mkCar({id: `good-${segment}`, color: cols[segment], x: 0, z, wheelSpin: t * 6})];
      drivers = [inCar(z, {id: `good-driver-${segment}`, emotion: 'happy'})];
      hud = {text: texts[segment], color: HUD_GREEN};
      flash = q < 0.14 ? clamp(1 - q / 0.14, 0, 1) * 0.85 : 0;
      break;
    }
    case 14: {
      // 15. Confused driver, big yellow question mark.
      camera = mkCam([0, 2.9, 10], [0, 1.5, 0], 32, progress);
      cars = [mkCar({id: 'silver', color: 'silver', x: 0, z: 0})];
      drivers = [inCar(0, {id: 'confused', emotion: 'confusion'})];
      props = [mkProp('question', {x: 0, y: 3.0, z: 0.4})];
      hud = {text: '57 MPH UNDER LIMIT', color: HUD_GREEN};
      break;
    }
    case 15: {
      // 16. A week later: real walk gait to the mailbox.
      camera = mkCam([8, 3.2, 10], [-1.2, 1.4, 0], 40, progress);
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
      camera = mkCam([2.2, 2.6, 5.5], [1.0, 1.3, 0], 30, progress);
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
      camera = mkCam([0, 2.4, 6.5], [0, 1.5, 0], 30, progress);
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
      camera = mkCam([0, 3.0, 10], [0, 1.8, 0], 34, progress);
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
      camera = mkCam([0, 3.0, 10], [0.6, 2.2, 0], 32, progress);
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
      camera = mkCam([0, 3.0, 8], [0, 1.9, 0], 32, progress);
      props = [mkProp('drum', {x: 0, y: 0, z: 0})];
      break;
    }
    case 21: {
      // 22. Calm slow traffic under green overhead signs.
      camera = mkCam([0, 4.0, 17], [0, 1.6, -6], 40, progress);
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
      camera = mkCam([8, 3.6, 16], [1.4, 1.6, -3], 40, progress);
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
      camera = mkCam([0, 2.7, 10], [0, 1.2, 0], 32, progress);
      cars = [mkCar({id: 'red', color: 'red', x: 0, z, wheelSpin: t * 5})];
      drivers = [inCar(z, {id: 'mocker', emotion: 'grumpy'})];
      hud = {text: '58 MPH', color: HUD_GREEN};
      break;
    }
    case 24: {
      // 25. The stranger's new TV: family of three on the sofa.
      camera = mkCam([0, 2.6, 11], [0, 1.4, 0], 38, progress);
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
      camera = mkCam([0, 2.5, 7], [0, 1.4, 0], 30, frozen ? 0 : progress);
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
