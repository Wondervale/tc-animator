/*
 *   Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 */

import Cube from "@/components/three/Cube";
import { degreeToRadian } from "@/lib/utils";
import { useProjectStore } from "@/stores/ProjectStore";
import { useGLTF } from "@react-three/drei";
import { JSONPath } from "jsonpath-plus";
import { useEffect, useMemo, useState } from "react";
import { Box3, Group, Mesh, Vector3 } from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

const modelBlobUrlCache = new Map<
	number,
	{ buffer: ArrayBuffer; url: string }
>();

function getOrCreateBlobUrl(modelId: number, buffer: ArrayBuffer): string {
	const cached = modelBlobUrlCache.get(modelId);
	if (cached && cached.buffer === buffer) {
		return cached.url;
	}
	// Clean up old URL if buffer changed
	if (cached) {
		URL.revokeObjectURL(cached.url);
	}
	const blob = new Blob([buffer]);
	const url = URL.createObjectURL(blob);
	modelBlobUrlCache.set(modelId, { buffer, url });
	return url;
}

function cleanupBlobUrl(modelId: number) {
	const cached = modelBlobUrlCache.get(modelId);
	if (cached) {
		URL.revokeObjectURL(cached.url);
		modelBlobUrlCache.delete(modelId);
	}
}

function CustomModelRenderer({ jsonPath }: { jsonPath: string }) {
	const { cart, modelFiles } = useProjectStore();

	// Collect all custom model IDs from the JSON path
	const selectedAttachmentModels = useMemo(() => {
		if (!jsonPath || !cart) return [];

		const results = JSONPath({
			path: jsonPath,
			json: cart,
			resultType: "value",
		});

		if (results.length === 0) return [];

		const selectedObject = results[0] as unknown;
		if (!selectedObject || typeof selectedObject !== "object") return [];

		const models = new Set<number>();

		function extractFromComponents(components?: Record<string, unknown>) {
			if (!components) return;

			const cmd = components["minecraft:custom_model_data"];
			if (cmd && typeof cmd === "object" && "floats" in cmd) {
				const floats = (cmd as { floats?: number[] }).floats;
				if (Array.isArray(floats)) {
					floats.forEach((f) => models.add(f));
				}
			}
		}

		if ("item" in selectedObject) {
			const itemObj = (
				selectedObject as {
					item?: { components?: Record<string, unknown> };
				}
			).item;
			extractFromComponents(itemObj?.components);
		}

		return Array.from(models);
	}, [jsonPath, cart]);

	if (selectedAttachmentModels.length === 0) {
		return (
			<>
				<Cube />
			</>
		);
	}

	return (
		<>
			{selectedAttachmentModels.map((modelId) => {
				if (!modelFiles) {
					return <Cube key={modelId} />;
				}

				const data = modelFiles.get(modelId);

				if (!data) {
					return <Cube key={modelId} />;
				}

				return (
					<ModelInstance
						key={modelId}
						modelId={modelId}
						arrayBuffer={data}
					/>
				);
			})}
		</>
	);
}

function ModelInstance({
	modelId,
	arrayBuffer,
}: {
	modelId: number;
	arrayBuffer?: ArrayBuffer;
}) {
	const [blobUrl, setBlobUrl] = useState<string | undefined>(undefined);

	useEffect(() => {
		if (!arrayBuffer) {
			setBlobUrl(undefined);
			cleanupBlobUrl(modelId);
			return;
		}
		const url = getOrCreateBlobUrl(modelId, arrayBuffer);
		setBlobUrl(url);

		return () => {
			// Only cleanup if this is the last reference
			cleanupBlobUrl(modelId);
		};
	}, [modelId, arrayBuffer]);

	if (!blobUrl) return <Cube key={modelId} />;
	return <ModelRenderer modelId={modelId} blobUrl={blobUrl} />;
}

function ModelRenderer({
	modelId,
	blobUrl,
	scale = 1,
	position = new Vector3(0, 0, 0),
}: {
	modelId: number;
	blobUrl: string;
	hoverable?: boolean;
	scale?: number;
	position?: Vector3;
}) {
	const { scene } = useGLTF(blobUrl);

	const customModel = useMemo(() => {
		if (!scene) return null;

		const cloned = clone(scene);
		cloned.updateWorldMatrix(true, true);

		// Compute bounding box of the entire model
		const box = new Box3().setFromObject(cloned);
		const center = new Vector3();
		box.getCenter(center);

		const size = new Vector3();
		box.getSize(size);

		// Bottom center: X and Z from center, Y at min
		const bottomCenter = new Vector3(center.x, box.min.y, center.z);

		const pivot = new Group();

		// Shift all meshes so bottom center aligns with origin
		cloned.traverse((child) => {
			if ((child as Mesh).isMesh) {
				(child as Mesh).position.sub(bottomCenter);
			}
		});

		pivot.add(cloned);

		return pivot;
	}, [scene]);

	if (!customModel) return <Cube key={modelId} />;

	return (
		<>
			<primitive
				object={customModel}
				scale={scale}
				position={position}
				rotation={[0, degreeToRadian(180), 0]}
				castShadow
				receiveShadow
			/>
		</>
	);
}

export default CustomModelRenderer;
