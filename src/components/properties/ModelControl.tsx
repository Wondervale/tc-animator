import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/stores/ProjectStore";
import { JSONPath } from "jsonpath-plus";
import { useMemo } from "react";
import blockbenchImage from "/src/assets/blockbench-settings.png";

import { convertGltfToGlb } from "@/lib/gltf";
import { toPureArrayBuffer } from "@/lib/utils";
import { fileOpen } from "browser-fs-access";

function ModelControl() {
	const { modelIds, selectedObjectPath, cart, modelFiles, setModelFile } =
		useProjectStore();

	const selectedAttachmentModels = useMemo(() => {
		if (!selectedObjectPath || !cart) return [];

		// Query the object at the selected path
		const results = JSONPath({
			path: selectedObjectPath,
			json: cart,
			resultType: "value",
		});

		if (results.length === 0) return [];

		const selectedObject = results[0] as unknown;
		if (!selectedObject || typeof selectedObject !== "object") return [];

		const models = new Set<number>();

		// Helper to extract custom model data from components
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

		// Handle nested structure: selectedObject.item?.components
		if ("item" in selectedObject) {
			const itemObj = (
				selectedObject as {
					item?: { components?: Record<string, unknown> };
				}
			).item;
			extractFromComponents(itemObj?.components);
		}

		return Array.from(models);
	}, [selectedObjectPath, cart]);

	const loadModelFile = async (modelId: number) => {
		try {
			const file = await fileOpen({
				mimeTypes: ["model/gltf+json", "model/gltf-binary"],
				extensions: [".gltf", ".glb"],
				multiple: false,
				description: "3D Model (GLTF/GLB)",
				id: "tca-models",
			});

			const arrayBuffer = await file.arrayBuffer();
			let finalData = arrayBuffer;

			// If GLTF, convert to GLB
			if (file.name.toLowerCase().endsWith(".gltf")) {
				try {
					const glbUint8Array = await convertGltfToGlb(arrayBuffer);
					const buffer = toPureArrayBuffer(glbUint8Array.buffer);
					finalData = buffer;
				} catch (error) {
					console.error("Failed to convert GLTF to GLB:", error);
					alert(
						"Failed to convert GLTF to GLB. See console for details.",
					);
					setModelFile(modelId, finalData as ArrayBuffer);
				}
			}

			setModelFile(modelId, finalData);
		} catch (error) {
			if ((error as { name?: string }).name !== "AbortError") {
				console.error("Error loading model file:", error);
				alert("Error loading model file. See console for details.");
			}
		}
	};

	return (
		<>
			{/* Explainer */}
			<p className="mb-4 text-balance">
				You can replace the default cubes with your own 3D models to
				make the cart look like it would *in-game with a resourcepack.
				<br />
				<br />
				Models must be in <b>GLTF</b> or <b>GLB</b> format. These can be
				exported from
				<Tooltip>
					<TooltipTrigger className="mx-1 cursor-help font-bold underline underline-offset-2">
						Blockbench
					</TooltipTrigger>
					<TooltipContent>
						<p className="mb-2 text-lg">
							Use these settings when exporting from Blockbench:
						</p>

						<img
							src={blockbenchImage}
							alt="Blockbench export settings"
						/>
					</TooltipContent>
				</Tooltip>
				or most 3D software.
				<br />
				<br />
				Below, you'll see each <b>Custom Model ID</b> for your
				attachments. Select an attachment in the 3D view to highlight
				the corresponding ID if it has one. Upload your model next to
				the matching ID to apply it in TC Animator.
			</p>

			<p className="text-xs text-muted-foreground text-balance">
				* Models are shown just like Item Display Entities in Minecraft.
				Any automatic scaling based on display mode is not applied here.
			</p>

			<hr className="my-4" />

			{/* Model list */}
			{modelIds.length === 0 && (
				<p className="text-muted-foreground text-sm">
					No custom models required for this cart.
				</p>
			)}
			{modelIds.length > 0 && (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Custom Model ID</TableHead>
							<TableHead>Upload Model</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{modelIds.map((id) => (
							<TableRow key={id}>
								<TableCell
									className={
										selectedAttachmentModels.includes(id)
											? "font-bold text-yellow-500"
											: ""
									}
								>
									{id}
								</TableCell>
								<TableCell>
									<Button
										variant="secondary"
										size="sm"
										onClick={() => loadModelFile(id)}
									>
										{modelFiles.get(id)
											? "Change Model"
											: "Upload Model"}
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</>
	);
}

export default ModelControl;
