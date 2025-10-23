import { useDrag } from "@use-gesture/react";
import { useRef } from "react";

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
	const ref = useRef<HTMLDivElement>(null);
	const xRef = useRef(keyframe.time * zoom);

	const bind = useDrag(({ movement: [mx], first, last }) => {
		if (first) xRef.current = keyframe.time * zoom;

		let newX = xRef.current + mx;
		newX = Math.max(0, newX);

		if (ref.current) {
			ref.current.style.transform = `translateX(${newX - keyframe.time * zoom}px)`;
		}

		if (last) {
			const snappedTime = Math.round((newX / zoom) * 10) / 10;
			onUpdate(trackId, keyframe.id, snappedTime);

			if (ref.current) {
				ref.current.style.transform = `translateX(0px)`;
			}
		}

		return xRef.current;
	});

	return (
		<div
			ref={ref}
			{...bind()}
			className="absolute top-1/2 w-4 h-4 bg-blue-500 rounded cursor-grab -translate-y-1/2"
			style={{
				transition: "transform 0.02s ease",
				left: `${keyframe.time * zoom}px`,
			}}
		/>
	);
}

export default DraggableKeyframe;
