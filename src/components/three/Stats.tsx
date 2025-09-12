/** @format */

import React, { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";

import { usePreferences } from "@/stores/PreferencesStore";

type RenderInfo = {
	calls: number;
	frame: number;
	lines: number;
	points: number;
	triangles: number;
};

let fpsSubscribers: ((fps: number) => void)[] = [];
let renderInfoSubscribers: ((info: RenderInfo) => void)[] = [];

function subscribeToFps(cb: (fps: number) => void) {
	fpsSubscribers.push(cb);
	return () => {
		fpsSubscribers = fpsSubscribers.filter((s) => s !== cb);
	};
}

function subscribeToRenderInfo(cb: (info: RenderInfo) => void) {
	renderInfoSubscribers.push(cb);
	return () => {
		renderInfoSubscribers = renderInfoSubscribers.filter((s) => s !== cb);
	};
}

// 1) FPS tracker runs inside Canvas but returns null (no DOM)
export function FpsTracker() {
	const frames = useRef(0);
	const lastTime = useRef(performance.now());

	const { gl } = useThree();

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

			const info = gl.info;
			renderInfoSubscribers.forEach((cb) => cb(info.render));
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

	const [renderInfo, setRenderInfo] = useState<RenderInfo>({
		calls: 0,
		frame: 0,
		lines: 0,
		points: 0,
		triangles: 0,
	});

	useEffect(() => {
		return subscribeToFps(setFps);
	}, []);

	useEffect(() => {
		return subscribeToRenderInfo(setRenderInfo);
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
					<hr className="border-border my-1 border-t" />

					<p>Draw Calls: {renderInfo.calls}</p>
					<p>Frame: {renderInfo.frame}</p>
					<p>Triangles: {renderInfo.triangles}</p>
					<p>Lines: {renderInfo.lines}</p>
					<p>Points: {renderInfo.points}</p>

					<hr className="border-border my-1 border-t" />

					<p>Debug Text: {preferences.debugText ? "On" : "Off"}</p>
					<p>SSAO: {preferences.SSAOEnabled ? "On" : "Off"}</p>
					<p>
						Depth of Field: {preferences.DOFEnabled ? "On" : "Off"}
					</p>
					<p>
						Control Damping:{" "}
						{preferences.controlDamping ? "On" : "Off"}
					</p>
				</>
			)}
		</div>
	);
}
