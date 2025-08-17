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
import { ChevronLeft, ExternalLink, FolderOpen, Import } from "lucide-react";
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
import { toast } from "sonner";
import { useProjectStore } from "@/stores/ProjectStore";
import { useState } from "react";
import { useTrainsStore } from "@/stores/TrainsStore";

function NewProjectDialog() {
	const projectStore = useProjectStore();
	const trainsStore = useTrainsStore();

	const [currentTrain, setCurrentTrain] = useState(trainsStore.currentTrain);
	const [currentCart, setCurrentCart] = useState(projectStore.cart);
	const [projectName, setProjectName] = useState(projectStore.metadata.projectName);

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
								onChange={(e) => setProjectName(e.target.value)}
							/>

							<hr className="my-4" />

							<p className="text-sm text-muted-foreground mb-2">
								TC Animator lets you animate one cart from a single train per project. To work on a
								different train or cart, create a new project for each one.
							</p>

							<Label htmlFor="train">Train</Label>
							<Select
								onValueChange={(value) => {
									const train = trainsStore.trains[value];
									if (train) {
										setCurrentTrain(train);
										setCurrentCart(null);
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
								Cart
							</Label>
							<Select
								value={
									currentTrain?.carts
										? Object.entries(currentTrain.carts).find(
												([, cart]) => cart === currentCart
										  )?.[0] ?? ""
										: ""
								}
								disabled={!currentTrain?.carts}
								onValueChange={(value) => {
									const cart = currentTrain?.carts?.[value];
									if (cart) {
										setCurrentCart(cart);
									}
								}}>
								<SelectTrigger className="w-full" id="cart">
									<SelectValue placeholder="Select a cart" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>Carts</SelectLabel>
										{Object.entries(currentTrain?.carts || {}).map(([key]) => (
											<SelectItem key={key} value={key}>
												{key}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="flex justify-between">
					<Button
						variant="secondary"
						onClick={() => {
							projectStore.reset();
							trainsStore.reset();
						}}>
						<ChevronLeft />
						Back
					</Button>

					<Button
						onClick={async () => {
							if (projectName && currentTrain && currentCart) {
								projectStore.setProjectName(projectName);
								trainsStore.setCurrentTrain(currentTrain);
								projectStore.setCart(currentCart);

								await projectStore.saveProject();
							}
						}}
						disabled={!(projectName && currentTrain && currentCart)}>
						Create Project
					</Button>
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
		}).catch(() => {
			return null;
		});

		if (fileHandle) {
			const text = await fileHandle.text();
			trainsStore.setTrainsFromYml(text);
			trainsStore.setCurrentTrain(Object.values(trainsStore.trains)[0]);
		}
	};

	const loadProjectFromFile = async () => {
		const fileHandle = await fileOpen({
			description: "Select a TCA-Project file",
			extensions: [".tcaproj"],
			mimeTypes: ["application/binary"],
			id: "tca-project",
			startIn: "documents",
		}).catch(() => {
			return null;
		});

		if (!fileHandle) {
			return;
		}

		toast.promise(projectStore.loadProjectFromFile(fileHandle), {
			loading: "Loading project...",
			success: "Project loaded successfully!",
			error: "Failed to load project.",
		});
	};

	if (Object.entries(trainsStore.trains).length > 0 && !projectStore.metadata.createdAt) {
		return <NewProjectDialog />;
	}

	return (
		<AlertDialog open={!projectStore.metadata.createdAt}>
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
								<Button
									variant="secondary"
									className="aspect-square w-full h-auto flex flex-col"
									onClick={loadProjectFromFile}>
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
