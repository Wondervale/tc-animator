import DraggableKeyframe from "@/components/timeline/DraggableKeyframe";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { PauseIcon, PlayIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import React, {
	type MouseEvent as ReactMouseEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
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

// --- Demo Data ---
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

// --- Constants ---
const LABEL_WIDTH = 100;
const ROW_HEIGHT = 64;
const HEADER_HEIGHT = 24;
const MIN_ZOOM = 20; // px/sec
const MAX_ZOOM = 400; // px/sec

const Timeline: React.FC = () => {
	const [tracks, setTracks] = useState<Track[]>(tracksData);
	const [currentTime, setCurrentTime] = useState(0);
	const [zoom, setZoom] = useState(100);
	const [duration, setDuration] = useState(5);
	const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	// Preference: zoom to mouse
	const [zoomToMouseEnabled, setZoomToMouseEnabled] = useState(true);

	const waveformRef = useRef<HTMLDivElement>(null);
	const wavesurferRef = useRef<WaveSurfer | null>(null);
	const timelineScrollRef = useRef<HTMLDivElement>(null);
	const timelineRef = useRef<HTMLDivElement>(null);

	// --- Smart Zoom ---
	const setSmartZoom = useCallback(
		(factor: number, anchorPx?: number) => {
			setZoom((prev) => {
				const oldZoom = prev;
				const newZoom = Math.max(
					MIN_ZOOM,
					Math.min(MAX_ZOOM, prev * factor),
				);

				if (!timelineScrollRef.current) return newZoom;
				const scrollEl = timelineScrollRef.current;
				if (zoomToMouseEnabled && anchorPx !== undefined) {
					// Adjust scroll so that point under cursor stays fixed
					const rect = scrollEl.getBoundingClientRect();
					const mouseX = anchorPx - rect.left - LABEL_WIDTH;
					// Clamp mouseX to timeline bounds
					const timelineWidth = duration * oldZoom;
					const clampedMouseX = Math.max(
						0,
						Math.min(mouseX, timelineWidth),
					);
					const timeAtMouse =
						(scrollEl.scrollLeft + clampedMouseX) / oldZoom;
					let newScrollLeft = timeAtMouse * newZoom - clampedMouseX;
					// Clamp scrollLeft to valid range
					const maxScroll = Math.max(
						0,
						duration * newZoom - scrollEl.clientWidth,
					);
					newScrollLeft = Math.max(
						0,
						Math.min(newScrollLeft, maxScroll),
					);
					scrollEl.scrollLeft = newScrollLeft;
				} else {
					// Just zoom, keep scroll centered
					const centerTime =
						(scrollEl.scrollLeft +
							scrollEl.clientWidth / 2 -
							LABEL_WIDTH) /
						oldZoom;
					let newScrollLeft =
						centerTime * newZoom -
						scrollEl.clientWidth / 2 +
						LABEL_WIDTH;
					const maxScroll = Math.max(
						0,
						duration * newZoom - scrollEl.clientWidth,
					);
					newScrollLeft = Math.max(
						0,
						Math.min(newScrollLeft, maxScroll),
					);
					scrollEl.scrollLeft = newScrollLeft;
				}
				return newZoom;
			});
		},
		[duration, zoomToMouseEnabled],
	);

	// --- Jump Playhead ---
	const jumpTo = (clientX: number) => {
		if (!timelineRef.current) return;
		const rect = timelineRef.current.getBoundingClientRect();
		let x = clientX - rect.left - LABEL_WIDTH;
		x = Math.max(0, x);
		let t = x / zoom;
		t = Math.max(0, Math.min(duration, t));
		setCurrentTime(t);
		wavesurferRef.current?.seekTo(t / duration);
	};

	// --- Load Waveform ---
	useEffect(() => {
		const audioTrack = tracks.find((t) => t.type === "audio");
		if (!audioTrack?.audioUrl || !waveformRef.current) return;

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
		wavesurferRef.current.on("ready", () =>
			setDuration(wavesurferRef.current!.getDuration()),
		);
		wavesurferRef.current.on("interaction", () =>
			setCurrentTime(wavesurferRef.current!.getCurrentTime()),
		);
		wavesurferRef.current.on("audioprocess", () =>
			setCurrentTime(wavesurferRef.current!.getCurrentTime()),
		);

		return () => {
			wavesurferRef.current?.destroy();
			wavesurferRef.current = null;
		};
	}, [tracks]);

	// --- Keep Playhead in View ---
	useEffect(() => {
		if (!isPlaying) return;

		const scrollEl = timelineScrollRef.current;
		if (!scrollEl) return;

		const playheadX = LABEL_WIDTH + currentTime * zoom;
		const visibleStart = scrollEl.scrollLeft + LABEL_WIDTH;
		const visibleEnd = visibleStart + scrollEl.clientWidth - LABEL_WIDTH;

		if (playheadX < visibleStart || playheadX > visibleEnd) {
			scrollEl.scrollLeft = playheadX - scrollEl.clientWidth / 2;
		}
	}, [currentTime, zoom, isPlaying]);

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

	// --- Play Controls ---
	const play = () => {
		if (!wavesurferRef.current) return;
		wavesurferRef.current.play();
	};

	const pause = () => {
		wavesurferRef.current?.pause();
	};

	useEffect(() => {
		if (!wavesurferRef.current) return;

		const handlePlay = () => setIsPlaying(true);
		const handlePause = () => setIsPlaying(false);
		const handleFinish = () => setIsPlaying(false);

		wavesurferRef.current.on("play", handlePlay);
		wavesurferRef.current.on("pause", handlePause);
		wavesurferRef.current.on("finish", handleFinish);

		return () => {
			wavesurferRef.current?.un("play", handlePlay);
			wavesurferRef.current?.un("pause", handlePause);
			wavesurferRef.current?.un("finish", handleFinish);
		};
	}, []);

	// --- Playhead Drag ---
	const onPlayheadDown = (e: ReactMouseEvent<HTMLDivElement>) => {
		setIsDraggingPlayhead(true);
		e.preventDefault();
	};
	const onPlayheadMove = useCallback(
		(e: MouseEvent) => {
			if (!isDraggingPlayhead || !timelineRef.current) return;
			const rect = timelineRef.current.getBoundingClientRect();
			let x = e.clientX - rect.left - LABEL_WIDTH;
			x = Math.max(0, x);
			let t = x / zoom;
			t = Math.max(0, Math.min(duration, t));
			setCurrentTime(t);
			wavesurferRef.current?.seekTo(t / duration);
		},
		[isDraggingPlayhead, zoom, duration],
	);
	useEffect(() => {
		if (isDraggingPlayhead) {
			window.addEventListener("mousemove", onPlayheadMove);
			window.addEventListener("mouseup", () =>
				setIsDraggingPlayhead(false),
			);
		}
		return () => {
			window.removeEventListener("mousemove", onPlayheadMove);
			window.removeEventListener("mouseup", () =>
				setIsDraggingPlayhead(false),
			);
		};
	}, [isDraggingPlayhead, onPlayheadMove]);

	// --- Wheel Handler ---
	useEffect(() => {
		const el = timelineScrollRef.current;
		if (!el) return;
		const handleWheel = (e: WheelEvent) => {
			if (e.altKey) {
				e.preventDefault();
				const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
				setSmartZoom(factor, e.clientX);
				return;
			}
			if (e.ctrlKey || e.metaKey) {
				e.preventDefault();
				el.scrollTop += e.deltaY;
				return;
			}
			e.preventDefault();
			el.scrollLeft += e.deltaY;
		};
		el.addEventListener("wheel", handleWheel, { passive: false });
		return () => el.removeEventListener("wheel", handleWheel);
	}, [setSmartZoom]);

	// --- Ruler ---
	const renderRuler = () => {
		const labelMinSpacingPx = 40;
		const timelinePx = duration * zoom;
		const numLabels = Math.floor(timelinePx / labelMinSpacingPx);
		let step = duration / numLabels;
		const niceSteps = [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 50, 100];
		step = niceSteps.find((s) => s >= step) || step;

		const marks = [];
		for (let t = 0; t <= duration; t += step) {
			marks.push(
				<div
					key={t}
					className="absolute top-0 h-5 border-l border-border text-xs text-muted-foreground"
					style={{ left: `${t * zoom}px` }}
				>
					<span className="absolute left-1 top-0">
						{t.toFixed(step < 1 ? 2 : 1)}s
					</span>
				</div>,
			);
		}
		return (
			<div
				className="relative h-5 w-full cursor-pointer"
				onClick={(e) => jumpTo(e.clientX)}
			>
				{marks}
			</div>
		);
	};

	return (
		<div className="flex flex-col w-full h-full space-y-2 bg-card">
			{/* Controls */}
			<div className="flex space-x-2 m-2">
				<Button onClick={isPlaying ? pause : play}>
					{isPlaying ? (
						<>
							<PauseIcon />
							Pause
						</>
					) : (
						<>
							<PlayIcon />
							Play
						</>
					)}
				</Button>
				<Button onClick={() => setSmartZoom(1.2)}>
					<ZoomInIcon /> Zoom In
				</Button>
				<Button onClick={() => setSmartZoom(1 / 1.2)}>
					<ZoomOutIcon /> Zoom Out
				</Button>

				<div className="flex items-center space-x-2">
					<label className="flex items-center text-xs select-none cursor-pointer">
						<input
							type="checkbox"
							checked={zoomToMouseEnabled}
							onChange={(e) =>
								setZoomToMouseEnabled(e.target.checked)
							}
							className="mr-1 accent-primary"
						/>
						<span>
							[EXPERIMENTAL] Zoom to mouse <kbd>Alt</kbd>+
							<kbd>Wheel</kbd>
						</span>
					</label>
				</div>
				<div className="flex-1 flex items-center justify-center">
					<p className="text-sm text-muted-foreground">
						{format(currentTime * 1000, "mm:ss.SS")} /{" "}
						{format(duration * 1000, "mm:ss.SS")}
					</p>
				</div>
			</div>

			{/* Timeline */}
			<div
				className="w-full flex-1 overflow-x-auto relative"
				ref={timelineScrollRef}
			>
				<div
					ref={timelineRef}
					className="grid w-full relative"
					style={{
						gridTemplateColumns: `minmax(${LABEL_WIDTH}px, 1fr) ${duration * zoom}px`,
						gridTemplateRows: `${HEADER_HEIGHT}px repeat(${tracks.length}, ${ROW_HEIGHT}px)`,
						minWidth: `${LABEL_WIDTH + duration * zoom}px`,
					}}
				>
					{/* Ruler */}
					<div
						className="h-6 sticky left-0 bg-card z-20"
						style={{ gridColumn: "1 / 2", gridRow: "1" }}
					/>
					<div
						className="relative border-b border-border bg-card-foreground/10"
						style={{ gridColumn: "2 / 3", gridRow: "1" }}
					>
						{renderRuler()}
					</div>

					{/* Tracks */}
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
								{/* Label */}
								<div
									className="flex items-center h-16 px-2 border-b border-border text-xs text-muted-foreground sticky left-0 bg-card z-20"
									style={{
										gridColumn: "1 / 2",
										gridRow: `${idx + 2}`,
									}}
								>
									{track.name}
								</div>
								{/* Content */}
								<div
									className="relative h-16 border-b border-border flex items-center justify-center cursor-pointer"
									style={{
										gridColumn: "2 / 3",
										gridRow: `${idx + 2}`,
									}}
									onClick={(e) => jumpTo(e.clientX)}
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

					{/* Playhead */}
					<div
						className="absolute w-[2px] bg-primary cursor-ew-resize z-10 hover:bg-primary/80"
						style={{
							left: `${LABEL_WIDTH + currentTime * zoom}px`, // ✅ offset by LABEL_WIDTH
							top: `${HEADER_HEIGHT}px`,
							height: `${tracks.length * ROW_HEIGHT}px`,
						}}
						onMouseDown={onPlayheadDown}
					/>
				</div>
			</div>
		</div>
	);
};

export default Timeline;
