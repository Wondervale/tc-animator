/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import { Box, Globe, Move3D, Rotate3D } from "lucide-react";
import { Canvas, useThree } from "@react-three/fiber";
import {
	DepthOfField,
	EffectComposer,
	Outline,
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
	TransformControls,
} from "@react-three/drei";
import { Object3D, DoubleSide as THREEDoubleSide } from "three";
import { Suspense, useEffect, useRef, useState } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

import AngleSlider from "@/components/ui/AngleSlider";
import { Button } from "@/components/ui/button";
import CartRender from "@/components/three/CartRender";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Toggle } from "@/components/ui/toggle";
import { Vector3 } from "three";
import { degreeToRadian } from "@/lib/utils";
import { usePreferences } from "@/stores/PreferencesStore";
import { useProjectStore } from "@/stores/ProjectStore";

function RestoreOrbitControls({
	controlsRef,
}: {
	controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
	const projectStore = useProjectStore();
	const { camera } = useThree();

	// restore state
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

	const [selected, setSelected] = useState<Object3D | null>(null);

	const [transformMode, setTransformMode] = useState<"translate" | "rotate">(
		"translate",
	);
	const [transformSpace, setTransformSpace] = useState<"world" | "local">(
		"world",
	);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.target && (event.target as HTMLElement).isContentEditable)
				return;
			if (event.key === "v" || event.key === "V") {
				setTransformMode("translate");
			} else if (event.key === "r" || event.key === "R") {
				setTransformMode("rotate");
			} else if (event.key === "x" || event.key === "X") {
				setTransformSpace(
					transformSpace === "world" ? "local" : "world",
				);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [transformSpace]);

	useEffect(() => {
		if (!selected) return;

		if (!projectStore.cart) setSelected(null); // Deselect if no cart is loaded
	}, [projectStore.cart, selected]);

	if (!projectStore.cart) {
		return (
			<div className="flex h-full w-full items-center justify-center bg-black">
				<p className="text-muted-foreground">
					No cart selected. Please create or open a project.
				</p>
			</div>
		);
	}

	const passes = [
		preferences.SSAOEnabled && <SSAO key="ssao" />,
		preferences.DOFEnabled && (
			<DepthOfField
				key="dof"
				focusDistance={2}
				focalLength={5}
				bokehScale={2}
			/>
		),
		<SMAA key="smaa" />,
		selected && (
			<Outline
				key="outline"
				selection={[selected]}
				edgeStrength={4}
				blur
			/>
		),
	].filter(Boolean) as React.ReactElement[]; // cast to satisfy TS

	return (
		<div className="relative h-full w-full">
			<Canvas
				className="three-bg"
				camera={{ position: [3, 3, 3], fov: 45 }}
				shadows
				dpr={[1, 2]}
				gl={{
					powerPreference: "high-performance",
					antialias: false,
				}}
				onPointerMissed={(e) => {
					// Ignore right clicks or drags
					if (e.type === "click") {
						projectStore.setSelectedObjectPath(undefined);
						setSelected(null);
					}
				}}
			>
				<EffectComposer enableNormalPass depthBuffer stencilBuffer>
					{passes}
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
					<CartRender onSelect={setSelected} />

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

					{/* 🆕 Gizmos attach only if something is selected */}
					{selected && (
						<TransformControls
							object={selected}
							mode={transformMode}
							rotationSnap={degreeToRadian(preferences.angleSnap)}
							translationSnap={preferences.distanceSnap}
							onMouseDown={() =>
								(controlsRef.current!.enabled = false)
							}
							onMouseUp={() =>
								(controlsRef.current!.enabled = true)
							}
							space={transformSpace}
						/>
					)}

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

			<div className="absolute top-[8px] left-[8px] flex flex-row gap-[8px]">
				<Tooltip>
					<Button
						variant="secondary"
						size="icon"
						asChild
						onClick={() => {
							setTransformSpace(
								transformSpace === "world" ? "local" : "world",
							);
						}}
					>
						<TooltipTrigger>
							{transformSpace === "world" ? <Globe /> : <Box />}
						</TooltipTrigger>
					</Button>
					<TooltipContent>
						{transformSpace === "world"
							? "World Space"
							: "Local Space"}
						<kbd className="text-muted-foreground ml-1">X</kbd>
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<Toggle
						pressed={transformMode === "translate"}
						onClick={() => setTransformMode("translate")}
						asChild
					>
						<TooltipTrigger>
							<Move3D />
						</TooltipTrigger>
					</Toggle>
					<TooltipContent>
						Translate Mode
						<kbd className="text-muted-foreground ml-1">V</kbd>
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<Toggle
						pressed={transformMode === "rotate"}
						onClick={() => setTransformMode("rotate")}
						asChild
					>
						<TooltipTrigger>
							<Rotate3D />
						</TooltipTrigger>
					</Toggle>
					<TooltipContent>
						Rotate Mode
						<kbd className="text-muted-foreground ml-1">R</kbd>
					</TooltipContent>
				</Tooltip>

				{transformMode === "rotate" && (
					<AngleSlider
						value={preferences.angleSnap}
						onChange={preferences.setAngleSnap}
					/>
				)}
			</div>
		</div>
	);
}

export default Preview;
