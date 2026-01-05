/*
 *   Copyright (c) 2026 Foxxite | Articca
 *   All rights reserved.
 */

import type { TimelineRenderSettings } from "@/components/timeline/timelineTypes";
import { Group, Layer, Line, Rect, Text } from "react-konva";

import { format } from "date-fns";

function TimelineRuler({
	renderSettings,
	canvasWidth,
	canvasHeight,
	rowNameOffset,
	timeScale,
}: {
	renderSettings: TimelineRenderSettings;
	canvasWidth: number;
	canvasHeight: number;
	rowNameOffset: number;
	timeScale: number;
}) {
	return (
		<Layer>
			<Group>
				<Rect
					x={rowNameOffset}
					y={0}
					width={canvasWidth}
					height={renderSettings.rowHeight}
					fill={renderSettings.primaryColor}
					stroke={renderSettings.primaryColor}
					strokeWidth={1}
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
		</Layer>
	);
}

export default TimelineRuler;
