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
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	ChevronLeft,
	ExternalLink,
	FolderOpen,
	TrainFrontIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FILE_EXTENSION, useProjectStore } from "@/stores/ProjectStore";
import { useTrainsStore } from "@/stores/TrainsStore";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function LegacyNewProjectDialog() {
	const projectStore = useProjectStore();
	const trainsStore = useTrainsStore();

	const [currentTrain, setCurrentTrain] = useState(trainsStore.currentTrain);
	const [currentCart, setCurrentCart] = useState(projectStore.cart);
	const [projectName, setProjectName] = useState(
		projectStore.metadata.projectName,
	);

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
								TC Animator lets you animate one cart from a
								single train per project. To work on a different
								train or cart, create a new project for each
								one.
							</p>

							<Label htmlFor="train">Train</Label>
							<Select
								onValueChange={(value) => {
									const train = trainsStore.trains[value];
									if (train) {
										setCurrentTrain(train);
										setCurrentCart(null);
									}
								}}
							>
								<SelectTrigger className="w-full" id="train">
									<SelectValue placeholder="Select a train" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>Trains</SelectLabel>
										{Object.values(trainsStore.trains)
											.filter((train) => train.carts)
											.map((train) => (
												<SelectItem
													key={train.savedName}
													value={train.savedName}
												>
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
										? (Object.entries(
												currentTrain.carts,
											).find(
												([, cart]) =>
													cart === currentCart,
											)?.[0] ?? "")
										: ""
								}
								disabled={!currentTrain?.carts}
								onValueChange={(value) => {
									const cart = currentTrain?.carts?.[value];
									if (cart) {
										setCurrentCart(cart);
									}
								}}
							>
								<SelectTrigger className="w-full" id="cart">
									<SelectValue placeholder="Select a cart" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>Carts</SelectLabel>
										{Object.entries(
											currentTrain?.carts || {},
										).map(([key]) => (
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
						}}
					>
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
						disabled={!(projectName && currentTrain && currentCart)}
					>
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

	const [loading, setLoading] = useState(false);
	const [url, setUrl] = useState("");

	// Ref to prevent duplicate triggers
	const urlPasteHandled = useRef(false);

	const handleImportFromUrl = useCallback(
		async (importUrl?: string) => {
			const targetUrl = importUrl ?? url;
			if (!targetUrl) return;
			// TODO: Implement import from URL

			alert(`Import from URL is not implemented yet. URL: ${targetUrl}`);
		},
		[url],
	);

	const loadProjectFromFile = async () => {
		setLoading(true);

		await toast
			.promise(projectStore.loadProjectFromFileDialog(), {
				loading: "Loading project...",
				success: "Project loaded successfully!",
				error: "Failed to load project.",
			})
			.unwrap()
			.catch(() => {
				projectStore.reset();
			});

		setLoading(false);
	};

	useEffect(() => {
		const loadProjectFromFile = async (file: File) => {
			setLoading(true);

			// Check file extension
			if (!file.name.endsWith(FILE_EXTENSION)) {
				toast.error(
					`Invalid file type. Please select a ${FILE_EXTENSION} file.`,
				);
				setLoading(false);
				return;
			}

			try {
				await toast.promise(
					projectStore.loadProjectFromFileHandle(file),
					{
						loading: "Loading project...",
						success: "Project loaded successfully!",
						error: "Failed to load project.",
					},
				);
			} catch {
				projectStore.reset();
			}
			setLoading(false);
		};

		const handlePaste = (e: ClipboardEvent) => {
			if (loading || projectStore.metadata.createdAt) return;

			// Check for URL in clipboard
			const urlText = e.clipboardData?.getData("text");
			if (
				urlText &&
				/^https?:\/\/\S+$/i.test(urlText.trim()) &&
				!urlPasteHandled.current
			) {
				urlPasteHandled.current = true;
				handleImportFromUrl(urlText.trim());
				setUrl(urlText.trim());
				setTimeout(() => {
					urlPasteHandled.current = false;
				}, 500);
				return;
			}

			// Check for file in clipboard
			const items = e.clipboardData?.items;
			if (items) {
				for (const item of items) {
					if (item.kind === "file") {
						const file = item.getAsFile();
						if (file) {
							loadProjectFromFile(file);
							return;
						}
					}
				}
			}
		};

		const handleDrop = (e: DragEvent) => {
			e.preventDefault(); // ✅ Prevent default file opening behavior

			if (loading || projectStore.metadata.createdAt) return;

			if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
				const file = e.dataTransfer.files[0];
				loadProjectFromFile(file);
			}
		};

		const handleDragOver = (e: DragEvent) => {
			e.preventDefault(); // ✅ Necessary to allow drop
		};

		window.addEventListener("paste", handlePaste);
		window.addEventListener("drop", handleDrop);
		window.addEventListener("dragover", handleDragOver);

		return () => {
			window.removeEventListener("paste", handlePaste);
			window.removeEventListener("drop", handleDrop);
			window.removeEventListener("dragover", handleDragOver);
		};
	}, [loading, handleImportFromUrl, projectStore]);

	if (loading) {
		return (
			<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur"></div>
		);
	}

	if (
		Object.entries(trainsStore.trains).length > 0 &&
		!projectStore.metadata.createdAt
	) {
		return <LegacyNewProjectDialog />;
	}

	return (
		<AlertDialog open={!projectStore.metadata.createdAt}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="text-3xl font-bold text-center">
						Welcome to TC Animator!
					</AlertDialogTitle>

					<AlertDialogDescription asChild>
						<div className="space-y-4 pt-2">
							<p className="text-muted-foreground text-center text-balance leading-relaxed">
								Please import a train exported from TrainCarts
								or open an existing TCA-Project.
							</p>

							<div className="flex flex-col gap-4">
								{/* Import from URL Option */}
								<div className="space-y-4 p-6 rounded-lg border border-zinc-300 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/50 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-colors">
									<div className="flex items-center gap-3">
										<div className="p-2 rounded-lg bg-blue-500/10">
											<TrainFrontIcon className="w-5 h-5 text-blue-400" />
										</div>
										<h2 className="text-lg font-semibold">
											Import from TrainCarts
										</h2>
									</div>

									<div className="space-y-3">
										<Input
											type="url"
											value={url}
											onChange={(e) =>
												setUrl(e.target.value)
											}
											placeholder="https://paste.traincarts.net/"
										/>
										<Button
											onClick={() =>
												handleImportFromUrl()
											}
											className="w-full"
										>
											Import from TrainCarts
										</Button>
									</div>
								</div>

								{/* Open TCA-Project Option */}
								<div className="space-y-4 p-6 rounded-lg border border-zinc-300 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/50 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-colors">
									<div className="flex items-center gap-3">
										<div className="p-2 rounded-lg bg-blue-500/10">
											<FolderOpen className="w-5 h-5 text-emerald-400" />
										</div>
										<h2 className="text-lg font-semibold">
											Open TCA-Project
										</h2>
									</div>

									<Button
										className="bg-emerald-500 hover:bg-emerald-500/90 dark:bg-emerald-700  dark:hover:bg-emerald-700/90 w-full"
										onClick={loadProjectFromFile}
									>
										Browse files
									</Button>
								</div>
							</div>
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter className="sm:justify-center text-sm text-muted-foreground">
					<a
						href="https://foxxite.com"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-1.5"
					>
						<span>Made with ❤️ by Foxxite | Articca</span>
						<ExternalLink className="w-4 h-4" />
					</a>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export default ProjectDialog;
