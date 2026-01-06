/*
 *   Copyright (c) 2026 Foxxite | Articca
 *   All rights reserved.
 */

import { Slider } from "@/components/ui/slider";
import { buildWaveformPoints } from "@/lib/audioData";
import Color from "colorizr";
import { format } from "date-fns";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import { type TimelineRenderSettings, type TimelineRow } from "./timelineTypes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PauseIcon, PlayIcon } from "lucide-react";
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
		backgroundColor: new Color(s.getPropertyValue("--background") || "#fff")
			.hex,
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

	const [currentTime, setCurrentTime] = useState(0); // ms
	const [isPlaying, setIsPlaying] = useState(false);

	const [audioUrl, setAudioUrl] = useState<string | null>("./laxed.mp3");
	const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

	const [scrollX, setScrollX] = useState(0);

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

	const darkGridColor = useMemo(
		() => new Color(renderSettings.gridColor).darken(0.2),
		[renderSettings.gridColor],
	);

	const rowOffsets = useMemo(() => {
		const offsets: number[] = [];
		let y = renderSettings.rowHeight;
		for (const row of computedRows) {
			offsets.push(y);
			y += renderSettings.rowHeight * (row.isAudio ? 2 : 1);
		}
		return offsets;
	}, [computedRows, renderSettings.rowHeight]);

	const canvasHeight = useMemo(
		() => rowOffsets[rowOffsets.length - 1] + renderSettings.rowHeight,
		[rowOffsets, renderSettings.rowHeight],
	);

	// total timeline width in pixels (based on content)
	const [audioDurationMs, setAudioDurationMs] = useState<number | null>(null);

	useEffect(() => {
		const audio = audioPlayerRef.current;
		if (!audio) {
			setAudioDurationMs(null);
			return;
		}

		const updateDuration = () => {
			const d = audio.duration;
			if (!isNaN(d) && d > 0) setAudioDurationMs(d * 1000);
			else setAudioDurationMs(0);
		};

		// If metadata already loaded, set immediately
		updateDuration();

		audio.addEventListener("loadedmetadata", updateDuration);
		return () => {
			audio.removeEventListener("loadedmetadata", updateDuration);
		};
	}, [audioUrl]);

	const timelineWidth = useMemo(() => {
		// assume max keyframe or audio length in ms
		const maxKeyframeMs = Math.max(
			...computedRows.flatMap((r) =>
				r.keyframes.map((kf) => kf.val ?? 0),
			),
			0,
		);

		const maxAudioMs = audioDurationMs ?? 0;

		const maxMs = Math.max(3 * 60 * 1000, maxKeyframeMs, maxAudioMs);

		// add padding so playhead / waveform can extend
		return (
			renderSettings.rowNameWidth +
			renderSettings.timelinePadding +
			maxMs * timeScale +
			500
		);
	}, [computedRows, timeScale, renderSettings, audioDurationMs]);

	/* -----------------------------
	 * Event handlers
	 * ----------------------------- */

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
	 * Sync audio and timeline
	 * ----------------------------- */
	useEffect(() => {
		const audio = audioPlayerRef.current;
		if (!audio) return;

		let animationFrameId = 0;

		const step = () => {
			setCurrentTime(audio.currentTime * 1000); // ms
			animationFrameId = requestAnimationFrame(step);
		};

		if (isPlaying) {
			audio.play();
			step(); // start smooth updates
		} else {
			audio.pause();
			cancelAnimationFrame(animationFrameId);
		}

		return () => cancelAnimationFrame(animationFrameId);
	}, [isPlaying]);

	useEffect(() => {
		if (!audioUrl) return;

		if (audioPlayerRef.current) {
			audioPlayerRef.current.src = audioUrl;
			audioPlayerRef.current.load();
			seekAudio(0);
		}
	}, [audioUrl]);

	useEffect(() => {
		if (!isPlaying) return;

		const playheadX =
			renderSettings.rowNameWidth +
			renderSettings.timelinePadding +
			currentTime * timeScale;

		if (playheadX - scrollX > canvasWidth * 0.8) {
			setScrollX(playheadX - canvasWidth * 0.8);
		}
		if (playheadX - scrollX < canvasWidth * 0.2) {
			setScrollX(Math.max(0, playheadX - canvasWidth * 0.2));
		}
	}, [
		currentTime,
		timeScale,
		canvasWidth,
		scrollX,
		renderSettings,
		isPlaying,
	]);

	/* -----------------------------
	 * Seek helper
	 * ----------------------------- */
	const seekAudio = (ms: number) => {
		if (!audioPlayerRef.current) return;
		audioPlayerRef.current.currentTime = ms / 1000;
		setCurrentTime(ms);
	};

	/* -----------------------------
	 * Render
	 * ----------------------------- */
	return (
		<div
			className="w-full h-full overflow-y-auto overflow-x-hidden relative"
			ref={containerRef}
		>
			<audio
				ref={audioPlayerRef}
				src={audioUrl || undefined}
				preload="auto"
			/>

			<div className="w-full p-2 bg-card sticky top-0 z-10 flex flex-row gap-2 flex-wrap">
				<Slider
					value={[timeScale]}
					onValueChange={(value) => setTimeScale(Number(value[0]))}
					min={0.04}
					max={1}
					step={0.01}
				/>

				<Button
					onClick={() => setIsPlaying((prev) => !prev)}
					size="icon"
				>
					{isPlaying ? <PauseIcon /> : <PlayIcon />}
				</Button>
				<p>Time Scale: {timeScale.toFixed(2)} px/ms</p>
				<p>Current Time: {(currentTime / 1000).toFixed(2)} s</p>

				<DebugMusicUpload setAudioUrl={setAudioUrl} />

				{/* Debug render settings */}
				<p className="mt-2 text-sm w-full font-bold">
					Render Settings:
				</p>

				<p className="mt-2 text-sm w-full">
					{JSON.stringify(renderSettings)}
				</p>
				<p className="mt-2 text-sm w-full">
					Timeline Width: {timelineWidth}px - Canvas Width:{" "}
					{canvasWidth}px, Canvas Height: {canvasHeight}px - ScrollX:{" "}
					{scrollX}px
				</p>
			</div>

			<Stage
				width={canvasWidth}
				height={canvasHeight}
				onWheel={(e) => {
					e.evt.preventDefault();
					const deltaX =
						e.evt.deltaX !== 0 ? e.evt.deltaX : e.evt.deltaY;
					setScrollX((prev) => {
						const next = prev + deltaX;
						const maxScroll = Math.max(
							0,
							timelineWidth - canvasWidth,
						);
						return Math.min(Math.max(0, next), maxScroll);
					});
				}}
			>
				<Layer>
					<Rect
						x={0}
						y={0}
						width={canvasWidth}
						height={canvasHeight}
						fill={renderSettings.backgroundColor}
						listening={false}
					/>
				</Layer>

				<Layer>
					<Group id="actual-timeline" x={-scrollX}>
						{/* Timeline ruler */}
						<TimelineRuler
							renderSettings={renderSettings}
							canvasWidth={timelineWidth}
							canvasHeight={canvasHeight}
							rowNameOffset={renderSettings.rowNameWidth}
							timeScale={timeScale}
							scrollX={scrollX}
							currentTime={currentTime}
							setCurrentTime={(newTime) => {
								setCurrentTime(newTime);
								seekAudio(newTime);
							}}
						/>

						{/* Keyframes */}
						{computedRows.map((row, rowIndex) => (
							<KeyframeRow
								key={row.id ?? row.title ?? rowIndex}
								row={row}
								y={rowOffsets[rowIndex]}
								settings={renderSettings}
								canvasWidth={canvasWidth}
								darkGridColor={darkGridColor}
								timeScale={timeScale}
							/>
						))}

						{/* Only render waveform for audio row */}
						{computedRows[0].isAudio && (
							<Waveform
								audioUrl={audioUrl || ""}
								timeScale={timeScale}
								renderSettings={{
									...renderSettings,
									rowHeight: renderSettings.rowHeight * 2,
								}}
								y={rowOffsets[0]}
							/>
						)}
					</Group>
				</Layer>

				{/* Row headers */}
				<Layer listening={false} perfectDrawEnabled={false}>
					<Rect
						x={0}
						y={0}
						width={renderSettings.rowNameWidth}
						height={renderSettings.rowHeight}
						fill={renderSettings.backgroundColor}
						listening={false}
					/>

					{computedRows.map((row, i) => (
						<RowHeader
							key={row.id ?? row.title ?? i}
							row={row}
							y={rowOffsets[i]}
							settings={renderSettings}
							canvasWidth={canvasWidth}
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
				height={settings.rowHeight * (row.isAudio ? 2 : 1) - 1}
				fill={settings.primaryColor}
				stroke={settings.primaryColor}
				strokeWidth={1}
				listening={false}
			/>
			<Text
				x={8}
				y={y + (settings.rowHeight * (row.isAudio ? 2 : 1)) / 2 - 7}
				text={row.title || row.id}
				fontSize={14}
				fill={settings.textColor}
				listening={false}
			/>

			{/* Add a bottom border to each row */}
			<Line
				points={[
					0,
					y + settings.rowHeight * (row.isAudio ? 2 : 1),
					canvasWidth,
					y + settings.rowHeight * (row.isAudio ? 2 : 1),
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
				height={settings.rowHeight * (row.isAudio ? 2 : 1)}
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

							setSelectedKeyframeIds((prev) => {
								if (prev?.includes(kf.id!)) {
									return prev.filter((id) => id !== kf.id);
								} else {
									return prev ? [...prev, kf.id!] : [kf.id!];
								}
							});
						}}
						draggable
						// onDragEnd={(e) => {
						// 	const newX = e.target.x();
						// 	// eslint-disable-next-line @typescript-eslint/no-unused-vars
						// 	const newVal =
						// 		(newX -
						// 			settings.rowNameWidth -
						// 			settings.timelinePadding) /
						// 		timeScale;
						// }}
						onDragMove={(e) => {
							const offsetX =
								settings.rowNameWidth +
								settings.timelinePadding;
							let newX = e.target.x();
							if (newX < offsetX) newX = offsetX;

							const rawValMs = (newX - offsetX) / timeScale;
							const snapMs = 50;
							const snappedValMs =
								Math.round(rawValMs / snapMs) * snapMs;
							let snappedX = offsetX + snappedValMs * timeScale;
							snappedX = Math.round(snappedX);

							e.target.x(snappedX);
							e.target.y(ky);
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
	y,
}: {
	audioUrl: string;
	timeScale: number;
	renderSettings: TimelineRenderSettings;
	y: number;
}) {
	const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

	useEffect(() => {
		let cancelled = false;
		setAudioBuffer(null);

		async function loadAudio() {
			if (!audioUrl) return;
			try {
				const response = await fetch(audioUrl);
				const arrayBuffer = await response.arrayBuffer();

				const ctx = new AudioContext();
				const decoded = await ctx.decodeAudioData(arrayBuffer);
				await ctx.close?.();
				if (!cancelled) setAudioBuffer(decoded);
			} catch {
				// ignore
			}
		}

		loadAudio();
		return () => {
			cancelled = true;
		};
	}, [audioUrl]);

	const points = useMemo(() => {
		if (!audioBuffer) return [];
		const { points } = buildWaveformPoints(
			audioBuffer,
			timeScale,
			renderSettings.rowHeight * 0.9,
		);
		return points;
	}, [audioBuffer, timeScale, renderSettings.rowHeight]);

	return (
		<Group listening={false} perfectDrawEnabled={false}>
			<Line
				x={renderSettings.rowNameWidth + renderSettings.timelinePadding}
				y={y + renderSettings.rowHeight * 0.05}
				points={points}
				stroke={renderSettings.keyframeColor}
				strokeWidth={1}
				listening={false}
			/>
		</Group>
	);
}

/* -----------------------------
 * Timeline Ruler Component
 * ----------------------------- */
function TimelineRuler({
	renderSettings,
	canvasWidth,
	canvasHeight,
	rowNameOffset,
	scrollX,
	timeScale,
	currentTime,
	setCurrentTime,
}: {
	renderSettings: TimelineRenderSettings;
	canvasWidth: number;
	canvasHeight: number;
	rowNameOffset: number;
	scrollX: number;
	timeScale: number;
	currentTime: number;
	setCurrentTime: (time: number) => void;
}) {
	return (
		<>
			<Group listening={true} perfectDrawEnabled={false}>
				<Rect
					x={rowNameOffset}
					y={0}
					width={canvasWidth}
					height={renderSettings.rowHeight}
					fill={renderSettings.primaryColor}
					stroke={renderSettings.primaryColor}
					strokeWidth={1}
					onClick={(e) => {
						const mouseX = e.evt.offsetX + scrollX;
						let newTime =
							(mouseX -
								rowNameOffset -
								renderSettings.timelinePadding) /
							timeScale;

						if (newTime < 0) newTime = 0;

						setCurrentTime(newTime);
					}}
				/>

				{/* Render time markers every second */}
				{Array.from({
					length: Math.ceil(canvasWidth / (timeScale * 1000)),
				}).map((_, index) => {
					const x =
						index * timeScale * 1000 +
						renderSettings.timelinePadding +
						rowNameOffset;
					return (
						<Group key={index}>
							<Line
								points={[
									x,
									renderSettings.rowHeight / 2,
									x,
									canvasHeight,
								]}
								stroke={renderSettings.textColor}
								strokeWidth={1}
								dash={[4, 6]}
							/>
							<Text
								x={x - 2}
								y={2}
								text={format(index * 1000, "mm:ss")}
								fontSize={14}
								fill={renderSettings.textColor}
								align="center"
							/>
						</Group>
					);
				})}

				{/* Sub time markers, every 0.2s */}
				{Array.from({
					length: Math.ceil(canvasWidth / (timeScale * 50)),
				}).map((_, index) => {
					const x =
						index * timeScale * 50 +
						renderSettings.timelinePadding +
						rowNameOffset;

					if (index % 20 === 0) {
						return null;
					}

					return (
						<Line
							key={index}
							points={[
								x,
								renderSettings.rowHeight * 0.75,
								x,
								renderSettings.rowHeight,
							]}
							stroke={renderSettings.textColor}
							strokeWidth={1}
						/>
					);
				})}
			</Group>
			{/* Playhead */}
			<Group listening={true} perfectDrawEnabled={false}>
				<Rect
					x={
						renderSettings.rowNameWidth +
						renderSettings.timelinePadding +
						currentTime * timeScale -
						2.5
					}
					y={renderSettings.rowHeight * 0.5}
					width={5}
					height={15}
					fill="red"
					onMouseEnter={(e) => {
						const container = e.target.getStage()?.container();
						if (container) {
							container.style.cursor = "w-resize";
						}
					}}
					onMouseLeave={(e) => {
						const container = e.target.getStage()?.container();
						if (container) {
							container.style.cursor = "default";
						}
					}}
					draggable
					onDragMove={(e) => {
						const offsetX =
							renderSettings.rowNameWidth +
							renderSettings.timelinePadding;
						let newX = e.target.x();
						if (newX < offsetX) newX = offsetX;

						const rawValMs = (newX - offsetX) / timeScale;
						const snapMs = 50;
						const snappedValMs =
							Math.round(rawValMs / snapMs) * snapMs;
						let snappedX = offsetX + snappedValMs * timeScale;
						snappedX = Math.round(snappedX);

						e.target.x(snappedX);
						e.target.y(renderSettings.rowHeight * 0.5);

						setCurrentTime(snappedValMs);
					}}
				/>
				<Line
					points={[
						renderSettings.rowNameWidth +
							renderSettings.timelinePadding +
							currentTime * timeScale,
						renderSettings.rowHeight * 0.8,
						renderSettings.rowNameWidth +
							renderSettings.timelinePadding +
							currentTime * timeScale,
						canvasHeight,
					]}
					stroke="red"
					strokeWidth={2}
				/>
			</Group>
		</>
	);
}

function DebugMusicUpload({
	setAudioUrl,
}: {
	setAudioUrl: (url: string | null) => void;
}) {
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const url = URL.createObjectURL(file);
			setAudioUrl(url);
		} else {
			setAudioUrl(null);
		}
	};

	return (
		<div>
			<Input type="file" accept="audio/*" onChange={handleFileChange} />
		</div>
	);
}

export default CanvasTimeline;
