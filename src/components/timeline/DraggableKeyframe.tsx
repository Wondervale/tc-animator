/*
 *   Copyright (c) 2025 Foxxite | Articca
 *   All rights reserved.
 */

import { useDrag } from "@use-gesture/react";
import { useEffect, useState } from "react";

import type { Keyframe } from "./Timeline";

export interface DraggableKeyframeProps {
	keyframe: Keyframe;
	trackId: string;
	zoom: number;
	onUpdate: (trackId: string, keyframeId: string, time: number) => void;
}

function DraggableKeyframe({
	keyframe,
	trackId,
	zoom,
	onUpdate,
}: DraggableKeyframeProps) {
	const [x, setX] = useState(keyframe.time * zoom);

	// Update position if keyframe or zoom changes
	useEffect(() => {
		setX(keyframe.time * zoom);
	}, [keyframe.time, zoom]);

	const bind = useDrag(
		({ movement: [mx], memo, first, last }) => {
			if (first) {
				memo = keyframe.time * zoom;
			}
			let newX = memo + mx;
			newX = Math.max(0, newX);
			const snappedTime = Math.round((newX / zoom) * 10) / 10;
			setX(snappedTime * zoom);
			if (last) {
				onUpdate(trackId, keyframe.id, snappedTime);
			}
			return memo;
		},
		{ filterTaps: true },
	);

	return (
		<div
			{...bind()}
			className="absolute top-2 w-4 h-4 bg-blue-500 rounded cursor-grab"
			style={{
				transform: `translateX(${x}px)`,
				transition: "transform 0.02s ease",
			}}
		/>
	);
}

export default DraggableKeyframe;
