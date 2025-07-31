/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import {
	AccumulativeShadows,
	Box,
	Environment,
	GizmoHelper,
	GizmoViewport,
	Grid,
	OrbitControls,
	RandomizedLight,
} from "@react-three/drei";

import { Canvas } from "@react-three/fiber";
import { memo } from "react";

function Preview() {
	return (
		<div className="w-full h-full relative">
			<Canvas camera={{ position: [2, 2, 2], fov: 60 }} shadows>
				<ambientLight intensity={0.5} />
				<directionalLight position={[5, 5, 5]} intensity={0.5} />

				<Box args={[1, 1, 1]} position={[0, 0, 0]} />

				<Shadows />

				<Grid
					position={[0.5, 0, 0.5]}
					cellSize={1 / 16}
					sectionSize={1}
					cellThickness={0.5}
					sectionThickness={1.5}
					cellColor="#92a3bb"
					sectionColor="#47566c"
					fadeDistance={100}
					followCamera={false}
					infiniteGrid
				/>

				<OrbitControls makeDefault enableDamping={false} />
				<Environment preset="city" />
				<GizmoHelper alignment="bottom-right" margin={[80, 80]}>
					<GizmoViewport axisColors={["#9d4b4b", "#2f7f4f", "#3b5b9d"]} labelColor="white" />
				</GizmoHelper>
			</Canvas>
		</div>
	);
}

const Shadows = memo(() => (
	<AccumulativeShadows temporal frames={100} color="#9d4b4b" colorBlend={0.5} alphaTest={0.9} scale={20}>
		<RandomizedLight amount={8} radius={4} position={[5, 5, -10]} />
	</AccumulativeShadows>
));

export default Preview;
