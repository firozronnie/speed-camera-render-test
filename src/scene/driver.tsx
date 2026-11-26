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
 * joints. Faces +Z; the parent billboards `yaw` toward the camera.
 * Head stays below the car roofline when seated in the car (head top ~1.2
 * in car-local units, roof at 1.53).
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
}> = ({position, yaw, shirt, seated, emotion, frame, steering, pointing, scale = 1}) => {
	const bob = Math.sin(frame * 0.18) * 0.012;
	const look = Math.sin(frame * 0.06) * 0.1;
	const headTilt = emotion === 'confused' ? 0.14 : emotion === 'thinking' ? -0.1 : 0;
	const eyeScaleY = emotion === 'grumpy' ? 0.3 : emotion === 'shock' ? 1.5 : 1;
	const eyeScaleX = emotion === 'shock' ? 1.35 : 1;
	const browL = emotion === 'worry' ? 0.5 : emotion === 'confused' ? -0.35 : emotion === 'grumpy' ? -0.45 : 0;
	const browR = emotion === 'worry' ? -0.5 : emotion === 'confused' ? 0.15 : emotion === 'grumpy' ? -0.45 : 0;
	const jerk = emotion === 'shock' ? 0.045 : 0;

	// steering: arms reach forward-down to the wheel; otherwise hang / point
	const armLx = steering ? -1.15 + Math.sin(frame * 0.22) * 0.05 : pointing ? -1.5 : -0.12;
	const armRx = steering ? -1.15 + Math.cos(frame * 0.22) * 0.05 : -0.12;
	const armLz = steering ? 0.15 : pointing ? 0.5 : 0.06;
	const armRz = steering ? -0.15 : -0.06;

	const torsoShape = React.useMemo(() => roundedRectShape(0.5, 0.55, 0.12), []);
	const torsoOutline = React.useMemo(() => roundedRectShape(0.55, 0.6, 0.14), []);

	return (
		<group position={position} rotation={[0, yaw, 0]} scale={[scale, scale, scale]}>
			{/* blob shadow (standing only) */}
			{!seated && (
				<mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
					<circleGeometry args={[0.42, 24]} />
					<meshBasicMaterial color="#000000" transparent opacity={0.25} />
				</mesh>
			)}
			<group position={[0, bob, 0]}>
				{/* ---- legs (standing only) ---- */}
				{!seated && (
					<>
						<group position={[-0.13, 0.58, 0]} rotation={[Math.sin(frame * 0.1) * 0.05, 0, 0.04]}>
							<mesh position={[0, -0.14, 0]}>
								<boxGeometry args={[0.13, 0.28, 0.06]} />
								<meshBasicMaterial color="#37474F" />
							</mesh>
							<group position={[0, -0.28, 0]}>
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
						<group position={[0.13, 0.58, 0]} rotation={[-Math.sin(frame * 0.1) * 0.05, 0, -0.04]}>
							<mesh position={[0, -0.14, 0]}>
								<boxGeometry args={[0.13, 0.28, 0.06]} />
								<meshBasicMaterial color="#37474F" />
							</mesh>
							<group position={[0, -0.28, 0]}>
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
					<meshBasicMaterial color={BLACK} />
				</mesh>
				<mesh position={[0, seated ? 0.42 : 0.85, 0]}>
					<shapeGeometry args={[torsoShape]} />
					<meshBasicMaterial color={shirt} />
				</mesh>
				{/* shirt buttons */}
				<mesh position={[0, seated ? 0.5 : 0.93, 0.012]}>
					<circleGeometry args={[0.02, 12]} />
					<meshBasicMaterial color={WHITE} />
				</mesh>
				<mesh position={[0, seated ? 0.36 : 0.79, 0.012]}>
					<circleGeometry args={[0.02, 12]} />
					<meshBasicMaterial color={WHITE} />
				</mesh>
				{/* ---- neck ---- */}
				<mesh position={[0, seated ? 0.72 : 1.15, 0]}>
					<boxGeometry args={[0.12, 0.12, 0.05]} />
					<meshBasicMaterial color={WHITE} />
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
						<meshBasicMaterial color={WHITE} />
					</mesh>
					{/* hair: brown cap */}
					<mesh position={[0, 0.22, 0.005]} rotation={[0, 0, 0]}>
						<circleGeometry args={[0.225, 32, 0, Math.PI]} />
						<meshBasicMaterial color="#6D4C41" />
					</mesh>
					{/* eyes */}
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
				</group>
				{/* ---- arms: shoulder pivot -> upper arm -> elbow pivot -> forearm + hand ---- */}
				<group
					position={[-0.28, seated ? 0.62 : 1.05, 0]}
					rotation={[armLx, 0, armLz]}
				>
					<mesh position={[0, -0.16, 0]}>
						<boxGeometry args={[0.11, 0.34, 0.05]} />
						<meshBasicMaterial color={shirt} />
					</mesh>
					<group position={[0, -0.32, 0]} rotation={[steering ? -0.35 : -0.15, 0, 0]}>
						<mesh position={[0, -0.14, 0]}>
							<boxGeometry args={[0.1, 0.3, 0.05]} />
							<meshBasicMaterial color={shirt} />
						</mesh>
						<mesh position={[0, -0.32, 0]}>
							<circleGeometry args={[0.06, 16]} />
							<meshBasicMaterial color={WHITE} />
						</mesh>
					</group>
				</group>
				<group
					position={[0.28, seated ? 0.62 : 1.05, 0]}
					rotation={[armRx, 0, armRz]}
				>
					<mesh position={[0, -0.16, 0]}>
						<boxGeometry args={[0.11, 0.34, 0.05]} />
						<meshBasicMaterial color={shirt} />
					</mesh>
					<group position={[0, -0.32, 0]} rotation={[steering ? -0.35 : -0.15, 0, 0]}>
						<mesh position={[0, -0.14, 0]}>
							<boxGeometry args={[0.1, 0.3, 0.05]} />
							<meshBasicMaterial color={shirt} />
						</mesh>
						<mesh position={[0, -0.32, 0]}>
							<circleGeometry args={[0.06, 16]} />
							<meshBasicMaterial color={WHITE} />
						</mesh>
					</group>
				</group>
			</group>
		</group>
	);
};
