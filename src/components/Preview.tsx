/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import * as THREE from "three";

import { EffectComposer, FXAA } from "@react-three/postprocessing";
import { FpsDisplay, FpsTracker } from "@/components/three/Stats";
import { GizmoHelper, GizmoViewport, Grid, OrbitControls } from "@react-three/drei";

import { Canvas } from "@react-three/fiber";
import CartRender from "@/components/three/CartRender";
import { SSAO } from "@react-three/postprocessing";
import { Suspense } from "react";

function Preview() {
	return (
		<>
			<Canvas
				camera={{ position: [3, 3, 3], fov: 60 }}
				shadows
				dpr={[1, 2]}
				gl={{ powerPreference: "high-performance" }}>
				<ambientLight intensity={2} />
				<directionalLight position={[5, 5, 5]} intensity={3} castShadow />

				<Suspense fallback={null}>
					<CartRender />
				</Suspense>

				<Grid
					position={[0.5, -0.501, 0.5]}
					cellSize={1 / 16}
					sectionSize={1}
					cellThickness={0.5}
					sectionThickness={1.5}
					cellColor="#92a3bb"
					sectionColor="#47566c"
					infiniteGrid
					side={THREE.DoubleSide}
				/>

				{/* <Environment preset="studio" /> */}

				<EffectComposer enableNormalPass>
					<SSAO
						samples={31}
						radius={20}
						intensity={20}
						luminanceInfluence={0.9}
						color={new THREE.Color("black")}
					/>
					<FXAA />
				</EffectComposer>

				<OrbitControls makeDefault enableDamping={false} />
				<GizmoHelper alignment="bottom-right" margin={[80, 80]}>
					<GizmoViewport axisColors={["#9d4b4b", "#2f7f4f", "#3b5b9d"]} labelColor="white" />
				</GizmoHelper>

				<FpsTracker />
			</Canvas>
			<FpsDisplay />
		</>
	);
}

export default Preview;
