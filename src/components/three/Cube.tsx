/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import * as THREE from "three";

import { Box, useTexture } from "@react-three/drei";

import { useMemo } from "react";

// Keep a global history and color generator (move to separate file if needed)
const colorHistory: string[] = [];
const MAX_HISTORY = 5;

function getRandomPastelColor() {
	const h = Math.floor(Math.random() * 360); // Hue
	const s = 70 + Math.random() * 10; // Saturation
	const l = 85 + Math.random() * 10; // Lightness
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

function Cube({ args, position }: { args: [number, number, number]; position: [number, number, number] }) {
	// This is a simple cube component that can be used in the scene.
	const originalTexture = useTexture("/textures/missing.png");

	const texture = useMemo(() => {
		const clone = originalTexture.clone();
		clone.magFilter = THREE.NearestFilter;
		clone.minFilter = THREE.NearestFilter;
		return clone;
	}, [originalTexture]);

	// Assign a pastel color once when component mounts
	const pastelColor = useMemo(() => getUniquePastelColor(), []);

	return (
		<Box args={args} position={position} castShadow receiveShadow>
			<meshBasicMaterial map={texture} color={pastelColor} />
		</Box>
	);
}

export default Cube;
