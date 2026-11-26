import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {
	asphaltTexture,
	grassTexture,
	mulberry32,
	skyGradientTexture,
	slowPaintTexture,
	textTexture,
	towerTexture,
} from './textures';

const SKY = '#2F7FD0';

function useMemoTexture(fn: () => THREE.CanvasTexture) {
	// eslint-disable-next-line react-hooks/exhaustive-deps
	return React.useMemo(fn, []);
}

/** Individual grass blades (instanced) along both verges. */
function GrassBlades() {
	const mesh = React.useMemo(() => {
		const geo = new THREE.ConeGeometry(0.035, 0.3, 3);
		geo.translate(0, 0.15, 0);
		geo.scale(1, 1, 0.35);
		const mat = new THREE.MeshStandardMaterial({roughness: 0.9});
		const count = 2200;
		const m = new THREE.InstancedMesh(geo, mat, count);
		const dummy = new THREE.Object3D();
		const rnd = mulberry32(42);
		const greens = [new THREE.Color('#4CAF50'), new THREE.Color('#2E7D32'), new THREE.Color('#7BC47F')];
		for (let i = 0; i < count; i++) {
			const side = rnd() > 0.5 ? 1 : -1;
			const x = side * (8.2 + rnd() * 15);
			const z = -95 + rnd() * 115;
			dummy.position.set(x, 0, z);
			dummy.rotation.set((rnd() - 0.5) * 0.5, rnd() * Math.PI, (rnd() - 0.5) * 0.5);
			const s = 0.5 + rnd() * 0.6;
			dummy.scale.set(s, s * (0.8 + rnd() * 0.7), s);
			dummy.updateMatrix();
			m.setMatrixAt(i, dummy.matrix);
			m.setColorAt(i, greens[Math.floor(rnd() * greens.length)]);
		}
		m.instanceMatrix.needsUpdate = true;
		if (m.instanceColor) m.instanceColor.needsUpdate = true;
		return m;
	}, []);
	return <primitive object={mesh} />;
}

/** Individual ballast stones (instanced) along the road edges. */
function Stones() {
	const mesh = React.useMemo(() => {
		const geo = new THREE.DodecahedronGeometry(0.13, 0);
		const mat = new THREE.MeshStandardMaterial({roughness: 0.95});
		const count = 1400;
		const m = new THREE.InstancedMesh(geo, mat, count);
		const dummy = new THREE.Object3D();
		const rnd = mulberry32(123);
		const greys = [
			new THREE.Color('#8A8D91'),
			new THREE.Color('#6E7174'),
			new THREE.Color('#A9ACAF'),
			new THREE.Color('#7C7F82'),
		];
		for (let i = 0; i < count; i++) {
			const side = rnd() > 0.5 ? 1 : -1;
			const x = side * (7.3 + rnd() * 1.6);
			const z = -95 + rnd() * 115;
			dummy.position.set(x, 0.05, z);
			dummy.rotation.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI);
			const s = 0.4 + rnd() * 0.45;
			dummy.scale.set(s, s * 0.7, s);
			dummy.updateMatrix();
			m.setMatrixAt(i, dummy.matrix);
			m.setColorAt(i, greys[Math.floor(rnd() * greys.length)]);
		}
		m.instanceMatrix.needsUpdate = true;
		if (m.instanceColor) m.instanceColor.needsUpdate = true;
		return m;
	}, []);
	return <primitive object={mesh} />;
}

function Tree({position, scale = 1}: {position: [number, number, number]; scale?: number}) {
	return (
		<group position={position} scale={[scale, scale, scale]}>
			<mesh position={[0, 1.1, 0]}>
				<cylinderGeometry args={[0.18, 0.26, 2.2, 8]} />
				<meshStandardMaterial color="#6D4C41" roughness={0.9} />
			</mesh>
			<mesh position={[0, 2.9, 0]}>
				<sphereGeometry args={[1.35, 12, 10]} />
				<meshStandardMaterial color="#2F7D32" roughness={0.85} />
			</mesh>
			<mesh position={[0.55, 2.3, 0.3]}>
				<sphereGeometry args={[0.9, 12, 10]} />
				<meshStandardMaterial color="#7BC47F" roughness={0.85} />
			</mesh>
			<mesh position={[-0.5, 2.4, -0.25]}>
				<sphereGeometry args={[0.8, 12, 10]} />
				<meshStandardMaterial color="#2F7D32" roughness={0.85} />
			</mesh>
		</group>
	);
}

function Trees() {
	const spots = React.useMemo(() => {
		const rnd = mulberry32(555);
		const arr: {pos: [number, number, number]; s: number}[] = [];
		for (let i = 0; i < 16; i++) {
			const side = i % 2 === 0 ? 1 : -1;
			arr.push({
				pos: [side * (13 + rnd() * 15), 0, -88 + rnd() * 100],
				s: 0.8 + rnd() * 1.1,
			});
		}
		return arr;
	}, []);
	return (
		<>
			{spots.map((t, i) => (
				<Tree key={i} position={t.pos} scale={t.s} />
			))}
		</>
	);
}

function TelegraphPoles() {
	const poles = React.useMemo(() => {
		const arr: number[] = [];
		for (let z = -60; z <= 24; z += 12) arr.push(z);
		return arr;
	}, []);
	const wirePts = React.useMemo(() => {
		const pts: number[] = [];
		for (let i = 0; i < poles.length - 1; i++) {
			const z0 = poles[i];
			const z1 = poles[i + 1];
			// two wires, slight sag
			for (const dx of [-0.9, 0.9]) {
				pts.push(-8.5 + dx, 6.6, z0, -8.5 + dx, 6.3, (z0 + z1) / 2, -8.5 + dx, 6.6, z1);
			}
		}
		return new Float32Array(pts);
	}, [poles]);
	return (
		<group>
			{poles.map((z) => (
				<group key={z} position={[-8.5, 0, z]}>
					<mesh position={[0, 3.5, 0]}>
						<cylinderGeometry args={[0.11, 0.14, 7, 8]} />
						<meshStandardMaterial color="#5D4037" roughness={0.9} />
					</mesh>
					<mesh position={[0, 6.6, 0]}>
						<boxGeometry args={[2.2, 0.12, 0.12]} />
						<meshStandardMaterial color="#5D4037" roughness={0.9} />
					</mesh>
				</group>
			))}
			<lineSegments>
				<bufferGeometry>
					<bufferAttribute attach="attributes-position" args={[wirePts, 3]} />
				</bufferGeometry>
				<lineBasicMaterial color="#1A1A1A" />
			</lineSegments>
		</group>
	);
}

function Houses() {
	const spots: {pos: [number, number, number]; rotY: number}[] = [
		{pos: [-20, 0, -30], rotY: 0.4},
		{pos: [22, 0, -42], rotY: -0.3},
		{pos: [-26, 0, -58], rotY: 0.2},
		{pos: [26, 0, -66], rotY: 0.5},
		{pos: [-19, 0, -74], rotY: -0.2},
	];
	return (
		<>
			{spots.map((h, i) => (
				<group key={i} position={h.pos} rotation={[0, h.rotY, 0]}>
					<mesh position={[0, 1.6, 0]}>
						<boxGeometry args={[6, 3.2, 5]} />
						<meshStandardMaterial color="#FAFAFA" roughness={0.85} />
					</mesh>
					<mesh position={[0, 3.9, 0]} rotation={[0, Math.PI / 4, 0]}>
						<coneGeometry args={[4.4, 2.2, 4]} />
						<meshStandardMaterial color="#8D3B2F" roughness={0.85} />
					</mesh>
					<mesh position={[0, 1.1, 2.52]}>
						<boxGeometry args={[1.1, 2.1, 0.1]} />
						<meshStandardMaterial color="#6D4C41" roughness={0.85} />
					</mesh>
				</group>
			))}
		</>
	);
}

function Skyline() {
	const towerTex = useMemoTexture(towerTexture);
	const towers = React.useMemo(() => {
		const rnd = mulberry32(777);
		const arr: {x: number; h: number; w: number}[] = [];
		for (let i = 0; i < 8; i++) {
			arr.push({x: -48 + i * 14 + rnd() * 4, h: 10 + rnd() * 14, w: 5 + rnd() * 3});
		}
		return arr;
	}, []);
	return (
		<>
			{towers.map((t, i) => (
				<mesh key={i} position={[t.x, t.h / 2, -115]}>
					<boxGeometry args={[t.w, t.h, 6]} />
					<meshStandardMaterial map={towerTex} roughness={0.9} />
				</mesh>
			))}
		</>
	);
}

function Clouds({frame}: {frame: number}) {
	const clouds: {x: number; y: number; z: number; s: number}[] = [
		{x: -30, y: 32, z: -90, s: 1.4},
		{x: 10, y: 38, z: -110, s: 1.8},
		{x: 40, y: 28, z: -80, s: 1.1},
		{x: -55, y: 36, z: -100, s: 1.5},
		{x: 55, y: 34, z: -105, s: 1.3},
		{x: -8, y: 42, z: -120, s: 2.0},
	];
	return (
		<>
			{clouds.map((c, i) => (
				<group key={i} position={[c.x + frame * 0.008, c.y, c.z]} scale={[c.s, c.s * 0.32, c.s]}>
					<mesh>
						<sphereGeometry args={[6, 12, 10]} />
						<meshBasicMaterial color="#FFFFFF" transparent opacity={0.72} fog={false} />
					</mesh>
				</group>
			))}
		</>
	);
}

/** The yellow speed-camera pole (shot 1 + 5 hero object). */
function CameraPole({displayText = '27 MPH'}: {displayText?: string}) {
	const display = useMemoTexture(() =>
		textTexture({
			bg: '#0A2A12',
			lines: [
				{
					text: displayText,
					size: displayText === '27 MPH' ? 110 : 62,
					color: '#22C55E',
					y: 140,
				},
			],
			w: 512,
			h: 256,
		}),
	);
	return (
		<group position={[-6.5, 0, -8]}>
			<mesh position={[0, 3, 0]}>
				<cylinderGeometry args={[0.14, 0.18, 6, 10]} />
				<meshStandardMaterial color="#9AA0A6" roughness={0.5} metalness={0.6} />
			</mesh>
			{/* yellow box with a darker edge rim behind it */}
			<mesh position={[0, 6.3, 0]}>
				<boxGeometry args={[1.36, 1.76, 0.86]} />
				<meshStandardMaterial color="#E6A800" roughness={0.4} />
			</mesh>
			<mesh position={[0, 6.3, 0]}>
				<boxGeometry args={[1.3, 1.7, 0.9]} />
				<meshStandardMaterial color="#FFD400" roughness={0.3} metalness={0.25} />
			</mesh>
			{/* black camera head + red ring lens */}
			<mesh position={[0, 7.45, 0]}>
				<boxGeometry args={[0.7, 0.55, 0.7]} />
				<meshStandardMaterial color="#1A1A1A" roughness={0.4} />
			</mesh>
			<mesh position={[0, 7.45, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
				<torusGeometry args={[0.16, 0.045, 10, 24]} />
				<meshStandardMaterial color="#E53935" emissive="#E53935" emissiveIntensity={0.8} />
			</mesh>
			{/* green speed display */}
			<mesh position={[0, 5.6, 0.48]}>
				<planeGeometry args={[1.05, 0.52]} />
				<meshBasicMaterial map={display} />
			</mesh>
		</group>
	);
}

/** Roadside fine sign — flips $150 -> $300. */
function FineSign({flip}: {flip: boolean}) {
	const tex150 = useMemoTexture(() =>
		textTexture({
			bg: '#FFFFFF',
			lines: [
				{text: 'SPEEDING FINE', size: 64, color: '#111111', y: 90},
				{text: '$150', size: 150, color: '#111111', y: 240},
			],
		}),
	);
	const tex300 = useMemoTexture(() =>
		textTexture({
			bg: '#FFFFFF',
			lines: [
				{text: 'SPEEDING FINE', size: 64, color: '#111111', y: 90},
				{text: '$300', size: 150, color: '#E65100', y: 240},
			],
		}),
	);
	return (
		<group position={[14, 0, -2]} rotation={[0, -0.25, 0]}>
			{/* pole stands BEHIND the board so it never crosses the text */}
			<mesh position={[0, 1.5, -0.22]}>
				<cylinderGeometry args={[0.09, 0.11, 3, 8]} />
				<meshStandardMaterial color="#9AA0A6" roughness={0.5} metalness={0.6} />
			</mesh>
			<mesh position={[0, 3.4, 0]}>
				<boxGeometry args={[2.6, 2.0, 0.12]} />
				<meshStandardMaterial color="#FFFFFF" roughness={0.5} />
			</mesh>
			<mesh position={[0, 3.4, 0.07]}>
				<planeGeometry args={[2.4, 1.8]} />
				<meshBasicMaterial map={flip ? tex300 : tex150} />
			</mesh>
		</group>
	);
}

import {
	Banknotes,
	Check,
	JackpotMachine,
	Ladder,
	LivingRoom,
	LotteryDrum,
	Mailbox,
	OverheadSign,
	PicketFence,
	QuestionBubble,
	Tablet,
} from './props';

export const World: React.FC<{
	frame: number;
	signFlip: boolean;
	showSlow: boolean;
	navy?: boolean;
	room?: boolean;
	poleDisplay?: string;
	showProps?: {
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
	};
}> = ({frame, signFlip, showSlow, navy = false, room = false, poleDisplay = '27 MPH', showProps}) => {
	const skyTex = useMemoTexture(skyGradientTexture);
	const grassTex = useMemoTexture(grassTexture);
	const asphaltTex = useMemoTexture(asphaltTexture);
	const slowTex = useMemoTexture(slowPaintTexture);
	const scene = useThree((s) => s.scene);
	React.useMemo(() => {
		grassTex.repeat.set(10, 10);
		asphaltTex.repeat.set(1, 30);
		// no texture rotation; the mesh itself is spun flat (see SLOW plane)
		slowTex.center.set(0.5, 0.5);
		slowTex.rotation = 0;
		// gradient sky as the scene background: visible in every direction
		// navy diagram mode: dark navy background instead
		scene.background = navy ? new THREE.Color('#0A1030') : room ? new THREE.Color('#E8E0D8') : skyTex;
	}, [grassTex, asphaltTex, slowTex, skyTex, scene, navy, room]);

	const dashes = React.useMemo(() => {
		const arr: number[] = [];
		for (let z = -105; z <= 105; z += 6) arr.push(z);
		return arr;
	}, []);

	// Room mode: only the living room set (shot 25).
	if (room) {
		return (
			<group>
				<hemisphereLight args={['#FFF3E0', '#8D6E63', 1.2]} />
				<directionalLight position={[-6, 8, 8]} intensity={1.4} color="#FFE0B2" />
				<LivingRoom />
			</group>
		);
	}

	// Navy diagram mode (shots 20-21): dark navy space, pole + jackpot only.
	if (navy) {
		return (
			<group>
				<fog attach="fog" args={['#0A1030', 25, 90]} />
				<hemisphereLight args={['#3D5A80', '#0A1030', 1.0]} />
				<directionalLight position={[-8, 14, 8]} intensity={1.6} color="#FFD54F" />
				<directionalLight position={[8, 6, 10]} intensity={0.6} color="#90CAF9" />
				{/* dark ground disc so the pole and drum stand on something */}
				<mesh position={[0, 0, -8]} rotation={[-Math.PI / 2, 0, 0]}>
					<circleGeometry args={[16, 32]} />
					<meshStandardMaterial color="#101B3C" roughness={0.9} />
				</mesh>
				{/* the pole only appears in the jackpot-machine shot (20); the drum shot (21) is pole-free */}
				{showProps?.jackpot && <CameraPole displayText={poleDisplay} />}
				{showProps?.jackpot && <JackpotMachine />}
				{showProps?.drum && <LotteryDrum position={[0, 0, -8]} />}
			</group>
		);
	}

	return (
		<group>
			<fog attach="fog" args={['#B0C4DE', 35, 110]} />
			<hemisphereLight args={['#BFE3F7', '#4CAF50', 1.1]} />
			{/* warm sun (key) + cool sky fill */}
			<directionalLight position={[-12, 18, 10]} intensity={2.0} color="#FFD27A" />
			<directionalLight position={[8, 6, 12]} intensity={0.7} color="#BFE3F7" />

			<Clouds frame={frame} />
			{/* low mist banks for depth (soft, far, never in front of the action) */}
			{[
				{x: -14, y: 2.2, z: -55, w: 30, o: 0.07},
				{x: 12, y: 2.6, z: -75, w: 36, o: 0.06},
				{x: -6, y: 3.0, z: -95, w: 44, o: 0.08},
			].map((m, i) => (
				<mesh key={i} position={[m.x, m.y, m.z]}>
					<planeGeometry args={[m.w, 5]} />
					<meshBasicMaterial color="#FFFFFF" transparent opacity={m.o} fog={false} />
				</mesh>
			))}

			{/* grass ground */}
			<mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[420, 420]} />
				<meshStandardMaterial map={grassTex} roughness={0.95} />
			</mesh>

			{/* highway */}
			<mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[14, 220]} />
				<meshStandardMaterial map={asphaltTex} roughness={0.92} />
			</mesh>
			{/* yellow centre line */}
			<mesh position={[-0.18, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[0.14, 220]} />
				<meshBasicMaterial color="#F2C200" />
			</mesh>
			<mesh position={[0.18, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[0.14, 220]} />
				<meshBasicMaterial color="#F2C200" />
			</mesh>
			{/* white lane dashes */}
			{dashes.map((z) => (
				<group key={z}>
					<mesh position={[-3.5, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
						<planeGeometry args={[0.16, 2.4]} />
						<meshBasicMaterial color="#F5F5F5" />
					</mesh>
					<mesh position={[3.5, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
						<planeGeometry args={[0.16, 2.4]} />
						<meshBasicMaterial color="#F5F5F5" />
					</mesh>
				</group>
			))}
			{/* white edge lines */}
			<mesh position={[-6.6, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[0.14, 220]} />
				<meshBasicMaterial color="#F5F5F5" />
			</mesh>
			<mesh position={[6.6, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[0.14, 220]} />
				<meshBasicMaterial color="#F5F5F5" />
			</mesh>

			{/* giant SLOW! road paint (shot 8) */}
			{showSlow && (
				<mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
					<planeGeometry args={[12, 6]} />
					<meshBasicMaterial map={slowTex} transparent />
				</mesh>
			)}

			<GrassBlades />
			<Stones />
			<Trees />
			<TelegraphPoles />
			<Houses />
			<Skyline />
			<CameraPole displayText={poleDisplay} />
			<FineSign flip={signFlip} />

			{/* suburban set (shots 16-19): mailbox + picket fence on the lawn */}
			{showProps?.mailbox && <Mailbox position={[-13.5, 0, -10.6]} />}
			{showProps?.fence && <PicketFence position={[-13.5, 0, -11.5]} length={11} />}
			{/* overhead green sign gantry (shots 22-23) */}
			{showProps?.overhead && <OverheadSign position={[0, 0, -40]} />}
			{/* inventor's ladder leaning on the pole (shot 12) */}
			{showProps?.ladder && <Ladder position={[-5.0, 0, -6.2]} rotY={-0.25} />}
			{/* inventor's tablet (shot 13) */}
			{showProps?.tablet && (
				<Tablet
					position={[showProps.tablet.x, showProps.tablet.y, showProps.tablet.z]}
					rotY={showProps.tablet.rotY}
				/>
			)}
			{/* the $2,000 check (shot 18) */}
			{showProps?.check && (
				<Check
					position={[showProps.check.x, showProps.check.y, showProps.check.z]}
					rotY={showProps.check.rotY}
				/>
			)}
			{/* banknotes: flying out of the red car (shot 11) / raining (shot 19) */}
			{showProps?.banknotes && (
				<Banknotes
					mode={showProps.banknotes}
					frame={frame}
					origin={showProps.bankOrigin ?? [2.5, 1.2, -10]}
				/>
			)}
			{/* big yellow "?" above the confused driver (shot 15) */}
			{showProps?.question && (
				<QuestionBubble
					position={[showProps.question.x, showProps.question.y, showProps.question.z]}
					frame={frame}
				/>
			)}
		</group>
	);
};
