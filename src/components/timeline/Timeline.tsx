import DraggableKeyframe from "@/components/timeline/DraggableKeyframe";
import { Button } from "@/components/ui/button";
import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
// import { cn } from "@/lib/utils";

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
	const [tracks, setTracks] = useState<Track[]>(tracksData);
	const [currentTime, setCurrentTime] = useState(0);
	const [zoom, setZoom] = useState(100);
	const [duration, setDuration] = useState(5);
	const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

	const waveformRef = useRef<HTMLDivElement>(null);
	const wavesurferRef = useRef<WaveSurfer | null>(null);
	// const intervalRef = useRef<number | null>(null);

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
				cursorColor: "#f00",
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
				if (!isDraggingPlayhead) {
					setCurrentTime(wavesurferRef.current!.getCurrentTime());
				}
			});
		}
		return () => {
			wavesurferRef.current?.destroy();
			wavesurferRef.current = null;
		};
	}, [tracks, isDraggingPlayhead]);

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
			const x = e.clientX - rect.left;
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
		// More detail at higher zoom, less at lower zoom
		let step: number;
		if (zoom >= 200) step = 0.1;
		else if (zoom >= 100) step = 0.25;
		else if (zoom >= 50) step = 0.5;
		else step = 1;
		const marks = [];
		for (let t = 0; t <= duration; t += step) {
			marks.push(
				<div
					key={t}
					className="absolute top-0 h-5 border-l border-border text-xs text-muted-foreground"
					style={{ left: `${t * zoom}px`, width: 1 }}
				>
					<span className="absolute left-1 top-0">
						{t.toFixed(2)}s
					</span>
				</div>,
			);
		}
		return <div className="relative h-5 w-full">{marks}</div>;
	};

	return (
		<div className="flex flex-col w-full h-full space-y-2 bg-card -m-4">
			{/* Controls */}
			<div className="flex space-x-2 m-2">
				<Button onClick={play} variant="default">
					Play
				</Button>
				<Button onClick={pause} variant="destructive">
					Pause
				</Button>
				<Button onClick={() => setZoom((z) => z * 1.2)}>Zoom In</Button>
				<Button onClick={() => setZoom((z) => Math.max(20, z / 1.2))}>
					Zoom Out
				</Button>
			</div>

			{/* Timeline Grid Layout */}
			<div
				ref={timelineRef}
				className="grid w-full flex-1"
				style={{
					gridTemplateColumns: `minmax(100px, 1fr) ${duration * zoom}px`,
					gridTemplateRows: `24px repeat(${tracks.length}, 64px)`, // 24px for ruler, 64px per track
					position: "relative",
				}}
			>
				{/* Ruler Row */}
				<div
					className="h-6"
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
						a.type === "audio" ? -1 : b.type === "audio" ? 1 : 0,
					)
					.map((track, idx) => (
						<React.Fragment key={track.id}>
							{/* Track Label */}
							<div
								className="flex items-center h-16 px-2 border-b border-border text-xs text-muted-foreground"
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
										? "relative h-16 border-b border-border flex items-center justify-center w-full"
										: "relative h-16 border-b border-border flex items-center justify-center"
								}
								style={{
									gridColumn: "2 / 3",
									gridRow: `${idx + 2}`,
									position: "relative",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
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
												transform: "translateY(-50%)",
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
					className="absolute w-[2px] bg-primary cursor-ew-resize z-10"
					style={{
						left: `${currentTime * zoom}px`,
						top: `24px`, // below ruler
						height: `${tracks.length * 64}px`, // only over tracks
						gridColumn: "2 / 3",
					}}
					onMouseDown={handlePlayheadMouseDown}
				/>
			</div>
		</div>
	);
};

export default Timeline;
