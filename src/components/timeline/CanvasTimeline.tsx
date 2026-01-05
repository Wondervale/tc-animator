/*
 *   Copyright (c) 2026 Foxxite | Articca
 *   All rights reserved.
 */

import TimelineRuler from "@/components/timeline/TimelineRuler";
import { Slider } from "@/components/ui/slider";
import { buildWaveformPoints } from "@/lib/audioData";
import Color from "colorizr";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import { type TimelineRenderSettings, type TimelineRow } from "./timelineTypes";

import { nanoid } from "nanoid";

/* -----------------------------
 * Hook: observe theme colors
 * ----------------------------- */
function useThemeColors() {
	const [colors, setColors] = useState(() => getColors());

	useEffect(() => {
		const observer = new MutationObserver(() => setColors(getColors()));
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});
		return () => observer.disconnect();
	}, []);

	return colors;
}

function getColors() {
	const s = getComputedStyle(document.body);
	return {
		primaryColor: new Color(s.getPropertyValue("--secondary") || "#007bff")
			.hex,
		textColor: new Color(s.getPropertyValue("--foreground") || "#000").hex,
		keyframeColor: new Color("oklch(82.8% 0.189 84.429)").hex,
		keyframeSelectedColor: new Color("oklch(63.7% 0.237 25.331)").hex,
		keyframeHighlightedColor: new Color("oklch(70.5% 0.213 47.604)").hex,
		gridColor: new Color(s.getPropertyValue("--card") || "#888").hex,
	};
}

/* -----------------------------
 * CanvasTimeline Component
 * ----------------------------- */
const CanvasTimeline = ({ rows }: { rows: TimelineRow[] }) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [canvasWidth, setCanvasWidth] = useState(800);
	const [timeScale, setTimeScale] = useState(0.1); // pixels per ms

	/* -----------------------------
	 * Static settings
	 * ----------------------------- */
	const staticSettings = useMemo(
		() => ({
			rowHeight: 40,
			timelinePadding: 10,
			keyframeRadius: 6,
		}),
		[],
	);

	/* -----------------------------
	 * Theme colors
	 * ----------------------------- */
	const themeSettings = useThemeColors();

	/* -----------------------------
	 * Compute rows with Audio row prepended
	 * ----------------------------- */
	const computedRows = useMemo(() => {
		if (!rows) return [];
		if (rows.some((r) => r.isAudio)) return rows;
		const rowsWithAudio = [
			{ title: "Audio", isAudio: true, keyframes: [] },
			...rows,
		];

		rowsWithAudio.forEach((r, i) => {
			if (!r.title) r.title = `Row ${i + 1}`;
			if (!r.id) r.id = nanoid();

			r.keyframes.forEach((kf) => {
				if (!kf.id) kf.id = nanoid();
			});
		});

		return rowsWithAudio;
	}, [rows]);

	/* -----------------------------
	 * Canvas layout calculations
	 * ----------------------------- */
	const rowNameWidth = useMemo(() => {
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		if (!ctx) return 0;

		ctx.font = "14px sans-serif";
		return Math.ceil(
			Math.max(
				...computedRows.map(
					(r, i) => ctx.measureText(r.title || `Row ${i + 1}`).width,
				),
			) + 20,
		);
	}, [computedRows]);

	const renderSettings: TimelineRenderSettings = useMemo(
		() => ({
			...staticSettings,
			...themeSettings,
			rowNameWidth,
		}),
		[staticSettings, themeSettings, rowNameWidth],
	);

	const canvasHeight = useMemo(
		() =>
			computedRows.length * renderSettings.rowHeight +
			renderSettings.rowHeight,
		[computedRows.length, renderSettings.rowHeight],
	);

	/* -----------------------------
	 * Resize handling
	 * ----------------------------- */
	useEffect(() => {
		const updateSize = () => {
			if (containerRef.current) {
				const el = containerRef.current;
				const rect = el.getBoundingClientRect();
				const scrollbarWidth = el.offsetWidth - el.clientWidth;
				setCanvasWidth(
					Math.max(0, Math.floor(rect.width - scrollbarWidth)),
				);
			}
		};

		updateSize();

		const resizeObserver = new ResizeObserver(updateSize);
		if (containerRef.current) resizeObserver.observe(containerRef.current);

		return () => resizeObserver.disconnect();
	}, []);

	/* -----------------------------
	 * Precompute darkened grid color
	 * ----------------------------- */
	const darkGridColor = useMemo(
		() => new Color(renderSettings.gridColor).darken(0.2),
		[renderSettings.gridColor],
	);

	/* -----------------------------
	 * Render
	 * ----------------------------- */
	return (
		<div
			className="w-full h-full overflow-y-auto overflow-x-hidden relative"
			ref={containerRef}
		>
			<div className="w-full p-2 bg-card sticky top-0 z-10">
				<p>
					Timeline Toolbar Placeholder Width: {canvasWidth}px, Height:{" "}
					{canvasHeight}px
				</p>
				<Slider
					value={[timeScale]}
					onValueChange={(value) => setTimeScale(Number(value[0]))}
					min={0.04}
					max={1}
					step={0.01}
				/>
				{JSON.stringify(renderSettings)}
			</div>

			<Stage width={canvasWidth} height={canvasHeight}>
				{/* Timeline ruler */}
				<TimelineRuler
					renderSettings={renderSettings}
					canvasWidth={canvasWidth}
					canvasHeight={canvasHeight}
					rowNameOffset={renderSettings.rowNameWidth}
					timeScale={timeScale}
				/>

				{/* Row headers */}
				<Layer listening={false} perfectDrawEnabled={false}>
					{computedRows.map((row, rowIndex) => (
						<RowHeader
							key={row.id ?? row.title ?? rowIndex}
							row={row}
							y={(rowIndex + 1) * renderSettings.rowHeight}
							settings={renderSettings}
							canvasWidth={canvasWidth}
						/>
					))}
				</Layer>

				{/* Waveform */}
				<Waveform
					audioUrl="./sample.mp3"
					timeScale={timeScale}
					renderSettings={renderSettings}
				/>

				{/* Keyframes */}
				<Layer listening={true} perfectDrawEnabled={false}>
					{computedRows.map((row, rowIndex) => (
						<KeyframeRow
							key={row.id ?? row.title ?? rowIndex}
							row={row}
							y={(rowIndex + 1) * renderSettings.rowHeight}
							settings={renderSettings}
							canvasWidth={canvasWidth}
							darkGridColor={darkGridColor}
							timeScale={timeScale}
						/>
					))}
				</Layer>
			</Stage>
		</div>
	);
};

/* -----------------------------
 * Memoized Row Header
 * ----------------------------- */
const RowHeader = memo(function RowHeader({
	row,
	y,
	settings,
	canvasWidth,
}: {
	row: TimelineRow;
	y: number;
	settings: TimelineRenderSettings;
	canvasWidth: number;
}) {
	return (
		<Group>
			<Rect
				x={0}
				y={y + 1}
				width={settings.rowNameWidth}
				height={settings.rowHeight - 1}
				fill={settings.primaryColor}
				stroke={settings.primaryColor}
				strokeWidth={1}
				listening={false}
			/>
			<Text
				x={8}
				y={y + settings.rowHeight / 2 - 7}
				text={row.title || row.id}
				fontSize={14}
				fill={settings.textColor}
				listening={false}
			/>

			{/* Add a bottom border to each row */}
			<Line
				points={[
					0,
					y + settings.rowHeight,
					canvasWidth,
					y + settings.rowHeight,
				]}
				stroke={settings.textColor}
				strokeWidth={1}
				listening={false}
				opacity={0.3}
			/>
		</Group>
	);
});

/* -----------------------------
 * Memoized Keyframe Row
 * ----------------------------- */
const KeyframeRow = memo(function KeyframeRow({
	row,
	y,
	settings,
	canvasWidth,
	darkGridColor,
	timeScale,
}: {
	row: TimelineRow;
	y: number;
	settings: TimelineRenderSettings;
	canvasWidth: number;
	darkGridColor: string;
	timeScale: number;
}) {
	const [highlightedKeyframeId, setHighlightedKeyframeId] = useState<
		string | null
	>(null);
	const [selectedKeyframeIds, setSelectedKeyframeIds] = useState<
		string[] | null
	>(null);

	return (
		<Group>
			{/* Background grid */}
			<Rect
				x={settings.rowNameWidth}
				y={y}
				width={canvasWidth}
				height={settings.rowHeight}
				fill={settings.gridColor}
				stroke={darkGridColor}
				strokeWidth={1}
				opacity={0.1}
				listening={false}
			/>

			<Text
				x={settings.rowNameWidth + 5}
				y={y + 5}
				text={
					highlightedKeyframeId ? `KF: ${highlightedKeyframeId}` : ""
				}
				fontSize={12}
				fill={settings.textColor}
				listening={false}
			/>

			<Text
				x={settings.rowNameWidth + 5}
				y={y + 20}
				text={
					selectedKeyframeIds && selectedKeyframeIds.length > 0
						? `Selected: ${selectedKeyframeIds.join(", ")}`
						: ""
				}
				fontSize={12}
				fill={settings.textColor}
				listening={false}
			/>

			{/* Keyframes */}
			{row.keyframes.map((kf, i) => {
				const x =
					settings.rowNameWidth +
					settings.timelinePadding +
					kf.val * timeScale;
				const ky = y + settings.rowHeight / 2;
				return (
					<Rect
						key={kf.id ?? i}
						x={x}
						y={ky}
						width={settings.keyframeRadius * 2}
						height={settings.keyframeRadius * 2}
						offsetX={settings.keyframeRadius}
						offsetY={settings.keyframeRadius}
						fill={
							highlightedKeyframeId === kf.id
								? settings.keyframeHighlightedColor
								: selectedKeyframeIds?.includes(kf.id || "")
									? settings.keyframeSelectedColor
									: settings.keyframeColor
						}
						rotation={45}
						listening={true}
						onMouseEnter={() => {
							if (kf.id) {
								document.body.style.cursor = "pointer";
								setHighlightedKeyframeId(kf.id);
							}
						}}
						onMouseLeave={() => {
							document.body.style.cursor = "default";
							setHighlightedKeyframeId(null);
						}}
						onClick={() => {
							if (!kf.id) return;

							console.log("Click keyframe", kf.id);

							setSelectedKeyframeIds((prev) => {
								if (prev?.includes(kf.id!)) {
									return prev.filter((id) => id !== kf.id);
								} else {
									return prev ? [...prev, kf.id!] : [kf.id!];
								}
							});
						}}
						draggable
						onDragEnd={(e) => {
							const newX = e.target.x();
							const newVal =
								(newX -
									settings.rowNameWidth -
									settings.timelinePadding) /
								timeScale;
							console.log(
								`Keyframe ${kf.id} moved to new val: ${newVal}`,
							);
							// Here you would typically update the keyframe value in state
						}}
					/>
				);
			})}
		</Group>
	);
});

/* -----------------------------
 * Waveform Component
 * ----------------------------- */
function Waveform({
	audioUrl,
	timeScale,
	renderSettings,
}: {
	audioUrl: string;
	timeScale: number;
	renderSettings: TimelineRenderSettings;
}) {
	const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

	/* Load audio once */
	useEffect(() => {
		let cancelled = false;
		setAudioBuffer(null);

		async function loadAudio() {
			if (!audioUrl) return;
			try {
				const res = await fetch(audioUrl);
				const arrayBuffer = await res.arrayBuffer();
				const ctx = new AudioContext();
				const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
				await ctx.close?.();
				if (!cancelled) setAudioBuffer(audioBuffer);
			} catch {
				// ignore
			}
		}
		loadAudio();

		return () => {
			cancelled = true;
		};
	}, [audioUrl]);

	/* Build waveform points */
	const points = useMemo(() => {
		if (!audioBuffer) return [];
		const { points } = buildWaveformPoints(
			audioBuffer,
			timeScale,
			renderSettings.rowHeight,
		);
		return points;
	}, [timeScale, renderSettings.rowHeight, audioBuffer]);

	return (
		<Layer listening={false} perfectDrawEnabled={false}>
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
