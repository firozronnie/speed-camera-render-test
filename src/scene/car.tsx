import React from 'react';
import * as THREE from 'three';

/**
 * A detailed sedan, built facing +Z (front at +Z) — wobblytale-grade detail.
 * Glossy clearcoat paint, gold/brass trim, rivets, panel lines, full roof
 * detail (sunroof, roof rails, windshield + rear window shapes), chrome
 * bumpers, grille, glowing headlights, brake lights, glass windscreen,
 * tread tyres, hubcaps with gold rings, mirrors, door handles, plate.
 * Soft blob shadow underneath.
 *
 * Roof layout (top view, +Z = front): bonnet z 1.0..2.1, windshield
 * z 0.75..1.15 (angled glass), roof panel z -1.2..0.75, rear window
 * z -1.2..-1.55 (angled glass), boot z -1.55..-2.2.
 */
export const CarBody: React.FC<{
	color: string;
	brake: boolean;
	wheelSpin: number;
}> = ({color, brake, wheelSpin}) => {
	const paint = React.useMemo(
		() =>
			new THREE.MeshPhysicalMaterial({
				color,
				metalness: 0.72,
				roughness: 0.22,
				clearcoat: 1,
				clearcoatRoughness: 0.12,
			}),
		[color],
	);
	const chrome = React.useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color: '#D9D9D9',
				metalness: 1,
				roughness: 0.15,
			}),
		[],
	);
	const brass = React.useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color: '#C9A227',
				metalness: 1,
				roughness: 0.28,
			}),
		[],
	);
	const glass = React.useMemo(
		() =>
			new THREE.MeshPhysicalMaterial({
				color: '#9FC8E8',
				transparent: true,
				opacity: 0.55,
				roughness: 0.06,
				metalness: 0.1,
			}),
		[],
	);
	const darkGlass = React.useMemo(
		() =>
			new THREE.MeshPhysicalMaterial({
				color: '#1E3A4F',
				roughness: 0.08,
				metalness: 0.3,
				clearcoat: 1,
			}),
		[],
	);
	const tyre = React.useMemo(
		() => new THREE.MeshStandardMaterial({color: '#1C1C1C', roughness: 0.92}),
		[],
	);
	const hub = React.useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color: '#C0C0C0',
				metalness: 0.9,
				roughness: 0.22,
			}),
		[],
	);
	const tread = React.useMemo(
		() => new THREE.MeshStandardMaterial({color: '#4A4A4A', roughness: 0.9}),
		[],
	);
	const panelLine = React.useMemo(
		() => new THREE.MeshStandardMaterial({color: '#000000', roughness: 0.6}),
		[],
	);

	const wheel = (x: number, z: number) => (
		// outer group turns the cylinder axle (local Y) onto the world X axle
		<group key={`${x},${z}`} position={[x, 0.36, z]} rotation={[0, 0, Math.PI / 2]}>
			{/* inner group spins around local Y == the axle */}
			<group rotation={[0, wheelSpin, 0]}>
				<mesh material={tyre}>
					<cylinderGeometry args={[0.36, 0.36, 0.26, 24]} />
				</mesh>
				<mesh material={tread} rotation={[Math.PI / 2, 0, 0]}>
					<torusGeometry args={[0.36, 0.022, 8, 24]} />
				</mesh>
				{/* hubcap with gold ring — reads from the side AND from above */}
				<mesh material={hub} position={[0, 0.13, 0]}>
					<cylinderGeometry args={[0.2, 0.2, 0.02, 20]} />
				</mesh>
				<mesh material={brass} position={[0, 0.145, 0]}>
					<torusGeometry args={[0.14, 0.018, 8, 24]} />
				</mesh>
				<mesh material={hub} position={[0, -0.13, 0]}>
					<cylinderGeometry args={[0.2, 0.2, 0.02, 20]} />
				</mesh>
				<mesh material={brass} position={[0, -0.145, 0]}>
					<torusGeometry args={[0.14, 0.018, 8, 24]} />
				</mesh>
			</group>
		</group>
	);

	// gold rivets along the beltline (both sides) — wobblytale rivet rows
	const rivets: number[] = [];
	for (let z = -1.9; z <= 1.9; z += 0.38) rivets.push(z);

	return (
		<group>
			{/* soft blob shadow (ellipse so it never reads as a dark rectangle) */}
			<mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[2.4, 1.25, 1]}>
				<circleGeometry args={[1, 24]} />
				<meshBasicMaterial color="#000000" transparent opacity={0.22} />
			</mesh>
			{/* main lower body */}
			<mesh material={paint} position={[0, 0.62, 0]}>
				<boxGeometry args={[1.9, 0.52, 4.4]} />
			</mesh>
			{/* shoulder / upper body */}
			<mesh material={paint} position={[0, 0.92, -0.15]}>
				<boxGeometry args={[1.8, 0.28, 3.4]} />
			</mesh>
			{/* bonnet */}
			<mesh material={paint} position={[0, 0.86, 1.55]}>
				<boxGeometry args={[1.82, 0.2, 1.15]} />
			</mesh>
			{/* boot */}
			<mesh material={paint} position={[0, 0.86, -1.75]}>
				<boxGeometry args={[1.82, 0.2, 0.9]} />
			</mesh>
			{/* cabin glass */}
			<mesh material={glass} position={[0, 1.18, -0.25]}>
				<boxGeometry args={[1.62, 0.55, 2.1]} />
			</mesh>
			{/* roof (thicker so the driver clearly sits UNDER it) */}
			<mesh material={paint} position={[0, 1.48, -0.25]}>
				<boxGeometry args={[1.66, 0.14, 2.0]} />
			</mesh>
			{/* ---- ROOF DETAIL (seen from above) ---- */}
			{/* sunroof: dark glass inset in the roof panel */}
			<mesh material={darkGlass} position={[0, 1.555, -0.05]}>
				<boxGeometry args={[1.0, 0.02, 0.85]} />
			</mesh>
			{/* sunroof gold frame */}
			<mesh material={brass} position={[0, 1.552, -0.05]}>
				<boxGeometry args={[1.08, 0.015, 0.93]} />
			</mesh>
			{/* roof rails (front-to-back chrome bars) */}
			<mesh material={chrome} position={[-0.68, 1.58, -0.25]}>
				<boxGeometry args={[0.07, 0.06, 1.9]} />
			</mesh>
			<mesh material={chrome} position={[0.68, 1.58, -0.25]}>
				<boxGeometry args={[0.07, 0.06, 1.9]} />
			</mesh>
			{/* windshield shape on the roof front edge (angled dark glass) */}
			<mesh material={darkGlass} position={[0, 1.42, 0.82]} rotation={[0.5, 0, 0]}>
				<boxGeometry args={[1.5, 0.03, 0.55]} />
			</mesh>
			{/* rear window shape on the roof rear edge */}
			<mesh material={darkGlass} position={[0, 1.42, -1.32]} rotation={[-0.5, 0, 0]}>
				<boxGeometry args={[1.5, 0.03, 0.5]} />
			</mesh>
			{/* gold pinstripe along the roof edge */}
			<mesh material={brass} position={[-0.84, 1.5, -0.25]}>
				<boxGeometry args={[0.03, 0.03, 2.0]} />
			</mesh>
			<mesh material={brass} position={[0.84, 1.5, -0.25]}>
				<boxGeometry args={[0.03, 0.03, 2.0]} />
			</mesh>
			{/* ---- PANEL LINES (thin dark seams) ---- */}
			{/* bonnet seam */}
			<mesh material={panelLine} position={[0, 0.965, 0.98]}>
				<boxGeometry args={[1.7, 0.012, 0.03]} />
			</mesh>
			{/* boot seam */}
			<mesh material={panelLine} position={[0, 0.965, -1.32]}>
				<boxGeometry args={[1.7, 0.012, 0.03]} />
			</mesh>
			{/* door seams (both sides) */}
			<mesh material={panelLine} position={[-0.955, 0.8, 0.1]}>
				<boxGeometry args={[0.012, 0.4, 0.03]} />
			</mesh>
			<mesh material={panelLine} position={[0.955, 0.8, 0.1]}>
				<boxGeometry args={[0.012, 0.4, 0.03]} />
			</mesh>
			{/* gold pinstripe along the body side */}
			<mesh material={brass} position={[-0.96, 0.62, 0]}>
				<boxGeometry args={[0.02, 0.04, 4.0]} />
			</mesh>
			<mesh material={brass} position={[0.96, 0.62, 0]}>
				<boxGeometry args={[0.02, 0.04, 4.0]} />
			</mesh>
			{/* gold rivets along the beltline (both sides) */}
			{rivets.map((z) => (
				<group key={z}>
					<mesh material={brass} position={[-0.96, 0.88, z]}>
						<sphereGeometry args={[0.028, 8, 6]} />
					</mesh>
					<mesh material={brass} position={[0.96, 0.88, z]}>
						<sphereGeometry args={[0.028, 8, 6]} />
					</mesh>
				</group>
			))}
			{/* windscreen shine stripe */}
			<mesh position={[0, 1.22, 0.82]} rotation={[0.12, 0, 0]}>
				<planeGeometry args={[1.5, 0.1]} />
				<meshBasicMaterial color="#FFFFFF" transparent opacity={0.55} />
			</mesh>
			{/* white specular highlight stripe along the body side (fake sky reflection) */}
			<mesh position={[0.96, 0.78, 0]} rotation={[0, Math.PI / 2, 0]}>
				<planeGeometry args={[3.6, 0.12]} />
				<meshBasicMaterial color="#FFFFFF" transparent opacity={0.22} />
			</mesh>
			<mesh position={[-0.96, 0.78, 0]} rotation={[0, -Math.PI / 2, 0]}>
				<planeGeometry args={[3.6, 0.12]} />
				<meshBasicMaterial color="#FFFFFF" transparent opacity={0.22} />
			</mesh>
			{/* chrome bumpers with brass trim */}
			<mesh material={chrome} position={[0, 0.42, 2.24]}>
				<boxGeometry args={[1.92, 0.16, 0.1]} />
			</mesh>
			<mesh material={brass} position={[0, 0.51, 2.24]}>
				<boxGeometry args={[1.92, 0.03, 0.1]} />
			</mesh>
			<mesh material={chrome} position={[0, 0.42, -2.24]}>
				<boxGeometry args={[1.92, 0.16, 0.1]} />
			</mesh>
			<mesh material={brass} position={[0, 0.51, -2.24]}>
				<boxGeometry args={[1.92, 0.03, 0.1]} />
			</mesh>
			{/* chrome window trim */}
			<mesh material={chrome} position={[0, 1.47, -0.25]}>
				<boxGeometry args={[1.68, 0.03, 2.02]} />
			</mesh>
			{/* grille */}
			<mesh position={[0, 0.55, 2.21]}>
				<boxGeometry args={[1.1, 0.18, 0.04]} />
				<meshStandardMaterial color="#222222" roughness={0.6} metalness={0.4} />
			</mesh>
			{/* grille gold bars */}
			<mesh material={brass} position={[0, 0.55, 2.24]}>
				<boxGeometry args={[1.0, 0.03, 0.02]} />
			</mesh>
			{/* headlights (glow) */}
			<mesh position={[-0.62, 0.72, 2.21]}>
				<boxGeometry args={[0.42, 0.16, 0.06]} />
				<meshStandardMaterial
					color="#FFF6C9"
					emissive="#FFF6C9"
					emissiveIntensity={2.2}
				/>
			</mesh>
			<mesh position={[0.62, 0.72, 2.21]}>
				<boxGeometry args={[0.42, 0.16, 0.06]} />
				<meshStandardMaterial
					color="#FFF6C9"
					emissive="#FFF6C9"
					emissiveIntensity={2.2}
				/>
			</mesh>
			{/* brake lights */}
			<mesh position={[-0.62, 0.78, -2.21]}>
				<boxGeometry args={[0.42, 0.14, 0.06]} />
				<meshStandardMaterial
					color="#FF2020"
					emissive="#FF2020"
					emissiveIntensity={brake ? 3.5 : 0.35}
				/>
			</mesh>
			<mesh position={[0.62, 0.78, -2.21]}>
				<boxGeometry args={[0.42, 0.14, 0.06]} />
				<meshStandardMaterial
					color="#FF2020"
					emissive="#FF2020"
					emissiveIntensity={brake ? 3.5 : 0.35}
				/>
			</mesh>
			{/* mirrors */}
			<mesh material={chrome} position={[-1.0, 1.05, 0.75]}>
				<boxGeometry args={[0.1, 0.14, 0.22]} />
			</mesh>
			<mesh material={chrome} position={[1.0, 1.05, 0.75]}>
				<boxGeometry args={[0.1, 0.14, 0.22]} />
			</mesh>
			{/* door handles */}
			<mesh material={chrome} position={[-0.96, 0.95, 0.45]}>
				<boxGeometry args={[0.03, 0.05, 0.28]} />
			</mesh>
			<mesh material={chrome} position={[0.96, 0.95, 0.45]}>
				<boxGeometry args={[0.03, 0.05, 0.28]} />
			</mesh>
			<mesh material={chrome} position={[-0.96, 0.95, -0.75]}>
				<boxGeometry args={[0.03, 0.05, 0.28]} />
			</mesh>
			<mesh material={chrome} position={[0.96, 0.95, -0.75]}>
				<boxGeometry args={[0.03, 0.05, 0.28]} />
			</mesh>
			{/* licence plate */}
			<mesh position={[0, 0.42, 2.29]}>
				<boxGeometry args={[0.62, 0.16, 0.02]} />
				<meshStandardMaterial color="#F5F5F5" roughness={0.4} />
			</mesh>
			{/* wheels */}
			{wheel(-0.95, 1.45)}
			{wheel(0.95, 1.45)}
			{wheel(-0.95, -1.45)}
			{wheel(0.95, -1.45)}
		</group>
	);
};
