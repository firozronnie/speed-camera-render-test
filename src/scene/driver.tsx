import React from 'react';
import * as THREE from 'three';

export type DriverEmotion =
	| 'neutral'
	| 'shock'
	| 'worry'
	| 'confused'
	| 'grumpy'
	| 'happy'
	| 'thinking';

export type DriverPose =
	| 'steer'
	| 'point'
	| 'holdCheck'
	| 'reach'
	| 'armsOut'
	| 'ladder';

function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
	const s = new THREE.Shape();
	const x = -w / 2;
	const y = -h / 2;
	s.moveTo(x + r, y);
	s.lineTo(x + w - r, y);
	s.quadraticCurveTo(x + w, y, x + w, y + r);
	s.lineTo(x + w, y + h - r);
	s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	s.lineTo(x + r, y + h);
	s.quadraticCurveTo(x, y + h, x, y + h - r);
	s.lineTo(x, y + r);
	s.quadraticCurveTo(x, y, x + r, y);
	return s;
}

const BLACK = '#111111';
const WHITE = '#FFFFFF';

/**
 * Rigged flat-2D character, built from separate parts with pivots at the
 * joints — shoulder / elbow / wrist, hip / knee / ankle — all attached, all
 * bending the correct way (knees bend BACK, elbows bend FORWARD, never
 * backwards). Faces +Z; the parent billboards `yaw` toward the camera.
 * Head stays below the car roofline when seated in the car (head top ~1.2
 * in car-local units, roof at 1.53).
 *
 * Joint convention (character faces +Z, limbs hang down -Y):
 * - rotation.x NEGATIVE swings a limb FORWARD (+Z); POSITIVE swings it BACK.
 * - knee flexes POSITIVE only (shin goes back, never forward).
 * - elbow flexes NEGATIVE (forearm comes forward/up).
 * - rotation.z: left arm NEGATIVE = out to the left, right arm POSITIVE = out
 *   to the right.
 */
export const Driver: React.FC<{
	position: [number, number, number];
	yaw: number;
	shirt: string;
	seated: boolean;
	emotion: DriverEmotion;
	frame: number;
	steering?: boolean;
	pointing?: boolean;
	scale?: number;
	walk?: boolean;
	pose?: DriverPose;
	skeleton?: boolean;
	redFace?: boolean;
	noShadow?: boolean;
}> = ({
	position,
	yaw,
	shirt,
	seated,
	emotion,
	frame,
	steering,
	pointing,
	scale = 1,
	walk = false,
	pose,
	skeleton = false,
	redFace = false,
	noShadow = false,
}) => {
	const bob = Math.sin(frame * 0.18) * 0.012;
	const look = Math.sin(frame * 0.06) * 0.1;
	const headTilt = emotion === 'confused' ? 0.14 : emotion === 'thinking' ? -0.1 : 0;
	const eyeScaleY = emotion === 'grumpy' ? 0.3 : emotion === 'shock' ? 1.5 : 1;
	const eyeScaleX = emotion === 'shock' ? 1.35 : 1;
	const browL = emotion === 'worry' ? 0.5 : emotion === 'confused' ? -0.35 : emotion === 'grumpy' ? -0.45 : 0;
	const browR = emotion === 'worry' ? -0.5 : emotion === 'confused' ? 0.15 : emotion === 'grumpy' ? -0.45 : 0;
	const jerk = emotion === 'shock' ? 0.045 : 0;

	// ---- resolve the pose (explicit pose wins, then legacy flags) ----
	const p: DriverPose | undefined =
		pose ?? (steering ? 'steer' : pointing ? 'point' : undefined);

	// ---- WALK GAIT: alternating hip swing, knees flex only backwards,
	// arms counter-swing. Phase ~2 steps/second. ----
	const phase = frame * 0.32;
	const hipL = walk ? -0.55 * Math.sin(phase) : Math.sin(frame * 0.1) * 0.05;
	const hipR = walk ? -0.55 * Math.sin(phase + Math.PI) : -Math.sin(frame * 0.1) * 0.05;
	// knee bends while its leg swings forward (thigh forward = sin > 0)
	const kneeL = walk ? 0.85 * Math.max(0, Math.sin(phase)) : 0;
	const kneeR = walk ? 0.85 * Math.max(0, Math.sin(phase + Math.PI)) : 0;
	const walkBob = walk ? Math.abs(Math.cos(phase)) * 0.03 : 0;
	const swingL = walk ? 0.35 * Math.sin(phase + Math.PI) : 0;
	const swingR = walk ? 0.35 * Math.sin(phase) : 0;

	// ---- ARM TARGETS per pose ----
	// armLx/armRx = shoulder rotation.x (negative = arm swings forward)
	// armLz/armRz = shoulder rotation.z (left negative = out left, right positive = out right)
	// elbowLx/elbowRx = elbow rotation.x (negative = forearm bends forward)
	let armLx = -0.12;
	let armRx = -0.12;
	let armLz = 0.06;
	let armRz = -0.06;
	let elbowLx = -0.15;
	let elbowRx = -0.15;
	if (p === 'steer') {
		armLx = -1.15 + Math.sin(frame * 0.22) * 0.05;
		armRx = -1.15 + Math.cos(frame * 0.22) * 0.05;
		armLz = 0.15;
		armRz = -0.15;
		elbowLx = -0.35;
		elbowRx = -0.35;
	} else if (p === 'point') {
		armLx = -1.5;
		armRx = -0.12;
		armLz = 0.1;
		armRz = -0.06;
		elbowLx = -0.08;
	} else if (p === 'holdCheck') {
		// both hands forward at chest height, meeting in front to hold the check
		armLx = -1.25;
		armRx = -1.25;
		armLz = 0.14;
		armRz = -0.14;
		elbowLx = -0.3;
		elbowRx = -0.3;
	} else if (p === 'reach') {
		// right arm straight forward to the mailbox, left arm relaxed down
		armLx = -0.1;
		armRx = -1.45;
		armLz = 0.06;
		armRz = -0.05;
		elbowLx = -0.1;
		elbowRx = -0.05;
	} else if (p === 'armsOut') {
		// both arms out to the sides, slightly up (money raining)
		armLx = -0.25;
		armRx = -0.25;
		armLz = -0.85;
		armRz = 0.85;
		elbowLx = -0.1;
		elbowRx = -0.1;
	} else if (p === 'ladder') {
		// both arms up-forward, gripping the ladder rails above the head
		armLx = -2.1;
		armRx = -2.1;
		armLz = 0.25;
		armRz = -0.25;
		elbowLx = -0.5;
		elbowRx = -0.5;
	}
	if (walk) {
		// walking overrides the arms: counter-swing, elbows softly bent
		armLx = swingL;
		armRx = swingR;
		armLz = 0.06;
		armRz = -0.06;
		elbowLx = -0.25;
		elbowRx = -0.25;
	}

	const torsoShape = React.useMemo(() => roundedRectShape(0.5, 0.55, 0.12), []);
	const torsoOutline = React.useMemo(() => roundedRectShape(0.55, 0.6, 0.14), []);
	const limbColor = skeleton ? WHITE : shirt;
	const skinColor = skeleton ? WHITE : WHITE;

	return (
		<group position={position} rotation={[0, yaw, 0]} scale={[scale, scale, scale]}>
			{/* blob shadow (standing only, never floating under an elevated driver) */}
			{!seated && !noShadow && (
				<mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
					<circleGeometry args={[0.42, 24]} />
					<meshBasicMaterial color="#000000" transparent opacity={0.25} />
				</mesh>
			)}
			<group position={[0, bob + walkBob, 0]}>
				{/* ---- legs (standing only): hip pivot -> thigh -> knee pivot -> shin + shoe ---- */}
				{!seated && (
					<>
						<group position={[-0.13, 0.58, 0]} rotation={[hipL, 0, 0.04]}>
							<mesh position={[0, -0.14, 0]}>
								<boxGeometry args={[0.13, 0.28, 0.06]} />
								<meshBasicMaterial color="#37474F" />
							</mesh>
							<group position={[0, -0.28, 0]} rotation={[kneeL, 0, 0]}>
								<mesh position={[0, -0.13, 0]}>
									<boxGeometry args={[0.12, 0.26, 0.06]} />
									<meshBasicMaterial color="#37474F" />
								</mesh>
								<mesh position={[0, -0.26, 0.04]}>
									<boxGeometry args={[0.14, 0.07, 0.2]} />
									<meshBasicMaterial color={BLACK} />
								</mesh>
							</group>
						</group>
						<group position={[0.13, 0.58, 0]} rotation={[hipR, 0, -0.04]}>
							<mesh position={[0, -0.14, 0]}>
								<boxGeometry args={[0.13, 0.28, 0.06]} />
								<meshBasicMaterial color="#37474F" />
							</mesh>
							<group position={[0, -0.28, 0]} rotation={[kneeR, 0, 0]}>
								<mesh position={[0, -0.13, 0]}>
									<boxGeometry args={[0.12, 0.26, 0.06]} />
									<meshBasicMaterial color="#37474F" />
								</mesh>
								<mesh position={[0, -0.26, 0.04]}>
									<boxGeometry args={[0.14, 0.07, 0.2]} />
									<meshBasicMaterial color={BLACK} />
								</mesh>
							</group>
						</group>
					</>
				)}
				{/* ---- torso (outline behind, shirt in front) ---- */}
				<mesh position={[0, seated ? 0.42 : 0.85, -0.012]}>
					<shapeGeometry args={[torsoOutline]} />
					<meshBasicMaterial color={skeleton ? WHITE : BLACK} />
				</mesh>
				<mesh position={[0, seated ? 0.42 : 0.85, 0]}>
					<shapeGeometry args={[torsoShape]} />
					<meshBasicMaterial color={skeleton ? WHITE : shirt} side={THREE.DoubleSide} />
				</mesh>
				{/* skeleton ribs: black spine + rib lines over the white torso */}
				{skeleton && (
					<>
						<mesh position={[0, seated ? 0.42 : 0.85, 0.012]}>
							<boxGeometry args={[0.03, 0.5, 0.005]} />
							<meshBasicMaterial color={BLACK} />
						</mesh>
						{[-0.16, -0.05, 0.06, 0.17].map((dy) => (
							<mesh key={dy} position={[0, (seated ? 0.42 : 0.85) + dy, 0.012]}>
								<boxGeometry args={[0.4, 0.02, 0.005]} />
								<meshBasicMaterial color={BLACK} />
							</mesh>
						))}
					</>
				)}
				{/* shirt buttons (not on skeleton) */}
				{!skeleton && (
					<>
						<mesh position={[0, seated ? 0.5 : 0.93, 0.012]}>
							<circleGeometry args={[0.02, 12]} />
							<meshBasicMaterial color={WHITE} />
						</mesh>
						<mesh position={[0, seated ? 0.36 : 0.79, 0.012]}>
							<circleGeometry args={[0.02, 12]} />
							<meshBasicMaterial color={WHITE} />
						</mesh>
					</>
				)}
				{/* ---- neck ---- */}
				<mesh position={[0, seated ? 0.72 : 1.15, 0]}>
					<boxGeometry args={[0.12, 0.12, 0.05]} />
					<meshBasicMaterial color={skinColor} />
				</mesh>
				{/* ---- head group (pivot at neck) ---- */}
				<group
					position={[0, seated ? 0.78 : 1.21, jerk]}
					rotation={[0, look, headTilt]}
				>
					{/* head outline + face */}
					<mesh position={[0, 0.2, -0.008]}>
						<circleGeometry args={[0.245, 32]} />
						<meshBasicMaterial color={BLACK} />
					</mesh>
					<mesh position={[0, 0.2, 0]}>
						<circleGeometry args={[0.22, 32]} />
						<meshBasicMaterial color={redFace ? '#C62828' : WHITE} side={THREE.DoubleSide} />
					</mesh>
					{/* hair: brown cap (hidden when skeleton or red face) */}
					{!skeleton && !redFace && (
						<mesh position={[0, 0.22, 0.005]} rotation={[0, 0, 0]}>
							<circleGeometry args={[0.225, 32, 0, Math.PI]} />
							<meshBasicMaterial color="#6D4C41" side={THREE.DoubleSide} />
						</mesh>
					)}
					{/* eyes */}
					{skeleton ? (
						<>
							{/* skull eye sockets */}
							<mesh position={[-0.08, 0.22, 0.01]}>
								<circleGeometry args={[0.05, 16]} />
								<meshBasicMaterial color={BLACK} />
							</mesh>
							<mesh position={[0.08, 0.22, 0.01]}>
								<circleGeometry args={[0.05, 16]} />
								<meshBasicMaterial color={BLACK} />
							</mesh>
							{/* nose hole */}
							<mesh position={[0, 0.14, 0.01]}>
								<boxGeometry args={[0.03, 0.04, 0.005]} />
								<meshBasicMaterial color={BLACK} />
							</mesh>
							{/* teeth */}
							<mesh position={[0, 0.05, 0.01]}>
								<boxGeometry args={[0.12, 0.05, 0.005]} />
								<meshBasicMaterial color={WHITE} />
							</mesh>
							{[-0.04, 0, 0.04].map((dx) => (
								<mesh key={dx} position={[dx, 0.05, 0.012]}>
									<boxGeometry args={[0.012, 0.05, 0.005]} />
									<meshBasicMaterial color={BLACK} />
								</mesh>
							))}
						</>
					) : redFace ? (
						<>
							{/* wide white sclera, black pupils, angry brows, gritted teeth */}
							<mesh position={[-0.08, 0.23, 0.01]}>
								<circleGeometry args={[0.05, 16]} />
								<meshBasicMaterial color={WHITE} />
							</mesh>
							<mesh position={[0.08, 0.23, 0.01]}>
								<circleGeometry args={[0.05, 16]} />
								<meshBasicMaterial color={WHITE} />
							</mesh>
							<mesh position={[-0.08, 0.23, 0.012]}>
								<circleGeometry args={[0.022, 12]} />
								<meshBasicMaterial color={BLACK} />
							</mesh>
							<mesh position={[0.08, 0.23, 0.012]}>
								<circleGeometry args={[0.022, 12]} />
								<meshBasicMaterial color={BLACK} />
							</mesh>
							<mesh position={[-0.08, 0.31, 0.01]} rotation={[0, 0, -0.6]}>
								<boxGeometry args={[0.08, 0.016, 0.005]} />
								<meshBasicMaterial color={BLACK} />
							</mesh>
							<mesh position={[0.08, 0.31, 0.01]} rotation={[0, 0, 0.6]}>
								<boxGeometry args={[0.08, 0.016, 0.005]} />
								<meshBasicMaterial color={BLACK} />
							</mesh>
							<mesh position={[0, 0.08, 0.01]}>
								<boxGeometry args={[0.14, 0.05, 0.005]} />
								<meshBasicMaterial color={WHITE} />
							</mesh>
							{[-0.045, 0, 0.045].map((dx) => (
								<mesh key={dx} position={[dx, 0.08, 0.012]}>
									<boxGeometry args={[0.012, 0.05, 0.005]} />
									<meshBasicMaterial color={BLACK} />
								</mesh>
							))}
						</>
					) : (
						<>
							<mesh position={[-0.08, 0.22, 0.01]} scale={[eyeScaleX, eyeScaleY, 1]}>
								<circleGeometry args={[0.028, 16]} />
								<meshBasicMaterial color={BLACK} />
							</mesh>
							<mesh position={[0.08, 0.22, 0.01]} scale={[eyeScaleX, eyeScaleY, 1]}>
								<circleGeometry args={[0.028, 16]} />
								<meshBasicMaterial color={BLACK} />
							</mesh>
							{/* eyebrows */}
							<mesh position={[-0.08, 0.3, 0.01]} rotation={[0, 0, browL]}>
								<boxGeometry args={[0.07, 0.014, 0.005]} />
								<meshBasicMaterial color={BLACK} />
							</mesh>
							<mesh position={[0.08, 0.3, 0.01]} rotation={[0, 0, browR]}>
								<boxGeometry args={[0.07, 0.014, 0.005]} />
								<meshBasicMaterial color={BLACK} />
							</mesh>
							{/* mouths (only one visible) */}
							{emotion !== 'shock' && emotion !== 'happy' && (
								<mesh position={[0, 0.1, 0.01]}>
									<boxGeometry
										args={[emotion === 'worry' ? 0.05 : 0.07, 0.012, 0.005]}
									/>
									<meshBasicMaterial color={BLACK} />
								</mesh>
							)}
							{emotion === 'shock' && (
								<mesh position={[0, 0.09, 0.01]}>
									<torusGeometry args={[0.035, 0.011, 8, 20]} />
									<meshBasicMaterial color={BLACK} />
								</mesh>
							)}
							{emotion === 'happy' && (
								<mesh position={[0, 0.12, 0.01]} rotation={[0, 0, Math.PI]}>
									<torusGeometry args={[0.045, 0.011, 8, 20, Math.PI]} />
									<meshBasicMaterial color={BLACK} />
								</mesh>
							)}
							{emotion === 'worry' && (
								<mesh position={[0, 0.08, 0.01]} rotation={[0, 0, 0]}>
									<torusGeometry args={[0.045, 0.011, 8, 20, Math.PI]} />
									<meshBasicMaterial color={BLACK} />
								</mesh>
							)}
						</>
					)}
				</group>
				{/* ---- arms: shoulder pivot -> upper arm -> elbow pivot -> forearm + hand ---- */}
				<group
					position={[-0.28, seated ? 0.62 : 1.05, 0]}
					rotation={[armLx, 0, armLz]}
				>
					<mesh position={[0, -0.16, 0]}>
						<boxGeometry args={[0.11, 0.34, 0.05]} />
						<meshBasicMaterial color={limbColor} />
					</mesh>
					<group position={[0, -0.32, 0]} rotation={[elbowLx, 0, 0]}>
						<mesh position={[0, -0.14, 0]}>
							<boxGeometry args={[0.1, 0.3, 0.05]} />
							<meshBasicMaterial color={limbColor} />
						</mesh>
						<mesh position={[0, -0.32, 0]}>
							<circleGeometry args={[0.06, 16]} />
							<meshBasicMaterial color={skinColor} />
						</mesh>
					</group>
				</group>
				<group
					position={[0.28, seated ? 0.62 : 1.05, 0]}
					rotation={[armRx, 0, armRz]}
				>
					<mesh position={[0, -0.16, 0]}>
						<boxGeometry args={[0.11, 0.34, 0.05]} />
						<meshBasicMaterial color={limbColor} />
					</mesh>
					<group position={[0, -0.32, 0]} rotation={[elbowRx, 0, 0]}>
						<mesh position={[0, -0.14, 0]}>
							<boxGeometry args={[0.1, 0.3, 0.05]} />
							<meshBasicMaterial color={limbColor} />
						</mesh>
						<mesh position={[0, -0.32, 0]}>
							<circleGeometry args={[0.06, 16]} />
							<meshBasicMaterial color={skinColor} />
						</mesh>
					</group>
				</group>
			</group>
		</group>
	);
};
