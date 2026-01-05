import {
	Timeline,
	type TimelineModel,
	type TimelineOptions,
	type TimelineRow,
	type TimelineRowStyle,
} from "animation-timeline-js";
import { useEffect, useRef, useState } from "react";

interface TimelineRowWithTitle extends TimelineRow {
	title?: string;
}

type ContainerProps = {
	rows: TimelineRowWithTitle[];
};

function ReactTimeline(props: ContainerProps) {
	const [_timeline, setTimeline] = useState<Timeline | null>(null);
	const [options, setOptions] = useState<TimelineOptions | null>(null);
	const [scrollHeight, setScrollHeight] = useState<number>();
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const [scrollContainerReady, setScrollContainerReady] =
		useState<boolean>(false);

	const [maxTrackNameWidth, setMaxTrackNameWidth] = useState<number>(20);

	useEffect(() => {
		// Calculate max track name width
		let maxWidth = 20; // Minimum width
		props.rows.forEach((row, index) => {
			const title = row.title || "Track " + index;
			const canvas = document.createElement("canvas");
			const context = canvas.getContext("2d");
			if (context) {
				context.font = "14px sans-serif";
				const metrics = context.measureText(title);
				const width = metrics.width + 20; // Padding
				if (width > maxWidth) {
					maxWidth = width;
				}
			}
		});
		setMaxTrackNameWidth(maxWidth);
	}, [props.rows]);

	useEffect(() => {
		// Init Timeline
		if (!_timeline) {
			const model = { rows: props.rows } as TimelineModel;
			const options = {
				id: "timeline",
				rowsStyle: {
					height: 35,
					marginBottom: 0,
				} as TimelineRowStyle,
			} as TimelineOptions;
			setOptions(options);
			const timeline = new Timeline(options, model);
			setTimeline(timeline);
			setScrollHeight(timeline?._scrollContainer?.scrollHeight);
		}

		// Functionality
		const sc = scrollContainerRef.current;
		let wheelHandler: ((e: WheelEvent) => void) | null = null;
		let keydownHandler: ((args: globalThis.KeyboardEvent) => void) | null =
			null;

		if (sc) {
			// Using the built in listener over Reacts onScroll
			// allows a workaround in being able to hide the left
			// scrollbar while maintaining functionality
			wheelHandler = (e: WheelEvent) => {
				_timeline?._handleWheelEvent(e);
			};
			sc.addEventListener("wheel", wheelHandler);

			_timeline?.onScroll((e) => {
				if (scrollContainerRef.current) {
					scrollContainerRef.current.scrollTop = e.scrollTop;
				}
			});
		}

		// Select all elements on key down
		if (_timeline) {
			keydownHandler = function (args: globalThis.KeyboardEvent) {
				// Ctrl + a
				if (
					args.key &&
					args.key.toLowerCase() === "a" &&
					_timeline._controlKeyPressed(args)
				) {
					_timeline.selectAllKeyframes();
					args.preventDefault();
				}
			};
			document.addEventListener("keydown", keydownHandler);
		}

		// Cleanup
		return () => {
			if (sc && wheelHandler) {
				sc.removeEventListener("wheel", wheelHandler);
			}
			if (keydownHandler) {
				document.removeEventListener("keydown", keydownHandler);
			}
		};
	}, [scrollContainerReady, _timeline, props.rows]);

	return (
		<>
			<div
				id="toolbar"
				className="w-full bg-card h-9 max-h-9 relative overflow-hidden flex items-center"
			>
				<p className="px-2 text-sm font-sans select-none">Timeline</p>
			</div>

			<div className="w-full flex h-full overflow-hidden">
				<div
					className="flex flex-col h-full"
					style={{ minWidth: maxTrackNameWidth }}
				>
					<div
						style={{
							minHeight: options?.rowsStyle?.height + "px",
							maxHeight: options?.rowsStyle?.height + "px",
							marginTop: "-5px",
						}}
						className="h-7.5"
						id="track-spacer"
					></div>

					<div
						ref={(ref) => {
							scrollContainerRef.current = ref;
							setScrollContainerReady(!!ref);
						}}
						className="overflow-y-auto"
						id="track-names"
					>
						<div style={{ minHeight: scrollHeight }}>
							{props.rows.map((row, index) => {
								return (
									<div
										key={index}
										className="px-2 text-sm flex items-center w-full font-sans select-none h-7.5 bg-card"
										style={{
											marginBottom:
												options?.rowsStyle
													?.marginBottom,
											minHeight:
												options?.rowsStyle?.height +
												"px",
											maxHeight:
												options?.rowsStyle?.height +
												"px",
										}}
									>
										{row.title || "Track " + index}
									</div>
								);
							})}
						</div>
					</div>
				</div>

				<div id={"timeline"} className="flex-1"></div>
			</div>
		</>
	);
}

export default ReactTimeline;
