import {
	Timeline,
	type TimelineModel,
	type TimelineOptions,
	type TimelineRow,
	type TimelineRowStyle,
} from "animation-timeline-js";
import { useEffect, useState } from "react";

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
	const [scrollContainerDiv, setScrollContainerDiv] =
		useState<HTMLDivElement | null>();

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
		if (scrollContainerDiv) {
			// Using the built in listener over Reacts onScroll
			// allows a workaround in being able to hide the left
			// scrollbar while maintaining functionality
			scrollContainerDiv.addEventListener("wheel", (e) => {
				_timeline?._handleWheelEvent(e);
			});

			_timeline?.onScroll((e) => {
				scrollContainerDiv.scrollTop = e.scrollTop;
			});
		}

		// Select all elements on key down
		if (_timeline) {
			document.addEventListener("keydown", function (args) {
				// Ctrl + a || Ctrl + A
				if (
					(args.which === 65 || args.which === 97) &&
					_timeline._controlKeyPressed(args)
				) {
					_timeline.selectAllKeyframes();
					args.preventDefault();
				}
			});
		}

		// Logging
		// const logMessage = function (message: string, log = 1) {
		// 	if (message) {
		// 		let el = document.getElementById("output" + log);
		// 		if (el) {
		// 			el.innerHTML = message + "<br/>" + el.innerHTML;
		// 		}
		// 	}
		// };

		// const logDraggingMessage = function (object: any, eventName: string) {
		// 	if (object.elements) {
		// 		logMessage(
		// 			"Keyframe value: " +
		// 				object.elements[0].val +
		// 				". Selected (" +
		// 				object.elements.length +
		// 				")." +
		// 				eventName,
		// 		);
		// 	}
		// };

		// if (_timeline) {
		// 	_timeline.onTimeChanged(function (event) {
		// 		logMessage(event.val + "ms source:" + event.source, 2);
		// 	});
		// 	_timeline.onSelected(function (obj) {
		// 		logMessage(
		// 			"selected :" +
		// 				obj.selected.length +
		// 				". changed :" +
		// 				obj.changed.length,
		// 			2,
		// 		);
		// 	});
		// 	_timeline.onDragStarted(function (obj) {
		// 		logDraggingMessage(obj, "dragstarted");
		// 	});
		// 	_timeline.onDrag(function (obj) {
		// 		logDraggingMessage(obj, "drag");
		// 	});
		// 	_timeline.onKeyframeChanged(function (obj) {
		// 		console.log("keyframe: " + obj.val);
		// 	});
		// 	_timeline.onDragFinished(function (obj) {
		// 		logDraggingMessage(obj, "dragfinished");
		// 	});
		// 	_timeline.onMouseDown(function (obj) {
		// 		const type = obj.target ? obj.target.type : "";
		// 		logMessage("mousedown:" + obj.val + ".  elements:" + type, 2);
		// 	});
		// 	_timeline.onDoubleClick(function (obj) {
		// 		const type = obj.target ? obj.target.type : "";
		// 		logMessage("doubleclick:" + obj.val + ".  elements:" + type, 2);
		// 	});
		// }

		// Cleanup
		return () => {
			scrollContainerDiv?.removeEventListener("wheel", () => {});
			document.removeEventListener("keydown", function () {});
		};
	}, [scrollContainerDiv]);

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
						ref={(ref) => setScrollContainerDiv(ref)}
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
