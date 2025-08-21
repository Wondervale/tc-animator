/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Maximize, Minimize, X } from "lucide-react";
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
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { usePreferences } from "@/stores/PreferencesStore";
import { useProjectStore } from "@/stores/ProjectStore";

// ...existing code...
function AppMenu() {
	const projectStore = useProjectStore();

	const [isFullscreen, setIsFullscreen] = useState(document.fullscreenElement);
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
			document.removeEventListener("fullscreenchange", handleFullscreenChange);
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
			if (event.key === "s" && (event.ctrlKey || event.metaKey) && projectStore.cart) {
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
			className="rounded-none">
			<div className="flex items-center gap-2 bg-card px-2">
				{projectStore.metadata.projectName || "Untitled Project"}

				<Button className="h-4 w-4" variant="ghost" size="icon" disabled={saving} onClick={saveAndNew}>
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
					<MenubarItem disabled={saving} onClick={async () => projectStore.saveProject()}>
						Save Project <MenubarShortcut>CTRL + S</MenubarShortcut>
					</MenubarItem>
					<MenubarItem disabled={saving} onClick={async () => projectStore.saveProject(true)}>
						Save Project As
					</MenubarItem>
					<MenubarSeparator />
					<MenubarItem disabled={saving} onClick={async () => projectStore.loadProjectFromFile()}>
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
				<Button className="ml-auto" variant="ghost" size="icon" onClick={toggleFullscreen}>
					{!isFullscreen ? <Maximize /> : <Minimize />}
				</Button>
			</MenubarMenu>

			<PreferencesPanel open={preferencesOpen} setOpen={setPreferencesOpen} />
		</Menubar>
	);
}

// Update PreferencesPanel to accept open/setOpen props
function PreferencesPanel({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
	const preferences = usePreferences();

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Preferences</DialogTitle>
					<DialogDescription>
						Here you can adjust your preferences for the application.
						<div className="mt-4">
							<Label htmlFor="theme-select" className="block mb-2">
								Theme:
							</Label>
							<Select
								value={preferences.theme}
								onValueChange={(value) => {
									if (value !== "light" && value !== "dark") {
										console.warn("Invalid theme selected:", value);
										return;
									}

									preferences.setTheme(value);
								}}>
								<SelectTrigger className="w-full" id="theme-select">
									<SelectValue placeholder="Select theme" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>Available Themes</SelectLabel>
										<SelectItem value="light">Light</SelectItem>
										<SelectItem value="dark">Dark</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
					</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
}

export default AppMenu;
