/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import { Box, OrbitControls } from "@react-three/drei";

import { Canvas } from "@react-three/fiber";

function Preview() {
	return (
		<div className="w-full h-full relative">
			<Canvas>
				<ambientLight intensity={0.5} />

				<Box args={[1, 1, 1]} position={[0, 0, 0]} />

				<OrbitControls enableDamping={false} />
			</Canvas>
		</div>
	);
}

export default Preview;
