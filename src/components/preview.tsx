/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import * as THREE from "three";

import {
	Box,
	Environment,
	GizmoHelper,
	GizmoViewport,
	Grid,
	OrbitControls,
	useGLTF,
	useTexture,
} from "@react-three/drei";
import { EffectComposer, FXAA } from "@react-three/postprocessing";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

// import { SSAO } from "@react-three/postprocessing/ssao";

function Preview() {
	return (
		<div className="w-full h-full relative">
			<Canvas
				camera={{ position: [3, 3, 3], fov: 60 }}
				shadows
				dpr={[1, 2]}
				gl={{ powerPreference: "high-performance" }}>
				<ambientLight intensity={0.5} />
				<directionalLight
					position={[5, 5, 5]}
					intensity={1}
					castShadow
					shadow-mapSize-width={1024}
					shadow-mapSize-height={1024}
					shadow-camera-near={1}
					shadow-camera-far={10}
					shadow-camera-left={-5}
					shadow-camera-right={5}
					shadow-camera-top={5}
					shadow-camera-bottom={-5}
				/>

				<Suspense fallback={null}>
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
				/>

				<Environment preset="city" />

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

function Cube({ args, position }: { args: [number, number, number]; position: [number, number, number] }) {
	// This is a simple cube component that can be used in the scene.

	const originalTexture = useTexture("/textures/missing.png");
	const texture = originalTexture.clone();
	texture.magFilter = THREE.NearestFilter;
	texture.minFilter = THREE.NearestFilter;

	return (
		<Box args={args} position={position} castShadow receiveShadow>
			<meshBasicMaterial map={texture} color="#92a3bb" />
		</Box>
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
