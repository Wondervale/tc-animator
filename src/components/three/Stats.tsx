/** @format */

import React, { useEffect, useRef, useState } from "react";

import { useFrame } from "@react-three/fiber";
import { usePreferences } from "@/stores/PreferencesStore";

let fpsSubscribers: ((fps: number) => void)[] = [];

function subscribeToFps(cb: (fps: number) => void) {
	fpsSubscribers.push(cb);
	return () => {
		fpsSubscribers = fpsSubscribers.filter((s) => s !== cb);
	};
}

// 1) FPS tracker runs inside Canvas but returns null (no DOM)
export function FpsTracker() {
	const frames = useRef(0);
	const lastTime = useRef(performance.now());

	useFrame(() => {
		frames.current++;
		const now = performance.now();
		const delta = now - lastTime.current;
		if (delta > 500) {
			const fps = Math.round((frames.current * 1000) / delta);
			frames.current = 0;
			lastTime.current = now;

			// Notify subscribers outside Canvas
			fpsSubscribers.forEach((cb) => cb(fps));
		}
	});

	return null; // no JSX, so no div inside Canvas
}

// 2) Pure React component outside Canvas to display FPS
export function FpsDisplay({
	position = "top-right",
}: {
	position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
	const preferences = usePreferences();

	const [fps, setFps] = useState(0);

	useEffect(() => {
		return subscribeToFps(setFps);
	}, []);

	const positionStyle: React.CSSProperties = {
		top: position.includes("top") ? 8 : undefined,
		bottom: position.includes("bottom") ? 8 : undefined,
		left: position.includes("left") ? 8 : undefined,
		right: position.includes("right") ? 8 : undefined,
	};

	return (
		<div
			className="text-muted-foreground pointer-events-none fixed z-10 text-right font-mono text-sm"
			style={{ ...positionStyle }}
		>
			<p>{fps} FPS</p>

			{preferences.debugText && (
				<>
					<p>Debug Text: {preferences.debugText ? "On" : "Off"}</p>
					<p>Antialiasing: {preferences.antialiasing}</p>
					<p>SSAO: {preferences.SSAOEnabled ? "On" : "Off"}</p>
					<p>
						Depth of Field: {preferences.DOFEnabled ? "On" : "Off"}
					</p>
				</>
			)}
		</div>
	);
}
