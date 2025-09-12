/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Info, Maximize, Minimize, X } from "lucide-react";
import {
	Menubar,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarSeparator,
	MenubarShortcut,
	MenubarTrigger,
} from "@/components/ui/menubar";
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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import ColorPicker from "@/components/ColorPicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePreferences } from "@/stores/PreferencesStore";
import { useProjectStore } from "@/stores/ProjectStore";

function AppMenu() {
	const projectStore = useProjectStore();

	const [isFullscreen, setIsFullscreen] = useState(
		document.fullscreenElement,
	);
	const [saving, setSaving] = useState(false);
	const [preferencesOpen, setPreferencesOpen] = useState(false); // <-- Add state

	const toggleFullscreen = () => {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().catch((error) => {
				console.error("Error entering fullscreen mode:", error);
			});
		} else {
			document.exitFullscreen().catch((error) => {
				console.error("Error exiting fullscreen mode:", error);
			});
		}
	};

	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(document.fullscreenElement);
		};
		document.addEventListener("fullscreenchange", handleFullscreenChange);
		return () => {
			document.removeEventListener(
				"fullscreenchange",
				handleFullscreenChange,
			);
		};
	}, []);

	const saveAndNew = async () => {
		setSaving(true);

		await projectStore.saveProject();
		projectStore.reset();

		setSaving(false);
	};

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (
				event.key === "s" &&
				(event.ctrlKey || event.metaKey) &&
				projectStore.cart
			) {
				event.preventDefault();
				projectStore.saveProject().catch((error) => {
					console.error("Save failed:", error);
				});
			} else if (event.key === "," && (event.ctrlKey || event.metaKey)) {
				event.preventDefault();
				setPreferencesOpen(true); // Open preferences dialog
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [projectStore]);

	return (
		<Menubar
			style={{
				padding: "-1em",
				margin: "-1em",
			}}
			className="rounded-none"
		>
			<div className="bg-card flex items-center gap-2 px-2">
				{projectStore.metadata.projectName || "Untitled Project"}

				<Button
					className="h-4 w-4"
					variant="ghost"
					size="icon"
					disabled={saving}
					onClick={saveAndNew}
				>
					{!projectStore.saved ? (
						<span
							style={{
								display: "inline-block",
								width: 10,
								height: 10,
								borderRadius: "50%",
								background: "currentColor",
								marginRight: 4,
								aspectRatio: "1 / 1",
							}}
						/>
					) : (
						<X />
					)}
				</Button>
			</div>

			<MenubarMenu>
				<MenubarTrigger>File</MenubarTrigger>
				<MenubarContent>
					<MenubarItem
						disabled={saving}
						onClick={async () => projectStore.saveProject()}
					>
						Save Project <MenubarShortcut>CTRL + S</MenubarShortcut>
					</MenubarItem>
					<MenubarItem
						disabled={saving}
						onClick={async () => projectStore.saveProject(true)}
					>
						Save Project As
					</MenubarItem>
					<MenubarSeparator />
					<MenubarItem
						disabled={saving}
						onClick={async () => projectStore.loadProjectFromFile()}
					>
						Load Project
					</MenubarItem>
					<MenubarItem disabled={saving} onClick={saveAndNew}>
						New Project
					</MenubarItem>
					<MenubarSeparator />
					<MenubarItem onClick={() => setPreferencesOpen(true)}>
						Preferences
						<MenubarShortcut>CTRL + ,</MenubarShortcut>
					</MenubarItem>
					<MenubarSeparator />
					<MenubarItem>Print</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<Button
					className="ml-auto"
					variant="ghost"
					size="icon"
					onClick={toggleFullscreen}
				>
					{!isFullscreen ? <Maximize /> : <Minimize />}
				</Button>
			</MenubarMenu>

			<PreferencesPanel
				open={preferencesOpen}
				setOpen={setPreferencesOpen}
			/>
		</Menubar>
	);
}

function PreferencesPanel({
	open,
	setOpen,
}: {
	open: boolean;
	setOpen: (open: boolean) => void;
}) {
	const preferences = usePreferences();

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Preferences</DialogTitle>
					<DialogDescription asChild>
						<div>
							Here you can adjust your preferences for the
							application.
							<div className="mt-4 flex flex-col gap-4">
								<div className="flex flex-col">
									<Label htmlFor="theme-select">Theme:</Label>
									<Select
										value={preferences.theme}
										onValueChange={(value) => {
											if (
												value !== "light" &&
												value !== "dark"
											) {
												console.warn(
													"Invalid theme selected:",
													value,
												);
												return;
											}
											preferences.setTheme(value);
										}}
									>
										<SelectTrigger
											className="h-10 w-full"
											id="theme-select"
										>
											<SelectValue placeholder="Select theme" />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												<SelectLabel>
													Available Themes
												</SelectLabel>
												<SelectItem value="light">
													Light
												</SelectItem>
												<SelectItem value="dark">
													Dark
												</SelectItem>
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>
								<div className="flex flex-col">
									<Label htmlFor="save-interval">
										Auto-save Interval (seconds):
									</Label>
									<Input
										id="save-interval"
										type="number"
										min={1}
										value={preferences.saveInterval}
										onChange={(e) => {
											const value = parseInt(
												e.target.value,
												10,
											);
											if (isNaN(value) || value < 1) {
												console.warn(
													"Invalid save interval:",
													e.target.value,
												);
												return;
											}
											preferences.setSaveInterval(value);
										}}
										className="h-10 w-full"
									/>
								</div>
								<div className="flex flex-col">
									<Label
										htmlFor="grid-color"
										className="mb-2 block"
									>
										Grid Color:
									</Label>
									<ColorPicker
										defaultColor={preferences.gridColor}
										onChangeComplete={(color) => {
											preferences.setGridColor(color.hex);
										}}
									/>
								</div>

								<div className="flex flex-row gap-2">
									<Label
										htmlFor="debug-text"
										className="mb-2 block"
									>
										<Tooltip>
											<TooltipTrigger asChild>
												<Info className="mr-[0.5] inline h-3" />
											</TooltipTrigger>
											<TooltipContent>
												<p>
													Debug text displays
													additional information about
													the 3D scene, such as object
													coordinates and rendering
													details. It can be useful
													for troubleshooting but may
													clutter the view.
												</p>
											</TooltipContent>
										</Tooltip>
										Debug Text:
									</Label>
									<Switch
										id="debug-text"
										checked={preferences.debugText}
										onCheckedChange={(checked) =>
											preferences.setDebugText(checked)
										}
									/>
								</div>
								<div className="flex flex-row gap-2">
									<Label
										htmlFor="ssao-enabled"
										className="mb-2 block"
									>
										<Tooltip>
											<TooltipTrigger asChild>
												<Info className="mr-[0.5] inline h-3" />
											</TooltipTrigger>
											<TooltipContent>
												<p>
													Screen Space Ambient
													Occlusion (SSAO) is a
													shading method that adds
													soft shadows to enhance
													depth perception in 3D
													scenes. It can improve
													visual realism but may
													impact performance.
												</p>
											</TooltipContent>
										</Tooltip>
										SSAO Enabled:
									</Label>
									<Switch
										id="ssao-enabled"
										checked={preferences.SSAOEnabled}
										onCheckedChange={(checked) =>
											preferences.setSSAOEnabled(checked)
										}
									/>
								</div>
								<div className="flex flex-row gap-2">
									<Label
										htmlFor="dof-enabled"
										className="mb-2 block"
									>
										<Tooltip>
											<TooltipTrigger asChild>
												<Info className="mr-[0.5] inline h-3" />
											</TooltipTrigger>
											<TooltipContent>
												<p>
													Depth of Field (DOF) creates
													a blurred effect on objects
													outside the focus area,
													simulating camera lens
													behavior. It enhances
													realism but can be
													resource-intensive and may
													affect performance.
												</p>
											</TooltipContent>
										</Tooltip>
										Depth of Field Enabled:
									</Label>
									<Switch
										id="dof-enabled"
										checked={preferences.DOFEnabled}
										onCheckedChange={(checked) =>
											preferences.setDOFEnabled(checked)
										}
									/>
								</div>
								<div className="flex flex-row gap-2">
									<Label
										htmlFor="control-damping-enabled"
										className="mb-2 block"
									>
										<Tooltip>
											<TooltipTrigger asChild>
												<Info className="mr-[0.5] inline h-3" />
											</TooltipTrigger>
											<TooltipContent>
												<p>
													Enabling control damping
													makes camera movements
													smoother by adding inertia.
													This results in a more
													natural feel when orbiting
													or panning the view, but may
													introduce a slight delay in
													responsiveness.
												</p>
											</TooltipContent>
										</Tooltip>
										Orbit Controls Damping:
									</Label>
									<Switch
										id="control-damping"
										checked={preferences.controlDamping}
										onCheckedChange={(checked) =>
											preferences.setControlDamping(
												checked,
											)
										}
									/>
								</div>
							</div>
						</div>
					</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
}

export default AppMenu;
