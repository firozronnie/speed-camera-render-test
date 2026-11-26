import type {DriverEmotion, DriverPose} from './driver';

/**
 * FULL VIDEO shot plan — 26 shots, 0–1731 frames (57.712 s @ 30 fps),
 * measured from the real 1.2x voice file (see speed-camera-ai-studio-prompt.md).
 *
 * Camera grammar (segment-realwhy-shorts skill §9, TheRealWhy):
 * HARD CUTS every 1–3 s on the voice beats; each shot MOSTLY STATIC with a
 * SLOW PUSH-IN; movement lives INSIDE the frame (cars driving, numbers
 * changing, props changing), never a gliding camera. Framing: everything
 * fully in frame, central 85%, never touching or crossing edges.
 * Reference rules per shot are noted inline (skill § / prompt shot).
 */

export type Vec3 = [number, number, number];

export interface FullCarState {
	x: number;
	z: number;
	rotY: number;
	brake: boolean;
	wheelSpin: number;
	color: string;
}

export interface FullDriverState {
	x: number;
	y: number;
	z: number;
	yaw: number;
	emotion: DriverEmotion;
	scale: number;
	steering: boolean;
	pointing: boolean;
	seated: boolean;
	shirt: string;
	walk?: boolean;
	pose?: DriverPose;
	skeleton?: boolean;
	redFace?: boolean;
	noShadow?: boolean;
}

export interface FullShotProps {
	ladder?: boolean;
	mailbox?: boolean;
	check?: {x: number; y: number; z: number; rotY: number};
	tablet?: {x: number; y: number; z: number; rotY: number};
	banknotes?: 'burst' | 'rain';
	bankOrigin?: [number, number, number];
	jackpot?: boolean;
	drum?: boolean;
	question?: {x: number; y: number; z: number};
	overhead?: boolean;
	fence?: boolean;
}

export interface FullShotState {
	shot: number;
	camPos: Vec3;
	camLook: Vec3;
	cars: FullCarState[];
	driver: FullDriverState | null;
	extraDrivers: FullDriverState[];
	hud: {text: string; color: string} | null;
	flash: boolean;
	signFlip: boolean;
	showSlow: boolean;
	navy: boolean;
	room: boolean;
	poleDisplay: string;
	props: FullShotProps;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

export const RED = '#C8102E';
export const BLUE = '#1565C0';
export const SILVER = '#C8CDD2';
export const GREEN = '#2E9E44';
export const WHITE_CAR = '#F2F2F2';
export const GOLD_CAR = '#D4A017';
export const HUD_RED = '#EF2B2B';
export const HUD_GREEN = '#22C55E';

/** Driver seat world position for a car at (x, z) with rotation rotY. */
function seatForCar(x: number, z: number, rotY: number): {x: number; z: number} {
	const lx = -0.45;
	const lz = 0.35;
	const cos = Math.cos(rotY);
	const sin = Math.sin(rotY);
	return {x: x + lx * cos + lz * sin, z: z - lx * sin + lz * cos};
}

function yawToCamera(fromX: number, fromZ: number, camPos: Vec3): number {
	return Math.atan2(camPos[0] - fromX, camPos[2] - fromZ);
}

const EMPTY: Omit<FullShotState, 'shot' | 'camPos' | 'camLook'> = {
	cars: [],
	driver: null,
	extraDrivers: [],
	hud: null,
	flash: false,
	signFlip: false,
	showSlow: false,
	navy: false,
	room: false,
	poleDisplay: '27 MPH',
	props: {},
};

function base(shot: number, camPos: Vec3, camLook: Vec3): FullShotState {
	return {...EMPTY, shot, camPos, camLook, cars: [], extraDrivers: [], props: {}};
}

export function getFullShotState(frame: number): FullShotState {
	// ---- Shot 1: 0-102 — hook IMAGE in 0-3 s: the camera pole (skill §2) ----
	if (frame <= 102) {
		const t = ease(clamp01(frame / 102));
		const camPos: Vec3 = [lerp(2.5, 1.2, t), lerp(2.4, 2.1, t), lerp(7, 2.5, t)];
		const camLook: Vec3 = [lerp(-3.5, -4.2, t), lerp(4, 4.2, t), -8];
		const blueZ = -30 + (frame / 102) * 55;
		const silverZ = 12 - (frame / 102) * 55;
		const st = base(1, camPos, camLook);
		st.cars = [
			{x: 2.5, z: blueZ, rotY: 0, brake: false, wheelSpin: (blueZ + 30) / 0.36, color: BLUE},
			{x: -2.5, z: silverZ, rotY: Math.PI, brake: false, wheelSpin: (12 - silverZ) / 0.36, color: SILVER},
		];
		return st;
	}

	// ---- Shot 2: 103-149 — red car head-on, HUD 62 MPH (numbers = scoreboards, §10) ----
	if (frame <= 149) {
		const t = clamp01((frame - 103) / 46);
		const carZ = lerp(-34, -9, t);
		const camPos: Vec3 = [2.5, 1.9, lerp(3, 6, t)];
		const camLook: Vec3 = [2.5, 1.0, carZ + 2];
		const seat = seatForCar(2.5, carZ, 0);
		const st = base(2, camPos, camLook);
		st.cars = [{x: 2.5, z: carZ, rotY: 0, brake: false, wheelSpin: (carZ + 34) / 0.36, color: RED}];
		st.driver = {
			x: seat.x, y: 0.55, z: seat.z, yaw: yawToCamera(seat.x, seat.z, camPos),
			emotion: 'neutral', scale: 0.62, steering: true, pointing: false, seated: true, shirt: '#1976D2',
		};
		st.hud = {text: '62 MPH', color: HUD_RED};
		return st;
	}

	// ---- Shot 3: 150-184 — side profile, HUD 18 MPH (the 62→18 flip IS the gag) ----
	// FIXED framing (test t=5 clipped the fine sign): camera pulled to the
	// LEFT side of the road so the sign sits small and fully in frame behind
	// the car, driver side facing camera, shock face readable.
	if (frame <= 184) {
		const t = clamp01((frame - 150) / 34);
		const carZ = -8 + easeOut(t) * 22;
		const camPos: Vec3 = [lerp(-10.5, -9.5, t), 2.0, lerp(4, 3, t)];
		const camLook: Vec3 = [2.5, 1.1, carZ];
		const seat = seatForCar(2.5, carZ, 0);
		const st = base(3, camPos, camLook);
		st.cars = [{x: 2.5, z: carZ, rotY: 0, brake: t < 0.6, wheelSpin: (carZ + 8) / 0.36, color: RED}];
		st.driver = {
			x: seat.x, y: 0.55, z: seat.z, yaw: yawToCamera(seat.x, seat.z, camPos),
			emotion: frame < 168 ? 'shock' : 'neutral', scale: 0.62, steering: true, pointing: false, seated: true, shirt: '#1976D2',
		};
		st.hud = {text: '18 MPH', color: HUD_GREEN};
		return st;
	}

	// ---- Shot 4: 185-228 — rear view, back to 62 MPH (number returns to red) ----
	if (frame <= 228) {
		const t = clamp01((frame - 185) / 43);
		const carZ = lerp(0, -45, t);
		const camPos: Vec3 = [2.5, lerp(2.2, 2.8, t), lerp(12, 18, t)];
		const camLook: Vec3 = [2.5, 1.0, carZ];
		const seat = seatForCar(2.5, carZ, Math.PI);
		const st = base(4, camPos, camLook);
		st.cars = [{x: 2.5, z: carZ, rotY: Math.PI, brake: false, wheelSpin: (0 - carZ) / 0.36, color: RED}];
		st.driver = {
			x: seat.x, y: 0.55, z: seat.z, yaw: yawToCamera(seat.x, seat.z, camPos),
			emotion: 'neutral', scale: 0.62, steering: true, pointing: false, seated: true, shirt: '#1976D2',
		};
		st.hud = {text: '62 MPH', color: HUD_RED};
		return st;
	}

	// ---- Shot 5: 229-332 — wide aerial, everyone brakes at the pole ----
	// FIXED framing (test t=9 cut the blue/red cars at the bottom edge):
	// all 6 cars kept in a tight band around the pole (z -24..8), camera
	// higher and centred over the band so every car stays fully in frame.
	if (frame <= 332) {
		const t = clamp01((frame - 229) / 103);
		const camPos: Vec3 = [0, lerp(32, 26, t), lerp(24, 16, t)];
		const camLook: Vec3 = [0, 0, -8];
		const travel = (start: number, dist: number) => {
			const tt = clamp01(t);
			return start + dist * (tt + 0.1 * Math.sin(2 * Math.PI * tt));
		};
		const nearPole = (z: number) => Math.abs(z + 8) < 12;
		const mkCar = (x: number, start: number, dist: number, rotY: number, color: string): FullCarState => {
			const z = travel(start, dist);
			return {x, z, rotY, brake: nearPole(z), wheelSpin: Math.abs(z - start) / 0.36, color};
		};
		const cars = [
			mkCar(2.5, -20, 12, 0, RED),
			mkCar(-2.5, 2, -10, Math.PI, BLUE),
			mkCar(5.5, -14, 10, 0, SILVER),
			mkCar(-5.5, -2, -8, Math.PI, GREEN),
			mkCar(2.5, -24, 8, 0, WHITE_CAR),
			mkCar(-2.5, 8, -12, Math.PI, WHITE_CAR),
		];
		const hero = cars[0];
		const seat = seatForCar(hero.x, hero.z, 0);
		const st = base(5, camPos, camLook);
		st.cars = cars;
		st.driver = {
			x: seat.x, y: 0.55, z: seat.z, yaw: yawToCamera(seat.x, seat.z, camPos),
			emotion: 'neutral', scale: 0.62, steering: true, pointing: false, seated: true, shirt: '#1976D2',
		};
		return st;
	}

	// ---- Shot 6: 333-401 — highway to skyline, HUD 101 MPH (escalation) ----
	if (frame <= 401) {
		const t = clamp01((frame - 333) / 68);
		const carZ = lerp(-2, -50, t);
		const camPos: Vec3 = [0, lerp(3.2, 2.2, t), lerp(16, 9, t)];
		const camLook: Vec3 = [0, 7, -100];
		const seat = seatForCar(2.5, carZ, Math.PI);
		const st = base(6, camPos, camLook);
		st.cars = [{x: 2.5, z: carZ, rotY: Math.PI, brake: false, wheelSpin: (0 - carZ) / 0.36, color: RED}];
		st.driver = {
			x: seat.x, y: 0.55, z: seat.z, yaw: yawToCamera(seat.x, seat.z, camPos),
			emotion: 'grumpy', scale: 0.62, steering: true, pointing: false, seated: true, shirt: '#37474F',
		};
		st.hud = {text: '101 MPH', color: HUD_RED};
		return st;
	}

	// ---- Shot 7: 402-440 — fine sign $150 -> $300 (escalation SHOWN, not told) ----
	if (frame <= 440) {
		const t = ease(clamp01((frame - 402) / 38));
		const camPos: Vec3 = [lerp(10.5, 12.0, t), lerp(2.0, 1.9, t), lerp(9, 6, t)];
		const camLook: Vec3 = [13.5, 2.3, -1];
		const st = base(7, camPos, camLook);
		st.driver = null;
		st.extraDrivers = [
			{
				x: 12.8, y: 0, z: 0.8, yaw: yawToCamera(12.8, 0.8, camPos),
				emotion: 'thinking', scale: 1.0, steering: false, pointing: true, seated: false, shirt: '#1976D2',
			},
		];
		st.signFlip = frame >= 421;
		return st;
	}

	// ---- Shot 8: 441-503 — top-down, giant SLOW! road paint ----
	if (frame <= 503) {
		const t = clamp01((frame - 441) / 62);
		const st = base(8, [0, lerp(28, 21, t), lerp(3, 0.5, t)], [0, 0, 0]);
		st.showSlow = true;
		return st;
	}

	// ---- Shot 9: 504-550 — camera box close-up, display "27 UNDER LIMIT" ----
	if (frame <= 550) {
		const t = clamp01((frame - 504) / 46);
		const camPos: Vec3 = [lerp(-3.5, -4.5, t), lerp(6.0, 6.2, t), lerp(-2, -3.5, t)];
		const camLook: Vec3 = [-6.5, 6.3, -8];
		const st = base(9, camPos, camLook);
		st.poleDisplay = '27 UNDER LIMIT';
		return st;
	}

	// ---- Shot 10: 551-611 — X-ray gag: driver is a WHITE SKELETON (literal joke, §5) ----
	if (frame <= 611) {
		const t = clamp01((frame - 551) / 60);
		const camPos: Vec3 = [lerp(-7.5, -8.5, t), 2.0, lerp(6, 5, t)];
		const camLook: Vec3 = [2.5, 0.9, -2];
		const seat = seatForCar(2.5, -2, 0);
		const st = base(10, camPos, camLook);
		st.cars = [{x: 2.5, z: -2, rotY: 0, brake: false, wheelSpin: 0, color: BLUE}];
		st.driver = {
			x: seat.x, y: 0.55, z: seat.z, yaw: yawToCamera(seat.x, seat.z, camPos),
			emotion: 'neutral', scale: 0.62, steering: true, pointing: false, seated: true, shirt: '#1976D2',
			skeleton: true,
		};
		st.flash = frame < 561;
		return st;
	}

	// ---- Shot 11: 612-727 — the mocker: rich guy in red sports car, money flies out ----
	if (frame <= 727) {
		if (frame <= 669) {
			// 11a: front 3/4, banknotes BURST out of the car, HUD 112 MPH
			const t = clamp01((frame - 612) / 57);
			const camPos: Vec3 = [lerp(5.5, 5.0, t), 1.8, lerp(5, 4, t)];
			const camLook: Vec3 = [2.5, 1.0, -4];
			const seat = seatForCar(2.5, -6, 0.25);
			const st = base(11, camPos, camLook);
			st.cars = [{x: 2.5, z: -6, rotY: 0.25, brake: false, wheelSpin: 0, color: RED}];
			st.driver = {
				x: seat.x, y: 0.55, z: seat.z, yaw: yawToCamera(seat.x, seat.z, camPos),
				emotion: 'neutral', scale: 0.62, steering: true, pointing: false, seated: true, shirt: '#37474F',
			};
			st.hud = {text: '112 MPH', color: HUD_RED};
			st.props = {banknotes: 'burst', bankOrigin: [2.5, 1.2, -6]};
			return st;
		}
		// 11b: rear of the red car speeding away, HUD 112 — villain undefeated so far
		const t = clamp01((frame - 670) / 57);
		const carZ = lerp(-6, -42, t);
		const camPos: Vec3 = [2.5, 2.2, lerp(6, 10, t)];
		const camLook: Vec3 = [2.5, 1.0, carZ];
		const seat = seatForCar(2.5, carZ, Math.PI);
		const st = base(11, camPos, camLook);
		st.cars = [{x: 2.5, z: carZ, rotY: Math.PI, brake: false, wheelSpin: (0 - carZ) / 0.36, color: RED}];
		st.driver = {
			x: seat.x, y: 0.55, z: seat.z, yaw: yawToCamera(seat.x, seat.z, camPos),
			emotion: 'neutral', scale: 0.62, steering: true, pointing: false, seated: true, shirt: '#37474F',
		};
		st.hud = {text: '112 MPH', color: HUD_RED};
		return st;
	}

	// ---- Shot 12: 728-760 — the pivot hero: inventor (GREEN jacket) on a ladder at the pole ----
	if (frame <= 760) {
		const t = clamp01((frame - 728) / 32);
		const camPos: Vec3 = [lerp(-1.0, -1.5, t), 4.5, lerp(4, 3, t)];
		const camLook: Vec3 = [-5.8, 4.0, -7];
		const st = base(12, camPos, camLook);
		st.extraDrivers = [
			{
				x: -5.9, y: 0, z: -6.0, yaw: yawToCamera(-5.9, -6.0, camPos),
				emotion: 'neutral', scale: 1.0, steering: false, pointing: false, seated: false, shirt: '#2E7D32',
				pose: 'ladder', noShadow: true,
			},
		];
		st.props = {ladder: true};
		return st;
	}

	// ---- Shot 13: 761-804 — inventor face close-up, tablet shows the new rule as code ----
	if (frame <= 804) {
		const t = clamp01((frame - 761) / 43);
		const camPos: Vec3 = [lerp(-2.2, -2.6, t), 1.7, lerp(-1.5, -2.2, t)];
		const camLook: Vec3 = [-4.2, 1.5, -5.5];
		const st = base(13, camPos, camLook);
		st.extraDrivers = [
			{
				x: -4.2, y: 0, z: -5.5, yaw: yawToCamera(-4.2, -5.5, camPos),
				emotion: 'thinking', scale: 1.0, steering: false, pointing: false, seated: false, shirt: '#2E7D32',
				pose: 'holdCheck',
			},
		];
		st.props = {tablet: {x: -3.55, y: 1.05, z: -4.55, rotY: yawToCamera(-4.2, -5.5, camPos)}};
		return st;
	}

	// ---- Shot 14: 805-901 — the camera flashes GOOD drivers (repetition = "every single car") ----
	if (frame <= 901) {
		const sub = frame <= 836 ? 0 : frame <= 868 ? 1 : 2;
		const subStart = [805, 837, 869][sub];
		const subT = clamp01((frame - subStart) / 32);
		const carColor = [GREEN, BLUE, GOLD_CAR][sub];
		const hudText = ['58 MPH FLASHED!', '55 MPH FLASHED!', '59 MPH FLASHED!'][sub];
		const carZ = lerp(-22, 2, subT);
		const camPos: Vec3 = [5.5, 2.2, lerp(16, 14.5, clamp01((frame - 805) / 96))];
		const camLook: Vec3 = [0, 1.2, -5];
		const seat = seatForCar(2.5, carZ, 0);
		const st = base(14, camPos, camLook);
		st.cars = [
			{x: 2.5, z: carZ, rotY: 0, brake: false, wheelSpin: (carZ + 22) / 0.36, color: carColor},
			{x: -2.5, z: 30 - subT * 40, rotY: Math.PI, brake: false, wheelSpin: 0, color: SILVER},
		];
		st.driver = {
			x: seat.x, y: 0.55, z: seat.z, yaw: yawToCamera(seat.x, seat.z, camPos),
			emotion: 'happy', scale: 0.62, steering: true, pointing: false, seated: true, shirt: '#1976D2',
		};
		st.hud = {text: hudText, color: HUD_GREEN};
		st.flash = frame - subStart < 8;
		return st;
	}

	// ---- Shot 15: 902-988 — the question: confused driver, big yellow "?" over the car ----
	if (frame <= 988) {
		const t = clamp01((frame - 902) / 86);
		const camPos: Vec3 = [2.5, lerp(1.8, 1.6, t), lerp(6, 5, t)];
		const camLook: Vec3 = [2.5, 1.1, -4];
		const seat = seatForCar(2.5, -4, 0);
		const st = base(15, camPos, camLook);
		st.cars = [{x: 2.5, z: -4, rotY: 0, brake: false, wheelSpin: 0, color: SILVER}];
		st.driver = {
			x: seat.x, y: 0.55, z: seat.z, yaw: yawToCamera(seat.x, seat.z, camPos),
			emotion: 'confused', scale: 0.62, steering: true, pointing: false, seated: true, shirt: '#1976D2',
		};
		st.hud = {text: '57 MPH UNDER LIMIT', color: HUD_GREEN};
		st.props = {question: {x: 2.5, y: 3.1, z: -4}};
		return st;
	}

	// ---- Shot 16: 989-1079 — a week later: driver WALKS to his mailbox (walk gait) ----
	if (frame <= 1079) {
		const t = ease(clamp01((frame - 989) / 90));
		const dx = lerp(-8.5, -12.6, t);
		const dz = lerp(-8, -10.0, t);
		const camPos: Vec3 = [lerp(-6.5, -7.2, t), 2.0, lerp(-4, -5, t)];
		const camLook: Vec3 = [lerp(-9, -12.2, t), 1.2, lerp(-9.5, -10.2, t)];
		const st = base(16, camPos, camLook);
		st.cars = [{x: -17, z: -24, rotY: 0.6, brake: false, wheelSpin: 0, color: SILVER}];
		st.extraDrivers = [
			{
				x: dx, y: 0, z: dz, yaw: Math.atan2(-12.6 - dx, -10.0 - dz),
				emotion: 'neutral', scale: 1.0, steering: false, pointing: false, seated: false, shirt: '#1976D2',
				walk: true,
			},
		];
		st.props = {mailbox: true, fence: true};
		return st;
	}

	// ---- Shot 17: 1080-1114 — at the mailbox, worried, reaching to open it ----
	if (frame <= 1114) {
		const t = clamp01((frame - 1080) / 34);
		const camPos: Vec3 = [lerp(-9.5, -10.0, t), 1.7, lerp(-7.0, -7.5, t)];
		const camLook: Vec3 = [-13.0, 1.2, -10.4];
		const st = base(17, camPos, camLook);
		st.extraDrivers = [
			{
				x: -13.0, y: 0, z: -10.4, yaw: yawToCamera(-13.0, -10.4, camPos),
				emotion: 'worry', scale: 1.0, steering: false, pointing: false, seated: false, shirt: '#1976D2',
				pose: 'reach',
			},
		];
		st.props = {mailbox: true, fence: true};
		return st;
	}

	// ---- Shot 18: 1115-1186 — the payoff reveal: shocked face + readable $2,000 check ----
	if (frame <= 1186) {
		const t = clamp01((frame - 1115) / 71);
		const camPos: Vec3 = [lerp(-9.5, -10.0, t), 1.7, lerp(-6.5, -7.0, t)];
		const camLook: Vec3 = [-12.5, 1.2, -10.2];
		const yaw = yawToCamera(-12.5, -10.2, camPos);
		const st = base(18, camPos, camLook);
		st.extraDrivers = [
			{
				x: -12.5, y: 0, z: -10.2, yaw,
				emotion: 'shock', scale: 1.0, steering: false, pointing: false, seated: false, shirt: '#1976D2',
				pose: 'holdCheck',
			},
		];
		st.props = {mailbox: true, fence: true, check: {x: -12.5, y: 1.02, z: -9.45, rotY: yaw}};
		return st;
	}

	// ---- Shot 19: 1187-1234 — money RAINING from the sky, arms out, orange shirt ----
	if (frame <= 1234) {
		const t = clamp01((frame - 1187) / 47);
		const camPos: Vec3 = [lerp(-6.0, -6.8, t), 2.4, lerp(-4, -5, t)];
		const camLook: Vec3 = [-12.0, 1.4, -10.2];
		const st = base(19, camPos, camLook);
		st.extraDrivers = [
			{
				x: -12.0, y: 0, z: -10.2, yaw: yawToCamera(-12.0, -10.2, camPos),
				emotion: 'happy', scale: 1.0, steering: false, pointing: false, seated: false, shirt: '#EF6C00',
				pose: 'armsOut',
			},
		];
		st.props = {mailbox: true, fence: true, banknotes: 'rain', bankOrigin: [-12, 6, -10]};
		return st;
	}

	// ---- Shot 20: 1235-1302 — "You see" VISUAL-MODE SWITCH: dark navy, camera = JACKPOT machine (§4) ----
	if (frame <= 1302) {
		const t = clamp01((frame - 1235) / 67);
		const camPos: Vec3 = [lerp(-4.5, -3.8, t), lerp(5.0, 5.2, t), lerp(1.5, 0.5, t)];
		const camLook: Vec3 = [-6.5, 4.0, -8];
		const st = base(20, camPos, camLook);
		st.navy = true;
		st.props = {jackpot: true};
		return st;
	}

	// ---- Shot 21: 1303-1391 — the mechanism SHOWN: lottery drum full of cash (§3.6) ----
	if (frame <= 1391) {
		const t = clamp01((frame - 1303) / 88);
		const camPos: Vec3 = [lerp(0, 0.8, t), lerp(2.6, 2.3, t), lerp(3, 1.5, t)];
		const camLook: Vec3 = [0, 2.2, -8];
		const st = base(21, camPos, camLook);
		st.navy = true;
		st.props = {drum: true};
		return st;
	}

	// ---- Shot 22: 1392-1475 — the result: calm slow traffic, green overhead signs ----
	if (frame <= 1475) {
		const t = clamp01((frame - 1392) / 83);
		const camPos: Vec3 = [0, lerp(3.0, 2.6, t), lerp(14, 10, t)];
		const camLook: Vec3 = [0, 1.5, -30];
		const st = base(22, camPos, camLook);
		st.cars = [
			{x: 2.5, z: lerp(-8, -32, t), rotY: 0, brake: false, wheelSpin: 0, color: WHITE_CAR},
			{x: -2.5, z: lerp(2, -22, t), rotY: Math.PI, brake: false, wheelSpin: 0, color: GREEN},
			{x: 5.5, z: lerp(-28, -48, t), rotY: 0, brake: false, wheelSpin: 0, color: SILVER},
		];
		st.props = {overhead: true};
		return st;
	}

	// ---- Shot 23: 1476-1513 — slow orderly traffic, white car enters from the right ----
	if (frame <= 1513) {
		const t = clamp01((frame - 1476) / 37);
		const camPos: Vec3 = [0, lerp(3.0, 2.7, t), lerp(12, 10, t)];
		const camLook: Vec3 = [1.5, 1.5, -25];
		const st = base(23, camPos, camLook);
		st.cars = [
			{x: -2.5, z: lerp(-4, -26, t), rotY: Math.PI, brake: false, wheelSpin: 0, color: BLUE},
			{x: 2.5, z: lerp(-18, -40, t), rotY: 0, brake: false, wheelSpin: 0, color: RED},
			{x: 5.5, z: lerp(25, -8, t), rotY: 0, brake: false, wheelSpin: 0, color: WHITE_CAR},
		];
		st.props = {overhead: true};
		return st;
	}

	// ---- Shot 24: 1514-1576 — the mocker defeated: SAME red car, SAME driver, number now GREEN 58 ----
	if (frame <= 1576) {
		const t = clamp01((frame - 1514) / 62);
		const camPos: Vec3 = [lerp(5.0, 4.6, t), 1.9, lerp(4, 3.2, t)];
		const camLook: Vec3 = [2.5, 1.0, -4];
		const seat = seatForCar(2.5, -5, 0.25);
		const st = base(24, camPos, camLook);
		st.cars = [{x: 2.5, z: -5, rotY: 0.25, brake: false, wheelSpin: 0, color: RED}];
		st.driver = {
			x: seat.x, y: 0.55, z: seat.z, yaw: yawToCamera(seat.x, seat.z, camPos),
			emotion: 'grumpy', scale: 0.62, steering: true, pointing: false, seated: true, shirt: '#37474F',
		};
		st.hud = {text: '58 MPH', color: HUD_GREEN};
		return st;
	}

	// ---- Shot 25: 1577-1641 — the stranger's new TV: family on the sofa watching football ----
	if (frame <= 1641) {
		const t = clamp01((frame - 1577) / 64);
		const camPos: Vec3 = [0, 2.2, 65.5];
		const camLook: Vec3 = [0, 1.5, 58];
		const st = base(25, camPos, camLook);
		st.room = true;
		// sofa seats at x -1.1 / 0 / 1.1, seat height 0.75, facing the TV (-Z)
		st.extraDrivers = [
			{x: -1.1, y: 0.56, z: 58.5, yaw: Math.PI, emotion: 'neutral', scale: 0.75, steering: false, pointing: false, seated: true, shirt: '#1976D2'},
			{x: 0, y: 0.59, z: 58.5, yaw: Math.PI, emotion: 'happy', scale: 0.7, steering: false, pointing: false, seated: true, shirt: '#C62828'},
			{x: 1.1, y: 0.62, z: 58.5, yaw: Math.PI, emotion: 'happy', scale: 0.65, steering: false, pointing: false, seated: true, shirt: '#2E7D32'},
		];
		return st;
	}

	// ---- Shot 26: 1642-1731 — payoff lands on the mocker: face turns SOLID RED, STOPS DEAD (§12) ----
	const t = clamp01((frame - 1642) / 89);
	const camPos: Vec3 = [lerp(6.8, 6.3, t), lerp(1.9, 1.8, t), lerp(5.5, 4.5, t)];
	const camLook: Vec3 = [2.5, 1.05, -5];
	const seat = seatForCar(2.5, -5, 0.25);
	const st = base(26, camPos, camLook);
	st.cars = [{x: 2.5, z: -5, rotY: 0.25, brake: false, wheelSpin: 0, color: RED}];
	st.driver = {
		x: seat.x, y: 0.55, z: seat.z, yaw: yawToCamera(seat.x, seat.z, camPos),
		emotion: 'shock', scale: 0.62, steering: true, pointing: false, seated: true, shirt: '#37474F',
		redFace: frame >= 1691,
	};
	return st;
}
