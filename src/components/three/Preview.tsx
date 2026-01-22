/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import { FpsDisplay, FpsTracker } from "@/components/three/Stats";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	GizmoHelper,
	GizmoViewport,
	Grid,
	Html,
	OrbitControls,
	Preload,
	TransformControls,
} from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import {
	DepthOfField,
	EffectComposer,
	SMAA,
	SSAO,
} from "@react-three/postprocessing";
import { Box, Globe, Move3D, Rotate3D } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Box3, Object3D, DoubleSide as THREEDoubleSide, Vector3 } from "three";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import { degreeToRadian, makeColorDarker, planeToRotation } from "@/lib/utils";
import { usePreferences } from "@/stores/PreferencesStore";
import { useProjectStore } from "@/stores/ProjectStore";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";

const CartRender = lazy(() => import("@/components/three/CartRender"));
const MeshOutline = lazy(() => import("@/components/three/MeshOutline"));
const AngleSlider = lazy(
	() => import("@/components/three/controls/AngleSlider"),
);
const DistanceSlider = lazy(
	() => import("@/components/three/controls/DistanceSlider"),
);

import { debounce } from "lodash";

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

		const handleChange = debounce(() => {
			projectStore.setMetadata({
				...projectStore.metadata,
				orbitControls: {
					position: camera.position.toArray(),
					target: controls.target.toArray(),
					zoom: camera.zoom,
				},
			});
		}, 200);

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
	const [hovered, setHovered] = useState<Object3D | null>(null);

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
			} else if (event.key === "f" || event.key === "F") {
				// Focus on selected object
				if (selected) {
					const box = new Box3().setFromObject(selected);
					const size = box.getSize(new Vector3()).length();
					const center = box.getCenter(new Vector3());
					const distance = size * 1.5;

					const camera = controlsRef.current?.object;
					if (camera) {
						const direction = new Vector3()
							.subVectors(camera.position, center)
							.normalize()
							.multiplyScalar(distance);
						camera.position.copy(direction.add(center));
						controlsRef.current?.target.copy(center);
						controlsRef.current?.update();
					}
				}
			} else if (event.key === "Escape") {
				projectStore.setSelectedObjectPath(undefined);
				setSelected(null);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [transformSpace, projectStore, selected]);

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
		<SMAA key="smaa" />,

		preferences.SSAOEnabled && <SSAO key="ssao" />,
		preferences.DOFEnabled && (
			<DepthOfField
				key="dof"
				focusDistance={2}
				focalLength={5}
				bokehScale={2}
			/>
		),
	].filter(Boolean) as React.ReactElement[]; // cast to satisfy TS

	return (
		<div className="relative h-full w-full">
			<Canvas
				className={`three-bg ${hovered ? "cursor-pointer" : "cursor-default"}`}
				camera={{ position: [3, 3, 3], fov: 45 }}
				shadows
				dpr={[1, 2]}
				gl={{
					toneMapping: 0,
					powerPreference: "high-performance",
					alpha: false,
					antialias: true,
					stencil: false,
					autoClear: false,
					depth: true,
				}}
				onPointerMissed={(e) => {
					// Ignore right clicks or drags
					if (e.type === "click") {
						projectStore.setSelectedObjectPath(undefined);
						setSelected(null);
					}
				}}
			>
				<EffectComposer
					enabled
					enableNormalPass
					depthBuffer
					stencilBuffer
				>
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

				<Grid
					position={[0.5, 0, 0.5]}
					cellSize={1 / 16}
					sectionSize={1}
					cellThickness={0.5}
					sectionThickness={1.5}
					cellColor={preferences.gridColor}
					sectionColor={preferences.getComplementaryGridColor()}
					infiniteGrid
					side={THREEDoubleSide}
				/>

				{/* Simple lines to show 0,0,0 */}
				<group position={[-0.5, 0, -0.5]}>
					<line>
						<bufferGeometry>
							<bufferAttribute
								attach="attributes-position"
								args={[new Float32Array([0, 0, 0, 1, 0, 0]), 3]}
								count={2}
								itemSize={3}
							/>
						</bufferGeometry>
						<lineBasicMaterial color={0xff0000} linewidth={2} />
					</line>
					<line>
						<bufferGeometry>
							<bufferAttribute
								attach="attributes-position"
								args={[new Float32Array([0, 0, 0, 0, 1, 0]), 3]}
								count={2}
								itemSize={3}
							/>
						</bufferGeometry>
						<lineBasicMaterial color={0x00ff00} linewidth={2} />
					</line>
					<line>
						<bufferGeometry>
							<bufferAttribute
								attach="attributes-position"
								args={[new Float32Array([0, 0, 0, 0, 0, 1]), 3]}
								count={2}
								itemSize={3}
							/>
						</bufferGeometry>
						<lineBasicMaterial color={0x0000ff} linewidth={2} />
					</line>
				</group>

				{/* Guidelines */}
				{projectStore.metadata.guidelines?.map(
					(guideline, index) =>
						guideline.visible && (
							<Grid
								key={index}
								position={guideline.position}
								cellSize={guideline.cellSize}
								sectionSize={guideline.sectionSize}
								cellThickness={0.5}
								sectionThickness={1.5}
								cellColor={guideline.cellColor}
								sectionColor={makeColorDarker(
									guideline.cellColor,
									0.5,
								)}
								infiniteGrid
								side={THREEDoubleSide}
								rotation={planeToRotation(guideline.plane)}
							/>
						),
				)}

				<Suspense fallback={<Html center>Loading Cart...</Html>}>
					<CartRender onSelect={setSelected} onHover={setHovered} />
				</Suspense>

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
						onMouseUp={() => (controlsRef.current!.enabled = true)}
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

				{hovered && (
					<Suspense fallback={null}>
						<MeshOutline
							selection={hovered}
							color={0xffa500}
							scaleFactor={1.1}
						/>
					</Suspense>
				)}
				{selected && (
					<Suspense fallback={null}>
						<MeshOutline
							selection={selected}
							color={0x00ffff}
							scaleFactor={1.1}
						/>
					</Suspense>
				)}
			</Canvas>

			<FpsDisplay />

			<div className="absolute top-2 left-2 flex flex-row gap-2">
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

				{transformMode === "translate" && (
					<Suspense fallback={<Skeleton className="h-8 w-24" />}>
						<DistanceSlider
							value={preferences.distanceSnap}
							onChange={preferences.setDistanceSnap}
						/>
					</Suspense>
				)}

				{transformMode === "rotate" && (
					<Suspense fallback={<Skeleton className="h-8 w-24" />}>
						<AngleSlider
							value={preferences.angleSnap}
							onChange={preferences.setAngleSnap}
						/>
					</Suspense>
				)}
			</div>
		</div>
	);
}

export default Preview;
