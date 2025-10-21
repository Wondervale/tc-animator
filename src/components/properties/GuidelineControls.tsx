/*
 *   Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 */

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

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

import ColorPicker from "@/components/ColorPicker";
import { Button } from "@/components/ui/button";
import { Eye, EyeClosed, Trash } from "lucide-react";

function GuidelineControls() {
	const projectStore = useProjectStore();

	return (
		<div className="h-full w-full overflow-auto">
			<h2 className="text-lg font-medium">Guidelines</h2>
			<p className="text-balance text-sm">
				Guidelines allow you to add references grids to the 3D view to
				help with positioning and scaling models. You can add guidelines
				for different planes (XY, XZ, YZ) and adjust their spacing and
				color.
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
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{projectStore.metadata.guidelines.map(
						(guideline, index) => (
							<TableRow key={index}>
								<TableCell>
									<Select
										onValueChange={(plane) => {
											if (
												plane === "XY" ||
												plane === "XZ" ||
												plane === "YZ"
											) {
												projectStore.updateGuideline(
													index,
													{ plane },
												);
											}
										}}
										value={guideline.plane}
									>
										<SelectTrigger className="w-full mt-0">
											<SelectValue placeholder="XZ" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="XY">
												XY
											</SelectItem>
											<SelectItem value="XZ">
												XZ
											</SelectItem>
											<SelectItem value="YZ">
												YZ
											</SelectItem>
										</SelectContent>
									</Select>
								</TableCell>
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
										defaultColor={guideline.cellColor}
										onChangeComplete={(color) =>
											projectStore.updateGuideline(
												index,
												{ cellColor: color },
											)
										}
									></ColorPicker>
								</TableCell>
								<TableCell className="text-right gap-2 flex justify-end">
									<Button
										title="Delete Guideline"
										size="icon"
										variant="destructive"
										onClick={() =>
											projectStore.removeGuideline(index)
										}
									>
										<Trash />
									</Button>
									<Button
										title="Toggle Visibility"
										size="icon"
										variant="secondary"
										onClick={() =>
											projectStore.updateGuideline(
												index,
												{
													visible: !guideline.visible,
												},
											)
										}
									>
										{guideline.visible ? (
											<Eye />
										) : (
											<EyeClosed />
										)}
									</Button>
								</TableCell>
							</TableRow>
						),
					)}
				</TableBody>
			</Table>

			<Button
				onClick={() =>
					projectStore.addGuideline({
						plane: "XZ",
						position: [0.5, 0, 0.5],
						cellSize: 1 / 16,
						sectionSize: 1,
						cellColor: "#ff0000",
						visible: true,
					})
				}
			>
				Add Guideline
			</Button>
		</div>
	);
}

export default GuidelineControls;
