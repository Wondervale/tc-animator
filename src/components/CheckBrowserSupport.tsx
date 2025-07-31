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
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import React, { useEffect, useState } from "react";

// Utility function to check browser feature support
function CheckBrowserSupport(): string[] {
	const unsupported: string[] = [];

	// File System Access API
	const hasFileSystemAPI = "showOpenFilePicker" in window;
	if (!hasFileSystemAPI) unsupported.push("File System Access API");

	// WebGL Support
	const canvas = document.createElement("canvas");
	const hasWebGL = !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
	if (!hasWebGL) unsupported.push("WebGL / 3D Graphics");

	// Wavesurfer.js dependencies
	const hasAudioContext = "AudioContext" in window || "webkitAudioContext" in window;
	const hasRAF = "requestAnimationFrame" in window;
	if (!hasAudioContext) unsupported.push("Web Audio API (AudioContext)");
	if (!hasRAF) unsupported.push("requestAnimationFrame");

	return unsupported;
}

const FeatureCheckDialog: React.FC = () => {
	const [unsupportedFeatures, setUnsupportedFeatures] = useState<string[]>([]);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const unsupported = CheckBrowserSupport();
		if (unsupported.length > 0) {
			setUnsupportedFeatures(unsupported);
			setOpen(true);
		}
	}, []);

	if (!open) return null;

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<span />
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Unsupported Browser Features</AlertDialogTitle>
					<AlertDialogDescription>
						This application requires the following features to function properly:
						<ul className="my-2 list-disc list-inside">
							{unsupportedFeatures.map((feature) => (
								<li key={feature}>{feature}</li>
							))}
						</ul>
						Please use a modern Chromium based browser (like Chrome, Edge, or Brave) to use this
						application.
					</AlertDialogDescription>
				</AlertDialogHeader>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default FeatureCheckDialog;
