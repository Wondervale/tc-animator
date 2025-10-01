import DraggableKeyframe from "@/components/timeline/DraggableKeyframe";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import React, { useCallback, useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

export type Keyframe = {
	id: string;
	time: number;
	value: number;
};

export type Track = {
	id: string;
	name: string;
	type: "animation" | "audio";
	keyframes?: Keyframe[];
	audioUrl?: string;
};

const tracksData: Track[] = [
	{
		id: "track3",
		name: "Audio",
		type: "audio",
		audioUrl: "./sample.mp3",
	},
	{
		id: "track1",
		name: "Position X",
		type: "animation",
		keyframes: [
			{ id: "kf1", time: 0, value: 0 },
			{ id: "kf2", time: 2, value: 100 },
		],
	},
	{
		id: "track2",
		name: "Opacity",
		type: "animation",
		keyframes: [
			{ id: "kf3", time: 1, value: 0 },
			{ id: "kf4", time: 3, value: 1 },
		],
	},
];

const Timeline: React.FC = () => {
	// --- Jump Playhead on Ruler or Waveform Click ---
	const LABEL_WIDTH = 100; // matches minmax(100px, 1fr) in gridTemplateColumns

	const [tracks, setTracks] = useState<Track[]>(tracksData);
	const [currentTime, setCurrentTime] = useState(0);
	const [zoom, setZoom] = useState(100);
	const [duration, setDuration] = useState(5);
	const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

	const waveformRef = useRef<HTMLDivElement>(null);
	const wavesurferRef = useRef<WaveSurfer | null>(null);
	const timelineScrollRef = useRef<HTMLDivElement>(null);

	// --- Smarter Zoom ---
	// zoom: px per second. At min zoom, 0.1s = 10% of timeline width. At max zoom, full track fits.
	const MIN_ZOOM = 20; // px per second
	const MAX_ZOOM = 400; // px per second

	// When zooming in, show more detail, when zooming out, show less detail
	const setSmartZoom = useCallback((factor: number) => {
		setZoom((z) => {
			let newZoom = z * factor;
			newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
			return newZoom;
		});
	}, []);

	// --- Timeline Jump ---
	const handleTimelineJump = (clientX: number) => {
		if (!timelineRef.current) return;
		const rect = timelineRef.current.getBoundingClientRect();
		let x = clientX - rect.left - LABEL_WIDTH;
		x = Math.max(0, x); // prevent negative
		let t = x / zoom;
		t = Math.max(0, Math.min(duration, t));
		setCurrentTime(t);
		if (wavesurferRef.current) {
			wavesurferRef.current.seekTo(t / duration);
		}
	};

	// --- Load Audio Waveform ---
	useEffect(() => {
		const audioTrack = tracks.find((t) => t.type === "audio");

		if (audioTrack?.audioUrl && waveformRef.current) {
			const waveColor =
				getComputedStyle(document.documentElement)
					.getPropertyValue("--waveform-color")
					.trim() || "#888";
			const progressColor =
				getComputedStyle(document.documentElement)
					.getPropertyValue("--waveform-progress-color")
					.trim() || "#f0f";

			wavesurferRef.current = WaveSurfer.create({
				container: waveformRef.current,
				waveColor,
				progressColor,
				height: 55,
				barWidth: 2,
				cursorColor: "transparent",
			});

			wavesurferRef.current.load(audioTrack.audioUrl);
			wavesurferRef.current.on("ready", () => {
				setDuration(wavesurferRef.current!.getDuration());
			});

			// @ts-expect-error: wavesurfer.js event type
			wavesurferRef.current.on("seek", (progress: number) => {
				setCurrentTime(progress * wavesurferRef.current!.getDuration());
			});

			wavesurferRef.current.on("audioprocess", () => {
				setCurrentTime(wavesurferRef.current!.getCurrentTime());
			});
		}

		return () => {
			wavesurferRef.current?.destroy();
			wavesurferRef.current = null;
		};
	}, [tracks]);

	// --- Keyframe Update ---
	const updateKeyframe = (
		trackId: string,
		keyframeId: string,
		time: number,
	) => {
		setTracks((prev) =>
			prev.map((t) =>
				t.id === trackId
					? {
							...t,
							keyframes: t.keyframes?.map((kf) =>
								kf.id === keyframeId ? { ...kf, time } : kf,
							),
						}
					: t,
			),
		);
	};

	// --- Play/Pause Controls ---
	const play = () => {
		if (!wavesurferRef.current) return;
		wavesurferRef.current.play();
	};

	const pause = () => {
		wavesurferRef.current?.pause();
	};

	// --- Playhead Drag ---
	const timelineRef = useRef<HTMLDivElement>(null);
	const handlePlayheadMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
		setIsDraggingPlayhead(true);
		e.preventDefault();
	};
	const handlePlayheadMouseMove = React.useCallback(
		(e: MouseEvent) => {
			if (!isDraggingPlayhead || !timelineRef.current) return;
			const rect = timelineRef.current.getBoundingClientRect();
			let x = e.clientX - rect.left - LABEL_WIDTH;
			x = Math.max(0, x); // prevent negative
			let t = x / zoom;
			t = Math.max(0, Math.min(duration, t));
			setCurrentTime(t);
			if (wavesurferRef.current) {
				wavesurferRef.current.seekTo(t / duration);
			}
		},
		[isDraggingPlayhead, zoom, duration],
	);

	const handlePlayheadMouseUp = () => {
		setIsDraggingPlayhead(false);
	};

	useEffect(() => {
		if (isDraggingPlayhead) {
			window.addEventListener("mousemove", handlePlayheadMouseMove);
			window.addEventListener("mouseup", handlePlayheadMouseUp);
		} else {
			window.removeEventListener("mousemove", handlePlayheadMouseMove);
			window.removeEventListener("mouseup", handlePlayheadMouseUp);
		}
		return () => {
			window.removeEventListener("mousemove", handlePlayheadMouseMove);
			window.removeEventListener("mouseup", handlePlayheadMouseUp);
		};
	}, [isDraggingPlayhead, zoom, duration, handlePlayheadMouseMove]);

	// --- Ruler ---
	const renderRuler = () => {
		// --- Evenly spaced ruler ---
		const labelMinSpacingPx = 40; // minimum px between labels
		const timelinePx = duration * zoom;

		// Calculate how many labels fit
		const numLabels = Math.floor(timelinePx / labelMinSpacingPx);

		// Step in seconds between labels
		let step = duration / numLabels;

		// Round step to nearest 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, etc for nice intervals
		const niceSteps = [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 50, 100];
		step = niceSteps.find((s) => s >= step) || step;

		// Recalculate numLabels with nice step
		const marks = [];
		for (let t = 0; t <= duration; t += step) {
			const leftPx = t * zoom;
			marks.push(
				<div
					key={t}
					className="absolute top-0 h-5 border-l border-border text-xs text-muted-foreground"
					style={{ left: `${leftPx}px`, width: 1 }}
				>
					<span className="absolute left-1 top-0">
						{t.toFixed(step < 1 ? 2 : 1)}s
					</span>
				</div>,
			);
		}

		// Add click handler to jump playhead
		return (
			<div
				className="relative h-5 w-full cursor-pointer"
				onClick={(e) => handleTimelineJump(e.clientX)}
			>
				{marks}
			</div>
		);
	};

	// --- Wheel Handler (native, passive: false) ---
	useEffect(() => {
		const el = timelineScrollRef.current;
		if (!el) return;
		const handleWheel = (e: WheelEvent) => {
			// Alt + Wheel: Zoom in/out
			if (e.altKey) {
				e.preventDefault();
				const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
				setSmartZoom(factor);
				return;
			}

			// Ctrl/Cmd + Wheel: Vertical scroll
			if (e.ctrlKey || e.metaKey) {
				e.preventDefault();
				el.scrollTop += e.deltaY;
				// Prevent browser zoom
				e.stopPropagation();
				return;
			}

			// Default: Horizontal scroll
			e.preventDefault();
			el.scrollLeft += e.deltaY;
		};
		el.addEventListener("wheel", handleWheel, { passive: false });
		return () => {
			el.removeEventListener("wheel", handleWheel);
		};
	}, [duration, zoom, currentTime, setSmartZoom]);

	return (
		<div className="flex flex-col w-full h-full space-y-2 bg-card">
			{/* Controls */}
			<div className="flex space-x-2 m-2">
				<Button onClick={play} variant="default">
					Play
				</Button>
				<Button onClick={pause} variant="destructive">
					Pause
				</Button>
				<Button onClick={() => setSmartZoom(1.2)}>Zoom In</Button>
				<Button onClick={() => setSmartZoom(1 / 1.2)}>Zoom Out</Button>

				<div className="flex items-center justify-center flex-1">
					<p className="text-sm text-muted-foreground">
						Current Time: {format(currentTime * 1000, "mm:ss.SS")} /{" "}
						{format(duration * 1000, "mm:ss.SS")}
					</p>
				</div>
			</div>

			{/* Timeline Grid Layout with horizontal scroll and sticky labels */}
			<div
				className="w-full flex-1 overflow-x-auto"
				style={{ position: "relative" }}
				ref={timelineScrollRef}
			>
				<div
					ref={timelineRef}
					className="grid w-full"
					style={{
						gridTemplateColumns: `minmax(100px, 1fr) ${duration * zoom}px`,
						gridTemplateRows: `24px repeat(${tracks.length}, 64px)`,
						position: "relative",
						minWidth: `${100 + duration * zoom}px`,
					}}
				>
					{/* Ruler Row */}
					<div
						className="h-6 sticky left-0 bg-card z-20"
						style={{ gridColumn: "1 / 2", gridRow: "1" }}
					/>
					<div
						className="relative border-b border-border bg-card-foreground/10"
						style={{
							gridColumn: "2 / 3",
							gridRow: "1",
							width: "100%",
							height: "24px",
						}}
					>
						{renderRuler()}
					</div>

					{/* Track Labels and Tracks */}
					{[...tracks]
						.sort((a, b) =>
							a.type === "audio"
								? -1
								: b.type === "audio"
									? 1
									: 0,
						)
						.map((track, idx) => (
							<React.Fragment key={track.id}>
								{/* Track Label (sticky) */}
								<div
									className="flex items-center h-16 px-2 border-b border-border text-xs text-muted-foreground sticky left-0 bg-card z-20"
									style={{
										gridColumn: "1 / 2",
										gridRow: `${idx + 2}`,
									}}
								>
									{track.name}
								</div>
								{/* Track Timeline */}
								<div
									className={
										track.type === "audio"
											? "relative h-16 border-b border-border flex items-center justify-center w-full cursor-pointer"
											: "relative h-16 border-b border-border flex items-center justify-center cursor-pointer"
									}
									style={{
										gridColumn: "2 / 3",
										gridRow: `${idx + 2}`,
										position: "relative",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
									onClick={(e) =>
										handleTimelineJump(e.clientX)
									}
								>
									{track.type === "audio" ? (
										<div
											ref={waveformRef}
											className="absolute left-0 w-full"
											style={{
												top: "50%",
												transform: "translateY(-50%)",
												height: "55px",
												pointerEvents: "none",
											}}
										/>
									) : (
										track.keyframes?.map((kf) => (
											<div
												key={kf.id}
												style={{
													position: "absolute",
													left: `${kf.time * zoom}px`,
													top: "50%",
													transform:
														"translateY(-50%)",
												}}
											>
												<DraggableKeyframe
													keyframe={kf}
													trackId={track.id}
													zoom={zoom}
													onUpdate={updateKeyframe}
												/>
											</div>
										))
									)}
								</div>
							</React.Fragment>
						))}

					{/* Playhead (absolute, only over tracks) */}
					<div
						className="absolute w-[2px] bg-primary cursor-ew-resize z-10 hover:bg-primary/80"
						style={{
							left: `${currentTime * zoom}px`,
							top: `24px`,
							height: `${tracks.length * 64}px`,
							gridColumn: "2 / 3",
						}}
						onMouseDown={handlePlayheadMouseDown}
					/>
				</div>
			</div>
		</div>
	);
};

export default Timeline;
