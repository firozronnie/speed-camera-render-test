// Shot state for "The Speed Camera That Paid Good Drivers".
// Animation time = frame / 30. ONE continuous camera path (never jump-cuts);
// story content (cars, drivers, props, HUD) switches on the voice-matched frame ranges.

export const FPS = 30;
export const TOTAL_FRAMES = 1732;

export type V3 = [number, number, number];
export type Emotion =
  | 'neutral'
  | 'shock'
  | 'worry'
  | 'confused'
  | 'happy'
  | 'grumpy'
  | 'thinking'
  | 'skeleton';
export type Pose =
  | 'stand'
  | 'walk'
  | 'wave'
  | 'point'
  | 'reach'
  | 'armsOut'
  | 'ladder'
  | 'holdCheck'
  | 'tablet'
  | 'thinking'
  | 'seated'
  | 'cheer';
export type SkyKind = 'day' | 'dusk' | 'night' | 'dark';
export type Theme = 'outdoor' | 'dark' | 'living';

export const COL = {
  red: '#C8102E',
  blue: '#1565C0',
  silver: '#C8CDD2',
  green: '#2E9E44',
  white: '#F2F2F2',
  gold: '#D4A017',
  hudRed: '#EF2B2B',
  hudGreen: '#22C55E',
  rear: '#EF2B2B',
};

export interface CarDriver {
  emotion: Emotion;
  shirt: string;
  faceTint?: string;
  lookX?: number;
}

export interface CarSt {
  id: string;
  color: string;
  x: number;
  z: number;
  ry: number; // 0 = heading +x, PI = heading -x
  odo: number; // distance driven forward (wheel spin)
  brake: boolean;
  sports?: boolean;
  ghost?: number; // 1 = solid, <1 = X-ray see-through
  driver?: CarDriver;
}

export interface DriverSt {
  id: string;
  x: number;
  y: number;
  z: number;
  scale: number;
  emotion: Emotion;
  pose: Pose;
  phase: number; // seconds, drives gait / wave / cheer
  prog: number; // 0..1 pose progress (reach, raise check)
  shirt: string;
  skin?: string;
  faceTint?: string;
  lookX?: number;
  lookY?: number;
  flip?: boolean;
}

export interface HudSt {
  text: string;
  color: string;
  since: number; // absolute frame the text last changed (for the pop animation)
}

export interface BillsSt {
  mode: 'burst' | 'rain' | 'drum';
  t: number;
  origin: V3;
  count: number;
  seed: number;
}

export interface PropsSt {
  fineSign?: {flip: number};
  ladder?: boolean;
  mailbox?: {open: number};
  fence?: boolean;
  gantry?: number;
  qMark?: {p: V3; s: number};
  poleDisplay?: string;
  poleDisplayColor?: string;
  slowPaint?: boolean;
  bills?: BillsSt[];
  jackpot?: number; // 0..1 camera box -> jackpot machine
  drum?: {t: number};
  living?: boolean;
  flashLens?: number;
}

export interface Look {
  sky: SkyKind;
  fog: string;
  fogNear: number;
  fogFar: number;
  ambient: number;
  hemi: number;
  sun: string;
  sunInt: number;
  sunPos: V3;
  bg: string;
}

export interface FullShotState {
  shot: number;
  theme: Theme;
  camPos: V3;
  camTgt: V3;
  fov: number;
  cars: CarSt[];
  drivers: DriverSt[];
  hud: HudSt | null;
  flash: number;
  props: PropsSt;
  look: Look;
}

// ---------------------------------------------------------------- helpers

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const smooth = (u: number): number => {
  const k = clamp01(u);
  return k * k * (3 - 2 * k);
};

const L1 = -2.2; // lane heading +x
const L2 = 2.2; // lane heading -x

function mkCar(
  id: string,
  color: string,
  x: number,
  z: number,
  dir: number,
  extra: Partial<CarSt> = {},
): CarSt {
  return {id, color, x, z, ry: dir > 0 ? 0 : Math.PI, odo: dir * x + 60, brake: false, ...extra};
}

const drv = (emotion: Emotion, shirt: string, extra: Partial<CarDriver> = {}): CarDriver => ({
  emotion,
  shirt,
  ...extra,
});

function person(
  id: string,
  x: number,
  y: number,
  z: number,
  scale: number,
  emotion: Emotion,
  pose: Pose,
  shirt: string,
  extra: Partial<DriverSt> = {},
): DriverSt {
  return {id, x, y, z, scale, emotion, pose, phase: 0, prog: 1, shirt, ...extra};
}

// ---------------------------------------------------------------- camera path
// ONE continuous path. Keyframes every 20-45 frames, each differing in BOTH angle and distance.
// [frame, camera position, look-at target]

const CAM: Array<[number, V3, V3]> = [
  [0, [18, 17, 12], [0, 3, -2]], // 1 aerial wide
  [45, [12, 10, 9], [0, 3.5, -3]],
  [90, [5, 6.5, 6.5], [0, 4.5, -4]],
  [125, [11, 2.0, -2.4], [0, 1, -2.2]], // 2 head-on
  [149, [6.5, 1.4, -0.5], [0, 1.0, -2.2]],
  [167, [5, 1.7, 3.2], [1.5, 1, -2.2]], // 3 side profile
  [184, [3.5, 1.5, 9], [3.5, 1, -2.2]],
  [205, [-4, 2.1, 4], [6, 1, -2.2]], // 4 rear view
  [228, [-7.5, 3.2, -0.8], [16, 1, -2.2]],
  [260, [-13, 15, 7], [2, 0, 0]], // 5 wide aerial
  [295, [-22, 12, -3], [0, 0, 0]],
  [332, [-9, 5, 11], [0, 1, 0]],
  [360, [-9, 2.3, 2.8], [40, 6, -2.2]], // 6 highway to skyline
  [401, [19, 2.0, -6.5], [13, 1.2, -2.2]],
  [420, [11, 3, 4.5], [6.5, 2.4, -6.3]], // 7 fine sign
  [440, [4.5, 1.8, 1.5], [6.4, 2.0, -6.3]],
  [470, [-1, 17, -2.2], [10, 0, -2.2]], // 8 top-down
  [503, [7, 12, -2.2], [14, 0, -2.2]],
  [527, [5.5, 8, 3], [0, 6, -4.8]], // 9 camera box
  [550, [1.6, 6.5, 0.4], [0, 5.9, -4.8]],
  [580, [-6.5, 2.4, 6.5], [1, 1, 2.2]], // 10 x-ray
  [611, [-3.2, 1.6, 4.8], [-1, 1.1, 2.2]],
  [640, [6, 2.4, 4], [-5, 1, -2.2]], // 11 the mocker
  [668, [3.5, 2.0, 1.5], [0, 1.2, -2.2]],
  [700, [-1.5, 3.2, 5.5], [6, 1, -2.2]],
  [727, [-6, 2.6, 2.0], [18, 1.2, -2.2]],
  [745, [-6, 4.8, 1.5], [1.4, 4.8, -4.1]], // 12 hero on ladder
  [760, [4, 6.2, -0.5], [1.4, 5.0, -4.1]],
  [782, [-1.2, 5.6, -0.8], [1.4, 5.4, -4.1]], // 13 inventor
  [804, [2.4, 5.4, -1.0], [1.5, 5.5, -4.1]],
  [830, [-8.5, 2.2, 6.5], [0, 2, -2.2]], // 14 flashing good drivers
  [860, [6, 4, 7.5], [0, 2.5, -3]],
  [885, [-3, 2.2, 3.5], [2, 2, -2.2]],
  [901, [7, 2.0, -9], [0, 2, -2.2]],
  [930, [8.5, 1.9, -0.5], [0, 1.3, -2.2]], // 15 the question
  [988, [5.5, 3.0, 3.5], [1.5, 1.5, -2.2]],
  [1020, [5.5, 1.6, 12.5], [3.5, 1.3, 6.3]], // 16 walk to mailbox
  [1050, [10.5, 2.4, 3.4], [6.0, 1.2, 6.5]],
  [1079, [12.5, 1.6, 3.5], [8.0, 1.3, 6.8]],
  [1096, [5.0, 1.9, 3.0], [7.8, 1.4, 6.6]], // 17 reach
  [1114, [10.0, 1.7, 2.6], [8.0, 1.4, 6.8]],
  [1150, [6.5, 1.7, 1.6], [7.7, 1.4, 6.4]], // 18 shock + check
  [1186, [10.8, 2.2, 2.2], [7.7, 1.5, 6.4]],
  [1210, [7.5, 0.9, 1.8], [7.7, 2.5, 6.4]], // 19 money rain
  [1250, [4.5, 7.5, 2.0], [0, 6.9, -4.6]], // 20 jackpot machine
  [1302, [-3.5, 9.8, 2.5], [0, 7.2, -4.6]],
  [1335, [3.2, 5.6, 1.8], [0, 6.4, -2.3]], // 21 drum
  [1360, [2.6, 7.4, 0.9], [0, 6.4, -2.3]],
  [1391, [-1.5, 9.5, 2.5], [0, 6.4, -2.3]],
  [1420, [-16, 6.5, 7.5], [1, 3, 0]], // 22 calm traffic
  [1450, [-3.5, 2.2, 8.5], [4, 2.8, -2]],
  [1475, [7, 7.5, -10], [1, 2, 0]],
  [1495, [6, 3.5, 15], [0, 1, 0]], // 23
  [1513, [-3, 4, 14], [1, 1, 0]],
  [1540, [8.5, 2.3, 3.0], [-1, 1.2, -2.2]], // 24 mocker defeated
  [1576, [4.8, 1.6, 0.8], [1.6, 1.2, -2.2]],
  [1605, [-1, 2.5, 7.5], [0.2, 1.4, 0]], // 25 living room
  [1641, [5, 2.4, 5.0], [-0.5, 1.4, 0]],
  [1670, [9, 2.8, 5], [3.5, 1.3, -2.2]], // 26 payoff on the mocker
  [1700, [6.5, 1.6, 0.8], [4.0, 1.2, -2.2]],
  [1731, [7, 1.35, -0.2], [4.6, 1.1, -2.2]],
];

function getCamera(frame: number): {pos: V3; tgt: V3} {
  let i = 0;
  while (i < CAM.length - 2 && frame >= CAM[i + 1][0]) i++;
  const a = CAM[i];
  const b = CAM[i + 1];
  const u = clamp01((frame - a[0]) / (b[0] - a[0]));
  // smooth ease, blended with a little linear so the camera never fully stops
  const e = 0.3 * u + 0.7 * smooth(u);
  return {
    pos: [lerp(a[1][0], b[1][0], e), lerp(a[1][1], b[1][1], e), lerp(a[1][2], b[1][2], e)],
    tgt: [lerp(a[2][0], b[2][0], e), lerp(a[2][1], b[2][1], e), lerp(a[2][2], b[2][2], e)],
  };
}

// ---------------------------------------------------------------- look (lighting arc)

interface LookNum {
  ambient: number;
  hemi: number;
  sunInt: number;
  sun: string;
  sunPos: V3;
  fog: string;
  fogNear: number;
  fogFar: number;
  bg: string;
}

const LOOK_DAY: LookNum = {
  ambient: 0.55,
  hemi: 0.7,
  sunInt: 2.7,
  sun: '#FFF0D2',
  sunPos: [-30, 34, -20],
  fog: '#CFE6FA',
  fogNear: 90,
  fogFar: 340,
  bg: '#8EC9F5',
};
const LOOK_WARM: LookNum = {
  ambient: 0.5,
  hemi: 0.65,
  sunInt: 2.8,
  sun: '#FFC98A',
  sunPos: [-34, 17, -24],
  fog: '#F3D9B0',
  fogNear: 80,
  fogFar: 320,
  bg: '#F0B982',
};
const LOOK_DUSK: LookNum = {
  ambient: 0.42,
  hemi: 0.55,
  sunInt: 2.3,
  sun: '#FF8A4C',
  sunPos: [-40, 8, -26],
  fog: '#E9946F',
  fogNear: 70,
  fogFar: 300,
  bg: '#C9667A',
};
const LOOK_DARK: LookNum = {
  ambient: 0.4,
  hemi: 0.5,
  sunInt: 0.5,
  sun: '#8FA8FF',
  sunPos: [0, 30, 10],
  fog: '#0A1030',
  fogNear: 40,
  fogFar: 140,
  bg: '#070C2A',
};
const LOOK_MORNING: LookNum = {
  ambient: 0.6,
  hemi: 0.75,
  sunInt: 3.0,
  sun: '#FFF6DF',
  sunPos: [-28, 30, -18],
  fog: '#D9EEFF',
  fogNear: 90,
  fogFar: 340,
  bg: '#9ED3F7',
};
const LOOK_LIVING: LookNum = {
  ambient: 0.95,
  hemi: 0.9,
  sunInt: 0.5,
  sun: '#FFE0B0',
  sunPos: [0, 20, 10],
  fog: '#2A1D33',
  fogNear: 40,
  fogFar: 120,
  bg: '#2A1D33',
};

const LOOK_KEYS: Array<[number, LookNum]> = [
  [0, LOOK_DAY],
  [560, LOOK_DAY],
  [805, LOOK_WARM],
  [1100, LOOK_DUSK],
  [1234, LOOK_DUSK],
  [1235, LOOK_DARK],
  [1391, LOOK_DARK],
  [1392, LOOK_MORNING],
  [1576, LOOK_MORNING],
  [1577, LOOK_LIVING],
  [1641, LOOK_LIVING],
  [1642, LOOK_MORNING],
  [1731, LOOK_MORNING],
];

function hexToRgb(h: string): V3 {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mixHex(a: string, b: string, u: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  const c = [0, 1, 2].map((i) => Math.round(lerp(x[i], y[i], u)));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

function skyFor(f: number): SkyKind {
  if (f >= 1577 && f <= 1641) return 'dark';
  if (f >= 1392) return 'day';
  if (f >= 1235) return 'dark';
  if (f >= 902) return 'dusk';
  return 'day';
}

export function getLook(frame: number): Look {
  let i = 0;
  while (i < LOOK_KEYS.length - 2 && frame >= LOOK_KEYS[i + 1][0]) i++;
  const [fa, a] = LOOK_KEYS[i];
  const [fb, b] = LOOK_KEYS[i + 1];
  const u = fb === fa ? 0 : clamp01((frame - fa) / (fb - fa));
  return {
    sky: skyFor(frame),
    fog: mixHex(a.fog, b.fog, u),
    fogNear: lerp(a.fogNear, b.fogNear, u),
    fogFar: lerp(a.fogFar, b.fogFar, u),
    ambient: lerp(a.ambient, b.ambient, u),
    hemi: lerp(a.hemi, b.hemi, u),
    sun: mixHex(a.sun, b.sun, u),
    sunInt: lerp(a.sunInt, b.sunInt, u),
    sunPos: [
      lerp(a.sunPos[0], b.sunPos[0], u),
      lerp(a.sunPos[1], b.sunPos[1], u),
      lerp(a.sunPos[2], b.sunPos[2], u),
    ],
    bg: mixHex(a.bg, b.bg, u),
  };
}

// ---------------------------------------------------------------- shots (26)

interface Scene {
  cars?: CarSt[];
  drivers?: DriverSt[];
  hud?: HudSt | null;
  flash?: number;
  props?: PropsSt;
}
interface Shot {
  from: number;
  to: number;
  build: (f: number, t: number) => Scene;
}

const SHOTS: Shot[] = [
  // 1 HOOK: camera pole, aerial push-in, blue + silver car pass in opposite directions
  {
    from: 0,
    to: 102,
    build: (_f, t) => ({
      cars: [
        mkCar('blue', COL.blue, -14 + 8 * t, L1, 1, {driver: drv('neutral', '#F59E0B')}),
        mkCar('silver', COL.silver, 14 - 8 * t, L2, -1, {driver: drv('neutral', '#EF4444')}),
      ],
    }),
  },
  // 2 red car head-on, 62 MPH red
  {
    from: 103,
    to: 149,
    build: (_f, t) => ({
      cars: [mkCar('red', COL.red, -8 + 6 * t, L1, 1, {driver: drv('neutral', '#2563EB')})],
      hud: {text: '62 MPH', color: COL.hudRed, since: 103},
    }),
  },
  // 3 side profile, braking, 18 MPH green, shock then neutral
  {
    from: 150,
    to: 184,
    build: (_f, t) => ({
      cars: [
        mkCar('red', COL.red, 1 + 4.5 * t - 2.0 * t * t, L1, 1, {
          brake: true,
          driver: drv(t < 0.4 ? 'shock' : 'neutral', '#2563EB'),
        }),
      ],
      hud: {text: '18 MPH', color: COL.hudGreen, since: 150},
    }),
  },
  // 4 rear view, speeding away, 62 MPH red
  {
    from: 185,
    to: 228,
    build: (_f, t) => ({
      cars: [
        mkCar('red', COL.red, 3.5 + 6 * t + 5 * t * t, L1, 1, {driver: drv('neutral', '#2563EB')}),
      ],
      hud: {text: '62 MPH', color: COL.hudRed, since: 185},
    }),
  },
  // 5 six cars braking at the pole
  {
    from: 229,
    to: 332,
    build: (_f, t) => {
      const k = 2.4 * t - 0.45 * t * t;
      const w = (e: Parameters<typeof drv>[0], s: string) => ({brake: true, driver: drv(e, s)});
      return {
        cars: [
          mkCar('red', COL.red, -11 + k, L1, 1, w('worry', '#2563EB')),
          mkCar('blue', COL.blue, -5.5 + k, L1, 1, w('worry', '#F59E0B')),
          mkCar('silver', COL.silver, 0 + k, L1, 1, w('worry', '#EC4899')),
          mkCar('green', COL.green, 11 - k, L2, -1, w('worry', '#8B5CF6')),
          mkCar('white', COL.white, 5.5 - k, L2, -1, w('worry', '#EF4444')),
          mkCar('white2', COL.white, 0 - k, L2, -1, w('worry', '#14B8A6')),
        ],
      };
    },
  },
  // 6 highway to the skyline, red car, 101 MPH red, grumpy
  {
    from: 333,
    to: 401,
    build: (_f, t) => ({
      cars: [mkCar('red', COL.red, -4 + 8 * t, L1, 1, {driver: drv('grumpy', '#2563EB')})],
      hud: {text: '101 MPH', color: COL.hudRed, since: 333},
    }),
  },
  // 7 fine sign $150 flips to $300, man pointing, thinking
  {
    from: 402,
    to: 440,
    build: (_f, t) => ({
      drivers: [
        person('sign-man', 5.3, 0, -6.0, 0.62, 'thinking', 'point', '#3B82F6', {phase: t}),
      ],
      props: {fineSign: {flip: smooth((t - 0.4) / 0.35)}},
    }),
  },
  // 8 top-down, giant SLOW! on the road
  {
    from: 441,
    to: 503,
    build: (_f, t) => ({
      cars: [mkCar('silver', COL.silver, 26 - 9 * t, L2, -1, {driver: drv('neutral', '#EF4444')})],
    }),
  },
  // 9 camera box close-up, pole display "27 UNDER LIMIT"
  {
    from: 504,
    to: 550,
    build: () => ({
      props: {poleDisplay: '27 UNDER LIMIT', poleDisplayColor: '#FFB020'},
    }),
  },
  // 10 X-RAY GAG (only skeleton in the video), bright flash at the start
  {
    from: 551,
    to: 611,
    build: (_f, t) => {
      const flash = Math.max(0, 1 - t / 0.35);
      return {
        cars: [
          mkCar('silver', COL.silver, 4 - 2.2 * t, L2, -1, {
            ghost: 0.38,
            driver: drv('skeleton', '#EF4444'),
          }),
        ],
        flash,
        props: {flashLens: flash},
      };
    },
  },
  // 11 the mocker: rich guy, red sports car, banknotes burst, 112 MPH; then rear view speeding away
  {
    from: 612,
    to: 727,
    build: (_f, t) => {
      const x = t < 1.9 ? -10 + 5.5 * t : 0.45 + 6 * (t - 1.9) + 4 * (t - 1.9) * (t - 1.9);
      const bt = t - 0.9;
      return {
        cars: [mkCar('red-sports', COL.red, x, L1, 1, {sports: true, driver: drv('happy', '#111827')})],
        hud: {text: '112 MPH', color: COL.hudRed, since: 612},
        props:
          bt > 0
            ? {bills: [{mode: 'burst', t: bt, origin: [-5.05, 1.3, L1], count: 70, seed: 21}]}
            : {},
      };
    },
  },
  // 12 pivot hero: man in GREEN jacket on a ladder at the camera pole
  {
    from: 728,
    to: 760,
    build: (_f, t) => {
      const p = 0.55 + 0.08 * t;
      return {
        drivers: [
          person('hero', 1.4, 6.4 * p, -1.8 - 3.4 * p + 0.25, 0.62, 'neutral', 'ladder', '#2FA84F', {
            phase: t,
          }),
        ],
        props: {ladder: true},
      };
    },
  },
  // 13 inventor close-up with tablet showing the rule as code
  {
    from: 761,
    to: 804,
    build: (_f, t) => {
      const p = 0.7;
      return {
        drivers: [
          person('hero', 1.4, 6.4 * p, -1.8 - 3.4 * p + 0.25, 0.62, 'happy', 'tablet', '#2FA84F', {
            phase: t,
          }),
        ],
        props: {ladder: true},
      };
    },
  },
  // 14 the camera flashes GOOD drivers: green, blue, gold in turn
  {
    from: 805,
    to: 901,
    build: (_f, t) => {
      const tf = [0.45, 1.5, 2.55];
      const cols = [COL.green, COL.blue, COL.gold];
      const shirts = ['#F59E0B', '#EC4899', '#10B981'];
      const texts = ['58 MPH FLASHED!', '55 MPH FLASHED!', '59 MPH FLASHED!'];
      const cars = cols.map((c, i) =>
        mkCar('good' + i, c, 9 * (t - tf[i]), L1, 1, {driver: drv('happy', shirts[i])}),
      );
      let k = -1;
      for (let i = 0; i < 3; i++) if (t >= tf[i]) k = i;
      const flash = Math.max(0, ...tf.map((v) => (t >= v ? 1 - (t - v) / 0.3 : 0)));
      const hud: HudSt =
        k < 0
          ? {text: '58 MPH', color: COL.hudGreen, since: 805}
          : {text: texts[k], color: COL.hudGreen, since: 805 + Math.round(tf[k] * FPS)};
      return {cars, hud, flash, props: {flashLens: flash}};
    },
  },
  // 15 the question: confused driver, big yellow ?
  {
    from: 902,
    to: 988,
    build: (_f, t) => {
      const x = -3 + 1.7 * t;
      return {
        cars: [mkCar('silver', COL.silver, x, L1, 1, {driver: drv('confused', '#F97316')})],
        hud: {text: '57 MPH UNDER LIMIT', color: COL.hudGreen, since: 902},
        props: {
          qMark: {p: [x, 3.4 + 0.12 * Math.sin(t * 5), L1], s: smooth((t - 0.3) / 0.3)},
        },
      };
    },
  },
  // 16 a week later: driver WALKS to his mailbox
  {
    from: 989,
    to: 1079,
    build: (_f, t) => ({
      cars: [mkCar('parked', COL.silver, 1.2, 6.9, 1)],
      drivers: [
        person('walker', lerp(2.9, 7.4, clamp01(t / 3)), 0, 6.2, 0.62, 'neutral', 'walk', '#F97316', {
          phase: t,
        }),
      ],
      props: {mailbox: {open: 0}, fence: true},
    }),
  },
  // 17 at the mailbox: worried, arm REACHING to open it
  {
    from: 1080,
    to: 1114,
    build: (_f, t) => ({
      cars: [mkCar('parked', COL.silver, 1.2, 6.9, 1)],
      drivers: [
        person('walker', 7.5, 0, 6.2, 0.62, 'worry', 'reach', '#F97316', {
          phase: t,
          prog: smooth(t / 0.6),
        }),
      ],
      props: {mailbox: {open: smooth((t - 0.6) / 0.45)}, fence: true},
    }),
  },
  // 18 payoff reveal: SHOCK, readable $2,000 check
  {
    from: 1115,
    to: 1186,
    build: (_f, t) => ({
      cars: [mkCar('parked', COL.silver, 1.2, 6.9, 1)],
      drivers: [
        person('walker', 7.5, 0, 6.2, 0.62, 'shock', 'holdCheck', '#F97316', {
          phase: t,
          prog: smooth(t / 0.5),
        }),
      ],
      props: {mailbox: {open: 1}, fence: true},
    }),
  },
  // 19 money RAINING, arms OUT, orange shirt, happy
  {
    from: 1187,
    to: 1234,
    build: (_f, t) => ({
      cars: [mkCar('parked', COL.silver, 1.2, 6.9, 1)],
      drivers: [
        person('walker', 7.5, 0, 6.2, 0.62, 'happy', 'armsOut', '#F97316', {phase: t, prog: 1}),
      ],
      props: {
        mailbox: {open: 1},
        fence: true,
        bills: [{mode: 'rain', t, origin: [7.7, 0, 6.4], count: 90, seed: 33}],
      },
    }),
  },
  // 20 "You see": world turns DARK NAVY, camera box becomes a JACKPOT machine
  {
    from: 1235,
    to: 1302,
    build: (_f, t) => ({
      props: {jackpot: smooth((t - 0.2) / 1.1), flashLens: 0.5 + 0.5 * Math.sin(t * 9)},
    }),
  },
  // 21 the mechanism SHOWN: lottery drum full of cash, dark navy
  {
    from: 1303,
    to: 1391,
    build: (_f, t) => ({
      props: {jackpot: 1, drum: {t}},
    }),
  },
  // 22 result: calm slow traffic, green overhead signs
  {
    from: 1392,
    to: 1475,
    build: (_f, t) => ({
      cars: [
        mkCar('white', COL.white, -5 + 2.2 * t, L1, 1, {driver: drv('happy', '#2563EB')}),
        mkCar('green', COL.green, -12 + 2.2 * t, L1, 1, {driver: drv('neutral', '#F59E0B')}),
        mkCar('silver', COL.silver, 9 - 2.2 * t, L2, -1, {driver: drv('happy', '#EC4899')}),
      ],
      props: {gantry: 6},
    }),
  },
  // 23 slow orderly traffic, a white car enters from the right
  {
    from: 1476,
    to: 1513,
    build: (_f, t) => ({
      cars: [
        mkCar('green', COL.green, -3 + 2.2 * t, L1, 1, {driver: drv('neutral', '#F59E0B')}),
        mkCar('silver', COL.silver, -9 + 2.2 * t, L1, 1, {driver: drv('happy', '#EC4899')}),
        mkCar('white', COL.white, 7.5 - 4.7 * t, L2, -1, {driver: drv('happy', '#2563EB')}),
      ],
      props: {gantry: 6},
    }),
  },
  // 24 the mocker defeated: same red car, same driver, 58 MPH green, grumpy
  {
    from: 1514,
    to: 1576,
    build: (_f, t) => ({
      cars: [mkCar('red', COL.red, -3 + 1.6 * t, L1, 1, {driver: drv('grumpy', '#111827')})],
      hud: {text: '58 MPH', color: COL.hudGreen, since: 1514},
    }),
  },
  // 25 the stranger's new TV: family of three on a sofa watching football
  {
    from: 1577,
    to: 1641,
    build: (_f, t) => ({
      drivers: [
        person('dad', -1.7, 0.45, 1.3, 0.55, 'happy', 'cheer', '#2563EB', {phase: t, lookY: 0.5}),
        person('mom', 0.1, 0.5, 1.3, 0.5, 'happy', 'cheer', '#EC4899', {phase: t + 0.4, lookY: 0.5}),
        person('kid', 1.7, 0.75, 1.3, 0.38, 'happy', 'cheer', '#F59E0B', {phase: t + 0.8, lookY: 0.5}),
      ],
      props: {living: true},
    }),
  },
  // 26 payoff lands on the mocker: face turns SOLID RED from frame 1691, then STOPS DEAD
  {
    from: 1642,
    to: 1731,
    build: (f, t) => ({
      cars: [
        mkCar('red', COL.red, 2 + 0.9 * t, L1, 1, {
          driver: drv('grumpy', '#111827', {faceTint: f >= 1691 ? '#E11D1D' : undefined}),
        }),
      ],
      hud: {text: '58 MPH', color: COL.hudGreen, since: 1514},
    }),
  },
];

export function getFullShotState(frame: number): FullShotState {
  const f = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frame)));
  let idx = SHOTS.findIndex((s) => f >= s.from && f <= s.to);
  if (idx < 0) idx = f < SHOTS[0].from ? 0 : SHOTS.length - 1;
  const shot = SHOTS[idx];
  const t = (f - shot.from) / FPS;
  const sc = shot.build(f, t);
  const theme: Theme = f >= 1235 && f <= 1391 ? 'dark' : f >= 1577 && f <= 1641 ? 'living' : 'outdoor';
  const cam = getCamera(f);
  const props: PropsSt = {...(sc.props ?? {})};
  props.slowPaint = f >= 441 && theme === 'outdoor';
  return {
    shot: idx + 1,
    theme,
    camPos: cam.pos,
    camTgt: cam.tgt,
    fov: 55,
    cars: sc.cars ?? [],
    drivers: sc.drivers ?? [],
    hud: sc.hud ?? null,
    flash: sc.flash ?? 0,
    props,
    look: getLook(f),
  };
}

// ---------------------------------------------------------------- captions
// One word at a time, bottom centre. Segment boundaries are the measured voice timings;
// inside a segment the words are spread by length (only segment starts/ends were measured).

const SEGMENTS: Array<[number, number, string]> = [
  [0.0, 6.38, 'He saw the speed camera ahead and slammed his brakes sixty-two miles an hour then eighteen then'],
  [6.38, 7.2, 'sixty-two again'],
  [7.62, 10.58, 'He did it every day so did everyone on this road'],
  [11.08, 13.0, 'The city tried everything to slow them down'],
  [13.38, 14.28, 'They doubled the fines'],
  [14.68, 16.46, 'They painted giant warnings on the road'],
  [16.8, 21.3, 'They built a flash so bright it nearly took an X-ray of your face but the rich guys in'],
  [21.3, 23.7, 'sports cars just paid the tickets and kept flying'],
  [24.24, 26.82, 'So one man changed a single rule in that camera'],
  [26.82, 29.58, 'From now on it also flashed the good drivers'],
  [30.06, 32.58, 'Why would a camera photograph the people who obey the law'],
  [32.96, 37.78, 'A week later one careful driver opened his mailbox expecting a fine and found a check'],
  [37.78, 40.6, "for two thousand dollars paid from the speeders' pockets"],
  [41.16, 42.96, 'You see the camera had become a lottery'],
  [43.42, 46.04, 'Every good driver went into a jackpot of fine money'],
  [46.38, 50.66, 'By the next morning drivers went five miles under the limit just to get flashed and'],
  [50.66, 52.54, 'the rich guys finally slowed down'],
  [52.54, 57.06, 'Because paying the government is one thing but buying a stranger a new television is far'],
  [57.06, 57.36, 'worse'],
];

export interface CaptionWord {
  w: string;
  s: number;
  e: number;
}

export const CAPTION_WORDS: CaptionWord[] = (() => {
  const out: CaptionWord[] = [];
  for (const [s, e, text] of SEGMENTS) {
    const words = text.split(' ');
    const weights = words.map((w) => w.length + 2);
    const total = weights.reduce((a, b) => a + b, 0);
    let cur = s;
    words.forEach((w, i) => {
      const end = i === words.length - 1 ? e : cur + ((e - s) * weights[i]) / total;
      out.push({w: w.charAt(0).toUpperCase() + w.slice(1), s: cur, e: end});
      cur = end;
    });
  }
  return out;
})();

export function getCaption(frame: number): string | null {
  const t = frame / FPS;
  for (const c of CAPTION_WORDS) {
    if (t >= c.s && t < c.e) return c.w;
  }
  return null;
}
