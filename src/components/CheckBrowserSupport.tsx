/**
 * Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 *
 * @format
 */

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import React, { useEffect, useState } from "react";

import { supported } from "browser-fs-access";

// Utility function to check browser feature support
function CheckBrowserSupport(): string[] {
	const unsupported: string[] = [];

	// WebGL Support
	const canvas = document.createElement("canvas");
	const hasWebGL = !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
	if (!hasWebGL) unsupported.push("WebGL / 3D Graphics");

	// Wavesurfer.js dependencies
	const hasAudioContext = "AudioContext" in window || "webkitAudioContext" in window;
	if (!hasAudioContext) unsupported.push("Web Audio API (AudioContext)");

	const hasRAF = "requestAnimationFrame" in window;
	if (!hasRAF) unsupported.push("Animation Frame API (requestAnimationFrame)");

	return unsupported;
}

const FeatureCheckDialog: React.FC = () => {
	const [unsupportedFeatures, setUnsupportedFeatures] = useState<string[]>([]);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const unsupported = CheckBrowserSupport();
		if (unsupported.length > 0 || !supported) {
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
					<AlertDialogTitle>Missing Browser Capabilities</AlertDialogTitle>

					<AlertDialogDescription>
						This app requires certain browser features to work correctly. Your current browser is missing
						the following capabilities:
						<ul className="my-2 list-disc list-inside">
							{unsupportedFeatures.map((feature) => (
								<li key={feature}>{feature}</li>
							))}

							{!supported && (
								<li>
									File System Access API
									<br />
									<span className="text-xs text-muted-foreground">
										Used for autosave and loading files directly. Without it, you'll need to
										manually download and upload your files each time.
									</span>
								</li>
							)}
						</ul>
						To use all features, switch to a modern Chromium-based browser like <strong>Chrome</strong>,{" "}
						<strong>Edge</strong>, or <strong>Brave</strong>.
					</AlertDialogDescription>
				</AlertDialogHeader>
				{!supported && unsupportedFeatures.length === 0 && (
					<AlertDialogFooter>
						<AlertDialogCancel>Acknowledge</AlertDialogCancel>
					</AlertDialogFooter>
				)}
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default FeatureCheckDialog;
