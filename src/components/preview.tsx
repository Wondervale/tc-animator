/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import * as THREE from "three";

import { EffectComposer, FXAA } from "@react-three/postprocessing";
import { GizmoHelper, GizmoViewport, Grid, OrbitControls, useGLTF } from "@react-three/drei";

import { Canvas } from "@react-three/fiber";
import Cube from "@/components/three/Cube";
import { Suspense } from "react";

// import { SSAO } from "@react-three/postprocessing";

function Preview() {
	return (
		<div className="w-full h-full relative">
			<Canvas
				camera={{ position: [3, 3, 3], fov: 60 }}
				shadows
				dpr={[1, 2]}
				gl={{ powerPreference: "high-performance" }}>
				<ambientLight intensity={2} />
				<directionalLight position={[5, 5, 5]} intensity={3} castShadow />

				<Suspense fallback={null}>
					{Array.from({ length: 100 }, (_, i) => (
						<Cube
							key={i}
							args={[1, 1, 1]}
							position={[Math.random() * 20 - 10, Math.random() * 2 + 0.5, Math.random() * 20 - 10]}
						/>
					))}

					{/* Add a single cube at the center */}
					<Cube args={[1, 1, 1]} position={[0, 0.5, 0]} />

					<Dummy scale={1} position={[0, 0.5, 0]} />
				</Suspense>

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
					castShadow={false}
					receiveShadow={false}
					side={THREE.DoubleSide}
				/>

				{/* <Environment preset="studio" /> */}

				<EffectComposer enableNormalPass>
					{/* <SSAO
						samples={31}
						radius={20}
						intensity={20}
						luminanceInfluence={0.9}
						color={new THREE.Color("black")}
					/> */}
					<FXAA />
				</EffectComposer>

				<OrbitControls makeDefault enableDamping={false} />
				<GizmoHelper alignment="bottom-right" margin={[80, 80]}>
					<GizmoViewport axisColors={["#9d4b4b", "#2f7f4f", "#3b5b9d"]} labelColor="white" />
				</GizmoHelper>
			</Canvas>
		</div>
	);
}

function Dummy({ scale = 0.01, position = [0, 0, 0] }: { scale?: number; position?: [number, number, number] }) {
	const dummyModel = useGLTF("/models/dummy.glb");

	return (
		<primitive
			object={dummyModel.scene}
			scale={scale}
			position={position}
			castShadow
			receiveShadow
			dispose={null}
		/>
	);
}

export default Preview;
