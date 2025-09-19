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

import { Input } from "@/components/ui/input";
import { useProjectStore } from "@/stores/ProjectStore";
import { JSONPath } from "jsonpath-plus";
import { useMemo } from "react";
import blockbenchImage from "/public/blockbench-settings.png";

function ModelControl() {
	const { modelIds, selectedObjectPath, cart } = useProjectStore();

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

	return (
		<>
			{/* Explainer */}
			<p className="text-muted-foreground mb-4">
				You can replace the default cubes with your own 3D models to
				make the cart look like it would in-game with a resourcepack.
				<br />
				<br />
				Models must be in <b>GLTF</b> or <b>GLB</b> format. These can be
				exported from
				<Tooltip>
					<TooltipTrigger className="mx-1 cursor-help font-bold underline underline-offset-2">
						Blockbench
					</TooltipTrigger>
					<TooltipContent>
						<p className="mb-2">
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
									<Input
										type="file"
										accept=".gltf,.glb"
										className="m-0 w-full"
									/>
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
