import React from 'react';
import * as THREE from 'three';

/**
 * A detailed sedan, built facing +Z (front at +Z).
 * Glossy metallic paint, chrome trim, glowing headlights, brake lights,
 * glass windscreen, tread tyres, silver hubcaps, mirrors, door handles,
 * licence plate. Soft blob shadow underneath.
 */
export const CarBody: React.FC<{
	color: string;
	brake: boolean;
	wheelSpin: number;
}> = ({color, brake, wheelSpin}) => {
	const paint = React.useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color,
				metalness: 0.65,
				roughness: 0.28,
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
				<mesh material={hub} position={[0, 0.13, 0]}>
					<cylinderGeometry args={[0.2, 0.2, 0.02, 20]} />
				</mesh>
				<mesh material={hub} position={[0, -0.13, 0]}>
					<cylinderGeometry args={[0.2, 0.2, 0.02, 20]} />
				</mesh>
			</group>
		</group>
	);

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
			{/* chrome bumpers */}
			<mesh material={chrome} position={[0, 0.42, 2.24]}>
				<boxGeometry args={[1.92, 0.16, 0.1]} />
			</mesh>
			<mesh material={chrome} position={[0, 0.42, -2.24]}>
				<boxGeometry args={[1.92, 0.16, 0.1]} />
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
