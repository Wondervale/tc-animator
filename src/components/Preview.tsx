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
import { useEffect, useRef } from "react";

import { Canvas } from "@react-three/fiber";
import CartRender from "@/components/three/CartRender";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { SSAO } from "@react-three/postprocessing";
import { Suspense } from "react";
import { usePreferences } from "@/stores/PreferencesStore";
import { useProjectStore } from "@/stores/ProjectStore";

function Preview() {
	const preferences = usePreferences();

	const controlsRef = useRef<OrbitControlsImpl>(null);
	const projectStore = useProjectStore();

	// Restore controls state on mount
	useEffect(() => {
		const controls = controlsRef.current;
		const meta = projectStore.metadata.orbitControls;
		if (controls && meta) {
			controls.object.position.set(...meta.position);
			controls.target.set(...meta.target);
			if (meta.zoom && controls.object.zoom !== undefined) {
				controls.object.zoom = meta.zoom;
				controls.object.updateProjectionMatrix();
			}
			controls.update();
		}
	}, [projectStore.metadata.orbitControls]);

	// Save controls state on change
	useEffect(() => {
		const controls = controlsRef.current;
		if (!controls) return;
		const handleChange = () => {
			projectStore.setProjectName(projectStore.metadata.projectName); // trigger update
			projectStore.setMetadata({
				...projectStore.metadata,
				orbitControls: {
					position: [controls.object.position.x, controls.object.position.y, controls.object.position.z],
					target: [controls.target.x, controls.target.y, controls.target.z],
					zoom: controls.object.zoom,
				},
			});
		};
		controls.addEventListener("change", handleChange);
		return () => controls.removeEventListener("change", handleChange);
	}, [projectStore]);

	return (
		<>
			<Canvas
				className="three-bg"
				camera={{ position: [3, 3, 3], fov: 45 }}
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
					cellColor={preferences.gridColor}
					sectionColor={preferences.getComplementaryGridColor()}
					infiniteGrid
					side={THREE.DoubleSide}
				/>

				<EffectComposer enableNormalPass>
					{preferences.SSAOEnabled ? (
						<SSAO
							samples={31}
							radius={20}
							intensity={20}
							luminanceInfluence={0.9}
							color={new THREE.Color("black")}
						/>
					) : (
						<></>
					)}

					{preferences.FXAAEnabled ? <FXAA /> : <></>}
				</EffectComposer>

				<OrbitControls ref={controlsRef} makeDefault enableDamping={false} />
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
