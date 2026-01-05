/*
 *   Copyright (c) 2026 Foxxite | Articca
 *   All rights reserved.
 */

import TimelineRuler from "@/components/timeline/TimelineRuler";
import { Slider } from "@/components/ui/slider";
import { buildWaveformPoints } from "@/lib/audioData";
import Color from "colorizr";
import { useEffect, useRef, useState } from "react";
import { Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import { type TimelineRenderSettings, type TimelineRow } from "./timelineTypes";

const CanvasTimeline = ({ rows }: { rows: TimelineRow[] }) => {
	const [canvasWidth, setCanvasWidth] = useState(800);
	const [canvasHeight, setCanvasHeight] = useState(40);
	const containerRef = useRef<HTMLDivElement | null>(null);

	const [timeScale, setTimeScale] = useState(0.1); // pixels per ms

	const [renderSettings, setRenderSettings] =
		useState<TimelineRenderSettings>({
			rowNameWidth: 0,
			rowHeight: 40,

			timelinePadding: 10,
			keyframeRadius: 6,

			primaryColor: "#007bff",
			textColor: "#000000",
			keyframeColor: "#007bff",
			gridColor: "#888888",
		});

	useEffect(() => {
		if (typeof document === "undefined") return;

		const setDocumentColors = () => {
			const fg =
				getComputedStyle(document.body).getPropertyValue(
					"--foreground",
				) || "#000000";
			const primary =
				getComputedStyle(document.body).getPropertyValue(
					"--secondary",
				) || "#007bff";
			const card =
				getComputedStyle(document.body).getPropertyValue("--card") ||
				"#888888";

			setRenderSettings((settings) => ({
				...settings,
				primaryColor: new Color(primary).hex,
				textColor: new Color(fg).hex,
				keyframeColor: new Color("oklch(82.8% 0.189 84.429)").hex,
				gridColor: new Color(card).hex,
			}));
		};

		setDocumentColors();

		const observer = new MutationObserver((mutations) => {
			for (const m of mutations) {
				if (
					m.type === "attributes" &&
					(m as MutationRecord).attributeName === "class"
				) {
					setDocumentColors();
				}
			}
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});

		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const updateSize = () => {
			if (containerRef.current) {
				const el = containerRef.current;
				// bounding rect may include scrollbar in some browsers, subtract the vertical scrollbar width
				const rect = el.getBoundingClientRect();
				const scrollbarWidth = el.offsetWidth - el.clientWidth;
				setCanvasWidth(
					Math.max(0, Math.floor(rect.width - scrollbarWidth)),
				);
			}
		};

		updateSize();

		// Recalc size if window resizes
		window.addEventListener("resize", updateSize);

		// Recalc size if parent container resizes
		const resizeObserver = new ResizeObserver(() => {
			updateSize();
		});
		if (containerRef.current) {
			resizeObserver.observe(containerRef.current);
		}

		return () => {
			window.removeEventListener("resize", updateSize);
			resizeObserver.disconnect();
		};
	}, []);

	useEffect(() => {
		if (!rows || rows.length == 0) return;

		setCanvasHeight(
			rows.length * renderSettings.rowHeight + renderSettings.rowHeight,
		);

		// Calculate required width based on row names
		const tempCanvas = document.createElement("canvas");
		const context = tempCanvas.getContext("2d");
		if (context) {
			context.font = "14px sans-serif"; // Use same font as canvas

			let maxWidth = 0;
			rows.forEach((row, index) => {
				const title = row.title || `Row ${index + 1}`;
				const width = context.measureText(title).width;
				if (width > maxWidth) {
					maxWidth = width;
				}
			});

			setRenderSettings((settings) => ({
				...settings,
				rowNameWidth: Math.ceil(maxWidth + 20), // Add some padding
			}));
		}
	}, [rows, renderSettings.rowHeight]);

	useEffect(() => {
		if (!rows || rows.length == 0) return;

		// Add audio row if not present
		const hasAudioRow = rows.some((row) => row.isAudio);
		if (!hasAudioRow) {
			rows.unshift({ title: "Audio", isAudio: true, keyframes: [] });
		}
	}, [rows]);

	return (
		<div
			className="w-full h-full overflow-y-auto overflow-x-hidden relative"
			ref={containerRef}
		>
			<div className="w-full p-2 bg-card sticky top-0 z-10">
				<p>
					Timeline Toolbar Placeholder Width: {canvasWidth}px, Height:{" "}
					{canvasHeight}px{" "}
				</p>

				<Slider
					value={[timeScale]}
					onValueChange={(value) => {
						setTimeScale(Number(value[0]));
					}}
					min={0.04}
					max={1}
					step={0.01}
				/>

				{JSON.stringify(renderSettings)}
			</div>

			<Stage width={canvasWidth} height={canvasHeight}>
				<Layer>
					{/* Render row names */}
					{rows.map((row, rowIndex) => {
						const y =
							rowIndex * renderSettings.rowHeight +
							renderSettings.rowHeight;
						return (
							<g key={rowIndex}>
								{/* Row name background */}
								<Rect
									x={0}
									y={y}
									width={renderSettings.rowNameWidth}
									height={renderSettings.rowHeight}
									fill={renderSettings.primaryColor}
									strokeEnabled={true}
									stroke={renderSettings.primaryColor}
									strokeWidth={1}
								/>
								{/* Row title */}
								<Text
									x={8}
									y={y + renderSettings.rowHeight / 2 - 7}
									text={row.title || `Row ${rowIndex + 1}`}
									fontSize={14}
									fill={renderSettings.textColor}
								/>
							</g>
						);
					})}
				</Layer>

				<Waveform
					audioUrl="./sample.mp3"
					timeScale={timeScale}
					renderSettings={renderSettings}
				/>

				<Layer>
					{/* Keyframes */}
					{rows.map((row, rowIndex) => {
						const y =
							rowIndex * renderSettings.rowHeight +
							renderSettings.rowHeight;

						return (
							<Group key={rowIndex}>
								<Rect
									x={renderSettings.rowNameWidth}
									y={y}
									width={canvasWidth}
									height={renderSettings.rowHeight}
									fill={renderSettings.gridColor}
									strokeEnabled={true}
									stroke={new Color(
										renderSettings.gridColor,
									).darken(0.2)}
									strokeWidth={1}
									opacity={0.1}
								/>

								{row.keyframes.map((kf, kfIndex) => {
									const x =
										renderSettings.rowNameWidth +
										renderSettings.timelinePadding +
										kf.val * timeScale;
									const ky = y + renderSettings.rowHeight / 2;
									return (
										<Rect
											key={kfIndex}
											x={x}
											y={ky}
											width={
												renderSettings.keyframeRadius *
												2
											}
											height={
												renderSettings.keyframeRadius *
												2
											}
											offsetX={
												renderSettings.keyframeRadius
											}
											offsetY={
												renderSettings.keyframeRadius
											}
											fill={renderSettings.keyframeColor}
											rotation={45}
										/>
									);
								})}
							</Group>
						);
					})}
				</Layer>

				<TimelineRuler
					renderSettings={renderSettings}
					canvasWidth={canvasWidth}
					canvasHeight={canvasHeight}
					rowNameOffset={renderSettings.rowNameWidth}
					timeScale={timeScale}
				/>
			</Stage>
		</div>
	);
};

function Waveform({
	audioUrl,
	timeScale,
	renderSettings,
}: {
	audioUrl: string;
	timeScale: number;
	renderSettings: TimelineRenderSettings;
}) {
	const [points, setPoints] = useState<number[]>([]);
	const audioBufferRef = useRef<AudioBuffer | null>(null);
	const [audioReady, setAudioReady] = useState(false);

	/* ---------------------------------------------
	 * 1. Fetch & decode audio
	 * --------------------------------------------- */
	useEffect(() => {
		let cancelled = false;
		setAudioReady(false);
		audioBufferRef.current = null;

		async function loadAudio() {
			if (!audioUrl) return;

			try {
				const res = await fetch(audioUrl);
				const arrayBuffer = await res.arrayBuffer();

				const ctx = new AudioContext();
				const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
				await ctx.close?.();

				if (cancelled) return;

				audioBufferRef.current = audioBuffer;
				setAudioReady(true); // 🔑 trigger waveform effect
			} catch {
				// ignore
			}
		}

		loadAudio();

		return () => {
			cancelled = true;
		};
	}, [audioUrl]);

	/* ---------------------------------------------
	 * 2. Build waveform when ready or scale changes
	 * --------------------------------------------- */
	useEffect(() => {
		if (!audioReady) return;

		const buf = audioBufferRef.current;
		if (!buf) return;

		const height = renderSettings.rowHeight;

		const { points } = buildWaveformPoints(buf, timeScale, height);

		setPoints(points);
	}, [audioReady, timeScale, renderSettings.rowHeight]);

	return (
		<Layer>
			<Line
				x={renderSettings.rowNameWidth + renderSettings.timelinePadding}
				y={renderSettings.rowHeight}
				points={points}
				stroke={renderSettings.keyframeColor}
				strokeWidth={1}
				listening={false}
			/>
		</Layer>
	);
}

export default CanvasTimeline;
