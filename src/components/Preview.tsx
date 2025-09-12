/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import { Canvas, useThree } from "@react-three/fiber";
import {
	DepthOfField,
	EffectComposer,
	SMAA,
	SSAO,
} from "@react-three/postprocessing";
import { FpsDisplay, FpsTracker } from "@/components/three/Stats";
import {
	GizmoHelper,
	GizmoViewport,
	Grid,
	OrbitControls,
	Preload,
} from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";

import CartRender from "@/components/three/CartRender";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { DoubleSide as THREEDoubleSide } from "three";
import { Vector3 } from "three";
import { usePreferences } from "@/stores/PreferencesStore";
import { useProjectStore } from "@/stores/ProjectStore";

function RestoreOrbitControls({
	controlsRef,
}: {
	controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
	const projectStore = useProjectStore();
	const { camera } = useThree();

	useEffect(() => {
		const controls = controlsRef.current;
		const meta = projectStore.metadata.orbitControls;
		if (!controls || !meta) return;

		camera.position.copy(new Vector3(...meta.position));
		controls.target.copy(new Vector3(...meta.target));

		if (meta.zoom && "zoom" in camera) {
			// eslint-disable-next-line react-hooks/react-compiler
			camera.zoom = meta.zoom;
			camera.updateProjectionMatrix();
		}

		controls.update();
	}, [projectStore.metadata.orbitControls, camera, controlsRef]);

	// save state
	useEffect(() => {
		const controls = controlsRef.current;
		if (!controls) return;

		const handleChange = () => {
			projectStore.setMetadata({
				...projectStore.metadata,
				orbitControls: {
					position: camera.position.toArray(),
					target: controls.target.toArray(),
					zoom: camera.zoom,
				},
			});
		};

		controls.addEventListener("change", handleChange);
		return () => controls.removeEventListener("change", handleChange);
	}, [camera, projectStore, controlsRef]);

	return null;
}

function Preview() {
	const preferences = usePreferences();
	const projectStore = useProjectStore();
	const controlsRef = useRef<OrbitControlsImpl | null>(null);

	if (!projectStore.cart) {
		return (
			<div className="flex h-full w-full items-center justify-center bg-black">
				<p className="text-muted-foreground">
					No cart selected. Please create or open a project.
				</p>
			</div>
		);
	}

	return (
		<>
			<Canvas
				className="three-bg"
				camera={{ position: [3, 3, 3], fov: 45 }}
				shadows
				dpr={[1, 2]}
				gl={{
					powerPreference: "high-performance",
					antialias: false,
				}}
			>
				<EffectComposer enableNormalPass depthBuffer stencilBuffer>
					<>
						{preferences.SSAOEnabled && <SSAO />}
						{preferences.DOFEnabled && (
							<DepthOfField
								focusDistance={2}
								focalLength={5}
								bokehScale={2}
							/>
						)}

						<SMAA />
					</>
				</EffectComposer>

				<FpsTracker />
				<Preload all />

				<ambientLight intensity={2} />
				<directionalLight
					position={[5, 5, 5]}
					intensity={3}
					castShadow
				/>

				<Suspense fallback={null}>
					<CartRender />

					<Grid
						position={[0.5, -0.501, 0.5]}
						cellSize={1 / 16}
						sectionSize={1}
						cellThickness={0.5}
						sectionThickness={1.5}
						cellColor={preferences.gridColor}
						sectionColor={preferences.getComplementaryGridColor()}
						infiniteGrid
						side={THREEDoubleSide}
					/>

					<OrbitControls
						ref={controlsRef}
						makeDefault
						enableDamping={preferences.controlDamping}
					/>

					<GizmoHelper alignment="bottom-right" margin={[80, 80]}>
						<GizmoViewport
							axisColors={["#9d4b4b", "#2f7f4f", "#3b5b9d"]}
							labelColor="white"
						/>
					</GizmoHelper>

					<RestoreOrbitControls controlsRef={controlsRef} />
				</Suspense>
			</Canvas>

			<FpsDisplay />
		</>
	);
}

export default Preview;
