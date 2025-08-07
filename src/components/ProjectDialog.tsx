/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ExternalLink, FolderOpen, Import } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fileOpen } from "browser-fs-access";
import { useProjectStore } from "@/stores/ProjectStore";
import { useTrainsStore } from "@/stores/TrainsStore";

function NewProjectDialog() {
	const projectStore = useProjectStore();
	const trainsStore = useTrainsStore();

	return (
		<AlertDialog open={true}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>New TCA-Project</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div>
							<Label htmlFor="projectName">Project name</Label>
							<Input
								id="projectName"
								placeholder="My TCA Project"
								className="mt-2"
								onChange={(e) => projectStore.setProjectName(e.target.value)}
							/>

							<hr className="my-4" />

							<p className="text-sm text-muted-foreground mb-2">
								TC Animator lets you animate one cart from a single train per project. To work on a
								different train or cart, create a new project for each one.
							</p>

							<Label htmlFor="train">Train</Label>
							<Select
								defaultValue={trainsStore.currentTrain?.savedName || ""}
								onValueChange={(value) => {
									const train = trainsStore.trains[value];
									if (train) {
										trainsStore.setCurrentTrain(train);
									}
								}}>
								<SelectTrigger className="w-full" id="train">
									<SelectValue placeholder="Select a train" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>Trains</SelectLabel>
										{Object.values(trainsStore.trains)
											.filter((train) => train.carts)
											.map((train) => (
												<SelectItem key={train.savedName} value={train.savedName}>
													{train.savedName}
												</SelectItem>
											))}
									</SelectGroup>
								</SelectContent>
							</Select>

							<Label htmlFor="cart" className="mt-4">
								Cart{" "}
								<span className="text-xs text-muted-foreground">
									(0 to{" "}
									{trainsStore.currentTrain?.carts
										? Object.entries(trainsStore.currentTrain.carts).length - 1
										: 0}
									)
								</span>
							</Label>
							<Input
								disabled={!trainsStore.currentTrain?.carts}
								id="cart"
								placeholder="Select a train first"
								min={0}
								max={
									trainsStore.currentTrain?.carts
										? Object.entries(trainsStore.currentTrain.carts).length - 1
										: 0
								}
								type="number"
								value={trainsStore.currentTrain?.carts ? 0 : ""}
							/>
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="text-sm text-muted-foreground">
					Made with ❤️ by Foxxite | Articca
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function ProjectDialog() {
	const projectStore = useProjectStore();
	const trainsStore = useTrainsStore();

	const loadTrainsFromFile = async () => {
		const fileHandle = await fileOpen({
			description: "Select a YAML file",
			mimeTypes: ["application/x-yaml", "text/yaml"],
			extensions: [".yaml", ".yml"],
			id: "load-saved-train-properties",
			startIn: "documents",
		});

		if (fileHandle) {
			const text = await fileHandle.text();
			trainsStore.setTrainsFromYml(text);
			trainsStore.setCurrentTrain(Object.values(trainsStore.trains)[0]);
		}
	};

	if (Object.entries(trainsStore.trains).length > 0 && !projectStore.cart) {
		return <NewProjectDialog />;
	}

	return (
		<AlertDialog open={!projectStore.cart}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Welcome to TC Animator!</AlertDialogTitle>

					<AlertDialogDescription asChild>
						<div className="flex flex-col items-center gap-4">
							<h3 className="text-lg">
								Please import a SavedTrainProperties YAML file or open an existing project to get
								started.
							</h3>

							<div className="grid grid-cols-2 gap-4">
								<Button
									variant="secondary"
									className="aspect-square w-full h-auto flex flex-col"
									onClick={loadTrainsFromFile}>
									<Import className="block size-24 mx-auto" />
									Import SavedTrainProperties
								</Button>
								<Button variant="secondary" className="aspect-square w-full h-auto flex flex-col">
									<FolderOpen className="block size-24 mx-auto" />
									Open TCA-Project
								</Button>
							</div>
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="text-sm text-muted-foreground">
					<a
						href="https://foxxite.com"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-1">
						Made with ❤️ by Foxxite | Articca
						<ExternalLink className="inline-block size-4" />
					</a>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export default ProjectDialog;
