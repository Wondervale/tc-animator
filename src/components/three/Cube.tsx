/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import { Box, useTexture } from "@react-three/drei";
import { NearestFilter, Vector3 } from "three";

import { useMemo } from "react";

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

function Cube({
	args = new Vector3(1, 1, 1),
	position = new Vector3(0, 0, 0),
}: {
	args?: Vector3;
	position?: Vector3;
}) {
	// This is a simple cube component that can be used in the scene.
	const originalTexture = useTexture(
		`${import.meta.env.BASE_URL}textures/missing.png`,
	);

	const texture = useMemo(() => {
		const clone = originalTexture.clone();
		clone.magFilter = NearestFilter;
		clone.minFilter = NearestFilter;
		return clone;
	}, [originalTexture]);

	// Assign a pastel color once when component mounts
	const pastelColor = useMemo(() => getUniquePastelColor(), []);

	return (
		<Box args={args.toArray()} position={position} castShadow receiveShadow>
			<meshStandardMaterial map={texture} color={pastelColor} />
		</Box>
	);
}

export default Cube;
