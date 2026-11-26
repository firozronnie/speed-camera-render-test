import type {DriverEmotion} from './driver';

export type Vec3 = [number, number, number];

export interface CarState {
	x: number;
	z: number;
	rotY: number;
	brake: boolean;
	wheelSpin: number;
	color: string;
}

export interface DriverState {
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
}

export interface ShotState {
	shot: number;
	camPos: Vec3;
	camLook: Vec3;
	cars: CarState[];
	driver: DriverState | null;
	standingDriver: DriverState | null;
	hud: {text: string; color: string} | null;
	signFlip: boolean;
	showSlow: boolean;
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
export const HUD_RED = '#EF2B2B';
export const HUD_GREEN = '#22C55E';

/** Driver seat world position for a car at (x, z) with rotation rotY. */
function seatForCar(x: number, z: number, rotY: number): {x: number; z: number} {
	// seat offset in car-local coords: left seat, slightly forward
	const lx = -0.45;
	const lz = 0.35;
	const cos = Math.cos(rotY);
	const sin = Math.sin(rotY);
	return {x: x + lx * cos + lz * sin, z: z - lx * sin + lz * cos};
}

function yawToCamera(fromX: number, fromZ: number, camPos: Vec3): number {
	return Math.atan2(camPos[0] - fromX, camPos[2] - fromZ);
}

export function getShotState(frame: number): ShotState {
	// ---- Shot 1: 0-102 — camera pole close-up, push-in ----
	if (frame <= 102) {
		const t = ease(clamp01(frame / 102));
		const camPos: Vec3 = [lerp(2.5, 1.2, t), lerp(2.4, 2.1, t), lerp(7, 2.5, t)];
		const camLook: Vec3 = [lerp(-4.5, -5.2, t), lerp(4, 4.2, t), -8];
		// background traffic passing the pole
		const blueZ = -30 + (frame / 102) * 55;
		const silverZ = 12 - (frame / 102) * 55;
		return {
			shot: 1,
			camPos,
			camLook,
			cars: [
				{x: 2.5, z: blueZ, rotY: 0, brake: false, wheelSpin: (blueZ + 30) / 0.36, color: BLUE},
				{x: -2.5, z: silverZ, rotY: Math.PI, brake: false, wheelSpin: (12 - silverZ) / 0.36, color: SILVER},
			],
			driver: null,
			standingDriver: null,
			hud: null,
			signFlip: false,
			showSlow: false,
		};
	}

	// ---- Shot 2: 103-149 — red car head-on, 62 MPH ----
	if (frame <= 149) {
		const t = clamp01((frame - 103) / 46);
		const carZ = lerp(-34, -9, t);
		const camPos: Vec3 = [2.5, 1.9, lerp(3, 6, t)];
		const camLook: Vec3 = [2.5, 1.0, carZ + 2];
		const seat = seatForCar(2.5, carZ, 0);
		return {
			shot: 2,
			camPos,
			camLook,
			cars: [{x: 2.5, z: carZ, rotY: 0, brake: false, wheelSpin: (carZ + 34) / 0.36, color: RED}],
			driver: {
				x: seat.x,
				y: 0.55,
				z: seat.z,
				yaw: yawToCamera(seat.x, seat.z, camPos),
				emotion: 'neutral',
				scale: 0.62,
				steering: true,
				pointing: false,
				seated: true,
				shirt: '#1976D2',
			},
			standingDriver: null,
			hud: {text: '62 MPH', color: HUD_RED},
			signFlip: false,
			showSlow: false,
		};
	}

	// ---- Shot 3: 150-184 — side profile, braking to 18 MPH ----
	if (frame <= 184) {
		const t = clamp01((frame - 150) / 34);
		const carZ = -8 + easeOut(t) * 22;
		const camPos: Vec3 = [11, 1.7, 2];
		const camLook: Vec3 = [2.5, 1.0, carZ];
		const seat = seatForCar(2.5, carZ, 0);
		return {
			shot: 3,
			camPos,
			camLook,
			cars: [{x: 2.5, z: carZ, rotY: 0, brake: t < 0.6, wheelSpin: (carZ + 8) / 0.36, color: RED}],
			driver: {
				x: seat.x,
				y: 0.55,
				z: seat.z,
				yaw: yawToCamera(seat.x, seat.z, camPos),
				emotion: frame < 168 ? 'shock' : 'neutral',
				scale: 0.62,
				steering: true,
				pointing: false,
				seated: true,
				shirt: '#1976D2',
			},
			standingDriver: null,
			hud: {text: '18 MPH', color: HUD_GREEN},
			signFlip: false,
			showSlow: false,
		};
	}

	// ---- Shot 4: 185-228 — rear view, back to 62 MPH ----
	if (frame <= 228) {
		const t = clamp01((frame - 185) / 43);
		const carZ = lerp(0, -45, t);
		const camPos: Vec3 = [2.5, lerp(2.2, 2.8, t), lerp(12, 18, t)];
		const camLook: Vec3 = [2.5, 1.0, carZ];
		const seat = seatForCar(2.5, carZ, Math.PI);
		return {
			shot: 4,
			camPos,
			camLook,
			cars: [{x: 2.5, z: carZ, rotY: Math.PI, brake: false, wheelSpin: (0 - carZ) / 0.36, color: RED}],
			driver: {
				x: seat.x,
				y: 0.55,
				z: seat.z,
				yaw: yawToCamera(seat.x, seat.z, camPos),
				emotion: 'neutral',
				scale: 0.62,
				steering: true,
				pointing: false,
				seated: true,
				shirt: '#1976D2',
			},
			standingDriver: null,
			hud: {text: '62 MPH', color: HUD_RED},
			signFlip: false,
			showSlow: false,
		};
	}

	// ---- Shot 5: 229-332 — wide highway aerial, everyone brakes at the pole ----
	if (frame <= 332) {
		const t = clamp01((frame - 229) / 103);
		const camPos: Vec3 = [lerp(0, 0, t), lerp(20, 13, t), lerp(20, -4, t)];
		const camLook: Vec3 = [0, 0, -25];
		// cars slow near the pole (z=-8) then speed up again
		const travel = (start: number, dist: number) => {
			const tt = clamp01(t);
			return start + dist * (tt + 0.1 * Math.sin(2 * Math.PI * tt));
		};
		const nearPole = (z: number) => Math.abs(z + 8) < 12;
		const mkCar = (x: number, start: number, dist: number, rotY: number, color: string): CarState => {
			const z = travel(start, dist);
			return {
				x,
				z,
				rotY,
				brake: nearPole(z),
				wheelSpin: Math.abs(z - start) / 0.36,
				color,
			};
		};
		const cars = [
			mkCar(2.5, -30, 55, 0, RED),
			mkCar(-2.5, 20, -55, Math.PI, BLUE),
			mkCar(5.5, -45, 60, 0, SILVER),
			mkCar(-5.5, -5, -50, Math.PI, GREEN),
			mkCar(2.5, -60, 55, 0, WHITE_CAR),
			mkCar(-2.5, 45, -60, Math.PI, WHITE_CAR),
		];
		const hero = cars[0];
		const seat = seatForCar(hero.x, hero.z, 0);
		return {
			shot: 5,
			camPos,
			camLook,
			cars,
			driver: {
				x: seat.x,
				y: 0.55,
				z: seat.z,
				yaw: yawToCamera(seat.x, seat.z, camPos),
				emotion: 'neutral',
				scale: 0.62,
				steering: true,
				pointing: false,
				seated: true,
				shirt: '#1976D2',
			},
			standingDriver: null,
			hud: null,
			signFlip: false,
			showSlow: false,
		};
	}

	// ---- Shot 6: 333-401 — highway to skyline, 101 MPH ----
	if (frame <= 401) {
		const t = clamp01((frame - 333) / 68);
		const carZ = lerp(-2, -50, t);
		const camPos: Vec3 = [0, lerp(3.2, 2.2, t), lerp(16, 9, t)];
		const camLook: Vec3 = [0, 7, -100];
		const seat = seatForCar(2.5, carZ, Math.PI);
		return {
			shot: 6,
			camPos,
			camLook,
			cars: [{x: 2.5, z: carZ, rotY: Math.PI, brake: false, wheelSpin: (0 - carZ) / 0.36, color: RED}],
			driver: {
				x: seat.x,
				y: 0.55,
				z: seat.z,
				yaw: yawToCamera(seat.x, seat.z, camPos),
				emotion: 'grumpy',
				scale: 0.62,
				steering: true,
				pointing: false,
				seated: true,
				shirt: '#37474F',
			},
			standingDriver: null,
			hud: {text: '101 MPH', color: HUD_RED},
			signFlip: false,
			showSlow: false,
		};
	}

	// ---- Shot 7: 402-440 — fine sign $150 -> $300 ----
	if (frame <= 440) {
		const t = ease(clamp01((frame - 402) / 38));
		const camPos: Vec3 = [lerp(3.5, 5.2, t), lerp(1.9, 1.8, t), lerp(7, 3.6, t)];
		const camLook: Vec3 = [6.8, 2.3, -2];
		return {
			shot: 7,
			camPos,
			camLook,
			cars: [],
			driver: null,
			standingDriver: {
				x: 5.9,
				y: 0,
				z: 0.6,
				yaw: yawToCamera(5.9, 0.6, camPos),
				emotion: 'thinking',
				scale: 1.0,
				steering: false,
				pointing: true,
				seated: false,
				shirt: '#1976D2',
			},
			hud: null,
			signFlip: frame >= 421,
			showSlow: false,
		};
	}

	// ---- Shot 8: 441-449 — top-down SLOW! road paint ----
	const t = clamp01((frame - 441) / 8);
	return {
		shot: 8,
		camPos: [0, lerp(28, 21, t), lerp(3, 0.5, t)],
		camLook: [0, 0, 0],
		cars: [],
		driver: null,
		standingDriver: null,
		hud: null,
		signFlip: false,
		showSlow: true,
	};
}
