/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import { useTexture } from "@react-three/drei";

import { forwardRef, useMemo, type JSX } from "react";
import { Mesh, NearestFilter, Vector3 } from "three";

import missingTexture from "/src/assets/textures/missing.png";

// Keep a global history and color generator (move to separate file if needed)
const colorHistory: string[] = [];
const MAX_HISTORY = 5;

function getRandomPastelColor() {
	const h = Math.floor(Math.random() * 360); // Hue
	const s = 70 + Math.random() * 10; // Saturation
	const l = 80 + Math.random() * 10; // Lightness
	return `hsl(${h}, ${s}%, ${l}%)`;
}

function getUniquePastelColor(): string {
	let color = "";
	let attempts = 0;
	do {
		color = getRandomPastelColor();
		attempts++;
	} while (colorHistory.includes(color) && attempts < 10);

	// Update history
	colorHistory.push(color);
	if (colorHistory.length > MAX_HISTORY) {
		colorHistory.shift();
	}

	return color;
}

const Cube = forwardRef<Mesh, JSX.IntrinsicElements["mesh"]>((props, ref) => {
	// This is a simple cube component that can be used in the scene.
	const originalTexture = useTexture(missingTexture);

	const texture = useMemo(() => {
		const clone = originalTexture.clone();
		clone.magFilter = NearestFilter;
		clone.minFilter = NearestFilter;
		return clone;
	}, [originalTexture]);

	// Assign a pastel color once when component mounts
	const pastelColor = useMemo(() => getUniquePastelColor(), []);

	const origin = new Vector3(0, 0.5, 0); // Center of the cube
	const position =
		props.position instanceof Vector3
			? props.position
			: Array.isArray(props.position)
				? new Vector3(...props.position)
				: new Vector3(0, 0, 0);

	const adjustedPosition = position.clone().add(origin);

	return (
		<mesh
			ref={ref}
			{...props}
			castShadow
			receiveShadow
			position={adjustedPosition} // Shift origin to lower corner
		>
			<boxGeometry args={[1, 1, 1]} />
			<meshStandardMaterial map={texture} color={pastelColor} />
		</mesh>
	);
});

export default Cube;
