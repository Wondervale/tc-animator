/*
 *   Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 */

// import ColorPicker from "@/components/ColorPicker";
import ColorPicker from "@/components/ColorPicker";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useProjectStore } from "@/stores/ProjectStore";
import { Separator } from "@radix-ui/react-menubar";

function ObjectControls() {
	const projectStore = useProjectStore();

	return (
		<ResizablePanelGroup
			direction="vertical"
			autoSaveId="tca-object-controls"
			autoSave="true"
		>
			<ResizablePanel className="px-4 pb-2">
				<div className="h-full w-full overflow-auto">
					<h2 className="text-lg font-medium">
						Object Controls (to be implemented)
					</h2>
				</div>
			</ResizablePanel>
			<ResizableHandle />
			<ResizablePanel className="px-4 py-2">
				<div className="h-full w-full overflow-auto">
					<h2 className="text-lg font-medium">Guidelines</h2>
					<p className="text-balance text-sm">
						Guidelines allow you to add references grids to the 3D
						view to help with positioning and scaling models. You
						can add guidelines for different planes (XY, XZ, YZ) and
						adjust their spacing and color.
					</p>
					<Separator className="my-2" />

					<Table className="w-full h-full">
						<TableHeader>
							<TableRow>
								<TableHead>Plane</TableHead>
								<TableHead>Position</TableHead>
								<TableHead>Cell Size</TableHead>
								<TableHead>Section Size</TableHead>
								<TableHead>Cell Color</TableHead>
								<TableHead className="text-right">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{projectStore.metadata.guidelines.map(
								(guideline, index) => (
									<TableRow key={index}>
										<TableCell>{guideline.plane}</TableCell>
										<TableCell>
											{`[${guideline.position
												.map((v) => v.toFixed(2))
												.join(", ")}]`}
										</TableCell>
										<TableCell>
											{guideline.cellSize.toFixed(4)}
										</TableCell>
										<TableCell>
											{guideline.sectionSize.toFixed(4)}
										</TableCell>
										<TableCell>
											<ColorPicker
												defaultColor={
													guideline.cellColor
												}
												onChangeComplete={(color) =>
													projectStore.updateGuideline(
														index,
														{ cellColor: color },
													)
												}
											></ColorPicker>
										</TableCell>
										<TableCell className="text-right">
											<button
												className="rounded bg-red-600 px-2 py-1 text-sm font-medium text-white hover:bg-red-700"
												onClick={() =>
													projectStore.removeGuideline(
														index,
													)
												}
											>
												Delete
											</button>
										</TableCell>
									</TableRow>
								),
							)}
						</TableBody>
					</Table>

					<button
						className="mb-2 rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
						onClick={() =>
							projectStore.addGuideline({
								plane: "XZ",
								position: [0.5, 0, 0.5],
								cellSize: 1 / 16,
								sectionSize: 1,
								cellColor: "#ff0000",
							})
						}
					>
						Add Guideline
					</button>
				</div>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}

export default ObjectControls;
