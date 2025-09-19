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
}: {
	modelId: number;
	blobUrl: string;
}) {
	const { scene } = useGLTF(blobUrl);
	// // Clone once per scene
	const customModel = useMemo(() => (scene ? clone(scene) : null), [scene]);

	if (!customModel) return <Cube key={modelId} />;

	return (
		<primitive
			key={modelId}
			object={customModel}
			rotation={[0, degreeToRadian(180), 0]}
			castShadow
			receiveShadow
		/>
	);
}

export default CustomModelRenderer;
