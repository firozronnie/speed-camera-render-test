import React from 'react';
import * as THREE from 'three';
import {mulberry32, banknoteTexture, checkTexture, codeTexture, overheadTexture, textTexture, tvTexture} from './textures';

function useMemoTexture(fn: () => THREE.CanvasTexture) {
	// eslint-disable-next-line react-hooks/exhaustive-deps
	return React.useMemo(fn, []);
}

/** Tall ladder leaning on the camera pole (inventor climbs it). */
export const Ladder: React.FC<{position: [number, number, number]; rotY?: number}> = ({
	position,
	rotY = 0,
}) => (
	<group position={position} rotation={[0, rotY, 0]}>
		{/* leaning ~12° toward the pole (top toward local -X; rotate the group so -X faces the pole) */}
		<group rotation={[0, 0, 0.2]}>
			<mesh position={[-0.35, 2.6, 0]}>
				<boxGeometry args={[0.09, 5.4, 0.09]} />
				<meshStandardMaterial color="#8D6E63" roughness={0.85} />
			</mesh>
			<mesh position={[0.35, 2.6, 0]}>
				<boxGeometry args={[0.09, 5.4, 0.09]} />
				<meshStandardMaterial color="#8D6E63" roughness={0.85} />
			</mesh>
			{[0.6, 1.3, 2.0, 2.7, 3.4, 4.1, 4.8].map((y) => (
				<mesh key={y} position={[0, y, 0]}>
					<cylinderGeometry args={[0.035, 0.035, 0.66, 8]} />
					<meshStandardMaterial color="#C9A227" metalness={0.9} roughness={0.3} />
				</mesh>
			))}
		</group>
	</group>
);

/** Black mailbox on a post, red flag up (suburban street). */
export const Mailbox: React.FC<{position: [number, number, number]}> = ({position}) => (
	<group position={position}>
		<mesh position={[0, 0.55, 0]}>
			<boxGeometry args={[0.14, 1.1, 0.14]} />
			<meshStandardMaterial color="#5D4037" roughness={0.9} />
		</mesh>
		{/* rounded box body */}
		<mesh position={[0, 1.3, 0]}>
			<boxGeometry args={[0.55, 0.4, 0.4]} />
			<meshStandardMaterial color="#1A1A1A" roughness={0.5} metalness={0.4} />
		</mesh>
		{/* rounded top: full cylinder lying along Z, bottom half hidden inside the box */}
		<mesh position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
			<cylinderGeometry args={[0.2, 0.2, 0.55, 16]} />
			<meshStandardMaterial color="#1A1A1A" roughness={0.5} metalness={0.4} />
		</mesh>
		{/* red flag, raised */}
		<mesh position={[0.3, 1.55, 0]}>
			<boxGeometry args={[0.04, 0.35, 0.14]} />
			<meshStandardMaterial color="#E53935" roughness={0.5} />
		</mesh>
		{/* brass number plate */}
		<mesh position={[0, 1.3, 0.21]}>
			<boxGeometry args={[0.2, 0.12, 0.02]} />
			<meshStandardMaterial color="#C9A227" metalness={0.9} roughness={0.3} />
		</mesh>
	</group>
);

/** The $2,000 check, held up by the driver. */
export const Check: React.FC<{position: [number, number, number]; rotY?: number; tilt?: number}> = ({
	position,
	rotY = 0,
	tilt = 0,
}) => {
	const tex = useMemoTexture(checkTexture);
	return (
		<group position={position} rotation={[tilt, rotY, 0]}>
			<mesh position={[0, 0, -0.02]}>
				<boxGeometry args={[1.0, 0.5, 0.02]} />
				<meshStandardMaterial color="#E8E8E8" roughness={0.6} />
			</mesh>
			<mesh position={[0, 0, 0]}>
				<planeGeometry args={[0.96, 0.48]} />
				<meshBasicMaterial map={tex} />
			</mesh>
		</group>
	);
};

/** The inventor's black tablet showing the new rule as code. */
export const Tablet: React.FC<{position: [number, number, number]; rotY?: number}> = ({
	position,
	rotY = 0,
}) => {
	const tex = useMemoTexture(codeTexture);
	return (
		<group position={position} rotation={[-0.25, rotY, 0]}>
			<mesh position={[0, 0, -0.015]}>
				<boxGeometry args={[0.62, 0.78, 0.03]} />
				<meshStandardMaterial color="#111111" roughness={0.35} metalness={0.5} />
			</mesh>
			<mesh position={[0, 0, 0]}>
				<planeGeometry args={[0.56, 0.72]} />
				<meshBasicMaterial map={tex} />
			</mesh>
		</group>
	);
};

/** Green banknotes — mode 'burst' flies out of the red car, 'rain' falls from the sky. */
export const Banknotes: React.FC<{
	mode: 'burst' | 'rain';
	frame: number;
	origin?: [number, number, number];
	count?: number;
}> = ({mode, frame, origin = [2.5, 1.2, -10], count = 48}) => {
	const tex = useMemoTexture(banknoteTexture);
	const mesh = React.useMemo(() => {
		const geo = new THREE.PlaneGeometry(0.42, 0.21);
		const mat = new THREE.MeshBasicMaterial({map: tex, side: THREE.DoubleSide});
		const m = new THREE.InstancedMesh(geo, mat, count);
		const dummy = new THREE.Object3D();
		const rnd = mulberry32(mode === 'burst' ? 77 : 78);
		const seeds: {a: number; b: number; c: number; d: number}[] = [];
		for (let i = 0; i < count; i++) {
			seeds.push({a: rnd(), b: rnd(), c: rnd(), d: rnd()});
		}
		// store seeds on the mesh for the per-frame update
		(m as unknown as {userData: {seeds: typeof seeds}}).userData = {seeds};
		m.instanceMatrix.needsUpdate = true;
		return m;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode, count]);
	React.useMemo(() => {
		const dummy = new THREE.Object3D();
		const seeds = (mesh as unknown as {userData: {seeds: {a: number; b: number; c: number; d: number}[]}}).userData.seeds;
		for (let i = 0; i < count; i++) {
			const s = seeds[i];
			if (mode === 'burst') {
				// notes fly out of the car and flutter down over ~2.5 s (75 frames)
				const t = Math.min(1, (frame % 75) / 75);
				const dir = s.a * Math.PI * 2;
				const dist = 0.5 + t * (1.5 + s.b * 3);
				dummy.position.set(
					origin[0] + Math.cos(dir) * dist,
					Math.max(0.15, origin[1] + t * 1.2 - t * t * 2.2 + Math.sin(frame * 0.3 + s.c * 9) * 0.15),
					origin[2] + Math.sin(dir) * dist - t * 2,
				);
				dummy.rotation.set(frame * 0.05 + s.c * 6, s.d * Math.PI * 2 + frame * 0.03, Math.sin(frame * 0.2 + i) * 0.6);
			} else {
				// rain: notes fall from the sky in a loop, swaying and spinning
				const fall = ((frame * 0.09 + s.a * 9) % 9) / 9;
				dummy.position.set(
					origin[0] + (s.b - 0.5) * 10 + Math.sin(frame * 0.12 + s.c * 8) * 0.7,
					9 - fall * 9,
					origin[2] + (s.d - 0.5) * 8,
				);
				dummy.rotation.set(fall * 6 + s.a * 3, s.b * Math.PI * 2 + frame * 0.04, Math.sin(frame * 0.15 + i * 1.7) * 0.5);
			}
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	}, [mesh, frame, mode, count, origin]);
	return <primitive object={mesh} />;
};

/** The camera pole transformed into a JACKPOT machine (navy diagram mode). */
export const JackpotMachine: React.FC = () => {
	const label = useMemoTexture(() =>
		textTexture({
			bg: '#FFD400',
			lines: [{text: 'JACKPOT $$$', size: 52, color: '#7A0C0C', y: 128}],
			w: 512,
			h: 256,
		}),
	);
	const bulbs = React.useMemo(() => {
		const arr: {x: number; y: number}[] = [];
		for (let i = 0; i < 14; i++) {
			const a = (i / 14) * Math.PI * 2;
			arr.push({x: Math.cos(a) * 1.15, y: 6.3 + Math.sin(a) * 1.05});
		}
		return arr;
	}, []);
	return (
		<group position={[-6.5, 0, -8]}>
			{/* glowing bulb ring around the box */}
			{bulbs.map((b, i) => (
				<mesh key={i} position={[b.x, b.y, 0.55]}>
					<sphereGeometry args={[0.09, 10, 8]} />
					<meshStandardMaterial color="#FFE082" emissive="#FFC107" emissiveIntensity={2.5} />
				</mesh>
			))}
			{/* JACKPOT $$$ label on the box front */}
			<mesh position={[0, 6.3, 0.48]}>
				<planeGeometry args={[1.25, 0.62]} />
				<meshBasicMaterial map={label} />
			</mesh>
		</group>
	);
};

/** Transparent lottery drum, gold frame, full of cash, JACKPOT sign above (navy mode). */
export const LotteryDrum: React.FC<{position: [number, number, number]}> = ({position}) => {
	const sign = useMemoTexture(() =>
		textTexture({
			bg: '#7A0C0C',
			lines: [{text: 'JACKPOT', size: 72, color: '#FFD54F', y: 130}],
			w: 512,
			h: 256,
		}),
	);
	const cash = React.useMemo(() => {
		const rnd = mulberry32(31);
		const arr: {x: number; y: number; z: number; r: number}[] = [];
		for (let i = 0; i < 26; i++) {
			arr.push({
				x: (rnd() - 0.5) * 1.5,
				y: 0.3 + rnd() * 1.1,
				z: (rnd() - 0.5) * 1.5,
				r: rnd() * Math.PI,
			});
		}
		return arr;
	}, []);
	return (
		<group position={position}>
			{/* grass disc under the drum */}
			<mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
				<circleGeometry args={[3.4, 32]} />
				<meshStandardMaterial color="#2E7D32" roughness={0.95} />
			</mesh>
			{/* JACKPOT sign above */}
			<mesh position={[0, 4.6, 0]}>
				<boxGeometry args={[3.6, 1.2, 0.15]} />
				<meshStandardMaterial color="#7A0C0C" roughness={0.5} />
			</mesh>
			<mesh position={[0, 4.6, 0.09]}>
				<planeGeometry args={[3.4, 1.05]} />
				<meshBasicMaterial map={sign} />
			</mesh>
			{/* gold frame: base + top ring + posts */}
			<mesh position={[0, 0.25, 0]}>
				<cylinderGeometry args={[1.35, 1.5, 0.5, 24]} />
				<meshStandardMaterial color="#C9A227" metalness={0.9} roughness={0.3} />
			</mesh>
			<mesh position={[0, 2.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
				<torusGeometry args={[1.05, 0.09, 10, 32]} />
				<meshStandardMaterial color="#C9A227" metalness={0.9} roughness={0.3} />
			</mesh>
			{/* glass cylinder */}
			<mesh position={[0, 1.45, 0]}>
				<cylinderGeometry args={[1.05, 1.05, 1.9, 24, 1, true]} />
				<meshPhysicalMaterial color="#BFE3F7" transparent opacity={0.28} roughness={0.05} side={THREE.DoubleSide} />
			</mesh>
			{/* cash inside the drum */}
			{cash.map((c, i) => (
				<mesh key={i} position={[c.x, c.y, c.z]} rotation={[0, c.r, 0]}>
					<boxGeometry args={[0.42, 0.06, 0.21]} />
					<meshStandardMaterial color="#2E7D32" roughness={0.7} />
				</mesh>
			))}
			{/* yellow light streaks */}
			{[-1.6, -0.8, 0.8, 1.6].map((x) => (
				<mesh key={x} position={[x, 1.6, -0.6]} rotation={[0, 0, 0.2]}>
					<planeGeometry args={[0.1, 3.4]} />
					<meshBasicMaterial color="#FFEB3B" transparent opacity={0.5} />
				</mesh>
			))}
		</group>
	);
};

/** Green overhead highway sign on a gantry. */
export const OverheadSign: React.FC<{position: [number, number, number]}> = ({position}) => {
	const tex = useMemoTexture(overheadTexture);
	return (
		<group position={position}>
			<mesh position={[-6.4, 3.2, 0]}>
				<boxGeometry args={[0.25, 6.4, 0.25]} />
				<meshStandardMaterial color="#616161" metalness={0.6} roughness={0.5} />
			</mesh>
			<mesh position={[6.4, 3.2, 0]}>
				<boxGeometry args={[0.25, 6.4, 0.25]} />
				<meshStandardMaterial color="#616161" metalness={0.6} roughness={0.5} />
			</mesh>
			<mesh position={[0, 6.3, 0]}>
				<boxGeometry args={[13.2, 0.35, 0.35]} />
				<meshStandardMaterial color="#616161" metalness={0.6} roughness={0.5} />
			</mesh>
			<mesh position={[0, 5.3, 0]}>
				<boxGeometry args={[3.4, 1.7, 0.12]} />
				<meshStandardMaterial color="#1B7A2E" roughness={0.5} />
			</mesh>
			<mesh position={[0, 5.3, 0.07]}>
				<planeGeometry args={[3.2, 1.55]} />
				<meshBasicMaterial map={tex} />
			</mesh>
		</group>
	);
};

/** Big yellow "?" bubble floating above the confused driver's car. */
export const QuestionBubble: React.FC<{position: [number, number, number]; frame: number}> = ({
	position,
	frame,
}) => {
	const tex = useMemoTexture(() =>
		textTexture({
			lines: [{text: '?', size: 220, color: '#111111', y: 190}],
			w: 256,
			h: 256,
		}),
	);
	const bobY = Math.sin(frame * 0.12) * 0.12;
	return (
		<group position={[position[0], position[1] + bobY, position[2]]}>
			<mesh>
				<circleGeometry args={[0.85, 32]} />
				<meshBasicMaterial color="#FFD400" />
			</mesh>
			<mesh position={[0, 0, 0.01]}>
				<circleGeometry args={[0.78, 32]} />
				<meshBasicMaterial color="#FFD400" />
			</mesh>
			<mesh position={[0, 0.05, 0.02]}>
				<planeGeometry args={[0.9, 0.9]} />
				<meshBasicMaterial map={tex} transparent />
			</mesh>
			{/* little tail pointing down at the car */}
			<mesh position={[0, -0.95, 0]} rotation={[0, 0, Math.PI]}>
				<coneGeometry args={[0.18, 0.4, 3]} />
				<meshBasicMaterial color="#FFD400" />
			</mesh>
		</group>
	);
};

/** White picket fence along the suburban lawn. */
export const PicketFence: React.FC<{position: [number, number, number]; length?: number}> = ({
	position,
	length = 10,
}) => {
	const pickets = React.useMemo(() => {
		const arr: number[] = [];
		for (let x = -length / 2; x <= length / 2; x += 0.55) arr.push(x);
		return arr;
	}, [length]);
	return (
		<group position={position}>
			{pickets.map((x) => (
				<mesh key={x} position={[x, 0.55, 0]}>
					<boxGeometry args={[0.14, 1.1, 0.06]} />
					<meshStandardMaterial color="#FAFAFA" roughness={0.8} />
				</mesh>
			))}
			<mesh position={[0, 0.85, 0]}>
				<boxGeometry args={[length, 0.08, 0.05]} />
				<meshStandardMaterial color="#FAFAFA" roughness={0.8} />
			</mesh>
			<mesh position={[0, 0.35, 0]}>
				<boxGeometry args={[length, 0.08, 0.05]} />
				<meshStandardMaterial color="#FAFAFA" roughness={0.8} />
			</mesh>
		</group>
	);
};

/** Living room set: wooden floor, grey sofa, wall TV showing a football field. */
export const LivingRoom: React.FC = () => {
	const tv = useMemoTexture(tvTexture);
	return (
		<group position={[0, 0, 62]}>
			{/* wooden floor */}
			<mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[16, 12]} />
				<meshStandardMaterial color="#8D6E63" roughness={0.8} />
			</mesh>
			{/* floor plank lines */}
			{[-4, -2, 0, 2, 4].map((x) => (
				<mesh key={x} position={[x, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
					<planeGeometry args={[0.06, 12]} />
					<meshBasicMaterial color="#6D4C41" />
				</mesh>
			))}
			{/* back wall */}
			<mesh position={[0, 2.2, -5]}>
				<planeGeometry args={[16, 4.4]} />
				<meshStandardMaterial color="#EFEBE9" roughness={0.9} />
			</mesh>
			{/* side walls */}
			<mesh position={[-8, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}>
				<planeGeometry args={[12, 4.4]} />
				<meshStandardMaterial color="#E8E0D8" roughness={0.9} />
			</mesh>
			<mesh position={[8, 2.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
				<planeGeometry args={[12, 4.4]} />
				<meshStandardMaterial color="#E8E0D8" roughness={0.9} />
			</mesh>
			{/* grey sofa: base + back + arms + cushions */}
			<group position={[0, 0, -3.5]}>
				<mesh position={[0, 0.45, 0]}>
					<boxGeometry args={[3.6, 0.6, 1.5]} />
					<meshStandardMaterial color="#78909C" roughness={0.9} />
				</mesh>
				<mesh position={[0, 0.875, -0.65]}>
					<boxGeometry args={[3.6, 0.55, 0.4]} />
					<meshStandardMaterial color="#607D8B" roughness={0.9} />
				</mesh>
				<mesh position={[-1.7, 0.85, 0]}>
					<boxGeometry args={[0.3, 0.8, 1.5]} />
					<meshStandardMaterial color="#607D8B" roughness={0.9} />
				</mesh>
				<mesh position={[1.7, 0.85, 0]}>
					<boxGeometry args={[0.3, 0.8, 1.5]} />
					<meshStandardMaterial color="#607D8B" roughness={0.9} />
				</mesh>
				{[-1.1, 0, 1.1].map((x) => (
					<mesh key={x} position={[x, 0.85, 0.1]}>
						<boxGeometry args={[1.0, 0.25, 1.2]} />
						<meshStandardMaterial color="#90A4AE" roughness={0.9} />
					</mesh>
				))}
			</group>
			{/* wall TV showing a football field */}
			<mesh position={[0, 2.4, -4.9]}>
				<boxGeometry args={[3.6, 2.0, 0.12]} />
				<meshStandardMaterial color="#111111" roughness={0.4} />
			</mesh>
			<mesh position={[0, 2.4, -4.82]}>
				<planeGeometry args={[3.4, 1.8]} />
				<meshBasicMaterial map={tv} />
			</mesh>
			{/* rug */}
			<mesh position={[0, 0.04, 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[5, 3]} />
				<meshStandardMaterial color="#B71C1C" roughness={0.95} />
			</mesh>
		</group>
	);
};
